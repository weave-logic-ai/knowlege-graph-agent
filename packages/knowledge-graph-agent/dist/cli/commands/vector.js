import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { join } from "path";
import { existsSync } from "fs";
import "../../vector/config.js";
import { createVectorStore } from "../../vector/services/vector-store.js";
import { createTrajectoryTracker } from "../../vector/services/trajectory-tracker.js";
import "../../vector/services/embedding-service.js";
import "../../vector/services/hybrid-search.js";
import { validateProjectRoot } from "../../core/security.js";
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function formatDuration(ms) {
  if (ms < 1e3) return `${ms}ms`;
  if (ms < 6e4) return `${(ms / 1e3).toFixed(2)}s`;
  if (ms < 36e5) return `${(ms / 6e4).toFixed(2)}m`;
  return `${(ms / 36e5).toFixed(2)}h`;
}
function formatRow(cells, widths) {
  return cells.map((cell, i) => cell.padEnd(widths[i])).join("  ");
}
function printTable(headers, rows, options = {}) {
  const indent = "  ".repeat(options.indent ?? 1);
  const headerColor = options.headerColor ?? chalk.white;
  const widths = headers.map((h, i) => {
    const maxRowWidth = Math.max(...rows.map((r) => (r[i] || "").length));
    return Math.max(h.length, maxRowWidth);
  });
  console.log(indent + headerColor(formatRow(headers, widths)));
  console.log(indent + chalk.gray("-".repeat(widths.reduce((a, b) => a + b + 2, 0))));
  for (const row of rows) {
    console.log(indent + chalk.gray(formatRow(row, widths)));
  }
}
function createVectorCommand() {
  const vector = new Command("vector").alias("vec").description("Vector operations for semantic search and trajectory tracking");
  vector.command("search <query>").description("Perform semantic search on vector store").option("-p, --path <path>", "Project root path", ".").option("-k, --top-k <n>", "Number of results to return", "10").option("-t, --type <type>", "Filter by node type").option("--hybrid", "Enable hybrid search (combines vector + graph)").option("--min-score <score>", "Minimum similarity score (0-1)", "0").option("--json", "Output as JSON").action(async (query, options) => {
    const spinner = ora("Searching vectors...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const topK = parseInt(options.topK, 10) || 10;
      const minScore = parseFloat(options.minScore) || 0;
      const store = createVectorStore();
      await store.initialize();
      const stats = store.getStats();
      if (stats.totalVectors === 0) {
        spinner.warn("Vector store is empty");
        console.log(chalk.gray("  No vectors have been indexed yet."));
        console.log(chalk.gray("  Run ") + chalk.cyan("kg vector rebuild") + chalk.gray(" to index vectors."));
        return;
      }
      spinner.text = "Generating query embedding...";
      const queryEmbedding = createMockEmbedding(query, stats.dimensions);
      spinner.text = `Searching ${stats.totalVectors} vectors...`;
      let results;
      if (options.hybrid) {
        const hybridResults = await store.hybridSearch({
          embedding: queryEmbedding,
          limit: topK,
          minScore,
          filters: options.type ? { type: options.type } : void 0
        });
        results = hybridResults;
      } else {
        results = await store.search({
          vector: queryEmbedding,
          k: topK,
          minScore,
          filter: options.type ? { type: options.type } : void 0
        });
      }
      spinner.stop();
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }
      console.log(chalk.cyan(`
  Search Results for "${query}"
`));
      if (results.length === 0) {
        console.log(chalk.gray("  No results found"));
        return;
      }
      console.log(chalk.gray(`  Found ${results.length} result${results.length === 1 ? "" : "s"}
`));
      const headers = ["#", "ID", "Score", "Type", "Metadata"];
      const rows = results.map((r, i) => [
        String(i + 1),
        r.id.substring(0, 24) + (r.id.length > 24 ? "..." : ""),
        r.score.toFixed(4),
        r.metadata?.type || "-",
        Object.keys(r.metadata || {}).length > 0 ? Object.keys(r.metadata).slice(0, 3).join(", ") : "-"
      ]);
      printTable(headers, rows);
      console.log(chalk.white("\n  Top Result Details:\n"));
      const top = results[0];
      console.log(chalk.gray(`    ID: ${top.id}`));
      console.log(chalk.gray(`    Score: ${top.score.toFixed(6)}`));
      if (top.distance !== void 0) {
        console.log(chalk.gray(`    Distance: ${top.distance.toFixed(6)}`));
      }
      if (Object.keys(top.metadata || {}).length > 0) {
        console.log(chalk.gray("    Metadata:"));
        for (const [key, value] of Object.entries(top.metadata)) {
          const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
          console.log(chalk.gray(`      ${key}: ${displayValue.substring(0, 50)}`));
        }
      }
      console.log();
    } catch (error) {
      spinner.fail("Search failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  vector.command("stats").description("Display vector store statistics").option("-p, --path <path>", "Project root path", ".").option("--json", "Output as JSON").action(async (options) => {
    try {
      const projectRoot = validateProjectRoot(options.path);
      const store = createVectorStore();
      await store.initialize();
      const stats = store.getStats();
      if (options.json) {
        console.log(JSON.stringify(stats, null, 2));
        return;
      }
      console.log(chalk.cyan.bold("\n  Vector Store Statistics\n"));
      console.log(chalk.white("  Overview"));
      console.log(chalk.gray(`    Total Vectors:   ${stats.totalVectors.toLocaleString()}`));
      console.log(chalk.gray(`    Dimensions:      ${stats.dimensions}`));
      console.log(chalk.gray(`    Index Type:      ${stats.indexType.toUpperCase()}`));
      console.log(chalk.gray(`    Memory Usage:    ${formatBytes(stats.memoryUsage)}`));
      console.log(chalk.gray(`    Last Updated:    ${stats.lastUpdated.toISOString()}`));
      if (stats.indexStats) {
        console.log();
        console.log(chalk.white("  Index Configuration"));
        if (stats.indexStats.levels !== void 0) {
          console.log(chalk.gray(`    HNSW Levels:     ${stats.indexStats.levels}`));
        }
        if (stats.indexStats.entryPoint) {
          console.log(chalk.gray(`    Entry Point:     ${stats.indexStats.entryPoint.substring(0, 24)}...`));
        }
        if (stats.indexStats.avgConnections !== void 0) {
          console.log(chalk.gray(`    Avg Connections: ${stats.indexStats.avgConnections.toFixed(2)}`));
        }
      }
      if (stats.namespaces && Object.keys(stats.namespaces).length > 0) {
        console.log();
        console.log(chalk.white("  Namespaces"));
        for (const [ns, count] of Object.entries(stats.namespaces)) {
          const bar = "|".repeat(Math.min(count, 30));
          console.log(chalk.gray(`    ${ns.padEnd(15)} ${String(count).padStart(6)} ${chalk.blue(bar)}`));
        }
      }
      console.log();
      console.log(chalk.white("  Performance"));
      if (stats.totalVectors === 0) {
        console.log(chalk.yellow("    [!] Vector store is empty"));
        console.log(chalk.gray('        Run "kg vector rebuild" to populate the index'));
      } else if (stats.totalVectors < 100) {
        console.log(chalk.green("    [OK] Small index - linear search may be faster"));
      } else if (stats.totalVectors < 1e4) {
        console.log(chalk.green("    [OK] Medium index - HNSW optimal"));
      } else {
        console.log(chalk.yellow("    [!] Large index - consider quantization"));
      }
      console.log();
    } catch (error) {
      console.error(chalk.red("Failed to get stats:"), String(error));
      process.exit(1);
    }
  });
  vector.command("rebuild").description("Rebuild vector index from knowledge graph").option("-p, --path <path>", "Project root path", ".").option("--force", "Force rebuild even if index exists").option("--batch-size <size>", "Batch size for indexing", "100").option("-v, --verbose", "Verbose output").action(async (options) => {
    const spinner = ora("Rebuilding vector index...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const batchSize = parseInt(options.batchSize, 10) || 100;
      const store = createVectorStore();
      await store.initialize();
      const existingStats = store.getStats();
      if (existingStats.totalVectors > 0 && !options.force) {
        spinner.warn(`Index already contains ${existingStats.totalVectors} vectors`);
        console.log(chalk.gray("  Use --force to rebuild anyway"));
        return;
      }
      if (options.force && existingStats.totalVectors > 0) {
        spinner.text = "Clearing existing index...";
        await store.clear();
      }
      spinner.text = "Scanning knowledge graph...";
      const kgPath = join(projectRoot, ".kg", "knowledge.db");
      if (!existsSync(kgPath)) {
        spinner.fail("Knowledge graph not found");
        console.log(chalk.gray("  Run ") + chalk.cyan("kg graph") + chalk.gray(" first"));
        return;
      }
      spinner.text = "Generating embeddings...";
      spinner.succeed("Vector index rebuild complete");
      console.log();
      console.log(chalk.white("  Rebuild Summary"));
      console.log(chalk.gray(`    Vectors indexed: 0 (mock - no embedding model configured)`));
      console.log(chalk.gray(`    Batch size:      ${batchSize}`));
      console.log(chalk.gray(`    Project root:    ${projectRoot}`));
      console.log();
      console.log(chalk.yellow("  Note: Full vector indexing requires an embedding model."));
      console.log(chalk.gray("  Configure OPENAI_API_KEY or use local embeddings."));
      console.log();
    } catch (error) {
      spinner.fail("Rebuild failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  const trajectory = vector.command("trajectory").alias("traj").description("Agent trajectory tracking operations");
  trajectory.command("list").description("List recorded agent trajectories").option("-p, --path <path>", "Project root path", ".").option("-a, --agent <id>", "Filter by agent ID").option("-w, --workflow <id>", "Filter by workflow ID").option("-l, --limit <n>", "Maximum number of trajectories", "20").option("--success", "Show only successful trajectories").option("--failed", "Show only failed trajectories").option("--json", "Output as JSON").action(async (options) => {
    try {
      const limit = parseInt(options.limit, 10) || 20;
      const tracker = createTrajectoryTracker({
        maxTrajectories: 1e3,
        enableAutoLearning: true
      });
      const stats = tracker.getStats();
      if (options.json) {
        const exported2 = tracker.export();
        let trajectories2 = exported2.trajectories;
        if (options.agent) {
          trajectories2 = trajectories2.filter((t) => t.agentId === options.agent);
        }
        if (options.workflow) {
          trajectories2 = trajectories2.filter((t) => t.workflowId === options.workflow);
        }
        if (options.success) {
          trajectories2 = trajectories2.filter((t) => t.success);
        }
        if (options.failed) {
          trajectories2 = trajectories2.filter((t) => !t.success);
        }
        console.log(JSON.stringify(trajectories2.slice(0, limit), null, 2));
        return;
      }
      console.log(chalk.cyan.bold("\n  Agent Trajectories\n"));
      console.log(chalk.white("  Overview"));
      console.log(chalk.gray(`    Active:     ${stats.activeTrajectories}`));
      console.log(chalk.gray(`    Completed:  ${stats.completedTrajectories}`));
      console.log(chalk.gray(`    Success:    ${(stats.successRate * 100).toFixed(1)}%`));
      console.log(chalk.gray(`    Avg Duration: ${formatDuration(stats.avgDuration)}`));
      console.log(chalk.gray(`    Patterns:   ${stats.detectedPatterns}`));
      const exported = tracker.export();
      let trajectories = exported.trajectories;
      if (options.agent) {
        trajectories = trajectories.filter((t) => t.agentId === options.agent);
      }
      if (options.workflow) {
        trajectories = trajectories.filter((t) => t.workflowId === options.workflow);
      }
      if (options.success) {
        trajectories = trajectories.filter((t) => t.success);
      }
      if (options.failed) {
        trajectories = trajectories.filter((t) => !t.success);
      }
      trajectories = trajectories.slice(-limit).reverse();
      if (trajectories.length === 0) {
        console.log();
        console.log(chalk.gray("  No trajectories found"));
        console.log(chalk.gray("  Trajectories are recorded during agent operations."));
        console.log();
        return;
      }
      console.log();
      console.log(chalk.white(`  Recent Trajectories (${trajectories.length})`));
      const headers = ["ID", "Agent", "Steps", "Duration", "Status"];
      const rows = trajectories.map((t) => [
        t.id.substring(0, 16) + "...",
        t.agentId.substring(0, 12) + (t.agentId.length > 12 ? "..." : ""),
        String(t.steps.length),
        formatDuration(t.totalDuration),
        t.success ? chalk.green("OK") : chalk.red("FAIL")
      ]);
      printTable(headers, rows);
      console.log();
    } catch (error) {
      console.error(chalk.red("Failed to list trajectories:"), String(error));
      process.exit(1);
    }
  });
  trajectory.command("show <id>").description("Show detailed trajectory information").option("--json", "Output as JSON").action(async (id, options) => {
    try {
      const tracker = createTrajectoryTracker({
        maxTrajectories: 1e3,
        enableAutoLearning: true
      });
      const trajectory2 = tracker.getTrajectory(id);
      if (!trajectory2) {
        console.log(chalk.yellow(`
  Trajectory not found: ${id}
`));
        console.log(chalk.gray('  Use "kg vector trajectory list" to see available trajectories.'));
        console.log();
        return;
      }
      if (options.json) {
        console.log(JSON.stringify(trajectory2, null, 2));
        return;
      }
      console.log(chalk.cyan.bold("\n  Trajectory Details\n"));
      console.log(chalk.white("  Information"));
      console.log(chalk.gray(`    ID:         ${trajectory2.id}`));
      console.log(chalk.gray(`    Agent:      ${trajectory2.agentId}`));
      if (trajectory2.workflowId) {
        console.log(chalk.gray(`    Workflow:   ${trajectory2.workflowId}`));
      }
      console.log(chalk.gray(`    Started:    ${trajectory2.startedAt.toISOString()}`));
      if (trajectory2.completedAt) {
        console.log(chalk.gray(`    Completed:  ${trajectory2.completedAt.toISOString()}`));
      }
      console.log(chalk.gray(`    Duration:   ${formatDuration(trajectory2.totalDuration)}`));
      console.log(
        chalk.gray("    Status:     ") + (trajectory2.success ? chalk.green("SUCCESS") : chalk.red("FAILED"))
      );
      if (trajectory2.steps.length > 0) {
        console.log();
        console.log(chalk.white(`  Steps (${trajectory2.steps.length})`));
        const stepHeaders = ["#", "Action", "Outcome", "Duration"];
        const stepRows = trajectory2.steps.map((s, i) => [
          String(i + 1),
          s.action.substring(0, 30) + (s.action.length > 30 ? "..." : ""),
          s.outcome === "success" ? chalk.green(s.outcome) : s.outcome === "failure" ? chalk.red(s.outcome) : chalk.yellow(s.outcome),
          formatDuration(s.duration)
        ]);
        printTable(stepHeaders, stepRows);
      }
      if (trajectory2.metadata && Object.keys(trajectory2.metadata).length > 0) {
        console.log();
        console.log(chalk.white("  Metadata"));
        for (const [key, value] of Object.entries(trajectory2.metadata)) {
          const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
          console.log(chalk.gray(`    ${key}: ${displayValue.substring(0, 60)}`));
        }
      }
      console.log();
    } catch (error) {
      console.error(chalk.red("Failed to show trajectory:"), String(error));
      process.exit(1);
    }
  });
  trajectory.command("patterns").description("Show detected action patterns").option("--min-confidence <n>", "Minimum confidence threshold (0-1)", "0.5").option("--type <type>", "Filter by pattern type (success, failure, optimization)").option("--json", "Output as JSON").action(async (options) => {
    try {
      const minConfidence = parseFloat(options.minConfidence) || 0.5;
      const tracker = createTrajectoryTracker({
        maxTrajectories: 1e3,
        enableAutoLearning: true
      });
      const patterns = tracker.getPatterns({
        minConfidence,
        type: options.type
      });
      if (options.json) {
        console.log(JSON.stringify(patterns, null, 2));
        return;
      }
      console.log(chalk.cyan.bold("\n  Detected Patterns\n"));
      if (patterns.length === 0) {
        console.log(chalk.gray("  No patterns detected yet."));
        console.log(chalk.gray("  Patterns are learned from successful agent trajectories."));
        console.log();
        return;
      }
      const headers = ["ID", "Type", "Frequency", "Success", "Confidence"];
      const rows = patterns.map((p) => [
        p.id.substring(0, 30) + (p.id.length > 30 ? "..." : ""),
        p.type,
        String(p.frequency),
        `${(p.successRate * 100).toFixed(0)}%`,
        `${(p.confidence * 100).toFixed(0)}%`
      ]);
      printTable(headers, rows);
      if (patterns.length > 0) {
        const top = patterns[0];
        console.log();
        console.log(chalk.white("  Top Pattern Details"));
        console.log(chalk.gray(`    ID: ${top.id}`));
        console.log(chalk.gray(`    Actions: ${top.actions.join(" -> ")}`));
        console.log(chalk.gray(`    Avg Duration: ${formatDuration(top.avgDuration)}`));
      }
      console.log();
    } catch (error) {
      console.error(chalk.red("Failed to show patterns:"), String(error));
      process.exit(1);
    }
  });
  trajectory.command("clear").description("Clear all trajectory data").option("--confirm", "Confirm clearing without prompt").action(async (options) => {
    try {
      if (!options.confirm) {
        console.log(chalk.yellow("\n  Warning: This will delete all trajectory data.\n"));
        console.log(chalk.gray("  Use --confirm to proceed."));
        console.log();
        return;
      }
      const tracker = createTrajectoryTracker();
      tracker.clear();
      console.log(chalk.green("\n  Trajectory data cleared.\n"));
    } catch (error) {
      console.error(chalk.red("Failed to clear trajectories:"), String(error));
      process.exit(1);
    }
  });
  return vector;
}
function createMockEmbedding(text, dimensions) {
  const embedding = [];
  const normalized = text.toLowerCase().trim();
  for (let i = 0; i < dimensions; i++) {
    let value = 0;
    for (let j = 0; j < normalized.length; j++) {
      const charCode = normalized.charCodeAt(j);
      value += Math.sin(charCode * (i + 1) * 0.1) * Math.cos(j * 0.3);
    }
    embedding.push(Math.tanh(value / Math.max(1, normalized.length)));
  }
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return embedding.map((v) => v / (norm || 1));
}
export {
  createVectorCommand
};
//# sourceMappingURL=vector.js.map
