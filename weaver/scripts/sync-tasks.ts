/**
 * Sync Tasks from Spec-Kit to Phase Document
 *
 * Reads tasks from the generated spec-kit specification.md and updates
 * the phase document's task checkboxes accordingly.
 *
 * Usage:
 *   bun run sync-tasks <phase-id>
 *   bun run sync-tasks phase-6
 */

import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';

const VAULT_PATH = process.env['VAULT_PATH'] || '/home/aepod/dev/weave-nn/weave-nn';
const PHASES_DIR = join(VAULT_PATH, '_planning/phases');
const SPECS_DIR = join(VAULT_PATH, '_planning/specs');

interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
}

function parseSpecTasks(specPath: string): Task[] {
  const content = readFileSync(specPath, 'utf-8');
  const tasks: Task[] = [];

  // Match task sections in specification.md (handles "Tasks", "Initial Task Breakdown", etc.)
  const taskSectionMatch = content.match(/##\s*(?:Initial\s+)?Task(?:s|\s+Breakdown)?.*?\n([\s\S]*?)(?=\n##\s+[A-Z]|$)/i);
  if (!taskSectionMatch || !taskSectionMatch[1]) {
    console.log('⚠️  No tasks section found in specification.md');
    return tasks;
  }

  const taskSection = taskSectionMatch[1];

  // Parse numbered task headers: ### Task 1: Description
  const taskMatches = taskSection.match(/###\s+Task\s+\d+:\s+(.+)/g);

  if (taskMatches) {
    taskMatches.forEach((taskHeader, index) => {
      const match = taskHeader.match(/###\s+Task\s+\d+:\s+(.+)/);
      if (match && match[1]) {
        tasks.push({
          id: `task-${index + 1}`,
          description: match[1].trim(),
          status: 'pending',
        });
      }
    });
  } else {
    // Fallback: Parse checkbox format for backwards compatibility
    const taskLines = taskSection.split('\n').filter(line => line.trim().match(/^-\s*\[([ x~])\]/));

    taskLines.forEach((line, index) => {
      const match = line.match(/^-\s*\[([ x~])\]\s*(.+)$/);
      if (match) {
        const [, checkbox, description] = match;
        let status: 'pending' | 'in_progress' | 'completed' = 'pending';

        if (checkbox === 'x') status = 'completed';
        else if (checkbox === '~') status = 'in_progress';

        tasks.push({
          id: `task-${index + 1}`,
          description: description.trim(),
          status,
        });
      }
    });
  }

  return tasks;
}

function updatePhaseDocument(phasePath: string, tasks: Task[]): void {
  let content = readFileSync(phasePath, 'utf-8');

  // Find the Implementation Tasks section
  const tasksSectionMatch = content.match(/(##\s*.*(?:Implementation\s+)?Tasks.*\n)([\s\S]*?)(?=\n##\s*✅|$)/i);

  if (!tasksSectionMatch) {
    console.log('⚠️  No Implementation Tasks section found in phase document');
    console.log('    Task sync requires a section like "## Implementation Tasks" or "## 📋 Implementation Tasks"');
    return;
  }

  const [fullMatch, sectionHeader, sectionContent] = tasksSectionMatch;

  // Update task checkboxes in the section
  let updatedContent = sectionContent;
  let changeCount = 0;

  tasks.forEach((task) => {
    // Find matching task by description (fuzzy match)
    const taskDescPattern = task.description.substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const taskRegex = new RegExp(`^(\\s*-\\s*\\[)[ x~](\\]\\s*${taskDescPattern})`, 'm');

    const match = updatedContent.match(taskRegex);
    if (match) {
      const checkbox = task.status === 'completed' ? 'x' : task.status === 'in_progress' ? '~' : ' ';
      const replacement = `${match[1]}${checkbox}${match[2]}`;
      updatedContent = updatedContent.replace(taskRegex, replacement);
      changeCount++;
    }
  });

  if (changeCount === 0) {
    console.log('⚠️  No matching tasks found to sync');
    console.log('    This may be due to differences in task descriptions between spec and phase document');
    return;
  }

  // Replace the section in the full content
  content = content.replace(tasksSectionMatch[0], sectionHeader + updatedContent);

  // Write updated content
  writeFileSync(phasePath, content, 'utf-8');
  console.log(`✅ Synced ${changeCount} tasks to phase document`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ Error: Phase ID required');
    console.log('');
    console.log('Usage:');
    console.log('  bun run sync-tasks <phase-id>');
    console.log('');
    console.log('Examples:');
    console.log('  bun run sync-tasks phase-5');
    console.log('  bun run sync-tasks phase-6-vault-initialization');
    console.log('');
    console.log('Available specs:');

    if (existsSync(SPECS_DIR)) {
      const dirs = readdirSync(SPECS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
      dirs.forEach((dir) => {
        console.log(`  - ${dir}`);
      });
    }

    process.exit(1);
  }

  const phaseInput = args[0];

  // Find matching spec directory
  const specDirs = readdirSync(SPECS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => {
      const dirName = d.name.toLowerCase();
      const searchTerm = phaseInput.toLowerCase().replace(/^phase-/, '');
      return dirName.includes(searchTerm);
    })
    .map((d) => d.name);

  if (specDirs.length === 0) {
    console.log(`❌ No spec directory found matching: ${phaseInput}`);
    console.log('');
    console.log('Available specs:');
    const allDirs = readdirSync(SPECS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    allDirs.forEach((dir) => {
      console.log(`  - ${dir}`);
    });
    process.exit(1);
  }

  if (specDirs.length > 1) {
    console.log(`⚠️  Multiple spec directories found for: ${phaseInput}`);
    specDirs.forEach((dir, index) => {
      console.log(`  ${index + 1}. ${dir}`);
    });
    console.log('');
    console.log('Please be more specific with the phase ID.');
    process.exit(1);
  }

  const specDir = specDirs[0];
  const specPath = join(SPECS_DIR, specDir, 'specification.md');
  const metadataPath = join(SPECS_DIR, specDir, '.speckit/metadata.json');

  if (!existsSync(specPath)) {
    console.log(`❌ specification.md not found in: ${join(SPECS_DIR, specDir)}`);
    console.log('   Run "bun run generate-spec" first to generate the spec.');
    process.exit(1);
  }

  // Read metadata to find source document
  let sourceDocument: string | undefined;
  if (existsSync(metadataPath)) {
    const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
    sourceDocument = metadata.sourceDocument;
  }

  if (!sourceDocument || !existsSync(sourceDocument)) {
    console.log('❌ Source phase document not found');
    console.log('   Check .speckit/metadata.json for source document path');
    process.exit(1);
  }

  console.log('🔄 Syncing tasks from spec to phase document');
  console.log(`Spec: ${specPath}`);
  console.log(`Phase: ${sourceDocument}`);
  console.log('');

  try {
    // Parse tasks from spec
    const tasks = parseSpecTasks(specPath);
    console.log(`📋 Found ${tasks.length} tasks in spec`);

    if (tasks.length === 0) {
      console.log('⚠️  No tasks to sync');
      process.exit(0);
    }

    // Update phase document
    updatePhaseDocument(sourceDocument, tasks);

    console.log('');
    console.log('✅ Task sync completed successfully!');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to sync tasks:', error);
    process.exit(1);
  }
}

main();
