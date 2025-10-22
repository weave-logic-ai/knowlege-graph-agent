---
decision_id: "ED-1"
decision_type: "executive"
title: "Project Scope & Purpose"
status: "decided"
priority: "critical"
category: "strategic"

created_date: "2025-10-20"
last_updated: "2025-10-20"
decided_date: "2025-10-20"
implemented_date: null

decision_maker: "Mathew"
stakeholders:
  - "Development Team"
  - "Business Team"
ai_assisted: true

blocks: []
impacts:
  - "TS-1"
  - "TS-3"
  - "BM-1"
  - "architecture"
requires: []

research_status: "completed"
selected_option: "C"

tags:
  - executive
  - scope
  - saas
  - critical
  - decided
---

# ED-1: Project Scope & Purpose

**Status**: ✅ **DECIDED** on 2025-10-20
**Decision**: Build as **SaaS product from day one** using Google Cloud infrastructure

---

## Question

What is the primary purpose of this project?

---

## Options Evaluated

### A. Internal tool only
Solve my/my team's markdown management problem

**Pros**:
- Faster to build (no multi-tenancy)
- Lower complexity
- No business model needed

**Cons**:
- No revenue potential
- Limited scope
- Missed SaaS opportunity

---

### B. Internal tool first, potential SaaS later
Build for internal use, keep SaaS option open

**Pros**:
- Validate internally first
- Lower initial risk
- Can pivot to SaaS

**Cons**:
- May need architecture refactor
- Delayed revenue
- Two-phase development

---

### C. Build as SaaS product from day one ✅ **CHOSEN**
Architected as multi-tenant SaaS from the start

**Pros**:
- Revenue potential from start
- Multi-tenant architecture built in
- Can use for internal + clients
- Google Cloud services fit well
- Can start very inexpensive

**Cons**:
- Higher initial complexity
- Longer development time
- More infrastructure needed

---

### D. Open source project with optional paid hosting
Community-driven with managed hosting option

**Pros**:
- Community contributions
- Marketing via open source
- Self-hosting option

**Cons**:
- Revenue model unclear
- Support burden
- Competitive hosting services

---

## Decision Rationale

**Chosen**: **Option C - SaaS from Day One**

### Key Reasoning:
1. **Google Cloud Alignment**: Vertex AI, Cloud Run, and other GCP services work well for SaaS and scale cost-effectively
2. **Multi-tenant Requirement**: Will be used for all client and internal projects, so multi-tenancy is required regardless
3. **Revenue Potential**: Can be a paid SaaS later, or free service for clients
4. **Right Architecture**: Building multi-tenant from start avoids costly refactoring
5. **Dual Purpose**: Serves as internal tool AND potential product

### Quote from Decision Maker:
> "If we build it right it won't take too much time to polish it up for sale as a SaaS. This will be a key service internally, and we will use it for all client and internal projects. This may end up being a free SaaS for our clients, but we can sell access to it later, either way it has to be built as a multi-tenant system."

---

## Impact on Other Decisions

### Directly Impacts:
- [[../technical/frontend-framework|TS-1: Frontend Framework]] - Need web-first framework
- [[../technical/backend-architecture|TS-3: Backend Architecture]] - Multi-tenancy required
- [[../technical/database-storage|TS-4: Database & Storage]] - Row-level security needed
- [[../technical/auth|TS-6: Authentication]] - OAuth, workspaces required
- [[../business/monetization|BM-1: Monetization]] - SaaS pricing model applies
- [[../business/open-source|BM-2: Open Source]] - Open core or closed source

### Architecture Implications:
- Multi-tenant data isolation required
- Workspace/organization model needed
- Billing integration (Stripe) in future
- Google Cloud deployment from day one
- Scalability considerations from MVP

---

## Related Concepts

- [[../../concepts/weave-nn|Weave-NN Project]]
- [[../../architecture/multi-tenancy|Multi-Tenancy Architecture]]
- [[../../business/saas-pricing-model|SaaS Pricing Model]]
- [[../../technical/google-cloud-platform|Google Cloud Platform]]

---

## Open Questions from This Decision

- [[../open-questions/Q-BIZ-001|Q-BIZ-001]]: What pricing tiers for SaaS?
- [[../open-questions/Q-TECH-007|Q-TECH-007]]: How to implement workspace isolation?
- [[../open-questions/Q-BIZ-004|Q-BIZ-004]]: Free tier limits for client offering?

---

## Next Steps

1. ✅ Decided on SaaS approach
2. ⏳ Design multi-tenant architecture
3. ⏳ Choose GCP services (Cloud Run, Vertex AI, etc.)
4. ⏳ Define workspace/organization model
5. ⏳ Plan authentication strategy

---

**Back to**: [[../INDEX|Decision Hub]] | [[../../INDEX|Main Index]]
