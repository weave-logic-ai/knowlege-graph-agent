/**
 * Architect Agent
 *
 * Specialized agent for architecture analysis, design decisions, and dependency analysis.
 * Extends BaseAgent with system design capabilities and knowledge graph integration.
 *
 * @module agents/architect-agent
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseAgent } from './base-agent.js';
import {
  AgentType,
  type AgentTask,
  type AgentResult,
  type ArchitectAgentConfig,
  type ResultArtifact,
} from './types.js';
import { KnowledgeGraphManager } from '../core/graph.js';
import type { KnowledgeNode } from '../core/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Architecture pattern
 */
export type ArchitecturePattern =
  | 'mvc'
  | 'mvvm'
  | 'clean-architecture'
  | 'hexagonal'
  | 'microservices'
  | 'monolith'
  | 'serverless'
  | 'event-driven'
  | 'layered'
  | 'modular';

/**
 * Component type
 */
export type ComponentType =
  | 'service'
  | 'controller'
  | 'repository'
  | 'model'
  | 'view'
  | 'utility'
  | 'middleware'
  | 'handler'
  | 'factory'
  | 'adapter';

/**
 * Architecture component
 */
export interface ArchitectureComponent {
  /** Component name */
  name: string;
  /** Component type */
  type: ComponentType;
  /** File path */
  path: string;
  /** Component description */
  description?: string;
  /** Dependencies (other components) */
  dependencies: string[];
  /** Dependents (components that depend on this) */
  dependents: string[];
  /** Exports provided */
  exports: string[];
  /** Lines of code */
  linesOfCode: number;
  /** Complexity score */
  complexity: number;
}

/**
 * Architecture layer
 */
export interface ArchitectureLayer {
  /** Layer name */
  name: string;
  /** Layer level (0 = highest, like UI) */
  level: number;
  /** Components in this layer */
  components: string[];
  /** Allowed dependencies (layer names) */
  allowedDependencies: string[];
  /** Actual dependencies found */
  actualDependencies: string[];
  /** Violations (dependencies to wrong layers) */
  violations: string[];
}

/**
 * Dependency graph node
 */
export interface DependencyNode {
  /** Node identifier */
  id: string;
  /** Node label */
  label: string;
  /** Node type */
  type: ComponentType;
  /** Outgoing edges (dependencies) */
  outgoing: string[];
  /** Incoming edges (dependents) */
  incoming: string[];
  /** Metrics */
  metrics: {
    fanIn: number;
    fanOut: number;
    instability: number;
    abstractness: number;
  };
}

/**
 * Dependency analysis result
 */
export interface DependencyAnalysis {
  /** Dependency graph */
  graph: DependencyNode[];
  /** Circular dependencies */
  cycles: string[][];
  /** Orphan modules (no deps or dependents) */
  orphans: string[];
  /** Hub modules (many dependencies) */
  hubs: Array<{ module: string; connections: number }>;
  /** Recommendations */
  recommendations: string[];
}

/**
 * Design decision
 */
export interface DesignDecision {
  /** Decision title */
  title: string;
  /** Decision category */
  category: 'structure' | 'pattern' | 'technology' | 'integration' | 'security';
  /** Decision description */
  description: string;
  /** Rationale */
  rationale: string;
  /** Pros */
  pros: string[];
  /** Cons */
  cons: string[];
  /** Alternatives considered */
  alternatives?: string[];
  /** Priority */
  priority: 'low' | 'medium' | 'high';
}

/**
 * Architecture analysis result
 */
export interface ArchitectureAnalysis {
  /** Project name */
  projectName: string;
  /** Detected patterns */
  patterns: ArchitecturePattern[];
  /** Architecture layers */
  layers: ArchitectureLayer[];
  /** Components */
  components: ArchitectureComponent[];
  /** Dependency analysis */
  dependencies: DependencyAnalysis;
  /** Design decisions/recommendations */
  decisions: DesignDecision[];
  /** Overall health score (0-100) */
  healthScore: number;
  /** Analysis timestamp */
  timestamp: Date;
}

/**
 * Design suggestion
 */
export interface DesignSuggestion {
  /** Suggestion type */
  type: 'refactor' | 'extract' | 'merge' | 'introduce' | 'remove';
  /** Target component/module */
  target: string;
  /** Description */
  description: string;
  /** Priority */
  priority: 'low' | 'medium' | 'high';
  /** Expected benefit */
  benefit: string;
  /** Effort estimate */
  effort: 'low' | 'medium' | 'high';
}

/**
 * Architect task type
 */
export type ArchitectTaskType = 'analyze' | 'design' | 'dependencies' | 'suggest';

// ============================================================================
// Architect Agent
// ============================================================================

/**
 * Architect Agent
 *
 * Capabilities:
 * - Architecture analysis and pattern detection
 * - Design decision recommendations
 * - Dependency analysis and visualization
 * - Layer validation
 *
 * @example
 * ```typescript
 * const architect = new ArchitectAgent({
 *   name: 'architect-agent',
 *   type: AgentType.ARCHITECT,
 * });
 *
 * const result = await architect.execute({
 *   id: 'task-1',
 *   description: 'Analyze project architecture',
 *   priority: TaskPriority.MEDIUM,
 *   input: {
 *     data: {
 *       projectRoot: '/path/to/project'
 *     }
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export class ArchitectAgent extends BaseAgent {
  /** File patterns to analyze */
  private readonly codePatterns = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs'];

  /** Knowledge graph reference */
  private knowledgeGraph: KnowledgeGraphManager | null = null;

  /** Layer definitions for common architectures */
  private readonly layerDefinitions: Record<string, string[]> = {
    presentation: ['components', 'views', 'pages', 'ui'],
    application: ['services', 'usecases', 'handlers', 'controllers'],
    domain: ['models', 'entities', 'domain', 'core'],
    infrastructure: ['repositories', 'adapters', 'database', 'api'],
    shared: ['utils', 'helpers', 'common', 'shared', 'lib'],
  };

  constructor(config: Partial<ArchitectAgentConfig> & { name: string }) {
    super({
      type: AgentType.ARCHITECT,
      taskTimeout: 300000, // 5 minutes for large projects
      capabilities: ['architecture-analysis', 'design', 'dependency-analysis'],
      ...config,
    });
  }

  // ==========================================================================
  // Knowledge Graph Integration
  // ==========================================================================

  /**
   * Set knowledge graph for context-aware analysis
   */
  setKnowledgeGraph(graph: KnowledgeGraphManager): void {
    this.knowledgeGraph = graph;
    this.logger.debug('Knowledge graph attached', {
      nodeCount: graph.getMetadata().nodeCount,
    });
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  /**
   * Execute architect task
   */
  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    const taskType = (task.input?.parameters?.taskType as ArchitectTaskType) || 'analyze';

    switch (taskType) {
      case 'analyze':
        return this.handleAnalyzeTask(task, startTime);
      case 'design':
        return this.handleDesignTask(task, startTime);
      case 'dependencies':
        return this.handleDependenciesTask(task, startTime);
      case 'suggest':
        return this.handleSuggestTask(task, startTime);
      default:
        return this.createErrorResult(
          'INVALID_TASK_TYPE',
          `Unknown task type: ${taskType}`,
          startTime
        );
    }
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * Analyze project architecture
   */
  async analyzeArchitecture(projectRoot: string): Promise<ArchitectureAnalysis> {
    this.logger.info('Analyzing architecture', { root: projectRoot });

    // Discover components
    const components = await this.discoverComponents(projectRoot);

    // Detect patterns
    const patterns = this.detectPatterns(components, projectRoot);

    // Identify layers
    const layers = this.identifyLayers(components);

    // Analyze dependencies
    const dependencies = this.analyzeDependencies(components);

    // Generate design decisions
    const decisions = this.generateDesignDecisions(components, layers, dependencies);

    // Calculate health score
    const healthScore = this.calculateHealthScore(components, layers, dependencies);

    return {
      projectName: path.basename(projectRoot),
      patterns,
      layers,
      components,
      dependencies,
      decisions,
      healthScore,
      timestamp: new Date(),
    };
  }

  /**
   * Suggest design improvements
   */
  async suggestDesign(projectRoot: string): Promise<DesignSuggestion[]> {
    this.logger.info('Generating design suggestions', { root: projectRoot });

    const analysis = await this.analyzeArchitecture(projectRoot);
    const suggestions: DesignSuggestion[] = [];

    // Check for circular dependencies
    for (const cycle of analysis.dependencies.cycles) {
      suggestions.push({
        type: 'refactor',
        target: cycle.join(' -> '),
        description: 'Break circular dependency',
        priority: 'high',
        benefit: 'Improves testability and maintainability',
        effort: 'medium',
      });
    }

    // Check for hub components (too many dependencies)
    for (const hub of analysis.dependencies.hubs) {
      if (hub.connections > 10) {
        suggestions.push({
          type: 'extract',
          target: hub.module,
          description: `Split ${hub.module} - too many connections (${hub.connections})`,
          priority: hub.connections > 20 ? 'high' : 'medium',
          benefit: 'Reduces coupling and improves modularity',
          effort: 'high',
        });
      }
    }

    // Check for layer violations
    for (const layer of analysis.layers) {
      if (layer.violations.length > 0) {
        suggestions.push({
          type: 'refactor',
          target: layer.name,
          description: `Fix ${layer.violations.length} layer violation(s) in ${layer.name}`,
          priority: 'high',
          benefit: 'Enforces clean architecture boundaries',
          effort: 'medium',
        });
      }
    }

    // Check for orphan components
    for (const orphan of analysis.dependencies.orphans) {
      suggestions.push({
        type: 'remove',
        target: orphan,
        description: `Consider removing unused module: ${orphan}`,
        priority: 'low',
        benefit: 'Reduces codebase size and maintenance burden',
        effort: 'low',
      });
    }

    // Check component complexity
    for (const component of analysis.components) {
      if (component.complexity > 30) {
        suggestions.push({
          type: 'extract',
          target: component.name,
          description: `Reduce complexity of ${component.name} (${component.complexity})`,
          priority: component.complexity > 50 ? 'high' : 'medium',
          benefit: 'Improves readability and testability',
          effort: 'medium',
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Map dependencies between modules
   */
  async mapDependencies(projectRoot: string): Promise<DependencyAnalysis> {
    this.logger.info('Mapping dependencies', { root: projectRoot });

    const components = await this.discoverComponents(projectRoot);
    return this.analyzeDependencies(components);
  }

  // ==========================================================================
  // Private Task Handlers
  // ==========================================================================

  private async handleAnalyzeTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<ArchitectureAnalysis>> {
    const input = task.input?.data as { projectRoot: string } | undefined;

    if (!input?.projectRoot) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Project root is required for architecture analysis',
        startTime
      ) as AgentResult<ArchitectureAnalysis>;
    }

    try {
      const analysis = await this.analyzeArchitecture(input.projectRoot);
      const artifacts: ResultArtifact[] = [{
        type: 'report',
        name: 'architecture-analysis',
        content: JSON.stringify(analysis, null, 2),
        mimeType: 'application/json',
      }];

      return this.createSuccessResult(analysis, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('ANALYSIS_ERROR', `Architecture analysis failed: ${message}`, startTime) as AgentResult<ArchitectureAnalysis>;
    }
  }

  private async handleDesignTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<DesignDecision[]>> {
    const input = task.input?.data as { projectRoot: string } | undefined;

    if (!input?.projectRoot) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Project root is required for design analysis',
        startTime
      ) as AgentResult<DesignDecision[]>;
    }

    try {
      const analysis = await this.analyzeArchitecture(input.projectRoot);
      return this.createSuccessResult(analysis.decisions, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('DESIGN_ERROR', `Design analysis failed: ${message}`, startTime) as AgentResult<DesignDecision[]>;
    }
  }

  private async handleDependenciesTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<DependencyAnalysis>> {
    const input = task.input?.data as { projectRoot: string } | undefined;

    if (!input?.projectRoot) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Project root is required for dependency analysis',
        startTime
      ) as AgentResult<DependencyAnalysis>;
    }

    try {
      const analysis = await this.mapDependencies(input.projectRoot);
      return this.createSuccessResult(analysis, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('DEPENDENCY_ERROR', `Dependency analysis failed: ${message}`, startTime) as AgentResult<DependencyAnalysis>;
    }
  }

  private async handleSuggestTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<DesignSuggestion[]>> {
    const input = task.input?.data as { projectRoot: string } | undefined;

    if (!input?.projectRoot) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Project root is required for design suggestions',
        startTime
      ) as AgentResult<DesignSuggestion[]>;
    }

    try {
      const suggestions = await this.suggestDesign(input.projectRoot);
      return this.createSuccessResult(suggestions, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult('SUGGEST_ERROR', `Design suggestion failed: ${message}`, startTime) as AgentResult<DesignSuggestion[]>;
    }
  }

  // ==========================================================================
  // Component Discovery
  // ==========================================================================

  private async discoverComponents(projectRoot: string): Promise<ArchitectureComponent[]> {
    const components: ArchitectureComponent[] = [];
    const files = await this.findFiles(projectRoot);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(projectRoot, file);
        const component = this.analyzeComponent(content, relativePath);
        components.push(component);
      } catch (error) {
        this.logger.warn(`Failed to analyze ${file}`, { error });
      }
    }

    // Resolve dependencies to component names
    this.resolveDependencies(components);

    return components;
  }

  private analyzeComponent(content: string, filePath: string): ArchitectureComponent {
    const name = path.basename(filePath, path.extname(filePath));
    const type = this.inferComponentType(filePath, content);
    const dependencies = this.extractDependencies(content);
    const exports = this.extractExports(content);
    const linesOfCode = content.split('\n').filter(l => l.trim().length > 0).length;
    const complexity = this.calculateComplexity(content);

    return {
      name,
      type,
      path: filePath,
      dependencies,
      dependents: [], // Filled later
      exports,
      linesOfCode,
      complexity,
    };
  }

  private inferComponentType(filePath: string, content: string): ComponentType {
    const lowerPath = filePath.toLowerCase();
    const lowerContent = content.toLowerCase();

    if (lowerPath.includes('service') || lowerPath.includes('services')) return 'service';
    if (lowerPath.includes('controller') || lowerPath.includes('controllers')) return 'controller';
    if (lowerPath.includes('repository') || lowerPath.includes('repositories')) return 'repository';
    if (lowerPath.includes('model') || lowerPath.includes('models')) return 'model';
    if (lowerPath.includes('view') || lowerPath.includes('component')) return 'view';
    if (lowerPath.includes('util') || lowerPath.includes('helper')) return 'utility';
    if (lowerPath.includes('middleware')) return 'middleware';
    if (lowerPath.includes('handler')) return 'handler';
    if (lowerPath.includes('factory')) return 'factory';
    if (lowerPath.includes('adapter')) return 'adapter';

    // Infer from content
    if (lowerContent.includes('class') && lowerContent.includes('service')) return 'service';
    if (lowerContent.includes('@controller') || lowerContent.includes('router')) return 'controller';
    if (lowerContent.includes('repository') || lowerContent.includes('findby')) return 'repository';
    if (lowerContent.includes('interface') && lowerContent.includes('model')) return 'model';

    return 'utility';
  }

  private resolveDependencies(components: ArchitectureComponent[]): void {
    const componentMap = new Map(components.map(c => [c.path, c]));
    const nameMap = new Map(components.map(c => [c.name, c]));

    for (const component of components) {
      for (const dep of component.dependencies) {
        // Try to find the dependency by path or name
        const depPath = this.resolveDependencyPath(component.path, dep);
        const depComponent = componentMap.get(depPath) || nameMap.get(dep);

        if (depComponent && depComponent !== component) {
          // Add to dependents list
          if (!depComponent.dependents.includes(component.name)) {
            depComponent.dependents.push(component.name);
          }
        }
      }
    }
  }

  private resolveDependencyPath(fromPath: string, dep: string): string {
    if (dep.startsWith('.')) {
      const dir = path.dirname(fromPath);
      const resolved = path.normalize(path.join(dir, dep));
      // Add extension if missing
      for (const ext of this.codePatterns) {
        if (resolved.endsWith(ext)) return resolved;
      }
      return resolved + '.ts';
    }
    return dep;
  }

  // ==========================================================================
  // Pattern Detection
  // ==========================================================================

  private detectPatterns(
    components: ArchitectureComponent[],
    projectRoot: string
  ): ArchitecturePattern[] {
    const patterns: ArchitecturePattern[] = [];

    // Check for MVC
    const hasControllers = components.some(c => c.type === 'controller');
    const hasModels = components.some(c => c.type === 'model');
    const hasViews = components.some(c => c.type === 'view');

    if (hasControllers && hasModels && hasViews) {
      patterns.push('mvc');
    }

    // Check for layered architecture
    const layers = this.identifyLayers(components);
    if (layers.length >= 3) {
      patterns.push('layered');
    }

    // Check for clean/hexagonal architecture
    const hasAdapters = components.some(c => c.type === 'adapter');
    const hasRepositories = components.some(c => c.type === 'repository');
    if (hasAdapters && hasRepositories && layers.length >= 3) {
      patterns.push('clean-architecture');
    }

    // Check for modular architecture
    const directories = new Set(components.map(c => path.dirname(c.path)));
    if (directories.size > 5) {
      patterns.push('modular');
    }

    // Check for event-driven patterns
    const hasEvents = components.some(c =>
      c.exports.some(e => e.toLowerCase().includes('event') || e.toLowerCase().includes('emit'))
    );
    if (hasEvents) {
      patterns.push('event-driven');
    }

    return patterns.length > 0 ? patterns : ['monolith'];
  }

  // ==========================================================================
  // Layer Analysis
  // ==========================================================================

  private identifyLayers(components: ArchitectureComponent[]): ArchitectureLayer[] {
    const layers: ArchitectureLayer[] = [];
    const layerComponents: Record<string, string[]> = {};

    // Categorize components into layers
    for (const component of components) {
      const layer = this.inferLayer(component.path);
      if (!layerComponents[layer]) {
        layerComponents[layer] = [];
      }
      layerComponents[layer].push(component.name);
    }

    // Create layer objects
    const layerOrder = ['presentation', 'application', 'domain', 'infrastructure', 'shared'];

    for (let i = 0; i < layerOrder.length; i++) {
      const layerName = layerOrder[i];
      if (layerComponents[layerName] && layerComponents[layerName].length > 0) {
        const allowedDeps = layerOrder.slice(i + 1);
        const actualDeps = this.findLayerDependencies(
          components,
          layerComponents[layerName],
          layerComponents
        );
        const violations = actualDeps.filter(
          d => !allowedDeps.includes(d) && d !== layerName
        );

        layers.push({
          name: layerName,
          level: i,
          components: layerComponents[layerName],
          allowedDependencies: allowedDeps,
          actualDependencies: actualDeps,
          violations,
        });
      }
    }

    return layers;
  }

  private inferLayer(filePath: string): string {
    const lowerPath = filePath.toLowerCase();

    for (const [layer, patterns] of Object.entries(this.layerDefinitions)) {
      for (const pattern of patterns) {
        if (lowerPath.includes(pattern)) {
          return layer;
        }
      }
    }

    return 'shared';
  }

  private findLayerDependencies(
    components: ArchitectureComponent[],
    layerComponentNames: string[],
    allLayerComponents: Record<string, string[]>
  ): string[] {
    const dependencies = new Set<string>();

    for (const componentName of layerComponentNames) {
      const component = components.find(c => c.name === componentName);
      if (!component) continue;

      for (const dep of component.dependencies) {
        // Find which layer this dependency belongs to
        for (const [layer, componentNames] of Object.entries(allLayerComponents)) {
          if (componentNames.includes(dep)) {
            dependencies.add(layer);
          }
        }
      }
    }

    return [...dependencies];
  }

  // ==========================================================================
  // Dependency Analysis
  // ==========================================================================

  private analyzeDependencies(components: ArchitectureComponent[]): DependencyAnalysis {
    const graph = this.buildDependencyGraph(components);
    const cycles = this.findCycles(components);
    const orphans = this.findOrphans(components);
    const hubs = this.findHubs(components);
    const recommendations = this.generateDependencyRecommendations(cycles, orphans, hubs);

    return {
      graph,
      cycles,
      orphans,
      hubs,
      recommendations,
    };
  }

  private buildDependencyGraph(components: ArchitectureComponent[]): DependencyNode[] {
    return components.map(c => {
      const fanIn = c.dependents.length;
      const fanOut = c.dependencies.length;
      const instability = fanOut / (fanIn + fanOut) || 0;

      return {
        id: c.name,
        label: c.name,
        type: c.type,
        outgoing: c.dependencies,
        incoming: c.dependents,
        metrics: {
          fanIn,
          fanOut,
          instability: Math.round(instability * 100) / 100,
          abstractness: 0, // Would require interface detection
        },
      };
    });
  }

  private findCycles(components: ArchitectureComponent[]): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (componentName: string): void => {
      visited.add(componentName);
      recursionStack.add(componentName);
      path.push(componentName);

      const component = components.find(c => c.name === componentName);
      if (component) {
        for (const dep of component.dependencies) {
          const depComponent = components.find(c => c.name === dep);
          if (!depComponent) continue;

          if (!visited.has(dep)) {
            dfs(dep);
          } else if (recursionStack.has(dep)) {
            // Found a cycle
            const cycleStart = path.indexOf(dep);
            if (cycleStart !== -1) {
              cycles.push([...path.slice(cycleStart), dep]);
            }
          }
        }
      }

      path.pop();
      recursionStack.delete(componentName);
    };

    for (const component of components) {
      if (!visited.has(component.name)) {
        dfs(component.name);
      }
    }

    return cycles;
  }

  private findOrphans(components: ArchitectureComponent[]): string[] {
    return components
      .filter(c => c.dependencies.length === 0 && c.dependents.length === 0)
      .map(c => c.name);
  }

  private findHubs(components: ArchitectureComponent[]): Array<{ module: string; connections: number }> {
    return components
      .map(c => ({
        module: c.name,
        connections: c.dependencies.length + c.dependents.length,
      }))
      .filter(h => h.connections > 5)
      .sort((a, b) => b.connections - a.connections);
  }

  private generateDependencyRecommendations(
    cycles: string[][],
    orphans: string[],
    hubs: Array<{ module: string; connections: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (cycles.length > 0) {
      recommendations.push(
        `Found ${cycles.length} circular dependency(s) - consider using dependency inversion`
      );
    }

    if (orphans.length > 0) {
      recommendations.push(
        `${orphans.length} orphan module(s) detected - consider removing or integrating`
      );
    }

    const majorHubs = hubs.filter(h => h.connections > 10);
    if (majorHubs.length > 0) {
      recommendations.push(
        `${majorHubs.length} highly-connected module(s) - consider splitting into smaller modules`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Dependency structure looks healthy');
    }

    return recommendations;
  }

  // ==========================================================================
  // Design Decisions
  // ==========================================================================

  private generateDesignDecisions(
    components: ArchitectureComponent[],
    layers: ArchitectureLayer[],
    dependencies: DependencyAnalysis
  ): DesignDecision[] {
    const decisions: DesignDecision[] = [];

    // Check layer violations
    const violatingLayers = layers.filter(l => l.violations.length > 0);
    if (violatingLayers.length > 0) {
      decisions.push({
        title: 'Enforce Layer Boundaries',
        category: 'structure',
        description: 'Some layers have dependencies that violate the intended architecture',
        rationale: 'Clean separation of concerns improves maintainability and testability',
        pros: ['Better modularity', 'Easier testing', 'Clearer responsibilities'],
        cons: ['Initial refactoring effort', 'May require interface introduction'],
        priority: 'high',
      });
    }

    // Check for circular dependencies
    if (dependencies.cycles.length > 0) {
      decisions.push({
        title: 'Break Circular Dependencies',
        category: 'structure',
        description: `Found ${dependencies.cycles.length} circular dependency chain(s)`,
        rationale: 'Circular dependencies make code harder to understand and test',
        pros: ['Improved testability', 'Clearer module boundaries', 'Easier refactoring'],
        cons: ['May require interface extraction', 'Some restructuring needed'],
        alternatives: ['Dependency injection', 'Event-driven communication'],
        priority: 'high',
      });
    }

    // Check component complexity
    const complexComponents = components.filter(c => c.complexity > 30);
    if (complexComponents.length > 0) {
      decisions.push({
        title: 'Reduce Component Complexity',
        category: 'pattern',
        description: `${complexComponents.length} component(s) have high complexity`,
        rationale: 'Lower complexity improves readability and reduces bug risk',
        pros: ['Better maintainability', 'Easier testing', 'Reduced cognitive load'],
        cons: ['May increase number of files', 'Refactoring effort'],
        alternatives: ['Extract methods', 'Apply design patterns', 'Split responsibilities'],
        priority: 'medium',
      });
    }

    // Check for proper service layer
    const services = components.filter(c => c.type === 'service');
    if (services.length === 0 && components.length > 10) {
      decisions.push({
        title: 'Introduce Service Layer',
        category: 'pattern',
        description: 'Consider introducing a service layer for business logic',
        rationale: 'Service layer provides clean separation between UI and business logic',
        pros: ['Reusable business logic', 'Better testability', 'Cleaner controllers'],
        cons: ['Additional abstraction layer', 'More files to manage'],
        priority: 'medium',
      });
    }

    return decisions;
  }

  // ==========================================================================
  // Health Score
  // ==========================================================================

  private calculateHealthScore(
    components: ArchitectureComponent[],
    layers: ArchitectureLayer[],
    dependencies: DependencyAnalysis
  ): number {
    let score = 100;

    // Deduct for circular dependencies
    score -= dependencies.cycles.length * 10;

    // Deduct for layer violations
    const totalViolations = layers.reduce((sum, l) => sum + l.violations.length, 0);
    score -= totalViolations * 5;

    // Deduct for high complexity
    const complexComponents = components.filter(c => c.complexity > 30);
    score -= complexComponents.length * 3;

    // Deduct for too many orphans (might indicate dead code)
    if (dependencies.orphans.length > 5) {
      score -= (dependencies.orphans.length - 5) * 2;
    }

    // Deduct for hub components
    const majorHubs = dependencies.hubs.filter(h => h.connections > 15);
    score -= majorHubs.length * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];

    const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const dep = match[1];
      if (dep.startsWith('.')) {
        // Extract just the module name
        const name = path.basename(dep, path.extname(dep));
        dependencies.push(name);
      }
    }

    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const dep = match[1];
      if (dep.startsWith('.')) {
        const name = path.basename(dep, path.extname(dep));
        dependencies.push(name);
      }
    }

    return [...new Set(dependencies)];
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];

    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    const exportDeclRegex = /export\s*\{([^}]+)\}/g;
    while ((match = exportDeclRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      exports.push(...names);
    }

    return [...new Set(exports.filter(e => e))];
  }

  private calculateComplexity(content: string): number {
    let complexity = 1;

    const patterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\?\s*[^:]+\s*:/g,
      /&&/g,
      /\|\|/g,
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private async findFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (
          entry.name === 'node_modules' ||
          entry.name === '.git' ||
          entry.name === 'dist' ||
          entry.name === 'build' ||
          entry.name.startsWith('.')
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          const subFiles = await this.findFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (this.codePatterns.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return files;
  }
}

