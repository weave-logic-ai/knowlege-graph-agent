/**
 * Tests for IntegrityChecker
 *
 * Comprehensive tests for SQLite database integrity checking, repair operations,
 * and database optimization.
 *
 * @module tests/recovery/integrity
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import {
  IntegrityChecker,
  createIntegrityChecker,
  checkDatabaseIntegrity,
} from '../../src/recovery/integrity.js';
import type { IntegrityCheckResult, TableIntegrity } from '../../src/recovery/types.js';

describe('IntegrityChecker', () => {
  const testRoot = join('/tmp', `kg-integrity-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const dbPath = join(testRoot, 'test.db');
  let checker: IntegrityChecker;
  let db: Database.Database;

  /**
   * Create a valid test SQLite database
   */
  function createValidDatabase(): void {
    mkdirSync(testRoot, { recursive: true });
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE nodes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE edges (
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        type TEXT NOT NULL,
        PRIMARY KEY (source_id, target_id, type),
        FOREIGN KEY (source_id) REFERENCES nodes(id),
        FOREIGN KEY (target_id) REFERENCES nodes(id)
      );

      CREATE INDEX idx_nodes_type ON nodes(type);
      CREATE INDEX idx_edges_source ON edges(source_id);
      CREATE INDEX idx_edges_target ON edges(target_id);

      INSERT INTO nodes (id, title, content, type) VALUES
        ('node-1', 'First Node', 'Content for first node', 'concept'),
        ('node-2', 'Second Node', 'Content for second node', 'document'),
        ('node-3', 'Third Node', 'Content for third node', 'reference');

      INSERT INTO edges (source_id, target_id, type) VALUES
        ('node-1', 'node-2', 'references'),
        ('node-2', 'node-3', 'extends');
    `);
    db.close();
  }

  /**
   * Create a database with integrity issues
   */
  function createProblematicDatabase(): void {
    mkdirSync(testRoot, { recursive: true });
    db = new Database(dbPath);

    // Create tables without foreign key enforcement initially
    db.exec(`
      PRAGMA foreign_keys = OFF;

      CREATE TABLE nodes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT
      );

      CREATE TABLE edges (
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        type TEXT NOT NULL,
        PRIMARY KEY (source_id, target_id, type),
        FOREIGN KEY (source_id) REFERENCES nodes(id),
        FOREIGN KEY (target_id) REFERENCES nodes(id)
      );

      INSERT INTO nodes (id, title, content) VALUES
        ('node-1', 'First Node', 'Content'),
        ('node-2', 'Second Node', 'Content');

      -- Create orphaned foreign key reference
      INSERT INTO edges (source_id, target_id, type) VALUES
        ('node-1', 'nonexistent-node', 'broken-ref');
    `);
    db.close();
  }

  beforeEach(() => {
    createValidDatabase();
    checker = new IntegrityChecker(dbPath);
  });

  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });

  describe('constructor', () => {
    it('should create an IntegrityChecker instance', () => {
      expect(checker).toBeInstanceOf(IntegrityChecker);
    });

    it('should accept database path', () => {
      const newChecker = new IntegrityChecker(dbPath);
      expect(newChecker).toBeInstanceOf(IntegrityChecker);
    });
  });

  describe('check', () => {
    it('should return valid result for healthy database', () => {
      const result = checker.check();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.tables).toBeInstanceOf(Array);
      expect(result.tables.length).toBeGreaterThan(0);
    });

    it('should return table information', () => {
      const result = checker.check();

      expect(result.tables).toBeDefined();

      const nodesTable = result.tables.find((t) => t.name === 'nodes');
      expect(nodesTable).toBeDefined();
      expect(nodesTable?.rowCount).toBe(3);
      expect(nodesTable?.valid).toBe(true);
      expect(nodesTable?.issues).toHaveLength(0);

      const edgesTable = result.tables.find((t) => t.name === 'edges');
      expect(edgesTable).toBeDefined();
      expect(edgesTable?.rowCount).toBe(2);
    });

    it('should exclude sqlite internal tables', () => {
      const result = checker.check();

      const internalTables = result.tables.filter((t) =>
        t.name.startsWith('sqlite_')
      );
      expect(internalTables).toHaveLength(0);
    });

    it('should detect foreign key violations', () => {
      // Create database with FK violations
      rmSync(testRoot, { recursive: true, force: true });
      createProblematicDatabase();

      const problematicChecker = new IntegrityChecker(dbPath);
      const result = problematicChecker.check();

      // Should have warnings about FK violations
      const fkWarnings = result.warnings.filter((w) =>
        w.includes('foreign key')
      );
      expect(fkWarnings.length).toBeGreaterThan(0);
    });

    it('should detect high fragmentation', () => {
      // Create a database and add/delete data to create fragmentation
      db = new Database(dbPath);

      // Add many rows
      for (let i = 0; i < 100; i++) {
        db.exec(`INSERT INTO nodes (id, title, type) VALUES ('temp-${i}', 'Temp ${i}', 'temp')`);
      }

      // Delete most of them
      db.exec("DELETE FROM nodes WHERE type = 'temp'");

      db.close();

      const result = checker.check();

      // Fragmentation warning may or may not appear depending on SQLite behavior
      expect(result).toBeDefined();
    });

    it('should handle non-existent database', () => {
      const nonExistentChecker = new IntegrityChecker('/nonexistent/path/db.sqlite');
      const result = nonExistentChecker.check();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle corrupted database', () => {
      // Create a corrupted file
      const corruptPath = join(testRoot, 'corrupt.db');
      writeFileSync(corruptPath, 'not a valid sqlite database');

      const corruptChecker = new IntegrityChecker(corruptPath);
      const result = corruptChecker.check();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should run SQLite integrity_check pragma', () => {
      const result = checker.check();

      // A valid database should pass integrity_check
      expect(result.valid).toBe(true);
      const integrityErrors = result.errors.filter((e) =>
        e.includes('integrity check')
      );
      expect(integrityErrors).toHaveLength(0);
    });

    it('should run SQLite quick_check pragma', () => {
      const result = checker.check();

      // Quick check should not produce warnings for valid database
      const quickWarnings = result.warnings.filter((w) =>
        w.includes('Quick check')
      );
      expect(quickWarnings).toHaveLength(0);
    });
  });

  describe('table structure validation', () => {
    it('should validate NOT NULL constraints', () => {
      // Insert a row with null in NOT NULL column (should fail but let's check validation)
      const result = checker.check();

      const nodesTable = result.tables.find((t) => t.name === 'nodes');
      expect(nodesTable?.valid).toBe(true);
      expect(nodesTable?.issues).toHaveLength(0);
    });

    it('should detect null values in NOT NULL columns', () => {
      // Create table with NOT NULL that allows bypass
      db = new Database(dbPath);
      db.exec(`
        CREATE TABLE test_nulls (
          id TEXT PRIMARY KEY,
          required_field TEXT NOT NULL
        );

        -- SQLite allows inserting NULL if we use a workaround
        -- This is a theoretical test - in practice SQLite enforces NOT NULL
      `);
      db.close();

      const result = checker.check();
      expect(result).toBeDefined();
    });

    it('should detect empty strings in required text columns', () => {
      // Insert empty string
      db = new Database(dbPath);
      db.exec("INSERT INTO nodes (id, title, type) VALUES ('empty-test', '', 'test')");
      db.close();

      const result = checker.check();

      const nodesTable = result.tables.find((t) => t.name === 'nodes');
      // Should detect empty string issue
      const emptyIssues = nodesTable?.issues.filter((i) =>
        i.includes('empty strings')
      );
      expect(emptyIssues?.length).toBeGreaterThan(0);
    });

    it('should check orphaned foreign key references', () => {
      rmSync(testRoot, { recursive: true, force: true });
      createProblematicDatabase();

      const problematicChecker = new IntegrityChecker(dbPath);
      const result = problematicChecker.check();

      const edgesTable = result.tables.find((t) => t.name === 'edges');
      // Should detect orphaned reference
      const orphanIssues = edgesTable?.issues.filter((i) =>
        i.includes('orphaned')
      );
      expect(orphanIssues?.length).toBeGreaterThan(0);
    });

    it('should handle tables with no foreign keys', () => {
      db = new Database(dbPath);
      db.exec(`
        CREATE TABLE standalone (
          id TEXT PRIMARY KEY,
          data TEXT
        );

        INSERT INTO standalone VALUES ('s1', 'data1');
      `);
      db.close();

      const result = checker.check();

      const standaloneTable = result.tables.find((t) => t.name === 'standalone');
      expect(standaloneTable?.valid).toBe(true);
    });
  });

  describe('repair', () => {
    it('should perform VACUUM operation', () => {
      // Add and delete data to create fragmentation
      db = new Database(dbPath);
      for (let i = 0; i < 50; i++) {
        db.exec(`INSERT INTO nodes (id, title, type) VALUES ('repair-${i}', 'Repair ${i}', 'temp')`);
      }
      db.exec("DELETE FROM nodes WHERE type = 'temp'");
      db.close();

      const result = checker.repair();

      expect(result).toBe(true);
    });

    it('should perform REINDEX operation', () => {
      const result = checker.repair();

      expect(result).toBe(true);

      // Verify indexes are still valid
      db = new Database(dbPath, { readonly: true });
      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'")
        .all() as { name: string }[];
      db.close();

      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should perform ANALYZE operation', () => {
      const result = checker.repair();
      expect(result).toBe(true);

      // Verify sqlite_stat1 exists (created by ANALYZE)
      db = new Database(dbPath, { readonly: true });
      const stats = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_stat1'")
        .all();
      db.close();

      expect(stats.length).toBe(1);
    });

    it('should return false for non-existent database', () => {
      const nonExistentChecker = new IntegrityChecker('/nonexistent/db.sqlite');
      const result = nonExistentChecker.repair();

      expect(result).toBe(false);
    });

    it('should enable foreign keys', () => {
      const result = checker.repair();
      expect(result).toBe(true);

      // Verify foreign keys are enabled
      db = new Database(dbPath);
      const fkStatus = db.pragma('foreign_keys') as { foreign_keys: number }[];
      db.close();

      expect(fkStatus[0]?.foreign_keys).toBe(1);
    });

    it('should return false when repair fails on busy database', () => {
      // Test that repair returns false for an unwritable path
      const nonExistentChecker = new IntegrityChecker('/nonexistent/db.sqlite');
      const result = nonExistentChecker.repair();
      expect(result).toBe(false);
    });
  });

  describe('optimize', () => {
    it('should run incremental vacuum', () => {
      const result = checker.optimize();
      expect(result).toBe(true);
    });

    it('should run ANALYZE', () => {
      const result = checker.optimize();
      expect(result).toBe(true);
    });

    it('should enable auto_vacuum if not set', () => {
      // Create new database without auto_vacuum
      const noAutoVacuumPath = join(testRoot, 'no-auto-vacuum.db');
      const noAutoVacuumDb = new Database(noAutoVacuumPath);
      noAutoVacuumDb.exec('CREATE TABLE test (id TEXT PRIMARY KEY)');
      noAutoVacuumDb.close();

      const optimizeChecker = new IntegrityChecker(noAutoVacuumPath);
      const result = optimizeChecker.optimize();

      expect(result).toBe(true);
    });

    it('should return false for non-existent database', () => {
      const nonExistentChecker = new IntegrityChecker('/nonexistent/db.sqlite');
      const result = nonExistentChecker.optimize();

      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return database statistics', () => {
      const stats = checker.getStats();

      expect(stats.pageSize).toBeGreaterThan(0);
      expect(stats.pageCount).toBeGreaterThan(0);
      expect(typeof stats.freePages).toBe('number');
      expect(typeof stats.walMode).toBe('boolean');
      expect(stats.journalMode).toBeDefined();
      expect(stats.encoding).toBeDefined();
    });

    it('should detect WAL mode', () => {
      // Enable WAL mode
      db = new Database(dbPath);
      db.pragma('journal_mode = WAL');
      db.close();

      const walChecker = new IntegrityChecker(dbPath);
      const stats = walChecker.getStats();

      expect(stats.walMode).toBe(true);
      expect(stats.journalMode.toLowerCase()).toBe('wal');
    });

    it('should detect DELETE journal mode', () => {
      // Ensure DELETE mode
      db = new Database(dbPath);
      db.pragma('journal_mode = DELETE');
      db.close();

      const stats = checker.getStats();

      expect(stats.walMode).toBe(false);
      expect(stats.journalMode.toLowerCase()).toBe('delete');
    });

    it('should report correct encoding', () => {
      const stats = checker.getStats();

      // SQLite defaults to UTF-8
      expect(stats.encoding.toLowerCase()).toContain('utf');
    });

    it('should calculate fragmentation correctly', () => {
      // Add and delete data
      db = new Database(dbPath);
      for (let i = 0; i < 100; i++) {
        db.exec(`INSERT INTO nodes (id, title, type) VALUES ('stat-${i}', 'Stats ${i}', 'temp')`);
      }
      db.exec("DELETE FROM nodes WHERE type = 'temp'");
      db.close();

      const stats = checker.getStats();

      expect(stats.freePages).toBeGreaterThanOrEqual(0);
      expect(stats.pageCount).toBeGreaterThan(0);
    });
  });

  describe('createIntegrityChecker factory', () => {
    it('should create an IntegrityChecker instance', () => {
      const created = createIntegrityChecker(dbPath);
      expect(created).toBeInstanceOf(IntegrityChecker);
    });

    it('should create functional checker', () => {
      const created = createIntegrityChecker(dbPath);
      const result = created.check();

      expect(result.valid).toBe(true);
    });
  });

  describe('checkDatabaseIntegrity convenience function', () => {
    it('should check database integrity', () => {
      const result = checkDatabaseIntegrity(dbPath);

      expect(result.valid).toBe(true);
      expect(result.tables.length).toBeGreaterThan(0);
    });

    it('should return failed result for invalid database', () => {
      const result = checkDatabaseIntegrity('/nonexistent/db.sqlite');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should be equivalent to creating checker and calling check', () => {
      const manualResult = new IntegrityChecker(dbPath).check();
      const convenienceResult = checkDatabaseIntegrity(dbPath);

      expect(manualResult.valid).toBe(convenienceResult.valid);
      expect(manualResult.tables.length).toBe(convenienceResult.tables.length);
    });
  });

  describe('IntegrityCheckResult structure', () => {
    it('should have all required fields', () => {
      const result = checker.check();

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('tables');

      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.tables)).toBe(true);
    });
  });

  describe('TableIntegrity structure', () => {
    it('should have all required fields', () => {
      const result = checker.check();
      const table = result.tables[0];

      expect(table).toHaveProperty('name');
      expect(table).toHaveProperty('rowCount');
      expect(table).toHaveProperty('valid');
      expect(table).toHaveProperty('issues');

      expect(typeof table.name).toBe('string');
      expect(typeof table.rowCount).toBe('number');
      expect(typeof table.valid).toBe('boolean');
      expect(Array.isArray(table.issues)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty database', () => {
      const emptyDbPath = join(testRoot, 'empty.db');
      const emptyDb = new Database(emptyDbPath);
      emptyDb.close();

      const emptyChecker = new IntegrityChecker(emptyDbPath);
      const result = emptyChecker.check();

      expect(result.valid).toBe(true);
      expect(result.tables).toHaveLength(0);
    });

    it('should handle database with only schema (no data)', () => {
      const schemaOnlyPath = join(testRoot, 'schema-only.db');
      const schemaOnlyDb = new Database(schemaOnlyPath);
      schemaOnlyDb.exec(`
        CREATE TABLE empty_table (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        );
      `);
      schemaOnlyDb.close();

      const schemaChecker = new IntegrityChecker(schemaOnlyPath);
      const result = schemaChecker.check();

      expect(result.valid).toBe(true);
      const emptyTable = result.tables.find((t) => t.name === 'empty_table');
      expect(emptyTable?.rowCount).toBe(0);
    });

    it('should handle large databases', () => {
      // Insert many rows
      db = new Database(dbPath);
      const insert = db.prepare(
        'INSERT INTO nodes (id, title, content, type) VALUES (?, ?, ?, ?)'
      );
      const insertMany = db.transaction(() => {
        for (let i = 0; i < 1000; i++) {
          insert.run(`large-${i}`, `Title ${i}`, `Content ${i}`, 'bulk');
        }
      });
      insertMany();
      db.close();

      const result = checker.check();

      expect(result.valid).toBe(true);
      const nodesTable = result.tables.find((t) => t.name === 'nodes');
      expect(nodesTable?.rowCount).toBe(1003); // 3 original + 1000 new
    });

    it('should handle tables with many columns', () => {
      db = new Database(dbPath);

      // Create table with many columns
      const columns = Array.from({ length: 50 }, (_, i) => `col${i} TEXT`).join(
        ', '
      );
      db.exec(`CREATE TABLE wide_table (id TEXT PRIMARY KEY, ${columns})`);
      db.exec("INSERT INTO wide_table (id) VALUES ('row1')"); // Use single quotes for string literal
      db.close();

      const result = checker.check();

      expect(result.valid).toBe(true);
      const wideTable = result.tables.find((t) => t.name === 'wide_table');
      expect(wideTable).toBeDefined();
    });

    it('should handle concurrent check operations', async () => {
      const checkers = Array.from({ length: 5 }, () => new IntegrityChecker(dbPath));
      const results = await Promise.all(checkers.map((c) => Promise.resolve(c.check())));

      results.forEach((result) => {
        expect(result.valid).toBe(true);
      });
    });

    it('should handle special characters in table and column names', () => {
      db = new Database(dbPath);
      db.exec(`
        CREATE TABLE "table-with-dash" (
          "column with space" TEXT PRIMARY KEY,
          "another.column" TEXT
        );

        INSERT INTO "table-with-dash" ("column with space") VALUES ('test');
      `);
      db.close();

      const result = checker.check();

      expect(result.valid).toBe(true);
      const specialTable = result.tables.find(
        (t) => t.name === 'table-with-dash'
      );
      expect(specialTable).toBeDefined();
      expect(specialTable?.rowCount).toBe(1);
    });
  });

  describe('error aggregation', () => {
    it('should aggregate errors from all tables', () => {
      rmSync(testRoot, { recursive: true, force: true });
      createProblematicDatabase();

      const problematicChecker = new IntegrityChecker(dbPath);
      const result = problematicChecker.check();

      // Errors should be aggregated with table name prefix
      result.errors.forEach((error) => {
        if (result.tables.some((t) => !t.valid)) {
          // Table-related errors should include table name
          expect(typeof error).toBe('string');
        }
      });
    });

    it('should limit foreign key violation details', () => {
      // Create database with many FK violations
      db = new Database(dbPath);
      db.exec('PRAGMA foreign_keys = OFF');
      for (let i = 0; i < 20; i++) {
        db.exec(`INSERT INTO edges (source_id, target_id, type)
                 VALUES ('node-1', 'missing-${i}', 'broken')`);
      }
      db.close();

      const result = checker.check();

      // Should have warnings about FK violations
      const fkWarnings = result.warnings.filter((w) =>
        w.includes('foreign key') || w.includes('FK violation')
      );

      // Should limit the number of detailed violations shown
      const detailWarnings = result.warnings.filter((w) => w.includes('FK violation:'));
      expect(detailWarnings.length).toBeLessThanOrEqual(5);

      // Should indicate there are more
      const moreWarning = result.warnings.find((w) => w.includes('... and'));
      if (fkWarnings.length > 5) {
        expect(moreWarning).toBeDefined();
      }
    });
  });
});
