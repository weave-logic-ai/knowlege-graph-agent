/**
 * Git Integration Layer - Example Usage
 *
 * This demonstrates how to use the Git integration layer
 * for safe workflow operations.
 */

import { GitIntegration } from '../../src/workflows/kg/git/index.js';
import path from 'path';

async function demonstrateGitIntegration() {
  // Initialize with vault root
  const vaultRoot = process.env.VAULT_ROOT || path.join(process.cwd(), 'vault');
  const git = new GitIntegration(vaultRoot);

  console.log('🚀 Git Integration Layer Demo\n');

  // 1. Create a workflow branch
  console.log('📁 Creating workflow branch...');
  const branchName = await git.branches.createWorkflowBranch('demo-workflow');
  console.log(`✅ Created branch: ${branchName}\n`);

  try {
    // 2. Simulate workflow changes
    console.log('📝 Making workflow changes...');

    // In real workflow, files would be created/modified here
    // For demo, we'll just show the commit process

    // 3. Check for changes
    const hasChanges = await git.commit.hasChanges();
    console.log(`📊 Has uncommitted changes: ${hasChanges}\n`);

    if (hasChanges) {
      // 4. Get modified files
      const modifiedFiles = await git.commit.getModifiedFiles();
      console.log('📄 Modified files:');
      modifiedFiles.forEach(file => console.log(`   - ${file}`));
      console.log();

      // 5. Commit changes with metadata
      console.log('💾 Committing changes...');
      const commitHash = await git.commit.commit({
        message: 'Demo workflow execution',
        files: modifiedFiles,
        workflowId: 'demo-123',
        metadata: {
          step: 'demonstration',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });
      console.log(`✅ Committed: ${commitHash.substring(0, 8)}\n`);
    }

    // 6. Show current branch
    const currentBranch = await git.branches.getCurrentBranch();
    console.log(`🌿 Current branch: ${currentBranch}\n`);

    // 7. Generate rollback command
    const rollbackCmd = git.rollback.generateRollbackCommand(branchName);
    console.log('🔄 Rollback command (if needed):');
    console.log(`   ${rollbackCmd}\n`);

  } catch (error) {
    console.error('❌ Error during workflow:', error);

    // Rollback on error
    console.log('\n🔄 Rolling back changes...');
    await git.rollback.discardChanges();
    console.log('✅ Changes discarded\n');

  } finally {
    // 8. Cleanup
    console.log('🧹 Cleaning up...');

    // Check if branch exists before deletion
    const exists = await git.branches.branchExists(branchName);
    if (exists) {
      await git.branches.deleteWorkflowBranch(branchName, true);
      console.log(`✅ Deleted branch: ${branchName}\n`);
    }
  }

  console.log('✨ Demo complete!\n');
}

/**
 * Example: Complete workflow with error handling
 */
async function entityExtractionWorkflow(vaultRoot: string) {
  const git = new GitIntegration(vaultRoot);
  const workflowId = `extract-entities-${Date.now()}`;

  // Create workflow branch
  const branchName = await git.branches.createWorkflowBranch('extract-entities');

  try {
    // Step 1: Extract entities
    // (File creation would happen here)

    // Step 2: Commit entities
    await git.commit.commit({
      message: 'Extract entities from documentation',
      files: ['entities/User.md', 'entities/Product.md'],
      workflowId,
      metadata: {
        step: 'entity-extraction',
        documentsProcessed: 15,
        entitiesFound: 2
      }
    });

    // Step 3: Extract relationships
    // (More file operations)

    // Step 4: Commit relationships
    await git.commit.commit({
      message: 'Map entity relationships',
      files: ['relationships/user-product.md'],
      workflowId,
      metadata: {
        step: 'relationship-mapping',
        relationshipsFound: 5
      }
    });

    // Workflow complete - merge or keep branch
    console.log('✅ Workflow completed successfully');

  } catch (error) {
    console.error('❌ Workflow failed:', error);

    // Rollback all changes
    await git.rollback.discardChanges();

    // Provide rollback command
    const rollbackCmd = git.rollback.generateRollbackCommand(branchName);
    console.log('🔄 To rollback:', rollbackCmd);

    throw error;

  } finally {
    // Optional: Delete branch if workflow completed successfully
    // await git.branches.deleteWorkflowBranch(branchName, true);
  }
}

/**
 * Example: Incremental workflow with checkpoints
 */
async function incrementalWorkflow(vaultRoot: string) {
  const git = new GitIntegration(vaultRoot);
  const workflowId = `incremental-${Date.now()}`;
  const branchName = await git.branches.createWorkflowBranch('incremental');

  const checkpoints: string[] = [];

  try {
    // Checkpoint 1: Initial extraction
    await git.commit.commit({
      message: 'Checkpoint 1: Initial extraction',
      files: ['data/phase1.md'],
      workflowId,
      metadata: { checkpoint: 1 }
    });
    checkpoints.push('phase1');

    // Checkpoint 2: Processing
    await git.commit.commit({
      message: 'Checkpoint 2: Data processing',
      files: ['data/phase2.md'],
      workflowId,
      metadata: { checkpoint: 2 }
    });
    checkpoints.push('phase2');

    // Checkpoint 3: Validation
    await git.commit.commit({
      message: 'Checkpoint 3: Validation',
      files: ['data/phase3.md'],
      workflowId,
      metadata: { checkpoint: 3 }
    });
    checkpoints.push('phase3');

    console.log('✅ All checkpoints completed:', checkpoints);

  } catch (error) {
    console.error(`❌ Failed at checkpoint ${checkpoints.length + 1}`);

    // Option 1: Rollback last commit only
    await git.rollback.rollbackLastCommit();
    console.log('🔄 Rolled back last checkpoint');

    // Option 2: Discard all uncommitted changes
    // await git.rollback.discardChanges();

    throw error;
  }
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateGitIntegration().catch(console.error);
}

export {
  demonstrateGitIntegration,
  entityExtractionWorkflow,
  incrementalWorkflow
};
