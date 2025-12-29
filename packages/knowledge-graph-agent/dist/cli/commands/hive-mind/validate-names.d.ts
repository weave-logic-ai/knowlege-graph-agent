/**
 * Hive Mind - Name Validator
 *
 * Validates file naming schema in a vault to ensure consistent, linkable names.
 * Supports kebab-case, lowercase, and other naming conventions.
 *
 * SPEC-003: Hive Mind Reconnection Tools
 */
import { Command } from 'commander';
export interface ValidateNamesOptions {
    fix?: boolean;
    dryRun?: boolean;
    schema?: string;
    output?: string;
    json?: boolean;
    verbose?: boolean;
}
export interface InvalidFile {
    file: string;
    issues: string[];
    suggested: string;
}
export interface ValidationResult {
    valid: string[];
    invalid: InvalidFile[];
    statistics: {
        totalFiles: number;
        validCount: number;
        invalidCount: number;
        commonIssues: Map<string, number>;
    };
}
export interface NamingSchema {
    name: string;
    patterns: {
        lowercase: boolean;
        separator: '-' | '_' | '.';
        maxLength: number;
        allowedChars: RegExp;
        reservedNames: string[];
        allowMixedSeparators?: boolean;
    };
}
export declare class NameValidator {
    private schema;
    constructor(schemaName?: string);
    /**
     * Validate all files in a vault
     */
    validateVault(vaultPath: string, options?: ValidateNamesOptions): Promise<ValidationResult>;
    /**
     * Validate a single filename
     */
    validateFilename(filename: string): string[];
    /**
     * Suggest a valid filename
     */
    suggestRename(filename: string): string;
    /**
     * Rename files (with safety checks)
     */
    renameFiles(vaultPath: string, invalidFiles: InvalidFile[], dryRun?: boolean): Promise<Array<{
        from: string;
        to: string;
        success: boolean;
        error?: string;
    }>>;
    /**
     * Get current schema
     */
    getSchema(): NamingSchema;
    /**
     * Generate report
     */
    generateReport(result: ValidationResult): string;
}
export declare function createValidateNamesCommand(): Command;
export default createValidateNamesCommand;
//# sourceMappingURL=validate-names.d.ts.map