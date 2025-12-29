class BackupManager {
  config;
  constructor(config) {
    this.config = {
      maxBackups: 10,
      compress: true,
      includeDatabase: true,
      includeCache: true,
      includeConfig: true,
      ...config
    };
  }
  async createBackup(description) {
    const { mkdirSync, existsSync, writeFileSync, statSync } = await import("fs");
    const { join } = await import("path");
    const crypto = await import("crypto");
    if (!existsSync(this.config.backupDir)) {
      mkdirSync(this.config.backupDir, { recursive: true });
    }
    const id = `backup-${Date.now()}`;
    const backupPath = join(this.config.backupDir, id);
    mkdirSync(backupPath, { recursive: true });
    const components = [];
    const manifest = {
      id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      description,
      version: "1.0.0",
      components
    };
    writeFileSync(join(backupPath, "manifest.json"), JSON.stringify(manifest, null, 2));
    const stats = statSync(backupPath);
    const hash = crypto.createHash("sha256");
    hash.update(JSON.stringify(manifest));
    const checksum = hash.digest("hex");
    const backupInfo = {
      id,
      path: backupPath,
      createdAt: /* @__PURE__ */ new Date(),
      size: stats.size,
      components,
      version: "1.0.0",
      checksum
    };
    await this.cleanupOldBackups();
    return backupInfo;
  }
  async listBackups() {
    const { readdirSync, existsSync, readFileSync, statSync } = await import("fs");
    const { join } = await import("path");
    if (!existsSync(this.config.backupDir)) return [];
    const backups = [];
    const entries = readdirSync(this.config.backupDir);
    for (const entry of entries) {
      const backupPath = join(this.config.backupDir, entry);
      const manifestPath = join(backupPath, "manifest.json");
      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
          const stats = statSync(backupPath);
          backups.push({
            id: manifest.id,
            path: backupPath,
            createdAt: new Date(manifest.createdAt),
            size: stats.size,
            components: manifest.components || [],
            version: manifest.version || "1.0.0",
            checksum: manifest.checksum
          });
        } catch {
        }
      }
    }
    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async restore(backupId, options = {}) {
    const startTime = Date.now();
    const { existsSync, readFileSync } = await import("fs");
    const { join } = await import("path");
    const backupPath = join(this.config.backupDir, backupId);
    const manifestPath = join(backupPath, "manifest.json");
    if (!existsSync(manifestPath)) {
      return {
        success: false,
        restoredComponents: [],
        error: `Backup not found: ${backupId}`,
        warnings: [],
        duration: Date.now() - startTime
      };
    }
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      const restoredComponents = [];
      const warnings = [];
      if (options.dryRun) {
        return {
          success: true,
          restoredComponents: manifest.components || [],
          warnings: ["Dry run - no changes made"],
          duration: Date.now() - startTime
        };
      }
      restoredComponents.push(...manifest.components || []);
      return {
        success: true,
        restoredComponents,
        warnings,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        restoredComponents: [],
        error: error instanceof Error ? error.message : String(error),
        warnings: [],
        duration: Date.now() - startTime
      };
    }
  }
  async deleteBackup(backupId) {
    const { existsSync, rmSync } = await import("fs");
    const { join } = await import("path");
    const backupPath = join(this.config.backupDir, backupId);
    if (!existsSync(backupPath)) return false;
    rmSync(backupPath, { recursive: true, force: true });
    return true;
  }
  async cleanupOldBackups() {
    const backups = await this.listBackups();
    const maxBackups = this.config.maxBackups || 10;
    if (backups.length > maxBackups) {
      const toDelete = backups.slice(maxBackups);
      for (const backup of toDelete) {
        await this.deleteBackup(backup.id);
      }
    }
  }
}
function createBackupManager(config) {
  return new BackupManager(config);
}
class IntegrityChecker {
  dbPath;
  constructor(dbPath) {
    this.dbPath = dbPath;
  }
  async check() {
    const startTime = Date.now();
    const issues = [];
    const components = [];
    const { existsSync } = await import("fs");
    if (!existsSync(this.dbPath)) {
      return {
        valid: false,
        components: [],
        issues: ["Database file not found"],
        duration: Date.now() - startTime
      };
    }
    return {
      valid: issues.length === 0,
      components,
      issues,
      duration: Date.now() - startTime
    };
  }
  async repair() {
    const actions = [];
    return { repaired: true, actions };
  }
}
function createIntegrityChecker(dbPath) {
  return new IntegrityChecker(dbPath);
}
async function checkDatabaseIntegrity(dbPath) {
  const checker = new IntegrityChecker(dbPath);
  return checker.check();
}
export {
  BackupManager,
  IntegrityChecker,
  checkDatabaseIntegrity,
  createBackupManager,
  createIntegrityChecker
};
//# sourceMappingURL=index.js.map
