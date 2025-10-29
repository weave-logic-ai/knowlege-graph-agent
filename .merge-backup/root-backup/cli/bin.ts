#!/usr/bin/env node

/**
 * CLI entry point for Weaver
 */

import { runCLI } from './index.js';

// Run the CLI
runCLI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
