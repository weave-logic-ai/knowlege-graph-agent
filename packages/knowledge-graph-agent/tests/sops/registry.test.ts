/**
 * SOP Registry Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getSOPById,
  getSOPsByCategory,
  getSOPsRequiringIRB,
  searchSOPs,
  getAllSOPs,
  getSopCount,
  getCategories,
} from '../../src/sops/registry.js';
import { SOPCategory, SOPPriority } from '../../src/sops/types.js';

describe('SOP Registry', () => {
  describe('getAllSOPs', () => {
    it('should return all registered SOPs', () => {
      const sops = getAllSOPs();
      expect(sops.length).toBeGreaterThan(0);
      expect(getSopCount()).toBe(sops.length);
    });

    it('should return SOPs with valid structure', () => {
      const sops = getAllSOPs();
      for (const sop of sops) {
        expect(sop.id).toBeDefined();
        expect(sop.number).toBeGreaterThan(0);
        expect(sop.title).toBeDefined();
        expect(sop.description).toBeDefined();
        expect(Object.values(SOPCategory)).toContain(sop.category);
        expect(Object.values(SOPPriority)).toContain(sop.priority);
        expect(Array.isArray(sop.requirements)).toBe(true);
        expect(Array.isArray(sop.checkpoints)).toBe(true);
        expect(Array.isArray(sop.tags)).toBe(true);
      }
    });
  });

  describe('getSOPById', () => {
    it('should return SOP by ID', () => {
      const sop = getSOPById('SOP-1200-01-AI');
      expect(sop).toBeDefined();
      expect(sop?.id).toBe('SOP-1200-01-AI');
      expect(sop?.title).toContain('Development');
    });

    it('should return undefined for non-existent ID', () => {
      const sop = getSOPById('non-existent');
      expect(sop).toBeUndefined();
    });
  });

  describe('getSOPsByCategory', () => {
    it('should return SOPs by category', () => {
      const devSOPs = getSOPsByCategory(SOPCategory.DEVELOPMENT);
      expect(devSOPs.length).toBeGreaterThan(0);
      for (const sop of devSOPs) {
        expect(sop.category).toBe(SOPCategory.DEVELOPMENT);
      }
    });

    it('should return SOPs for all categories', () => {
      for (const category of Object.values(SOPCategory)) {
        const sops = getSOPsByCategory(category);
        expect(Array.isArray(sops)).toBe(true);
      }
    });
  });

  describe('getSOPsRequiringIRB', () => {
    it('should return SOPs requiring AI-IRB review', () => {
      const irbSOPs = getSOPsRequiringIRB();
      expect(irbSOPs.length).toBeGreaterThan(0);
      for (const sop of irbSOPs) {
        expect(sop.irbTypicallyRequired).toBe(true);
      }
    });
  });

  describe('searchSOPs', () => {
    it('should search SOPs by keyword', () => {
      const results = searchSOPs('testing');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search in title and description', () => {
      const results = searchSOPs('quality');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search in tags', () => {
      const results = searchSOPs('security');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for no matches', () => {
      const results = searchSOPs('xyznonexistent123');
      expect(results.length).toBe(0);
    });
  });

  describe('getCategories', () => {
    it('should return all categories with SOPs', () => {
      const categories = getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain(SOPCategory.DEVELOPMENT);
      expect(categories).toContain(SOPCategory.GOVERNANCE);
    });
  });

  describe('SOP Requirements', () => {
    it('should have valid requirement structure', () => {
      const sop = getSOPById('SOP-1200-01-AI');
      expect(sop?.requirements.length).toBeGreaterThan(0);

      for (const req of sop?.requirements || []) {
        expect(req.id).toBeDefined();
        expect(req.description).toBeDefined();
        expect(typeof req.mandatory).toBe('boolean');
        expect(['document', 'test', 'review', 'audit', 'automated']).toContain(req.verification);
        expect(Array.isArray(req.evidence)).toBe(true);
      }
    });
  });

  describe('SOP Checkpoints', () => {
    it('should have valid checkpoint structure', () => {
      const sop = getSOPById('SOP-1200-01-AI');
      expect(sop?.checkpoints.length).toBeGreaterThan(0);

      for (const cp of sop?.checkpoints || []) {
        expect(cp.id).toBeDefined();
        expect(cp.name).toBeDefined();
        expect(['phase-start', 'phase-end', 'milestone', 'continuous', 'scheduled']).toContain(cp.trigger);
        expect(Array.isArray(cp.requirements)).toBe(true);
        expect(typeof cp.irbRequired).toBe('boolean');
        expect(Array.isArray(cp.approvers)).toBe(true);
      }
    });
  });
});
