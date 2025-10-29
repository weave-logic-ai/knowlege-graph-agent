---
type: standard
title: Code Quality Checklist
status: active
created_date: '2025-10-24'
tags:
  - standards
  - code-quality
  - development
  - testing
cssclasses:
  - standard
  - checklist
visual:
  icon: 📄
  cssclasses:
    - type-standard
    - status-active
version: '3.0'
updated_date: '2025-10-28'
icon: 📄
---

# Code Quality Checklist

**CRITICAL RULE**: All tasks MUST pass the following checks before being marked as complete.

## Pre-Completion Checklist

### 1. Type Checking ✅
```bash
bun run typecheck
# OR
tsc --noEmit
```

**Must**: Pass with zero errors

### 2. Linting ✅
```bash
bun run lint
# OR
eslint src --ext .ts
```

**Must**: Pass with zero errors

### 3. Build Verification ✅
```bash
bun run build
```

**Must**: Complete successfully without errors

### 4. Code Review
- [ ] No hardcoded secrets or API keys
- [ ] Error handling implemented
- [ ] Logging added for important operations
- [ ] Comments added for complex logic
- [ ] Functions are focused and single-purpose



## Related

[[standards-overview-hub]]
## Task Completion Flow

```
1. Implement feature/fix
2. Run typecheck → Must pass
3. Run lint → Must pass
4. Run build → Must pass
5. Manual testing → Must work
6. Mark task as complete ✅
```

## Quality Standards

### TypeScript
- **Strict mode enabled**: No `any` types without justification
- **Null safety**: Handle undefined/null cases
- **Type inference**: Let TypeScript infer when possible
- **Explicit returns**: Define return types for public functions

### Code Style
- **Formatting**: Consistent with project ESLint config
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **Imports**: Sorted and organized (Node builtins → external → internal)
- **Comments**: JSDoc for public APIs, inline for complex logic

### Error Handling
- **Try-catch**: All async operations wrapped
- **Logging**: Errors logged with context
- **User messages**: Clear error messages for user-facing issues
- **Recovery**: Graceful degradation when possible

### Testing
- **Manual testing**: Feature tested in real environment
- **Edge cases**: Null, empty, invalid inputs handled
- **Integration**: Component works with rest of system

## Exceptions

When checks cannot be run (e.g., documentation-only changes):
- Document reason in commit message
- Get explicit approval before merging

## Enforcement

This checklist is **mandatory** for:
- ✅ All code changes in `/weaver`
- ✅ All TypeScript/JavaScript implementations
- ✅ All features marked in phase planning documents

**No exceptions** without explicit discussion and approval.

---

*Last Updated*: 2025-10-24
*Owner*: Weave-NN Development Team
