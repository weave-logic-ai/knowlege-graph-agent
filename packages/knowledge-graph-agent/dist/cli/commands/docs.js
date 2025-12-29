import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { docsExist, initDocs, getDocsPath } from "../../generators/docs-init.js";
import { validateProjectRoot, validateDocsPath } from "../../core/security.js";
function createDocsCommand() {
  const command = new Command("docs");
  command.description("Documentation management commands");
  command.command("init").description("Initialize documentation directory with weave-nn structure").option("-p, --path <path>", "Project root path", ".").option("-d, --docs <path>", "Docs directory path", "docs").option("-t, --template <template>", "Template to use (default, minimal)").option("--no-examples", "Skip example files").option("--no-detect", "Skip framework detection").option("-f, --force", "Overwrite existing files").action(async (options) => {
    const spinner = ora("Initializing documentation...").start();
    try {
      const projectRoot = validateProjectRoot(options.path);
      const docsPath = options.docs;
      validateDocsPath(projectRoot, docsPath);
      if (docsExist(projectRoot, docsPath) && !options.force) {
        spinner.warn(`Documentation already exists at ${docsPath}`);
        console.log(chalk.gray("  Use --force to reinitialize"));
        return;
      }
      const result = await initDocs({
        projectRoot,
        docsPath,
        includeExamples: options.examples !== false,
        detectFramework: options.detect !== false
      });
      if (result.success) {
        spinner.succeed("Documentation initialized!");
      } else {
        spinner.warn("Documentation initialized with errors");
      }
      console.log();
      console.log(chalk.white("  Created:"));
      console.log(chalk.gray(`    Path: ${result.docsPath}`));
      console.log(chalk.green(`    Files: ${result.filesCreated.length}`));
      if (result.errors.length > 0) {
        console.log();
        console.log(chalk.yellow("  Errors:"));
        result.errors.forEach((err) => {
          console.log(chalk.gray(`    - ${err}`));
        });
      }
      console.log();
      console.log(chalk.cyan("Structure created:"));
      console.log(chalk.gray(`
    ${docsPath}/
    ├── README.md           # Documentation home
    ├── PRIMITIVES.md       # Technology primitives
    ├── MOC.md              # Map of Content
    ├── concepts/           # Abstract concepts
    ├── components/         # Reusable components
    ├── services/           # Backend services
    ├── features/           # Product features
    ├── integrations/       # External integrations
    ├── standards/          # Coding standards
    ├── guides/             # How-to guides
    └── references/         # API references
        `));
      console.log(chalk.cyan("Next: ") + chalk.white("kg graph") + chalk.gray(" to generate knowledge graph"));
      console.log();
    } catch (error) {
      spinner.fail("Failed to initialize documentation");
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
  command.command("status").description("Show documentation status").option("-p, --path <path>", "Project root path", ".").action(async (options) => {
    const projectRoot = validateProjectRoot(options.path);
    const docsPath = getDocsPath(projectRoot);
    if (!docsPath) {
      console.log(chalk.yellow("  No documentation directory found"));
      console.log(chalk.gray("  Run ") + chalk.cyan("kg docs init") + chalk.gray(" to create one"));
      return;
    }
    console.log(chalk.white("\n  Documentation Status\n"));
    console.log(chalk.gray("  Path:"), chalk.white(docsPath));
    console.log();
    const fg = await import("fast-glob");
    const files = await fg.default("**/*.md", {
      cwd: docsPath,
      ignore: ["node_modules/**", ".git/**"]
    });
    console.log(chalk.gray("  Markdown files:"), chalk.white(files.length));
    const keyFiles = ["README.md", "PRIMITIVES.md", "MOC.md"];
    const fs = await import("fs");
    const path = await import("path");
    console.log();
    console.log(chalk.white("  Key Files:"));
    keyFiles.forEach((file) => {
      const exists = fs.existsSync(path.join(docsPath, file));
      const icon = exists ? chalk.green("✓") : chalk.red("✗");
      console.log(`    ${icon} ${file}`);
    });
    const dirs = ["concepts", "components", "services", "features", "guides"];
    console.log();
    console.log(chalk.white("  Directories:"));
    dirs.forEach((dir) => {
      const exists = fs.existsSync(path.join(docsPath, dir));
      const icon = exists ? chalk.green("✓") : chalk.gray("○");
      console.log(`    ${icon} ${dir}/`);
    });
    console.log();
  });
  return command;
}
export {
  createDocsCommand
};
//# sourceMappingURL=docs.js.map
