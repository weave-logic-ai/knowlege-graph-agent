# Vault Initialization System - API Reference

**Version**: 1.0.0
**Last Updated**: 2025-10-25
**Module**: `@weave-nn/weaver/vault-init`

---

## Table of Contents

1. [Scanner Module](#scanner-module)
2. [Template Module](#template-module)
3. [Type Definitions](#type-definitions)
4. [Error Types](#error-types)
5. [Usage Examples](#usage-examples)

---

## Scanner Module

### `detectFramework()`

Detects the framework used in a project by analyzing package.json, configuration files, and project structure.

#### Signature

```typescript
function detectFramework(
  projectPath: string
): Promise<FrameworkInfo>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectPath` | `string` | Absolute path to the project directory |

#### Returns

`Promise<FrameworkInfo>` - Framework information including type, version, and features

#### Throws

- `PackageJsonError` - If package.json is missing or invalid
- `FileSystemError` - If project directory is inaccessible
- `FrameworkDetectionError` - If detection fails for other reasons

#### Example

```typescript
import { detectFramework } from '@weave-nn/weaver/vault-init';

const info = await detectFramework('/path/to/project');

console.log(info.type);      // 'nextjs'
console.log(info.version);   // '14.0.0'
console.log(info.features);  // ['app-router', 'typescript', 'tailwind']
console.log(info.confidence); // 95
```

---

### `detectFrameworkDetailed()`

Performs a comprehensive detection with additional metadata including package.json contents and auxiliary configuration.

#### Signature

```typescript
function detectFrameworkDetailed(
  projectPath: string
): Promise<DetectionResult>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectPath` | `string` | Absolute path to the project directory |

#### Returns

`Promise<DetectionResult>` - Detailed detection result with all findings

#### Example

```typescript
import { detectFrameworkDetailed } from '@weave-nn/weaver/vault-init';

const result = await detectFrameworkDetailed('/path/to/project');

console.log(result.framework.type);    // 'nextjs'
console.log(result.packageJson.name);  // 'my-app'
console.log(result.hasTypeScript);     // true
console.log(result.hasTailwind);       // true
console.log(result.detectedAt);        // Date object
console.log(result.projectPath);       // '/path/to/project'
```

---

### `readTsConfig()`

Reads and parses tsconfig.json if it exists, handling JSON with comments.

#### Signature

```typescript
function readTsConfig(
  projectPath: string
): Promise<TsConfig | null>
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectPath` | `string` | Absolute path to the project directory |

#### Returns

`Promise<TsConfig | null>` - Parsed TypeScript configuration or null if not found

#### Throws

- `FileSystemError` - If tsconfig.json exists but cannot be parsed

#### Example

```typescript
import { readTsConfig } from '@weave-nn/weaver/vault-init';

const tsConfig = await readTsConfig('/path/to/project');

if (tsConfig) {
  console.log(tsConfig.compilerOptions?.target); // 'es2020'
  console.log(tsConfig.include);                 // ['src/**/*']
}
```

---

## Template Module

### `TemplateLoader`

Singleton class for loading and validating vault templates.

#### Methods

##### `loadTemplate()`

Loads a template by framework type.

```typescript
class TemplateLoader {
  loadTemplate(framework: FrameworkType): VaultTemplate
}
```

**Parameters**:
- `framework`: `FrameworkType` - Framework type ('nextjs', 'react', etc.)

**Returns**: `VaultTemplate` - Complete template definition

**Throws**: `Error` - If template not found

**Example**:
```typescript
import { templateLoader } from '@weave-nn/weaver/vault-init';

const template = templateLoader.loadTemplate('nextjs');
console.log(template.name);        // 'Next.js Application'
console.log(template.directories); // Directory structure
```

---

##### `validateTemplate()`

Validates a template against the schema.

```typescript
class TemplateLoader {
  validateTemplate(template: unknown): ValidationResult
}
```

**Parameters**:
- `template`: `unknown` - Template object to validate

**Returns**: `ValidationResult` - Validation result with errors/warnings

**Example**:
```typescript
const result = templateLoader.validateTemplate(myTemplate);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
  console.warn('Warnings:', result.warnings);
}
```

---

##### `listTemplates()`

Lists all available templates with metadata.

```typescript
class TemplateLoader {
  listTemplates(): TemplateMetadata[]
}
```

**Returns**: `TemplateMetadata[]` - Array of template metadata

**Example**:
```typescript
const templates = templateLoader.listTemplates();

templates.forEach(t => {
  console.log(`${t.name} (${t.framework}) - ${t.description}`);
});

// Output:
// Next.js Application (nextjs) - Template for Next.js applications
// React Application (react) - Template for React applications
```

---

### Template Schemas

#### `VaultTemplateSchema`

Zod schema for validating vault templates.

```typescript
const VaultTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  framework: z.string(),
  version: z.string(),
  description: z.string(),
  directories: DirectoryStructureSchema,
  nodeTemplates: z.record(z.string(), NodeTemplateSchema),
  metadata: z.object({
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dependencies: z.array(z.string()).optional(),
  }).optional(),
});
```

**Example**:
```typescript
import { VaultTemplateSchema } from '@weave-nn/weaver/vault-init';

const template = {
  id: 'my-template-v1',
  name: 'My Template',
  framework: 'custom',
  version: '1.0.0',
  description: 'Custom template',
  directories: { /* ... */ },
  nodeTemplates: { /* ... */ },
};

const validated = VaultTemplateSchema.parse(template);
```

---

#### `NodeTemplateSchema`

Zod schema for node templates.

```typescript
const NodeTemplateSchema = z.object({
  type: z.enum(['concept', 'technical', 'feature']),
  frontmatter: NodeFrontmatterSchema,
  contentTemplate: z.string(),
  description: z.string().optional(),
});
```

---

## Type Definitions

### `FrameworkType`

Enumeration of supported framework types.

```typescript
type FrameworkType =
  | 'nextjs'
  | 'react'
  | 'typescript'
  | 'nodejs'
  | 'unknown';
```

---

### `FrameworkInfo`

Framework detection result.

```typescript
interface FrameworkInfo {
  type: FrameworkType;
  version?: string;
  features: string[];
  confidence?: number;        // 0-100
  metadata?: {
    hasPackageJson: boolean;
    packageName?: string;
    [key: string]: unknown;
  };
}
```

**Example**:
```typescript
const info: FrameworkInfo = {
  type: 'nextjs',
  version: '14.0.0',
  features: ['app-router', 'typescript', 'tailwind'],
  confidence: 95,
  metadata: {
    hasPackageJson: true,
    packageName: 'my-nextjs-app',
  },
};
```

---

### `DetectionResult`

Comprehensive detection result with all metadata.

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

**Example**:
```typescript
const result: DetectionResult = {
  framework: {
    type: 'nextjs',
    version: '14.0.0',
    features: ['app-router'],
    confidence: 95,
  },
  packageJson: {
    name: 'my-app',
    version: '1.0.0',
    dependencies: { next: '14.0.0' },
  },
  hasTypeScript: true,
  hasTailwind: true,
  detectedAt: new Date(),
  projectPath: '/path/to/project',
};
```

---

### `PackageJson`

Minimal package.json structure.

```typescript
interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}
```

---

### `TsConfig`

Minimal tsconfig.json structure.

```typescript
interface TsConfig {
  compilerOptions?: Record<string, unknown>;
  include?: string[];
  exclude?: string[];
}
```

---

### `VaultTemplate`

Complete vault template definition.

```typescript
interface VaultTemplate {
  id: string;
  name: string;
  framework: string;
  version: string;
  description: string;
  directories: DirectoryStructure;
  nodeTemplates: Map<string, NodeTemplate>;
  metadata?: {
    author?: string;
    tags?: string[];
    dependencies?: string[];
  };
}
```

**Example**:
```typescript
const template: VaultTemplate = {
  id: 'nextjs-v1',
  name: 'Next.js Application',
  framework: 'nextjs',
  version: '1.0.0',
  description: 'Template for Next.js applications',
  directories: {
    concepts: {
      description: 'High-level Next.js concepts',
    },
    technical: {
      description: 'Technical implementation',
      children: {
        components: 'React components',
        api: 'API routes',
      },
    },
  },
  nodeTemplates: new Map([
    ['concept', conceptTemplate],
    ['technical', technicalTemplate],
  ]),
};
```

---

### `DirectoryStructure`

Vault directory hierarchy definition.

```typescript
interface DirectoryStructure {
  [key: string]: {
    description: string;
    children?: Record<string, string>;
  };
}
```

**Example**:
```typescript
const structure: DirectoryStructure = {
  concepts: {
    description: 'High-level concepts',
  },
  technical: {
    description: 'Technical documentation',
    children: {
      components: 'React components',
      hooks: 'Custom hooks',
      utils: 'Utility functions',
    },
  },
  features: {
    description: 'Feature documentation',
  },
};
```

---

### `NodeTemplate`

Template for generating individual vault nodes.

```typescript
interface NodeTemplate {
  type: 'concept' | 'technical' | 'feature';
  frontmatter: NodeFrontmatter;
  contentTemplate: string;  // Handlebars template
  description?: string;
}
```

**Example**:
```typescript
const conceptTemplate: NodeTemplate = {
  type: 'concept',
  frontmatter: {
    type: 'concept',
    tags: ['{{framework}}', 'concept'],
    created: '{{timestamp}}',
  },
  contentTemplate: `
# {{nodeName}}

## Overview

{{description}}

## Related Concepts

{{#each relatedConcepts}}
- [[{{this}}]]
{{/each}}
`,
  description: 'High-level concept documentation',
};
```

---

### `NodeFrontmatter`

YAML frontmatter for vault nodes.

```typescript
interface NodeFrontmatter {
  [key: string]: any;
}
```

**Example**:
```typescript
const frontmatter: NodeFrontmatter = {
  type: 'technical',
  tags: ['nextjs', 'component'],
  file_path: 'src/components/Header.tsx',
  created: '2025-10-25',
  author: 'Weave-NN',
  dependencies: ['react', 'next/navigation'],
};
```

---

### `TemplateContext`

Context object for Handlebars rendering.

```typescript
interface TemplateContext {
  projectName: string;
  framework: string;
  nodeName: string;
  nodeType: string;
  timestamp: string;
  author?: string;
  [key: string]: any;  // Additional custom variables
}
```

**Example**:
```typescript
const context: TemplateContext = {
  projectName: 'my-app',
  framework: 'nextjs',
  nodeName: 'Server Components',
  nodeType: 'concept',
  timestamp: '2025-10-25T12:00:00Z',
  author: 'John Doe',
  description: 'React Server Components in Next.js 14',
  relatedConcepts: ['App Router', 'Client Components'],
};

// Use with Handlebars
const rendered = Handlebars.compile(template.contentTemplate)(context);
```

---

### `ValidationResult`

Template validation result.

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

**Example**:
```typescript
const result: ValidationResult = {
  valid: false,
  errors: [
    'Missing required field: id',
    'Invalid framework type: unsupported',
  ],
  warnings: [
    'No metadata provided',
  ],
};
```

---

### `TemplateMetadata`

Template metadata for discovery.

```typescript
interface TemplateMetadata {
  id: string;
  name: string;
  framework: string;
  version: string;
  description: string;
  tags?: string[];
}
```

---

## Error Types

### `FrameworkDetectionError`

Base error class for framework detection failures.

```typescript
class FrameworkDetectionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  )
}
```

**Example**:
```typescript
try {
  await detectFramework('/invalid/path');
} catch (error) {
  if (error instanceof FrameworkDetectionError) {
    console.error(`Error [${error.code}]: ${error.message}`);
    console.error('Details:', error.details);
  }
}
```

---

### `PackageJsonError`

Error thrown when package.json is missing or invalid.

```typescript
class PackageJsonError extends FrameworkDetectionError {
  constructor(message: string, details?: unknown)
}
```

**Codes**:
- `PACKAGE_JSON_ERROR`

**Common Causes**:
- Missing package.json
- Invalid JSON syntax
- Permission errors

**Example**:
```typescript
try {
  await detectFramework('/path/without/package');
} catch (error) {
  if (error instanceof PackageJsonError) {
    console.error('package.json issue:', error.message);
    // Error: package.json not found at: /path/without/package/package.json
  }
}
```

---

### `FileSystemError`

Error thrown when file system operations fail.

```typescript
class FileSystemError extends FrameworkDetectionError {
  constructor(message: string, details?: unknown)
}
```

**Codes**:
- `FILE_SYSTEM_ERROR`

**Common Causes**:
- Directory does not exist
- Path is a file, not a directory
- Permission denied
- Symbolic link issues

**Example**:
```typescript
try {
  await detectFramework('/path/to/file.txt');
} catch (error) {
  if (error instanceof FileSystemError) {
    console.error('File system error:', error.message);
    // Error: Path is not a directory: /path/to/file.txt
  }
}
```

---

## Usage Examples

### Example 1: Basic Framework Detection

```typescript
import { detectFramework } from '@weave-nn/weaver/vault-init';

async function analyzeProject(projectPath: string) {
  try {
    const info = await detectFramework(projectPath);

    console.log(`Framework: ${info.type}`);
    console.log(`Version: ${info.version ?? 'unknown'}`);
    console.log(`Features: ${info.features.join(', ')}`);
    console.log(`Confidence: ${info.confidence}%`);

    if (info.confidence && info.confidence < 70) {
      console.warn('Low confidence detection. Consider manual verification.');
    }
  } catch (error) {
    if (error instanceof PackageJsonError) {
      console.error('Cannot find package.json. Is this a Node.js project?');
    } else if (error instanceof FileSystemError) {
      console.error('Cannot access project directory:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

await analyzeProject('/path/to/nextjs-app');
```

---

### Example 2: Detailed Detection with Metadata

```typescript
import { detectFrameworkDetailed } from '@weave-nn/weaver/vault-init';

async function analyzeProjectDetailed(projectPath: string) {
  const result = await detectFrameworkDetailed(projectPath);

  console.log('=== Project Analysis ===');
  console.log(`Path: ${result.projectPath}`);
  console.log(`Detected at: ${result.detectedAt.toISOString()}`);
  console.log(`\nFramework: ${result.framework.type} ${result.framework.version}`);
  console.log(`TypeScript: ${result.hasTypeScript ? 'Yes' : 'No'}`);
  console.log(`Tailwind CSS: ${result.hasTailwind ? 'Yes' : 'No'}`);

  console.log(`\nFeatures:`);
  result.framework.features.forEach(f => console.log(`  - ${f}`));

  if (result.packageJson) {
    console.log(`\nPackage: ${result.packageJson.name}`);
    console.log(`Version: ${result.packageJson.version}`);
  }
}

await analyzeProjectDetailed('/path/to/project');
```

---

### Example 3: Loading and Using Templates

```typescript
import { templateLoader } from '@weave-nn/weaver/vault-init';
import Handlebars from 'handlebars';

async function generateNode(framework: string, nodeName: string) {
  // Load template
  const template = templateLoader.loadTemplate(framework as any);

  // Get concept node template
  const conceptTemplate = template.nodeTemplates.get('concept');
  if (!conceptTemplate) {
    throw new Error('Concept template not found');
  }

  // Prepare context
  const context = {
    projectName: 'my-app',
    framework: framework,
    nodeName: nodeName,
    nodeType: 'concept',
    timestamp: new Date().toISOString(),
    description: `This is a ${nodeName} concept in ${framework}`,
    relatedConcepts: ['Other Concept 1', 'Other Concept 2'],
  };

  // Render template
  const compiled = Handlebars.compile(conceptTemplate.contentTemplate);
  const content = compiled(context);

  // Generate frontmatter
  const frontmatter = Object.entries(conceptTemplate.frontmatter)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');

  // Combine
  const fullContent = `---\n${frontmatter}\n---\n\n${content}`;

  console.log(fullContent);
}

await generateNode('nextjs', 'Server Components');
```

---

### Example 4: Custom Template Validation

```typescript
import { templateLoader, VaultTemplateSchema } from '@weave-nn/weaver/vault-init';

function validateCustomTemplate(template: unknown) {
  // Validate with schema
  const schemaResult = VaultTemplateSchema.safeParse(template);

  if (!schemaResult.success) {
    console.error('Schema validation failed:');
    schemaResult.error.errors.forEach(err => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    return false;
  }

  // Additional validation
  const validated = schemaResult.data;
  const result = templateLoader.validateTemplate(validated);

  if (!result.valid) {
    console.error('Template validation failed:');
    result.errors.forEach(err => console.error(`  - ${err}`));
  }

  if (result.warnings.length > 0) {
    console.warn('Warnings:');
    result.warnings.forEach(warn => console.warn(`  - ${warn}`));
  }

  return result.valid;
}

const myTemplate = {
  id: 'custom-v1',
  name: 'Custom Template',
  framework: 'custom',
  version: '1.0.0',
  description: 'My custom template',
  directories: { /* ... */ },
  nodeTemplates: { /* ... */ },
};

const isValid = validateCustomTemplate(myTemplate);
console.log(`Template is ${isValid ? 'valid' : 'invalid'}`);
```

---

### Example 5: Error Handling Best Practices

```typescript
import {
  detectFramework,
  PackageJsonError,
  FileSystemError,
  FrameworkDetectionError,
} from '@weave-nn/weaver/vault-init';

async function safeDetectFramework(projectPath: string) {
  try {
    return await detectFramework(projectPath);
  } catch (error) {
    // Handle specific errors
    if (error instanceof PackageJsonError) {
      console.error('📦 Package.json issue:');
      console.error(`   ${error.message}`);
      console.error('   Suggestion: Ensure package.json exists and is valid JSON');
      return null;
    }

    if (error instanceof FileSystemError) {
      console.error('📁 File system error:');
      console.error(`   ${error.message}`);
      console.error('   Suggestion: Check path and permissions');
      return null;
    }

    if (error instanceof FrameworkDetectionError) {
      console.error('🔍 Detection error:');
      console.error(`   [${error.code}] ${error.message}`);
      if (error.details) {
        console.error('   Details:', error.details);
      }
      return null;
    }

    // Unknown error
    console.error('❌ Unexpected error:', error);
    throw error;
  }
}

const info = await safeDetectFramework('/path/to/project');
if (info) {
  console.log(`✅ Detected: ${info.type}`);
} else {
  console.log('❌ Detection failed');
}
```

---

## See Also

- [User Guide](./vault-init-user-guide.md) - End-user documentation
- [Developer Guide](./vault-init-developer-guide.md) - Architecture and customization
- [Phase 6 Report](./PHASE-6-COMPLETION-REPORT.md) - Implementation details

---

**Generated**: 2025-10-25
**Version**: 1.0.0
**Module**: `@weave-nn/weaver/vault-init`
