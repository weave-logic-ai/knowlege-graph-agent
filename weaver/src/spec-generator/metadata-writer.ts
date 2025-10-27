/**
 * Metadata Writer for Spec-Kit
 *
 * Writes .speckit/metadata.json with correct camelCase format:
 * - sourceDocument (not source_document)
 * - phaseId
 * - phaseName
 * - generatedAt
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface SpecKitMetadata {
  phaseId: string;
  phaseName: string;
  generatedAt: string;
  sourceDocument: string; // camelCase, not snake_case
  version?: string;
  toolVersion?: string;
}

/**
 * Write metadata.json with camelCase fields
 */
export function writeMetadata(specDir: string, metadata: SpecKitMetadata): void {
  const metadataDir = join(specDir, '.speckit');
  const metadataPath = join(metadataDir, 'metadata.json');

  // Ensure directory exists
  mkdirSync(metadataDir, { recursive: true });

  // Write with pretty formatting
  const json = JSON.stringify(metadata, null, 2);
  writeFileSync(metadataPath, json + '\n', 'utf-8');
}

/**
 * Create metadata object from phase data
 */
export function createMetadata(
  phaseId: string,
  phaseName: string,
  sourceDocument: string
): SpecKitMetadata {
  return {
    phaseId,
    phaseName,
    generatedAt: new Date().toISOString(),
    sourceDocument, // camelCase!
    version: '1.0.0',
    toolVersion: '0.1.0',
  };
}

/**
 * Validate metadata format
 *
 * Warns if using deprecated snake_case fields
 */
export function validateMetadata(metadata: Record<string, unknown>): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check for required fields (camelCase)
  const required: Array<keyof SpecKitMetadata> = [
    'phaseId',
    'phaseName',
    'generatedAt',
    'sourceDocument',
  ];

  required.forEach((field) => {
    if (!metadata[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Warn about deprecated snake_case usage
  if ('source_document' in metadata) {
    warnings.push(
      'Deprecated: "source_document" should be "sourceDocument" (camelCase)'
    );
  }
  if ('phase_id' in metadata) {
    warnings.push('Deprecated: "phase_id" should be "phaseId" (camelCase)');
  }
  if ('phase_name' in metadata) {
    warnings.push('Deprecated: "phase_name" should be "phaseName" (camelCase)');
  }
  if ('generated_at' in metadata) {
    warnings.push(
      'Deprecated: "generated_at" should be "generatedAt" (camelCase)'
    );
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Migrate metadata from snake_case to camelCase
 */
export function migrateMetadata(
  oldMetadata: Record<string, unknown>
): SpecKitMetadata {
  return {
    phaseId: (oldMetadata['phase_id'] || oldMetadata['phaseId']) as string,
    phaseName: (oldMetadata['phase_name'] || oldMetadata['phaseName']) as string,
    generatedAt: (oldMetadata['generated_at'] || oldMetadata['generatedAt']) as string,
    sourceDocument: (oldMetadata['source_document'] ||
      oldMetadata['sourceDocument']) as string,
    version: oldMetadata['version'] as string | undefined,
    toolVersion: oldMetadata['tool_version'] as string | undefined,
  };
}
