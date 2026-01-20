/**
 * SPARC Planner
 *
 * Main orchestrator for creating comprehensive SPARC plans.
 * Coordinates research, planning, consensus building, and review processes.
 *
 * @module sparc/sparc-planner
 */

import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, extname, relative } from 'path';
import { createLogger } from '../utils/index.js';
import { createDecisionLogManager, DecisionLogManager } from './decision-log.js';
import { createConsensusBuilder, ConsensusBuilder } from './consensus.js';
import { createReviewProcess, ReviewProcessManager } from './review-process.js';
import type {
  SPARCPlan,
  SPARCPhase,
  SPARCTask,
  SpecificationDocument,
  ArchitectureDocument,
  AlgorithmDesign,
  ExistingCodeAnalysis,
  ResearchFinding,
  Requirement,
  Feature,
  ArchitectureComponent,
  KGReference,
  ContextLink,
  ConfidenceLevel,
  ReviewResult,
} from './types.js';

const logger = createLogger('sparc-planner');

/**
 * Planner options
 */
export interface SPARCPlannerOptions {
  /** Project root path */
  projectRoot: string;
  /** Output directory for plan artifacts */
  outputDir?: string;
  /** Plan name */
  name: string;
  /** Plan description */
  description: string;
  /** Enable parallel research */
  parallelResearch?: boolean;
  /** Number of review passes */
  reviewPasses?: number;
  /** Auto-build consensus for low confidence */
  autoConsensus?: boolean;
  /** Knowledge graph integration */
  kgEnabled?: boolean;
  /** Vector database integration */
  vectorEnabled?: boolean;
}

/**
 * Research task definition
 */
interface ResearchTask {
  /** Task ID */
  id: string;
  /** Agent type */
  agentType: string;
  /** Task description */
  description: string;
  /** Topics to research */
  topics: string[];
  /** Context to include */
  context: string[];
}

/**
 * SPARC Planner
 *
 * Orchestrates the full SPARC planning process.
 */
export class SPARCPlanner {
  private readonly options: Required<SPARCPlannerOptions>;
  private plan: SPARCPlan;
  private decisionLog: DecisionLogManager;
  private consensusBuilder: ConsensusBuilder;

  constructor(options: SPARCPlannerOptions) {
    this.options = {
      outputDir: join(options.projectRoot, '.sparc'),
      parallelResearch: true,
      reviewPasses: 3,
      autoConsensus: true,
      kgEnabled: true,
      vectorEnabled: true,
      ...options,
    };

    // Initialize plan
    this.plan = this.initializePlan();

    // Initialize decision log
    this.decisionLog = createDecisionLogManager({
      outputDir: this.options.outputDir,
      planId: this.plan.id,
    });

    // Initialize consensus builder
    this.consensusBuilder = createConsensusBuilder({
      defaultThreshold: 0.67,
      method: 'majority',
    });

    logger.info('SPARC Planner initialized', {
      planId: this.plan.id,
      projectRoot: this.options.projectRoot,
    });
  }

  /**
   * Initialize a new plan
   */
  private initializePlan(): SPARCPlan {
    const now = new Date();
    const id = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      id,
      name: this.options.name,
      description: this.options.description,
      status: 'draft',
      currentPhase: 'specification',
      projectRoot: this.options.projectRoot,
      outputDir: this.options.outputDir,
      tasks: [],
      parallelGroups: [],
      criticalPath: [],
      executionOrder: [],
      researchFindings: [],
      decisionLog: {
        id: `dlog_${id}`,
        planId: id,
        decisions: [],
        statistics: {
          total: 0,
          approved: 0,
          rejected: 0,
          deferred: 0,
          highConfidence: 0,
          lowConfidence: 0,
          consensusRequired: 0,
        },
        createdAt: now,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      author: 'sparc-planner',
      statistics: {
        totalTasks: 0,
        completedTasks: 0,
        parallelizableTasks: 0,
        estimatedHours: 0,
        researchFindings: 0,
        decisions: 0,
        kgNodes: 0,
      },
    };
  }

  /**
   * Execute the full planning process
   */
  async executePlanning(): Promise<SPARCPlan> {
    logger.info('Starting SPARC planning process', { planId: this.plan.id });

    try {
      // Phase 1: Research
      this.plan.status = 'researching';
      await this.executeResearchPhase();

      // Phase 2: Planning (Specification, Pseudocode, Architecture)
      this.plan.status = 'planning';
      await this.executeSpecificationPhase();
      await this.executePseudocodePhase();
      await this.executeArchitecturePhase();

      // Phase 3: Refinement (Task breakdown)
      await this.executeRefinementPhase();

      // Phase 4: Review
      this.plan.status = 'reviewing';
      const reviewResult = await this.executeReviewPhase();
      this.plan.reviewResult = reviewResult;

      // Finalize
      if (reviewResult.overallStatus === 'approved') {
        this.plan.status = 'approved';
      } else if (reviewResult.overallStatus === 'rejected') {
        this.plan.status = 'failed';
      } else {
        this.plan.status = 'planning'; // Needs more work
      }

      // Update statistics
      this.updateStatistics();

      // Save plan
      this.savePlan();

      logger.info('SPARC planning completed', {
        planId: this.plan.id,
        status: this.plan.status,
        tasks: this.plan.tasks.length,
      });

      return this.plan;
    } catch (error) {
      this.plan.status = 'failed';
      logger.error('SPARC planning failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Execute research phase
   */
  private async executeResearchPhase(): Promise<void> {
    logger.info('Executing research phase');
    this.plan.currentPhase = 'specification';

    // Analyze existing code if present
    const srcPath = join(this.options.projectRoot, 'src');
    if (existsSync(srcPath)) {
      this.plan.existingCode = await this.analyzeExistingCode(srcPath);
      this.addDecision(
        'Existing Code Integration',
        'Integrate with existing codebase in src/',
        'specification',
        'high',
        'Existing code found and analyzed for patterns and integration points',
        ['Start from scratch', 'Partial rewrite', 'Full integration']
      );
    }

    // Define research tasks
    const researchTasks = this.defineResearchTasks();

    // Execute research (would spawn agents in real implementation)
    for (const task of researchTasks) {
      const finding = await this.executeResearchTask(task);
      this.plan.researchFindings.push(finding);
    }

    logger.info('Research phase completed', {
      findings: this.plan.researchFindings.length,
      hasExistingCode: !!this.plan.existingCode,
    });
  }

  /**
   * Analyze existing code in src directory
   */
  private async analyzeExistingCode(srcPath: string): Promise<ExistingCodeAnalysis> {
    const analysis: ExistingCodeAnalysis = {
      hasSrcDirectory: true,
      srcPath,
      fileCount: 0,
      languages: {},
      keyFiles: [],
      patterns: [],
      dependencies: [],
      entryPoints: [],
    };

    // Recursively analyze files
    const analyzeDir = (dir: string) => {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          if (!entry.startsWith('.') && entry !== 'node_modules') {
            analyzeDir(fullPath);
          }
        } else if (stat.isFile()) {
          analysis.fileCount++;

          const ext = extname(entry);
          analysis.languages[ext] = (analysis.languages[ext] || 0) + 1;

          // Identify key files
          if (entry === 'index.ts' || entry === 'index.js') {
            analysis.entryPoints.push(relative(this.options.projectRoot, fullPath));
          }

          if (entry === 'package.json') {
            try {
              const pkg = JSON.parse(readFileSync(fullPath, 'utf-8'));
              analysis.dependencies = Object.keys(pkg.dependencies || {});
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    };

    analyzeDir(srcPath);

    // Identify patterns from file structure
    if (analysis.languages['.ts'] > 0 || analysis.languages['.tsx'] > 0) {
      analysis.patterns.push('TypeScript');
    }
    if (existsSync(join(this.options.projectRoot, 'tests')) ||
        existsSync(join(this.options.projectRoot, '__tests__'))) {
      analysis.patterns.push('Test-Driven Development');
      analysis.testCoverage = { hasTests: true };
    }

    return analysis;
  }

  /**
   * Define research tasks
   */
  private defineResearchTasks(): ResearchTask[] {
    return [
      {
        id: 'research-requirements',
        agentType: 'researcher',
        description: 'Research and analyze project requirements',
        topics: ['functional requirements', 'non-functional requirements', 'constraints'],
        context: [this.options.description],
      },
      {
        id: 'research-patterns',
        agentType: 'researcher',
        description: 'Research applicable design patterns',
        topics: ['design patterns', 'architecture patterns', 'best practices'],
        context: this.plan.existingCode?.patterns || [],
      },
      {
        id: 'research-technology',
        agentType: 'researcher',
        description: 'Research technology choices and alternatives',
        topics: ['technology stack', 'frameworks', 'libraries'],
        context: this.plan.existingCode?.dependencies || [],
      },
    ];
  }

  /**
   * Execute a research task (stub - would spawn agent)
   */
  private async executeResearchTask(task: ResearchTask): Promise<ResearchFinding> {
    // In real implementation, this would spawn a researcher agent
    return {
      id: `finding_${task.id}`,
      agent: task.agentType,
      topic: task.topics[0],
      summary: `Research findings for ${task.description}`,
      details: `Detailed research results for topics: ${task.topics.join(', ')}`,
      confidence: 'medium' as ConfidenceLevel,
      evidence: task.context,
      relatedFindings: [],
      kgReferences: [],
      timestamp: new Date(),
    };
  }

  /**
   * Execute specification phase
   */
  private async executeSpecificationPhase(): Promise<void> {
    logger.info('Executing specification phase');
    this.plan.currentPhase = 'specification';

    // Build specification document
    const spec: SpecificationDocument = {
      id: `spec_${this.plan.id}`,
      projectName: this.options.name,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      summary: this.options.description,
      problemStatement: this.extractProblemStatement(),
      goals: this.extractGoals(),
      requirements: this.generateRequirements(),
      features: this.generateFeatures(),
      constraints: this.extractConstraints(),
      assumptions: [],
      outOfScope: [],
      successMetrics: this.generateSuccessMetrics(),
      kgReferences: [],
    };

    this.plan.specification = spec;

    // Log decision about requirements
    this.addDecision(
      'Requirements Definition',
      `Defined ${spec.requirements.length} requirements and ${spec.features.length} features`,
      'specification',
      'high',
      'Requirements derived from research findings and project description'
    );

    logger.info('Specification phase completed', {
      requirements: spec.requirements.length,
      features: spec.features.length,
    });
  }

  /**
   * Execute pseudocode phase
   */
  private async executePseudocodePhase(): Promise<void> {
    logger.info('Executing pseudocode phase');
    this.plan.currentPhase = 'pseudocode';

    // Generate algorithm designs for each feature
    const algorithms: AlgorithmDesign[] = [];

    for (const feature of this.plan.specification?.features || []) {
      const algorithm = this.generateAlgorithmDesign(feature);
      algorithms.push(algorithm);
    }

    this.plan.algorithms = algorithms;

    logger.info('Pseudocode phase completed', {
      algorithms: algorithms.length,
    });
  }

  /**
   * Execute architecture phase
   */
  private async executeArchitecturePhase(): Promise<void> {
    logger.info('Executing architecture phase');
    this.plan.currentPhase = 'architecture';

    // Build architecture document
    const arch: ArchitectureDocument = {
      id: `arch_${this.plan.id}`,
      version: '1.0.0',
      createdAt: new Date(),
      overview: this.generateArchitectureOverview(),
      patterns: this.identifyArchitecturePatterns(),
      components: this.generateComponents(),
      decisions: [],
      dataFlow: this.describeDataFlow(),
      securityConsiderations: this.identifySecurityConsiderations(),
      scalabilityConsiderations: [],
      diagrams: [],
    };

    this.plan.architecture = arch;

    // Log architecture decision
    this.addDecision(
      'Architecture Design',
      `Defined ${arch.components.length} components using ${arch.patterns.join(', ')} patterns`,
      'architecture',
      'medium',
      'Architecture designed based on requirements and existing patterns',
      ['Microservices', 'Monolith', 'Modular monolith']
    );

    logger.info('Architecture phase completed', {
      components: arch.components.length,
      patterns: arch.patterns.length,
    });
  }

  /**
   * Execute refinement phase (task breakdown)
   */
  private async executeRefinementPhase(): Promise<void> {
    logger.info('Executing refinement phase');
    this.plan.currentPhase = 'refinement';

    // Generate tasks from features and components
    const tasks: SPARCTask[] = [];

    // Research tasks
    tasks.push(this.createTask(
      'Research and Analysis',
      'Comprehensive research on project requirements and patterns',
      'specification',
      'research',
      'high',
      4
    ));

    // Implementation tasks for each component
    for (const component of this.plan.architecture?.components || []) {
      tasks.push(this.createTask(
        `Implement ${component.name}`,
        `Implement the ${component.name} component: ${component.description}`,
        'refinement',
        'implementation',
        this.getComponentPriority(component),
        this.estimateComponentHours(component)
      ));
    }

    // Testing tasks
    tasks.push(this.createTask(
      'Unit Testing',
      'Create comprehensive unit tests for all components',
      'refinement',
      'testing',
      'high',
      8
    ));

    tasks.push(this.createTask(
      'Integration Testing',
      'Create integration tests for component interactions',
      'refinement',
      'testing',
      'medium',
      6
    ));

    // Documentation tasks
    tasks.push(this.createTask(
      'API Documentation',
      'Document all public APIs and interfaces',
      'completion',
      'documentation',
      'medium',
      4
    ));

    this.plan.tasks = tasks;

    // Calculate parallel groups and critical path
    this.calculateParallelGroups();
    this.calculateCriticalPath();

    logger.info('Refinement phase completed', {
      tasks: tasks.length,
      parallelGroups: this.plan.parallelGroups.length,
    });
  }

  /**
   * Execute review phase
   */
  private async executeReviewPhase(): Promise<ReviewResult> {
    logger.info('Executing review phase');
    this.plan.currentPhase = 'completion';

    // Sync decision log
    this.plan.decisionLog = this.decisionLog.getLog();

    // Create review process
    const reviewProcess = createReviewProcess({
      plan: this.plan,
      passes: this.options.reviewPasses,
      autoFix: false,
      strictMode: false,
    });

    // Execute review
    const result = await reviewProcess.executeReview();

    logger.info('Review phase completed', {
      status: result.overallStatus,
      totalFindings: result.totalFindings,
      criticalFindings: result.criticalFindings,
    });

    return result;
  }

  /**
   * Add a decision to the log
   */
  private addDecision(
    title: string,
    description: string,
    phase: SPARCPhase,
    confidence: ConfidenceLevel,
    rationale: string,
    alternatives?: string[]
  ): void {
    const decision = this.decisionLog.addDecision({
      title,
      description,
      phase,
      confidence,
      rationale,
      alternatives,
      decidedBy: 'sparc-planner',
    });

    // Build consensus if needed
    if (this.options.autoConsensus && ConsensusBuilder.needsConsensus(confidence)) {
      logger.info('Building consensus for low-confidence decision', {
        decisionId: decision.id,
        confidence,
      });
      // In real implementation, would spawn agents for consensus
    }
  }

  /**
   * Create a SPARC task
   */
  private createTask(
    name: string,
    description: string,
    phase: SPARCPhase,
    type: SPARCTask['type'],
    priority: SPARCTask['priority'],
    estimatedHours: number
  ): SPARCTask {
    return {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      phase,
      type,
      priority,
      estimatedHours,
      dependencies: [],
      parallelizable: type === 'implementation' || type === 'testing',
      status: 'pending',
      contextLinks: [],
      kgReferences: [],
    };
  }

  /**
   * Calculate parallel task groups
   */
  private calculateParallelGroups(): void {
    const parallelizable = this.plan.tasks.filter(t => t.parallelizable);

    // Group by phase
    const groups: string[][] = [];
    const phases = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];

    for (const phase of phases) {
      const phaseTasks = parallelizable.filter(t => t.phase === phase);
      if (phaseTasks.length > 0) {
        groups.push(phaseTasks.map(t => t.id));
      }
    }

    this.plan.parallelGroups = groups;
  }

  /**
   * Calculate critical path
   */
  private calculateCriticalPath(): void {
    // Simple critical path: high priority tasks in order
    const critical = this.plan.tasks
      .filter(t => t.priority === 'critical' || t.priority === 'high')
      .sort((a, b) => {
        const phaseOrder = ['specification', 'pseudocode', 'architecture', 'refinement', 'completion'];
        return phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
      })
      .map(t => t.id);

    this.plan.criticalPath = critical;
    this.plan.executionOrder = this.plan.tasks.map(t => t.id);
  }

  /**
   * Update plan statistics
   */
  private updateStatistics(): void {
    this.plan.statistics = {
      totalTasks: this.plan.tasks.length,
      completedTasks: this.plan.tasks.filter(t => t.status === 'completed').length,
      parallelizableTasks: this.plan.tasks.filter(t => t.parallelizable).length,
      estimatedHours: this.plan.tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
      researchFindings: this.plan.researchFindings.length,
      decisions: this.decisionLog.getDecisions().length,
      kgNodes: this.plan.tasks.reduce((sum, t) => sum + (t.kgReferences?.length || 0), 0),
    };
    this.plan.updatedAt = new Date();
  }

  /**
   * Save plan to disk
   */
  savePlan(): void {
    const dir = this.options.outputDir;
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Save JSON plan
    const planPath = join(dir, 'sparc-plan.json');
    writeFileSync(planPath, JSON.stringify(this.plan, null, 2));

    // Save markdown summary
    const mdPath = join(dir, 'sparc-plan.md');
    writeFileSync(mdPath, this.generateMarkdownSummary());

    // Save decision log
    this.decisionLog.save();
    this.decisionLog.saveMarkdown();

    logger.info('Plan saved', { dir });
  }

  /**
   * Generate markdown summary
   */
  private generateMarkdownSummary(): string {
    const lines: string[] = [
      `# SPARC Plan: ${this.plan.name}`,
      '',
      `**Status:** ${this.plan.status}`,
      `**Version:** ${this.plan.version}`,
      `**Created:** ${this.plan.createdAt.toISOString()}`,
      '',
      '## Summary',
      '',
      this.plan.description,
      '',
      '## Statistics',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Tasks | ${this.plan.statistics.totalTasks} |`,
      `| Parallelizable | ${this.plan.statistics.parallelizableTasks} |`,
      `| Estimated Hours | ${this.plan.statistics.estimatedHours} |`,
      `| Research Findings | ${this.plan.statistics.researchFindings} |`,
      `| Decisions | ${this.plan.statistics.decisions} |`,
      '',
    ];

    // Specification summary
    if (this.plan.specification) {
      lines.push('## Specification');
      lines.push('');
      lines.push(`- **Requirements:** ${this.plan.specification.requirements.length}`);
      lines.push(`- **Features:** ${this.plan.specification.features.length}`);
      lines.push('');
    }

    // Architecture summary
    if (this.plan.architecture) {
      lines.push('## Architecture');
      lines.push('');
      lines.push(`- **Components:** ${this.plan.architecture.components.length}`);
      lines.push(`- **Patterns:** ${this.plan.architecture.patterns.join(', ')}`);
      lines.push('');
    }

    // Tasks
    lines.push('## Tasks');
    lines.push('');
    for (const task of this.plan.tasks) {
      lines.push(`### ${task.name}`);
      lines.push('');
      lines.push(`- **Phase:** ${task.phase}`);
      lines.push(`- **Type:** ${task.type}`);
      lines.push(`- **Priority:** ${task.priority}`);
      lines.push(`- **Estimated:** ${task.estimatedHours}h`);
      lines.push(`- **Parallelizable:** ${task.parallelizable ? 'Yes' : 'No'}`);
      lines.push('');
      lines.push(task.description);
      lines.push('');
    }

    // Review result
    if (this.plan.reviewResult) {
      lines.push('## Review Result');
      lines.push('');
      lines.push(`- **Status:** ${this.plan.reviewResult.overallStatus}`);
      lines.push(`- **Total Findings:** ${this.plan.reviewResult.totalFindings}`);
      lines.push(`- **Critical Findings:** ${this.plan.reviewResult.criticalFindings}`);
      lines.push('');

      if (this.plan.reviewResult.recommendations.length > 0) {
        lines.push('### Recommendations');
        lines.push('');
        for (const rec of this.plan.reviewResult.recommendations) {
          lines.push(`- ${rec}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // Helper methods for content generation

  private extractProblemStatement(): string {
    return `Problem to solve: ${this.options.description}`;
  }

  private extractGoals(): string[] {
    return [
      'Implement all specified features',
      'Ensure code quality and maintainability',
      'Provide comprehensive documentation',
      'Enable parallel development where possible',
    ];
  }

  private generateRequirements(): Requirement[] {
    // Generate basic requirements from description
    return [
      {
        id: 'req-001',
        type: 'functional',
        description: 'Core functionality as described',
        priority: 'must-have',
        source: 'User request',
        acceptanceCriteria: ['Feature works as specified'],
        relatedRequirements: [],
      },
      {
        id: 'req-002',
        type: 'non-functional',
        description: 'Code must be well-documented',
        priority: 'should-have',
        source: 'Best practices',
        acceptanceCriteria: ['API documentation exists'],
        relatedRequirements: [],
      },
      {
        id: 'req-003',
        type: 'non-functional',
        description: 'Test coverage must be adequate',
        priority: 'should-have',
        source: 'Best practices',
        acceptanceCriteria: ['Unit tests exist for core functionality'],
        relatedRequirements: [],
      },
    ];
  }

  private generateFeatures(): Feature[] {
    return [
      {
        id: 'feat-001',
        name: 'Core Implementation',
        description: 'Main feature implementation',
        userStories: [`As a user, I want ${this.options.description}`],
        requirements: ['req-001'],
        complexity: 'medium',
        dependencies: [],
        parallelizable: true,
      },
    ];
  }

  private extractConstraints(): string[] {
    return [
      'Must follow existing code patterns if present',
      'Must maintain backwards compatibility',
    ];
  }

  private generateSuccessMetrics(): string[] {
    return [
      'All tests pass',
      'Documentation is complete',
      'Code review approved',
    ];
  }

  private generateAlgorithmDesign(feature: Feature): AlgorithmDesign {
    return {
      id: `algo_${feature.id}`,
      name: `${feature.name} Algorithm`,
      purpose: feature.description,
      steps: [
        {
          step: 1,
          description: 'Initialize',
          pseudocode: '// Initialize component',
          inputs: [],
          outputs: [],
        },
        {
          step: 2,
          description: 'Process',
          pseudocode: '// Process input',
          inputs: ['input'],
          outputs: ['result'],
        },
        {
          step: 3,
          description: 'Return',
          pseudocode: '// Return result',
          inputs: ['result'],
          outputs: ['output'],
        },
      ],
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      edgeCases: ['Empty input', 'Invalid input'],
      relatedFeatures: [feature.id],
    };
  }

  private generateArchitectureOverview(): string {
    return `Architecture for ${this.options.name}: ${this.options.description}`;
  }

  private identifyArchitecturePatterns(): string[] {
    const patterns: string[] = ['Modular'];

    if (this.plan.existingCode?.patterns.includes('TypeScript')) {
      patterns.push('Type-Safe');
    }
    if (this.plan.existingCode?.patterns.includes('Test-Driven Development')) {
      patterns.push('TDD');
    }

    return patterns;
  }

  private generateComponents(): ArchitectureComponent[] {
    return [
      {
        id: 'comp-core',
        name: 'Core Module',
        type: 'module',
        description: 'Core functionality module',
        responsibilities: ['Main feature implementation'],
        interfaces: [],
        dependencies: [],
        technologies: ['TypeScript'],
      },
      {
        id: 'comp-api',
        name: 'API Layer',
        type: 'api',
        description: 'Public API interface',
        responsibilities: ['Expose public API'],
        interfaces: [],
        dependencies: ['comp-core'],
        technologies: ['TypeScript'],
      },
    ];
  }

  private describeDataFlow(): string {
    return 'Input -> API Layer -> Core Module -> Output';
  }

  private identifySecurityConsiderations(): string[] {
    return [
      'Input validation',
      'Error handling',
    ];
  }

  private getComponentPriority(component: ArchitectureComponent): SPARCTask['priority'] {
    if (component.dependencies.length === 0) return 'high';
    return 'medium';
  }

  private estimateComponentHours(component: ArchitectureComponent): number {
    const base = 4;
    const depFactor = component.dependencies.length * 2;
    return base + depFactor;
  }

  /**
   * Get the current plan
   */
  getPlan(): SPARCPlan {
    return this.plan;
  }

  /**
   * Get decision log manager
   */
  getDecisionLog(): DecisionLogManager {
    return this.decisionLog;
  }
}

/**
 * Create a SPARC planner
 */
export function createSPARCPlanner(options: SPARCPlannerOptions): SPARCPlanner {
  return new SPARCPlanner(options);
}
