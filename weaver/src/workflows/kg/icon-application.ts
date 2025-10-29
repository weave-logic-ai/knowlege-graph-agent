/**
 * Icon Application Workflow
 *
 * Automatically applies visual icons to markdown files based on:
 * - File path patterns
 * - Document type, status, priority
 * - Existing tags and metadata
 *
 * Modes:
 * - incremental: Process only new/modified files since last run
 * - full: Process all files in the vault
 * - watch: Continuous monitoring and application
 */

import { readFile, writeFile, stat } from 'fs/promises';
import fg from 'fast-glob';
import matter from 'gray-matter';
import path from 'path';
import chokidar from 'chokidar';

export interface IconMapping {
  pattern: RegExp | string;
  icon: string;
  cssClass?: string;
  description?: string;
  priority?: number; // Higher priority wins
}

export interface IconApplicationConfig {
  rootDir: string;
  mode: 'incremental' | 'full' | 'watch';
  lastRunFile?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  dryRun?: boolean;
}

export interface IconApplicationResult {
  filesProcessed: number;
  filesUpdated: number;
  filesSkipped: number;
  errors: Array<{ file: string; error: string }>;
  duration: number;
}

/**
 * Icon Mappings - Priority ordered (higher priority first)
 */
export const PATH_ICON_MAPPINGS: IconMapping[] = [
  // Hub files (highest priority)
  { pattern: /-hub\.md$/, icon: '🌐', cssClass: 'type-hub', priority: 100 },
  { pattern: /-index\.md$/, icon: '🌐', cssClass: 'type-hub', priority: 100 },

  // Type-based (path patterns)
  { pattern: /_planning\//, icon: '📋', cssClass: 'type-planning', priority: 50 },
  { pattern: /architecture\//, icon: '🏗️', cssClass: 'type-architecture', priority: 50 },
  { pattern: /research\//, icon: '🔬', cssClass: 'type-research', priority: 50 },
  { pattern: /tests?\//, icon: '✅', cssClass: 'type-testing', priority: 50 },
  { pattern: /docs\//, icon: '📚', cssClass: 'type-documentation', priority: 50 },
  { pattern: /weaver\/src\//, icon: '⚙️', cssClass: 'type-implementation', priority: 50 },
  { pattern: /workflows\//, icon: '🔄', cssClass: 'type-workflow', priority: 50 },
  { pattern: /decisions\//, icon: '⚖️', cssClass: 'type-decision', priority: 50 },
  { pattern: /integrations\//, icon: '🔌', cssClass: 'type-integration', priority: 50 },
  { pattern: /infrastructure\//, icon: '🏭', cssClass: 'type-infrastructure', priority: 50 },
  { pattern: /business\//, icon: '💼', cssClass: 'type-business', priority: 50 },
  { pattern: /concepts\//, icon: '💡', cssClass: 'type-concept', priority: 50 },
  { pattern: /templates\//, icon: '📄', cssClass: 'type-template', priority: 50 },
  { pattern: /_log\/|daily\//, icon: '📅', cssClass: 'type-timeline', priority: 50 },
  { pattern: /_sops?\//, icon: '📝', cssClass: 'type-sop', priority: 50 },
  { pattern: /\.archive\//, icon: '📦', cssClass: 'status-archived', priority: 40 },
];

export const TAG_ICON_MAPPINGS: Record<string, string> = {
  // Status
  'status/complete': '✅',
  'status/in-progress': '🔄',
  'status/blocked': '🚫',
  'status/planned': '📋',
  'status/draft': '✏️',
  'status/review': '👁️',
  'status/archived': '📦',
  'status/deprecated': '⚠️',

  // Priority
  'priority/critical': '🔴',
  'priority/high': '🟡',
  'priority/medium': '🔵',
  'priority/low': '⚪',

  // Phase
  'phase/phase-12': '🔮',
  'phase/phase-13': '🧠',
  'phase/phase-14': '🎨',
  'phase/phase-15': '🚀',

  // Type (backup if path doesn't match)
  'type/planning': '📋',
  'type/implementation': '⚙️',
  'type/research': '🔬',
  'type/architecture': '🏗️',
  'type/testing': '✅',
  'type/documentation': '📚',
  'type/hub': '🌐',
  'type/sop': '📝',
};

export class IconApplicationWorkflow {
  private config: IconApplicationConfig;
  private lastRunTimestamp: number = 0;

  constructor(config: IconApplicationConfig) {
    this.config = config;
  }

  /**
   * Determine icon for a file based on priority-ordered rules
   */
  private determineIcon(filePath: string, frontmatter: any): string | null {
    // Skip if icon already exists
    if (frontmatter.visual?.icon) {
      return null;
    }

    let bestMatch: { icon: string; priority: number } | null = null;

    // Check tags first (high priority)
    const tags = frontmatter.tags || [];
    const tagList = Array.isArray(tags) ? tags : [tags];

    for (const tag of tagList) {
      const tagStr = String(tag);
      if (TAG_ICON_MAPPINGS[tagStr]) {
        return TAG_ICON_MAPPINGS[tagStr]; // Tags win over path patterns
      }
    }

    // Check path patterns (priority ordered)
    for (const mapping of PATH_ICON_MAPPINGS) {
      const priority = mapping.priority || 0;
      const matches =
        typeof mapping.pattern === 'string'
          ? filePath.includes(mapping.pattern)
          : mapping.pattern.test(filePath);

      if (matches) {
        if (!bestMatch || priority > bestMatch.priority) {
          bestMatch = { icon: mapping.icon, priority };
        }
      }
    }

    if (bestMatch) {
      return bestMatch.icon;
    }

    // Check document type in frontmatter
    const type = frontmatter.type;
    if (type) {
      const typeTag = `type/${type}`;
      if (TAG_ICON_MAPPINGS[typeTag]) {
        return TAG_ICON_MAPPINGS[typeTag];
      }
    }

    return null;
  }

  /**
   * Determine CSS classes based on metadata
   */
  private determineCssClasses(filePath: string, frontmatter: any): string[] {
    const classes: string[] = [];

    if (frontmatter.type) classes.push(`type-${frontmatter.type}`);
    if (frontmatter.status) classes.push(`status-${frontmatter.status}`);
    if (frontmatter.priority) classes.push(`priority-${frontmatter.priority}`);

    const tags = frontmatter.tags || [];
    const tagList = Array.isArray(tags) ? tags : [tags];

    for (const tag of tagList) {
      const tagStr = String(tag);
      if (tagStr.startsWith('phase/')) {
        classes.push(tagStr.replace('/', '-'));
      }
    }

    return classes;
  }

  /**
   * Process a single file
   */
  private async processFile(filePath: string): Promise<boolean> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const { data: frontmatter, content: markdownContent } = matter(content);

      const icon = this.determineIcon(filePath, frontmatter);
      if (!icon) {
        return false; // No changes needed
      }

      const cssClasses = this.determineCssClasses(filePath, frontmatter);

      // Add visual metadata
      if (!frontmatter.visual) {
        frontmatter.visual = {};
      }

      frontmatter.visual.icon = icon;

      // Merge CSS classes
      if (cssClasses.length > 0) {
        const existingClasses = frontmatter.cssclasses || frontmatter.visual.cssclasses || [];
        const mergedClasses = [...new Set([...existingClasses, ...cssClasses])];
        frontmatter.visual.cssclasses = mergedClasses;
      }

      // Update modified date
      if (frontmatter.updated_date) {
        frontmatter.updated_date = new Date().toISOString();
      }

      // Write back
      if (!this.config.dryRun) {
        // Stringify with custom options to preserve emoji characters
        const updatedContent = matter.stringify(markdownContent, frontmatter, {
          // Ensure emojis aren't escaped to unicode
          lineWidth: -1,
        });
        await writeFile(filePath, updatedContent, 'utf-8');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Load last run timestamp
   */
  private async loadLastRunTimestamp(): Promise<void> {
    if (!this.config.lastRunFile) return;

    try {
      const content = await readFile(this.config.lastRunFile, 'utf-8');
      this.lastRunTimestamp = parseInt(content.trim(), 10);
    } catch {
      this.lastRunTimestamp = 0; // First run
    }
  }

  /**
   * Save last run timestamp
   */
  private async saveLastRunTimestamp(): Promise<void> {
    if (!this.config.lastRunFile || this.config.dryRun) return;

    try {
      await writeFile(this.config.lastRunFile, String(Date.now()), 'utf-8');
    } catch (error) {
      console.warn('Failed to save last run timestamp:', error);
    }
  }

  /**
   * Check if file was modified since last run
   */
  private async wasModifiedSinceLastRun(filePath: string): Promise<boolean> {
    if (this.config.mode === 'full') return true;
    if (this.lastRunTimestamp === 0) return true;

    try {
      const stats = await stat(filePath);
      return stats.mtimeMs > this.lastRunTimestamp;
    } catch {
      return true; // Process if we can't check
    }
  }

  /**
   * Run icon application workflow
   */
  async run(): Promise<IconApplicationResult> {
    const startTime = Date.now();
    const result: IconApplicationResult = {
      filesProcessed: 0,
      filesUpdated: 0,
      filesSkipped: 0,
      errors: [],
      duration: 0,
    };

    // Load last run timestamp for incremental mode
    await this.loadLastRunTimestamp();

    // Build glob patterns
    const includePattern = this.config.includePatterns?.join(',') || '**/*.md';
    const pattern = `${this.config.rootDir}/${includePattern}`;

    const defaultExcludes = [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
    ];
    const ignorePatterns = [...defaultExcludes, ...(this.config.excludePatterns || [])];

    // Find files
    const files = await fg(pattern, { ignore: ignorePatterns });

    // Process files
    for (const file of files) {
      result.filesProcessed++;

      // Skip if not modified (incremental mode)
      const wasModified = await this.wasModifiedSinceLastRun(file);
      if (!wasModified) {
        result.filesSkipped++;
        continue;
      }

      try {
        const updated = await this.processFile(file);
        if (updated) {
          result.filesUpdated++;
        } else {
          result.filesSkipped++;
        }
      } catch (error) {
        result.errors.push({
          file,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Save timestamp
    await this.saveLastRunTimestamp();

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Watch mode - continuously monitor and apply icons
   */
  async watch(callback?: (file: string, updated: boolean) => void): Promise<void> {
    const watcher = chokidar.watch(`${this.config.rootDir}/**/*.md`, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        ...(this.config.excludePatterns || []),
      ],
      persistent: true,
      ignoreInitial: false,
    });

    watcher.on('add', async (filePath) => {
      try {
        const updated = await this.processFile(filePath);
        callback?.(filePath, updated);
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    });

    watcher.on('change', async (filePath) => {
      try {
        const updated = await this.processFile(filePath);
        callback?.(filePath, updated);
      } catch (error) {
        console.error(`Error processing ${filePath}:`, error);
      }
    });

    console.log('👁️  Watching for file changes...');
  }
}

/**
 * CLI Entry Point
 */
export async function runIconApplicationWorkflow(
  mode: 'incremental' | 'full' | 'watch' = 'incremental',
  dryRun: boolean = false
): Promise<IconApplicationResult> {
  const config: IconApplicationConfig = {
    rootDir: '/home/aepod/dev/weave-nn/weave-nn',
    mode,
    lastRunFile: '/home/aepod/dev/weave-nn/weaver/.graph-data/icon-last-run.txt',
    dryRun,
  };

  const workflow = new IconApplicationWorkflow(config);

  if (mode === 'watch') {
    await workflow.watch((file, updated) => {
      if (updated) {
        console.log(`✅ Updated icons: ${path.basename(file)}`);
      }
    });
    return {
      filesProcessed: 0,
      filesUpdated: 0,
      filesSkipped: 0,
      errors: [],
      duration: 0,
    };
  }

  return await workflow.run();
}
