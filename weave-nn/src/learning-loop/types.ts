/**
 * Type Definitions for Autonomous Learning Loop
 * Based on 4-Pillar Framework from "Fundamentals of Building Autonomous LLM Agents"
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Task {
  id: string;
  description: string;
  domain: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  createdAt?: number;
}

export interface Context {
  task: Task;
  pastExperiences: Experience[];
  relatedNotes: Note[];
  externalKnowledge?: ExternalKnowledge[];
  timestamp: number;
}

export interface Plan {
  id: string;
  taskId: string;
  steps: Step[];
  estimatedEffort: number;
  confidence: number;
  rationale: string;
  fallbackPlans?: Plan[];
  createdAt: number;
}

export interface Step {
  id: string;
  name: string;
  action: string;
  params: Record<string, any>;
  expectedOutcome: string;
  order: number;
}

export interface Outcome {
  success: boolean;
  data?: any;
  error?: Error;
  duration: number;
  metrics: ExecutionMetrics;
  logs: string[];
  timestamp: number;
}

export interface ExecutionMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  stepsCompleted: number;
  stepsTotal: number;
  successRate: number;
  errorCount: number;
}

export interface Experience {
  id: string;
  task: Task;
  context: Context;
  plan: Plan;
  outcome: Outcome;
  success: boolean;
  lessons: Lesson[];
  timestamp: number;
  domain: string;
}

export interface Lesson {
  type: 'success' | 'failure' | 'optimization' | 'error';
  description: string;
  actions: string[];
  impact: 'high' | 'medium' | 'low';
  applicableDomains: string[];
}

export interface Note {
  path: string;
  content: string;
  tags: string[];
  links: string[];
  frontmatter: Record<string, any>;
  relevanceScore?: number;
}

export interface ExternalKnowledge {
  source: string;
  content: string;
  url?: string;
  confidence: number;
  timestamp: number;
}

// ============================================================================
// PERCEPTION TYPES
// ============================================================================

export interface PerceptionInput {
  task: Task;
  maxExperiences?: number;
  maxNotes?: number;
  includeExternalKnowledge?: boolean;
}

export interface PerceptionOutput {
  context: Context;
  confidence: number;
  sources: PerceptionSource[];
}

export interface PerceptionSource {
  type: 'experience' | 'note' | 'external';
  count: number;
  quality: number;
}

// ============================================================================
// REASONING TYPES
// ============================================================================

export interface ReasoningInput {
  context: Context;
  generateAlternatives?: boolean;
  maxAlternatives?: number;
}

export interface ReasoningOutput {
  selectedPlan: Plan;
  alternativePlans: Plan[];
  reasoningPath: ReasoningStep[];
  confidence: number;
}

export interface ReasoningStep {
  step: number;
  thought: string;
  evidence: string[];
  decision: string;
}

export interface PlanEvaluation {
  plan: Plan;
  score: number;
  strengths: string[];
  weaknesses: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================================================
// MEMORY TYPES
// ============================================================================

export interface MemoryQuery {
  pattern: string;
  namespace?: string;
  limit?: number;
  filters?: MemoryFilter;
}

export interface MemoryFilter {
  domain?: string;
  successOnly?: boolean;
  minConfidence?: number;
  dateRange?: { start: number; end: number };
}

export interface MemoryEntry {
  key: string;
  value: string;
  namespace: string;
  ttl?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

export interface ExecutionInput {
  plan: Plan;
  monitoring?: boolean;
  retryOnFailure?: boolean;
}

export interface ExecutionResult {
  task: Task;
  context: Context;
  plan: Plan;
  outcome: Outcome;
  success: boolean;
  logs: string[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
  triggers: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  name: string;
  action: string;
  params: Record<string, any>;
  retry?: RetryConfig;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  retryableErrors: string[];
}

// ============================================================================
// REFLECTION TYPES
// ============================================================================

export interface ReflectionInput {
  execution: ExecutionResult;
  includePatternAnalysis?: boolean;
}

export interface ReflectionOutput {
  lessons: Lesson[];
  patternAnalysis?: PatternAnalysis;
  recommendations: Recommendation[];
  confidence: number;
}

export interface PatternAnalysis {
  patterns: Pattern[];
  insights: string[];
  correlations: Correlation[];
}

export interface Pattern {
  type: string;
  description: string;
  frequency: number;
  impact: number;
}

export interface Correlation {
  factor1: string;
  factor2: string;
  strength: number;
  description: string;
}

export interface Recommendation {
  type: 'optimization' | 'prevention' | 'enhancement';
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: number;
}

// ============================================================================
// LEARNING REPORT TYPES
// ============================================================================

export interface LearningReport {
  task: Task;
  iterations: number;
  results: IterationResult[];
  overallImprovement: number;
  keyLearnings: string[];
  recommendations: string[];
  metrics: LearningMetrics;
}

export interface IterationResult {
  iteration: number;
  success: boolean;
  duration: number;
  confidence: number;
  improvement?: number;
  lessonsLearned: number;
}

export interface LearningMetrics {
  averageConfidence: number;
  successRate: number;
  averageDuration: number;
  totalLessons: number;
  improvementRate: number;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface LearningLoopConfig {
  // Perception settings
  maxExperiencesPerQuery: number;
  maxNotesPerQuery: number;
  enableExternalKnowledge: boolean;
  semanticSearchThreshold: number;

  // Reasoning settings
  generateAlternativePlans: boolean;
  maxAlternativePlans: number;
  minPlanConfidence: number;

  // Memory settings
  experienceRetentionDays: number;
  memoryNamespace: string;
  enableCompression: boolean;

  // Execution settings
  enableMonitoring: boolean;
  maxRetries: number;
  timeoutMs: number;

  // Reflection settings
  enablePatternAnalysis: boolean;
  minLessonImpact: 'low' | 'medium' | 'high';
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class LearningLoopError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'LearningLoopError';
  }
}

export class PerceptionError extends LearningLoopError {
  constructor(message: string, context?: any) {
    super(message, 'PERCEPTION_ERROR', context);
    this.name = 'PerceptionError';
  }
}

export class ReasoningError extends LearningLoopError {
  constructor(message: string, context?: any) {
    super(message, 'REASONING_ERROR', context);
    this.name = 'ReasoningError';
  }
}

export class MemoryError extends LearningLoopError {
  constructor(message: string, context?: any) {
    super(message, 'MEMORY_ERROR', context);
    this.name = 'MemoryError';
  }
}

export class ExecutionError extends LearningLoopError {
  constructor(message: string, context?: any) {
    super(message, 'EXECUTION_ERROR', context);
    this.name = 'ExecutionError';
  }
}
