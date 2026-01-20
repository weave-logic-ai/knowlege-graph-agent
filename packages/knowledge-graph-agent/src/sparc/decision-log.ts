/**
 * Decision Log Manager
 *
 * Manages the decision log throughout the SPARC planning process.
 * Tracks all decisions, their rationale, confidence levels, and consensus information.
 *
 * @module sparc/decision-log
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createLogger } from '../utils/index.js';
import type {
  DecisionLog,
  DecisionEntry,
  DecisionStatus,
  ConfidenceLevel,
  SPARCPhase,
  ConsensusInfo,
} from './types.js';

const logger = createLogger('decision-log');

/**
 * Decision log manager options
 */
export interface DecisionLogManagerOptions {
  /** Output directory for the log */
  outputDir: string;
  /** Plan ID */
  planId: string;
  /** Auto-save on changes */
  autoSave?: boolean;
}

/**
 * Add decision options
 */
export interface AddDecisionOptions {
  /** Decision title */
  title: string;
  /** Decision description */
  description: string;
  /** SPARC phase */
  phase: SPARCPhase;
  /** Confidence level */
  confidence: ConfidenceLevel;
  /** Rationale */
  rationale: string;
  /** Alternatives considered */
  alternatives?: string[];
  /** Impact assessment */
  impact?: string;
  /** Stakeholders */
  stakeholders?: string[];
  /** Related decision IDs */
  relatedDecisions?: string[];
  /** Decision maker */
  decidedBy: string;
  /** Consensus info if applicable */
  consensus?: ConsensusInfo;
}

/**
 * Decision Log Manager
 *
 * Handles creation, updating, and persistence of decision logs.
 */
export class DecisionLogManager {
  private log: DecisionLog;
  private readonly options: Required<DecisionLogManagerOptions>;
  private readonly logPath: string;

  constructor(options: DecisionLogManagerOptions) {
    this.options = {
      autoSave: true,
      ...options,
    };

    this.logPath = join(this.options.outputDir, 'decision-log.json');

    // Load existing or create new log
    this.log = this.loadOrCreate();
  }

  /**
   * Load existing log or create new one
   */
  private loadOrCreate(): DecisionLog {
    if (existsSync(this.logPath)) {
      try {
        const content = readFileSync(this.logPath, 'utf-8');
        const parsed = JSON.parse(content);
        // Restore Date objects
        parsed.createdAt = new Date(parsed.createdAt);
        parsed.updatedAt = new Date(parsed.updatedAt);
        for (const decision of parsed.decisions) {
          decision.createdAt = new Date(decision.createdAt);
          decision.updatedAt = new Date(decision.updatedAt);
        }
        logger.info('Loaded existing decision log', {
          decisions: parsed.decisions.length,
        });
        return parsed;
      } catch (error) {
        logger.warn('Failed to load decision log, creating new', { error });
      }
    }

    return this.createNewLog();
  }

  /**
   * Create a new decision log
   */
  private createNewLog(): DecisionLog {
    const now = new Date();
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
        consensusRequired: 0,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Add a new decision to the log
   */
  addDecision(options: AddDecisionOptions): DecisionEntry {
    const now = new Date();
    const id = `dec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const decision: DecisionEntry = {
      id,
      title: options.title,
      description: options.description,
      phase: options.phase,
      status: 'proposed',
      confidence: options.confidence,
      rationale: options.rationale,
      alternatives: options.alternatives || [],
      impact: options.impact || 'Impact assessment pending',
      stakeholders: options.stakeholders || [],
      relatedDecisions: options.relatedDecisions || [],
      consensus: options.consensus,
      createdAt: now,
      updatedAt: now,
      decidedBy: options.decidedBy,
    };

    this.log.decisions.push(decision);
    this.updateStatistics();
    this.log.updatedAt = now;

    logger.info('Added decision', {
      id: decision.id,
      title: decision.title,
      confidence: decision.confidence,
    });

    if (this.options.autoSave) {
      this.save();
    }

    return decision;
  }

  /**
   * Update decision status
   */
  updateDecisionStatus(decisionId: string, status: DecisionStatus, notes?: string): boolean {
    const decision = this.log.decisions.find(d => d.id === decisionId);
    if (!decision) {
      logger.warn('Decision not found', { decisionId });
      return false;
    }

    decision.status = status;
    decision.updatedAt = new Date();

    if (notes) {
      decision.rationale = `${decision.rationale}\n\nUpdate: ${notes}`;
    }

    this.updateStatistics();
    this.log.updatedAt = new Date();

    logger.info('Updated decision status', {
      id: decisionId,
      status,
    });

    if (this.options.autoSave) {
      this.save();
    }

    return true;
  }

  /**
   * Add consensus information to a decision
   */
  addConsensusInfo(decisionId: string, consensus: ConsensusInfo): boolean {
    const decision = this.log.decisions.find(d => d.id === decisionId);
    if (!decision) {
      logger.warn('Decision not found', { decisionId });
      return false;
    }

    decision.consensus = consensus;
    decision.updatedAt = new Date();

    // Update status based on consensus outcome
    if (consensus.achieved) {
      decision.status = 'approved';
    }

    this.updateStatistics();
    this.log.updatedAt = new Date();

    logger.info('Added consensus info', {
      id: decisionId,
      achieved: consensus.achieved,
      method: consensus.method,
    });

    if (this.options.autoSave) {
      this.save();
    }

    return true;
  }

  /**
   * Get all decisions
   */
  getDecisions(): DecisionEntry[] {
    return [...this.log.decisions];
  }

  /**
   * Get decisions by phase
   */
  getDecisionsByPhase(phase: SPARCPhase): DecisionEntry[] {
    return this.log.decisions.filter(d => d.phase === phase);
  }

  /**
   * Get decisions by confidence level
   */
  getDecisionsByConfidence(confidence: ConfidenceLevel): DecisionEntry[] {
    return this.log.decisions.filter(d => d.confidence === confidence);
  }

  /**
   * Get low confidence decisions requiring review
   */
  getLowConfidenceDecisions(): DecisionEntry[] {
    return this.log.decisions.filter(
      d => d.confidence === 'low' || d.confidence === 'uncertain'
    );
  }

  /**
   * Get decisions requiring consensus
   */
  getDecisionsRequiringConsensus(): DecisionEntry[] {
    return this.log.decisions.filter(
      d => d.consensus?.required && !d.consensus?.achieved
    );
  }

  /**
   * Get decision by ID
   */
  getDecision(id: string): DecisionEntry | undefined {
    return this.log.decisions.find(d => d.id === id);
  }

  /**
   * Get the full log
   */
  getLog(): DecisionLog {
    return { ...this.log };
  }

  /**
   * Get statistics
   */
  getStatistics(): DecisionLog['statistics'] {
    return { ...this.log.statistics };
  }

  /**
   * Update statistics
   */
  private updateStatistics(): void {
    const decisions = this.log.decisions;

    this.log.statistics = {
      total: decisions.length,
      approved: decisions.filter(d => d.status === 'approved').length,
      rejected: decisions.filter(d => d.status === 'rejected').length,
      deferred: decisions.filter(d => d.status === 'deferred').length,
      highConfidence: decisions.filter(d => d.confidence === 'high').length,
      lowConfidence: decisions.filter(
        d => d.confidence === 'low' || d.confidence === 'uncertain'
      ).length,
      consensusRequired: decisions.filter(d => d.consensus?.required).length,
    };
  }

  /**
   * Save the log to disk
   */
  save(): void {
    const dir = dirname(this.logPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(this.logPath, JSON.stringify(this.log, null, 2));
    logger.debug('Saved decision log', { path: this.logPath });
  }

  /**
   * Export log as markdown
   */
  exportMarkdown(): string {
    const lines: string[] = [
      '# Decision Log',
      '',
      `**Plan ID:** ${this.log.planId}`,
      `**Created:** ${this.log.createdAt.toISOString()}`,
      `**Updated:** ${this.log.updatedAt.toISOString()}`,
      '',
      '## Statistics',
      '',
      `| Metric | Count |`,
      `|--------|-------|`,
      `| Total Decisions | ${this.log.statistics.total} |`,
      `| Approved | ${this.log.statistics.approved} |`,
      `| Rejected | ${this.log.statistics.rejected} |`,
      `| Deferred | ${this.log.statistics.deferred} |`,
      `| High Confidence | ${this.log.statistics.highConfidence} |`,
      `| Low Confidence | ${this.log.statistics.lowConfidence} |`,
      `| Consensus Required | ${this.log.statistics.consensusRequired} |`,
      '',
      '## Decisions',
      '',
    ];

    // Group by phase
    const phases: SPARCPhase[] = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];

    for (const phase of phases) {
      const phaseDecisions = this.getDecisionsByPhase(phase);
      if (phaseDecisions.length === 0) continue;

      lines.push(`### ${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase`);
      lines.push('');

      for (const decision of phaseDecisions) {
        lines.push(`#### ${decision.title}`);
        lines.push('');
        lines.push(`- **ID:** ${decision.id}`);
        lines.push(`- **Status:** ${decision.status}`);
        lines.push(`- **Confidence:** ${decision.confidence}`);
        lines.push(`- **Decided By:** ${decision.decidedBy}`);
        lines.push(`- **Date:** ${decision.createdAt.toISOString()}`);
        lines.push('');
        lines.push('**Description:**');
        lines.push(decision.description);
        lines.push('');
        lines.push('**Rationale:**');
        lines.push(decision.rationale);
        lines.push('');

        if (decision.alternatives.length > 0) {
          lines.push('**Alternatives Considered:**');
          for (const alt of decision.alternatives) {
            lines.push(`- ${alt}`);
          }
          lines.push('');
        }

        if (decision.impact) {
          lines.push('**Impact:**');
          lines.push(decision.impact);
          lines.push('');
        }

        if (decision.consensus) {
          lines.push('**Consensus:**');
          lines.push(`- Required: ${decision.consensus.required}`);
          lines.push(`- Achieved: ${decision.consensus.achieved}`);
          lines.push(`- Method: ${decision.consensus.method}`);
          lines.push(`- Outcome: ${decision.consensus.outcome}`);
          lines.push('');
        }

        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Save markdown export
   */
  saveMarkdown(): void {
    const mdPath = join(this.options.outputDir, 'decision-log.md');
    const dir = dirname(mdPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(mdPath, this.exportMarkdown());
    logger.info('Saved decision log markdown', { path: mdPath });
  }
}

/**
 * Create a decision log manager
 */
export function createDecisionLogManager(options: DecisionLogManagerOptions): DecisionLogManager {
  return new DecisionLogManager(options);
}
