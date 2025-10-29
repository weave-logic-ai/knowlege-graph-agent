---
business_id: BM-003
business_type: pricing-model
title: SaaS Pricing Model
status: draft
category: business-model
created_date: '2025-10-21'
last_updated: '2025-10-21'
version: '1.0'
author: Hive Mind (Claude)
ai_generated: true
related_concepts:
  - weave-nn
related_decisions:
  - ED-1
related_business:
  - value-proposition
  - target-users
  - cost-analysis
tags:
  - business-model
  - pricing
  - saas
  - monetization
  - revenue
type: business
visual:
  icon: 💼
  cssclasses:
    - type-business
    - status-draft
updated_date: '2025-10-28'
icon: 💼
---

# SaaS Pricing Model

Weave-NN's tiered pricing strategy designed to capture value from solo users through enterprise organizations, with clear upgrade paths and feature differentiation.

---

## Pricing Philosophy

**Value-Based Pricing**: Price tiers reflect the business value delivered, not just feature counts. Teams and enterprises see exponentially more value from collaboration and compliance features, justifying higher pricing.

**Land and Expand**: Free tier removes friction for individual adoption, creating bottom-up demand that drives team and enterprise conversions.

**Transparent & Simple**: Clear feature distinctions between tiers. No hidden fees or usage-based surprises.

---

## Pricing Tiers

### Free Tier: Individual Explorer
**Price**: $0/month (forever)

**Target Users**: Solo developers, students, indie hackers, trial users

**Limits**:
- Up to 500 nodes
- 1 workspace
- 100 MB storage
- Basic graph visualization
- Community support only

**Features Included**:
- Markdown editor with wikilink support
- Interactive knowledge graph visualization
- Basic search functionality
- Manual node creation and linking
- Export to markdown/JSON
- Git integration (read-only)

**Conversion Goal**: Drive 15% to Pro tier within 90 days when they hit node limits or want advanced features

---

### Pro Tier: Power User
**Price**: $15/month or $144/year (20% discount)

**Target Users**: Individual knowledge workers, technical writers, active developers managing complex personal knowledge bases

**Limits**:
- Unlimited nodes
- 3 workspaces (personal + 2 projects)
- 10 GB storage
- Priority email support

**Everything in Free, plus**:
- **AI-Powered Features**:
  - Auto-linking suggestions using semantic analysis
  - AI-generated summaries of node clusters
  - Automated tagging based on content
- **Advanced Graph Features**:
  - Temporal queries (view graph at any point in time)
  - Advanced filtering and graph algorithms
  - Custom graph layouts and styling
- **Productivity**:
  - Bidirectional sync with local markdown folders
  - Git integration with full commit/push capability
  - API access for custom integrations
- **Quality**:
  - Node quality scoring
  - Orphaned node detection
  - Link health monitoring

**Upgrade Path**: Convert to Team tier when wanting to collaborate with colleagues

---

### Team Tier: Collaborative Workspace
**Price**: $25/user/month or $240/user/year (20% discount)

**Minimum**: 3 users
**Target Users**: Development teams, documentation teams, product teams, small companies

**Limits**:
- Unlimited nodes per workspace
- Unlimited workspaces
- 50 GB storage per user
- Priority chat support
- 24-hour SLA for critical issues

**Everything in Pro, plus**:
- **Collaboration**:
  - Real-time collaborative editing (multiplayer mode)
  - Shared workspaces with role-based permissions
  - Activity feed showing team member actions
  - Comments and annotations on nodes
- **Team Management**:
  - Admin dashboard for user management
  - Team analytics and usage insights
  - Workspace templates
  - Bulk import/export tools
- **AI Agent Integration**:
  - MCP server integration for AI agent access
  - Automated daily log generation
  - Agent-driven graph building
- **Advanced Features**:
  - Version history with diff viewing
  - Advanced temporal queries across team knowledge
  - Custom metadata fields
  - Webhook integrations

**Upgrade Path**: Convert to Enterprise at 50+ users or when needing compliance features

---

### Enterprise Tier: Organization-Wide Knowledge Graph
**Price**: Custom (starting at $50,000/year for 100 users)

**Target Users**: Large companies (500+ employees), regulated industries, organizations with compliance requirements

**Limits**: Unlimited everything

**Everything in Team, plus**:
- **Security & Compliance**:
  - SSO/SAML authentication
  - SOC2 Type II compliance
  - GDPR-compliant data handling
  - Audit logs with retention
  - Data residency options (US, EU, UK)
- **Enterprise Features**:
  - Dedicated account manager
  - Custom SLA (99.9% uptime guarantee)
  - White-labeling options
  - Advanced analytics and reporting
  - Custom integrations and API rate limits
- **Support**:
  - 24/7 phone and chat support
  - Dedicated Slack channel
  - Quarterly business reviews
  - Custom training and onboarding
- **Deployment Options**:
  - VPC deployment on Google Cloud
  - Bring-your-own-cloud (BYOC) option
  - On-premises deployment (premium add-on)

**Pricing Model**:
- Base platform: $50K/year (up to 100 users)
- Additional users: $40/user/month
- Premium support: +$25K/year
- BYOC/On-prem: +$100K/year

---

## Feature Comparison Matrix

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| **Storage** | 100 MB | 10 GB | 50 GB/user | Unlimited |
| **Nodes** | 500 | Unlimited | Unlimited | Unlimited |
| **Workspaces** | 1 | 3 | Unlimited | Unlimited |
| **Users per workspace** | 1 | 1 | Unlimited | Unlimited |
| **Graph visualization** | Basic | Advanced | Advanced | Custom |
| **Temporal queries** | - | ✓ | ✓ | ✓ |
| **AI auto-linking** | - | ✓ | ✓ | ✓ |
| **AI summaries** | - | ✓ | ✓ | ✓ |
| **Real-time collaboration** | - | - | ✓ | ✓ |
| **MCP integration** | - | - | ✓ | ✓ |
| **Version history** | - | 7 days | 90 days | Unlimited |
| **API access** | - | 100 req/day | 10K req/day | Unlimited |
| **SSO/SAML** | - | - | - | ✓ |
| **Audit logs** | - | - | - | ✓ |
| **SLA guarantee** | - | - | 24hr response | 99.9% uptime |
| **Support** | Community | Email | Priority chat | 24/7 phone |

---

## Revenue Projections

### Year 1 Target (Launch + 12 months)
- 5,000 Free users
- 500 Pro users @ $15/month = $7.5K MRR
- 100 Team users (20 teams @ 5 users avg) @ $25/user = $12.5K MRR
- 2 Enterprise deals @ $50K/year = $8.3K MRR
**Total Y1**: $28.3K MRR ($340K ARR)

### Year 2 Target
- 20,000 Free users
- 2,000 Pro users = $30K MRR
- 500 Team users (100 teams) = $62.5K MRR
- 10 Enterprise deals = $41.7K MRR
**Total Y2**: $134.2K MRR ($1.6M ARR)

### Year 3 Target
- 50,000 Free users
- 5,000 Pro users = $75K MRR
- 2,000 Team users (400 teams) = $250K MRR
- 30 Enterprise deals = $125K MRR
**Total Y3**: $450K MRR ($5.4M ARR)

---

## Pricing Strategy Rationale

### Why Free Tier Matters
- **Product-Led Growth**: Users experience value before paying, reducing acquisition costs
- **Viral Loop**: Free users share graphs publicly, driving organic discovery
- **Enterprise Pipeline**: Individual users inside companies create bottom-up demand
- **Market Education**: Free tier helps establish "knowledge graph management" as a category

### Pro Tier Pricing ($15/month)
- **Competitive Positioning**: Below Notion ($10-15), above Obsidian Sync ($10), in line with Roam ($15)
- **Psychological Pricing**: $15 is impulse-buy territory for knowledge workers
- **Value Anchoring**: 10GB storage + unlimited nodes + AI features justifies premium over free

### Team Tier Pricing ($25/user/month)
- **Collaboration Premium**: 67% markup over Pro reflects exponential value of team features
- **Competitive**: Below Notion ($15-25/user), Confluence ($5.75-10/user but limited features)
- **Volume Incentive**: Annual billing discount encourages long-term commitments

### Enterprise Custom Pricing
- **Value-Based**: Large organizations extract massive value from institutional knowledge preservation
- **Negotiation Room**: Custom pricing allows deals based on specific customer needs
- **Service Bundle**: Includes support, compliance, and deployment services worth $50K+ alone

---

## Go-To-Market Pricing Tactics

### Launch Strategy (Months 1-6)
- **Beta Discount**: 50% off Pro/Team tiers for first 100 customers (lifetime discount)
- **Founder's Circle**: First 10 enterprise customers get custom pricing ($25K minimum)
- **Free → Pro Conversion**: Automated emails when users hit 400 nodes (80% of limit)

### Growth Phase (Months 7-18)
- **Annual Prepay Incentive**: 20% discount encourages cash flow and reduces churn
- **Team Referrals**: Pro users get 1 month free for each team they refer
- **Usage-Based Upsells**: Offer storage add-ons ($5/month per 10GB) before forcing tier upgrades

### Scale Phase (18+ months)
- **Usage Analytics**: Add optional usage-based pricing for very large teams (500+ users)
- **Platform Partnerships**: White-label offering for DevOps platforms (GitLab, GitHub)
- **Industry Packaging**: Specialized pricing for education, healthcare, government

---

## Pricing Evolution Plan

**Phase 1 (MVP)**: Free + Pro only to validate willingness to pay
**Phase 2 (6 months)**: Add Team tier when collaboration features ship
**Phase 3 (12 months)**: Launch Enterprise tier with SSO and compliance
**Phase 4 (18+ months)**: Consider usage-based components for compute-intensive AI features

---

## Risk Mitigation

### Price Sensitivity Risk
- **Mitigation**: Generous free tier + 14-day Pro trial reduces friction
- **Monitoring**: Track conversion rates and survey users who downgrade

### Competitive Pricing Pressure
- **Mitigation**: Differentiate on AI-native features unavailable in competitors
- **Monitoring**: Quarterly competitive pricing analysis

### Enterprise Sales Cycle Risk
- **Mitigation**: Bottom-up adoption creates internal champions before enterprise deals
- **Monitoring**: Track time from first Pro user to enterprise conversation at companies

---

## Related

- [[cost-analysis|Cost & Revenue Analysis]] - Infrastructure costs and break-even analysis
- [[target-users|Target Users]] - Persona mapping to pricing tiers
- [[value-proposition|Value Proposition]] - Features justifying pricing
- [[../decisions/executive/project-scope|ED-1: Project Scope]] - SaaS decision
- [[../features/user-permissions|User Permissions]] - Role-based access for Team tier

---

**Back to**: [[../README|Main Index]] | [[README|Business Hub]]
