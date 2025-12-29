import { isRetryableError, classifyError, isRateLimitError } from "./error-taxonomy.js";
var CircuitState = /* @__PURE__ */ ((CircuitState2) => {
  CircuitState2["CLOSED"] = "closed";
  CircuitState2["OPEN"] = "open";
  CircuitState2["HALF_OPEN"] = "half_open";
  return CircuitState2;
})(CircuitState || {});
class CircuitBreaker {
  state = "closed";
  failures = 0;
  successCount = 0;
  lastFailureTime = 0;
  options;
  constructor(options = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 3e4,
      successThreshold: options.successThreshold ?? 2,
      trackByErrorType: options.trackByErrorType ?? false
    };
  }
  /**
   * Get current circuit state
   */
  getState() {
    if (this.state === "open" && Date.now() - this.lastFailureTime >= this.options.resetTimeout) {
      this.state = "half_open";
      this.successCount = 0;
    }
    return this.state;
  }
  /**
   * Check if circuit allows execution
   */
  canExecute() {
    const state = this.getState();
    return state === "closed" || state === "half_open";
  }
  /**
   * Record a successful execution
   */
  recordSuccess() {
    if (this.state === "half_open") {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = "closed";
        this.failures = 0;
        this.successCount = 0;
      }
    } else if (this.state === "closed") {
      this.failures = 0;
    }
  }
  /**
   * Record a failed execution
   */
  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.state === "half_open") {
      this.state = "open";
      this.successCount = 0;
    } else if (this.failures >= this.options.failureThreshold) {
      this.state = "open";
    }
  }
  /**
   * Reset the circuit breaker
   */
  reset() {
    this.state = "closed";
    this.failures = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}
function calculateBackoff(attempt, options = {}) {
  const initialDelay = options.initialDelay ?? 1e3;
  const maxDelay = options.maxDelay ?? 3e4;
  const backoffFactor = options.backoffFactor ?? 2;
  const jitter = options.jitter ?? true;
  const jitterFactor = options.jitterFactor ?? 0.1;
  let delay = initialDelay * Math.pow(backoffFactor, attempt - 1);
  delay = Math.min(delay, maxDelay);
  if (jitter) {
    const jitterAmount = delay * jitterFactor;
    delay = delay + (Math.random() * 2 - 1) * jitterAmount;
  }
  return Math.round(delay);
}
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Aborted"));
      return;
    }
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new Error("Aborted"));
    });
  });
}
async function withRetry(operation, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const isRetryable = options.isRetryable ?? isRetryableError;
  const startTime = Date.now();
  let attempt = 0;
  let lastError;
  while (attempt <= maxRetries) {
    try {
      if (options.signal?.aborted) {
        throw new Error("Operation aborted");
      }
      const value = await operation();
      return {
        success: true,
        value,
        attempts: attempt + 1,
        totalTime: Date.now() - startTime
      };
    } catch (error) {
      const classified = classifyError(error);
      lastError = classified;
      attempt++;
      if (attempt > maxRetries) {
        break;
      }
      if (!isRetryable(error)) {
        break;
      }
      let delay = calculateBackoff(attempt, options);
      if (isRateLimitError(error) && classified.suggestedDelay > delay) {
        delay = classified.suggestedDelay;
      }
      options.onRetry?.(classified, attempt, delay);
      try {
        await sleep(delay, options.signal);
      } catch {
        break;
      }
    }
  }
  return {
    success: false,
    error: lastError,
    attempts: attempt,
    totalTime: Date.now() - startTime
  };
}
async function retry(operation, options = {}) {
  const result = await withRetry(operation, options);
  if (result.success) {
    return result.value;
  }
  throw result.error?.original ?? new Error("Operation failed");
}
async function withFallback(operations, options = {}) {
  if (operations.length === 0) {
    if (options.defaultValue !== void 0) {
      return options.defaultValue;
    }
    throw new Error("No fallback operations provided");
  }
  let lastError;
  for (let i = 0; i < operations.length; i++) {
    try {
      if (options.signal?.aborted) {
        throw new Error("Operation aborted");
      }
      return await operations[i]();
    } catch (error) {
      const classified = classifyError(error);
      lastError = classified;
      options.onFallback?.(classified, i);
    }
  }
  if (options.defaultValue !== void 0) {
    return options.defaultValue;
  }
  throw lastError?.original ?? new Error("All fallback operations failed");
}
async function withCircuitBreaker(operation, breaker) {
  if (!breaker.canExecute()) {
    throw new Error("Circuit breaker is open");
  }
  try {
    const result = await operation();
    breaker.recordSuccess();
    return result;
  } catch (error) {
    breaker.recordFailure();
    throw error;
  }
}
function retryable(fn, options = {}) {
  return (...args) => retry(() => fn(...args), options);
}
class RetriesExhaustedError extends Error {
  lastError;
  attempts;
  constructor(lastError, attempts) {
    super(`All ${attempts} retry attempts exhausted: ${lastError.message}`);
    this.name = "RetriesExhaustedError";
    this.lastError = lastError;
    this.attempts = attempts;
  }
}
class CircuitOpenError extends Error {
  constructor(message = "Circuit breaker is open") {
    super(message);
    this.name = "CircuitOpenError";
  }
}
export {
  CircuitBreaker,
  CircuitOpenError,
  CircuitState,
  RetriesExhaustedError,
  calculateBackoff,
  retry,
  retryable,
  sleep,
  withCircuitBreaker,
  withFallback,
  withRetry
};
//# sourceMappingURL=error-recovery.js.map
