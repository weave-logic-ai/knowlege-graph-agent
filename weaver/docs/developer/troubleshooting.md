---
title: Troubleshooting Guide - Autonomous Learning Loop
type: documentation
status: complete
created_date: {}
tags:
  - phase-12
  - troubleshooting
  - debugging
  - support
category: guide
domain: weaver
scope: troubleshooting
audience:
  - developers
  - users
related_concepts:
  - debugging
  - error-handling
  - performance
version: 1.0.0
visual:
  icon: "\U0001F4DA"
  color: '#06B6D4'
  cssclasses:
    - type-documentation
    - status-complete
    - domain-weaver
updated_date: '2025-10-28'
---

# Troubleshooting Guide - Autonomous Learning Loop

Common issues and solutions for the autonomous learning loop.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Errors](#common-errors)
3. [Performance Issues](#performance-issues)
4. [Configuration Problems](#configuration-problems)
5. [Integration Issues](#integration-issues)
6. [Debug Mode](#debug-mode)
7. [Getting Help](#getting-help)

---

## Quick Diagnostics

### Health Check Script

```typescript
import { AutonomousLearningLoop } from '@weaver/learning-loop';
import { ClaudeFlowClient } from '@weaver/memory/claude-flow-client';
import { ClaudeClient } from '@weaver/agents/claude-client';

async function healthCheck() {
  console.log('Running health check...\n');

  // 1. Check MCP server
  try {
    const claudeFlow = new ClaudeFlowClient();
    await claudeFlow.memory_usage({ action: 'store', key: 'test', value: 'test', namespace: 'test' });
    console.log('✅ MCP server: OK');
  } catch (error) {
    console.error('❌ MCP server: FAILED', error.message);
  }

  // 2. Check Claude API
  try {
    const claude = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY! });
    await claude.sendMessage({ messages: [{ role: 'user', content: 'test' }] });
    console.log('✅ Claude API: OK');
  } catch (error) {
    console.error('❌ Claude API: FAILED', error.message);
  }

  // 3. Check configuration
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not set');
  } else {
    console.log('✅ Environment variables: OK');
  }
}

healthCheck();
```

---

## Common Errors

### 1. PerceptionError: Failed to gather context

**Symptoms:**
```
PerceptionError: Failed to gather context for task
  at PerceptionSystem.perceive (perception.ts:47)
```

**Causes:**
- MCP server not running
- Shadow cache not initialized
- Network connectivity issues

**Solutions:**

```bash
# Check MCP server status
npx claude-flow@alpha mcp status

# Restart MCP server
npx claude-flow@alpha mcp stop
npx claude-flow@alpha mcp start

# Verify connection
curl http://localhost:3000/health
```

```typescript
// Ensure shadow cache is initialized
const shadowCache = new ShadowCache({ vaultPath: '/path/to/vault' });
await shadowCache.initialize();
await shadowCache.index();  // Re-index if needed
```

**Alternative workaround:**

```typescript
// Create loop without shadow cache
const loop = new AutonomousLearningLoop(
  claudeFlow,
  claudeClient,
  undefined  // Skip shadow cache if vault not needed
);
```

---

### 2. ReasoningError: Failed to generate plan

**Symptoms:**
```
ReasoningError: Failed to generate plan: Rate limit exceeded
  at ReasoningSystem.reason (reasoning.ts:85)
```

**Causes:**
- Invalid or missing Claude API key
- API rate limit exceeded
- Poor task description

**Solutions:**

```bash
# Verify API key
echo $ANTHROPIC_API_KEY | head -c 20

# Check quota (if available)
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
```

```typescript
// Improve task description
// Bad:
const task = { id: '1', description: 'analyze data', domain: 'analytics' };

// Good:
const task = {
  id: '1',
  description: 'Analyze Q4 2024 sales data by product category and identify top 3 growth opportunities',
  domain: 'analytics',
  priority: 'high',
  metadata: {
    dataSource: 'sales_db',
    outputFormat: 'markdown_report'
  }
};
```

**Rate limit handling:**

```typescript
import { sleep } from './utils';

async function executeWithBackoff(task: Task, maxRetries = 3): Promise<Outcome> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await loop.execute(task);
    } catch (error) {
      if (error.message.includes('rate limit') && i < maxRetries - 1) {
        const delay = 1000 * Math.pow(2, i);  // Exponential backoff
        console.log(`Rate limit hit, waiting ${delay}ms...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}
```

---

### 3. ExecutionError: Execution timeout

**Symptoms:**
```
ExecutionError: Execution timeout after 300000ms
  at ExecutionSystem.execute (execution.ts:120)
```

**Causes:**
- Task too complex
- Workflow hanging
- Network issues

**Solutions:**

```typescript
// Increase timeout
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    timeoutMs: 600000  // 10 minutes instead of 5
  }
);
```

**Break into subtasks:**

```typescript
// Instead of one complex task
const task = {
  id: '1',
  description: 'Complete end-to-end data pipeline: extract, transform, analyze, report',
  domain: 'analytics'
};

// Break into subtasks
const subtasks = [
  { id: 's1', description: 'Extract data from source databases', domain: 'analytics' },
  { id: 's2', description: 'Transform and clean data', domain: 'analytics' },
  { id: 's3', description: 'Perform statistical analysis', domain: 'analytics' },
  { id: 's4', description: 'Generate executive report', domain: 'analytics' }
];

for (const subtask of subtasks) {
  await loop.execute(subtask);
}
```

---

### 4. MemoryError: Failed to store experience

**Symptoms:**
```
MemoryError: Failed to store experience: No space left on device
  at MemorySystem.store (memory.ts:45)
```

**Causes:**
- Disk space full
- Experience too large
- Permission issues

**Solutions:**

```bash
# Check disk space
df -h ~/.weaver/

# Clear old experiences
npx claude-flow@alpha memory clear --namespace weaver_experiences

# Or selectively delete old entries
npx claude-flow@alpha memory query "timestamp < 2024-01-01" --namespace weaver_experiences
```

```typescript
// Enable compression
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    enableCompression: true,
    experienceRetentionDays: 14  // Keep less history
  }
);
```

**Manual cleanup:**

```typescript
async function cleanupOldExperiences(daysOld: number = 30): Promise<void> {
  const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

  const experiences = await claudeFlow.memory_search({
    pattern: '*',
    namespace: 'weaver_experiences'
  });

  for (const exp of experiences) {
    const experience = JSON.parse(exp.value);
    if (experience.timestamp < cutoff) {
      await claudeFlow.memory_usage({
        action: 'delete',
        key: exp.key,
        namespace: 'weaver_experiences'
      });
    }
  }
}
```

---

### 5. TypeError: Cannot read property 'X' of undefined

**Symptoms:**
```
TypeError: Cannot read property 'pastExperiences' of undefined
  at ReasoningSystem.reason (reasoning.ts:92)
```

**Causes:**
- Missing required parameters
- Null/undefined values
- API response format changed

**Solutions:**

```typescript
// Add null checks
if (!context || !context.pastExperiences) {
  throw new Error('Invalid context object');
}

// Use optional chaining
const experiences = context?.pastExperiences ?? [];

// Validate inputs
function validateTask(task: Task): void {
  if (!task || !task.id || !task.description) {
    throw new ValidationError('Invalid task object');
  }
}

validateTask(task);
```

---

## Performance Issues

### Slow Perception (> 1 second)

**Symptoms:**
- Perception stage takes > 1s
- System feels sluggish

**Diagnosis:**

```typescript
// Add timing logs
const startTime = Date.now();
const perceptionOutput = await this.perception.perceive({ task });
console.log('Perception time:', Date.now() - startTime + 'ms');
```

**Solutions:**

```typescript
// Reduce search scope
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    maxExperiencesPerQuery: 5,    // Instead of 10
    maxNotesPerQuery: 10,          // Instead of 20
    enableExternalKnowledge: false // Disable web search
  }
);
```

**Shadow cache optimization:**

```bash
# Rebuild shadow cache index
rm ~/.weaver/shadow-cache/cache.db
# Then re-initialize and index
```

---

### Slow Reasoning (> 10 seconds)

**Symptoms:**
- Reasoning stage takes > 10s
- Multiple LLM calls

**Diagnosis:**

```typescript
// Enable debug logging
process.env.DEBUG = 'reasoning:*';

const reasoningOutput = await this.reasoning.reason({ context });
```

**Solutions:**

```typescript
// Generate fewer alternatives
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    generateAlternativePlans: true,
    maxAlternativePlans: 2  // Instead of 3-5
  }
);

// Or disable multi-path reasoning for simple tasks
const fastLoop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    generateAlternativePlans: false  // Single plan only
  }
);
```

---

### Memory Leaks

**Symptoms:**
- Memory usage grows over time
- Process crashes with OOM

**Diagnosis:**

```bash
# Monitor memory
node --expose-gc --max-old-space-size=4096 app.js

# Or use heapdump
npm install heapdump
node --require heapdump app.js
```

**Solutions:**

```typescript
// Enable auto-cleanup
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    experienceRetentionDays: 7,  // Clean up after 1 week
    enableCompression: true
  }
);

// Manual cleanup after batch processing
async function processBatch(tasks: Task[]): Promise<void> {
  for (const task of tasks) {
    await loop.execute(task);

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}
```

---

## Configuration Problems

### Invalid Configuration

**Symptoms:**
```
Error: Invalid configuration: maxAlternativePlans must be between 1 and 10
```

**Solutions:**

```typescript
// Validate configuration
function validateConfig(config: Partial<LearningLoopConfig>): void {
  if (config.maxAlternativePlans && (config.maxAlternativePlans < 1 || config.maxAlternativePlans > 10)) {
    throw new Error('maxAlternativePlans must be between 1 and 10');
  }

  if (config.timeoutMs && config.timeoutMs < 1000) {
    throw new Error('timeoutMs must be at least 1000ms');
  }

  // Add more validations...
}

validateConfig(config);
```

### Environment Variables Not Set

**Symptoms:**
```
Error: ANTHROPIC_API_KEY environment variable not set
```

**Solutions:**

```bash
# Set environment variables
export ANTHROPIC_API_KEY=sk-ant-...
export VAULT_PATH=/path/to/vault

# Or use .env file
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
echo "VAULT_PATH=/path/to/vault" >> .env

# Load with dotenv
npm install dotenv
```

```typescript
import dotenv from 'dotenv';
dotenv.config();

// Validate required env vars
const requiredEnvVars = ['ANTHROPIC_API_KEY'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(`${varName} environment variable not set`);
  }
}
```

---

## Integration Issues

### MCP Server Connection Failed

**Symptoms:**
```
Error: Failed to connect to MCP server at localhost:3000
```

**Diagnosis:**

```bash
# Check if MCP server is running
npx claude-flow@alpha mcp status

# Check port availability
lsof -i :3000

# Check logs
npx claude-flow@alpha mcp logs
```

**Solutions:**

```bash
# Restart MCP server
npx claude-flow@alpha mcp restart

# Or use different port
export MCP_PORT=3001
npx claude-flow@alpha mcp start --port 3001
```

```typescript
// Update client configuration
const claudeFlow = new ClaudeFlowClient({
  mcpServer: 'claude-flow',
  port: 3001  // Custom port
});
```

### Shadow Cache Database Locked

**Symptoms:**
```
Error: database is locked
  at ShadowCache.queryFiles (shadow-cache.ts:120)
```

**Causes:**
- Multiple processes accessing same database
- Previous process crashed without closing connection

**Solutions:**

```bash
# Find and kill processes using the database
lsof ~/.weaver/shadow-cache/cache.db
kill -9 <PID>

# Or delete lock file
rm ~/.weaver/shadow-cache/cache.db-wal
rm ~/.weaver/shadow-cache/cache.db-shm
```

```typescript
// Use separate database instances
const shadowCache1 = new ShadowCache({
  vaultPath: '/path/to/vault',
  dbPath: '~/.weaver/shadow-cache/cache-1.db'
});

const shadowCache2 = new ShadowCache({
  vaultPath: '/path/to/vault',
  dbPath: '~/.weaver/shadow-cache/cache-2.db'
});
```

---

## Debug Mode

### Enable Detailed Logging

```typescript
// Set DEBUG environment variable
process.env.DEBUG = 'learning-loop:*';

// Or specific modules
process.env.DEBUG = 'perception:*,reasoning:*';

// Enable in code
import debug from 'debug';
const log = debug('learning-loop');

log('Starting task execution:', task);
```

### Debug Configuration

```typescript
const debugConfig = {
  // Perception debug
  maxExperiencesPerQuery: 3,
  maxNotesPerQuery: 5,
  enableExternalKnowledge: false,

  // Reasoning debug
  generateAlternativePlans: true,
  maxAlternativePlans: 2,
  minPlanConfidence: 0.3,  // Lower threshold

  // Execution debug
  enableMonitoring: true,
  maxRetries: 1,
  timeoutMs: 60000,  // Shorter timeout

  // Reflection debug
  enablePatternAnalysis: false,  // Disable to save time
  minLessonImpact: 'low'  // Capture all lessons
};

const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  debugConfig
);
```

### Verbose Logging

```typescript
class VerboseLearningLoop extends AutonomousLearningLoop {
  async execute(task: Task): Promise<Outcome> {
    console.log('\n' + '='.repeat(60));
    console.log('EXECUTING TASK:', task.id);
    console.log('Description:', task.description);
    console.log('Domain:', task.domain);
    console.log('='.repeat(60) + '\n');

    try {
      console.log('1. PERCEPTION...');
      const perceptionStart = Date.now();
      const perceptionOutput = await this.perception.perceive({ task });
      console.log(`   ✓ Completed in ${Date.now() - perceptionStart}ms`);
      console.log(`   - Past experiences: ${perceptionOutput.context.pastExperiences.length}`);
      console.log(`   - Related notes: ${perceptionOutput.context.relatedNotes.length}`);
      console.log(`   - Confidence: ${perceptionOutput.confidence.toFixed(2)}\n`);

      console.log('2. REASONING...');
      const reasoningStart = Date.now();
      const reasoningOutput = await this.reasoning.reason({ context: perceptionOutput.context });
      console.log(`   ✓ Completed in ${Date.now() - reasoningStart}ms`);
      console.log(`   - Plans generated: ${reasoningOutput.alternativePlans.length + 1}`);
      console.log(`   - Selected plan confidence: ${reasoningOutput.selectedPlan.confidence.toFixed(2)}\n`);

      console.log('3. EXECUTION...');
      const executionStart = Date.now();
      const executionResult = await this.execution.execute({ plan: reasoningOutput.selectedPlan });
      console.log(`   ✓ Completed in ${Date.now() - executionStart}ms`);
      console.log(`   - Success: ${executionResult.success}`);
      console.log(`   - Steps: ${executionResult.outcome.metrics.stepsCompleted}/${executionResult.outcome.metrics.stepsTotal}\n`);

      console.log('4. REFLECTION...');
      const reflectionStart = Date.now();
      const reflectionOutput = await this.reflection.reflect({ execution: executionResult });
      console.log(`   ✓ Completed in ${Date.now() - reflectionStart}ms`);
      console.log(`   - Lessons learned: ${reflectionOutput.lessons.length}`);
      console.log(`   - Recommendations: ${reflectionOutput.recommendations.length}\n`);

      console.log('5. MEMORY...');
      const memoryStart = Date.now();
      const experience = { /* ... */ };
      await this.memory.store(experience);
      console.log(`   ✓ Completed in ${Date.now() - memoryStart}ms\n`);

      console.log('='.repeat(60));
      console.log('TASK COMPLETE');
      console.log('='.repeat(60) + '\n');

      return executionResult.outcome;
    } catch (error) {
      console.error('\n❌ ERROR:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }
}
```

---

## Getting Help

### Collect Diagnostic Information

```typescript
async function collectDiagnostics(): Promise<object> {
  return {
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd()
    },
    configuration: {
      hasApiKey: !!process.env.ANTHROPIC_API_KEY,
      vaultPath: process.env.VAULT_PATH,
      mcpServer: 'claude-flow'
    },
    mcpStatus: await getMcpStatus(),
    shadowCacheStats: await getShadowCacheStats(),
    memoryStats: await getMemoryStats(),
    recentErrors: getRecentErrors()
  };
}
```

### Support Channels

1. **GitHub Issues**: https://github.com/your-org/weaver/issues
2. **Documentation**: `/docs/`
3. **Community Discord**: (if available)
4. **Email Support**: support@example.com

### Before Filing an Issue

Provide:

1. **Version information**:
   ```bash
   npm list @weaver/learning-loop
   ```

2. **Diagnostic output**:
   ```typescript
   const diagnostics = await collectDiagnostics();
   console.log(JSON.stringify(diagnostics, null, 2));
   ```

3. **Minimal reproduction**:
   ```typescript
   // Simplest code that reproduces the issue
   ```

4. **Expected vs actual behavior**

5. **Error logs** (with `DEBUG=learning-loop:*`)

---

## Related Documentation

- [User Guide](../user-guide/autonomous-learning-guide.md) - How to use the learning loop
- [Developer Guide](phase-12-architecture.md) - System architecture
- [API Reference](../api/learning-loop-api.md) - Complete API documentation

---

**Version**: 1.0.0
**Last Updated**: 2025-10-27
**Status**: Production Ready
