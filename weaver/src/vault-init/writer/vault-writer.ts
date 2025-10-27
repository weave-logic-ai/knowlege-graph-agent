/**
 * Vault Writer
 *
 * Main vault writing system that generates complete vault structure.
 */

import { join } from 'path';
import { mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { logger } from '../../utils/logger.js';
import { writeMarkdownFile } from './markdown-writer.js';
import { generateVaultReadme } from './readme-generator.js';
import { generateConceptMap } from './concept-map-generator.js';
import { populateShadowCache } from './shadow-cache-populator.js';
import { initializeGitRepository } from './git-initializer.js';
import type { GeneratedNode } from '../types.js';

export interface VaultWriterOptions {
  outputPath: string;
  dryRun?: boolean;
  overwrite?: boolean;
  initGit?: boolean;
  populateCache?: boolean;
  cachePath?: string;
}

export interface VaultWriteResult {
  vaultPath: string;
  filesCreated: string[];
  nodesGenerated: number;
  errors: string[];
  dryRun: boolean;
}

/**
 * Write vault structure to disk
 */
export async function writeVault(
  nodes: GeneratedNode[],
  options: VaultWriterOptions
): Promise<VaultWriteResult> {
  const { outputPath, dryRun = false, overwrite = false, initGit = false, populateCache = false } = options;

  logger.info('Starting vault write', {
    outputPath,
    nodeCount: nodes.length,
    dryRun,
    overwrite,
  });

  const filesCreated: string[] = [];
  const errors: string[] = [];
  let rollbackNeeded = false;

  try {
    // Check if vault already exists
    if (existsSync(outputPath) && !overwrite && !dryRun) {
      throw new Error(`Vault already exists at ${outputPath}. Use overwrite option to replace.`);
    }

    // DRY RUN: Just log what would be created
    if (dryRun) {
      logger.info('DRY RUN: Showing what would be created');
      return performDryRun(nodes, outputPath);
    }

    // Clear existing vault if overwrite is enabled
    if (existsSync(outputPath) && overwrite) {
      logger.info('Removing existing vault', { path: outputPath });
      await rm(outputPath, { recursive: true, force: true });
    }

    // Create vault directory structure
    await createDirectoryStructure(outputPath);
    logger.info('Created directory structure');

    // Write node files
    for (const node of nodes) {
      try {
        const filePath = await writeNodeFile(node, outputPath);
        filesCreated.push(filePath);
      } catch (error) {
        const errorMsg = `Failed to write node ${node.id}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        logger.error(errorMsg, error instanceof Error ? error : new Error(String(error)));
        rollbackNeeded = true;
      }
    }

    // Generate vault README
    try {
      const readmePath = await generateVaultReadme(nodes, outputPath);
      filesCreated.push(readmePath);
      logger.info('Generated vault README');
    } catch (error) {
      const errorMsg = `Failed to generate README: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      logger.error(errorMsg, error instanceof Error ? error : new Error(String(error)));
    }

    // Generate concept map
    try {
      const conceptMapPath = await generateConceptMap(nodes, outputPath);
      filesCreated.push(conceptMapPath);
      logger.info('Generated concept map');
    } catch (error) {
      const errorMsg = `Failed to generate concept map: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      logger.error(errorMsg, error instanceof Error ? error : new Error(String(error)));
    }

    // Initialize Git repository
    if (initGit) {
      try {
        await initializeGitRepository(outputPath);
        logger.info('Initialized Git repository');
      } catch (error) {
        const errorMsg = `Failed to initialize Git: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        logger.error(errorMsg, error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Populate shadow cache
    if (populateCache && options.cachePath) {
      try {
        await populateShadowCache(outputPath, options.cachePath, filesCreated);
        logger.info('Populated shadow cache');
      } catch (error) {
        const errorMsg = `Failed to populate cache: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        logger.error(errorMsg, error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Check if rollback is needed
    if (rollbackNeeded && errors.length > 0) {
      logger.warn('Errors occurred during vault creation, performing rollback');
      await performRollback(outputPath);
      throw new Error(`Vault creation failed with ${errors.length} errors. Rollback completed.`);
    }

    logger.info('✅ Vault write completed', {
      filesCreated: filesCreated.length,
      nodesGenerated: nodes.length,
      errors: errors.length,
    });

    return {
      vaultPath: outputPath,
      filesCreated,
      nodesGenerated: nodes.length,
      errors,
      dryRun: false,
    };
  } catch (error) {
    logger.error('Vault write failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Create vault directory structure
 */
async function createDirectoryStructure(vaultPath: string): Promise<void> {
  const directories = [
    vaultPath,
    join(vaultPath, 'concepts'),
    join(vaultPath, 'technical'),
    join(vaultPath, 'features'),
    join(vaultPath, '.vault'),
  ];

  for (const dir of directories) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Write a node file to disk
 */
async function writeNodeFile(node: GeneratedNode, vaultPath: string): Promise<string> {
  // Determine directory based on node type
  let directory: string;
  if (node.type === 'concept') {
    directory = 'concepts';
  } else if (node.type === 'technical') {
    directory = 'technical';
  } else if (node.type === 'feature') {
    directory = 'features';
  } else {
    directory = 'concepts'; // Default fallback
  }

  const filePath = join(vaultPath, directory, `${node.filename}.md`);

  // Write file atomically
  await writeMarkdownFile(filePath, node.content);

  logger.debug('Wrote node file', { path: filePath, nodeId: node.id });

  return filePath;
}

/**
 * Perform dry run - show what would be created
 */
function performDryRun(nodes: GeneratedNode[], outputPath: string): VaultWriteResult {
  const filesCreated: string[] = [];

  // Vault structure
  filesCreated.push(join(outputPath, 'README.md'));
  filesCreated.push(join(outputPath, 'concept-map.md'));

  // Node files
  for (const node of nodes) {
    let directory: string;
    if (node.type === 'concept') {
      directory = 'concepts';
    } else if (node.type === 'technical') {
      directory = 'technical';
    } else if (node.type === 'feature') {
      directory = 'features';
    } else {
      directory = 'concepts';
    }

    const filePath = join(outputPath, directory, `${node.filename}.md`);
    filesCreated.push(filePath);
  }

  logger.info('DRY RUN: Would create files', {
    count: filesCreated.length,
    files: filesCreated.slice(0, 10), // Show first 10
  });

  return {
    vaultPath: outputPath,
    filesCreated,
    nodesGenerated: nodes.length,
    errors: [],
    dryRun: true,
  };
}

/**
 * Perform rollback - remove created vault
 */
async function performRollback(vaultPath: string): Promise<void> {
  try {
    if (existsSync(vaultPath)) {
      await rm(vaultPath, { recursive: true, force: true });
      logger.info('Rollback completed - removed vault', { path: vaultPath });
    }
  } catch (error) {
    logger.error('Rollback failed', error instanceof Error ? error : new Error(String(error)), {
      path: vaultPath,
    });
  }
}
