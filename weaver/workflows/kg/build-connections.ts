/**
 * Connection Builder Workflow
 *
 * Builds connections between markdown files using multiple strategies:
 * - Semantic similarity (TF-IDF + cosine similarity)
 * - Directory proximity
 * - Temporal relationships (phase evolution)
 * - Implementation links (planning → code → tests)
 *
 * @workflow
 */
'use workflow';

import { readFile, writeFile } from 'fs/promises';
import { join, dirname, basename, relative } from 'path';
import matter from 'gray-matter';
import { analyzeStructure, type StructureAnalysis } from './analyze-structure';

export interface ConnectionStrategy {
  strategy: 'semantic' | 'directory' | 'temporal' | 'implementation' | 'hybrid';
  minSimilarity?: number;
  maxConnections?: number;
  autoInsert?: boolean;
}

export interface Connection {
  source: string;
  target: string;
  type: 'semantic' | 'hierarchical' | 'temporal' | 'implementation';
  score: number;
  reason: string;
}

export interface ConnectionResult {
  connectionsCreated: number;
  filesModified: number;
  connectionsByType: Record<string, number>;
  topConnections: Connection[];
}

/**
 * Main workflow function
 */
export async function buildConnections(
  strategy: ConnectionStrategy,
  rootPath: string = '/home/aepod/dev/weave-nn'
): Promise<ConnectionResult> {
  console.log(`🔗 Building connections using ${strategy.strategy} strategy...`);

  // Analyze current structure
  const analysis = await analyzeStructure(rootPath);

  // Build connections based on strategy
  let connections: Connection[] = [];

  switch (strategy.strategy) {
    case 'semantic':
      connections = await buildSemanticConnections(analysis, rootPath, strategy);
      break;
    case 'directory':
      connections = await buildDirectoryConnections(analysis, strategy);
      break;
    case 'temporal':
      connections = await buildTemporalConnections(analysis, strategy);
      break;
    case 'implementation':
      connections = await buildImplementationConnections(analysis, rootPath, strategy);
      break;
    case 'hybrid':
      connections = await buildHybridConnections(analysis, rootPath, strategy);
      break;
  }

  // Rank and filter connections
  connections = rankConnections(connections, strategy);

  // Insert connections if requested
  let filesModified = 0;
  if (strategy.autoInsert) {
    filesModified = await insertConnections(connections, rootPath);
  }

  // Calculate statistics
  const connectionsByType = calculateTypeDistribution(connections);

  const result: ConnectionResult = {
    connectionsCreated: connections.length,
    filesModified,
    connectionsByType,
    topConnections: connections.slice(0, 20)
  };

  console.log('✅ Connection building complete!');
  console.log(`   Connections created: ${result.connectionsCreated}`);
  console.log(`   Files modified: ${result.filesModified}`);
  console.log(`   Semantic: ${connectionsByType.semantic || 0}`);
  console.log(`   Hierarchical: ${connectionsByType.hierarchical || 0}`);
  console.log(`   Temporal: ${connectionsByType.temporal || 0}`);
  console.log(`   Implementation: ${connectionsByType.implementation || 0}`);

  return result;
}

/**
 * Build semantic connections using TF-IDF and cosine similarity
 */
async function buildSemanticConnections(
  analysis: StructureAnalysis,
  rootPath: string,
  strategy: ConnectionStrategy
): Promise<Connection[]> {
  console.log('  Computing semantic similarities...');

  const connections: Connection[] = [];
  const documents: Map<string, string> = new Map();

  // Read all orphaned files
  for (const filePath of analysis.orphanedFiles) {
    const fullPath = join(rootPath, filePath);
    const content = await readFile(fullPath, 'utf-8');
    const { content: markdown } = matter(content);
    documents.set(filePath, markdown);
  }

  // Calculate TF-IDF vectors
  const tfidfVectors = calculateTFIDF(documents);

  // Compute pairwise similarities
  const fileList = Array.from(documents.keys());

  for (let i = 0; i < fileList.length; i++) {
    const sourceFile = fileList[i];
    const sourceVector = tfidfVectors.get(sourceFile)!;

    for (let j = i + 1; j < fileList.length; j++) {
      const targetFile = fileList[j];
      const targetVector = tfidfVectors.get(targetFile)!;

      const similarity = cosineSimilarity(sourceVector, targetVector);

      if (similarity >= (strategy.minSimilarity || 0.3)) {
        connections.push({
          source: sourceFile,
          target: targetFile,
          type: 'semantic',
          score: similarity,
          reason: `Semantic similarity: ${(similarity * 100).toFixed(1)}%`
        });

        // Bidirectional
        connections.push({
          source: targetFile,
          target: sourceFile,
          type: 'semantic',
          score: similarity,
          reason: `Semantic similarity: ${(similarity * 100).toFixed(1)}%`
        });
      }
    }
  }

  return connections;
}

/**
 * Build directory-based connections (files in same directory or parent)
 */
async function buildDirectoryConnections(
  analysis: StructureAnalysis,
  strategy: ConnectionStrategy
): Promise<Connection[]> {
  console.log('  Building directory-based connections...');

  const connections: Connection[] = [];
  const filesByDir: Map<string, string[]> = new Map();

  // Group files by directory
  for (const filePath of analysis.orphanedFiles) {
    const dir = dirname(filePath);
    if (!filesByDir.has(dir)) {
      filesByDir.set(dir, []);
    }
    filesByDir.get(dir)!.push(filePath);
  }

  // Connect files in same directory
  for (const [dir, files] of filesByDir.entries()) {
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        connections.push({
          source: files[i],
          target: files[j],
          type: 'hierarchical',
          score: 0.8,
          reason: 'Same directory'
        });

        connections.push({
          source: files[j],
          target: files[i],
          type: 'hierarchical',
          score: 0.8,
          reason: 'Same directory'
        });
      }
    }

    // Connect to parent hub
    const hubFile = join(dir, `${basename(dir).toUpperCase()}-HUB.md`);
    for (const file of files) {
      connections.push({
        source: file,
        target: basename(hubFile),
        type: 'hierarchical',
        score: 1.0,
        reason: 'Parent hub'
      });
    }
  }

  return connections;
}

/**
 * Build temporal connections (phase evolution)
 */
async function buildTemporalConnections(
  analysis: StructureAnalysis,
  strategy: ConnectionStrategy
): Promise<Connection[]> {
  console.log('  Building temporal connections...');

  const connections: Connection[] = [];
  const phaseFiles: Map<number, string[]> = new Map();

  // Group files by phase
  for (const filePath of analysis.orphanedFiles) {
    const phaseMatch = basename(filePath).match(/phase[-_]?(\d+)/i);
    if (phaseMatch) {
      const phase = parseInt(phaseMatch[1], 10);
      if (!phaseFiles.has(phase)) {
        phaseFiles.set(phase, []);
      }
      phaseFiles.get(phase)!.push(filePath);
    }
  }

  // Connect sequential phases
  const phases = Array.from(phaseFiles.keys()).sort((a, b) => a - b);

  for (let i = 0; i < phases.length - 1; i++) {
    const currentPhase = phases[i];
    const nextPhase = phases[i + 1];

    const currentFiles = phaseFiles.get(currentPhase)!;
    const nextFiles = phaseFiles.get(nextPhase)!;

    // Connect same document types across phases
    for (const currentFile of currentFiles) {
      for (const nextFile of nextFiles) {
        if (areRelatedPhaseDocuments(currentFile, nextFile)) {
          connections.push({
            source: currentFile,
            target: nextFile,
            type: 'temporal',
            score: 0.9,
            reason: `Evolution from Phase ${currentPhase} to Phase ${nextPhase}`
          });
        }
      }
    }
  }

  return connections;
}

/**
 * Build implementation connections (planning → code → tests)
 */
async function buildImplementationConnections(
  analysis: StructureAnalysis,
  rootPath: string,
  strategy: ConnectionStrategy
): Promise<Connection[]> {
  console.log('  Building implementation connections...');

  const connections: Connection[] = [];

  // Planning → Implementation
  const planningFiles = analysis.orphanedFiles.filter(f => f.includes('_planning'));
  const implementationFiles = analysis.orphanedFiles.filter(f =>
    f.includes('/src/') || f.includes('weaver/')
  );

  for (const planFile of planningFiles) {
    const feature = extractFeatureName(planFile);

    for (const implFile of implementationFiles) {
      if (implFile.toLowerCase().includes(feature.toLowerCase())) {
        connections.push({
          source: planFile,
          target: implFile,
          type: 'implementation',
          score: 0.85,
          reason: `Implementation of ${feature}`
        });
      }
    }
  }

  // Source → Test
  const sourceFiles = analysis.orphanedFiles.filter(f =>
    f.includes('/src/') && !f.includes('/tests/')
  );
  const testFiles = analysis.orphanedFiles.filter(f => f.includes('/tests/'));

  for (const sourceFile of sourceFiles) {
    const moduleName = basename(sourceFile, '.ts').replace(/\.(test|spec)$/, '');

    for (const testFile of testFiles) {
      if (testFile.includes(moduleName)) {
        connections.push({
          source: sourceFile,
          target: testFile,
          type: 'implementation',
          score: 1.0,
          reason: 'Test file for source'
        });

        connections.push({
          source: testFile,
          target: sourceFile,
          type: 'implementation',
          score: 1.0,
          reason: 'Source file for test'
        });
      }
    }
  }

  return connections;
}

/**
 * Build hybrid connections (combination of all strategies)
 */
async function buildHybridConnections(
  analysis: StructureAnalysis,
  rootPath: string,
  strategy: ConnectionStrategy
): Promise<Connection[]> {
  console.log('  Building hybrid connections...');

  const allConnections: Connection[] = [];

  // Collect connections from all strategies
  const semantic = await buildSemanticConnections(analysis, rootPath, strategy);
  const directory = await buildDirectoryConnections(analysis, strategy);
  const temporal = await buildTemporalConnections(analysis, strategy);
  const implementation = await buildImplementationConnections(analysis, rootPath, strategy);

  allConnections.push(...semantic, ...directory, ...temporal, ...implementation);

  return allConnections;
}

/**
 * Calculate TF-IDF vectors for documents
 */
function calculateTFIDF(documents: Map<string, string>): Map<string, Map<string, number>> {
  const tfidf = new Map<string, Map<string, number>>();
  const docCount = documents.size;
  const termDocCount = new Map<string, number>();

  // Calculate term frequencies and document frequencies
  for (const [file, content] of documents.entries()) {
    const terms = tokenize(content);
    const termFreq = new Map<string, number>();

    for (const term of terms) {
      termFreq.set(term, (termFreq.get(term) || 0) + 1);

      if (!termDocCount.has(term)) {
        termDocCount.set(term, 0);
      }
    }

    // Count unique terms per document
    for (const term of termFreq.keys()) {
      termDocCount.set(term, termDocCount.get(term)! + 1);
    }

    tfidf.set(file, termFreq);
  }

  // Calculate TF-IDF
  for (const [file, termFreq] of tfidf.entries()) {
    const tfidfVector = new Map<string, number>();

    for (const [term, tf] of termFreq.entries()) {
      const df = termDocCount.get(term)!;
      const idf = Math.log(docCount / df);
      tfidfVector.set(term, tf * idf);
    }

    tfidf.set(file, tfidfVector);
  }

  return tfidf;
}

/**
 * Calculate cosine similarity between two TF-IDF vectors
 */
function cosineSimilarity(
  vector1: Map<string, number>,
  vector2: Map<string, number>
): number {
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  // Get all unique terms
  const allTerms = new Set([...vector1.keys(), ...vector2.keys()]);

  for (const term of allTerms) {
    const val1 = vector1.get(term) || 0;
    const val2 = vector2.get(term) || 0;

    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  }

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

/**
 * Tokenize content into terms
 */
function tokenize(content: string): string[] {
  return content
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 3)
    .filter(term => !isStopWord(term));
}

/**
 * Check if term is a stop word
 */
function isStopWord(term: string): boolean {
  const stopWords = new Set([
    'the',
    'and',
    'for',
    'this',
    'that',
    'with',
    'from',
    'have',
    'will',
    'been',
    'your',
    'their',
    'what',
    'when',
    'where',
    'which',
    'while'
  ]);

  return stopWords.has(term);
}

/**
 * Rank connections by score and apply max connection limit
 */
function rankConnections(
  connections: Connection[],
  strategy: ConnectionStrategy
): Connection[] {
  // Sort by score descending
  connections.sort((a, b) => b.score - a.score);

  // Apply max connections per file
  if (strategy.maxConnections) {
    const connectionsPerFile = new Map<string, number>();
    const filtered: Connection[] = [];

    for (const conn of connections) {
      const count = connectionsPerFile.get(conn.source) || 0;

      if (count < strategy.maxConnections) {
        filtered.push(conn);
        connectionsPerFile.set(conn.source, count + 1);
      }
    }

    return filtered;
  }

  return connections;
}

/**
 * Insert connections into markdown files
 */
async function insertConnections(
  connections: Connection[],
  rootPath: string
): Promise<number> {
  const fileConnections = new Map<string, Connection[]>();

  // Group connections by source file
  for (const conn of connections) {
    if (!fileConnections.has(conn.source)) {
      fileConnections.set(conn.source, []);
    }
    fileConnections.get(conn.source)!.push(conn);
  }

  let filesModified = 0;

  for (const [filePath, conns] of fileConnections.entries()) {
    try {
      const fullPath = join(rootPath, filePath);
      const content = await readFile(fullPath, 'utf-8');
      const { data, content: markdown } = matter(content);

      // Add connections as "Related" section
      const relatedSection = generateRelatedSection(conns);
      const updatedMarkdown = `${markdown.trimEnd()}\n\n${relatedSection}\n`;

      await writeFile(fullPath, matter.stringify(updatedMarkdown, data), 'utf-8');
      filesModified++;
    } catch (error) {
      console.error(`Error inserting connections in ${filePath}:`, error);
    }
  }

  return filesModified;
}

/**
 * Generate "Related Documents" section
 */
function generateRelatedSection(connections: Connection[]): string {
  const lines: string[] = [];

  lines.push('## Related Documents');
  lines.push('');

  // Group by type
  const byType = new Map<string, Connection[]>();
  for (const conn of connections) {
    if (!byType.has(conn.type)) {
      byType.set(conn.type, []);
    }
    byType.get(conn.type)!.push(conn);
  }

  for (const [type, conns] of byType.entries()) {
    const typeLabel =
      type === 'semantic'
        ? 'Similar Content'
        : type === 'hierarchical'
          ? 'Related Files'
          : type === 'temporal'
            ? 'Evolution'
            : 'Implementation';

    lines.push(`### ${typeLabel}`);
    for (const conn of conns.slice(0, 5)) {
      lines.push(`- [[${basename(conn.target)}]] - ${conn.reason}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Extract feature name from filename
 */
function extractFeatureName(filePath: string): string {
  const filename = basename(filePath, '.md');
  return filename
    .replace(/phase-\d+-/i, '')
    .replace(/-/g, ' ')
    .trim();
}

/**
 * Check if two phase documents are related
 */
function areRelatedPhaseDocuments(file1: string, file2: string): boolean {
  const type1 = basename(file1).replace(/phase-\d+-/i, '');
  const type2 = basename(file2).replace(/phase-\d+-/i, '');

  return type1.toLowerCase() === type2.toLowerCase();
}

/**
 * Calculate type distribution
 */
function calculateTypeDistribution(connections: Connection[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const conn of connections) {
    distribution[conn.type] = (distribution[conn.type] || 0) + 1;
  }

  return distribution;
}
