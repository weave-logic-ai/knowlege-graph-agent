/**
 * Test Fixtures - Sample Documents for Phase 13 Testing
 * Provides realistic markdown documents for testing chunking, embeddings, and search
 */

export const sampleDocuments = {
  episodic: {
    title: "Task Execution Example",
    content: `---
title: User Authentication Implementation
type: task
phase: implementation
created: 2025-10-27T10:00:00Z
---

# Task: Implement User Authentication

## Phase 1: Research (10:00-10:30)
Investigated OAuth 2.0 best practices and JWT token management.
Found that refresh tokens should expire after 7 days.

## Phase 2: Design (10:30-11:00)
Designed authentication flow with:
- Login endpoint (/api/auth/login)
- Token refresh endpoint (/api/auth/refresh)
- Logout endpoint (/api/auth/logout)

## Phase 3: Implementation (11:00-14:00)
Implemented core authentication logic:
\`\`\`typescript
async function authenticateUser(email: string, password: string) {
  // Implementation details
}
\`\`\`

## Phase 4: Testing (14:00-15:00)
Created test suite with 15 test cases covering:
- Valid credentials
- Invalid credentials
- Token expiration
- Refresh token rotation

## Outcome
Successfully implemented authentication with 95% test coverage.
Identified need for rate limiting in future iteration.
`,
  },

  semantic: {
    title: "Knowledge Article with Topics",
    content: `---
title: React State Management Guide
type: concept
category: frontend
tags: [react, state-management, hooks]
---

# React State Management Guide

## Introduction to State
State is fundamental to React applications. It represents data that changes over time.

## Local State with useState
The useState hook is the simplest form of state management:
\`\`\`tsx
const [count, setCount] = useState(0);
\`\`\`

## Context API for Global State
When state needs to be shared across components, Context API provides a solution:
\`\`\`tsx
const ThemeContext = createContext<Theme | undefined>(undefined);
\`\`\`

## Advanced State with useReducer
For complex state logic, useReducer offers predictable state updates:
\`\`\`tsx
const [state, dispatch] = useReducer(reducer, initialState);
\`\`\`

## External State Libraries
For large applications, consider libraries like Redux or Zustand.
These provide powerful devtools and middleware capabilities.

## Performance Optimization
Optimize re-renders using useMemo and useCallback hooks.
Avoid unnecessary context updates by splitting contexts.

## Best Practices
1. Keep state as local as possible
2. Use Context for truly global state
3. Consider composition before state management libraries
4. Profile before optimizing
`,
  },

  preference: {
    title: "Decision Log",
    content: `---
title: API Design Decisions
type: decision-log
created: 2025-10-27
---

# API Design Decision Log

## Decision 1: REST vs GraphQL
**Context**: Need to choose API architecture for new service
**Options Considered**: REST, GraphQL, gRPC
**Decision**: Use REST with JSON API spec
**Rationale**:
- Team has deep REST experience
- Simpler caching strategy
- Better tooling support
- GraphQL adds unnecessary complexity for our use case

## Decision 2: Authentication Method
**Context**: Secure API endpoints
**Options Considered**: API Keys, OAuth 2.0, JWT
**Decision**: JWT with refresh tokens
**Rationale**:
- Stateless authentication
- Short-lived access tokens (15 min)
- Long-lived refresh tokens (7 days)
- Industry standard approach

## Decision 3: Error Handling
**Context**: Consistent error responses
**Options Considered**: HTTP status only, RFC 7807, Custom format
**Decision**: RFC 7807 Problem Details
**Rationale**:
- Standardized error format
- Machine-readable
- Extensible for additional context
- Good client library support
`,
  },

  procedural: {
    title: "Step-by-Step Tutorial",
    content: `---
title: Docker Deployment Guide
type: tutorial
difficulty: intermediate
---

# Docker Deployment Guide

## Step 1: Install Docker
Download and install Docker Desktop from docker.com

## Step 2: Create Dockerfile
Create a file named \`Dockerfile\` in project root:
\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## Step 3: Build Image
Run the build command:
\`\`\`bash
docker build -t myapp:latest .
\`\`\`

## Step 4: Run Container
Start the container:
\`\`\`bash
docker run -p 3000:3000 myapp:latest
\`\`\`

## Step 5: Verify Deployment
Open browser to http://localhost:3000

## Step 6: Push to Registry
Tag and push to Docker Hub:
\`\`\`bash
docker tag myapp:latest username/myapp:latest
docker push username/myapp:latest
\`\`\`
`,
  },

  highLinkDensity: {
    title: "Highly Connected Document",
    content: `---
title: System Architecture Overview
type: architecture
---

# System Architecture

This system connects [[authentication]], [[database]], [[api-gateway]],
[[message-queue]], [[cache-layer]], [[load-balancer]], [[monitoring]],
[[logging]], [[metrics]], [[tracing]], [[cdn]], [[storage]],
[[search-engine]], [[recommendation-engine]], and [[analytics]].

The [[authentication]] service integrates with [[oauth-provider]] and
[[identity-management]]. It communicates with [[user-service]] and
[[permission-service]].

Data flows through [[api-gateway]] to [[backend-services]] which use
[[database-cluster]] and [[redis-cache]]. Events are published to
[[kafka-cluster]] and consumed by [[event-processors]].

Frontend uses [[react-app]] with [[state-management]] and [[routing]].
Mobile apps use [[react-native]] and [[native-modules]].
`,
  },

  malformedFrontmatter: {
    title: "Malformed Document",
    content: `---
title: "Missing closing quotes
type: concept
tags: [incomplete
---

# Content starts here

This document has malformed YAML frontmatter that should be handled gracefully.
`,
  },

  emptyDocument: {
    title: "Empty Content",
    content: `---
title: Empty Document
type: placeholder
---

`,
  },

  largeDocument: {
    title: "Large Document",
    content: `---
title: Comprehensive Guide
type: guide
---

# Very Large Document

${"Lorem ipsum dolor sit amet. ".repeat(1000)}

## Section 1
${"Detailed content here. ".repeat(500)}

## Section 2
${"More detailed content. ".repeat(500)}

## Section 3
${"Additional content. ".repeat(500)}

## Section 4
${"Final content section. ".repeat(500)}
`,
  },
};

export const sampleChunks = {
  eventBased: [
    {
      id: "chunk-1",
      content: "Phase 1: Research (10:00-10:30)\nInvestigated OAuth 2.0 best practices...",
      metadata: {
        type: "episodic",
        phase: "research",
        timestamp: "2025-10-27T10:00:00Z",
        duration: 1800,
      },
    },
    {
      id: "chunk-2",
      content: "Phase 2: Design (10:30-11:00)\nDesigned authentication flow...",
      metadata: {
        type: "episodic",
        phase: "design",
        timestamp: "2025-10-27T10:30:00Z",
        duration: 1800,
      },
    },
  ],

  semanticBoundary: [
    {
      id: "chunk-1",
      content: "Introduction to State\nState is fundamental to React applications...",
      metadata: {
        type: "semantic",
        topic: "state-basics",
        boundary_type: "topic_shift",
      },
    },
    {
      id: "chunk-2",
      content: "Local State with useState\nThe useState hook is the simplest...",
      metadata: {
        type: "semantic",
        topic: "useState",
        boundary_type: "topic_shift",
      },
    },
  ],

  preferenceSignal: [
    {
      id: "chunk-1",
      content: "Decision 1: REST vs GraphQL\nContext: Need to choose API architecture...",
      metadata: {
        type: "preference",
        decision: "rest-over-graphql",
        confidence: 0.9,
      },
    },
  ],

  stepBased: [
    {
      id: "chunk-1",
      content: "Step 1: Install Docker\nDownload and install Docker Desktop...",
      metadata: {
        type: "procedural",
        step_number: 1,
        dependencies: [],
      },
    },
    {
      id: "chunk-2",
      content: "Step 2: Create Dockerfile\nCreate a file named Dockerfile...",
      metadata: {
        type: "procedural",
        step_number: 2,
        dependencies: [1],
      },
    },
  ],
};

export const sampleEmbeddings = {
  dimension: 384, // all-MiniLM-L6-v2
  samples: [
    {
      chunkId: "chunk-1",
      vector: new Array(384).fill(0).map(() => Math.random() * 2 - 1),
      text: "React state management basics",
    },
    {
      chunkId: "chunk-2",
      vector: new Array(384).fill(0).map(() => Math.random() * 2 - 1),
      text: "Authentication implementation guide",
    },
  ],
};

export const sampleSearchQueries = {
  keyword: [
    { query: "authentication", expectedDocs: ["episodic", "preference"] },
    { query: "state management", expectedDocs: ["semantic"] },
    { query: "docker deployment", expectedDocs: ["procedural"] },
  ],

  semantic: [
    { query: "how to manage component state", expectedDocs: ["semantic"] },
    { query: "securing API endpoints", expectedDocs: ["episodic", "preference"] },
    { query: "container deployment process", expectedDocs: ["procedural"] },
  ],

  hybrid: [
    {
      query: "react hooks for state",
      expectedDocs: ["semantic"],
      minRelevance: 0.85,
    },
    {
      query: "JWT authentication patterns",
      expectedDocs: ["episodic", "preference"],
      minRelevance: 0.80,
    },
  ],
};

export const edgeCases = {
  emptyChunk: {
    content: "",
    metadata: {},
  },

  veryLongChunk: {
    content: "word ".repeat(10000),
    metadata: { type: "stress-test" },
  },

  specialCharacters: {
    content: "Special chars: <>&\"'`\n\t\r\0",
    metadata: { type: "sanitization-test" },
  },

  unicodeContent: {
    content: "Unicode: 你好世界 مرحبا العالم Здравствуй мир 🚀🎉",
    metadata: { type: "unicode-test" },
  },

  malformedJSON: {
    content: "Valid content",
    metadata: '{"invalid": json}' as any, // Intentionally malformed
  },
};
