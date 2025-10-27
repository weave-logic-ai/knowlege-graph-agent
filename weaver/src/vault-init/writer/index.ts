/**
 * Vault Writer Module
 *
 * Exports for vault writing system.
 */

export { writeVault } from './vault-writer.js';
export { writeMarkdownFile, writeMarkdownFiles, validateMarkdownContent } from './markdown-writer.js';
export { generateVaultReadme, generateVaultStats } from './readme-generator.js';
export { generateConceptMap } from './concept-map-generator.js';
export { populateShadowCache, verifyShadowCache } from './shadow-cache-populator.js';
export { initializeGitRepository, isGitRepository } from './git-initializer.js';

export type { VaultWriterOptions, VaultWriteResult } from './vault-writer.js';
