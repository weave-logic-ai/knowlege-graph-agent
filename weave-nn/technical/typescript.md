---
title: TypeScript Language
type: documentation
status: in-progress
tags:
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#8E8E93'
  cssclasses:
    - document
updated: '2025-10-29T04:55:06.394Z'
keywords:
  - overview
  - why typescript
  - configuration
  - '`tsconfig.json`'
  - mvp usage
  - shared types
  - type-safe mcp tools
  - development workflow
  - benefits
  - type safety
---
# TypeScript Language

**Category**: Technical / Language
**Status**: MVP Core Dependency
**Version**: 5.x

---

## Overview

TypeScript is the sole programming language for Weave-NN MVP, providing type safety and excellent tooling for the unified Weaver service.

## Why TypeScript

**Before** (4 services):
- Python for MCP server
- Python for file watcher
- TypeScript for Weaver
- Cross-language type mismatches

**After** (1 service):
- TypeScript only
- Shared types across MCP, workflows, watcher
- Single codebase, unified tooling

## Configuration

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## MVP Usage

### Shared Types

```typescript
// src/types/index.ts

// MCP Tool Request/Response
export interface MCPToolRequest {
  tool: string;
  params: Record<string, unknown>;
}

export interface MCPToolResponse {
  content: Array<{ type: 'text'; text: string }>;
}

// File Watcher Events
export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: number;
}

// Workflow Context
export interface WorkflowContext {
  taskId: string;
  userId?: string;
  metadata: Record<string, unknown>;
}

// Obsidian Vault Node
export interface VaultNode {
  path: string;
  title: string;
  tags: string[];
  links: string[];
  frontmatter: Record<string, unknown>;
}
```

### Type-Safe MCP Tools

```typescript
// src/mcp/tools/knowledge.ts
import type { MCPToolRequest, MCPToolResponse, VaultNode } from '../../types';

export async function getKnowledge(
  request: MCPToolRequest
): Promise<MCPToolResponse> {
  const { query } = request.params as { query: string };

  const nodes: VaultNode[] = await searchVault(query);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(nodes, null, 2)
    }]
  };
}
```

## Development Workflow

```bash
# Development (watch mode)
npm run dev

# Type checking
npm run typecheck

# Build
npm run build

# Test
npm test
```

## Benefits

### Type Safety
- Catch errors at compile time
- Autocomplete in IDE
- Refactoring confidence

### Tooling
- ESLint for linting
- Prettier for formatting
- Jest for testing
- VS Code integration

### Documentation
- Types serve as documentation
- JSDoc comments with type hints
- Automatic API documentation generation

## Related

- [[technical/nodejs|Node.js Runtime]]
- [[technical/weaver|Weaver Unified Service]]
- [[docs/local-first-architecture-overview|Local-First Architecture]]
