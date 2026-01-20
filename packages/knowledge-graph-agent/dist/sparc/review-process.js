import { createLogger } from "../utils/logger.js";
const logger = createLogger("review-process");
const DOCUMENTATION_CRITERIA = [
  {
    id: "doc-spec-exists",
    category: "specification",
    description: "Specification document must exist",
    severity: "critical",
    check: (plan) => {
      if (!plan.specification) {
        return {
          id: `finding_${Date.now()}`,
          type: "missing",
          severity: "critical",
          category: "specification",
          description: "Specification document is missing",
          location: "plan.specification",
          suggestedFix: "Create specification document with requirements and features",
          relatedStandards: ["SPARC-SPEC-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "doc-requirements",
    category: "requirements",
    description: "Requirements must be defined",
    severity: "critical",
    check: (plan) => {
      if (!plan.specification?.requirements?.length) {
        return {
          id: `finding_${Date.now()}`,
          type: "missing",
          severity: "critical",
          category: "requirements",
          description: "No requirements defined in specification",
          location: "plan.specification.requirements",
          suggestedFix: "Add functional and non-functional requirements",
          relatedStandards: ["SPARC-REQ-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "doc-features",
    category: "features",
    description: "Features must be defined",
    severity: "major",
    check: (plan) => {
      if (!plan.specification?.features?.length) {
        return {
          id: `finding_${Date.now()}`,
          type: "missing",
          severity: "major",
          category: "features",
          description: "No features defined in specification",
          location: "plan.specification.features",
          suggestedFix: "Add features with user stories and complexity estimates",
          relatedStandards: ["SPARC-FEAT-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "doc-architecture",
    category: "architecture",
    description: "Architecture document must exist",
    severity: "critical",
    check: (plan) => {
      if (!plan.architecture) {
        return {
          id: `finding_${Date.now()}`,
          type: "missing",
          severity: "critical",
          category: "architecture",
          description: "Architecture document is missing",
          location: "plan.architecture",
          suggestedFix: "Create architecture document with components and decisions",
          relatedStandards: ["SPARC-ARCH-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "doc-components",
    category: "components",
    description: "Architecture components must be defined",
    severity: "major",
    check: (plan) => {
      if (!plan.architecture?.components?.length) {
        return {
          id: `finding_${Date.now()}`,
          type: "missing",
          severity: "major",
          category: "components",
          description: "No architecture components defined",
          location: "plan.architecture.components",
          suggestedFix: "Define system components with responsibilities and interfaces",
          relatedStandards: ["SPARC-COMP-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "doc-success-metrics",
    category: "metrics",
    description: "Success metrics should be defined",
    severity: "minor",
    check: (plan) => {
      if (!plan.specification?.successMetrics?.length) {
        return {
          id: `finding_${Date.now()}`,
          type: "missing",
          severity: "minor",
          category: "metrics",
          description: "No success metrics defined",
          location: "plan.specification.successMetrics",
          suggestedFix: "Define measurable success criteria",
          relatedStandards: ["SPARC-MET-001"],
          status: "open"
        };
      }
      return null;
    }
  }
];
const CODE_CRITERIA = [
  {
    id: "code-tasks-defined",
    category: "tasks",
    description: "Implementation tasks must be defined",
    severity: "critical",
    check: (plan) => {
      if (!plan.tasks?.length) {
        return {
          id: `finding_${Date.now()}`,
          type: "missing",
          severity: "critical",
          category: "tasks",
          description: "No implementation tasks defined",
          location: "plan.tasks",
          suggestedFix: "Create task breakdown for implementation",
          relatedStandards: ["SPARC-TASK-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "code-parallel-groups",
    category: "parallelization",
    description: "Parallel task groups should be identified",
    severity: "minor",
    check: (plan) => {
      const parallelizableTasks = plan.tasks?.filter((t) => t.parallelizable) || [];
      if (parallelizableTasks.length > 0 && (!plan.parallelGroups || plan.parallelGroups.length === 0)) {
        return {
          id: `finding_${Date.now()}`,
          type: "incomplete",
          severity: "minor",
          category: "parallelization",
          description: "Parallelizable tasks exist but no parallel groups defined",
          location: "plan.parallelGroups",
          suggestedFix: "Group parallelizable tasks for concurrent execution",
          relatedStandards: ["SPARC-PAR-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "code-critical-path",
    category: "planning",
    description: "Critical path should be identified",
    severity: "minor",
    check: (plan) => {
      if (plan.tasks?.length && (!plan.criticalPath || plan.criticalPath.length === 0)) {
        return {
          id: `finding_${Date.now()}`,
          type: "incomplete",
          severity: "minor",
          category: "planning",
          description: "Critical path not identified",
          location: "plan.criticalPath",
          suggestedFix: "Identify critical path tasks that block completion",
          relatedStandards: ["SPARC-PATH-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "code-task-dependencies",
    category: "dependencies",
    description: "Task dependencies should be complete",
    severity: "major",
    check: (plan) => {
      const missingDeps = [];
      const taskIds = new Set(plan.tasks?.map((t) => t.id) || []);
      for (const task of plan.tasks || []) {
        for (const dep of task.dependencies || []) {
          if (!taskIds.has(dep)) {
            missingDeps.push(`${task.id} depends on missing ${dep}`);
          }
        }
      }
      if (missingDeps.length > 0) {
        return {
          id: `finding_${Date.now()}`,
          type: "inconsistent",
          severity: "major",
          category: "dependencies",
          description: `Missing task dependencies: ${missingDeps.join(", ")}`,
          location: "plan.tasks.dependencies",
          suggestedFix: "Add missing tasks or fix dependency references",
          relatedStandards: ["SPARC-DEP-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "code-testing-tasks",
    category: "testing",
    description: "Testing tasks should be included",
    severity: "major",
    check: (plan) => {
      const testingTasks = plan.tasks?.filter((t) => t.type === "testing") || [];
      if (plan.tasks?.length && testingTasks.length === 0) {
        return {
          id: `finding_${Date.now()}`,
          type: "missing",
          severity: "major",
          category: "testing",
          description: "No testing tasks defined",
          location: "plan.tasks",
          suggestedFix: "Add unit, integration, and e2e testing tasks",
          relatedStandards: ["SPARC-TEST-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "code-existing-analysis",
    category: "analysis",
    description: "Existing code should be analyzed",
    severity: "suggestion",
    check: (plan) => {
      if (!plan.existingCode && plan.projectRoot) {
        return {
          id: `finding_${Date.now()}`,
          type: "improvement",
          severity: "suggestion",
          category: "analysis",
          description: "Existing code analysis not performed",
          location: "plan.existingCode",
          suggestedFix: "Analyze existing codebase for patterns and integration points",
          relatedStandards: ["SPARC-ANA-001"],
          status: "open"
        };
      }
      return null;
    }
  }
];
const SPARC_SPEC_CRITERIA = [
  {
    id: "sparc-phases-complete",
    category: "methodology",
    description: "All SPARC phases should have artifacts",
    severity: "major",
    check: (plan) => {
      const missingPhases = [];
      if (!plan.specification) missingPhases.push("Specification");
      if (!plan.algorithms?.length) missingPhases.push("Pseudocode/Algorithms");
      if (!plan.architecture) missingPhases.push("Architecture");
      if (!plan.tasks?.length) missingPhases.push("Refinement/Tasks");
      if (missingPhases.length > 0) {
        return {
          id: `finding_${Date.now()}`,
          type: "incomplete",
          severity: "major",
          category: "methodology",
          description: `Missing SPARC phase artifacts: ${missingPhases.join(", ")}`,
          location: "plan",
          suggestedFix: "Complete all SPARC phases before implementation",
          relatedStandards: ["SPARC-METHOD-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "sparc-decisions-logged",
    category: "governance",
    description: "Important decisions should be logged",
    severity: "major",
    check: (plan) => {
      if (!plan.decisionLog?.decisions?.length) {
        return {
          id: `finding_${Date.now()}`,
          type: "missing",
          severity: "major",
          category: "governance",
          description: "No decisions logged",
          location: "plan.decisionLog",
          suggestedFix: "Log key decisions with rationale and alternatives",
          relatedStandards: ["SPARC-GOV-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "sparc-low-confidence-consensus",
    category: "consensus",
    description: "Low confidence decisions should have consensus",
    severity: "major",
    check: (plan) => {
      const lowConfidenceNoConsensus = plan.decisionLog?.decisions?.filter(
        (d) => (d.confidence === "low" || d.confidence === "uncertain") && !d.consensus?.achieved
      ) || [];
      if (lowConfidenceNoConsensus.length > 0) {
        return {
          id: `finding_${Date.now()}`,
          type: "non-compliant",
          severity: "major",
          category: "consensus",
          description: `${lowConfidenceNoConsensus.length} low-confidence decisions without consensus`,
          location: "plan.decisionLog.decisions",
          suggestedFix: "Build consensus for low-confidence decisions",
          relatedStandards: ["SPARC-CONS-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "sparc-kg-references",
    category: "knowledge-graph",
    description: "Tasks should reference knowledge graph",
    severity: "minor",
    check: (plan) => {
      const tasksWithoutKG = plan.tasks?.filter((t) => !t.kgReferences?.length) || [];
      const ratio = plan.tasks?.length ? tasksWithoutKG.length / plan.tasks.length : 0;
      if (ratio > 0.5) {
        return {
          id: `finding_${Date.now()}`,
          type: "incomplete",
          severity: "minor",
          category: "knowledge-graph",
          description: `${tasksWithoutKG.length} tasks without KG references (${(ratio * 100).toFixed(0)}%)`,
          location: "plan.tasks.kgReferences",
          suggestedFix: "Link tasks to relevant knowledge graph nodes",
          relatedStandards: ["SPARC-KG-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "sparc-context-links",
    category: "context",
    description: "Tasks should have context links",
    severity: "minor",
    check: (plan) => {
      const tasksWithoutContext = plan.tasks?.filter((t) => !t.contextLinks?.length) || [];
      const ratio = plan.tasks?.length ? tasksWithoutContext.length / plan.tasks.length : 0;
      if (ratio > 0.3) {
        return {
          id: `finding_${Date.now()}`,
          type: "incomplete",
          severity: "minor",
          category: "context",
          description: `${tasksWithoutContext.length} tasks without context links`,
          location: "plan.tasks.contextLinks",
          suggestedFix: "Add context links to documents, code, or requirements",
          relatedStandards: ["SPARC-CTX-001"],
          status: "open"
        };
      }
      return null;
    }
  },
  {
    id: "sparc-research-findings",
    category: "research",
    description: "Research findings should be documented",
    severity: "suggestion",
    check: (plan) => {
      if (!plan.researchFindings?.length) {
        return {
          id: `finding_${Date.now()}`,
          type: "improvement",
          severity: "suggestion",
          category: "research",
          description: "No research findings documented",
          location: "plan.researchFindings",
          suggestedFix: "Document research findings with evidence and confidence",
          relatedStandards: ["SPARC-RES-001"],
          status: "open"
        };
      }
      return null;
    }
  }
];
class ReviewProcessManager {
  plan;
  options;
  passes = [];
  constructor(options) {
    this.plan = options.plan;
    this.options = {
      passes: 3,
      autoFix: false,
      strictMode: false,
      ...options
    };
  }
  /**
   * Execute the full review process
   */
  async executeReview() {
    const startedAt = /* @__PURE__ */ new Date();
    logger.info("Starting review process", {
      planId: this.plan.id,
      passes: this.options.passes
    });
    for (let i = 0; i < this.options.passes; i++) {
      logger.info(`Executing review pass ${i + 1}/${this.options.passes}`);
      const docPass = await this.executePass(i * 3 + 1, "documentation", DOCUMENTATION_CRITERIA);
      this.passes.push(docPass);
      const codePass = await this.executePass(i * 3 + 2, "code", CODE_CRITERIA);
      this.passes.push(codePass);
      const sparcPass = await this.executePass(i * 3 + 3, "sparc-spec", SPARC_SPEC_CRITERIA);
      this.passes.push(sparcPass);
    }
    const result = this.compileResults(startedAt);
    logger.info("Review process completed", {
      planId: this.plan.id,
      status: result.overallStatus,
      totalFindings: result.totalFindings,
      criticalFindings: result.criticalFindings
    });
    return result;
  }
  /**
   * Execute a single review pass
   */
  async executePass(passNumber, type, criteria) {
    const startedAt = /* @__PURE__ */ new Date();
    const findings = [];
    for (const criterion of criteria) {
      const finding = criterion.check(this.plan);
      if (finding) {
        findings.push(finding);
      }
    }
    const completedAt = /* @__PURE__ */ new Date();
    let status = "passed";
    if (findings.some((f) => f.severity === "critical")) {
      status = "failed";
    } else if (findings.some((f) => f.severity === "major")) {
      status = "needs-review";
    }
    return {
      passNumber,
      type,
      startedAt,
      completedAt,
      findings,
      itemsReviewed: criteria.length,
      coverage: 100,
      status,
      reviewer: "sparc-review-agent",
      notes: `Reviewed ${criteria.length} criteria, found ${findings.length} issues`
    };
  }
  /**
   * Compile all pass results into final result
   */
  compileResults(startedAt) {
    const allFindings = this.passes.flatMap((p) => p.findings);
    const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
    const majorCount = allFindings.filter((f) => f.severity === "major").length;
    const uniqueFindings = this.deduplicateFindings(allFindings);
    let overallStatus = "approved";
    if (criticalCount > 0) {
      overallStatus = "rejected";
    } else if (majorCount > 0 || this.options.strictMode) {
      overallStatus = "needs-work";
    }
    const recommendations = this.generateRecommendations(uniqueFindings);
    return {
      id: `review_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      planId: this.plan.id,
      passes: this.passes,
      totalFindings: uniqueFindings.length,
      criticalFindings: criticalCount,
      allFindingsAddressed: uniqueFindings.every((f) => f.status !== "open"),
      overallStatus,
      recommendations,
      startedAt,
      completedAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Deduplicate findings across passes
   */
  deduplicateFindings(findings) {
    const seen = /* @__PURE__ */ new Set();
    const unique = [];
    for (const finding of findings) {
      const key = `${finding.category}-${finding.location}-${finding.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(finding);
      }
    }
    return unique;
  }
  /**
   * Generate recommendations based on findings
   */
  generateRecommendations(findings) {
    const recommendations = [];
    const byCategory = /* @__PURE__ */ new Map();
    for (const finding of findings) {
      const existing = byCategory.get(finding.category) || [];
      existing.push(finding);
      byCategory.set(finding.category, existing);
    }
    for (const [category, categoryFindings] of byCategory.entries()) {
      const critical = categoryFindings.filter((f) => f.severity === "critical");
      const major = categoryFindings.filter((f) => f.severity === "major");
      if (critical.length > 0) {
        recommendations.push(
          `CRITICAL: Address ${critical.length} critical ${category} issue(s) before proceeding`
        );
      }
      if (major.length > 0) {
        recommendations.push(
          `MAJOR: Review ${major.length} ${category} issue(s) for completeness`
        );
      }
    }
    if (findings.length === 0) {
      recommendations.push("All review criteria passed. Plan is ready for implementation.");
    } else if (findings.every((f) => f.severity === "suggestion" || f.severity === "minor")) {
      recommendations.push("Only minor issues found. Plan can proceed with optional improvements.");
    }
    return recommendations;
  }
  /**
   * Get findings by severity
   */
  getFindingsBySeverity(severity) {
    return this.passes.flatMap((p) => p.findings).filter((f) => f.severity === severity);
  }
  /**
   * Get all open findings
   */
  getOpenFindings() {
    return this.passes.flatMap((p) => p.findings).filter((f) => f.status === "open");
  }
  /**
   * Mark finding as resolved
   */
  resolveFinding(findingId, resolution) {
    for (const pass of this.passes) {
      const finding = pass.findings.find((f) => f.id === findingId);
      if (finding) {
        finding.status = "fixed";
        finding.resolution = resolution;
        return true;
      }
    }
    return false;
  }
}
function createReviewProcess(options) {
  return new ReviewProcessManager(options);
}
export {
  ReviewProcessManager,
  createReviewProcess
};
//# sourceMappingURL=review-process.js.map
