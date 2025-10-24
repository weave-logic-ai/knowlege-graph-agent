/**
 * Automated Spec Generation & Sync Workflow
 *
 * Runs complete spec-kit workflow:
 * 1. Generate initial specs from phase document
 * 2. Run /speckit.constitution (AI refinement)
 * 3. Run /speckit.specify (AI elaboration)
 * 4. Run /speckit.plan (AI planning)
 * 5. Run /speckit.tasks (AI task breakdown)
 * 6. Review prompt
 * 7. Sync back to phase document
 *
 * Usage:
 *   bun run generate-spec phase-6-vault-initialization
 *   (This replaces the old generate-spec command)
 */

import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';
import { generatePhaseSpec } from '../src/spec-generator/index.js';
import * as readline from 'readline';

// Load .env file
config();

const VAULT_PATH = process.env['VAULT_PATH'] || '/home/aepod/dev/weave-nn/weave-nn';
const PHASES_DIR = join(VAULT_PATH, '_planning/phases');
const SPECS_DIR = join(VAULT_PATH, '_planning/specs');
const ANTHROPIC_API_KEY = process.env['ANTHROPIC_API_KEY'];

if (!ANTHROPIC_API_KEY) {
  console.error('❌ Error: ANTHROPIC_API_KEY environment variable not set');
  console.error('   Make sure it exists in /weaver/.env');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface SpecKitStep {
  name: string;
  description: string;
  systemPrompt: string;
  inputFile: string;
  outputFile: string;
}

const SPEC_KIT_WORKFLOW: SpecKitStep[] = [
  {
    name: 'constitution',
    description: 'Refine project principles and constraints',
    systemPrompt: `You are a technical specification assistant using the Spec-Kit methodology.

TASK: Refine and validate the constitution.md document.

The constitution defines:
- Project principles and objectives
- Technical constraints
- Dependencies
- Success criteria
- Quality standards

Review the constitution and:
1. Ensure principles are clear and actionable
2. Validate technical constraints are realistic
3. Check dependencies are correctly identified
4. Refine success criteria to be measurable
5. Add any missing quality standards

Return the COMPLETE refined constitution.md content.`,
    inputFile: 'constitution.md',
    outputFile: 'constitution.md',
  },
  {
    name: 'specify',
    description: 'Elaborate requirements and scope',
    systemPrompt: `You are a technical specification assistant using the Spec-Kit methodology.

TASK: Elaborate the specification.md document with detailed requirements.

Based on the constitution and phase plan:
1. Write comprehensive requirements for each objective
2. Define clear deliverables with acceptance criteria
3. Specify what is in-scope vs out-of-scope
4. Add architectural considerations
5. Define integration points

Return the COMPLETE elaborated specification.md content with all sections filled in.`,
    inputFile: 'specification.md',
    outputFile: 'specification.md',
  },
  {
    name: 'plan',
    description: 'Create implementation plan',
    systemPrompt: `You are a technical specification assistant using the Spec-Kit methodology.

TASK: Create a detailed implementation plan in plan.md.

Based on the constitution and specification:
1. Break down implementation into phases/milestones
2. Identify critical path items
3. Estimate effort and timeline
4. Define resource requirements
5. List risks and mitigation strategies
6. Create dependency graph

Return a COMPLETE plan.md document with:
- Implementation phases
- Timeline and milestones
- Resource allocation
- Risk assessment
- Dependencies and blockers`,
    inputFile: 'specification.md',
    outputFile: 'plan.md',
  },
  {
    name: 'tasks',
    description: 'Generate detailed task breakdown',
    systemPrompt: `You are a technical specification assistant using the Spec-Kit methodology.

TASK: Generate comprehensive task breakdown in tasks.md.

Based on the plan and specification:
1. Break down each phase into concrete tasks
2. Add subtasks for complex items
3. Define task dependencies
4. Estimate effort per task
5. Assign priority levels
6. Add acceptance criteria per task

Return a COMPLETE tasks.md document with:
- All tasks numbered hierarchically (1, 1.1, 1.2, 2, 2.1, etc.)
- Clear descriptions
- Dependencies marked
- Effort estimates
- Priority levels
- Acceptance criteria`,
    inputFile: 'plan.md',
    outputFile: 'tasks.md',
  },
];

async function runSpecKitStep(
  step: SpecKitStep,
  specDir: string,
  phaseContent: string
): Promise<void> {
  console.log(`\n🔧 Running: /speckit.${step.name}`);
  console.log(`   ${step.description}`);

  const inputPath = join(specDir, step.inputFile);
  const outputPath = join(specDir, step.outputFile);

  let inputContent = '';
  if (existsSync(inputPath)) {
    inputContent = readFileSync(inputPath, 'utf-8');
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    temperature: 0.3,
    system: step.systemPrompt,
    messages: [
      {
        role: 'user',
        content: `PHASE PLANNING DOCUMENT:
${phaseContent}

CURRENT ${step.inputFile.toUpperCase()}:
${inputContent}

Generate the refined/elaborated ${step.outputFile}. Return ONLY the complete document content.`,
      },
    ],
  });

  const outputContent = response.content[0].type === 'text' ? response.content[0].text : '';
  writeFileSync(outputPath, outputContent, 'utf-8');

  console.log(`   ✅ Generated ${step.outputFile}`);
}

async function syncTasksWithClaude(
  specContent: string,
  phaseContent: string
): Promise<string> {
  const SYNC_PROMPT = `You are a task synchronization assistant. Your job is to read tasks from a specification/tasks document and update the corresponding checkboxes in a phase planning document.

CRITICAL RULES:
1. ONLY update checkboxes under **Tasks**: sections
2. NEVER modify **Success Criteria**: sections
3. NEVER modify **Dependencies**: sections
4. Match tasks by description (fuzzy matching is OK)
5. Preserve all other content exactly as-is
6. Maintain markdown formatting

Return the COMPLETE updated phase document with synchronized task checkboxes.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    temperature: 0,
    system: SYNC_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Synchronize tasks from spec to phase document.

SPEC CONTENT:
${specContent}

PHASE DOCUMENT CONTENT:
${phaseContent}

Return ONLY the complete updated phase document content.`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('❌ Error: Phase ID required');
    console.log('');
    console.log('Usage:');
    console.log('  bun run generate-spec <phase-id>');
    console.log('');
    console.log('Examples:');
    console.log('  bun run generate-spec phase-6-vault-initialization');
    console.log('');
    console.log('This will:');
    console.log('  1. Generate initial specs from phase document');
    console.log('  2. Run /speckit.constitution (AI refinement)');
    console.log('  3. Run /speckit.specify (AI elaboration)');
    console.log('  4. Run /speckit.plan (AI planning)');
    console.log('  5. Run /speckit.tasks (AI task breakdown)');
    console.log('  6. Prompt for review');
    console.log('  7. Sync tasks back to phase document');
    console.log('');
    process.exit(1);
  }

  const phaseInput = args[0];

  // Find matching phase document
  const phaseFiles = readdirSync(PHASES_DIR).filter((f) => {
    const filename = f.toLowerCase();
    const searchTerm = phaseInput.toLowerCase().replace(/^phase-/, '');
    return filename.includes(searchTerm) && filename.endsWith('.md');
  });

  if (phaseFiles.length === 0) {
    console.log(`❌ No phase document found matching: ${phaseInput}`);
    process.exit(1);
  }

  if (phaseFiles.length > 1) {
    console.log(`⚠️  Multiple phase documents found for: ${phaseInput}`);
    phaseFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    console.log('Please be more specific.');
    process.exit(1);
  }

  const phaseFile = phaseFiles[0];
  const phasePath = join(PHASES_DIR, phaseFile);
  const phaseContent = readFileSync(phasePath, 'utf-8');

  // Normalize phase ID
  let phaseId = phaseInput.toUpperCase();
  if (!phaseId.startsWith('PHASE-')) {
    phaseId = 'PHASE-' + phaseId.replace(/^phase-/i, '');
  }

  console.log('🚀 Automated Spec-Kit Workflow');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Phase: ${phaseFile}`);
  console.log(`Source: ${phasePath}`);
  console.log('');

  // Step 1: Generate initial specs
  console.log('📝 Step 1: Generate initial specification files');
  await generatePhaseSpec({
    phaseId,
    phasePath,
    outputDir: SPECS_DIR,
    verbose: false,
  });

  const specDir = join(SPECS_DIR, phaseId.toLowerCase());
  console.log(`   ✅ Generated in ${specDir}`);

  // Step 2-5: Run spec-kit workflow
  console.log('\n🤖 Step 2-5: AI-powered spec refinement');
  for (const step of SPEC_KIT_WORKFLOW) {
    await runSpecKitStep(step, specDir, phaseContent);
  }

  // Step 6: Review prompt
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Spec generation complete!');
  console.log('');
  console.log(`📁 Spec files generated in: ${specDir}`);
  console.log('   - constitution.md (principles & constraints)');
  console.log('   - specification.md (requirements & scope)');
  console.log('   - plan.md (implementation plan)');
  console.log('   - tasks.md (detailed task breakdown)');
  console.log('');
  console.log('Please review the generated specs before syncing back to phase document.');
  console.log('');

  const shouldSync = await promptUser('Sync tasks back to phase document? (yes/no): ');

  if (shouldSync.toLowerCase() !== 'yes' && shouldSync.toLowerCase() !== 'y') {
    console.log('\n⏸️  Sync skipped. Run `bun run sync-tasks-ai phase-6` later to sync.');
    console.log('');
    process.exit(0);
  }

  // Step 7: Sync back to phase
  console.log('\n🔄 Step 6: Syncing tasks back to phase document');

  const tasksPath = join(specDir, 'tasks.md');
  const tasksContent = existsSync(tasksPath)
    ? readFileSync(tasksPath, 'utf-8')
    : readFileSync(join(specDir, 'specification.md'), 'utf-8');

  const updatedPhaseContent = await syncTasksWithClaude(tasksContent, phaseContent);
  writeFileSync(phasePath, updatedPhaseContent, 'utf-8');

  console.log('   ✅ Phase document updated');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 Workflow complete!');
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Review changes: git diff ${phasePath}`);
  console.log('  2. Begin implementation following the spec');
  console.log('');
}

main().catch((error) => {
  console.error('❌ Workflow failed:', error);
  process.exit(1);
});
