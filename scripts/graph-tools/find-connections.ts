#!/usr/bin/env bun
/**
 * Topical Similarity Engine
 * Finds semantic connections between markdown files using TF-IDF
 */

import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, relative, dirname, resolve } from 'path';

// Types
interface Document {
  path: string;
  content: string;
  keywords: string[];
  tfidf: Map<string, number>;
}

interface ConnectionSuggestion {
  source: string;
  target: string;
  similarity: number;
  sharedTopics: string[];
  linkType: 'implements' | 'references' | 'extends' | 'depends-on' | 'related';
  confidence: 'high' | 'medium' | 'low';
}

interface TopicCluster {
  topic: string;
  files: string[];
  connections: number;
}

// Configuration
const PROJECT_ROOT = resolve(dirname(dirname(__dirname)));
const SIMILARITY_THRESHOLD = 0.6;
const MIN_SHARED_TOPICS = 2;

const TOPIC_KEYWORDS = {
  chunking: ['chunk', 'chunking', 'event-based', 'semantic-boundary', 'preference-signal', 'step-based', 'episodic', 'procedural'],
  embeddings: ['embedding', 'vector', 'semantic', 'similarity', 'cosine', 'hybrid-search', 'tfidf'],
  'learning-loop': ['learning', 'reflection', 'perception', 'reasoning', 'execution', 'memory', 'autonomous'],
  'phase-12': ['phase-12', 'four-pillar', 'autonomous-agent', 'pillar'],
  'phase-13': ['phase-13', 'integration', 'production', 'deployment'],
  workflows: ['workflow', 'automation', 'markdown', 'async', 'vector-db'],
  mcp: ['mcp', 'tool', 'server', 'coordination', 'claude-flow'],
  architecture: ['architecture', 'design', 'system', 'microservices', 'local-first'],
  weaver: ['weaver', 'cli', 'service', 'vault', 'sops']
};

// Extract keywords from markdown content
function extractKeywords(content: string): string[] {
  // Remove YAML frontmatter
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Remove markdown formatting
  const cleanText = withoutFrontmatter
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
    .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1') // wiki links
    .replace(/[#*_~`]/g, '') // markdown symbols
    .toLowerCase();

  // Extract words (alphanumeric + hyphen)
  const words = cleanText.match(/[a-z0-9-]+/g) || [];

  // Filter stop words and short words
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those']);

  return words.filter(w => w.length > 2 && !stopWords.has(w));
}

// Calculate TF-IDF for documents
function calculateTFIDF(documents: Document[]): void {
  // Calculate document frequency for each term
  const docFrequency = new Map<string, number>();

  documents.forEach(doc => {
    const uniqueWords = new Set(doc.keywords);
    uniqueWords.forEach(word => {
      docFrequency.set(word, (docFrequency.get(word) || 0) + 1);
    });
  });

  const totalDocs = documents.length;

  // Calculate TF-IDF for each document
  documents.forEach(doc => {
    const termFrequency = new Map<string, number>();

    // Calculate term frequency
    doc.keywords.forEach(word => {
      termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
    });

    // Calculate TF-IDF
    doc.tfidf = new Map();
    termFrequency.forEach((tf, term) => {
      const df = docFrequency.get(term) || 1;
      const idf = Math.log(totalDocs / df);
      doc.tfidf.set(term, (tf / doc.keywords.length) * idf);
    });
  });
}

// Calculate cosine similarity between two TF-IDF vectors
function cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  // Get all unique terms
  const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);

  allTerms.forEach(term => {
    const v1 = vec1.get(term) || 0;
    const v2 = vec2.get(term) || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// Identify shared topics between two documents
function identifySharedTopics(doc1: Document, doc2: Document): string[] {
  const sharedTopics: string[] = [];

  Object.entries(TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
    const doc1HasTopic = keywords.some(kw => doc1.keywords.includes(kw));
    const doc2HasTopic = keywords.some(kw => doc2.keywords.includes(kw));

    if (doc1HasTopic && doc2HasTopic) {
      sharedTopics.push(topic);
    }
  });

  return sharedTopics;
}

// Infer link type based on file paths and content
function inferLinkType(source: string, target: string, sharedTopics: string[]): ConnectionSuggestion['linkType'] {
  const sourcePath = source.toLowerCase();
  const targetPath = target.toLowerCase();

  // Planning → Implementation
  if (sourcePath.includes('_planning') && targetPath.includes('docs')) {
    return 'implements';
  }

  // Spec → Planning
  if (sourcePath.includes('specs') && targetPath.includes('phases')) {
    return 'extends';
  }

  // Phase dependencies
  if (sourcePath.includes('phase') && targetPath.includes('phase')) {
    const sourcePhase = sourcePath.match(/phase-?(\d+)/)?.[1];
    const targetPhase = targetPath.match(/phase-?(\d+)/)?.[1];

    if (sourcePhase && targetPhase && parseInt(targetPhase) < parseInt(sourcePhase)) {
      return 'depends-on';
    }
  }

  // Research → Implementation
  if (sourcePath.includes('research') && !targetPath.includes('research')) {
    return 'references';
  }

  return 'related';
}

// Determine confidence level
function calculateConfidence(similarity: number, sharedTopics: number): ConnectionSuggestion['confidence'] {
  if (similarity >= 0.75 && sharedTopics >= 3) return 'high';
  if (similarity >= 0.65 && sharedTopics >= 2) return 'medium';
  return 'low';
}

// Find all connection suggestions
function findConnections(documents: Document[], threshold: number): ConnectionSuggestion[] {
  const suggestions: ConnectionSuggestion[] = [];

  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const doc1 = documents[i];
      const doc2 = documents[j];

      const similarity = cosineSimilarity(doc1.tfidf, doc2.tfidf);

      if (similarity >= threshold) {
        const sharedTopics = identifySharedTopics(doc1, doc2);

        if (sharedTopics.length >= MIN_SHARED_TOPICS) {
          const linkType = inferLinkType(doc1.path, doc2.path, sharedTopics);
          const confidence = calculateConfidence(similarity, sharedTopics.length);

          suggestions.push({
            source: doc1.path,
            target: doc2.path,
            similarity,
            sharedTopics,
            linkType,
            confidence
          });

          // Add reverse direction
          suggestions.push({
            source: doc2.path,
            target: doc1.path,
            similarity,
            sharedTopics,
            linkType,
            confidence
          });
        }
      }
    }
  }

  return suggestions.sort((a, b) => b.similarity - a.similarity);
}

// Identify topic clusters
function identifyTopicClusters(documents: Document[], suggestions: ConnectionSuggestion[]): TopicCluster[] {
  const clusterMap = new Map<string, Set<string>>();

  Object.keys(TOPIC_KEYWORDS).forEach(topic => {
    clusterMap.set(topic, new Set());
  });

  // Assign files to topic clusters
  documents.forEach(doc => {
    Object.entries(TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
      const hasTopic = keywords.some(kw => doc.keywords.includes(kw));
      if (hasTopic) {
        clusterMap.get(topic)!.add(doc.path);
      }
    });
  });

  // Count connections per cluster
  const clusters: TopicCluster[] = [];

  clusterMap.forEach((files, topic) => {
    const filesArray = Array.from(files);
    const connections = suggestions.filter(s =>
      filesArray.includes(s.source) && filesArray.includes(s.target)
    ).length / 2; // Divide by 2 because we have bidirectional

    if (filesArray.length > 0) {
      clusters.push({
        topic,
        files: filesArray,
        connections
      });
    }
  });

  return clusters.sort((a, b) => b.files.length - a.files.length);
}

// Pretty print results
function printResults(suggestions: ConnectionSuggestion[], clusters: TopicCluster[]) {
  console.log('\n🔍 Connection Discovery Results\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📊 **Summary**\n`);
  console.log(`  Total Connections Found: ${suggestions.length / 2}`);
  console.log(`  High Confidence: ${suggestions.filter(s => s.confidence === 'high').length / 2}`);
  console.log(`  Medium Confidence: ${suggestions.filter(s => s.confidence === 'medium').length / 2}`);
  console.log(`  Low Confidence: ${suggestions.filter(s => s.confidence === 'low').length / 2}\n`);

  console.log(`🏷️  **Topic Clusters** (${clusters.length} topics)\n`);
  clusters.forEach(cluster => {
    console.log(`  ${cluster.topic}: ${cluster.files.length} files, ${cluster.connections} connections`);
  });

  console.log(`\n🔗 **Top Connection Suggestions** (High Confidence)\n`);
  const highConfidence = suggestions
    .filter(s => s.confidence === 'high')
    .slice(0, 10);

  highConfidence.forEach((suggestion, idx) => {
    console.log(`  ${idx + 1}. ${suggestion.source}`);
    console.log(`     → ${suggestion.target}`);
    console.log(`     Similarity: ${(suggestion.similarity * 100).toFixed(1)}%`);
    console.log(`     Topics: ${suggestion.sharedTopics.join(', ')}`);
    console.log(`     Type: ${suggestion.linkType}\n`);
  });

  console.log('═══════════════════════════════════════════════════════════\n');
}

// Main execution
async function main() {
  console.log('🔍 Finding semantic connections...\n');

  const DOCS_DIRS = [
    'weave-nn/docs',
    'weave-nn/_planning/phases',
    'weave-nn/_planning/specs',
    'weave-nn/_planning/research'
  ];

  // Scan all markdown files
  const documents: Document[] = [];

  DOCS_DIRS.forEach(dir => {
    const fullPath = join(PROJECT_ROOT, dir);

    function scanDir(path: string) {
      try {
        const entries = readdirSync(path, { withFileTypes: true });

        entries.forEach(entry => {
          const fullEntryPath = join(path, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            scanDir(fullEntryPath);
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            const content = readFileSync(fullEntryPath, 'utf-8');
            const keywords = extractKeywords(content);

            documents.push({
              path: relative(PROJECT_ROOT, fullEntryPath),
              content,
              keywords,
              tfidf: new Map()
            });
          }
        });
      } catch (error) {
        console.error(`Error scanning ${path}:`, error);
      }
    }

    if (existsSync(fullPath)) {
      scanDir(fullPath);
    }
  });

  console.log(`  Processed: ${documents.length} documents\n`);

  // Calculate TF-IDF
  console.log('  Calculating TF-IDF vectors...');
  calculateTFIDF(documents);

  // Find connections
  console.log('  Finding semantic connections...');
  const suggestions = findConnections(documents, SIMILARITY_THRESHOLD);

  // Identify topic clusters
  console.log('  Identifying topic clusters...');
  const clusters = identifyTopicClusters(documents, suggestions);

  // Print results
  printResults(suggestions, clusters);

  // Save JSON report
  const reportDir = join(PROJECT_ROOT, 'scripts/graph-tools/reports');
  mkdirSync(reportDir, { recursive: true });

  const reportPath = join(reportDir, `connections-${Date.now()}.json`);
  writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    threshold: SIMILARITY_THRESHOLD,
    suggestions,
    clusters,
    summary: {
      totalConnections: suggestions.length / 2,
      highConfidence: suggestions.filter(s => s.confidence === 'high').length / 2,
      mediumConfidence: suggestions.filter(s => s.confidence === 'medium').length / 2,
      lowConfidence: suggestions.filter(s => s.confidence === 'low').length / 2
    }
  }, null, 2));

  console.log(`📝 Full report saved: ${relative(PROJECT_ROOT, reportPath)}\n`);
  console.log('✅ Connection discovery complete!\n');
}

main().catch(console.error);
