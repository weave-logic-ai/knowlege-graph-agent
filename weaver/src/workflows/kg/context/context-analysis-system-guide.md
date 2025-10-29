# Context Analysis System

The Context Analysis System provides intelligent document understanding for knowledge graph workflows. It analyzes files across three dimensions to enable smart connection suggestions and relationship detection.

## Overview

```typescript
import { buildDocumentContext, calculateContextSimilarity } from './context/index.js';

// Analyze a file
const context = await buildDocumentContext(fileEvent, vaultRoot);

// Compare two files
const similarity = calculateContextSimilarity(context1, context2);
```

## Architecture

The system combines three independent analyzers:

1. **Directory Context** - Structural relationships and file purpose
2. **Temporal Context** - Time-based relationships and phases
3. **Primitive Extractor** - Technical content and domain

```
┌─────────────────────────────────────┐
│     buildDocumentContext()          │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    │  Parallel       │
    │  Analysis       │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐  ┌────▼────┐  ┌────▼────┐
│Directory│  │Temporal │  │Primitive│
│ Context │  │ Context │  │Extractor│
└────┬────┘  └────┬────┘  └────┬────┘
     │            │            │
     └────────────┴────────────┘
                  │
         ┌────────▼────────┐
         │ DocumentContext │
         └─────────────────┘
```

## Directory Context

Analyzes file location and infers purpose from directory structure.

### Features

- **Purpose Detection**: Automatically identifies file purpose (planning, documentation, source-code, testing, etc.)
- **Hierarchy Analysis**: Calculates directory depth and parent relationships
- **Related Directories**: Finds sibling and ancestor directories

### Example

```typescript
import { analyzeDirectoryContext } from './directory-context.js';

const context = await analyzeDirectoryContext(
  '/vault/_planning/phases/phase-12.md',
  '/vault'
);

// Result:
// {
//   directory: '_planning/phases',
//   purpose: 'planning',
//   parentDirectory: '_planning',
//   level: 2,
//   relatedDirectories: ['_planning', '_planning/specs', ...]
// }
```

### Purpose Categories

- `planning` - Project planning and roadmaps
- `specification` - Technical specifications
- `documentation` - User documentation
- `source-code` - Source code files
- `testing` - Test files
- `research` - Research and analysis
- `archived` - Archived content
- `configuration` - Config files
- `tooling` - Scripts and tools
- `examples` - Example code
- `templates` - Templates
- `general` - Uncategorized

## Temporal Context

Analyzes time-based relationships between files.

### Features

- **Created Date**: Extracts from frontmatter or file stats
- **Phase Detection**: Identifies phase/sprint/period
- **Recent Files**: Finds files created within ±7 days
- **Temporal Similarity**: Calculates time-based relationships

### Example

```typescript
import { analyzeTemporalContext } from './temporal-context.js';

const context = await analyzeTemporalContext(
  '/vault/_planning/phase-12.md',
  '/vault'
);

// Result:
// {
//   createdDate: Date('2025-01-15'),
//   modifiedDate: Date('2025-01-20'),
//   phase: 'phase-12',
//   recentFiles: ['phase-13.md', 'architecture.md', ...]
// }
```

### Phase Extraction

The analyzer extracts phase information from:
- Frontmatter (`phase`, `period`, `sprint` fields)
- Filename patterns (`phase-12`, `week-3`, `sprint-5`)

## Primitive Extractor

Extracts technical platforms, patterns, and features from content.

### Features

- **Platform Detection**: Identifies technologies (Node.js, Python, Docker, AWS, etc.)
- **Pattern Recognition**: Finds architectural patterns (microservices, REST API, event-driven, etc.)
- **Feature Extraction**: Detects capabilities (authentication, caching, monitoring, etc.)
- **Domain Inference**: Determines technical domain (backend, frontend, testing, etc.)

### Example

```typescript
import { extractPrimitives } from './primitive-extractor.js';

const primitives = await extractPrimitives('/vault/src/api-server.md');

// Result:
// {
//   platforms: ['nodejs', 'typescript', 'postgresql', 'docker'],
//   patterns: ['microservices', 'rest-api', 'event-driven'],
//   features: ['authentication', 'caching', 'logging'],
//   domain: 'backend'
// }
```

### Keyword Libraries

The extractor maintains curated keyword libraries:

- **Platforms**: 30+ technologies (Node.js, Python, React, Docker, AWS, etc.)
- **Patterns**: 25+ architectural patterns (microservices, CQRS, event-sourcing, etc.)
- **Features**: 30+ capabilities (authentication, monitoring, testing, etc.)

## Integrated Analysis

Combine all three analyzers for complete context.

### Building Context

```typescript
import { buildDocumentContext } from './context/index.js';
import type { FileEvent } from '../file-watcher/types.js';

const fileEvent: FileEvent = {
  type: 'add',
  path: '/vault/_planning/phase-12.md',
  relativePath: '_planning/phase-12.md',
  timestamp: new Date(),
};

const context = await buildDocumentContext(fileEvent, '/vault');

// Result: DocumentContext with all three dimensions
console.log(context.directory.purpose);  // 'planning'
console.log(context.temporal.phase);     // 'phase-12'
console.log(context.primitives.domain);  // 'planning'
```

### Calculating Similarity

```typescript
import { calculateContextSimilarity } from './context/index.js';

const similarity = calculateContextSimilarity(context1, context2);

// Weighted scoring:
// - Directory similarity: 40%
// - Primitive overlap: 35%
// - Temporal proximity: 25%

if (similarity > 0.7) {
  console.log('Highly related files');
} else if (similarity > 0.4) {
  console.log('Moderately related');
} else {
  console.log('Weakly related');
}
```

### Filtering by Similarity

```typescript
import { filterBySimilarity } from './context/index.js';

// Find similar files with threshold
const similar = filterBySimilarity(
  targetContext,
  candidateContexts,
  0.5  // Minimum 50% similarity
);

// Results sorted by similarity (highest first)
similar.forEach(({ context, similarity }) => {
  console.log(`${context.filePath}: ${(similarity * 100).toFixed(1)}%`);
});
```

## Utility Functions

### Context Summary

```typescript
import { getContextSummary } from './context/index.js';

const summary = getContextSummary(context);
// "📁 planning • 📅 phase-12 • 🔧 planning • ⚙️  nodejs, typescript"
```

### Similarity Calculations

Each analyzer provides its own similarity calculator:

```typescript
import { calculateDirectorySimilarity } from './directory-context.js';
import { calculateTemporalSimilarity } from './temporal-context.js';
import { calculatePrimitiveOverlap } from './primitive-extractor.js';

const dirSim = calculateDirectorySimilarity(dir1, dir2);
const timeSim = calculateTemporalSimilarity(temp1, temp2);
const primSim = calculatePrimitiveOverlap(prim1, prim2);
```

## Integration with Workflows

The context system is designed to integrate with workflow handlers:

```typescript
import { buildDocumentContext } from '../context/index.js';

export async function handleFileAdd(fileEvent: FileEvent): Promise<void> {
  // Build context
  const context = await buildDocumentContext(fileEvent, vaultRoot);

  // Use context to make intelligent decisions
  if (context.directory.purpose === 'planning') {
    // Connect to other planning documents
  }

  if (context.temporal.phase) {
    // Link to same-phase documents
  }

  if (context.primitives.platforms.includes('nodejs')) {
    // Tag with Node.js topics
  }
}
```

## Performance Considerations

### Parallel Analysis

All three analyzers run in parallel for optimal performance:

```typescript
const [directory, temporal, primitives] = await Promise.all([
  analyzeDirectoryContext(filePath, vaultRoot),
  analyzeTemporalContext(filePath, vaultRoot),
  extractPrimitives(filePath),
]);
```

### Caching

Consider caching context results for frequently accessed files:

```typescript
const contextCache = new Map<string, DocumentContext>();

async function getCachedContext(fileEvent: FileEvent): Promise<DocumentContext> {
  const cached = contextCache.get(fileEvent.relativePath);
  if (cached) return cached;

  const context = await buildDocumentContext(fileEvent, vaultRoot);
  contextCache.set(fileEvent.relativePath, context);
  return context;
}
```

### File Limits

The temporal analyzer limits file scanning to prevent performance issues:

- Maximum 200 files checked for recent files
- Returns top 10 most recent matches
- Uses frontmatter dates when available (faster than file stats)

## Error Handling

All analyzers gracefully handle errors and return safe defaults:

```typescript
// If file can't be read, returns minimal context
const context = await buildDocumentContext(fileEvent, vaultRoot);

// context.directory will have:
// - directory: '.'
// - purpose: 'general'
// - parentDirectory: ''
// - level: 0
// - relatedDirectories: []
```

## Testing

The system includes comprehensive unit and integration tests:

```bash
# Unit tests (isolated analyzer tests)
bun test tests/unit/workflows/kg/context.test.ts

# Integration tests (real vault files)
bun test tests/integration/context-real-files.test.ts
```

## Future Enhancements

Potential improvements for Phase 14+:

1. **Content Analysis**: NLP-based topic extraction
2. **Link Analysis**: Existing wikilink detection
3. **Similarity Caching**: Memoize similarity calculations
4. **ML-based Classification**: Train custom classifiers
5. **Graph Context**: Analyze existing connections
6. **User Feedback**: Learn from manual connections
7. **Batch Processing**: Optimize for bulk analysis

## See Also

- [Workflow Engine](../../workflow-engine/README.md)
- [File Watcher](../../file-watcher/README.md)
- [Phase 14 Specification](../../../../_planning/phases/phase-14-revised-workflow-automation.md)
