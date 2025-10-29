/**
 * Diagnostics Commands
 *
 * System diagnostic and health check commands:
 * - weaver diagnose - Run comprehensive system diagnostics
 * - weaver version  - Show version information
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync, statSync, accessSync, constants } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import Database from 'better-sqlite3';
import packageJson from '../../../../package.json' with { type: 'json' };

interface DiagnosticCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface DiskSpaceInfo {
  available: number;
  total: number;
  used: number;
  percentUsed: number;
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Check disk space
 */
function checkDiskSpace(): DiskSpaceInfo {
  try {
    const homeDir = homedir();
    const output = execSync(`df -k "${homeDir}" | tail -1`).toString();
    const parts = output.trim().split(/\s+/);

    const total = parseInt(parts[1]) * 1024; // Convert from KB to bytes
    const used = parseInt(parts[2]) * 1024;
    const available = parseInt(parts[3]) * 1024;
    const percentUsed = parseFloat(parts[4]);

    return { total, used, available, percentUsed };
  } catch (error) {
    return { total: 0, used: 0, available: 0, percentUsed: 0 };
  }
}

/**
 * Check if port is available
 */
function isPortAvailable(port: number): boolean {
  try {
    execSync(`lsof -i:${port}`, { stdio: 'ignore' });
    return false; // Port is in use
  } catch {
    return true; // Port is available
  }
}

/**
 * Check file/directory permissions
 */
function checkPermissions(path: string): { readable: boolean; writable: boolean } {
  try {
    accessSync(path, constants.R_OK);
    const readable = true;

    try {
      accessSync(path, constants.W_OK);
      return { readable, writable: true };
    } catch {
      return { readable, writable: false };
    }
  } catch {
    return { readable: false, writable: false };
  }
}

/**
 * Get dependency versions
 */
function getDependencyVersions(): Record<string, string> {
  const deps = packageJson.dependencies;
  const important = [
    'better-sqlite3',
    'commander',
    '@modelcontextprotocol/sdk',
    'chokidar',
    'next',
    'hono',
  ];

  const versions: Record<string, string> = {};
  for (const dep of important) {
    if (deps[dep as keyof typeof deps]) {
      versions[dep] = deps[dep as keyof typeof deps];
    }
  }

  return versions;
}

/**
 * Run diagnostic checks
 */
async function runDiagnostics(): Promise<DiagnosticCheck[]> {
  const checks: DiagnosticCheck[] = [];
  const weaverDir = join(homedir(), '.weaver');
  const dbPath = join(weaverDir, 'memory', 'experiences.db');

  // Check 1: Weaver directory
  if (existsSync(weaverDir)) {
    const perms = checkPermissions(weaverDir);
    if (perms.readable && perms.writable) {
      checks.push({
        name: 'Weaver Directory',
        status: 'ok',
        message: 'Directory exists with proper permissions',
        details: weaverDir,
      });
    } else {
      checks.push({
        name: 'Weaver Directory',
        status: 'error',
        message: `Insufficient permissions (R:${perms.readable} W:${perms.writable})`,
        details: weaverDir,
      });
    }
  } else {
    checks.push({
      name: 'Weaver Directory',
      status: 'warning',
      message: 'Directory does not exist (will be created on first use)',
      details: weaverDir,
    });
  }

  // Check 2: Database
  if (existsSync(dbPath)) {
    try {
      const db = new Database(dbPath);
      const integrityResult = db.pragma('integrity_check', { simple: true });
      db.close();

      if (Array.isArray(integrityResult) && integrityResult[0] === 'ok') {
        const size = statSync(dbPath).size;
        checks.push({
          name: 'Database',
          status: 'ok',
          message: `Healthy (${formatBytes(size)})`,
          details: dbPath,
        });
      } else {
        checks.push({
          name: 'Database',
          status: 'error',
          message: 'Integrity check failed',
          details: JSON.stringify(integrityResult),
        });
      }
    } catch (error) {
      checks.push({
        name: 'Database',
        status: 'error',
        message: 'Failed to open database',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    checks.push({
      name: 'Database',
      status: 'warning',
      message: 'Database does not exist (will be created on first use)',
      details: dbPath,
    });
  }

  // Check 3: Disk Space
  const diskSpace = checkDiskSpace();
  if (diskSpace.available > 1024 * 1024 * 1024) { // > 1GB
    checks.push({
      name: 'Disk Space',
      status: 'ok',
      message: `${formatBytes(diskSpace.available)} available`,
      details: `${diskSpace.percentUsed.toFixed(1)}% used`,
    });
  } else if (diskSpace.available > 100 * 1024 * 1024) { // > 100MB
    checks.push({
      name: 'Disk Space',
      status: 'warning',
      message: `Low space: ${formatBytes(diskSpace.available)} available`,
      details: `${diskSpace.percentUsed.toFixed(1)}% used`,
    });
  } else {
    checks.push({
      name: 'Disk Space',
      status: 'error',
      message: `Critical: ${formatBytes(diskSpace.available)} available`,
      details: `${diskSpace.percentUsed.toFixed(1)}% used`,
    });
  }

  // Check 4: Port Availability
  const ports = [3000, 3001];
  const portStatus = ports.map(port => ({
    port,
    available: isPortAvailable(port),
  }));

  const allPortsAvailable = portStatus.every(p => p.available);
  const unavailablePorts = portStatus.filter(p => !p.available).map(p => p.port);

  if (allPortsAvailable) {
    checks.push({
      name: 'Port Availability',
      status: 'ok',
      message: `Ports ${ports.join(', ')} available`,
    });
  } else {
    checks.push({
      name: 'Port Availability',
      status: 'warning',
      message: `Ports in use: ${unavailablePorts.join(', ')}`,
      details: 'Services may conflict or already be running',
    });
  }

  // Check 5: Node.js Version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (majorVersion >= 20) {
    checks.push({
      name: 'Node.js Version',
      status: 'ok',
      message: nodeVersion,
      details: 'Meets minimum requirement (>=20.0.0)',
    });
  } else {
    checks.push({
      name: 'Node.js Version',
      status: 'error',
      message: nodeVersion,
      details: 'Requires Node.js >=20.0.0',
    });
  }

  // Check 6: Configuration File
  const configLocations = [
    join(process.cwd(), '.weaverrc'),
    join(process.cwd(), '.weaverrc.json'),
    join(weaverDir, 'config.json'),
  ];

  const configExists = configLocations.some(loc => existsSync(loc));
  const configPath = configLocations.find(loc => existsSync(loc));

  if (configExists && configPath) {
    const perms = checkPermissions(configPath);
    if (perms.readable) {
      checks.push({
        name: 'Configuration',
        status: 'ok',
        message: 'Configuration file found and readable',
        details: configPath,
      });
    } else {
      checks.push({
        name: 'Configuration',
        status: 'error',
        message: 'Configuration file not readable',
        details: configPath,
      });
    }
  } else {
    checks.push({
      name: 'Configuration',
      status: 'warning',
      message: 'No configuration file found (using defaults)',
      details: 'Optional: Create .weaverrc or .weaver/config.json',
    });
  }

  return checks;
}

/**
 * Create diagnostics command
 */
export function createDiagnoseCommand(): Command {
  return new Command('diagnose')
    .description('Run comprehensive system diagnostic checks')
    .option('-v, --verbose', 'Show detailed diagnostic information', false)
    .action(async (options: { verbose?: boolean }) => {
      const spinner = ora('Running diagnostics...').start();

      try {
        const checks = await runDiagnostics();

        spinner.succeed('Diagnostics complete');

        console.log(chalk.bold('\n🔍 System Diagnostics Report\n'));

        let hasErrors = false;
        let hasWarnings = false;

        for (const check of checks) {
          const icon =
            check.status === 'ok' ? chalk.green('✓') :
            check.status === 'warning' ? chalk.yellow('⚠') :
            chalk.red('✗');

          const status =
            check.status === 'ok' ? chalk.green('OK') :
            check.status === 'warning' ? chalk.yellow('WARNING') :
            chalk.red('ERROR');

          console.log(`${icon} ${chalk.bold(check.name.padEnd(20))} ${status}`);
          console.log(`  ${check.message}`);

          if (check.details && options.verbose) {
            console.log(chalk.gray(`  ${check.details}`));
          }
          console.log();

          if (check.status === 'error') hasErrors = true;
          if (check.status === 'warning') hasWarnings = true;
        }

        console.log(chalk.gray('─'.repeat(60)));

        if (hasErrors) {
          console.log(chalk.red('\n❌ Critical issues detected - please resolve errors'));
        } else if (hasWarnings) {
          console.log(chalk.yellow('\n⚠️  System is operational with warnings'));
        } else {
          console.log(chalk.green('\n✅ All checks passed - system is healthy'));
        }

      } catch (error) {
        spinner.fail('Diagnostics failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

/**
 * Create version command
 */
export function createVersionCommand(): Command {
  return new Command('version')
    .description('Show version information with dependency versions')
    .option('-v, --verbose', 'Show all dependency versions', false)
    .action((options: { verbose?: boolean }) => {
      console.log(chalk.bold(`\n${packageJson.name} v${packageJson.version}\n`));

      console.log(chalk.gray('Runtime:'));
      console.log(`  Node.js:  ${process.version}`);
      console.log(`  Platform: ${process.platform} ${process.arch}`);
      console.log();

      console.log(chalk.gray('Key Dependencies:'));
      const versions = getDependencyVersions();

      for (const [name, version] of Object.entries(versions)) {
        const displayName = name.padEnd(30);
        console.log(`  ${chalk.cyan(displayName)} ${version}`);
      }

      if (options.verbose) {
        console.log(chalk.gray('\nAll Dependencies:'));
        const allDeps = { ...packageJson.dependencies };

        for (const [name, version] of Object.entries(allDeps)) {
          if (!versions[name]) {
            const displayName = name.padEnd(30);
            console.log(chalk.gray(`  ${displayName} ${version}`));
          }
        }
      }

      console.log();
    });
}
