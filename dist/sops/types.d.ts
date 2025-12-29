/**
 * AI-SDLC SOP Types and Schemas
 *
 * Type definitions for AI-SDLC Standard Operating Procedures integration.
 * Based on https://github.com/AISDLC/AI-SDLC-SOPs
 *
 * @module sops/types
 */
/**
 * SOP Categories aligned with AI-SDLC framework
 */
export declare enum SOPCategory {
    /** Program and Project Management (1000-1010) */
    PROGRAM_MANAGEMENT = "program-management",
    /** Operational and Maintenance (1011-1060) */
    OPERATIONS = "operations",
    /** Training and Development (1100-1220) */
    DEVELOPMENT = "development",
    /** Governance and Specialized Controls (1300-2000) */
    GOVERNANCE = "governance",
    /** Quality Records (2000+) */
    QUALITY = "quality"
}
/**
 * SOP Compliance Status
 */
export declare enum ComplianceStatus {
    /** Fully compliant with SOP requirements */
    COMPLIANT = "compliant",
    /** Partially compliant - some requirements met */
    PARTIAL = "partial",
    /** Not compliant - requirements not met */
    NON_COMPLIANT = "non-compliant",
    /** Not applicable to this project */
    NOT_APPLICABLE = "not-applicable",
    /** Not yet assessed */
    PENDING = "pending"
}
/**
 * SOP Priority/Risk Level
 */
export declare enum SOPPriority {
    /** Critical - Must be addressed immediately */
    CRITICAL = "critical",
    /** High - Should be addressed soon */
    HIGH = "high",
    /** Medium - Address in normal course */
    MEDIUM = "medium",
    /** Low - Nice to have */
    LOW = "low"
}
/**
 * AI-IRB Review Status
 */
export declare enum IRBStatus {
    /** Requires IRB review */
    REQUIRED = "required",
    /** IRB review in progress */
    IN_REVIEW = "in-review",
    /** IRB approved */
    APPROVED = "approved",
    /** IRB approval not required */
    NOT_REQUIRED = "not-required",
    /** IRB review pending */
    PENDING = "pending"
}
/**
 * Knowledge Graph Layer Types
 */
export declare enum GraphLayer {
    /** Foundation layer - AI-SDLC SOPs reference */
    STANDARDS = "standards",
    /** Project implementation layer */
    PROJECT = "project",
    /** Compliance overlay showing gaps */
    COMPLIANCE = "compliance",
    /** Custom overlay */
    CUSTOM = "custom"
}
/**
 * SOP Requirement definition
 */
export interface SOPRequirement {
    /** Requirement ID */
    id: string;
    /** Requirement description */
    description: string;
    /** Whether this requirement is mandatory */
    mandatory: boolean;
    /** Verification method */
    verification: 'document' | 'test' | 'review' | 'audit' | 'automated';
    /** Evidence required for compliance */
    evidence: string[];
    /** Related artifacts */
    artifacts?: string[];
}
/**
 * SOP Checkpoint definition
 */
export interface SOPCheckpoint {
    /** Checkpoint ID */
    id: string;
    /** Checkpoint name */
    name: string;
    /** When this checkpoint should be triggered */
    trigger: 'phase-start' | 'phase-end' | 'milestone' | 'continuous' | 'scheduled';
    /** Phase this checkpoint applies to */
    phase?: string;
    /** Requirements to verify at this checkpoint */
    requirements: string[];
    /** AI-IRB involvement */
    irbRequired: boolean;
    /** Approval authorities */
    approvers: string[];
}
/**
 * SOP Definition
 */
export interface SOPDefinition {
    /** SOP ID (e.g., "SOP-1200-01-AI") */
    id: string;
    /** SOP number (e.g., 1200) */
    number: number;
    /** SOP title */
    title: string;
    /** SOP description */
    description: string;
    /** SOP category */
    category: SOPCategory;
    /** Priority/risk level */
    priority: SOPPriority;
    /** Version */
    version: string;
    /** Source URL */
    sourceUrl: string;
    /** Scope description */
    scope: string;
    /** Requirements */
    requirements: SOPRequirement[];
    /** Checkpoints */
    checkpoints: SOPCheckpoint[];
    /** Related SOPs */
    relatedSOPs: string[];
    /** Tags for searching */
    tags: string[];
    /** Whether AI-IRB review is typically required */
    irbTypicallyRequired: boolean;
    /** Applicable project types */
    applicableTo: string[];
}
/**
 * Project SOP Assessment
 */
export interface SOPAssessment {
    /** SOP ID being assessed */
    sopId: string;
    /** Current compliance status */
    status: ComplianceStatus;
    /** Compliance score (0-100) */
    score: number;
    /** Requirements met */
    requirementsMet: string[];
    /** Requirements not met (gaps) */
    requirementsGaps: string[];
    /** Evidence provided */
    evidence: Record<string, string>;
    /** AI-IRB status */
    irbStatus: IRBStatus;
    /** Assessment date */
    assessedAt: Date;
    /** Assessor */
    assessedBy: string;
    /** Notes */
    notes: string;
    /** Remediation plan if non-compliant */
    remediationPlan?: string;
    /** Target compliance date */
    targetDate?: Date;
}
/**
 * Compliance Gap
 */
export interface ComplianceGap {
    /** Gap ID */
    id: string;
    /** SOP ID */
    sopId: string;
    /** Requirement ID */
    requirementId: string;
    /** Gap description */
    description: string;
    /** Priority */
    priority: SOPPriority;
    /** Impact description */
    impact: string;
    /** Recommended remediation */
    remediation: string;
    /** Effort estimate */
    effort: 'low' | 'medium' | 'high';
    /** Status */
    status: 'open' | 'in-progress' | 'resolved' | 'accepted-risk';
    /** Created date */
    createdAt: Date;
    /** Resolved date */
    resolvedAt?: Date;
}
/**
 * Graph Layer Definition
 */
export interface LayerDefinition {
    /** Layer ID */
    id: string;
    /** Layer name */
    name: string;
    /** Layer type */
    type: GraphLayer;
    /** Layer description */
    description: string;
    /** Whether layer is visible */
    visible: boolean;
    /** Layer order (for rendering) */
    order: number;
    /** Node filter for this layer */
    nodeFilter?: (node: LayerNode) => boolean;
    /** Edge filter for this layer */
    edgeFilter?: (edge: LayerEdge) => boolean;
    /** Metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Layer Node - extends base node with layer info
 */
export interface LayerNode {
    /** Node ID */
    id: string;
    /** Node title */
    title: string;
    /** Node type */
    type: string;
    /** Layer this node belongs to */
    layer: GraphLayer;
    /** SOP reference (for standards layer) */
    sopRef?: string;
    /** Compliance status (for compliance layer) */
    complianceStatus?: ComplianceStatus;
    /** Tags */
    tags: string[];
    /** Metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Layer Edge - extends base edge with layer info
 */
export interface LayerEdge {
    /** Source node ID */
    source: string;
    /** Target node ID */
    target: string;
    /** Edge type */
    type: 'implements' | 'references' | 'depends-on' | 'compliance-gap' | 'wikilink';
    /** Layer this edge belongs to */
    layer: GraphLayer;
    /** Weight */
    weight: number;
    /** Metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Multi-Layer Graph
 */
export interface MultiLayerGraph {
    /** Graph ID */
    id: string;
    /** Graph name */
    name: string;
    /** Layers */
    layers: LayerDefinition[];
    /** All nodes across layers */
    nodes: LayerNode[];
    /** All edges across layers */
    edges: LayerEdge[];
    /** Cross-layer edges (connecting nodes in different layers) */
    crossLayerEdges: LayerEdge[];
    /** Metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Compliance Report
 */
export interface ComplianceReport {
    /** Report ID */
    id: string;
    /** Project name */
    projectName: string;
    /** Report generation date */
    generatedAt: Date;
    /** Overall compliance score (0-100) */
    overallScore: number;
    /** SOP assessments */
    assessments: SOPAssessment[];
    /** Open gaps */
    gaps: ComplianceGap[];
    /** Summary by category */
    categoryScores: Record<SOPCategory, number>;
    /** Summary by priority */
    priorityBreakdown: Record<SOPPriority, {
        total: number;
        compliant: number;
    }>;
    /** AI-IRB summary */
    irbSummary: {
        required: number;
        approved: number;
        pending: number;
        inReview: number;
    };
    /** Recommendations */
    recommendations: string[];
}
/**
 * SOP Node Frontmatter - extends standard frontmatter with SOP fields
 */
export interface SOPFrontmatter {
    /** Standard frontmatter fields */
    title?: string;
    type?: string;
    status?: string;
    created?: string;
    updated?: string;
    tags?: string[];
    /** SOP-specific fields */
    sop?: {
        /** SOP ID reference */
        id?: string;
        /** Compliance status */
        status?: ComplianceStatus;
        /** AI-IRB status */
        irbStatus?: IRBStatus;
        /** Requirements addressed */
        requirements?: string[];
        /** Evidence links */
        evidence?: string[];
        /** Last assessment date */
        assessedAt?: string;
        /** Assessor */
        assessedBy?: string;
        /** Notes */
        notes?: string;
    };
    /** Layer assignment */
    layer?: GraphLayer;
}
/**
 * SOP Configuration
 */
export interface SOPConfig {
    /** Whether SOP compliance is enabled */
    enabled: boolean;
    /** Source repository for SOPs */
    sourceRepo: string;
    /** SOP version/tag to use */
    version: string;
    /** Categories to include */
    categories: SOPCategory[];
    /** Custom SOP definitions */
    customSOPs?: SOPDefinition[];
    /** Default IRB requirement */
    defaultIRBRequired: boolean;
    /** Auto-assessment configuration */
    autoAssess?: {
        /** Enable auto-assessment */
        enabled: boolean;
        /** Patterns to match for compliance */
        patterns: Record<string, string[]>;
    };
}
//# sourceMappingURL=types.d.ts.map