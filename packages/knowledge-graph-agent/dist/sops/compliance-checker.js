import { existsSync, statSync, readFileSync } from "fs";
import { basename, join, extname } from "path";
import { ComplianceStatus, IRBStatus, SOPCategory, SOPPriority } from "./types.js";
import { getSOPById, getSOPsByCategory, getAllSOPs } from "./registry.js";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("compliance-checker");
const DEFAULT_ARTIFACT_PATTERNS = {
  // Documentation artifacts
  "requirements": ["requirements.md", "requirements.txt", "REQUIREMENTS.md", "specs/", "requirements/"],
  "architecture": ["ARCHITECTURE.md", "architecture/", "design/", "ADR-*.md", "adr/"],
  "testing": ["tests/", "__tests__/", "test/", "*.test.ts", "*.spec.ts", "jest.config.*", "vitest.config.*"],
  "security": ["SECURITY.md", "security/", ".snyk", "security-policy.md"],
  "ethics": ["ETHICS.md", "ethics/", "AI-ETHICS.md", "bias-assessment.md"],
  "changelog": ["CHANGELOG.md", "HISTORY.md", "releases/"],
  "readme": ["README.md", "README.txt", "readme.md"],
  "license": ["LICENSE", "LICENSE.md", "LICENSE.txt"],
  "contributing": ["CONTRIBUTING.md", "CONTRIBUTORS.md"],
  "code-of-conduct": ["CODE_OF_CONDUCT.md"],
  "ci-cd": [".github/workflows/", ".gitlab-ci.yml", "Jenkinsfile", ".circleci/"],
  "docker": ["Dockerfile", "docker-compose.yml", ".dockerignore"],
  "monitoring": ["monitoring/", "observability/", "metrics/", "prometheus.yml"],
  "validation": ["validation/", "schemas/", "*.schema.json", "zod/", "yup/"],
  "config-management": [".env.example", "config/", "settings/", "*.config.js", "*.config.ts"],
  "data-management": ["data/", "datasets/", "migrations/", "seeds/"],
  "model-cards": ["MODEL_CARD.md", "model-card.md", "model-cards/"],
  "api-docs": ["openapi.yaml", "swagger.json", "api/", "API.md"],
  "privacy": ["PRIVACY.md", "privacy-policy.md", "data-protection.md"]
};
async function checkCompliance(options) {
  const {
    projectRoot,
    docsPath = "docs",
    sopIds,
    categories,
    deepAnalysis = false,
    assessor = "automated",
    artifactPatterns = DEFAULT_ARTIFACT_PATTERNS
  } = options;
  logger.info("Starting compliance check", { projectRoot, docsPath });
  const result = {
    success: true,
    projectName: basename(projectRoot),
    checkedAt: /* @__PURE__ */ new Date(),
    assessments: [],
    evidence: [],
    overallScore: 0,
    categoryScores: {},
    errors: []
  };
  try {
    let sopsToCheck = [];
    if (sopIds && sopIds.length > 0) {
      for (const id of sopIds) {
        const sop = getSOPById(id);
        if (sop) {
          sopsToCheck.push(sop);
        } else {
          result.errors.push(`SOP not found: ${id}`);
        }
      }
    } else if (categories && categories.length > 0) {
      for (const category of categories) {
        sopsToCheck.push(...getSOPsByCategory(category));
      }
    } else {
      sopsToCheck = getAllSOPs();
    }
    const projectArtifacts = scanProjectArtifacts(projectRoot, docsPath, artifactPatterns);
    logger.debug("Found project artifacts", { count: projectArtifacts.size });
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
    calculateScores(result);
    logger.info("Compliance check complete", {
      overallScore: result.overallScore,
      assessments: result.assessments.length,
      evidence: result.evidence.length
    });
  } catch (error) {
    result.success = false;
    result.errors.push(String(error));
    logger.error(`Compliance check failed: ${String(error)}`);
  }
  return result;
}
function scanProjectArtifacts(projectRoot, docsPath, patterns) {
  const artifacts = /* @__PURE__ */ new Map();
  for (const [category, filePatterns] of Object.entries(patterns)) {
    const found = [];
    for (const pattern of filePatterns) {
      const rootPath = join(projectRoot, pattern);
      if (existsSync(rootPath)) {
        found.push(rootPath);
      }
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
async function assessSOP(sop, projectRoot, docsPath, projectArtifacts, evidenceList, deepAnalysis, assessor) {
  const requirementsMet = [];
  const requirementsGaps = [];
  const evidence = {};
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
  const totalRequirements = sop.requirements.length;
  const mandatoryRequirements = sop.requirements.filter((r) => r.mandatory);
  const mandatoryMet = mandatoryRequirements.filter((r) => requirementsMet.includes(r.id));
  let score = 0;
  if (totalRequirements > 0) {
    const mandatoryWeight = 0.7;
    const optionalWeight = 0.3;
    const mandatoryScore = mandatoryRequirements.length > 0 ? mandatoryMet.length / mandatoryRequirements.length * 100 : 100;
    const optionalRequirements = sop.requirements.filter((r) => !r.mandatory);
    const optionalMet = optionalRequirements.filter((r) => requirementsMet.includes(r.id));
    const optionalScore = optionalRequirements.length > 0 ? optionalMet.length / optionalRequirements.length * 100 : 100;
    score = Math.round(mandatoryScore * mandatoryWeight + optionalScore * optionalWeight);
  }
  let status;
  if (score >= 90) {
    status = ComplianceStatus.COMPLIANT;
  } else if (score >= 50) {
    status = ComplianceStatus.PARTIAL;
  } else if (score > 0) {
    status = ComplianceStatus.NON_COMPLIANT;
  } else {
    status = ComplianceStatus.PENDING;
  }
  let irbStatus = IRBStatus.NOT_REQUIRED;
  if (sop.irbTypicallyRequired) {
    irbStatus = IRBStatus.PENDING;
    const irbArtifacts = projectArtifacts.get("ethics") || [];
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
    assessedAt: /* @__PURE__ */ new Date(),
    assessedBy: assessor,
    notes: `Automated assessment: ${requirementsMet.length}/${totalRequirements} requirements met`
  };
}
function checkRequirement(requirement, projectRoot, docsPath, projectArtifacts, deepAnalysis) {
  for (const artifactType of requirement.artifacts || []) {
    const artifacts = projectArtifacts.get(artifactType);
    if (artifacts && artifacts.length > 0) {
      const evidenceItem = {
        requirementId: requirement.id,
        filePath: artifacts[0],
        type: categorizeArtifact(artifacts[0]),
        description: `Found ${artifactType} artifact: ${basename(artifacts[0])}`,
        confidence: 0.8
      };
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
  switch (requirement.verification) {
    case "document":
      return checkDocumentEvidence(requirement, projectRoot, docsPath, projectArtifacts, deepAnalysis);
    case "test":
      return checkTestEvidence(requirement, projectRoot, projectArtifacts);
    case "automated":
      return checkAutomatedEvidence(requirement, projectRoot, projectArtifacts);
    case "review":
    case "audit":
      return { met: false };
    default:
      return { met: false };
  }
}
function checkDocumentEvidence(requirement, projectRoot, docsPath, projectArtifacts, deepAnalysis) {
  const docPatterns = ["readme", "requirements", "architecture", "api-docs"];
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
                type: "document",
                description: `Found documentation evidence in ${basename(artifact)}`,
                confidence: 0.85,
                excerpt: contentMatch
              }
            };
          }
        }
      }
    }
  }
  return { met: false };
}
function checkTestEvidence(requirement, projectRoot, projectArtifacts) {
  const testArtifacts = projectArtifacts.get("testing");
  if (testArtifacts && testArtifacts.length > 0) {
    return {
      met: true,
      evidenceFound: {
        requirementId: requirement.id,
        filePath: testArtifacts[0],
        type: "test",
        description: `Test infrastructure found: ${basename(testArtifacts[0])}`,
        confidence: 0.7
      }
    };
  }
  return { met: false };
}
function checkAutomatedEvidence(requirement, projectRoot, projectArtifacts) {
  const ciArtifacts = projectArtifacts.get("ci-cd");
  if (ciArtifacts && ciArtifacts.length > 0) {
    return {
      met: true,
      evidenceFound: {
        requirementId: requirement.id,
        filePath: ciArtifacts[0],
        type: "config",
        description: `CI/CD configuration found: ${basename(ciArtifacts[0])}`,
        confidence: 0.75
      }
    };
  }
  return { met: false };
}
function checkContentForRequirement(filePath, requirement) {
  try {
    const stat = statSync(filePath);
    if (stat.isDirectory()) return null;
    const ext = extname(filePath).toLowerCase();
    const textExtensions = [".md", ".txt", ".ts", ".js", ".json", ".yaml", ".yml", ".html", ".rst"];
    if (!textExtensions.includes(ext)) return null;
    const content = readFileSync(filePath, "utf-8");
    const lowerContent = content.toLowerCase();
    const lowerDesc = requirement.description.toLowerCase();
    const keywords = lowerDesc.split(/\s+/).filter((w) => w.length > 4);
    let matchCount = 0;
    let matchedLine = "";
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        matchCount++;
        const lines = content.split("\n");
        for (const line of lines) {
          if (line.toLowerCase().includes(keyword) && line.length < 200) {
            matchedLine = line.trim();
            break;
          }
        }
      }
    }
    if (matchCount >= keywords.length * 0.3 && matchedLine) {
      return matchedLine;
    }
    return null;
  } catch {
    return null;
  }
}
function categorizeArtifact(filePath) {
  const ext = extname(filePath).toLowerCase();
  const name = basename(filePath).toLowerCase();
  if ([".md", ".txt", ".rst", ".html"].includes(ext)) {
    return "document";
  }
  if ([".ts", ".js", ".py", ".java", ".go", ".rs"].includes(ext)) {
    if (name.includes("test") || name.includes("spec")) {
      return "test";
    }
    return "code";
  }
  if ([".json", ".yaml", ".yml", ".toml", ".ini"].includes(ext)) {
    return "config";
  }
  return "artifact";
}
function calculateScores(result) {
  if (result.assessments.length === 0) {
    result.overallScore = 0;
    return;
  }
  const categoryTotals = {
    [SOPCategory.PROGRAM_MANAGEMENT]: { sum: 0, count: 0 },
    [SOPCategory.OPERATIONS]: { sum: 0, count: 0 },
    [SOPCategory.DEVELOPMENT]: { sum: 0, count: 0 },
    [SOPCategory.GOVERNANCE]: { sum: 0, count: 0 },
    [SOPCategory.QUALITY]: { sum: 0, count: 0 }
  };
  for (const assessment of result.assessments) {
    const sop = getSOPById(assessment.sopId);
    if (sop) {
      categoryTotals[sop.category].sum += assessment.score;
      categoryTotals[sop.category].count += 1;
    }
  }
  for (const category of Object.values(SOPCategory)) {
    const totals = categoryTotals[category];
    result.categoryScores[category] = totals.count > 0 ? Math.round(totals.sum / totals.count) : 0;
  }
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
  result.overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}
function getPriorityWeight(priority) {
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
async function checkSOPCompliance(sopId, projectRoot, docsPath = "docs") {
  const result = await checkCompliance({
    projectRoot,
    docsPath,
    sopIds: [sopId]
  });
  return result.assessments[0] || null;
}
async function meetsMinimumCompliance(projectRoot, threshold = 50, categories) {
  const result = await checkCompliance({
    projectRoot,
    categories
  });
  const gaps = result.assessments.filter((a) => a.score < threshold).map((a) => a.sopId);
  return {
    meets: result.overallScore >= threshold,
    score: result.overallScore,
    gaps
  };
}
export {
  checkCompliance,
  checkSOPCompliance,
  meetsMinimumCompliance
};
//# sourceMappingURL=compliance-checker.js.map
