# Implementation Patterns and Naming Standards

**Project**: Weave-NN
**Generated**: 2025-10-29
**Purpose**: Comprehensive guide to implementation patterns, naming conventions, and architectural standards for the codebase

---

## Table of Contents

1. [Class Design Patterns](#class-design-patterns)
2. [Method Organization Guidelines](#method-organization-guidelines)
3. [Naming Conventions Reference](#naming-conventions-reference)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Async/Await Best Practices](#asyncawait-best-practices)
6. [Module Organization Standards](#module-organization-standards)
7. [Type System Patterns](#type-system-patterns)
8. [Code Examples from Codebase](#code-examples-from-codebase)

---

## Class Design Patterns

### 1. Constructor Dependency Injection

**Pattern**: Use constructor parameters with `private` modifier for dependency injection

```typescript
// ✅ CORRECT - From deep-analyzer.ts
export class DeepAnalyzer {
  constructor(
    private projectRoot: string,
    private vaultRoot: string
  ) {}
}

// ✅ CORRECT - From seed-enhancer.ts
export class SeedEnhancer {
  private seedGenerator: SeedGenerator;
  private deepAnalyzer: DeepAnalyzer;

  constructor(
    private vaultContext: VaultContext,
    private projectRoot: string,
    private options: EnhancedSeedOptions = {}
  ) {
    this.seedGenerator = new SeedGenerator(vaultContext, projectRoot);
    this.deepAnalyzer = new DeepAnalyzer(projectRoot, vaultContext.vaultRoot);
  }
}
```

**Key Principles**:
- Use `private` modifier directly in constructor parameters
- Initialize complex dependencies in constructor body
- Provide default values for optional parameters
- Keep dependencies immutable when possible

### 2. Public vs Private Method Organization

**Pattern**: Public methods first, private methods after

```typescript
export class SeedGenerator {
  constructor(/* ... */) {}

  // ===== PUBLIC API =====
  /**
   * Analyze entire codebase and generate seed data
   */
  async analyze(): Promise<SeedAnalysis> {
    // Implementation
  }

  /**
   * Generate primitive nodes from seed analysis
   */
  async generatePrimitives(analysis: SeedAnalysis): Promise<GeneratedDocument[]> {
    // Implementation
  }

  // ===== PRIVATE HELPERS =====
  /**
   * Analyze package manager dependency files
   */
  private async analyzeDependencies(analysis: SeedAnalysis): Promise<void> {
    // Implementation
  }

  /**
   * Analyze package.json for Node.js dependencies
   */
  private async analyzePackageJson(analysis: SeedAnalysis): Promise<void> {
    // Implementation
  }
}
```

**Key Principles**:
- Group public methods at the top of class
- Group private methods below public methods
- Use comment separators for clarity (`// ===== SECTION =====`)
- Order private methods by logical flow or alphabetically

### 3. Composition Over Inheritance

**Pattern**: Prefer composition using dependency injection

```typescript
// ✅ CORRECT - Composition pattern
export class SeedEnhancer {
  private seedGenerator: SeedGenerator;
  private deepAnalyzer: DeepAnalyzer;

  constructor(
    private vaultContext: VaultContext,
    private projectRoot: string,
    private options: EnhancedSeedOptions = {}
  ) {
    this.seedGenerator = new SeedGenerator(vaultContext, projectRoot);
    this.deepAnalyzer = new DeepAnalyzer(projectRoot, vaultContext.vaultRoot);
  }

  async generate(): Promise<GeneratedDocument[]> {
    // Delegate to composed objects
    const basicAnalysis = await this.seedGenerator.analyze();
    const deepResult = await this.deepAnalyzer.analyze();
    // ...
  }
}

// ❌ AVOID - Inheritance (not observed in codebase)
export class EnhancedSeedGenerator extends SeedGenerator {
  // Inheritance creates tight coupling
}
```

### 4. Interface-First Design

**Pattern**: Define interfaces before implementation classes

```typescript
// Define interfaces first
export interface PrimitiveDiscovery {
  category: string;
  name: string;
  description: string;
  files: string[];
  dependencies?: string[];
  usage?: string;
  type: 'pattern' | 'protocol' | 'standard' | 'integration' | 'schema' | 'service' | 'guide' | 'component';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface DeepAnalysisResult {
  primitives: PrimitiveDiscovery[];
  totalCount: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

// Then implement classes that use them
export class DeepAnalyzer {
  async analyze(): Promise<DeepAnalysisResult> {
    // Implementation
  }
}
```

---

## Method Organization Guidelines

### 1. Method Ordering Pattern

**Consistent order observed across codebase**:

1. **Constructor** - Always first
2. **Primary public methods** - Main API surface
3. **Secondary public methods** - Supporting operations
4. **Private implementation methods** - Core logic
5. **Private helper methods** - Utility functions
6. **Private formatting/conversion methods** - Data transformation

Example from `seed-generator.ts`:

```typescript
export class SeedGenerator {
  // 1. Constructor
  constructor(private vaultContext: VaultContext, private projectRoot: string) {}

  // 2. Primary public methods
  async analyze(): Promise<SeedAnalysis> { /* ... */ }
  async generatePrimitives(analysis: SeedAnalysis): Promise<GeneratedDocument[]> { /* ... */ }

  // 3. Private implementation methods
  private async analyzeDependencies(analysis: SeedAnalysis): Promise<void> { /* ... */ }
  private async analyzePackageJson(analysis: SeedAnalysis): Promise<void> { /* ... */ }
  private async analyzePython(analysis: SeedAnalysis): Promise<void> { /* ... */ }

  // 4. Private helper methods
  private classifyDependencies(analysis: SeedAnalysis): void { /* ... */ }
  private shouldGenerateNode(dep: DependencyInfo): boolean { /* ... */ }

  // 5. Private formatting methods
  private formatTitle(name: string): string { /* ... */ }
  private slugify(text: string): string { /* ... */ }
}
```

### 2. JSDoc Documentation Pattern

**Pattern**: Use JSDoc for all public methods, optional for private methods

```typescript
/**
 * Perform deep analysis using claude-flow agent
 */
async analyze(): Promise<DeepAnalysisResult> {
  // Implementation
}

/**
 * Check if claude-flow is available
 */
private async checkClaudeFlow(): Promise<boolean> {
  // Implementation
}

/**
 * Build analysis prompt for agent
 */
private buildAnalysisPrompt(taxonomy: string): string {
  // Implementation
}
```

**Key Principles**:
- Single-line JSDoc for simple methods
- Multi-line JSDoc for complex methods with parameters
- Include return type description when non-obvious
- Document side effects and exceptions

### 3. Method Naming Patterns

**Action Verbs**:
- `analyze()` - Perform analysis and return results
- `generate()` - Create and return new data
- `build()` - Construct complex objects
- `parse()` - Convert from one format to another
- `infer()` - Deduce information from context
- `format()` - Transform for display
- `slugify()` - Convert to URL-safe format

**Boolean Methods**:
- `hasFileChanged()` - Question format
- `shouldGenerateNode()` - Decision format
- `checkClaudeFlow()` - Check availability (returns boolean)

**Async Methods**:
- Always use `async` keyword
- Return Promise types explicitly
- Prefix not required (pattern: `analyze()` not `analyzeAsync()`)

---

## Naming Conventions Reference

### 1. File Naming

**Pattern**: `kebab-case.ts`

```
✅ CORRECT:
deep-analyzer.ts
seed-generator.ts
seed-enhancer.ts
shadow-cache.ts
concept-map-generator.ts

❌ INCORRECT:
DeepAnalyzer.ts
seed_generator.ts
SeedEnhancer.ts
```

### 2. Class Naming

**Pattern**: `PascalCase`

```typescript
✅ CORRECT:
export class DeepAnalyzer { }
export class SeedGenerator { }
export class SeedEnhancer { }
export class ShadowCache { }
export class ShadowCacheDatabase { }

❌ INCORRECT:
export class deepAnalyzer { }
export class seed_generator { }
```

### 3. Interface Naming

**Pattern**: `PascalCase` (NO "I" prefix)

```typescript
✅ CORRECT:
export interface PrimitiveDiscovery { }
export interface DeepAnalysisResult { }
export interface DependencyInfo { }
export interface ServiceInfo { }
export interface VaultContext { }

❌ INCORRECT:
export interface IPrimitiveDiscovery { }  // No "I" prefix
export interface primitiveDiscovery { }    // Not PascalCase
export interface primitive_discovery { }   // Not snake_case
```

### 4. Type Alias Naming

**Pattern**: `PascalCase` for complex types

```typescript
✅ CORRECT:
export type DocumentMetadata = {
  title?: string;
  type?: string;
  // ...
};

export type PrimitiveType = 'pattern' | 'protocol' | 'standard' | 'integration';
```

### 5. Variable Naming

**Pattern**: `camelCase`

```typescript
✅ CORRECT:
const projectRoot = '/path/to/project';
const vaultContext = { /* ... */ };
const deepAnalyzer = new DeepAnalyzer();
let filesProcessed = 0;

❌ INCORRECT:
const ProjectRoot = '/path';      // PascalCase for variables
const vault_context = { };        // snake_case
const DeepAnalyzer = new DeepAnalyzer();  // Confusing with class name
```

### 6. Constant Naming

**Pattern**: `SCREAMING_SNAKE_CASE` for true constants, `camelCase` for config objects

```typescript
✅ CORRECT (Module-level constants):
const MAX_TIMEOUT = 120000;
const DEFAULT_PORT = 3000;

✅ CORRECT (Configuration objects):
const defaultConfig = {
  timeout: 5000,
  retries: 3
};

❌ INCORRECT:
const maxTimeout = 120000;  // Should be SCREAMING_SNAKE_CASE
const DEFAULT_CONFIG = { };  // Objects use camelCase
```

### 7. Function Parameter Naming

**Pattern**: `camelCase`, descriptive names

```typescript
✅ CORRECT:
async function analyzeDependencies(
  analysis: SeedAnalysis,
  projectRoot: string
): Promise<void> { }

function buildContent(
  discovery: PrimitiveDiscovery
): string { }

❌ INCORRECT:
function analyze(a: SeedAnalysis, pr: string) { }  // Too abbreviated
function buildContent(d) { }  // Missing type, unclear name
```

### 8. Generic Type Parameter Naming

**Pattern**: Single uppercase letter or descriptive `PascalCase`

```typescript
✅ CORRECT:
function identity<T>(value: T): T {
  return value;
}

interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
}

❌ INCORRECT:
function identity<t>(value: t): t { }  // Lowercase
interface Repository<entity, id> { }   // Not descriptive
```

---

## Error Handling Patterns

### 1. Try-Catch with Logging

**Pattern**: Catch errors, log with context, then throw or handle

```typescript
// From deep-analyzer.ts
async analyze(): Promise<DeepAnalysisResult> {
  try {
    const analysis = await this.claudeFlowAnalysis();
    console.log(`  ✓ Found ${analysis.totalCount} primitives across taxonomy`);
    return analysis;
  } catch (error) {
    console.error('  ❌ Deep analysis failed:', error);
    return this.shallowAnalysis();
  }
}

// From shadow-cache/index.ts
async upsertFile(fileUpdate: FileUpdate): Promise<void> {
  try {
    db.transaction(() => {
      // Database operations
    })();

    logger.debug('File cached', {
      path: fileUpdate.path,
      tags: fileUpdate.tags.length,
      links: fileUpdate.links.length
    });
  } catch (error) {
    logger.error('Failed to upsert file in cache',
      error instanceof Error ? error : new Error(String(error)), {
      path: fileUpdate.path,
    });
    throw error;
  }
}
```

**Key Principles**:
- Always log errors with context
- Use `error instanceof Error` check before accessing error properties
- Decide: throw or recover based on error severity
- Include relevant context in log messages
- Use structured logging when available (`logger.error(message, error, context)`)

### 2. Timeout Handling with AbortController

**Pattern**: Use `AbortController` for proper timeout management

```typescript
// From deep-analyzer.ts
private async claudeFlowAnalysis(): Promise<DeepAnalysisResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min

  try {
    const { stdout } = await execAsync(cmd, {
      cwd: this.projectRoot,
      maxBuffer: 10 * 1024 * 1024, // 10MB
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

**Alternative Pattern**: Promise.race for timeout

```typescript
// From seed-enhancer.ts
private async performDeepAnalysis(): Promise<DeepAnalysisResult | null> {
  const timeout = this.options.analysisTimeout || 120000; // 2 min default

  return Promise.race([
    this.deepAnalyzer.analyze(),
    new Promise<null>((resolve) =>
      setTimeout(() => {
        console.log('  ⚠️  Deep analysis timeout, using basic results');
        resolve(null);
      }, timeout)
    )
  ]);
}
```

### 3. Graceful Degradation Pattern

**Pattern**: Attempt advanced features, fall back to basic functionality

```typescript
// From deep-analyzer.ts
async analyze(): Promise<DeepAnalysisResult> {
  console.log('  🔍 Performing deep codebase analysis...');

  // Check if advanced tool is available
  const hasClaudeFlow = await this.checkClaudeFlow();

  if (!hasClaudeFlow) {
    console.log('  ⚠️  claude-flow not available, using shallow analysis');
    return this.shallowAnalysis();
  }

  // Try advanced analysis
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

### 4. Error Recovery with Continue Pattern

**Pattern**: Log errors but continue processing remaining items

```typescript
// From shadow-cache/index.ts
async syncVault(): Promise<void> {
  logger.info('Starting full vault sync', { vaultPath: this.vaultPath });

  for (const absolutePath of markdownFiles) {
    const relativePath = absolutePath.replace(this.vaultPath + '/', '');

    try {
      const cached = this.db.getFile(relativePath);
      const changed = !cached || hasFileChanged(absolutePath, cached.content_hash);

      if (changed) {
        const fileUpdate = parseMarkdownFile(absolutePath, relativePath);
        await this.upsertFile(fileUpdate);
        filesUpdated++;
      }

      filesProcessed++;
    } catch (error) {
      logger.error('Failed to sync file',
        error instanceof Error ? error : new Error(String(error)), {
        path: relativePath,
      });
      // Continue with next file - don't throw
    }
  }
}
```

---

## Async/Await Best Practices

### 1. Always Return Promises Explicitly

**Pattern**: Declare return type as `Promise<T>`

```typescript
✅ CORRECT:
async analyze(): Promise<SeedAnalysis> {
  const analysis: SeedAnalysis = {
    dependencies: [],
    services: [],
    frameworks: [],
    languages: [],
    deployments: [],
    existingConcepts: [],
    existingFeatures: []
  };

  await this.analyzeDependencies(analysis);
  await this.analyzeVaultDocuments(analysis);

  return analysis;
}

❌ INCORRECT:
async analyze() {  // Missing return type
  // ...
}
```

### 2. Parallel Async Operations

**Pattern**: Use `Promise.all()` for independent operations

```typescript
// Not observed in current files, but recommended pattern
async analyzeAll(): Promise<void> {
  // ✅ CORRECT - Parallel execution
  await Promise.all([
    this.analyzePackageJson(analysis),
    this.analyzePython(analysis),
    this.analyzeComposer(analysis),
    this.analyzeCargo(analysis)
  ]);

  // ❌ INCORRECT - Sequential when parallel is possible
  await this.analyzePackageJson(analysis);
  await this.analyzePython(analysis);
  await this.analyzeComposer(analysis);
  await this.analyzeCargo(analysis);
}
```

### 3. Sequential Async Operations

**Pattern**: Use `await` in order when operations depend on each other

```typescript
// From seed-enhancer.ts
async generate(): Promise<GeneratedDocument[]> {
  const documents: GeneratedDocument[] = [];

  // Sequential - basicDocs needed before deep analysis
  console.log('  📦 Analyzing dependencies...');
  const basicAnalysis = await this.seedGenerator.analyze();
  const basicDocs = await this.seedGenerator.generatePrimitives(basicAnalysis);

  documents.push(...basicDocs);

  if (this.options.deepAnalysis === true) {
    const deepResult = await this.performDeepAnalysis();
    if (deepResult && deepResult.totalCount > 0) {
      const deepDocs = await this.generateFromDeepAnalysis(deepResult);
      documents.push(...deepDocs);
    }
  }

  return this.deduplicateDocuments(documents);
}
```

### 4. Void Return for Fire-and-Forget

**Pattern**: Use `Promise<void>` for operations that don't return data

```typescript
✅ CORRECT:
async syncFile(absolutePath: string, relativePath: string): Promise<void> {
  const fileUpdate = parseMarkdownFile(absolutePath, relativePath);
  await this.upsertFile(fileUpdate);
  logger.debug('File synced to cache', { path: relativePath });
}

private async analyzeDependencies(analysis: SeedAnalysis): Promise<void> {
  await this.analyzePackageJson(analysis);
  await this.analyzePython(analysis);
  await this.analyzeComposer(analysis);
}
```

### 5. Error Handling in Async Functions

**Pattern**: Use try-catch inside async functions

```typescript
async syncFile(absolutePath: string, relativePath: string): Promise<void> {
  try {
    // Check if file exists in cache
    const cached = this.db.getFile(relativePath);
    if (cached && !hasFileChanged(absolutePath, cached.content_hash)) {
      logger.debug('File unchanged, skipping', { path: relativePath });
      return;
    }

    // Parse and cache file
    const fileUpdate = parseMarkdownFile(absolutePath, relativePath);
    await this.upsertFile(fileUpdate);

    logger.debug('File synced to cache', { path: relativePath });
  } catch (error) {
    logger.error('Failed to sync file',
      error instanceof Error ? error : new Error(String(error)), {
      path: relativePath,
    });
  }
}
```

---

## Module Organization Standards

### 1. Import Order

**Pattern**: Organize imports by category

```typescript
// 1. Node.js built-in modules
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

// 2. External dependencies
import matter from 'gray-matter';

// 3. Internal modules (types first, then implementations)
import type { VaultContext, GeneratedDocument, DocumentMetadata } from './types.js';
import { DeepAnalyzer } from './deep-analyzer.js';
import { SeedGenerator } from './seed-generator.js';

// 4. Constants/helpers
const execAsync = promisify(exec);
```

### 2. Export Patterns

**Pattern**: Named exports preferred over default exports

```typescript
✅ CORRECT - Named exports:
// deep-analyzer.ts
export interface PrimitiveDiscovery { }
export interface DeepAnalysisResult { }
export class DeepAnalyzer { }

// Usage:
import { DeepAnalyzer, PrimitiveDiscovery } from './deep-analyzer.js';

❌ AVOID - Default exports (not observed in codebase):
export default class DeepAnalyzer { }
```

**Factory Function Pattern**:

```typescript
// From shadow-cache/index.ts
export class ShadowCache {
  constructor(dbPath: string, vaultPath: string) {
    // ...
  }
}

/**
 * Create a shadow cache instance
 */
export function createShadowCache(dbPath: string, vaultPath: string): ShadowCache {
  return new ShadowCache(dbPath, vaultPath);
}
```

### 3. Re-export Pattern

**Pattern**: Use barrel exports (index.ts) for public API

```typescript
// shadow-cache/index.ts
export class ShadowCache { }
export function createShadowCache(...): ShadowCache { }

// Re-export types
export type { CachedFile, FileUpdate, CacheStats, Frontmatter } from './types.js';
```

### 4. File Organization by Feature

**Pattern**: Group related files by feature/domain

```
cultivation/
  ├── types.ts              # Shared types
  ├── deep-analyzer.ts      # Deep analysis feature
  ├── seed-generator.ts     # Seed generation feature
  └── seed-enhancer.ts      # Enhancement feature

shadow-cache/
  ├── types.ts              # Shared types
  ├── index.ts              # Main export & public API
  ├── database.ts           # Database implementation
  └── parser.ts             # Parsing utilities
```

---

## Type System Patterns

### 1. Interface vs Type Alias

**When to use Interface**:
- For object shapes that may be extended
- For public API contracts
- For data models

```typescript
export interface PrimitiveDiscovery {
  category: string;
  name: string;
  description: string;
  files: string[];
  dependencies?: string[];
  usage?: string;
  type: 'pattern' | 'protocol' | 'standard' | 'integration' | 'schema' | 'service' | 'guide' | 'component';
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface VaultContext {
  primitives?: string;
  features?: string;
  techSpecs?: string;
  vaultRoot: string;
  allFiles: string[];
}
```

**When to use Type Alias**:
- For union types
- For tuple types
- For mapped types
- For complex utility types

```typescript
export type PrimitiveType = 'pattern' | 'protocol' | 'standard' | 'integration' | 'schema' | 'service' | 'guide' | 'component';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type DependencyType = 'framework' | 'library' | 'tool' | 'service' | 'language';
```

### 2. Optional Properties

**Pattern**: Use `?` for optional properties, avoid `| undefined`

```typescript
✅ CORRECT:
export interface DocumentMetadata {
  title?: string;
  type?: string;
  status?: string;
  tags?: string[];
  created?: string;
  updated?: string;
}

❌ AVOID:
export interface DocumentMetadata {
  title: string | undefined;  // Verbose
  type: string | undefined;
}
```

### 3. Index Signatures

**Pattern**: Use `Record<K, V>` or index signature for dynamic properties

```typescript
✅ CORRECT:
export interface DeepAnalysisResult {
  primitives: PrimitiveDiscovery[];
  totalCount: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

// Or with index signature:
export interface DocumentMetadata {
  title?: string;
  type?: string;
  // Allow any additional properties
  [key: string]: any;
}
```

### 4. Readonly Properties

**Pattern**: Use `readonly` for immutable data

```typescript
// Not heavily used in current codebase, but recommended
export interface Config {
  readonly projectRoot: string;
  readonly vaultRoot: string;
  readonly timeout: number;
}
```

### 5. Function Types

**Pattern**: Use arrow function syntax in type definitions

```typescript
// Observed pattern (implicit from usage)
type ParserFunction = (content: string) => ParsedResult;
type AsyncHandler = (req: Request) => Promise<Response>;
```

---

## Code Examples from Codebase

### Example 1: Full Class Structure (DeepAnalyzer)

```typescript
/**
 * Deep Codebase Analyzer
 *
 * Uses claude-flow agents to perform intelligent analysis of codebase
 * and map discoveries to PRIMITIVES.md taxonomy
 */
export class DeepAnalyzer {
  // Constructor with dependency injection
  constructor(
    private projectRoot: string,
    private vaultRoot: string
  ) {}

  /**
   * Perform deep analysis using claude-flow agent
   */
  async analyze(): Promise<DeepAnalysisResult> {
    console.log('  🔍 Performing deep codebase analysis...');

    // Check availability
    const hasClaudeFlow = await this.checkClaudeFlow();
    if (!hasClaudeFlow) {
      console.log('  ⚠️  claude-flow not available, using shallow analysis');
      return this.shallowAnalysis();
    }

    // Try advanced feature with fallback
    try {
      const analysis = await this.claudeFlowAnalysis();
      console.log(`  ✓ Found ${analysis.totalCount} primitives across taxonomy`);
      return analysis;
    } catch (error) {
      console.error('  ❌ Deep analysis failed:', error);
      return this.shallowAnalysis();
    }
  }

  /**
   * Check if claude-flow is available
   */
  private async checkClaudeFlow(): Promise<boolean> {
    try {
      await execAsync('npx claude-flow --version', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Use claude-flow researcher agent for intelligent analysis
   */
  private async claudeFlowAnalysis(): Promise<DeepAnalysisResult> {
    // Build prompt
    const prompt = this.buildAnalysisPrompt(taxonomy);
    const cmd = `npx claude-flow agent execute researcher "${prompt.replace(/"/g, '\\"')}" --json`;

    // Execute with timeout
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

  /**
   * Parse agent JSON response
   */
  private parseAgentResponse(response: any): DeepAnalysisResult {
    const primitives: PrimitiveDiscovery[] = response.primitives || [];

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const prim of primitives) {
      byCategory[prim.category] = (byCategory[prim.category] || 0) + 1;
      byPriority[prim.priority] = (byPriority[prim.priority] || 0) + 1;
    }

    return {
      primitives,
      totalCount: primitives.length,
      byCategory,
      byPriority
    };
  }

  /**
   * Fallback shallow analysis (no agents)
   */
  private async shallowAnalysis(): Promise<DeepAnalysisResult> {
    // Basic implementation without external tools
  }
}
```

### Example 2: Composition Pattern (SeedEnhancer)

```typescript
export class SeedEnhancer {
  private seedGenerator: SeedGenerator;
  private deepAnalyzer: DeepAnalyzer;

  constructor(
    private vaultContext: VaultContext,
    private projectRoot: string,
    private options: EnhancedSeedOptions = {}
  ) {
    // Initialize composed objects
    this.seedGenerator = new SeedGenerator(vaultContext, projectRoot);
    this.deepAnalyzer = new DeepAnalyzer(projectRoot, vaultContext.vaultRoot);
  }

  /**
   * Generate primitive nodes with optional deep analysis
   */
  async generate(): Promise<GeneratedDocument[]> {
    const documents: GeneratedDocument[] = [];

    // Always run basic generation
    console.log('  📦 Analyzing dependencies...');
    const basicAnalysis = await this.seedGenerator.analyze();
    const basicDocs = await this.seedGenerator.generatePrimitives(basicAnalysis);
    documents.push(...basicDocs);

    // Conditionally run deep analysis
    if (this.options.deepAnalysis === true) {
      console.log('  🧠 Running deep codebase analysis...');

      try {
        const deepResult = await this.performDeepAnalysis();

        if (deepResult && deepResult.totalCount > 0) {
          const deepDocs = await this.generateFromDeepAnalysis(deepResult);
          documents.push(...deepDocs);
          console.log(`  ✓ Deep analysis found ${deepResult.totalCount} additional primitives`);
        }
      } catch (error) {
        console.error('  ❌ Deep analysis failed:', error);
        // Graceful degradation - continue with basic results
      }
    }

    return this.deduplicateDocuments(documents);
  }

  /**
   * Perform deep analysis with timeout
   */
  private async performDeepAnalysis(): Promise<DeepAnalysisResult | null> {
    const timeout = this.options.analysisTimeout || 120000;

    return Promise.race([
      this.deepAnalyzer.analyze(),
      new Promise<null>((resolve) =>
        setTimeout(() => {
          console.log('  ⚠️  Deep analysis timeout, using basic results');
          resolve(null);
        }, timeout)
      )
    ]);
  }
}
```

### Example 3: Generator Functions (spec-generator.ts)

```typescript
/**
 * Generate constitution.md
 *
 * Defines project principles, constraints, and success criteria.
 */
export function generateConstitution(phase: PhaseData): string {
  const sections: string[] = [];

  // YAML Frontmatter
  sections.push('---');
  sections.push(`spec_type: "constitution"`);
  sections.push(`phase_id: "${phase.phaseId}"`);
  sections.push(`phase_name: "${phase.phaseName}"`);
  sections.push(`status: "${phase.status}"`);

  if (phase.priority) {
    sections.push(`priority: "${phase.priority}"`);
  }

  sections.push('tags:');
  sections.push('  - spec-kit');
  sections.push('  - constitution');
  sections.push(`  - ${phase.phaseId.toLowerCase()}`);
  sections.push('---');
  sections.push('');

  // Content sections
  sections.push(`# ${phase.phaseName} - Constitution`);
  sections.push('');

  // Build each section
  if (phase.objectives.length > 0) {
    sections.push('## Project Principles');
    sections.push('');
    phase.objectives.forEach((objective, index) => {
      sections.push(`${index + 1}. **${objective.split(':')[0]}**`);
      sections.push(`   ${objective}`);
      sections.push('');
    });
  }

  return sections.join('\n');
}
```

---

## Summary Checklist

### Classes
- [ ] Use PascalCase for class names
- [ ] Use dependency injection via constructor parameters
- [ ] Mark dependencies as `private` or `readonly`
- [ ] Public methods first, private methods after
- [ ] Document all public methods with JSDoc

### Methods
- [ ] Use camelCase for method names
- [ ] Use descriptive action verbs
- [ ] Always specify return types
- [ ] Use `async` for asynchronous operations
- [ ] Return `Promise<void>` for operations without return value

### Error Handling
- [ ] Use try-catch blocks
- [ ] Log errors with context
- [ ] Check `error instanceof Error`
- [ ] Implement graceful degradation
- [ ] Use AbortController for timeouts

### Types
- [ ] Use interfaces for object shapes
- [ ] Use type aliases for unions
- [ ] Use `?` for optional properties
- [ ] No "I" prefix for interfaces
- [ ] Export all public types

### Files
- [ ] Use kebab-case for file names
- [ ] One class per file (main export)
- [ ] Types in separate `types.ts` file
- [ ] Named exports preferred
- [ ] Organize imports by category

---

**Last Updated**: 2025-10-29
**Maintained By**: Weave-NN Development Team
