/**
 * CLI command for initializing vault primitives structure
 */

import { Command } from 'commander';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  formatSuccess,
  formatInfo,
  formatHeader,
} from '../utils/formatting.js';
import {
  showSpinner,
  succeedSpinner,
} from '../utils/progress.js';

interface PrimitiveConfig {
  name: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tags: string;
  subdirs: string[];
  content: string;
}

const PRIMITIVES: PrimitiveConfig[] = [
  {
    name: 'patterns',
    title: 'Architectural Patterns',
    description: 'Reusable architectural patterns and design solutions',
    priority: 'critical',
    tags: 'patterns,architecture',
    subdirs: ['api-patterns', 'data-patterns', 'integration-patterns', 'ui-patterns', 'security-patterns'],
    content: `## Overview

This directory contains documented architectural patterns used across the Weave-NN platform.

## Subdirectories

### /api-patterns
API design patterns (REST, GraphQL, RPC, etc.)

### /data-patterns
Data modeling and storage patterns

### /integration-patterns
System integration patterns (event-driven, microservices, etc.)

### /ui-patterns
User interface and interaction patterns

### /security-patterns
Security and authentication patterns

## Usage

Each pattern should include:
- Problem statement
- Context and when to use
- Solution description
- Implementation examples
- Trade-offs and alternatives`
  },
  {
    name: 'protocols',
    title: 'Communication Protocols',
    description: 'Protocol specifications and communication standards',
    priority: 'critical',
    tags: 'protocols,communication',
    subdirs: ['mcp', 'api', 'messaging', 'rpc'],
    content: `## Overview

Defines how different parts of the system communicate.

## Subdirectories

### /mcp
Model Context Protocol specifications

### /api
API protocols (REST, GraphQL, WebSocket)

### /messaging
Message queue and pub/sub protocols

### /rpc
Remote procedure call protocols

## Protocol Documentation

Each protocol should include:
- Protocol specification
- Message formats
- Authentication/authorization
- Error handling
- Version compatibility`
  },
  {
    name: 'standards',
    title: 'Standards & Conventions',
    description: 'Data formats, API styles, and coding standards',
    priority: 'critical',
    tags: 'standards,conventions',
    subdirs: ['data-formats', 'api-styles', 'coding-standards', 'naming-conventions', 'documentation-standards'],
    content: `## Overview

Defines standards used across the platform.

## Subdirectories

### /data-formats
JSON Schema, OpenAPI, GraphQL schemas

### /api-styles
REST conventions, GraphQL guidelines

### /coding-standards
Language-specific coding standards

### /naming-conventions
File, variable, and resource naming

### /documentation-standards
Documentation templates and guidelines

## Usage

Standards ensure consistency across:
- API design
- Data modeling
- Code structure
- Documentation`
  },
  {
    name: 'integrations',
    title: 'System Integrations',
    description: 'Third-party integrations and external system connections',
    priority: 'high',
    tags: 'integrations,external-systems',
    subdirs: ['ai-services', 'databases', 'auth-providers', 'storage', 'monitoring'],
    content: `## Overview

Documents how Weave-NN integrates with external systems.

## Subdirectories

### /ai-services
OpenAI, Anthropic, other AI providers

### /databases
PostgreSQL, MongoDB, vector databases

### /auth-providers
OAuth providers, SSO, identity providers

### /storage
Cloud storage (GCS, S3), file systems

### /monitoring
Observability and monitoring integrations

## Integration Documentation

Each integration should include:
- Purpose and use case
- Configuration requirements
- Authentication setup
- API usage examples
- Error handling
- Rate limits and quotas`
  },
  {
    name: 'schemas',
    title: 'Data Schemas',
    description: 'Data models, database schemas, and validation rules',
    priority: 'high',
    tags: 'schemas,data-models',
    subdirs: ['database', 'api', 'events', 'configuration'],
    content: `## Overview

Defines data structures used throughout the platform.

## Subdirectories

### /database
Database table schemas, migrations, indexes

### /api
API request/response schemas (OpenAPI, JSON Schema)

### /events
Event schemas for messaging systems

### /configuration
Configuration file schemas and validation

## Schema Documentation

Each schema should include:
- Schema definition (JSON Schema, TypeScript, SQL)
- Field descriptions
- Validation rules
- Examples
- Version history`
  },
  {
    name: 'services',
    title: 'External Services',
    description: 'Third-party service configurations and API wrappers',
    priority: 'medium',
    tags: 'services,external',
    subdirs: ['ai', 'storage', 'monitoring', 'communication'],
    content: `## Overview

Catalogs external services used by Weave-NN.

## Subdirectories

### /ai
AI and ML services

### /storage
Cloud storage services

### /monitoring
Monitoring and analytics services

### /communication
Email, SMS, notification services

## Service Documentation

Each service should include:
- Service overview
- Pricing/quotas
- Setup instructions
- Code examples
- Alternatives`
  },
  {
    name: 'guides',
    title: 'How-To Guides',
    description: 'Step-by-step guides for common tasks',
    priority: 'medium',
    tags: 'guides,how-to',
    subdirs: ['setup', 'development', 'deployment', 'troubleshooting'],
    content: `## Overview

Practical guides for developers and users.

## Subdirectories

### /setup
Installation and setup guides

### /development
Development workflow guides

### /deployment
Deployment and operations guides

### /troubleshooting
Common issues and solutions

## Guide Structure

Each guide should include:
- Prerequisites
- Step-by-step instructions
- Verification steps
- Troubleshooting
- Next steps`
  },
  {
    name: 'components',
    title: 'Reusable Components',
    description: 'Reusable code components and modules (future use)',
    priority: 'low',
    tags: 'components,reusable',
    subdirs: ['ui', 'utilities', 'adapters', 'middleware'],
    content: `## Overview

Catalog of reusable components (planned for future phases).

## Subdirectories

### /ui
User interface components

### /utilities
Utility functions and helpers

### /adapters
Service adapters and wrappers

### /middleware
Middleware components

## Component Documentation

Each component should include:
- Purpose and use cases
- API documentation
- Usage examples
- Dependencies
- Tests`
  },
];

function createReadme(primitive: PrimitiveConfig): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `---
type: directory-hub
status: active
priority: ${primitive.priority}
tags: [hub, ${primitive.tags}]
---

# ${primitive.title}

${primitive.description}

---

${primitive.content}

---

**Status**: Active
**Last Updated**: ${date}
`;
}

function createPrimitivesIndex(vaultPath: string): string {
  return `---
type: hub
status: active
priority: critical
tags: [hub, primitives, vault-structure, navigation]
cssclasses: [hub-page]
---

# Weave-NN Vault Primitives

**Central index of all vault primitives and their subdirectories**

---

## 📖 Overview

> **Research Foundation**: Based on comprehensive research including:
> - **Johnny Decimal** - Hierarchical numbering system
> - **PARA** (Projects, Areas, Resources, Archives) - Action-oriented organization
> - **Zettelkasten** - Atomic note-taking with bidirectional linking
> - **PMEST Framework** - Faceted classification (Personality, Matter, Energy, Space, Time)
> - **CRUMBTRAIL** (Faralli et al., 2018) - Knowledge graph pruning (5.4M nodes)
> - **FDup** (De Bonis et al., 2022) - Deduplication (98-99% precision)
> - **Self-RAG** (Asai et al., 2024) - Adaptive retrieval (25-75% reduction)
> - **Small-World Networks** (Kleinberg, 2000) - Optimal navigation

Vault primitives are foundational building blocks organizing knowledge by domain and purpose.

---

## 📊 Primitives Directory

### 🔴 Critical Primitives

| Primitive | Subdirectories | Description |
|-----------|----------------|-------------|
| **[[patterns/README\\|Patterns]]** | ${PRIMITIVES[0].subdirs.join(', ')} | ${PRIMITIVES[0].description} |
| **[[protocols/README\\|Protocols]]** | ${PRIMITIVES[1].subdirs.join(', ')} | ${PRIMITIVES[1].description} |
| **[[standards/README\\|Standards]]** | ${PRIMITIVES[2].subdirs.join(', ')} | ${PRIMITIVES[2].description} |

### 🟡 High Priority Primitives

| Primitive | Subdirectories | Description |
|-----------|----------------|-------------|
| **[[integrations/README\\|Integrations]]** | ${PRIMITIVES[3].subdirs.join(', ')} | ${PRIMITIVES[3].description} |
| **[[schemas/README\\|Schemas]]** | ${PRIMITIVES[4].subdirs.join(', ')} | ${PRIMITIVES[4].description} |

### 🟢 Medium Priority Primitives

| Primitive | Subdirectories | Description |
|-----------|----------------|-------------|
| **[[services/README\\|Services]]** | ${PRIMITIVES[5].subdirs.join(', ')} | ${PRIMITIVES[5].description} |
| **[[guides/README\\|Guides]]** | ${PRIMITIVES[6].subdirs.join(', ')} | ${PRIMITIVES[6].description} |

### 🔵 Low Priority Primitives

| Primitive | Subdirectories | Description |
|-----------|----------------|-------------|
| **[[components/README\\|Components]]** | ${PRIMITIVES[7].subdirs.join(', ')} | ${PRIMITIVES[7].description} |

---

**Navigation**: [[INDEX|⬅️ Back to Index]]
**Created**: ${new Date().toISOString().split('T')[0]}
`;
}

export function createInitPrimitivesCommand(): Command {
  return new Command('init-primitives')
    .description('Initialize vault primitives structure (patterns, protocols, standards, etc.)')
    .argument('[vault-path]', 'Path to vault', '.')
    .action(async (vaultPath: string) => {
      try {
        console.log(formatHeader('🧵 Initializing Vault Primitives'));
        console.log();
        
        const absolutePath = join(process.cwd(), vaultPath);
        
        if (!existsSync(absolutePath)) {
          console.log(formatInfo(`Creating vault directory: ${absolutePath}`));
          mkdirSync(absolutePath, { recursive: true });
        }
        
        // Create each primitive directory
        for (const primitive of PRIMITIVES) {
          const spinner = showSpinner(`Creating ${primitive.name}/...`);
          
          const primDir = join(absolutePath, primitive.name);
          mkdirSync(primDir, { recursive: true });
          
          // Create subdirectories
          for (const subdir of primitive.subdirs) {
            mkdirSync(join(primDir, subdir), { recursive: true });
          }
          
          // Create README
          const readmePath = join(primDir, 'README.md');
          writeFileSync(readmePath, createReadme(primitive), 'utf-8');
          
          succeedSpinner(spinner, `Created ${primitive.name}/`);
        }
        
        // Create PRIMITIVES.md index
        const indexSpinner = showSpinner('Creating PRIMITIVES.md...');
        const primitivesPath = join(absolutePath, 'PRIMITIVES.md');
        writeFileSync(primitivesPath, createPrimitivesIndex(absolutePath), 'utf-8');
        succeedSpinner(indexSpinner, 'Created PRIMITIVES.md');
        
        // Create reorganized directories
        const techSpinner = showSpinner('Reorganizing technical/...');
        const techDir = join(absolutePath, 'technical');
        mkdirSync(techDir, { recursive: true });
        ['languages', 'frameworks', 'libraries', 'services', 'tools'].forEach(subdir => {
          mkdirSync(join(techDir, subdir), { recursive: true });
        });
        succeedSpinner(techSpinner, 'Reorganized technical/');
        
        const archSpinner = showSpinner('Reorganizing architecture/...');
        const archDir = join(absolutePath, 'architecture');
        mkdirSync(archDir, { recursive: true });
        ['layers', 'components', 'services', 'systems', 'analysis'].forEach(subdir => {
          mkdirSync(join(archDir, subdir), { recursive: true });
        });
        succeedSpinner(archSpinner, 'Reorganized architecture/');
        
        // Summary
        console.log();
        console.log(formatHeader('✅ Vault Primitives Initialized'));
        console.log();
        console.log(formatInfo('Created:'));
        console.log(formatInfo('  🆕 patterns/        (CRITICAL)'));
        console.log(formatInfo('  🆕 protocols/       (CRITICAL)'));
        console.log(formatInfo('  🆕 standards/       (CRITICAL)'));
        console.log(formatInfo('  🆕 integrations/    (HIGH)'));
        console.log(formatInfo('  🆕 schemas/         (HIGH)'));
        console.log(formatInfo('  🆕 services/        (MEDIUM)'));
        console.log(formatInfo('  🆕 guides/          (MEDIUM)'));
        console.log(formatInfo('  🆕 components/      (LOW)'));
        console.log();
        console.log(formatInfo('Reorganized:'));
        console.log(formatInfo('  🔄 technical/       (with subdirs)'));
        console.log(formatInfo('  🔄 architecture/    (with subdirs)'));
        console.log();
        console.log(formatSuccess(`Review: ${primitivesPath}`));
        console.log();
        
        process.exit(0);
      } catch (error) {
        console.error('Failed to initialize primitives:', error);
        process.exit(1);
      }
    });
}
