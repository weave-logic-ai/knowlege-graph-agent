/**
 * Generate Command
 *
 * Generate or update knowledge graph from documentation.
 *
 * @module cli/commands/generate
 */

import { Command } from 'commander';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { generateAndSave, updateGraph } from '../../generators/graph-generator.js';
import { docsExist } from '../../generators/docs-init.js';

/**
 * Create the generate command
 */
export function createGenerateCommand(): Command {
  const cmd = new Command('generate')
    .alias('gen')
    .description('Generate or update knowledge graph from documentation')
    .option('-p, --path <path>', 'Project root path', process.cwd())
    .option('-d, --docs <path>', 'Documentation path', 'docs')
    .option('-o, --output <path>', 'Output path for graph files')
    .option('--incremental', 'Only update changed files')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
      const projectRoot = resolve(options.path);
      const docsPath = options.docs;
      const outputPath = options.output || join(projectRoot, docsPath);
      const verbose = options.verbose;
      const incremental = options.incremental;

      console.log(`\n📊 Generating knowledge graph from: ${projectRoot}\n`);

      try {
        // Check docs exist
        if (!docsExist(projectRoot, docsPath)) {
          console.error(`❌ Documentation not found at ${docsPath}/`);
          console.log('   Run "kg init" first to set up documentation');
          process.exit(1);
        }

        // Check database exists
        const dbPath = join(projectRoot, '.kg', 'knowledge.db');
        if (!existsSync(dbPath)) {
          console.error('❌ Knowledge graph database not found');
          console.log('   Run "kg init" first to initialize the database');
          process.exit(1);
        }

        if (incremental) {
          // Incremental update
          const docsRoot = join(projectRoot, docsPath);
          const updateResult = await updateGraph(dbPath, docsRoot);

          console.log('  ✓ Graph updated incrementally');
          if (verbose) {
            console.log(`    Added: ${updateResult.added} nodes`);
            console.log(`    Updated: ${updateResult.updated} nodes`);
            console.log(`    Removed: ${updateResult.removed} nodes`);
          }

          if (updateResult.errors.length > 0) {
            console.log('  ⚠ Update had errors:');
            updateResult.errors.forEach((e: string) => console.log(`    - ${e}`));
          }
        } else {
          // Full generation
          const genResult = await generateAndSave(
            {
              projectRoot,
              outputPath,
            },
            dbPath
          );

          if (genResult.success) {
            console.log('  ✓ Graph generated successfully');
            if (verbose) {
              console.log(`    Files scanned: ${genResult.stats.filesScanned}`);
              console.log(`    Nodes: ${genResult.stats.nodesCreated}`);
              console.log(`    Edges: ${genResult.stats.edgesCreated}`);
            }
          } else {
            console.log('  ⚠ Generation had errors:');
            genResult.stats.errors.forEach((e: string) => console.log(`    - ${e}`));
          }
        }

        console.log('\n✨ Generation complete!\n');

      } catch (error) {
        console.error('\n❌ Generation failed:', error);
        process.exit(1);
      }
    });

  return cmd;
}
