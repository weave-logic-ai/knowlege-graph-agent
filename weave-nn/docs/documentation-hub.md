---
type: index
title: Documentation Hub
status: active
created_date: '2025-10-23'
cssclasses:
  - index
  - navigation
  - documentation
tags:
  - index
  - documentation
  - navigation
  - architecture
  - implementation
scope: system
priority: high
visual:
  icon: 📄
  cssclasses:
    - type-index
    - status-active
    - priority-high
  graph_group: navigation
version: '3.0'
updated_date: '2025-10-28'
icon: 📄
---

# Documentation Hub

**Location**: `/docs/`
**Parent**: [[../README|Vault Home]]

---

## Overview

Comprehensive documentation for Weave-NN architecture, implementation guides, migration strategies, and technical references. This is the central hub for all project-level documentation.

---

## Architecture Documentation

### Monorepo Structure

- [[monorepo-structure|Monorepo Structure]] - Full microservices vision (v2.0+)
  - Complete directory structure for production deployment
  - 10+ microservices architecture
  - Kubernetes, RabbitMQ, PostgreSQL stack

- [[monorepo-structure-mvp|Monorepo Structure (MVP)]] - MVP-focused directory structure (v0.1-0.4)
  - Single unified Weaver service
  - Docker Compose orchestration
  - SQLite shadow cache
  - Growth path to microservices

### Core Architecture

- [[local-first-architecture-overview|Local-First Architecture Overview]] - Fundamental architectural principles
  - Obsidian vault as source of truth
  - Local-first data ownership
  - Neural network junction pattern
  - Weaver as unified service

- [[obsidian-native-integration-analysis|Obsidian Native Integration Analysis]] - Plugin vs MCP approach
  - Native plugin pros/cons
  - MCP server benefits
  - Decision rationale for MCP approach

---

## Implementation Guides

### Weaver Service

- [[weaver-implementation-summary|Weaver Implementation Summary]] - Complete Weaver service overview
  - File watcher (chokidar)
  - Workflow engine (workflow.dev SDK)
  - Shadow cache (SQLite)
  - MCP server integration
  - AI operations (Vercel AI Gateway)

- [[weaver-proxy-architecture|Weaver Proxy Architecture]] - workflow.dev integration details
  - Durable workflow orchestration
  - State persistence and recovery
  - Workflow triggers and scheduling

- [[weaver-mcp-unification-summary|Weaver MCP Unification Summary]] - MCP + workflow consolidation
  - Why Weaver combines MCP server + workflow engine
  - Architecture simplification benefits
  - Single service deployment

### Technology Stack

- [[javascript-implementation-status|JavaScript Implementation Status]] - Current tech stack status
  - Node.js/TypeScript decision
  - Python deferral rationale
  - Technology choices and trade-offs

---

## Migration & Strategy

### Migration Guides

- [[migration-strategy-local-to-microservices|Migration Strategy]] - Local-first → microservices evolution
  - Phase 1: MVP (1 service - Weaver)
  - Phase 2: v0.5 (3 services - split Weaver)
  - Phase 3: v1.0 (7 services - Python FastAPI)
  - Phase 4: v2.0+ (10+ services - production scale)

- [[weaver-migration-guide|Weaver Migration Guide]] - Detailed Weaver migration steps
  - From current state to MVP
  - Configuration changes
  - Deployment updates

- [[migration-quick-ref|Migration Quick Reference]] - Quick reference for common migrations
  - Command cheat sheet
  - Configuration templates
  - Troubleshooting tips

---

## Configuration & Setup

### Development Setup

- [[gitignore-dockerignore-patterns|Gitignore & Dockerignore Patterns]] - Version control and Docker exclusions
  - What to commit
  - What to ignore
  - Security best practices

- [[naming-conventions|Naming Conventions]] - File, code, and resource naming standards
  - Python code conventions
  - Service and package names
  - API endpoint patterns
  - Database schemas

---

## Architecture Decisions & Analysis

### Simplification & Deferral

- [[architecture-simplification-complete|Architecture Simplification Summary]] - Why we simplified from microservices to Weaver
  - Complexity reduction analysis
  - MVP scope definition
  - Benefits of unified service

- [[rabbitmq-deferral-summary|RabbitMQ Deferral Summary]] - Why RabbitMQ was deferred to post-MVP
  - Event-driven architecture analysis
  - Complexity vs benefit trade-off
  - When to introduce RabbitMQ (v1.0+)

- [[archival-summary|Archival Summary]] - What was archived and why
  - Legacy documentation moved to `.archive/`
  - Obsolete technical evaluations
  - Historical decision records

---

## Research Synthesis

### Synthesis Documents

See: [[synthesis/README|Research Synthesis Hub]]

Key synthesis documents:
- [[synthesis/research-synthesis-executive-summary|Research Synthesis Executive Summary]]
- [[synthesis/prioritized-action-items|Prioritized Action Items]]

---









## Related

[[task-completion-code-examples]]
## Related

[[services-architecture-hub]]
## Related

[[guides-index-hub]]
## Related

[[architecture-overview-hub]]
## Related Documentation

### Project Planning
- [[../_planning/README|Planning Documents]] - Phases, tasks, daily logs
- [[../_planning/phases/phase-4b-pre-development-mvp-planning-sprint|Phase 4B]] - Current phase

### Technical Details
- [[../technical/README|Technical Stack]] - Technologies and frameworks
- [[../mcp/README|MCP Documentation]] - Model Context Protocol
- [[../integrations/README|Integrations]] - External services

### Architecture
- [[../architecture/README|Architecture]] - System architecture layers

---

**Last Updated**: 2025-10-23
**Document Count**: 20+ documentation files
**Status**: Active - MVP documentation complete
**Next Review**: After MVP implementation (Phase 6-7)
