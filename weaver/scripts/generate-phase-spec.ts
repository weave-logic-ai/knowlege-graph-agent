/**
 * Generate Spec-Kit Files for a Phase
 *
 * Usage:
 *   bun run generate-spec <phase-id>
 *   bun run generate-spec phase-5-mcp-integration
 *
 * This script:
 * 1. Generates initial spec files
 * 2. Invokes workflow to get agent tasks
 * 3. Prints instructions for spawning agents in Claude Code
 */

import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { specKitWorkflow } from '../src/workflows/spec-kit-workflow.js';

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

  console.log('🚀 Starting Spec-Kit Workflow');
  console.log(`Phase: ${phaseFile}`);
  console.log(`Source: ${phasePath}`);
  console.log(`Output: ${SPECS_DIR}/${phaseId.toLowerCase()}`);
  console.log('');

  try {
    // Invoke workflow
    const result = await specKitWorkflow.handler({
      input: { phaseId, phasePath },
      fileEvent: undefined,
      trigger: 'manual',
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Initial specs generated!');
    console.log('');
    console.log('🤖 Ready to spawn Claude Code agents');
    console.log('');
    console.log('Copy and paste this into Claude Code to spawn agents:');
    console.log('');
    console.log('─────────────────────────────────────────────────────────');

    // Generate Task tool calls for Claude Code
    if (result.agentTasks) {
      result.agentTasks.forEach((task, index) => {
        console.log(`Task ${index + 1}: ${task.name}`);
        console.log(`Working directory: ${task.workingDir}`);
        console.log(`Command: ${task.command}`);
        console.log('');
      });
    }

    console.log('Spawn all agents in a SINGLE Claude Code message:');
    console.log('');
    console.log(`Task("Constitution agent", "cd ${result.specDir} && run ${result.agentTasks?.[0]?.command} to refine principles and constraints", "general-purpose")`);
    console.log(`Task("Specification agent", "cd ${result.specDir} && run ${result.agentTasks?.[1]?.command} to elaborate requirements", "general-purpose")`);
    console.log(`Task("Planning agent", "cd ${result.specDir} && run ${result.agentTasks?.[2]?.command} to create implementation plan", "general-purpose")`);
    console.log(`Task("Task breakdown agent", "cd ${result.specDir} && run ${result.agentTasks?.[3]?.command} to generate detailed tasks", "general-purpose")`);
    console.log('');
    console.log('─────────────────────────────────────────────────────────');
    console.log('');
    console.log('After agents complete, sync tasks:');
    console.log(`  bun run sync-tasks-ai ${phaseId.toLowerCase().replace('phase-', '')}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  } catch (error) {
    console.error('❌ Workflow failed:', error);
    process.exit(1);
  }
}

main();
