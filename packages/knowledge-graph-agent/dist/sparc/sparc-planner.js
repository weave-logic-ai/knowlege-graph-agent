import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, basename, relative, extname } from "path";
import matter from "gray-matter";
import { createLogger } from "../utils/logger.js";
import { createDecisionLogManager } from "./decision-log.js";
import { createConsensusBuilder, ConsensusBuilder } from "./consensus.js";
import { createReviewProcess } from "./review-process.js";
const logger = createLogger("sparc-planner");
class SPARCPlanner {
  options;
  plan;
  decisionLog;
  consensusBuilder;
  parsedDocs = [];
  constructor(options) {
    this.options = {
      outputDir: join(options.projectRoot, ".sparc"),
      docsDir: "docs",
      parallelResearch: true,
      reviewPasses: 3,
      autoConsensus: true,
      kgEnabled: true,
      vectorEnabled: true,
      ...options
    };
    this.plan = this.initializePlan();
    this.decisionLog = createDecisionLogManager({
      outputDir: this.options.outputDir,
      planId: this.plan.id
    });
    this.consensusBuilder = createConsensusBuilder({
      defaultThreshold: 0.67,
      method: "majority"
    });
    logger.info("SPARC Planner initialized", {
      planId: this.plan.id,
      projectRoot: this.options.projectRoot,
      docsDir: this.options.docsDir
    });
  }
  /**
   * Initialize a new plan
   */
  initializePlan() {
    const now = /* @__PURE__ */ new Date();
    const id = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      id,
      name: this.options.name,
      description: this.options.description,
      status: "draft",
      currentPhase: "specification",
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
          consensusRequired: 0
        },
        createdAt: now,
        updatedAt: now
      },
      createdAt: now,
      updatedAt: now,
      version: "1.0.0",
      author: "sparc-planner",
      statistics: {
        totalTasks: 0,
        completedTasks: 0,
        parallelizableTasks: 0,
        estimatedHours: 0,
        researchFindings: 0,
        decisions: 0,
        kgNodes: 0
      }
    };
  }
  /**
   * Execute the full planning process
   */
  async executePlanning() {
    logger.info("Starting SPARC planning process", { planId: this.plan.id });
    try {
      this.plan.status = "researching";
      await this.executeResearchPhase();
      this.plan.status = "planning";
      await this.executeSpecificationPhase();
      await this.executePseudocodePhase();
      await this.executeArchitecturePhase();
      await this.executeRefinementPhase();
      this.plan.status = "reviewing";
      const reviewResult = await this.executeReviewPhase();
      this.plan.reviewResult = reviewResult;
      if (reviewResult.overallStatus === "approved") {
        this.plan.status = "approved";
      } else if (reviewResult.overallStatus === "rejected") {
        this.plan.status = "failed";
      } else {
        this.plan.status = "planning";
      }
      this.updateStatistics();
      this.savePlan();
      logger.info("SPARC planning completed", {
        planId: this.plan.id,
        status: this.plan.status,
        tasks: this.plan.tasks.length,
        docsAnalyzed: this.parsedDocs.length
      });
      return this.plan;
    } catch (error) {
      this.plan.status = "failed";
      logger.error("SPARC planning failed", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  /**
   * Execute research phase - read and parse all documentation
   */
  async executeResearchPhase() {
    logger.info("Executing research phase");
    this.plan.currentPhase = "specification";
    const docsPath = join(this.options.projectRoot, this.options.docsDir);
    if (existsSync(docsPath)) {
      this.parsedDocs = await this.readDocsDirectory(docsPath);
      for (const doc of this.parsedDocs) {
        const finding = this.createFindingFromDoc(doc);
        this.plan.researchFindings.push(finding);
      }
      this.addDecision(
        "Documentation Analysis",
        `Analyzed ${this.parsedDocs.length} documentation files from ${this.options.docsDir}/`,
        "specification",
        "high",
        `Found ${this.parsedDocs.filter((d) => d.type === "feature").length} feature docs, ${this.parsedDocs.filter((d) => d.type === "requirement").length} requirement docs, ${this.parsedDocs.filter((d) => d.type === "architecture").length} architecture docs`
      );
    } else {
      logger.warn("No docs directory found", { docsPath });
    }
    const srcPath = join(this.options.projectRoot, "src");
    if (existsSync(srcPath)) {
      this.plan.existingCode = await this.analyzeExistingCode(srcPath);
      this.addDecision(
        "Existing Code Integration",
        `Found ${this.plan.existingCode.fileCount} files in src/`,
        "specification",
        "high",
        `Languages: ${Object.entries(this.plan.existingCode.languages).map(([k, v]) => `${k}: ${v}`).join(", ")}`
      );
    }
    logger.info("Research phase completed", {
      docsAnalyzed: this.parsedDocs.length,
      findings: this.plan.researchFindings.length,
      hasExistingCode: !!this.plan.existingCode
    });
  }
  /**
   * Read all documentation files from a directory
   */
  async readDocsDirectory(docsPath) {
    const docs = [];
    const readDir = (dir) => {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (!entry.startsWith(".") && entry !== "node_modules") {
            readDir(fullPath);
          }
        } else if (stat.isFile() && (entry.endsWith(".md") || entry.endsWith(".mdx"))) {
          try {
            const doc = this.parseDocFile(fullPath);
            docs.push(doc);
          } catch (error) {
            logger.warn("Failed to parse doc file", { path: fullPath, error });
          }
        }
      }
    };
    readDir(docsPath);
    return docs;
  }
  /**
   * Parse a markdown documentation file
   */
  parseDocFile(filePath) {
    const content = readFileSync(filePath, "utf-8");
    const { data: frontmatter, content: body } = matter(content);
    const filename = basename(filePath);
    const headings = this.extractHeadings(body);
    const sections = this.extractSections(body, headings);
    const codeBlocks = this.extractCodeBlocks(body);
    const links = this.extractLinks(body);
    let title = frontmatter.title || "";
    if (!title && headings.length > 0) {
      title = headings[0].text;
    }
    if (!title) {
      title = filename.replace(/\.(md|mdx)$/, "");
    }
    const type = this.classifyDocument(filePath, frontmatter, title, body);
    return {
      path: filePath,
      filename,
      title,
      content: body,
      frontmatter,
      headings,
      sections,
      codeBlocks,
      links,
      type
    };
  }
  /**
   * Extract headings from markdown content
   */
  extractHeadings(content) {
    const headings = [];
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        headings.push({
          level: match[1].length,
          text: match[2].trim(),
          line: index + 1
        });
      }
    });
    return headings;
  }
  /**
   * Extract sections from markdown content based on headings
   */
  extractSections(content, headings) {
    const sections = [];
    const lines = content.split("\n");
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const nextHeading = headings[i + 1];
      const startLine = heading.line;
      const endLine = nextHeading ? nextHeading.line - 1 : lines.length;
      const sectionContent = lines.slice(startLine, endLine).join("\n").trim();
      sections.push({
        heading: heading.text,
        content: sectionContent,
        level: heading.level
      });
    }
    return sections;
  }
  /**
   * Extract code blocks from markdown
   */
  extractCodeBlocks(content) {
    const blocks = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || "text",
        code: match[2].trim()
      });
    }
    return blocks;
  }
  /**
   * Extract links from markdown
   */
  extractLinks(content) {
    const links = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      links.push(match[2]);
    }
    return links;
  }
  /**
   * Classify document type based on content and path
   */
  classifyDocument(filePath, frontmatter, title, content) {
    const lowerPath = filePath.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();
    if (frontmatter.type) {
      const type = String(frontmatter.type).toLowerCase();
      if (type.includes("feature")) return "feature";
      if (type.includes("require")) return "requirement";
      if (type.includes("arch")) return "architecture";
      if (type.includes("api")) return "api";
      if (type.includes("spec")) return "spec";
      if (type.includes("guide")) return "guide";
    }
    if (lowerPath.includes("/features/") || lowerPath.includes("/feature/")) return "feature";
    if (lowerPath.includes("/requirements/") || lowerPath.includes("/req/")) return "requirement";
    if (lowerPath.includes("/architecture/") || lowerPath.includes("/arch/")) return "architecture";
    if (lowerPath.includes("/api/") || lowerPath.includes("/apis/")) return "api";
    if (lowerPath.includes("/spec/") || lowerPath.includes("/specs/")) return "spec";
    if (lowerPath.includes("/guide/") || lowerPath.includes("/guides/")) return "guide";
    if (lowerTitle.includes("feature") || lowerTitle.includes("epic")) return "feature";
    if (lowerTitle.includes("requirement") || lowerTitle.includes("req-")) return "requirement";
    if (lowerTitle.includes("architecture") || lowerTitle.includes("design")) return "architecture";
    if (lowerTitle.includes("api") || lowerTitle.includes("endpoint")) return "api";
    if (lowerTitle.includes("spec")) return "spec";
    const featureKeywords = ["user story", "as a user", "acceptance criteria", "feature:", "epic:"];
    const reqKeywords = ["shall", "must", "requirement", "req-", "functional requirement", "non-functional"];
    const archKeywords = ["component", "module", "service", "architecture", "system design", "data flow"];
    const apiKeywords = ["endpoint", "request", "response", "http", "rest", "graphql", "method:"];
    if (featureKeywords.some((kw) => lowerContent.includes(kw))) return "feature";
    if (reqKeywords.some((kw) => lowerContent.includes(kw))) return "requirement";
    if (archKeywords.some((kw) => lowerContent.includes(kw))) return "architecture";
    if (apiKeywords.some((kw) => lowerContent.includes(kw))) return "api";
    return "unknown";
  }
  /**
   * Create a research finding from a parsed document
   */
  createFindingFromDoc(doc) {
    return {
      id: `finding_${doc.filename.replace(/[^a-z0-9]/gi, "_")}`,
      agent: "doc-analyzer",
      topic: doc.type,
      summary: doc.title,
      details: this.summarizeDocContent(doc),
      confidence: doc.frontmatter.status === "approved" ? "high" : "medium",
      evidence: [doc.path],
      relatedFindings: [],
      kgReferences: [],
      vectorResults: [],
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Summarize document content
   */
  summarizeDocContent(doc) {
    const lines = [];
    lines.push(`**Document Type:** ${doc.type}`);
    lines.push(`**File:** ${relative(this.options.projectRoot, doc.path)}`);
    if (doc.headings.length > 0) {
      lines.push(`**Sections:** ${doc.headings.map((h) => h.text).join(", ")}`);
    }
    if (doc.codeBlocks.length > 0) {
      lines.push(`**Code Examples:** ${doc.codeBlocks.length} blocks (${[...new Set(doc.codeBlocks.map((b) => b.language))].join(", ")})`);
    }
    const contentPreview = doc.content.substring(0, 500).replace(/\n/g, " ").trim();
    if (contentPreview) {
      lines.push(`**Preview:** ${contentPreview}...`);
    }
    return lines.join("\n");
  }
  /**
   * Execute specification phase - extract requirements and features from docs
   */
  async executeSpecificationPhase() {
    logger.info("Executing specification phase");
    this.plan.currentPhase = "specification";
    const requirements = this.extractRequirementsFromDocs();
    const features = this.extractFeaturesFromDocs();
    const spec = {
      id: `spec_${this.plan.id}`,
      projectName: this.options.name,
      version: "1.0.0",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      summary: this.options.description,
      problemStatement: this.extractProblemStatement(),
      goals: this.extractGoals(),
      requirements,
      features,
      constraints: this.extractConstraints(),
      assumptions: this.extractAssumptions(),
      outOfScope: [],
      successMetrics: this.extractSuccessMetrics(),
      kgReferences: []
    };
    this.plan.specification = spec;
    this.addDecision(
      "Requirements Extracted",
      `Extracted ${requirements.length} requirements and ${features.length} features from documentation`,
      "specification",
      requirements.length > 0 ? "high" : "low",
      `Sources: ${this.parsedDocs.filter((d) => d.type === "requirement" || d.type === "feature").map((d) => d.filename).join(", ")}`
    );
    logger.info("Specification phase completed", {
      requirements: requirements.length,
      features: features.length
    });
  }
  /**
   * Extract requirements from documentation
   */
  extractRequirementsFromDocs() {
    const requirements = [];
    let reqCounter = 1;
    const reqDocs = this.parsedDocs.filter((d) => d.type === "requirement" || d.type === "spec");
    for (const doc of reqDocs) {
      for (const section of doc.sections) {
        const lowerHeading = section.heading.toLowerCase();
        if (lowerHeading.includes("requirement") || lowerHeading.includes("shall") || lowerHeading.includes("must")) {
          requirements.push(this.createRequirement(
            `REQ-${String(reqCounter++).padStart(3, "0")}`,
            section.heading,
            section.content,
            "functional",
            doc.path
          ));
        }
        if (lowerHeading.includes("non-functional") || lowerHeading.includes("performance") || lowerHeading.includes("security") || lowerHeading.includes("scalability")) {
          requirements.push(this.createRequirement(
            `NFR-${String(reqCounter++).padStart(3, "0")}`,
            section.heading,
            section.content,
            "non-functional",
            doc.path
          ));
        }
      }
      const bulletReqs = this.extractBulletRequirements(doc.content);
      for (const req of bulletReqs) {
        requirements.push(this.createRequirement(
          `REQ-${String(reqCounter++).padStart(3, "0")}`,
          req.title,
          req.description,
          "functional",
          doc.path
        ));
      }
    }
    const featureDocs = this.parsedDocs.filter((d) => d.type === "feature");
    for (const doc of featureDocs) {
      for (const section of doc.sections) {
        if (section.heading.toLowerCase().includes("requirement") || section.heading.toLowerCase().includes("acceptance")) {
          requirements.push(this.createRequirement(
            `REQ-${String(reqCounter++).padStart(3, "0")}`,
            `${doc.title}: ${section.heading}`,
            section.content,
            "functional",
            doc.path
          ));
        }
      }
    }
    return requirements;
  }
  /**
   * Extract bullet point requirements from content
   */
  extractBulletRequirements(content) {
    const reqs = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^[-*]\s+(.+(?:shall|must|should).+)$/i);
      if (match) {
        const text = match[1].trim();
        reqs.push({
          title: text.substring(0, 60) + (text.length > 60 ? "..." : ""),
          description: text
        });
      }
    }
    return reqs;
  }
  /**
   * Create a requirement object
   */
  createRequirement(id, title, description, type, source) {
    const criteria = this.extractAcceptanceCriteria(description);
    return {
      id,
      type,
      description: description.substring(0, 500),
      priority: this.inferPriority(description),
      source: relative(this.options.projectRoot, source),
      acceptanceCriteria: criteria.length > 0 ? criteria : [`${title} is implemented and working`],
      relatedRequirements: []
    };
  }
  /**
   * Extract acceptance criteria from text
   */
  extractAcceptanceCriteria(text) {
    const criteria = [];
    const lines = text.split("\n");
    let inCriteriaSection = false;
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes("acceptance criteria") || lowerLine.includes("criteria:")) {
        inCriteriaSection = true;
        continue;
      }
      if (inCriteriaSection) {
        const match = line.match(/^[-*]\s+(.+)$/);
        if (match) {
          criteria.push(match[1].trim());
        } else if (line.match(/^#{1,6}\s/)) {
          inCriteriaSection = false;
        }
      }
      if (line.match(/^\s*(Given|When|Then)\s+/i)) {
        criteria.push(line.trim());
      }
    }
    return criteria.slice(0, 10);
  }
  /**
   * Infer priority from text
   */
  inferPriority(text) {
    const lower = text.toLowerCase();
    if (lower.includes("critical") || lower.includes("must have") || lower.includes("p0")) {
      return "must-have";
    }
    if (lower.includes("high priority") || lower.includes("should have") || lower.includes("p1")) {
      return "should-have";
    }
    if (lower.includes("nice to have") || lower.includes("could have") || lower.includes("p2")) {
      return "could-have";
    }
    if (lower.includes("future") || lower.includes("won't") || lower.includes("p3")) {
      return "won-t-have";
    }
    return "should-have";
  }
  /**
   * Extract features from documentation
   */
  extractFeaturesFromDocs() {
    const features = [];
    let featCounter = 1;
    const featureDocs = this.parsedDocs.filter((d) => d.type === "feature");
    for (const doc of featureDocs) {
      features.push(this.createFeatureFromDoc(doc, `FEAT-${String(featCounter++).padStart(3, "0")}`));
    }
    const specDocs = this.parsedDocs.filter((d) => d.type === "spec" || d.type === "unknown");
    for (const doc of specDocs) {
      for (const section of doc.sections) {
        const lowerHeading = section.heading.toLowerCase();
        if (lowerHeading.includes("feature") || lowerHeading.includes("capability") || lowerHeading.includes("functionality")) {
          features.push({
            id: `FEAT-${String(featCounter++).padStart(3, "0")}`,
            name: section.heading,
            description: section.content.substring(0, 500),
            userStories: this.extractUserStories(section.content),
            requirements: [],
            complexity: this.inferComplexity(section.content),
            dependencies: [],
            parallelizable: true
          });
        }
      }
    }
    if (features.length === 0) {
      for (const doc of this.parsedDocs) {
        if (doc.headings.length > 0) {
          for (const heading of doc.headings.filter((h) => h.level <= 2)) {
            const section = doc.sections.find((s) => s.heading === heading.text);
            if (section && section.content.length > 100) {
              features.push({
                id: `FEAT-${String(featCounter++).padStart(3, "0")}`,
                name: heading.text,
                description: section.content.substring(0, 500),
                userStories: this.extractUserStories(section.content),
                requirements: [],
                complexity: this.inferComplexity(section.content),
                dependencies: [],
                parallelizable: true
              });
            }
          }
        }
      }
    }
    return features;
  }
  /**
   * Create a feature from a document
   */
  createFeatureFromDoc(doc, id) {
    return {
      id,
      name: doc.title,
      description: doc.content.substring(0, 1e3),
      userStories: this.extractUserStories(doc.content),
      requirements: [],
      complexity: this.inferComplexity(doc.content),
      dependencies: this.extractDependencies(doc),
      parallelizable: true
    };
  }
  /**
   * Extract user stories from text
   */
  extractUserStories(text) {
    const stories = [];
    const regex = /As a[n]?\s+([^,]+),?\s+I want\s+([^,]+),?\s+(?:so that|because)\s+([^.]+)/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      stories.push(match[0]);
    }
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.toLowerCase().includes("user story") || line.match(/^[-*]\s+As a/i)) {
        stories.push(line.replace(/^[-*]\s+/, "").trim());
      }
    }
    return stories.slice(0, 5);
  }
  /**
   * Infer complexity from content
   */
  inferComplexity(text) {
    const lower = text.toLowerCase();
    const codeBlocks = (text.match(/```/g) || []).length / 2;
    const wordCount = text.split(/\s+/).length;
    if (lower.includes("complex") || lower.includes("difficult") || codeBlocks > 5 || wordCount > 1e3) {
      return "very-high";
    }
    if (lower.includes("moderate") || codeBlocks > 3 || wordCount > 500) {
      return "high";
    }
    if (lower.includes("simple") || lower.includes("basic") || wordCount < 200) {
      return "low";
    }
    return "medium";
  }
  /**
   * Extract dependencies from document links
   */
  extractDependencies(doc) {
    const deps = [];
    for (const link of doc.links) {
      if (link.startsWith("./") || link.startsWith("../") || !link.startsWith("http")) {
        const linkedDoc = this.parsedDocs.find((d) => d.path.includes(link.replace(".md", "")));
        if (linkedDoc && linkedDoc.type === "feature") {
          deps.push(linkedDoc.title);
        }
      }
    }
    return deps;
  }
  /**
   * Extract problem statement from docs
   */
  extractProblemStatement() {
    for (const doc of this.parsedDocs) {
      for (const section of doc.sections) {
        const lower = section.heading.toLowerCase();
        if (lower.includes("problem") || lower.includes("overview") || lower.includes("background")) {
          return section.content.substring(0, 1e3);
        }
      }
    }
    return `Building: ${this.options.description}`;
  }
  /**
   * Extract goals from docs
   */
  extractGoals() {
    const goals = [];
    for (const doc of this.parsedDocs) {
      for (const section of doc.sections) {
        const lower = section.heading.toLowerCase();
        if (lower.includes("goal") || lower.includes("objective") || lower.includes("outcome")) {
          const bullets = section.content.match(/^[-*]\s+(.+)$/gm);
          if (bullets) {
            goals.push(...bullets.map((b) => b.replace(/^[-*]\s+/, "").trim()));
          }
        }
      }
    }
    return goals.length > 0 ? goals.slice(0, 10) : ["Complete implementation as documented"];
  }
  /**
   * Extract constraints from docs
   */
  extractConstraints() {
    const constraints = [];
    for (const doc of this.parsedDocs) {
      for (const section of doc.sections) {
        const lower = section.heading.toLowerCase();
        if (lower.includes("constraint") || lower.includes("limitation") || lower.includes("restriction")) {
          const bullets = section.content.match(/^[-*]\s+(.+)$/gm);
          if (bullets) {
            constraints.push(...bullets.map((b) => b.replace(/^[-*]\s+/, "").trim()));
          }
        }
      }
    }
    return constraints;
  }
  /**
   * Extract assumptions from docs
   */
  extractAssumptions() {
    const assumptions = [];
    for (const doc of this.parsedDocs) {
      for (const section of doc.sections) {
        if (section.heading.toLowerCase().includes("assumption")) {
          const bullets = section.content.match(/^[-*]\s+(.+)$/gm);
          if (bullets) {
            assumptions.push(...bullets.map((b) => b.replace(/^[-*]\s+/, "").trim()));
          }
        }
      }
    }
    return assumptions;
  }
  /**
   * Extract success metrics from docs
   */
  extractSuccessMetrics() {
    const metrics = [];
    for (const doc of this.parsedDocs) {
      for (const section of doc.sections) {
        const lower = section.heading.toLowerCase();
        if (lower.includes("metric") || lower.includes("success") || lower.includes("kpi")) {
          const bullets = section.content.match(/^[-*]\s+(.+)$/gm);
          if (bullets) {
            metrics.push(...bullets.map((b) => b.replace(/^[-*]\s+/, "").trim()));
          }
        }
      }
    }
    return metrics.length > 0 ? metrics : ["All documented features implemented", "All tests passing"];
  }
  /**
   * Execute pseudocode phase
   */
  async executePseudocodePhase() {
    logger.info("Executing pseudocode phase");
    this.plan.currentPhase = "pseudocode";
    const algorithms = [];
    const apiDocs = this.parsedDocs.filter((d) => d.type === "api");
    for (const doc of apiDocs) {
      algorithms.push(this.createAlgorithmFromDoc(doc));
    }
    for (const feature of this.plan.specification?.features || []) {
      const featureDoc = this.parsedDocs.find((d) => d.title === feature.name);
      if (featureDoc && featureDoc.codeBlocks.length > 0) {
        algorithms.push(this.createAlgorithmFromDoc(featureDoc));
      }
    }
    this.plan.algorithms = algorithms;
    logger.info("Pseudocode phase completed", { algorithms: algorithms.length });
  }
  /**
   * Create algorithm design from document
   */
  createAlgorithmFromDoc(doc) {
    const steps = [];
    let stepNum = 1;
    for (const section of doc.sections) {
      if (section.level >= 2) {
        const relevantCodeBlock = doc.codeBlocks.find(
          (block) => section.content.includes(block.code.substring(0, 50))
        );
        steps.push({
          step: stepNum++,
          description: section.heading,
          pseudocode: relevantCodeBlock?.code ?? `// Implement ${section.heading}`,
          inputs: [],
          outputs: []
        });
      }
    }
    if (steps.length === 0 && doc.codeBlocks.length > 0) {
      for (const block of doc.codeBlocks) {
        steps.push({
          step: stepNum++,
          description: `${block.language} implementation`,
          pseudocode: block.code,
          inputs: [],
          outputs: []
        });
      }
    }
    return {
      id: `algo_${doc.filename.replace(/[^a-z0-9]/gi, "_")}`,
      name: doc.title,
      purpose: doc.content.substring(0, 200),
      steps: steps.length > 0 ? steps : [{
        step: 1,
        description: "Implement feature",
        pseudocode: "// Implementation needed",
        inputs: [],
        outputs: []
      }],
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      edgeCases: [],
      relatedFeatures: []
    };
  }
  /**
   * Execute architecture phase
   */
  async executeArchitecturePhase() {
    logger.info("Executing architecture phase");
    this.plan.currentPhase = "architecture";
    const components = this.extractComponentsFromDocs();
    const patterns = this.extractPatternsFromDocs();
    const arch = {
      id: `arch_${this.plan.id}`,
      version: "1.0.0",
      createdAt: /* @__PURE__ */ new Date(),
      overview: this.extractArchitectureOverview(),
      patterns,
      components,
      decisions: [],
      dataFlow: this.extractDataFlow(),
      securityConsiderations: this.extractSecurityConsiderations(),
      scalabilityConsiderations: [],
      diagrams: []
    };
    this.plan.architecture = arch;
    this.addDecision(
      "Architecture Defined",
      `Identified ${components.length} components with patterns: ${patterns.join(", ")}`,
      "architecture",
      components.length > 0 ? "medium" : "low",
      `Based on analysis of ${this.parsedDocs.filter((d) => d.type === "architecture").length} architecture docs`
    );
    logger.info("Architecture phase completed", {
      components: components.length,
      patterns: patterns.length
    });
  }
  /**
   * Extract components from documentation
   */
  extractComponentsFromDocs() {
    const components = [];
    let compCounter = 1;
    const archDocs = this.parsedDocs.filter((d) => d.type === "architecture");
    for (const doc of archDocs) {
      for (const section of doc.sections) {
        const lower = section.heading.toLowerCase();
        if (lower.includes("component") || lower.includes("module") || lower.includes("service") || lower.includes("layer")) {
          components.push({
            id: `COMP-${String(compCounter++).padStart(3, "0")}`,
            name: section.heading,
            type: this.inferComponentType(section.heading, section.content),
            description: section.content.substring(0, 500),
            responsibilities: this.extractResponsibilities(section.content),
            interfaces: [],
            dependencies: [],
            technologies: this.extractTechnologies(section.content),
            path: doc.path
          });
        }
      }
    }
    if (components.length === 0) {
      for (const feature of this.plan.specification?.features || []) {
        components.push({
          id: `COMP-${String(compCounter++).padStart(3, "0")}`,
          name: `${feature.name} Module`,
          type: "module",
          description: feature.description.substring(0, 300),
          responsibilities: [`Implement ${feature.name}`],
          interfaces: [],
          dependencies: feature.dependencies,
          technologies: []
        });
      }
    }
    return components;
  }
  /**
   * Infer component type
   */
  inferComponentType(heading, content) {
    const lower = (heading + " " + content).toLowerCase();
    if (lower.includes("service") || lower.includes("microservice")) return "service";
    if (lower.includes("api") || lower.includes("endpoint")) return "api";
    if (lower.includes("database") || lower.includes("storage") || lower.includes("db")) return "database";
    if (lower.includes("ui") || lower.includes("frontend") || lower.includes("component")) return "ui";
    if (lower.includes("library") || lower.includes("util")) return "library";
    if (lower.includes("infrastructure") || lower.includes("deploy")) return "infrastructure";
    return "module";
  }
  /**
   * Extract responsibilities from content
   */
  extractResponsibilities(content) {
    const responsibilities = [];
    const lines = content.split("\n");
    let inResponsibilitySection = false;
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes("responsibilit") || lower.includes("function") || lower.includes("purpose")) {
        inResponsibilitySection = true;
        continue;
      }
      if (inResponsibilitySection) {
        const match = line.match(/^[-*]\s+(.+)$/);
        if (match) {
          responsibilities.push(match[1].trim());
        } else if (line.match(/^#{1,6}\s/)) {
          inResponsibilitySection = false;
        }
      }
    }
    return responsibilities.slice(0, 5);
  }
  /**
   * Extract technologies mentioned
   */
  extractTechnologies(content) {
    const techs = [];
    const knownTechs = [
      "TypeScript",
      "JavaScript",
      "Python",
      "Go",
      "Rust",
      "Java",
      "React",
      "Vue",
      "Angular",
      "Node.js",
      "Express",
      "FastAPI",
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "SQLite",
      "MySQL",
      "Docker",
      "Kubernetes",
      "AWS",
      "GCP",
      "Azure",
      "GraphQL",
      "REST",
      "gRPC",
      "WebSocket"
    ];
    for (const tech of knownTechs) {
      if (content.toLowerCase().includes(tech.toLowerCase())) {
        techs.push(tech);
      }
    }
    return techs;
  }
  /**
   * Extract patterns from documentation
   */
  extractPatternsFromDocs() {
    const patterns = [];
    const knownPatterns = [
      "MVC",
      "MVVM",
      "MVP",
      "Microservices",
      "Monolith",
      "Serverless",
      "Event-Driven",
      "CQRS",
      "Event Sourcing",
      "Domain-Driven Design",
      "Repository Pattern",
      "Factory Pattern",
      "Singleton",
      "Observer",
      "Clean Architecture",
      "Hexagonal",
      "Layered",
      "Modular"
    ];
    const allContent = this.parsedDocs.map((d) => d.content).join(" ").toLowerCase();
    for (const pattern of knownPatterns) {
      if (allContent.includes(pattern.toLowerCase())) {
        patterns.push(pattern);
      }
    }
    return patterns.length > 0 ? patterns : ["Modular"];
  }
  /**
   * Extract architecture overview
   */
  extractArchitectureOverview() {
    const archDocs = this.parsedDocs.filter((d) => d.type === "architecture");
    if (archDocs.length > 0) {
      return archDocs[0].content.substring(0, 1e3);
    }
    return `Architecture for ${this.options.name}: ${this.options.description}`;
  }
  /**
   * Extract data flow description
   */
  extractDataFlow() {
    for (const doc of this.parsedDocs) {
      for (const section of doc.sections) {
        if (section.heading.toLowerCase().includes("data flow") || section.heading.toLowerCase().includes("flow")) {
          return section.content;
        }
      }
    }
    return "Data flow documentation not found";
  }
  /**
   * Extract security considerations
   */
  extractSecurityConsiderations() {
    const considerations = [];
    for (const doc of this.parsedDocs) {
      for (const section of doc.sections) {
        if (section.heading.toLowerCase().includes("security")) {
          const bullets = section.content.match(/^[-*]\s+(.+)$/gm);
          if (bullets) {
            considerations.push(...bullets.map((b) => b.replace(/^[-*]\s+/, "").trim()));
          }
        }
      }
    }
    return considerations;
  }
  /**
   * Execute refinement phase - generate development tasks
   */
  async executeRefinementPhase() {
    logger.info("Executing refinement phase");
    this.plan.currentPhase = "refinement";
    const tasks = [];
    tasks.push(this.createTask(
      "Documentation Analysis Complete",
      `Analyze all ${this.parsedDocs.length} documentation files`,
      "specification",
      "research",
      "high",
      2,
      true
    ));
    for (const feature of this.plan.specification?.features || []) {
      tasks.push(this.createTask(
        `Design: ${feature.name}`,
        `Design the implementation approach for ${feature.name}: ${feature.description.substring(0, 200)}`,
        "pseudocode",
        "design",
        this.mapComplexityToPriority(feature.complexity),
        this.estimateDesignHours(feature.complexity),
        true
      ));
      tasks.push(this.createTask(
        `Implement: ${feature.name}`,
        `Implement ${feature.name}

User Stories:
${feature.userStories.map((s) => `- ${s}`).join("\n")}`,
        "refinement",
        "implementation",
        this.mapComplexityToPriority(feature.complexity),
        this.estimateImplementationHours(feature.complexity),
        true
      ));
      tasks.push(this.createTask(
        `Test: ${feature.name}`,
        `Create tests for ${feature.name}`,
        "refinement",
        "testing",
        "medium",
        this.estimateTestHours(feature.complexity),
        true
      ));
    }
    for (const component of this.plan.architecture?.components || []) {
      if (!tasks.find((t) => t.name.includes(component.name))) {
        tasks.push(this.createTask(
          `Build: ${component.name}`,
          `Implement the ${component.name} component

Responsibilities:
${component.responsibilities.map((r) => `- ${r}`).join("\n")}`,
          "refinement",
          "implementation",
          "medium",
          4,
          true
        ));
      }
    }
    for (const req of this.plan.specification?.requirements || []) {
      if (!tasks.find((t) => t.description.includes(req.description.substring(0, 50)))) {
        tasks.push(this.createTask(
          `Requirement: ${req.id}`,
          req.description,
          "refinement",
          "implementation",
          this.mapPriorityToTaskPriority(req.priority),
          2,
          true
        ));
      }
    }
    tasks.push(this.createTask(
      "Integration Testing",
      `Create integration tests for all ${(this.plan.specification?.features || []).length} features`,
      "refinement",
      "testing",
      "high",
      8,
      false
    ));
    tasks.push(this.createTask(
      "API Documentation",
      "Document all public APIs and interfaces",
      "completion",
      "documentation",
      "medium",
      4,
      true
    ));
    tasks.push(this.createTask(
      "Final Review",
      "Review all implementations against requirements and documentation",
      "completion",
      "review",
      "high",
      4,
      false
    ));
    this.plan.tasks = tasks;
    this.calculateParallelGroups();
    this.calculateCriticalPath();
    logger.info("Refinement phase completed", {
      tasks: tasks.length,
      parallelGroups: this.plan.parallelGroups.length
    });
  }
  /**
   * Create a SPARC task
   */
  createTask(name, description, phase, type, priority, estimatedHours, parallelizable) {
    return {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      phase,
      type,
      priority,
      estimatedHours,
      dependencies: [],
      parallelizable,
      status: "pending",
      contextLinks: [],
      kgReferences: []
    };
  }
  /**
   * Map complexity to priority
   */
  mapComplexityToPriority(complexity) {
    switch (complexity) {
      case "very-high":
        return "critical";
      case "high":
        return "high";
      case "medium":
        return "medium";
      case "low":
        return "low";
      default:
        return "medium";
    }
  }
  /**
   * Map requirement priority to task priority
   */
  mapPriorityToTaskPriority(priority) {
    switch (priority) {
      case "must-have":
        return "critical";
      case "should-have":
        return "high";
      case "could-have":
        return "medium";
      case "won-t-have":
        return "low";
      default:
        return "medium";
    }
  }
  /**
   * Estimate design hours based on complexity
   */
  estimateDesignHours(complexity) {
    switch (complexity) {
      case "very-high":
        return 8;
      case "high":
        return 4;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 2;
    }
  }
  /**
   * Estimate implementation hours based on complexity
   */
  estimateImplementationHours(complexity) {
    switch (complexity) {
      case "very-high":
        return 40;
      case "high":
        return 20;
      case "medium":
        return 8;
      case "low":
        return 4;
      default:
        return 8;
    }
  }
  /**
   * Estimate test hours based on complexity
   */
  estimateTestHours(complexity) {
    switch (complexity) {
      case "very-high":
        return 16;
      case "high":
        return 8;
      case "medium":
        return 4;
      case "low":
        return 2;
      default:
        return 4;
    }
  }
  /**
   * Calculate parallel task groups
   */
  calculateParallelGroups() {
    const parallelizable = this.plan.tasks.filter((t) => t.parallelizable);
    const groups = [];
    const phases = ["specification", "pseudocode", "architecture", "refinement", "completion"];
    for (const phase of phases) {
      const phaseTasks = parallelizable.filter((t) => t.phase === phase);
      if (phaseTasks.length > 0) {
        groups.push(phaseTasks.map((t) => t.id));
      }
    }
    this.plan.parallelGroups = groups;
  }
  /**
   * Calculate critical path
   */
  calculateCriticalPath() {
    const critical = this.plan.tasks.filter((t) => t.priority === "critical" || t.priority === "high").sort((a, b) => {
      const phaseOrder = ["specification", "pseudocode", "architecture", "refinement", "completion"];
      return phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase);
    }).map((t) => t.id);
    this.plan.criticalPath = critical;
    this.plan.executionOrder = this.plan.tasks.map((t) => t.id);
  }
  /**
   * Analyze existing code in src directory
   */
  async analyzeExistingCode(srcPath) {
    const analysis = {
      hasSrcDirectory: true,
      srcPath,
      fileCount: 0,
      languages: {},
      keyFiles: [],
      patterns: [],
      dependencies: [],
      entryPoints: []
    };
    const analyzeDir = (dir) => {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (!entry.startsWith(".") && entry !== "node_modules") {
            analyzeDir(fullPath);
          }
        } else if (stat.isFile()) {
          analysis.fileCount++;
          const ext = extname(entry);
          analysis.languages[ext] = (analysis.languages[ext] || 0) + 1;
          if (entry === "index.ts" || entry === "index.js") {
            analysis.entryPoints.push(relative(this.options.projectRoot, fullPath));
          }
          if (entry === "package.json") {
            try {
              const pkg = JSON.parse(readFileSync(fullPath, "utf-8"));
              analysis.dependencies = Object.keys(pkg.dependencies || {});
            } catch {
            }
          }
        }
      }
    };
    analyzeDir(srcPath);
    if (analysis.languages[".ts"] > 0 || analysis.languages[".tsx"] > 0) {
      analysis.patterns.push("TypeScript");
    }
    if (existsSync(join(this.options.projectRoot, "tests")) || existsSync(join(this.options.projectRoot, "__tests__"))) {
      analysis.patterns.push("Test-Driven Development");
      analysis.testCoverage = { hasTests: true };
    }
    return analysis;
  }
  /**
   * Execute review phase
   */
  async executeReviewPhase() {
    logger.info("Executing review phase");
    this.plan.currentPhase = "completion";
    this.plan.decisionLog = this.decisionLog.getLog();
    const reviewProcess = createReviewProcess({
      plan: this.plan,
      passes: this.options.reviewPasses,
      autoFix: false,
      strictMode: false
    });
    const result = await reviewProcess.executeReview();
    logger.info("Review phase completed", {
      status: result.overallStatus,
      totalFindings: result.totalFindings,
      criticalFindings: result.criticalFindings
    });
    return result;
  }
  /**
   * Add a decision to the log
   */
  addDecision(title, description, phase, confidence, rationale, alternatives) {
    this.decisionLog.addDecision({
      title,
      description,
      phase,
      confidence,
      rationale,
      alternatives,
      decidedBy: "sparc-planner"
    });
    if (this.options.autoConsensus && ConsensusBuilder.needsConsensus(confidence)) {
      logger.info("Low confidence decision - would trigger consensus", { title, confidence });
    }
  }
  /**
   * Update plan statistics
   */
  updateStatistics() {
    this.plan.statistics = {
      totalTasks: this.plan.tasks.length,
      completedTasks: this.plan.tasks.filter((t) => t.status === "completed").length,
      parallelizableTasks: this.plan.tasks.filter((t) => t.parallelizable).length,
      estimatedHours: this.plan.tasks.reduce((sum, t) => sum + t.estimatedHours, 0),
      researchFindings: this.plan.researchFindings.length,
      decisions: this.decisionLog.getDecisions().length,
      kgNodes: this.plan.tasks.reduce((sum, t) => sum + (t.kgReferences?.length || 0), 0)
    };
    this.plan.updatedAt = /* @__PURE__ */ new Date();
  }
  /**
   * Save plan to disk
   */
  savePlan() {
    const dir = this.options.outputDir;
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const planPath = join(dir, "sparc-plan.json");
    writeFileSync(planPath, JSON.stringify(this.plan, null, 2));
    const mdPath = join(dir, "sparc-plan.md");
    writeFileSync(mdPath, this.generateMarkdownSummary());
    this.decisionLog.save();
    this.decisionLog.saveMarkdown();
    logger.info("Plan saved", { dir });
  }
  /**
   * Generate markdown summary
   */
  generateMarkdownSummary() {
    const lines = [
      `# SPARC Plan: ${this.plan.name}`,
      "",
      `**Status:** ${this.plan.status}`,
      `**Version:** ${this.plan.version}`,
      `**Created:** ${this.plan.createdAt.toISOString()}`,
      `**Docs Analyzed:** ${this.parsedDocs.length} files`,
      "",
      "## Summary",
      "",
      this.plan.description,
      "",
      "## Statistics",
      "",
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Tasks | ${this.plan.statistics.totalTasks} |`,
      `| Parallelizable | ${this.plan.statistics.parallelizableTasks} |`,
      `| Estimated Hours | ${this.plan.statistics.estimatedHours} |`,
      `| Documentation Files Analyzed | ${this.parsedDocs.length} |`,
      `| Research Findings | ${this.plan.statistics.researchFindings} |`,
      `| Decisions | ${this.plan.statistics.decisions} |`,
      ""
    ];
    if (this.parsedDocs.length > 0) {
      lines.push("## Documentation Sources");
      lines.push("");
      const byType = /* @__PURE__ */ new Map();
      for (const doc of this.parsedDocs) {
        const existing = byType.get(doc.type) || [];
        existing.push(doc);
        byType.set(doc.type, existing);
      }
      for (const [type, docs] of byType.entries()) {
        lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)} Documents (${docs.length})`);
        lines.push("");
        for (const doc of docs) {
          lines.push(`- **${doc.title}** - \`${relative(this.options.projectRoot, doc.path)}\``);
        }
        lines.push("");
      }
    }
    if (this.plan.specification) {
      lines.push("## Specification");
      lines.push("");
      lines.push(`- **Requirements:** ${this.plan.specification.requirements.length}`);
      lines.push(`- **Features:** ${this.plan.specification.features.length}`);
      lines.push("");
      if (this.plan.specification.features.length > 0) {
        lines.push("### Features");
        lines.push("");
        for (const feature of this.plan.specification.features) {
          lines.push(`#### ${feature.id}: ${feature.name}`);
          lines.push("");
          lines.push(feature.description.substring(0, 300) + "...");
          lines.push("");
          lines.push(`- **Complexity:** ${feature.complexity}`);
          if (feature.userStories.length > 0) {
            lines.push(`- **User Stories:** ${feature.userStories.length}`);
          }
          lines.push("");
        }
      }
      if (this.plan.specification.requirements.length > 0) {
        lines.push("### Requirements");
        lines.push("");
        for (const req of this.plan.specification.requirements) {
          lines.push(`- **${req.id}** (${req.type}, ${req.priority}): ${req.description.substring(0, 100)}...`);
        }
        lines.push("");
      }
    }
    if (this.plan.architecture) {
      lines.push("## Architecture");
      lines.push("");
      lines.push(`- **Components:** ${this.plan.architecture.components.length}`);
      lines.push(`- **Patterns:** ${this.plan.architecture.patterns.join(", ")}`);
      lines.push("");
      if (this.plan.architecture.components.length > 0) {
        lines.push("### Components");
        lines.push("");
        for (const comp of this.plan.architecture.components) {
          lines.push(`#### ${comp.id}: ${comp.name}`);
          lines.push("");
          lines.push(`- **Type:** ${comp.type}`);
          lines.push(`- **Description:** ${comp.description.substring(0, 200)}`);
          if (comp.technologies.length > 0) {
            lines.push(`- **Technologies:** ${comp.technologies.join(", ")}`);
          }
          lines.push("");
        }
      }
    }
    lines.push("## Development Tasks");
    lines.push("");
    const tasksByPhase = /* @__PURE__ */ new Map();
    for (const task of this.plan.tasks) {
      const existing = tasksByPhase.get(task.phase) || [];
      existing.push(task);
      tasksByPhase.set(task.phase, existing);
    }
    for (const [phase, tasks] of tasksByPhase.entries()) {
      lines.push(`### ${phase.charAt(0).toUpperCase() + phase.slice(1)} Phase (${tasks.length} tasks)`);
      lines.push("");
      for (const task of tasks) {
        lines.push(`#### ${task.name}`);
        lines.push("");
        lines.push(`- **Type:** ${task.type}`);
        lines.push(`- **Priority:** ${task.priority}`);
        lines.push(`- **Estimated:** ${task.estimatedHours}h`);
        lines.push(`- **Parallelizable:** ${task.parallelizable ? "Yes" : "No"}`);
        lines.push("");
        lines.push(task.description.substring(0, 500));
        lines.push("");
      }
    }
    if (this.plan.reviewResult) {
      lines.push("## Review Result");
      lines.push("");
      lines.push(`- **Status:** ${this.plan.reviewResult.overallStatus}`);
      lines.push(`- **Total Findings:** ${this.plan.reviewResult.totalFindings}`);
      lines.push(`- **Critical Findings:** ${this.plan.reviewResult.criticalFindings}`);
      lines.push("");
      if (this.plan.reviewResult.recommendations.length > 0) {
        lines.push("### Recommendations");
        lines.push("");
        for (const rec of this.plan.reviewResult.recommendations) {
          lines.push(`- ${rec}`);
        }
        lines.push("");
      }
    }
    return lines.join("\n");
  }
  /**
   * Get the current plan
   */
  getPlan() {
    return this.plan;
  }
  /**
   * Get decision log manager
   */
  getDecisionLog() {
    return this.decisionLog;
  }
  /**
   * Get parsed documentation
   */
  getParsedDocs() {
    return this.parsedDocs;
  }
}
function createSPARCPlanner(options) {
  return new SPARCPlanner(options);
}
export {
  SPARCPlanner,
  createSPARCPlanner
};
//# sourceMappingURL=sparc-planner.js.map
