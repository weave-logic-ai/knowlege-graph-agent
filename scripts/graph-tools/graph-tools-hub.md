# Knowledge Graph Analysis Tools
**Automated Tools for Graph Reconnection Strategy**

## 🎯 Quick Start

```bash
# Run all analysis tools
./run-analysis.sh

# Or run individually
bun run analyze-links.ts
bun run find-connections.ts
```

## 📊 Available Tools

### 1. analyze-links.ts
**Link Structure Analyzer** - Maps current knowledge graph state

**What it does**:
- Scans all markdown files in docs/, _planning/phases, _planning/specs
- Extracts wiki-style `[[links]]` and markdown `[links](paths)`
- Identifies broken links, orphaned files, and graph clusters
- Calculates link density and connection metrics

**Output**:
```
📊 Knowledge Graph Analysis
  Total Files: 120
  Connected Files: 75 (62.5%)
  Orphaned Files: 45 (37.5%)
  Link Density: 1.8 links/file

🔗 Graph Clusters (3 found)
  Cluster 0: 35 files (Phase 13 cluster)
  Cluster 1: 28 files (Chunking cluster)
  Cluster 2: 12 files (Learning Loop cluster)

📝 Full report: scripts/graph-tools/reports/link-analysis-*.json
```

**Use when**: You want to understand current graph connectivity

---

### 2. find-connections.ts
**Topical Similarity Engine** - Suggests semantic connections

**What it does**:
- Extracts keywords from markdown content using TF-IDF
- Calculates cosine similarity between all document pairs
- Identifies shared topics (chunking, embeddings, learning-loop, etc.)
- Suggests high-confidence connections with link types

**Output**:
```
🔍 Connection Discovery Results
  Total Connections Found: 87
  High Confidence: 23
  Medium Confidence: 41
  Low Confidence: 23

🏷️ Topic Clusters (9 topics)
  chunking: 15 files, 12 connections
  learning-loop: 22 files, 18 connections
  phase-13: 28 files, 25 connections

🔗 Top Connection Suggestions
  1. /docs/CHUNKING-STRATEGY-SYNTHESIS.md
     → /_planning/phases/phase-12-four-pillar-autonomous-agents.md
     Similarity: 85.3%
     Topics: chunking, embeddings, memory
     Type: implements

📝 Full report: scripts/graph-tools/reports/connections-*.json
```

**Use when**: You want to discover which files should be linked

---

## 📋 Workflow

### Phase 1: Analysis (Week 1)
```bash
# 1. Run link structure analysis
bun run analyze-links.ts

# 2. Find semantic connections
bun run find-connections.ts

# 3. Review JSON reports
cat scripts/graph-tools/reports/link-analysis-*.json
cat scripts/graph-tools/reports/connections-*.json
```

### Phase 2: Implementation (Week 2-3)
```bash
# Use the JSON reports to guide manual linking
# Add frontmatter and cross-references based on suggestions
```

### Phase 3: Validation (Week 4)
```bash
# Re-run analysis to verify improvements
bun run analyze-links.ts

# Check metrics:
# - Orphaned files <5%
# - Link density >2.5
# - Zero broken links
```

## 📁 Output Files

All analysis reports saved to:
```
scripts/graph-tools/reports/
├── link-analysis-<timestamp>.json
└── connections-<timestamp>.json
```

## 🔧 Configuration

**Edit tools to customize**:
- `SIMILARITY_THRESHOLD` in find-connections.ts (default: 0.6)
- `MIN_SHARED_TOPICS` in find-connections.ts (default: 2)
- `DOCS_DIRS` in both tools (scanned directories)

## 📚 Related Documentation

- **Strategy**: `/docs/hive-mind/reconnection-strategy.md` (complete plan)
- **Hive Mind Mission**: Original task brief from collective

## ✅ Success Criteria

After running reconnection strategy:
- [ ] Orphaned files <5% (currently ~40%)
- [ ] Link density >2.5 (currently ~1.0)
- [ ] Zero broken links
- [ ] All Phase 13 docs connected
- [ ] Chunking cluster complete
- [ ] Learning loop cluster connected

## 🚀 Next Steps

1. Review analysis output
2. Implement high-confidence connections
3. Add frontmatter metadata
4. Re-run validation
5. Update this README with final metrics

---

**Created**: 2025-10-27
**Part of**: Hive Mind Knowledge Graph Reconnection Strategy
