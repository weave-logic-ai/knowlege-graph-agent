/**
 * Search Command
 *
 * Search the knowledge graph.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';
import { createDatabase } from '../../core/database.js';
import { validateProjectRoot } from '../../core/security.js';

/**
 * Create search command
 */
export function createSearchCommand(): Command {
  const command = new Command('search');

  command
    .description('Search the knowledge graph')
    .argument('<query>', 'Search query')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-t, --type <type>', 'Filter by node type')
    .option('-g, --tag <tag>', 'Filter by tag')
    .option('-l, --limit <number>', 'Limit results', '20')
    .option('--json', 'Output as JSON')
    .action(async (query, options) => {
      try {
        // Validate path to prevent traversal attacks
        const projectRoot = validateProjectRoot(options.path);
        const dbPath = join(projectRoot, '.kg', 'knowledge.db');

        // Check if database exists
        if (!existsSync(dbPath)) {
          console.log(chalk.yellow('  Knowledge graph not found'));
          console.log(chalk.gray('  Run ') + chalk.cyan('kg graph') + chalk.gray(' to generate one'));
          return;
        }

        const db = createDatabase(dbPath);
        const limit = parseInt(options.limit, 10);

        let results;

        if (options.tag) {
          // Search by tag
          results = db.getNodesByTag(options.tag);
        } else if (options.type) {
          // Search by type
          results = db.getNodesByType(options.type);
        } else {
          // Full-text search
          results = db.searchNodes(query, limit);
        }

        // Apply additional filters
        if (options.type && !options.tag) {
          results = results.filter(n => n.type === options.type);
        }

        // Limit results
        results = results.slice(0, limit);

        if (options.json) {
          console.log(JSON.stringify(results.map(n => ({
            id: n.id,
            title: n.title,
            type: n.type,
            status: n.status,
            path: n.path,
            tags: n.tags,
          })), null, 2));
          db.close();
          return;
        }

        console.log(chalk.cyan(`\n  Search Results for "${query}"\n`));

        if (results.length === 0) {
          console.log(chalk.gray('  No results found'));
          db.close();
          return;
        }

        console.log(chalk.gray(`  Found ${results.length} result${results.length === 1 ? '' : 's'}\n`));

        results.forEach((node, i) => {
          const statusColor = node.status === 'active' ? chalk.green :
                             node.status === 'draft' ? chalk.yellow :
                             node.status === 'deprecated' ? chalk.red : chalk.gray;

          console.log(chalk.white(`  ${i + 1}. ${node.title}`));
          console.log(chalk.gray(`     Type: ${node.type} | Status: `) + statusColor(node.status));
          console.log(chalk.gray(`     Path: ${node.path}`));

          if (node.tags.length > 0) {
            console.log(chalk.gray('     Tags: ') + chalk.blue(node.tags.join(', ')));
          }

          // Show connections
          const incoming = node.incomingLinks.length;
          const outgoing = node.outgoingLinks.length;
          if (incoming > 0 || outgoing > 0) {
            console.log(chalk.gray(`     Links: ${incoming} incoming, ${outgoing} outgoing`));
          }

          console.log();
        });

        db.close();

      } catch (error) {
        console.error(chalk.red('Search failed:'), String(error));
        process.exit(1);
      }
    });

  return command;
}
