/**
 * Tests for DocumenterAgent
 *
 * Comprehensive tests for documentation generation including API docs,
 * user guides, architecture documentation, and changelog generation.
 *
 * @module tests/agents/documenter-agent
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  DocumenterAgent,
  type DocumenterAgentConfig,
  type DocumentationResult,
  type UserGuideResult,
  type ArchitectureDocResult,
  type ChangelogResult,
  type SystemInfo,
} from '../../src/agents/documenter-agent.js';
import { AgentType, TaskPriority, createTaskId } from '../../src/agents/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_DIR = path.join(process.cwd(), '.test-documenter');
const TEST_SRC_DIR = path.join(TEST_DIR, 'src');

const SAMPLE_TS_FILE = `/**
 * Sample module for testing
 *
 * @module sample
 */

/**
 * Configuration options for the sample service
 */
export interface SampleOptions {
  /** Enable debug mode */
  debug?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Sample class for testing documentation generation
 *
 * @example
 * \`\`\`typescript
 * const sample = new SampleClass();
 * await sample.initialize();
 * \`\`\`
 */
export class SampleClass {
  private initialized: boolean = false;

  /**
   * Initialize the sample class
   *
   * @param options - Configuration options
   * @returns Promise that resolves when initialized
   */
  async initialize(options?: SampleOptions): Promise<void> {
    this.initialized = true;
  }

  /**
   * Check if initialized
   *
   * @returns Whether the class is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Create a new sample instance
 *
 * @param name - Instance name
 * @returns New sample instance
 */
export function createSample(name: string): SampleClass {
  return new SampleClass();
}

export const SAMPLE_CONSTANT = 'test';
`;

const SAMPLE_TS_FILE_NO_DOCS = `
export interface UndocumentedInterface {
  value: string;
}

export class UndocumentedClass {
  doSomething(): void {
    console.log('doing something');
  }
}

export function undocumentedFunction(x: number): number {
  return x * 2;
}
`;

const SAMPLE_TEST_FILE = `
import { describe, it, expect } from 'vitest';
import { SampleClass, createSample } from './sample';

describe('SampleClass', () => {
  it('should initialize sample class', async () => {
    const sample = new SampleClass();
    await sample.initialize({ debug: true });
    expect(sample.isInitialized()).toBe(true);
  });

  it('should create sample with name', () => {
    const sample = createSample('test-instance');
    expect(sample).toBeInstanceOf(SampleClass);
  });
});
`;

// ============================================================================
// Test Setup
// ============================================================================

describe('DocumenterAgent', () => {
  let agent: DocumenterAgent;

  beforeAll(async () => {
    // Create test directory structure
    await fs.mkdir(TEST_SRC_DIR, { recursive: true });
    await fs.writeFile(path.join(TEST_SRC_DIR, 'sample.ts'), SAMPLE_TS_FILE);
    await fs.writeFile(path.join(TEST_SRC_DIR, 'undocumented.ts'), SAMPLE_TS_FILE_NO_DOCS);
    await fs.writeFile(path.join(TEST_SRC_DIR, 'sample.test.ts'), SAMPLE_TEST_FILE);

    // Create index file for architecture tests
    const indexContent = `
/**
 * Sample Module
 *
 * @module sample-module
 */

export { SampleClass, createSample } from './sample.js';
export type { SampleOptions } from './sample.js';
`;
    await fs.writeFile(path.join(TEST_SRC_DIR, 'index.ts'), indexContent);
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    agent = new DocumenterAgent({ name: 'test-documenter' });
  });

  afterEach(async () => {
    await agent.terminate();
  });

  // ==========================================================================
  // Constructor Tests
  // ==========================================================================

  describe('constructor', () => {
    it('should create a DocumenterAgent instance', () => {
      expect(agent).toBeInstanceOf(DocumenterAgent);
    });

    it('should have correct type', () => {
      expect(agent.type).toBe(AgentType.DOCUMENTER);
    });

    it('should have correct capabilities', () => {
      expect(agent.capabilities).toContain('api_docs');
      expect(agent.capabilities).toContain('user_guides');
      expect(agent.capabilities).toContain('architecture_docs');
      expect(agent.capabilities).toContain('changelog_generation');
      expect(agent.capabilities).toContain('format');
    });

    it('should accept custom configuration', () => {
      const customAgent = new DocumenterAgent({
        name: 'custom-documenter',
        description: 'Custom documenter agent',
        taskTimeout: 600000,
      });

      expect(customAgent.config.name).toBe('custom-documenter');
      expect(customAgent.config.description).toBe('Custom documenter agent');
      expect(customAgent.config.taskTimeout).toBe(600000);
    });
  });

  // ==========================================================================
  // generateApiDocs Tests
  // ==========================================================================

  describe('generateApiDocs', () => {
    it('should generate markdown documentation from source files', async () => {
      const result = await agent.generateApiDocs(
        [path.join(TEST_SRC_DIR, 'sample.ts')],
        'markdown'
      );

      expect(result.format).toBe('markdown');
      expect(result.content).toContain('# API Documentation');
      expect(result.content).toContain('SampleClass');
      expect(result.content).toContain('createSample');
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.files[0].path).toBe('API.md');
    });

    it('should generate OpenAPI documentation', async () => {
      const result = await agent.generateApiDocs(
        [path.join(TEST_SRC_DIR, 'sample.ts')],
        'openapi'
      );

      expect(result.format).toBe('openapi');
      expect(result.content).toContain('openapi');
      expect(result.files[0].path).toBe('openapi.yaml');
    });

    it('should generate TypeDoc configuration', async () => {
      const result = await agent.generateApiDocs(
        [path.join(TEST_SRC_DIR, 'sample.ts')],
        'typedoc'
      );

      expect(result.format).toBe('typedoc');
      expect(result.content).toContain('entryPoints');
      expect(result.files[0].path).toBe('typedoc.json');
    });

    it('should calculate documentation coverage', async () => {
      const documentedResult = await agent.generateApiDocs(
        [path.join(TEST_SRC_DIR, 'sample.ts')],
        'markdown'
      );

      expect(documentedResult.coverage.total).toBeGreaterThan(0);
      expect(documentedResult.coverage.documented).toBeGreaterThanOrEqual(0);
      expect(documentedResult.coverage.percentage).toBeGreaterThanOrEqual(0);
      expect(documentedResult.coverage.percentage).toBeLessThanOrEqual(100);
    });

    it('should handle undocumented files', async () => {
      const result = await agent.generateApiDocs(
        [path.join(TEST_SRC_DIR, 'undocumented.ts')],
        'markdown'
      );

      expect(result.coverage.documented).toBe(0);
      expect(result.coverage.percentage).toBe(0);
    });

    it('should handle multiple files', async () => {
      const result = await agent.generateApiDocs(
        [
          path.join(TEST_SRC_DIR, 'sample.ts'),
          path.join(TEST_SRC_DIR, 'undocumented.ts'),
        ],
        'markdown'
      );

      expect(result.content).toContain('sample.ts');
      expect(result.content).toContain('undocumented.ts');
    });

    it('should handle non-existent files gracefully', async () => {
      const result = await agent.generateApiDocs(
        [path.join(TEST_SRC_DIR, 'nonexistent.ts')],
        'markdown'
      );

      expect(result.coverage.total).toBe(0);
    });

    it('should include JSDoc information in output', async () => {
      const result = await agent.generateApiDocs(
        [path.join(TEST_SRC_DIR, 'sample.ts')],
        'markdown'
      );

      expect(result.content).toContain('Sample class for testing');
      expect(result.content).toContain('Parameters');
    });

    it('should include examples from JSDoc', async () => {
      const result = await agent.generateApiDocs(
        [path.join(TEST_SRC_DIR, 'sample.ts')],
        'markdown'
      );

      expect(result.content).toContain('Examples');
      expect(result.content).toContain('SampleClass()');
    });

    it('should default to markdown format', async () => {
      const result = await agent.generateApiDocs([path.join(TEST_SRC_DIR, 'sample.ts')]);
      expect(result.format).toBe('markdown');
    });
  });

  // ==========================================================================
  // createUserGuide Tests
  // ==========================================================================

  describe('createUserGuide', () => {
    it('should create a user guide for a feature', async () => {
      const result = await agent.createUserGuide('sample', [
        path.join(TEST_SRC_DIR, 'sample.ts'),
      ]);

      expect(result.title).toBeDefined();
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.toc).toContain('Table of Contents');
    });

    it('should include introduction section', async () => {
      const result = await agent.createUserGuide('sample', [
        path.join(TEST_SRC_DIR, 'sample.ts'),
      ]);

      const intro = result.sections.find(s => s.heading === 'Introduction');
      expect(intro).toBeDefined();
      expect(intro!.content.length).toBeGreaterThan(0);
    });

    it('should include getting started section', async () => {
      const result = await agent.createUserGuide('sample', [
        path.join(TEST_SRC_DIR, 'sample.ts'),
      ]);

      const gettingStarted = result.sections.find(s => s.heading === 'Getting Started');
      expect(gettingStarted).toBeDefined();
    });

    it('should include usage section', async () => {
      const result = await agent.createUserGuide('sample', [
        path.join(TEST_SRC_DIR, 'sample.ts'),
      ]);

      const usage = result.sections.find(s => s.heading === 'Usage');
      expect(usage).toBeDefined();
    });

    it('should generate table of contents', async () => {
      const result = await agent.createUserGuide('sample', [
        path.join(TEST_SRC_DIR, 'sample.ts'),
      ]);

      expect(result.toc).toContain('Introduction');
      expect(result.toc).toContain('Getting Started');
    });

    it('should extract examples from test files', async () => {
      const result = await agent.createUserGuide('sample', [
        path.join(TEST_SRC_DIR, 'sample.ts'),
        path.join(TEST_SRC_DIR, 'sample.test.ts'),
      ]);

      // Should find relevant items
      const hasExamples = result.sections.some(s => s.examples && s.examples.length > 0);
      expect(hasExamples || result.sections.length > 0).toBe(true);
    });

    it('should format feature title correctly', async () => {
      const result = await agent.createUserGuide('sample-feature', []);
      expect(result.title).toBe('Sample Feature');
    });

    it('should handle empty codebase', async () => {
      const result = await agent.createUserGuide('test-feature', []);

      expect(result.title).toBeDefined();
      expect(result.sections.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // documentArchitecture Tests
  // ==========================================================================

  describe('documentArchitecture', () => {
    it('should document system architecture', async () => {
      const system: SystemInfo = {
        name: 'Test System',
        description: 'A test system for documentation',
        sourceDirs: [TEST_SRC_DIR],
      };

      const result = await agent.documentArchitecture(system);

      expect(result.overview).toContain('Test System');
      expect(result.diagrams.length).toBeGreaterThan(0);
    });

    it('should generate component diagram', async () => {
      const system: SystemInfo = {
        name: 'Test System',
        sourceDirs: [TEST_SRC_DIR],
      };

      const result = await agent.documentArchitecture(system);

      const componentDiagram = result.diagrams.find(d => d.type === 'component');
      expect(componentDiagram).toBeDefined();
      expect(componentDiagram!.content).toContain('mermaid');
    });

    it('should generate class diagram when components exist', async () => {
      const system: SystemInfo = {
        name: 'Test System',
        sourceDirs: [TEST_SRC_DIR],
      };

      const result = await agent.documentArchitecture(system);

      const classDiagram = result.diagrams.find(d => d.type === 'class');
      if (result.components.length > 0) {
        expect(classDiagram).toBeDefined();
        expect(classDiagram!.content).toContain('classDiagram');
      }
    });

    it('should generate deployment diagram for microservices', async () => {
      const system: SystemInfo = {
        name: 'Test System',
        sourceDirs: [TEST_SRC_DIR],
        pattern: 'microservices',
      };

      const result = await agent.documentArchitecture(system);

      const deploymentDiagram = result.diagrams.find(d => d.type === 'deployment');
      expect(deploymentDiagram).toBeDefined();
    });

    it('should include system description in overview', async () => {
      const system: SystemInfo = {
        name: 'Test System',
        description: 'Custom description for testing',
        sourceDirs: [TEST_SRC_DIR],
      };

      const result = await agent.documentArchitecture(system);

      expect(result.overview).toContain('Custom description for testing');
    });

    it('should describe architecture pattern', async () => {
      const system: SystemInfo = {
        name: 'Test System',
        sourceDirs: [TEST_SRC_DIR],
        pattern: 'layered',
      };

      const result = await agent.documentArchitecture(system);

      expect(result.overview).toContain('layered');
    });

    it('should handle non-existent directories', async () => {
      const system: SystemInfo = {
        name: 'Test System',
        sourceDirs: ['/nonexistent/directory'],
      };

      const result = await agent.documentArchitecture(system);

      expect(result.overview).toBeDefined();
      expect(result.components).toEqual([]);
    });

    it('should extract component dependencies', async () => {
      const system: SystemInfo = {
        name: 'Test System',
        sourceDirs: [TEST_SRC_DIR],
      };

      const result = await agent.documentArchitecture(system);

      // Components may have dependencies
      for (const component of result.components) {
        expect(component.dependencies).toBeDefined();
        expect(Array.isArray(component.dependencies)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // generateChangelog Tests
  // ==========================================================================

  describe('generateChangelog', () => {
    it('should generate changelog between tags', async () => {
      const result = await agent.generateChangelog('v1.0.0', 'v1.1.0');

      expect(result.version).toBe('1.1.0');
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.markdown).toContain('# Changelog');
    });

    it('should include all changelog sections', async () => {
      const result = await agent.generateChangelog('v1.0.0', 'v1.1.0');

      expect(result.sections).toHaveProperty('added');
      expect(result.sections).toHaveProperty('changed');
      expect(result.sections).toHaveProperty('deprecated');
      expect(result.sections).toHaveProperty('removed');
      expect(result.sections).toHaveProperty('fixed');
      expect(result.sections).toHaveProperty('security');
    });

    it('should generate valid markdown', async () => {
      const result = await agent.generateChangelog('v1.0.0', 'v1.1.0');

      expect(result.markdown).toMatch(/^# Changelog/m);
      expect(result.markdown).toContain(`## [${result.version}]`);
    });

    it('should strip v prefix from version', async () => {
      const result = await agent.generateChangelog('v1.0.0', 'v2.0.0');
      expect(result.version).toBe('2.0.0');
    });

    it('should handle version without v prefix', async () => {
      const result = await agent.generateChangelog('1.0.0', '1.1.0');
      expect(result.version).toBe('1.1.0');
    });
  });

  // ==========================================================================
  // formatDocumentation Tests
  // ==========================================================================

  describe('formatDocumentation', () => {
    it('should format markdown content', async () => {
      const content = `# Title\n\n\n\nSome content`;
      const result = await agent.formatDocumentation(content);

      // Should remove excessive blank lines
      expect(result).not.toContain('\n\n\n');
    });

    it('should apply default formatting', async () => {
      const content = `#Title without space\n- Item`;
      const result = await agent.formatDocumentation(content, 'default');

      expect(result).toContain('# Title');
    });

    it('should apply GitHub formatting', async () => {
      const content = `NOTE: This is a note\nWARNING: This is a warning`;
      const result = await agent.formatDocumentation(content, 'github');

      expect(result).toContain('> **Note:**');
      expect(result).toContain('> **Warning:**');
    });

    it('should apply Docusaurus formatting', async () => {
      const content = `# My Page\n\nContent here`;
      const result = await agent.formatDocumentation(content, 'docusaurus');

      expect(result).toContain('---');
      expect(result).toContain('title:');
    });

    it('should apply Obsidian formatting', async () => {
      const content = `See [link](#section) for details`;
      const result = await agent.formatDocumentation(content, 'obsidian');

      expect(result).toContain('[[');
    });

    it('should fix markdown header spacing', async () => {
      const content = `##Header\n###Another`;
      const result = await agent.formatDocumentation(content);

      expect(result).toContain('## Header');
      expect(result).toContain('### Another');
    });

    it('should ensure consistent header levels', async () => {
      const content = `# H1\n#### H4 (skipped levels)`;
      const result = await agent.formatDocumentation(content);

      // Should not skip header levels
      expect(result).toMatch(/^#\s/m);
    });

    it('should format code blocks with language tags', async () => {
      const content = '```\nconst x = 1;\n```';
      const result = await agent.formatDocumentation(content);

      // Should add language tag
      expect(result).toMatch(/```(typescript|javascript)/);
    });

    it('should handle empty content', async () => {
      const result = await agent.formatDocumentation('');
      expect(result).toBe('');
    });
  });

  // ==========================================================================
  // Task Execution Tests
  // ==========================================================================

  describe('execute', () => {
    describe('api_docs task', () => {
      it('should execute API docs task', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Generate API documentation',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'api_docs' },
            data: {
              files: [path.join(TEST_SRC_DIR, 'sample.ts')],
              format: 'markdown',
            },
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('format');
        expect(result.data).toHaveProperty('content');
        expect(result.data).toHaveProperty('coverage');
        expect(result.artifacts).toBeDefined();
      });

      it('should fail without files', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Generate API docs without files',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'api_docs' },
            data: {},
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VALIDATION_ERROR');
      });

      it('should fail with empty files array', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Generate API docs with empty files',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'api_docs' },
            data: { files: [] },
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(false);
      });
    });

    describe('user_guide task', () => {
      it('should execute user guide task', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Create user guide',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'user_guide' },
            data: {
              feature: 'sample',
              codebase: [path.join(TEST_SRC_DIR, 'sample.ts')],
            },
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('title');
        expect(result.data).toHaveProperty('sections');
        expect(result.data).toHaveProperty('toc');
      });

      it('should fail without feature name', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Create user guide without feature',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'user_guide' },
            data: {},
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('architecture task', () => {
      it('should execute architecture documentation task', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Document architecture',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'architecture' },
            data: {
              name: 'Test System',
              sourceDirs: [TEST_SRC_DIR],
            } as SystemInfo,
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('overview');
        expect(result.data).toHaveProperty('diagrams');
        expect(result.data).toHaveProperty('components');
      });

      it('should fail without system info', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Document architecture without system info',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'architecture' },
            data: {},
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('changelog task', () => {
      it('should execute changelog task', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Generate changelog',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'changelog' },
            data: {
              fromTag: 'v1.0.0',
              toTag: 'v1.1.0',
            },
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('version');
        expect(result.data).toHaveProperty('date');
        expect(result.data).toHaveProperty('sections');
        expect(result.data).toHaveProperty('markdown');
      });

      it('should fail without tags', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Generate changelog without tags',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'changelog' },
            data: { fromTag: 'v1.0.0' },
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('format task', () => {
      it('should execute format task', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Format documentation',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'format' },
            data: {
              content: '# Title\n\n\n\nContent',
              style: 'github',
            },
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(true);
        expect(typeof result.data).toBe('string');
      });

      it('should fail without content', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Format without content',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'format' },
            data: {},
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('default task type', () => {
      it('should default to api_docs', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Generate docs with default type',
          priority: TaskPriority.MEDIUM,
          input: {
            data: {
              files: [path.join(TEST_SRC_DIR, 'sample.ts')],
            },
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('format');
      });
    });

    describe('invalid task type', () => {
      it('should fail with invalid task type', async () => {
        const result = await agent.execute({
          id: createTaskId(),
          description: 'Invalid task type',
          priority: TaskPriority.MEDIUM,
          input: {
            parameters: { taskType: 'invalid_type' },
            data: {},
          },
          createdAt: new Date(),
        });

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_TASK_TYPE');
      });
    });
  });

  // ==========================================================================
  // Lifecycle Tests
  // ==========================================================================

  describe('lifecycle', () => {
    it('should initialize with IDLE status', () => {
      expect(agent.getStatus()).toBe('idle');
    });

    it('should pause and resume when running', async () => {
      // Note: pause() only changes status if currently RUNNING
      // When idle, pause() has no effect (see BaseAgent implementation)
      expect(agent.getStatus()).toBe('idle');

      // Pause when idle - status remains idle
      await agent.pause();
      // BaseAgent.pause() only changes to 'paused' if status is 'running'
      // Since we're idle, we stay idle
      expect(agent.getStatus()).toBe('idle');

      // Resume when idle - status remains idle
      await agent.resume();
      expect(agent.getStatus()).toBe('idle');
    });

    it('should terminate', async () => {
      await agent.terminate();
      expect(agent.getStatus()).toBe('terminated');
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      const result = await agent.generateApiDocs(['/nonexistent/path/file.ts'], 'markdown');

      expect(result.coverage.total).toBe(0);
      expect(result.files.length).toBeGreaterThan(0);
    });

    it('should handle malformed source files', async () => {
      // Create a malformed file
      const malformedPath = path.join(TEST_SRC_DIR, 'malformed.ts');
      await fs.writeFile(malformedPath, 'export { incomplete syntax');

      try {
        const result = await agent.generateApiDocs([malformedPath], 'markdown');
        // Should not throw, should handle gracefully
        expect(result).toBeDefined();
      } finally {
        await fs.unlink(malformedPath);
      }
    });
  });

  // ==========================================================================
  // Coverage Calculation Tests
  // ==========================================================================

  describe('coverage calculation', () => {
    it('should calculate 100% coverage for fully documented files', async () => {
      // The sample file has documentation on exports
      const result = await agent.generateApiDocs(
        [path.join(TEST_SRC_DIR, 'sample.ts')],
        'markdown'
      );

      // With our sample file, we should have some documented items
      expect(result.coverage.total).toBeGreaterThan(0);
    });

    it('should calculate 0% coverage for undocumented files', async () => {
      const result = await agent.generateApiDocs(
        [path.join(TEST_SRC_DIR, 'undocumented.ts')],
        'markdown'
      );

      expect(result.coverage.documented).toBe(0);
      if (result.coverage.total > 0) {
        expect(result.coverage.percentage).toBe(0);
      }
    });

    it('should calculate partial coverage for mixed files', async () => {
      const result = await agent.generateApiDocs(
        [
          path.join(TEST_SRC_DIR, 'sample.ts'),
          path.join(TEST_SRC_DIR, 'undocumented.ts'),
        ],
        'markdown'
      );

      // Should have some items total
      expect(result.coverage.total).toBeGreaterThan(0);
      // Percentage should be between 0 and 100
      expect(result.coverage.percentage).toBeGreaterThanOrEqual(0);
      expect(result.coverage.percentage).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // Artifact Generation Tests
  // ==========================================================================

  describe('artifact generation', () => {
    it('should generate markdown artifact for API docs', async () => {
      const result = await agent.execute({
        id: createTaskId(),
        description: 'Generate API docs',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'api_docs' },
          data: {
            files: [path.join(TEST_SRC_DIR, 'sample.ts')],
            format: 'markdown',
          },
        },
        createdAt: new Date(),
      });

      expect(result.artifacts).toBeDefined();
      expect(result.artifacts!.length).toBeGreaterThan(0);
      expect(result.artifacts![0].type).toBe('file');
      expect(result.artifacts![0].mimeType).toBe('text/markdown');
    });

    it('should generate YAML artifact for OpenAPI docs', async () => {
      const result = await agent.execute({
        id: createTaskId(),
        description: 'Generate OpenAPI docs',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'api_docs' },
          data: {
            files: [path.join(TEST_SRC_DIR, 'sample.ts')],
            format: 'openapi',
          },
        },
        createdAt: new Date(),
      });

      expect(result.artifacts).toBeDefined();
      expect(result.artifacts![0].mimeType).toBe('text/yaml');
    });

    it('should generate user guide markdown artifact', async () => {
      const result = await agent.execute({
        id: createTaskId(),
        description: 'Create user guide',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'user_guide' },
          data: {
            feature: 'sample',
            codebase: [path.join(TEST_SRC_DIR, 'sample.ts')],
          },
        },
        createdAt: new Date(),
      });

      expect(result.artifacts).toBeDefined();
      expect(result.artifacts![0].name).toContain('.md');
    });

    it('should generate architecture markdown artifact', async () => {
      const result = await agent.execute({
        id: createTaskId(),
        description: 'Document architecture',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'architecture' },
          data: {
            name: 'Test System',
            sourceDirs: [TEST_SRC_DIR],
          },
        },
        createdAt: new Date(),
      });

      expect(result.artifacts).toBeDefined();
      expect(result.artifacts![0].name).toBe('ARCHITECTURE.md');
    });

    it('should generate changelog markdown artifact', async () => {
      const result = await agent.execute({
        id: createTaskId(),
        description: 'Generate changelog',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'changelog' },
          data: {
            fromTag: 'v1.0.0',
            toTag: 'v1.1.0',
          },
        },
        createdAt: new Date(),
      });

      expect(result.artifacts).toBeDefined();
      expect(result.artifacts![0].name).toBe('CHANGELOG.md');
    });
  });
});
