/**
 * Agent-Driven Document Generator
 *
 * Spawns expert agents from claude-flow to analyze existing code and
 * documentation, then generates appropriate documents for each directory.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, copyFileSync } from 'fs';
import { join, basename, extname, relative, dirname } from 'path';
import fg from 'fast-glob';
import { spawn } from 'child_process';

/**
 * Service documentation found in src/{service}/docs directories
 */
interface ServiceDoc {
  serviceName: string;
  sourcePath: string;
  fileName: string;
  relativePath: string;
}

/**
 * Document generation context
 */
export interface GenerationContext {
  projectRoot: string;
  docsPath: string;
  projectName: string;
  languages: string[];
  frameworks: string[];
  existingDocs: string[];
  sourceFiles: string[];
  serviceDocs: ServiceDoc[];
}

/**
 * Generation result for a single document
 */
export interface GeneratedDoc {
  path: string;
  title: string;
  type: string;
  generated: boolean;
  error?: string;
}

/**
 * Overall generation result
 */
export interface AgentGenerationResult {
  success: boolean;
  documentsGenerated: GeneratedDoc[];
  agentsSpawned: number;
  errors: string[];
}

/**
 * Agent task definition
 */
interface AgentTask {
  directory: string;
  type: 'concept' | 'component' | 'service' | 'feature' | 'integration' | 'standard' | 'guide' | 'reference';
  agentType: 'researcher' | 'coder' | 'analyst';
  prompt: string;
  outputFile: string;
}

/**
 * Analyze project and generate documents using expert agents
 */
export async function generateDocsWithAgents(
  projectRoot: string,
  docsPath: string,
  options: {
    parallel?: boolean;
    dryRun?: boolean;
    verbose?: boolean;
    force?: boolean;
  } = {}
): Promise<AgentGenerationResult> {
  const result: AgentGenerationResult = {
    success: true,
    documentsGenerated: [],
    agentsSpawned: 0,
    errors: [],
  };

  try {
    // Build context by analyzing the project
    const context = await buildGenerationContext(projectRoot, docsPath);

    // Determine what documents should be generated
    const tasks = await planDocumentGeneration(context, options.force);

    if (options.dryRun) {
      console.log('\n[Dry Run] Would generate the following documents:');
      for (const task of tasks) {
        console.log(`  - ${task.outputFile} (${task.agentType} agent)`);
      }
      if (context.serviceDocs.length > 0) {
        console.log('\n[Dry Run] Would copy service docs:');
        for (const doc of context.serviceDocs) {
          const targetPath = `services/${doc.serviceName}/${doc.relativePath}`;
          console.log(`  - ${doc.sourcePath} → ${targetPath}`);
        }
      }
      return result;
    }

    // Copy service docs from src/{service}/docs to main docs directory
    const copiedDocs = copyServiceDocs(context, options.force);

    // Execute tasks (parallel or sequential)
    if (options.parallel) {
      const results = await Promise.allSettled(
        tasks.map(task => executeAgentTask(task, context, options.verbose))
      );

      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        result.agentsSpawned++;

        if (r.status === 'fulfilled') {
          result.documentsGenerated.push(r.value);
        } else {
          result.errors.push(`Failed: ${tasks[i].outputFile} - ${r.reason}`);
          result.documentsGenerated.push({
            path: tasks[i].outputFile,
            title: basename(tasks[i].outputFile, '.md'),
            type: tasks[i].type,
            generated: false,
            error: String(r.reason),
          });
        }
      }
    } else {
      // Sequential execution
      for (const task of tasks) {
        result.agentsSpawned++;

        try {
          const doc = await executeAgentTask(task, context, options.verbose);
          result.documentsGenerated.push(doc);
        } catch (error) {
          result.errors.push(`Failed: ${task.outputFile} - ${error}`);
          result.documentsGenerated.push({
            path: task.outputFile,
            title: basename(task.outputFile, '.md'),
            type: task.type,
            generated: false,
            error: String(error),
          });
        }
      }
    }

    // Add copied service docs to result
    result.documentsGenerated.push(...copiedDocs);

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Generation failed: ${error}`);
  }

  return result;
}

/**
 * Copy service docs from src/{service}/docs to main docs directory
 */
function copyServiceDocs(context: GenerationContext, force?: boolean): GeneratedDoc[] {
  const { docsPath, serviceDocs } = context;
  const copied: GeneratedDoc[] = [];

  for (const doc of serviceDocs) {
    const targetDir = join(docsPath, 'services', doc.serviceName);
    const targetPath = join(targetDir, doc.relativePath);
    const relativeTarget = `services/${doc.serviceName}/${doc.relativePath}`;

    // Skip if target exists and not forcing
    if (!force && existsSync(targetPath)) {
      continue;
    }

    try {
      // Create target directory if needed
      const targetFileDir = dirname(targetPath);
      if (!existsSync(targetFileDir)) {
        mkdirSync(targetFileDir, { recursive: true });
      }

      // Copy the file
      copyFileSync(doc.sourcePath, targetPath);

      copied.push({
        path: relativeTarget,
        title: doc.fileName.replace('.md', ''),
        type: 'service',
        generated: true,
      });
    } catch (error) {
      copied.push({
        path: relativeTarget,
        title: doc.fileName.replace('.md', ''),
        type: 'service',
        generated: false,
        error: String(error),
      });
    }
  }

  return copied;
}

/**
 * Build context by analyzing the project
 */
async function buildGenerationContext(
  projectRoot: string,
  docsPath: string
): Promise<GenerationContext> {
  const context: GenerationContext = {
    projectRoot,
    docsPath,
    projectName: basename(projectRoot),
    languages: [],
    frameworks: [],
    existingDocs: [],
    sourceFiles: [],
    serviceDocs: [],
  };

  // Get project name from package.json
  const pkgPath = join(projectRoot, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      context.projectName = pkg.name?.replace(/^@[^/]+\//, '') || context.projectName;

      // Detect frameworks from dependencies
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.react) context.frameworks.push('React');
      if (deps.next) context.frameworks.push('Next.js');
      if (deps.vue) context.frameworks.push('Vue');
      if (deps.express) context.frameworks.push('Express');
      if (deps.fastify) context.frameworks.push('Fastify');
      if (deps['@prisma/client'] || deps.prisma) context.frameworks.push('Prisma');
    } catch {
      // Ignore parse errors
    }
  }

  // Detect languages
  if (existsSync(join(projectRoot, 'tsconfig.json'))) {
    context.languages.push('TypeScript');
  }
  if (existsSync(join(projectRoot, 'package.json'))) {
    context.languages.push('JavaScript');
  }

  // Detect Python - check multiple locations for requirements
  const pythonConfigPaths = [
    join(projectRoot, 'requirements.txt'),
    join(projectRoot, 'pyproject.toml'),
    join(projectRoot, 'src/backend/requirements.txt'),
    join(projectRoot, 'backend/requirements.txt'),
    join(projectRoot, 'src/requirements.txt'),
  ];
  const foundPythonConfig = pythonConfigPaths.find(p => existsSync(p));

  // Also detect Python if we find .py files later in source scan
  // For now, check if there's a Python config file
  if (foundPythonConfig) {
    context.languages.push('Python');

    // Detect Python frameworks from requirements.txt or pyproject.toml
    try {
      let reqContent = readFileSync(foundPythonConfig, 'utf-8').toLowerCase();
      // Also check pyproject.toml if we found requirements.txt
      if (foundPythonConfig.includes('requirements.txt')) {
        const pyprojectPath = join(projectRoot, 'pyproject.toml');
        if (existsSync(pyprojectPath)) {
          reqContent += readFileSync(pyprojectPath, 'utf-8').toLowerCase();
        }
      }
      if (reqContent.includes('fastapi')) context.frameworks.push('FastAPI');
      if (reqContent.includes('flask')) context.frameworks.push('Flask');
      if (reqContent.includes('django')) context.frameworks.push('Django');
      if (reqContent.includes('sqlalchemy')) context.frameworks.push('SQLAlchemy');
      if (reqContent.includes('pydantic')) context.frameworks.push('Pydantic');
      if (reqContent.includes('alembic')) context.frameworks.push('Alembic');
    } catch {
      // Ignore read errors
    }
  }
  if (existsSync(join(projectRoot, 'Cargo.toml'))) {
    context.languages.push('Rust');
  }
  if (existsSync(join(projectRoot, 'go.mod'))) {
    context.languages.push('Go');
  }

  // Find existing docs
  const existingDocs = await fg('**/*.md', {
    cwd: docsPath,
    ignore: ['node_modules/**', '.git/**', '_templates/**'],
  });
  context.existingDocs = existingDocs;

  // Find source files
  const sourceFiles = await fg('**/*.{ts,tsx,js,jsx,py,rs,go}', {
    cwd: projectRoot,
    ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', docsPath + '/**'],
    dot: true,
  });
  context.sourceFiles = sourceFiles;

  // Detect Python from .py files if not already detected
  if (!context.languages.includes('Python') && sourceFiles.some(f => f.endsWith('.py'))) {
    context.languages.push('Python');
  }

  // Scan for service docs in src/{service}/docs directories
  const serviceDocs: ServiceDoc[] = [];
  const srcDir = join(projectRoot, 'src');
  if (existsSync(srcDir)) {
    try {
      const srcEntries = readdirSync(srcDir, { withFileTypes: true });
      for (const entry of srcEntries) {
        if (entry.isDirectory()) {
          const serviceDocsDir = join(srcDir, entry.name, 'docs');
          if (existsSync(serviceDocsDir)) {
            // Find all markdown files in this service's docs directory
            const docsFiles = await fg('**/*.md', {
              cwd: serviceDocsDir,
              ignore: ['node_modules/**', '.git/**'],
            });
            for (const docFile of docsFiles) {
              serviceDocs.push({
                serviceName: entry.name,
                sourcePath: join(serviceDocsDir, docFile),
                fileName: basename(docFile),
                relativePath: docFile,
              });
            }
          }
        }
      }
    } catch {
      // Ignore errors reading src directory
    }
  }
  context.serviceDocs = serviceDocs;

  return context;
}

/**
 * Plan what documents should be generated based on context
 */
async function planDocumentGeneration(context: GenerationContext, force?: boolean): Promise<AgentTask[]> {
  const tasks: AgentTask[] = [];
  const { projectRoot, docsPath, sourceFiles, frameworks } = context;

  // Helper to check if doc already exists (returns false if force is true)
  const docExists = (relativePath: string) => {
    if (force) return false; // Force regeneration
    return existsSync(join(docsPath, relativePath));
  };

  // Analyze source structure to determine what docs to generate
  const srcDirs = new Set<string>();
  const componentFiles: string[] = [];
  const serviceFiles: string[] = [];
  const utilityFiles: string[] = [];
  const backendFiles: string[] = [];
  const modelFiles: string[] = [];
  const frontendFiles: string[] = [];

  for (const file of sourceFiles) {
    const dir = file.split('/')[0];
    srcDirs.add(dir);
    const fileLower = file.toLowerCase();

    // Categorize files (improved patterns for Python and TypeScript)
    if (fileLower.includes('component') || fileLower.includes('/ui/') || fileLower.includes('/views/')) {
      componentFiles.push(file);
    }
    if (fileLower.includes('service') || fileLower.includes('/api/') || fileLower.includes('routes') || fileLower.includes('endpoints')) {
      serviceFiles.push(file);
    }
    if (fileLower.includes('util') || fileLower.includes('helper') || fileLower.includes('/lib/') || fileLower.includes('common')) {
      utilityFiles.push(file);
    }
    if (fileLower.includes('backend') || fileLower.includes('server') || fileLower.includes('app/')) {
      backendFiles.push(file);
    }
    if (fileLower.includes('model') || fileLower.includes('schema') || fileLower.includes('entities')) {
      modelFiles.push(file);
    }
    if (fileLower.includes('frontend') || fileLower.includes('client') || fileLower.includes('pages')) {
      frontendFiles.push(file);
    }
  }

  // If no service files found but backend files exist, use backend files
  if (serviceFiles.length === 0 && backendFiles.length > 0) {
    serviceFiles.push(...backendFiles);
  }

  // Generate architecture overview if source has modules with files
  // Threshold: at least 1 directory with 3+ source files
  if (srcDirs.size >= 1 && sourceFiles.length >= 3 && !docExists('concepts/architecture/overview.md')) {
    tasks.push({
      directory: 'concepts/architecture',
      type: 'concept',
      agentType: 'analyst',
      prompt: buildArchitecturePrompt(context, Array.from(srcDirs)),
      outputFile: 'concepts/architecture/overview.md',
    });
  }

  // Generate component docs for detected UI frameworks
  if (frameworks.includes('React') || frameworks.includes('Vue')) {
    if (componentFiles.length > 0 && !docExists('components/ui/overview.md')) {
      tasks.push({
        directory: 'components/ui',
        type: 'component',
        agentType: 'coder',
        prompt: buildComponentPrompt(context, componentFiles.slice(0, 10)),
        outputFile: 'components/ui/overview.md',
      });
    }
  }

  // Generate service docs if API files detected
  if (serviceFiles.length > 0 && !docExists('services/api/overview.md')) {
    tasks.push({
      directory: 'services/api',
      type: 'service',
      agentType: 'coder',
      prompt: buildServicePrompt(context, serviceFiles.slice(0, 10)),
      outputFile: 'services/api/overview.md',
    });
  }

  // Generate utility docs
  if (utilityFiles.length > 0 && !docExists('components/utilities/overview.md')) {
    tasks.push({
      directory: 'components/utilities',
      type: 'component',
      agentType: 'coder',
      prompt: buildUtilityPrompt(context, utilityFiles.slice(0, 10)),
      outputFile: 'components/utilities/overview.md',
    });
  }

  // Generate getting started guide
  if (!docExists('guides/getting-started/quick-start.md')) {
    tasks.push({
      directory: 'guides/getting-started',
      type: 'guide',
      agentType: 'researcher',
      prompt: buildGettingStartedPrompt(context),
      outputFile: 'guides/getting-started/quick-start.md',
    });
  }

  // Generate standards/coding guide if tsconfig or eslint exists
  const hasLinting = existsSync(join(projectRoot, '.eslintrc.json')) ||
                     existsSync(join(projectRoot, '.eslintrc.js')) ||
                     existsSync(join(projectRoot, 'eslint.config.js'));
  const hasTypescript = existsSync(join(projectRoot, 'tsconfig.json'));

  if ((hasLinting || hasTypescript) && !docExists('standards/coding-standards/guide.md')) {
    tasks.push({
      directory: 'standards/coding-standards',
      type: 'standard',
      agentType: 'analyst',
      prompt: buildCodingStandardsPrompt(context, hasTypescript, hasLinting),
      outputFile: 'standards/coding-standards/guide.md',
    });
  }

  // Generate integration docs for detected databases/services
  if (frameworks.includes('Prisma') && !docExists('integrations/databases/prisma.md')) {
    tasks.push({
      directory: 'integrations/databases',
      type: 'integration',
      agentType: 'coder',
      prompt: buildPrismaPrompt(context),
      outputFile: 'integrations/databases/prisma.md',
    });
  }

  // Generate SQLAlchemy docs for Python projects
  if (frameworks.includes('SQLAlchemy') && !docExists('integrations/databases/sqlalchemy.md')) {
    tasks.push({
      directory: 'integrations/databases',
      type: 'integration',
      agentType: 'coder',
      prompt: buildSQLAlchemyPrompt(context, modelFiles),
      outputFile: 'integrations/databases/sqlalchemy.md',
    });
  }

  // Generate FastAPI docs
  if (frameworks.includes('FastAPI') && !docExists('services/api/fastapi.md')) {
    tasks.push({
      directory: 'services/api',
      type: 'service',
      agentType: 'coder',
      prompt: buildFastAPIPrompt(context, serviceFiles),
      outputFile: 'services/api/fastapi.md',
    });
  }

  // Generate Flask docs
  if (frameworks.includes('Flask') && !docExists('services/api/flask.md')) {
    tasks.push({
      directory: 'services/api',
      type: 'service',
      agentType: 'coder',
      prompt: buildFlaskPrompt(context, serviceFiles),
      outputFile: 'services/api/flask.md',
    });
  }

  return tasks;
}

/**
 * Execute a single agent task
 */
async function executeAgentTask(
  task: AgentTask,
  context: GenerationContext,
  verbose?: boolean
): Promise<GeneratedDoc> {
  const { docsPath } = context;
  const outputPath = join(docsPath, task.outputFile);

  // Try to use claude-flow if available, otherwise generate locally
  const hasClaudeFlow = await checkClaudeFlowAvailable();

  let content: string;

  if (hasClaudeFlow) {
    content = await executeWithClaudeFlow(task, context, verbose);
  } else {
    // Fallback to local template generation
    content = generateLocalTemplate(task, context);
  }

  // Write the file
  writeFileSync(outputPath, content, 'utf-8');

  return {
    path: task.outputFile,
    title: extractTitle(content) || basename(task.outputFile, '.md'),
    type: task.type,
    generated: true,
  };
}

/**
 * Check if claude-flow is available
 */
async function checkClaudeFlowAvailable(): Promise<boolean> {
  // First try direct command (globally installed claude-flow)
  const tryDirect = new Promise<boolean>((resolve) => {
    const proc = spawn('claude-flow', ['--version'], {
      stdio: 'pipe',
      shell: false,
    });

    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
    setTimeout(() => { proc.kill(); resolve(false); }, 5000);
  });

  if (await tryDirect) return true;

  // Fall back to npx
  return new Promise((resolve) => {
    const proc = spawn('npx', ['claude-flow', '--version'], {
      stdio: 'pipe',
      shell: false,
    });

    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
    setTimeout(() => { proc.kill(); resolve(false); }, 30000);
  });
}

/**
 * Execute task using claude-flow expert agents
 */
async function executeWithClaudeFlow(
  task: AgentTask,
  context: GenerationContext,
  verbose?: boolean
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Syntax: claude-flow sparc <mode> "<task>"
    const agentCmd = `claude-flow sparc ${task.agentType} "${task.prompt.replace(/"/g, '\\"')}"`;

    if (verbose) {
      console.log(`\n  Spawning ${task.agentType} agent for ${task.outputFile}...`);
    }

    const proc = spawn(agentCmd, {
      shell: true,
      cwd: context.projectRoot,
      stdio: verbose ? 'inherit' : 'pipe',
    });

    let output = '';

    if (proc.stdout) {
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
    }

    proc.on('close', (code) => {
      if (code === 0 && output) {
        resolve(output);
      } else {
        // Fallback to local generation
        resolve(generateLocalTemplate(task, context));
      }
    });

    proc.on('error', () => {
      resolve(generateLocalTemplate(task, context));
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      proc.kill();
      resolve(generateLocalTemplate(task, context));
    }, 60000);
  });
}

/**
 * Generate document using local templates (fallback)
 */
function generateLocalTemplate(task: AgentTask, context: GenerationContext): string {
  const date = new Date().toISOString().split('T')[0];
  const { projectName } = context;

  const templates: Record<string, string> = {
    'concepts/architecture/overview.md': `---
title: Architecture Overview
type: concept
status: active
tags: [architecture, overview]
created: ${date}
---

# Architecture Overview

High-level architecture documentation for ${projectName}.

## System Overview

This document describes the overall architecture and design patterns used in ${projectName}.

## Module Structure

${context.sourceFiles.slice(0, 20).map(f => `- \`${f}\``).join('\n')}

## Key Patterns

*Document key architectural patterns here*

## Design Decisions

*Add Architecture Decision Records (ADRs)*

---
> Auto-generated by kg-agent
`,

    'components/ui/overview.md': `---
title: UI Components Overview
type: technical
status: active
tags: [components, ui]
created: ${date}
---

# UI Components

User interface components for ${projectName}.

## Component Library

${context.frameworks.includes('React') ? 'Built with **React**.' : ''}
${context.frameworks.includes('Vue') ? 'Built with **Vue**.' : ''}

## Available Components

*Document available UI components*

## Usage Patterns

*Add component usage examples*

---
> Auto-generated by kg-agent
`,

    'services/api/overview.md': `---
title: API Services Overview
type: service
status: active
tags: [api, services]
created: ${date}
---

# API Services

Backend API services for ${projectName}.

## Endpoints

*Document API endpoints*

## Authentication

*Document authentication flow*

## Error Handling

*Document error handling patterns*

---
> Auto-generated by kg-agent
`,

    'components/utilities/overview.md': `---
title: Utilities Overview
type: technical
status: active
tags: [utilities, helpers]
created: ${date}
---

# Utility Functions

Reusable utilities and helpers for ${projectName}.

## Available Utilities

*Document available utilities*

## Usage Examples

*Add code examples*

---
> Auto-generated by kg-agent
`,

    'guides/getting-started/quick-start.md': `---
title: Quick Start Guide
type: guide
status: active
tags: [guide, getting-started]
created: ${date}
---

# Quick Start

Get up and running with ${projectName}.

## Prerequisites

${context.languages.map(l => `- ${l}`).join('\n')}

## Installation

\`\`\`bash
npm install
\`\`\`

## Basic Usage

*Add basic usage instructions*

## Next Steps

- [[concepts/architecture/overview|Architecture Overview]]
- [[guides/_MOC|More Guides]]

---
> Auto-generated by kg-agent
`,

    'standards/coding-standards/guide.md': `---
title: Coding Standards
type: standard
status: active
tags: [standards, coding]
created: ${date}
---

# Coding Standards

Code style and conventions for ${projectName}.

## Language Standards

${context.languages.map(l => `### ${l}\n\n*Add ${l} specific standards*`).join('\n\n')}

## Linting Configuration

*Document ESLint/Prettier setup*

## Best Practices

*Add coding best practices*

---
> Auto-generated by kg-agent
`,

    'integrations/databases/prisma.md': `---
title: Prisma Integration
type: integration
status: active
tags: [prisma, database, orm]
created: ${date}
---

# Prisma Integration

Database ORM configuration for ${projectName}.

## Schema Location

\`prisma/schema.prisma\`

## Models

*Document database models*

## Migrations

\`\`\`bash
npx prisma migrate dev
\`\`\`

## Client Usage

*Add Prisma client usage examples*

---
> Auto-generated by kg-agent
`,

    'integrations/databases/sqlalchemy.md': `---
title: SQLAlchemy Integration
type: integration
status: active
tags: [sqlalchemy, database, orm, python]
created: ${date}
---

# SQLAlchemy Integration

Database ORM configuration for ${projectName}.

## Models

*Document your SQLAlchemy models*

## Database Connection

\`\`\`python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
\`\`\`

## Migrations (Alembic)

\`\`\`bash
alembic upgrade head
\`\`\`

## Query Examples

*Add common query patterns*

---
> Auto-generated by kg-agent
`,

    'services/api/fastapi.md': `---
title: FastAPI Service
type: service
status: active
tags: [fastapi, api, python]
created: ${date}
---

# FastAPI Service

API service documentation for ${projectName}.

## Running the Server

\`\`\`bash
uvicorn main:app --reload
\`\`\`

## API Endpoints

*Document your API endpoints*

## Authentication

*Document authentication flow*

## Request/Response Schemas

*Document Pydantic models*

---
> Auto-generated by kg-agent
`,

    'services/api/flask.md': `---
title: Flask Service
type: service
status: active
tags: [flask, api, python]
created: ${date}
---

# Flask Service

API service documentation for ${projectName}.

## Running the Server

\`\`\`bash
flask run
\`\`\`

## Routes

*Document your Flask routes*

## Blueprints

*Document blueprints structure*

## Error Handling

*Document error handling patterns*

---
> Auto-generated by kg-agent
`,
  };

  return templates[task.outputFile] || generateGenericTemplate(task, context, date);
}

/**
 * Generate a generic template for unknown task types
 */
function generateGenericTemplate(
  task: AgentTask,
  context: GenerationContext,
  date: string
): string {
  const title = basename(task.outputFile, '.md')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return `---
title: ${title}
type: ${task.type}
status: draft
tags: [${task.type}]
created: ${date}
---

# ${title}

Documentation for ${context.projectName}.

## Overview

*Add overview content*

## Details

*Add detailed documentation*

---
> Auto-generated by kg-agent
`;
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : null;
}

// Prompt builders

function buildArchitecturePrompt(context: GenerationContext, dirs: string[]): string {
  return `Analyze the architecture of ${context.projectName}.
Modules: ${dirs.join(', ')}.
Languages: ${context.languages.join(', ')}.
Generate an Architecture Overview markdown document with system design, patterns, and key decisions.`;
}

function buildComponentPrompt(context: GenerationContext, files: string[]): string {
  return `Document the UI components in ${context.projectName}.
Frameworks: ${context.frameworks.join(', ')}.
Component files: ${files.join(', ')}.
Generate a Components Overview markdown document.`;
}

function buildServicePrompt(context: GenerationContext, files: string[]): string {
  return `Document the API services in ${context.projectName}.
Service files: ${files.join(', ')}.
Generate an API Services Overview markdown document with endpoints and patterns.`;
}

function buildUtilityPrompt(context: GenerationContext, files: string[]): string {
  return `Document utility functions in ${context.projectName}.
Utility files: ${files.join(', ')}.
Generate a Utilities Overview markdown document.`;
}

function buildGettingStartedPrompt(context: GenerationContext): string {
  return `Create a Quick Start guide for ${context.projectName}.
Languages: ${context.languages.join(', ')}.
Frameworks: ${context.frameworks.join(', ')}.
Generate a Getting Started guide with installation and basic usage.`;
}

function buildCodingStandardsPrompt(
  context: GenerationContext,
  hasTypescript: boolean,
  hasLinting: boolean
): string {
  return `Document coding standards for ${context.projectName}.
TypeScript: ${hasTypescript ? 'yes' : 'no'}.
ESLint: ${hasLinting ? 'yes' : 'no'}.
Generate a Coding Standards guide with style rules and best practices.`;
}

function buildPrismaPrompt(context: GenerationContext): string {
  return `Document Prisma database integration for ${context.projectName}.
Generate integration documentation with schema, models, and usage patterns.`;
}

function buildSQLAlchemyPrompt(context: GenerationContext, modelFiles: string[]): string {
  return `Document SQLAlchemy database integration for ${context.projectName}.
Model files: ${modelFiles.slice(0, 10).join(', ')}.
Generate integration documentation with models, relationships, and query patterns.`;
}

function buildFastAPIPrompt(context: GenerationContext, serviceFiles: string[]): string {
  return `Document FastAPI API service for ${context.projectName}.
API files: ${serviceFiles.slice(0, 10).join(', ')}.
Generate API documentation with endpoints, request/response schemas, and authentication.`;
}

function buildFlaskPrompt(context: GenerationContext, serviceFiles: string[]): string {
  return `Document Flask API service for ${context.projectName}.
Route files: ${serviceFiles.slice(0, 10).join(', ')}.
Generate API documentation with routes, blueprints, and request handling.`;
}
