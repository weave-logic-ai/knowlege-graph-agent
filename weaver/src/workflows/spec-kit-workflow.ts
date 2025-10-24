/**
 * Spec-Kit Workflow
 *
 * Generates initial specification files from phase documents.
 * Spawns Claude Code agents to run /speckit.* commands via Task tool.
 */

import { WorkflowDefinition, WorkflowContext } from './types.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { generatePhaseSpec } from '../spec-generator/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export const specKitWorkflow: WorkflowDefinition = {
  id: 'spec-kit-generation',
  name: 'Spec-Kit Generation Workflow',
  description: 'Generate complete spec-kit files from phase document using AI refinement',
  enabled: true,
  triggers: [], // Manual trigger only

  handler: async (context: WorkflowContext) => {
    const { input } = context;

    if (!input?.phaseId) {
      throw new Error('phaseId required in workflow input');
    }

    const phaseId = input.phaseId as string;
    const phasePath = input.phasePath as string;
    const specsDir = join(config.vault.path, '_planning/specs');
    const specDir = join(specsDir, phaseId.toLowerCase());

    logger.info('🚀 Starting Spec-Kit workflow', { phaseId, phasePath });

    // Step 1: Generate initial specs
    logger.info('📝 Step 1: Generating initial specification files');
    await generatePhaseSpec({
      phaseId,
      phasePath,
      outputDir: specsDir,
      verbose: false,
    });
    logger.info('✅ Initial specs generated', { specDir });

    // Step 2-5: Spawn Claude Code agents to run /speckit.* commands
    logger.info('');
    logger.info('🤖 Spawning Claude Code agents to refine specifications...');
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('Running /speckit commands via Claude Code agents:');
    logger.info('  1. /speckit.constitution - Refining principles');
    logger.info('  2. /speckit.specify - Elaborating requirements');
    logger.info('  3. /speckit.plan - Creating implementation plan');
    logger.info('  4. /speckit.tasks - Generating task breakdown');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('');
    logger.info('NOTE: Agent execution will be shown in Claude Code output.');
    logger.info('After completion, sync tasks with:');
    logger.info(`   bun run sync-tasks-ai ${phaseId.toLowerCase().replace('phase-', '')}`);
    logger.info('');

    return {
      success: true,
      specDir,
      phaseId,
      agentTasks: [
        {
          name: 'Constitution Refinement',
          command: '/speckit.constitution',
          workingDir: specDir,
        },
        {
          name: 'Specification Elaboration',
          command: '/speckit.specify',
          workingDir: specDir,
        },
        {
          name: 'Implementation Planning',
          command: '/speckit.plan',
          workingDir: specDir,
        },
        {
          name: 'Task Breakdown',
          command: '/speckit.tasks',
          workingDir: specDir,
        },
      ],
      message: 'Specs generated. Spawning agents to run /speckit commands...',
    };
  },
};
