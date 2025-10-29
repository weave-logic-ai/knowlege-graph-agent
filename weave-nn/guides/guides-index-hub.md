---
type: index
title: Guides Hub
status: active
created_date: '2025-10-23'
cssclasses:
  - index
  - navigation
  - guides
tags:
  - index
  - guides
  - navigation
  - howto
scope: system
priority: high
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-index
    - status-active
    - priority-high
  graph_group: navigation
version: '3.0'
updated_date: '2025-10-28'
---

# Guides Directory

**Purpose**: Step-by-step how-to guides for implementing, deploying, troubleshooting, and operating WeaveNN systems.

## What IS a Guide?

A **guide** is a **step-by-step instruction manual** that walks someone through **HOW TO DO** a specific task or operation. Guides are:

- **Action-oriented**: "How to set up X", "How to deploy Y", "How to debug Z"
- **Sequential**: Numbered steps that must be followed in order
- **Reproducible**: Anyone following the steps should get the same result
- **Practical**: Focused on execution, not theory or design
- **Task-specific**: One guide = one clear objective

**Core principle**: If you're asking "How do I...?", you need a guide.

## Core Characteristics

### What Makes It a Guide?

1. **Step-by-step instructions** - Numbered, sequential procedures
2. **Concrete actions** - "Run this command", "Edit this file", "Click this button"
3. **Expected outcomes** - What you should see after each step
4. **Prerequisites** - What you need before starting
5. **Troubleshooting** - Common issues and solutions during execution

### Guide vs Other Documentation

| Aspect | Guide | Workflow | Architecture | Technical Doc |
|--------|-------|----------|--------------|---------------|
| **Focus** | How to DO it | What the PROCESS is | How it's DESIGNED | What it IS |
| **Content** | Steps 1-2-3 | Process definition | System design | Concept explanation |
| **Question** | "How do I...?" | "What's the process?" | "How is it structured?" | "What does it do?" |
| **Example** | Deploy with Docker | Git workflow rules | MCP server design | MCP protocol spec |
| **Outcome** | Task completed | Process understood | Design understood | Concept learned |

## Scope Boundaries

### ✅ This IS a Guide

- **Implementation steps**: "How to set up local dev environment"
- **Deployment procedures**: "How to deploy to production"
- **Debugging steps**: "How to troubleshoot RabbitMQ issues"
- **Operation instructions**: "How to scale the swarm"
- **Configuration guides**: "How to configure authentication"

### ❌ This is NOT a Guide

- **Process definitions**: "Git workflow" → `/workflows/`
- **System architecture**: "MCP server design" → `/architecture/`
- **Concept explanations**: "What is SPARC?" → `/technical/`
- **API reference**: "API endpoints list" → `/technical/api/`
- **Decision records**: "Why we chose X" → `/decisions/`

## Directory Structure

```
/guides/
├── README.md                          # This file
├── setup/                             # Environment setup guides
│   ├── local-dev-setup.md            # Set up local development
│   ├── mcp-server-setup.md           # Configure MCP servers
│   └── database-setup.md             # Initialize database
├── deployment/                        # Deployment guides
│   ├── docker-compose-deploy.md      # Deploy with Docker Compose
│   ├── kubernetes-deploy.md          # Deploy to Kubernetes
│   └── production-checklist.md       # Pre-deployment verification
├── troubleshooting/                   # Debugging guides
│   ├── rabbitmq-debug.md             # Fix RabbitMQ issues
│   ├── agent-spawn-failures.md       # Debug agent spawning
│   └── memory-leaks.md               # Diagnose memory issues
├── development/                       # Development guides
│   ├── create-mcp-tool.md            # Add new MCP tool
│   ├── add-agent-type.md             # Create new agent type
│   └── write-hooks.md                # Implement coordination hooks
└── operations/                        # Operational guides
    ├── scale-swarm.md                # Scale agent swarm
    ├── backup-restore.md             # Backup and restore data
    └── monitor-performance.md        # Monitor system health
```

## 5 Guide Categories

### 1. Setup (`/guides/setup/`)

**When to use**: First-time installation, environment configuration, initial setup

**Examples**:
- Setting up local development environment
- Configuring MCP servers
- Installing dependencies
- Initializing database schema
- Setting up authentication

**Characteristics**:
- Run once or infrequently
- Create foundation for other work
- Often has prerequisites
- Critical for onboarding

### 2. Deployment (`/guides/deployment/`)

**When to use**: Releasing code, deploying to environments, publishing artifacts

**Examples**:
- Deploying with Docker Compose
- Kubernetes deployment
- CI/CD pipeline setup
- Production deployment checklist
- Rollback procedures

**Characteristics**:
- Repeatable process
- Environment-specific
- Often includes verification steps
- May have rollback procedures

### 3. Troubleshooting (`/guides/troubleshooting/`)

**When to use**: Debugging issues, diagnosing problems, fixing errors

**Examples**:
- Debugging RabbitMQ connection failures
- Fixing agent spawn errors
- Resolving memory leaks
- Tracing failed workflows
- Investigating performance issues

**Characteristics**:
- Problem-solution format
- Diagnostic steps first
- Multiple solution paths
- Includes symptoms and causes

### 4. Development (`/guides/development/`)

**When to use**: Creating new features, extending the system, adding functionality

**Examples**:
- Creating a new MCP tool
- Adding a new agent type
- Writing coordination hooks
- Implementing a new neural pattern
- Extending the API

**Characteristics**:
- Code-focused
- Follows established patterns
- Includes testing steps
- Often references architecture docs

### 5. Operations (`/guides/operations/`)

**When to use**: Maintaining, monitoring, scaling, managing running systems

**Examples**:
- Scaling the agent swarm
- Backing up and restoring data
- Monitoring performance metrics
- Managing memory usage
- Rotating credentials

**Characteristics**:
- Ongoing maintenance
- Performance-focused
- Often scheduled or triggered
- Includes monitoring steps

## When to CREATE a Guide

### Decision Criteria

Create a guide when:

1. **Repeatable task**: Someone will need to do this again
2. **Multiple steps**: More than 2-3 actions required
3. **Specific outcome**: Clear success criteria
4. **Common need**: Multiple people will do this
5. **Error-prone**: Easy to make mistakes without guidance

### DON'T Create a Guide For

1. **One-time tasks**: Document in logs or decisions instead
2. **Obvious operations**: "How to open a file" - too basic
3. **Process definitions**: Create workflow documentation instead
4. **Theoretical concepts**: Create technical documentation instead
5. **System design**: Create architecture documentation instead

## Guide Template Structure

Every guide should follow this structure:

```yaml
---
title: "Guide Title: How to [Action]"
category: setup|deployment|troubleshooting|development|operations
difficulty: beginner|intermediate|advanced
estimated_time: "15 minutes"
prerequisites:
  - Prerequisite 1
  - Prerequisite 2
last_updated: YYYY-MM-DD
---

# How to [Action]

## Overview

Brief description of what this guide accomplishes and when to use it.

## Prerequisites

- Specific requirement 1
- Specific requirement 2
- Specific requirement 3

## Steps

### 1. [First Major Step]

Detailed explanation of the step.

```bash
# Commands to run
command --with-flags
```

**Expected output**:
```
What you should see
```

**Verification**:
- How to confirm this step worked

### 2. [Second Major Step]

Continue with clear, actionable instructions.

### 3. [Final Step]

Complete the task.

## Verification

How to confirm the entire task was completed successfully:

1. Check X
2. Verify Y
3. Test Z

## Troubleshooting

### Issue: [Common Problem]

**Symptoms**:
- What you see when this occurs

**Solution**:
1. Step to fix
2. Verification

### Issue: [Another Problem]

...

## Related Guides

- [Related guide 1](../category/guide.md)
- [Related guide 2](../category/guide.md)

## Further Reading

- [Technical doc](../../technical/concept.md)
- [Architecture doc](../../architecture/system.md)
```

## Good vs Bad Examples

### ✅ GOOD: Clear, Actionable Guide

**Title**: "How to Set Up Local Development Environment"

**Location**: `/guides/setup/local-dev-setup.md`

**Structure**:
```markdown
1. Install Node.js 18+
   - Download from nodejs.org
   - Verify: `node --version`

2. Clone repository
   - `git clone https://github.com/...`
   - `cd weave-nn`

3. Install dependencies
   - `npm install`
   - Expected: 45 packages installed

4. Configure environment
   - Copy `.env.example` to `.env`
   - Set ANTHROPIC_API_KEY

5. Run tests
   - `npm test`
   - Expected: All tests pass
```

**Why it's good**:
- Clear steps with commands
- Verification at each step
- Expected outcomes specified
- Reproducible results

### ❌ BAD: Vague, Theoretical Content

**Title**: "Development Best Practices"

**Location**: `/guides/development/best-practices.md`

**Structure**:
```markdown
1. Write good code
   - Follow patterns
   - Use best practices

2. Test your work
   - Tests are important
   - Coverage matters

3. Document changes
   - Update docs
   - Write comments
```

**Why it's bad**:
- No specific actions
- No commands or code
- No verification steps
- Not reproducible
- Too vague and general

### ✅ GOOD: Troubleshooting Guide

**Title**: "How to Debug RabbitMQ Connection Failures"

**Location**: `/guides/troubleshooting/rabbitmq-debug.md`

**Structure**:
```markdown
## Symptoms
- Error: "ECONNREFUSED"
- Agents fail to spawn
- Workflows timeout

## Diagnostic Steps

1. Check RabbitMQ is running
   ```bash
   docker ps | grep rabbitmq
   ```
   Expected: Container "rabbitmq" with status "Up"

2. Verify connection URL
   ```bash
   echo $RABBITMQ_URL
   ```
   Expected: amqp://localhost:5672

3. Test connection
   ```bash
   npx amqp-connection-tester
   ```
   Expected: "Connection successful"

## Solutions

### Solution 1: Restart RabbitMQ
...

### Solution 2: Fix connection URL
...
```

**Why it's good**:
- Clear symptoms
- Diagnostic steps first
- Specific commands
- Multiple solution paths
- Verification included

### ❌ BAD: Missing Critical Information

**Title**: "Fix Errors"

**Location**: `/guides/troubleshooting/fix-errors.md`

**Structure**:
```markdown
If you get errors:
1. Check logs
2. Fix the problem
3. Try again
```

**Why it's bad**:
- No symptom description
- No diagnostic steps
- No specific commands
- No verification
- Not actionable

## Guide Writing Principles

### 1. Be Specific

❌ "Install dependencies"
✅ "Run `npm install` in the project root. You should see 45 packages installed in ~30 seconds."

### 2. Include Commands

❌ "Start the server"
✅ "```bash
npm run dev
# Expected output: Server listening on http://localhost:3000
```"

### 3. Specify Expected Outcomes

❌ "Run tests"
✅ "Run `npm test`. You should see:
- 47 tests passed
- 0 tests failed
- Coverage: 87%"

### 4. Add Verification Steps

Every major step should have a verification:
```markdown
### 3. Configure Database

Edit `config/database.js`:
```js
module.exports = {
  host: 'localhost',
  port: 5432
}
```

**Verification**:
```bash
npm run db:test-connection
# Expected: "✓ Database connection successful"
```
```

### 5. Include Troubleshooting

Anticipate common issues:
```markdown
### Common Issue: Port Already in Use

**Symptom**: Error: "EADDRINUSE: Port 3000 already in use"

**Solution**:
1. Find process: `lsof -i :3000`
2. Kill process: `kill -9 [PID]`
3. Retry: `npm run dev`
```

### 6. Link Related Resources

```markdown
## Related Guides
- [Deploying with Docker](../deployment/docker-deploy.md)
- [Troubleshooting Database](../troubleshooting/database-debug.md)

## Further Reading
- [System Architecture](../../architecture/system-overview.md)
- [Database Technical Docs](../../technical/database.md)
```

### 7. Keep It Focused

One guide = one task. If your guide is getting too long:
- Break it into multiple guides
- Link to related guides
- Use a workflow to orchestrate multiple guides

## Guide Lifecycle

### 1. Creation

- User requests guide or identifies gap
- Create from template
- Write clear, tested steps
- Add to appropriate category

### 2. Maintenance

- Update when system changes
- Test steps periodically
- Add troubleshooting sections based on issues
- Keep prerequisites current

### 3. Validation

- Can a new user follow it successfully?
- Are all commands still correct?
- Do expected outputs match reality?
- Are troubleshooting sections complete?

### 4. Retirement

- If process becomes obsolete
- Archive with note about replacement
- Update links in related docs

## Integration with Other Docs

### Guides Reference

- **Technical docs** for concepts: "What is MCP?"
- **Architecture docs** for design: "How is the swarm structured?"
- **Workflows** for processes: "What's the git workflow?"
- **Decisions** for rationale: "Why this approach?"

### Other Docs Reference Guides

- Architecture docs link to setup guides
- Workflows reference deployment guides
- Technical docs link to troubleshooting guides
- Feature docs link to development guides

## Quality Checklist

Before committing a guide, verify:

- [ ] Clear title starting with "How to..."
- [ ] YAML frontmatter complete
- [ ] Prerequisites listed
- [ ] Steps are numbered and sequential
- [ ] Commands include expected output
- [ ] Verification steps included
- [ ] Troubleshooting section present
- [ ] Related guides linked
- [ ] Tested by following steps exactly
- [ ] Appropriate category

## Examples by Category

### Setup Guides
- `/guides/setup/local-dev-setup.md` - Initial development environment
- `/guides/setup/mcp-server-config.md` - Configure MCP servers
- `/guides/setup/docker-environment.md` - Set up Docker containers

### Deployment Guides
- `/guides/deployment/docker-compose.md` - Deploy with Docker Compose
- `/guides/deployment/production-deploy.md` - Production deployment
- `/guides/deployment/rollback.md` - Rollback deployment

### Troubleshooting Guides
- `/guides/troubleshooting/rabbitmq-debug.md` - Fix message queue issues
- `/guides/troubleshooting/agent-spawn-failures.md` - Debug agent problems
- `/guides/troubleshooting/performance-issues.md` - Investigate slowness

### Development Guides
- `/guides/development/create-mcp-tool.md` - Add new MCP functionality
- `/guides/development/add-agent-type.md` - Create new agent
- `/guides/development/implement-hook.md` - Write coordination hook

### Operations Guides
- `/guides/operations/scale-swarm.md` - Scale agent capacity
- `/guides/operations/backup-restore.md` - Data backup procedures
- `/guides/operations/performance-monitoring.md` - Monitor system health

## Contributing

When adding a new guide:

1. **Identify the need**: Is this truly a guide? Check decision criteria.
2. **Choose category**: setup, deployment, troubleshooting, development, or operations
3. **Use template**: Follow the guide template structure
4. **Write steps**: Clear, numbered, actionable instructions
5. **Test it**: Follow your own guide exactly as written
6. **Add links**: Reference related guides and docs
7. **Get review**: Have someone unfamiliar with the task test it

## Questions?

- **Is this a guide?** → Ask: "Does it answer 'How do I...?' with steps?"
- **Which category?** → Ask: "When would someone do this?"
- **Too long?** → Break into multiple guides
- **Too short?** → Might be better as workflow or technical doc
- **Unsure?** → Start with the template and see if it fits

---

**Remember**: Guides are HOW-TO instructions. If you're not writing numbered steps that someone can follow to accomplish a task, it's probably not a guide.
