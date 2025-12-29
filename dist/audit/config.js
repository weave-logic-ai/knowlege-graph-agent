const DEFAULT_CHECKPOINT_INTERVAL = 100;
const DEFAULT_SYNDICATION_INTERVAL = 5 * 60 * 1e3;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_ROTATE_AFTER_EVENTS = 1e4;
function generateDefaultDid() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `did:exo:agent-${timestamp}${random}`;
}
function createAuditChainConfig() {
  const backend = process.env.EXOCHAIN_BACKEND || "memory";
  const baseConfig = {
    backend,
    agentDid: process.env.EXOCHAIN_AGENT_DID || generateDefaultDid(),
    privateKey: process.env.EXOCHAIN_PRIVATE_KEY,
    enableConsensus: process.env.EXOCHAIN_ENABLE_CONSENSUS === "true",
    consensusType: process.env.EXOCHAIN_CONSENSUS_TYPE || "none",
    checkpointInterval: parseInt(
      process.env.EXOCHAIN_CHECKPOINT_INTERVAL || String(DEFAULT_CHECKPOINT_INTERVAL),
      10
    ),
    enableSyndication: process.env.EXOCHAIN_ENABLE_SYNDICATION === "true",
    syndicationInterval: parseInt(
      process.env.EXOCHAIN_SYNDICATION_INTERVAL || String(DEFAULT_SYNDICATION_INTERVAL),
      10
    ),
    peers: process.env.EXOCHAIN_PEER_ENDPOINTS?.split(",").filter(Boolean) || []
  };
  switch (backend) {
    case "file":
      return {
        ...baseConfig,
        file: {
          dataDir: process.env.EXOCHAIN_DATA_DIR || ".exochain",
          maxFileSize: parseInt(
            process.env.EXOCHAIN_MAX_FILE_SIZE || String(DEFAULT_MAX_FILE_SIZE),
            10
          ),
          rotateAfterEvents: parseInt(
            process.env.EXOCHAIN_ROTATE_AFTER_EVENTS || String(DEFAULT_ROTATE_AFTER_EVENTS),
            10
          )
        }
      };
    case "postgres":
      return {
        ...baseConfig,
        postgres: {
          connectionString: process.env.DATABASE_URL || "postgres://localhost:5432/kg_agent",
          schema: process.env.EXOCHAIN_SCHEMA || "exochain"
        }
      };
    default:
      return baseConfig;
  }
}
function validateAuditChainConfig(config) {
  const errors = [];
  if (!config.agentDid) {
    errors.push("Agent DID is required");
  } else if (!config.agentDid.startsWith("did:")) {
    errors.push('Agent DID must be a valid DID (starting with "did:")');
  }
  if (config.backend === "file") {
    if (!config.file?.dataDir) {
      errors.push("File data directory is required for file backend");
    }
    if (config.file?.maxFileSize !== void 0 && config.file.maxFileSize <= 0) {
      errors.push("Max file size must be positive");
    }
    if (config.file?.rotateAfterEvents !== void 0 && config.file.rotateAfterEvents <= 0) {
      errors.push("Rotate after events must be positive");
    }
  }
  if (config.backend === "postgres") {
    if (!config.postgres?.connectionString) {
      errors.push("PostgreSQL connection string is required for postgres backend");
    }
    if (!config.postgres?.schema) {
      errors.push("PostgreSQL schema is required for postgres backend");
    }
  }
  if (config.enableConsensus && config.consensusType === "none") {
    errors.push("Consensus type must be specified when consensus is enabled");
  }
  if (config.enableSyndication && (!config.peers || config.peers.length === 0)) {
    errors.push("At least one peer is required for syndication");
  }
  if (config.checkpointInterval <= 0) {
    errors.push("Checkpoint interval must be positive");
  }
  if (config.syndicationInterval !== void 0 && config.syndicationInterval <= 0) {
    errors.push("Syndication interval must be positive");
  }
  if (config.privateKey !== void 0) {
    if (!/^[0-9a-fA-F]{128}$/.test(config.privateKey)) {
      errors.push("Private key must be a 64-byte hex string (128 characters)");
    }
  }
  return { valid: errors.length === 0, errors };
}
createAuditChainConfig();
export {
  DEFAULT_CHECKPOINT_INTERVAL,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_ROTATE_AFTER_EVENTS,
  DEFAULT_SYNDICATION_INTERVAL,
  createAuditChainConfig,
  validateAuditChainConfig
};
//# sourceMappingURL=config.js.map
