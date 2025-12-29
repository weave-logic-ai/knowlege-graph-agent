import { ComplianceStatus, SOPPriority, SOPCategory } from "./types.js";
import { getSOPById } from "./registry.js";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("gap-analyzer");
const REMEDIATION_TEMPLATES = {
  "requirements-definition": "Create a requirements document using the provided template. Include functional requirements, non-functional requirements, and acceptance criteria for each feature.",
  "architecture-documentation": "Document the system architecture using C4 diagrams or similar notation. Include system context, containers, components, and deployment views.",
  "testing-infrastructure": "Set up a comprehensive test suite including unit tests, integration tests, and end-to-end tests. Aim for at least 80% code coverage.",
  "security-assessment": "Conduct a security assessment including threat modeling, vulnerability scanning, and penetration testing. Document findings and remediation steps.",
  "bias-fairness-assessment": "Perform a bias and fairness assessment of AI/ML models. Document potential biases, mitigation strategies, and ongoing monitoring plans.",
  "monitoring-setup": "Implement comprehensive monitoring including metrics collection, alerting, and dashboards. Cover application health, performance, and business metrics.",
  "documentation": "Create or update documentation including README, API documentation, deployment guides, and operational runbooks.",
  "ci-cd-pipeline": "Set up CI/CD pipelines including automated testing, security scanning, and deployment automation.",
  "data-governance": "Establish data governance policies including data classification, retention, access controls, and privacy compliance.",
  "change-management": "Implement change management processes including code review, approval workflows, and rollback procedures.",
  "incident-response": "Create incident response procedures including escalation paths, communication templates, and post-mortem processes.",
  "risk-management": "Conduct risk assessment and create risk register with mitigation strategies and ownership assignments."
};
const EFFORT_FACTORS = {
  "document": "low",
  "test": "medium",
  "review": "medium",
  "audit": "high",
  "automated": "high"
};
function analyzeGaps(checkResult, options = {}) {
  const {
    complianceThreshold = 90,
    includePartial = true,
    minPriority,
    categories,
    generateRemediation: generateRemediation2 = true
  } = options;
  logger.info("Analyzing compliance gaps", {
    assessments: checkResult.assessments.length,
    threshold: complianceThreshold
  });
  const gaps = [];
  let gapIdCounter = 1;
  for (const assessment of checkResult.assessments) {
    if (assessment.score >= complianceThreshold) continue;
    if (!includePartial && assessment.status === ComplianceStatus.PARTIAL) continue;
    const sop = getSOPById(assessment.sopId);
    if (!sop) continue;
    if (minPriority && !isPriorityAtLeast(sop.priority, minPriority)) continue;
    if (categories && !categories.includes(sop.category)) continue;
    for (const reqId of assessment.requirementsGaps) {
      const requirement = sop.requirements.find((r) => r.id === reqId);
      if (!requirement) continue;
      const gap = createGap(
        `gap-${gapIdCounter++}`,
        sop,
        requirement
      );
      gaps.push(gap);
    }
  }
  const byPriority = groupByPriority(gaps);
  const byCategory = groupByCategory(gaps);
  const criticalGaps = gaps.filter((g) => g.priority === SOPPriority.CRITICAL);
  const summary = calculateSummary(checkResult, gaps);
  let roadmap;
  if (generateRemediation2) {
    roadmap = generateRemediationRoadmap(gaps, byPriority);
  }
  logger.info("Gap analysis complete", {
    totalGaps: gaps.length,
    criticalGaps: criticalGaps.length,
    compliancePercentage: summary.compliancePercentage
  });
  return {
    gaps,
    byPriority,
    byCategory,
    totalGaps: gaps.length,
    criticalGaps,
    summary,
    roadmap
  };
}
function createGap(id, sop, requirement, assessment) {
  const effort = EFFORT_FACTORS[requirement.verification] || "medium";
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
    status: "open",
    createdAt: /* @__PURE__ */ new Date()
  };
}
function generateRemediation(sop, requirement) {
  for (const [key, template] of Object.entries(REMEDIATION_TEMPLATES)) {
    if (sop.id.toLowerCase().includes(key) || requirement.description.toLowerCase().includes(key)) {
      return template;
    }
  }
  switch (requirement.verification) {
    case "document":
      return `Create documentation to address: ${requirement.description}. Required evidence: ${requirement.evidence.join(", ")}.`;
    case "test":
      return `Implement tests to verify: ${requirement.description}. Ensure tests cover the specified acceptance criteria.`;
    case "review":
      return `Schedule a review meeting to assess: ${requirement.description}. Document findings and action items.`;
    case "audit":
      return `Conduct an audit to verify: ${requirement.description}. Create audit trail and compliance report.`;
    case "automated":
      return `Implement automated checks for: ${requirement.description}. Integrate into CI/CD pipeline.`;
    default:
      return `Address requirement: ${requirement.description}`;
  }
}
function generateImpactDescription(sop, requirement) {
  const impacts = [];
  if (requirement.mandatory) {
    impacts.push("This is a mandatory requirement");
  }
  switch (sop.category) {
    case SOPCategory.GOVERNANCE:
      impacts.push("May affect regulatory compliance and audit readiness");
      break;
    case SOPCategory.DEVELOPMENT:
      impacts.push("May impact code quality and maintainability");
      break;
    case SOPCategory.OPERATIONS:
      impacts.push("May affect system reliability and operations");
      break;
    case SOPCategory.QUALITY:
      impacts.push("May impact overall quality assurance");
      break;
    case SOPCategory.PROGRAM_MANAGEMENT:
      impacts.push("May affect project governance and tracking");
      break;
  }
  if (sop.irbTypicallyRequired) {
    impacts.push("AI-IRB review may be required");
  }
  return impacts.join(". ");
}
function groupByPriority(gaps) {
  const result = {
    [SOPPriority.CRITICAL]: [],
    [SOPPriority.HIGH]: [],
    [SOPPriority.MEDIUM]: [],
    [SOPPriority.LOW]: []
  };
  for (const gap of gaps) {
    result[gap.priority].push(gap);
  }
  return result;
}
function groupByCategory(gaps) {
  const result = {
    [SOPCategory.PROGRAM_MANAGEMENT]: [],
    [SOPCategory.OPERATIONS]: [],
    [SOPCategory.DEVELOPMENT]: [],
    [SOPCategory.GOVERNANCE]: [],
    [SOPCategory.QUALITY]: []
  };
  for (const gap of gaps) {
    const sop = getSOPById(gap.sopId);
    if (sop) {
      result[sop.category].push(gap);
    }
  }
  return result;
}
function calculateSummary(checkResult, gaps) {
  let totalRequirements = 0;
  let requirementsMet = 0;
  for (const assessment of checkResult.assessments) {
    totalRequirements += assessment.requirementsMet.length + assessment.requirementsGaps.length;
    requirementsMet += assessment.requirementsMet.length;
  }
  const requirementsGaps = totalRequirements - requirementsMet;
  const compliancePercentage = totalRequirements > 0 ? Math.round(requirementsMet / totalRequirements * 100) : 0;
  const totalEffort = {
    low: gaps.filter((g) => g.effort === "low").length,
    medium: gaps.filter((g) => g.effort === "medium").length,
    high: gaps.filter((g) => g.effort === "high").length
  };
  let overallComplexity;
  if (totalEffort.high > gaps.length * 0.3 || gaps.length > 20) {
    overallComplexity = "high";
  } else if (totalEffort.medium > gaps.length * 0.5 || gaps.length > 10) {
    overallComplexity = "medium";
  } else {
    overallComplexity = "low";
  }
  return {
    totalRequirements,
    requirementsMet,
    requirementsGaps,
    compliancePercentage,
    totalEffort,
    overallComplexity
  };
}
function generateRemediationRoadmap(gaps, byPriority) {
  const phases = [];
  const dependencies = [];
  if (byPriority[SOPPriority.CRITICAL].length > 0) {
    phases.push({
      phase: 1,
      name: "Critical Remediation",
      gaps: byPriority[SOPPriority.CRITICAL],
      focus: "Address critical compliance gaps immediately",
      effort: "high"
    });
  }
  if (byPriority[SOPPriority.HIGH].length > 0) {
    phases.push({
      phase: phases.length + 1,
      name: "High Priority Remediation",
      gaps: byPriority[SOPPriority.HIGH],
      focus: "Address high-priority gaps to improve compliance posture",
      effort: "high"
    });
  }
  if (byPriority[SOPPriority.MEDIUM].length > 0) {
    phases.push({
      phase: phases.length + 1,
      name: "Standard Remediation",
      gaps: byPriority[SOPPriority.MEDIUM],
      focus: "Address medium-priority gaps for comprehensive compliance",
      effort: "medium"
    });
  }
  if (byPriority[SOPPriority.LOW].length > 0) {
    phases.push({
      phase: phases.length + 1,
      name: "Enhancement",
      gaps: byPriority[SOPPriority.LOW],
      focus: "Address remaining gaps for full compliance",
      effort: "low"
    });
  }
  const quickWins = gaps.filter(
    (g) => g.effort === "low" && (g.priority === SOPPriority.HIGH || g.priority === SOPPriority.CRITICAL)
  );
  const governanceGaps = gaps.filter((g) => {
    const sop = getSOPById(g.sopId);
    return sop?.category === SOPCategory.GOVERNANCE;
  });
  const developmentGaps = gaps.filter((g) => {
    const sop = getSOPById(g.sopId);
    return sop?.category === SOPCategory.DEVELOPMENT;
  });
  for (const devGap of developmentGaps) {
    for (const govGap of governanceGaps) {
      if (govGap.priority === SOPPriority.CRITICAL || govGap.priority === SOPPriority.HIGH) {
        dependencies.push({
          gapId: devGap.id,
          dependsOn: govGap.id,
          reason: "Governance requirements should be established before development practices"
        });
        break;
      }
    }
  }
  return {
    phases,
    quickWins,
    dependencies
  };
}
function isPriorityAtLeast(priority, minimum) {
  const levels = {
    [SOPPriority.LOW]: 1,
    [SOPPriority.MEDIUM]: 2,
    [SOPPriority.HIGH]: 3,
    [SOPPriority.CRITICAL]: 4
  };
  return levels[priority] >= levels[minimum];
}
function lowerPriority(priority) {
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
function getGapsForSOP(analysisResult, sopId) {
  return analysisResult.gaps.filter((g) => g.sopId === sopId);
}
function getQuickWins(analysisResult) {
  return analysisResult.roadmap?.quickWins || [];
}
function calculateProgress(gaps) {
  const total = gaps.length;
  const resolved = gaps.filter((g) => g.status === "resolved").length;
  const inProgress = gaps.filter((g) => g.status === "in-progress").length;
  const open = gaps.filter((g) => g.status === "open").length;
  const percentage = total > 0 ? Math.round(resolved / total * 100) : 100;
  return { total, resolved, inProgress, open, percentage };
}
export {
  analyzeGaps,
  calculateProgress,
  getGapsForSOP,
  getQuickWins
};
//# sourceMappingURL=gap-analyzer.js.map
