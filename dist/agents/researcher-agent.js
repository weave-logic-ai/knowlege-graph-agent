import * as fs from "fs/promises";
import * as path from "path";
import { BaseAgent } from "./base-agent.js";
import { AgentType } from "./types.js";
class ResearcherAgent extends BaseAgent {
  /** File type patterns for analysis */
  codePatterns = [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    "**/*.mts",
    "**/*.mjs"
  ];
  /** Documentation patterns */
  docPatterns = ["**/*.md", "**/*.mdx", "**/*.txt"];
  /** Knowledge graph reference */
  knowledgeGraph = null;
  constructor(config) {
    super({
      type: AgentType.RESEARCHER,
      taskTimeout: 12e4,
      // 2 minutes
      capabilities: ["research", "pattern-analysis", "documentation"],
      ...config
    });
  }
  // ==========================================================================
  // Knowledge Graph Integration
  // ==========================================================================
  /**
   * Set knowledge graph for context-aware research
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
   * Execute research task
   */
  async executeTask(task) {
    const startTime = /* @__PURE__ */ new Date();
    const input = task.input?.data;
    if (!input?.query) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Research query is required in task input.data",
        startTime
      );
    }
    try {
      const projectRoot = task.input?.context?.projectRoot || process.cwd();
      const result = await this.research(input, projectRoot);
      const artifacts = [{
        type: "report",
        name: "research-findings",
        content: JSON.stringify(result, null, 2),
        mimeType: "application/json"
      }];
      return this.createSuccessResult(result, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("RESEARCH_ERROR", `Research failed: ${message}`, startTime);
    }
  }
  // ==========================================================================
  // Public Research Methods
  // ==========================================================================
  /**
   * Perform research based on query
   */
  async research(query, projectRoot) {
    this.logger.info("Starting research", { query: query.query, type: query.type });
    const findings = [];
    const patterns = [];
    let filesAnalyzed = 0;
    const kgFindings = await this.researchKnowledgeGraph(query);
    findings.push(...kgFindings);
    const codeFindings = await this.researchCodebase(query, projectRoot);
    findings.push(...codeFindings.findings);
    patterns.push(...codeFindings.patterns);
    filesAnalyzed = codeFindings.filesAnalyzed;
    if (query.type === "documentation" || query.type === "general") {
      const docFindings = await this.researchDocumentation(query, projectRoot);
      findings.push(...docFindings);
    }
    if (query.type === "pattern" || query.type === "general") {
      const detectedPatterns = await this.analyzePatterns(query.query, projectRoot);
      patterns.push(...detectedPatterns);
    }
    findings.sort((a, b) => b.relevance - a.relevance);
    const summary = this.generateSummary(query, findings, patterns);
    const recommendations = this.generateRecommendations(findings, patterns);
    return {
      query,
      findings: findings.slice(0, query.maxResults || 20),
      summary,
      filesAnalyzed,
      patterns,
      recommendations
    };
  }
  /**
   * Analyze patterns in the codebase
   */
  async analyzePatterns(query, projectRoot) {
    this.logger.debug("Analyzing patterns", { query });
    const patterns = [];
    if (this.knowledgeGraph) {
      const nodes = this.getRelevantNodes(query, 20);
      const patternNodes = nodes.filter(
        (n) => n.type === "technical" || n.tags.some((t) => t.includes("pattern"))
      );
      for (const node of patternNodes) {
        patterns.push({
          name: node.title,
          category: node.type,
          description: node.frontmatter.description || `Pattern from ${node.path}`,
          locations: [node.path],
          frequency: 1,
          recommended: node.status === "active",
          relatedPatterns: node.frontmatter.related
        });
      }
    }
    const detectedPatterns = await this.detectCodePatterns(projectRoot, query);
    patterns.push(...detectedPatterns);
    return patterns;
  }
  /**
   * Find references across the codebase
   */
  async findReferences(searchTerm, projectRoot, options) {
    this.logger.debug("Finding references", { searchTerm, projectRoot });
    const references = [];
    const filePatterns = options?.filePatterns || this.codePatterns;
    const maxResults = options?.maxResults || 50;
    try {
      const files = await this.findFiles(projectRoot, filePatterns);
      for (const file of files) {
        if (references.length >= maxResults) break;
        try {
          const content = await fs.readFile(file, "utf-8");
          const lines = content.split("\n");
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(searchTerm.toLowerCase())) {
              references.push({
                file: path.relative(projectRoot, file),
                line: i + 1,
                code: lines[i].trim(),
                context: this.getContext(lines, i),
                relevance: this.calculateRelevance(lines[i], searchTerm)
              });
            }
          }
        } catch {
        }
      }
    } catch (error) {
      this.logger.warn("Error finding references", { error });
    }
    return references.sort((a, b) => b.relevance - a.relevance).slice(0, maxResults);
  }
  /**
   * Summarize research findings
   */
  summarizeFindings(findings) {
    if (findings.length === 0) {
      return "No relevant findings were discovered.";
    }
    const bySource = {
      code: findings.filter((f) => f.source === "code"),
      documentation: findings.filter((f) => f.source === "documentation"),
      "knowledge-graph": findings.filter((f) => f.source === "knowledge-graph")
    };
    const parts = [
      `Found ${findings.length} relevant findings:`
    ];
    if (bySource.code.length > 0) {
      parts.push(`- ${bySource.code.length} from codebase analysis`);
    }
    if (bySource.documentation.length > 0) {
      parts.push(`- ${bySource.documentation.length} from documentation`);
    }
    if (bySource["knowledge-graph"].length > 0) {
      parts.push(`- ${bySource["knowledge-graph"].length} from knowledge graph`);
    }
    const topFindings = findings.slice(0, 3);
    if (topFindings.length > 0) {
      parts.push("\nTop findings:");
      for (const finding of topFindings) {
        parts.push(`- ${finding.title}: ${finding.description.slice(0, 100)}...`);
      }
    }
    return parts.join("\n");
  }
  // ==========================================================================
  // Private Research Methods
  // ==========================================================================
  /**
   * Get relevant nodes from knowledge graph
   */
  getRelevantNodes(query, limit = 10) {
    if (!this.knowledgeGraph) {
      return [];
    }
    const allNodes = this.knowledgeGraph.getAllNodes();
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);
    const scored = allNodes.map((node) => {
      let score = 0;
      const titleLower = node.title.toLowerCase();
      const contentLower = node.content.toLowerCase();
      for (const term of queryTerms) {
        if (titleLower.includes(term)) score += 10;
        if (node.tags.some((t) => t.toLowerCase().includes(term))) score += 5;
        if (contentLower.includes(term)) score += 1;
      }
      return { node, score };
    });
    return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.node);
  }
  /**
   * Research from knowledge graph
   */
  async researchKnowledgeGraph(query) {
    const findings = [];
    if (!this.knowledgeGraph) {
      return findings;
    }
    const nodes = this.getRelevantNodes(query.query, 15);
    for (const node of nodes) {
      findings.push({
        title: node.title,
        description: node.frontmatter.description || node.content.slice(0, 200),
        relevance: this.calculateNodeRelevance(node, query.query),
        source: "knowledge-graph",
        relatedNodes: this.knowledgeGraph.findRelated(node.id, 1).map((n) => n.title)
      });
    }
    return findings;
  }
  /**
   * Research from codebase
   */
  async researchCodebase(query, projectRoot) {
    const findings = [];
    const patterns = [];
    let filesAnalyzed = 0;
    try {
      const scope = query.scope?.length ? query.scope.map((s) => path.join(projectRoot, s)) : [projectRoot];
      for (const scopePath of scope) {
        const files = await this.findFiles(scopePath, this.codePatterns);
        filesAnalyzed += files.length;
        for (const file of files) {
          try {
            const content = await fs.readFile(file, "utf-8");
            const relativePath = path.relative(projectRoot, file);
            if (content.toLowerCase().includes(query.query.toLowerCase())) {
              const references = query.includeCode ? await this.findReferences(query.query, projectRoot, {
                maxResults: 5,
                filePatterns: [relativePath]
              }) : [];
              findings.push({
                title: `Match in ${path.basename(file)}`,
                description: `Found relevant content in ${relativePath}`,
                relevance: this.calculateContentRelevance(content, query.query),
                source: "code",
                references
              });
            }
          } catch {
          }
        }
      }
    } catch (error) {
      this.logger.warn("Error researching codebase", { error });
    }
    return { findings, patterns, filesAnalyzed };
  }
  /**
   * Research from documentation
   */
  async researchDocumentation(query, projectRoot) {
    const findings = [];
    try {
      const files = await this.findFiles(projectRoot, this.docPatterns);
      for (const file of files) {
        try {
          const content = await fs.readFile(file, "utf-8");
          const relativePath = path.relative(projectRoot, file);
          if (content.toLowerCase().includes(query.query.toLowerCase())) {
            findings.push({
              title: this.extractDocTitle(content) || path.basename(file),
              description: this.extractDocDescription(content, query.query),
              relevance: this.calculateContentRelevance(content, query.query),
              source: "documentation"
            });
          }
        } catch {
        }
      }
    } catch (error) {
      this.logger.warn("Error researching documentation", { error });
    }
    return findings;
  }
  /**
   * Detect code patterns
   */
  async detectCodePatterns(projectRoot, query) {
    const patterns = [];
    const patternCounts = {};
    const patternDetectors = [
      {
        name: "Singleton Pattern",
        regex: /getInstance\s*\(\)|private\s+static\s+instance/,
        category: "creational",
        description: "Singleton pattern for single instance management"
      },
      {
        name: "Factory Pattern",
        regex: /create[A-Z]\w+\s*\(|factory\s*[=:]/i,
        category: "creational",
        description: "Factory pattern for object creation"
      },
      {
        name: "Observer Pattern",
        regex: /subscribe\s*\(|addEventListener|on[A-Z]\w+\s*\(/,
        category: "behavioral",
        description: "Observer pattern for event handling"
      },
      {
        name: "Async/Await Pattern",
        regex: /async\s+\w+.*\{[\s\S]*?await\s+/,
        category: "async",
        description: "Modern async/await pattern"
      },
      {
        name: "Error Handling Pattern",
        regex: /try\s*\{[\s\S]*?\}\s*catch/,
        category: "error-handling",
        description: "Try-catch error handling pattern"
      },
      {
        name: "Dependency Injection",
        regex: /constructor\s*\([^)]*private\s+readonly|@Inject|@Injectable/,
        category: "structural",
        description: "Dependency injection pattern"
      }
    ];
    try {
      const files = await this.findFiles(projectRoot, this.codePatterns);
      for (const file of files) {
        try {
          const content = await fs.readFile(file, "utf-8");
          const relativePath = path.relative(projectRoot, file);
          for (const detector of patternDetectors) {
            if (detector.regex.test(content)) {
              if (!patternCounts[detector.name]) {
                patternCounts[detector.name] = {
                  locations: [],
                  description: detector.description
                };
              }
              patternCounts[detector.name].locations.push(relativePath);
            }
          }
        } catch {
        }
      }
    } catch (error) {
      this.logger.warn("Error detecting patterns", { error });
    }
    for (const [name, data] of Object.entries(patternCounts)) {
      if (data.locations.length > 0) {
        patterns.push({
          name,
          category: "detected",
          description: data.description,
          locations: data.locations,
          frequency: data.locations.length,
          recommended: true
        });
      }
    }
    return patterns.sort((a, b) => b.frequency - a.frequency);
  }
  // ==========================================================================
  // Utility Methods
  // ==========================================================================
  /**
   * Find files matching patterns
   */
  async findFiles(dir, patterns) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === "build" || entry.name.startsWith(".")) {
          continue;
        }
        if (entry.isDirectory()) {
          const subFiles = await this.findFiles(fullPath, patterns);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          for (const pattern of patterns) {
            const ext = pattern.replace("**/*", "");
            if (entry.name.endsWith(ext)) {
              files.push(fullPath);
              break;
            }
          }
        }
      }
    } catch {
    }
    return files;
  }
  /**
   * Get context around a line
   */
  getContext(lines, lineIndex, range = 2) {
    const start = Math.max(0, lineIndex - range);
    const end = Math.min(lines.length, lineIndex + range + 1);
    return lines.slice(start, end).join("\n");
  }
  /**
   * Calculate relevance of a match
   */
  calculateRelevance(line, searchTerm) {
    const lineLower = line.toLowerCase();
    const termLower = searchTerm.toLowerCase();
    let score = 0.5;
    if (lineLower.includes(termLower)) {
      score += 0.2;
    }
    if (new RegExp(`\\b${termLower}\\b`, "i").test(line)) {
      score += 0.2;
    }
    if (/^(export\s+)?(function|class|const|let|var|interface|type)\s+/.test(line)) {
      score += 0.1;
    }
    return Math.min(1, score);
  }
  /**
   * Calculate node relevance
   */
  calculateNodeRelevance(node, query) {
    const queryLower = query.toLowerCase();
    const terms = queryLower.split(/\s+/);
    let score = 0.3;
    for (const term of terms) {
      if (node.title.toLowerCase().includes(term)) score += 0.2;
      if (node.tags.some((t) => t.toLowerCase().includes(term))) score += 0.15;
      if (node.content.toLowerCase().includes(term)) score += 0.05;
    }
    return Math.min(1, score);
  }
  /**
   * Calculate content relevance
   */
  calculateContentRelevance(content, query) {
    const queryLower = query.toLowerCase();
    const terms = queryLower.split(/\s+/);
    let score = 0.3;
    let matchCount = 0;
    for (const term of terms) {
      const regex = new RegExp(term, "gi");
      const matches = content.match(regex);
      if (matches) {
        matchCount += matches.length;
      }
    }
    const density = matchCount / (content.length / 1e3);
    score += Math.min(0.5, density * 0.1);
    return Math.min(1, score);
  }
  /**
   * Extract title from documentation
   */
  extractDocTitle(content) {
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }
    const frontmatterMatch = content.match(/^---[\s\S]*?title:\s*(.+?)[\s\n]/m);
    if (frontmatterMatch) {
      return frontmatterMatch[1].replace(/['"]/g, "").trim();
    }
    return null;
  }
  /**
   * Extract description from documentation
   */
  extractDocDescription(content, query) {
    const queryLower = query.toLowerCase();
    const paragraphs = content.split(/\n\n+/);
    for (const para of paragraphs) {
      if (para.toLowerCase().includes(queryLower) && !para.startsWith("#")) {
        return para.slice(0, 200).trim() + (para.length > 200 ? "..." : "");
      }
    }
    for (const para of paragraphs) {
      if (!para.startsWith("#") && para.length > 20) {
        return para.slice(0, 200).trim() + (para.length > 200 ? "..." : "");
      }
    }
    return "Documentation content";
  }
  /**
   * Generate summary from findings
   */
  generateSummary(query, findings, patterns) {
    const parts = [
      `Research on "${query.query}" (${query.type}):`
    ];
    if (findings.length === 0 && patterns.length === 0) {
      return `No relevant findings for "${query.query}".`;
    }
    parts.push(`Found ${findings.length} relevant findings and ${patterns.length} patterns.`);
    if (findings.length > 0) {
      const topFinding = findings[0];
      parts.push(`Top finding: ${topFinding.title} (${Math.round(topFinding.relevance * 100)}% relevance)`);
    }
    if (patterns.length > 0) {
      const topPattern = patterns[0];
      parts.push(`Most common pattern: ${topPattern.name} (${topPattern.frequency} occurrences)`);
    }
    return parts.join("\n");
  }
  /**
   * Generate recommendations from research
   */
  generateRecommendations(findings, patterns) {
    const recommendations = [];
    const patternsByCategory = {};
    for (const pattern of patterns) {
      if (!patternsByCategory[pattern.category]) {
        patternsByCategory[pattern.category] = [];
      }
      patternsByCategory[pattern.category].push(pattern);
    }
    if (patternsByCategory["error-handling"]?.length) {
      recommendations.push("Good error handling patterns detected. Consider standardizing across the codebase.");
    }
    if (patternsByCategory["async"]?.length) {
      recommendations.push("Modern async/await patterns in use. Ensure consistent error handling in async code.");
    }
    if (!patternsByCategory["structural"]?.length) {
      recommendations.push("Consider implementing dependency injection for better testability.");
    }
    const docFindings = findings.filter((f) => f.source === "documentation");
    if (docFindings.length < findings.length * 0.2) {
      recommendations.push("Consider improving documentation coverage for this topic.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Review findings and patterns to identify improvement opportunities.");
    }
    return recommendations;
  }
}
export {
  ResearcherAgent
};
//# sourceMappingURL=researcher-agent.js.map
