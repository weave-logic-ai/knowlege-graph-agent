# SOP Reference

Complete technical reference for AI-SDLC Standard Operating Procedures implemented in the Knowledge Graph Agent.

---

## Overview

The Knowledge Graph Agent implements all 40 SOPs from the [AI-SDLC-SOPs](https://github.com/AISDLC/AI-SDLC-SOPs) framework. This reference provides detailed information about each SOP, its requirements, checkpoints, and integration points.

---

## Statistics

| Metric | Value |
|--------|-------|
| Total SOPs | 40 |
| Categories | 5 |
| IRB-Required SOPs | 18 |
| Total Requirements | 100+ |
| Total Checkpoints | 15 |

### Distribution by Category

| Category | Count | SOP Range |
|----------|-------|-----------|
| Program Management | 11 | 1000-1010 |
| Operations | 14 | 1011-1061 |
| Development | 4 | 1100-1220 |
| Governance | 7 | 1300-1306 |
| Quality | 1 | 2002 |

### Distribution by Priority

| Priority | Count | Weight |
|----------|-------|--------|
| CRITICAL | 14 | 4x |
| HIGH | 14 | 3x |
| MEDIUM | 9 | 2x |
| LOW | 3 | 1x |

---

## Type Definitions

### SOPDefinition

```typescript
interface SOPDefinition {
  id: string;                    // e.g., 'SOP-1000-01-AI'
  number: number;                // e.g., 1000
  title: string;                 // Human-readable title
  description: string;           // Detailed description
  category: SOPCategory;         // Category classification
  priority: SOPPriority;         // Priority level
  version: string;               // SOP version
  sourceUrl: string;             // Link to source document
  scope: string;                 // Applicability scope
  requirements: SOPRequirement[];// List of requirements
  checkpoints: SOPCheckpoint[];  // Review checkpoints
  relatedSOPs: string[];         // Related SOP IDs
  tags: string[];                // Searchable tags
  irbTypicallyRequired: boolean; // Needs IRB review
  applicableTo: string[];        // Project types
}
```

### SOPRequirement

```typescript
interface SOPRequirement {
  id: string;           // e.g., 'REQ-1000-01'
  description: string;  // Requirement description
  mandatory: boolean;   // Required vs recommended
  verification: 'document' | 'automated' | 'review' | 'test' | 'audit';
  evidence: string[];   // Expected evidence artifacts
}
```

### SOPCheckpoint

```typescript
interface SOPCheckpoint {
  id: string;           // e.g., 'CP-1000-01'
  name: string;         // Checkpoint name
  trigger: 'phase-start' | 'phase-end' | 'milestone' | 'scheduled';
  phase?: string;       // SDLC phase
  requirements: string[];// Required reqs before checkpoint
  irbRequired: boolean; // Needs IRB approval
  approvers: string[];  // Required approvers
}
```

### Enums

```typescript
enum SOPCategory {
  PROGRAM_MANAGEMENT = 'program-management',
  OPERATIONS = 'operations',
  DEVELOPMENT = 'development',
  GOVERNANCE = 'governance',
  QUALITY = 'quality',
}

enum SOPPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  PARTIAL = 'PARTIAL',
  NON_COMPLIANT = 'NON_COMPLIANT',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING = 'PENDING',
}
```

---

## Program Management SOPs (1000-1010)

### SOP-1000-01-AI: AI-Integrated Program and Project Management

**Priority**: CRITICAL | **IRB Required**: Yes

Establishes governance for AI program oversight, project initiation, and lifecycle management.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1000-01 | Define project charter with AI-specific scope | Yes | Document |
| REQ-1000-02 | Establish AI-IRB liaison assignment | Yes | Document |
| REQ-1000-03 | Create project plan with AI milestones | Yes | Document |

**Checkpoints**:
| ID | Name | Trigger | IRB Required |
|----|------|---------|--------------|
| CP-1000-01 | Project Initiation | phase-start | Yes |

**Related SOPs**: SOP-1001, SOP-1006, SOP-1054

---

### SOP-1001-01-AI: Document Governance and AI-IRB Compliance

**Priority**: HIGH | **IRB Required**: No

Controls document creation, review, approval, and retention for AI-SDLC projects.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1001-01 | Implement document version control | Yes | Automated |
| REQ-1001-02 | Establish document review workflow | Yes | Document |
| REQ-1001-03 | Define retention policies | Yes | Document |

**Related SOPs**: SOP-1000, SOP-2002

---

### SOP-1002-01-AI: Capacity Management

**Priority**: MEDIUM | **IRB Required**: No

Manages compute resources, HPC allocations, and infrastructure capacity for AI workloads.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1002-01 | Assess capacity requirements | Yes | Document |
| REQ-1002-02 | Monitor resource utilization | Yes | Automated |

**Applicable To**: ml-training, inference, hpc

---

### SOP-1003-01-AI: Configuration Management

**Priority**: CRITICAL | **IRB Required**: No

Controls versioning, change management, and configuration tracking for AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1003-01 | Use approved version control system | Yes | Automated |
| REQ-1003-02 | Implement change request process | Yes | Document |
| REQ-1003-03 | Maintain configuration baseline | Yes | Document |
| REQ-1003-04 | Document rollback procedures | Yes | Document |

**Checkpoints**:
| ID | Name | Trigger | IRB Required |
|----|------|---------|--------------|
| CP-1003-01 | Change Approval | milestone | No |

---

### SOP-1004-01-AI: Procurement and Purchasing for AI-Enabled Systems

**Priority**: MEDIUM | **IRB Required**: Yes

Governs acquisition of AI tools, services, and third-party components.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1004-01 | Conduct vendor AI capability assessment | Yes | Document |
| REQ-1004-02 | Review third-party AI ethical compliance | Yes | Review |

**Applicable To**: third-party-ai, vendor-integration

---

### SOP-1005-01-AI: AI-Integrated Release Planning

**Priority**: HIGH | **IRB Required**: No

Plans and coordinates AI system releases including model deployments.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1005-01 | Create release plan with AI validation gates | Yes | Document |
| REQ-1005-02 | Define rollback criteria | Yes | Document |

---

### SOP-1006-01-AI: AI-IRB Engagement and Ethical Review Procedure

**Priority**: CRITICAL | **IRB Required**: Yes

Defines AI-IRB engagement process and ethical review requirements.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1006-01 | Submit AI-IRB review request | Yes | Document |
| REQ-1006-02 | Complete ethical impact assessment | Yes | Document |
| REQ-1006-03 | Obtain IRB approval before deployment | Yes | Document |

**Checkpoints**:
| ID | Name | Trigger | IRB Required |
|----|------|---------|--------------|
| CP-1006-01 | IRB Initial Review | phase-start | Yes |
| CP-1006-02 | IRB Final Approval | phase-end | Yes |

**Related SOPs**: SOP-1300, SOP-1053, SOP-1305

---

### SOP-1007-01-AI: AI Asset Management

**Priority**: MEDIUM | **IRB Required**: No

Tracks and manages AI assets including models, datasets, and infrastructure.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1007-01 | Maintain AI asset registry | Yes | Document |
| REQ-1007-02 | Track asset ownership and responsibility | Yes | Document |

---

### SOP-1008-01-AI: AI Incident and Escalation Management

**Priority**: CRITICAL | **IRB Required**: Yes

Defines incident response and escalation procedures for AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1008-01 | Define incident classification criteria | Yes | Document |
| REQ-1008-02 | Establish escalation matrix | Yes | Document |
| REQ-1008-03 | Document incident response procedures | Yes | Document |

**Applicable To**: production

---

### SOP-1009-01-AI: AI Model Drift and Re-Validation Procedure

**Priority**: HIGH | **IRB Required**: No

Detects and addresses model drift requiring revalidation.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1009-01 | Establish drift detection thresholds | Yes | Document |
| REQ-1009-02 | Implement drift monitoring | Yes | Automated |
| REQ-1009-03 | Define revalidation triggers | Yes | Document |

**Applicable To**: production-ml

---

### SOP-1010-01-AI: AI-SDLC Site Monitoring and Incident Management

**Priority**: HIGH | **IRB Required**: No

Monitors AI system health and manages site-level incidents.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1010-01 | Implement real-time monitoring | Yes | Automated |
| REQ-1010-02 | Define alerting thresholds | Yes | Document |

**Applicable To**: production

---

## Operations SOPs (1011-1061)

### SOP-1011-01-AI: AI Feature Decommissioning and Model Retirement

**Priority**: MEDIUM | **IRB Required**: No

Procedures for retiring AI features and models from production.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1011-01 | Create decommissioning plan | Yes | Document |
| REQ-1011-02 | Notify stakeholders | Yes | Document |
| REQ-1011-03 | Archive model artifacts | Yes | Document |

---

### SOP-1012-01-AI: AI Model Explainability and Interpretability Procedure

**Priority**: HIGH | **IRB Required**: Yes

Ensures AI models meet explainability and interpretability standards.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1012-01 | Document model explanation methods | Yes | Document |
| REQ-1012-02 | Implement interpretability features | Yes | Test |

**Applicable To**: decision-systems, regulated

---

### SOP-1013-01-AI: AI Model Post-Production Monitoring and Ongoing Validation

**Priority**: CRITICAL | **IRB Required**: No

Continuous monitoring and validation of production AI models.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1013-01 | Implement continuous monitoring | Yes | Automated |
| REQ-1013-02 | Schedule periodic validation | Yes | Document |
| REQ-1013-03 | Track performance metrics | Yes | Automated |

**Checkpoints**:
| ID | Name | Trigger | IRB Required |
|----|------|---------|--------------|
| CP-1013-01 | Periodic Validation | scheduled | No |

**Applicable To**: production-ml

---

### SOP-1014-01-AI: Regulatory and Ethical AI Compliance Verification

**Priority**: CRITICAL | **IRB Required**: Yes

Verifies AI systems comply with regulatory and ethical requirements.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1014-01 | Identify applicable regulations | Yes | Document |
| REQ-1014-02 | Conduct compliance audit | Yes | Audit |
| REQ-1014-03 | Maintain compliance evidence | Yes | Document |

**Applicable To**: regulated, high-risk

---

### SOP-1015-01-AI: AI Knowledge Transfer and Handover Procedure

**Priority**: MEDIUM | **IRB Required**: No

Ensures proper knowledge transfer for AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1015-01 | Create knowledge transfer documentation | Yes | Document |
| REQ-1015-02 | Conduct handover sessions | Yes | Document |

---

### SOP-1020-01-AI: AI Model Lifecycle Management

**Priority**: CRITICAL | **IRB Required**: No

Governs AI model lifecycle from development through retirement.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1020-01 | Define lifecycle stages | Yes | Document |
| REQ-1020-02 | Track model versions | Yes | Automated |
| REQ-1020-03 | Document stage transitions | Yes | Document |

**Applicable To**: ml

---

### SOP-1030-01-AI: AI Ad-Hoc Reporting Procedure

**Priority**: LOW | **IRB Required**: No

Procedures for generating ad-hoc AI performance and compliance reports.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1030-01 | Define report request process | No | Document |

---

### SOP-1040-01-AI: Requirements Definition

**Priority**: CRITICAL | **IRB Required**: Yes

Establishes requirements gathering and documentation for AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1040-01 | Conduct stakeholder elicitation | Yes | Document |
| REQ-1040-02 | Document requirements with acceptance criteria | Yes | Document |
| REQ-1040-03 | Include fairness and bias requirements | Yes | Document |
| REQ-1040-04 | Obtain requirements sign-off | Yes | Document |

**Checkpoints**:
| ID | Name | Trigger | IRB Required |
|----|------|---------|--------------|
| CP-1040-01 | Requirements Approval | phase-end | Yes |

---

### SOP-1050-01-AI: AI Security Administration and Governance

**Priority**: CRITICAL | **IRB Required**: No

Establishes security governance for AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1050-01 | Define security policies for AI | Yes | Document |
| REQ-1050-02 | Implement access controls | Yes | Automated |

---

### SOP-1051-01-AI: AI Security Administration and Oversight

**Priority**: HIGH | **IRB Required**: No

Ongoing security oversight and monitoring for AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1051-01 | Conduct security monitoring | Yes | Automated |
| REQ-1051-02 | Perform security reviews | Yes | Review |

---

### SOP-1052-01-AI: AI Model Lifecycle Oversight and Governance

**Priority**: HIGH | **IRB Required**: Yes

Governance oversight for AI model lifecycle management.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1052-01 | Establish lifecycle governance board | Yes | Document |
| REQ-1052-02 | Define stage gate criteria | Yes | Document |

**Applicable To**: ml

---

### SOP-1053-01-AI: Ethical Risk Assessment and Mitigation

**Priority**: CRITICAL | **IRB Required**: Yes

Assesses and mitigates ethical risks in AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1053-01 | Conduct ethical risk assessment | Yes | Document |
| REQ-1053-02 | Develop mitigation strategies | Yes | Document |
| REQ-1053-03 | Monitor ethical risks ongoing | Yes | Document |

---

### SOP-1054-01-AI: AI-Regulated Project Approvals and Sponsorship

**Priority**: HIGH | **IRB Required**: Yes

Approval process for AI projects in regulated environments.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1054-01 | Obtain sponsor approval | Yes | Document |
| REQ-1054-02 | Complete regulatory impact assessment | Yes | Document |

**Applicable To**: regulated

---

### SOP-1055-01-AI: Computer System Controls

**Priority**: HIGH | **IRB Required**: No

Technical controls for AI system security and integrity.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1055-01 | Implement system hardening | Yes | Automated |
| REQ-1055-02 | Maintain audit logs | Yes | Automated |

---

### SOP-1060-01-AI: Service Level Agreement

**Priority**: MEDIUM | **IRB Required**: No

Defines SLAs for AI system performance and availability.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1060-01 | Define SLA metrics | Yes | Document |
| REQ-1060-02 | Establish monitoring for SLA compliance | Yes | Automated |

**Applicable To**: production

---

### SOP-1061-01-AI: Incident Tracking

**Priority**: HIGH | **IRB Required**: No

Tracking and management of AI-related incidents.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1061-01 | Log all incidents in tracking system | Yes | Automated |
| REQ-1061-02 | Track incident resolution | Yes | Automated |

**Applicable To**: production

---

## Development SOPs (1100-1220)

### SOP-1100-01-AI: Documentation of Training

**Priority**: MEDIUM | **IRB Required**: No

Records training activities for AI system operators and developers.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1100-01 | Maintain training records | Yes | Document |
| REQ-1100-02 | Track certification status | Yes | Document |

---

### SOP-1101-01-AI: Training and Documentation

**Priority**: MEDIUM | **IRB Required**: No

Training program development and delivery for AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1101-01 | Develop training curriculum | Yes | Document |
| REQ-1101-02 | Deliver training sessions | Yes | Document |

---

### SOP-1200-01-AI: Development

**Priority**: CRITICAL | **IRB Required**: Yes

AI system development lifecycle procedures including coding, review, and integration.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1200-01 | Follow approved technical design | Yes | Review |
| REQ-1200-02 | Execute unit tests with documentation | Yes | Test |
| REQ-1200-03 | Conduct peer code reviews | Yes | Review |
| REQ-1200-04 | Complete integration testing | Yes | Test |
| REQ-1200-05 | Notify AI-IRB of AI functionality changes | Yes | Document |

**Checkpoints**:
| ID | Name | Trigger | IRB Required |
|----|------|---------|--------------|
| CP-1200-01 | Development Start | phase-start | No |
| CP-1200-02 | QA Handover | phase-end | Yes |

---

### SOP-1210-01-AI: Quality Function

**Priority**: CRITICAL | **IRB Required**: Yes

Quality assurance processes for AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1210-01 | Create quality plan | Yes | Document |
| REQ-1210-02 | Develop test strategy | Yes | Document |
| REQ-1210-03 | Execute test cycles | Yes | Test |
| REQ-1210-04 | Track and resolve defects | Yes | Automated |
| REQ-1210-05 | Verify AI-IRB compliance in testing | Yes | Review |

**Checkpoints**:
| ID | Name | Trigger | IRB Required |
|----|------|---------|--------------|
| CP-1210-01 | Quality Plan Approval | phase-start | Yes |
| CP-1210-02 | Test Completion | phase-end | No |

---

### SOP-1220-01-AI: Deployment

**Priority**: CRITICAL | **IRB Required**: Yes

AI system deployment procedures and production release.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1220-01 | Complete deployment checklist | Yes | Document |
| REQ-1220-02 | Obtain production sign-off | Yes | Document |
| REQ-1220-03 | Execute deployment with rollback capability | Yes | Automated |
| REQ-1220-04 | Verify post-deployment health | Yes | Automated |

**Checkpoints**:
| ID | Name | Trigger | IRB Required |
|----|------|---------|--------------|
| CP-1220-01 | Deployment Approval | phase-start | Yes |
| CP-1220-02 | Production Verification | phase-end | No |

---

## Governance SOPs (1300-1306)

### SOP-1300-01-AI: AI-IRB Governance and Oversight

**Priority**: CRITICAL | **IRB Required**: Yes

Establishes AI-IRB governance structure and oversight responsibilities.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1300-01 | Establish AI-IRB committee | Yes | Document |
| REQ-1300-02 | Define IRB review criteria | Yes | Document |
| REQ-1300-03 | Conduct regular IRB meetings | Yes | Document |

---

### SOP-1301-01-AI: AI Bias and Fairness Evaluation

**Priority**: CRITICAL | **IRB Required**: Yes

Evaluates and mitigates bias in AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1301-01 | Identify protected attributes | Yes | Document |
| REQ-1301-02 | Define fairness metrics | Yes | Document |
| REQ-1301-03 | Execute bias testing | Yes | Test |
| REQ-1301-04 | Implement bias mitigation | Yes | Document |
| REQ-1301-05 | Monitor for bias post-deployment | Yes | Automated |

**Checkpoints**:
| ID | Name | Trigger | IRB Required |
|----|------|---------|--------------|
| CP-1301-01 | Bias Plan Approval | phase-start | Yes |
| CP-1301-02 | Bias Evaluation | phase-end | Yes |

**Applicable To**: decision-systems, ml

---

### SOP-1302-01-AI: AI Explainability and Model Transparency

**Priority**: HIGH | **IRB Required**: Yes

Ensures AI models meet transparency and explainability requirements.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1302-01 | Define explainability requirements | Yes | Document |
| REQ-1302-02 | Implement explanation mechanisms | Yes | Test |
| REQ-1302-03 | Document model decision factors | Yes | Document |

**Applicable To**: decision-systems, regulated

---

### SOP-1303-01-AI: AI Data Protection and Privacy

**Priority**: CRITICAL | **IRB Required**: Yes

Protects data privacy in AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1303-01 | Conduct data protection impact assessment | Yes | Document |
| REQ-1303-02 | Implement data minimization | Yes | Review |
| REQ-1303-03 | Establish data retention limits | Yes | Document |
| REQ-1303-04 | Implement privacy controls | Yes | Automated |

**Applicable To**: pii, sensitive-data

---

### SOP-1304-01-AI: AI Validation and Monitoring

**Priority**: CRITICAL | **IRB Required**: Yes

Validates and monitors AI system performance.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1304-01 | Define validation criteria | Yes | Document |
| REQ-1304-02 | Execute validation testing | Yes | Test |
| REQ-1304-03 | Implement continuous monitoring | Yes | Automated |
| REQ-1304-04 | Define drift detection thresholds | Yes | Document |

**Checkpoints**:
| ID | Name | Trigger | IRB Required |
|----|------|---------|--------------|
| CP-1304-01 | Validation Approval | phase-end | Yes |

**Applicable To**: ml, production

---

### SOP-1305-01-AI: AI Ethical Risk and Impact Assessment

**Priority**: CRITICAL | **IRB Required**: Yes

Assesses ethical risks and impacts of AI systems.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1305-01 | Conduct ethical impact assessment | Yes | Document |
| REQ-1305-02 | Identify stakeholder impacts | Yes | Document |
| REQ-1305-03 | Develop ethical risk register | Yes | Document |

---

### SOP-1306-01-AI: AI End-of-Life and Sunset Process

**Priority**: MEDIUM | **IRB Required**: No

Procedures for AI system end-of-life and sunset.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-1306-01 | Create sunset plan | Yes | Document |
| REQ-1306-02 | Notify stakeholders | Yes | Document |
| REQ-1306-03 | Archive system artifacts | Yes | Document |
| REQ-1306-04 | Complete data disposition | Yes | Document |

---

## Quality SOPs (2000+)

### SOP-2002-01-AI: Control of Quality Records

**Priority**: MEDIUM | **IRB Required**: No

Controls quality records throughout their lifecycle.

**Requirements**:
| ID | Description | Mandatory | Verification |
|----|-------------|-----------|--------------|
| REQ-2002-01 | Define quality record types | Yes | Document |
| REQ-2002-02 | Establish record retention | Yes | Document |
| REQ-2002-03 | Implement record security | Yes | Automated |

---

## API Reference

### Registry Functions

```typescript
// Get all SOPs
function getAllSOPs(): SOPDefinition[];

// Get SOP by ID
function getSOPById(id: string): SOPDefinition | undefined;

// Get SOP by number
function getSOPByNumber(number: number): SOPDefinition | undefined;

// Get SOPs by category
function getSOPsByCategory(category: SOPCategory): SOPDefinition[];

// Get SOPs by priority
function getSOPsByPriority(priority: SOPPriority): SOPDefinition[];

// Get SOPs requiring IRB
function getSOPsRequiringIRB(): SOPDefinition[];

// Get SOPs for project type
function getSOPsForProjectType(projectType: string): SOPDefinition[];

// Search SOPs by keyword
function searchSOPs(keyword: string): SOPDefinition[];

// Get categories
function getCategories(): SOPCategory[];

// Get SOP count
function getSOPCount(): number;

// Get statistics
function getSOPStats(): {
  total: number;
  byCategory: Record<SOPCategory, number>;
  byPriority: Record<SOPPriority, number>;
  irbRequired: number;
};
```

### Compliance Functions

```typescript
// Check compliance
function checkCompliance(options: {
  projectRoot: string;
  docsPath?: string;
  sopIds?: string[];
  categories?: SOPCategory[];
  deepAnalysis?: boolean;
  assessor?: string;
}): Promise<ComplianceCheckResult>;

// Analyze gaps
function analyzeGaps(
  checkResult: ComplianceCheckResult,
  options?: {
    minPriority?: SOPPriority;
    categories?: SOPCategory[];
    generateRemediation?: boolean;
  }
): GapAnalysisResult;

// Check minimum compliance
function meetsMinimumCompliance(
  projectRoot: string,
  threshold?: number
): Promise<{ meets: boolean; score: number; gaps: string[] }>;
```

### Graph Functions

```typescript
// Create multi-layer graph
function createMultiLayerGraph(options?: {
  graphId?: string;
  graphName?: string;
  includeAllSOPs?: boolean;
  categories?: SOPCategory[];
}): MultiLayerGraph;

// Add compliance overlay
function addComplianceOverlay(
  graph: MultiLayerGraph,
  checkResult: ComplianceCheckResult,
  gapResult: GapAnalysisResult
): void;

// Get compliance summary
function getComplianceSummary(graph: MultiLayerGraph): {
  compliant: number;
  partial: number;
  nonCompliant: number;
  pending: number;
};

// Export for visualization
function exportToVisualizationFormat(graph: MultiLayerGraph): object;
```

---

## Related Documentation

- [SOP Governance Guide](../guides/sop-governance.md) - How to use SOP features
- [CLI Commands Reference](./cli/commands.md) - All CLI commands
- [Architecture](../ARCHITECTURE.md) - System architecture
- [AI-SDLC SOPs Source](https://github.com/AISDLC/AI-SDLC-SOPs) - Original SOP repository
