/**
 * CLI Integration Test Setup
 * Test infrastructure for service management CLI commands
 */

import { execa, type ExecaChildProcess } from 'execa';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import type { ServiceConfig, ServiceInstance } from '../../../src/service-manager/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Test context for CLI integration tests
 */
export interface TestContext {
  testDir: string;
  configDir: string;
  logsDir: string;
  dataDir: string;
  cleanup: () => Promise<void>;
}

/**
 * Mock service configuration factory
 */
export interface MockServiceOptions {
  name?: string;
  port?: number;
  script?: string;
  env?: Record<string, string>;
  healthEndpoint?: string;
  shouldFail?: boolean;
}

/**
 * Create test context with temporary directories
 */
export async function createTestContext(): Promise<TestContext> {
  const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'weaver-cli-test-'));
  const configDir = path.join(testDir, 'config');
  const logsDir = path.join(testDir, 'logs');
  const dataDir = path.join(testDir, 'data');

  // Create directories
  await Promise.all([
    fs.mkdir(configDir, { recursive: true }),
    fs.mkdir(logsDir, { recursive: true }),
    fs.mkdir(dataDir, { recursive: true }),
  ]);

  // Setup cleanup
  const cleanup = async () => {
    try {
      // Kill any running test processes
      await killAllTestProcesses();

      // Remove test directory
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  return {
    testDir,
    configDir,
    logsDir,
    dataDir,
    cleanup,
  };
}

/**
 * Create mock service script
 */
export async function createMockService(
  testDir: string,
  options: MockServiceOptions = {}
): Promise<string> {
  const {
    name = 'test-service',
    port = 3333,
    shouldFail = false,
  } = options;

  const serviceScript = `#!/usr/bin/env node
import http from 'http';

const port = ${port};
const shouldFail = ${shouldFail};

if (shouldFail) {
  console.error('Service configured to fail');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: '${name}' }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Mock Service Running');
  }
});

server.listen(port, () => {
  console.log(\`Mock service ${name} listening on port \${port}\`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
`;

  const scriptPath = path.join(testDir, `${name}.mjs`);
  await fs.writeFile(scriptPath, serviceScript);
  await fs.chmod(scriptPath, 0o755);

  return scriptPath;
}

/**
 * Create mock service configuration
 */
export function createMockConfig(
  name: string,
  scriptPath: string,
  options: Partial<ServiceConfig> = {}
): ServiceConfig {
  return {
    name,
    type: 'custom',
    enabled: true,
    script: scriptPath,
    interpreter: 'node',
    args: [],
    max_restarts: 3,
    min_uptime: 1000,
    health: {
      enabled: true,
      endpoint: `http://localhost:3333/health`,
      interval: 5000,
      timeout: 3000,
      retries: 3,
    },
    logs: {
      directory: './logs',
      stdout_file: `./logs/${name}-out.log`,
      stderr_file: `./logs/${name}-error.log`,
    },
    ...options,
  };
}

/**
 * Execute CLI command with execa
 */
export async function execCLI(
  command: string,
  args: string[] = [],
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    reject?: boolean;
  } = {}
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  failed: boolean;
}> {
  const cliPath = path.resolve(__dirname, '../../../dist/cli/index.js');

  try {
    const result = await execa('node', [cliPath, command, ...args], {
      cwd: options.cwd || process.cwd(),
      env: { ...process.env, ...options.env },
      timeout: options.timeout || 30000,
      reject: options.reject ?? false,
      all: true,
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode || 0,
      failed: result.failed || false,
    };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.exitCode || 1,
      failed: true,
    };
  }
}

/**
 * Execute CLI command in background
 */
export function execCLIBackground(
  command: string,
  args: string[] = [],
  options: {
    cwd?: string;
    env?: Record<string, string>;
  } = {}
): ExecaChildProcess {
  const cliPath = path.resolve(__dirname, '../../../dist/cli/index.js');

  return execa('node', [cliPath, command, ...args], {
    cwd: options.cwd || process.cwd(),
    env: { ...process.env, ...options.env },
    cleanup: true,
    detached: false,
  });
}

/**
 * Wait for service to be ready
 */
export async function waitForService(
  port: number,
  timeout = 10000,
  interval = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Service not ready yet
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * Wait for service to stop
 */
export async function waitForServiceStop(
  port: number,
  timeout = 10000,
  interval = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await fetch(`http://localhost:${port}/health`);
      // Still responding, wait more
    } catch {
      // Service stopped
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return false;
}

/**
 * Kill all test processes
 */
export async function killAllTestProcesses(): Promise<void> {
  try {
    // Use PM2 to kill all test services
    await execa('npx', ['pm2', 'delete', 'all'], {
      reject: false,
      timeout: 5000,
    });
  } catch (error) {
    // Ignore errors - processes might not exist
  }
}

/**
 * Read log file
 */
export async function readLogFile(
  logPath: string,
  lines = 100
): Promise<string[]> {
  try {
    const content = await fs.readFile(logPath, 'utf-8');
    const allLines = content.split('\n').filter(line => line.trim());
    return allLines.slice(-lines);
  } catch (error) {
    return [];
  }
}

/**
 * Check if port is in use
 */
export async function isPortInUse(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get available port
 */
export async function getAvailablePort(startPort = 3000): Promise<number> {
  let port = startPort;
  while (await isPortInUse(port)) {
    port++;
    if (port > startPort + 100) {
      throw new Error('No available ports found');
    }
  }
  return port;
}

/**
 * Create mock database file
 */
export async function createMockDatabase(
  testDir: string,
  data: Record<string, any> = {}
): Promise<string> {
  const dbPath = path.join(testDir, 'test.db');
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
  return dbPath;
}

/**
 * Corrupt database file (for testing recovery)
 */
export async function corruptDatabase(dbPath: string): Promise<void> {
  await fs.writeFile(dbPath, 'CORRUPTED DATA {{{ invalid json');
}

/**
 * Assert process is running
 */
export async function assertProcessRunning(name: string): Promise<boolean> {
  const result = await execCLI('service', ['status', name], { reject: false });
  return result.stdout.includes('running') || result.stdout.includes('online');
}

/**
 * Assert process is stopped
 */
export async function assertProcessStopped(name: string): Promise<boolean> {
  const result = await execCLI('service', ['status', name], { reject: false });
  return result.stdout.includes('stopped') || result.failed;
}

/**
 * Get process metrics from CLI
 */
export async function getProcessMetrics(name: string): Promise<{
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
}> {
  const result = await execCLI('service', ['metrics', name]);

  // Parse CLI output (simplified - adjust based on actual format)
  const lines = result.stdout.split('\n');
  const metrics = {
    cpu: 0,
    memory: 0,
    uptime: 0,
    restarts: 0,
  };

  for (const line of lines) {
    if (line.includes('CPU:')) {
      metrics.cpu = parseFloat(line.match(/[\d.]+/)?.[0] || '0');
    }
    if (line.includes('Memory:')) {
      metrics.memory = parseFloat(line.match(/[\d.]+/)?.[0] || '0');
    }
    if (line.includes('Uptime:')) {
      metrics.uptime = parseFloat(line.match(/[\d.]+/)?.[0] || '0');
    }
    if (line.includes('Restarts:')) {
      metrics.restarts = parseInt(line.match(/\d+/)?.[0] || '0', 10);
    }
  }

  return metrics;
}

/**
 * Simulate crash (send kill signal)
 */
export async function simulateCrash(name: string): Promise<void> {
  try {
    await execa('npx', ['pm2', 'stop', name], { timeout: 3000 });
    await new Promise(resolve => setTimeout(resolve, 500));
    await execa('npx', ['pm2', 'start', name], { timeout: 3000 });
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Create config file
 */
export async function createConfigFile(
  configDir: string,
  name: string,
  config: ServiceConfig
): Promise<string> {
  const configPath = path.join(configDir, `${name}.json`);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

/**
 * Update config file
 */
export async function updateConfigFile(
  configPath: string,
  updates: Partial<ServiceConfig>
): Promise<void> {
  const content = await fs.readFile(configPath, 'utf-8');
  const config = JSON.parse(content);
  const updated = { ...config, ...updates };
  await fs.writeFile(configPath, JSON.stringify(updated, null, 2));
}
