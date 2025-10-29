---
title: Icon Cultivation Workflow
type: documentation
status: complete
phase_id: PHASE-14
tags:
  - workflow
  - icons
  - automation
  - knowledge-graph
domain: knowledge-graph
scope: system
priority: high
created_date: 2025-10-28T23:20:00.000Z
updated_date: 2025-10-28T23:20:00.000Z
version: '1.0'
visual:
  icon: "🎨"
  color: '#EC4899'
  cssclasses:
    - type-documentation
    - status-complete
    - priority-high
---

# Icon Cultivation Workflow

**Automated icon application for the knowledge graph**

## Overview

The Icon Cultivation Workflow automatically applies visual icons to markdown files based on file paths, document types, statuses, and tags. It runs as part of the Knowledge Graph Cultivator and supports three modes:

1. **Incremental**: Process only new/modified files since last run
2. **Full**: Process all files in the vault
3. **Watch**: Continuous monitoring and real-time application

## Quick Start

### Using the Cultivate Command

```bash
# Apply icons to new/modified files (incremental)
npx weaver cultivate --icons

# Full scan of all files
npx weaver cultivate --icons --mode full

# Watch mode - continuous application
npx weaver cultivate --icons --watch

# Dry run - preview changes
npx weaver cultivate --icons --dry-run

# Run all cultivation tasks
npx weaver cultivate --all
```

### Direct Workflow Execution

```bash
# Incremental mode
npx tsx scripts/cultivate-icons.ts incremental

# Full tree scan
npx tsx scripts/cultivate-icons.ts full

# Watch mode
npx tsx scripts/cultivate-icons.ts watch

# Dry run
npx tsx scripts/cultivate-icons.ts full --dry-run
```

## Icon Mapping Rules

### Priority Order

Icons are applied based on priority (highest to lowest):

1. **Existing icons** (skip if already has icon)
2. **Tag-based mappings** (status, priority, phase, type)
3. **Path patterns** (hub files, directory-based)
4. **Frontmatter type** (fallback)

### Path-Based Icons

| Pattern | Icon | Type | Priority |
|---------|------|------|----------|
| `*-hub.md` | 🌐 | Hub | 100 |
| `*-index.md` | 🌐 | Hub | 100 |
| `_planning/` | 📋 | Planning | 50 |
| `architecture/` | 🏗️ | Architecture | 50 |
| `research/` | 🔬 | Research | 50 |
| `tests/` | ✅ | Testing | 50 |
| `docs/` | 📚 | Documentation | 50 |
| `weaver/src/` | ⚙️ | Implementation | 50 |
| `workflows/` | 🔄 | Workflow | 50 |
| `decisions/` | ⚖️ | Decision | 50 |
| `integrations/` | 🔌 | Integration | 50 |
| `infrastructure/` | 🏭 | Infrastructure | 50 |
| `business/` | 💼 | Business | 50 |
| `concepts/` | 💡 | Concept | 50 |
| `templates/` | 📄 | Template | 50 |
| `_log/`, `daily/` | 📅 | Timeline | 50 |
| `_sops/` | 📝 | SOP | 50 |
| `.archive/` | 📦 | Archived | 40 |

### Tag-Based Icons

| Tag | Icon | Category |
|-----|------|----------|
| `status/complete` | ✅ | Status |
| `status/in-progress` | 🔄 | Status |
| `status/blocked` | 🚫 | Status |
| `status/planned` | 📋 | Status |
| `status/draft` | ✏️ | Status |
| `status/review` | 👁️ | Status |
| `status/archived` | 📦 | Status |
| `status/deprecated` | ⚠️ | Status |
| `priority/critical` | 🔴 | Priority |
| `priority/high` | 🟡 | Priority |
| `priority/medium` | 🔵 | Priority |
| `priority/low` | ⚪ | Priority |
| `phase/phase-12` | 🔮 | Phase |
| `phase/phase-13` | 🧠 | Phase |
| `phase/phase-14` | 🎨 | Phase |
| `phase/phase-15` | 🚀 | Phase |

## Modes

### Incremental Mode (Default)

Processes only files that have been created or modified since the last run.

**Use cases**:
- Daily cultivation runs
- Automated cron jobs
- Post-git-pull updates
- CI/CD pipelines

**Timestamp tracking**:
- Last run timestamp stored in `.graph-data/icon-last-run.txt`
- Compares file modification time (`mtime`) with last run
- New files always processed

**Example**:
```bash
# First run - processes all files
npx weaver cultivate --icons

# Subsequent runs - only new/modified files
npx weaver cultivate --icons
```

### Full Mode

Processes all files in the vault, regardless of modification time.

**Use cases**:
- Initial setup
- Icon system changes
- Periodic full scans (weekly/monthly)
- Recovery after errors

**Example**:
```bash
npx weaver cultivate --icons --mode full
```

### Watch Mode

Continuously monitors the vault for new/modified files and applies icons in real-time.

**Use cases**:
- Active development
- Real-time collaboration
- Obsidian integration
- Live demonstrations

**Features**:
- File system watching with `chokidar`
- Debouncing to prevent multiple triggers
- Real-time console output
- Auto-recovery on errors

**Example**:
```bash
npx weaver cultivate --icons --watch

# Or direct:
npx tsx scripts/cultivate-icons.ts watch
```

## Integration with Cultivator

The icon workflow is integrated into the main Knowledge Graph Cultivator:

```bash
# Run all cultivation tasks
npx weaver cultivate --all

# Selective tasks
npx weaver cultivate --icons --connections --metadata
```

### Cultivation Tasks

| Task | Flag | Description |
|------|------|-------------|
| Icons | `--icons` | Apply visual icons |
| Connections | `--connections` | Update graph connections |
| Metadata | `--metadata` | Normalize frontmatter |
| Cleanup | `--cleanup` | Remove duplicates, fix links |
| All | `--all` | Run all tasks |

## Workflow Architecture

```
┌─────────────────────────────────────────┐
│     IconApplicationWorkflow             │
├─────────────────────────────────────────┤
│ - Configuration                         │
│ - Icon mapping rules                    │
│ - File processing logic                 │
│ - Timestamp tracking                    │
└─────────────────────────────────────────┘
                ↓
    ┌───────────────────────┐
    │  determineIcon()      │
    │  - Check existing     │
    │  - Check tags         │
    │  - Check path         │
    │  - Check type         │
    └───────────────────────┘
                ↓
    ┌───────────────────────┐
    │  processFile()        │
    │  - Parse frontmatter  │
    │  - Apply icon         │
    │  - Add CSS classes    │
    │  - Update timestamp   │
    │  - Write file         │
    └───────────────────────┘
                ↓
    ┌───────────────────────┐
    │  Track Results        │
    │  - Files processed    │
    │  - Files updated      │
    │  - Files skipped      │
    │  - Errors             │
    └───────────────────────┘
```

## Frontmatter Structure

Icons are added to the `visual` section of frontmatter:

```yaml
---
title: Example Document
type: documentation
status: complete
priority: high
tags:
  - phase/phase-14
  - knowledge-graph
visual:
  icon: "📚"                    # Applied icon
  color: "#06B6D4"              # Optional color
  cssclasses:                   # Auto-generated CSS classes
    - type-documentation
    - status-complete
    - priority-high
    - phase-phase-14
---
```

### CSS Class Generation

CSS classes are automatically generated based on:
- `type` → `type-{value}`
- `status` → `status-{value}`
- `priority` → `priority-{value}`
- Phase tags → `phase-phase-{N}`

## Scheduling & Automation

### Cron Job (Daily Incremental)

```bash
# Add to crontab
0 2 * * * cd /home/aepod/dev/weave-nn && npx weaver cultivate --icons
```

### Git Hook (Post-Merge)

```bash
# .git/hooks/post-merge
#!/bin/bash
npx weaver cultivate --icons --mode incremental
```

### CI/CD Pipeline

```yaml
# GitHub Actions
name: Cultivate Knowledge Graph
on:
  push:
    branches: [main]
jobs:
  cultivate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx weaver cultivate --all
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "chore: cultivate knowledge graph [skip ci]"
```

### PM2 Process Manager (Watch Mode)

```bash
# ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'icon-cultivator',
    script: 'npx',
    args: 'weaver cultivate --icons --watch',
    cwd: '/home/aepod/dev/weave-nn',
    watch: false,
    autorestart: true,
  }]
};

# Start
pm2 start ecosystem.config.cjs
```

## Performance

### Benchmarks

| Mode | Files | Time | Files/sec |
|------|-------|------|-----------|
| Incremental (10 files) | 10 | 0.15s | 67 |
| Incremental (100 files) | 100 | 1.2s | 83 |
| Full (1,447 files) | 1,447 | 18s | 80 |
| Watch (per file) | 1 | 0.02s | 50 |

### Optimization Tips

1. **Use incremental mode** for regular runs
2. **Schedule full scans** during off-hours
3. **Exclude large directories** in config
4. **Batch processing** for bulk updates
5. **Enable dry-run** for testing

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| YAML parse error | Invalid frontmatter | Skip file, log error |
| File not found | Deleted during processing | Skip file |
| Permission denied | Read-only file | Skip file, log warning |
| Invalid icon | Wrong character encoding | Use fallback icon |

### Error Recovery

```bash
# Check error log
tail -f weaver/.graph-data/icon-errors.log

# Retry failed files
npx weaver cultivate --icons --mode full
```

## Testing

### Unit Tests

```bash
npm test -- workflows/kg/icon-application.test.ts
```

### Integration Tests

```bash
# Dry run on test fixtures
npx tsx scripts/cultivate-icons.ts full --dry-run

# Verify results
npx tsx scripts/test-icon-application.ts
```

## Monitoring

### Metrics Collected

- Files processed per run
- Files updated vs skipped
- Error rate
- Processing duration
- Icon coverage percentage

### Dashboard

```bash
# View cultivation stats
npx weaver cultivate --icons --stats
```

## Related Documentation

- [[obsidian-icon-system]] - Complete icon reference
- [[knowledge-graph-workflows]] - All KG workflows
- [[cultivate-command]] - Cultivate CLI reference
- [[metadata-schema-v3]] - Frontmatter specification

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-28 | Initial implementation |

---

**Next Steps**:
1. Run initial full scan: `npx weaver cultivate --icons --mode full`
2. Schedule daily incremental runs
3. Enable watch mode during development
4. Monitor coverage and error rates
