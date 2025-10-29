---
visual:
  icon: 📚
icon: 📚
---
# Weaver CLI Integration Audit Report

**Date**: 2025-10-27
**Auditor**: Code Quality Analyzer
**Purpose**: Determine Weaver's current CLI integration capabilities and requirements for claude-flow integration

---

## Executive Summary

### Current State: **PARTIAL CLI CAPABILITY**

Weaver has **basic CLI execution capabilities** through Node.js `child_process` module but **NO streamlined CLI integration library** for external tools. The codebase demonstrates:

- ✅ **Can execute external CLIs** (proven with `git` via `execFile`)
- ✅ **Has PM2 process management** (via library, not CLI)
- ✅ **Service architecture** ready for integration
- ❌ **NO dedicated CLI execution utility/wrapper**
- ❌ **NO existing claude-flow CLI calls**
- ❌ **NO CLI execution patterns for npm/npx/bun commands**

**Recommendation**: Build a dedicated CLI execution service using Node.js `child_process.execFile` or add `execa` library for better ergonomics.

---

## 1. Current CLI Execution Capabilities

### 1.1 Existing Process Execution

**File**: `/home/aepod/dev/weave-nn/weaver/src/vault-init/writer/git-initializer.ts`

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Example usage - Git CLI integration
await execFileAsync('git', ['--version']);
await execFileAsync('git', ['init'], { cwd: vaultPath });
await execFileAsync('git', ['add', '.'], { cwd: vaultPath });
await execFileAsync('git', ['commit', '-m', 'Initial vault commit'], { cwd: vaultPath });
```

**Pattern Analysis**:
- ✅ Uses `execFile` (safer than `exec` - no shell injection)
- ✅ Uses `promisify` for async/await
- ✅ Passes `cwd` option for directory context
- ✅ Error handling via try/catch
- ⚠️ **ONLY used in ONE file** (git-initializer.ts)

### 1.2 PM2 Integration (Library-based, NOT CLI)

**File**: `/home/aepod/dev/weave-nn/weaver/src/service-manager/process-manager.ts`

```typescript
import pm2 from 'pm2';

// Uses PM2 as a LIBRARY, not CLI
pm2.connect((err) => { ... });
pm2.start(pm2Config, (err, proc) => { ... });
pm2.stop(name, (err) => { ... });
pm2.restart(name, (err) => { ... });
```

**Key Finding**: PM2 is integrated as a **library import**, NOT via CLI execution (`pm2 start`). This proves Weaver can manage processes but doesn't demonstrate CLI execution patterns.

### 1.3 Simple-Git Integration (Library-based)

**File**: `/home/aepod/dev/weave-nn/weaver/src/git/git-client.ts`

```typescript
import { simpleGit, SimpleGit } from 'simple-git';

// Uses simple-git LIBRARY wrapper
this.git = simpleGit(this.repoPath);
await this.git.init();
await this.git.add(files);
await this.git.commit(message);
await this.git.push(remote, branch);
```

**Key Finding**: Git operations use `simple-git` library wrapper, NOT direct CLI calls. This is the **preferred pattern** for git operations.

### 1.4 Package Manager References

**Found in**: `/home/aepod/dev/weave-nn/weaver/src/spec-generator/generator.ts`

```typescript
// Only STRING REFERENCES to CLI commands, NOT actual execution
sections.push('bun run typecheck  # Must pass with 0 errors');
sections.push('bun run lint      # Must pass with 0 errors');
sections.push('bun run build     # Must complete successfully');
```

**Key Finding**: These are **documentation strings**, NOT actual CLI executions. Weaver does NOT currently execute `npm`, `npx`, or `bun` commands programmatically.

---

## 2. Dependencies Analysis

### 2.1 Current Dependencies (package.json)

```json
{
  "dependencies": {
    "pm2": "^6.0.13",              // ✅ Process manager (library)
    "simple-git": "^3.28.0",       // ✅ Git wrapper (library)
    "commander": "^14.0.1",        // ✅ CLI framework (for Weaver's own CLI)
    "inquirer": "^12.3.0",         // ✅ Interactive prompts
    "chalk": "^5.3.0",             // ✅ Terminal colors
    "ora": "^8.1.1"                // ✅ Spinners
  }
}
```

### 2.2 Missing Dependencies

**NO CLI execution libraries found**:
- ❌ `execa` - Modern child process execution
- ❌ `cross-spawn` - Cross-platform spawn
- ❌ Any dedicated CLI execution utility

**Current Approach**: Direct use of Node.js `child_process` module

---

## 3. Existing Patterns & Architecture

### 3.1 Service Architecture

**File**: `/home/aepod/dev/weave-nn/weaver/src/service-manager/types.ts`

```typescript
export interface ServiceConfig {
  name: string;
  script: string;          // Script to execute
  interpreter?: string;    // e.g., 'node', 'bun'
  args?: string[];         // CLI arguments
  cwd?: string;           // Working directory
  env?: Record<string, string>; // Environment variables
}

export interface ProcessManager {
  start(config: ServiceConfig): Promise<ProcessInfo>;
  stop(name: string, force?: boolean): Promise<void>;
  restart(name: string): Promise<void>;
  getStatus(name: string): Promise<ServiceStatus>;
}
```

**Key Insight**: Weaver has a **robust service management architecture** that could EASILY integrate CLI execution patterns. The `ServiceConfig` interface already supports:
- Script paths
- Arguments
- Working directories
- Environment variables

### 3.2 Workflow Engine Architecture

**File**: `/home/aepod/dev/weave-nn/weaver/src/workflow-engine/index.ts`

```typescript
export class WorkflowEngine {
  async triggerFileEvent(fileEvent: FileEvent): Promise<void>
  async triggerManual(workflowId: string, metadata?: Record<string, unknown>): Promise<void>
  private async executeWorkflow(workflow: WorkflowDefinition, ...): Promise<void>
}
```

**Key Insight**: Workflow engine provides **execution context** for running CLI commands. Workflows could trigger claude-flow CLI operations.

### 3.3 Spec-Kit Workflow Example

**File**: `/home/aepod/dev/weave-nn/weaver/src/workflows/spec-kit-workflow.ts`

```typescript
// Current approach: Manual instructions (NO actual execution)
logger.info('After completion, sync tasks with:');
logger.info(`   bun run sync-tasks-ai ${phaseId}`);
```

**Key Finding**: Workflows currently **log instructions** for manual CLI execution. This is a **prime candidate** for automation via CLI integration.

---

## 4. Search Results Summary

### 4.1 Process Spawning Usage

**Search Pattern**: `child_process|spawn|exec|execa`
**Files Found**: 38 files

**Breakdown**:
- **1 file** uses `child_process.execFile` (git-initializer.ts)
- **37 files** use `.exec()` method on **RegExp objects** (NOT process execution)
  - Example: `wikilinkRegex.exec(content)` - string matching
  - Example: `db.exec(sql)` - SQLite database execution

**Key Finding**: FALSE POSITIVES. Only **ONE actual CLI execution** pattern exists.

### 4.2 Claude-Flow References

**Search Pattern**: `claude-flow`
**Files Found**: 14 files (ALL documentation)

**Locations**:
- `/weaver/docs/` - Documentation mentions
- `/weaver/.env.example` - Configuration examples
- **ZERO** source code files use claude-flow

**Key Finding**: claude-flow is **documented** but **NOT integrated** into codebase.

---

## 5. Gaps Analysis

### 5.1 What's Missing for Claude-Flow Integration

| Feature | Status | Priority | Effort |
|---------|--------|----------|--------|
| CLI execution utility/service | ❌ Missing | **HIGH** | Medium |
| Error handling for CLI failures | ❌ Missing | **HIGH** | Low |
| Streaming output capture | ❌ Missing | **MEDIUM** | Medium |
| Process timeout management | ❌ Missing | **MEDIUM** | Low |
| Environment variable injection | ⚠️ Partial | **LOW** | Low |
| Working directory handling | ✅ Exists | **LOW** | None |
| Async/await patterns | ✅ Exists | **LOW** | None |

### 5.2 Current vs. Needed Capabilities

**Current State**:
```typescript
// What Weaver CAN do
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

await execFileAsync('git', ['init'], { cwd: '/path' });
```

**Needed for Claude-Flow**:
```typescript
// What we NEED to build
import { cliExecutor } from './services/cli-executor';

// Execute claude-flow commands
await cliExecutor.run('npx', [
  'claude-flow@alpha',
  'hooks',
  'pre-task',
  '--description', 'Analyze code'
], {
  cwd: vaultPath,
  timeout: 30000,
  env: { ...process.env, CLAUDE_FLOW_SESSION: sessionId }
});

// Execute with streaming output
const stream = cliExecutor.stream('npx', [
  'claude-flow@alpha',
  'agent',
  'spawn',
  '--type', 'coder'
]);

stream.on('data', (output) => logger.info(output));
stream.on('error', (err) => logger.error(err));
stream.on('exit', (code) => logger.info(`Exit: ${code}`));
```

---

## 6. Recommended Architecture

### 6.1 Proposed CLI Execution Service

**File**: `/weaver/src/services/cli-executor.ts` (NEW)

```typescript
/**
 * CLI Execution Service
 * Handles external CLI command execution with streaming, timeouts, and error handling
 */

import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger.js';

const execFileAsync = promisify(execFile);

export interface CLIOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number; // milliseconds
  maxBuffer?: number; // bytes
  shell?: boolean;
}

export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number; // milliseconds
}

export class CLIExecutor {
  /**
   * Execute CLI command and wait for completion
   */
  async run(
    command: string,
    args: string[],
    options: CLIOptions = {}
  ): Promise<CLIResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execFileAsync(command, args, {
        cwd: options.cwd || process.cwd(),
        env: options.env || process.env,
        timeout: options.timeout || 30000,
        maxBuffer: options.maxBuffer || 1024 * 1024 * 10, // 10MB
        shell: options.shell || false,
      });

      const duration = Date.now() - startTime;

      logger.debug('CLI command completed', {
        command,
        args,
        duration,
        stdout: stdout.substring(0, 200),
      });

      return {
        stdout,
        stderr,
        exitCode: 0,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.error('CLI command failed', error, {
        command,
        args,
        exitCode: error.code,
        duration,
      });

      throw new Error(
        `CLI command failed: ${command} ${args.join(' ')}\n` +
        `Exit code: ${error.code}\n` +
        `Error: ${error.message}`
      );
    }
  }

  /**
   * Execute CLI command with streaming output
   */
  stream(
    command: string,
    args: string[],
    options: CLIOptions = {}
  ): NodeJS.EventEmitter {
    const process = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      shell: options.shell || false,
    });

    logger.debug('CLI command started (streaming)', {
      command,
      args,
      pid: process.pid,
    });

    return process;
  }

  /**
   * Execute npx command (convenience wrapper)
   */
  async npx(
    packageCommand: string,
    args: string[] = [],
    options: CLIOptions = {}
  ): Promise<CLIResult> {
    return this.run('npx', [packageCommand, ...args], options);
  }

  /**
   * Execute bun command (convenience wrapper)
   */
  async bun(
    command: string,
    args: string[] = [],
    options: CLIOptions = {}
  ): Promise<CLIResult> {
    return this.run('bun', [command, ...args], options);
  }
}

// Singleton instance
export const cliExecutor = new CLIExecutor();
```

### 6.2 Claude-Flow Integration Service

**File**: `/weaver/src/services/claude-flow-client.ts` (NEW)

```typescript
/**
 * Claude-Flow Client
 * Wrapper service for claude-flow CLI operations
 */

import { cliExecutor, CLIOptions } from './cli-executor.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export type AgentType = 'researcher' | 'coder' | 'tester' | 'reviewer' | 'system-architect';
export type HookType = 'pre-task' | 'post-task' | 'post-edit' | 'session-restore' | 'session-end';

export interface ClaudeFlowConfig {
  cwd?: string;
  sessionId?: string;
  timeout?: number;
}

export class ClaudeFlowClient {
  private defaultOptions: CLIOptions;

  constructor(private flowConfig: ClaudeFlowConfig = {}) {
    this.defaultOptions = {
      cwd: flowConfig.cwd || config.vault.path,
      timeout: flowConfig.timeout || 60000, // 60 seconds default
      env: {
        ...process.env,
        ...(flowConfig.sessionId ? { CLAUDE_FLOW_SESSION: flowConfig.sessionId } : {}),
      },
    };
  }

  /**
   * Initialize swarm
   */
  async swarmInit(topology: 'hierarchical' | 'mesh' | 'ring' | 'star'): Promise<void> {
    logger.info('Initializing Claude-Flow swarm', { topology });

    await cliExecutor.npx(
      'claude-flow@alpha',
      ['swarm', 'init', '--topology', topology],
      this.defaultOptions
    );

    logger.info('Swarm initialized successfully');
  }

  /**
   * Spawn agent
   */
  async agentSpawn(type: AgentType, name?: string): Promise<void> {
    logger.info('Spawning Claude-Flow agent', { type, name });

    const args = ['agent', 'spawn', '--type', type];
    if (name) {
      args.push('--name', name);
    }

    await cliExecutor.npx(
      'claude-flow@alpha',
      args,
      this.defaultOptions
    );

    logger.info('Agent spawned successfully', { type, name });
  }

  /**
   * Execute hook
   */
  async hook(
    hookType: HookType,
    params: Record<string, string> = {}
  ): Promise<void> {
    logger.debug('Executing Claude-Flow hook', { hookType, params });

    const args = ['hooks', hookType];

    // Convert params to CLI args
    for (const [key, value] of Object.entries(params)) {
      args.push(`--${key}`, value);
    }

    await cliExecutor.npx(
      'claude-flow@alpha',
      args,
      this.defaultOptions
    );

    logger.debug('Hook executed successfully', { hookType });
  }

  /**
   * Memory operations
   */
  async memoryStore(key: string, value: string): Promise<void> {
    await cliExecutor.npx(
      'claude-flow@alpha',
      ['memory', 'store', '--key', key, '--value', value],
      this.defaultOptions
    );
  }

  async memoryRetrieve(key: string): Promise<string> {
    const result = await cliExecutor.npx(
      'claude-flow@alpha',
      ['memory', 'retrieve', '--key', key],
      this.defaultOptions
    );

    return result.stdout.trim();
  }

  /**
   * Get swarm status
   */
  async swarmStatus(): Promise<any> {
    const result = await cliExecutor.npx(
      'claude-flow@alpha',
      ['swarm', 'status', '--json'],
      this.defaultOptions
    );

    return JSON.parse(result.stdout);
  }
}

// Factory function
export function createClaudeFlowClient(config?: ClaudeFlowConfig): ClaudeFlowClient {
  return new ClaudeFlowClient(config);
}
```

### 6.3 Integration with Workflow Engine

**File**: `/weaver/src/workflows/claude-flow-workflow.ts` (NEW)

```typescript
/**
 * Claude-Flow Workflow
 * Example workflow using claude-flow integration
 */

import { WorkflowDefinition } from '../workflow-engine/types.js';
import { createClaudeFlowClient } from '../services/claude-flow-client.js';
import { logger } from '../utils/logger.js';

export const claudeFlowWorkflow: WorkflowDefinition = {
  id: 'claude-flow-code-analysis',
  name: 'Claude-Flow Code Analysis',
  description: 'Analyze code using Claude-Flow swarm coordination',
  enabled: true,
  triggers: ['manual'],

  handler: async (context) => {
    const { metadata } = context;
    const targetFile = metadata?.['targetFile'] as string;

    if (!targetFile) {
      throw new Error('targetFile required in workflow metadata');
    }

    logger.info('Starting Claude-Flow code analysis', { targetFile });

    const claudeFlow = createClaudeFlowClient({
      sessionId: `analysis-${Date.now()}`,
    });

    // Initialize swarm
    await claudeFlow.swarmInit('mesh');

    // Spawn agents
    await claudeFlow.agentSpawn('code-analyzer', 'analyzer-1');
    await claudeFlow.agentSpawn('reviewer', 'reviewer-1');

    // Execute pre-task hook
    await claudeFlow.hook('pre-task', {
      description: `Analyze ${targetFile}`,
    });

    // Store file context in memory
    await claudeFlow.memoryStore('target-file', targetFile);

    // Get status
    const status = await claudeFlow.swarmStatus();
    logger.info('Swarm status', status);

    logger.info('Claude-Flow analysis workflow completed');
  },
};
```

---

## 7. Implementation Recommendations

### 7.1 Phase 1: Core CLI Executor (PRIORITY HIGH)

**Deliverables**:
1. ✅ Create `/weaver/src/services/cli-executor.ts`
2. ✅ Implement `CLIExecutor` class with:
   - `run()` - Execute and wait
   - `stream()` - Execute with streaming
   - `npx()` - Convenience wrapper
   - `bun()` - Convenience wrapper
3. ✅ Add error handling and logging
4. ✅ Add timeout management
5. ✅ Write unit tests

**Estimated Effort**: 4-6 hours

### 7.2 Phase 2: Claude-Flow Client (PRIORITY HIGH)

**Deliverables**:
1. ✅ Create `/weaver/src/services/claude-flow-client.ts`
2. ✅ Implement `ClaudeFlowClient` class with methods:
   - `swarmInit()`
   - `agentSpawn()`
   - `hook()`
   - `memoryStore()` / `memoryRetrieve()`
   - `swarmStatus()`
3. ✅ Add TypeScript types for all commands
4. ✅ Write integration tests

**Estimated Effort**: 6-8 hours

### 7.3 Phase 3: Workflow Integration (PRIORITY MEDIUM)

**Deliverables**:
1. ✅ Update spec-kit workflow to use CLI executor
2. ✅ Create example Claude-Flow workflows
3. ✅ Add workflow triggers for file events
4. ✅ Document workflow patterns

**Estimated Effort**: 4-6 hours

### 7.4 Phase 4: Service Management (PRIORITY LOW)

**Deliverables**:
1. ✅ Add claude-flow to service manager
2. ✅ Create `weaver service claude-flow start` command
3. ✅ Add health checks for claude-flow
4. ✅ Add metrics collection

**Estimated Effort**: 6-8 hours

---

## 8. Code Quality Assessment

### 8.1 Existing Patterns Quality

**Strengths**:
- ✅ **Type Safety**: Strong TypeScript types throughout
- ✅ **Error Handling**: Proper try/catch patterns
- ✅ **Async/Await**: Modern async patterns
- ✅ **Modularity**: Clean separation of concerns
- ✅ **Logging**: Comprehensive logging infrastructure

**Weaknesses**:
- ⚠️ **CLI Execution**: Only one instance (git-initializer)
- ⚠️ **Code Duplication**: Would benefit from shared utility
- ⚠️ **Testing**: No tests for CLI execution patterns

### 8.2 Recommendations for Best Practices

1. **Use `execFile` over `exec`**:
   - ✅ Prevents shell injection attacks
   - ✅ Better argument handling
   - ✅ More predictable behavior

2. **Add `execa` library** (Optional):
   ```bash
   bun add execa
   ```
   - Better error messages
   - Simpler API
   - Built-in streaming
   - Better cross-platform support

3. **Implement retry logic**:
   ```typescript
   async runWithRetry(command: string, args: string[], retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await this.run(command, args);
       } catch (error) {
         if (i === retries - 1) throw error;
         await sleep(1000 * (i + 1)); // Exponential backoff
       }
     }
   }
   ```

4. **Add command validation**:
   ```typescript
   private validateCommand(command: string): void {
     const allowedCommands = ['npx', 'bun', 'git', 'node'];
     if (!allowedCommands.includes(command)) {
       throw new Error(`Command not allowed: ${command}`);
     }
   }
   ```

---

## 9. Security Considerations

### 9.1 Current Security Posture

**Strengths**:
- ✅ Uses `execFile` (no shell injection)
- ✅ Explicit argument arrays (no string interpolation)
- ✅ Working directory isolation

**Risks**:
- ⚠️ No command whitelisting
- ⚠️ No argument sanitization
- ⚠️ No resource limits (beyond timeout)

### 9.2 Security Recommendations

1. **Command Whitelisting**:
   ```typescript
   const ALLOWED_COMMANDS = ['npx', 'bun', 'git', 'node'];
   ```

2. **Argument Validation**:
   ```typescript
   private sanitizeArgs(args: string[]): string[] {
     return args.map(arg => {
       // Remove potentially dangerous characters
       return arg.replace(/[;&|<>$`]/g, '');
     });
   }
   ```

3. **Resource Limits**:
   ```typescript
   const DEFAULT_TIMEOUT = 30000; // 30 seconds
   const MAX_BUFFER = 10 * 1024 * 1024; // 10MB
   ```

---

## 10. Testing Strategy

### 10.1 Unit Tests Needed

```typescript
// tests/services/cli-executor.test.ts
describe('CLIExecutor', () => {
  it('should execute simple command', async () => {
    const result = await cliExecutor.run('echo', ['hello']);
    expect(result.stdout).toBe('hello\n');
    expect(result.exitCode).toBe(0);
  });

  it('should handle command failure', async () => {
    await expect(
      cliExecutor.run('nonexistent-command', [])
    ).rejects.toThrow();
  });

  it('should respect timeout', async () => {
    await expect(
      cliExecutor.run('sleep', ['60'], { timeout: 1000 })
    ).rejects.toThrow('timeout');
  });

  it('should use custom working directory', async () => {
    const result = await cliExecutor.run('pwd', [], {
      cwd: '/tmp'
    });
    expect(result.stdout.trim()).toBe('/tmp');
  });
});
```

### 10.2 Integration Tests Needed

```typescript
// tests/services/claude-flow-client.test.ts
describe('ClaudeFlowClient', () => {
  it('should initialize swarm', async () => {
    const client = createClaudeFlowClient();
    await expect(client.swarmInit('mesh')).resolves.not.toThrow();
  });

  it('should spawn agent', async () => {
    const client = createClaudeFlowClient();
    await expect(
      client.agentSpawn('coder', 'test-agent')
    ).resolves.not.toThrow();
  });

  it('should execute hooks', async () => {
    const client = createClaudeFlowClient();
    await expect(
      client.hook('pre-task', { description: 'test' })
    ).resolves.not.toThrow();
  });
});
```

---

## 11. Migration Path

### 11.1 Existing Git Integration

**Current** (library-based):
```typescript
import { simpleGit } from 'simple-git';
const git = simpleGit(repoPath);
await git.init();
```

**Future** (could use CLI executor for consistency):
```typescript
import { cliExecutor } from './services/cli-executor';
await cliExecutor.run('git', ['init'], { cwd: repoPath });
```

**Recommendation**: **KEEP simple-git library**. It provides better API and error handling. Use CLI executor ONLY for tools without good library wrappers (like claude-flow).

### 11.2 Spec-Kit Workflow Migration

**Current**:
```typescript
logger.info('After completion, sync tasks with:');
logger.info(`   bun run sync-tasks-ai ${phaseId}`);
```

**Future**:
```typescript
await cliExecutor.bun('run', ['sync-tasks-ai', phaseId]);
logger.info('Tasks synced successfully');
```

---

## 12. Conclusion

### 12.1 Summary of Findings

| Aspect | Status | Details |
|--------|--------|---------|
| **Can Weaver call external CLIs?** | ✅ YES | Via `child_process.execFile` |
| **Are CLI patterns established?** | ⚠️ MINIMAL | Only 1 instance (git init) |
| **Is claude-flow integrated?** | ❌ NO | Only documented, not used |
| **Is infrastructure ready?** | ✅ YES | Service architecture supports it |
| **Are dependencies available?** | ✅ YES | Node.js built-in modules sufficient |

### 12.2 What Needs to Be Built

**Required (High Priority)**:
1. ✅ CLI Executor Service (`/weaver/src/services/cli-executor.ts`)
2. ✅ Claude-Flow Client (`/weaver/src/services/claude-flow-client.ts`)
3. ✅ TypeScript type definitions
4. ✅ Error handling patterns
5. ✅ Unit tests

**Recommended (Medium Priority)**:
6. ✅ Workflow integration examples
7. ✅ Streaming output support
8. ✅ Retry logic
9. ✅ Command whitelisting

**Optional (Low Priority)**:
10. ⚠️ Add `execa` library (better DX)
11. ⚠️ Service manager integration
12. ⚠️ Health checks
13. ⚠️ Metrics collection

### 12.3 Estimated Total Effort

- **Phase 1** (Core CLI Executor): 4-6 hours
- **Phase 2** (Claude-Flow Client): 6-8 hours
- **Phase 3** (Workflow Integration): 4-6 hours
- **Phase 4** (Service Management): 6-8 hours

**Total**: **20-28 hours** for complete integration

**MVP** (Phases 1-2 only): **10-14 hours**

---

## 13. Next Steps

### 13.1 Immediate Actions

1. **Create CLI Executor Service**:
   - File: `/weaver/src/services/cli-executor.ts`
   - Implement `run()`, `stream()`, `npx()` methods
   - Add timeout and error handling

2. **Create Claude-Flow Client**:
   - File: `/weaver/src/services/claude-flow-client.ts`
   - Wrap common claude-flow CLI commands
   - Add TypeScript types

3. **Update Spec-Kit Workflow**:
   - Replace manual CLI instructions with automated execution
   - Add claude-flow integration

4. **Write Tests**:
   - Unit tests for CLI executor
   - Integration tests for claude-flow client

### 13.2 Follow-up Questions

- **Should we add `execa` dependency?** (Better DX, but adds dependency)
- **Should git operations migrate to CLI executor?** (NO - simple-git is better)
- **Should we build a CLI command registry?** (YES - for security)
- **Should we support streaming output for all commands?** (YES - for long-running operations)

---

## Appendix A: File Reference Map

### Files with CLI Execution Patterns

| File | Pattern | Usage | Notes |
|------|---------|-------|-------|
| `/weaver/src/vault-init/writer/git-initializer.ts` | `execFile` | Git CLI | **ONLY** actual CLI execution |
| `/weaver/src/service-manager/process-manager.ts` | PM2 library | Process mgmt | Library, not CLI |
| `/weaver/src/git/git-client.ts` | simple-git lib | Git operations | Library, not CLI |
| `/weaver/src/workflows/spec-kit-workflow.ts` | String refs | Documentation | No actual execution |

### Files Ready for Integration

| File | Integration Point | Priority |
|------|------------------|----------|
| `/weaver/src/workflows/spec-kit-workflow.ts` | Add CLI execution | HIGH |
| `/weaver/src/service-manager/process-manager.ts` | Add CLI service type | MEDIUM |
| `/weaver/src/workflow-engine/index.ts` | Add CLI workflow triggers | MEDIUM |

---

## Appendix B: Code Examples

### Example 1: Basic CLI Execution

```typescript
import { cliExecutor } from '../services/cli-executor';

// Execute npx command
const result = await cliExecutor.npx('claude-flow@alpha', [
  'swarm',
  'init',
  '--topology',
  'mesh'
]);

console.log(result.stdout);
console.log(`Completed in ${result.duration}ms`);
```

### Example 2: Streaming Output

```typescript
import { cliExecutor } from '../services/cli-executor';

const process = cliExecutor.stream('npx', [
  'claude-flow@alpha',
  'agent',
  'spawn',
  '--type',
  'coder'
]);

process.stdout.on('data', (data) => {
  logger.info(data.toString());
});

process.stderr.on('data', (data) => {
  logger.error(data.toString());
});

process.on('exit', (code) => {
  logger.info(`Process exited with code ${code}`);
});
```

### Example 3: Error Handling

```typescript
import { cliExecutor } from '../services/cli-executor';

try {
  await cliExecutor.run('npx', ['claude-flow@alpha', 'invalid-command']);
} catch (error) {
  if (error.message.includes('timeout')) {
    logger.error('Command timed out');
  } else if (error.code === 'ENOENT') {
    logger.error('Command not found');
  } else {
    logger.error('Command failed', error);
  }
}
```

---

**End of Audit Report**
