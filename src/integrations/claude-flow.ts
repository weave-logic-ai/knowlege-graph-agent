/**
 * Claude-Flow Integration
 *
 * Integrates knowledge graph with claude-flow memory and coordination.
 */

import type {
  KnowledgeNode,
  GraphStats,
  MemoryEntry,
  SyncResult,
} from '../core/types.js';
import { KnowledgeGraphDatabase } from '../core/database.js';

/**
 * Claude-Flow client configuration
 */
export interface ClaudeFlowConfig {
  namespace: string;
  defaultTTL?: number;
  syncOnChange?: boolean;
}

/**
 * Memory entry for knowledge graph node
 */
interface NodeMemoryEntry {
  id: string;
  title: string;
  type: string;
  status: string;
  path: string;
  tags: string[];
  outgoingLinks: string[];
  incomingLinks: string[];
  summary?: string;
  lastModified: string;
}

/**
 * Claude-Flow Knowledge Graph Integration
 *
 * Syncs knowledge graph data with claude-flow memory for
 * cross-session persistence and agent coordination.
 */
export class ClaudeFlowIntegration {
  private config: Required<ClaudeFlowConfig>;

  constructor(config: ClaudeFlowConfig) {
    this.config = {
      namespace: config.namespace,
      defaultTTL: config.defaultTTL || 0,
      syncOnChange: config.syncOnChange ?? true,
    };
  }

  /**
   * Sync all nodes to claude-flow memory
   */
  async syncToMemory(db: KnowledgeGraphDatabase): Promise<SyncResult> {
    const result: SyncResult = {
      synced: 0,
      failed: 0,
      errors: [],
    };

    const nodes = db.getAllNodes();
    const entries: MemoryEntry[] = [];

    // Convert nodes to memory entries
    for (const node of nodes) {
      try {
        const entry = this.nodeToMemoryEntry(node);
        entries.push({
          key: `node/${node.id}`,
          value: entry,
          namespace: this.config.namespace,
          ttl: this.config.defaultTTL,
        });
      } catch (error) {
        result.failed++;
        result.errors.push({
          key: node.id,
          error: String(error),
        });
      }
    }

    // Store graph stats
    const stats = db.getStats();
    entries.push({
      key: 'stats',
      value: stats,
      namespace: this.config.namespace,
    });

    // Store metadata
    entries.push({
      key: 'metadata',
      value: {
        lastSync: new Date().toISOString(),
        nodeCount: nodes.length,
        version: db.getMetadata('version'),
      },
      namespace: this.config.namespace,
    });

    // Store index of all node IDs for quick lookup
    entries.push({
      key: 'index/nodes',
      value: nodes.map(n => ({
        id: n.id,
        title: n.title,
        type: n.type,
        path: n.path,
      })),
      namespace: this.config.namespace,
    });

    // Store tag index
    const tagIndex = this.buildTagIndex(nodes);
    entries.push({
      key: 'index/tags',
      value: tagIndex,
      namespace: this.config.namespace,
    });

    // Log what would be synced (MCP call would happen here)
    result.synced = entries.length;

    // Generate MCP commands for actual sync
    console.log(`\n[Claude-Flow Sync] Would sync ${entries.length} entries to namespace: ${this.config.namespace}`);
    console.log('\nTo sync, run these MCP commands:');

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
  async syncNode(node: KnowledgeNode): Promise<boolean> {
    try {
      const entry = this.nodeToMemoryEntry(node);

      // Generate MCP command
      console.log(`\n[Claude-Flow Sync] Syncing node: ${node.id}`);
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
  generateRetrievalCommands(): string[] {
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
      `mcp__claude-flow__memory_search { pattern: "node/*", namespace: "${this.config.namespace}" }`,
    ];
  }

  /**
   * Generate hook commands for automatic sync
   */
  generateHookCommands(): string[] {
    return [
      `# Pre-task hook to restore graph context`,
      `npx claude-flow@alpha hooks session-restore --session-id "kg-${this.config.namespace}"`,
      ``,
      `# Post-edit hook to sync changes`,
      `npx claude-flow@alpha hooks post-edit --file "<file>" --memory-key "kg/${this.config.namespace}/changes"`,
      ``,
      `# Session end hook to persist`,
      `npx claude-flow@alpha hooks session-end --export-metrics true`,
    ];
  }

  /**
   * Convert node to memory entry format
   */
  private nodeToMemoryEntry(node: KnowledgeNode): NodeMemoryEntry {
    // Extract first paragraph as summary
    const summary = this.extractSummary(node.content);

    return {
      id: node.id,
      title: node.title,
      type: node.type,
      status: node.status,
      path: node.path,
      tags: node.tags,
      outgoingLinks: node.outgoingLinks.map(l => l.target),
      incomingLinks: node.incomingLinks.map(l => l.target),
      summary,
      lastModified: node.lastModified.toISOString(),
    };
  }

  /**
   * Extract summary from content
   */
  private extractSummary(content: string, maxLength = 200): string {
    // Skip frontmatter and headers
    const lines = content.split('\n');
    let summary = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines, headers, and code blocks
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```')) {
        continue;
      }

      // Skip frontmatter markers
      if (trimmed === '---') {
        continue;
      }

      summary = trimmed;
      break;
    }

    // Truncate if needed
    if (summary.length > maxLength) {
      summary = summary.slice(0, maxLength - 3) + '...';
    }

    return summary;
  }

  /**
   * Build tag index from nodes
   */
  private buildTagIndex(nodes: KnowledgeNode[]): Record<string, string[]> {
    const index: Record<string, string[]> = {};

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

/**
 * Create claude-flow integration instance
 */
export function createClaudeFlowIntegration(
  config: ClaudeFlowConfig
): ClaudeFlowIntegration {
  return new ClaudeFlowIntegration(config);
}

/**
 * Generate MCP configuration for CLAUDE.md
 */
export function generateMcpConfig(namespace: string): string {
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
