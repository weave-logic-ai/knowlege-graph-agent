# AI-Powered Commit Message Generator

The Weaver CLI includes an intelligent commit message generator that uses Claude AI to analyze your staged changes and create conventional commit messages automatically.

## Quick Start

```bash
# Stage your changes
git add .

# Generate and create commit with AI
weaver commit

# Preview without committing
weaver commit --dry-run

# Interactive refinement
weaver commit --interactive
```

## Features

- **Automatic Type Detection**: Infers commit type (feat, fix, docs, etc.) from file changes
- **Scope Inference**: Suggests appropriate scope based on changed files
- **Breaking Change Detection**: Identifies potentially breaking changes
- **Conventional Commit Format**: Follows the [Conventional Commits](https://www.conventionalcommits.org/) specification
- **Interactive Mode**: Refine AI suggestions with conversational feedback
- **Custom Templates**: Use project-specific commit templates
- **Recent History Analysis**: Maintains consistency with your commit style

## Command Options

```bash
weaver commit [options]

Options:
  --dry-run              Preview message without committing
  -i, --interactive      Refine AI suggestion interactively
  --template <file>      Use custom commit template
  --type <type>          Override commit type (feat, fix, docs, etc.)
  --scope <scope>        Set commit scope
  --breaking             Mark as breaking change
  --context <text>       Additional context for AI
  --no-history           Don't analyze recent commits for style
```

## Conventional Commit Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code changes that neither fix bugs nor add features
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system or dependency changes
- **ci**: CI configuration changes
- **chore**: Other changes that don't modify src or test files
- **revert**: Revert a previous commit

## Examples

### Basic Usage

```bash
# Stage files
git add src/feature.ts

# Generate commit
weaver commit

# Output:
# feat: add user authentication
#
# Implement JWT-based authentication with:
# - Login endpoint
# - Token validation middleware
# - User session management
```

### With Custom Type and Scope

```bash
git add src/api/users.ts

weaver commit --type fix --scope api
# Output: fix(api): correct user endpoint validation
```

### Interactive Mode

```bash
weaver commit --interactive

# AI generates initial message
# Then prompts:
# > What would you like to do?
#   • Accept this message
#   • Edit manually
#   • Ask AI to refine
#   • Regenerate completely

# If you choose "Ask AI to refine":
# > What should be changed?
# > "Be more specific about the bug fix"

# AI refines the message based on your feedback
```

### Breaking Changes

```bash
# AI detects breaking changes automatically
git add src/api/v2.ts
weaver commit

# Output:
# feat(api)!: migrate to API v2
#
# Complete API redesign with new endpoints.
#
# BREAKING CHANGE: All v1 endpoints have been removed.
# Clients must upgrade to v2 API.
```

### With Additional Context

```bash
weaver commit --context "This fixes the memory leak reported in #123"

# AI incorporates the context into the message
# Output:
# fix(memory): resolve memory leak in event listeners
#
# This fixes the memory leak reported in #123 by properly
# removing event listeners on component unmount.
#
# Closes: #123
```

## Custom Templates

Create a custom template in `.weaver/commit-template.md`:

```markdown
{{type}}{{#if scope}}({{scope}}){{/if}}: {{subject}}

{{body}}

Changes:
{{#each files}}
  - {{this}}
{{/each}}

Reviewed-by: {{author}}
```

Use it with:

```bash
weaver commit --template .weaver/commit-template.md
```

### Template Variables

Available variables:
- `{{type}}` - Commit type (feat, fix, etc.)
- `{{scope}}` - Commit scope
- `{{subject}}` - Commit subject line
- `{{body}}` - Commit body
- `{{footer}}` - Commit footer
- `{{breaking}}` - Breaking change indicator
- `{{files}}` - Array of changed files
- `{{filesChanged}}` - Number of files changed
- `{{insertions}}` - Number of line insertions
- `{{deletions}}` - Number of line deletions
- `{{branch}}` - Current branch name
- `{{author}}` - Author name
- `{{date}}` - Current date
- `{{issues}}` - Issue references

## Configuration

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

Or add to `.env`:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

## Best Practices

1. **Stage Changes Logically**: Group related changes together
2. **One Concern Per Commit**: Keep commits focused on a single change
3. **Review AI Suggestions**: Always review and refine if needed
4. **Use Interactive Mode**: For important commits, use `-i` to refine
5. **Provide Context**: Use `--context` to give AI more information
6. **Maintain Consistency**: Let AI learn from your commit history

## Validation

The generator validates messages against conventional commit standards:

- Subject line under 50 characters
- Imperative mood (e.g., "add" not "added")
- No period at end of subject
- Body lines wrapped at 72 characters
- Proper breaking change format

## Troubleshooting

### No Staged Changes
```
Error: No staged changes found.
Use `git add <files>` to stage changes first.
```

**Solution**: Stage your changes with `git add` before running `weaver commit`.

### API Key Missing
```
Error: ANTHROPIC_API_KEY not configured
```

**Solution**: Set your API key in environment or `.env` file.

### Invalid Commit Format
```
Warning: Generated commit message has validation warnings
```

**Solution**: Use `--interactive` mode to refine the message, or edit manually.

## Advanced Usage

### Batch Commits

For multiple independent changes:

```bash
# Stage first feature
git add src/feature1.ts
weaver commit

# Stage second feature
git add src/feature2.ts
weaver commit
```

### Git Hooks Integration

Add to `.git/hooks/prepare-commit-msg`:

```bash
#!/bin/bash
# Auto-generate commit message if empty
if [ -z "$(cat $1)" ]; then
  weaver commit --dry-run > $1
fi
```

### CI/CD Integration

```yaml
# .github/workflows/commit-lint.yml
name: Commit Lint
on: [pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate commits
        run: |
          # Validate all commits follow conventional format
          git log --format=%s origin/main.. | \
            grep -E "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?:"
```

## API Reference

See the full API documentation in `/docs/api/commit-generator.md`.

## Contributing

To improve the commit generator:

1. Submit examples of good commit messages
2. Report issues with generated messages
3. Suggest improvements to prompts
4. Add custom templates to the template library

## License

MIT License - See LICENSE file for details.
