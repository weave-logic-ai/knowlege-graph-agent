import type { VaultTemplate, NodeTemplate, DirectoryStructure } from './types.js';

/**
 * Next.js vault template with modern App Router structure
 */

const directories: DirectoryStructure = {
  concepts: {
    description: 'High-level architectural concepts and design patterns',
    children: {
      'app-router': 'Next.js App Router architecture',
      'server-components': 'React Server Components patterns',
      'data-fetching': 'Data fetching strategies',
      'routing': 'Routing and navigation concepts',
    },
  },
  technical: {
    description: 'Technical implementation details and documentation',
    children: {
      'components': 'Reusable UI component specifications',
      'api-routes': 'API route handlers and endpoints',
      'middleware': 'Middleware functions and utilities',
      'database': 'Database schemas and operations',
      'auth': 'Authentication and authorization',
    },
  },
  features: {
    description: 'Feature-specific knowledge and requirements',
    children: {
      'user-management': 'User-related features',
      'dashboard': 'Dashboard and analytics features',
      'settings': 'Application settings',
    },
  },
};

const nodeTemplates: Record<string, NodeTemplate> = {
  'component': {
    type: 'technical',
    description: 'React component specification',
    frontmatter: {
      type: 'component',
      status: 'draft',
      tags: ['component', 'ui'],
      framework: 'nextjs',
    },
    contentTemplate: `# {{nodeName}}

## Overview
{{#if description}}
{{description}}
{{else}}
A reusable component for the {{projectName}} application.
{{/if}}

## Component Type
- [ ] Server Component
- [ ] Client Component
- [ ] Shared Component

## Props Interface
\`\`\`typescript
interface {{nodeName}}Props {
  // Define props here
}
\`\`\`

## Implementation Notes
- Uses Next.js App Router conventions
- Follows React best practices
- Implements proper TypeScript types

## Usage Example
\`\`\`tsx
import { {{nodeName}} } from '@/components/{{nodeName}}';

export default function Page() {
  return <{{nodeName}} />;
}
\`\`\`

## Related Nodes
- [[concepts/server-components]]
- [[technical/components]]

## Created
{{timestamp}}
`,
  },

  'api-route': {
    type: 'technical',
    description: 'Next.js API route handler specification',
    frontmatter: {
      type: 'api-route',
      status: 'draft',
      tags: ['api', 'backend'],
      framework: 'nextjs',
    },
    contentTemplate: `# {{nodeName}}

## Endpoint
\`{{method}} {{path}}\`

## Description
{{#if description}}
{{description}}
{{else}}
API route handler for {{projectName}}.
{{/if}}

## Request Schema
\`\`\`typescript
interface RequestBody {
  // Define request schema
}
\`\`\`

## Response Schema
\`\`\`typescript
interface ResponseData {
  // Define response schema
}
\`\`\`

## Authentication
- [ ] Public endpoint
- [ ] Requires authentication
- [ ] Requires specific role

## Implementation
\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';

export async function {{method}}(request: NextRequest) {
  // Implementation
  return NextResponse.json({ success: true });
}
\`\`\`

## Error Handling
- 400: Bad Request
- 401: Unauthorized
- 500: Internal Server Error

## Related Nodes
- [[technical/api-routes]]
- [[concepts/data-fetching]]

## Created
{{timestamp}}
`,
  },

  'page': {
    type: 'feature',
    description: 'Next.js page component specification',
    frontmatter: {
      type: 'page',
      status: 'draft',
      tags: ['page', 'route'],
      framework: 'nextjs',
    },
    contentTemplate: `# {{nodeName}} Page

## Route
\`{{route}}\`

## Description
{{#if description}}
{{description}}
{{else}}
Page component for {{projectName}}.
{{/if}}

## Page Type
- [ ] Static Page
- [ ] Dynamic Page
- [ ] Server-Side Rendered
- [ ] Static Site Generated

## Data Requirements
\`\`\`typescript
interface PageProps {
  params: { /* route params */ }
  searchParams: { /* query params */ }
}
\`\`\`

## Layout
- Uses: \`{{layout}}\`
- Metadata: Custom title and description

## Components Used
- Component 1
- Component 2

## Data Fetching
\`\`\`typescript
async function getData() {
  // Fetch data here
}
\`\`\`

## SEO Metadata
\`\`\`typescript
export const metadata = {
  title: '{{nodeName}}',
  description: 'Page description',
}
\`\`\`

## Related Nodes
- [[concepts/app-router]]
- [[concepts/routing]]

## Created
{{timestamp}}
`,
  },

  'hook': {
    type: 'technical',
    description: 'React custom hook specification',
    frontmatter: {
      type: 'hook',
      status: 'draft',
      tags: ['hook', 'react'],
      framework: 'nextjs',
    },
    contentTemplate: `# use{{nodeName}}

## Description
{{#if description}}
{{description}}
{{else}}
Custom React hook for {{projectName}}.
{{/if}}

## Hook Type
- [ ] State Management
- [ ] Data Fetching
- [ ] Side Effects
- [ ] Context Consumer

## Interface
\`\`\`typescript
interface Use{{nodeName}}Options {
  // Hook options
}

interface Use{{nodeName}}Return {
  // Return type
}

function use{{nodeName}}(options?: Use{{nodeName}}Options): Use{{nodeName}}Return
\`\`\`

## Implementation Notes
- Client-side only: {{#if clientOnly}}Yes{{else}}No{{/if}}
- Dependencies: {{dependencies}}
- Error handling: Implemented

## Usage Example
\`\`\`tsx
'use client';

import { use{{nodeName}} } from '@/hooks/use{{nodeName}}';

export function Component() {
  const { data, loading } = use{{nodeName}}();

  return <div>{/* Use hook data */}</div>;
}
\`\`\`

## Dependencies
- React hooks: useState, useEffect, etc.

## Related Nodes
- [[technical/components]]

## Created
{{timestamp}}
`,
  },

  'concept': {
    type: 'concept',
    description: 'Architectural concept documentation',
    frontmatter: {
      type: 'concept',
      status: 'draft',
      tags: ['concept', 'architecture'],
      framework: 'nextjs',
    },
    contentTemplate: `# {{nodeName}}

## Overview
{{#if description}}
{{description}}
{{else}}
Architectural concept for {{projectName}}.
{{/if}}

## Key Principles
1. Principle 1
2. Principle 2
3. Principle 3

## Implementation Approach
Describe how this concept is implemented in the application.

## Benefits
- Benefit 1
- Benefit 2

## Trade-offs
- Trade-off 1
- Trade-off 2

## Examples
\`\`\`typescript
// Example implementation
\`\`\`

## Related Concepts
- [[concepts/related-concept-1]]
- [[concepts/related-concept-2]]

## References
- Next.js Documentation
- React Documentation

## Created
{{timestamp}}
`,
  },
};

/**
 * Next.js vault template configuration
 */
export const nextjsTemplate: VaultTemplate = {
  id: 'nextjs-app-router',
  name: 'Next.js App Router',
  framework: 'nextjs',
  version: '1.0.0',
  description: 'Template for Next.js applications using the App Router',
  directories,
  nodeTemplates: new Map(Object.entries(nodeTemplates)),
  metadata: {
    author: 'Weave-NN',
    tags: ['nextjs', 'react', 'app-router', 'typescript'],
    dependencies: ['next@14+', 'react@18+', 'typescript@5+'],
  },
};
