# Claude Code Configuration - Knowledge Graph Agent

## Git Remote Configuration

**IMPORTANT**: When working within this package (`packages/knowledge-graph-agent`), always use the `kg-agent` remote for git operations, NOT `origin`.

| Remote | Repository | Usage |
|--------|------------|-------|
| `kg-agent` | weave-logic-ai/knowlege-graph-agent | **USE THIS** for this package |
| `origin` | weave-logic-ai/weave-nn | Monorepo (parent) |

### Git Commands in This Package

```bash
# Push changes
git push kg-agent master

# Push with tags
git push kg-agent master --tags

# Fetch updates
git fetch kg-agent

# Check remote status
git log kg-agent/master --oneline -5
```

### Why Two Remotes?

This package is developed within the `weave-nn` monorepo but also published as a standalone repository for npm distribution. The `kg-agent` remote points to the standalone repo that users clone/fork.

## Package Info

- **npm**: `@weavelogic/knowledge-graph-agent`
- **Standalone repo**: https://github.com/weave-logic-ai/knowlege-graph-agent
- **Monorepo**: https://github.com/weave-logic-ai/weave-nn
