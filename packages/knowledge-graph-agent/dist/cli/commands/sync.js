import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { existsSync } from "fs";
import { join } from "path";
import { createDatabase } from "../../core/database.js";
import { createClaudeFlowIntegration, generateMcpConfig } from "../../integrations/claude-flow.js";
import { validateProjectRoot } from "../../core/security.js";
function createSyncCommand() {
  const command = new Command("sync");
  command.description("Sync knowledge graph with claude-flow memory").option("-p, --path <path>", "Project root path", ".").option("-n, --namespace <namespace>", "Memory namespace", "knowledge-graph").option("--show-commands", "Show MCP commands instead of executing").option("--hooks", "Show hook configuration commands").action(async (options) => {
    const spinner = ora("Syncing with claude-flow...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const dbPath = join(projectRoot, ".kg", "knowledge.db");
      if (!existsSync(dbPath)) {
        spinner.fail("Knowledge graph not found");
        console.log(chalk.gray("  Run ") + chalk.cyan("kg graph") + chalk.gray(" first"));
        process.exit(1);
      }
      const db = createDatabase(dbPath);
      const integration = createClaudeFlowIntegration({
        namespace: options.namespace,
        syncOnChange: true
      });
      if (options.showCommands) {
        spinner.stop();
        console.log(chalk.cyan("\n  Claude-Flow MCP Commands\n"));
        console.log(chalk.gray("  Use these commands in Claude Code:\n"));
        integration.generateRetrievalCommands().forEach((cmd) => {
          console.log(chalk.white(`  ${cmd}`));
        });
        db.close();
        return;
      }
      if (options.hooks) {
        spinner.stop();
        console.log(chalk.cyan("\n  Claude-Flow Hook Commands\n"));
        console.log(chalk.gray("  Add these to your workflow:\n"));
        integration.generateHookCommands().forEach((cmd) => {
          console.log(chalk.white(`  ${cmd}`));
        });
        db.close();
        return;
      }
      spinner.text = "Preparing sync data...";
      const result = await integration.syncToMemory(db);
      spinner.succeed("Sync complete!");
      console.log();
      console.log(chalk.white("  Results:"));
      console.log(chalk.green(`    Synced: ${result.synced} entries`));
      if (result.failed > 0) {
        console.log(chalk.yellow(`    Failed: ${result.failed}`));
      }
      console.log();
      console.log(chalk.cyan("  Memory Retrieval:"));
      console.log(chalk.gray(`    Get stats: mcp__claude-flow__memory_usage { action: "retrieve", key: "stats", namespace: "${options.namespace}" }`));
      console.log(chalk.gray(`    Get node:  mcp__claude-flow__memory_usage { action: "retrieve", key: "node/<id>", namespace: "${options.namespace}" }`));
      db.close();
      console.log();
    } catch (error) {
      spinner.fail("Sync failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  command.command("config").description("Show MCP configuration for CLAUDE.md").option("-n, --namespace <namespace>", "Memory namespace", "knowledge-graph").action((options) => {
    const config = generateMcpConfig(options.namespace);
    console.log(config);
  });
  return command;
}
export {
  createSyncCommand
};
//# sourceMappingURL=sync.js.map
