/**
 * Spec-Kit Workflow
 *
 * Automated AI-powered specification generation workflow.
 * Uses existing workflow engine to orchestrate spec-kit methodology.
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

    // Step 2-5: AI refinement via Claude Code
    logger.info('🤖 Step 2-5: Ready for AI-powered refinement');
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('Next steps (run in Claude Code):');
    logger.info('');
    logger.info('1. Open the spec directory:');
    logger.info(`   cd ${specDir}`);
    logger.info('');
    logger.info('2. Run spec-kit commands:');
    logger.info('   /speckit.constitution   # Refine principles');
    logger.info('   /speckit.specify        # Elaborate requirements');
    logger.info('   /speckit.plan           # Create implementation plan');
    logger.info('   /speckit.tasks          # Generate task breakdown');
    logger.info('');
    logger.info('3. Review generated specs');
    logger.info('');
    logger.info('4. Sync back to phase document:');
    logger.info('   bun run sync-tasks-ai ' + phaseId.toLowerCase());
    logger.info('═══════════════════════════════════════════════════════════');

    return {
      success: true,
      specDir,
      phaseId,
      message: 'Initial specs generated. Run /speckit commands in Claude Code to refine.',
    };
  },
};
