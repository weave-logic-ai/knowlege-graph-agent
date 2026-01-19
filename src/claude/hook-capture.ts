/**
 * Hook Capture System
 *
 * Captures all Claude interactions (prompts, responses, tool calls)
 * and stores them in the knowledge graph with hierarchical structure.
 *
 * @module claude/hook-capture
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import {
  SessionId,
  ConversationId,
  MessageId,
  ToolCallId,
  SubAgentId,
  SwarmId,
  WorkflowId,
  ClaudeSession,
  ClaudeConversation,
  ClaudeMessage,
  ClaudeToolCall,
  ClaudeSubAgent,
  ClaudeSwarm,
  TokenUsage,
  AggregatedTokenUsage,
  ExecutionStatus,
  ClaudeAgentType,
  ToolCategory,
  SwarmTopology,
  SwarmStrategy,
  TextContentBlock,
  BaseMetadata,
  SessionEnvironment,
  createSessionId,
  createConversationId,
  createMessageId,
  createToolCallId,
  createSubAgentId,
  createSwarmId,
} from './types.js';

/**
 * Hook event types from Claude Code
 */
export type HookEventType =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'UserPromptSubmit'
  | 'Stop'
  | 'PreCompact';

/**
 * Raw hook event data received from Claude Code
 */
export interface HookEventData {
  event: HookEventType;
  timestamp: string;
  sessionId?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: string;
  userPrompt?: string;
  exitCode?: number;
  duration?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Capture configuration options
 */
export interface CaptureConfig {
  /** Base directory for storing captured data */
  storageDir: string;
  /** Whether to store in knowledge graph format */
  useKnowledgeGraph: boolean;
  /** Whether to create markdown documents */
  createMarkdown: boolean;
  /** Whether to track tool outputs separately */
  separateToolOutputs: boolean;
  /** Maximum content length to store (truncates if exceeded) */
  maxContentLength: number;
  /** Whether to capture sub-agent spawns */
  captureSubAgents: boolean;
  /** Whether to capture swarm operations */
  captureSwarms: boolean;
  /** Whether to capture workflow executions */
  captureWorkflows: boolean;
  /** Tags to add to all captured items */
  defaultTags: string[];
}

/**
 * Default configuration
 */
export const DEFAULT_CAPTURE_CONFIG: CaptureConfig = {
  storageDir: '.kg/claude',
  useKnowledgeGraph: true,
  createMarkdown: true,
  separateToolOutputs: true,
  maxContentLength: 50000,
  captureSubAgents: true,
  captureSwarms: true,
  captureWorkflows: true,
  defaultTags: ['claude', 'interaction'],
};

/**
 * In-memory storage for active session data
 */
interface StoredSession {
  session: ClaudeSession;
  conversations: Map<ConversationId, ClaudeConversation>;
  messages: Map<MessageId, ClaudeMessage>;
  toolCalls: Map<ToolCallId, ClaudeToolCall>;
  subAgents: Map<SubAgentId, ClaudeSubAgent>;
  swarms: Map<SwarmId, ClaudeSwarm>;
}

/**
 * Active session state
 */
interface CaptureState {
  currentSessionId: SessionId | null;
  currentConversationId: ConversationId | null;
  pendingToolCalls: Map<string, ToolCallId>;
  subAgentStack: SubAgentId[];
  activeSwarmId: SwarmId | null;
  storage: StoredSession | null;
}

/**
 * Hook Capture System
 *
 * Manages the capture and storage of all Claude interactions.
 */
export class HookCaptureSystem {
  private config: CaptureConfig;
  private state: CaptureState;
  private projectRoot: string;

  constructor(projectRoot: string, config: Partial<CaptureConfig> = {}) {
    this.projectRoot = projectRoot;
    this.config = { ...DEFAULT_CAPTURE_CONFIG, ...config };
    this.state = {
      currentSessionId: null,
      currentConversationId: null,
      pendingToolCalls: new Map(),
      subAgentStack: [],
      activeSwarmId: null,
      storage: null,
    };

    this.ensureStorageDir();
  }

  /**
   * Ensure storage directory exists
   */
  private ensureStorageDir(): void {
    const fullPath = join(this.projectRoot, this.config.storageDir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
  }

  /**
   * Create empty token usage
   */
  private createEmptyTokenUsage(): TokenUsage {
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };
  }

  /**
   * Create empty aggregated token usage
   */
  private createEmptyAggregatedTokenUsage(): AggregatedTokenUsage {
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      operationCount: 0,
    };
  }

  /**
   * Create base metadata
   */
  private createBaseMetadata(tags: string[] = []): BaseMetadata {
    const now = new Date();
    return {
      createdAt: now,
      updatedAt: now,
      tags: [...this.config.defaultTags, ...tags],
    };
  }

  /**
   * Get current git branch
   */
  private getGitBranch(): string | undefined {
    try {
      const headPath = join(this.projectRoot, '.git', 'HEAD');
      if (existsSync(headPath)) {
        const content = readFileSync(headPath, 'utf-8').trim();
        if (content.startsWith('ref: refs/heads/')) {
          return content.replace('ref: refs/heads/', '');
        }
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Start a new session
   */
  startSession(name?: string, purpose?: string): ClaudeSession {
    const sessionId = createSessionId();
    const now = new Date();

    const environment: SessionEnvironment = {
      workingDirectory: this.projectRoot,
      gitBranch: this.getGitBranch(),
      platform: process.platform,
    };

    const session: ClaudeSession = {
      id: sessionId,
      name: name || `Session ${now.toISOString().slice(0, 16)}`,
      purpose: purpose || 'General interaction',
      startedAt: now,
      status: 'running',
      conversationIds: [],
      swarmIds: [],
      workflowIds: [],
      environment,
      tokenUsage: this.createEmptyAggregatedTokenUsage(),
      metadata: this.createBaseMetadata(['session']),
    };

    // Initialize storage
    this.state.storage = {
      session,
      conversations: new Map(),
      messages: new Map(),
      toolCalls: new Map(),
      subAgents: new Map(),
      swarms: new Map(),
    };

    this.state.currentSessionId = sessionId;
    this.saveSession(session);

    return session;
  }

  /**
   * End the current session
   */
  endSession(): ClaudeSession | null {
    if (!this.state.storage) return null;

    const session = this.state.storage.session;
    session.endedAt = new Date();
    session.status = 'completed';
    session.metadata.updatedAt = new Date();

    // Aggregate token usage from all conversations
    this.aggregateSessionTokens();

    this.saveSession(session);
    const result = { ...session };

    // Reset state
    this.state.currentSessionId = null;
    this.state.currentConversationId = null;
    this.state.storage = null;

    return result;
  }

  /**
   * Start a new conversation
   */
  startConversation(model?: string, systemPrompt?: string): ClaudeConversation {
    if (!this.state.storage) {
      this.startSession();
    }

    const conversationId = createConversationId();
    const now = new Date();

    const conversation: ClaudeConversation = {
      id: conversationId,
      sessionId: this.state.storage!.session.id,
      model: model || 'claude-opus-4-5-20251101',
      systemPrompt,
      messageIds: [],
      subAgentIds: [],
      status: 'running',
      startedAt: now,
      tokenUsage: this.createEmptyTokenUsage(),
      metadata: this.createBaseMetadata(['conversation']),
    };

    this.state.storage!.conversations.set(conversationId, conversation);
    this.state.storage!.session.conversationIds.push(conversationId);
    this.state.currentConversationId = conversationId;

    return conversation;
  }

  /**
   * Handle hook events
   */
  handleHookEvent(event: HookEventData): void {
    switch (event.event) {
      case 'UserPromptSubmit':
        this.handleUserPrompt(event);
        break;
      case 'PreToolUse':
        this.handlePreToolUse(event);
        break;
      case 'PostToolUse':
        this.handlePostToolUse(event);
        break;
      case 'Stop':
        this.handleSessionStop(event);
        break;
      case 'PreCompact':
        this.handlePreCompact(event);
        break;
    }
  }

  /**
   * Handle user prompt submission
   */
  private handleUserPrompt(event: HookEventData): void {
    if (!this.state.currentConversationId || !this.state.storage) {
      this.startConversation();
    }

    const messageId = createMessageId();
    const now = new Date();
    const conversationId = this.state.currentConversationId!;

    const textBlock: TextContentBlock = {
      type: 'text',
      text: this.truncateContent(event.userPrompt || ''),
    };

    const message: ClaudeMessage = {
      id: messageId,
      conversationId,
      role: 'user',
      content: textBlock.text,
      contentBlocks: [textBlock],
      toolCallIds: [],
      timestamp: now,
      tokenUsage: this.createEmptyTokenUsage(),
      metadata: this.createBaseMetadata(['prompt', 'user']),
    };

    this.state.storage!.messages.set(messageId, message);

    const conversation = this.state.storage!.conversations.get(conversationId);
    if (conversation) {
      conversation.messageIds.push(messageId);
    }

    this.saveMessage(message);
  }

  /**
   * Handle pre-tool use event
   */
  private handlePreToolUse(event: HookEventData): void {
    if (!this.state.currentConversationId || !this.state.storage) {
      this.startConversation();
    }

    const toolCallId = createToolCallId();
    const now = new Date();
    const conversationId = this.state.currentConversationId!;

    // Get or create assistant message
    let lastMessageId: MessageId | undefined;
    const conversation = this.state.storage!.conversations.get(conversationId);

    if (conversation && conversation.messageIds.length > 0) {
      lastMessageId = conversation.messageIds[conversation.messageIds.length - 1];
      const lastMessage = this.state.storage!.messages.get(lastMessageId);

      if (!lastMessage || lastMessage.role === 'user') {
        // Create new assistant message
        const assistantMsgId = createMessageId();
        const assistantMessage: ClaudeMessage = {
          id: assistantMsgId,
          conversationId,
          role: 'assistant',
          content: '',
          contentBlocks: [],
          toolCallIds: [],
          timestamp: now,
          tokenUsage: this.createEmptyTokenUsage(),
          metadata: this.createBaseMetadata(['response', 'assistant']),
        };
        this.state.storage!.messages.set(assistantMsgId, assistantMessage);
        conversation.messageIds.push(assistantMsgId);
        lastMessageId = assistantMsgId;
      }
    } else {
      // Create new assistant message if no conversation exists
      const assistantMsgId = createMessageId();
      const assistantMessage: ClaudeMessage = {
        id: assistantMsgId,
        conversationId,
        role: 'assistant',
        content: '',
        contentBlocks: [],
        toolCallIds: [],
        timestamp: now,
        tokenUsage: this.createEmptyTokenUsage(),
        metadata: this.createBaseMetadata(['response', 'assistant']),
      };
      this.state.storage!.messages.set(assistantMsgId, assistantMessage);
      if (conversation) {
        conversation.messageIds.push(assistantMsgId);
      }
      lastMessageId = assistantMsgId;
    }

    const toolCall: ClaudeToolCall = {
      id: toolCallId,
      messageId: lastMessageId!,
      toolName: event.toolName || 'unknown',
      toolCategory: this.categorizeToolCall(event.toolName || ''),
      input: event.toolInput || {},
      status: 'running',
      startedAt: now,
      metadata: this.createBaseMetadata(['tool-call', event.toolName || 'unknown']),
    };

    this.state.storage!.toolCalls.set(toolCallId, toolCall);

    // Add to message's tool call list
    const message = this.state.storage!.messages.get(lastMessageId!);
    if (message) {
      message.toolCallIds = message.toolCallIds || [];
      message.toolCallIds.push(toolCallId);
    }

    // Track pending tool call by name for matching
    this.state.pendingToolCalls.set(event.toolName || 'unknown', toolCallId);

    // Check if this is a Task (sub-agent spawn)
    if (event.toolName === 'Task' && this.config.captureSubAgents) {
      this.handleSubAgentSpawn(event, toolCall);
    }

    // Check if this is a swarm operation
    if (event.toolName?.includes('swarm') && this.config.captureSwarms) {
      this.handleSwarmOperation(event, toolCall);
    }
  }

  /**
   * Handle post-tool use event
   */
  private handlePostToolUse(event: HookEventData): void {
    if (!this.state.storage) return;

    const now = new Date();

    // Find the pending tool call
    const toolCallId = this.state.pendingToolCalls.get(event.toolName || 'unknown');
    if (!toolCallId) return;

    this.state.pendingToolCalls.delete(event.toolName || 'unknown');

    const toolCall = this.state.storage.toolCalls.get(toolCallId);
    if (!toolCall) return;

    toolCall.output = this.truncateContent(event.toolOutput || '');
    toolCall.completedAt = now;
    toolCall.status = event.error ? 'failed' : 'completed';
    toolCall.executionTimeMs = event.duration;
    if (event.error) {
      toolCall.error = {
        type: 'execution_error',
        message: event.error,
      };
    }
    toolCall.metadata.updatedAt = now;

    // Track affected files for file operations
    if (toolCall.toolCategory === 'file') {
      const input = toolCall.input as Record<string, unknown>;
      const filePath = input.file_path || input.path;
      if (filePath) {
        toolCall.affectedFiles = [String(filePath)];
      }
    }

    // Handle sub-agent completion
    if (event.toolName === 'Task' && this.state.subAgentStack.length > 0) {
      this.handleSubAgentComplete(event);
    }

    this.saveToolCall(toolCall);
  }

  /**
   * Handle session stop event
   */
  private handleSessionStop(_event: HookEventData): void {
    this.endSession();
  }

  /**
   * Handle pre-compact event
   */
  private handlePreCompact(_event: HookEventData): void {
    // Save current state before compaction
    if (this.state.storage) {
      this.state.storage.session.metadata.custom = {
        ...this.state.storage.session.metadata.custom,
        lastCompaction: new Date().toISOString(),
      };
      this.saveSession(this.state.storage.session);
    }
  }

  /**
   * Handle sub-agent spawn
   */
  private handleSubAgentSpawn(event: HookEventData, toolCall: ClaudeToolCall): void {
    if (!this.state.storage || !this.state.currentConversationId) return;

    const subAgentId = createSubAgentId();
    const now = new Date();

    const input = event.toolInput as Record<string, unknown>;
    const parentConversationId = this.state.currentConversationId;
    const parentMessageId = toolCall.messageId;

    const subAgent: ClaudeSubAgent = {
      id: subAgentId,
      parentConversationId,
      parentMessageId,
      toolCallId: toolCall.id,
      agentType: (input.subagent_type as ClaudeAgentType) || 'custom',
      name: String(input.description || 'Sub-agent'),
      task: this.truncateContent(String(input.prompt || input.description || 'Unknown task')),
      model: (input.model as string) || 'claude-sonnet-4-20250514',
      status: 'running',
      startedAt: now,
      tokenUsage: this.createEmptyTokenUsage(),
      metadata: this.createBaseMetadata(['sub-agent', String(input.subagent_type || 'custom')]),
    };

    this.state.storage.subAgents.set(subAgentId, subAgent);
    this.state.subAgentStack.push(subAgentId);

    // Add to conversation's sub-agent list
    const conversation = this.state.storage.conversations.get(parentConversationId);
    if (conversation) {
      conversation.subAgentIds = conversation.subAgentIds || [];
      conversation.subAgentIds.push(subAgentId);
    }
  }

  /**
   * Handle sub-agent completion
   */
  private handleSubAgentComplete(event: HookEventData): void {
    if (!this.state.storage) return;

    const subAgentId = this.state.subAgentStack.pop();
    if (!subAgentId) return;

    const subAgent = this.state.storage.subAgents.get(subAgentId);
    if (!subAgent) return;

    const now = new Date();
    subAgent.completedAt = now;
    subAgent.status = event.error ? 'failed' : 'completed';

    // Parse result
    subAgent.result = {
      success: !event.error,
      summary: this.truncateContent(event.toolOutput || '').slice(0, 500),
      error: event.error,
    };

    subAgent.metadata.updatedAt = now;
    this.saveSubAgent(subAgent);
  }

  /**
   * Handle swarm operation
   */
  private handleSwarmOperation(event: HookEventData, _toolCall: ClaudeToolCall): void {
    if (!this.state.storage) return;

    const input = event.toolInput as Record<string, unknown>;

    if (event.toolName?.includes('swarm_init')) {
      const swarmId = createSwarmId();
      const now = new Date();

      const swarm: ClaudeSwarm = {
        id: swarmId,
        sessionId: this.state.storage.session.id,
        name: String(input.name || 'Swarm'),
        topology: (input.topology as SwarmTopology) || 'mesh',
        strategy: (input.strategy as SwarmStrategy) || 'adaptive',
        maxAgents: (input.maxAgents as number) || 8,
        agentIds: [],
        task: String(input.task || 'Swarm task'),
        status: 'running',
        startedAt: now,
        tokenUsage: this.createEmptyAggregatedTokenUsage(),
        metadata: this.createBaseMetadata(['swarm']),
      };

      this.state.storage.swarms.set(swarmId, swarm);
      this.state.storage.session.swarmIds = this.state.storage.session.swarmIds || [];
      this.state.storage.session.swarmIds.push(swarmId);
      this.state.activeSwarmId = swarmId;
    }
  }

  /**
   * Categorize tool calls
   */
  private categorizeToolCall(toolName: string): ToolCategory {
    const categories: Record<string, ToolCategory> = {
      Read: 'file',
      Write: 'file',
      Edit: 'file',
      MultiEdit: 'file',
      Glob: 'file',
      Grep: 'file',
      Bash: 'bash',
      Task: 'task',
      WebFetch: 'search',
      WebSearch: 'search',
      TodoWrite: 'todo',
      NotebookEdit: 'notebook',
      Skill: 'skill',
    };

    if (toolName.startsWith('mcp__')) {
      return 'mcp';
    }

    return categories[toolName] || 'other';
  }

  /**
   * Aggregate session tokens
   */
  private aggregateSessionTokens(): void {
    if (!this.state.storage) return;

    let totalInput = 0;
    let totalOutput = 0;
    let operationCount = 0;

    for (const conversation of this.state.storage.conversations.values()) {
      totalInput += conversation.tokenUsage.inputTokens;
      totalOutput += conversation.tokenUsage.outputTokens;
      operationCount++;
    }

    this.state.storage.session.tokenUsage = {
      inputTokens: totalInput,
      outputTokens: totalOutput,
      totalTokens: totalInput + totalOutput,
      operationCount,
    };
  }

  /**
   * Truncate content to max length
   */
  private truncateContent(content: string): string {
    if (content.length <= this.config.maxContentLength) {
      return content;
    }
    return content.slice(0, this.config.maxContentLength) + '\n\n[... truncated ...]';
  }

  /**
   * Get storage path for an entity
   */
  private getStoragePath(type: string, id: string): string {
    const dir = join(this.projectRoot, this.config.storageDir, type);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return join(dir, `${id}.json`);
  }

  /**
   * Get markdown path for an entity
   */
  private getMarkdownPath(type: string, id: string): string {
    const dir = join(this.projectRoot, this.config.storageDir, 'docs', type);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return join(dir, `${id}.md`);
  }

  /**
   * Save session to storage
   */
  private saveSession(session: ClaudeSession): void {
    const path = this.getStoragePath('sessions', session.id);
    writeFileSync(path, JSON.stringify(session, null, 2));

    if (this.config.createMarkdown) {
      this.saveSessionMarkdown(session);
    }
  }

  /**
   * Save session as markdown
   */
  private saveSessionMarkdown(session: ClaudeSession): void {
    const path = this.getMarkdownPath('sessions', session.id);

    const content = `---
title: "${session.name}"
type: claude-session
status: ${session.status}
created: ${session.startedAt.toISOString()}
updated: ${session.metadata.updatedAt.toISOString()}
tags: [${session.metadata.tags.join(', ')}]
session_id: "${session.id}"
---

# ${session.name}

**Purpose:** ${session.purpose || 'General interaction'}

**Started:** ${session.startedAt.toISOString()}
${session.endedAt ? `**Ended:** ${session.endedAt.toISOString()}` : '**Status:** In Progress'}

## Environment

- **Working Directory:** ${session.environment?.workingDirectory || 'Unknown'}
${session.environment?.gitBranch ? `- **Git Branch:** ${session.environment.gitBranch}` : ''}

## Conversations

${session.conversationIds.map(id => `- [[${id}]]`).join('\n') || 'No conversations yet'}

## Token Usage

| Metric | Count |
|--------|-------|
| Input Tokens | ${session.tokenUsage.inputTokens} |
| Output Tokens | ${session.tokenUsage.outputTokens} |
| Total Tokens | ${session.tokenUsage.totalTokens} |
| Operations | ${session.tokenUsage.operationCount} |

---
> Captured by kg-agent hook system
`;

    writeFileSync(path, content);
  }

  /**
   * Save message to storage
   */
  private saveMessage(message: ClaudeMessage): void {
    if (this.config.createMarkdown) {
      this.appendToConversationLog(message);
    }
  }

  /**
   * Append message to conversation log
   */
  private appendToConversationLog(message: ClaudeMessage): void {
    const path = this.getMarkdownPath('conversations', message.conversationId);
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Initialize file with header if new
    if (!existsSync(path)) {
      const header = `---
title: "Conversation ${message.conversationId}"
type: claude-conversation
created: ${message.timestamp.toISOString()}
tags: [${this.config.defaultTags.join(', ')}]
---

# Conversation Log

`;
      writeFileSync(path, header);
    }

    const roleIcon = message.role === 'user' ? '👤' : '🤖';

    const entry = `
## ${roleIcon} ${message.role.charAt(0).toUpperCase() + message.role.slice(1)} - ${message.timestamp.toISOString()}

${message.content}

${message.toolCallIds && message.toolCallIds.length > 0 ? `**Tool Calls:** ${message.toolCallIds.join(', ')}` : ''}

---
`;

    appendFileSync(path, entry);
  }

  /**
   * Save tool call to storage
   */
  private saveToolCall(toolCall: ClaudeToolCall): void {
    if (this.config.separateToolOutputs && toolCall.output) {
      const path = this.getStoragePath('tool-outputs', toolCall.id);
      writeFileSync(
        path,
        JSON.stringify(
          {
            id: toolCall.id,
            name: toolCall.toolName,
            category: toolCall.toolCategory,
            input: toolCall.input,
            output: toolCall.output,
            status: toolCall.status,
            executionTimeMs: toolCall.executionTimeMs,
            affectedFiles: toolCall.affectedFiles,
            timestamp: toolCall.completedAt?.toISOString(),
          },
          null,
          2
        )
      );
    }
  }

  /**
   * Save sub-agent to storage
   */
  private saveSubAgent(subAgent: ClaudeSubAgent): void {
    const path = this.getStoragePath('agents', subAgent.id);
    writeFileSync(path, JSON.stringify(subAgent, null, 2));

    if (this.config.createMarkdown) {
      this.saveSubAgentMarkdown(subAgent);
    }
  }

  /**
   * Save sub-agent as markdown
   */
  private saveSubAgentMarkdown(subAgent: ClaudeSubAgent): void {
    const path = this.getMarkdownPath('agents', subAgent.id);

    const content = `---
title: "Sub-Agent: ${subAgent.name.slice(0, 50)}"
type: claude-agent
status: ${subAgent.status}
agent_type: ${subAgent.agentType}
created: ${subAgent.startedAt.toISOString()}
tags: [${subAgent.metadata.tags.join(', ')}]
---

# Sub-Agent: ${subAgent.agentType}

**Name:** ${subAgent.name}
**Task:** ${subAgent.task.slice(0, 200)}${subAgent.task.length > 200 ? '...' : ''}

**Status:** ${subAgent.status}
**Model:** ${subAgent.model}
**Spawned:** ${subAgent.startedAt.toISOString()}
${subAgent.completedAt ? `**Completed:** ${subAgent.completedAt.toISOString()}` : ''}

## Task Description

\`\`\`
${subAgent.task}
\`\`\`

${
  subAgent.result
    ? `
## Result

**Success:** ${subAgent.result.success}

${subAgent.result.summary ? `### Summary\n${subAgent.result.summary}` : ''}

${subAgent.result.error ? `### Error\n\`\`\`\n${subAgent.result.error}\n\`\`\`` : ''}
`
    : ''
}

---
> Captured by kg-agent hook system
`;

    writeFileSync(path, content);
  }

  /**
   * Get current session
   */
  getCurrentSession(): ClaudeSession | null {
    return this.state.storage?.session || null;
  }

  /**
   * Get current conversation
   */
  getCurrentConversation(): ClaudeConversation | null {
    if (!this.state.storage || !this.state.currentConversationId) return null;
    return this.state.storage.conversations.get(this.state.currentConversationId) || null;
  }

  /**
   * Load session from storage
   */
  loadSession(sessionId: SessionId): ClaudeSession | null {
    const path = this.getStoragePath('sessions', sessionId);
    if (!existsSync(path)) return null;

    try {
      const data = readFileSync(path, 'utf-8');
      return JSON.parse(data) as ClaudeSession;
    } catch {
      return null;
    }
  }

  /**
   * List all stored sessions
   */
  listSessions(): SessionId[] {
    const sessionsDir = join(this.projectRoot, this.config.storageDir, 'sessions');
    if (!existsSync(sessionsDir)) return [];

    try {
      const { readdirSync } = require('fs');
      const files = readdirSync(sessionsDir) as string[];
      return files
        .filter((f: string) => f.endsWith('.json'))
        .map((f: string) => f.replace('.json', '') as SessionId);
    } catch {
      return [];
    }
  }
}

/**
 * Process hook event from stdin (for use as CLI hook)
 */
export async function processHookEvent(
  projectRoot: string,
  eventType: HookEventType,
  config?: Partial<CaptureConfig>
): Promise<void> {
  const capture = new HookCaptureSystem(projectRoot, config);

  // Read event data from stdin
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const inputData = Buffer.concat(chunks).toString('utf-8');

  let eventData: HookEventData;

  try {
    const parsed = JSON.parse(inputData);
    eventData = {
      event: eventType,
      timestamp: new Date().toISOString(),
      toolName: parsed.tool_name || process.env.TOOL_NAME,
      toolInput: parsed.tool_input,
      toolOutput: parsed.tool_output,
      userPrompt: parsed.user_prompt || inputData,
      metadata: parsed,
    };
  } catch {
    // Plain text input (e.g., user prompt)
    eventData = {
      event: eventType,
      timestamp: new Date().toISOString(),
      userPrompt: inputData,
    };
  }

  capture.handleHookEvent(eventData);
}

/**
 * Generate Claude Code hook configuration
 */
export function generateHookConfig(projectRoot: string): Record<string, unknown> {
  const kgBinPath = 'npx @weavelogic/knowledge-graph-agent';

  return {
    hooks: {
      UserPromptSubmit: [
        {
          type: 'command',
          command: `${kgBinPath} hooks capture --event UserPromptSubmit --path "${projectRoot}"`,
        },
      ],
      PreToolUse: [
        {
          type: 'command',
          command: `${kgBinPath} hooks capture --event PreToolUse --path "${projectRoot}"`,
        },
      ],
      PostToolUse: [
        {
          type: 'command',
          command: `${kgBinPath} hooks capture --event PostToolUse --path "${projectRoot}"`,
        },
      ],
      Stop: [
        {
          type: 'command',
          command: `${kgBinPath} hooks capture --event Stop --path "${projectRoot}"`,
        },
      ],
    },
  };
}

export default HookCaptureSystem;
