/**
 * Configuration Validator
 * Validates service configuration files and watches for changes
 */

import fs from 'fs/promises';
import { watch } from 'fs';
import path from 'path';
import { logger } from './logger.js';
import type { ServiceConfig } from './types.js';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  config?: ServiceConfig;
}

/**
 * Config validator service
 */
export class ConfigValidator {
  private watchers = new Map<string, ReturnType<typeof watch>>();
  private configCache = new Map<string, ServiceConfig>();

  /**
   * Validate configuration file
   */
  async validateConfigFile(configPath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Read file
      const content = await fs.readFile(configPath, 'utf-8');

      // Parse JSON
      let config: any;
      try {
        config = JSON.parse(content);
      } catch (parseError: any) {
        return {
          valid: false,
          errors: [`Invalid JSON syntax: ${parseError.message}`],
          warnings: [],
        };
      }

      // Validate required fields
      if (!config.name) {
        errors.push('Missing required field: name');
      }

      if (!config.script) {
        errors.push('Missing required field: script');
      }

      // Validate types
      if (config.name && typeof config.name !== 'string') {
        errors.push('Field "name" must be a string');
      }

      if (config.script && typeof config.script !== 'string') {
        errors.push('Field "script" must be a string');
      }

      // Validate optional fields
      if (config.max_restarts !== undefined) {
        if (
          typeof config.max_restarts !== 'number' ||
          config.max_restarts < 0
        ) {
          errors.push('Field "max_restarts" must be a non-negative number');
        }
      }

      if (config.min_uptime !== undefined) {
        if (typeof config.min_uptime !== 'number' || config.min_uptime < 0) {
          errors.push('Field "min_uptime" must be a non-negative number');
        }
      }

      // Check if script exists
      if (config.script) {
        try {
          await fs.access(config.script);
        } catch {
          warnings.push(`Script file not found: ${config.script}`);
        }
      }

      // Apply defaults
      const validatedConfig: ServiceConfig = {
        name: config.name,
        type: config.type || 'custom',
        enabled: config.enabled !== undefined ? config.enabled : true,
        script: config.script,
        interpreter: config.interpreter || 'node',
        args: config.args || [],
        cwd: config.cwd,
        env: config.env || {},
        max_restarts: config.max_restarts !== undefined ? config.max_restarts : 10,
        min_uptime: config.min_uptime !== undefined ? config.min_uptime : 5000,
        restart_delay: config.restart_delay || 1000,
        health: config.health,
        logs: config.logs,
        metrics: config.metrics,
      };

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        config: validatedConfig,
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [`Failed to read config file: ${error.message}`],
        warnings: [],
      };
    }
  }

  /**
   * Load and validate configuration
   */
  async loadConfig(configPath: string): Promise<ServiceConfig> {
    const result = await this.validateConfigFile(configPath);

    if (!result.valid) {
      throw new Error(
        `Configuration validation failed:\n${result.errors.join('\n')}`
      );
    }

    if (result.warnings.length > 0) {
      logger.warn('Configuration warnings:', result.warnings);
    }

    if (!result.config) {
      throw new Error('No configuration returned from validation');
    }

    // Cache the config
    this.configCache.set(configPath, result.config);

    return result.config;
  }

  /**
   * Watch configuration file for changes
   */
  async watchConfig(
    configPath: string,
    onChange: (config: ServiceConfig) => void | Promise<void>
  ): Promise<() => void> {
    // Stop existing watcher if any
    this.stopWatching(configPath);

    logger.info(`Watching config file: ${configPath}`);

    const watcher = watch(configPath, async (eventType) => {
      if (eventType === 'change') {
        try {
          logger.info(`Config file changed: ${configPath}`);

          // Wait a bit for file write to complete
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Reload and validate
          const config = await this.loadConfig(configPath);

          // Notify callback
          await onChange(config);

          logger.info(`Config reloaded successfully: ${configPath}`);
        } catch (error) {
          logger.error('Failed to reload config', error);
        }
      }
    });

    this.watchers.set(configPath, watcher);

    // Return cleanup function
    return () => this.stopWatching(configPath);
  }

  /**
   * Stop watching a configuration file
   */
  stopWatching(configPath: string): void {
    const watcher = this.watchers.get(configPath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(configPath);
      logger.debug(`Stopped watching config: ${configPath}`);
    }
  }

  /**
   * Stop all watchers
   */
  stopAll(): void {
    for (const [path, watcher] of this.watchers.entries()) {
      watcher.close();
      logger.debug(`Stopped watching config: ${path}`);
    }
    this.watchers.clear();
  }

  /**
   * Get cached config
   */
  getCachedConfig(configPath: string): ServiceConfig | undefined {
    return this.configCache.get(configPath);
  }

  /**
   * Merge config with command-line options
   */
  mergeWithOptions(
    config: ServiceConfig,
    options: Record<string, any>
  ): ServiceConfig {
    return {
      ...config,
      max_restarts:
        options.maxRestarts !== undefined
          ? options.maxRestarts
          : config.max_restarts,
      min_uptime:
        options.minUptime !== undefined ? options.minUptime : config.min_uptime,
      max_memory_restart:
        options.maxMemory !== undefined
          ? options.maxMemory
          : config.max_memory_restart,
      env: options.env ? { ...config.env, ...options.env } : config.env,
    };
  }
}

/**
 * Singleton instance
 */
export const configValidator = new ConfigValidator();
