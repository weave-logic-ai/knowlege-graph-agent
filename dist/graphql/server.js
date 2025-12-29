import { createServer } from "http";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { useServer } from "../node_modules/graphql-ws/lib/use/ws.js";
import { b as browserExports } from "../_virtual/browser.js";
import { createLogger } from "../utils/logger.js";
import { createContextFactory } from "./context.js";
import { customScalars } from "./scalars.js";
import { createYoga } from "../node_modules/graphql-yoga/esm/server.js";
import { makeExecutableSchema } from "../node_modules/@graphql-tools/schema/esm/makeExecutableSchema.js";
const logger = createLogger("graphql-server");
function createGraphQLServer(config) {
  const {
    port,
    host = "0.0.0.0",
    graphqlPath = "/graphql",
    healthPath = "/health",
    enableGraphiQL = true,
    enableSubscriptions = true,
    cors = {},
    database,
    cache,
    serviceManager,
    apiKey,
    requireAuth = false,
    resolvers: customResolvers = {},
    schemaPath
  } = config;
  let httpServer = null;
  let wsServer = null;
  let isServerRunning = false;
  const startTime = Date.now();
  const typeDefs = loadSchema(schemaPath);
  const resolvers = {
    ...customScalars,
    ...createDefaultResolvers(),
    ...customResolvers
  };
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });
  const contextFactory = createContextFactory({
    database,
    cache,
    serviceManager,
    apiKey,
    requireAuth
  });
  const corsConfig = buildCorsConfig(cors);
  const yoga = createYoga({
    schema,
    context: contextFactory,
    graphqlEndpoint: graphqlPath,
    graphiql: enableGraphiQL ? {
      title: "Knowledge Graph API",
      defaultQuery: DEFAULT_QUERY,
      subscriptionsProtocol: "WS"
    } : false,
    cors: {
      origin: Array.isArray(corsConfig.origin) ? corsConfig.origin : corsConfig.origin === true ? "*" : [],
      methods: corsConfig.methods,
      allowedHeaders: corsConfig.allowedHeaders,
      exposedHeaders: corsConfig.exposedHeaders,
      credentials: corsConfig.credentials,
      maxAge: corsConfig.maxAge
    },
    logging: {
      debug: (...args) => logger.debug("GraphQL", { args }),
      info: (...args) => logger.info(args.join(" ")),
      warn: (...args) => logger.warn(args.join(" ")),
      error: (...args) => logger.error(args.join(" "))
    },
    maskedErrors: process.env.NODE_ENV === "production",
    landingPage: false
  });
  httpServer = createServer(async (req, res) => {
    if (req.url === healthPath && req.method === "GET") {
      const health = await getHealthCheck(database, cache, serviceManager, startTime);
      const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;
      res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      });
      res.end(JSON.stringify(health));
      return;
    }
    if (req.method === "OPTIONS") {
      handleCorsPreFlight(req, res, corsConfig);
      return;
    }
    yoga.handle(req, res);
  });
  if (enableSubscriptions) {
    wsServer = new browserExports.WebSocketServer({
      server: httpServer,
      path: graphqlPath
    });
    useServer(
      {
        schema,
        context: async (ctx) => {
          const request = new Request(`ws://${host}:${port}${graphqlPath}`, {
            headers: ctx.connectionParams
          });
          return contextFactory({ request });
        },
        onConnect: () => {
          logger.info("WebSocket client connected");
          return true;
        },
        onDisconnect: (ctx, code, reason) => {
          logger.info("WebSocket client disconnected", { code, reason: reason?.toString() });
        },
        onError: (ctx, message, errors) => {
          logger.error("WebSocket error", void 0, { message, errors });
        }
      },
      wsServer
    );
    logger.info("WebSocket subscriptions enabled", { path: graphqlPath });
  }
  return {
    async start() {
      if (isServerRunning) {
        logger.warn("Server already running");
        return;
      }
      return new Promise((resolve, reject) => {
        httpServer.listen(port, host, () => {
          isServerRunning = true;
          logger.info("GraphQL server started", {
            url: `http://${host}:${port}${graphqlPath}`,
            graphiql: enableGraphiQL ? `http://${host}:${port}${graphqlPath}` : "disabled",
            health: `http://${host}:${port}${healthPath}`,
            subscriptions: enableSubscriptions ? `ws://${host}:${port}${graphqlPath}` : "disabled"
          });
          resolve();
        });
        httpServer.on("error", (error) => {
          logger.error("Server error", error);
          reject(error);
        });
      });
    },
    async stop() {
      if (!isServerRunning) {
        return;
      }
      logger.info("Stopping GraphQL server...");
      if (wsServer) {
        await new Promise((resolve) => {
          wsServer.close(() => {
            logger.debug("WebSocket server closed");
            resolve();
          });
        });
      }
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
          } else {
            isServerRunning = false;
            logger.info("GraphQL server stopped");
            resolve();
          }
        });
      });
    },
    getHttpServer() {
      return httpServer;
    },
    getYoga() {
      return yoga;
    },
    isRunning() {
      return isServerRunning;
    },
    getUrl() {
      return `http://${host}:${port}${graphqlPath}`;
    }
  };
}
function loadSchema(customPath) {
  if (customPath && existsSync(customPath)) {
    logger.debug("Loading schema from custom path", { path: customPath });
    return readFileSync(customPath, "utf-8");
  }
  const searchPaths = [
    join(process.cwd(), "src/graphql/schema.graphql"),
    join(process.cwd(), "graphql/schema.graphql"),
    join(process.cwd(), "schema.graphql"),
    // For dist builds
    join(process.cwd(), "dist/graphql/schema.graphql")
  ];
  for (const schemaPath of searchPaths) {
    if (existsSync(schemaPath)) {
      logger.debug("Loading schema from path", { path: schemaPath });
      return readFileSync(schemaPath, "utf-8");
    }
  }
  throw new Error(
    `GraphQL schema not found. Tried: ${[customPath, ...searchPaths].filter(Boolean).join(", ")}`
  );
}
function createDefaultResolvers() {
  return {
    Query: {
      // System health query
      health: async (_parent, _args, context) => {
        const { services } = context;
        const dbHealthy = !!services.database;
        const cacheHealthy = !!services.cache;
        return {
          status: dbHealthy && cacheHealthy ? "HEALTHY" : "DEGRADED",
          components: {
            database: dbHealthy,
            cache: cacheHealthy,
            agents: true,
            // Would check agent registry
            vectorStore: false
            // Not implemented yet
          },
          uptime: process.uptime() * 1e3,
          requestCount: 0,
          // Would track in context
          toolCount: 0
          // Would count MCP tools
        };
      },
      // Version info query
      version: () => ({
        version: process.env.npm_package_version ?? "0.0.0",
        buildTime: null,
        gitCommit: process.env.GIT_COMMIT ?? null,
        nodeVersion: process.version,
        schemaVersion: "1.0.0"
      })
    },
    // Subscription resolvers would be added here
    Subscription: {}
  };
}
function buildCorsConfig(cors) {
  const origin = cors.origin === true ? true : cors.origin === false ? false : Array.isArray(cors.origin) ? cors.origin : cors.origin ? [cors.origin] : ["http://localhost:3000", "http://localhost:5173"];
  return {
    origin: origin === false ? [] : origin,
    methods: cors.methods ?? ["GET", "POST", "OPTIONS"],
    allowedHeaders: cors.allowedHeaders ?? ["Content-Type", "Authorization", "X-Request-ID"],
    exposedHeaders: cors.exposedHeaders ?? ["X-Request-ID"],
    credentials: cors.credentials ?? true,
    maxAge: cors.maxAge ?? 86400
    // 24 hours
  };
}
function handleCorsPreFlight(req, res, corsConfig) {
  const origin = req.headers.origin;
  if (origin && (corsConfig.origin === true || Array.isArray(corsConfig.origin) && corsConfig.origin.includes(origin))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", corsConfig.methods.join(", "));
  res.setHeader("Access-Control-Allow-Headers", corsConfig.allowedHeaders.join(", "));
  res.setHeader("Access-Control-Max-Age", corsConfig.maxAge.toString());
  if (corsConfig.credentials) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.writeHead(204);
  res.end();
}
async function getHealthCheck(database, cache, serviceManager, startTime) {
  let dbHealthy = false;
  let cacheHealthy = false;
  let servicesHealthy = false;
  try {
    const db = database.getDatabase();
    db.prepare("SELECT 1").get();
    dbHealthy = true;
  } catch (error) {
    logger.error("Database health check failed", error instanceof Error ? error : void 0);
  }
  try {
    cache.set("_health_check", Date.now(), { ttl: 1e3 });
    const value = cache.get("_health_check");
    cacheHealthy = value !== void 0;
    cache.delete("_health_check");
  } catch (error) {
    logger.error("Cache health check failed", error instanceof Error ? error : void 0);
  }
  try {
    const states = serviceManager.getAllStates();
    const runningCount = Array.from(states.values()).filter((s) => s.status === "running").length;
    servicesHealthy = runningCount >= 0;
  } catch (error) {
    logger.error("Services health check failed", error instanceof Error ? error : void 0);
  }
  const allHealthy = dbHealthy && cacheHealthy && servicesHealthy;
  const anyHealthy = dbHealthy || cacheHealthy || servicesHealthy;
  return {
    status: allHealthy ? "healthy" : anyHealthy ? "degraded" : "unhealthy",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    uptime: Date.now() - startTime,
    version: process.env.npm_package_version ?? "0.0.0",
    components: {
      database: dbHealthy,
      cache: cacheHealthy,
      services: servicesHealthy
    }
  };
}
const DEFAULT_QUERY = `# Welcome to the Knowledge Graph API
#
# Try these example queries:

query SystemHealth {
  health {
    status
    components {
      database
      cache
      agents
      vectorStore
    }
    uptime
    requestCount
    toolCount
  }
}

query SystemVersion {
  version {
    version
    nodeVersion
    schemaVersion
  }
}

# Uncomment to query graph stats:
# query GraphStats {
#   graphStats {
#     totalNodes
#     totalEdges
#     nodesByType {
#       type
#       count
#     }
#     orphanNodes
#     avgLinksPerNode
#   }
# }

# Uncomment to search nodes:
# query SearchNodes($query: String!) {
#   search(query: $query) {
#     totalMatches
#     nodes {
#       id
#       title
#       type
#       tags
#     }
#   }
# }
`;
export {
  createGraphQLServer
};
//# sourceMappingURL=server.js.map
