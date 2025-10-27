import { mkdir, writeFile, rm, readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

export interface TestFixture {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Create a temporary test vault directory
 */
export async function createTempVault(): Promise<TestFixture> {
  const tempPath = join(tmpdir(), `vault-test-${randomBytes(8).toString('hex')}`);
  await mkdir(tempPath, { recursive: true });

  return {
    path: tempPath,
    cleanup: async () => {
      try {
        await rm(tempPath, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to cleanup temp vault: ${tempPath}`, error);
      }
    }
  };
}

/**
 * Create a temporary project directory with given files
 */
export async function createTestProject(
  files: Record<string, string>
): Promise<TestFixture> {
  const tempPath = join(tmpdir(), `project-test-${randomBytes(8).toString('hex')}`);
  await mkdir(tempPath, { recursive: true });

  // Write all files
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = join(tempPath, filePath);
    const dir = join(fullPath, '..');
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, content, 'utf-8');
  }

  return {
    path: tempPath,
    cleanup: async () => {
      try {
        await rm(tempPath, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to cleanup test project: ${tempPath}`, error);
      }
    }
  };
}

/**
 * Validate vault structure
 */
export async function validateVaultStructure(vaultPath: string): Promise<{
  valid: boolean;
  errors: string[];
  structure: {
    hasSpecKit: boolean;
    hasWorkflows: boolean;
    hasMemory: boolean;
    hasMarkdown: boolean;
    hasShadowCache: boolean;
  };
}> {
  const errors: string[] = [];
  const structure = {
    hasSpecKit: false,
    hasWorkflows: false,
    hasMemory: false,
    hasMarkdown: false,
    hasShadowCache: false
  };

  try {
    // Check .vault directory
    const vaultDir = join(vaultPath, '.vault');
    const vaultStat = await stat(vaultDir);
    if (!vaultStat.isDirectory()) {
      errors.push('.vault is not a directory');
    }

    // Check spec-kit
    const specKitPath = join(vaultDir, 'spec-kit');
    try {
      await stat(specKitPath);
      structure.hasSpecKit = true;
    } catch {
      errors.push('Missing spec-kit directory');
    }

    // Check workflows
    const workflowsPath = join(vaultDir, 'workflows');
    try {
      await stat(workflowsPath);
      structure.hasWorkflows = true;
    } catch {
      errors.push('Missing workflows directory');
    }

    // Check memory
    const memoryPath = join(vaultDir, 'memory');
    try {
      await stat(memoryPath);
      structure.hasMemory = true;
    } catch {
      errors.push('Missing memory directory');
    }

    // Check markdown files
    const markdownPath = join(vaultPath, 'README.md');
    try {
      await stat(markdownPath);
      structure.hasMarkdown = true;
    } catch {
      errors.push('Missing README.md');
    }

    // Check shadow cache
    const shadowCachePath = join(vaultDir, 'shadow-cache.db');
    try {
      await stat(shadowCachePath);
      structure.hasShadowCache = true;
    } catch {
      errors.push('Missing shadow-cache.db');
    }

  } catch (error) {
    errors.push(`Failed to validate vault structure: ${error}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    structure
  };
}

/**
 * Read all files in a directory recursively
 */
export async function readDirectoryRecursive(
  dirPath: string,
  basePath: string = dirPath
): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    const relativePath = fullPath.substring(basePath.length + 1);

    if (entry.isDirectory()) {
      const subFiles = await readDirectoryRecursive(fullPath, basePath);
      for (const [path, content] of subFiles) {
        files.set(path, content);
      }
    } else if (entry.isFile()) {
      const content = await readFile(fullPath, 'utf-8');
      files.set(relativePath, content);
    }
  }

  return files;
}

/**
 * Validate markdown file content
 */
export function validateMarkdownContent(content: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required sections
  const requiredSections = [
    '# Project Overview',
    '## Architecture',
    '## Development Setup',
    '## Testing Strategy'
  ];

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      errors.push(`Missing required section: ${section}`);
    }
  }

  // Check for frontmatter
  if (!content.startsWith('---')) {
    errors.push('Missing frontmatter');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Measure execution time
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  return { result, duration };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Count files in a directory recursively
 */
export async function countFiles(dirPath: string): Promise<number> {
  let count = 0;
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += await countFiles(join(dirPath, entry.name));
    } else if (entry.isFile()) {
      count++;
    }
  }

  return count;
}
