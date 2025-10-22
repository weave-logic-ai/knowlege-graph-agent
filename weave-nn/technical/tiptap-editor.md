---
tech_id: tiptap-editor
category: frontend-library
maturity: stable
pros:
  - Headless architecture for full customization
  - Rich extension ecosystem
  - Framework-agnostic core
  - Markdown and collaborative editing support
cons:
  - Requires UI implementation
  - Collaborative features need backend infrastructure
  - Complex extension development
use_case: Customizable rich text editing with markdown and extensibility
---

# Tiptap Editor

Tiptap is a headless, framework-agnostic rich text editor built on ProseMirror. It provides the editing logic and document model while leaving the UI presentation entirely to developers, enabling highly customized editing experiences that match application design systems.

## What It Does

Tiptap manages document editing state, content manipulation, and editing behaviors through a plugin-based architecture. It handles markdown parsing and serialization, supports collaborative editing through CRDT integration, and provides a rich extension system for custom nodes, marks, and behaviors. The editor works with React, Vue, Svelte, or vanilla JavaScript, abstracting ProseMirror's complexity behind a cleaner API.

## Why Consider It

For knowledge management and note-taking applications, editing experience is fundamental. Tiptap enables sophisticated editing features while maintaining complete design control. Unlike WYSIWYG editors with opinionated UIs, Tiptap's headless architecture means your editor can seamlessly integrate with your application's visual language.

The markdown support is particularly valuable for technical knowledge bases, allowing users to work in familiar syntax while providing rich preview and manipulation. Extensions enable domain-specific features like custom node types for knowledge linking, embedded visualizations, or specialized formatting.

## Trade-offs

Headless architecture means more initial development work compared to complete editors like Quill or TinyMCE. You implement all UI components, though Tiptap provides framework-specific starter kits. This investment pays off in customization freedom but requires frontend development resources.

Collaborative editing requires infrastructure beyond the editor itself (WebSocket servers, conflict resolution, persistence). Tiptap integrates with solutions like Y.js but doesn't provide the backend.

ProseMirror's underlying complexity occasionally surfaces in advanced extension development, requiring deeper framework understanding for sophisticated customization.

## Related Decisions

- **[Decision: Text Editor]** - Tiptap vs Quill vs Monaco vs plain textarea
- **[Decision: Markdown Strategy]** - How markdown fits into the content model
- **[Decision: Collaborative Editing]** - Real-time collaboration architecture and infrastructure
