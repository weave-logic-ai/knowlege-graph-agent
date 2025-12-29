/**
 * SOP Compliance Checker
 *
 * Checks project artifacts against AI-SDLC SOP requirements
 * and determines compliance status.
 *
 * @module sops/compliance-checker
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import {
  SOPDefinition,
  SOPRequirement,
  SOPAssessment,
  ComplianceStatus,
  IRBStatus,
  SOPCategory,
  SOPPriority,
} from './types.js';
import { getSOPById, getSOPsByCategory, getAllSOPs } from './registry.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('compliance-checker');

/**
 * Compliance check options
 */
export interface ComplianceCheckOptions {
  /** Project root directory */
  projectRoot: string;

  /** Documentation path relative to project root */
  docsPath?: string;

  /** SOPs to check (default: all applicable) */
  sopIds?: string[];

  /** Categories to include */
  categories?: SOPCategory[];

  /** Whether to perform deep analysis */
  deepAnalysis?: boolean;

  /** Assessor name */
  assessor?: string;

  /** Custom artifact patterns */
  artifactPatterns?: Record<string, string[]>;
}

/**
 * Evidence item found during checking
 */
export interface EvidenceItem {
  /** Requirement ID this evidence supports */
  requirementId: string;

  /** File path where evidence was found */
  filePath: string;

  /** Type of evidence */
  type: 'document' | 'code' | 'test' | 'config' | 'artifact';

  /** Description of the evidence */
  description: string;

  /** Confidence score (0-1) */
  confidence: number;

  /** Relevant excerpt from file */
  excerpt?: string;
}

/**
 * Result of a compliance check
 */
export interface ComplianceCheckResult {
  /** Whether check completed successfully */
  success: boolean;

  /** Project name */
  projectName: string;

  /** Check timestamp */
  checkedAt: Date;

  /** Assessments by SOP */
  assessments: SOPAssessment[];

  /** Evidence found */
  evidence: EvidenceItem[];

  /** Overall compliance score */
  overallScore: number;

  /** Summary by category */
  categoryScores: Record<SOPCategory, number>;

  /** Errors encountered */
  errors: string[];
}

/**
 * Default artifact patterns for detecting compliance evidence
 */
const DEFAULT_ARTIFACT_PATTERNS: Record<string, string[]> = {
  // Documentation artifacts
  'requirements': ['requirements.md', 'requirements.txt', 'REQUIREMENTS.md', 'specs/', 'requirements/'],
  'architecture': ['ARCHITECTURE.md', 'architecture/', 'design/', 'ADR-*.md', 'adr/'],
  'testing': ['tests/', '__tests__/', 'test/', '*.test.ts', '*.spec.ts', 'jest.config.*', 'vitest.config.*'],
  'security': ['SECURITY.md', 'security/', '.snyk', 'security-policy.md'],
  'ethics': ['ETHICS.md', 'ethics/', 'AI-ETHICS.md', 'bias-assessment.md'],
  'changelog': ['CHANGELOG.md', 'HISTORY.md', 'releases/'],
  'readme': ['README.md', 'README.txt', 'readme.md'],
  'license': ['LICENSE', 'LICENSE.md', 'LICENSE.txt'],
  'contributing': ['CONTRIBUTING.md', 'CONTRIBUTORS.md'],
  'code-of-conduct': ['CODE_OF_CONDUCT.md'],
  'ci-cd': ['.github/workflows/', '.gitlab-ci.yml', 'Jenkinsfile', '.circleci/'],
  'docker': ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
  'monitoring': ['monitoring/', 'observability/', 'metrics/', 'prometheus.yml'],
  'validation': ['validation/', 'schemas/', '*.schema.json', 'zod/', 'yup/'],
  'config-management': ['.env.example', 'config/', 'settings/', '*.config.js', '*.config.ts'],
  'data-management': ['data/', 'datasets/', 'migrations/', 'seeds/'],
  'model-cards': ['MODEL_CARD.md', 'model-card.md', 'model-cards/'],
  'api-docs': ['openapi.yaml', 'swagger.json', 'api/', 'API.md'],
  'privacy': ['PRIVACY.md', 'privacy-policy.md', 'data-protection.md'],
};

/**
 * Keyword patterns for detecting compliance in content
 */
const COMPLIANCE_KEYWORDS: Record<string, string[]> = {
  'requirements-definition': ['requirement', 'specification', 'user story', 'acceptance criteria', 'functional', 'non-functional'],
  'risk-assessment': ['risk', 'mitigation', 'threat', 'vulnerability', 'impact', 'likelihood'],
  'testing': ['test', 'coverage', 'unit test', 'integration test', 'e2e', 'regression'],
  'security': ['authentication', 'authorization', 'encryption', 'secure', 'vulnerability', 'audit'],
  'ethics': ['bias', 'fairness', 'ethical', 'responsible', 'transparency', 'accountability'],
  'monitoring': ['monitor', 'alert', 'metric', 'observability', 'logging', 'tracing'],
  'documentation': ['document', 'guide', 'manual', 'tutorial', 'reference'],
  'validation': ['validate', 'verify', 'check', 'assert', 'schema', 'constraint'],
  'privacy': ['privacy', 'gdpr', 'pii', 'data protection', 'consent', 'anonymization'],
  'governance': ['governance', 'policy', 'procedure', 'standard', 'compliance', 'audit'],
};

/**
 * Check compliance for a project against AI-SDLC SOPs
 */
export async function checkCompliance(
  options: ComplianceCheckOptions
): Promise<ComplianceCheckResult> {
  const {
    projectRoot,
    docsPath = 'docs',
    sopIds,
    categories,
    deepAnalysis = false,
    assessor = 'automated',
    artifactPatterns = DEFAULT_ARTIFACT_PATTERNS,
  } = options;

  logger.info('Starting compliance check', { projectRoot, docsPath });

  const result: ComplianceCheckResult = {
    success: true,
    projectName: basename(projectRoot),
    checkedAt: new Date(),
    assessments: [],
    evidence: [],
    overallScore: 0,
    categoryScores: {} as Record<SOPCategory, number>,
    errors: [],
  };

  try {
    // Determine which SOPs to check
    let sopsToCheck: SOPDefinition[] = [];

    if (sopIds && sopIds.length > 0) {
      // Check specific SOPs
      for (const id of sopIds) {
        const sop = getSOPById(id);
        if (sop) {
          sopsToCheck.push(sop);
        } else {
          result.errors.push(`SOP not found: ${id}`);
        }
      }
    } else if (categories && categories.length > 0) {
      // Check SOPs in specified categories
      for (const category of categories) {
        sopsToCheck.push(...getSOPsByCategory(category));
      }
    } else {
      // Check all SOPs
      sopsToCheck = getAllSOPs();
    }

    // Scan project for artifacts
    const projectArtifacts = scanProjectArtifacts(projectRoot, docsPath, artifactPatterns);
    logger.debug('Found project artifacts', { count: projectArtifacts.size });

    // Check each SOP
    for (const sop of sopsToCheck) {
      const assessment = await assessSOP(
        sop,
        projectRoot,
        docsPath,
        projectArtifacts,
        result.evidence,
        deepAnalysis,
        assessor
      );
      result.assessments.push(assessment);
    }

    // Calculate scores
    calculateScores(result);

    logger.info('Compliance check complete', {
      overallScore: result.overallScore,
      assessments: result.assessments.length,
      evidence: result.evidence.length,
    });

  } catch (error) {
    result.success = false;
    result.errors.push(String(error));
    logger.error(`Compliance check failed: ${String(error)}`);
  }

  return result;
}

/**
 * Scan project for artifacts that may indicate compliance
 */
function scanProjectArtifacts(
  projectRoot: string,
  docsPath: string,
  patterns: Record<string, string[]>
): Map<string, string[]> {
  const artifacts = new Map<string, string[]>();

  for (const [category, filePatterns] of Object.entries(patterns)) {
    const found: string[] = [];

    for (const pattern of filePatterns) {
      // Check in project root
      const rootPath = join(projectRoot, pattern);
      if (existsSync(rootPath)) {
        found.push(rootPath);
      }

      // Check in docs path
      const docsFullPath = join(projectRoot, docsPath, pattern);
      if (existsSync(docsFullPath)) {
        found.push(docsFullPath);
      }
    }

    if (found.length > 0) {
      artifacts.set(category, found);
    }
  }

  return artifacts;
}

/**
 * Assess a single SOP against project
 */
async function assessSOP(
  sop: SOPDefinition,
  projectRoot: string,
  docsPath: string,
  projectArtifacts: Map<string, string[]>,
  evidenceList: EvidenceItem[],
  deepAnalysis: boolean,
  assessor: string
): Promise<SOPAssessment> {
  const requirementsMet: string[] = [];
  const requirementsGaps: string[] = [];
  const evidence: Record<string, string> = {};

  // Check each requirement
  for (const requirement of sop.requirements) {
    const { met, evidenceFound } = checkRequirement(
      requirement,
      projectRoot,
      docsPath,
      projectArtifacts,
      deepAnalysis
    );

    if (met) {
      requirementsMet.push(requirement.id);
      if (evidenceFound) {
        evidence[requirement.id] = evidenceFound.filePath;
        evidenceList.push(evidenceFound);
      }
    } else {
      requirementsGaps.push(requirement.id);
    }
  }

  // Calculate score
  const totalRequirements = sop.requirements.length;
  const mandatoryRequirements = sop.requirements.filter(r => r.mandatory);
  const mandatoryMet = mandatoryRequirements.filter(r => requirementsMet.includes(r.id));

  let score = 0;
  if (totalRequirements > 0) {
    // Weight mandatory requirements more heavily
    const mandatoryWeight = 0.7;
    const optionalWeight = 0.3;

    const mandatoryScore = mandatoryRequirements.length > 0
      ? (mandatoryMet.length / mandatoryRequirements.length) * 100
      : 100;

    const optionalRequirements = sop.requirements.filter(r => !r.mandatory);
    const optionalMet = optionalRequirements.filter(r => requirementsMet.includes(r.id));
    const optionalScore = optionalRequirements.length > 0
      ? (optionalMet.length / optionalRequirements.length) * 100
      : 100;

    score = Math.round(mandatoryScore * mandatoryWeight + optionalScore * optionalWeight);
  }

  // Determine status
  let status: ComplianceStatus;
  if (score >= 90) {
    status = ComplianceStatus.COMPLIANT;
  } else if (score >= 50) {
    status = ComplianceStatus.PARTIAL;
  } else if (score > 0) {
    status = ComplianceStatus.NON_COMPLIANT;
  } else {
    status = ComplianceStatus.PENDING;
  }

  // Determine IRB status
  let irbStatus: IRBStatus = IRBStatus.NOT_REQUIRED;
  if (sop.irbTypicallyRequired) {
    irbStatus = IRBStatus.PENDING;
    // Check for IRB approval artifacts
    const irbArtifacts = projectArtifacts.get('ethics') || [];
    if (irbArtifacts.length > 0) {
      irbStatus = IRBStatus.IN_REVIEW;
    }
  }

  return {
    sopId: sop.id,
    status,
    score,
    requirementsMet,
    requirementsGaps,
    evidence,
    irbStatus,
    assessedAt: new Date(),
    assessedBy: assessor,
    notes: `Automated assessment: ${requirementsMet.length}/${totalRequirements} requirements met`,
  };
}

/**
 * Check if a specific requirement is met
 */
function checkRequirement(
  requirement: SOPRequirement,
  projectRoot: string,
  docsPath: string,
  projectArtifacts: Map<string, string[]>,
  deepAnalysis: boolean
): { met: boolean; evidenceFound?: EvidenceItem } {
  // Check for artifacts that match the requirement
  for (const artifactType of requirement.artifacts || []) {
    const artifacts = projectArtifacts.get(artifactType);
    if (artifacts && artifacts.length > 0) {
      // Found matching artifact
      const evidenceItem: EvidenceItem = {
        requirementId: requirement.id,
        filePath: artifacts[0],
        type: categorizeArtifact(artifacts[0]),
        description: `Found ${artifactType} artifact: ${basename(artifacts[0])}`,
        confidence: 0.8,
      };

      // Deep analysis: check content for keywords
      if (deepAnalysis) {
        const contentMatch = checkContentForRequirement(artifacts[0], requirement);
        if (contentMatch) {
          evidenceItem.confidence = 0.95;
          evidenceItem.excerpt = contentMatch;
        }
      }

      return { met: true, evidenceFound: evidenceItem };
    }
  }

  // Check based on verification method
  switch (requirement.verification) {
    case 'document':
      return checkDocumentEvidence(requirement, projectRoot, docsPath, projectArtifacts, deepAnalysis);
    case 'test':
      return checkTestEvidence(requirement, projectRoot, projectArtifacts);
    case 'automated':
      return checkAutomatedEvidence(requirement, projectRoot, projectArtifacts);
    case 'review':
    case 'audit':
      // These require manual verification
      return { met: false };
    default:
      return { met: false };
  }
}

/**
 * Check for document-based evidence
 */
function checkDocumentEvidence(
  requirement: SOPRequirement,
  projectRoot: string,
  docsPath: string,
  projectArtifacts: Map<string, string[]>,
  deepAnalysis: boolean
): { met: boolean; evidenceFound?: EvidenceItem } {
  // Look for documentation files
  const docPatterns = ['readme', 'requirements', 'architecture', 'api-docs'];

  for (const pattern of docPatterns) {
    const artifacts = projectArtifacts.get(pattern);
    if (artifacts && artifacts.length > 0) {
      for (const artifact of artifacts) {
        if (deepAnalysis) {
          const contentMatch = checkContentForRequirement(artifact, requirement);
          if (contentMatch) {
            return {
              met: true,
              evidenceFound: {
                requirementId: requirement.id,
                filePath: artifact,
                type: 'document',
                description: `Found documentation evidence in ${basename(artifact)}`,
                confidence: 0.85,
                excerpt: contentMatch,
              },
            };
          }
        }
      }
    }
  }

  return { met: false };
}

/**
 * Check for test-based evidence
 */
function checkTestEvidence(
  requirement: SOPRequirement,
  projectRoot: string,
  projectArtifacts: Map<string, string[]>
): { met: boolean; evidenceFound?: EvidenceItem } {
  const testArtifacts = projectArtifacts.get('testing');

  if (testArtifacts && testArtifacts.length > 0) {
    return {
      met: true,
      evidenceFound: {
        requirementId: requirement.id,
        filePath: testArtifacts[0],
        type: 'test',
        description: `Test infrastructure found: ${basename(testArtifacts[0])}`,
        confidence: 0.7,
      },
    };
  }

  return { met: false };
}

/**
 * Check for automated/CI evidence
 */
function checkAutomatedEvidence(
  requirement: SOPRequirement,
  projectRoot: string,
  projectArtifacts: Map<string, string[]>
): { met: boolean; evidenceFound?: EvidenceItem } {
  const ciArtifacts = projectArtifacts.get('ci-cd');

  if (ciArtifacts && ciArtifacts.length > 0) {
    return {
      met: true,
      evidenceFound: {
        requirementId: requirement.id,
        filePath: ciArtifacts[0],
        type: 'config',
        description: `CI/CD configuration found: ${basename(ciArtifacts[0])}`,
        confidence: 0.75,
      },
    };
  }

  return { met: false };
}

/**
 * Check file content for requirement keywords
 */
function checkContentForRequirement(
  filePath: string,
  requirement: SOPRequirement
): string | null {
  try {
    const stat = statSync(filePath);
    if (stat.isDirectory()) return null;

    // Only check text files
    const ext = extname(filePath).toLowerCase();
    const textExtensions = ['.md', '.txt', '.ts', '.js', '.json', '.yaml', '.yml', '.html', '.rst'];
    if (!textExtensions.includes(ext)) return null;

    const content = readFileSync(filePath, 'utf-8');
    const lowerContent = content.toLowerCase();
    const lowerDesc = requirement.description.toLowerCase();

    // Check for keywords from requirement description
    const keywords = lowerDesc.split(/\s+/).filter(w => w.length > 4);
    let matchCount = 0;
    let matchedLine = '';

    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        matchCount++;
        // Find the line containing this keyword
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.toLowerCase().includes(keyword) && line.length < 200) {
            matchedLine = line.trim();
            break;
          }
        }
      }
    }

    // If at least 30% of keywords match, consider it evidence
    if (matchCount >= keywords.length * 0.3 && matchedLine) {
      return matchedLine;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Categorize an artifact by its type
 */
function categorizeArtifact(filePath: string): 'document' | 'code' | 'test' | 'config' | 'artifact' {
  const ext = extname(filePath).toLowerCase();
  const name = basename(filePath).toLowerCase();

  if (['.md', '.txt', '.rst', '.html'].includes(ext)) {
    return 'document';
  }
  if (['.ts', '.js', '.py', '.java', '.go', '.rs'].includes(ext)) {
    if (name.includes('test') || name.includes('spec')) {
      return 'test';
    }
    return 'code';
  }
  if (['.json', '.yaml', '.yml', '.toml', '.ini'].includes(ext)) {
    return 'config';
  }
  return 'artifact';
}

/**
 * Calculate overall scores from assessments
 */
function calculateScores(result: ComplianceCheckResult): void {
  if (result.assessments.length === 0) {
    result.overallScore = 0;
    return;
  }

  // Calculate category scores
  const categoryTotals: Record<SOPCategory, { sum: number; count: number }> = {
    [SOPCategory.PROGRAM_MANAGEMENT]: { sum: 0, count: 0 },
    [SOPCategory.OPERATIONS]: { sum: 0, count: 0 },
    [SOPCategory.DEVELOPMENT]: { sum: 0, count: 0 },
    [SOPCategory.GOVERNANCE]: { sum: 0, count: 0 },
    [SOPCategory.QUALITY]: { sum: 0, count: 0 },
  };

  for (const assessment of result.assessments) {
    const sop = getSOPById(assessment.sopId);
    if (sop) {
      categoryTotals[sop.category].sum += assessment.score;
      categoryTotals[sop.category].count += 1;
    }
  }

  // Calculate category averages
  for (const category of Object.values(SOPCategory)) {
    const totals = categoryTotals[category];
    result.categoryScores[category] = totals.count > 0
      ? Math.round(totals.sum / totals.count)
      : 0;
  }

  // Calculate overall score (weighted by priority)
  let weightedSum = 0;
  let totalWeight = 0;

  for (const assessment of result.assessments) {
    const sop = getSOPById(assessment.sopId);
    if (sop) {
      const weight = getPriorityWeight(sop.priority);
      weightedSum += assessment.score * weight;
      totalWeight += weight;
    }
  }

  result.overallScore = totalWeight > 0
    ? Math.round(weightedSum / totalWeight)
    : 0;
}

/**
 * Get weight for priority level
 */
function getPriorityWeight(priority: SOPPriority): number {
  switch (priority) {
    case SOPPriority.CRITICAL:
      return 4;
    case SOPPriority.HIGH:
      return 3;
    case SOPPriority.MEDIUM:
      return 2;
    case SOPPriority.LOW:
      return 1;
    default:
      return 1;
  }
}

/**
 * Quick check for a specific SOP
 */
export async function checkSOPCompliance(
  sopId: string,
  projectRoot: string,
  docsPath: string = 'docs'
): Promise<SOPAssessment | null> {
  const result = await checkCompliance({
    projectRoot,
    docsPath,
    sopIds: [sopId],
  });

  return result.assessments[0] || null;
}

/**
 * Check if project meets minimum compliance threshold
 */
export async function meetsMinimumCompliance(
  projectRoot: string,
  threshold: number = 50,
  categories?: SOPCategory[]
): Promise<{ meets: boolean; score: number; gaps: string[] }> {
  const result = await checkCompliance({
    projectRoot,
    categories,
  });

  const gaps = result.assessments
    .filter(a => a.score < threshold)
    .map(a => a.sopId);

  return {
    meets: result.overallScore >= threshold,
    score: result.overallScore,
    gaps,
  };
}
