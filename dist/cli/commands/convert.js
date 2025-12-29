import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { existsSync } from "fs";
import { join } from "path";
import { convertDocs, addFrontmatter, validateFrontmatter } from "../../generators/docs-convert.js";
import { validateProjectRoot } from "../../core/security.js";
function createConvertCommand() {
  const command = new Command("convert");
  command.description("Convert existing docs to weave-nn structure");
  command.command("docs").description("Convert existing documentation to docs-nn/ with proper structure").option("-p, --path <path>", "Project root path", ".").option("-s, --source <dir>", "Source docs directory", "docs").option("-t, --target <dir>", "Target directory", "docs-nn").option("--no-auto-category", "Disable auto-categorization").option("-f, --force", "Overwrite existing files").option("--dry-run", "Show what would be done without making changes").action(async (options) => {
    const spinner = ora("Converting documentation...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const sourceDir = options.source;
      const targetDir = options.target;
      if (!existsSync(join(projectRoot, sourceDir))) {
        spinner.fail(`Source directory not found: ${sourceDir}`);
        console.log(chalk.gray("  Specify source with --source <dir>"));
        process.exit(1);
      }
      if (options.dryRun) {
        spinner.text = "Analyzing documentation (dry run)...";
      }
      const result = await convertDocs({
        sourceDir,
        targetDir,
        projectRoot,
        preserveOriginal: true,
        force: options.force,
        autoCategory: options.autoCategory !== false,
        dryRun: options.dryRun
      });
      if (result.success) {
        if (options.dryRun) {
          spinner.succeed("Dry run complete!");
        } else {
          spinner.succeed("Documentation converted!");
        }
      } else {
        spinner.warn("Conversion completed with errors");
      }
      console.log();
      console.log(chalk.white("  Summary:"));
      console.log(chalk.gray(`    Source:      ${sourceDir}/`));
      console.log(chalk.gray(`    Target:      ${targetDir}/`));
      console.log(chalk.green(`    Converted:   ${result.filesConverted}`));
      console.log(chalk.yellow(`    Skipped:     ${result.filesSkipped}`));
      console.log(chalk.gray(`    Total:       ${result.filesProcessed}`));
      if (result.converted.length > 0 && result.converted.length <= 10) {
        console.log();
        console.log(chalk.white("  Converted files:"));
        result.converted.forEach(({ source, target, type }) => {
          console.log(chalk.gray(`    ${source}`));
          console.log(chalk.cyan(`      → ${target}`) + chalk.gray(` [${type}]`));
        });
      } else if (result.converted.length > 10) {
        console.log();
        console.log(chalk.white("  Sample conversions:"));
        result.converted.slice(0, 5).forEach(({ source, target, type }) => {
          console.log(chalk.gray(`    ${source}`));
          console.log(chalk.cyan(`      → ${target}`) + chalk.gray(` [${type}]`));
        });
        console.log(chalk.gray(`    ... and ${result.converted.length - 5} more`));
      }
      if (result.errors.length > 0) {
        console.log();
        console.log(chalk.red("  Errors:"));
        result.errors.slice(0, 5).forEach((err) => {
          console.log(chalk.gray(`    - ${err}`));
        });
        if (result.errors.length > 5) {
          console.log(chalk.gray(`    ... and ${result.errors.length - 5} more`));
        }
      }
      if (!options.dryRun && result.filesConverted > 0) {
        console.log();
        console.log(chalk.cyan("Next steps:"));
        console.log(chalk.white(`  1. Review ${targetDir}/ structure`));
        console.log(chalk.white("  2. Run: kg graph --docs " + targetDir));
        console.log(chalk.white("  3. Run: kg stats"));
      }
      console.log();
    } catch (error) {
      spinner.fail("Conversion failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  return command;
}
function createFrontmatterCommand() {
  const command = new Command("frontmatter");
  command.description("Manage frontmatter in markdown files");
  command.command("add [target]").description("Add frontmatter to files missing it").option("-p, --path <path>", "Project root path", ".").option("-t, --type <type>", "Node type (concept, technical, feature, service, guide, standard, integration)").option("-s, --status <status>", "Status (draft, active, deprecated, archived)", "active").option("--tags <tags>", "Comma-separated tags").option("-f, --force", "Overwrite existing frontmatter").option("--dry-run", "Show what would be done").action(async (target, options) => {
    const spinner = ora("Adding frontmatter...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const targetPath = target || "docs";
      const tags = options.tags ? options.tags.split(",").map((t) => t.trim()) : [];
      const result = await addFrontmatter({
        target: targetPath,
        projectRoot,
        type: options.type,
        status: options.status,
        tags,
        force: options.force,
        dryRun: options.dryRun
      });
      if (result.success) {
        spinner.succeed(options.dryRun ? "Dry run complete!" : "Frontmatter added!");
      } else {
        spinner.warn("Completed with errors");
      }
      console.log();
      console.log(chalk.white("  Summary:"));
      console.log(chalk.green(`    Updated:  ${result.filesUpdated}`));
      console.log(chalk.yellow(`    Skipped:  ${result.filesSkipped}`));
      console.log(chalk.gray(`    Total:    ${result.filesProcessed}`));
      if (result.errors.length > 0) {
        console.log();
        console.log(chalk.red("  Errors:"));
        result.errors.forEach((err) => {
          console.log(chalk.gray(`    - ${err}`));
        });
      }
      console.log();
    } catch (error) {
      spinner.fail("Failed to add frontmatter");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  command.command("validate [target]").description("Validate frontmatter in markdown files").option("-p, --path <path>", "Project root path", ".").action(async (target, options) => {
    const spinner = ora("Validating frontmatter...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const targetPath = target || "docs";
      const result = await validateFrontmatter(targetPath, projectRoot);
      spinner.succeed("Validation complete!");
      console.log();
      console.log(chalk.white("  Frontmatter Validation:"));
      console.log(chalk.green(`    Valid:    ${result.valid}`));
      console.log(chalk.red(`    Invalid:  ${result.invalid}`));
      console.log(chalk.yellow(`    Missing:  ${result.missing}`));
      if (result.issues.length > 0) {
        console.log();
        console.log(chalk.yellow("  Issues found:"));
        result.issues.slice(0, 10).forEach(({ file, issues }) => {
          console.log(chalk.white(`    ${file}`));
          issues.forEach((issue) => {
            console.log(chalk.gray(`      - ${issue}`));
          });
        });
        if (result.issues.length > 10) {
          console.log(chalk.gray(`    ... and ${result.issues.length - 10} more files`));
        }
        console.log();
        console.log(chalk.cyan("Fix with: ") + chalk.white("kg frontmatter add <target>"));
      }
      console.log();
    } catch (error) {
      spinner.fail("Validation failed");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  command.command("update [target]").description("Update/regenerate frontmatter (overwrites existing)").option("-p, --path <path>", "Project root path", ".").option("-t, --type <type>", "Force specific node type").option("--dry-run", "Show what would be done").action(async (target, options) => {
    const spinner = ora("Updating frontmatter...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const targetPath = target || "docs";
      const result = await addFrontmatter({
        target: targetPath,
        projectRoot,
        type: options.type,
        force: true,
        dryRun: options.dryRun
      });
      if (result.success) {
        spinner.succeed(options.dryRun ? "Dry run complete!" : "Frontmatter updated!");
      } else {
        spinner.warn("Completed with errors");
      }
      console.log();
      console.log(chalk.green(`  Updated: ${result.filesUpdated} files`));
      if (result.errors.length > 0) {
        console.log(chalk.red(`  Errors: ${result.errors.length}`));
      }
      console.log();
    } catch (error) {
      spinner.fail("Failed to update frontmatter");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  return command;
}
export {
  createConvertCommand,
  createFrontmatterCommand
};
//# sourceMappingURL=convert.js.map
