/**
 * Chunking Configuration Validation
 * Phase 13 - Task 1.1 - SPARC Specification Phase
 *
 * Zod schemas for runtime validation of chunking configuration
 */

import { z } from 'zod';
import type { ChunkingConfig } from './types.js';

/**
 * Chunking strategy type (string literal union)
 */
export type ChunkingStrategy = 'event-based' | 'semantic-boundary' | 'preference-signal' | 'step-based';

/**
 * Chunking strategy enum schema
 */
export const chunkingStrategySchema = z.enum([
  'event-based',
  'semantic-boundary',
  'preference-signal',
  'step-based',
]);

/**
 * Event-based configuration schema
 */
export const eventBasedConfigSchema = z.object({
  phaseDetectionSensitivity: z.number().min(0).max(1).default(0.7),
  minPhaseDuration: z.number().min(0).max(3600).default(30),
});

/**
 * Semantic boundary configuration schema
 */
export const semanticBoundaryConfigSchema = z.object({
  similarityThreshold: z.number().min(0).max(1).default(0.6),
  minTopicCoherence: z.number().min(0).max(1).default(0.5),
});

/**
 * Preference signal configuration schema
 */
export const preferenceSignalConfigSchema = z.object({
  minConfidence: z.number().min(0).max(1).default(0.5),
  contextSize: z.number().min(0).max(500).default(100),
});

/**
 * Step-based configuration schema
 */
export const stepBasedConfigSchema = z.object({
  detectSubsteps: z.boolean().default(true),
  includeOptionalSteps: z.boolean().default(true),
});

/**
 * Complete chunking configuration schema
 */
export const chunkingConfigSchema = z.object({
  // Global settings
  defaultStrategy: chunkingStrategySchema.default('semantic-boundary'),
  enableAutoDetection: z.boolean().default(true),

  // Performance tuning
  maxChunkSize: z.number().min(100).max(2000).default(500),
  minChunkSize: z.number().min(10).max(500).default(50),
  contextWindowSize: z.number().min(0).max(200).default(50),

  // Strategy-specific overrides
  eventBased: eventBasedConfigSchema.default({}),
  semanticBoundary: semanticBoundaryConfigSchema.default({}),
  preferenceSignal: preferenceSignalConfigSchema.default({}),
  stepBased: stepBasedConfigSchema.default({}),

  // Metadata enrichment
  enableContextExtraction: z.boolean().default(true),
  enableRelationshipLinking: z.boolean().default(true),
  enableQualityScoring: z.boolean().default(true),
});

/**
 * Parsed content schema
 */
export const parsedContentSchema = z.object({
  path: z.string().min(1),
  frontmatter: z.record(z.unknown()).optional(),
  content: z.string(),
  modifiedAt: z.number(),
  chunkingStrategy: chunkingStrategySchema.optional(),
});

/**
 * Validate chunking configuration
 */
export function validateConfig(config: unknown): ChunkingConfig {
  return chunkingConfigSchema.parse(config);
}

/**
 * Validate chunking strategy
 */
export function validateStrategy(strategy: unknown): ChunkingStrategy {
  return chunkingStrategySchema.parse(strategy);
}

/**
 * Validate configuration with custom error messages
 */
export function validateConfigWithErrors(config: unknown): {
  valid: boolean;
  config?: ChunkingConfig;
  errors?: string[];
} {
  try {
    const validated = chunkingConfigSchema.parse(config);
    return { valid: true, config: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Unknown validation error'],
    };
  }
}

/**
 * Type guard for chunking strategy
 */
export function isChunkingStrategy(value: unknown): value is ChunkingStrategy {
  return chunkingStrategySchema.safeParse(value).success;
}
