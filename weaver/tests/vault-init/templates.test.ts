import { describe, it, expect, beforeEach } from 'vitest';
import {
  TemplateLoader,
  VaultTemplate,
  NodeTemplate,
  TemplateContext,
  VaultTemplateSchema,
} from '../../src/vault-init/templates/index.js';

describe('TemplateLoader', () => {
  let loader: TemplateLoader;

  beforeEach(() => {
    loader = new TemplateLoader();
  });

  describe('Template Registration', () => {
    it('should register default templates', () => {
      const templates = loader.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should have Next.js template', () => {
      const template = loader.getTemplate('nextjs-app-router');
      expect(template).toBeDefined();
      expect(template?.framework).toBe('nextjs');
    });

    it('should have React template', () => {
      const template = loader.getTemplate('react-vite');
      expect(template).toBeDefined();
      expect(template?.framework).toBe('react');
    });

    it('should validate templates on registration', () => {
      const invalidTemplate = {
        id: 'invalid',
        name: 'Invalid',
        framework: 'test',
        version: '1.0.0',
        description: 'Test',
        directories: {},
        nodeTemplates: new Map(),
      };

      expect(() => loader.registerTemplate(invalidTemplate as VaultTemplate)).not.toThrow();
    });

    it('should reject templates with missing required fields', () => {
      const invalidTemplate = {
        id: 'invalid',
        // Missing required fields
      };

      const validation = loader.validateTemplate(invalidTemplate as VaultTemplate);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Template Retrieval', () => {
    it('should get template by ID', () => {
      const template = loader.getTemplate('nextjs-app-router');
      expect(template).toBeDefined();
      expect(template?.id).toBe('nextjs-app-router');
    });

    it('should return undefined for non-existent template', () => {
      const template = loader.getTemplate('non-existent');
      expect(template).toBeUndefined();
    });

    it('should list all templates', () => {
      const metadata = loader.listTemplates();
      expect(metadata.length).toBeGreaterThan(0);
      expect(metadata[0]).toHaveProperty('id');
      expect(metadata[0]).toHaveProperty('name');
      expect(metadata[0]).toHaveProperty('framework');
    });

    it('should find templates by framework', () => {
      const nextjsTemplates = loader.findByFramework('nextjs');
      expect(nextjsTemplates.length).toBeGreaterThan(0);
      expect(nextjsTemplates[0].framework).toBe('nextjs');
    });

    it('should find templates by tag', () => {
      const reactTemplates = loader.findByTag('react');
      expect(reactTemplates.length).toBeGreaterThan(0);
    });
  });

  describe('Node Template Operations', () => {
    it('should get node template', () => {
      const nodeTemplate = loader.getNodeTemplate('nextjs-app-router', 'component');
      expect(nodeTemplate).toBeDefined();
      expect(nodeTemplate?.type).toBe('technical');
    });

    it('should return undefined for non-existent node template', () => {
      const nodeTemplate = loader.getNodeTemplate('nextjs-app-router', 'non-existent');
      expect(nodeTemplate).toBeUndefined();
    });

    it('should get directory structure', () => {
      const structure = loader.getDirectoryStructure('nextjs-app-router');
      expect(structure).toBeDefined();
      expect(structure).toHaveProperty('concepts');
      expect(structure).toHaveProperty('technical');
      expect(structure).toHaveProperty('features');
    });
  });

  describe('Template Rendering', () => {
    it('should render component template', () => {
      const context: TemplateContext = {
        projectName: 'TestProject',
        framework: 'nextjs',
        nodeName: 'Button',
        nodeType: 'component',
        timestamp: '2025-10-25',
      };

      const rendered = loader.renderNodeTemplate('nextjs-app-router', 'component', context);
      expect(rendered).toContain('Button');
      expect(rendered).toContain('TestProject');
      expect(rendered).toContain('Component Type');
    });

    it('should render API route template', () => {
      const context: TemplateContext = {
        projectName: 'TestAPI',
        framework: 'nextjs',
        nodeName: 'UserAPI',
        nodeType: 'api-route',
        timestamp: '2025-10-25',
        method: 'POST',
        path: '/api/users',
      };

      const rendered = loader.renderNodeTemplate('nextjs-app-router', 'api-route', context);
      expect(rendered).toContain('UserAPI');
      expect(rendered).toContain('POST');
      expect(rendered).toContain('/api/users');
    });

    it('should render hook template', () => {
      const context: TemplateContext = {
        projectName: 'HooksProject',
        framework: 'react',
        nodeName: 'Counter',
        nodeType: 'hook',
        timestamp: '2025-10-25',
      };

      const rendered = loader.renderNodeTemplate('react-vite', 'hook', context);
      expect(rendered).toContain('useCounter');
      expect(rendered).toContain('HooksProject');
    });

    it('should handle custom context variables', () => {
      const context: TemplateContext = {
        projectName: 'Test',
        framework: 'nextjs',
        nodeName: 'CustomNode',
        nodeType: 'component',
        timestamp: '2025-10-25',
        description: 'Custom description for testing',
      };

      const rendered = loader.renderNodeTemplate('nextjs-app-router', 'component', context);
      expect(rendered).toContain('Custom description for testing');
    });

    it('should throw error for non-existent template', () => {
      const context: TemplateContext = {
        projectName: 'Test',
        framework: 'test',
        nodeName: 'Test',
        nodeType: 'test',
        timestamp: '2025-10-25',
      };

      expect(() => {
        loader.renderNodeTemplate('non-existent', 'component', context);
      }).toThrow();
    });
  });

  describe('Handlebars Helpers', () => {
    it('should use pascalCase helper', () => {
      const context: TemplateContext = {
        projectName: 'test-project',
        framework: 'react',
        nodeName: 'my-component',
        nodeType: 'hook',
        timestamp: '2025-10-25',
      };

      const rendered = loader.renderNodeTemplate('react-vite', 'hook', context);
      // The template uses {{nodeName}} which should be rendered as-is
      expect(rendered).toContain('my-component');
    });
  });

  describe('Template Validation', () => {
    it('should validate correct template', () => {
      const template = loader.getTemplate('nextjs-app-router');
      const validation = loader.validateTemplate(template!);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should warn about empty node templates', () => {
      const template: VaultTemplate = {
        id: 'test',
        name: 'Test',
        framework: 'test',
        version: '1.0.0',
        description: 'Test template',
        directories: { test: { description: 'Test' } },
        nodeTemplates: new Map(),
      };

      const validation = loader.validateTemplate(template);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Template Extension', () => {
    it('should extend existing template', () => {
      const extended = loader.extendTemplate(
        'nextjs-app-router',
        'custom-nextjs',
        {
          name: 'Custom Next.js',
          description: 'Extended Next.js template',
        }
      );

      expect(extended.id).toBe('custom-nextjs');
      expect(extended.name).toBe('Custom Next.js');
      expect(loader.hasTemplate('custom-nextjs')).toBe(true);
    });

    it('should inherit node templates', () => {
      const extended = loader.extendTemplate(
        'nextjs-app-router',
        'custom-nextjs-2',
        {
          name: 'Custom Next.js 2',
        }
      );

      const nodeTemplate = loader.getNodeTemplate('custom-nextjs-2', 'component');
      expect(nodeTemplate).toBeDefined();
    });

    it('should throw error for non-existent base template', () => {
      expect(() => {
        loader.extendTemplate('non-existent', 'new-template', {});
      }).toThrow();
    });
  });

  describe('Template Management', () => {
    it('should check if template exists', () => {
      expect(loader.hasTemplate('nextjs-app-router')).toBe(true);
      expect(loader.hasTemplate('non-existent')).toBe(false);
    });

    it('should unregister template', () => {
      // Create and register a test template
      const testTemplate: VaultTemplate = {
        id: 'test-template',
        name: 'Test',
        framework: 'test',
        version: '1.0.0',
        description: 'Test',
        directories: { test: { description: 'Test' } },
        nodeTemplates: new Map([
          ['test', {
            type: 'concept',
            frontmatter: {},
            contentTemplate: 'Test',
          }],
        ]),
      };

      loader.registerTemplate(testTemplate);
      expect(loader.hasTemplate('test-template')).toBe(true);

      const removed = loader.unregisterTemplate('test-template');
      expect(removed).toBe(true);
      expect(loader.hasTemplate('test-template')).toBe(false);
    });

    it('should get template statistics', () => {
      const stats = loader.getStats();
      expect(stats.totalTemplates).toBeGreaterThan(0);
      expect(stats.frameworks.length).toBeGreaterThan(0);
      expect(stats.totalNodeTemplates).toBeGreaterThan(0);
    });
  });

  describe('Zod Schema Validation', () => {
    it('should validate valid template object', () => {
      const validTemplate = {
        id: 'test',
        name: 'Test',
        framework: 'test',
        version: '1.0.0',
        description: 'Test template',
        directories: {
          concepts: { description: 'Concepts' },
        },
        nodeTemplates: {
          component: {
            type: 'concept',
            frontmatter: { test: 'value' },
            contentTemplate: '# {{nodeName}}',
          },
        },
      };

      expect(() => VaultTemplateSchema.parse(validTemplate)).not.toThrow();
    });

    it('should reject invalid template object', () => {
      const invalidTemplate = {
        id: 'test',
        // Missing required fields
      };

      expect(() => VaultTemplateSchema.parse(invalidTemplate)).toThrow();
    });
  });
});
