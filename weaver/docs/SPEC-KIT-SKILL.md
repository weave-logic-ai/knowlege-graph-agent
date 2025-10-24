# Spec-Kit Skill for Claude Code

AI-powered specification generation using GitHub's spec-driven development methodology with concurrent agent execution.

## Quick Start

```bash
# Option 1: Use helper script (recommended)
./weaver/scripts/spec-kit.sh phase-6-vault-initialization

# Option 2: Manual execution
cd weaver
bun run generate-spec phase-6-vault-initialization
# Then copy/paste Task() commands into Claude Code
bun run sync-tasks-simple phase-6
```

## What is Spec-Kit?

Spec-Kit is a methodology that uses 4 concurrent Claude Code agents to generate comprehensive project specifications:

1. **Constitution Agent** - Refines principles, constraints, success criteria
2. **Specification Agent** - Elaborates requirements and acceptance criteria
3. **Planning Agent** - Creates implementation roadmap and timeline
4. **Task Breakdown Agent** - Generates detailed task list with estimates

## Specification Phases

### Phase 1: Constitution (`/speckit.constitution`)
**Output**: `constitution.md`

Generates:
- 6+ project principles
- 35+ technical constraints
- 35+ success criteria
- Quality standards

### Phase 2: Specification (`/speckit.specify`)
**Output**: `specification.md`

Generates:
- Executive summary
- 44+ functional requirements
- 19+ non-functional requirements
- 77+ acceptance criteria
- Out-of-scope boundaries

### Phase 3: Plan (`/speckit.plan`)
**Output**: `plan.md`

Generates:
- Week-by-week implementation breakdown
- 9+ module descriptions
- Code examples and interfaces
- Critical path analysis
- Risk assessment

### Phase 4: Tasks (`/speckit.tasks`)
**Output**: `tasks.md`

Generates:
- 50-70 hierarchical tasks
- Effort estimates per task
- Priority levels
- Dependency mapping
- Acceptance criteria per task

## Usage Patterns

### Pattern 1: Full Automation (Recommended)

```bash
# Run helper script
./weaver/scripts/spec-kit.sh phase-6-vault-initialization

# This will:
# 1. Generate initial specs
# 2. Spawn 4 agents concurrently via Task tool
# 3. Wait for completion
# 4. Sync tasks back to phase document
```

### Pattern 2: Manual Control

```bash
# Step 1: Generate specs
cd weaver
bun run generate-spec phase-6-vault-initialization

# Step 2: Copy Task() commands from output and paste in Claude Code
# Example output:
# Task("Constitution agent", "cd /specs && run /speckit.constitution", "general-purpose")
# Task("Specification agent", "cd /specs && run /speckit.specify", "general-purpose")
# Task("Planning agent", "cd /specs && run /speckit.plan", "general-purpose")
# Task("Task breakdown agent", "cd /specs && run /speckit.tasks", "general-purpose")

# Step 3: After agents complete, sync tasks
bun run sync-tasks-simple phase-6
```

### Pattern 3: Update Existing Specs

```bash
# Regenerate specs (overwrites existing)
bun run generate-spec phase-6-vault-initialization

# Spawn agents again
[Paste Task() commands in Claude Code]

# Sync updated tasks
bun run sync-tasks-simple phase-6
```

## Concurrent Agent Execution

**CRITICAL**: Always spawn all 4 agents in a SINGLE message for 4x speed improvement:

```javascript
// ✅ CORRECT: All agents in one message
[Single Message]:
  Task("Constitution agent", "...", "general-purpose")
  Task("Specification agent", "...", "general-purpose")
  Task("Planning agent", "...", "general-purpose")
  Task("Task breakdown agent", "...", "general-purpose")

// ❌ WRONG: Sequential messages
Message 1: Task("Constitution agent", "...", "general-purpose")
Message 2: Task("Specification agent", "...", "general-purpose")
```

## File Structure

```
_planning/
├── phases/
│   └── phase-6-vault-initialization.md  # Source
└── specs/
    └── phase-6-vault-initialization/
        ├── constitution.md        # 6 principles, 35+ constraints
        ├── specification.md       # 44 FR, 19 NFR, 77 AC
        ├── plan.md               # 3-week implementation plan
        ├── tasks.md              # 63 detailed tasks
        ├── README.md             # Quick reference
        └── .speckit/
            └── metadata.json     # Generation metadata
```

## Integration with SPARC Methodology

Spec-Kit complements SPARC by providing specification-first development:

| SPARC Phase | Spec-Kit Phase | Output |
|-------------|----------------|--------|
| Specification | Constitution | Principles, constraints |
| Specification | Specification | Requirements, acceptance criteria |
| Architecture | Plan | Implementation roadmap |
| Refinement (TDD) | Tasks | Task breakdown with estimates |

Use together for complete development workflow:

```bash
# 1. Generate specs with Spec-Kit
./weaver/scripts/spec-kit.sh phase-6

# 2. Implement with SPARC TDD
npx claude-flow sparc tdd "vault initialization feature"

# 3. Review with SPARC
npx claude-flow sparc run reviewer "phase 6 implementation"
```

## Performance Benefits

- **4x faster** with concurrent agent execution (vs sequential)
- **500+ lines** of comprehensive specifications
- **63 tasks** with effort estimates and dependencies
- **100% automated** from phase document to synced tasks
- **Zero manual** checkbox management

## Commands Reference

```bash
# Generate specs
bun run generate-spec <phase-id>

# Sync tasks (no AI)
bun run sync-tasks-simple <phase-id>

# Helper script (all-in-one)
./weaver/scripts/spec-kit.sh <phase-id>
```

## See Also

- [Spec-Kit Workflow](./SPEC-KIT-WORKFLOW.md) - Detailed workflow documentation
- [Spec-Kit Protocol](https://github.com/github/spec-kit) - GitHub's spec-kit methodology
- [SPARC Skill](../../.claude/skills/sparc-methodology/SKILL.md) - SPARC methodology integration
