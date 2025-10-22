---
feature_id: "F-024"
feature_name: "Multi-Vault Support"
category: "data"
status: "planned"
priority: "medium"
release: "v2.0"
complexity: "very-complex"

dependencies:
  requires: ["F-021", "F-022"]
  blocks: []

related_decisions:
  - "[[../decisions/technical/data-storage]]"

tags:
  - feature
  - data
  - v2.0
  - scalability
---

# Multi-Vault Support

Ability to create, manage, and switch between multiple independent knowledge graphs (vaults) within a single workspace, with optional cross-vault linking and search.

## User Story
As a power user managing multiple projects or domains, I want to maintain separate knowledge graphs (personal, work, research) while optionally linking across them so that I can organize knowledge by context without mixing concerns.

## Key Capabilities
- Create and manage multiple isolated vaults per workspace
- Fast vault switching with context preservation
- Optional cross-vault search and linking
- Vault-specific settings and permissions
- Vault templates for quick setup (project, research, personal)
- Cross-vault analytics and unified search option
- Vault import/export and archival

## Dependencies
- Requires: [[git-integration|F-021 Git Integration]], [[backup-sync|F-022 Backup & Sync]]
- Enables: Better organization for multi-context users
- Builds on: [[workspace-management|Workspace Management]], [[data-portability|Data Portability]]

## Why v2.0
Requires fundamental architectural changes to support data isolation, routing, and cross-vault operations. Needs sophisticated permission model, storage partitioning, and performance optimization for vault switching and unified search.

## Implementation Notes
- Database schema with vault-level partitioning
- Routing layer for vault-scoped operations
- Cross-vault reference resolution system
- Vault-aware search indexing
- Permission inheritance and isolation model
- Estimated effort: 10-12 weeks

## Related
- [[../concepts/knowledge-graph|Knowledge Graph]]
- [[workspace-management|Workspace Management Feature]]
- [[data-portability|Data Portability Feature]]
