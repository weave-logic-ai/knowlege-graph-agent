# Weave-NN Decision Log & Questionnaire

**Purpose**: Track all key decisions, open questions, and requirements for the AI Knowledge Graph platform.

**Instructions**:
- Fill in `[ ]` with your answers
- Mark decisions as `[✓]` when finalized
- Update `Status:` fields as you progress
- Add notes in the `Notes:` sections

**Last Updated**: 2025-10-20

---

## Table of Contents
- [Executive Decisions](#executive-decisions)
- [Technical Stack Decisions](#technical-stack-decisions)
- [Feature Prioritization](#feature-prioritization)
- [Timeline & Resources](#timeline--resources)
- [Business Model](#business-model)
- [Integration Requirements](#integration-requirements)
- [Open Questions](#open-questions)

---

## Executive Decisions

### ED-1: Project Scope & Purpose

**Status**: `[ ] Open` | `[ ] Decided`

**Question**: What is the primary purpose of this project?

```
[ ] A. Internal tool only - solve my/my team's markdown management problem
[ ] B. Internal tool first, potential SaaS later
[x] C. Build as SaaS product from day one
[ ] D. Open source project with optional paid hosting
[ ] E. Other: _________________________________________________
```

**Decision**:
```
_________________________________________________________________
Create as a SaaS. Utilize Google Vertex, Cloud Run and other elements there work very well with SaaS and can start very inexpensive. 
_________________________________________________________________
```

**Impact**: Affects architecture complexity, multi-tenancy needs, timeline, and cost.

**Notes**:
```
_________________________________________________________________
If we build it right it won't take too much time to polish it up for sale as a SaaS. This will be a key service internally, and we will use it for all client and internal projects. This may end up being a free SaaS for our clients, but we can sell access to it later, either way it has to be built as a multi-tenant system.
_________________________________________________________________
```

---

### ED-2: Development Approach

**Status**: `[ ] Open` | `[ ] Decided`

**Question**: Which development path will you take?

```
[ ] A. Validate with Obsidian first (1-2 weeks), then decide
[ ] B. Build custom solution immediately (2-6 months)
[ ] C. Hybrid: Start with Obsidian, gradually build custom components
[ ] D. Fork/extend existing open source (Outline, Logseq, etc.)
[ ] E. Other: _________________________________________________
```

**Decision**:
```
_________________________________________________________________

_________________________________________________________________
```

**Rationale**:
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

### ED-3: Target Users (Primary)

**Status**: `[ ] Open` | `[x] Decided`

**Question**: Who is the primary user of this platform?

```
[x] A. Solo developer (me)
[x] B. Small development team (2-10 people)
[ ] C. Multiple teams within organization (10-100 people)
[ ] D. External customers (SaaS)
[ ] E. Open source community
[ ] F. Multiple segments: _______________________________________
```

**Primary User Profile**:
```
Role: Development, Project Manager, Architect, Client

Technical Level: [x] High [x] Medium [x] Low

Use Cases: Internally set up to work with clients projects. Because it is based on markdown and locally in obsidian. Intial planning, and development and even acceptance testing etc will use this method. It also makes export very easy because there is such a strong taxonomy. 
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

### ED-4: Budget & Resources

**Status**: `[ ] Open` | `[x] Decided`

**Question**: What resources are available for this project?

**Development Budget**:
```
[ ] $0 - Solo side project, sweat equity only
[x] $1,000 - $5,000 - Can pay for some tools/services
[ ] $5,000 - $25,000 - Can hire freelancer(s) for key components
[ ] $25,000 - $100,000 - Can hire small team or agency
[ ] $100,000+ - Funded project

Amount: $________
```

**Time Commitment**:
```
Hours per week available: 40

Duration willing to commit: 2 weeks

Target launch date (if any): Yesterday
```

**Team**:
```
[ ] Solo (just me)
[x] Solo + AI (60x speed lately, using claude-flow and other tools)
[ ] Small team: _____ people
[ ] Will hire: _______________________________________________

Skills available:
  [x] Frontend (React/Svelte)
  [x] Backend (Node.js/Python)
  [x] Database/DevOps
  [x] Design/UX
  [x] AI/ML

Skills need to hire/learn: ______________________________________

_________________________________________________________________
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

## Technical Stack Decisions

### TS-1: Frontend Framework

**Status**: `[ ] Open` | `[x] Decided`

**Question**: Which frontend framework will you use?

```
[ ] A. SvelteKit (faster development, less boilerplate)
[x] B. Next.js/React (Shadcn)
[ ] C. Nuxt/Vue (middle ground)
[ ] D. Astro + Islands (performance-first)
[ ] E. Other: _________________________________________________
[ ] F. Undecided - need to prototype both
```

**Decision**:
```
Framework: Next.js/React (Shadcn)

Version: Most current.
```

**Key Factors in Decision**:
```
[ ] Development speed
[x] Ecosystem size
[x ] Personal preference/experience
[ ] Hiring considerations
[ ] Performance requirements
[x] Other: Best for AI development.
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

### TS-2: Graph Visualization Library

**Status**: `[ ] Open` | `[x] Decided`

**Question**: Which library will power the knowledge graph?

```
[ ] A. React Flow (if using React)
[ ] B. Svelte Flow (if using Svelte)
[ ] C. D3.js (maximum customization, more work)
[ ] D. Cytoscape.js (scientific/complex graphs)
[ ] E. vis.js (simpler, older)
[ ] F. Custom WebGL solution
[x] G. Other: Obsidian 
```

**Decision**:
```
Library: Obsidian

Reason: It's all just built in, it makes it a joy to work with. 

_________________________________________________________________
```

**Required Graph Features**:
```
[ ] 2D visualization
[ ] 3D visualization
[ ] Force-directed layout
[ ] Hierarchical layout
[ ] Custom node types
[ ] Edge labels/types
[ ] Minimap
[ ] Search/filtering
[ ] Clustering
[ ] Export (PNG/SVG)
[ ] Other: _____________________________________________________
```

**Notes**:
```
Use of mermaid should handle most other things, but we may want to add more to Obsidian, which we can easily with plugins. 

_________________________________________________________________
```

---

### TS-3: Backend Architecture

**Status**: `[ ] Open` | `[x] Decided`

**Question**: What backend architecture will you use?

```
[ ] A. Full-stack framework (SvelteKit/Next.js API routes only)
[ ] B. Separate Node.js API (Express/Fastify)
[x] C. Python API (FastAPI/Django)
[ ] D. Serverless (Vercel Functions, AWS Lambda)
[ ] E. BaaS (Supabase, Firebase, Appwrite)
[ ] F. Hybrid: ________________________________________________
```

**Decision**:
```
Architecture: Only an API and some cmd line scripts are probably needed, alongside a set of rules and agents that would be used in claude-flow.

Framework(s): __________________________________________________

_________________________________________________________________
```

**Rationale**:
```
Keeping this very simple, the Python API could also handle the MCP interface, and later when we go multiplayer with this we can extend it to handle that as well.
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

### TS-4: Database & Storage

**Status**: `[ ] Open` | `[x] Decided`

**Question**: How will you store data?

**Primary Database**:
```
[ ] A. PostgreSQL (self-hosted)
[x] B. Supabase (managed Postgres + extras)
[ ] C. MongoDB (document store)
[x] D. SQLite (based on claude-flow memory)
[x] E. Other: Markdown

Choice: Supabase not intiially but for when we go multiplayer. Or perhaps a messaging queue and sync could work as well, which can end up very nice and realtime and keep a lot of the history cleanly.
```

**Knowledge Graph Storage**:
```
[ ] A. Graphiti (temporal graph in Postgres)
[ ] B. Neo4j (dedicated graph database)
[ ] C. PostgreSQL with recursive queries
[x] D. In-memory + persist to files
[x] E. Other: Claude-flow memory and markdown also keeps this in place.

Choice: ________________________________________________________
```

**File Storage** (for markdown files):
```
[ ] A. Database BLOBs/text fields
[x] B. File system + Git
[ ] C. S3/R2/Cloud storage
[ ] D. Supabase Storage
[ ] E. Hybrid: ________________________________________________

Choice: ________________________________________________________

Version Control:
[x] Git-backed (libgit2/simple-git)
[ ] Database versioning
[ ] None (just timestamps)
[ ] Other: _____________________________________________________
```

**Vector Database** (for semantic search):
```
[ ] A. pgvector (Postgres extension)
[ ] B. Pinecone
[ ] C. Weaviate
[ ] D. Qdrant
[ ] E. Milvus
[ ] F. Not needed yet
[x] G. Other: SQLight

Choice: ________________________________________________________
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

### TS-5: Markdown Editor

**Status**: `[ ] Open` | `[x] Decided`

**Question**: What editor will users use to edit markdown?

```
[ ] A. Tiptap (WYSIWYG + markdown)
[ ] B. CodeMirror (code editor style)
[ ] C. Monaco Editor (VS Code editor)
[ ] D. Simple textarea (plain markdown)
[ ] E. External (use Obsidian/VS Code, read files)
[ ] F. Multiple options (let users choose)
[x] G. Other: Obsidian, User can basically sit in obsidian and work on projects.
```

**Decision**:
```
Editor: ________________________________________________________

Editing Mode:
[ ] WYSIWYG only
[ ] Markdown source only
[ ] Split view (WYSIWYG + source)
[ ] Toggle between modes
```

**Required Editor Features**:
```
[ ] Syntax highlighting
[ ] Autocomplete for [[wikilinks]]
[ ] Tag suggestions
[ ] Image upload/paste
[ ] Code blocks with syntax highlighting
[ ] Tables
[ ] Math (LaTeX)
[ ] Diagrams (Mermaid)
[ ] Real-time collaboration
[ ] Vim mode
[ ] Other: _____________________________________________________
```

**Notes**:
```
All of the questions show me that having obsidian handling this covers all potentials. You will find most of the features we need are there, and we can even add a plugin to obsidian to close the gaps.
```

---

### TS-6: Authentication & Authorization

**Status**: `[ ] Open` | `[x] Decided`

**Question**: How will users authenticate?

```
[ ] A. No auth (internal tool, local only)
[ ] B. Simple password (no OAuth)
[x] C. OAuth only (Google, GitHub, etc.)
[x] D. Email + password + OAuth
[ ] E. Magic links (passwordless)
[ ] F. SSO/SAML (enterprise)
[ ] G. Use auth provider: [ ] Supabase [ ] Clerk [ ] Auth0 [ ] NextAuth
[ ] H. Other: _________________________________________________
```

**Decision**:
```
Auth Method(s): Google Auth - We use Google Cloud. Clients may need email+password. I prefer to make that with 2fa using google auth again.

Provider (if any): _____________________________________________
```

**Authorization Model**:
```
[ ] Single user (no permissions)
[ ] Multi-user, no sharing (isolated workspaces)
[x] Workspace-based (invite team members)
[ ] Document-level permissions (read/write/admin)
[ ] Other: _____________________________________________________

Choice: ________________________________________________________
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

## Feature Prioritization

### FP-1: MVP Feature Set

**Status**: `[ ] Open` | `[x] Decided`

**Question**: What features MUST be in the MVP?

**Mark with priority**: `[1]` = Must have (MVP), `[2]` = Should have (v1.1), `[3]` = Nice to have (v2.0), `[X]` = Not needed

```
[x] Create markdown documents
[_] Edit markdown documents
[_] Delete documents
[x] Basic graph visualization (nodes + edges)
[x] Wikilink parsing [[Document Name]]
[x] Click node → open editor
[x] Search documents (text search)
[x] Tag documents
[x] Filter by tags
[x] Daily notes
[x] Templates
[x] Real-time collaboration (multiple users editing)
[x] Version history
[x] Semantic search (AI-powered)
[x] Auto-linking suggestions
[x] MCP server for AI agents
[x] Temporal queries (point-in-time views)
[x] Export (PDF, markdown archive)
[x] Import (from existing projects and plans.)
[_] Mobile responsive
[_] Dark mode
[_] Keyboard shortcuts
[_] Command palette
[_] Public sharing
[_] Comments/annotations
[x] Task management (checkboxes, due dates)
[x] Calendar view
[_] Backlinks panel
[x] Outline/table of contents
[x] Custom themes
[x] Plugins/extensions
```

**Additional MVP Features**:
```
___TBD as we progress.
```

**Notes**:
```
Most of these are provided by obsidian, we will need to integrate and identify the best way to take advantage of those.```

---

### FP-2: AI Integration Priority

**Status**: `[ ] Open` | `[x] Decided`

**Question**: How critical is AI integration in the MVP?

```
[x] A. Critical - MCP server must be in MVP
[ ] B. Important - Include basic AI features (auto-linking, search)
[ ] C. Nice to have - Can add after MVP
[ ] D. Not important - Focus on manual workflows first
```

**Decision**: AI First, this is to work with claude-flow and other ai agent development. It is the most important part.
```
Priority: ______________________________________________________

First AI Feature to Build: _____________________________________

_________________________________________________________________
```

**AI Features Ranking** (1 = highest priority):

```
[x] MCP server (let Claude/AI agents create/edit docs)
[_] Auto-linking (suggest related documents)
[_] Semantic search (search by meaning, not just keywords)
[_] Auto-tagging (AI suggests tags)
[_] Summary generation
[x] Duplicate detection
[_] Change analysis (detect related docs when editing)
[_] Chat with your knowledge base
[_] Auto-generate daily summaries
[_] Other: _____________________________________________________
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

### FP-3: Collaboration Features

**Status**: `[ ] Open` | `[x] Decided`

**Question**: What collaboration features are needed?

```
[ ] A. None - solo use only
[ ] B. Read-only sharing (share links to view)
[x] C. Multi-user editing (no real-time)
[ ] D. Real-time collaboration (Google Docs style)
[ ] E. Comments and annotations
[ ] F. Full collaboration suite (C + D + E)
```

**Decision**: Local based on markdown files, will require commit and push for other users to see this.
```
Level: _________________________________________________________

Target Users: __________________________________________________
```

**Collaboration Features**: Future feature we can set up an api that does CRDT using supabase. This would show all of the below, and it would also show current work being done by AI, through the task lists or log files etc.
```
[_] User presence (see who's online)
[_] Cursors (see where others are typing)
[_] Comments/threads
[_] @mentions
[_] Activity feed
[_] Notifications
[_] Permissions (read/write/admin)
[_] Workspace/team management
[_] Other: _____________________________________________________
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

## Timeline & Resources

### TR-1: Development Timeline

**Status**: `[ ] Open` | `[ ] Decided`

**Question**: What is your target timeline?

**MVP Launch Target**:
```
Date: __________________________________________________________

Or Duration: ___________________________________________________
```

**Phase Breakdown**:

```
Phase 1 - Setup & Core Infrastructure
  Duration: ______ weeks
  Key Deliverables: ____________________________________________
  _______________________________________________________________

Phase 2 - Document Management & Basic Graph
  Duration: ______ weeks
  Key Deliverables: ____________________________________________
  _______________________________________________________________

Phase 3 - AI Integration
  Duration: ______ weeks
  Key Deliverables: ____________________________________________
  _______________________________________________________________

Phase 4 - Advanced Features
  Duration: ______ weeks
  Key Deliverables: ____________________________________________
  _______________________________________________________________

Phase 5 - Polish & Launch
  Duration: ______ weeks
  Key Deliverables: ____________________________________________
  _______________________________________________________________
```

**Total Timeline**: _______ weeks/months

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

### TR-2: Development Approach

**Status**: `[ ] Open` | `[ ] Decided`

**Question**: How will you develop this?

```
[ ] A. Solo, part-time (evenings/weekends)
[ ] B. Solo, full-time
[ ] C. Team, distributed work
[ ] D. Sprints/milestones
[ ] E. Continuous development (no fixed timeline)
[ ] F. Other: _________________________________________________
```

**Working Style**:
```
Methodology: ___________________________________________________

Sprint Length (if applicable): _________________________________

Review Cadence: ________________________________________________
```

**Risk Factors**:
```
What could delay the project?

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

Mitigation:

_________________________________________________________________

_________________________________________________________________
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

## Business Model

### BM-1: Monetization Strategy

**Status**: `[ ] Open` | `[ ] Decided` | `[ ] N/A (internal tool)`

**Question**: How will this generate revenue (if applicable)?

```
[ ] A. Not applicable - internal tool only
[ ] B. Freemium SaaS (free tier + paid plans)
[x] C. Paid-only SaaS
[ ] D. Open source + paid hosting
[ ] E. Open source + support contracts
[x] F. One-time license
[ ] G. Other: _________________________________________________
```

**Decision**:
```
Model: Internal tool with free license for clients, and a future feature of creating a wrapping SaaS app that can help sell it more broadly. The SaaS model will have to be analyzed later for price and customer aquisition etc.

Reasoning: Only needed for internal customers and our development work. It also will become part of our core offering.
```

**Pricing Strategy** (if SaaS):

```
Free Tier:
  Users: _______________________________________________________
  Limits: _______________________________________________________
  _______________________________________________________________

Paid Tier(s):
  Name: _________________________________________________________
  Price: $______ per ___________
  Features: _____________________________________________________
  _______________________________________________________________

  Name: _________________________________________________________
  Price: $______ per ___________
  Features: _____________________________________________________
  _______________________________________________________________

Enterprise:
  Pricing: ______________________________________________________
  Features: _____________________________________________________
  _______________________________________________________________
```

**Target Customer Acquisition**:
```
Year 1: _______ users/customers
Year 2: _______ users/customers
Year 3: _______ users/customers
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

### BM-2: Open Source Strategy

**Status**: `[ ] Open` | `[x] Decided`

**Question**: Will this be open source?

```
[ ] A. Fully open source (MIT/Apache)
[ ] B. Open core (core = open, premium features = closed)
[ ] C. Source-available (BSL, visible but not truly open)
[x] D. Closed source (proprietary)
[ ] E. Undecided
[ ] F. Other: _________________________________________________
```

**Decision**:
```
License: Closed for now. This is going to wrap too much secret sauce.

Open Source Components: ________________________________________

_________________________________________________________________

Closed/Proprietary Components: _________________________________

_________________________________________________________________
```

**Open Source Goals** (if applicable):
```
[x] Build community
[ ] Get contributions
[ ] Transparency
[x] Marketing/distribution
[ ] Enable self-hosting
[ ] Other: _____________________________________________________
```

**Notes**:
```
If we do open-source this, and are able to separate the secret sauce except for the defaults etc, then it could be used to promote our services and show technical leadership in the field.

_________________________________________________________________
```

---

## Integration Requirements

### IR-1: Obsidian Integration

**Status**: `[ ] Open` | `[ ] Decided`

**Question**: How should this integrate with Obsidian (if at all)?

```
[ ] A. No integration - completely separate
[ ] B. Can import from Obsidian vaults
[ ] C. Can export to Obsidian format
[ ] D. Bidirectional sync with Obsidian
[ ] E. Read Obsidian vaults directly (same file format)
[ ] F. Start with Obsidian, gradually replace
[ ] G. Other: _________________________________________________
```

**Decision**:
```
Integration Level: _____________________________________________

Implementation: ________________________________________________

_________________________________________________________________
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

### IR-2: Git Integration

**Status**: `[ ] Open` | `[x] Decided`

**Question**: How important is Git integration?

```
[x] A. Critical - must store markdown files in Git repos
[ ] B. Important - support Git but not required
[ ] C. Nice to have - can add later
[ ] D. Not important - use database versioning instead
```

**Decision**:
```
Priority: Git integration can just be through normal agile development process intially. We do want features to make tasks, bugs and questions into issues on git. It would 

Implementation:
[ ] Direct Git operations (libgit2, simple-git)
[ ] Git sync in background
[x] Manual export to Git
[ ] GitHub API integration
[ ] GitLab/Bitbucket support
[ ] Other: _____________________________________________________
```

**Git Features Needed**:
```
[ ] Commit on save
[ ] Push/pull to remote
[ ] Branch support
[ ] Merge conflict resolution
[ ] View history
[ ] Blame/annotations
[ ] Other: _____________________________________________________
```

**Notes**:
```
This should be integrated at the agent level, or workflow. So that it is not weighting down the data.  Tasks, bugs, wiki, and other elements should tie together with our development workflow.
```

---

### IR-3: Other Tool Integrations

**Status**: `[ ] Open` | `[x] Decided`

**Question**: What other tools need integration?

**Mark priority**: `[1]` = MVP, `[2]` = v1.1, `[3]` = v2.0, `[X]` = Not needed

```
[2] Claude Desktop (MCP)
[2] VS Code (extension)
[_] Notion (import/export)
[_] Linear (issue tracking)
[_] Jira (issue tracking)
[_] Slack (notifications)
[1] Discord (notifications)
[1] GitHub Issues
[_] GitLab
[_] Zapier/Make (automation)
[_] Google Drive
[_] Dropbox
[_] Calendar apps (Google Calendar, etc.)
[_] Email (send/receive notes)
[_] Browser extension
[_] Mobile apps (iOS/Android)
[1] API for custom integrations
[_] Webhooks
[x] Other: Agent interface, can be used with custom app. User would use Speech to Text and the app would be able to interface with this process. So for instance these questions would have turned into an interview. 
[_] Other: _____________________________________________________
```

**Notes**:
```
_________________________________________________________________

_________________________________________________________________
```

---

## Open Questions

### OQ-1: Technical Unknowns

**Questions that need research/prototyping:**

```
1. _________________________________________________________________

   Status: [ ] Researching [ ] Prototyping [ ] Answered

   Answer: ____________________________________________________________

   _____________________________________________________________________

2. _________________________________________________________________

   Status: [ ] Researching [ ] Prototyping [ ] Answered

   Answer: ____________________________________________________________

   _____________________________________________________________________

3. _________________________________________________________________

   Status: [ ] Researching [ ] Prototyping [ ] Answered

   Answer: ____________________________________________________________

   _____________________________________________________________________

4. _________________________________________________________________

   Status: [ ] Researching [ ] Prototyping [ ] Answered

   Answer: ____________________________________________________________

   _____________________________________________________________________

5. _________________________________________________________________

   Status: [ ] Researching [ ] Prototyping [ ] Answered

   Answer: ____________________________________________________________

   _____________________________________________________________________
```

---

### OQ-2: Product/Market Questions

**Questions about users, market, positioning:**

```
1. _________________________________________________________________

   Status: [ ] Open [ ] Researching [ ] Answered

   Answer: ____________________________________________________________

   _____________________________________________________________________

2. _________________________________________________________________

   Status: [ ] Open [ ] Researching [ ] Answered

   Answer: ____________________________________________________________

   _____________________________________________________________________

3. _________________________________________________________________

   Status: [ ] Open [ ] Researching [ ] Answered

   Answer: ____________________________________________________________

   _____________________________________________________________________
```

---

### OQ-3: Clarifications Needed

**Questions for you to answer:**

1. **Team Size & Collaboration**:
   ```
   How many people will use this initially?

   Answer: ____________________________________________________________
   ```

2. **Public Sharing**:
   ```
   Do you need to publish/share knowledge graphs externally (read-only)?

   Answer: ____________________________________________________________
   ```

3. **Technical Comfort**:
   ```
   Are you comfortable with local setup, Git workflows, and terminal usage?

   [ ] Very comfortable - prefer full control
   [ ] Comfortable - okay with some complexity
   [ ] Prefer simple setup - GUI/web-based preferred

   Notes: _____________________________________________________________
   ```

4. **Existing Tools**:
   ```
   Do you currently use Obsidian or Notion? If so, for what?

   Answer: ____________________________________________________________

   _____________________________________________________________________
   ```

5. **Priority: Knowledge Graph vs Collaboration**:
   ```
   Which is more critical for your use case?

   [ ] Knowledge graph visualization (even if solo use)
   [ ] Team collaboration (even with basic graph)
   [ ] Both equally important
   [ ] Other priority: _______________________________________________
   ```

6. **AI Usage Patterns**:
   ```
   How do you currently use AI tools (Claude, ChatGPT, etc.)?

   Frequency: [ ] Daily [ ] Weekly [ ] Occasionally

   Primary Use Cases: _________________________________________________

   _____________________________________________________________________

   _____________________________________________________________________

   Current Pain Points: _______________________________________________

   _____________________________________________________________________

   _____________________________________________________________________
   ```

7. **Markdown Volume**:
   ```
   Estimate how much markdown content you generate:

   [ ] A few docs per week
   [ ] Multiple docs per day
   [ ] 10+ docs per day
   [ ] Massive (100+ docs/week)

   Current storage: ___________________________________________________

   Current organization method: _______________________________________
   ```

8. **Deployment Preference**:
   ```
   Where do you want this hosted?

   [ ] Local/desktop only (like Obsidian)
   [ ] Self-hosted server (VPS, home server)
   [ ] Cloud (Vercel, Railway, etc.)
   [ ] Managed service (Supabase, Firebase)
   [ ] Flexible - whatever works best

   Notes: _____________________________________________________________
   ```

9. **Data Privacy/Security**:
   ```
   How sensitive is your data?

   [ ] Very sensitive - must be local/self-hosted only
   [ ] Moderately sensitive - encrypted cloud okay
   [ ] Not sensitive - standard cloud services fine

   Specific requirements: _____________________________________________

   _____________________________________________________________________
   ```

10. **Success Criteria**:
    ```
    How will you know this project is successful?

    6 months: __________________________________________________________

    _____________________________________________________________________

    1 year: ____________________________________________________________

    _____________________________________________________________________

    Long-term: _________________________________________________________

    _____________________________________________________________________
    ```

---

## Decision Summary

**Last Updated**: _______________________

**Decisions Made**: _____ / _____

**Open Questions**: _____

**Blocked On**:
```
_________________________________________________________________

_________________________________________________________________
```

**Next Steps**:
```
1. _________________________________________________________________

2. _________________________________________________________________

3. _________________________________________________________________

4. _________________________________________________________________

5. _________________________________________________________________
```

**Ready to Proceed?**: `[ ] Yes` | `[ ] No - need to answer: ________________`

---

## Notes & Constraints

**Hard Constraints** (non-negotiable requirements):
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

**Soft Constraints** (preferences but flexible):
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

**Assumptions** (things we're assuming but should validate):
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

**Risks** (potential blockers or concerns):
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## Revision History

| Date       | Changes           | Updated By |
| ---------- | ----------------- | ---------- |
| 2025-10-20 | Initial creation  | Claude     |
| 2025-10-20 | Answered a couple | Mathew     |
|            |                   |            |
|            |                   |            |

---

**Instructions for Use**:
1. Fill out all sections with `[ ]` checkboxes
2. Update `Status:` fields as you make decisions
3. Add notes and rationale for key decisions
4. Review and update regularly as requirements evolve
5. Share with team members to gather input
6. Use this as single source of truth for project direction
