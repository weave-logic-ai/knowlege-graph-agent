import * as fs from "fs/promises";
import * as path from "path";
import { BaseAgent } from "./base-agent.js";
import { AgentType } from "./types.js";
class ArchitectAgent extends BaseAgent {
  /** File patterns to analyze */
  codePatterns = [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"];
  /** Knowledge graph reference */
  knowledgeGraph = null;
  /** Layer definitions for common architectures */
  layerDefinitions = {
    presentation: ["components", "views", "pages", "ui"],
    application: ["services", "usecases", "handlers", "controllers"],
    domain: ["models", "entities", "domain", "core"],
    infrastructure: ["repositories", "adapters", "database", "api"],
    shared: ["utils", "helpers", "common", "shared", "lib"]
  };
  constructor(config) {
    super({
      type: AgentType.ARCHITECT,
      taskTimeout: 3e5,
      // 5 minutes for large projects
      capabilities: ["architecture-analysis", "design", "dependency-analysis"],
      ...config
    });
  }
  // ==========================================================================
  // Knowledge Graph Integration
  // ==========================================================================
  /**
   * Set knowledge graph for context-aware analysis
   */
  setKnowledgeGraph(graph) {
    this.knowledgeGraph = graph;
    this.logger.debug("Knowledge graph attached", {
      nodeCount: graph.getMetadata().nodeCount
    });
  }
  // ==========================================================================
  // Task Execution
  // ==========================================================================
  /**
   * Execute architect task
   */
  async executeTask(task) {
    const startTime = /* @__PURE__ */ new Date();
    const taskType = task.input?.parameters?.taskType || "analyze";
    switch (taskType) {
      case "analyze":
        return this.handleAnalyzeTask(task, startTime);
      case "design":
        return this.handleDesignTask(task, startTime);
      case "dependencies":
        return this.handleDependenciesTask(task, startTime);
      case "suggest":
        return this.handleSuggestTask(task, startTime);
      default:
        return this.createErrorResult(
          "INVALID_TASK_TYPE",
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
  async analyzeArchitecture(projectRoot) {
    this.logger.info("Analyzing architecture", { root: projectRoot });
    const components = await this.discoverComponents(projectRoot);
    const patterns = this.detectPatterns(components, projectRoot);
    const layers = this.identifyLayers(components);
    const dependencies = this.analyzeDependencies(components);
    const decisions = this.generateDesignDecisions(components, layers, dependencies);
    const healthScore = this.calculateHealthScore(components, layers, dependencies);
    return {
      projectName: path.basename(projectRoot),
      patterns,
      layers,
      components,
      dependencies,
      decisions,
      healthScore,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Suggest design improvements
   */
  async suggestDesign(projectRoot) {
    this.logger.info("Generating design suggestions", { root: projectRoot });
    const analysis = await this.analyzeArchitecture(projectRoot);
    const suggestions = [];
    for (const cycle of analysis.dependencies.cycles) {
      suggestions.push({
        type: "refactor",
        target: cycle.join(" -> "),
        description: "Break circular dependency",
        priority: "high",
        benefit: "Improves testability and maintainability",
        effort: "medium"
      });
    }
    for (const hub of analysis.dependencies.hubs) {
      if (hub.connections > 10) {
        suggestions.push({
          type: "extract",
          target: hub.module,
          description: `Split ${hub.module} - too many connections (${hub.connections})`,
          priority: hub.connections > 20 ? "high" : "medium",
          benefit: "Reduces coupling and improves modularity",
          effort: "high"
        });
      }
    }
    for (const layer of analysis.layers) {
      if (layer.violations.length > 0) {
        suggestions.push({
          type: "refactor",
          target: layer.name,
          description: `Fix ${layer.violations.length} layer violation(s) in ${layer.name}`,
          priority: "high",
          benefit: "Enforces clean architecture boundaries",
          effort: "medium"
        });
      }
    }
    for (const orphan of analysis.dependencies.orphans) {
      suggestions.push({
        type: "remove",
        target: orphan,
        description: `Consider removing unused module: ${orphan}`,
        priority: "low",
        benefit: "Reduces codebase size and maintenance burden",
        effort: "low"
      });
    }
    for (const component of analysis.components) {
      if (component.complexity > 30) {
        suggestions.push({
          type: "extract",
          target: component.name,
          description: `Reduce complexity of ${component.name} (${component.complexity})`,
          priority: component.complexity > 50 ? "high" : "medium",
          benefit: "Improves readability and testability",
          effort: "medium"
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
  async mapDependencies(projectRoot) {
    this.logger.info("Mapping dependencies", { root: projectRoot });
    const components = await this.discoverComponents(projectRoot);
    return this.analyzeDependencies(components);
  }
  // ==========================================================================
  // Private Task Handlers
  // ==========================================================================
  async handleAnalyzeTask(task, startTime) {
    const input = task.input?.data;
    if (!input?.projectRoot) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Project root is required for architecture analysis",
        startTime
      );
    }
    try {
      const analysis = await this.analyzeArchitecture(input.projectRoot);
      const artifacts = [{
        type: "report",
        name: "architecture-analysis",
        content: JSON.stringify(analysis, null, 2),
        mimeType: "application/json"
      }];
      return this.createSuccessResult(analysis, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("ANALYSIS_ERROR", `Architecture analysis failed: ${message}`, startTime);
    }
  }
  async handleDesignTask(task, startTime) {
    const input = task.input?.data;
    if (!input?.projectRoot) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Project root is required for design analysis",
        startTime
      );
    }
    try {
      const analysis = await this.analyzeArchitecture(input.projectRoot);
      return this.createSuccessResult(analysis.decisions, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("DESIGN_ERROR", `Design analysis failed: ${message}`, startTime);
    }
  }
  async handleDependenciesTask(task, startTime) {
    const input = task.input?.data;
    if (!input?.projectRoot) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Project root is required for dependency analysis",
        startTime
      );
    }
    try {
      const analysis = await this.mapDependencies(input.projectRoot);
      return this.createSuccessResult(analysis, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("DEPENDENCY_ERROR", `Dependency analysis failed: ${message}`, startTime);
    }
  }
  async handleSuggestTask(task, startTime) {
    const input = task.input?.data;
    if (!input?.projectRoot) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Project root is required for design suggestions",
        startTime
      );
    }
    try {
      const suggestions = await this.suggestDesign(input.projectRoot);
      return this.createSuccessResult(suggestions, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("SUGGEST_ERROR", `Design suggestion failed: ${message}`, startTime);
    }
  }
  // ==========================================================================
  // Component Discovery
  // ==========================================================================
  async discoverComponents(projectRoot) {
    const components = [];
    const files = await this.findFiles(projectRoot);
    for (const file of files) {
      try {
        const content = await fs.readFile(file, "utf-8");
        const relativePath = path.relative(projectRoot, file);
        const component = this.analyzeComponent(content, relativePath);
        components.push(component);
      } catch (error) {
        this.logger.warn(`Failed to analyze ${file}`, { error });
      }
    }
    this.resolveDependencies(components);
    return components;
  }
  analyzeComponent(content, filePath) {
    const name = path.basename(filePath, path.extname(filePath));
    const type = this.inferComponentType(filePath, content);
    const dependencies = this.extractDependencies(content);
    const exports$1 = this.extractExports(content);
    const linesOfCode = content.split("\n").filter((l) => l.trim().length > 0).length;
    const complexity = this.calculateComplexity(content);
    return {
      name,
      type,
      path: filePath,
      dependencies,
      dependents: [],
      // Filled later
      exports: exports$1,
      linesOfCode,
      complexity
    };
  }
  inferComponentType(filePath, content) {
    const lowerPath = filePath.toLowerCase();
    const lowerContent = content.toLowerCase();
    if (lowerPath.includes("service") || lowerPath.includes("services")) return "service";
    if (lowerPath.includes("controller") || lowerPath.includes("controllers")) return "controller";
    if (lowerPath.includes("repository") || lowerPath.includes("repositories")) return "repository";
    if (lowerPath.includes("model") || lowerPath.includes("models")) return "model";
    if (lowerPath.includes("view") || lowerPath.includes("component")) return "view";
    if (lowerPath.includes("util") || lowerPath.includes("helper")) return "utility";
    if (lowerPath.includes("middleware")) return "middleware";
    if (lowerPath.includes("handler")) return "handler";
    if (lowerPath.includes("factory")) return "factory";
    if (lowerPath.includes("adapter")) return "adapter";
    if (lowerContent.includes("class") && lowerContent.includes("service")) return "service";
    if (lowerContent.includes("@controller") || lowerContent.includes("router")) return "controller";
    if (lowerContent.includes("repository") || lowerContent.includes("findby")) return "repository";
    if (lowerContent.includes("interface") && lowerContent.includes("model")) return "model";
    return "utility";
  }
  resolveDependencies(components) {
    const componentMap = new Map(components.map((c) => [c.path, c]));
    const nameMap = new Map(components.map((c) => [c.name, c]));
    for (const component of components) {
      for (const dep of component.dependencies) {
        const depPath = this.resolveDependencyPath(component.path, dep);
        const depComponent = componentMap.get(depPath) || nameMap.get(dep);
        if (depComponent && depComponent !== component) {
          if (!depComponent.dependents.includes(component.name)) {
            depComponent.dependents.push(component.name);
          }
        }
      }
    }
  }
  resolveDependencyPath(fromPath, dep) {
    if (dep.startsWith(".")) {
      const dir = path.dirname(fromPath);
      const resolved = path.normalize(path.join(dir, dep));
      for (const ext of this.codePatterns) {
        if (resolved.endsWith(ext)) return resolved;
      }
      return resolved + ".ts";
    }
    return dep;
  }
  // ==========================================================================
  // Pattern Detection
  // ==========================================================================
  detectPatterns(components, projectRoot) {
    const patterns = [];
    const hasControllers = components.some((c) => c.type === "controller");
    const hasModels = components.some((c) => c.type === "model");
    const hasViews = components.some((c) => c.type === "view");
    if (hasControllers && hasModels && hasViews) {
      patterns.push("mvc");
    }
    const layers = this.identifyLayers(components);
    if (layers.length >= 3) {
      patterns.push("layered");
    }
    const hasAdapters = components.some((c) => c.type === "adapter");
    const hasRepositories = components.some((c) => c.type === "repository");
    if (hasAdapters && hasRepositories && layers.length >= 3) {
      patterns.push("clean-architecture");
    }
    const directories = new Set(components.map((c) => path.dirname(c.path)));
    if (directories.size > 5) {
      patterns.push("modular");
    }
    const hasEvents = components.some(
      (c) => c.exports.some((e) => e.toLowerCase().includes("event") || e.toLowerCase().includes("emit"))
    );
    if (hasEvents) {
      patterns.push("event-driven");
    }
    return patterns.length > 0 ? patterns : ["monolith"];
  }
  // ==========================================================================
  // Layer Analysis
  // ==========================================================================
  identifyLayers(components) {
    const layers = [];
    const layerComponents = {};
    for (const component of components) {
      const layer = this.inferLayer(component.path);
      if (!layerComponents[layer]) {
        layerComponents[layer] = [];
      }
      layerComponents[layer].push(component.name);
    }
    const layerOrder = ["presentation", "application", "domain", "infrastructure", "shared"];
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
          (d) => !allowedDeps.includes(d) && d !== layerName
        );
        layers.push({
          name: layerName,
          level: i,
          components: layerComponents[layerName],
          allowedDependencies: allowedDeps,
          actualDependencies: actualDeps,
          violations
        });
      }
    }
    return layers;
  }
  inferLayer(filePath) {
    const lowerPath = filePath.toLowerCase();
    for (const [layer, patterns] of Object.entries(this.layerDefinitions)) {
      for (const pattern of patterns) {
        if (lowerPath.includes(pattern)) {
          return layer;
        }
      }
    }
    return "shared";
  }
  findLayerDependencies(components, layerComponentNames, allLayerComponents) {
    const dependencies = /* @__PURE__ */ new Set();
    for (const componentName of layerComponentNames) {
      const component = components.find((c) => c.name === componentName);
      if (!component) continue;
      for (const dep of component.dependencies) {
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
  analyzeDependencies(components) {
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
      recommendations
    };
  }
  buildDependencyGraph(components) {
    return components.map((c) => {
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
          abstractness: 0
          // Would require interface detection
        }
      };
    });
  }
  findCycles(components) {
    const cycles = [];
    const visited = /* @__PURE__ */ new Set();
    const recursionStack = /* @__PURE__ */ new Set();
    const path2 = [];
    const dfs = (componentName) => {
      visited.add(componentName);
      recursionStack.add(componentName);
      path2.push(componentName);
      const component = components.find((c) => c.name === componentName);
      if (component) {
        for (const dep of component.dependencies) {
          const depComponent = components.find((c) => c.name === dep);
          if (!depComponent) continue;
          if (!visited.has(dep)) {
            dfs(dep);
          } else if (recursionStack.has(dep)) {
            const cycleStart = path2.indexOf(dep);
            if (cycleStart !== -1) {
              cycles.push([...path2.slice(cycleStart), dep]);
            }
          }
        }
      }
      path2.pop();
      recursionStack.delete(componentName);
    };
    for (const component of components) {
      if (!visited.has(component.name)) {
        dfs(component.name);
      }
    }
    return cycles;
  }
  findOrphans(components) {
    return components.filter((c) => c.dependencies.length === 0 && c.dependents.length === 0).map((c) => c.name);
  }
  findHubs(components) {
    return components.map((c) => ({
      module: c.name,
      connections: c.dependencies.length + c.dependents.length
    })).filter((h) => h.connections > 5).sort((a, b) => b.connections - a.connections);
  }
  generateDependencyRecommendations(cycles, orphans, hubs) {
    const recommendations = [];
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
    const majorHubs = hubs.filter((h) => h.connections > 10);
    if (majorHubs.length > 0) {
      recommendations.push(
        `${majorHubs.length} highly-connected module(s) - consider splitting into smaller modules`
      );
    }
    if (recommendations.length === 0) {
      recommendations.push("Dependency structure looks healthy");
    }
    return recommendations;
  }
  // ==========================================================================
  // Design Decisions
  // ==========================================================================
  generateDesignDecisions(components, layers, dependencies) {
    const decisions = [];
    const violatingLayers = layers.filter((l) => l.violations.length > 0);
    if (violatingLayers.length > 0) {
      decisions.push({
        title: "Enforce Layer Boundaries",
        category: "structure",
        description: "Some layers have dependencies that violate the intended architecture",
        rationale: "Clean separation of concerns improves maintainability and testability",
        pros: ["Better modularity", "Easier testing", "Clearer responsibilities"],
        cons: ["Initial refactoring effort", "May require interface introduction"],
        priority: "high"
      });
    }
    if (dependencies.cycles.length > 0) {
      decisions.push({
        title: "Break Circular Dependencies",
        category: "structure",
        description: `Found ${dependencies.cycles.length} circular dependency chain(s)`,
        rationale: "Circular dependencies make code harder to understand and test",
        pros: ["Improved testability", "Clearer module boundaries", "Easier refactoring"],
        cons: ["May require interface extraction", "Some restructuring needed"],
        alternatives: ["Dependency injection", "Event-driven communication"],
        priority: "high"
      });
    }
    const complexComponents = components.filter((c) => c.complexity > 30);
    if (complexComponents.length > 0) {
      decisions.push({
        title: "Reduce Component Complexity",
        category: "pattern",
        description: `${complexComponents.length} component(s) have high complexity`,
        rationale: "Lower complexity improves readability and reduces bug risk",
        pros: ["Better maintainability", "Easier testing", "Reduced cognitive load"],
        cons: ["May increase number of files", "Refactoring effort"],
        alternatives: ["Extract methods", "Apply design patterns", "Split responsibilities"],
        priority: "medium"
      });
    }
    const services = components.filter((c) => c.type === "service");
    if (services.length === 0 && components.length > 10) {
      decisions.push({
        title: "Introduce Service Layer",
        category: "pattern",
        description: "Consider introducing a service layer for business logic",
        rationale: "Service layer provides clean separation between UI and business logic",
        pros: ["Reusable business logic", "Better testability", "Cleaner controllers"],
        cons: ["Additional abstraction layer", "More files to manage"],
        priority: "medium"
      });
    }
    return decisions;
  }
  // ==========================================================================
  // Health Score
  // ==========================================================================
  calculateHealthScore(components, layers, dependencies) {
    let score = 100;
    score -= dependencies.cycles.length * 10;
    const totalViolations = layers.reduce((sum, l) => sum + l.violations.length, 0);
    score -= totalViolations * 5;
    const complexComponents = components.filter((c) => c.complexity > 30);
    score -= complexComponents.length * 3;
    if (dependencies.orphans.length > 5) {
      score -= (dependencies.orphans.length - 5) * 2;
    }
    const majorHubs = dependencies.hubs.filter((h) => h.connections > 15);
    score -= majorHubs.length * 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  // ==========================================================================
  // Helper Methods
  // ==========================================================================
  extractDependencies(content) {
    const dependencies = [];
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const dep = match[1];
      if (dep.startsWith(".")) {
        const name = path.basename(dep, path.extname(dep));
        dependencies.push(name);
      }
    }
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const dep = match[1];
      if (dep.startsWith(".")) {
        const name = path.basename(dep, path.extname(dep));
        dependencies.push(name);
      }
    }
    return [...new Set(dependencies)];
  }
  extractExports(content) {
    const exports$1 = [];
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports$1.push(match[1]);
    }
    const exportDeclRegex = /export\s*\{([^}]+)\}/g;
    while ((match = exportDeclRegex.exec(content)) !== null) {
      const names = match[1].split(",").map((n) => n.trim().split(/\s+as\s+/)[0]);
      exports$1.push(...names);
    }
    return [...new Set(exports$1.filter((e) => e))];
  }
  calculateComplexity(content) {
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
      /\|\|/g
    ];
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }
    return complexity;
  }
  async findFiles(dir) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === "build" || entry.name.startsWith(".")) {
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
    }
    return files;
  }
}
export {
  ArchitectAgent
};
//# sourceMappingURL=architect-agent.js.map
