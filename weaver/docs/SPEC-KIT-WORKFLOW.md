# Spec-Kit Automated Workflow

Fully automated specification generation using AI-powered spec-kit methodology.

## Quick Start

```bash
cd /home/aepod/dev/weave-nn/weaver
bun run generate-spec phase-6-vault-initialization
```

This single command will:
1. ✅ Generate initial specs from phase document
2. 🤖 Run `/speckit.constitution` (AI refinement)
3. 🤖 Run `/speckit.specify` (AI elaboration)
4. 🤖 Run `/speckit.plan` (AI planning)
5. 🤖 Run `/speckit.tasks` (AI task breakdown)
6. 👁️ Prompt for review
7. 🔄 Sync tasks back to phase document

## Workflow Steps

### Step 1: Initial Generation
Parses phase document and creates:
- `constitution.md` - Principles, constraints, success criteria
- `specification.md` - Requirements and scope
- `README.md` - Quick reference
- `.speckit/metadata.json` - Tracking data

### Step 2: AI Constitution Refinement
AI reviews and refines:
- Project principles clarity
- Technical constraints realism
- Dependency accuracy
- Success criteria measurability
- Quality standards completeness

### Step 3: AI Specification Elaboration
AI adds:
- Comprehensive requirements for each objective
- Clear deliverables with acceptance criteria
- In-scope vs out-of-scope definitions
- Architectural considerations
- Integration points

### Step 4: AI Implementation Plan
AI creates:
- Implementation phases/milestones
- Critical path identification
- Effort and timeline estimates
- Resource requirements
- Risk assessment and mitigation
- Dependency graph

### Step 5: AI Task Breakdown
AI generates:
- Hierarchical task numbering (1, 1.1, 1.2, 2, 2.1)
- Clear task descriptions
- Task dependencies
- Effort estimates per task
- Priority levels
- Acceptance criteria per task

### Step 6: Review Prompt
Interactive review before syncing:
```
✅ Spec generation complete!

📁 Spec files generated in: /path/to/specs/phase-6
   - constitution.md (principles & constraints)
   - specification.md (requirements & scope)
   - plan.md (implementation plan)
   - tasks.md (detailed task breakdown)

Please review the generated specs before syncing back to phase document.

Sync tasks back to phase document? (yes/no):
```

### Step 7: AI-Powered Sync
If approved, Claude:
- Reads tasks from `tasks.md`
- Updates task checkboxes in phase document
- Preserves Success Criteria sections
- Maintains all formatting

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
