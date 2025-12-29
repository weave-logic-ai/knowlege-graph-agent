/**
 * Dependency Health Analyzer - Type Definitions
 *
 * Types for the dependency health analysis plugin that evaluates
 * npm dependencies for vulnerabilities, outdated packages, and health metrics.
 *
 * @module plugins/analyzers/dependency-health/types
 */

import type { DependencyInfo, Ecosystem } from '../../../cultivation/types.js';
import type { NodeType, GraphEdge } from '../../../core/types.js';

// ============================================================================
// Vulnerability Types
// ============================================================================

/**
 * Severity levels for vulnerabilities
 */
export type VulnerabilitySeverity = 'info' | 'low' | 'moderate' | 'high' | 'critical';

/**
 * Information about a security vulnerability
 */
export interface VulnerabilityInfo {
  /** CVE or advisory ID */
  id: string;
  /** Vulnerability title */
  title: string;
  /** Severity level */
  severity: VulnerabilitySeverity;
  /** Affected versions range */
  vulnerableVersions: string;
  /** Patched versions range */
  patchedVersions: string | null;
  /** Recommendation for resolution */
  recommendation: string;
  /** Reference URLs */
  references: string[];
  /** CVSS score if available */
  cvssScore?: number;
  /** CWE IDs */
  cweIds?: string[];
  /** Date discovered */
  publishedAt?: string;
}

/**
 * npm audit finding structure
 */
export interface AuditFinding {
  /** Package name */
  name: string;
  /** Installed version */
  version: string;
  /** Severity */
  severity: VulnerabilitySeverity;
  /** Is this a direct dependency */
  isDirect: boolean;
  /** Dependency path */
  via: string[];
  /** Dependency effects */
  effects: string[];
  /** Range of affected versions */
  range: string;
  /** Fix available flag */
  fixAvailable: boolean | { name: string; version: string; isSemVerMajor: boolean };
}

/**
 * npm audit report structure
 */
export interface AuditReport {
  /** Audit metadata */
  auditReportVersion: number;
  /** Vulnerabilities by package */
  vulnerabilities: Record<string, AuditFinding>;
  /** Vulnerability counts by severity */
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
    dependencies: {
      prod: number;
      dev: number;
      optional: number;
      peer: number;
      peerOptional: number;
      total: number;
    };
  };
}

// ============================================================================
// Outdated Package Types
// ============================================================================

/**
 * Update urgency classification
 */
export type UpdateUrgency = 'none' | 'patch' | 'minor' | 'major' | 'breaking';

/**
 * Information about outdated packages
 */
export interface OutdatedPackage {
  /** Package name */
  name: string;
  /** Current installed version */
  current: string;
  /** Wanted version (satisfies semver) */
  wanted: string;
  /** Latest version available */
  latest: string;
  /** Is this a dev dependency */
  isDev: boolean;
  /** Package type (dependencies, devDependencies, etc.) */
  dependentType: 'dependencies' | 'devDependencies' | 'optionalDependencies' | 'peerDependencies';
  /** Update urgency classification */
  urgency: UpdateUrgency;
  /** Changelog URL if available */
  changelog?: string;
  /** Repository URL */
  repository?: string;
}

// ============================================================================
// npm Registry Types
// ============================================================================

/**
 * npm registry package metadata
 */
export interface NpmPackageMetadata {
  /** Package name */
  name: string;
  /** Latest version */
  version: string;
  /** Package description */
  description?: string;
  /** Keywords */
  keywords?: string[];
  /** Author */
  author?: {
    name: string;
    email?: string;
    url?: string;
  };
  /** License */
  license?: string;
  /** Repository URL */
  repository?: {
    type: string;
    url: string;
  };
  /** Homepage URL */
  homepage?: string;
  /** Bugs URL */
  bugs?: {
    url: string;
  };
  /** npm quality metrics */
  quality?: NpmQualityMetrics;
  /** Download statistics */
  downloads?: NpmDownloadStats;
  /** Last publish date */
  lastPublish?: string;
  /** Deprecation notice if any */
  deprecated?: string;
  /** Type definitions availability */
  hasTypes?: boolean;
}

/**
 * npm quality metrics (from npms.io or similar)
 */
export interface NpmQualityMetrics {
  /** Overall quality score (0-1) */
  quality: number;
  /** Popularity score (0-1) */
  popularity: number;
  /** Maintenance score (0-1) */
  maintenance: number;
  /** Final combined score (0-1) */
  final: number;
}

/**
 * npm download statistics
 */
export interface NpmDownloadStats {
  /** Downloads in last day */
  daily: number;
  /** Downloads in last week */
  weekly: number;
  /** Downloads in last month */
  monthly: number;
  /** Download trend (positive = growing) */
  trend?: number;
}

// ============================================================================
// Health Score Types
// ============================================================================

/**
 * Health status classification
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

/**
 * Health score breakdown for a dependency
 */
export interface DependencyHealthScore {
  /** Package name */
  name: string;
  /** Package version */
  version: string;
  /** Overall health score (0-100) */
  overallScore: number;
  /** Health status classification */
  status: HealthStatus;
  /** Component scores */
  components: {
    /** Security score (0-100, lower if vulnerabilities) */
    security: number;
    /** Freshness score (0-100, based on how current the version is) */
    freshness: number;
    /** Maintenance score (0-100, based on update frequency, issues, etc.) */
    maintenance: number;
    /** Popularity score (0-100, based on downloads and usage) */
    popularity: number;
  };
  /** Issues affecting the score */
  issues: HealthIssue[];
  /** Recommendations for improvement */
  recommendations: string[];
}

/**
 * Health issue affecting a dependency
 */
export interface HealthIssue {
  /** Issue type */
  type: 'vulnerability' | 'outdated' | 'deprecated' | 'unmaintained' | 'low-popularity';
  /** Issue severity */
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  /** Issue description */
  message: string;
  /** Reference data */
  data?: Record<string, unknown>;
}

// ============================================================================
// Graph Node Types
// ============================================================================

/**
 * Health-aware dependency node for knowledge graph
 */
export interface DependencyHealthNode {
  /** Node ID (derived from package name) */
  id: string;
  /** Node type */
  type: NodeType;
  /** Package name */
  name: string;
  /** Package version */
  version: string;
  /** Health score information */
  health: DependencyHealthScore;
  /** Dependency info from cultivation */
  dependency: DependencyInfo;
  /** npm metadata */
  metadata?: NpmPackageMetadata;
  /** Tags for categorization */
  tags: string[];
  /** Warning metadata for vulnerabilities/issues */
  warnings?: {
    hasVulnerabilities: boolean;
    vulnerabilityCount: number;
    maxSeverity?: VulnerabilitySeverity;
    isOutdated: boolean;
    isDeprecated: boolean;
  };
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Dependency relationship edge
 */
export interface DependencyEdge extends GraphEdge {
  /** Edge type for dependencies */
  type: 'link' | 'reference' | 'parent' | 'related';
  /** Dependency relationship type */
  dependencyType?: 'production' | 'development' | 'peer' | 'optional';
  /** Version constraint */
  versionConstraint?: string;
}

// ============================================================================
// Analysis Result Types
// ============================================================================

/**
 * Complete dependency health analysis result
 */
export interface DependencyHealthAnalysis {
  /** Analysis timestamp */
  analyzedAt: string;
  /** Project root path */
  projectRoot: string;
  /** Package manager detected */
  packageManager: 'npm' | 'yarn' | 'pnpm';
  /** Total dependencies analyzed */
  totalDependencies: number;
  /** Summary statistics */
  summary: {
    /** Total vulnerabilities found */
    vulnerabilities: {
      critical: number;
      high: number;
      moderate: number;
      low: number;
      info: number;
      total: number;
    };
    /** Outdated packages count */
    outdated: {
      major: number;
      minor: number;
      patch: number;
      total: number;
    };
    /** Health score distribution */
    healthScores: {
      healthy: number;
      warning: number;
      critical: number;
      unknown: number;
    };
    /** Average health score */
    averageHealthScore: number;
  };
  /** Individual dependency results */
  dependencies: DependencyHealthScore[];
  /** Generated graph nodes */
  nodes: DependencyHealthNode[];
  /** Generated graph edges */
  edges: DependencyEdge[];
  /** Analysis warnings */
  warnings: string[];
  /** Analysis errors */
  errors: string[];
  /** Analysis duration in ms */
  duration: number;
}

// ============================================================================
// Plugin Configuration Types
// ============================================================================

/**
 * Dependency health analyzer configuration
 */
export interface DependencyHealthConfig {
  /** Minimum health score threshold (0-100) */
  minHealthScore?: number;
  /** Include dev dependencies in analysis */
  includeDev?: boolean;
  /** Include peer dependencies in analysis */
  includePeer?: boolean;
  /** Include optional dependencies in analysis */
  includeOptional?: boolean;
  /** Skip specific packages from analysis */
  skipPackages?: string[];
  /** Severity threshold for vulnerability reporting */
  vulnerabilitySeverityThreshold?: VulnerabilitySeverity;
  /** Enable npm registry API calls for metadata */
  fetchRegistryMetadata?: boolean;
  /** Registry URL (default: https://registry.npmjs.org) */
  registryUrl?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Cache TTL in ms */
  cacheTtl?: number;
  /** Whether to store results in database */
  storeInDatabase?: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: Required<DependencyHealthConfig> = {
  minHealthScore: 50,
  includeDev: true,
  includePeer: false,
  includeOptional: false,
  skipPackages: [],
  vulnerabilitySeverityThreshold: 'low',
  fetchRegistryMetadata: true,
  registryUrl: 'https://registry.npmjs.org',
  timeout: 30000,
  cacheTtl: 3600000, // 1 hour
  storeInDatabase: true,
};

// ============================================================================
// AnalyzerPlugin Configuration Types
// ============================================================================

/**
 * Configuration for the DependencyHealthAnalyzerPlugin
 */
export interface DependencyAnalyzerPluginConfig extends DependencyHealthConfig {
  /** Whether to generate knowledge graph nodes */
  generateGraphNodes?: boolean;
  /** Whether to generate markdown report */
  generateReport?: boolean;
  /** Path to write report to */
  reportPath?: string;
  /** Enable streaming analysis mode */
  enableStreaming?: boolean;
  /** Known vulnerable version patterns to detect */
  vulnerablePatterns?: VulnerablePattern[];
  /** Unused dependency detection threshold (days since last import) */
  unusedThresholdDays?: number;
}

/**
 * Known vulnerable version pattern
 */
export interface VulnerablePattern {
  /** Package name or pattern */
  package: string;
  /** Vulnerable version range */
  versionRange: string;
  /** CVE or advisory ID */
  advisoryId?: string;
  /** Severity level */
  severity: VulnerabilitySeverity;
  /** Description of the vulnerability */
  description: string;
}

/**
 * Default plugin configuration
 */
export const DEFAULT_PLUGIN_CONFIG: Required<DependencyAnalyzerPluginConfig> = {
  ...DEFAULT_CONFIG,
  generateGraphNodes: true,
  generateReport: false,
  reportPath: '',
  enableStreaming: true,
  vulnerablePatterns: [],
  unusedThresholdDays: 90,
};

/**
 * Health metrics for dependencies
 */
export interface DependencyHealthMetrics {
  /** Total number of dependencies analyzed */
  totalDependencies: number;
  /** Number of healthy dependencies */
  healthyCount: number;
  /** Number of warning-level dependencies */
  warningCount: number;
  /** Number of critical dependencies */
  criticalCount: number;
  /** Average health score (0-100) */
  averageHealthScore: number;
  /** Number of outdated dependencies */
  outdatedCount: number;
  /** Number of vulnerable dependencies */
  vulnerableCount: number;
  /** Number of potentially unused dependencies */
  unusedCount: number;
  /** Security score (0-100) */
  securityScore: number;
  /** Freshness score (0-100) */
  freshnessScore: number;
  /** Maintenance score (0-100) */
  maintenanceScore: number;
}

/**
 * Package.json structure for parsing
 */
export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

/**
 * Package-lock.json structure (simplified)
 */
export interface PackageLockJson {
  name?: string;
  version?: string;
  lockfileVersion?: number;
  packages?: Record<string, {
    version?: string;
    resolved?: string;
    integrity?: string;
    dev?: boolean;
    optional?: boolean;
    peer?: boolean;
    dependencies?: Record<string, string>;
  }>;
  dependencies?: Record<string, {
    version: string;
    resolved?: string;
    integrity?: string;
    dev?: boolean;
    optional?: boolean;
    requires?: Record<string, string>;
    dependencies?: Record<string, unknown>;
  }>;
}
