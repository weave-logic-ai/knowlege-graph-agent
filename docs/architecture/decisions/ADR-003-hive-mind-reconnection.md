# ADR-003: Hive Mind Reconnection Tools

**Status**: Proposed
**Date**: 2025-12-29
**Category**: feature

## Context

Documentation vaults suffer from high orphan rates - nodes with no connections to other documents. Analysis shows:

- **88.1% orphan rate** in documentation vaults
- **1.08 link density** (average links per document)
- Knowledge discovery is difficult when documents are isolated
- Manual reconnection is impractical at scale

The Hive Mind reconnection strategy specifies 4 CLI tools to address this problem, but none are implemented. These tools would:

1. Analyze existing link structure
2. Find potential connections using semantic similarity
3. Validate file naming conventions
4. Add standardized frontmatter for metadata

## Decision

Implement 4 CLI tools for knowledge graph reconnection as specified in the Hive Mind architecture:

### Tool Overview

| Tool | Purpose | Input | Output |
|------|---------|-------|--------|
| `analyze-links` | Parse markdown for wiki-links, generate adjacency list | Vault path | JSON/CSV/Mermaid graph |
| `find-connections` | TF-IDF similarity detection for link candidates | Vault path | Suggested links with similarity scores |
| `validate-names` | File naming schema validation | Vault path | Violations and suggested fixes |
| `add-frontmatter` | Add standard YAML frontmatter | Vault path | Updated files with frontmatter |

### Target Metrics

| Metric | Before | After |
|--------|--------|-------|
| Orphan rate | 88.1% | < 10% |
| Link density | 1.08 | > 5.0 |
| Naming compliance | ~50% | > 95% |
| Frontmatter coverage | ~30% | 100% |

## Rationale

### Why TF-IDF for similarity?

1. **No External Dependencies**: Works offline without embedding models
2. **Interpretable**: Shared terms explain why documents are related
3. **Fast**: O(n^2) but practical for 10,000+ document vaults
4. **Proven**: Well-understood algorithm with predictable behavior

### Why wiki-link syntax?

1. **Obsidian Compatibility**: Standard `[[link]]` syntax works with Obsidian
2. **Simple Parsing**: Regex-based extraction is fast and reliable
3. **Bidirectional**: Easy to build backlink index
4. **Human Readable**: Links are visible in raw markdown

### Why standardized frontmatter?

1. **Queryable Metadata**: Enables filtering by status, phase, topics
2. **Interoperability**: Standard format works with multiple tools
3. **Automation**: Auto-generated doc_id, dates, topics
4. **Navigation**: Related planning links create navigation paths

### Alternatives Considered

1. **Vector Embeddings Only**: Requires model loading, slower for cold starts
2. **Manual Curation**: Doesn't scale beyond small vaults
3. **External Graph Database**: Adds infrastructure complexity
4. **AI-Generated Links**: Expensive, unpredictable quality

## Consequences

### Positive

- Dramatically reduced orphan rate (88% to <10%)
- Improved knowledge discoverability through increased connectivity
- Standardized naming conventions across vault
- Machine-readable frontmatter enables advanced queries
- Hub documents created for navigation
- Works offline without external services
- Supports dry-run mode for safe testing

### Negative

- Initial processing time for large vaults (10,000 docs ~ 5-10 minutes)
- TF-IDF may miss semantic relationships that embeddings would catch
- Frontmatter additions modify source files
- False positive link suggestions require human review

### Neutral

- Mermaid output enables visualization but requires external renderer
- CSV output enables spreadsheet analysis
- Similarity threshold (0.6) may need tuning per vault

## Implementation

### Tool 1: analyze-links

**File**: `src/tools/analyze-links.ts`

```bash
kg analyze-links [options] <vault-path>

Options:
  --output <format>    Output format: json | csv | mermaid (default: json)
  --include-orphans    Include orphaned nodes in output
  --min-connections    Minimum connections to include (default: 0)
  --exclude <pattern>  Glob patterns to exclude
  --verbose            Show detailed progress
```

**Core Algorithm**:
```typescript
export class LinkAnalyzer {
  private readonly WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  private readonly RELATIVE_LINK_REGEX = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

  async analyzeVault(vaultPath: string, options: AnalyzeOptions): Promise<AnalysisResult> {
    const files = await glob('**/*.md', { cwd: vaultPath, ignore: options.exclude });
    const adjacencyList = new Map<string, string[]>();

    for (const file of files) {
      const content = await fs.readFile(path.join(vaultPath, file), 'utf-8');
      const links = this.extractLinks(content, file);
      adjacencyList.set(file, links.map(l => l.target));
    }

    // Identify orphans and hubs
    const orphans = this.findOrphans(files, adjacencyList);
    const hubs = this.findHubs(adjacencyList, 5);

    return {
      adjacencyList,
      orphans,
      hubs,
      statistics: {
        totalFiles: files.length,
        totalLinks: this.countLinks(adjacencyList),
        avgLinksPerFile: this.countLinks(adjacencyList) / files.length,
        orphanRate: orphans.length / files.length,
        linkDensity: this.countLinks(adjacencyList) / files.length,
      },
    };
  }
}
```

### Tool 2: find-connections

**File**: `src/tools/find-connections.ts`

```bash
kg find-connections [options] <vault-path>

Options:
  --threshold <number>   Minimum similarity threshold (default: 0.6)
  --max-suggestions      Maximum suggestions per file (default: 10)
  --output <format>      Output format: json | markdown (default: json)
  --focus <file>         Analyze specific file only
  --exclude-existing     Don't suggest already-linked files
```

**Core Algorithm**:
```typescript
export class ConnectionFinder {
  private documents: Map<string, DocumentVector>;
  private idfScores: Map<string, number>;

  async buildIndex(vaultPath: string): Promise<void> {
    // Build TF-IDF vectors for all documents
    const files = await glob('**/*.md', { cwd: vaultPath });

    // First pass: term frequencies
    // Second pass: IDF scores
    // Build TF-IDF vectors
  }

  findSimilar(sourceFile: string, threshold: number = 0.6): SimilarityMatch[] {
    const sourceDoc = this.documents.get(sourceFile);
    const matches: SimilarityMatch[] = [];

    for (const [targetFile, targetDoc] of this.documents) {
      if (sourceFile === targetFile) continue;

      const similarity = this.cosineSimilarity(sourceDoc, targetDoc);
      if (similarity >= threshold) {
        matches.push({
          source: sourceFile,
          target: targetFile,
          similarity,
          sharedTerms: this.findSharedTerms(sourceDoc, targetDoc).slice(0, 5),
          suggestedAnchor: this.suggestAnchor(sharedTerms),
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }
}
```

### Tool 3: validate-names

**File**: `src/tools/validate-names.ts`

```bash
kg validate-names [options] <vault-path>

Options:
  --fix                 Automatically rename non-compliant files
  --dry-run             Show what would be renamed without doing it
  --rules <path>        Custom naming rules file
  --ignore <pattern>    Patterns to ignore
```

**Naming Rules**:
```typescript
const NAMING_RULES = {
  patterns: {
    feature: /^F-\d{3}-[a-z0-9-]+\.md$/,
    phase: /^phase-\d{1,2}-[a-z0-9-]+\.md$/,
    decision: /^D-\d{3}-[a-z0-9-]+\.md$/,
    standard: /^[a-z0-9-]+-standards?\.md$/,
    config: /^[a-z0-9-]+\.(json|yaml|yml)$/,
    typescript: /^[a-z0-9-]+\.ts$/,
  },
  directoryPrefixes: {
    'features/': 'F-',
    'phases/': 'phase-',
    'decisions/': 'D-',
  },
  forbidden: [
    /[A-Z]/,  // No uppercase
    / /,      // No spaces
    /_/,      // No underscores
  ],
};
```

### Tool 4: add-frontmatter

**File**: `src/tools/add-frontmatter.ts`

```bash
kg add-frontmatter [options] <vault-path>

Options:
  --template <path>      Custom frontmatter template
  --overwrite            Overwrite existing frontmatter
  --dry-run              Show changes without applying
  --infer-topics         Use AI to infer topics from content
  --batch-size <n>       Process n files at a time (default: 10)
```

**Standard Frontmatter Template**:
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

### CLI Integration

Update `src/cli/index.ts`:

```typescript
program
  .command('analyze-links <vault-path>')
  .description('Analyze wiki-links and document connections')
  .option('--output <format>', 'Output format', 'json')
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
    const suggestions = finder.findAllConnections(parseFloat(options.threshold));
    console.log(JSON.stringify(suggestions, null, 2));
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
  .action(async (vaultPath, options) => {
    const manager = new FrontmatterManager();
    const result = await manager.processVault(vaultPath, options);
    console.log(result);
  });
```

## Testing Requirements

1. **Unit Tests**: Each tool tested independently
2. **Integration Tests**: Full vault processing workflows
3. **Edge Cases**: Empty files, circular links, special characters
4. **Performance Tests**: 10,000+ document vaults

## Acceptance Criteria

- [ ] `kg analyze-links` correctly parses [[wiki-links]] and relative links
- [ ] `kg find-connections` identifies documents with >= 0.6 cosine similarity
- [ ] `kg validate-names` detects naming violations and suggests fixes
- [ ] `kg add-frontmatter` generates compliant YAML frontmatter
- [ ] All tools support `--dry-run` mode
- [ ] All tools produce JSON output for programmatic use
- [ ] Integration with existing CLI framework
- [ ] Unit tests with 90%+ coverage

## References

- SPEC-003-HIVE-MIND-RECONNECTION-TOOLS.md (Original specification)
- GAP-003 in FEATURE-GAP-ANALYSIS.md
- docs/hive-mind/reconnection-strategy.md (Hive Mind architecture)
- docs/standards/implementation-naming-standards.md (Naming conventions)
