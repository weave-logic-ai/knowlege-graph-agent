/**
 * Seed Enhancer - Adds deep analysis to seed generator
 *
 * Enhances the basic seed generator with:
 * - Claude-flow agent integration for intelligent analysis
 * - Ontological mapping to PRIMITIVES.md taxonomy
 * - Deep codebase inspection beyond package.json
 */

import { DeepAnalyzer, type PrimitiveDiscovery, type DeepAnalysisResult } from './deep-analyzer.js';
import { SeedGenerator } from './seed-generator.js';
import type { VaultContext, GeneratedDocument, DocumentMetadata } from './types.js';
import { join } from 'path';

export interface EnhancedSeedOptions {
  /**
   * Enable deep analysis using claude-flow agents
   */
  deepAnalysis?: boolean;

  /**
   * Maximum time to wait for deep analysis (ms)
   */
  analysisTimeout?: number;

  /**
   * Fallback to shallow analysis if deep fails
   */
  fallbackToShallow?: boolean;
}

export class SeedEnhancer {
  private seedGenerator: SeedGenerator;
  private deepAnalyzer: DeepAnalyzer;

  constructor(
    private vaultContext: VaultContext,
    private projectRoot: string,
    private options: EnhancedSeedOptions = {}
  ) {
    this.seedGenerator = new SeedGenerator(vaultContext, projectRoot);
    this.deepAnalyzer = new DeepAnalyzer(projectRoot, vaultContext.vaultRoot);
  }

  /**
   * Generate primitive nodes with optional deep analysis
   */
  async generate(): Promise<GeneratedDocument[]> {
    const documents: GeneratedDocument[] = [];

    // Always run basic seed generation first
    console.log('  📦 Analyzing dependencies...');
    const basicAnalysis = await this.seedGenerator.analyze();
    const basicDocs = await this.seedGenerator.generatePrimitives(basicAnalysis);

    documents.push(...basicDocs);

    console.log(`  ✓ Basic analysis found ${basicDocs.length} primitives`);

    // Optionally run deep analysis
    if (this.options.deepAnalysis !== false) {
      console.log('  🧠 Running deep codebase analysis...');

      try {
        const deepResult = await this.performDeepAnalysis();

        if (deepResult && deepResult.totalCount > 0) {
          const deepDocs = await this.generateFromDeepAnalysis(deepResult);
          documents.push(...deepDocs);

          console.log(`  ✓ Deep analysis found ${deepResult.totalCount} additional primitives`);
          this.printAnalysisSummary(deepResult);
        }
      } catch (error) {
        console.error('  ❌ Deep analysis failed:', error);

        if (!this.options.fallbackToShallow) {
          throw error;
        }
      }
    }

    // Remove duplicates
    const uniqueDocs = this.deduplicateDocuments(documents);

    return uniqueDocs;
  }

  /**
   * Perform deep analysis with timeout
   */
  private async performDeepAnalysis(): Promise<DeepAnalysisResult | null> {
    const timeout = this.options.analysisTimeout || 120000; // 2 min default

    return Promise.race([
      this.deepAnalyzer.analyze(),
      new Promise<null>((resolve) =>
        setTimeout(() => {
          console.log('  ⚠️  Deep analysis timeout, using basic results');
          resolve(null);
        }, timeout)
      )
    ]);
  }

  /**
   * Generate documents from deep analysis discoveries
   */
  private async generateFromDeepAnalysis(result: DeepAnalysisResult): Promise<GeneratedDocument[]> {
    const documents: GeneratedDocument[] = [];

    for (const discovery of result.primitives) {
      const doc = this.createPrimitiveDocument(discovery);
      documents.push(doc);
    }

    return documents;
  }

  /**
   * Create a primitive document from a discovery
   */
  private createPrimitiveDocument(discovery: PrimitiveDiscovery): GeneratedDocument {
    const title = discovery.name;
    const slug = this.slugify(title);
    const category = discovery.category;

    // Build frontmatter
    const frontmatter: DocumentMetadata = {
      title,
      type: 'primitive',
      category,
      status: 'active',
      priority: discovery.priority,
      tags: this.buildTags(discovery),
      documentation: this.buildDocumentation(discovery),
      used_by: [],
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString()
    };

    // Build content
    const content = this.buildContent(discovery);

    // Build path
    const filePath = join(this.vaultContext.vaultRoot, category, `${slug}.md`);

    return {
      type: 'primitive',
      path: filePath,
      title,
      content,
      frontmatter,
      backlinks: []
    };
  }

  /**
   * Build tags from discovery
   */
  private buildTags(discovery: PrimitiveDiscovery): string[] {
    const tags: string[] = [discovery.type];

    // Add category-based tags
    if (discovery.category.includes('integrations')) {
      tags.push('integration');
    }
    if (discovery.category.includes('schemas')) {
      tags.push('data-model');
    }
    if (discovery.category.includes('patterns')) {
      tags.push('pattern');
    }
    if (discovery.category.includes('protocols')) {
      tags.push('protocol');
    }

    // Add priority tag
    tags.push(`priority-${discovery.priority}` as string);

    // Add dependency tags
    if (discovery.dependencies) {
      const depTags = discovery.dependencies.slice(0, 3).map(dep =>
        this.slugify(dep)
      );
      tags.push(...depTags);
    }

    return [...new Set(tags)]; // Deduplicate
  }

  /**
   * Build documentation links from discovery
   */
  private buildDocumentation(discovery: PrimitiveDiscovery): string[] | undefined {
    const docs: string[] = [];

    // Add npm links for packages
    if (discovery.dependencies) {
      for (const dep of discovery.dependencies) {
        if (dep.startsWith('@') || dep.includes('/')) {
          docs.push(`https://www.npmjs.com/package/${dep}`);
        }
      }
    }

    return docs.length > 0 ? docs : undefined;
  }

  /**
   * Build markdown content from discovery
   */
  private buildContent(discovery: PrimitiveDiscovery): string {
    const lines: string[] = [];

    lines.push(`# ${discovery.name}`);
    lines.push('');
    lines.push(discovery.description);
    lines.push('');

    // Overview section
    lines.push('## Overview');
    lines.push('');
    lines.push(`**Type:** ${discovery.type}`);
    lines.push(`**Category:** ${discovery.category}`);
    lines.push(`**Priority:** ${discovery.priority}`);
    lines.push('');

    // Files section
    if (discovery.files && discovery.files.length > 0) {
      lines.push('## Implementation Files');
      lines.push('');
      for (const file of discovery.files) {
        lines.push(`- \`${file}\``);
      }
      lines.push('');
    }

    // Dependencies section
    if (discovery.dependencies && discovery.dependencies.length > 0) {
      lines.push('## Dependencies');
      lines.push('');
      for (const dep of discovery.dependencies) {
        lines.push(`- [[${this.slugify(dep)}|${dep}]]`);
      }
      lines.push('');
    }

    // Usage section
    if (discovery.usage) {
      lines.push('## Usage');
      lines.push('');
      lines.push(discovery.usage);
      lines.push('');
    }

    // Documentation section
    const docs = this.buildDocumentation(discovery);
    if (docs && docs.length > 0) {
      lines.push('## Documentation');
      lines.push('');
      for (const doc of docs) {
        const label = doc.includes('npmjs.com') ? 'NPM' : 'Docs';
        lines.push(`- [${label}](${doc})`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Remove duplicate documents
   */
  private deduplicateDocuments(documents: GeneratedDocument[]): GeneratedDocument[] {
    const seen = new Set<string>();
    const unique: GeneratedDocument[] = [];

    for (const doc of documents) {
      const key = `${doc.path}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(doc);
      }
    }

    return unique;
  }

  /**
   * Print analysis summary
   */
  private printAnalysisSummary(result: DeepAnalysisResult): void {
    console.log('');
    console.log('  📊 Analysis Breakdown:');

    // By priority
    if (Object.keys(result.byPriority).length > 0) {
      console.log('  Priority distribution:');
      for (const [priority, count] of Object.entries(result.byPriority).sort((a, b) => b[1] - a[1])) {
        console.log(`    - ${priority}: ${count}`);
      }
    }

    // By category
    if (Object.keys(result.byCategory).length > 0) {
      console.log('  Category distribution:');
      const topCategories = Object.entries(result.byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      for (const [category, count] of topCategories) {
        console.log(`    - ${category}: ${count}`);
      }
    }

    console.log('');
  }

  /**
   * Slugify string for filenames
   */
  private slugify(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
