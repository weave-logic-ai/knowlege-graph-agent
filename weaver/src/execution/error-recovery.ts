/**
 * Error Recovery System
 *
 * Handles errors and implements recovery strategies.
 */

export interface RecoveryStrategy {
  id: string;
  name: string;
  maxRetries: number;
  backoffMs: number;
  fallback?: () => Promise<unknown>;
}

export class ErrorRecovery {
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    strategy: RecoveryStrategy
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < strategy.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < strategy.maxRetries - 1) {
          await this.delay(strategy.backoffMs * (attempt + 1));
        }
      }
    }

    if (strategy.fallback) {
      return (await strategy.fallback()) as T;
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
