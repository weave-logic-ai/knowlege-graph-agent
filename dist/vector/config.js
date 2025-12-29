const DEFAULT_HNSW_CONFIG = {
  m: 16,
  efConstruction: 200,
  efSearch: 100
};
const DEFAULT_INDEX_CONFIG = {
  dimensions: 1536,
  distanceMetric: "cosine",
  indexType: "hnsw",
  hnswConfig: DEFAULT_HNSW_CONFIG
};
function createRuVectorConfig() {
  const backend = process.env.RUVECTOR_BACKEND || "memory";
  const dimensions = parseInt(process.env.RUVECTOR_DIMENSIONS || "384", 10);
  const baseConfig = {
    backend,
    index: {
      ...DEFAULT_INDEX_CONFIG,
      dimensions
    },
    enableSona: process.env.RUVECTOR_ENABLE_SONA === "true",
    enableTrajectoryTracking: process.env.RUVECTOR_ENABLE_TRAJECTORY === "true"
  };
  switch (backend) {
    case "postgres":
      return {
        ...baseConfig,
        postgres: {
          connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/kg_agent",
          schema: process.env.RUVECTOR_SCHEMA || "ruvector"
        }
      };
    case "cloud":
      return {
        ...baseConfig,
        cloud: {
          url: process.env.RUVECTOR_CLOUD_URL || "",
          apiKey: process.env.RUVECTOR_API_KEY
        }
      };
    case "standalone":
      return {
        ...baseConfig,
        standalone: {
          dataDir: process.env.RUVECTOR_DATA_DIR || ".ruvector"
        }
      };
    default:
      return baseConfig;
  }
}
function validateRuVectorConfig(config) {
  const errors = [];
  const warnings = [];
  if (config.index.dimensions < 1) {
    errors.push("Dimensions must be at least 1");
  }
  if (config.index.dimensions > 4096) {
    warnings.push("Dimensions > 4096 may impact performance");
  }
  if (!Number.isInteger(config.index.dimensions)) {
    errors.push("Vector dimensions must be an integer");
  }
  if (config.backend === "postgres" && !config.postgres?.connectionString) {
    errors.push("PostgreSQL connection string required for postgres backend");
  }
  if (config.backend === "cloud" && !config.cloud?.url) {
    errors.push("Cloud URL required for cloud backend");
  }
  if (config.backend === "standalone" && !config.standalone?.dataDir) {
    errors.push("Data directory required for standalone backend");
  }
  if (config.index.indexType === "hnsw" && config.index.hnswConfig) {
    const { m, efConstruction, efSearch } = config.index.hnswConfig;
    if (m < 2 || m > 100) {
      errors.push("HNSW m must be between 2 and 100");
    }
    if (efConstruction < m) {
      warnings.push("efConstruction should be >= m for good index quality");
    }
    if (efSearch < 10) {
      warnings.push("efSearch < 10 may result in poor recall");
    }
  }
  if (config.cache?.enabled) {
    if (config.cache.maxSize < 1) {
      errors.push("Cache maxSize must be at least 1");
    }
    if (config.cache.ttlSeconds < 1) {
      errors.push("Cache TTL must be at least 1 second");
    }
  }
  if (config.performance) {
    if (config.performance.batchSize < 1) {
      errors.push("Batch size must be at least 1");
    }
    if (config.performance.maxConcurrency < 1) {
      errors.push("Max concurrency must be at least 1");
    }
    if (config.performance.memoryLimitMb && config.performance.memoryLimitMb < 64) {
      warnings.push("Memory limit < 64MB may cause issues");
    }
  }
  if (config.hybrid?.enabled && !config.hybrid.graphConnection) {
    warnings.push("Hybrid search enabled but no graph connection configured");
  }
  const validMetrics = ["cosine", "euclidean", "dotProduct", "manhattan"];
  if (!validMetrics.includes(config.index.distanceMetric)) {
    errors.push(`Invalid distance metric: ${config.index.distanceMetric}`);
  }
  const validIndexTypes = ["hnsw", "flat", "ivf", "pq"];
  if (!validIndexTypes.includes(config.index.indexType)) {
    errors.push(`Invalid index type: ${config.index.indexType}`);
  }
  return { valid: errors.length === 0, errors, warnings };
}
createRuVectorConfig();
export {
  DEFAULT_HNSW_CONFIG,
  DEFAULT_INDEX_CONFIG,
  createRuVectorConfig,
  validateRuVectorConfig
};
//# sourceMappingURL=config.js.map
