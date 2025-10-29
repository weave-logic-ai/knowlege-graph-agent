# better-sqlite3 API Compatibility Fix

## Summary
Fixed database API compatibility in `/home/aepod/dev/weave-nn/weaver/src/memory/experience-storage.ts` by replacing Bun SQLite API calls with better-sqlite3 API.

## Changes Made

### API Differences
- **Bun SQLite**: `db.run(sql)` - Direct execution
- **better-sqlite3**:
  - `db.exec(sql)` - For DDL statements (CREATE TABLE, CREATE INDEX)
  - `db.prepare(sql).run(params)` - For parameterized queries

### Fixed Instances (7 total)

All located in the `initialize()` method (lines 60-98):

1. **Line 60**: CREATE TABLE experiences - `this.db.run()` → `this.db.exec()`
2. **Line 79**: CREATE TABLE lessons - `this.db.run()` → `this.db.exec()`
3. **Line 94**: CREATE INDEX idx_experiences_domain - `this.db.run()` → `this.db.exec()`
4. **Line 95**: CREATE INDEX idx_experiences_outcome - `this.db.run()` → `this.db.exec()`
5. **Line 96**: CREATE INDEX idx_experiences_timestamp - `this.db.run()` → `this.db.exec()`
6. **Line 97**: CREATE INDEX idx_lessons_experience_id - `this.db.run()` → `this.db.exec()`
7. **Line 98**: CREATE INDEX idx_lessons_domain - `this.db.run()` → `this.db.exec()`

### Untouched Code
All prepared statement usages (`.prepare(...).run(...)`) were already correct and required no changes:
- Line 116: INSERT INTO experiences (store method)
- Line 149: INSERT INTO experiences (storeBatch method)
- Line 249: INSERT INTO lessons (storeLesson method)
- Line 363: DELETE FROM lessons (cleanup method)
- Line 369: DELETE FROM experiences (cleanup method)
- All SELECT queries using `.prepare(...).get()` and `.prepare(...).all()`

## Verification

### TypeScript Compilation
✅ `npm run typecheck` - No errors

### Build
✅ `npm run build` - Successful compilation

## Impact
- Fixed all DDL statements to use correct better-sqlite3 API
- All parameterized queries already using correct prepared statement pattern
- No breaking changes to public API
- Database initialization now works correctly with better-sqlite3

## Files Modified
- `/home/aepod/dev/weave-nn/weaver/src/memory/experience-storage.ts`

## Next Steps
The experience storage module is now fully compatible with better-sqlite3 and ready for use in the learning loop implementation.
