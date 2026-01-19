# Standards Integration Guide for Deep-Analyzer Module

**Purpose**: This guide shows how to integrate the established standards into the `deep-analyzer.ts` module and related cultivation components.

**Target Audience**: Developers working on the weave-nn cultivation system
**Prerequisites**: Read [COMPREHENSIVE-STANDARDS-SUMMARY.md](./COMPREHENSIVE-STANDARDS-SUMMARY.md)

---

## 🎯 Quick Start

This guide provides:
1. **Concrete examples** of applying standards to `deep-analyzer.ts`
2. **Before/After comparisons** showing improvements
3. **Implementation steps** for each standard
4. **Validation checklists** to ensure compliance

---

## 📋 Table of Contents

1. [File Structure Validation](#1-file-structure-validation)
2. [Interface Standards Integration](#2-interface-standards-integration)
3. [Method Implementation Standards](#3-method-implementation-standards)
4. [Error Handling Enhancement](#4-error-handling-enhancement)
5. [Documentation Enhancement](#5-documentation-enhancement)
6. [Testing Integration](#6-testing-integration)
7. [TypeScript Configuration](#7-typescript-configuration)
8. [Validation Checklist](#8-validation-checklist)

---

## 1. File Structure Validation

### ✅ Current Status

The `deep-analyzer.ts` file already follows the correct structure:

```typescript
/**
 * Deep Codebase Analyzer
 *
 * Uses claude-flow agents to perform intelligent analysis of codebase
 * and map discoveries to PRIMITIVES.md taxonomy
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Interfaces defined first
export interface PrimitiveDiscovery { /* ... */ }
export interface DeepAnalysisResult { /* ... */ }

// Class implementation
export class DeepAnalyzer { /* ... */ }
```

**Validation**: ✅ Passes all file structure standards

---

## 2. Interface Standards Integration

### 📊 Data Format Validation

#### ✅ **PrimitiveDiscovery** Interface

Current implementation already follows standards:

```typescript
export interface PrimitiveDiscovery {
  category: string;      // ✅ Forward-slash paths (e.g., "schemas/database")
  name: string;          // ✅ Human-readable name
  description: string;   // ✅ Clear description
  files: string[];       // ✅ Array of file paths
  dependencies?: string[]; // ✅ Optional dependencies
  usage?: string;        // ✅ Optional usage description
  type: 'pattern' | 'protocol' | 'standard' | 'integration' | 'schema' | 'service' | 'guide' | 'component';  // ✅ Union type
  priority: 'critical' | 'high' | 'medium' | 'low';  // ✅ 4-level priority
}
```

**Enhancement Recommendation**: Add validation helper

```typescript
/**
 * Validates a PrimitiveDiscovery object against standards
 */
function validatePrimitiveDiscovery(discovery: PrimitiveDiscovery): boolean {
  // Validate category format (should match PRIMITIVES.md taxonomy)
  const validCategories = [
    'patterns/', 'protocols/', 'standards/',
    'integrations/', 'schemas/', 'services/',
    'guides/', 'components/'
  ];

  const categoryPrefix = discovery.category.split('/')[0] + '/';
  if (!validCategories.includes(categoryPrefix)) {
    console.warn(`Invalid category: ${discovery.category}`);
    return false;
  }

  // Validate priority level
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  if (!validPriorities.includes(discovery.priority)) {
    console.warn(`Invalid priority: ${discovery.priority}`);
    return false;
  }

  return true;
}
```

#### ✅ **DeepAnalysisResult** Interface

Current implementation follows aggregation pattern:

```typescript
export interface DeepAnalysisResult {
  primitives: PrimitiveDiscovery[];           // ✅ Array of discoveries
  totalCount: number;                         // ✅ Aggregate count
  byCategory: Record<string, number>;         // ✅ Category breakdown
  byPriority: Record<string, number>;         // ✅ Priority breakdown
}
```

**Enhancement Recommendation**: Add metadata

```typescript
export interface DeepAnalysisResult {
  primitives: PrimitiveDiscovery[];
  totalCount: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;

  // ✅ Add metadata for better tracking
  metadata?: {
    analysisTime: number;        // Time taken in milliseconds
    agentVersion: string;        // claude-flow version used
    taxonomyVersion: string;     // PRIMITIVES.md version
    timestamp: string;           // ISO 8601 timestamp
  };
}
```

---

## 3. Method Implementation Standards

### 🔧 Constructor Pattern

#### ✅ Current Implementation

```typescript
export class DeepAnalyzer {
  constructor(
    private projectRoot: string,
    private vaultRoot: string
  ) {}
}
```

**Validation**: ✅ Follows dependency injection pattern

### 🔧 Public Method Pattern

#### ✅ Current Implementation

```typescript
/**
 * Perform deep analysis using claude-flow agent
 */
async analyze(): Promise<DeepAnalysisResult> {
  console.log('  🔍 Performing deep codebase analysis...');

  const hasClaudeFlow = await this.checkClaudeFlow();

  if (!hasClaudeFlow) {
    console.log('  ⚠️  claude-flow not available, using shallow analysis');
    return this.shallowAnalysis();
  }

  try {
    const analysis = await this.claudeFlowAnalysis();
    console.log(`  ✓ Found ${analysis.totalCount} primitives across taxonomy`);
    return analysis;
  } catch (error) {
    console.error('  ❌ Deep analysis failed:', error);
    return this.shallowAnalysis();
  }
}
```

**Enhancement Recommendation**: Add metadata tracking

```typescript
/**
 * Perform deep analysis using claude-flow agent
 *
 * @returns Promise resolving to analysis result with metadata
 * @throws Error if both deep and shallow analysis fail
 *
 * @example
 * ```typescript
 * const analyzer = new DeepAnalyzer('/project', '/vault');
 * const result = await analyzer.analyze();
 * console.log(`Found ${result.totalCount} primitives in ${result.metadata.analysisTime}ms`);
 * ```
 */
async analyze(): Promise<DeepAnalysisResult> {
  const startTime = Date.now();
  console.log('  🔍 Performing deep codebase analysis...');

  const hasClaudeFlow = await this.checkClaudeFlow();

  if (!hasClaudeFlow) {
    console.log('  ⚠️  claude-flow not available, using shallow analysis');
    return this.addMetadata(await this.shallowAnalysis(), startTime, 'shallow');
  }

  try {
    const analysis = await this.claudeFlowAnalysis();
    console.log(`  ✓ Found ${analysis.totalCount} primitives across taxonomy`);
    return this.addMetadata(analysis, startTime, 'deep');
  } catch (error) {
    console.error('  ❌ Deep analysis failed:', error);
    return this.addMetadata(await this.shallowAnalysis(), startTime, 'fallback');
  }
}

/**
 * Add metadata to analysis result
 */
private addMetadata(
  result: DeepAnalysisResult,
  startTime: number,
  analysisType: 'deep' | 'shallow' | 'fallback'
): DeepAnalysisResult {
  return {
    ...result,
    metadata: {
      analysisTime: Date.now() - startTime,
      analysisType,
      agentVersion: '1.0.0',  // Could be retrieved from claude-flow
      taxonomyVersion: '1.0.0',
      timestamp: new Date().toISOString()
    }
  };
}
```

---

## 4. Error Handling Enhancement

### 🛡️ Timeout Handling (Current Implementation)

#### ✅ Current Implementation

```typescript
private async claudeFlowAnalysis(): Promise<DeepAnalysisResult> {
  const cmd = `npx claude-flow agent execute researcher "${prompt.replace(/"/g, '\\"')}" --json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const { stdout } = await execAsync(cmd, {
      cwd: this.projectRoot,
      maxBuffer: 10 * 1024 * 1024,
      signal: controller.signal as any
    });

    clearTimeout(timeoutId);
    const response = JSON.parse(stdout);
    return this.parseAgentResponse(response);
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError' || error.killed) {
      throw new Error('Deep analysis timeout - process killed');
    }
    throw new Error(`Agent execution failed: ${error.message}`);
  }
}
```

**Validation**: ✅ Follows timeout handling standards with AbortController

**Enhancement Recommendation**: Add configurable timeout

```typescript
export class DeepAnalyzer {
  constructor(
    private projectRoot: string,
    private vaultRoot: string,
    private options: DeepAnalyzerOptions = {}
  ) {}
}

export interface DeepAnalyzerOptions {
  timeout?: number;           // Default: 120000 (2 minutes)
  maxBufferSize?: number;     // Default: 10MB
  fallbackOnError?: boolean;  // Default: true
}

private async claudeFlowAnalysis(): Promise<DeepAnalysisResult> {
  const timeout = this.options.timeout || 120000;
  const maxBuffer = this.options.maxBufferSize || 10 * 1024 * 1024;

  const cmd = `npx claude-flow agent execute researcher "${prompt.replace(/"/g, '\\"')}" --json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const { stdout } = await execAsync(cmd, {
      cwd: this.projectRoot,
      maxBuffer,
      signal: controller.signal as any
    });

    clearTimeout(timeoutId);
    const response = JSON.parse(stdout);
    return this.parseAgentResponse(response);
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError' || error.killed) {
      throw new Error(`Deep analysis timeout after ${timeout}ms - process killed`);
    }
    throw new Error(`Agent execution failed: ${error.message}`);
  }
}
```

---

## 5. Documentation Enhancement

### 📖 JSDoc Standards

#### ✅ Current Implementation

Current file has basic JSDoc comments. Here's the enhanced version:

#### 🔧 Enhanced Implementation

```typescript
/**
 * Deep Codebase Analyzer
 *
 * Analyzes codebases using claude-flow AI agents to discover primitives
 * and map them to the PRIMITIVES.md taxonomy. Supports both deep analysis
 * (with AI agents) and shallow analysis (fallback mode).
 *
 * @module cultivation/deep-analyzer
 *
 * @example Basic Usage
 * ```typescript
 * const analyzer = new DeepAnalyzer('/path/to/project', '/path/to/vault');
 * const result = await analyzer.analyze();
 * console.log(`Found ${result.totalCount} primitives`);
 * ```
 *
 * @example With Options
 * ```typescript
 * const analyzer = new DeepAnalyzer(
 *   '/path/to/project',
 *   '/path/to/vault',
 *   { timeout: 60000, fallbackOnError: true }
 * );
 * const result = await analyzer.analyze();
 * ```
 */

export class DeepAnalyzer {
  /**
   * Creates a new DeepAnalyzer instance
   *
   * @param projectRoot - Absolute path to the project root directory
   * @param vaultRoot - Absolute path to the vault root directory
   * @param options - Optional configuration for analysis behavior
   *
   * @throws {Error} If projectRoot or vaultRoot don't exist
   *
   * @example
   * ```typescript
   * const analyzer = new DeepAnalyzer(
   *   '/home/user/projects/my-app',
   *   '/home/user/vaults/my-vault'
   * );
   * ```
   */
  constructor(
    private projectRoot: string,
    private vaultRoot: string,
    private options: DeepAnalyzerOptions = {}
  ) {}

  /**
   * Performs deep codebase analysis using claude-flow agents
   *
   * Attempts to use claude-flow agent for intelligent analysis. If claude-flow
   * is not available or execution fails, automatically falls back to shallow
   * analysis based on package.json parsing.
   *
   * @returns Promise resolving to analysis result with discovered primitives
   * @throws {Error} If both deep and shallow analysis fail
   *
   * @example
   * ```typescript
   * const result = await analyzer.analyze();
   * console.log(`Found ${result.totalCount} primitives`);
   * console.log(`Analysis took ${result.metadata.analysisTime}ms`);
   *
   * // Breakdown by category
   * for (const [category, count] of Object.entries(result.byCategory)) {
   *   console.log(`  ${category}: ${count}`);
   * }
   * ```
   */
  async analyze(): Promise<DeepAnalysisResult> {
    // Implementation
  }

  /**
   * Checks if claude-flow CLI is available in the environment
   *
   * @returns Promise resolving to true if claude-flow is available
   *
   * @example
   * ```typescript
   * const available = await analyzer.checkClaudeFlow();
   * if (!available) {
   *   console.log('claude-flow not available, will use shallow analysis');
   * }
   * ```
   */
  private async checkClaudeFlow(): Promise<boolean> {
    // Implementation
  }
}
```

---

## 6. Testing Integration

### 🧪 Unit Test Template for Deep-Analyzer

Create **`tests/cultivation/deep-analyzer.test.ts`**:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { DeepAnalyzer, PrimitiveDiscovery, DeepAnalysisResult } from '../../src/cultivation/deep-analyzer';
import { promisify } from 'util';
import { exec } from 'child_process';

// Mock dependencies
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  stat: vi.fn()
}));

const execAsync = promisify(exec);

describe('DeepAnalyzer', () => {
  let analyzer: DeepAnalyzer;
  let mockExecAsync: Mock;
  let mockReadFile: Mock;

  beforeEach(() => {
    // Setup mocks
    mockExecAsync = exec as unknown as Mock;
    mockReadFile = vi.mocked(fs.readFile);

    // Create analyzer instance
    analyzer = new DeepAnalyzer('/test/project', '/test/vault');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('analyze()', () => {
    it('should successfully perform deep analysis when claude-flow is available', async () => {
      // ARRANGE
      const mockResponse = {
        primitives: [
          {
            category: 'schemas/database',
            name: 'User Schema',
            description: 'User authentication schema',
            files: ['lib/db.ts'],
            type: 'schema',
            priority: 'high'
          }
        ]
      };

      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // checkClaudeFlow
      mockExecAsync.mockResolvedValueOnce({
        stdout: JSON.stringify(mockResponse),
        stderr: ''
      }); // claudeFlowAnalysis

      // ACT
      const result = await analyzer.analyze();

      // ASSERT
      expect(result.totalCount).toBe(1);
      expect(result.primitives).toHaveLength(1);
      expect(result.primitives[0].name).toBe('User Schema');
      expect(result.byCategory['schemas/database']).toBe(1);
      expect(result.byPriority['high']).toBe(1);
    });

    it('should fall back to shallow analysis when claude-flow is not available', async () => {
      // ARRANGE
      mockExecAsync.mockRejectedValueOnce(new Error('Command not found')); // checkClaudeFlow fails
      mockReadFile.mockResolvedValueOnce(JSON.stringify({
        dependencies: {
          'express': '^4.18.0',
          'react': '^18.2.0'
        }
      }));

      // ACT
      const result = await analyzer.analyze();

      // ASSERT
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.primitives).toBeDefined();
    });

    it('should handle timeout gracefully', async () => {
      // ARRANGE
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // checkClaudeFlow succeeds

      const timeoutError = new Error('Timeout');
      timeoutError.name = 'AbortError';
      mockExecAsync.mockRejectedValueOnce(timeoutError); // claudeFlowAnalysis times out

      mockReadFile.mockResolvedValueOnce(JSON.stringify({ dependencies: {} })); // Fallback

      // ACT
      const result = await analyzer.analyze();

      // ASSERT
      expect(result).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle malformed JSON response', async () => {
      // ARRANGE
      mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' }); // checkClaudeFlow
      mockExecAsync.mockResolvedValueOnce({
        stdout: 'invalid json{]',
        stderr: ''
      });

      mockReadFile.mockResolvedValueOnce(JSON.stringify({ dependencies: {} })); // Fallback

      // ACT
      const result = await analyzer.analyze();

      // ASSERT
      expect(result).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checkClaudeFlow()', () => {
    it('should return true when claude-flow is available', async () => {
      // ARRANGE
      mockExecAsync.mockResolvedValueOnce({ stdout: 'v1.0.0', stderr: '' });

      // ACT
      const available = await (analyzer as any).checkClaudeFlow();

      // ASSERT
      expect(available).toBe(true);
    });

    it('should return false when claude-flow is not available', async () => {
      // ARRANGE
      mockExecAsync.mockRejectedValueOnce(new Error('Command not found'));

      // ACT
      const available = await (analyzer as any).checkClaudeFlow();

      // ASSERT
      expect(available).toBe(false);
    });

    it('should handle timeout when checking claude-flow', async () => {
      // ARRANGE
      mockExecAsync.mockImplementationOnce(() =>
        new Promise((resolve) => setTimeout(() => resolve({ stdout: '', stderr: '' }), 10000))
      );

      // ACT
      const available = await (analyzer as any).checkClaudeFlow();

      // ASSERT
      expect(available).toBe(false); // Should timeout and return false
    });
  });
});
```

### 🧪 Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test tests/cultivation/deep-analyzer.test.ts

# Watch mode
npm test -- --watch
```

---

## 7. TypeScript Configuration

### ⚙️ Validate `tsconfig.json`

Ensure your `tsconfig.json` matches the standards:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 8. Validation Checklist

Use this checklist to validate `deep-analyzer.ts` against all standards:

### ✅ File Structure
- [ ] File uses `kebab-case.ts` naming
- [ ] Imports organized (Node.js → external → internal)
- [ ] Interfaces defined before classes
- [ ] Exports at the end

### ✅ Naming Conventions
- [ ] Class uses `PascalCase` (DeepAnalyzer)
- [ ] Interfaces use `PascalCase` (no "I" prefix)
- [ ] Methods use `camelCase` with action verbs
- [ ] Private members use `private` keyword
- [ ] Constants use `SCREAMING_SNAKE_CASE`

### ✅ API Design
- [ ] Constructor uses dependency injection
- [ ] Options pattern for configuration
- [ ] Result objects instead of primitives
- [ ] Interface-first design

### ✅ Async Patterns
- [ ] All async methods return explicit `Promise<T>`
- [ ] Uses async/await (no Promise chains)
- [ ] Parallel operations with `Promise.all()`
- [ ] Timeout handling with `AbortController`

### ✅ Error Handling
- [ ] Try-catch blocks with context
- [ ] Graceful degradation (deep → shallow)
- [ ] Error messages include details
- [ ] Timeout errors handled separately

### ✅ Documentation
- [ ] File header JSDoc with description
- [ ] Public methods have JSDoc with @example
- [ ] Inline comments explain WHY
- [ ] Complex logic has explanatory comments

### ✅ Data Formats
- [ ] ISO 8601 dates (`YYYY-MM-DD` for created)
- [ ] ISO 8601 timestamps for updated
- [ ] Priority uses 4 levels (critical/high/medium/low)
- [ ] Category paths match PRIMITIVES.md taxonomy

### ✅ Testing
- [ ] Unit test file exists (`tests/cultivation/deep-analyzer.test.ts`)
- [ ] 90% coverage target met
- [ ] All public methods tested
- [ ] Edge cases covered (timeout, errors, fallback)
- [ ] Mocks for file system and child processes

### ✅ TypeScript
- [ ] Strict mode enabled
- [ ] No `any` types (use `unknown` if needed)
- [ ] All imports have types
- [ ] ESM modules with `.js` extensions

---

## 🎯 Quick Integration Steps

1. **Review Current Implementation**
   ```bash
   cat weaver/src/cultivation/deep-analyzer.ts
   ```

2. **Add Enhanced JSDoc Comments**
   - Update file header
   - Add @example blocks to public methods
   - Add parameter descriptions

3. **Add Metadata Tracking**
   - Implement `addMetadata()` helper
   - Track analysis time
   - Add timestamps

4. **Add Validation**
   - Implement `validatePrimitiveDiscovery()`
   - Add category validation
   - Add priority validation

5. **Create Test File**
   ```bash
   mkdir -p tests/cultivation
   touch tests/cultivation/deep-analyzer.test.ts
   ```

6. **Write Unit Tests**
   - Copy template from section 6
   - Run tests: `npm test`
   - Check coverage: `npm test -- --coverage`

7. **Validate Against Checklist**
   - Use section 8 checklist
   - Fix any issues found

8. **Update Documentation**
   - Update PRIMITIVES.md if needed
   - Update README with examples

---

## 📚 Additional Resources

- [API & Coding Standards](./api-coding-standards.md)
- [Data & Documentation Standards](./data-documentation-standards.md)
- [Implementation & Naming Standards](./implementation-naming-standards.md)
- [Testing Guidelines](./testing-guidelines.md)
- [COMPREHENSIVE-STANDARDS-SUMMARY.md](./COMPREHENSIVE-STANDARDS-SUMMARY.md)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-30
**Status**: ✅ Ready for Implementation
