import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { join, basename, dirname, relative } from "path";
import fg from "fast-glob";
import matter from "gray-matter";
const CATEGORY_DIRS = {
  concept: "concepts",
  technical: "components",
  feature: "features",
  primitive: "integrations",
  service: "services",
  guide: "guides",
  standard: "standards",
  integration: "integrations"
};
const CATEGORY_KEYWORDS = {
  concept: [
    "overview",
    "introduction",
    "theory",
    "principle",
    "concept",
    "philosophy",
    "approach",
    "methodology",
    "paradigm",
    "model"
  ],
  technical: [
    "component",
    "implementation",
    "class",
    "function",
    "module",
    "algorithm",
    "data structure",
    "interface",
    "abstract",
    "utility"
  ],
  feature: [
    "feature",
    "capability",
    "functionality",
    "use case",
    "user story",
    "requirement",
    "specification",
    "product",
    "roadmap"
  ],
  primitive: [
    "library",
    "framework",
    "dependency",
    "package",
    "tool",
    "sdk",
    "runtime",
    "platform",
    "language"
  ],
  service: [
    "api",
    "endpoint",
    "service",
    "server",
    "backend",
    "microservice",
    "rest",
    "graphql",
    "webhook",
    "worker",
    "queue"
  ],
  guide: [
    "how to",
    "tutorial",
    "guide",
    "walkthrough",
    "step by step",
    "getting started",
    "setup",
    "installation",
    "configuration"
  ],
  standard: [
    "standard",
    "convention",
    "best practice",
    "rule",
    "policy",
    "guideline",
    "coding style",
    "lint",
    "format"
  ],
  integration: [
    "integration",
    "connect",
    "plugin",
    "adapter",
    "bridge",
    "sync",
    "import",
    "export",
    "webhook"
  ]
};
const PATH_PATTERNS = [
  { pattern: /\/(api|endpoints?|routes?)\//i, type: "service" },
  { pattern: /\/(guide|tutorial|howto|getting-started)\//i, type: "guide" },
  { pattern: /\/(component|ui|widget)\//i, type: "technical" },
  { pattern: /\/(feature|capability)\//i, type: "feature" },
  { pattern: /\/(standard|convention|style)\//i, type: "standard" },
  { pattern: /\/(integration|plugin|adapter)\//i, type: "integration" },
  { pattern: /\/(service|worker|job)\//i, type: "service" },
  { pattern: /\/(concept|architecture|design)\//i, type: "concept" }
];
async function convertDocs(options) {
  const {
    sourceDir,
    targetDir = "docs-nn",
    projectRoot,
    preserveOriginal = true,
    force = false,
    autoCategory = true,
    dryRun = false
  } = options;
  const result = {
    success: true,
    filesProcessed: 0,
    filesConverted: 0,
    filesSkipped: 0,
    errors: [],
    converted: []
  };
  const sourcePath = join(projectRoot, sourceDir);
  const targetPath = join(projectRoot, targetDir);
  if (!existsSync(sourcePath)) {
    result.success = false;
    result.errors.push(`Source directory not found: ${sourcePath}`);
    return result;
  }
  if (!dryRun) {
    createTargetStructure(targetPath);
  }
  const files = await fg("**/*.md", {
    cwd: sourcePath,
    ignore: ["node_modules/**", ".git/**", "_templates/**"]
  });
  for (const file of files) {
    result.filesProcessed++;
    const sourceFile = join(sourcePath, file);
    try {
      const content = readFileSync(sourceFile, "utf-8");
      const { data: existingFrontmatter, content: body } = matter(content);
      const nodeType = autoCategory ? detectNodeType(file, body, existingFrontmatter) : existingFrontmatter.type || "concept";
      const targetSubdir = CATEGORY_DIRS[nodeType];
      const targetFile = join(targetPath, targetSubdir, basename(file));
      if (existsSync(targetFile) && !force) {
        result.filesSkipped++;
        continue;
      }
      const frontmatter = generateFrontmatter(file, body, nodeType, existingFrontmatter);
      const newContent = buildMarkdownWithFrontmatter(frontmatter, body);
      if (!dryRun) {
        mkdirSync(dirname(targetFile), { recursive: true });
        writeFileSync(targetFile, newContent, "utf-8");
      }
      result.filesConverted++;
      result.converted.push({
        source: file,
        target: relative(projectRoot, targetFile),
        type: nodeType
      });
    } catch (error) {
      result.errors.push(`Failed to convert ${file}: ${error}`);
    }
  }
  result.success = result.errors.length === 0;
  return result;
}
async function addFrontmatter(options) {
  const {
    target,
    projectRoot,
    type,
    status = "active",
    tags = [],
    force = false,
    dryRun = false
  } = options;
  const result = {
    success: true,
    filesProcessed: 0,
    filesUpdated: 0,
    filesSkipped: 0,
    errors: []
  };
  const targetPath = join(projectRoot, target);
  let files;
  if (existsSync(targetPath) && !targetPath.endsWith(".md")) {
    files = await fg("**/*.md", {
      cwd: targetPath,
      ignore: ["node_modules/**", ".git/**", "_templates/**"],
      absolute: true
    });
  } else if (existsSync(targetPath)) {
    files = [targetPath];
  } else {
    result.success = false;
    result.errors.push(`Target not found: ${targetPath}`);
    return result;
  }
  for (const file of files) {
    result.filesProcessed++;
    try {
      const content = readFileSync(file, "utf-8");
      const { data: existingFrontmatter, content: body } = matter(content);
      if (Object.keys(existingFrontmatter).length > 0 && !force) {
        result.filesSkipped++;
        continue;
      }
      const relPath = relative(projectRoot, file);
      const nodeType = type || detectNodeType(relPath, body, existingFrontmatter);
      const frontmatter = generateFrontmatter(
        relPath,
        body,
        nodeType,
        force ? {} : existingFrontmatter,
        status,
        tags
      );
      const newContent = buildMarkdownWithFrontmatter(frontmatter, body);
      if (!dryRun) {
        writeFileSync(file, newContent, "utf-8");
      }
      result.filesUpdated++;
    } catch (error) {
      result.errors.push(`Failed to update ${file}: ${error}`);
    }
  }
  result.success = result.errors.length === 0;
  return result;
}
async function validateFrontmatter(target, projectRoot) {
  const result = {
    valid: 0,
    invalid: 0,
    missing: 0,
    issues: []
  };
  const targetPath = join(projectRoot, target);
  const files = await fg("**/*.md", {
    cwd: targetPath,
    ignore: ["node_modules/**", ".git/**", "_templates/**"],
    absolute: true
  });
  const validTypes = [
    "concept",
    "technical",
    "feature",
    "primitive",
    "service",
    "guide",
    "standard",
    "integration"
  ];
  const validStatuses = ["draft", "active", "deprecated", "archived"];
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const { data: frontmatter } = matter(content);
    const fileIssues = [];
    if (Object.keys(frontmatter).length === 0) {
      result.missing++;
      fileIssues.push("Missing frontmatter");
    } else {
      if (!frontmatter.title) {
        fileIssues.push("Missing title");
      }
      if (!frontmatter.type) {
        fileIssues.push("Missing type");
      } else if (!validTypes.includes(frontmatter.type)) {
        fileIssues.push(`Invalid type: ${frontmatter.type}`);
      }
      if (frontmatter.status && !validStatuses.includes(frontmatter.status)) {
        fileIssues.push(`Invalid status: ${frontmatter.status}`);
      }
      if (!frontmatter.created) {
        fileIssues.push("Missing created date");
      }
    }
    if (fileIssues.length > 0) {
      result.invalid++;
      result.issues.push({
        file: relative(projectRoot, file),
        issues: fileIssues
      });
    } else if (Object.keys(frontmatter).length > 0) {
      result.valid++;
    }
  }
  return result;
}
function createTargetStructure(targetPath) {
  const dirs = [
    "",
    "concepts",
    "concepts/architecture",
    "concepts/patterns",
    "components",
    "components/ui",
    "components/utilities",
    "services",
    "services/api",
    "services/workers",
    "features",
    "features/core",
    "features/advanced",
    "integrations",
    "integrations/databases",
    "integrations/auth",
    "standards",
    "standards/coding",
    "standards/documentation",
    "guides",
    "guides/getting-started",
    "guides/tutorials",
    "references",
    "references/api",
    "_templates",
    "_attachments"
  ];
  for (const dir of dirs) {
    const fullPath = join(targetPath, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
  }
}
function detectNodeType(filePath, content, existingFrontmatter) {
  const validTypes = [
    "concept",
    "technical",
    "feature",
    "primitive",
    "service",
    "guide",
    "standard",
    "integration"
  ];
  if (existingFrontmatter.type && validTypes.includes(existingFrontmatter.type)) {
    return existingFrontmatter.type;
  }
  for (const { pattern, type } of PATH_PATTERNS) {
    if (pattern.test(filePath)) {
      return type;
    }
  }
  const lowerContent = content.toLowerCase();
  const scores = {
    concept: 0,
    technical: 0,
    feature: 0,
    primitive: 0,
    service: 0,
    guide: 0,
    standard: 0,
    integration: 0
  };
  for (const [nodeType, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = lowerContent.match(regex);
      if (matches) {
        scores[nodeType] += matches.length;
      }
    }
  }
  let maxScore = 0;
  let detectedType = "concept";
  for (const [nodeType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = nodeType;
    }
  }
  return detectedType;
}
function generateFrontmatter(filePath, content, nodeType, existing = {}, status = "active", additionalTags = []) {
  const filename = basename(filePath, ".md");
  const title = existing.title || formatTitle(filename);
  const extractedTags = extractTags(content);
  const allTags = [.../* @__PURE__ */ new Set([
    ...existing.tags || [],
    ...extractedTags,
    ...additionalTags
  ])];
  const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const created = existing.created || now;
  return {
    title,
    type: nodeType,
    status: existing.status || status,
    tags: allTags.length > 0 ? allTags : void 0,
    category: existing.category || void 0,
    description: existing.description || extractDescription(content),
    created,
    updated: now,
    aliases: existing.aliases || void 0,
    related: existing.related || void 0
  };
}
function formatTitle(filename) {
  return filename.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
function extractTags(content) {
  const tags = [];
  const tagMatches = content.match(/#[\w-]+/g);
  if (tagMatches) {
    tags.push(...tagMatches.map((t) => t.slice(1)));
  }
  return tags.slice(0, 10);
}
function extractDescription(content) {
  const lines = content.split("\n");
  let description = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("```")) {
      description = trimmed;
      break;
    }
  }
  if (description.length > 200) {
    description = description.slice(0, 197) + "...";
  }
  return description || void 0;
}
function buildMarkdownWithFrontmatter(frontmatter, content) {
  const cleanFrontmatter = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== void 0) {
      cleanFrontmatter[key] = value;
    }
  }
  const yamlLines = ["---"];
  const orderedKeys = ["title", "type", "status", "tags", "category", "description", "created", "updated", "aliases", "related"];
  for (const key of orderedKeys) {
    if (cleanFrontmatter[key] !== void 0) {
      yamlLines.push(formatYamlLine(key, cleanFrontmatter[key]));
    }
  }
  yamlLines.push("---");
  yamlLines.push("");
  return yamlLines.join("\n") + content.trim() + "\n";
}
function formatYamlLine(key, value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    return `${key}:
${value.map((v) => `  - ${v}`).join("\n")}`;
  }
  if (typeof value === "string" && (value.includes(":") || value.includes("#"))) {
    return `${key}: "${value}"`;
  }
  return `${key}: ${value}`;
}
export {
  addFrontmatter,
  convertDocs,
  validateFrontmatter
};
//# sourceMappingURL=docs-convert.js.map
