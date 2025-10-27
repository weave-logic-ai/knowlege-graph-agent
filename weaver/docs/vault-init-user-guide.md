# Vault Initialization System - User Guide

**Version**: 1.0.0
**Last Updated**: 2025-10-25
**Status**: Phase 6 Implementation Complete

---

## Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [Installation](#installation)
3. [CLI Commands](#cli-commands)
4. [Template Selection](#template-selection)
5. [Advanced Usage](#advanced-usage)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## Quick Start (5 Minutes)

Get up and running with vault initialization in 5 minutes:

```bash
# 1. Navigate to your project
cd /path/to/your/project

# 2. Initialize vault (auto-detects framework)
weaver init-vault

# 3. Open generated vault in Obsidian
# The vault will be created in ../your-project-vault/
```

**That's it!** Your knowledge graph is ready to explore.

---

## Installation

### Prerequisites

- **Node.js**: >= 20.0.0
- **Bun**: >= 1.0.0 (recommended) or npm
- **Git**: For repository initialization (optional)

### Install Weaver

```bash
# Using Bun (recommended)
bun install @weave-nn/weaver

# Using npm
npm install -g @weave-nn/weaver

# Verify installation
weaver --version
```

### Optional: Claude-Flow Integration

For AI-powered content generation:

```bash
# Install Claude-Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Set API key (if needed)
export ANTHROPIC_API_KEY=your-api-key
```

---

## CLI Commands

### `weaver init-vault`

Initialize a new vault from your application codebase.

```bash
weaver init-vault [options]
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Project directory to scan | Current directory |
| `--output <path>` | Vault output directory | `../<project-name>-vault` |
| `--template <name>` | Template to use (nextjs, react, typescript) | Auto-detect |
| `--dry-run` | Preview changes without writing files | `false` |
| `--offline` | Generate without AI assistance | `false` |
| `--verbose` | Show detailed progress | `false` |
| `--yes` | Skip all prompts | `false` |

#### Examples

```bash
# Auto-detect framework and generate vault
weaver init-vault

# Specify project path
weaver init-vault --path /path/to/project

# Use specific template
weaver init-vault --template nextjs

# Preview without creating files
weaver init-vault --dry-run

# Generate offline (no AI)
weaver init-vault --offline

# Full automation (no prompts)
weaver init-vault --yes --output ./my-vault
```

---

## Template Selection

Weaver automatically detects your project framework, but you can override with `--template`.

### Supported Templates

#### 1. **Next.js Template** (`nextjs`)

**Best for**: Next.js applications (App Router or Pages Router)

**Detects**:
- Next.js version and router type
- TypeScript configuration
- Tailwind CSS
- API routes
- Server/Client components

**Generates**:
```
vault/
├── concepts/           # High-level Next.js concepts
├── technical/
│   ├── components/     # React components
│   ├── api/           # API routes
│   ├── hooks/         # Custom hooks
│   └── utils/         # Utility functions
├── features/          # User-facing features
└── architecture/      # System design diagrams
```

**Example**:
```bash
weaver init-vault --template nextjs --path ./my-nextjs-app
```

---

#### 2. **React Template** (`react`)

**Best for**: Standalone React applications (CRA, Vite, etc.)

**Detects**:
- React version
- State management (Redux, Zustand, Jotai)
- React Router
- Testing libraries

**Generates**:
```
vault/
├── concepts/          # React concepts (state, props, hooks)
├── technical/
│   ├── components/    # React components
│   ├── hooks/        # Custom hooks
│   ├── contexts/     # Context providers
│   └── utils/        # Helper functions
└── features/         # App features
```

**Example**:
```bash
weaver init-vault --template react --path ./my-react-app
```

---

#### 3. **TypeScript Template** (`typescript`)

**Best for**: TypeScript libraries, CLIs, or Node.js apps

**Detects**:
- TypeScript configuration
- Module structure
- Type definitions

**Generates**:
```
vault/
├── concepts/          # TypeScript concepts
├── technical/
│   ├── modules/       # Code modules
│   ├── types/        # Type definitions
│   └── utils/        # Utilities
└── architecture/     # Module architecture
```

**Example**:
```bash
weaver init-vault --template typescript --path ./my-ts-library
```

---

#### 4. **Node.js Template** (`nodejs`)

**Best for**: Node.js applications (Express, Fastify, etc.)

**Generates**:
```
vault/
├── concepts/          # Backend concepts
├── technical/
│   ├── routes/        # API routes
│   ├── middleware/    # Middleware
│   ├── models/       # Data models
│   └── services/     # Business logic
└── features/         # API features
```

---

### Template Auto-Detection

Weaver analyzes your project and selects the best template:

```bash
# Auto-detection priority:
# 1. Next.js (if next dependency found)
# 2. React (if react dependency found)
# 3. TypeScript (if typescript or @types/* found)
# 4. Node.js (if other dependencies present)
# 5. Unknown (generates generic structure)

weaver init-vault  # Let Weaver decide
```

---

## Advanced Usage

### Dry-Run Mode

Preview what will be generated without writing files:

```bash
weaver init-vault --dry-run
```

**Output**:
```
🔍 Scanning project...
   Framework: Next.js 14.0.0
   Features: app-router, typescript, tailwind

📝 Would create 47 files:

   concepts/
      nextjs-app-router.md
      react-server-components.md
      server-actions.md

   technical/
      components/
         Header.md
         Footer.md
      api/
         users-endpoint.md

   [... truncated ...]

✅ Dry-run complete. No files written.
```

### Offline Mode

Generate vault without AI assistance:

```bash
weaver init-vault --offline
```

**Features**:
- Uses code comments and docstrings for descriptions
- Generates basic frontmatter
- Creates relationships from imports
- No Claude-Flow API calls

**Use cases**:
- No internet connection
- Want to avoid API costs
- Rapid prototyping

### Verbose Mode

See detailed progress information:

```bash
weaver init-vault --verbose
```

**Shows**:
- File-by-file scanning progress
- Template compilation steps
- API call details
- Cache hit/miss ratios
- Performance metrics

---

## Troubleshooting

### Common Issues

#### 1. **"package.json not found"**

```
Error: package.json not found at: /path/to/project/package.json
```

**Solution**: Run command from project root or use `--path`:
```bash
weaver init-vault --path /correct/project/path
```

---

#### 2. **"Framework detection failed"**

```
Warning: Could not detect framework. Using generic template.
```

**Solution**: Manually specify template:
```bash
weaver init-vault --template react
```

---

#### 3. **Permission Errors**

```
Error: EACCES: permission denied, mkdir '/vault'
```

**Solution**: Use a different output directory:
```bash
weaver init-vault --output ~/my-vault
```

Or fix permissions:
```bash
sudo chown -R $USER /vault
```

---

#### 4. **Claude-Flow API Errors**

```
Error: Claude-Flow API call failed: Rate limit exceeded
```

**Solutions**:

**Option A**: Use offline mode:
```bash
weaver init-vault --offline
```

**Option B**: Wait and retry (rate limits reset):
```bash
# Wait 1 minute, then retry
sleep 60 && weaver init-vault
```

**Option C**: Check API key:
```bash
echo $ANTHROPIC_API_KEY  # Should output your key
export ANTHROPIC_API_KEY=sk-ant-...
```

---

#### 5. **Out of Memory Errors**

```
FATAL ERROR: Reached heap limit
```

**Solution**: Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" weaver init-vault
```

Or scan smaller directories:
```bash
# Exclude large directories
echo "node_modules/\ndist/\nbuild/" > .weaverignore
weaver init-vault
```

---

#### 6. **Vault Already Exists**

```
Error: Vault already exists at: ../my-project-vault
```

**Solutions**:

**Option A**: Use different output path:
```bash
weaver init-vault --output ../my-vault-v2
```

**Option B**: Remove existing vault:
```bash
rm -rf ../my-project-vault
weaver init-vault
```

**Option C**: Merge (advanced):
```bash
# Backup existing vault
cp -r ../my-project-vault ../my-vault-backup
# Generate to temp location
weaver init-vault --output /tmp/new-vault
# Manually merge files
```

---

## FAQ

### General Questions

#### Q1: **How long does vault initialization take?**

**A**: Depends on project size:
- **Small** (<50 files): 10-30 seconds
- **Medium** (50-500 files): 1-3 minutes
- **Large** (500+ files): 3-10 minutes

Use `--verbose` to monitor progress.

---

#### Q2: **Does it modify my source code?**

**A**: **No**. Weaver only reads your code. All generated files are written to a separate vault directory.

---

#### Q3: **What files are scanned?**

**A**: Weaver scans:
- ✅ Source code (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`)
- ✅ Configuration (`.json`, `.yaml`, `.toml`)
- ✅ Documentation (`.md`, `README`)
- ❌ Dependencies (`node_modules/`, `venv/`)
- ❌ Build artifacts (`dist/`, `build/`, `.next/`)
- ❌ Git internals (`.git/`)

Use `.weaverignore` to customize.

---

#### Q4: **Can I regenerate the vault?**

**A**: Yes! Re-run the command:
```bash
# Regenerate (will prompt to overwrite)
weaver init-vault

# Force overwrite
weaver init-vault --yes
```

---

#### Q5: **How do I update the vault after code changes?**

**A**: Currently, regenerate the entire vault. Incremental updates are planned for Phase 7.

---

### Technical Questions

#### Q6: **What is the shadow cache?**

**A**: An SQLite database that indexes vault files for fast querying. It's automatically populated during vault generation.

**Location**: `<vault>/.weaver/cache.db`

---

#### Q7: **Does it work with monorepos?**

**A**: Partially. Point to a specific package:
```bash
weaver init-vault --path ./packages/my-app
```

Full monorepo support (multi-vault) is planned.

---

#### Q8: **How are relationships detected?**

**A**: By analyzing:
- Import/require statements
- Component usage in JSX/TSX
- Function calls
- Type references

Relationships appear as wikilinks in generated markdown.

---

#### Q9: **What Obsidian features are supported?**

**A**:
- ✅ Wikilinks (`[[node-name]]`)
- ✅ YAML frontmatter
- ✅ Tags (`#concept`, `#react`)
- ✅ Mermaid diagrams
- ✅ Graph view
- ✅ Dataview plugin (via frontmatter)

---

#### Q10: **Can I customize templates?**

**A**: Yes! See [Developer Guide](./vault-init-developer-guide.md) for custom template creation.

---

### AI & Claude-Flow Questions

#### Q11: **Is Claude-Flow required?**

**A**: **No**. Use `--offline` mode to generate without AI:
```bash
weaver init-vault --offline
```

AI provides richer descriptions but isn't mandatory.

---

#### Q12: **What does Claude-Flow do?**

**A**:
- Extracts high-level concepts from code
- Generates descriptive summaries
- Identifies relationships
- Creates embeddings for semantic search

---

#### Q13: **How much does it cost?**

**A**: Depends on project size. Typical costs:
- **Small project**: $0.10 - $0.50
- **Medium project**: $0.50 - $2.00
- **Large project**: $2.00 - $5.00

Use `--offline` to avoid API costs.

---

#### Q14: **Is content cached?**

**A**: **Yes**. Claude-Flow responses are cached by content hash. Re-running on the same code is nearly free.

**Cache location**: `<vault>/.weaver/cache.db`

---

## Next Steps

- **Explore your vault**: Open in Obsidian and navigate the graph
- **Customize**: Edit generated markdown files
- **Extend**: Create custom templates ([Developer Guide](./vault-init-developer-guide.md))
- **Integrate**: Use MCP tools to query your vault

---

## Support

- **Documentation**: [Developer Guide](./vault-init-developer-guide.md)
- **API Reference**: [API Reference](./vault-init-api-reference.md)
- **Issues**: [GitHub Issues](https://github.com/weave-nn/weaver/issues)
- **Discussions**: [GitHub Discussions](https://github.com/weave-nn/weaver/discussions)

---

**Generated**: 2025-10-25
**Phase**: 6 - Vault Initialization System
