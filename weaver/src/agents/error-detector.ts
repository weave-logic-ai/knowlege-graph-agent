/**
 * Error Detection Expert
 *
 * Identifies patterns and anomalies that indicate errors.
 */

import { UnifiedMemory } from '../integration/unified-memory.js';
import type { Experience } from '../memory/types.js';

export interface ErrorPattern {
  id: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  examples: string[];
  recommendation: string;
}

export class ErrorDetector {
  private memory: UnifiedMemory;

  constructor(memory?: UnifiedMemory) {
    this.memory = memory || new UnifiedMemory();
  }

  async detectErrorPatterns(): Promise<ErrorPattern[]> {
    const storage = this.memory['experienceIndexer'].getStorage();
    const failedExperiences = await storage.query({ outcome: 'failure', limit: 50 });

    const errorMessages = failedExperiences
      .map(r => r.experience.errorMessage)
      .filter((msg): msg is string => !!msg);

    const patterns: ErrorPattern[] = [];
    const seen = new Set<string>();

    for (const msg of errorMessages) {
      const key = msg.substring(0, 50).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        patterns.push({
          id: `error-${patterns.length}`,
          pattern: msg,
          severity: this.assessSeverity(msg),
          frequency: errorMessages.filter(m => m.includes(key)).length,
          examples: [msg],
          recommendation: 'Add validation and error handling',
        });
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  }

  private assessSeverity(errorMessage: string): ErrorPattern['severity'] {
    const lower = errorMessage.toLowerCase();
    if (lower.includes('critical') || lower.includes('fatal')) return 'critical';
    if (lower.includes('error') || lower.includes('fail')) return 'high';
    if (lower.includes('warning')) return 'medium';
    return 'low';
  }
}
