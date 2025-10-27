/**
 * Vault Writer Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeVault } from '../../src/vault-init/writer/vault-writer.js';
import { writeMarkdownFile, validateMarkdownContent } from '../../src/vault-init/writer/markdown-writer.js';
import { generateVaultReadme } from '../../src/vault-init/writer/readme-generator.js';
import { generateConceptMap } from '../../src/vault-init/writer/concept-map-generator.js';
import type { GeneratedNode } from '../../src/vault-init/types.js';
import { existsSync } from 'fs';
import { readFile, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const TEST_VAULT_PATH = join(tmpdir(), `test-vault-${Date.now()}`);

// Sample nodes for testing
const sampleNodes: GeneratedNode[] = [
  {
    id: 'node-1',
    title: 'Neural Networks',
    type: 'concept',
    filename: 'neural-networks',
    content: `---
title: Neural Networks
type: concept
tags:
  - ai
  - ml
---

# Neural Networks

A neural network is a computational model inspired by biological neural networks.

## Key Concepts

- Neurons
- Layers
- Activation functions

[[backpropagation|Backpropagation]] is a key training algorithm.
`,
    tags: ['ai', 'ml'],
    links: [{ target: 'backpropagation', type: 'wikilink' }],
  },
  {
    id: 'node-2',
    title: 'Backpropagation',
    type: 'technical',
    filename: 'backpropagation',
    content: `---
title: Backpropagation
type: technical
tags:
  - algorithm
  - training
---

# Backpropagation

Technical specification for the backpropagation algorithm.
`,
    tags: ['algorithm', 'training'],
    links: [],
  },
  {
    id: 'node-3',
    title: 'Image Classification',
    type: 'feature',
    filename: 'image-classification',
    content: `---
title: Image Classification
type: feature
tags:
  - vision
  - classification
---

# Image Classification

Feature for classifying images using neural networks.
`,
    tags: ['vision', 'classification'],
    links: [{ target: 'neural-networks', type: 'wikilink' }],
  },
];

describe('Vault Writer', () => {
  beforeEach(async () => {
    // Clean up any existing test vault
    if (existsSync(TEST_VAULT_PATH)) {
      await rm(TEST_VAULT_PATH, { recursive: true, force: true });
    }
  });

  afterEach(async () => {
    // Clean up test vault
    if (existsSync(TEST_VAULT_PATH)) {
      await rm(TEST_VAULT_PATH, { recursive: true, force: true });
    }
  });

  describe('writeVault', () => {
    it('should create vault structure', async () => {
      const result = await writeVault(sampleNodes, {
        outputPath: TEST_VAULT_PATH,
      });

      expect(result.vaultPath).toBe(TEST_VAULT_PATH);
      expect(result.nodesGenerated).toBe(3);
      expect(result.errors).toHaveLength(0);
      expect(result.filesCreated.length).toBeGreaterThan(0);

      // Check directories exist
      expect(existsSync(join(TEST_VAULT_PATH, 'concepts'))).toBe(true);
      expect(existsSync(join(TEST_VAULT_PATH, 'technical'))).toBe(true);
      expect(existsSync(join(TEST_VAULT_PATH, 'features'))).toBe(true);
    });

    it('should write node files in correct directories', async () => {
      await writeVault(sampleNodes, {
        outputPath: TEST_VAULT_PATH,
      });

      // Check files exist
      expect(existsSync(join(TEST_VAULT_PATH, 'concepts', 'neural-networks.md'))).toBe(true);
      expect(existsSync(join(TEST_VAULT_PATH, 'technical', 'backpropagation.md'))).toBe(true);
      expect(existsSync(join(TEST_VAULT_PATH, 'features', 'image-classification.md'))).toBe(true);
    });

    it('should generate README.md', async () => {
      await writeVault(sampleNodes, {
        outputPath: TEST_VAULT_PATH,
      });

      const readmePath = join(TEST_VAULT_PATH, 'README.md');
      expect(existsSync(readmePath)).toBe(true);

      const content = await readFile(readmePath, 'utf-8');
      expect(content).toContain('# Knowledge Vault');
      expect(content).toContain('**Total Nodes**: 3');
      expect(content).toContain('**Concepts**: 1');
    });

    it('should generate concept-map.md', async () => {
      await writeVault(sampleNodes, {
        outputPath: TEST_VAULT_PATH,
      });

      const conceptMapPath = join(TEST_VAULT_PATH, 'concept-map.md');
      expect(existsSync(conceptMapPath)).toBe(true);

      const content = await readFile(conceptMapPath, 'utf-8');
      expect(content).toContain('# Concept Map');
      expect(content).toContain('```mermaid');
    });

    it('should support dry-run mode', async () => {
      const result = await writeVault(sampleNodes, {
        outputPath: TEST_VAULT_PATH,
        dryRun: true,
      });

      expect(result.dryRun).toBe(true);
      expect(result.filesCreated.length).toBeGreaterThan(0);

      // Vault should not exist
      expect(existsSync(TEST_VAULT_PATH)).toBe(false);
    });

    it('should fail if vault exists without overwrite', async () => {
      // Create vault first
      await writeVault(sampleNodes, {
        outputPath: TEST_VAULT_PATH,
      });

      // Try to create again without overwrite
      await expect(
        writeVault(sampleNodes, {
          outputPath: TEST_VAULT_PATH,
          overwrite: false,
        })
      ).rejects.toThrow('Vault already exists');
    });

    it('should overwrite existing vault with overwrite option', async () => {
      // Create vault first
      await writeVault(sampleNodes, {
        outputPath: TEST_VAULT_PATH,
      });

      // Create again with overwrite
      const result = await writeVault(sampleNodes, {
        outputPath: TEST_VAULT_PATH,
        overwrite: true,
      });

      expect(result.nodesGenerated).toBe(3);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Markdown Writer', () => {
    const testFilePath = join(TEST_VAULT_PATH, 'test.md');

    beforeEach(async () => {
      await mkdir(TEST_VAULT_PATH, { recursive: true });
    });

    it('should write markdown file atomically', async () => {
      const content = '# Test\n\nThis is a test file.';
      await writeMarkdownFile(testFilePath, content);

      expect(existsSync(testFilePath)).toBe(true);

      const written = await readFile(testFilePath, 'utf-8');
      expect(written).toBe(content);
    });

    it('should validate markdown content', () => {
      const validContent = '# Valid\n\nThis is valid.';
      const result = validateMarkdownContent(validContent);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject too short content', () => {
      const shortContent = 'short';
      const result = validateMarkdownContent(shortContent);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content too short (minimum 10 characters)');
    });

    it('should reject invalid frontmatter', () => {
      const invalidFrontmatter = '---\ntitle: Test\n\n# Missing closing';
      const result = validateMarkdownContent(invalidFrontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Frontmatter not properly closed');
    });
  });

  describe('README Generator', () => {
    it('should generate vault README', async () => {
      await mkdir(TEST_VAULT_PATH, { recursive: true });

      const readmePath = await generateVaultReadme(sampleNodes, TEST_VAULT_PATH);

      expect(existsSync(readmePath)).toBe(true);

      const content = await readFile(readmePath, 'utf-8');
      expect(content).toContain('# Knowledge Vault');
      expect(content).toContain('**Total Nodes**: 3');
      expect(content).toContain('**Concepts**: 1');
      expect(content).toContain('**Technical Specs**: 1');
      expect(content).toContain('**Features**: 1');
    });
  });

  describe('Concept Map Generator', () => {
    it('should generate concept map with Mermaid', async () => {
      await mkdir(TEST_VAULT_PATH, { recursive: true });

      const conceptMapPath = await generateConceptMap(sampleNodes, TEST_VAULT_PATH);

      expect(existsSync(conceptMapPath)).toBe(true);

      const content = await readFile(conceptMapPath, 'utf-8');
      expect(content).toContain('# Concept Map');
      expect(content).toContain('```mermaid');
      expect(content).toContain('graph TD');
      expect(content).toContain('classDef concept');
    });
  });
});
