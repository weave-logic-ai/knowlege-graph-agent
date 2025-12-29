import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { createLogger } from "../../../utils/logger.js";
import { createNpmClient } from "./npm-client.js";
import { createVulnerabilityChecker, getMaxSeverity } from "./vulnerability.js";
const execAsync = promisify(exec);
const logger = createLogger("dependency-health-analyzer");
function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}
function calculateUpdateUrgency(current, latest) {
  const currentV = parseVersion(current);
  const latestV = parseVersion(latest);
  if (!currentV || !latestV) return "none";
  if (currentV.major < latestV.major) return "major";
  if (currentV.minor < latestV.minor) return "minor";
  if (currentV.patch < latestV.patch) return "patch";
  return "none";
}
class DependencyHealthAnalyzer {
  projectRoot;
  config;
  npmClient;
  vulnChecker;
  constructor(projectRoot, config = {}) {
    this.projectRoot = projectRoot;
    this.config = {
      minHealthScore: config.minHealthScore ?? 50,
      includeDev: config.includeDev ?? true,
      includePeer: config.includePeer ?? false,
      includeOptional: config.includeOptional ?? false,
      skipPackages: config.skipPackages ?? [],
      vulnerabilitySeverityThreshold: config.vulnerabilitySeverityThreshold ?? "low",
      fetchRegistryMetadata: config.fetchRegistryMetadata ?? true,
      registryUrl: config.registryUrl ?? "https://registry.npmjs.org",
      timeout: config.timeout ?? 3e4,
      cacheTtl: config.cacheTtl ?? 36e5,
      storeInDatabase: config.storeInDatabase ?? true
    };
    this.npmClient = createNpmClient(this.config);
    this.vulnChecker = createVulnerabilityChecker(projectRoot, this.config);
  }
  /**
   * Run full dependency health analysis
   */
  async analyze() {
    const startTime = Date.now();
    const result = {
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      projectRoot: this.projectRoot,
      packageManager: "npm",
      totalDependencies: 0,
      summary: {
        vulnerabilities: {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
          info: 0,
          total: 0
        },
        outdated: {
          major: 0,
          minor: 0,
          patch: 0,
          total: 0
        },
        healthScores: {
          healthy: 0,
          warning: 0,
          critical: 0,
          unknown: 0
        },
        averageHealthScore: 0
      },
      dependencies: [],
      nodes: [],
      edges: [],
      warnings: [],
      errors: [],
      duration: 0
    };
    try {
      logger.info("Starting dependency health analysis", { projectRoot: this.projectRoot });
      const dependencies = await this.readDependencies();
      if (!dependencies) {
        result.errors.push("Failed to read package.json");
        result.duration = Date.now() - startTime;
        return result;
      }
      result.totalDependencies = dependencies.length;
      logger.info("Found dependencies", { count: dependencies.length });
      const vulnResult = await this.vulnChecker.checkVulnerabilities();
      if (vulnResult.success) {
        result.summary.vulnerabilities = vulnResult.summary;
      } else if (vulnResult.error) {
        result.warnings.push(`Vulnerability check: ${vulnResult.error}`);
      }
      const outdatedResult = await this.checkOutdated();
      result.summary.outdated = {
        major: outdatedResult.filter((p) => p.urgency === "major").length,
        minor: outdatedResult.filter((p) => p.urgency === "minor").length,
        patch: outdatedResult.filter((p) => p.urgency === "patch").length,
        total: outdatedResult.length
      };
      const outdatedMap = new Map(outdatedResult.map((p) => [p.name, p]));
      for (const dep of dependencies) {
        if (this.config.skipPackages.includes(dep.name)) {
          continue;
        }
        const healthScore = await this.calculateHealthScore(
          dep,
          vulnResult.vulnerabilities.get(dep.name) ?? [],
          outdatedMap.get(dep.name)
        );
        result.dependencies.push(healthScore);
        switch (healthScore.status) {
          case "healthy":
            result.summary.healthScores.healthy++;
            break;
          case "warning":
            result.summary.healthScores.warning++;
            break;
          case "critical":
            result.summary.healthScores.critical++;
            break;
          default:
            result.summary.healthScores.unknown++;
        }
      }
      if (result.dependencies.length > 0) {
        const totalScore = result.dependencies.reduce((sum, d) => sum + d.overallScore, 0);
        result.summary.averageHealthScore = Math.round(totalScore / result.dependencies.length);
      }
      logger.info("Dependency health analysis complete", {
        dependencies: result.totalDependencies,
        averageScore: result.summary.averageHealthScore,
        vulnerable: result.summary.vulnerabilities.total,
        outdated: result.summary.outdated.total
      });
    } catch (error) {
      logger.error("Analysis failed", error instanceof Error ? error : void 0);
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
    result.duration = Date.now() - startTime;
    return result;
  }
  /**
   * Read dependencies from package.json
   */
  async readDependencies() {
    const packageJsonPath = join(this.projectRoot, "package.json");
    if (!existsSync(packageJsonPath)) {
      logger.error("package.json not found", void 0, { path: packageJsonPath });
      return null;
    }
    try {
      const content = await readFile(packageJsonPath, "utf-8");
      const pkg = JSON.parse(content);
      const dependencies = [];
      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          dependencies.push(this.createDependencyInfo(name, version, false));
        }
      }
      if (this.config.includeDev && pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          dependencies.push(this.createDependencyInfo(name, version, true));
        }
      }
      if (this.config.includePeer && pkg.peerDependencies) {
        for (const [name, version] of Object.entries(pkg.peerDependencies)) {
          dependencies.push(this.createDependencyInfo(name, version, false));
        }
      }
      if (this.config.includeOptional && pkg.optionalDependencies) {
        for (const [name, version] of Object.entries(pkg.optionalDependencies)) {
          dependencies.push(this.createDependencyInfo(name, version, false));
        }
      }
      return dependencies;
    } catch (error) {
      logger.error("Failed to read package.json", error instanceof Error ? error : void 0);
      return null;
    }
  }
  /**
   * Create a DependencyInfo object
   */
  createDependencyInfo(name, version, isDev) {
    return {
      name,
      version: version.replace(/^[\^~>=<]/, ""),
      type: "library",
      category: "dependencies",
      ecosystem: "nodejs",
      usedBy: [],
      relatedTo: [],
      isDev
    };
  }
  /**
   * Check for outdated packages using npm outdated
   */
  async checkOutdated() {
    const outdated = [];
    try {
      logger.debug("Running npm outdated");
      const { stdout } = await execAsync(
        "npm outdated --json 2>/dev/null || true",
        {
          cwd: this.projectRoot,
          timeout: this.config.timeout,
          maxBuffer: 10 * 1024 * 1024
        }
      );
      if (!stdout.trim()) {
        return outdated;
      }
      const data = JSON.parse(stdout);
      for (const [name, info] of Object.entries(data)) {
        const pkgInfo = info;
        if (pkgInfo.current && pkgInfo.latest) {
          const urgency = calculateUpdateUrgency(pkgInfo.current, pkgInfo.latest);
          if (urgency !== "none") {
            outdated.push({
              name,
              current: pkgInfo.current,
              wanted: pkgInfo.wanted ?? pkgInfo.current,
              latest: pkgInfo.latest,
              isDev: pkgInfo.type === "devDependencies",
              dependentType: pkgInfo.type ?? "dependencies",
              urgency
            });
          }
        }
      }
      logger.debug("Outdated check complete", { count: outdated.length });
    } catch (error) {
      logger.warn("npm outdated failed", { error: String(error) });
    }
    return outdated;
  }
  /**
   * Calculate health score for a dependency
   */
  async calculateHealthScore(dependency, vulnerabilities, outdated) {
    const issues = [];
    const recommendations = [];
    let securityScore = 100;
    if (vulnerabilities.length > 0) {
      securityScore = this.vulnChecker.calculateSecurityScore(vulnerabilities);
      const maxSeverity = getMaxSeverity(vulnerabilities.map((v) => v.severity));
      issues.push({
        type: "vulnerability",
        severity: maxSeverity === "critical" || maxSeverity === "high" ? "critical" : maxSeverity === "moderate" ? "medium" : "low",
        message: `${vulnerabilities.length} security ${vulnerabilities.length === 1 ? "vulnerability" : "vulnerabilities"} found`,
        data: { count: vulnerabilities.length, maxSeverity }
      });
      recommendations.push("Run npm audit fix to resolve security issues");
    }
    let freshnessScore = 100;
    if (outdated) {
      switch (outdated.urgency) {
        case "major":
          freshnessScore = 30;
          issues.push({
            type: "outdated",
            severity: "high",
            message: `Major version update available: ${outdated.current} -> ${outdated.latest}`
          });
          recommendations.push(`Update to ${outdated.latest} (breaking changes possible)`);
          break;
        case "minor":
          freshnessScore = 60;
          issues.push({
            type: "outdated",
            severity: "medium",
            message: `Minor version update available: ${outdated.current} -> ${outdated.latest}`
          });
          recommendations.push(`Update to ${outdated.latest}`);
          break;
        case "patch":
          freshnessScore = 85;
          issues.push({
            type: "outdated",
            severity: "low",
            message: `Patch update available: ${outdated.current} -> ${outdated.latest}`
          });
          break;
      }
    }
    let maintenanceScore = 50;
    let popularityScore = 50;
    if (this.config.fetchRegistryMetadata) {
      const quality = await this.npmClient.getQualityMetrics(dependency.name);
      if (quality) {
        maintenanceScore = Math.round(quality.maintenance * 100);
        popularityScore = Math.round(quality.popularity * 100);
      }
      const metadata = await this.npmClient.getPackageMetadata(dependency.name);
      if (metadata?.deprecated) {
        maintenanceScore = Math.max(0, maintenanceScore - 40);
        issues.push({
          type: "deprecated",
          severity: "high",
          message: `Package is deprecated: ${metadata.deprecated}`
        });
        recommendations.push("Find an alternative package");
      }
    }
    const overallScore = Math.round(
      securityScore * 0.4 + freshnessScore * 0.25 + maintenanceScore * 0.2 + popularityScore * 0.15
    );
    let status = "healthy";
    if (overallScore < 30) {
      status = "critical";
    } else if (overallScore < 60) {
      status = "warning";
    } else if (overallScore >= 60) {
      status = "healthy";
    }
    return {
      name: dependency.name,
      version: dependency.version,
      overallScore,
      status,
      components: {
        security: securityScore,
        freshness: freshnessScore,
        maintenance: maintenanceScore,
        popularity: popularityScore
      },
      issues,
      recommendations
    };
  }
  /**
   * Get health score for a specific package
   */
  async getPackageHealth(packageName) {
    const dependencies = await this.readDependencies();
    if (!dependencies) return null;
    const dep = dependencies.find((d) => d.name === packageName);
    if (!dep) return null;
    const vulnResult = await this.vulnChecker.checkVulnerabilities();
    const outdated = await this.checkOutdated();
    const outdatedPkg = outdated.find((p) => p.name === packageName);
    return this.calculateHealthScore(
      dep,
      vulnResult.vulnerabilities.get(packageName) ?? [],
      outdatedPkg
    );
  }
  /**
   * Get packages below minimum health score threshold
   */
  async getUnhealthyPackages() {
    const analysis = await this.analyze();
    return analysis.dependencies.filter(
      (d) => d.overallScore < this.config.minHealthScore
    );
  }
  /**
   * Clear internal caches
   */
  clearCache() {
    this.npmClient.clearCache();
  }
}
function createDependencyHealthAnalyzer(projectRoot, config) {
  return new DependencyHealthAnalyzer(projectRoot, config);
}
export {
  DependencyHealthAnalyzer,
  createDependencyHealthAnalyzer
};
//# sourceMappingURL=analyzer.js.map
