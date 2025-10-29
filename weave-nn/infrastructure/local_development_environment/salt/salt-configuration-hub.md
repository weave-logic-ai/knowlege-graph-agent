---
title: Weave-NN Developer Environment Automation
type: infrastructure
status: active
phase_id: PHASE-6
tags:
  - scope/mvp
  - type/infrastructure
  - priority/high
  - tech/saltstack
  - tech/linux
  - category/automation
  - phase/phase-6
  - type/hub
  - status/in-progress
domain: infrastructure
priority: high
visual:
  icon: settings
  color: '#4A90E2'
  cssclasses:
    - type-infrastructure
    - scope-mvp
updated: '2025-10-29T04:55:03.731Z'
version: '3.0'
keywords:
  - "\U0001F3AF what gets installed"
  - core tools
  - weave-nn specific
  - obsidian plugins (automated install)
  - python packages
  - configuration
  - related
  - "\U0001F680 quick start"
  - prerequisites
  - installation
---

# Weave-NN Developer Environment Automation

**Automated developer environment setup using SaltStack for Linux**

**Purpose**: Enable new developers to provision a complete Weave-NN development environment with a single command.

---

## 🎯 What Gets Installed

### Core Tools
- **Python 3.11+** with pip and virtualenv
- **Node.js 20.x** and npm
- **Docker** and Docker Compose
- **Git** with recommended config

### Weave-NN Specific
- **Obsidian AppImage** (Linux desktop app)
- **Claude Code CLI** (latest version)
- **Claude-Flow v2.7** (agent orchestration)
- **RabbitMQ** (via Docker)
- **N8N** (via Docker)

### Obsidian Plugins (Automated Install)
- obsidian-local-rest-api
- obsidian-tasks
- obsidian-mehrmaid
- obsidian-advanced-uri

### Python Packages
- fastapi, uvicorn
- pika (RabbitMQ client)
- requests, pyyaml
- watchdog (file watcher)
- gitpython

### Configuration
- Obsidian vault symlinked to `~/weave-nn/`
- Environment variables in `.env`
- Git hooks for pre-commit validation
- Claude-Flow agent rules installed

---







## Related

[[cross-project-knowledge-retention]]
## Related

[[phase-6-file-watcher-weaver-integration]]
## Related

[[weaver-workflow-automation]]
## 🚀 Quick Start

### Prerequisites

**Supported Linux Distributions**:
- Ubuntu 22.04 LTS or newer
- Debian 12 or newer
- Fedora 38 or newer
- Arch Linux (latest)

**Requirements**:
- Fresh Linux installation or VM
- Internet connection
- Sudo privileges

### Installation

```bash
# Clone repository
git clone https://github.com/weavelogic/weave-nn.git
cd weave-nn

# Run SaltStack bootstrap (automated)
sudo bash infrastructure/salt/bootstrap.sh

# Or manual installation (if bootstrap fails)
cd infrastructure/salt
sudo salt-call --local state.apply
```

**Installation Time**: 10-15 minutes (depending on internet speed)

---

## 📁 File Structure

```
infrastructure/salt/
├── README.md                    # This file
├── bootstrap.sh                 # One-command setup script
├── top.sls                      # Salt orchestration
├── pillar/
│   ├── top.sls                  # Pillar configuration
│   └── weave-nn.sls             # Weave-NN specific config
├── states/
│   ├── base.sls                 # Base system packages
│   ├── python.sls               # Python environment
│   ├── nodejs.sls               # Node.js environment
│   ├── docker.sls               # Docker installation
│   ├── obsidian.sls             # Obsidian AppImage
│   ├── obsidian-plugins.sls    # Obsidian plugins (automated)
│   ├── claude-code.sls          # Claude Code CLI
│   ├── claude-flow.sls          # Claude-Flow installation
│   ├── rabbitmq.sls             # RabbitMQ Docker container
│   ├── n8n.sls                  # N8N Docker container
│   ├── weave-nn-vault.sls      # Vault setup and symlink
│   ├── python-packages.sls     # Python dependencies
│   └── git-config.sls           # Git configuration
├── files/
│   ├── .env.template            # Environment variables template
│   ├── claude-flow-rules/       # Agent rules for Claude-Flow
│   │   ├── memory_sync.yaml
│   │   ├── node_creation.yaml
│   │   ├── auto_linking.yaml
│   │   └── auto_tagging.yaml
│   ├── git-hooks/
│   │   └── pre-commit           # Pre-commit validation
│   └── obsidian-plugins/        # Plugin installation scripts
│       └── install-plugins.sh
└── scripts/
    ├── verify-install.sh        # Verify installation success
    └── uninstall.sh             # Remove all components
```

---

## 📋 Detailed Installation Steps

See individual state files for specific implementation.

---

## 🔗 Related Documentation

- [[../developer-onboarding|Developer Onboarding Guide]]
- [[../../_planning/phases/phase-5-mvp-week-1#day-0-weekendprep-prerequisites--plugin-installation|Phase 5 Prerequisites]]

---

**Status**: Active
**Maintainer**: WeaveLogic Team
**Last Updated**: 2025-10-21
