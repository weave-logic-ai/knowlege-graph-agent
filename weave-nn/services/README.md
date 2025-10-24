---
type: index
title: "External Services Hub"
status: active
created_date: "2025-10-23"
cssclasses:
  - index
  - navigation
  - services

tags:
  - index
  - services
  - navigation
  - external-apis
---

# Services Directory

**CRITICAL**: This directory documents EXTERNAL third-party APIs and SaaS platforms that our system consumes.

---

## 🎯 What IS a Service?

A **Service** in this directory represents:

1. **External Third-Party API** - Hosted and maintained by another company
2. **SaaS Platform** - Software-as-a-Service we subscribe to and use via API
3. **Cloud Provider** - Infrastructure services we consume (AWS, GCP, Azure)
4. **Managed Platform** - External systems we integrate with but don't self-host

### Key Question: "Who hosts and maintains this?"

- **External Service** (this directory) → "They host it, we call their API"
- **Technical Service** (technical/services/) → "We host it, we maintain it"

---

## 🔍 Core Characteristics

### What Makes Something a "Service" (This Directory)?

1. **External Ownership**
   - Hosted by third party (Anthropic, OpenAI, GitHub, etc.)
   - We have no control over infrastructure
   - We pay for usage/subscription
   - They handle availability, scaling, maintenance

2. **API-Based Integration**
   - We interact via REST API, GraphQL, SDK, webhook
   - Authentication via API keys, OAuth, tokens
   - Rate limits and quotas imposed by provider
   - Documented in their external documentation

3. **Business Relationship**
   - Vendor/customer relationship
   - SLA and support agreements
   - Pricing tiers and billing
   - Terms of service we must follow

4. **No Infrastructure Control**
   - Cannot SSH into their servers
   - Cannot modify their source code
   - Cannot change their deployment
   - Limited to their API capabilities

---

## 🚧 Scope Boundaries

### What BELONGS Here (✅)

**External APIs and SaaS platforms we consume:**
- Claude API by Anthropic → `/services/ai/claude-api.md`
- OpenAI GPT API → `/services/ai/openai-api.md`
- GitHub API → `/services/developer/github-api.md`
- Supabase Cloud → `/services/cloud/supabase.md`
- AWS Services (S3, Lambda) → `/services/cloud/aws.md`
- Stripe Payment API → `/services/cloud/stripe.md`
- SendGrid Email API → `/services/collaboration/sendgrid.md`
- Slack API → `/services/collaboration/slack.md`
- Datadog Monitoring → `/services/developer/datadog.md`

### What DOES NOT Belong Here (❌)

**Self-hosted services:**
- PostgreSQL database we run → `/technical/services/postgresql.md`
- RabbitMQ we deploy → `/technical/services/rabbitmq.md`
- Redis we manage → `/technical/services/redis.md`
- Nginx we configure → `/technical/services/nginx.md`

**Technical frameworks:**
- FastAPI (Python framework) → `/technical/frameworks/fastapi.md`
- React (frontend framework) → `/technical/frameworks/react.md`
- Express.js (Node framework) → `/technical/frameworks/expressjs.md`

**Integration implementations:**
- How we connect Obsidian to Claude → `/integrations/ai/obsidian-claude.md`
- How we sync GitHub with Slack → `/integrations/developer/github-slack.md`

**Technical concepts:**
- REST API design patterns → `/technical/patterns/rest-api.md`
- Authentication patterns → `/technical/patterns/authentication.md`
- Message queue concepts → `/technical/patterns/message-queues.md`

---

## 📂 Directory Structure

```
/services/
├── README.md (this file)
│
├── ai/                      # AI/ML APIs and platforms
│   ├── claude-api.md        # Anthropic Claude API
│   ├── openai-api.md        # OpenAI GPT/DALL-E APIs
│   ├── huggingface-api.md   # HuggingFace inference API
│   └── elevenlabs-api.md    # ElevenLabs voice synthesis
│
├── cloud/                   # Cloud infrastructure services
│   ├── aws.md               # AWS services (S3, Lambda, etc.)
│   ├── gcp.md               # Google Cloud Platform
│   ├── azure.md             # Microsoft Azure
│   ├── supabase.md          # Supabase (auth, database, storage)
│   ├── vercel.md            # Vercel deployment platform
│   ├── stripe.md            # Stripe payment processing
│   └── cloudflare.md        # Cloudflare CDN/DNS
│
├── collaboration/           # Communication and collaboration platforms
│   ├── slack-api.md         # Slack messaging API
│   ├── discord-api.md       # Discord bot API
│   ├── sendgrid.md          # SendGrid email service
│   ├── twilio.md            # Twilio SMS/voice API
│   └── notion-api.md        # Notion API for docs
│
└── developer/               # Developer tools and platforms
    ├── github-api.md        # GitHub REST/GraphQL API
    ├── gitlab-api.md        # GitLab API
    ├── datadog.md           # Datadog monitoring
    ├── sentry.md            # Sentry error tracking
    └── postman.md           # Postman API testing
```

---

## 🎨 Categories Explained

### 1. `/ai/` - AI and Machine Learning Services

**External AI APIs and ML platforms:**
- Large Language Model APIs (Claude, GPT, LLaMA)
- Computer Vision APIs (image recognition, generation)
- Speech/Audio APIs (transcription, synthesis)
- ML model hosting platforms

**Examples:**
- Anthropic Claude API for text generation
- OpenAI GPT-4 and DALL-E
- HuggingFace inference endpoints
- Google Cloud Vision API

**Not included:**
- ML frameworks we use (TensorFlow → technical/frameworks/)
- Self-hosted ML models (→ technical/services/ml-inference.md)

---

### 2. `/cloud/` - Cloud Infrastructure Services

**External cloud platforms and managed services:**
- Cloud compute and storage (AWS, GCP, Azure)
- Serverless platforms (Vercel, Netlify)
- Backend-as-a-Service (Supabase, Firebase)
- Payment processing (Stripe, PayPal)
- CDN and DNS (Cloudflare, Fastly)

**Examples:**
- AWS S3 for file storage
- Supabase for auth and database
- Stripe for payment processing
- Vercel for frontend deployment

**Not included:**
- Self-hosted cloud infrastructure (Kubernetes → technical/services/)
- Cloud design patterns (→ technical/patterns/cloud-architecture.md)

---

### 3. `/collaboration/` - Communication and Collaboration Services

**External platforms for communication:**
- Messaging and chat (Slack, Discord)
- Email services (SendGrid, Mailgun)
- SMS and voice (Twilio, Vonage)
- Documentation platforms (Notion, Confluence)
- Video conferencing (Zoom API, Teams API)

**Examples:**
- Slack API for team notifications
- SendGrid for transactional emails
- Twilio for SMS alerts
- Notion API for documentation sync

**Not included:**
- Self-hosted chat (Mattermost → technical/services/)
- Communication protocols (WebSocket → technical/protocols/)

---

### 4. `/developer/` - Developer Tools and Platforms

**External developer services and tools:**
- Version control platforms (GitHub, GitLab)
- CI/CD platforms (CircleCI, Travis CI)
- Monitoring and observability (Datadog, New Relic)
- Error tracking (Sentry, Rollbar)
- API testing (Postman, Insomnia)
- Package registries (npm, PyPI APIs)

**Examples:**
- GitHub API for repository management
- Datadog for application monitoring
- Sentry for error tracking
- CircleCI for continuous integration

**Not included:**
- Self-hosted CI/CD (Jenkins → technical/services/)
- Development tools we run locally (→ technical/tools/)

---

## 📝 When to CREATE a Service Document

### Decision Criteria

Create a service document when:

1. **External API Integration**
   - [ ] We call an external third-party API
   - [ ] API requires authentication (API keys, OAuth)
   - [ ] External service has its own status page
   - [ ] We pay for usage or subscription

2. **Business Dependency**
   - [ ] Service outage affects our system
   - [ ] We monitor service status/availability
   - [ ] SLA or support agreement exists
   - [ ] Multiple teams use this service

3. **Configuration Required**
   - [ ] API keys or credentials needed
   - [ ] Environment-specific endpoints
   - [ ] Rate limits or quotas to manage
   - [ ] SDK or client library to configure

4. **Documentation Value**
   - [ ] Setup instructions needed
   - [ ] API usage patterns to document
   - [ ] Common issues and troubleshooting
   - [ ] Multiple integration points

### When NOT to Create (Use Other Directories)

- **Self-hosted service** → `/technical/services/`
- **Framework or library** → `/technical/frameworks/` or `/technical/libraries/`
- **Integration implementation** → `/integrations/`
- **Technical pattern** → `/technical/patterns/`
- **Internal API** → `/technical/api/`

---

## 📋 Template Structure

Each service document should follow this structure:

```markdown
---
title: Service Name API
provider: Company Name
category: ai | cloud | collaboration | developer
status: active | deprecated | evaluating
tier: free | paid | enterprise
api_type: REST | GraphQL | gRPC | WebSocket
authentication: api_key | oauth2 | jwt
rate_limits: "X requests/minute"
documentation_url: https://docs.service.com
status_page: https://status.service.com
support: support@service.com
cost: "$X/month" or "Usage-based"
alternatives:
  - Alternative Service 1
  - Alternative Service 2
---

# Service Name API

**One-line description of what this external service provides.**

## Overview

Brief description of:
- What this external service does
- Why we use it
- When we use it
- Business value it provides

## Provider Information

- **Company**: Company Name
- **Service**: Specific service/product name
- **Plan**: Free/Starter/Pro/Enterprise
- **Account Owner**: team@company.com
- **Status Page**: https://status.service.com

## API Details

### Authentication

How we authenticate with this external API:
- API key storage (environment variables)
- OAuth flow (if applicable)
- Token management
- Credential rotation policy

### Endpoints Used

Primary endpoints we integrate with:
```
GET  https://api.service.com/v1/resource
POST https://api.service.com/v1/action
```

### Rate Limits

- **Requests**: X per minute/hour/day
- **Quotas**: Monthly limits
- **Throttling**: How we handle rate limits
- **Monitoring**: How we track usage

## Integration Points

Where in our system we call this external API:

1. **Component A** (`/src/services/service-client.py`)
   - Purpose: What it does
   - Endpoints: Which API endpoints
   - Frequency: How often

2. **Component B** (`/src/workers/service-sync.py`)
   - Purpose: Background synchronization
   - Schedule: Cron pattern or event trigger

## Configuration

### Environment Variables

```bash
SERVICE_API_KEY=xxx          # API authentication key
SERVICE_BASE_URL=https://... # API base URL
SERVICE_TIMEOUT=30           # Request timeout (seconds)
SERVICE_RETRY_COUNT=3        # Number of retries
```

### SDK/Client Setup

```python
# Example initialization
from service_sdk import Client

client = Client(
    api_key=os.getenv('SERVICE_API_KEY'),
    timeout=30
)
```

## Usage Patterns

### Common Use Cases

**1. Primary Use Case**
```python
# Example code showing how we use this API
response = client.action(params)
```

**2. Secondary Use Case**
```python
# Another example
data = client.fetch(resource_id)
```

## Error Handling

### Common Errors

- **401 Unauthorized**: Invalid API key → Check credentials
- **429 Too Many Requests**: Rate limit → Implement backoff
- **503 Service Unavailable**: Service down → Check status page

### Retry Strategy

```python
# How we handle failures
@retry(max_attempts=3, backoff=exponential)
def call_service():
    return client.request()
```

## Monitoring

### Health Checks

- **Status Page**: https://status.service.com
- **Internal Monitoring**: Datadog dashboard link
- **Alerts**: PagerDuty policy

### Usage Tracking

- **Metrics**: Requests/day, error rate, latency
- **Costs**: Monthly spending dashboard
- **Quotas**: Remaining limits

## Cost Management

- **Pricing Model**: Per request / per user / flat rate
- **Current Usage**: X requests/month
- **Monthly Cost**: $X (as of YYYY-MM)
- **Optimization**: Strategies to reduce costs

## Troubleshooting

### Issue: Service Timeout

**Symptoms**: Requests taking > 30 seconds
**Diagnosis**: Check status page, verify network
**Resolution**: Implement retry with exponential backoff

### Issue: Rate Limit Exceeded

**Symptoms**: 429 errors in logs
**Diagnosis**: Check request rate in monitoring
**Resolution**: Implement request queuing/throttling

## Alternatives

Services we considered or can migrate to:

| Service | Pros | Cons | Migration Effort |
|---------|------|------|------------------|
| Alt 1   | ... | ... | Low/Medium/High |
| Alt 2   | ... | ... | Low/Medium/High |

## Security Considerations

- **API Key Storage**: Environment variables, secrets manager
- **Data Privacy**: What data we send to this service
- **Compliance**: GDPR, SOC2 requirements
- **Encryption**: TLS version, data encryption

## Related Documentation

- **Official Docs**: https://docs.service.com
- **Our Integration Guide**: `/integrations/.../service-integration.md`
- **Technical Implementation**: `/technical/services/service-client.md` (if we built wrapper)
- **Runbooks**: `/ops/runbooks/service-incidents.md`

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-15 | Initial integration | @user |
| 2025-02-01 | Upgraded to Pro tier | @user |
```

---

## 🎯 Good vs Bad Examples

### ✅ GOOD Examples

**1. Claude API (Anthropic)**
```markdown
---
title: Claude API
provider: Anthropic
category: ai
status: active
tier: paid
api_type: REST
authentication: api_key
---

# Claude API

External AI API for large language model interactions.

## Overview

Anthropic's Claude API provides access to the Claude family of LLMs.
We use this for code generation, documentation, and chat features.

## API Details

### Authentication
```bash
ANTHROPIC_API_KEY=sk-ant-xxx
```

### Endpoints Used
- `POST /v1/messages` - Chat completions
- `POST /v1/complete` - Text completion

### Rate Limits
- 4,000 requests/minute (Pro tier)
- 300,000 tokens/minute

## Integration Points

1. **Chat Interface** (`/src/chat/claude-client.py`)
   - Real-time chat with Claude
   - Streaming responses

2. **Code Generation** (`/src/codegen/claude-coder.py`)
   - Automated code generation
   - Batch processing
```

**Why this is GOOD:**
- Clear external service (Anthropic hosts)
- API-based integration
- Authentication and rate limits documented
- Business relationship (paid tier)

---

**2. GitHub API**
```markdown
---
title: GitHub API
provider: GitHub (Microsoft)
category: developer
status: active
tier: enterprise
api_type: REST, GraphQL
authentication: oauth2, token
---

# GitHub API

External API for GitHub repository management and automation.

## Overview

GitHub's REST and GraphQL APIs for repository operations,
issue tracking, PR management, and workflow automation.

## Provider Information

- **Account**: weave-nn organization
- **Plan**: GitHub Enterprise Cloud
- **Admin**: devops@company.com

## API Details

### Authentication
- Personal Access Tokens (PAT)
- GitHub App authentication
- OAuth2 for user actions

### Endpoints Used
- REST: `https://api.github.com`
- GraphQL: `https://api.github.com/graphql`

## Integration Points

1. **CI/CD Pipeline** (`/.github/workflows/deploy.yml`)
   - Automated deployments on push
   - Status checks and PR automation

2. **Issue Tracker Sync** (`/src/integrations/github-sync.py`)
   - Sync GitHub issues to internal system
   - Webhook-based updates
```

**Why this is GOOD:**
- External platform (GitHub hosts)
- Multiple integration points
- Enterprise relationship documented
- Both REST and GraphQL usage

---

### ❌ BAD Examples

**1. PostgreSQL (Self-Hosted Database)**

```markdown
# ❌ WRONG LOCATION: services/cloud/postgresql.md

This should be: technical/services/postgresql.md

Why? We host and maintain PostgreSQL ourselves.
It's not an external cloud service.
```

**2. FastAPI (Python Framework)**

```markdown
# ❌ WRONG LOCATION: services/developer/fastapi.md

This should be: technical/frameworks/fastapi.md

Why? FastAPI is a framework we use, not an external API.
We run FastAPI in our infrastructure.
```

**3. Obsidian-Claude Integration**

```markdown
# ❌ WRONG LOCATION: services/ai/obsidian-claude.md

This should be: integrations/ai/obsidian-claude.md

Why? This describes HOW we integrate two tools,
not the external service itself.
Claude API would be in services/ai/claude-api.md
```

**4. REST API Design**

```markdown
# ❌ WRONG LOCATION: services/api/rest-patterns.md

This should be: technical/patterns/rest-api.md

Why? This is a technical pattern/concept,
not an external service we consume.
```

---

## 🔗 Service Integration Patterns

### Pattern 1: Client Wrapper

**When**: Multiple components need to call the same external API

```
/services/ai/claude-api.md          # External service docs
/technical/services/claude-client.md # Our wrapper implementation
/src/services/claude_client.py       # Actual code
```

### Pattern 2: Event-Driven Integration

**When**: External service sends webhooks

```
/services/developer/github-api.md       # External service docs
/integrations/developer/github-webhooks.md # Integration implementation
/src/webhooks/github_handler.py          # Webhook receiver
```

### Pattern 3: Data Sync

**When**: Periodic sync with external service

```
/services/collaboration/notion-api.md  # External service docs
/integrations/docs/notion-sync.md      # Sync implementation
/src/workers/notion_sync.py             # Sync worker
```

---

## 🔍 Quick Reference: Is This a Service?

| Question | If YES | If NO |
|----------|--------|-------|
| Do they host it? | ✅ Service | ❌ Technical |
| Do we pay them? | ✅ Service | ❌ Maybe technical |
| Is there an API key? | ✅ Service | ❌ Maybe framework |
| Can we SSH into it? | ❌ Technical | ✅ Service |
| Do they have a status page? | ✅ Service | ❌ Technical |
| Is it in our docker-compose? | ❌ Technical | ✅ Service |

---

## 📊 Service Lifecycle

### 1. Evaluation Phase

Create document with:
- `status: evaluating`
- Proof of concept results
- Cost analysis
- Alternative comparison

### 2. Active Phase

Update document with:
- `status: active`
- Production configuration
- Integration points
- Monitoring setup

### 3. Deprecation Phase

Update document with:
- `status: deprecated`
- Migration plan
- Sunset date
- Alternative service

---

## 🎓 Learning Resources

### Understanding External Services

1. **What makes a service "external"?**
   - Hosted by third party
   - Accessed via API
   - SLA and support from provider

2. **Service vs Framework**
   - Service: They run it (GitHub, Claude)
   - Framework: We run it (FastAPI, React)

3. **Service vs Integration**
   - Service: What it is (Slack API)
   - Integration: How we use it (Slack notifications)

### Best Practices

1. **Document External Dependencies**
   - Every external API should have a service doc
   - Keep API keys and configs documented
   - Monitor service health and costs

2. **Plan for Failures**
   - External services can go down
   - Document retry strategies
   - Have alternatives identified

3. **Manage Costs**
   - Track API usage and costs
   - Optimize request patterns
   - Review pricing regularly

---

## 🤝 Related Directories

| Directory | Purpose | Relationship |
|-----------|---------|--------------|
| `/technical/services/` | Self-hosted services | Services we run vs they run |
| `/integrations/` | Integration implementations | How we connect to these services |
| `/technical/frameworks/` | Development frameworks | Tools we use vs services we call |
| `/technical/api/` | Our internal APIs | APIs we build vs APIs we consume |

---

## 📈 Metrics and Monitoring

### Service Health Dashboard

Track for each external service:
- **Availability**: Uptime percentage
- **Latency**: Response times
- **Error Rate**: Failed requests
- **Cost**: Monthly spending
- **Quota Usage**: Rate limit consumption

### Alerting Rules

- Service outage detected
- Rate limit approaching
- Elevated error rate
- Cost threshold exceeded
- Quota nearly exhausted

---

## 🔐 Security Best Practices

1. **Credential Management**
   - Store API keys in secrets manager
   - Rotate credentials regularly
   - Never commit keys to git
   - Use environment-specific keys

2. **API Key Permissions**
   - Principle of least privilege
   - Separate keys for dev/staging/prod
   - Monitor key usage
   - Revoke unused keys

3. **Data Privacy**
   - Know what data you send to external services
   - Review privacy policies
   - Implement data sanitization
   - Comply with GDPR/CCPA

---

## ✅ Service Documentation Checklist

When documenting a new external service:

- [ ] Service name and provider clearly identified
- [ ] Business relationship documented (tier, cost)
- [ ] Authentication method explained
- [ ] API endpoints and rate limits documented
- [ ] Integration points mapped to codebase
- [ ] Configuration and environment variables listed
- [ ] Error handling and retry strategy defined
- [ ] Monitoring and alerting configured
- [ ] Security considerations addressed
- [ ] Alternative services evaluated
- [ ] Related documentation linked

---

## 🎯 Summary

**Services Directory Purpose:**
Document external third-party APIs and SaaS platforms that our system depends on.

**Key Principle:**
If they host it and we call their API, it's a service.

**Four Categories:**
1. **AI** - ML/AI APIs (Claude, GPT)
2. **Cloud** - Infrastructure (AWS, Supabase)
3. **Collaboration** - Communication (Slack, SendGrid)
4. **Developer** - Dev tools (GitHub, Datadog)

**Not Included:**
- Self-hosted services → `/technical/services/`
- Frameworks → `/technical/frameworks/`
- Integrations → `/integrations/`
- Patterns → `/technical/patterns/`

---

*Last updated: 2025-10-23*
