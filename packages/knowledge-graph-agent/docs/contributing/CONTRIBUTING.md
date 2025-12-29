# Contributing to @weavelogic/knowledge-graph-agent

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Git

### Getting Started

1. Clone the repository:
```bash
git clone https://github.com/weave-nn/weave-nn.git
cd weave-nn/packages/knowledge-graph-agent
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Project Structure

```
knowledge-graph-agent/
├── src/
│   ├── core/           # Core graph and database logic
│   │   ├── types.ts    # Type definitions
│   │   ├── graph.ts    # KnowledgeGraphManager
│   │   └── database.ts # SQLite database
│   ├── generators/     # Content generators
│   │   ├── graph-generator.ts
│   │   ├── docs-init.ts
│   │   └── claude-md.ts
│   ├── integrations/   # External integrations
│   │   └── claude-flow.ts
│   ├── cli/           # CLI commands
│   │   ├── index.ts
│   │   ├── bin.ts
│   │   └── commands/
│   └── index.ts       # Main exports
├── docs/              # Documentation
├── tests/             # Test files
└── package.json
```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

Examples:
```
feat(graph): add BFS traversal algorithm
fix(database): handle null frontmatter values
docs(api): update search method documentation
```

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Keep files under 500 lines
- Write JSDoc comments for public APIs

### Testing

Write tests for:
- All public API functions
- Edge cases and error handling
- Integration between components

```bash
# Run all tests
npm test

# Run specific test file
npm test -- graph.test.ts

# Run with coverage
npm run test:coverage
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/my-feature
```

### 2. Make Your Changes

- Write code following the style guide
- Add/update tests
- Update documentation if needed

### 3. Test Your Changes

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build
npm run build

# Test
npm test
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat(scope): description"
```

### 5. Push and Create PR

```bash
git push origin feature/my-feature
```

Then create a Pull Request on GitHub.

## Adding New Features

### Adding a New CLI Command

1. Create command file in `src/cli/commands/`:

```typescript
// src/cli/commands/my-command.ts
import { Command } from 'commander';

export function createMyCommand(): Command {
  const command = new Command('my-command');

  command
    .description('Description of my command')
    .option('-o, --option <value>', 'Option description')
    .action(async (options) => {
      // Implementation
    });

  return command;
}
```

2. Register in `src/cli/index.ts`:

```typescript
import { createMyCommand } from './commands/my-command.js';

program.addCommand(createMyCommand());
```

3. Add tests and documentation

### Adding a New Node Type

1. Update `src/core/types.ts`:

```typescript
export type NodeType =
  | 'concept'
  | 'technical'
  // ... existing types
  | 'my-new-type';
```

2. Update type inference in `src/generators/graph-generator.ts`
3. Update documentation
4. Add tests

### Adding a New Integration

1. Create integration file in `src/integrations/`:

```typescript
// src/integrations/my-integration.ts
export class MyIntegration {
  constructor(options: MyIntegrationOptions) {
    // ...
  }

  async sync(db: KnowledgeGraphDatabase): Promise<SyncResult> {
    // Implementation
  }
}

export function createMyIntegration(options: MyIntegrationOptions): MyIntegration {
  return new MyIntegration(options);
}
```

2. Export from `src/index.ts`
3. Add documentation and tests

## Documentation

### API Documentation

- Update `docs/API.md` for any API changes
- Include TypeScript types
- Add code examples
- Document all parameters and return values

### README Updates

- Keep README concise
- Link to detailed docs for complex topics
- Update CLI command tables
- Include practical examples

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createKnowledgeGraph } from '../src/core/graph';

describe('KnowledgeGraphManager', () => {
  let graph;

  beforeEach(() => {
    graph = createKnowledgeGraph('test', '/test');
  });

  it('should add nodes', () => {
    graph.addNode({ id: 'test', ... });
    expect(graph.getNode('test')).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Graph Generation', () => {
  it('should generate graph from markdown files', async () => {
    const graph = await generateGraph({
      projectRoot: '/test/fixtures',
      docsPath: 'docs',
    });

    expect(graph.getStats().totalNodes).toBeGreaterThan(0);
  });
});
```

## Reporting Issues

### Bug Reports

Include:
- Node.js version
- Package version
- Steps to reproduce
- Expected vs actual behavior
- Error messages/stack traces

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternatives considered
- Willingness to contribute

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open a GitHub issue for questions
- Check existing issues and documentation first
- Be specific about what you need help with
