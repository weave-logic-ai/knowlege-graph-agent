import { Command } from "commander";
import chalk from "chalk";
import { existsSync } from "fs";
import { join } from "path";
import { createDatabase } from "../../core/database.js";
import { validateProjectRoot } from "../../core/security.js";
function createStatsCommand() {
  const command = new Command("stats");
  command.description("Display knowledge graph statistics").option("-p, --path <path>", "Project root path", ".").option("--json", "Output as JSON").action(async (options) => {
    try {
      const projectRoot = validateProjectRoot(options.path);
      const dbPath = join(projectRoot, ".kg", "knowledge.db");
      if (!existsSync(dbPath)) {
        console.log(chalk.yellow("  Knowledge graph not found"));
        console.log(chalk.gray("  Run ") + chalk.cyan("kg graph") + chalk.gray(" to generate one"));
        return;
      }
      const db = createDatabase(dbPath);
      const stats = db.getStats();
      const metadata = {
        version: db.getMetadata("version"),
        lastGenerated: db.getMetadata("lastGenerated"),
        lastUpdated: db.getMetadata("lastUpdated")
      };
      if (options.json) {
        console.log(JSON.stringify({ stats, metadata }, null, 2));
        db.close();
        return;
      }
      console.log(chalk.cyan("\n  Knowledge Graph Statistics\n"));
      console.log(chalk.white("  Overview"));
      console.log(chalk.gray(`    Total nodes:  ${stats.totalNodes}`));
      console.log(chalk.gray(`    Total edges:  ${stats.totalEdges}`));
      console.log(chalk.gray(`    Orphan nodes: ${stats.orphanNodes}`));
      console.log(chalk.gray(`    Avg links:    ${stats.avgLinksPerNode}/node`));
      console.log();
      console.log(chalk.white("  Nodes by Type"));
      Object.entries(stats.nodesByType).forEach(([type, count]) => {
        if (count > 0) {
          const bar = "█".repeat(Math.min(count, 20));
          console.log(chalk.gray(`    ${type.padEnd(12)} ${String(count).padStart(4)} ${chalk.blue(bar)}`));
        }
      });
      console.log();
      console.log(chalk.white("  Nodes by Status"));
      Object.entries(stats.nodesByStatus).forEach(([status, count]) => {
        if (count > 0) {
          const color = status === "active" ? chalk.green : status === "draft" ? chalk.yellow : status === "deprecated" ? chalk.red : chalk.gray;
          console.log(color(`    ${status.padEnd(12)} ${count}`));
        }
      });
      if (stats.mostConnected.length > 0) {
        console.log();
        console.log(chalk.white("  Most Connected Nodes"));
        stats.mostConnected.forEach(({ id, connections }, i) => {
          console.log(chalk.gray(`    ${i + 1}. ${id} (${connections} connections)`));
        });
      }
      if (metadata.lastGenerated || metadata.lastUpdated) {
        console.log();
        console.log(chalk.white("  Metadata"));
        if (metadata.version) {
          console.log(chalk.gray(`    Version:       ${metadata.version}`));
        }
        if (metadata.lastGenerated) {
          console.log(chalk.gray(`    Generated:     ${metadata.lastGenerated}`));
        }
        if (metadata.lastUpdated) {
          console.log(chalk.gray(`    Last updated:  ${metadata.lastUpdated}`));
        }
      }
      db.close();
      console.log();
    } catch (error) {
      console.error(chalk.red("Failed to get stats:"), String(error));
      process.exit(1);
    }
  });
  return command;
}
export {
  createStatsCommand
};
//# sourceMappingURL=stats.js.map
