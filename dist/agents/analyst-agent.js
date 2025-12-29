import * as fs from "fs/promises";
import * as path from "path";
import { BaseAgent } from "./base-agent.js";
import { AgentType } from "./types.js";
class AnalystAgent extends BaseAgent {
  /** File patterns to analyze */
  codePatterns = [".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"];
  /** Knowledge graph reference */
  knowledgeGraph = null;
  constructor(config) {
    super({
      type: AgentType.ANALYST,
      taskTimeout: 3e5,
      // 5 minutes for large projects
      capabilities: ["code-analysis", "metrics", "quality-assessment"],
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
   * Execute analyst task
   */
  async executeTask(task) {
    const startTime = /* @__PURE__ */ new Date();
    const taskType = task.input?.parameters?.taskType || "analyze";
    switch (taskType) {
      case "analyze":
        return this.handleAnalyzeTask(task, startTime);
      case "metrics":
        return this.handleMetricsTask(task, startTime);
      case "quality":
        return this.handleQualityTask(task, startTime);
      case "issues":
        return this.handleIssuesTask(task, startTime);
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
   * Analyze code and generate metrics
   */
  async analyzeCode(code, filePath) {
    this.logger.info("Analyzing code", { file: filePath });
    const metrics = await this.calculateCodeMetrics(code);
    const issues = this.findIssues(code, filePath);
    const dependencies = this.extractDependencies(code);
    const exports$1 = this.extractExports(code);
    return {
      path: filePath,
      type: path.extname(filePath).slice(1),
      linesOfCode: metrics.linesOfCode,
      complexity: metrics.cyclomaticComplexity,
      issues,
      dependencies,
      exports: exports$1
    };
  }
  /**
   * Calculate code metrics
   *
   * @remarks Renamed from calculateMetrics to avoid conflict with BaseAgent private method
   */
  async calculateCodeMetrics(code) {
    this.logger.debug("Calculating metrics");
    const lines = code.split("\n");
    const totalLines = lines.length;
    const blankLines = lines.filter((l) => l.trim().length === 0).length;
    const commentLines = this.countCommentLines(code);
    const linesOfCode = totalLines - blankLines - commentLines;
    const functionCount = this.countFunctions(code);
    const classCount = this.countClasses(code);
    const avgFunctionLength = this.calculateAverageFunctionLength(code);
    const maxFunctionLength = this.calculateMaxFunctionLength(code);
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
    const cognitiveComplexity = this.calculateCognitiveComplexity(code);
    const halsteadVolume = Math.log2(linesOfCode + 1) * linesOfCode;
    const maintainabilityIndex = Math.max(
      0,
      Math.min(
        100,
        171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomaticComplexity - 16.2 * Math.log(linesOfCode)
      )
    );
    const technicalDebt = this.estimateTechnicalDebt(
      linesOfCode,
      cyclomaticComplexity,
      maintainabilityIndex
    );
    return {
      totalLines,
      linesOfCode,
      commentLines,
      blankLines,
      fileCount: 1,
      functionCount,
      classCount,
      avgFunctionLength: Math.round(avgFunctionLength),
      maxFunctionLength,
      cyclomaticComplexity,
      cognitiveComplexity,
      maintainabilityIndex: Math.round(maintainabilityIndex),
      technicalDebt
    };
  }
  /**
   * Assess code quality
   */
  async assessQuality(code, filePath) {
    this.logger.info("Assessing quality", { file: filePath });
    const metrics = await this.calculateCodeMetrics(code);
    const issues = this.findIssues(code, filePath);
    const recommendations = this.generateRecommendations(metrics, issues);
    const score = this.calculateQualityScore(metrics, issues);
    const grade = this.scoreToGrade(score);
    return {
      score,
      grade,
      metrics,
      issues,
      recommendations,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Find issues in code
   */
  findIssues(code, filePath) {
    this.logger.debug("Finding issues", { file: filePath });
    const issues = [];
    const lines = code.split("\n");
    issues.push(...this.findComplexityIssues(code, lines, filePath));
    issues.push(...this.findStyleIssues(code, lines, filePath));
    issues.push(...this.findSecurityIssues(code, lines, filePath));
    issues.push(...this.findMaintainabilityIssues(code, lines, filePath));
    return issues.sort((a, b) => {
      const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
  /**
   * Analyze entire project
   */
  async analyzeProject(projectRoot) {
    this.logger.info("Analyzing project", { root: projectRoot });
    const files = await this.findFiles(projectRoot);
    const fileAnalyses = [];
    let aggregatedMetrics = this.createEmptyMetrics();
    const allIssues = [];
    const allDependencies = /* @__PURE__ */ new Set();
    const allExports = /* @__PURE__ */ new Set();
    for (const file of files) {
      try {
        const content = await fs.readFile(file, "utf-8");
        const analysis = await this.analyzeCode(content, path.relative(projectRoot, file));
        fileAnalyses.push(analysis);
        allIssues.push(...analysis.issues);
        analysis.dependencies.forEach((d) => allDependencies.add(d));
        analysis.exports.forEach((e) => allExports.add(e));
        const metrics = await this.calculateCodeMetrics(content);
        aggregatedMetrics = this.aggregateMetrics(aggregatedMetrics, metrics);
      } catch (error) {
        this.logger.warn(`Failed to analyze ${file}`, { error });
      }
    }
    const score = this.calculateQualityScore(aggregatedMetrics, allIssues);
    const grade = this.scoreToGrade(score);
    const recommendations = this.generateRecommendations(aggregatedMetrics, allIssues);
    const hotspots = this.identifyHotspots(fileAnalyses);
    const dependencies = this.analyzeDependencies(
      fileAnalyses,
      allDependencies,
      allExports
    );
    return {
      name: path.basename(projectRoot),
      rootPath: projectRoot,
      quality: {
        score,
        grade,
        metrics: aggregatedMetrics,
        issues: allIssues,
        recommendations,
        timestamp: /* @__PURE__ */ new Date()
      },
      files: fileAnalyses,
      dependencies,
      hotspots
    };
  }
  // ==========================================================================
  // Private Task Handlers
  // ==========================================================================
  async handleAnalyzeTask(task, startTime) {
    const input = task.input?.data;
    if (input?.projectRoot) {
      try {
        const analysis = await this.analyzeProject(input.projectRoot);
        return this.createSuccessResult(analysis, startTime);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return this.createErrorResult("ANALYSIS_ERROR", `Project analysis failed: ${message}`, startTime);
      }
    }
    if (input?.code && input?.filePath) {
      try {
        const analysis = await this.analyzeCode(input.code, input.filePath);
        return this.createSuccessResult(analysis, startTime);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return this.createErrorResult("ANALYSIS_ERROR", `Code analysis failed: ${message}`, startTime);
      }
    }
    return this.createErrorResult(
      "VALIDATION_ERROR",
      "Either projectRoot or code+filePath is required",
      startTime
    );
  }
  async handleMetricsTask(task, startTime) {
    const input = task.input?.data;
    if (!input?.code) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Code is required for metrics calculation",
        startTime
      );
    }
    try {
      const metrics = await this.calculateCodeMetrics(input.code);
      return this.createSuccessResult(metrics, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("METRICS_ERROR", `Metrics calculation failed: ${message}`, startTime);
    }
  }
  async handleQualityTask(task, startTime) {
    const input = task.input?.data;
    if (!input?.code) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Code and file path are required for quality assessment",
        startTime
      );
    }
    try {
      const assessment = await this.assessQuality(input.code, input.filePath);
      return this.createSuccessResult(assessment, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("QUALITY_ERROR", `Quality assessment failed: ${message}`, startTime);
    }
  }
  async handleIssuesTask(task, startTime) {
    const input = task.input?.data;
    if (!input?.code) {
      return this.createErrorResult(
        "VALIDATION_ERROR",
        "Code and file path are required for issue detection",
        startTime
      );
    }
    try {
      const issues = this.findIssues(input.code, input.filePath);
      return this.createSuccessResult(issues, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult("ISSUES_ERROR", `Issue detection failed: ${message}`, startTime);
    }
  }
  // ==========================================================================
  // Metrics Calculation
  // ==========================================================================
  countCommentLines(code) {
    let count = 0;
    let inBlockComment = false;
    for (const line of code.split("\n")) {
      const trimmed = line.trim();
      if (inBlockComment) {
        count++;
        if (trimmed.includes("*/")) {
          inBlockComment = false;
        }
      } else if (trimmed.startsWith("//")) {
        count++;
      } else if (trimmed.startsWith("/*")) {
        count++;
        if (!trimmed.includes("*/")) {
          inBlockComment = true;
        }
      }
    }
    return count;
  }
  countFunctions(code) {
    const patterns = [
      /function\s+\w+/g,
      /\w+\s*[=:]\s*(?:async\s+)?function/g,
      /\w+\s*[=:]\s*(?:async\s+)?\([^)]*\)\s*=>/g,
      /(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/g
    ];
    let count = 0;
    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }
    return count;
  }
  countClasses(code) {
    const matches = code.match(/\bclass\s+\w+/g);
    return matches ? matches.length : 0;
  }
  calculateAverageFunctionLength(code) {
    const functionCount = this.countFunctions(code);
    if (functionCount === 0) return 0;
    const lines = code.split("\n").filter((l) => l.trim().length > 0);
    return lines.length / functionCount;
  }
  calculateMaxFunctionLength(code) {
    let maxLength = 0;
    let currentLength = 0;
    let braceCount = 0;
    let inFunction = false;
    for (const line of code.split("\n")) {
      if (/(?:function|=>)\s*\{?/.test(line) && !inFunction) {
        inFunction = true;
        currentLength = 0;
      }
      if (inFunction) {
        currentLength++;
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        if (braceCount <= 0) {
          maxLength = Math.max(maxLength, currentLength);
          inFunction = false;
          currentLength = 0;
        }
      }
    }
    return maxLength;
  }
  calculateCyclomaticComplexity(code) {
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
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }
    return complexity;
  }
  calculateCognitiveComplexity(code) {
    let complexity = 0;
    let nestingLevel = 0;
    for (const line of code.split("\n")) {
      if (/\b(if|for|while|switch)\s*\(/.test(line)) {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      }
      if (/\belse\b/.test(line)) {
        complexity += 1;
      }
      const closingBraces = (line.match(/}/g) || []).length;
      nestingLevel = Math.max(0, nestingLevel - closingBraces);
      const logicalOps = (line.match(/&&|\|\|/g) || []).length;
      complexity += logicalOps;
    }
    return complexity;
  }
  estimateTechnicalDebt(linesOfCode, complexity, maintainability) {
    const complexityDebt = Math.max(0, complexity - 10) * 0.5;
    const maintainabilityDebt = Math.max(0, 100 - maintainability) * 0.1;
    const sizeDebt = Math.max(0, linesOfCode - 500) * 0.01;
    return Math.round((complexityDebt + maintainabilityDebt + sizeDebt) * 10) / 10;
  }
  // ==========================================================================
  // Issue Detection
  // ==========================================================================
  findComplexityIssues(code, lines, filePath) {
    const issues = [];
    let maxNesting = 0;
    let maxNestingLine = 0;
    let currentNesting = 0;
    for (let i = 0; i < lines.length; i++) {
      currentNesting += (lines[i].match(/{/g) || []).length;
      currentNesting -= (lines[i].match(/}/g) || []).length;
      if (currentNesting > maxNesting) {
        maxNesting = currentNesting;
        maxNestingLine = i + 1;
      }
    }
    if (maxNesting > 4) {
      issues.push({
        type: "complexity",
        severity: maxNesting > 6 ? "error" : "warning",
        message: `Deep nesting detected (${maxNesting} levels)`,
        file: filePath,
        line: maxNestingLine,
        rule: "max-depth",
        suggestion: "Consider extracting nested logic into separate functions"
      });
    }
    const complexity = this.calculateCyclomaticComplexity(code);
    if (complexity > 15) {
      issues.push({
        type: "complexity",
        severity: complexity > 25 ? "error" : "warning",
        message: `High cyclomatic complexity (${complexity})`,
        file: filePath,
        rule: "complexity",
        suggestion: "Break down complex functions into smaller, focused ones"
      });
    }
    return issues;
  }
  findStyleIssues(code, lines, filePath) {
    const issues = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("console.log")) {
        issues.push({
          type: "style",
          severity: "warning",
          message: "Unexpected console.log statement",
          file: filePath,
          line: i + 1,
          rule: "no-console",
          suggestion: "Remove or replace with proper logging"
        });
      }
    }
    for (let i = 0; i < lines.length; i++) {
      if (/\bvar\s+/.test(lines[i])) {
        issues.push({
          type: "style",
          severity: "warning",
          message: "Use const or let instead of var",
          file: filePath,
          line: i + 1,
          rule: "no-var",
          suggestion: "Replace var with const or let"
        });
      }
    }
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 120) {
        issues.push({
          type: "style",
          severity: "info",
          message: `Line too long (${lines[i].length} characters)`,
          file: filePath,
          line: i + 1,
          rule: "max-len",
          suggestion: "Break long lines for better readability"
        });
      }
    }
    return issues;
  }
  findSecurityIssues(code, lines, filePath) {
    const issues = [];
    for (let i = 0; i < lines.length; i++) {
      if (/\beval\s*\(/.test(lines[i])) {
        issues.push({
          type: "security",
          severity: "critical",
          message: "Avoid using eval()",
          file: filePath,
          line: i + 1,
          rule: "no-eval",
          suggestion: "Use safer alternatives to eval"
        });
      }
    }
    for (let i = 0; i < lines.length; i++) {
      if (/(?:password|secret|api_key|apikey)\s*[:=]\s*['"][^'"]+['"]/i.test(lines[i])) {
        issues.push({
          type: "security",
          severity: "critical",
          message: "Potential hardcoded secret detected",
          file: filePath,
          line: i + 1,
          rule: "no-secrets",
          suggestion: "Use environment variables for secrets"
        });
      }
    }
    for (let i = 0; i < lines.length; i++) {
      if (/\.innerHTML\s*=/.test(lines[i])) {
        issues.push({
          type: "security",
          severity: "warning",
          message: "Avoid using innerHTML, potential XSS vulnerability",
          file: filePath,
          line: i + 1,
          rule: "no-inner-html",
          suggestion: "Use textContent or sanitize HTML"
        });
      }
    }
    return issues;
  }
  findMaintainabilityIssues(code, lines, filePath) {
    const issues = [];
    for (let i = 0; i < lines.length; i++) {
      if (/\/\/\s*(TODO|FIXME|HACK|XXX)/i.test(lines[i])) {
        const match = lines[i].match(/\/\/\s*(TODO|FIXME|HACK|XXX)/i);
        issues.push({
          type: "maintainability",
          severity: "info",
          message: `${match[1]} comment found`,
          file: filePath,
          line: i + 1,
          rule: "no-warning-comments",
          suggestion: "Address and remove the comment"
        });
      }
    }
    for (let i = 0; i < lines.length; i++) {
      if (/[^a-zA-Z]\d{3,}[^a-zA-Z]/.test(lines[i]) && !lines[i].includes("//")) {
        issues.push({
          type: "maintainability",
          severity: "info",
          message: "Magic number detected",
          file: filePath,
          line: i + 1,
          rule: "no-magic-numbers",
          suggestion: "Extract to a named constant"
        });
      }
    }
    for (let i = 0; i < lines.length; i++) {
      if (/:\s*any\b/.test(lines[i])) {
        issues.push({
          type: "maintainability",
          severity: "warning",
          message: "Avoid using any type",
          file: filePath,
          line: i + 1,
          rule: "no-any",
          suggestion: "Use a more specific type"
        });
      }
    }
    return issues;
  }
  // ==========================================================================
  // Quality Scoring
  // ==========================================================================
  calculateQualityScore(metrics, issues) {
    let score = 100;
    if (metrics.cyclomaticComplexity > 10) {
      score -= Math.min(20, (metrics.cyclomaticComplexity - 10) * 2);
    }
    score -= Math.max(0, 50 - metrics.maintainabilityIndex) * 0.5;
    const issueDeductions = {
      critical: 10,
      error: 5,
      warning: 2,
      info: 0.5
    };
    for (const issue of issues) {
      score -= issueDeductions[issue.severity];
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  scoreToGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }
  // ==========================================================================
  // Recommendations
  // ==========================================================================
  generateRecommendations(metrics, issues) {
    const recommendations = [];
    if (metrics.cyclomaticComplexity > 15) {
      recommendations.push(
        "Reduce cyclomatic complexity by breaking down complex functions"
      );
    }
    if (metrics.maintainabilityIndex < 50) {
      recommendations.push(
        "Improve code maintainability through refactoring and documentation"
      );
    }
    if (metrics.avgFunctionLength > 30) {
      recommendations.push(
        "Keep functions shorter (under 30 lines) for better readability"
      );
    }
    const criticalIssues = issues.filter((i) => i.severity === "critical");
    if (criticalIssues.length > 0) {
      recommendations.push(
        `Address ${criticalIssues.length} critical issue(s) immediately`
      );
    }
    const securityIssues = issues.filter((i) => i.type === "security");
    if (securityIssues.length > 0) {
      recommendations.push(
        `Fix ${securityIssues.length} security issue(s) to improve safety`
      );
    }
    if (metrics.commentLines / metrics.linesOfCode < 0.1) {
      recommendations.push(
        "Consider adding more documentation comments"
      );
    }
    if (recommendations.length === 0) {
      recommendations.push("Code quality is good! Keep up the good work.");
    }
    return recommendations;
  }
  // ==========================================================================
  // Helper Methods
  // ==========================================================================
  createEmptyMetrics() {
    return {
      totalLines: 0,
      linesOfCode: 0,
      commentLines: 0,
      blankLines: 0,
      fileCount: 0,
      functionCount: 0,
      classCount: 0,
      avgFunctionLength: 0,
      maxFunctionLength: 0,
      cyclomaticComplexity: 0,
      cognitiveComplexity: 0,
      maintainabilityIndex: 100,
      technicalDebt: 0
    };
  }
  aggregateMetrics(current, additional) {
    return {
      totalLines: current.totalLines + additional.totalLines,
      linesOfCode: current.linesOfCode + additional.linesOfCode,
      commentLines: current.commentLines + additional.commentLines,
      blankLines: current.blankLines + additional.blankLines,
      fileCount: current.fileCount + 1,
      functionCount: current.functionCount + additional.functionCount,
      classCount: current.classCount + additional.classCount,
      avgFunctionLength: Math.round(
        (current.avgFunctionLength * current.fileCount + additional.avgFunctionLength) / (current.fileCount + 1)
      ),
      maxFunctionLength: Math.max(current.maxFunctionLength, additional.maxFunctionLength),
      cyclomaticComplexity: current.cyclomaticComplexity + additional.cyclomaticComplexity,
      cognitiveComplexity: current.cognitiveComplexity + additional.cognitiveComplexity,
      maintainabilityIndex: Math.round(
        (current.maintainabilityIndex * current.fileCount + additional.maintainabilityIndex) / (current.fileCount + 1)
      ),
      technicalDebt: current.technicalDebt + additional.technicalDebt
    };
  }
  extractDependencies(code) {
    const dependencies = [];
    const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      dependencies.push(match[1]);
    }
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(code)) !== null) {
      dependencies.push(match[1]);
    }
    return [...new Set(dependencies)];
  }
  extractExports(code) {
    const exports$1 = [];
    const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(code)) !== null) {
      exports$1.push(match[1]);
    }
    const exportDeclRegex = /export\s*\{([^}]+)\}/g;
    while ((match = exportDeclRegex.exec(code)) !== null) {
      const names = match[1].split(",").map((n) => n.trim().split(/\s+as\s+/)[0]);
      exports$1.push(...names);
    }
    return [...new Set(exports$1.filter((e) => e))];
  }
  identifyHotspots(files) {
    const hotspots = [];
    for (const file of files) {
      if (file.complexity > 20) {
        hotspots.push({
          file: file.path,
          reason: `High complexity (${file.complexity})`,
          severity: file.complexity > 30 ? "high" : "medium"
        });
      }
      const criticalIssues = file.issues.filter((i) => i.severity === "critical");
      if (criticalIssues.length > 0) {
        hotspots.push({
          file: file.path,
          reason: `${criticalIssues.length} critical issue(s)`,
          severity: "high"
        });
      }
      if (file.linesOfCode > 500) {
        hotspots.push({
          file: file.path,
          reason: `Large file (${file.linesOfCode} LOC)`,
          severity: file.linesOfCode > 1e3 ? "high" : "medium"
        });
      }
    }
    return hotspots.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });
  }
  analyzeDependencies(files, allDependencies, allExports) {
    const internal = [];
    const external = [];
    for (const dep of allDependencies) {
      if (dep.startsWith(".") || dep.startsWith("/")) {
        internal.push(dep);
      } else {
        external.push(dep);
      }
    }
    return {
      internal: [...new Set(internal)],
      external: [...new Set(external)],
      unused: [],
      // Would require deeper analysis
      missing: []
      // Would require package.json parsing
    };
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
  AnalystAgent
};
//# sourceMappingURL=analyst-agent.js.map
