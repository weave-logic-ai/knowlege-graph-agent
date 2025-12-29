# Knowledge Graph Agent CLI Commands Reference

Complete reference documentation for all CLI commands available in the `kg` CLI tool.

**Version**: 0.3.0+

## Table of Contents

1. [Core Commands](#core-commands)
   - [kg init](#kg-init)
   - [kg graph](#kg-graph)
   - [kg docs](#kg-docs)
   - [kg claude](#kg-claude)
   - [kg sync](#kg-sync)
   - [kg stats](#kg-stats)
   - [kg search](#kg-search)
2. [Analysis Commands](#analysis-commands)
   - [kg analyze](#kg-analyze)
   - [kg convert](#kg-convert)
   - [kg frontmatter](#kg-frontmatter)
3. [SOP Commands](#sop-commands)
   - [kg sop init](#kg-sop-init)
   - [kg sop check](#kg-sop-check)
   - [kg sop gaps](#kg-sop-gaps)
   - [kg sop report](#kg-sop-report)
   - [kg sop list](#kg-sop-list)
4. [Primitives Commands](#primitives-commands)
   - [kg init-primitives](#kg-init-primitives)
   - [kg analyze-codebase](#kg-analyze-codebase)
   - [kg cultivate](#kg-cultivate)
5. [Git Commands](#git-commands)
   - [kg commit](#kg-commit)
6. [Diagnostics Commands](#diagnostics-commands)
   - [kg diag / kg diagnostics](#kg-diag)
7. [Workflow Commands](#workflow-commands)
   - [kg workflow](#kg-workflow)
8. [Vector Commands](#vector-commands)
   - [kg vector](#kg-vector)
9. [Audit Commands](#audit-commands)
   - [kg audit](#kg-audit)
10. [Configuration Commands](#configuration-commands)
    - [kg config](#kg-config)

---

## Core Commands

### kg init

Initialize knowledge graph in the current project.

**Syntax**:
```bash
kg init [options]
```

**Description**:
Creates the `.kg` directory structure, initializes the SQLite database, and generates the initial configuration file.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Docs directory path | `docs` |
| `-n, --name <name>` | Project name | Auto-detected |
| `--no-db` | Skip database initialization | `false` |
| `--no-config` | Skip config file creation | `false` |
| `-f, --force` | Overwrite existing files | `false` |

**Examples**:
```bash
# Initialize in current directory
kg init

# Initialize with custom paths
kg init --path /my/project --docs documentation

# Force reinitialize
kg init --force

# Initialize without database
kg init --no-db
```

**Related Commands**: `kg docs init`, `kg graph`, `kg claude update`

---

### kg graph

Generate or update knowledge graph from documentation.

**Syntax**:
```bash
kg graph [options]
kg graph analyze [options]
```

**Description**:
Scans documentation files and generates a knowledge graph with nodes and edges representing concepts and their relationships.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Docs directory path | `docs` |
| `-u, --update` | Incremental update instead of full regeneration | `false` |
| `-v, --verbose` | Show detailed output | `false` |

**Subcommands**:

#### kg graph analyze
Analyze graph structure and suggest improvements.

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |

**Examples**:
```bash
# Generate knowledge graph
kg graph

# Incremental update
kg graph --update

# Verbose output
kg graph --verbose

# Analyze graph structure
kg graph analyze
```

**Related Commands**: `kg stats`, `kg docs init`

---

### kg docs

Documentation management commands.

**Syntax**:
```bash
kg docs init [options]
kg docs status [options]
```

**Description**:
Initialize and manage the documentation directory with the weave-nn structure.

#### kg docs init

Initialize documentation directory with weave-nn structure.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Docs directory path | `docs` |
| `-t, --template <template>` | Template to use (default, minimal) | `default` |
| `--no-examples` | Skip example files | `false` |
| `--no-detect` | Skip framework detection | `false` |
| `-f, --force` | Overwrite existing files | `false` |

**Created Structure**:
```
docs/
├── README.md           # Documentation home
├── PRIMITIVES.md       # Technology primitives
├── MOC.md              # Map of Content
├── concepts/           # Abstract concepts
├── components/         # Reusable components
├── services/           # Backend services
├── features/           # Product features
├── integrations/       # External integrations
├── standards/          # Coding standards
├── guides/             # How-to guides
└── references/         # API references
```

#### kg docs status

Show documentation status.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |

**Examples**:
```bash
# Initialize docs
kg docs init

# Initialize with custom template
kg docs init --template minimal

# Check docs status
kg docs status
```

**Related Commands**: `kg graph`, `kg init`

---

### kg claude

CLAUDE.md management commands.

**Syntax**:
```bash
kg claude update [options]
kg claude preview [options]
kg claude add-section <name> [options]
kg claude templates
```

**Description**:
Generate and manage the CLAUDE.md file for Claude Code integration.

#### kg claude update

Generate or update CLAUDE.md file.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-o, --output <path>` | Output path for CLAUDE.md | `CLAUDE.md` |
| `-t, --template <template>` | Template to use (default, minimal, full) | `default` |
| `--no-kg` | Skip knowledge graph section | `false` |
| `--no-cf` | Skip claude-flow section | `false` |
| `-f, --force` | Overwrite existing file | `false` |

#### kg claude preview

Preview CLAUDE.md without writing.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-t, --template <template>` | Template to use | `default` |

#### kg claude add-section

Add a section to existing CLAUDE.md.

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<name>` | Section template name |

#### kg claude templates

List available section templates.

**Examples**:
```bash
# Generate CLAUDE.md
kg claude update

# Preview without writing
kg claude preview

# Add a section
kg claude add-section knowledge-graph

# List templates
kg claude templates
```

**Related Commands**: `kg sync`, `kg init`

---

### kg sync

Synchronize knowledge graph with claude-flow memory.

**Syntax**:
```bash
kg sync [options]
kg sync config [options]
```

**Description**:
Syncs the knowledge graph database with claude-flow's memory system for runtime access.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-n, --namespace <namespace>` | Memory namespace | `knowledge-graph` |
| `--show-commands` | Show MCP commands instead of executing | `false` |
| `--hooks` | Show hook configuration commands | `false` |

#### kg sync config

Show MCP configuration for CLAUDE.md.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-n, --namespace <namespace>` | Memory namespace | `knowledge-graph` |

**Examples**:
```bash
# Sync with claude-flow
kg sync

# Use custom namespace
kg sync --namespace my-project

# Show MCP commands
kg sync --show-commands

# Show hook commands
kg sync --hooks

# Get MCP config
kg sync config
```

**Related Commands**: `kg claude update`, `kg graph`

---

### kg stats

Display knowledge graph statistics.

**Syntax**:
```bash
kg stats [options]
```

**Description**:
Shows comprehensive statistics about the knowledge graph including node counts, edge counts, and connection metrics.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `--json` | Output as JSON | `false` |

**Output Includes**:
- Total nodes and edges
- Orphan nodes count
- Average links per node
- Nodes by type breakdown
- Nodes by status breakdown
- Most connected nodes
- Metadata (version, generation timestamps)

**Examples**:
```bash
# Show statistics
kg stats

# Output as JSON
kg stats --json

# Stats for specific path
kg stats --path /my/project
```

**Related Commands**: `kg graph`, `kg search`

---

### kg search

Search the knowledge graph.

**Syntax**:
```bash
kg search <query> [options]
```

**Description**:
Performs full-text search across the knowledge graph nodes.

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<query>` | Search query string |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-t, --type <type>` | Filter by node type | - |
| `-g, --tag <tag>` | Filter by tag | - |
| `-l, --limit <number>` | Limit results | `20` |
| `--json` | Output as JSON | `false` |

**Examples**:
```bash
# Basic search
kg search "authentication"

# Filter by type
kg search "database" --type service

# Filter by tag
kg search "api" --tag backend

# Limit results
kg search "component" --limit 5

# JSON output
kg search "user" --json
```

**Related Commands**: `kg stats`, `kg graph`

---

## Analysis Commands

### kg analyze

Analyze and migrate docs to knowledge graph structure.

**Syntax**:
```bash
kg analyze [options]
kg analyze deep [options]
kg analyze report [options]
```

**Description**:
Analyzes existing documentation and migrates it to the knowledge graph structure with proper categorization and metadata.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-s, --source <dir>` | Source docs directory | `docs` |
| `-t, --target <dir>` | Target directory | `docs-nn` |
| `--use-claude-flow` | Use claude-flow for deep analysis | `false` |
| `--no-moc` | Skip MOC (Map of Content) generation | `false` |
| `--no-link-original` | Do not link back to original docs | `false` |
| `--max-depth <n>` | Maximum analysis depth | `3` |
| `--dry-run` | Show what would be done without making changes | `false` |
| `-v, --verbose` | Verbose output | `false` |

#### kg analyze deep

Deep analysis using claude-flow agents for comprehensive knowledge extraction.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-s, --source <dir>` | Source docs directory | `docs` |
| `-t, --target <dir>` | Target directory | `docs-nn` |
| `--agents <n>` | Number of parallel agents | `3` |

#### kg analyze report

Generate analysis report without creating files.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-s, --source <dir>` | Source docs directory | `docs` |
| `--json` | Output as JSON | `false` |

**Examples**:
```bash
# Analyze and migrate docs
kg analyze

# Dry run
kg analyze --dry-run

# Deep analysis with claude-flow
kg analyze deep

# Generate report only
kg analyze report --json
```

**Related Commands**: `kg convert`, `kg frontmatter`

---

### kg convert

Convert existing docs to weave-nn structure.

**Syntax**:
```bash
kg convert docs [options]
```

**Description**:
Converts existing documentation to the weave-nn structure with proper categorization.

#### kg convert docs

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-s, --source <dir>` | Source docs directory | `docs` |
| `-t, --target <dir>` | Target directory | `docs-nn` |
| `--no-auto-category` | Disable auto-categorization | `false` |
| `-f, --force` | Overwrite existing files | `false` |
| `--dry-run` | Show what would be done without making changes | `false` |

**Examples**:
```bash
# Convert docs
kg convert docs

# Convert with custom paths
kg convert docs --source legacy-docs --target new-docs

# Dry run
kg convert docs --dry-run

# Force overwrite
kg convert docs --force
```

**Related Commands**: `kg analyze`, `kg frontmatter`

---

### kg frontmatter

Manage frontmatter in markdown files.

**Syntax**:
```bash
kg frontmatter add [target] [options]
kg frontmatter validate [target] [options]
kg frontmatter update [target] [options]
```

**Description**:
Add, validate, or update YAML frontmatter in markdown documentation files.

#### kg frontmatter add

Add frontmatter to files missing it.

**Arguments**:
| Argument | Description | Default |
|----------|-------------|---------|
| `[target]` | Target path | `docs` |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-t, --type <type>` | Node type (concept, technical, feature, service, guide, standard, integration) | Auto-detected |
| `-s, --status <status>` | Status (draft, active, deprecated, archived) | `active` |
| `--tags <tags>` | Comma-separated tags | - |
| `-f, --force` | Overwrite existing frontmatter | `false` |
| `--dry-run` | Show what would be done | `false` |

#### kg frontmatter validate

Validate frontmatter in markdown files.

**Arguments**:
| Argument | Description | Default |
|----------|-------------|---------|
| `[target]` | Target path | `docs` |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |

#### kg frontmatter update

Update/regenerate frontmatter (overwrites existing).

**Arguments**:
| Argument | Description | Default |
|----------|-------------|---------|
| `[target]` | Target path | `docs` |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-t, --type <type>` | Force specific node type | - |
| `--dry-run` | Show what would be done | `false` |

**Examples**:
```bash
# Add frontmatter
kg frontmatter add

# Add with specific type
kg frontmatter add docs --type concept --tags "core,important"

# Validate frontmatter
kg frontmatter validate

# Update all frontmatter
kg frontmatter update --force
```

**Related Commands**: `kg convert`, `kg analyze`

---

## SOP Commands

### kg sop init

Initialize AI-SDLC SOP standards layer.

**Syntax**:
```bash
kg sop init [options]
```

**Description**:
Creates the SOP standards layer with the AI-SDLC compliance framework.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Documentation path | `docs` |
| `-c, --categories <categories>` | SOP categories to include (comma-separated) | All |
| `-v, --verbose` | Verbose output | `false` |

**Examples**:
```bash
# Initialize all SOPs
kg sop init

# Initialize specific categories
kg sop init --categories "security,testing"

# Verbose output
kg sop init --verbose
```

**Related Commands**: `kg sop check`, `kg sop gaps`

---

### kg sop check

Check project compliance against AI-SDLC SOPs.

**Syntax**:
```bash
kg sop check [options]
```

**Description**:
Runs compliance checks against the AI-SDLC Standard Operating Procedures.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Documentation path | `docs` |
| `-s, --sop <id>` | Check specific SOP by ID | - |
| `-c, --category <category>` | Check SOPs in specific category | - |
| `--deep` | Perform deep analysis of file contents | `false` |
| `--threshold <number>` | Minimum compliance threshold (0-100) | `50` |
| `-v, --verbose` | Verbose output | `false` |
| `--json` | Output as JSON | `false` |

**Examples**:
```bash
# Check compliance
kg sop check

# Check specific SOP
kg sop check --sop SOP-001

# Check category
kg sop check --category security

# Deep analysis
kg sop check --deep

# Set threshold
kg sop check --threshold 80
```

**Related Commands**: `kg sop gaps`, `kg sop report`

---

### kg sop gaps

Analyze compliance gaps and generate remediation recommendations.

**Syntax**:
```bash
kg sop gaps [options]
```

**Description**:
Identifies compliance gaps and provides actionable remediation recommendations.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Documentation path | `docs` |
| `--priority <priority>` | Minimum gap priority (critical, high, medium, low) | - |
| `--category <category>` | Filter by category | - |
| `--roadmap` | Include remediation roadmap | `false` |
| `-v, --verbose` | Verbose output | `false` |
| `--json` | Output as JSON | `false` |

**Examples**:
```bash
# Analyze gaps
kg sop gaps

# Filter by priority
kg sop gaps --priority critical

# Include roadmap
kg sop gaps --roadmap

# JSON output
kg sop gaps --json
```

**Related Commands**: `kg sop check`, `kg sop report`

---

### kg sop report

Generate comprehensive compliance report.

**Syntax**:
```bash
kg sop report [options]
```

**Description**:
Creates a detailed compliance report in markdown, JSON, or HTML format.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Documentation path | `docs` |
| `-o, --output <file>` | Output file path | `docs/sop/COMPLIANCE-REPORT.md` |
| `-f, --format <format>` | Output format (md, json, html) | `md` |
| `--include-evidence` | Include evidence details | `false` |
| `--include-roadmap` | Include remediation roadmap | `false` |

**Examples**:
```bash
# Generate report
kg sop report

# HTML format
kg sop report --format html

# Custom output
kg sop report --output report.json --format json

# Include all details
kg sop report --include-evidence --include-roadmap
```

**Related Commands**: `kg sop check`, `kg sop gaps`

---

### kg sop list

List available AI-SDLC SOPs.

**Syntax**:
```bash
kg sop list [options]
```

**Description**:
Displays all available Standard Operating Procedures grouped by category.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-c, --category <category>` | Filter by category | - |
| `--irb` | Show only SOPs requiring AI-IRB review | `false` |
| `--json` | Output as JSON | `false` |

**Examples**:
```bash
# List all SOPs
kg sop list

# Filter by category
kg sop list --category security

# Show IRB-required only
kg sop list --irb

# JSON output
kg sop list --json
```

**Related Commands**: `kg sop init`, `kg sop check`

---

## Primitives Commands

### kg init-primitives

Bootstrap knowledge graph with primitive nodes from codebase.

**Syntax**:
```bash
kg init-primitives [options]
```

**Description**:
Analyzes the codebase (package.json, requirements.txt, Cargo.toml, docker-compose, etc.) and generates foundational knowledge nodes for dependencies, frameworks, and services.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Documentation path | `docs` |
| `-o, --output <path>` | Output path for primitives | Docs path |
| `--dry-run` | Analyze only, do not write files | `false` |
| `-v, --verbose` | Verbose output | `false` |
| `--ecosystem <ecosystems>` | Filter to specific ecosystems (comma-separated: nodejs,python,rust,go,php,java) | All |
| `--include-dev` | Include dev dependencies | `false` |
| `--major-only` | Only generate nodes for major dependencies | `false` |

**Examples**:
```bash
# Initialize primitives
kg init-primitives

# Dry run
kg init-primitives --dry-run

# Filter ecosystems
kg init-primitives --ecosystem nodejs,python

# Include dev dependencies
kg init-primitives --include-dev

# Major dependencies only
kg init-primitives --major-only
```

**Related Commands**: `kg analyze-codebase`, `kg cultivate`

---

### kg analyze-codebase

Analyze codebase dependencies and services without generating nodes.

**Syntax**:
```bash
kg analyze-codebase [options]
```

**Description**:
Scans the codebase for dependencies, frameworks, services, and deployment configurations without creating any files.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-d, --docs <path>` | Documentation path | `docs` |
| `-v, --verbose` | Verbose output | `false` |
| `--json` | Output as JSON | `false` |

**Output Includes**:
- Detected languages
- Dependencies by ecosystem
- Frameworks and their versions
- Services (databases, caches, queues)
- Deployment configurations
- Existing documentation content

**Examples**:
```bash
# Analyze codebase
kg analyze-codebase

# Verbose output
kg analyze-codebase --verbose

# JSON output
kg analyze-codebase --json
```

**Related Commands**: `kg init-primitives`, `kg cultivate`

---

### kg cultivate

Systematically cultivate and enhance the knowledge graph.

**Syntax**:
```bash
kg cultivate [path] [options]
```

**Description**:
Combines seed generation and deep analysis to systematically build and enhance the knowledge graph.

**Arguments**:
| Argument | Description | Default |
|----------|-------------|---------|
| `[path]` | Directory to cultivate | `.` |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes without executing | `false` |
| `-d, --docs <path>` | Documentation path | `docs` |
| `-v, --verbose` | Verbose output | `false` |
| `--seed` | Bootstrap vault with primitives from codebase analysis | `false` |
| `--deep-analysis` | Use claude-flow agents for deep analysis | `false` |
| `--cache` | Use shadow cache for incremental updates | `true` |
| `--ecosystem <ecosystems>` | Filter to specific ecosystems (comma-separated) | - |
| `--include-dev` | Include dev dependencies | `false` |
| `--major-only` | Only process major dependencies | `false` |
| `--refresh-cache` | Force refresh the shadow cache | `false` |

**Examples**:
```bash
# Seed primitives
kg cultivate --seed

# Deep analysis
kg cultivate --deep-analysis

# Combined cultivation
kg cultivate --seed --deep-analysis

# Dry run
kg cultivate --seed --dry-run

# Filter ecosystems
kg cultivate --seed --ecosystem nodejs,rust
```

**Related Commands**: `kg init-primitives`, `kg analyze-codebase`

---

## Git Commands

### kg commit

Create a git commit with optional auto-generated message.

**Syntax**:
```bash
kg commit [options]
kg commit status [options]
kg commit log [options]
kg commit diff [options]
```

**Description**:
Git integration for creating commits with AI-powered message generation and change analysis.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-m, --message <message>` | Commit message (skips auto-generation) | - |
| `-n, --dry-run` | Show what would be committed without committing | `false` |
| `-a, --auto` | Automatically generate commit message | `false` |
| `-p, --push` | Push to remote after committing | `false` |
| `--path <path>` | Repository path | `.` |
| `-i, --interactive` | Interactive mode for reviewing changes | `false` |
| `-A, --all` | Stage all changes before committing | `false` |
| `--amend` | Amend the previous commit | `false` |

#### kg commit status

Show git status with analysis.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Repository path | `.` |

#### kg commit log

Show recent commits.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Repository path | `.` |
| `-n, --count <count>` | Number of commits to show | `10` |

#### kg commit diff

Show diff of changes.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Repository path | `.` |
| `-s, --staged` | Show only staged changes | `false` |
| `-f, --file <file>` | Show diff for specific file | - |

**Examples**:
```bash
# Show status and suggested message
kg commit

# Auto-commit with generated message
kg commit -a

# Interactive commit mode
kg commit -i

# Commit with custom message
kg commit -m "feat: add new feature"

# Stage all and commit
kg commit -A -a

# Show git status
kg commit status

# Show recent commits
kg commit log -n 5

# Show diff
kg commit diff --staged
```

**Related Commands**: `kg sync`

---

## Diagnostics Commands

### kg diag

System diagnostics and health monitoring.

**Alias**: `kg diagnostics`

**Syntax**:
```bash
kg diag health [options]
kg diag integrity [options]
kg diag memory
kg diag status
```

**Description**:
Run system diagnostics, health checks, and database integrity verification.

#### kg diag health

Run health checks on all components.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |

#### kg diag integrity

Check database integrity.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--repair` | Attempt to repair issues | `false` |

#### kg diag memory

Show memory usage statistics.

#### kg diag status

Show overall system status.

**Examples**:
```bash
# Run health checks
kg diag health

# Check database integrity
kg diag integrity

# Repair database issues
kg diag integrity --repair

# Show memory usage
kg diag memory

# Show system status
kg diag status

# JSON output
kg diag health --json
```

**Related Commands**: `kg stats`, `kg config`

---

## Workflow Commands

### kg workflow

Manage knowledge graph workflows.

**Alias**: `kg wf`

**Syntax**:
```bash
kg workflow start <type> [options]
kg workflow status [id] [options]
kg workflow list [options]
kg workflow stop <id> [options]
kg workflow history [options]
kg workflow resume <id>
```

**Description**:
Manage automated processing, analysis, and synchronization workflows.

**Workflow Types**:
- `analysis` - Analyze codebase and extract knowledge
- `sync` - Synchronize with external systems
- `generation` - Generate knowledge graph artifacts
- `validation` - Validate graph integrity and structure
- `migration` - Migrate data between formats

#### kg workflow start

Start a new workflow.

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<type>` | Workflow type (analysis, sync, generation, validation, migration) |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-i, --input <json>` | Input data as JSON | - |
| `-a, --async` | Run workflow asynchronously | `false` |
| `--dry-run` | Preview workflow without executing | `false` |

#### kg workflow status

Check workflow status.

**Arguments**:
| Argument | Description |
|----------|-------------|
| `[id]` | Specific workflow ID (optional) |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `-w, --watch` | Watch for status changes | `false` |

#### kg workflow list

List all workflows.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-s, --status <status>` | Filter by status (running, completed, failed, stopped) | - |
| `-t, --type <type>` | Filter by workflow type | - |
| `-n, --limit <number>` | Limit number of results | `10` |
| `--json` | Output as JSON | `false` |

#### kg workflow stop

Stop a running workflow.

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<id>` | Workflow ID |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-f, --force` | Force stop without confirmation | `false` |

#### kg workflow history

Show workflow history.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-n, --limit <number>` | Limit number of results | `20` |
| `-t, --type <type>` | Filter by workflow type | - |
| `--since <date>` | Show workflows since date (ISO format) | - |
| `--json` | Output as JSON | `false` |

#### kg workflow resume

Resume a stopped workflow.

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<id>` | Workflow ID |

**Examples**:
```bash
# Start analysis workflow
kg workflow start analysis

# Start with input data
kg workflow start sync --input '{"namespace": "myproject"}'

# Start async workflow
kg workflow start generation --async

# Check specific workflow status
kg workflow status abc12345

# Watch workflow progress
kg workflow status abc12345 --watch

# List active workflows
kg workflow list --status running

# Stop a workflow
kg workflow stop abc12345

# Show history
kg workflow history --limit 10

# Resume stopped workflow
kg workflow resume abc12345
```

**Related Commands**: `kg graph`, `kg sync`

---

## Vector Commands

### kg vector

Vector operations for semantic search and trajectory tracking.

**Alias**: `kg vec`

**Syntax**:
```bash
kg vector search <query> [options]
kg vector stats [options]
kg vector rebuild [options]
kg vector trajectory list [options]
kg vector trajectory show <id> [options]
kg vector trajectory patterns [options]
kg vector trajectory clear [options]
```

**Description**:
Manage vector embeddings for semantic search and agent trajectory tracking.

#### kg vector search

Perform semantic search on vector store.

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<query>` | Search query |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-k, --top-k <n>` | Number of results to return | `10` |
| `-t, --type <type>` | Filter by node type | - |
| `--hybrid` | Enable hybrid search (combines vector + graph) | `false` |
| `--min-score <score>` | Minimum similarity score (0-1) | `0` |
| `--json` | Output as JSON | `false` |

#### kg vector stats

Display vector store statistics.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `--json` | Output as JSON | `false` |

#### kg vector rebuild

Rebuild vector index from knowledge graph.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `--force` | Force rebuild even if index exists | `false` |
| `--batch-size <size>` | Batch size for indexing | `100` |
| `-v, --verbose` | Verbose output | `false` |

#### kg vector trajectory list

List recorded agent trajectories.

**Alias**: `kg vector traj list`

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Project root path | `.` |
| `-a, --agent <id>` | Filter by agent ID | - |
| `-w, --workflow <id>` | Filter by workflow ID | - |
| `-l, --limit <n>` | Maximum number of trajectories | `20` |
| `--success` | Show only successful trajectories | `false` |
| `--failed` | Show only failed trajectories | `false` |
| `--json` | Output as JSON | `false` |

#### kg vector trajectory show

Show detailed trajectory information.

**Alias**: `kg vector traj show`

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<id>` | Trajectory ID |

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |

#### kg vector trajectory patterns

Show detected action patterns.

**Alias**: `kg vector traj patterns`

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--min-confidence <n>` | Minimum confidence threshold (0-1) | `0.5` |
| `--type <type>` | Filter by pattern type (success, failure, optimization) | - |
| `--json` | Output as JSON | `false` |

#### kg vector trajectory clear

Clear all trajectory data.

**Alias**: `kg vector traj clear`

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--confirm` | Confirm clearing without prompt | `false` |

**Examples**:
```bash
# Semantic search
kg vector search "authentication service"

# Search with filters
kg vector search "database" --type service --top-k 5

# Hybrid search
kg vector search "user management" --hybrid

# Show vector stats
kg vector stats

# Rebuild index
kg vector rebuild --force

# List trajectories
kg vector traj list --limit 10

# Show trajectory details
kg vector traj show abc12345

# Show detected patterns
kg vector traj patterns --min-confidence 0.7

# Clear trajectories
kg vector traj clear --confirm
```

**Related Commands**: `kg search`, `kg graph`

---

## Audit Commands

### kg audit

Query and manage the exochain audit log.

**Syntax**:
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

**Description**:
Manage the immutable audit log for tracking changes and ensuring data integrity.

#### kg audit query

Query the audit log.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-t, --type <type>` | Filter by event type (e.g., NodeCreated, WorkflowCompleted) | - |
| `-s, --start <date>` | Start date (ISO format, e.g., 2024-01-01) | - |
| `-e, --end <date>` | End date (ISO format) | - |
| `-l, --limit <n>` | Maximum results to return | `50` |
| `-a, --author <did>` | Filter by author DID | - |
| `--json` | Output as JSON | `false` |
| `-p, --path <path>` | Project root path | `.` |

#### kg audit checkpoint

Create a checkpoint in the audit chain.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-n, --name <name>` | Checkpoint name/label | - |
| `-t, --tags <tags>` | Comma-separated tags | - |
| `--json` | Output as JSON | `false` |
| `-p, --path <path>` | Project root path | `.` |

#### kg audit verify

Verify audit chain integrity.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--full` | Perform full chain verification (slower) | `false` |
| `--json` | Output as JSON | `false` |
| `-p, --path <path>` | Project root path | `.` |

#### kg audit sync status

Check synchronization status.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `-p, --path <path>` | Project root path | `.` |

#### kg audit sync peers

List sync peers.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `-p, --path <path>` | Project root path | `.` |

#### kg audit sync now

Force immediate synchronization with all peers.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `-p, --path <path>` | Project root path | `.` |

#### kg audit export

Export audit log data.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <file>` | Output file path | stdout |
| `-f, --format <format>` | Export format (json, jsonl) | `json` |
| `-t, --type <type>` | Filter by event type | - |
| `-s, --start <date>` | Start date filter | - |
| `-e, --end <date>` | End date filter | - |
| `-l, --limit <n>` | Maximum events to export | - |
| `-p, --path <path>` | Project root path | `.` |

#### kg audit stats

Show audit chain statistics.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |
| `-p, --path <path>` | Project root path | `.` |

**Examples**:
```bash
# Query audit log
kg audit query

# Query with filters
kg audit query --type NodeCreated --start 2024-01-01

# Create checkpoint
kg audit checkpoint --name "v1.0-release" --tags "release,stable"

# Verify chain integrity
kg audit verify

# Full verification
kg audit verify --full

# Check sync status
kg audit sync status

# List sync peers
kg audit sync peers

# Force sync
kg audit sync now

# Export audit log
kg audit export --output audit.json

# Export as JSON Lines
kg audit export --format jsonl --output audit.jsonl

# Show statistics
kg audit stats
```

**Related Commands**: `kg workflow`, `kg diag`

---

## Configuration Commands

### kg config

Manage knowledge graph configuration.

**Syntax**:
```bash
kg config show [options]
kg config set <key> <value>
kg config reset [options]
kg config validate
kg config defaults
```

**Description**:
View and modify knowledge graph configuration settings.

#### kg config show

Show current configuration.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | `false` |

#### kg config set

Set a configuration value.

**Arguments**:
| Argument | Description |
|----------|-------------|
| `<key>` | Configuration key (e.g., database.path, cache.enabled) |
| `<value>` | New value |

#### kg config reset

Reset configuration to defaults.

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| `-y, --yes` | Skip confirmation | `false` |

#### kg config validate

Validate current configuration.

#### kg config defaults

Show default configuration values.

**Examples**:
```bash
# Show configuration
kg config show

# Show as JSON
kg config show --json

# Set a value
kg config set database.cacheSize 10000

# Set cache enabled
kg config set cache.enabled true

# Reset to defaults
kg config reset --yes

# Validate configuration
kg config validate

# Show defaults
kg config defaults
```

**Related Commands**: `kg init`, `kg diag`

---

## Global Options

These options are available for all commands:

| Option | Description |
|--------|-------------|
| `-v, --version` | Display version number |
| `-h, --help` | Display help for command |

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

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KG_HOME` | Knowledge graph home directory | `.kg` |
| `KG_DEBUG` | Enable debug logging | `false` |
| `KG_CONFIG` | Path to configuration file | `.kg/config.json` |

---

## See Also

- [Getting Started Guide](./GETTING-STARTED.md)
- [Configuration Reference](./CONFIGURATION.md)
- [API Documentation](./API.md)
