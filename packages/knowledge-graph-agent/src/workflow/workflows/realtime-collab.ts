/**
 * Real-Time Collaboration Workflow
 *
 * Durable workflow that monitors documentation changes and
 * autonomously manages task specification generation.
 *
 * Uses Workflow DevKit's "use workflow" and "use step" directives
 * for durable execution with automatic retry and replay.
 *
 * @module workflow/workflows/realtime-collab
 */

/**
 * World state representation for GOAP planning
 *
 * Tracks the current state of documentation and development readiness.
 */
export interface WorldState {
  /** Whether a specification document exists */
  hasSpecification: boolean;
  /** Completeness score from 0 to 1 */
  specCompleteness: number;
  /** Whether acceptance criteria have been defined */
  hasAcceptanceCriteria: boolean;
  /** Whether task is fully defined */
  taskDefined: boolean;
  /** Whether there are no blockers preventing development */
  blockersFree: boolean;
  /** Whether development has started */
  developmentStarted: boolean;
  /** Time since last document change in milliseconds */
  timeSinceLastChange: number;
  /** Timestamp of last document change */
  lastChangeTimestamp: number;
  /** List of active collaborator IDs */
  activeCollaborators: string[];
  /** List of pending gaps to address */
  pendingGaps: string[];
}

/**
 * Event emitted when a node is updated in the knowledge graph
 */
export interface NodeUpdateEvent {
  /** Node ID that was updated */
  nodeId: string;
  /** Type of update (created, modified, deleted) */
  updateType: 'created' | 'modified' | 'deleted';
  /** Path to the document */
  docPath: string;
  /** Timestamp of the update */
  timestamp: Date;
  /** User who made the change */
  userId?: string;
  /** Change summary */
  changeSummary?: string;
}

/**
 * Individual gap identified during analysis
 */
export interface Gap {
  /** Type of gap (missing_section, incomplete_content, etc.) */
  type: 'missing_section' | 'incomplete_content' | 'unclear_requirements' | 'missing_tests';
  /** Human-readable description */
  description: string;
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Suggested content to fill the gap */
  suggestedContent?: string;
  /** Location in document where gap was found */
  location?: string;
}

/**
 * Result of gap analysis on a document
 */
export interface GapAnalysis {
  /** Path to analyzed document */
  docPath: string;
  /** Overall completeness score from 0 to 1 */
  completeness: number;
  /** List of identified gaps */
  gaps: Gap[];
  /** Recommendations for improvement */
  recommendations: string[];
  /** Timestamp of analysis */
  analyzedAt: Date;
}

/**
 * Generated task specification from documentation
 */
export interface TaskSpec {
  /** Unique task identifier */
  id: string;
  /** Task version */
  version: string;
  /** Task title */
  title: string;
  /** Detailed description */
  description: string;
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** List of requirements */
  requirements: string[];
  /** Acceptance criteria that must be met */
  acceptanceCriteria: string[];
  /** Estimated complexity (1-10 scale) */
  estimatedComplexity: number;
  /** Source document path */
  sourceDoc: string;
  /** Generation timestamp */
  generatedAt: Date;
  /** Confidence score for the specification */
  confidence: number;
}

/**
 * Step in a GOAP plan
 */
export interface GOAPStep {
  /** Action to take */
  action: string;
  /** Cost of this action */
  cost: number;
  /** Expected state after this action */
  expectedState: Partial<WorldState>;
  /** Prerequisites that must be true */
  preconditions?: Partial<WorldState>;
}

/**
 * GOAP plan for achieving a goal
 */
export interface GOAPPlan {
  /** Goal being pursued */
  goal: string;
  /** Whether the goal is achievable */
  achievable: boolean;
  /** Ordered list of steps */
  steps: GOAPStep[];
  /** Total cost of the plan */
  totalCost: number;
  /** Confidence in plan success */
  confidence: number;
}

// Default inactivity timeout (5 minutes)
const DEFAULT_INACTIVITY_TIMEOUT = 5 * 60 * 1000;

// Confidence threshold for auto-starting development
const AUTO_START_THRESHOLD = 0.7;

// Required documentation sections for completeness check
const REQUIRED_SECTIONS = [
  'overview',
  'requirements',
  'acceptance-criteria',
  'technical-spec',
  'test-cases',
] as const;

/**
 * Initialize world state from current context
 *
 * Creates a fresh world state based on the document path provided.
 * This step is idempotent and can be safely replayed.
 *
 * @param docPath - Path to the documentation file
 * @returns Initialized world state
 */
async function initializeWorldState(docPath: string): Promise<WorldState> {
  'use step';

  return {
    hasSpecification: true,
    specCompleteness: 0,
    hasAcceptanceCriteria: false,
    taskDefined: false,
    blockersFree: true,
    developmentStarted: false,
    timeSinceLastChange: 0,
    lastChangeTimestamp: Date.now(),
    activeCollaborators: [],
    pendingGaps: [],
  };
}

/**
 * Analyze document for gaps and completeness
 *
 * Performs comprehensive analysis of the documentation to identify:
 * - Missing required sections
 * - Incomplete content areas
 * - Unclear requirements
 * - Missing test specifications
 *
 * @param docPath - Path to the documentation file
 * @param currentState - Current world state for context
 * @returns Gap analysis results
 */
async function analyzeDocumentGaps(
  docPath: string,
  currentState: WorldState
): Promise<GapAnalysis> {
  'use step';

  const gaps: Gap[] = [];
  let completeness = 0;

  // Analyze document structure and content
  // In production, this would parse the actual document
  // For now, simulate gap detection based on document path

  // Determine found sections (would be from actual document parsing)
  const foundSectionsCount = Math.floor(Math.random() * REQUIRED_SECTIONS.length) + 1;
  completeness = foundSectionsCount / REQUIRED_SECTIONS.length;

  // Generate gaps for missing sections
  for (let i = foundSectionsCount; i < REQUIRED_SECTIONS.length; i++) {
    const sectionName = REQUIRED_SECTIONS[i];
    gaps.push({
      type: 'missing_section',
      description: `Missing ${sectionName} section`,
      severity: i < 3 ? 'high' : 'medium',
      suggestedContent: generateSectionTemplate(sectionName),
      location: `/${sectionName}`,
    });
  }

  // Check for incomplete content if some sections exist
  if (completeness > 0.3 && completeness < 0.8) {
    gaps.push({
      type: 'incomplete_content',
      description: 'Some sections lack sufficient detail',
      severity: 'medium',
      suggestedContent: 'Expand existing sections with more specific details',
    });
  }

  // Check for unclear requirements
  if (completeness < 0.5) {
    gaps.push({
      type: 'unclear_requirements',
      description: 'Requirements need clarification',
      severity: 'high',
      suggestedContent: 'Add specific, measurable requirements with acceptance criteria',
    });
  }

  return {
    docPath,
    completeness,
    gaps,
    recommendations: gaps.map((g) => g.suggestedContent || g.description),
    analyzedAt: new Date(),
  };
}

/**
 * Generate a template for a missing section
 *
 * @param sectionName - Name of the section to generate
 * @returns Template content for the section
 */
function generateSectionTemplate(sectionName: string): string {
  const templates: Record<string, string> = {
    overview: '## Overview\n\nProvide a high-level description of the feature or component.',
    requirements:
      '## Requirements\n\n- [ ] Requirement 1\n- [ ] Requirement 2\n- [ ] Requirement 3',
    'acceptance-criteria':
      '## Acceptance Criteria\n\nGiven [context]\nWhen [action]\nThen [expected result]',
    'technical-spec':
      '## Technical Specification\n\n### Architecture\n\n### Implementation Details\n\n### Dependencies',
    'test-cases':
      '## Test Cases\n\n### Unit Tests\n\n### Integration Tests\n\n### E2E Tests',
  };

  return templates[sectionName] || `## ${sectionName}\n\nAdd content here.`;
}

/**
 * Generate task specification from documentation
 *
 * Creates a comprehensive task specification based on gap analysis
 * and documentation content. The spec includes requirements,
 * acceptance criteria, and complexity estimation.
 *
 * @param docPath - Path to the source document
 * @param gapAnalysis - Analysis results to incorporate
 * @returns Generated task specification
 */
async function generateTaskSpec(
  docPath: string,
  gapAnalysis: GapAnalysis
): Promise<TaskSpec> {
  'use step';

  const specId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Determine priority based on completeness
  let priority: TaskSpec['priority'];
  if (gapAnalysis.completeness >= 0.9) {
    priority = 'critical';
  } else if (gapAnalysis.completeness >= 0.8) {
    priority = 'high';
  } else if (gapAnalysis.completeness >= 0.5) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  // Extract requirements from recommendations
  const requirements = gapAnalysis.recommendations.filter(
    (r) => r.length > 0 && !r.startsWith('Add')
  );

  // Generate acceptance criteria
  const acceptanceCriteria = [
    'All identified gaps are addressed',
    `Documentation completeness >= ${Math.round(AUTO_START_THRESHOLD * 100)}%`,
    'All automated tests pass',
    'Code review approved',
  ];

  // Calculate complexity based on gaps and completeness
  const gapComplexity = gapAnalysis.gaps.length * 2;
  const completenessComplexity = Math.ceil((1 - gapAnalysis.completeness) * 10);
  const estimatedComplexity = Math.min(10, Math.max(1, gapComplexity + completenessComplexity));

  return {
    id: specId,
    version: '1.0.0',
    title: `Task from ${extractDocName(docPath)}`,
    description: `Auto-generated task specification based on documentation analysis of ${docPath}`,
    priority,
    requirements:
      requirements.length > 0 ? requirements : gapAnalysis.recommendations.slice(0, 5),
    acceptanceCriteria,
    estimatedComplexity,
    sourceDoc: docPath,
    generatedAt: new Date(),
    confidence: gapAnalysis.completeness,
  };
}

/**
 * Extract document name from path
 *
 * @param docPath - Full document path
 * @returns Document name without extension
 */
function extractDocName(docPath: string): string {
  const parts = docPath.split('/');
  const filename = parts[parts.length - 1] || 'document';
  return filename.replace(/\.[^/.]+$/, '');
}

/**
 * Generate missing documentation to fill gaps
 *
 * Automatically generates content for identified gaps.
 * In production, this would use AI to generate contextual content.
 *
 * @param docPath - Path to the document being enhanced
 * @param gaps - List of gaps to address
 * @returns Array of generated documentation content
 */
async function generateMissingDocs(
  docPath: string,
  gaps: Gap[]
): Promise<string[]> {
  'use step';

  const generatedDocs: string[] = [];

  for (const gap of gaps) {
    // Generate content based on gap type
    let content: string;

    switch (gap.type) {
      case 'missing_section':
        content = gap.suggestedContent || `# ${gap.description}\n\nContent to be added.`;
        break;
      case 'incomplete_content':
        content = `<!-- Enhancement needed: ${gap.description} -->\n${gap.suggestedContent || ''}`;
        break;
      case 'unclear_requirements':
        content = `## Requirements Clarification\n\n${gap.suggestedContent || 'Clarify requirements here.'}`;
        break;
      case 'missing_tests':
        content = `## Test Specifications\n\n${gap.suggestedContent || 'Define test cases here.'}`;
        break;
      default:
        content = `# ${gap.description}\n\n${gap.suggestedContent || 'Content to be added'}`;
    }

    generatedDocs.push(content);
  }

  return generatedDocs;
}

/**
 * Create GOAP plan for achieving development goal
 *
 * Uses Goal-Oriented Action Planning to determine the optimal
 * sequence of steps to reach the desired state from current state.
 *
 * @param state - Current world state
 * @param goal - Goal to achieve (e.g., 'start-development')
 * @returns GOAP plan with steps and costs
 */
async function createGOAPPlan(state: WorldState, goal: string): Promise<GOAPPlan> {
  'use step';

  const steps: GOAPStep[] = [];
  let totalCost = 0;

  // Plan actions based on current state and goal
  // Each action moves us closer to the goal state

  // Step 1: Analyze specification if needed
  if (!state.hasSpecification || state.specCompleteness < AUTO_START_THRESHOLD) {
    steps.push({
      action: 'analyze-spec',
      cost: 1,
      expectedState: { specCompleteness: state.specCompleteness },
      preconditions: { hasSpecification: true },
    });
    totalCost += 1;
  }

  // Step 2: Generate missing documentation if completeness is low
  if (state.specCompleteness < AUTO_START_THRESHOLD) {
    steps.push({
      action: 'generate-missing-docs',
      cost: 5,
      expectedState: {
        specCompleteness: Math.min(1, state.specCompleteness + 0.3),
      },
      preconditions: { hasSpecification: true },
    });
    totalCost += 5;
  }

  // Step 3: Generate task specification if completeness is sufficient
  if (!state.taskDefined && state.specCompleteness >= AUTO_START_THRESHOLD) {
    steps.push({
      action: 'generate-task-spec',
      cost: 3,
      expectedState: { taskDefined: true },
      preconditions: { specCompleteness: AUTO_START_THRESHOLD },
    });
    totalCost += 3;
  }

  // Step 4: Start development if all prerequisites are met
  if (state.taskDefined && state.blockersFree && goal === 'start-development') {
    steps.push({
      action: 'start-development',
      cost: 10,
      expectedState: { developmentStarted: true },
      preconditions: {
        taskDefined: true,
        blockersFree: true,
      },
    });
    totalCost += 10;
  }

  // Calculate confidence based on state and number of steps
  const confidence = steps.length > 0 ? Math.max(0.3, state.specCompleteness - steps.length * 0.1) : 0;

  return {
    goal,
    achievable: steps.length > 0,
    steps,
    totalCost,
    confidence,
  };
}

/**
 * Notify collaborators of workflow events
 *
 * Broadcasts events to all active collaborators via configured channels.
 * Supports multiple notification mechanisms (WebSocket, message bus, etc.).
 *
 * @param graphId - Knowledge graph identifier
 * @param event - Event type being notified
 * @param data - Event payload data
 */
async function notifyCollaborators(
  graphId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  'use step';

  // In production, this would broadcast via WebSocket or message bus
  // For now, log the notification for debugging
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [Workflow:${graphId}] ${event}`;

  // Log with structured data for observability
  console.log(message, JSON.stringify(data, null, 2));

  // TODO: Implement actual notification channels
  // - WebSocket broadcast to connected clients
  // - Message queue publishing for async consumers
  // - Webhook calls to external systems
}

/**
 * Main real-time collaboration workflow
 *
 * This durable workflow:
 * 1. Monitors documentation for changes
 * 2. Analyzes gaps when changes occur
 * 3. Generates task specs when documentation is sufficient
 * 4. Auto-generates missing docs after inactivity timeout
 *
 * The workflow uses "use workflow" directive for durability,
 * ensuring it can survive restarts and failures.
 *
 * @param graphId - Knowledge graph identifier
 * @param docPath - Path to monitor for documentation
 * @param options - Workflow configuration options
 *
 * @example
 * ```typescript
 * await realtimeCollaborationWorkflow('graph-123', '/docs/feature.md', {
 *   inactivityTimeout: 5 * 60 * 1000, // 5 minutes
 *   autoStartThreshold: 0.7
 * });
 * ```
 */
export async function realtimeCollaborationWorkflow(
  graphId: string,
  docPath: string,
  options: {
    /** Timeout before auto-generating missing docs (ms) */
    inactivityTimeout?: number;
    /** Completeness threshold to trigger development */
    autoStartThreshold?: number;
  } = {}
): Promise<void> {
  'use workflow';

  const inactivityTimeout = options.inactivityTimeout || DEFAULT_INACTIVITY_TIMEOUT;
  const autoStartThreshold = options.autoStartThreshold || AUTO_START_THRESHOLD;

  // Initialize world state
  let worldState = await initializeWorldState(docPath);

  // Notify workflow started
  await notifyCollaborators(graphId, 'workflow:started', {
    docPath,
    inactivityTimeout,
    autoStartThreshold,
  });

  // Main workflow loop with safety limit
  let iterationCount = 0;
  const maxIterations = 100;

  while (iterationCount < maxIterations) {
    iterationCount++;

    try {
      // Analyze current document state
      const gapAnalysis = await analyzeDocumentGaps(docPath, worldState);

      // Update world state based on analysis
      worldState = {
        ...worldState,
        specCompleteness: gapAnalysis.completeness,
        pendingGaps: gapAnalysis.gaps.map((g) => g.description),
        hasAcceptanceCriteria: gapAnalysis.completeness >= 0.5,
      };

      // Create GOAP plan for development goal
      const plan = await createGOAPPlan(worldState, 'start-development');

      // Check if we can generate task spec
      if (gapAnalysis.completeness >= autoStartThreshold && !worldState.taskDefined) {
        // Sufficient completeness - generate task specification
        const taskSpec = await generateTaskSpec(docPath, gapAnalysis);

        // Update state
        worldState.taskDefined = true;

        await notifyCollaborators(graphId, 'task-spec:generated', {
          taskSpec: {
            id: taskSpec.id,
            title: taskSpec.title,
            priority: taskSpec.priority,
            confidence: taskSpec.confidence,
          },
          plan: {
            achievable: plan.achievable,
            steps: plan.steps.length,
            totalCost: plan.totalCost,
          },
        });

        // Check if development can start
        if (plan.achievable && worldState.blockersFree) {
          await notifyCollaborators(graphId, 'development:ready', {
            taskSpec: {
              id: taskSpec.id,
              title: taskSpec.title,
              requirements: taskSpec.requirements.length,
              acceptanceCriteria: taskSpec.acceptanceCriteria.length,
            },
            confidence: plan.confidence,
          });
        }

        // Task spec generated - exit loop
        break;
      } else if (gapAnalysis.completeness < autoStartThreshold) {
        // Insufficient completeness - check inactivity
        const timeSinceLastChange = Date.now() - worldState.lastChangeTimestamp;

        if (timeSinceLastChange >= inactivityTimeout) {
          // Inactivity timeout reached - auto-generate docs
          await notifyCollaborators(graphId, 'docs:generating', {
            gaps: gapAnalysis.gaps.length,
            reason: 'inactivity_timeout',
            timeSinceLastChange,
          });

          const generatedDocs = await generateMissingDocs(docPath, gapAnalysis.gaps);

          await notifyCollaborators(graphId, 'docs:generated', {
            count: generatedDocs.length,
            gaps: gapAnalysis.gaps.map((g) => ({
              type: g.type,
              description: g.description,
            })),
          });

          // Update state after doc generation
          worldState = {
            ...worldState,
            lastChangeTimestamp: Date.now(),
            specCompleteness: Math.min(1, worldState.specCompleteness + 0.3),
          };
        } else {
          // Still within timeout - wait for changes
          await notifyCollaborators(graphId, 'workflow:waiting', {
            currentCompleteness: gapAnalysis.completeness,
            requiredCompleteness: autoStartThreshold,
            gaps: gapAnalysis.gaps.length,
            timeUntilDocGen: inactivityTimeout - timeSinceLastChange,
          });

          // Exit loop and wait for external trigger
          break;
        }
      }
    } catch (error) {
      // Handle errors gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);

      await notifyCollaborators(graphId, 'workflow:error', {
        error: errorMessage,
        iteration: iterationCount,
      });

      // Re-throw for workflow retry mechanism
      throw error;
    }
  }

  // Workflow complete
  await notifyCollaborators(graphId, 'workflow:completed', {
    iterations: iterationCount,
    finalState: {
      specCompleteness: worldState.specCompleteness,
      taskDefined: worldState.taskDefined,
      pendingGaps: worldState.pendingGaps.length,
    },
  });
}

/**
 * Gap detection workflow - runs on document change
 *
 * Lightweight workflow that performs gap analysis without
 * the full collaboration loop. Use this for quick checks.
 *
 * @param docPath - Path to document to analyze
 * @returns Gap analysis results
 *
 * @example
 * ```typescript
 * const analysis = await gapDetectionWorkflow('/docs/api-spec.md');
 * console.log(`Completeness: ${analysis.completeness * 100}%`);
 * console.log(`Gaps found: ${analysis.gaps.length}`);
 * ```
 */
export async function gapDetectionWorkflow(docPath: string): Promise<GapAnalysis> {
  'use workflow';

  const worldState = await initializeWorldState(docPath);
  const analysis = await analyzeDocumentGaps(docPath, worldState);

  return analysis;
}

/**
 * Task specification workflow - generates spec from docs
 *
 * Complete workflow that analyzes documentation and generates
 * a task specification. Includes gap analysis as part of the process.
 *
 * @param docPath - Path to source documentation
 * @returns Generated task specification
 *
 * @example
 * ```typescript
 * const spec = await taskSpecWorkflow('/docs/new-feature.md');
 * console.log(`Generated task: ${spec.title}`);
 * console.log(`Priority: ${spec.priority}`);
 * console.log(`Complexity: ${spec.estimatedComplexity}/10`);
 * ```
 */
export async function taskSpecWorkflow(docPath: string): Promise<TaskSpec> {
  'use workflow';

  const worldState = await initializeWorldState(docPath);
  const analysis = await analyzeDocumentGaps(docPath, worldState);
  const spec = await generateTaskSpec(docPath, analysis);

  return spec;
}

/**
 * Document enhancement workflow - fills gaps automatically
 *
 * Workflow that analyzes documentation, identifies gaps, and
 * generates content to fill those gaps.
 *
 * @param docPath - Path to document to enhance
 * @returns Object containing analysis and generated content
 *
 * @example
 * ```typescript
 * const result = await documentEnhancementWorkflow('/docs/incomplete.md');
 * console.log(`Filled ${result.generatedContent.length} gaps`);
 * ```
 */
export async function documentEnhancementWorkflow(
  docPath: string
): Promise<{
  analysis: GapAnalysis;
  generatedContent: string[];
}> {
  'use workflow';

  const worldState = await initializeWorldState(docPath);
  const analysis = await analyzeDocumentGaps(docPath, worldState);
  const generatedContent = await generateMissingDocs(docPath, analysis.gaps);

  return {
    analysis,
    generatedContent,
  };
}

/**
 * GOAP planning workflow - creates action plan
 *
 * Workflow that analyzes current state and creates an optimal
 * plan to achieve the specified goal.
 *
 * @param docPath - Path to source documentation
 * @param goal - Goal to achieve
 * @returns GOAP plan with steps and costs
 *
 * @example
 * ```typescript
 * const plan = await goapPlanningWorkflow('/docs/feature.md', 'start-development');
 * if (plan.achievable) {
 *   console.log(`Plan has ${plan.steps.length} steps`);
 *   console.log(`Total cost: ${plan.totalCost}`);
 * }
 * ```
 */
export async function goapPlanningWorkflow(
  docPath: string,
  goal: string
): Promise<GOAPPlan> {
  'use workflow';

  const worldState = await initializeWorldState(docPath);
  const analysis = await analyzeDocumentGaps(docPath, worldState);

  // Update world state with analysis results
  const updatedState: WorldState = {
    ...worldState,
    specCompleteness: analysis.completeness,
    hasAcceptanceCriteria: analysis.completeness >= 0.5,
    pendingGaps: analysis.gaps.map((g) => g.description),
  };

  const plan = await createGOAPPlan(updatedState, goal);

  return plan;
}
