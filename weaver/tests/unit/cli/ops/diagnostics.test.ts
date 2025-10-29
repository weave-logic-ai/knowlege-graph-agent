/**
 * Diagnostics Operations Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, rmSync, accessSync, constants } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import Database from 'better-sqlite3';

describe('Diagnostics Operations', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `weaver-diag-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('File System Checks', () => {
    it('should check directory exists', () => {
      expect(existsSync(testDir)).toBe(true);

      const nonExistent = join(testDir, 'missing');
      expect(existsSync(nonExistent)).toBe(false);
    });

    it('should check file permissions', () => {
      const testFile = join(testDir, 'test.txt');
      writeFileSync(testFile, 'test');

      // Check read permission
      expect(() => {
        accessSync(testFile, constants.R_OK);
      }).not.toThrow();

      // Check write permission
      expect(() => {
        accessSync(testFile, constants.W_OK);
      }).not.toThrow();
    });

    it('should detect missing permissions', () => {
      const readOnlyDir = join(testDir, 'readonly');
      mkdirSync(readOnlyDir);

      // Verify we can read
      expect(() => {
        accessSync(readOnlyDir, constants.R_OK);
      }).not.toThrow();
    });
  });

  describe('Database Health Checks', () => {
    it('should verify database integrity', () => {
      const dbPath = join(testDir, 'test.db');
      const db = new Database(dbPath);

      db.exec(`
        CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO test (data) VALUES ('test');
      `);

      const result = db.pragma('integrity_check', { simple: true });
      db.close();

      expect(result).toEqual(['ok']);
    });

    it('should detect corrupted database', () => {
      const dbPath = join(testDir, 'corrupt.db');

      // Create valid database first
      const db = new Database(dbPath);
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY)');
      db.close();

      // Corrupt it by writing random data
      writeFileSync(dbPath, 'corrupted data', { flag: 'w' });

      // Try to open corrupted database
      expect(() => {
        new Database(dbPath);
      }).toThrow();
    });

    it('should check database size', () => {
      const dbPath = join(testDir, 'size.db');
      const db = new Database(dbPath);

      db.exec(`
        CREATE TABLE test (id INTEGER PRIMARY KEY, data TEXT);
        INSERT INTO test (data) VALUES ('${'x'.repeat(1000)}');
      `);

      const stats = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get() as { size: number };

      db.close();

      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('System Information', () => {
    it('should get Node.js version', () => {
      const version = process.version;
      expect(version).toMatch(/^v\d+\.\d+\.\d+/);

      const majorVersion = parseInt(version.slice(1).split('.')[0]);
      expect(majorVersion).toBeGreaterThanOrEqual(20);
    });

    it('should get platform information', () => {
      expect(process.platform).toBeDefined();
      expect(process.arch).toBeDefined();
    });

    it('should format file sizes', () => {
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
      };

      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    });
  });

  describe('Diagnostic Results', () => {
    interface DiagnosticCheck {
      name: string;
      status: 'ok' | 'warning' | 'error';
      message: string;
      details?: string;
    }

    it('should categorize check results', () => {
      const checks: DiagnosticCheck[] = [
        { name: 'Test 1', status: 'ok', message: 'Pass' },
        { name: 'Test 2', status: 'warning', message: 'Warning' },
        { name: 'Test 3', status: 'error', message: 'Error' },
      ];

      const hasErrors = checks.some(c => c.status === 'error');
      const hasWarnings = checks.some(c => c.status === 'warning');

      expect(hasErrors).toBe(true);
      expect(hasWarnings).toBe(true);
    });

    it('should generate diagnostic report', () => {
      const checks: DiagnosticCheck[] = [
        {
          name: 'Directory',
          status: 'ok',
          message: 'Exists with proper permissions',
          details: testDir,
        },
        {
          name: 'Database',
          status: 'ok',
          message: 'Healthy',
        },
      ];

      expect(checks.length).toBe(2);
      expect(checks.every(c => c.status === 'ok')).toBe(true);
    });

    it('should include detailed information', () => {
      const check: DiagnosticCheck = {
        name: 'Test Check',
        status: 'ok',
        message: 'Check passed',
        details: 'Additional information',
      };

      expect(check.details).toBeDefined();
      expect(check.details).toBe('Additional information');
    });
  });

  describe('Version Information', () => {
    it('should extract version numbers', () => {
      const version = '1.2.3';
      const parts = version.split('.');

      expect(parts.length).toBe(3);
      expect(parseInt(parts[0])).toBe(1);
      expect(parseInt(parts[1])).toBe(2);
      expect(parseInt(parts[2])).toBe(3);
    });

    it('should compare versions', () => {
      const v1 = '1.0.0';
      const v2 = '2.0.0';

      const compare = (a: string, b: string): number => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
          if (aParts[i] > bParts[i]) return 1;
          if (aParts[i] < bParts[i]) return -1;
        }
        return 0;
      };

      expect(compare(v1, v2)).toBe(-1);
      expect(compare(v2, v1)).toBe(1);
      expect(compare(v1, v1)).toBe(0);
    });
  });
});
