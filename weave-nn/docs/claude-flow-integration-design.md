---
title: Claude-Flow Integration Architecture Design
type: architecture
status: in-progress
created_date: {}
updated_date: '2025-10-28'
tags:
  - claude-flow
  - integration-architecture
  - mcp-tools
  - orchestration
  - swarm-coordination
category: technical
domain: weaver
scope: module
audience:
  - developers
  - architects
related_concepts:
  - claude-flow
  - mcp-integration
  - swarm-orchestration
  - workflow-automation
  - agent-coordination
related_files:
  - WEAVER-COMPLETE-IMPLEMENTATION-GUIDE.md
  - phase-12-mcp-tools-audit.md
  - PHASE-12-LEARNING-LOOP-BLUEPRINT.md
  - weaver-cli-integration-audit.md
author: ai-generated
version: 1.0.0
priority: high
visual:
  icon: "\U0001F3D7️"
  color: '#F59E0B'
  cssclasses:
    - type-architecture
    - status-in-progress
    - priority-high
    - domain-weaver
---

# Claude-Flow Integration Architecture Design

**Version**: 1.0.0
**Author**: System Architect
**Date**: 2025-10-27
**Status**: Design Phase

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Module Structure](#module-structure)
4. [Interface Definitions](#interface-definitions)
5. [Command Coverage](#command-coverage)
6. [Integration Points](#integration-points)
7. [Error Handling Strategy](#error-handling-strategy)
8. [Configuration Management](#configuration-management)
9. [Testing Strategy](#testing-strategy)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

This design document outlines the architecture for integrating claude-flow CLI capabilities into Weaver as a first-class orchestration tool. The integration provides type-safe, production-ready wrappers around all claude-flow commands with comprehensive error handling, retry logic, and deep integration with Weaver's learning loop, SOPs, and workflow engine.

### Key Design Goals
- **Type Safety**: Full TypeScript support with validated interfaces
- **Reliability**: Robust error handling and retry mechanisms
- **Performance**: Efficient command execution with proper timeouts
- **Observability**: Comprehensive logging and telemetry
- **Extensibility**: Easy to add new claude-flow features
- **Graceful Degradation**: Function without claude-flow when appropriate

---

## Architecture Overview

### System Context Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Weaver Ecosystem                           │
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Learning Loop  │  │  SOP Executor  │  │ Workflow Engine│ │
│  │  (Perception,  │  │  (Standard     │  │ (Event-driven  │ │
│  │   Reasoning,   │  │   Operating    │  │   automation)  │ │
│  │   Execution,   │  │   Procedures)  │  │                │ │
│  │   Reflection)  │  │                │  │                │ │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘ │
│          │                   │                    │          │
│          └───────────────────┼────────────────────┘          │
│                              ↓                                │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│  ┃      Claude-Flow Integration Module                    ┃ │
│  ┃                                                         ┃ │
│  ┃  ┌─────────────────────────────────────────────────┐  ┃ │
│  ┃  │           CLI Command Orchestrator              │  ┃ │
│  ┃  │  (Coordination layer for all CLI operations)    │  ┃ │
│  ┃  └────────┬──────────────────────────┬─────────────┘  ┃ │
│  ┃           │                          │                 ┃ │
│  ┃  ┌────────▼──────────┐    ┌─────────▼────────────┐   ┃ │
│  ┃  │  Command Builder  │    │   Result Processor   │   ┃ │
│  ┃  │  - Type-safe API  │    │   - JSON parser      │   ┃ │
│  ┃  │  - Validation     │    │   - Error extraction │   ┃ │
│  ┃  │  - Serialization  │    │   - Type conversion  │   ┃ │
│  ┃  └────────┬──────────┘    └─────────▲────────────┘   ┃ │
│  ┃           │                          │                 ┃ │
│  ┃  ┌────────▼──────────────────────────┴────────────┐   ┃ │
│  ┃  │           CLI Executor (execa wrapper)         │   ┃ │
│  ┃  │  - Process spawning                            │   ┃ │
│  ┃  │  - Stream handling                             │   ┃ │
│  ┃  │  - Timeout management                          │   ┃ │
│  ┃  └────────┬───────────────────────────────────────┘   ┃ │
│  ┃           │                                            ┃ │
│  ┃  ┌────────▼───────────┐    ┌──────────────────────┐  ┃ │
│  ┃  │   Error Handler    │    │  Retry Manager       │  ┃ │
│  ┃  │   - Classification │    │  - Exponential back  │  ┃ │
│  ┃  │   - Recovery logic │    │  - Circuit breaker   │  ┃ │
│  ┃  │   - Telemetry      │    │  - Idempotency check │  ┃ │
│  ┃  └────────────────────┘    └──────────────────────┘  ┃ │
│  ┃                                                         ┃ │
│  ┃  ┌─────────────────────────────────────────────────┐  ┃ │
│  ┃  │        Configuration & Installation Manager     │  ┃ │
│  ┃  │  - Auto-detection (npx vs global)               │  ┃ │
│  ┃  │  - Version management                           │  ┃ │
│  ┃  │  - Health checks                                │  ┃ │
│  ┃  └─────────────────────────────────────────────────┘  ┃ │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                              ↓                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Observability & Logging Layer                 │  │
│  │  - Structured logs (via Weaver's logger)              │  │
│  │  - Metrics (execution time, success/failure rates)    │  │
│  │  - Tracing (command lifecycle tracking)               │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│              Claude-Flow CLI (External Process)               │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Swarm   │  │  Agent   │  │   Task   │  │  Memory  │    │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Hooks   │  │  Neural  │  │  GitHub  │  │   DAA    │    │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
┌─────────────┐
│   Weaver    │
│ Application │
└──────┬──────┘
       │ 1. Call orchestrateTask()
       ↓
┌──────────────────────────────────┐
│  ClaudeFlowOrchestrator          │
│  - Validates request              │
│  - Maps to CLI command            │
└──────┬───────────────────────────┘
       │ 2. Build command
       ↓
┌──────────────────────────────────┐
│  CommandBuilder                   │
│  - Type validation                │
│  - Argument serialization         │
│  - Returns CommandSpec            │
└──────┬───────────────────────────┘
       │ 3. Execute command
       ↓
┌──────────────────────────────────┐
│  CLIExecutor                      │
│  - Spawns process (execa)         │
│  - Captures stdout/stderr         │
│  - Monitors timeout               │
└──────┬───────────────────────────┘
       │ 4a. Success path
       ↓
┌──────────────────────────────────┐
│  ResultProcessor                  │
│  - Parses JSON/JSONL output       │
│  - Validates result schema        │
│  - Returns typed result           │
└──────┬───────────────────────────┘
       │
       │ 4b. Error path
       ↓
┌──────────────────────────────────┐
│  ErrorHandler                     │
│  - Classifies error type          │
│  - Determines retry eligibility   │
└──────┬───────────────────────────┘
       │ 5. Retry decision
       ↓
┌──────────────────────────────────┐
│  RetryManager                     │
│  - Exponential backoff            │
│  - Circuit breaker check          │
│  - Re-execute via CLIExecutor     │
└──────┬───────────────────────────┘
       │ 6. Final result
       ↓
┌──────────────────────────────────┐
│  Logging & Telemetry              │
│  - Log structured event           │
│  - Record metrics                 │
│  - Update health status           │
└──────┬───────────────────────────┘
       │ 7. Return to caller
       ↓
┌─────────────┐
│   Weaver    │
│ Application │
└─────────────┘
```

---

## Module Structure

### Directory Layout

```
/home/aepod/dev/weave-nn/weaver/src/claude-flow/
├── index.ts                          # Public API exports
├── orchestrator.ts                   # Main orchestration layer
├── core/
│   ├── cli-executor.ts              # Process execution via execa
│   ├── command-builder.ts           # Command construction
│   ├── result-processor.ts          # Output parsing
│   ├── error-handler.ts             # Error classification & recovery
│   └── retry-manager.ts             # Retry logic & circuit breaker
├── commands/
│   ├── swarm.ts                     # Swarm commands (init, status, etc.)
│   ├── agent.ts                     # Agent commands (spawn, list, metrics)
│   ├── task.ts                      # Task commands (orchestrate, status)
│   ├── memory.ts                    # Memory commands (store, retrieve, search)
│   ├── hooks.ts                     # Hooks commands (pre-task, post-task)
│   ├── neural.ts                    # Neural commands (train, patterns)
│   ├── github.ts                    # GitHub integration commands
│   └── daa.ts                       # DAA commands
├── types/
│   ├── commands.ts                  # Command type definitions
│   ├── results.ts                   # Result type definitions
│   ├── config.ts                    # Configuration types
│   └── errors.ts                    # Error type definitions
├── config/
│   ├── installation-manager.ts      # Detect & manage claude-flow installation
│   ├── defaults.ts                  # Default configuration values
│   └── validator.ts                 # Configuration validation
├── integrations/
│   ├── learning-loop.ts             # Learning loop integration
│   ├── sop-executor.ts              # SOP integration
│   ├── workflow-engine.ts           # Workflow integration
│   └── service-manager.ts           # Service manager integration
├── utils/
│   ├── logger.ts                    # Logging utilities
│   ├── version-check.ts             # Version compatibility checks
│   └── stream-parser.ts             # JSONL stream parsing
└── __tests__/
    ├── unit/
    │   ├── cli-executor.test.ts
    │   ├── command-builder.test.ts
    │   ├── result-processor.test.ts
    │   ├── error-handler.test.ts
    │   └── retry-manager.test.ts
    ├── integration/
    │   ├── swarm-commands.test.ts
    │   ├── agent-commands.test.ts
    │   ├── task-commands.test.ts
    │   └── memory-commands.test.ts
    └── fixtures/
        ├── mock-outputs.ts
        └── mock-errors.ts
```

---

## Interface Definitions

### Core Types

```typescript
// types/commands.ts

/**
 * Base command specification
 */
export interface CommandSpec {
  command: string;
  args: string[];
  options: CommandOptions;
  metadata?: CommandMetadata;
}

export interface CommandOptions {
  /** Execution timeout in milliseconds */
  timeout?: number;
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Capture stdout */
  captureStdout?: boolean;
  /** Capture stderr */
  captureStderr?: boolean;
  /** Stream output line-by-line */
  stream?: boolean;
  /** Retry configuration */
  retry?: RetryConfig;
}

export interface CommandMetadata {
  /** Command category (swarm, agent, task, etc.) */
  category: CommandCategory;
  /** Unique identifier for tracking */
  id: string;
  /** Timestamp when command was created */
  createdAt: Date;
  /** Correlation ID for distributed tracing */
  correlationId?: string;
}

export type CommandCategory =
  | 'swarm'
  | 'agent'
  | 'task'
  | 'memory'
  | 'hooks'
  | 'neural'
  | 'github'
  | 'daa';

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Maximum delay cap in milliseconds */
  maxDelay: number;
  /** Error types that should trigger retry */
  retryableErrors: ErrorType[];
  /** Idempotency key for safe retries */
  idempotencyKey?: string;
}

// types/results.ts

/**
 * Command execution result
 */
export interface CommandResult<T = unknown> {
  /** Success status */
  success: boolean;
  /** Parsed data (if successful) */
  data?: T;
  /** Error information (if failed) */
  error?: CommandError;
  /** Execution metadata */
  metadata: ResultMetadata;
}

export interface ResultMetadata {
  /** Command that was executed */
  command: string;
  /** Exit code */
  exitCode: number;
  /** Execution duration in milliseconds */
  duration: number;
  /** Number of retry attempts */
  attempts: number;
  /** Raw stdout */
  stdout?: string;
  /** Raw stderr */
  stderr?: string;
  /** Timestamp when command completed */
  completedAt: Date;
}

// types/errors.ts

/**
 * Claude-Flow specific error
 */
export class ClaudeFlowError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType,
    public readonly code: string,
    public readonly retryable: boolean,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ClaudeFlowError';
  }
}

export type ErrorType =
  | 'INSTALLATION_NOT_FOUND'
  | 'VERSION_INCOMPATIBLE'
  | 'COMMAND_TIMEOUT'
  | 'COMMAND_FAILED'
  | 'INVALID_ARGUMENTS'
  | 'PARSING_ERROR'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'RESOURCE_EXHAUSTED'
  | 'CIRCUIT_BREAKER_OPEN'
  | 'UNKNOWN';

export interface CommandError {
  type: ErrorType;
  code: string;
  message: string;
  retryable: boolean;
  cause?: Error;
  context?: Record<string, unknown>;
}

// types/config.ts

/**
 * Claude-Flow integration configuration
 */
export interface ClaudeFlowConfig {
  /** Installation detection */
  installation: InstallationConfig;
  /** Default command options */
  defaults: DefaultCommandOptions;
  /** Retry behavior */
  retry: GlobalRetryConfig;
  /** Logging configuration */
  logging: LoggingConfig;
  /** Feature flags */
  features: FeatureFlags;
}

export interface InstallationConfig {
  /** Prefer global installation over npx */
  preferGlobal: boolean;
  /** Path to global installation (auto-detected if not provided) */
  globalPath?: string;
  /** NPX package specifier */
  npxPackage: string;
  /** Minimum required version */
  minVersion: string;
  /** Health check interval in milliseconds */
  healthCheckInterval: number;
}

export interface DefaultCommandOptions {
  /** Default timeout for all commands */
  timeout: number;
  /** Default working directory */
  cwd?: string;
  /** Default environment variables */
  env?: Record<string, string>;
}

export interface GlobalRetryConfig {
  /** Enable retry globally */
  enabled: boolean;
  /** Default max attempts */
  maxAttempts: number;
  /** Default initial delay */
  initialDelay: number;
  /** Default backoff multiplier */
  backoffMultiplier: number;
  /** Circuit breaker configuration */
  circuitBreaker: CircuitBreakerConfig;
}

export interface CircuitBreakerConfig {
  /** Enable circuit breaker */
  enabled: boolean;
  /** Failure threshold to open circuit */
  failureThreshold: number;
  /** Success threshold to close circuit */
  successThreshold: number;
  /** Timeout before attempting to close circuit */
  timeout: number;
}

export interface LoggingConfig {
  /** Log level (debug, info, warn, error) */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log command execution */
  logCommands: boolean;
  /** Log command results */
  logResults: boolean;
  /** Log errors */
  logErrors: boolean;
  /** Pretty print JSON output */
  prettyPrint: boolean;
}

export interface FeatureFlags {
  /** Enable streaming output */
  streamingOutput: boolean;
  /** Enable telemetry */
  telemetry: boolean;
  /** Enable distributed tracing */
  tracing: boolean;
  /** Enable graceful degradation */
  gracefulDegradation: boolean;
}
```

### Command-Specific Types

```typescript
// commands/swarm.ts

export interface SwarmInitOptions {
  topology: 'hierarchical' | 'mesh' | 'ring' | 'star';
  maxAgents?: number;
  strategy?: 'balanced' | 'specialized' | 'adaptive';
}

export interface SwarmInitResult {
  swarmId: string;
  topology: string;
  maxAgents: number;
  createdAt: string;
}

export interface SwarmStatusResult {
  swarmId: string;
  status: 'active' | 'idle' | 'error';
  agents: AgentSummary[];
  metrics: SwarmMetrics;
}

export interface SwarmMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgTaskDuration: number;
}

// commands/agent.ts

export interface AgentSpawnOptions {
  type: AgentType;
  name?: string;
  capabilities?: string[];
  swarmId?: string;
}

export type AgentType =
  | 'researcher'
  | 'coder'
  | 'tester'
  | 'reviewer'
  | 'planner'
  | 'system-architect'
  | 'code-analyzer'
  | 'performance-benchmarker';

export interface AgentSpawnResult {
  agentId: string;
  type: AgentType;
  name: string;
  capabilities: string[];
  status: 'active' | 'idle';
  createdAt: string;
}

export interface AgentMetricsResult {
  agentId: string;
  metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    avgExecutionTime: number;
    successRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// commands/task.ts

export interface TaskOrchestrateOptions {
  task: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  strategy?: 'parallel' | 'sequential' | 'adaptive';
  dependencies?: string[];
  maxAgents?: number;
  swarmId?: string;
}

export interface TaskOrchestrateResult {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedAgents: string[];
  createdAt: string;
  estimatedDuration?: number;
}

export interface TaskStatusResult {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  assignedAgents: string[];
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
}

// commands/memory.ts

export interface MemoryStoreOptions {
  key: string;
  value: string | Record<string, unknown>;
  namespace?: string;
  ttl?: number;
}

export interface MemoryRetrieveOptions {
  key: string;
  namespace?: string;
}

export interface MemorySearchOptions {
  pattern: string;
  namespace?: string;
  limit?: number;
}

export interface MemoryResult {
  key: string;
  value: unknown;
  namespace: string;
  createdAt: string;
  expiresAt?: string;
}

// commands/hooks.ts

export interface HookPreTaskOptions {
  description: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface HookPostTaskOptions {
  taskId: string;
  success: boolean;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface HookNotifyOptions {
  message: string;
  level?: 'info' | 'warn' | 'error';
  channel?: string;
}

export interface HookResult {
  hookId: string;
  executed: boolean;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
```

---

## Command Coverage

### Complete Command Matrix

| Category | Command | Priority | Complexity | Notes |
|----------|---------|----------|------------|-------|
| **Swarm** | `swarm init` | P0 | Medium | Core orchestration setup |
| | `swarm status` | P0 | Low | Essential monitoring |
| | `swarm scale` | P1 | Medium | Dynamic scaling |
| | `swarm destroy` | P1 | Low | Cleanup |
| | `swarm monitor` | P2 | Medium | Real-time monitoring |
| **Agent** | `agent spawn` | P0 | Medium | Core agent creation |
| | `agent list` | P0 | Low | Essential visibility |
| | `agent metrics` | P1 | Low | Performance tracking |
| | `agent terminate` | P1 | Low | Lifecycle management |
| **Task** | `task orchestrate` | P0 | High | Core task execution |
| | `task status` | P0 | Low | Essential tracking |
| | `task results` | P0 | Medium | Result retrieval |
| | `task cancel` | P1 | Low | Task control |
| **Memory** | `memory store` | P0 | Low | Essential persistence |
| | `memory retrieve` | P0 | Low | Essential retrieval |
| | `memory search` | P1 | Medium | Advanced queries |
| | `memory list` | P1 | Low | Discovery |
| | `memory delete` | P2 | Low | Cleanup |
| **Hooks** | `hooks pre-task` | P0 | Low | Lifecycle integration |
| | `hooks post-task` | P0 | Low | Lifecycle integration |
| | `hooks post-edit` | P1 | Low | File tracking |
| | `hooks notify` | P1 | Low | Event notifications |
| | `hooks session-restore` | P1 | Medium | State restoration |
| | `hooks session-end` | P1 | Low | Session cleanup |
| **Neural** | `neural status` | P2 | Low | ML monitoring |
| | `neural train` | P2 | High | ML training |
| | `neural patterns` | P2 | Medium | Pattern analysis |
| **GitHub** | `github repo analyze` | P2 | High | Repository analysis |
| | `github pr manage` | P2 | Medium | PR automation |
| **DAA** | `daa agent create` | P2 | High | Autonomous agents |
| | `daa capability match` | P2 | Medium | Capability routing |

**Priority Levels:**
- **P0**: Must-have for MVP (core functionality)
- **P1**: Important for production use
- **P2**: Nice-to-have / advanced features

### Command Implementation Template

```typescript
// Example: commands/swarm.ts

import { CommandSpec, CommandResult } from '../types';
import { CommandBuilder } from '../core/command-builder';
import { CLIExecutor } from '../core/cli-executor';
import { ResultProcessor } from '../core/result-processor';

export class SwarmCommands {
  constructor(
    private readonly commandBuilder: CommandBuilder,
    private readonly executor: CLIExecutor,
    private readonly resultProcessor: ResultProcessor
  ) {}

  /**
   * Initialize a new swarm with specified topology
   */
  async init(options: SwarmInitOptions): Promise<CommandResult<SwarmInitResult>> {
    const spec: CommandSpec = this.commandBuilder.build('swarm', 'init', {
      '--topology': options.topology,
      '--max-agents': options.maxAgents,
      '--strategy': options.strategy,
    });

    const executionResult = await this.executor.execute(spec);

    return this.resultProcessor.process<SwarmInitResult>(
      executionResult,
      SwarmInitResultSchema
    );
  }

  /**
   * Get current swarm status
   */
  async status(swarmId?: string): Promise<CommandResult<SwarmStatusResult>> {
    const spec: CommandSpec = this.commandBuilder.build('swarm', 'status', {
      '--swarm-id': swarmId,
    });

    const executionResult = await this.executor.execute(spec);

    return this.resultProcessor.process<SwarmStatusResult>(
      executionResult,
      SwarmStatusResultSchema
    );
  }

  // ... additional swarm commands
}
```

---

## Integration Points

### 1. Learning Loop Integration

The learning loop (Perception → Reasoning → Execution → Reflection) integrates with claude-flow for advanced AI-driven task orchestration.

```typescript
// integrations/learning-loop.ts

import { ClaudeFlowOrchestrator } from '../orchestrator';
import { TaskOrchestrateOptions, MemoryStoreOptions } from '../types';

export class LearningLoopIntegration {
  constructor(private readonly orchestrator: ClaudeFlowOrchestrator) {}

  /**
   * Perception Phase: Gather information via research agents
   */
  async perceive(context: string): Promise<PerceptionResult> {
    // Spawn research agent
    const agentResult = await this.orchestrator.agent.spawn({
      type: 'researcher',
      name: 'perception-agent',
    });

    // Orchestrate perception task
    const taskResult = await this.orchestrator.task.orchestrate({
      task: `Analyze context: ${context}`,
      priority: 'high',
      strategy: 'adaptive',
    });

    // Store perception results in memory
    await this.orchestrator.memory.store({
      key: `perception/${taskResult.data?.taskId}`,
      value: taskResult.data?.result,
      namespace: 'learning-loop',
    });

    return {
      insights: taskResult.data?.result,
      agentId: agentResult.data?.agentId,
      taskId: taskResult.data?.taskId,
    };
  }

  /**
   * Reasoning Phase: Analyze and plan via analyzer agents
   */
  async reason(perceptionTaskId: string): Promise<ReasoningResult> {
    // Retrieve perception results
    const perceptionData = await this.orchestrator.memory.retrieve({
      key: `perception/${perceptionTaskId}`,
      namespace: 'learning-loop',
    });

    // Spawn code analyzer agent
    const agentResult = await this.orchestrator.agent.spawn({
      type: 'code-analyzer',
      name: 'reasoning-agent',
    });

    // Orchestrate reasoning task
    const taskResult = await this.orchestrator.task.orchestrate({
      task: `Generate plan based on: ${JSON.stringify(perceptionData.data?.value)}`,
      priority: 'high',
      strategy: 'sequential',
    });

    // Store reasoning plan
    await this.orchestrator.memory.store({
      key: `reasoning/${taskResult.data?.taskId}`,
      value: taskResult.data?.result,
      namespace: 'learning-loop',
    });

    return {
      plan: taskResult.data?.result,
      agentId: agentResult.data?.agentId,
      taskId: taskResult.data?.taskId,
    };
  }

  /**
   * Execution Phase: Execute plan via coder agents
   */
  async execute(reasoningTaskId: string): Promise<ExecutionResult> {
    // Retrieve reasoning plan
    const planData = await this.orchestrator.memory.retrieve({
      key: `reasoning/${reasoningTaskId}`,
      namespace: 'learning-loop',
    });

    // Pre-task hook
    await this.orchestrator.hooks.preTask({
      description: `Execute plan: ${reasoningTaskId}`,
      metadata: { phase: 'execution', planId: reasoningTaskId },
    });

    // Spawn coder agent
    const agentResult = await this.orchestrator.agent.spawn({
      type: 'coder',
      name: 'execution-agent',
    });

    // Orchestrate execution
    const taskResult = await this.orchestrator.task.orchestrate({
      task: `Implement: ${JSON.stringify(planData.data?.value)}`,
      priority: 'critical',
      strategy: 'parallel',
    });

    // Post-task hook
    await this.orchestrator.hooks.postTask({
      taskId: taskResult.data?.taskId || '',
      success: taskResult.success,
      result: taskResult.data?.result,
    });

    // Store execution results
    await this.orchestrator.memory.store({
      key: `execution/${taskResult.data?.taskId}`,
      value: taskResult.data?.result,
      namespace: 'learning-loop',
    });

    return {
      output: taskResult.data?.result,
      agentId: agentResult.data?.agentId,
      taskId: taskResult.data?.taskId,
    };
  }

  /**
   * Reflection Phase: Evaluate results via reviewer agents
   */
  async reflect(executionTaskId: string): Promise<ReflectionResult> {
    // Retrieve execution results
    const executionData = await this.orchestrator.memory.retrieve({
      key: `execution/${executionTaskId}`,
      namespace: 'learning-loop',
    });

    // Spawn reviewer agent
    const agentResult = await this.orchestrator.agent.spawn({
      type: 'reviewer',
      name: 'reflection-agent',
    });

    // Orchestrate reflection task
    const taskResult = await this.orchestrator.task.orchestrate({
      task: `Review and provide feedback: ${JSON.stringify(executionData.data?.value)}`,
      priority: 'high',
      strategy: 'adaptive',
    });

    // Store reflection insights
    await this.orchestrator.memory.store({
      key: `reflection/${taskResult.data?.taskId}`,
      value: taskResult.data?.result,
      namespace: 'learning-loop',
    });

    return {
      feedback: taskResult.data?.result,
      agentId: agentResult.data?.agentId,
      taskId: taskResult.data?.taskId,
    };
  }

  /**
   * Full learning loop execution
   */
  async runLoop(initialContext: string): Promise<LearningLoopResult> {
    const perception = await this.perceive(initialContext);
    const reasoning = await this.reason(perception.taskId);
    const execution = await this.execute(reasoning.taskId);
    const reflection = await this.reflect(execution.taskId);

    return {
      phases: { perception, reasoning, execution, reflection },
      completed: true,
      timestamp: new Date(),
    };
  }
}
```

### 2. SOP Executor Integration

Standard Operating Procedures can leverage claude-flow for consistent, repeatable workflows.

```typescript
// integrations/sop-executor.ts

import { ClaudeFlowOrchestrator } from '../orchestrator';
import { HookPreTaskOptions, HookPostTaskOptions } from '../types';

export class SOPExecutorIntegration {
  constructor(private readonly orchestrator: ClaudeFlowOrchestrator) {}

  /**
   * Execute SOP with claude-flow orchestration
   */
  async executeSOP(sopId: string, sopSteps: SOPStep[]): Promise<SOPResult> {
    const sessionId = `sop-${sopId}-${Date.now()}`;
    const results: StepResult[] = [];

    // Initialize swarm for SOP execution
    const swarmResult = await this.orchestrator.swarm.init({
      topology: 'hierarchical',
      maxAgents: sopSteps.length,
      strategy: 'specialized',
    });

    try {
      for (const [index, step] of sopSteps.entries()) {
        // Pre-task hook
        await this.orchestrator.hooks.preTask({
          description: `SOP ${sopId} - Step ${index + 1}: ${step.name}`,
          sessionId,
          metadata: { sopId, stepId: step.id, stepIndex: index },
        });

        // Spawn appropriate agent for step
        const agent = await this.orchestrator.agent.spawn({
          type: step.agentType,
          name: `sop-${sopId}-step-${index}`,
          swarmId: swarmResult.data?.swarmId,
        });

        // Execute step
        const task = await this.orchestrator.task.orchestrate({
          task: step.instructions,
          priority: step.priority,
          strategy: step.strategy,
          swarmId: swarmResult.data?.swarmId,
        });

        // Post-task hook
        await this.orchestrator.hooks.postTask({
          taskId: task.data?.taskId || '',
          success: task.success,
          result: task.data?.result,
          metadata: { sopId, stepId: step.id },
        });

        // Store step result
        await this.orchestrator.memory.store({
          key: `sop/${sopId}/step/${step.id}`,
          value: {
            stepId: step.id,
            success: task.success,
            result: task.data?.result,
            agentId: agent.data?.agentId,
            taskId: task.data?.taskId,
            completedAt: new Date(),
          },
          namespace: 'sop-executor',
        });

        results.push({
          stepId: step.id,
          success: task.success,
          result: task.data?.result,
        });

        // Stop on failure if step is critical
        if (!task.success && step.critical) {
          throw new Error(`Critical SOP step ${step.id} failed`);
        }
      }

      return {
        sopId,
        success: true,
        results,
        completedAt: new Date(),
      };
    } finally {
      // Cleanup: destroy swarm
      await this.orchestrator.swarm.destroy(swarmResult.data?.swarmId);
    }
  }

  /**
   * Get SOP execution history from memory
   */
  async getSOPHistory(sopId: string): Promise<SOPHistoryResult[]> {
    const searchResult = await this.orchestrator.memory.search({
      pattern: `sop/${sopId}/step/*`,
      namespace: 'sop-executor',
    });

    return searchResult.data?.results || [];
  }
}

interface SOPStep {
  id: string;
  name: string;
  instructions: string;
  agentType: AgentType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  strategy: 'parallel' | 'sequential' | 'adaptive';
  critical: boolean;
}
```

### 3. Workflow Engine Integration

Event-driven workflows can trigger claude-flow orchestration automatically.

```typescript
// integrations/workflow-engine.ts

import { ClaudeFlowOrchestrator } from '../orchestrator';
import { EventEmitter } from 'events';

export class WorkflowEngineIntegration extends EventEmitter {
  constructor(private readonly orchestrator: ClaudeFlowOrchestrator) {
    super();
  }

  /**
   * Register workflow trigger
   */
  registerTrigger(
    eventName: string,
    workflowDefinition: WorkflowDefinition
  ): void {
    this.on(eventName, async (eventData: unknown) => {
      try {
        await this.executeWorkflow(workflowDefinition, eventData);
      } catch (error) {
        this.emit('workflow:error', { eventName, error });
      }
    });
  }

  /**
   * Execute workflow with claude-flow
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    eventData: unknown
  ): Promise<WorkflowResult> {
    const workflowId = `workflow-${workflow.id}-${Date.now()}`;

    // Initialize swarm
    const swarm = await this.orchestrator.swarm.init({
      topology: workflow.topology || 'mesh',
      maxAgents: workflow.maxAgents || 5,
    });

    // Store workflow context
    await this.orchestrator.memory.store({
      key: `workflow/${workflowId}/context`,
      value: { eventData, workflow },
      namespace: 'workflow-engine',
    });

    const stepResults: Record<string, unknown> = {};

    for (const step of workflow.steps) {
      // Check dependencies
      if (step.dependsOn) {
        const allDependenciesMet = step.dependsOn.every(
          (dep) => stepResults[dep]
        );
        if (!allDependenciesMet) {
          throw new Error(`Dependencies not met for step ${step.id}`);
        }
      }

      // Execute step
      const task = await this.orchestrator.task.orchestrate({
        task: this.interpolateTemplate(step.task, { eventData, stepResults }),
        priority: step.priority || 'medium',
        strategy: step.strategy || 'adaptive',
        swarmId: swarm.data?.swarmId,
      });

      stepResults[step.id] = task.data?.result;

      // Emit step completion event
      this.emit('workflow:step:complete', {
        workflowId,
        stepId: step.id,
        result: task.data?.result,
      });
    }

    // Cleanup
    await this.orchestrator.swarm.destroy(swarm.data?.swarmId);

    const result: WorkflowResult = {
      workflowId,
      success: true,
      stepResults,
      completedAt: new Date(),
    };

    this.emit('workflow:complete', result);

    return result;
  }

  /**
   * Template interpolation helper
   */
  private interpolateTemplate(
    template: string,
    context: Record<string, unknown>
  ): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = path.split('.').reduce((obj: any, key: string) => obj?.[key], context);
      return value !== undefined ? String(value) : match;
    });
  }
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  topology?: 'hierarchical' | 'mesh' | 'ring' | 'star';
  maxAgents?: number;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  task: string; // Template string with {{eventData.field}} interpolation
  priority?: 'low' | 'medium' | 'high' | 'critical';
  strategy?: 'parallel' | 'sequential' | 'adaptive';
  dependsOn?: string[]; // IDs of steps that must complete first
}
```

### 4. Service Manager Integration

Health checks and monitoring for claude-flow availability.

```typescript
// integrations/service-manager.ts

import { ClaudeFlowOrchestrator } from '../orchestrator';
import { InstallationManager } from '../config/installation-manager';

export class ServiceManagerIntegration {
  private healthCheckInterval?: NodeJS.Timeout;
  private healthStatus: HealthStatus = { healthy: false, lastCheck: null };

  constructor(
    private readonly orchestrator: ClaudeFlowOrchestrator,
    private readonly installationManager: InstallationManager
  ) {}

  /**
   * Start health monitoring
   */
  startHealthMonitoring(intervalMs: number = 60000): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMs);

    // Initial check
    this.performHealthCheck();
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<HealthStatus> {
    try {
      // Check installation
      const installationCheck = await this.installationManager.checkInstallation();

      // Check version compatibility
      const versionCheck = await this.installationManager.checkVersion();

      // Test basic command execution
      const commandCheck = await this.testCommandExecution();

      const healthy =
        installationCheck.installed &&
        versionCheck.compatible &&
        commandCheck.success;

      this.healthStatus = {
        healthy,
        lastCheck: new Date(),
        details: {
          installation: installationCheck,
          version: versionCheck,
          command: commandCheck,
        },
      };

      return this.healthStatus;
    } catch (error) {
      this.healthStatus = {
        healthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return this.healthStatus;
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): HealthStatus {
    return this.healthStatus;
  }

  /**
   * Test basic command execution
   */
  private async testCommandExecution(): Promise<CommandCheckResult> {
    try {
      // Try a simple, fast command
      const result = await this.orchestrator.swarm.status();

      return {
        success: true,
        latency: result.metadata.duration,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

interface HealthStatus {
  healthy: boolean;
  lastCheck: Date | null;
  details?: {
    installation: InstallationCheckResult;
    version: VersionCheckResult;
    command: CommandCheckResult;
  };
  error?: string;
}
```

---

## Error Handling Strategy

### Error Classification

```typescript
// core/error-handler.ts

export class ErrorHandler {
  /**
   * Classify error and determine recovery strategy
   */
  classify(error: Error, context: ErrorContext): CommandError {
    // Check for installation issues
    if (this.isInstallationError(error)) {
      return {
        type: 'INSTALLATION_NOT_FOUND',
        code: 'ERR_INSTALLATION',
        message: 'claude-flow is not installed or not accessible',
        retryable: false,
        context,
      };
    }

    // Check for timeout
    if (this.isTimeoutError(error)) {
      return {
        type: 'COMMAND_TIMEOUT',
        code: 'ERR_TIMEOUT',
        message: `Command timed out after ${context.timeout}ms`,
        retryable: true,
        context,
      };
    }

    // Check for network errors
    if (this.isNetworkError(error)) {
      return {
        type: 'NETWORK_ERROR',
        code: 'ERR_NETWORK',
        message: 'Network error during command execution',
        retryable: true,
        context,
      };
    }

    // Check for parsing errors
    if (this.isParsingError(error)) {
      return {
        type: 'PARSING_ERROR',
        code: 'ERR_PARSING',
        message: 'Failed to parse command output',
        retryable: false,
        context,
      };
    }

    // Check for resource exhaustion
    if (this.isResourceExhausted(error)) {
      return {
        type: 'RESOURCE_EXHAUSTED',
        code: 'ERR_RESOURCE',
        message: 'System resources exhausted',
        retryable: true,
        context,
      };
    }

    // Default: unknown error
    return {
      type: 'UNKNOWN',
      code: 'ERR_UNKNOWN',
      message: error.message || 'Unknown error occurred',
      retryable: false,
      cause: error,
      context,
    };
  }

  /**
   * Determine recovery strategy
   */
  getRecoveryStrategy(error: CommandError): RecoveryStrategy {
    switch (error.type) {
      case 'INSTALLATION_NOT_FOUND':
        return {
          action: 'FAIL',
          suggestion: 'Install claude-flow: npm install -g @ruvnet/claude-flow@alpha',
          retryable: false,
        };

      case 'COMMAND_TIMEOUT':
        return {
          action: 'RETRY',
          suggestion: 'Increase timeout or check system resources',
          retryable: true,
          retryDelay: 5000,
        };

      case 'NETWORK_ERROR':
        return {
          action: 'RETRY',
          suggestion: 'Check network connectivity',
          retryable: true,
          retryDelay: 3000,
        };

      case 'RESOURCE_EXHAUSTED':
        return {
          action: 'RETRY',
          suggestion: 'Wait for resources to become available',
          retryable: true,
          retryDelay: 10000,
        };

      case 'CIRCUIT_BREAKER_OPEN':
        return {
          action: 'FAIL',
          suggestion: 'Circuit breaker is open. Wait before retrying.',
          retryable: false,
        };

      default:
        return {
          action: 'FAIL',
          suggestion: 'Manual intervention required',
          retryable: false,
        };
    }
  }

  // ... error detection methods
}

interface RecoveryStrategy {
  action: 'RETRY' | 'FAIL' | 'FALLBACK';
  suggestion: string;
  retryable: boolean;
  retryDelay?: number;
  fallbackAction?: () => Promise<void>;
}
```

### Retry Logic with Circuit Breaker

```typescript
// core/retry-manager.ts

export class RetryManager {
  private circuitBreaker: CircuitBreaker;

  constructor(config: RetryConfig) {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.circuitBreaker.failureThreshold,
      successThreshold: config.circuitBreaker.successThreshold,
      timeout: config.circuitBreaker.timeout,
    });
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      throw new ClaudeFlowError(
        'Circuit breaker is open',
        'CIRCUIT_BREAKER_OPEN',
        'ERR_CIRCUIT_BREAKER',
        false
      );
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < config.maxAttempts) {
      try {
        const result = await operation();

        // Success: record in circuit breaker
        this.circuitBreaker.recordSuccess();

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;

        // Check if error is retryable
        const commandError = this.errorHandler.classify(lastError, {
          attempt,
          maxAttempts: config.maxAttempts,
        });

        if (!commandError.retryable || attempt >= config.maxAttempts) {
          // Record failure in circuit breaker
          this.circuitBreaker.recordFailure();
          throw lastError;
        }

        // Calculate backoff delay
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        // Wait before retry
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Retry exhausted');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Circuit breaker implementation
 */
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: Date | null = null;

  constructor(private config: CircuitBreakerConfig) {}

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      // Check if timeout has passed
      const now = Date.now();
      const lastFailure = this.lastFailureTime?.getTime() || 0;

      if (now - lastFailure >= this.config.timeout) {
        // Transition to half-open
        this.state = 'HALF_OPEN';
        return false;
      }

      return true;
    }

    return false;
  }

  recordSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        // Close the circuit
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.config.failureThreshold) {
      // Open the circuit
      this.state = 'OPEN';
      this.successCount = 0;
    }
  }
}
```

### Graceful Degradation

```typescript
// core/graceful-degradation.ts

export class GracefulDegradationHandler {
  /**
   * Attempt operation with fallback
   */
  async executeWithFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    options: FallbackOptions
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      if (options.logFallback) {
        logger.warn('Primary operation failed, using fallback', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return await fallback();
    }
  }

  /**
   * Attempt operation with degraded response
   */
  async executeWithDegradation<T>(
    operation: () => Promise<T>,
    degradedResponse: T,
    options: DegradationOptions
  ): Promise<{ value: T; degraded: boolean }> {
    try {
      const value = await operation();
      return { value, degraded: false };
    } catch (error) {
      if (options.logDegradation) {
        logger.warn('Operation failed, returning degraded response', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return { value: degradedResponse, degraded: true };
    }
  }
}

interface FallbackOptions {
  logFallback: boolean;
}

interface DegradationOptions {
  logDegradation: boolean;
}
```

---

## Configuration Management

### Default Configuration

```typescript
// config/defaults.ts

export const DEFAULT_CONFIG: ClaudeFlowConfig = {
  installation: {
    preferGlobal: true,
    npxPackage: '@ruvnet/claude-flow@alpha',
    minVersion: '2.0.0',
    healthCheckInterval: 60000, // 1 minute
  },
  defaults: {
    timeout: 120000, // 2 minutes
    cwd: process.cwd(),
    env: {},
  },
  retry: {
    enabled: true,
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
    },
  },
  logging: {
    level: 'info',
    logCommands: true,
    logResults: false,
    logErrors: true,
    prettyPrint: false,
  },
  features: {
    streamingOutput: true,
    telemetry: true,
    tracing: false,
    gracefulDegradation: true,
  },
};
```

### Installation Manager

```typescript
// config/installation-manager.ts

import { execa } from 'execa';
import { which } from 'which';
import * as semver from 'semver';

export class InstallationManager {
  private cachedInstallation?: InstallationInfo;

  constructor(private config: InstallationConfig) {}

  /**
   * Check if claude-flow is installed
   */
  async checkInstallation(): Promise<InstallationCheckResult> {
    // Check cache
    if (this.cachedInstallation) {
      return {
        installed: true,
        method: this.cachedInstallation.method,
        path: this.cachedInstallation.path,
      };
    }

    // Check global installation
    if (this.config.preferGlobal) {
      const globalInstall = await this.checkGlobalInstallation();
      if (globalInstall.installed) {
        this.cachedInstallation = {
          method: 'global',
          path: globalInstall.path!,
        };
        return globalInstall;
      }
    }

    // Check if npx is available
    const npxInstall = await this.checkNpxAvailability();
    if (npxInstall.available) {
      this.cachedInstallation = {
        method: 'npx',
        path: 'npx',
      };
      return {
        installed: true,
        method: 'npx',
        path: 'npx',
      };
    }

    return {
      installed: false,
    };
  }

  /**
   * Check version compatibility
   */
  async checkVersion(): Promise<VersionCheckResult> {
    try {
      const { stdout } = await execa('npx', [
        this.config.npxPackage,
        '--version',
      ]);

      const version = stdout.trim();
      const compatible = semver.gte(version, this.config.minVersion);

      return {
        version,
        compatible,
        minVersion: this.config.minVersion,
      };
    } catch (error) {
      return {
        version: 'unknown',
        compatible: false,
        minVersion: this.config.minVersion,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get command prefix (global path or npx)
   */
  getCommandPrefix(): string[] {
    if (!this.cachedInstallation) {
      throw new Error('Installation not checked');
    }

    if (this.cachedInstallation.method === 'global') {
      return [this.cachedInstallation.path];
    } else {
      return ['npx', this.config.npxPackage];
    }
  }

  private async checkGlobalInstallation(): Promise<InstallationCheckResult> {
    try {
      const path = await which('claude-flow');
      return {
        installed: true,
        method: 'global',
        path,
      };
    } catch {
      return {
        installed: false,
      };
    }
  }

  private async checkNpxAvailability(): Promise<{ available: boolean }> {
    try {
      await which('npx');
      return { available: true };
    } catch {
      return { available: false };
    }
  }
}

interface InstallationInfo {
  method: 'global' | 'npx';
  path: string;
}

interface InstallationCheckResult {
  installed: boolean;
  method?: 'global' | 'npx';
  path?: string;
}

interface VersionCheckResult {
  version: string;
  compatible: boolean;
  minVersion: string;
  error?: string;
}
```

---

## Testing Strategy

### Unit Testing

```typescript
// __tests__/unit/cli-executor.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CLIExecutor } from '../../core/cli-executor';
import { CommandSpec } from '../../types';

describe('CLIExecutor', () => {
  let executor: CLIExecutor;

  beforeEach(() => {
    executor = new CLIExecutor({
      /* config */
    });
  });

  describe('execute', () => {
    it('should execute command successfully', async () => {
      const spec: CommandSpec = {
        command: 'claude-flow',
        args: ['swarm', 'status'],
        options: { timeout: 5000 },
      };

      const result = await executor.execute(spec);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();
    });

    it('should handle timeout', async () => {
      const spec: CommandSpec = {
        command: 'claude-flow',
        args: ['task', 'orchestrate', '"long running task"'],
        options: { timeout: 100 }, // Very short timeout
      };

      await expect(executor.execute(spec)).rejects.toThrow(/timeout/i);
    });

    it('should capture stderr on error', async () => {
      const spec: CommandSpec = {
        command: 'claude-flow',
        args: ['invalid', 'command'],
        options: { timeout: 5000 },
      };

      try {
        await executor.execute(spec);
      } catch (error) {
        expect(error).toHaveProperty('stderr');
      }
    });
  });
});
```

### Integration Testing

```typescript
// __tests__/integration/swarm-commands.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ClaudeFlowOrchestrator } from '../../orchestrator';

describe('Swarm Commands (Integration)', () => {
  let orchestrator: ClaudeFlowOrchestrator;
  let swarmId: string;

  beforeAll(async () => {
    orchestrator = new ClaudeFlowOrchestrator(/* config */);
  });

  afterAll(async () => {
    if (swarmId) {
      await orchestrator.swarm.destroy(swarmId);
    }
  });

  it('should initialize swarm', async () => {
    const result = await orchestrator.swarm.init({
      topology: 'mesh',
      maxAgents: 5,
    });

    expect(result.success).toBe(true);
    expect(result.data?.swarmId).toBeDefined();
    swarmId = result.data!.swarmId;
  });

  it('should get swarm status', async () => {
    const result = await orchestrator.swarm.status(swarmId);

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('active');
  });

  it('should scale swarm', async () => {
    const result = await orchestrator.swarm.scale(swarmId, 8);

    expect(result.success).toBe(true);
    expect(result.data?.maxAgents).toBe(8);
  });
});
```

### Mock Testing

```typescript
// __tests__/fixtures/mock-outputs.ts

export const MOCK_SWARM_INIT_OUTPUT = {
  swarmId: 'swarm-12345',
  topology: 'mesh',
  maxAgents: 5,
  createdAt: '2025-10-27T10:00:00Z',
};

export const MOCK_AGENT_SPAWN_OUTPUT = {
  agentId: 'agent-67890',
  type: 'researcher',
  name: 'research-agent-1',
  capabilities: ['analysis', 'research'],
  status: 'active',
  createdAt: '2025-10-27T10:01:00Z',
};

export const MOCK_TASK_ORCHESTRATE_OUTPUT = {
  taskId: 'task-abcdef',
  status: 'running',
  assignedAgents: ['agent-67890'],
  createdAt: '2025-10-27T10:02:00Z',
  estimatedDuration: 30000,
};
```

### Test Coverage Goals

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| CLI Executor | 95% | P0 |
| Command Builder | 95% | P0 |
| Result Processor | 90% | P0 |
| Error Handler | 95% | P0 |
| Retry Manager | 90% | P1 |
| All Commands | 85% | P1 |
| Integrations | 80% | P1 |
| Configuration | 85% | P2 |

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)

**Deliverables:**
- ✅ Type definitions (`types/`)
- ✅ CLI executor (`core/cli-executor.ts`)
- ✅ Command builder (`core/command-builder.ts`)
- ✅ Result processor (`core/result-processor.ts`)
- ✅ Error handler (`core/error-handler.ts`)
- ✅ Retry manager (`core/retry-manager.ts`)
- ✅ Installation manager (`config/installation-manager.ts`)
- ✅ Unit tests for core components

**Acceptance Criteria:**
- All core components have >90% test coverage
- Error handling covers all error types
- Retry logic includes circuit breaker
- Installation detection works for both global and npx

### Phase 2: Command Implementation (Week 2)

**Deliverables:**
- ✅ Swarm commands (`commands/swarm.ts`)
- ✅ Agent commands (`commands/agent.ts`)
- ✅ Task commands (`commands/task.ts`)
- ✅ Memory commands (`commands/memory.ts`)
- ✅ Hooks commands (`commands/hooks.ts`)
- ✅ Integration tests for all commands

**Acceptance Criteria:**
- All P0 commands implemented and tested
- Commands return properly typed results
- Error handling tested for each command
- Integration tests pass against real claude-flow CLI

### Phase 3: Integration Layer (Week 3)

**Deliverables:**
- ✅ Learning loop integration (`integrations/learning-loop.ts`)
- ✅ SOP executor integration (`integrations/sop-executor.ts`)
- ✅ Workflow engine integration (`integrations/workflow-engine.ts`)
- ✅ Service manager integration (`integrations/service-manager.ts`)
- ✅ End-to-end tests for integrations

**Acceptance Criteria:**
- Learning loop can execute full cycle via claude-flow
- SOPs can orchestrate multi-step workflows
- Workflow engine triggers claude-flow on events
- Service manager monitors health accurately

### Phase 4: Advanced Features (Week 4)

**Deliverables:**
- ✅ Neural commands (`commands/neural.ts`)
- ✅ GitHub commands (`commands/github.ts`)
- ✅ DAA commands (`commands/daa.ts`)
- ✅ Streaming output support
- ✅ Telemetry and tracing
- ✅ Performance optimization

**Acceptance Criteria:**
- All P1 and P2 commands implemented
- Streaming output works for long-running tasks
- Telemetry captures key metrics
- Performance benchmarks meet targets

### Phase 5: Documentation & Polish (Week 5)

**Deliverables:**
- ✅ API documentation
- ✅ Integration guides
- ✅ Example workflows
- ✅ Migration guide from manual CLI usage
- ✅ Performance tuning guide

**Acceptance Criteria:**
- Complete API documentation with examples
- Integration guides for each Weaver component
- At least 5 real-world example workflows
- Migration guide tested by external user

---

## Architecture Decision Records (ADRs)

### ADR-001: Use execa for Process Execution

**Status:** Accepted

**Context:**
We need a reliable way to spawn child processes for executing claude-flow CLI commands.

**Decision:**
Use `execa` library for all process execution.

**Rationale:**
- Superior error handling compared to native `child_process`
- Built-in timeout support
- Better stream handling
- TypeScript-friendly API
- Cross-platform compatibility

**Consequences:**
- Additional dependency
- Learning curve for team
- Consistent process execution across codebase

---

### ADR-002: Implement Circuit Breaker Pattern

**Status:** Accepted

**Context:**
Repeated failures to claude-flow CLI could indicate systemic issues (installation problems, resource exhaustion). We need to prevent cascading failures.

**Decision:**
Implement circuit breaker pattern in retry manager.

**Rationale:**
- Prevents resource exhaustion from repeated retries
- Allows system to recover gracefully
- Provides clear failure modes
- Industry-standard pattern for resilience

**Consequences:**
- Additional complexity in retry logic
- Need to tune thresholds carefully
- May need manual intervention to reset circuit

---

### ADR-003: Prefer Global Installation Over npx

**Status:** Accepted

**Context:**
claude-flow can be used via global installation or npx. We need to decide default behavior.

**Decision:**
Prefer global installation, fall back to npx if not available.

**Rationale:**
- Global installation has faster startup time
- Avoids repeated downloads
- More predictable behavior
- Still supports npx for flexibility

**Consequences:**
- Installation detection logic needed
- Documentation must cover both scenarios
- Health checks must handle both methods

---

### ADR-004: Use Structured Logging with Context

**Status:** Accepted

**Context:**
Debugging distributed agent orchestration requires rich context in logs.

**Decision:**
Use structured logging with contextual metadata for all operations.

**Rationale:**
- Easier to debug complex workflows
- Enables log aggregation and analysis
- Supports distributed tracing
- Better observability

**Consequences:**
- More verbose logs
- Need log management strategy
- Performance overhead (minimal)

---

### ADR-005: Validate All Command Outputs with Schemas

**Status:** Accepted

**Context:**
CLI output format may change between versions. We need to ensure type safety.

**Decision:**
Validate all command outputs against TypeScript schemas using Zod or similar.

**Rationale:**
- Catches breaking changes early
- Ensures type safety at runtime
- Better error messages when parsing fails
- Self-documenting code

**Consequences:**
- Additional validation overhead
- Need to maintain schemas
- May need version-specific schemas

---

## Performance Considerations

### Optimization Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Command execution overhead | <50ms | Minimize wrapper overhead |
| Retry decision time | <10ms | Fast failure detection |
| Result parsing time | <100ms | Efficient JSON parsing |
| Health check latency | <500ms | Quick status verification |
| Memory overhead | <10MB | Keep integration lightweight |

### Caching Strategy

```typescript
// utils/cache.ts

export class CommandResultCache {
  private cache = new Map<string, CacheEntry>();

  /**
   * Get cached result if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set cached result with TTL
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}
```

---

## Security Considerations

### Secure Command Execution

```typescript
// utils/security.ts

export class SecurityValidator {
  /**
   * Validate command arguments for injection attacks
   */
  validateArguments(args: string[]): void {
    for (const arg of args) {
      // Check for shell metacharacters
      if (/[;&|`$<>]/.test(arg)) {
        throw new Error(`Invalid argument: ${arg} contains shell metacharacters`);
      }

      // Check for null bytes
      if (arg.includes('\0')) {
        throw new Error(`Invalid argument: ${arg} contains null bytes`);
      }
    }
  }

  /**
   * Sanitize environment variables
   */
  sanitizeEnv(env: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(env)) {
      // Only allow alphanumeric keys with underscores
      if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) {
        throw new Error(`Invalid environment variable name: ${key}`);
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  /**
   * Validate working directory
   */
  validateCwd(cwd: string): void {
    // Prevent directory traversal
    if (cwd.includes('..')) {
      throw new Error('Working directory cannot contain ".."');
    }

    // Must be absolute path
    if (!path.isAbsolute(cwd)) {
      throw new Error('Working directory must be absolute path');
    }
  }
}
```

---

## Observability & Telemetry

### Metrics Collection

```typescript
// utils/metrics.ts

export class MetricsCollector {
  private metrics = new Map<string, Metric>();

  /**
   * Record command execution
   */
  recordExecution(
    command: string,
    duration: number,
    success: boolean
  ): void {
    const key = `command.${command}`;

    const metric = this.metrics.get(key) || {
      count: 0,
      successCount: 0,
      failureCount: 0,
      totalDuration: 0,
      avgDuration: 0,
    };

    metric.count++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.count;

    if (success) {
      metric.successCount++;
    } else {
      metric.failureCount++;
    }

    this.metrics.set(key, metric);
  }

  /**
   * Get metrics for command
   */
  getMetrics(command: string): Metric | null {
    return this.metrics.get(`command.${command}`) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, Metric> {
    return new Map(this.metrics);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics.clear();
  }
}

interface Metric {
  count: number;
  successCount: number;
  failureCount: number;
  totalDuration: number;
  avgDuration: number;
}
```

---

## Conclusion

This architecture design provides a robust, production-ready integration between Weaver and claude-flow CLI. The design emphasizes:

1. **Type Safety**: Full TypeScript support with runtime validation
2. **Reliability**: Comprehensive error handling and retry logic
3. **Performance**: Efficient execution with caching and optimization
4. **Observability**: Structured logging and metrics collection
5. **Extensibility**: Easy to add new commands and features
6. **Security**: Input validation and secure command execution
7. **Testability**: Comprehensive testing strategy with high coverage

The modular architecture allows for incremental implementation while maintaining flexibility for future enhancements. Integration points with Weaver's learning loop, SOPs, and workflow engine provide powerful orchestration capabilities.

**Next Steps:**
1. Review and approve architecture design
2. Begin Phase 1 implementation (Core Infrastructure)
3. Set up CI/CD pipeline for integration tests
4. Create detailed implementation tickets for each component

---

**Document History:**
- v1.0.0 (2025-10-27): Initial architecture design
