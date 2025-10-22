---
question_id: "Q-TECH-003"
question_type: "technical"
title: "Markdown Editor Selection: Tiptap vs Alternatives"
status: "open"
priority: "high"
category: "frontend"

created_date: "2025-10-20"
last_updated: "2025-10-20"
due_date: "2025-11-03"

assigned_to: "Frontend Team"
stakeholders:
  - "UX Team"
  - "Product Team"
ai_assisted: true

related_decisions:
  - "TS-1"  # Frontend Framework
  - "TS-7"  # Markdown Editor (to be created)
  - "Q-TECH-001"  # React vs Svelte (affects editor choice)

research_tasks:
  - "Prototype with Tiptap in both React and Svelte"
  - "Test markdown round-trip fidelity"
  - "Evaluate WYSIWYG vs plain markdown editing UX"
  - "Test collaboration features (Y.js integration)"
  - "Compare with Monaco, CodeMirror, and Lexical"
  - "Assess extension ecosystem and customization"
  - "Test performance with large documents (10k+ lines)"

tags:
  - technical
  - frontend
  - high-priority
  - research-needed
  - editor
---

# Q-TECH-003: Markdown Editor Selection

**Status**: 🔍 **OPEN - Research Needed**
**Priority**: 🟡 **HIGH**

---

## The Question

Which markdown editor should we use for Weave-NN, and should it be WYSIWYG (like Tiptap) or plain-text focused (like Monaco/CodeMirror)?

### Sub-questions:
1. Is Tiptap the right choice for our use case?
2. WYSIWYG vs plain markdown - which do users prefer for AI-generated docs?
3. How important is real-time collaboration in the editor?
4. Can we support both editing modes (visual + code)?
5. How does the editor choice interact with React vs Svelte decision?

---

## Context from Analysis

### From Custom Solution Analysis

**Recommended: Tiptap (ProseMirror)**
- "Best WYSIWYG markdown in React 2025"
- Mentioned for both React and Svelte stacks
- Supports real-time collaboration
- Markdown extension available

**Proposed capabilities**:
- WYSIWYG editing with Tiptap
- Real-time collaboration (multiple users)
- Markdown export/import
- Syntax highlighting
- Image/file uploads
- Version history
- AI suggestions inline

**Storage strategy** impacts editor choice:
- Need to preserve markdown format
- Round-trip fidelity critical (edit → markdown → edit)
- Git-friendly format required

---

## Editor Candidates

### Option 1: Tiptap (ProseMirror-based) - RECOMMENDED IN ANALYSIS

**What it is**: WYSIWYG editor built on ProseMirror

**Pros**:
- Modern WYSIWYG experience
- Strong markdown support (tiptap-markdown extension)
- Excellent real-time collaboration (Y.js integration)
- Active development and community
- Extensible (custom nodes/marks)
- Works with React and Svelte

**Cons**:
- WYSIWYG may hide raw markdown (less control)
- Learning curve for customization
- Bundle size larger than plain editors
- Requires understanding ProseMirror concepts

**Use case fit**:
- ✅ Great for non-technical users
- ✅ Real-time collaboration built-in
- ⚠️ May frustrate markdown purists
- ✅ Good for AI-edited content (clean interface)

---

### Option 2: Monaco Editor (VS Code's editor)

**What it is**: The code editor that powers VS Code

**Pros**:
- Developers already know it (VS Code)
- Excellent syntax highlighting
- Rich language support
- IntelliSense/autocomplete
- Diff view built-in

**Cons**:
- Not WYSIWYG (code-first)
- Collaboration requires custom implementation
- Larger bundle size
- Overkill for markdown-only

**Use case fit**:
- ✅ Perfect for developer audience
- ❌ Too technical for general users
- ⚠️ Collaboration is harder
- ✅ Familiar UX for devs

---

### Option 3: CodeMirror 6

**What it is**: Lightweight, extensible code editor

**Pros**:
- Smaller bundle than Monaco
- Highly customizable
- Good markdown support
- Collaborative editing possible
- Modern architecture (v6)

**Cons**:
- Not WYSIWYG
- More setup than Tiptap
- Smaller community than Monaco
- Collaboration requires more work

**Use case fit**:
- ✅ Good middle ground
- ✅ Lighter than Monaco
- ⚠️ Still code-focused, not visual
- ⚠️ Collaboration more complex

---

### Option 4: Lexical (Meta/Facebook)

**What it is**: Modern React-first rich text editor

**Pros**:
- Built by Meta (used in Facebook)
- Modern React architecture
- Extensible plugin system
- Good performance
- Markdown support improving

**Cons**:
- Primarily React (Svelte support unclear)
- Markdown support less mature than Tiptap
- Smaller ecosystem
- Less proven in production

**Use case fit**:
- ✅ If we choose React
- ⚠️ Markdown not primary focus
- ❌ Poor fit if we choose Svelte
- ⚠️ Less battle-tested for markdown

---

### Option 5: Milkdown (Markdown-focused WYSIWYG)

**What it is**: WYSIWYG markdown editor based on ProseMirror

**Pros**:
- Markdown-first design philosophy
- WYSIWYG with markdown in mind
- Framework agnostic (React/Vue/Svelte)
- Growing community

**Cons**:
- Newer, less proven
- Smaller ecosystem than Tiptap
- Documentation less comprehensive
- Fewer examples

**Use case fit**:
- ✅ Markdown-native approach
- ⚠️ Less mature than Tiptap
- ✅ Framework flexibility
- ⚠️ Smaller community for help

---

### Option 6: Hybrid Approach (Tiptap + Monaco)

**What it is**: Provide both visual and code modes

**Implementation**:
```
┌──────────────────────┐
│  [Visual] [Code]     │  ← Mode toggle
├──────────────────────┤
│                      │
│   Tiptap (Visual)    │
│   OR                 │
│   Monaco (Code)      │
│                      │
└──────────────────────┘
```

**Pros**:
- Best of both worlds
- Users choose their preference
- Power users get code view
- Casual users get WYSIWYG

**Cons**:
- Double implementation complexity
- Larger bundle size
- Sync issues between modes
- More testing required

---

## Key Evaluation Criteria

### 1. Markdown Fidelity

**Critical**: AI generates markdown, users edit, must round-trip perfectly

**Test cases**:
```markdown
# Complex markdown to test:

1. Nested lists
   - Item A
     - Subitem
2. Code blocks with syntax highlighting
```python
def hello():
    print("world")
```

3. Tables
4. Footnotes[^1]
5. Wikilinks [[Other Document]]
6. YAML frontmatter
7. Math equations (if needed)
8. Custom extensions
```

**Research tasks**:
- [ ] Test each editor with complex markdown
- [ ] Verify wikilink `[[...]]` support (custom extension?)
- [ ] Check frontmatter preservation
- [ ] Test paste from external sources

**Questions**:
- Does editor preserve all markdown features?
- Can we extend for custom syntax (wikilinks)?
- How does it handle invalid/edge-case markdown?

---

### 2. User Experience & Audience

**Question**: Who is our primary user?

**Personas**:

**Persona A: Developer/Technical User**
- Prefers plain markdown
- Wants keyboard shortcuts (Vim mode?)
- Comfortable with code view
- Values speed and control

**Persona B: Product Manager/Non-Technical**
- Prefers WYSIWYG
- Wants formatting buttons
- Uncomfortable with raw markdown
- Values ease of use

**Persona C: AI Agent**
- Generates clean markdown
- Doesn't care about editor (API only)
- Needs format stability

**Research needed**:
- [ ] Survey target user base
- [ ] Prototype both approaches
- [ ] User testing with AI-generated content

**Current assumption**: Mix of developers and PMs, so hybrid or WYSIWYG with code toggle

---

### 3. Real-time Collaboration

**Importance**: SaaS product with teams working together

**Collaboration features needed**:
- Multiple cursors/selections
- Live updates (no save button spam)
- Conflict resolution
- User presence indicators
- Comments/annotations (future)

**Editor comparison**:

| Editor | Collaboration Support | Implementation |
|--------|----------------------|----------------|
| **Tiptap** | ✅✅ Excellent (Y.js built-in) | Easy, well-documented |
| **Monaco** | ⚠️ Possible (custom) | Complex, need to build |
| **CodeMirror** | ⚠️ Possible (collab plugin) | Medium complexity |
| **Lexical** | ✅ Good (Lexical Collab) | Moderate |
| **Milkdown** | ✅ Good (Y.js) | Similar to Tiptap |

**Research tasks**:
- [ ] Test Tiptap + Y.js collaboration
- [ ] Evaluate Supabase Realtime integration
- [ ] Test with 5+ concurrent editors
- [ ] Measure latency and sync performance

---

### 4. AI Integration & Inline Suggestions

**Use case**: AI suggests edits, links, improvements inline

**Desired features**:
- Highlight AI-generated sections
- Suggest link insertions `[[Document]]`
- Inline completions (like Copilot)
- Comment suggestions
- Track AI vs human edits

**Editor capabilities**:

**Tiptap**:
- Custom decorations (highlighting)
- Custom nodes (AI suggestion bubbles)
- Extensions for inline widgets

**Monaco**:
- InlayHints (like VS Code)
- Decorations
- Widget system

**CodeMirror**:
- Decorations
- Widget system
- Extensions

**Research needed**:
- [ ] Prototype AI suggestion UI in Tiptap
- [ ] Test inline completion performance
- [ ] Design AI edit tracking system

---

### 5. Performance & Bundle Size

**Constraints**: SaaS product, fast loading critical

**Benchmarks needed**:

| Editor | Bundle Size (gzipped) | Large Doc Performance (10k lines) |
|--------|----------------------|-----------------------------------|
| Tiptap | ~50-100KB | TBD |
| Monaco | ~300-500KB | TBD |
| CodeMirror | ~50-80KB | TBD |
| Lexical | ~40-70KB | TBD |
| Milkdown | ~60-100KB | TBD |

**Research tasks**:
- [ ] Measure actual bundle sizes with our config
- [ ] Test with 10k+ line markdown documents
- [ ] Profile render performance
- [ ] Test on mobile devices

---

### 6. Framework Compatibility

**Dependent on Q-TECH-001** (React vs Svelte)

**If React/Next.js**:
- Tiptap: ✅✅ Excellent React support
- Lexical: ✅✅ React-first
- Monaco: ✅ React wrapper available
- CodeMirror: ✅ React wrapper available
- Milkdown: ✅ React support

**If Svelte/SvelteKit**:
- Tiptap: ✅ Svelte wrapper available
- Monaco: ⚠️ Svelte wrapper exists but less support
- CodeMirror: ⚠️ Svelte wrapper available
- Lexical: ❌ No official Svelte support
- Milkdown: ✅ Svelte support

**Decision dependency**:
- If Svelte → Lexical ruled out
- If React → All options viable

---

### 7. Extension Ecosystem

**Needed extensions**:
- Wikilinks `[[...]]` (custom)
- Task lists with state tracking
- Syntax highlighting (code blocks)
- Tables
- Image upload/paste
- Mentions (@user)
- Slash commands (/command)

**Research tasks**:
- [ ] Check if extensions exist or need custom build
- [ ] Estimate effort to build custom wikilink extension
- [ ] Test existing table/image plugins

---

## Trade-off Matrix

| Factor | Tiptap | Monaco | CodeMirror | Lexical | Milkdown |
|--------|--------|--------|------------|---------|----------|
| **WYSIWYG UX** | ✅✅ | ❌ | ❌ | ✅✅ | ✅✅ |
| **Markdown fidelity** | ✅ | ✅✅ | ✅✅ | ⚠️ | ✅✅ |
| **Collaboration** | ✅✅ | ⚠️ | ⚠️ | ✅ | ✅ |
| **Bundle size** | ✅ | ❌ | ✅✅ | ✅✅ | ✅ |
| **Performance** | ✅ | ✅✅ | ✅✅ | ✅ | ✅ |
| **Svelte support** | ✅ | ⚠️ | ⚠️ | ❌ | ✅ |
| **React support** | ✅✅ | ✅ | ✅ | ✅✅ | ✅ |
| **Dev familiarity** | ⚠️ | ✅✅ | ⚠️ | ⚠️ | ❌ |
| **Maturity** | ✅✅ | ✅✅ | ✅✅ | ✅ | ⚠️ |
| **Customization** | ✅✅ | ✅✅ | ✅✅ | ✅ | ✅ |

---

## Recommended Approach

### Phase 1: Tiptap Prototype (Week 1-2)

**Rationale**: Analysis recommended Tiptap, validate this

**Tasks**:
- [ ] Set up Tiptap in test project
- [ ] Implement markdown round-trip
- [ ] Add wikilink support (custom extension)
- [ ] Test collaboration with Y.js
- [ ] Build sample UI with common features
- [ ] User testing with non-technical users

**Success criteria**:
- Markdown fidelity is perfect
- Collaboration works smoothly
- Users find WYSIWYG helpful
- No major blockers

---

### Phase 2: Alternative if Tiptap Fails (Week 3)

**If Tiptap doesn't meet needs**, test:

**Option A**: CodeMirror 6 (if need lighter, code-focused)
**Option B**: Hybrid (Tiptap + Monaco toggle)
**Option C**: Milkdown (if markdown fidelity issues)

---

### Phase 3: Final Decision (Week 4)

Compare results and decide based on:
1. Framework choice (React vs Svelte)
2. User testing feedback
3. Technical implementation success
4. Performance benchmarks

---

## User Research Questions

**For potential users**:
1. Do you prefer visual (Google Docs-like) or code (VS Code-like) editing?
2. How important is real-time collaboration?
3. Have you used Notion, Obsidian, or similar tools? Preferences?
4. Comfort level with raw markdown syntax?
5. Most important features in a markdown editor?

**For AI workflow**:
1. Will AI-generated content be edited by humans frequently?
2. Do users need to see what was AI-generated vs human-written?
3. How often are documents collaboratively edited?

---

## Risks & Mitigations

### Risk: Tiptap doesn't preserve complex markdown
**Likelihood**: Medium
**Impact**: High
**Mitigation**: Test with real-world markdown samples early

### Risk: WYSIWYG frustrates power users
**Likelihood**: Medium
**Impact**: Medium
**Mitigation**: Offer code view toggle, or support both modes

### Risk: Collaboration is buggy or slow
**Likelihood**: Low (Y.js is proven)
**Impact**: High
**Mitigation**: Load test early, have fallback to manual save

### Risk: Bundle size impacts load time
**Likelihood**: Low
**Impact**: Medium
**Mitigation**: Code splitting, lazy loading editor

---

## Informs These Decisions

**Blocked by**:
- [[Q-TECH-001|Q-TECH-001: React vs Svelte]] - Framework determines compatibility

**Blocks**:
- [[../features/real-time-collab|FT-3: Real-time Collaboration]] - Editor choice enables/limits this
- [[../technical/ui-components|TS-2: UI Component Library]] - Editor UI integration

**Influences**:
- [[../features/ai-suggestions|FT-4: AI Inline Suggestions]] - Editor extensibility needed
- [[../business/user-experience|BM-5: User Experience Strategy]] - WYSIWYG vs code

---

## Success Criteria for Decision

We can close this question when:
- [ ] Tiptap prototype built and tested
- [ ] Markdown round-trip verified with complex docs
- [ ] User testing completed (5+ users)
- [ ] Collaboration tested with multiple users
- [ ] Performance benchmarks meet targets
- [ ] Integration with chosen framework validated
- [ ] Clear recommendation with rationale
- [ ] Backup plan if primary choice fails

---

## Resources & References

### Tiptap
- Docs: https://tiptap.dev
- React: https://tiptap.dev/docs/editor/getting-started/install/react
- Svelte: https://tiptap.dev/docs/editor/getting-started/install/svelte
- Markdown: https://tiptap.dev/docs/editor/markdown
- Collaboration: https://tiptap.dev/docs/editor/collaboration/getting-started/overview

### Alternatives
- Monaco: https://microsoft.github.io/monaco-editor/
- CodeMirror: https://codemirror.net
- Lexical: https://lexical.dev
- Milkdown: https://milkdown.dev

### Real-time Collaboration
- Y.js: https://docs.yjs.dev
- Supabase Realtime: https://supabase.com/docs/guides/realtime

---

## Current Leaning (Preliminary)

**Before prototyping**:

**Recommend Tiptap IF**:
- Users prefer WYSIWYG
- Real-time collaboration is critical
- Markdown fidelity tests pass
- Okay with moderate bundle size

**Consider CodeMirror IF**:
- Users are primarily developers
- Bundle size is critical
- Okay with code-first UX
- Collaboration is nice-to-have

**Consider Hybrid IF**:
- User base is truly mixed
- Budget allows extra development
- Both modes add significant value

**Next step**: 2-week Tiptap prototype as analysis suggested, then decide.

---

**Next Actions**:
1. Set up Tiptap prototype environment
2. Create test markdown samples (complex cases)
3. Build basic editor with collaboration
4. Schedule user testing sessions
5. Decision review: 2025-11-03

---

**Back to**: [[../INDEX|Decision Hub]] | [[Q-TECH-002|← Previous]] | [[Q-TECH-004|Next →]]
