/**
 * Cultivation System - Module Exports
 *
 * Provides seed generation, dependency analysis, and primitive node creation
 * from codebase analysis.
 *
 * @module cultivation
 */

// Types
export type {
  VaultContext,
  Ecosystem,
  DependencyType,
  ServiceType,
  DependencyInfo,
  ServiceInfo,
  SeedAnalysis,
  DocumentMetadata,
  GeneratedDocument,
  CultivationReport,
  CultivationOptions,
  GapAnalysis,
  InitPrimitivesResult
} from './types.js';

// SeedGenerator class and functions
export {
  SeedGenerator,
  analyzeSeed,
  initPrimitives
} from './seed-generator.js';

// DeepAnalyzer class and functions
export {
  DeepAnalyzer,
  createDeepAnalyzer,
  analyzeDeep,
} from './deep-analyzer.js';

export type {
  DeepAnalyzerOptions,
  AgentResult,
  DeepAnalysisResult,
} from './deep-analyzer.js';
