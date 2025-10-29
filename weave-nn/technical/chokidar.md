---
title: Chokidar File Watcher
type: documentation
status: in-progress
tags:
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#8E8E93'
  cssclasses:
    - document
updated: '2025-10-29T04:55:06.324Z'
keywords:
  - overview
  - why chokidar
  - installation
  - mvp usage
  - basic setup
  - advanced configuration
  - events
  - file events
  - directory events
  - meta events
---
# Chokidar File Watcher

**Category**: Technical / File Monitoring
**Status**: MVP Core Dependency
**Package**: `chokidar`
**GitHub**: https://github.com/paulmillr/chokidar

---

## Overview

Chokidar is the file watcher integrated into Weaver, replacing the separate Python watchdog service.

## Why Chokidar

**Battle-Tested**:
- Used by 30M+ repositories
- Powers webpack, vite, parcel, gulp, nodemon
- 8+ years of production use

**Cross-Platform**:
- Windows (ReadDirectoryChangesW)
- macOS (FSEvents)
- Linux (inotify)
- Handles platform-specific edge cases

**Reliable**:
- Atomic write detection
- Rename handling
- Debouncing for rapid changes
- Symlink support

## Installation

```bash
npm install chokidar
```

## MVP Usage

### Basic Setup

```typescript
// src/watcher/vault-watcher.ts
import chokidar from 'chokidar';
import { triggerWorkflow } from '../workflows';
import { logger } from '../utils/logger';

export function createVaultWatcher(vaultPath: string) {
  const watcher = chokidar.watch(vaultPath, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300, // Wait 300ms after last change
      pollInterval: 100
    }
  });

  watcher
    .on('add', async (path) => {
      logger.info(`File created: ${path}`);
      await triggerWorkflow('file-created', { path });
    })
    .on('change', async (path) => {
      logger.info(`File modified: ${path}`);
      await triggerWorkflow('file-updated', { path });
    })
    .on('unlink', async (path) => {
      logger.info(`File deleted: ${path}`);
      await triggerWorkflow('file-deleted', { path });
    })
    .on('error', (error) => {
      logger.error(`Watcher error: ${error}`);
    });

  return watcher;
}
```

### Advanced Configuration

```typescript
// Ignore patterns
const watcher = chokidar.watch(vaultPath, {
  ignored: [
    '**/.git/**',
    '**/node_modules/**',
    '**/.obsidian/**',
    '**/*.tmp',
    '**/*~'
  ],

  // Performance optimization
  ignoreInitial: true,    // Don't emit events for existing files
  usePolling: false,      // Use native events (faster)
  interval: 100,          // Polling interval if usePolling: true
  binaryInterval: 300,    // Interval for binary files

  // Atomic write handling
  awaitWriteFinish: {
    stabilityThreshold: 300,  // Wait until no changes for 300ms
    pollInterval: 100         // Check every 100ms
  },

  // Depth limiting
  depth: 10,              // Max directory depth (prevent infinite loops)

  // Follow symlinks
  followSymlinks: true
});
```

## Events

### File Events
- `add` - File created
- `change` - File modified
- `unlink` - File deleted

### Directory Events
- `addDir` - Directory created
- `unlinkDir` - Directory deleted

### Meta Events
- `ready` - Initial scan complete
- `error` - Watcher error
- `raw` - Raw fs event (platform-specific)

## Performance

### Memory
- **Idle**: ~10MB per 10,000 files
- **Active**: +5MB during event processing

### CPU
- **Idle**: <1% CPU
- **Active**: 2-5% CPU during batch file changes

### Latency
- **Native events**: <5ms from file change to event
- **Polling**: 100-500ms (configurable)

## Comparison with Python watchdog

| Feature | Chokidar | watchdog |
|---------|----------|----------|
| **Usage** | 30M+ repos | <1M projects |
| **Cross-platform** | Excellent | Good |
| **Windows reliability** | Excellent | Fair |
| **Atomic writes** | Built-in | Manual |
| **Integration** | In-process | Separate process |
| **Latency** | <5ms | HTTP roundtrip |

## Edge Cases Handled

### Atomic Writes
Editors like VS Code write to temp files then rename:
```
1. Create file.md.tmp
2. Write content to file.md.tmp
3. Rename file.md.tmp → file.md
```

Chokidar detects this with `awaitWriteFinish` and only fires one `change` event.

### Rapid Changes
Multiple edits within 300ms are debounced into single event.

### Symlinks
Follows symlinks by default, can be disabled.

### Hidden Files
Ignores dotfiles by default, configurable.

## Troubleshooting

### Too Many Events
If getting duplicate events, increase stabilityThreshold:
```typescript
awaitWriteFinish: {
  stabilityThreshold: 500  // Increased from 300
}
```

### Missing Events
If events not firing:
1. Check ignored patterns
2. Verify file permissions
3. Enable polling as fallback:
```typescript
usePolling: true,
interval: 100
```

### High CPU Usage
If CPU spikes:
1. Reduce watched directory depth
2. Add more ignored patterns
3. Increase polling interval

## Related

- [[technical/weaver|Weaver Unified Service]]
- [[docs/weaver-mcp-unification-summary|Weaver MCP Unification (includes file watcher)]]
- [[.archive/technical/python-stack/watchdog-file-monitoring|watchdog (archived)]]
