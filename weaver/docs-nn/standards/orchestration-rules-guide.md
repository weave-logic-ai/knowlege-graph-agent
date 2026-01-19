---
title: "Orchestration Rules Guide"
type: standard
status: active
category: standards
description: "The Agent Orchestration Rules Engine provides intelligent, rule-based task routing and management for multi-agent workflows. Rules are defined in JSON format and evaluated dynamically to make decis..."
created: 2025-12-29
updated: 2025-12-29
original: "docs/orchestration-rules-guide.md"
---

# Orchestration Rules Guide

## Overview

The Agent Orchestration Rules Engine provides intelligent, rule-based task routing and management for multi-agent workflows. Rules are defined in JSON format and evaluated dynamically to make decis...

> [!info] Original Documentation
> See [[docs/orchestration-rules-guide.md|original document]] for full details.

## Key Concepts

- **Overview**
- **Quick Start**
- **Rule Schema**
- **Actions**
- **Condition Expressions**
- **Agent Types:**
- **File Pattern Matching:**
- **Keyword Detection:**
- **Complexity Check:**
- **Dependency Count:**

## Research Needed

> [!warning] Areas Requiring Further Research
> - ### Available Context

```typescript
{
  task: {
    id: string;
    description: string;
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    dependencies?
> - : string[];
    requiredCapabilities?
> - : string[];
    estimatedComplexity?
> - Has empty sections that need content

## TODOs

- [ ] Add proper frontmatter
- [ ] Add wikilinks to related documents

## Tags


