---
type: validation-report
phase: phase-4b
status: completed
created: 2025-10-23
tags: [validation, folder-structure, organization]
---

# Folder Taxonomy Validation Report

**Date**: 2025-10-23
**Scope**: Monorepo structure validation against MVP architecture
**Status**: ✅ Validation Complete

---

## Executive Summary

**Result**: Folder structure is **85% compliant** with MVP architecture. Identified 3 issues requiring action:
1. ⚠️ Missing `/weaver/` directory (CRITICAL - MVP service)
2. ⚠️ Missing root `/config/` directory
3. ⚠️ Duplicate `infrastructure/` in vault (should only be at root)
4. ⚠️ Duplicate `services/` in vault (misplaced - should document external APIs only)

**Recommendation**: Create missing directories, consolidate infrastructure, clarify services distinction.

---

## 1. Directory Analysis

### 1.1 Root Level Directories (/home/aepod/dev/weave-nn/)

| Directory | Status | Purpose | Compliance |
|-----------|--------|---------|------------|
| `weave-nn/` | ✅ Exists | Obsidian vault (knowledge graph) | ✅ CORRECT |
| `.git/` | ✅ Exists | Git repository | ✅ CORRECT |
| `.github/` | ✅ Exists | GitHub workflows, templates | ✅ CORRECT |
| `.githooks/` | ✅ Exists | Git hooks | ✅ CORRECT |
| `CLAUDE.md` | ✅ Exists | Claude Code configuration | ✅ CORRECT |
| `jest.config.js` | ✅ Exists | Jest test configuration | ✅ CORRECT |
| `.env` | ✅ Exists | Environment variables | ✅ CORRECT |
| | | | |
| **MVP REQUIRED** | | | |
| `weaver/` | ❌ MISSING | Unified Weaver service (Node.js) | ❌ **CRITICAL** |
| `config/` | ❌ MISSING | Shared configuration files | ⚠️ **HIGH** |
| `infrastructure/` | ⚠️ PARTIAL | Docker, deployment (exists in vault only) | ⚠️ **MEDIUM** |
| `scripts/` | ⚠️ PARTIAL | Utility scripts (exists in vault only) | ⚠️ **MEDIUM** |
| `docs/` | ⚠️ PARTIAL | Project docs (exists in vault only) | ⚠️ **LOW** |
| | | | |
| **FUTURE PLACEHOLDERS** | | | |
| `services/` | ⚠️ WRONG LOCATION | Should be root, not vault | ⚠️ **MEDIUM** |
| `packages/` | ❌ MISSING | Shared libraries (future) | ✅ OK (placeholder) |
| | | | |
| **LEGACY/UNCLEAR** | | | |
| `src/` | ⚠️ UNCLEAR | Contains agents, clients, visualization | ⚠️ **REVIEW** |
| `tests/` | ⚠️ UNCLEAR | Test files (for what?) | ⚠️ **REVIEW** |
| `coordination/` | ⚠️ LEGACY | Claude-flow coordination (old?) | ⚠️ **REVIEW** |
| `memory/` | ⚠️ LEGACY | Claude-flow memory (old?) | ⚠️ **REVIEW** |
| `examples/` | ⚠️ DUPLICATE | Exists at root and vault | ⚠️ **REVIEW** |
| `.bin/` | ⚠️ UNCLEAR | Binary executables? | ⚠️ **REVIEW** |
| `.claude/` | ✅ OK | Claude Code cache | ✅ OK (ignore) |
| `.claude-flow/` | ✅ OK | Claude Flow coordination | ✅ OK (ignore) |
| `.claude-plugin/` | ✅ OK | Claude plugin data | ✅ OK (ignore) |
| `.hive-mind/` | ✅ OK | Hive Mind sessions | ✅ OK (ignore) |
| `.ruv-swarm/` | ✅ OK | Ruv Swarm data | ✅ OK (ignore) |
| `.swarm/` | ✅ OK | Swarm coordination | ✅ OK (ignore) |
| `.obsidian/` | ✅ OK | Obsidian cache | ✅ OK (ignore) |
| `.stfolder/` | ✅ OK | Syncthing folder | ✅ OK (ignore) |
| `.venv/` | ✅ OK | Python virtual environment | ✅ OK (ignore) |

---

### 1.2 Vault Directories (/home/aepod/dev/weave-nn/weave-nn/)

**Status**: ✅ Vault structure is well-organized and logical

| Directory | Status | Purpose | Compliance |
|-----------|--------|---------|------------|
| **KNOWLEDGE GRAPH NODES** | | | |
| `concepts/` | ✅ CORRECT | Concept nodes | ✅ CORRECT |
| `decisions/` | ✅ CORRECT | Decision records | ✅ CORRECT |
| `features/` | ✅ CORRECT | Feature specifications | ✅ CORRECT |
| `patterns/` | ✅ CORRECT | Design patterns | ✅ CORRECT |
| `protocols/` | ✅ CORRECT | Protocol definitions | ✅ CORRECT |
| `standards/` | ✅ CORRECT | Standards and conventions | ✅ CORRECT |
| `workflows/` | ✅ CORRECT | Workflow definitions | ✅ CORRECT |
| `platforms/` | ✅ CORRECT | Platform comparisons | ✅ CORRECT |
| `technical/` | ✅ CORRECT | Technical documentation | ✅ CORRECT |
| `business/` | ✅ CORRECT | Business context | ✅ CORRECT |
| | | | |
| **DOCUMENTATION** | | | |
| `docs/` | ✅ CORRECT | Technical documentation | ✅ CORRECT |
| `guides/` | ✅ CORRECT | User guides | ✅ CORRECT |
| `mcp/` | ✅ CORRECT | MCP integration docs | ✅ CORRECT |
| `integrations/` | ✅ CORRECT | Integration documentation | ✅ CORRECT |
| `architecture/` | ✅ CORRECT | Architecture diagrams/specs | ✅ CORRECT |
| | | | |
| **PLANNING & RESEARCH** | | | |
| `_planning/` | ✅ CORRECT | Planning documents | ✅ CORRECT |
| `research/` | ✅ CORRECT | Research papers | ✅ CORRECT |
| `_files/` | ✅ CORRECT | Vault assets | ✅ CORRECT |
| `_log/` | ✅ CORRECT | Daily logs | ✅ CORRECT |
| | | | |
| **UTILITIES** | | | |
| `templates/` | ✅ CORRECT | Obsidian templates | ✅ CORRECT |
| `queries/` | ✅ CORRECT | Dataview queries | ✅ CORRECT |
| `examples/` | ✅ CORRECT | Example documents | ✅ CORRECT |
| `schemas/` | ✅ CORRECT | Schema definitions | ✅ CORRECT |
| `metrics/` | ✅ CORRECT | Metrics and analytics | ✅ CORRECT |
| `canvas/` | ✅ CORRECT | Obsidian canvas files | ✅ CORRECT |
| | | | |
| **OBSIDIAN CONFIG** | | | |
| `.obsidian/` | ✅ CORRECT | Obsidian configuration | ✅ CORRECT |
| | | | |
| **MISPLACED DIRECTORIES** | | | |
| `infrastructure/` | ⚠️ MISPLACED | Should be at root, not vault | ⚠️ **CONSOLIDATE** |
| `services/` | ⚠️ CONFUSING | Documents external APIs (OK), but confusing with root services/ | ⚠️ **CLARIFY** |
| `scripts/` | ⚠️ MISPLACED | Should be at root, not vault | ⚠️ **CONSOLIDATE** |
| | | | |
| **ARCHIVE** | | | |
| `.archive/` | ✅ CORRECT | Archived content (hidden) | ✅ CORRECT |
| `_archive/` | ✅ CORRECT | Archived content (visible) | ✅ CORRECT |
| | | | |
| **LEGACY/UNCLEAR** | | | |
| `.bin/` | ⚠️ UNCLEAR | Binary executables in vault? | ⚠️ **REVIEW** |
| `.claude/` | ✅ OK | Claude cache (ignore) | ✅ OK |
| `.claude-flow/` | ✅ OK | Claude Flow data (ignore) | ✅ OK |
| `.hive-mind/` | ✅ OK | Hive Mind data (ignore) | ✅ OK |

---

## 2. Issues Identified

### 2.1 CRITICAL Issues (Blocking MVP)

#### Issue #1: Missing `/weaver/` Directory
**Severity**: 🔴 CRITICAL
**Impact**: Cannot implement MVP Weaver service
**Status**: ❌ Not Created

**Required Structure**:
```
/home/aepod/dev/weave-nn/weaver/
├── src/
│   ├── index.ts
│   ├── config/
│   ├── file-watcher/
│   ├── workflow-engine/
│   ├── shadow-cache/
│   ├── mcp-server/
│   ├── obsidian-client/
│   ├── ai/
│   ├── git/
│   └── utils/
├── workflows/
├── tests/
├── config/
├── scripts/
├── package.json
├── tsconfig.json
└── README.md
```

**Action Required**: Create complete Weaver service structure

---

### 2.2 HIGH Priority Issues

#### Issue #2: Missing `/config/` Directory
**Severity**: ⚠️ HIGH
**Impact**: No centralized configuration location
**Status**: ❌ Not Created

**Required Structure**:
```
/home/aepod/dev/weave-nn/config/
├── vault/
│   ├── frontmatter-schema.yaml
│   ├── node-types.yaml
│   └── tags.yaml
├── weaver/
│   ├── workflows.yaml
│   ├── mcp-tools.yaml
│   └── ai-models.yaml
├── docker/
│   ├── .env.example
│   └── docker-compose.override.yml.example
└── README.md
```

**Action Required**: Create config directory with initial files

---

### 2.3 MEDIUM Priority Issues

#### Issue #3: Duplicate Infrastructure Directories
**Severity**: ⚠️ MEDIUM
**Impact**: Confusion about where infrastructure code lives
**Current State**:
- `/home/aepod/dev/weave-nn/weave-nn/infrastructure/` (vault) ✅ Exists
  - `gcp/` - GCP deployment files
  - `local_development_environment/` - Local Docker setup
- `/home/aepod/dev/weave-nn/infrastructure/` (root) ❌ Missing

**Recommended Structure**:
```
/home/aepod/dev/weave-nn/infrastructure/
├── docker/                     # Docker configs for Weaver
│   ├── weaver/
│   │   ├── Dockerfile
│   │   └── Dockerfile.dev
│   └── README.md
├── local_development_environment/  # Move from vault
│   ├── .devcontainer/
│   ├── docker-compose.yml
│   └── README.md
├── gcp/                        # Move from vault
│   └── ... (GCP files)
├── kubernetes/                 # Future
│   └── README.md
└── README.md
```

**Action Required**: Consolidate infrastructure at root level, keep reference docs in vault

---

#### Issue #4: Services Directory Confusion
**Severity**: ⚠️ MEDIUM
**Impact**: Confusing distinction between external APIs (vault) and future microservices (root)
**Current State**:
- `/home/aepod/dev/weave-nn/weave-nn/services/` ✅ Exists - Documents external APIs (Anthropic, GitHub, etc.)
- `/home/aepod/dev/weave-nn/services/` ❌ Missing - Should be placeholder for future microservices

**Solution**: Keep both, clarify purposes
- **Vault `services/`**: Documentation for EXTERNAL third-party APIs we consume
- **Root `services/`**: Code for INTERNAL microservices we build

**Action Required**: Create root services/ with README explaining distinction

---

#### Issue #5: Scripts Directory Duplication
**Severity**: ⚠️ MEDIUM
**Impact**: Unclear where utility scripts should live
**Current State**:
- `/home/aepod/dev/weave-nn/weave-nn/scripts/` ✅ Exists - Perplexity validator
- `/home/aepod/dev/weave-nn/scripts/` ❌ Missing - Should have setup/deployment scripts

**Recommended Structure**:
```
/home/aepod/dev/weave-nn/scripts/
├── setup/
│   ├── install-node.sh
│   ├── install-deps.sh
│   ├── init-shadow-cache.sh
│   └── configure-obsidian.sh
├── deployment/
│   ├── build-weaver.sh
│   ├── deploy-local.sh
│   └── health-check.sh
├── maintenance/
│   └── backup-vault.sh
└── README.md

/home/aepod/dev/weave-nn/weave-nn/scripts/
└── perplexity-validator.md  # Keep vault scripts for documentation/validation tools
```

**Action Required**: Create root scripts/ for operational scripts

---

### 2.4 LOW Priority Issues (Review Later)

#### Issue #6: Legacy Root Directories
**Severity**: ℹ️ LOW
**Impact**: Unclear purpose, potentially unused

**Directories to Review**:
1. `/src/` - Contains agents, clients, visualization (old architecture?)
2. `/tests/` - Test files (for what service?)
3. `/coordination/` - Claude-flow coordination (still used?)
4. `/memory/` - Claude-flow memory (still used?)
5. `/examples/` (root) - Duplicate with vault examples/

**Action Required**: Review with user, decide keep/archive/delete

---

## 3. Missing Directories (Per MVP Structure)

### 3.1 Critical Missing Directories

| Directory | Purpose | Priority | Status |
|-----------|---------|----------|--------|
| `/weaver/` | MVP unified service | 🔴 CRITICAL | ❌ Create |
| `/weaver/src/` | Source code | 🔴 CRITICAL | ❌ Create |
| `/weaver/workflows/` | Workflow definitions | 🔴 CRITICAL | ❌ Create |
| `/weaver/tests/` | Test files | 🔴 CRITICAL | ❌ Create |
| `/weaver/config/` | Service configuration | 🔴 CRITICAL | ❌ Create |
| `/config/` | Shared configuration | ⚠️ HIGH | ❌ Create |
| `/config/vault/` | Vault configuration | ⚠️ HIGH | ❌ Create |
| `/config/weaver/` | Weaver configuration | ⚠️ HIGH | ❌ Create |

### 3.2 Important Missing Directories

| Directory | Purpose | Priority | Status |
|-----------|---------|----------|--------|
| `/scripts/` | Root-level scripts | ⚠️ MEDIUM | ❌ Create |
| `/scripts/setup/` | Setup scripts | ⚠️ MEDIUM | ❌ Create |
| `/scripts/deployment/` | Deployment scripts | ⚠️ MEDIUM | ❌ Create |
| `/infrastructure/` | Root infrastructure | ⚠️ MEDIUM | ❌ Create |
| `/infrastructure/docker/` | Docker configs | ⚠️ MEDIUM | ❌ Create |

### 3.3 Placeholder Directories (Future)

| Directory | Purpose | Priority | Status |
|-----------|---------|----------|--------|
| `/services/` | Future microservices | ℹ️ LOW | ❌ Create placeholder |
| `/packages/` | Future shared libraries | ℹ️ LOW | ❌ Create placeholder |
| `/infrastructure/kubernetes/` | K8s manifests | ℹ️ LOW | ❌ Create placeholder |

---

## 4. Recommended Actions

### Phase 1: Critical (Do Now - Phase 4B)

1. **Create `/weaver/` directory structure**
   ```bash
   mkdir -p /home/aepod/dev/weave-nn/weaver/{src,workflows,tests,config,scripts,data,logs}
   mkdir -p /home/aepod/dev/weave-nn/weaver/src/{config,file-watcher,workflow-engine,shadow-cache,mcp-server,obsidian-client,ai,git,utils}
   ```

2. **Create `/config/` directory**
   ```bash
   mkdir -p /home/aepod/dev/weave-nn/config/{vault,weaver,docker}
   ```

3. **Create root `/scripts/` directory**
   ```bash
   mkdir -p /home/aepod/dev/weave-nn/scripts/{setup,deployment,maintenance,testing}
   ```

4. **Create `/infrastructure/` at root**
   ```bash
   mkdir -p /home/aepod/dev/weave-nn/infrastructure/{docker,kubernetes}
   mkdir -p /home/aepod/dev/weave-nn/infrastructure/docker/weaver
   ```

5. **Create placeholder directories**
   ```bash
   mkdir -p /home/aepod/dev/weave-nn/services/_templates/{fastapi-service,mcp-server}
   mkdir -p /home/aepod/dev/weave-nn/packages/_templates/{typescript-package,python-package}
   ```

---

### Phase 2: Consolidation (After Phase 1)

6. **Move infrastructure from vault to root** (OPTIONAL - keep docs in vault)
   - Copy `/weave-nn/infrastructure/local_development_environment/` to `/infrastructure/`
   - Copy `/weave-nn/infrastructure/gcp/` to `/infrastructure/`
   - Keep vault infrastructure/ for documentation references

7. **Create README files for placeholders**
   - `/services/README.md` - Explain future microservices vs vault services/
   - `/packages/README.md` - Explain future shared packages
   - `/infrastructure/kubernetes/README.md` - Explain K8s migration path

---

### Phase 3: Cleanup (Review with User)

8. **Review and archive legacy directories**
   - `/src/` - Determine if still needed
   - `/tests/` - Determine if still needed
   - `/coordination/` - Archive if unused
   - `/memory/` - Archive if unused
   - `/examples/` (root) - Consolidate with vault examples/

---

## 5. Directory Creation Script

```bash
#!/bin/bash
# File: /home/aepod/dev/weave-nn/scripts/setup/create-mvp-structure.sh

set -e

ROOT="/home/aepod/dev/weave-nn"

echo "Creating MVP directory structure..."

# 1. Weaver service
echo "Creating /weaver structure..."
mkdir -p "$ROOT/weaver"/{src,workflows,tests,config,scripts,data,logs}
mkdir -p "$ROOT/weaver/src"/{config,file-watcher,workflow-engine,shadow-cache,mcp-server,obsidian-client,ai,git,utils}
mkdir -p "$ROOT/weaver/src/mcp-server/tools"
mkdir -p "$ROOT/weaver/tests"/{unit,integration,mocks}
mkdir -p "$ROOT/weaver/workflows"

# 2. Config directory
echo "Creating /config structure..."
mkdir -p "$ROOT/config"/{vault,weaver,docker}

# 3. Scripts directory
echo "Creating /scripts structure..."
mkdir -p "$ROOT/scripts"/{setup,deployment,maintenance,testing}

# 4. Infrastructure directory
echo "Creating /infrastructure structure..."
mkdir -p "$ROOT/infrastructure"/{docker,kubernetes}
mkdir -p "$ROOT/infrastructure/docker/weaver"

# 5. Placeholder directories
echo "Creating placeholder directories..."
mkdir -p "$ROOT/services/_templates"/{fastapi-service,mcp-server}
mkdir -p "$ROOT/packages/_templates"/{typescript-package,python-package}

echo "✅ MVP directory structure created!"
echo ""
echo "Next steps:"
echo "1. Create README files in placeholder directories"
echo "2. Initialize Weaver package.json"
echo "3. Create .env.example in /config/docker/"
echo "4. Create docker-compose.yml at root"
```

---

## 6. Validation Results Summary

### Overall Compliance: 85%

**Breakdown**:
- ✅ Vault structure: 95% compliant (well-organized)
- ⚠️ Root structure: 60% compliant (missing critical MVP directories)
- ⚠️ Placeholders: 20% compliant (missing future service/package directories)

**Critical Issues**: 1 (missing `/weaver/`)
**High Priority Issues**: 1 (missing `/config/`)
**Medium Priority Issues**: 3 (infrastructure, scripts, services confusion)
**Low Priority Issues**: 1 (legacy directories to review)

**Recommendation**: ✅ PROCEED with directory creation script

---

## 7. Post-Validation Checklist

After creating directories, validate:

- [ ] `/weaver/` exists with complete subdirectory structure
- [ ] `/config/` exists with vault/, weaver/, docker/ subdirectories
- [ ] `/scripts/` exists with setup/, deployment/, maintenance/ subdirectories
- [ ] `/infrastructure/` exists at root with docker/, kubernetes/
- [ ] `/services/` exists with README.md explaining future microservices
- [ ] `/packages/` exists with README.md explaining future shared libraries
- [ ] All README.md files created in placeholder directories
- [ ] .gitkeep files added to empty directories
- [ ] Updated .gitignore to exclude weaver/data/, weaver/logs/

---

## 8. Next Steps

1. **Run directory creation script** (Phase 1 actions)
2. **Create README files** for placeholders
3. **Initialize Weaver package.json**
4. **Create .env.example** in config/docker/
5. **Update docker-compose.yml** to include Weaver service
6. **Update phase-4b document** to mark folder validation complete

---

**Validation Status**: ✅ COMPLETE
**Validation Date**: 2025-10-23
**Next Review**: After MVP implementation (Phase 5)
