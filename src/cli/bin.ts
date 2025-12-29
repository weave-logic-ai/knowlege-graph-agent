#!/usr/bin/env node
/**
 * Knowledge Graph Agent CLI
 *
 * Command-line interface for knowledge graph operations.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createCLI } from './index.js';

async function main(): Promise<void> {
  const program = createCLI();

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
