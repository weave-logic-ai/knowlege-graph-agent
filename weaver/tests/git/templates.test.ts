/**
 * Tests for Template System
 */

import { describe, it, expect } from 'vitest';
import {
  renderTemplate,
  createContextFromDiff,
  simpleRender,
  validateTemplate,
  getBuiltInTemplate,
  type TemplateContext
} from '../../src/git/templates.js';
import type { DiffAnalysis } from '../../src/git/diff-analyzer.js';

describe('templates', () => {
  describe('renderTemplate', () => {
    it('should replace simple variables', () => {
      const template = '{{type}}: {{subject}}';
      const context: TemplateContext = {
        type: 'feat',
        subject: 'add feature'
      };

      const result = renderTemplate(template, context);
      expect(result).toBe('feat: add feature');
    });

    it('should handle missing variables', () => {
      const template = '{{type}}: {{subject}} {{missing}}';
      const context: TemplateContext = {
        type: 'feat',
        subject: 'add feature'
      };

      const result = renderTemplate(template, context);
      expect(result).toBe('feat: add feature');
      expect(result).not.toContain('{{missing}}');
    });

    it('should handle whitespace in variable names', () => {
      const template = '{{ type }}: {{ subject }}';
      const context: TemplateContext = {
        type: 'feat',
        subject: 'add feature'
      };

      const result = renderTemplate(template, context);
      expect(result).toBe('feat: add feature');
    });

    it('should clean up extra whitespace', () => {
      const template = '{{type}}: {{subject}}\n\n\n\n{{body}}';
      const context: TemplateContext = {
        type: 'feat',
        subject: 'add feature',
        body: 'Details here'
      };

      const result = renderTemplate(template, context);
      expect(result).not.toContain('\n\n\n');
    });
  });

  describe('createContextFromDiff', () => {
    it('should create context from diff analysis', () => {
      const analysis: DiffAnalysis = {
        files: [
          { path: 'src/file.ts', status: 'modified', insertions: 10, deletions: 5 }
        ],
        stats: {
          filesChanged: 1,
          insertions: 10,
          deletions: 5
        },
        suggestedType: 'feat',
        suggestedScope: 'core',
        hasBreakingChanges: false,
        breakingChangeIndicators: []
      };

      const context = createContextFromDiff(analysis);

      expect(context.type).toBe('feat');
      expect(context.scope).toBe('core');
      expect(context.filesChanged).toBe(1);
      expect(context.insertions).toBe(10);
      expect(context.deletions).toBe(5);
      expect(context.files).toEqual(['src/file.ts']);
    });

    it('should merge additional context', () => {
      const analysis: DiffAnalysis = {
        files: [],
        stats: { filesChanged: 0, insertions: 0, deletions: 0 },
        suggestedType: 'feat',
        hasBreakingChanges: false,
        breakingChangeIndicators: []
      };

      const context = createContextFromDiff(analysis, {
        author: 'John Doe',
        branch: 'feature-branch'
      });

      expect(context.author).toBe('John Doe');
      expect(context.branch).toBe('feature-branch');
    });
  });

  describe('simpleRender', () => {
    it('should render simple template', () => {
      const template = 'Type: {{type}}, Subject: {{subject}}';
      const context: TemplateContext = {
        type: 'feat',
        subject: 'new feature'
      };

      const result = simpleRender(template, context);
      expect(result).toBe('Type: feat, Subject: new feature');
    });

    it('should render array variables', () => {
      const template = 'Files:\n{{files}}';
      const context: TemplateContext = {
        type: 'feat',
        files: ['file1.ts', 'file2.ts']
      };

      const result = simpleRender(template, context);
      expect(result).toContain('- file1.ts');
      expect(result).toContain('- file2.ts');
    });

    it('should handle undefined values', () => {
      const template = '{{type}}: {{scope}}';
      const context: TemplateContext = {
        type: 'feat',
        scope: undefined
      };

      const result = simpleRender(template, context);
      expect(result).toContain('{{scope}}'); // Unreplaced
    });
  });

  describe('validateTemplate', () => {
    it('should validate correct template', () => {
      const template = '{{type}}: {{subject}}';
      const { valid, errors } = validateTemplate(template);

      expect(valid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should require type variable', () => {
      const template = '{{subject}}';
      const { valid, errors } = validateTemplate(template);

      expect(valid).toBe(false);
      expect(errors).toContain('Template must include {{type}} variable');
    });

    it('should require subject variable', () => {
      const template = '{{type}}';
      const { valid, errors } = validateTemplate(template);

      expect(valid).toBe(false);
      expect(errors).toContain('Template must include {{subject}} variable');
    });

    it('should detect unmatched braces', () => {
      const template = '{{type}: {{subject}}';
      const { valid, errors } = validateTemplate(template);

      expect(valid).toBe(false);
      expect(errors).toContain('Template has unmatched braces');
    });

    it('should warn about unknown variables', () => {
      const template = '{{type}}: {{subject}} {{unknown}}';
      const { warnings } = validateTemplate(template);

      expect(warnings.some(w => w.includes('unknown'))).toBe(true);
    });
  });

  describe('getBuiltInTemplate', () => {
    it('should return default template', () => {
      const template = getBuiltInTemplate('default');
      expect(template).toContain('{{type}}');
      expect(template).toContain('{{subject}}');
    });

    it('should return detailed template', () => {
      const template = getBuiltInTemplate('detailed');
      expect(template).toContain('{{files}}');
      expect(template).toContain('{{filesChanged}}');
    });

    it('should return simple template', () => {
      const template = getBuiltInTemplate('simple');
      expect(template).toBe('{{type}}: {{subject}}');
    });

    it('should throw for unknown template', () => {
      expect(() => getBuiltInTemplate('unknown')).toThrow();
    });
  });
});
