# Framework Detector

Robust framework detection system for Phase 6 Vault Initialization that identifies TypeScript, Next.js, React, and Node.js projects.

## Features

- **Automatic Framework Detection**: Identifies Next.js, React, TypeScript, and Node.js projects
- **Feature Detection**: Detects App Router vs Pages Router, TypeScript, Tailwind CSS, and more
- **Comprehensive Validation**: Uses Zod for type-safe validation
- **Error Handling**: Custom error types with detailed messages
- **Confidence Scoring**: Returns confidence level for detection accuracy
- **High Performance**: Efficient file system scanning

## Supported Frameworks

### Next.js
- Detects version from package.json
- Identifies App Router (Next.js 13+) vs Pages Router
- Detects `src/` directory structure
- Identifies API routes

### React
- Standalone React projects
- React Router detection
- State management libraries (Redux, Zustand, Jotai)
- Testing library detection

### TypeScript
- TypeScript configuration detection
- Version identification
- tsconfig.json parsing (with comment support)

### Node.js
- Fallback for Node.js projects
- Generic dependency detection

## Installation

```bash
npm install
```

## Usage

### Basic Detection

```typescript
import { detectFramework } from './vault-init/scanner';

const framework = await detectFramework('/path/to/project');

console.log(framework.type);        // 'nextjs' | 'react' | 'typescript' | 'nodejs' | 'unknown'
console.log(framework.version);     // '14.0.0'
console.log(framework.features);    // ['app-router', 'typescript', 'tailwind']
console.log(framework.confidence);  // 85
```

### Detailed Detection

```typescript
import { detectFrameworkDetailed } from './vault-init/scanner';

const result = await detectFrameworkDetailed('/path/to/project');

console.log(result.framework);      // FrameworkInfo
console.log(result.packageJson);    // PackageJson
console.log(result.hasTypeScript);  // boolean
console.log(result.hasTailwind);    // boolean
console.log(result.detectedAt);     // Date
```

### TypeScript Configuration

```typescript
import { readTsConfig } from './vault-init/scanner';

const tsConfig = await readTsConfig('/path/to/project');

if (tsConfig) {
  console.log(tsConfig.compilerOptions);
  console.log(tsConfig.include);
  console.log(tsConfig.exclude);
}
```

## API Reference

### `detectFramework(projectPath: string): Promise<FrameworkInfo>`

Detects the framework used in a project.

**Parameters:**
- `projectPath` - Absolute path to the project directory

**Returns:**
- `FrameworkInfo` - Framework information including type, version, and features

**Throws:**
- `PackageJsonError` - If package.json is missing or invalid
- `FileSystemError` - If project directory is inaccessible

### `detectFrameworkDetailed(projectPath: string): Promise<DetectionResult>`

Performs comprehensive detection with additional metadata.

**Parameters:**
- `projectPath` - Absolute path to the project directory

**Returns:**
- `DetectionResult` - Detailed detection result with all findings

### `readTsConfig(projectPath: string): Promise<TsConfig | null>`

Reads and parses tsconfig.json if it exists.

**Parameters:**
- `projectPath` - Absolute path to the project directory

**Returns:**
- `TsConfig | null` - Parsed TypeScript configuration or null if not found

## Type Definitions

### FrameworkInfo

```typescript
interface FrameworkInfo {
  type: 'nextjs' | 'react' | 'typescript' | 'nodejs' | 'unknown';
  version?: string;
  features: string[];
  confidence?: number;     // 0-100
  metadata?: Record<string, unknown>;
}
```

### DetectionResult

```typescript
interface DetectionResult {
  framework: FrameworkInfo;
  packageJson?: PackageJson;
  hasTypeScript: boolean;
  hasTailwind: boolean;
  detectedAt: Date;
  projectPath: string;
}
```

## Feature Detection

### Next.js Features

- `app-router` - Next.js 13+ App Router
- `pages-router` - Traditional Pages Router
- `src-directory` - Using src/ directory structure
- `api-routes` - API routes present
- `typescript` - TypeScript enabled
- `tailwind` - Tailwind CSS configured

### React Features

- `react-router` - React Router DOM
- `redux` - Redux or Redux Toolkit
- `zustand` - Zustand state management
- `jotai` - Jotai state management
- `testing-library` - React Testing Library

## Error Handling

### Custom Error Types

```typescript
// Base error
class FrameworkDetectionError extends Error {
  code: string;
  details?: unknown;
}

// Package.json errors
class PackageJsonError extends FrameworkDetectionError {
  // Missing or invalid package.json
}

// File system errors
class FileSystemError extends FrameworkDetectionError {
  // Directory not found, permission denied, etc.
}
```

### Error Examples

```typescript
try {
  const framework = await detectFramework('/nonexistent/path');
} catch (error) {
  if (error instanceof PackageJsonError) {
    console.error('Package.json issue:', error.message);
  } else if (error instanceof FileSystemError) {
    console.error('File system issue:', error.message);
  }
}
```

## Confidence Scoring

The detector calculates a confidence score (0-100) based on:

- **Base confidence**: 50 points for any detection
- **Framework match**: +30 points for finding the main framework dependency
- **Features detected**: +5 points per feature (max 20 points)
- **Unknown type**: 0 confidence

High confidence (80+) indicates a well-configured project with clear framework indicators.

## Validation

All data structures are validated using Zod schemas:

- `FrameworkInfoSchema` - Framework information
- `PackageJsonSchema` - package.json structure
- `TsConfigSchema` - tsconfig.json structure
- `DetectionResultSchema` - Complete detection result

## Testing

Run the test suite:

```bash
npm test tests/vault-init/framework-detector.test.ts
```

Coverage target: **90%+**

### Test Categories

- Basic framework detection (Next.js, React, TypeScript, Node.js)
- Feature detection (App Router, TypeScript, Tailwind)
- Error handling (missing files, invalid JSON)
- Edge cases (multiple routers, version formats)
- Detailed detection results

## Performance

- **Fast detection**: < 10ms for typical projects
- **Minimal file I/O**: Only reads necessary files
- **Efficient scanning**: Checks files in priority order
- **Cached results**: No redundant file reads

## Integration

### With Directory Scanner

```typescript
import { scanDirectory } from './directory-scanner';
import { detectFramework } from './framework-detector';

const files = await scanDirectory('/path/to/project');
const framework = await detectFramework('/path/to/project');

console.log(`Scanned ${files.length} files in ${framework.type} project`);
```

### With Vault Initialization

```typescript
import { detectFrameworkDetailed } from './framework-detector';

async function initializeVault(projectPath: string) {
  const detection = await detectFrameworkDetailed(projectPath);

  console.log(`Initializing vault for ${detection.framework.type} project`);
  console.log(`TypeScript: ${detection.hasTypeScript}`);
  console.log(`Features: ${detection.framework.features.join(', ')}`);

  // Continue with vault initialization...
}
```

## Limitations

- **Comment parsing**: Simple regex-based comment removal may not handle all edge cases
- **Version detection**: Only detects major.minor.patch, strips semver symbols (^, ~)
- **Monorepo detection**: Currently designed for single-project repositories
- **Framework variations**: May not detect all framework variations or custom setups

## Future Enhancements

- [ ] Monorepo support (Nx, Turborepo, Lerna)
- [ ] Vue.js and Angular detection
- [ ] Build tool detection (Vite, Webpack, etc.)
- [ ] Framework-specific configuration validation
- [ ] Dependency graph analysis
- [ ] Custom framework plugins

## Contributing

When adding new framework detection:

1. Add framework type to `FrameworkTypeSchema`
2. Implement detection logic in `detectFrameworkType()`
3. Add version detection in `detectVersion()`
4. Add feature detection function
5. Add comprehensive tests
6. Update documentation

## License

MIT

## Related

- [Directory Scanner](./directory-scanner.md)
- [Phase 6 Specification](../_planning/specs/phase-6-vault-initialization/specification.md)
- [Vault Initialization](../_planning/phases/phase-6-vault-initialization.md)
