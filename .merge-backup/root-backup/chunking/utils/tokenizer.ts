/**
 * Tokenizer Utility
 *
 * Provides token counting functionality for text.
 * Uses simple approximation (1 token ≈ 4 characters) for MVP.
 * Can be replaced with actual tokenizer (tiktoken) in Phase 2.
 */

import { createLogger } from '../../utils/logger.js';

const logger = createLogger('chunking:tokenizer');

/**
 * Approximate token count
 * Simple heuristic: 1 token ≈ 4 characters
 *
 * @param text - Text to count tokens for
 * @returns Approximate token count
 */
export function countTokens(text: string): number {
  if (!text || text.length === 0) {
    return 0;
  }

  // Simple approximation: 1 token ≈ 4 characters
  const tokenCount = Math.ceil(text.length / 4);

  logger.debug('Counted tokens', {
    characters: text.length,
    tokens: tokenCount,
  });

  return tokenCount;
}

/**
 * Count tokens in array of strings
 *
 * @param texts - Array of text strings
 * @returns Total token count
 */
export function countTokensInArray(texts: string[]): number {
  return texts.reduce((total, text) => total + countTokens(text), 0);
}

/**
 * Split text to fit within token limit
 *
 * @param text - Text to split
 * @param maxTokens - Maximum tokens per chunk
 * @returns Array of text chunks
 */
export function splitByTokens(text: string, maxTokens: number): string[] {
  const chunks: string[] = [];
  const maxChars = maxTokens * 4; // Approximate character limit

  if (text.length <= maxChars) {
    return [text];
  }

  // Split by sentences first
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

  let currentChunk = '';
  for (const sentence of sentences) {
    const testChunk = currentChunk ? `${currentChunk}. ${sentence}` : sentence;

    if (testChunk.length <= maxChars) {
      currentChunk = testChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Truncate text to token limit
 *
 * @param text - Text to truncate
 * @param maxTokens - Maximum tokens
 * @returns Truncated text
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;

  if (text.length <= maxChars) {
    return text;
  }

  return text.substring(0, maxChars) + '...';
}
