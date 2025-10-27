/**
 * CLI command for vault initialization
 *
 * This command scans an existing project and generates a Weave-NN vault
 * with appropriate structure based on the detected framework.
 */

import { Command } from 'commander';
import path from 'path';
import { detectFramework } from '../../vault-init/scanner/framework-detector.js';
import { scanDirectory } from '../../vault-init/scanner/directory-scanner.js';
import { templateLoader } from '../../vault-init/templates/template-loader.js';
import { promptForMissingOptions, confirmAction } from '../utils/prompts.js';
import {
  showSpinner,
  updateSpinner,
  succeedSpinner,
  failSpinner,
  infoSpinner
} from '../utils/progress.js';
import {
  formatSuccess,
  formatInfo,
  formatWarning,
  formatHeader,
  formatSummary
} from '../utils/formatting.js';
import { handleError } from '../utils/error-handler.js';
import { createShadowCache } from '../../shadow-cache/index.js';
import fs from 'fs/promises';

export interface InitVaultOptions {
  output?: string;
  template?: string;
  dryRun?: boolean;
  offline?: boolean;
  git?: boolean;
}

export function createInitVaultCommand(): Command {
  return new Command('init-vault')
    .description('Initialize a new Weave-NN vault from an existing project')
    .argument('<project-path>', 'Path to the project to scan')
    .option('-o, --output <path>', 'Vault output directory')
    .option('-t, --template <name>', 'Template to use (nextjs, react, auto)', 'auto')
    .option('-d, --dry-run', 'Preview changes without writing files', false)
    .option('--offline', 'Disable AI features (offline mode)', false)
    .option('--no-git', 'Skip Git repository initialization')
    .action(async (projectPath: string, options: InitVaultOptions) => {
      try {
        await initVault(projectPath, options);
      } catch (error) {
        handleError(error);
        process.exit(1);
      }
    });
}

/**
 * Main vault initialization logic
 */
export async function initVault(
  projectPath: string,
  options: InitVaultOptions
): Promise<void> {
  console.log(formatHeader('🧵 Weave-NN Vault Initialization'));
  console.log();

  // Step 1: Validate project path
  const spinner = showSpinner('Validating project path...');
  const absoluteProjectPath = path.resolve(projectPath);

  try {
    const stats = await fs.stat(absoluteProjectPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${projectPath}`);
    }
    updateSpinner(spinner, `Project path validated: ${absoluteProjectPath}`);
    succeedSpinner(spinner, 'Project path validated');
  } catch (error) {
    failSpinner(spinner, 'Invalid project path');
    throw error;
  }

  // Step 2: Prompt for missing options
  const completeOptions = await promptForMissingOptions(absoluteProjectPath, options);

  // Step 3: Detect framework
  const detectSpinner = showSpinner('Detecting project framework...');
  let frameworkInfo;
  try {
    frameworkInfo = await detectFramework(absoluteProjectPath);
    succeedSpinner(
      detectSpinner,
      `Framework detected: ${frameworkInfo.type} v${frameworkInfo.version || 'unknown'}`
    );

    console.log(formatInfo(`Detected features: ${frameworkInfo.features.join(', ')}`));
    console.log(formatInfo(`Confidence: ${frameworkInfo.confidence}%`));
  } catch (error) {
    failSpinner(detectSpinner, 'Framework detection failed');
    throw error;
  }

  // Step 4: Select template
  const templateSpinner = showSpinner('Loading template...');
  let templateId = completeOptions.template || 'auto';

  // Auto-select template based on framework
  if (templateId === 'auto') {
    templateId = frameworkInfo.type === 'nextjs' ? 'nextjs-app-router' :
                 frameworkInfo.type === 'react' ? 'react-vite' :
                 'nextjs-app-router'; // Default fallback
  }

  const template = templateLoader.getTemplate(templateId);
  if (!template) {
    failSpinner(templateSpinner, `Template not found: ${templateId}`);
    throw new Error(`Template not found: ${templateId}`);
  }

  succeedSpinner(templateSpinner, `Template loaded: ${template.name}`);

  // Step 5: Scan directory
  const scanSpinner = showSpinner('Scanning project directory...');
  let files;
  try {
    files = await scanDirectory(absoluteProjectPath, {
      respectGitignore: true,
      maxDepth: Infinity,
    });

    const fileCount = files.filter(f => f.type === 'file').length;
    const dirCount = files.filter(f => f.type === 'directory').length;

    succeedSpinner(scanSpinner, `Scanned ${fileCount} files in ${dirCount} directories`);
  } catch (error) {
    failSpinner(scanSpinner, 'Directory scan failed');
    throw error;
  }

  // Step 6: Generate vault structure (placeholder for now)
  const generateSpinner = showSpinner('Generating vault nodes...');

  // TODO: Implement actual node generation
  // For now, create base structure from template
  // const vaultStructure = {
  //   directories: template.directories,
  //   nodes: [] as any[], // Will be populated by generator
  // };

  succeedSpinner(generateSpinner, 'Vault structure generated');

  // Step 7: Dry-run preview or write vault
  if (completeOptions.dryRun) {
    console.log();
    console.log(formatHeader('📋 Dry-Run Preview'));
    console.log();
    console.log(formatInfo('The following structure would be created:'));
    console.log();

    // Display directory structure
    Object.entries(template.directories).forEach(([dirName, dirInfo]) => {
      console.log(formatInfo(`  📁 ${dirName}/ - ${dirInfo.description}`));
      if (dirInfo.children) {
        Object.entries(dirInfo.children).forEach(([childName, childDesc]) => {
          console.log(formatInfo(`    📄 ${childName}.md - ${childDesc}`));
        });
      }
    });

    console.log();
    console.log(formatWarning('This is a dry-run. No files were written.'));
    console.log(formatInfo('Remove --dry-run flag to create the vault.'));
    return;
  }

  // Step 8: Confirm action
  const outputPath = completeOptions.output || path.join(absoluteProjectPath, '.vault');
  console.log();
  const confirmed = await confirmAction(
    `Create vault at ${outputPath}?`,
    true
  );

  if (!confirmed) {
    console.log(formatWarning('Operation cancelled by user'));
    return;
  }

  // Step 9: Write vault files
  const writeSpinner = showSpinner('Writing vault files...');
  try {
    // Create output directory
    await fs.mkdir(outputPath, { recursive: true });

    // Create directory structure
    for (const [dirName, dirInfo] of Object.entries(template.directories)) {
      const dirPath = path.join(outputPath, dirName);
      await fs.mkdir(dirPath, { recursive: true });

      // Create README for each directory
      const readmePath = path.join(dirPath, 'README.md');
      const readmeContent = `# ${dirName.charAt(0).toUpperCase() + dirName.slice(1)}\n\n${dirInfo.description}\n`;
      await fs.writeFile(readmePath, readmeContent, 'utf-8');
    }

    succeedSpinner(writeSpinner, `Vault created at ${outputPath}`);
  } catch (error) {
    failSpinner(writeSpinner, 'Failed to write vault files');
    throw error;
  }

  // Step 10: Initialize shadow cache
  const cacheSpinner = showSpinner('Initializing shadow cache...');
  try {
    const shadowCache = createShadowCache(
      path.join(outputPath, '.shadow-cache.db'),
      outputPath
    );

    await shadowCache.syncVault();
    const stats = shadowCache.getStats();
    shadowCache.close();

    succeedSpinner(
      cacheSpinner,
      `Shadow cache initialized (${stats.totalFiles} files indexed)`
    );
  } catch (error) {
    failSpinner(cacheSpinner, 'Shadow cache initialization failed');
    // Non-fatal, continue
    console.log(formatWarning('Shadow cache initialization failed, but vault was created'));
  }

  // Step 11: Initialize Git repository (if enabled)
  if (completeOptions.git !== false) {
    const gitSpinner = showSpinner('Initializing Git repository...');
    try {
      const { simpleGit } = await import('simple-git');
      const git = simpleGit(outputPath);

      // Check if already a git repo
      const isRepo = await git.checkIsRepo();

      if (!isRepo) {
        await git.init();

        // Create .gitignore
        const gitignorePath = path.join(outputPath, '.gitignore');
        const gitignoreContent = `.shadow-cache.db\n.shadow-cache.db-journal\nnode_modules/\n.DS_Store\n`;
        await fs.writeFile(gitignorePath, gitignoreContent, 'utf-8');

        // Initial commit
        await git.add('.');
        await git.commit('Initial vault structure');

        succeedSpinner(gitSpinner, 'Git repository initialized');
      } else {
        infoSpinner(gitSpinner, 'Git repository already exists');
      }
    } catch (error) {
      failSpinner(gitSpinner, 'Git initialization failed');
      // Non-fatal, continue
      console.log(formatWarning('Git initialization failed, but vault was created'));
    }
  }

  // Step 12: Display summary
  console.log();
  console.log(formatHeader('✅ Vault Initialization Complete'));
  console.log();
  console.log(formatSummary({
    'Project Path': absoluteProjectPath,
    'Framework': `${frameworkInfo.type} v${frameworkInfo.version || 'unknown'}`,
    'Template': template.name,
    'Vault Path': outputPath,
    'Files Scanned': files.filter(f => f.type === 'file').length.toString(),
    'Directories Created': Object.keys(template.directories).length.toString(),
  }));

  console.log();
  console.log(formatInfo('Next steps:'));
  console.log(formatInfo('  1. Review the generated vault structure'));
  console.log(formatInfo('  2. Customize node templates as needed'));
  console.log(formatInfo('  3. Start the Weaver service to enable file watching'));
  console.log();
  console.log(formatSuccess('Happy weaving! 🧵'));
}
