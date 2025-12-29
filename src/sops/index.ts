/**
 * AI-SDLC SOP Integration Module
 *
 * Provides multi-layer knowledge graph support for AI-SDLC Standard Operating Procedures.
 * Enables compliance checking, gap analysis, and overlay visualization.
 *
 * @module sops
 */

// Type exports
export {
  // Enums
  SOPCategory,
  ComplianceStatus,
  SOPPriority,
  IRBStatus,
  GraphLayer,
  // Interfaces
  type SOPRequirement,
  type SOPCheckpoint,
  type SOPDefinition,
  type SOPAssessment,
  type ComplianceGap,
  type LayerDefinition,
  type LayerNode,
  type LayerEdge,
  type MultiLayerGraph,
  type ComplianceReport,
  type SOPFrontmatter,
  type SOPConfig,
} from './types.js';

// Registry exports
export {
  getSOPById,
  getSOPsByCategory,
  getSOPsRequiringIRB,
  searchSOPs,
  getAllSOPs,
  getSopCount,
  getCategories,
} from './registry.js';

// Compliance checker exports
export {
  checkCompliance,
  checkSOPCompliance,
  meetsMinimumCompliance,
  type ComplianceCheckOptions,
  type ComplianceCheckResult,
  type EvidenceItem,
} from './compliance-checker.js';

// Gap analyzer exports
export {
  analyzeGaps,
  getGapsForSOP,
  getQuickWins,
  calculateProgress,
  type GapAnalysisOptions,
  type GapAnalysisResult,
  type GapSummary,
  type RemediationRoadmap,
  type RemediationPhase,
  type GapDependency,
} from './gap-analyzer.js';

// Overlay manager exports
export {
  createMultiLayerGraph,
  addProjectLayer,
  addComplianceOverlay,
  filterByLayer,
  filterByComplianceStatus,
  getComplianceSummary,
  getGapNodes,
  toggleLayerVisibility,
  exportToVisualizationFormat,
  createSOPFocusedSubgraph,
  type OverlayManagerOptions,
  type NodeStyleConfig,
} from './overlay-manager.js';
