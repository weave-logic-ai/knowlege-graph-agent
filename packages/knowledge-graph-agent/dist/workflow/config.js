function createWorkflowConfig() {
  const worldType = process.env.WORKFLOW_WORLD || "local";
  switch (worldType) {
    case "postgres":
      return {
        world: "postgres",
        postgres: {
          connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/kg_agent",
          schema: "workflow",
          poolConfig: {
            max: 20,
            idleTimeoutMillis: 3e4
          }
        }
      };
    case "vercel":
      return {
        world: "vercel",
        vercel: {
          projectId: process.env.VERCEL_PROJECT_ID
        }
      };
    default:
      return {
        world: "local",
        local: {
          dataDir: ".workflow"
        }
      };
  }
}
function validateWorkflowConfig(config) {
  switch (config.world) {
    case "postgres":
      if (!config.postgres?.connectionString) {
        throw new Error("PostgreSQL configuration requires a connectionString");
      }
      if (!config.postgres?.schema) {
        throw new Error("PostgreSQL configuration requires a schema name");
      }
      break;
    case "vercel":
      break;
    case "local":
      if (!config.local?.dataDir) {
        throw new Error("Local configuration requires a dataDir path");
      }
      break;
    default:
      throw new Error(`Unknown world type: ${config.world}`);
  }
  return true;
}
function createPostgresConfig(connectionString, options) {
  return {
    world: "postgres",
    postgres: {
      connectionString,
      schema: options?.schema || "workflow",
      poolConfig: options?.poolConfig || {
        max: 20,
        idleTimeoutMillis: 3e4
      }
    }
  };
}
function createVercelConfig(projectId) {
  return {
    world: "vercel",
    vercel: {
      projectId
    }
  };
}
function createLocalConfig(dataDir = ".workflow") {
  return {
    world: "local",
    local: {
      dataDir
    }
  };
}
const defaultConfig = createWorkflowConfig();
export {
  createLocalConfig,
  createPostgresConfig,
  createVercelConfig,
  createWorkflowConfig,
  defaultConfig,
  validateWorkflowConfig
};
//# sourceMappingURL=config.js.map
