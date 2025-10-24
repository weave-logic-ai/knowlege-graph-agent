/**
 * Generate Spec-Kit Files for a Phase
 *
 * Usage:
 *   bun run generate-spec <phase-id>
 *   bun run generate-spec phase-5-mcp-integration
 *
 * This script generates initial spec files.
 * Run /speckit.* commands in Claude Code for AI refinement.
 */

import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { generatePhaseSpec } from '../src/spec-generator/index.js';

const VAULT_PATH = process.env['VAULT_PATH'] || '/home/aepod/dev/weave-nn/weave-nn';
const PHASES_DIR = join(VAULT_PATH, '_planning/phases');
const SPECS_DIR = join(VAULT_PATH, '_planning/specs');

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ Error: Phase ID required');
    console.log('');
    console.log('Usage:');
    console.log('  bun run generate-spec <phase-id>');
    console.log('');
    console.log('Examples:');
    console.log('  bun run generate-spec phase-5');
    console.log('  bun run generate-spec phase-5-mcp-integration');
    console.log('  bun run generate-spec PHASE-5');
    console.log('');
    console.log('Available phases:');

    if (existsSync(PHASES_DIR)) {
      const files = readdirSync(PHASES_DIR).filter((f) => f.endsWith('.md') && f.startsWith('phase-'));
      files.forEach((file) => {
        console.log(`  - ${file.replace('.md', '')}`);
      });
    }

    process.exit(1);
  }

  const phaseInput = args[0];

  // Normalize phase ID
  let phaseId = phaseInput.toUpperCase();
  if (!phaseId.startsWith('PHASE-')) {
    phaseId = 'PHASE-' + phaseId.replace(/^phase-/i, '');
  }

  // Find matching phase document
  const phaseFiles = readdirSync(PHASES_DIR).filter((f) => {
    const filename = f.toLowerCase();
    const searchTerm = phaseInput.toLowerCase().replace(/^phase-/, '');
    return filename.includes(searchTerm) && filename.endsWith('.md');
  });

  if (phaseFiles.length === 0) {
    console.log(`❌ No phase document found matching: ${phaseInput}`);
    console.log('');
    console.log('Available phases:');
    const allFiles = readdirSync(PHASES_DIR).filter((f) => f.endsWith('.md') && f.startsWith('phase-'));
    allFiles.forEach((file) => {
      console.log(`  - ${file.replace('.md', '')}`);
    });
    process.exit(1);
  }

  if (phaseFiles.length > 1) {
    console.log(`⚠️  Multiple phase documents found for: ${phaseInput}`);
    phaseFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    console.log('');
    console.log('Please be more specific with the phase ID.');
    process.exit(1);
  }

  const phaseFile = phaseFiles[0];
  const phasePath = join(PHASES_DIR, phaseFile);

  console.log('🔧 Generating spec-kit files');
  console.log(`Phase: ${phaseFile}`);
  console.log(`Source: ${phasePath}`);
  console.log(`Output: ${SPECS_DIR}/${phaseId.toLowerCase()}`);
  console.log('');

  try {
    await generatePhaseSpec({
      phaseId,
      phasePath,
      outputDir: SPECS_DIR,
      includeContext: false,
      verbose: true,
    });

    console.log('');
    console.log('✅ Spec-kit files generated successfully!');
    console.log('');
    console.log('Next steps (run in Claude Code):');
    console.log(`  1. cd ${SPECS_DIR}/${phaseId.toLowerCase()}`);
    console.log('  2. Run: /speckit.constitution');
    console.log('  3. Run: /speckit.specify');
    console.log('  4. Run: /speckit.plan');
    console.log('  5. Run: /speckit.tasks');
    console.log('');
    console.log('After refinement, sync tasks:');
    console.log(`  bun run sync-tasks-ai ${phaseId.toLowerCase().replace('phase-', '')}`);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to generate spec-kit files:', error);
    process.exit(1);
  }
}

main();
