import { execFileSync, execSync } from "child_process";
import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, statSync } from "fs";
import { resolve, join, extname, relative, basename } from "path";
import { createLogger } from "../utils/logger.js";
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
    if (documents.length === 0) {
      result.errors.push("No markdown documents found in docs directory");
      result.duration = Date.now() - startTime;
      return result;
    }
    logger.info("Found documentation", { documents: documents.length, keyDocs: keyDocs.size });
    const agents = [
      {
        name: "Vision Synthesizer",
        type: "vision",
        task: "Synthesize the project vision, goals, and core value proposition from the documentation",
        outputFile: "vision-synthesis.md"
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
      }
    ];
    logger.info("Executing cultivation agents", { agents: agents.length, mode: "sequential" });
    for (const agent of agents) {
      const agentResult = await this.executeAgent(
        agent,
        executionMode.mode,
        documents,
        keyDocs
      );
      result.results.push(agentResult);
    }
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
  async executeAgent(agent, mode, documents, keyDocs) {
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
      const prompt = this.buildPrompt(agent, documents, keyDocs);
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
   * Build context-aware prompt for documentation cultivation
   */
  buildPrompt(agent, documents, keyDocs) {
    const inventory = documents.map((d) => `- ${d.path} (${d.type}): ${d.title}`).join("\n");
    const keyContent = Array.from(keyDocs.entries()).map(([name, content]) => `### ${name}

${content}`).join("\n\n---\n\n");
    let specificInstructions = "";
    switch (agent.type) {
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

For each gap, specify:
- What is missing
- Where it should be documented
- Why it's important`;
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
    }
    return `You are a documentation analyst helping to cultivate a knowledge graph.

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

Reference specific documents using [[document-name]] wiki-link format where relevant.
Be specific and actionable in your analysis.`;
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
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
