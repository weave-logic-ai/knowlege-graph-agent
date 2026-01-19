# Testing Guidelines for Weave-NN Deep Analyzer

## Table of Contents
1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Test Organization](#test-organization)
3. [Unit Testing Guidelines](#unit-testing-guidelines)
4. [Integration Testing Guidelines](#integration-testing-guidelines)
5. [Mocking Strategies](#mocking-strategies)
6. [Coverage Requirements](#coverage-requirements)
7. [Testing Best Practices](#testing-best-practices)
8. [Example Test Cases](#example-test-cases)

---

## Testing Strategy Overview

### Test Pyramid Structure

```
         /\
        /E2E\      <- End-to-End (5-10%)
       /------\
      /Integr. \   <- Integration (20-30%)
     /----------\
    /   Unit     \ <- Unit Tests (60-75%)
   /--------------\
```

### Testing Framework
- **Framework**: Vitest (configured in project)
- **Mocking**: Vitest's built-in `vi.fn()` and `vi.mock()`
- **Test Runner**: Single-threaded (configured for stability)
- **Coverage Tool**: V8 coverage provider

### Coverage Targets
- **Lines**: 90%
- **Functions**: 90%
- **Branches**: 85%
- **Statements**: 90%

---

## Test Organization

### Directory Structure

```
weaver/
├── tests/
│   ├── cultivation/              # Tests for cultivation modules
│   │   ├── deep-analyzer.test.ts
│   │   ├── seed-generator.test.ts
│   │   └── seed-enhancer.test.ts
│   ├── integration/              # Integration tests
│   │   └── cultivation-integration.test.ts
│   ├── fixtures/                 # Test data and fixtures
│   │   ├── sample-package.json
│   │   ├── sample-composer.json
│   │   └── sample-vault/
│   └── mocks/                    # Shared mock utilities
│       └── mock-helpers.ts
```

### File Naming Conventions
- **Unit Tests**: `<module-name>.test.ts`
- **Integration Tests**: `<feature>-integration.test.ts`
- **Fixtures**: Descriptive names (e.g., `sample-package.json`)
- **Mocks**: `mock-<utility>.ts`

---

## Unit Testing Guidelines

### 1. Test Structure (AAA Pattern)

Every test should follow the **Arrange-Act-Assert** pattern:

```typescript
describe('DeepAnalyzer', () => {
  describe('checkClaudeFlow', () => {
    it('should return true when claude-flow is available', async () => {
      // ARRANGE: Set up test data and mocks
      const analyzer = new DeepAnalyzer('/project', '/vault');
      vi.mocked(execAsync).mockResolvedValue({ stdout: 'v2.0.0', stderr: '' });

      // ACT: Execute the function under test
      const result = await analyzer.checkClaudeFlow();

      // ASSERT: Verify the outcome
      expect(result).toBe(true);
      expect(execAsync).toHaveBeenCalledWith('npx claude-flow --version', { timeout: 5000 });
    });
  });
});
```

### 2. Test Isolation

Each test must be completely independent:

```typescript
describe('SeedGenerator', () => {
  let generator: SeedGenerator;
  let mockContext: VaultContext;

  beforeEach(() => {
    // Reset state before each test
    mockContext = {
      vaultRoot: '/test/vault',
      allFiles: [],
      graphFiles: []
    };
    generator = new SeedGenerator(mockContext, '/test/project');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
```

### 3. Testing Async Operations

```typescript
describe('DeepAnalyzer', () => {
  it('should handle timeout in deep analysis', async () => {
    const analyzer = new DeepAnalyzer('/project', '/vault');

    // Mock a slow operation
    vi.mocked(execAsync).mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 10000))
    );

    await expect(analyzer.analyze()).rejects.toThrow('Deep analysis timeout');
  });

  it('should handle AbortController properly', async () => {
    const analyzer = new DeepAnalyzer('/project', '/vault');

    vi.mocked(execAsync).mockRejectedValue({ name: 'AbortError' });

    await expect(analyzer.analyze()).rejects.toThrow('timeout');
  });
});
```

### 4. Testing Private Methods (Indirectly)

Test private methods through their public API:

```typescript
describe('SeedGenerator', () => {
  it('should infer correct category for React packages', async () => {
    // Test private inferCategory method through analyze()
    const analysis = await generator.analyze();

    const reactDep = analysis.dependencies.find(d => d.name === 'react');
    expect(reactDep?.category).toBe('components/ui');
  });
});
```

### 5. Edge Cases and Error Handling

```typescript
describe('DeepAnalyzer', () => {
  it('should handle missing PRIMITIVES.md gracefully', async () => {
    vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

    const result = await analyzer.analyze();

    expect(result.primitives).toBeDefined();
    // Should use default taxonomy
  });

  it('should handle malformed JSON from agent', async () => {
    vi.mocked(execAsync).mockResolvedValue({
      stdout: 'invalid json{{{',
      stderr: ''
    });

    await expect(analyzer.analyze()).rejects.toThrow('parse');
  });

  it('should handle empty package.json', async () => {
    vi.mocked(fs.readFile).mockResolvedValue('{}');

    const analysis = await generator.analyze();

    expect(analysis.dependencies).toEqual([]);
  });
});
```

---

## Integration Testing Guidelines

### 1. Multi-Module Integration

Test interactions between `DeepAnalyzer`, `SeedGenerator`, and `SeedEnhancer`:

```typescript
describe('Cultivation Integration', () => {
  let tempDir: string;
  let vaultContext: VaultContext;

  beforeAll(async () => {
    // Create real temp directory with fixtures
    tempDir = await createTempTestDir();
    await copyFixtures(tempDir);
  });

  afterAll(async () => {
    await cleanupTempDir(tempDir);
  });

  it('should perform full cultivation workflow', async () => {
    // Initialize all modules
    const enhancer = new SeedEnhancer(vaultContext, tempDir, {
      deepAnalysis: true,
      analysisTimeout: 60000
    });

    // Execute full workflow
    const documents = await enhancer.generate();

    // Verify integration
    expect(documents.length).toBeGreaterThan(0);
    expect(documents.some(d => d.type === 'primitive')).toBe(true);
  });
});
```

### 2. File System Integration

Test actual file operations:

```typescript
describe('SeedGenerator File Integration', () => {
  it('should parse real package.json files', async () => {
    const generator = new SeedGenerator(vaultContext, './tests/fixtures/nextjs-app');

    const analysis = await generator.analyze();

    expect(analysis.languages).toContain('javascript');
    expect(analysis.frameworks.length).toBeGreaterThan(0);
  });

  it('should handle multiple package manager files', async () => {
    // Test with directory containing package.json, composer.json, and Cargo.toml
    const generator = new SeedGenerator(vaultContext, './tests/fixtures/polyglot-project');

    const analysis = await generator.analyze();

    expect(analysis.languages).toContain('javascript');
    expect(analysis.languages).toContain('php');
    expect(analysis.languages).toContain('rust');
  });
});
```

### 3. External Process Integration

Test child process execution (claude-flow agents):

```typescript
describe('DeepAnalyzer External Process Integration', () => {
  it('should execute real claude-flow agent (when available)', async () => {
    const analyzer = new DeepAnalyzer(
      './tests/fixtures/sample-project',
      './tests/fixtures/sample-vault'
    );

    // Only run if claude-flow is installed
    const hasClaudeFlow = await analyzer.checkClaudeFlow();
    if (!hasClaudeFlow) {
      console.log('Skipping: claude-flow not available');
      return;
    }

    const result = await analyzer.analyze();

    expect(result.totalCount).toBeGreaterThan(0);
    expect(result.primitives).toBeDefined();
  }, 120000); // 2 minute timeout for real agent execution
});
```

---

## Mocking Strategies

### 1. File System Mocking

```typescript
import { vi } from 'vitest';
import fs from 'fs/promises';

vi.mock('fs/promises');

describe('SeedGenerator', () => {
  it('should mock file system operations', async () => {
    // Mock readFile
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
      name: 'test-package',
      dependencies: {
        'react': '^18.0.0'
      }
    }));

    // Mock stat
    vi.mocked(fs.stat).mockResolvedValue({
      isDirectory: () => false,
      isFile: () => true
    } as any);

    const analysis = await generator.analyze();

    expect(analysis.dependencies.length).toBeGreaterThan(0);
  });
});
```

### 2. Child Process Mocking

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

vi.mock('child_process', () => ({
  exec: vi.fn()
}));

const execAsync = promisify(exec);

describe('DeepAnalyzer', () => {
  it('should mock claude-flow execution', async () => {
    vi.mocked(execAsync).mockResolvedValue({
      stdout: JSON.stringify({
        primitives: [
          {
            category: 'integrations/ai-services',
            name: 'OpenAI Integration',
            description: 'AI service integration',
            files: ['lib/ai.ts'],
            type: 'integration',
            priority: 'high'
          }
        ]
      }),
      stderr: ''
    });

    const result = await analyzer.analyze();

    expect(result.primitives).toHaveLength(1);
    expect(result.primitives[0].name).toBe('OpenAI Integration');
  });
});
```

### 3. External API Mocking

```typescript
describe('ResearcherAgent', () => {
  it('should mock arXiv API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      text: async () => `
        <feed>
          <entry>
            <id>http://arxiv.org/abs/2510.20809v1</id>
            <title>Test Paper</title>
            <summary>Abstract</summary>
          </entry>
        </feed>
      `
    });

    const papers = await researcher.searchArxiv('neural networks');

    expect(papers).toHaveLength(1);
    expect(papers[0].title).toContain('Test Paper');
  });
});
```

### 4. Timer Mocking

```typescript
describe('DeepAnalyzer Timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should timeout after 2 minutes', async () => {
    const analyzer = new DeepAnalyzer('/project', '/vault');

    vi.mocked(execAsync).mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 150000))
    );

    const promise = analyzer.analyze();

    // Fast-forward time
    await vi.advanceTimersByTimeAsync(120000);

    await expect(promise).rejects.toThrow('timeout');
  });
});
```

### 5. Module-Level Mocking

```typescript
// Mock entire module
vi.mock('../../src/cultivation/deep-analyzer', () => ({
  DeepAnalyzer: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue({
      primitives: [],
      totalCount: 0,
      byCategory: {},
      byPriority: {}
    })
  }))
}));

describe('SeedEnhancer', () => {
  it('should use mocked DeepAnalyzer', async () => {
    const enhancer = new SeedEnhancer(vaultContext, '/project', {
      deepAnalysis: true
    });

    const result = await enhancer.generate();

    expect(DeepAnalyzer).toHaveBeenCalled();
  });
});
```

---

## Coverage Requirements

### Target Metrics
- **Overall Coverage**: 85%+
- **Critical Modules**: 90%+
  - `deep-analyzer.ts`
  - `seed-generator.ts`
  - `seed-enhancer.ts`

### Measuring Coverage

```bash
# Run tests with coverage
npm run test -- --coverage

# View HTML coverage report
open coverage/index.html
```

### Coverage Exclusions
Exclude from coverage:
- Type definitions (`types.ts`)
- Index/barrel files (`index.ts`)
- Test files themselves
- Generated code

### Example Coverage Configuration (vitest.config.ts)
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'node_modules/',
    'dist/',
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/types.ts',
    '**/index.ts',
  ],
  lines: 90,
  functions: 90,
  branches: 85,
  statements: 90,
}
```

---

## Testing Best Practices

### 1. **Test Naming Conventions**

Use descriptive test names that explain behavior:

```typescript
// ✅ GOOD
it('should return true when claude-flow is installed and accessible')
it('should throw timeout error when agent execution exceeds 120 seconds')
it('should infer "integrations/databases" category for prisma package')

// ❌ BAD
it('should work')
it('test checkClaudeFlow')
it('handles errors')
```

### 2. **One Assertion Per Test** (When Possible)

```typescript
// ✅ GOOD - Focused test
describe('inferCategory', () => {
  it('should categorize React as components/ui', async () => {
    const dep = { name: 'react', version: '18.0.0' };
    const category = generator.inferCategory(dep.name);
    expect(category).toBe('components/ui');
  });

  it('should categorize Prisma as integrations/databases', async () => {
    const category = generator.inferCategory('prisma');
    expect(category).toBe('integrations/databases');
  });
});

// ⚠️ ACCEPTABLE - Related assertions
it('should parse package.json and extract dependencies', async () => {
  const analysis = await generator.analyze();

  expect(analysis.dependencies).toBeDefined();
  expect(analysis.dependencies.length).toBeGreaterThan(0);
  expect(analysis.languages).toContain('javascript');
});
```

### 3. **Avoid Test Interdependence**

```typescript
// ❌ BAD - Tests depend on execution order
let sharedState: DeepAnalysisResult;

it('should analyze codebase', async () => {
  sharedState = await analyzer.analyze();
  expect(sharedState).toBeDefined();
});

it('should have primitives from previous test', () => {
  expect(sharedState.primitives.length).toBeGreaterThan(0); // Fails if run in isolation
});

// ✅ GOOD - Each test is independent
it('should analyze codebase', async () => {
  const result = await analyzer.analyze();
  expect(result).toBeDefined();
});

it('should return primitives in analysis', async () => {
  const result = await analyzer.analyze();
  expect(result.primitives.length).toBeGreaterThan(0);
});
```

### 4. **Use Test Data Builders**

```typescript
// Test data factory
class TestDataBuilder {
  static createVaultContext(overrides?: Partial<VaultContext>): VaultContext {
    return {
      vaultRoot: '/test/vault',
      allFiles: [],
      graphFiles: [],
      ...overrides
    };
  }

  static createDependencyInfo(overrides?: Partial<DependencyInfo>): DependencyInfo {
    return {
      name: 'test-package',
      version: '1.0.0',
      type: 'library',
      category: 'components/utilities',
      ecosystem: 'nodejs',
      usedBy: [],
      relatedTo: [],
      ...overrides
    };
  }
}

// Usage in tests
it('should generate primitive from dependency', async () => {
  const dep = TestDataBuilder.createDependencyInfo({
    name: 'react',
    type: 'framework'
  });

  const doc = generator.generateDependencyNode(dep, analysis);
  expect(doc.type).toBe('primitive');
});
```

### 5. **Test Error Messages**

```typescript
it('should throw descriptive error for missing file', async () => {
  vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: File not found'));

  await expect(generator.analyze()).rejects.toThrow(/File not found/);
});

it('should throw ClaudeFlowError with context', async () => {
  vi.mocked(execAsync).mockRejectedValue(new Error('Command failed'));

  try {
    await analyzer.analyze();
  } catch (error) {
    expect(error).toBeInstanceOf(ClaudeFlowError);
    expect(error.message).toContain('Agent execution failed');
  }
});
```

### 6. **Performance Testing**

```typescript
describe('Performance', () => {
  it('should analyze 1000 dependencies under 100ms', async () => {
    const largeDependencies = Array(1000).fill(null).map((_, i) => ({
      name: `package-${i}`,
      version: '1.0.0'
    }));

    const start = performance.now();
    await generator.classifyDependencies({ dependencies: largeDependencies });
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
```

### 7. **Snapshot Testing** (Use Sparingly)

```typescript
it('should generate consistent primitive document structure', async () => {
  const dep = TestDataBuilder.createDependencyInfo({ name: 'react' });
  const doc = generator.generateDependencyNode(dep, analysis);

  expect(doc).toMatchSnapshot();
});
```

---

## Example Test Cases

### Complete Test Suite for `deep-analyzer.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeepAnalyzer, type PrimitiveDiscovery, type DeepAnalysisResult } from '../../src/cultivation/deep-analyzer';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

vi.mock('child_process');
vi.mock('fs/promises');

const execAsync = promisify(exec);

describe('DeepAnalyzer', () => {
  let analyzer: DeepAnalyzer;

  beforeEach(() => {
    analyzer = new DeepAnalyzer('/test/project', '/test/vault');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkClaudeFlow', () => {
    it('should return true when claude-flow is available', async () => {
      vi.mocked(execAsync).mockResolvedValue({ stdout: 'v2.0.0', stderr: '' });

      const result = await analyzer['checkClaudeFlow']();

      expect(result).toBe(true);
      expect(execAsync).toHaveBeenCalledWith('npx claude-flow --version', { timeout: 5000 });
    });

    it('should return false when claude-flow is not available', async () => {
      vi.mocked(execAsync).mockRejectedValue(new Error('Command not found'));

      const result = await analyzer['checkClaudeFlow']();

      expect(result).toBe(false);
    });

    it('should return false on timeout', async () => {
      vi.mocked(execAsync).mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const result = await analyzer['checkClaudeFlow']();

      expect(result).toBe(false);
    });
  });

  describe('analyze', () => {
    it('should perform deep analysis when claude-flow is available', async () => {
      // Mock checkClaudeFlow
      vi.mocked(execAsync)
        .mockResolvedValueOnce({ stdout: 'v2.0.0', stderr: '' })
        .mockResolvedValueOnce({
          stdout: JSON.stringify({
            primitives: [
              {
                category: 'integrations/ai-services',
                name: 'OpenAI Integration',
                description: 'AI service integration',
                files: ['lib/ai.ts'],
                type: 'integration',
                priority: 'high'
              }
            ]
          }),
          stderr: ''
        });

      vi.mocked(fs.readFile).mockResolvedValue('# PRIMITIVES.md taxonomy');

      const result = await analyzer.analyze();

      expect(result.totalCount).toBe(1);
      expect(result.primitives).toHaveLength(1);
      expect(result.primitives[0].name).toBe('OpenAI Integration');
    });

    it('should fallback to shallow analysis when claude-flow is unavailable', async () => {
      vi.mocked(execAsync).mockRejectedValue(new Error('Command not found'));

      const result = await analyzer.analyze();

      expect(result.totalCount).toBeGreaterThanOrEqual(0);
      expect(result.primitives).toBeDefined();
    });

    it('should handle timeout in claude-flow execution', async () => {
      vi.mocked(execAsync)
        .mockResolvedValueOnce({ stdout: 'v2.0.0', stderr: '' })
        .mockRejectedValueOnce({ name: 'AbortError', killed: true });

      await expect(analyzer.analyze()).rejects.toThrow('timeout');
    });

    it('should handle malformed JSON from agent', async () => {
      vi.mocked(execAsync)
        .mockResolvedValueOnce({ stdout: 'v2.0.0', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'invalid json{{{', stderr: '' });

      await expect(analyzer.analyze()).rejects.toThrow();
    });
  });

  describe('buildAnalysisPrompt', () => {
    it('should include taxonomy in prompt', () => {
      const taxonomy = '# Test Taxonomy\n- Category 1\n- Category 2';

      const prompt = analyzer['buildAnalysisPrompt'](taxonomy);

      expect(prompt).toContain('TAXONOMY:');
      expect(prompt).toContain(taxonomy);
      expect(prompt).toContain('ANALYZE:');
      expect(prompt).toContain('OUTPUT JSON:');
    });

    it('should include project root in prompt', () => {
      const prompt = analyzer['buildAnalysisPrompt']('');

      expect(prompt).toContain('/test/project');
    });
  });

  describe('parseAgentResponse', () => {
    it('should parse valid agent response', () => {
      const response = {
        primitives: [
          {
            category: 'integrations/databases',
            name: 'Prisma',
            description: 'Database ORM',
            files: ['lib/db.ts'],
            type: 'integration',
            priority: 'high'
          },
          {
            category: 'components/ui',
            name: 'React',
            description: 'UI framework',
            files: ['app/'],
            type: 'framework',
            priority: 'critical'
          }
        ]
      };

      const result = analyzer['parseAgentResponse'](response);

      expect(result.totalCount).toBe(2);
      expect(result.byCategory['integrations/databases']).toBe(1);
      expect(result.byCategory['components/ui']).toBe(1);
      expect(result.byPriority['high']).toBe(1);
      expect(result.byPriority['critical']).toBe(1);
    });

    it('should handle empty primitives array', () => {
      const response = { primitives: [] };

      const result = analyzer['parseAgentResponse'](response);

      expect(result.totalCount).toBe(0);
      expect(result.primitives).toEqual([]);
      expect(result.byCategory).toEqual({});
      expect(result.byPriority).toEqual({});
    });
  });

  describe('shallowAnalysis', () => {
    it('should extract dependencies from package.json', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        dependencies: {
          'react': '^18.0.0',
          'next': '^14.0.0',
          'prisma': '^5.0.0'
        }
      }));

      const result = await analyzer['shallowAnalysis']();

      expect(result.primitives.length).toBe(3);
      expect(result.primitives.some(p => p.name.includes('React'))).toBe(true);
    });

    it('should handle missing package.json gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

      const result = await analyzer['shallowAnalysis']();

      expect(result.primitives).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it('should infer correct categories for dependencies', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        dependencies: {
          'react': '^18.0.0',
          'prisma': '^5.0.0',
          'openai': '^4.0.0'
        }
      }));

      const result = await analyzer['shallowAnalysis']();

      const react = result.primitives.find(p => p.dependencies?.includes('react'));
      const prisma = result.primitives.find(p => p.dependencies?.includes('prisma'));
      const openai = result.primitives.find(p => p.dependencies?.includes('openai'));

      expect(react?.category).toBe('components/ui');
      expect(prisma?.category).toBe('integrations/databases');
      expect(openai?.category).toBe('integrations/ai-services');
    });
  });

  describe('inferCategory', () => {
    it('should categorize UI libraries correctly', () => {
      expect(analyzer['inferCategory']('react')).toBe('components/ui');
      expect(analyzer['inferCategory']('@radix-ui/react-dialog')).toBe('components/ui');
      expect(analyzer['inferCategory']('shadcn-ui')).toBe('components/ui');
    });

    it('should categorize database libraries correctly', () => {
      expect(analyzer['inferCategory']('prisma')).toBe('integrations/databases');
      expect(analyzer['inferCategory']('typeorm')).toBe('integrations/databases');
      expect(analyzer['inferCategory']('pg')).toBe('integrations/databases');
    });

    it('should categorize auth libraries correctly', () => {
      expect(analyzer['inferCategory']('next-auth')).toBe('integrations/auth-providers');
      expect(analyzer['inferCategory']('passport')).toBe('integrations/auth-providers');
      expect(analyzer['inferCategory']('jsonwebtoken')).toBe('integrations/auth-providers');
    });

    it('should categorize AI services correctly', () => {
      expect(analyzer['inferCategory']('openai')).toBe('integrations/ai-services');
      expect(analyzer['inferCategory']('@anthropic-ai/sdk')).toBe('integrations/ai-services');
    });

    it('should default to components/utilities for unknown packages', () => {
      expect(analyzer['inferCategory']('unknown-package')).toBe('components/utilities');
    });
  });

  describe('inferType', () => {
    it('should identify protocols', () => {
      expect(analyzer['inferType']('workflow-engine')).toBe('protocol');
    });

    it('should identify integrations', () => {
      expect(analyzer['inferType']('postgres-client')).toBe('integration');
      expect(analyzer['inferType']('auth-provider')).toBe('integration');
    });

    it('should identify schemas', () => {
      expect(analyzer['inferType']('zod')).toBe('schema');
      expect(analyzer['inferType']('joi-schema')).toBe('schema');
    });

    it('should default to component', () => {
      expect(analyzer['inferType']('lodash')).toBe('component');
    });
  });

  describe('inferPriority', () => {
    it('should assign critical priority to core frameworks', () => {
      expect(analyzer['inferPriority']('next')).toBe('critical');
      expect(analyzer['inferPriority']('react')).toBe('critical');
    });

    it('should assign high priority to infrastructure', () => {
      expect(analyzer['inferPriority']('prisma')).toBe('high');
      expect(analyzer['inferPriority']('auth0')).toBe('high');
      expect(analyzer['inferPriority']('openai')).toBe('high');
    });

    it('should assign medium priority to utilities', () => {
      expect(analyzer['inferPriority']('lodash')).toBe('medium');
      expect(analyzer['inferPriority']('date-fns')).toBe('medium');
    });
  });
});
```

### Complete Test Suite for `seed-generator.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeedGenerator } from '../../src/cultivation/seed-generator';
import type { VaultContext } from '../../src/cultivation/types';
import fs from 'fs/promises';

vi.mock('fs/promises');

describe('SeedGenerator', () => {
  let generator: SeedGenerator;
  let mockContext: VaultContext;

  beforeEach(() => {
    mockContext = {
      vaultRoot: '/test/vault',
      allFiles: [],
      graphFiles: []
    };
    generator = new SeedGenerator(mockContext, '/test/project');
    vi.clearAllMocks();
  });

  describe('analyze', () => {
    it('should analyze Node.js project with package.json', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        dependencies: {
          'react': '^18.0.0',
          'next': '^14.0.0'
        }
      }));

      const analysis = await generator.analyze();

      expect(analysis.languages).toContain('javascript');
      expect(analysis.languages).toContain('typescript');
      expect(analysis.dependencies.length).toBe(2);
    });

    it('should analyze Python project with requirements.txt', async () => {
      vi.mocked(fs.readFile)
        .mockRejectedValueOnce(new Error('No package.json'))
        .mockResolvedValueOnce('django==4.2.0\nflask>=2.0.0\nrequests~=2.28.0');

      const analysis = await generator.analyze();

      expect(analysis.languages).toContain('python');
      expect(analysis.dependencies.some(d => d.name === 'django')).toBe(true);
    });

    it('should analyze PHP project with composer.json', async () => {
      vi.mocked(fs.readFile)
        .mockRejectedValueOnce(new Error('No package.json'))
        .mockRejectedValueOnce(new Error('No requirements.txt'))
        .mockResolvedValueOnce(JSON.stringify({
          require: {
            'laravel/framework': '^10.0'
          }
        }));

      const analysis = await generator.analyze();

      expect(analysis.languages).toContain('php');
      expect(analysis.dependencies.some(d => d.name === 'laravel/framework')).toBe(true);
    });
  });

  describe('generatePrimitives', () => {
    it('should generate framework nodes', async () => {
      const analysis = {
        dependencies: [],
        frameworks: [
          {
            name: 'next',
            version: '14.0.0',
            type: 'framework' as const,
            category: 'services/api',
            ecosystem: 'nodejs' as const,
            usedBy: [],
            relatedTo: []
          }
        ],
        services: [],
        languages: ['javascript'],
        deployments: [],
        existingConcepts: [],
        existingFeatures: []
      };

      const documents = await generator.generatePrimitives(analysis);

      expect(documents.length).toBeGreaterThan(0);
      expect(documents[0].type).toBe('primitive');
      expect(documents[0].title).toContain('Next');
    });

    it('should deduplicate framework and dependency nodes', async () => {
      const analysis = {
        dependencies: [
          {
            name: 'react',
            version: '18.0.0',
            type: 'framework' as const,
            category: 'components/ui',
            ecosystem: 'nodejs' as const,
            usedBy: [],
            relatedTo: []
          }
        ],
        frameworks: [
          {
            name: 'react',
            version: '18.0.0',
            type: 'framework' as const,
            category: 'components/ui',
            ecosystem: 'nodejs' as const,
            usedBy: [],
            relatedTo: []
          }
        ],
        services: [],
        languages: [],
        deployments: [],
        existingConcepts: [],
        existingFeatures: []
      };

      const documents = await generator.generatePrimitives(analysis);

      // Should only generate one document for 'react'
      const reactDocs = documents.filter(d => d.title.toLowerCase().includes('react'));
      expect(reactDocs.length).toBe(1);
    });
  });

  describe('shouldGenerateNode', () => {
    it('should generate nodes for frameworks', () => {
      const dep = {
        name: 'next',
        version: '14.0.0',
        type: 'framework' as const,
        category: 'services/api',
        ecosystem: 'nodejs' as const,
        usedBy: [],
        relatedTo: []
      };

      expect(generator['shouldGenerateNode'](dep)).toBe(true);
    });

    it('should generate nodes for major packages', () => {
      const packages = ['react', 'typescript', 'webpack', 'jest', 'express', 'prisma'];

      packages.forEach(name => {
        const dep = {
          name,
          version: '1.0.0',
          type: 'library' as const,
          category: 'components/utilities',
          ecosystem: 'nodejs' as const,
          usedBy: [],
          relatedTo: []
        };
        expect(generator['shouldGenerateNode'](dep)).toBe(true);
      });
    });

    it('should not generate nodes for minor utility packages', () => {
      const dep = {
        name: 'lodash.get',
        version: '1.0.0',
        type: 'library' as const,
        category: 'components/utilities',
        ecosystem: 'nodejs' as const,
        usedBy: [],
        relatedTo: []
      };

      expect(generator['shouldGenerateNode'](dep)).toBe(false);
    });
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SeedEnhancer } from '../../src/cultivation/seed-enhancer';
import type { VaultContext } from '../../src/cultivation/types';
import fs from 'fs/promises';
import path from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

describe('Cultivation Integration Tests', () => {
  let tempDir: string;
  let vaultContext: VaultContext;

  beforeAll(async () => {
    // Create temporary test environment
    tempDir = await mkdtemp(path.join(tmpdir(), 'cultivation-test-'));

    // Create test vault structure
    const vaultDir = path.join(tempDir, 'vault');
    await fs.mkdir(vaultDir, { recursive: true });

    // Create test project with package.json
    const projectDir = path.join(tempDir, 'project');
    await fs.mkdir(projectDir, { recursive: true });
    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          'react': '^18.0.0',
          'next': '^14.0.0',
          'prisma': '^5.0.0'
        }
      })
    );

    vaultContext = {
      vaultRoot: vaultDir,
      allFiles: [],
      graphFiles: []
    };
  });

  afterAll(async () => {
    // Cleanup temporary directory
    await rm(tempDir, { recursive: true, force: true });
  });

  it('should perform full seed generation workflow', async () => {
    const enhancer = new SeedEnhancer(
      vaultContext,
      path.join(tempDir, 'project'),
      { deepAnalysis: false }
    );

    const documents = await enhancer.generate();

    expect(documents.length).toBeGreaterThan(0);
    expect(documents.some(d => d.type === 'primitive')).toBe(true);
    expect(documents.some(d => d.title.includes('React'))).toBe(true);
  });
});
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test tests/cultivation/deep-analyzer.test.ts

# Run tests matching pattern
npm run test -- --grep "DeepAnalyzer"

# Run in UI mode (visual test runner)
npm run test -- --ui
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Conclusion

These guidelines provide a comprehensive framework for testing the deep-analyzer module and related cultivation components. By following these patterns:

1. **Achieve high test coverage** (85%+ overall, 90%+ for critical modules)
2. **Maintain test quality** through isolation, clarity, and best practices
3. **Enable confident refactoring** with comprehensive test suites
4. **Prevent regressions** through automated testing
5. **Document behavior** via descriptive test cases

Remember: **Tests are production code**. Invest time in writing clear, maintainable tests that serve as living documentation for the codebase.
