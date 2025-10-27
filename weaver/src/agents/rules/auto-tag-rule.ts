/**
 * Auto-Tagging Rule - Automatically suggest tags for notes
 *
 * Triggers: Note created without tags
 * Condition: Frontmatter missing 'tags' field
 * Action: Send content to Claude, get tag suggestions, update frontmatter
 *
 * @category Agent Rules
 */

import type { ClaudeClient } from '../claude-client.js';
import { PromptBuilder } from '../prompt-builder.js';
import { TAG_SUGGESTION_PROMPT } from '../templates/tag-suggestion.js';
import { parseFrontmatter, updateFrontmatter } from '../utils/frontmatter.js';

export interface AutoTagRuleConfig {
  /**
   * Claude client instance for API calls
   */
  claudeClient: ClaudeClient;

  /**
   * Minimum content length to trigger tagging (default: 50 characters)
   */
  minContentLength?: number;

  /**
   * Maximum number of tags to suggest (default: 5)
   */
  maxTags?: number;

  /**
   * Confidence threshold for tag suggestions (0-1, default: 0.7)
   */
  confidenceThreshold?: number;
}

export interface TagSuggestion {
  tag: string;
  confidence: number;
  reason?: string;
}

export interface AutoTagResult {
  success: boolean;
  suggestedTags?: string[];
  updatedContent?: string;
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

/**
 * Auto-Tagging Rule Implementation
 */
export class AutoTagRule {
  private client: ClaudeClient;
  private minContentLength: number;
  private maxTags: number;
  private confidenceThreshold: number;

  constructor(config: AutoTagRuleConfig) {
    this.client = config.claudeClient;
    this.minContentLength = config.minContentLength ?? 50;
    this.maxTags = config.maxTags ?? 5;
    this.confidenceThreshold = config.confidenceThreshold ?? 0.7;
  }

  /**
   * Check if the rule should trigger for this note
   */
  shouldTrigger(content: string): boolean {
    // Parse frontmatter
    const { frontmatter } = parseFrontmatter(content);

    // Don't trigger if tags already exist (use index signature access)
    if (frontmatter && 'tags' in frontmatter && Array.isArray(frontmatter['tags']) && frontmatter['tags'].length > 0) {
      return false;
    }

    // Don't trigger if content is too short
    const bodyLength = content.replace(/^---[\s\S]*?---/m, '').trim().length;
    if (bodyLength < this.minContentLength) {
      return false;
    }

    return true;
  }

  /**
   * Execute the auto-tagging rule
   */
  async execute(content: string, context?: { filename?: string }): Promise<AutoTagResult> {
    try {
      // Check if we should trigger
      if (!this.shouldTrigger(content)) {
        return {
          success: false,
          error: 'Rule conditions not met (tags exist or content too short)'
        };
      }

      // Extract body content (without frontmatter)
      const { body, frontmatter } = parseFrontmatter(content);

      // Build prompt for tag suggestion
      const prompt = new PromptBuilder()
        .system(TAG_SUGGESTION_PROMPT.system)
        .user(TAG_SUGGESTION_PROMPT.user)
        .variable('content', body)
        .variable('filename', context?.filename ?? 'untitled')
        .variable('maxTags', this.maxTags)
        .expectJSON({
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tag: { type: 'string' },
                  confidence: { type: 'number' },
                  reason: { type: 'string' }
                }
              }
            }
          }
        })
        .expectTokens(200)
        .build();

      // Send request to Claude
      const response = await this.client.sendMessage(prompt.messages, {
        systemPrompt: prompt.system,
        responseFormat: prompt.responseFormat,
        maxTokens: 500
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error ?? 'Failed to get tag suggestions from Claude',
          tokensUsed: response.tokens
        };
      }

      // Parse tag suggestions
      const suggestions = this.parseTagSuggestions(response.data);

      // Filter by confidence threshold
      const highConfidenceTags = suggestions
        .filter(s => s.confidence >= this.confidenceThreshold)
        .map(s => s.tag)
        .slice(0, this.maxTags);

      if (highConfidenceTags.length === 0) {
        return {
          success: false,
          error: 'No high-confidence tag suggestions found',
          tokensUsed: response.tokens
        };
      }

      // Update frontmatter with suggested tags
      const updatedContent = updateFrontmatter(content, {
        ...frontmatter,
        suggested_tags: highConfidenceTags,
        tags_generated_at: new Date().toISOString()
      });

      return {
        success: true,
        suggestedTags: highConfidenceTags,
        updatedContent,
        tokensUsed: response.tokens
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Parse tag suggestions from Claude response
   */
  private parseTagSuggestions(data: unknown): TagSuggestion[] {
    try {
      if (typeof data !== 'object' || data === null) {
        return [];
      }

      const parsed = data as { tags?: unknown[] };

      if (!Array.isArray(parsed.tags)) {
        return [];
      }

      const suggestions: TagSuggestion[] = [];
      for (const item of parsed.tags) {
        if (typeof item === 'object' && item !== null) {
          const suggestion = item as Partial<TagSuggestion>;
          const tag = String(suggestion.tag ?? '').trim();
          if (tag.length > 0) {
            suggestions.push({
              tag,
              confidence: Number(suggestion.confidence ?? 0),
              reason: suggestion.reason
            });
          }
        }
      }
      return suggestions;
    } catch {
      return [];
    }
  }

  /**
   * Get rule configuration
   */
  getConfig(): Readonly<{
    minContentLength: number;
    maxTags: number;
    confidenceThreshold: number;
  }> {
    return {
      minContentLength: this.minContentLength,
      maxTags: this.maxTags,
      confidenceThreshold: this.confidenceThreshold
    };
  }
}

/**
 * Create an auto-tagging rule instance
 */
export function createAutoTagRule(config: AutoTagRuleConfig): AutoTagRule {
  return new AutoTagRule(config);
}
