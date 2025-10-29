---
title: 'Phase 12: Autonomous Learning Loop - Integration Guide'
type: guide
status: complete
created_date: {}
updated_date: '2025-10-28'
tags:
  - phase-12
  - learning-loop
  - integration-guide
  - production-ready
  - implementation
category: technical
domain: phase-12
scope: module
audience:
  - developers
  - architects
related_concepts:
  - autonomous-learning-loop
  - four-pillar-framework
  - integration
  - workflow-engine
  - mcp-tools
related_files:
  - PHASE-12-LEARNING-LOOP-BLUEPRINT.md
  - PHASE-12-IMPLEMENTATION-COMPLETE.md
  - WEAVER-COMPLETE-IMPLEMENTATION-GUIDE.md
  - phase-12-mcp-gap-coverage.md
author: ai-generated
version: 1.0.0
phase_id: PHASE-12
priority: high
status_detailed: production-ready
visual:
  icon: 📄
  cssclasses:
    - type-guide
    - status-complete
    - priority-high
    - phase-12
    - domain-phase-12
icon: 📄
---

## Phase 12: Autonomous Learning Loop - Integration Guide

**Version**: 1.0.0
**Date**: 2025-10-27
**Status**: Production-Ready Implementation

---





## Related

[[PHASE-13-COMPLETE-PLAN]]
## Related

[[PHASE-12-IMPLEMENTATION-COMPLETE]]
## 📚 Related Documentation

### Core Learning Loop
- [[PHASE-12-LEARNING-LOOP-BLUEPRINT]] - Architecture and design
- [[PHASE-12-EXECUTIVE-SUMMARY]] - Phase 12 overview
- [[WEAVER-COMPLETE-IMPLEMENTATION-GUIDE]] - Complete Weaver implementation

### Implementation Details
- [[phase-12-pillar-mapping]] - Four-pillar gap analysis
- [[phase-12-mcp-gap-coverage]] - MCP tool mappings
- [[PHASE-12-MCP-QUICK-WINS]] - Quick wins catalog

### Memory & Embeddings
- [[memorographic-embeddings-research]] - Memory-specific embeddings
- [[VECTOR-DB-MARKDOWN-WORKFLOW-ARCHITECTURE]] - Vector database workflows
- [[CHUNKING-STRATEGY-SYNTHESIS]] - Chunking strategies

### Phase 13 Integration
- [[phase-13-master-plan]] - Next phase planning
- [[CHUNKING-IMPLEMENTATION-DESIGN]] - Chunking implementation

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Architecture](#architecture)
4. [Quick Start](#quick-start)
5. [Integration with Weaver](#integration-with-weaver)
6. [Configuration](#configuration)
7. [Usage Examples](#usage-examples)
8. [Monitoring & Debugging](#monitoring--debugging)
9. [Performance Tuning](#performance-tuning)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Autonomous Learning Loop is a complete implementation of the 4-Pillar Framework for autonomous LLM agents:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ PERCEPTION  │ ───> │  REASONING  │ <──> │   MEMORY    │ <──> │  EXECUTION  │
│   System    │      │   System    │      │   System    │      │   System    │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
      ↑                                                                │
      │                                                                │
      └────────────────────── Feedback Loop ──────────────────────────┘
```

**Key Capabilities**:
- ✅ Learns from past task outcomes autonomously
- ✅ Generates multiple plan alternatives using multi-path reasoning
- ✅ Reflects on failures and adapts strategies
- ✅ Searches semantically across vault and experiences
- ✅ Improves performance over time without human intervention
- ✅ Provides transparent Chain-of-Thought reasoning

---

## Installation

### 1. Prerequisites

```bash
# Weaver v1.0.0 or higher
npm install weaver@latest

# Required MCP servers
npm install @claude-flow/sdk@alpha
```

### 2. Add Dependencies

```bash
cd /path/to/your/weaver/project

# Add learning loop module (already in src/)
# No additional npm packages required - uses existing Weaver infrastructure
```

### 3. Configure MCP Tools

Add to your `.env`:

```env
# Claude API (required)
ANTHROPIC_API_KEY=sk-ant-...

# MCP Server Configuration
CLAUDE_FLOW_ENABLED=true
CLAUDE_FLOW_NAMESPACE=weaver_experiences

# Optional: Enable external knowledge
ENABLE_WEB_SEARCH=false
WEB_SEARCH_API_KEY=

# Learning Loop Configuration
LEARNING_LOOP_MAX_EXPERIENCES=10
LEARNING_LOOP_MAX_NOTES=20
LEARNING_LOOP_GENERATE_ALTERNATIVES=true
LEARNING_LOOP_MAX_ALTERNATIVES=3
```

### 4. Initialize Claude-Flow MCP

```bash
# Start Claude-Flow MCP server
npx claude-flow@alpha mcp start

# Verify it's running
npx claude-flow@alpha mcp status
```

---

## Architecture

### File Structure

```
weave-nn/
├── src/
│   └── learning-loop/
│       ├── index.ts                 # Main exports
│       ├── types.ts                 # Type definitions
│       ├── perception.ts            # Perception System
│       ├── reasoning.ts             # Reasoning System
│       ├── memory.ts                # Memory System
│       ├── execution.ts             # Execution System
│       ├── reflection.ts            # Reflection System
│       └── learning-loop.ts         # Main orchestrator
├── tests/
│   └── learning-loop/
│       └── learning-loop.test.ts    # Integration tests
└── docs/
    └── PHASE-12-LEARNING-LOOP-INTEGRATION.md
```

### Component Dependencies

```typescript
// External dependencies (already in Weaver)
import { claudeClient } from '../agents/claude-client';
import { shadowCache } from '../shadow-cache';
import { workflowEngine } from '../workflow-engine';

// MCP clients
import { claudeFlow } from '@claude-flow/sdk';
```

---

## Quick Start

### Basic Usage

```typescript
import { AutonomousLearningLoop } from '@/learning-loop';
import { claudeFlow } from '@claude-flow/sdk';
import { claudeClient } from '@/agents/claude-client';
import { shadowCache } from '@/shadow-cache';
import { workflowEngine } from '@/workflow-engine';

// 1. Initialize the learning loop
const loop = new AutonomousLearningLoop(
  claudeFlow,     // MCP client
  claudeClient,   // Claude AI client
  shadowCache,    // Weaver shadow cache
  workflowEngine  // Weaver workflow engine
);

// 2. Define a task
const task = {
  id: 'task_001',
  description: 'Research best practices for API design and create documentation',
  domain: 'software-engineering',
  priority: 'high'
};

// 3. Execute with autonomous learning
const result = await loop.execute(task);

// 4. Check result
if (result.success) {
  console.log('✓ Task completed successfully');
  console.log(`Duration: ${result.duration}ms`);
  console.log(`Steps: ${result.metrics.stepsCompleted}/${result.metrics.stepsTotal}`);
} else {
  console.log('✗ Task failed:', result.error.message);
  // Lessons are still learned from failures!
}
```

### Demonstrating Learning Over Time

```typescript
// Run the same task 5 times to show improvement
const learningReport = await loop.demonstrateLearning(task, 5);

console.log('Learning Report:');
console.log(`Success Rate: ${(learningReport.metrics.successRate * 100).toFixed(0)}%`);
console.log(`Improvement: ${learningReport.overallImprovement.toFixed(1)}%`);
console.log(`Lessons Learned: ${learningReport.metrics.totalLessons}`);
```

---

## Integration with Weaver

### Step 1: Import into Existing Workflow

```typescript
// src/workflows/autonomous-workflow.ts

import { AutonomousLearningLoop } from '../learning-loop';
import { WorkflowDefinition } from '../workflow-engine/types';

export const autonomousWorkflow: WorkflowDefinition = {
  id: 'autonomous-task-execution',
  name: 'Autonomous Task Execution with Learning',
  triggers: ['manual', 'scheduled'],

  async handler(context) {
    const loop = new AutonomousLearningLoop(
      context.claudeFlow,
      context.claudeClient,
      context.shadowCache,
      context.workflowEngine
    );

    const task = {
      id: context.taskId,
      description: context.description,
      domain: context.domain || 'general'
    };

    return await loop.execute(task);
  }
};
```

### Step 2: Register Workflow

```typescript
// src/index.ts

import { workflowEngine } from './workflow-engine';
import { autonomousWorkflow } from './workflows/autonomous-workflow';

// Register the autonomous workflow
await workflowEngine.registerWorkflow(autonomousWorkflow);
```

### Step 3: Add MCP Tool Integration

```typescript
// src/mcp-server/tools/autonomous-execute.ts

import { AutonomousLearningLoop } from '../../learning-loop';

export const autonomousExecuteTool = {
  name: 'autonomous_execute',
  description: 'Execute a task autonomously with learning loop',

  inputSchema: {
    type: 'object',
    properties: {
      description: { type: 'string' },
      domain: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
    },
    required: ['description']
  },

  async handler(params: any, context: any) {
    const loop = new AutonomousLearningLoop(
      context.claudeFlow,
      context.claudeClient,
      context.shadowCache,
      context.workflowEngine
    );

    const task = {
      id: `task_${Date.now()}`,
      description: params.description,
      domain: params.domain || 'general',
      priority: params.priority || 'medium'
    };

    const outcome = await loop.execute(task);

    return {
      success: outcome.success,
      duration: outcome.duration,
      metrics: outcome.metrics,
      error: outcome.error?.message
    };
  }
};
```

### Step 4: Enable in Agent Rules

```typescript
// src/agents/rules/autonomous-learning-rule.ts

import { AutonomousLearningLoop } from '../../learning-loop';

export const autonomousLearningRule = {
  id: 'autonomous-learning',
  name: 'Autonomous Learning Agent',
  trigger: 'manual',
  priority: 100,

  async action(context: any) {
    const loop = new AutonomousLearningLoop(
      context.claudeFlow,
      context.claudeClient,
      context.shadowCache,
      context.workflowEngine
    );

    // Automatically handle complex tasks
    const task = {
      id: context.id,
      description: context.description,
      domain: context.domain
    };

    return await loop.execute(task);
  }
};
```

---

## Configuration

### Full Configuration Options

```typescript
const config = {
  // Perception settings
  maxExperiencesPerQuery: 10,        // How many past experiences to retrieve
  maxNotesPerQuery: 20,              // How many vault notes to search
  enableExternalKnowledge: false,    // Enable web search (requires API key)
  semanticSearchThreshold: 0.7,      // Minimum relevance score (0-1)

  // Reasoning settings
  generateAlternativePlans: true,    // Generate multiple plans
  maxAlternativePlans: 3,            // Number of alternatives (1-5)
  minPlanConfidence: 0.5,            // Minimum confidence to accept plan

  // Memory settings
  experienceRetentionDays: 30,       // How long to keep experiences
  memoryNamespace: 'weaver_experiences',
  enableCompression: true,           // Auto-compress old memories

  // Execution settings
  enableMonitoring: true,            // Real-time execution monitoring
  maxRetries: 3,                     // Auto-retry on failure
  timeoutMs: 300000,                 // 5 minutes timeout

  // Reflection settings
  enablePatternAnalysis: true,       // Use neural pattern analysis
  minLessonImpact: 'medium'          // Minimum lesson impact to store
};

const loop = new AutonomousLearningLoop(
  claudeFlow,
  claudeClient,
  shadowCache,
  workflowEngine,
  webFetch,      // Optional: for external knowledge
  config
);
```

### Environment Variables

```env
# Core Settings
LEARNING_LOOP_MAX_EXPERIENCES=10
LEARNING_LOOP_MAX_NOTES=20
LEARNING_LOOP_ENABLE_EXTERNAL=false

# Reasoning
LEARNING_LOOP_GENERATE_ALTERNATIVES=true
LEARNING_LOOP_MAX_ALTERNATIVES=3
LEARNING_LOOP_MIN_CONFIDENCE=0.5

# Memory
LEARNING_LOOP_RETENTION_DAYS=30
LEARNING_LOOP_NAMESPACE=weaver_experiences
LEARNING_LOOP_ENABLE_COMPRESSION=true

# Execution
LEARNING_LOOP_ENABLE_MONITORING=true
LEARNING_LOOP_MAX_RETRIES=3
LEARNING_LOOP_TIMEOUT_MS=300000

# Reflection
LEARNING_LOOP_ENABLE_PATTERNS=true
LEARNING_LOOP_MIN_IMPACT=medium
```

---

## Usage Examples

### Example 1: Simple Task Execution

```typescript
import { AutonomousLearningLoop } from '@/learning-loop';

const loop = new AutonomousLearningLoop(claudeFlow, claudeClient, shadowCache);

const task = {
  id: 'simple_001',
  description: 'Analyze the latest project commits and summarize changes',
  domain: 'git-analysis'
};

const outcome = await loop.execute(task);
console.log('Result:', outcome.success);
```

### Example 2: Complex Multi-Step Task

```typescript
const complexTask = {
  id: 'complex_001',
  description: 'Research React best practices, create guide, and update project docs',
  domain: 'documentation',
  priority: 'high',
  metadata: {
    targetAudience: 'developers',
    format: 'markdown'
  }
};

const outcome = await loop.execute(complexTask);

// Access detailed results
console.log('Duration:', outcome.duration, 'ms');
console.log('Steps:', outcome.metrics.stepsCompleted, '/', outcome.metrics.stepsTotal);
console.log('Success Rate:', (outcome.metrics.successRate * 100).toFixed(0), '%');
```

### Example 3: Learning Demonstration

```typescript
// Show improvement over 5 iterations
const report = await loop.demonstrateLearning({
  id: 'learning_demo',
  description: 'Optimize database queries for user dashboard',
  domain: 'performance'
}, 5);

console.log('=== LEARNING REPORT ===');
console.log('Success Rate:', (report.metrics.successRate * 100).toFixed(0), '%');
console.log('Average Confidence:', (report.metrics.averageConfidence * 100).toFixed(0), '%');
console.log('Overall Improvement:', report.overallImprovement.toFixed(1), '%');

report.results.forEach((result, i) => {
  console.log(`Iteration ${i + 1}:`, {
    success: result.success,
    duration: result.duration,
    improvement: result.improvement
  });
});
```

### Example 4: Integration with Existing Workflow

```typescript
import { workflowEngine } from '@/workflow-engine';

// Hook into file change events
workflowEngine.on('file:change', async (context) => {
  if (context.path.includes('important')) {
    const loop = new AutonomousLearningLoop(
      claudeFlow,
      claudeClient,
      shadowCache,
      workflowEngine
    );

    const task = {
      id: `file_change_${Date.now()}`,
      description: `Analyze changes to ${context.path} and update related docs`,
      domain: 'documentation',
      metadata: { filePath: context.path }
    };

    await loop.execute(task);
  }
});
```

### Example 5: Batch Processing with Learning

```typescript
const tasks = [
  { id: '1', description: 'Task 1', domain: 'testing' },
  { id: '2', description: 'Task 2', domain: 'testing' },
  { id: '3', description: 'Task 3', domain: 'testing' }
];

// Process each task, learning from previous ones
for (const task of tasks) {
  const outcome = await loop.execute(task);
  console.log(`Task ${task.id}:`, outcome.success ? '✓' : '✗');
}

// Check memory stats to see learning
const stats = await loop.getMemoryStats();
console.log('Experiences stored:', stats.totalExperiences);
console.log('Success rate:', (stats.successRate * 100).toFixed(0), '%');
```

---

## Monitoring & Debugging

### Enable Verbose Logging

```typescript
// Set environment variable
process.env.LEARNING_LOOP_DEBUG = 'true';

// Or pass logger to constructor
const loop = new AutonomousLearningLoop(
  claudeFlow,
  claudeClient,
  shadowCache,
  workflowEngine,
  webFetch,
  {
    enableMonitoring: true,
    // ... other config
  }
);
```

### Inspect Memory State

```typescript
// Get detailed memory statistics
const stats = await loop.getMemoryStats();

console.log('Memory Statistics:');
console.log('  Total Experiences:', stats.totalExperiences);
console.log('  Success Rate:', (stats.successRate * 100).toFixed(1), '%');
console.log('  Average Confidence:', (stats.averageConfidence * 100).toFixed(1), '%');
console.log('  Top Domains:');
stats.topDomains.forEach((d, i) => {
  console.log(`    ${i + 1}. ${d.domain}: ${d.count} experiences`);
});
```

### Access Execution Logs

```typescript
const outcome = await loop.execute(task);

// Detailed execution logs
outcome.logs.forEach((log, i) => {
  console.log(`[${i}] ${log}`);
});

// Metrics
console.log('Metrics:', outcome.metrics);
```

---

## Performance Tuning

### Optimize for Speed

```typescript
const fastConfig = {
  maxExperiencesPerQuery: 5,      // Fewer lookups
  maxNotesPerQuery: 10,           // Smaller context
  generateAlternativePlans: false, // Single plan only
  enablePatternAnalysis: false,   // Skip deep analysis
  enableMonitoring: false         // No polling overhead
};
```

### Optimize for Quality

```typescript
const qualityConfig = {
  maxExperiencesPerQuery: 20,     // More context
  maxNotesPerQuery: 50,           // Comprehensive search
  generateAlternativePlans: true,
  maxAlternativePlans: 5,         // More alternatives
  enablePatternAnalysis: true,    // Deep learning
  enableExternalKnowledge: true   // Web search
};
```

### Balance Configuration (Recommended)

```typescript
const balancedConfig = {
  maxExperiencesPerQuery: 10,
  maxNotesPerQuery: 20,
  generateAlternativePlans: true,
  maxAlternativePlans: 3,
  enablePatternAnalysis: true,
  enableMonitoring: true
};
```

---

## Troubleshooting

### Common Issues

#### 1. "MCP server not responding"

**Solution:**
```bash
# Restart MCP server
npx claude-flow@alpha mcp restart

# Check status
npx claude-flow@alpha mcp status

# Check logs
npx claude-flow@alpha mcp logs
```

#### 2. "No experiences found"

**Cause**: Memory namespace mismatch or first run

**Solution:**
```typescript
// Ensure namespace is consistent
const config = {
  memoryNamespace: 'weaver_experiences'  // Must match everywhere
};

// First run will have no experiences - this is normal
```

#### 3. "Execution timeout"

**Solution:**
```typescript
// Increase timeout
const config = {
  timeoutMs: 600000  // 10 minutes
};
```

#### 4. "Low confidence plans"

**Cause**: Insufficient context or first-time task

**Solution:**
```typescript
// Increase context size
const config = {
  maxExperiencesPerQuery: 20,
  maxNotesPerQuery: 50,
  enableExternalKnowledge: true
};

// Or lower confidence threshold
const config = {
  minPlanConfidence: 0.3  // Accept lower confidence
};
```

### Debug Mode

```typescript
// Enable full debug output
process.env.DEBUG = 'learning-loop:*';

// Run with verbose logging
const outcome = await loop.execute(task);
```

---

## Best Practices

### 1. Start Small

Begin with simple tasks to build up the experience base:

```typescript
const simpleTasks = [
  'Analyze recent commits',
  'Update changelog',
  'Generate API docs'
];

for (const description of simpleTasks) {
  await loop.execute({ id: Date.now().toString(), description, domain: 'docs' });
}
```

### 2. Use Consistent Domains

Group related tasks under the same domain for better learning:

```typescript
// Good: Consistent domains
await loop.execute({ id: '1', description: 'Test API', domain: 'testing' });
await loop.execute({ id: '2', description: 'Test UI', domain: 'testing' });

// Bad: Inconsistent domains
await loop.execute({ id: '1', description: 'Test API', domain: 'api-testing' });
await loop.execute({ id: '2', description: 'Test UI', domain: 'ui-test' });
```

### 3. Periodic Memory Maintenance

```typescript
// Weekly: Compress old memories
setInterval(async () => {
  await loop.compressMemory();
}, 7 * 24 * 60 * 60 * 1000);

// Monthly: Backup
setInterval(async () => {
  await loop.backupMemory('/backups/learning-loop-backup.json');
}, 30 * 24 * 60 * 60 * 1000);
```

### 4. Monitor Learning Progress

```typescript
// Track improvement over time
const stats = await loop.getMemoryStats();

if (stats.successRate < 0.5) {
  console.warn('Low success rate - review task complexity');
}

if (stats.averageConfidence < 0.6) {
  console.warn('Low confidence - increase context size');
}
```

---

## Next Steps

1. **Install and Test**: Run the basic examples above
2. **Integrate**: Add to your existing Weaver workflows
3. **Monitor**: Track learning progress with memory stats
4. **Tune**: Adjust configuration based on performance
5. **Scale**: Expand to more complex autonomous tasks

For questions or issues:
- Review Phase 12 documentation in `/docs/`
- Check MCP tool status: `npx claude-flow@alpha mcp status`
- Enable debug logging: `process.env.DEBUG = 'learning-loop:*'`

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-27
**Maintainer**: Phase 12 Implementation Team
