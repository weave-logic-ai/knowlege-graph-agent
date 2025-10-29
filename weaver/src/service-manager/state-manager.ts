/**
 * State Manager
 * Manages service state persistence and restoration
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';
import type { ServiceState, ServiceStatus } from './types.js';

/**
 * Persisted service state
 */
export interface PersistedState {
  serviceName: string;
  state: ServiceState;
  status: ServiceStatus;
  timestamp: string;
  environment?: Record<string, string>;
  customData?: Record<string, any>;
}

/**
 * State manager for service persistence
 */
export class StateManager {
  private stateDir: string;

  constructor(stateDir: string = '.weaver/services/state') {
    this.stateDir = stateDir;
  }

  /**
   * Initialize state directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.stateDir, { recursive: true });
      logger.debug(`Initialized state directory: ${this.stateDir}`);
    } catch (error) {
      logger.error('Failed to initialize state directory', error);
      throw error;
    }
  }

  /**
   * Save service state
   */
  async saveState(
    serviceName: string,
    status: ServiceStatus,
    customData?: Record<string, any>
  ): Promise<void> {
    try {
      await this.initialize();

      const state: PersistedState = {
        serviceName,
        state: status.state,
        status,
        timestamp: new Date().toISOString(),
        customData,
      };

      const statePath = this.getStatePath(serviceName);
      await fs.writeFile(statePath, JSON.stringify(state, null, 2));

      logger.debug(`Saved state for service ${serviceName}`);
    } catch (error) {
      logger.error(`Failed to save state for ${serviceName}`, error);
    }
  }

  /**
   * Restore service state
   */
  async restoreState(serviceName: string): Promise<PersistedState | null> {
    try {
      const statePath = this.getStatePath(serviceName);
      const content = await fs.readFile(statePath, 'utf-8');
      const state = JSON.parse(content) as PersistedState;

      logger.debug(`Restored state for service ${serviceName}`);
      return state;
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.error(`Failed to restore state for ${serviceName}`, error);
      }
      return null;
    }
  }

  /**
   * Delete service state
   */
  async deleteState(serviceName: string): Promise<void> {
    try {
      const statePath = this.getStatePath(serviceName);
      await fs.unlink(statePath);
      logger.debug(`Deleted state for service ${serviceName}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        logger.error(`Failed to delete state for ${serviceName}`, error);
      }
    }
  }

  /**
   * List all saved states
   */
  async listStates(): Promise<string[]> {
    try {
      await this.initialize();
      const files = await fs.readdir(this.stateDir);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => path.basename(f, '.json'));
    } catch (error) {
      logger.error('Failed to list states', error);
      return [];
    }
  }

  /**
   * Clean old states
   */
  async cleanOldStates(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const states = await this.listStates();
      const now = Date.now();

      for (const serviceName of states) {
        const state = await this.restoreState(serviceName);
        if (state) {
          const stateAge = now - new Date(state.timestamp).getTime();
          if (stateAge > maxAge) {
            await this.deleteState(serviceName);
            logger.debug(`Cleaned old state for ${serviceName}`);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to clean old states', error);
    }
  }

  /**
   * Get state file path
   */
  private getStatePath(serviceName: string): string {
    return path.join(this.stateDir, `${serviceName}.json`);
  }

  /**
   * Save state before restart
   */
  async saveBeforeRestart(
    serviceName: string,
    status: ServiceStatus
  ): Promise<void> {
    await this.saveState(serviceName, status, {
      reason: 'restart',
      savedAt: new Date().toISOString(),
    });
  }

  /**
   * Save state before shutdown
   */
  async saveBeforeShutdown(
    serviceName: string,
    status: ServiceStatus
  ): Promise<void> {
    await this.saveState(serviceName, status, {
      reason: 'shutdown',
      savedAt: new Date().toISOString(),
    });
  }
}

/**
 * Singleton instance
 */
export const stateManager = new StateManager();
