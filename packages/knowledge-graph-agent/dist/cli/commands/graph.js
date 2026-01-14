import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { existsSync } from "fs";
import { join } from "path";
import { updateGraph, generateAndSave } from "../../generators/graph-generator.js";
import { validateProjectRoot, validateDocsPath } from "../../core/security.js";
function createGraphCommand() {
  const command = new Command("graph");
  command.description("Generate or update knowledge graph from documentation").option("-p, --path <path>", "Project root path", ".").option("-d, --docs <path>", "Docs directory path", "docs").option("-i, --include <paths>", "Additional paths to include (comma-separated)").option("-a, --all", "Scan entire project for markdown files").option("-u, --update", "Incremental update instead of full regeneration").option("-v, --verbose", "Show detailed output").action(async (options) => {
    const spinner = ora("Generating knowledge graph...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const dbPath = join(projectRoot, ".kg", "knowledge.db");
      const sourcePaths = [];
      if (options.all) {
        sourcePaths.push(projectRoot);
      } else {
        const docsPath = validateDocsPath(projectRoot, options.docs);
        if (existsSync(docsPath)) {
          sourcePaths.push(docsPath);
        }
        if (options.include) {
          const additionalPaths = options.include.split(",").map((p) => p.trim());
          for (const relPath of additionalPaths) {
            const fullPath = join(projectRoot, relPath);
            if (existsSync(fullPath)) {
              sourcePaths.push(fullPath);
            } else if (options.verbose) {
              console.log(chalk.yellow(`  Skipping non-existent path: ${relPath}`));
            }
          }
        }
      }
      if (sourcePaths.length === 0) {
        spinner.fail("No documentation directories found");
        console.log(chalk.gray("  Run ") + chalk.cyan("kg docs init") + chalk.gray(" to create docs/"));
        console.log(chalk.gray("  Or use ") + chalk.cyan("--include <paths>") + chalk.gray(" to specify paths"));
        console.log(chalk.gray("  Or use ") + chalk.cyan("--all") + chalk.gray(" to scan entire project"));
        process.exit(1);
      }
      if (!existsSync(join(projectRoot, ".kg"))) {
        spinner.fail("Knowledge graph not initialized");
        console.log(chalk.gray("  Run ") + chalk.cyan("kg init") + chalk.gray(" first"));
        process.exit(1);
      }
      if (options.verbose) {
        console.log(chalk.gray(`  Scanning paths: ${sourcePaths.join(", ")}`));
      }
      let result;
      if (options.update && existsSync(dbPath)) {
        spinner.text = "Updating knowledge graph...";
        result = await updateGraph(dbPath, sourcePaths[0], sourcePaths);
        spinner.succeed("Knowledge graph updated!");
        console.log();
        console.log(chalk.white("  Changes:"));
        console.log(chalk.green(`    Added:   ${result.added}`));
        console.log(chalk.blue(`    Updated: ${result.updated}`));
        console.log(chalk.yellow(`    Removed: ${result.removed}`));
      } else {
        spinner.text = options.all ? "Scanning entire project..." : "Scanning documentation...";
        result = await generateAndSave(
          {
            projectRoot,
            outputPath: sourcePaths[0],
            additionalPaths: sourcePaths.slice(1),
            scanAll: options.all
          },
          dbPath
        );
        if (result.success) {
          spinner.succeed("Knowledge graph generated!");
        } else {
          spinner.warn("Knowledge graph generated with errors");
        }
        console.log();
        console.log(chalk.white("  Statistics:"));
        console.log(chalk.gray(`    Paths scanned: ${sourcePaths.length}`));
        console.log(chalk.gray(`    Files scanned: ${result.stats.filesScanned}`));
        console.log(chalk.green(`    Nodes created: ${result.stats.nodesCreated}`));
        console.log(chalk.blue(`    Edges created: ${result.stats.edgesCreated}`));
      }
      const errors = "errors" in result ? result.errors : result.stats?.errors;
      if (errors && errors.length > 0) {
        console.log();
        console.log(chalk.yellow("  Warnings:"));
        errors.slice(0, 5).forEach((err) => {
          console.log(chalk.gray(`    - ${err}`));
        });
        if (errors.length > 5) {
          console.log(chalk.gray(`    ... and ${errors.length - 5} more`));
        }
      }
      console.log();
      console.log(chalk.cyan("Next: ") + chalk.white("kg stats") + chalk.gray(" to view graph statistics"));
      console.log();
    } catch (error) {
      spinner.fail("Failed to generate knowledge graph");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  command.command("analyze").description("Analyze graph structure and suggest improvements").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    const spinner = ora("Analyzing graph...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const dbPath = join(projectRoot, ".kg", "knowledge.db");
      if (!existsSync(dbPath)) {
        spinner.fail('Knowledge graph not found. Run "kg graph" first.');
        process.exit(1);
      }
      const { createDatabase } = await import("../../core/database.js");
      const db = createDatabase(dbPath);
      const stats = db.getStats();
      spinner.succeed("Graph analysis complete!");
      console.log();
      console.log(chalk.white("  Graph Health:"));
      if (stats.orphanNodes > 0) {
        console.log(chalk.yellow(`    ⚠ ${stats.orphanNodes} orphan nodes (no links)`));
      } else {
        console.log(chalk.green("    ✓ No orphan nodes"));
      }
      const density = stats.avgLinksPerNode;
      if (density < 1) {
        console.log(chalk.yellow(`    ⚠ Low link density (${density} avg links/node)`));
      } else {
        console.log(chalk.green(`    ✓ Good link density (${density} avg links/node)`));
      }
      if (stats.mostConnected.length > 0) {
        console.log();
        console.log(chalk.white("  Most Connected:"));
        stats.mostConnected.forEach(({ id, connections }) => {
          console.log(chalk.gray(`    ${id}: ${connections} connections`));
        });
      }
      db.close();
      console.log();
    } catch (error) {
      spinner.fail("Analysis failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  return command;
}
export {
  createGraphCommand
};
//# sourceMappingURL=graph.js.map
