---
type: guide
status: active
priority: critical
created_date: '2025-10-21'
tags:
  - scope/mvp
  - type/guide
  - priority/critical
  - infrastructure
  - onboarding
visual:
  icon: rocket
  cssclasses:
    - type-guide
    - priority-critical
domain: infrastructure
version: '3.0'
updated_date: '2025-10-28'
icon: 🚀
---

# Weave-NN Developer Onboarding Guide

**Automated developer environment setup for new team members**

---

## 🎯 Overview

This guide walks new developers through setting up a complete Weave-NN development environment from scratch. Using automated SaltStack provisioning, you can go from a fresh Linux installation to a fully configured development environment in 15-20 minutes.

---











## Related

[[obsidian-native-integration-analysis]]
## Related

[[obsidian-first-architecture]] • [[git-integration]]
## Related

[[rabbitmq-message-queue]]
## Related

[[phase-4a-decision-closure]]
## Related

[[TASKS-SETUP-GUIDE]]
## 📋 Prerequisites

### Required

- **Fresh Linux installation** (or VM)
  - Ubuntu 22.04 LTS or newer (recommended)
  - Debian 12 or newer
  - Fedora 38 or newer
  - Arch Linux (latest)

- **System Requirements**:
  - 8GB RAM minimum (16GB recommended)
  - 50GB free disk space
  - Active internet connection
  - Sudo/root privileges

- **Account Setup**:
  - GitHub account with repository access
  - Anthropic API key ([get from console](https://console.anthropic.com/settings/keys))

### Optional

- Git configured with your name/email
- SSH key for GitHub

---

## 🚀 Quick Start (Automated Setup)

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/weavelogic/weave-nn.git
cd weave-nn
```

### Step 2: Run Bootstrap Script

```bash
# Run automated setup (this will take 10-15 minutes)
sudo bash infrastructure/salt/bootstrap.sh
```

**What this does**:
- Installs SaltStack
- Installs Python 3.11, Node.js 20, Docker
- Downloads Obsidian AppImage
- Installs Claude Code CLI and Claude-Flow
- Starts RabbitMQ and N8N Docker containers
- Creates project directory structure
- Installs all Python dependencies
- Configures Git hooks

### Step 3: Log Out and Back In

```bash
# This applies Docker group membership
logout
```

Log back in to your system.

### Step 4: Configure Environment

```bash
cd ~/weave-nn

# Copy environment template
cp .env.template .env

# Edit with your API keys
nano .env  # or vim, code, etc.
```

**Required configuration**:
```bash
# .env file
ANTHROPIC_API_KEY=your-anthropic-api-key-here
OBSIDIAN_API_KEY=your-obsidian-api-key-here  # Generate in Step 5
GIT_USER_NAME="Your Name"
GIT_USER_EMAIL="your.email@example.com"
```

### Step 5: Install Obsidian Plugins (Manual)

**Why manual?** Obsidian Community Plugins require installation through the UI for security.

1. **Open Obsidian**:
   ```bash
   ~/Obsidian.AppImage
   ```

2. **Open Vault**:
   - Click "Open folder as vault"
   - Select: `~/weave-nn`

3. **Install Plugins**:
   - Settings (`Ctrl+,`) → Community Plugins → Browse

   **Install these 4 plugins**:
   - ✅ **Local REST API** (CRITICAL)
   - ✅ **Tasks** (CRITICAL)
   - ✅ **Mehrmaid** (CRITICAL)
   - ✅ **Advanced URI** (Optional fallback)

4. **Configure Local REST API**:
   - Settings → Local REST API
   - Click "Generate Token"
   - Copy the API key
   - Save to `~/weave-nn/.env`:
     ```bash
     OBSIDIAN_API_KEY=your-generated-key-here
     ```

5. **Configure Tasks Plugin**:
   - Follow: `~/weave-nn/_planning/TASKS-SETUP-GUIDE.md`
   - Enable auto-suggest and done dates

### Step 6: Start Services

```bash
# Start RabbitMQ
docker start rabbitmq

# Start N8N
docker start n8n

# Verify services
docker ps
```

**Expected output**:
```
CONTAINER ID   IMAGE                    PORTS                    NAMES
abc123...      rabbitmq:3-management    5672, 15672             rabbitmq
def456...      n8nio/n8n                5678                    n8n
```

### Step 7: Test Installation

```bash
# Run verification script
bash infrastructure/salt/scripts/verify-install.sh
```

If all checks pass ✅, your environment is ready!

---

## 🔧 Manual Setup (Alternative)

If automated setup fails, use manual installation:

### 1. Install Base Tools

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y git curl wget python3.11 python3.11-venv nodejs npm docker.io

# Fedora
sudo dnf install -y git curl wget python3.11 nodejs npm docker

# Arch Linux
sudo pacman -S git curl wget python nodejs npm docker
```

### 2. Install Obsidian

```bash
curl -L https://github.com/obsidianmd/obsidian-releases/releases/latest/download/Obsidian-latest.AppImage -o ~/Obsidian.AppImage
chmod +x ~/Obsidian.AppImage
```

### 3. Install Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

### 4. Install Claude-Flow

```bash
git clone https://github.com/cyanheads/claude-engineer ~/claude-flow
cd ~/weave-nn
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e ~/claude-flow
```

### 5. Start Docker Services

```bash
# RabbitMQ
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

# N8N
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=changeme \
  n8nio/n8n
```

### 6. Install Python Packages

```bash
source .venv/bin/activate
pip install fastapi uvicorn pika requests pyyaml watchdog gitpython python-dotenv aiosqlite
```

---

## 📊 Verify Setup

### Check All Components

Run verification script:
```bash
bash infrastructure/salt/scripts/verify-install.sh
```

### Manual Verification Checklist

- [ ] Python 3.11 installed: `python3.11 --version`
- [ ] Virtual environment created: `ls ~/weave-nn/.venv`
- [ ] Node.js installed: `node --version`
- [ ] Docker running: `docker ps`
- [ ] RabbitMQ accessible: `curl http://localhost:15672` (shows login page)
- [ ] N8N accessible: `curl http://localhost:5678` (shows login page)
- [ ] Obsidian AppImage exists: `ls ~/Obsidian.AppImage`
- [ ] Obsidian plugins installed (manual check in Obsidian)
- [ ] Git repository initialized: `git status` (in ~/weave-nn)

---

## 🎮 Post-Setup Tasks

### 1. Configure Obsidian Tasks Plugin

Follow the complete guide:
```bash
cat ~/weave-nn/_planning/TASKS-SETUP-GUIDE.md
```

### 2. Test Obsidian REST API

```bash
# Test API connectivity (replace YOUR_KEY with actual API key)
curl -k https://localhost:27124/vault/ \
  -H "Authorization: Bearer YOUR_KEY"
```

Expected: Returns list of vault files in JSON format.

### 3. Test RabbitMQ

```bash
# Access RabbitMQ Management UI
firefox http://localhost:15672

# Login: admin / changeme
# Verify exchanges and queues exist
```

### 4. Test N8N

```bash
# Access N8N UI
firefox http://localhost:5678

# Login: admin / changeme
# Create your first workflow
```

### 5. Activate Python Environment

```bash
cd ~/weave-nn
source .venv/bin/activate

# Verify packages
pip list | grep fastapi
pip list | grep pika
```

### 6. Start Development

**Phase 5, Day 1 tasks**:
```bash
cat ~/weave-nn/_planning/phases/phase-5-mvp-week-1.md
```

**Open task dashboard**:
```bash
# In Obsidian, open:
# ~/weave-nn/_planning/tasks.md
```

---

## 🔗 Service Access Points

After setup, access services at:

| Service | URL | Credentials |
|---------|-----|-------------|
| **RabbitMQ Management** | http://localhost:15672 | admin / changeme |
| **RabbitMQ AMQP** | localhost:5672 | admin / changeme |
| **N8N Workflows** | http://localhost:5678 | admin / changeme |
| **Obsidian REST API** | https://localhost:27124 | Bearer token from .env |

---

## 📁 Project Structure

After setup, your directory structure:

```
~/weave-nn/
├── .env                        # Your configuration (NOT committed)
├── .env.template               # Template for .env
├── .venv/                      # Python virtual environment
├── .obsidian/                  # Obsidian configuration
│   ├── plugins/
│   │   └── weave-nn/           # Our plugin data
│   └── workspace.json          # Workspace state
├── _planning/                  # Planning documents
│   ├── tasks.md                # Central task hub
│   ├── TASKS-SETUP-GUIDE.md    # Task setup guide
│   └── phases/                 # Phase roadmaps
├── features/                   # Feature documentation
├── architecture/               # Architecture decisions
├── concepts/                   # Concept definitions
├── templates/                  # Document templates
├── knowledge-base/             # Cross-project knowledge
└── infrastructure/             # Infrastructure automation
    └── salt/                   # SaltStack automation
```

---

## 🐛 Troubleshooting

### Problem: SaltStack installation fails

**Solution**:
```bash
# Try manual Salt installation
curl -L https://bootstrap.saltproject.io -o install_salt.sh
sudo sh install_salt.sh -P

# Then run states manually
cd ~/weave-nn/infrastructure/salt
sudo salt-call --local state.apply
```

### Problem: Docker permission denied

**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
logout
```

### Problem: Obsidian plugins won't install

**Solution**: Obsidian Community Plugins require manual installation through the UI. There is no automated CLI method. Follow Step 5 in Quick Start.

### Problem: RabbitMQ container won't start

**Solution**:
```bash
# Check logs
docker logs rabbitmq

# Remove and recreate
docker rm -f rabbitmq
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### Problem: Python packages won't install

**Solution**:
```bash
# Ensure venv is activated
source ~/weave-nn/.venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install packages individually
pip install fastapi
pip install pika
# ... etc
```

### Problem: Obsidian REST API returns 401 Unauthorized

**Solution**:
1. Verify API key in `.env` matches Obsidian settings
2. Regenerate token in Obsidian: Settings → Local REST API → Generate Token
3. Update `.env` with new token
4. Restart Obsidian

---

## 📚 Next Steps

After successful setup:

1. ✅ **Review Architecture**:
   - Read: `~/weave-nn/architecture/obsidian-native-integration-analysis.md`
   - Read: `~/weave-nn/architecture/cross-project-knowledge-retention.md`

2. ✅ **Review Features**:
   - Read: `~/weave-nn/features/rabbitmq-message-queue.md`
   - Read: `~/weave-nn/features/n8n-workflow-automation.md`

3. ✅ **Review Phase Plans**:
   - Read: `~/weave-nn/_planning/phases/phase-5-mvp-week-1.md`
   - Read: `~/weave-nn/_planning/phases/phase-6-mvp-week-2.md`

4. ✅ **Start Development**:
   - Open: `~/weave-nn/_planning/tasks.md` (in Obsidian)
   - Begin Phase 5, Day 1 tasks

---

## 🆘 Getting Help

### Documentation

- **SaltStack Automation**: `infrastructure/salt/README.md`
- **Tasks Setup**: `_planning/TASKS-SETUP-GUIDE.md`
- **Phase 5 Plan**: `_planning/phases/phase-5-mvp-week-1.md`

### Commands

```bash
# List all SaltStack states
sudo salt-call --local state.show_top

# Re-run specific state
sudo salt-call --local state.apply python

# Check Docker status
docker ps -a

# View RabbitMQ queues
docker exec rabbitmq rabbitmqadmin list queues

# Check Python packages
source ~/weave-nn/.venv/bin/activate && pip list
```

### Support

- **GitHub Issues**: https://github.com/weavelogic/weave-nn/issues
- **Team Chat**: [Your team communication channel]

---

**Status**: Active
**Maintainer**: WeaveLogic Team
**Last Updated**: 2025-10-21

**Estimated Setup Time**: 15-20 minutes (automated) | 45-60 minutes (manual)
