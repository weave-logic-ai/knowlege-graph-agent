import { describe, it, expect } from 'vitest';
import {
  generateFrontmatter,
  frontmatterToYaml,
  parseFrontmatter,
  updateFrontmatter,
  validateFrontmatter,
} from '../../src/vault-init/generator/frontmatter-generator';
import type { NodeData, ProjectContext } from '../../src/vault-init/generator/types';

describe('frontmatter-generator', () => {
  const mockNodeData: NodeData = {
    name: 'Test Node',
    type: 'concept',
    description: 'A test node for unit testing',
    tags: ['testing', 'unit-test'],
    metadata: {
      priority: 'high',
    },
  };

  const mockProjectContext: ProjectContext = {
    projectName: 'Test Project',
    framework: 'nextjs',
    version: '1.0.0',
    author: 'Test Author',
    timestamp: new Date('2025-01-01T00:00:00.000Z'),
  };

  describe('generateFrontmatter', () => {
    it('should generate basic frontmatter', () => {
      const frontmatter = generateFrontmatter(mockNodeData, mockProjectContext);

      expect(frontmatter).toMatchObject({
        type: 'concept',
        name: 'Test Node',
        description: 'A test node for unit testing',
        framework: 'nextjs',
        project: 'Test Project',
        author: 'Test Author',
      });

      expect(frontmatter.tags).toContain('concept');
      expect(frontmatter.tags).toContain('nextjs');
      expect(frontmatter.tags).toContain('testing');
      expect(frontmatter.created).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should include custom metadata', () => {
      const frontmatter = generateFrontmatter(mockNodeData, mockProjectContext);

      expect(frontmatter.priority).toBe('high');
    });

    it('should exclude timestamp when option is false', () => {
      const frontmatter = generateFrontmatter(
        mockNodeData,
        mockProjectContext,
        { includeTimestamp: false }
      );

      expect(frontmatter.created).toBeUndefined();
    });

    it('should exclude author when option is false', () => {
      const frontmatter = generateFrontmatter(
        mockNodeData,
        mockProjectContext,
        { includeAuthor: false }
      );

      expect(frontmatter.author).toBeUndefined();
    });

    it('should include version when option is true', () => {
      const frontmatter = generateFrontmatter(
        mockNodeData,
        mockProjectContext,
        { includeVersion: true }
      );

      expect(frontmatter.version).toBe('1.0.0');
    });

    it('should include custom fields', () => {
      const frontmatter = generateFrontmatter(
        mockNodeData,
        mockProjectContext,
        { customFields: { custom: 'value' } }
      );

      expect(frontmatter.custom).toBe('value');
    });

    it('should handle missing optional fields', () => {
      const minimalNode: NodeData = {
        name: 'Minimal',
        type: 'feature',
      };

      const minimalContext: ProjectContext = {
        projectName: 'Project',
        framework: 'react',
      };

      const frontmatter = generateFrontmatter(minimalNode, minimalContext);

      expect(frontmatter.type).toBe('feature');
      expect(frontmatter.name).toBe('Minimal');
      expect(frontmatter.description).toBeUndefined();
    });

    it('should auto-generate type-specific tags', () => {
      const conceptNode: NodeData = { name: 'Concept', type: 'concept' };
      const technicalNode: NodeData = { name: 'Tech', type: 'technical' };
      const featureNode: NodeData = { name: 'Feature', type: 'feature' };

      const context: ProjectContext = {
        projectName: 'Test',
        framework: 'nextjs',
      };

      const conceptFm = generateFrontmatter(conceptNode, context);
      const technicalFm = generateFrontmatter(technicalNode, context);
      const featureFm = generateFrontmatter(featureNode, context);

      expect(conceptFm.tags).toContain('knowledge');
      expect(conceptFm.tags).toContain('conceptual');

      expect(technicalFm.tags).toContain('implementation');
      expect(technicalFm.tags).toContain('technical');

      expect(featureFm.tags).toContain('functionality');
      expect(featureFm.tags).toContain('feature');
    });

    it('should include links if provided', () => {
      const nodeWithLinks: NodeData = {
        name: 'Node with Links',
        type: 'concept',
        links: ['Related Node 1', 'Related Node 2'],
      };

      const frontmatter = generateFrontmatter(nodeWithLinks, mockProjectContext);

      expect(frontmatter.links).toEqual(['Related Node 1', 'Related Node 2']);
    });
  });

  describe('frontmatterToYaml', () => {
    it('should convert frontmatter to YAML', () => {
      const frontmatter = {
        type: 'concept',
        name: 'Test',
        tags: ['tag1', 'tag2'],
      };

      const yaml = frontmatterToYaml(frontmatter);

      expect(yaml).toContain('---');
      expect(yaml).toContain('type: concept');
      expect(yaml).toContain('name: Test');
      expect(yaml).toContain('tags:');
      expect(yaml).toContain('- tag1');
      expect(yaml).toContain('- tag2');
    });

    it('should handle nested objects', () => {
      const frontmatter = {
        type: 'concept',
        metadata: {
          nested: {
            value: 'test',
          },
        },
      };

      const yaml = frontmatterToYaml(frontmatter);

      expect(yaml).toContain('metadata:');
      expect(yaml).toContain('nested:');
      expect(yaml).toContain('value: test');
    });

    it('should handle arrays of objects', () => {
      const frontmatter = {
        type: 'concept',
        items: [
          { id: 1, name: 'item1' },
          { id: 2, name: 'item2' },
        ],
      };

      const yaml = frontmatterToYaml(frontmatter);

      expect(yaml).toContain('items:');
      expect(yaml).toContain('id: 1');
      expect(yaml).toContain('name: item1');
    });
  });

  describe('parseFrontmatter', () => {
    it('should parse frontmatter from markdown', () => {
      const markdown = `---
type: concept
name: Test Node
tags:
  - tag1
  - tag2
---

# Content here`;

      const { frontmatter, content } = parseFrontmatter(markdown);

      expect(frontmatter).toMatchObject({
        type: 'concept',
        name: 'Test Node',
        tags: ['tag1', 'tag2'],
      });

      expect(content).toContain('# Content here');
    });

    it('should return null frontmatter for markdown without frontmatter', () => {
      const markdown = '# Just content';

      const { frontmatter, content } = parseFrontmatter(markdown);

      expect(frontmatter).toBeNull();
      expect(content).toBe('# Just content');
    });

    it('should handle empty frontmatter', () => {
      const markdown = `---
---

Content`;

      const { frontmatter, content } = parseFrontmatter(markdown);

      expect(frontmatter).toEqual(null);
      expect(content).toContain('Content');
    });
  });

  describe('updateFrontmatter', () => {
    it('should update existing frontmatter', () => {
      const original = `---
type: concept
name: Original
---

Content`;

      const updated = updateFrontmatter(original, { name: 'Updated' });

      expect(updated).toContain('name: Updated');
      expect(updated).toContain('type: concept');
      expect(updated).toContain('Content');
    });

    it('should add new fields to frontmatter', () => {
      const original = `---
type: concept
---

Content`;

      const updated = updateFrontmatter(original, { newField: 'value' });

      expect(updated).toContain('newField: value');
      expect(updated).toContain('type: concept');
    });

    it('should create frontmatter if none exists', () => {
      const original = 'Just content';

      const updated = updateFrontmatter(original, { type: 'concept' });

      expect(updated).toContain('---');
      expect(updated).toContain('type: concept');
      expect(updated).toContain('Just content');
    });
  });

  describe('validateFrontmatter', () => {
    it('should validate correct frontmatter', () => {
      const frontmatter = {
        type: 'concept',
        name: 'Test',
        tags: ['tag1'],
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject frontmatter without type', () => {
      const frontmatter = {
        name: 'Test',
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: type');
    });

    it('should reject frontmatter without name', () => {
      const frontmatter = {
        type: 'concept',
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: name');
    });

    it('should reject invalid type', () => {
      const frontmatter = {
        type: 'invalid',
        name: 'Test',
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid type: invalid');
    });

    it('should reject non-array tags', () => {
      const frontmatter = {
        type: 'concept',
        name: 'Test',
        tags: 'not-an-array',
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Tags must be an array');
    });

    it('should reject non-array links', () => {
      const frontmatter = {
        type: 'concept',
        name: 'Test',
        links: 'not-an-array',
      };

      const result = validateFrontmatter(frontmatter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Links must be an array');
    });
  });
});
