/**
 * Spec-Kit Generator - Main Entry Point
 *
 * Generates constitution.md, specification.md, and tasks.md from phase documents.
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parsePhaseDocument } from './parser.js';
import { generateSpecKitFiles } from './generator.js';
import { generateTasksDocument } from './task-generator.js';
import { writeMetadata, createMetadata } from './metadata-writer.js';
import type { GeneratorOptions } from './types.js';
import { logger } from '../utils/logger.js';

/**
 * Generate complete spec-kit for a phase
 */
export async function generatePhaseSpec(options: GeneratorOptions): Promise<void> {
  const { phaseId, phasePath, outputDir, verbose = false } = options;

  if (verbose) {
    logger.info('Generating spec-kit files', { phaseId, phasePath });
  }

  // Parse phase document
  const phaseData = parsePhaseDocument(phasePath);

  if (verbose) {
    logger.info('Phase data parsed', {
      objectives: phaseData.objectives.length,
      deliverables: phaseData.deliverables.length,
      tasks: phaseData.tasks.length,
    });
  }

  // Create spec directory
  const specDir = join(outputDir, phaseId.toLowerCase());
  if (!existsSync(specDir)) {
    mkdirSync(specDir, { recursive: true });
  }

  // Generate spec-kit files
  const specFiles = generateSpecKitFiles(phaseData);

  // Write constitution.md
  const constitutionPath = join(specDir, 'constitution.md');
  writeFileSync(constitutionPath, specFiles.constitution, 'utf-8');
  if (verbose) {
    logger.info('Created constitution.md', { path: constitutionPath });
  }

  // Write specification.md
  const specificationPath = join(specDir, 'specification.md');
  writeFileSync(specificationPath, specFiles.specification, 'utf-8');
  if (verbose) {
    logger.info('Created specification.md', { path: specificationPath });
  }

  // Generate and write tasks.md
  const tasksContent = generateTasksDocument(phaseData);
  const tasksPath = join(specDir, 'tasks.md');
  writeFileSync(tasksPath, tasksContent, 'utf-8');
  if (verbose) {
    logger.info('Created tasks.md', { path: tasksPath, tasks: phaseData.tasks.length });
  }

  // Write metadata.json with camelCase fields
  const metadata = createMetadata(phaseData.phaseId, phaseData.phaseName, phasePath);
  writeMetadata(specDir, metadata);
  if (verbose) {
    logger.info('Created metadata.json', { path: join(specDir, '.speckit/metadata.json') });
  }

  // Create README.md
  const readmePath = join(specDir, 'README.md');
  const readme = `# ${phaseData.phaseName} - Spec-Kit

Generated from phase planning document: ${phaseId}

## Files

- **constitution.md** - Project principles, constraints, and success criteria
- **specification.md** - Detailed requirements and deliverables
- **tasks.md** - Implementation task breakdown
- **.speckit/metadata.json** - Generation metadata

## Next Steps

1. Review and refine with \`/speckit.constitution\`
2. Elaborate requirements with \`/speckit.specify\`
3. Generate implementation plan with \`/speckit.plan\`
4. Break down tasks with \`/speckit.tasks\`
5. Begin implementation with \`/speckit.implement\`

## Sync Tasks

To sync tasks back to phase document:

\`\`\`bash
bun run sync-tasks-simple ${phaseId.toLowerCase().replace('phase-', '')}
\`\`\`

---

**Generated**: ${new Date().toISOString()}
**Tool Version**: 0.1.0
`;

  writeFileSync(readmePath, readme, 'utf-8');
  if (verbose) {
    logger.info('Created README.md', { path: readmePath });
  }

  logger.info(`✅ Spec-kit generated successfully at: ${specDir}`);
}

// Export all modules for external use
export * from './types.js';
export * from './parser.js';
export * from './generator.js';
export * from './task-generator.js';
export * from './metadata-writer.js';
