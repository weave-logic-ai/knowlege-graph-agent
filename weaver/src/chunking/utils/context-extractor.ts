/**
 * Context Extraction Utilities
 *
 * Extracts surrounding context for chunk enrichment.
 */

import { countTokens } from './tokenizer.js';

/**
 * Extract context before a position
 *
 * @param text - Full text
 * @param position - Position to extract context before
 * @param windowSize - Number of tokens to extract
 * @returns Context text
 */
export function extractContextBefore(
  text: string,
  position: number,
  windowSize: number
): string {
  const before = text.slice(0, position);
  const sentences = before.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let context = '';
  let tokens = 0;

  // Work backwards from position
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i].trim();
    const sentenceTokens = countTokens(sentence);

    if (tokens + sentenceTokens > windowSize) {
      break;
    }

    context = sentence + '. ' + context;
    tokens += sentenceTokens;
  }

  return context.trim();
}

/**
 * Extract context after a position
 *
 * @param text - Full text
 * @param position - Position to extract context after
 * @param windowSize - Number of tokens to extract
 * @returns Context text
 */
export function extractContextAfter(
  text: string,
  position: number,
  windowSize: number
): string {
  const after = text.slice(position);
  const sentences = after.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let context = '';
  let tokens = 0;

  // Work forwards from position
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    const sentenceTokens = countTokens(trimmed);

    if (tokens + sentenceTokens > windowSize) {
      break;
    }

    context += trimmed + '. ';
    tokens += sentenceTokens;
  }

  return context.trim();
}

/**
 * Extract context around a position
 *
 * @param text - Full text
 * @param position - Center position
 * @param windowSize - Total number of tokens (split before/after)
 * @returns Object with before and after context
 */
export function extractContextAround(
  text: string,
  position: number,
  windowSize: number
): { before: string; after: string } {
  const halfWindow = Math.floor(windowSize / 2);

  return {
    before: extractContextBefore(text, position, halfWindow),
    after: extractContextAfter(text, position, halfWindow),
  };
}

/**
 * Generate summary of chunk content
 *
 * @param content - Chunk content
 * @param maxTokens - Maximum tokens for summary
 * @returns Summary text
 */
export function generateSummary(content: string, maxTokens: number = 50): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (sentences.length === 0) {
    return '';
  }

  // Use first sentence as summary
  let summary = sentences[0].trim();
  let tokens = countTokens(summary);

  // Add more sentences if under limit
  for (let i = 1; i < sentences.length && tokens < maxTokens; i++) {
    const sentence = sentences[i].trim();
    const sentenceTokens = countTokens(sentence);

    if (tokens + sentenceTokens <= maxTokens) {
      summary += '. ' + sentence;
      tokens += sentenceTokens;
    } else {
      break;
    }
  }

  return summary;
}
