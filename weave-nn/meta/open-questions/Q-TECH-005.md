---
question_id: "Q-TECH-005"
question_type: "technical"
title: "Real-time Collaboration Conflict Resolution Strategy"
status: "open"
priority: "high"
category: "features"

created_date: "2025-10-20"
last_updated: "2025-10-20"
due_date: "2025-11-10"

assigned_to: "Full Stack Team"
stakeholders:
  - "Frontend Team"
  - "Backend Team"
  - "Product Team"
  - "UX Team"
ai_assisted: true

related_decisions:
  - "FT-3"  # Real-time Collaboration (to be created)
  - "Q-TECH-003"  # Markdown Editor (affects collaboration)
  - "TS-4"  # Database & Storage
  - "ED-1"  # Project Scope (SaaS with teams)

research_tasks:
  - "Test Y.js CRDT conflict resolution with Tiptap"
  - "Evaluate Supabase Realtime for presence and updates"
  - "Design conflict scenarios (AI vs human, human vs human)"
  - "Prototype offline-first with sync capabilities"
  - "Test with concurrent edits from 5+ users"
  - "Evaluate operational transformation vs CRDT"
  - "Design UX for conflict awareness and resolution"

tags:
  - technical
  - features
  - high-priority
  - research-needed
  - collaboration
  - real-time
---

# Q-TECH-005: Real-time Collaboration Conflict Resolution Strategy

**Status**: 🔍 **OPEN - Research Needed**
**Priority**: 🟡 **HIGH**

---

## The Question

How should we handle real-time collaborative editing conflicts in Weave-NN, especially when AI agents and human users are editing the same document simultaneously?

### Sub-questions:
1. Should we use CRDTs (Y.js) or Operational Transformation (OT)?
2. How do we handle AI-generated edits vs human edits in real-time?
3. What happens when users are offline and sync later?
4. How do we communicate conflicts to users (UX)?
5. Should we lock documents when AI is editing?
6. Can we merge graph changes (document links) in real-time?

---

## Context from Analysis

### From Custom Solution Analysis

**Collaboration mentioned in architecture**:
- Real-time editing (Tiptap + Y.js)
- WebSockets (Socket.io) or Supabase Realtime
- Multiple users editing simultaneously
- User presence indicators

**From Phase 3: Advanced Features (Weeks 11-14)**:
- Real-time editing (Supabase Realtime + Tiptap Collaboration)
- User presence
- Comments/annotations

**Technology suggestions**:
- Y.js for CRDT-based collaboration
- Supabase Realtime for WebSocket layer

---

### From Project Scope (ED-1)

**SaaS implications for collaboration**:
- Multi-user teams working on shared knowledge bases
- Both synchronous (real-time) and asynchronous (offline) editing
- AI agents continuously adding/updating documents
- Need to prevent data loss

---

### Unique Challenge: AI + Human Collaboration

**Traditional collaboration**: Human ↔ Human
**Our challenge**: Human ↔ AI ↔ Human

**Scenarios**:
1. **AI analyzes while user edits**
   - AI agent adds analysis to document
   - User is simultaneously editing same section
   - Conflict: How to merge?

2. **AI auto-links while user writes**
   - User typing new content
   - AI suggests wikilinks `[[Document]]`
   - Conflict: Insert where?

3. **Multiple users + AI agent**
   - 3 humans editing
   - AI agent updating based on external trigger
   - Conflict: Whose change wins?

4. **Offline user + AI updates**
   - User goes offline, makes edits
   - AI updates document while user offline
   - User comes back online
   - Conflict: Merge how?

---

## Collaboration Approaches

### Approach 1: CRDT (Conflict-free Replicated Data Types) with Y.js ⭐

**What it is**: Data structure that automatically merges concurrent edits

**How it works**:
```
User A: "Hello [world]"
         inserts at position 6

User B: "Hello [friend]"
         inserts at position 6

CRDT merge: "Hello worldfriend" or "Hello friendworld"
(deterministic based on timestamps/client IDs)
```

**Tech stack**:
- Y.js (CRDT library)
- Tiptap Collaboration extension
- y-websocket or y-supabase for sync
- y-indexeddb for offline persistence

**Pros**:
- No central conflict resolution needed
- Works offline (sync later)
- Mathematically proven to converge
- No "save conflicts" errors
- Industry standard (Google Docs, Figma use CRDTs)

**Cons**:
- Results can be surprising (both edits kept)
- Larger data structure (metadata overhead)
- Complex to debug
- Learning curve

**Conflict resolution**:
- Automatic (no user intervention)
- All edits preserved
- Order determined by timestamps + client IDs

---

### Approach 2: Operational Transformation (OT)

**What it is**: Transform operations based on concurrent edits

**How it works**:
```
User A: Insert "world" at position 6
User B: Insert "friend" at position 6

Server receives both operations:
- Applies User A's operation
- Transforms User B's operation based on User A's
- Result: "Hello world friend" (or vice versa based on server order)
```

**Tech stack**:
- ShareDB (OT library)
- Custom WebSocket server
- Operational transformation algorithms

**Pros**:
- Deterministic server-side ordering
- Smaller data structure than CRDT
- Proven (used in Google Docs initially)

**Cons**:
- Requires server to be online (no offline editing)
- Complex to implement correctly
- Server is single point of failure
- Harder to debug

**Conflict resolution**:
- Server decides final order
- Client operations transformed

---

### Approach 3: Last-Write-Wins (LWW)

**What it is**: Simple timestamp-based resolution

**How it works**:
```
User A: Saves at 10:00:01
User B: Saves at 10:00:02

Result: User B's version wins, User A's changes lost
```

**Tech stack**:
- Simple timestamp field in database
- Client-side warnings for conflicts

**Pros**:
- Very simple to implement
- No special libraries needed
- Low overhead

**Cons**:
- Data loss (losing changes is unacceptable)
- Frustrating UX
- Not suitable for real-time collaboration

**Conflict resolution**:
- Latest timestamp wins
- Earlier changes discarded

**Verdict**: ❌ Not acceptable for collaborative editing

---

### Approach 4: Pessimistic Locking

**What it is**: Lock document when someone is editing

**How it works**:
```
User A: Opens document → Lock acquired
User B: Tries to open → "Read-only (User A is editing)"
User A: Closes document → Lock released
```

**Tech stack**:
- Database locks
- WebSocket for presence
- Read-only mode in editor

**Pros**:
- No conflicts (only one editor at a time)
- Simple to implement
- No data loss

**Cons**:
- Poor UX (waiting for lock)
- Lock can get stuck (user closes browser)
- Not true real-time collaboration

**Use cases**:
- Could use for AI editing (lock while AI works)
- Not suitable for human collaboration

---

## Recommended Approach: Y.js CRDT

**Rationale**:
- Industry standard for collaborative editing
- Works with Tiptap (our likely editor choice)
- Handles offline editing
- No single point of failure
- Proven at scale

**Architecture**:
```
┌──────────────┐
│   User A     │
│   Browser    │
│  ┌─────────┐ │
│  │ Tiptap  │ │
│  │ + Y.js  │ │
│  └────┬────┘ │
└───────┼──────┘
        │
        ├─────── WebSocket (Supabase Realtime or y-websocket)
        │
┌───────▼──────┐       ┌──────────────┐
│   User B     │       │   AI Agent   │
│   Browser    │       │   (Server)   │
│  ┌─────────┐ │       │  ┌─────────┐ │
│  │ Tiptap  │ │       │  │  Y.js   │ │
│  │ + Y.js  │ │       │  └─────────┘ │
│  └─────────┘ │       └──────────────┘
└──────────────┘
        │
        ├─────── Syncs to ──────────┐
        │                           │
        ▼                           ▼
┌─────────────────────────────────────┐
│          Postgres/Storage           │
│       (Y.js document state)         │
└─────────────────────────────────────┘
```

---

## AI + Human Collaboration Strategies

### Strategy 1: AI as Another Collaborative Client ✅

**Approach**: AI uses Y.js just like human users

**Implementation**:
```javascript
// AI agent connects to Y.js document
const ydoc = new Y.Doc();
const provider = new WebsocketProvider(wsUrl, docId, ydoc);
const ytext = ydoc.getText('content');

// AI makes edit
ytext.insert(position, "AI-generated analysis: ...");

// Y.js automatically merges with human edits
```

**Pros**:
- AI edits merge automatically with humans
- No special handling needed
- Consistent with human collaboration

**Cons**:
- AI edits might be surprising ("Where did this come from?")
- No visibility that AI made the change (unless we track it)

**UX enhancement**:
- Tag AI edits with metadata
- Show "AI edited this" indicator
- Allow users to undo AI edits

---

### Strategy 2: AI Edits with Awareness Notifications

**Approach**: AI uses Y.js but notifies users

**Implementation**:
```javascript
// AI makes edit with metadata
ytext.insert(position, "AI analysis", {
  author: "AI Agent",
  source: "semantic_analysis",
  timestamp: Date.now()
});

// UI shows notification
showNotification("AI added analysis to this document");

// Highlight AI-added sections
highlightText({ background: "#e3f2fd", label: "AI" });
```

**Pros**:
- Users aware of AI edits
- Can review and accept/reject
- Transparency

**Cons**:
- More complex UX
- Notifications can be annoying

---

### Strategy 3: AI Suggestions (Not Direct Edits)

**Approach**: AI doesn't edit directly, suggests changes

**Implementation**:
```javascript
// AI creates suggestion (not applied)
createSuggestion({
  type: "insert",
  position: 100,
  content: "AI recommends adding this section...",
  reason: "Related to recent project changes"
});

// User reviews and accepts/rejects
```

**Pros**:
- User stays in control
- No surprise edits
- Clear AI boundary

**Cons**:
- More user interaction required
- Slower workflow
- Defeats purpose of "automated" knowledge management

---

### Recommendation: Hybrid Approach

**For different AI operations**:

| AI Operation | Strategy | Rationale |
|--------------|----------|-----------|
| **Auto-linking** `[[Document]]` | Direct edit (Strategy 1) | Low-risk, easily undone |
| **Tag suggestions** | Suggestion (Strategy 3) | User should approve tags |
| **Content generation** | Direct edit with notification (Strategy 2) | Transparent but automatic |
| **Analysis appending** | Direct edit (Strategy 1) | Designed to be additive |
| **Content modification** | Suggestion (Strategy 3) | Modifying user content risky |

---

## Offline Editing & Sync

### Scenario: User Goes Offline

**Challenge**:
```
10:00 - User A offline, makes edits locally
10:05 - User B (online) edits same document
10:10 - AI agent adds analysis
10:15 - User A comes back online → Needs to sync
```

**Y.js Solution**:
- User A's Y.js doc stores edits locally (IndexedDB)
- When online, syncs with server
- CRDT automatically merges all edits
- No data loss, all changes preserved

**Implementation**:
```javascript
// Offline persistence
const provider = new IndexeddbPersistence(docId, ydoc);

// Sync when online
const wsProvider = new WebsocketProvider(wsUrl, docId, ydoc, {
  connect: navigator.onLine // Auto-connect when online
});

// Handle sync conflicts (automatic with CRDT)
wsProvider.on('sync', (isSynced) => {
  if (isSynced) {
    console.log('All offline changes synced');
  }
});
```

**User experience**:
- "You're offline. Changes will sync when you reconnect."
- "Syncing... (3 changes merged)"
- "Sync complete. 1 new edit from AI, 2 from User B."

---

## Conflict Scenarios & Resolutions

### Conflict 1: Simultaneous Edits to Same Paragraph

**Scenario**:
```
Original: "The project uses React."

User A: "The project uses React and TypeScript."
User B: "The project uses React for frontend."
```

**CRDT Resolution**:
```
Result: "The project uses React and TypeScript for frontend."
or:     "The project uses React for frontend and TypeScript."
(deterministic based on timestamps)
```

**UX**:
- Show both users' cursors in real-time
- Display "User B is typing" indicator
- Merged result appears automatically

---

### Conflict 2: AI Adds Section While User Editing

**Scenario**:
```
User A: Editing paragraph 2
AI Agent: Inserts new paragraph 3

Does AI's insert shift User A's cursor?
```

**CRDT Resolution**:
- User A's cursor position maintained (Y.js tracks positions)
- AI's insert appears below
- No disruption to User A

**UX**:
- Show notification: "AI added new section below"
- Highlight AI section briefly

---

### Conflict 3: Deletion Conflicts

**Scenario**:
```
Original: "The project uses React and Vue."

User A: Deletes "and Vue"
User B: Edits "Vue" to "Vue.js"
```

**CRDT Resolution**:
- Deletion wins (User A's delete happens)
- User B's edit to deleted text is lost

**Alternative**: Show conflict
```
Warning: User A deleted text you were editing.
[Undo User A's delete] [Keep my edit]
```

**Research needed**:
- Does Y.js detect this scenario?
- Can we show conflict warning?

---

### Conflict 4: Graph Changes (Document Links)

**Scenario**:
```
User A: Adds link [[Planning Doc]] at line 5
User B: Deletes line 5
AI Agent: Also adds [[Planning Doc]] at line 7

Result: How many links to Planning Doc?
```

**CRDT Resolution**:
- User A's link at line 5 deleted (line deleted)
- AI's link at line 7 remains
- Knowledge graph shows one link (not two)

**Graph sync**:
```javascript
// Parse wikilinks from merged document
const links = parseWikilinks(ydoc.getText('content').toString());

// Update graph in database
await updateGraphLinks(documentId, links);
```

**Challenge**: Graph updates are not CRDT (database updates)
**Solution**: Parse final merged document, rebuild graph links

---

## Presence & Awareness

### User Presence Features

**What to show**:
- Active users in document
- Cursor positions (live)
- Current selection/highlight
- "User X is typing..." indicator

**Implementation with Y.js Awareness**:
```javascript
import * as awarenessProtocol from 'y-protocols/awareness';

const awareness = provider.awareness;

// Set local user state
awareness.setLocalStateField('user', {
  name: 'Alice',
  color: '#ff6b6b',
  cursor: { line: 5, ch: 10 }
});

// Listen to other users
awareness.on('change', () => {
  const states = awareness.getStates();
  states.forEach((state, clientId) => {
    renderUserCursor(state.user);
  });
});
```

**UX**:
```
┌────────────────────────────────────┐
│ Editing: Alice, Bob, [AI Agent]    │
├────────────────────────────────────┤
│ # Project Planning                 │
│                                    │
│ Alice█                             │ ← Alice's cursor
│                                    │
│ The project will use...            │
│               Bob█                 │ ← Bob's cursor
│                                    │
└────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Basic Y.js Integration (Week 1-2)

**Tasks**:
- [ ] Set up Y.js with Tiptap
- [ ] Configure WebSocket provider (Supabase or y-websocket)
- [ ] Test with 2 users editing simultaneously
- [ ] Verify CRDT merging works

**Deliverable**: Two users can edit, see each other's changes in real-time

---

### Phase 2: Offline Support (Week 3)

**Tasks**:
- [ ] Add IndexedDB persistence
- [ ] Test offline editing
- [ ] Verify sync after reconnect
- [ ] Handle merge conflicts gracefully

**Deliverable**: Offline editing with automatic sync

---

### Phase 3: AI Integration (Week 4)

**Tasks**:
- [ ] Connect AI agent as Y.js client
- [ ] Test AI + human concurrent editing
- [ ] Add metadata tagging (AI vs human)
- [ ] Implement notifications for AI edits

**Deliverable**: AI can edit documents collaboratively

---

### Phase 4: Presence & UX (Week 5)

**Tasks**:
- [ ] Add user cursors
- [ ] Show "User X is typing" indicators
- [ ] Display active users list
- [ ] Add color-coded highlights

**Deliverable**: Rich collaborative UX

---

### Phase 5: Conflict UX (Week 6)

**Tasks**:
- [ ] Detect edge-case conflicts (deletion vs edit)
- [ ] Design conflict notification UI
- [ ] Add undo/redo for conflict resolution
- [ ] Test with complex scenarios

**Deliverable**: Conflicts handled gracefully with good UX

---

## Technical Challenges

### Challenge 1: Y.js Document Persistence

**Question**: How to store Y.js documents in Postgres?

**Options**:

**Option A: Store Y.js binary updates**
```sql
CREATE TABLE ydoc_updates (
  doc_id uuid,
  update bytea,  -- Y.js binary update
  created_at timestamptz
);
```
Apply all updates to reconstruct document

**Option B: Store decoded text + Y.js state**
```sql
CREATE TABLE documents (
  id uuid,
  content text,  -- Decoded markdown
  ydoc_state bytea  -- Y.js state for sync
);
```

**Option C: Use y-postgresql provider**
- Existing library for Postgres storage
- Handles updates automatically

**Research needed**:
- [ ] Test y-postgresql performance
- [ ] Compare storage size (updates vs state)

---

### Challenge 2: Multi-Tenancy with Y.js

**Question**: How to isolate workspace documents?

**Solution**:
```javascript
// Document ID includes workspace
const docId = `workspace-${workspaceId}-doc-${documentId}`;

// Supabase RLS ensures only workspace members can access
await supabase
  .from('ydoc_updates')
  .select()
  .eq('workspace_id', workspaceId)
  .eq('document_id', documentId);
```

**Security**:
- WebSocket auth must verify workspace membership
- Y.js provider must respect workspace boundaries

---

### Challenge 3: Graph Updates from Collaborative Edits

**Question**: When multiple users add/remove links, how to sync graph?

**Approach**:
```javascript
// After Y.js document changes, debounce graph updates
ydoc.on('update', debounce(() => {
  const currentContent = ydoc.getText('content').toString();
  const links = parseWikilinks(currentContent);

  // Update graph in database (not Y.js)
  await updateGraphEdges(documentId, links);
}, 1000));
```

**Challenge**: Graph is NOT a CRDT, it's in Postgres
**Solution**: Parse final state, update graph (idempotent)

---

## Research Tasks

### Week 1-2: Y.js Fundamentals
- [ ] Set up Y.js + Tiptap demo
- [ ] Test with multiple clients
- [ ] Verify offline editing
- [ ] Measure performance (latency, bandwidth)

### Week 3: AI Integration
- [ ] Connect AI agent as Y.js client
- [ ] Test concurrent AI + human edits
- [ ] Evaluate metadata tagging
- [ ] Design notification UX

### Week 4: Edge Cases
- [ ] Test delete vs edit conflicts
- [ ] Test massive concurrent edits (10+ users)
- [ ] Test with large documents (10k+ lines)
- [ ] Identify any CRDT surprises

### Week 5: Production Readiness
- [ ] Set up y-websocket server or Supabase Realtime
- [ ] Configure persistence (Postgres)
- [ ] Add monitoring and error handling
- [ ] Security review (auth, authorization)

---

## Risks & Mitigations

### Risk: CRDT merges produce nonsensical text
**Example**: "Hello worldfriend" instead of "Hello world friend"
**Likelihood**: Low (Y.js is smart about text)
**Impact**: Medium (UX issue)
**Mitigation**: Test extensively, educate users on collaborative editing

### Risk: Offline sync creates large merge conflicts
**Likelihood**: Medium (long offline sessions)
**Impact**: Medium (confusing merged doc)
**Mitigation**: Notify users of offline duration, show changes diff

### Risk: AI edits surprise users
**Likelihood**: High (if not communicated)
**Impact**: Medium (user frustration)
**Mitigation**: Clear notifications, undo capability, AI edit highlighting

### Risk: WebSocket server becomes bottleneck
**Likelihood**: Low (Y.js is efficient)
**Impact**: High (collaboration breaks)
**Mitigation**: Use Supabase Realtime (managed), monitor performance

---

## Alternative: Non-Real-Time Collaboration

**IF real-time is too complex**, fallback to simpler approach:

**Optimistic Locking**:
- Users edit locally
- On save, check if document changed since loaded
- If changed, show diff and ask user to merge
- Similar to Git merge conflicts

**Pros**:
- Much simpler to implement
- No WebSocket infrastructure
- Users understand merge workflow

**Cons**:
- Not real-time (can't see others typing)
- Merge conflicts are manual
- Poor UX for teams

**Verdict**: Only use if Y.js proves too complex (unlikely)

---

## Informs These Decisions

**Blocked by**:
- [[Q-TECH-003|Q-TECH-003: Markdown Editor]] - Tiptap needed for Y.js integration

**Blocks**:
- [[../features/real-time-collab|FT-3: Real-time Collaboration]] - Core implementation
- [[../features/offline-editing|FT-6: Offline Editing]] - Sync strategy

**Influences**:
- [[../technical/websocket-infrastructure|TS-10: WebSocket Infrastructure]] - Real-time layer
- [[../business/user-experience|BM-5: User Experience]] - Collaboration UX

---

## Success Criteria for Decision

We can close this question when:
- [ ] Y.js + Tiptap prototype works with 5+ users
- [ ] Offline editing tested and validated
- [ ] AI agent integration successful
- [ ] Conflict scenarios tested and UX designed
- [ ] Performance acceptable (low latency)
- [ ] Multi-tenancy security verified
- [ ] Graph sync strategy validated
- [ ] Clear implementation plan documented

---

## Resources & References

### Y.js & CRDTs
- Y.js: https://docs.yjs.dev
- Y.js Demos: https://demos.yjs.dev
- Tiptap Collaboration: https://tiptap.dev/docs/editor/collaboration/getting-started/overview
- CRDT Explained: https://crdt.tech

### Y.js Providers
- y-websocket: https://github.com/yjs/y-websocket
- y-supabase: https://github.com/yousefed/y-supabase
- y-postgresql: https://github.com/yjs/y-postgresql

### Supabase Realtime
- Docs: https://supabase.com/docs/guides/realtime
- Presence: https://supabase.com/docs/guides/realtime/presence

### Collaborative Editing Examples
- Tiptap Collab: https://collab.tiptap.dev
- Notion's approach: [Research articles]
- Google Docs tech: [Research articles on OT vs CRDT]

---

## Current Leaning (Preliminary)

**Recommendation: Y.js CRDT with Tiptap**

**Rationale**:
- Industry standard for collaborative editing
- Works offline (critical for UX)
- Handles AI + human collaboration naturally
- Integrates with Tiptap (our likely editor)
- Proven at scale (Figma, other apps use Y.js)

**AI Strategy**: Hybrid approach
- Direct edits for low-risk operations (links, tags)
- Notifications for content additions
- Suggestions for content modifications

**Fallback**: If Y.js too complex, use optimistic locking (but unlikely)

---

**Next Actions**:
1. Set up Y.js + Tiptap prototype
2. Test with AI agent as client
3. Design conflict notification UX
4. Evaluate Supabase Realtime vs y-websocket
5. Decision review: 2025-11-10

---

**Back to**: [[../INDEX|Decision Hub]] | [[Q-TECH-004|← Previous]]
