/**
 * Knowledge Graph Structure Analyzer Workflow
 *
 * Analyzes the markdown file structure to identify:
 * - Directory hierarchy
 * - Orphaned files (no incoming/outgoing links)
 * - Missing metadata
 * - Broken links
 * - Statistics and metrics
 *
 * @workflow
 */
'use workflow';

import { readdir, readFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import matter from 'gray-matter';

export interface DirectoryNode {
  path: string;
  name: string;
  type: 'directory' | 'file';
  children?: DirectoryNode[];
  metadata?: Record<string, any>;
  links?: string[];
  backlinks?: string[];
  isOrphaned?: boolean;
}

export interface LinkError {
  sourceFile: string;
  targetFile: string;
  linkText: string;
  reason: string;
}

export interface Statistics {
  totalFiles: number;
  totalDirectories: number;
  totalMarkdownFiles: number;
  orphanedFiles: number;
  orphanPercentage: number;
  filesWithMetadata: number;
  metadataPercentage: number;
  totalLinks: number;
  brokenLinks: number;
  avgLinksPerFile: number;
}

export interface StructureAnalysis {
  timestamp: string;
  rootPath: string;
  directories: DirectoryNode[];
  orphanedFiles: string[];
  missingMetadata: string[];
  brokenLinks: LinkError[];
  statistics: Statistics;
}

// Wikilink pattern: [[link]] or [[link|alias]]
const WIKILINK_PATTERN = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/**
 * Main workflow function
 */
export async function analyzeStructure(
  rootPath: string = '/home/aepod/dev/weave-nn'
): Promise<StructureAnalysis> {
  console.log(`📊 Analyzing knowledge graph structure at: ${rootPath}`);

  const directories: DirectoryNode[] = [];
  const allFiles: Map<string, DirectoryNode> = new Map();
  const linkMap: Map<string, Set<string>> = new Map(); // file -> links
  const backlinkMap: Map<string, Set<string>> = new Map(); // file -> backlinks

  // Phase 1: Scan directory structure
  console.log('Phase 1: Scanning directory structure...');
  await scanDirectory(rootPath, rootPath, directories, allFiles);

  // Phase 2: Extract links from all markdown files
  console.log('Phase 2: Extracting wikilinks...');
  await extractLinks(allFiles, linkMap, backlinkMap, rootPath);

  // Phase 3: Identify orphaned files
  console.log('Phase 3: Identifying orphaned files...');
  const orphanedFiles = identifyOrphans(allFiles, linkMap, backlinkMap);

  // Phase 4: Check for broken links
  console.log('Phase 4: Checking for broken links...');
  const brokenLinks = checkBrokenLinks(linkMap, allFiles, rootPath);

  // Phase 5: Find files without metadata
  console.log('Phase 5: Checking metadata coverage...');
  const missingMetadata = findMissingMetadata(allFiles);

  // Phase 6: Calculate statistics
  console.log('Phase 6: Calculating statistics...');
  const statistics = calculateStatistics(allFiles, linkMap, orphanedFiles, missingMetadata, brokenLinks);

  const analysis: StructureAnalysis = {
    timestamp: new Date().toISOString(),
    rootPath,
    directories,
    orphanedFiles,
    missingMetadata,
    brokenLinks,
    statistics
  };

  console.log('✅ Analysis complete!');
  console.log(`   Total files: ${statistics.totalMarkdownFiles}`);
  console.log(`   Orphaned: ${statistics.orphanedFiles} (${statistics.orphanPercentage}%)`);
  console.log(`   Missing metadata: ${missingMetadata.length}`);
  console.log(`   Broken links: ${brokenLinks.length}`);

  return analysis;
}

/**
 * Recursively scan directory structure
 */
async function scanDirectory(
  dirPath: string,
  rootPath: string,
  directories: DirectoryNode[],
  allFiles: Map<string, DirectoryNode>
): Promise<void> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = relative(rootPath, fullPath);

      // Skip node_modules, .git, dist, etc.
      if (shouldSkip(entry.name)) continue;

      if (entry.isDirectory()) {
        const node: DirectoryNode = {
          path: relativePath,
          name: entry.name,
          type: 'directory',
          children: []
        };
        directories.push(node);

        // Recurse into subdirectory
        await scanDirectory(fullPath, rootPath, node.children!, allFiles);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        // Read markdown file and extract metadata
        const content = await readFile(fullPath, 'utf-8');
        const { data: frontmatter } = matter(content);

        const node: DirectoryNode = {
          path: relativePath,
          name: entry.name,
          type: 'file',
          metadata: frontmatter,
          links: [],
          backlinks: []
        };

        allFiles.set(relativePath, node);
        directories.push(node);
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error);
  }
}

/**
 * Extract wikilinks from all markdown files
 */
async function extractLinks(
  allFiles: Map<string, DirectoryNode>,
  linkMap: Map<string, Set<string>>,
  backlinkMap: Map<string, Set<string>>,
  rootPath: string
): Promise<void> {
  for (const [filePath, node] of allFiles.entries()) {
    const fullPath = join(rootPath, filePath);
    const content = await readFile(fullPath, 'utf-8');
    const { content: markdownContent } = matter(content);

    const links = new Set<string>();
    let match;

    // Extract all wikilinks
    while ((match = WIKILINK_PATTERN.exec(markdownContent)) !== null) {
      const target = match[1].trim();
      links.add(target);

      // Update backlinks
      if (!backlinkMap.has(target)) {
        backlinkMap.set(target, new Set());
      }
      backlinkMap.get(target)!.add(filePath);
    }

    linkMap.set(filePath, links);
    node.links = Array.from(links);
  }

  // Update backlinks in nodes
  for (const [filePath, node] of allFiles.entries()) {
    const fileName = filePath.split('/').pop()!;
    const backlinks = backlinkMap.get(fileName) || new Set();
    node.backlinks = Array.from(backlinks);
  }
}

/**
 * Identify orphaned files (no incoming or outgoing links)
 */
function identifyOrphans(
  allFiles: Map<string, DirectoryNode>,
  linkMap: Map<string, Set<string>>,
  backlinkMap: Map<string, Set<string>>
): string[] {
  const orphaned: string[] = [];

  for (const [filePath, node] of allFiles.entries()) {
    const fileName = filePath.split('/').pop()!;
    const outgoingLinks = linkMap.get(filePath) || new Set();
    const incomingLinks = backlinkMap.get(fileName) || new Set();

    if (outgoingLinks.size === 0 && incomingLinks.size === 0) {
      orphaned.push(filePath);
      node.isOrphaned = true;
    }
  }

  return orphaned;
}

/**
 * Check for broken links
 */
function checkBrokenLinks(
  linkMap: Map<string, Set<string>>,
  allFiles: Map<string, DirectoryNode>,
  rootPath: string
): LinkError[] {
  const brokenLinks: LinkError[] = [];
  const allFileNames = new Set(
    Array.from(allFiles.keys()).map(path => path.split('/').pop()!)
  );

  for (const [sourceFile, links] of linkMap.entries()) {
    for (const linkTarget of links) {
      // Extract filename from link (handle .md extension or not)
      const targetFileName = linkTarget.endsWith('.md') ? linkTarget : `${linkTarget}.md`;

      if (!allFileNames.has(targetFileName)) {
        brokenLinks.push({
          sourceFile,
          targetFile: linkTarget,
          linkText: `[[${linkTarget}]]`,
          reason: 'Target file not found'
        });
      }
    }
  }

  return brokenLinks;
}

/**
 * Find files without frontmatter metadata
 */
function findMissingMetadata(allFiles: Map<string, DirectoryNode>): string[] {
  const missing: string[] = [];

  for (const [filePath, node] of allFiles.entries()) {
    if (!node.metadata || Object.keys(node.metadata).length === 0) {
      missing.push(filePath);
    }
  }

  return missing;
}

/**
 * Calculate overall statistics
 */
function calculateStatistics(
  allFiles: Map<string, DirectoryNode>,
  linkMap: Map<string, Set<string>>,
  orphanedFiles: string[],
  missingMetadata: string[],
  brokenLinks: LinkError[]
): Statistics {
  const totalMarkdownFiles = allFiles.size;
  const totalLinks = Array.from(linkMap.values()).reduce(
    (sum, links) => sum + links.size,
    0
  );

  return {
    totalFiles: totalMarkdownFiles,
    totalDirectories: 0, // Could be calculated if needed
    totalMarkdownFiles,
    orphanedFiles: orphanedFiles.length,
    orphanPercentage: Math.round((orphanedFiles.length / totalMarkdownFiles) * 100),
    filesWithMetadata: totalMarkdownFiles - missingMetadata.length,
    metadataPercentage: Math.round(
      ((totalMarkdownFiles - missingMetadata.length) / totalMarkdownFiles) * 100
    ),
    totalLinks,
    brokenLinks: brokenLinks.length,
    avgLinksPerFile: totalMarkdownFiles > 0 ? totalLinks / totalMarkdownFiles : 0
  };
}

/**
 * Determine if a directory/file should be skipped
 */
function shouldSkip(name: string): boolean {
  const skipPatterns = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    '.cache',
    '.turbo',
    'coverage',
    '.nyc_output',
    'build',
    'out',
    '.DS_Store'
  ];

  return skipPatterns.some(pattern => name.startsWith(pattern) || name === pattern);
}

/**
 * Export results to JSON for analysis
 */
export async function exportAnalysis(
  analysis: StructureAnalysis,
  outputPath: string
): Promise<void> {
  const { writeFile } = await import('fs/promises');
  await writeFile(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`📁 Analysis exported to: ${outputPath}`);
}
