---
title: Markdown Workflow System - Examples & Usage Guide
type: guide
status: complete
created_date: {}
updated_date: '2025-10-28'
tags:
  - markdown-workflows
  - examples
  - usage-guide
  - learning-sessions
  - code-examples
category: technical
domain: weaver
scope: module
audience:
  - developers
related_concepts:
  - markdown-workflows
  - learning-sessions
  - workflow-orchestration
  - async-feedback
  - code-examples
related_files:
  - MARKDOWN-WORKFLOW-IMPLEMENTATION-SUMMARY.md
  - MARKDOWN-ASYNC-WORKFLOW-ARCHITECTURE.md
  - WORKFLOW-EXTENSION-GUIDE.md
author: ai-generated
version: 1.0.0
priority: medium
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-guide
    - status-complete
    - priority-medium
    - domain-weaver
---

## # Markdown Workflow System - Examples & Usage Guide

**Version**: 1.0.0
**Date**: 2025-10-27
**Status**: ✅ Complete Implementation

---

## 🎯 Quick Start

### Starting a Learning Session

```typescript
import { startLearningSession } from './workflows/learning-loop/learning-loop-integration.js';

// Start a new session
const session = await startLearningSession({
  sopId: 'SOP-001',
  task: {
    id: 'task-123',
    description: 'Add user authentication',
    domain: 'feature-development',
  },
  experiences: [
    {
      id: 'exp-1',
      task_description: 'OAuth2 integration',
      date: '2024-09-15',
      relevance_score: 4,
      outcome: 'success',
      lessons: ['JWT tokens work well', 'Use refresh tokens'],
    },
  ],
  vaultNotes: [
    'vault/auth/oauth-setup.md',
    'vault/auth/jwt-best-practices.md',
  ],
  externalKnowledge: [
    'Stack Overflow: Implementing secure authentication',
  ],
});

console.log(session.message);
// Output: "Session created successfully. Please review and complete: .weaver/learning-sessions/session-abc123/perception.md"
```

---

## 📝 User Workflow

### Step 1: Perception Stage

User opens `.weaver/learning-sessions/session-abc123/perception.md`:

```markdown
---
session_id: "session-abc123"
stage: "perception"
sop_id: "SOP-001"
task_description: "Add user authentication"
status: "pending"
---

# 🔍 Perception Stage: Context Review

## 📚 Gathered Context

### 🎯 Past Experiences (1 found)

1. **OAuth2 integration** (2024-09-15)
   - Relevance: <!-- RATING:4 -->
   - Outcome: success
   - Notes: _Optional: Add notes if needed_

### 📝 Vault Notes (2 found)

- `vault/auth/oauth-setup.md`
- `vault/auth/jwt-best-practices.md`

## ✅ Context Validation

<!-- USER_INPUT_START -->

### 1. Relevance Assessment

The relevance ratings look good. OAuth2 integration is highly relevant (4/5).

### 2. Missing Context (Optional)

Need to check if we have documentation on password hashing best practices.

### 3. Additional Sources (Optional)

- vault/security/password-hashing.md
- https://auth0.com/docs/best-practices

<!-- USER_INPUT_END -->

## 🎯 Validation Checklist

- [x] I've reviewed all gathered context
- [x] Relevance ratings are accurate
- [x] I've noted any missing context
- [x] I've added any additional sources needed
- [x] The context is sufficient to proceed
- [x] Ready to move to reasoning stage

**Status**: pending → **completed**
```

User changes `status: pending` to `status: completed` and saves.

---

### Step 2: Automatic Transition to Reasoning

**System automatically**:
1. Detects file change (via chokidar watcher)
2. Parses markdown (extracts user input)
3. Runs perception workflow:
   - Stores validated context in memory
   - Notes missing context for future
   - Updates learning patterns
4. Generates reasoning template

User receives: `.weaver/learning-sessions/session-abc123/reasoning.md`

---

### Step 3: Reasoning Stage

User opens reasoning template with 3 generated plans:

```markdown
---
session_id: "session-abc123"
stage: "reasoning"
sop_id: "SOP-001"
status: "pending"
---

# 🧠 Reasoning Stage: Plan Selection

## 🎯 Generated Plans

### Plan A: OAuth2 with Passport.js
**Strategy**: Industry standard OAuth2 + JWT tokens
**Effort**: 3-5 days
**Risk**: Low
**Complexity**: Medium
**Experience**: Used successfully in 1 past project

### Plan B: Custom JWT Implementation
**Strategy**: Lightweight JWT-only auth
**Effort**: 2-3 days
**Risk**: Medium (security testing needed)
**Complexity**: Low
**Experience**: New approach, learning required

### Plan C: Passwordless Magic Links
**Strategy**: Email-based authentication
**Effort**: 4-6 days
**Risk**: Medium (email deliverability)
**Complexity**: High
**Experience**: New approach

## 🎭 A/B Testing: Choose Your Preferred Approach

<!-- USER_INPUT_START -->

### Your Selection

**Selected Plan**: <!-- A/B_CHOICE:Plan_A -->

### Why This Plan?

I'm choosing Plan A (OAuth2 with Passport.js) because:
1. We've successfully used this approach before
2. It's industry standard and well-documented
3. Low risk is important for this critical feature
4. Passport.js has good community support

### Plan Modifications (Optional)

Add two-factor authentication (2FA) as an optional enhancement.
Consider using refresh token rotation for better security.

### Success Criteria (Optional)

- All tests pass
- Security audit completed
- 2FA working for admin accounts
- Session management is secure

<!-- USER_INPUT_END -->

## ✅ Validation Checklist

- [x] I've reviewed all generated plans
- [x] I've selected my preferred approach (updated A/B_CHOICE marker)
- [x] I've provided reasoning for my choice
- [x] I've noted any modifications needed
- [x] Ready to proceed to execution

**Status**: pending → **completed**
```

User saves, triggering the reasoning workflow.

---

### Step 4: Execution Stage

System generates execution template with tasks:

```markdown
---
session_id: "session-abc123"
stage: "execution"
sop_id: "SOP-001"
selected_plan: "Plan_A"
status: "pending"
progress_percentage: 0
---

# ⚙️ Execution Stage: Progress Tracking

## 📋 Execution Plan

**Selected Plan**: Plan_A

The following tasks have been planned:
1. Setup Passport.js and OAuth2 strategy (Est: 4 hours)
2. Implement JWT token generation (Est: 3 hours)
3. Create authentication middleware (Est: 2 hours)
4. Add 2FA enhancement (Est: 6 hours)
5. Write comprehensive tests (Est: 5 hours)

## ✅ Progress Tracking

- [x] Setup Passport.js and OAuth2 strategy (4 hours)
- [x] Implement JWT token generation (3 hours)
- [x] Create authentication middleware (2 hours)
- [ ] Add 2FA enhancement (6 hours)
- [ ] Write comprehensive tests (5 hours)

**Overall Progress**: 45% complete

## 🚧 Issues & Blockers (Update as needed)

<!-- USER_INPUT_START -->

### Active Blockers

[Issue 1]
Status: [resolved]
Impact: [medium]
Notes: Had trouble with refresh token rotation, found solution in Passport docs.

### Unexpected Discoveries

[Discovery 1]
Impact: [positive]
Notes: Passport.js has built-in support for refresh tokens! Saved 2 hours.

<!-- USER_INPUT_END -->

**Status**: pending → **in_progress** (periodic update)
```

User can update this file **multiple times** during execution. Each save triggers workflow to track progress. When `progress_percentage: 100`, system generates reflection template.

---

### Step 5: Reflection Stage

```markdown
---
session_id: "session-abc123"
stage: "reflection"
sop_id: "SOP-001"
execution_duration: "2.5 days"
status: "pending"
---

# 🔮 Reflection Stage: Learning & Feedback

## ⭐ Satisfaction Rating

**Your Rating**: <!-- RATING:5 -->

## 💭 Reflection Questions

<!-- USER_INPUT_START -->

### 1. What Worked Well? ✅

- Passport.js was well-documented and easy to integrate
- Prior OAuth2 experience made implementation smooth
- Refresh token rotation was simpler than expected
- Team collaboration on security testing was excellent

### 2. What Didn't Work? ❌

- Initial 2FA approach was too complex, had to simplify
- Underestimated time for comprehensive testing
- Should have done security audit earlier in the process

### 3. Improvements for Next Time 📈

- Start with security audit checklist upfront
- Break down 2FA into smaller, incremental steps
- Add more integration tests from the beginning
- Involve security team earlier in planning

### 4. Unexpected Learnings 💡

- Passport.js has refresh token support built-in
- 2FA can be implemented incrementally
- JWT token expiry needs careful consideration
- Session management is more complex than anticipated

### 5. Preference Signals 🎯

**Planning Style**:
- [x] I prefer detailed upfront planning
- [ ] I prefer iterative/exploratory approaches
- [ ] I prefer hybrid: plan big picture, iterate on details

**Risk Tolerance**:
- [x] I prefer proven, lower-risk approaches
- [ ] I'm comfortable with newer/experimental approaches
- [ ] I like balancing innovation with stability

**Learning vs. Speed**:
- [ ] I prioritize learning new things (even if slower)
- [x] I prioritize delivery speed (use what I know)
- [ ] I balance learning with delivery needs

### 6. Would You Use This Approach Again? 🔄

- [x] Yes, definitely - this approach was great
- [ ] Yes, with modifications noted above
- [ ] Maybe - depends on specific context
- [ ] No - would try a different approach

**Explanation**:

Passport.js proved to be the right choice. Would definitely use again for similar authentication features. The modifications (2FA, refresh tokens) made it even better.

<!-- USER_INPUT_END -->

## ✅ Validation Checklist

- [x] I've provided a satisfaction rating
- [x] I've reflected on what worked well
- [x] I've noted what didn't work
- [x] I've suggested improvements for next time
- [x] I've captured unexpected learnings
- [x] I've indicated my preferences
- [x] Ready to complete this learning session

**Status**: pending → **completed**
```

User saves, triggering reflection workflow which:
1. Extracts all learnings
2. Stores satisfaction rating (5/5)
3. Updates preference model (prefers detailed planning, proven approaches, speed)
4. Trains neural patterns on successful plan
5. Archives session
6. **Learning loop complete!**

---

## 🔄 Async Workflow Benefits

### Real-World Scenarios

#### Scenario 1: Interrupted by Meeting

```
10:00 AM - Start learning session, perception template generated
10:15 AM - Called into urgent meeting
03:00 PM - Return, review perception template at leisure
03:30 PM - Fill out context validation, save
03:30 PM - System generates reasoning template (no waiting)
04:00 PM - Another meeting
Next day 9:00 AM - Review plans, make selection
```

**Benefit**: No blocking, work at your own pace

---

#### Scenario 2: Multiple Concurrent Sessions

```
Session A: Feature planning for authentication (at reasoning stage)
Session B: Bug fix for API (at execution stage)
Session C: Performance optimization (at reflection stage)
```

User can work on all three sessions independently:
- Update execution progress for Session B
- Reflect on Session C over lunch
- Make plan selection for Session A when ready

**Benefit**: Parallel workflows, no conflicts

---

#### Scenario 3: Team Collaboration

Developer fills out execution progress:
```markdown
## Progress Tracking
- [x] Implement core feature
- [ ] Write tests (blocked on test environment)
```

QA team fills out test environment blocker resolution:
```markdown
### Active Blockers
[Issue 1] Test environment setup
Status: [resolved]
Notes: QA team provisioned new test environment at env-qa-02
```

Developer updates progress:
```markdown
progress_percentage: 100
status: completed
```

**Benefit**: Asynchronous team collaboration

---

## 📊 Monitoring & Debugging

### Check Active Sessions

```typescript
import { learningLoopIntegration } from './workflows/learning-loop/learning-loop-integration.js';

const status = learningLoopIntegration.getStatus();
console.log(status);

// Output:
{
  isRunning: true,
  activeSessions: 3,
  activeWorkflows: [
    { sessionId: 'session-abc123', stage: 'execution' },
    { sessionId: 'session-def456', stage: 'reasoning' },
    { sessionId: 'session-ghi789', stage: 'reflection' }
  ]
}
```

### Check Individual Session

```typescript
const sessionStatus = await learningLoopIntegration.getSessionStatus('session-abc123');
console.log(sessionStatus);

// Output:
{
  isActive: true,
  currentStage: 'execution'
}
```

### Monitor Workflow Events

```typescript
import { workflowEngine } from './workflows/learning-loop';

workflowEngine.on('workflow-complete', (result) => {
  console.log(`${result.stage} workflow completed for ${result.sessionId}`);

  if (result.nextStage) {
    console.log(`→ Proceeding to ${result.nextStage}`);
  } else {
    console.log('→ Learning loop finished!');
  }
});

workflowEngine.on('workflow-error', (result) => {
  console.error(`${result.stage} workflow failed:`, result.error);
});
```

---

## 🛠️ Advanced Usage

### Custom Template Data

```typescript
await templateGenerator.generateTemplate(
  'reasoning',
  'session-abc123',
  'SOP-001',
  {
    taskDescription: 'Add GraphQL API',
    plans: [
      {
        id: 'Plan_A',
        name: 'Apollo Server',
        description: 'Use Apollo Server for GraphQL',
        strategy: 'Proven framework',
        effort: '3-4 days',
        risk: 'low',
        complexity: 'medium',
        experience_alignment: 2,
        learning_value: 'low',
        steps: ['Setup Apollo', 'Define schema', 'Create resolvers'],
      },
      // ... more plans
    ],
  }
);
```

### Programmatic Workflow Execution

```typescript
import { workflowEngine } from './workflows/learning-loop';

const context = {
  sessionId: 'session-abc123',
  sopId: 'SOP-001',
  stage: 'perception',
  parsedData: { /* parsed markdown */ },
  userInput: { /* extracted user input */ },
  timestamp: new Date(),
};

const result = await workflowEngine.execute('perception', context);

if (result.success) {
  console.log('Perception workflow succeeded');
  console.log('Next stage:', result.nextStage);
} else {
  console.error('Workflow failed:', result.error);
}
```

---

## 🎓 Best Practices

### 1. Be Detailed in Reflection

❌ **Bad**:
```markdown
### What Worked Well?
It worked fine.
```

✅ **Good**:
```markdown
### What Worked Well?
- Passport.js integration was straightforward thanks to clear documentation
- Prior OAuth2 experience reduced learning curve by ~50%
- Refresh token rotation was simpler than expected - built-in support saved 2 hours
- Team collaboration on security testing caught 3 issues early
```

---

### 2. Update Execution Frequently

❌ **Bad**: Only update when 100% complete

✅ **Good**: Update after each major milestone
```markdown
Day 1 (20% complete):
- [x] Setup Passport.js

Day 2 (60% complete):
- [x] Setup Passport.js
- [x] Implement JWT tokens
- [x] Create middleware

Day 3 (100% complete):
- All tasks completed
```

**Why**: Captures blockers and discoveries when fresh

---

### 3. Use A/B Testing Reasoning

❌ **Bad**:
```markdown
### Why This Plan?
I like this one better.
```

✅ **Good**:
```markdown
### Why This Plan?
Choosing Plan A because:
1. We've used it successfully before (proven)
2. Lower risk for critical auth feature
3. Better documentation and community support
4. Team is already familiar with Passport.js
```

**Why**: Trains preference model effectively

---

### 4. Capture Discoveries

```markdown
### Unexpected Discoveries

[Discovery 1]
Impact: [positive]
Notes: Found that Passport.js has built-in refresh token support. This eliminated the need for custom implementation, saving ~2 hours and reducing security risk.

[Discovery 2]
Impact: [negative]
Notes: JWT token expiry handling is more complex than expected. Need to handle edge cases like token refresh during API calls. Added 3 hours to estimate.
```

**Why**: These become valuable patterns for future tasks

---

## 🔗 Integration with SOPs

### Updated SOP Script Example

```typescript
import { startLearningSession } from './workflows/learning-loop/learning-loop-integration.js';
import { program } from 'commander';

program
  .name('feature-plan')
  .argument('<description>', 'Feature description')
  .action(async (description) => {
    console.log('🚀 Starting feature planning with learning loop...\n');

    // Gather context (simplified)
    const experiences = await gatherExperiences(description);
    const vaultNotes = await searchVault(description);

    // Start learning session
    const session = await startLearningSession({
      sopId: 'SOP-001',
      task: {
        id: `task-${Date.now()}`,
        description,
        domain: 'feature-planning',
      },
      experiences,
      vaultNotes,
    });

    console.log('✅', session.message);
    console.log('\n📝 Next steps:');
    console.log('  1. Review the perception template');
    console.log('  2. Validate context and add missing information');
    console.log('  3. Mark status as "completed" when ready');
    console.log('  4. System will generate reasoning template automatically\n');
  });

program.parse();
```

**Usage**:
```bash
npm run sop:feature-plan "Add user authentication"

# Output:
🚀 Starting feature planning with learning loop...

✅ Session created successfully. Please review and complete: .weaver/learning-sessions/session-abc123/perception.md

📝 Next steps:
  1. Review the perception template
  2. Validate context and add missing information
  3. Mark status as "completed" when ready
  4. System will generate reasoning template automatically
```

---

## 🎉 Complete Example: End-to-End

See the complete flow in action:
1. **Start**: `npm run sop:feature-plan "Add OAuth2"`
2. **Perception**: Fill `.weaver/learning-sessions/session-abc123/perception.md`
3. **Reasoning**: System generates reasoning template
4. **Plan Selection**: Choose Plan A with reasoning
5. **Execution**: System generates execution template with tasks
6. **Progress Updates**: Update as you work (can update multiple times)
7. **Reflection**: System generates reflection template when complete
8. **Complete**: Fill reflection, system archives and learns

**Total time investment**: 15-20 minutes of thoughtful feedback across all stages
**Learning value**: Immeasurable - every task makes the next one better

---

**Document Status**: ✅ Complete with Examples
**Last Updated**: 2025-10-27
