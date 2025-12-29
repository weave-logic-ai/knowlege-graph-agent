/**
 * Hive Mind - Knowledge Graph Reconnection Tools
 *
 * A suite of CLI tools for analyzing and reconnecting knowledge graphs
 * to reduce orphan rates and increase link density.
 *
 * SPEC-003: Hive Mind Reconnection Tools
 *
 * Target Metrics:
 * - Orphan rate: 88.1% -> < 10%
 * - Link density: 1.08 -> > 5.0
 */

// Re-export classes for programmatic use
export { LinkAnalyzer } from './analyze-links.js';
export type { LinkAnalysisResult, BrokenLink, AnalyzeOptions } from './analyze-links.js';

export { ConnectionFinder } from './find-connections.js';
export type { ConnectionFinderResult, SimilarityMatch, FindConnectionsOptions } from './find-connections.js';

export { NameValidator } from './validate-names.js';
export type { ValidationResult, InvalidFile, NamingSchema, ValidateNamesOptions } from './validate-names.js';

export { FrontmatterEnricher } from './add-frontmatter.js';
export type { EnrichResult, EnrichedFile, FrontmatterTemplate, EnrichOptions } from './add-frontmatter.js';

// Re-export CLI command creators
export { createAnalyzeLinksCommand } from './analyze-links.js';
export { createFindConnectionsCommand } from './find-connections.js';
export { createValidateNamesCommand } from './validate-names.js';
export { createAddFrontmatterCommand } from './add-frontmatter.js';

import { Command } from 'commander';
import { createAnalyzeLinksCommand } from './analyze-links.js';
import { createFindConnectionsCommand } from './find-connections.js';
import { createValidateNamesCommand } from './validate-names.js';
import { createAddFrontmatterCommand } from './add-frontmatter.js';

/**
 * Create the hive-mind command group
 *
 * Groups all Hive Mind reconnection tools under a single command namespace:
 * - kg hive-mind analyze-links <vault>
 * - kg hive-mind find-connections <vault>
 * - kg hive-mind validate-names <vault>
 * - kg hive-mind add-frontmatter <vault>
 */
export function createHiveMindCommand(): Command {
  const command = new Command('hive-mind')
    .description('Knowledge graph reconnection tools - reduce orphan rate and increase link density')
    .alias('hm');

  // Add subcommands
  command.addCommand(createAnalyzeLinksCommand());
  command.addCommand(createFindConnectionsCommand());
  command.addCommand(createValidateNamesCommand());
  command.addCommand(createAddFrontmatterCommand());

  // Default action - show help
  command.action(() => {
    command.help();
  });

  return command;
}

export default createHiveMindCommand;
