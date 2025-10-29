/**
 * Context Analysis System Tests
 *
 * Comprehensive test suite for directory, temporal, and primitive analysis.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  buildDocumentContext,
  calculateContextSimilarity,
  filterBySimilarity,
  getContextSummary,
  type DocumentContext,
} from '../../../../src/workflows/kg/context/index.js';
import {
  analyzeDirectoryContext,
  calculateDirectorySimilarity,
  haveSimilarPurpose,
  type DirectoryContext,
} from '../../../../src/workflows/kg/context/directory-context.js';
import {
  analyzeTemporalContext,
  calculateTemporalSimilarity,
  areSamePhase,
  type TemporalContext,
} from '../../../../src/workflows/kg/context/temporal-context.js';
import {
  extractPrimitives,
  calculatePrimitiveOverlap,
  type Primitives,
} from '../../../../src/workflows/kg/context/primitive-extractor.js';
import type { FileEvent } from '../../../../src/file-watcher/types.js';

describe('Directory Context Analyzer', () => {
  let testVault: string;

  beforeEach(async () => {
    testVault = join(tmpdir(), `test-vault-${Date.now()}`);
    await mkdir(testVault, { recursive: true });
  });

  afterEach(async () => {
    await rm(testVault, { recursive: true, force: true });
  });

  it('should analyze directory structure and infer purpose', async () => {
    const filePath = join(testVault, '_planning/phases/phase-1.md');
    await mkdir(join(testVault, '_planning/phases'), { recursive: true });
    await writeFile(filePath, '# Phase 1');

    const context = await analyzeDirectoryContext(filePath, testVault);

    expect(context.directory).toBe('_planning/phases');
    expect(context.purpose).toBe('planning');
    expect(context.level).toBe(2);
    expect(context.parentDirectory).toBe('_planning');
  });

  it('should identify source code directory purpose', async () => {
    const filePath = join(testVault, 'src/server.ts');
    await mkdir(join(testVault, 'src'), { recursive: true });
    await writeFile(filePath, 'console.log("test")');

    const context = await analyzeDirectoryContext(filePath, testVault);

    expect(context.purpose).toBe('source-code');
  });

  it('should identify documentation directory purpose', async () => {
    const filePath = join(testVault, 'docs/api.md');
    await mkdir(join(testVault, 'docs'), { recursive: true });
    await writeFile(filePath, '# API Docs');

    const context = await analyzeDirectoryContext(filePath, testVault);

    expect(context.purpose).toBe('documentation');
  });

  it('should identify testing directory purpose', async () => {
    const filePath = join(testVault, 'tests/unit/test.ts');
    await mkdir(join(testVault, 'tests/unit'), { recursive: true });
    await writeFile(filePath, 'describe("test")');

    const context = await analyzeDirectoryContext(filePath, testVault);

    expect(context.purpose).toBe('testing');
  });

  it('should find related directories', async () => {
    const filePath = join(testVault, '_planning/phases/phase-1.md');
    await mkdir(join(testVault, '_planning/phases'), { recursive: true });
    await writeFile(filePath, '# Phase 1');

    const context = await analyzeDirectoryContext(filePath, testVault);

    expect(context.relatedDirectories).toContain('_planning');
  });

  it('should calculate directory similarity', () => {
    const dir1: DirectoryContext = {
      directory: 'src/backend',
      purpose: 'source-code',
      parentDirectory: 'src',
      level: 2,
      relatedDirectories: ['src', 'src/tests'],
    };

    const dir2: DirectoryContext = {
      directory: 'src/frontend',
      purpose: 'source-code',
      parentDirectory: 'src',
      level: 2,
      relatedDirectories: ['src', 'src/tests'],
    };

    const similarity = calculateDirectorySimilarity(dir1, dir2);

    // Same parent, same purpose, same level = high similarity
    expect(similarity).toBeGreaterThan(0.5);
  });

  it('should recognize similar purposes', () => {
    expect(haveSimilarPurpose('source-code', 'testing')).toBe(true);
    expect(haveSimilarPurpose('documentation', 'planning')).toBe(true);
    expect(haveSimilarPurpose('source-code', 'archived')).toBe(false);
  });
});

describe('Temporal Context Analyzer', () => {
  let testVault: string;

  beforeEach(async () => {
    testVault = join(tmpdir(), `test-vault-${Date.now()}`);
    await mkdir(testVault, { recursive: true });
  });

  afterEach(async () => {
    await rm(testVault, { recursive: true, force: true });
  });

  it('should extract created date from frontmatter', async () => {
    const filePath = join(testVault, 'test.md');
    const content = `---
created_date: 2025-01-15
---
# Test`;
    await writeFile(filePath, content);

    const context = await analyzeTemporalContext(filePath, testVault);

    expect(context.createdDate).toBeDefined();
    expect(context.createdDate?.toISOString()).toContain('2025-01-15');
  });

  it('should extract phase from filename', async () => {
    const filePath = join(testVault, 'phase-12-planning.md');
    await writeFile(filePath, '# Phase 12');

    const context = await analyzeTemporalContext(filePath, testVault);

    expect(context.phase).toBe('phase-12');
  });

  it('should extract phase from frontmatter', async () => {
    const filePath = join(testVault, 'test.md');
    const content = `---
phase: phase-14
---
# Test`;
    await writeFile(filePath, content);

    const context = await analyzeTemporalContext(filePath, testVault);

    expect(context.phase).toBe('phase-14');
  });

  it('should find files created around the same time', async () => {
    const date1 = '2025-01-15';
    const date2 = '2025-01-18'; // 3 days later

    const file1 = join(testVault, 'file1.md');
    const file2 = join(testVault, 'file2.md');

    await writeFile(file1, `---\ncreated_date: ${date1}\n---\n# File 1`);
    await writeFile(file2, `---\ncreated_date: ${date2}\n---\n# File 2`);

    const context = await analyzeTemporalContext(file1, testVault);

    expect(context.recentFiles).toContain('file2.md');
  });

  it('should check if files are from same phase', () => {
    expect(areSamePhase('phase-12', 'phase-12')).toBe(true);
    expect(areSamePhase('phase-12', 'phase-13')).toBe(false);
    expect(areSamePhase(undefined, 'phase-12')).toBe(false);
  });

  it('should calculate temporal similarity for same phase', () => {
    const temporal1: TemporalContext = {
      phase: 'phase-12',
      createdDate: new Date('2025-01-15'),
      recentFiles: [],
    };

    const temporal2: TemporalContext = {
      phase: 'phase-12',
      createdDate: new Date('2025-01-16'),
      recentFiles: [],
    };

    const similarity = calculateTemporalSimilarity(temporal1, temporal2);

    // Same phase + created within 7 days = high similarity
    expect(similarity).toBeGreaterThan(0.7);
  });

  it('should calculate lower similarity for different phases', () => {
    const temporal1: TemporalContext = {
      phase: 'phase-12',
      createdDate: new Date('2025-01-15'),
      recentFiles: [],
    };

    const temporal2: TemporalContext = {
      phase: 'phase-13',
      createdDate: new Date('2025-02-15'),
      recentFiles: [],
    };

    const similarity = calculateTemporalSimilarity(temporal1, temporal2);

    expect(similarity).toBeLessThan(0.3);
  });
});

describe('Primitive Extractor', () => {
  let testVault: string;

  beforeEach(async () => {
    testVault = join(tmpdir(), `test-vault-${Date.now()}`);
    await mkdir(testVault, { recursive: true });
  });

  afterEach(async () => {
    await rm(testVault, { recursive: true, force: true });
  });

  it('should extract platforms from content', async () => {
    const filePath = join(testVault, 'test.md');
    const content = `# API Service

We're using Node.js with TypeScript and PostgreSQL for our backend.
Docker containers deployed to AWS.`;

    await writeFile(filePath, content);

    const primitives = await extractPrimitives(filePath);

    // Note: 'Node.js' is matched as 'node.js', 'nodejs' is also in the keyword list
    expect(
      primitives.platforms.some(p => p.toLowerCase() === 'nodejs' || p.toLowerCase() === 'node.js')
    ).toBe(true);
    expect(primitives.platforms).toContain('typescript');
    expect(
      primitives.platforms.some(p => p.toLowerCase() === 'postgresql' || p.toLowerCase() === 'postgres')
    ).toBe(true);
    expect(primitives.platforms).toContain('docker');
    expect(primitives.platforms).toContain('aws');
  });

  it('should extract patterns from content', async () => {
    const filePath = join(testVault, 'test.md');
    const content = `# Architecture

We use microservices architecture with REST API and event-driven communication.
Implementing CQRS pattern for scalability.`;

    await writeFile(filePath, content);

    const primitives = await extractPrimitives(filePath);

    expect(primitives.patterns).toContain('microservices');
    // 'REST API' is matched as 'rest api' or 'rest-api'
    expect(
      primitives.patterns.some(p => p.toLowerCase() === 'rest-api' || p.toLowerCase() === 'rest api')
    ).toBe(true);
    expect(primitives.patterns).toContain('event-driven');
    expect(primitives.patterns).toContain('cqrs');
  });

  it('should extract features from content', async () => {
    const filePath = join(testVault, 'test.md');
    const content = `# Features

- JWT authentication
- Redis caching
- Logging and monitoring
- CI/CD pipeline with automated testing`;

    await writeFile(filePath, content);

    const primitives = await extractPrimitives(filePath);

    expect(primitives.features).toContain('authentication');
    expect(primitives.features).toContain('caching');
    expect(primitives.features).toContain('logging');
    expect(primitives.features).toContain('monitoring');
    // 'CI/CD' is matched as 'ci/cd' or 'ci-cd'
    expect(
      primitives.features.some(f => f.toLowerCase() === 'ci-cd' || f.toLowerCase() === 'ci/cd')
    ).toBe(true);
  });

  it('should infer domain from file path', async () => {
    const filePath = join(testVault, '_planning/specs/api-spec.md');
    await mkdir(join(testVault, '_planning/specs'), { recursive: true });
    await writeFile(filePath, '# API Spec');

    const primitives = await extractPrimitives(filePath);

    expect(primitives.domain).toBe('specification');
  });

  it('should extract primitives from frontmatter', async () => {
    const filePath = join(testVault, 'test.md');
    const content = `---
primitives:
  - nodejs
  - graphql
  - microservices
  - authentication
domain: backend
---
# Test`;

    await writeFile(filePath, content);

    const primitives = await extractPrimitives(filePath);

    expect(primitives.platforms).toContain('nodejs');
    expect(primitives.platforms).toContain('graphql');
  });

  it('should calculate primitive overlap', () => {
    const primitives1: Primitives = {
      platforms: ['nodejs', 'typescript', 'postgresql'],
      patterns: ['microservices', 'rest-api'],
      features: ['authentication', 'caching'],
      domain: 'backend',
    };

    const primitives2: Primitives = {
      platforms: ['nodejs', 'typescript', 'redis'],
      patterns: ['microservices', 'event-driven'],
      features: ['authentication', 'monitoring'],
      domain: 'backend',
    };

    const overlap = calculatePrimitiveOverlap(primitives1, primitives2);

    // Same domain + shared platforms/patterns/features = high overlap
    expect(overlap).toBeGreaterThan(0.5);
  });

  it('should calculate lower overlap for different domains', () => {
    const primitives1: Primitives = {
      platforms: ['nodejs', 'typescript'],
      patterns: ['rest-api'],
      features: ['authentication'],
      domain: 'backend',
    };

    const primitives2: Primitives = {
      platforms: ['react', 'typescript'],
      patterns: ['mvc'],
      features: ['authentication'],
      domain: 'frontend',
    };

    const overlap = calculatePrimitiveOverlap(primitives1, primitives2);

    expect(overlap).toBeLessThan(0.5);
  });
});

describe('Integrated Context Analysis', () => {
  let testVault: string;

  beforeEach(async () => {
    testVault = join(tmpdir(), `test-vault-${Date.now()}`);
    await mkdir(testVault, { recursive: true });
  });

  afterEach(async () => {
    await rm(testVault, { recursive: true, force: true });
  });

  it('should build complete document context', async () => {
    const filePath = join(testVault, '_planning/phases/phase-12.md');
    await mkdir(join(testVault, '_planning/phases'), { recursive: true });

    const content = `---
created_date: 2025-01-15
phase: phase-12
domain: planning
---
# Phase 12: Four Pillar System

Using TypeScript and Node.js with microservices architecture.
Implementing authentication and caching.`;

    await writeFile(filePath, content);

    const fileEvent: FileEvent = {
      type: 'add',
      path: filePath,
      relativePath: '_planning/phases/phase-12.md',
      timestamp: new Date(),
    };

    const context = await buildDocumentContext(fileEvent, testVault);

    expect(context.filePath).toBe('_planning/phases/phase-12.md');
    expect(context.directory.purpose).toBe('planning');
    expect(context.temporal.phase).toBe('phase-12');
    expect(context.primitives.domain).toBe('planning');
    expect(context.primitives.platforms).toContain('typescript');
    expect(context.primitives.patterns).toContain('microservices');
  });

  it('should calculate overall context similarity', async () => {
    const file1Path = join(testVault, 'src/api.ts');
    const file2Path = join(testVault, 'src/database.ts');

    await mkdir(join(testVault, 'src'), { recursive: true });

    await writeFile(
      file1Path,
      `---
created_date: 2025-01-15
domain: backend
---
# API Service
Using Node.js, TypeScript, and REST API with authentication.`
    );

    await writeFile(
      file2Path,
      `---
created_date: 2025-01-16
domain: backend
---
# Database Layer
PostgreSQL database with Node.js and TypeScript.`
    );

    const event1: FileEvent = {
      type: 'add',
      path: file1Path,
      relativePath: 'src/api.ts',
      timestamp: new Date(),
    };

    const event2: FileEvent = {
      type: 'add',
      path: file2Path,
      relativePath: 'src/database.ts',
      timestamp: new Date(),
    };

    const context1 = await buildDocumentContext(event1, testVault);
    const context2 = await buildDocumentContext(event2, testVault);

    const similarity = calculateContextSimilarity(context1, context2);

    // Same directory, same domain, shared platforms, created close together
    expect(similarity).toBeGreaterThan(0.7);
  });

  it('should filter contexts by similarity threshold', async () => {
    const targetPath = join(testVault, 'src/api.ts');
    const similar1Path = join(testVault, 'src/auth.ts');
    const similar2Path = join(testVault, 'src/db.ts');
    const differentPath = join(testVault, 'docs/readme.md');

    await mkdir(join(testVault, 'src'), { recursive: true });
    await mkdir(join(testVault, 'docs'), { recursive: true });

    const baseContent = `---
created_date: 2025-01-15
domain: backend
---
# Backend Service
Node.js and TypeScript with REST API.`;

    await writeFile(targetPath, baseContent);
    await writeFile(similar1Path, baseContent);
    await writeFile(similar2Path, baseContent);
    await writeFile(
      differentPath,
      `---
created_date: 2025-01-01
domain: documentation
---
# README`
    );

    const targetEvent: FileEvent = {
      type: 'add',
      path: targetPath,
      relativePath: 'src/api.ts',
      timestamp: new Date(),
    };

    const targetContext = await buildDocumentContext(targetEvent, testVault);

    const candidates: DocumentContext[] = await Promise.all([
      buildDocumentContext(
        {
          type: 'add',
          path: similar1Path,
          relativePath: 'src/auth.ts',
          timestamp: new Date(),
        },
        testVault
      ),
      buildDocumentContext(
        {
          type: 'add',
          path: similar2Path,
          relativePath: 'src/db.ts',
          timestamp: new Date(),
        },
        testVault
      ),
      buildDocumentContext(
        {
          type: 'add',
          path: differentPath,
          relativePath: 'docs/readme.md',
          timestamp: new Date(),
        },
        testVault
      ),
    ]);

    const filtered = filterBySimilarity(targetContext, candidates, 0.5);

    // Should include similar files but exclude different one
    expect(filtered.length).toBe(2);
    expect(filtered.every(r => r.similarity >= 0.5)).toBe(true);
  });

  it('should generate context summary', async () => {
    const filePath = join(testVault, 'src/api.ts');
    await mkdir(join(testVault, 'src'), { recursive: true });

    const content = `---
created_date: 2025-01-15
phase: phase-12
domain: backend
---
# API Service
Node.js with TypeScript.`;

    await writeFile(filePath, content);

    const fileEvent: FileEvent = {
      type: 'add',
      path: filePath,
      relativePath: 'src/api.ts',
      timestamp: new Date(),
    };

    const context = await buildDocumentContext(fileEvent, testVault);
    const summary = getContextSummary(context);

    expect(summary).toContain('source-code');
    expect(summary).toContain('phase-12');
    expect(summary).toContain('backend');
  });
});
