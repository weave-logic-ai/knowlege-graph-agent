---
tech_id: stripe
category: payment-processing
maturity: stable
pros:
  - Industry-leading payment infrastructure
  - Comprehensive subscription management
  - Excellent developer experience and documentation
  - PCI compliance handled automatically
  - Rich API for billing automation
cons:
  - Transaction fees (2.9% + 30 cents typical)
  - Complexity for simple use cases
  - Vendor lock-in for billing logic
  - International support varies by region
use_case: SaaS subscription billing and payment processing
---

# Stripe

Stripe is a payment processing platform providing APIs for accepting payments, managing subscriptions, and handling complex billing scenarios. It abstracts the complexity of payment gateways, PCI compliance, and financial regulations while offering fine-grained control over pricing models and customer experiences.

## What It Does

Stripe handles credit card processing, subscription billing, invoicing, and revenue recognition. It supports one-time payments, recurring subscriptions, usage-based billing, and hybrid models. The platform includes customer portal for self-service subscription management, webhook events for automation, and tax calculation for global sales. Stripe Checkout provides hosted payment pages, while Elements offers embeddable form components for custom UIs.

## Why Consider It

For SaaS knowledge management platforms with tiered pricing models, Stripe simplifies subscription complexity. You can implement freemium tiers, usage-based pricing (per graph node or document), seat-based billing for teams, and trial periods without building custom billing logic. The customer portal lets users manage subscriptions, view invoices, and update payment methods without support intervention.

Stripe's webhook events enable feature gating based on subscription status. When a customer upgrades, your application automatically unlocks advanced features. The platform handles payment failures, dunning management, and revenue recovery. For [[technical/nextjs|Next.js]] and [[technical/sveltekit|SvelteKit]] applications, official libraries simplify integration.

## Trade-offs

Stripe's transaction fees are unavoidable costs. For high-volume businesses, negotiated rates or alternative processors might reduce expenses. The platform's complexity can be overwhelming for simple "one-time payment" scenarios where PayPal or basic payment buttons suffice.

Alternatives like Paddle offer merchant-of-record services, handling sales tax globally but with less flexibility. Chargebee specializes in subscription management with similar capabilities. Lemonsqueezy provides simpler pricing for digital products. However, Stripe's ecosystem, reliability, and feature breadth make it the default choice for most SaaS applications.

## Related Decisions

- **[Decision: Monetization Strategy]** - Subscription tiers and pricing models
- **[Decision: Payment Provider]** - Stripe vs Paddle vs alternatives
- **[Decision: Feature Gating]** - Subscription-based access control implementation
- **[Decision: Billing Automation]** - Usage-based vs seat-based vs tiered pricing
- **[Decision: Customer Self-Service]** - Stripe Customer Portal integration
