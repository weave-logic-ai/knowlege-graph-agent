/**
 * Analyzer Plugins Index
 *
 * Exports all available analyzer plugins for the knowledge-graph-agent.
 *
 * @module plugins/analyzers
 */

// Dependency Health Analyzer
export {
  // AnalyzerPlugin implementation
  DependencyHealthAnalyzerPlugin,
  createDependencyHealthAnalyzerPlugin,

  // Legacy plugin class
  DependencyHealthPlugin,
  createDependencyHealthPlugin,
  analyzeDependencyHealth,
  enhanceDependenciesWithHealth,

  // Components
  DependencyHealthAnalyzer,
  createDependencyHealthAnalyzer,
  DependencyGraphGenerator,
  createDependencyGraphGenerator,
  NpmClient,
  createNpmClient,
  VulnerabilityChecker,
  createVulnerabilityChecker,
} from './dependency-health/index.js';

// Dependency Health types
export type {
  // Plugin configuration
  DependencyHealthConfig,
  DependencyAnalyzerPluginConfig,
  DependencyHealthPluginResult,

  // Analysis results
  DependencyHealthAnalysis,
  DependencyHealthScore,
  DependencyHealthNode,
  DependencyHealthMetrics,

  // Vulnerability types
  VulnerabilitySeverity,
  VulnerabilityInfo,
  VulnerablePattern,
  AuditFinding,
  AuditReport,

  // Outdated types
  OutdatedPackage,
  UpdateUrgency,

  // npm types
  NpmPackageMetadata,
  NpmQualityMetrics,
  NpmDownloadStats,
  PackageJson,
  PackageLockJson,

  // Health types
  HealthStatus,
  HealthIssue,

  // Graph types
  DependencyEdge,
} from './dependency-health/index.js';

// Code Complexity Analyzer
export {
  // AnalyzerPlugin implementation (primary export)
  CodeComplexityAnalyzerPlugin,
  createCodeComplexityAnalyzerPlugin,

  // Legacy plugin class
  CodeComplexityPlugin,
  createComplexityPlugin,
  analyzeComplexity,
  registerWithSeedGenerator,

  // Core analyzer
  CodeComplexityAnalyzer,
  analyzeProjectComplexity,
  analyzeFileComplexity,

  // Graph generator
  ComplexityGraphGenerator,
  generateComplexityNodes,

  // Metrics calculators
  calculateCyclomaticComplexity,
  calculateCognitiveComplexity,
  calculateMaxNestingDepth,
  calculateMaintainabilityIndex,
  calculateHalsteadMetrics,

  // Constants
  DEFAULT_THRESHOLDS,
  EMPTY_HALSTEAD_METRICS,

  // Plugin metadata
  pluginMetadata as codeComplexityMetadata,
} from './code-complexity/index.js';

// Code Complexity types
export type {
  AnalyzerConfig as ComplexityAnalyzerConfig,
  CodeComplexityPluginConfig,
  ComplexityPluginOptions,
  ComplexityPluginResult,
  ComplexityNode,
  ComplexityEdge,
  ProjectAnalysis,
  FileAnalysis,
  FunctionAnalysis,
  ComplexityScore,
  ComplexityLevel,
  ComplexityThresholds,
  HalsteadMetrics,
} from './code-complexity/index.js';
