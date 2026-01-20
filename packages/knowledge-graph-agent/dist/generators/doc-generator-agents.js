import { existsSync, readFileSync, readdirSync, mkdirSync, copyFileSync, writeFileSync } from "fs";
import { basename, join, dirname } from "path";
import fg from "fast-glob";
import { spawn } from "child_process";
async function generateDocsWithAgents(projectRoot, docsPath, options = {}) {
  const result = {
    success: true,
    documentsGenerated: [],
    agentsSpawned: 0,
    errors: []
  };
  try {
    const context = await buildGenerationContext(projectRoot, docsPath);
    const tasks = await planDocumentGeneration(context, options.force);
    if (options.dryRun) {
      console.log("\n[Dry Run] Would generate the following documents:");
      for (const task of tasks) {
        console.log(`  - ${task.outputFile} (${task.agentType} agent)`);
      }
      if (context.serviceDocs.length > 0) {
        console.log("\n[Dry Run] Would copy service docs:");
        for (const doc of context.serviceDocs) {
          const targetPath = `services/${doc.serviceName}/${doc.relativePath}`;
          console.log(`  - ${doc.sourcePath} → ${targetPath}`);
        }
      }
      return result;
    }
    const copiedDocs = copyServiceDocs(context, options.force);
    if (options.parallel) {
      const results = await Promise.allSettled(
        tasks.map((task) => executeAgentTask(task, context, options.verbose))
      );
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        result.agentsSpawned++;
        if (r.status === "fulfilled") {
          result.documentsGenerated.push(r.value);
        } else {
          result.errors.push(`Failed: ${tasks[i].outputFile} - ${r.reason}`);
          result.documentsGenerated.push({
            path: tasks[i].outputFile,
            title: basename(tasks[i].outputFile, ".md"),
            type: tasks[i].type,
            generated: false,
            error: String(r.reason)
          });
        }
      }
    } else {
      for (const task of tasks) {
        result.agentsSpawned++;
        try {
          const doc = await executeAgentTask(task, context, options.verbose);
          result.documentsGenerated.push(doc);
        } catch (error) {
          result.errors.push(`Failed: ${task.outputFile} - ${error}`);
          result.documentsGenerated.push({
            path: task.outputFile,
            title: basename(task.outputFile, ".md"),
            type: task.type,
            generated: false,
            error: String(error)
          });
        }
      }
    }
    result.documentsGenerated.push(...copiedDocs);
    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Generation failed: ${error}`);
  }
  return result;
}
function copyServiceDocs(context, force) {
  const { docsPath, serviceDocs } = context;
  const copied = [];
  for (const doc of serviceDocs) {
    const targetDir = join(docsPath, "services", doc.serviceName);
    const targetPath = join(targetDir, doc.relativePath);
    const relativeTarget = `services/${doc.serviceName}/${doc.relativePath}`;
    if (!force && existsSync(targetPath)) {
      continue;
    }
    try {
      const targetFileDir = dirname(targetPath);
      if (!existsSync(targetFileDir)) {
        mkdirSync(targetFileDir, { recursive: true });
      }
      copyFileSync(doc.sourcePath, targetPath);
      copied.push({
        path: relativeTarget,
        title: doc.fileName.replace(".md", ""),
        type: "service",
        generated: true
      });
    } catch (error) {
      copied.push({
        path: relativeTarget,
        title: doc.fileName.replace(".md", ""),
        type: "service",
        generated: false,
        error: String(error)
      });
    }
  }
  return copied;
}
async function buildGenerationContext(projectRoot, docsPath) {
  const context = {
    projectRoot,
    docsPath,
    projectName: basename(projectRoot),
    languages: [],
    frameworks: [],
    existingDocs: [],
    sourceFiles: [],
    serviceDocs: []
  };
  const pkgPath = join(projectRoot, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      context.projectName = pkg.name?.replace(/^@[^/]+\//, "") || context.projectName;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.react) context.frameworks.push("React");
      if (deps.next) context.frameworks.push("Next.js");
      if (deps.vue) context.frameworks.push("Vue");
      if (deps.express) context.frameworks.push("Express");
      if (deps.fastify) context.frameworks.push("Fastify");
      if (deps["@prisma/client"] || deps.prisma) context.frameworks.push("Prisma");
    } catch {
    }
  }
  if (existsSync(join(projectRoot, "tsconfig.json"))) {
    context.languages.push("TypeScript");
  }
  if (existsSync(join(projectRoot, "package.json"))) {
    context.languages.push("JavaScript");
  }
  const pythonConfigPaths = [
    join(projectRoot, "requirements.txt"),
    join(projectRoot, "pyproject.toml"),
    join(projectRoot, "src/backend/requirements.txt"),
    join(projectRoot, "backend/requirements.txt"),
    join(projectRoot, "src/requirements.txt")
  ];
  const foundPythonConfig = pythonConfigPaths.find((p) => existsSync(p));
  if (foundPythonConfig) {
    context.languages.push("Python");
    try {
      let reqContent = readFileSync(foundPythonConfig, "utf-8").toLowerCase();
      if (foundPythonConfig.includes("requirements.txt")) {
        const pyprojectPath = join(projectRoot, "pyproject.toml");
        if (existsSync(pyprojectPath)) {
          reqContent += readFileSync(pyprojectPath, "utf-8").toLowerCase();
        }
      }
      if (reqContent.includes("fastapi")) context.frameworks.push("FastAPI");
      if (reqContent.includes("flask")) context.frameworks.push("Flask");
      if (reqContent.includes("django")) context.frameworks.push("Django");
      if (reqContent.includes("sqlalchemy")) context.frameworks.push("SQLAlchemy");
      if (reqContent.includes("pydantic")) context.frameworks.push("Pydantic");
      if (reqContent.includes("alembic")) context.frameworks.push("Alembic");
    } catch {
    }
  }
  if (existsSync(join(projectRoot, "Cargo.toml"))) {
    context.languages.push("Rust");
  }
  if (existsSync(join(projectRoot, "go.mod"))) {
    context.languages.push("Go");
  }
  const existingDocs = await fg("**/*.md", {
    cwd: docsPath,
    ignore: ["node_modules/**", ".git/**", "_templates/**"]
  });
  context.existingDocs = existingDocs;
  const sourceFiles = await fg("**/*.{ts,tsx,js,jsx,py,rs,go}", {
    cwd: projectRoot,
    ignore: ["node_modules/**", ".git/**", "dist/**", "build/**", docsPath + "/**"],
    dot: true
  });
  context.sourceFiles = sourceFiles;
  if (!context.languages.includes("Python") && sourceFiles.some((f) => f.endsWith(".py"))) {
    context.languages.push("Python");
  }
  const serviceDocs = [];
  const srcDir = join(projectRoot, "src");
  if (existsSync(srcDir)) {
    try {
      const srcEntries = readdirSync(srcDir, { withFileTypes: true });
      for (const entry of srcEntries) {
        if (entry.isDirectory()) {
          const serviceDocsDir = join(srcDir, entry.name, "docs");
          if (existsSync(serviceDocsDir)) {
            const docsFiles = await fg("**/*.md", {
              cwd: serviceDocsDir,
              ignore: ["node_modules/**", ".git/**"]
            });
            for (const docFile of docsFiles) {
              serviceDocs.push({
                serviceName: entry.name,
                sourcePath: join(serviceDocsDir, docFile),
                fileName: basename(docFile),
                relativePath: docFile
              });
            }
          }
        }
      }
    } catch {
    }
  }
  context.serviceDocs = serviceDocs;
  return context;
}
async function planDocumentGeneration(context, force) {
  const tasks = [];
  const { projectRoot, docsPath, sourceFiles, frameworks } = context;
  const docExists = (relativePath) => {
    if (force) return false;
    return existsSync(join(docsPath, relativePath));
  };
  const srcDirs = /* @__PURE__ */ new Set();
  const componentFiles = [];
  const serviceFiles = [];
  const utilityFiles = [];
  const backendFiles = [];
  const modelFiles = [];
  for (const file of sourceFiles) {
    const dir = file.split("/")[0];
    srcDirs.add(dir);
    const fileLower = file.toLowerCase();
    if (fileLower.includes("component") || fileLower.includes("/ui/") || fileLower.includes("/views/")) {
      componentFiles.push(file);
    }
    if (fileLower.includes("service") || fileLower.includes("/api/") || fileLower.includes("routes") || fileLower.includes("endpoints")) {
      serviceFiles.push(file);
    }
    if (fileLower.includes("util") || fileLower.includes("helper") || fileLower.includes("/lib/") || fileLower.includes("common")) {
      utilityFiles.push(file);
    }
    if (fileLower.includes("backend") || fileLower.includes("server") || fileLower.includes("app/")) {
      backendFiles.push(file);
    }
    if (fileLower.includes("model") || fileLower.includes("schema") || fileLower.includes("entities")) {
      modelFiles.push(file);
    }
    if (fileLower.includes("frontend") || fileLower.includes("client") || fileLower.includes("pages")) ;
  }
  if (serviceFiles.length === 0 && backendFiles.length > 0) {
    serviceFiles.push(...backendFiles);
  }
  if (srcDirs.size >= 1 && sourceFiles.length >= 3 && !docExists("concepts/architecture/overview.md")) {
    tasks.push({
      directory: "concepts/architecture",
      type: "concept",
      agentType: "analyst",
      prompt: buildArchitecturePrompt(context, Array.from(srcDirs)),
      outputFile: "concepts/architecture/overview.md"
    });
  }
  if (frameworks.includes("React") || frameworks.includes("Vue")) {
    if (componentFiles.length > 0 && !docExists("components/ui/overview.md")) {
      tasks.push({
        directory: "components/ui",
        type: "component",
        agentType: "coder",
        prompt: buildComponentPrompt(context, componentFiles.slice(0, 10)),
        outputFile: "components/ui/overview.md"
      });
    }
  }
  if (serviceFiles.length > 0 && !docExists("services/api/overview.md")) {
    tasks.push({
      directory: "services/api",
      type: "service",
      agentType: "coder",
      prompt: buildServicePrompt(context, serviceFiles.slice(0, 10)),
      outputFile: "services/api/overview.md"
    });
  }
  if (utilityFiles.length > 0 && !docExists("components/utilities/overview.md")) {
    tasks.push({
      directory: "components/utilities",
      type: "component",
      agentType: "coder",
      prompt: buildUtilityPrompt(context, utilityFiles.slice(0, 10)),
      outputFile: "components/utilities/overview.md"
    });
  }
  if (!docExists("guides/getting-started/quick-start.md")) {
    tasks.push({
      directory: "guides/getting-started",
      type: "guide",
      agentType: "researcher",
      prompt: buildGettingStartedPrompt(context),
      outputFile: "guides/getting-started/quick-start.md"
    });
  }
  const hasLinting = existsSync(join(projectRoot, ".eslintrc.json")) || existsSync(join(projectRoot, ".eslintrc.js")) || existsSync(join(projectRoot, "eslint.config.js"));
  const hasTypescript = existsSync(join(projectRoot, "tsconfig.json"));
  if ((hasLinting || hasTypescript) && !docExists("standards/coding-standards/guide.md")) {
    tasks.push({
      directory: "standards/coding-standards",
      type: "standard",
      agentType: "analyst",
      prompt: buildCodingStandardsPrompt(context, hasTypescript, hasLinting),
      outputFile: "standards/coding-standards/guide.md"
    });
  }
  if (frameworks.includes("Prisma") && !docExists("integrations/databases/prisma.md")) {
    tasks.push({
      directory: "integrations/databases",
      type: "integration",
      agentType: "coder",
      prompt: buildPrismaPrompt(context),
      outputFile: "integrations/databases/prisma.md"
    });
  }
  if (frameworks.includes("SQLAlchemy") && !docExists("integrations/databases/sqlalchemy.md")) {
    tasks.push({
      directory: "integrations/databases",
      type: "integration",
      agentType: "coder",
      prompt: buildSQLAlchemyPrompt(context, modelFiles),
      outputFile: "integrations/databases/sqlalchemy.md"
    });
  }
  if (frameworks.includes("FastAPI") && !docExists("services/api/fastapi.md")) {
    tasks.push({
      directory: "services/api",
      type: "service",
      agentType: "coder",
      prompt: buildFastAPIPrompt(context, serviceFiles),
      outputFile: "services/api/fastapi.md"
    });
  }
  if (frameworks.includes("Flask") && !docExists("services/api/flask.md")) {
    tasks.push({
      directory: "services/api",
      type: "service",
      agentType: "coder",
      prompt: buildFlaskPrompt(context, serviceFiles),
      outputFile: "services/api/flask.md"
    });
  }
  return tasks;
}
async function executeAgentTask(task, context, verbose) {
  const { docsPath } = context;
  const outputPath = join(docsPath, task.outputFile);
  const hasClaudeFlow = await checkClaudeFlowAvailable();
  let content;
  if (hasClaudeFlow) {
    content = await executeWithClaudeFlow(task, context, verbose);
  } else {
    content = generateLocalTemplate(task, context);
  }
  writeFileSync(outputPath, content, "utf-8");
  return {
    path: task.outputFile,
    title: extractTitle(content) || basename(task.outputFile, ".md"),
    type: task.type,
    generated: true
  };
}
async function checkClaudeFlowAvailable() {
  const tryDirect = new Promise((resolve) => {
    const proc = spawn("claude-flow", ["--version"], {
      stdio: "pipe",
      shell: false
    });
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
    setTimeout(() => {
      proc.kill();
      resolve(false);
    }, 5e3);
  });
  if (await tryDirect) return true;
  return new Promise((resolve) => {
    const proc = spawn("npx", ["claude-flow", "--version"], {
      stdio: "pipe",
      shell: false
    });
    proc.on("close", (code) => resolve(code === 0));
    proc.on("error", () => resolve(false));
    setTimeout(() => {
      proc.kill();
      resolve(false);
    }, 3e4);
  });
}
async function executeWithClaudeFlow(task, context, verbose) {
  return new Promise((resolve, reject) => {
    const agentCmd = `claude-flow sparc run ${task.agentType} "${task.prompt.replace(/"/g, '\\"')}"`;
    if (verbose) {
      console.log(`
  Spawning ${task.agentType} agent for ${task.outputFile}...`);
    }
    const proc = spawn(agentCmd, {
      shell: true,
      cwd: context.projectRoot,
      stdio: verbose ? "inherit" : "pipe"
    });
    let output = "";
    if (proc.stdout) {
      proc.stdout.on("data", (data) => {
        output += data.toString();
      });
    }
    proc.on("close", (code) => {
      if (code === 0 && output) {
        resolve(output);
      } else {
        resolve(generateLocalTemplate(task, context));
      }
    });
    proc.on("error", () => {
      resolve(generateLocalTemplate(task, context));
    });
    setTimeout(() => {
      proc.kill();
      resolve(generateLocalTemplate(task, context));
    }, 6e4);
  });
}
function generateLocalTemplate(task, context) {
  const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const { projectName } = context;
  const templates = {
    "concepts/architecture/overview.md": `---
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

${context.sourceFiles.slice(0, 20).map((f) => `- \`${f}\``).join("\n")}

## Key Patterns

*Document key architectural patterns here*

## Design Decisions

*Add Architecture Decision Records (ADRs)*

---
> Auto-generated by kg-agent
`,
    "components/ui/overview.md": `---
title: UI Components Overview
type: technical
status: active
tags: [components, ui]
created: ${date}
---

# UI Components

User interface components for ${projectName}.

## Component Library

${context.frameworks.includes("React") ? "Built with **React**." : ""}
${context.frameworks.includes("Vue") ? "Built with **Vue**." : ""}

## Available Components

*Document available UI components*

## Usage Patterns

*Add component usage examples*

---
> Auto-generated by kg-agent
`,
    "services/api/overview.md": `---
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
    "components/utilities/overview.md": `---
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
    "guides/getting-started/quick-start.md": `---
title: Quick Start Guide
type: guide
status: active
tags: [guide, getting-started]
created: ${date}
---

# Quick Start

Get up and running with ${projectName}.

## Prerequisites

${context.languages.map((l) => `- ${l}`).join("\n")}

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
    "standards/coding-standards/guide.md": `---
title: Coding Standards
type: standard
status: active
tags: [standards, coding]
created: ${date}
---

# Coding Standards

Code style and conventions for ${projectName}.

## Language Standards

${context.languages.map((l) => `### ${l}

*Add ${l} specific standards*`).join("\n\n")}

## Linting Configuration

*Document ESLint/Prettier setup*

## Best Practices

*Add coding best practices*

---
> Auto-generated by kg-agent
`,
    "integrations/databases/prisma.md": `---
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
    "integrations/databases/sqlalchemy.md": `---
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
    "services/api/fastapi.md": `---
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
    "services/api/flask.md": `---
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
`
  };
  return templates[task.outputFile] || generateGenericTemplate(task, context, date);
}
function generateGenericTemplate(task, context, date) {
  const title = basename(task.outputFile, ".md").split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1] : null;
}
function buildArchitecturePrompt(context, dirs) {
  return `Analyze the architecture of ${context.projectName}.
Modules: ${dirs.join(", ")}.
Languages: ${context.languages.join(", ")}.
Generate an Architecture Overview markdown document with system design, patterns, and key decisions.`;
}
function buildComponentPrompt(context, files) {
  return `Document the UI components in ${context.projectName}.
Frameworks: ${context.frameworks.join(", ")}.
Component files: ${files.join(", ")}.
Generate a Components Overview markdown document.`;
}
function buildServicePrompt(context, files) {
  return `Document the API services in ${context.projectName}.
Service files: ${files.join(", ")}.
Generate an API Services Overview markdown document with endpoints and patterns.`;
}
function buildUtilityPrompt(context, files) {
  return `Document utility functions in ${context.projectName}.
Utility files: ${files.join(", ")}.
Generate a Utilities Overview markdown document.`;
}
function buildGettingStartedPrompt(context) {
  return `Create a Quick Start guide for ${context.projectName}.
Languages: ${context.languages.join(", ")}.
Frameworks: ${context.frameworks.join(", ")}.
Generate a Getting Started guide with installation and basic usage.`;
}
function buildCodingStandardsPrompt(context, hasTypescript, hasLinting) {
  return `Document coding standards for ${context.projectName}.
TypeScript: ${hasTypescript ? "yes" : "no"}.
ESLint: ${hasLinting ? "yes" : "no"}.
Generate a Coding Standards guide with style rules and best practices.`;
}
function buildPrismaPrompt(context) {
  return `Document Prisma database integration for ${context.projectName}.
Generate integration documentation with schema, models, and usage patterns.`;
}
function buildSQLAlchemyPrompt(context, modelFiles) {
  return `Document SQLAlchemy database integration for ${context.projectName}.
Model files: ${modelFiles.slice(0, 10).join(", ")}.
Generate integration documentation with models, relationships, and query patterns.`;
}
function buildFastAPIPrompt(context, serviceFiles) {
  return `Document FastAPI API service for ${context.projectName}.
API files: ${serviceFiles.slice(0, 10).join(", ")}.
Generate API documentation with endpoints, request/response schemas, and authentication.`;
}
function buildFlaskPrompt(context, serviceFiles) {
  return `Document Flask API service for ${context.projectName}.
Route files: ${serviceFiles.slice(0, 10).join(", ")}.
Generate API documentation with routes, blueprints, and request handling.`;
}
export {
  generateDocsWithAgents
};
//# sourceMappingURL=doc-generator-agents.js.map
