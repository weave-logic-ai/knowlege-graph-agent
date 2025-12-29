import { execFileSync, spawn } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("deep-analyzer");
const VALID_AGENT_TYPES = /* @__PURE__ */ new Set([
  "researcher",
  "architect",
  "analyst",
  "coder",
  "tester",
  "reviewer",
  "documenter"
]);
class DeepAnalyzer {
  projectRoot;
  docsPath;
  outputDir;
  verbose;
  maxAgents;
  agentMode;
  agentTimeout;
  constructor(options) {
    this.projectRoot = resolve(options.projectRoot);
    this.docsPath = options.docsPath || "docs";
    this.outputDir = options.outputDir || join(this.projectRoot, this.docsPath, "analysis");
    this.verbose = options.verbose || false;
    this.maxAgents = options.maxAgents || 5;
    this.agentMode = options.agentMode || "adaptive";
    this.agentTimeout = options.agentTimeout || 6e4;
  }
  /**
   * Check if claude-flow is available
   */
  async isAvailable() {
    try {
      execFileSync("npx", ["claude-flow@alpha", "--version"], {
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
   * Run deep analysis
   */
  async analyze() {
    const startTime = Date.now();
    const result = {
      success: false,
      agentsSpawned: 0,
      insightsCount: 0,
      documentsCreated: 0,
      results: [],
      duration: 0,
      errors: []
    };
    if (!await this.isAvailable()) {
      result.errors.push("claude-flow is not available");
      result.duration = Date.now() - startTime;
      return result;
    }
    if (!existsSync(this.outputDir)) {
      mkdirSync(this.outputDir, { recursive: true });
    }
    const agents = [
      {
        name: "Pattern Researcher",
        type: "researcher",
        task: "Analyze codebase architecture, patterns, and design decisions",
        outputFile: "architecture-patterns.md"
      },
      {
        name: "Code Analyst",
        type: "analyst",
        task: "Identify code quality issues, complexity hotspots, and improvement opportunities",
        outputFile: "code-analysis.md"
      },
      {
        name: "Implementation Reviewer",
        type: "coder",
        task: "Review implementation patterns, naming conventions, and code style",
        outputFile: "implementation-review.md"
      },
      {
        name: "Test Analyzer",
        type: "tester",
        task: "Analyze test coverage, testing patterns, and testing gaps",
        outputFile: "testing-analysis.md"
      }
    ];
    logger.info("Starting deep analysis", { agents: agents.length, mode: this.agentMode });
    if (this.agentMode === "parallel") {
      result.results = await this.executeParallel(agents);
    } else if (this.agentMode === "sequential") {
      result.results = await this.executeSequential(agents);
    } else {
      result.results = await this.executeAdaptive(agents);
    }
    result.agentsSpawned = result.results.length;
    result.insightsCount = result.results.reduce((sum, r) => sum + r.insights.length, 0);
    result.documentsCreated = result.results.reduce((sum, r) => sum + r.documents.length, 0);
    result.success = result.results.every((r) => r.success);
    result.duration = Date.now() - startTime;
    for (const agentResult of result.results) {
      if (agentResult.error) {
        result.errors.push(`${agentResult.name}: ${agentResult.error}`);
      }
    }
    logger.info("Deep analysis complete", {
      success: result.success,
      insights: result.insightsCount,
      documents: result.documentsCreated,
      duration: result.duration
    });
    return result;
  }
  /**
   * Execute agents in parallel
   */
  async executeParallel(agents) {
    const promises = agents.map((agent) => this.executeAgent(agent));
    return Promise.all(promises);
  }
  /**
   * Execute agents sequentially
   */
  async executeSequential(agents) {
    const results = [];
    for (const agent of agents) {
      results.push(await this.executeAgent(agent));
    }
    return results;
  }
  /**
   * Execute agents adaptively (start with 2, scale based on success)
   */
  async executeAdaptive(agents) {
    const results = [];
    const firstBatch = agents.slice(0, 2);
    const firstResults = await Promise.all(firstBatch.map((a) => this.executeAgent(a)));
    results.push(...firstResults);
    const successRate = firstResults.filter((r) => r.success).length / firstResults.length;
    if (successRate >= 0.5 && agents.length > 2) {
      const remaining = agents.slice(2);
      const remainingResults = await Promise.all(remaining.map((a) => this.executeAgent(a)));
      results.push(...remainingResults);
    } else if (agents.length > 2) {
      logger.warn("Low success rate, switching to sequential mode");
      for (const agent of agents.slice(2)) {
        results.push(await this.executeAgent(agent));
      }
    }
    return results;
  }
  /**
   * Execute a single agent
   */
  async executeAgent(agent) {
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
      logger.info(`Spawning agent: ${agent.name}`, { type: agent.type });
      const prompt = this.buildPrompt(agent);
      const output = await this.runClaudeFlowAgent(agent.type, prompt);
      result.insights = this.extractInsights(output);
      writeFileSync(outputPath, this.formatOutput(agent, output));
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
   * Build prompt for agent
   */
  buildPrompt(agent) {
    return `You are a ${agent.name} analyzing the project at ${this.projectRoot}.

**OBJECTIVE**: ${agent.task}

**COORDINATION PROTOCOL**:
\`\`\`bash
npx claude-flow@alpha hooks pre-task --description "${agent.task}"
\`\`\`

**YOUR TASKS**:
1. Analyze the codebase at ${this.projectRoot}
2. Identify key patterns and conventions
3. Document your findings with specific examples
4. Provide actionable recommendations
5. Generate comprehensive markdown documentation

**OUTPUT REQUIREMENTS**:
- Use clear markdown formatting
- Include code examples from the project
- Organize findings by category
- Prioritize actionable insights

After completing:
\`\`\`bash
npx claude-flow@alpha hooks post-task --task-id "${agent.type}-analysis"
\`\`\`
`;
  }
  /**
   * Run claude-flow agent
   */
  async runClaudeFlowAgent(type, prompt) {
    if (!VALID_AGENT_TYPES.has(type)) {
      throw new Error(`Invalid agent type: ${type}. Valid types: ${[...VALID_AGENT_TYPES].join(", ")}`);
    }
    const sanitizedPrompt = prompt.replace(/[`$\\]/g, "");
    return new Promise((resolve2, reject) => {
      const args = ["claude-flow@alpha", "agent", "execute", type, sanitizedPrompt, "--json"];
      const proc = spawn("npx", args, {
        cwd: this.projectRoot,
        shell: false,
        // Security: Disable shell to prevent command injection
        timeout: this.agentTimeout
      });
      let stdout = "";
      let stderr = "";
      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });
      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
      proc.on("close", (code) => {
        if (code === 0) {
          resolve2(stdout);
        } else {
          reject(new Error(stderr || `Agent exited with code ${code}`));
        }
      });
      proc.on("error", (error) => {
        reject(error);
      });
    });
  }
  /**
   * Extract insights from agent output
   */
  extractInsights(output) {
    const insights = [];
    const patterns = [
      /[-*]\s*(?:insight|finding|observation|recommendation):\s*(.+)/gi,
      /##\s*(?:insight|finding|observation|recommendation):\s*(.+)/gi,
      /(?:key\s+)?(?:insight|finding|observation|recommendation):\s*(.+)/gi
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
  formatOutput(agent, output) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    return `---
title: "${agent.name} Analysis"
type: analysis
generator: deep-analyzer
agent: ${agent.type}
created: ${timestamp}
---

# ${agent.name} Analysis

> Generated by DeepAnalyzer using claude-flow

## Overview

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
