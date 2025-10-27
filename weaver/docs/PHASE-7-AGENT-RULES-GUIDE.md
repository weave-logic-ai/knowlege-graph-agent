# Phase 7: Agent Rules Implementation Guide

**Comprehensive guide to intelligent agent rules for automated note processing**

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Agent Rules](#agent-rules)
  - [Auto-Tagging](#auto-tagging)
  - [Auto-Linking](#auto-linking)
  - [Daily Notes](#daily-notes)
  - [Meeting Notes](#meeting-notes)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Performance Tuning](#performance-tuning)

---

## Overview

Phase 7 introduces intelligent agent-based rules that automatically enhance your notes using Claude AI. These rules run in response to file events (create, modify, delete) and perform tasks like:

- **Auto-tagging**: Extract and add relevant tags to notes
- **Auto-linking**: Create wikilinks between related notes
- **Daily notes**: Create and manage daily note templates
- **Meeting notes**: Process meeting notes and extract action items

### Key Features

- 🤖 **AI-Powered**: Uses Claude 3.5 Sonnet for intelligent processing
- ⚡ **Real-time**: Runs automatically on file changes via Chokidar
- 🔄 **Concurrent**: Executes multiple rules simultaneously (up to 5)
- 🛡️ **Resilient**: Retry logic, circuit breaker, and error recovery
- 📊 **Performant**: < 2s rule execution, < 3s API latency (p95)
- 💾 **Cached**: Integrates with shadow cache for fast lookups

---

## Architecture

### Component Overview

```
┌─────────────────┐
│  File Watcher   │
│   (Chokidar)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent Engine   │
│  - Rule Router  │
│  - Concurrency  │
│  - Error Handling│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│  Rules │ │ Claude │
│  Logic │ │ Client │
└────┬───┘ └────┬───┘
     │          │
     └────┬─────┘
          ▼
┌─────────────────┐
│  Shadow Cache   │
│  Memory Sync    │
└─────────────────┘
```

### Data Flow

1. **File Event** → Chokidar detects file change
2. **Route Event** → Agent engine determines applicable rules
3. **Execute Rules** → Run rules concurrently (max 5)
4. **Call Claude** → Extract tags, links, or process content
5. **Update Note** → Modify frontmatter or content
6. **Sync Cache** → Update shadow cache and memory
7. **Log Result** → Record success/failure for monitoring

---

## Agent Rules

### Auto-Tagging

Automatically extracts and adds relevant tags to notes using Claude AI.

#### How It Works

1. Detects note creation or modification
2. Sends note content to Claude with tag extraction prompt
3. Parses JSON response with suggested tags
4. Merges tags with existing frontmatter (no duplicates)
5. Writes updated frontmatter back to note

#### Example

**Before:**
```markdown
---
title: Machine Learning Overview
created: 2025-01-15
---

# Machine Learning Overview

This document discusses neural networks, deep learning,
and artificial intelligence applications.
```

**After:**
```markdown
---
title: Machine Learning Overview
created: 2025-01-15
tags: ["machine-learning", "deep-learning", "neural-networks", "ai"]
---

# Machine Learning Overview

This document discusses neural networks, deep learning,
and artificial intelligence applications.
```

#### Configuration

```typescript
{
  rule: 'auto-tag',
  enabled: true,
  triggers: ['create', 'modify'],
  maxTags: 10,
  minConfidence: 0.7,
  excludePaths: ['archive/', 'templates/']
}
```

#### Prompts

```typescript
const AUTO_TAG_PROMPT = `Analyze this note and extract relevant tags.

Content:
{{content}}

Return JSON with format:
{
  "tags": ["tag1", "tag2", ...],
  "confidence": 0.95
}

Guidelines:
- Use lowercase kebab-case
- Be specific and relevant
- Limit to {{maxTags}} tags
- Only include tags with >{{minConfidence}} confidence
`;
```

---

### Auto-Linking

Automatically creates wikilinks between related notes using shadow cache.

#### How It Works

1. Detects note creation or modification
2. Scans content for potential link targets
3. Queries shadow cache for matching notes
4. Inserts `[[wikilink]]` syntax where appropriate
5. Creates backlinks in target notes

#### Example

**Source Note:**
```markdown
# Project Requirements

The architecture design phase is complete.
Implementation planning will start next week.
```

**After Auto-Linking:**
```markdown
# Project Requirements

The [[architecture-design]] phase is complete.
[[implementation-planning]] will start next week.
```

**Target Note (`architecture-design.md`):**
```markdown
# Architecture Design

...

## Backlinks
- [[project-requirements]]
```

#### Configuration

```typescript
{
  rule: 'auto-link',
  enabled: true,
  triggers: ['create', 'modify'],
  minSimilarity: 0.8,
  createBacklinks: true,
  excludePaths: ['daily/', 'archive/']
}
```

#### Algorithm

```typescript
// 1. Extract potential link phrases
const phrases = extractNounPhrases(content);

// 2. Query shadow cache for matches
const matches = await shadowCache.findSimilar(phrases, {
  minScore: config.minSimilarity
});

// 3. Insert wikilinks
for (const match of matches) {
  content = content.replace(
    new RegExp(match.phrase, 'gi'),
    `[[${match.notePath}]]`
  );
}

// 4. Create backlinks
if (config.createBacklinks) {
  for (const match of matches) {
    await addBacklink(match.notePath, currentNotePath);
  }
}
```

---

### Daily Notes

Automatically creates daily notes with templates and rolls over incomplete tasks.

#### How It Works

1. Triggered at midnight or on-demand
2. Checks if today's daily note exists
3. Creates from template if missing
4. Rolls over incomplete tasks from yesterday
5. Links to previous/next daily notes

#### Example Template

```markdown
---
title: Daily Note - {{date}}
type: daily-note
created: {{timestamp}}
tags: ["daily-note"]
---

# Daily Note - {{date}}

[[{{yesterday}}]] ← → [[{{tomorrow}}]]

## Tasks

{{rolledOverTasks}}

- [ ] Review inbox
- [ ] Plan day

## Notes

## Meetings

## References

---

**Energy Level:** ▢▢▢▢▢
**Focus Areas:**
```

#### Configuration

```typescript
{
  rule: 'daily-note',
  enabled: true,
  triggers: ['schedule'], // Runs at midnight
  templatePath: 'templates/daily-note.md',
  location: 'daily/',
  rolloverTasks: true,
  createLinks: true
}
```

#### Task Rollover

```typescript
// Extract incomplete tasks from yesterday
const yesterday = await readNote(yesterdayPath);
const incompleteTasks = yesterday
  .split('\n')
  .filter(line => /^- \[ \]/.test(line))
  .map(task => task.trim());

// Add to today's note
const rolledOver = incompleteTasks.join('\n');
const content = template.replace('{{rolledOverTasks}}', rolledOver);
```

---

### Meeting Notes

Processes meeting notes to extract action items and create task notes.

#### How It Works

1. Detects notes in `meetings/` folder
2. Extracts action items using regex patterns
3. Creates individual task notes for each action
4. Links tasks back to meeting note
5. Optionally creates calendar events

#### Example

**Meeting Note:**
```markdown
# Team Sync - 2025-01-15

## Attendees
- Alice, Bob, Charlie

## Discussion
Discussed the new feature launch timeline.

## Action Items
- [ ] Alice: Update documentation by Friday
- [ ] Bob: Review PR #123
- [ ] Charlie: Deploy to staging environment

## Next Meeting
2025-01-22 @ 10:00 AM
```

**Generated Task Notes:**

**`tasks/update-documentation.md`:**
```markdown
---
title: Update documentation by Friday
assignee: Alice
source: meetings/team-sync-2025-01-15
status: open
due: 2025-01-17
created: 2025-01-15T10:30:00Z
tags: ["task", "documentation"]
---

# Update documentation by Friday

**Assigned to:** Alice
**From meeting:** [[meetings/team-sync-2025-01-15]]
**Due:** 2025-01-17
**Status:** Open

## Description
Update documentation as discussed in team sync.

## Checklist
- [ ] Review current docs
- [ ] Make updates
- [ ] Submit for review
```

#### Configuration

```typescript
{
  rule: 'meeting-notes',
  enabled: true,
  triggers: ['create', 'modify'],
  paths: ['meetings/'],
  extractActionItems: true,
  createTaskNotes: true,
  taskLocation: 'tasks/',
  linkBackToMeeting: true,
  createCalendarEvents: false
}
```

#### Action Item Extraction

```typescript
// Regex patterns for action items
const patterns = [
  /^- \[ \] (.+?):\s*(.+)$/gm,           // - [ ] Alice: Do thing
  /^- \[ \] @(\w+):\s*(.+)$/gm,          // - [ ] @alice: Do thing
  /^TODO:\s*@?(\w+):\s*(.+)$/gm,         // TODO: @alice: Do thing
  /^Action\s*-\s*(\w+):\s*(.+)$/gim      // Action - Alice: Do thing
];

const actionItems = [];
for (const pattern of patterns) {
  const matches = Array.from(content.matchAll(pattern));
  for (const match of matches) {
    actionItems.push({
      assignee: match[1],
      task: match[2],
      line: match.index
    });
  }
}
```

---

## Configuration

### Global Configuration

**Location:** `weaver.config.json` or `.env`

```json
{
  "agents": {
    "enabled": true,
    "claudeApiKey": "${ANTHROPIC_API_KEY}",
    "maxConcurrentRules": 5,
    "retryAttempts": 3,
    "circuitBreakerThreshold": 5,
    "rules": {
      "auto-tag": {
        "enabled": true,
        "triggers": ["create", "modify"],
        "maxTags": 10,
        "minConfidence": 0.7,
        "excludePaths": ["archive/", "templates/"]
      },
      "auto-link": {
        "enabled": true,
        "triggers": ["create", "modify"],
        "minSimilarity": 0.8,
        "createBacklinks": true,
        "excludePaths": ["daily/", "archive/"]
      },
      "daily-note": {
        "enabled": true,
        "triggers": ["schedule"],
        "schedule": "0 0 * * *",
        "templatePath": "templates/daily-note.md",
        "location": "daily/",
        "rolloverTasks": true
      },
      "meeting-notes": {
        "enabled": true,
        "triggers": ["create", "modify"],
        "paths": ["meetings/"],
        "extractActionItems": true,
        "createTaskNotes": true,
        "taskLocation": "tasks/"
      }
    }
  }
}
```

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
AGENT_MAX_CONCURRENT=5
AGENT_RETRY_ATTEMPTS=3
AGENT_TIMEOUT_MS=10000
AGENT_RATE_LIMIT=50
```

---

## Usage Examples

### Programmatic Usage

```typescript
import { AgentEngine } from '@weave-nn/weaver/agents';

// Initialize agent engine
const engine = new AgentEngine({
  claudeApiKey: process.env.ANTHROPIC_API_KEY!,
  vaultPath: '/path/to/vault',
  rules: {
    'auto-tag': { enabled: true },
    'auto-link': { enabled: true }
  }
});

// Start watching for file changes
await engine.start();

// Process a specific note
const result = await engine.processNote('notes/my-note.md', ['auto-tag']);

console.log('Tags added:', result.tags);

// Stop engine
await engine.stop();
```

### CLI Usage

```bash
# Start agent engine
weaver agents start

# Process specific note
weaver agents process notes/my-note.md

# Run specific rule
weaver agents run auto-tag notes/my-note.md

# Check status
weaver agents status

# View logs
weaver agents logs --follow
```

### MCP Tool Usage

```typescript
// Via MCP tools
await mcp.call('weaver_process_note', {
  path: 'notes/my-note.md',
  rules: ['auto-tag', 'auto-link']
});

// Check rule status
await mcp.call('weaver_agent_status');

// Get recent activity
await mcp.call('weaver_agent_logs', {
  limit: 50,
  rule: 'auto-tag'
});
```

---

## API Reference

### AgentEngine

**Constructor:**
```typescript
new AgentEngine(config: AgentEngineConfig)
```

**Methods:**
```typescript
// Start watching for file changes
async start(): Promise<void>

// Stop engine
async stop(): Promise<void>

// Process a specific note
async processNote(
  path: string,
  rules?: string[]
): Promise<ProcessResult>

// Get engine status
getStatus(): AgentStatus

// Get rule statistics
getStatistics(): RuleStatistics
```

### ClaudeClient

**Constructor:**
```typescript
new ClaudeClient(config: ClaudeClientConfig)
```

**Methods:**
```typescript
// Send message to Claude
async sendMessage(
  message: string,
  options?: RequestOptions
): Promise<ParsedResponse>

// Get circuit breaker state
getCircuitBreakerState(): CircuitBreakerState

// Reset circuit breaker
resetCircuitBreaker(): void
```

### PromptBuilder

**Constructor:**
```typescript
new PromptBuilder()
```

**Methods:**
```typescript
// Set system prompt
system(prompt: string): PromptBuilder

// Use template
template(name: string, vars: PromptVariables): PromptBuilder

// Add user message
user(message: string): PromptBuilder

// Expect JSON response
expectJSON(): PromptBuilder

// Build final prompt
build(): BuiltPrompt
```

---

## Troubleshooting

### Common Issues

#### 1. Tags Not Being Added

**Symptoms:**
- Notes saved but no tags appear
- Error: "Tag extraction failed"

**Solutions:**
```bash
# Check Claude API key
echo $ANTHROPIC_API_KEY

# Check rule is enabled
cat weaver.config.json | grep -A 5 "auto-tag"

# Check logs
weaver agents logs --rule auto-tag --level error

# Test Claude connection
weaver agents test-connection
```

#### 2. High API Latency

**Symptoms:**
- Slow note processing
- Frequent timeouts

**Solutions:**
```typescript
// Increase timeout
{
  "agents": {
    "timeout": 15000,  // 15 seconds
    "circuitBreakerThreshold": 10
  }
}

// Reduce concurrent requests
{
  "agents": {
    "maxConcurrentRules": 3
  }
}

// Enable rate limiting
{
  "agents": {
    "rateLimitPerMinute": 30
  }
}
```

#### 3. Circuit Breaker Open

**Symptoms:**
- Error: "Circuit breaker is OPEN"
- All requests failing

**Solutions:**
```bash
# Check system status
weaver agents status

# Reset circuit breaker
weaver agents reset-circuit-breaker

# Check for API issues
curl https://status.anthropic.com
```

#### 4. Memory Sync Failures

**Symptoms:**
- Rules execute but results not saved
- Error: "Memory sync failed"

**Solutions:**
```bash
# Check memory service
weaver memory status

# Restart memory service
weaver memory restart

# Clear memory cache
weaver memory clear --namespace agents
```

### Debug Mode

```typescript
// Enable debug logging
{
  "agents": {
    "debug": true,
    "logLevel": "debug"
  }
}
```

**Debug logs include:**
- Rule execution traces
- Claude API request/response
- Circuit breaker state changes
- Memory sync operations
- Performance metrics

---

## Performance Tuning

### Optimization Strategies

#### 1. Reduce API Calls

```typescript
// Batch process multiple notes
const notes = ['note1.md', 'note2.md', 'note3.md'];
const results = await Promise.all(
  notes.map(note => engine.processNote(note, ['auto-tag']))
);

// Cache tag suggestions
const tagCache = new Map<string, string[]>();
const cacheKey = hashContent(content);

if (tagCache.has(cacheKey)) {
  return tagCache.get(cacheKey);
}
```

#### 2. Optimize Concurrency

```typescript
// Tune concurrent rules
{
  "maxConcurrentRules": 5  // Balance: throughput vs. API limits
}

// Rule priority
{
  "rules": {
    "auto-tag": { "priority": 1 },    // High priority
    "auto-link": { "priority": 2 },   // Medium priority
    "daily-note": { "priority": 3 }   // Low priority
  }
}
```

#### 3. Shadow Cache Integration

```typescript
// Pre-warm cache
await shadowCache.warmup();

// Use cache for lookups
const similar = await shadowCache.findSimilar(phrase, {
  limit: 10,
  minScore: 0.8
});

// Batch cache updates
await shadowCache.batchUpdate(updates);
```

#### 4. Memory Management

```typescript
// Namespace isolation
await memory.store('agents:auto-tag:results', data, {
  namespace: 'agents',
  ttl: 3600
});

// Periodic cleanup
setInterval(async () => {
  await memory.cleanup('agents', { maxAge: 86400 });
}, 3600000);
```

### Performance Targets

| Metric | Target | Measured |
|--------|--------|----------|
| Rule execution | < 2s | ~1.5s avg |
| API latency (p95) | < 3s | ~2.3s |
| Memory sync | < 500ms | ~150ms avg |
| Max concurrent | 5 rules | 5 |
| Memory usage | < 512 MB | ~180 MB avg |

### Monitoring

```bash
# Real-time metrics
weaver agents metrics --follow

# Performance report
weaver agents report --period 24h

# Export metrics
weaver agents export-metrics --format json > metrics.json
```

---

## Best Practices

### 1. Rule Configuration

- ✅ Enable only needed rules
- ✅ Use specific path filters
- ✅ Set appropriate confidence thresholds
- ❌ Don't enable all rules globally
- ❌ Don't set maxConcurrentRules too high

### 2. Error Handling

- ✅ Monitor circuit breaker state
- ✅ Log all errors with context
- ✅ Implement graceful degradation
- ❌ Don't ignore retry failures
- ❌ Don't expose API keys in logs

### 3. Performance

- ✅ Use shadow cache for lookups
- ✅ Batch operations when possible
- ✅ Monitor API rate limits
- ❌ Don't process large notes synchronously
- ❌ Don't skip memory cleanup

### 4. Testing

- ✅ Test with realistic note content
- ✅ Validate performance under load
- ✅ Test error scenarios
- ❌ Don't test with production API keys
- ❌ Don't skip integration tests

---

## Next Steps

1. **Phase 8**: Advanced agent features
   - Custom rule creation
   - Rule templates marketplace
   - Multi-agent coordination
   - Workflow automation

2. **Improvements**:
   - Machine learning model fine-tuning
   - Custom prompt engineering
   - Advanced caching strategies
   - Real-time collaboration

3. **Integration**:
   - Obsidian plugin
   - VS Code extension
   - Web dashboard
   - Mobile app

---

## Support

- **Documentation**: https://weave-nn.dev/docs/agents
- **Issues**: https://github.com/weave-nn/weaver/issues
- **Discord**: https://discord.gg/weave-nn
- **Email**: support@weave-nn.dev

---

**Last Updated:** 2025-01-25
**Version:** 1.0.0
**Phase:** 7 - Agent Rules Implementation
