# SOP Governance Guide

The Knowledge Graph Agent implements comprehensive AI-SDLC Standard Operating Procedures (SOPs) governance based on the [AI-SDLC-SOPs](https://github.com/AISDLC/AI-SDLC-SOPs) framework. This guide explains how to use the SOP compliance system to enforce governance in your projects.

## Overview

The SOP system provides:

1. **Complete SOP Registry** - All 40 AI-SDLC SOPs with requirements and checkpoints
2. **Automated Compliance Checking** - Scan projects for compliance evidence
3. **Gap Analysis** - Identify gaps with remediation recommendations
4. **AI-IRB Integration** - Track Institutional Review Board requirements
5. **Multi-layer Graph Overlays** - Visualize compliance on knowledge graphs

## SOP Categories

| Category | SOP Range | Focus Area |
|----------|-----------|------------|
| **Program Management** | 1000-1010 | Project governance, IRB engagement, asset management |
| **Operations** | 1011-1060 | Lifecycle, security, monitoring, compliance |
| **Development** | 1100-1220 | Training, development, quality, deployment |
| **Governance** | 1300-2000 | Ethics, bias, privacy, validation |
| **Quality** | 2000+ | Quality records and controls |

## Quick Start

### Initialize SOP Standards Layer

```bash
# Initialize SOP standards in your project
kg sop init

# Initialize with specific categories
kg sop init --categories program-management,governance

# Verbose output
kg sop init --verbose
```

This creates:
- `docs/sop/standards-graph.json` - Standards layer graph
- `docs/sop/SOP-INDEX.md` - SOP reference index

### Check Compliance

```bash
# Basic compliance check
kg sop check

# Deep analysis (scans file contents)
kg sop check --deep

# Check specific SOP
kg sop check --sop SOP-1006-01-AI

# Check category
kg sop check --category governance

# Set compliance threshold
kg sop check --threshold 70

# JSON output for automation
kg sop check --json
```

### Analyze Gaps

```bash
# Basic gap analysis
kg sop gaps

# Include remediation roadmap
kg sop gaps --roadmap

# Filter by priority
kg sop gaps --priority critical

# Filter by category
kg sop gaps --category development

# Verbose with all gaps
kg sop gaps --verbose
```

### Generate Reports

```bash
# Markdown report (default)
kg sop report

# JSON report
kg sop report --format json

# HTML report
kg sop report --format html

# Include evidence and roadmap
kg sop report --include-evidence --include-roadmap

# Custom output path
kg sop report --output ./compliance-report.md
```

### List Available SOPs

```bash
# List all SOPs
kg sop list

# Filter by category
kg sop list --category governance

# Show only IRB-required SOPs
kg sop list --irb

# JSON output
kg sop list --json
```

## Understanding Compliance Scoring

### Score Calculation

Compliance scores are weighted by SOP priority:

| Priority | Weight | Description |
|----------|--------|-------------|
| CRITICAL | 4x | Must-have for production systems |
| HIGH | 3x | Important for compliance |
| MEDIUM | 2x | Recommended best practices |
| LOW | 1x | Nice-to-have improvements |

### Compliance Statuses

| Status | Score Range | Meaning |
|--------|-------------|---------|
| `COMPLIANT` | 80-100% | Fully meets requirements |
| `PARTIAL` | 40-79% | Some requirements met |
| `NON_COMPLIANT` | 0-39% | Requirements not met |
| `NOT_APPLICABLE` | N/A | SOP doesn't apply to project |
| `PENDING` | N/A | Assessment not yet completed |

### Evidence Detection

The compliance checker scans for evidence artifacts:

```typescript
// Artifact patterns detected automatically
const artifactPatterns = {
  // Testing evidence
  tests: ['**/*.test.ts', '**/*.spec.ts', '**/test/**'],

  // CI/CD evidence
  cicd: ['.github/workflows/**', 'Jenkinsfile', '.gitlab-ci.yml'],

  // Security evidence
  security: ['SECURITY.md', '**/security/**', 'security-*.md'],

  // Ethics evidence
  ethics: ['ethics-*.md', '**/ethics/**', 'bias-*.md'],

  // Data governance
  dataGovernance: ['data-catalog.md', '**/data/**', 'privacy-*.md'],

  // Documentation
  documentation: ['README.md', 'docs/**/*.md', 'CONTRIBUTING.md'],
};
```

## Working with AI-IRB Requirements

### What is AI-IRB?

AI-IRB (AI Institutional Review Board) provides ethical oversight for AI systems, similar to human subjects research IRBs. SOPs marked with `irbTypicallyRequired: true` need IRB review before deployment.

### Identifying IRB-Required SOPs

```bash
# List SOPs requiring IRB review
kg sop list --irb
```

Key IRB-required SOPs include:

- **SOP-1006**: AI-IRB Engagement and Ethical Review Procedure
- **SOP-1301**: AI Bias and Fairness Evaluation
- **SOP-1303**: AI Data Protection and Privacy
- **SOP-1305**: AI Ethical Risk and Impact Assessment

### IRB Checkpoints

SOPs define checkpoints requiring IRB approval:

```typescript
// Example checkpoint structure
{
  id: 'CP-1006-01',
  name: 'IRB Initial Review',
  trigger: 'phase-start',
  phase: 'initiation',
  irbRequired: true,
  approvers: ['AI-IRB Committee']
}
```

## Gap Analysis and Remediation

### Understanding Gap Priorities

```
🔴 CRITICAL - Immediate action required
   - Security vulnerabilities
   - Compliance violations
   - Ethical concerns

🟠 HIGH - Address in current sprint
   - Missing required documentation
   - Incomplete testing
   - IRB requirements

🟡 MEDIUM - Address in next sprint
   - Best practice deviations
   - Process improvements
   - Enhanced monitoring

🟢 LOW - Backlog items
   - Nice-to-have improvements
   - Optimization opportunities
```

### Remediation Roadmap

The roadmap organizes gaps into phases:

```bash
kg sop gaps --roadmap
```

**Phase 1: Foundation**
- Critical compliance gaps
- Security fundamentals
- Documentation basics

**Phase 2: Core Processes**
- Development procedures
- Testing coverage
- Change management

**Phase 3: Advanced Controls**
- Monitoring and observability
- Incident response
- Continuous improvement

### Quick Wins

The gap analyzer identifies high-impact, low-effort improvements:

```bash
kg sop gaps --verbose
```

Look for gaps marked as "Quick Wins" - these provide maximum compliance improvement with minimal effort.

## Programmatic Usage

### Checking Compliance

```typescript
import { checkCompliance } from '@weavelogic/knowledge-graph-agent';

const result = await checkCompliance({
  projectRoot: '/path/to/project',
  docsPath: 'docs',
  deepAnalysis: true,
  assessor: 'automated-pipeline',
});

console.log(`Overall Score: ${result.overallScore}%`);
console.log(`Compliant: ${result.assessments.filter(a =>
  a.status === 'COMPLIANT').length}`);
```

### Analyzing Gaps

```typescript
import { checkCompliance, analyzeGaps } from '@weavelogic/knowledge-graph-agent';

const checkResult = await checkCompliance({ projectRoot: '.' });
const gapResult = analyzeGaps(checkResult, {
  minPriority: 'high',
  generateRemediation: true,
});

console.log(`Total Gaps: ${gapResult.totalGaps}`);
console.log(`Critical: ${gapResult.criticalGaps.length}`);

// Access remediation roadmap
for (const phase of gapResult.roadmap.phases) {
  console.log(`Phase ${phase.phase}: ${phase.name}`);
}
```

### Working with the SOP Registry

```typescript
import {
  getAllSOPs,
  getSOPsByCategory,
  getSOPById,
  getSOPsRequiringIRB,
  searchSOPs,
  getSOPStats,
  SOPCategory,
} from '@weavelogic/knowledge-graph-agent';

// Get all SOPs
const allSOPs = getAllSOPs();

// Get by category
const governanceSOPs = getSOPsByCategory(SOPCategory.GOVERNANCE);

// Get specific SOP
const biasEvalSOP = getSOPById('SOP-1301-01-AI');

// Get IRB-required SOPs
const irbSOPs = getSOPsRequiringIRB();

// Search by keyword
const securitySOPs = searchSOPs('security');

// Get statistics
const stats = getSOPStats();
console.log(`Total SOPs: ${stats.total}`);
console.log(`IRB Required: ${stats.irbRequired}`);
```

### Creating Compliance Overlays

```typescript
import {
  createMultiLayerGraph,
  addComplianceOverlay,
  getComplianceSummary,
} from '@weavelogic/knowledge-graph-agent';

// Create multi-layer graph
const graph = createMultiLayerGraph({
  graphId: 'compliance-graph',
  graphName: 'Project Compliance',
  includeAllSOPs: true,
});

// Add compliance overlay from check results
const checkResult = await checkCompliance({ projectRoot: '.' });
const gapResult = analyzeGaps(checkResult);
addComplianceOverlay(graph, checkResult, gapResult);

// Get summary
const summary = getComplianceSummary(graph);
console.log(`Compliant: ${summary.compliant}`);
console.log(`Partial: ${summary.partial}`);
console.log(`Non-Compliant: ${summary.nonCompliant}`);
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: SOP Compliance Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Check SOP Compliance
        run: |
          npx kg sop check --threshold 60 --json > compliance.json

      - name: Upload Compliance Report
        uses: actions/upload-artifact@v4
        with:
          name: compliance-report
          path: compliance.json

      - name: Fail if below threshold
        run: |
          SCORE=$(jq '.overallScore' compliance.json)
          if [ "$SCORE" -lt 60 ]; then
            echo "Compliance score $SCORE is below threshold 60"
            exit 1
          fi
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check critical compliance before commit
RESULT=$(kg sop check --category governance --threshold 70 --json 2>/dev/null)
SCORE=$(echo $RESULT | jq -r '.overallScore')

if [ "$SCORE" -lt 70 ]; then
  echo "❌ Governance compliance score ($SCORE%) is below threshold (70%)"
  echo "Run 'kg sop gaps --category governance' for details"
  exit 1
fi

echo "✅ Governance compliance: $SCORE%"
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KG_SOP_ENABLED` | Enable SOP compliance features | `true` |
| `KG_SOP_THRESHOLD` | Default compliance threshold | `50` |
| `KG_SOP_DEEP_ANALYSIS` | Enable deep file analysis | `false` |
| `KG_IRB_REQUIRED` | Require IRB approval for deployment | `false` |

### Configuration File

```yaml
# kg.config.yaml
sop:
  enabled: true
  threshold: 60
  deepAnalysis: true
  categories:
    - program-management
    - governance
    - development
  irbRequired: true
  reporting:
    format: md
    includeEvidence: true
    includeRoadmap: true
```

## Best Practices

### 1. Start with Critical SOPs

Focus on CRITICAL priority SOPs first:
- SOP-1000: Program Management
- SOP-1003: Configuration Management
- SOP-1006: AI-IRB Engagement
- SOP-1050: Security Governance
- SOP-1200: Development
- SOP-1301: Bias Evaluation

### 2. Implement Continuous Compliance

```bash
# Add to CI pipeline
kg sop check --threshold 60

# Regular gap analysis
kg sop gaps --roadmap --output ./docs/sop/gaps.md
```

### 3. Document Evidence

Create evidence artifacts that the checker can detect:

```
docs/
├── sop/
│   ├── SOP-INDEX.md
│   ├── COMPLIANCE-REPORT.md
│   └── standards-graph.json
├── security/
│   ├── SECURITY.md
│   └── threat-model.md
├── ethics/
│   ├── bias-evaluation.md
│   └── irb-approval.md
└── data/
    ├── data-catalog.md
    └── privacy-policy.md
```

### 4. Track IRB Requirements

For AI systems requiring ethical review:

1. Run `kg sop list --irb` to identify required reviews
2. Document IRB submissions and approvals
3. Store evidence in `docs/ethics/` or `docs/irb/`
4. Update checkpoint status as approvals are received

### 5. Regular Compliance Reviews

Schedule periodic compliance reviews:

```bash
# Weekly quick check
kg sop check --category governance

# Monthly full report
kg sop report --include-evidence --include-roadmap

# Quarterly gap analysis
kg sop gaps --roadmap --verbose > quarterly-gaps.md
```

## Troubleshooting

### Low Compliance Scores

**Problem**: Score below threshold despite having artifacts

**Solutions**:
1. Use `--deep` flag for content analysis
2. Check artifact naming conventions match patterns
3. Verify artifacts are in expected locations
4. Run `kg sop check --verbose` for detailed breakdown

### Missing Evidence Detection

**Problem**: Evidence not being detected

**Solutions**:
1. Check file paths match artifact patterns
2. Ensure files contain compliance-related keywords
3. Use standard naming conventions (SECURITY.md, ethics-*.md)
4. Place artifacts in standard directories (docs/, security/, etc.)

### IRB Checkpoint Failures

**Problem**: IRB checkpoints blocking progress

**Solutions**:
1. Document IRB waiver if applicable
2. Mark SOPs as NOT_APPLICABLE if project type doesn't require IRB
3. Store IRB approval evidence in project
4. Contact IRB liaison for expedited review

## Related Documentation

- [SOP Reference](../reference/sops.md) - Complete SOP technical reference
- [CLI Commands Reference](../reference/cli/commands.md) - All CLI commands
- [Knowledge Graph Guide](./knowledge-graph.md) - Working with graphs
- [Agents Guide](./agents.md) - Multi-agent coordination
