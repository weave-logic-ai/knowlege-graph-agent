# TypeScript Config Property Fixes - Summary

## Overview

Fixed all TypeScript errors related to incorrect config property references in the Weaver codebase. The WeaverConfig type (defined in `/home/aepod/dev/weave-nn/weaver/src/config/schema.ts`) does not have the properties `mcp`, `fileWatcher`, `memory`, or `shadowCache` at the top level.

## Root Cause

The configuration structure was refactored but some files were still using the old property paths. The correct mappings according to the schema are:

```typescript
// INCORRECT (Old):
config.mcp.enabled
config.fileWatcher.debounce
config.memory.conflictLogPath
config.shadowCache.dbPath

// CORRECT (New):
config.features.mcpEnabled
config.vault.fileWatcher.debounce
'./data/memory-conflicts.log' (hardcoded default)
config.database.path
```

## Files Changed

### 1. `/home/aepod/dev/weave-nn/weaver/src/index.ts`

**Changes:**
- **Line 39**: `config.mcp.enabled` → `config.features.mcpEnabled`
- **Line 52**: `config.mcp.enabled` → `config.features.mcpEnabled`
- **Line 122**: `config.fileWatcher.debounce` → `config.vault.fileWatcher.debounce`
- **Line 158**: `config.mcp.enabled` → `config.features.mcpEnabled`
- **Line 225**: `config.memory.conflictLogPath` → `'./data/memory-conflicts.log'`
- **Line 265**: `config.mcp.enabled` → `config.features.mcpEnabled`
- **Line 326**: `config.mcp.enabled` → `config.features.mcpEnabled`

**Details:**

```typescript
// Startup logging
logger.info('Starting Weaver application', {
  vaultPath: config.vault.path,
  featureAiEnabled: config.features.aiEnabled,
  featureMcpServer: config.features.mcpEnabled,  // FIXED
  gitAutoCommit: config.git.autoCommit,
});

// Activity logger
await activityLogger.logPrompt('Starting Weaver application', {
  vaultPath: config.vault.path,
  features: {
    ai: config.features.aiEnabled,
    mcp: config.features.mcpEnabled,  // FIXED
    git: config.git.autoCommit,
  },
  timestamp: new Date().toISOString(),
});

// File watcher initialization
fileWatcher = new FileWatcher({
  watchPath: config.vault.path,
  ignored: ['.weaver', '.obsidian', '.git', 'node_modules', '.archive'],
  debounceDelay: config.vault.fileWatcher.debounce || 1000,  // FIXED
  enabled: true,
});

// MCP server conditional initialization
if (config.features.mcpEnabled) {  // FIXED
  logger.info('Initializing MCP server...');
  // ... server setup
}

// Memory sync configuration
const vaultSync = new VaultMemorySync({
  memoryClient,
  shadowCache,
  vaultPath: config.vault.path,
  obsidianApiUrl: config.obsidian.apiUrl,
  obsidianApiKey: config.obsidian.apiKey,
  conflictLogPath: './data/memory-conflicts.log',  // FIXED
});

// Service tracking
if (config.features.mcpEnabled) initializedServices.push('mcp-server');  // FIXED

// Process management
if (!config.features.mcpEnabled) {  // FIXED
  await new Promise(() => {});
} else {
  await mcpServer!.run();
}
```

### 2. `/home/aepod/dev/weave-nn/weaver/src/mcp-server/bin.ts`

**Changes:**
- **Line 21**: `config.shadowCache.dbPath` → `config.database.path`
- **Line 27**: `config.shadowCache.dbPath` → `config.database.path`

**Details:**

```typescript
// Configuration logging
logger.info('Configuration loaded', {
  dbPath: config.database.path,  // FIXED
  vaultPath: config.vault.path,
  workflowsEnabled: config.workflows.enabled,
});

// Shadow cache initialization
const shadowCache = createShadowCache(
  config.database.path,  // FIXED
  config.vault.path
);
```

## Configuration Schema Reference

The correct WeaverConfig structure (from `src/config/schema.ts`):

```typescript
export interface WeaverConfig {
  version: string;
  server: ServerConfig;
  database: DatabaseConfig;          // Contains: path, backupDir, autoBackup, syncInterval
  workflows: WorkflowsConfig;
  embeddings: EmbeddingsConfig;
  perception: PerceptionConfig;
  learning: LearningConfig;
  git: GitConfig;
  vault: VaultConfig;                // Contains: path, fileWatcher
  obsidian: ObsidianConfig;
  ai: AIConfig;
  features: FeatureFlags;            // Contains: mcpEnabled, mcpTransport, etc.
}

export interface VaultConfig {
  path: string;
  fileWatcher: {                     // File watcher nested under vault
    enabled: boolean;
    debounce: number;
    ignore: string[];
  };
}

export interface FeatureFlags {
  aiEnabled: boolean;
  temporalEnabled: boolean;
  graphAnalytics: boolean;
  mcpEnabled: boolean;               // MCP flag is here
  mcpTransport: 'stdio' | 'http';
}

export interface DatabaseConfig {
  path: string;                      // Shadow cache uses this
  backupDir: string;
  autoBackup: boolean;
  syncInterval: number;
}
```

## Verification

After fixes, the build output shows:
- ✅ No errors for `config.mcp`
- ✅ No errors for `config.fileWatcher`
- ✅ No errors for `config.memory`
- ✅ No errors for `config.shadowCache`
- ✅ No TS2339 errors (Property does not exist on type)

The remaining build errors are unrelated to config properties and involve other type issues (JSONSchemaType, logger arguments, etc.).

## Memory Conflict Log Path Decision

For `config.memory.conflictLogPath`, we chose to hardcode the default value `'./data/memory-conflicts.log'` rather than adding a MemoryConfig interface because:

1. The schema doesn't currently have a memory configuration section
2. Adding it would require schema migration
3. The value is only used in one place
4. It's a sensible default that aligns with other data paths

If memory configuration becomes more complex, a MemoryConfig interface should be added to the schema.

## Impact

All TypeScript compilation errors related to incorrect config property references have been resolved. The application now correctly accesses configuration values according to the WeaverConfig schema.

## Files Modified
- `/home/aepod/dev/weave-nn/weaver/src/index.ts` (7 fixes)
- `/home/aepod/dev/weave-nn/weaver/src/mcp-server/bin.ts` (2 fixes)

**Total fixes: 9 config property corrections**
