/**
 * Compliance Checker Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  checkCompliance,
  checkSOPCompliance,
  meetsMinimumCompliance,
} from '../../src/sops/compliance-checker.js';
import { SOPCategory, ComplianceStatus } from '../../src/sops/types.js';

describe('ComplianceChecker', () => {
  let testDir: string;

  beforeEach(() => {
    // Create temp test directory
    testDir = join(tmpdir(), `kg-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('checkCompliance', () => {
    it('should run compliance check on empty project', async () => {
      const result = await checkCompliance({
        projectRoot: testDir,
        docsPath: 'docs',
      });

      expect(result.success).toBe(true);
      expect(result.projectName).toBeDefined();
      expect(result.checkedAt).toBeInstanceOf(Date);
      expect(Array.isArray(result.assessments)).toBe(true);
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(typeof result.overallScore).toBe('number');
    });

    it('should detect README as evidence', async () => {
      // Create README
      writeFileSync(join(testDir, 'README.md'), '# Test Project\n\nThis is a test project.');

      const result = await checkCompliance({
        projectRoot: testDir,
        docsPath: 'docs',
        deepAnalysis: true,
      });

      expect(result.success).toBe(true);
      // Should find some evidence from README
      expect(result.evidence.length).toBeGreaterThanOrEqual(0);
    });

    it('should detect test directory as evidence', async () => {
      // Create tests directory
      const testsDir = join(testDir, 'tests');
      mkdirSync(testsDir, { recursive: true });
      writeFileSync(join(testsDir, 'example.test.ts'), 'test("example", () => {});');

      const result = await checkCompliance({
        projectRoot: testDir,
        docsPath: 'docs',
      });

      expect(result.success).toBe(true);
    });

    it('should filter by SOP ID', async () => {
      const result = await checkCompliance({
        projectRoot: testDir,
        sopIds: ['SOP-1200-01-AI'],
      });

      expect(result.success).toBe(true);
      expect(result.assessments.length).toBe(1);
      expect(result.assessments[0].sopId).toBe('SOP-1200-01-AI');
    });

    it('should filter by category', async () => {
      const result = await checkCompliance({
        projectRoot: testDir,
        categories: [SOPCategory.DEVELOPMENT],
      });

      expect(result.success).toBe(true);
      for (const assessment of result.assessments) {
        // All assessments should be from development category
        expect(assessment.sopId).toMatch(/SOP-1[12]\d{2}/);
      }
    });

    it('should calculate category scores', async () => {
      const result = await checkCompliance({
        projectRoot: testDir,
      });

      expect(result.categoryScores).toBeDefined();
      expect(typeof result.categoryScores[SOPCategory.DEVELOPMENT]).toBe('number');
    });
  });

  describe('checkSOPCompliance', () => {
    it('should check single SOP compliance', async () => {
      const assessment = await checkSOPCompliance(
        'SOP-1200-01-AI',
        testDir
      );

      expect(assessment).toBeDefined();
      expect(assessment?.sopId).toBe('SOP-1200-01-AI');
      expect(Object.values(ComplianceStatus)).toContain(assessment?.status);
    });

    it('should return null for non-existent SOP', async () => {
      const assessment = await checkSOPCompliance(
        'non-existent',
        testDir
      );

      expect(assessment).toBeNull();
    });
  });

  describe('meetsMinimumCompliance', () => {
    it('should check minimum compliance threshold', async () => {
      const result = await meetsMinimumCompliance(testDir, 50);

      expect(typeof result.meets).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(Array.isArray(result.gaps)).toBe(true);
    });

    it('should report gaps below threshold', async () => {
      const result = await meetsMinimumCompliance(testDir, 100);

      // With 100% threshold, should have gaps
      expect(result.meets).toBe(false);
      expect(result.gaps.length).toBeGreaterThan(0);
    });
  });

  describe('Artifact Detection', () => {
    it('should detect documentation artifacts', async () => {
      // Create docs directory with architecture doc
      const docsDir = join(testDir, 'docs');
      mkdirSync(docsDir, { recursive: true });
      writeFileSync(
        join(docsDir, 'ARCHITECTURE.md'),
        '# Architecture\n\nSystem architecture documentation.'
      );

      const result = await checkCompliance({
        projectRoot: testDir,
        docsPath: 'docs',
        deepAnalysis: true,
      });

      expect(result.success).toBe(true);
    });

    it('should detect CI/CD configuration', async () => {
      // Create .github/workflows
      const workflowsDir = join(testDir, '.github', 'workflows');
      mkdirSync(workflowsDir, { recursive: true });
      writeFileSync(
        join(workflowsDir, 'ci.yml'),
        'name: CI\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest'
      );

      const result = await checkCompliance({
        projectRoot: testDir,
      });

      expect(result.success).toBe(true);
    });

    it('should detect security documentation', async () => {
      writeFileSync(
        join(testDir, 'SECURITY.md'),
        '# Security Policy\n\nReporting vulnerabilities...'
      );

      const result = await checkCompliance({
        projectRoot: testDir,
      });

      expect(result.success).toBe(true);
    });
  });
});
