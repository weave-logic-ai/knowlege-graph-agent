/**
 * Frontmatter Utilities - Parse and update YAML frontmatter in markdown files
 */

import yaml from 'js-yaml';

export interface FrontmatterData {
  [key: string]: unknown;
}

export interface ParsedNote {
  frontmatter: FrontmatterData | null;
  body: string;
  raw: string;
}

/**
 * Parse frontmatter from markdown content
 */
export function parseFrontmatter(content: string): ParsedNote {
  const trimmed = content.trim();

  // Check if content starts with frontmatter delimiter
  if (!trimmed.startsWith('---')) {
    return {
      frontmatter: null,
      body: content,
      raw: content
    };
  }

  // Find the closing delimiter
  const endIndex = trimmed.indexOf('\n---', 3);

  if (endIndex === -1) {
    return {
      frontmatter: null,
      body: content,
      raw: content
    };
  }

  try {
    // Extract frontmatter YAML
    const frontmatterText = trimmed.substring(3, endIndex).trim();
    const frontmatter = yaml.load(frontmatterText) as FrontmatterData;

    // Extract body (everything after closing ---)
    const body = trimmed.substring(endIndex + 4).trim();

    return {
      frontmatter,
      body,
      raw: content
    };
  } catch {
    // If YAML parsing fails, treat as no frontmatter
    return {
      frontmatter: null,
      body: content,
      raw: content
    };
  }
}

/**
 * Update frontmatter in markdown content
 */
export function updateFrontmatter(content: string, newFrontmatter: FrontmatterData): string {
  const { body } = parseFrontmatter(content);

  // Serialize frontmatter to YAML
  const frontmatterYaml = yaml.dump(newFrontmatter).trim();

  // Reconstruct content with updated frontmatter
  return `---
${frontmatterYaml}
---

${body}`;
}

/**
 * Add or update a single frontmatter field
 */
export function updateFrontmatterField(
  content: string,
  key: string,
  value: unknown
): string {
  const { frontmatter } = parseFrontmatter(content);

  const updatedFrontmatter = {
    ...frontmatter,
    [key]: value
  };

  return updateFrontmatter(content, updatedFrontmatter);
}

/**
 * Check if content has frontmatter
 */
export function hasFrontmatter(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('---') && trimmed.indexOf('\n---', 3) !== -1;
}

/**
 * Remove frontmatter from content
 */
export function removeFrontmatter(content: string): string {
  const { body } = parseFrontmatter(content);
  return body;
}

/**
 * Get a specific frontmatter field value
 */
export function getFrontmatterField<T = unknown>(content: string, key: string): T | undefined {
  const { frontmatter } = parseFrontmatter(content);
  return frontmatter?.[key] as T | undefined;
}
