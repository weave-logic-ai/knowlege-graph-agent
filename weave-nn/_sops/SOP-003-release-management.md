---
sop_id: SOP-003
sop_name: Release Management Workflow
category: operations
version: 1.0.0
status: active
triggers:
  - weaver sop release <version>
  - weaver release prepare <version>
learning_enabled: true
estimated_duration: 45-60 minutes
complexity: medium
type: sop
visual:
  icon: 📝
  color: '#84CC16'
  cssclasses:
    - type-sop
    - status-active
updated_date: '2025-10-28'
icon: 📝
---

# SOP-003: Release Management Workflow

## Overview

The Release Management Workflow orchestrates the complete process of preparing, validating, and deploying a software release to production. This SOP coordinates multiple validation agents working in parallel to ensure code quality, test coverage, documentation completeness, and deployment readiness before any production release.

This workflow eliminates manual release checklists by automating validation, changelog generation, git tagging, and deployment coordination. It ensures consistent release quality through multi-agent validation and captures learning data to continuously improve release processes.

By following this SOP, teams achieve predictable release cadence, reduced deployment incidents, and comprehensive release documentation that satisfies both technical and business stakeholders.

## Prerequisites

- Weaver CLI with git integration configured
- All features merged to release branch
- CI/CD pipeline passing
- Production deployment access configured
- Changelog template available

## Inputs

### Required
- **Version Number**: Semantic version (e.g., "2.5.0", "1.0.0-beta.3")
- **Release Type**: major | minor | patch | hotfix
- **Release Branch**: Branch to release from (default: main/master)
- **Target Environment**: staging | production

### Optional
- **Release Notes**: Additional context or highlights
- **Breaking Changes**: List of breaking changes
- **Migration Steps**: Required migration or upgrade steps
- **Deployment Window**: Scheduled deployment time
- **Rollback Plan**: Specific rollback procedures

## Agent Coordination

This SOP spawns **5 specialized agents** in parallel for comprehensive validation:

### 1. Coder Agent
**Role**: Finalize code changes and prepare release artifacts
- Review pending code changes
- Update version numbers in package files
- Generate build artifacts
- Verify dependency versions
- Update copyright years and metadata

### 2. Tester Agent
**Role**: Execute comprehensive test validation
- Run full test suite (unit, integration, e2e)
- Verify code coverage thresholds
- Execute smoke tests
- Validate critical user flows
- Check for test regressions

### 3. Reviewer Agent
**Role**: Quality assurance and compliance checks
- Review code quality metrics
- Check linting and formatting
- Validate security scan results
- Verify license compliance
- Review breaking changes impact

### 4. Documenter Agent
**Role**: Documentation and changelog preparation
- Generate changelog from git commits
- Update API documentation
- Verify README accuracy
- Check migration guides
- Update version badges

### 5. Deployment Coordinator Agent
**Role**: Deployment readiness and orchestration
- Validate deployment scripts
- Check infrastructure readiness
- Prepare rollback procedures
- Coordinate deployment timing
- Set up monitoring alerts

## MCP Tools Used

### GitHub Release Coordination
```typescript
mcp__claude-flow__github_release_coord({
  repo: "organization/project",
  version: "2.5.0"
})
```
**Purpose**: Coordinate GitHub release creation with automated changelog and asset uploads.

### Workflow Execution
```typescript
mcp__claude-flow__workflow_execute({
  workflowId: "release-validation",
  params: {
    version: "2.5.0",
    branch: "main",
    environment: "production"
  }
})
```
**Purpose**: Execute pre-defined release validation workflow with all checks.

### Quality Assessment
```typescript
mcp__claude-flow__quality_assess({
  target: "release-2.5.0",
  criteria: [
    "test_coverage",
    "code_quality",
    "security",
    "documentation"
  ]
})
```
**Purpose**: Automated quality gate validation before release approval.

### Performance Benchmarking
```typescript
mcp__claude-flow__benchmark_run({
  suite: "release",
  iterations: 10
})
```
**Purpose**: Run performance benchmarks to ensure no regressions.

## Weaver Integration

### Git Workflow Automation
```bash
# Weaver handles complete git workflow
weaver git release prepare 2.5.0

# Internally executes:
# 1. Create release branch: release/2.5.0
# 2. Update version files
# 3. Generate changelog
# 4. Commit changes
# 5. Create git tag: v2.5.0
# 6. Push to remote
```

### Changelog Generation
Weaver analyzes git commits since last release:

```bash
# Automatic commit categorization
weaver changelog generate --since v2.4.0

# Generates:
## Features
- feat(auth): Add OAuth2 support (#123)
- feat(api): GraphQL mutations (#145)

## Bug Fixes
- fix(ui): Dropdown accessibility (#134)
- fix(db): Connection pool leak (#156)

## Breaking Changes
- refactor(api): Remove deprecated endpoints (#167)
```

### Deployment Integration
```bash
# Weaver coordinates deployment
weaver deploy production --version 2.5.0

# Executes deployment workflow:
# 1. Build production artifacts
# 2. Run smoke tests
# 3. Deploy to staging
# 4. Run staging validation
# 5. Deploy to production
# 6. Monitor deployment
```

## Execution Steps

### Step 1: Initialize Release Process
```bash
# User initiates release
weaver sop release 2.5.0 --type minor

# Weaver setup
npx claude-flow hooks pre-task --description "Release 2.5.0 preparation"
npx claude-flow hooks session-restore --session-id "swarm-release-2.5.0"
```

### Step 2: Parallel Validation (All Agents)

```typescript
// Spawn all validation agents in parallel
Task("Coder", `
  Finalize code changes for release 2.5.0.

  Tasks:
  1. Update version in package.json, Cargo.toml, etc.
  2. Update copyright years in LICENSE files
  3. Verify no uncommitted changes
  4. Check dependency versions for vulnerabilities
  5. Generate production build artifacts
  6. Verify build succeeds without warnings

  Commands:
  npm version 2.5.0 --no-git-tag-version
  npm run build -- --production
  npm audit --production

  Output to memory:
  key: "swarm/coder/release-prep"
  value: {
    versionUpdated: true,
    buildSuccess: true,
    vulnerabilities: 0,
    artifacts: ["dist/bundle.js", "dist/bundle.css"]
  }

  Hooks:
  npx claude-flow hooks post-edit --file "package.json"
`, "coder")

Task("Tester", `
  Execute comprehensive test validation for release 2.5.0.

  Tasks:
  1. Run full test suite: npm test
  2. Verify coverage > 80%: npm run test:coverage
  3. Run e2e tests: npm run test:e2e
  4. Execute smoke tests: npm run test:smoke
  5. Performance regression tests: npm run test:perf
  6. Check for flaky tests

  Validation:
  - All tests must pass
  - Coverage >= 80%
  - No new test skips
  - E2E critical flows pass
  - Performance within 5% baseline

  Output to memory:
  key: "swarm/tester/validation"
  value: {
    totalTests: 1247,
    passed: 1247,
    failed: 0,
    coverage: 84.5,
    e2eStatus: "passed",
    performanceRegression: false
  }

  Hooks:
  npx claude-flow hooks post-task --task-id "test-validation"
`, "tester")

Task("Reviewer", `
  Quality assurance and compliance validation for release 2.5.0.

  Tasks:
  1. Run linting: npm run lint
  2. Check code formatting: npm run format:check
  3. Security scan: npm audit, npm run security:check
  4. License compliance: npm run license:check
  5. Review breaking changes impact
  6. Check code quality metrics

  Use MCP tools:
  mcp__claude-flow__quality_assess({
    target: "release-2.5.0",
    criteria: ["code_quality", "security", "documentation"]
  })

  Validation:
  - No linting errors
  - Code formatted consistently
  - No high/critical security issues
  - All licenses compatible
  - Breaking changes documented

  Output to memory:
  key: "swarm/reviewer/qa"
  value: {
    lintErrors: 0,
    securityIssues: 0,
    licenseIssues: 0,
    breakingChanges: 2,
    qualityScore: 92
  }
`, "reviewer")

Task("Documenter", `
  Documentation and changelog preparation for release 2.5.0.

  Tasks:
  1. Generate changelog: weaver changelog generate --since v2.4.0
  2. Verify README is current
  3. Check API documentation completeness
  4. Update migration guides if breaking changes
  5. Verify version badges in README
  6. Update CHANGELOG.md with release notes

  Changelog format:
  # v2.5.0 (2025-10-27)

  ## Features
  [From git commits with feat: prefix]

  ## Bug Fixes
  [From git commits with fix: prefix]

  ## Breaking Changes
  [From commits with BREAKING CHANGE footer]

  ## Upgrade Guide
  [Migration steps for breaking changes]

  Output to memory:
  key: "swarm/documenter/changelog"
  Files: CHANGELOG.md, docs/migration-2.5.0.md

  Hooks:
  npx claude-flow hooks post-edit --file "CHANGELOG.md"
`, "documenter")

Task("Deployment Coordinator", `
  Deployment readiness validation for release 2.5.0.

  Tasks:
  1. Verify deployment scripts exist and are current
  2. Check infrastructure readiness (K8s, databases)
  3. Validate environment variables and secrets
  4. Prepare rollback procedures
  5. Set up monitoring alerts for release
  6. Schedule deployment window if needed

  Use MCP tools:
  mcp__claude-flow__github_workflow_auto({
    repo: "organization/project",
    workflow: {
      name: "deploy-production",
      trigger: "tag",
      steps: ["build", "test", "deploy", "verify"]
    }
  })

  Validation:
  - Deployment scripts tested
  - Infrastructure capacity sufficient
  - Rollback plan documented
  - Monitoring configured
  - On-call schedule confirmed

  Output to memory:
  key: "swarm/coordinator/deployment-ready"
  value: {
    scriptsValid: true,
    infrastructureReady: true,
    rollbackReady: true,
    monitoringConfigured: true,
    deploymentWindow: "2025-10-28 02:00 UTC"
  }
`, "coordinator")
```

### Step 3: Aggregate Validation Results
```typescript
// Weaver retrieves all agent outputs
const coderResults = await retrieveMemory("swarm/coder/release-prep")
const testerResults = await retrieveMemory("swarm/tester/validation")
const reviewerResults = await retrieveMemory("swarm/reviewer/qa")
const documenterResults = await retrieveMemory("swarm/documenter/changelog")
const coordinatorResults = await retrieveMemory("swarm/coordinator/deployment-ready")

// Validation gate
const allChecksPass =
  coderResults.buildSuccess &&
  testerResults.failed === 0 &&
  testerResults.coverage >= 80 &&
  reviewerResults.securityIssues === 0 &&
  coordinatorResults.infrastructureReady
```

### Step 4: Create Git Release
```bash
# If all validations pass
weaver git release create 2.5.0

# Internally executes:
git checkout -b release/2.5.0
git add package.json CHANGELOG.md
git commit -m "chore(release): Prepare v2.5.0"
git tag -a v2.5.0 -m "Release v2.5.0

Features:
- OAuth2 authentication support
- GraphQL API enhancements

Bug Fixes:
- UI accessibility improvements
- Database connection stability

Breaking Changes:
- Deprecated API endpoints removed
- See migration guide: docs/migration-2.5.0.md
"
git push origin v2.5.0
```

### Step 5: Create GitHub Release
```typescript
mcp__claude-flow__github_release_coord({
  repo: "organization/project",
  version: "2.5.0"
})

// Creates GitHub release with:
// - Release notes from CHANGELOG
// - Built artifacts attached
// - Links to migration guides
// - Breaking changes highlighted
```

### Step 6: Execute Deployment
```bash
# Deploy to production
weaver deploy production --version 2.5.0

# Deployment workflow:
# 1. Build production artifacts ✓
# 2. Deploy to staging ✓
# 3. Run smoke tests on staging ✓
# 4. Deploy to production ✓
# 5. Monitor deployment metrics ✓
# 6. Verify health checks ✓
```

### Step 7: Post-Deployment Validation
```typescript
Task("Validator", `
  Validate production deployment of 2.5.0.

  Tasks:
  1. Verify application health endpoints
  2. Check error rates in monitoring
  3. Validate key user flows
  4. Monitor performance metrics
  5. Check for deployment anomalies

  Success criteria:
  - Health check: 200 OK
  - Error rate < 0.1%
  - P95 latency < 500ms
  - No 5xx errors
  - User login success rate > 99%

  If issues detected:
  - Execute rollback: weaver rollback 2.5.0
  - Document incident
`, "production-validator")
```

### Step 8: Store Learning Data
```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "releases/2.5.0/metrics",
  namespace: "learning",
  value: JSON.stringify({
    version: "2.5.0",
    releaseDate: "2025-10-27",
    preparationTime: "52 minutes",
    agentsUsed: 5,
    validationsPassed: 5,
    validationsFailed: 0,
    deploymentTime: "14 minutes",
    downtime: "0 seconds",
    postDeploymentIssues: 0,
    rollbackRequired: false,
    testCoverage: 84.5,
    breakingChanges: 2,
    featuresAdded: 8,
    bugsFixed: 12
  }),
  ttl: 31536000 // 1 year
})
```

## Output Artifacts

### 1. Updated Version Files
- `package.json` with new version
- `Cargo.toml` or language-specific version files
- Copyright years updated

### 2. CHANGELOG.md
Comprehensive changelog with categorized changes:
```markdown
# v2.5.0 (2025-10-27)

## Features
- OAuth2 authentication (#123)
- GraphQL API mutations (#145)

## Bug Fixes
- UI accessibility (#134)
- Database connection pool (#156)

## Breaking Changes
- Removed deprecated /api/v1 endpoints
- See migration guide
```

### 3. Git Tag
Annotated git tag `v2.5.0` with full release notes.

### 4. GitHub Release
Published release on GitHub with:
- Release notes
- Built artifacts (binaries, packages)
- Migration documentation links
- Breaking changes summary

### 5. Deployment Record
```json
{
  "version": "2.5.0",
  "deployedAt": "2025-10-27T14:35:00Z",
  "deployedBy": "release-bot",
  "environment": "production",
  "gitCommit": "abc123def456",
  "artifacts": ["app-2.5.0.tar.gz"],
  "validated": true
}
```

### 6. Release Metrics Report
Post-deployment summary:
- Deployment duration
- Validation results
- Test coverage
- Quality scores
- Incident count

## Success Criteria

✅ **All Tests Pass**: Unit, integration, e2e, smoke tests 100% pass rate
✅ **Coverage Threshold**: Code coverage >= 80%
✅ **No Security Issues**: Zero high/critical vulnerabilities
✅ **Documentation Complete**: Changelog, migration guides, API docs current
✅ **Build Success**: Production build completes without errors
✅ **Deployment Success**: Zero-downtime deployment to production
✅ **Post-Deployment Healthy**: All health checks pass, error rate normal
✅ **Learning Captured**: Release metrics stored for future improvement

## Learning Capture

### Release Metrics Analysis

```typescript
// After each release, analyze patterns
mcp__claude-flow__neural_train({
  pattern_type: "optimization",
  training_data: JSON.stringify({
    input: {
      releaseType: "minor",
      featuresCount: 8,
      breakingChanges: 2,
      testCoverage: 84.5
    },
    output: {
      preparationTime: 52,
      deploymentTime: 14,
      issuesPostDeploy: 0,
      rollbackRequired: false
    }
  }),
  epochs: 50
})
```

### Trend Analysis
```typescript
mcp__claude-flow__trend_analysis({
  metric: "release_success_rate",
  period: "90d"
})

// Insights:
// - Release frequency increased 40%
// - Rollback rate decreased from 8% to 2%
// - Avg deployment time reduced from 28min to 14min
```

## Related SOPs

- **SOP-002**: Phase/Milestone Planning (for planning releases)
- **SOP-004**: Debugging Workflow (for post-release issues)
- **SOP-007**: Code Review (for pre-release code quality)
- **SOP-008**: Performance Analysis (for release performance validation)

## Examples

### Example 1: Minor Release

```bash
weaver sop release 2.5.0 --type minor

# Validation: 52 minutes
# Deployment: 14 minutes
# Downtime: 0 seconds
# Issues: 0
# Features: 8
# Bug fixes: 12
```

### Example 2: Hotfix Release

```bash
weaver sop release 2.4.1 --type hotfix --fast-track

# Validation: 18 minutes (reduced checks)
# Deployment: 8 minutes
# Downtime: 0 seconds
# Critical bug: Database leak fixed
```

### Example 3: Major Release with Breaking Changes

```bash
weaver sop release 3.0.0 --type major

# Validation: 95 minutes (extensive testing)
# Deployment: 45 minutes (staged rollout)
# Downtime: 0 seconds
# Breaking changes: 8
# Migration guide: Complete
# User communication: Email sent
```

---

**Version History**
- 1.0.0 (2025-10-27): Initial SOP with multi-agent validation workflow
