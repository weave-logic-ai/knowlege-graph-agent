# Vault Initialization System - Task Breakdown

**Phase ID**: PHASE-6
**Status**: Ready for Implementation
**Total Tasks**: 95
**Duration**: 15-20 days (4 weeks)

---

## Table of Contents

1. [Task Summary](#task-summary)
2. [Week 1: Foundation](#week-1-foundation-days-1-5)
3. [Week 2: Templates & Graph](#week-2-templates--graph-days-6-10)
4. [Week 3: AI & Finalization](#week-3-ai--finalization-days-11-15)
5. [Week 4: Testing & Documentation](#week-4-testing--documentation-days-16-20)
6. [Critical Path](#critical-path)
7. [Task Dependencies](#task-dependencies)

---

## Task Summary

### By Week

| Week | Focus Area | Tasks | Est. Days |
|------|-----------|-------|-----------|
| Week 1 | Foundation & Code Scanner | 22 tasks | 5 days |
| Week 2 | Templates & Graph Generation | 21 tasks | 5 days |
| Week 3 | AI & Finalization | 23 tasks | 5 days |
| Week 4 | Testing & Documentation | 29 tasks | 5 days |
| **Total** | | **95 tasks** | **20 days** |

### By Priority

| Priority | Count | Description |
|----------|-------|-------------|
| 🔴 Critical | 25 | Must complete for MVP |
| 🟡 High | 45 | Important for quality |
| 🟢 Medium | 20 | Nice to have |
| ⚪ Low | 5 | Polish/optimization |

### By Module

| Module | Tasks | Est. Days |
|--------|-------|-----------|
| Code Scanner | 18 | 4 days |
| Template System | 14 | 3 days |
| Documentation Extractor | 8 | 2 days |
| Knowledge Graph Generator | 12 | 3 days |
| AI Content Generator | 10 | 2 days |
| Vault Finalizer | 12 | 3 days |
| CLI Tool | 8 | 1 day |
| Testing | 13 | 3 days |

---

## Week 1: Foundation (Days 1-5)

### Day 1: Project Setup & Scaffolding

#### TASK-001: Create Module Structure
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: None
- **Assignee**: Developer 1

**Description**: Create base directory structure for vault-init module.

**Subtasks**:
- [ ] Create `/src/vault-init/` directory
- [ ] Create subdirectories: `/types`, `/utils`, `/templates`
- [ ] Create index files for each module
- [ ] Setup barrel exports

**Acceptance Criteria**:
- [ ] Directory structure matches plan.md architecture
- [ ] All index files created
- [ ] TypeScript can import from barrel exports

**Files to Create**:
```
/src/vault-init/
  ├── index.ts
  ├── types/
  │   ├── index.ts
  │   ├── scan-result.ts
  │   ├── template.ts
  │   └── vault-structure.ts
  ├── code-scanner/
  │   └── index.ts
  ├── template-system/
  │   └── index.ts
  ├── doc-extractor/
  │   └── index.ts
  ├── graph-generator/
  │   └── index.ts
  ├── ai-generator/
  │   └── index.ts
  └── finalizer/
      └── index.ts
```

---

#### TASK-002: Install Dependencies
- **Priority**: 🔴 Critical
- **Estimate**: 30 minutes
- **Dependencies**: TASK-001
- **Assignee**: Developer 1

**Description**: Install all required npm packages.

**Subtasks**:
- [ ] Install CLI dependencies: `commander inquirer ora chalk cli-progress`
- [ ] Install parsing dependencies: `@babel/parser @babel/traverse acorn acorn-walk`
- [ ] Install utility dependencies: `gray-matter js-yaml fast-glob`
- [ ] Install template dependencies: `handlebars`
- [ ] Install optional AI dependencies: `openai`
- [ ] Install dev dependencies: `@types/*` for all packages

**Commands**:
```bash
bun add commander inquirer ora chalk cli-progress
bun add @babel/parser @babel/traverse acorn acorn-walk
bun add gray-matter js-yaml fast-glob
bun add handlebars
bun add openai
bun add -D @types/babel__parser @types/babel__traverse @types/inquirer
```

**Acceptance Criteria**:
- [ ] All packages installed successfully
- [ ] `package.json` updated with correct versions
- [ ] TypeScript types available for all packages
- [ ] `bun install` runs without errors

---

#### TASK-003: Define Core TypeScript Interfaces
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-001
- **Assignee**: Developer 1

**Description**: Define all TypeScript interfaces and types for the module.

**Subtasks**:
- [ ] Define `CodeScanResult` interface
- [ ] Define `Template` interface with Zod schema
- [ ] Define `VaultStructure` interface
- [ ] Define `GeneratedNode` interface
- [ ] Define `FrameworkType` and `ProgrammingLanguage` enums
- [ ] Export all types from barrel

**Files to Create**:
- `/src/vault-init/types/scan-result.ts`
- `/src/vault-init/types/template.ts`
- `/src/vault-init/types/vault-structure.ts`
- `/src/vault-init/types/enums.ts`

**Acceptance Criteria**:
- [ ] All interfaces defined with JSDoc comments
- [ ] TypeScript strict mode passes
- [ ] No circular dependencies
- [ ] Exports work from barrel index

---

#### TASK-004: Setup Unit Test Scaffolding
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-001
- **Assignee**: Developer 1

**Description**: Create test directory structure and utilities.

**Subtasks**:
- [ ] Create `/tests/vault-init/` directory
- [ ] Create test utilities: `test-helpers.ts`
- [ ] Create fixture directories for test data
- [ ] Setup Vitest config for vault-init tests

**Files to Create**:
```
/tests/vault-init/
  ├── code-scanner.test.ts
  ├── template-system.test.ts
  ├── doc-extractor.test.ts
  ├── graph-generator.test.ts
  ├── finalizer.test.ts
  ├── fixtures/
  │   ├── typescript-project/
  │   ├── nextjs-project/
  │   └── python-project/
  └── test-helpers.ts
```

**Acceptance Criteria**:
- [ ] Test files created with placeholder tests
- [ ] Fixtures directory structure created
- [ ] `bun test vault-init` runs (even if tests are empty)

---

### Day 2: Code Scanner - Framework Detection

#### TASK-005: Implement FrameworkDetector Interface
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-003
- **Assignee**: Developer 1

**Description**: Create base interface and abstract class for framework detection.

**Subtasks**:
- [ ] Define `FrameworkDetector` interface
- [ ] Create `BaseFrameworkDetector` abstract class
- [ ] Add `detect()` method signature
- [ ] Add helper methods: `fileExists()`, `readPackageJson()`

**File**: `/src/vault-init/code-scanner/framework-detector.ts`

**Acceptance Criteria**:
- [ ] Interface clearly defines contract
- [ ] Helper methods are reusable
- [ ] TypeScript compiles without errors

---

#### TASK-006: Implement Next.js Detector
- **Priority**: 🔴 Critical
- **Estimate**: 30 minutes
- **Dependencies**: TASK-005
- **Assignee**: Developer 1

**Description**: Create detector for Next.js projects.

**Detection Logic**:
- Check for `next.config.js` or `next.config.mjs`
- Check for `next` in package.json dependencies
- Check for `pages/` or `app/` directory

**File**: `/src/vault-init/code-scanner/detectors/nextjs-detector.ts`

**Acceptance Criteria**:
- [ ] Detects Next.js projects correctly
- [ ] Handles both Pages Router and App Router
- [ ] Unit test with 5+ Next.js projects

---

#### TASK-007: Implement Python Framework Detectors
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-005
- **Assignee**: Developer 1

**Description**: Create detectors for Django, FastAPI, Flask.

**Detection Logic**:
- **Django**: Check for `manage.py`, `settings.py`
- **FastAPI**: Check for `fastapi` in requirements.txt, `main.py` with FastAPI import
- **Flask**: Check for `flask` in requirements.txt, `app.py` with Flask import

**Files**:
- `/src/vault-init/code-scanner/detectors/django-detector.ts`
- `/src/vault-init/code-scanner/detectors/fastapi-detector.ts`
- `/src/vault-init/code-scanner/detectors/flask-detector.ts`

**Acceptance Criteria**:
- [ ] All 3 detectors implemented
- [ ] Unit tests for each (3+ projects per framework)
- [ ] Handles edge cases (e.g., no requirements.txt)

---

#### TASK-008: Implement Express & React Detectors
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-005
- **Assignee**: Developer 1

**Description**: Create detectors for Express and React.

**Detection Logic**:
- **Express**: Check for `express` in package.json, `server.js` or `app.js`
- **React**: Check for `react` in package.json, no framework-specific configs

**Files**:
- `/src/vault-init/code-scanner/detectors/express-detector.ts`
- `/src/vault-init/code-scanner/detectors/react-detector.ts`

**Acceptance Criteria**:
- [ ] Both detectors implemented
- [ ] Unit tests (3+ projects each)
- [ ] Correctly distinguishes React from Next.js

---

#### TASK-009: Implement Generic Detector (Fallback)
- **Priority**: 🟡 High
- **Estimate**: 30 minutes
- **Dependencies**: TASK-005
- **Assignee**: Developer 1

**Description**: Create fallback detector for unknown projects.

**Detection Logic**:
- Always returns `true`
- Used when no other detector matches

**File**: `/src/vault-init/code-scanner/detectors/generic-detector.ts`

**Acceptance Criteria**:
- [ ] Always returns true
- [ ] Sets framework to 'generic'

---

#### TASK-010: Implement Framework Detection Orchestrator
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-006, TASK-007, TASK-008, TASK-009
- **Assignee**: Developer 1

**Description**: Create main `detectFramework()` method that runs detectors in order.

**Subtasks**:
- [ ] Implement detector chain (most specific → least specific)
- [ ] Return first matching framework
- [ ] Add logging for detection process

**File**: `/src/vault-init/code-scanner/code-scanner.ts` (partial)

**Acceptance Criteria**:
- [ ] Runs detectors in correct order
- [ ] Returns first match
- [ ] Logs detection steps
- [ ] Unit test: 95%+ accuracy on 50+ projects

---

### Day 3: Code Scanner - File Scanning

#### TASK-011: Implement Directory Structure Scanning
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-003
- **Assignee**: Developer 1

**Description**: Implement `scanStructure()` using fast-glob.

**Subtasks**:
- [ ] Use fast-glob with ignore patterns
- [ ] Implement configurable depth limiting
- [ ] Extract file metadata (size, modified time)
- [ ] Build hierarchical DirectoryTree structure

**File**: `/src/vault-init/code-scanner/code-scanner.ts`

**Acceptance Criteria**:
- [ ] Scans 500 files in < 10 seconds
- [ ] Respects ignore patterns (node_modules, dist, etc.)
- [ ] Depth limiting works correctly
- [ ] Returns hierarchical tree structure

**Performance Test**:
```typescript
test('scans 500 files in under 10 seconds', async () => {
  const start = Date.now();
  await scanner.scanStructure(largePath);
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(10000);
});
```

---

#### TASK-012: Implement Dependency Parsing
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-003
- **Assignee**: Developer 1

**Description**: Parse package.json, requirements.txt, and config files.

**Subtasks**:
- [ ] Parse `package.json` (dependencies, devDependencies, peerDependencies)
- [ ] Parse `requirements.txt` (Python dependencies)
- [ ] Parse `tsconfig.json`, `jest.config.js`, `next.config.js`
- [ ] Categorize dependencies (production, dev, peer)

**File**: `/src/vault-init/code-scanner/dependency-parser.ts`

**Acceptance Criteria**:
- [ ] Parses all dependency file types
- [ ] Correctly categorizes dependencies
- [ ] Handles missing files gracefully
- [ ] Unit test with 10+ different projects

---

#### TASK-013: Implement Config File Detection
- **Priority**: 🟢 Medium
- **Estimate**: 1 hour
- **Dependencies**: TASK-011
- **Assignee**: Developer 1

**Description**: Detect and parse configuration files.

**Config Files to Detect**:
- `.env.example`
- `.eslintrc`, `.eslintrc.js`, `.eslintrc.json`
- `.prettierrc`
- `babel.config.js`
- `vite.config.ts`

**File**: `/src/vault-init/code-scanner/config-detector.ts`

**Acceptance Criteria**:
- [ ] Detects all common config files
- [ ] Extracts basic metadata
- [ ] Doesn't fail on parse errors

---

### Day 4: Code Scanner - Component Extraction

#### TASK-014: Implement TypeScript/JavaScript Extractor with Babel
- **Priority**: 🔴 Critical
- **Estimate**: 3 hours
- **Dependencies**: TASK-002, TASK-003
- **Assignee**: Developer 1

**Description**: Use Babel AST to extract components, functions, classes.

**Subtasks**:
- [ ] Setup Babel parser with TypeScript + JSX plugins
- [ ] Traverse AST to find FunctionDeclaration, ClassDeclaration
- [ ] Extract export/import statements
- [ ] Handle default exports vs named exports
- [ ] Extract JSDoc comments

**File**: `/src/vault-init/code-scanner/extractors/typescript-extractor.ts`

**Acceptance Criteria**:
- [ ] Extracts all functions and classes
- [ ] Correctly identifies exports
- [ ] Preserves JSDoc comments
- [ ] Handles parse errors gracefully (logs warning, continues)
- [ ] Unit test with 10+ TypeScript/JavaScript files

**Code Example**:
```typescript
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

export class TypeScriptExtractor {
  async extract(filePath: string): Promise<Component[]> {
    const code = await readFile(filePath, 'utf-8');

    try {
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });

      const components: Component[] = [];

      traverse(ast, {
        FunctionDeclaration(path) {
          components.push({
            type: 'function',
            name: path.node.id?.name,
            filePath,
            exports: this.extractExports(path),
            jsDoc: path.node.leadingComments,
          });
        },
      });

      return components;
    } catch (error) {
      logger.warn(`Failed to parse ${filePath}:`, error);
      return [];
    }
  }
}
```

---

#### TASK-015: Implement Python Extractor with Subprocess
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-003
- **Assignee**: Developer 1

**Description**: Use Python subprocess to run AST parser.

**Subtasks**:
- [ ] Write Python script to parse AST
- [ ] Extract functions, classes, modules
- [ ] Extract docstrings
- [ ] Serialize to JSON
- [ ] Call from Node.js via subprocess

**Files**:
- `/src/vault-init/code-scanner/extractors/python-extractor.ts`
- `/scripts/python-ast-parser.py`

**Acceptance Criteria**:
- [ ] Python script extracts all functions and classes
- [ ] Subprocess communication works reliably
- [ ] Handles Python syntax errors
- [ ] Unit test with 10+ Python files

**Python Script**:
```python
import ast
import json
import sys

def extract_components(file_path):
    with open(file_path) as f:
        tree = ast.parse(f.read())

    components = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            components.append({
                'type': 'function',
                'name': node.name,
                'docstring': ast.get_docstring(node),
                'filePath': file_path,
            })

    return components

# Read file paths from stdin
for line in sys.stdin:
    file_path = line.strip()
    try:
        components = extract_components(file_path)
        print(json.dumps(components))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
```

---

#### TASK-016: Implement Entry Point Detection
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-011
- **Assignee**: Developer 1

**Description**: Identify main entry points of the application.

**Entry Points to Detect**:
- `index.ts`, `index.js`, `main.ts`, `main.js`
- `app.ts`, `app.js`, `server.ts`, `server.js`
- `pages/_app.tsx` (Next.js)
- `app.py`, `main.py`, `manage.py` (Python)

**File**: `/src/vault-init/code-scanner/entry-point-detector.ts`

**Acceptance Criteria**:
- [ ] Detects all common entry points
- [ ] Returns prioritized list
- [ ] Framework-specific detection

---

#### TASK-017: Integrate All Scanner Components
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-010, TASK-011, TASK-012, TASK-014, TASK-015
- **Assignee**: Developer 1

**Description**: Create main `CodeScanner` class with `scan()` method.

**Subtasks**:
- [ ] Combine all sub-components
- [ ] Implement main `scan()` orchestrator method
- [ ] Add progress callbacks
- [ ] Add error handling

**File**: `/src/vault-init/code-scanner/code-scanner.ts`

**Acceptance Criteria**:
- [ ] `scan()` method returns complete `CodeScanResult`
- [ ] All sub-components integrated
- [ ] Progress callbacks work
- [ ] Integration test: scan real project

---

### Day 5: Code Scanner - Testing

#### TASK-018: Write Unit Tests for Framework Detection
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-010
- **Assignee**: Developer 1

**Description**: Comprehensive unit tests for framework detection.

**Subtasks**:
- [ ] Create 50+ test fixtures (real projects)
- [ ] Test each detector individually
- [ ] Test detection orchestrator
- [ ] Measure accuracy (target: 95%+)

**File**: `/tests/vault-init/framework-detection.test.ts`

**Acceptance Criteria**:
- [ ] 50+ test projects
- [ ] 95%+ detection accuracy
- [ ] Edge cases covered (no package.json, etc.)

---

#### TASK-019: Write Unit Tests for Component Extraction
- **Priority**: 🟡 High
- **Estimate**: 2 hours
- **Dependencies**: TASK-014, TASK-015
- **Assignee**: Developer 1

**Description**: Test TypeScript and Python extractors.

**Subtasks**:
- [ ] Test function extraction
- [ ] Test class extraction
- [ ] Test export detection
- [ ] Test error handling

**File**: `/tests/vault-init/component-extraction.test.ts`

**Acceptance Criteria**:
- [ ] 20+ test cases
- [ ] TypeScript and Python both covered
- [ ] Error cases tested

---

#### TASK-020: Performance Test for Code Scanner
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-017
- **Assignee**: Developer 1

**Description**: Verify scanner meets performance targets.

**Tests**:
- [ ] Scan 500-file project in < 10 seconds
- [ ] Memory usage < 100 MB
- [ ] Handles 1000+ files gracefully

**File**: `/tests/vault-init/scanner-performance.test.ts`

**Acceptance Criteria**:
- [ ] All performance targets met
- [ ] Benchmarks documented

---

#### TASK-021: Integration Test: Full Code Scan
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-017
- **Assignee**: Developer 1

**Description**: End-to-end test of complete code scanning.

**Test Projects**:
- Real TypeScript project
- Real Next.js project
- Real Python project

**File**: `/tests/vault-init/integration/code-scan.test.ts`

**Acceptance Criteria**:
- [ ] Successfully scans all 3 test projects
- [ ] Returns complete `CodeScanResult`
- [ ] No errors or warnings

---

#### TASK-022: Code Scanner Module Complete
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour (review/polish)
- **Dependencies**: TASK-021
- **Assignee**: Developer 1

**Description**: Final review and polish of Code Scanner module.

**Checklist**:
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Performance tests passing
- [ ] JSDoc documentation complete
- [ ] Code reviewed
- [ ] Linting passes
- [ ] TypeScript strict mode passes
- [ ] Module exported from barrel

---

## Week 2: Templates & Graph (Days 6-10)

### Day 6: Template System - Schema & Loader

#### TASK-023: Define Template Zod Schema
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-003
- **Assignee**: Developer 1

**Description**: Create Zod schema for template validation.

**Subtasks**:
- [ ] Define schema matching template YAML structure
- [ ] Add validation rules
- [ ] Export TypeScript type from schema

**File**: `/src/vault-init/template-system/template-schema.ts`

**Code Example**:
```typescript
import { z } from 'zod';

export const TemplateSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  detection: z.object({
    required_files: z.array(z.string()),
    optional_files: z.array(z.string()).optional(),
  }),
  vault_structure: z.object({
    directories: z.array(z.string()),
    templates: z.array(z.object({
      type: z.string(),
      path: z.string(),
      template: z.string(),
    })),
  }),
});

export type Template = z.infer<typeof TemplateSchema>;
```

**Acceptance Criteria**:
- [ ] Schema validates all required fields
- [ ] Clear error messages for invalid templates
- [ ] TypeScript type exported

---

#### TASK-024: Create TypeScript App Template
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-023
- **Assignee**: Developer 1

**Description**: Create YAML template for TypeScript applications.

**Subtasks**:
- [ ] Define template YAML
- [ ] Create Handlebars files (README, architecture, technical)
- [ ] Define vault directory structure
- [ ] Define graph node/edge mappings

**Files**:
- `/weaver/templates/typescript-app.yaml`
- `/weaver/templates/typescript-app/readme.md.hbs`
- `/weaver/templates/typescript-app/technical-node.md.hbs`
- `/weaver/templates/typescript-app/architecture-overview.md.hbs`

**Acceptance Criteria**:
- [ ] Template validates against schema
- [ ] All Handlebars files created
- [ ] Directory structure complete

---

#### TASK-025: Create Next.js App Template
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-023
- **Assignee**: Developer 1

**Description**: Create template for Next.js applications.

**Files**:
- `/weaver/templates/nextjs-app.yaml`
- `/weaver/templates/nextjs-app/*.hbs`

**Acceptance Criteria**:
- [ ] Template specific to Next.js features
- [ ] Includes routing concepts
- [ ] Validates successfully

---

#### TASK-026: Create Python App Template
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-023
- **Assignee**: Developer 1

**Description**: Create template for Python applications.

**Files**:
- `/weaver/templates/python-app.yaml`
- `/weaver/templates/python-app/*.hbs`

**Acceptance Criteria**:
- [ ] Supports Django, FastAPI, Flask
- [ ] Python-specific conventions
- [ ] Validates successfully

---

#### TASK-027: Create Monorepo & Generic Templates
- **Priority**: 🟡 High
- **Estimate**: 2 hours
- **Dependencies**: TASK-023
- **Assignee**: Developer 1

**Description**: Create templates for monorepo and generic projects.

**Files**:
- `/weaver/templates/monorepo.yaml` + handlebars
- `/weaver/templates/generic.yaml` + handlebars

**Acceptance Criteria**:
- [ ] Monorepo handles multiple services
- [ ] Generic is minimal fallback
- [ ] Both validate successfully

---

#### TASK-028: Implement Template Loader
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-024, TASK-025, TASK-026, TASK-027
- **Assignee**: Developer 1

**Description**: Create `TemplateLoader` class.

**Subtasks**:
- [ ] Load YAML from file
- [ ] Parse and validate with Zod
- [ ] Implement caching
- [ ] Handle template not found errors

**File**: `/src/vault-init/template-system/template-loader.ts`

**Acceptance Criteria**:
- [ ] Loads all 5 templates successfully
- [ ] Validates on load
- [ ] Caching works (no re-reads)
- [ ] Clear error messages

---

### Day 7: Template System - Handlebars Integration

#### TASK-029: Setup Handlebars Renderer
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-002
- **Assignee**: Developer 1

**Description**: Create Handlebars rendering system.

**Subtasks**:
- [ ] Create `TemplateRenderer` class
- [ ] Register custom helpers
- [ ] Add partials support

**File**: `/src/vault-init/template-system/template-renderer.ts`

**Acceptance Criteria**:
- [ ] Renders templates successfully
- [ ] Custom helpers work
- [ ] Partials supported

---

#### TASK-030: Implement Custom Handlebars Helpers
- **Priority**: 🟡 High
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-029
- **Assignee**: Developer 1

**Description**: Create custom helpers for vault-specific rendering.

**Helpers to Implement**:
- `wikilink` - Generate wikilink syntax
- `formatDate` - Format dates
- `capitalize` - Capitalize strings
- `pluralize` - Pluralize words
- `mermaidId` - Sanitize IDs for Mermaid

**File**: `/src/vault-init/template-system/handlebars-helpers.ts`

**Code Example**:
```typescript
Handlebars.registerHelper('wikilink', (title: string, alias?: string) => {
  return alias ? `[[${title}|${alias}]]` : `[[${title}]]`;
});

Handlebars.registerHelper('formatDate', (date: Date) => {
  return date.toISOString().split('T')[0];
});
```

**Acceptance Criteria**:
- [ ] All helpers implemented
- [ ] Unit tests for each helper
- [ ] Helpers work in templates

---

#### TASK-031: Implement Variable Extraction
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-022 (Code Scanner complete)
- **Assignee**: Developer 1

**Description**: Extract variables from `CodeScanResult` for template rendering.

**Variables to Extract**:
- `projectName` - From package.json or directory name
- `framework` - From scan result
- `dependencies` - List of dependencies
- `hasTesting` - Boolean, if Jest/Pytest detected
- `hasLinting` - Boolean, if ESLint detected
- `hasTypeScript` - Boolean

**File**: `/src/vault-init/template-system/variable-extractor.ts`

**Acceptance Criteria**:
- [ ] Extracts all variables
- [ ] Works with all 5 templates
- [ ] Unit tests for extraction logic

---

#### TASK-032: Template System Integration Test
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-028, TASK-029, TASK-031
- **Assignee**: Developer 1

**Description**: Test complete template system (load → render).

**Test Cases**:
- Load each template
- Extract variables from scan result
- Render all template files
- Verify output is valid markdown

**File**: `/tests/vault-init/template-system.test.ts`

**Acceptance Criteria**:
- [ ] All 5 templates render successfully
- [ ] Output is valid markdown
- [ ] No broken placeholders

---

### Day 8: Documentation Extractor

#### TASK-033: Implement README Parser
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-002
- **Assignee**: Developer 1

**Description**: Parse README.md and extract structured data.

**Subtasks**:
- [ ] Parse frontmatter with gray-matter
- [ ] Extract sections (Features, Technologies, etc.)
- [ ] Extract bullet points
- [ ] Handle missing README

**File**: `/src/vault-init/doc-extractor/readme-parser.ts`

**Acceptance Criteria**:
- [ ] Extracts all major sections
- [ ] Handles various README formats
- [ ] Unit test with 10+ READMEs

---

#### TASK-034: Implement JSDoc Extractor
- **Priority**: 🟡 High
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-014 (TypeScript extractor)
- **Assignee**: Developer 1

**Description**: Extract JSDoc comments from TypeScript/JavaScript.

**File**: `/src/vault-init/doc-extractor/jsdoc-extractor.ts`

**Acceptance Criteria**:
- [ ] Extracts JSDoc comments
- [ ] Preserves formatting
- [ ] Links to component definitions

---

#### TASK-035: Implement Python Docstring Extractor
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-015 (Python extractor)
- **Assignee**: Developer 1

**Description**: Extract docstrings from Python code.

**File**: `/src/vault-init/doc-extractor/docstring-extractor.ts`

**Acceptance Criteria**:
- [ ] Extracts module and function docstrings
- [ ] Preserves formatting
- [ ] Unit test with 5+ Python files

---

#### TASK-036: Implement OpenAPI/Swagger Detection
- **Priority**: 🟢 Medium
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-011
- **Assignee**: Developer 1

**Description**: Detect and parse OpenAPI/Swagger specs.

**Files to Detect**:
- `openapi.yaml`, `openapi.json`
- `swagger.yaml`, `swagger.json`

**File**: `/src/vault-init/doc-extractor/openapi-parser.ts`

**Acceptance Criteria**:
- [ ] Detects OpenAPI specs
- [ ] Extracts endpoints
- [ ] Handles v2 and v3 specs

---

#### TASK-037: Documentation Extractor Integration
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-033, TASK-034, TASK-035, TASK-036
- **Assignee**: Developer 1

**Description**: Create main `DocumentationExtractor` class.

**File**: `/src/vault-init/doc-extractor/doc-extractor.ts`

**Acceptance Criteria**:
- [ ] Orchestrates all extractors
- [ ] Returns `ExtractedDocs` object
- [ ] Integration test

---

### Day 9: Knowledge Graph Generator

#### TASK-038: Implement Taxonomy Mapper
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-022, TASK-028
- **Assignee**: Developer 1

**Description**: Map application structure to vault directories.

**Mappings**:
- Dependencies → `/technical/`
- Inferred concepts → `/concepts/`
- Features → `/features/`
- Components → `/components/`
- Architecture → `/architecture/`

**File**: `/src/vault-init/graph-generator/taxonomy-mapper.ts`

**Acceptance Criteria**:
- [ ] Correct mapping for all node types
- [ ] Handles edge cases (no dependencies, etc.)
- [ ] Unit test with multiple projects

---

#### TASK-039: Implement Node Generators
- **Priority**: 🔴 Critical
- **Estimate**: 3 hours
- **Dependencies**: TASK-038
- **Assignee**: Developer 1

**Description**: Create generators for each node type.

**Node Types**:
- `createConceptNode()`
- `createTechnicalNode()`
- `createFeatureNode()`
- `createComponentNode()`
- `createArchitectureNode()`

**File**: `/src/vault-init/graph-generator/node-generators.ts`

**Acceptance Criteria**:
- [ ] All 5 node types implemented
- [ ] Frontmatter generated correctly
- [ ] Content populated from scan result

---

#### TASK-040: Implement Wikilink Builder
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-039
- **Assignee**: Developer 1

**Description**: Build relationships and wikilinks between nodes.

**Relationships**:
- Feature → Technical (uses dependency)
- Component → Concept (implements concept)
- Architecture → Component (contains component)

**File**: `/src/vault-init/graph-generator/wikilink-builder.ts`

**Acceptance Criteria**:
- [ ] All relationships built correctly
- [ ] Bidirectional links created
- [ ] No broken wikilinks
- [ ] Graph completeness: all nodes have ≥ 1 link

---

#### TASK-041: Implement Mermaid Generator
- **Priority**: 🟡 High
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-040
- **Assignee**: Developer 1

**Description**: Generate Mermaid architecture diagrams.

**File**: `/src/vault-init/graph-generator/mermaid-generator.ts`

**Acceptance Criteria**:
- [ ] Generates valid Mermaid syntax
- [ ] Diagram renders in Obsidian
- [ ] Shows all major nodes and relationships

---

#### TASK-042: Knowledge Graph Generator Integration
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-041
- **Assignee**: Developer 1

**Description**: Create main `KnowledgeGraphGenerator` class.

**File**: `/src/vault-init/graph-generator/graph-generator.ts`

**Acceptance Criteria**:
- [ ] Orchestrates all sub-components
- [ ] Returns complete `VaultStructure`
- [ ] Integration test: scan → graph

---

### Day 10: Graph Generator Testing

#### TASK-043: Unit Tests for Taxonomy Mapping
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-038
- **Assignee**: Developer 1

**Description**: Test taxonomy mapping logic.

**File**: `/tests/vault-init/taxonomy-mapping.test.ts`

**Acceptance Criteria**:
- [ ] 10+ test cases
- [ ] All node types covered
- [ ] Edge cases tested

---

#### TASK-044: Unit Tests for Wikilink Building
- **Priority**: 🟡 High
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-040
- **Assignee**: Developer 1

**Description**: Test wikilink relationship building.

**File**: `/tests/vault-init/wikilink-building.test.ts`

**Acceptance Criteria**:
- [ ] All relationship types tested
- [ ] No broken links in test graphs
- [ ] Graph completeness verified

---

#### TASK-045: Integration Test: Scan → Graph
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-042
- **Assignee**: Developer 1

**Description**: End-to-end test from code scan to graph generation.

**Test Projects**:
- TypeScript project
- Next.js project
- Python project

**File**: `/tests/vault-init/integration/scan-to-graph.test.ts`

**Acceptance Criteria**:
- [ ] All 3 projects generate valid graphs
- [ ] No broken wikilinks
- [ ] Frontmatter valid YAML

---

## Week 3: AI & Finalization (Days 11-15)

### Day 11: AI Content Generator - Setup

#### TASK-046: Implement Content Cache (SQLite)
- **Priority**: 🟡 High
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-002
- **Assignee**: Developer 1

**Description**: Create SQLite-based content cache for AI-generated content.

**Subtasks**:
- [ ] Create `content_cache` table
- [ ] Implement `get()` and `set()` methods
- [ ] Add TTL support (24 hours default)
- [ ] Add cache invalidation

**File**: `/src/vault-init/ai-generator/content-cache.ts`

**Acceptance Criteria**:
- [ ] Cache stores and retrieves content
- [ ] TTL expiration works
- [ ] Unit tests for cache operations

---

#### TASK-047: Implement Claude-Flow MCP Integration
- **Priority**: 🟢 Medium
- **Estimate**: 2 hours
- **Dependencies**: TASK-046
- **Assignee**: Developer 1

**Description**: Integrate with Claude-Flow MCP tools for AI content generation.

**MCP Tools to Use**:
- `mcp__claude-flow__memory_usage` - Store/retrieve context
- `mcp__claude-flow__neural_patterns` - Generate content

**File**: `/src/vault-init/ai-generator/claude-flow-client.ts`

**Acceptance Criteria**:
- [ ] Can call MCP tools
- [ ] Stores project context in memory
- [ ] Retrieves context for generation

---

#### TASK-048: Implement Offline Mode Fallback
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-037
- **Assignee**: Developer 1

**Description**: Create fallback content generator when Claude-Flow unavailable.

**Fallback Strategy**:
- Use extracted documentation (README, comments)
- Generate basic descriptions from code structure
- Log warning about reduced quality

**File**: `/src/vault-init/ai-generator/offline-generator.ts`

**Acceptance Criteria**:
- [ ] Generates basic content without AI
- [ ] Uses extracted docs effectively
- [ ] Clear warnings logged

---

### Day 12: AI Content Generator - Prompts

#### TASK-049: Create Concept Description Prompts
- **Priority**: 🟢 Medium
- **Estimate**: 1 hour
- **Dependencies**: TASK-047
- **Assignee**: Developer 1

**Description**: Write prompts for AI concept description generation.

**Prompt Template**:
```
You are documenting a software project. Explain the concept "{concept}"
in the context of this {framework} application.

Project context:
{scanResult summary}

Provide a clear, concise explanation (2-3 paragraphs).
```

**File**: `/src/vault-init/ai-generator/prompts/concept-prompts.ts`

**Acceptance Criteria**:
- [ ] Prompt generates quality content
- [ ] Manual review of 10+ samples

---

#### TASK-050: Create Technical Documentation Prompts
- **Priority**: 🟢 Medium
- **Estimate**: 1 hour
- **Dependencies**: TASK-047
- **Assignee**: Developer 1

**Description**: Write prompts for technical dependency documentation.

**File**: `/src/vault-init/ai-generator/prompts/technical-prompts.ts`

**Acceptance Criteria**:
- [ ] Prompt generates useful docs
- [ ] Manual review

---

#### TASK-051: Implement AI Content Generator
- **Priority**: 🟢 Medium
- **Estimate**: 2 hours
- **Dependencies**: TASK-049, TASK-050
- **Assignee**: Developer 1

**Description**: Main AI generator class.

**Subtasks**:
- [ ] Integrate cache, MCP client, offline fallback
- [ ] Implement content generation methods
- [ ] Add rate limiting
- [ ] Track API costs

**File**: `/src/vault-init/ai-generator/ai-generator.ts`

**Acceptance Criteria**:
- [ ] Generates content for all node types
- [ ] Caching reduces API calls by 80%+
- [ ] Offline mode works
- [ ] Cost tracking functional

---

### Day 13: Vault Finalizer - File Writing

#### TASK-052: Implement Markdown File Writer
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-042
- **Assignee**: Developer 1

**Description**: Write markdown files with frontmatter to disk.

**Subtasks**:
- [ ] Format frontmatter as YAML
- [ ] Write files to correct paths
- [ ] Create directories as needed
- [ ] Atomic writes (temp file + rename)

**File**: `/src/vault-init/finalizer/file-writer.ts`

**Acceptance Criteria**:
- [ ] Writes all files correctly
- [ ] Frontmatter is valid YAML
- [ ] Atomic writes (rollback on error)

---

#### TASK-053: Implement Rollback Mechanism
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-052
- **Assignee**: Developer 1

**Description**: Rollback partial writes on error.

**Strategy**:
- Track all written files
- On error, delete all files
- Return to clean state

**File**: `/src/vault-init/finalizer/rollback.ts`

**Acceptance Criteria**:
- [ ] Rollback deletes all written files
- [ ] No partial vault left on error
- [ ] Unit test for rollback

---

### Day 14: Vault Finalizer - Shadow Cache & Git

#### TASK-054: Implement Shadow Cache Population
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-052
- **Assignee**: Developer 1

**Description**: Populate shadow cache with generated files.

**Subtasks**:
- [ ] Create `.weaver/shadow-cache.db`
- [ ] Insert all files into `files` table
- [ ] Store frontmatter, content, wikilinks
- [ ] Create indexes for fast queries

**File**: `/src/vault-init/finalizer/shadow-cache-populator.ts`

**Acceptance Criteria**:
- [ ] 100% of files indexed
- [ ] Queries work immediately
- [ ] Integration with existing shadow cache

---

#### TASK-055: Implement Git Initialization
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-052
- **Assignee**: Developer 1

**Description**: Initialize Git repository.

**Subtasks**:
- [ ] Run `git init`
- [ ] Create `.gitignore`
- [ ] Create initial commit
- [ ] Handle already-existing repo

**File**: `/src/vault-init/finalizer/git-initializer.ts`

**Acceptance Criteria**:
- [ ] Git repo initialized
- [ ] .gitignore created
- [ ] Initial commit made
- [ ] Doesn't overwrite existing repo

---

#### TASK-056: Generate Vault README
- **Priority**: 🟡 High
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-042
- **Assignee**: Developer 1

**Description**: Generate top-level README for vault.

**Contents**:
- Project overview
- Vault structure
- Navigation tips
- Links to key nodes

**File**: `/src/vault-init/finalizer/readme-generator.ts`

**Acceptance Criteria**:
- [ ] README is comprehensive
- [ ] Links to key nodes work
- [ ] Helpful for new users

---

#### TASK-057: Generate Concept Map
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-041
- **Assignee**: Developer 1

**Description**: Generate `concept-map.md` with Mermaid diagram.

**File**: `/src/vault-init/finalizer/concept-map-generator.ts`

**Acceptance Criteria**:
- [ ] Mermaid diagram renders
- [ ] Shows all major concepts
- [ ] Visual overview of graph

---

#### TASK-058: Vault Finalizer Integration
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-055, TASK-056, TASK-057
- **Assignee**: Developer 1

**Description**: Create main `VaultFinalizer` class.

**File**: `/src/vault-init/finalizer/finalizer.ts`

**Acceptance Criteria**:
- [ ] Orchestrates all finalization steps
- [ ] Progress callbacks work
- [ ] Error handling with rollback

---

### Day 15: CLI Tool

#### TASK-059: Implement CLI Command with Commander
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-002
- **Assignee**: Developer 1

**Description**: Create `weaver init` command.

**Subtasks**:
- [ ] Define command with Commander
- [ ] Add all options (--output, --template, --dry-run, etc.)
- [ ] Add help text

**File**: `/src/cli/commands/init.ts`

**Acceptance Criteria**:
- [ ] Command registered
- [ ] All options work
- [ ] Help text clear

---

#### TASK-060: Implement Interactive Prompts
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-059
- **Assignee**: Developer 1

**Description**: Add interactive prompts with Inquirer.

**Prompts**:
- App path (if not provided)
- Output path (if not provided)
- Template selection (list of 5)
- Confirmation before writing

**File**: `/src/cli/commands/init.ts` (extended)

**Acceptance Criteria**:
- [ ] All prompts work
- [ ] User can navigate with arrows
- [ ] Confirmation prompt shown

---

#### TASK-061: Implement Progress Reporting
- **Priority**: 🟡 High
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-060
- **Assignee**: Developer 1

**Description**: Add spinners and progress bars.

**Using**:
- `ora` for spinners (scanning, generating)
- `cli-progress` for file writing progress bar

**Acceptance Criteria**:
- [ ] Spinners show during long operations
- [ ] Progress bar shows file write progress
- [ ] Clear status messages

---

#### TASK-062: Implement Dry-Run Mode
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-058
- **Assignee**: Developer 1

**Description**: Show preview without writing files.

**Output**:
- Number of files to create
- Directory structure
- Summary of nodes

**Acceptance Criteria**:
- [ ] No files written in dry-run
- [ ] Accurate preview shown
- [ ] Summary helpful

---

#### TASK-063: Implement Error Handling
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-061
- **Assignee**: Developer 1

**Description**: Add comprehensive error handling.

**Error Cases**:
- Invalid app path
- Permission errors
- Parse errors
- Rollback on failure

**Acceptance Criteria**:
- [ ] All errors caught
- [ ] User-friendly error messages
- [ ] Recovery suggestions provided

---

#### TASK-064: CLI Integration Test
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-063
- **Assignee**: Developer 1

**Description**: Test CLI end-to-end.

**Test Cases**:
- Run with all options
- Run interactively
- Run dry-run
- Test error cases

**File**: `/tests/cli/init-command.test.ts`

**Acceptance Criteria**:
- [ ] All test cases pass
- [ ] CLI works as expected

---

## Week 4: Testing & Documentation (Days 16-20)

### Day 16: Integration Testing

#### TASK-065: E2E Test - TypeScript Project
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-064
- **Assignee**: Developer 1

**Description**: Full pipeline test with real TypeScript project.

**Test**:
1. Scan TypeScript project
2. Generate vault
3. Verify all files created
4. Verify shadow cache populated
5. Verify Git initialized

**File**: `/tests/vault-init/e2e/typescript-project.test.ts`

**Acceptance Criteria**:
- [ ] Complete vault generated
- [ ] All validation checks pass

---

#### TASK-066: E2E Test - Next.js Project
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-064
- **Assignee**: Developer 1

**Description**: Full pipeline test with real Next.js project.

**File**: `/tests/vault-init/e2e/nextjs-project.test.ts`

**Acceptance Criteria**:
- [ ] Next.js template applied correctly
- [ ] Vault generated successfully

---

#### TASK-067: E2E Test - Python Project
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-064
- **Assignee**: Developer 1

**Description**: Full pipeline test with real Python project.

**File**: `/tests/vault-init/e2e/python-project.test.ts`

**Acceptance Criteria**:
- [ ] Python template applied
- [ ] Vault generated successfully

---

#### TASK-068: E2E Test - Offline Mode
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-048
- **Assignee**: Developer 1

**Description**: Test vault generation without Claude-Flow.

**File**: `/tests/vault-init/e2e/offline-mode.test.ts`

**Acceptance Criteria**:
- [ ] Vault generated without AI
- [ ] Basic content present

---

#### TASK-069: E2E Test - Error Recovery
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-053
- **Assignee**: Developer 1

**Description**: Test rollback on errors.

**Test Cases**:
- Simulate write error
- Verify rollback deletes files
- Verify no partial vault

**File**: `/tests/vault-init/e2e/error-recovery.test.ts`

**Acceptance Criteria**:
- [ ] Rollback works correctly
- [ ] No partial state left

---

### Day 17: Unit Test Coverage

#### TASK-070: Increase Unit Test Coverage to 80%+
- **Priority**: 🔴 Critical
- **Estimate**: 4 hours
- **Dependencies**: All module tasks
- **Assignee**: Developer 1

**Description**: Write additional unit tests to reach 80%+ coverage.

**Focus Areas**:
- Edge cases
- Error paths
- Boundary conditions

**Acceptance Criteria**:
- [ ] Overall coverage ≥ 80%
- [ ] All modules ≥ 75%
- [ ] Coverage report generated

---

#### TASK-071: Mock Claude-Flow for Tests
- **Priority**: 🟡 High
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-047
- **Assignee**: Developer 1

**Description**: Create mock MCP client for testing.

**File**: `/tests/vault-init/mocks/mcp-client.mock.ts`

**Acceptance Criteria**:
- [ ] Mock implements MCP interface
- [ ] Returns test data
- [ ] Used in all AI tests

---

#### TASK-072: CI/CD Integration
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-070
- **Assignee**: Developer 1

**Description**: Ensure tests run in CI/CD.

**Subtasks**:
- [ ] Add test script to package.json
- [ ] Verify GitHub Actions runs tests
- [ ] Add coverage reporting

**Acceptance Criteria**:
- [ ] Tests run in CI
- [ ] Coverage reported
- [ ] Failing tests block merge

---

### Day 18: Performance Testing

#### TASK-073: Performance Benchmark - Small App
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-064
- **Assignee**: Developer 1

**Description**: Benchmark initialization time for small app.

**Test**:
- App with < 50 files
- Measure total time
- Target: < 30 seconds

**File**: `/tests/vault-init/performance/small-app.bench.ts`

**Acceptance Criteria**:
- [ ] Benchmark completes in < 30s
- [ ] Results documented

---

#### TASK-074: Performance Benchmark - Medium App
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-064
- **Assignee**: Developer 1

**Description**: Benchmark for medium app (50-500 files).

**Target**: 1-3 minutes

**File**: `/tests/vault-init/performance/medium-app.bench.ts`

**Acceptance Criteria**:
- [ ] Completes in 1-3 minutes
- [ ] Results documented

---

#### TASK-075: Performance Benchmark - Large App
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-064
- **Assignee**: Developer 1

**Description**: Benchmark for large app (500+ files).

**Target**: 3-10 minutes

**File**: `/tests/vault-init/performance/large-app.bench.ts`

**Acceptance Criteria**:
- [ ] Completes in 3-10 minutes
- [ ] Results documented

---

#### TASK-076: Memory Usage Monitoring
- **Priority**: 🟢 Medium
- **Estimate**: 1 hour
- **Dependencies**: TASK-073
- **Assignee**: Developer 1

**Description**: Monitor peak memory usage.

**Target**: < 200 MB

**File**: `/tests/vault-init/performance/memory-usage.test.ts`

**Acceptance Criteria**:
- [ ] Memory usage tracked
- [ ] Stays under 200 MB
- [ ] Results documented

---

### Day 19: Documentation - User Guide

#### TASK-077: Write User Guide Introduction
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: None
- **Assignee**: Developer 1

**Description**: Write introduction and overview.

**Sections**:
- What is vault initialization?
- When to use it
- Prerequisites

**File**: `/weaver/docs/vault-initialization-guide.md`

**Acceptance Criteria**:
- [ ] Clear introduction
- [ ] Easy to understand

---

#### TASK-078: Write CLI Usage Examples
- **Priority**: 🔴 Critical
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-064
- **Assignee**: Developer 1

**Description**: Document all CLI usage patterns.

**Examples**:
- Basic usage
- With options
- Interactive mode
- Dry-run mode

**Acceptance Criteria**:
- [ ] 5+ examples
- [ ] All options documented
- [ ] Copy-paste ready

---

#### TASK-079: Write Template Selection Guide
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-027
- **Assignee**: Developer 1

**Description**: Help users choose the right template.

**Content**:
- When to use each template
- Template features comparison
- Customization options

**Acceptance Criteria**:
- [ ] Clear guidance
- [ ] Comparison table
- [ ] Example outputs

---

#### TASK-080: Write Troubleshooting Section
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-063
- **Assignee**: Developer 1

**Description**: Document common issues and solutions.

**Issues**:
- Framework detection fails
- Parse errors
- Permission errors
- Performance issues

**Acceptance Criteria**:
- [ ] 10+ common issues
- [ ] Clear solutions
- [ ] Recovery steps

---

### Day 20: Documentation - Developer Guide & Examples

#### TASK-081: Write Developer Guide - Architecture
- **Priority**: 🟡 High
- **Estimate**: 2 hours
- **Dependencies**: All implementation tasks
- **Assignee**: Developer 1

**Description**: Document architecture and design.

**Sections**:
- Architecture overview
- Module design
- Data flow
- Extension points

**File**: `/weaver/docs/vault-init-development.md`

**Acceptance Criteria**:
- [ ] Complete architecture docs
- [ ] Diagrams included
- [ ] Extension points clear

---

#### TASK-082: Write Developer Guide - Adding Templates
- **Priority**: 🟡 High
- **Estimate**: 1.5 hours
- **Dependencies**: TASK-027
- **Assignee**: Developer 1

**Description**: Guide for adding new templates.

**Content**:
- Template structure
- YAML schema
- Handlebars files
- Testing templates

**Acceptance Criteria**:
- [ ] Step-by-step guide
- [ ] Example template included
- [ ] Testing instructions

---

#### TASK-083: Write Developer Guide - Extending Scanner
- **Priority**: 🟢 Medium
- **Estimate**: 1 hour
- **Dependencies**: TASK-022
- **Assignee**: Developer 1

**Description**: Guide for adding new framework detectors.

**Content**:
- Detector interface
- Detection logic
- Testing detectors

**Acceptance Criteria**:
- [ ] Clear instructions
- [ ] Example detector
- [ ] Test examples

---

#### TASK-084: Generate API Reference
- **Priority**: 🟢 Medium
- **Estimate**: 1.5 hours
- **Dependencies**: All implementation tasks
- **Assignee**: Developer 1

**Description**: Generate API documentation from JSDoc.

**Tool**: TypeDoc or similar

**File**: `/weaver/docs/api/vault-init.md`

**Acceptance Criteria**:
- [ ] All public APIs documented
- [ ] Examples included
- [ ] Searchable

---

#### TASK-085: Generate Example Vault - TypeScript
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-065
- **Assignee**: Developer 1

**Description**: Generate example vault from TypeScript project.

**Process**:
1. Run `weaver init` on real TypeScript project
2. Save generated vault to `/examples/typescript-vault/`
3. Take screenshots

**Acceptance Criteria**:
- [ ] Complete vault saved
- [ ] README included
- [ ] Screenshots taken

---

#### TASK-086: Generate Example Vaults - Remaining Templates
- **Priority**: 🟡 High
- **Estimate**: 2 hours
- **Dependencies**: TASK-085
- **Assignee**: Developer 1

**Description**: Generate example vaults for Next.js, Python, Monorepo, Generic.

**Files**:
- `/examples/nextjs-vault/`
- `/examples/python-vault/`
- `/examples/monorepo-vault/`
- `/examples/generic-vault/`

**Acceptance Criteria**:
- [ ] All 4 vaults generated
- [ ] Screenshots for each
- [ ] READMEs included

---

#### TASK-087: Create Comparison Guide
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-086
- **Assignee**: Developer 1

**Description**: Visual comparison of all 5 example vaults.

**Content**:
- Side-by-side screenshots
- Structure comparison
- Feature comparison table

**File**: `/weaver/docs/vault-comparison-guide.md`

**Acceptance Criteria**:
- [ ] All 5 vaults compared
- [ ] Screenshots clear
- [ ] Differences highlighted

---

#### TASK-088: Add Inline JSDoc to All Modules
- **Priority**: 🟢 Medium
- **Estimate**: 3 hours
- **Dependencies**: All implementation tasks
- **Assignee**: Developer 1

**Description**: Add comprehensive JSDoc comments to all public APIs.

**Standard**:
- Every public class, method, interface documented
- Examples included for complex APIs
- Parameter and return types documented

**Acceptance Criteria**:
- [ ] All public APIs have JSDoc
- [ ] Examples where helpful
- [ ] TypeDoc generates clean docs

---

### Final Tasks

#### TASK-089: Code Review & Refactoring
- **Priority**: 🟡 High
- **Estimate**: 3 hours
- **Dependencies**: All implementation tasks
- **Assignee**: Developer 1

**Description**: Review all code for quality and consistency.

**Checklist**:
- [ ] Remove dead code
- [ ] Improve naming
- [ ] Extract magic numbers to constants
- [ ] Refactor duplicated code

**Acceptance Criteria**:
- [ ] Code is clean and consistent
- [ ] No linting errors
- [ ] TypeScript strict mode passes

---

#### TASK-090: TypeScript Strict Mode Check
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-089
- **Assignee**: Developer 1

**Description**: Ensure TypeScript strict mode passes with 0 errors.

**Command**: `bun run typecheck`

**Acceptance Criteria**:
- [ ] 0 TypeScript errors
- [ ] Strict mode enabled
- [ ] All types explicit

---

#### TASK-091: Linting Pass
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-089
- **Assignee**: Developer 1

**Description**: Fix all linting errors and warnings.

**Command**: `bun run lint`

**Acceptance Criteria**:
- [ ] 0 linting errors
- [ ] 0 linting warnings
- [ ] Consistent code style

---

#### TASK-092: Build & Package
- **Priority**: 🔴 Critical
- **Estimate**: 30 minutes
- **Dependencies**: TASK-090, TASK-091
- **Assignee**: Developer 1

**Description**: Verify build works and package is correct.

**Commands**:
```bash
bun run build
bun run typecheck
bun run lint
```

**Acceptance Criteria**:
- [ ] Build completes successfully
- [ ] Output files created
- [ ] Package size reasonable

---

#### TASK-093: Integration with Existing Weaver Tests
- **Priority**: 🔴 Critical
- **Estimate**: 1 hour
- **Dependencies**: TASK-092
- **Assignee**: Developer 1

**Description**: Ensure existing Weaver tests still pass.

**Command**: `bun test`

**Acceptance Criteria**:
- [ ] All existing tests pass
- [ ] No breaking changes
- [ ] New tests integrated

---

#### TASK-094: Final Documentation Review
- **Priority**: 🟡 High
- **Estimate**: 1 hour
- **Dependencies**: TASK-088
- **Assignee**: Developer 1

**Description**: Review all documentation for completeness and accuracy.

**Checklist**:
- [ ] User guide complete
- [ ] Developer guide complete
- [ ] API reference complete
- [ ] Examples complete
- [ ] README updated

**Acceptance Criteria**:
- [ ] All docs reviewed
- [ ] No broken links
- [ ] Consistent formatting

---

#### TASK-095: Final Testing & Sign-off
- **Priority**: 🔴 Critical
- **Estimate**: 2 hours
- **Dependencies**: TASK-093, TASK-094
- **Assignee**: Developer 1

**Description**: Final comprehensive testing before release.

**Tests**:
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Performance benchmarks met
- [ ] Manual testing on 3+ real projects

**Acceptance Criteria**:
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Ready for deployment

---

## Critical Path

The critical path (tasks that must complete on time) includes:

**Week 1**:
- TASK-001 → TASK-003 → TASK-005 → TASK-010 → TASK-011 → TASK-014 → TASK-017 → TASK-022

**Week 2**:
- TASK-023 → TASK-024 → TASK-028 → TASK-033 → TASK-038 → TASK-039 → TASK-040 → TASK-042

**Week 3**:
- TASK-046 → TASK-052 → TASK-054 → TASK-055 → TASK-058 → TASK-059 → TASK-060 → TASK-064

**Week 4**:
- TASK-065 → TASK-070 → TASK-077 → TASK-085 → TASK-089 → TASK-090 → TASK-095

**Total Critical Path**: ~35 tasks

---

## Task Dependencies

### Dependency Graph (Simplified)

```
TASK-001 (Setup)
  ├─→ TASK-002 (Install deps)
  ├─→ TASK-003 (Define types)
  └─→ TASK-004 (Test setup)

TASK-003
  └─→ TASK-005 (Framework detector interface)
        ├─→ TASK-006 (Next.js detector)
        ├─→ TASK-007 (Python detectors)
        ├─→ TASK-008 (Express/React detectors)
        └─→ TASK-009 (Generic detector)
              └─→ TASK-010 (Detection orchestrator)

TASK-010, TASK-011, TASK-012, TASK-014, TASK-015
  └─→ TASK-017 (Scanner integration)
        └─→ TASK-022 (Scanner complete)

TASK-023 (Template schema)
  ├─→ TASK-024 (TypeScript template)
  ├─→ TASK-025 (Next.js template)
  ├─→ TASK-026 (Python template)
  └─→ TASK-027 (Monorepo/Generic templates)
        └─→ TASK-028 (Template loader)

... (and so on for all 95 tasks)
```

---

## Next Steps

1. ✅ Constitution refined
2. ✅ Specification elaborated
3. ✅ Implementation plan created
4. ✅ Task breakdown complete
5. ⏭️ **Begin implementation** with `/speckit.implement`

---

**Generated**: 2025-10-24T03:00:00.000Z
**Status**: Task breakdown complete and ready for implementation
**Total Tasks**: 95
**Estimated Duration**: 15-20 days (4 weeks)
**Start Date**: TBD
**Target Completion**: TBD
