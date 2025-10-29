/**
 * Snapshot Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnapshotManager } from '../../src/monitoring/snapshots.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

describe('SnapshotManager', () => {
  let manager: SnapshotManager;
  const testDir = path.join(process.cwd(), '.weaver', 'test-snapshots');
  const testFile = path.join(testDir, 'test.txt');

  beforeEach(async () => {
    manager = new SnapshotManager(testDir);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Snapshot Creation', () => {
    it('should create snapshot with file state', async () => {
      await fs.writeFile(testFile, 'initial content', 'utf-8');

      const snapshot = await manager.createSnapshot('test:operation', {
        files: [testFile],
        includeContent: true,
      });

      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeTruthy();
      expect(snapshot.operation).toBe('test:operation');
      expect(snapshot.state.files[testFile]).toBeDefined();
      expect(snapshot.state.files[testFile]?.exists).toBe(true);
      expect(snapshot.state.files[testFile]?.content).toBe('initial content');
    });

    it('should snapshot non-existent file', async () => {
      const nonExistent = path.join(testDir, 'missing.txt');

      const snapshot = await manager.createSnapshot('test:missing', {
        files: [nonExistent],
      });

      expect(snapshot.state.files[nonExistent]).toBeDefined();
      expect(snapshot.state.files[nonExistent]?.exists).toBe(false);
    });

    it('should snapshot environment variables', async () => {
      process.env['TEST_SNAPSHOT_VAR'] = 'test-value';

      const snapshot = await manager.createSnapshot('test:env', {
        envVars: ['TEST_SNAPSHOT_VAR'],
      });

      expect(snapshot.state.environment['TEST_SNAPSHOT_VAR']).toBe('test-value');

      delete process.env['TEST_SNAPSHOT_VAR'];
    });
  });

  describe('Snapshot Retrieval', () => {
    it('should retrieve snapshot by ID', async () => {
      const snapshot = await manager.createSnapshot('test:retrieve');

      const retrieved = manager.getSnapshot(snapshot.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(snapshot.id);
    });

    it('should return undefined for non-existent snapshot', () => {
      const retrieved = manager.getSnapshot('non-existent-id');

      expect(retrieved).toBeUndefined();
    });

    it('should list snapshots', async () => {
      await manager.createSnapshot('test:1');
      await manager.createSnapshot('test:2');
      await manager.createSnapshot('test:3');

      const snapshots = manager.listSnapshots();

      expect(snapshots.length).toBe(3);
    });

    it('should list snapshots with limit', async () => {
      await manager.createSnapshot('test:1');
      await manager.createSnapshot('test:2');
      await manager.createSnapshot('test:3');

      const snapshots = manager.listSnapshots(2);

      expect(snapshots.length).toBe(2);
    });
  });

  describe('Snapshot Diff', () => {
    it('should calculate diff between snapshots', async () => {
      await fs.writeFile(testFile, 'version 1', 'utf-8');

      const snapshot1 = await manager.createSnapshot('test:v1', {
        files: [testFile],
        includeContent: true,
      });

      await fs.writeFile(testFile, 'version 2', 'utf-8');

      const snapshot2 = await manager.createSnapshot('test:v2', {
        files: [testFile],
        includeContent: true,
      });

      const diff = manager.calculateDiff(snapshot1.id, snapshot2.id);

      expect(diff).toBeDefined();
      expect(diff?.filesModified).toContain(testFile);
    });

    it('should detect added files', async () => {
      const snapshot1 = await manager.createSnapshot('test:before', {
        files: [],
      });

      await fs.writeFile(testFile, 'new file', 'utf-8');

      const snapshot2 = await manager.createSnapshot('test:after', {
        files: [testFile],
      });

      const diff = manager.calculateDiff(snapshot1.id, snapshot2.id);

      expect(diff?.filesAdded).toContain(testFile);
    });

    it('should detect removed files', async () => {
      await fs.writeFile(testFile, 'content', 'utf-8');

      const snapshot1 = await manager.createSnapshot('test:before', {
        files: [testFile],
      });

      const snapshot2 = await manager.createSnapshot('test:after', {
        files: [],
      });

      const diff = manager.calculateDiff(snapshot1.id, snapshot2.id);

      expect(diff?.filesRemoved).toContain(testFile);
    });
  });

  describe('Rollback', () => {
    it('should rollback file content', async () => {
      await fs.writeFile(testFile, 'original content', 'utf-8');

      const snapshot = await manager.createSnapshot('test:rollback', {
        files: [testFile],
        includeContent: true,
      });

      // Modify file
      await fs.writeFile(testFile, 'modified content', 'utf-8');

      // Rollback
      await manager.rollback(snapshot.id);

      // Verify content restored
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('original content');
    });

    it('should fail rollback for non-existent snapshot', async () => {
      await expect(manager.rollback('non-existent-id')).rejects.toThrow();
    });

    it('should restore environment variables', async () => {
      process.env['TEST_ROLLBACK_VAR'] = 'original';

      const snapshot = await manager.createSnapshot('test:env-rollback', {
        envVars: ['TEST_ROLLBACK_VAR'],
      });

      process.env['TEST_ROLLBACK_VAR'] = 'modified';

      await manager.rollback(snapshot.id);

      expect(process.env['TEST_ROLLBACK_VAR']).toBe('original');
    });
  });

  describe('Snapshot Management', () => {
    it('should delete snapshot', async () => {
      const snapshot = await manager.createSnapshot('test:delete');

      await manager.deleteSnapshot(snapshot.id);

      const retrieved = manager.getSnapshot(snapshot.id);
      expect(retrieved).toBeUndefined();
    });
  });
});
