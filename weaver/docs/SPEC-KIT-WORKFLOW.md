# Spec-Kit Claude Code Workflow

AI-powered specification generation using GitHub's Spec-Kit methodology with Claude Code.

## Quick Start

```bash
cd /home/aepod/dev/weave-nn/weaver
bun run generate-spec phase-6-vault-initialization
```

**Step 1:** Generate initial specs (automated)

**Step 2-5:** Run spec-kit commands in Claude Code:
```
/speckit.constitution   # Refine principles & constraints
/speckit.specify        # Elaborate requirements & scope
/speckit.plan          # Create implementation plan
/speckit.tasks         # Generate detailed task breakdown
```

**Step 6:** Sync tasks back to phase document:
```bash
bun run sync-tasks-ai phase-6
```

## Workflow Steps

### Step 1: Initial Generation
Parses phase document and creates:
- `constitution.md` - Principles, constraints, success criteria
- `specification.md` - Requirements and scope
- `README.md` - Quick reference
- `.speckit/metadata.json` - Tracking data

### Step 2-5: Claude Code AI Refinement

Open the generated specs in Claude Code and run:

**Step 2: `/speckit.constitution`**
- Reviews and refines project principles
- Validates technical constraints
- Checks dependency accuracy
- Ensures measurable success criteria
- Adds missing quality standards

**Step 3: `/speckit.specify`**
- Elaborates comprehensive requirements
- Defines clear deliverables with acceptance criteria
- Clarifies in-scope vs out-of-scope
- Adds architectural considerations
- Identifies integration points

**Step 4: `/speckit.plan`**
- Creates implementation phases/milestones
- Identifies critical path
- Estimates effort and timeline
- Defines resource requirements
- Assesses risks and mitigation
- Builds dependency graph

**Step 5: `/speckit.tasks`**
- Generates hierarchical task breakdown (1, 1.1, 1.2)
- Writes clear task descriptions
- Defines task dependencies
- Estimates effort per task
- Assigns priority levels
- Adds acceptance criteria per task

### Step 6: AI-Powered Sync

After reviewing the generated specs, sync tasks back:

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

### AI-Powered
- Handles any document structure
- Context-aware parsing
- Intelligent task extraction
- No brittle regex patterns

### Seamless Workflow
- One command to generate everything
- Interactive review step
- Automatic sync back to phase

### Vault Integration
- YAML frontmatter for metadata
- Wikilink cross-references
- Obsidian graph view integration
- Tag-based organization

### Quality Assurance
- AI validates principles
- Checks constraints realism
- Ensures measurable criteria
- Creates actionable tasks

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
