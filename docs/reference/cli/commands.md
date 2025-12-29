# CLI Commands Reference

Complete reference documentation for all CLI commands available in the `kg` CLI tool.

**Version:** 0.4.0
**Binary:** `kg`

---

## Table of Contents

- [Overview](#overview)
- [Core Commands](#core-commands)
- [Analysis Commands](#analysis-commands)
- [SOP Commands](#sop-commands)
- [Primitives Commands](#primitives-commands)
- [Git Commands](#git-commands)
- [Diagnostics Commands](#diagnostics-commands)
- [Workflow Commands](#workflow-commands)
- [Vector Commands](#vector-commands)
- [Audit Commands](#audit-commands)
- [Configuration Commands](#configuration-commands)
- [Global Options](#global-options)
- [Environment Variables](#environment-variables)
- [Exit Codes](#exit-codes)

---

## Overview

The `kg` CLI provides comprehensive commands for managing knowledge graphs, from initialization to analysis to integration with external systems.

### Installation

```bash
npm install -g @weave-nn/knowledge-graph-agent
```

### Basic Usage

```bash
kg <command> [subcommand] [options]
```

---

## Core Commands

### kg init

Initialize knowledge graph in the current project.

```bash
kg init [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Docs directory path | `docs` |
| `-n, --name <name>` | Project name | Auto-detected |
| `--no-db` | Skip database initialization | `false` |
| `--no-config` | Skip config file creation | `false` |
| `-f, --force` | Overwrite existing files | `false` |

**Examples:**

```bash
# Initialize in current directory
kg init

# Initialize with custom paths
kg init --path /my/project --docs documentation

# Force reinitialize
kg init --force
```

---

### kg graph

Generate or update knowledge graph from documentation.

```bash
kg graph [options]
kg graph analyze [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Docs directory path | `docs` |
| `-u, --update` | Incremental update | `false` |
| `-v, --verbose` | Show detailed output | `false` |

**Subcommands:**

- `kg graph analyze` - Analyze graph structure and suggest improvements

**Examples:**

```bash
# Generate knowledge graph
kg graph

# Incremental update
kg graph --update

# Analyze graph structure
kg graph analyze
```

---

### kg docs

Documentation management commands.

```bash
kg docs init [options]
kg docs status [options]
```

#### kg docs init

Initialize documentation directory with weave-nn structure.

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Docs directory path | `docs` |
| `-t, --template <template>` | Template (default, minimal) | `default` |
| `--no-examples` | Skip example files | `false` |
| `--no-detect` | Skip framework detection | `false` |
| `-f, --force` | Overwrite existing files | `false` |

**Created Structure:**

```
docs/
├── README.md
├── PRIMITIVES.md
├── MOC.md
├── concepts/
├── components/
├── services/
├── features/
├── integrations/
├── standards/
├── guides/
└── references/
```

---

### kg claude

CLAUDE.md management commands.

```bash
kg claude update [options]
kg claude preview [options]
kg claude add-section <name> [options]
kg claude templates
```

#### kg claude update

Generate or update CLAUDE.md file.

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-o, --output <path>` | Output path | `CLAUDE.md` |
| `-t, --template <template>` | Template (default, minimal, full) | `default` |
| `--no-kg` | Skip knowledge graph section | `false` |
| `--no-cf` | Skip claude-flow section | `false` |
| `-f, --force` | Overwrite existing file | `false` |

**Examples:**

```bash
# Generate CLAUDE.md
kg claude update

# Preview without writing
kg claude preview

# List available templates
kg claude templates
```

---

### kg sync

Synchronize knowledge graph with claude-flow memory.

```bash
kg sync [options]
kg sync config [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-n, --namespace <namespace>` | Memory namespace | `knowledge-graph` |
| `--show-commands` | Show MCP commands | `false` |
| `--hooks` | Show hook configuration | `false` |

---

### kg stats

Display knowledge graph statistics.

```bash
kg stats [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `--json` | Output as JSON | `false` |

**Output:**

- Total nodes and edges
- Orphan nodes count
- Average links per node
- Nodes by type breakdown
- Nodes by status breakdown
- Most connected nodes

---

### kg search

Search the knowledge graph.

```bash
kg search <query> [options]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `<query>` | Search query string |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-t, --type <type>` | Filter by node type | - |
| `-g, --tag <tag>` | Filter by tag | - |
| `-l, --limit <number>` | Limit results | `20` |
| `--json` | Output as JSON | `false` |

**Examples:**

```bash
# Basic search
kg search "authentication"

# Filter by type
kg search "database" --type service

# Filter by tag
kg search "api" --tag backend
```

---

## Analysis Commands

### kg analyze

Analyze and migrate docs to knowledge graph structure.

```bash
kg analyze [options]
kg analyze deep [options]
kg analyze report [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-s, --source <dir>` | Source docs directory | `docs` |
| `-t, --target <dir>` | Target directory | `docs-nn` |
| `--use-claude-flow` | Use claude-flow for analysis | `false` |
| `--no-moc` | Skip MOC generation | `false` |
| `--max-depth <n>` | Maximum analysis depth | `3` |
| `--dry-run` | Preview changes | `false` |
| `-v, --verbose` | Verbose output | `false` |

**Subcommands:**

- `kg analyze deep` - Deep analysis using claude-flow agents
- `kg analyze report` - Generate analysis report

---

### kg convert

Convert existing docs to weave-nn structure.

```bash
kg convert docs [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-s, --source <dir>` | Source docs directory | `docs` |
| `-t, --target <dir>` | Target directory | `docs-nn` |
| `--no-auto-category` | Disable auto-categorization | `false` |
| `-f, --force` | Overwrite existing files | `false` |
| `--dry-run` | Preview changes | `false` |

---

### kg frontmatter

Manage frontmatter in markdown files.

```bash
kg frontmatter add [target] [options]
kg frontmatter validate [target] [options]
kg frontmatter update [target] [options]
```

**Options for `add`:**

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --type <type>` | Node type | Auto-detected |
| `-s, --status <status>` | Status | `active` |
| `--tags <tags>` | Comma-separated tags | - |
| `-f, --force` | Overwrite existing | `false` |
| `--dry-run` | Preview changes | `false` |

---

## SOP Commands

### kg sop init

Initialize AI-SDLC SOP standards layer.

```bash
kg sop init [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Documentation path | `docs` |
| `-c, --categories <categories>` | SOP categories (comma-separated) | All |
| `-v, --verbose` | Verbose output | `false` |

---

### kg sop check

Check project compliance against AI-SDLC SOPs.

```bash
kg sop check [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --sop <id>` | Check specific SOP | - |
| `-c, --category <category>` | Check specific category | - |
| `--deep` | Deep analysis | `false` |
| `--threshold <number>` | Minimum threshold (0-100) | `50` |
| `--json` | Output as JSON | `false` |

---

### kg sop gaps

Analyze compliance gaps.

```bash
kg sop gaps [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--priority <priority>` | Minimum priority | - |
| `--category <category>` | Filter by category | - |
| `--roadmap` | Include remediation roadmap | `false` |
| `--json` | Output as JSON | `false` |

---

### kg sop report

Generate comprehensive compliance report.

```bash
kg sop report [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <file>` | Output file path | `docs/sop/COMPLIANCE-REPORT.md` |
| `-f, --format <format>` | Format (md, json, html) | `md` |
| `--include-evidence` | Include evidence details | `false` |
| `--include-roadmap` | Include remediation roadmap | `false` |

---

### kg sop list

List available AI-SDLC SOPs.

```bash
kg sop list [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-c, --category <category>` | Filter by category | - |
| `--irb` | Show IRB-required only | `false` |
| `--json` | Output as JSON | `false` |

---

## Primitives Commands

### kg init-primitives

Bootstrap knowledge graph with primitive nodes from codebase.

```bash
kg init-primitives [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Documentation path | `docs` |
| `-o, --output <path>` | Output path | Docs path |
| `--dry-run` | Analyze only | `false` |
| `-v, --verbose` | Verbose output | `false` |
| `--ecosystem <ecosystems>` | Filter ecosystems | All |
| `--include-dev` | Include dev dependencies | `false` |
| `--major-only` | Major dependencies only | `false` |

---

### kg analyze-codebase

Analyze codebase dependencies and services.

```bash
kg analyze-codebase [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-v, --verbose` | Verbose output | `false` |
| `--json` | Output as JSON | `false` |

---

### kg cultivate

Systematically cultivate and enhance the knowledge graph.

```bash
kg cultivate [path] [options]
```

**Arguments:**

| Argument | Description | Default |
|----------|-------------|---------|
| `[path]` | Directory to cultivate | `.` |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes | `false` |
| `-d, --docs <path>` | Documentation path | `docs` |
| `--seed` | Bootstrap with primitives | `false` |
| `--deep-analysis` | Use claude-flow agents | `false` |
| `--cache` | Use shadow cache | `true` |
| `--refresh-cache` | Force refresh cache | `false` |

---

## Git Commands

### kg commit

Create a git commit with optional auto-generated message.

```bash
kg commit [options]
kg commit status [options]
kg commit log [options]
kg commit diff [options]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-m, --message <message>` | Commit message | - |
| `-n, --dry-run` | Preview commit | `false` |
| `-a, --auto` | Auto-generate message | `false` |
| `-p, --push` | Push after committing | `false` |
| `-i, --interactive` | Interactive mode | `false` |
| `-A, --all` | Stage all changes | `false` |
| `--amend` | Amend previous commit | `false` |

**Subcommands:**

- `kg commit status` - Show git status with analysis
- `kg commit log` - Show recent commits
- `kg commit diff` - Show diff of changes

---

## Diagnostics Commands

### kg diag

System diagnostics and health monitoring.

**Alias:** `kg diagnostics`

```bash
kg diag health [options]
kg diag integrity [options]
kg diag memory
kg diag status
```

#### Subcommands

| Command | Description |
|---------|-------------|
| `health` | Run health checks on all components |
| `integrity` | Check database integrity |
| `memory` | Show memory usage statistics |
| `status` | Show overall system status |

**Options for `integrity`:**

| Option | Description | Default |
|--------|-------------|---------|
| `--repair` | Attempt to repair issues | `false` |

---

## Workflow Commands

### kg workflow

Manage knowledge graph workflows.

**Alias:** `kg wf`

```bash
kg workflow start <type> [options]
kg workflow status [id] [options]
kg workflow list [options]
kg workflow stop <id> [options]
kg workflow history [options]
kg workflow resume <id>
```

**Workflow Types:**

| Type | Description |
|------|-------------|
| `analysis` | Analyze codebase and extract knowledge |
| `sync` | Synchronize with external systems |
| `generation` | Generate knowledge graph artifacts |
| `validation` | Validate graph integrity |
| `migration` | Migrate data between formats |

**Options for `start`:**

| Option | Description | Default |
|--------|-------------|---------|
| `-i, --input <json>` | Input data as JSON | - |
| `-a, --async` | Run asynchronously | `false` |
| `--dry-run` | Preview workflow | `false` |

**Options for `list`:**

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --status <status>` | Filter by status | - |
| `-t, --type <type>` | Filter by type | - |
| `-n, --limit <number>` | Limit results | `10` |
| `--json` | Output as JSON | `false` |

---

## Vector Commands

### kg vector

Vector operations for semantic search and trajectory tracking.

**Alias:** `kg vec`

```bash
kg vector search <query> [options]
kg vector stats [options]
kg vector rebuild [options]
kg vector trajectory list [options]
kg vector trajectory show <id>
kg vector trajectory patterns [options]
kg vector trajectory clear [options]
```

**Options for `search`:**

| Option | Description | Default |
|--------|-------------|---------|
| `-k, --top-k <n>` | Number of results | `10` |
| `-t, --type <type>` | Filter by node type | - |
| `--hybrid` | Enable hybrid search | `false` |
| `--min-score <score>` | Minimum similarity (0-1) | `0` |
| `--json` | Output as JSON | `false` |

**Options for `rebuild`:**

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Force rebuild | `false` |
| `--batch-size <size>` | Batch size | `100` |
| `-v, --verbose` | Verbose output | `false` |

**Trajectory Subcommands:**

- `list` - List recorded trajectories
- `show <id>` - Show trajectory details
- `patterns` - Show detected patterns
- `clear` - Clear trajectory data

---

## Audit Commands

### kg audit

Query and manage the exochain audit log.

```bash
kg audit query [options]
kg audit checkpoint [options]
kg audit verify [options]
kg audit sync status [options]
kg audit sync peers [options]
kg audit sync now [options]
kg audit export [options]
kg audit stats [options]
```

**Options for `query`:**

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --type <type>` | Filter by event type | - |
| `-s, --start <date>` | Start date (ISO format) | - |
| `-e, --end <date>` | End date (ISO format) | - |
| `-l, --limit <n>` | Maximum results | `50` |
| `-a, --author <did>` | Filter by author DID | - |
| `--json` | Output as JSON | `false` |

**Options for `checkpoint`:**

| Option | Description | Default |
|--------|-------------|---------|
| `-n, --name <name>` | Checkpoint name | - |
| `-t, --tags <tags>` | Comma-separated tags | - |
| `--json` | Output as JSON | `false` |

**Options for `verify`:**

| Option | Description | Default |
|--------|-------------|---------|
| `--full` | Full chain verification | `false` |
| `--json` | Output as JSON | `false` |

---

## Configuration Commands

### kg config

Manage knowledge graph configuration.

```bash
kg config show [options]
kg config set <key> <value>
kg config reset [options]
kg config validate
kg config defaults
```

**Subcommands:**

| Command | Description |
|---------|-------------|
| `show` | Show current configuration |
| `set <key> <value>` | Set configuration value |
| `reset` | Reset to defaults |
| `validate` | Validate configuration |
| `defaults` | Show default values |

**Examples:**

```bash
# Show configuration
kg config show --json

# Set a value
kg config set database.cacheSize 10000

# Reset to defaults
kg config reset --yes
```

---

## Global Options

These options are available for all commands:

| Option | Description |
|--------|-------------|
| `-v, --version` | Display version number |
| `-h, --help` | Display help for command |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KG_HOME` | Knowledge graph home directory | `.kg` |
| `KG_DEBUG` | Enable debug logging | `false` |
| `KG_CONFIG` | Path to configuration file | `.kg/config.json` |

---

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | Success |
| `1` | General error |
| `2` | Invalid arguments |
| `3` | Database error |
| `4` | File system error |

---

## See Also

- [API Reference](../api/index.md)
- [MCP Tools Reference](../mcp/tools.md)
