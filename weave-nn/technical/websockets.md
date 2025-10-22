---
tech_id: websockets
category: communication-protocol
maturity: stable
pros:
  - Bidirectional real-time communication
  - Low latency for live updates
  - Persistent connections reduce overhead
  - Standard protocol with broad support
  - Enables collaborative features
cons:
  - Requires stateful server infrastructure
  - Scaling complexity with connection management
  - Not supported in serverless environments
  - More complex than HTTP polling or SSE
use_case: Real-time collaborative editing and live knowledge graph updates
---

# WebSockets

WebSockets is a communication protocol providing full-duplex channels over a single TCP connection, enabling real-time, bidirectional data flow between client and server. Unlike HTTP's request-response model, WebSockets maintain persistent connections for instant message exchange without polling overhead.

## What It Does

WebSockets establish a connection via HTTP upgrade, then switch to the WebSocket protocol for ongoing communication. Both client and server can push messages at any time without waiting for requests. This enables chat applications, live notifications, collaborative editing, multiplayer games, and real-time dashboards. Libraries like Socket.io add abstractions for rooms, broadcasting, and automatic reconnection.

## Why Consider It

For knowledge graph applications with collaborative features, WebSockets enable live updates when users edit nodes, create links, or add annotations. Multiple users see changes propagate instantly without refreshing. The [[technical/supabase|Supabase]] real-time functionality uses WebSockets internally, providing change subscriptions for database updates.

Graph visualization tools like [[technical/react-flow|React Flow]] and [[technical/svelte-flow|Svelte Flow]] benefit from WebSocket-driven updates, synchronizing node positions and connections across collaborators. For AI agents generating knowledge graphs, WebSockets stream incremental results as the graph builds.

## Trade-offs

WebSockets require stateful server infrastructure, complicating deployment on serverless platforms like [[technical/vercel|Vercel]]. [[technical/railway|Railway]] or traditional servers handle persistent connections naturally. Scaling requires managing connection state across server instances, often needing Redis pub/sub for coordination.

Alternatives include Server-Sent Events (SSE) for one-way server-to-client streaming, or polling for simpler implementation. [[technical/supabase|Supabase]] Realtime abstracts WebSocket complexity with database subscriptions. However, for custom real-time logic beyond database changes, WebSockets provide maximum flexibility.

## Related Decisions

- **[Decision: Real-time Infrastructure]** - WebSockets vs Supabase Realtime vs polling
- **[Decision: Collaborative Features]** - Multi-user editing and live graph updates
- **[Decision: Deployment Platform]** - Railway vs Vercel for WebSocket support
- **[Decision: Scaling Strategy]** - Connection state management across servers
- **[Decision: Client Library]** - Socket.io vs native WebSocket API
