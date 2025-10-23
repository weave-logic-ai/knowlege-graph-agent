---
type: planning
version: "v2.0-web"
status: future
priority: low
created_date: "2025-10-21"
estimated_timeline: "6-12 months post-MVP"

tags:
  - planning
  - future
  - web-version
  - saas
  - deferred
---

# Future Web Version - Decision Matrix

**Status**: Deferred - Focus on Obsidian MVP first
**Timeline**: v2.0+ (6-12 months after MVP launch)
**Purpose**: SaaS web app for broader market beyond Obsidian users

---

## 🎯 Purpose of Web Version

The Obsidian-first MVP proves value with:
- Internal teams (developers)
- Clients who already use markdown workflows
- Power users comfortable with local-first tools

**Web version enables**:
- Broader market (non-technical users)
- Real-time collaboration (teams across orgs)
- Public sharing (read-only knowledge graphs)
- Mobile access (without Obsidian mobile app)
- SaaS monetization (subscription revenue)

---

## 📋 Deferred Decisions

These decisions were postponed when we chose Obsidian-first approach:

### Frontend Decisions

#### TS-1: Frontend Framework (Deferred)
**Question**: React/Next.js vs Svelte/SvelteKit for web version?

**Status**: Open - Decide before v2.0 development
**Research Needed**:
- Prototype performance with 1000+ node graphs
- Developer experience comparison
- Bundle size impact
- Hiring considerations (if building team)

**Options**:
- **React + Next.js**: Larger ecosystem, Shadcn UI
- **Svelte + SvelteKit**: Smaller bundles, better performance

**Decision Date**: TBD (6+ months)

---

#### TS-2-Web: Graph Visualization Library (Deferred)
**Question**: React Flow vs Svelte Flow vs D3.js?

**Depends On**: TS-1 (frontend framework choice)

**Options**:
- React Flow (if React)
- Svelte Flow (if Svelte)
- D3.js (maximum customization)
- Cytoscape.js (scientific graphs)

**Decision Date**: TBD (after TS-1)

---

#### TS-5-Web: Markdown Editor Component (Deferred)
**Question**: TipTap vs CodeMirror vs Monaco?

**Status**: Open
**Likely Answer**: TipTap (works with React/Svelte, collaborative)

**Decision Date**: TBD

---

### Backend Decisions

#### TS-3-Web: Hosting Architecture (Deferred)
**Question**: Serverless (Vercel/Cloud Run) vs Kubernetes?

**Status**: Open
**Likely Answer**: Serverless (Cloud Run) initially

**Options**:
- Cloud Run (scales to zero, Google Cloud native)
- Vercel (simpler, less control)
- Kubernetes (more control, more complexity)

**Decision Date**: Before v2.0 deployment

---

#### TS-4-Web: Vector Database at Scale (Deferred)
**Question**: pgvector vs Pinecone for 10K+ users?

**Status**: Open
**Current MVP**: SQLite embeddings (local)

**Options**:
- pgvector (free, PostgreSQL extension)
- Pinecone (managed, $70-$600/month)
- Hybrid (pgvector initially, Pinecone at scale)

**Decision Date**: When user count > 1000

---

### SaaS Decisions

#### TS-6-Web: Authentication at Scale (Deferred)
**Question**: Supabase Auth vs Auth0 vs Clerk?

**Status**: Open
**Likely Answer**: Supabase Auth (already using Supabase for DB)

**Decision Date**: Before v2.0 launch

---

#### BM-1-Web: SaaS Pricing (Deferred)
**Question**: What pricing tiers for web version?

**Status**: Open
**Research Needed**: Market analysis after MVP success

**Preliminary Model** (from Phase 3):
- Free: 100 nodes, 1 user
- Pro: $15/month (unlimited nodes, 1 user)
- Team: $25/user/month (collaboration, 5+ users)
- Enterprise: Custom pricing (SSO, compliance)

**Decision Date**: 3-6 months before v2.0 launch

---

## 🗂️ Deferred Features (Out of MVP Scope)

### Frontend Features (Build Custom Web App)
These features exist in Obsidian but would need to be rebuilt for web:

1. **Knowledge Graph Visualization**
   - Interactive graph (zoom, pan, filter)
   - Node clustering
   - Custom layouts (force-directed, hierarchical)
   - Minimap
   - Export (PNG, SVG)

2. **Markdown Editor**
   - WYSIWYG editor (TipTap)
   - Syntax highlighting
   - Wikilink autocomplete
   - Tag autocomplete
   - Code blocks
   - Tables
   - Math (LaTeX)
   - Diagrams (Mermaid)

3. **Canvas/Whiteboard**
   - Visual brainstorming
   - Drag-and-drop nodes
   - Connect nodes with arrows
   - Embed notes

4. **UI Components**
   - Navigation sidebar
   - Tag explorer
   - Backlinks panel
   - Search interface
   - Settings panel
   - Theme switcher (dark/light)

---

### SaaS Features (Multiplayer & Enterprise)

5. **Authentication & Authorization**
   - User registration/login
   - OAuth (Google, GitHub)
   - Magic links
   - 2FA
   - SSO/SAML (enterprise)
   - Row-level security

6. **Real-Time Collaboration**
   - CRDT for concurrent editing
   - User presence (see who's online)
   - Cursors (see where others are typing)
   - Conflict resolution
   - WebSockets/Supabase Realtime

7. **Team Features**
   - Workspace management
   - Invite team members
   - Permissions (read/write/admin)
   - Activity feed
   - Notifications
   - @mentions

8. **Public Sharing**
   - Public/private toggle
   - Read-only sharing links
   - Embed graphs on websites
   - Custom domains
   - Password protection

9. **Comments & Annotations**
   - Comment threads
   - Inline comments
   - Resolve/unresolve
   - Emoji reactions

10. **Billing & Subscriptions**
    - Stripe integration
    - Self-service upgrades/downgrades
    - Usage tracking
    - Invoice management
    - Payment recovery (dunning)

11. **Analytics Dashboard**
    - Usage metrics (nodes, users, sessions)
    - Collaboration insights
    - Knowledge growth over time
    - User engagement
    - Export reports

12. **Admin Panel**
    - User management
    - Workspace settings
    - Billing overview
    - System health
    - Support tools

---

### Infrastructure Features

13. **Multi-Tenancy**
    - Workspace isolation
    - Data separation
    - Custom branding
    - Storage quotas

14. **Scalability**
    - Load balancing
    - Caching (Redis)
    - CDN for static assets
    - Database read replicas
    - Connection pooling

15. **Security & Compliance**
    - SOC 2 Type II
    - GDPR compliance
    - Data residency options
    - Audit logs
    - IP whitelisting
    - Encryption at rest

16. **Monitoring & Observability**
    - Application performance monitoring
    - Error tracking (Sentry)
    - Logging (structured logs)
    - Alerting
    - Uptime monitoring
    - SLA tracking

17. **Backup & Disaster Recovery**
    - Automated backups
    - Point-in-time recovery
    - Backup testing
    - Workspace export

---

## 📊 v2.0 Decision Matrix

When ready to build web version, answer these:

### Strategic Decisions
- [ ] **Target Market**: Current Obsidian users or broader market?
- [ ] **Positioning**: Obsidian competitor or complementary?
- [ ] **Migration Path**: Import from Obsidian vaults?
- [ ] **Mobile Strategy**: Responsive web or native apps?

### Technical Decisions
- [ ] **TS-1-Web**: Frontend framework (React vs Svelte)
- [ ] **TS-2-Web**: Graph visualization library
- [ ] **TS-3-Web**: Hosting architecture (serverless vs K8s)
- [ ] **TS-4-Web**: Vector database at scale
- [ ] **TS-5-Web**: Markdown editor component
- [ ] **TS-6-Web**: Authentication provider

### Business Decisions
- [ ] **BM-1-Web**: SaaS pricing tiers
- [ ] **BM-2-Web**: Open source strategy (still closed?)
- [ ] **BM-3-Web**: Go-to-market strategy
- [ ] **BM-4-Web**: Customer acquisition channels

### Product Decisions
- [ ] **FP-1-Web**: Which Obsidian features to replicate?
- [ ] **FP-2-Web**: Which features are web-only?
- [ ] **FP-3-Web**: Real-time collab in v2.0 or v2.1?
- [ ] **FP-4-Web**: Mobile app priority?

---

## 🗓️ Estimated Timeline (v2.0)

**Prerequisites**:
1. MVP proven with 5+ client projects
2. Clear user demand for web version
3. Budget for 6-12 month development
4. Team of 2-3 developers (or solo + 6-12 months)

**Development Phases**:

### Phase 1: Frontend Core (2-3 months)
- Choose framework (TS-1)
- Build graph visualization (TS-2)
- Build markdown editor (TS-5)
- Build navigation/search UI
- Static demo (no backend)

### Phase 2: Backend & Auth (2-3 months)
- Serverless deployment (TS-3)
- Supabase integration (TS-4, TS-6)
- User authentication
- File storage & sync
- API endpoints

### Phase 3: Collaboration (2-3 months)
- Real-time editing (CRDT)
- User presence
- Comments & annotations
- Team workspaces
- Permissions

### Phase 4: SaaS Features (2-3 months)
- Billing & subscriptions
- Analytics dashboard
- Admin panel
- Public sharing
- Mobile responsive

**Total**: 8-12 months

---

## 💰 Estimated Costs (v2.0)

### Development Costs
- **Solo + AI**: $0 (6-12 months)
- **Team of 3**: $300K-$600K (salaries + overhead)

### Infrastructure Costs (100 users)
- Vercel/Cloud Run: $50/month
- Supabase: $25-$100/month
- Pinecone (if needed): $70-$600/month
- Monitoring: $50/month
- **Total**: $195-$800/month

### Scale Costs (1000 users)
- Hosting: $200/month
- Supabase: $250/month
- Pinecone: $600/month
- Monitoring: $100/month
- **Total**: $1,150/month

**Unit Economics**: $1.15/user/month (at 1000 users)

---

## 🎯 Success Metrics (Before Building v2.0)

**Don't build web version until**:
1. ✅ MVP used successfully for 10+ client projects
2. ✅ 3+ months of consistent Obsidian-based usage
3. ✅ Clear demand for web access (user requests)
4. ✅ Budget/runway for 6-12 month project
5. ✅ At least 1 paying customer or funding secured

**If these aren't met**: Keep improving Obsidian-based MVP

---

## 🔗 Related

- [[obsidian-first-architecture|Obsidian-First Architecture]] - Current approach
- [[decision-reanalysis-obsidian-first|Decision Reanalysis]] - Why we deferred
- [[MASTER-PLAN|Master Plan]] - Current roadmap (Obsidian-only)
- [[../business/saas-pricing-model|SaaS Pricing Model]] - Preliminary web pricing

---

**Status**: Deferred to v2.0+ (6-12 months post-MVP)
**Decision**: Focus on Obsidian MVP first, prove value, then consider web
**Review Date**: 3-6 months after MVP launch
