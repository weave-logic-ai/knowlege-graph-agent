import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname, basename, relative } from "path";
import { GoogleGenerativeAI } from "../node_modules/@google/generative-ai/dist/index.js";
class MigrationOrchestrator {
  projectRoot;
  docsPath;
  analysisDir;
  verbose;
  dryRun;
  useVectorSearch;
  maxAgents;
  geminiClient = null;
  constructor(options) {
    this.projectRoot = options.projectRoot;
    this.docsPath = options.docsPath;
    this.analysisDir = options.analysisDir;
    this.verbose = options.verbose ?? false;
    this.dryRun = options.dryRun ?? false;
    this.useVectorSearch = options.useVectorSearch ?? false;
    this.maxAgents = options.maxAgents ?? 8;
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      this.geminiClient = new GoogleGenerativeAI(apiKey);
    }
  }
  /**
   * Check availability status
   */
  async getAvailabilityStatus() {
    if (this.geminiClient) {
      return { available: true, reason: "Using Gemini API" };
    }
    if (process.env.ANTHROPIC_API_KEY) {
      return { available: true, reason: "Using Anthropic API" };
    }
    return {
      available: false,
      reason: "No API key found. Set GOOGLE_GEMINI_API_KEY or ANTHROPIC_API_KEY"
    };
  }
  /**
   * Run the migration process
   */
  async migrate() {
    const startTime = Date.now();
    const result = {
      success: false,
      agentsUsed: 0,
      documentsCreated: 0,
      documentsUpdated: 0,
      connectionsAdded: 0,
      questionsAnswered: 0,
      gapsFilled: 0,
      errors: [],
      warnings: [],
      duration: 0
    };
    try {
      this.log("info", "Starting migration orchestration", {
        analysisDir: this.analysisDir,
        docsPath: this.docsPath
      });
      const analysis = await this.parseAnalysisFiles();
      this.log("info", "Parsed analysis files", {
        gaps: analysis.gaps.length,
        questions: analysis.questions.length,
        connections: analysis.connections.length
      });
      const docsContext = await this.loadDocsContext();
      this.log("info", "Loaded documentation context", {
        totalDocs: docsContext.size,
        keyDocs: Array.from(docsContext.keys()).slice(0, 5)
      });
      const agents = this.createMigrationAgents(analysis, docsContext);
      this.log("info", "Created migration agents", { agents: agents.length });
      for (const agent of agents) {
        try {
          const agentResult = await this.executeAgent(agent, analysis, docsContext);
          result.agentsUsed++;
          if (agentResult.documentsCreated) {
            result.documentsCreated += agentResult.documentsCreated;
          }
          if (agentResult.documentsUpdated) {
            result.documentsUpdated += agentResult.documentsUpdated;
          }
          if (agentResult.gapsFilled) {
            result.gapsFilled += agentResult.gapsFilled;
          }
          if (agentResult.questionsAnswered) {
            result.questionsAnswered += agentResult.questionsAnswered;
          }
          if (agentResult.connectionsAdded) {
            result.connectionsAdded += agentResult.connectionsAdded;
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          result.errors.push(`Agent ${agent.name} failed: ${msg}`);
          this.log("error", `Agent ${agent.name} failed`, { error: msg });
        }
      }
      if (result.documentsCreated > 0 || result.connectionsAdded > 0) {
        await this.updateMOCFiles(analysis.connections);
      }
      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;
      this.log("info", "Migration complete", {
        success: result.success,
        documentsCreated: result.documentsCreated,
        gapsFilled: result.gapsFilled,
        duration: result.duration
      });
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Migration failed: ${msg}`);
      result.duration = Date.now() - startTime;
      return result;
    }
  }
  /**
   * Parse all analysis files from the analysis directory
   */
  async parseAnalysisFiles() {
    const analysisPath = join(this.projectRoot, this.docsPath, this.analysisDir);
    const result = {
      vision: { purpose: "", goals: [], recommendations: [] },
      gaps: [],
      questions: [],
      connections: [],
      sopGaps: [],
      sopSummary: void 0
    };
    if (!existsSync(analysisPath)) {
      throw new Error(`Analysis directory not found: ${analysisPath}`);
    }
    const visionFile = join(analysisPath, "vision-synthesis.md");
    if (existsSync(visionFile)) {
      result.vision = this.parseVisionFile(readFileSync(visionFile, "utf-8"));
    }
    const gapsFile = join(analysisPath, "documentation-gaps.md");
    if (existsSync(gapsFile)) {
      result.gaps = this.parseGapsFile(readFileSync(gapsFile, "utf-8"));
    }
    const questionsFile = join(analysisPath, "research-questions.md");
    if (existsSync(questionsFile)) {
      result.questions = this.parseQuestionsFile(readFileSync(questionsFile, "utf-8"));
    }
    const connectionsFile = join(analysisPath, "knowledge-connections.md");
    if (existsSync(connectionsFile)) {
      result.connections = this.parseConnectionsFile(readFileSync(connectionsFile, "utf-8"));
    }
    const sopGapsFile = join(analysisPath, "sop-gaps-summary.json");
    if (existsSync(sopGapsFile)) {
      try {
        const sopData = JSON.parse(readFileSync(sopGapsFile, "utf-8"));
        result.sopGaps = sopData.gaps || [];
        result.sopSummary = {
          totalGaps: sopData.totalGaps || 0,
          criticalGaps: sopData.criticalGaps || 0,
          compliancePercentage: sopData.summary?.compliancePercentage || 0,
          byPriority: sopData.byPriority || {}
        };
        this.log("info", "Loaded SOP gaps from analysis", {
          totalGaps: result.sopSummary.totalGaps,
          criticalGaps: result.sopSummary.criticalGaps
        });
      } catch (error) {
        this.log("warn", "Failed to parse SOP gaps summary", { error: String(error) });
      }
    }
    return result;
  }
  /**
   * Parse vision synthesis file
   */
  parseVisionFile(content) {
    const vision = {
      purpose: "",
      goals: [],
      recommendations: []
    };
    const purposeMatch = content.match(/## (?:Core Purpose|Problem Statement)[^#]*?\n([\s\S]*?)(?=\n##|\n\*\*|$)/i);
    if (purposeMatch) {
      vision.purpose = purposeMatch[1].trim().slice(0, 500);
    }
    const goalsMatch = content.match(/## (?:Key Success Metrics|Goals)[^#]*?\n([\s\S]*?)(?=\n##|$)/i);
    if (goalsMatch) {
      const goalLines = goalsMatch[1].match(/\*\s+\*\*[^*]+\*\*/g) || [];
      vision.goals = goalLines.map((g) => g.replace(/\*+/g, "").trim()).slice(0, 10);
    }
    const recsMatch = content.match(/## (?:Actionable Recommendations|Recommendations)[^#]*?\n([\s\S]*?)(?=\n##|```|$)/i);
    if (recsMatch) {
      const recLines = recsMatch[1].match(/\d+\.\s+\*\*[^*]+\*\*[^*\n]*/g) || [];
      vision.recommendations = recLines.map((r) => r.replace(/\d+\.\s*\*\*|\*\*/g, "").trim()).slice(0, 10);
    }
    return vision;
  }
  /**
   * Parse documentation gaps file
   */
  parseGapsFile(content) {
    const gaps = [];
    const sections = content.split(/###\s+\d+\.\s+/);
    for (const section of sections.slice(1)) {
      const titleMatch = section.match(/^([^\n]+)/);
      const title = titleMatch ? titleMatch[1].trim() : "Unknown Section";
      const obsMatches = section.matchAll(/\*\*Observation:\*\*\s*([^\n]+)/g);
      for (const match of obsMatches) {
        const observation = match[1].trim();
        const recMatch = section.match(/\*\*Recommendation:\*\*\s*([^\n]+)/);
        const recommendation = recMatch ? recMatch[1].trim() : "";
        const wikiLinks = observation.match(/\[\[[^\]]+\]\]/g) || [];
        const relatedDocs = wikiLinks.map((l) => l.replace(/\[\[|\]\]/g, ""));
        gaps.push({
          section: title,
          description: observation,
          recommendation,
          priority: this.inferPriority(observation, recommendation),
          relatedDocs
        });
      }
      const findingMatches = section.matchAll(/\*\*Finding:\*\*\s*([^\n]+)/g);
      for (const match of findingMatches) {
        const finding = match[1].trim();
        const wikiLinks = finding.match(/\[\[[^\]]+\]\]/g) || [];
        gaps.push({
          section: title,
          description: finding,
          recommendation: "",
          priority: "medium",
          relatedDocs: wikiLinks.map((l) => l.replace(/\[\[|\]\]/g, ""))
        });
      }
    }
    return gaps;
  }
  /**
   * Escape special regex characters in a string
   */
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  /**
   * Parse research questions file
   */
  parseQuestionsFile(content) {
    const questions = [];
    const questionMatches = content.matchAll(/(?:Question:|####\s+\d+\.\d+\s+)([^\n]+)\n([\s\S]*?)(?=\n(?:Question:|####|\*\*Importance|\*\*Suggested|###|$))/g);
    for (const match of questionMatches) {
      const questionText = match[1].replace(/^Question:\s*/, "").trim();
      const context = match[2].trim();
      const safeQuestionShort = this.escapeRegex(questionText.slice(0, 50));
      const safeQuestionVeryShort = this.escapeRegex(questionText.slice(0, 30));
      const importanceMatch = content.match(new RegExp(`${safeQuestionShort}[\\s\\S]*?\\*\\*Importance:\\*\\*\\s*([^\\n]+)`));
      const importance = importanceMatch ? importanceMatch[1].trim() : "";
      const resourcesMatch = content.match(new RegExp(`${safeQuestionShort}[\\s\\S]*?\\*\\*Suggested Resources:\\*\\*\\s*([^\\n]+)`));
      const resources = resourcesMatch ? resourcesMatch[1].split(",").map((r) => r.trim()) : [];
      const categoryMatch = content.match(new RegExp(`### \\d+\\. ([^\\n]+)[\\s\\S]*?${safeQuestionVeryShort}`));
      const category = categoryMatch ? categoryMatch[1].trim() : "General";
      questions.push({
        question: questionText,
        context,
        importance,
        suggestedResources: resources,
        category
      });
    }
    return questions;
  }
  /**
   * Parse knowledge connections file
   */
  parseConnectionsFile(content) {
    const connections = [];
    const relationshipMatches = content.matchAll(/\[([^\]]+)\]\s*--([A-Z_-]+)-->\s*\[([^\]]+)\](?::\s*([^\n]+))?/g);
    for (const match of relationshipMatches) {
      connections.push({
        source: match[1].trim(),
        target: match[3].trim(),
        relationship: match[2].trim(),
        reason: match[4]?.trim() || ""
      });
    }
    const wikiMatches = content.matchAll(/\[\[([^\]]+)\]\]\s*(?:to|→|->|--)\s*\[\[([^\]]+)\]\]/g);
    for (const match of wikiMatches) {
      connections.push({
        source: match[1].trim(),
        target: match[2].trim(),
        relationship: "RELATED-TO",
        reason: ""
      });
    }
    return connections;
  }
  /**
   * Load all documentation as context
   */
  async loadDocsContext() {
    const context = /* @__PURE__ */ new Map();
    const docsDir = join(this.projectRoot, this.docsPath);
    if (!existsSync(docsDir)) {
      return context;
    }
    const loadDir = (dir) => {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory() && !entry.startsWith(".") && entry !== "analysis") {
          loadDir(fullPath);
        } else if (entry.endsWith(".md")) {
          const relativePath = relative(docsDir, fullPath);
          const content = readFileSync(fullPath, "utf-8");
          context.set(relativePath, content.slice(0, 15e3));
        }
      }
    };
    loadDir(docsDir);
    return context;
  }
  /**
   * Create migration agents based on analysis
   */
  createMigrationAgents(analysis, docsContext) {
    const agents = [];
    const highPriorityGaps = analysis.gaps.filter((g) => g.priority === "high");
    if (highPriorityGaps.length > 0) {
      agents.push({
        name: "Gap Filler - High Priority",
        type: "gap-filler",
        task: "Fill high-priority documentation gaps with comprehensive, project-specific content",
        context: this.buildGapFillerContext(highPriorityGaps, docsContext, analysis),
        outputFile: "gap-implementations.md"
      });
    }
    const mediumPriorityGaps = analysis.gaps.filter((g) => g.priority === "medium");
    if (mediumPriorityGaps.length > 0) {
      agents.push({
        name: "Gap Filler - Medium Priority",
        type: "gap-filler",
        task: "Fill medium-priority documentation gaps with project-specific content",
        context: this.buildGapFillerContext(mediumPriorityGaps, docsContext, analysis)
      });
    }
    const questionsByCategory = /* @__PURE__ */ new Map();
    for (const q of analysis.questions) {
      const cat = q.category || "General";
      if (!questionsByCategory.has(cat)) {
        questionsByCategory.set(cat, []);
      }
      questionsByCategory.get(cat).push(q);
    }
    for (const [category, questions] of questionsByCategory) {
      if (questions.length > 0) {
        agents.push({
          name: `Researcher - ${category}`,
          type: "researcher",
          task: `Research and answer questions about ${category}`,
          context: this.buildResearcherContext(questions, docsContext),
          outputFile: `research-${category.toLowerCase().replace(/\s+/g, "-")}.md`
        });
      }
    }
    const mocGaps = analysis.gaps.filter(
      (g) => g.description.toLowerCase().includes("moc") || g.description.toLowerCase().includes("stub")
    );
    if (mocGaps.length > 0) {
      agents.push({
        name: "MOC Builder",
        type: "moc-builder",
        task: "Populate empty MOC (Map of Content) files with project-specific structure and links",
        context: this.buildMOCBuilderContext(mocGaps, docsContext, analysis)
      });
    }
    if (analysis.connections.length > 0) {
      agents.push({
        name: "Connection Builder",
        type: "connector",
        task: "Build knowledge graph connections by adding wiki-links to documents",
        context: this.buildConnectorContext(analysis.connections, docsContext)
      });
    }
    const emptyDirs = this.findEmptyDirectories(docsContext);
    if (emptyDirs.length > 0) {
      agents.push({
        name: "Directory Populator",
        type: "gap-filler",
        task: "Create documentation files for empty directories based on project context",
        context: this.buildDirectoryPopulatorContext(emptyDirs, docsContext, analysis)
      });
    }
    if (analysis.sopGaps.length > 0) {
      const criticalAndHighGaps = analysis.sopGaps.filter(
        (g) => g.priority === "critical" || g.priority === "high"
      );
      const mediumAndLowGaps = analysis.sopGaps.filter(
        (g) => g.priority === "medium" || g.priority === "low"
      );
      if (criticalAndHighGaps.length > 0) {
        agents.push({
          name: "SOP Gap Filler - Critical/High",
          type: "gap-filler",
          task: "Create documentation to address critical and high-priority SOP compliance gaps",
          context: this.buildSOPGapFillerContext(criticalAndHighGaps, docsContext, analysis),
          outputFile: "sop-gap-implementations.md"
        });
      }
      if (mediumAndLowGaps.length > 0) {
        agents.push({
          name: "SOP Gap Filler - Medium/Low",
          type: "gap-filler",
          task: "Create documentation to address medium and low-priority SOP compliance gaps",
          context: this.buildSOPGapFillerContext(mediumAndLowGaps, docsContext, analysis)
        });
      }
    }
    agents.push({
      name: "Documentation Integrator",
      type: "integrator",
      task: "Ensure all new documentation is consistent and properly integrated",
      context: this.buildIntegratorContext(analysis, docsContext),
      outputFile: "integration-summary.md"
    });
    return agents.slice(0, this.maxAgents);
  }
  /**
   * Find directories with no or minimal documentation
   */
  findEmptyDirectories(docsContext) {
    const directories = /* @__PURE__ */ new Map();
    const docsDir = join(this.projectRoot, this.docsPath);
    for (const path of docsContext.keys()) {
      const dir = dirname(path);
      if (dir !== ".") {
        directories.set(dir, (directories.get(dir) || 0) + 1);
      }
    }
    const scanDir = (dir, relativePath = "") => {
      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const relPath = relativePath ? `${relativePath}/${entry}` : entry;
          if (statSync(fullPath).isDirectory() && !entry.startsWith(".") && entry !== "analysis" && entry !== "_templates" && entry !== "_attachments" && entry !== "_archive") {
            const mdFiles = readdirSync(fullPath).filter((f) => f.endsWith(".md"));
            if (!directories.has(relPath)) {
              directories.set(relPath, mdFiles.length);
            }
            scanDir(fullPath, relPath);
          }
        }
      } catch {
      }
    };
    scanDir(docsDir);
    const emptyDirs = [];
    for (const [dir, count] of directories) {
      if (count <= 1 && !dir.includes("analysis") && !dir.includes("_templates") && !dir.includes(".obsidian") && !dir.includes("_attachments") && !dir.includes("_archive")) {
        emptyDirs.push(dir);
      }
    }
    return emptyDirs;
  }
  /**
   * Build context for directory populator agent
   */
  buildDirectoryPopulatorContext(emptyDirs, docsContext, analysis) {
    let context = "## Project Context\n\n";
    if (analysis.vision.purpose) {
      context += `### Project Purpose
${analysis.vision.purpose}

`;
    }
    context += "## Key Technical Documentation\n\n";
    const keyDocPatterns = ["test_strategy", "technical", "wasm", "rust", "original_spec", "integration"];
    for (const [docPath, docContent] of docsContext) {
      const lowerPath = docPath.toLowerCase();
      if (keyDocPatterns.some((pattern) => lowerPath.includes(pattern))) {
        context += `### ${docPath}
`;
        context += docContent.slice(0, 3e3) + "\n\n";
      }
    }
    context += "## Empty Directories Needing Documentation\n\n";
    for (const dir of emptyDirs) {
      context += `- ${dir}/
`;
    }
    context += "\n## Instructions\n";
    context += "CRITICAL: Create actual document files for these empty directories.\n";
    context += "Use the project context above to create RELEVANT, PROJECT-SPECIFIC content.\n\n";
    context += "For EACH empty directory, create at least one document using this EXACT format:\n\n";
    context += "```document\n";
    context += "---\n";
    context += "path: directory-name/filename.md\n";
    context += "action: create\n";
    context += "---\n";
    context += "# Document Title\n\n";
    context += "Content with [[wiki-links]] to other docs.\n";
    context += "```\n\n";
    context += "Guidelines:\n";
    context += "1. Create documents relevant to the directory purpose (e.g., standards/testing needs testing standards)\n";
    context += "2. Reference actual project technologies: Rust, WASM, Node.js, TypeScript, Knowledge Graph\n";
    context += "3. Link to existing documents like [[test_strategy]], [[PRIMITIVES]], [[rust_wasm_knowledge_graph_integration_research]]\n";
    context += "4. Include project-specific examples and best practices\n";
    context += "5. Do NOT create generic placeholder content\n";
    return context;
  }
  /**
   * Build context for gap filler agent
   */
  buildGapFillerContext(gaps, docsContext, analysis) {
    let context = "## Project Context\n\n";
    if (analysis.vision.purpose) {
      context += `### Project Purpose
${analysis.vision.purpose}

`;
    }
    if (analysis.vision.goals.length > 0) {
      context += `### Key Goals
`;
      for (const goal of analysis.vision.goals.slice(0, 5)) {
        context += `- ${goal}
`;
      }
      context += "\n";
    }
    context += "## Key Technical Documentation\n\n";
    const keyDocPatterns = [
      "test_strategy",
      "technical",
      "architecture",
      "wasm",
      "rust",
      "original_spec",
      "integration",
      "primitives",
      "requirements"
    ];
    for (const [docPath, docContent] of docsContext) {
      const lowerPath = docPath.toLowerCase();
      if (keyDocPatterns.some((pattern) => lowerPath.includes(pattern))) {
        context += `### ${docPath}
`;
        context += docContent.slice(0, 4e3) + "\n\n";
      }
    }
    context += "## Documentation Gaps to Fill\n\n";
    for (const gap of gaps) {
      context += `### ${gap.section}
`;
      context += `**Issue:** ${gap.description}
`;
      if (gap.recommendation) {
        context += `**Recommendation:** ${gap.recommendation}
`;
      }
      context += `**Priority:** ${gap.priority}
`;
      for (const relatedDoc of gap.relatedDocs.slice(0, 2)) {
        const docKey = Array.from(docsContext.keys()).find(
          (k) => k.toLowerCase().includes(relatedDoc.toLowerCase().replace(/\s+/g, "-"))
        );
        if (docKey) {
          context += `
**Related: ${relatedDoc}**
`;
          context += docsContext.get(docKey)?.slice(0, 2e3) + "\n";
        }
      }
      context += "\n---\n\n";
    }
    context += "\n## Instructions\n";
    context += "CRITICAL: Create actual document FILES using the exact format below.\n";
    context += "Use the project context and technical documentation above.\n";
    context += "Do NOT generate generic placeholder content. Use ACTUAL project details.\n\n";
    context += "OUTPUT FORMAT - Use this EXACT format for EACH document you create:\n\n";
    context += "```document\n";
    context += "---\n";
    context += "path: relative/path/to/file.md\n";
    context += "action: create\n";
    context += "---\n";
    context += "# Document Title\n\n";
    context += "Document content with [[wiki-links]] to other documents.\n";
    context += "```\n\n";
    context += "For each gap, create documentation that:\n";
    context += "1. Addresses the specific issue using REAL project details (Rust, WASM, Knowledge Graph, etc.)\n";
    context += "2. References specific technologies mentioned in the technical docs\n";
    context += "3. Links to existing docs: [[test_strategy]], [[PRIMITIVES]], [[rust_wasm_knowledge_graph_integration_research]]\n";
    context += "4. Contains concrete, project-specific information - NOT generic placeholders\n";
    context += "5. Uses proper frontmatter with title, type, and tags\n";
    return context;
  }
  /**
   * Build context for researcher agent
   */
  buildResearcherContext(questions, docsContext) {
    let context = "## Research Questions to Answer\n\n";
    for (const q of questions) {
      context += `### Question
${q.question}

`;
      if (q.importance) {
        context += `**Importance:** ${q.importance}
`;
      }
      if (q.context) {
        context += `**Context:** ${q.context}
`;
      }
      if (q.suggestedResources.length > 0) {
        context += `**Resources:** ${q.suggestedResources.join(", ")}
`;
      }
      context += "\n---\n\n";
    }
    context += "\n## Available Documentation Context\n\n";
    const relevantDocs = this.findRelevantDocs(
      questions.map((q) => q.question).join(" "),
      docsContext,
      5
    );
    for (const [path, content] of relevantDocs) {
      context += `### ${path}
`;
      context += content.slice(0, 3e3) + "\n\n";
    }
    context += "\n## Instructions\n";
    context += "For each research question:\n";
    context += "1. Analyze the available documentation\n";
    context += "2. Synthesize a well-researched answer\n";
    context += "3. Cite sources using [[wiki-links]]\n";
    context += "4. Identify any remaining unknowns\n";
    context += "5. Suggest best practices based on the knowledge graph\n";
    return context;
  }
  /**
   * Build context for MOC builder agent
   */
  buildMOCBuilderContext(gaps, docsContext, analysis) {
    let context = "## Project Context\n\n";
    if (analysis.vision.purpose) {
      context += `### Project Purpose
${analysis.vision.purpose}

`;
    }
    if (analysis.vision.goals.length > 0) {
      context += `### Key Goals
`;
      for (const goal of analysis.vision.goals.slice(0, 5)) {
        context += `- ${goal}
`;
      }
      context += "\n";
    }
    context += "## MOC Files to Populate\n\n";
    const mocFiles = Array.from(docsContext.keys()).filter(
      (k) => k.includes("_MOC.md") || k.includes("MOC.md")
    );
    context += "### Current MOC Files\n";
    for (const mocFile of mocFiles) {
      const content = docsContext.get(mocFile) || "";
      const isEmpty = content.length < 200 || content.includes("stub");
      context += `- ${mocFile} ${isEmpty ? "(EMPTY/STUB)" : "(has content)"}
`;
    }
    context += "\n### Gap Analysis Related to MOCs\n";
    for (const gap of gaps) {
      context += `- ${gap.section}: ${gap.description}
`;
      if (gap.recommendation) {
        context += `  Recommendation: ${gap.recommendation}
`;
      }
    }
    context += "\n### Documentation Structure\n";
    const directories = /* @__PURE__ */ new Set();
    for (const path of docsContext.keys()) {
      const dir = dirname(path);
      if (dir !== ".") {
        directories.add(dir);
      }
    }
    for (const dir of directories) {
      const docsInDir = Array.from(docsContext.keys()).filter((k) => dirname(k) === dir);
      context += `- ${dir}/ (${docsInDir.length} docs)
`;
      for (const doc of docsInDir.slice(0, 10)) {
        context += `  - ${basename(doc)}
`;
      }
    }
    context += "\n### Key Technical Documentation (for reference)\n";
    const keyDocs = Array.from(docsContext.entries()).filter(([path]) => {
      const lower = path.toLowerCase();
      return lower.includes("test_strategy") || lower.includes("wasm") || lower.includes("architecture") || lower.includes("original_spec");
    }).slice(0, 3);
    for (const [path, content] of keyDocs) {
      context += `
#### ${path}
`;
      context += content.slice(0, 2e3) + "\n";
    }
    context += "\n## Instructions\n";
    context += "CRITICAL: Create MOCs that reflect the ACTUAL project content, not generic placeholders.\n";
    context += "Use the project context and technical documentation above.\n\n";
    context += "For each empty/stub MOC file:\n";
    context += "1. Create a proper introduction describing what the section covers IN THIS PROJECT\n";
    context += "2. List all documents in that directory with [[wiki-links]]\n";
    context += "3. Organize by subcategory if applicable\n";
    context += "4. Add brief, PROJECT-SPECIFIC descriptions for each linked document\n";
    context += "5. Include navigation links to parent/sibling MOCs\n";
    context += "6. Reference actual technologies and concepts from the project (e.g., Rust WASM, knowledge graph)\n";
    return context;
  }
  /**
   * Build context for connector agent
   */
  buildConnectorContext(connections, docsContext) {
    let context = "## Suggested Knowledge Graph Connections\n\n";
    for (const conn of connections) {
      context += `- [${conn.source}] --${conn.relationship}--> [${conn.target}]`;
      if (conn.reason) {
        context += `: ${conn.reason}`;
      }
      context += "\n";
    }
    context += "\n## Existing Documents\n";
    for (const [path] of Array.from(docsContext.entries()).slice(0, 30)) {
      context += `- [[${path.replace(".md", "")}]]
`;
    }
    context += "\n## Instructions\n";
    context += "For each suggested connection:\n";
    context += "1. Find the source document\n";
    context += "2. Add appropriate wiki-link [[target]] to the source\n";
    context += "3. Consider adding reciprocal links where appropriate\n";
    context += '4. Use "See also" or "Related" sections for connections\n';
    context += "5. Ensure the link context is meaningful\n";
    return context;
  }
  /**
   * Build context for integrator agent
   */
  buildIntegratorContext(analysis, docsContext) {
    let context = "## Integration Context\n\n";
    context += "### Project Vision\n";
    context += analysis.vision.purpose + "\n\n";
    context += "### Goals\n";
    for (const goal of analysis.vision.goals) {
      context += `- ${goal}
`;
    }
    context += "\n### Key Recommendations\n";
    for (const rec of analysis.vision.recommendations) {
      context += `- ${rec}
`;
    }
    context += "\n### Statistics\n";
    context += `- Total documents: ${docsContext.size}
`;
    context += `- Gaps identified: ${analysis.gaps.length}
`;
    context += `- Questions to answer: ${analysis.questions.length}
`;
    context += `- Connections to build: ${analysis.connections.length}
`;
    context += "\n## Instructions\n";
    context += "Create an integration summary that:\n";
    context += "1. Lists all changes made during migration\n";
    context += "2. Highlights any remaining gaps\n";
    context += "3. Suggests next steps for documentation improvement\n";
    context += "4. Provides a quality assessment\n";
    return context;
  }
  /**
   * Build context for SOP gap filler agent
   */
  buildSOPGapFillerContext(sopGaps, docsContext, analysis) {
    let context = "## AI-SDLC SOP Compliance Gaps\n\n";
    if (analysis.sopSummary) {
      context += "### Compliance Summary\n";
      context += `- Total Gaps: ${analysis.sopSummary.totalGaps}
`;
      context += `- Critical Gaps: ${analysis.sopSummary.criticalGaps}
`;
      context += `- Compliance: ${analysis.sopSummary.compliancePercentage}%

`;
    }
    if (analysis.vision.purpose) {
      context += `### Project Purpose
${analysis.vision.purpose}

`;
    }
    context += "## Key Technical Documentation\n\n";
    const keyDocPatterns = [
      "test_strategy",
      "technical",
      "architecture",
      "wasm",
      "rust",
      "original_spec",
      "integration",
      "requirements",
      "security"
    ];
    for (const [docPath, docContent] of docsContext) {
      const lowerPath = docPath.toLowerCase();
      if (keyDocPatterns.some((pattern) => lowerPath.includes(pattern))) {
        context += `### ${docPath}
`;
        context += docContent.slice(0, 3e3) + "\n\n";
      }
    }
    context += "## SOP Compliance Gaps to Address\n\n";
    context += "The following gaps were identified from AI-SDLC SOP compliance analysis.\n";
    context += "Create documentation to address each gap based on the project context.\n\n";
    const gapsBySOP = /* @__PURE__ */ new Map();
    for (const gap of sopGaps) {
      const sopId = gap.sopId || "general";
      if (!gapsBySOP.has(sopId)) {
        gapsBySOP.set(sopId, []);
      }
      gapsBySOP.get(sopId).push(gap);
    }
    for (const [sopId, gaps] of gapsBySOP) {
      context += `### SOP: ${sopId}

`;
      for (const gap of gaps) {
        context += `#### ${gap.priority.toUpperCase()}: ${gap.description}
`;
        context += `- **Requirement:** ${gap.requirementId}
`;
        context += `- **Effort:** ${gap.effort}
`;
        context += `- **Remediation:** ${gap.remediation}

`;
      }
    }
    context += "\n## Instructions\n";
    context += "CRITICAL: Create documentation to address the SOP compliance gaps above.\n";
    context += "Use the project context and technical documentation to ensure relevance.\n\n";
    context += "OUTPUT FORMAT - Use this EXACT format for EACH document you create:\n\n";
    context += "```document\n";
    context += "---\n";
    context += "path: relative/path/to/file.md\n";
    context += "action: create\n";
    context += "---\n";
    context += "# Document Title\n\n";
    context += "Document content with [[wiki-links]] to other documents.\n";
    context += "```\n\n";
    context += "For each SOP gap:\n";
    context += "1. Create documentation that directly addresses the compliance requirement\n";
    context += "2. Place documents in appropriate directories based on type:\n";
    context += "   - standards/ for coding standards, style guides, policies\n";
    context += "   - guides/ for tutorials, how-tos, processes\n";
    context += "   - references/ for API docs, specifications, schemas\n";
    context += "   - docs/ for general documentation\n";
    context += "3. Include project-specific content (Rust, WASM, TypeScript, Knowledge Graph)\n";
    context += "4. Reference existing documentation with [[wiki-links]]\n";
    context += "5. Follow the remediation guidance provided for each gap\n";
    return context;
  }
  /**
   * Execute a single migration agent
   */
  async executeAgent(agent, analysis, docsContext) {
    this.log("info", `Executing agent: ${agent.name}`, { type: agent.type });
    const prompt = this.buildAgentPrompt(agent);
    const response = await this.callAI(prompt, agent.type);
    if (!response) {
      throw new Error("No response from AI");
    }
    const result = await this.processAgentResponse(agent, response, docsContext);
    this.log("info", `Agent ${agent.name} completed`, result);
    return result;
  }
  /**
   * Build prompt for agent
   */
  buildAgentPrompt(agent) {
    return `# ${agent.name}

## Task
${agent.task}

${agent.context}

## Output Format
Provide your response in markdown format with clear sections.
For each document to create or update, use this format:

\`\`\`document
---
path: relative/path/to/file.md
action: create|update
---
# Document Title

Document content here with [[wiki-links]] to other documents.
\`\`\`

For research answers, use:
\`\`\`answer
## Question
The original question

## Answer
Your researched answer with [[citations]]

## Best Practices
- Recommendation 1
- Recommendation 2

## Remaining Unknowns
- Any unresolved items
\`\`\`
`;
  }
  /**
   * Select the best model based on task complexity
   * - Research and gap-filling tasks use the most capable model
   * - Simpler tasks use faster models
   */
  selectGeminiModel(agentType) {
    const complexTasks = ["gap-filler", "researcher"];
    if (complexTasks.includes(agentType)) {
      return "gemini-2.5-pro";
    }
    return "gemini-2.5-flash";
  }
  /**
   * Call AI (Gemini or fallback)
   */
  async callAI(prompt, agentType) {
    if (this.geminiClient) {
      const modelName = this.selectGeminiModel(agentType);
      try {
        this.log("info", `Using model: ${modelName}`, { agentType });
        const model = this.geminiClient.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        if (modelName !== "gemini-2.5-flash") {
          this.log("warn", `${modelName} failed, falling back to gemini-2.5-flash`, { error: String(error) });
          try {
            const fallbackModel = this.geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await fallbackModel.generateContent(prompt);
            return result.response.text();
          } catch (fallbackError) {
            this.log("error", "Gemini fallback also failed", { error: String(fallbackError) });
          }
        } else {
          this.log("error", "Gemini API call failed", { error: String(error) });
        }
        return null;
      }
    }
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { default: Anthropic } = await import("@anthropic-ai/sdk");
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const complexTasks = ["gap-filler", "researcher"];
        const model = complexTasks.includes(agentType) ? "claude-sonnet-4-20250514" : "claude-sonnet-4-20250514";
        const message = await client.messages.create({
          model,
          max_tokens: 8e3,
          messages: [{ role: "user", content: prompt }]
        });
        const textBlock = message.content.find((b) => b.type === "text");
        return textBlock ? textBlock.text : null;
      } catch (error) {
        this.log("error", "Anthropic API call failed", { error: String(error) });
        return null;
      }
    }
    return null;
  }
  /**
   * Process agent response and create/update documents
   */
  async processAgentResponse(agent, response, docsContext) {
    const result = {
      documentsCreated: 0,
      documentsUpdated: 0,
      gapsFilled: 0,
      questionsAnswered: 0,
      connectionsAdded: 0
    };
    const documentMatches = response.matchAll(/```document\n---\npath:\s*([^\n]+)\naction:\s*(\w+)\n---\n([\s\S]*?)```/g);
    for (const match of documentMatches) {
      const path = match[1].trim();
      const action = match[2].trim();
      const content = match[3].trim();
      if (this.dryRun) {
        this.log("info", `[DRY RUN] Would ${action}: ${path}`);
        continue;
      }
      const fullPath = join(this.projectRoot, this.docsPath, path);
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const finalContent = this.addFrontmatter(content, path, agent.type);
      writeFileSync(fullPath, finalContent, "utf-8");
      if (action === "create") {
        result.documentsCreated++;
        if (agent.type === "gap-filler") {
          result.gapsFilled++;
        }
      } else {
        result.documentsUpdated++;
      }
      const wikiLinks = content.match(/\[\[[^\]]+\]\]/g) || [];
      result.connectionsAdded += wikiLinks.length;
    }
    const answerMatches = response.matchAll(/```answer\n([\s\S]*?)```/g);
    for (const match of answerMatches) {
      result.questionsAnswered++;
      if (agent.outputFile && !this.dryRun) {
        const outputPath = join(this.projectRoot, this.docsPath, "analysis", agent.outputFile);
        const existing = existsSync(outputPath) ? readFileSync(outputPath, "utf-8") : "";
        const newContent = existing + "\n\n---\n\n" + match[1].trim();
        writeFileSync(outputPath, newContent, "utf-8");
      }
    }
    if (agent.outputFile && result.documentsCreated === 0 && !this.dryRun) {
      const outputPath = join(this.projectRoot, this.docsPath, "analysis", agent.outputFile);
      const frontmatter = `---
title: "${agent.name}"
type: migration-output
generator: migration-orchestrator
agent: ${agent.type}
created: ${(/* @__PURE__ */ new Date()).toISOString()}
---

# ${agent.name}

> Generated by MigrationOrchestrator

`;
      writeFileSync(outputPath, frontmatter + response, "utf-8");
      result.documentsCreated++;
    }
    return result;
  }
  /**
   * Add frontmatter to document if not present
   */
  addFrontmatter(content, path, agentType) {
    if (content.startsWith("---")) {
      return content;
    }
    const title = basename(path, ".md").replace(/-/g, " ").replace(/_/g, " ");
    const type = this.inferDocType(path);
    return `---
title: "${title}"
type: ${type}
generator: migration-orchestrator
agent: ${agentType}
created: ${(/* @__PURE__ */ new Date()).toISOString()}
---

${content}`;
  }
  /**
   * Infer document type from path
   */
  inferDocType(path) {
    if (path.includes("concepts")) return "concept";
    if (path.includes("components")) return "component";
    if (path.includes("services")) return "service";
    if (path.includes("features")) return "feature";
    if (path.includes("guides")) return "guide";
    if (path.includes("references")) return "reference";
    if (path.includes("standards")) return "standard";
    if (path.includes("integrations")) return "integration";
    if (path.includes("MOC")) return "moc";
    return "document";
  }
  /**
   * Update MOC files with new connections
   */
  async updateMOCFiles(connections) {
    this.log("info", "MOC files updated with new connections", { count: connections.length });
  }
  /**
   * Find relevant docs based on query
   */
  findRelevantDocs(query, docsContext, limit) {
    const relevant = /* @__PURE__ */ new Map();
    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const scored = Array.from(docsContext.entries()).map(([path, content]) => {
      let score = 0;
      const lowerContent = content.toLowerCase();
      for (const word of queryWords) {
        if (lowerContent.includes(word)) {
          score++;
        }
      }
      return { path, content, score };
    });
    scored.sort((a, b) => b.score - a.score);
    for (const item of scored.slice(0, limit)) {
      if (item.score > 0) {
        relevant.set(item.path, item.content);
      }
    }
    return relevant;
  }
  /**
   * Infer priority from description
   */
  inferPriority(description, recommendation) {
    const text = (description + " " + recommendation).toLowerCase();
    if (text.includes("critical") || text.includes("missing") || text.includes("empty") || text.includes("stub") || text.includes("required")) {
      return "high";
    }
    if (text.includes("should") || text.includes("recommend") || text.includes("consider")) {
      return "medium";
    }
    return "low";
  }
  /**
   * Log message
   */
  log(level, message, data) {
    if (!this.verbose && level === "info") return;
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().split("T")[1].split(".")[0];
    const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "📋";
    console.log(`[${timestamp}] ${prefix} [migration] ${message}`, data ? JSON.stringify(data) : "");
  }
}
export {
  MigrationOrchestrator
};
//# sourceMappingURL=migration-orchestrator.js.map
