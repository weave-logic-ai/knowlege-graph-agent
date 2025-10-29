/**
 * Cache Operations Commands
 *
 * Commands for cache management:
 * - weaver cache clear - Clear all or specific cache types
 * - weaver cache stats - Show cache statistics
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, statSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface CacheOptions {
  type?: string;
  verbose?: boolean;
}

type CacheType = 'all' | 'embeddings' | 'perception' | 'workflow' | 'shadow';

interface CacheInfo {
  name: string;
  path: string;
  size: number;
  files: number;
  exists: boolean;
}

/**
 * Get cache directories
 */
function getCacheDirectories(): Record<CacheType, string> {
  const weaverDir = join(homedir(), '.weaver');

  return {
    all: join(weaverDir, 'cache'),
    embeddings: join(weaverDir, 'cache', 'embeddings'),
    perception: join(weaverDir, 'cache', 'perception'),
    workflow: join(weaverDir, 'cache', 'workflows'),
    shadow: join(weaverDir, 'cache', 'shadow'),
  };
}

/**
 * Calculate directory size and file count
 */
function getDirectoryInfo(dirPath: string): { size: number; files: number } {
  let size = 0;
  let files = 0;

  if (!existsSync(dirPath)) {
    return { size: 0, files: 0 };
  }

  function traverse(path: string): void {
    try {
      const stats = statSync(path);

      if (stats.isDirectory()) {
        const entries = readdirSync(path);
        for (const entry of entries) {
          traverse(join(path, entry));
        }
      } else {
        size += stats.size;
        files++;
      }
    } catch (error) {
      // Skip files we can't access
    }
  }

  traverse(dirPath);
  return { size, files };
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get cache information for all types
 */
function getAllCacheInfo(): CacheInfo[] {
  const directories = getCacheDirectories();
  const cacheInfo: CacheInfo[] = [];

  for (const [type, path] of Object.entries(directories)) {
    if (type === 'all') continue; // Skip 'all' which is the parent directory

    const exists = existsSync(path);
    const info = exists ? getDirectoryInfo(path) : { size: 0, files: 0 };

    cacheInfo.push({
      name: type,
      path,
      size: info.size,
      files: info.files,
      exists,
    });
  }

  return cacheInfo;
}

/**
 * Create cache command group
 */
export function createCacheCommand(): Command {
  const command = new Command('cache')
    .description('Cache management operations');

  command.addCommand(createClearCommand());
  command.addCommand(createStatsCommand());

  return command;
}

/**
 * cache clear - Clear cache directories
 */
function createClearCommand(): Command {
  return new Command('clear')
    .description('Clear all or specific cache directories')
    .option('-t, --type <type>', 'Cache type to clear (all, embeddings, perception, workflow, shadow)', 'all')
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options: CacheOptions) => {
      const spinner = ora('Analyzing cache...').start();

      try {
        const cacheType = (options.type || 'all').toLowerCase() as CacheType;
        const validTypes: CacheType[] = ['all', 'embeddings', 'perception', 'workflow', 'shadow'];

        if (!validTypes.includes(cacheType)) {
          spinner.fail(`Invalid cache type: ${cacheType}`);
          console.log(chalk.yellow('\nValid types:'), validTypes.join(', '));
          process.exit(1);
        }

        const cacheInfo = getAllCacheInfo();
        const totalBefore = cacheInfo.reduce((sum, info) => sum + info.size, 0);
        const totalFiles = cacheInfo.reduce((sum, info) => sum + info.files, 0);

        spinner.succeed('Cache analyzed');

        // Show before state
        console.log(chalk.bold('\n📦 Cache Status (Before):\n'));

        for (const info of cacheInfo) {
          const icon = info.exists ? (info.files > 0 ? '📁' : '📂') : '⚪';
          console.log(`${icon} ${chalk.cyan(info.name.padEnd(12))} ${formatFileSize(info.size).padStart(10)} (${info.files} files)`);

          if (options.verbose && info.exists) {
            console.log(chalk.gray(`   ${info.path}`));
          }
        }

        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.bold(`   Total: ${formatFileSize(totalBefore)} (${totalFiles} files)\n`));

        // Clear caches
        spinner.start('Clearing cache...');

        let cleared = 0;
        const directories = getCacheDirectories();

        if (cacheType === 'all') {
          // Clear all cache types
          for (const info of cacheInfo) {
            if (info.exists && info.files > 0) {
              try {
                rmSync(info.path, { recursive: true, force: true });
                cleared++;
              } catch (error) {
                if (options.verbose) {
                  console.log(chalk.yellow(`\nWarning: Could not clear ${info.name}:`), error);
                }
              }
            }
          }
        } else {
          // Clear specific cache type
          const targetPath = directories[cacheType];
          if (existsSync(targetPath)) {
            try {
              rmSync(targetPath, { recursive: true, force: true });
              cleared = 1;
            } catch (error) {
              spinner.fail(`Failed to clear ${cacheType} cache`);
              console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
              process.exit(1);
            }
          }
        }

        if (cleared === 0) {
          spinner.info('No cache to clear');
          return;
        }

        // Show after state
        const cacheInfoAfter = getAllCacheInfo();
        const totalAfter = cacheInfoAfter.reduce((sum, info) => sum + info.size, 0);
        const totalFilesAfter = cacheInfoAfter.reduce((sum, info) => sum + info.files, 0);
        const freed = totalBefore - totalAfter;

        spinner.succeed(chalk.green('Cache cleared!'));

        console.log(chalk.bold('\n📦 Cache Status (After):\n'));

        for (const info of cacheInfoAfter) {
          const icon = info.exists ? (info.files > 0 ? '📁' : '📂') : '⚪';
          console.log(`${icon} ${chalk.cyan(info.name.padEnd(12))} ${formatFileSize(info.size).padStart(10)} (${info.files} files)`);
        }

        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.bold(`   Total: ${formatFileSize(totalAfter)} (${totalFilesAfter} files)`));
        console.log(chalk.green(`   Freed: ${formatFileSize(freed)}\n`));

      } catch (error) {
        spinner.fail('Cache clear failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

/**
 * cache stats - Show cache statistics
 */
function createStatsCommand(): Command {
  return new Command('stats')
    .description('Show cache statistics and sizes')
    .option('-v, --verbose', 'Show detailed information', false)
    .action(async (options: CacheOptions) => {
      const spinner = ora('Analyzing cache...').start();

      try {
        const cacheInfo = getAllCacheInfo();
        const totalSize = cacheInfo.reduce((sum, info) => sum + info.size, 0);
        const totalFiles = cacheInfo.reduce((sum, info) => sum + info.files, 0);

        spinner.succeed('Cache analyzed');

        console.log(chalk.bold('\n📦 Cache Statistics:\n'));

        for (const info of cacheInfo) {
          const percentage = totalSize > 0 ? ((info.size / totalSize) * 100).toFixed(1) : '0.0';
          const icon = info.exists ? (info.files > 0 ? '📁' : '📂') : '⚪';
          const status = info.exists ? (info.files > 0 ? chalk.green('Active') : chalk.gray('Empty')) : chalk.gray('N/A');

          console.log(`${icon} ${chalk.cyan(info.name.padEnd(12))} ${status.padEnd(15)}`);
          console.log(`   Size:  ${formatFileSize(info.size).padStart(10)} (${percentage}%)`);
          console.log(`   Files: ${info.files.toString().padStart(10)}`);

          if (options.verbose && info.exists) {
            console.log(chalk.gray(`   Path:  ${info.path}`));
          }
          console.log();
        }

        console.log(chalk.gray('─'.repeat(50)));
        console.log(chalk.bold(`Total Size:  ${formatFileSize(totalSize)}`));
        console.log(chalk.bold(`Total Files: ${totalFiles}`));

        if (totalSize > 0) {
          console.log(chalk.gray('\nTip: Use `weaver cache clear` to free up space'));
        }

      } catch (error) {
        spinner.fail('Failed to get cache stats');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
