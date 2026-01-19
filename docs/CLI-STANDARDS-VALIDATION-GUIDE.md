# CLI Standards Validation Guide

## 🎯 Overview

The **standards validation** feature has been integrated into the `weaver cultivate` command. This allows you to validate the `deep-analyzer` module (and future modules) against the comprehensive standards established by the Hive Mind collective intelligence.

---

## 📦 What Was Added

### 1. **Standards Validator Module**
**File**: `/weaver/src/cultivation/standards-validator.ts`

A comprehensive validator that checks:
- ✅ **Naming Conventions** (file names, classes, interfaces, methods)
- ✅ **Data Formats** (ISO 8601 dates, priority levels, category paths)
- ✅ **Documentation** (JSDoc comments, @example blocks, inline comments)
- ✅ **Testing** (test file existence, coverage, mocking, edge cases)

### 2. **CLI Integration**
**File**: `/weaver/src/cli/commands/cultivate.ts` (updated)

Added `--validate-standards` flag to the `weaver cultivate` command.

---

## 🚀 Usage

### **Basic Validation**

```bash
# Validate deep-analyzer against established standards
weaver cultivate --validate-standards
```

### **Validation with Project Root**

```bash
# Validate with specific project root
weaver cultivate --validate-standards --project-root /path/to/weave-nn
```

### **Dry Run (No Exit on Failure)**

```bash
# Validate without exiting on failure
weaver cultivate --validate-standards --dry-run
```

### **Combined with Seed Generation**

```bash
# Seed primitives AND validate standards
weaver cultivate --seed --validate-standards
```

### **Combined with Deep Analysis**

```bash
# Deep analysis + seeding + standards validation
weaver cultivate --seed --deep-analysis --validate-standards
```

---

## 📊 Validation Report

The validator produces a comprehensive report with:

### **Overall Score** (0-100)
- Score ≥ 85: ✅ **PASSED**
- Score < 85: ❌ **FAILED**

### **Category Breakdown**
Each category is scored independently:

| Category | What It Checks | Weight |
|----------|----------------|--------|
| **Naming Conventions** | File names (kebab-case), class names (PascalCase), interface names (no "I" prefix), method names (camelCase) | 25% |
| **Data Formats** | ISO 8601 dates, 4-level priority system, category paths matching PRIMITIVES.md | 25% |
| **Documentation** | JSDoc on exports, @example blocks, inline comments explaining WHY | 25% |
| **Testing** | Test file exists, ≥5 tests, mocking present, timeout/error tests | 25% |

### **Example Report**

```
═══════════════════════════════════════════════════════════════
📋 STANDARDS VALIDATION REPORT
═══════════════════════════════════════════════════════════════

✅ Overall Status: PASSED
📊 Score: 92/100

📂 Category Breakdown:

  ✅ Naming Conventions: 100/100
  ✅ Data Formats: 95/100
  ✅ Documentation: 85/100
  ❌ Testing: 70/100

⚠️  WARNINGS:

  1. Missing JSDoc for exported analyze
  2. Test file should have at least 5 tests, found 3
  3. Tests should cover timeout scenarios

💡 SUGGESTIONS:

  1. Review /docs/standards/STANDARDS-INTEGRATION-GUIDE.md for improvement recommendations

═══════════════════════════════════════════════════════════════
📚 DOCUMENTATION:
  - API & Coding Standards:      /docs/standards/api-coding-standards.md
  - Data & Documentation:        /docs/standards/data-documentation-standards.md
  - Implementation & Naming:     /docs/standards/implementation-naming-standards.md
  - Testing Guidelines:          /weaver/docs/standards/testing-guidelines.md
  - Integration Guide:           /docs/standards/STANDARDS-INTEGRATION-GUIDE.md
═══════════════════════════════════════════════════════════════
```

---

## 🎯 What Gets Validated

### **1. Naming Conventions**

✅ **File Names**
```typescript
// ✅ CORRECT
deep-analyzer.ts
seed-generator.ts
seed-enhancer.ts

// ❌ WRONG
DeepAnalyzer.ts
deep_analyzer.ts
deepAnalyzer.ts
```

✅ **Class Names**
```typescript
// ✅ CORRECT
export class DeepAnalyzer { }
export class SeedGenerator { }

// ❌ WRONG
export class deepAnalyzer { }
export class deep_analyzer { }
```

✅ **Interface Names**
```typescript
// ✅ CORRECT
export interface PrimitiveDiscovery { }
export interface DeepAnalysisResult { }

// ❌ WRONG
export interface IPrimitiveDiscovery { }  // No "I" prefix
export interface primitive_discovery { }  // Not camelCase
```

✅ **Method Names**
```typescript
// ✅ CORRECT
async analyze(): Promise<Result> { }
buildAnalysisPrompt(): string { }

// ❌ WRONG
async Analyze(): Promise<Result> { }    // Should be camelCase
build_analysis_prompt(): string { }     // No underscores
```

### **2. Data Formats**

✅ **Date Formats (ISO 8601)**
```typescript
// ✅ CORRECT
created: "2025-10-30"                    // YYYY-MM-DD for dates
updated: "2025-10-30T02:41:28.651Z"      // Full ISO 8601 for timestamps

// ❌ WRONG
created: "10/30/2025"                    // US format
updated: "2025-10-30"                    // Missing time
```

✅ **Priority Levels (4-level system)**
```typescript
// ✅ CORRECT
type Priority = 'critical' | 'high' | 'medium' | 'low';

// ❌ WRONG
type Priority = 'urgent' | 'normal';     // Only 2 levels
type Priority = 1 | 2 | 3 | 4;           // Numbers instead of strings
```

✅ **Category Paths**
```typescript
// ✅ CORRECT (matches PRIMITIVES.md taxonomy)
category: "schemas/database"
category: "integrations/ai-services"
category: "components/ui"

// ❌ WRONG
category: "schema-database"              // Should use forward slash
category: "database"                     // Missing parent category
```

### **3. Documentation**

✅ **JSDoc on Exported Functions/Classes**
```typescript
// ✅ CORRECT
/**
 * Perform deep analysis using claude-flow agent
 *
 * @returns Promise resolving to analysis result
 * @throws Error if execution fails
 *
 * @example
 * ```typescript
 * const analyzer = new DeepAnalyzer('/project', '/vault');
 * const result = await analyzer.analyze();
 * ```
 */
export async function analyze(): Promise<Result> { }

// ❌ WRONG
export async function analyze(): Promise<Result> { }  // No JSDoc
```

✅ **Inline Comments Explain WHY**
```typescript
// ✅ CORRECT (explains WHY)
// Use AbortController for proper timeout handling (execAsync doesn't support native timeout)
const controller = new AbortController();

// ❌ WRONG (explains WHAT)
// Create a new AbortController
const controller = new AbortController();
```

### **4. Testing**

✅ **Test File Exists**
```bash
# ✅ CORRECT
tests/cultivation/deep-analyzer.test.ts

# ❌ WRONG
# No test file at all
```

✅ **Adequate Test Coverage**
```typescript
// ✅ CORRECT (≥5 tests)
describe('DeepAnalyzer', () => {
  it('should analyze when claude-flow is available', async () => { });
  it('should fall back when claude-flow is unavailable', async () => { });
  it('should handle timeout gracefully', async () => { });
  it('should handle malformed JSON response', async () => { });
  it('should validate PRIMITIVES.md taxonomy', async () => { });
});

// ❌ WRONG (< 5 tests)
describe('DeepAnalyzer', () => {
  it('should work', async () => { });
});
```

✅ **Mocking External Dependencies**
```typescript
// ✅ CORRECT
vi.mock('child_process', () => ({ exec: vi.fn() }));
vi.mock('fs/promises', () => ({ readFile: vi.fn() }));

// ❌ WRONG
// No mocking - tests call real file system and processes
```

---

## 🔧 Fixing Validation Errors

When validation fails, follow the **[STANDARDS-INTEGRATION-GUIDE.md](/docs/standards/STANDARDS-INTEGRATION-GUIDE.md)** which provides:

1. ✅ File structure validation checklist
2. ✅ Interface standards integration steps
3. ✅ Method implementation enhancement examples
4. ✅ Error handling improvement patterns
5. ✅ Documentation enhancement templates
6. ✅ Testing integration guide
7. ✅ TypeScript configuration validation
8. ✅ Complete before/after examples

---

## 📚 Related Documentation

| Document | Purpose |
|----------|---------|
| **[api-coding-standards.md](/docs/standards/api-coding-standards.md)** | API patterns, TypeScript config, coding conventions |
| **[data-documentation-standards.md](/docs/standards/data-documentation-standards.md)** | Data formats, interfaces, JSDoc, frontmatter |
| **[implementation-naming-standards.md](/docs/standards/implementation-naming-standards.md)** | Implementation patterns, naming conventions, architecture |
| **[testing-guidelines.md](/weaver/docs/standards/testing-guidelines.md)** | Testing strategy, mocking, coverage requirements |
| **[COMPREHENSIVE-STANDARDS-SUMMARY.md](/docs/standards/COMPREHENSIVE-STANDARDS-SUMMARY.md)** | Consolidated findings with 100% consensus |
| **[STANDARDS-INTEGRATION-GUIDE.md](/docs/standards/STANDARDS-INTEGRATION-GUIDE.md)** | Step-by-step integration guide with examples |

---

## 🎯 CI/CD Integration

### **Add to GitHub Actions**

```yaml
name: Standards Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - name: Validate Standards
        run: weaver cultivate --validate-standards --project-root .
```

### **Add to Pre-commit Hook**

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Validating standards..."
weaver cultivate --validate-standards --dry-run

if [ $? -ne 0 ]; then
  echo "❌ Standards validation failed. Fix errors before committing."
  exit 1
fi

echo "✅ Standards validation passed"
```

---

## 🏆 Benefits

### **For Development Teams**
- ✅ **Consistency**: Ensures all modules follow the same standards
- ✅ **Quality**: Catches issues before code review
- ✅ **Documentation**: Enforces comprehensive documentation
- ✅ **Testing**: Ensures adequate test coverage

### **For CI/CD**
- ✅ **Automated**: Runs in CI pipeline
- ✅ **Fast**: Validates in seconds
- ✅ **Actionable**: Provides specific errors and suggestions

### **For Onboarding**
- ✅ **Learning**: New developers understand standards
- ✅ **Reference**: Documentation links provided in report
- ✅ **Examples**: Shows correct patterns

---

## 🤝 Contributing

When adding new cultivation modules:

1. **Run validation**: `weaver cultivate --validate-standards`
2. **Fix errors**: Follow integration guide
3. **Add tests**: Ensure ≥90% coverage
4. **Update docs**: Add JSDoc with examples
5. **Re-validate**: Confirm score ≥85

---

## 📝 Changelog

### **v1.0.0** (2025-10-30)
- ✅ Initial release
- ✅ Standards validator implemented
- ✅ CLI integration complete
- ✅ 4 validation categories (naming, data, docs, testing)
- ✅ Comprehensive reporting
- ✅ Integration guide created

---

**Next Steps**: Run `weaver cultivate --validate-standards` to validate your codebase now! 🚀
