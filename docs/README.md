# Knowledge Graph Agent Documentation

Welcome to the documentation for `@weavelogic/knowledge-graph-agent` - a powerful library for creating and managing knowledge graphs for Claude Code with multi-agent AI coordination.

## Documentation Overview

This documentation follows the [Diátaxis framework](https://diataxis.fr/), organizing content into four categories:

| Category | Purpose | Audience |
|----------|---------|----------|
| **Tutorials** | Learning-oriented, step-by-step guides | New users |
| **How-to Guides** | Task-oriented, problem-solving | Practitioners |
| **Reference** | Information-oriented, technical details | Developers |
| **Explanation** | Understanding-oriented, concepts | All levels |

---

## Getting Started (Tutorials)

New to knowledge-graph-agent? Start here:

- [Installation Guide](./getting-started/installation.md) - Set up your environment
- [Quick Start](./getting-started/quick-start.md) - Build your first knowledge graph
- [Configuration](./getting-started/configuration.md) - Configure for your project

---

## Guides (How-to)

Solve specific problems and accomplish tasks:

### Core Features

- [Knowledge Graph Management](./guides/knowledge-graph.md) - Create, query, and traverse graphs
- [Cultivation System](./guides/cultivation.md) - Analyze codebases and generate primitives
- [Agent System](./guides/agents.md) - Work with AI agents and rules engine

### Enterprise Features

- [Document Chunking](./guides/enterprise/chunking.md) - Split large documents efficiently
- [Backup & Recovery](./guides/enterprise/backup-recovery.md) - Protect your data
- [Cache Configuration](./guides/enterprise/caching.md) - Optimize performance
- [Health Monitoring](./guides/enterprise/health-monitoring.md) - Monitor production systems

---

## Reference (Technical Details)

Detailed technical documentation:

### API Reference

- [API Overview](./API.md) - Complete API surface
- [CLI Commands Reference](./CLI-COMMANDS-REFERENCE.md) - All CLI commands
- [MCP Tools Reference](./MCP-TOOLS-REFERENCE.md) - MCP server tools

### Architecture

- [System Architecture](./ARCHITECTURE.md) - High-level architecture overview
- [Dashboard Architecture](./architecture/DASHBOARD-ARCHITECTURE.md) - Web dashboard design
- [Concurrent Execution](./architecture/concurrent-execution.md) - Multi-server design

### Architecture Decision Records (ADRs)

Technical decisions documented for posterity:

- [ADR Index](./architecture/decisions/README.md) - All architecture decisions
- [ADR-001: MCP Tool Execution](./architecture/decisions/ADR-001-mcp-tool-execution.md)
- [ADR-002: Agent System Design](./architecture/decisions/ADR-002-agent-system-design.md)
- [ADR-003: Hive Mind Reconnection](./architecture/decisions/ADR-003-hive-mind-reconnection.md)
- [ADR-004: Vector Search Strategy](./architecture/decisions/ADR-004-vector-search-strategy.md)
- [ADR-005: Learning Loop Design](./architecture/decisions/ADR-005-learning-loop-design.md)

---

## Explanation (Concepts)

Understand the system design and philosophy:

### Feature Specifications

- [Feature Index](./features/INDEX.md) - All feature specifications
- [SPEC-001: MCP Tool Execution](./features/SPEC-001-MCP-TOOL-EXECUTION.md)
- [SPEC-002: Missing Agents](./features/SPEC-002-MISSING-AGENTS.md)
- [SPEC-003: Hive Mind Tools](./features/SPEC-003-HIVE-MIND-RECONNECTION-TOOLS.md)
- [SPEC-004: Vector Search](./features/SPEC-004-VECTOR-SEARCH-EMBEDDINGS.md)
- [SPEC-005: Learning Loop](./features/SPEC-005-LEARNING-LOOP-PHASE8.md)

### Integration Documentation

- [RuVector Usage](./RUVECTOR-USAGE.md) - Semantic vector search
- [Workflow DevKit](./WORKFLOW-DEVKIT-USAGE.md) - Workflow orchestration
- [Exochain Audit](./EXOCHAIN-AUDIT-USAGE.md) - Audit trail system

### Research & Planning

- [Gap Analysis](./FEATURE-GAP-ANALYSIS.md) - Current implementation gaps
- [Implementation Roadmap](./IMPLEMENTATION-ROADMAP.md) - Development plan
- [SPARC Development Plan](./SPARC-DEVELOPMENT-PLAN.md) - Methodology

---

## Additional Resources

### Contributing

- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Security Policy](./contributing/CONTRIBUTING.md) - Security guidelines

### Project Information

- [Dependencies](./DEPENDENCIES.md) - Package dependencies and licenses
- [Changelog](./changelog/) - Version history
- [Security Audit Report](./SECURITY-AUDIT-REPORT.md) - Security assessment

---

## Quick Links

| Resource | Description |
|----------|-------------|
| [GitHub Repository](https://github.com/weavelogic/knowledge-graph-agent) | Source code |
| [npm Package](https://www.npmjs.com/package/@weavelogic/knowledge-graph-agent) | Package registry |
| [Issue Tracker](https://github.com/weavelogic/knowledge-graph-agent/issues) | Report bugs |
| [Discussions](https://github.com/weavelogic/knowledge-graph-agent/discussions) | Community |

---

## License

This project is licensed under the [MIT License](../LICENSE).
