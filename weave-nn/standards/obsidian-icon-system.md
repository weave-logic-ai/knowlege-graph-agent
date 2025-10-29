---
title: Obsidian Icon System
type: documentation
status: complete
phase_id: PHASE-14
tags:
  - obsidian
  - visual-intelligence
  - icons
  - metadata
domain: knowledge-graph
scope: system
priority: high
created_date: 2025-10-28T00:00:00.000Z
updated_date: 2025-10-28T00:00:00.000Z
version: '1.0'
visual:
  icon: 🎨
  color: '#EC4899'
  cssclasses:
    - type-documentation
    - status-complete
    - priority-high
icon: 🎨
---

# Obsidian Icon System

**Phase 14 - Visual Intelligence Enhancement**

Complete icon mapping system for the Weave-NN knowledge graph. This system provides consistent visual identification across document types, statuses, priorities, and domains.

## Overview

The icon system uses Unicode emoji for maximum compatibility across platforms. Icons are applied through:
- Frontmatter `visual.icon` property
- File names (when prefixing is desired)
- Tags and properties in Obsidian
- Graph view nodes
- File explorer

## Document Type Icons

Primary categorization based on document purpose and content type.

| Type | Icon | CSS Class | Description |
|------|------|-----------|-------------|
| Planning | 📋 | `type-planning` | Strategic planning documents, roadmaps, specifications |
| Implementation | ⚙️ | `type-implementation` | Code implementation, technical execution |
| Research | 🔬 | `type-research` | Research findings, analysis, investigations |
| Architecture | 🏗️ | `type-architecture` | System design, architecture decisions |
| Testing | ✅ | `type-testing` | Test plans, test results, validation |
| Documentation | 📚 | `type-documentation` | User guides, API docs, references |
| Hub | 🌐 | `type-hub` | Index pages, navigation hubs |
| SOP | 📝 | `type-sop` | Standard Operating Procedures |
| Timeline | 📅 | `type-timeline` | Chronological logs, daily logs |
| Decision | ⚖️ | `type-decision` | Decision records (ADR, RDR) |
| Template | 📄 | `type-template` | Document templates, scaffolds |
| Workflow | 🔄 | `type-workflow` | Process workflows, automation |
| Integration | 🔌 | `type-integration` | Integration guides, connectors |
| Infrastructure | 🏭 | `type-infrastructure` | DevOps, deployment, infrastructure |
| Business | 💼 | `type-business` | Business documents, planning |
| Concept | 💡 | `type-concept` | Conceptual explanations, theory |

## Status Icons

Document lifecycle and progress indicators.

| Status | Icon | CSS Class | Color | Description |
|--------|------|-----------|-------|-------------|
| Complete | ✅ | `status-complete` | Green | Finished and validated |
| In Progress | 🔄 | `status-in-progress` | Amber | Currently being worked on |
| Blocked | 🚫 | `status-blocked` | Red | Blocked by dependencies |
| Planned | 📋 | `status-planned` | Indigo | Planned for future |
| Draft | ✏️ | `status-draft` | Gray | Early draft stage |
| Review | 👁️ | `status-review` | Purple | Under review |
| Archived | 📦 | `status-archived` | Gray | Archived/historical |
| Deprecated | ⚠️ | `status-deprecated` | Orange | No longer recommended |
| Active | ⚡ | `status-active` | Yellow | Actively maintained |
| Paused | ⏸️ | `status-paused` | Blue | Temporarily paused |

## Priority Icons

Task and document priority levels.

| Priority | Icon | CSS Class | Color | Weight |
|----------|------|-----------|-------|--------|
| Critical | 🔴 | `priority-critical` | Red | 900 |
| High | 🟡 | `priority-high` | Amber | 700 |
| Medium | 🔵 | `priority-medium` | Blue | 500 |
| Low | ⚪ | `priority-low` | Gray | 300 |

## Phase Icons

Project phase identifiers.

| Phase | Icon | CSS Class | Color | Focus Area |
|-------|------|-----------|-------|------------|
| Phase 12 | 🔮 | `phase-12` | Purple | Four-Pillar Learning Loop |
| Phase 13 | 🧠 | `phase-13` | Blue | Enhanced Intelligence |
| Phase 14 | 🎨 | `phase-14` | Pink | Obsidian Visual Integration |
| Phase 15 | 🚀 | `phase-15` | Green | Production Deployment |

## Domain Icons

System domain and component areas.

| Domain | Icon | CSS Class | Color | Scope |
|--------|------|-----------|-------|-------|
| Weaver | 🕸️ | `domain-weaver` | Cyan | CLI & Core System |
| Learning Loop | 🧠 | `domain-learning-loop` | Purple | Autonomous Learning |
| Knowledge Graph | 🕸️ | `domain-knowledge-graph` | Pink | Graph & Embeddings |
| Infrastructure | 🏗️ | `domain-infrastructure` | Gray | DevOps & Deployment |
| Perception | 👁️ | `domain-perception` | Teal | Context Analysis |
| Cultivation | 🌱 | `domain-cultivation` | Green | Growth & Evolution |
| Memory | 💾 | `domain-memory` | Blue | Storage & Retrieval |
| Neural | 🤖 | `domain-neural` | Indigo | AI & Neural Networks |

## Scope Icons

Document scope and granularity.

| Scope | Icon | Description |
|-------|------|-------------|
| System | 🌍 | System-wide, global |
| Component | 🧩 | Component or module level |
| Feature | ⭐ | Individual feature |
| Task | ✓ | Specific task |
| File | 📄 | Single file scope |

## Agent Icons

AI agent types in swarm coordination.

| Agent | Icon | Type |
|-------|------|------|
| Planner | 🎯 | Strategic planning |
| Researcher | 🔍 | Research & analysis |
| Coder | 💻 | Implementation |
| Tester | 🧪 | Testing & validation |
| Reviewer | 👁️ | Code review |
| Architect | 🏛️ | Architecture design |
| Monitor | 📊 | Performance monitoring |
| Coordinator | 🎭 | Multi-agent coordination |

## Technology Icons

Technology and framework identifiers.

| Technology | Icon | Category |
|------------|------|----------|
| TypeScript | 🔷 | Language |
| Node.js | 🟢 | Runtime |
| Bun | 🥟 | Runtime |
| Obsidian | 🔮 | Knowledge Management |
| Git | 🌿 | Version Control |
| Docker | 🐳 | Containerization |
| Kubernetes | ☸️ | Orchestration |
| PostgreSQL | 🐘 | Database |
| Redis | 💎 | Cache |
| RabbitMQ | 🐰 | Message Queue |
| MCP | 🔌 | Protocol |
| Claude | 🤖 | AI Model |

## Special Markers

Indicators for special document types or features.

| Marker | Icon | Meaning |
|--------|------|---------|
| Hot | 🔥 | Frequently accessed |
| New | ✨ | Recently created |
| Updated | 🆕 | Recently updated |
| Important | ⭐ | High importance |
| Breaking | 💥 | Breaking changes |
| Deprecated | 💀 | Deprecated content |
| Experimental | 🧪 | Experimental feature |
| Beta | 🚧 | Beta/under construction |
| Locked | 🔒 | Read-only/locked |
| Secret | 🔐 | Contains sensitive info |

## Usage Guidelines

### Frontmatter Integration

```yaml
---
visual:
  icon: "🔬"  # Primary document icon
  color: "#8B5CF6"
  cssclasses: [type-research, status-complete, priority-high]
---
```

### File Naming Convention

While not required, files can be prefixed with icons for visual scanning:

```
📋 planning-master-tasks.md
🏗️ architecture-overview-hub.md
🔬 research-findings-2024.md
✅ test-execution-summary.md
```

### Tag-Based Icons

Icons automatically apply through nested tags:

```markdown
#type/planning   → 📋
#status/complete → ✅
#priority/high   → 🟡
#phase/phase-14  → 🎨
```

### Graph View

Icons appear in graph view nodes when:
1. Document has `visual.icon` in frontmatter
2. Graph filter includes icon display
3. CSS snippet is enabled

### Dataview Queries

Display icons in Dataview tables:

```dataview
TABLE
  visual.icon as "📌",
  title as "Document",
  status as "Status",
  priority as "Priority"
FROM "weave-nn"
SORT priority DESC
```

## Icon Combinations

Documents can combine multiple icons for rich visual context:

### Example: Critical Planning Document
```yaml
visual:
  icon: "📋"           # Type: Planning
  status_icon: "🔄"    # Status: In Progress
  priority_icon: "🔴"  # Priority: Critical
  phase_icon: "🎨"     # Phase: 14
```

Displays as: `📋 🔄 🔴 🎨 Document Title`

## Accessibility Considerations

1. **Screen Readers**: Icons are supplementary; all information must be in text
2. **Color Blindness**: Don't rely solely on icon colors; use shapes/symbols
3. **High Contrast**: Icons work in both light and dark themes
4. **Fallbacks**: System degrades gracefully if icons don't render

## Implementation Checklist

- [x] Define icon mapping system
- [x] Document usage guidelines
- [x] Create frontmatter schema
- [x] Add icons to existing files (109 files updated via automated workflow)
- [x] Create icon application workflow (incremental, full, watch modes)
- [x] Integrate with knowledge graph cultivator
- [x] Create activation guide and test plan
- [ ] Configure Obsidian icon plugin (data.json created, needs manual activation)
- [ ] Enable graph view icons (CSS snippet created, needs manual enablement)
- [ ] Test icon display in all views (test plan created with 33 test cases)
- [ ] Validate accessibility (included in test plan)





## Related

[[obsidian-features-research]]
## Related

[[PHASE-14-WEEK-1-COMPLETION-SUMMARY]]
## Related Documents

- [[metadata-schema-v3]] - Complete frontmatter specification
- [[weave-nn-colors.css]] - CSS color system
- [[tag-hierarchy-system]] - Tag structure
- [[phase-14-obsidian-integration]] - Overall Phase 14 plan

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-28 | Initial icon system definition |

---

**Next Steps**:
1. Run batch script to add icons to all files
2. Configure Obsidian icon plugins
3. Test icon display in graph view
4. Gather user feedback on icon choices
