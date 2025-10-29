/**
 * Knowledge Graph Workflow Integration Tests
 *
 * End-to-end tests validating the complete workflow system:
 * - Context analysis integration
 * - Git integration with real repository
 * - Workflow lifecycle management
 * - Document connection workflow
 * - Error handling and rollback
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowIntegration } from '../../../src/workflows/kg/workflow-integration.js';
import { createDocumentConnectionWorkflow } from '../../../src/workflows/kg/document-connection.js';
import { WorkflowEngine } from '../../../src/workflow-engine/index.js';
import type { FileEvent } from '../../../src/file-watcher/types.js';
import fs from 'fs/promises';
import path from 'path';
import { simpleGit } from 'simple-git';
import os from 'os';

describe('Knowledge Graph Workflow Integration', () => {
  let testVaultRoot: string;
  let integration: WorkflowIntegration;
  let engine: WorkflowEngine;

  beforeEach(async () => {
    // Create temporary test vault
    testVaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'weaver-test-'));

    // Initialize git repository
    const git = simpleGit(testVaultRoot);
    await git.init();
    await git.addConfig('user.name', 'Test User');
    await git.addConfig('user.email', 'test@example.com');

    // Create initial commit
    await fs.writeFile(path.join(testVaultRoot, '.gitkeep'), '');
    await git.add('.gitkeep');
    await git.commit('Initial commit');

    // Create integration and engine instances
    integration = new WorkflowIntegration(testVaultRoot);
    engine = new WorkflowEngine();
  });

  afterEach(async () => {
    // Cleanup test vault
    try {
      await fs.rm(testVaultRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('WorkflowIntegration', () => {
    it('should prepare workflow with context and git branch', async () => {
      // Create test file
      const testFile = path.join(testVaultRoot, 'test.md');
      await fs.writeFile(testFile, '# Test Document\n\nTest content');

      const fileEvent: FileEvent = {
        type: 'add',
        path: testFile,
        relativePath: 'test.md',
        timestamp: new Date(),
      };

      const workflowContext = {
        workflowId: 'test-workflow',
        trigger: 'file:add' as const,
        triggeredAt: new Date(),
        fileEvent,
      };

      // Prepare workflow
      const { context, branchName } = await integration.prepareWorkflow(
        'test-workflow',
        workflowContext
      );

      // Verify context was built
      expect(context).toBeDefined();
      expect(context.filePath).toBe('test.md');
      expect(context.directory).toBeDefined();
      expect(context.temporal).toBeDefined();
      expect(context.primitives).toBeDefined();

      // Verify git branch was created
      expect(branchName).toBeDefined();
      expect(branchName).toMatch(/^workflow\/test-workflow-\d+$/);

      const git = simpleGit(testVaultRoot);
      const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
      expect(currentBranch.trim()).toBe(branchName);
    });

    it('should prepare workflow in dry-run mode without creating branch', async () => {
      const testFile = path.join(testVaultRoot, 'test.md');
      await fs.writeFile(testFile, '# Test Document');

      const fileEvent: FileEvent = {
        type: 'add',
        path: testFile,
        relativePath: 'test.md',
        timestamp: new Date(),
      };

      const workflowContext = {
        workflowId: 'test-workflow',
        trigger: 'file:add' as const,
        triggeredAt: new Date(),
        fileEvent,
      };

      // Prepare workflow in dry-run mode
      const { context, branchName } = await integration.prepareWorkflow(
        'test-workflow',
        workflowContext,
        { dryRun: true }
      );

      // Context should be built
      expect(context).toBeDefined();

      // Branch should NOT be created
      expect(branchName).toBeUndefined();

      // Should still be on master
      const git = simpleGit(testVaultRoot);
      const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
      expect(currentBranch.trim()).toBe('master');
    });

    it('should commit workflow changes with metadata', async () => {
      // Create and modify test file
      const testFile = path.join(testVaultRoot, 'test.md');
      await fs.writeFile(testFile, '# Test Document\n\nModified content');

      const fileEvent: FileEvent = {
        type: 'change',
        path: testFile,
        relativePath: 'test.md',
        timestamp: new Date(),
      };

      const workflowContext = {
        workflowId: 'test-workflow',
        trigger: 'file:change' as const,
        triggeredAt: new Date(),
        fileEvent,
      };

      // Prepare workflow (creates branch)
      await integration.prepareWorkflow('test-workflow', workflowContext);

      // Commit changes
      const commitSha = await integration.commitWorkflow(
        'test-workflow',
        'Test commit message',
        [testFile],
        { testMetadata: 'test-value' }
      );

      expect(commitSha).toBeDefined();
      expect(commitSha).toMatch(/^[0-9a-f]+$/);

      // Verify commit was created
      const git = simpleGit(testVaultRoot);
      const log = await git.log();

      // Get full commit body
      const commitMessage = await git.show(['--format=%B', '-s', 'HEAD']);

      expect(commitMessage).toContain('Test commit message');
      expect(commitMessage).toContain('Workflow-Id: test-workflow');
      expect(commitMessage).toContain('testMetadata');
    });

    it('should cleanup successfully on workflow success', async () => {
      const testFile = path.join(testVaultRoot, 'test.md');
      await fs.writeFile(testFile, '# Test');

      const fileEvent: FileEvent = {
        type: 'add',
        path: testFile,
        relativePath: 'test.md',
        timestamp: new Date(),
      };

      const workflowContext = {
        workflowId: 'test-workflow',
        trigger: 'file:add' as const,
        triggeredAt: new Date(),
        fileEvent,
      };

      // Prepare workflow
      const { branchName } = await integration.prepareWorkflow('test-workflow', workflowContext);

      // Cleanup on success
      await integration.cleanupWorkflow(true, branchName);

      // Branch should still exist for review
      const git = simpleGit(testVaultRoot);
      const branches = await git.branchLocal();
      expect(branches.all).toContain(branchName!);
    });

    it('should rollback changes on workflow failure', async () => {
      const testFile = path.join(testVaultRoot, 'test.md');
      await fs.writeFile(testFile, '# Original content');

      // Create initial commit
      const git = simpleGit(testVaultRoot);
      await git.add('test.md');
      await git.commit('Add test file');

      const fileEvent: FileEvent = {
        type: 'change',
        path: testFile,
        relativePath: 'test.md',
        timestamp: new Date(),
      };

      const workflowContext = {
        workflowId: 'test-workflow',
        trigger: 'file:change' as const,
        triggeredAt: new Date(),
        fileEvent,
      };

      // Prepare workflow
      const { branchName } = await integration.prepareWorkflow('test-workflow', workflowContext);

      // Make uncommitted changes
      await fs.writeFile(testFile, '# Modified content');

      // Cleanup on failure (should rollback)
      await integration.cleanupWorkflow(false, branchName, true);

      // Changes should be rolled back
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('# Original content');

      // Branch should be deleted
      const branches = await git.branchLocal();
      expect(branches.all).not.toContain(branchName!);
    });

    it('should execute complete workflow with handler', async () => {
      const testFile = path.join(testVaultRoot, 'test.md');
      await fs.writeFile(testFile, '# Test Document');

      const fileEvent: FileEvent = {
        type: 'add',
        path: testFile,
        relativePath: 'test.md',
        timestamp: new Date(),
      };

      const workflowContext = {
        workflowId: 'test-workflow',
        trigger: 'file:add' as const,
        triggeredAt: new Date(),
        fileEvent,
      };

      // Execute workflow with handler
      const result = await integration.executeWorkflow(
        'test-workflow',
        workflowContext,
        async (context) => {
          // Verify context is provided
          expect(context).toBeDefined();
          expect(context.filePath).toBe('test.md');

          // Modify file
          await fs.writeFile(testFile, '# Modified by workflow');

          return [testFile];
        },
        { metadata: { test: 'execution' } }
      );

      // Verify result
      expect(result.success).toBe(true);
      expect(result.branchName).toBeDefined();
      expect(result.filesModified).toEqual([testFile]);
      expect(result.context).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);

      // Verify commit was created
      const git = simpleGit(testVaultRoot);
      const commitMessage = await git.show(['--format=%B', '-s', 'HEAD']);
      expect(commitMessage).toContain('test-workflow');
    });

    it('should handle workflow execution errors gracefully', async () => {
      const testFile = path.join(testVaultRoot, 'test.md');
      await fs.writeFile(testFile, '# Test');

      const fileEvent: FileEvent = {
        type: 'add',
        path: testFile,
        relativePath: 'test.md',
        timestamp: new Date(),
      };

      const workflowContext = {
        workflowId: 'test-workflow',
        trigger: 'file:add' as const,
        triggeredAt: new Date(),
        fileEvent,
      };

      // Execute workflow that throws error
      const result = await integration.executeWorkflow(
        'test-workflow',
        workflowContext,
        async () => {
          throw new Error('Workflow handler failed');
        }
      );

      // Verify error was captured
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Workflow handler failed');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should get current git status', async () => {
      const status = await integration.getGitStatus();

      expect(status.currentBranch).toBe('master');
      expect(status.hasChanges).toBe(false);
      expect(status.modifiedFiles).toEqual([]);
    });

    it('should build context without workflow execution', async () => {
      const testFile = path.join(testVaultRoot, 'test.md');
      await fs.writeFile(testFile, '# Test Document\n\nContent with **markdown**');

      const fileEvent: FileEvent = {
        type: 'add',
        path: testFile,
        relativePath: 'test.md',
        timestamp: new Date(),
      };

      const context = await integration.buildContext(fileEvent);

      expect(context).toBeDefined();
      expect(context.filePath).toBe('test.md');
      expect(context.directory.purpose).toBeDefined();
      expect(context.temporal.recentFiles).toBeDefined();
      expect(context.primitives.domain).toBeDefined();
    });
  });

  describe('Document Connection Workflow', () => {
    it('should register with workflow engine', async () => {
      await engine.initialize(testVaultRoot);

      const workflow = engine.getRegistry().getWorkflow('document-connection');

      expect(workflow).toBeDefined();
      expect(workflow?.id).toBe('document-connection');
      expect(workflow?.name).toBe('Document Connection');
      expect(workflow?.enabled).toBe(true);
      expect(workflow?.triggers).toContain('file:add');
      expect(workflow?.triggers).toContain('file:change');
    });

    it('should connect documents with similar context', async () => {
      // Create related documents
      await fs.mkdir(path.join(testVaultRoot, 'docs'), { recursive: true });

      await fs.writeFile(
        path.join(testVaultRoot, 'docs', 'api-design.md'),
        `---
title: API Design
tags: [backend, api, rest]
---

# API Design

REST API patterns and best practices.
`
      );

      await fs.writeFile(
        path.join(testVaultRoot, 'docs', 'database.md'),
        `---
title: Database Schema
tags: [backend, database, postgres]
---

# Database Schema

PostgreSQL schema design.
`
      );

      // Commit existing files
      const git = simpleGit(testVaultRoot);
      await git.add('.');
      await git.commit('Add existing docs');

      // Create new related document
      const newDocPath = path.join(testVaultRoot, 'docs', 'authentication.md');
      await fs.writeFile(
        newDocPath,
        `---
title: Authentication
tags: [backend, api, security]
---

# Authentication

JWT authentication patterns.
`
      );

      // Initialize engine and trigger workflow
      await engine.initialize(testVaultRoot);
      await engine.start();

      const fileEvent: FileEvent = {
        type: 'add',
        path: newDocPath,
        relativePath: 'docs/authentication.md',
        timestamp: new Date(),
      };

      await engine.triggerFileEvent(fileEvent);

      // Wait for workflow to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify connections were added
      const content = await fs.readFile(newDocPath, 'utf-8');
      expect(content).toContain('related_to');
      expect(content).toContain('Related Documents');

      // Should connect to api-design.md (shares backend + api tags)
      expect(content).toContain('api-design');
    });

    it('should not create connections when no similar documents exist', async () => {
      const testFile = path.join(testVaultRoot, 'isolated.md');
      await fs.writeFile(
        testFile,
        `---
title: Isolated Document
tags: [unique, standalone]
---

# Isolated

This document has no related documents.
`
      );

      await engine.initialize(testVaultRoot);
      await engine.start();

      const fileEvent: FileEvent = {
        type: 'add',
        path: testFile,
        relativePath: 'isolated.md',
        timestamp: new Date(),
      };

      await engine.triggerFileEvent(fileEvent);

      // Wait for workflow
      await new Promise((resolve) => setTimeout(resolve, 500));

      const content = await fs.readFile(testFile, 'utf-8');
      // Should not have connections
      expect(content).not.toContain('Related Documents');
    });

    it('should handle workflow with multiple related documents', async () => {
      // Create 10 related backend documents
      await fs.mkdir(path.join(testVaultRoot, 'backend'), { recursive: true });

      for (let i = 1; i <= 10; i++) {
        await fs.writeFile(
          path.join(testVaultRoot, 'backend', `service-${i}.md`),
          `---
title: Service ${i}
tags: [backend, microservices, node]
---

# Service ${i}

Backend service implementation.
`
        );
      }

      const git = simpleGit(testVaultRoot);
      await git.add('.');
      await git.commit('Add backend services');

      // Create new related document
      const newDoc = path.join(testVaultRoot, 'backend', 'api-gateway.md');
      await fs.writeFile(
        newDoc,
        `---
title: API Gateway
tags: [backend, microservices, routing]
---

# API Gateway

Central routing service.
`
      );

      await engine.initialize(testVaultRoot);
      await engine.start();

      const fileEvent: FileEvent = {
        type: 'add',
        path: newDoc,
        relativePath: 'backend/api-gateway.md',
        timestamp: new Date(),
      };

      await engine.triggerFileEvent(fileEvent);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const content = await fs.readFile(newDoc, 'utf-8');

      // Should connect to top 5 most similar documents
      expect(content).toContain('related_to');
      const matches = content.match(/service-\d+/g);
      expect(matches).toBeDefined();
      expect(matches!.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Workflow Engine Integration', () => {
    it('should initialize engine and register KG workflows', async () => {
      await engine.initialize(testVaultRoot);

      expect(engine.getVaultRoot()).toBe(testVaultRoot);

      const stats = engine.getStats();
      expect(stats.totalWorkflows).toBeGreaterThan(0);
      expect(stats.enabledWorkflows).toBeGreaterThan(0);
    });

    it('should execute workflow when file event is triggered', async () => {
      const testFile = path.join(testVaultRoot, 'test.md');
      await fs.writeFile(testFile, '# Test Document');

      await engine.initialize(testVaultRoot);
      await engine.start();

      const fileEvent: FileEvent = {
        type: 'add',
        path: testFile,
        relativePath: 'test.md',
        timestamp: new Date(),
      };

      await engine.triggerFileEvent(fileEvent);

      // Wait for async execution
      await new Promise((resolve) => setTimeout(resolve, 500));

      const stats = engine.getStats();
      expect(stats.totalExecutions).toBeGreaterThan(0);
    });

    it('should track workflow execution statistics', async () => {
      await engine.initialize(testVaultRoot);

      const initialStats = engine.getStats();
      expect(initialStats.totalExecutions).toBe(0);
      expect(initialStats.successfulExecutions).toBe(0);
      expect(initialStats.failedExecutions).toBe(0);

      // Trigger successful workflow
      const testFile = path.join(testVaultRoot, 'success.md');
      await fs.writeFile(testFile, '# Success');

      await engine.start();
      await engine.triggerFileEvent({
        type: 'add',
        path: testFile,
        relativePath: 'success.md',
        timestamp: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const finalStats = engine.getStats();
      expect(finalStats.totalExecutions).toBeGreaterThan(initialStats.totalExecutions);
    });
  });
});
