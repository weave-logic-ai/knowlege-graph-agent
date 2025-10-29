---
title: Chunking Strategies Quick Reference
type: reference
status: complete
created_date: {}
updated_date: '2025-10-28'
tags:
  - chunking
  - quick-reference
  - configuration
  - decision-tree
  - weave-nn
category: technical
domain: chunking
scope: module
audience:
  - developers
related_concepts:
  - chunking-strategies
  - semantic-boundary
  - configuration
  - chunk-size
  - overlap
related_files:
  - chunking-implementation-guide.md
  - CHUNKING-STRATEGY-SYNTHESIS.md
  - chunking-strategies-research-2024-2025.md
author: ai-generated
version: '1.0'
priority: high
visual:
  icon: 📄
  cssclasses:
    - type-reference
    - status-complete
    - priority-high
    - domain-chunking
icon: 📄
---

# Chunking Strategies Quick Reference

## TL;DR Recommendations for Weave-NN

### Default Configuration (Start Here)

```typescript
const DEFAULT_CHUNKING = {
  method: 'semantic_boundary',
  chunkSize: 512,
  overlap: 102,  // 20%
  enrichContext: true
};
```

---





## Related

[[VECTOR-DB-MARKDOWN-WORKFLOW-ARCHITECTURE]]
## Related

[[chunking-implementation-guide]]
## Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│               What type of content are you chunking?         │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┼───────────────────┐
        ↓                   ↓                   ↓
   Learning/Memory      Knowledge           Code/Facts
   (Experiences)        (Articles)          (Structured)
        ↓                   ↓                   ↓
  Contextual Boundary  Semantic Boundary    Structural
  384 tokens          512 tokens           256 tokens
  20% overlap         20% overlap          20% overlap
  + Context enrich    + Topic detection    + Preserve structure
```

---

## Strategy Cheat Sheet

| Content Type | Method | Chunk Size | Overlap | Enrichment | Priority |
|--------------|--------|------------|---------|------------|----------|
| **Learning journal** | contextual_boundary | 384 | 20% | ✅ High | Accuracy |
| **Reflections** | contextual_boundary | 256 | 10% | ✅ High | Coherence |
| **Knowledge articles** | semantic_boundary | 512 | 20% | ✅ Medium | Balance |
| **Documentation** | semantic_boundary | 768 | 15% | ⚠️ Low | Coverage |
| **Code snippets** | structural | 256 | 20% | ⚠️ Low | Structure |
| **Quick facts** | fixed | 128 | 20% | ❌ None | Speed |

---

## Model-Specific Recommendations

### For @xenova/transformers

| Model | Max Context | Recommended Chunk | Use Case |
|-------|-------------|------------------|----------|
| **all-MiniLM-L6-v2** | 256 | 128-200 | Fast, general purpose |
| **all-mpnet-base-v2** | 384 | 200-300 | Better accuracy |
| **jina-embeddings-v2** | 8192 | 512-1024 | Long context, late chunking |
| **e5-base-v2** | 512 | 256-384 | Strong semantic |

**Recommended for Weave-NN**: Start with `all-MiniLM-L6-v2` for speed, upgrade to `all-mpnet-base-v2` for accuracy.

---

## Token Size Guidelines

### By Content Length

| Content Length | Recommended Chunk | Overlap | Method |
|---------------|-------------------|---------|---------|
| < 500 words | 128-256 tokens | 20% | Fixed or semantic |
| 500-2000 words | 256-512 tokens | 15-20% | Semantic boundary |
| 2000-5000 words | 512-768 tokens | 10-15% | Semantic boundary |
| > 5000 words | 768-1024 tokens | 10% | Late chunking |

### By Query Type

| Query Type | Chunk Size | Why |
|-----------|------------|-----|
| Fact lookup | 128-256 | Small, precise chunks |
| Concept search | 256-512 | Medium chunks for context |
| Multi-topic | 512-768 | Large chunks for relationships |
| Full context | 768-1024 | Maximum context preservation |

---

## Overlap Strategy Quick Guide

```typescript
// Standard overlap (most cases)
const overlap = Math.floor(chunkSize * 0.2);  // 20%

// High context preservation (learning content)
const overlap = Math.floor(chunkSize * 0.25);  // 25%

// Low overlap (independent chunks)
const overlap = Math.floor(chunkSize * 0.1);   // 10%

// No overlap (discrete experiences)
const overlap = 0;
```

---

## Context Enrichment Template

### Learning Content
```
Source: [source name]
Date: [YYYY-MM-DD]
Topic: [topic]
Context: [learning context]
Emotional state: [mood/feeling]

[Original chunk text]
```

### Knowledge Content
```
Source: [source name]
Date: [YYYY-MM-DD]
Topic: [topic]
Part [X] of [Y]

[Original chunk text]
```

### Memory Content
```
Source: [source name]
Date: [YYYY-MM-DD]
Context: [when/where/why]
Emotional context: [feelings]

[Original chunk text]
```

---

## Performance Benchmarks (2024 Research)

| Method | Retrieval Accuracy | Speed | Memory | Best For |
|--------|-------------------|-------|--------|----------|
| Late chunking | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Context-critical |
| Contextual retrieval | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | Learning/memory |
| Semantic boundary | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | General purpose |
| Recursive | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Structured docs |
| Fixed size | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Quick baseline |

### Key Metrics
- **Late chunking**: Preserves full document context
- **Contextual retrieval**: 35-49% better retrieval accuracy
- **Semantic boundary**: 30-50% better than fixed size
- **Recursive**: Best balance of speed and accuracy
- **Fixed size**: Fastest, surprisingly effective

---

## Common Mistakes to Avoid

### ❌ DON'T
1. Use fixed-size chunking for learning content
2. Set overlap < 10% for contextual content
3. Create chunks larger than model's context window
4. Ignore semantic boundaries
5. Skip context enrichment for memory content
6. Use same strategy for all content types

### ✅ DO
1. Match strategy to content type
2. Maintain 10-20% overlap as default
3. Enrich learning/memory content with context
4. Test with your specific data
5. Monitor retrieval accuracy
6. Adjust based on query patterns

---

## Quick Implementation Checklist

### Phase 1: Basic Chunking
- [ ] Implement semantic boundary chunking
- [ ] Set chunk size to 512 tokens
- [ ] Set overlap to 20%
- [ ] Test with sample content
- [ ] Measure baseline retrieval

### Phase 2: Content-Aware
- [ ] Detect content types
- [ ] Implement contextual boundary for learning
- [ ] Implement structural chunking for code
- [ ] Add basic context enrichment
- [ ] Test retrieval improvement

### Phase 3: Optimization
- [ ] Add context enrichment for all content
- [ ] Implement batch processing
- [ ] Add chunk caching
- [ ] Fine-tune chunk sizes per type
- [ ] Monitor performance metrics

### Phase 4: Advanced (Future)
- [ ] Implement late chunking
- [ ] Use LLM for context generation
- [ ] Add dynamic chunk sizing
- [ ] Implement adaptive overlap
- [ ] Advanced semantic detection

---

## Testing Your Configuration

### Simple Test
```typescript
const testContent = "Your sample content here...";

// Test different strategies
const strategies = ['semantic_boundary', 'contextual_boundary', 'fixed'];

for (const strategy of strategies) {
  const chunks = await chunker.chunk(testContent, strategy);
  console.log(`${strategy}: ${chunks.length} chunks`);

  // Test retrieval
  const query = "your test query";
  const results = await search(query, chunks);
  console.log(`Top result similarity: ${results[0].similarity}`);
}
```

### Metrics to Track
- **Chunk count**: How many chunks are created?
- **Chunk size variance**: Are chunks consistent?
- **Retrieval accuracy**: Do queries return relevant chunks?
- **Processing time**: How long does chunking take?
- **Memory usage**: How much RAM is used?

---

## Configuration Examples

### Example 1: Personal Learning Vault
```typescript
{
  learning: {
    method: 'contextual_boundary',
    chunkSize: 384,
    overlap: 77,
    enrichContext: true,
    metadata: {
      includeDate: true,
      includeTopic: true,
      includeEmotion: true,
      includeContext: true
    }
  },
  knowledge: {
    method: 'semantic_boundary',
    chunkSize: 512,
    overlap: 102,
    enrichContext: true
  }
}
```

### Example 2: Technical Documentation
```typescript
{
  documentation: {
    method: 'semantic_boundary',
    chunkSize: 768,
    overlap: 154,
    enrichContext: false  // Keep lean
  },
  code: {
    method: 'structural',
    chunkSize: 256,
    overlap: 51,
    preserveStructure: true
  }
}
```

### Example 3: Mixed Content
```typescript
{
  default: {
    method: 'semantic_boundary',
    chunkSize: 512,
    overlap: 102,
    enrichContext: true
  },
  autoDetect: true  // Detect and switch strategies
}
```

---

## When to Use Each Strategy

### Contextual Boundary
**Use when:**
- Processing learning journals
- Chunking reflections or memories
- Content has clear experience boundaries
- Context preservation is critical
- Temporal/emotional metadata matters

**Don't use when:**
- Processing general documentation
- Speed is priority over accuracy
- Content is uniform/homogeneous

### Semantic Boundary
**Use when:**
- Processing knowledge articles
- Content has natural topic shifts
- Balance between speed and accuracy needed
- General-purpose chunking required
- Content structure is varied

**Don't use when:**
- Content is highly uniform
- Computational resources are limited
- Fixed sizes are required

### Structural
**Use when:**
- Processing code with examples
- Content has clear structural markers
- Preserving structure is important
- Markdown or formatted content
- Lists, headings, code blocks present

**Don't use when:**
- Content is plain text
- No clear structural boundaries
- Semantic coherence matters more

### Fixed Size
**Use when:**
- Quick prototyping
- Computational constraints
- Establishing baseline
- Content is uniform
- Speed is critical

**Don't use when:**
- Accuracy is priority
- Content has semantic boundaries
- Context preservation matters

---

## Troubleshooting Guide

### Problem: Poor Retrieval Accuracy

**Symptoms:**
- Queries return irrelevant chunks
- Missing expected results
- Low similarity scores

**Solutions:**
1. Switch to semantic or contextual boundary
2. Increase chunk overlap to 25-30%
3. Enable context enrichment
4. Increase chunk size for more context
5. Try late chunking for long documents

### Problem: Too Many Chunks

**Symptoms:**
- Slow indexing
- High memory usage
- Redundant results

**Solutions:**
1. Increase chunk size
2. Reduce overlap
3. Use more aggressive semantic boundaries
4. Filter out very short chunks
5. Merge similar adjacent chunks

### Problem: Chunks Too Large

**Symptoms:**
- Exceed model context window
- Generic results (not specific enough)
- Slow embedding generation

**Solutions:**
1. Decrease chunk size
2. Switch to fixed-size chunking
3. Increase semantic boundary sensitivity
4. Split by structural markers

### Problem: Context Loss

**Symptoms:**
- Chunks missing important context
- Standalone chunks don't make sense
- Poor retrieval for multi-step queries

**Solutions:**
1. Increase overlap to 25-30%
2. Enable context enrichment
3. Use contextual boundary strategy
4. Try late chunking
5. Include more metadata

### Problem: Slow Processing

**Symptoms:**
- Long chunking time
- High CPU usage
- UI freezes

**Solutions:**
1. Switch to fixed-size chunking
2. Implement batch processing
3. Add chunk caching
4. Reduce chunk overlap
5. Process incrementally

---

## Migration Path

### From Simple to Advanced

**Stage 1: Fixed Size (Day 1)**
```typescript
{ method: 'fixed', chunkSize: 512, overlap: 102 }
```

**Stage 2: Semantic (Week 1)**
```typescript
{ method: 'semantic_boundary', chunkSize: 512, overlap: 102 }
```

**Stage 3: Content-Aware (Week 2)**
```typescript
// Auto-detect and switch strategies
{
  autoDetect: true,
  learning: { method: 'contextual_boundary', chunkSize: 384 },
  knowledge: { method: 'semantic_boundary', chunkSize: 512 }
}
```

**Stage 4: Optimized (Month 1)**
```typescript
// Full optimization with enrichment
{
  autoDetect: true,
  enrichContext: true,
  strategies: { /* customized per type */ },
  caching: true,
  batchProcessing: true
}
```

---

## Key Takeaways

1. **Start with semantic boundary chunking** at 512 tokens with 20% overlap
2. **Use contextual boundary for learning content** - it's worth the extra cost
3. **Always enrich learning/memory chunks** with temporal and emotional context
4. **10-20% overlap is the sweet spot** for most content types
5. **Smaller chunks (128-256) for facts**, larger (512-768) for concepts
6. **Test with your actual data** - benchmarks are guidelines, not rules
7. **Monitor retrieval accuracy** - adjust based on query performance
8. **Batch process and cache** - chunking can be expensive

---

## Resources

- **Full Research**: `/docs/chunking-strategies-research-2024-2025.md`
- **Implementation Guide**: `/docs/chunking-implementation-guide.md`
- **Latest Papers**:
  - Jina AI - Late Chunking (2024)
  - Anthropic - Contextual Retrieval (2024)

---

*Quick Reference - Last Updated: October 27, 2024*
