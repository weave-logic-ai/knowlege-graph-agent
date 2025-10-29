---
title: 'SOP-007: Multi-Agent Code Review Workflow'
type: sop
status: active
tags:
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4DD"
  color: '#84CC16'
  cssclasses:
    - type-sop
    - status-active
updated: '2025-10-29T04:55:04.587Z'
version: 1.0.0
keywords:
  - overview
  - prerequisites
  - inputs
  - required
  - optional
  - agent coordination
  - 1. code analyzer agent
  - 2. security manager agent
  - 3. performance analyzer agent
  - 4. tester agent
---

# SOP-007: Multi-Agent Code Review Workflow

## Overview

The Multi-Agent Code Review Workflow provides comprehensive, automated code quality assessment through specialized review agents examining different aspects of code changes. This SOP coordinates multiple agents to perform parallel reviews covering code quality, security, performance, testing, and documentation, producing actionable feedback that improves code quality before merging.

This workflow eliminates inconsistent manual reviews by applying systematic checks across all dimensions of code quality. The learning loop captures review patterns, common issues, and effective feedback techniques to continuously improve review quality and reduce review cycle time.

By following this SOP, teams achieve consistent code quality standards, catch issues earlier, reduce review bottlenecks, and maintain high-quality codebases that are secure, performant, and maintainable.

## Prerequisites

- Weaver CLI with git integration
- Access to GitHub repository
- PR number or file paths to review
- Test suite available for validation
- Static analysis tools installed

## Inputs

### Required
- **PR Number**: GitHub pull request number OR
- **File Paths**: Specific files to review

### Optional
- **Review Depth**: quick | standard | comprehensive
- **Focus Areas**: security | performance | tests | docs | all
- **Auto-Approve**: Automatically approve if all checks pass
- **Block Merge**: Block PR merge if critical issues found

## Agent Coordination

This SOP spawns **5 specialized agents** in parallel for comprehensive review:

### 1. Code Analyzer Agent
**Role**: Code quality and maintainability analysis
- Check code complexity and maintainability
- Detect code smells and anti-patterns
- Review naming conventions and structure
- Assess modularity and coupling
- Verify adherence to style guide

### 2. Security Manager Agent
**Role**: Security vulnerability assessment
- Scan for security vulnerabilities
- Check for sensitive data exposure
- Validate input sanitization
- Review authentication/authorization
- Check dependency vulnerabilities

### 3. Performance Analyzer Agent
**Role**: Performance impact assessment
- Identify performance bottlenecks
- Check algorithmic complexity
- Review database query efficiency
- Assess memory usage patterns
- Detect N+1 queries and inefficiencies

### 4. Tester Agent
**Role**: Test coverage and quality validation
- Verify test coverage for changes
- Review test quality and assertions
- Check for missing edge cases
- Validate test isolation
- Assess test maintainability

### 5. Reviewer Agent (Documentation)
**Role**: Documentation and communication review
- Check code comments and documentation
- Review API documentation updates
- Verify changelog/release notes
- Assess PR description quality
- Check for breaking changes documentation

## MCP Tools Used

### GitHub Code Review
```typescript
mcp__claude-flow__github_code_review({
  repo: "organization/project",
  pr: prNumber
})
```
**Purpose**: Integrate with GitHub PR workflow for automated review comments.

### Quality Assessment
```typescript
mcp__claude-flow__quality_assess({
  target: "pr-" + prNumber,
  criteria: [
    "code_quality",
    "security",
    "performance",
    "test_coverage",
    "documentation"
  ]
})
```
**Purpose**: Comprehensive multi-dimensional quality scoring.

### Security Scanning
```typescript
mcp__claude-flow__security_scan({
  target: changedFiles,
  depth: "comprehensive"
})
```
**Purpose**: Deep security vulnerability analysis.

### Performance Benchmarking
```typescript
mcp__claude-flow__benchmark_run({
  suite: "pr-validation",
  iterations: 5
})
```
**Purpose**: Validate no performance regressions introduced.

## Weaver Integration

### Git/GitHub Integration
```bash
# Weaver fetches PR details
weaver github pr fetch 1234

# Returns:
# - Changed files
# - Diff hunks
# - Commit messages
# - PR description
# - Test results
```

### Shadow Cache Context
Weaver provides instant access to:
- Full codebase context
- Related code not in diff
- Test files for changed code
- Documentation for APIs
- Historical changes to files

### Review Comments
```bash
# Weaver posts review comments
weaver github pr review 1234 \
  --comment "file.ts:42" \
  --message "Consider extracting this logic into a separate function"
```

## Execution Steps

### Step 1: Initialize Code Review
```bash
# User initiates review
weaver sop review 1234

# Weaver setup
npx claude-flow hooks pre-task --description "Review PR #1234"
npx claude-flow hooks session-restore --session-id "swarm-review-1234"
```

### Step 2: Fetch PR Context
```bash
# Weaver fetches PR details
weaver github pr fetch 1234

# Retrieved:
# - Files changed: 8 files
# - Lines added: +347
# - Lines removed: -123
# - Commits: 5
# - Description: "Add user authentication with JWT"
# - Labels: ["feature", "security"]
```

### Step 3: Parallel Agent Reviews

```typescript
// Spawn all review agents in parallel
Task("Code Analyzer", `
  Analyze code quality for PR #1234: "Add user authentication with JWT"

  Files changed (8 files):
  - src/auth/jwt.ts (+156 lines)
  - src/auth/middleware.ts (+89 lines)
  - src/services/user.ts (+42 lines)
  - src/routes/auth.ts (+60 lines)
  - tests/auth/jwt.test.ts (+78 lines)
  - tests/auth/middleware.test.ts (+54 lines)
  - package.json (+2 lines)
  - docs/api/auth.md (+89 lines)

  Analysis Focus:

  1. Code Complexity
  - Check cyclomatic complexity < 10
  - Identify deep nesting (>3 levels)
  - Detect long functions (>50 lines)

  2. Code Smells
  - Duplicate code detection
  - Magic numbers and hardcoded values
  - Long parameter lists
  - God objects

  3. Maintainability
  - Naming conventions (camelCase, descriptive)
  - Single Responsibility Principle
  - Proper abstraction levels
  - Error handling patterns

  4. Style Consistency
  - Linting rules compliance
  - Formatting consistency
  - Import organization

  Commands:
  npm run lint -- src/auth/
  npx complexity-report src/auth/jwt.ts

  MCP Tools:
  mcp__claude-flow__quality_assess({
    target: "pr-1234",
    criteria: ["code_quality"]
  })

  Findings:

  ✅ Good:
  - Clear function names and structure
  - Proper error handling in jwt.ts
  - Good test coverage structure
  - TypeScript types well-defined

  ⚠️  Warnings:
  1. jwt.ts:67 - Function verifyToken has complexity 12 (threshold: 10)
     Suggestion: Extract validation logic into separate functions

  2. middleware.ts:34 - Magic number: 3600 (token expiry)
     Suggestion: Move to configuration constant

  3. user.ts:89 - Duplicate password hashing logic
     Suggestion: Extract to shared utility function

  ❌ Issues:
  - None critical

  Score: 87/100 (Good)

  Output to memory:
  key: "swarm/code-analyzer/pr-1234"
  value: {
    score: 87,
    warnings: 3,
    criticalIssues: 0,
    suggestions: ["Extract complexity", "Use constants", "DRY principle"]
  }
`, "code-analyzer")

Task("Security Manager", `
  Security review for PR #1234: "Add user authentication with JWT"

  Security Focus Areas:

  1. Authentication Security
  - JWT secret management
  - Token expiration
  - Refresh token handling
  - Password hashing strength

  2. Input Validation
  - User input sanitization
  - SQL injection prevention
  - XSS prevention
  - CSRF protection

  3. Sensitive Data
  - Password storage (never plain text)
  - Secret exposure in logs
  - Environment variable usage
  - API key management

  4. Dependency Security
  - Known vulnerabilities in dependencies
  - Package version pinning
  - Supply chain security

  Commands:
  npm audit
  npx snyk test
  weaver search "password|secret|apiKey" --exclude-patterns ".env.example"

  MCP Tools:
  mcp__claude-flow__security_scan({
    target: ["src/auth/jwt.ts", "src/auth/middleware.ts"],
    depth: "comprehensive"
  })

  Findings:

  ✅ Good:
  - JWT secret from environment variable
  - Passwords hashed with bcrypt (12 rounds)
  - No sensitive data in git history
  - HTTPS-only cookie flags set

  ⚠️  Warnings:
  1. jwt.ts:23 - JWT secret should be at least 32 bytes
     Current: process.env.JWT_SECRET (length not validated)
     Suggestion: Add startup validation for secret length

  2. middleware.ts:45 - Token expiration is 24 hours
     Suggestion: Consider shorter expiration with refresh tokens

  ❌ Critical:
  - None

  Dependencies:
  npm audit: 0 vulnerabilities
  Known issues: 0 high/critical

  Score: 92/100 (Excellent)

  Output to memory:
  key: "swarm/security/pr-1234"
  value: {
    score: 92,
    criticalIssues: 0,
    warnings: 2,
    vulnerabilities: 0,
    recommendations: ["Validate secret length", "Shorter token expiry"]
  }
`, "security-manager")

Task("Performance Analyzer", `
  Performance analysis for PR #1234: "Add user authentication with JWT"

  Performance Focus:

  1. Algorithmic Efficiency
  - Time complexity of operations
  - Database query efficiency
  - Caching opportunities

  2. Resource Usage
  - Memory allocations
  - Database connections
  - File I/O patterns

  3. Scalability
  - Concurrent request handling
  - Rate limiting
  - Connection pooling

  Analysis:

  jwt.ts:
  - JWT verification: O(1) - Good
  - Token generation: O(1) - Good
  - No database calls in hot path - Excellent

  middleware.ts:
  - User lookup on every request: O(1) with cache, O(n) without
  - Suggestion: Add user object caching (Redis)

  user.ts:
  - Password hashing: Intentionally slow (bcrypt) - Correct
  - User lookup: Indexed query - Good

  Commands:
  npm run test:perf
  npx clinic doctor -- node server.js

  MCP Tools:
  mcp__claude-flow__benchmark_run({
    suite: "auth-performance",
    iterations: 10
  })

  Benchmark Results:

  Token verification: 0.8ms avg (baseline: 0.7ms) - No regression
  User lookup: 12ms avg (baseline: 11ms) - Acceptable
  Password hashing: 142ms avg (intentional - bcrypt) - Expected

  Throughput: 2,450 auth requests/sec (baseline: 2,500) - 2% decrease acceptable

  ⚠️  Warnings:
  1. middleware.ts:67 - User lookup on every authenticated request
     Impact: Additional DB query per request
     Suggestion: Implement user session caching with 5-minute TTL

  2. No rate limiting on auth endpoints
     Risk: Brute force attacks possible
     Suggestion: Add rate limiting (10 requests/minute per IP)

  Score: 85/100 (Good)

  Output to memory:
  key: "swarm/performance/pr-1234"
  value: {
    score: 85,
    regressionDetected: false,
    throughputChange: -0.02,
    recommendations: ["Add caching", "Rate limiting"]
  }
`, "perf-analyzer")

Task("Tester", `
  Test coverage and quality review for PR #1234

  Test Coverage Analysis:

  Files changed: 8
  Test files: 2 (jwt.test.ts, middleware.test.ts)

  Coverage report:
  npm run test:coverage

  Results:
  - src/auth/jwt.ts: 94% coverage (good)
  - src/auth/middleware.ts: 89% coverage (good)
  - src/services/user.ts: 78% coverage (needs improvement)
  - src/routes/auth.ts: 82% coverage (acceptable)

  Overall: 86% (threshold: 80%) ✓

  Test Quality Assessment:

  1. jwt.test.ts (78 lines):
  ✅ Tests token generation
  ✅ Tests token verification
  ✅ Tests token expiration
  ✅ Tests invalid tokens
  ⚠️  Missing: Token tampering test

  2. middleware.test.ts (54 lines):
  ✅ Tests authenticated requests
  ✅ Tests missing token
  ✅ Tests invalid token
  ⚠️  Missing: Expired token test

  Edge Cases Coverage:

  ✅ Empty password
  ✅ Invalid email format
  ✅ Missing required fields
  ⚠️  Missing: Extremely long inputs (DoS)
  ⚠️  Missing: Unicode in passwords
  ❌ Missing: Concurrent login attempts

  Test Assertions:

  Total assertions: 47
  Average per test: 3.4 (good)

  Flaky test detection: None found

  Recommendations:

  1. Add test for token tampering detection
  2. Add test for expired token handling
  3. Add edge case: Very long password input
  4. Add test: Concurrent authentication

  Commands:
  npm test -- --coverage
  npm run test:watch

  Score: 88/100 (Good)

  Output to memory:
  key: "swarm/tester/pr-1234"
  value: {
    score: 88,
    coverage: 0.86,
    testsMissing: 4,
    qualityIssues: 0,
    recommendations: ["Add edge case tests", "Test token tampering"]
  }
`, "tester")

Task("Reviewer (Documentation)", `
  Documentation review for PR #1234

  Documentation Changes:

  Files:
  - docs/api/auth.md (+89 lines) - NEW
  - README.md (no changes) - Should update
  - CHANGELOG.md (no changes) - Should update

  API Documentation Review (docs/api/auth.md):

  ✅ Good:
  - Clear endpoint descriptions
  - Request/response examples
  - Error codes documented
  - Authentication flow diagram

  ⚠️  Issues:
  1. Missing rate limit documentation
  2. Token refresh not documented
  3. No mention of CORS requirements
  4. Security best practices missing

  Code Comments:

  jwt.ts:
  ✅ Function-level JSDoc comments
  ✅ Complex logic explained
  ⚠️  Magic number (3600) not commented

  middleware.ts:
  ✅ Middleware purpose documented
  ⚠️  Error handling logic needs comments

  README Updates Needed:

  - Add "Authentication" section
  - Update environment variables (JWT_SECRET)
  - Add setup instructions for auth

  CHANGELOG Updates Needed:

  Add to "Unreleased" section:
  \`\`\`
  ### Added
  - JWT-based user authentication
  - Auth middleware for protected routes
  - User login and registration endpoints
  \`\`\`

  PR Description Quality:

  ✅ Clear summary
  ✅ Testing instructions
  ⚠️  Missing: Breaking changes note
  ⚠️  Missing: Migration guide for existing users

  Score: 82/100 (Good)

  Recommendations:

  1. Update README with auth setup
  2. Add CHANGELOG entry
  3. Document rate limiting
  4. Add security best practices to docs

  Output to memory:
  key: "swarm/reviewer/pr-1234"
  value: {
    score: 82,
    docUpdatesNeeded: 3,
    commentsAdequate: true,
    recommendations: ["Update README", "Add CHANGELOG", "Document rate limits"]
  }
`, "reviewer")
```

### Step 4: Aggregate Review Results
```typescript
// Retrieve all agent reviews
const codeQuality = await retrieveMemory("swarm/code-analyzer/pr-1234")
const security = await retrieveMemory("swarm/security/pr-1234")
const performance = await retrieveMemory("swarm/performance/pr-1234")
const testing = await retrieveMemory("swarm/tester/pr-1234")
const documentation = await retrieveMemory("swarm/reviewer/pr-1234")

// Calculate overall score
const overallScore = (
  codeQuality.score * 0.25 +
  security.score * 0.30 +
  performance.score * 0.20 +
  testing.score * 0.15 +
  documentation.score * 0.10
) // Weighted average

// overallScore = 87.6 (Good - Approve with minor suggestions)
```

### Step 5: Post Review Comments
```bash
# Weaver posts consolidated review
weaver github pr review 1234 --approve \
  --body "$(cat <<'EOF'
## Code Review Summary

**Overall Score: 88/100** - Approved with suggestions

### ✅ Strengths
- Excellent security practices (JWT, bcrypt, env vars)
- Good test coverage (86%)
- Well-structured code with clear naming
- Comprehensive API documentation

### 🔍 Suggestions for Improvement

#### Code Quality (87/100)
- `jwt.ts:67` - Reduce complexity of verifyToken function
- `middleware.ts:34` - Extract magic number 3600 to constant
- `user.ts:89` - Extract duplicate password hashing logic

#### Security (92/100)
- Add startup validation for JWT_SECRET length (min 32 bytes)
- Consider shorter token expiration with refresh tokens

#### Performance (85/100)
- Implement user session caching to reduce DB queries
- Add rate limiting on auth endpoints (10 req/min per IP)

#### Testing (88/100)
- Add test for token tampering detection
- Add edge case tests for very long inputs
- Test concurrent authentication scenarios

#### Documentation (82/100)
- Update README with authentication setup instructions
- Add CHANGELOG entry for this feature
- Document rate limiting and security best practices

### 🎯 Action Items
1. Address the 3 code quality suggestions
2. Add the 4 missing test cases
3. Update README and CHANGELOG

**Recommendation: Approve and merge** after addressing high-priority items.

Great work on implementing secure authentication!
EOF
)"
```

### Step 6: Store Learning Data
```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "reviews/pr-1234/results",
  namespace: "learning",
  value: JSON.stringify({
    prNumber: 1234,
    overallScore: 88,
    scores: {
      codeQuality: 87,
      security: 92,
      performance: 85,
      testing: 88,
      documentation: 82
    },
    reviewTime: "18 minutes",
    agentsUsed: 5,
    issuesFound: 12,
    criticalIssues: 0,
    approved: true,
    category: "feature-auth",
    linesChanged: 470,
    filesChanged: 8
  }),
  ttl: 7776000 // 90 days
})
```

## Output Artifacts

### 1. GitHub PR Review Comment
Comprehensive review summary with:
- Overall quality score
- Strengths identified
- Suggestions categorized by area
- Action items prioritized

### 2. Inline Code Comments
Specific suggestions on code lines:
- File and line number
- Issue description
- Suggested fix
- Severity level

### 3. Review Metrics
Quantified assessment:
- Code quality score
- Security score
- Performance score
- Test coverage score
- Documentation score

### 4. Action Items Checklist
Prioritized list of improvements to address.

## Success Criteria

✅ **Comprehensive Coverage**: All code quality dimensions reviewed
✅ **Actionable Feedback**: Specific, implementable suggestions
✅ **No Critical Issues**: Zero critical security or quality issues
✅ **Test Coverage**: Coverage ≥ 80%
✅ **Timely Review**: Review completed in < 30 minutes
✅ **Clear Decision**: Approve, Request Changes, or Comment
✅ **Learning Captured**: Review patterns stored for improvement

## Learning Capture

### Review Pattern Analysis

```typescript
mcp__claude-flow__neural_train({
  pattern_type: "optimization",
  training_data: JSON.stringify({
    input: {
      category: "feature-auth",
      linesChanged: 470,
      filesChanged: 8,
      complexity: "medium"
    },
    output: {
      reviewTime: 18,
      issuesFound: 12,
      criticalIssues: 0,
      overallScore: 88
    }
  }),
  epochs: 50
})
```

### Common Issue Patterns

```typescript
// Track frequent code review issues
mcp__claude-flow__memory_usage({
  action: "store",
  key: "reviews/common-issues",
  value: JSON.stringify({
    topIssues: [
      { issue: "Magic numbers", frequency: 0.42 },
      { issue: "Missing test edge cases", frequency: 0.38 },
      { issue: "Inadequate error handling", frequency: 0.31 },
      { issue: "Missing documentation", frequency: 0.29 }
    ],
    preventionStrategies: [
      "Use constants for all magic numbers",
      "Add edge case test template",
      "Error handling checklist in PR template"
    ]
  })
})
```



## Related

[[SOP-008-performance-analysis]]
## Related SOPs

- **SOP-001**: Feature Planning (plan for review requirements)
- **SOP-003**: Release Management (final review before release)
- **SOP-004**: Debugging (review bug fixes thoroughly)
- **SOP-008**: Performance Analysis (detailed performance review)

## Examples

### Example 1: Feature PR Review

```bash
weaver sop review 1234

# PR: Add user authentication
# Files: 8 changed
# Time: 18 minutes
# Score: 88/100
# Decision: Approved with suggestions
# Issues: 12 suggestions, 0 critical
```

### Example 2: Hotfix Review

```bash
weaver sop review 5678 --depth quick

# PR: Fix null pointer in checkout
# Files: 2 changed
# Time: 8 minutes
# Score: 94/100
# Decision: Approved immediately
# Issues: 1 minor suggestion
```

### Example 3: Refactoring PR Review

```bash
weaver sop review 9012 --depth comprehensive

# PR: Refactor database layer
# Files: 24 changed
# Time: 42 minutes
# Score: 91/100
# Decision: Approved
# Issues: 8 suggestions, focus on test coverage
```

---

**Version History**
- 1.0.0 (2025-10-27): Initial SOP with multi-agent review workflow
