/**
 * Semantic Search Example
 *
 * Demonstrates how to:
 * 1. Index documents with chunking + embeddings
 * 2. Perform semantic search
 * 3. Use hybrid search (semantic + keyword)
 * 4. Filter and rank results
 */

import { createChunkManager } from '../../src/chunking/index.js';
import {
  createEmbeddingManager,
  createSimilaritySearch,
} from '../../src/embeddings/index.js';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  console.log('=== Semantic Search Example ===\n');

  // Initialize managers
  const chunkManager = createChunkManager('./data/chunks.db');
  const embeddingManager = createEmbeddingManager(
    './data/embeddings.db',
    'openai', // or 'xenova' for local
    'text-embedding-3-small'
  );

  // === STEP 1: Index Sample Documents ===
  console.log('Step 1: Indexing sample documents...\n');

  const sampleDocs = [
    {
      path: 'docs/authentication.md',
      content: `# Authentication Guide

## JWT Authentication

JSON Web Tokens (JWT) provide a secure way to authenticate users.
The token contains encoded user information and is signed to prevent tampering.

### Implementation

\`\`\`typescript
import jwt from 'jsonwebtoken';

function generateToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '1d' });
}
\`\`\`

### Best Practices

- Use strong secrets
- Set appropriate expiration times
- Store tokens securely (httpOnly cookies)
- Implement refresh tokens for long sessions
`,
    },
    {
      path: 'docs/database.md',
      content: `# Database Guide

## PostgreSQL Setup

PostgreSQL is a powerful relational database management system.

### Connection

\`\`\`typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  database: 'myapp',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  port: 5432
});
\`\`\`

### Query Optimization

- Use indexes on frequently queried columns
- Analyze query plans with EXPLAIN
- Use connection pooling
- Implement pagination for large datasets
`,
    },
    {
      path: 'docs/deployment.md',
      content: `# Deployment Guide

## Docker Deployment

Containerize your application for consistent deployments.

### Dockerfile

\`\`\`dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Best Practices

- Use multi-stage builds
- Minimize image layers
- Set resource limits
- Use health checks
- Implement graceful shutdown
`,
    },
  ];

  // Index each document
  for (const doc of sampleDocs) {
    // Chunk the document
    const response = await chunkManager.processDocument({
      content: doc.content,
      sourcePath: doc.path,
    });

    console.log(`✓ Chunked: ${doc.path} (${response.result.chunks.length} chunks)`);

    // Generate embeddings for chunks
    const requests = response.result.chunks.map((chunk) => ({
      text: chunk.content,
      chunkId: chunk.id,
      metadata: {
        docId: chunk.docId,
        sourcePath: doc.path,
        content: chunk.content, // Store for display
      },
    }));

    await embeddingManager.generateAndStoreBatch(requests);

    console.log(`✓ Embedded: ${doc.path}\n`);
  }

  // === STEP 2: Semantic Search ===
  console.log('\nStep 2: Semantic Search\n');

  const search = createSimilaritySearch(
    './data/embeddings.db',
    embeddingManager.getGenerator()
  );

  const queries = [
    'How do I authenticate users?',
    'Database connection setup',
    'Docker containerization',
  ];

  for (const query of queries) {
    console.log(`Query: "${query}"\n`);

    const results = await search.searchSemantic(query, {
      limit: 3,
      minScore: 0.6,
    });

    if (results.length === 0) {
      console.log('No results found.\n');
      continue;
    }

    results.forEach((result, i) => {
      console.log(`${i + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   Chunk: ${result.chunkId}`);
      console.log(
        `   Source: ${result.metadata.sourcePath || 'unknown'}`
      );
      const content = (result.metadata.content as string) || '';
      console.log(`   Content: ${content.substring(0, 150)}...\n`);
    });
  }

  // === STEP 3: Hybrid Search ===
  console.log('\nStep 3: Hybrid Search (Semantic + Keyword)\n');

  const hybridQuery = 'JWT token authentication';
  console.log(`Query: "${hybridQuery}"\n`);

  const hybridResults = await search.searchHybrid(hybridQuery, {
    limit: 5,
    semanticWeight: 0.7, // 70% semantic
    keywordWeight: 0.3, // 30% keyword
    minScore: 0.5,
  });

  hybridResults.forEach((result, i) => {
    console.log(`${i + 1}. Combined Score: ${(result.score * 100).toFixed(1)}%`);
    console.log(
      `   (Semantic: ${(result.semanticScore * 100).toFixed(1)}%, ` +
        `Keyword: ${(result.keywordScore * 100).toFixed(1)}%)`
    );
    console.log(`   Chunk: ${result.chunkId}`);
    const content = (result.metadata.content as string) || '';
    console.log(`   Content: ${content.substring(0, 100)}...\n`);
  });

  // === STEP 4: Advanced Filtering ===
  console.log('\nStep 4: Filtered Search\n');

  const filteredQuery = 'best practices';
  console.log(`Query: "${filteredQuery}" (filtered to authentication docs)\n`);

  const filteredResults = await search.searchSemantic(filteredQuery, {
    limit: 5,
    minScore: 0.5,
    filters: {
      sourcePath: 'docs/authentication.md',
    },
  });

  filteredResults.forEach((result, i) => {
    console.log(`${i + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
    const content = (result.metadata.content as string) || '';
    console.log(`   Content: ${content.substring(0, 200)}...\n`);
  });

  // === STEP 5: Statistics ===
  console.log('\nStep 5: Statistics\n');

  const embeddingStats = embeddingManager.getStats();
  console.log('Embedding Stats:');
  console.log(`- Total Embeddings: ${embeddingStats.totalEmbeddings}`);
  console.log(`- Cache Hits: ${embeddingStats.cacheHits}`);
  console.log(`- Cache Misses: ${embeddingStats.cacheMisses}`);
  console.log(
    `- Cache Hit Rate: ${
      (
        (embeddingStats.cacheHits /
          (embeddingStats.cacheHits + embeddingStats.cacheMisses)) *
        100
      ).toFixed(1)
    }%`
  );
  console.log(`- Providers: ${JSON.stringify(embeddingStats.providers)}`);
  console.log(`- Models: ${JSON.stringify(embeddingStats.models)}\n`);

  const chunkStats = chunkManager.getStats();
  console.log('Chunk Stats:');
  console.log(`- Total Chunks: ${chunkStats.totalChunks}`);
  console.log(`- Total Documents: ${chunkStats.totalDocs}`);
  console.log(`- Total Relationships: ${chunkStats.totalRelationships}\n`);

  // Cleanup
  embeddingManager.close();
  chunkManager.close();

  console.log('✓ Example complete!');
}

// Run example
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
