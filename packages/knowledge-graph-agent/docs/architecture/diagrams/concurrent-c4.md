# C4 Architecture Diagrams - Concurrent Execution

## Level 1: System Context

```
+------------------------------------------------------------------+
|                         External Systems                          |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+     +------------------+                    |
|  | Claude Desktop   |     | External Apps    |                    |
|  | (MCP Client)     |     | (API Consumers)  |                    |
|  +--------+---------+     +--------+---------+                    |
|           |                        |                              |
|           | stdio                  | HTTP                         |
|           v                        v                              |
|  +--------------------------------------------------+            |
|  |          Knowledge Graph Agent System            |            |
|  |                                                  |            |
|  |  Manages knowledge graphs, agents, workflows     |            |
|  |  for AI-assisted development                     |            |
|  +--------------------------------------------------+            |
|                                                                   |
|  +------------------+     +------------------+                    |
|  | Redis (Optional) |     | File System      |                    |
|  | (Pub/Sub Cache)  |     | (SQLite, Docs)   |                    |
|  +------------------+     +------------------+                    |
|                                                                   |
+------------------------------------------------------------------+
```

## Level 2: Container Diagram

```
+-------------------------------------------------------------------------+
|                   Knowledge Graph Agent System                           |
+-------------------------------------------------------------------------+
|                                                                          |
|  +---------------------+   +---------------------+   +----------------+  |
|  | MCP Server          |   | GraphQL API         |   | Web Dashboard  |  |
|  | [Node.js Process]   |   | [HTTP Server]       |   | [HTTP Server]  |  |
|  |                     |   |                     |   |                |  |
|  | Provides MCP tools  |   | Provides query,     |   | Provides UI    |  |
|  | for Claude Desktop  |   | mutation, sub API   |   | and admin      |  |
|  +----------+----------+   +----------+----------+   +--------+-------+  |
|             |                         |                       |          |
|             |                         |                       |          |
|             v                         v                       v          |
|  +--------------------------------------------------------------+       |
|  |                    ServiceContainer (Singleton)               |       |
|  |                                                               |       |
|  |  Shared services for database, cache, agents, workflows      |       |
|  +--------------------------------------------------------------+       |
|             |              |              |              |               |
|             v              v              v              v               |
|  +-------------+  +-------------+  +-------------+  +-------------+     |
|  | Database    |  | Cache       |  | Agent       |  | Workflow    |     |
|  | [SQLite]    |  | [LRU]       |  | Registry    |  | Registry    |     |
|  +-------------+  +-------------+  +-------------+  +-------------+     |
|                                                                          |
|  +----------------------------------------------------------------------+
|  |                        Event Bus (EventEmitter)                      |
|  |  Enables cross-service communication and real-time updates          |
|  +----------------------------------------------------------------------+
|                                                                          |
+-------------------------------------------------------------------------+
```

## Level 3: Component Diagram - ServiceContainer

```
+-------------------------------------------------------------------------+
|                         ServiceContainer                                 |
+-------------------------------------------------------------------------+
|                                                                          |
|  +--------------------+              +--------------------+              |
|  | KnowledgeGraph     |              | ShadowCache        |              |
|  | Database           |              |                    |              |
|  |--------------------|              |--------------------|              |
|  | - db: SQLite       |              | - maxSize: number  |              |
|  | - WAL mode         |              | - ttl: number      |              |
|  |--------------------|              |--------------------|              |
|  | + upsertNode()     |              | + get()            |              |
|  | + getNode()        |              | + set()            |              |
|  | + searchNodes()    |              | + invalidate()     |              |
|  | + getStats()       |              | + getStats()       |              |
|  +--------------------+              +--------------------+              |
|                                                                          |
|  +--------------------+              +--------------------+              |
|  | AgentRegistry      |              | WorkflowRegistry   |              |
|  |                    |              |                    |              |
|  |--------------------|              |--------------------|              |
|  | - registrations    |              | - workflows        |              |
|  | - instances        |              | - executions       |              |
|  |--------------------|              |--------------------|              |
|  | + register()       |              | + register()       |              |
|  | + spawn()          |              | + execute()        |              |
|  | + get()            |              | + cancel()         |              |
|  | + terminateAll()   |              | + getHistory()     |              |
|  +--------------------+              +--------------------+              |
|                                                                          |
|  +--------------------+              +--------------------+              |
|  | TypedEventBus      |              | ServiceManager     |              |
|  |                    |              |                    |              |
|  |--------------------|              |--------------------|              |
|  | - subscribers      |              | - services         |              |
|  | - maxListeners     |              | - healthTimers     |              |
|  |--------------------|              |--------------------|              |
|  | + emitEvent()      |              | + register()       |              |
|  | + subscribe()      |              | + start()          |              |
|  | + unsubscribe()    |              | + stop()           |              |
|  +--------------------+              +--------------------+              |
|                                                                          |
+-------------------------------------------------------------------------+
```

## Level 3: Component Diagram - Server Layer

```
+-------------------------------------------------------------------------+
|                            Server Layer                                  |
+-------------------------------------------------------------------------+
|                                                                          |
|  +-----------------------------+                                         |
|  | MCP Server Adapter          |                                         |
|  |-----------------------------|                                         |
|  | Wraps KnowledgeGraphMCP     |                                         |
|  | Server to use ServiceCont.  |                                         |
|  |-----------------------------|                                         |
|  | + startMCPServer()          |                                         |
|  | Transport: stdio            |                                         |
|  +-----------------------------+                                         |
|                                                                          |
|  +-----------------------------+   +-----------------------------+       |
|  | GraphQL Server              |   | Dashboard Server            |       |
|  |-----------------------------|   |-----------------------------|       |
|  | - yoga: Yoga                |   | - app: Express              |       |
|  | - schema: GraphQLSchema     |   | - httpServer: HttpServer    |       |
|  |-----------------------------|   |-----------------------------|       |
|  | + startGraphQLServer()      |   | + startDashboardServer()    |       |
|  | Transport: HTTP :4000       |   | Transport: HTTP :3000       |       |
|  +-----------------------------+   +-----------------------------+       |
|         |                                 |                              |
|         v                                 v                              |
|  +-----------------------------+   +-----------------------------+       |
|  | GraphQL Resolvers           |   | Dashboard Routes            |       |
|  |-----------------------------|   |-----------------------------|       |
|  | - QueryResolvers            |   | - API Routes (/api)         |       |
|  | - MutationResolvers         |   | - Health Routes (/health)   |       |
|  | - SubscriptionResolvers     |   | - SSE Handler (/api/events) |       |
|  +-----------------------------+   +-----------------------------+       |
|                                                                          |
+-------------------------------------------------------------------------+
```

## Sequence Diagram: Startup

```
CLI                 Container          Database        Servers
 |                      |                  |               |
 |-- parseOptions() -->|                  |               |
 |                      |                  |               |
 |-- getContainer() -->|                  |               |
 |                      |-- createDB() -->|               |
 |                      |<-- db ----------|               |
 |                      |                  |               |
 |                      |-- createCache() |               |
 |                      |-- createAgentReg() |            |
 |                      |-- createWorkflowReg() |         |
 |                      |-- createEventBus() |            |
 |                      |                  |               |
 |<-- container --------|                  |               |
 |                      |                  |               |
 |-- validatePorts() -->|                  |               |
 |                      |                  |               |
 |-- startServers() --->|                  |               |
 |                      |-- startMCP() -->|               |-- MCP ready
 |                      |-- startGQL() -->|               |-- GQL ready
 |                      |-- startDash() ->|               |-- Dash ready
 |                      |                  |               |
 |<-- all started ------|                  |               |
 |                      |                  |               |
 |-- registerSignals() |                  |               |
 |                      |                  |               |
```

## Sequence Diagram: Cross-Service Event Flow

```
MCP Tool    EventBus    GraphQL Sub    Dashboard SSE    Redis
    |           |             |               |            |
    |-- node created -------->|               |            |
    |           |             |               |            |
    |           |-- emit('graph:node:created', payload)    |
    |           |             |               |            |
    |           |------------>| onNodeEvent() |            |
    |           |             |-- push to ws  |            |
    |           |             |               |            |
    |           |-------------------------->| onEvent()   |
    |           |             |               |-- SSE push |
    |           |             |               |            |
    |           |----------------------------------------->|
    |           |             |               | publish()  |
    |           |             |               |            |
```

## Deployment Diagram

```
+------------------------------------------------------------------+
|                    Development Machine                            |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------------------------------------------------+  |
|  |                  Node.js Process                            |  |
|  |                                                             |  |
|  |  +----------------+  +----------------+  +---------------+  |  |
|  |  | MCP Server     |  | GraphQL :4000  |  | Dashboard     |  |  |
|  |  | (stdio)        |  |                |  | :3000         |  |  |
|  |  +----------------+  +----------------+  +---------------+  |  |
|  |                                                             |  |
|  +------------------------------------------------------------+  |
|            |                    |                    |           |
|            v                    v                    v           |
|  +------------------+  +------------------+  +-----------------+ |
|  | SQLite Database  |  | File System      |  | Browser         | |
|  | .kg/kg.db        |  | docs-nn/         |  | http://local..  | |
|  +------------------+  +------------------+  +-----------------+ |
|                                                                   |
|  +--------------------------+                                     |
|  | Redis (Docker/Local)     |  <-- Optional                      |
|  | localhost:6379           |                                     |
|  +--------------------------+                                     |
|                                                                   |
+------------------------------------------------------------------+
```

## Data Flow Diagram

```
+-------------------------------------------------------------------+
|                         Data Flow                                  |
+-------------------------------------------------------------------+
|                                                                    |
|  [Claude Desktop] --> MCP Tool Call --> [MCP Server]               |
|                                              |                     |
|                                              v                     |
|                                    [ServiceContainer]              |
|                                              |                     |
|                                    +---------+---------+           |
|                                    |                   |           |
|                                    v                   v           |
|                              [Database]          [EventBus]        |
|                                    |                   |           |
|                                    |    +--------------+---------+ |
|                                    |    |              |         | |
|                                    v    v              v         v |
|                              [Cache] [GraphQL Sub] [Dashboard SSE] |
|                                              |              |      |
|                                              v              v      |
|                                    [WebSocket Clients] [Browsers]  |
|                                                                    |
+-------------------------------------------------------------------+
```
