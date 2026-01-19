/**
 * Hook Capture System
 *
 * Captures all Claude interactions (prompts, responses, tool calls)
 * and stores them in the knowledge graph with hierarchical structure.
 *
 * @module claude/hook-capture
 */
import { SessionId, ClaudeSession, ClaudeConversation } from './types.js';
/**
 * Hook event types from Claude Code
 */
export type HookEventType = 'PreToolUse' | 'PostToolUse' | 'UserPromptSubmit' | 'Stop' | 'PreCompact';
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
export declare const DEFAULT_CAPTURE_CONFIG: CaptureConfig;
/**
 * Hook Capture System
 *
 * Manages the capture and storage of all Claude interactions.
 */
export declare class HookCaptureSystem {
    private config;
    private state;
    private projectRoot;
    constructor(projectRoot: string, config?: Partial<CaptureConfig>);
    /**
     * Ensure storage directory exists
     */
    private ensureStorageDir;
    /**
     * Create empty token usage
     */
    private createEmptyTokenUsage;
    /**
     * Create empty aggregated token usage
     */
    private createEmptyAggregatedTokenUsage;
    /**
     * Create base metadata
     */
    private createBaseMetadata;
    /**
     * Get current git branch
     */
    private getGitBranch;
    /**
     * Start a new session
     */
    startSession(name?: string, purpose?: string): ClaudeSession;
    /**
     * End the current session
     */
    endSession(): ClaudeSession | null;
    /**
     * Start a new conversation
     */
    startConversation(model?: string, systemPrompt?: string): ClaudeConversation;
    /**
     * Handle hook events
     */
    handleHookEvent(event: HookEventData): void;
    /**
     * Handle user prompt submission
     */
    private handleUserPrompt;
    /**
     * Handle pre-tool use event
     */
    private handlePreToolUse;
    /**
     * Handle post-tool use event
     */
    private handlePostToolUse;
    /**
     * Handle session stop event
     */
    private handleSessionStop;
    /**
     * Handle pre-compact event
     */
    private handlePreCompact;
    /**
     * Handle sub-agent spawn
     */
    private handleSubAgentSpawn;
    /**
     * Handle sub-agent completion
     */
    private handleSubAgentComplete;
    /**
     * Handle swarm operation
     */
    private handleSwarmOperation;
    /**
     * Categorize tool calls
     */
    private categorizeToolCall;
    /**
     * Aggregate session tokens
     */
    private aggregateSessionTokens;
    /**
     * Truncate content to max length
     */
    private truncateContent;
    /**
     * Get storage path for an entity
     */
    private getStoragePath;
    /**
     * Get markdown path for an entity
     */
    private getMarkdownPath;
    /**
     * Save session to storage
     */
    private saveSession;
    /**
     * Save session as markdown
     */
    private saveSessionMarkdown;
    /**
     * Save message to storage
     */
    private saveMessage;
    /**
     * Append message to conversation log
     */
    private appendToConversationLog;
    /**
     * Save tool call to storage
     */
    private saveToolCall;
    /**
     * Save sub-agent to storage
     */
    private saveSubAgent;
    /**
     * Save sub-agent as markdown
     */
    private saveSubAgentMarkdown;
    /**
     * Get current session
     */
    getCurrentSession(): ClaudeSession | null;
    /**
     * Get current conversation
     */
    getCurrentConversation(): ClaudeConversation | null;
    /**
     * Load session from storage
     */
    loadSession(sessionId: SessionId): ClaudeSession | null;
    /**
     * List all stored sessions
     */
    listSessions(): SessionId[];
}
/**
 * Process hook event from stdin (for use as CLI hook)
 */
export declare function processHookEvent(projectRoot: string, eventType: HookEventType, config?: Partial<CaptureConfig>): Promise<void>;
/**
 * Generate Claude Code hook configuration
 */
export declare function generateHookConfig(projectRoot: string): Record<string, unknown>;
export default HookCaptureSystem;
//# sourceMappingURL=hook-capture.d.ts.map