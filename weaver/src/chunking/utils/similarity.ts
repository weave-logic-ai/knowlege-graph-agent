/**
 * Similarity Computation Utilities
 *
 * Provides simple similarity metrics for boundary detection.
 */

/**
 * Compute Jaccard similarity between two sets of words
 *
 * @param text1 - First text
 * @param text2 - Second text
 * @returns Similarity score (0-1)
 */
export function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Compute cosine similarity between two text vectors (word frequency)
 *
 * @param text1 - First text
 * @param text2 - Second text
 * @returns Similarity score (0-1)
 */
export function cosineSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  // Build word frequency vectors
  const vocab = new Set([...words1, ...words2]);
  const vector1: number[] = [];
  const vector2: number[] = [];

  for (const word of vocab) {
    vector1.push(words1.filter(w => w === word).length);
    vector2.push(words2.filter(w => w === word).length);
  }

  // Compute dot product
  let dotProduct = 0;
  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
  }

  // Compute magnitudes
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Detect semantic boundary using similarity threshold
 *
 * @param prevText - Previous text segment
 * @param currText - Current text segment
 * @param threshold - Similarity threshold (0-1)
 * @returns True if boundary detected (low similarity)
 */
export function detectSemanticBoundary(
  prevText: string,
  currText: string,
  threshold: number = 0.75
): boolean {
  const similarity = jaccardSimilarity(prevText, currText);
  return similarity < threshold;
}
