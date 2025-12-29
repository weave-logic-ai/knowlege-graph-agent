import { createLogger } from "../utils/logger.js";
const logger = createLogger("graphql-context");
function createContextFactory(config) {
  const {
    database,
    cache,
    serviceManager,
    apiKey,
    requireAuth: requireAuth2 = false,
    authenticate
  } = config;
  return async ({ request }) => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const requestMeta = {
      requestId,
      startTime,
      clientIp: extractClientIp(request),
      userAgent: request.headers.get("user-agent") ?? "unknown",
      path: new URL(request.url).pathname
    };
    const authHeader = request.headers.get("authorization");
    const token = extractBearerToken(authHeader);
    let auth;
    if (authenticate) {
      auth = await authenticate(token);
    } else if (apiKey) {
      auth = validateApiKey(token, apiKey);
    } else {
      auth = {
        authenticated: true,
        scopes: ["read", "write"]
      };
    }
    if (requireAuth2 && !auth.authenticated) {
      logger.warn("Unauthenticated request rejected", {
        requestId,
        path: requestMeta.path,
        error: auth.error
      });
    }
    const utils = {
      generateId: () => generateRequestId(),
      log: (level, message, data) => {
        const logData = { ...data, requestId };
        switch (level) {
          case "debug":
            logger.debug(message, logData);
            break;
          case "info":
            logger.info(message, logData);
            break;
          case "warn":
            logger.warn(message, logData);
            break;
          case "error":
            logger.error(message, void 0, logData);
            break;
        }
      },
      getElapsedMs: () => Date.now() - startTime,
      cacheKey: (key) => `req:${requestId}:${key}`
    };
    const services = {
      database,
      cache,
      serviceManager
    };
    logger.debug("GraphQL context created", {
      requestId,
      authenticated: auth.authenticated,
      scopes: auth.scopes
    });
    return {
      auth,
      request: requestMeta,
      services,
      utils
    };
  };
}
function extractBearerToken(header) {
  if (!header) {
    return void 0;
  }
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return void 0;
  }
  return parts[1];
}
function validateApiKey(token, apiKey) {
  if (!token) {
    return {
      authenticated: false,
      scopes: [],
      error: "No authentication token provided"
    };
  }
  if (!constantTimeEqual(token, apiKey)) {
    return {
      authenticated: false,
      scopes: [],
      error: "Invalid API key"
    };
  }
  return {
    authenticated: true,
    userId: "api-key-user",
    scopes: ["read", "write", "admin"]
  };
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}
function extractClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}
function hasScope(context, scope) {
  return context.auth.scopes.includes(scope);
}
function requireAuth(context) {
  if (!context.auth.authenticated) {
    throw new Error(context.auth.error ?? "Authentication required");
  }
}
function requireScope(context, scope) {
  requireAuth(context);
  if (!hasScope(context, scope)) {
    throw new Error(`Permission denied: requires '${scope}' scope`);
  }
}
function isGraphQLContext(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value;
  return typeof obj.auth === "object" && typeof obj.request === "object" && typeof obj.services === "object" && typeof obj.utils === "object";
}
export {
  createContextFactory,
  hasScope,
  isGraphQLContext,
  requireAuth,
  requireScope
};
//# sourceMappingURL=context.js.map
