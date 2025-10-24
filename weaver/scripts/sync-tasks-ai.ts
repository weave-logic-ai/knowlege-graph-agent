/**
 * AI-Powered Task Sync from Spec to Phase Document
 *
 * Uses Claude to intelligently sync tasks from specification.md back to phase document,
 * preserving structure and only updating task checkboxes (not Success Criteria).
 *
 * Usage:
 *   bun run sync-tasks-ai <phase-id>
 *   bun run sync-tasks-ai phase-6-vault-initialization
 */

import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';

// Load .env file
config();

const VAULT_PATH = process.env['VAULT_PATH'] || '/home/aepod/dev/weave-nn/weave-nn';
const SPECS_DIR = join(VAULT_PATH, '_planning/specs');
const ANTHROPIC_API_KEY = process.env['ANTHROPIC_API_KEY'];

if (!ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
  console.error('   Make sure it exists in /weaver/.env');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const SYNC_PROMPT = `You are a task synchronization assistant. Your job is to read tasks from a specification.md file and update the corresponding checkboxes in a phase planning document.

CRITICAL RULES:
1. ONLY update checkboxes under **Tasks**: sections
2. NEVER modify **Success Criteria**: sections
3. NEVER modify **Dependencies**: sections
4. Match tasks by description (fuzzy matching is OK)
5. Preserve all other content exactly as-is
6. Maintain markdown formatting

INPUT FORMAT:
- specification.md: Contains numbered tasks like "### Task 1: Description"
- phase-document.md: Contains checkbox tasks like "- [ ] Description"

OUTPUT:
Return the COMPLETE updated phase document with synchronized task checkboxes.

EXAMPLE:

Spec has:
### Task 1: Implement framework detection
### Task 2: Build directory scanner

Phase document before:
**Tasks**:
- [ ] Implement framework detection
- [ ] Build directory scanner

**Success Criteria**:
- [ ] Framework detection works
- [ ] Scanner handles edge cases

Phase document after (only Tasks updated, Success Criteria untouched):
**Tasks**:
- [x] Implement framework detection  # Marked complete based on spec status
- [x] Build directory scanner

**Success Criteria**:
- [ ] Framework detection works  # UNCHANGED
- [ ] Scanner handles edge cases  # UNCHANGED
`;

interface SyncResult {
  updatedContent: string;
  tasksUpdated: number;
}

async function syncTasksWithClaude(
  specContent: string,
  phaseContent: string
): Promise<SyncResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    temperature: 0,
    system: SYNC_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Synchronize tasks from specification to phase document.

SPECIFICATION CONTENT:
${specContent}

PHASE DOCUMENT CONTENT:
${phaseContent}

Return ONLY the complete updated phase document content. No explanations.`,
      },
    ],
  });

  const updatedContent = response.content[0].type === 'text' ? response.content[0].text : '';

  // Count how many tasks were updated (simple heuristic)
  const originalCheckboxCount = (phaseContent.match(/- \[x\]/g) || []).length;
  const updatedCheckboxCount = (updatedContent.match(/- \[x\]/g) || []).length;
  const tasksUpdated = Math.abs(updatedCheckboxCount - originalCheckboxCount);

  return {
    updatedContent,
    tasksUpdated,
  };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ Error: Phase ID required');
    console.log('');
    console.log('Usage:');
    console.log('  bun run sync-tasks-ai <phase-id>');
    console.log('');
    console.log('Examples:');
    console.log('  bun run sync-tasks-ai phase-6-vault-initialization');
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

  console.log('🤖 AI-powered task sync from spec to phase document');
  console.log(`Spec: ${specPath}`);
  console.log(`Phase: ${sourceDocument}`);
  console.log('');

  try {
    // Read both files
    const specContent = readFileSync(specPath, 'utf-8');
    const phaseContent = readFileSync(sourceDocument, 'utf-8');

    console.log('🔄 Calling Claude to sync tasks...');

    // Use Claude to sync
    const result = await syncTasksWithClaude(specContent, phaseContent);

    // Write updated phase document
    writeFileSync(sourceDocument, result.updatedContent, 'utf-8');

    console.log(`✅ Synced tasks to phase document`);
    console.log(`   Estimated changes: ~${result.tasksUpdated} checkboxes`);
    console.log('');
    console.log('✅ Task sync completed successfully!');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to sync tasks:', error);
    process.exit(1);
  }
}

main();
