/**
 * Recovery Module
 *
 * Provides backup, restore, and integrity checking capabilities.
 */
export interface BackupConfig {
    backupDir: string;
    maxBackups?: number;
    compress?: boolean;
    includeDatabase?: boolean;
    includeCache?: boolean;
    includeConfig?: boolean;
}
export interface BackupInfo {
    id: string;
    path: string;
    createdAt: Date;
    size: number;
    components: string[];
    version: string;
    checksum?: string;
}
export interface RestoreResult {
    success: boolean;
    restoredComponents: string[];
    error?: string;
    warnings: string[];
    duration: number;
}
export interface RecoveryOptions {
    force?: boolean;
    verify?: boolean;
    skipComponents?: string[];
    dryRun?: boolean;
}
export interface IntegrityCheckResult {
    valid: boolean;
    components: TableIntegrity[];
    issues: string[];
    duration: number;
}
export interface TableIntegrity {
    table: string;
    rowCount: number;
    validStructure: boolean;
    fkViolations: number;
    orphanedRecords: number;
}
export declare class BackupManager {
    private config;
    constructor(config: BackupConfig);
    createBackup(description?: string): Promise<BackupInfo>;
    listBackups(): Promise<BackupInfo[]>;
    restore(backupId: string, options?: RecoveryOptions): Promise<RestoreResult>;
    deleteBackup(backupId: string): Promise<boolean>;
    private cleanupOldBackups;
}
export declare function createBackupManager(config: BackupConfig): BackupManager;
export declare class IntegrityChecker {
    private dbPath;
    constructor(dbPath: string);
    check(): Promise<IntegrityCheckResult>;
    repair(): Promise<{
        repaired: boolean;
        actions: string[];
    }>;
}
export declare function createIntegrityChecker(dbPath: string): IntegrityChecker;
export declare function checkDatabaseIntegrity(dbPath: string): Promise<IntegrityCheckResult>;
//# sourceMappingURL=index.d.ts.map