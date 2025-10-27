import type { VaultTemplate, NodeTemplate, DirectoryStructure } from './types.js';

/**
 * React (Vite) vault template for SPA applications
 */

const directories: DirectoryStructure = {
  concepts: {
    description: 'Core React concepts and architectural patterns',
    children: {
      'component-patterns': 'Component composition patterns',
      'state-management': 'State management strategies',
      'routing': 'Client-side routing concepts',
      'performance': 'Performance optimization techniques',
    },
  },
  technical: {
    description: 'Technical implementation specifications',
    children: {
      'components': 'Reusable React components',
      'hooks': 'Custom React hooks',
      'contexts': 'React Context providers',
      'utils': 'Utility functions and helpers',
      'services': 'API and data services',
    },
  },
  features: {
    description: 'Feature specifications and requirements',
    children: {
      'authentication': 'Authentication flow',
      'dashboard': 'Dashboard features',
      'forms': 'Form handling and validation',
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
      tags: ['component', 'ui', 'react'],
      framework: 'react',
    },
    contentTemplate: `# {{nodeName}}

## Overview
{{#if description}}
{{description}}
{{else}}
A reusable React component for {{projectName}}.
{{/if}}

## Component Type
- [ ] Presentational Component
- [ ] Container Component
- [ ] Higher-Order Component
- [ ] Render Props Component

## Props Interface
\`\`\`typescript
interface {{nodeName}}Props {
  // Define props here
  className?: string;
  children?: React.ReactNode;
}
\`\`\`

## State Management
- [ ] Local state (useState)
- [ ] Context consumer
- [ ] External state (Redux, Zustand, etc.)

## Implementation
\`\`\`tsx
import React from 'react';

export const {{nodeName}}: React.FC<{{nodeName}}Props> = ({
  className,
  children
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
\`\`\`

## Styling
- CSS Modules
- Tailwind CSS
- Styled Components

## Testing
\`\`\`tsx
import { render, screen } from '@testing-library/react';
import { {{nodeName}} } from './{{nodeName}}';

describe('{{nodeName}}', () => {
  it('renders correctly', () => {
    render(<{{nodeName}} />);
  });
});
\`\`\`

## Related Nodes
- [[concepts/component-patterns]]
- [[technical/components]]

## Created
{{timestamp}}
`,
  },

  'hook': {
    type: 'technical',
    description: 'Custom React hook specification',
    frontmatter: {
      type: 'hook',
      status: 'draft',
      tags: ['hook', 'react', 'custom-hook'],
      framework: 'react',
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
- [ ] Event Handling
- [ ] Form Management

## Interface
\`\`\`typescript
interface Use{{nodeName}}Options {
  // Hook configuration options
}

interface Use{{nodeName}}Return {
  // Hook return value
}

export function use{{nodeName}}(
  options?: Use{{nodeName}}Options
): Use{{nodeName}}Return;
\`\`\`

## Implementation
\`\`\`typescript
import { useState, useEffect } from 'react';

export function use{{nodeName}}(options?: Use{{nodeName}}Options) {
  const [state, setState] = useState();

  useEffect(() => {
    // Effect implementation
  }, []);

  return { state };
}
\`\`\`

## Dependencies
- React hooks: useState, useEffect, etc.
- External libraries: (if any)

## Usage Example
\`\`\`tsx
import { use{{nodeName}} } from '@/hooks/use{{nodeName}}';

function MyComponent() {
  const { state } = use{{nodeName}}();

  return <div>{state}</div>;
}
\`\`\`

## Testing
\`\`\`typescript
import { renderHook } from '@testing-library/react-hooks';
import { use{{nodeName}} } from './use{{nodeName}}';

describe('use{{nodeName}}', () => {
  it('works correctly', () => {
    const { result } = renderHook(() => use{{nodeName}}());
    expect(result.current).toBeDefined();
  });
});
\`\`\`

## Related Nodes
- [[technical/hooks]]
- [[concepts/state-management]]

## Created
{{timestamp}}
`,
  },

  'context': {
    type: 'technical',
    description: 'React Context provider specification',
    frontmatter: {
      type: 'context',
      status: 'draft',
      tags: ['context', 'state', 'react'],
      framework: 'react',
    },
    contentTemplate: `# {{nodeName}}Context

## Description
{{#if description}}
{{description}}
{{else}}
React Context provider for {{projectName}}.
{{/if}}

## Context Value Interface
\`\`\`typescript
interface {{nodeName}}ContextValue {
  // Context value properties
  state: any;
  actions: {
    // Available actions
  };
}
\`\`\`

## Provider Props
\`\`\`typescript
interface {{nodeName}}ProviderProps {
  children: React.ReactNode;
  initialState?: Partial<{{nodeName}}ContextValue>;
}
\`\`\`

## Implementation
\`\`\`tsx
import React, { createContext, useContext, useState } from 'react';

const {{nodeName}}Context = createContext<{{nodeName}}ContextValue | undefined>(
  undefined
);

export const {{nodeName}}Provider: React.FC<{{nodeName}}ProviderProps> = ({
  children,
  initialState
}) => {
  const [state, setState] = useState(initialState);

  const value = {
    state,
    actions: {
      // Define actions
    },
  };

  return (
    <{{nodeName}}Context.Provider value={value}>
      {children}
    </{{nodeName}}Context.Provider>
  );
};

export const use{{nodeName}} = () => {
  const context = useContext({{nodeName}}Context);
  if (!context) {
    throw new Error('use{{nodeName}} must be used within {{nodeName}}Provider');
  }
  return context;
};
\`\`\`

## Usage
\`\`\`tsx
import { {{nodeName}}Provider, use{{nodeName}} } from '@/contexts/{{nodeName}}Context';

// Wrap app
<{{nodeName}}Provider>
  <App />
</{{nodeName}}Provider>

// Use in components
function Component() {
  const { state, actions } = use{{nodeName}}();
  return <div>{state}</div>;
}
\`\`\`

## Related Nodes
- [[concepts/state-management]]
- [[technical/contexts]]

## Created
{{timestamp}}
`,
  },

  'service': {
    type: 'technical',
    description: 'API service module specification',
    frontmatter: {
      type: 'service',
      status: 'draft',
      tags: ['service', 'api', 'data'],
      framework: 'react',
    },
    contentTemplate: `# {{nodeName}}Service

## Description
{{#if description}}
{{description}}
{{else}}
API service for {{projectName}}.
{{/if}}

## API Endpoints
- \`GET {{baseUrl}}/endpoint\` - Description
- \`POST {{baseUrl}}/endpoint\` - Description

## Data Types
\`\`\`typescript
interface {{nodeName}}Data {
  // Data structure
}

interface {{nodeName}}Response {
  // Response structure
}
\`\`\`

## Service Implementation
\`\`\`typescript
class {{nodeName}}Service {
  private baseUrl = '{{baseUrl}}';

  async getData(): Promise<{{nodeName}}Data[]> {
    const response = await fetch(\`\${this.baseUrl}/data\`);
    return response.json();
  }

  async createData(data: {{nodeName}}Data): Promise<{{nodeName}}Response> {
    const response = await fetch(\`\${this.baseUrl}/data\`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

export const {{nodeName}}Service = new {{nodeName}}Service();
\`\`\`

## Error Handling
- Network errors
- Validation errors
- Server errors

## Related Nodes
- [[technical/services]]
- [[concepts/state-management]]

## Created
{{timestamp}}
`,
  },

  'concept': {
    type: 'concept',
    description: 'React architectural concept',
    frontmatter: {
      type: 'concept',
      status: 'draft',
      tags: ['concept', 'architecture', 'react'],
      framework: 'react',
    },
    contentTemplate: `# {{nodeName}}

## Overview
{{#if description}}
{{description}}
{{else}}
Architectural concept for {{projectName}}.
{{/if}}

## Core Principles
1. Principle 1
2. Principle 2
3. Principle 3

## Implementation Strategy
Describe how this concept is applied in the React application.

## Benefits
- Benefit 1
- Benefit 2
- Benefit 3

## Challenges
- Challenge 1
- Challenge 2

## Best Practices
- Best practice 1
- Best practice 2

## Code Example
\`\`\`tsx
// Example implementation
\`\`\`

## Related Concepts
- [[concepts/component-patterns]]
- [[concepts/state-management]]

## Resources
- React Documentation
- Community articles

## Created
{{timestamp}}
`,
  },
};

/**
 * React (Vite) vault template configuration
 */
export const reactTemplate: VaultTemplate = {
  id: 'react-vite',
  name: 'React with Vite',
  framework: 'react',
  version: '1.0.0',
  description: 'Template for React applications built with Vite',
  directories,
  nodeTemplates: new Map(Object.entries(nodeTemplates)),
  metadata: {
    author: 'Weave-NN',
    tags: ['react', 'vite', 'spa', 'typescript'],
    dependencies: ['react@18+', 'vite@5+', 'typescript@5+'],
  },
};
