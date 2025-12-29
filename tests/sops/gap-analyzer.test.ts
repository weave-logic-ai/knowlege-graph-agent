/**
 * Gap Analyzer Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { checkCompliance } from '../../src/sops/compliance-checker.js';
import {
  analyzeGaps,
  getGapsForSOP,
  getQuickWins,
  calculateProgress,
} from '../../src/sops/gap-analyzer.js';
import { SOPCategory, SOPPriority } from '../../src/sops/types.js';

describe('GapAnalyzer', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `kg-gap-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('analyzeGaps', () => {
    it('should analyze gaps from compliance check', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult);

      expect(gapResult.totalGaps).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(gapResult.gaps)).toBe(true);
      expect(gapResult.byPriority).toBeDefined();
      expect(gapResult.byCategory).toBeDefined();
      expect(gapResult.summary).toBeDefined();
    });

    it('should group gaps by priority', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult);

      expect(Array.isArray(gapResult.byPriority[SOPPriority.CRITICAL])).toBe(true);
      expect(Array.isArray(gapResult.byPriority[SOPPriority.HIGH])).toBe(true);
      expect(Array.isArray(gapResult.byPriority[SOPPriority.MEDIUM])).toBe(true);
      expect(Array.isArray(gapResult.byPriority[SOPPriority.LOW])).toBe(true);
    });

    it('should group gaps by category', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult);

      for (const category of Object.values(SOPCategory)) {
        expect(Array.isArray(gapResult.byCategory[category])).toBe(true);
      }
    });

    it('should identify critical gaps', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult);

      expect(Array.isArray(gapResult.criticalGaps)).toBe(true);
      for (const gap of gapResult.criticalGaps) {
        expect(gap.priority).toBe(SOPPriority.CRITICAL);
      }
    });

    it('should filter by minimum priority', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult, {
        minPriority: SOPPriority.HIGH,
      });

      for (const gap of gapResult.gaps) {
        expect([SOPPriority.CRITICAL, SOPPriority.HIGH]).toContain(gap.priority);
      }
    });

    it('should filter by category', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult, {
        categories: [SOPCategory.DEVELOPMENT],
      });

      // All gaps should be from development SOPs
      for (const gap of gapResult.gaps) {
        expect(gap.sopId).toMatch(/SOP-1[12]\d{2}/);
      }
    });

    it('should generate remediation roadmap', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult, {
        generateRemediation: true,
      });

      expect(gapResult.roadmap).toBeDefined();
      expect(Array.isArray(gapResult.roadmap?.phases)).toBe(true);
      expect(Array.isArray(gapResult.roadmap?.quickWins)).toBe(true);
      expect(Array.isArray(gapResult.roadmap?.dependencies)).toBe(true);
    });

    it('should calculate summary statistics', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult);

      expect(gapResult.summary.totalRequirements).toBeGreaterThan(0);
      expect(typeof gapResult.summary.requirementsMet).toBe('number');
      expect(typeof gapResult.summary.requirementsGaps).toBe('number');
      expect(typeof gapResult.summary.compliancePercentage).toBe('number');
      expect(['low', 'medium', 'high']).toContain(gapResult.summary.overallComplexity);
    });
  });

  describe('getGapsForSOP', () => {
    it('should filter gaps for specific SOP', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult);
      const sopGaps = getGapsForSOP(gapResult, 'SOP-1200-01-AI');

      for (const gap of sopGaps) {
        expect(gap.sopId).toBe('SOP-1200-01-AI');
      }
    });
  });

  describe('getQuickWins', () => {
    it('should return quick wins from roadmap', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult, {
        generateRemediation: true,
      });

      const quickWins = getQuickWins(gapResult);
      expect(Array.isArray(quickWins)).toBe(true);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress statistics', () => {
      const gaps = [
        { id: '1', status: 'open' as const, sopId: '', requirementId: '', description: '', priority: SOPPriority.HIGH, impact: '', remediation: '', effort: 'low' as const, createdAt: new Date() },
        { id: '2', status: 'in-progress' as const, sopId: '', requirementId: '', description: '', priority: SOPPriority.MEDIUM, impact: '', remediation: '', effort: 'medium' as const, createdAt: new Date() },
        { id: '3', status: 'resolved' as const, sopId: '', requirementId: '', description: '', priority: SOPPriority.LOW, impact: '', remediation: '', effort: 'low' as const, createdAt: new Date(), resolvedAt: new Date() },
      ];

      const progress = calculateProgress(gaps);

      expect(progress.total).toBe(3);
      expect(progress.open).toBe(1);
      expect(progress.inProgress).toBe(1);
      expect(progress.resolved).toBe(1);
      expect(progress.percentage).toBe(33);
    });

    it('should handle empty gaps', () => {
      const progress = calculateProgress([]);

      expect(progress.total).toBe(0);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('Gap Structure', () => {
    it('should create gaps with valid structure', async () => {
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      const gapResult = analyzeGaps(checkResult);

      for (const gap of gapResult.gaps) {
        expect(gap.id).toBeDefined();
        expect(gap.sopId).toBeDefined();
        expect(gap.requirementId).toBeDefined();
        expect(gap.description).toBeDefined();
        expect(Object.values(SOPPriority)).toContain(gap.priority);
        expect(gap.impact).toBeDefined();
        expect(gap.remediation).toBeDefined();
        expect(['low', 'medium', 'high']).toContain(gap.effort);
        expect(['open', 'in-progress', 'resolved', 'accepted-risk']).toContain(gap.status);
        expect(gap.createdAt).toBeInstanceOf(Date);
      }
    });
  });
});
