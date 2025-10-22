# Multi-Project AI Development Platform Architecture

This document outlines the architecture of the multi-project AI development platform, broken down into three key areas: the main architecture, the knowledge extraction workflow, and the project seeding/deployment workflow.

## 1. Main System Architecture

This diagram shows the primary components and the core learning loop. The system is designed around a continuous flow of information between human developers, the AI agent team, and the knowledge graph, with all interactions feeding a centralized meta-learning database.

```mermaid
graph LR
    subgraph "Multi-Project AI Development Platform"
        subgraph "Human Interaction"
            A["DEVELOPER [HUMAN]<br/>- Writes requirements<br/>- Reviews AI-generated code<br/>- Provides feedback"]
        end

        subgraph "Core Components"
            B["KNOWLEDGE GRAPH [Obsidian]<br/>- Markdown files per project<br/>- Git version control"]
            C["AI AGENT TEAM<br/>- Developer, Release, Review, Docs<br/>- Skill trees & XP"]
        end

        subgraph "Data & Learning Loop"
            D["LOCAL DEV ENVIRONMENT [Telemetry]<br/>- IDE interactions logged<br/>- Code edits, AI suggestions, test results"]
            F["CENTRALIZED VECTOR DB [Meta-Learning]<br/>- Project-specific, Domain, and Meta-knowledge layers"]
        end

        A --> B
        A --> C
        C <--> B
        B --> D
        C --> D
        D --> F

        subgraph "Workflow Triggers"
            F --> K{Enriched Knowledge<br/>& Patterns}
            K --> T1["Handoff to Extraction Workflow<br/>(e.g., project.closed)"]
            K --> T2["Handoff to Seeding Workflow<br/>(e.g., project.new)"]
        end
    end
```

## 2. Knowledge Extraction Workflow

This workflow is triggered by events such as task completion or project closure. Its purpose is to extract, process, and store reusable knowledge from completed work into the centralized vector database. Each stage can be implemented as a microservice, orchestrated by RabbitMQ.

```mermaid
graph TD
    subgraph "Knowledge Extraction Workflow"
        T["Event Triggers<br/>(task.complete, file.changed, project.closed)"]
        
        subgraph "Pipeline Stages"
            S1["1. Gather Artifacts<br/>- Read markdown files<br/>- Query git history<br/>- Aggregate metrics"]
            S2["2. AI Analysis [Claude]<br/>- Identify decisions, lessons, patterns<br/>- Detect anti-patterns"]
            S3["3. Deduplication & Enrichment<br/>- Compare with Vector DB<br/>- Add metadata (success rate, ROI)"]
            S4["4. Human Review Gate<br/>- Project lead approves/rejects patterns"]
            S5["5. Update Vector DB<br/>- 'Plant' new knowledge in central DB"]
        end

        T --> S1 --> S2 --> S3 --> S4 --> S5
    end
```

## 3. Project Seeding & Deployment Workflow

This workflow is initiated when a new project is started, an existing one is imported, or a project needs a refresh with the latest knowledge. It seeds the project with relevant patterns and best practices from the centralized database before development begins.

```mermaid
graph TD
    subgraph "Project Seeding & Deployment Workflow"
        T1["Trigger: New Project [Empty]"]
        T2["Trigger: Import Existing Project"]
        T3["Trigger: Refresh Project"]

        subgraph "Seeding Stages"
            S1["1. Requirements Analysis<br/>- Classify project type (e-commerce, SaaS)"]
            S2["2. Vector DB Query<br/>- Adaptive retrieval of relevant patterns"]
            S3["3. Agent Specialization<br/>- Identify skill gaps<br/>- Pre-load patterns into agent memory"]
            S4["4. Knowledge Graph Initialization<br/>- Generate suggested-patterns.md"]
        end

        subgraph "Deployment"
            H["SDLC WORKFLOW<br/>Dev → Staging → Production<br/>Safety gates at each stage"]
        end
        
        T1 --> S1
        T2 --> S1
        T3 --> S1
        S1 --> S2 --> S3 --> S4 --> H
    end
