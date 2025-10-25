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

interface TaskGroup {
  title: string;
  tasks: Task[];
}

interface Task {
  number: string;
  title: string;
  effort?: string;
  priority?: string;
  dependencies?: string;
  description: string[];
  acceptanceCriteria: string[];
  implementationNotes: string[];
}

function extractTasksFromTasksMd(content: string): TaskGroup[] {
  const groups: TaskGroup[] = [];
  const lines = content.split('\n');
  let currentGroup: TaskGroup | null = null;
  let currentTask: Task | null = null;
  let currentSection: 'description' | 'acceptance' | 'implementation' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match group headers like "## 1. Project Codebase Scanner (Days 1-3)" or "## Day 1: MCP Server Foundation"
    const groupMatch = line.match(/^##\s+(?:(\d+)\.\s+)?(.+?)(?:\s+\((.+?)\))?$/);
    if (groupMatch && !line.includes('Overview') && !line.includes('Critical Path') && !line.includes('Effort Summary')) {
      if (currentTask && currentGroup) {
        currentGroup.tasks.push(currentTask);
        currentTask = null;
      }
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        title: groupMatch[2],
        tasks: []
      };
      continue;
    }

    // Match task headers: "### 1.1 Framework Detection" or "#### 1.1. Install MCP SDK"
    const taskMatch = line.match(/^#{3,4}\s+(\d+(?:\.\d+)?)\s*\.?\s*(.+)/);
    if (taskMatch) {
      if (currentTask && currentGroup) {
        currentGroup.tasks.push(currentTask);
      }
      currentTask = {
        number: taskMatch[1],
        title: taskMatch[2],
        description: [],
        acceptanceCriteria: [],
        implementationNotes: []
      };
      currentSection = null;
      continue;
    }

    if (!currentTask) continue;

    // Match effort/priority/dependencies line
    const metaMatch = line.match(/\*\*Effort\*\*:\s*(.+?)\s*\|\s*\*\*Priority\*\*:\s*(.+?)(?:\s*\|\s*\*\*Dependencies\*\*:\s*(.+))?$/);
    if (metaMatch) {
      currentTask.effort = metaMatch[1];
      currentTask.priority = metaMatch[2];
      currentTask.dependencies = metaMatch[3] || 'None';
      continue;
    }

    // Detect sections
    if (line.match(/^\*\*Acceptance Criteria\*\*:/)) {
      currentSection = 'acceptance';
      continue;
    }
    if (line.match(/^\*\*Implementation Notes\*\*:/)) {
      currentSection = 'implementation';
      continue;
    }
    if (line.match(/^---$/)) {
      currentSection = null;
      continue;
    }

    // Add content to appropriate section
    if (currentSection === 'acceptance' && line.match(/^- \[/)) {
      currentTask.acceptanceCriteria.push(line.replace(/^- \[ \] /, ''));
    } else if (currentSection === 'implementation' && line.match(/^- /)) {
      currentTask.implementationNotes.push(line.replace(/^- /, ''));
    } else if (!currentSection && line.trim() && !line.match(/^\*\*/)) {
      currentTask.description.push(line);
    }
  }

  // Push last task and group
  if (currentTask && currentGroup) {
    currentGroup.tasks.push(currentTask);
  }
  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

function updatePhaseDocument(phaseContent: string, groups: TaskGroup[]): string {
  const lines = phaseContent.split('\n');
  const result: string[] = [];
  let tasksInserted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track sections
    if (line.match(/^##\s+.*Implementation\s+Tasks/i)) {
      result.push(line);
      result.push('');

      // Insert task groups with full context
      if (!tasksInserted) {
        for (const group of groups) {
          result.push(`### ${group.title}`);
          result.push('');

          for (const task of group.tasks) {
            // Task header with checkbox
            result.push(`- [ ] **${task.number} ${task.title}**`);

            // Metadata (effort, priority, dependencies)
            const meta: string[] = [];
            if (task.effort) meta.push(`**Effort**: ${task.effort}`);
            if (task.priority) meta.push(`**Priority**: ${task.priority}`);
            if (task.dependencies) meta.push(`**Dependencies**: ${task.dependencies}`);
            if (meta.length > 0) {
              result.push(`  ${meta.join(' | ')}`);
            }

            // Description
            if (task.description.length > 0) {
              result.push('');
              task.description.forEach(desc => result.push(`  ${desc.trim()}`));
            }

            // Acceptance criteria
            if (task.acceptanceCriteria.length > 0) {
              result.push('');
              result.push('  **Acceptance Criteria**:');
              task.acceptanceCriteria.forEach(ac => result.push(`  - ${ac}`));
            }

            // Implementation notes
            if (task.implementationNotes.length > 0) {
              result.push('');
              result.push('  **Implementation Notes**:');
              task.implementationNotes.forEach(note => result.push(`  - ${note}`));
            }

            result.push('');
          }
        }
        tasksInserted = true;
      }

      // Skip existing task content until next section
      while (i + 1 < lines.length && !lines[i + 1].match(/^##\s+/)) {
        i++;
      }
      continue;
    }

    result.push(line);
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
  
  // Extract task groups
  const groups = extractTasksFromTasksMd(tasksContent);
  const totalTasks = groups.reduce((sum, g) => sum + g.tasks.length, 0);
  console.log(`✅ Extracted ${groups.length} task groups with ${totalTasks} tasks from tasks.md`);

  // Update phase document
  const updatedPhase = updatePhaseDocument(phaseContent, groups);

  // Write back
  writeFileSync(phasePath, updatedPhase);
  console.log(`✅ Updated ${phasePath}`);
  console.log('');
  console.log(`🎉 Sync complete! ${totalTasks} tasks across ${groups.length} groups synced with full context.`);
}

main();
