/**
 * Boundary Detection Utilities
 *
 * Detects semantic and structural boundaries in text.
 */

/**
 * Boundary detection result
 */
export interface Boundary {
  position: number;
  type: string;
  confidence?: number;
}

/**
 * Detect markdown heading boundaries
 *
 * @param document - Document text
 * @returns Array of heading boundaries
 */
export function detectHeadingBoundaries(document: string): Boundary[] {
  const boundaries: Boundary[] = [];
  const lines = document.split('\n');

  let position = 0;

  for (const line of lines) {
    // Match markdown headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      boundaries.push({
        position,
        type: `heading-${headingMatch[1].length}`,
        confidence: 1.0,
      });
    }

    position += line.length + 1; // +1 for newline
  }

  return boundaries;
}

/**
 * Detect paragraph boundaries
 *
 * @param document - Document text
 * @returns Array of paragraph boundaries
 */
export function detectParagraphBoundaries(document: string): Boundary[] {
  const boundaries: Boundary[] = [];
  const lines = document.split('\n');

  let position = 0;
  let inParagraph = false;

  for (const line of lines) {
    const isEmpty = line.trim().length === 0;

    if (!isEmpty && !inParagraph) {
      // Start of new paragraph
      boundaries.push({
        position,
        type: 'paragraph-start',
        confidence: 0.8,
      });
      inParagraph = true;
    } else if (isEmpty && inParagraph) {
      // End of paragraph
      boundaries.push({
        position,
        type: 'paragraph-end',
        confidence: 0.8,
      });
      inParagraph = false;
    }

    position += line.length + 1;
  }

  return boundaries;
}

/**
 * Detect code block boundaries
 *
 * @param document - Document text
 * @returns Array of code block boundaries
 */
export function detectCodeBlockBoundaries(document: string): Boundary[] {
  const boundaries: Boundary[] = [];
  const codeBlockPattern = /```[\w]*\n/g;

  let match;
  while ((match = codeBlockPattern.exec(document)) !== null) {
    boundaries.push({
      position: match.index,
      type: 'code-block',
      confidence: 1.0,
    });
  }

  return boundaries;
}

/**
 * Detect list boundaries
 *
 * @param document - Document text
 * @returns Array of list boundaries
 */
export function detectListBoundaries(document: string): Boundary[] {
  const boundaries: Boundary[] = [];
  const lines = document.split('\n');

  let position = 0;
  let inList = false;

  for (const line of lines) {
    const isListItem = /^[\s-]*[\*\-\d]+[\.\)]\s+/.test(line);

    if (isListItem && !inList) {
      boundaries.push({
        position,
        type: 'list-start',
        confidence: 0.9,
      });
      inList = true;
    } else if (!isListItem && inList && line.trim().length === 0) {
      boundaries.push({
        position,
        type: 'list-end',
        confidence: 0.9,
      });
      inList = false;
    }

    position += line.length + 1;
  }

  return boundaries;
}

/**
 * Detect all structural boundaries
 *
 * @param document - Document text
 * @returns Combined array of all boundaries, sorted by position
 */
export function detectAllBoundaries(document: string): Boundary[] {
  const headings = detectHeadingBoundaries(document);
  const paragraphs = detectParagraphBoundaries(document);
  const codeBlocks = detectCodeBlockBoundaries(document);
  const lists = detectListBoundaries(document);

  const allBoundaries = [...headings, ...paragraphs, ...codeBlocks, ...lists];

  // Sort by position
  allBoundaries.sort((a, b) => a.position - b.position);

  return allBoundaries;
}
