# TypeScript Build Errors - Categorized Fix Guide

**Total Errors**: 184
**Status**: CRITICAL BLOCKER
**Priority**: Fix immediately before any other work

---

## Error Categories & Fix Strategies

### Category 1: Chunking Type System Mismatches (~60 errors)

**Root Cause**: Mismatch between `BaseChunker` abstract class and `Chunker` interface

#### Affected Files:
- `src/chunking/plugins/base-chunker.ts`
- `src/chunking/types.ts`
- `src/chunking/plugins/event-based-chunker.ts`
- `src/chunking/plugins/semantic-boundary-chunker.ts`
- `src/chunking/plugins/preference-signal-chunker.ts`
- `src/chunking/plugins/step-based-chunker.ts`

#### Specific Errors:

**Error**: `'"../types.js"' has no exported member named 'ChunkingStrategy'`
```typescript
// src/chunking/plugins/base-chunker.ts:8
import type {
  ChunkingStrategy,  // ❌ Not exported from types.ts
  ParsedContent,     // ❌ Not exported from types.ts
  Boundary,          // ❌ Not exported from types.ts
```

**Fix Strategy**:
1. Export missing types from `types.ts`:
   ```typescript
   // Add to src/chunking/types.ts
   export type ChunkingStrategy = string; // Or proper definition
   export interface ParsedContent {
     content: string;
     frontmatter?: Record<string, unknown>;
   }
   export interface Boundary {
     start: number;
     end: number;
     type: BoundaryType;
   }
   ```

**Error**: Method signature mismatch
```typescript
// BaseChunker expects:
abstract chunk(content: ParsedContent): Promise<Chunk[]>;

// Implementations provide:
chunk(document: string, config: ChunkingConfig): Promise<ChunkingResult>;
```

**Fix Strategy**:
1. Align method signatures:
   ```typescript
   // Option A: Update BaseChunker to match implementations
   abstract chunk(document: string, config: ChunkingConfig): Promise<ChunkingResult>;

   // Option B: Update implementations to match BaseChunker
   chunk(content: ParsedContent): Promise<Chunk[]>
   ```

**Recommendation**: Use Option A (update BaseChunker) since implementations are more complete.

#### Property Access on ChunkMetadata

**Error**: `Property 'strategyMetadata' does not exist on type 'ChunkMetadata'`
```typescript
// src/chunking/plugins/base-chunker.ts:34
metadata.strategyMetadata  // ❌ Not defined in ChunkMetadata
```

**Fix Strategy**:
1. Add to ChunkMetadata interface:
   ```typescript
   export interface ChunkMetadata {
     // ... existing fields
     strategy_metadata?: Record<string, unknown>;
   }
   ```

---

### Category 2: Learning Loop Type Issues (~40 errors)

**Root Cause**: Custom error properties and missing null guards

#### Affected Files:
- `src/learning-loop/reasoning.ts`
- `src/learning-loop/reflection.ts`
- `src/learning-loop/execution.ts`

#### Specific Errors:

**Error**: Custom error properties
```typescript
// Multiple files
throw new Error('message', { error: originalError });  // ❌ Error doesn't accept options
```

**Fix Strategy**:
1. Create proper error subclass:
   ```typescript
   class LearningLoopError extends Error {
     constructor(message: string, public cause?: Error) {
       super(message);
       this.name = 'LearningLoopError';
     }
   }

   // Usage:
   throw new LearningLoopError('message', originalError);
   ```

**Error**: Unused declared variables
```typescript
// src/learning-loop/reflection.ts:14
import type { FeedbackContext } from './types.js';  // ❌ Never used
```

**Fix Strategy**:
1. Remove unused imports
2. Or use `// eslint-disable-next-line @typescript-eslint/no-unused-vars`

---

### Category 3: Perception Module Null Safety (~30 errors)

**Root Cause**: Missing undefined checks on optional properties

#### Affected Files:
- `src/perception/content-processor.ts`
- `src/perception/search-api.ts`
- `src/perception/web-scraper.ts`

#### Specific Errors:

**Error**: `Object is possibly 'undefined'`
```typescript
// src/perception/content-processor.ts:125
const title = result.title;  // ❌ result might be undefined
const url = result.url;      // ❌ result might be undefined
```

**Fix Strategy**:
1. Add null guards:
   ```typescript
   if (!result) {
     throw new Error('Result is undefined');
   }
   const title = result.title;
   const url = result.url;

   // Or use optional chaining:
   const title = result?.title ?? 'Untitled';
   const url = result?.url ?? '';
   ```

**Error**: Type 'unknown' on API responses
```typescript
// src/perception/search-api.ts:145
const items = data.items;  // ❌ data is 'unknown'
```

**Fix Strategy**:
1. Add type assertion with validation:
   ```typescript
   interface SearchApiResponse {
     items?: Array<{
       title: string;
       link: string;
       snippet?: string;
     }>;
   }

   const response = data as SearchApiResponse;
   if (!response.items) {
     throw new Error('Invalid API response');
   }
   const items = response.items;
   ```

**Error**: Missing module 'playwright'
```typescript
// src/perception/web-scraper.ts:66
import { chromium } from 'playwright';  // ❌ Module not found
```

**Fix Strategy**:
1. Add to package.json:
   ```json
   "dependencies": {
     "playwright": "^1.40.0"
   },
   "devDependencies": {
     "@types/playwright": "^1.40.0"
   }
   ```
2. Or make playwright optional:
   ```typescript
   let chromium: any;
   try {
     chromium = await import('playwright').then(m => m.chromium);
   } catch {
     throw new Error('Playwright not installed. Run: npm install playwright');
   }
   ```

---

### Category 4: Error Override Modifiers (~20 errors)

**Root Cause**: TypeScript 5.7 requires `override` keyword for inherited properties

#### Affected Files:
- `src/chunking/chunk-manager.ts`
- `src/chunking/chunk-storage.ts`
- `src/chunking/document-parser.ts`

#### Specific Errors:

**Error**: Missing 'override' modifier
```typescript
// src/chunking/chunk-manager.ts:20
export class ChunkingError extends Error {
  constructor(public readonly message: string) {  // ❌ Needs 'override'
    super(message);
  }
}
```

**Fix Strategy**:
1. Add override keyword:
   ```typescript
   export class ChunkingError extends Error {
     constructor(public override readonly message: string) {
       super(message);
     }
   }
   ```

---

### Category 5: Index Signature Access (~14 errors)

**Root Cause**: TypeScript strict mode requires bracket notation for index signatures

#### Affected Files:
- `src/chunking/document-parser.ts`

#### Specific Errors:

**Error**: Must use bracket notation
```typescript
// src/chunking/document-parser.ts:67
const title = frontmatter.title;  // ❌ Index signature access
```

**Fix Strategy**:
1. Use bracket notation:
   ```typescript
   const title = frontmatter['title'];
   ```
2. Or add proper type:
   ```typescript
   interface Frontmatter {
     title?: string;
     tags?: string[];
     doc_id?: string;
     // ... other known properties
   }

   const frontmatter = parsed.data as Frontmatter;
   const title = frontmatter.title;  // ✅ Now okay
   ```

**Recommendation**: Use proper typing (Option 2) for better type safety.

---

### Category 6: Unused Variables (~20 errors)

**Root Cause**: Declared variables/imports never used

#### Affected Files:
- `scripts/sops/feature-planning.ts`
- `src/chunking/chunk-storage.ts`
- `src/perception/content-processor.ts`

#### Specific Errors:

**Error**: Variable declared but never used
```typescript
// scripts/sops/feature-planning.ts:51
const input = await prompt();  // ❌ Never used
```

**Fix Strategy**:
1. Remove unused code:
   ```typescript
   // Just remove the line if truly unused
   ```
2. Or prefix with underscore:
   ```typescript
   const _input = await prompt();  // Indicates intentionally unused
   ```
3. Or disable check:
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-unused-vars
   const input = await prompt();
   ```

---

## Fix Priority Order

### Priority 1: CRITICAL (Fix First - Blocks Everything)

1. **Chunking type system** (60 errors)
   - Export missing types from `types.ts`
   - Align method signatures
   - Add missing ChunkMetadata properties
   - **Estimated time**: 4-6 hours

2. **Add playwright dependency**
   - Update package.json
   - **Estimated time**: 5 minutes

### Priority 2: HIGH (Fix Second - Type Safety)

3. **Perception null guards** (30 errors)
   - Add undefined checks
   - Type API responses
   - **Estimated time**: 3-4 hours

4. **Learning loop errors** (40 errors)
   - Create proper error classes
   - Fix error handling
   - **Estimated time**: 2-3 hours

### Priority 3: MEDIUM (Fix Third - Code Quality)

5. **Index signature access** (14 errors)
   - Add proper frontmatter types
   - Use bracket notation
   - **Estimated time**: 1-2 hours

6. **Error override modifiers** (20 errors)
   - Add `override` keywords
   - **Estimated time**: 30 minutes

### Priority 4: LOW (Fix Last - Cleanup)

7. **Unused variables** (20 errors)
   - Remove or mark as intentional
   - **Estimated time**: 1 hour

---

## Total Estimated Fix Time: 12-17 hours

### Breakdown:
- Critical fixes: 4-6 hours
- High priority: 5-7 hours
- Medium priority: 2-3 hours
- Low priority: 1 hour

---

## Verification Steps

After each category fix:

1. **Build check**:
   ```bash
   npm run build 2>&1 | grep "error TS" | wc -l
   ```

2. **Test remaining errors**:
   ```bash
   npm run build 2>&1 | grep "error TS" | head -20
   ```

3. **Run tests** (after build passes):
   ```bash
   npm test
   ```

4. **Check coverage** (after tests pass):
   ```bash
   npm test -- --coverage
   ```

---

## Success Criteria

✅ Build passes: `npm run build` exits with code 0
✅ Zero TypeScript errors
✅ All tests pass
✅ Coverage >85%

---

## Communication Protocol

### After Fixing Each Category:

```bash
npx claude-flow@alpha hooks notify --message "Fixed [category]: [N] errors resolved, [M] remaining"
```

### After Build Passes:

```bash
npx claude-flow@alpha memory store "coder/build-passing" "true"
npx claude-flow@alpha hooks notify --message "Build PASSING: All TypeScript errors resolved. Ready for validation."
```

---

**Prepared by**: Tester Agent
**For**: Coder Agent
**Date**: 2025-10-27
**Status**: CRITICAL FIX REQUIRED
