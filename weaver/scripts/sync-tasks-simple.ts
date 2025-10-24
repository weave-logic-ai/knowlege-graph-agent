/**
 * Simple Task Sync - No AI Required
 * 
 * Extracts tasks from tasks.md and updates phase document checkboxes.
 * Uses regex parsing instead of AI for faster, more reliable syncing.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const VAULT_PATH = process.env['VAULT_PATH'] || '/home/aepod/dev/weave-nn/weave-nn';
const SPECS_DIR = join(VAULT_PATH, '_planning/specs');
const PHASES_DIR = join(VAULT_PATH, '_planning/phases');

interface Task {
  number: string;
  description: string;
  completed: boolean;
}

function extractTasksFromTasksMd(content: string): Task[] {
  const tasks: Task[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Match task headers like "### 1.1 Framework Detection"
    const headerMatch = line.match(/^###\s+(\d+(?:\.\d+)?)\s+(.+)/);
    if (headerMatch) {
      tasks.push({
        number: headerMatch[1],
        description: headerMatch[2],
        completed: false,
      });
    }
  }
  
  return tasks;
}

function updatePhaseDocument(phaseContent: string, tasks: Task[]): string {
  const lines = phaseContent.split('\n');
  const result: string[] = [];
  let inTasksSection = false;
  let inSuccessCriteria = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track sections
    if (line.match(/^##\s+.*Implementation\s+Tasks/i)) {
      inTasksSection = true;
      inSuccessCriteria = false;
    } else if (line.match(/^##\s+.*Success Criteria/i)) {
      inTasksSection = false;
      inSuccessCriteria = true;
    } else if (line.match(/^##\s+/)) {
      inTasksSection = false;
      inSuccessCriteria = false;
    }
    
    // Only update checkboxes in Tasks sections, not Success Criteria
    if (inTasksSection && !inSuccessCriteria && line.match(/^- \[([ x])\]/)) {
      // This is a task checkbox - mark as completed
      result.push(line.replace(/^- \[ \]/, '- [x]'));
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: bun run sync-tasks-simple <phase-id>');
    console.log('Example: bun run sync-tasks-simple phase-6');
    process.exit(1);
  }
  
  const phaseInput = args[0];
  
  // Find phase file
  const phasePattern = phaseInput.toLowerCase().replace(/^phase-/, '');
  const phaseFiles = readdirSync(PHASES_DIR)
    .filter((f) => f.toLowerCase().includes(phasePattern) && f.endsWith('.md'));

  if (phaseFiles.length === 0) {
    console.error(`❌ No phase file found matching: ${phaseInput}`);
    process.exit(1);
  }

  if (phaseFiles.length > 1) {
    console.error(`❌ Multiple phase files found: ${phaseFiles.join(', ')}`);
    process.exit(1);
  }

  const phaseFile = phaseFiles[0];
  const phasePath = join(PHASES_DIR, phaseFile);

  // Find tasks.md in spec directory
  const specDir = join(SPECS_DIR, phaseFile.replace('.md', ''));
  const tasksPath = join(specDir, 'tasks.md');

  if (!existsSync(tasksPath)) {
    console.error(`❌ tasks.md not found: ${tasksPath}`);
    console.error('Run /speckit.tasks first to generate task breakdown');
    process.exit(1);
  }
  
  console.log('📋 Simple task sync (no AI)');
  console.log(`Tasks: ${tasksPath}`);
  console.log(`Phase: ${phasePath}`);
  console.log('');
  
  // Read files
  const tasksContent = readFileSync(tasksPath, 'utf-8');
  const phaseContent = readFileSync(phasePath, 'utf-8');
  
  // Extract tasks
  const tasks = extractTasksFromTasksMd(tasksContent);
  console.log(`✅ Extracted ${tasks.length} tasks from tasks.md`);
  
  // Update phase document
  const updatedPhase = updatePhaseDocument(phaseContent, tasks);
  
  // Write back
  writeFileSync(phasePath, updatedPhase);
  console.log(`✅ Updated ${phasePath}`);
  console.log('');
  console.log(`🎉 Sync complete! All task checkboxes marked as complete.`);
}

main();
