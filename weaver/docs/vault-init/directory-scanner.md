# Directory Scanner API Documentation

Fast, reliable directory traversal with `.gitignore` support for Phase 6 Vault Initialization.

## Overview

The directory scanner provides efficient file system traversal with:
- **Performance**: <1s for 10k+ files
- **`.gitignore` support**: Respects repository ignore patterns
- **Symlink safety**: Detects and prevents cycles
- **Flexible filtering**: Custom ignore patterns and depth control
- **Rich metadata**: File size, modification time, and type information

## Installation

The scanner is part of the `@weave-nn/weaver` package and uses `fast-glob` for optimal performance.

```bash
bun add fast-glob ignore
```

## Quick Start

```typescript
import { scanDirectory } from '@weave-nn/weaver/vault-init/scanner/directory-scanner';

// Basic scan
const files = await scanDirectory('/path/to/project');

// With options
const files = await scanDirectory('/path/to/project', {
  respectGitignore: true,
  maxDepth: 3,
  customIgnore: ['temp/**', '*.tmp'],
});

// Get statistics
import { scanDirectoryWithStats } from '@weave-nn/weaver/vault-init/scanner/directory-scanner';

const { files, stats } = await scanDirectoryWithStats('/path/to/project');
console.log(`Scanned ${stats.totalFiles} files in ${stats.duration}ms`);
```

## API Reference

### Types

#### `FileNode`

```typescript
interface FileNode {
  path: string;           // Absolute path
  relativePath: string;   // Relative to scan root
  type: 'file' | 'directory';
  size?: number;          // File size in bytes
  modified?: Date;        // Last modified date
}
```

#### `ScanOptions`

```typescript
interface ScanOptions {
  // Respect .gitignore patterns (default: true)
  respectGitignore?: boolean;

  // Maximum depth to traverse (default: Infinity)
  maxDepth?: number;

  // Custom ignore patterns in addition to defaults
  customIgnore?: string[];

  // Include directories in results (default: false)
  includeDirs?: boolean;

  // Follow symbolic links (default: false)
  followSymlinks?: boolean;
}
```

#### `ScanStats`

```typescript
interface ScanStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;      // Total bytes
  duration: number;       // Scan duration in ms
  ignored: number;        // Files ignored
}
```

### Functions

#### `scanDirectory(rootPath, options?)`

Scan a directory and return file nodes.

```typescript
async function scanDirectory(
  rootPath: string,
  options?: ScanOptions
): Promise<FileNode[]>
```

**Parameters:**
- `rootPath` - Directory to scan
- `options` - Optional scan configuration

**Returns:** Array of `FileNode` objects

**Throws:**
- Error if path doesn't exist
- Error if path is not a directory

**Example:**
```typescript
const files = await scanDirectory('/home/user/project', {
  respectGitignore: true,
  maxDepth: 2,
});

// Filter TypeScript files
const tsFiles = files.filter(f => f.relativePath.endsWith('.ts'));
```

#### `scanDirectoryWithStats(rootPath, options?)`

Scan directory and return files with statistics.

```typescript
async function scanDirectoryWithStats(
  rootPath: string,
  options?: ScanOptions
): Promise<{ files: FileNode[]; stats: ScanStats }>
```

**Example:**
```typescript
const { files, stats } = await scanDirectoryWithStats('/home/user/project');

console.log(`Found ${stats.totalFiles} files`);
console.log(`Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
console.log(`Scan took: ${stats.duration}ms`);
```

#### `scanDirectories(paths, options?)`

Scan multiple directories in parallel.

```typescript
async function scanDirectories(
  paths: string[],
  options?: ScanOptions
): Promise<Map<string, FileNode[]>>
```

**Example:**
```typescript
const results = await scanDirectories([
  '/home/user/project1',
  '/home/user/project2',
  '/home/user/project3',
]);

for (const [path, files] of results) {
  console.log(`${path}: ${files.length} files`);
}
```

#### `countFiles(rootPath, options?)`

Quickly count files without metadata (fastest option).

```typescript
async function countFiles(
  rootPath: string,
  options?: ScanOptions
): Promise<number>
```

**Example:**
```typescript
const count = await countFiles('/home/user/project');
console.log(`Project has ${count} files`);
```

## Default Ignore Patterns

The scanner automatically ignores these patterns:

```typescript
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  'build/**',
  '.next/**',
  'out/**',
  'coverage/**',
  '.nyc_output/**',
  '.turbo/**',
  '.cache/**',
  '.swarm/**',
  '.task-logs/**',
  '**/*.log',
  '.DS_Store',
  'Thumbs.db',
];
```

## Usage Examples

### Basic Project Scan

```typescript
import { scanDirectory } from '@weave-nn/weaver/vault-init/scanner/directory-scanner';

// Scan entire project
const files = await scanDirectory(process.cwd());

// Get all TypeScript files
const tsFiles = files.filter(f => f.relativePath.endsWith('.ts'));

// Get files by directory
const srcFiles = files.filter(f => f.relativePath.startsWith('src/'));
```

### Respecting .gitignore

```typescript
// Automatically respects .gitignore
const files = await scanDirectory('/path/to/repo', {
  respectGitignore: true,  // Default
});

// .env files won't be included if gitignored
const envFile = files.find(f => f.relativePath === '.env');
// envFile === undefined
```

### Custom Ignore Patterns

```typescript
// Add custom patterns
const files = await scanDirectory('/path/to/project', {
  customIgnore: [
    'temp/**',
    '*.tmp',
    'scratch/**',
    '*.bak',
  ],
});

// Combine with defaults
// Both node_modules AND temp will be ignored
```

### Depth Control

```typescript
// Only scan root level
const rootFiles = await scanDirectory('/path/to/project', {
  maxDepth: 1,
});

// Scan 3 levels deep
const shallowScan = await scanDirectory('/path/to/project', {
  maxDepth: 3,
});
```

### Include Directories

```typescript
// Get both files and directories
const all = await scanDirectory('/path/to/project', {
  includeDirs: true,
});

const directories = all.filter(f => f.type === 'directory');
const files = all.filter(f => f.type === 'file');
```

### File Metadata

```typescript
const files = await scanDirectory('/path/to/project');

// Sort by size
const bySize = [...files].sort((a, b) =>
  (b.size || 0) - (a.size || 0)
);

// Sort by modification time
const byDate = [...files].sort((a, b) =>
  (b.modified?.getTime() || 0) - (a.modified?.getTime() || 0)
);

// Find large files (>1MB)
const largeFiles = files.filter(f => (f.size || 0) > 1024 * 1024);
```

### Parallel Directory Scans

```typescript
import { scanDirectories } from '@weave-nn/weaver/vault-init/scanner/directory-scanner';

// Scan multiple projects in parallel
const projects = [
  '/home/user/project1',
  '/home/user/project2',
  '/home/user/project3',
];

const results = await scanDirectories(projects);

// Aggregate results
let totalFiles = 0;
for (const [path, files] of results) {
  totalFiles += files.length;
  console.log(`${path}: ${files.length} files`);
}
```

### Fast File Counting

```typescript
import { countFiles } from '@weave-nn/weaver/vault-init/scanner/directory-scanner';

// Quick count without metadata
const count = await countFiles('/path/to/project');

if (count > 10000) {
  console.log('Large project detected');
}
```

## Performance

### Benchmarks

Typical performance on modern hardware:

| Files | Time | Notes |
|-------|------|-------|
| 100 | ~10ms | Small project |
| 1,000 | ~100ms | Medium project |
| 10,000 | ~800ms | Large project |
| 50,000+ | <5s | Very large monorepo |

### Optimization Tips

1. **Use `countFiles()` for quick checks**
   ```typescript
   const count = await countFiles(path);
   if (count < 100) {
     // Different strategy for small projects
   }
   ```

2. **Limit depth for shallow scans**
   ```typescript
   const files = await scanDirectory(path, { maxDepth: 2 });
   ```

3. **Skip directories with `includeDirs: false`** (default)
   ```typescript
   const files = await scanDirectory(path); // Faster
   ```

4. **Parallel scans for multiple directories**
   ```typescript
   const results = await scanDirectories(paths); // Concurrent
   ```

## Error Handling

```typescript
try {
  const files = await scanDirectory('/path/to/project');
} catch (error) {
  if (error.message.includes('does not exist')) {
    console.error('Path not found');
  } else if (error.message.includes('not a directory')) {
    console.error('Path is a file, not a directory');
  } else {
    console.error('Scan failed:', error);
  }
}
```

## Integration with Vault Initialization

```typescript
import { scanDirectory } from '@weave-nn/weaver/vault-init/scanner/directory-scanner';
import { createVault } from '@weave-nn/weaver/vault-init';

// Scan project for vault initialization
const files = await scanDirectory(projectPath, {
  respectGitignore: true,
  includeDirs: true,
});

// Process files for vault
const vault = await createVault({
  files,
  projectPath,
  // ... other options
});
```

## Symlink Handling

```typescript
// Default: don't follow symlinks (safe)
const files = await scanDirectory('/path/to/project', {
  followSymlinks: false,  // Default
});

// Follow symlinks (with cycle detection)
const files = await scanDirectory('/path/to/project', {
  followSymlinks: true,  // Will detect and skip cycles
});
```

The scanner automatically detects and prevents infinite loops from circular symlinks.

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  FileNode,
  ScanOptions,
  ScanStats,
} from '@weave-nn/weaver/vault-init/scanner/directory-scanner';

const options: ScanOptions = {
  respectGitignore: true,
  maxDepth: 3,
};

const files: FileNode[] = await scanDirectory(path, options);
```

## Testing

See comprehensive test suite:
- `/home/aepod/dev/weave-nn/weaver/tests/vault-init/directory-scanner.test.ts`
- `/home/aepod/dev/weave-nn/weaver/tests/vault-init/scanner-real-world.test.ts`

Run tests:
```bash
bun test tests/vault-init/directory-scanner.test.ts
bun test tests/vault-init/scanner-real-world.test.ts
```

## License

MIT
