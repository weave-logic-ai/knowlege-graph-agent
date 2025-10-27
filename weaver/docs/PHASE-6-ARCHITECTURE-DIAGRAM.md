# Phase 6 Architecture - Visual Diagrams

## System Architecture (High-Level)

```mermaid
graph TB
    subgraph "Input Layer"
        A[Codebase Files] --> B[Framework Detector]
        B --> C[Directory Scanner]
        C --> D[File Filter]
    end

    subgraph "Analysis Layer"
        D --> E[AST Parser<br/>Babel + Traverse]
        E --> F[Code Analyzer]
        F --> G[Metadata Extractor]
        G --> H[Relationship Builder]
    end

    subgraph "Generation Layer"
        H --> I[Template Engine<br/>Handlebars]
        I --> J[Node Generator]
        J --> K[Wikilink Builder]
    end

    subgraph "Output Layer"
        K --> L[Markdown Writer]
        L --> M[Vault Structure]
        L --> N[Shadow Cache]
        L --> O[Git Repository]
    end

    subgraph "Integration Layer"
        P[Weaver MCP Server] --> F
        Q[Workflow Engine] --> J
        R[File Watcher] --> M
    end

    style B fill:#4A90E2,color:#fff
    style E fill:#4A90E2,color:#fff
    style I fill:#4A90E2,color:#fff
    style N fill:#50C878,color:#fff
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant Detector
    participant Scanner
    participant Parser
    participant Analyzer
    participant Generator
    participant Writer
    participant Cache
    participant Git

    User->>CLI: weaver-init init
    CLI->>Detector: Detect framework
    Detector-->>CLI: Next.js detected

    CLI->>Scanner: Scan directory
    Scanner-->>CLI: File list (1000 files)

    CLI->>Parser: Parse TypeScript files
    Parser-->>CLI: AST nodes (150 components)

    CLI->>Analyzer: Analyze relationships
    Analyzer-->>CLI: Dependency graph

    CLI->>Generator: Generate vault nodes
    Generator-->>CLI: 200 markdown nodes

    CLI->>Writer: Write vault
    Writer->>Cache: Populate shadow cache
    Writer->>Git: Initialize repository
    Writer-->>CLI: Success (200 files)

    CLI-->>User: ✅ Vault created at ./vault
```

## Module Architecture (C4 Container Diagram)

```mermaid
graph TB
    subgraph "Vault Init System"
        direction TB

        subgraph "Core Modules"
            Detector[Framework Detector<br/>TypeScript]
            Scanner[Directory Scanner<br/>TypeScript]
            Parser[AST Parser<br/>TypeScript + Babel]
            Analyzer[Code Analyzer<br/>TypeScript]
        end

        subgraph "Generation Modules"
            Templates[Template Engine<br/>TypeScript + Handlebars]
            Generator[Node Generator<br/>TypeScript]
            Writer[Markdown Writer<br/>TypeScript]
        end

        subgraph "Interface Modules"
            CLI[CLI Interface<br/>TypeScript + Commander]
            MCP[MCP Tool<br/>TypeScript]
            Workflow[Workflow Handler<br/>TypeScript]
        end

        Detector --> Analyzer
        Scanner --> Parser
        Parser --> Analyzer
        Analyzer --> Generator
        Templates --> Generator
        Generator --> Writer

        CLI --> Detector
        CLI --> Scanner
        MCP --> Workflow
        Workflow --> Detector
    end

    subgraph "Weaver Infrastructure"
        Cache[Shadow Cache<br/>SQLite]
        WF[Workflow Engine<br/>workflow.dev]
        Watcher[File Watcher<br/>chokidar]
        Config[Configuration<br/>Zod]
    end

    Writer --> Cache
    Writer --> Git[Git Client<br/>simple-git]
    Workflow --> WF
    Writer --> Watcher
    Detector --> Config

    style Detector fill:#4A90E2,color:#fff
    style Parser fill:#4A90E2,color:#fff
    style Templates fill:#4A90E2,color:#fff
    style Cache fill:#50C878,color:#fff
```

## Component Interaction

```mermaid
graph LR
    subgraph "External Systems"
        FS[File System]
        Vault[Obsidian Vault]
        DB[(Shadow Cache DB)]
        GitRepo[Git Repository]
    end

    subgraph "Vault Init Components"
        FD[Framework<br/>Detector] --> DS[Directory<br/>Scanner]
        DS --> AP[AST<br/>Parser]
        AP --> CA[Code<br/>Analyzer]
        CA --> NG[Node<br/>Generator]
        NG --> MW[Markdown<br/>Writer]
    end

    FS -.->|Read| DS
    FS -.->|Read| AP
    MW -->|Write| Vault
    MW -->|Insert| DB
    MW -->|Init| GitRepo

    style FD fill:#4A90E2,color:#fff
    style AP fill:#4A90E2,color:#fff
    style NG fill:#4A90E2,color:#fff
    style DB fill:#50C878,color:#fff
```

## Critical Path Timeline

```mermaid
gantt
    title Phase 6 Implementation Timeline (3-5 Days)
    dateFormat  YYYY-MM-DD
    section Phase 1: Foundation
    Framework Detector           :a1, 2025-10-26, 1d
    Directory Scanner            :a2, 2025-10-26, 1d
    Scanner Tests                :a3, 2025-10-26, 1d

    section Phase 2: Parsing
    Babel AST Parser             :b1, 2025-10-27, 1d
    Code Analyzer                :b2, 2025-10-27, 1d
    Parser Tests                 :b3, 2025-10-27, 1d

    section Phase 3: Templates
    Template Schema              :c1, 2025-10-28, 1d
    Template Engine              :c2, 2025-10-28, 1d
    Node Generator               :c3, 2025-10-28, 1d
    Wikilink Builder             :c4, 2025-10-28, 1d

    section Phase 4: Output
    Markdown Writer              :d1, 2025-10-29, 1d
    Shadow Cache Integration     :d2, 2025-10-29, 1d
    Git Initialization           :d3, 2025-10-29, 1d
    CLI Interface                :d4, 2025-10-29, 1d

    section Phase 5: Integration
    MCP Tool                     :e1, 2025-10-30, 1d
    Workflow Integration         :e2, 2025-10-30, 1d
    E2E Tests                    :e3, 2025-10-30, 1d
    Documentation                :e4, 2025-10-30, 1d
```

## Agent Coordination Map

```mermaid
graph TB
    subgraph "Development Team (4-5 Agents)"
        A1[Agent 1<br/>Backend Dev<br/>Detector + Scanner]
        A2[Agent 2<br/>Code Analyzer<br/>Parser + Analyzer]
        A3[Agent 3<br/>Template Engineer<br/>Templates + Generator]
        A4[Agent 4<br/>Integration Engineer<br/>Writer + CLI]
        A5[Agent 5<br/>Test Engineer<br/>Unit + E2E Tests]
    end

    subgraph "Coordination"
        Hooks[Claude-Flow Hooks]
        Memory[Shared Memory]
        Tasks[Task Tracker]
    end

    A1 -.->|Coordinates| Hooks
    A2 -.->|Coordinates| Hooks
    A3 -.->|Coordinates| Hooks
    A4 -.->|Coordinates| Hooks
    A5 -.->|Coordinates| Hooks

    A1 -.->|Shares| Memory
    A2 -.->|Shares| Memory
    A3 -.->|Shares| Memory
    A4 -.->|Shares| Memory
    A5 -.->|Shares| Memory

    A1 -->|Updates| Tasks
    A2 -->|Updates| Tasks
    A3 -->|Updates| Tasks
    A4 -->|Updates| Tasks
    A5 -->|Updates| Tasks

    style A1 fill:#4A90E2,color:#fff
    style A2 fill:#4A90E2,color:#fff
    style A3 fill:#4A90E2,color:#fff
    style A4 fill:#4A90E2,color:#fff
    style A5 fill:#4A90E2,color:#fff
```

## Template Structure Flow

```mermaid
graph TB
    subgraph "Template System"
        Schema[Template Schema<br/>YAML Definition]
        Templates[Handlebars Templates]
        Engine[Template Engine]
    end

    subgraph "Data Sources"
        AST[AST Nodes]
        Meta[Metadata]
        Rel[Relationships]
    end

    subgraph "Generated Nodes"
        Concept[Concept Nodes]
        Tech[Technical Nodes]
        Feature[Feature Nodes]
        Component[Component Nodes]
    end

    Schema --> Engine
    Templates --> Engine

    AST --> Engine
    Meta --> Engine
    Rel --> Engine

    Engine --> Concept
    Engine --> Tech
    Engine --> Feature
    Engine --> Component

    Concept --> Vault[Vault Structure]
    Tech --> Vault
    Feature --> Vault
    Component --> Vault

    style Engine fill:#4A90E2,color:#fff
    style Vault fill:#50C878,color:#fff
```

## Vault Structure Hierarchy

```mermaid
graph TB
    Root[vault/]

    Root --> README[README.md<br/>Project Overview]
    Root --> ConceptMap[concept-map.md<br/>Mermaid Diagram]
    Root --> Concepts[concepts/<br/>High-level Concepts]
    Root --> Technical[technical/<br/>Technical Details]
    Root --> Features[features/<br/>Feature Docs]
    Root --> Components[components/<br/>Component Docs]
    Root --> Obsidian[.obsidian/<br/>Obsidian Config]

    Concepts --> C1[authentication.md]
    Concepts --> C2[data-flow.md]
    Concepts --> C3[state-management.md]

    Technical --> T1[architecture.md]
    Technical --> T2[api-routes.md]
    Technical --> T3[database-schema.md]

    Features --> F1[user-authentication.md]
    Features --> F2[dashboard.md]

    Components --> UI[ui/]
    Components --> Layout[layout/]

    UI --> Button[Button.md]
    UI --> Input[Input.md]

    Layout --> Header[Header.md]
    Layout --> Footer[Footer.md]

    Obsidian --> Graph[graph.json]
    Obsidian --> Workspace[workspace.json]

    style Root fill:#50C878,color:#fff
    style README fill:#FFD700,color:#000
    style ConceptMap fill:#FFD700,color:#000
```

## MCP Integration Architecture

```mermaid
graph TB
    subgraph "AI Agent / MCP Client"
        Agent[Claude Code Agent]
    end

    subgraph "Weaver MCP Server"
        MCP[MCP Server<br/>@modelcontextprotocol/sdk]
        Tools[MCP Tools Registry]
    end

    subgraph "Vault Init Workflow"
        WF[Workflow Engine]
        VaultInit[Vault Init Handler]
    end

    subgraph "Vault Init System"
        Detector[Framework Detector]
        Analyzer[Code Analyzer]
        Generator[Node Generator]
        Writer[Markdown Writer]
    end

    Agent -->|Calls tool| MCP
    MCP --> Tools
    Tools -->|Triggers| WF
    WF --> VaultInit
    VaultInit --> Detector
    Detector --> Analyzer
    Analyzer --> Generator
    Generator --> Writer

    Writer -->|Result| VaultInit
    VaultInit -->|Status| WF
    WF -->|Response| Tools
    Tools -->|Result| MCP
    MCP -->|Output| Agent

    style MCP fill:#4A90E2,color:#fff
    style VaultInit fill:#4A90E2,color:#fff
    style Writer fill:#50C878,color:#fff
```

## Error Handling & Fallback Strategy

```mermaid
graph TB
    Start[Start Vault Init]

    Start --> DetectFW{Framework<br/>Detected?}
    DetectFW -->|Yes| Scan[Scan Directory]
    DetectFW -->|No| Fallback1[Use Generic Template]

    Scan --> Parse{Parse<br/>Success?}
    Parse -->|Yes| Analyze[Analyze Code]
    Parse -->|No| Fallback2[Extract from Config Only]

    Analyze --> Generate{Generate<br/>Nodes?}
    Generate -->|Yes| Write[Write Vault]
    Generate -->|No| Fallback3[Create Minimal Vault]

    Write --> Cache{Shadow Cache<br/>Available?}
    Cache -->|Yes| Populate[Populate Cache]
    Cache -->|No| Skip1[Skip Cache]

    Populate --> Git{Git<br/>Available?}
    Skip1 --> Git
    Git -->|Yes| InitGit[Initialize Repo]
    Git -->|No| Skip2[Skip Git]

    InitGit --> Success[✅ Success]
    Skip2 --> Success
    Fallback1 --> Success
    Fallback2 --> Success
    Fallback3 --> Success

    style Success fill:#50C878,color:#fff
    style Fallback1 fill:#FFD700,color:#000
    style Fallback2 fill:#FFD700,color:#000
    style Fallback3 fill:#FFD700,color:#000
```

---

## Usage Examples

### CLI Usage Flow
```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant System

    User->>CLI: weaver-init init
    CLI->>User: 🔍 Detecting framework...
    CLI->>User: ✅ Next.js detected
    CLI->>User: 📂 Scanning directory...
    CLI->>User: ✅ Found 1,234 files
    CLI->>User: 🔬 Analyzing code...
    CLI->>User: ✅ Extracted 156 components
    CLI->>User: 📝 Generating vault nodes...
    CLI->>User: ✅ Created 218 markdown files
    CLI->>User: 💾 Populating shadow cache...
    CLI->>User: ✅ Cache updated
    CLI->>User: 🔧 Initializing git...
    CLI->>User: ✅ Repository initialized
    CLI->>User: 🎉 Vault created at ./vault
    User->>System: Open Obsidian
    System->>User: 📊 Knowledge graph ready
```

### MCP Tool Flow
```mermaid
sequenceDiagram
    participant Agent as Claude Code Agent
    participant MCP as MCP Server
    participant Workflow as Workflow Engine
    participant VaultInit as Vault Init System

    Agent->>MCP: trigger_vault_initialization<br/>{rootPath, outputDir}
    MCP->>Workflow: Execute workflow
    Workflow->>VaultInit: Run initialization
    VaultInit->>VaultInit: Detect + Scan + Parse
    VaultInit->>VaultInit: Analyze + Generate
    VaultInit->>VaultInit: Write + Cache + Git
    VaultInit-->>Workflow: Result {success, filesGenerated}
    Workflow-->>MCP: Workflow complete
    MCP-->>Agent: {success: true, filesGenerated: 218}
    Agent->>Agent: Continue with vault exploration
```

---

**Reference**:
- Full Architecture: `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE.md`
- Summary: `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE-SUMMARY.md`
- Diagrams: `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE-DIAGRAM.md`
