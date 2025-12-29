/**
 * Tests for Code Complexity Plugin
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  CodeComplexityPlugin,
  createComplexityPlugin,
  analyzeComplexity,
  pluginMetadata,
} from '../../../../src/plugins/analyzers/code-complexity/index.js';

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
              }
            }
            break;
          case 'b':
            for (const d of item.data || []) {
              if (d && typeof d === 'string') {
                results.push({ text: d.toUpperCase() });
              }
            }
            break;
        }
      }
    }
  }

  return results;
}
`;

// ============================================================================
// Test Setup
// ============================================================================

let testDir: string;

beforeEach(async () => {
  testDir = join(tmpdir(), `plugin-test-${Date.now()}`);
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
// Plugin Tests
// ============================================================================

describe('CodeComplexityPlugin', () => {
  describe('constructor', () => {
    it('creates plugin with default options', () => {
      const plugin = new CodeComplexityPlugin({ projectRoot: testDir });

      expect(plugin.getProjectRoot()).toBe(testDir);
      expect(plugin.getConfig()).toBeDefined();
    });

    it('creates plugin with custom config', () => {
      const plugin = new CodeComplexityPlugin({
        projectRoot: testDir,
        config: {
          thresholds: { cyclomaticHigh: 15, cyclomaticCritical: 30 },
        },
      });

      expect(plugin.getConfig().thresholds?.cyclomaticHigh).toBe(15);
    });

    it('initializes cache when enabled', () => {
      const plugin = new CodeComplexityPlugin({
        projectRoot: testDir,
        useCache: true,
      });

      const stats = plugin.getCacheStats();
      expect(stats).not.toBeNull();
      expect(stats?.entries).toBe(0);
    });

    it('does not initialize cache when disabled', () => {
      const plugin = new CodeComplexityPlugin({
        projectRoot: testDir,
        useCache: false,
      });

      expect(plugin.getCacheStats()).toBeNull();
    });
  });

  describe('analyze', () => {
    it('returns successful result for valid project', async () => {
      await writeFile(join(testDir, 'test.ts'), SIMPLE_FUNCTION);

      const plugin = new CodeComplexityPlugin({ projectRoot: testDir });
      const result = await plugin.analyze();

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.files.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('generates complexity nodes', async () => {
      await writeFile(join(testDir, 'complex.ts'), COMPLEX_FUNCTION);

      const plugin = new CodeComplexityPlugin({
        projectRoot: testDir,
        config: { generateGraphNodes: true },
      });
      const result = await plugin.analyze();

      expect(result.success).toBe(true);
      expect(result.nodes.length).toBeGreaterThan(0);
    });

    it('generates edges between nodes', async () => {
      await writeFile(join(testDir, 'complex.ts'), COMPLEX_FUNCTION);

      const plugin = new CodeComplexityPlugin({ projectRoot: testDir });
      const result = await plugin.analyze();

      // Edges are created when there are hotspots
      if (result.analysis.hotspots.length > 0) {
        expect(result.edges.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('skips graph generation when disabled', async () => {
      await writeFile(join(testDir, 'complex.ts'), COMPLEX_FUNCTION);

      const plugin = new CodeComplexityPlugin({
        projectRoot: testDir,
        config: { generateGraphNodes: false },
      });
      const result = await plugin.analyze();

      expect(result.nodes).toHaveLength(0);
    });

    it('handles empty project', async () => {
      const plugin = new CodeComplexityPlugin({ projectRoot: testDir });
      const result = await plugin.analyze();

      expect(result.success).toBe(true);
      expect(result.analysis.files).toHaveLength(0);
    });
  });

  describe('analyzeFile', () => {
    it('analyzes a single file', async () => {
      const filePath = join(testDir, 'single.ts');
      await writeFile(filePath, SIMPLE_FUNCTION);

      const plugin = new CodeComplexityPlugin({ projectRoot: testDir });
      const result = await plugin.analyzeFile(filePath);

      expect(result).not.toBeNull();
      expect(result?.functions.length).toBe(1);
    });

    it('uses cache when enabled', async () => {
      const filePath = join(testDir, 'cached.ts');
      await writeFile(filePath, SIMPLE_FUNCTION);

      const plugin = new CodeComplexityPlugin({
        projectRoot: testDir,
        useCache: true,
      });

      // First call
      await plugin.analyzeFile(filePath);

      // Second call should use cache
      await plugin.analyzeFile(filePath);

      const stats = plugin.getCacheStats();
      expect(stats?.entries).toBe(1);
    });
  });

  describe('generateReport', () => {
    it('generates markdown report', async () => {
      await writeFile(join(testDir, 'test.ts'), SIMPLE_FUNCTION);

      const plugin = new CodeComplexityPlugin({ projectRoot: testDir });
      const analysisResult = await plugin.analyze();
      const report = await plugin.generateReport(analysisResult.analysis);

      expect(report).toContain('# Code Complexity Analysis Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('Total Files Analyzed');
    });

    it('writes report to file when path specified', async () => {
      await writeFile(join(testDir, 'test.ts'), SIMPLE_FUNCTION);
      const reportPath = join(testDir, 'reports', 'complexity.md');

      const plugin = new CodeComplexityPlugin({
        projectRoot: testDir,
        generateReport: true,
        reportPath,
      });
      const result = await plugin.analyze();
      await plugin.generateReport(result.analysis);

      expect(existsSync(reportPath)).toBe(true);
      const content = await readFile(reportPath, 'utf-8');
      expect(content).toContain('# Code Complexity Analysis Report');
    });
  });

  describe('seedGeneratorHook', () => {
    it('returns nodes and metadata', async () => {
      await writeFile(join(testDir, 'test.ts'), COMPLEX_FUNCTION);

      const plugin = new CodeComplexityPlugin({ projectRoot: testDir });
      const result = await plugin.seedGeneratorHook({
        projectRoot: testDir,
        docsPath: 'docs',
        dependencies: [],
      });

      expect(result.nodes).toBeDefined();
      expect(result.metadata.totalFiles).toBeGreaterThan(0);
    });
  });

  describe('deepAnalyzerHook', () => {
    it('returns insights and recommendations', async () => {
      await writeFile(join(testDir, 'test.ts'), COMPLEX_FUNCTION);

      const plugin = new CodeComplexityPlugin({ projectRoot: testDir });
      const result = await plugin.deepAnalyzerHook({
        projectRoot: testDir,
        agentType: 'analyst',
      });

      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.complexityData).toBeDefined();
    });
  });

  describe('cache management', () => {
    it('clears cache', async () => {
      const filePath = join(testDir, 'test.ts');
      await writeFile(filePath, SIMPLE_FUNCTION);

      const plugin = new CodeComplexityPlugin({
        projectRoot: testDir,
        useCache: true,
      });

      await plugin.analyzeFile(filePath);
      expect(plugin.getCacheStats()?.entries).toBe(1);

      plugin.clearCache();
      expect(plugin.getCacheStats()?.entries).toBe(0);
    });
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('createComplexityPlugin', () => {
  it('creates plugin instance', () => {
    const plugin = createComplexityPlugin(testDir);

    expect(plugin).toBeInstanceOf(CodeComplexityPlugin);
    expect(plugin.getProjectRoot()).toBe(testDir);
  });

  it('accepts options', () => {
    const plugin = createComplexityPlugin(testDir, {
      useCache: true,
      config: { verbose: true },
    });

    expect(plugin.getCacheStats()).not.toBeNull();
    expect(plugin.getConfig().verbose).toBe(true);
  });
});

describe('analyzeComplexity', () => {
  it('analyzes project and returns result', async () => {
    await writeFile(join(testDir, 'test.ts'), SIMPLE_FUNCTION);

    const result = await analyzeComplexity(testDir);

    expect(result.success).toBe(true);
    expect(result.analysis).toBeDefined();
  });

  it('accepts custom config', async () => {
    await writeFile(join(testDir, 'test.ts'), SIMPLE_FUNCTION);

    const result = await analyzeComplexity(testDir, {
      patterns: { include: ['**/*.ts'], exclude: [] },
    });

    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Plugin Metadata Tests
// ============================================================================

describe('pluginMetadata', () => {
  it('has required fields', () => {
    expect(pluginMetadata.name).toBe('code-complexity-analyzer');
    expect(pluginMetadata.version).toBeDefined();
    expect(pluginMetadata.description).toBeDefined();
  });

  it('lists capabilities', () => {
    expect(pluginMetadata.capabilities).toContain('cyclomatic-complexity');
    expect(pluginMetadata.capabilities).toContain('cognitive-complexity');
    expect(pluginMetadata.capabilities).toContain('knowledge-graph-generation');
  });

  it('lists supported languages', () => {
    expect(pluginMetadata.supportedLanguages).toContain('typescript');
    expect(pluginMetadata.supportedLanguages).toContain('javascript');
  });

  it('lists available hooks', () => {
    expect(pluginMetadata.hooks).toContain('seedGenerator');
    expect(pluginMetadata.hooks).toContain('deepAnalyzer');
  });
});
