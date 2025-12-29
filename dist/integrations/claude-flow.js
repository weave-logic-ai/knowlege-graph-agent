class ClaudeFlowIntegration {
  config;
  constructor(config) {
    this.config = {
      namespace: config.namespace,
      defaultTTL: config.defaultTTL || 0,
      syncOnChange: config.syncOnChange ?? true
    };
  }
  /**
   * Sync all nodes to claude-flow memory
   */
  async syncToMemory(db) {
    const result = {
      synced: 0,
      failed: 0,
      errors: []
    };
    const nodes = db.getAllNodes();
    const entries = [];
    for (const node of nodes) {
      try {
        const entry = this.nodeToMemoryEntry(node);
        entries.push({
          key: `node/${node.id}`,
          value: entry,
          namespace: this.config.namespace,
          ttl: this.config.defaultTTL
        });
      } catch (error) {
        result.failed++;
        result.errors.push({
          key: node.id,
          error: String(error)
        });
      }
    }
    const stats = db.getStats();
    entries.push({
      key: "stats",
      value: stats,
      namespace: this.config.namespace
    });
    entries.push({
      key: "metadata",
      value: {
        lastSync: (/* @__PURE__ */ new Date()).toISOString(),
        nodeCount: nodes.length,
        version: db.getMetadata("version")
      },
      namespace: this.config.namespace
    });
    entries.push({
      key: "index/nodes",
      value: nodes.map((n) => ({
        id: n.id,
        title: n.title,
        type: n.type,
        path: n.path
      })),
      namespace: this.config.namespace
    });
    const tagIndex = this.buildTagIndex(nodes);
    entries.push({
      key: "index/tags",
      value: tagIndex,
      namespace: this.config.namespace
    });
    result.synced = entries.length;
    console.log(`
[Claude-Flow Sync] Would sync ${entries.length} entries to namespace: ${this.config.namespace}`);
    console.log("\nTo sync, run these MCP commands:");
    for (const entry of entries.slice(0, 5)) {
      console.log(`mcp__claude-flow__memory_usage { action: "store", key: "${entry.key}", namespace: "${this.config.namespace}", value: "..." }`);
    }
    if (entries.length > 5) {
      console.log(`... and ${entries.length - 5} more entries`);
    }
    return result;
  }
  /**
   * Sync a single node to memory
   */
  async syncNode(node) {
    try {
      const entry = this.nodeToMemoryEntry(node);
      console.log(`
[Claude-Flow Sync] Syncing node: ${node.id}`);
      console.log(`mcp__claude-flow__memory_usage {`);
      console.log(`  action: "store",`);
      console.log(`  key: "node/${node.id}",`);
      console.log(`  namespace: "${this.config.namespace}",`);
      console.log(`  value: ${JSON.stringify(entry, null, 2)}`);
      console.log(`}`);
      return true;
    } catch (error) {
      console.error(`Failed to sync node ${node.id}: ${error}`);
      return false;
    }
  }
  /**
   * Generate memory retrieval commands
   */
  generateRetrievalCommands() {
    return [
      `// Get graph stats`,
      `mcp__claude-flow__memory_usage { action: "retrieve", key: "stats", namespace: "${this.config.namespace}" }`,
      ``,
      `// Get node index`,
      `mcp__claude-flow__memory_usage { action: "retrieve", key: "index/nodes", namespace: "${this.config.namespace}" }`,
      ``,
      `// Get specific node`,
      `mcp__claude-flow__memory_usage { action: "retrieve", key: "node/<node-id>", namespace: "${this.config.namespace}" }`,
      ``,
      `// Search by pattern`,
      `mcp__claude-flow__memory_search { pattern: "node/*", namespace: "${this.config.namespace}" }`
    ];
  }
  /**
   * Generate hook commands for automatic sync
   */
  generateHookCommands() {
    return [
      `# Pre-task hook to restore graph context`,
      `npx claude-flow@alpha hooks session-restore --session-id "kg-${this.config.namespace}"`,
      ``,
      `# Post-edit hook to sync changes`,
      `npx claude-flow@alpha hooks post-edit --file "<file>" --memory-key "kg/${this.config.namespace}/changes"`,
      ``,
      `# Session end hook to persist`,
      `npx claude-flow@alpha hooks session-end --export-metrics true`
    ];
  }
  /**
   * Convert node to memory entry format
   */
  nodeToMemoryEntry(node) {
    const summary = this.extractSummary(node.content);
    return {
      id: node.id,
      title: node.title,
      type: node.type,
      status: node.status,
      path: node.path,
      tags: node.tags,
      outgoingLinks: node.outgoingLinks.map((l) => l.target),
      incomingLinks: node.incomingLinks.map((l) => l.target),
      summary,
      lastModified: node.lastModified.toISOString()
    };
  }
  /**
   * Extract summary from content
   */
  extractSummary(content, maxLength = 200) {
    const lines = content.split("\n");
    let summary = "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("```")) {
        continue;
      }
      if (trimmed === "---") {
        continue;
      }
      summary = trimmed;
      break;
    }
    if (summary.length > maxLength) {
      summary = summary.slice(0, maxLength - 3) + "...";
    }
    return summary;
  }
  /**
   * Build tag index from nodes
   */
  buildTagIndex(nodes) {
    const index = {};
    for (const node of nodes) {
      for (const tag of node.tags) {
        if (!index[tag]) {
          index[tag] = [];
        }
        index[tag].push(node.id);
      }
    }
    return index;
  }
}
function createClaudeFlowIntegration(config) {
  return new ClaudeFlowIntegration(config);
}
function generateMcpConfig(namespace) {
  return `## Claude-Flow MCP Configuration

Add this to your Claude Code configuration:

\`\`\`bash
claude mcp add claude-flow npx claude-flow@alpha mcp start
\`\`\`

### Memory Namespace

The knowledge graph uses namespace: \`${namespace}\`

### Available Operations

\`\`\`javascript
// Store knowledge
mcp__claude-flow__memory_usage {
  action: "store",
  key: "node/<id>",
  namespace: "${namespace}",
  value: { ... }
}

// Retrieve knowledge
mcp__claude-flow__memory_usage {
  action: "retrieve",
  key: "node/<id>",
  namespace: "${namespace}"
}

// Search knowledge
mcp__claude-flow__memory_search {
  pattern: "node/*",
  namespace: "${namespace}"
}

// List all keys
mcp__claude-flow__memory_usage {
  action: "list",
  namespace: "${namespace}"
}
\`\`\`
`;
}
export {
  ClaudeFlowIntegration,
  createClaudeFlowIntegration,
  generateMcpConfig
};
//# sourceMappingURL=claude-flow.js.map
