/**
 * Frontmatter Generator - AI-powered YAML frontmatter generation
 */

import { readFile, stat } from 'fs/promises';
import matter from 'gray-matter';
import { basename, extname, relative } from 'path';
import type { DocumentMetadata, DocumentAnalysis, VaultContext } from './types.js';

export class FrontmatterGenerator {
  constructor(
    private context: VaultContext,
    private useAI: boolean = false
  ) {}

  /**
   * Analyze a document and generate frontmatter suggestions
   */
  async analyzeDocument(filePath: string): Promise<DocumentAnalysis> {
    const content = await readFile(filePath, 'utf-8');
    const parsed = matter(content);
    const stats = await stat(filePath);

    const existingFrontmatter = parsed.data as DocumentMetadata;
    const relativePath = relative(this.context.vaultRoot, filePath);

    // Check if document needs frontmatter
    const needsFrontmatter = Object.keys(existingFrontmatter).length === 0;

    // Check if modified since last frontmatter update
    const lastModified = stats.mtime;
    const updatedInFrontmatter = existingFrontmatter.updated
      ? new Date(existingFrontmatter.updated)
      : null;

    const isModified = !updatedInFrontmatter ||
      lastModified > updatedInFrontmatter;

    // Generate suggested frontmatter
    const suggestedFrontmatter = await this.generateFrontmatter(
      filePath,
      relativePath,
      parsed.content,
      existingFrontmatter,
      lastModified
    );

    return {
      filePath,
      relativePath,
      content: parsed.content,
      existingFrontmatter: needsFrontmatter ? undefined : existingFrontmatter,
      suggestedFrontmatter,
      needsFrontmatter,
      isModified,
      lastModified,
    };
  }

  /**
   * Generate frontmatter based on file context
   */
  private async generateFrontmatter(
    filePath: string,
    relativePath: string,
    content: string,
    existing: DocumentMetadata,
    lastModified: Date
  ): Promise<DocumentMetadata> {
    const filename = basename(filePath, extname(filePath));

    // Start with existing or create new
    const frontmatter: DocumentMetadata = { ...existing };

    // Title - use existing or derive from filename
    if (!frontmatter.title) {
      frontmatter.title = this.deriveTitle(filename, content);
    }

    // Type - infer from path and content
    if (!frontmatter.type) {
      frontmatter.type = this.inferType(relativePath, content);
    }

    // Status - infer from content
    if (!frontmatter.status) {
      frontmatter.status = this.inferStatus(content, existing);
    }

    // Tags - extract or infer
    if (!frontmatter.tags || frontmatter.tags.length === 0) {
      frontmatter.tags = this.inferTags(relativePath, content);
    }

    // Phase - infer from path
    if (!frontmatter.phase && relativePath.includes('phase')) {
      frontmatter.phase = this.inferPhase(relativePath);
    }

    // Priority - infer from content
    if (!frontmatter.priority) {
      frontmatter.priority = this.inferPriority(content);
    }

    // Timestamps
    if (!frontmatter.created) {
      // Use existing created or file mtime as fallback
      frontmatter.created = existing.created ||
        lastModified.toISOString().split('T')[0];
    }

    frontmatter.updated = new Date().toISOString();

    // AI-powered enhancement if enabled
    if (this.useAI) {
      await this.enhanceWithAI(frontmatter, content);
    }

    return frontmatter;
  }

  /**
   * Derive title from filename or content
   */
  private deriveTitle(filename: string, content: string): string {
    // Check for h1 heading in content
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Convert filename: my-feature-name -> My Feature Name
    return filename
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Infer document type from path and content
   */
  private inferType(relativePath: string, content: string): string {
    const path = relativePath.toLowerCase();

    // Path-based inference
    if (path.includes('/concepts/')) return 'concept';
    if (path.includes('/features/')) return 'feature';
    if (path.includes('/architecture/')) return 'architecture';
    if (path.includes('/integrations/')) return 'integration';
    if (path.includes('/guides/') || path.includes('/docs/')) return 'guide';
    if (path.includes('/technical/')) return 'technical';
    if (path.includes('/decisions/')) return 'decision';
    if (path.includes('/planning/') || path.includes('/_planning/')) return 'planning';
    if (path.includes('/research/')) return 'research';

    // Content-based inference
    if (content.includes('## API') || content.includes('## Endpoint')) return 'api-reference';
    if (content.includes('```typescript') || content.includes('```javascript')) return 'code-example';
    if (content.includes('## Installation') || content.includes('## Setup')) return 'guide';
    if (content.includes('## Architecture') || content.includes('## Design')) return 'architecture';

    return 'documentation';
  }

  /**
   * Infer status from content keywords
   */
  private inferStatus(content: string, existing: DocumentMetadata): string {
    if (existing.status) return existing.status;

    const lower = content.toLowerCase();

    if (lower.includes('wip') || lower.includes('in progress')) return 'in-progress';
    if (lower.includes('draft')) return 'draft';
    if (lower.includes('complete') || lower.includes('done')) return 'complete';
    if (lower.includes('archived') || lower.includes('deprecated')) return 'archived';
    if (lower.includes('planned') || lower.includes('todo')) return 'planned';

    // Default to active for most docs
    return 'active';
  }

  /**
   * Infer tags from path and content
   */
  private inferTags(relativePath: string, content: string): string[] {
    const tags: Set<string> = new Set();

    // Path-based tags
    const pathParts = relativePath.split('/');
    pathParts.forEach(part => {
      if (part && part !== '..' && !part.startsWith('.')) {
        tags.add(part.toLowerCase());
      }
    });

    // Extract phase tags
    if (relativePath.match(/phase-?\d+/i)) {
      const phaseMatch = relativePath.match(/phase-?(\d+)/i);
      if (phaseMatch) {
        tags.add(`phase-${phaseMatch[1]}`);
      }
    }

    // Content-based tags
    if (content.includes('neural') || content.includes('AI')) tags.add('ai');
    if (content.includes('workflow')) tags.add('workflow');
    if (content.includes('integration')) tags.add('integration');
    if (content.includes('testing') || content.includes('test')) tags.add('testing');
    if (content.includes('architecture')) tags.add('architecture');
    if (content.includes('API')) tags.add('api');

    return Array.from(tags).filter(tag =>
      !tag.endsWith('.md') && tag.length > 2
    ).slice(0, 10); // Limit to 10 tags
  }

  /**
   * Infer phase from path
   */
  private inferPhase(relativePath: string): string | undefined {
    const phaseMatch = relativePath.match(/phase-?(\d+)/i);
    if (phaseMatch) {
      return `phase-${phaseMatch[1]}`;
    }
    return undefined;
  }

  /**
   * Infer priority from content
   */
  private inferPriority(content: string): string {
    const lower = content.toLowerCase();

    if (lower.includes('critical') || lower.includes('urgent')) return 'critical';
    if (lower.includes('high priority') || lower.includes('important')) return 'high';
    if (lower.includes('low priority')) return 'low';

    return 'medium';
  }

  /**
   * Enhance frontmatter using AI analysis (placeholder for AI integration)
   */
  private async enhanceWithAI(
    frontmatter: DocumentMetadata,
    content: string
  ): Promise<void> {
    // TODO: Integrate with claude-flow for AI-powered enhancement
    // This would call an AI agent to:
    // - Extract key concepts
    // - Suggest better tags
    // - Identify relationships
    // - Classify document type more accurately
    // - Extract summary/description

    // For now, extract a simple description from first paragraph
    const firstParagraph = content.split('\n\n')[0]?.replace(/#/g, '').trim();
    if (firstParagraph && firstParagraph.length > 20 && firstParagraph.length < 200) {
      frontmatter.description = firstParagraph;
    }
  }
}
