/**
 * Error Pattern Database - Learn from error history
 *
 * Maintains a database of error patterns and their successful
 * recovery strategies to improve future error handling.
 */

import { ErrorCategory } from './error-taxonomy.js';
import { logger } from './logger.js';

/**
 * Solution for resolving an error
 */
export interface Solution {
  /** Human-readable description of the solution */
  description: string;

  /** Automated action to execute */
  action?: () => Promise<void>;

  /** Whether solution can be automated */
  automated: boolean;

  /** Success rate of this solution (0-1) */
  successRate: number;

  /** Times this solution was attempted */
  attemptCount: number;

  /** Times this solution succeeded */
  successCount: number;
}

/**
 * Error pattern for matching and resolution
 */
export interface ErrorPattern {
  /** Unique identifier for the pattern */
  id: string;

  /** Regex pattern to match error messages */
  pattern: RegExp;

  /** Error category */
  category: ErrorCategory;

  /** Common causes of this error */
  commonCauses: string[];

  /** Solutions ordered by success rate */
  solutions: Solution[];

  /** Overall success rate for this pattern */
  successRate: number;

  /** Number of times this pattern was encountered */
  encounterCount: number;

  /** Last time this pattern was seen */
  lastSeen: Date;

  /** Tags for categorization */
  tags: string[];
}

/**
 * Error occurrence record
 */
export interface ErrorOccurrence {
  /** Error message */
  message: string;

  /** Matched pattern ID */
  patternId?: string;

  /** Error category */
  category: ErrorCategory;

  /** Context when error occurred */
  context: Record<string, unknown>;

  /** Solution attempted */
  solutionAttempted?: string;

  /** Whether resolution was successful */
  resolved: boolean;

  /** Timestamp */
  timestamp: Date;
}

/**
 * Error Pattern Database
 */
export class ErrorPatternDatabase {
  private patterns: Map<string, ErrorPattern> = new Map();
  private history: ErrorOccurrence[] = [];
  private maxHistorySize = 1000;

  constructor() {
    this.initializeBuiltInPatterns();
  }

  /**
   * Initialize built-in error patterns
   */
  private initializeBuiltInPatterns(): void {
    // API Rate Limiting
    this.addPattern({
      id: 'api-rate-limit',
      pattern: /rate limit|too many requests|429/i,
      category: ErrorCategory.RATE_LIMIT,
      commonCauses: [
        'Exceeded API rate limit',
        'Too many concurrent requests',
        'Quota exhausted',
      ],
      solutions: [
        {
          description: 'Wait for rate limit window to reset',
          automated: true,
          successRate: 0.95,
          attemptCount: 0,
          successCount: 0,
        },
        {
          description: 'Implement request queuing',
          automated: true,
          successRate: 0.90,
          attemptCount: 0,
          successCount: 0,
        },
        {
          description: 'Use alternative API endpoint',
          automated: false,
          successRate: 0.85,
          attemptCount: 0,
          successCount: 0,
        },
      ],
      successRate: 0.90,
      encounterCount: 0,
      lastSeen: new Date(),
      tags: ['api', 'rate-limit', 'transient'],
    });

    // Network Timeout
    this.addPattern({
      id: 'network-timeout',
      pattern: /timeout|timed out|ETIMEDOUT/i,
      category: ErrorCategory.TRANSIENT,
      commonCauses: [
        'Slow network connection',
        'Server not responding',
        'Request too complex',
      ],
      solutions: [
        {
          description: 'Retry with increased timeout',
          automated: true,
          successRate: 0.80,
          attemptCount: 0,
          successCount: 0,
        },
        {
          description: 'Check network connectivity',
          automated: true,
          successRate: 0.70,
          attemptCount: 0,
          successCount: 0,
        },
        {
          description: 'Use cached data if available',
          automated: true,
          successRate: 0.85,
          attemptCount: 0,
          successCount: 0,
        },
      ],
      successRate: 0.78,
      encounterCount: 0,
      lastSeen: new Date(),
      tags: ['network', 'timeout', 'transient'],
    });

    // Authentication Failure
    this.addPattern({
      id: 'auth-failure',
      pattern: /unauthorized|forbidden|401|403|authentication failed|invalid.*key/i,
      category: ErrorCategory.AUTHENTICATION,
      commonCauses: [
        'Invalid API credentials',
        'Expired authentication token',
        'Insufficient permissions',
      ],
      solutions: [
        {
          description: 'Refresh authentication token',
          automated: true,
          successRate: 0.70,
          attemptCount: 0,
          successCount: 0,
        },
        {
          description: 'Check API key configuration',
          automated: false,
          successRate: 0.95,
          attemptCount: 0,
          successCount: 0,
        },
        {
          description: 'Use fallback credentials',
          automated: true,
          successRate: 0.60,
          attemptCount: 0,
          successCount: 0,
        },
      ],
      successRate: 0.75,
      encounterCount: 0,
      lastSeen: new Date(),
      tags: ['auth', 'credentials', 'permanent'],
    });

    // Resource Exhaustion
    this.addPattern({
      id: 'resource-exhaustion',
      pattern: /ENOSPC|out of memory|disk full|quota exceeded/i,
      category: ErrorCategory.RESOURCE,
      commonCauses: [
        'Disk space full',
        'Memory limit exceeded',
        'Too many open files',
      ],
      solutions: [
        {
          description: 'Clean up temporary files',
          automated: true,
          successRate: 0.85,
          attemptCount: 0,
          successCount: 0,
        },
        {
          description: 'Reduce batch size',
          automated: true,
          successRate: 0.90,
          attemptCount: 0,
          successCount: 0,
        },
        {
          description: 'Free up resources',
          automated: false,
          successRate: 0.95,
          attemptCount: 0,
          successCount: 0,
        },
      ],
      successRate: 0.90,
      encounterCount: 0,
      lastSeen: new Date(),
      tags: ['resource', 'disk', 'memory'],
    });

    // Service Unavailable
    this.addPattern({
      id: 'service-unavailable',
      pattern: /503|service unavailable|502|bad gateway/i,
      category: ErrorCategory.SERVICE,
      commonCauses: [
        'Service temporarily down',
        'Maintenance in progress',
        'Backend overloaded',
      ],
      solutions: [
        {
          description: 'Wait and retry with backoff',
          automated: true,
          successRate: 0.85,
          attemptCount: 0,
          successCount: 0,
        },
        {
          description: 'Use alternative service',
          automated: true,
          successRate: 0.80,
          attemptCount: 0,
          successCount: 0,
        },
        {
          description: 'Fallback to cached data',
          automated: true,
          successRate: 0.75,
          attemptCount: 0,
          successCount: 0,
        },
      ],
      successRate: 0.80,
      encounterCount: 0,
      lastSeen: new Date(),
      tags: ['service', 'availability', 'transient'],
    });
  }

  /**
   * Add a new pattern to the database
   */
  addPattern(pattern: ErrorPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Find matching pattern for an error
   */
  findPattern(error: Error): ErrorPattern | null {
    for (const pattern of this.patterns.values()) {
      if (pattern.pattern.test(error.message)) {
        // Update encounter count and last seen
        pattern.encounterCount++;
        pattern.lastSeen = new Date();
        return pattern;
      }
    }
    return null;
  }

  /**
   * Get solutions for an error
   */
  getSolutions(error: Error): Solution[] {
    const pattern = this.findPattern(error);

    if (pattern) {
      // Sort solutions by success rate
      return [...pattern.solutions].sort((a, b) => b.successRate - a.successRate);
    }

    return [];
  }

  /**
   * Record error occurrence
   */
  recordOccurrence(
    error: Error,
    context: Record<string, unknown>,
    resolved: boolean = false,
    solutionAttempted?: string
  ): void {
    const pattern = this.findPattern(error);

    const occurrence: ErrorOccurrence = {
      message: error.message,
      patternId: pattern?.id,
      category: pattern?.category ?? ErrorCategory.UNKNOWN,
      context,
      solutionAttempted,
      resolved,
      timestamp: new Date(),
    };

    this.history.push(occurrence);

    // Trim history if too large
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }

    // Update solution success rates
    if (pattern && solutionAttempted) {
      const solution = pattern.solutions.find(
        (s) => s.description === solutionAttempted
      );

      if (solution) {
        solution.attemptCount++;
        if (resolved) {
          solution.successCount++;
        }
        solution.successRate = solution.successCount / solution.attemptCount;

        // Update pattern success rate
        const totalAttempts = pattern.solutions.reduce(
          (sum, s) => sum + s.attemptCount,
          0
        );
        const totalSuccesses = pattern.solutions.reduce(
          (sum, s) => sum + s.successCount,
          0
        );
        pattern.successRate = totalSuccesses / totalAttempts;
      }
    }

    logger.debug('Error occurrence recorded', {
      patternId: pattern?.id,
      resolved,
      solutionAttempted,
    });
  }

  /**
   * Get pattern statistics
   */
  getStatistics(): {
    totalPatterns: number;
    totalOccurrences: number;
    resolutionRate: number;
    topPatterns: Array<{ id: string; count: number; successRate: number }>;
  } {
    const resolvedCount = this.history.filter((o) => o.resolved).length;

    const patternCounts = new Map<string, number>();
    for (const occurrence of this.history) {
      if (occurrence.patternId) {
        const count = patternCounts.get(occurrence.patternId) ?? 0;
        patternCounts.set(occurrence.patternId, count + 1);
      }
    }

    const topPatterns = Array.from(patternCounts.entries())
      .map(([id, count]) => ({
        id,
        count,
        successRate: this.patterns.get(id)?.successRate ?? 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalPatterns: this.patterns.size,
      totalOccurrences: this.history.length,
      resolutionRate: this.history.length > 0 ? resolvedCount / this.history.length : 0,
      topPatterns,
    };
  }

  /**
   * Get recent error history
   */
  getRecentHistory(limit: number = 10): ErrorOccurrence[] {
    return this.history.slice(-limit);
  }

  /**
   * Export patterns for persistence
   */
  exportPatterns(): string {
    const data = {
      patterns: Array.from(this.patterns.values()),
      history: this.history.slice(-100), // Last 100 occurrences
      exportDate: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import patterns from JSON
   */
  importPatterns(json: string): void {
    try {
      const data = JSON.parse(json);

      if (data.patterns) {
        for (const pattern of data.patterns) {
          this.patterns.set(pattern.id, {
            ...pattern,
            pattern: new RegExp(pattern.pattern.source, pattern.pattern.flags),
            lastSeen: new Date(pattern.lastSeen),
          });
        }
      }

      if (data.history) {
        this.history = data.history.map((o: any) => ({
          ...o,
          timestamp: new Date(o.timestamp),
        }));
      }

      logger.info('Error patterns imported successfully', {
        patterns: this.patterns.size,
        history: this.history.length,
      });
    } catch (error) {
      logger.error('Failed to import error patterns', error as Error);
    }
  }
}

/**
 * Global error pattern database instance
 */
export const errorPatternDB = new ErrorPatternDatabase();
