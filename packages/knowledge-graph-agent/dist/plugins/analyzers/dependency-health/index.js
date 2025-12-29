import { createLogger } from "../../../utils/logger.js";
import { createDependencyHealthAnalyzer } from "./analyzer.js";
import { DependencyHealthAnalyzer } from "./analyzer.js";
import { createDependencyGraphGenerator } from "./graph-generator.js";
import { DependencyGraphGenerator } from "./graph-generator.js";
import { NpmClient, createNpmClient } from "./npm-client.js";
import { VulnerabilityChecker, createVulnerabilityChecker } from "./vulnerability.js";
const logger = createLogger("dependency-health-plugin");
class DependencyHealthPlugin {
  projectRoot;
  config;
  analyzer;
  graphGenerator;
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot;
    this.config = config;
    this.analyzer = createDependencyHealthAnalyzer(projectRoot, config);
    const projectName = projectRoot.split("/").pop() ?? "project";
    this.graphGenerator = createDependencyGraphGenerator(projectName);
  }
  /**
   * Run the full dependency health analysis pipeline
   */
  async run() {
    logger.info("Starting dependency health plugin", { projectRoot: this.projectRoot });
    const result = {
      success: false,
      analysis: {
        analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
        projectRoot: this.projectRoot,
        packageManager: "npm",
        totalDependencies: 0,
        summary: {
          vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
          outdated: { major: 0, minor: 0, patch: 0, total: 0 },
          healthScores: { healthy: 0, warning: 0, critical: 0, unknown: 0 },
          averageHealthScore: 0
        },
        dependencies: [],
        nodes: [],
        edges: [],
        warnings: [],
        errors: [],
        duration: 0
      },
      nodes: [],
      edges: [],
      report: "",
      errors: []
    };
    try {
      const analysis = await this.analyzer.analyze();
      result.analysis = analysis;
      const graph = this.graphGenerator.generateGraph(analysis);
      result.nodes = graph.nodes;
      result.edges = graph.edges;
      result.report = this.graphGenerator.generateMarkdownReport(analysis);
      result.analysis.nodes = this.graphGenerator.generateNodes(analysis);
      result.analysis.edges = this.graphGenerator.generateEdges(result.analysis.nodes);
      result.success = analysis.errors.length === 0;
      result.errors = [...analysis.errors, ...analysis.warnings];
      logger.info("Dependency health plugin complete", {
        success: result.success,
        nodes: result.nodes.length,
        edges: result.edges.length,
        avgScore: analysis.summary.averageHealthScore
      });
    } catch (error) {
      logger.error("Dependency health plugin failed", error instanceof Error ? error : void 0);
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
    return result;
  }
  /**
   * Hook into SeedGenerator pipeline
   *
   * This method can be called after package.json parsing to enhance
   * DependencyInfo objects with health data.
   */
  async enhanceSeedAnalysis(seedAnalysis) {
    logger.info("Enhancing seed analysis with health data");
    try {
      const healthAnalysis = await this.analyzer.analyze();
      const healthMap = new Map(
        healthAnalysis.dependencies.map((d) => [d.name, d])
      );
      for (const dep of seedAnalysis.dependencies) {
        const health = healthMap.get(dep.name);
        if (health) {
          dep.health = health;
          dep.description = dep.description ? `${dep.description} (Health: ${health.overallScore}/100)` : `Health Score: ${health.overallScore}/100 - ${health.status}`;
        }
      }
      logger.info("Seed analysis enhanced", {
        total: seedAnalysis.dependencies.length,
        withHealth: healthMap.size
      });
    } catch (error) {
      logger.warn("Failed to enhance seed analysis", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    return seedAnalysis;
  }
  /**
   * Add health nodes to an existing knowledge graph
   */
  async addToGraph(graph) {
    logger.info("Adding dependency health nodes to graph");
    const result = await this.run();
    if (!result.success) {
      logger.warn("Analysis had errors, adding partial results", {
        errors: result.errors.length
      });
    }
    for (const node of result.nodes) {
      graph.addNode(node);
    }
    for (const edge of result.edges) {
      graph.addEdge(edge);
    }
    logger.info("Added dependency health data to graph", {
      nodes: result.nodes.length,
      edges: result.edges.length
    });
  }
  /**
   * Get analysis for a single package
   */
  async analyzePackage(packageName) {
    return this.analyzer.getPackageHealth(packageName);
  }
  /**
   * Get all unhealthy packages
   */
  async getUnhealthyPackages() {
    return this.analyzer.getUnhealthyPackages();
  }
  /**
   * Clear internal caches
   */
  clearCache() {
    this.analyzer.clearCache();
  }
}
function createDependencyHealthPlugin(projectRoot, config) {
  return new DependencyHealthPlugin(projectRoot, config);
}
async function analyzeDependencyHealth(projectRoot, config) {
  const plugin = createDependencyHealthPlugin(projectRoot, config);
  return plugin.run();
}
async function enhanceDependenciesWithHealth(seedAnalysis, projectRoot, config) {
  const plugin = createDependencyHealthPlugin(projectRoot, config);
  return plugin.enhanceSeedAnalysis(seedAnalysis);
}
const KNOWN_VULNERABLE_PATTERNS = [
  // lodash prototype pollution
  { package: "lodash", versionMatch: /^[0-3]\./, severity: "high", description: "Prototype pollution vulnerability" },
  { package: "lodash", versionMatch: /^4\.[0-9]\.|^4\.1[0-6]\./, severity: "high", description: "Prototype pollution CVE-2019-10744" },
  // minimist prototype pollution
  { package: "minimist", versionMatch: /^0\.[0-1]\./, severity: "critical", description: "Prototype pollution CVE-2020-7598" },
  { package: "minimist", versionMatch: /^1\.2\.[0-5]$/, severity: "critical", description: "Prototype pollution CVE-2021-44906" },
  // node-fetch
  { package: "node-fetch", versionMatch: /^[0-1]\./, severity: "moderate", description: "Known security issues in older versions" },
  { package: "node-fetch", versionMatch: /^2\.[0-5]\./, severity: "moderate", description: "Exposure of sensitive information CVE-2022-0235" },
  // axios
  { package: "axios", versionMatch: /^0\.[0-9]\.|^0\.1[0-8]\./, severity: "moderate", description: "SSRF vulnerability in older versions" },
  // express
  { package: "express", versionMatch: /^[0-3]\./, severity: "high", description: "Multiple security vulnerabilities in older versions" },
  // jsonwebtoken
  { package: "jsonwebtoken", versionMatch: /^[0-7]\./, severity: "critical", description: "Algorithm confusion CVE-2022-23529" },
  // moment.js
  { package: "moment", versionMatch: /^2\.29\.[0-3]$/, severity: "high", description: "Path traversal CVE-2022-31129" },
  // shell-quote
  { package: "shell-quote", versionMatch: /^1\.[0-6]\./, severity: "critical", description: "Command injection CVE-2021-42740" },
  // tar
  { package: "tar", versionMatch: /^[0-5]\./, severity: "high", description: "Arbitrary file overwrite vulnerabilities" },
  // glob-parent
  { package: "glob-parent", versionMatch: /^[0-4]\./, severity: "high", description: "Regular expression denial of service" },
  { package: "glob-parent", versionMatch: /^5\.[0-1]\./, severity: "high", description: "ReDoS CVE-2020-28469" }
];
class DependencyHealthAnalyzerPlugin {
  name = "dependency-health-analyzer";
  version = "1.0.0";
  type = "analyzer";
  supportedContentTypes = ["json", "package.json"];
  context = null;
  config;
  analyzer = null;
  graphGenerator = null;
  constructor(config = {}) {
    this.config = {
      minHealthScore: config.minHealthScore ?? 50,
      includeDev: config.includeDev ?? true,
      includePeer: config.includePeer ?? false,
      includeOptional: config.includeOptional ?? false,
      skipPackages: config.skipPackages ?? [],
      vulnerabilitySeverityThreshold: config.vulnerabilitySeverityThreshold ?? "low",
      fetchRegistryMetadata: config.fetchRegistryMetadata ?? true,
      registryUrl: config.registryUrl ?? "https://registry.npmjs.org",
      timeout: config.timeout ?? 3e4,
      cacheTtl: config.cacheTtl ?? 36e5,
      storeInDatabase: config.storeInDatabase ?? true,
      generateGraphNodes: config.generateGraphNodes ?? true,
      generateReport: config.generateReport ?? false,
      reportPath: config.reportPath ?? "",
      enableStreaming: config.enableStreaming ?? true,
      vulnerablePatterns: config.vulnerablePatterns ?? [],
      unusedThresholdDays: config.unusedThresholdDays ?? 90
    };
  }
  /**
   * Initialize the plugin
   */
  async initialize(context) {
    this.context = context;
    this.analyzer = createDependencyHealthAnalyzer(context.projectRoot, this.config);
    this.graphGenerator = createDependencyGraphGenerator(context.projectRoot.split("/").pop() ?? "project");
    context.logger.info("DependencyHealthAnalyzerPlugin initialized", {
      projectRoot: context.projectRoot,
      config: this.config
    });
  }
  /**
   * Destroy the plugin and clean up resources
   */
  async destroy() {
    if (this.analyzer) {
      this.analyzer.clearCache();
    }
    this.context = null;
    this.analyzer = null;
    this.graphGenerator = null;
    logger.info("DependencyHealthAnalyzerPlugin destroyed");
  }
  /**
   * Check if this analyzer can handle the given content type
   */
  canAnalyze(contentType) {
    const normalizedType = contentType.toLowerCase();
    return this.supportedContentTypes.some(
      (t) => normalizedType === t || normalizedType.includes(t)
    );
  }
  /**
   * Analyze content and return structured results
   */
  async analyze(input) {
    const startTime = Date.now();
    const log = this.context?.logger ?? logger;
    log.info("Starting dependency health analysis", { id: input.id, contentType: input.contentType });
    try {
      let packageJson;
      try {
        packageJson = JSON.parse(input.content);
      } catch {
        return this.createErrorResult(input.id, "PARSE_ERROR", "Failed to parse package.json content");
      }
      const allDeps = this.extractDependencies(packageJson);
      if (allDeps.length === 0) {
        return this.createSuccessResult(input.id, startTime, {
          entities: [],
          relationships: [],
          tags: [{ value: "no-dependencies", confidence: 1 }],
          qualityScore: 100,
          summary: "No dependencies found in package.json",
          metrics: { durationMs: Date.now() - startTime, entitiesFound: 0 }
        });
      }
      const vulnerabilities = this.checkVulnerabilities(allDeps);
      const outdatedInfo = this.identifyOutdatedPatterns(allDeps);
      const metrics = this.calculateHealthMetrics(allDeps, vulnerabilities, outdatedInfo);
      const entities = this.generateEntities(allDeps, vulnerabilities, outdatedInfo);
      const relationships = this.generateRelationships(allDeps, packageJson);
      const tags = this.generateTags(metrics, vulnerabilities);
      const suggestions = this.generateSuggestions(vulnerabilities, outdatedInfo, metrics);
      return this.createSuccessResult(input.id, startTime, {
        entities,
        relationships,
        tags,
        qualityScore: metrics.averageHealthScore,
        summary: this.generateSummary(metrics, vulnerabilities, outdatedInfo),
        metrics: {
          durationMs: Date.now() - startTime,
          entitiesFound: entities.length,
          relationshipsFound: relationships.length
        },
        suggestions,
        raw: {
          packageJson,
          vulnerabilities,
          outdatedInfo,
          healthMetrics: metrics
        }
      });
    } catch (error) {
      log.error("Dependency health analysis failed", error instanceof Error ? error : void 0);
      return this.createErrorResult(
        input.id,
        "ANALYSIS_ERROR",
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  /**
   * Stream analysis results for large content
   */
  async *analyzeStream(input) {
    const log = this.context?.logger ?? logger;
    log.info("Starting streaming dependency health analysis", { id: input.id });
    yield {
      type: "progress",
      data: { phase: "parsing", message: "Parsing package.json" },
      progress: 5,
      timestamp: /* @__PURE__ */ new Date()
    };
    let packageJson;
    try {
      packageJson = JSON.parse(input.content);
    } catch {
      yield {
        type: "error",
        data: { code: "PARSE_ERROR", message: "Failed to parse package.json content" },
        timestamp: /* @__PURE__ */ new Date()
      };
      return;
    }
    yield {
      type: "progress",
      data: { phase: "extracting", message: "Extracting dependencies" },
      progress: 15,
      timestamp: /* @__PURE__ */ new Date()
    };
    const allDeps = this.extractDependencies(packageJson);
    const totalDeps = allDeps.length;
    if (totalDeps === 0) {
      yield {
        type: "complete",
        data: { message: "No dependencies found", qualityScore: 100 },
        progress: 100,
        timestamp: /* @__PURE__ */ new Date()
      };
      return;
    }
    yield {
      type: "progress",
      data: { phase: "checking", message: `Found ${totalDeps} dependencies` },
      progress: 20,
      timestamp: /* @__PURE__ */ new Date()
    };
    const vulnerabilities = /* @__PURE__ */ new Map();
    const outdatedInfo = /* @__PURE__ */ new Map();
    let processed = 0;
    for (const dep of allDeps) {
      const vulns = this.checkSingleDependency(dep.name, dep.version);
      if (vulns.length > 0) {
        vulnerabilities.set(dep.name, vulns);
      }
      const outdated = this.checkOutdatedPattern(dep.version);
      outdatedInfo.set(dep.name, outdated);
      const healthScore = this.calculateSingleHealthScore(dep, vulns, outdated);
      yield {
        type: "entity",
        data: {
          id: `dep:${dep.name.replace(/[@/]/g, "-")}`,
          type: "dependency",
          value: dep.name,
          confidence: 0.95,
          metadata: {
            version: dep.version,
            isDev: dep.isDev,
            healthScore,
            hasVulnerabilities: vulns.length > 0,
            isOutdated: outdated.isOutdated
          }
        },
        timestamp: /* @__PURE__ */ new Date()
      };
      processed++;
      const progressPercent = 20 + Math.floor(processed / totalDeps * 60);
      if (processed % 5 === 0 || processed === totalDeps) {
        yield {
          type: "progress",
          data: { phase: "analyzing", message: `Analyzed ${processed}/${totalDeps} dependencies` },
          progress: progressPercent,
          timestamp: /* @__PURE__ */ new Date()
        };
      }
    }
    yield {
      type: "progress",
      data: { phase: "relationships", message: "Generating relationships" },
      progress: 85,
      timestamp: /* @__PURE__ */ new Date()
    };
    const relationships = this.generateRelationships(allDeps, packageJson);
    for (const rel of relationships) {
      yield {
        type: "relationship",
        data: rel,
        timestamp: /* @__PURE__ */ new Date()
      };
    }
    const metrics = this.calculateHealthMetrics(allDeps, vulnerabilities, outdatedInfo);
    yield {
      type: "progress",
      data: { phase: "finalizing", message: "Generating tags and summary" },
      progress: 95,
      timestamp: /* @__PURE__ */ new Date()
    };
    const tags = this.generateTags(metrics, vulnerabilities);
    for (const tag of tags) {
      yield {
        type: "tag",
        data: tag,
        timestamp: /* @__PURE__ */ new Date()
      };
    }
    yield {
      type: "complete",
      data: {
        message: this.generateSummary(metrics, vulnerabilities, outdatedInfo),
        qualityScore: metrics.averageHealthScore,
        metrics
      },
      progress: 100,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Get analyzer-specific configuration options
   */
  getConfigOptions() {
    return {
      minHealthScore: {
        type: "number",
        description: "Minimum health score threshold (0-100)",
        default: 50
      },
      includeDev: {
        type: "boolean",
        description: "Include dev dependencies in analysis",
        default: true
      },
      includePeer: {
        type: "boolean",
        description: "Include peer dependencies in analysis",
        default: false
      },
      includeOptional: {
        type: "boolean",
        description: "Include optional dependencies in analysis",
        default: false
      },
      skipPackages: {
        type: "array",
        description: "Packages to skip during analysis",
        default: []
      },
      vulnerabilitySeverityThreshold: {
        type: "string",
        description: "Minimum severity to report (info, low, moderate, high, critical)",
        default: "low"
      },
      fetchRegistryMetadata: {
        type: "boolean",
        description: "Fetch metadata from npm registry",
        default: true
      },
      enableStreaming: {
        type: "boolean",
        description: "Enable streaming analysis mode",
        default: true
      }
    };
  }
  /**
   * Get plugin health status
   */
  async healthCheck() {
    return {
      healthy: true,
      message: "Dependency Health Analyzer is operational",
      details: {
        supportedContentTypes: this.supportedContentTypes,
        knownVulnerablePatterns: KNOWN_VULNERABLE_PATTERNS.length,
        cacheEnabled: (this.config?.cacheTtl ?? 0) > 0
      }
    };
  }
  /**
   * Get plugin statistics
   */
  async getStats() {
    return {
      name: this.name,
      version: this.version,
      supportedContentTypes: this.supportedContentTypes,
      config: this.config
    };
  }
  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================
  extractDependencies(pkg) {
    const deps = [];
    if (pkg.dependencies) {
      for (const [name, version] of Object.entries(pkg.dependencies)) {
        deps.push({ name, version: this.cleanVersion(version), isDev: false });
      }
    }
    if (this.config.includeDev && pkg.devDependencies) {
      for (const [name, version] of Object.entries(pkg.devDependencies)) {
        deps.push({ name, version: this.cleanVersion(version), isDev: true });
      }
    }
    if (this.config.includePeer && pkg.peerDependencies) {
      for (const [name, version] of Object.entries(pkg.peerDependencies)) {
        deps.push({ name, version: this.cleanVersion(version), isDev: false });
      }
    }
    if (this.config.includeOptional && pkg.optionalDependencies) {
      for (const [name, version] of Object.entries(pkg.optionalDependencies)) {
        deps.push({ name, version: this.cleanVersion(version), isDev: false });
      }
    }
    return deps.filter((d) => !this.config.skipPackages?.includes(d.name));
  }
  cleanVersion(version) {
    return version.replace(/^[\^~>=<]/, "").split(" ")[0];
  }
  checkVulnerabilities(deps) {
    const vulnerabilities = /* @__PURE__ */ new Map();
    for (const dep of deps) {
      const vulns = this.checkSingleDependency(dep.name, dep.version);
      if (vulns.length > 0) {
        vulnerabilities.set(dep.name, vulns);
      }
    }
    return vulnerabilities;
  }
  checkSingleDependency(name, version) {
    const vulns = [];
    for (const pattern of KNOWN_VULNERABLE_PATTERNS) {
      if (pattern.package === name && pattern.versionMatch.test(version)) {
        vulns.push({
          severity: pattern.severity,
          description: pattern.description
        });
      }
    }
    for (const custom of this.config.vulnerablePatterns ?? []) {
      if (custom.package === name || new RegExp(custom.package).test(name)) {
        if (this.versionInRange(version, custom.versionRange)) {
          vulns.push({
            severity: custom.severity,
            description: custom.description
          });
        }
      }
    }
    return vulns;
  }
  versionInRange(version, range) {
    const match = range.match(/^([<>=]+)\s*(\d+\.\d+\.\d+)/);
    if (!match) return false;
    const [, op, targetVersion] = match;
    const comparison = this.compareVersions(version, targetVersion);
    switch (op) {
      case "<":
        return comparison < 0;
      case "<=":
        return comparison <= 0;
      case ">":
        return comparison > 0;
      case ">=":
        return comparison >= 0;
      case "=":
      case "==":
        return comparison === 0;
      default:
        return false;
    }
  }
  compareVersions(a, b) {
    const partsA = a.split(".").map((n) => parseInt(n, 10) || 0);
    const partsB = b.split(".").map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] ?? 0;
      const numB = partsB[i] ?? 0;
      if (numA < numB) return -1;
      if (numA > numB) return 1;
    }
    return 0;
  }
  identifyOutdatedPatterns(deps) {
    const outdated = /* @__PURE__ */ new Map();
    for (const dep of deps) {
      outdated.set(dep.name, this.checkOutdatedPattern(dep.version));
    }
    return outdated;
  }
  checkOutdatedPattern(version) {
    if (/^0\.[0-9]\.[0-9]/.test(version)) {
      return { isOutdated: true, pattern: "pre-1.0 version" };
    }
    if (/-(alpha|beta|rc|canary)/i.test(version)) {
      return { isOutdated: true, pattern: "pre-release version" };
    }
    return { isOutdated: false };
  }
  calculateHealthMetrics(deps, vulnerabilities, outdatedInfo) {
    const total = deps.length;
    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;
    let totalScore = 0;
    for (const dep of deps) {
      const vulns = vulnerabilities.get(dep.name) ?? [];
      const outdated = outdatedInfo.get(dep.name) ?? { isOutdated: false };
      const score = this.calculateSingleHealthScore(dep, vulns, outdated);
      totalScore += score;
      if (score >= 80) {
        healthyCount++;
      } else if (score >= 50) {
        warningCount++;
      } else {
        criticalCount++;
      }
    }
    const vulnerableCount = vulnerabilities.size;
    const outdatedCount = Array.from(outdatedInfo.values()).filter((o) => o.isOutdated).length;
    const securityScore = total > 0 ? Math.max(0, 100 - vulnerableCount / total * 100) : 100;
    const freshnessScore = total > 0 ? Math.max(0, 100 - outdatedCount / total * 100) : 100;
    const maintenanceScore = (securityScore + freshnessScore) / 2;
    return {
      totalDependencies: total,
      healthyCount,
      warningCount,
      criticalCount,
      averageHealthScore: total > 0 ? Math.round(totalScore / total) : 100,
      outdatedCount,
      vulnerableCount,
      unusedCount: 0,
      // Would require import analysis
      securityScore: Math.round(securityScore),
      freshnessScore: Math.round(freshnessScore),
      maintenanceScore: Math.round(maintenanceScore)
    };
  }
  calculateSingleHealthScore(dep, vulns, outdated) {
    let score = 100;
    for (const vuln of vulns) {
      switch (vuln.severity) {
        case "critical":
          score -= 40;
          break;
        case "high":
          score -= 25;
          break;
        case "moderate":
          score -= 15;
          break;
        case "low":
          score -= 5;
          break;
      }
    }
    if (outdated.isOutdated) {
      score -= 15;
    }
    return Math.max(0, score);
  }
  generateEntities(deps, vulnerabilities, outdatedInfo) {
    return deps.map((dep, index) => {
      const vulns = vulnerabilities.get(dep.name) ?? [];
      const outdated = outdatedInfo.get(dep.name) ?? { isOutdated: false };
      const score = this.calculateSingleHealthScore(dep, vulns, outdated);
      return {
        id: `dep:${dep.name.replace(/[@/]/g, "-")}`,
        type: "dependency",
        value: dep.name,
        confidence: 0.95,
        position: { start: index, end: index + 1 },
        metadata: {
          version: dep.version,
          isDev: dep.isDev,
          healthScore: score,
          hasVulnerabilities: vulns.length > 0,
          vulnerabilities: vulns,
          isOutdated: outdated.isOutdated,
          outdatedReason: outdated.pattern
        }
      };
    });
  }
  generateRelationships(deps, pkg) {
    const relationships = [];
    const projectId = `project:${pkg.name ?? "unknown"}`;
    for (const dep of deps) {
      relationships.push({
        sourceId: projectId,
        targetId: `dep:${dep.name.replace(/[@/]/g, "-")}`,
        type: dep.isDev ? "dev-depends-on" : "depends-on",
        confidence: 1,
        metadata: { version: dep.version }
      });
    }
    const scopedDeps = deps.filter((d) => d.name.startsWith("@"));
    const scopeGroups = /* @__PURE__ */ new Map();
    for (const dep of scopedDeps) {
      const scope = dep.name.split("/")[0];
      const existing = scopeGroups.get(scope) ?? [];
      existing.push(dep.name);
      scopeGroups.set(scope, existing);
    }
    for (const [, packages] of scopeGroups) {
      if (packages.length > 1) {
        for (let i = 0; i < packages.length - 1; i++) {
          relationships.push({
            sourceId: `dep:${packages[i].replace(/[@/]/g, "-")}`,
            targetId: `dep:${packages[i + 1].replace(/[@/]/g, "-")}`,
            type: "related",
            confidence: 0.8
          });
        }
      }
    }
    return relationships;
  }
  generateTags(metrics, vulnerabilities) {
    const tags = [];
    if (metrics.averageHealthScore >= 80) {
      tags.push({ value: "healthy-dependencies", confidence: 0.9, category: "health" });
    } else if (metrics.averageHealthScore >= 50) {
      tags.push({ value: "needs-attention", confidence: 0.9, category: "health" });
    } else {
      tags.push({ value: "critical-issues", confidence: 0.9, category: "health" });
    }
    if (vulnerabilities.size > 0) {
      tags.push({ value: "has-vulnerabilities", confidence: 1, category: "security" });
      const hasCritical = Array.from(vulnerabilities.values()).flat().some((v) => v.severity === "critical");
      if (hasCritical) {
        tags.push({ value: "critical-vulnerabilities", confidence: 1, category: "security" });
      }
    } else {
      tags.push({ value: "no-known-vulnerabilities", confidence: 0.8, category: "security" });
    }
    if (metrics.outdatedCount > 0) {
      tags.push({ value: "has-outdated-deps", confidence: 0.9, category: "maintenance" });
    }
    if (metrics.totalDependencies > 100) {
      tags.push({ value: "large-dependency-tree", confidence: 0.9, category: "size" });
    } else if (metrics.totalDependencies > 50) {
      tags.push({ value: "medium-dependency-tree", confidence: 0.9, category: "size" });
    } else {
      tags.push({ value: "small-dependency-tree", confidence: 0.9, category: "size" });
    }
    return tags;
  }
  generateSuggestions(vulnerabilities, outdatedInfo, metrics) {
    const suggestions = [];
    if (vulnerabilities.size > 0) {
      suggestions.push({
        type: "other",
        message: `Run 'npm audit fix' to address ${vulnerabilities.size} package(s) with known vulnerabilities`,
        confidence: 0.95,
        action: { command: "npm audit fix" }
      });
      for (const [name, vulns] of vulnerabilities) {
        const critical = vulns.filter((v) => v.severity === "critical" || v.severity === "high");
        if (critical.length > 0) {
          suggestions.push({
            type: "other",
            message: `Update ${name} to address: ${critical[0].description}`,
            confidence: 0.9,
            action: { package: name, severity: critical[0].severity }
          });
        }
      }
    }
    const outdatedPackages = Array.from(outdatedInfo.entries()).filter(([, info]) => info.isOutdated).map(([name]) => name);
    if (outdatedPackages.length > 0) {
      suggestions.push({
        type: "other",
        message: `Consider updating ${outdatedPackages.length} package(s) with outdated version patterns`,
        confidence: 0.7
      });
    }
    if (metrics.averageHealthScore < 70) {
      suggestions.push({
        type: "add_content",
        message: "Consider auditing and updating dependencies to improve overall health score",
        confidence: 0.8
      });
    }
    return suggestions;
  }
  generateSummary(metrics, vulnerabilities, outdatedInfo) {
    const parts = [];
    parts.push(`Analyzed ${metrics.totalDependencies} dependencies.`);
    parts.push(`Average health score: ${metrics.averageHealthScore}/100.`);
    if (vulnerabilities.size > 0) {
      parts.push(`Found ${vulnerabilities.size} package(s) with known vulnerabilities.`);
    }
    if (metrics.outdatedCount > 0) {
      parts.push(`${metrics.outdatedCount} package(s) may be outdated.`);
    }
    parts.push(`Health distribution: ${metrics.healthyCount} healthy, ${metrics.warningCount} warning, ${metrics.criticalCount} critical.`);
    return parts.join(" ");
  }
  createSuccessResult(inputId, startTime, data) {
    return {
      success: true,
      analysisType: "dependency-health",
      entities: data.entities ?? [],
      relationships: data.relationships ?? [],
      tags: data.tags ?? [],
      summary: data.summary,
      qualityScore: data.qualityScore,
      metrics: {
        durationMs: Date.now() - startTime,
        ...data.metrics
      },
      suggestions: data.suggestions,
      raw: data.raw
    };
  }
  createErrorResult(inputId, code, message) {
    return {
      success: false,
      analysisType: "dependency-health",
      error: { code, message }
    };
  }
}
function createDependencyHealthAnalyzerPlugin(config) {
  return new DependencyHealthAnalyzerPlugin(config);
}
export {
  DependencyGraphGenerator,
  DependencyHealthAnalyzer,
  DependencyHealthAnalyzerPlugin,
  DependencyHealthPlugin,
  NpmClient,
  VulnerabilityChecker,
  analyzeDependencyHealth,
  createDependencyGraphGenerator,
  createDependencyHealthAnalyzer,
  createDependencyHealthAnalyzerPlugin,
  createDependencyHealthPlugin,
  createNpmClient,
  createVulnerabilityChecker,
  enhanceDependenciesWithHealth
};
//# sourceMappingURL=index.js.map
