# Obsolete Decisions Archive

This directory contains decisions that have been superseded or replaced by more recent decisions.

## Purpose

Obsolete decisions are preserved (not deleted) to:
- Maintain complete decision history
- Document why technical directions changed
- Preserve research and rationale for future reference
- Help new team members understand project evolution

## Obsolete Decisions

### D-007: FastMCP Framework (Python)
- **Obsoleted**: 2025-10-23
- **Replaced By**: D-021 (JavaScript/TypeScript Stack Pivot)
- **Reason**: Stack pivot to JavaScript/TypeScript made Python-based FastMCP unnecessary
- **Replacement Technology**: `@modelcontextprotocol/sdk` (official TypeScript MCP SDK from Anthropic)

### D-014: N8N Workflow Automation (Node.js)
- **Obsoleted**: 2025-10-23
- **Replaced By**: D-020 (Weaver Workflow Proxy)
- **Reason**: Weaver provides superior TypeScript-native workflow orchestration
- **Replacement Technology**: Weaver (workflow.dev) for code-first durable workflows

## How Decisions Become Obsolete

A decision becomes obsolete when:
1. **Technology pivot** makes the original choice incompatible
2. **Better alternative** discovered after initial decision
3. **Stack unification** replaces split-technology approaches
4. **Official SDK** released, replacing community alternatives

## Archive Process

When obsoleting a decision:

1. **Update frontmatter**:
   ```yaml
   status: obsolete
   obsolete_date: YYYY-MM-DD
   replaced_by: D-XXX (Decision Title)
   reason: "Brief explanation"
   ```

2. **Add obsolescence notice** at top of document explaining:
   - Why it became obsolete
   - What replaced it
   - When it was obsoleted
   - Impact on project

3. **Move to obsolete/** directory:
   ```bash
   git mv decisions/technical/decision.md decisions/obsolete/D-XXX-decision-name.md
   ```

4. **Update INDEX.md**:
   - Mark decision as obsolete in main listing
   - Add to "Obsolete Decisions" section
   - Update decision counts and statistics

5. **Update related decisions**:
   - Add `obsoletes: [D-XXX]` to replacement decision frontmatter
   - Cross-reference in decision body

## Best Practices

- **Never delete** obsolete decisions - move to this archive
- **Document thoroughly** why the change was made
- **Preserve research** - link to original research documents
- **Cross-reference** - ensure replacement decisions link back
- **Learn from history** - review obsolete decisions when making similar choices

## See Also

- [[../INDEX.md|Decision Index]] - All active decisions
- [[../technical/javascript-typescript-stack-pivot.md|D-021: JavaScript/TypeScript Stack Pivot]]
- [[../technical/adopt-weaver-workflow-proxy.md|D-020: Weaver Workflow Proxy]]
