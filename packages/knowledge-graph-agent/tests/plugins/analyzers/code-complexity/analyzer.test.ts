/**
 * Tests for Code Complexity Analyzer
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  CodeComplexityAnalyzer,
  analyzeFileComplexity,
  analyzeProjectComplexity,
} from '../../../../src/plugins/analyzers/code-complexity/analyzer.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const SIMPLE_FUNCTION = `
export function add(a: number, b: number): number {
  return a + b;
}
`;

const COMPLEX_FUNCTION = `
export function processData(items: unknown[]) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (typeof item === 'object' && item !== null) {
      if ('type' in item) {
        switch (item.type) {
          case 'a':
            if ('value' in item && typeof item.value === 'number') {
              if (item.value > 0) {
                results.push({ processed: true, value: item.value * 2 });
              } else if (item.value < 0) {
                results.push({ processed: true, value: Math.abs(item.value) });
              } else {
                results.push({ processed: false, value: 0 });
              }
            }
            break;
          case 'b':
            if ('data' in item && Array.isArray(item.data)) {
              for (const d of item.data) {
                if (d && typeof d === 'string') {
                  results.push({ processed: true, text: d.toUpperCase() });
                }
              }
            }
            break;
          default:
            results.push({ processed: false, original: item });
        }
      }
    } else if (typeof item === 'string') {
      results.push({ processed: true, text: item });
    } else if (typeof item === 'number') {
      results.push({ processed: true, value: item });
    }
  }

  return results;
}
`;

const MULTIPLE_FUNCTIONS = `
export function simple() {
  return 1;
}

export function withBranch(x: number) {
  if (x > 0) {
    return 'positive';
  }
  return 'non-positive';
}

export function withLoop(items: number[]) {
  let sum = 0;
  for (const item of items) {
    sum += item;
  }
  return sum;
}

export class Calculator {
  private value = 0;

  constructor(initial: number) {
    this.value = initial;
  }

  add(x: number) {
    if (x > 0) {
      this.value += x;
    }
    return this;
  }

  multiply(x: number) {
    this.value *= x;
    return this;
  }

  getValue() {
    return this.value;
  }
}
`;

// ============================================================================
// Test Setup
// ============================================================================

let testDir: string;

beforeEach(async () => {
  testDir = join(tmpdir(), `complexity-test-${Date.now()}`);
  await mkdir(testDir, { recursive: true });
});

afterEach(async () => {
  try {
    await rm(testDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

// ============================================================================
// CodeComplexityAnalyzer Tests
// ============================================================================

describe('CodeComplexityAnalyzer', () => {
  describe('analyzeFile', () => {
    it('analyzes a simple TypeScript file', async () => {
      const filePath = join(testDir, 'simple.ts');
      await writeFile(filePath, SIMPLE_FUNCTION);

      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeFile(filePath);

      expect(result).not.toBeNull();
      expect(result?.filePath).toBe(filePath);
      expect(result?.functions.length).toBe(1);
      expect(result?.functions[0].name).toBe('add');
      expect(result?.functions[0].complexity.cyclomatic).toBe(1);
      expect(result?.level).toBe('low');
    });

    it('analyzes a complex function', async () => {
      const filePath = join(testDir, 'complex.ts');
      await writeFile(filePath, COMPLEX_FUNCTION);

      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeFile(filePath);

      expect(result).not.toBeNull();
      expect(result?.functions.length).toBe(1);
      expect(result?.functions[0].name).toBe('processData');
      expect(result?.functions[0].complexity.cyclomatic).toBeGreaterThan(10);
      expect(result?.complexFunctions.length).toBeGreaterThan(0);
    });

    it('extracts multiple functions', async () => {
      const filePath = join(testDir, 'multiple.ts');
      await writeFile(filePath, MULTIPLE_FUNCTIONS);

      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeFile(filePath);

      expect(result).not.toBeNull();
      // 3 functions + constructor + 3 methods
      expect(result?.functions.length).toBeGreaterThanOrEqual(3);
      expect(result?.classCount).toBe(1);
    });

    it('returns null for non-existent file', async () => {
      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeFile(join(testDir, 'nonexistent.ts'));

      expect(result).toBeNull();
    });

    it('returns null for non-TypeScript file', async () => {
      const filePath = join(testDir, 'readme.md');
      await writeFile(filePath, '# Readme');

      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeFile(filePath);

      expect(result).toBeNull();
    });

    it('handles parse errors gracefully', async () => {
      const filePath = join(testDir, 'invalid.ts');
      await writeFile(filePath, 'function broken( { return 1; }');

      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeFile(filePath);

      // Should return null or handle error
      expect(result === null || result?.parseErrors?.length > 0).toBe(true);
    });
  });

  describe('analyzeProject', () => {
    it('analyzes all TypeScript files in project', async () => {
      // Create test files
      await writeFile(join(testDir, 'simple.ts'), SIMPLE_FUNCTION);
      await writeFile(join(testDir, 'complex.ts'), COMPLEX_FUNCTION);

      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeProject();

      expect(result.files.length).toBe(2);
      expect(result.metrics.totalFiles).toBe(2);
      expect(result.metrics.totalFunctions).toBeGreaterThanOrEqual(2);
    });

    it('respects include patterns', async () => {
      await mkdir(join(testDir, 'src'), { recursive: true });
      await mkdir(join(testDir, 'other'), { recursive: true });
      await writeFile(join(testDir, 'src', 'main.ts'), SIMPLE_FUNCTION);
      await writeFile(join(testDir, 'other', 'util.ts'), SIMPLE_FUNCTION);

      const analyzer = new CodeComplexityAnalyzer({
        projectRoot: testDir,
        patterns: {
          include: ['src/**/*.ts'],
          exclude: [],
        },
      });
      const result = await analyzer.analyzeProject();

      expect(result.files.length).toBe(1);
      expect(result.files[0].relativePath).toContain('src');
    });

    it('respects exclude patterns', async () => {
      await writeFile(join(testDir, 'main.ts'), SIMPLE_FUNCTION);
      await writeFile(join(testDir, 'main.test.ts'), SIMPLE_FUNCTION);

      const analyzer = new CodeComplexityAnalyzer({
        projectRoot: testDir,
        patterns: {
          include: ['**/*.ts'],
          exclude: ['**/*.test.ts'],
        },
        includeTests: false,
      });
      const result = await analyzer.analyzeProject();

      expect(result.files.length).toBe(1);
      expect(result.files[0].relativePath).not.toContain('test');
    });

    it('identifies hotspots', async () => {
      await writeFile(join(testDir, 'simple.ts'), SIMPLE_FUNCTION);
      await writeFile(join(testDir, 'complex.ts'), COMPLEX_FUNCTION);

      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeProject();

      expect(result.hotspots.length).toBeGreaterThanOrEqual(1);
      expect(result.hotspots[0].relativePath).toContain('complex');
    });

    it('collects complex functions across project', async () => {
      await writeFile(join(testDir, 'simple.ts'), SIMPLE_FUNCTION);
      await writeFile(join(testDir, 'complex.ts'), COMPLEX_FUNCTION);

      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeProject();

      expect(result.complexFunctions.length).toBeGreaterThanOrEqual(1);
      expect(result.complexFunctions[0].name).toBe('processData');
    });

    it('calculates project metrics', async () => {
      await writeFile(join(testDir, 'file1.ts'), SIMPLE_FUNCTION);
      await writeFile(join(testDir, 'file2.ts'), MULTIPLE_FUNCTIONS);

      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeProject();

      expect(result.metrics.totalFiles).toBeGreaterThan(0);
      expect(result.metrics.totalFunctions).toBeGreaterThan(0);
      expect(result.metrics.avgCyclomatic).toBeGreaterThan(0);
      expect(result.metrics.complexityDistribution).toBeDefined();
    });

    it('respects maxFiles limit', async () => {
      await writeFile(join(testDir, 'file1.ts'), SIMPLE_FUNCTION);
      await writeFile(join(testDir, 'file2.ts'), SIMPLE_FUNCTION);
      await writeFile(join(testDir, 'file3.ts'), SIMPLE_FUNCTION);

      const analyzer = new CodeComplexityAnalyzer({
        projectRoot: testDir,
        maxFiles: 2,
      });
      const result = await analyzer.analyzeProject();

      expect(result.files.length).toBe(2);
    });

    it('records timing information', async () => {
      await writeFile(join(testDir, 'simple.ts'), SIMPLE_FUNCTION);

      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });
      const result = await analyzer.analyzeProject();

      expect(result.timing.startedAt).toBeInstanceOf(Date);
      expect(result.timing.completedAt).toBeInstanceOf(Date);
      expect(result.timing.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('cache management', () => {
    it('clears source cache', async () => {
      const analyzer = new CodeComplexityAnalyzer({ projectRoot: testDir });

      // This should not throw
      analyzer.clearCache();
    });
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('analyzeFileComplexity', () => {
  it('analyzes a single file', async () => {
    const filePath = join(testDir, 'test.ts');
    await writeFile(filePath, SIMPLE_FUNCTION);

    const result = await analyzeFileComplexity(filePath, testDir);

    expect(result).not.toBeNull();
    expect(result?.functions.length).toBe(1);
  });
});

describe('analyzeProjectComplexity', () => {
  it('analyzes a project directory', async () => {
    await writeFile(join(testDir, 'test.ts'), SIMPLE_FUNCTION);

    const result = await analyzeProjectComplexity(testDir);

    expect(result.files.length).toBeGreaterThan(0);
  });
});
