# Feature Specification: Hive Mind Reconnection Tools

**Spec ID**: SPEC-003
**Priority**: CRITICAL
**Estimated Effort**: 16-24 hours (4 tools x 4-6 hours each)
**Dependencies**: None (standalone tools)

## Overview

Implement 4 CLI tools for knowledge graph reconnection as specified in `docs/hive-mind/reconnection-strategy.md`. These tools address the 88.1% orphan rate in documentation vaults by analyzing, validating, and enriching markdown files.

## Current State

### Problem
Documentation vaults have high orphan rates (nodes with no connections), making knowledge discovery difficult. The reconnection strategy document specifies 4 tools that are NOT implemented.

### Target Metrics
- Reduce orphan rate from 88.1% to < 10%
- Increase link density from 1.08 to > 5.0
- Create hub documents for navigation

---

## Tool Specifications

### TOOL-001: analyze-links.ts

**Purpose**: Parse markdown files to extract [[wiki-links]] and relative paths, generating an adjacency list of document connections.

**File**: `src/tools/analyze-links.ts`

#### Command Interface

```bash
kg analyze-links [options] <vault-path>

Options:
  --output <format>    Output format: json | csv | mermaid (default: json)
  --include-orphans    Include orphaned nodes in output
  --min-connections    Minimum connections to include (default: 0)
  --exclude <pattern>  Glob patterns to exclude
  --verbose            Show detailed progress
```

#### Implementation

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

interface LinkAnalysis {
  source: string;
  target: string;
  type: 'wikilink' | 'relative' | 'external';
  context: string; // Surrounding text
  lineNumber: number;
}

interface AnalysisResult {
  adjacencyList: Map<string, string[]>;
  orphans: string[];
  hubs: string[]; // Nodes with > 5 connections
  statistics: {
    totalFiles: number;
    totalLinks: number;
    avgLinksPerFile: number;
    orphanRate: number;
    linkDensity: number;
  };
}

export class LinkAnalyzer {
  private readonly WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  private readonly RELATIVE_LINK_REGEX = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

  /**
   * Analyze all markdown files in a vault
   */
  async analyzeVault(vaultPath: string, options: AnalyzeOptions): Promise<AnalysisResult> {
    const files = await glob('**/*.md', {
      cwd: vaultPath,
      ignore: options.exclude ?? ['**/node_modules/**'],
    });

    const adjacencyList = new Map<string, string[]>();
    const allLinks: LinkAnalysis[] = [];

    for (const file of files) {
      const content = await fs.readFile(path.join(vaultPath, file), 'utf-8');
      const links = this.extractLinks(content, file);
      allLinks.push(...links);

      // Build adjacency list
      const targets = links.map((l) => l.target);
      adjacencyList.set(file, targets);
    }

    // Identify orphans (no incoming or outgoing links)
    const filesWithIncoming = new Set(allLinks.map((l) => l.target));
    const orphans = files.filter(
      (f) => !filesWithIncoming.has(f) && (adjacencyList.get(f)?.length ?? 0) === 0
    );

    // Identify hubs (> 5 connections)
    const connectionCounts = new Map<string, number>();
    for (const [source, targets] of adjacencyList) {
      connectionCounts.set(source, (connectionCounts.get(source) ?? 0) + targets.length);
      for (const target of targets) {
        connectionCounts.set(target, (connectionCounts.get(target) ?? 0) + 1);
      }
    }
    const hubs = [...connectionCounts.entries()]
      .filter(([_, count]) => count > 5)
      .map(([file]) => file);

    return {
      adjacencyList,
      orphans,
      hubs,
      statistics: {
        totalFiles: files.length,
        totalLinks: allLinks.length,
        avgLinksPerFile: allLinks.length / files.length,
        orphanRate: orphans.length / files.length,
        linkDensity: allLinks.length / files.length,
      },
    };
  }

  private extractLinks(content: string, sourceFile: string): LinkAnalysis[] {
    const links: LinkAnalysis[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract wikilinks
      let match: RegExpExecArray | null;
      while ((match = this.WIKILINK_REGEX.exec(line)) !== null) {
        links.push({
          source: sourceFile,
          target: this.resolveWikilink(match[1]),
          type: 'wikilink',
          context: line.trim(),
          lineNumber: i + 1,
        });
      }

      // Extract relative links
      while ((match = this.RELATIVE_LINK_REGEX.exec(line)) !== null) {
        links.push({
          source: sourceFile,
          target: match[2],
          type: 'relative',
          context: line.trim(),
          lineNumber: i + 1,
        });
      }
    }

    return links;
  }

  private resolveWikilink(link: string): string {
    // Convert wikilink to file path
    return link.replace(/ /g, '-').toLowerCase() + '.md';
  }
}
```

---

### TOOL-002: find-connections.ts

**Purpose**: Use TF-IDF based similarity detection to suggest link candidates between documents with cosine similarity >= 0.6.

**File**: `src/tools/find-connections.ts`

#### Command Interface

```bash
kg find-connections [options] <vault-path>

Options:
  --threshold <number>   Minimum similarity threshold (default: 0.6)
  --max-suggestions      Maximum suggestions per file (default: 10)
  --output <format>      Output format: json | markdown (default: json)
  --focus <file>         Analyze specific file only
  --exclude-existing     Don't suggest already-linked files
```

#### Implementation

```typescript
interface SimilarityMatch {
  source: string;
  target: string;
  similarity: number;
  sharedTerms: string[];
  suggestedAnchor: string; // Where to place the link
}

export class ConnectionFinder {
  private documents: Map<string, DocumentVector>;
  private idfScores: Map<string, number>;

  /**
   * Build TF-IDF vectors for all documents
   */
  async buildIndex(vaultPath: string): Promise<void> {
    const files = await glob('**/*.md', { cwd: vaultPath });
    const termFrequencies = new Map<string, Map<string, number>>();
    const documentFrequencies = new Map<string, number>();

    // First pass: compute term frequencies
    for (const file of files) {
      const content = await fs.readFile(path.join(vaultPath, file), 'utf-8');
      const terms = this.tokenize(content);
      const tf = new Map<string, number>();

      for (const term of terms) {
        tf.set(term, (tf.get(term) ?? 0) + 1);
      }

      termFrequencies.set(file, tf);

      // Track document frequencies
      for (const term of new Set(terms)) {
        documentFrequencies.set(term, (documentFrequencies.get(term) ?? 0) + 1);
      }
    }

    // Compute IDF scores
    const N = files.length;
    for (const [term, df] of documentFrequencies) {
      this.idfScores.set(term, Math.log(N / df));
    }

    // Build TF-IDF vectors
    for (const [file, tf] of termFrequencies) {
      const vector = new Map<string, number>();
      for (const [term, count] of tf) {
        const idf = this.idfScores.get(term) ?? 0;
        vector.set(term, count * idf);
      }
      this.documents.set(file, { file, vector, magnitude: this.magnitude(vector) });
    }
  }

  /**
   * Find similar documents for a given file
   */
  findSimilar(sourceFile: string, threshold: number = 0.6): SimilarityMatch[] {
    const sourceDoc = this.documents.get(sourceFile);
    if (!sourceDoc) return [];

    const matches: SimilarityMatch[] = [];

    for (const [targetFile, targetDoc] of this.documents) {
      if (sourceFile === targetFile) continue;

      const similarity = this.cosineSimilarity(sourceDoc, targetDoc);
      if (similarity >= threshold) {
        const sharedTerms = this.findSharedTerms(sourceDoc.vector, targetDoc.vector);
        matches.push({
          source: sourceFile,
          target: targetFile,
          similarity,
          sharedTerms: sharedTerms.slice(0, 5),
          suggestedAnchor: this.suggestAnchor(sharedTerms),
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  private tokenize(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !this.isStopword(t));
  }

  private cosineSimilarity(a: DocumentVector, b: DocumentVector): number {
    let dotProduct = 0;
    for (const [term, weightA] of a.vector) {
      const weightB = b.vector.get(term) ?? 0;
      dotProduct += weightA * weightB;
    }
    return dotProduct / (a.magnitude * b.magnitude);
  }

  private magnitude(vector: Map<string, number>): number {
    let sum = 0;
    for (const weight of vector.values()) {
      sum += weight * weight;
    }
    return Math.sqrt(sum);
  }

  private isStopword(term: string): boolean {
    const STOPWORDS = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);
    return STOPWORDS.has(term);
  }
}
```

---

### TOOL-003: validate-names.ts

**Purpose**: Validate file naming against standards (kebab-case, prefixes, extensions) as defined in `docs/standards/implementation-naming-standards.md`.

**File**: `src/tools/validate-names.ts`

#### Command Interface

```bash
kg validate-names [options] <vault-path>

Options:
  --fix                 Automatically rename non-compliant files
  --dry-run             Show what would be renamed without doing it
  --rules <path>        Custom naming rules file
  --ignore <pattern>    Patterns to ignore
```

#### Naming Rules

```typescript
interface NamingRules {
  // File naming patterns
  patterns: {
    'feature': /^F-\d{3}-[a-z0-9-]+\.md$/,
    'phase': /^phase-\d{1,2}-[a-z0-9-]+\.md$/,
    'decision': /^D-\d{3}-[a-z0-9-]+\.md$/,
    'standard': /^[a-z0-9-]+-standards?\.md$/,
    'config': /^[a-z0-9-]+\.(json|yaml|yml)$/,
    'typescript': /^[a-z0-9-]+\.ts$/,
  };

  // Required prefixes by directory
  directoryPrefixes: {
    'features/': 'F-',
    'phases/': 'phase-',
    'decisions/': 'D-',
  };

  // Forbidden patterns
  forbidden: [
    /[A-Z]/, // No uppercase in file names
    / /,     // No spaces
    /_/,     // No underscores (use kebab-case)
  ];
}

export class NameValidator {
  async validateVault(vaultPath: string, options: ValidateOptions): Promise<ValidationResult> {
    const files = await glob('**/*', { cwd: vaultPath, nodir: true });
    const violations: Violation[] = [];
    const suggestions: Map<string, string> = new Map();

    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        violations.push(...validation.violations);
        if (validation.suggestedName) {
          suggestions.set(file, validation.suggestedName);
        }
      }
    }

    if (options.fix && !options.dryRun) {
      await this.applyFixes(vaultPath, suggestions);
    }

    return { violations, suggestions, fixed: options.fix };
  }

  private validateFile(filePath: string): FileValidation {
    const fileName = path.basename(filePath);
    const violations: Violation[] = [];

    // Check kebab-case
    if (/[A-Z]/.test(fileName)) {
      violations.push({
        file: filePath,
        rule: 'kebab-case',
        message: 'File name contains uppercase letters',
        severity: 'error',
      });
    }

    // Check no spaces
    if (/ /.test(fileName)) {
      violations.push({
        file: filePath,
        rule: 'no-spaces',
        message: 'File name contains spaces',
        severity: 'error',
      });
    }

    // Check no underscores
    if (/_/.test(fileName)) {
      violations.push({
        file: filePath,
        rule: 'no-underscores',
        message: 'File name contains underscores (use hyphens)',
        severity: 'warning',
      });
    }

    // Generate suggested name
    const suggestedName = this.generateSuggestedName(filePath);

    return {
      valid: violations.length === 0,
      violations,
      suggestedName: violations.length > 0 ? suggestedName : undefined,
    };
  }

  private generateSuggestedName(filePath: string): string {
    return filePath
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/_/g, '-')
      .replace(/--+/g, '-');
  }
}
```

---

### TOOL-004: add-frontmatter.ts

**Purpose**: Add standard YAML frontmatter to markdown files that lack it.

**File**: `src/tools/add-frontmatter.ts`

#### Command Interface

```bash
kg add-frontmatter [options] <vault-path>

Options:
  --template <path>      Custom frontmatter template
  --overwrite            Overwrite existing frontmatter
  --dry-run              Show changes without applying
  --infer-topics         Use AI to infer topics from content
  --batch-size <n>       Process n files at a time (default: 10)
```

#### Standard Frontmatter Template

```yaml
---
doc_id: <auto-generated-uuid>
title: <extracted-from-first-h1-or-filename>
phase: <inferred-from-path>
status: draft | active | deprecated | archived
topics: [<inferred-from-content>]
related_planning: [<inferred-from-links>]
created: <file-creation-date>
updated: <file-modification-date>
---
```

#### Implementation

```typescript
import { v4 as uuidv4 } from 'uuid';
import matter from 'gray-matter';

interface FrontmatterTemplate {
  doc_id: string;
  title: string;
  phase?: number;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  topics: string[];
  related_planning: string[];
  created: string;
  updated: string;
}

export class FrontmatterManager {
  async processVault(vaultPath: string, options: FrontmatterOptions): Promise<ProcessResult> {
    const files = await glob('**/*.md', { cwd: vaultPath });
    const processed: string[] = [];
    const skipped: string[] = [];

    for (const file of files) {
      const fullPath = path.join(vaultPath, file);
      const content = await fs.readFile(fullPath, 'utf-8');
      const parsed = matter(content);

      // Skip if frontmatter exists and not overwriting
      if (parsed.data && Object.keys(parsed.data).length > 0 && !options.overwrite) {
        skipped.push(file);
        continue;
      }

      // Generate frontmatter
      const frontmatter = await this.generateFrontmatter(file, parsed.content, options);

      // Construct new content
      const newContent = matter.stringify(parsed.content, frontmatter);

      if (!options.dryRun) {
        await fs.writeFile(fullPath, newContent, 'utf-8');
      }

      processed.push(file);
    }

    return { processed, skipped };
  }

  private async generateFrontmatter(
    filePath: string,
    content: string,
    options: FrontmatterOptions
  ): Promise<FrontmatterTemplate> {
    const stats = await fs.stat(filePath);
    const title = this.extractTitle(content, filePath);
    const phase = this.inferPhase(filePath);
    const links = this.extractLinks(content);

    let topics: string[] = [];
    if (options.inferTopics) {
      topics = await this.inferTopicsFromContent(content);
    }

    return {
      doc_id: uuidv4(),
      title,
      phase,
      status: 'draft',
      topics,
      related_planning: links,
      created: stats.birthtime.toISOString().split('T')[0],
      updated: stats.mtime.toISOString().split('T')[0],
    };
  }

  private extractTitle(content: string, filePath: string): string {
    // Try to extract from first H1
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) return h1Match[1];

    // Fall back to filename
    return path
      .basename(filePath, '.md')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private inferPhase(filePath: string): number | undefined {
    const phaseMatch = filePath.match(/phase[- ]?(\d+)/i);
    return phaseMatch ? parseInt(phaseMatch[1], 10) : undefined;
  }

  private extractLinks(content: string): string[] {
    const links: string[] = [];
    const wikilinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let match: RegExpExecArray | null;

    while ((match = wikilinkRegex.exec(content)) !== null) {
      links.push(match[1]);
    }

    return links;
  }

  private async inferTopicsFromContent(content: string): Promise<string[]> {
    // Simple keyword extraction (can be replaced with AI)
    const words = content.toLowerCase().split(/\W+/);
    const frequency = new Map<string, number>();

    for (const word of words) {
      if (word.length > 4 && !this.isStopword(word)) {
        frequency.set(word, (frequency.get(word) ?? 0) + 1);
      }
    }

    return [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }
}
```

---

## CLI Integration

Add commands to `src/cli/index.ts`:

```typescript
import { LinkAnalyzer } from '../tools/analyze-links.js';
import { ConnectionFinder } from '../tools/find-connections.js';
import { NameValidator } from '../tools/validate-names.js';
import { FrontmatterManager } from '../tools/add-frontmatter.js';

program
  .command('analyze-links <vault-path>')
  .description('Analyze wiki-links and document connections')
  .option('--output <format>', 'Output format: json | csv | mermaid', 'json')
  .option('--include-orphans', 'Include orphaned nodes')
  .action(async (vaultPath, options) => {
    const analyzer = new LinkAnalyzer();
    const result = await analyzer.analyzeVault(vaultPath, options);
    console.log(JSON.stringify(result, null, 2));
  });

program
  .command('find-connections <vault-path>')
  .description('Find potential links using TF-IDF similarity')
  .option('--threshold <number>', 'Minimum similarity', '0.6')
  .action(async (vaultPath, options) => {
    const finder = new ConnectionFinder();
    await finder.buildIndex(vaultPath);
    // Process all files or specific file
  });

program
  .command('validate-names <vault-path>')
  .description('Validate file naming conventions')
  .option('--fix', 'Auto-fix violations')
  .option('--dry-run', 'Show changes without applying')
  .action(async (vaultPath, options) => {
    const validator = new NameValidator();
    const result = await validator.validateVault(vaultPath, options);
    console.log(result);
  });

program
  .command('add-frontmatter <vault-path>')
  .description('Add standard YAML frontmatter to markdown files')
  .option('--overwrite', 'Overwrite existing frontmatter')
  .option('--dry-run', 'Show changes without applying')
  .option('--infer-topics', 'Use AI to infer topics')
  .action(async (vaultPath, options) => {
    const manager = new FrontmatterManager();
    const result = await manager.processVault(vaultPath, options);
    console.log(result);
  });
```

---

## Acceptance Criteria

- [ ] `kg analyze-links` correctly parses [[wiki-links]] and relative links
- [ ] `kg find-connections` identifies documents with >= 0.6 cosine similarity
- [ ] `kg validate-names` detects naming violations and suggests fixes
- [ ] `kg add-frontmatter` generates compliant YAML frontmatter
- [ ] All tools support `--dry-run` mode
- [ ] All tools produce JSON output for programmatic use
- [ ] Integration with existing CLI framework
- [ ] Unit tests with 90%+ coverage

## Success Metrics

- Orphan rate reduction: 88.1% → < 10%
- Link density increase: 1.08 → > 5.0
- Naming compliance: > 95% after `--fix`
- Frontmatter coverage: 100% after processing
