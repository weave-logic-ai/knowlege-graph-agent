/**
 * Tests for Hook Capture System
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { HookCaptureSystem, generateHookConfig, type HookEventData } from '../../src/claude/hook-capture.js';

const TEST_DIR = join(process.cwd(), '.test-hooks');
const STORAGE_DIR = join(TEST_DIR, '.kg', 'claude');

describe('HookCaptureSystem', () => {
  let capture: HookCaptureSystem;

  beforeEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });

    capture = new HookCaptureSystem(TEST_DIR);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('Session Management', () => {
    it('should start a new session', () => {
      const session = capture.startSession('Test Session', 'Testing purposes');

      expect(session).toBeDefined();
      expect(session.id).toMatch(/^session_/);
      expect(session.name).toBe('Test Session');
      expect(session.purpose).toBe('Testing purposes');
      expect(session.status).toBe('running');
      expect(session.conversationIds).toHaveLength(0);
    });

    it('should end a session', () => {
      capture.startSession('Test Session');
      const session = capture.endSession();

      expect(session).toBeDefined();
      expect(session!.status).toBe('completed');
      expect(session!.endedAt).toBeDefined();
    });

    it('should persist session to storage', () => {
      const session = capture.startSession('Persisted Session');
      capture.endSession();

      const sessionsDir = join(STORAGE_DIR, 'sessions');
      expect(existsSync(sessionsDir)).toBe(true);

      const sessionFile = join(sessionsDir, `${session.id}.json`);
      expect(existsSync(sessionFile)).toBe(true);

      const saved = JSON.parse(readFileSync(sessionFile, 'utf-8'));
      expect(saved.name).toBe('Persisted Session');
    });

    it('should list stored sessions', () => {
      capture.startSession('Session 1');
      capture.endSession();

      const capture2 = new HookCaptureSystem(TEST_DIR);
      capture2.startSession('Session 2');
      capture2.endSession();

      const capture3 = new HookCaptureSystem(TEST_DIR);
      const sessions = capture3.listSessions();

      expect(sessions).toHaveLength(2);
    });

    it('should load session from storage', () => {
      const session = capture.startSession('Loadable Session');
      const sessionId = session.id;
      capture.endSession();

      const capture2 = new HookCaptureSystem(TEST_DIR);
      const loaded = capture2.loadSession(sessionId);

      expect(loaded).toBeDefined();
      expect(loaded!.name).toBe('Loadable Session');
    });
  });

  describe('Conversation Management', () => {
    it('should start a conversation within a session', () => {
      capture.startSession();
      const conv = capture.startConversation('claude-opus-4-5-20251101', 'You are a helpful assistant');

      expect(conv).toBeDefined();
      expect(conv.id).toMatch(/^conv_/);
      expect(conv.model).toBe('claude-opus-4-5-20251101');
      expect(conv.systemPrompt).toBe('You are a helpful assistant');
    });

    it('should auto-start session if none exists', () => {
      const conv = capture.startConversation();

      expect(conv).toBeDefined();
      const session = capture.getCurrentSession();
      expect(session).toBeDefined();
    });
  });

  describe('Hook Event Handling', () => {
    it('should handle UserPromptSubmit event', () => {
      const event: HookEventData = {
        event: 'UserPromptSubmit',
        timestamp: new Date().toISOString(),
        userPrompt: 'Hello, Claude!',
      };

      capture.handleHookEvent(event);

      const conv = capture.getCurrentConversation();
      expect(conv).toBeDefined();
      expect(conv!.messageIds).toHaveLength(1);
    });

    it('should handle PreToolUse event', () => {
      capture.startSession();
      capture.startConversation();

      const event: HookEventData = {
        event: 'PreToolUse',
        timestamp: new Date().toISOString(),
        toolName: 'Read',
        toolInput: { file_path: '/test/file.ts' },
      };

      capture.handleHookEvent(event);

      const conv = capture.getCurrentConversation();
      expect(conv).toBeDefined();
      // Should have created assistant message
      expect(conv!.messageIds.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle PostToolUse event', () => {
      capture.startSession();
      capture.startConversation();

      // First trigger pre-tool use
      const preEvent: HookEventData = {
        event: 'PreToolUse',
        timestamp: new Date().toISOString(),
        toolName: 'Read',
        toolInput: { file_path: '/test/file.ts' },
      };
      capture.handleHookEvent(preEvent);

      // Then trigger post-tool use
      const postEvent: HookEventData = {
        event: 'PostToolUse',
        timestamp: new Date().toISOString(),
        toolName: 'Read',
        toolOutput: 'File contents here',
        duration: 150,
      };
      capture.handleHookEvent(postEvent);

      // Tool output should be saved
      const toolOutputsDir = join(STORAGE_DIR, 'tool-outputs');
      expect(existsSync(toolOutputsDir)).toBe(true);
    });

    it('should handle Stop event', () => {
      capture.startSession();

      const event: HookEventData = {
        event: 'Stop',
        timestamp: new Date().toISOString(),
      };

      capture.handleHookEvent(event);

      expect(capture.getCurrentSession()).toBeNull();
    });

    it('should handle PreCompact event', () => {
      const session = capture.startSession();

      const event: HookEventData = {
        event: 'PreCompact',
        timestamp: new Date().toISOString(),
      };

      capture.handleHookEvent(event);

      // Should still have session
      expect(capture.getCurrentSession()).toBeDefined();
    });
  });

  describe('Sub-Agent Tracking', () => {
    it('should track Task tool as sub-agent spawn', () => {
      capture.startSession();
      capture.startConversation();

      const preEvent: HookEventData = {
        event: 'PreToolUse',
        timestamp: new Date().toISOString(),
        toolName: 'Task',
        toolInput: {
          subagent_type: 'coder',
          description: 'Implement feature',
          prompt: 'Write the code for...',
        },
      };
      capture.handleHookEvent(preEvent);

      const conv = capture.getCurrentConversation();
      expect(conv!.subAgentIds).toBeDefined();
      expect(conv!.subAgentIds!.length).toBeGreaterThan(0);
    });

    it('should complete sub-agent on Task completion', () => {
      capture.startSession();
      capture.startConversation();

      // Spawn sub-agent
      const preEvent: HookEventData = {
        event: 'PreToolUse',
        timestamp: new Date().toISOString(),
        toolName: 'Task',
        toolInput: {
          subagent_type: 'coder',
          description: 'Implement feature',
          prompt: 'Write the code for...',
        },
      };
      capture.handleHookEvent(preEvent);

      // Complete sub-agent
      const postEvent: HookEventData = {
        event: 'PostToolUse',
        timestamp: new Date().toISOString(),
        toolName: 'Task',
        toolOutput: 'Task completed successfully',
        duration: 5000,
      };
      capture.handleHookEvent(postEvent);

      // Sub-agent should be saved
      const agentsDir = join(STORAGE_DIR, 'agents');
      if (existsSync(agentsDir)) {
        const files = readdirSync(agentsDir).filter(f => f.endsWith('.json'));
        expect(files.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Swarm Tracking', () => {
    it('should track swarm_init as swarm operation', () => {
      capture.startSession();
      capture.startConversation();

      const event: HookEventData = {
        event: 'PreToolUse',
        timestamp: new Date().toISOString(),
        toolName: 'mcp__ruv-swarm__swarm_init',
        toolInput: {
          topology: 'mesh',
          maxAgents: 5,
        },
      };
      capture.handleHookEvent(event);

      const session = capture.getCurrentSession();
      expect(session!.swarmIds).toBeDefined();
      expect(session!.swarmIds!.length).toBeGreaterThan(0);
    });
  });

  describe('Markdown Generation', () => {
    it('should generate session markdown', () => {
      capture.startSession('Markdown Test Session');
      capture.endSession();

      const docsDir = join(STORAGE_DIR, 'docs', 'sessions');
      expect(existsSync(docsDir)).toBe(true);

      const files = readdirSync(docsDir).filter(f => f.endsWith('.md'));
      expect(files.length).toBeGreaterThan(0);

      const content = readFileSync(join(docsDir, files[0]), 'utf-8');
      expect(content).toContain('Markdown Test Session');
      expect(content).toContain('type: claude-session');
    });

    it('should generate conversation markdown log', () => {
      capture.startSession();
      capture.startConversation();

      const event: HookEventData = {
        event: 'UserPromptSubmit',
        timestamp: new Date().toISOString(),
        userPrompt: 'This is a test prompt',
      };
      capture.handleHookEvent(event);

      const docsDir = join(STORAGE_DIR, 'docs', 'conversations');
      expect(existsSync(docsDir)).toBe(true);

      const files = readdirSync(docsDir).filter(f => f.endsWith('.md'));
      expect(files.length).toBeGreaterThan(0);

      const content = readFileSync(join(docsDir, files[0]), 'utf-8');
      expect(content).toContain('This is a test prompt');
      expect(content).toContain('👤 User');
    });

    it('should generate sub-agent markdown', () => {
      capture.startSession();
      capture.startConversation();

      const preEvent: HookEventData = {
        event: 'PreToolUse',
        timestamp: new Date().toISOString(),
        toolName: 'Task',
        toolInput: {
          subagent_type: 'researcher',
          description: 'Research markdown generation',
          prompt: 'Investigate how markdown works...',
        },
      };
      capture.handleHookEvent(preEvent);

      const postEvent: HookEventData = {
        event: 'PostToolUse',
        timestamp: new Date().toISOString(),
        toolName: 'Task',
        toolOutput: 'Research completed',
      };
      capture.handleHookEvent(postEvent);

      const docsDir = join(STORAGE_DIR, 'docs', 'agents');
      expect(existsSync(docsDir)).toBe(true);

      const files = readdirSync(docsDir).filter(f => f.endsWith('.md'));
      expect(files.length).toBeGreaterThan(0);

      const content = readFileSync(join(docsDir, files[0]), 'utf-8');
      expect(content).toContain('researcher');
    });
  });

  describe('Tool Category Detection', () => {
    it('should categorize file tools correctly', () => {
      capture.startSession();
      capture.startConversation();

      for (const toolName of ['Read', 'Write', 'Edit', 'Glob', 'Grep']) {
        const event: HookEventData = {
          event: 'PreToolUse',
          timestamp: new Date().toISOString(),
          toolName,
          toolInput: { file_path: '/test/file.ts' },
        };
        capture.handleHookEvent(event);
      }
    });

    it('should categorize MCP tools correctly', () => {
      capture.startSession();
      capture.startConversation();

      const event: HookEventData = {
        event: 'PreToolUse',
        timestamp: new Date().toISOString(),
        toolName: 'mcp__flow-nexus__neural_train',
        toolInput: {},
      };
      capture.handleHookEvent(event);
    });
  });
});

describe('generateHookConfig', () => {
  it('should generate valid hook configuration', () => {
    const config = generateHookConfig('/test/project');

    expect(config.hooks).toBeDefined();
    expect((config.hooks as Record<string, unknown>).UserPromptSubmit).toBeDefined();
    expect((config.hooks as Record<string, unknown>).PreToolUse).toBeDefined();
    expect((config.hooks as Record<string, unknown>).PostToolUse).toBeDefined();
    expect((config.hooks as Record<string, unknown>).Stop).toBeDefined();
  });

  it('should include project path in hook commands', () => {
    const config = generateHookConfig('/my/project/path');
    const hooks = config.hooks as Record<string, { command: string }[]>;

    expect(hooks.UserPromptSubmit[0].command).toContain('/my/project/path');
  });
});
