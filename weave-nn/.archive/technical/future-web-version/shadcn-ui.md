---
tech_id: shadcn-ui
category: component-library
maturity: stable
pros:
  - Copy-paste components you own and control
  - Built on Radix UI primitives (accessibility)
  - Fully customizable with Tailwind
  - TypeScript-first with excellent DX
  - No package dependency bloat
cons:
  - React-only (requires Next.js or similar)
  - Manual updates (copy-paste model)
  - Requires Tailwind CSS setup
  - Less suitable for rapid prototyping
use_case: Production React apps needing accessible, customizable components
---

# shadcn/ui

shadcn/ui is a collection of re-usable React components built on Radix UI primitives and styled with [[technical/tailwindcss|Tailwind CSS]]. Unlike traditional component libraries, you copy components directly into your codebase, giving you full ownership and customization control without package dependencies.

## What It Does

shadcn/ui provides a CLI that copies pre-built, accessible components into your project. Components include forms, dialogs, dropdowns, tabs, command palettes, and data tables. Each component uses Radix UI for behavior and accessibility, with Tailwind for styling. You modify the copied code directly rather than fighting library props or theme APIs. The library includes hooks, utilities, and patterns for common UI needs.

## Why Consider It

For SaaS applications requiring professional, accessible interfaces without design constraints, shadcn/ui accelerates development while maintaining flexibility. The copy-paste model means no version lock-in, dependency conflicts, or black-box components. For knowledge graph applications, components like Command (search palette), Dialog (node details), and Tabs (document sections) are production-ready.

The [[technical/nextjs|Next.js]] ecosystem integration is first-class, with Server Component support and TypeScript throughout. Radix UI handles complex accessibility requirements (keyboard nav, ARIA, focus management) that are time-consuming to implement correctly.

## Trade-offs

The copy-paste approach means updates aren't automatic like npm packages. When shadcn/ui improves a component, you manually copy changes. For rapid prototyping where speed trumps customization, [[technical/daisyui|DaisyUI]]'s CSS class approach is faster.

Traditional libraries like Material-UI or Ant Design offer broader component sets and automatic updates but limit customization. shadcn/ui is React-specific; Svelte applications need different solutions. The trade-off is ownership and control versus convenience and automatic maintenance.

## Related Decisions

- **[Decision: Frontend Framework]** - Requires React/Next.js ecosystem
- **[Decision: Component Library]** - shadcn/ui vs DaisyUI vs Material-UI
- **[Decision: Styling Approach]** - Requires Tailwind CSS setup
- **[Decision: Accessibility Requirements]** - Radix UI provides WCAG compliance
- **[Decision: Design Customization]** - How much UI flexibility is needed
