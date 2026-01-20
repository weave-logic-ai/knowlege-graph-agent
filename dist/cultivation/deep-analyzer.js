import { execFileSync, execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { resolve, join, extname, relative, basename } from "path";
import { createLogger } from "../utils/logger.js";
import { SOPPriority } from "../sops/types.js";
import "../sops/registry.js";
import { checkCompliance } from "../sops/compliance-checker.js";
import { analyzeGaps } from "../sops/gap-analyzer.js";
import "../sops/overlay-manager.js";
const logger = createLogger("deep-analyzer");
class DeepAnalyzer {
  projectRoot;
  docsPath;
  outputDir;
  verbose;
  maxDocuments;
  agentTimeout;
  forceApiKey;
  preferredProvider;
  constructor(options) {
    this.projectRoot = resolve(options.projectRoot);
    this.docsPath = options.docsPath || "docs";
    this.outputDir = options.outputDir || join(this.projectRoot, this.docsPath, "analysis");
    this.verbose = options.verbose || false;
    this.maxDocuments = options.maxDocuments || 50;
    this.agentTimeout = options.agentTimeout || 12e4;
    this.forceApiKey = options.forceApiKey || false;
    this.preferredProvider = options.preferredProvider || "anthropic";
  }
  /**
   * Check if running inside a Claude Code session
   */
  isInsideClaudeCode() {
    return process.env.CLAUDECODE === "1" || process.env.CLAUDE_CODE === "1";
  }
  /**
   * Check if Anthropic API key is available
   */
  hasAnthropicApiKey() {
    return !!process.env.ANTHROPIC_API_KEY;
  }
  /**
   * Check if Google AI / Gemini API key is available
   */
  hasGeminiApiKey() {
    return !!(process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  }
  /**
   * Get the Gemini API key from available env vars
   */
  getGeminiApiKey() {
    return process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }
  /**
   * Check if Claude CLI is available
   */
  isCliAvailable() {
    try {
      execFileSync("claude", ["--version"], {
        stdio: "pipe",
        timeout: 5e3,
        windowsHide: true
      });
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Determine the best execution mode
   */
  detectExecutionMode() {
    const insideClaudeCode = this.isInsideClaudeCode();
    const hasAnthropicKey = this.hasAnthropicApiKey();
    const hasGeminiKey = this.hasGeminiApiKey();
    const cliAvailable = this.isCliAvailable();
    if (this.forceApiKey) {
      if (this.preferredProvider === "gemini" && hasGeminiKey) {
        return { mode: "gemini", reason: "Using Gemini API (forced, preferred)" };
      }
      if (hasAnthropicKey) {
        return { mode: "anthropic", reason: "Using Anthropic API (forced)" };
      }
      if (hasGeminiKey) {
        return { mode: "gemini", reason: "Using Gemini API (forced, fallback)" };
      }
      return { mode: "unavailable", reason: "No API key found. Set ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY." };
    }
    if (this.preferredProvider === "gemini" && hasGeminiKey) {
      return { mode: "gemini", reason: "Using Gemini API (preferred)" };
    }
    if (hasAnthropicKey) {
      return { mode: "anthropic", reason: "Using Anthropic API" };
    }
    if (hasGeminiKey) {
      return { mode: "gemini", reason: "Using Gemini API" };
    }
    if (insideClaudeCode) {
      return {
        mode: "unavailable",
        reason: "Cannot run inside Claude Code without an API key. Set ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY."
      };
    }
    if (cliAvailable) {
      return { mode: "cli", reason: "Using Claude CLI (no API key found)" };
    }
    return {
      mode: "unavailable",
      reason: "No execution method available. Set ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY."
    };
  }
  /**
   * Check if analysis is available
   */
  async isAvailable() {
    const mode = this.detectExecutionMode();
    return mode.mode !== "unavailable";
  }
  /**
   * Get availability status with reason
   */
  async getAvailabilityStatus() {
    const mode = this.detectExecutionMode();
    return {
      available: mode.mode !== "unavailable",
      reason: mode.reason
    };
  }
  /**
   * Scan documentation directory for markdown files
   */
  scanDocumentation() {
    const docsDir = join(this.projectRoot, this.docsPath);
    if (!existsSync(docsDir)) {
      return [];
    }
    const documents = [];
    const scan = (dir) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "analysis") {
          continue;
        }
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (entry.isFile() && extname(entry.name) === ".md") {
          try {
            const content = readFileSync(fullPath, "utf-8");
            const stats = statSync(fullPath);
            const relPath = relative(docsDir, fullPath);
            const titleMatch = content.match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1] : basename(entry.name, ".md");
            let type = "general";
            if (relPath.includes("concepts/")) type = "concept";
            else if (relPath.includes("components/")) type = "component";
            else if (relPath.includes("services/")) type = "service";
            else if (relPath.includes("features/")) type = "feature";
            else if (relPath.includes("guides/")) type = "guide";
            else if (relPath.includes("standards/")) type = "standard";
            else if (relPath.includes("references/")) type = "reference";
            else if (relPath.includes("integrations/")) type = "integration";
            else if (entry.name.includes("requirement")) type = "requirement";
            else if (entry.name.includes("spec")) type = "specification";
            const preview = content.slice(0, 2e3).replace(/^#.+\n/, "").trim().slice(0, 500);
            documents.push({
              path: relPath,
              title,
              type,
              size: stats.size,
              preview
            });
          } catch {
          }
        }
      }
    };
    scan(docsDir);
    return documents.slice(0, this.maxDocuments);
  }
  /**
   * Read full content of key documents
   */
  readKeyDocuments() {
    const docsDir = join(this.projectRoot, this.docsPath);
    const keyDocs = /* @__PURE__ */ new Map();
    const priorityFiles = [
      "README.md",
      "MOC.md",
      "PRIMITIVES.md",
      "original_specs.md",
      "business_requirements_document.md",
      "technical_requirements.md",
      "test_strategy.md"
    ];
    for (const file of priorityFiles) {
      const filePath = join(docsDir, file);
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, "utf-8");
          keyDocs.set(file, content.slice(0, 15e3));
        } catch {
        }
      }
    }
    return keyDocs;
  }
  /**
   * Scan directory structure for MOC files and coverage
   */
  scanDirectoryStructure() {
    const docsDir = join(this.projectRoot, this.docsPath);
    if (!existsSync(docsDir)) {
      return [];
    }
    const directories = [];
    const ignoredDirs = /* @__PURE__ */ new Set([".", "..", "analysis", "node_modules", ".git", ".obsidian"]);
    const scanDir = (dir, depth = 0) => {
      if (depth > 5) return;
      const relPath = relative(docsDir, dir) || ".";
      const entries = readdirSync(dir, { withFileTypes: true });
      const subdirs = [];
      const docs = [];
      let mocFile = null;
      let mocContent = "";
      for (const entry of entries) {
        if (ignoredDirs.has(entry.name) || entry.name.startsWith(".")) continue;
        if (entry.isDirectory()) {
          subdirs.push(entry.name);
          scanDir(join(dir, entry.name), depth + 1);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          docs.push(entry.name);
          if (entry.name === "_MOC.md" || entry.name === "MOC.md" || entry.name === "index.md") {
            mocFile = entry.name;
            try {
              mocContent = readFileSync(join(dir, entry.name), "utf-8");
            } catch {
              mocContent = "";
            }
          }
        }
      }
      let mocStatus = "missing";
      if (mocFile) {
        if (mocContent.length < 100) {
          mocStatus = "empty";
        } else if (mocContent.toLowerCase().includes("stub") || mocContent.includes("TODO") || mocContent.includes("TBD") || !mocContent.includes("[[")) {
          mocStatus = "stub";
        } else {
          mocStatus = "complete";
        }
      }
      let needsDocumentation = false;
      let reason = "";
      if (subdirs.length > 0 || docs.length > 1) {
        if (mocStatus === "missing") {
          needsDocumentation = true;
          reason = "Directory has content but no MOC file";
        } else if (mocStatus === "empty" || mocStatus === "stub") {
          needsDocumentation = true;
          reason = `MOC file is ${mocStatus} - needs content`;
        }
      }
      if (subdirs.length > 0 || docs.length > 0 || relPath === ".") {
        directories.push({
          path: relPath,
          name: basename(dir),
          hasMOC: mocFile !== null,
          mocStatus,
          documentCount: docs.length,
          subdirectories: subdirs,
          documents: docs,
          needsDocumentation,
          reason
        });
      }
    };
    scanDir(docsDir);
    return directories;
  }
  /**
   * Load previous analysis results for iteration tracking
   */
  loadPreviousAnalysis() {
    const metadataFile = join(this.outputDir, ".analysis-metadata.json");
    if (!existsSync(metadataFile)) {
      return null;
    }
    try {
      const content = readFileSync(metadataFile, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  /**
   * Save analysis metadata for iteration tracking
   */
  saveAnalysisMetadata(result, dirCoverage) {
    const metadataFile = join(this.outputDir, ".analysis-metadata.json");
    const previous = this.loadPreviousAnalysis();
    const totalDirs = dirCoverage.length;
    const coveredDirs = dirCoverage.filter((d) => d.mocStatus === "complete").length;
    const coverageScore = totalDirs > 0 ? coveredDirs / totalDirs * 100 : 0;
    const gapsResult = result.results.find((r) => r.type === "gaps");
    const questionsResult = result.results.find((r) => r.type === "research");
    const coverageResult = result.results.find((r) => r.type === "coverage");
    const metadata = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      iteration: (previous?.iteration || 0) + 1,
      gapsIdentified: (gapsResult?.insights.length || 0) + (coverageResult?.insights.length || 0),
      gapsFilled: 0,
      // Updated by migrate command
      questionsRaised: questionsResult?.insights.length || 0,
      questionsAnswered: 0,
      // Updated by migrate command
      coverageScore
    };
    try {
      writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    } catch {
    }
  }
  /**
   * Run deep analysis
   */
  async analyze() {
    const startTime = Date.now();
    const executionMode = this.detectExecutionMode();
    const result = {
      success: false,
      agentsSpawned: 0,
      insightsCount: 0,
      documentsCreated: 0,
      results: [],
      duration: 0,
      errors: [],
      mode: executionMode.mode === "unavailable" ? "static" : executionMode.mode
    };
    if (executionMode.mode === "unavailable") {
      result.errors.push(executionMode.reason);
      result.duration = Date.now() - startTime;
      logger.error("Deep analysis unavailable", new Error(executionMode.reason));
      return result;
    }
    logger.info(`Starting documentation cultivation`, { mode: executionMode.mode, reason: executionMode.reason });
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
    const documents = this.scanDocumentation();
    const keyDocs = this.readKeyDocuments();
    const dirCoverage = this.scanDirectoryStructure();
    const previousAnalysis = this.loadPreviousAnalysis();
    if (documents.length === 0) {
      result.errors.push("No markdown documents found in docs directory");
      result.duration = Date.now() - startTime;
      return result;
    }
    const iteration = (previousAnalysis?.iteration || 0) + 1;
    logger.info("Found documentation", {
      documents: documents.length,
      keyDocs: keyDocs.size,
      directories: dirCoverage.length,
      needsWork: dirCoverage.filter((d) => d.needsDocumentation).length,
      iteration
    });
    const sopCompliance = await this.runSOPComplianceCheck();
    const sopGaps = sopCompliance ? this.runSOPGapAnalysis(sopCompliance) : void 0;
    const agents = [
      {
        name: "Vision Synthesizer",
        type: "vision",
        task: "Synthesize the project vision, goals, and core value proposition from the documentation",
        outputFile: "vision-synthesis.md"
      },
      {
        name: "Directory Coverage Analyst",
        type: "coverage",
        task: "Analyze directory structure, MOC files, and identify areas needing documentation",
        outputFile: "directory-coverage.md"
      },
      {
        name: "Gap Analyst",
        type: "gaps",
        task: "Identify documentation gaps, missing sections, and areas that need more detail",
        outputFile: "documentation-gaps.md"
      },
      {
        name: "Research Guide",
        type: "research",
        task: "Generate research questions and areas that need further investigation or clarification",
        outputFile: "research-questions.md"
      },
      {
        name: "Connection Mapper",
        type: "connections",
        task: "Identify relationships between concepts and suggest knowledge graph connections",
        outputFile: "knowledge-connections.md"
      },
      {
        name: "SOP Compliance Analyst",
        type: "sop",
        task: "Analyze AI-SDLC SOP compliance gaps and recommend documentation to address them",
        outputFile: "sop-compliance-gaps.md"
      }
    ];
    logger.info("Executing cultivation agents", {
      agents: agents.length,
      mode: "sequential",
      iteration,
      sopGapsCount: sopGaps?.totalGaps || 0
    });
    for (const agent of agents) {
      const agentResult = await this.executeAgent(
        agent,
        executionMode.mode,
        documents,
        keyDocs,
        dirCoverage,
        previousAnalysis,
        sopGaps
      );
      result.results.push(agentResult);
    }
    result.sopCompliance = sopCompliance;
    result.sopGaps = sopGaps;
    this.saveAnalysisMetadata(result, dirCoverage);
    result.agentsSpawned = result.results.length;
    result.insightsCount = result.results.reduce((sum, r) => sum + r.insights.length, 0);
    result.documentsCreated = result.results.reduce((sum, r) => sum + r.documents.length, 0);
    result.success = result.results.some((r) => r.success);
    result.duration = Date.now() - startTime;
    for (const agentResult of result.results) {
      if (agentResult.error) {
        result.errors.push(`${agentResult.name}: ${agentResult.error}`);
      }
    }
    logger.info("Documentation cultivation complete", {
      success: result.success,
      insights: result.insightsCount,
      documents: result.documentsCreated,
      duration: result.duration
    });
    return result;
  }
  /**
   * Execute a single agent
   */
  async executeAgent(agent, mode, documents, keyDocs, dirCoverage, previousAnalysis, sopGaps) {
    const startTime = Date.now();
    const outputPath = join(this.outputDir, agent.outputFile);
    const result = {
      name: agent.name,
      type: agent.type,
      success: false,
      insights: [],
      documents: [],
      duration: 0
    };
    try {
      logger.info(`Executing agent: ${agent.name}`, { type: agent.type, mode });
      const prompt = this.buildPrompt(agent, documents, keyDocs, dirCoverage, previousAnalysis, sopGaps);
      let output;
      if (mode === "cli") {
        output = await this.runWithCli(prompt);
      } else if (mode === "anthropic") {
        output = await this.runWithAnthropic(prompt);
      } else {
        output = await this.runWithGemini(prompt);
      }
      result.insights = this.extractInsights(output);
      writeFileSync(outputPath, this.formatOutput(agent, output, mode));
      result.documents.push({ path: outputPath, title: agent.name });
      result.success = true;
      if (this.verbose) {
        logger.debug(`Agent completed: ${agent.name}`, { insights: result.insights.length });
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      logger.error(`Agent failed: ${agent.name}`, error instanceof Error ? error : new Error(String(error)));
    }
    result.duration = Date.now() - startTime;
    return result;
  }
  /**
   * Build directory coverage summary for prompts
   */
  buildCoverageSummary(dirCoverage) {
    const lines = [];
    const total = dirCoverage.length;
    const complete = dirCoverage.filter((d) => d.mocStatus === "complete").length;
    const stub = dirCoverage.filter((d) => d.mocStatus === "stub").length;
    const empty = dirCoverage.filter((d) => d.mocStatus === "empty").length;
    const missing = dirCoverage.filter((d) => d.mocStatus === "missing").length;
    lines.push(`### Summary`);
    lines.push(`- Total Directories: ${total}`);
    lines.push(`- Complete MOCs: ${complete} (${(complete / total * 100).toFixed(1)}%)`);
    lines.push(`- Stub MOCs: ${stub}`);
    lines.push(`- Empty MOCs: ${empty}`);
    lines.push(`- Missing MOCs: ${missing}`);
    lines.push(`- Coverage Score: ${(complete / total * 100).toFixed(1)}%`);
    lines.push("");
    const needsWork = dirCoverage.filter((d) => d.needsDocumentation);
    if (needsWork.length > 0) {
      lines.push("### Directories Needing Documentation");
      for (const dir of needsWork) {
        lines.push(`- **${dir.path}/** (${dir.mocStatus})`);
        lines.push(`  - Documents: ${dir.documents.join(", ") || "none"}`);
        lines.push(`  - Subdirectories: ${dir.subdirectories.join(", ") || "none"}`);
        lines.push(`  - Reason: ${dir.reason}`);
      }
      lines.push("");
    }
    const completeDirs = dirCoverage.filter((d) => d.mocStatus === "complete");
    if (completeDirs.length > 0) {
      lines.push("### Directories with Complete MOCs");
      for (const dir of completeDirs) {
        lines.push(`- ${dir.path}/ (${dir.documentCount} docs)`);
      }
    }
    return lines.join("\n");
  }
  /**
   * Build context-aware prompt for documentation cultivation
   */
  buildPrompt(agent, documents, keyDocs, dirCoverage, previousAnalysis, sopGaps) {
    const inventory = documents.map((d) => `- ${d.path} (${d.type}): ${d.title}`).join("\n");
    const keyContent = Array.from(keyDocs.entries()).map(([name, content]) => `### ${name}

${content}`).join("\n\n---\n\n");
    const coverageSummary = this.buildCoverageSummary(dirCoverage);
    const iterationContext = previousAnalysis ? `
## Previous Analysis (Iteration ${previousAnalysis.iteration})
- Timestamp: ${previousAnalysis.timestamp}
- Gaps Identified: ${previousAnalysis.gapsIdentified}
- Gaps Filled: ${previousAnalysis.gapsFilled}
- Questions Raised: ${previousAnalysis.questionsRaised}
- Questions Answered: ${previousAnalysis.questionsAnswered}
- Coverage Score: ${previousAnalysis.coverageScore.toFixed(1)}%

Focus on NEW gaps and questions not addressed in previous iterations.
` : "";
    let specificInstructions = "";
    switch (agent.type) {
      case "coverage":
        specificInstructions = `
Focus on directory structure and MOC (Map of Content) files:

1. **Directory Analysis**: Review each directory and its MOC file status
2. **Empty/Stub MOCs**: Identify MOC files that are empty or just stubs
3. **Missing MOCs**: Identify directories that need MOC files
4. **Documentation Needs**: For each directory, determine what documentation is needed
5. **Not Needed**: If a directory genuinely doesn't need documentation, explain why

For each directory needing work:
- State the directory path
- Current MOC status (missing/empty/stub/complete)
- What documentation should be added
- Priority (high/medium/low)
- Suggested content or links to include

The goal is 100% documentation coverage - every directory should either:
1. Have a complete MOC with links to contents
2. Have documentation explaining why it doesn't need more docs
3. Be marked for future documentation

## Directory Coverage Status
${coverageSummary}`;
        break;
      case "vision":
        specificInstructions = `
Focus on:
1. What is the core purpose/goal of this project?
2. What problem does it solve?
3. What is the target audience/user?
4. What are the key success metrics?
5. What is the overall architecture vision?

Provide a clear, concise synthesis of the project vision with references to specific documentation.`;
        break;
      case "gaps":
        specificInstructions = `
Identify:
1. Missing documentation (what topics are mentioned but not explained?)
2. Incomplete sections (what areas need more detail?)
3. Outdated information (anything that seems inconsistent?)
4. Missing examples or use cases
5. Unclear terminology or concepts that need definitions
6. Empty or stub MOC files that need content (see Directory Coverage below)

For each gap, specify:
- What is missing
- Where it should be documented (specific file path)
- Why it's important
- Priority (high/medium/low)

## Directory Coverage Status
${coverageSummary}`;
        break;
      case "research":
        specificInstructions = `
Generate research questions in these categories:
1. Technical questions (how should X be implemented?)
2. Design decisions (why this approach vs alternatives?)
3. Integration questions (how does X connect to Y?)
4. Validation questions (how do we verify X works?)
5. Scalability questions (will this work at scale?)

For each question:
- State the question clearly
- Explain why answering it is important
- Suggest where to look for answers`;
        break;
      case "connections":
        specificInstructions = `
Identify relationships between documented concepts:
1. Dependencies (X requires Y)
2. Extensions (X extends Y)
3. Alternatives (X is an alternative to Y)
4. Compositions (X is made up of Y and Z)
5. References (X references Y for details)

Suggest knowledge graph nodes and edges in this format:
- [Node A] --relationship--> [Node B]: description

Also identify concepts that should be linked but aren't currently.`;
        break;
      case "sop":
        specificInstructions = this.buildSOPAgentInstructions(sopGaps);
        break;
    }
    return `You are a documentation analyst helping to cultivate a knowledge graph.
${iterationContext}
## Your Task
${agent.task}

## Documentation Inventory
The following markdown documents exist in this project:
${inventory}

## Key Document Contents

${keyContent}

## Instructions
${specificInstructions}

## Output Format
Provide your analysis in markdown format with:
1. Clear section headings
2. Specific observations (prefix with "Observation:")
3. Specific recommendations (prefix with "Recommendation:")
4. Key findings (prefix with "Finding:")
5. Research questions where applicable (prefix with "Question:")
6. Priority levels (high/medium/low) for actionable items

Reference specific documents using [[document-name]] wiki-link format where relevant.
Be specific and actionable in your analysis.
${previousAnalysis ? "\nFocus on NEW items not identified in previous iterations." : ""}`;
  }
  /**
   * Run SOP compliance check against the documentation
   */
  async runSOPComplianceCheck() {
    try {
      logger.info("Running SOP compliance check", { projectRoot: this.projectRoot });
      const result = await checkCompliance({
        projectRoot: this.projectRoot,
        docsPath: this.docsPath,
        deepAnalysis: false,
        assessor: "deep-analyzer"
      });
      logger.info("SOP compliance check complete", {
        score: result.overallScore,
        compliant: result.assessments.filter((a) => a.score >= 70).length,
        nonCompliant: result.assessments.filter((a) => a.score < 70).length
      });
      return result;
    } catch (error) {
      logger.warn("SOP compliance check failed", { error: error instanceof Error ? error.message : String(error) });
      return void 0;
    }
  }
  /**
   * Run SOP gap analysis on compliance results
   */
  runSOPGapAnalysis(compliance) {
    try {
      const result = analyzeGaps(compliance, {
        complianceThreshold: 70,
        includePartial: true,
        generateRemediation: true
      });
      logger.info("SOP gap analysis complete", {
        totalGaps: result.totalGaps,
        criticalGaps: result.criticalGaps.length,
        compliancePercentage: result.summary.compliancePercentage
      });
      this.writeSOPGapsSummary(result);
      return result;
    } catch (error) {
      logger.warn("SOP gap analysis failed", { error: error instanceof Error ? error.message : String(error) });
      return void 0;
    }
  }
  /**
   * Write SOP gaps summary to analysis output
   */
  writeSOPGapsSummary(gaps) {
    const summaryPath = join(this.outputDir, "sop-gaps-summary.json");
    try {
      const summary = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        totalGaps: gaps.totalGaps,
        criticalGaps: gaps.criticalGaps.length,
        summary: gaps.summary,
        byPriority: {
          critical: gaps.byPriority[SOPPriority.CRITICAL].length,
          high: gaps.byPriority[SOPPriority.HIGH].length,
          medium: gaps.byPriority[SOPPriority.MEDIUM].length,
          low: gaps.byPriority[SOPPriority.LOW].length
        },
        byCategory: Object.entries(gaps.byCategory).reduce((acc, [key, value]) => {
          acc[key] = value.length;
          return acc;
        }, {}),
        gaps: gaps.gaps.map((g) => ({
          id: g.id,
          sopId: g.sopId,
          requirementId: g.requirementId,
          description: g.description,
          priority: g.priority,
          effort: g.effort,
          remediation: g.remediation
        })),
        roadmap: gaps.roadmap ? {
          phases: gaps.roadmap.phases.map((p) => ({
            phase: p.phase,
            name: p.name,
            focus: p.focus,
            effort: p.effort,
            gapCount: p.gaps.length
          })),
          quickWinsCount: gaps.roadmap.quickWins.length
        } : void 0
      };
      writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      logger.debug("Wrote SOP gaps summary", { path: summaryPath });
    } catch (error) {
      logger.warn("Failed to write SOP gaps summary", { error: error instanceof Error ? error.message : String(error) });
    }
  }
  /**
   * Build SOP agent-specific instructions with gap context
   */
  buildSOPAgentInstructions(sopGaps) {
    let instructions = `
Analyze AI-SDLC SOP (Standard Operating Procedures) compliance gaps and recommend documentation:

1. **Gap Prioritization**: Review the compliance gaps and prioritize by impact
2. **Documentation Recommendations**: For each gap, suggest what documentation should be created
3. **Remediation Steps**: Provide actionable steps to address each gap
4. **Quick Wins**: Identify low-effort, high-impact gaps that can be addressed quickly
5. **Documentation Templates**: Suggest document templates for common gap types

For each gap, recommend:
- Document type (guide, standard, process, reference)
- Suggested file path (using project conventions)
- Key sections to include
- Related documents to link to ([[wiki-links]])
- Priority level (high/medium/low)
`;
    if (sopGaps && sopGaps.totalGaps > 0) {
      instructions += `
## Current SOP Compliance Gaps

**Summary:**
- Total Gaps: ${sopGaps.totalGaps}
- Critical Gaps: ${sopGaps.criticalGaps.length}
- Compliance Score: ${sopGaps.summary.compliancePercentage}%

### Gaps by Priority:
- Critical: ${sopGaps.byPriority[SOPPriority.CRITICAL].length}
- High: ${sopGaps.byPriority[SOPPriority.HIGH].length}
- Medium: ${sopGaps.byPriority[SOPPriority.MEDIUM].length}
- Low: ${sopGaps.byPriority[SOPPriority.LOW].length}

### Detailed Gaps:
`;
      const priorityGaps = [
        ...sopGaps.byPriority[SOPPriority.CRITICAL],
        ...sopGaps.byPriority[SOPPriority.HIGH]
      ].slice(0, 15);
      for (const gap of priorityGaps) {
        instructions += `
#### ${gap.priority.toUpperCase()}: ${gap.description}
- SOP: ${gap.sopId}
- Requirement: ${gap.requirementId}
- Effort: ${gap.effort}
- Remediation: ${gap.remediation}
- Impact: ${gap.impact}
`;
      }
      if (sopGaps.roadmap) {
        instructions += `
### Remediation Roadmap:
`;
        for (const phase of sopGaps.roadmap.phases) {
          instructions += `
**Phase ${phase.phase}: ${phase.name}**
- Focus: ${phase.focus}
- Effort: ${phase.effort}
- Gaps to address: ${phase.gaps.length}
`;
        }
        if (sopGaps.roadmap.quickWins.length > 0) {
          instructions += `
### Quick Wins (High Impact, Low Effort):
`;
          for (const win of sopGaps.roadmap.quickWins.slice(0, 5)) {
            instructions += `- ${win.description} (${win.effort} effort)
`;
          }
        }
      }
    } else {
      instructions += `
## No SOP Gaps Data Available

Perform a general AI-SDLC compliance analysis based on the documentation structure.
Review for common compliance areas:
- Requirements documentation
- Architecture documentation
- Testing documentation
- Security documentation
- Deployment documentation
- Operational procedures
`;
    }
    return instructions;
  }
  /**
   * Run analysis using Claude CLI
   */
  async runWithCli(prompt) {
    const sanitizedPrompt = prompt.replace(/"/g, '\\"').replace(/[`$]/g, "");
    try {
      const result = execSync(`claude -p "${sanitizedPrompt}"`, {
        cwd: this.projectRoot,
        encoding: "utf8",
        timeout: this.agentTimeout,
        maxBuffer: 10 * 1024 * 1024
      });
      return result;
    } catch (error) {
      if (error instanceof Error) {
        const execError = error;
        if (execError.killed) {
          if (execError.stdout && execError.stdout.length > 100) {
            return execError.stdout;
          }
          throw new Error(`Claude CLI timed out after ${this.agentTimeout / 1e3}s`);
        }
        throw new Error(execError.stderr || error.message);
      }
      throw error;
    }
  }
  /**
   * Run analysis using Anthropic API directly
   */
  async runWithAnthropic(prompt) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not set");
    }
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      });
      const textBlock = response.content.find((block) => block.type === "text");
      if (textBlock && textBlock.type === "text") {
        return textBlock.text;
      }
      throw new Error("No text content in API response");
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Anthropic API call failed: ${error.message}`);
      }
      throw error;
    }
  }
  /**
   * Run analysis using Google Gemini API
   */
  async runWithGemini(prompt) {
    const apiKey = this.getGeminiApiKey();
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY not set");
    }
    try {
      const { GoogleGenerativeAI } = await import("../node_modules/@google/generative-ai/dist/index.js");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      if (!text) {
        throw new Error("No text content in Gemini response");
      }
      return text;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API call failed: ${error.message}`);
      }
      throw error;
    }
  }
  /**
   * Extract insights from agent output
   */
  extractInsights(output) {
    const insights = [];
    const patterns = [
      /[-*]?\s*(?:insight|finding|observation|recommendation|question):\s*(.+)/gi,
      /##\s*(?:insight|finding|observation|recommendation|question):\s*(.+)/gi,
      /(?:key\s+)?(?:insight|finding|observation|recommendation|question):\s*(.+)/gi
    ];
    for (const pattern of patterns) {
      const matches = output.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          insights.push(match[1].trim());
        }
      }
    }
    return [...new Set(insights)];
  }
  /**
   * Format output for documentation
   */
  formatOutput(agent, output, mode) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    return `---
title: "${agent.name}"
type: cultivation-analysis
generator: deep-analyzer
agent: ${agent.type}
provider: ${mode}
created: ${timestamp}
---

# ${agent.name}

> Generated by DeepAnalyzer for documentation cultivation

## Purpose

${agent.task}

## Analysis

${output}

---

*Generated on ${(/* @__PURE__ */ new Date()).toLocaleString()}*
`;
  }
}
function createDeepAnalyzer(options) {
  return new DeepAnalyzer(options);
}
async function analyzeDeep(projectRoot, docsPath) {
  const analyzer = new DeepAnalyzer({ projectRoot, docsPath });
  return analyzer.analyze();
}
export {
  DeepAnalyzer,
  analyzeDeep,
  createDeepAnalyzer
};
//# sourceMappingURL=deep-analyzer.js.map
