/**
 * Type Definitions for User Feedback Collection System
 *
 * Defines comprehensive feedback structures for the reflection stage
 * of the learning loop.
 */

export interface UserFeedback {
  id: string;
  timestamp: number;
  sopId: string;
  executionId: string;

  // Outcome validation (required)
  satisfactionRating: 1 | 2 | 3 | 4 | 5;
  satisfactionComment?: string;

  // A/B testing (when applicable)
  approaches?: ApproachOption[];
  selectedApproach?: string;
  approachRationale?: string;

  // Qualitative feedback (optional)
  improvements?: string[];
  tags?: string[];

  // Preference signals
  preferenceSignals: PreferenceSignal[];

  // Context
  taskComplexity: 'low' | 'medium' | 'high';
  userExpertise?: 'beginner' | 'intermediate' | 'expert';
}

export interface ApproachOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  estimatedEffort?: string;
  qualityScore?: number;
}

export interface PreferenceSignal {
  category: string;
  value: string;
  shouldRepeat: boolean;
  conditions?: string[];
}

export interface FeedbackPromptConfig {
  minimal?: boolean;         // Quick 1-2 questions
  skipOnHighSatisfaction?: boolean;  // Skip details if rating >= 4
  customQuestions?: Question[];
}

export interface Question {
  type: 'rating' | 'choice' | 'text' | 'confirm';
  name: string;
  message: string;
  choices?: string[];
  validate?: (value: any) => boolean | string;
  when?: (answers: any) => boolean;
}

export interface FeedbackContext {
  sopId: string;
  executionId: string;
  result: any;
  approaches?: ApproachOption[];
  suggestedImprovements?: string[];
}

export interface ApproachSelection {
  selectedId: string;
  rationale?: string;
}

export interface SatisfactionRating {
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}

export interface EnhancedLessons {
  autonomousAnalysis: AutonomousLessons;
  userSatisfaction: number;
  userPreferredApproach?: string;
  userImprovements?: string[];
  weight: number;
  confidenceScore: number;
  synthesizedRecommendations: string[];
}

export interface AutonomousLessons {
  approaches?: ApproachOption[];
  recommendedApproach?: string;
  potentialImprovements?: string[];
  executionMetrics: {
    duration: number;
    success: boolean;
    errorCount: number;
  };
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  averageSatisfaction: number;
  satisfactionTrend: number[];
  topApproaches: Array<{ id: string; count: number; avgSatisfaction: number }>;
  commonImprovements: Array<{ text: string; frequency: number }>;
  preferencePatterns: Map<string, PreferenceSignal[]>;
}

export interface ExecutionResult {
  id: string;
  sop: string;
  success: boolean;
  duration: number;
  errorCount: number;
  result: any;
  metadata?: Record<string, any>;
}
