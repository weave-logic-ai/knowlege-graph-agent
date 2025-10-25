---
spec_type: "specification"
phase_id: "PHASE-5"
phase_name: "MCP Integration & Workflow Enhancement"
status: "elaborated"
priority: "critical"
duration: "3-4 days"
generated_date: "2025-10-24"
elaborated_date: "2025-10-24"
task_count: 27
requirement_count: 44
acceptance_criteria_count: 47
out_of_scope_count: 52
tags:
  - spec-kit
  - specification
  - phase-5
  - elaborated
links:
  phase_document: "[[phase-5-mcp-integration|Phase 5 Planning Document]]"
  constitution: "[[constitution.md]]"
---

# MCP Integration & Workflow Enhancement - Specification

**Phase ID**: PHASE-5
**Status**: pending

---

## Overview

Implementation phase for MCP Integration & Workflow Enhancement.

## Executive Summary

Phase 5 focuses on exposing Weaver's existing capabilities (shadow cache, workflow engine) to AI agents via the Model Context Protocol (MCP). This enables Claude Desktop and Claude Code to directly query vault metadata, trigger workflows, and enhance proof workflows with task tracking. The implementation leverages components already built in Phase 4B, reducing scope to 3-4 days of integration work.

**Key Success Metrics**:
- 9+ MCP tools operational (5 shadow cache + 4 workflow)
- Tool response time < 200ms (p95)
- Shadow cache queries < 10ms
- Claude Desktop integration functional
- 80%+ test coverage

## Requirements

### Functional Requirements

#### FR-1: MCP Server Foundation
**Priority**: Critical | **Complexity**: Medium

1. **FR-1.1**: Implement MCP server using `@modelcontextprotocol/sdk`
   - Use official SDK from Anthropic
   - Follow MCP 1.0 specification
   - Support server lifecycle (startup, shutdown, health checks)
   - Implement JSON-RPC 2.0 message handling

2. **FR-1.2**: Implement stdio transport for Claude Desktop
   - StdioServerTransport for process-based communication
   - Handle stdin/stdout message passing
   - Support bidirectional communication
   - Enable Claude Desktop integration via config

3. **FR-1.3**: Server lifecycle management
   - Graceful startup with dependency initialization
   - Health check endpoint for monitoring
   - Graceful shutdown with cleanup
   - Error recovery and restart capability

4. **FR-1.4**: Structured logging and error handling
   - Log all tool calls with context
   - Track performance metrics per tool
   - Handle and report errors gracefully
   - Integrate with existing Weaver logger

#### FR-2: Shadow Cache Query Tools
**Priority**: Critical | **Complexity**: Low

5. **FR-2.1**: `query_files` - Advanced file search
   - Filter by directory path (prefix matching)
   - Filter by frontmatter type
   - Filter by status field
   - Filter by tags
   - Pagination support (limit parameter)
   - Return file metadata (path, type, status, tags, links)

6. **FR-2.2**: `get_file` - Retrieve specific file metadata
   - Accept file path parameter
   - Return complete file metadata
   - Include frontmatter fields
   - Include tag list
   - Include wikilink relationships (incoming/outgoing)
   - Error handling for missing files

7. **FR-2.3**: `get_file_content` - Read file content
   - Accept file path parameter
   - Return raw file content
   - Support markdown files
   - Handle large files (>1MB warning)
   - Return content with metadata

8. **FR-2.4**: `search_tags` - Find files by tags
   - Accept tag name parameter
   - Return all files with that tag
   - Include tag frequency/count
   - Support tag prefix matching
   - Sort by relevance

9. **FR-2.5**: `search_links` - Query wikilink relationships
   - Accept file path parameter
   - Return incoming links (what links to this file)
   - Return outgoing links (what this file links to)
   - Support transitive link queries (2+ hops)
   - Return link context (surrounding text)

10. **FR-2.6**: `get_stats` - Vault statistics
    - Total file count
    - Total tag count
    - Total link count
    - Files by type breakdown
    - Files by status breakdown
    - Most connected files (top 10)
    - Cache performance metrics

#### FR-3: Workflow Management Tools
**Priority**: Critical | **Complexity**: Medium

11. **FR-3.1**: `trigger_workflow` - Manual workflow execution
    - Accept workflow ID parameter
    - Accept optional input data (JSON object)
    - Validate workflow exists
    - Queue workflow execution
    - Return execution ID for tracking
    - Handle workflow errors gracefully

12. **FR-3.2**: `get_workflow_status` - Check execution status
    - Accept execution ID parameter
    - Return status (pending, running, completed, failed)
    - Return progress information
    - Return execution duration
    - Include error details if failed
    - Support real-time status updates

13. **FR-3.3**: `list_workflows` - Show registered workflows
    - Return all registered workflows
    - Include workflow metadata (id, name, description)
    - Show enabled/disabled status
    - Show trigger configuration
    - Include execution statistics (total runs, success rate)
    - Filter by status (enabled/disabled)

14. **FR-3.4**: `get_workflow_history` - View execution history
    - Accept workflow ID parameter
    - Return last N executions (default 10)
    - Include execution details (start, end, duration, status)
    - Include input/output data
    - Show error logs for failed executions
    - Support time range filtering

#### FR-4: Proof Workflow Enhancement
**Priority**: High | **Complexity**: Medium

15. **FR-4.1**: Frontmatter parsing in task-completion workflow
    - Parse YAML frontmatter from task log files
    - Extract task metadata (task_id, task_name, status, type)
    - Extract dates (created_date, completed_date)
    - Extract tags from frontmatter and content
    - Handle malformed frontmatter gracefully

16. **FR-4.2**: Task metadata storage in shadow cache
    - Store parsed task data in shadow cache SQLite
    - Create tasks table with schema:
      - task_id, task_name, status, type
      - created_date, completed_date
      - file_path, tags, links
    - Enable fast task queries (<10ms)
    - Support task status updates

17. **FR-4.3**: Enhanced task tracking
    - Track task lifecycle (pending → in_progress → completed)
    - Track task dependencies
    - Calculate task completion rate by phase
    - Generate task completion reports
    - Alert on overdue tasks (if due date present)

18. **FR-4.4**: Phase completion workflow enhancement
    - Parse phase frontmatter
    - Track phase progress (task count, completion %)
    - Generate phase completion reports
    - Update phase status in shadow cache
    - Trigger notifications on phase milestones

#### FR-5: Claude Desktop Integration
**Priority**: Critical | **Complexity**: Low

19. **FR-5.1**: Configuration example and documentation
    - Provide `claude_desktop_config.json` example
    - Document environment variables (VAULT_PATH)
    - Document command configuration
    - Include troubleshooting guide
    - Provide connection test procedure

20. **FR-5.2**: Error reporting to Claude Desktop
    - Return user-friendly error messages
    - Include context for debugging
    - Suggest fixes for common errors
    - Log errors for developer debugging
    - Support error recovery

#### FR-6: Testing & Validation
**Priority**: High | **Complexity**: Medium

21. **FR-6.1**: Integration tests for MCP tools
    - Test each tool end-to-end
    - Mock shadow cache for consistency
    - Validate response format
    - Test error handling
    - Verify performance benchmarks

22. **FR-6.2**: Performance testing
    - Measure tool response time (p50, p95, p99)
    - Measure shadow cache query time
    - Test with large datasets (1000+ files)
    - Memory usage profiling
    - Identify bottlenecks

23. **FR-6.3**: End-to-end workflow tests
    - Test complete workflow: trigger → execute → status → results
    - Test Claude Desktop connection
    - Test concurrent tool calls
    - Test error recovery
    - Validate data consistency

### Non-Functional Requirements

#### NFR-1: Performance
**Priority**: High

24. **NFR-1.1**: Tool response time
    - p50 < 50ms
    - p95 < 200ms
    - p99 < 500ms

25. **NFR-1.2**: Shadow cache queries
    - Query time < 10ms for simple queries
    - Query time < 50ms for complex queries (joins)
    - Support 100+ concurrent queries

26. **NFR-1.3**: Memory efficiency
    - MCP server overhead < 100MB
    - Shadow cache memory < 50MB (for 1000 files)
    - No memory leaks during extended operation

27. **NFR-1.4**: Startup time
    - MCP server startup < 2 seconds
    - Shadow cache initialization < 1 second
    - Total ready time < 3 seconds

#### NFR-2: Reliability
**Priority**: Critical

28. **NFR-2.1**: Error handling
    - Graceful degradation on errors
    - No crashes on malformed input
    - Recovery from transient failures
    - Error logging with context

29. **NFR-2.2**: Data consistency
    - Shadow cache always reflects vault state
    - No stale data older than 1 second
    - Atomic updates to prevent partial state
    - Validation of all inputs

30. **NFR-2.3**: Availability
    - MCP server uptime > 99.9%
    - Auto-restart on crash
    - Health check every 30 seconds
    - Monitoring and alerting

#### NFR-3: Maintainability
**Priority**: High

31. **NFR-3.1**: Code quality
    - TypeScript strict mode enabled
    - No linting errors (ESLint)
    - Test coverage > 80%
    - Pass all type checks

32. **NFR-3.2**: Documentation
    - API reference for all tools
    - Usage examples for each tool
    - Architecture documentation
    - Troubleshooting guide
    - Developer onboarding guide

33. **NFR-3.3**: Testing
    - Unit tests for business logic
    - Integration tests for tool handlers
    - End-to-end tests for workflows
    - Performance benchmarks
    - Regression test suite

#### NFR-4: Security
**Priority**: Medium

34. **NFR-4.1**: Input validation
    - Validate all tool parameters
    - Sanitize file paths (prevent directory traversal)
    - Limit query result size (prevent DoS)
    - Rate limiting on expensive operations

35. **NFR-4.2**: Access control
    - Restrict file access to vault directory
    - Validate workflow IDs before execution
    - Log all sensitive operations
    - Audit trail for tool calls

#### NFR-5: Compatibility
**Priority**: Critical

36. **NFR-5.1**: MCP protocol compliance
    - Follow MCP 1.0 specification
    - Support all required message types
    - Compatible with Claude Desktop
    - Compatible with Claude Code

37. **NFR-5.2**: Backward compatibility
    - No breaking changes to Phase 4B components
    - Maintain existing shadow cache API
    - Maintain existing workflow engine API
    - Support future protocol versions

#### NFR-6: Observability
**Priority**: Medium

38. **NFR-6.1**: Logging
    - Structured JSON logging
    - Log levels (debug, info, warn, error)
    - Context per log (tool name, execution ID)
    - Performance metrics per tool

39. **NFR-6.2**: Metrics
    - Tool call count per tool
    - Average response time per tool
    - Error rate per tool
    - Cache hit/miss ratio
    - Workflow execution statistics

40. **NFR-6.3**: Monitoring
    - Health check endpoint
    - Metrics export (JSON format)
    - Integration with monitoring tools
    - Alerting on anomalies

#### NFR-7: Scalability
**Priority**: Low (future consideration)

41. **NFR-7.1**: Handle large vaults
    - Support 10,000+ files
    - Efficient indexing
    - Pagination for large result sets
    - Memory-efficient queries

42. **NFR-7.2**: Concurrent access
    - Support 10+ concurrent tool calls
    - Thread-safe shadow cache access
    - No blocking operations
    - Async/await throughout

#### NFR-8: Usability
**Priority**: High

43. **NFR-8.1**: Error messages
    - User-friendly error descriptions
    - Actionable error messages
    - Include context and suggestions
    - No technical jargon where possible

44. **NFR-8.2**: Tool discoverability
    - Clear tool names and descriptions
    - Well-documented parameters
    - Examples in tool descriptions
    - Help text for each tool

## Initial Task Breakdown

_Note: This is preliminary. Run /speckit.tasks for AI-powered task generation._

### Task 1: Morning (4 hours): MCP Server Foundation

### Task 2: Afternoon (4 hours): Tool Registry & Architecture

### Task 3: Morning (4 hours): Query Tools

### Task 4: Afternoon (4 hours): Testing & Integration

### Task 5: Morning (4 hours): Workflow Tool Implementation

### Task 6: Afternoon (4 hours): Proof Workflow Enhancement

### Task 7: Tasks:

### Task 8: Implement `@modelcontextprotocol/sdk` server

### Task 9: Stdio transport for Claude Desktop integration

### Task 10: Server lifecycle (startup, shutdown, health checks)

### Task 11: Error handling and logging

### Task 12: `query_files` - Search files by path, type, status, tag

### Task 13: `get_file` - Retrieve specific file metadata

### Task 14: `get_file_content` - Read file content

### Task 15: `search_tags` - Find files by tags

### Task 16: `search_links` - Query wikilink relationships

### Task 17: `get_stats` - Vault statistics

### Task 18: `trigger_workflow` - Manually trigger workflow

### Task 19: `get_workflow_status` - Check execution status

### Task 20: `list_workflows` - Show registered workflows

### Task 21: `get_workflow_history` - View execution history

### Task 22: Complete integration testing (MCP server + tools)

### Task 23: Add Claude Desktop configuration example

### Task 24: Performance testing and optimization

### Task 25: Create developer documentation

### Task 26: Create usage examples

### Task 27: Update README with MCP setup instructions

## Acceptance Criteria

### AC-1: MCP Server Operational
**Validates**: FR-1 (MCP Server Foundation)

1. **AC-1.1**: Server starts successfully
   - GIVEN: MCP server is executed via `node dist/index.js`
   - WHEN: Server initialization completes
   - THEN: Server logs "MCP server started" and responds to stdio
   - AND: Server responds to capabilities request within 100ms

2. **AC-1.2**: Server handles ListTools request
   - GIVEN: Server is running
   - WHEN: Client sends ListTools JSON-RPC request
   - THEN: Server responds with 9+ tool definitions
   - AND: Each tool has name, description, and inputSchema
   - AND: Response time < 50ms

3. **AC-1.3**: Server implements graceful shutdown
   - GIVEN: Server is running with active connections
   - WHEN: SIGTERM or SIGINT signal received
   - THEN: Server completes in-flight requests
   - AND: Server closes shadow cache connections cleanly
   - AND: Server exits with code 0 within 5 seconds

4. **AC-1.4**: Server logs all operations
   - GIVEN: Server is operational
   - WHEN: Tool is invoked
   - THEN: Structured log entry created with timestamp, tool name, duration
   - AND: Log includes execution ID for correlation
   - AND: Errors logged with full context and stack trace

### AC-2: Shadow Cache Tools Functional
**Validates**: FR-2 (Shadow Cache Query Tools)

5. **AC-2.1**: query_files filters correctly
   - GIVEN: Shadow cache contains 229 files
   - WHEN: Tool called with `{"directory": "concepts/"}`
   - THEN: Returns only files in concepts/ directory
   - AND: Response includes file metadata (path, type, status, tags)
   - AND: Query completes in < 10ms

6. **AC-2.2**: get_file returns complete metadata
   - GIVEN: File "concepts/knowledge-graph.md" exists in cache
   - WHEN: Tool called with `{"path": "concepts/knowledge-graph.md"}`
   - THEN: Returns file metadata with all frontmatter fields
   - AND: Includes tag list and wikilink relationships
   - AND: Returns incoming and outgoing links

7. **AC-2.3**: get_file_content reads file
   - GIVEN: File exists in vault
   - WHEN: Tool called with valid path
   - THEN: Returns raw markdown content
   - AND: Includes frontmatter in response
   - AND: Warns if file size > 1MB

8. **AC-2.4**: search_tags finds files by tag
   - GIVEN: 306 tags in shadow cache
   - WHEN: Tool called with `{"tag": "concept"}`
   - THEN: Returns all files tagged with "concept"
   - AND: Results sorted by relevance
   - AND: Includes tag frequency count

9. **AC-2.5**: search_links queries relationships
   - GIVEN: File with multiple wikilinks
   - WHEN: Tool called with file path
   - THEN: Returns incoming links (what links here)
   - AND: Returns outgoing links (what file links to)
   - AND: Optionally supports 2-hop transitive queries

10. **AC-2.6**: get_stats returns vault statistics
    - GIVEN: Shadow cache populated
    - WHEN: Tool called with no parameters
    - THEN: Returns total file count, tag count, link count
    - AND: Returns breakdown by type and status
    - AND: Returns top 10 most connected files

### AC-3: Workflow Tools Operational
**Validates**: FR-3 (Workflow Management Tools)

11. **AC-3.1**: trigger_workflow executes workflows
    - GIVEN: Workflow "task-completion" registered
    - WHEN: Tool called with `{"workflowId": "task-completion"}`
    - THEN: Workflow queued for execution
    - AND: Returns execution ID for tracking
    - AND: Workflow executes asynchronously

12. **AC-3.2**: get_workflow_status tracks execution
    - GIVEN: Workflow execution in progress
    - WHEN: Tool called with execution ID
    - THEN: Returns current status (pending/running/completed/failed)
    - AND: Returns execution duration
    - AND: Includes progress percentage if available

13. **AC-3.3**: list_workflows shows all workflows
    - GIVEN: 7 workflows registered in Phase 4B
    - WHEN: Tool called with no filters
    - THEN: Returns all 7 workflow definitions
    - AND: Includes enabled/disabled status
    - AND: Shows execution statistics (total runs, success rate)

14. **AC-3.4**: get_workflow_history shows past executions
    - GIVEN: Workflow has execution history
    - WHEN: Tool called with workflow ID
    - THEN: Returns last 10 executions by default
    - AND: Each entry includes start, end, duration, status
    - AND: Failed executions include error details

### AC-4: Proof Workflows Enhanced
**Validates**: FR-4 (Proof Workflow Enhancement)

15. **AC-4.1**: Task completion workflow parses frontmatter
    - GIVEN: Task log file created in `_log/tasks/`
    - WHEN: File watcher detects new file
    - THEN: Task completion workflow triggers
    - AND: Frontmatter parsed successfully
    - AND: Task metadata extracted (id, name, status, dates)

16. **AC-4.2**: Task metadata stored in shadow cache
    - GIVEN: Task frontmatter parsed
    - WHEN: Task completion workflow completes
    - THEN: Task data inserted into shadow cache tasks table
    - AND: Query `SELECT * FROM tasks` returns task data
    - AND: Task queryable via MCP tools

17. **AC-4.3**: Task lifecycle tracked
    - GIVEN: Task status changes from pending to completed
    - WHEN: Task log file updated
    - THEN: Shadow cache reflects new status
    - AND: Workflow history shows status change
    - AND: Task completion date recorded

18. **AC-4.4**: Phase completion workflow enhanced
    - GIVEN: Phase document updated
    - WHEN: Phase completion workflow triggers
    - THEN: Phase frontmatter parsed
    - AND: Phase progress calculated (% complete)
    - AND: Phase metadata stored in shadow cache

### AC-5: Claude Desktop Integration Working
**Validates**: FR-5 (Claude Desktop Integration)

19. **AC-5.1**: Configuration loads successfully
    - GIVEN: `claude_desktop_config.json` with weaver server
    - WHEN: Claude Desktop starts
    - THEN: MCP server spawned as child process
    - AND: Connection established via stdio
    - AND: Tools visible in Claude Desktop UI

20. **AC-5.2**: Tools invocable from Claude Desktop
    - GIVEN: MCP server connected
    - WHEN: User asks Claude to query vault
    - THEN: Claude invokes appropriate MCP tool
    - AND: Results displayed in Claude Desktop chat
    - AND: No errors in tool invocation

21. **AC-5.3**: Error messages user-friendly
    - GIVEN: Tool invoked with invalid parameters
    - WHEN: Error occurs
    - THEN: Error message explains what went wrong
    - AND: Error suggests how to fix it
    - AND: No technical stack traces shown to user

### AC-6: Testing Complete
**Validates**: FR-6 (Testing & Validation)

22. **AC-6.1**: Integration tests pass
    - GIVEN: Integration test suite
    - WHEN: `bun test` executed
    - THEN: All integration tests pass
    - AND: Each of 9+ tools tested end-to-end
    - AND: Error handling validated

23. **AC-6.2**: Performance benchmarks met
    - GIVEN: Performance test suite
    - WHEN: Benchmarks executed with 1000 file vault
    - THEN: Shadow cache queries < 10ms (p95)
    - AND: Tool response time < 200ms (p95)
    - AND: Memory usage < 100MB

24. **AC-6.3**: End-to-end workflow tests pass
    - GIVEN: Workflow test scenarios
    - WHEN: Tests executed against live MCP server
    - THEN: Complete workflow cycle works (trigger → status → results)
    - AND: Claude Desktop connection works
    - AND: Concurrent tool calls handled correctly

### AC-7: Performance Requirements Met
**Validates**: NFR-1 (Performance)

25. **AC-7.1**: Tool response time acceptable
    - GIVEN: 100 tool invocations per test
    - WHEN: Performance metrics collected
    - THEN: p50 < 50ms
    - AND: p95 < 200ms
    - AND: p99 < 500ms

26. **AC-7.2**: Shadow cache queries fast
    - GIVEN: Shadow cache with 1000 files
    - WHEN: Simple query executed (e.g., by tag)
    - THEN: Query completes in < 10ms
    - AND: Complex queries (joins) < 50ms

27. **AC-7.3**: Memory usage within limits
    - GIVEN: MCP server running for 1 hour
    - WHEN: Memory usage measured
    - THEN: Server memory < 100MB
    - AND: Shadow cache memory < 50MB
    - AND: No memory leaks detected

28. **AC-7.4**: Startup time fast
    - GIVEN: MCP server not running
    - WHEN: Server started
    - THEN: Ready to accept connections in < 3 seconds
    - AND: Shadow cache initialized in < 1 second

### AC-8: Reliability Demonstrated
**Validates**: NFR-2 (Reliability)

29. **AC-8.1**: Error handling graceful
    - GIVEN: Invalid tool parameters provided
    - WHEN: Tool invoked
    - THEN: Error response returned (not crash)
    - AND: Error message explains the issue
    - AND: Server continues running

30. **AC-8.2**: Data consistency maintained
    - GIVEN: Vault files modified
    - WHEN: Shadow cache queried
    - THEN: Results reflect latest vault state
    - AND: No stale data older than 1 second
    - AND: Concurrent modifications handled correctly

31. **AC-8.3**: High availability achieved
    - GIVEN: Server running for 24 hours
    - WHEN: Uptime measured
    - THEN: Uptime > 99.9%
    - AND: Auto-restart on crash configured
    - AND: Health check passes every 30 seconds

### AC-9: Code Quality Standards Met
**Validates**: NFR-3 (Maintainability)

32. **AC-9.1**: Type checking passes
    - GIVEN: All MCP server code
    - WHEN: `bun run typecheck` executed
    - THEN: Zero TypeScript errors
    - AND: Strict mode enabled
    - AND: No implicit any types

33. **AC-9.2**: Linting passes
    - GIVEN: All MCP server code
    - WHEN: `bun run lint` executed
    - THEN: Zero ESLint errors
    - AND: Zero warnings
    - AND: Code formatted consistently

34. **AC-9.3**: Test coverage adequate
    - GIVEN: Test suite
    - WHEN: Coverage measured
    - THEN: Line coverage > 80%
    - AND: Branch coverage > 75%
    - AND: All critical paths tested

35. **AC-9.4**: Documentation complete
    - GIVEN: MCP server codebase
    - WHEN: Documentation reviewed
    - THEN: All public APIs have JSDoc
    - AND: README has setup instructions
    - AND: Usage examples provided

### AC-10: Security Requirements Met
**Validates**: NFR-4 (Security)

36. **AC-10.1**: Input validation enforced
    - GIVEN: Tool parameters
    - WHEN: Tool invoked
    - THEN: All parameters validated against schema
    - AND: Invalid parameters rejected with clear error
    - AND: SQL injection impossible (parameterized queries)

37. **AC-10.2**: Path traversal prevented
    - GIVEN: File path parameter
    - WHEN: get_file tool invoked with "../../../etc/passwd"
    - THEN: Request rejected
    - AND: Error logged for security audit
    - AND: Only vault directory accessible

38. **AC-10.3**: Access control enforced
    - GIVEN: Workflow trigger request
    - WHEN: Invalid workflow ID provided
    - THEN: Request rejected
    - AND: Valid workflow IDs required
    - AND: All operations logged for audit

### AC-11: Compatibility Ensured
**Validates**: NFR-5 (Compatibility)

39. **AC-11.1**: MCP protocol compliant
    - GIVEN: MCP 1.0 specification
    - WHEN: Server behavior validated
    - THEN: All required message types supported
    - AND: JSON-RPC 2.0 format followed
    - AND: Compatible with Claude Desktop and Claude Code

40. **AC-11.2**: No breaking changes to Phase 4B
    - GIVEN: Existing Phase 4B components
    - WHEN: MCP server integrated
    - THEN: Shadow cache API unchanged
    - AND: Workflow engine API unchanged
    - AND: File watcher continues working
    - AND: All Phase 4B tests still pass

### AC-12: Observability Implemented
**Validates**: NFR-6 (Observability)

41. **AC-12.1**: Structured logging working
    - GIVEN: MCP server operations
    - WHEN: Logs reviewed
    - THEN: All logs in JSON format
    - AND: Logs include context (tool, execution ID)
    - AND: Performance metrics per tool logged

42. **AC-12.2**: Metrics collected
    - GIVEN: Server running for 1 hour
    - WHEN: Metrics exported
    - THEN: Tool call count per tool available
    - AND: Average response time per tool tracked
    - AND: Error rate per tool calculated
    - AND: Cache hit/miss ratio reported

43. **AC-12.3**: Health monitoring operational
    - GIVEN: MCP server running
    - WHEN: Health check executed
    - THEN: Server status returned (healthy/unhealthy)
    - AND: Component status included (shadow cache, workflow engine)
    - AND: Metrics exportable in JSON format

### AC-13: Scalability Validated
**Validates**: NFR-7 (Scalability)

44. **AC-13.1**: Large vaults supported
    - GIVEN: Vault with 10,000 files
    - WHEN: Shadow cache queried
    - THEN: Query performance < 50ms
    - AND: Memory usage remains under limits
    - AND: Pagination available for large results

45. **AC-13.2**: Concurrent access handled
    - GIVEN: 10 concurrent tool calls
    - WHEN: Tools executed simultaneously
    - THEN: All calls complete successfully
    - AND: No race conditions occur
    - AND: Performance remains acceptable

### AC-14: Usability Validated
**Validates**: NFR-8 (Usability)

46. **AC-14.1**: Error messages helpful
    - GIVEN: Common error scenarios
    - WHEN: Errors occur
    - THEN: Messages explain what happened
    - AND: Messages suggest how to fix
    - AND: No technical jargon for user-facing errors

47. **AC-14.2**: Tools discoverable
    - GIVEN: AI agent or developer using MCP
    - WHEN: Tools listed
    - THEN: Tool names clearly describe purpose
    - AND: Tool descriptions explain what they do
    - AND: Parameters documented with examples

## Out of Scope

The following items are explicitly **excluded** from Phase 5 to maintain focus and timeline:

### External Integrations
1. **Obsidian REST API Client** - Not needed; direct file access works
2. **Obsidian Plugin Development** - Deferred to Phase 6
3. **GitHub Integration** - Basic GitHub ops deferred to Phase 7
4. **CI/CD Pipeline Integration** - Not in scope for MVP
5. **External Database Connections** - SQLite shadow cache sufficient

### Advanced Features
6. **Multi-Agent Coordination** - Future enhancement beyond MCP
7. **Real-Time Collaboration** - Not in Phase 5 scope
8. **Web UI or Dashboard** - CLI and MCP tools only
9. **Advanced AI Features** - Beyond MCP protocol scope
10. **Natural Language Processing** - Query parsing, not NLP
11. **Machine Learning Integration** - No ML models in Phase 5
12. **Vector Embeddings** - Semantic search deferred

### Protocol Extensions
13. **SSE Transport** - Stdio only for Phase 5
14. **WebSocket Transport** - Future consideration
15. **HTTP REST API** - MCP protocol only
16. **GraphQL API** - Not needed
17. **Custom Protocol Extensions** - Stick to MCP 1.0 standard

### Performance Optimizations
18. **Distributed Caching** - Single-node shadow cache sufficient
19. **Load Balancing** - Not needed for single-user MVP
20. **Horizontal Scaling** - Vertical sufficient for Phase 5
21. **CDN Integration** - No static assets to serve

### Workflow Features
22. **Complex Workflow Orchestration** - Basic triggers sufficient
23. **Conditional Workflow Logic** - Simple linear workflows only
24. **Workflow Templates** - Hardcoded workflows sufficient
25. **Workflow Version Control** - Not in scope
26. **Workflow Debugging UI** - Logs and CLI sufficient

### Data Features
27. **Data Migration Tools** - No migrations needed
28. **Backup and Restore** - File system backups sufficient
29. **Data Export Formats** - JSON only, no CSV/XML/etc
30. **Data Visualization** - Text-based output only
31. **Historical Data Analysis** - Current state queries only

### Security Features
32. **Authentication System** - Local-only, no auth needed
33. **Authorization/RBAC** - Single user, no permissions needed
34. **Encryption at Rest** - File system security sufficient
35. **Encryption in Transit** - Local stdio, no network
36. **Audit Logging System** - Basic operation logs sufficient

### Testing Scope
37. **Load Testing** - Performance benchmarks sufficient
38. **Stress Testing** - Not needed for single-user MVP
39. **Chaos Engineering** - Too advanced for Phase 5
40. **Penetration Testing** - Security not Phase 5 focus

### Documentation Scope
41. **Video Tutorials** - Written docs only
42. **Interactive Tutorials** - Not in scope
43. **API Client Libraries** - Use MCP SDK directly
44. **Swagger/OpenAPI Docs** - MCP protocol is the spec

### Deployment Features
45. **Container Orchestration** - Not needed (local dev)
46. **Service Mesh** - Overkill for single process
47. **Monitoring Dashboards** - Logs and health check sufficient
48. **Alerting System** - Not needed for local development

### Future Phases
49. **Phase 6 Features** - Obsidian plugin integration
50. **Phase 7 Features** - GitHub workflow automation
51. **Phase 8 Features** - Hive Mind coordination
52. **Beyond MVP** - All post-MVP enhancements

## Next Steps

1. Review and refine with `/speckit.constitution`
2. Elaborate requirements with `/speckit.specify`
3. Generate implementation plan with `/speckit.plan`
4. Break down tasks with `/speckit.tasks`
5. Begin implementation with `/speckit.implement`

---

**Generated**: 2025-10-24T05:48:58.786Z
**Source**: Phase planning document for PHASE-5