/**
 * Batch Connector - Mass Connection Tool
 * Automatically inserts wikilinks based on suggestions
 */

import { readFile, writeFile } from 'fs/promises';
import matter from 'gray-matter';
import type {
  ConnectionSuggestion,
  BatchConnectionConfig,
  BatchConnectionResult,
  GraphNode,
} from './types.js';

export class BatchConnector {
  private nodes: Map<string, GraphNode>;

  constructor(nodes: Map<string, GraphNode>) {
    this.nodes = nodes;
  }

  /**
   * Apply connection suggestions in batch
   */
  async applyConnections(
    suggestions: ConnectionSuggestion[],
    config: BatchConnectionConfig
  ): Promise<BatchConnectionResult> {
    console.log(
      `🔗 Applying ${suggestions.length} connection suggestions...`
    );
    const startTime = Date.now();

    const result: BatchConnectionResult = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      connectionsAdded: 0,
    };

    // Filter suggestions by score
    const filtered = suggestions.filter((s) => s.score >= config.minScore);

    // Group by source file
    const bySource = new Map<string, ConnectionSuggestion[]>();
    for (const suggestion of filtered) {
      if (!bySource.has(suggestion.sourceFile)) {
        bySource.set(suggestion.sourceFile, []);
      }
      bySource.get(suggestion.sourceFile)!.push(suggestion);
    }

    // Process each source file
    for (const [sourceFile, fileSuggestions] of Array.from(bySource.entries())) {
      result.processed++;

      try {
        const node = this.nodes.get(sourceFile);
        if (!node) {
          result.skipped++;
          continue;
        }

        // Limit suggestions per file
        const toApply = fileSuggestions
          .sort((a, b) => b.score - a.score)
          .slice(0, config.maxSuggestionsPerFile);

        if (config.dryRun) {
          console.log(`[DRY RUN] Would add ${toApply.length} links to ${sourceFile}`);
          result.successful++;
          result.connectionsAdded += toApply.length;
          continue;
        }

        // Apply connections
        const added = await this.addConnectionsToFile(
          node,
          toApply,
          config
        );
        result.connectionsAdded += added;
        result.successful++;

        // Handle bidirectional connections
        if (config.bidirectional) {
          for (const suggestion of toApply) {
            if (suggestion.bidirectional) {
              const targetNode = this.nodes.get(suggestion.targetFile);
              if (targetNode) {
                await this.addConnectionsToFile(
                  targetNode,
                  [
                    {
                      ...suggestion,
                      sourceFile: suggestion.targetFile,
                      targetFile: suggestion.sourceFile,
                    },
                  ],
                  config
                );
                result.connectionsAdded++;
              }
            }
          }
        }
      } catch (error) {
        result.failed++;
        result.errors.push({
          file: sourceFile,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Batch connection complete in ${duration}s`);
    console.log(
      `   Processed: ${result.processed}, Successful: ${result.successful}, Failed: ${result.failed}`
    );
    console.log(`   Total connections added: ${result.connectionsAdded}`);

    return result;
  }

  /**
   * Add connections to a single file
   */
  private async addConnectionsToFile(
    node: GraphNode,
    suggestions: ConnectionSuggestion[],
    config: BatchConnectionConfig
  ): Promise<number> {
    const content = await readFile(node.path, 'utf-8');
    const { data: frontmatter, content: markdownContent } = matter(content);

    let updatedContent = markdownContent;
    let connectionsAdded = 0;

    // Add frontmatter if missing
    if (config.addFrontmatter && Object.keys(frontmatter).length === 0) {
      frontmatter.title = node.filename.replace('.md', '');
      frontmatter.created = node.createdAt?.toISOString().split('T')[0];
    }

    // Find a good place to add links (end of first section or end of file)
    const insertPosition = this.findInsertPosition(updatedContent);

    // Generate wikilinks
    const wikilinks = suggestions
      .filter((s) => {
        // Skip if link already exists
        const targetName = this.getFileBaseName(s.targetFile);
        return !updatedContent.includes(`[[${targetName}]]`);
      })
      .map((s) => {
        const targetName = this.getFileBaseName(s.targetFile);
        connectionsAdded++;
        return `[[${targetName}]]`;
      });

    if (wikilinks.length > 0) {
      const linksSection = `\n\n## Related\n\n${wikilinks.join(' • ')}\n`;

      // Insert links at appropriate position
      if (insertPosition !== null) {
        updatedContent =
          updatedContent.slice(0, insertPosition) +
          linksSection +
          updatedContent.slice(insertPosition);
      } else {
        updatedContent += linksSection;
      }

      // Reconstruct file with frontmatter
      const newContent = matter.stringify(updatedContent, frontmatter);

      if (!config.dryRun) {
        await writeFile(node.path, newContent, 'utf-8');
      }
    }

    return connectionsAdded;
  }

  /**
   * Find best position to insert related links
   */
  private findInsertPosition(content: string): number | null {
    // Try to insert before existing "## Related" or similar section
    const relatedSections = [
      /^## Related/m,
      /^## See Also/m,
      /^## Links/m,
      /^## References/m,
    ];

    for (const pattern of relatedSections) {
      const match = content.match(pattern);
      if (match && match.index !== undefined) {
        return match.index;
      }
    }

    // Try to insert after first section (after first ## heading)
    const headingMatch = content.match(/^## .+$/m);
    if (headingMatch && headingMatch.index !== undefined) {
      // Find end of this section (next ## heading or end of file)
      const nextHeadingMatch = content
        .slice(headingMatch.index + headingMatch[0].length)
        .match(/^## .+$/m);

      if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
        return (
          headingMatch.index +
          headingMatch[0].length +
          nextHeadingMatch.index
        );
      }
    }

    // Default: append to end
    return null;
  }

  /**
   * Get base filename without extension
   */
  private getFileBaseName(filePath: string): string {
    const parts = filePath.split('/');
    const filename = parts[parts.length - 1];
    return filename.replace('.md', '');
  }

  /**
   * Preview connections without applying
   */
  async previewConnections(
    suggestions: ConnectionSuggestion[],
    config: BatchConnectionConfig
  ): Promise<Map<string, ConnectionSuggestion[]>> {
    const preview = new Map<string, ConnectionSuggestion[]>();

    // Filter and group
    const filtered = suggestions.filter((s) => s.score >= config.minScore);
    const bySource = new Map<string, ConnectionSuggestion[]>();

    for (const suggestion of filtered) {
      if (!bySource.has(suggestion.sourceFile)) {
        bySource.set(suggestion.sourceFile, []);
      }
      bySource.get(suggestion.sourceFile)!.push(suggestion);
    }

    // Limit per file
    for (const [sourceFile, fileSuggestions] of Array.from(bySource.entries())) {
      const toApply = fileSuggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, config.maxSuggestionsPerFile);
      preview.set(sourceFile, toApply);
    }

    return preview;
  }

  /**
   * Export connections to JSON for review
   */
  async exportSuggestions(
    suggestions: ConnectionSuggestion[],
    outputPath: string
  ): Promise<void> {
    const data = {
      timestamp: new Date().toISOString(),
      totalSuggestions: suggestions.length,
      suggestions: suggestions.map((s) => ({
        source: s.sourceFile,
        target: s.targetFile,
        score: s.score,
        reason: s.reason,
        bidirectional: s.bidirectional,
        metadata: s.metadata,
      })),
    };

    await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`📄 Exported ${suggestions.length} suggestions to ${outputPath}`);
  }
}
