/**
 * Database Integrity Checker
 *
 * Provides integrity checking and repair operations for SQLite databases.
 *
 * @module recovery/integrity
 */

import Database from 'better-sqlite3';
import { createLogger } from '../utils/index.js';
import type { IntegrityCheckResult, TableIntegrity } from './types.js';

const logger = createLogger('integrity-checker');

/**
 * Checks and repairs SQLite database integrity
 */
export class IntegrityChecker {
  private dbPath: string;

  /**
   * Create a new IntegrityChecker
   *
   * @param dbPath - Path to the SQLite database file
   */
  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Perform a comprehensive integrity check on the database
   *
   * @returns Detailed integrity check results
   */
  check(): IntegrityCheckResult {
    const result: IntegrityCheckResult = {
      valid: true,
      errors: [],
      warnings: [],
      tables: [],
    };

    let db: Database.Database | undefined;

    try {
      db = new Database(this.dbPath, { readonly: true });

      // Run SQLite's built-in integrity check
      const integrityResult = db.pragma('integrity_check') as { integrity_check: string }[];
      if (integrityResult[0]?.integrity_check !== 'ok') {
        result.valid = false;
        result.errors.push(
          `SQLite integrity check failed: ${integrityResult[0]?.integrity_check ?? 'unknown error'}`
        );
      }

      // Check quick_check for faster basic validation
      const quickResult = db.pragma('quick_check') as { quick_check: string }[];
      if (quickResult[0]?.quick_check !== 'ok') {
        result.warnings.push(`Quick check warning: ${quickResult[0]?.quick_check}`);
      }

      // Get list of tables
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        .all() as { name: string }[];

      // Check each table
      for (const { name } of tables) {
        const tableResult = this.checkTable(db, name);
        result.tables.push(tableResult);
        if (!tableResult.valid) {
          result.valid = false;
          result.errors.push(...tableResult.issues.map((i) => `${name}: ${i}`));
        }
      }

      // Check foreign key constraints
      const fkResult = db.pragma('foreign_key_check') as {
        table: string;
        rowid: number;
        parent: string;
        fkid: number;
      }[];
      if (fkResult.length > 0) {
        result.warnings.push(`${fkResult.length} foreign key violations found`);
        // Add details for first few violations
        for (const violation of fkResult.slice(0, 5)) {
          result.warnings.push(
            `  FK violation: ${violation.table} row ${violation.rowid} -> ${violation.parent}`
          );
        }
        if (fkResult.length > 5) {
          result.warnings.push(`  ... and ${fkResult.length - 5} more violations`);
        }
      }

      // Check for database page count and free pages
      const pageCount = db.pragma('page_count') as { page_count: number }[];
      const freePages = db.pragma('freelist_count') as { freelist_count: number }[];
      const fragmentation =
        pageCount[0]?.page_count > 0
          ? (freePages[0]?.freelist_count ?? 0) / pageCount[0].page_count
          : 0;

      if (fragmentation > 0.2) {
        result.warnings.push(
          `Database fragmentation is ${(fragmentation * 100).toFixed(1)}% - consider running VACUUM`
        );
      }

      logger.info('Integrity check complete', {
        valid: result.valid,
        tables: result.tables.length,
        errors: result.errors.length,
        warnings: result.warnings.length,
      });
    } catch (error) {
      result.valid = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
      logger.error('Integrity check failed', error instanceof Error ? error : undefined);
    } finally {
      db?.close();
    }

    return result;
  }

  /**
   * Check integrity of a single table
   */
  private checkTable(db: Database.Database, tableName: string): TableIntegrity {
    const issues: string[] = [];
    let rowCount = 0;

    try {
      // SECURITY: tableName is from sqlite_master system table (line 65), not user input - safe to interpolate
      // Get row count
      const countResult = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get() as {
        count: number;
      };
      rowCount = countResult.count;

      // SECURITY: tableName is from sqlite_master system table (line 65), not user input - safe to interpolate
      // Get table schema info
      const tableInfo = db.pragma(`table_info("${tableName}")`) as {
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: unknown;
        pk: number;
      }[];

      // Check for null values in NOT NULL columns
      // SECURITY: tableName and col.name are from sqlite_master/pragma system tables, not user input - safe to interpolate
      for (const col of tableInfo) {
        if (col.notnull) {
          const nullCount = db
            .prepare(`SELECT COUNT(*) as count FROM "${tableName}" WHERE "${col.name}" IS NULL`)
            .get() as { count: number };
          if (nullCount.count > 0) {
            issues.push(`${nullCount.count} null values in required column '${col.name}'`);
          }
        }
      }

      // Check for empty required text columns
      // SECURITY: tableName and col.name are from sqlite_master/pragma system tables, not user input - safe to interpolate
      for (const col of tableInfo) {
        if (col.notnull && (col.type.toUpperCase() === 'TEXT' || col.type.toUpperCase() === 'VARCHAR')) {
          const emptyCount = db
            .prepare(`SELECT COUNT(*) as count FROM "${tableName}" WHERE "${col.name}" = ''`)
            .get() as { count: number };
          if (emptyCount.count > 0) {
            issues.push(`${emptyCount.count} empty strings in required column '${col.name}'`);
          }
        }
      }

      // SECURITY: tableName is from sqlite_master system table (line 65), not user input - safe to interpolate
      // Check for orphaned foreign key references (if table has foreign keys)
      const fkList = db.pragma(`foreign_key_list("${tableName}")`) as {
        id: number;
        seq: number;
        table: string;
        from: string;
        to: string;
      }[];

      // SECURITY: tableName is from sqlite_master, fk.from/fk.table/fk.to are from pragma - all trusted sources
      for (const fk of fkList) {
        try {
          const orphanCount = db
            .prepare(
              `SELECT COUNT(*) as count FROM "${tableName}" t
               WHERE t."${fk.from}" IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM "${fk.table}" p WHERE p."${fk.to}" = t."${fk.from}")`
            )
            .get() as { count: number };
          if (orphanCount.count > 0) {
            issues.push(
              `${orphanCount.count} orphaned references in '${fk.from}' -> ${fk.table}.${fk.to}`
            );
          }
        } catch {
          // Skip if foreign table doesn't exist
        }
      }
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
    }

    return {
      name: tableName,
      rowCount,
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Attempt to repair the database
   *
   * Performs VACUUM and REINDEX operations to clean up and optimize the database.
   *
   * @returns True if repair was successful
   */
  repair(): boolean {
    let db: Database.Database | undefined;

    try {
      db = new Database(this.dbPath);

      // Enable foreign keys
      db.pragma('foreign_keys = ON');

      // Vacuum to reclaim space and defragment
      logger.info('Running VACUUM...');
      db.exec('VACUUM');

      // Reindex all indexes
      logger.info('Running REINDEX...');
      db.exec('REINDEX');

      // Analyze for query optimization
      logger.info('Running ANALYZE...');
      db.exec('ANALYZE');

      logger.info('Database repair complete');
      return true;
    } catch (error) {
      logger.error('Database repair failed', error instanceof Error ? error : undefined);
      return false;
    } finally {
      db?.close();
    }
  }

  /**
   * Optimize the database without full repair
   *
   * Runs incremental vacuum and analyze operations.
   *
   * @returns True if optimization was successful
   */
  optimize(): boolean {
    let db: Database.Database | undefined;

    try {
      db = new Database(this.dbPath);

      // Enable auto_vacuum if not already enabled
      const autoVacuum = db.pragma('auto_vacuum') as { auto_vacuum: number }[];
      if (autoVacuum[0]?.auto_vacuum === 0) {
        logger.info('Enabling incremental auto_vacuum...');
        db.pragma('auto_vacuum = INCREMENTAL');
        db.exec('VACUUM'); // Required after changing auto_vacuum
      }

      // Run incremental vacuum
      db.pragma('incremental_vacuum(100)');

      // Run analyze
      db.exec('ANALYZE');

      logger.info('Database optimization complete');
      return true;
    } catch (error) {
      logger.error('Database optimization failed', error instanceof Error ? error : undefined);
      return false;
    } finally {
      db?.close();
    }
  }

  /**
   * Get database statistics
   *
   * @returns Object containing database statistics
   */
  getStats(): {
    pageSize: number;
    pageCount: number;
    freePages: number;
    walMode: boolean;
    journalMode: string;
    encoding: string;
  } {
    let db: Database.Database | undefined;

    try {
      db = new Database(this.dbPath, { readonly: true });

      const pageSize = (db.pragma('page_size') as { page_size: number }[])[0]?.page_size ?? 0;
      const pageCount = (db.pragma('page_count') as { page_count: number }[])[0]?.page_count ?? 0;
      const freePages =
        (db.pragma('freelist_count') as { freelist_count: number }[])[0]?.freelist_count ?? 0;
      const journalMode =
        (db.pragma('journal_mode') as { journal_mode: string }[])[0]?.journal_mode ?? 'unknown';
      const encoding = (db.pragma('encoding') as { encoding: string }[])[0]?.encoding ?? 'unknown';

      return {
        pageSize,
        pageCount,
        freePages,
        walMode: journalMode.toLowerCase() === 'wal',
        journalMode,
        encoding,
      };
    } finally {
      db?.close();
    }
  }
}

/**
 * Create an IntegrityChecker instance
 *
 * @param dbPath - Path to the SQLite database file
 * @returns IntegrityChecker instance
 */
export function createIntegrityChecker(dbPath: string): IntegrityChecker {
  return new IntegrityChecker(dbPath);
}

/**
 * Convenience function to check database integrity
 *
 * @param dbPath - Path to the SQLite database file
 * @returns Integrity check results
 */
export function checkDatabaseIntegrity(dbPath: string): IntegrityCheckResult {
  const checker = new IntegrityChecker(dbPath);
  return checker.check();
}
