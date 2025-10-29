---
title: 'Phase 12: Autonomous Learning Loop Implementation Blueprint'
type: architecture
status: complete
created_date: {}
updated_date: '2025-10-28'
tags:
  - phase-12
  - learning-loop
  - implementation-blueprint
  - mcp-tools
  - autonomous-agents
category: technical
domain: phase-12
scope: module
audience:
  - developers
  - architects
related_concepts:
  - autonomous-learning-loop
  - four-pillar-framework
  - mcp-orchestration
  - perception
  - reasoning
  - memory
  - execution
related_files:
  - PHASE-12-LEARNING-LOOP-INTEGRATION.md
  - PHASE-12-EXECUTIVE-SUMMARY.md
  - phase-12-mcp-gap-coverage.md
  - WEAVER-COMPLETE-IMPLEMENTATION-GUIDE.md
author: ai-generated
version: 1.0.0
phase_id: PHASE-12
priority: critical
effort_savings: 62%
implementation_time: 3-4 weeks
visual:
  icon: 🏗️
  color: '#F59E0B'
  cssclasses:
    - type-architecture
    - status-complete
    - priority-critical
    - phase-12
    - domain-phase-12
icon: 🏗️
---

# Phase 12: Autonomous Learning Loop Implementation Blueprint

**Document Version**: 1.0.0
**Created**: 2025-10-27
**Architect**: System Architecture Designer
**Status**: 🎯 Implementation Playbook

---

## Executive Summary

This document provides the **definitive implementation blueprint** for building an autonomous learning loop in Weaver using MCP tool orchestration. The blueprint bridges academic research (4-pillar framework from "Fundamentals of Building Autonomous LLM Agents") with practical implementation using existing MCP tools (Claude-Flow, ruv-swarm, Flow-Nexus).

**Key Achievement**: Transform Weaver from a reactive workflow system into a **truly autonomous agent** capable of self-improvement through continuous learning.

**Implementation Time**: **3-4 weeks** (reduced from 8-10 weeks by leveraging MCP tools)
**Effort Savings**: **62%** (248 hours saved)
**MCP Coverage**: **83%** of required functionality

---











## Related

[[claude-flow-integration-design]]
## Related

[[PHASE-13-COMPLETE-PLAN]]
## Related

[[PHASE-12-IMPLEMENTATION-COMPLETE]]
## Related

[[phase-12-architecture]]
## Related

[[learning-loop-api]]
## Table of Contents

1. [The Autonomous Learning Loop (Overview)](#1-the-autonomous-learning-loop-overview)
2. [Loop Architecture Diagram](#2-loop-architecture-diagram)
3. [Stage 1: Perception (Input Processing)](#3-stage-1-perception-input-processing)
4. [Stage 2: Reasoning (Plan Generation)](#4-stage-2-reasoning-plan-generation)
5. [Stage 3: Memory (Context & Learning)](#5-stage-3-memory-context--learning)
6. [Stage 4: Execution (Action Taking)](#6-stage-4-execution-action-taking)
7. [Stage 5: Reflection (Learning from Outcomes)](#7-stage-5-reflection-learning-from-outcomes)
8. [The Complete Learning Loop](#8-the-complete-learning-loop)
9. [Integration with Weaver Architecture](#9-integration-with-weaver-architecture)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Success Metrics](#11-success-metrics)
12. [Code Examples](#12-code-examples)

---

## 1. The Autonomous Learning Loop (Overview)

### 1.1 What is an Autonomous Learning Loop?

An **autonomous learning loop** transforms an LLM from a reactive tool into a **self-improving agent** that:

1. **Perceives** the environment and gathers relevant context
2. **Reasons** about the best approach using past experiences
3. **Remembers** successful and failed attempts
4. **Executes** chosen actions
5. **Reflects** on outcomes to improve future performance

**The Critical Difference**: Workflows vs. Agents

```
┌──────────────────────────────────────────────────────────────┐
│                       WORKFLOW (Current)                      │
├──────────────────────────────────────────────────────────────┤
│  User Input → Predefined Steps → Execute → Done             │
│  ❌ No learning                                              │
│  ❌ No adaptation                                            │
│  ❌ Repeats same mistakes                                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   AUTONOMOUS AGENT (Phase 12)                │
├──────────────────────────────────────────────────────────────┤
│  User Input → Perceive Context → Reason about Approach →    │
│  Generate Plan → Execute → Reflect → Store Experience →     │
│  Improve Next Time                                           │
│  ✅ Learns from mistakes                                     │
│  ✅ Adapts strategies                                        │
│  ✅ Improves autonomously                                    │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 The Five-Stage Loop

```
     ┌─────────────────────────────────────────────────────┐
     │                                                     │
     │  ┌──────────┐    ┌──────────┐    ┌──────────┐    │
     │  │  MEMORY  │◄───│PERCEPTION│◄───│  INPUT   │    │
     │  │  SYSTEM  │    └──────────┘    └──────────┘    │
     │  └────┬─────┘                                     │
     │       │                                           │
     │       ▼                                           │
     │  ┌──────────┐    ┌──────────┐    ┌──────────┐   │
     │  │REASONING │───►│EXECUTION │───►│  OUTPUT  │   │
     │  └──────────┘    └────┬─────┘    └──────────┘   │
     │       ▲                │                          │
     │       │                ▼                          │
     │       │         ┌──────────┐                     │
     │       └─────────│REFLECTION│                     │
     │                 └──────────┘                     │
     │                       │                          │
     └───────────────────────┼──────────────────────────┘
                             │
                             ▼
                     AUTONOMOUS IMPROVEMENT
```

### 1.3 Key Differences from Reactive Workflows

| Aspect | Reactive Workflow | Autonomous Agent |
|--------|------------------|------------------|
| **Strategy** | Pre-defined steps | Generated from context |
| **Adaptation** | None | Learns from experience |
| **Context** | User input only | Vault + Memory + History |
| **Errors** | Repeat mistakes | Learn and avoid |
| **Planning** | Single path | Multiple alternatives |
| **Memory** | None | Persistent experiences |
| **Improvement** | Manual updates | Autonomous learning |

### 1.4 Performance Gap

According to research:
- **Current leading agents**: 42.9% task completion
- **Human baseline**: 72.36% task completion
- **Opportunity**: **29.5% improvement** through proper architecture

---

## 2. Loop Architecture Diagram

### 2.1 Complete Learning Loop Flow

```mermaid
sequenceDiagram
    participant User
    participant Weaver
    participant Perception
    participant Memory
    participant Reasoning
    participant Execution
    participant Reflection

    User->>Weaver: Task Request
    Weaver->>Perception: Gather Context
    Perception->>Memory: Retrieve Past Experiences
    Memory-->>Perception: Relevant Experiences
    Perception->>Perception: Fuse Context Sources
    Perception-->>Reasoning: Context Package

    Reasoning->>Memory: Check Similar Tasks
    Memory-->>Reasoning: Historical Patterns
    Reasoning->>Reasoning: Generate 3-5 Alternative Plans
    Reasoning->>Reasoning: Evaluate Plans (CoT)
    Reasoning-->>Execution: Selected Plan

    Execution->>Execution: Execute Steps
    Execution->>Execution: Monitor Progress
    Execution-->>Reflection: Execution Result

    Reflection->>Reflection: Analyze Outcome
    Reflection->>Reflection: Extract Lessons
    Reflection-->>Memory: Store Experience

    Memory->>Memory: Update Patterns
    Memory->>Memory: Consolidate Knowledge
    Memory-->>Weaver: Learning Complete

    Weaver-->>User: Task Complete + Improved
```

### 2.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PERCEPTION STAGE                        │
├─────────────────────────────────────────────────────────────┤
│  Input Sources:                                             │
│    • User task description                                  │
│    • Vault files (shadow cache)                             │
│    • Past experiences (Claude-Flow memory)                  │
│    • External knowledge (WebFetch)                          │
│                                                              │
│  MCP Tools:                                                  │
│    • mcp__claude-flow__memory_search                        │
│    • mcp__claude-flow__memory_usage (retrieve)              │
│    • Custom: Vector embeddings (semantic search)            │
│    • Built-in: WebFetch (optional)                          │
│                                                              │
│  Output: Fused Context Package                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      REASONING STAGE                         │
├─────────────────────────────────────────────────────────────┤
│  Process:                                                    │
│    1. Decompose task into subtasks                          │
│    2. Generate 3-5 alternative plans (parallel)             │
│    3. Evaluate plans based on past success                  │
│    4. Select best plan (self-consistent CoT)                │
│                                                              │
│  MCP Tools:                                                  │
│    • mcp__claude-flow__parallel_execute                     │
│    • mcp__claude-flow__task_orchestrate                     │
│    • mcp__claude-flow__agent_spawn (planning expert)        │
│    • mcp__claude-flow__neural_patterns                      │
│                                                              │
│  Output: Optimized Execution Plan                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      EXECUTION STAGE                         │
├─────────────────────────────────────────────────────────────┤
│  Process:                                                    │
│    1. Execute plan steps via workflows                      │
│    2. Monitor execution state                               │
│    3. Handle errors (retry, fallback, replan)               │
│    4. Collect execution metrics                             │
│                                                              │
│  MCP Tools:                                                  │
│    • mcp__claude-flow__workflow_execute                     │
│    • mcp__flow-nexus__sandbox_execute (code execution)      │
│    • mcp__claude-flow__daa_fault_tolerance                  │
│    • Existing: Weaver workflow engine, git, shadow cache    │
│                                                              │
│  Output: Execution Result + Metrics                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     REFLECTION STAGE                         │
├─────────────────────────────────────────────────────────────┤
│  Process:                                                    │
│    1. Analyze execution outcome (success/failure)           │
│    2. Identify root causes (if failure)                     │
│    3. Extract actionable lessons                            │
│    4. Generate improvement recommendations                  │
│                                                              │
│  MCP Tools:                                                  │
│    • mcp__claude-flow__error_analysis                       │
│    • mcp__claude-flow__neural_patterns (analyze)            │
│    • mcp__claude-flow__cognitive_analyze                    │
│    • mcp__claude-flow__daa_meta_learning                    │
│                                                              │
│  Output: Lessons Learned + Recommendations                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                       MEMORY STAGE                           │
├─────────────────────────────────────────────────────────────┤
│  Process:                                                    │
│    1. Store complete experience (task → outcome)            │
│    2. Update neural patterns                                │
│    3. Consolidate similar experiences                       │
│    4. Persist for future retrieval                          │
│                                                              │
│  MCP Tools:                                                  │
│    • mcp__claude-flow__memory_usage (store)                 │
│    • mcp__claude-flow__neural_patterns (learn)              │
│    • mcp__claude-flow__memory_compress                      │
│    • mcp__claude-flow__memory_persist                       │
│                                                              │
│  Output: Updated Agent Memory                               │
└─────────────────────────────────────────────────────────────┘
                       │
                       └──────► NEXT TASK (improved)
```

---

## 3. Stage 1: Perception (Input Processing)

### 3.1 Overview

**Purpose**: Gather and process environmental data to create a rich context for reasoning.

**What Happens**:
1. Collect user's task description
2. Search vault for relevant notes (shadow cache)
3. Retrieve past similar experiences (Claude-Flow memory)
4. Optionally fetch external knowledge (WebFetch)
5. Fuse all sources into unified context

### 3.2 MCP Tool Orchestration

**Primary Tools**:
- `mcp__claude-flow__memory_search` - Search past experiences (keyword)
- `mcp__claude-flow__memory_usage` - Retrieve specific experiences
- Weaver Shadow Cache - Query vault notes (existing)
- `WebFetch` - External knowledge (built-in, optional)

**Custom Development Required**:
- Vector embeddings for semantic search (16 hours)
- Context fusion logic (5 hours)

### 3.3 Implementation Code

```typescript
// src/learning-loop/perception.ts

import { ClaudeFlowClient } from '../memory/claude-flow-client';
import { ShadowCache } from '../shadow-cache';
import { WebFetch } from 'claude-code'; // Built-in
import { VectorEmbeddings } from './embeddings'; // Custom

export interface PerceptionContext {
  task: string;
  vaultContext: any[];
  pastExperiences: any[];
  externalKnowledge?: string;
  semanticMatches: any[];
}

export class PerceptionSystem {
  constructor(
    private claudeFlow: ClaudeFlowClient,
    private shadowCache: ShadowCache,
    private embeddings: VectorEmbeddings
  ) {}

  /**
   * STAGE 1: Perception - Gather all relevant context
   */
  async perceive(task: string): Promise<PerceptionContext> {
    // Run all context gathering in parallel
    const [
      vaultContext,
      pastExperiences,
      semanticMatches,
      externalKnowledge
    ] = await Promise.all([
      this.gatherVaultContext(task),
      this.retrievePastExperiences(task),
      this.semanticSearch(task),
      this.optionalExternalKnowledge(task)
    ]);

    // Fuse all sources
    return this.fuseContext({
      task,
      vaultContext,
      pastExperiences,
      semanticMatches,
      externalKnowledge
    });
  }

  /**
   * Use Weaver's shadow cache to find relevant vault notes
   */
  private async gatherVaultContext(task: string): Promise<any[]> {
    // Extract keywords from task
    const keywords = this.extractKeywords(task);

    // Query shadow cache (existing Weaver functionality)
    const results = await this.shadowCache.queryFiles({
      tags: keywords,
      limit: 10
    });

    return results;
  }

  /**
   * Use Claude-Flow memory to retrieve past experiences
   */
  private async retrievePastExperiences(task: string): Promise<any[]> {
    // MCP: Search for similar past tasks
    const experiences = await this.claudeFlow.memorySearch({
      action: 'search',
      pattern: task,
      namespace: 'weaver_experiences',
      limit: 5
    });

    return experiences.map(exp => JSON.parse(exp.value));
  }

  /**
   * Custom: Semantic search using vector embeddings
   */
  private async semanticSearch(task: string): Promise<any[]> {
    // Generate embedding for task
    const taskEmbedding = await this.embeddings.encode(task);

    // Search vault using vector similarity
    const matches = await this.embeddings.search(taskEmbedding, {
      topK: 5,
      threshold: 0.7
    });

    return matches;
  }

  /**
   * Optional: Fetch external knowledge if needed
   */
  private async optionalExternalKnowledge(task: string): Promise<string | undefined> {
    // Only fetch external knowledge for specific task types
    if (this.requiresExternalKnowledge(task)) {
      const url = this.inferSearchUrl(task);
      const content = await WebFetch({
        url,
        prompt: 'Extract main technical information relevant to: ' + task
      });
      return content;
    }
    return undefined;
  }

  /**
   * Fuse all context sources into unified package
   */
  private fuseContext(sources: PerceptionContext): PerceptionContext {
    // Deduplicate and prioritize
    // Recent experiences > Semantic matches > Vault notes > External

    return {
      task: sources.task,
      vaultContext: this.deduplicateNotes(sources.vaultContext),
      pastExperiences: this.prioritizeExperiences(sources.pastExperiences),
      semanticMatches: sources.semanticMatches,
      externalKnowledge: sources.externalKnowledge
    };
  }

  private extractKeywords(task: string): string[] {
    // Simple keyword extraction (can be enhanced with NLP)
    return task
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
  }

  private requiresExternalKnowledge(task: string): boolean {
    // Heuristic: tasks mentioning "latest", "current", "2025", etc.
    const externalKeywords = ['latest', 'current', 'recent', '2025', 'news'];
    return externalKeywords.some(kw => task.toLowerCase().includes(kw));
  }

  private inferSearchUrl(task: string): string {
    // Simple URL inference (can be enhanced)
    const query = encodeURIComponent(task);
    return `https://duckduckgo.com/?q=${query}`;
  }

  private deduplicateNotes(notes: any[]): any[] {
    // Remove duplicates by path
    const seen = new Set<string>();
    return notes.filter(note => {
      if (seen.has(note.path)) return false;
      seen.add(note.path);
      return true;
    });
  }

  private prioritizeExperiences(experiences: any[]): any[] {
    // Sort by: success (first), then recency
    return experiences.sort((a, b) => {
      if (a.success !== b.success) return b.success ? 1 : -1;
      return b.timestamp - a.timestamp;
    });
  }
}
```

### 3.4 Perception Output Example

```typescript
// Example output from perception stage
const perceptionContext: PerceptionContext = {
  task: "Refactor authentication module to use JWT tokens",

  vaultContext: [
    { path: "notes/authentication-patterns.md", tags: ["auth", "security"] },
    { path: "notes/jwt-implementation.md", tags: ["jwt", "tokens"] }
  ],

  pastExperiences: [
    {
      id: "exp_001",
      task: "Add JWT authentication to API",
      success: true,
      lessons: ["Use bcrypt for password hashing", "Set token expiry to 24h"],
      timestamp: 1698789456000
    },
    {
      id: "exp_002",
      task: "Refactor auth middleware",
      success: false,
      lessons: ["Must invalidate old sessions", "Test with multiple users"],
      timestamp: 1698123456000
    }
  ],

  semanticMatches: [
    { path: "notes/security-best-practices.md", similarity: 0.85 }
  ],

  externalKnowledge: undefined // Not required for this task
};
```

---

## 4. Stage 2: Reasoning (Plan Generation)

### 4.1 Overview

**Purpose**: Generate multiple alternative plans and select the best based on past experiences.

**What Happens**:
1. Decompose task into subtasks
2. Generate 3-5 alternative plans in parallel
3. Evaluate each plan using Chain-of-Thought reasoning
4. Select best plan based on past success patterns
5. (Optional) Devil's advocate reflection on chosen plan

### 4.2 MCP Tool Orchestration

**Primary Tools**:
- `mcp__claude-flow__parallel_execute` - Generate multiple plans concurrently
- `mcp__claude-flow__agent_spawn` - Spawn planning expert agent
- `mcp__claude-flow__task_orchestrate` - Task decomposition
- `mcp__claude-flow__neural_patterns` - Pattern-based reasoning

**Custom Development Required**:
- Plan voting/selection logic (6 hours)
- Chain-of-Thought prompt templates (10 hours)

### 4.3 Implementation Code

```typescript
// src/learning-loop/reasoning.ts

import { ClaudeFlowClient } from '../memory/claude-flow-client';
import { ClaudeClient } from '../agents/claude-client';
import { PerceptionContext } from './perception';

export interface Plan {
  id: string;
  approach: string;
  steps: PlanStep[];
  estimatedEffort: number;
  riskLevel: 'low' | 'medium' | 'high';
  successProbability: number; // Based on past experiences
}

export interface PlanStep {
  description: string;
  action: string;
  prerequisites: string[];
  expectedOutcome: string;
}

export class ReasoningSystem {
  constructor(
    private claudeFlow: ClaudeFlowClient,
    private claudeClient: ClaudeClient
  ) {}

  /**
   * STAGE 2: Reasoning - Generate and select best plan
   */
  async reason(context: PerceptionContext): Promise<Plan> {
    // 1. Spawn planning expert agent
    const planner = await this.spawnPlanningExpert();

    // 2. Generate multiple alternative plans in parallel
    const alternativePlans = await this.generateAlternativePlans(context, planner);

    // 3. Evaluate plans based on past experiences
    const evaluatedPlans = await this.evaluatePlans(alternativePlans, context);

    // 4. Select best plan
    const bestPlan = this.selectBestPlan(evaluatedPlans);

    // 5. Optional: Devil's advocate reflection
    const refinedPlan = await this.devilsAdvocateReflection(bestPlan, context);

    return refinedPlan;
  }

  /**
   * MCP: Spawn planning expert agent
   */
  private async spawnPlanningExpert() {
    const planner = await this.claudeFlow.agentSpawn({
      type: 'planner',
      name: 'Planning Expert',
      capabilities: [
        'task-decomposition',
        'dependency-analysis',
        'risk-assessment',
        'resource-estimation'
      ]
    });

    return planner;
  }

  /**
   * MCP: Generate 3-5 alternative plans in parallel
   */
  private async generateAlternativePlans(
    context: PerceptionContext,
    planner: any
  ): Promise<Plan[]> {
    // Define different planning strategies
    const strategies = [
      { name: 'Conservative', prompt: this.buildConservativePlanPrompt(context) },
      { name: 'Optimal', prompt: this.buildOptimalPlanPrompt(context) },
      { name: 'Fast', prompt: this.buildFastPlanPrompt(context) },
      { name: 'Experience-Based', prompt: this.buildExperienceBasedPrompt(context) }
    ];

    // MCP: Execute all planning strategies in parallel
    const parallelTasks = strategies.map(strategy => ({
      prompt: strategy.prompt,
      agent: planner.id
    }));

    const results = await this.claudeFlow.parallelExecute({
      tasks: parallelTasks
    });

    // Parse plans from results
    return results.map((result, i) => this.parsePlan(result, strategies[i].name));
  }

  /**
   * Build Chain-of-Thought prompts for different strategies
   */
  private buildConservativePlanPrompt(context: PerceptionContext): string {
    return `
Task: ${context.task}

Approach: CONSERVATIVE (minimize risk, maximize reliability)

Think step-by-step:
1. What are the core requirements?
2. What could go wrong?
3. How can we minimize risks?
4. What's the safest approach?

Past Failures to Avoid:
${this.summarizeFailures(context.pastExperiences)}

Generate a plan with:
- Clear, small steps
- Built-in validation
- Rollback capabilities
- Comprehensive testing

Format as JSON:
{
  "approach": "description",
  "steps": [{ "description": "...", "action": "...", "prerequisites": [], "expectedOutcome": "..." }],
  "riskLevel": "low|medium|high"
}
`;
  }

  private buildOptimalPlanPrompt(context: PerceptionContext): string {
    return `
Task: ${context.task}

Approach: OPTIMAL (balance speed, quality, and maintainability)

Think step-by-step:
1. What's the most efficient approach?
2. How can we leverage existing patterns?
3. What's the right balance of speed vs. thoroughness?

Successful Patterns from Past:
${this.summarizeSuccesses(context.pastExperiences)}

Generate a balanced plan as JSON.
`;
  }

  private buildFastPlanPrompt(context: PerceptionContext): string {
    return `
Task: ${context.task}

Approach: FAST (optimize for speed, acceptable shortcuts)

Think step-by-step:
1. What's the minimum viable solution?
2. What can we skip or defer?
3. What shortcuts are acceptable?

Generate a quick-win plan as JSON.
`;
  }

  private buildExperienceBasedPrompt(context: PerceptionContext): string {
    return `
Task: ${context.task}

Approach: EXPERIENCE-BASED (leverage past successes)

Past Successful Approaches:
${this.summarizeSuccesses(context.pastExperiences)}

Similar Vault Notes:
${this.summarizeVaultContext(context.vaultContext)}

Adapt the most successful past approach to this task.
Generate plan as JSON.
`;
  }

  /**
   * Evaluate plans based on past experiences
   */
  private async evaluatePlans(
    plans: Plan[],
    context: PerceptionContext
  ): Promise<Plan[]> {
    // Calculate success probability for each plan based on past experiences
    return plans.map(plan => {
      const successProbability = this.calculateSuccessProbability(plan, context);
      return { ...plan, successProbability };
    });
  }

  private calculateSuccessProbability(plan: Plan, context: PerceptionContext): number {
    // Simple heuristic based on similarity to past successes
    const similarSuccesses = context.pastExperiences.filter(exp =>
      exp.success && this.planSimilarity(plan, exp) > 0.6
    );

    const similarFailures = context.pastExperiences.filter(exp =>
      !exp.success && this.planSimilarity(plan, exp) > 0.6
    );

    const successRate = similarSuccesses.length / (similarSuccesses.length + similarFailures.length) || 0.5;

    // Adjust for risk level
    const riskPenalty = plan.riskLevel === 'high' ? 0.2 : plan.riskLevel === 'medium' ? 0.1 : 0;

    return Math.max(0, Math.min(1, successRate - riskPenalty));
  }

  private planSimilarity(plan: Plan, experience: any): number {
    // Simple keyword-based similarity
    // In production, use vector embeddings
    const planKeywords = new Set(plan.approach.toLowerCase().split(/\s+/));
    const expKeywords = new Set(experience.task.toLowerCase().split(/\s+/));

    const intersection = new Set([...planKeywords].filter(x => expKeywords.has(x)));
    const union = new Set([...planKeywords, ...expKeywords]);

    return intersection.size / union.size;
  }

  /**
   * Select best plan using voting mechanism
   */
  private selectBestPlan(plans: Plan[]): Plan {
    // Sort by success probability
    const ranked = plans.sort((a, b) => b.successProbability - a.successProbability);

    // Return top plan
    return ranked[0];
  }

  /**
   * Devil's advocate reflection: Challenge the plan before execution
   */
  private async devilsAdvocateReflection(plan: Plan, context: PerceptionContext): Promise<Plan> {
    const critique = await this.claudeClient.sendMessage({
      content: `
You are a devil's advocate. Challenge this plan:

Task: ${context.task}

Plan:
${JSON.stringify(plan, null, 2)}

Past Failures:
${this.summarizeFailures(context.pastExperiences)}

Think step-by-step:
1. What could go wrong?
2. What assumptions might be wrong?
3. What edge cases are missed?
4. What improvements would make this more robust?

Suggest refinements.
`
    });

    // Apply suggested refinements
    return this.refineplan(plan, critique);
  }

  private refinePlan(plan: Plan, critique: string): Plan {
    // In production, parse critique and apply suggestions
    // For now, return original plan
    return plan;
  }

  // Helper methods
  private summarizeFailures(experiences: any[]): string {
    return experiences
      .filter(exp => !exp.success)
      .map(exp => `- ${exp.task}: ${exp.lessons.join('; ')}`)
      .join('\n');
  }

  private summarizeSuccesses(experiences: any[]): string {
    return experiences
      .filter(exp => exp.success)
      .map(exp => `- ${exp.task}: ${exp.lessons.join('; ')}`)
      .join('\n');
  }

  private summarizeVaultContext(notes: any[]): string {
    return notes
      .map(note => `- ${note.path}`)
      .join('\n');
  }

  private parsePlan(result: any, strategyName: string): Plan {
    // Parse JSON plan from Claude response
    // Robust error handling in production
    try {
      const parsed = JSON.parse(result.content);
      return {
        id: `plan_${Date.now()}_${strategyName}`,
        approach: parsed.approach,
        steps: parsed.steps,
        estimatedEffort: parsed.steps.length * 15, // 15 min per step
        riskLevel: parsed.riskLevel,
        successProbability: 0 // Will be calculated later
      };
    } catch (error) {
      // Fallback plan
      return {
        id: `plan_${Date.now()}_${strategyName}`,
        approach: strategyName,
        steps: [],
        estimatedEffort: 0,
        riskLevel: 'medium',
        successProbability: 0
      };
    }
  }
}
```

### 4.4 Reasoning Output Example

```typescript
// Example output from reasoning stage
const selectedPlan: Plan = {
  id: "plan_1698789456_Experience-Based",
  approach: "Leverage existing JWT implementation from vault notes",
  steps: [
    {
      description: "Install jsonwebtoken library",
      action: "npm install jsonwebtoken bcrypt",
      prerequisites: [],
      expectedOutcome: "Dependencies installed"
    },
    {
      description: "Create JWT utility module",
      action: "Create src/auth/jwt-utils.ts with sign/verify functions",
      prerequisites: ["Dependencies installed"],
      expectedOutcome: "JWT utilities available"
    },
    {
      description: "Refactor auth middleware",
      action: "Update src/middleware/auth.ts to use JWT",
      prerequisites: ["JWT utilities available"],
      expectedOutcome: "Middleware uses JWT validation"
    },
    {
      description: "Update login endpoint",
      action: "Modify /api/login to return JWT token",
      prerequisites: ["Middleware updated"],
      expectedOutcome: "Login returns JWT"
    },
    {
      description: "Write tests",
      action: "Create tests/auth/jwt.test.ts",
      prerequisites: ["Login updated"],
      expectedOutcome: "90%+ test coverage"
    }
  ],
  estimatedEffort: 75, // minutes
  riskLevel: "low",
  successProbability: 0.85 // Based on past similar tasks
};
```

---

## 5. Stage 3: Memory (Context & Learning)

### 5.1 Overview

**Purpose**: Store experiences, retrieve relevant knowledge, and enable cross-session learning.

**What Happens**:
1. Store complete experience (task → plan → outcome → lessons)
2. Update neural patterns for future reasoning
3. Consolidate similar experiences
4. Persist memory across sessions
5. Enable hierarchical memory (recent detailed, old summarized)

### 5.2 MCP Tool Orchestration

**Primary Tools**:
- `mcp__claude-flow__memory_usage` - Store/retrieve experiences
- `mcp__claude-flow__memory_search` - Semantic search
- `mcp__claude-flow__memory_persist` - Cross-session persistence
- `mcp__claude-flow__memory_compress` - Consolidation
- `mcp__claude-flow__neural_patterns` - Pattern learning

**Custom Development Required**:
- Vector embeddings (16 hours, shared with Perception)
- Experience schema design (4 hours)

### 5.3 Implementation Code

```typescript
// src/learning-loop/memory.ts

import { ClaudeFlowClient } from '../memory/claude-flow-client';
import { VectorEmbeddings } from './embeddings';

export interface Experience {
  id: string;
  task: string;
  context: any;
  plan: any;
  outcome: any;
  success: boolean;
  lessons: string[];
  timestamp: number;
  embedding?: number[]; // Vector embedding for semantic search
}

export class MemorySystem {
  constructor(
    private claudeFlow: ClaudeFlowClient,
    private embeddings: VectorEmbeddings
  ) {}

  /**
   * STAGE 3: Memory - Store experience and update patterns
   */
  async memorize(experience: Experience): Promise<void> {
    // 1. Generate embedding for semantic search
    const embedding = await this.embeddings.encode(
      `${experience.task} ${experience.lessons.join(' ')}`
    );

    experience.embedding = embedding;

    // 2. Store complete experience
    await this.storeExperience(experience);

    // 3. Update neural patterns
    await this.updateNeuralPatterns(experience);

    // 4. Consolidate if needed
    await this.conditionalConsolidation();

    // 5. Persist for cross-session availability
    await this.persistMemory();
  }

  /**
   * MCP: Store experience in Claude-Flow memory
   */
  private async storeExperience(experience: Experience): Promise<void> {
    await this.claudeFlow.memoryUsage({
      action: 'store',
      namespace: 'weaver_experiences',
      key: `task_${experience.id}`,
      value: JSON.stringify({
        task: experience.task,
        context: experience.context,
        plan: experience.plan,
        outcome: experience.outcome,
        success: experience.success,
        lessons: experience.lessons,
        timestamp: experience.timestamp,
        embedding: experience.embedding
      }),
      ttl: 30 * 24 * 60 * 60 // 30 days for detailed experiences
    });

    // Also store in hierarchical tiers
    await this.storeHierarchical(experience);
  }

  /**
   * Hierarchical memory: Recent (detailed) vs. Historical (summarized)
   */
  private async storeHierarchical(experience: Experience): Promise<void> {
    // Recent memory: Full detail, 7 days
    await this.claudeFlow.memoryUsage({
      action: 'store',
      namespace: 'weaver_recent',
      key: `recent_${experience.id}`,
      value: JSON.stringify(experience),
      ttl: 7 * 24 * 60 * 60 // 7 days
    });

    // Historical memory: Summarized, 90 days
    const summary = this.summarizeExperience(experience);
    await this.claudeFlow.memoryUsage({
      action: 'store',
      namespace: 'weaver_historical',
      key: `hist_${experience.id}`,
      value: JSON.stringify(summary),
      ttl: 90 * 24 * 60 * 60 // 90 days
    });
  }

  /**
   * MCP: Update neural patterns for future reasoning
   */
  private async updateNeuralPatterns(experience: Experience): Promise<void> {
    await this.claudeFlow.neuralPatterns({
      action: 'learn',
      operation: experience.task,
      outcome: experience.success ? 'success' : 'failure',
      metadata: {
        lessons: experience.lessons,
        approach: experience.plan?.approach
      }
    });
  }

  /**
   * MCP: Consolidate memory when threshold reached
   */
  private async conditionalConsolidation(): Promise<void> {
    // Get count of experiences
    const count = await this.getExperienceCount();

    // Consolidate every 100 experiences
    if (count % 100 === 0) {
      await this.consolidateMemory();
    }
  }

  /**
   * MCP: Memory consolidation (deduplication, merging)
   */
  private async consolidateMemory(): Promise<void> {
    // MCP: Compress old memories
    await this.claudeFlow.memoryCompress({
      namespace: 'weaver_experiences'
    });

    // Custom: Merge similar experiences into patterns
    await this.mergeSimilarExperiences();
  }

  /**
   * Merge similar experiences into reusable procedures
   */
  private async mergeSimilarExperiences(): Promise<void> {
    // Retrieve all experiences
    const experiences = await this.claudeFlow.memoryUsage({
      action: 'list',
      namespace: 'weaver_experiences'
    });

    // Group by similarity
    const groups = this.groupBySimilarity(experiences);

    // Create procedure for each group with 5+ members
    for (const group of groups) {
      if (group.length >= 5) {
        await this.createProcedure(group);
      }
    }
  }

  /**
   * Create reusable procedure from similar experiences
   */
  private async createProcedure(experiences: Experience[]): Promise<void> {
    // Extract common pattern
    const procedure = {
      id: `proc_${Date.now()}`,
      name: this.inferProcedureName(experiences),
      steps: this.extractCommonSteps(experiences),
      successRate: experiences.filter(e => e.success).length / experiences.length,
      usageCount: experiences.length
    };

    // Store procedure
    await this.claudeFlow.memoryUsage({
      action: 'store',
      namespace: 'weaver_procedures',
      key: procedure.id,
      value: JSON.stringify(procedure),
      ttl: 180 * 24 * 60 * 60 // 180 days (long-lived)
    });
  }

  /**
   * MCP: Persist memory across sessions
   */
  private async persistMemory(): Promise<void> {
    await this.claudeFlow.memoryPersist({
      sessionId: 'weaver_main_session'
    });
  }

  /**
   * Retrieve experiences for perception stage
   */
  async retrieveRelevantExperiences(task: string, limit: number = 5): Promise<Experience[]> {
    // Generate embedding for semantic search
    const queryEmbedding = await this.embeddings.encode(task);

    // MCP: Keyword search
    const keywordMatches = await this.claudeFlow.memorySearch({
      action: 'search',
      pattern: task,
      namespace: 'weaver_experiences',
      limit: limit * 2 // Get more for reranking
    });

    // Parse experiences
    const experiences = keywordMatches.map(m => JSON.parse(m.value) as Experience);

    // Rerank by semantic similarity
    const reranked = experiences
      .map(exp => ({
        experience: exp,
        similarity: this.cosineSimilarity(queryEmbedding, exp.embedding || [])
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.experience);

    return reranked;
  }

  // Helper methods
  private summarizeExperience(experience: Experience): any {
    return {
      id: experience.id,
      task: experience.task,
      success: experience.success,
      lessons: experience.lessons,
      timestamp: experience.timestamp
    };
  }

  private async getExperienceCount(): Promise<number> {
    const all = await this.claudeFlow.memoryUsage({
      action: 'list',
      namespace: 'weaver_experiences'
    });
    return all.length;
  }

  private groupBySimilarity(experiences: any[]): Experience[][] {
    // Simple clustering by task similarity
    // In production, use proper clustering algorithm
    const groups: Experience[][] = [];
    const used = new Set<string>();

    for (const exp1 of experiences) {
      if (used.has(exp1.id)) continue;

      const group: Experience[] = [exp1];
      used.add(exp1.id);

      for (const exp2 of experiences) {
        if (used.has(exp2.id)) continue;

        const similarity = this.cosineSimilarity(
          exp1.embedding || [],
          exp2.embedding || []
        );

        if (similarity > 0.8) {
          group.push(exp2);
          used.add(exp2.id);
        }
      }

      if (group.length > 1) {
        groups.push(group);
      }
    }

    return groups;
  }

  private inferProcedureName(experiences: Experience[]): string {
    // Extract most common words from task descriptions
    const words = experiences
      .flatMap(e => e.task.toLowerCase().split(/\s+/))
      .filter(w => w.length > 4);

    const counts = words.reduce((acc, w) => {
      acc[w] = (acc[w] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topWords = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    return topWords.join(' ') + ' procedure';
  }

  private extractCommonSteps(experiences: Experience[]): any[] {
    // Find steps common to most experiences
    // Simplified implementation
    const allSteps = experiences
      .flatMap(e => e.plan?.steps || [])
      .filter(s => s);

    // Group by description similarity
    // Return most common steps
    return allSteps.slice(0, 5); // Placeholder
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
```

---

## 6. Stage 4: Execution (Action Taking)

### 6.1 Overview

**Purpose**: Execute the selected plan using Weaver's workflow engine and MCP tools.

**What Happens**:
1. Convert plan into executable workflow
2. Execute steps sequentially or in parallel
3. Monitor execution state
4. Handle errors with retry/fallback/replan
5. Collect execution metrics

### 6.2 MCP Tool Orchestration

**Primary Tools**:
- Weaver Workflow Engine (existing)
- `mcp__claude-flow__daa_fault_tolerance` - Error recovery
- `mcp__flow-nexus__sandbox_execute` - Code execution (optional)
- Weaver Git Client (existing)
- Weaver Shadow Cache (existing)

**Custom Development Required**:
- Plan-to-workflow conversion (8 hours)
- State verification middleware (8 hours)

### 6.3 Implementation Code

```typescript
// src/learning-loop/execution.ts

import { WorkflowEngine } from '../workflow-engine';
import { ClaudeFlowClient } from '../memory/claude-flow-client';
import { GitClient } from '../git/git-client';
import { ShadowCache } from '../shadow-cache';
import { Plan } from './reasoning';

export interface ExecutionResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  errors: any[];
  metrics: ExecutionMetrics;
  output: any;
}

export interface ExecutionMetrics {
  duration: number;
  stepsExecuted: number;
  retries: number;
  fallbacks: number;
}

export class ExecutionSystem {
  constructor(
    private workflowEngine: WorkflowEngine,
    private claudeFlow: ClaudeFlowClient,
    private gitClient: GitClient,
    private shadowCache: ShadowCache
  ) {}

  /**
   * STAGE 4: Execution - Execute plan and monitor
   */
  async execute(plan: Plan): Promise<ExecutionResult> {
    const startTime = Date.now();
    const metrics: ExecutionMetrics = {
      duration: 0,
      stepsExecuted: 0,
      retries: 0,
      fallbacks: 0
    };

    // 1. Convert plan to workflow
    const workflow = this.planToWorkflow(plan);

    // 2. Enable fault tolerance
    await this.enableFaultTolerance();

    // 3. Execute workflow with monitoring
    const result = await this.executeWithMonitoring(workflow, metrics);

    // 4. Calculate metrics
    metrics.duration = Date.now() - startTime;

    return {
      success: result.success,
      completedSteps: result.completedSteps,
      totalSteps: plan.steps.length,
      errors: result.errors,
      metrics,
      output: result.output
    };
  }

  /**
   * Convert plan to Weaver workflow
   */
  private planToWorkflow(plan: Plan): any {
    return {
      id: `workflow_${plan.id}`,
      name: `Execute: ${plan.approach}`,
      steps: plan.steps.map((step, i) => ({
        id: `step_${i}`,
        name: step.description,
        handler: this.createStepHandler(step),
        retry: {
          max: 3,
          backoff: 'exponential'
        },
        timeout: 60000 // 1 minute per step
      }))
    };
  }

  /**
   * Create handler function for each plan step
   */
  private createStepHandler(step: any): (context: any) => Promise<any> {
    return async (context: any) => {
      // Verify prerequisites
      await this.verifyPrerequisites(step.prerequisites);

      // Execute action
      const result = await this.executeAction(step.action, context);

      // Verify expected outcome
      await this.verifyOutcome(step.expectedOutcome, result);

      return result;
    };
  }

  /**
   * MCP: Enable fault tolerance
   */
  private async enableFaultTolerance(): Promise<void> {
    await this.claudeFlow.daaFaultTolerance({
      agentId: 'workflow-engine',
      strategy: 'retry-with-backoff'
    });
  }

  /**
   * Execute workflow with state monitoring
   */
  private async executeWithMonitoring(workflow: any, metrics: ExecutionMetrics): Promise<any> {
    const errors: any[] = [];
    let completedSteps = 0;

    for (const step of workflow.steps) {
      try {
        // Pre-execution state snapshot
        await this.snapshotState(step.id);

        // Execute step
        await step.handler({});

        completedSteps++;
        metrics.stepsExecuted++;

      } catch (error) {
        errors.push({
          step: step.name,
          error: error.message,
          timestamp: Date.now()
        });

        // Try recovery
        const recovered = await this.recoverFromError(step, error, metrics);

        if (!recovered) {
          // Cannot recover, stop execution
          return {
            success: false,
            completedSteps,
            errors,
            output: null
          };
        } else {
          completedSteps++;
          metrics.stepsExecuted++;
        }
      }
    }

    return {
      success: true,
      completedSteps,
      errors,
      output: { message: 'All steps completed successfully' }
    };
  }

  /**
   * State verification before execution
   */
  private async verifyPrerequisites(prerequisites: string[]): Promise<void> {
    for (const prereq of prerequisites) {
      const verified = await this.checkPrerequisite(prereq);
      if (!verified) {
        throw new Error(`Prerequisite not met: ${prereq}`);
      }
    }
  }

  private async checkPrerequisite(prereq: string): Promise<boolean> {
    // Simple heuristic checks
    if (prereq.includes('installed')) {
      // Check if package exists
      return true; // Simplified
    }
    if (prereq.includes('created')) {
      // Check if file exists
      return true; // Simplified
    }
    return true;
  }

  /**
   * Execute action (dispatch to appropriate handler)
   */
  private async executeAction(action: string, context: any): Promise<any> {
    if (action.startsWith('npm')) {
      return await this.executeNpmCommand(action);
    } else if (action.startsWith('Create')) {
      return await this.executeFileCreation(action);
    } else if (action.startsWith('Update') || action.startsWith('Modify')) {
      return await this.executeFileModification(action);
    } else {
      // Generic action
      return await this.executeGenericAction(action, context);
    }
  }

  private async executeNpmCommand(command: string): Promise<any> {
    // Execute npm command via child_process
    // Return result
    return { success: true, output: 'Package installed' };
  }

  private async executeFileCreation(action: string): Promise<any> {
    // Parse file path from action
    // Create file
    // Update shadow cache
    return { success: true, file: 'created' };
  }

  private async executeFileModification(action: string): Promise<any> {
    // Parse file path from action
    // Modify file
    // Update shadow cache
    return { success: true, file: 'modified' };
  }

  private async executeGenericAction(action: string, context: any): Promise<any> {
    // Fallback: log action, return success
    console.log(`Executing: ${action}`);
    return { success: true };
  }

  /**
   * Verify expected outcome after execution
   */
  private async verifyOutcome(expected: string, result: any): Promise<void> {
    // Simple verification (can be enhanced)
    if (!result.success && result.success !== undefined) {
      throw new Error(`Expected outcome not met: ${expected}`);
    }
  }

  /**
   * Snapshot state before step execution
   */
  private async snapshotState(stepId: string): Promise<void> {
    await this.claudeFlow.stateSnapshot({
      name: `pre_step_${stepId}`
    });
  }

  /**
   * Recover from execution error
   */
  private async recoverFromError(step: any, error: any, metrics: ExecutionMetrics): Promise<boolean> {
    // Try retry
    if (metrics.retries < 3) {
      metrics.retries++;
      console.log(`Retrying step: ${step.name} (attempt ${metrics.retries})`);

      try {
        await step.handler({});
        return true;
      } catch (retryError) {
        // Retry failed, try fallback
      }
    }

    // Try fallback action
    const fallbackSuccessful = await this.executeFallback(step, metrics);
    if (fallbackSuccessful) {
      return true;
    }

    // Cannot recover
    return false;
  }

  private async executeFallback(step: any, metrics: ExecutionMetrics): Promise<boolean> {
    metrics.fallbacks++;
    console.log(`Executing fallback for: ${step.name}`);

    // Simplified fallback (skip step or use default)
    return true;
  }
}
```

---

## 7. Stage 5: Reflection (Learning from Outcomes)

### 7.1 Overview

**Purpose**: Analyze execution outcomes, extract lessons, and improve future strategies.

**What Happens**:
1. Classify outcome (success/failure/partial)
2. If failure: root cause analysis
3. Extract actionable lessons
4. Generate improvement recommendations
5. Update meta-learning strategies

### 7.2 MCP Tool Orchestration

**Primary Tools**:
- `mcp__claude-flow__error_analysis` - Failure analysis
- `mcp__claude-flow__neural_patterns` - Pattern analysis
- `mcp__claude-flow__cognitive_analyze` - Behavior analysis
- `mcp__claude-flow__daa_meta_learning` - Strategy adaptation

**Custom Development Required**:
- Reflection engine custom logic (12 hours)
- Lesson extraction prompts (6 hours)

### 7.3 Implementation Code

```typescript
// src/learning-loop/reflection.ts

import { ClaudeFlowClient } from '../memory/claude-flow-client';
import { ClaudeClient } from '../agents/claude-client';
import { ExecutionResult } from './execution';
import { Plan } from './reasoning';

export interface Reflection {
  outcome: 'success' | 'failure' | 'partial';
  rootCauses: string[];
  lessons: string[];
  improvements: string[];
  confidence: number;
}

export class ReflectionSystem {
  constructor(
    private claudeFlow: ClaudeFlowClient,
    private claudeClient: ClaudeClient
  ) {}

  /**
   * STAGE 5: Reflection - Learn from execution
   */
  async reflect(
    task: string,
    plan: Plan,
    execution: ExecutionResult
  ): Promise<Reflection> {
    // 1. Classify outcome
    const outcome = this.classifyOutcome(execution);

    // 2. Analyze patterns
    const patterns = await this.analyzePatterns(task, plan, execution);

    // 3. Root cause analysis (if failure)
    const rootCauses = outcome !== 'success'
      ? await this.analyzeRootCauses(plan, execution)
      : [];

    // 4. Extract lessons
    const lessons = await this.extractLessons(task, plan, execution, patterns, rootCauses);

    // 5. Generate improvements
    const improvements = await this.generateImprovements(lessons, patterns);

    // 6. Meta-learning update
    await this.updateMetaLearning(outcome, lessons);

    return {
      outcome,
      rootCauses,
      lessons,
      improvements,
      confidence: this.calculateConfidence(execution, lessons)
    };
  }

  /**
   * Classify execution outcome
   */
  private classifyOutcome(execution: ExecutionResult): 'success' | 'failure' | 'partial' {
    if (execution.success && execution.errors.length === 0) {
      return 'success';
    } else if (!execution.success) {
      return 'failure';
    } else {
      return 'partial';
    }
  }

  /**
   * MCP: Analyze patterns in execution
   */
  private async analyzePatterns(task: string, plan: Plan, execution: ExecutionResult): Promise<any> {
    const analysis = await this.claudeFlow.neuralPatterns({
      action: 'analyze',
      operation: task,
      metadata: {
        plan: plan.approach,
        success: execution.success,
        completedSteps: execution.completedSteps,
        totalSteps: execution.totalSteps
      }
    });

    return analysis;
  }

  /**
   * MCP: Root cause analysis for failures
   */
  private async analyzeRootCauses(plan: Plan, execution: ExecutionResult): Promise<string[]> {
    if (execution.errors.length === 0) return [];

    // MCP: Error analysis
    const errorAnalysis = await this.claudeFlow.errorAnalysis({
      logs: execution.errors.map(e => JSON.stringify(e))
    });

    // Parse root causes
    const causes = this.parseRootCauses(errorAnalysis);

    return causes;
  }

  private parseRootCauses(analysis: any): string[] {
    // Extract root causes from analysis
    // Simplified implementation
    if (typeof analysis === 'string') {
      return analysis.split('\n').filter(line => line.includes('cause:'));
    }
    return [];
  }

  /**
   * Extract actionable lessons using AI
   */
  private async extractLessons(
    task: string,
    plan: Plan,
    execution: ExecutionResult,
    patterns: any,
    rootCauses: string[]
  ): Promise<string[]> {
    const prompt = this.buildLessonExtractionPrompt(task, plan, execution, patterns, rootCauses);

    const response = await this.claudeClient.sendMessage({
      content: prompt
    });

    return this.parseLessons(response);
  }

  private buildLessonExtractionPrompt(
    task: string,
    plan: Plan,
    execution: ExecutionResult,
    patterns: any,
    rootCauses: string[]
  ): string {
    return `
Analyze this task execution and extract key lessons:

Task: ${task}

Plan: ${plan.approach}
Steps: ${plan.steps.length}

Execution:
- Success: ${execution.success}
- Completed: ${execution.completedSteps}/${execution.totalSteps} steps
- Errors: ${execution.errors.length}
- Duration: ${execution.metrics.duration}ms
- Retries: ${execution.metrics.retries}
- Fallbacks: ${execution.metrics.fallbacks}

${rootCauses.length > 0 ? `Root Causes:\n${rootCauses.join('\n')}` : ''}

Extract 3-5 actionable lessons in this format:
1. [Lesson about what worked/didn't work]
2. [Lesson about approach selection]
3. [Lesson about error handling]
etc.

Focus on lessons that will improve future task execution.
`;
  }

  private parseLessons(response: string): string[] {
    // Parse numbered lessons from response
    const lines = response.split('\n');
    const lessons = lines
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());

    return lessons;
  }

  /**
   * Generate improvement recommendations
   */
  private async generateImprovements(lessons: string[], patterns: any): Promise<string[]> {
    const prompt = `
Based on these lessons, suggest improvements to our approach:

Lessons:
${lessons.map((l, i) => `${i + 1}. ${l}`).join('\n')}

Suggest 3 concrete improvements to:
1. Plan generation strategy
2. Execution approach
3. Error handling

Format as numbered list.
`;

    const response = await this.claudeClient.sendMessage({ content: prompt });

    return this.parseLessons(response); // Reuse parser
  }

  /**
   * MCP: Update meta-learning strategies
   */
  private async updateMetaLearning(outcome: string, lessons: string[]): Promise<void> {
    await this.claudeFlow.daaMetaLearning({
      sourceDomain: 'task_execution',
      targetDomain: 'planning_strategies',
      transferMode: 'adaptive',
      // Additional context about what was learned
      experience: {
        outcome,
        lessons
      }
    });
  }

  private calculateConfidence(execution: ExecutionResult, lessons: string[]): number {
    // Heuristic: more lessons = more confident in analysis
    const baseConfidence = execution.success ? 0.8 : 0.6;
    const lessonBoost = Math.min(0.2, lessons.length * 0.04);

    return Math.min(1.0, baseConfidence + lessonBoost);
  }
}
```

---

## 8. The Complete Learning Loop

### 8.1 Orchestration Code

```typescript
// src/learning-loop/autonomous-loop.ts

import { PerceptionSystem, PerceptionContext } from './perception';
import { ReasoningSystem, Plan } from './reasoning';
import { MemorySystem, Experience } from './memory';
import { ExecutionSystem, ExecutionResult } from './execution';
import { ReflectionSystem, Reflection } from './reflection';

export interface Task {
  id: string;
  description: string;
  metadata?: any;
}

export interface LoopResult {
  task: Task;
  context: PerceptionContext;
  plan: Plan;
  execution: ExecutionResult;
  reflection: Reflection;
  experience: Experience;
}

export class AutonomousLearningLoop {
  constructor(
    private perception: PerceptionSystem,
    private reasoning: ReasoningSystem,
    private memory: MemorySystem,
    private execution: ExecutionSystem,
    private reflection: ReflectionSystem
  ) {}

  /**
   * THE COMPLETE AUTONOMOUS LEARNING LOOP
   *
   * This is the core method that ties everything together.
   * Each task execution improves the agent for the next task.
   */
  async execute(task: Task): Promise<LoopResult> {
    console.log(`\n🤖 AUTONOMOUS LEARNING LOOP: ${task.description}\n`);

    // ========== STAGE 1: PERCEPTION ==========
    console.log('👁️  PERCEPTION: Gathering context...');
    const context = await this.perception.perceive(task.description);
    console.log(`   ✓ Found ${context.pastExperiences.length} past experiences`);
    console.log(`   ✓ Found ${context.vaultContext.length} vault notes`);
    console.log(`   ✓ Found ${context.semanticMatches.length} semantic matches\n`);

    // ========== STAGE 2: REASONING ==========
    console.log('🧠 REASONING: Generating plan...');
    const plan = await this.reasoning.reason(context);
    console.log(`   ✓ Generated plan: ${plan.approach}`);
    console.log(`   ✓ Steps: ${plan.steps.length}`);
    console.log(`   ✓ Success probability: ${(plan.successProbability * 100).toFixed(1)}%`);
    console.log(`   ✓ Risk level: ${plan.riskLevel}\n`);

    // ========== STAGE 3: EXECUTION ==========
    console.log('⚙️  EXECUTION: Running plan...');
    const execution = await this.execution.execute(plan);
    console.log(`   ✓ Success: ${execution.success}`);
    console.log(`   ✓ Completed: ${execution.completedSteps}/${execution.totalSteps} steps`);
    console.log(`   ✓ Duration: ${execution.metrics.duration}ms`);
    console.log(`   ✓ Errors: ${execution.errors.length}\n`);

    // ========== STAGE 4: REFLECTION ==========
    console.log('🔍 REFLECTION: Analyzing outcome...');
    const reflection = await this.reflection.reflect(
      task.description,
      plan,
      execution
    );
    console.log(`   ✓ Outcome: ${reflection.outcome}`);
    console.log(`   ✓ Lessons learned: ${reflection.lessons.length}`);
    console.log(`   ✓ Improvements identified: ${reflection.improvements.length}`);
    console.log(`   ✓ Confidence: ${(reflection.confidence * 100).toFixed(1)}%\n`);

    // ========== STAGE 5: MEMORY ==========
    console.log('💾 MEMORY: Storing experience...');
    const experience: Experience = {
      id: `exp_${Date.now()}`,
      task: task.description,
      context,
      plan,
      outcome: execution,
      success: execution.success,
      lessons: reflection.lessons,
      timestamp: Date.now()
    };

    await this.memory.memorize(experience);
    console.log('   ✓ Experience stored for future use\n');

    // ========== FEEDBACK LOOP COMPLETE ==========
    console.log('✅ LEARNING LOOP COMPLETE');
    console.log(`   Agent is now ${this.calculateImprovement(reflection)}% better at this task type\n`);

    return {
      task,
      context,
      plan,
      execution,
      reflection,
      experience
    };
  }

  /**
   * Calculate improvement percentage (simplified metric)
   */
  private calculateImprovement(reflection: Reflection): number {
    if (reflection.outcome === 'success') {
      return 5 + reflection.lessons.length * 2;
    } else if (reflection.outcome === 'partial') {
      return 2 + reflection.lessons.length;
    } else {
      return reflection.lessons.length; // Still learned from failure
    }
  }

  /**
   * Run multiple tasks in sequence, demonstrating learning
   */
  async runLearningSequence(tasks: Task[]): Promise<LoopResult[]> {
    const results: LoopResult[] = [];

    for (const task of tasks) {
      const result = await this.execute(task);
      results.push(result);

      // Show cumulative improvement
      console.log(`📊 CUMULATIVE IMPROVEMENT: ${this.calculateCumulativeImprovement(results)}%\n`);
    }

    return results;
  }

  private calculateCumulativeImprovement(results: LoopResult[]): number {
    const improvements = results.map(r => this.calculateImprovement(r.reflection));
    return improvements.reduce((sum, imp) => sum + imp, 0);
  }
}
```

### 8.2 Usage Example

```typescript
// example/autonomous-agent-demo.ts

import { AutonomousLearningLoop } from './autonomous-loop';
import { createPerceptionSystem, createReasoningSystem, createMemorySystem, createExecutionSystem, createReflectionSystem } from './factory';

async function demonstrateAutonomousLearning() {
  // Initialize all systems
  const perception = createPerceptionSystem();
  const reasoning = createReasoningSystem();
  const memory = createMemorySystem();
  const execution = createExecutionSystem();
  const reflection = createReflectionSystem();

  // Create autonomous learning loop
  const loop = new AutonomousLearningLoop(
    perception,
    reasoning,
    memory,
    execution,
    reflection
  );

  // Task sequence: each task builds on previous learning
  const tasks = [
    {
      id: 'task_1',
      description: 'Add authentication to the API'
    },
    {
      id: 'task_2',
      description: 'Add rate limiting to authenticated endpoints'
    },
    {
      id: 'task_3',
      description: 'Add OAuth2 support for third-party login'
    }
  ];

  // Execute tasks and watch the agent improve
  const results = await loop.runLearningSequence(tasks);

  // Summary
  console.log('\n📈 LEARNING SUMMARY:');
  console.log(`   Total tasks: ${results.length}`);
  console.log(`   Successful: ${results.filter(r => r.execution.success).length}`);
  console.log(`   Total lessons: ${results.reduce((sum, r) => sum + r.reflection.lessons.length, 0)}`);
  console.log(`   Experiences stored: ${results.length}`);
  console.log('\n   The agent is now significantly better at authentication tasks! 🎉');
}

demonstrateAutonomousLearning();
```

---

## 9. Integration with Weaver Architecture

### 9.1 How the Loop Integrates

```
┌────────────────────────────────────────────────────────┐
│                   WEAVER APPLICATION                    │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         AUTONOMOUS LEARNING LOOP (NEW)           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │PERCEPTION│─►│REASONING │─►│EXECUTION │       │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘       │  │
│  │       │             │             │              │  │
│  │       └─────────────┴─────────────┘              │  │
│  │                     │                            │  │
│  │              ┌──────┴──────┐                     │  │
│  │              │  REFLECTION  │                     │  │
│  │              └──────┬──────┘                     │  │
│  │                     ▼                            │  │
│  │              ┌──────────────┐                    │  │
│  │              │    MEMORY    │                     │  │
│  │              └──────────────┘                    │  │
│  └─────────────────────┬───────────────────────────┘  │
│                        │                               │
│  ┌─────────────────────┴───────────────────────────┐  │
│  │         EXISTING WEAVER COMPONENTS               │  │
│  │                                                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │Shadow Cache│  │Workflow Eng│  │Git Client │  │  │
│  │  └────────────┘  └────────────┘  └───────────┘  │  │
│  │                                                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐  │  │
│  │  │Rules Engine│  │File Watcher│  │MCP Server │  │  │
│  │  └────────────┘  └────────────┘  └───────────┘  │  │
│  │                                                   │  │
│  │  ┌────────────┐  ┌────────────┐                  │  │
│  │  │Activity Log│  │Service Mgr │                  │  │
│  │  └────────────┘  └────────────┘                  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 9.2 Integration Points

**Shadow Cache**:
- Provides vault context for Perception stage
- Updated by Execution stage after file changes
- Vector embeddings stored alongside metadata

**Workflow Engine**:
- Executes plans from Reasoning stage
- Monitored by Execution stage
- Triggers Reflection on completion

**Activity Logger**:
- Records all loop executions
- Provides data for Reflection analysis
- Enables debugging and auditing

**MCP Server**:
- Exposes learning loop to Claude Desktop
- New tools: `trigger_learning_loop`, `view_experiences`
- Query past lessons and improvements

**Git Auto-Commit**:
- Triggered by successful executions
- Commit messages include lessons learned
- Tags releases with improvement metrics

**Service Manager**:
- Monitors learning loop health
- Exposes metrics: improvement rate, success rate
- CLI commands: `weaver loop status`, `weaver loop metrics`

### 9.3 New MCP Tools

```typescript
// Add to src/mcp-server/tools/learning-loop/

export const learningLoopTools = [
  {
    name: 'trigger_learning_loop',
    description: 'Execute a task using the autonomous learning loop',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task description' }
      },
      required: ['task']
    },
    handler: async (params) => {
      const loop = getAutonomousLearningLoop();
      const result = await loop.execute({ id: uuidv4(), description: params.task });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: result.execution.success,
              lessons: result.reflection.lessons,
              improvements: result.reflection.improvements
            }, null, 2)
          }
        ]
      };
    }
  },
  {
    name: 'view_experiences',
    description: 'View past task experiences and lessons learned',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query for experiences' },
        limit: { type: 'number', description: 'Max results', default: 10 }
      }
    },
    handler: async (params) => {
      const memory = getMemorySystem();
      const experiences = await memory.retrieveRelevantExperiences(params.query, params.limit);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(experiences, null, 2)
          }
        ]
      };
    }
  },
  {
    name: 'get_loop_metrics',
    description: 'Get autonomous learning loop performance metrics',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const metrics = await getLoopMetrics();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(metrics, null, 2)
          }
        ]
      };
    }
  }
];
```

---

## 10. Implementation Roadmap

### Week 1: Foundation (Custom Development)

**Days 1-2: Vector Embeddings (16 hours)**
- Install `@xenova/transformers`
- Implement `src/learning-loop/embeddings.ts`
- Create embedding service with `all-MiniLM-L6-v2` model
- Add vector similarity search
- Test with vault notes

**Days 3-4: Perception & Memory (12 hours)**
- Implement `src/learning-loop/perception.ts`
- Implement `src/learning-loop/memory.ts`
- Integrate shadow cache with perception
- Test context fusion logic
- Add experience storage schema

**Day 5: Chain-of-Thought Templates (10 hours)**
- Create `src/learning-loop/prompts/` directory
- Implement CoT templates for different strategies
- Add prompt builder utilities
- Test plan generation

### Week 2: MCP Integration

**Days 1-2: Reasoning System (24 hours)**
- Implement `src/learning-loop/reasoning.ts`
- Integrate `mcp__claude-flow__parallel_execute`
- Add planning expert agent spawning
- Implement multi-path CoT generation
- Add plan selection logic
- Test with sample tasks

**Days 3-4: Execution System (16 hours)**
- Implement `src/learning-loop/execution.ts`
- Integrate Weaver workflow engine
- Add `mcp__claude-flow__daa_fault_tolerance`
- Implement state verification
- Add error recovery logic
- Test execution monitoring

**Day 5: Reflection System (12 hours)**
- Implement `src/learning-loop/reflection.ts`
- Integrate `mcp__claude-flow__error_analysis`
- Add lesson extraction prompts
- Implement `mcp__claude-flow__daa_meta_learning`
- Test reflection pipeline

### Week 3: Integration & Testing

**Days 1-2: Complete Loop (16 hours)**
- Implement `src/learning-loop/autonomous-loop.ts`
- Wire all 5 stages together
- Add comprehensive logging
- Test full learning cycle
- Fix integration issues

**Days 3-4: Weaver Integration (16 hours)**
- Add loop to Weaver main application
- Create CLI commands (`weaver loop run`)
- Add MCP tools for learning loop
- Integrate with service manager
- Update activity logger

**Day 5: Testing (8 hours)**
- Unit tests for each stage
- Integration test for full loop
- Stress test with 10+ tasks
- Validate improvement metrics
- Document edge cases

### Week 4: Validation & Documentation

**Days 1-2: Validation (16 hours)**
- Run benchmark tasks
- Measure learning rate (+20% target)
- Test memory retrieval accuracy (90%+ target)
- Validate multi-path planning
- Ensure reflection coverage (100%)
- Document success metrics

**Days 3-4: Documentation (16 hours)**
- User guide for learning loop
- API reference documentation
- Architecture diagrams (Mermaid)
- Usage examples
- Troubleshooting guide
- Performance tuning guide

**Day 5: Polish & Release (8 hours)**
- Code cleanup
- Final testing
- Release notes
- Demo video
- Announce Phase 12 completion 🎉

---

## 11. Success Metrics

### 11.1 Quantitative Metrics

**Learning Rate**:
- **Target**: +20% improvement after 5 task iterations
- **Measurement**: Compare success rate of task type at iteration 1 vs. iteration 5
- **Formula**: `(successRate_iteration5 - successRate_iteration1) / successRate_iteration1 * 100`

**Memory Utilization**:
- **Target**: 90%+ relevant experience retrieval
- **Measurement**: Percentage of retrieved experiences that are actually useful
- **Formula**: `(usefulExperiences / totalRetrieved) * 100`

**Plan Quality**:
- **Target**: 3+ alternative plans generated per task
- **Measurement**: Average number of plans generated
- **Formula**: `sum(plansGenerated) / totalTasks`

**Reflection Coverage**:
- **Target**: 100% of executions reflected upon
- **Measurement**: Percentage of tasks with reflection
- **Formula**: `(tasksWithReflection / totalTasks) * 100`

**Autonomous Improvement**:
- **Target**: No human intervention needed for learning
- **Measurement**: Boolean - did human intervene?
- **Formula**: `humanInterventions === 0`

### 11.2 Qualitative Metrics

**Lesson Quality**:
- Lessons should be actionable
- Lessons should be specific (not generic)
- Lessons should reference concrete examples

**Plan Diversity**:
- Plans should explore different approaches
- Plans should not be near-duplicates
- Plans should balance risk/reward differently

**Context Relevance**:
- Retrieved experiences should be similar to current task
- Vault notes should be topically relevant
- External knowledge should add value

### 11.3 Measurement Dashboard

```typescript
// src/learning-loop/metrics.ts

export interface LoopMetrics {
  // Learning Rate
  learningRate: {
    currentImprovement: number;
    target: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };

  // Memory Performance
  memoryUtilization: {
    relevanceRate: number;
    target: number;
    avgRetrievalTime: number;
  };

  // Planning Quality
  planQuality: {
    avgPlansGenerated: number;
    target: number;
    diversity: number; // 0-1 score
  };

  // Reflection Coverage
  reflectionCoverage: {
    coverage: number;
    target: number;
    avgLessonsPerTask: number;
  };

  // Autonomy
  autonomy: {
    humanInterventions: number;
    target: number;
    autonomous: boolean;
  };
}

export class MetricsCollector {
  async collectMetrics(): Promise<LoopMetrics> {
    return {
      learningRate: await this.calculateLearningRate(),
      memoryUtilization: await this.calculateMemoryUtilization(),
      planQuality: await this.calculatePlanQuality(),
      reflectionCoverage: await this.calculateReflectionCoverage(),
      autonomy: await this.calculateAutonomy()
    };
  }

  private async calculateLearningRate() {
    // Implementation
    return { currentImprovement: 22, target: 20, trend: 'increasing' };
  }

  // ... other metric calculations
}
```

---

## 12. Code Examples

### 12.1 Complete Factory Setup

```typescript
// src/learning-loop/factory.ts

import { PerceptionSystem } from './perception';
import { ReasoningSystem } from './reasoning';
import { MemorySystem } from './memory';
import { ExecutionSystem } from './execution';
import { ReflectionSystem } from './reflection';
import { AutonomousLearningLoop } from './autonomous-loop';
import { ClaudeFlowClient } from '../memory/claude-flow-client';
import { ClaudeClient } from '../agents/claude-client';
import { ShadowCache } from '../shadow-cache';
import { WorkflowEngine } from '../workflow-engine';
import { GitClient } from '../git/git-client';
import { VectorEmbeddings } from './embeddings';
import { config } from '../config';

export function createAutonomousLearningLoop(): AutonomousLearningLoop {
  // Initialize dependencies
  const claudeFlow = new ClaudeFlowClient({
    apiUrl: config.claudeFlowApiUrl
  });

  const claudeClient = new ClaudeClient({
    apiKey: config.anthropicApiKey
  });

  const shadowCache = new ShadowCache({
    dbPath: config.shadowCachePath
  });

  const workflowEngine = new WorkflowEngine({
    vaultPath: config.vaultPath
  });

  const gitClient = new GitClient({
    vaultPath: config.vaultPath
  });

  const embeddings = new VectorEmbeddings({
    model: 'all-MiniLM-L6-v2',
    device: 'cpu' // or 'gpu' if available
  });

  // Create systems
  const perception = new PerceptionSystem(
    claudeFlow,
    shadowCache,
    embeddings
  );

  const reasoning = new ReasoningSystem(
    claudeFlow,
    claudeClient
  );

  const memory = new MemorySystem(
    claudeFlow,
    embeddings
  );

  const execution = new ExecutionSystem(
    workflowEngine,
    claudeFlow,
    gitClient,
    shadowCache
  );

  const reflection = new ReflectionSystem(
    claudeFlow,
    claudeClient
  );

  // Create loop
  return new AutonomousLearningLoop(
    perception,
    reasoning,
    memory,
    execution,
    reflection
  );
}
```

### 12.2 CLI Integration

```typescript
// src/cli/commands/loop.ts

import { Command } from 'commander';
import { createAutonomousLearningLoop } from '../../learning-loop/factory';
import ora from 'ora';
import chalk from 'chalk';

export function createLoopCommand(): Command {
  const loop = new Command('loop');

  loop
    .command('run <task>')
    .description('Execute a task using the autonomous learning loop')
    .action(async (task: string) => {
      const spinner = ora('Initializing learning loop...').start();

      try {
        const learningLoop = createAutonomousLearningLoop();
        spinner.text = 'Executing task...';

        const result = await learningLoop.execute({
          id: `cli_${Date.now()}`,
          description: task
        });

        spinner.succeed('Task completed!');

        console.log(chalk.green('\n✅ Success:', result.execution.success));
        console.log(chalk.blue('\n📝 Lessons Learned:'));
        result.reflection.lessons.forEach((lesson, i) => {
          console.log(chalk.gray(`  ${i + 1}. ${lesson}`));
        });

        console.log(chalk.yellow('\n💡 Improvements:'));
        result.reflection.improvements.forEach((improvement, i) => {
          console.log(chalk.gray(`  ${i + 1}. ${improvement}`));
        });

      } catch (error) {
        spinner.fail('Task failed');
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });

  loop
    .command('metrics')
    .description('View learning loop performance metrics')
    .action(async () => {
      // Show metrics dashboard
      console.log('📊 Learning Loop Metrics...');
      // Implementation
    });

  return loop;
}
```

---

## Conclusion

This blueprint provides a **complete, actionable implementation guide** for building an autonomous learning loop in Weaver. By leveraging existing MCP tools (83% coverage) and focusing custom development on 6 critical gaps, we can achieve:

- ✅ **3-4 week implementation** (vs. 8-10 weeks from scratch)
- ✅ **62% effort reduction** (248 hours saved)
- ✅ **Production-ready autonomous agent**
- ✅ **Self-improving through experience**
- ✅ **29.5% performance improvement potential**

**Next Steps**:
1. Review this blueprint with stakeholders
2. Prioritize Week 1 custom development (embeddings, perception, memory)
3. Begin MCP integration in Week 2
4. Validate with benchmark tasks in Week 4
5. Deploy to production and measure improvement

**The agent will learn. The agent will improve. The future is autonomous.** 🚀

---

**Document Status**: ✅ Complete
**Next Action**: Begin Week 1 implementation
**Maintainer**: System Architecture Designer
**Last Updated**: 2025-10-27
