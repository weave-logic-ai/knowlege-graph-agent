---
title: Markdown-Based Async Feedback & Workflow Architecture
type: architecture
status: complete
phase_id: PHASE-12
tags:
  - markdown-workflows
  - async-architecture
  - workflow-automation
  - user-feedback
  - file-watchers
  - phase/phase-12
  - type/implementation
  - status/in-progress
domain: weaver
priority: medium
visual:
  icon: "\U0001F3D7️"
  color: '#F59E0B'
  cssclasses:
    - type-architecture
    - status-complete
    - priority-medium
    - domain-weaver
updated: '2025-10-29T04:55:05.046Z'
author: ai-generated
version: 1.0.0
keywords:
  - "\U0001F4DA related documentation"
  - workflow architecture
  - learning loop integration
  - implementation context
  - see also
  - related
  - "\U0001F3AF overview"
  - "\U0001F3D7️ architecture principles"
  - 1. async-first design
  - 2. workflow-per-stage
---

# Markdown-Based Async Feedback & Workflow Architecture

**Version**: 1.0.0
**Date**: 2025-10-27
**Status**: ✅ Design Complete

---

## 📚 Related Documentation

### Workflow Architecture
- [[WORKFLOW-EXTENSION-GUIDE]] - Workflow engine extension patterns
- [[VECTOR-DB-MARKDOWN-WORKFLOW-ARCHITECTURE]] - Vector database workflows
- [[VERCEL-WORKFLOW-VECTOR-DB-ARCHITECTURE]] - Vercel-style patterns

### Learning Loop Integration
- [[PHASE-12-LEARNING-LOOP-BLUEPRINT]] - Learning loop architecture
- [[PHASE-12-LEARNING-LOOP-INTEGRATION]] - Integration guide
- [[USER-FEEDBACK-REFLECTION-DESIGN]] - User feedback patterns

### Implementation Context
- [[WEAVER-COMPLETE-IMPLEMENTATION-GUIDE]] - Complete Weaver implementation
- [[WEAVER-SOPS-FRAMEWORK]] - SOP framework architecture

### See Also
- [[phase-13-master-plan]] - Phase 13 integration
- [[CHUNKING-STRATEGY-SYNTHESIS]] - Chunking workflows

---





## Related

[[MARKDOWN-WORKFLOW-EXAMPLES]]
## Related

[[MARKDOWN-WORKFLOW-IMPLEMENTATION-SUMMARY]]
## 🎯 Overview

This architecture replaces synchronous CLI prompts with asynchronous markdown-based workflows for the learning loop feedback system. Each learning stage generates markdown files that users can fill out at their convenience, triggering workflows when complete.

---

## 🏗️ Architecture Principles

### 1. Async-First Design
- **No blocking prompts**: Users never wait for feedback collection
- **Fill at convenience**: Users complete markdown forms when they have time
- **Ongoing log**: Persistent decision trail in markdown format
- **Multiple active sessions**: Support concurrent learning workflows

### 2. Workflow-Per-Stage
- **Perception Stage** → Generates `perception-{id}.md` → Triggers context validation workflow
- **Reasoning Stage** → Generates `reasoning-{id}.md` → Triggers plan selection workflow
- **Execution Stage** → Generates `execution-{id}.md` → Triggers progress monitoring workflow
- **Reflection Stage** → Generates `reflection-{id}.md` → Triggers feedback collection workflow

### 3. File-Based State Machine
```
[Generate Template] → [User Fills] → [Detect Change] → [Parse] → [Trigger Workflow] → [Update Learning]
```

---

## 📁 Directory Structure

```
weaver/
├── templates/
│   └── learning-loop/
│       ├── perception-stage.md          # Context gathering template
│       ├── reasoning-stage.md           # Plan generation & A/B testing template
│       ├── execution-stage.md           # Execution tracking template
│       ├── reflection-stage.md          # Reflection & lessons template
│       └── feedback-survey.md           # Standalone feedback template
│
├── .weaver/
│   └── learning-sessions/               # Active session data
│       ├── {session-id}/
│       │   ├── perception.md            # Filled template
│       │   ├── reasoning.md
│       │   ├── execution.md
│       │   ├── reflection.md
│       │   └── metadata.json            # Session metadata
│       └── archive/                     # Completed sessions
│
├── src/
│   └── workflows/
│       └── learning-loop/
│           ├── types.ts                 # Workflow type definitions
│           ├── markdown-parser.ts       # Parse filled markdown
│           ├── workflow-engine.ts       # Orchestrate workflows
│           ├── file-watcher.ts          # Watch for markdown changes
│           ├── perception-workflow.ts   # Perception stage workflow
│           ├── reasoning-workflow.ts    # Reasoning stage workflow
│           ├── execution-workflow.ts    # Execution stage workflow
│           └── reflection-workflow.ts   # Reflection stage workflow
```

---

## 📋 Markdown Template Format

### Template Structure
All templates use YAML frontmatter + markdown body:

```markdown
---
session_id: "session-{uuid}"
stage: "perception|reasoning|execution|reflection"
sop_id: "SOP-001"
created_at: "2025-10-27T10:30:00Z"
status: "pending|in_progress|completed"
---

# Stage Title

## Section 1: Instructions
[Instructions for user]

## Section 2: User Input
<!-- USER_INPUT_START -->
[User fills this section]
<!-- USER_INPUT_END -->

## Section 3: Validation
- [ ] Checkbox 1
- [ ] Checkbox 2

## Section 4: Submit
When complete, set `status: completed` in frontmatter above.
```

### Special Markers
- `<!-- USER_INPUT_START -->` / `<!-- USER_INPUT_END -->`: Extraction boundaries
- `<!-- A/B_CHOICE -->`: A/B testing selection marker
- `<!-- RATING:X -->`: Satisfaction rating marker
- `[ ]` / `[x]`: Checkbox for validation/completion

---

## 🔄 Workflow Definitions

### 1. Perception Workflow

**Trigger**: `perception.md` status changes to `completed`

**Steps**:
1. Parse user validation of context sources
2. Extract any additional context user provided
3. Update perception system with user corrections
4. Store validated context in memory
5. Trigger reasoning workflow

**Template Sections**:
- Context sources review
- Relevance validation (1-5 scale)
- Missing context input (optional)
- Approval checkboxes

### 2. Reasoning Workflow

**Trigger**: `reasoning.md` status changes to `completed`

**Steps**:
1. Parse A/B testing selection (if multiple plans)
2. Extract reasoning for plan choice
3. Parse plan modifications (if any)
4. Update preference learning model
5. Store chosen plan with rationale
6. Trigger execution workflow

**Template Sections**:
- Plan comparison table
- A/B selection (radio buttons in markdown)
- Rationale input (text area)
- Plan modifications (optional)
- Approval checkboxes

### 3. Execution Workflow

**Trigger**: `execution.md` status changes to `completed` OR periodic updates

**Steps**:
1. Parse execution progress updates
2. Extract encountered issues/blockers
3. Update task status
4. Trigger corrective actions if issues detected
5. When fully complete, trigger reflection workflow

**Template Sections**:
- Task progress checklist
- Issues/blockers log
- Solution attempts log
- Completion confirmation

### 4. Reflection Workflow

**Trigger**: `reflection.md` status changes to `completed`

**Steps**:
1. Parse satisfaction rating
2. Extract what worked well / what didn't
3. Parse improvement suggestions
4. Extract preference signals
5. Store experience with user feedback
6. Update learning models
7. Archive session

**Template Sections**:
- Satisfaction rating (1-5)
- What worked well (text)
- What didn't work (text)
- Improvements for next time (text)
- Preference signals (checkboxes)
- Approval checkboxes

---

## 🔍 Markdown Parser

### Parser Architecture

```typescript
interface ParsedMarkdown {
  frontmatter: {
    session_id: string;
    stage: string;
    sop_id: string;
    status: 'pending' | 'in_progress' | 'completed';
    created_at: string;
    updated_at: string;
  };
  sections: {
    [sectionName: string]: {
      content: string;
      checkboxes?: { checked: boolean; text: string }[];
      userInput?: string;
      rating?: number;
      choice?: string;
    };
  };
  isComplete: boolean;
}

class MarkdownParser {
  parse(filePath: string): ParsedMarkdown;
  extractUserInput(content: string): string;
  extractCheckboxes(content: string): Checkbox[];
  extractRating(content: string): number | null;
  extractChoice(content: string): string | null;
  validateComplete(parsed: ParsedMarkdown): boolean;
}
```

### Parsing Logic
1. **Frontmatter**: Parse YAML with `gray-matter`
2. **Sections**: Split by `## ` headings
3. **User Input**: Extract content between `<!-- USER_INPUT_START/END -->`
4. **Checkboxes**: Regex `/- \[(x| )\] (.+)/g`
5. **Ratings**: Regex `/<!-- RATING:(\d) -->/`
6. **Choices**: Regex `/<!-- A/B_CHOICE:(.+) -->/`

---

## 🔔 File Watcher

### Watcher Architecture

```typescript
class LearningLoopWatcher {
  private watcher: FSWatcher;
  private sessionPath = '.weaver/learning-sessions';

  async start(): Promise<void> {
    this.watcher = chokidar.watch(`${this.sessionPath}/**/*.md`, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 2000 }
    });

    this.watcher.on('change', this.handleFileChange.bind(this));
  }

  private async handleFileChange(filePath: string): Promise<void> {
    const parsed = this.parser.parse(filePath);

    // Only trigger if status is completed
    if (parsed.frontmatter.status === 'completed') {
      const workflow = this.getWorkflowForStage(parsed.frontmatter.stage);
      await workflow.execute(parsed);
    }
  }
}
```

### Optimization
- **Debouncing**: 2-second stability threshold to avoid duplicate triggers
- **Ignore initial**: Don't trigger on watcher startup
- **Selective watching**: Only watch `*.md` files in learning-sessions

---

## 🎭 Workflow Orchestration

### Workflow Engine

```typescript
interface WorkflowContext {
  sessionId: string;
  sopId: string;
  stage: string;
  parsedData: ParsedMarkdown;
}

abstract class BaseWorkflow {
  abstract execute(context: WorkflowContext): Promise<void>;

  protected async storeInMemory(data: any): Promise<void>;
  protected async updateLearningModel(data: any): Promise<void>;
  protected async triggerNextStage(stage: string): Promise<void>;
}

class WorkflowEngine {
  private workflows: Map<string, BaseWorkflow>;

  constructor() {
    this.workflows = new Map([
      ['perception', new PerceptionWorkflow()],
      ['reasoning', new ReasoningWorkflow()],
      ['execution', new ExecutionWorkflow()],
      ['reflection', new ReflectionWorkflow()]
    ]);
  }

  async execute(stage: string, context: WorkflowContext): Promise<void> {
    const workflow = this.workflows.get(stage);
    if (!workflow) throw new Error(`Unknown workflow: ${stage}`);

    await workflow.execute(context);
  }
}
```

---

## 🚀 Integration with Learning Loop

### Updated Learning Loop Flow

```typescript
class LearningLoop {
  private watcher: LearningLoopWatcher;
  private engine: WorkflowEngine;

  async startSession(sopId: string, task: Task): Promise<string> {
    const sessionId = generateSessionId();

    // Create session directory
    await fs.mkdir(`.weaver/learning-sessions/${sessionId}`, { recursive: true });

    // Generate initial templates
    await this.generateTemplate('perception', sessionId, sopId);

    // Start watching
    if (!this.watcher.isRunning()) {
      await this.watcher.start();
    }

    return sessionId;
  }

  private async generateTemplate(
    stage: string,
    sessionId: string,
    sopId: string
  ): Promise<void> {
    const template = await fs.readFile(`templates/learning-loop/${stage}-stage.md`, 'utf-8');

    // Populate frontmatter
    const populated = template.replace('session-{uuid}', sessionId)
                              .replace('{sop_id}', sopId)
                              .replace('{created_at}', new Date().toISOString());

    await fs.writeFile(
      `.weaver/learning-sessions/${sessionId}/${stage}.md`,
      populated
    );
  }
}
```

### Session Lifecycle

1. **Start**: `learningLoop.startSession(sopId, task)`
   - Creates session directory
   - Generates perception template
   - Returns session ID to user

2. **User fills perception.md** → Sets `status: completed`
   - Watcher detects change
   - Triggers perception workflow
   - Generates reasoning template

3. **User fills reasoning.md** → Sets `status: completed`
   - Triggers reasoning workflow
   - Generates execution template

4. **User updates execution.md** (periodic)
   - Triggers execution workflow updates
   - When complete, generates reflection template

5. **User fills reflection.md** → Sets `status: completed`
   - Triggers reflection workflow
   - Archives session
   - Updates learning models

---

## 📊 Example Session Flow

### Session: Feature Planning (SOP-001)

```bash
# 1. SOP starts learning session
$ npm run sop:feature-plan "Add user authentication"
✓ Session created: session-abc123
✓ Template generated: .weaver/learning-sessions/session-abc123/perception.md
→ Please review and complete the perception template when ready
```

### Perception Template Generated
```markdown
---
session_id: "session-abc123"
stage: "perception"
sop_id: "SOP-001"
status: "pending"
created_at: "2025-10-27T10:30:00Z"
---

# Perception Stage: Context Review

## 📚 Gathered Context

We found the following relevant experiences and knowledge:

### Past Experiences (3 found)
1. **Feature: OAuth2 integration** (2024-09-15)
   - Relevance: <!-- RATING:4 -->
   - Notes: _Optional: Add notes if needed_

2. **Feature: JWT authentication** (2024-08-20)
   - Relevance: <!-- RATING:5 -->
   - Notes:

3. **Debugging: Auth token expiry** (2024-07-10)
   - Relevance: <!-- RATING:3 -->
   - Notes:

### Vault Notes (5 found)
- `vault/auth/oauth-setup.md`
- `vault/auth/jwt-best-practices.md`
- `vault/security/auth-patterns.md`
- `vault/api/authentication-api.md`
- `vault/testing/auth-testing.md`

### External Knowledge
- Stack Overflow: "Implementing secure authentication in Node.js"
- GitHub: passport.js authentication strategies
- MDN: Web Authentication API

## ✅ Context Validation

Are these sources relevant and sufficient?

<!-- USER_INPUT_START -->
### Missing Context (Optional)
_If we're missing important context, please describe it here:_



### Additional Sources (Optional)
_Any specific documentation, examples, or resources to include:_



<!-- USER_INPUT_END -->

## 🎯 Approval

- [ ] The gathered context is relevant and sufficient
- [ ] I've added any missing context above
- [ ] Ready to proceed to reasoning stage

## 🚀 Submit

When ready, change `status: pending` to `status: completed` in the frontmatter above and save this file.
```

### User fills and saves → Triggers reasoning template

### Reasoning Template Generated
```markdown
---
session_id: "session-abc123"
stage: "reasoning"
sop_id: "SOP-001"
status: "pending"
created_at: "2025-10-27T10:35:00Z"
---

# Reasoning Stage: Plan Selection

## 🎯 Task
Add user authentication

## 📊 Generated Plans

We've generated 3 alternative approaches:

### Plan A: OAuth2 with Passport.js
**Strategy**: Industry standard OAuth2 + JWT tokens
**Effort**: 3-5 days
**Risk**: Low
**Experience**: Used successfully in 2 past projects

### Plan B: Custom JWT Implementation
**Strategy**: Lightweight JWT-only auth
**Effort**: 2-3 days
**Risk**: Medium (security testing needed)
**Experience**: Similar approach worked well in simple APIs

### Plan C: Passwordless Magic Links
**Strategy**: Email-based authentication
**Effort**: 4-6 days
**Risk**: Medium (email deliverability)
**Experience**: New approach, learning required

## 🎭 A/B Testing: Choose Your Preferred Approach

<!-- USER_INPUT_START -->
### Your Selection
<!-- A/B_CHOICE:Plan_A --> (Change to Plan_A, Plan_B, or Plan_C)

### Reasoning
_Why did you choose this approach?_



### Modifications (Optional)
_Any adjustments to the chosen plan?_



<!-- USER_INPUT_END -->

## ✅ Validation

- [ ] I've reviewed all three plans
- [ ] I've selected my preferred approach
- [ ] I've provided reasoning for my choice
- [ ] Ready to proceed to execution

## 🚀 Submit

When ready, change `status: pending` to `status: completed` in the frontmatter and save.
```

---

## 🔧 Implementation Checklist

### Phase 1: Templates & Parser (Week 1)
- [ ] Create 5 markdown templates
- [ ] Implement markdown parser with gray-matter
- [ ] Build checkbox/rating/choice extractors
- [ ] Unit tests for parser

### Phase 2: Workflows (Week 1-2)
- [ ] Implement BaseWorkflow abstract class
- [ ] Build 4 concrete workflow classes
- [ ] Integrate with claude-flow memory
- [ ] Integration tests

### Phase 3: File Watcher (Week 2)
- [ ] Implement LearningLoopWatcher with chokidar
- [ ] Add debouncing and optimization
- [ ] Connect watcher to workflow engine
- [ ] End-to-end tests

### Phase 4: Learning Loop Integration (Week 2-3)
- [ ] Update LearningLoop to generate templates
- [ ] Session lifecycle management
- [ ] Archive completed sessions
- [ ] Update preference learning with markdown feedback

### Phase 5: SOP Updates (Week 3)
- [ ] Update all 8 SOPs to use markdown workflows
- [ ] Add session creation to each SOP script
- [ ] Update documentation
- [ ] User guide with examples

---

## 📈 Success Metrics

### User Experience
- **Async completion rate**: >80% of sessions completed asynchronously
- **Average completion time**: <24 hours from template generation
- **User satisfaction**: >4.0/5.0 rating

### System Performance
- **File watcher latency**: <2 seconds from save to workflow trigger
- **Template generation**: <100ms per template
- **Markdown parsing**: <50ms per file

### Learning Quality
- **Preference alignment**: >85% of future plans match user preferences
- **Feedback richness**: >50% of sessions include qualitative improvements
- **A/B test conversion**: >90% of sessions with multiple plans include A/B selection

---

## 🎯 Benefits Over CLI Prompts

### Async Benefits
1. **No blocking**: Users never wait for feedback collection
2. **Thoughtful responses**: Users can take time to reflect
3. **Multi-session**: Handle multiple concurrent learning sessions
4. **Persistent log**: Complete decision trail in markdown

### UX Benefits
5. **Familiar format**: Markdown is universal
6. **Version control**: Git-friendly decision logs
7. **Easy review**: Browse past sessions in `.weaver/learning-sessions/archive/`
8. **Portable**: Copy/share sessions easily

### System Benefits
9. **Decoupled**: Learning loop doesn't block on user input
10. **Scalable**: File-based state is simple and reliable
11. **Testable**: Mock markdown files for testing
12. **Observable**: Watch `.weaver/learning-sessions/` directory for activity

---

## 🔐 Security & Privacy

### Data Handling
- **Local only**: All sessions stored locally in `.weaver/`
- **No telemetry**: No data sent to external services
- **Git-ignored**: `.weaver/` is git-ignored by default
- **User control**: Users can delete sessions anytime

### Sensitive Information
- **Redaction**: Remind users to redact sensitive data in templates
- **Template warnings**: Add privacy warnings to all templates
- **Secure storage**: Use claude-flow encrypted memory for sensitive context

---

## 📚 Dependencies

### Required
- `gray-matter`: ^4.0.3 (YAML frontmatter parsing)
- `chokidar`: ^3.5.3 (File watching)
- `marked`: ^11.0.0 (Markdown parsing utilities)

### Already Available
- `execa`: ^9.6.0 (CLI execution for claude-flow)
- `@xenova/transformers`: ^2.x (Semantic analysis of feedback)

---

## 🎓 Future Enhancements

### V2 Features
1. **Real-time collaboration**: Multiple users filling same template
2. **AI assistance**: Auto-suggest completions in templates
3. **Visual diff**: Show changes between revisions
4. **Template versioning**: Evolve templates based on feedback
5. **Mobile support**: Web UI for filling templates on mobile
6. **Voice input**: Dictate feedback via voice-to-text
7. **Integration**: Slack/Discord notifications when templates ready

### Advanced Workflows
8. **Conditional workflows**: Different paths based on user input
9. **Parallel workflows**: Multiple workflows triggered simultaneously
10. **Workflow composition**: Chain multiple workflows together
11. **Rollback**: Undo workflow actions if user changes mind

---

**Status**: ✅ Architecture Design Complete
**Next Step**: Implement markdown templates and parser
**Timeline**: 3 weeks for complete implementation
**Risk Level**: Low (file-based system is simple and reliable)
