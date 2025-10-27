# Weaver CLI - `init-vault` Command

## Overview

The `weaver init-vault` command initializes a new Weave-NN vault from an existing project. It automatically detects the framework, scans the directory structure, and generates an appropriate vault layout.

## Usage

```bash
weaver init-vault <project-path> [options]
```

### Arguments

- `<project-path>` - Path to the project directory to scan (required)

### Options

- `-o, --output <path>` - Vault output directory (default: `<project-path>/.vault`)
- `-t, --template <name>` - Template to use: `nextjs`, `react`, `auto` (default: `auto`)
- `-d, --dry-run` - Preview changes without writing files
- `--offline` - Disable AI features (offline mode)
- `--no-git` - Skip Git repository initialization

## Examples

### Basic Usage

Initialize a vault with auto-detection:

```bash
weaver init-vault /path/to/my-nextjs-app
```

### Custom Output Directory

Specify a custom vault location:

```bash
weaver init-vault ./my-project --output ./my-vault
```

### Dry Run

Preview what would be created without writing files:

```bash
weaver init-vault ./my-project --dry-run
```

### Specific Template

Force a specific template:

```bash
weaver init-vault ./my-project --template nextjs
```

### Without Git

Skip Git repository initialization:

```bash
weaver init-vault ./my-project --no-git
```

## Interactive Mode

If required options are missing, the CLI will prompt you interactively:

```bash
$ weaver init-vault ./my-project

? Vault output directory: ./my-project/.vault
? Select vault template: (Use arrow keys)
❯ Auto-detect (recommended)
  Next.js App Router
  React + Vite
```

## Workflow

The command follows this workflow:

1. **Validate Project Path** - Ensures the project directory exists
2. **Detect Framework** - Analyzes package.json and project structure
3. **Load Template** - Selects appropriate vault template
4. **Scan Directory** - Recursively scans project files
5. **Generate Nodes** - Creates vault nodes based on template
6. **Write Vault** - Creates directory structure and files
7. **Initialize Shadow Cache** - Builds fast metadata index
8. **Initialize Git** - Sets up version control (optional)

## Output Structure

A typical vault structure looks like:

```
.vault/
├── concepts/
│   ├── README.md
│   └── (concept nodes)
├── technical/
│   ├── README.md
│   └── (technical nodes)
├── features/
│   ├── README.md
│   └── (feature nodes)
├── .shadow-cache.db
└── .gitignore
```

## Framework Detection

The CLI automatically detects:

- **Next.js** - Identifies App Router vs Pages Router
- **React** - Detects Vite, CRA, or standalone React
- **TypeScript** - Checks for tsconfig.json
- **Tailwind CSS** - Looks for tailwind config

Detection confidence is displayed during execution.

## Templates

### Next.js App Router

For Next.js 13+ applications using the App Router:

- Concept nodes for architecture patterns
- Technical nodes for components, API routes, hooks
- Feature nodes for user stories

### React + Vite

For React applications with Vite:

- Component specifications
- State management patterns
- Routing documentation

### Auto-detect

Automatically selects the best template based on detected framework.

## Dry-Run Mode

Use `--dry-run` to preview changes:

```bash
$ weaver init-vault ./my-project --dry-run

🧵 Weave-NN Vault Initialization

✓ Project path validated
✓ Framework detected: nextjs v14.0.0
✓ Template loaded: Next.js App Router

📋 Dry-Run Preview

The following structure would be created:

  📁 concepts/ - High-level architectural concepts
    📄 app-router.md - Next.js App Router architecture
    📄 server-components.md - React Server Components patterns

  📁 technical/ - Technical implementation details
    📄 components.md - Reusable UI component specifications
    📄 api-routes.md - API route handlers

  📁 features/ - Feature-specific knowledge
    📄 user-management.md - User-related features

⚠ This is a dry-run. No files were written.
ℹ Remove --dry-run flag to create the vault.
```

## Error Handling

The CLI provides helpful error messages and recovery suggestions:

```bash
✗ package.json Error
✗ package.json not found at: /path/to/project/package.json

ℹ Suggestions:
  • Ensure package.json exists in the project root
  • Verify package.json is valid JSON
  • Check file permissions
```

## Shadow Cache

The shadow cache is automatically initialized to provide:

- Fast file metadata queries
- Tag and link indexing
- Full-text search capabilities

You can disable this with `--no-cache` (if implemented).

## Git Integration

By default, the CLI initializes a Git repository:

- Creates `.gitignore` for cache files
- Makes initial commit with vault structure
- Skipped if Git repo already exists

Disable with `--no-git`:

```bash
weaver init-vault ./my-project --no-git
```

## Offline Mode

Use `--offline` to disable AI-powered features:

```bash
weaver init-vault ./my-project --offline
```

In offline mode:

- Template-based generation only
- No AI-powered suggestions
- Faster initialization

## Troubleshooting

### Permission Denied

```bash
Error: EACCES: permission denied
```

**Solution**: Ensure you have write permissions to the output directory.

### Invalid Project Structure

```bash
Error: package.json not found
```

**Solution**: Run the command from a valid Node.js project directory.

### Template Not Found

```bash
Error: Template not found: custom-template
```

**Solution**: Use one of the built-in templates or check template name spelling.

## Advanced Usage

### Custom Templates

You can extend templates programmatically:

```typescript
import { templateLoader } from '@weave-nn/weaver';

templateLoader.extendTemplate('nextjs-app-router', 'my-custom-template', {
  // Custom overrides
});
```

### Programmatic API

Use the CLI programmatically:

```typescript
import { initVault } from '@weave-nn/weaver/cli';

await initVault('/path/to/project', {
  output: '/path/to/vault',
  template: 'nextjs',
  dryRun: false,
});
```

## Next Steps

After initializing the vault:

1. **Review Structure** - Check generated nodes and directories
2. **Customize Templates** - Modify node templates as needed
3. **Start Weaver** - Run the Weaver service for file watching
4. **Populate Content** - Begin documenting your project

## Related Commands

- `weaver-mcp` - Start the MCP server for AI integration
- (Future) `weaver sync` - Sync vault with project changes
- (Future) `weaver query` - Query vault knowledge

## Support

For issues or questions:

- GitHub Issues: [weave-nn/weaver](https://github.com/weave-nn/weaver)
- Documentation: [docs.weave-nn.dev](https://docs.weave-nn.dev)
