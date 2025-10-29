/**
 * State Verification Middleware
 *
 * Validates preconditions and postconditions.
 */

export interface StateCondition {
  name: string;
  check: () => boolean | Promise<boolean>;
  errorMessage: string;
}

export class StateVerifier {
  async verifyPreconditions(conditions: StateCondition[]): Promise<void> {
    for (const condition of conditions) {
      const result = await condition.check();
      if (!result) {
        throw new Error(`Precondition failed: ${condition.errorMessage}`);
      }
    }
  }

  async verifyPostconditions(conditions: StateCondition[]): Promise<void> {
    for (const condition of conditions) {
      const result = await condition.check();
      if (!result) {
        throw new Error(`Postcondition failed: ${condition.errorMessage}`);
      }
    }
  }

  async executeWithVerification<T>(
    operation: () => Promise<T>,
    pre: StateCondition[],
    post: StateCondition[]
  ): Promise<T> {
    await this.verifyPreconditions(pre);
    const result = await operation();
    await this.verifyPostconditions(post);
    return result;
  }
}
