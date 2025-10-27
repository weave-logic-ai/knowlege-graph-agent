import { describe, it, expect } from 'vitest';
import {
  formatWikiLink,
  parseWikiLink,
  generateAutoLinks,
  groupLinksByType,
  formatLinksSection,
  extractWikiLinks,
  sanitizeNodeName,
} from '../../src/vault-init/generator/wikilink-builder';
import type { WikiLink, NodeData } from '../../src/vault-init/generator/types';

describe('wikilink-builder', () => {
  describe('formatWikiLink', () => {
    it('should format basic wikilink', () => {
      const link: WikiLink = { target: 'Target Node' };
      const formatted = formatWikiLink(link);

      expect(formatted).toBe('[[Target Node]]');
    });

    it('should format wikilink with alias', () => {
      const link: WikiLink = {
        target: 'Target Node',
        alias: 'Alias Text',
      };
      const formatted = formatWikiLink(link);

      expect(formatted).toBe('[[Target Node|Alias Text]]');
    });

    it('should ignore empty alias', () => {
      const link: WikiLink = {
        target: 'Target Node',
        alias: '',
      };
      const formatted = formatWikiLink(link);

      expect(formatted).toBe('[[Target Node]]');
    });
  });

  describe('parseWikiLink', () => {
    it('should parse basic wikilink', () => {
      const linkString = '[[Target Node]]';
      const parsed = parseWikiLink(linkString);

      expect(parsed).toEqual({
        target: 'Target Node',
        alias: undefined,
      });
    });

    it('should parse wikilink with alias', () => {
      const linkString = '[[Target Node|Alias Text]]';
      const parsed = parseWikiLink(linkString);

      expect(parsed).toEqual({
        target: 'Target Node',
        alias: 'Alias Text',
      });
    });

    it('should handle whitespace', () => {
      const linkString = '[[  Target Node  |  Alias  ]]';
      const parsed = parseWikiLink(linkString);

      expect(parsed).toEqual({
        target: 'Target Node',
        alias: 'Alias',
      });
    });

    it('should return null for invalid format', () => {
      const linkString = 'Not a wikilink';
      const parsed = parseWikiLink(linkString);

      expect(parsed).toBeNull();
    });

    it('should return null for empty string', () => {
      const parsed = parseWikiLink('');

      expect(parsed).toBeNull();
    });
  });

  describe('generateAutoLinks', () => {
    it('should include user-provided links', () => {
      const nodeData: NodeData = {
        name: 'Test Node',
        type: 'concept',
        links: ['Link 1', 'Link 2'],
      };

      const links = generateAutoLinks(nodeData);

      expect(links).toHaveLength(2);
      expect(links[0].target).toBe('Link 1');
      expect(links[1].target).toBe('Link 2');
    });

    it('should generate links to related nodes', () => {
      const nodeData: NodeData = {
        name: 'Node A',
        type: 'concept',
        tags: ['react', 'frontend'],
        content: 'This is about React components and how they work with hooks and state management',
      };

      const relatedNodes: NodeData[] = [
        {
          name: 'Node B',
          type: 'concept',
          tags: ['react', 'hooks'],
          content: 'This is about React hooks and how they work with components and state management',
        },
        {
          name: 'Node C',
          type: 'technical',
          tags: ['backend'],
          content: 'This is about backend servers',
        },
      ];

      const links = generateAutoLinks(nodeData, relatedNodes);

      // Should link to Node B due to shared 'react' tag and content similarity
      const targets = links.map((l) => l.target);
      expect(targets).toContain('Node B');
    });

    it('should deduplicate links', () => {
      const nodeData: NodeData = {
        name: 'Node A',
        type: 'concept',
        links: ['Duplicate', 'duplicate', 'Other'],
      };

      const links = generateAutoLinks(nodeData);

      expect(links).toHaveLength(2);
    });

    it('should not link to self', () => {
      const nodeData: NodeData = {
        name: 'Node A',
        type: 'concept',
      };

      const relatedNodes: NodeData[] = [
        {
          name: 'Node A',
          type: 'concept',
        },
      ];

      const links = generateAutoLinks(nodeData, relatedNodes);

      expect(links).toHaveLength(0);
    });

    it('should handle empty related nodes', () => {
      const nodeData: NodeData = {
        name: 'Node A',
        type: 'concept',
      };

      const links = generateAutoLinks(nodeData, []);

      expect(links).toHaveLength(0);
    });
  });

  describe('groupLinksByType', () => {
    it('should group links by type', () => {
      const links: WikiLink[] = [
        { target: 'Concept 1', type: 'concept' },
        { target: 'Concept 2', type: 'concept' },
        { target: 'Tech 1', type: 'technical' },
        { target: 'Feature 1', type: 'feature' },
        { target: 'External 1', type: 'external' },
        { target: 'Unknown 1' },
      ];

      const grouped = groupLinksByType(links);

      expect(grouped.concept).toHaveLength(2);
      expect(grouped.technical).toHaveLength(1);
      expect(grouped.feature).toHaveLength(1);
      expect(grouped.external).toHaveLength(1);
      expect(grouped.unknown).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const grouped = groupLinksByType([]);

      expect(grouped.concept).toHaveLength(0);
      expect(grouped.technical).toHaveLength(0);
      expect(grouped.feature).toHaveLength(0);
      expect(grouped.external).toHaveLength(0);
      expect(grouped.unknown).toHaveLength(0);
    });
  });

  describe('formatLinksSection', () => {
    it('should format links section with all types', () => {
      const links: WikiLink[] = [
        { target: 'Concept 1', type: 'concept' },
        { target: 'Tech 1', type: 'technical' },
        { target: 'Feature 1', type: 'feature' },
        { target: 'External 1', type: 'external' },
      ];

      const section = formatLinksSection(links);

      expect(section).toContain('## Links');
      expect(section).toContain('### Related Concepts');
      expect(section).toContain('### Technical References');
      expect(section).toContain('### Related Features');
      expect(section).toContain('### External Resources');
      expect(section).toContain('[[Concept 1]]');
      expect(section).toContain('[[Tech 1]]');
      expect(section).toContain('[[Feature 1]]');
      expect(section).toContain('[[External 1]]');
    });

    it('should return empty string for no links', () => {
      const section = formatLinksSection([]);

      expect(section).toBe('');
    });

    it('should only include sections for present types', () => {
      const links: WikiLink[] = [{ target: 'Concept 1', type: 'concept' }];

      const section = formatLinksSection(links);

      expect(section).toContain('### Related Concepts');
      expect(section).not.toContain('### Technical References');
      expect(section).not.toContain('### Related Features');
    });
  });

  describe('extractWikiLinks', () => {
    it('should extract all wikilinks from markdown', () => {
      const markdown = `
# Title

This is a link to [[Node 1]] and [[Node 2|Alias]].

More content with [[Node 3]].
`;

      const links = extractWikiLinks(markdown);

      expect(links).toHaveLength(3);
      expect(links[0]).toEqual({ target: 'Node 1', alias: undefined });
      expect(links[1]).toEqual({ target: 'Node 2', alias: 'Alias' });
      expect(links[2]).toEqual({ target: 'Node 3', alias: undefined });
    });

    it('should return empty array for no links', () => {
      const markdown = 'Just plain text';
      const links = extractWikiLinks(markdown);

      expect(links).toHaveLength(0);
    });

    it('should handle malformed links gracefully', () => {
      const markdown = 'Text with [single bracket] and normal [link](url)';
      const links = extractWikiLinks(markdown);

      expect(links).toHaveLength(0);
    });
  });

  describe('sanitizeNodeName', () => {
    it('should replace invalid filename characters', () => {
      const name = 'Node<>:"/\\|?*Name';
      const sanitized = sanitizeNodeName(name);

      expect(sanitized).toBe('Node-Name'); // Multiple hyphens collapsed to one
    });

    it('should replace spaces with hyphens', () => {
      const name = 'Node With Spaces';
      const sanitized = sanitizeNodeName(name);

      expect(sanitized).toBe('Node-With-Spaces');
    });

    it('should collapse multiple hyphens', () => {
      const name = 'Node---Multiple---Hyphens';
      const sanitized = sanitizeNodeName(name);

      expect(sanitized).toBe('Node-Multiple-Hyphens');
    });

    it('should remove leading and trailing hyphens', () => {
      const name = '-Leading and Trailing-';
      const sanitized = sanitizeNodeName(name);

      expect(sanitized).toBe('Leading-and-Trailing');
    });

    it('should trim whitespace', () => {
      const name = '  Whitespace  ';
      const sanitized = sanitizeNodeName(name);

      expect(sanitized).toBe('Whitespace');
    });

    it('should handle empty string', () => {
      const sanitized = sanitizeNodeName('');

      expect(sanitized).toBe('');
    });

    it('should preserve valid characters', () => {
      const name = 'Valid-Node_Name.123';
      const sanitized = sanitizeNodeName(name);

      expect(sanitized).toBe('Valid-Node_Name.123');
    });
  });
});
