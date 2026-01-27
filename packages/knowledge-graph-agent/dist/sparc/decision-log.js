import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("decision-log");
class DecisionLogManager {
  log;
  options;
  logPath;
  constructor(options) {
    this.options = {
      autoSave: true,
      ...options
    };
    this.logPath = join(this.options.outputDir, "decision-log.json");
    this.log = this.loadOrCreate();
  }
  /**
   * Load existing log or create new one
   */
  loadOrCreate() {
    if (existsSync(this.logPath)) {
      try {
        const content = readFileSync(this.logPath, "utf-8");
        const parsed = JSON.parse(content);
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        for (const decision of parsed.decisions) {
          decision.createdAt = new Date(decision.createdAt);
          decision.updatedAt = new Date(decision.updatedAt);
        }
        logger.info("Loaded existing decision log", {
          decisions: parsed.decisions.length
        });
        return parsed;
      } catch (error) {
        logger.warn("Failed to load decision log, creating new", { error });
      }
    }
    return this.createNewLog();
  }
  /**
   * Create a new decision log
   */
  createNewLog() {
    const now = /* @__PURE__ */ new Date();
    return {
      id: `dlog_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      planId: this.options.planId,
      decisions: [],
      statistics: {
        total: 0,
        approved: 0,
        rejected: 0,
        deferred: 0,
        highConfidence: 0,
        lowConfidence: 0,
        consensusRequired: 0
      },
      createdAt: now,
      updatedAt: now
    };
  }
  /**
   * Add a new decision to the log
   */
  addDecision(options) {
    const now = /* @__PURE__ */ new Date();
    const id = `dec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const decision = {
      id,
      title: options.title,
      description: options.description,
      phase: options.phase,
      status: "proposed",
      confidence: options.confidence,
      rationale: options.rationale,
      alternatives: options.alternatives || [],
      impact: options.impact || "Impact assessment pending",
      stakeholders: options.stakeholders || [],
      relatedDecisions: options.relatedDecisions || [],
      consensus: options.consensus,
      createdAt: now,
      updatedAt: now,
      decidedBy: options.decidedBy
    };
    this.log.decisions.push(decision);
    this.updateStatistics();
    this.log.updatedAt = now;
    logger.info("Added decision", {
      id: decision.id,
      title: decision.title,
      confidence: decision.confidence
    });
    if (this.options.autoSave) {
      this.save();
    }
    return decision;
  }
  /**
   * Update decision status
   */
  updateDecisionStatus(decisionId, status, notes) {
    const decision = this.log.decisions.find((d) => d.id === decisionId);
    if (!decision) {
      logger.warn("Decision not found", { decisionId });
      return false;
    }
    decision.status = status;
    decision.updatedAt = /* @__PURE__ */ new Date();
    if (notes) {
      decision.rationale = `${decision.rationale}

Update: ${notes}`;
    }
    this.updateStatistics();
    this.log.updatedAt = /* @__PURE__ */ new Date();
    logger.info("Updated decision status", {
      id: decisionId,
      status
    });
    if (this.options.autoSave) {
      this.save();
    }
    return true;
  }
  /**
   * Add consensus information to a decision
   */
  addConsensusInfo(decisionId, consensus) {
    const decision = this.log.decisions.find((d) => d.id === decisionId);
    if (!decision) {
      logger.warn("Decision not found", { decisionId });
      return false;
    }
    decision.consensus = consensus;
    decision.updatedAt = /* @__PURE__ */ new Date();
    if (consensus.achieved) {
      decision.status = "approved";
    }
    this.updateStatistics();
    this.log.updatedAt = /* @__PURE__ */ new Date();
    logger.info("Added consensus info", {
      id: decisionId,
      achieved: consensus.achieved,
      method: consensus.method
    });
    if (this.options.autoSave) {
      this.save();
    }
    return true;
  }
  /**
   * Get all decisions
   */
  getDecisions() {
    return [...this.log.decisions];
  }
  /**
   * Get decisions by phase
   */
  getDecisionsByPhase(phase) {
    return this.log.decisions.filter((d) => d.phase === phase);
  }
  /**
   * Get decisions by confidence level
   */
  getDecisionsByConfidence(confidence) {
    return this.log.decisions.filter((d) => d.confidence === confidence);
  }
  /**
   * Get low confidence decisions requiring review
   */
  getLowConfidenceDecisions() {
    return this.log.decisions.filter(
      (d) => d.confidence === "low" || d.confidence === "uncertain"
    );
  }
  /**
   * Get decisions requiring consensus
   */
  getDecisionsRequiringConsensus() {
    return this.log.decisions.filter(
      (d) => d.consensus?.required && !d.consensus?.achieved
    );
  }
  /**
   * Get decision by ID
   */
  getDecision(id) {
    return this.log.decisions.find((d) => d.id === id);
  }
  /**
   * Get the full log
   */
  getLog() {
    return { ...this.log };
  }
  /**
   * Get statistics
   */
  getStatistics() {
    return { ...this.log.statistics };
  }
  /**
   * Update statistics
   */
  updateStatistics() {
    const decisions = this.log.decisions;
    this.log.statistics = {
      total: decisions.length,
      approved: decisions.filter((d) => d.status === "approved").length,
      rejected: decisions.filter((d) => d.status === "rejected").length,
      deferred: decisions.filter((d) => d.status === "deferred").length,
      highConfidence: decisions.filter((d) => d.confidence === "high").length,
      lowConfidence: decisions.filter(
        (d) => d.confidence === "low" || d.confidence === "uncertain"
      ).length,
      consensusRequired: decisions.filter((d) => d.consensus?.required).length
    };
  }
  /**
   * Save the log to disk
   */
  save() {
    const dir = dirname(this.logPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.logPath, JSON.stringify(this.log, null, 2));
    logger.debug("Saved decision log", { path: this.logPath });
  }
  /**
   * Export log as markdown
   */
  exportMarkdown() {
    const lines = [
      "# Decision Log",
      "",
      `**Plan ID:** ${this.log.planId}`,
      `**Created:** ${this.log.createdAt.toISOString()}`,
      `**Updated:** ${this.log.updatedAt.toISOString()}`,
      "",
      "## Statistics",
      "",
      `| Metric | Count |`,
      `|--------|-------|`,
      `| Total Decisions | ${this.log.statistics.total} |`,
      `| Approved | ${this.log.statistics.approved} |`,
      `| Rejected | ${this.log.statistics.rejected} |`,
      `| Deferred | ${this.log.statistics.deferred} |`,
      `| High Confidence | ${this.log.statistics.highConfidence} |`,
      `| Low Confidence | ${this.log.statistics.lowConfidence} |`,
      `| Consensus Required | ${this.log.statistics.consensusRequired} |`,
      "",
      "## Decisions",
      ""
    ];
    const phases = ["specification", "pseudocode", "architecture", "refinement", "completion"];
    for (const phase of phases) {
      const phaseDecisions = this.getDecisionsByPhase(phase);
      if (phaseDecisions.length === 0) continue;
      lines.push(`### ${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase`);
      lines.push("");
      for (const decision of phaseDecisions) {
        lines.push(`#### ${decision.title}`);
        lines.push("");
        lines.push(`- **ID:** ${decision.id}`);
        lines.push(`- **Status:** ${decision.status}`);
        lines.push(`- **Confidence:** ${decision.confidence}`);
        lines.push(`- **Decided By:** ${decision.decidedBy}`);
        lines.push(`- **Date:** ${decision.createdAt.toISOString()}`);
        lines.push("");
        lines.push("**Description:**");
        lines.push(decision.description);
        lines.push("");
        lines.push("**Rationale:**");
        lines.push(decision.rationale);
        lines.push("");
        if (decision.alternatives.length > 0) {
          lines.push("**Alternatives Considered:**");
          for (const alt of decision.alternatives) {
            lines.push(`- ${alt}`);
          }
          lines.push("");
        }
        if (decision.impact) {
          lines.push("**Impact:**");
          lines.push(decision.impact);
          lines.push("");
        }
        if (decision.consensus) {
          lines.push("**Consensus:**");
          lines.push(`- Required: ${decision.consensus.required}`);
          lines.push(`- Achieved: ${decision.consensus.achieved}`);
          lines.push(`- Method: ${decision.consensus.method}`);
          lines.push(`- Outcome: ${decision.consensus.outcome}`);
          lines.push("");
        }
        lines.push("---");
        lines.push("");
      }
    }
    return lines.join("\n");
  }
  /**
   * Save markdown export
   */
  saveMarkdown() {
    const mdPath = join(this.options.outputDir, "decision-log.md");
    const dir = dirname(mdPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(mdPath, this.exportMarkdown());
    logger.info("Saved decision log markdown", { path: mdPath });
  }
}
function createDecisionLogManager(options) {
  return new DecisionLogManager(options);
}
export {
  DecisionLogManager,
  createDecisionLogManager
};
//# sourceMappingURL=decision-log.js.map
