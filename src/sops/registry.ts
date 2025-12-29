/**
 * AI-SDLC SOP Registry
 *
 * Complete registry of all 40 AI-SDLC Standard Operating Procedures.
 * Based on https://github.com/AISDLC/AI-SDLC-SOPs
 *
 * @module sops/registry
 */

import {
  type SOPDefinition,
  SOPCategory,
  SOPPriority,
} from './types.js';

/**
 * Base URL for SOP source files
 */
export const SOP_SOURCE_BASE_URL = 'https://github.com/AISDLC/AI-SDLC-SOPs/blob/main/sops';

/**
 * Complete SOP Registry
 *
 * All 40 AI-SDLC SOPs organized by category
 */
export const SOP_REGISTRY: SOPDefinition[] = [
  // ============================================
  // PROGRAM & PROJECT MANAGEMENT (1000-1010)
  // ============================================
  {
    id: 'SOP-1000-01-AI',
    number: 1000,
    title: 'AI-Integrated Program and Project Management',
    description: 'Establishes governance for AI program oversight, project initiation, and lifecycle management.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1000-01-AI_AI-Integrated-Program-and-Project-Management.md`,
    scope: 'All AI-enabled programs and projects from inception to completion.',
    requirements: [
      { id: 'REQ-1000-01', description: 'Define project charter with AI-specific scope', mandatory: true, verification: 'document', evidence: ['Project Charter'] },
      { id: 'REQ-1000-02', description: 'Establish AI-IRB liaison assignment', mandatory: true, verification: 'document', evidence: ['Liaison Assignment'] },
      { id: 'REQ-1000-03', description: 'Create project plan with AI milestones', mandatory: true, verification: 'document', evidence: ['Project Plan'] },
    ],
    checkpoints: [
      { id: 'CP-1000-01', name: 'Project Initiation', trigger: 'phase-start', phase: 'initiation', requirements: ['REQ-1000-01', 'REQ-1000-02'], irbRequired: true, approvers: ['Project Sponsor', 'AI-IRB Liaison'] },
    ],
    relatedSOPs: ['SOP-1001-01-AI', 'SOP-1006-01-AI', 'SOP-1054-01-AI'],
    tags: ['program-management', 'project-management', 'governance', 'irb'],
    irbTypicallyRequired: true,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1001-01-AI',
    number: 1001,
    title: 'Document Governance and AI-IRB Compliance',
    description: 'Controls document creation, review, approval, and retention for AI-SDLC projects.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1001-01-AI_Document-Governance-and-AI-IRB-Compliance.md`,
    scope: 'All documentation artifacts in AI-SDLC projects.',
    requirements: [
      { id: 'REQ-1001-01', description: 'Implement document version control', mandatory: true, verification: 'automated', evidence: ['VCS Repository'] },
      { id: 'REQ-1001-02', description: 'Establish document review workflow', mandatory: true, verification: 'document', evidence: ['Review Workflow'] },
      { id: 'REQ-1001-03', description: 'Define retention policies', mandatory: true, verification: 'document', evidence: ['Retention Policy'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1000-01-AI', 'SOP-2002-01-AI'],
    tags: ['documentation', 'governance', 'version-control', 'retention'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1002-01-AI',
    number: 1002,
    title: 'Capacity Management',
    description: 'Manages compute resources, HPC allocations, and infrastructure capacity for AI workloads.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.MEDIUM,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1002-01-AI_Capacity-Management.md`,
    scope: 'AI infrastructure and compute resource management.',
    requirements: [
      { id: 'REQ-1002-01', description: 'Assess capacity requirements', mandatory: true, verification: 'document', evidence: ['Capacity Assessment'] },
      { id: 'REQ-1002-02', description: 'Monitor resource utilization', mandatory: true, verification: 'automated', evidence: ['Monitoring Dashboard'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1007-01-AI'],
    tags: ['capacity', 'infrastructure', 'resources', 'hpc'],
    irbTypicallyRequired: false,
    applicableTo: ['ml-training', 'inference', 'hpc'],
  },
  {
    id: 'SOP-1003-01-AI',
    number: 1003,
    title: 'Configuration Management',
    description: 'Controls versioning, change management, and configuration tracking for AI systems.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1003-01-AI_Configuration-Management.md`,
    scope: 'All configuration items including code, models, data schemas, and environment definitions.',
    requirements: [
      { id: 'REQ-1003-01', description: 'Use approved version control system', mandatory: true, verification: 'automated', evidence: ['VCS Repository'] },
      { id: 'REQ-1003-02', description: 'Implement change request process', mandatory: true, verification: 'document', evidence: ['Change Request Log'] },
      { id: 'REQ-1003-03', description: 'Maintain configuration baseline', mandatory: true, verification: 'document', evidence: ['Configuration Baseline'] },
      { id: 'REQ-1003-04', description: 'Document rollback procedures', mandatory: true, verification: 'document', evidence: ['Rollback Plan'] },
    ],
    checkpoints: [
      { id: 'CP-1003-01', name: 'Change Approval', trigger: 'milestone', requirements: ['REQ-1003-02'], irbRequired: false, approvers: ['Configuration Manager'] },
    ],
    relatedSOPs: ['SOP-1001-01-AI', 'SOP-1200-01-AI'],
    tags: ['configuration', 'version-control', 'change-management', 'baseline'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1004-01-AI',
    number: 1004,
    title: 'Procurement and Purchasing for AI-Enabled Systems',
    description: 'Governs acquisition of AI tools, services, and third-party components.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.MEDIUM,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1004-01-AI_Procurement-and-Purchasing-for-AI-Enabled-Systems.md`,
    scope: 'Procurement of AI-related tools, services, and vendor relationships.',
    requirements: [
      { id: 'REQ-1004-01', description: 'Conduct vendor AI capability assessment', mandatory: true, verification: 'document', evidence: ['Vendor Assessment'] },
      { id: 'REQ-1004-02', description: 'Review third-party AI ethical compliance', mandatory: true, verification: 'review', evidence: ['Ethics Review'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1006-01-AI'],
    tags: ['procurement', 'vendors', 'third-party', 'acquisition'],
    irbTypicallyRequired: true,
    applicableTo: ['third-party-ai', 'vendor-integration'],
  },
  {
    id: 'SOP-1005-01-AI',
    number: 1005,
    title: 'AI-Integrated Release Planning',
    description: 'Plans and coordinates AI system releases including model deployments.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1005-01-AI_AI-Integrated-Release-Planning.md`,
    scope: 'All AI system releases and model deployments.',
    requirements: [
      { id: 'REQ-1005-01', description: 'Create release plan with AI validation gates', mandatory: true, verification: 'document', evidence: ['Release Plan'] },
      { id: 'REQ-1005-02', description: 'Define rollback criteria', mandatory: true, verification: 'document', evidence: ['Rollback Criteria'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1220-01-AI', 'SOP-1003-01-AI'],
    tags: ['release', 'deployment', 'planning'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1006-01-AI',
    number: 1006,
    title: 'AI-IRB Engagement and Ethical Review Procedure',
    description: 'Defines AI-IRB engagement process and ethical review requirements.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1006-01-AI_AI-IRB-Engagement-and-Ethical-Review-Procedure.md`,
    scope: 'All projects requiring AI-IRB review and ethical assessment.',
    requirements: [
      { id: 'REQ-1006-01', description: 'Submit AI-IRB review request', mandatory: true, verification: 'document', evidence: ['IRB Request Form'] },
      { id: 'REQ-1006-02', description: 'Complete ethical impact assessment', mandatory: true, verification: 'document', evidence: ['Ethics Assessment'] },
      { id: 'REQ-1006-03', description: 'Obtain IRB approval before deployment', mandatory: true, verification: 'document', evidence: ['IRB Approval'] },
    ],
    checkpoints: [
      { id: 'CP-1006-01', name: 'IRB Initial Review', trigger: 'phase-start', phase: 'initiation', requirements: ['REQ-1006-01'], irbRequired: true, approvers: ['AI-IRB Committee'] },
      { id: 'CP-1006-02', name: 'IRB Final Approval', trigger: 'phase-end', phase: 'validation', requirements: ['REQ-1006-03'], irbRequired: true, approvers: ['AI-IRB Committee'] },
    ],
    relatedSOPs: ['SOP-1300-01-AI', 'SOP-1053-01-AI', 'SOP-1305-01-AI'],
    tags: ['irb', 'ethics', 'review', 'approval', 'governance'],
    irbTypicallyRequired: true,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1007-01-AI',
    number: 1007,
    title: 'AI Asset Management',
    description: 'Tracks and manages AI assets including models, datasets, and infrastructure.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.MEDIUM,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1007-01-AI_AI-Asset-Management.md`,
    scope: 'All AI assets throughout their lifecycle.',
    requirements: [
      { id: 'REQ-1007-01', description: 'Maintain AI asset registry', mandatory: true, verification: 'document', evidence: ['Asset Registry'] },
      { id: 'REQ-1007-02', description: 'Track asset ownership and responsibility', mandatory: true, verification: 'document', evidence: ['Ownership Records'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1020-01-AI', 'SOP-1002-01-AI'],
    tags: ['assets', 'inventory', 'tracking', 'models', 'datasets'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1008-01-AI',
    number: 1008,
    title: 'AI Incident and Escalation Management',
    description: 'Defines incident response and escalation procedures for AI systems.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1008-01-AI_AI-Incident-and-Escalation-Management.md`,
    scope: 'All AI-related incidents including bias events, failures, and security breaches.',
    requirements: [
      { id: 'REQ-1008-01', description: 'Define incident classification criteria', mandatory: true, verification: 'document', evidence: ['Incident Classification'] },
      { id: 'REQ-1008-02', description: 'Establish escalation matrix', mandatory: true, verification: 'document', evidence: ['Escalation Matrix'] },
      { id: 'REQ-1008-03', description: 'Document incident response procedures', mandatory: true, verification: 'document', evidence: ['Response Procedures'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1061-01-AI', 'SOP-1010-01-AI'],
    tags: ['incident', 'escalation', 'response', 'crisis'],
    irbTypicallyRequired: true,
    applicableTo: ['production'],
  },
  {
    id: 'SOP-1009-01-AI',
    number: 1009,
    title: 'AI Model Drift and Re-Validation Procedure',
    description: 'Detects and addresses model drift requiring revalidation.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1009-01-AI_AI-Model-Drift-and-Re-Validation-Procedure.md`,
    scope: 'Production AI models requiring drift monitoring.',
    requirements: [
      { id: 'REQ-1009-01', description: 'Establish drift detection thresholds', mandatory: true, verification: 'document', evidence: ['Drift Thresholds'] },
      { id: 'REQ-1009-02', description: 'Implement drift monitoring', mandatory: true, verification: 'automated', evidence: ['Monitoring System'] },
      { id: 'REQ-1009-03', description: 'Define revalidation triggers', mandatory: true, verification: 'document', evidence: ['Revalidation Criteria'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1013-01-AI', 'SOP-1304-01-AI'],
    tags: ['drift', 'monitoring', 'revalidation', 'performance'],
    irbTypicallyRequired: false,
    applicableTo: ['production-ml'],
  },
  {
    id: 'SOP-1010-01-AI',
    number: 1010,
    title: 'AI-SDLC Site Monitoring and Incident Management',
    description: 'Monitors AI system health and manages site-level incidents.',
    category: SOPCategory.PROGRAM_MANAGEMENT,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1010-01-AI_AI-SDLC-Site-Monitoring-and-Incident-Management.md`,
    scope: 'Production AI systems and infrastructure.',
    requirements: [
      { id: 'REQ-1010-01', description: 'Implement real-time monitoring', mandatory: true, verification: 'automated', evidence: ['Monitoring Dashboard'] },
      { id: 'REQ-1010-02', description: 'Define alerting thresholds', mandatory: true, verification: 'document', evidence: ['Alert Configuration'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1008-01-AI', 'SOP-1061-01-AI'],
    tags: ['monitoring', 'site', 'operations', 'alerting'],
    irbTypicallyRequired: false,
    applicableTo: ['production'],
  },

  // ============================================
  // OPERATIONS & MAINTENANCE (1011-1060)
  // ============================================
  {
    id: 'SOP-1011-01-AI',
    number: 1011,
    title: 'AI Feature Decommissioning and Model Retirement',
    description: 'Procedures for retiring AI features and models from production.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.MEDIUM,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1011-01-AI_AI-Feature-Decommissioning-and-Model-Retirement.md`,
    scope: 'AI models and features being retired from service.',
    requirements: [
      { id: 'REQ-1011-01', description: 'Create decommissioning plan', mandatory: true, verification: 'document', evidence: ['Decommissioning Plan'] },
      { id: 'REQ-1011-02', description: 'Notify stakeholders', mandatory: true, verification: 'document', evidence: ['Stakeholder Communication'] },
      { id: 'REQ-1011-03', description: 'Archive model artifacts', mandatory: true, verification: 'document', evidence: ['Archive Records'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1306-01-AI', 'SOP-1020-01-AI'],
    tags: ['decommissioning', 'retirement', 'sunset', 'end-of-life'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1012-01-AI',
    number: 1012,
    title: 'AI Model Explainability and Interpretability Procedure',
    description: 'Ensures AI models meet explainability and interpretability standards.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1012-01-AI_AI-Model-Explainability-and-Interpretability-Procedure.md`,
    scope: 'AI models requiring explanation of decisions.',
    requirements: [
      { id: 'REQ-1012-01', description: 'Document model explanation methods', mandatory: true, verification: 'document', evidence: ['Explainability Documentation'] },
      { id: 'REQ-1012-02', description: 'Implement interpretability features', mandatory: true, verification: 'test', evidence: ['Feature Implementation'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1302-01-AI', 'SOP-1301-01-AI'],
    tags: ['explainability', 'interpretability', 'transparency', 'xai'],
    irbTypicallyRequired: true,
    applicableTo: ['decision-systems', 'regulated'],
  },
  {
    id: 'SOP-1013-01-AI',
    number: 1013,
    title: 'AI Model Post-Production Monitoring and Ongoing Validation',
    description: 'Continuous monitoring and validation of production AI models.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1013-01-AI_AI-Model-Post-Production-Monitoring-and-Ongoing-Validation.md`,
    scope: 'All production AI models.',
    requirements: [
      { id: 'REQ-1013-01', description: 'Implement continuous monitoring', mandatory: true, verification: 'automated', evidence: ['Monitoring System'] },
      { id: 'REQ-1013-02', description: 'Schedule periodic validation', mandatory: true, verification: 'document', evidence: ['Validation Schedule'] },
      { id: 'REQ-1013-03', description: 'Track performance metrics', mandatory: true, verification: 'automated', evidence: ['Metrics Dashboard'] },
    ],
    checkpoints: [
      { id: 'CP-1013-01', name: 'Periodic Validation', trigger: 'scheduled', requirements: ['REQ-1013-02'], irbRequired: false, approvers: ['Data Science Lead'] },
    ],
    relatedSOPs: ['SOP-1009-01-AI', 'SOP-1304-01-AI'],
    tags: ['monitoring', 'validation', 'production', 'performance'],
    irbTypicallyRequired: false,
    applicableTo: ['production-ml'],
  },
  {
    id: 'SOP-1014-01-AI',
    number: 1014,
    title: 'Regulatory and Ethical AI Compliance Verification',
    description: 'Verifies AI systems comply with regulatory and ethical requirements.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1014-01-AI_Regulatory-and-Ethical-AI-Compliance-Verification.md`,
    scope: 'All AI systems subject to regulatory or ethical requirements.',
    requirements: [
      { id: 'REQ-1014-01', description: 'Identify applicable regulations', mandatory: true, verification: 'document', evidence: ['Regulatory Mapping'] },
      { id: 'REQ-1014-02', description: 'Conduct compliance audit', mandatory: true, verification: 'audit', evidence: ['Audit Report'] },
      { id: 'REQ-1014-03', description: 'Maintain compliance evidence', mandatory: true, verification: 'document', evidence: ['Compliance Records'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1006-01-AI', 'SOP-1300-01-AI', 'SOP-1305-01-AI'],
    tags: ['regulatory', 'compliance', 'ethics', 'audit'],
    irbTypicallyRequired: true,
    applicableTo: ['regulated', 'high-risk'],
  },
  {
    id: 'SOP-1015-01-AI',
    number: 1015,
    title: 'AI Knowledge Transfer and Handover Procedure',
    description: 'Ensures proper knowledge transfer for AI systems.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.MEDIUM,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1015-01-AI_AI-Knowledge-Transfer-and-Handover-Procedure.md`,
    scope: 'AI systems transitioning between teams or entering maintenance.',
    requirements: [
      { id: 'REQ-1015-01', description: 'Create knowledge transfer documentation', mandatory: true, verification: 'document', evidence: ['Transfer Documentation'] },
      { id: 'REQ-1015-02', description: 'Conduct handover sessions', mandatory: true, verification: 'document', evidence: ['Session Records'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1100-01-AI', 'SOP-1101-01-AI'],
    tags: ['knowledge-transfer', 'handover', 'documentation', 'training'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1020-01-AI',
    number: 1020,
    title: 'AI Model Lifecycle Management',
    description: 'Governs AI model lifecycle from development through retirement.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1020-01-AI_AI-Model-Lifecycle-Management.md`,
    scope: 'All AI models throughout their lifecycle.',
    requirements: [
      { id: 'REQ-1020-01', description: 'Define lifecycle stages', mandatory: true, verification: 'document', evidence: ['Lifecycle Definition'] },
      { id: 'REQ-1020-02', description: 'Track model versions', mandatory: true, verification: 'automated', evidence: ['Version Registry'] },
      { id: 'REQ-1020-03', description: 'Document stage transitions', mandatory: true, verification: 'document', evidence: ['Transition Records'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1052-01-AI', 'SOP-1007-01-AI', 'SOP-1011-01-AI'],
    tags: ['lifecycle', 'model-management', 'versioning', 'mlops'],
    irbTypicallyRequired: false,
    applicableTo: ['ml'],
  },
  {
    id: 'SOP-1030-01-AI',
    number: 1030,
    title: 'AI Ad-Hoc Reporting Procedure',
    description: 'Procedures for generating ad-hoc AI performance and compliance reports.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.LOW,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1030-01-AI_AI-Ad-Hoc-Reporting-Procedure.md`,
    scope: 'Custom reporting needs for AI systems.',
    requirements: [
      { id: 'REQ-1030-01', description: 'Define report request process', mandatory: false, verification: 'document', evidence: ['Request Process'] },
    ],
    checkpoints: [],
    relatedSOPs: [],
    tags: ['reporting', 'ad-hoc', 'analytics'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1040-01-AI',
    number: 1040,
    title: 'Requirements Definition',
    description: 'Establishes requirements gathering and documentation for AI systems.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1040-01-AI_Requirements-Definition.md`,
    scope: 'All AI project requirements including functional, ethical, and compliance.',
    requirements: [
      { id: 'REQ-1040-01', description: 'Conduct stakeholder elicitation', mandatory: true, verification: 'document', evidence: ['Stakeholder Interviews'] },
      { id: 'REQ-1040-02', description: 'Document requirements with acceptance criteria', mandatory: true, verification: 'document', evidence: ['Requirements Document'] },
      { id: 'REQ-1040-03', description: 'Include fairness and bias requirements', mandatory: true, verification: 'document', evidence: ['Fairness Requirements'] },
      { id: 'REQ-1040-04', description: 'Obtain requirements sign-off', mandatory: true, verification: 'document', evidence: ['Sign-off Record'] },
    ],
    checkpoints: [
      { id: 'CP-1040-01', name: 'Requirements Approval', trigger: 'phase-end', phase: 'requirements', requirements: ['REQ-1040-04'], irbRequired: true, approvers: ['Product Manager', 'AI-IRB Liaison'] },
    ],
    relatedSOPs: ['SOP-1006-01-AI', 'SOP-1200-01-AI'],
    tags: ['requirements', 'elicitation', 'specification', 'fairness'],
    irbTypicallyRequired: true,
    applicableTo: ['all'],
  },
  // Security SOPs (1050-1055)
  {
    id: 'SOP-1050-01-AI',
    number: 1050,
    title: 'AI Security Administration and Governance',
    description: 'Establishes security governance for AI systems.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1050-01-AI_AI-Security-Administration-and-Governance.md`,
    scope: 'Security governance for all AI systems.',
    requirements: [
      { id: 'REQ-1050-01', description: 'Define security policies for AI', mandatory: true, verification: 'document', evidence: ['Security Policy'] },
      { id: 'REQ-1050-02', description: 'Implement access controls', mandatory: true, verification: 'automated', evidence: ['Access Control Configuration'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1051-01-AI', 'SOP-1055-01-AI', 'SOP-1303-01-AI'],
    tags: ['security', 'governance', 'access-control', 'policy'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1051-01-AI',
    number: 1051,
    title: 'AI Security Administration and Oversight',
    description: 'Ongoing security oversight and monitoring for AI systems.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1051-01-AI_AI-Security-Administration-and-Oversight.md`,
    scope: 'Security monitoring and oversight activities.',
    requirements: [
      { id: 'REQ-1051-01', description: 'Conduct security monitoring', mandatory: true, verification: 'automated', evidence: ['Security Logs'] },
      { id: 'REQ-1051-02', description: 'Perform security reviews', mandatory: true, verification: 'review', evidence: ['Security Review Report'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1050-01-AI', 'SOP-1055-01-AI'],
    tags: ['security', 'monitoring', 'oversight'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1052-01-AI',
    number: 1052,
    title: 'AI Model Lifecycle Oversight and Governance',
    description: 'Governance oversight for AI model lifecycle management.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1052-01-AI_AI-Model-Lifecycle-Oversight-and-Governance.md`,
    scope: 'Governance oversight of model lifecycle.',
    requirements: [
      { id: 'REQ-1052-01', description: 'Establish lifecycle governance board', mandatory: true, verification: 'document', evidence: ['Governance Charter'] },
      { id: 'REQ-1052-02', description: 'Define stage gate criteria', mandatory: true, verification: 'document', evidence: ['Stage Gate Criteria'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1020-01-AI', 'SOP-1300-01-AI'],
    tags: ['lifecycle', 'governance', 'oversight', 'stage-gate'],
    irbTypicallyRequired: true,
    applicableTo: ['ml'],
  },
  {
    id: 'SOP-1053-01-AI',
    number: 1053,
    title: 'Ethical Risk Assessment and Mitigation',
    description: 'Assesses and mitigates ethical risks in AI systems.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1053-01-AI_Ethical-Risk-Assessment-and-Mitigation.md`,
    scope: 'All AI systems with potential ethical implications.',
    requirements: [
      { id: 'REQ-1053-01', description: 'Conduct ethical risk assessment', mandatory: true, verification: 'document', evidence: ['Risk Assessment'] },
      { id: 'REQ-1053-02', description: 'Develop mitigation strategies', mandatory: true, verification: 'document', evidence: ['Mitigation Plan'] },
      { id: 'REQ-1053-03', description: 'Monitor ethical risks ongoing', mandatory: true, verification: 'document', evidence: ['Risk Monitoring Log'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1006-01-AI', 'SOP-1305-01-AI', 'SOP-1301-01-AI'],
    tags: ['ethics', 'risk', 'assessment', 'mitigation'],
    irbTypicallyRequired: true,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1054-01-AI',
    number: 1054,
    title: 'AI-Regulated Project Approvals and Sponsorship',
    description: 'Approval process for AI projects in regulated environments.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1054-01-AI_AI-Regulated-Project-Approvals-and-Sponsorship.md`,
    scope: 'AI projects in regulated industries.',
    requirements: [
      { id: 'REQ-1054-01', description: 'Obtain sponsor approval', mandatory: true, verification: 'document', evidence: ['Sponsor Approval'] },
      { id: 'REQ-1054-02', description: 'Complete regulatory impact assessment', mandatory: true, verification: 'document', evidence: ['Impact Assessment'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1000-01-AI', 'SOP-1014-01-AI'],
    tags: ['regulated', 'approval', 'sponsorship', 'compliance'],
    irbTypicallyRequired: true,
    applicableTo: ['regulated'],
  },
  {
    id: 'SOP-1055-01-AI',
    number: 1055,
    title: 'Computer System Controls',
    description: 'Technical controls for AI system security and integrity.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1055-01-AI_Computer-System-Controls.md`,
    scope: 'Technical security controls for AI infrastructure.',
    requirements: [
      { id: 'REQ-1055-01', description: 'Implement system hardening', mandatory: true, verification: 'automated', evidence: ['Hardening Configuration'] },
      { id: 'REQ-1055-02', description: 'Maintain audit logs', mandatory: true, verification: 'automated', evidence: ['Audit Logs'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1050-01-AI', 'SOP-1051-01-AI'],
    tags: ['security', 'controls', 'hardening', 'audit'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1060-01-AI',
    number: 1060,
    title: 'Service Level Agreement',
    description: 'Defines SLAs for AI system performance and availability.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.MEDIUM,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1060-01-AI_Service-Level-Agreement.md`,
    scope: 'AI systems with defined service levels.',
    requirements: [
      { id: 'REQ-1060-01', description: 'Define SLA metrics', mandatory: true, verification: 'document', evidence: ['SLA Document'] },
      { id: 'REQ-1060-02', description: 'Establish monitoring for SLA compliance', mandatory: true, verification: 'automated', evidence: ['SLA Dashboard'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1010-01-AI', 'SOP-1013-01-AI'],
    tags: ['sla', 'performance', 'availability', 'service'],
    irbTypicallyRequired: false,
    applicableTo: ['production'],
  },
  {
    id: 'SOP-1061-01-AI',
    number: 1061,
    title: 'Incident Tracking',
    description: 'Tracking and management of AI-related incidents.',
    category: SOPCategory.OPERATIONS,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1061-01-AI_Incident-Tracking.md`,
    scope: 'All AI-related incidents.',
    requirements: [
      { id: 'REQ-1061-01', description: 'Log all incidents in tracking system', mandatory: true, verification: 'automated', evidence: ['Incident Log'] },
      { id: 'REQ-1061-02', description: 'Track incident resolution', mandatory: true, verification: 'automated', evidence: ['Resolution Records'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1008-01-AI', 'SOP-1010-01-AI'],
    tags: ['incident', 'tracking', 'resolution', 'logging'],
    irbTypicallyRequired: false,
    applicableTo: ['production'],
  },

  // ============================================
  // TRAINING & DEVELOPMENT (1100-1220)
  // ============================================
  {
    id: 'SOP-1100-01-AI',
    number: 1100,
    title: 'Documentation of Training',
    description: 'Records training activities for AI system operators and developers.',
    category: SOPCategory.DEVELOPMENT,
    priority: SOPPriority.MEDIUM,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1100-01-AI_Documentation-of-Training.md`,
    scope: 'Training records for AI system personnel.',
    requirements: [
      { id: 'REQ-1100-01', description: 'Maintain training records', mandatory: true, verification: 'document', evidence: ['Training Records'] },
      { id: 'REQ-1100-02', description: 'Track certification status', mandatory: true, verification: 'document', evidence: ['Certification Log'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1101-01-AI', 'SOP-1015-01-AI'],
    tags: ['training', 'records', 'certification', 'documentation'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1101-01-AI',
    number: 1101,
    title: 'Training and Documentation',
    description: 'Training program development and delivery for AI systems.',
    category: SOPCategory.DEVELOPMENT,
    priority: SOPPriority.MEDIUM,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1101-01-AI_Training-and-Documentation.md`,
    scope: 'Development of training materials and programs.',
    requirements: [
      { id: 'REQ-1101-01', description: 'Develop training curriculum', mandatory: true, verification: 'document', evidence: ['Training Curriculum'] },
      { id: 'REQ-1101-02', description: 'Deliver training sessions', mandatory: true, verification: 'document', evidence: ['Training Delivery Records'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1100-01-AI', 'SOP-1015-01-AI'],
    tags: ['training', 'curriculum', 'education', 'documentation'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1200-01-AI',
    number: 1200,
    title: 'Development',
    description: 'AI system development lifecycle procedures including coding, review, and integration.',
    category: SOPCategory.DEVELOPMENT,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1200-01-AI_Development.md`,
    scope: 'All AI development activities from design through integration.',
    requirements: [
      { id: 'REQ-1200-01', description: 'Follow approved technical design', mandatory: true, verification: 'review', evidence: ['Design Document'] },
      { id: 'REQ-1200-02', description: 'Execute unit tests with documentation', mandatory: true, verification: 'test', evidence: ['Unit Test Results'] },
      { id: 'REQ-1200-03', description: 'Conduct peer code reviews', mandatory: true, verification: 'review', evidence: ['Review Records'] },
      { id: 'REQ-1200-04', description: 'Complete integration testing', mandatory: true, verification: 'test', evidence: ['Integration Test Results'] },
      { id: 'REQ-1200-05', description: 'Notify AI-IRB of AI functionality changes', mandatory: true, verification: 'document', evidence: ['IRB Notification'] },
    ],
    checkpoints: [
      { id: 'CP-1200-01', name: 'Development Start', trigger: 'phase-start', phase: 'development', requirements: ['REQ-1200-01'], irbRequired: false, approvers: ['Development Lead'] },
      { id: 'CP-1200-02', name: 'QA Handover', trigger: 'phase-end', phase: 'development', requirements: ['REQ-1200-02', 'REQ-1200-03', 'REQ-1200-04'], irbRequired: true, approvers: ['Development Lead', 'QA Manager'] },
    ],
    relatedSOPs: ['SOP-1040-01-AI', 'SOP-1210-01-AI', 'SOP-1003-01-AI'],
    tags: ['development', 'coding', 'review', 'testing', 'integration'],
    irbTypicallyRequired: true,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1210-01-AI',
    number: 1210,
    title: 'Quality Function',
    description: 'Quality assurance processes for AI systems.',
    category: SOPCategory.DEVELOPMENT,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1210-01-AI_Quality-Function.md`,
    scope: 'All quality assurance activities for AI systems.',
    requirements: [
      { id: 'REQ-1210-01', description: 'Create quality plan', mandatory: true, verification: 'document', evidence: ['Quality Plan'] },
      { id: 'REQ-1210-02', description: 'Develop test strategy', mandatory: true, verification: 'document', evidence: ['Test Strategy'] },
      { id: 'REQ-1210-03', description: 'Execute test cycles', mandatory: true, verification: 'test', evidence: ['Test Results'] },
      { id: 'REQ-1210-04', description: 'Track and resolve defects', mandatory: true, verification: 'automated', evidence: ['Defect Log'] },
      { id: 'REQ-1210-05', description: 'Verify AI-IRB compliance in testing', mandatory: true, verification: 'review', evidence: ['Compliance Verification'] },
    ],
    checkpoints: [
      { id: 'CP-1210-01', name: 'Quality Plan Approval', trigger: 'phase-start', phase: 'qa', requirements: ['REQ-1210-01'], irbRequired: true, approvers: ['QA Manager', 'AI-IRB Liaison'] },
      { id: 'CP-1210-02', name: 'Test Completion', trigger: 'phase-end', phase: 'qa', requirements: ['REQ-1210-03', 'REQ-1210-04'], irbRequired: false, approvers: ['QA Manager'] },
    ],
    relatedSOPs: ['SOP-1200-01-AI', 'SOP-1220-01-AI', 'SOP-1301-01-AI'],
    tags: ['quality', 'testing', 'qa', 'defects', 'validation'],
    irbTypicallyRequired: true,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1220-01-AI',
    number: 1220,
    title: 'Deployment',
    description: 'AI system deployment procedures and production release.',
    category: SOPCategory.DEVELOPMENT,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1220-01-AI_Deployment.md`,
    scope: 'All AI system deployments to production.',
    requirements: [
      { id: 'REQ-1220-01', description: 'Complete deployment checklist', mandatory: true, verification: 'document', evidence: ['Deployment Checklist'] },
      { id: 'REQ-1220-02', description: 'Obtain production sign-off', mandatory: true, verification: 'document', evidence: ['Sign-off Record'] },
      { id: 'REQ-1220-03', description: 'Execute deployment with rollback capability', mandatory: true, verification: 'automated', evidence: ['Deployment Log'] },
      { id: 'REQ-1220-04', description: 'Verify post-deployment health', mandatory: true, verification: 'automated', evidence: ['Health Check Results'] },
    ],
    checkpoints: [
      { id: 'CP-1220-01', name: 'Deployment Approval', trigger: 'phase-start', phase: 'deployment', requirements: ['REQ-1220-01', 'REQ-1220-02'], irbRequired: true, approvers: ['Release Manager', 'AI-IRB Liaison'] },
      { id: 'CP-1220-02', name: 'Production Verification', trigger: 'phase-end', phase: 'deployment', requirements: ['REQ-1220-04'], irbRequired: false, approvers: ['Operations Lead'] },
    ],
    relatedSOPs: ['SOP-1005-01-AI', 'SOP-1210-01-AI', 'SOP-1013-01-AI'],
    tags: ['deployment', 'release', 'production', 'rollback'],
    irbTypicallyRequired: true,
    applicableTo: ['all'],
  },

  // ============================================
  // GOVERNANCE & SPECIALIZED CONTROLS (1300-2000)
  // ============================================
  {
    id: 'SOP-1300-01-AI',
    number: 1300,
    title: 'AI-IRB Governance and Oversight',
    description: 'Establishes AI-IRB governance structure and oversight responsibilities.',
    category: SOPCategory.GOVERNANCE,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1300-01-AI_AI-IRB-Governance-and-Oversight.md`,
    scope: 'AI-IRB committee structure and oversight processes.',
    requirements: [
      { id: 'REQ-1300-01', description: 'Establish AI-IRB committee', mandatory: true, verification: 'document', evidence: ['Committee Charter'] },
      { id: 'REQ-1300-02', description: 'Define IRB review criteria', mandatory: true, verification: 'document', evidence: ['Review Criteria'] },
      { id: 'REQ-1300-03', description: 'Conduct regular IRB meetings', mandatory: true, verification: 'document', evidence: ['Meeting Minutes'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1006-01-AI', 'SOP-1052-01-AI'],
    tags: ['irb', 'governance', 'oversight', 'committee', 'ethics'],
    irbTypicallyRequired: true,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1301-01-AI',
    number: 1301,
    title: 'AI Bias and Fairness Evaluation',
    description: 'Evaluates and mitigates bias in AI systems.',
    category: SOPCategory.GOVERNANCE,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1301-01-AI_AI-Bias-and-Fairness-Evaluation.md`,
    scope: 'All AI systems making decisions affecting individuals.',
    requirements: [
      { id: 'REQ-1301-01', description: 'Identify protected attributes', mandatory: true, verification: 'document', evidence: ['Attribute Analysis'] },
      { id: 'REQ-1301-02', description: 'Define fairness metrics', mandatory: true, verification: 'document', evidence: ['Metrics Definition'] },
      { id: 'REQ-1301-03', description: 'Execute bias testing', mandatory: true, verification: 'test', evidence: ['Bias Test Results'] },
      { id: 'REQ-1301-04', description: 'Implement bias mitigation', mandatory: true, verification: 'document', evidence: ['Mitigation Evidence'] },
      { id: 'REQ-1301-05', description: 'Monitor for bias post-deployment', mandatory: true, verification: 'automated', evidence: ['Monitoring Dashboard'] },
    ],
    checkpoints: [
      { id: 'CP-1301-01', name: 'Bias Plan Approval', trigger: 'phase-start', phase: 'validation', requirements: ['REQ-1301-01', 'REQ-1301-02'], irbRequired: true, approvers: ['AI-IRB Committee'] },
      { id: 'CP-1301-02', name: 'Bias Evaluation', trigger: 'phase-end', phase: 'validation', requirements: ['REQ-1301-03', 'REQ-1301-04'], irbRequired: true, approvers: ['AI-IRB Committee'] },
    ],
    relatedSOPs: ['SOP-1006-01-AI', 'SOP-1053-01-AI', 'SOP-1210-01-AI'],
    tags: ['bias', 'fairness', 'ethics', 'discrimination', 'evaluation'],
    irbTypicallyRequired: true,
    applicableTo: ['decision-systems', 'ml'],
  },
  {
    id: 'SOP-1302-01-AI',
    number: 1302,
    title: 'AI Explainability and Model Transparency',
    description: 'Ensures AI models meet transparency and explainability requirements.',
    category: SOPCategory.GOVERNANCE,
    priority: SOPPriority.HIGH,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1302-01-AI_AI-Explainability-and-Model-Transparency.md`,
    scope: 'AI models requiring explanation capabilities.',
    requirements: [
      { id: 'REQ-1302-01', description: 'Define explainability requirements', mandatory: true, verification: 'document', evidence: ['Requirements Document'] },
      { id: 'REQ-1302-02', description: 'Implement explanation mechanisms', mandatory: true, verification: 'test', evidence: ['Implementation Evidence'] },
      { id: 'REQ-1302-03', description: 'Document model decision factors', mandatory: true, verification: 'document', evidence: ['Factor Documentation'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1012-01-AI', 'SOP-1301-01-AI'],
    tags: ['explainability', 'transparency', 'xai', 'interpretability'],
    irbTypicallyRequired: true,
    applicableTo: ['decision-systems', 'regulated'],
  },
  {
    id: 'SOP-1303-01-AI',
    number: 1303,
    title: 'AI Data Protection and Privacy',
    description: 'Protects data privacy in AI systems.',
    category: SOPCategory.GOVERNANCE,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1303-01-AI_AI-Data-Protection-and-Privacy.md`,
    scope: 'AI systems processing personal or sensitive data.',
    requirements: [
      { id: 'REQ-1303-01', description: 'Conduct data protection impact assessment', mandatory: true, verification: 'document', evidence: ['DPIA Report'] },
      { id: 'REQ-1303-02', description: 'Implement data minimization', mandatory: true, verification: 'review', evidence: ['Data Inventory'] },
      { id: 'REQ-1303-03', description: 'Establish data retention limits', mandatory: true, verification: 'document', evidence: ['Retention Policy'] },
      { id: 'REQ-1303-04', description: 'Implement privacy controls', mandatory: true, verification: 'automated', evidence: ['Privacy Controls'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1050-01-AI', 'SOP-1014-01-AI'],
    tags: ['privacy', 'data-protection', 'gdpr', 'pii', 'security'],
    irbTypicallyRequired: true,
    applicableTo: ['pii', 'sensitive-data'],
  },
  {
    id: 'SOP-1304-01-AI',
    number: 1304,
    title: 'AI Validation and Monitoring',
    description: 'Validates and monitors AI system performance.',
    category: SOPCategory.GOVERNANCE,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1304-01-AI_AI-Validation-and-Monitoring.md`,
    scope: 'All AI systems requiring validation.',
    requirements: [
      { id: 'REQ-1304-01', description: 'Define validation criteria', mandatory: true, verification: 'document', evidence: ['Validation Criteria'] },
      { id: 'REQ-1304-02', description: 'Execute validation testing', mandatory: true, verification: 'test', evidence: ['Validation Results'] },
      { id: 'REQ-1304-03', description: 'Implement continuous monitoring', mandatory: true, verification: 'automated', evidence: ['Monitoring System'] },
      { id: 'REQ-1304-04', description: 'Define drift detection thresholds', mandatory: true, verification: 'document', evidence: ['Drift Thresholds'] },
    ],
    checkpoints: [
      { id: 'CP-1304-01', name: 'Validation Approval', trigger: 'phase-end', phase: 'validation', requirements: ['REQ-1304-01', 'REQ-1304-02'], irbRequired: true, approvers: ['QA Manager', 'AI-IRB Liaison'] },
    ],
    relatedSOPs: ['SOP-1009-01-AI', 'SOP-1013-01-AI', 'SOP-1210-01-AI'],
    tags: ['validation', 'monitoring', 'performance', 'drift'],
    irbTypicallyRequired: true,
    applicableTo: ['ml', 'production'],
  },
  {
    id: 'SOP-1305-01-AI',
    number: 1305,
    title: 'AI Ethical Risk and Impact Assessment',
    description: 'Assesses ethical risks and impacts of AI systems.',
    category: SOPCategory.GOVERNANCE,
    priority: SOPPriority.CRITICAL,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1305-01-AI_AI-Ethical-Risk-and-Impact-Assessment.md`,
    scope: 'All AI systems with potential ethical implications.',
    requirements: [
      { id: 'REQ-1305-01', description: 'Conduct ethical impact assessment', mandatory: true, verification: 'document', evidence: ['Impact Assessment'] },
      { id: 'REQ-1305-02', description: 'Identify stakeholder impacts', mandatory: true, verification: 'document', evidence: ['Stakeholder Analysis'] },
      { id: 'REQ-1305-03', description: 'Develop ethical risk register', mandatory: true, verification: 'document', evidence: ['Risk Register'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1006-01-AI', 'SOP-1053-01-AI', 'SOP-1014-01-AI'],
    tags: ['ethics', 'risk', 'impact', 'assessment', 'stakeholders'],
    irbTypicallyRequired: true,
    applicableTo: ['all'],
  },
  {
    id: 'SOP-1306-01-AI',
    number: 1306,
    title: 'AI End-of-Life and Sunset Process',
    description: 'Procedures for AI system end-of-life and sunset.',
    category: SOPCategory.GOVERNANCE,
    priority: SOPPriority.MEDIUM,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-1306-01-AI_AI-End-of-Life-and-Sunset-Process.md`,
    scope: 'AI systems being retired.',
    requirements: [
      { id: 'REQ-1306-01', description: 'Create sunset plan', mandatory: true, verification: 'document', evidence: ['Sunset Plan'] },
      { id: 'REQ-1306-02', description: 'Notify stakeholders', mandatory: true, verification: 'document', evidence: ['Notification Records'] },
      { id: 'REQ-1306-03', description: 'Archive system artifacts', mandatory: true, verification: 'document', evidence: ['Archive Records'] },
      { id: 'REQ-1306-04', description: 'Complete data disposition', mandatory: true, verification: 'document', evidence: ['Disposition Records'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1011-01-AI', 'SOP-1020-01-AI'],
    tags: ['sunset', 'end-of-life', 'retirement', 'archive'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },

  // ============================================
  // QUALITY RECORDS (2000+)
  // ============================================
  {
    id: 'SOP-2002-01-AI',
    number: 2002,
    title: 'Control of Quality Records',
    description: 'Controls quality records throughout their lifecycle.',
    category: SOPCategory.QUALITY,
    priority: SOPPriority.MEDIUM,
    version: '1.0',
    sourceUrl: `${SOP_SOURCE_BASE_URL}/SOP-2002-01-AI_Control-of-Quality-Records.md`,
    scope: 'All quality records in AI-SDLC projects.',
    requirements: [
      { id: 'REQ-2002-01', description: 'Define quality record types', mandatory: true, verification: 'document', evidence: ['Record Types'] },
      { id: 'REQ-2002-02', description: 'Establish record retention', mandatory: true, verification: 'document', evidence: ['Retention Schedule'] },
      { id: 'REQ-2002-03', description: 'Implement record security', mandatory: true, verification: 'automated', evidence: ['Security Controls'] },
    ],
    checkpoints: [],
    relatedSOPs: ['SOP-1001-01-AI', 'SOP-1210-01-AI'],
    tags: ['quality', 'records', 'retention', 'documentation'],
    irbTypicallyRequired: false,
    applicableTo: ['all'],
  },
];

/**
 * Get SOP by ID
 */
export function getSOPById(id: string): SOPDefinition | undefined {
  return SOP_REGISTRY.find(sop => sop.id === id);
}

/**
 * Get SOP by number
 */
export function getSOPByNumber(number: number): SOPDefinition | undefined {
  return SOP_REGISTRY.find(sop => sop.number === number);
}

/**
 * Get SOPs by category
 */
export function getSOPsByCategory(category: SOPCategory): SOPDefinition[] {
  return SOP_REGISTRY.filter(sop => sop.category === category);
}

/**
 * Get SOPs by priority
 */
export function getSOPsByPriority(priority: SOPPriority): SOPDefinition[] {
  return SOP_REGISTRY.filter(sop => sop.priority === priority);
}

/**
 * Get SOPs requiring IRB review
 */
export function getSOPsRequiringIRB(): SOPDefinition[] {
  return SOP_REGISTRY.filter(sop => sop.irbTypicallyRequired);
}

/**
 * Get SOPs applicable to project type
 */
export function getSOPsForProjectType(projectType: string): SOPDefinition[] {
  return SOP_REGISTRY.filter(
    sop => sop.applicableTo.includes('all') || sop.applicableTo.includes(projectType)
  );
}

/**
 * Search SOPs by keyword
 */
export function searchSOPs(keyword: string): SOPDefinition[] {
  const lower = keyword.toLowerCase();
  return SOP_REGISTRY.filter(
    sop =>
      sop.title.toLowerCase().includes(lower) ||
      sop.description.toLowerCase().includes(lower) ||
      sop.tags.some(tag => tag.includes(lower))
  );
}

/**
 * Get all SOPs
 */
export function getAllSOPs(): SOPDefinition[] {
  return [...SOP_REGISTRY];
}

/**
 * Get total SOP count
 */
export function getSOPCount(): number {
  return SOP_REGISTRY.length;
}

/**
 * Alias for getSOPCount for consistency
 */
export function getSopCount(): number {
  return SOP_REGISTRY.length;
}

/**
 * Get all categories with SOPs
 */
export function getCategories(): SOPCategory[] {
  const categories = new Set<SOPCategory>();
  for (const sop of SOP_REGISTRY) {
    categories.add(sop.category);
  }
  return Array.from(categories);
}

/**
 * Get SOP summary statistics
 */
export function getSOPStats(): {
  total: number;
  byCategory: Record<SOPCategory, number>;
  byPriority: Record<SOPPriority, number>;
  irbRequired: number;
} {
  const byCategory = {} as Record<SOPCategory, number>;
  const byPriority = {} as Record<SOPPriority, number>;
  let irbRequired = 0;

  for (const sop of SOP_REGISTRY) {
    byCategory[sop.category] = (byCategory[sop.category] || 0) + 1;
    byPriority[sop.priority] = (byPriority[sop.priority] || 0) + 1;
    if (sop.irbTypicallyRequired) irbRequired++;
  }

  return {
    total: SOP_REGISTRY.length,
    byCategory,
    byPriority,
    irbRequired,
  };
}
