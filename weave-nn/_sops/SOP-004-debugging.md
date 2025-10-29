---
sop_id: SOP-004
sop_name: Systematic Debugging Workflow
category: quality
version: 1.0.0
status: active
triggers:
  - weaver sop debug <issue-id>
  - weaver debug investigate <description>
learning_enabled: true
estimated_duration: 30-120 minutes
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

# SOP-004: Systematic Debugging Workflow

## Overview

The Systematic Debugging Workflow provides a structured, multi-agent approach to investigating and resolving software defects. This SOP coordinates specialized agents to analyze logs, reproduce issues, identify root causes, implement fixes, and validate solutions while capturing knowledge for preventing similar bugs in the future.

This workflow eliminates ad-hoc debugging approaches by applying systematic root cause analysis, coordinated investigation across multiple system layers, and automated validation of fixes. The learning loop captures patterns from resolved bugs to improve code quality and reduce future defects.

By following this SOP, teams achieve faster time-to-resolution, reduced bug recurrence rates, and comprehensive documentation of fixes that benefits the entire engineering organization.

## Prerequisites

- Weaver CLI with log analysis capabilities
- Access to application logs and monitoring systems
- Reproduction steps or error reports available
- Test environment access for validation
- Git access for code changes

## Inputs

### Required
- **Issue Description**: Clear description of the problem behavior
- **Issue ID**: GitHub issue number or ticket ID
- **Severity**: P0 (critical) | P1 (high) | P2 (medium) | P3 (low)

### Optional
- **Reproduction Steps**: How to reproduce the issue
- **Error Messages**: Stack traces or error logs
- **Affected Version**: Version where bug appears
- **User Impact**: Number of users affected or business impact
- **Environment**: Production, staging, or development
- **Related Issues**: Similar past bugs

## Agent Coordination

This SOP spawns **4 specialized agents** with sequential dependencies:

### 1. Analyst Agent
**Role**: Log analysis and pattern detection
- Analyze error logs and stack traces
- Search for similar past issues
- Identify error patterns and frequency
- Determine affected components
- Assess impact scope

### 2. Coder Agent (Investigator)
**Role**: Code investigation and root cause analysis
- Trace code paths related to error
- Identify potential root causes
- Review recent code changes
- Check for race conditions or edge cases
- Propose fix strategies

### 3. Coder Agent (Fixer)
**Role**: Implement and test the fix
- Implement root cause fix
- Add test coverage for bug scenario
- Verify fix in test environment
- Check for regression risks
- Prepare code review

### 4. Tester Agent
**Role**: Validation and regression testing
- Validate fix resolves original issue
- Run regression test suite
- Test edge cases and boundary conditions
- Verify no new issues introduced
- Document test coverage added

## MCP Tools Used

### Error Analysis
```typescript
mcp__claude-flow__error_analysis({
  logs: [errorLogPaths]
})
```
**Purpose**: Automated pattern detection in error logs to identify root causes and similar issues.

### Memory Search (Historical Bugs)
```typescript
mcp__claude-flow__memory_search({
  pattern: "bug.*" + errorType,
  namespace: "bugs",
  limit: 10
})
```
**Purpose**: Find similar past bugs to learn from previous fixes and avoid repeated mistakes.

### Log Analysis
```typescript
mcp__claude-flow__log_analysis({
  logFile: "/var/log/application.log",
  patterns: ["ERROR", "FATAL", errorMessage]
})
```
**Purpose**: Deep analysis of application logs to trace error origins and frequency.

### Quality Assessment
```typescript
mcp__claude-flow__quality_assess({
  target: "fix-branch",
  criteria: ["test_coverage", "code_quality"]
})
```
**Purpose**: Validate that fix meets quality standards before merging.

## Weaver Integration

### Shadow Cache for Context
Weaver provides instant access to:
- Related source code files
- Past bug fixes in similar areas
- Test files for affected components
- Architecture documentation
- Error handling patterns

### Log Aggregation
```bash
# Weaver aggregates logs from multiple sources
weaver logs aggregate --issue 1234 --timeframe "24h"

# Collects:
- Application logs
- Error tracking (Sentry/Rollbar)
- Performance monitoring
- Database query logs
- Infrastructure logs
```

### Git Workflow
```bash
# Weaver creates bug fix branch
weaver git bugfix 1234 --description "Fix null pointer in user service"

# Branch: bugfix/issue-1234-null-pointer-fix
# Automatically links to GitHub issue
```

## Execution Steps

### Step 1: Initialize Debugging Session
```bash
# User initiates debugging
weaver sop debug 1234

# Or with description
weaver debug investigate "Users cannot upload files larger than 5MB"

# Weaver setup
npx claude-flow hooks pre-task --description "Debug issue #1234"
npx claude-flow hooks session-restore --session-id "swarm-debug-1234"
```

### Step 2: Log Analysis (Analyst Agent)
```typescript
Task("Analyst", `
  Analyze logs and error patterns for issue #1234: "File upload fails for files > 5MB"

  Tasks:
  1. Aggregate logs from last 24 hours
  2. Search for error messages containing "upload" or "file size"
  3. Identify stack traces and affected endpoints
  4. Determine error frequency and user impact
  5. Check monitoring for performance anomalies
  6. Search memory for similar past issues

  Commands:
  weaver logs aggregate --issue 1234 --timeframe "24h"

  MCP tools:
  mcp__claude-flow__log_analysis({
    logFile: "/var/log/app.log",
    patterns: ["upload.*error", "file.*size.*limit"]
  })

  mcp__claude-flow__memory_search({
    pattern: "bug.*upload|bug.*file.*size",
    namespace: "bugs",
    limit: 10
  })

  Analysis:
  - Extract error frequency: errors per hour
  - Identify affected users: unique user IDs
  - Find error messages: exact stack traces
  - Detect patterns: common characteristics
  - Find similar bugs: past issues with uploads

  Output to memory:
  key: "swarm/analyst/issue-1234/analysis"
  value: {
    errorCount: 47,
    affectedUsers: 12,
    errorMessage: "413 Payload Too Large",
    stackTrace: "at uploadHandler (upload.js:42)",
    similarIssues: ["issue-892", "issue-654"],
    pattern: "All failures on files > 5MB",
    impact: "12% of upload attempts failing"
  }

  Hooks:
  npx claude-flow hooks post-task --task-id "log-analysis-1234"
`, "analyst")
```

### Step 3: Root Cause Investigation (Coder - Investigator)
```typescript
Task("Coder Investigator", `
  Investigate root cause for issue #1234 based on analyst findings.

  Input from memory:
  key: "swarm/analyst/issue-1234/analysis"
  ErrorMessage: "413 Payload Too Large"
  Location: upload.js:42

  Tasks:
  1. Read upload.js and trace upload handling code
  2. Check web server configuration (nginx/apache)
  3. Review file size validation logic
  4. Check for recent changes to upload code
  5. Identify configuration limits (client_max_body_size)
  6. Determine if frontend or backend issue

  Commands:
  weaver read src/upload.js
  weaver git log --follow src/upload.js
  weaver search "max_body_size|upload_max_filesize"

  Investigation:
  - Trace request flow from frontend to storage
  - Check middleware for size limits
  - Review nginx/server config files
  - Check for hardcoded size limits
  - Review recent commits for changes

  Root Cause Analysis:
  Likely causes:
  1. Web server client_max_body_size too low
  2. Application middleware size limit
  3. Frontend FormData size restriction
  4. Cloud provider upload limit

  Output to memory:
  key: "swarm/coder/issue-1234/root-cause"
  value: {
    rootCause: "nginx client_max_body_size set to 5MB",
    location: "/etc/nginx/nginx.conf",
    evidence: "nginx error log shows 413 before app receives request",
    recentChange: "Config updated in deploy 2 weeks ago",
    fixStrategy: "Update nginx config to 50MB limit"
  }

  Hooks:
  npx claude-flow hooks notify --message "Root cause identified: nginx config"
`, "coder")
```

### Step 4: Implement Fix (Coder - Fixer)
```typescript
Task("Coder Fixer", `
  Implement fix for issue #1234 based on root cause analysis.

  Input from memory:
  key: "swarm/coder/issue-1234/root-cause"
  RootCause: nginx client_max_body_size = 5MB
  Solution: Update to 50MB

  Tasks:
  1. Update nginx configuration file
  2. Add configuration validation test
  3. Document configuration change
  4. Add integration test for large file uploads
  5. Update deployment documentation
  6. Create PR with fix

  Files to modify:
  - infrastructure/nginx/nginx.conf
  - tests/integration/upload.test.js
  - docs/deployment.md

  Implementation:

  1. Update nginx.conf:
  \`\`\`nginx
  http {
    client_max_body_size 50M;  # Increased from 5M
    # ... rest of config
  }
  \`\`\`

  2. Add integration test:
  \`\`\`javascript
  describe('File Upload', () => {
    it('should accept files up to 50MB', async () => {
      const largeFile = generateFile(50 * 1024 * 1024) // 50MB
      const response = await uploadFile(largeFile)
      expect(response.status).toBe(200)
    })
  })
  \`\`\`

  3. Add test for config validation:
  \`\`\`bash
  nginx -t  # Test configuration syntax
  \`\`\`

  Commands:
  weaver git bugfix 1234 --description "Fix file upload size limit"
  weaver edit infrastructure/nginx/nginx.conf
  weaver write tests/integration/upload.test.js
  weaver edit docs/deployment.md

  Git workflow:
  git add infrastructure/nginx/nginx.conf tests/integration/upload.test.js
  git commit -m "fix(upload): Increase nginx file size limit to 50MB

  Fixes #1234

  Root cause: nginx client_max_body_size was 5MB
  Solution: Increased to 50MB for large file uploads
  Testing: Added integration test for 50MB uploads"

  Output to memory:
  key: "swarm/coder/issue-1234/fix"
  value: {
    fixImplemented: true,
    filesModified: ["nginx.conf", "upload.test.js"],
    testsAdded: 1,
    branch: "bugfix/issue-1234-upload-limit",
    commitSha: "abc123"
  }

  Hooks:
  npx claude-flow hooks post-edit --file "nginx.conf"
  npx claude-flow hooks post-task --task-id "implement-fix-1234"
`, "coder")
```

### Step 5: Validation and Regression Testing (Tester)
```typescript
Task("Tester", `
  Validate fix for issue #1234 and run regression tests.

  Input from memory:
  key: "swarm/coder/issue-1234/fix"
  Branch: bugfix/issue-1234-upload-limit

  Tasks:
  1. Checkout fix branch
  2. Build and deploy to test environment
  3. Reproduce original issue (should now work)
  4. Test file uploads at various sizes
  5. Run full regression test suite
  6. Verify no performance degradation
  7. Test edge cases and boundary conditions

  Test Scenarios:
  1. Upload 1MB file (should work)
  2. Upload 5MB file (was failing, should now work)
  3. Upload 25MB file (should work)
  4. Upload 50MB file (should work)
  5. Upload 51MB file (should fail gracefully)
  6. Upload 0 byte file (edge case)
  7. Concurrent uploads (performance)

  Commands:
  git checkout bugfix/issue-1234-upload-limit
  npm run test:integration
  npm run test:upload -- --size=5MB
  npm run test:upload -- --size=50MB

  Validation Checklist:
  ✓ Original issue resolved
  ✓ New test passes
  ✓ Regression suite passes (0 failures)
  ✓ No performance degradation
  ✓ Error handling for 51MB+ files
  ✓ Documentation updated

  Results:
  - All tests passing: 1,247/1,247
  - Upload tests: 7/7 passed
  - Regression: No new failures
  - Performance: Upload time < 2s for 50MB
  - Edge cases: Proper error for 51MB

  Output to memory:
  key: "swarm/tester/issue-1234/validation"
  value: {
    validated: true,
    testsPassed: 1247,
    testsFailed: 0,
    regressionIssues: 0,
    originalIssueResolved: true,
    performanceAcceptable: true,
    readyForReview: true
  }

  Hooks:
  npx claude-flow hooks post-task --task-id "validation-1234"
`, "tester")
```

### Step 6: Quality Gate and PR Creation
```typescript
// Aggregate all validation results
const analysis = await retrieveMemory("swarm/analyst/issue-1234/analysis")
const rootCause = await retrieveMemory("swarm/coder/issue-1234/root-cause")
const fix = await retrieveMemory("swarm/coder/issue-1234/fix")
const validation = await retrieveMemory("swarm/tester/issue-1234/validation")

// Quality gate check
const passesQualityGate =
  validation.validated &&
  validation.testsFailed === 0 &&
  validation.regressionIssues === 0 &&
  fix.testsAdded >= 1

if (passesQualityGate) {
  // Create pull request
  weaver github pr create \
    --title "fix(upload): Increase file size limit to 50MB" \
    --body "$(cat <<'EOF'
## Summary
Fixes #1234 - File uploads were failing for files larger than 5MB

## Root Cause
nginx client_max_body_size was configured to 5MB, causing 413 errors

## Solution
- Increased nginx limit to 50MB
- Added integration test for large file uploads
- Updated deployment documentation

## Testing
- ✓ All 1,247 tests passing
- ✓ New integration test for 50MB uploads
- ✓ No regressions detected
- ✓ Edge case tested (51MB file properly rejected)

## Impact
- Resolves issue affecting 12% of upload attempts
- Affects 12 users experiencing failures
EOF
)"
}
```

### Step 7: Store Learning Data
```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "bugs/1234/resolution",
  namespace: "learning",
  value: JSON.stringify({
    issueId: 1234,
    severity: "P2",
    category: "configuration",
    rootCause: "nginx file size limit",
    timeToResolve: "68 minutes",
    agentsUsed: ["analyst", "coder", "tester"],
    testsAdded: 1,
    affectedUsers: 12,
    errorFrequency: 47,
    fixStrategy: "configuration change",
    preventionStrategy: "Add config validation to CI/CD",
    similarIssues: [892, 654],
    lessonsLearned: [
      "Check server config before application code",
      "Add integration tests for file size limits",
      "Document infrastructure limits in deployment guide"
    ]
  }),
  ttl: 15552000 // 180 days
})
```

### Step 8: Neural Training on Bug Patterns
```typescript
mcp__claude-flow__neural_train({
  pattern_type: "prediction",
  training_data: JSON.stringify({
    input: {
      errorType: "413 Payload Too Large",
      component: "upload",
      recentChanges: true,
      stackTrace: "uploadHandler"
    },
    output: {
      rootCauseCategory: "configuration",
      likelyCause: "nginx client_max_body_size",
      timeToResolve: 68,
      preventable: true
    }
  }),
  epochs: 50
})
```

## Output Artifacts

### 1. Root Cause Analysis Document
```markdown
# Issue #1234: File Upload Fails for Files > 5MB

## Root Cause
nginx client_max_body_size configured to 5MB

## Evidence
- nginx error logs show 413 before app receives request
- Configuration changed in deployment 2 weeks ago
- All failures occur at exactly 5MB boundary

## Fix
Increased client_max_body_size to 50MB in nginx.conf
```

### 2. Code Changes
- Updated configuration files
- New test coverage
- Updated documentation

### 3. Pull Request
Complete PR with:
- Clear description of issue and fix
- Test results and validation
- Links to related issues
- Deployment notes

### 4. Test Coverage
New tests added:
- Integration test for large file uploads
- Configuration validation test
- Edge case tests

### 5. Learning Record
Captured in memory:
- Root cause category
- Time to resolution
- Fix strategy
- Prevention recommendations

## Success Criteria

✅ **Root Cause Identified**: Clear understanding of why bug occurred
✅ **Fix Implemented**: Code changes address root cause
✅ **Tests Added**: New test coverage prevents regression
✅ **Validation Complete**: Original issue resolved, no new issues
✅ **Documentation Updated**: Fix and prevention documented
✅ **Learning Captured**: Bug pattern stored for future prevention
✅ **PR Approved**: Code review passed, ready to merge

## Learning Capture

### Bug Pattern Recognition

```typescript
// Analyze common bug categories
mcp__claude-flow__cognitive_analyze({
  behavior: "bug-resolution-patterns"
})

// Insights:
// - 40% of bugs are configuration issues
// - 25% are edge case handling
// - 20% are race conditions
// - Average time to resolve: 72 minutes
```

### Prevention Strategies

Based on resolved bugs, generate prevention checklist:

```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "preventive-measures/configuration",
  value: JSON.stringify({
    category: "configuration",
    checklist: [
      "Add config validation to CI/CD",
      "Document all size limits",
      "Add integration tests for limits",
      "Monitor for 413 errors in production"
    ]
  })
})
```



## Related

[[SOP-007-code-review]] • [[SOP-008-performance-analysis]]
## Related SOPs

- **SOP-001**: Feature Planning (to prevent bugs through better planning)
- **SOP-003**: Release Management (for hotfix releases)
- **SOP-007**: Code Review (to catch bugs before production)
- **SOP-008**: Performance Analysis (for performance-related bugs)

## Examples

### Example 1: Configuration Bug

```bash
weaver sop debug 1234

# Issue: File uploads fail > 5MB
# Root cause: nginx config (68 min to resolve)
# Fix: Update client_max_body_size
# Tests added: 1 integration test
# Learning: Always check server config first
```

### Example 2: Race Condition Bug

```bash
weaver debug investigate "Intermittent data corruption in checkout flow"

# Issue: Orders occasionally missing items
# Root cause: Race condition in cart update (142 min to resolve)
# Fix: Add database transaction locking
# Tests added: 3 concurrency tests
# Learning: Use database transactions for critical operations
```

### Example 3: Edge Case Bug

```bash
weaver sop debug 5678

# Issue: App crashes on empty user profile
# Root cause: Null pointer on missing bio field (35 min to resolve)
# Fix: Add null checks and default values
# Tests added: 5 edge case tests
# Learning: Always validate optional fields
```

---

**Version History**
- 1.0.0 (2025-10-27): Initial SOP with systematic debugging workflow
