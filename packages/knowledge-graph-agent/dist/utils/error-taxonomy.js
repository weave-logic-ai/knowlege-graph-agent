var ErrorCategory = /* @__PURE__ */ ((ErrorCategory2) => {
  ErrorCategory2["TRANSIENT"] = "transient";
  ErrorCategory2["PERMANENT"] = "permanent";
  ErrorCategory2["RATE_LIMIT"] = "rate_limit";
  ErrorCategory2["NETWORK"] = "network";
  ErrorCategory2["VALIDATION"] = "validation";
  ErrorCategory2["RESOURCE"] = "resource";
  ErrorCategory2["CONFIGURATION"] = "configuration";
  ErrorCategory2["TIMEOUT"] = "timeout";
  ErrorCategory2["UNKNOWN"] = "unknown";
  return ErrorCategory2;
})(ErrorCategory || {});
var ErrorSeverity = /* @__PURE__ */ ((ErrorSeverity2) => {
  ErrorSeverity2["INFO"] = "info";
  ErrorSeverity2["WARNING"] = "warning";
  ErrorSeverity2["ERROR"] = "error";
  ErrorSeverity2["CRITICAL"] = "critical";
  ErrorSeverity2["FATAL"] = "fatal";
  return ErrorSeverity2;
})(ErrorSeverity || {});
const TRANSIENT_NETWORK_CODES = /* @__PURE__ */ new Set([
  "ECONNRESET",
  "ENOTFOUND",
  "ECONNREFUSED",
  "EPIPE",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH"
]);
const TIMEOUT_CODES = /* @__PURE__ */ new Set([
  "ETIMEDOUT",
  "ABORT_ERR",
  "ERR_TIMEOUT"
]);
const TRANSIENT_STATUS_CODES = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504,
  // Gateway Timeout
  520,
  // Cloudflare Web Server Error
  522,
  // Cloudflare Connection Timed Out
  524
  // Cloudflare Timeout
]);
const RATE_LIMIT_STATUS_CODES = /* @__PURE__ */ new Set([
  429
  // Too Many Requests
]);
const PERMANENT_STATUS_CODES = /* @__PURE__ */ new Set([
  400,
  // Bad Request
  401,
  // Unauthorized
  403,
  // Forbidden
  404,
  // Not Found
  405,
  // Method Not Allowed
  406,
  // Not Acceptable
  410,
  // Gone
  415,
  // Unsupported Media Type
  422,
  // Unprocessable Entity
  451
  // Unavailable For Legal Reasons
]);
function extractStatusCode(error) {
  if (error === null || error === void 0) return void 0;
  if (typeof error === "object") {
    const obj = error;
    if (typeof obj.status === "number") return obj.status;
    if (typeof obj.statusCode === "number") return obj.statusCode;
    if (obj.response && typeof obj.response === "object") {
      const response = obj.response;
      if (typeof response.status === "number") return response.status;
      if (typeof response.statusCode === "number") return response.statusCode;
    }
  }
  return void 0;
}
function extractErrorCode(error) {
  if (error === null || error === void 0) return void 0;
  if (typeof error === "object") {
    const obj = error;
    if (typeof obj.code === "string") return obj.code;
    if (typeof obj.errno === "string") return obj.errno;
  }
  return void 0;
}
function extractMessage(error) {
  if (error === null) return "Null error";
  if (error === void 0) return "Undefined error";
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const obj = error;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
  }
  if (typeof error === "string") return error;
  return "Unknown error";
}
function isTimeoutMessage(message) {
  const lowerMessage = message.toLowerCase();
  return lowerMessage.includes("timeout") || lowerMessage.includes("timed out") || lowerMessage.includes("deadline exceeded") || lowerMessage.includes("aborted");
}
function isValidationMessage(message) {
  const lowerMessage = message.toLowerCase();
  return lowerMessage.includes("validation") || lowerMessage.includes("invalid") || lowerMessage.includes("schema") || lowerMessage.includes("required") || lowerMessage.includes("must be");
}
function isConfigurationMessage(message) {
  const lowerMessage = message.toLowerCase();
  return lowerMessage.includes("config") || lowerMessage.includes("setting") || lowerMessage.includes("environment") || lowerMessage.includes("missing key") || lowerMessage.includes("api key");
}
function isResourceMessage(message) {
  const lowerMessage = message.toLowerCase();
  return lowerMessage.includes("not found") || lowerMessage.includes("no such file") || lowerMessage.includes("permission denied") || lowerMessage.includes("access denied") || lowerMessage.includes("enoent");
}
function classifyError(error) {
  const message = extractMessage(error);
  const code = extractErrorCode(error);
  const statusCode = extractStatusCode(error);
  let category = "unknown";
  let severity = "error";
  let retryable = false;
  let suggestedDelay = 1e3;
  if (statusCode && RATE_LIMIT_STATUS_CODES.has(statusCode)) {
    category = "rate_limit";
    severity = "warning";
    retryable = true;
    suggestedDelay = 5e3;
  } else if (statusCode && TRANSIENT_STATUS_CODES.has(statusCode)) {
    category = "transient";
    severity = "warning";
    retryable = true;
    suggestedDelay = 1e3;
  } else if (statusCode && PERMANENT_STATUS_CODES.has(statusCode)) {
    category = "permanent";
    severity = "error";
    retryable = false;
    suggestedDelay = 0;
  } else if (code && TIMEOUT_CODES.has(code) || isTimeoutMessage(message)) {
    category = "timeout";
    severity = "warning";
    retryable = true;
    suggestedDelay = 5e3;
  } else if (code && TRANSIENT_NETWORK_CODES.has(code)) {
    category = "network";
    severity = "warning";
    retryable = true;
    suggestedDelay = 2e3;
  } else if (isValidationMessage(message)) {
    category = "validation";
    severity = "error";
    retryable = false;
    suggestedDelay = 0;
  } else if (isConfigurationMessage(message)) {
    category = "configuration";
    severity = "critical";
    retryable = false;
    suggestedDelay = 0;
  } else if (code === "ENOENT" || code === "EACCES" || isResourceMessage(message)) {
    category = "resource";
    severity = "error";
    retryable = false;
    suggestedDelay = 0;
  }
  return {
    original: error,
    category,
    severity,
    retryable,
    suggestedDelay,
    message,
    code,
    statusCode
  };
}
function isRetryableError(error) {
  return classifyError(error).retryable;
}
function isTransientError(error) {
  const classified = classifyError(error);
  return classified.category === "transient" || classified.category === "network" || classified.category === "timeout";
}
function isRateLimitError(error) {
  return classifyError(error).category === "rate_limit";
}
function isPermanentError(error) {
  const classified = classifyError(error);
  return classified.category === "permanent" || classified.category === "validation" || classified.category === "configuration" || classified.category === "resource";
}
class KnowledgeGraphError extends Error {
  category;
  severity;
  retryable;
  code;
  context;
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = "KnowledgeGraphError";
    this.category = options.category ?? "unknown";
    this.severity = options.severity ?? "error";
    this.retryable = options.retryable ?? false;
    this.code = options.code;
    this.context = options.context;
  }
}
function createValidationError(message, context) {
  return new KnowledgeGraphError(message, {
    category: "validation",
    severity: "error",
    retryable: false,
    code: "VALIDATION_ERROR",
    context
  });
}
function createConfigurationError(message, context) {
  return new KnowledgeGraphError(message, {
    category: "configuration",
    severity: "critical",
    retryable: false,
    code: "CONFIGURATION_ERROR",
    context
  });
}
function createResourceError(message, context) {
  return new KnowledgeGraphError(message, {
    category: "resource",
    severity: "error",
    retryable: false,
    code: "RESOURCE_ERROR",
    context
  });
}
export {
  ErrorCategory,
  ErrorSeverity,
  KnowledgeGraphError,
  classifyError,
  createConfigurationError,
  createResourceError,
  createValidationError,
  isPermanentError,
  isRateLimitError,
  isRetryableError,
  isTransientError
};
//# sourceMappingURL=error-taxonomy.js.map
