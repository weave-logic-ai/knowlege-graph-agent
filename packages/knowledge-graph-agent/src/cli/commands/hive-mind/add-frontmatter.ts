/**
 * Hive Mind - Frontmatter Enricher
 *
 * Adds or enriches YAML frontmatter in markdown files to improve discoverability
 * and enable better linking between documents.
 *
 * SPEC-003: Hive Mind Reconnection Tools
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { glob } from 'fast-glob';
import matter from 'gray-matter';
import * as yaml from 'js-yaml';

// ============================================================================
// Types
// ============================================================================

export interface EnrichOptions {
  overwrite?: boolean;
  tags?: boolean;
  aliases?: boolean;
  links?: boolean;
  dryRun?: boolean;
  output?: string;
  json?: boolean;
  verbose?: boolean;
}

export interface FrontmatterTemplate {
  title: string;
  created: string;
  modified: string;
  tags: string[];
  aliases: string[];
  links: string[];
  type: string;
  status: string;
  description?: string;
}

export interface EnrichedFile {
  file: string;
  added: string[];
  updated: string[];
  frontmatter: FrontmatterTemplate;
}

export interface EnrichResult {
  enriched: EnrichedFile[];
  skipped: string[];
  errors: Array<{ file: string; error: string }>;
  statistics: {
    totalFiles: number;
    enrichedCount: number;
    skippedCount: number;
    errorCount: number;
    tagsAdded: number;
    aliasesAdded: number;
    linksExtracted: number;
  };
}

// ============================================================================
// Frontmatter Enricher Class
// ============================================================================

export class FrontmatterEnricher {
  /**
   * Enrich frontmatter for all files in a vault
   */
  async enrichVault(vaultPath: string, options: EnrichOptions = {}): Promise<EnrichResult> {
    const resolvedPath = path.resolve(vaultPath);

    // Find all markdown files
    const files = await glob('**/*.md', {
      cwd: resolvedPath,
      ignore: ['node_modules/**', '.git/**', 'dist/**'],
      absolute: false,
    });

    if (files.length === 0) {
      throw new Error(`No markdown files found in: ${resolvedPath}`);
    }

    const enriched: EnrichedFile[] = [];
    const skipped: string[] = [];
    const errors: Array<{ file: string; error: string }> = [];
    let tagsAdded = 0;
    let aliasesAdded = 0;
    let linksExtracted = 0;

    for (const file of files) {
      try {
        const result = await this.enrichFile(
          path.join(resolvedPath, file),
          file,
          options
        );

        if (result) {
          enriched.push(result);
          tagsAdded += result.frontmatter.tags.length;
          aliasesAdded += result.frontmatter.aliases.length;
          linksExtracted += result.frontmatter.links.length;
        } else {
          skipped.push(file);
        }
      } catch (error) {
        errors.push({
          file,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      enriched,
      skipped,
      errors,
      statistics: {
        totalFiles: files.length,
        enrichedCount: enriched.length,
        skippedCount: skipped.length,
        errorCount: errors.length,
        tagsAdded,
        aliasesAdded,
        linksExtracted,
      },
    };
  }

  /**
   * Enrich a single file's frontmatter
   */
  async enrichFile(
    filePath: string,
    relativePath: string,
    options: EnrichOptions
  ): Promise<EnrichedFile | null> {
    const content = await readFile(filePath, 'utf-8');
    const parsed = matter(content);

    const existingFm = parsed.data as Partial<FrontmatterTemplate>;
    const hasExistingFm = Object.keys(existingFm).length > 0;

    // Skip if has frontmatter and not overwriting
    if (hasExistingFm && !options.overwrite) {
      // Check if we need to add anything
      const needsTags = options.tags && (!existingFm.tags || existingFm.tags.length === 0);
      const needsAliases = options.aliases && (!existingFm.aliases || existingFm.aliases.length === 0);
      const needsLinks = options.links && (!existingFm.links || existingFm.links.length === 0);

      if (!needsTags && !needsAliases && !needsLinks && existingFm.title) {
        return null;
      }
    }

    // Extract metadata from content
    const metadata = this.extractMetadata(parsed.content, relativePath);

    // Build new frontmatter
    const added: string[] = [];
    const updated: string[] = [];
    const newFm: FrontmatterTemplate = {
      title: existingFm.title || metadata.title,
      created: existingFm.created || metadata.created,
      modified: new Date().toISOString().split('T')[0],
      tags: [],
      aliases: [],
      links: [],
      type: existingFm.type || metadata.type,
      status: existingFm.status || 'active',
    };

    // Track what was added/updated
    if (!existingFm.title) added.push('title');
    if (!existingFm.created) added.push('created');
    if (!existingFm.type) added.push('type');
    if (!existingFm.status) added.push('status');
    updated.push('modified');

    // Handle tags
    if (options.tags !== false) {
      const existingTags = existingFm.tags || [];
      const extractedTags = metadata.tags;
      const mergedTags = [...new Set([...existingTags, ...extractedTags])];
      newFm.tags = mergedTags;

      const newTagCount = mergedTags.length - existingTags.length;
      if (newTagCount > 0) added.push(`${newTagCount} tags`);
    }

    // Handle aliases
    if (options.aliases !== false) {
      const existingAliases = existingFm.aliases || [];
      const extractedAliases = metadata.aliases;
      const mergedAliases = [...new Set([...existingAliases, ...extractedAliases])];
      newFm.aliases = mergedAliases;

      const newAliasCount = mergedAliases.length - existingAliases.length;
      if (newAliasCount > 0) added.push(`${newAliasCount} aliases`);
    }

    // Handle links
    if (options.links !== false) {
      const existingLinks = existingFm.links || [];
      const extractedLinks = metadata.links;
      const mergedLinks = [...new Set([...existingLinks, ...extractedLinks])];
      newFm.links = mergedLinks;

      const newLinkCount = mergedLinks.length - existingLinks.length;
      if (newLinkCount > 0) added.push(`${newLinkCount} links`);
    }

    // Add description if missing
    if (!existingFm.description && metadata.description) {
      newFm.description = metadata.description;
      added.push('description');
    }

    // Write file if not dry run
    if (!options.dryRun) {
      const newContent = this.buildMarkdownWithFrontmatter(newFm, parsed.content);
      await writeFile(filePath, newContent);
    }

    return {
      file: relativePath,
      added,
      updated,
      frontmatter: newFm,
    };
  }

  /**
   * Extract metadata from content and filename
   */
  private extractMetadata(content: string, filename: string): {
    title: string;
    created: string;
    type: string;
    tags: string[];
    aliases: string[];
    links: string[];
    description?: string;
  } {
    const basename = path.basename(filename, '.md');

    // Extract title from first heading or filename
    let title = basename;
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      title = headingMatch[1].trim();
    }

    // Generate aliases from title variations
    const aliases = this.generateAliases(title, basename);

    // Extract tags from hashtags in content
    const tags = this.extractHashtags(content);

    // Infer type from content and filename
    const type = this.inferType(content, basename);

    // Extract wiki-links
    const links = this.extractWikiLinks(content);

    // Extract first paragraph as description
    const description = this.extractDescription(content);

    // Use current date for created
    const created = new Date().toISOString().split('T')[0];

    return { title, created, type, tags, aliases, links, description };
  }

  /**
   * Generate aliases from title
   */
  private generateAliases(title: string, filename: string): string[] {
    const aliases: string[] = [];

    // Add filename if different from title
    const cleanFilename = filename.replace(/-/g, ' ').toLowerCase();
    const cleanTitle = title.toLowerCase();
    if (cleanFilename !== cleanTitle) {
      // Convert filename to readable form
      const readableFilename = filename
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      if (readableFilename !== title) {
        aliases.push(readableFilename);
      }
    }

    // Add lowercase version if title has caps
    if (title !== title.toLowerCase() && !aliases.includes(title.toLowerCase())) {
      aliases.push(title.toLowerCase());
    }

    // Add acronym if title has multiple words
    const words = title.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      const acronym = words
        .map(w => w[0])
        .filter(c => c && /[A-Z]/.test(c))
        .join('');
      if (acronym.length >= 2 && !aliases.includes(acronym)) {
        aliases.push(acronym);
      }
    }

    return aliases.slice(0, 5); // Limit to 5 aliases
  }

  /**
   * Extract hashtags from content
   */
  private extractHashtags(content: string): string[] {
    const tags = new Set<string>();

    // Match #tag patterns (but not #headings)
    const regex = /(?:^|\s)#([a-zA-Z][a-zA-Z0-9_-]*)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const tag = match[1].toLowerCase();
      if (tag.length > 1 && tag.length < 30) {
        tags.add(tag);
      }
    }

    // Also infer tags from content keywords
    const inferredTags = this.inferTagsFromContent(content);
    for (const tag of inferredTags) {
      tags.add(tag);
    }

    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  /**
   * Infer tags from content analysis
   */
  private inferTagsFromContent(content: string): string[] {
    const tags: string[] = [];
    const lowerContent = content.toLowerCase();

    // Common topic patterns
    const patterns: Array<{ pattern: RegExp; tag: string }> = [
      { pattern: /\b(api|endpoint|rest|graphql)\b/i, tag: 'api' },
      { pattern: /\b(database|sql|postgres|mysql|mongo)\b/i, tag: 'database' },
      { pattern: /\b(test|testing|jest|vitest|unittest)\b/i, tag: 'testing' },
      { pattern: /\b(docker|container|kubernetes|k8s)\b/i, tag: 'devops' },
      { pattern: /\b(security|auth|authentication|oauth)\b/i, tag: 'security' },
      { pattern: /\b(performance|optimization|cache)\b/i, tag: 'performance' },
      { pattern: /\b(react|vue|angular|frontend)\b/i, tag: 'frontend' },
      { pattern: /\b(node|express|backend|server)\b/i, tag: 'backend' },
      { pattern: /\b(typescript|javascript|python|rust)\b/i, tag: 'programming' },
      { pattern: /\b(guide|tutorial|howto|how-to)\b/i, tag: 'guide' },
      { pattern: /\b(architecture|design|pattern)\b/i, tag: 'architecture' },
      { pattern: /\b(config|configuration|setup)\b/i, tag: 'configuration' },
    ];

    for (const { pattern, tag } of patterns) {
      if (pattern.test(lowerContent)) {
        tags.push(tag);
      }
    }

    return tags;
  }

  /**
   * Infer document type from content
   */
  private inferType(content: string, filename: string): string {
    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();

    // Check filename patterns
    if (lowerFilename.includes('readme') || lowerFilename.includes('index')) {
      return 'guide';
    }
    if (lowerFilename.includes('api') || lowerFilename.includes('endpoint')) {
      return 'technical';
    }
    if (lowerFilename.includes('standard') || lowerFilename.includes('convention')) {
      return 'standard';
    }

    // Check content patterns
    if (/```[a-z]+\n/i.test(content)) {
      return 'technical';
    }
    if (/##\s*installation|##\s*getting started|##\s*usage/i.test(content)) {
      return 'guide';
    }
    if (/##\s*api|##\s*endpoints|##\s*methods/i.test(content)) {
      return 'technical';
    }
    if (/##\s*overview|##\s*introduction|##\s*background/i.test(content)) {
      return 'concept';
    }

    return 'concept'; // Default type
  }

  /**
   * Extract wiki-links from content
   */
  private extractWikiLinks(content: string): string[] {
    const links = new Set<string>();
    const regex = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const link = match[1].trim();
      if (link) {
        links.add(link);
      }
    }

    return Array.from(links);
  }

  /**
   * Extract first paragraph as description
   */
  private extractDescription(content: string): string | undefined {
    // Skip headings and find first paragraph
    const lines = content.split('\n');
    let foundContent = false;
    const paragraphLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines at start
      if (!foundContent && !trimmed) continue;

      // Skip headings
      if (trimmed.startsWith('#')) {
        if (foundContent) break;
        continue;
      }

      // Skip code blocks
      if (trimmed.startsWith('```')) continue;

      // Found content
      if (trimmed) {
        foundContent = true;
        paragraphLines.push(trimmed);
      } else if (foundContent) {
        // End of paragraph
        break;
      }
    }

    const description = paragraphLines.join(' ').slice(0, 200);
    return description || undefined;
  }

  /**
   * Build markdown content with frontmatter
   */
  private buildMarkdownWithFrontmatter(fm: FrontmatterTemplate, content: string): string {
    // Clean frontmatter - remove empty arrays and undefined values
    const cleanFm: Record<string, unknown> = {};

    if (fm.title) cleanFm.title = fm.title;
    if (fm.description) cleanFm.description = fm.description;
    if (fm.type) cleanFm.type = fm.type;
    if (fm.status) cleanFm.status = fm.status;
    if (fm.created) cleanFm.created = fm.created;
    if (fm.modified) cleanFm.modified = fm.modified;
    if (fm.tags && fm.tags.length > 0) cleanFm.tags = fm.tags;
    if (fm.aliases && fm.aliases.length > 0) cleanFm.aliases = fm.aliases;
    if (fm.links && fm.links.length > 0) cleanFm.links = fm.links;

    const yamlStr = yaml.dump(cleanFm, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
    });

    return `---\n${yamlStr}---\n\n${content.trim()}\n`;
  }

  /**
   * Generate report
   */
  generateReport(result: EnrichResult): string {
    const lines: string[] = [];

    lines.push('# Frontmatter Enrichment Report\n');
    lines.push(`Generated: ${new Date().toISOString()}\n`);
    lines.push('');

    lines.push('## Summary\n');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Files | ${result.statistics.totalFiles} |`);
    lines.push(`| Enriched | ${result.statistics.enrichedCount} |`);
    lines.push(`| Skipped | ${result.statistics.skippedCount} |`);
    lines.push(`| Errors | ${result.statistics.errorCount} |`);
    lines.push(`| Tags Added | ${result.statistics.tagsAdded} |`);
    lines.push(`| Aliases Added | ${result.statistics.aliasesAdded} |`);
    lines.push(`| Links Extracted | ${result.statistics.linksExtracted} |`);
    lines.push('');

    if (result.enriched.length > 0) {
      lines.push('## Enriched Files\n');
      for (const { file, added } of result.enriched.slice(0, 50)) {
        if (added.length > 0) {
          lines.push(`- \`${file}\`: ${added.join(', ')}`);
        }
      }
      if (result.enriched.length > 50) {
        lines.push(`\n*... and ${result.enriched.length - 50} more*`);
      }
      lines.push('');
    }

    if (result.errors.length > 0) {
      lines.push('## Errors\n');
      for (const { file, error } of result.errors) {
        lines.push(`- \`${file}\`: ${error}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// ============================================================================
// CLI Command
// ============================================================================

export function createAddFrontmatterCommand(): Command {
  const command = new Command('add-frontmatter')
    .description('Add/enrich YAML frontmatter in markdown files')
    .argument('<vault-path>', 'Path to Obsidian vault or docs directory')
    .option('--overwrite', 'Overwrite existing frontmatter fields')
    .option('--tags', 'Auto-generate tags from content (default: true)')
    .option('--no-tags', 'Skip tag generation')
    .option('--aliases', 'Generate aliases from title (default: true)')
    .option('--no-aliases', 'Skip alias generation')
    .option('--links', 'Extract wiki-links to frontmatter (default: true)')
    .option('--no-links', 'Skip link extraction')
    .option('--dry-run', 'Preview changes without writing files')
    .option('-o, --output <file>', 'Output file for report')
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Show detailed output')
    .action(async (vaultPath: string, options: EnrichOptions) => {
      const enricher = new FrontmatterEnricher();

      const mode = options.dryRun ? ' (dry run)' : '';
      console.log(chalk.cyan(`\nEnriching frontmatter${mode}...\n`));

      try {
        const result = await enricher.enrichVault(vaultPath, options);

        if (options.json) {
          if (options.output) {
            await writeFile(options.output, JSON.stringify(result, null, 2));
            console.log(chalk.green(`Results written to: ${options.output}`));
          } else {
            console.log(JSON.stringify(result, null, 2));
          }
        } else {
          // Display summary
          console.log(chalk.bold('Summary:'));
          console.log(chalk.white(`  Total Files:      ${result.statistics.totalFiles}`));
          console.log(chalk.green(`  Enriched:         ${result.statistics.enrichedCount}`));
          console.log(chalk.gray(`  Skipped:          ${result.statistics.skippedCount}`));
          if (result.statistics.errorCount > 0) {
            console.log(chalk.red(`  Errors:           ${result.statistics.errorCount}`));
          }
          console.log('');

          console.log(chalk.bold('Additions:'));
          console.log(chalk.white(`  Tags Added:       ${result.statistics.tagsAdded}`));
          console.log(chalk.white(`  Aliases Added:    ${result.statistics.aliasesAdded}`));
          console.log(chalk.white(`  Links Extracted:  ${result.statistics.linksExtracted}`));
          console.log('');

          if (options.verbose && result.enriched.length > 0) {
            console.log(chalk.bold('Enriched Files:'));
            for (const { file, added } of result.enriched.slice(0, 20)) {
              if (added.length > 0) {
                console.log(chalk.green(`  ${file}`));
                console.log(chalk.gray(`    Added: ${added.join(', ')}`));
              }
            }
            if (result.enriched.length > 20) {
              console.log(chalk.gray(`  ... and ${result.enriched.length - 20} more`));
            }
            console.log('');
          }

          if (result.errors.length > 0) {
            console.log(chalk.bold(chalk.red('Errors:')));
            for (const { file, error } of result.errors.slice(0, 10)) {
              console.log(chalk.red(`  ${file}: ${error}`));
            }
            if (result.errors.length > 10) {
              console.log(chalk.gray(`  ... and ${result.errors.length - 10} more`));
            }
            console.log('');
          }

          // Write report if output specified
          if (options.output && !options.json) {
            const report = enricher.generateReport(result);
            await writeFile(options.output, report);
            console.log(chalk.green(`Report written to: ${options.output}`));
          }

          // Show dry-run notice
          if (options.dryRun) {
            console.log(chalk.yellow('Dry run complete - no files were modified.'));
            console.log(chalk.gray('Remove --dry-run to apply changes.\n'));
          }
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return command;
}

export default createAddFrontmatterCommand;
