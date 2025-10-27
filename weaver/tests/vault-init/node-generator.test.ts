import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateNode,
  generateNodes,
  generateNodeWithDefaults,
} from '../../src/vault-init/generator/node-generator';
import type {
  NodeData,
  ProjectContext,
  NodeGenerationOptions,
} from '../../src/vault-init/generator/types';
import type { VaultTemplate } from '../../src/vault-init/templates/types';

describe('node-generator', () => {
  let mockTemplate: VaultTemplate;
  let mockNodeData: NodeData;
  let mockProjectContext: ProjectContext;

  beforeEach(() => {
    mockTemplate = {
      id: 'test-template',
      name: 'Test Template',
      framework: 'nextjs',
      version: '1.0.0',
      description: 'Template for testing',
      directories: {
        concepts: { description: 'Conceptual nodes' },
        technical: { description: 'Technical nodes' },
        features: { description: 'Feature nodes' },
      },
      nodeTemplates: new Map([
        [
          'concept',
          {
            type: 'concept',
            frontmatter: {},
            contentTemplate: `# {{name}}

## Description

{{description}}

## Content

{{content}}

**Framework:** {{framework}}
**Project:** {{projectName}}
`,
          },
        ],
        [
          'technical',
          {
            type: 'technical',
            frontmatter: {},
            contentTemplate: `# {{name}}

## Technical Details

{{content}}
`,
          },
        ],
        [
          'feature',
          {
            type: 'feature',
            frontmatter: {},
            contentTemplate: `# {{name}}

## Feature Description

{{description}}
`,
          },
        ],
      ]),
    };

    mockNodeData = {
      name: 'Test Node',
      type: 'concept',
      description: 'A test concept node',
      content: 'Detailed content about the concept',
      tags: ['testing', 'example'],
    };

    mockProjectContext = {
      projectName: 'Test Project',
      framework: 'nextjs',
      version: '1.0.0',
      author: 'Test Author',
      timestamp: new Date('2025-01-01T00:00:00.000Z'),
    };
  });

  describe('generateNode', () => {
    it('should generate a complete node', async () => {
      const node = await generateNode(
        mockNodeData,
        mockTemplate,
        mockProjectContext
      );

      expect(node).toBeDefined();
      expect(node.filename).toBe('Test-Node.md');
      expect(node.relativePath).toBe('concepts/Test-Node.md');
      expect(node.content).toContain('---');
      expect(node.content).toContain('# Test Node');
      expect(node.frontmatter.type).toBe('concept');
      expect(node.frontmatter.name).toBe('Test Node');
    });

    it('should include frontmatter in content', async () => {
      const node = await generateNode(
        mockNodeData,
        mockTemplate,
        mockProjectContext
      );

      expect(node.content).toContain('type: concept');
      expect(node.content).toContain('name: Test Node');
      expect(node.content).toContain('tags:');
      expect(node.content).toContain('- testing');
    });

    it('should render template with context', async () => {
      const node = await generateNode(
        mockNodeData,
        mockTemplate,
        mockProjectContext
      );

      expect(node.content).toContain('A test concept node');
      expect(node.content).toContain('Detailed content about the concept');
      expect(node.content).toContain('**Framework:** nextjs');
      expect(node.content).toContain('**Project:** Test Project');
    });

    it('should generate auto-links when enabled', async () => {
      const options: NodeGenerationOptions = {
        autoGenerateLinks: true,
      };

      const nodeWithLinks: NodeData = {
        ...mockNodeData,
        links: ['Related Node'],
      };

      const node = await generateNode(
        nodeWithLinks,
        mockTemplate,
        mockProjectContext,
        options
      );

      expect(node.content).toContain('## Links');
      expect(node.content).toContain('[[Related Node]]');
    });

    it('should not generate auto-links when disabled', async () => {
      const options: NodeGenerationOptions = {
        autoGenerateLinks: false,
      };

      const nodeWithLinks: NodeData = {
        ...mockNodeData,
        links: ['Related Node'],
      };

      const node = await generateNode(
        nodeWithLinks,
        mockTemplate,
        mockProjectContext,
        options
      );

      expect(node.content).not.toContain('## Links');
    });

    it('should include content prefix and suffix', async () => {
      const options: NodeGenerationOptions = {
        contentPrefix: '> Prefix content\n\n',
        contentSuffix: '\n\n---\nGenerated automatically',
      };

      const node = await generateNode(
        mockNodeData,
        mockTemplate,
        mockProjectContext,
        options
      );

      expect(node.content).toContain('> Prefix content');
      expect(node.content).toContain('Generated automatically');
    });

    it('should merge custom frontmatter', async () => {
      const options: NodeGenerationOptions = {
        customFrontmatter: {
          custom: 'value',
          priority: 'high',
        },
      };

      const node = await generateNode(
        mockNodeData,
        mockTemplate,
        mockProjectContext,
        options
      );

      expect(node.frontmatter.custom).toBe('value');
      expect(node.frontmatter.priority).toBe('high');
    });

    it('should throw error for missing template', async () => {
      const invalidNode: NodeData = {
        name: 'Invalid',
        type: 'concept',
      };

      const emptyTemplate: VaultTemplate = {
        ...mockTemplate,
        nodeTemplates: new Map(),
      };

      await expect(
        generateNode(invalidNode, emptyTemplate, mockProjectContext)
      ).rejects.toThrow('Template not found');
    });

    it('should validate node data', async () => {
      const invalidNode: any = {
        name: '',
        type: 'invalid-type',
      };

      await expect(
        generateNode(invalidNode, mockTemplate, mockProjectContext)
      ).rejects.toThrow();
    });

    it('should validate project context', async () => {
      const invalidContext: any = {
        projectName: '',
        framework: '',
      };

      await expect(
        generateNode(mockNodeData, mockTemplate, invalidContext)
      ).rejects.toThrow();
    });

    it('should handle different node types', async () => {
      const technicalNode: NodeData = {
        name: 'Technical Node',
        type: 'technical',
        content: 'Implementation details',
      };

      const node = await generateNode(
        technicalNode,
        mockTemplate,
        mockProjectContext
      );

      expect(node.relativePath).toBe('technical/Technical-Node.md');
      expect(node.frontmatter.type).toBe('technical');
      expect(node.content).toContain('## Technical Details');
    });

    it('should handle feature nodes', async () => {
      const featureNode: NodeData = {
        name: 'Feature Node',
        type: 'feature',
        description: 'Feature description',
      };

      const node = await generateNode(
        featureNode,
        mockTemplate,
        mockProjectContext
      );

      expect(node.relativePath).toBe('features/Feature-Node.md');
      expect(node.frontmatter.type).toBe('feature');
      expect(node.content).toContain('## Feature Description');
    });

    it('should use current timestamp when not provided', async () => {
      const contextWithoutTimestamp: ProjectContext = {
        projectName: 'Test',
        framework: 'nextjs',
      };

      const node = await generateNode(
        mockNodeData,
        mockTemplate,
        contextWithoutTimestamp
      );

      expect(node.frontmatter.created).toBeDefined();
      expect(new Date(node.frontmatter.created)).toBeInstanceOf(Date);
    });
  });

  describe('generateNodes', () => {
    it('should generate multiple nodes', async () => {
      const nodesData: NodeData[] = [
        { name: 'Node 1', type: 'concept' },
        { name: 'Node 2', type: 'technical' },
        { name: 'Node 3', type: 'feature' },
      ];

      const nodes = await generateNodes(
        nodesData,
        mockTemplate,
        mockProjectContext
      );

      expect(nodes).toHaveLength(3);
      expect(nodes[0].filename).toBe('Node-1.md');
      expect(nodes[1].filename).toBe('Node-2.md');
      expect(nodes[2].filename).toBe('Node-3.md');
    });

    it('should handle empty array', async () => {
      const nodes = await generateNodes([], mockTemplate, mockProjectContext);

      expect(nodes).toHaveLength(0);
    });

    it('should process nodes in parallel', async () => {
      const nodesData: NodeData[] = Array.from({ length: 10 }, (_, i) => ({
        name: `Node ${i}`,
        type: 'concept' as const,
      }));

      const startTime = Date.now();
      const nodes = await generateNodes(
        nodesData,
        mockTemplate,
        mockProjectContext
      );
      const duration = Date.now() - startTime;

      expect(nodes).toHaveLength(10);
      // Parallel execution should be faster than sequential
      // This is a weak test but validates batch processing
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('generateNodeWithDefaults', () => {
    it('should generate node with default template', async () => {
      const node = await generateNodeWithDefaults(
        mockNodeData,
        mockProjectContext
      );

      expect(node).toBeDefined();
      expect(node.filename).toBe('Test-Node.md');
      expect(node.content).toContain('# Test Node');
    });

    it('should work for all node types', async () => {
      const conceptNode = await generateNodeWithDefaults(
        { name: 'Concept', type: 'concept' },
        mockProjectContext
      );

      const technicalNode = await generateNodeWithDefaults(
        { name: 'Technical', type: 'technical' },
        mockProjectContext
      );

      const featureNode = await generateNodeWithDefaults(
        { name: 'Feature', type: 'feature' },
        mockProjectContext
      );

      expect(conceptNode.frontmatter.type).toBe('concept');
      expect(technicalNode.frontmatter.type).toBe('technical');
      expect(featureNode.frontmatter.type).toBe('feature');
    });

    it('should handle minimal node data', async () => {
      const minimalNode: NodeData = {
        name: 'Minimal',
        type: 'concept',
      };

      const node = await generateNodeWithDefaults(
        minimalNode,
        mockProjectContext
      );

      expect(node).toBeDefined();
      expect(node.content).toContain('# Minimal');
    });

    it('should include description when provided', async () => {
      const nodeWithDesc: NodeData = {
        name: 'Node',
        type: 'concept',
        description: 'Test description',
      };

      const node = await generateNodeWithDefaults(
        nodeWithDesc,
        mockProjectContext
      );

      expect(node.content).toContain('Test description');
    });

    it('should include content when provided', async () => {
      const nodeWithContent: NodeData = {
        name: 'Node',
        type: 'concept',
        content: 'Test content',
      };

      const node = await generateNodeWithDefaults(
        nodeWithContent,
        mockProjectContext
      );

      expect(node.content).toContain('Test content');
    });
  });

  describe('Handlebars helpers', () => {
    it('should support uppercase helper', async () => {
      const template: VaultTemplate = {
        ...mockTemplate,
        nodeTemplates: new Map([
          [
            'concept',
            {
              type: 'concept',
              frontmatter: {},
              contentTemplate: '{{uppercase name}}',
            },
          ],
        ]),
      };

      const node = await generateNode(
        { name: 'test', type: 'concept' },
        template,
        mockProjectContext
      );

      expect(node.content).toContain('TEST');
    });

    it('should support lowercase helper', async () => {
      const template: VaultTemplate = {
        ...mockTemplate,
        nodeTemplates: new Map([
          [
            'concept',
            {
              type: 'concept',
              frontmatter: {},
              contentTemplate: '{{lowercase name}}',
            },
          ],
        ]),
      };

      const node = await generateNode(
        { name: 'TEST', type: 'concept' },
        template,
        mockProjectContext
      );

      expect(node.content).toContain('test');
    });

    it('should support join helper', async () => {
      const template: VaultTemplate = {
        ...mockTemplate,
        nodeTemplates: new Map([
          [
            'concept',
            {
              type: 'concept',
              frontmatter: {},
              contentTemplate: '{{join tags ", "}}',
            },
          ],
        ]),
      };

      const node = await generateNode(
        { name: 'Test', type: 'concept', tags: ['tag1', 'tag2', 'tag3'] },
        template,
        mockProjectContext
      );

      expect(node.content).toContain('tag1, tag2, tag3');
    });

    it('should support bulletList helper', async () => {
      const template: VaultTemplate = {
        ...mockTemplate,
        nodeTemplates: new Map([
          [
            'concept',
            {
              type: 'concept',
              frontmatter: {},
              contentTemplate: '{{{bulletList tags}}}',
            },
          ],
        ]),
      };

      const node = await generateNode(
        { name: 'Test', type: 'concept', tags: ['tag1', 'tag2'] },
        template,
        mockProjectContext
      );

      expect(node.content).toContain('- tag1');
      expect(node.content).toContain('- tag2');
    });
  });
});
