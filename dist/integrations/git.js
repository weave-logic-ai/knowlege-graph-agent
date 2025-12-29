import simpleGit from "simple-git";
import { KnowledgeGraphError, ErrorSeverity, ErrorCategory } from "../utils/error-taxonomy.js";
import { createLogger } from "../utils/logger.js";
class GitError extends KnowledgeGraphError {
  gitCommand;
  gitOutput;
  constructor(message, gitCommand, gitOutput) {
    super(message, {
      category: ErrorCategory.RESOURCE,
      severity: ErrorSeverity.ERROR,
      retryable: false,
      code: "GIT_ERROR",
      context: { gitCommand, gitOutput }
    });
    this.name = "GitError";
    this.gitCommand = gitCommand;
    this.gitOutput = gitOutput;
  }
}
class GitClient {
  git;
  logger;
  workingDirectory;
  constructor(config = {}) {
    this.workingDirectory = config.workingDirectory || process.cwd();
    this.logger = config.logger || createLogger("git");
    this.git = simpleGit({
      baseDir: this.workingDirectory,
      binary: "git",
      maxConcurrentProcesses: 6,
      timeout: {
        block: config.timeout || 3e4
      }
    });
  }
  /**
   * Check if the current directory is a git repository
   */
  async isRepo() {
    try {
      await this.git.revparse(["--git-dir"]);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get the current git status
   */
  async getStatus() {
    try {
      const status = await this.git.status();
      const files = status.files.map((f) => ({
        path: f.path,
        indexStatus: f.index || " ",
        workingTreeStatus: f.working_dir || " ",
        isStaged: f.index !== " " && f.index !== "?"
      }));
      return {
        branch: status.current || "HEAD",
        isClean: status.isClean(),
        staged: status.staged.length,
        modified: status.modified.length,
        untracked: status.not_added.length,
        deleted: status.deleted.length,
        renamed: status.renamed.length,
        conflicted: status.conflicted.length,
        tracking: status.tracking ? {
          ahead: status.ahead,
          behind: status.behind,
          remote: status.tracking
        } : void 0,
        files
      };
    } catch (error) {
      throw new GitError(
        `Failed to get git status: ${error instanceof Error ? error.message : String(error)}`,
        "git status",
        String(error)
      );
    }
  }
  /**
   * Get the diff of changes
   */
  async getDiff(options = {}) {
    try {
      const args = ["--stat"];
      if (options.staged || options.cached) {
        args.push("--cached");
      }
      if (options.file) {
        args.push("--", options.file);
      }
      const diffResult = await this.git.diffSummary(args);
      return {
        changed: diffResult.changed,
        insertions: diffResult.insertions,
        deletions: diffResult.deletions,
        files: diffResult.files.map((f) => ({
          file: f.file,
          insertions: "insertions" in f ? f.insertions : 0,
          deletions: "deletions" in f ? f.deletions : 0,
          binary: f.binary
        }))
      };
    } catch (error) {
      throw new GitError(
        `Failed to get diff: ${error instanceof Error ? error.message : String(error)}`,
        "git diff",
        String(error)
      );
    }
  }
  /**
   * Get the full diff content
   */
  async getDiffContent(options = {}) {
    try {
      const args = [];
      if (options.staged) {
        args.push("--cached");
      }
      if (options.file) {
        args.push("--", options.file);
      }
      return await this.git.diff(args);
    } catch (error) {
      throw new GitError(
        `Failed to get diff content: ${error instanceof Error ? error.message : String(error)}`,
        "git diff",
        String(error)
      );
    }
  }
  /**
   * Stage files for commit
   */
  async add(files = ".") {
    try {
      const fileList = Array.isArray(files) ? files : [files];
      await this.git.add(fileList);
      this.logger.debug("Staged files", { files: fileList });
    } catch (error) {
      throw new GitError(
        `Failed to stage files: ${error instanceof Error ? error.message : String(error)}`,
        "git add",
        String(error)
      );
    }
  }
  /**
   * Unstage files
   */
  async reset(files) {
    try {
      const fileList = Array.isArray(files) ? files : [files];
      await this.git.reset(["HEAD", "--", ...fileList]);
      this.logger.debug("Unstaged files", { files: fileList });
    } catch (error) {
      throw new GitError(
        `Failed to unstage files: ${error instanceof Error ? error.message : String(error)}`,
        "git reset",
        String(error)
      );
    }
  }
  /**
   * Create a commit
   */
  async commit(options) {
    try {
      const commitArgs = [];
      if (options.amend) {
        commitArgs.push("--amend");
      }
      if (options.allowEmpty) {
        commitArgs.push("--allow-empty");
      }
      if (options.author) {
        commitArgs.push(`--author="${options.author.name} <${options.author.email}>"`);
      }
      if (options.files && options.files.length > 0) {
        await this.add(options.files);
      }
      const result = await this.git.commit(options.message, void 0, {
        "--message": options.message
      });
      this.logger.info("Created commit", {
        hash: result.commit,
        branch: result.branch
      });
      return {
        success: true,
        hash: result.commit,
        branch: result.branch,
        summary: {
          changes: result.summary.changes,
          insertions: result.summary.insertions,
          deletions: result.summary.deletions
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to create commit", new Error(errorMessage));
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  /**
   * Get commit log
   */
  async getLog(options = {}) {
    try {
      const logArgs = [];
      if (options.maxCount) {
        logArgs.push(`-n${options.maxCount}`);
      }
      if (options.since) {
        logArgs.push(`--since=${options.since.toISOString()}`);
      }
      if (options.until) {
        logArgs.push(`--until=${options.until.toISOString()}`);
      }
      if (options.author) {
        logArgs.push(`--author=${options.author}`);
      }
      if (options.file) {
        logArgs.push("--", options.file);
      }
      const log = await this.git.log(logArgs);
      return log.all.map((entry) => ({
        hash: entry.hash,
        hashAbbrev: entry.hash.substring(0, 7),
        author: entry.author_name,
        email: entry.author_email,
        date: new Date(entry.date),
        message: entry.message,
        body: entry.body || void 0,
        parents: entry.refs ? entry.refs.split(",").map((r) => r.trim()) : []
      }));
    } catch (error) {
      throw new GitError(
        `Failed to get log: ${error instanceof Error ? error.message : String(error)}`,
        "git log",
        String(error)
      );
    }
  }
  /**
   * Get current branch information
   */
  async getBranch() {
    try {
      const branchSummary = await this.git.branch(["-a"]);
      const local = [];
      const remote = [];
      for (const [name, branch] of Object.entries(branchSummary.branches)) {
        if (name.startsWith("remotes/")) {
          remote.push(name.replace("remotes/", ""));
        } else {
          local.push(name);
        }
      }
      return {
        current: branchSummary.current,
        detached: branchSummary.detached,
        local,
        remote
      };
    } catch (error) {
      throw new GitError(
        `Failed to get branch info: ${error instanceof Error ? error.message : String(error)}`,
        "git branch",
        String(error)
      );
    }
  }
  /**
   * Get remote information
   */
  async getRemotes() {
    try {
      const remotes = await this.git.getRemotes(true);
      return remotes.map((remote) => ({
        name: remote.name,
        fetchUrl: remote.refs.fetch || "",
        pushUrl: remote.refs.push || ""
      }));
    } catch (error) {
      throw new GitError(
        `Failed to get remotes: ${error instanceof Error ? error.message : String(error)}`,
        "git remote",
        String(error)
      );
    }
  }
  /**
   * Push to remote
   */
  async push(options = {}) {
    try {
      const remote = options.remote || "origin";
      const args = [];
      if (options.setUpstream) {
        args.push("-u");
      }
      if (options.force) {
        args.push("--force");
      }
      args.push(remote);
      if (options.branch) {
        args.push(options.branch);
      }
      await this.git.push(args);
      this.logger.info("Pushed to remote", { remote, branch: options.branch });
    } catch (error) {
      throw new GitError(
        `Failed to push: ${error instanceof Error ? error.message : String(error)}`,
        "git push",
        String(error)
      );
    }
  }
  /**
   * Pull from remote
   */
  async pull(options = {}) {
    try {
      const remote = options.remote || "origin";
      const pullArgs = [];
      if (options.rebase) {
        pullArgs.push("--rebase");
      }
      pullArgs.push(remote);
      if (options.branch) {
        pullArgs.push(options.branch);
      }
      await this.git.pull(pullArgs);
      this.logger.info("Pulled from remote", { remote, branch: options.branch });
    } catch (error) {
      throw new GitError(
        `Failed to pull: ${error instanceof Error ? error.message : String(error)}`,
        "git pull",
        String(error)
      );
    }
  }
  /**
   * Fetch from remote
   */
  async fetch(options = {}) {
    try {
      const args = [];
      if (options.all) {
        args.push("--all");
      }
      if (options.prune) {
        args.push("--prune");
      }
      if (options.remote) {
        args.push(options.remote);
      }
      await this.git.fetch(args);
      this.logger.debug("Fetched from remote", options);
    } catch (error) {
      throw new GitError(
        `Failed to fetch: ${error instanceof Error ? error.message : String(error)}`,
        "git fetch",
        String(error)
      );
    }
  }
  /**
   * Stash changes
   */
  async stash(options = {}) {
    try {
      const args = ["push"];
      if (options.message) {
        args.push("-m", options.message);
      }
      if (options.includeUntracked) {
        args.push("--include-untracked");
      }
      await this.git.stash(args);
      this.logger.debug("Stashed changes", options);
    } catch (error) {
      throw new GitError(
        `Failed to stash: ${error instanceof Error ? error.message : String(error)}`,
        "git stash",
        String(error)
      );
    }
  }
  /**
   * Pop stash
   */
  async stashPop() {
    try {
      await this.git.stash(["pop"]);
      this.logger.debug("Popped stash");
    } catch (error) {
      throw new GitError(
        `Failed to pop stash: ${error instanceof Error ? error.message : String(error)}`,
        "git stash pop",
        String(error)
      );
    }
  }
  /**
   * Get the root directory of the git repository
   */
  async getRoot() {
    try {
      const root = await this.git.revparse(["--show-toplevel"]);
      return root.trim();
    } catch (error) {
      throw new GitError(
        `Failed to get repository root: ${error instanceof Error ? error.message : String(error)}`,
        "git rev-parse",
        String(error)
      );
    }
  }
  /**
   * Get the current HEAD commit hash
   */
  async getHead() {
    try {
      const head = await this.git.revparse(["HEAD"]);
      return head.trim();
    } catch (error) {
      throw new GitError(
        `Failed to get HEAD: ${error instanceof Error ? error.message : String(error)}`,
        "git rev-parse",
        String(error)
      );
    }
  }
  /**
   * Check if there are uncommitted changes
   */
  async hasUncommittedChanges() {
    const status = await this.getStatus();
    return !status.isClean;
  }
  /**
   * Get the underlying simple-git instance for advanced operations
   */
  getRawClient() {
    return this.git;
  }
}
function createGitClient(config = {}) {
  return new GitClient(config);
}
export {
  GitClient,
  GitError,
  createGitClient
};
//# sourceMappingURL=git.js.map
