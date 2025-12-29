/**
 * Dependency Health Analyzer
 *
 * Core analyzer that combines vulnerability checking, outdated package detection,
 * and npm registry metadata to calculate comprehensive health scores.
 *
 * @module plugins/analyzers/dependency-health/analyzer
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../../../utils/logger.js';
import { NpmClient, createNpmClient } from './npm-client.js';
import {
  VulnerabilityChecker,
  createVulnerabilityChecker,
  getMaxSeverity,
} from './vulnerability.js';
import type { DependencyInfo } from '../../../cultivation/types.js';
import type {
  DependencyHealthConfig,
  DependencyHealthScore,
  DependencyHealthAnalysis,
  OutdatedPackage,
  UpdateUrgency,
  HealthStatus,
  HealthIssue,
  VulnerabilityInfo,
  DEFAULT_CONFIG,
} from './types.js';

const execAsync = promisify(exec);
const logger = createLogger('dependency-health-analyzer');

/**
 * Parse semver versions for comparison
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Determine update urgency based on version differences
 */
function calculateUpdateUrgency(current: string, latest: string): UpdateUrgency {
  const currentV = parseVersion(current);
  const latestV = parseVersion(latest);

  if (!currentV || !latestV) return 'none';

  if (currentV.major < latestV.major) return 'major';
  if (currentV.minor < latestV.minor) return 'minor';
  if (currentV.patch < latestV.patch) return 'patch';
  return 'none';
}

/**
 * DependencyHealthAnalyzer class
 */
export class DependencyHealthAnalyzer {
  private projectRoot: string;
  private config: Required<DependencyHealthConfig>;
  private npmClient: NpmClient;
  private vulnChecker: VulnerabilityChecker;

  constructor(projectRoot: string, config: Partial<DependencyHealthConfig> = {}) {
    this.projectRoot = projectRoot;
    this.config = {
      minHealthScore: config.minHealthScore ?? 50,
      includeDev: config.includeDev ?? true,
      includePeer: config.includePeer ?? false,
      includeOptional: config.includeOptional ?? false,
      skipPackages: config.skipPackages ?? [],
      vulnerabilitySeverityThreshold: config.vulnerabilitySeverityThreshold ?? 'low',
      fetchRegistryMetadata: config.fetchRegistryMetadata ?? true,
      registryUrl: config.registryUrl ?? 'https://registry.npmjs.org',
      timeout: config.timeout ?? 30000,
      cacheTtl: config.cacheTtl ?? 3600000,
      storeInDatabase: config.storeInDatabase ?? true,
    };

    this.npmClient = createNpmClient(this.config);
    this.vulnChecker = createVulnerabilityChecker(projectRoot, this.config);
  }

  /**
   * Run full dependency health analysis
   */
  async analyze(): Promise<DependencyHealthAnalysis> {
    const startTime = Date.now();
    const result: DependencyHealthAnalysis = {
      analyzedAt: new Date().toISOString(),
      projectRoot: this.projectRoot,
      packageManager: 'npm',
      totalDependencies: 0,
      summary: {
        vulnerabilities: {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
          info: 0,
          total: 0,
        },
        outdated: {
          major: 0,
          minor: 0,
          patch: 0,
          total: 0,
        },
        healthScores: {
          healthy: 0,
          warning: 0,
          critical: 0,
          unknown: 0,
        },
        averageHealthScore: 0,
      },
      dependencies: [],
      nodes: [],
      edges: [],
      warnings: [],
      errors: [],
      duration: 0,
    };

    try {
      logger.info('Starting dependency health analysis', { projectRoot: this.projectRoot });

      // Step 1: Read package.json to get dependencies
      const dependencies = await this.readDependencies();
      if (!dependencies) {
        result.errors.push('Failed to read package.json');
        result.duration = Date.now() - startTime;
        return result;
      }

      result.totalDependencies = dependencies.length;
      logger.info('Found dependencies', { count: dependencies.length });

      // Step 2: Run vulnerability check
      const vulnResult = await this.vulnChecker.checkVulnerabilities();
      if (vulnResult.success) {
        result.summary.vulnerabilities = vulnResult.summary;
      } else if (vulnResult.error) {
        result.warnings.push(`Vulnerability check: ${vulnResult.error}`);
      }

      // Step 3: Check for outdated packages
      const outdatedResult = await this.checkOutdated();
      result.summary.outdated = {
        major: outdatedResult.filter(p => p.urgency === 'major').length,
        minor: outdatedResult.filter(p => p.urgency === 'minor').length,
        patch: outdatedResult.filter(p => p.urgency === 'patch').length,
        total: outdatedResult.length,
      };

      // Step 4: Calculate health scores for each dependency
      const outdatedMap = new Map(outdatedResult.map(p => [p.name, p]));

      for (const dep of dependencies) {
        // Skip if in skip list
        if (this.config.skipPackages.includes(dep.name)) {
          continue;
        }

        const healthScore = await this.calculateHealthScore(
          dep,
          vulnResult.vulnerabilities.get(dep.name) ?? [],
          outdatedMap.get(dep.name)
        );

        result.dependencies.push(healthScore);

        // Update health score distribution
        switch (healthScore.status) {
          case 'healthy':
            result.summary.healthScores.healthy++;
            break;
          case 'warning':
            result.summary.healthScores.warning++;
            break;
          case 'critical':
            result.summary.healthScores.critical++;
            break;
          default:
            result.summary.healthScores.unknown++;
        }
      }

      // Calculate average health score
      if (result.dependencies.length > 0) {
        const totalScore = result.dependencies.reduce((sum, d) => sum + d.overallScore, 0);
        result.summary.averageHealthScore = Math.round(totalScore / result.dependencies.length);
      }

      logger.info('Dependency health analysis complete', {
        dependencies: result.totalDependencies,
        averageScore: result.summary.averageHealthScore,
        vulnerable: result.summary.vulnerabilities.total,
        outdated: result.summary.outdated.total,
      });

    } catch (error) {
      logger.error('Analysis failed', error instanceof Error ? error : undefined);
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Read dependencies from package.json
   */
  private async readDependencies(): Promise<DependencyInfo[] | null> {
    const packageJsonPath = join(this.projectRoot, 'package.json');

    if (!existsSync(packageJsonPath)) {
      logger.error('package.json not found', undefined, { path: packageJsonPath });
      return null;
    }

    try {
      const content = await readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      const dependencies: DependencyInfo[] = [];

      // Process regular dependencies
      if (pkg.dependencies) {
        for (const [name, version] of Object.entries(pkg.dependencies)) {
          dependencies.push(this.createDependencyInfo(name, version as string, false));
        }
      }

      // Process dev dependencies if configured
      if (this.config.includeDev && pkg.devDependencies) {
        for (const [name, version] of Object.entries(pkg.devDependencies)) {
          dependencies.push(this.createDependencyInfo(name, version as string, true));
        }
      }

      // Process peer dependencies if configured
      if (this.config.includePeer && pkg.peerDependencies) {
        for (const [name, version] of Object.entries(pkg.peerDependencies)) {
          dependencies.push(this.createDependencyInfo(name, version as string, false));
        }
      }

      // Process optional dependencies if configured
      if (this.config.includeOptional && pkg.optionalDependencies) {
        for (const [name, version] of Object.entries(pkg.optionalDependencies)) {
          dependencies.push(this.createDependencyInfo(name, version as string, false));
        }
      }

      return dependencies;
    } catch (error) {
      logger.error('Failed to read package.json', error instanceof Error ? error : undefined);
      return null;
    }
  }

  /**
   * Create a DependencyInfo object
   */
  private createDependencyInfo(name: string, version: string, isDev: boolean): DependencyInfo {
    return {
      name,
      version: version.replace(/^[\^~>=<]/, ''),
      type: 'library',
      category: 'dependencies',
      ecosystem: 'nodejs',
      usedBy: [],
      relatedTo: [],
      isDev,
    };
  }

  /**
   * Check for outdated packages using npm outdated
   */
  private async checkOutdated(): Promise<OutdatedPackage[]> {
    const outdated: OutdatedPackage[] = [];

    try {
      logger.debug('Running npm outdated');

      const { stdout } = await execAsync(
        'npm outdated --json 2>/dev/null || true',
        {
          cwd: this.projectRoot,
          timeout: this.config.timeout,
          maxBuffer: 10 * 1024 * 1024,
        }
      );

      if (!stdout.trim()) {
        return outdated;
      }

      const data = JSON.parse(stdout);

      for (const [name, info] of Object.entries(data)) {
        const pkgInfo = info as {
          current?: string;
          wanted?: string;
          latest?: string;
          dependent?: string;
          type?: string;
        };

        if (pkgInfo.current && pkgInfo.latest) {
          const urgency = calculateUpdateUrgency(pkgInfo.current, pkgInfo.latest);

          if (urgency !== 'none') {
            outdated.push({
              name,
              current: pkgInfo.current,
              wanted: pkgInfo.wanted ?? pkgInfo.current,
              latest: pkgInfo.latest,
              isDev: pkgInfo.type === 'devDependencies',
              dependentType: (pkgInfo.type ?? 'dependencies') as OutdatedPackage['dependentType'],
              urgency,
            });
          }
        }
      }

      logger.debug('Outdated check complete', { count: outdated.length });
    } catch (error) {
      logger.warn('npm outdated failed', { error: String(error) });
    }

    return outdated;
  }

  /**
   * Calculate health score for a dependency
   */
  private async calculateHealthScore(
    dependency: DependencyInfo,
    vulnerabilities: VulnerabilityInfo[],
    outdated?: OutdatedPackage
  ): Promise<DependencyHealthScore> {
    const issues: HealthIssue[] = [];
    const recommendations: string[] = [];

    // Security score based on vulnerabilities
    let securityScore = 100;
    if (vulnerabilities.length > 0) {
      securityScore = this.vulnChecker.calculateSecurityScore(vulnerabilities);
      const maxSeverity = getMaxSeverity(vulnerabilities.map(v => v.severity));

      issues.push({
        type: 'vulnerability',
        severity: maxSeverity === 'critical' || maxSeverity === 'high' ? 'critical' :
                 maxSeverity === 'moderate' ? 'medium' : 'low',
        message: `${vulnerabilities.length} security ${vulnerabilities.length === 1 ? 'vulnerability' : 'vulnerabilities'} found`,
        data: { count: vulnerabilities.length, maxSeverity },
      });

      recommendations.push('Run npm audit fix to resolve security issues');
    }

    // Freshness score based on how current the version is
    let freshnessScore = 100;
    if (outdated) {
      switch (outdated.urgency) {
        case 'major':
          freshnessScore = 30;
          issues.push({
            type: 'outdated',
            severity: 'high',
            message: `Major version update available: ${outdated.current} -> ${outdated.latest}`,
          });
          recommendations.push(`Update to ${outdated.latest} (breaking changes possible)`);
          break;
        case 'minor':
          freshnessScore = 60;
          issues.push({
            type: 'outdated',
            severity: 'medium',
            message: `Minor version update available: ${outdated.current} -> ${outdated.latest}`,
          });
          recommendations.push(`Update to ${outdated.latest}`);
          break;
        case 'patch':
          freshnessScore = 85;
          issues.push({
            type: 'outdated',
            severity: 'low',
            message: `Patch update available: ${outdated.current} -> ${outdated.latest}`,
          });
          break;
      }
    }

    // Maintenance and popularity scores from registry
    let maintenanceScore = 50;
    let popularityScore = 50;

    if (this.config.fetchRegistryMetadata) {
      const quality = await this.npmClient.getQualityMetrics(dependency.name);
      if (quality) {
        maintenanceScore = Math.round(quality.maintenance * 100);
        popularityScore = Math.round(quality.popularity * 100);
      }

      // Check for deprecation
      const metadata = await this.npmClient.getPackageMetadata(dependency.name);
      if (metadata?.deprecated) {
        maintenanceScore = Math.max(0, maintenanceScore - 40);
        issues.push({
          type: 'deprecated',
          severity: 'high',
          message: `Package is deprecated: ${metadata.deprecated}`,
        });
        recommendations.push('Find an alternative package');
      }
    }

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (securityScore * 0.4) +
      (freshnessScore * 0.25) +
      (maintenanceScore * 0.2) +
      (popularityScore * 0.15)
    );

    // Determine status
    let status: HealthStatus = 'healthy';
    if (overallScore < 30) {
      status = 'critical';
    } else if (overallScore < 60) {
      status = 'warning';
    } else if (overallScore >= 60) {
      status = 'healthy';
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
        popularity: popularityScore,
      },
      issues,
      recommendations,
    };
  }

  /**
   * Get health score for a specific package
   */
  async getPackageHealth(packageName: string): Promise<DependencyHealthScore | null> {
    const dependencies = await this.readDependencies();
    if (!dependencies) return null;

    const dep = dependencies.find(d => d.name === packageName);
    if (!dep) return null;

    const vulnResult = await this.vulnChecker.checkVulnerabilities();
    const outdated = await this.checkOutdated();
    const outdatedPkg = outdated.find(p => p.name === packageName);

    return this.calculateHealthScore(
      dep,
      vulnResult.vulnerabilities.get(packageName) ?? [],
      outdatedPkg
    );
  }

  /**
   * Get packages below minimum health score threshold
   */
  async getUnhealthyPackages(): Promise<DependencyHealthScore[]> {
    const analysis = await this.analyze();
    return analysis.dependencies.filter(
      d => d.overallScore < this.config.minHealthScore
    );
  }

  /**
   * Clear internal caches
   */
  clearCache(): void {
    this.npmClient.clearCache();
  }
}

/**
 * Create a dependency health analyzer instance
 */
export function createDependencyHealthAnalyzer(
  projectRoot: string,
  config?: Partial<DependencyHealthConfig>
): DependencyHealthAnalyzer {
  return new DependencyHealthAnalyzer(projectRoot, config);
}
