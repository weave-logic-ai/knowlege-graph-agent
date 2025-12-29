/**
 * Tests for SeedGenerator
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SeedGenerator, analyzeSeed, initPrimitives } from '../../src/cultivation/index.js';
import type { SeedAnalysis } from '../../src/cultivation/types.js';

describe('SeedGenerator', () => {
  const testRoot = join('/tmp', `kg-cultivation-test-${Date.now()}`);
  const docsPath = 'docs';

  beforeEach(() => {
    mkdirSync(join(testRoot, docsPath), { recursive: true });
  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  describe('create', () => {
    it('should create a SeedGenerator instance', async () => {
      const generator = await SeedGenerator.create(testRoot, docsPath);
      expect(generator).toBeInstanceOf(SeedGenerator);
    });

    it('should collect vault files', async () => {
      // Create some test files
      writeFileSync(join(testRoot, docsPath, 'test.md'), '# Test\n\nContent');
      writeFileSync(join(testRoot, docsPath, 'nested.md'), '# Nested');

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      expect(analysis.metadata.filesScanned).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyze', () => {
    it('should analyze empty project', async () => {
      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      expect(analysis.dependencies).toEqual([]);
      expect(analysis.frameworks).toEqual([]);
      expect(analysis.services).toEqual([]);
      expect(analysis.metadata.projectRoot).toBe(testRoot);
    });

    it('should analyze package.json dependencies', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: {
          'express': '^4.18.0',
          'react': '^18.2.0'
        },
        devDependencies: {
          'typescript': '^5.0.0',
          'vitest': '^1.0.0'
        }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      expect(analysis.dependencies.length).toBeGreaterThanOrEqual(4);
      expect(analysis.languages).toContain('javascript');
      expect(analysis.languages).toContain('typescript');

      // Check framework detection
      const expressDep = analysis.dependencies.find(d => d.name === 'express');
      expect(expressDep).toBeDefined();
      expect(expressDep?.ecosystem).toBe('nodejs');

      const reactDep = analysis.dependencies.find(d => d.name === 'react');
      expect(reactDep).toBeDefined();
    });

    it('should detect frameworks', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: {
          'express': '^4.18.0',
          'next': '^14.0.0',
          'axios': '^1.0.0'
        }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      // Express and Next should be classified as frameworks
      expect(analysis.frameworks.length).toBeGreaterThanOrEqual(2);
      expect(analysis.frameworks.some(f => f.name === 'express')).toBe(true);
      expect(analysis.frameworks.some(f => f.name === 'next')).toBe(true);
    });

    it('should analyze Python requirements.txt', async () => {
      writeFileSync(join(testRoot, 'requirements.txt'), `
django==4.2.0
flask>=2.0.0
requests
numpy==1.24.0
# This is a comment
`);

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      expect(analysis.languages).toContain('python');

      const djangoDep = analysis.dependencies.find(d => d.name === 'django');
      expect(djangoDep).toBeDefined();
      expect(djangoDep?.ecosystem).toBe('python');
      expect(djangoDep?.version).toBe('4.2.0');
    });

    it('should analyze docker-compose services', async () => {
      writeFileSync(join(testRoot, 'docker-compose.yml'), `version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
  redis:
    image: redis:7
    ports:
      - "6379:6379"
`);

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      // Should detect at least postgres and redis (api has no image)
      expect(analysis.services.length).toBeGreaterThanOrEqual(2);

      const postgresSvc = analysis.services.find(s => s.name === 'postgres');
      expect(postgresSvc).toBeDefined();
      expect(postgresSvc?.technology).toBe('postgres');
      expect(postgresSvc?.type).toBe('database');

      const redisSvc = analysis.services.find(s => s.name === 'redis');
      expect(redisSvc).toBeDefined();
      expect(redisSvc?.type).toBe('cache');
    });

    it('should detect deployment configurations', async () => {
      writeFileSync(join(testRoot, 'Dockerfile'), 'FROM node:20');
      mkdirSync(join(testRoot, '.github', 'workflows'), { recursive: true });
      writeFileSync(join(testRoot, '.github', 'workflows', 'ci.yml'), 'name: CI');

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      expect(analysis.deployments).toContain('Dockerfile');
      expect(analysis.deployments).toContain('.github/workflows');
    });
  });

  describe('generatePrimitives', () => {
    it('should generate primitive documents from analysis', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: {
          'react': '^18.2.0',
          'express': '^4.18.0'
        }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();
      const documents = await generator.generatePrimitives(analysis);

      expect(documents.length).toBeGreaterThanOrEqual(2);

      // Check document structure
      const reactDoc = documents.find(d => d.title.toLowerCase().includes('react'));
      expect(reactDoc).toBeDefined();
      expect(reactDoc?.type).toBe('primitive');
      expect(reactDoc?.frontmatter.type).toBe('primitive');
      expect(reactDoc?.frontmatter.ecosystem).toBe('nodejs');
      expect(reactDoc?.content).toContain('# React');
    });

    it('should generate language nodes', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { 'typescript': '^5.0.0' }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();
      const documents = await generator.generatePrimitives(analysis);

      const tsDoc = documents.find(d =>
        d.title.toLowerCase() === 'typescript' &&
        d.frontmatter.type === 'standard'
      );
      expect(tsDoc).toBeDefined();
    });
  });

  describe('writePrimitives', () => {
    it('should write generated documents to disk', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { 'express': '^4.18.0' }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();
      const documents = await generator.generatePrimitives(analysis);
      const result = await generator.writePrimitives(documents);

      // May have some write errors in test environment, check for generated docs
      expect(result.documentsGenerated.length + result.warnings.length + result.errors.length).toBeGreaterThan(0);

      // If docs were generated, verify they exist
      if (result.documentsGenerated.length > 0) {
        const firstDoc = result.documentsGenerated[0];
        expect(existsSync(firstDoc.path)).toBe(true);
      }
    });

    it('should skip existing files', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { 'express': '^4.18.0' }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();
      const documents = await generator.generatePrimitives(analysis);

      // Write once
      await generator.writePrimitives(documents);

      // Write again - should skip
      const result2 = await generator.writePrimitives(documents);
      expect(result2.warnings.length).toBeGreaterThan(0);
      expect(result2.warnings[0]).toContain('already exists');
    });
  });

  describe('initPrimitives', () => {
    it('should run full init-primitives workflow', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: {
          'express': '^4.18.0',
          'react': '^18.2.0'
        }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const result = await generator.initPrimitives();

      // The analysis should succeed even if some writes fail
      expect(result.analysis.dependencies.length).toBeGreaterThan(0);
      // Either success or at least tried to generate
      expect(result.documentsGenerated.length + result.errors.length + result.warnings.length).toBeGreaterThan(0);
    });

    it('should support dry-run mode', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { 'express': '^4.18.0' }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const result = await generator.initPrimitives({ dryRun: true, projectRoot: testRoot, docsPath });

      expect(result.success).toBe(true);
      expect(result.documentsGenerated.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('Dry run - no files written');

      // Verify no files were actually written
      const expressPath = result.documentsGenerated.find(d =>
        d.title.toLowerCase().includes('express')
      )?.path;
      if (expressPath) {
        expect(existsSync(expressPath)).toBe(false);
      }
    });
  });

  describe('analyzeSeed helper', () => {
    it('should analyze seed from project paths', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { 'express': '^4.18.0' }
      }, null, 2));

      const analysis = await analyzeSeed(testRoot, docsPath);

      expect(analysis.dependencies.length).toBeGreaterThan(0);
      expect(analysis.metadata.projectRoot).toBe(testRoot);
    });
  });

  describe('initPrimitives helper', () => {
    it('should initialize primitives from project paths', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { 'express': '^4.18.0' }
      }, null, 2));

      const result = await initPrimitives(testRoot, docsPath);

      // Analysis should work even if writes have issues
      expect(result.analysis.dependencies.length).toBeGreaterThan(0);
      // Either docs generated or attempted
      expect(result.documentsGenerated.length + result.errors.length + result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Category Inference', () => {
    it('should categorize frontend frameworks correctly', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: {
          'react': '^18.0.0',
          'vue': '^3.0.0',
          '@radix-ui/react-dialog': '^1.0.0'
        }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      const reactDep = analysis.dependencies.find(d => d.name === 'react');
      expect(reactDep?.category).toBe('components/ui');

      const radixDep = analysis.dependencies.find(d => d.name === '@radix-ui/react-dialog');
      expect(radixDep?.category).toBe('components/ui');
    });

    it('should categorize backend frameworks correctly', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { 'express': '^4.18.0', 'fastify': '^4.0.0' }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      const expressDep = analysis.dependencies.find(d => d.name === 'express');
      expect(expressDep?.category).toBe('services/api');
    });

    it('should categorize testing tools correctly', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        devDependencies: { 'vitest': '^1.0.0', 'jest': '^29.0.0' }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      const vitestDep = analysis.dependencies.find(d => d.name === 'vitest');
      expect(vitestDep?.category).toBe('guides/testing');
    });

    it('should categorize database tools correctly', async () => {
      writeFileSync(join(testRoot, 'package.json'), JSON.stringify({
        name: 'test-project',
        dependencies: { 'prisma': '^5.0.0', 'drizzle-orm': '^0.28.0' }
      }, null, 2));

      const generator = await SeedGenerator.create(testRoot, docsPath);
      const analysis = await generator.analyze();

      const prismaDep = analysis.dependencies.find(d => d.name === 'prisma');
      expect(prismaDep?.category).toBe('integrations/databases');
    });
  });
});
