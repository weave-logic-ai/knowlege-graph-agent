/**
 * Reflection Engine Types
 *
 * Type definitions for experience analysis, pattern recognition, and improvement suggestions.
 */

import type { Experience, Lesson, ExperienceDomain } from '../memory/types.js';

export type ReflectionType = 'post-execution' | 'anticipatory' | 'periodic' | 'on-demand';
export type PatternType = 'success' | 'failure' | 'optimization' | 'anti-pattern';
export type ImprovementPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Pattern recognized across multiple experiences
 */
export interface Pattern {
  id: string;
  type: PatternType;
  description: string;
  examples: string[]; // Experience IDs
  frequency: number;
  confidence: number;
  domain: ExperienceDomain;
  metadata?: Record<string, unknown>;
}

/**
 * Improvement suggestion derived from reflection
 */
export interface ImprovementSuggestion {
  id: string;
  pattern?: Pattern;
  description: string;
  rationale: string;
  priority: ImprovementPriority;
  estimatedImpact: number; // 0-1 scale
  actionable: boolean;
  steps?: string[];
  relatedExperiences: string[]; // Experience IDs
  metadata?: Record<string, unknown>;
}

/**
 * Reflection on a single experience or set of experiences
 */
export interface Reflection {
  id: string;
  type: ReflectionType;
  timestamp: Date;
  experiences: string[]; // Experience IDs
  summary: string;
  patterns: Pattern[];
  improvements: ImprovementSuggestion[];
  insights: string[];
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Analysis of experience success/failure factors
 */
export interface ExperienceAnalysis {
  experienceId: string;
  successFactors: string[];
  failureFactors: string[];
  keyDecisions: string[];
  alternativeApproaches: string[];
  lessonsLearned: Lesson[];
  applicability: {
    domains: ExperienceDomain[];
    taskTypes: string[];
    confidence: number;
  };
}

/**
 * Comparison between multiple experiences
 */
export interface ExperienceComparison {
  experiences: string[]; // Experience IDs
  similarities: string[];
  differences: string[];
  commonPatterns: Pattern[];
  uniqueApproaches: Record<string, string[]>; // experienceId -> unique approaches
  recommendation: string;
}

/**
 * Performance trend analysis
 */
export interface PerformanceTrend {
  domain: ExperienceDomain;
  metric: string;
  dataPoints: Array<{
    timestamp: Date;
    value: number;
    experienceId: string;
  }>;
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  confidence: number;
  insights: string[];
}

/**
 * Reflection configuration
 */
export interface ReflectionConfig {
  minExperiences?: number; // Minimum experiences needed for pattern recognition
  minConfidence?: number; // Minimum confidence threshold
  maxPatterns?: number; // Maximum patterns to identify
  maxImprovements?: number; // Maximum improvements to suggest
  domains?: ExperienceDomain[]; // Domains to analyze
  enableAnticipatory?: boolean; // Enable anticipatory reflection
}

/**
 * Interface for reflection engine
 */
export interface IReflectionEngine {
  /**
   * Reflect on a single experience
   */
  reflectOnExperience(experience: Experience): Promise<Reflection>;

  /**
   * Reflect on multiple experiences
   */
  reflectOnExperiences(experiences: Experience[]): Promise<Reflection>;

  /**
   * Identify patterns across experiences
   */
  identifyPatterns(experiences: Experience[]): Promise<Pattern[]>;

  /**
   * Generate improvement suggestions
   */
  generateImprovements(
    experiences: Experience[],
    patterns: Pattern[]
  ): Promise<ImprovementSuggestion[]>;

  /**
   * Analyze a single experience
   */
  analyzeExperience(experience: Experience): Promise<ExperienceAnalysis>;

  /**
   * Compare multiple experiences
   */
  compareExperiences(experiences: Experience[]): Promise<ExperienceComparison>;

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends(
    domain: ExperienceDomain,
    metric: string
  ): Promise<PerformanceTrend>;
}
