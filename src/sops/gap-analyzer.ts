/**
 * SOP Gap Analyzer
 *
 * Analyzes compliance gaps and generates remediation recommendations.
 *
 * @module sops/gap-analyzer
 */

import {
  SOPDefinition,
  SOPRequirement,
  SOPAssessment,
  ComplianceGap,
  ComplianceStatus,
  SOPPriority,
  SOPCategory,
} from './types.js';
import { getSOPById, getAllSOPs, getSOPsByCategory } from './registry.js';
import { ComplianceCheckResult } from './compliance-checker.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('gap-analyzer');

/**
 * Gap analysis options
 */
export interface GapAnalysisOptions {
  /** Minimum score threshold to consider compliant */
  complianceThreshold?: number;

  /** Include SOPs with partial compliance */
  includePartial?: boolean;

  /** Filter by priority */
  minPriority?: SOPPriority;

  /** Filter by category */
  categories?: SOPCategory[];

  /** Generate remediation plans */
  generateRemediation?: boolean;
}

/**
 * Gap analysis result
 */
export interface GapAnalysisResult {
  /** All identified gaps */
  gaps: ComplianceGap[];

  /** Gaps grouped by priority */
  byPriority: Record<SOPPriority, ComplianceGap[]>;

  /** Gaps grouped by category */
  byCategory: Record<SOPCategory, ComplianceGap[]>;

  /** Total gap count */
  totalGaps: number;

  /** Critical gaps that need immediate attention */
  criticalGaps: ComplianceGap[];

  /** Summary statistics */
  summary: GapSummary;

  /** Remediation roadmap */
  roadmap?: RemediationRoadmap;
}

/**
 * Gap summary statistics
 */
export interface GapSummary {
  /** Total requirements checked */
  totalRequirements: number;

  /** Requirements met */
  requirementsMet: number;

  /** Requirements with gaps */
  requirementsGaps: number;

  /** Compliance percentage */
  compliancePercentage: number;

  /** Effort estimate (total) */
  totalEffort: {
    low: number;
    medium: number;
    high: number;
  };

  /** Estimated remediation complexity */
  overallComplexity: 'low' | 'medium' | 'high';
}

/**
 * Remediation roadmap
 */
export interface RemediationRoadmap {
  /** Phases of remediation */
  phases: RemediationPhase[];

  /** Quick wins (low effort, high impact) */
  quickWins: ComplianceGap[];

  /** Dependencies between gaps */
  dependencies: GapDependency[];
}

/**
 * Remediation phase
 */
export interface RemediationPhase {
  /** Phase number */
  phase: number;

  /** Phase name */
  name: string;

  /** Gaps to address in this phase */
  gaps: ComplianceGap[];

  /** Focus area */
  focus: string;

  /** Expected effort */
  effort: 'low' | 'medium' | 'high';
}

/**
 * Gap dependency
 */
export interface GapDependency {
  /** Gap that depends on another */
  gapId: string;

  /** Gap that must be addressed first */
  dependsOn: string;

  /** Reason for dependency */
  reason: string;
}

/**
 * Remediation templates for common gaps
 */
const REMEDIATION_TEMPLATES: Record<string, string> = {
  'requirements-definition': 'Create a requirements document using the provided template. Include functional requirements, non-functional requirements, and acceptance criteria for each feature.',
  'architecture-documentation': 'Document the system architecture using C4 diagrams or similar notation. Include system context, containers, components, and deployment views.',
  'testing-infrastructure': 'Set up a comprehensive test suite including unit tests, integration tests, and end-to-end tests. Aim for at least 80% code coverage.',
  'security-assessment': 'Conduct a security assessment including threat modeling, vulnerability scanning, and penetration testing. Document findings and remediation steps.',
  'bias-fairness-assessment': 'Perform a bias and fairness assessment of AI/ML models. Document potential biases, mitigation strategies, and ongoing monitoring plans.',
  'monitoring-setup': 'Implement comprehensive monitoring including metrics collection, alerting, and dashboards. Cover application health, performance, and business metrics.',
  'documentation': 'Create or update documentation including README, API documentation, deployment guides, and operational runbooks.',
  'ci-cd-pipeline': 'Set up CI/CD pipelines including automated testing, security scanning, and deployment automation.',
  'data-governance': 'Establish data governance policies including data classification, retention, access controls, and privacy compliance.',
  'change-management': 'Implement change management processes including code review, approval workflows, and rollback procedures.',
  'incident-response': 'Create incident response procedures including escalation paths, communication templates, and post-mortem processes.',
  'risk-management': 'Conduct risk assessment and create risk register with mitigation strategies and ownership assignments.',
};

/**
 * Effort estimation factors
 */
const EFFORT_FACTORS: Record<string, 'low' | 'medium' | 'high'> = {
  'document': 'low',
  'test': 'medium',
  'review': 'medium',
  'audit': 'high',
  'automated': 'high',
};

/**
 * Analyze compliance gaps from check results
 */
export function analyzeGaps(
  checkResult: ComplianceCheckResult,
  options: GapAnalysisOptions = {}
): GapAnalysisResult {
  const {
    complianceThreshold = 90,
    includePartial = true,
    minPriority,
    categories,
    generateRemediation = true,
  } = options;

  logger.info('Analyzing compliance gaps', {
    assessments: checkResult.assessments.length,
    threshold: complianceThreshold,
  });

  const gaps: ComplianceGap[] = [];
  let gapIdCounter = 1;

  // Process each assessment
  for (const assessment of checkResult.assessments) {
    // Skip if above threshold
    if (assessment.score >= complianceThreshold) continue;

    // Skip partial if not included
    if (!includePartial && assessment.status === ComplianceStatus.PARTIAL) continue;

    const sop = getSOPById(assessment.sopId);
    if (!sop) continue;

    // Filter by priority
    if (minPriority && !isPriorityAtLeast(sop.priority, minPriority)) continue;

    // Filter by category
    if (categories && !categories.includes(sop.category)) continue;

    // Create gap for each unmet requirement
    for (const reqId of assessment.requirementsGaps) {
      const requirement = sop.requirements.find(r => r.id === reqId);
      if (!requirement) continue;

      const gap = createGap(
        `gap-${gapIdCounter++}`,
        sop,
        requirement,
        assessment
      );
      gaps.push(gap);
    }
  }

  // Group by priority and category
  const byPriority = groupByPriority(gaps);
  const byCategory = groupByCategory(gaps);

  // Identify critical gaps
  const criticalGaps = gaps.filter(g => g.priority === SOPPriority.CRITICAL);

  // Calculate summary
  const summary = calculateSummary(checkResult, gaps);

  // Generate roadmap if requested
  let roadmap: RemediationRoadmap | undefined;
  if (generateRemediation) {
    roadmap = generateRemediationRoadmap(gaps, byPriority);
  }

  logger.info('Gap analysis complete', {
    totalGaps: gaps.length,
    criticalGaps: criticalGaps.length,
    compliancePercentage: summary.compliancePercentage,
  });

  return {
    gaps,
    byPriority,
    byCategory,
    totalGaps: gaps.length,
    criticalGaps,
    summary,
    roadmap,
  };
}

/**
 * Create a compliance gap object
 */
function createGap(
  id: string,
  sop: SOPDefinition,
  requirement: SOPRequirement,
  assessment: SOPAssessment
): ComplianceGap {
  const effort = EFFORT_FACTORS[requirement.verification] || 'medium';
  const remediation = generateRemediation(sop, requirement);

  return {
    id,
    sopId: sop.id,
    requirementId: requirement.id,
    description: `${sop.title}: ${requirement.description}`,
    priority: requirement.mandatory ? sop.priority : lowerPriority(sop.priority),
    impact: generateImpactDescription(sop, requirement),
    remediation,
    effort,
    status: 'open',
    createdAt: new Date(),
  };
}

/**
 * Generate remediation recommendation
 */
function generateRemediation(sop: SOPDefinition, requirement: SOPRequirement): string {
  // Check for template match
  for (const [key, template] of Object.entries(REMEDIATION_TEMPLATES)) {
    if (sop.id.toLowerCase().includes(key) ||
        requirement.description.toLowerCase().includes(key)) {
      return template;
    }
  }

  // Generate based on verification method
  switch (requirement.verification) {
    case 'document':
      return `Create documentation to address: ${requirement.description}. Required evidence: ${requirement.evidence.join(', ')}.`;
    case 'test':
      return `Implement tests to verify: ${requirement.description}. Ensure tests cover the specified acceptance criteria.`;
    case 'review':
      return `Schedule a review meeting to assess: ${requirement.description}. Document findings and action items.`;
    case 'audit':
      return `Conduct an audit to verify: ${requirement.description}. Create audit trail and compliance report.`;
    case 'automated':
      return `Implement automated checks for: ${requirement.description}. Integrate into CI/CD pipeline.`;
    default:
      return `Address requirement: ${requirement.description}`;
  }
}

/**
 * Generate impact description
 */
function generateImpactDescription(sop: SOPDefinition, requirement: SOPRequirement): string {
  const impacts: string[] = [];

  if (requirement.mandatory) {
    impacts.push('This is a mandatory requirement');
  }

  switch (sop.category) {
    case SOPCategory.GOVERNANCE:
      impacts.push('May affect regulatory compliance and audit readiness');
      break;
    case SOPCategory.DEVELOPMENT:
      impacts.push('May impact code quality and maintainability');
      break;
    case SOPCategory.OPERATIONS:
      impacts.push('May affect system reliability and operations');
      break;
    case SOPCategory.QUALITY:
      impacts.push('May impact overall quality assurance');
      break;
    case SOPCategory.PROGRAM_MANAGEMENT:
      impacts.push('May affect project governance and tracking');
      break;
  }

  if (sop.irbTypicallyRequired) {
    impacts.push('AI-IRB review may be required');
  }

  return impacts.join('. ');
}

/**
 * Group gaps by priority
 */
function groupByPriority(gaps: ComplianceGap[]): Record<SOPPriority, ComplianceGap[]> {
  const result: Record<SOPPriority, ComplianceGap[]> = {
    [SOPPriority.CRITICAL]: [],
    [SOPPriority.HIGH]: [],
    [SOPPriority.MEDIUM]: [],
    [SOPPriority.LOW]: [],
  };

  for (const gap of gaps) {
    result[gap.priority].push(gap);
  }

  return result;
}

/**
 * Group gaps by category
 */
function groupByCategory(gaps: ComplianceGap[]): Record<SOPCategory, ComplianceGap[]> {
  const result: Record<SOPCategory, ComplianceGap[]> = {
    [SOPCategory.PROGRAM_MANAGEMENT]: [],
    [SOPCategory.OPERATIONS]: [],
    [SOPCategory.DEVELOPMENT]: [],
    [SOPCategory.GOVERNANCE]: [],
    [SOPCategory.QUALITY]: [],
  };

  for (const gap of gaps) {
    const sop = getSOPById(gap.sopId);
    if (sop) {
      result[sop.category].push(gap);
    }
  }

  return result;
}

/**
 * Calculate gap summary
 */
function calculateSummary(
  checkResult: ComplianceCheckResult,
  gaps: ComplianceGap[]
): GapSummary {
  let totalRequirements = 0;
  let requirementsMet = 0;

  for (const assessment of checkResult.assessments) {
    totalRequirements += assessment.requirementsMet.length + assessment.requirementsGaps.length;
    requirementsMet += assessment.requirementsMet.length;
  }

  const requirementsGaps = totalRequirements - requirementsMet;
  const compliancePercentage = totalRequirements > 0
    ? Math.round((requirementsMet / totalRequirements) * 100)
    : 0;

  // Count effort levels
  const totalEffort = {
    low: gaps.filter(g => g.effort === 'low').length,
    medium: gaps.filter(g => g.effort === 'medium').length,
    high: gaps.filter(g => g.effort === 'high').length,
  };

  // Determine overall complexity
  let overallComplexity: 'low' | 'medium' | 'high';
  if (totalEffort.high > gaps.length * 0.3 || gaps.length > 20) {
    overallComplexity = 'high';
  } else if (totalEffort.medium > gaps.length * 0.5 || gaps.length > 10) {
    overallComplexity = 'medium';
  } else {
    overallComplexity = 'low';
  }

  return {
    totalRequirements,
    requirementsMet,
    requirementsGaps,
    compliancePercentage,
    totalEffort,
    overallComplexity,
  };
}

/**
 * Generate remediation roadmap
 */
function generateRemediationRoadmap(
  gaps: ComplianceGap[],
  byPriority: Record<SOPPriority, ComplianceGap[]>
): RemediationRoadmap {
  const phases: RemediationPhase[] = [];
  const dependencies: GapDependency[] = [];

  // Phase 1: Critical gaps
  if (byPriority[SOPPriority.CRITICAL].length > 0) {
    phases.push({
      phase: 1,
      name: 'Critical Remediation',
      gaps: byPriority[SOPPriority.CRITICAL],
      focus: 'Address critical compliance gaps immediately',
      effort: 'high',
    });
  }

  // Phase 2: High priority gaps
  if (byPriority[SOPPriority.HIGH].length > 0) {
    phases.push({
      phase: phases.length + 1,
      name: 'High Priority Remediation',
      gaps: byPriority[SOPPriority.HIGH],
      focus: 'Address high-priority gaps to improve compliance posture',
      effort: 'high',
    });
  }

  // Phase 3: Medium priority gaps
  if (byPriority[SOPPriority.MEDIUM].length > 0) {
    phases.push({
      phase: phases.length + 1,
      name: 'Standard Remediation',
      gaps: byPriority[SOPPriority.MEDIUM],
      focus: 'Address medium-priority gaps for comprehensive compliance',
      effort: 'medium',
    });
  }

  // Phase 4: Low priority gaps
  if (byPriority[SOPPriority.LOW].length > 0) {
    phases.push({
      phase: phases.length + 1,
      name: 'Enhancement',
      gaps: byPriority[SOPPriority.LOW],
      focus: 'Address remaining gaps for full compliance',
      effort: 'low',
    });
  }

  // Identify quick wins (low effort from any priority)
  const quickWins = gaps.filter(g =>
    g.effort === 'low' &&
    (g.priority === SOPPriority.HIGH || g.priority === SOPPriority.CRITICAL)
  );

  // Identify dependencies
  // Governance gaps should be addressed before development gaps
  const governanceGaps = gaps.filter(g => {
    const sop = getSOPById(g.sopId);
    return sop?.category === SOPCategory.GOVERNANCE;
  });

  const developmentGaps = gaps.filter(g => {
    const sop = getSOPById(g.sopId);
    return sop?.category === SOPCategory.DEVELOPMENT;
  });

  for (const devGap of developmentGaps) {
    for (const govGap of governanceGaps) {
      if (govGap.priority === SOPPriority.CRITICAL || govGap.priority === SOPPriority.HIGH) {
        dependencies.push({
          gapId: devGap.id,
          dependsOn: govGap.id,
          reason: 'Governance requirements should be established before development practices',
        });
        break; // Only add one dependency per dev gap
      }
    }
  }

  return {
    phases,
    quickWins,
    dependencies,
  };
}

/**
 * Check if priority is at least a certain level
 */
function isPriorityAtLeast(priority: SOPPriority, minimum: SOPPriority): boolean {
  const levels = {
    [SOPPriority.LOW]: 1,
    [SOPPriority.MEDIUM]: 2,
    [SOPPriority.HIGH]: 3,
    [SOPPriority.CRITICAL]: 4,
  };

  return levels[priority] >= levels[minimum];
}

/**
 * Lower priority by one level
 */
function lowerPriority(priority: SOPPriority): SOPPriority {
  switch (priority) {
    case SOPPriority.CRITICAL:
      return SOPPriority.HIGH;
    case SOPPriority.HIGH:
      return SOPPriority.MEDIUM;
    case SOPPriority.MEDIUM:
      return SOPPriority.LOW;
    case SOPPriority.LOW:
      return SOPPriority.LOW;
  }
}

/**
 * Get gaps for a specific SOP
 */
export function getGapsForSOP(
  analysisResult: GapAnalysisResult,
  sopId: string
): ComplianceGap[] {
  return analysisResult.gaps.filter(g => g.sopId === sopId);
}

/**
 * Get high-impact quick wins
 */
export function getQuickWins(analysisResult: GapAnalysisResult): ComplianceGap[] {
  return analysisResult.roadmap?.quickWins || [];
}

/**
 * Calculate remediation progress
 */
export function calculateProgress(gaps: ComplianceGap[]): {
  total: number;
  resolved: number;
  inProgress: number;
  open: number;
  percentage: number;
} {
  const total = gaps.length;
  const resolved = gaps.filter(g => g.status === 'resolved').length;
  const inProgress = gaps.filter(g => g.status === 'in-progress').length;
  const open = gaps.filter(g => g.status === 'open').length;
  const percentage = total > 0 ? Math.round((resolved / total) * 100) : 100;

  return { total, resolved, inProgress, open, percentage };
}
