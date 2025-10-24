# Spec-Kit Integration for Weave-NN Phase Planning

## Overview

Integration of GitHub's [spec-kit](https://github.com/github/spec-kit) to generate detailed specifications and task breakdowns for each development phase.

## Purpose

Spec-kit enables **spec-driven development** - transforming high-level phase requirements into detailed, executable specifications using AI agents. This enhances our phase planning process by:

1. **Structured Planning**: Each phase follows spec-kit's workflow (constitution → specify → plan → tasks → implement)
2. **AI-Powered Refinement**: Leverages Claude Code and other AI agents to refine requirements
3. **Task Generation**: Automatically breaks down phases into actionable tasks
4. **Technology Independence**: Specs focus on "what" before "how"

## Spec-Kit Workflow

```
Phase Requirements (Markdown)
    ↓
1. Constitution     - Define phase principles and constraints
    ↓
2. Specify         - Detail requirements and success criteria
    ↓
3. Plan            - Create technical implementation plan
    ↓
4. Tasks           - Generate actionable task list
    ↓
5. Implement       - Execute with AI coding agents
    ↓
Phase Completion Report
```

## Integration Architecture

### Directory Structure

```
/weaver/
├── specs/                          # Spec-kit specifications
│   ├── phase-5-mcp-integration/   # Phase 5 spec directory
│   │   ├── .speckit/              # Spec-kit metadata
│   │   ├── constitution.md        # Phase principles
│   │   ├── specification.md       # Detailed requirements
│   │   ├── plan.md               # Technical plan
│   │   ├── tasks.md              # Task breakdown
│   │   └── status.md             # Implementation status
│   └── phase-6-feature-mvp/      # Phase 6 spec directory
│       └── ...
├── src/
│   └── spec-generator/            # Spec-kit integration
│       ├── types.ts              # Type definitions
│       ├── parser.ts             # Parse phase documents
│       ├── generator.ts          # Generate spec-kit files
│       └── index.ts              # Main interface
└── scripts/
    ├── generate-phase-spec.ts    # CLI for spec generation
    └── sync-phase-tasks.ts       # Sync tasks to vault
```

### Components

#### 1. Phase Parser
Extracts structured data from phase planning documents:

```typescript
interface PhaseData {
  phaseId: string;           // e.g., "PHASE-5"
  phaseName: string;         // e.g., "MCP Integration"
  objectives: string[];      // Primary goals
  deliverables: string[];    // Expected outputs
  successCriteria: string[]; // Completion criteria
  dependencies: {            // Phase dependencies
    requires: string[];
    enables: string[];
  };
  constraints: string[];     // Technical constraints
  existingContext: string;   // Background/context
}
```

#### 2. Spec Generator
Transforms phase data into spec-kit format:

```typescript
class SpecKitGenerator {
  // Generate constitution (principles + constraints)
  generateConstitution(phase: PhaseData): string;

  // Generate specification (requirements + success criteria)
  generateSpecification(phase: PhaseData): string;

  // Create spec-kit directory structure
  initializePhaseSpec(phaseId: string): void;

  // Run spec-kit CLI commands
  async runSpecKitWorkflow(phaseDir: string): Promise<void>;
}
```

#### 3. Task Sync
Syncs generated tasks to vault:

```typescript
class TaskSyncManager {
  // Parse spec-kit tasks.md
  parseTasks(tasksFile: string): Task[];

  // Update vault _planning/tasks.md
  syncToVault(tasks: Task[]): void;

  // Create individual task logs in _log/tasks/
  createTaskLogs(tasks: Task[]): void;
}
```

## Usage

### 1. Generate Spec for a Phase

```bash
# From existing phase document
cd /home/aepod/dev/weave-nn/weaver
bun run generate-spec phase-5-mcp-integration

# This will:
# 1. Parse _planning/phases/phase-5-*.md
# 2. Create specs/phase-5-mcp-integration/
# 3. Generate constitution.md
# 4. Generate specification.md (ready for spec-kit)
```

### 2. Run Spec-Kit Workflow

```bash
# Navigate to spec directory
cd specs/phase-5-mcp-integration

# Run spec-kit commands (via Claude Code or other AI agent)
# /speckit.constitution  - Review and refine principles
# /speckit.specify       - Elaborate requirements
# /speckit.plan          - Generate implementation plan
# /speckit.tasks         - Break down into tasks
```

### 3. Sync Tasks to Vault

```bash
# Sync generated tasks back to vault
cd /home/aepod/dev/weave-nn/weaver
bun run sync-tasks phase-5-mcp-integration

# This will:
# 1. Parse specs/phase-5-mcp-integration/tasks.md
# 2. Update _planning/tasks.md
# 3. Create task logs in _log/tasks/
```

## Example: Phase 5 Spec Generation

### Input: Phase 5 Planning Document

```markdown
---
phase_id: "PHASE-5"
phase_name: "MCP Integration"
status: "planned"
---

# Phase 5: MCP Integration

## Objectives
- Implement MCP server exposing shadow cache
- Create workflow trigger tools
- Integrate Claude Code hooks
```

### Output: constitution.md

```markdown
# Phase 5 MCP Integration - Constitution

## Project Principles

1. **MCP Protocol Compliance**
   - Implement @modelcontextprotocol/sdk standards
   - Follow JSON-RPC 2.0 specification
   - Support stdio and SSE transports

2. **Tool-First Design**
   - Shadow cache operations as MCP tools
   - Workflow triggers as MCP tools
   - File operations as MCP tools

3. **Claude Code Integration**
   - Hook-based workflow triggers
   - Task completion tracking
   - Phase milestone tracking

## Technical Constraints

- TypeScript strict mode
- Bun package manager
- Pass typecheck + lint before completion
- No breaking changes to Phase 4B components

## Success Criteria

- [ ] MCP server operational
- [ ] 10+ tools exposed
- [ ] Claude Code hooks working
- [ ] Proof workflows enhanced
```

### Output: specification.md

```markdown
# Phase 5 MCP Integration - Specification

## Overview
Expose Weaver's capabilities (shadow cache, workflows) via MCP protocol
to enable AI agent interactions.

## Requirements

### 1. MCP Server Implementation
- Use @modelcontextprotocol/sdk
- Support stdio transport (primary)
- Implement server lifecycle (startup, shutdown)
- Add health check endpoint

### 2. Shadow Cache Tools
- query_files - Search files by path, type, status, tag
- get_file - Retrieve specific file metadata
- search_content - Full-text search
- get_tags - List all tags
- get_links - Get file relationships

### 3. Workflow Tools
- trigger_workflow - Manually trigger workflow
- get_workflow_status - Check execution status
- list_workflows - Show registered workflows
- get_workflow_history - View execution history

### 4. Claude Code Hooks
- pre-task - Before task execution
- post-task - After task completion
- post-edit - After file modification
- session-restore - Restore session context
- session-end - Export metrics

## Non-Requirements (Phase 6+)
- Obsidian plugin integration
- GitHub integration
- Multi-agent orchestration
```

## Workflow Integration

Spec-kit generation triggers Weaver workflows:

```typescript
// Phase spec generation workflow
export const phaseSpecGenerationWorkflow: WorkflowDefinition = {
  id: 'phase-spec-generation',
  name: 'Phase Spec Generation Workflow',
  description: 'Generates spec-kit specifications from phase documents',
  triggers: ['manual'],
  enabled: true,
  handler: async (context: WorkflowContext) => {
    const { input } = context;
    const phaseId = input?.phaseId;

    // 1. Parse phase document
    const phaseData = await parsePhaseDocument(phaseId);

    // 2. Generate spec-kit files
    const specDir = await generateSpecKitFiles(phaseData);

    // 3. Log completion
    logger.info('✅ Phase spec generated', {
      phaseId,
      specDir,
      files: ['constitution.md', 'specification.md']
    });
  }
};
```

## Benefits

### For Phase Planning
- **Consistency**: Every phase follows same spec workflow
- **Completeness**: AI helps identify missing requirements
- **Clarity**: Structured format improves communication
- **Traceability**: Specs → Plans → Tasks → Implementation

### For Task Generation
- **AI-Powered**: Leverages Claude Code for task breakdown
- **Granularity**: Generates actionable, bite-sized tasks
- **Estimation**: AI can estimate complexity/duration
- **Dependencies**: Identifies task ordering and dependencies

### For Knowledge Graph
- **Structured Data**: Specs create linkable nodes
- **Relationships**: Phase → Specs → Tasks → Code
- **History**: Track evolution of requirements
- **Context**: Rich metadata for AI agents

## Installation

### Prerequisites

```bash
# Install uv package manager (if not installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install spec-kit CLI
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# Verify installation
specify check
```

### Weaver Integration

```bash
# Install dependencies
cd /home/aepod/dev/weave-nn/weaver
bun install

# Add to package.json scripts
{
  "scripts": {
    "generate-spec": "bun run scripts/generate-phase-spec.ts",
    "sync-tasks": "bun run scripts/sync-phase-tasks.ts"
  }
}
```

## Next Steps

### Implementation Plan

1. **Phase 1**: Basic Integration (1-2 days)
   - [ ] Create spec-generator module
   - [ ] Implement phase parser
   - [ ] Generate constitution + specification
   - [ ] Test with Phase 5 document

2. **Phase 2**: Spec-Kit Workflow (1 day)
   - [ ] Install spec-kit CLI
   - [ ] Run /speckit.plan on Phase 5
   - [ ] Run /speckit.tasks on Phase 5
   - [ ] Validate output quality

3. **Phase 3**: Task Sync (1 day)
   - [ ] Implement task parser
   - [ ] Sync tasks to vault
   - [ ] Create task log files
   - [ ] Trigger task-completion workflow

4. **Phase 4**: Automation (1 day)
   - [ ] Create workflow for spec generation
   - [ ] Add MCP tool for spec generation
   - [ ] Document workflow for all phases
   - [ ] Create phase template

## References

- [Spec-Kit Repository](https://github.com/github/spec-kit)
- [Spec-Kit Documentation](https://github.com/github/spec-kit/blob/main/README.md)
- [Weaver Architecture](/weaver/README.md)
- [Phase Planning Process](/weave-nn/_planning/phases/)
