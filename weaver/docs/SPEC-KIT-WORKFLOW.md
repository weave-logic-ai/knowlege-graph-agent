# Spec-Kit Workflow - Complete Guide

## Overview

The Spec-Kit workflow automates specification generation and task syncing for development phases.

**Flow**: Phase Planning Doc → Constitution + Specification + Tasks → Sync to Phase Doc

## Required Format Standards

### 1. Task Numbering Format

Tasks MUST use the format: `### X.Y Task Name`

```markdown
✅ CORRECT:
### 1.1 Install Claude SDK and configure client
### 2.3 Add rule execution logging

❌ WRONG:
### Task 1: Install Claude SDK and configure client
### Task 2.3: Add rule execution logging
```

### 2. Task Metadata Format

Metadata MUST be on a single line with pipe separators:

```markdown
✅ CORRECT:
**Effort**: 2 hours | **Priority**: High | **Dependencies**: 1.1

❌ WRONG:
**Priority**: High
**Status**: pending
**Dependencies**: None
**Effort**: 2 hours
```

### 3. Metadata Field Requirements

**Required Fields**:
- `sourceDocument` (camelCase, not snake_case) - absolute path to phase document
- `phaseId` - Phase identifier (e.g., "PHASE-6")
- `phaseName` - Human-readable phase name
- `generatedAt` - ISO timestamp

**Task Fields**:
- `**Effort**: X hours` - Time estimate
- `**Priority**: High|Medium|Low` - Task priority
- `**Dependencies**: X.Y, X.Z` or `None` - Task dependencies

**Deprecated Fields** (will show warnings):
- `source_document` → Use `sourceDocument` instead
- `phase_id` → Use `phaseId` instead
- `phase_name` → Use `phaseName` instead
- `generated_at` → Use `generatedAt` instead

### 4. Phase Document Section Header

Phase documents MUST have this exact header:

```markdown
## 📋 Implementation Tasks
```

## Validation

Validate phase documents before generating specs:

```bash
# Validate specific phase
bun run validate-spec phase-6

# Validate all phases
bun run validate-spec

# Validate with full path
bun run validate-spec /path/to/phase-6-vault-initialization.md
```

**Validation Checks**:
- ✅ Has "## 📋 Implementation Tasks" section
- ✅ Tasks use "### X.Y Task Name" format (not "### Task X.Y:")
- ✅ Metadata on single line with pipes
- ✅ No **Status**: field in tasks
- ✅ Metadata uses camelCase (not snake_case)
- ✅ All required metadata fields present

## Workflow Commands

### 1. Generate Spec-Kit Files

```bash
bun run generate-spec <phase-id>
```

Generates:
- `constitution.md` - Principles and constraints
- `specification.md` - Requirements and deliverables
- `tasks.md` - Task breakdown with correct format
- `.speckit/metadata.json` - Metadata with camelCase fields
- `README.md` - Guide for next steps

### 2. Sync Tasks to Phase Document

```bash
bun run sync-tasks-simple phase-6
```

Syncs task checkboxes from `tasks.md` back to phase document.

**Backward Compatibility**: The sync script handles both old and new formats:
- ✅ New format: `### X.Y Task Name` with single-line metadata
- ✅ Old format: Multi-line metadata (with deprecation warning)

### 3. Validate Phase Document

```bash
bun run validate-spec phase-6
```

Checks format compliance and provides fix suggestions.

## Migration Guide

### Updating Existing Metadata (snake_case → camelCase)

If you have existing specs with snake_case metadata:

```javascript
// Old format (deprecated)
{
  "phase_id": "PHASE-6",
  "phase_name": "Vault Initialization",
  "source_document": "/path/to/phase.md",
  "generated_at": "2025-10-24T05:34:48.855Z"
}

// New format (required)
{
  "phaseId": "PHASE-6",
  "phaseName": "Vault Initialization",
  "sourceDocument": "/path/to/phase.md",
  "generatedAt": "2025-10-24T05:34:48.855Z"
}
```

**Migration**:
1. Run `bun run validate-spec` to find deprecated fields
2. Regenerate metadata with `bun run generate-spec <phase-id>`
3. Verify with `bun run validate-spec <phase-id>`

### Updating Task Format

If you have tasks in old format:

```markdown
❌ OLD FORMAT:
### Task 1.1: Install MCP SDK
**Priority**: High
**Dependencies**: None
**Effort**: 2 hours

✅ NEW FORMAT:
### 1.1 Install MCP SDK
**Effort**: 2 hours | **Priority**: High | **Dependencies**: None
```

**Migration**: Regenerate `tasks.md` with `/speckit.tasks` command or `bun run generate-spec`.

## Testing

Run the complete E2E test suite:

```bash
bun run test tests/spec-kit/e2e-workflow.test.ts
```

**Tests Validate**:
- ✅ Phase document parsing
- ✅ Task generation in correct format
- ✅ Metadata creation with camelCase
- ✅ Task count matching
- ✅ Format compliance (no Status field, single-line metadata)
- ✅ Edge cases (minimal phase, empty tasks)

## Troubleshooting

### Error: Missing "## 📋 Implementation Tasks" section

**Fix**: Add this section header to your phase document before task list.

### Warning: Metadata uses deprecated "source_document"

**Fix**: Run `bun run generate-spec <phase-id>` to regenerate metadata with camelCase.

### Error: Task format incorrect "### Task X.Y:"

**Fix**: Use format `### X.Y Task Name` instead.

### Warning: Multi-line metadata detected

**Fix**: Combine metadata fields on single line with pipes:
```markdown
**Effort**: 2 hours | **Priority**: High | **Dependencies**: 1.1
```

## Architecture

**Core Modules**:
- `src/spec-generator/parser.ts` - Parses phase documents
- `src/spec-generator/generator.ts` - Generates constitution and specification
- `src/spec-generator/task-generator.ts` - Generates tasks.md with correct format
- `src/spec-generator/metadata-writer.ts` - Writes metadata.json with camelCase
- `scripts/validate-spec.ts` - Validates phase document format
- `scripts/sync-tasks-simple.ts` - Syncs tasks (with backward compatibility)

**Test Suite**:
- `tests/spec-kit/e2e-workflow.test.ts` - End-to-end workflow tests
- `tests/spec-kit/fixtures/` - Test data and sample phase documents

## Best Practices

1. **Always validate before generating**: Run `validate-spec` to catch issues early
2. **Use single-line metadata**: Easier to parse and more compact
3. **Avoid Status field**: Task status is tracked in phase document checkboxes
4. **Use camelCase in metadata**: Consistent with JavaScript/TypeScript conventions
5. **Keep task numbers sequential**: 1.1, 1.2, 2.1, 2.2, etc.
6. **Group related tasks**: Use category headers (## Category Name)

## See Also

- Full documentation: `/home/aepod/dev/weave-nn/weaver/docs/SPEC-KIT-WORKFLOW.md`
- Example phase: `tests/spec-kit/fixtures/sample-phase.md`
- E2E tests: `tests/spec-kit/e2e-workflow.test.ts`
