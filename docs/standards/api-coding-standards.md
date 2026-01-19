# API and Coding Standards for Weave-NN

**Document Version:** 1.0.0
**Last Updated:** 2025-10-29
**Scope:** Deep-analyzer module and all cultivation system components

---

## Table of Contents

1. [Overview](#overview)
2. [TypeScript Configuration](#typescript-configuration)
3. [Naming Conventions](#naming-conventions)
4. [API Design Patterns](#api-design-patterns)
5. [Code Organization](#code-organization)
6. [Async Patterns](#async-patterns)
7. [Error Handling](#error-handling)
8. [Documentation Standards](#documentation-standards)
9. [Type Definitions](#type-definitions)
10. [Import/Export Conventions](#importexport-conventions)
11. [Testing Standards](#testing-standards)
12. [Examples from Codebase](#examples-from-codebase)

---

## Overview

This document establishes comprehensive coding standards for the weave-nn project, with specific focus on the cultivation system's deep-analyzer module. These standards are derived from:

- **Analysis of existing codebase patterns** in `weaver/src/cultivation/`
- **Industry best practices** for TypeScript Node.js projects
- **MCP (Model Context Protocol)** server implementation patterns
- **Claude-flow agent integration** requirements

### Key Principles

1. **Type Safety First**: Leverage TypeScript's strict mode for maximum type safety
2. **Explicit Over Implicit**: Clear, readable code over clever shortcuts
3. **Async/Await**: Modern async patterns, avoiding callback hell
4. **Modular Design**: Small, focused modules with single responsibilities
5. **Documentation**: JSDoc comments for all public APIs

---

## TypeScript Configuration

### Strict Mode Settings

All TypeScript files MUST use strict mode compiler options:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Module System

- **Target**: ES2022 or later
- **Module**: ESNext with `.js` extension imports
- **Module Resolution**: Node16/NodeNext for full ESM support

```typescript
// ✅ CORRECT: Use .js extensions for local imports (TypeScript ESM requirement)
import { DeepAnalyzer } from './deep-analyzer.js';
import type { VaultContext } from './types.js';

// ❌ INCORRECT: Omitting .js extension
import { DeepAnalyzer } from './deep-analyzer';
```

---

## Naming Conventions

### File Names

- **Pattern**: `kebab-case.ts`
- **Examples**: `deep-analyzer.ts`, `seed-generator.ts`, `agent-orchestrator.ts`

```bash
✅ deep-analyzer.ts
✅ seed-enhancer.ts
✅ context-loader.ts

❌ DeepAnalyzer.ts
❌ seed_generator.ts
❌ agentOrchestrator.ts
```

### Class Names

- **Pattern**: `PascalCase`
- **Descriptive nouns** that clearly indicate purpose

```typescript
// ✅ CORRECT
export class DeepAnalyzer { }
export class SeedGenerator { }
export class AgentOrchestrator { }
export class CultivationEngine { }

// ❌ INCORRECT
export class analyzer { }
export class seedGen { }
export class Orchestrator { }  // Too generic
```

### Interface and Type Names

- **Pattern**: `PascalCase`
- **Descriptive** with context
- **Suffix with Info/Result/Options** for clarity when appropriate

```typescript
// ✅ CORRECT
export interface PrimitiveDiscovery { }
export interface DeepAnalysisResult { }
export interface CultivationOptions { }
export interface ToolResult { }
export type ToolHandler = (params: any) => Promise<ToolResult>;

// ❌ INCORRECT
interface primitiveDiscovery { }  // Wrong case
interface Result { }  // Too generic
type Handler = Function;  // Not specific enough
```

### Method and Function Names

- **Pattern**: `camelCase`
- **Verb-based** for actions
- **Noun-based** for getters

```typescript
// ✅ CORRECT: Verb-based action methods
async analyze(): Promise<DeepAnalysisResult>
async generatePrimitives(analysis: SeedAnalysis): Promise<GeneratedDocument[]>
private buildAnalysisPrompt(taxonomy: string): string
private checkClaudeFlow(): Promise<boolean>

// ✅ CORRECT: Noun-based getters
get totalCount(): number
get byCategory(): Record<string, number>

// ❌ INCORRECT
async doAnalysis()  // Vague
async generate()  // Missing context
private prompt()  // Not descriptive
```

### Variable Names

- **Pattern**: `camelCase`
- **Descriptive** and contextual
- **Avoid abbreviations** unless widely understood

```typescript
// ✅ CORRECT
const projectRoot = '/path/to/project';
const taxonomyPath = path.join(vaultRoot, 'PRIMITIVES.md');
const primitives: PrimitiveDiscovery[] = [];
const hasClaudeFlow = await this.checkClaudeFlow();

// ❌ INCORRECT
const pr = '/path';  // Abbreviated
const path1 = '/path';  // Generic
const data = response;  // Too vague
const tmp = await check();  // Temporary naming
```

### Constants

- **Pattern**: `SCREAMING_SNAKE_CASE` for true constants
- **Pattern**: `camelCase` for readonly configuration

```typescript
// ✅ CORRECT: True constants
const MAX_BUFFER_SIZE = 10 * 1024 * 1024;
const DEFAULT_TIMEOUT = 120000;
const ANALYSIS_CATEGORIES = ['patterns', 'protocols', 'standards'] as const;

// ✅ CORRECT: Configuration objects
const defaultOptions = {
  deepAnalysis: false,
  analysisTimeout: 120000,
  fallbackToShallow: true
};

// ❌ INCORRECT
const max_buffer = 1024;  // Wrong case for constant
const DEFAULT_OPTIONS = { };  // Object shouldn't be SCREAMING_SNAKE
```

### Private Members

- **Pattern**: `private` keyword (not underscore prefix)
- **Clear visibility** through access modifiers

```typescript
// ✅ CORRECT
export class DeepAnalyzer {
  constructor(
    private projectRoot: string,
    private vaultRoot: string
  ) {}

  private async checkClaudeFlow(): Promise<boolean> { }
  private buildAnalysisPrompt(taxonomy: string): string { }
}

// ❌ INCORRECT
export class Analyzer {
  private _projectRoot: string;  // Redundant underscore
  _vaultRoot: string;  // Should use 'private'
}
```

---

## API Design Patterns

### Class-Based Services

The codebase follows a **class-based service pattern** for major components:

```typescript
/**
 * Pattern: Service class with dependency injection via constructor
 */
export class DeepAnalyzer {
  constructor(
    private projectRoot: string,
    private vaultRoot: string
  ) {}

  /**
   * Public API methods are async and return typed promises
   */
  async analyze(): Promise<DeepAnalysisResult> {
    // Implementation
  }

  /**
   * Private helper methods for internal logic
   */
  private async checkClaudeFlow(): Promise<boolean> {
    // Implementation
  }
}
```

### Interface-First Design

Define interfaces before implementation:

```typescript
// ✅ CORRECT: Define interfaces in types.ts
export interface PrimitiveDiscovery {
  category: string;
  name: string;
  description: string;
  files: string[];
  dependencies?: string[];
  usage?: string;
  type: 'pattern' | 'protocol' | 'standard' | 'integration' | 'schema';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DeepAnalysisResult {
  primitives: PrimitiveDiscovery[];
  totalCount: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

// Then implement in service class
export class DeepAnalyzer {
  async analyze(): Promise<DeepAnalysisResult> {
    // Return conforms to interface
  }
}
```

### Options Pattern

Use options objects for complex configurations:

```typescript
// ✅ CORRECT: Options interface with defaults
export interface EnhancedSeedOptions {
  deepAnalysis?: boolean;
  analysisTimeout?: number;
  fallbackToShallow?: boolean;
}

export class SeedEnhancer {
  constructor(
    private vaultContext: VaultContext,
    private projectRoot: string,
    private options: EnhancedSeedOptions = {}
  ) {
    // Apply defaults
    this.options = {
      deepAnalysis: false,
      analysisTimeout: 120000,
      fallbackToShallow: true,
      ...options
    };
  }
}

// Usage
const enhancer = new SeedEnhancer(context, root, {
  deepAnalysis: true
});
```

### Result Objects

Return structured result objects instead of raw data:

```typescript
// ✅ CORRECT: Structured result object
export interface DiscoveryResult {
  totalFiles: number;
  withFrontmatter: number;
  withoutFrontmatter: number;
  modified: number;
  unmodified: number;
  needsProcessing: number;
  files: string[];
}

async discover(): Promise<DiscoveryResult> {
  // Return structured result
  return {
    totalFiles: files.length,
    withFrontmatter,
    withoutFrontmatter,
    modified,
    unmodified,
    needsProcessing,
    files
  };
}

// ❌ INCORRECT: Returning tuple or raw array
async discover(): Promise<[number, number, string[]]> {
  return [total, processed, files];
}
```

### Builder Pattern for Complex Objects

Use builder methods for constructing complex objects:

```typescript
// ✅ CORRECT: Builder methods for readability
private buildAnalysisPrompt(taxonomy: string): string {
  return `Analyze codebase at ${this.projectRoot} and map to PRIMITIVES.md taxonomy.

TAXONOMY:
${taxonomy}

ANALYZE:
1. package.json dependencies
2. Source files (lib/, app/, components/)
3. API routes and patterns
4. Database schemas
5. Integration points

OUTPUT JSON:
{
  "primitives": [...]
}`;
}

private buildFrameworkContent(framework: DependencyInfo, analysis: SeedAnalysis): string {
  const sections: string[] = [];

  sections.push(`# ${this.formatTitle(framework.name)}\n`);
  sections.push(`${framework.description}\n`);
  sections.push(`## Overview\n`);

  // Build sections incrementally
  if (framework.usedBy.length > 0) {
    sections.push(`## Usage in This Project\n`);
    // ...
  }

  return sections.join('\n');
}
```

---

## Code Organization

### File Structure

Each module should have a clear, consistent structure:

```typescript
/**
 * File header with description
 */

// 1. External imports (Node.js built-ins first)
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

// 2. External dependencies
import matter from 'gray-matter';

// 3. Internal imports (types first, then implementations)
import type { VaultContext, GeneratedDocument } from './types.js';
import { ContextLoader } from './context-loader.js';

// 4. Local constants
const execAsync = promisify(exec);

// 5. Interface/type definitions (if not in types.ts)
export interface LocalInterface {
  // ...
}

// 6. Main class/function implementations
export class MainClass {
  // ...
}

// 7. Helper functions (if any)
function helperFunction() {
  // ...
}
```

### Module Exports

- **Named exports preferred** over default exports
- **Export interfaces and types** alongside implementations

```typescript
// ✅ CORRECT: Named exports
export class DeepAnalyzer { }
export interface PrimitiveDiscovery { }
export type AnalysisMode = 'shallow' | 'deep';

// Usage
import { DeepAnalyzer, PrimitiveDiscovery } from './deep-analyzer.js';

// ❌ INCORRECT: Default exports
export default class DeepAnalyzer { }

// Harder to refactor and search
import Whatever from './deep-analyzer.js';
```

### Separation of Concerns

1. **types.ts**: All shared interfaces and types
2. **{module}.ts**: Main implementation
3. **{module}-helper.ts**: Helper utilities if needed
4. **index.ts**: Barrel exports if needed

```
cultivation/
├── types.ts                    # Shared types
├── deep-analyzer.ts           # Deep analysis implementation
├── seed-generator.ts          # Seed generation implementation
├── seed-enhancer.ts           # Enhanced seed with deep analysis
├── engine.ts                  # Main orchestration
├── agent-orchestrator.ts      # Agent coordination
└── index.ts                   # Optional: barrel exports
```

---

## Async Patterns

### Async/Await Everywhere

- **ALWAYS use async/await** instead of raw Promises or callbacks
- **Never use callbacks** for new code

```typescript
// ✅ CORRECT: async/await pattern
async analyze(): Promise<DeepAnalysisResult> {
  const hasClaudeFlow = await this.checkClaudeFlow();

  if (!hasClaudeFlow) {
    return this.shallowAnalysis();
  }

  try {
    const analysis = await this.claudeFlowAnalysis();
    return analysis;
  } catch (error) {
    console.error('Analysis failed:', error);
    return this.shallowAnalysis();
  }
}

// ❌ INCORRECT: Promise chains
analyze(): Promise<DeepAnalysisResult> {
  return this.checkClaudeFlow()
    .then(hasFlow => {
      if (!hasFlow) {
        return this.shallowAnalysis();
      }
      return this.claudeFlowAnalysis();
    })
    .catch(error => {
      console.error(error);
      return this.shallowAnalysis();
    });
}

// ❌ INCORRECT: Callbacks
analyze(callback: (err: Error | null, result?: DeepAnalysisResult) => void): void {
  this.checkClaudeFlow((err, hasFlow) => {
    // Callback hell
  });
}
```

### Parallel Execution

Use `Promise.all()` for independent async operations:

```typescript
// ✅ CORRECT: Parallel execution
async loadContext(): Promise<VaultContext> {
  const [primitives, features, techSpecs, allFiles] = await Promise.all([
    this.loadPrimitives(),
    this.loadFeatures(),
    this.loadTechSpecs(),
    this.findAllFiles()
  ]);

  return { primitives, features, techSpecs, allFiles };
}

// ❌ INCORRECT: Sequential when parallel is possible
async loadContext(): Promise<VaultContext> {
  const primitives = await this.loadPrimitives();  // Wait
  const features = await this.loadFeatures();      // Then wait
  const techSpecs = await this.loadTechSpecs();    // Then wait
  const allFiles = await this.findAllFiles();      // Then wait

  return { primitives, features, techSpecs, allFiles };
}
```

### Promise.allSettled for Error Tolerance

Use `Promise.allSettled()` when some operations can fail:

```typescript
// ✅ CORRECT: Handle partial failures gracefully
const results = await Promise.allSettled([
  this.analyzePackageJson(),
  this.analyzePython(),
  this.analyzeComposer(),
  this.analyzeCargo()
]);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    dependencies.push(...result.value);
  } else {
    console.warn(`Analysis ${index} failed:`, result.reason);
  }
});
```

### Timeout Handling

Use `AbortController` for proper timeout handling:

```typescript
// ✅ CORRECT: AbortController for timeouts
private async claudeFlowAnalysis(): Promise<DeepAnalysisResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const { stdout } = await execAsync(cmd, {
      cwd: this.projectRoot,
      maxBuffer: 10 * 1024 * 1024,
      signal: controller.signal as any
    });

    clearTimeout(timeoutId);
    return this.parseAgentResponse(JSON.parse(stdout));
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError' || error.killed) {
      throw new Error('Deep analysis timeout - process killed');
    }
    throw new Error(`Agent execution failed: ${error.message}`);
  }
}
```

---

## Error Handling

### Try-Catch with Specific Handling

Always handle errors at appropriate levels:

```typescript
// ✅ CORRECT: Specific error handling with fallback
async analyze(): Promise<DeepAnalysisResult> {
  try {
    const analysis = await this.claudeFlowAnalysis();
    console.log(`✓ Found ${analysis.totalCount} primitives`);
    return analysis;
  } catch (error) {
    console.error('❌ Deep analysis failed:', error);
    return this.shallowAnalysis();  // Graceful fallback
  }
}

// ✅ CORRECT: Type-safe error handling
catch (error: any) {
  if (error.name === 'AbortError' || error.killed) {
    throw new Error('Timeout');
  }
  throw new Error(`Failed: ${error.message}`);
}
```

### Error Messages

- **User-facing**: Clear, actionable messages
- **Developer-facing**: Include context and stack traces

```typescript
// ✅ CORRECT: Clear error messages
if (!hasClaudeFlow) {
  console.log('⚠️  claude-flow not available, using shallow analysis');
  return this.shallowAnalysis();
}

// ✅ CORRECT: Detailed error with context
catch (error) {
  const msg = `Failed to process ${filePath}: ${error}`;
  errorMessages.push(msg);
  this.addError(msg);
}

// ❌ INCORRECT: Vague error
throw new Error('Failed');  // No context
```

### Validation

Validate inputs early:

```typescript
// ✅ CORRECT: Early validation
async generatePrimitives(analysis: SeedAnalysis): Promise<GeneratedDocument[]> {
  if (!analysis.dependencies || analysis.dependencies.length === 0) {
    console.warn('No dependencies found');
    return [];
  }

  // Proceed with generation
}

constructor(
  private vaultContext: VaultContext,
  private projectRoot: string
) {
  if (!vaultContext.vaultRoot) {
    throw new Error('vaultRoot is required in VaultContext');
  }
}
```

---

## Documentation Standards

### JSDoc for Public APIs

All exported classes, interfaces, and public methods must have JSDoc:

```typescript
/**
 * Deep Codebase Analyzer
 *
 * Uses claude-flow agents to perform intelligent analysis of codebase
 * and map discoveries to PRIMITIVES.md taxonomy
 */
export class DeepAnalyzer {
  /**
   * Create a new DeepAnalyzer instance
   *
   * @param projectRoot - Root directory of the project to analyze
   * @param vaultRoot - Root directory of the vault for PRIMITIVES.md
   */
  constructor(
    private projectRoot: string,
    private vaultRoot: string
  ) {}

  /**
   * Perform deep analysis using claude-flow agent
   *
   * @returns Analysis result with discovered primitives
   * @throws {Error} If analysis fails and fallback is disabled
   */
  async analyze(): Promise<DeepAnalysisResult> {
    // Implementation
  }
}

/**
 * Result of deep analysis containing discovered primitives
 */
export interface DeepAnalysisResult {
  /** Array of discovered primitives */
  primitives: PrimitiveDiscovery[];

  /** Total number of primitives found */
  totalCount: number;

  /** Count of primitives by category */
  byCategory: Record<string, number>;

  /** Count of primitives by priority level */
  byPriority: Record<string, number>;
}
```

### Inline Comments

- **Explain WHY, not WHAT**
- **Use for complex algorithms**
- **Document edge cases**

```typescript
// ✅ CORRECT: Explains reasoning
// Use AbortController for proper timeout handling
// (setTimeout alone doesn't kill child process)
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 120000);

// Filter out undefined values from frontmatter
// (gray-matter can't serialize undefined)
const cleanFrontmatter = Object.fromEntries(
  Object.entries(doc.frontmatter).filter(([_, v]) => v !== undefined)
);

// ❌ INCORRECT: States the obvious
// Set timeout to 120000
const timeoutId = setTimeout(() => controller.abort(), 120000);

// Loop through primitives
for (const prim of primitives) {
  // ...
}
```

### File Headers

Every file should have a header describing its purpose:

```typescript
/**
 * Deep Codebase Analyzer
 *
 * Uses claude-flow agents to perform intelligent analysis of codebase
 * and map discoveries to PRIMITIVES.md taxonomy
 */
```

---

## Type Definitions

### Explicit Types

- **Always declare return types** for functions
- **Use type inference** for local variables when obvious
- **Avoid `any`** - use `unknown` if type is truly unknown

```typescript
// ✅ CORRECT: Explicit return types
async analyze(): Promise<DeepAnalysisResult> { }
private buildPrompt(taxonomy: string): string { }
private inferCategory(name: string): string { }

// ✅ CORRECT: Type inference for locals (when obvious)
const hasClaudeFlow = await this.checkClaudeFlow();  // boolean inferred
const sections: string[] = [];  // Explicit when not obvious from RHS

// ✅ CORRECT: Use unknown instead of any
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}

// ❌ INCORRECT: Missing return type
async analyze() {  // What does this return?
  // ...
}

// ❌ INCORRECT: Using any
catch (error: any) {
  console.error(error.message);  // Unsafe
}
```

### Union Types and Literal Types

Use union types for constrained values:

```typescript
// ✅ CORRECT: Literal union types
export interface PrimitiveDiscovery {
  type: 'pattern' | 'protocol' | 'standard' | 'integration' | 'schema' | 'service';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

type AgentType = 'researcher' | 'coder' | 'architect' | 'analyst' | 'tester';

// ✅ CORRECT: Discriminated unions
export interface SuccessResult {
  success: true;
  data: any;
}

export interface ErrorResult {
  success: false;
  error: string;
}

export type ToolResult = SuccessResult | ErrorResult;

// Usage with type narrowing
if (result.success) {
  console.log(result.data);  // TypeScript knows this is SuccessResult
} else {
  console.error(result.error);  // TypeScript knows this is ErrorResult
}
```

### Optional vs. Undefined

Use optional properties consistently:

```typescript
// ✅ CORRECT: Optional properties
export interface PrimitiveDiscovery {
  category: string;
  name: string;
  description: string;
  files: string[];
  dependencies?: string[];  // May not exist
  usage?: string;           // May not exist
}

// ❌ INCORRECT: Mixing optional and undefined
export interface Bad {
  dependencies: string[] | undefined;  // Should be optional instead
  usage?: string | undefined;  // Redundant
}
```

### Generic Types

Use generics for reusable components:

```typescript
// ✅ CORRECT: Generic result wrapper
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

async function safeFetch<T>(url: string): Promise<Result<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

---

## Import/Export Conventions

### Import Order

Organize imports in this order:

1. Node.js built-ins
2. External dependencies
3. Internal type imports (with `type` keyword)
4. Internal implementation imports

```typescript
// 1. Node.js built-ins
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

// 2. External dependencies
import matter from 'gray-matter';

// 3. Internal type imports
import type {
  VaultContext,
  GeneratedDocument,
  DocumentMetadata
} from './types.js';

// 4. Internal implementation imports
import { DeepAnalyzer } from './deep-analyzer.js';
import { SeedGenerator } from './seed-generator.js';
```

### Type-Only Imports

Use `import type` for type-only imports:

```typescript
// ✅ CORRECT: Type-only imports
import type { VaultContext } from './types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// ✅ CORRECT: Mixed imports
import { DeepAnalyzer, type PrimitiveDiscovery } from './deep-analyzer.js';

// ❌ INCORRECT: Importing types as values
import { VaultContext } from './types.js';  // Works but less clear
```

### Barrel Exports

Use barrel exports (index.ts) sparingly and only at package boundaries:

```typescript
// cultivation/index.ts (barrel export)
export { CultivationEngine } from './engine.js';
export { DeepAnalyzer } from './deep-analyzer.js';
export { SeedGenerator } from './seed-generator.js';
export type { VaultContext, GeneratedDocument } from './types.js';

// Usage
import { CultivationEngine, type VaultContext } from './cultivation/index.js';
```

---

## Testing Standards

### Test File Naming

- **Pattern**: `{module}.test.ts`
- **Location**: Adjacent to source file or in `tests/` directory

```
cultivation/
├── deep-analyzer.ts
├── deep-analyzer.test.ts
├── seed-generator.ts
└── seed-generator.test.ts
```

### Test Structure

Follow AAA pattern (Arrange, Act, Assert):

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { DeepAnalyzer } from './deep-analyzer.js';

describe('DeepAnalyzer', () => {
  let analyzer: DeepAnalyzer;
  const projectRoot = '/test/project';
  const vaultRoot = '/test/vault';

  beforeEach(() => {
    analyzer = new DeepAnalyzer(projectRoot, vaultRoot);
  });

  describe('analyze()', () => {
    it('should return shallow analysis when claude-flow unavailable', async () => {
      // Arrange
      jest.spyOn(analyzer as any, 'checkClaudeFlow').mockResolvedValue(false);

      // Act
      const result = await analyzer.analyze();

      // Assert
      expect(result).toBeDefined();
      expect(result.primitives).toBeInstanceOf(Array);
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    });

    it('should handle timeout gracefully', async () => {
      // Arrange
      jest.spyOn(analyzer as any, 'checkClaudeFlow').mockResolvedValue(true);
      jest.spyOn(analyzer as any, 'claudeFlowAnalysis').mockRejectedValue(
        new Error('Timeout')
      );

      // Act & Assert
      await expect(analyzer.analyze()).rejects.toThrow('Timeout');
    });
  });
});
```

---

## Examples from Codebase

### Example 1: Service Class Pattern

From `deep-analyzer.ts`:

```typescript
export class DeepAnalyzer {
  constructor(
    private projectRoot: string,
    private vaultRoot: string
  ) {}

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

  private async checkClaudeFlow(): Promise<boolean> {
    try {
      await execAsync('npx claude-flow --version', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
```

### Example 2: Interface-First Design

From `types.ts`:

```typescript
export interface VaultContext {
  primitives?: string;
  features?: string;
  techSpecs?: string;
  vaultRoot: string;
  allFiles: string[];
}

export interface DocumentMetadata {
  title?: string;
  type?: string;
  status?: string;
  tags?: string[];
  created?: string;
  updated?: string;
  phase?: string;
  priority?: string;
  [key: string]: any;  // Allow additional properties
}
```

### Example 3: Builder Pattern

From `seed-generator.ts`:

```typescript
private buildFrameworkContent(framework: DependencyInfo, analysis: SeedAnalysis): string {
  const sections: string[] = [];

  sections.push(`# ${this.formatTitle(framework.name)}\n`);

  if (framework.description) {
    sections.push(`${framework.description}\n`);
  } else {
    sections.push(`${framework.category} framework for ${framework.ecosystem}.\n`);
  }

  sections.push(`## Overview\n`);
  sections.push(`**Version:** ${framework.version}`);
  sections.push(`**Type:** ${framework.type}`);
  sections.push(`**Ecosystem:** ${framework.ecosystem}\n`);

  if (framework.usedBy.length > 0) {
    sections.push(`## Usage in This Project\n`);
    sections.push(`Used by:\n`);
    framework.usedBy.forEach(feature => {
      sections.push(`- [[${this.slugify(feature)}|${feature}]]`);
    });
    sections.push('');
  }

  return sections.join('\n');
}
```

### Example 4: Options Pattern

From `seed-enhancer.ts`:

```typescript
export interface EnhancedSeedOptions {
  deepAnalysis?: boolean;
  analysisTimeout?: number;
  fallbackToShallow?: boolean;
}

export class SeedEnhancer {
  constructor(
    private vaultContext: VaultContext,
    private projectRoot: string,
    private options: EnhancedSeedOptions = {}
  ) {
    this.seedGenerator = new SeedGenerator(vaultContext, projectRoot);
    this.deepAnalyzer = new DeepAnalyzer(projectRoot, vaultContext.vaultRoot);
  }

  async generate(): Promise<GeneratedDocument[]> {
    if (this.options.deepAnalysis === true) {
      try {
        const deepResult = await this.performDeepAnalysis();
        // ...
      } catch (error) {
        if (!this.options.fallbackToShallow) {
          throw error;
        }
      }
    }
  }
}
```

### Example 5: Result Objects

From `engine.ts`:

```typescript
export interface DiscoveryResult {
  totalFiles: number;
  withFrontmatter: number;
  withoutFrontmatter: number;
  modified: number;
  unmodified: number;
  needsProcessing: number;
  files: string[];
}

async discover(): Promise<DiscoveryResult> {
  const files = await this.findMarkdownFiles(this.options.targetDirectory);

  // Process files...

  return {
    totalFiles: files.length,
    withFrontmatter,
    withoutFrontmatter,
    modified,
    unmodified,
    needsProcessing,
    files
  };
}
```

---

## Summary Checklist

When writing new code in the cultivation system, ensure:

- [ ] File uses `.ts` extension with ESM imports (`.js` extension in imports)
- [ ] All public APIs have JSDoc comments
- [ ] Class names are PascalCase, methods are camelCase
- [ ] Interfaces defined before implementation
- [ ] Async/await used instead of Promise chains or callbacks
- [ ] Error handling with try-catch and graceful fallbacks
- [ ] Type annotations on function parameters and return types
- [ ] Optional properties use `?` not `| undefined`
- [ ] Imports organized: built-ins, external, types, internal
- [ ] No `any` types (use `unknown` if needed)
- [ ] Private members use `private` keyword
- [ ] Result objects returned instead of tuples
- [ ] Timeout handling with AbortController
- [ ] Clear, actionable error messages
- [ ] Tests follow AAA pattern

---

**Document Maintenance**: This document should be updated when new patterns emerge in the codebase or when TypeScript/Node.js best practices evolve.

**Questions or Clarifications**: Raise issues in the project repository or discuss in team channels.
