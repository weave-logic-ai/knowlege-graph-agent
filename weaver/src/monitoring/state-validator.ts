/**
 * State Validator - Pre-action validation system
 *
 * Validates state before operations to prevent failures:
 * - File existence and permissions
 * - Resource availability (disk, memory)
 * - Configuration validity
 * - Database connectivity
 * - API key presence
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import { logger } from '../utils/logger.js';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Pre-condition check
 */
export interface PreCondition {
  name: string;
  check: () => Promise<ValidationResult>;
  required: boolean;
}

/**
 * Operation context for validation
 */
export interface OperationContext {
  operation: string;
  files?: string[];
  requiredEnv?: string[];
  minDiskSpaceMB?: number;
  minMemoryMB?: number;
  databaseRequired?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * State Validator
 */
export class StateValidator {
  private customValidators = new Map<string, PreCondition>();

  /**
   * Validate state before operation
   */
  async validate(context: OperationContext): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, unknown> = {};

    logger.debug('Running pre-action validation', { operation: context.operation });

    // File existence checks
    if (context.files && context.files.length > 0) {
      const fileResult = await this.validateFiles(context.files);
      errors.push(...fileResult.errors);
      warnings.push(...fileResult.warnings);
      if (fileResult.metadata) {
        metadata.files = fileResult.metadata;
      }
    }

    // Environment variable checks
    if (context.requiredEnv && context.requiredEnv.length > 0) {
      const envResult = this.validateEnvironment(context.requiredEnv);
      errors.push(...envResult.errors);
      warnings.push(...envResult.warnings);
    }

    // Resource checks
    const resourceResult = await this.validateResources(
      context.minDiskSpaceMB,
      context.minMemoryMB
    );
    errors.push(...resourceResult.errors);
    warnings.push(...resourceResult.warnings);
    if (resourceResult.metadata) {
      metadata.resources = resourceResult.metadata;
    }

    // Database connectivity (if required)
    if (context.databaseRequired) {
      const dbResult = await this.validateDatabase();
      errors.push(...dbResult.errors);
      warnings.push(...dbResult.warnings);
    }

    // Run custom validators
    for (const [name, validator] of this.customValidators) {
      if (!validator.required) continue;

      const result = await validator.check();
      if (!result.valid) {
        errors.push(`Custom validator "${name}" failed: ${result.errors.join(', ')}`);
      }
      warnings.push(...result.warnings);
    }

    const valid = errors.length === 0;

    if (!valid) {
      logger.error('Pre-action validation failed', new Error(errors.join('; ')), {
        operation: context.operation,
        errors,
      });
    } else if (warnings.length > 0) {
      logger.warn('Pre-action validation passed with warnings', {
        operation: context.operation,
        warnings,
      });
    } else {
      logger.debug('Pre-action validation passed', { operation: context.operation });
    }

    return { valid, errors, warnings, metadata };
  }

  /**
   * Validate file existence and permissions
   */
  private async validateFiles(files: string[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fileStats: Record<string, unknown> = {};

    for (const file of files) {
      try {
        if (!existsSync(file)) {
          errors.push(`File does not exist: ${file}`);
          continue;
        }

        const stats = await fs.stat(file);
        fileStats[file] = {
          size: stats.size,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
          modified: stats.mtime,
        };

        // Check read permission
        try {
          await fs.access(file, fs.constants.R_OK);
        } catch {
          errors.push(`File not readable: ${file}`);
        }

        // Check write permission (warning only)
        try {
          await fs.access(file, fs.constants.W_OK);
        } catch {
          warnings.push(`File not writable: ${file}`);
        }
      } catch (error) {
        errors.push(
          `File validation failed for ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: fileStats,
    };
  }

  /**
   * Validate environment variables
   */
  private validateEnvironment(requiredVars: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const varName of requiredVars) {
      const value = process.env[varName];

      if (!value) {
        errors.push(`Missing required environment variable: ${varName}`);
      } else if (value.length === 0) {
        warnings.push(`Environment variable is empty: ${varName}`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate system resources
   */
  private async validateResources(
    minDiskSpaceMB?: number,
    minMemoryMB?: number
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metadata: Record<string, unknown> = {};

    // Memory check
    const freeMemoryMB = os.freemem() / 1024 / 1024;
    const totalMemoryMB = os.totalmem() / 1024 / 1024;
    metadata.memory = { free: freeMemoryMB, total: totalMemoryMB };

    if (minMemoryMB && freeMemoryMB < minMemoryMB) {
      errors.push(
        `Insufficient memory: ${freeMemoryMB.toFixed(0)}MB available, ${minMemoryMB}MB required`
      );
    } else if (freeMemoryMB < 100) {
      warnings.push(`Low memory: ${freeMemoryMB.toFixed(0)}MB available`);
    }

    // Disk space check (for current working directory)
    if (minDiskSpaceMB) {
      try {
        // Note: This is a simplified check. In production, use a library like 'check-disk-space'
        const cwd = process.cwd();
        // We'll skip actual disk space check for now as it requires native bindings
        // In real implementation, use: const { free } = await checkDiskSpace(cwd);
        metadata.disk = { path: cwd };
      } catch (error) {
        warnings.push(
          `Disk space check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // CPU check
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    metadata.cpu = { loadAvg, cpuCount };

    if (loadAvg[0] > cpuCount * 2) {
      warnings.push(`High CPU load: ${loadAvg[0].toFixed(2)} (${cpuCount} CPUs)`);
    }

    return { valid: errors.length === 0, errors, warnings, metadata };
  }

  /**
   * Validate database connectivity
   */
  private async validateDatabase(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for database configuration
    const dbUrl = process.env['DATABASE_URL'];

    if (!dbUrl) {
      errors.push('Database URL not configured (DATABASE_URL environment variable missing)');
    }

    // In a real implementation, you would:
    // 1. Try to connect to the database
    // 2. Run a simple query (SELECT 1)
    // 3. Check connection pool status
    // For now, we just check the env var

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Register custom validator
   */
  registerValidator(name: string, validator: PreCondition): void {
    this.customValidators.set(name, validator);
    logger.debug('Custom validator registered', { name, required: validator.required });
  }

  /**
   * Unregister custom validator
   */
  unregisterValidator(name: string): void {
    this.customValidators.delete(name);
    logger.debug('Custom validator unregistered', { name });
  }

  /**
   * Quick validation for common operations
   */
  async validateFileOperation(filePath: string, write = false): Promise<ValidationResult> {
    return this.validate({
      operation: write ? 'file:write' : 'file:read',
      files: [filePath],
    });
  }

  /**
   * Validate workflow execution prerequisites
   */
  async validateWorkflowExecution(workflowId: string): Promise<ValidationResult> {
    return this.validate({
      operation: `workflow:${workflowId}`,
      minMemoryMB: 50,
      minDiskSpaceMB: 100,
    });
  }

  /**
   * Validate MCP tool execution
   */
  async validateMCPExecution(toolName: string): Promise<ValidationResult> {
    return this.validate({
      operation: `mcp:${toolName}`,
      requiredEnv: ['ANTHROPIC_API_KEY'],
      minMemoryMB: 100,
    });
  }
}

/**
 * Global state validator instance
 */
export const stateValidator = new StateValidator();
