---
tech_id: daisyui
category: component-library
maturity: stable
pros:
  - Framework-agnostic (works with React, Svelte, Vue)
  - Semantic HTML with class-based styling
  - Built-in themes and dark mode
  - Zero JavaScript dependency
  - Fast prototyping with pre-styled components
cons:
  - Less customizable than shadcn/ui approach
  - Requires Tailwind CSS
  - Limited to CSS capabilities (no complex interactions)
  - Theme system can conflict with custom designs
use_case: Rapid UI development with pre-built themes across any framework
---

# DaisyUI

DaisyUI is a component library built on [[technical/tailwindcss|Tailwind CSS]] that provides semantic class names for common UI components. Unlike JavaScript component libraries, it's pure CSS, making it framework-agnostic and compatible with [[technical/nextjs|Next.js]], [[technical/sveltekit|SvelteKit]], Vue, or vanilla HTML.

## What It Does

DaisyUI extends Tailwind with component classes like `btn`, `card`, `modal`, `navbar`, and `dropdown`. It includes multiple pre-built themes, automatic dark mode, and color customization through CSS variables. The library handles component styling while you manage behavior through framework-specific JavaScript. Theme switching is built-in via data attributes.

## Why Consider It

For projects requiring rapid prototyping or supporting multiple frameworks, DaisyUI's CSS-only approach provides flexibility. A [[technical/sveltekit|SvelteKit]] application gets the same components as [[technical/nextjs|Next.js]] without React-specific dependencies. The built-in themes offer professional designs immediately, accelerating MVP development.

The semantic class approach makes HTML cleaner than raw Tailwind utilities. Components like `<button class="btn btn-primary">` are more readable than utility chains. For knowledge graph applications needing consistent UI across different interaction contexts, DaisyUI's theme system ensures coherence.

## Trade-offs

DaisyUI's pre-built themes mean less granular control than [[technical/shadcn-ui|shadcn/ui]]'s component ownership. Customization works through theme variables rather than direct code modification. Complex interactions still require JavaScript, so you're combining DaisyUI styling with custom behavior code.

[[technical/shadcn-ui|shadcn/ui]] offers deeper customization and includes JavaScript behavior, but locks you into React. Material-UI and similar libraries provide more complex components but with framework and bundle size overhead. DaisyUI occupies a middle ground: faster than building from scratch, more flexible than React libraries, but less powerful than full component frameworks.

## Related Decisions

- **[Decision: Frontend Framework]** - Works with both Next.js and SvelteKit
- **[Decision: Component Library]** - DaisyUI vs shadcn/ui vs custom components
- **[Decision: Styling Approach]** - Requires Tailwind CSS foundation
- **[Decision: Theme System]** - Built-in theme switching vs custom implementation
- **[Decision: Prototyping Speed]** - Trade-offs between speed and customization
