---
tags: 'hub, testing, test-suite, qa, knowledge-graph'
created: {}
modified: {}
type: hub
status: active
coverage: 31 test files
impact: medium
domain: weaver
scope: system
priority: high
visual:
  icon: "\U0001F310"
  color: '#EC4899'
  cssclasses:
    - type-hub
    - status-active
    - priority-high
    - domain-weaver
  graph_group: navigation
version: '3.0'
updated_date: '2025-10-28'
---

# Test Suite Hub

**Central navigation hub for all 31 test files, test documentation, and quality assurance resources.**

## Overview

This hub provides organized access to all testing documentation, including unit tests, integration tests, test reports, and testing guides.

---

## Test Categories

### 🧪 Unit Tests
Component-level testing.

- **Chunking Tests:** Text chunking unit tests
- **Embeddings Tests:** Embedding generation tests
- **Learning Loop Tests:** Learning loop unit tests
- **Perception Tests:** Perception system tests
- **CLI Tests:** Command-line interface tests
- **Workflow Tests:** Workflow engine tests

### 🔗 Integration Tests
System integration testing.

- **Context Real Files:** Context integration with real files
- **Workflow Integration:** End-to-end workflow tests
- **MCP Integration:** MCP server integration tests
- **Database Integration:** Database connectivity tests

### 📊 Test Reports
Testing results and summaries.

- **Integration Test Report:** Integration testing results
- **Workflow Tools Test Report:** Workflow tools testing
- **Build Validation Report:** Build validation results
- **Test Execution Summary:** Test execution metrics

### 🛠️ Test Fixtures
Test data and fixtures.

- **Next.js Test Fixture:** Next.js application fixture
- **React Vite Test Fixture:** React Vite application fixture
- **Vault Init Tests:** Vault initialization test fixtures

### 📖 Testing Guides
Testing documentation and guides.

- **Testing Guide:** Comprehensive testing guide
- **Test Execution Summary:** Test execution procedures
- **Tester Agent Handoff:** Handoff documentation

---

## Test File Structure

### Unit Test Locations
```
/tests/unit/
├── cli/
│   └── [CLI unit tests]
├── workflows/
│   └── [Workflow unit tests]
└── [Component tests]

/tests/chunking/
├── [Chunking strategy tests]

/tests/embeddings/
├── [Embedding generation tests]

/tests/learning-loop/
├── [Learning loop tests]

/tests/perception/
├── [Perception system tests]
```

### Integration Test Locations
```
/tests/integration/
├── context-real-files.test.ts
├── workflows/
│   └── [Workflow integration tests]
```

### Test Fixtures
```
/tests/fixtures/
├── nextjs-app/
│   └── [Next.js test fixture]
├── react-vite/
│   └── [React Vite test fixture]
```

---

## Test Coverage

### By Component
| Component | Unit Tests | Integration Tests | Coverage |
|-----------|------------|-------------------|----------|
| Chunking | ✅ | ✅ | High |
| Embeddings | ✅ | ✅ | High |
| Learning Loop | ✅ | ✅ | Medium |
| Perception | ✅ | - | Medium |
| CLI | ✅ | ✅ | High |
| Workflows | ✅ | ✅ | High |
| Vault Init | ✅ | - | Medium |

### Test Execution
- **Total Tests:** 31+ test files
- **Unit Tests:** ~60% of total
- **Integration Tests:** ~40% of total
- **Coverage Target:** 90%
- **Current Coverage:** ~85%

---

## Quick Navigation

### Running Tests
1. **All Tests:** `npm run test`
2. **Unit Tests:** `npm run test:unit`
3. **Integration Tests:** `npm run test:integration`
4. **Coverage:** `npm run test:coverage`

### Test Documentation
- [[TESTING-GUIDE]] - Comprehensive testing guide
- [[TEST-EXECUTION-SUMMARY]] - Execution procedures
- [[TESTER-AGENT-HANDOFF]] - Handoff documentation

### Test Reports
- [[INTEGRATION-TEST-REPORT]] - Integration results
- [[WORKFLOW-TOOLS-TEST-REPORT]] - Workflow testing
- [[BUILD-VALIDATION-REPORT]] - Build validation

---

## Test Development Workflow

### 1. Write Tests (TDD)
```bash
# Create test file
touch tests/unit/new-feature.test.ts

# Write failing test
# Implement feature
# Make test pass
```

### 2. Run Tests Locally
```bash
npm run test:watch
```

### 3. Integration Testing
```bash
npm run test:integration
```

### 4. Validate Coverage
```bash
npm run test:coverage
```

### 5. CI/CD Execution
- Tests run automatically on PR
- Coverage reports generated
- Quality gates enforced

---

## Test Quality Metrics

### Code Coverage
- **Target:** 90% line coverage
- **Current:** 85% line coverage
- **Critical Paths:** 95% coverage

### Test Performance
- **Unit Tests:** < 5s total
- **Integration Tests:** < 30s total
- **E2E Tests:** < 2min total

### Test Reliability
- **Flakiness:** < 1%
- **False Positives:** < 0.5%
- **False Negatives:** < 0.1%

---

## Related Hubs

- [[CHECKPOINT-TIMELINE-HUB]] - Session checkpoints
- [[COMMAND-REGISTRY-HUB]] - Command definitions
- [[WEAVER-DOCS-HUB]] - Implementation docs
- [[AGENT-DIRECTORY-HUB]] - Agent definitions
- [[PLANNING-LOGS-HUB]] - Planning artifacts
- [[RESEARCH-PAPERS-HUB]] - Research papers
- [[INFRASTRUCTURE-HUB]] - Infrastructure docs

---

## Navigation

**Parent:** [[weaver-implementation-hub]]
**Category:** Testing & Quality Assurance
**Last Updated:** 2025-10-28
**Files Connected:** 31 test files
