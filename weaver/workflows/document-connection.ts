/**
 * Document Connection Workflow - Self-Contained Next.js Version
 *
 * Automatically connects documents based on context similarity.
 * All logic is inlined to work with Workflow DevKit bundling.
 */

import path from 'path';
import fs from 'fs/promises';
import matter from 'gray-matter';

/**
 * Workflow input parameters
 */
export interface DocumentConnectionInput {
  filePath: string;
  vaultRoot: string;
  eventType: 'add' | 'change';
  dryRun?: boolean;
}

/**
 * Workflow result with detailed execution log
 */
export interface DocumentConnectionResult {
  success: boolean;
  connections: number;
  filesModified: string[];
  duration: number;
  error?: string;
  log: string[];
}

/**
 * Document context for similarity matching
 */
interface DocumentContext {
  filePath: string;
  relativePath: string;
  title: string;
  tags: string[];
  headings: string[];
  links: string[];
  directory: string;
  content: string;
}

/**
 * Connection candidate with score
 */
interface Candidate {
  filePath: string;
  relativePath: string;
  score: number;
  reason: string;
}

/**
 * Main workflow function
 */
export async function documentConnectionWorkflow(
  input: DocumentConnectionInput
): Promise<DocumentConnectionResult> {
  'use workflow';

  const startTime = Date.now();
  const log: string[] = [];

  try {
    log.push(`Starting document connection for: ${input.filePath}`);
    log.push(`Vault root: ${input.vaultRoot}`);
    log.push(`Event type: ${input.eventType}`);
    log.push(`Dry run: ${input.dryRun ? 'yes' : 'no'}`);

    // Step 1: Build context for target document
    const { documentContext, relativePath } = await buildDocumentContext(input);
    log.push(`Built context for: ${relativePath}`);
    log.push(`  Title: ${documentContext.title || 'none'}`);
    log.push(`  Tags: ${documentContext.tags.length}`);
    log.push(`  Headings: ${documentContext.headings.length}`);
    log.push(`  Links: ${documentContext.links.length}`);

    // Step 2: Find connection candidates
    const { candidates, totalFiles } = await findConnectionCandidates(
      input,
      documentContext
    );
    log.push(`Analyzed ${totalFiles} files`);
    log.push(`Found ${candidates.length} potential connections`);

    if (candidates.length > 0) {
      log.push('Top candidates:');
      candidates.forEach(c => {
        log.push(`  ${c.relativePath} (${c.score}%)`);
      });
    }

    // Step 3: Update document with connections
    const filesModified = await updateDocumentConnections(
      input,
      candidates,
      log
    );

    if (filesModified.length > 0) {
      log.push(`Updated ${filesModified.length} files`);
    } else {
      log.push('No files modified');
    }

    const duration = Date.now() - startTime;
    log.push(`Completed in ${duration}ms`);

    return {
      success: true,
      connections: candidates.length,
      filesModified,
      duration,
      log,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    console.error('[Workflow Error]', errorMsg);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }

    log.push(`ERROR: ${errorMsg}`);

    return {
      success: false,
      connections: 0,
      filesModified: [],
      duration,
      error: errorMsg,
      log,
    };
  }
}

/**
 * Step 1: Build document context
 */
async function buildDocumentContext(input: DocumentConnectionInput) {
  'use step';

  console.log('[Step 1] Building document context');

  const relativePath = path.relative(input.vaultRoot, input.filePath);

  try {
    const content = await fs.readFile(input.filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    // Extract context from document
    const documentContext: DocumentContext = {
      filePath: input.filePath,
      relativePath,
      title: frontmatter.title || extractTitleFromContent(body),
      tags: extractTags(frontmatter, body),
      headings: extractHeadings(body),
      links: extractLinks(body),
      directory: path.dirname(relativePath),
      content: body,
    };

    return { documentContext, relativePath };
  } catch (error) {
    console.error('[Step 1 Error]', error);
    throw new Error(`Failed to build context: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Step 2: Find connection candidates
 */
async function findConnectionCandidates(
  input: DocumentConnectionInput,
  documentContext: DocumentContext
) {
  'use step';

  console.log('[Step 2] Finding connection candidates');

  try {
    // Find all markdown files in vault
    const markdownFiles = await findMarkdownFiles(input.vaultRoot);
    const otherFiles = markdownFiles.filter((f) => f !== input.filePath);

    console.log(`[Step 2] Found ${otherFiles.length} other markdown files`);

    // Analyze candidates (limit to 50 for performance)
    const analysisLimit = Math.min(50, otherFiles.length);
    const candidates: Candidate[] = [];

    for (let i = 0; i < analysisLimit; i++) {
      const filePath = otherFiles[i];

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { data: frontmatter, content: body } = matter(content);
        const relativePath = path.relative(input.vaultRoot, filePath);

        // Build candidate context
        const candidateContext: DocumentContext = {
          filePath,
          relativePath,
          title: frontmatter.title || extractTitleFromContent(body),
          tags: extractTags(frontmatter, body),
          headings: extractHeadings(body),
          links: extractLinks(body),
          directory: path.dirname(relativePath),
          content: body,
        };

        // Calculate similarity
        const similarity = calculateContextSimilarity(
          documentContext,
          candidateContext
        );
        const score = Math.round(similarity * 100);

        // Only include candidates with >30% similarity
        if (score > 30) {
          candidates.push({
            filePath,
            relativePath,
            score,
            reason: `${score}% context similarity`,
          });
        }
      } catch (error) {
        // Skip files that can't be read
        console.error(`[Step 2] Error analyzing ${filePath}:`, error);
      }
    }

    // Sort by score and take top 5
    const topCandidates = candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      candidates: topCandidates,
      totalFiles: analysisLimit,
    };
  } catch (error) {
    console.error('[Step 2 Error]', error);
    throw new Error(`Failed to find candidates: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Step 3: Update document with connections
 */
async function updateDocumentConnections(
  input: DocumentConnectionInput,
  candidates: Candidate[],
  log: string[]
) {
  'use step';

  console.log('[Step 3] Updating document connections');

  if (input.dryRun) {
    log.push('[DRY RUN] No changes will be made');
    return [];
  }

  if (candidates.length === 0) {
    log.push('No connections to add');
    return [];
  }

  try {
    const content = await fs.readFile(input.filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);

    // Get existing connections
    const existingConnections = Array.isArray(frontmatter.related_to)
      ? frontmatter.related_to
      : [];

    // Add new connections
    const newConnections = candidates
      .map((c) => c.relativePath)
      .filter((path) => !existingConnections.includes(path));

    if (newConnections.length === 0) {
      log.push('All connections already exist');
      return [];
    }

    // Update frontmatter
    frontmatter.related_to = [...existingConnections, ...newConnections];
    frontmatter.last_connected = new Date().toISOString();

    // Write updated file
    const updatedContent = matter.stringify(body, frontmatter);
    await fs.writeFile(input.filePath, updatedContent, 'utf-8');

    log.push(`Added ${newConnections.length} new connections`);
    newConnections.forEach(conn => {
      log.push(`  + ${conn}`);
    });

    return [input.filePath];
  } catch (error) {
    console.error('[Step 3 Error]', error);
    throw new Error(`Failed to update connections: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper: Find all markdown files recursively
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentDir: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        // Skip hidden directories and node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
      console.error(`Error scanning ${currentDir}:`, error);
    }
  }

  await scan(dir);
  return files;
}

/**
 * Helper: Extract title from content
 */
function extractTitleFromContent(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }
  return '';
}

/**
 * Helper: Extract tags from frontmatter and content
 */
function extractTags(frontmatter: any, content: string): string[] {
  const tags = new Set<string>();

  // From frontmatter
  if (Array.isArray(frontmatter.tags)) {
    frontmatter.tags.forEach((tag: string) => tags.add(tag.toLowerCase()));
  }

  // From content (#tag format)
  const tagMatches = content.match(/#[\w-]+/g) || [];
  tagMatches.forEach((tag) => tags.add(tag.substring(1).toLowerCase()));

  return Array.from(tags);
}

/**
 * Helper: Extract headings from content
 */
function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const heading = trimmed.replace(/^#+\s*/, '').trim();
      if (heading) {
        headings.push(heading);
      }
    }
  }

  return headings;
}

/**
 * Helper: Extract wikilinks from content
 */
function extractLinks(content: string): string[] {
  const links = new Set<string>();

  // Wikilinks [[link]]
  const wikiMatches = content.match(/\[\[([^\]]+)\]\]/g) || [];
  wikiMatches.forEach((match) => {
    const link = match.replace(/\[\[|\]\]/g, '').split('|')[0].trim();
    links.add(link);
  });

  // Markdown links [text](link.md)
  const mdMatches = content.match(/\[([^\]]+)\]\(([^)]+\.md)\)/g) || [];
  mdMatches.forEach((match) => {
    const linkMatch = match.match(/\(([^)]+\.md)\)/);
    if (linkMatch) {
      links.add(linkMatch[1]);
    }
  });

  return Array.from(links);
}

/**
 * Helper: Calculate similarity between two document contexts
 */
function calculateContextSimilarity(
  doc1: DocumentContext,
  doc2: DocumentContext
): number {
  let totalWeight = 0;
  let totalScore = 0;

  // Tag similarity (weight: 0.3)
  const tagSimilarity = calculateSetSimilarity(doc1.tags, doc2.tags);
  totalScore += tagSimilarity * 0.3;
  totalWeight += 0.3;

  // Heading similarity (weight: 0.2)
  const headingSimilarity = calculateTextSimilarity(
    doc1.headings.join(' '),
    doc2.headings.join(' ')
  );
  totalScore += headingSimilarity * 0.2;
  totalWeight += 0.2;

  // Link similarity (weight: 0.2)
  const linkSimilarity = calculateSetSimilarity(doc1.links, doc2.links);
  totalScore += linkSimilarity * 0.2;
  totalWeight += 0.2;

  // Directory similarity (weight: 0.15)
  const dirSimilarity = doc1.directory === doc2.directory ? 1.0 : 0.0;
  totalScore += dirSimilarity * 0.15;
  totalWeight += 0.15;

  // Title similarity (weight: 0.15)
  const titleSimilarity = calculateTextSimilarity(doc1.title, doc2.title);
  totalScore += titleSimilarity * 0.15;
  totalWeight += 0.15;

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Helper: Calculate similarity between two sets
 */
function calculateSetSimilarity(set1: string[], set2: string[]): number {
  if (set1.length === 0 && set2.length === 0) return 0;
  if (set1.length === 0 || set2.length === 0) return 0;

  const s1 = new Set(set1.map((s) => s.toLowerCase()));
  const s2 = new Set(set2.map((s) => s.toLowerCase()));

  const intersection = new Set([...s1].filter((x) => s2.has(x)));
  const union = new Set([...s1, ...s2]);

  return intersection.size / union.size;
}

/**
 * Helper: Calculate text similarity using simple word overlap
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const words1 = new Set(
    text1
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
  const words2 = new Set(
    text2
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );

  if (words1.size === 0 && words2.size === 0) return 0;
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}
