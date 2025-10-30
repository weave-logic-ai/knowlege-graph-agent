# Vault Detection Fix ✅

**Date:** 2025-10-30
**Status:** Fixed
**Commit:** 2984f31

---

## Problem

User reported that vault root detection was incorrect when running from subdirectories in a git repository:

```bash
cd /home/aepod/dev/business-planning-copy/04-case-studies/legal-docs-app/v2/docs-nn
weaver cultivate . --seed --verbose
```

**Expected:** Vault root should be `docs-nn` (current directory)
**Actual:** Vault root detected as `/home/aepod/dev/business-planning-copy` (git repository root)

The issue occurred because the vault detection logic walked up the directory tree looking for a `.git` folder, which is problematic for mono-repos where the git root is several levels up from the actual vault directory.

## Root Cause

The `findVaultRoot()` function in `src/cli/commands/cultivate.ts` was:

```typescript
// OLD LOGIC - PROBLEMATIC
async function findVaultRoot(startPath: string): Promise<string> {
  // ... traverse up looking for .git directory
  while (currentPath !== '/') {
    try {
      await fs.access(path.join(currentPath, '.git'));
      return currentPath; // Returns git repo root
    } catch {
      currentPath = parent;
    }
  }
  return path.resolve(startPath);
}
```

This caused:
- ❌ Files created in wrong location (git root instead of vault directory)
- ❌ Confusion in mono-repos with multiple projects
- ❌ Unexpected behavior when vault is nested in git repo

## Solution

Updated vault detection to look for `.obsidian` folder (Obsidian vault marker) instead of `.git`:

```typescript
// NEW LOGIC - CORRECT
async function findVaultRoot(startPath: string): Promise<string> {
  let currentPath = path.resolve(startPath);

  // Handle file paths
  try {
    const stats = await fs.stat(currentPath);
    if (stats.isFile()) {
      currentPath = path.dirname(currentPath);
    }
  } catch {
    // Path doesn't exist, use as-is
  }

  // Look for .obsidian folder (Obsidian vault marker)
  let searchPath = currentPath;
  while (searchPath !== '/') {
    try {
      const obsidianPath = path.join(searchPath, '.obsidian');
      const stats = await fs.stat(obsidianPath);
      if (stats.isDirectory()) {
        return searchPath; // Found Obsidian vault
      }
    } catch {
      // Not found, continue searching
    }

    const parent = path.dirname(searchPath);
    if (parent === searchPath) break;
    searchPath = parent;
  }

  // No .obsidian found, use specified directory as vault root
  return currentPath;
}
```

### New Behavior

1. **With .obsidian folder:** Walks up to find it
   ```
   /path/to/vault/.obsidian  → Vault root: /path/to/vault
   ```

2. **Without .obsidian folder:** Uses specified directory
   ```
   weaver cultivate ./docs  → Vault root: ./docs
   ```

3. **No more .git lookup:** Avoids mono-repo issues
   ```
   /mono-repo/.git
   /mono-repo/project1/docs-nn  → Vault root: /mono-repo/project1/docs-nn
   ```

## Testing Results

### Test 1: Directory without .obsidian

```bash
rm -rf /tmp/vault-test && mkdir -p /tmp/vault-test
echo '{"dependencies": {"react": "^18.0.0"}}' > /tmp/vault-test/package.json
weaver cultivate /tmp/vault-test --seed --verbose
```

**Result:** ✅ `Vault root: /tmp/vault-test`

### Test 2: Directory with .obsidian

```bash
rm -rf /tmp/obsidian-test && mkdir -p /tmp/obsidian-test/docs-nn/.obsidian
echo '{"dependencies": {"react": "^18.0.0"}}' > /tmp/obsidian-test/docs-nn/package.json
cd /tmp/obsidian-test/docs-nn
weaver cultivate . --seed --dry-run
```

**Result:** ✅ `Vault root: /tmp/obsidian-test/docs-nn`

### Test 3: User's Actual Project

User should now test:

```bash
cd /home/aepod/dev/business-planning-copy/04-case-studies/legal-docs-app/v2/docs-nn
weaver cultivate . --seed --verbose
```

**Expected:**
- If `.obsidian` exists in `docs-nn` or parent: uses that directory
- Otherwise: uses `docs-nn` as vault root
- **NOT** `/home/aepod/dev/business-planning-copy`

## User Impact

✅ **Benefits:**
- Correct vault detection for Obsidian vaults (finds `.obsidian`)
- Works correctly in mono-repos (no .git lookup)
- Predictable behavior (uses specified directory if no `.obsidian`)
- Seed-generated files go to correct location

✅ **Breaking Changes:**
- None - existing Obsidian vaults work better
- Non-Obsidian directories now use specified path (more intuitive)

## Related Issues

- Original seed generator implementation
- PRIMITIVES.md taxonomy alignment
- User feedback: "Still messes up the basedir"

## Commits

1. **fix(cli): Use .obsidian folder for vault detection instead of .git** (2984f31)
   - Changed vault root detection logic
   - Look for .obsidian folder first
   - Fall back to specified directory
   - Removed .git directory lookup

## Documentation Updates Needed

- [ ] Update cultivation system docs with new vault detection logic
- [ ] Add troubleshooting section for vault detection
- [ ] Document .obsidian folder requirement for Obsidian vaults

## Next Steps

1. ✅ Fix implemented and tested
2. ✅ Committed to git
3. ⏳ User to test on actual project
4. ⏳ Gather feedback on vault detection behavior
5. ⏳ Update documentation as needed
