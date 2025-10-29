---
title: Git and Docker Ignore Patterns for Weave-NN
type: documentation
status: in-progress
tags:
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4DA"
  color: '#8E8E93'
  cssclasses:
    - document
updated: '2025-10-29T04:55:05.403Z'
keywords:
  - root `.gitignore`
  - root `.dockerignore`
  - service-specific `.dockerignore`
  - patterns for specific file types
  - python bytecode
  - virtual environments
  - ide files
  - test coverage
  - secrets
  - best practices
---
# Git and Docker Ignore Patterns for Weave-NN

**Last Updated**: 2025-10-23
**Purpose**: Standardized ignore patterns for version control and Docker builds

---

## Root `.gitignore`

Create this file at `/home/aepod/dev/weave-nn/.gitignore`:

```gitignore
# ===================
# Python
# ===================
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
pip-log.txt
pip-delete-this-directory.txt

# ===================
# Virtual Environments
# ===================
.venv/
venv/
ENV/
env/
.virtualenv/

# ===================
# IDE / Editors
# ===================
# VSCode
.vscode/
*.code-workspace

# PyCharm
.idea/
*.iml

# Vim
*.swp
*.swo
*~

# Emacs
*~
\#*\#
.\#*

# Sublime Text
*.sublime-project
*.sublime-workspace

# ===================
# OS
# ===================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
Desktop.ini

# ===================
# Testing
# ===================
.pytest_cache/
.coverage
.coverage.*
htmlcov/
.tox/
.hypothesis/
.pytest_temp/
coverage.xml
*.cover
.cache
nosetests.xml
test-results/
junit.xml

# ===================
# Docker
# ===================
.dockerignore

# ===================
# Kubernetes
# ===================
kubeconfig
*.kubeconfig
secrets.yaml
sealed-secrets.yaml

# ===================
# Secrets and Environment
# ===================
.env
.env.local
.env.development
.env.production
.env.staging
*.key
*.pem
*.p12
*.pfx
secrets/
credentials/
credentials.json
service-account.json

# ===================
# Logs
# ===================
*.log
logs/
log/
*.log.*

# ===================
# Temporary Files
# ===================
tmp/
temp/
*.tmp
*.temp
*.bak
*.swp
*~

# ===================
# Build Artifacts
# ===================
*.whl
*.tar.gz
*.zip
*.rar

# ===================
# Database
# ===================
*.db
*.sqlite
*.sqlite3
db.sqlite3

# ===================
# Node.js (for any JS tooling)
# ===================
node_modules/
package-lock.json
yarn.lock
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ===================
# Terraform
# ===================
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars
.terraform.lock.hcl

# ===================
# Monitoring
# ===================
.grafana/
prometheus-data/

# ===================
# Documentation Builds
# ===================
docs/_build/
docs/.doctrees/
site/

# ===================
# Jupyter Notebooks
# ===================
.ipynb_checkpoints/
*.ipynb

# ===================
# RabbitMQ
# ===================
mnesia/

# ===================
# Misc
# ===================
.DS_Store
*.orig
*.rej
.mypy_cache/
.dmypy.json
dmypy.json
.pyre/
.pytype/

# ===================
# Project Specific
# ===================
.swarm/
.claude-flow/
.hive-mind/
weave-nn/.bin/
weave-nn/_log/
```

---

## Root `.dockerignore`

Create this file at `/home/aepod/dev/weave-nn/.dockerignore`:

```dockerignore
# ===================
# Documentation
# ===================
*.md
docs/
README.md
CHANGELOG.md
LICENSE

# ===================
# Tests
# ===================
tests/
*_test.py
*.test.py
test_*.py
.pytest_cache/
.coverage
htmlcov/
.tox/

# ===================
# Git
# ===================
.git/
.gitignore
.github/
.gitlab-ci.yml

# ===================
# IDE
# ===================
.vscode/
.idea/
*.swp
*.swo
*~

# ===================
# Python
# ===================
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.egg-info/
.venv/
venv/
ENV/
env/

# ===================
# Build Artifacts
# ===================
build/
dist/
*.whl
*.tar.gz

# ===================
# Logs
# ===================
*.log
logs/
log/

# ===================
# OS
# ===================
.DS_Store
Thumbs.db
Desktop.ini

# ===================
# Development
# ===================
docker-compose*.yml
Dockerfile*
!Dockerfile
Makefile
*.dev.*
.env.example

# ===================
# CI/CD
# ===================
.github/
.gitlab-ci.yml
Jenkinsfile
azure-pipelines.yml

# ===================
# Infrastructure (don't include in service images)
# ===================
infrastructure/
kubernetes/
terraform/
helm/

# ===================
# Scripts
# ===================
scripts/
*.sh
!entrypoint.sh

# ===================
# Monitoring
# ===================
monitoring/
dashboards/
alerts/

# ===================
# Temporary Files
# ===================
tmp/
temp/
*.tmp
*.bak
```

---

## Service-Specific `.dockerignore`

For each service (e.g., `/services/api-gateway/.dockerignore`):

```dockerignore
# Include only what's needed for this specific service

# Exclude root-level monorepo files
../.git/
../.github/
../docs/
../infrastructure/
../scripts/
../tests/

# Exclude other services
../services/*
!../services/api-gateway/

# Exclude shared packages source (use installed packages)
../packages/*/tests/
../packages/*/.venv/
../packages/*/*.egg-info/

# Include only built packages
!../packages/*/dist/

# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/
*.egg-info/

# Tests
tests/
*_test.py
test_*.py
.pytest_cache/

# Documentation
*.md
!README.md

# Development
docker-compose*.yml
Dockerfile*
!Dockerfile
.env.example
```

---

## Patterns for Specific File Types

### Python Bytecode
```gitignore
__pycache__/
*.py[cod]
*$py.class
*.so
```

### Virtual Environments
```gitignore
.venv/
venv/
ENV/
env/
.virtualenv/
```

### IDE Files
```gitignore
# VSCode
.vscode/
*.code-workspace

# PyCharm
.idea/
*.iml

# Vim
*.swp
*.swo
*~
```

### Test Coverage
```gitignore
.pytest_cache/
.coverage
.coverage.*
htmlcov/
coverage.xml
*.cover
```

### Secrets
```gitignore
.env
.env.local
.env.production
*.key
*.pem
secrets/
credentials/
```

---

## Best Practices

### 1. **Global vs. Local Ignore**
- **Global `.gitignore`**: At repository root for monorepo-wide patterns
- **Service `.gitignore`**: In each service directory for service-specific patterns
- **`.dockerignore`**: At repository root AND in each service directory

### 2. **Whitelist Important Files**
Use `!` to explicitly include files that match ignore patterns:
```gitignore
# Ignore all .env files
.env*

# But include the example
!.env.example
```

### 3. **Secrets Management**
**NEVER commit**:
- `.env` files with real credentials
- API keys, passwords, tokens
- Private keys, certificates
- Cloud service account files

**DO commit**:
- `.env.example` with placeholder values
- Documentation about required environment variables

### 4. **Docker Image Optimization**
Keep Docker images small by excluding:
- Documentation (`*.md`, `docs/`)
- Tests (`tests/`, `*_test.py`)
- Development tools (`Makefile`, `docker-compose.yml`)
- IDE configurations (`.vscode/`, `.idea/`)

### 5. **Service Isolation**
In service-specific `.dockerignore`:
```dockerignore
# Exclude all services
../services/*

# Include only this service
!../services/current-service/
```

---

## Validation Script

Create `/scripts/validate-ignore-patterns.sh`:

```bash
#!/bin/bash
# Validate that sensitive files are properly ignored

echo "Checking for sensitive files in git history..."

# Check for committed secrets
SENSITIVE_PATTERNS=(
  ".env"
  "*.key"
  "*.pem"
  "credentials.json"
  "service-account.json"
  "secrets.yaml"
)

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  if git log --all --pretty=format: --name-only --diff-filter=A | grep -q "$pattern"; then
    echo "WARNING: Found $pattern in git history!"
    echo "Consider using git-filter-branch or BFG Repo-Cleaner to remove it."
  fi
done

# Check for untracked sensitive files
echo ""
echo "Checking for sensitive files in working directory..."
find . -type f \( -name "*.env" -o -name "*.key" -o -name "*.pem" \) | while read file; do
  if ! grep -q "$(basename $file)" .gitignore; then
    echo "WARNING: $file is not in .gitignore!"
  fi
done

echo ""
echo "Validation complete."
```

Make it executable:
```bash
chmod +x scripts/validate-ignore-patterns.sh
```

---

## Example Directory with Ignore Files

```
weave-nn/
├── .gitignore                    # Root gitignore (monorepo-wide)
├── .dockerignore                 # Root dockerignore (for multi-service builds)
├── services/
│   ├── api-gateway/
│   │   ├── .dockerignore         # Service-specific dockerignore
│   │   ├── Dockerfile
│   │   └── src/
│   └── rule-engine/
│       ├── .dockerignore
│       ├── Dockerfile
│       └── src/
└── packages/
    └── weave-common/
        └── .gitignore            # Package-specific gitignore (if needed)
```

---

## Common Mistakes to Avoid

### ❌ **Don't**:
1. Commit `.env` files with real credentials
2. Ignore `requirements.txt` or `pyproject.toml`
3. Include IDE-specific folders in shared `.gitignore` if team uses different IDEs
4. Ignore entire `tests/` directory at root (tests should be versioned)
5. Forget to add `.dockerignore` (leads to bloated images)

### ✅ **Do**:
1. Use `.env.example` as a template with placeholder values
2. Commit dependency files (`requirements.txt`, `pyproject.toml`)
3. Use global gitignore for personal IDE preferences (`~/.gitignore_global`)
4. Keep service-level tests separate from root-level integration tests
5. Optimize Docker builds with comprehensive `.dockerignore`

---

## Summary

Proper ignore patterns ensure:

1. **Security**: Secrets and credentials never enter version control
2. **Clean Repository**: Only essential code and configs are tracked
3. **Efficient Builds**: Docker images exclude unnecessary files
4. **Collaboration**: Team members don't commit IDE-specific files
5. **Performance**: Smaller repos and faster Docker builds

**Next Steps**:
1. Create `.gitignore` at repository root
2. Create `.dockerignore` at repository root and in each service
3. Run validation script to check for sensitive files
4. Configure pre-commit hooks to enforce ignore patterns
5. Document required environment variables in `.env.example`

---

**Created**: 2025-10-23
**Backend Developer**: System Architecture Team
**Version**: 1.0
