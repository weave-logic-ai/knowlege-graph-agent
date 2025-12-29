/**
 * Database Integrity Checker
 *
 * Provides integrity checking and repair operations for SQLite databases.
 *
 * @module recovery/integrity
 */
import type { IntegrityCheckResult } from './types.js';
/**
 * Checks and repairs SQLite database integrity
 */
export declare class IntegrityChecker {
    private dbPath;
    /**
     * Create a new IntegrityChecker
     *
     * @param dbPath - Path to the SQLite database file
     */
    constructor(dbPath: string);
    /**
     * Perform a comprehensive integrity check on the database
     *
     * @returns Detailed integrity check results
     */
    check(): IntegrityCheckResult;
    /**
     * Check integrity of a single table
     */
    private checkTable;
    /**
     * Attempt to repair the database
     *
     * Performs VACUUM and REINDEX operations to clean up and optimize the database.
     *
     * @returns True if repair was successful
     */
    repair(): boolean;
    /**
     * Optimize the database without full repair
     *
     * Runs incremental vacuum and analyze operations.
     *
     * @returns True if optimization was successful
     */
    optimize(): boolean;
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
    };
}
/**
 * Create an IntegrityChecker instance
 *
 * @param dbPath - Path to the SQLite database file
 * @returns IntegrityChecker instance
 */
export declare function createIntegrityChecker(dbPath: string): IntegrityChecker;
/**
 * Convenience function to check database integrity
 *
 * @param dbPath - Path to the SQLite database file
 * @returns Integrity check results
 */
export declare function checkDatabaseIntegrity(dbPath: string): IntegrityCheckResult;
//# sourceMappingURL=integrity.d.ts.map