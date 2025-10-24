# Weaver Development Guide

**Package Manager**: Bun (required)

---

## Package Manager: Bun

This project uses **Bun** as the package manager and runtime for optimal performance and developer experience.

### Why Bun?

- ⚡ **Fast**: 25x faster than npm for installs
- 🔋 **Built-in**: Bundler, test runner, and runtime included
- 🎯 **TypeScript Native**: No separate ts-node needed
- 🚀 **Hot Reload**: Built-in watch mode with `bun --watch`

### Installation

```bash
# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version  # Should be >= 1.3.1
```

---

## Common Commands

### Package Management

```bash
# Install all dependencies
bun install

# Add a new dependency
bun add <package-name>

# Add a dev dependency
bun add -d <package-name>

# Remove a dependency
bun remove <package-name>

# Update all dependencies
bun update

# Check for outdated packages
bun outdated
```

### Development

```bash
# Run with hot reload (recommended for development)
bun run dev
# or
bun --watch src/index.ts

# Run without watch mode
bun src/index.ts

# Build TypeScript to JavaScript
bun run build

# Run production build
bun start
```

### Testing

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test src/utils/logger.test.ts

# Run with coverage
bun test --coverage
```

### Code Quality

```bash
# Type check
bun run typecheck

# Lint
bun run lint

# Auto-fix linting issues
bun run lint --fix

# Format code (if prettier is added)
bun run format
```

---

## Project Structure

```
weaver/
├── src/
│   ├── config/              # Configuration with Zod validation
│   ├── utils/               # Shared utilities (logger, etc.)
│   ├── file-watcher/        # Chokidar file monitoring
│   ├── shadow-cache/        # SQLite metadata cache
│   ├── workflow-engine/     # workflow.dev orchestration
│   ├── mcp-server/          # MCP tool implementations
│   ├── obsidian-client/     # Obsidian REST API client
│   ├── ai/                  # AI operations (Vercel AI Gateway)
│   ├── git/                 # Git automation
│   └── index.ts             # Main entry point
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── mocks/               # Test mocks
├── workflows/               # Workflow definitions
├── data/                    # Runtime data (*.db files)
├── logs/                    # Log files
├── config/                  # Config files
└── scripts/                 # Utility scripts
```

---

## Development Workflow

### 1. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env

# Required variables:
# - VAULT_PATH
# - OBSIDIAN_API_URL
# - OBSIDIAN_API_KEY
# - VERCEL_AI_GATEWAY_API_KEY
```

### 2. Start Development Server

```bash
# Run with hot reload
bun run dev

# Server starts on http://localhost:3000 (default)
# File watcher monitors vault for changes
# Logs output to console and ./logs/
```

### 3. Test Changes

```bash
# Run tests
bun test

# Type check
bun run typecheck

# Lint
bun run lint
```

### 4. Build for Production

```bash
# Clean previous build
bun run clean

# Build TypeScript
bun run build

# Run production build
NODE_ENV=production bun start
```

---

## Debugging

### Bun Debugger

```bash
# Run with debugger
bun --inspect src/index.ts

# Run with debugger and break on start
bun --inspect-brk src/index.ts
```

Then attach Chrome DevTools to `chrome://inspect`

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Bun: Debug Weaver",
      "program": "${workspaceFolder}/weaver/src/index.ts",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["--inspect-wait"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

---

## Dependencies

### Production Dependencies (18 packages)

- `@anthropic-ai/sdk` - Anthropic API client
- `@hono/node-server` - Node.js adapter for Hono
- `@modelcontextprotocol/sdk` - MCP protocol SDK
- `better-sqlite3` - SQLite database driver
- `chokidar` - File system watcher
- `dotenv` - Environment variable loader
- `hono` - Lightweight web framework
- `simple-git` - Git operations
- `workflow` - Workflow orchestration SDK
- `zod` - Schema validation

### Dev Dependencies (8 packages)

- `@types/better-sqlite3` - TypeScript types
- `@types/node` - Node.js types
- `@typescript-eslint/eslint-plugin` - ESLint TypeScript plugin
- `@typescript-eslint/parser` - ESLint TypeScript parser
- `eslint` - Code linting
- `tsx` - TypeScript execution (backup to Bun)
- `typescript` - TypeScript compiler
- `vitest` - Test runner

**Total**: 487 packages installed (including transitive dependencies)

---

## Performance Tips

### Bun-Specific Optimizations

1. **Use Bun APIs**: Prefer `Bun.file()` over `fs.readFile()` for better performance
2. **Bun Test**: Use `bun test` instead of vitest for faster tests
3. **Bun Build**: Use `bun build` for production bundling (faster than tsc)
4. **Hot Reload**: Use `bun --watch` instead of nodemon/tsx watch

### Example: Fast File Reading

```typescript
// Using Bun API (faster)
const file = Bun.file('./data/shadow-cache.db');
const contents = await file.arrayBuffer();

// vs Node.js API (slower)
import { readFile } from 'fs/promises';
const contents = await readFile('./data/shadow-cache.db');
```

---

## Troubleshooting

### Bun Not Found

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add to PATH (if not automatic)
export PATH="$HOME/.bun/bin:$PATH"
```

### SQLite Issues

```bash
# Rebuild better-sqlite3 for Bun
bun install --force better-sqlite3
```

### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf dist/ *.tsbuildinfo

# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install
```

### Slow Installs

```bash
# Use Bun's global cache
bun install --global-cache

# Clear Bun cache if corrupted
rm -rf ~/.bun/install/cache
```

---

## CI/CD

### GitHub Actions Example

```yaml
name: Weaver CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install

      - name: Type check
        run: bun run typecheck

      - name: Lint
        run: bun run lint

      - name: Test
        run: bun test

      - name: Build
        run: bun run build
```

---

## Migration from npm/yarn

If you're used to npm/yarn, here's a quick reference:

| npm/yarn | Bun equivalent |
|----------|---------------|
| `npm install` | `bun install` |
| `npm run <script>` | `bun run <script>` or `bun <script>` |
| `npm test` | `bun test` |
| `npx <command>` | `bunx <command>` |
| `npm install -g` | `bun install -g` |
| `npm add <pkg>` | `bun add <pkg>` |
| `npm remove <pkg>` | `bun remove <pkg>` |
| `node script.js` | `bun script.js` |

---

## Resources

- **Bun Documentation**: https://bun.sh/docs
- **Bun Runtime APIs**: https://bun.sh/docs/api
- **Bun Performance**: https://bun.sh/docs/runtime/performance
- **Migration Guide**: https://bun.sh/docs/installation#npm-migration

---

**Last Updated**: 2025-10-23
**Bun Version**: 1.3.1+
**Node Version**: 20.0.0+
