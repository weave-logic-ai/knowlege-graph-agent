/**
 * Spec-Kit Workflow
 *
 * Automated AI-powered specification generation workflow.
 * Uses existing workflow engine to orchestrate spec-kit methodology.
 */

import { WorkflowDefinition, WorkflowContext } from './types.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
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

    // Step 2: Run /speckit.constitution
    logger.info('📋 Step 2: Refining principles with /speckit.constitution');
    try {
      execSync('claude /speckit.constitution', {
        cwd: specDir,
        stdio: 'inherit',
      });
      logger.info('✅ Constitution refined');
    } catch (error) {
      logger.error('❌ Failed to refine constitution', error);
      throw error;
    }

    // Step 3: Run /speckit.specify
    logger.info('📝 Step 3: Elaborating requirements with /speckit.specify');
    try {
      execSync('claude /speckit.specify', {
        cwd: specDir,
        stdio: 'inherit',
      });
      logger.info('✅ Specification elaborated');
    } catch (error) {
      logger.error('❌ Failed to elaborate specification', error);
      throw error;
    }

    // Step 4: Run /speckit.plan
    logger.info('🗺️  Step 4: Creating implementation plan with /speckit.plan');
    try {
      execSync('claude /speckit.plan', {
        cwd: specDir,
        stdio: 'inherit',
      });
      logger.info('✅ Implementation plan created');
    } catch (error) {
      logger.error('❌ Failed to create plan', error);
      throw error;
    }

    // Step 5: Run /speckit.tasks
    logger.info('✅ Step 5: Generating task breakdown with /speckit.tasks');
    try {
      execSync('claude /speckit.tasks', {
        cwd: specDir,
        stdio: 'inherit',
      });
      logger.info('✅ Task breakdown generated');
    } catch (error) {
      logger.error('❌ Failed to generate tasks', error);
      throw error;
    }

    logger.info('');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info('🎉 Spec-Kit generation complete!');
    logger.info('');
    logger.info('Review the generated specs in:');
    logger.info(`   ${specDir}`);
    logger.info('');
    logger.info('To sync tasks back to phase document:');
    logger.info(`   bun run sync-tasks-ai ${phaseId.toLowerCase()}`);
    logger.info('═══════════════════════════════════════════════════════════');

    return {
      success: true,
      specDir,
      phaseId,
      message: 'Spec-Kit generation complete. Ready to sync tasks.',
    };
  },
};
