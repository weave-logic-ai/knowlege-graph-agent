/**
 * Footer Builder - Automatic backlink footer generation for vault documents
 *
 * Analyzes all documents to build reverse link index and generates
 * footer sections with "References" and "Backlinks" for improved navigation.
 */

import { readFile, writeFile } from 'fs/promises';
import matter from 'gray-matter';
import { basename, dirname, relative, resolve, join } from 'path';
import type { VaultContext, BacklinkInfo } from './types.js';

export interface FooterBuildResult {
  updated: number;
  skipped: number;
  errors: string[];
}

export class FooterBuilder {
  constructor(private context: VaultContext) {}

  /**
   * Build footers for all documents in the vault
   * Analyzes links, builds backlink map, and updates footer sections
   */
  async buildFooters(documents: string[]): Promise<FooterBuildResult> {
    const result: FooterBuildResult = {
      updated: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Step 1: Analyze all documents and build backlink index
      console.log(`Analyzing links in ${documents.length} documents...`);
      const backlinkMap = await this.analyzeLinks(documents);
      console.log(`Found backlinks for ${backlinkMap.size} documents`);

      // Step 2: Process each document and update footers
      for (const filePath of documents) {
        try {
          const backlinks = backlinkMap.get(filePath) || [];

          // Only update if there are backlinks to show
          if (backlinks.length === 0) {
            result.skipped++;
            continue;
          }

          const footerContent = this.generateFooterSection(filePath, backlinks);
          const updated = await this.insertOrUpdateFooter(filePath, footerContent);

          if (updated) {
            result.updated++;
          } else {
            result.skipped++;
          }
        } catch (error) {
          const errorMsg = `Error processing ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      result.errors.push(`Fatal error in buildFooters: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Analyze all documents and build reverse link index
   * Returns a map of target file -> array of backlink info
   */
  private async analyzeLinks(documents: string[]): Promise<Map<string, BacklinkInfo[]>> {
    const backlinkMap = new Map<string, BacklinkInfo[]>();

    for (const sourceFile of documents) {
      try {
        const content = await readFile(sourceFile, 'utf-8');
        const links = this.extractLinks(content, sourceFile);

        // Add each link to the backlink map
        for (const link of links) {
          // Resolve target file path relative to source
          const targetPath = this.resolveTargetPath(sourceFile, link.targetFile);

          if (!backlinkMap.has(targetPath)) {
            backlinkMap.set(targetPath, []);
          }

          backlinkMap.get(targetPath)!.push(link);
        }
      } catch (error) {
        console.warn(`Could not analyze links in ${sourceFile}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return backlinkMap;
  }

  /**
   * Extract all wikilinks and markdown links from content
   * Returns array of BacklinkInfo with source, target, link text, and context
   */
  private extractLinks(content: string, sourceFile: string): BacklinkInfo[] {
    const links: BacklinkInfo[] = [];

    // Extract [[wikilinks]] - supports both [[target]] and [[target|display]]
    const wikilinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    let match;

    while ((match = wikilinkRegex.exec(content)) !== null) {
      const targetFile = match[1].trim();
      const linkText = match[2]?.trim() || targetFile;
      const context = this.extractContext(content, match.index);

      links.push({
        sourceFile,
        targetFile: this.normalizeTarget(targetFile),
        linkText,
        context,
      });
    }

    // Extract [markdown](links.md) - only .md files
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

    while ((match = markdownLinkRegex.exec(content)) !== null) {
      const linkText = match[1].trim();
      const targetFile = match[2].trim();
      const context = this.extractContext(content, match.index);

      links.push({
        sourceFile,
        targetFile: this.normalizeTarget(targetFile),
        linkText,
        context,
      });
    }

    return links;
  }

  /**
   * Extract surrounding context for a link (±50 chars)
   */
  private extractContext(content: string, linkIndex: number): string {
    const contextRadius = 50;
    const start = Math.max(0, linkIndex - contextRadius);
    const end = Math.min(content.length, linkIndex + contextRadius);

    let context = content.substring(start, end).trim();

    // Clean up context - remove line breaks and multiple spaces
    context = context.replace(/\s+/g, ' ');

    // Add ellipsis if truncated
    if (start > 0) context = '...' + context;
    if (end < content.length) context = context + '...';

    return context;
  }

  /**
   * Normalize target path - ensure .md extension and clean path
   */
  private normalizeTarget(target: string): string {
    // Remove any anchors (#heading)
    target = target.split('#')[0];

    // Add .md extension if missing
    if (!target.endsWith('.md')) {
      target = `${target}.md`;
    }

    return target;
  }

  /**
   * Resolve target file path relative to source file
   */
  private resolveTargetPath(sourceFile: string, targetFile: string): string {
    const sourceDir = dirname(sourceFile);

    // If target is absolute or starts with /, resolve from vault root
    if (targetFile.startsWith('/')) {
      return resolve(this.context.vaultRoot, targetFile.substring(1));
    }

    // Otherwise resolve relative to source file directory
    const resolved = resolve(sourceDir, targetFile);

    // If resolved path doesn't exist in vault, try finding by filename
    if (!this.context.allFiles.includes(resolved)) {
      const filename = basename(targetFile);
      const found = this.context.allFiles.find(f => basename(f) === filename);
      if (found) {
        return found;
      }
    }

    return resolved;
  }

  /**
   * Generate footer section markdown with backlinks
   */
  private generateFooterSection(filePath: string, backlinks: BacklinkInfo[]): string {
    const sections: string[] = [];

    // Group backlinks by source file
    const bySource = new Map<string, BacklinkInfo[]>();
    for (const link of backlinks) {
      if (!bySource.has(link.sourceFile)) {
        bySource.set(link.sourceFile, []);
      }
      bySource.get(link.sourceFile)!.push(link);
    }

    // Generate Backlinks section
    sections.push('## Backlinks\n');
    sections.push(`This document is referenced by ${bySource.size} other document(s):\n`);

    // Sort sources by path for consistent ordering
    const sortedSources = Array.from(bySource.keys()).sort();

    for (const sourceFile of sortedSources) {
      const sourceLinks = bySource.get(sourceFile)!;
      const relativePath = this.getRelativeWikiLink(filePath, sourceFile);
      const displayName = this.getDisplayName(sourceFile);

      // Create backlink entry with context
      sections.push(`- [[${relativePath}|${displayName}]]`);

      // Add context for first link if available
      if (sourceLinks[0].context) {
        sections.push(`  - Context: "${sourceLinks[0].context}"`);
      }

      sections.push('');
    }

    // Add metadata footer
    sections.push('---');
    sections.push(`*Generated by Weaver Footer Builder on ${new Date().toISOString()}*`);

    return sections.join('\n');
  }

  /**
   * Get relative wikilink path from target to source
   */
  private getRelativeWikiLink(fromFile: string, toFile: string): string {
    const rel = relative(dirname(fromFile), toFile);
    // Remove .md extension for wikilinks
    return rel.replace(/\.md$/, '');
  }

  /**
   * Get display name for a file (title from frontmatter or filename)
   */
  private getDisplayName(filePath: string): string {
    try {
      const content = require('fs').readFileSync(filePath, 'utf-8');
      const parsed = matter(content);

      // Use title from frontmatter if available
      if (parsed.data.title) {
        return String(parsed.data.title);
      }
    } catch {
      // Ignore errors, fall back to filename
    }

    // Convert filename to readable format
    const filename = basename(filePath, '.md');
    return filename
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Insert or update footer in document
   * Preserves frontmatter and existing content
   */
  private async insertOrUpdateFooter(
    filePath: string,
    footerContent: string
  ): Promise<boolean> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const parsed = matter(content);

      // Check if footer already exists
      const footerMarkers = ['## Backlinks', '## References', '## Related Documents'];
      let footerStart = -1;

      for (const marker of footerMarkers) {
        const index = parsed.content.lastIndexOf(marker);
        if (index !== -1) {
          footerStart = index;
          break;
        }
      }

      let newContent: string;

      if (footerStart !== -1) {
        // Replace existing footer
        newContent = parsed.content.substring(0, footerStart).trimEnd() + '\n\n' + footerContent;
      } else {
        // Append new footer
        newContent = parsed.content.trimEnd() + '\n\n' + footerContent;
      }

      // Reconstruct document with frontmatter
      const updated = matter.stringify(newContent, parsed.data);

      // Write only if content changed
      if (updated !== content) {
        await writeFile(filePath, updated, 'utf-8');
        return true;
      }

      return false;
    } catch (error) {
      throw new Error(`Failed to update footer in ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
