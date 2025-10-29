#!/usr/bin/env node
/**
 * Icon Cultivation CLI Script
 * Wrapper for the icon application workflow
 */

import { runIconApplicationWorkflow } from '../src/workflows/kg/icon-application.js';
import chalk from 'chalk';

async function main() {
  const mode = process.argv[2] as 'incremental' | 'full' | 'watch';
  const dryRun = process.argv.includes('--dry-run');

  if (!['incremental', 'full', 'watch'].includes(mode)) {
    console.log(chalk.yellow('Usage: npx tsx scripts/cultivate-icons.ts <mode> [--dry-run]'));
    console.log('');
    console.log('Modes:');
    console.log('  incremental  Process only new/modified files since last run');
    console.log('  full         Process all files in the vault');
    console.log('  watch        Continuous monitoring and application');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run    Preview changes without applying');
    process.exit(1);
  }

  console.log(chalk.bold.green('\n🎨 Icon Application Workflow\n'));
  console.log(`Mode: ${mode}`);
  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}\n`);

  const result = await runIconApplicationWorkflow(mode, dryRun);

  if (mode !== 'watch') {
    console.log(chalk.green('\n✅ Icon application complete!\n'));
    console.log(`Files processed: ${result.filesProcessed}`);
    console.log(`Files updated: ${result.filesUpdated}`);
    console.log(`Files skipped: ${result.filesSkipped}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s\n`);

    if (result.errors.length > 0) {
      console.log(chalk.yellow(`⚠️  ${result.errors.length} errors:`));
      result.errors.forEach((err) => {
        console.log(`   ${err.file}: ${err.error}`);
      });
    }
  }
}

main().catch((error) => {
  console.error(chalk.red('❌ Fatal error:'), error);
  process.exit(1);
});
