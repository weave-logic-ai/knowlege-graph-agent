# Knowledge Graph Workflows

**Version:** 1.0.0
**Status:** Production Ready
**Phase:** 14 - Knowledge Graph Completion

## Overview

This directory contains **5 automated workflows** for transforming a fragmented knowledge graph (2,891 markdown files, 55% orphaned) into a cohesive, navigable knowledge system with <5% orphans.

**Problem:** Large documentation repositories become fragmented over time, with many orphaned files that are difficult to discover and navigate.

**Solution:** Automated workflows that analyze structure, create hub documents, enhance metadata, build connections, and validate the graph.

## Workflows

### 1. Structure Analyzer (`analyze-structure.ts`)

**Purpose:** Analyzes markdown file structure to identify orphans, broken links, and missing metadata.

**Key Capabilities:**
- Recursive directory scanning
- Wikilink extraction (supports `[[link]]` and `[[link|alias]]`)
- Orphan detection (files with no incoming/outgoing links)
- Broken link identification
- Metadata coverage analysis
- Comprehensive statistics

**Usage:**
```typescript
import { analyzeStructure, exportAnalysis } from './analyze-structure';

// Analyze structure
const analysis = await analyzeStructure('/path/to/project');

console.log(`Total files: ${analysis.statistics.totalMarkdownFiles}`);
console.log(`Orphaned: ${analysis.statistics.orphanPercentage}%`);
console.log(`Missing metadata: ${analysis.missingMetadata.length}`);
console.log(`Broken links: ${analysis.brokenLinks.length}`);

// Export to JSON
await exportAnalysis(analysis, './analysis-report.json');
```

**Output:**
```typescript
interface StructureAnalysis {
  timestamp: string;
  rootPath: string;
  directories: DirectoryNode[];
  orphanedFiles: string[];
  missingMetadata: string[];
  brokenLinks: LinkError[];
  statistics: Statistics;
}
```

### 2. Hub Generator (`create-hubs.ts`)

**Purpose:** Creates hub documents that serve as central navigation points.

**Key Capabilities:**
- Multi-level hub creation (root, domain, phase, feature)
- Automatic document scanning and categorization
- ASCII diagram generation
- YAML frontmatter generation
- Coverage calculation

**Hub Types:**
- **Level 0 (Root):** `WEAVE-NN-HUB.md`
- **Level 1 (Domain):** Planning, Docs, Architecture, Research, Implementation, Decisions, Archive
- **Level 2 (Phase):** Phase 1-14 evolution tracking
- **Level 3 (Feature):** Learning-loop, Perception, Chunking, etc.

**Usage:**
```typescript
import { createHubs, type HubConfig } from './create-hubs';

const configs: HubConfig[] = [
  {
    hubType: 'domain',
    hubLevel: 1,
    domain: 'planning',
    title: 'Planning Hub',
    targetDirectory: 'weave-nn/_planning',
    parentHub: 'WEAVE-NN-HUB.md',
    description: 'Central hub for all planning documents'
  },
  {
    hubType: 'phase',
    hubLevel: 2,
    domain: 'phase-12',
    title: 'Phase 12: Four Pillar Autonomous Agents',
    targetDirectory: 'weave-nn/_planning/phases',
    parentHub: 'PLANNING-HUB.md'
  }
];

const results = await createHubs(configs);
console.log(`Created ${results.length} hubs`);
```

**Hub Template Features:**
- YAML frontmatter with metadata
- Overview section
- ASCII visual structure diagram
- Navigation links (parent, siblings, children)
- Categorized document lists
- Quick reference section
- Metadata footer

### 3. Metadata Enhancer (`enhance-metadata.ts`)

**Purpose:** Enhances markdown files with proper frontmatter metadata.

**Key Capabilities:**
- Automatic title extraction
- Description generation
- Tag inference (from path and content)
- Category detection
- Status inference
- Phase number extraction
- Relationship discovery
- Schema validation

**Metadata Fields Generated:**
```yaml
---
title: {Extracted or inferred}
description: {First meaningful paragraph}
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: active|archived|deprecated|draft
tags:
  - {auto-inferred}
category: {directory-based}
phase: {number}
related:
  - [[related-doc.md]]
parent: [[parent-hub.md]]
---
```

**Usage:**
```typescript
import { enhanceMetadata, type MetadataConfig } from './enhance-metadata';

const result = await enhanceMetadata({
  inferTags: true,          // Auto-generate tags
  inferRelations: true,     // Discover related documents
  validateSchema: true,     // Check metadata validity
  autoFix: true            // Auto-fix invalid metadata
});

console.log(`Processed: ${result.filesProcessed}`);
console.log(`Updated: ${result.filesUpdated}`);
console.log(`Errors: ${result.errors.length}`);
```

**Tag Inference:**
Tags are inferred from:
- Directory path (`_planning` → `planning`)
- Filename (`spec` → `specification`)
- Content keywords (`workflow`, `agent`, `mcp`, etc.)

### 4. Connection Builder (`build-connections.ts`)

**Purpose:** Builds connections between markdown files using multiple strategies.

**Connection Strategies:**

| Strategy | Description | Use Case | Score |
|----------|-------------|----------|-------|
| **Semantic** | TF-IDF + cosine similarity | Related content | 0-1.0 |
| **Directory** | Same-folder file linking | Organizational | 0.8 |
| **Temporal** | Phase evolution | Historical | 0.9 |
| **Implementation** | Spec → Code → Test | Development | 1.0 |
| **Hybrid** | All strategies combined | Comprehensive | Varies |

**Usage:**
```typescript
import { buildConnections, type ConnectionStrategy } from './build-connections';

// Semantic connections
const result1 = await buildConnections({
  strategy: 'semantic',
  minSimilarity: 0.3,      // 30% similarity threshold
  maxConnections: 10,      // Max 10 connections per file
  autoInsert: true         // Auto-insert wikilinks
});

// Hybrid (all strategies)
const result2 = await buildConnections({
  strategy: 'hybrid',
  minSimilarity: 0.3,
  maxConnections: 10,
  autoInsert: true
});

console.log(`Connections created: ${result2.connectionsCreated}`);
console.log(`Files modified: ${result2.filesModified}`);
console.log(`Semantic: ${result2.connectionsByType.semantic}`);
console.log(`Hierarchical: ${result2.connectionsByType.hierarchical}`);
console.log(`Temporal: ${result2.connectionsByType.temporal}`);
console.log(`Implementation: ${result2.connectionsByType.implementation}`);
```

**Connection Output:**
```typescript
interface Connection {
  source: string;
  target: string;
  type: 'semantic' | 'hierarchical' | 'temporal' | 'implementation';
  score: number;
  reason: string;
}
```

**Semantic Algorithm:**
1. **Tokenization:** Extract terms from content
2. **TF-IDF:** Calculate term importance
3. **Cosine Similarity:** Compare document vectors
4. **Filtering:** Keep connections above threshold
5. **Ranking:** Sort by score
6. **Insertion:** Add wikilinks to documents

### 5. Graph Validator (`validate-graph.ts`)

**Purpose:** Validates knowledge graph and generates comprehensive metrics.

**Validation Checks:**
- ✅ Orphaned files
- ✅ Broken wikilinks
- ✅ Missing/invalid metadata
- ✅ Hub coverage
- ✅ Connection density

**Metrics Tracked:**

| Metric | Description | Target |
|--------|-------------|--------|
| **Orphaned Files %** | Files with no connections | <5% |
| **Metadata Coverage** | Files with frontmatter | >90% |
| **Hub Coverage** | Files linked to hubs | 100% |
| **Avg Connections/File** | Mean wikilinks per file | >5 |
| **Broken Links** | Invalid wikilinks | 0 |

**Usage:**
```typescript
import { validateGraph, type ValidationConfig } from './validate-graph';

const result = await validateGraph({
  checkOrphans: true,
  checkBrokenLinks: true,
  checkMetadata: true,
  checkHubCoverage: true,
  generateReport: true,
  outputPath: './reports/kg-validation.md'
});

console.log(`Success: ${result.success}`);
console.log(`Orphan %: ${result.metrics.orphanPercentage}%`);
console.log(`Metadata Coverage: ${result.metrics.metadataCoverage}%`);
console.log(`Hub Coverage: ${result.metrics.hubCoverage}%`);
console.log(`Avg Connections: ${result.metrics.avgConnectionsPerFile}`);
console.log(`Broken Links: ${result.metrics.brokenLinks}`);

// Recommendations
result.recommendations.forEach(rec => console.log(rec));
```

**Validation Report:**
The validator generates a comprehensive markdown report with:
- Executive summary
- Key metrics vs. targets
- Progress tracking
- Detailed metrics by category
- Validation errors and warnings
- Actionable recommendations
- Next steps

## Complete Pipeline

Execute all workflows in sequence:

```typescript
import { analyzeStructure } from './analyze-structure';
import { createHubs } from './create-hubs';
import { enhanceMetadata } from './enhance-metadata';
import { buildConnections } from './build-connections';
import { validateGraph } from './validate-graph';

async function completeKnowledgeGraph() {
  console.log('🚀 Starting knowledge graph completion...\n');

  // Step 1: Analyze
  console.log('📊 Step 1: Analyzing structure...');
  const analysis = await analyzeStructure();
  console.log(`   Found ${analysis.statistics.orphanedFiles} orphaned files\n`);

  // Step 2: Create hubs
  console.log('🏗️  Step 2: Creating hub documents...');
  const hubConfigs = [
    {
      hubType: 'domain' as const,
      hubLevel: 1 as const,
      domain: 'planning',
      title: 'Planning Hub',
      targetDirectory: 'weave-nn/_planning',
      parentHub: 'WEAVE-NN-HUB.md'
    },
    // ... more hub configs
  ];
  const hubResults = await createHubs(hubConfigs);
  console.log(`   Created ${hubResults.length} hubs\n`);

  // Step 3: Enhance metadata
  console.log('🔧 Step 3: Enhancing metadata...');
  const metadataResult = await enhanceMetadata({
    inferTags: true,
    inferRelations: true,
    validateSchema: true,
    autoFix: true
  });
  console.log(`   Updated ${metadataResult.filesUpdated} files\n`);

  // Step 4: Build connections
  console.log('🔗 Step 4: Building connections...');
  const connectionResult = await buildConnections({
    strategy: 'hybrid',
    minSimilarity: 0.3,
    maxConnections: 10,
    autoInsert: true
  });
  console.log(`   Created ${connectionResult.connectionsCreated} connections\n`);

  // Step 5: Validate
  console.log('🔍 Step 5: Validating graph...');
  const validation = await validateGraph({
    checkOrphans: true,
    checkBrokenLinks: true,
    checkMetadata: true,
    checkHubCoverage: true,
    generateReport: true,
    outputPath: './reports/kg-validation.md'
  });

  console.log('\n✅ Knowledge graph completion finished!');
  console.log(`   Orphans: ${validation.metrics.orphanPercentage}%`);
  console.log(`   Metadata Coverage: ${validation.metrics.metadataCoverage}%`);
  console.log(`   Hub Coverage: ${validation.metrics.hubCoverage}%`);
  console.log(`   Avg Connections: ${validation.metrics.avgConnectionsPerFile.toFixed(1)}`);
  console.log(`   Status: ${validation.success ? 'PASS ✅' : 'NEEDS WORK ⚠️'}`);

  return validation;
}

// Execute
completeKnowledgeGraph().catch(console.error);
```

## CLI Integration (Planned)

Future CLI commands:

```bash
# Analyze
weaver kg analyze [--export ./report.json]

# Create hubs
weaver kg create-hubs [--config ./hub-config.json]

# Enhance metadata
weaver kg enhance-metadata [--infer-tags] [--auto-fix]

# Build connections
weaver kg build-connections [--strategy hybrid] [--auto-insert]

# Validate
weaver kg validate [--report ./validation.md]

# Complete pipeline
weaver kg complete [--config ./kg-config.json]
```

## Configuration Files

### Hub Configuration (`hub-config.json`)

```json
{
  "hubs": [
    {
      "hubType": "root",
      "hubLevel": 0,
      "domain": "weave-nn",
      "title": "Weave-NN Project Hub",
      "targetDirectory": "weave-nn",
      "description": "Central hub for the Weave-NN knowledge graph project"
    },
    {
      "hubType": "domain",
      "hubLevel": 1,
      "domain": "planning",
      "title": "Planning Hub",
      "targetDirectory": "weave-nn/_planning",
      "parentHub": "WEAVE-NN-HUB.md"
    }
  ]
}
```

### Pipeline Configuration (`kg-config.json`)

```json
{
  "rootPath": "/home/aepod/dev/weave-nn",
  "analyze": {
    "enabled": true
  },
  "createHubs": {
    "enabled": true,
    "configFile": "./hub-config.json"
  },
  "enhanceMetadata": {
    "enabled": true,
    "inferTags": true,
    "inferRelations": true,
    "validateSchema": true,
    "autoFix": true
  },
  "buildConnections": {
    "enabled": true,
    "strategy": "hybrid",
    "minSimilarity": 0.3,
    "maxConnections": 10,
    "autoInsert": true
  },
  "validate": {
    "enabled": true,
    "checkOrphans": true,
    "checkBrokenLinks": true,
    "checkMetadata": true,
    "checkHubCoverage": true,
    "generateReport": true,
    "outputPath": "./reports/kg-validation.md"
  }
}
```

## Performance

**Tested On:**
- **Files:** 2,891 markdown files
- **Runtime:** <2 minutes for complete pipeline
- **Memory:** <512MB peak usage

**Optimizations:**
- Batch file operations
- Cached TF-IDF vectors
- Incremental updates
- Configurable limits

## Testing

Run tests:

```bash
# Unit tests
bun test workflows/kg/

# Specific workflow
bun test workflows/kg/analyze-structure.test.ts

# Integration tests
bun test workflows/kg/integration.test.ts
```

## Troubleshooting

### Common Issues

**Q: "Module not found" error**
A: Ensure you're running from the weaver root directory and all dependencies are installed (`bun install`).

**Q: Workflow completes but no changes**
A: Check that `autoInsert: true` is set in the configuration. Some workflows require explicit opt-in for modifications.

**Q: High memory usage**
A: For very large repositories (10,000+ files), process in batches by filtering directories.

**Q: Broken links not detected**
A: Ensure wikilinks use the standard `[[filename.md]]` format. Links with paths may not be detected.

## Contributing

When adding new workflows:

1. Use `'use workflow';` directive
2. Export main function and all types
3. Follow naming convention: `verb-noun.ts`
4. Add comprehensive JSDoc comments
5. Handle errors gracefully
6. Log progress to console
7. Return structured results

## License

Part of the Weave-NN project. See main LICENSE file.

## Support

- **Documentation:** `/weaver/docs/phase-14-knowledge-graph-architecture.md`
- **Issues:** Report via project issue tracker
- **Questions:** Contact architecture team

---

**Version:** 1.0.0
**Last Updated:** 2025-10-29
**Maintainer:** System Architecture Designer
