# Graph Analysis Data Directory

This directory stores knowledge graph analysis results.

## Generated Files

### `analysis-results.json`
Comprehensive graph metrics including:
- Total nodes, edges, clusters
- Connected vs disconnected counts
- Orphaned file list
- Hub files (highly connected)
- Top 50 connection suggestions

### `suggestions.json`
Complete list of all connection suggestions with:
- Source and target files
- Relevance scores (1-10)
- Reasoning (shared tags, content similarity, etc.)
- Bidirectional flag
- Metadata (shared tags, semantic similarity)

## Usage

### Generate Analysis
```bash
cd /home/aepod/dev/weave-nn/weaver
npx tsx scripts/analyze-graph.ts
```

### View Results
```bash
# Quick summary
cat .graph-data/analysis-results.json | jq '.metrics'

# Top 10 suggestions
cat .graph-data/suggestions.json | jq '.suggestions[:10]'

# All orphaned files
cat .graph-data/analysis-results.json | jq '.orphanedFiles'
```

### Apply Connections
```typescript
import { runFullAnalysis } from '../src/knowledge-graph/index.js';

const { connector, suggestions, config } = await runFullAnalysis({
  rootPath: '../',
  outputDir: '.graph-data'
});

// Dry run first
await connector.applyConnections(suggestions, { ...config, dryRun: true });

// Then apply
await connector.applyConnections(suggestions, { ...config, dryRun: false });
```

## File Format

### analysis-results.json
```json
{
  "timestamp": "2025-10-28T19:35:00.000Z",
  "metrics": {
    "totalNodes": 1426,
    "orphanedNodes": 469,
    "averageDegree": 2.3,
    "density": 0.0014
  },
  "orphanedFiles": ["path/to/file.md", ...],
  "hubFiles": [
    { "path": "hub-file.md", "degree": 45 }
  ],
  "topSuggestions": [...]
}
```

### suggestions.json
```json
{
  "timestamp": "2025-10-28T19:35:00.000Z",
  "totalSuggestions": 2847,
  "suggestions": [
    {
      "sourceFile": "docs/file-a.md",
      "targetFile": "docs/file-b.md",
      "score": 8.5,
      "reason": "Shared tags: architecture, design. Same category: documentation.",
      "bidirectional": true,
      "metadata": {
        "sharedTags": ["architecture", "design"],
        "semanticSimilarity": 0.82
      }
    }
  ]
}
```

## Performance

- **Analysis speed**: ~5-10 seconds for 1,426 files
- **Suggestion generation**: ~15-20 seconds
- **Total runtime**: <30 seconds
- **Memory usage**: ~65MB peak

## Next Steps

1. Review top suggestions
2. Run dry-run batch connection
3. Verify changes look good
4. Apply connections to reconnect orphaned files
5. Re-run analysis to verify improved connectivity
