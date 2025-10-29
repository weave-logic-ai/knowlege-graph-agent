/**
 * Type definitions for markdown-based async workflow system
 */

export type WorkflowStage = 'perception' | 'reasoning' | 'execution' | 'reflection' | 'feedback';
export type WorkflowStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * YAML frontmatter structure in markdown templates
 */
export interface MarkdownFrontmatter {
  session_id: string;
  stage: WorkflowStage;
  sop_id: string;
  task_description?: string;
  selected_plan?: string;
  execution_duration?: string;
  progress_percentage?: number;
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
  [key: string]: any; // Allow additional custom fields
}

/**
 * Checkbox item parsed from markdown
 */
export interface CheckboxItem {
  checked: boolean;
  text: string;
  lineNumber?: number;
}

/**
 * Parsed section from markdown file
 */
export interface MarkdownSection {
  heading: string;
  level: number;
  content: string;
  checkboxes?: CheckboxItem[];
  userInput?: string;
  rating?: number;
  choice?: string;
}

/**
 * Complete parsed markdown structure
 */
export interface ParsedMarkdown {
  frontmatter: MarkdownFrontmatter;
  sections: Map<string, MarkdownSection>;
  rawContent: string;
  filePath: string;
  isComplete: boolean;
  /** User input extracted from markdown (alias for compatibility) */
  userInput?: ExtractedUserInput;
  /** Raw markdown content (alias for compatibility) */
  content?: string;
}

/**
 * User input extracted from markdown
 */
export interface ExtractedUserInput {
  contextValidation?: {
    relevanceAdjustments?: Record<string, number>;
    missingContext?: string;
    additionalSources?: string[];
    priorities?: string[];
  };
  planSelection?: {
    selectedPlan: string;
    reasoning: string;
    modifications?: string;
    concerns?: string;
    successCriteria?: string;
  };
  executionProgress?: {
    completedTasks: string[];
    activeBlockers?: Array<{
      description: string;
      status: string;
      impact: string;
      notes?: string;
    }>;
    attemptedSolutions?: Array<{
      description: string;
      result: string;
      notes?: string;
    }>;
    discoveries?: Array<{
      description: string;
      impact: string;
      notes?: string;
    }>;
    deviations?: Array<{
      description: string;
      reason: string;
      impact?: string;
    }>;
  };
  reflection?: {
    satisfactionRating: number;
    whatWorkedWell: string;
    whatDidntWork: string;
    improvements: string;
    unexpectedLearnings: string;
    preferences?: {
      planningStyle?: string[];
      riskTolerance?: string[];
      learningVsSpeed?: string[];
      toolPreferences?: string[];
    };
    wouldUseAgain?: string;
    explanation?: string;
  };
  feedback?: {
    satisfactionRating: number;
    whatWentWell?: string;
    improvements?: string;
    suggestions?: string;
    preferences?: Record<string, string[]>;
  };
}

/**
 * Workflow execution context
 */
export interface WorkflowContext {
  sessionId: string;
  sopId: string;
  stage: WorkflowStage;
  parsedData: ParsedMarkdown;
  userInput: ExtractedUserInput;
  timestamp: Date;
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
  success: boolean;
  stage: WorkflowStage;
  sessionId: string;
  nextStage?: WorkflowStage;
  message?: string;
  error?: Error;
  data?: any;
}

/**
 * Session metadata stored alongside markdown files
 */
export interface SessionMetadata {
  session_id: string;
  sop_id: string;
  task_description: string;
  created_at: string;
  completed_at?: string;
  status: 'active' | 'completed' | 'archived';
  stages: {
    perception?: { completed_at?: string; status: WorkflowStatus };
    reasoning?: { completed_at?: string; status: WorkflowStatus };
    execution?: { completed_at?: string; status: WorkflowStatus };
    reflection?: { completed_at?: string; status: WorkflowStatus };
  };
  selected_plan?: string;
  final_rating?: number;
}

/**
 * File watcher event
 */
export interface FileWatchEvent {
  eventType: 'add' | 'change' | 'unlink';
  filePath: string;
  timestamp: Date;
  stats?: {
    size: number;
    mtime: Date;
  };
}

/**
 * Template population data
 */
export interface TemplateData {
  session_id: string;
  sop_id: string;
  task_description: string;
  created_at: string;

  // Perception-specific
  experience_count?: number;
  experiences_section?: string;
  vault_count?: number;
  vault_notes_section?: string;
  external_count?: number;
  external_knowledge_section?: string;

  // Reasoning-specific
  plan_count?: number;
  plans_section?: string;
  plan_headers?: string;
  plan_comparison_rows?: string;
  effort_values?: string;
  risk_values?: string;
  complexity_values?: string;
  experience_values?: string;
  learning_values?: string;
  default_plan?: string;

  // Execution-specific
  selected_plan?: string;
  execution_plan_section?: string;
  progress_checklist?: string;
  progress_percentage?: number;
  metrics_table?: string;

  // Reflection-specific
  execution_duration?: string;
  execution_summary?: string;
  default_rating?: number;
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  sessionPath: string;
  templatePath: string;
  archivePath: string;
  watcherOptions?: {
    ignoreInitial?: boolean;
    awaitWriteFinish?: {
      stabilityThreshold: number;
      pollInterval?: number;
    };
  };
}

/**
 * Experience data for perception stage
 */
export interface Experience {
  id: string;
  task_description: string;
  date: string;
  relevance_score: number;
  outcome: 'success' | 'failure' | 'partial';
  lessons?: string[];
  tags?: string[];
}

/**
 * Plan data for reasoning stage
 */
export interface Plan {
  id: string;
  name: string;
  description: string;
  strategy: string;
  effort: string;
  risk: 'low' | 'medium' | 'high';
  complexity: 'low' | 'medium' | 'high';
  experience_alignment: number;
  learning_value: 'low' | 'medium' | 'high';
  steps?: string[];
}

/**
 * Task in execution plan
 */
export interface ExecutionTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  estimated_effort?: string;
  actual_effort?: string;
  dependencies?: string[];
  notes?: string;
}

/**
 * Preference learning signal
 */
export interface PreferenceSignal {
  category: 'planning_style' | 'risk_tolerance' | 'learning_vs_speed' | 'tool_preference' | 'other';
  value: string;
  weight: number;
  timestamp: Date;
  context?: string;
}

/**
 * Learning outcome stored in memory
 */
export interface LearningOutcome {
  session_id: string;
  sop_id: string;
  task_description: string;
  selected_plan: string;
  satisfaction_rating: number;
  success: boolean;
  what_worked: string[];
  what_didnt_work: string[];
  improvements: string[];
  preference_signals: PreferenceSignal[];
  execution_duration: string;
  timestamp: Date;
}
