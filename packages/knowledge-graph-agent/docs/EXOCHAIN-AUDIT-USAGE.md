# Exochain Audit Integration Usage Guide

The Exochain audit system provides tamper-evident, deterministic logging for the Knowledge Graph Agent. It implements a distributed append-only ledger using DAG-BFT consensus with cryptographic guarantees for integrity and authenticity.

## Table of Contents

- [Overview](#overview)
- [Key Concepts](#key-concepts)
  - [DAG-BFT Consensus](#dag-bft-directed-acyclic-graph-byzantine-fault-tolerant-consensus)
  - [Hybrid Logical Clocks](#hybrid-logical-clocks-hlc)
  - [BLAKE3 Cryptographic Hashing](#blake3-cryptographic-hashing)
  - [Ed25519 Digital Signatures](#ed25519-digital-signatures)
  - [Syndication](#syndication)
- [CLI Commands](#cli-commands)
  - [kg audit query](#kg-audit-query)
  - [kg audit checkpoint](#kg-audit-checkpoint)
  - [kg audit verify](#kg-audit-verify)
  - [kg audit sync status](#kg-audit-sync-status)
  - [kg audit sync peers](#kg-audit-sync-peers)
  - [kg audit sync now](#kg-audit-sync-now)
  - [kg audit export](#kg-audit-export)
  - [kg audit stats](#kg-audit-stats)
- [MCP Tools](#mcp-tools)
  - [kg_audit_query](#kg_audit_query)
  - [kg_audit_checkpoint](#kg_audit_checkpoint)
  - [kg_sync_status](#kg_sync_status)
- [Use Cases](#use-cases)
- [Configuration Options](#configuration-options)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)

---

## Overview

The Exochain audit integration provides a cryptographically secure, append-only log for tracking all changes to the knowledge graph. It enables:

- **Immutable audit trails**: Every operation on the knowledge graph is recorded as a signed event
- **Distributed synchronization**: Events can be synchronized across multiple environments
- **Tamper detection**: Cryptographic hashing and signatures detect any unauthorized modifications
- **Causal ordering**: Hybrid Logical Clocks ensure deterministic event ordering even across distributed systems
- **Checkpoint finality**: Periodic checkpoints provide BFT (Byzantine Fault Tolerant) finality guarantees

### Architecture

```
+-------------------+     +-------------------+     +-------------------+
|   Knowledge       |     |   Audit Chain     |     |   Syndication     |
|   Graph Agent     |---->|   (DAG-BFT)       |<--->|   Service         |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
        v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|   Events:         |     |   Storage:        |     |   Peers:          |
|   - NodeCreated   |     |   - Memory        |     |   - HTTP/WebSocket|
|   - EdgeCreated   |     |   - File          |     |   - Auto-sync     |
|   - Workflow*     |     |   - PostgreSQL    |     |   - Conflict res. |
+-------------------+     +-------------------+     +-------------------+
```

---

## Key Concepts

### DAG-BFT (Directed Acyclic Graph Byzantine Fault Tolerant) Consensus

The Exochain audit log uses a DAG structure instead of a linear blockchain. Each event references its parent events, creating a directed graph that captures causal relationships.

**Benefits:**
- **Higher throughput**: Multiple events can be appended in parallel
- **Causal ordering**: The DAG structure naturally captures happens-before relationships
- **Conflict detection**: Concurrent events are visible as branches in the DAG

**Structure:**
```
Event A (genesis)
    |
    +---> Event B ----+
    |                 |
    +---> Event C ----+---> Event E (merge)
              |
              +---> Event D
```

Each event contains:
- `id`: BLAKE3 hash of the event envelope (content-addressable)
- `parents`: Array of parent event IDs forming the DAG
- `envelope`: Event metadata and payload
- `signature`: Ed25519 signature for authenticity

**BFT Checkpoints:**
Periodic checkpoints achieve finality through 2f+1 validator signatures, where f is the maximum number of Byzantine (malicious) faults tolerated.

### Hybrid Logical Clocks (HLC)

Hybrid Logical Clocks provide deterministic ordering even when physical clocks drift between distributed agents.

**Structure:**
```typescript
interface HybridLogicalClock {
  physicalMs: number;  // Unix timestamp in milliseconds
  logical: number;     // Logical counter for same-ms events
}
```

**Ordering Rules:**
1. If `physicalMs` differs, use physical time for ordering
2. If `physicalMs` is equal, use the `logical` counter
3. Events are causally ordered: an event's HLC is always greater than its parents'

**Example:**
```
Event A: { physicalMs: 1704067200000, logical: 0 }
Event B: { physicalMs: 1704067200000, logical: 1 }  // Same ms, higher logical
Event C: { physicalMs: 1704067200001, logical: 0 }  // Higher physical time
```

### BLAKE3 Cryptographic Hashing

BLAKE3 is used for event IDs and Merkle tree construction, providing:

- **Fast hashing**: 4x faster than SHA-256 on modern CPUs
- **Collision resistance**: 256-bit security level
- **Incremental hashing**: Efficient for streaming data

**Usage:**
- Event IDs are BLAKE3 hashes of the canonical event envelope
- Merkle roots are computed from ordered event ID lists
- State roots capture the current graph state

**Format:** 64-character hexadecimal string (32 bytes)

```
Example: 0000000000000000a1b2c3d4e5f67890abcdef0123456789fedcba9876543210
```

### Ed25519 Digital Signatures

Ed25519 signatures provide:

- **Authenticity**: Verify events came from the claimed author
- **Non-repudiation**: Authors cannot deny creating signed events
- **Compact signatures**: 64-byte signatures, 32-byte public keys

**Format:** 128-character hexadecimal string (64 bytes)

**Author Identification:**
Authors are identified by DIDs (Decentralized Identifiers):
```
did:exo:agent-abc123
did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
```

### Syndication

Syndication enables cross-environment synchronization of audit events.

**Features:**
- **Bidirectional sync**: Events flow in both directions between peers
- **Conflict detection**: DAG branches reveal concurrent operations
- **Automatic retry**: Exponential backoff for failed sync attempts
- **Health monitoring**: Track peer status, latency, and error rates

**Sync Protocol:**
1. Request missing events since last known checkpoint
2. Validate received events (signature, causality, parents)
3. Insert valid events into local chain
4. Send local events unknown to peer

---

## CLI Commands

All audit commands are accessed through the `kg audit` command group.

### kg audit query

Query the audit log with filtering options.

**Syntax:**
```bash
kg audit query [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-t, --type <type>` | Filter by event type | All types |
| `-s, --start <date>` | Start date (ISO format) | Beginning |
| `-e, --end <date>` | End date (ISO format) | Now |
| `-l, --limit <n>` | Maximum results | 50 |
| `-a, --author <did>` | Filter by author DID | All authors |
| `--json` | Output as JSON | Table format |
| `-p, --path <path>` | Project root path | Current directory |

**Examples:**

```bash
# Query all events (default limit: 50)
kg audit query

# Query NodeCreated events only
kg audit query --type NodeCreated

# Query events from a specific date range
kg audit query --start 2024-01-01 --end 2024-01-31

# Query with author filter and JSON output
kg audit query --author "did:exo:agent-abc123" --json

# Query last 100 workflow events
kg audit query --type WorkflowCompleted --limit 100
```

**Output (table format):**
```
  Audit Log Query Results

  Found 127 events (showing 50)
  (more results available, increase --limit to see more)

  ID              Type                    Author              Timestamp
  ----------------------------------------------------------------------------------
  a1b2c3d4e5f6..  NodeCreated             did:exo:agent-1..   2024-01-15 14:30:45 (L:0)
  b2c3d4e5f678..  EdgeCreated             did:exo:agent-1..   2024-01-15 14:30:46 (L:0)
  c3d4e5f67890..  WorkflowStarted         did:exo:agent-2..   2024-01-15 14:31:00 (L:0)
  ...

  Chain status: healthy
```

### kg audit checkpoint

Create a checkpoint in the audit chain for finality.

**Syntax:**
```bash
kg audit checkpoint [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-n, --name <name>` | Checkpoint name/label | None |
| `-t, --tags <tags>` | Comma-separated tags | None |
| `--json` | Output as JSON | Formatted output |
| `-p, --path <path>` | Project root path | Current directory |

**Examples:**

```bash
# Create a simple checkpoint
kg audit checkpoint

# Create a named checkpoint before migration
kg audit checkpoint --name "pre-migration-v2.0"

# Create a tagged checkpoint
kg audit checkpoint --tags "release,production,v1.5.0"

# Create checkpoint with name, tags, and JSON output
kg audit checkpoint --name "daily-backup" --tags "backup,automated" --json
```

**Output:**
```
Checkpoint created!

  Checkpoint Details

  Name: pre-migration-v2.0
  Tags: migration, backup

  Latest Checkpoint
    Height:     5
    Event root: a1b2c3d4e5f6789012345678901234567890...
    State root: b2c3d4e5f678901234567890123456789012...
    Timestamp:  2024-01-15 14:45:00
    Signatures: 1
```

### kg audit verify

Verify the integrity of the audit chain.

**Syntax:**
```bash
kg audit verify [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--full` | Perform full chain verification | Quick check |
| `--json` | Output as JSON | Formatted output |
| `-p, --path <path>` | Project root path | Current directory |

**Examples:**

```bash
# Quick verification (checks chain health and structure)
kg audit verify

# Full verification (validates all events, parents, signatures)
kg audit verify --full

# Verification with JSON output for CI/CD integration
kg audit verify --full --json
```

**Output (valid chain):**
```
  Audit Chain Verification

  Status: VALID

  Statistics
    Events verified:    1,234
    Checkpoint height:  12
    Chain tips:         1
    Verification time:  245ms
```

**Output (invalid chain):**
```
  Audit Chain Verification

  Status: INVALID

  Statistics
    Events verified:    1,234
    Checkpoint height:  12
    Chain tips:         3
    Verification time:  1.2s

  Issues Found
    - Event a1b2c3d4.. references missing parent b2c3d4e5..
    - Chain status is degraded

  Warnings
    - Multiple genesis events found: 2
```

### kg audit sync status

Check the synchronization status with peers.

**Syntax:**
```bash
kg audit sync status [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | Formatted output |
| `-p, --path <path>` | Project root path | Current directory |

**Examples:**

```bash
# Check sync status
kg audit sync status

# Get JSON output for monitoring
kg audit sync status --json
```

**Output:**
```
  Sync Status

  Service
    Running:      Yes
    Auto-sync:    Enabled
    Interval:     5.0m

  Peers
    Total:        3
    Connected:    2
    Syncing:      1
    Errors:       0

  Transfer Statistics
    Events received: 1,234
    Events sent:     567

  Chain
    Status:       healthy
    Events:       5,432
    Checkpoint:   54
```

### kg audit sync peers

List all configured sync peers with their status.

**Syntax:**
```bash
kg audit sync peers [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | Table format |
| `-p, --path <path>` | Project root path | Current directory |

**Examples:**

```bash
# List all peers
kg audit sync peers

# Get detailed peer info as JSON
kg audit sync peers --json
```

**Output:**
```
  Sync Peers

  ID              Status        Last Sync              Events (Rx/Tx)
  ----------------------------------------------------------------------
  peer-abc123     connected     2024-01-15 14:30:00    450/123
  peer-def456     syncing       2024-01-15 14:29:30    320/98
  peer-ghi789     error         2024-01-15 14:00:00    100/50
     Error: Connection timeout

  Total: 3, Connected: 1, Errors: 1
```

### kg audit sync now

Force immediate synchronization with all peers.

**Syntax:**
```bash
kg audit sync now [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | Formatted output |
| `-p, --path <path>` | Project root path | Current directory |

**Examples:**

```bash
# Force sync with all peers
kg audit sync now

# Force sync with JSON output
kg audit sync now --json
```

**Output:**
```
  Sync Results

  Peer            Status    Received  Sent      Duration
  ------------------------------------------------------------
  peer-abc123     OK        45        12        1.2s
  peer-def456     OK        30        8         0.8s
  peer-ghi789     FAIL      0         0         5.0s
     Error: Connection refused

  Peers: 3 (2 successful, 1 failed)
  Events: 75 received, 20 sent
```

### kg audit export

Export audit log data to a file.

**Syntax:**
```bash
kg audit export [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <file>` | Output file path | stdout |
| `-f, --format <format>` | Export format (json, jsonl) | json |
| `-t, --type <type>` | Filter by event type | All types |
| `-s, --start <date>` | Start date filter | Beginning |
| `-e, --end <date>` | End date filter | Now |
| `-l, --limit <n>` | Maximum events | All events |
| `-p, --path <path>` | Project root path | Current directory |

**Examples:**

```bash
# Export all events to a file
kg audit export --output audit-backup.json

# Export as JSON Lines (one event per line)
kg audit export --format jsonl --output audit-stream.jsonl

# Export filtered events
kg audit export --type NodeCreated --start 2024-01-01 --output nodes.json

# Export to stdout for piping
kg audit export --format jsonl | gzip > audit.jsonl.gz
```

**JSON Output Structure:**
```json
{
  "metadata": {
    "exportedAt": "2024-01-15T14:45:00.000Z",
    "chainStatus": "healthy",
    "totalEvents": 1234,
    "exportedEvents": 1234,
    "checkpointHeight": 12,
    "filters": {
      "type": null,
      "startDate": null,
      "endDate": null,
      "limit": null
    }
  },
  "checkpoint": {
    "height": 12,
    "eventRoot": "a1b2c3d4...",
    "stateRoot": "b2c3d4e5...",
    "timestamp": "2024-01-15T14:00:00.000Z",
    "signatures": 1
  },
  "events": [
    {
      "id": "a1b2c3d4...",
      "type": "NodeCreated",
      "author": "did:exo:agent-1",
      "timestamp": "2024-01-15T10:00:00.000Z",
      "hlc": { "physicalMs": 1705312800000, "logical": 0 },
      "parents": [],
      "payload": { "type": "NodeCreated", "nodeId": "...", "nodeType": "..." },
      "signature": "..."
    }
  ],
  "tips": ["latest-event-id"]
}
```

### kg audit stats

Show audit chain statistics.

**Syntax:**
```bash
kg audit stats [options]
```

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | Formatted output |
| `-p, --path <path>` | Project root path | Current directory |

**Examples:**

```bash
# Show statistics
kg audit stats

# Get JSON output
kg audit stats --json
```

**Output:**
```
  Audit Chain Statistics

  Overview
    Status:           healthy
    Total events:     5,432
    Checkpoint height: 54
    Unique authors:   3
    Last event:       2024-01-15 14:45:32

  Events by Type
    NodeCreated              1234 ||||||||||||||||||||||||
    EdgeCreated               890 ||||||||||||||||||
    WorkflowCompleted         456 |||||||||
    QueryExecuted            2000 ||||||||||||||||||||||||||||||||||||||||
    ...

  Latest Checkpoint
    Height:     54
    Event root: a1b2c3d4e5f6789012345678901234567890...
    State root: b2c3d4e5f678901234567890123456789012...
    Timestamp:  2024-01-15 14:00:00
    Signatures: 1

  Chain Tips
    Count: 1
    - a1b2c3d4e5f6789012345678901234567890...
```

---

## MCP Tools

The Exochain audit integration exposes MCP tools for programmatic access from AI agents.

### kg_audit_query

Query audit events via MCP.

**Schema:**
```json
{
  "name": "kg_audit_query",
  "description": "Query the audit log for events with filtering by type, time range, and limit.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "eventType": {
        "type": "string",
        "description": "Filter by event type (e.g., NodeCreated, WorkflowCompleted)"
      },
      "startTime": {
        "type": "string",
        "description": "Start time filter as ISO 8601 timestamp"
      },
      "endTime": {
        "type": "string",
        "description": "End time filter as ISO 8601 timestamp"
      },
      "limit": {
        "type": "number",
        "description": "Maximum number of results (default: 50, max: 1000)",
        "default": 50,
        "minimum": 1,
        "maximum": 1000
      },
      "includePayload": {
        "type": "boolean",
        "description": "Include the full event payload in results",
        "default": false
      }
    }
  }
}
```

**Example Request:**
```json
{
  "eventType": "NodeCreated",
  "startTime": "2024-01-01T00:00:00Z",
  "limit": 100,
  "includePayload": true
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "a1b2c3d4e5f6...",
        "type": "NodeCreated",
        "author": "did:exo:agent-1",
        "timestamp": "2024-01-15T10:00:00.000Z",
        "hlc": { "physicalMs": 1705312800000, "logical": 0 },
        "parentCount": 1,
        "payload": {
          "type": "NodeCreated",
          "nodeId": "node-123",
          "nodeType": "Document",
          "data": { "title": "README.md" }
        },
        "signature": "...",
        "parents": ["parent-event-id"]
      }
    ],
    "count": 1,
    "totalCount": 150,
    "hasMore": true,
    "filters": {
      "eventType": "NodeCreated",
      "startTime": "2024-01-01T00:00:00Z",
      "endTime": null
    }
  },
  "metadata": {
    "executionTime": 45,
    "itemCount": 1
  }
}
```

### kg_audit_checkpoint

Create a checkpoint via MCP.

**Schema:**
```json
{
  "name": "kg_audit_checkpoint",
  "description": "Create a checkpoint in the audit chain for finality.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Optional name for the checkpoint"
      },
      "tags": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Optional tags for categorizing the checkpoint"
      }
    }
  }
}
```

**Example Request:**
```json
{
  "name": "pre-deployment",
  "tags": ["deployment", "production"]
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "height": 15,
    "eventRoot": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    "stateRoot": "b2c3d4e5f678901234567890123456789012345678901234567890123456789012",
    "timestamp": "2024-01-15T15:00:00.000Z",
    "validatorCount": 1,
    "metadata": {
      "name": "pre-deployment",
      "tags": ["deployment", "production"]
    },
    "stats": {
      "totalEventsAtCheckpoint": 5500,
      "eventsSincePreviousCheckpoint": 100,
      "previousCheckpointHeight": 14
    }
  },
  "metadata": {
    "executionTime": 125
  }
}
```

### kg_sync_status

Check synchronization status via MCP.

**Schema:**
```json
{
  "name": "kg_sync_status",
  "description": "Check the syndication status of the audit chain across peer environments.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "peerId": {
        "type": "string",
        "description": "Specific peer ID to check (optional)"
      },
      "detailed": {
        "type": "boolean",
        "description": "Include detailed sync metrics",
        "default": false
      }
    }
  }
}
```

**Example Request (all peers):**
```json
{
  "detailed": true
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "peers": [
      {
        "id": "peer-abc123",
        "endpoint": "https://peer1.example.com/audit",
        "status": "connected",
        "lastSyncTime": "2024-01-15T14:55:00.000Z",
        "errorCount": 0,
        "lastError": null,
        "metrics": {
          "eventsReceived": 1234,
          "eventsSent": 567,
          "latency": 45,
          "lastCheckpointHeight": 14
        }
      }
    ],
    "peersByStatus": {
      "connected": [...],
      "syncing": [],
      "disconnected": [],
      "error": []
    },
    "summary": {
      "totalPeers": 2,
      "connectedPeers": 2,
      "syncingPeers": 0,
      "errorPeers": 0
    },
    "serviceStatus": {
      "running": true,
      "autoSyncEnabled": true,
      "syncInterval": 300000,
      "syncing": false
    },
    "aggregateMetrics": {
      "totalEventsReceived": 2500,
      "totalEventsSent": 1200,
      "totalErrors": 0
    }
  },
  "metadata": {
    "executionTime": 12,
    "itemCount": 2
  }
}
```

---

## Use Cases

### Compliance Auditing

Track all knowledge graph operations for regulatory compliance.

```bash
# Export all events for a compliance period
kg audit export \
  --start 2024-01-01 \
  --end 2024-03-31 \
  --output Q1-2024-audit.json

# Verify chain integrity before submission
kg audit verify --full

# Create a compliance checkpoint
kg audit checkpoint --name "Q1-2024-compliance" --tags "compliance,quarterly"
```

### Knowledge Graph Change Tracking

Monitor changes to the knowledge graph over time.

```bash
# Track node creation patterns
kg audit query --type NodeCreated --limit 1000 --json | \
  jq '.events | group_by(.payload.nodeType) | map({type: .[0].payload.nodeType, count: length})'

# Find workflow failures
kg audit query --type WorkflowCompleted --json | \
  jq '.events | map(select(.payload.outcome == "failure"))'

# Track changes by author
kg audit query --author "did:exo:agent-analyzer" --limit 500
```

### Multi-Environment Synchronization

Keep audit logs consistent across development, staging, and production.

```bash
# Check sync status across environments
kg audit sync status

# Force sync before deployment
kg audit sync now

# Verify chains match after sync
kg audit verify --full
```

### Tamper-Evident Logging

Detect unauthorized modifications to audit data.

```bash
# Regular integrity verification
kg audit verify --full --json > verification-$(date +%Y%m%d).json

# Alert on verification failures
kg audit verify --full || notify-admin "Audit chain integrity check failed"

# Create verification checkpoints
kg audit checkpoint --name "integrity-check-$(date +%Y%m%d)" --tags "verification"
```

### Provenance Tracking

Track the origin and history of knowledge graph entities.

```bash
# Find all events related to a specific node
kg audit query --json | \
  jq --arg nodeId "node-123" '.events | map(select(.payload.nodeId == $nodeId))'

# Trace workflow execution history
kg audit query --type WorkflowStarted --json | \
  jq '.events | map({workflowId: .payload.workflowId, trigger: .payload.trigger, timestamp: .timestamp})'
```

---

## Configuration Options

Configuration is managed through environment variables:

### Core Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `EXOCHAIN_BACKEND` | Storage backend (memory, file, postgres) | `memory` |
| `EXOCHAIN_AGENT_DID` | Agent's Decentralized Identifier | Auto-generated |
| `EXOCHAIN_PRIVATE_KEY` | Ed25519 private key (128 hex chars) | None |
| `EXOCHAIN_ENABLE_CONSENSUS` | Enable BFT consensus | `false` |
| `EXOCHAIN_CONSENSUS_TYPE` | Consensus mechanism | `none` |
| `EXOCHAIN_CHECKPOINT_INTERVAL` | Events between checkpoints | `100` |

### File Backend Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `EXOCHAIN_DATA_DIR` | Directory for audit data | `.exochain` |
| `EXOCHAIN_MAX_FILE_SIZE` | Max file size before rotation | `10485760` (10MB) |
| `EXOCHAIN_ROTATE_AFTER_EVENTS` | Events before file rotation | `10000` |

### PostgreSQL Backend Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://localhost:5432/kg_agent` |
| `EXOCHAIN_SCHEMA` | Database schema name | `exochain` |

### Syndication Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `EXOCHAIN_ENABLE_SYNDICATION` | Enable peer syndication | `false` |
| `EXOCHAIN_SYNDICATION_INTERVAL` | Sync interval (ms) | `300000` (5 min) |
| `EXOCHAIN_PEER_ENDPOINTS` | Comma-separated peer URLs | None |

### Example Configuration

```bash
# Production configuration
export EXOCHAIN_BACKEND=postgres
export EXOCHAIN_AGENT_DID="did:exo:prod-agent-001"
export EXOCHAIN_PRIVATE_KEY="<128-char-hex-key>"
export EXOCHAIN_ENABLE_CONSENSUS=true
export EXOCHAIN_CONSENSUS_TYPE=byzantine
export EXOCHAIN_CHECKPOINT_INTERVAL=100

export DATABASE_URL="postgres://user:pass@db.example.com:5432/kg_audit"
export EXOCHAIN_SCHEMA="audit_prod"

export EXOCHAIN_ENABLE_SYNDICATION=true
export EXOCHAIN_SYNDICATION_INTERVAL=60000
export EXOCHAIN_PEER_ENDPOINTS="https://peer1.example.com/audit,https://peer2.example.com/audit"
```

---

## Security Considerations

### Cryptographic Key Management

1. **Private Key Protection**
   - Store Ed25519 private keys in secure key management systems (AWS KMS, HashiCorp Vault)
   - Never commit private keys to version control
   - Rotate keys periodically according to security policy

2. **DID Management**
   - Use unique DIDs per environment/agent
   - Document DID-to-agent mappings for auditing
   - Consider DID resolution for verifiable credentials

### Data Integrity

1. **Signature Verification**
   - Always verify signatures when importing external events
   - Reject events with invalid signatures
   - Log signature verification failures

2. **Chain Integrity**
   - Run periodic integrity checks (`kg audit verify --full`)
   - Alert on any verification failures
   - Maintain offline backups of checkpoints

### Access Control

1. **Read Access**
   - Audit logs may contain sensitive operation data
   - Implement role-based access for query operations
   - Consider data masking for sensitive payloads

2. **Write Access**
   - Only authorized agents should append events
   - Validate agent DIDs against allowlists
   - Monitor for unexpected authors

### Network Security

1. **Peer Communication**
   - Use TLS for all peer-to-peer communication
   - Authenticate peers using mutual TLS or signed challenges
   - Validate peer DIDs before accepting sync requests

2. **Sync Protection**
   - Rate limit sync requests to prevent DoS
   - Validate event counts and sizes during sync
   - Implement sync request signing

---

## Best Practices

### Checkpoint Strategy

1. **Regular Checkpoints**
   - Create checkpoints at regular intervals (default: every 100 events)
   - Create named checkpoints before major operations (migrations, deployments)
   - Tag checkpoints for easy filtering

2. **Checkpoint Retention**
   - Retain all checkpoints for compliance periods
   - Archive old checkpoints to cold storage
   - Document checkpoint retention policy

### Synchronization

1. **Peer Configuration**
   - Configure at least 2 peers for redundancy
   - Use geographic distribution for disaster recovery
   - Monitor peer health continuously

2. **Sync Intervals**
   - Balance sync frequency with network overhead
   - Use shorter intervals for critical environments
   - Consider event-driven sync for real-time needs

### Monitoring

1. **Key Metrics**
   - Event append rate
   - Sync success/failure rates
   - Chain verification status
   - Peer connection health

2. **Alerting**
   - Alert on chain verification failures
   - Alert on persistent peer disconnections
   - Alert on unusual event patterns

### Performance

1. **Query Optimization**
   - Use event type filters to reduce result sets
   - Paginate large queries with limit/offset
   - Consider caching frequently accessed events

2. **Storage Management**
   - Monitor storage usage growth
   - Implement file rotation for file backend
   - Plan PostgreSQL partitioning for large deployments

### Development Workflow

1. **Testing**
   - Use memory backend for unit tests
   - Create test checkpoints for integration tests
   - Verify chain integrity in CI/CD pipelines

2. **Debugging**
   - Use `--json` output for programmatic analysis
   - Export relevant events for issue investigation
   - Include event IDs in error reports

---

## Event Types Reference

The following event types are supported:

| Event Type | Description |
|------------|-------------|
| `NodeCreated` | Knowledge graph node created |
| `NodeUpdated` | Knowledge graph node updated |
| `NodeDeleted` | Knowledge graph node deleted |
| `EdgeCreated` | Knowledge graph edge created |
| `EdgeDeleted` | Knowledge graph edge deleted |
| `QueryExecuted` | Graph query executed |
| `WorkflowStarted` | Workflow execution started |
| `WorkflowCompleted` | Workflow execution completed |
| `WorkflowStepCompleted` | Individual workflow step completed |
| `GapDetected` | Documentation gap detected |
| `TaskSpecGenerated` | Task specification generated |
| `ConflictDetected` | Multi-agent conflict detected |
| `ConflictResolved` | Multi-agent conflict resolved |
| `SyncStarted` | Peer synchronization started |
| `SyncCompleted` | Peer synchronization completed |
| `CheckpointCreated` | Chain checkpoint created |

---

## Troubleshooting

### Common Issues

**Chain verification fails with "missing parent"**
- Events may have been imported out of order
- Re-sync with peers to obtain missing events
- Check for network issues during previous syncs

**Peer connection errors**
- Verify peer endpoint URLs are correct
- Check network connectivity and firewall rules
- Verify TLS certificates are valid

**High HLC logical counter values**
- Clock drift between agents
- High-frequency event appending
- Consider clock synchronization (NTP)

**Storage growth issues**
- Enable file rotation for file backend
- Implement PostgreSQL partitioning
- Archive old events to cold storage
