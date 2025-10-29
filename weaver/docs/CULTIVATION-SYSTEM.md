# Intelligent Vault Cultivation System

**Status:** 🟡 In Progress (Core modules complete, integration pending)
**Created:** 2025-10-29
**Last Updated:** 2025-10-29

---

## Overview

The Intelligent Vault Cultivation System is a comprehensive documentation enhancement framework that:

1. **Analyzes** markdown documents and adds intelligent YAML frontmatter
2. **Tracks** modification dates to avoid re-processing unchanged files
3. **Generates** missing documentation (concepts, features, architecture, integrations)
4. **Uses** claude-flow specialized agents for parallel content generation
5. **References** top-level context files (primitives.md, features.md, tech-specs.md)
6. **Builds** footer sections with backlinks
7. **Identifies** gaps and suggests improvements/replacements

---

## Architecture

### Core Modules (✅ Completed)

#### 1. **Type System** (`src/cultivation/types.ts`)

Defines all interfaces and types for the cultivation system:

- `VaultContext` - Vault-wide context (primitives, features, tech-specs)
- `DocumentMetadata` - YAML frontmatter structure
- `DocumentAnalysis` - Analysis results for each document
- `DocumentGenerationRequest` - Request to generate new documentation
- `GeneratedDocument` - Generated document with content and metadata
- `GapAnalysis` - Missing documentation analysis
- `AgentTask` - Task for claude-flow agents
- `CultivationReport` - Final cultivation report

#### 2. **Context Loader** (`src/cultivation/context-loader.ts`)

Loads vault context for intelligent document generation:

**Features:**
- Finds and loads `primitives.md` (foundational concepts)
- Finds and loads `features.md` (current feature set)
- Finds and loads `tech-specs.md` (technical specifications)
- Scans entire vault for all markdown files
- Extracts concepts, features, and technical areas

**Key Methods:**
```typescript
async loadContext(): Promise<VaultContext>
extractConcepts(primitives: string): string[]
extractFeatures(features: string): string[]
extractTechnicalAreas(techSpecs: string): string[]
```

#### 3. **Frontmatter Generator** (`src/cultivation/frontmatter-generator.ts`)

AI-powered YAML frontmatter generation based on document context:

**Features:**
- Analyzes documents to determine if frontmatter is needed
- Checks modification dates (skip if unchanged)
- Infers document type from path and content
- Derives title from filename or H1 heading
- Infers status from content keywords
- Generates relevant tags from path and content
- Extracts phase information
- Determines priority level
- Optional AI enhancement (placeholder for future)

**Key Methods:**
```typescript
async analyzeDocument(filePath: string): Promise<DocumentAnalysis>
private generateFrontmatter(...): Promise<DocumentMetadata>
private inferType(relativePath: string, content: string): string
private inferTags(relativePath: string, content: string): string[]
```

**Inference Rules:**
- Type: Inferred from path (`/concepts/` → 'concept', `/features/` → 'feature', etc.)
- Status: Detected from keywords (WIP, draft, complete, archived, planned)
- Tags: Extracted from path components and content analysis
- Priority: Detected from urgency keywords (critical, urgent, high priority)

#### 4. **Document Generator** (`src/cultivation/document-generator.ts`)

Generates missing documentation based on gap analysis:

**Features:**
- Analyzes vault for missing concepts, features, architecture, integrations
- Compares expected documents (from primitives/features/tech-specs) with existing
- Identifies improvement areas (TODO, FIXME markers)
- Detects components needing replacement (deprecated, migrate keywords)
- Generates document templates or uses AI agents
- Creates appropriate directory structure
- Writes documents with proper frontmatter

**Key Methods:**
```typescript
async analyzeGaps(): Promise<GapAnalysis>
async generateMissingDocuments(gaps: GapAnalysis, dryRun: boolean): Promise<GeneratedDocument[]>
private extractExpectedConcepts(primitives: string): string[]
private findImprovementAreas(features: string): string[]
private findReplacementNeeds(techSpecs: string): Array<...>
```

**Document Types Generated:**
- **Concepts** - From primitives.md
- **Features** - From features.md
- **Architecture** - From tech-specs.md
- **Integrations** - From context analysis
- **Technical Guides** - As needed

#### 5. **Agent Orchestrator** (`src/cultivation/agent-orchestrator.ts`)

Coordinates claude-flow agents for parallel document generation:

**Features:**
- Creates tasks from generation requests
- Selects appropriate agent per document type (researcher, coder, architect, analyst)
- Initializes claude-flow swarm with mesh topology
- Executes tasks in parallel
- Processes results and handles errors
- Falls back to templates if claude-flow unavailable

**Agent Selection:**
- `concept` → researcher
- `feature` → coder
- `architecture` → architect
- `integration` → analyst
- `technical` → coder
- `guide` → researcher

**Key Methods:**
```typescript
async generateDocuments(requests: DocumentGenerationRequest[]): Promise<GeneratedDocument[]>
private orchestrateTasks(tasks: AgentTask[]): Promise<AgentOrchestrationResult>
private executeTask(task: AgentTask): Promise<any>
async generateWithAgent(agent, prompt): Promise<string>
```

---

## Remaining Work

### To Complete (🟡 In Progress)

#### 1. **Footer Builder** (`src/cultivation/footer-builder.ts` - TODO)

Build footer sections with backlinks:

**Required Features:**
- Track all document links (wikilinks and markdown links)
- Build backlink graph
- Generate "Referenced By" sections
- Generate "Related Documents" sections
- Insert/update footers without overwriting manual content

**Key Methods Needed:**
```typescript
async buildFooters(documents: string[]): Promise<FooterBuildResult>
private extractLinks(content: string): string[]
private buildBacklinkGraph(documents: string[]): Map<string, string[]>
private generateFooterSection(doc: string, backlinks: string[]): string
private insertFooter(filePath: string, footer: string): Promise<void>
```

#### 2. **Cultivation Engine** (`src/cultivation/engine.ts` - TODO)

Main orchestration engine that coordinates all modules:

**Required Features:**
- Initialize all modules
- Execute cultivation phases in sequence
- Collect and aggregate results
- Generate comprehensive report
- Handle errors gracefully

**Key Methods Needed:**
```typescript
async discover(): Promise<DiscoveryResult>
async loadContext(): Promise<VaultContext>
async generateFrontmatter(): Promise<FrontmatterResult>
async generateDocuments(): Promise<GenerationResult>
async buildFooters(): Promise<FooterResult>
async getReport(): Promise<CultivationReport>
async saveReport(path: string): Promise<void>
```

#### 3. **CLI Integration** (Extend `src/cli/commands/cultivate.ts`)

Add new options to existing cultivate command:

**New Options:**
```bash
weaver cultivate <directory> [options]

Options:
  --frontmatter          Generate/update frontmatter
  --generate-missing     Generate missing documentation
  --build-footers        Build backlink footers
  --use-agents           Use claude-flow agents (default: true)
  --agent-mode <mode>    Agent mode: sequential|parallel|adaptive
  --force                Re-process all files
  --dry-run              Preview changes
```

**Integration Points:**
- Load context using `ContextLoader`
- Analyze documents with `FrontmatterGenerator`
- Run gap analysis with `DocumentGenerator`
- Orchestrate with `AgentOrchestrator`
- Build footers with `FooterBuilder`
- Generate report

---

## Usage Examples

### Basic Cultivation

```bash
# Cultivate current directory
weaver cultivate .

# Cultivate with all features
weaver cultivate . --frontmatter --generate-missing --build-footers

# Dry run to preview changes
weaver cultivate . --all --dry-run

# Force re-process all files
weaver cultivate ./docs --all --force
```

### Advanced Usage

```bash
# Use parallel agents for fast generation
weaver cultivate . --generate-missing --agent-mode parallel --max-agents 8

# Only generate frontmatter for modified files
weaver cultivate . --frontmatter --skip-unmodified

# Generate missing docs without footers
weaver cultivate . --generate-missing --no-build-footers

# Verbose output with report
weaver cultivate . --all -v --output cultivation-report.json
```

### Context Files

The system looks for these files in your vault:

**primitives.md** - Defines foundational concepts
```markdown
## Core Concepts

- **Knowledge Graph** - Graph-based document relationships
- **Wikilinks** - [[document]] style linking
- **Frontmatter** - YAML metadata

## Building Blocks

- Document nodes
- Link edges
- Metadata properties
```

**features.md** - Lists current features
```markdown
## Implemented Features

- Document parsing
- Automatic linking
- Metadata extraction

## Planned Features

- AI-powered suggestions
- Real-time collaboration
```

**tech-specs.md** - Technical architecture
```markdown
## Architecture

- **Database**: SQLite for shadow cache
- **API**: REST + MCP
- **Frontend**: Obsidian integration

## Components

- Workflow Engine
- Knowledge Graph Builder
- MCP Server
```

---

## Integration with Claude-Flow

The system uses claude-flow agents for intelligent generation:

### Agent Types

1. **Researcher** - Generates concept and guide documentation
2. **Coder** - Generates feature and technical documentation
3. **Architect** - Generates architecture documentation
4. **Analyst** - Generates integration documentation

### Execution Modes

- **Sequential** - Tasks executed one-by-one (slower, lower resource usage)
- **Parallel** - Tasks executed concurrently (faster, higher resource usage)
- **Adaptive** - Automatically adjusts based on system load (recommended)

### Swarm Initialization

When `--use-agents` is enabled:

1. Initializes claude-flow swarm with mesh topology
2. Spawns agents based on document types needed
3. Distributes tasks across agents
4. Collects results when complete
5. Falls back to templates if agents fail

---

## File Structure

```
weaver/src/cultivation/
├── types.ts                    ✅ Type definitions
├── context-loader.ts           ✅ Load vault context
├── frontmatter-generator.ts    ✅ Generate frontmatter
├── document-generator.ts       ✅ Generate documents
├── agent-orchestrator.ts       ✅ Orchestrate agents
├── footer-builder.ts           🟡 TODO: Build footers
└── engine.ts                   🟡 TODO: Main engine
```

---

## Next Steps

### For Completion

1. **Create `footer-builder.ts`**
   - Implement backlink tracking
   - Generate footer sections
   - Insert without overwriting

2. **Create `engine.ts`**
   - Coordinate all modules
   - Execute phases in sequence
   - Generate comprehensive report

3. **Extend CLI Command**
   - Add new options
   - Integrate with modules
   - Add progress reporting

4. **Testing**
   - Test on sample vault
   - Verify frontmatter generation
   - Validate document generation
   - Check footer building

5. **Documentation**
   - Update command reference
   - Add usage examples
   - Create tutorial

---

## Benefits

### For Users

- **Automated Documentation** - Generates missing docs based on project context
- **Intelligent Frontmatter** - No manual YAML editing
- **Smart Skipping** - Only processes changed files
- **Gap Analysis** - Identifies documentation needs
- **Parallel Generation** - Fast multi-document creation
- **Context-Aware** - Uses primitives/features/tech-specs

### For Projects

- **Consistency** - Standardized documentation structure
- **Completeness** - No missing concept/feature docs
- **Discoverability** - Backlinks and cross-references
- **Maintainability** - Auto-updates on file changes
- **Quality** - AI-generated content from best practices

---

## Technical Details

### Frontmatter Generation Logic

1. **Check existing frontmatter** - Parse YAML if present
2. **Check modification date** - Compare file mtime with `updated` field
3. **Skip if unchanged** - Don't re-process unless forced
4. **Analyze content** - Extract H1, paragraphs, keywords
5. **Infer metadata** - Type, status, tags, priority
6. **Generate YAML** - Create complete frontmatter
7. **Update file** - Insert/update frontmatter block

### Gap Analysis Logic

1. **Load context** - primitives.md, features.md, tech-specs.md
2. **Extract expected docs** - Parse headings and lists
3. **Find existing docs** - Scan vault for matching files
4. **Compare** - Identify missing documentation
5. **Analyze improvements** - Find TODO/FIXME markers
6. **Detect replacements** - Find deprecated components
7. **Generate requests** - Create document generation tasks

### Agent Orchestration Flow

1. **Create tasks** - Map requests to agent tasks
2. **Select agents** - Choose appropriate agent per type
3. **Initialize swarm** - Setup claude-flow mesh network
4. **Execute parallel** - Run tasks concurrently
5. **Collect results** - Gather generated content
6. **Process** - Create GeneratedDocument objects
7. **Write files** - Save with frontmatter

---

## Status Summary

✅ **Completed:**
- Core type system
- Context loading (primitives/features/tech-specs)
- Frontmatter generation with modification tracking
- Gap analysis and document generation
- Claude-flow agent orchestration

🟡 **In Progress:**
- Footer builder with backlinks
- Main cultivation engine
- CLI command integration

⏳ **Pending:**
- End-to-end testing
- Documentation updates
- Example workflows

---

**See Also:**
- [Command Reference](./COMMAND-REFERENCE.md)
- [Integration Guide](./INTEGRATION-GUIDE.md)
- [Workflow Development](./workflow-development.md)
