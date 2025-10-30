/**
 * Cultivation Engine - Main Orchestration
 *
 * Coordinates all cultivation modules to process a vault:
 * - Discovery of markdown files
 * - Context loading (primitives, features, tech-specs)
 * - Frontmatter generation and updates
 * - Document gap analysis and generation
 * - Footer building for backlinks
 * - Comprehensive reporting
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { ContextLoader } from './context-loader.js';
import { FrontmatterGenerator } from './frontmatter-generator.js';
import { DocumentGenerator } from './document-generator.js';
import { AgentOrchestrator } from './agent-orchestrator.js';
import { FooterBuilder } from './footer-builder.js';
import { SeedGenerator } from './seed-generator.js';
import { SeedEnhancer } from './seed-enhancer.js';
import type {
  VaultContext,
  GeneratedDocument
} from './types.js';

/**
 * Configuration options for cultivation process
 */
export interface CultivationOptions {
  /** Target directory containing markdown files */
  targetDirectory: string;
  /** If true, don't write any files (preview mode) */
  dryRun: boolean;
  /** If true, process all files regardless of modified status */
  force: boolean;
  /** If true, skip files that haven't been modified */
  skipUnmodified: boolean;
  /** If true, generate missing documents */
  generateMissing: boolean;
  /** If true, build footer backlink sections */
  buildFooters: boolean;
  /** If true, use AI agents for document generation */
  useAgents: boolean;
  /** Agent execution mode */
  agentMode: 'sequential' | 'parallel' | 'adaptive';
  /** Maximum number of concurrent agents */
  maxAgents: number;
  /** If true, seed vault with primitives from codebase analysis */
  seed: boolean;
  /** If true, use deep codebase analysis with claude-flow agents */
  deepAnalysis?: boolean;
  /** Project root for seed analysis (defaults to targetDirectory) */
  projectRoot?: string;
  /** If true, output detailed logging */
  verbose: boolean;
}

/**
 * Result of file discovery phase
 */
export interface DiscoveryResult {
  /** Total markdown files found */
  totalFiles: number;
  /** Files with existing frontmatter */
  withFrontmatter: number;
  /** Files without frontmatter */
  withoutFrontmatter: number;
  /** Files marked as modified (updated field changed) */
  modified: number;
  /** Files not modified since last processing */
  unmodified: number;
  /** Files that need processing based on options */
  needsProcessing: number;
  /** List of file paths */
  files: string[];
}

/**
 * Result of frontmatter generation phase
 */
export interface FrontmatterResult {
  /** Number of files processed */
  processed: number;
  /** Number of files actually updated */
  updated: number;
  /** Number of files skipped */
  skipped: number;
  /** Number of errors encountered */
  errors: number;
  /** Error messages */
  errorMessages: string[];
}

/**
 * Result of document generation phase
 */
export interface GenerationResult {
  /** Number of documents created */
  created: number;
  /** List of generated documents */
  documents: GeneratedDocument[];
  /** Error messages */
  errors: string[];
}

/**
 * Result of footer building phase
 */
export interface FooterBuildResult {
  /** Number of files updated with footers */
  updated: number;
  /** Number of files skipped */
  skipped: number;
  /** Error messages */
  errors: string[];
}

/**
 * Comprehensive cultivation report
 */
export interface CultivationReport {
  /** Configuration used */
  options: CultivationOptions;
  /** Timestamp of cultivation run */
  timestamp: string;
  /** Total processing time in milliseconds */
  duration: number;
  /** Discovery phase results */
  discovery: DiscoveryResult;
  /** Frontmatter phase results */
  frontmatter: FrontmatterResult;
  /** Document generation phase results */
  generation: GenerationResult;
  /** Footer building phase results */
  footers: FooterBuildResult;
  /** Seed generation phase results */
  seed: GenerationResult;
  /** Overall success status */
  success: boolean;
  /** All warnings accumulated */
  warnings: string[];
  /** All errors accumulated */
  errors: string[];
}

/**
 * Main Cultivation Engine
 *
 * Orchestrates the entire vault cultivation process.
 */
export class CultivationEngine {
  private options: CultivationOptions;
  private contextLoader: ContextLoader;
  private frontmatterGenerator?: FrontmatterGenerator;
  private documentGenerator?: DocumentGenerator;
  private agentOrchestrator?: AgentOrchestrator;
  private footerBuilder?: FooterBuilder;
  private seedGenerator?: SeedGenerator;
  private seedEnhancer?: SeedEnhancer;

  private startTime: number = 0;
  private warnings: string[] = [];
  private errors: string[] = [];
  private vaultContext?: VaultContext;

  // Phase results
  private discoveryResult?: DiscoveryResult;
  private frontmatterResult?: FrontmatterResult;
  private generationResult?: GenerationResult;
  private footerResult?: FooterBuildResult;
  private seedResult?: GenerationResult;

  constructor(options: CultivationOptions) {
    this.options = options;
    this.startTime = Date.now();

    // Only initialize context loader
    this.contextLoader = new ContextLoader(options.targetDirectory);
  }

  /**
   * Initialize modules after context is loaded
   */
  private initializeModules(context: VaultContext): void {
    if (!this.frontmatterGenerator) {
      this.frontmatterGenerator = new FrontmatterGenerator(context, this.options.useAgents);
    }
    if (!this.documentGenerator) {
      this.documentGenerator = new DocumentGenerator(context, this.options.useAgents);
    }
    if (!this.agentOrchestrator) {
      this.agentOrchestrator = new AgentOrchestrator(context);
    }
    if (!this.footerBuilder) {
      this.footerBuilder = new FooterBuilder(context);
    }
    if (!this.seedGenerator && this.options.seed) {
      const projectRoot = this.options.projectRoot || this.options.targetDirectory;

      if (this.options.deepAnalysis) {
        // Use enhanced seed generator with deep analysis
        this.seedEnhancer = new SeedEnhancer(context, projectRoot, {
          deepAnalysis: true,
          analysisTimeout: 120000,
          fallbackToShallow: true
        });
      } else {
        // Use basic seed generator
        this.seedGenerator = new SeedGenerator(context, projectRoot);
      }
    }
  }

  /**
   * Discover all markdown files in the target directory
   */
  async discover(): Promise<DiscoveryResult> {
    this.log('🔍 Discovering markdown files...');

    const files = await this.findMarkdownFiles(this.options.targetDirectory);

    let withFrontmatter = 0;
    let withoutFrontmatter = 0;
    let modified = 0;
    let unmodified = 0;
    let needsProcessing = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const { data } = matter(content);

        if (Object.keys(data).length > 0) {
          withFrontmatter++;

          // Check if file has been modified
          if (data.updated) {
            modified++;
          } else {
            unmodified++;
          }
        } else {
          withoutFrontmatter++;
          needsProcessing++;
        }

        // Determine if file needs processing
        if (this.options.force || !data.updated || Object.keys(data).length === 0) {
          if (!this.options.skipUnmodified || !data.updated) {
            needsProcessing++;
          }
        }
      } catch (error) {
        this.addError(`Failed to read ${file}: ${error}`);
      }
    }

    const result: DiscoveryResult = {
      totalFiles: files.length,
      withFrontmatter,
      withoutFrontmatter,
      modified,
      unmodified,
      needsProcessing,
      files
    };

    this.discoveryResult = result;

    this.log(`  Found ${result.totalFiles} files`);
    this.log(`  ${result.withFrontmatter} with frontmatter, ${result.withoutFrontmatter} without`);
    this.log(`  ${result.needsProcessing} need processing`);

    return result;
  }

  /**
   * Load vault context (primitives, features, tech-specs)
   */
  async loadContext(): Promise<VaultContext> {
    this.log('📚 Loading vault context...');

    const context = await this.contextLoader.loadContext();
    this.vaultContext = context;

    // Initialize modules now that we have context
    this.initializeModules(context);

    const hasFiles = [context.primitives, context.features, context.techSpecs].filter(Boolean).length;
    this.log(`  Loaded context from ${hasFiles} reference files`);
    this.log(`  Found ${context.allFiles.length} markdown files`);

    return context;
  }

  /**
   * Generate and update frontmatter for all documents
   */
  async generateFrontmatter(): Promise<FrontmatterResult> {
    this.log('✨ Generating frontmatter...');

    if (!this.vaultContext) {
      throw new Error('Must call loadContext() before generateFrontmatter()');
    }

    if (!this.frontmatterGenerator) {
      this.initializeModules(this.vaultContext);
    }

    if (!this.discoveryResult) {
      throw new Error('Must run discover() before generateFrontmatter()');
    }

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    const errorMessages: string[] = [];

    for (const filePath of this.discoveryResult.files) {
      try {
        processed++;

        // Analyze document and get suggested frontmatter
        const analysis = await this.frontmatterGenerator!.analyzeDocument(filePath);

        // Skip if unmodified and skipUnmodified is set
        if (this.options.skipUnmodified && !analysis.isModified && analysis.existingFrontmatter) {
          skipped++;
          continue;
        }

        // Skip if no frontmatter needed and not forcing
        if (!this.options.force && !analysis.needsFrontmatter && !analysis.isModified) {
          skipped++;
          continue;
        }

        if (!this.options.dryRun) {
          // Write updated file with new frontmatter
          const content = await fs.readFile(filePath, 'utf-8');
          const parsed = matter(content);
          const newContent = matter.stringify(parsed.content, analysis.suggestedFrontmatter);
          await fs.writeFile(filePath, newContent, 'utf-8');
        }

        updated++;
        this.log(`  Updated: ${path.relative(this.options.targetDirectory, filePath)}`);
      } catch (error) {
        const msg = `Failed to process ${filePath}: ${error}`;
        errorMessages.push(msg);
        this.addError(msg);
      }
    }

    const result: FrontmatterResult = {
      processed,
      updated,
      skipped,
      errors: errorMessages.length,
      errorMessages
    };

    this.frontmatterResult = result;

    this.log(`  Processed ${processed} files`);
    this.log(`  Updated ${updated} files`);
    this.log(`  Skipped ${skipped} files`);
    if (result.errors > 0) {
      this.log(`  ⚠️  ${result.errors} errors`);
    }

    return result;
  }

  /**
   * Generate missing documents based on gap analysis
   */
  async generateDocuments(): Promise<GenerationResult> {
    this.log('📝 Generating missing documents...');

    if (!this.options.generateMissing) {
      this.log('  Skipped (generateMissing=false)');
      return {
        created: 0,
        documents: [],
        errors: []
      };
    }

    if (!this.vaultContext) {
      throw new Error('Must call loadContext() before generateDocuments()');
    }

    if (!this.documentGenerator) {
      this.initializeModules(this.vaultContext);
    }

    // Analyze gaps
    const gaps = await this.documentGenerator!.analyzeGaps();
    const totalGaps = gaps.missingConcepts.length +
                      gaps.missingFeatures.length +
                      gaps.missingArchitecture.length +
                      gaps.missingIntegrations.length;

    this.log(`  Found ${totalGaps} missing documents`);

    // Generate missing documents
    const documents = await this.documentGenerator!.generateMissingDocuments(gaps, this.options.dryRun);

    const result: GenerationResult = {
      created: documents.length,
      documents,
      errors: []
    };

    this.generationResult = result;

    this.log(`  Generated ${documents.length} documents`);
    if (this.options.dryRun) {
      this.log('  (dry run - no files written)');
    }

    return result;
  }

  /**
   * Build footer sections with backlinks
   */
  async buildFooters(): Promise<FooterBuildResult> {
    this.log('🔗 Building footers...');

    if (!this.options.buildFooters) {
      this.log('  Skipped (buildFooters=false)');
      return {
        updated: 0,
        skipped: 0,
        errors: []
      };
    }

    if (!this.vaultContext) {
      throw new Error('Must call loadContext() before buildFooters()');
    }

    if (!this.footerBuilder) {
      this.initializeModules(this.vaultContext);
    }

    if (!this.discoveryResult) {
      throw new Error('Must run discover() before buildFooters()');
    }

    // Use footer builder to build all footers
    const result = await this.footerBuilder!.buildFooters(this.discoveryResult.files);

    this.footerResult = result;

    this.log(`  Updated ${result.updated} footers`);
    this.log(`  Skipped ${result.skipped} files`);
    if (result.errors.length > 0) {
      this.log(`  ⚠️  ${result.errors.length} errors`);
      result.errors.forEach(err => this.addError(err));
    }

    return result;
  }

  /**
   * Seed vault with primitive nodes from codebase analysis
   */
  async seedPrimitives(): Promise<GenerationResult> {
    this.log('🌱 Seeding primitives from codebase...');

    if (!this.options.seed) {
      this.log('  Skipped (seed=false)');
      return {
        created: 0,
        documents: [],
        errors: []
      };
    }

    if (!this.vaultContext) {
      throw new Error('Must call loadContext() before seedPrimitives()');
    }

    if (!this.seedGenerator && !this.seedEnhancer) {
      this.initializeModules(this.vaultContext);
    }

    let documents: GeneratedDocument[];

    // Use seed enhancer if deep analysis is enabled
    if (this.seedEnhancer) {
      this.log('  Running deep codebase analysis with claude-flow agents...');
      documents = await this.seedEnhancer.generate();
    } else {
      // Fallback to basic seed generator
      this.log('  Analyzing dependency files...');
      const analysis = await this.seedGenerator!.analyze();

      this.log(`  Found ${analysis.dependencies.length} dependencies`);
      this.log(`  Found ${analysis.frameworks.length} frameworks`);
      this.log(`  Found ${analysis.services.length} services`);
      this.log(`  Found ${analysis.languages.length} languages`);

      // Generate primitive nodes
      this.log('  Generating primitive nodes...');
      documents = await this.seedGenerator!.generatePrimitives(analysis);
    }

    // Write documents
    if (!this.options.dryRun) {
      for (const doc of documents) {
        try {
          await fs.mkdir(path.dirname(doc.path), { recursive: true });

          // Filter out undefined values from frontmatter (gray-matter can't serialize undefined)
          const cleanFrontmatter = Object.fromEntries(
            Object.entries(doc.frontmatter).filter(([_, v]) => v !== undefined)
          );

          const fullContent = matter.stringify(doc.content, cleanFrontmatter);
          await fs.writeFile(doc.path, fullContent, 'utf-8');
          this.log(`  Created: ${path.relative(this.options.targetDirectory, doc.path)}`);
        } catch (error) {
          const msg = `Failed to write ${doc.path}: ${error}`;
          this.addError(msg);
        }
      }
    }

    const result: GenerationResult = {
      created: documents.length,
      documents,
      errors: []
    };

    this.seedResult = result;

    this.log(`  Generated ${documents.length} primitive nodes`);
    if (this.options.dryRun) {
      this.log('  (dry run - no files written)');
    }

    return result;
  }

  /**
   * Get comprehensive cultivation report
   */
  async getReport(): Promise<CultivationReport> {
    const duration = Date.now() - this.startTime;

    return {
      options: this.options,
      timestamp: new Date().toISOString(),
      duration,
      discovery: this.discoveryResult || {
        totalFiles: 0,
        withFrontmatter: 0,
        withoutFrontmatter: 0,
        modified: 0,
        unmodified: 0,
        needsProcessing: 0,
        files: []
      },
      frontmatter: this.frontmatterResult || {
        processed: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        errorMessages: []
      },
      generation: this.generationResult || {
        created: 0,
        documents: [],
        errors: []
      },
      footers: this.footerResult || {
        updated: 0,
        skipped: 0,
        errors: []
      },
      seed: this.seedResult || {
        created: 0,
        documents: [],
        errors: []
      },
      success: this.errors.length === 0,
      warnings: this.warnings,
      errors: this.errors
    };
  }

  /**
   * Save report to file
   */
  async saveReport(outputPath: string): Promise<void> {
    const report = await this.getReport();
    await fs.writeFile(
      outputPath,
      JSON.stringify(report, null, 2),
      'utf-8'
    );
    this.log(`📊 Report saved to ${outputPath}`);
  }

  /**
   * Run the complete cultivation process
   */
  async run(): Promise<CultivationReport> {
    this.startTime = Date.now();

    this.log('🌱 Starting cultivation process...');
    this.log(`  Target: ${this.options.targetDirectory}`);
    this.log(`  Dry run: ${this.options.dryRun}`);
    this.log('');

    try {
      // Phase 1: Discovery
      await this.discover();
      this.log('');

      // Phase 2: Frontmatter generation
      await this.generateFrontmatter();
      this.log('');

      // Phase 3: Document generation
      await this.generateDocuments();
      this.log('');

      // Phase 4: Footer building
      await this.buildFooters();
      this.log('');

      const report = await this.getReport();

      this.log('✅ Cultivation complete!');
      this.log(`  Duration: ${(report.duration / 1000).toFixed(2)}s`);
      this.log(`  Success: ${report.success}`);

      return report;
    } catch (error) {
      this.addError(`Cultivation failed: ${error}`);
      throw error;
    }
  }

  // Helper methods

  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden directories and node_modules
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...await this.findMarkdownFiles(fullPath));
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private hasChanged(oldData: any, newData: any): boolean {
    // Deep comparison of frontmatter objects
    const oldKeys = Object.keys(oldData).sort();
    const newKeys = Object.keys(newData).sort();

    if (oldKeys.length !== newKeys.length) return true;

    for (const key of newKeys) {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        return true;
      }
    }

    return false;
  }

  private async buildLinkGraph(): Promise<Map<string, Set<string>>> {
    const graph = new Map<string, Set<string>>();

    if (!this.discoveryResult) {
      return graph;
    }

    // Build forward links
    for (const filePath of this.discoveryResult.files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const links = this.extractWikiLinks(content);

        for (const link of links) {
          if (!graph.has(link)) {
            graph.set(link, new Set());
          }
          graph.get(link)!.add(filePath);
        }
      } catch (error) {
        this.addWarning(`Failed to build link graph for ${filePath}: ${error}`);
      }
    }

    return graph;
  }

  private extractWikiLinks(content: string): string[] {
    const wikiLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    const links: string[] = [];
    let match;

    while ((match = wikiLinkRegex.exec(content)) !== null) {
      links.push(match[1]);
    }

    return links;
  }

  private log(message: string): void {
    if (this.options.verbose) {
      console.log(message);
    }
  }

  private addWarning(message: string): void {
    this.warnings.push(message);
    if (this.options.verbose) {
      console.warn(`⚠️  ${message}`);
    }
  }

  private addError(message: string): void {
    this.errors.push(message);
    if (this.options.verbose) {
      console.error(`❌ ${message}`);
    }
  }
}
