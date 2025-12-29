# GraphQL API Guide

The Knowledge Graph Agent provides a GraphQL API for flexible querying, mutations, and real-time subscriptions. This enables rich client applications and integrations with the knowledge graph system.

## Overview

The GraphQL API offers:

1. **Queries** - Read nodes, edges, search, and statistics
2. **Mutations** - Create, update, and delete graph elements
3. **Subscriptions** - Real-time updates via WebSocket
4. **Custom Scalars** - Date, JSON, and graph-specific types

## Server Setup

### Starting the GraphQL Server

```bash
# Start with default configuration
npx kg-graphql start

# Start with custom port
npx kg-graphql start --port 4000

# Start with playground enabled
npx kg-graphql start --playground

# Start in development mode
npx kg-graphql start --dev
```

### Configuration

```typescript
import { GraphQLServer } from '@knowledge-graph-agent/graphql';

const server = new GraphQLServer({
  port: 4000,
  playground: true,
  introspection: true,
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true
  },
  graph: {
    projectRoot: '.',
    docsRoot: './docs'
  },
  subscriptions: {
    enabled: true,
    path: '/subscriptions'
  }
});

await server.start();
```

## Schema Overview

### Core Types

```graphql
# Node types
enum NodeType {
  CONCEPT
  TECHNICAL
  FEATURE
  PRIMITIVE
  SERVICE
  GUIDE
  STANDARD
  INTEGRATION
}

# Node status
enum NodeStatus {
  DRAFT
  ACTIVE
  DEPRECATED
  ARCHIVED
}

# Edge types
enum EdgeType {
  LINK
  REFERENCE
  PARENT
  RELATED
}

# Knowledge node
type KnowledgeNode {
  id: ID!
  path: String!
  filename: String!
  title: String!
  type: NodeType!
  status: NodeStatus!
  content: String!
  tags: [String!]!
  frontmatter: JSON!
  outgoingLinks: [NodeLink!]!
  incomingLinks: [NodeLink!]!
  wordCount: Int!
  lastModified: DateTime!
  createdAt: DateTime!
}

# Node link
type NodeLink {
  target: String!
  type: LinkType!
  text: String
  context: String
}

# Graph edge
type GraphEdge {
  id: ID!
  source: String!
  target: String!
  type: EdgeType!
  weight: Float!
  context: String
}
```

## Queries

### Node Queries

#### Get Single Node

```graphql
query GetNode($id: ID!) {
  node(id: $id) {
    id
    title
    type
    status
    content
    tags
    frontmatter
    outgoingLinks {
      target
      type
      text
    }
    incomingLinks {
      target
      type
    }
    lastModified
  }
}
```

#### Get Multiple Nodes

```graphql
query GetNodes($ids: [ID!]!) {
  nodes(ids: $ids) {
    id
    title
    type
    status
  }
}
```

#### List All Nodes

```graphql
query ListNodes(
  $type: NodeType
  $status: NodeStatus
  $tags: [String!]
  $limit: Int = 20
  $offset: Int = 0
) {
  allNodes(
    type: $type
    status: $status
    tags: $tags
    limit: $limit
    offset: $offset
  ) {
    nodes {
      id
      title
      type
      status
      tags
    }
    totalCount
    hasMore
  }
}
```

### Search Queries

#### Full-Text Search

```graphql
query Search($query: String!, $options: SearchOptions) {
  search(query: $query, options: $options) {
    results {
      node {
        id
        title
        type
        content
      }
      score
      highlights
      matchedFields
    }
    totalCount
    took
  }
}

# Search options input
input SearchOptions {
  types: [NodeType!]
  status: NodeStatus
  tags: [String!]
  limit: Int = 20
  offset: Int = 0
}
```

#### Semantic Search

```graphql
query SemanticSearch($query: String!, $threshold: Float = 0.7, $limit: Int = 10) {
  semanticSearch(query: $query, threshold: $threshold, limit: $limit) {
    results {
      node {
        id
        title
        type
      }
      similarity
    }
  }
}
```

### Edge Queries

#### Get Node Edges

```graphql
query GetNodeEdges($nodeId: ID!, $direction: EdgeDirection) {
  nodeEdges(nodeId: $nodeId, direction: $direction) {
    id
    source
    target
    type
    weight
    context
  }
}

enum EdgeDirection {
  INCOMING
  OUTGOING
  BOTH
}
```

#### Find Path Between Nodes

```graphql
query FindPath($source: ID!, $target: ID!, $maxDepth: Int = 5) {
  findPath(source: $source, target: $target, maxDepth: $maxDepth) {
    found
    path {
      id
      title
    }
    edges {
      type
      weight
    }
    length
  }
}
```

### Statistics Queries

```graphql
query GraphStats {
  stats {
    totalNodes
    totalEdges
    nodesByType {
      type
      count
    }
    nodesByStatus {
      status
      count
    }
    orphanNodes
    avgLinksPerNode
    mostConnected {
      id
      title
      connections
    }
  }
}
```

### Tag Queries

```graphql
query GetTags {
  tags {
    name
    count
  }
}

query GetNodesByTag($tag: String!) {
  nodesByTag(tag: $tag) {
    id
    title
    type
  }
}
```

## Mutations

### Node Mutations

#### Create Node

```graphql
mutation CreateNode($input: CreateNodeInput!) {
  createNode(input: $input) {
    id
    title
    type
    path
  }
}

input CreateNodeInput {
  type: NodeType!
  title: String!
  content: String!
  tags: [String!]
  status: NodeStatus = DRAFT
  frontmatter: JSON
  autoLink: Boolean = false
}
```

**Example:**

```graphql
mutation {
  createNode(input: {
    type: CONCEPT
    title: "Event Sourcing"
    content: "Event sourcing is an architectural pattern..."
    tags: ["architecture", "patterns"]
    status: ACTIVE
    frontmatter: {
      category: "Design Patterns",
      related: ["CQRS", "Domain Events"]
    }
  }) {
    id
    title
    path
  }
}
```

#### Update Node

```graphql
mutation UpdateNode($id: ID!, $input: UpdateNodeInput!) {
  updateNode(id: $id, input: $input) {
    id
    title
    status
    lastModified
  }
}

input UpdateNodeInput {
  title: String
  content: String
  status: NodeStatus
  tags: [String!]
  frontmatter: JSON
}
```

#### Delete Node

```graphql
mutation DeleteNode($id: ID!, $cascade: Boolean = false) {
  deleteNode(id: $id, cascade: $cascade) {
    success
    deletedEdges
  }
}
```

#### Archive Node

```graphql
mutation ArchiveNode($id: ID!) {
  archiveNode(id: $id) {
    id
    status
  }
}
```

### Edge Mutations

#### Create Edge

```graphql
mutation CreateEdge($input: CreateEdgeInput!) {
  createEdge(input: $input) {
    id
    source
    target
    type
    weight
  }
}

input CreateEdgeInput {
  source: ID!
  target: ID!
  type: EdgeType!
  weight: Float = 0.5
  context: String
}
```

#### Update Edge

```graphql
mutation UpdateEdge($id: ID!, $input: UpdateEdgeInput!) {
  updateEdge(id: $id, input: $input) {
    id
    weight
    context
  }
}

input UpdateEdgeInput {
  weight: Float
  context: String
}
```

#### Delete Edge

```graphql
mutation DeleteEdge($id: ID!) {
  deleteEdge(id: $id) {
    success
  }
}
```

### Tag Mutations

```graphql
mutation AddTags($nodeId: ID!, $tags: [String!]!) {
  addTags(nodeId: $nodeId, tags: $tags) {
    id
    tags
  }
}

mutation RemoveTags($nodeId: ID!, $tags: [String!]!) {
  removeTags(nodeId: $nodeId, tags: $tags) {
    id
    tags
  }
}

mutation RenameTag($oldName: String!, $newName: String!) {
  renameTag(oldName: $oldName, newName: $newName) {
    affected
  }
}
```

### Bulk Mutations

```graphql
mutation BulkCreateNodes($inputs: [CreateNodeInput!]!) {
  bulkCreateNodes(inputs: $inputs) {
    created
    failed
    nodes {
      id
      title
    }
    errors {
      index
      message
    }
  }
}

mutation BulkUpdateStatus($ids: [ID!]!, $status: NodeStatus!) {
  bulkUpdateStatus(ids: $ids, status: $status) {
    updated
  }
}
```

## Subscriptions

### Real-Time Updates

```graphql
# Subscribe to all node changes
subscription OnNodeChange {
  nodeChanged {
    type  # CREATED | UPDATED | DELETED
    node {
      id
      title
      type
      status
    }
  }
}

# Subscribe to specific node
subscription OnNodeUpdate($nodeId: ID!) {
  nodeUpdated(nodeId: $nodeId) {
    id
    title
    content
    lastModified
  }
}

# Subscribe to edge changes
subscription OnEdgeChange {
  edgeChanged {
    type  # CREATED | DELETED
    edge {
      source
      target
      type
    }
  }
}

# Subscribe to search results (live search)
subscription OnSearchResults($query: String!) {
  searchResults(query: $query) {
    node {
      id
      title
    }
    score
  }
}
```

### Subscription Client Example

```typescript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:4000/subscriptions',
});

// Subscribe to node changes
const unsubscribe = client.subscribe(
  {
    query: `
      subscription {
        nodeChanged {
          type
          node {
            id
            title
          }
        }
      }
    `,
  },
  {
    next: (data) => {
      console.log('Node changed:', data);
    },
    error: (err) => {
      console.error('Subscription error:', err);
    },
    complete: () => {
      console.log('Subscription complete');
    },
  }
);

// Later: unsubscribe
unsubscribe();
```

## Pagination

### Cursor-Based Pagination

```graphql
query PaginatedNodes($first: Int!, $after: String) {
  paginatedNodes(first: $first, after: $after) {
    edges {
      cursor
      node {
        id
        title
        type
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
}
```

### Offset-Based Pagination

```graphql
query OffsetNodes($limit: Int!, $offset: Int!) {
  allNodes(limit: $limit, offset: $offset) {
    nodes {
      id
      title
    }
    totalCount
    hasMore
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Node not found",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["node"],
      "extensions": {
        "code": "NODE_NOT_FOUND",
        "nodeId": "unknown-id"
      }
    }
  ],
  "data": {
    "node": null
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `NODE_NOT_FOUND` | Requested node doesn't exist |
| `EDGE_NOT_FOUND` | Requested edge doesn't exist |
| `INVALID_INPUT` | Input validation failed |
| `DUPLICATE_NODE` | Node with same ID exists |
| `CIRCULAR_EDGE` | Would create circular reference |
| `AUTH_REQUIRED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |

### Client-Side Error Handling

```typescript
import { ApolloClient, ApolloError } from '@apollo/client';

try {
  const result = await client.query({
    query: GET_NODE,
    variables: { id: 'node-id' }
  });
} catch (error) {
  if (error instanceof ApolloError) {
    for (const graphQLError of error.graphQLErrors) {
      switch (graphQLError.extensions?.code) {
        case 'NODE_NOT_FOUND':
          console.log('Node does not exist');
          break;
        case 'AUTH_REQUIRED':
          console.log('Please log in');
          break;
        default:
          console.log('Unknown error:', graphQLError.message);
      }
    }
  }
}
```

## Custom Scalars

### DateTime

ISO 8601 datetime format.

```graphql
scalar DateTime

# Usage
type Node {
  createdAt: DateTime!
  lastModified: DateTime!
}

# Query with datetime filter
query RecentNodes($since: DateTime!) {
  recentNodes(since: $since) {
    id
    lastModified
  }
}
```

### JSON

Arbitrary JSON data.

```graphql
scalar JSON

# Usage
type Node {
  frontmatter: JSON!
}

# Mutation with JSON input
mutation UpdateFrontmatter($id: ID!, $frontmatter: JSON!) {
  updateNode(id: $id, input: { frontmatter: $frontmatter }) {
    id
    frontmatter
  }
}
```

## Authentication

### Bearer Token

```graphql
# HTTP Header
Authorization: Bearer <token>
```

### API Key

```graphql
# HTTP Header
X-API-Key: <api-key>
```

### Authenticated Queries

```typescript
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

## Rate Limiting

The API implements rate limiting with headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

```typescript
const link = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    const context = operation.getContext();
    const remaining = context.response.headers.get('X-RateLimit-Remaining');

    if (parseInt(remaining) < 10) {
      console.warn('Approaching rate limit');
    }

    return response;
  });
});
```

## Client Setup Examples

### Apollo Client (React)

```typescript
import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql'
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/subscriptions'
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache()
});
```

### urql (React)

```typescript
import { createClient, subscriptionExchange, fetchExchange } from 'urql';
import { createClient as createWSClient } from 'graphql-ws';

const wsClient = createWSClient({
  url: 'ws://localhost:4000/subscriptions'
});

const client = createClient({
  url: 'http://localhost:4000/graphql',
  exchanges: [
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: (operation) => ({
        subscribe: (sink) => ({
          unsubscribe: wsClient.subscribe(operation, sink)
        })
      })
    })
  ]
});
```

### Vanilla JavaScript

```typescript
async function query(graphqlQuery: string, variables?: Record<string, any>) {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: graphqlQuery,
      variables
    })
  });

  return response.json();
}

// Usage
const result = await query(`
  query GetNode($id: ID!) {
    node(id: $id) {
      title
      content
    }
  }
`, { id: 'my-node' });
```

## Best Practices

1. **Use fragments** - Share fields across queries
2. **Batch queries** - Combine related queries in one request
3. **Use variables** - Never interpolate values in query strings
4. **Handle errors** - Check for errors in all responses
5. **Paginate large results** - Use cursor or offset pagination
6. **Cache appropriately** - Use Apollo/urql caching features
7. **Subscribe sparingly** - Only subscribe when real-time is needed

## Troubleshooting

### Common Issues

**Subscription not connecting**
- Check WebSocket URL is correct
- Verify server allows WebSocket connections
- Check for CORS issues

**Query returning null**
- Verify ID/path is correct
- Check node exists in database
- Review field permissions

**Slow queries**
- Add appropriate indexes
- Use pagination for large results
- Reduce query depth

### Debug Mode

```bash
# Enable query logging
DEBUG=kg:graphql* npx kg-graphql start

# Enable all debug output
DEBUG=* npx kg-graphql start --dev
```

## Related Guides

- [Knowledge Graph Guide](./knowledge-graph.md) - Graph concepts
- [MCP Server Guide](./mcp-server.md) - MCP tool interface
- [Dashboard Guide](./dashboard.md) - Visual interface
