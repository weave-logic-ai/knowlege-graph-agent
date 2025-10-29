/**
 * Workflow API Client - Interact with Next.js Workflow Server
 *
 * This module provides a client for the CLI to interact with the Next.js
 * Workflow DevKit server via HTTP API.
 */

import chalk from 'chalk';
import type { DocumentConnectionInput, DocumentConnectionResult } from '../../../workflows/document-connection.js';

export interface WorkflowServerConfig {
  baseUrl: string;
  port: number;
}

export const DEFAULT_CONFIG: WorkflowServerConfig = {
  baseUrl: 'http://localhost',
  port: 3000,
};

/**
 * Workflow API Client
 */
export class WorkflowApiClient {
  private baseUrl: string;

  constructor(config: WorkflowServerConfig = DEFAULT_CONFIG) {
    this.baseUrl = `${config.baseUrl}:${config.port}`;
  }

  /**
   * Check if the workflow server is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/workflows`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get list of available workflows
   */
  async listWorkflows(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/workflows`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to list workflows: ${response.statusText}`);
    }

    const data = await response.json() as { workflows?: any[] };
    return data.workflows || [];
  }

  /**
   * Execute document connection workflow
   */
  async executeDocumentConnection(
    input: DocumentConnectionInput
  ): Promise<{ runId: string; result: DocumentConnectionResult }> {
    const response = await fetch(`${this.baseUrl}/api/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string };
      throw new Error(error.error || `Failed to execute workflow: ${response.statusText}`);
    }

    return response.json() as Promise<{ runId: string; result: DocumentConnectionResult }>;
  }

  /**
   * Get server info
   */
  async getServerInfo(): Promise<string> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get server info: ${response.statusText}`);
    }

    return response.text();
  }
}

/**
 * Start the Next.js workflow server if not running
 */
export async function ensureWorkflowServer(config: WorkflowServerConfig = DEFAULT_CONFIG): Promise<boolean> {
  const client = new WorkflowApiClient(config);

  if (await client.healthCheck()) {
    return true;
  }

  console.log(chalk.yellow('\n⚠️  Workflow server is not running'));
  console.log(chalk.gray('Start it with: npm run dev:web'));
  console.log(chalk.gray(`Expected at: ${config.baseUrl}:${config.port}\n`));

  return false;
}
