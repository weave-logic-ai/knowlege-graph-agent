---
title: 'Text Chunking Strategies for Vector Embeddings: Research Synthesis 2024-2025'
type: research
status: complete
created_date: {}
updated_date: '2025-10-28'
tags:
  - chunking
  - research-synthesis
  - vector-embeddings
  - late-chunking
  - semantic-chunking
  - 2024-2025
category: research
domain: chunking
scope: module
audience:
  - developers
  - architects
  - researchers
related_concepts:
  - late-chunking
  - semantic-chunking
  - recursive-chunking
  - overlap-strategies
  - memorographic-embeddings
  - xenova-transformers
related_files:
  - CHUNKING-STRATEGY-SYNTHESIS.md
  - chunking-implementation-guide.md
  - chunking-quick-reference.md
  - CHUNKING-IMPLEMENTATION-DESIGN.md
author: ai-generated
version: '1.0'
priority: high
visual:
  icon: "\U0001F52C"
  color: '#8B5CF6'
  cssclasses:
    - type-research
    - status-complete
    - priority-high
    - domain-chunking
---

# Text Chunking Strategies for Vector Embeddings: Research Synthesis 2024-2025

## Executive Summary

This document synthesizes current best practices (2024-2025) for text chunking strategies optimized for vector embeddings, with specific focus on learning content, memorographic embeddings, and implementation with `@xenova/transformers`.

**Key Finding**: The consensus for 2024-2025 is that **recursive/semantic chunking with 10-20% overlap** provides the best balance of retrieval precision and semantic coherence, with late chunking emerging as a breakthrough technique for preserving context.

---

## Top 5 Chunking Strategies (2024-2025)

### 1. **Late Chunking** (2024 Innovation) ⭐ RECOMMENDED

**What it is**: First applies the transformer to the entire text, generating token representations that encompass information from the whole document, then applies mean pooling to smaller segments.

**How it works**:
```
Traditional:  Split → Embed each chunk independently
Late Chunking: Embed entire document → Split embeddings → Pool chunks
```

**Advantages**:
- Chunk embeddings capture full contextual information from the entire document
- Leverages long-context embedding models (e.g., 8192 tokens for jina-embeddings-v2)
- Optimal chunk sizes remain small (paragraph-level) while maintaining global context
- No information loss at chunk boundaries

**Performance**: Significantly improves retrieval accuracy by preserving document-wide context

**Best for**: Learning content, reflections, knowledge articles where context matters

**Implementation with Jina**:
```javascript
// Using jina-embeddings-v3 API
{
  "input": ["sentence1", "sentence2", "sentence3"],
  "late_chunking": true  // Concatenates internally and performs late chunking
}
```

### 2. **Recursive/Hierarchical Chunking with Semantic Boundaries**

**What it is**: Divides text hierarchically using structural separators (paragraphs → sentences → words), recursively splitting until desired chunk size is achieved.

**Advantages**:
- 30-50% higher retrieval precision vs fixed-size chunking
- Preserves semantic coherence by respecting document structure
- Adapts to content with token-aware segmentation
- Maintains decision-critical context

**Performance**: Mean IoU@10 of 0.068 (best among traditional methods)

**Best for**: Structured documents, learning materials, technical content

**Implementation**:
```javascript
// Recursive splitter with semantic boundaries
const splitter = {
  separators: ['\n\n', '\n', '. ', ' ', ''],
  chunk_size: 512,
  chunk_overlap: 102,  // 20%
  length_function: tokenCount
};

function recursiveSplit(text, separators, maxSize) {
  if (tokenCount(text) <= maxSize) return [text];

  for (const sep of separators) {
    if (text.includes(sep)) {
      const splits = text.split(sep);
      const chunks = [];

      for (const split of splits) {
        if (tokenCount(split) > maxSize) {
          chunks.push(...recursiveSplit(split, separators.slice(1), maxSize));
        } else {
          chunks.push(split);
        }
      }
      return chunks;
    }
  }

  // Fallback to character-level split
  return [text.slice(0, maxSize), text.slice(maxSize)];
}
```

### 3. **Contextual Retrieval with Chunk Enrichment** (Anthropic 2024)

**What it is**: Prepends chunk-specific explanatory context (50-100 tokens) to each chunk before embedding.

**How it works**:
1. For each chunk, prompt an LLM with the entire document
2. Generate contextualized description (50-100 tokens)
3. Prepend context to chunk before embedding

**Example**:
```
Original chunk: "The company's revenue grew by 3% over the previous quarter."

Contextualized: "This chunk is from an SEC filing on ACME corp's performance
in Q2 2023; The company's revenue grew by 3% over the previous quarter."
```

**Performance**:
- 35% reduction in top-20 retrieval failure rate (5.7% → 3.7%)
- Combined with BM25: 49% reduction (5.7% → 2.9%)

**Cost**: $1.02 per million document tokens (with prompt caching)

**Best for**: Learning experiences, reflections, context-dependent knowledge

**Implementation**:
```javascript
async function contextualizeChunk(chunk, document, metadata) {
  const prompt = `
Given the following document and chunk, provide brief (50-100 tokens)
context that situates this chunk within the document.

Document: ${document.slice(0, 8000)}
Metadata: ${JSON.stringify(metadata)}
Chunk: ${chunk}

Context (50-100 tokens):`;

  const context = await llm.generate(prompt);
  return `${context}\n\n${chunk}`;
}
```

### 4. **Semantic Boundary Detection (Embedding-Based)**

**What it is**: Computes embeddings for overlapping sentence windows, identifies chunk boundaries at points of significant semantic discontinuity.

**How it works**:
1. Break document into sentences
2. Group each sentence with surrounding sentences (e.g., 3-sentence windows)
3. Generate embeddings for each group
4. Compare semantic similarity between consecutive groups
5. Create chunk boundary when similarity drops below threshold (95th percentile)

**Advantages**:
- Preserves topical coherence
- Adapts to natural topic shifts
- No fixed chunk size constraints

**Best for**: Multi-topic documents, diverse learning content

**Implementation**:
```javascript
async function semanticChunking(sentences, embedModel, threshold = 0.95) {
  const windowSize = 3;
  const windows = [];

  // Create overlapping windows
  for (let i = 0; i < sentences.length - windowSize + 1; i++) {
    windows.push(sentences.slice(i, i + windowSize).join(' '));
  }

  // Generate embeddings
  const embeddings = await embedModel.encode(windows);

  // Calculate similarities
  const similarities = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    similarities.push(cosineSimilarity(embeddings[i], embeddings[i + 1]));
  }

  // Find threshold (95th percentile of similarity drops)
  const sortedSimilarities = similarities.slice().sort();
  const thresholdValue = sortedSimilarities[Math.floor(sortedSimilarities.length * 0.05)];

  // Create chunks at semantic boundaries
  const chunks = [];
  let currentChunk = [sentences[0]];

  for (let i = 0; i < similarities.length; i++) {
    if (similarities[i] < thresholdValue) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [sentences[i + 1]];
    } else {
      currentChunk.push(sentences[i + 1]);
    }
  }

  chunks.push(currentChunk.join(' '));
  return chunks;
}
```

### 5. **Fixed-Size with Optimal Overlap** (Baseline)

**What it is**: Split text into chunks of predetermined size with strategic overlap.

**Advantages**:
- Computationally cheap and simple
- Fast processing for large datasets
- Consistent chunk sizes
- Surprisingly effective in realistic RAG scenarios (Vectara 2024 study)

**Limitations**:
- Can cut mid-sentence
- No semantic awareness
- Context loss at boundaries (mitigated by overlap)

**Best for**: Quick prototyping, baseline performance, simple fact retrieval

**Implementation**:
```javascript
function fixedSizeChunking(text, chunkSize = 512, overlap = 102) {
  const tokens = tokenize(text);
  const chunks = [];

  for (let i = 0; i < tokens.length; i += chunkSize - overlap) {
    const chunk = tokens.slice(i, i + chunkSize);
    chunks.push(detokenize(chunk));
  }

  return chunks;
}
```

---

## Specific Recommendations for Learning & Memory Content

### Learning-Specific Chunking Strategies

**1. Experience-Based Chunking** (for learning experiences, reflections)
```javascript
const learningChunkStrategy = {
  method: 'contextual_retrieval',  // Anthropic's method
  chunk_by: 'experience_boundary',  // One experience = one chunk
  enrich_with: {
    temporal_context: true,    // When was this learned?
    source_context: true,      // Where/how was this learned?
    emotional_context: true,   // How did the learner feel?
    application_context: true  // How was it applied?
  },
  min_chunk_size: 128,
  max_chunk_size: 512,
  overlap: 0  // No overlap for discrete experiences
};
```

**Example**:
```
Original reflection: "Today I learned that async/await makes code more readable
than promise chains. I struggled with error handling at first."

Contextualized chunk: "Learning experience from Oct 27, 2024 during JavaScript
study session. Topic: Asynchronous programming. Emotional state: Initially
frustrated, then satisfied. Today I learned that async/await makes code more
readable than promise chains. I struggled with error handling at first."
```

**2. Concept-Based Chunking** (for knowledge articles, lessons)
```javascript
const conceptChunkStrategy = {
  method: 'semantic_boundary',
  chunk_by: 'concept_completion',
  boundaries: [
    'concept_introduction',
    'explanation',
    'example',
    'summary'
  ],
  preserve_relationships: true,  // Link related concepts
  min_chunk_size: 256,
  max_chunk_size: 768
};
```

### Memorographic Embeddings

**Memory Types and Chunking Strategies**:

| Memory Type | Chunking Method | Chunk Size | Overlap | Enrichment |
|------------|-----------------|------------|---------|------------|
| **Episodic** (events, experiences) | Experience boundary | 128-512 | 0% | Temporal + emotional context |
| **Semantic** (facts, concepts) | Semantic boundary | 256-512 | 10% | Conceptual relationships |
| **Procedural** (how-to, skills) | Step-based | 128-384 | 20% | Prerequisites + outcomes |
| **Emotional** (feelings, reflections) | Sentiment coherence | 64-256 | 10% | Emotional state + triggers |
| **Meta-cognitive** (learning about learning) | Late chunking | 384-768 | 15% | Learning context + patterns |

**Implementation Example**:
```javascript
async function memorographicChunking(memory, type) {
  const strategies = {
    episodic: {
      boundaries: detectEventBoundaries(memory),
      enrich: (chunk) => addTemporalContext(chunk),
      size: [128, 512],
      overlap: 0
    },
    semantic: {
      boundaries: detectSemanticShifts(memory),
      enrich: (chunk) => addConceptualLinks(chunk),
      size: [256, 512],
      overlap: 0.1
    },
    procedural: {
      boundaries: detectSteps(memory),
      enrich: (chunk) => addPrerequisites(chunk),
      size: [128, 384],
      overlap: 0.2
    }
  };

  const strategy = strategies[type];
  const chunks = splitByBoundaries(memory, strategy.boundaries, strategy.size);

  return chunks.map(chunk => ({
    text: strategy.enrich(chunk),
    type: type,
    metadata: extractMemoryMetadata(chunk)
  }));
}
```

---

## Token Size Recommendations by Model

### For @xenova/transformers Models

| Model | Context Window | Recommended Chunk Size | Overlap | Notes |
|-------|---------------|----------------------|---------|-------|
| **all-MiniLM-L6-v2** | 256 tokens | 128-200 tokens | 20-40 tokens | Good for short facts |
| **all-mpnet-base-v2** | 384 tokens | 200-300 tokens | 40-60 tokens | Balanced performance |
| **jina-embeddings-v2** | 8192 tokens | 512-1024 tokens | 100-200 tokens | Use late chunking |
| **e5-base-v2** | 512 tokens | 256-384 tokens | 50-75 tokens | Strong semantic understanding |

### General Guidelines

**By Content Type**:
- **Short facts**: 64-128 tokens
- **Paragraph/concept**: 256-512 tokens
- **Multi-paragraph**: 512-1024 tokens
- **Full context**: Use late chunking with model's max context

**By Query Type**:
- **Fact-based queries**: Smaller chunks (128-256)
- **Analytical queries**: Larger chunks (512-1024)
- **Multi-concept queries**: Medium chunks with high overlap (256-512, 20% overlap)

### Optimal Starting Points (2024 Research)

```javascript
const recommendedDefaults = {
  // General purpose
  general: {
    chunk_size: 512,
    overlap: 102,  // 20%
    method: 'recursive'
  },

  // Learning content
  learning: {
    chunk_size: 384,
    overlap: 77,   // 20%
    method: 'contextual_retrieval'
  },

  // Memory/reflections
  memory: {
    chunk_size: 256,
    overlap: 51,   // 20%
    method: 'semantic_boundary'
  },

  // Technical documentation
  technical: {
    chunk_size: 768,
    overlap: 154,  // 20%
    method: 'recursive'
  }
};
```

---

## Overlap Strategies

### Standard Overlap (10-20%)

**Purpose**: Preserve context at chunk boundaries

```javascript
function calculateOverlap(chunkSize, overlapPercent = 0.2) {
  return Math.floor(chunkSize * overlapPercent);
}

// Examples:
// 512 tokens → 102 token overlap
// 256 tokens → 51 token overlap
// 1024 tokens → 205 token overlap
```

### Dynamic Overlap (Context-Aware)

**Purpose**: Adjust overlap based on semantic coherence

```javascript
async function dynamicOverlap(chunk1, chunk2, embedModel) {
  // Get embeddings for chunk ends
  const end1 = chunk1.slice(-50);
  const start2 = chunk2.slice(0, 50);

  const [emb1, emb2] = await embedModel.encode([end1, start2]);
  const similarity = cosineSimilarity(emb1, emb2);

  // Higher similarity = less overlap needed
  if (similarity > 0.8) return 0.1;      // 10% overlap
  if (similarity > 0.6) return 0.15;     // 15% overlap
  return 0.25;                            // 25% overlap
}
```

### Sentence-Boundary Overlap

**Purpose**: Never split sentences

```javascript
function sentenceBoundaryOverlap(text, targetChunkSize, targetOverlap) {
  const sentences = splitIntoSentences(text);
  const chunks = [];
  let currentChunk = [];
  let currentSize = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceSize = tokenCount(sentence);

    if (currentSize + sentenceSize > targetChunkSize && currentChunk.length > 0) {
      // Create chunk
      chunks.push(currentChunk.join(' '));

      // Calculate overlap in sentences
      const overlapSentences = Math.ceil(currentChunk.length * targetOverlap);
      currentChunk = currentChunk.slice(-overlapSentences);
      currentSize = tokenCount(currentChunk.join(' '));
    }

    currentChunk.push(sentence);
    currentSize += sentenceSize;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}
```

---

## Semantic Boundary Detection Techniques

### 1. Embedding Similarity Drop

```javascript
async function detectBoundariesBySimilarity(text, embedModel, threshold = 0.95) {
  const sentences = splitIntoSentences(text);
  const embeddings = await embedModel.encode(sentences);

  const boundaries = [0];

  for (let i = 0; i < embeddings.length - 1; i++) {
    const similarity = cosineSimilarity(embeddings[i], embeddings[i + 1]);

    // Boundary when similarity drops significantly
    if (similarity < threshold) {
      boundaries.push(i + 1);
    }
  }

  boundaries.push(sentences.length);
  return boundaries;
}
```

### 2. Topic Modeling

```javascript
async function detectBoundariesByTopic(text, windowSize = 5) {
  const sentences = splitIntoSentences(text);
  const boundaries = [0];

  for (let i = windowSize; i < sentences.length - windowSize; i++) {
    const before = sentences.slice(i - windowSize, i).join(' ');
    const after = sentences.slice(i, i + windowSize).join(' ');

    const topicsBefore = await extractTopics(before);
    const topicsAfter = await extractTopics(after);

    // Boundary when topics change significantly
    const overlap = topicOverlap(topicsBefore, topicsAfter);
    if (overlap < 0.3) {
      boundaries.push(i);
    }
  }

  boundaries.push(sentences.length);
  return boundaries;
}
```

### 3. Structural Markers

```javascript
function detectStructuralBoundaries(text) {
  const boundaries = [0];
  const lines = text.split('\n');

  const markers = [
    /^#{1,6}\s/,           // Markdown headers
    /^\d+\.\s/,            // Numbered lists
    /^[-*]\s/,             // Bullet points
    /^---+$/,              // Horizontal rules
    /^\[.+\]$/,            // Section markers
    /^(Chapter|Section|Part)\s+\d+/i  // Chapter markers
  ];

  let position = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (markers.some(marker => marker.test(line))) {
      boundaries.push(position);
    }

    position += line.length + 1; // +1 for newline
  }

  boundaries.push(text.length);
  return boundaries;
}
```

### 4. Multi-Modal Boundary Detection (Recommended)

```javascript
async function detectBoundariesMultiModal(text, embedModel) {
  // Combine multiple detection methods
  const structuralBoundaries = detectStructuralBoundaries(text);
  const semanticBoundaries = await detectBoundariesBySimilarity(text, embedModel);
  const topicBoundaries = await detectBoundariesByTopic(text);

  // Merge boundaries (within 5 sentence tolerance)
  const allBoundaries = [
    ...structuralBoundaries,
    ...semanticBoundaries,
    ...topicBoundaries
  ].sort((a, b) => a - b);

  // Deduplicate nearby boundaries
  const mergedBoundaries = [allBoundaries[0]];
  for (let i = 1; i < allBoundaries.length; i++) {
    if (allBoundaries[i] - mergedBoundaries[mergedBoundaries.length - 1] > 5) {
      mergedBoundaries.push(allBoundaries[i]);
    }
  }

  return mergedBoundaries;
}
```

---

## Complete Implementation Example with @xenova/transformers

```javascript
import { pipeline } from '@xenova/transformers';

class LearningContentChunker {
  constructor(options = {}) {
    this.embedModel = null;
    this.options = {
      method: options.method || 'late_chunking',
      chunkSize: options.chunkSize || 512,
      overlap: options.overlap || 0.2,
      minChunkSize: options.minChunkSize || 128,
      enrichContext: options.enrichContext !== false
    };
  }

  async initialize() {
    // Initialize embedding model
    this.embedModel = await pipeline(
      'feature-extraction',
      'Xenova/jina-embeddings-v2-base-en'
    );
  }

  async chunk(document, metadata = {}) {
    const method = this.options.method;

    switch (method) {
      case 'late_chunking':
        return this.lateChunking(document, metadata);

      case 'contextual_retrieval':
        return this.contextualChunking(document, metadata);

      case 'semantic_boundary':
        return this.semanticChunking(document, metadata);

      case 'recursive':
        return this.recursiveChunking(document, metadata);

      default:
        return this.fixedSizeChunking(document, metadata);
    }
  }

  async lateChunking(document, metadata) {
    // Step 1: Embed entire document
    const docEmbedding = await this.embedModel(document, {
      pooling: 'none',  // Get all token embeddings
      normalize: false
    });

    // Step 2: Split document into semantic chunks
    const sentences = this.splitIntoSentences(document);
    const chunks = this.groupSentencesIntoChunks(sentences);

    // Step 3: Apply mean pooling to token ranges for each chunk
    const result = [];
    let tokenOffset = 0;

    for (const chunk of chunks) {
      const chunkTokens = this.tokenCount(chunk.text);

      // Extract embeddings for this chunk's token range
      const chunkEmbedding = this.meanPooling(
        docEmbedding,
        tokenOffset,
        tokenOffset + chunkTokens
      );

      result.push({
        text: chunk.text,
        embedding: chunkEmbedding,
        metadata: {
          ...metadata,
          method: 'late_chunking',
          tokenRange: [tokenOffset, tokenOffset + chunkTokens]
        }
      });

      tokenOffset += chunkTokens;
    }

    return result;
  }

  async contextualChunking(document, metadata) {
    // Step 1: Create initial chunks
    const chunks = this.recursiveChunking(document, metadata);

    // Step 2: Enrich each chunk with context
    const enrichedChunks = [];

    for (const chunk of chunks) {
      let enrichedText = chunk.text;

      if (this.options.enrichContext) {
        const context = this.generateContext(chunk.text, document, metadata);
        enrichedText = `${context}\n\n${chunk.text}`;
      }

      const embedding = await this.embedModel(enrichedText, {
        pooling: 'mean',
        normalize: true
      });

      enrichedChunks.push({
        text: enrichedText,
        originalText: chunk.text,
        embedding: embedding.data,
        metadata: {
          ...chunk.metadata,
          method: 'contextual_retrieval',
          enriched: this.options.enrichContext
        }
      });
    }

    return enrichedChunks;
  }

  async semanticChunking(document, metadata) {
    const sentences = this.splitIntoSentences(document);

    // Create sentence windows
    const windowSize = 3;
    const windows = [];
    for (let i = 0; i < sentences.length - windowSize + 1; i++) {
      windows.push(sentences.slice(i, i + windowSize).join(' '));
    }

    // Generate embeddings for windows
    const embeddings = [];
    for (const window of windows) {
      const emb = await this.embedModel(window, {
        pooling: 'mean',
        normalize: true
      });
      embeddings.push(emb.data);
    }

    // Calculate similarities and find boundaries
    const similarities = [];
    for (let i = 0; i < embeddings.length - 1; i++) {
      similarities.push(this.cosineSimilarity(embeddings[i], embeddings[i + 1]));
    }

    // Find threshold (5th percentile = significant drops)
    const sorted = similarities.slice().sort();
    const threshold = sorted[Math.floor(sorted.length * 0.05)];

    // Create chunks at semantic boundaries
    const chunks = [];
    let currentChunk = [sentences[0]];

    for (let i = 0; i < similarities.length; i++) {
      if (similarities[i] < threshold) {
        const chunkText = currentChunk.join(' ');
        const embedding = await this.embedModel(chunkText, {
          pooling: 'mean',
          normalize: true
        });

        chunks.push({
          text: chunkText,
          embedding: embedding.data,
          metadata: {
            ...metadata,
            method: 'semantic_boundary',
            boundaryScore: similarities[i]
          }
        });

        currentChunk = [sentences[i + 1]];
      } else {
        currentChunk.push(sentences[i + 1]);
      }
    }

    // Add final chunk
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ');
      const embedding = await this.embedModel(chunkText, {
        pooling: 'mean',
        normalize: true
      });

      chunks.push({
        text: chunkText,
        embedding: embedding.data,
        metadata: {
          ...metadata,
          method: 'semantic_boundary'
        }
      });
    }

    return chunks;
  }

  recursiveChunking(document, metadata) {
    const separators = ['\n\n', '\n', '. ', ' '];
    const chunks = this.recursiveSplit(
      document,
      separators,
      this.options.chunkSize,
      this.options.overlap * this.options.chunkSize
    );

    return chunks.map(text => ({
      text,
      metadata: {
        ...metadata,
        method: 'recursive'
      }
    }));
  }

  recursiveSplit(text, separators, maxSize, overlap) {
    const tokens = this.tokenCount(text);

    if (tokens <= maxSize) {
      return [text];
    }

    const [currentSep, ...remainingSeps] = separators;
    const splits = text.split(currentSep);

    const chunks = [];
    let currentChunk = '';

    for (const split of splits) {
      const splitTokens = this.tokenCount(split);

      if (splitTokens > maxSize) {
        // Recursively split larger segments
        if (remainingSeps.length > 0) {
          chunks.push(...this.recursiveSplit(split, remainingSeps, maxSize, overlap));
        } else {
          // Fallback to character split
          chunks.push(split.slice(0, maxSize));
        }
      } else {
        const combinedTokens = this.tokenCount(currentChunk + split);

        if (combinedTokens > maxSize && currentChunk) {
          chunks.push(currentChunk);
          currentChunk = chunks.length > 0 ?
            currentChunk.slice(-(overlap)) + split : split;
        } else {
          currentChunk += (currentChunk ? currentSep : '') + split;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  fixedSizeChunking(document, metadata) {
    const chunkSize = this.options.chunkSize;
    const overlap = Math.floor(chunkSize * this.options.overlap);
    const sentences = this.splitIntoSentences(document);

    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    for (const sentence of sentences) {
      const sentenceSize = this.tokenCount(sentence);

      if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join(' '),
          metadata: {
            ...metadata,
            method: 'fixed_size',
            size: currentSize
          }
        });

        // Create overlap
        const overlapSentences = Math.ceil(currentChunk.length * this.options.overlap);
        currentChunk = currentChunk.slice(-overlapSentences);
        currentSize = this.tokenCount(currentChunk.join(' '));
      }

      currentChunk.push(sentence);
      currentSize += sentenceSize;
    }

    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join(' '),
        metadata: {
          ...metadata,
          method: 'fixed_size',
          size: currentSize
        }
      });
    }

    return chunks;
  }

  // Helper methods

  splitIntoSentences(text) {
    // Simple sentence splitter (use better NLP library in production)
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  groupSentencesIntoChunks(sentences) {
    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;

    for (const sentence of sentences) {
      const size = this.tokenCount(sentence);

      if (currentSize + size > this.options.chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join(' '),
          sentences: currentChunk.length
        });
        currentChunk = [];
        currentSize = 0;
      }

      currentChunk.push(sentence);
      currentSize += size;
    }

    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join(' '),
        sentences: currentChunk.length
      });
    }

    return chunks;
  }

  generateContext(chunk, document, metadata) {
    // Simple context generation (use LLM for better results)
    const contextParts = [];

    if (metadata.source) {
      contextParts.push(`Source: ${metadata.source}`);
    }

    if (metadata.timestamp) {
      contextParts.push(`Date: ${new Date(metadata.timestamp).toLocaleDateString()}`);
    }

    if (metadata.topic) {
      contextParts.push(`Topic: ${metadata.topic}`);
    }

    if (metadata.learningContext) {
      contextParts.push(`Context: ${metadata.learningContext}`);
    }

    return contextParts.join('. ') + '.';
  }

  tokenCount(text) {
    // Rough approximation (use proper tokenizer in production)
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  meanPooling(embeddings, start, end) {
    // Extract token range and compute mean
    const range = embeddings.slice(start, end);
    const sum = range.reduce((acc, val) => {
      return acc.map((a, i) => a + val[i]);
    }, new Array(range[0].length).fill(0));

    return sum.map(val => val / range.length);
  }

  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Usage example
async function main() {
  const chunker = new LearningContentChunker({
    method: 'late_chunking',  // or 'contextual_retrieval', 'semantic_boundary', etc.
    chunkSize: 512,
    overlap: 0.2,
    enrichContext: true
  });

  await chunker.initialize();

  const learningContent = `
Today I learned about async/await in JavaScript. It makes asynchronous code
much more readable than promise chains. At first, I struggled with error
handling, but then I realized you can use try/catch blocks just like with
synchronous code.

The key insight was understanding that async functions always return promises,
and await pauses execution until the promise resolves. This mental model helped
everything click into place.

I practiced by refactoring some old callback-based code to use async/await.
The difference in readability was striking - the code now reads almost like
synchronous code, making it much easier to understand the flow.
  `;

  const chunks = await chunker.chunk(learningContent, {
    source: 'learning-journal',
    timestamp: Date.now(),
    topic: 'JavaScript',
    learningContext: 'self-study',
    emotionalState: 'initially frustrated, then satisfied'
  });

  console.log('Generated chunks:', chunks);
}
```

---

## Performance Comparison Summary

| Method | Retrieval Accuracy | Computational Cost | Context Preservation | Best For |
|--------|-------------------|-------------------|---------------------|----------|
| **Late Chunking** | ⭐⭐⭐⭐⭐ Highest | ⭐⭐⭐ Medium | ⭐⭐⭐⭐⭐ Excellent | Learning content, context-critical |
| **Contextual Retrieval** | ⭐⭐⭐⭐⭐ Highest | ⭐⭐ High | ⭐⭐⭐⭐⭐ Excellent | Memory, reflections |
| **Semantic Boundary** | ⭐⭐⭐⭐ High | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Very Good | Multi-topic documents |
| **Recursive** | ⭐⭐⭐⭐ High | ⭐⭐⭐⭐ Low | ⭐⭐⭐ Good | Structured documents |
| **Fixed-Size** | ⭐⭐⭐ Moderate | ⭐⭐⭐⭐⭐ Very Low | ⭐⭐ Fair | Quick prototyping |

### Key Metrics (2024 Research)

- **Late Chunking**: Captures full document context while maintaining small chunk sizes
- **Contextual Retrieval**: 35-49% reduction in retrieval failures
- **Recursive**: 30-50% higher retrieval precision vs fixed-size
- **Semantic**: Adapts to natural topic boundaries
- **Fixed-Size**: Baseline performance, surprisingly effective in some scenarios

---

## Decision Framework

### Choose Late Chunking when:
- Working with learning content that requires full context
- Model supports long context windows (2048+ tokens)
- Context preservation is critical
- Computational resources allow

### Choose Contextual Retrieval when:
- Working with memory/reflection content
- Have access to LLM for context generation
- Budget allows ($1/million tokens)
- Need maximum retrieval accuracy

### Choose Semantic Boundary when:
- Documents have natural topic shifts
- Variable chunk sizes are acceptable
- Computational resources for embedding are available
- Need adaptive chunking

### Choose Recursive when:
- Working with structured documents
- Need predictable chunk sizes
- Balance between performance and simplicity
- Good all-around choice

### Choose Fixed-Size when:
- Quick prototyping needed
- Computational constraints
- Content is homogeneous
- Establishing baseline performance

---

## Key Takeaways

1. **Late chunking is the breakthrough of 2024** - preserves context without sacrificing granularity
2. **10-20% overlap is standard** - ensures boundary context preservation
3. **512 tokens is a safe default** - balance between context and precision
4. **Semantic boundaries > fixed size** - for most real-world applications
5. **Context enrichment matters** - especially for learning and memory content
6. **No one-size-fits-all** - experiment and evaluate with your specific data
7. **Smaller chunks often win** - for fact-based retrieval
8. **Larger chunks for analysis** - when broader context needed

---

## References

1. Jina AI - Late Chunking in Long-Context Embedding Models (2024)
2. Anthropic - Contextual Retrieval (2024)
3. Pinecone - Chunking Strategies for LLM Applications (2024)
4. Weaviate - Chunking Strategies for RAG (2024)
5. Vectara - Comparative Study of Chunking Methods (2024)
6. Databricks - Ultimate Guide to Chunking Strategies (2024)

---

*Last Updated: October 27, 2024*
