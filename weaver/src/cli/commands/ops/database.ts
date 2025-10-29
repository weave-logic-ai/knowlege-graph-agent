/**
 * Database Operations Commands
 *
 * Commands for database maintenance and management:
 * - weaver db vacuum  - Optimize SQLite database
 * - weaver db backup  - Create compressed backup
 * - weaver db restore - Restore from backup
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import { createGzip, createGunzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

interface DatabaseOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

interface BackupOptions extends DatabaseOptions {
  output?: string;
}

interface RestoreOptions extends DatabaseOptions {
  force?: boolean;
}

/**
 * Get default database path
 */
function getDefaultDbPath(): string {
  return join(homedir(), '.weaver', 'memory', 'experiences.db');
}

/**
 * Get backup directory
 */
function getBackupDir(): string {
  const backupDir = join(homedir(), '.weaver', 'backups');
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
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
 * Get database file size
 */
function getDatabaseSize(dbPath: string): number {
  try {
    const stats = statSync(dbPath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Create database command group
 */
export function createDatabaseCommand(): Command {
  const command = new Command('db')
    .description('Database maintenance and management operations');

  command.addCommand(createVacuumCommand());
  command.addCommand(createBackupCommand());
  command.addCommand(createRestoreCommand());

  return command;
}

/**
 * db vacuum - Optimize database
 */
function createVacuumCommand(): Command {
  return new Command('vacuum')
    .description('Optimize SQLite database using VACUUM and PRAGMA optimize')
    .option('--dry-run', 'Preview operations without executing', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options: DatabaseOptions) => {
      const spinner = ora('Initializing database optimization...').start();

      try {
        const dbPath = getDefaultDbPath();

        if (!existsSync(dbPath)) {
          spinner.fail(`Database not found: ${dbPath}`);
          process.exit(1);
        }

        const beforeSize = getDatabaseSize(dbPath);
        spinner.text = `Database size: ${formatFileSize(beforeSize)}`;

        if (options.verbose) {
          console.log(chalk.gray(`\nDatabase: ${dbPath}`));
          console.log(chalk.gray(`Before: ${formatFileSize(beforeSize)}`));
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('[DRY RUN] Would execute:'));
          console.log(chalk.cyan('  - VACUUM (rebuild database file)'));
          console.log(chalk.cyan('  - PRAGMA optimize (update query planner statistics)'));
          console.log(chalk.cyan('  - PRAGMA integrity_check (verify database integrity)'));
          process.exit(0);
        }

        spinner.text = 'Running integrity check...';
        const db = new Database(dbPath);

        try {
          const integrityResult = db.pragma('integrity_check', { simple: true });

          if (Array.isArray(integrityResult) && integrityResult[0] !== 'ok') {
            spinner.fail('Database integrity check failed!');
            console.error(chalk.red('Integrity issues:'), integrityResult);
            db.close();
            process.exit(1);
          }

          spinner.succeed('Integrity check passed');

          spinner.start('Optimizing database (VACUUM)...');
          db.exec('VACUUM');
          spinner.succeed('VACUUM completed');

          spinner.start('Updating query planner statistics...');
          db.pragma('optimize');
          spinner.succeed('Statistics updated');

          db.close();

          const afterSize = getDatabaseSize(dbPath);
          const saved = beforeSize - afterSize;
          const percentSaved = beforeSize > 0 ? ((saved / beforeSize) * 100).toFixed(2) : '0';

          spinner.succeed(chalk.green('Database optimization complete!'));

          console.log(chalk.bold('\nResults:'));
          console.log(`  Before: ${formatFileSize(beforeSize)}`);
          console.log(`  After:  ${formatFileSize(afterSize)}`);
          console.log(`  Saved:  ${formatFileSize(saved)} (${percentSaved}%)`);

        } catch (error) {
          db.close();
          throw error;
        }

      } catch (error) {
        spinner.fail('Database optimization failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

/**
 * db backup - Create compressed backup
 */
function createBackupCommand(): Command {
  return new Command('backup')
    .description('Create timestamped compressed backup of database')
    .option('-o, --output <path>', 'Custom backup output path')
    .option('--dry-run', 'Preview backup without creating files', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options: BackupOptions) => {
      const spinner = ora('Preparing database backup...').start();

      try {
        const dbPath = getDefaultDbPath();

        if (!existsSync(dbPath)) {
          spinner.fail(`Database not found: ${dbPath}`);
          process.exit(1);
        }

        const backupDir = getBackupDir();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const dateStr = timestamp[0];
        const timeStr = timestamp[1].substring(0, 8);
        const backupName = `weaver-${dateStr}-${timeStr}.db.gz`;
        const backupPath = options.output || join(backupDir, backupName);

        // Ensure output directory exists
        const outputDir = dirname(backupPath);
        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        const dbSize = getDatabaseSize(dbPath);

        if (options.verbose) {
          console.log(chalk.gray(`\nSource: ${dbPath}`));
          console.log(chalk.gray(`Size: ${formatFileSize(dbSize)}`));
          console.log(chalk.gray(`Backup: ${backupPath}`));
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('[DRY RUN] Would create backup:'));
          console.log(chalk.cyan(`  Database: ${dbPath}`));
          console.log(chalk.cyan(`  Size: ${formatFileSize(dbSize)}`));
          console.log(chalk.cyan(`  Backup: ${backupPath}`));
          console.log(chalk.cyan(`  Format: gzip compressed`));
          process.exit(0);
        }

        spinner.text = 'Creating backup checkpoint...';

        // Create WAL checkpoint to ensure all data is in main database file
        const db = new Database(dbPath, { readonly: true });
        try {
          db.pragma('wal_checkpoint(FULL)');
          db.close();
        } catch (error) {
          db.close();
          if (options.verbose) {
            console.log(chalk.yellow('Warning: Could not create checkpoint'), error);
          }
        }

        spinner.text = 'Compressing database...';

        // Create gzip compressed backup
        const input = createReadStream(dbPath);
        const output = createWriteStream(backupPath);
        const gzip = createGzip({ level: 9 });

        await pipeline(input, gzip, output);

        const backupSize = getDatabaseSize(backupPath);
        const compressionRatio = dbSize > 0 ? ((1 - (backupSize / dbSize)) * 100).toFixed(2) : '0';

        spinner.succeed(chalk.green('Backup created successfully!'));

        console.log(chalk.bold('\nBackup Details:'));
        console.log(`  Location: ${backupPath}`);
        console.log(`  Original: ${formatFileSize(dbSize)}`);
        console.log(`  Compressed: ${formatFileSize(backupSize)}`);
        console.log(`  Compression: ${compressionRatio}%`);

        if (options.verbose) {
          console.log(chalk.gray(`\nBackup directory: ${backupDir}`));
          console.log(chalk.gray(`Timestamp: ${dateStr} ${timeStr.replace(/-/g, ':')}`));
        }

      } catch (error) {
        spinner.fail('Backup failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

/**
 * db restore - Restore from backup
 */
function createRestoreCommand(): Command {
  return new Command('restore')
    .description('Restore database from compressed backup')
    .argument('<backup>', 'Path to backup file (.db.gz)')
    .option('-f, --force', 'Overwrite existing database without confirmation', false)
    .option('--dry-run', 'Preview restore without modifying database', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (backupFile: string, options: RestoreOptions) => {
      const spinner = ora('Preparing database restore...').start();

      try {
        if (!existsSync(backupFile)) {
          spinner.fail(`Backup file not found: ${backupFile}`);
          process.exit(1);
        }

        if (!backupFile.endsWith('.db.gz')) {
          spinner.fail('Backup file must have .db.gz extension');
          process.exit(1);
        }

        const dbPath = getDefaultDbPath();
        const dbExists = existsSync(dbPath);
        const backupSize = getDatabaseSize(backupFile);

        if (options.verbose) {
          console.log(chalk.gray(`\nBackup: ${backupFile}`));
          console.log(chalk.gray(`Size: ${formatFileSize(backupSize)}`));
          console.log(chalk.gray(`Target: ${dbPath}`));
          console.log(chalk.gray(`Exists: ${dbExists ? 'Yes' : 'No'}`));
        }

        if (dbExists && !options.force && !options.dryRun) {
          spinner.warn('Database already exists!');
          console.log(chalk.yellow('\nWARNING: This will overwrite the existing database.'));
          console.log(chalk.yellow('Use --force to skip this confirmation.'));
          process.exit(1);
        }

        if (options.dryRun) {
          spinner.info(chalk.yellow('[DRY RUN] Would restore:'));
          console.log(chalk.cyan(`  From: ${backupFile}`));
          console.log(chalk.cyan(`  To: ${dbPath}`));
          console.log(chalk.cyan(`  Backup size: ${formatFileSize(backupSize)}`));
          if (dbExists) {
            console.log(chalk.yellow(`  Will overwrite existing database`));
          }
          process.exit(0);
        }

        // Create backup of current database if it exists
        if (dbExists) {
          spinner.text = 'Creating safety backup of current database...';
          const safetyBackup = `${dbPath}.pre-restore-${Date.now()}.bak`;
          try {
            writeFileSync(safetyBackup, readFileSync(dbPath));
            if (options.verbose) {
              console.log(chalk.gray(`\nSafety backup: ${safetyBackup}`));
            }
          } catch (error) {
            spinner.warn('Could not create safety backup');
            if (options.verbose) {
              console.log(chalk.yellow('Warning:'), error);
            }
          }
        }

        spinner.text = 'Decompressing backup...';

        // Ensure database directory exists
        const dbDir = dirname(dbPath);
        if (!existsSync(dbDir)) {
          mkdirSync(dbDir, { recursive: true });
        }

        // Decompress backup
        const input = createReadStream(backupFile);
        const output = createWriteStream(dbPath);
        const gunzip = createGunzip();

        await pipeline(input, gunzip, output);

        spinner.text = 'Verifying restored database...';

        // Verify database integrity
        const db = new Database(dbPath);
        try {
          const integrityResult = db.pragma('integrity_check', { simple: true });

          if (Array.isArray(integrityResult) && integrityResult[0] !== 'ok') {
            spinner.fail('Restored database integrity check failed!');
            console.error(chalk.red('Integrity issues:'), integrityResult);
            db.close();
            process.exit(1);
          }

          db.close();
        } catch (error) {
          db.close();
          throw error;
        }

        const restoredSize = getDatabaseSize(dbPath);

        spinner.succeed(chalk.green('Database restored successfully!'));

        console.log(chalk.bold('\nRestore Details:'));
        console.log(`  Source: ${basename(backupFile)}`);
        console.log(`  Database: ${dbPath}`);
        console.log(`  Size: ${formatFileSize(restoredSize)}`);
        console.log(chalk.green('  ✓ Integrity verified'));

      } catch (error) {
        spinner.fail('Database restore failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
