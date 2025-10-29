/**
 * Database Operations Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import Database from 'better-sqlite3';
import { execSync } from 'child_process';

describe('Database Operations', () => {
  let testDir: string;
  let testDbPath: string;

  beforeEach(() => {
    // Create temporary test directory
    testDir = join(tmpdir(), `weaver-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    testDbPath = join(testDir, 'test.db');
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Database Vacuum', () => {
    it('should create and optimize a database', () => {
      // Create a test database with some data
      const db = new Database(testDbPath);
      db.exec(`
        CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO test (data) VALUES ('test1'), ('test2'), ('test3');
      `);

      const beforeSize = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };

      // Run VACUUM
      db.exec('VACUUM');

      const afterSize = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };

      db.close();

      expect(afterSize.size).toBeLessThanOrEqual(beforeSize.size);
    });

    it('should verify database integrity', () => {
      const db = new Database(testDbPath);
      db.exec(`
        CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO test (data) VALUES ('test');
      `);

      const result = db.pragma('integrity_check', { simple: true });
      db.close();

      expect(result).toEqual(['ok']);
    });

    it('should optimize query planner', () => {
      const db = new Database(testDbPath);
      db.exec(`
        CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT);
        CREATE INDEX idx_data ON test(data);
        INSERT INTO test (data) VALUES ('test1'), ('test2');
      `);

      // This should not throw
      expect(() => {
        db.pragma('optimize');
        db.close();
      }).not.toThrow();
    });
  });

  describe('Database Backup', () => {
    it('should create backup file', () => {
      // Create source database
      const db = new Database(testDbPath);
      db.exec(`
        CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO test (data) VALUES ('backup-test');
      `);
      db.close();

      const backupPath = join(testDir, 'backup.db');

      // Create backup (simple copy for test)
      const content = require('fs').readFileSync(testDbPath);
      require('fs').writeFileSync(backupPath, content);

      expect(existsSync(backupPath)).toBe(true);

      // Verify backup is valid
      const backupDb = new Database(backupPath);
      const result = backupDb.prepare('SELECT data FROM test').get() as { data: string };
      backupDb.close();

      expect(result.data).toBe('backup-test');
    });

    it('should create checkpoint before backup', () => {
      const db = new Database(testDbPath);
      db.exec(`
        CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO test (data) VALUES ('checkpoint-test');
      `);

      // Enable WAL mode
      db.pragma('journal_mode = WAL');

      // Create checkpoint
      const result = db.pragma('wal_checkpoint(FULL)');

      db.close();

      expect(result).toBeDefined();
    });
  });

  describe('Database Restore', () => {
    it('should restore from backup', () => {
      // Create original database
      const originalDb = new Database(testDbPath);
      originalDb.exec(`
        CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO test (data) VALUES ('original');
      `);
      originalDb.close();

      // Create backup
      const backupPath = join(testDir, 'backup.db');
      const content = require('fs').readFileSync(testDbPath);
      require('fs').writeFileSync(backupPath, content);

      // Modify original
      const modifiedDb = new Database(testDbPath);
      modifiedDb.exec("UPDATE test SET data = 'modified'");
      modifiedDb.close();

      // Restore from backup
      const backupContent = require('fs').readFileSync(backupPath);
      require('fs').writeFileSync(testDbPath, backupContent);

      // Verify restoration
      const restoredDb = new Database(testDbPath);
      const result = restoredDb.prepare('SELECT data FROM test').get() as { data: string };
      restoredDb.close();

      expect(result.data).toBe('original');
    });

    it('should verify restored database integrity', () => {
      // Create and backup database
      const db = new Database(testDbPath);
      db.exec(`
        CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO test (data) VALUES ('integrity-test');
      `);
      db.close();

      const backupPath = join(testDir, 'backup.db');
      const content = require('fs').readFileSync(testDbPath);
      require('fs').writeFileSync(backupPath, content);

      // Restore
      const backupContent = require('fs').readFileSync(backupPath);
      require('fs').writeFileSync(testDbPath, backupContent);

      // Verify
      const restoredDb = new Database(testDbPath);
      const integrityCheck = restoredDb.pragma('integrity_check', { simple: true });
      restoredDb.close();

      expect(integrityCheck).toEqual(['ok']);
    });
  });

  describe('Database File Operations', () => {
    it('should calculate database size correctly', () => {
      const db = new Database(testDbPath);
      db.exec(`
        CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO test (data) VALUES ('${Array(100).fill('x').join('')}');
      `);
      db.close();

      const stats = require('fs').statSync(testDbPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should handle empty database', () => {
      const db = new Database(testDbPath);
      const stats = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };
      db.close();

      expect(stats.size).toBeGreaterThan(0); // Even empty DB has some size
    });
  });
});
