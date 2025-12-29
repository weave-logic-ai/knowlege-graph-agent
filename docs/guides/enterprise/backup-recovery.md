---
title: Backup and Recovery
description: Guide to backup strategies and disaster recovery
category: guides/enterprise
---

# Backup and Recovery

## Overview

The knowledge-graph-agent provides comprehensive backup and recovery capabilities for production deployments. This guide covers backup strategies, automation, and disaster recovery procedures.

## Prerequisites

- Node.js >= 20.0.0
- @weavelogic/knowledge-graph-agent installed
- Write access to backup destination

## Quick Start

```bash
# Create a backup
kg diag backup --output ./backups

# Restore from backup
kg diag restore --file ./backups/kg-backup-2024-01-15.tar.gz
```

## Backup Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Backup System                          │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Graph DB    │  │ Config      │  │ Vector Store    │ │
│  │ (SQLite)    │  │ Files       │  │ (Embeddings)    │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                   │          │
│         ▼                ▼                   ▼          │
│  ┌───────────────────────────────────────────────────┐ │
│  │              Backup Manager                        │ │
│  │  • Snapshot coordination                          │ │
│  │  • Gzip compression                               │ │
│  │  • Checksum verification                          │ │
│  └───────────────────────────────────────────────────┘ │
│                          │                              │
│                          ▼                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │              Backup Archive                        │ │
│  │  • kg-backup-{timestamp}.tar.gz                   │ │
│  │  • manifest.json                                   │ │
│  │  • checksums.sha256                               │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Programmatic Usage

### Creating Backups

```typescript
import { createBackupManager } from '@weavelogic/knowledge-graph-agent';

const backupManager = createBackupManager({
  projectRoot: '/path/to/project',
  backupDir: '/path/to/backups',
  compression: true,
  retentionDays: 30,
});

// Create full backup
const backup = await backupManager.createBackup({
  type: 'full',
  includeVectors: true,
  description: 'Pre-migration backup',
});

console.log(`Backup created: ${backup.path}`);
console.log(`Size: ${backup.size} bytes`);
console.log(`Checksum: ${backup.checksum}`);
```

### Restoring from Backup

```typescript
// Verify backup integrity
const isValid = await backupManager.verifyBackup(backupPath);

if (isValid) {
  // Restore backup
  const result = await backupManager.restore({
    backupPath,
    targetDir: '/path/to/restore',
    overwrite: false,
  });

  console.log(`Restored ${result.filesRestored} files`);
}
```

### Incremental Backups

```typescript
// Create incremental backup (only changed files)
const incrementalBackup = await backupManager.createBackup({
  type: 'incremental',
  basedOn: lastFullBackup.id,
});
```

## Backup Types

### Full Backup

Captures all data including:
- SQLite database
- Configuration files
- Vector embeddings (optional)
- Plugin data

```bash
kg diag backup --type full --include-vectors
```

### Incremental Backup

Only captures changes since last backup:

```bash
kg diag backup --type incremental --base-backup <backup-id>
```

### Snapshot Backup

Lightweight backup of database state only:

```bash
kg diag backup --type snapshot
```

## Backup Configuration

```typescript
interface BackupConfig {
  // Storage
  backupDir: string;          // Backup destination
  compression: boolean;        // Enable gzip (default: true)
  compressionLevel: number;    // 1-9 (default: 6)

  // Retention
  retentionDays: number;       // Auto-delete after N days
  maxBackups: number;          // Maximum backups to keep

  // Content
  includeVectors: boolean;     // Include vector embeddings
  includePluginData: boolean;  // Include plugin data
  excludePatterns: string[];   // Files to exclude

  // Scheduling
  schedule: string;            // Cron expression
  onSuccess: (backup: Backup) => void;
  onFailure: (error: Error) => void;
}
```

## Automated Backups

### Schedule Configuration

```typescript
import { BackupScheduler } from '@weavelogic/knowledge-graph-agent';

const scheduler = new BackupScheduler({
  backupManager,
  schedule: '0 2 * * *',  // Daily at 2 AM
  type: 'incremental',
  fullBackupInterval: 7,   // Full backup every 7 days
});

scheduler.start();
```

### Using CLI

```bash
# Enable automated backups
kg config set backup.enabled true
kg config set backup.schedule "0 2 * * *"
kg config set backup.retention 30

# Check backup status
kg diag backup --status
```

## Disaster Recovery

### Recovery Procedures

#### Level 1: Database Corruption

```bash
# 1. Stop all services
kg serve --stop

# 2. Restore from latest backup
kg diag restore --file ./backups/latest.tar.gz

# 3. Verify integrity
kg diag health --check-db

# 4. Restart services
kg serve --all
```

#### Level 2: Full System Recovery

```bash
# 1. Clean installation
npm install @weavelogic/knowledge-graph-agent

# 2. Restore configuration
kg diag restore --file backup.tar.gz --config-only

# 3. Restore database
kg diag restore --file backup.tar.gz --db-only

# 4. Regenerate vectors (if not backed up)
kg graph --regenerate-vectors

# 5. Verify and start
kg diag health
kg serve --all
```

### Recovery Verification

```typescript
import { IntegrityChecker } from '@weavelogic/knowledge-graph-agent';

const checker = new IntegrityChecker(db);

const result = await checker.runChecks({
  checkDatabase: true,
  checkFiles: true,
  checkVectors: true,
  repairMode: false,  // Set to true to auto-fix
});

if (result.issues.length > 0) {
  console.log('Issues found:', result.issues);

  // Attempt repair
  const repairResult = await checker.repair(result.issues);
  console.log('Repaired:', repairResult.fixed);
}
```

## Backup Storage

### Local Storage

```typescript
const backupManager = createBackupManager({
  backupDir: './backups',
});
```

### Cloud Storage (S3-compatible)

```typescript
const backupManager = createBackupManager({
  backupDir: 's3://my-bucket/kg-backups',
  storageOptions: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: 'us-east-1',
  },
});
```

## Backup Manifest

Each backup includes a manifest file:

```json
{
  "version": "1.0.0",
  "id": "backup-20240115-020000",
  "type": "full",
  "timestamp": "2024-01-15T02:00:00Z",
  "description": "Scheduled backup",
  "contents": {
    "database": true,
    "config": true,
    "vectors": true,
    "plugins": true
  },
  "stats": {
    "totalFiles": 45,
    "totalSize": 15728640,
    "compressedSize": 4194304,
    "nodeCount": 1250,
    "edgeCount": 3400
  },
  "checksums": {
    "database.sqlite": "sha256:abc123...",
    "config.json": "sha256:def456..."
  }
}
```

## Best Practices

### 1. Backup Strategy

| Environment | Full Backup | Incremental | Retention |
|-------------|-------------|-------------|-----------|
| Development | Weekly | Daily | 7 days |
| Staging | Daily | Every 6h | 14 days |
| Production | Daily | Hourly | 30 days |

### 2. Test Restores Regularly

```bash
# Monthly restore test
kg diag restore --file latest.tar.gz --target ./test-restore
kg diag health --project ./test-restore
```

### 3. Monitor Backup Health

```typescript
// Add to health monitoring
healthMonitor.addCheck({
  name: 'backup-freshness',
  interval: '1h',
  check: async () => {
    const latestBackup = await backupManager.getLatestBackup();
    const age = Date.now() - latestBackup.timestamp;
    return age < 24 * 60 * 60 * 1000; // Less than 24h old
  },
});
```

### 4. Secure Backups

```bash
# Encrypt backup
kg diag backup --encrypt --passphrase-file ./key

# Restore encrypted backup
kg diag restore --file backup.enc.tar.gz --decrypt
```

## Troubleshooting

### Backup Fails with "Database Locked"

Stop all services before backup or use snapshot mode:
```bash
kg serve --stop
kg diag backup
```

### Restore Fails with "Checksum Mismatch"

Verify backup integrity:
```bash
kg diag backup --verify ./backup.tar.gz
```

### Out of Disk Space

Configure retention or external storage:
```bash
kg config set backup.maxBackups 5
kg config set backup.retentionDays 7
```

## Next Steps

- [Health Monitoring](./health-monitoring.md)
- [Caching Guide](./caching.md)
- [Security Best Practices](../../contributing/security.md)
