# Spec-Kit Claude Code Workflow

AI-powered specification generation using GitHub's Spec-Kit methodology with Claude Code.

## Quick Start

```bash
cd /home/aepod/dev/weave-nn/weaver
bun run generate-spec phase-6-vault-initialization
```

This **single command** will:
1. Generate initial specs from phase document
2. Run `/speckit.constitution` to refine principles
3. Run `/speckit.specify` to elaborate requirements
4. Run `/speckit.plan` to create implementation plan
5. Run `/speckit.tasks` to generate task breakdown

All steps are **fully automated** - the workflow calls Claude Code commands directly.

**After completion:** Review specs and sync back to phase document:
```bash
bun run sync-tasks-ai phase-6
```

## Workflow Steps

### Step 1: Initial Generation (Automated)
Parses phase document and creates:
- `constitution.md` - Principles, constraints, success criteria
- `specification.md` - Requirements and scope
- `README.md` - Quick reference
- `.speckit/metadata.json` - Tracking data

### Step 2: `/speckit.constitution` (Automated)
Claude Code refines:
- Project principles and values
- Technical constraints validation
- Dependency accuracy checks
- Measurable success criteria
- Quality standards

### Step 3: `/speckit.specify` (Automated)
Claude Code elaborates:
- Comprehensive requirements
- Clear deliverables with acceptance criteria
- In-scope vs out-of-scope boundaries
- Architectural considerations
- Integration points

### Step 4: `/speckit.plan` (Automated)
Claude Code creates:
- Implementation phases/milestones
- Critical path identification
- Effort and timeline estimates
- Resource requirements
- Risk assessment and mitigation
- Dependency graph

### Step 5: `/speckit.tasks` (Automated)
Claude Code generates:
- Hierarchical task breakdown (1, 1.1, 1.2)
- Clear task descriptions
- Task dependencies
- Effort estimates per task
- Priority levels
- Acceptance criteria per task

### Step 6: Review & Sync (Manual)

Review the generated specs, then sync tasks back:

```bash
bun run sync-tasks-ai phase-6
```

Claude AI will:
- Read tasks from generated specs
- Update task checkboxes in phase document
- Preserve Success Criteria sections (never modify)
- Maintain all formatting and structure

## File Structure

```
_planning/
├── phases/
│   └── phase-6-vault-initialization.md  # Source phase document
└── specs/
    └── phase-6/
        ├── constitution.md        # AI-refined principles
        ├── specification.md       # AI-elaborated requirements
        ├── plan.md               # AI-generated implementation plan
        ├── tasks.md              # AI-generated task breakdown
        ├── README.md             # Quick reference
        └── .speckit/
            └── metadata.json     # Generation metadata
```

## YAML Frontmatter

All spec files include vault-compatible frontmatter:

```yaml
---
spec_type: "specification"
phase_id: "PHASE-6"
phase_name: "Vault Initialization System"
status: "pending"
priority: "high"
duration: "15-20 days"
generated_date: "2025-10-24"
task_count: 63
tags:
  - spec-kit
  - specification
  - phase-6
links:
  phase_document: "[[phase planning document]]"
  constitution: "[[constitution.md]]"
---
```

## Manual Commands

If you need individual steps:

```bash
# Simple generation (no AI refinement)
bun run generate-spec-simple phase-6

# AI-powered task sync only
bun run sync-tasks-ai phase-6

# Legacy regex sync
bun run sync-tasks phase-6
```

## Benefits

### Fully Automated
- **One command** runs entire spec-kit pipeline
- Calls Claude Code commands directly via workflow
- No manual intervention required
- Complete automation from phase → specs

### AI-Powered Quality
- Claude Code refines all specifications
- Validates principles and constraints
- Ensures measurable criteria
- Creates actionable task breakdown

### Seamless Integration
- Works with any phase document structure
- Context-aware AI parsing
- Intelligent task extraction
- No brittle regex patterns

### Vault Native
- YAML frontmatter for metadata
- Wikilink cross-references
- Obsidian graph view integration
- Tag-based organization

## Environment Setup

Requires `VERCEL_AI_GATEWAY_API_KEY` in `/weaver/.env`:

```bash
VERCEL_AI_GATEWAY_API_KEY=vck_...
VAULT_PATH=/home/aepod/dev/weave-nn/weave-nn
```

The system uses Vercel AI Gateway (Cloudflare) for secure, rate-limited API access to Claude.

## Troubleshooting

### API Key Error
```
❌ Error: VERCEL_AI_GATEWAY_API_KEY environment variable not set
```
**Solution**: Add Vercel AI Gateway key to `/weaver/.env`

### Phase Not Found
```
❌ No phase document found matching: phase-6
```
**Solution**: Use exact phase file name (without .md extension)

### Multiple Phases Found
```
⚠️  Multiple phase documents found for: phase-6
```
**Solution**: Use more specific name (e.g., `phase-6-vault-initialization`)

## Integration with Spec-Kit Protocol

This workflow implements GitHub's Spec-Kit methodology:

1. **Constitution** → Define principles and constraints
2. **Specify** → Elaborate requirements and scope
3. **Plan** → Create implementation roadmap
4. **Tasks** → Break down into actionable items
5. **Implement** → Execute with spec as reference

Learn more: https://github.com/github/spec-kit

---

**Generated**: 2025-10-24
**Workflow**: Automated AI-powered spec generation
**Version**: 1.0.0
