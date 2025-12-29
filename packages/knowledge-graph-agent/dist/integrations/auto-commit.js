import { createGitClient } from "./git.js";
import { createLogger } from "../utils/logger.js";
const FILE_TYPE_MAPPINGS = {
  // Documentation
  ".md": "docs",
  ".mdx": "docs",
  ".txt": "docs",
  ".rst": "docs",
  // Configuration
  ".json": "config",
  ".yaml": "config",
  ".yml": "config",
  ".toml": "config",
  ".ini": "config",
  ".env": "config",
  ".config": "config",
  // Tests
  ".test.ts": "test",
  ".test.js": "test",
  ".spec.ts": "test",
  ".spec.js": "test",
  // Build
  ".dockerfile": "build",
  ".dockerignore": "build",
  // Style
  ".css": "style",
  ".scss": "style",
  ".sass": "style",
  ".less": "style"
  /* STYLE */
};
const DIRECTORY_SCOPE_MAPPINGS = {
  "src/cli": "cli",
  "src/core": "core",
  "src/utils": "utils",
  "src/integrations": "integrations",
  "src/templates": "templates",
  "tests": "test",
  "docs": "docs",
  "scripts": "scripts"
};
class AutoCommit {
  git;
  logger;
  config;
  constructor(config = {}) {
    this.config = {
      gitClient: config.gitClient || createGitClient({ workingDirectory: config.workingDirectory }),
      logger: config.logger || createLogger("auto-commit"),
      workingDirectory: config.workingDirectory || process.cwd(),
      messagePrefix: config.messagePrefix || "",
      includeFileList: config.includeFileList ?? true,
      maxFilesInMessage: config.maxFilesInMessage ?? 5,
      messageTemplate: config.messageTemplate || "{type}{scope}: {description}",
      stageAll: config.stageAll ?? false,
      excludePatterns: config.excludePatterns || [".env", ".env.local", "*.log", "node_modules"]
    };
    this.git = this.config.gitClient;
    this.logger = this.config.logger;
  }
  /**
   * Analyze changes and determine the appropriate change type
   */
  async analyzeChanges(status) {
    const currentStatus = status || await this.git.getStatus();
    const files = currentStatus.files.map((f) => f.path);
    if (files.length === 0) {
      return {
        type: "chore",
        description: "no changes detected",
        breaking: false,
        files: []
      };
    }
    const typeScores = {};
    const scopes = [];
    for (const file of files) {
      const fileType = this.getFileChangeType(file);
      typeScores[fileType] = (typeScores[fileType] || 0) + 1;
      const scope2 = this.getFileScope(file);
      if (scope2 && !scopes.includes(scope2)) {
        scopes.push(scope2);
      }
    }
    let primaryType = "update";
    let maxScore = 0;
    for (const [type, score] of Object.entries(typeScores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryType = type;
      }
    }
    const addedFiles = currentStatus.files.filter((f) => f.indexStatus === "A" || f.workingTreeStatus === "?");
    const deletedFiles = currentStatus.files.filter((f) => f.indexStatus === "D" || f.workingTreeStatus === "D");
    if (addedFiles.length > deletedFiles.length && addedFiles.length > currentStatus.modified) {
      primaryType = "add";
    } else if (deletedFiles.length > addedFiles.length && deletedFiles.length > currentStatus.modified) {
      primaryType = "delete";
    }
    const description = this.generateDescription(files, primaryType, currentStatus);
    const scope = scopes.length === 1 ? scopes[0] : scopes.length > 1 ? scopes.slice(0, 2).join(",") : void 0;
    return {
      type: primaryType,
      scope,
      description,
      breaking: false,
      files,
      context: {
        staged: currentStatus.staged,
        modified: currentStatus.modified,
        untracked: currentStatus.untracked,
        deleted: currentStatus.deleted
      }
    };
  }
  /**
   * Generate a commit message based on analysis
   */
  generateCommitMessage(analysis) {
    const { type, scope, description, breaking, files } = analysis;
    let message = this.config.messageTemplate.replace("{type}", type).replace("{scope}", scope ? `(${scope})` : "").replace("{description}", description);
    if (this.config.messagePrefix) {
      message = `${this.config.messagePrefix} ${message}`;
    }
    if (breaking) {
      message = message.replace(":", "!:");
    }
    if (this.config.includeFileList && files.length > 0) {
      const fileList = files.slice(0, this.config.maxFilesInMessage);
      const remaining = files.length - fileList.length;
      message += "\n\nFiles:\n";
      message += fileList.map((f) => `- ${f}`).join("\n");
      if (remaining > 0) {
        message += `
- ... and ${remaining} more files`;
      }
    }
    return message;
  }
  /**
   * Determine if changes should be committed
   */
  async shouldCommit(options = {}) {
    const minFiles = options.minFiles ?? 1;
    const minChanges = options.minChanges ?? 1;
    const excludeTypes = options.excludeTypes ?? [];
    try {
      const status = await this.git.getStatus();
      if (status.isClean) {
        return {
          shouldCommit: false,
          reason: "No changes to commit"
        };
      }
      if (status.files.length < minFiles) {
        return {
          shouldCommit: false,
          reason: `Not enough files changed (${status.files.length} < ${minFiles})`
        };
      }
      const analysis = await this.analyzeChanges(status);
      if (excludeTypes.includes(analysis.type)) {
        return {
          shouldCommit: false,
          reason: `Change type "${analysis.type}" is excluded`,
          analysis
        };
      }
      const filteredFiles = this.filterExcludedFiles(status.files.map((f) => f.path));
      if (filteredFiles.length === 0) {
        return {
          shouldCommit: false,
          reason: "All changes match exclude patterns",
          analysis
        };
      }
      const diff = await this.git.getDiff();
      const totalChanges = diff.insertions + diff.deletions;
      if (totalChanges < minChanges) {
        return {
          shouldCommit: false,
          reason: `Not enough changes (${totalChanges} < ${minChanges})`,
          analysis
        };
      }
      const suggestedMessage = this.generateCommitMessage(analysis);
      return {
        shouldCommit: true,
        reason: `${status.files.length} files changed with ${totalChanges} line changes`,
        suggestedMessage,
        analysis
      };
    } catch (error) {
      return {
        shouldCommit: false,
        reason: `Error analyzing changes: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  /**
   * Perform an auto-commit
   */
  async commit(options = {}) {
    try {
      const stageAll = options.stageAll ?? this.config.stageAll;
      if (stageAll) {
        await this.git.add(".");
      } else if (options.files && options.files.length > 0) {
        await this.git.add(options.files);
      }
      const status = await this.git.getStatus();
      const analysis = await this.analyzeChanges(status);
      const message = options.message || this.generateCommitMessage(analysis);
      if (options.dryRun) {
        this.logger.info("Dry run - would commit with message:", { message });
        return {
          success: true,
          message,
          analysis
        };
      }
      const result = await this.git.commit({ message });
      if (result.success) {
        this.logger.info("Auto-commit successful", {
          hash: result.hash,
          message
        });
        return {
          success: true,
          hash: result.hash,
          message,
          analysis
        };
      }
      return {
        success: false,
        error: result.error,
        message,
        analysis
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error("Auto-commit failed", new Error(errorMessage));
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  /**
   * Smart commit with knowledge graph awareness
   */
  async smartCommit(options = {}) {
    const decision = await this.shouldCommit();
    if (!decision.shouldCommit) {
      return {
        success: false,
        error: decision.reason
      };
    }
    let message = decision.suggestedMessage || "";
    if (options.knowledgeGraphChanges) {
      const { nodesAdded, nodesUpdated, nodesDeleted, linksChanged } = options.knowledgeGraphChanges;
      const kgChanges = [];
      if (nodesAdded) kgChanges.push(`${nodesAdded} nodes added`);
      if (nodesUpdated) kgChanges.push(`${nodesUpdated} nodes updated`);
      if (nodesDeleted) kgChanges.push(`${nodesDeleted} nodes deleted`);
      if (linksChanged) kgChanges.push(`${linksChanged} links changed`);
      if (kgChanges.length > 0) {
        message += `

Knowledge Graph:
- ${kgChanges.join("\n- ")}`;
      }
    }
    if (options.additionalContext) {
      message += `

Context:
${JSON.stringify(options.additionalContext, null, 2)}`;
    }
    return this.commit({
      message,
      stageAll: true,
      dryRun: options.dryRun
    });
  }
  /**
   * Get file change type based on path and extension
   */
  getFileChangeType(filePath) {
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.includes(".test.") || lowerPath.includes(".spec.") || lowerPath.includes("/tests/")) {
      return "test";
    }
    if (lowerPath.includes("dockerfile") || lowerPath.includes("makefile") || lowerPath.includes(".github/workflows")) {
      return "build";
    }
    for (const [ext, type] of Object.entries(FILE_TYPE_MAPPINGS)) {
      if (lowerPath.endsWith(ext)) {
        return type;
      }
    }
    if (lowerPath.includes("config") || lowerPath.includes("settings")) {
      return "config";
    }
    return "update";
  }
  /**
   * Get scope from file path
   */
  getFileScope(filePath) {
    for (const [dir, scope] of Object.entries(DIRECTORY_SCOPE_MAPPINGS)) {
      if (filePath.startsWith(dir) || filePath.includes(`/${dir}/`)) {
        return scope;
      }
    }
    const parts = filePath.split("/");
    if (parts.length > 2 && parts[0] === "src") {
      return parts[1];
    }
    return void 0;
  }
  /**
   * Generate description based on files and type
   */
  generateDescription(files, type, status) {
    if (files.length === 1) {
      const fileName = files[0].split("/").pop() || files[0];
      return `${this.getTypeVerb(type)} ${fileName}`;
    }
    const extensions = new Set(files.map((f) => {
      const ext = f.split(".").pop();
      return ext ? `.${ext}` : "";
    }));
    if (extensions.size === 1 && extensions.has(".md")) {
      return `${this.getTypeVerb(type)} documentation`;
    }
    if (extensions.size === 1 && (extensions.has(".ts") || extensions.has(".js"))) {
      return `${this.getTypeVerb(type)} source files`;
    }
    return `${this.getTypeVerb(type)} ${files.length} files`;
  }
  /**
   * Get verb for change type
   */
  getTypeVerb(type) {
    switch (type) {
      case "add":
        return "add";
      case "delete":
        return "remove";
      case "update":
        return "update";
      case "refactor":
        return "refactor";
      case "fix":
        return "fix";
      case "docs":
        return "document";
      case "config":
        return "configure";
      case "style":
        return "style";
      case "test":
        return "test";
      case "build":
        return "build";
      case "chore":
        return "chore";
      default:
        return "update";
    }
  }
  /**
   * Filter out excluded files
   */
  filterExcludedFiles(files) {
    return files.filter((file) => {
      for (const pattern of this.config.excludePatterns) {
        if (pattern.includes("*")) {
          const regex = new RegExp(pattern.replace(/\*/g, ".*"));
          if (regex.test(file)) return false;
        } else if (file.includes(pattern)) {
          return false;
        }
      }
      return true;
    });
  }
}
function createAutoCommit(config = {}) {
  return new AutoCommit(config);
}
export {
  AutoCommit,
  createAutoCommit
};
//# sourceMappingURL=auto-commit.js.map
