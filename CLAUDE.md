# Claude Code Configuration - Knowledge Graph Agent

## Git Remote Configuration

**IMPORTANT**: When working within this package (`packages/knowledge-graph-agent`), always use the `kg-agent` remote for git operations, NOT `origin`.

| Remote | Repository | Usage |
|--------|------------|-------|
| `kg-agent` | weave-logic-ai/knowlege-graph-agent | **USE THIS** for this package |
| `origin` | weave-logic-ai/weave-nn | Monorepo (parent) |

### Git Commands in This Package

**CRITICAL**: Use `git subtree` to push this package to `kg-agent`. Do NOT use regular `git push kg-agent master`.

```bash
# Push changes to kg-agent (ALWAYS use subtree)
cd /home/aepod/dev/weave-nn
git subtree push --prefix=packages/knowledge-graph-agent kg-agent master

# Force push if needed (when histories diverge)
git push kg-agent $(git subtree split --prefix=packages/knowledge-graph-agent):master --force

# Fetch updates
git fetch kg-agent

# Check remote status
git log kg-agent/master --oneline -5
```

### Workflow

1. Make changes in `packages/knowledge-graph-agent/`
2. Commit to monorepo: `git commit` and `git push origin master`
3. Sync to standalone: `git subtree push --prefix=packages/knowledge-graph-agent kg-agent master`

### Why Two Remotes?

This package is developed within the `weave-nn` monorepo but also published as a standalone repository for npm distribution. The `kg-agent` remote points to the standalone repo that users clone/fork.

## Package Info

- **npm**: `@weavelogic/knowledge-graph-agent`
- **Standalone repo**: https://github.com/weave-logic-ai/knowlege-graph-agent
- **Monorepo**: https://github.com/weave-logic-ai/weave-nn
