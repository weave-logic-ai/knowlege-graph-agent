/**
 * Git Initializer
 *
 * Initialize Git repository for vault.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '../../utils/logger.js';

const execFileAsync = promisify(execFile);

/**
 * Initialize Git repository in vault
 */
export async function initializeGitRepository(vaultPath: string): Promise<void> {
  logger.info('Initializing Git repository', { path: vaultPath });

  try {
    // Check if git is available
    try {
      await execFileAsync('git', ['--version']);
    } catch {
      throw new Error('Git is not installed or not in PATH');
    }

    // Initialize repository
    await execFileAsync('git', ['init'], { cwd: vaultPath });

    // Create .gitignore
    const gitignore = `# Vault metadata
.vault/
.obsidian/

# System files
.DS_Store
Thumbs.db

# Editor files
*.swp
*.swo
*~

# Cache
.cache/
`;

    await writeFile(join(vaultPath, '.gitignore'), gitignore, 'utf-8');

    // Initial commit
    await execFileAsync('git', ['add', '.'], { cwd: vaultPath });
    await execFileAsync('git', ['commit', '-m', 'Initial vault commit'], { cwd: vaultPath });

    logger.info('✅ Git repository initialized');
  } catch (error) {
    logger.error('Failed to initialize Git repository', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Check if directory is a Git repository
 */
export async function isGitRepository(path: string): Promise<boolean> {
  try {
    await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd: path });
    return true;
  } catch {
    return false;
  }
}
