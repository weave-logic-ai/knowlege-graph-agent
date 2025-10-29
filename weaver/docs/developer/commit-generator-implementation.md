# AI-Powered Commit Message Generator - Implementation Guide

## Overview

The AI-powered commit message generator is a comprehensive system that analyzes git diffs and uses Claude AI to generate conventional commit messages automatically.

## Architecture

### Module Structure

```
src/git/
├── diff-analyzer.ts       # Git diff parsing and analysis
├── conventional.ts        # Conventional commit format helpers
├── templates.ts           # Template system for commit messages
├── commit-generator.ts    # Core AI-powered generator
└── git-client.ts          # Git operations wrapper (existing)

src/cli/commands/
└── commit.ts              # CLI command with interactive mode

tests/git/
├── diff-analyzer.test.ts
├── conventional.test.ts
├── templates.test.ts
└── commit-generator.test.ts
```

## Components

### 1. Diff Analyzer (`diff-analyzer.ts`)

**Purpose**: Parse git diffs and extract structured information

**Key Functions**:
- `parseDiff(diffOutput: string): FileChange[]` - Parse diff to extract file changes
- `calculateStats(files: FileChange[]): DiffStats` - Calculate change statistics
- `inferCommitType(files: FileChange[]): ConventionalCommitType` - Infer commit type from changes
- `inferScope(files: FileChange[]): string | undefined` - Infer scope from file paths
- `detectBreakingChanges(files, diff): { hasBreakingChanges, indicators }` - Detect breaking changes
- `analyzeDiff(diffOutput: string): DiffAnalysis` - Complete diff analysis

**Features**:
- Detects file status: added, modified, deleted, renamed
- Counts insertions and deletions
- Infers commit type from file patterns:
  - `test` for test files
  - `docs` for markdown files
  - `ci` for workflow files
  - `build` for package.json
  - `feat` for new files
  - `refactor` for large changes
  - `fix` for small changes
- Infers scope from common directory
- Detects breaking changes from:
  - Deleted files
  - Renamed files
  - Keywords in diff (BREAKING CHANGE, deprecated, etc.)
  - Version changes

### 2. Conventional Commit Helpers (`conventional.ts`)

**Purpose**: Work with conventional commit format following [conventionalcommits.org](https://www.conventionalcommits.org/)

**Key Functions**:
- `formatCommitMessage(commit, options): string` - Format commit to string
- `parseCommitMessage(message: string): ConventionalCommit | null` - Parse commit string
- `validateCommitMessage(message: string): { valid, errors }` - Validate format
- `isValidType(type: string): boolean` - Validate commit type
- `getTypeDescription(type): string` - Get type description
- `getAllTypes(): ConventionalCommitType[]` - Get all valid types
- `extractIssueReferences(message: string): string[]` - Extract issue refs

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `perf`: Performance
- `test`: Tests
- `build`: Build system
- `ci`: CI configuration
- `chore`: Other changes
- `revert`: Revert commit

**Format**:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Validation Rules**:
- Subject ≤ 50 characters
- Imperative mood
- No period at end
- Body lines ≤ 72 characters
- Breaking changes marked with `!` or `BREAKING CHANGE:`

### 3. Template System (`templates.ts`)

**Purpose**: Support custom commit message templates

**Key Functions**:
- `loadTemplate(templatePath: string): Template` - Load template from file
- `renderTemplate(template, context): string` - Render with variables
- `createContextFromDiff(analysis, additionalContext): TemplateContext` - Create context
- `validateTemplate(template: string): { valid, errors, warnings }` - Validate template
- `getBuiltInTemplate(name: string): string` - Get built-in template
- `loadProjectTemplate(repoPath: string): Template | null` - Load project template

**Template Variables**:
- `{{type}}` - Commit type
- `{{scope}}` - Commit scope
- `{{subject}}` - Subject line
- `{{body}}` - Body text
- `{{footer}}` - Footer text
- `{{breaking}}` - Breaking indicator
- `{{files}}` - Changed files array
- `{{filesChanged}}` - File count
- `{{insertions}}` - Insertions count
- `{{deletions}}` - Deletions count
- `{{branch}}` - Branch name
- `{{author}}` - Author name
- `{{date}}` - Date
- `{{issues}}` - Issue references

**Built-in Templates**:
- `default` - Standard format
- `detailed` - With statistics
- `simple` - Minimal format

**Template Locations**:
1. `.weaver/commit-template.md` (project-specific)
2. `.gitmessage` (git standard)

### 4. Commit Generator (`commit-generator.ts`)

**Purpose**: Core AI-powered commit message generation

**Class**: `CommitGenerator`

**Methods**:
- `generate(options): Promise<GeneratedCommit>` - Generate commit message
- `commit(generatedCommit, options): Promise<{ sha, message }>` - Create commit
- `refine(currentMessage, feedback): Promise<string>` - Refine with feedback
- `preview(options): Promise<{ message, analysis, validation }>` - Preview without commit

**Generation Process**:
1. Get staged diff from git
2. Analyze diff to extract metadata
3. Load project template if available
4. Get recent commit history for style
5. Build AI prompt with:
   - File changes summary
   - Statistics
   - Suggested type/scope
   - Breaking change indicators
   - Recent commits for style
   - Additional context
   - Diff content
6. Call Claude AI to generate message
7. Parse and validate result
8. Return generated commit

**AI Prompt Structure**:
```
Generate a conventional commit message for the following changes:

FILES CHANGED:
  - file1.ts (modified, +10/-5)
  - file2.ts (added, +50/-0)

STATISTICS:
  Files: 2
  Insertions: 60
  Deletions: 5

SUGGESTED:
  Type: feat
  Scope: api

RECENT COMMITS (for style consistency):
  - feat(auth): add login endpoint
  - fix(api): correct validation

DIFF:
[diff content]

REQUIREMENTS:
1. Follow conventional commit format
2. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
3. Subject: imperative mood, no period, under 50 chars
4. Body: explain what and why, wrap at 72 chars
5. Footer: breaking changes, issue references
```

**Features**:
- Automatic type and scope detection
- Breaking change detection
- Style consistency with history
- Custom template support
- Context injection
- Dry run mode
- Interactive refinement

### 5. CLI Command (`cli/commands/commit.ts`)

**Purpose**: User-facing command-line interface

**Command**: `weaver commit [options]`

**Options**:
- `--dry-run` - Preview without committing
- `-i, --interactive` - Interactive refinement
- `--template <file>` - Custom template
- `--type <type>` - Override type
- `--scope <scope>` - Set scope
- `--breaking` - Mark breaking
- `--context <text>` - Additional context
- `--no-history` - Skip history analysis

**Interactive Mode**:
1. Generate initial message
2. Display to user
3. Prompt for action:
   - Accept message
   - Edit manually (opens editor)
   - Ask AI to refine (conversational feedback)
   - Regenerate completely
4. Repeat until accepted
5. Create commit

**User Flow**:
```
$ weaver commit

Staged files:
  • src/feature.ts

✓ Commit message generated

Generated Commit Message:
──────────────────────────────────────────────────
feat: add user authentication

Implement JWT-based authentication with:
- Login endpoint
- Token validation middleware
- User session management
──────────────────────────────────────────────────

Analysis:
  Type: feat
  Files: 1
  +100 -0

? Create commit with this message? (Y/n)
```

## Integration Points

### Git Client

Uses existing `GitClient` from `src/git/git-client.ts`:
- `diff({ cached: true })` - Get staged changes
- `log({ maxCount: 5 })` - Get recent commits
- `commit(message)` - Create commit
- `getRepoPath()` - Get repository path

### Claude Client

Uses existing `ClaudeClient` from `src/agents/claude-client.ts`:
- `sendMessage(prompt, options)` - Generate commit message
- Rate limiting and retry logic
- Circuit breaker for failures

### CLI Infrastructure

Integrates with existing CLI in `src/cli/index.ts`:
- Registered as top-level command
- Uses Commander.js patterns
- Chalk for colors
- Ora for spinners
- Inquirer for prompts

## Testing

### Test Coverage

**diff-analyzer.test.ts**: 12 tests
- Parse new files
- Parse deleted files
- Parse renamed files
- Parse modifications
- Calculate statistics
- Infer commit types (7 scenarios)
- Infer scope
- Detect breaking changes
- Complete analysis

**conventional.test.ts**: 15 tests
- Format basic messages
- Format with scope
- Format breaking changes
- Format with body/footer
- Truncate long subjects
- Include emojis
- Parse messages
- Validate messages
- Extract issue references

**templates.test.ts**: 10 tests
- Render simple variables
- Handle missing variables
- Clean whitespace
- Create context from diff
- Simple rendering
- Validate templates
- Built-in templates

**commit-generator.test.ts**: 10 tests
- Error on no changes
- Generate from diff
- Custom type/scope
- Skip history
- AI failure handling
- Create commit
- Dry run mode
- Refine message
- Preview mode

**Total**: 47 comprehensive tests

### Running Tests

```bash
# All tests
npm run test

# Git module tests only
npm run test tests/git/

# Watch mode
npm run test:watch

# Coverage
npm run test -- --coverage
```

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_api_key

# Optional (from config)
GIT_AUTHOR_NAME="Your Name"
GIT_AUTHOR_EMAIL="you@example.com"
```

### Config File

Uses existing config from `src/config/index.ts`:
- `config.anthropic.apiKey`
- `config.anthropic.model`
- `config.git.authorName`
- `config.git.authorEmail`

## Usage Examples

### Basic Usage

```bash
git add src/feature.ts
weaver commit
```

### Custom Type and Scope

```bash
weaver commit --type fix --scope api
```

### Breaking Change

```bash
weaver commit --breaking --context "Removed deprecated API v1"
```

### Interactive Refinement

```bash
weaver commit -i

# AI generates message
# Prompt: What would you like to do?
# Choose: Ask AI to refine
# Enter: "Be more specific about the bug"
# AI refines message
# Repeat until satisfied
```

### Custom Template

```bash
weaver commit --template .weaver/commit-template.md
```

### Dry Run

```bash
weaver commit --dry-run > commit.txt
```

## Error Handling

### No Staged Changes
```
Error: No staged changes found.
Use `git add <files>` to stage changes first.
```

### Missing API Key
```
Error: ANTHROPIC_API_KEY not configured
```

### AI Generation Failure
```
Error: Failed to generate commit message
```

### Invalid Format
```
Warning: Generated commit message has validation warnings:
- Subject exceeds 50 characters
```

### Rate Limiting
Handled automatically by `ClaudeClient`:
- Exponential backoff
- Circuit breaker
- Retry logic

## Performance

- **Diff Parsing**: O(n) where n = diff lines
- **Type Inference**: O(m) where m = files changed
- **AI Generation**: 2-5 seconds typical
- **Total**: ~3-6 seconds for average commit

## Security

- API key from environment (never hardcoded)
- Git operations validated
- No sensitive data in prompts
- Template injection prevention

## Future Enhancements

1. **Multi-language Support**: i18n for commit messages
2. **Custom AI Models**: Support other LLMs
3. **Commit Hooks**: Auto-generate on commit
4. **PR Integration**: Generate PR descriptions
5. **Learning Mode**: Train on user's commit history
6. **Team Templates**: Shared template library
7. **Emoji Mode**: Gitmoji support
8. **Batch Commits**: Handle multiple logical changes

## Contributing

See main CONTRIBUTING.md for guidelines.

### Adding New Commit Types

Edit `src/git/conventional.ts`:
```typescript
const TYPE_DESCRIPTIONS = {
  // Add new type
  experimental: 'Experimental feature'
};
```

### Improving Type Detection

Edit `src/git/diff-analyzer.ts`:
```typescript
export function inferCommitType(files: FileChange[]) {
  // Add new detection logic
  if (paths.some(p => p.includes('experimental/'))) {
    return 'experimental';
  }
}
```

### Custom Prompts

Edit `src/git/commit-generator.ts`:
```typescript
private buildPrompt(...) {
  // Modify prompt structure
}
```

## License

MIT License - See LICENSE file for details.
