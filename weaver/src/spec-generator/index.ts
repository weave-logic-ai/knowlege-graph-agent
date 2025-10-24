/**
 * Spec-Kit Generator - Main Interface
 *
 * Generates spec-kit specifications from phase planning documents.
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parsePhaseDocument } from './parser.js';
import { generateSpecKitFiles } from './generator.js';
import type { GeneratorOptions } from './types.js';
import { logger } from '../utils/logger.js';

/**
 * Generate spec-kit files for a phase
 */
export async function generatePhaseSpec(options: GeneratorOptions): Promise<void> {
  const { phaseId, phasePath, outputDir, verbose = false } = options;

  logger.info('🔧 Generating spec-kit files', { phaseId, phasePath });

  // 1. Parse phase document
  if (!existsSync(phasePath)) {
    throw new Error(`Phase document not found: ${phasePath}`);
  }

  const phaseData = parsePhaseDocument(phasePath);

  if (verbose) {
    logger.info('Phase data extracted', {
      objectives: phaseData.objectives.length,
      deliverables: phaseData.deliverables.length,
      successCriteria: phaseData.successCriteria.length,
      tasks: phaseData.tasks.length,
    });
  }

  // 2. Generate spec-kit files
  const specFiles = generateSpecKitFiles(phaseData);

  // 3. Create output directory
  const specDir = join(outputDir, phaseId.toLowerCase());
  if (!existsSync(specDir)) {
    mkdirSync(specDir, { recursive: true });
  }

  // 4. Write files
  const constitutionPath = join(specDir, 'constitution.md');
  writeFileSync(constitutionPath, specFiles.constitution, 'utf-8');
  logger.info('✅ Generated constitution.md', { path: constitutionPath });

  const specificationPath = join(specDir, 'specification.md');
  writeFileSync(specificationPath, specFiles.specification, 'utf-8');
  logger.info('✅ Generated specification.md', { path: specificationPath });

  // 5. Create .speckit metadata directory
  const metadataDir = join(specDir, '.speckit');
  if (!existsSync(metadataDir)) {
    mkdirSync(metadataDir, { recursive: true });
  }

  // Write metadata
  const metadata = {
    phaseId: phaseData.phaseId,
    phaseName: phaseData.phaseName,
    generatedAt: new Date().toISOString(),
    sourceDocument: phasePath,
  };

  const metadataPath = join(metadataDir, 'metadata.json');
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  // 6. Create README with instructions
  const readme = `# ${phaseData.phaseName} - Spec-Kit Workflow

## Generated Specifications

- ✅ \`constitution.md\` - Project principles and constraints
- ✅ \`specification.md\` - Detailed requirements and scope

## Next Steps

### 1. Review Constitution
\`\`\`bash
# Open constitution.md in your AI coding agent (Claude Code, Copilot, etc.)
# Run: /speckit.constitution
# This will refine project principles and constraints
\`\`\`

### 2. Elaborate Specification
\`\`\`bash
# Open specification.md in your AI coding agent
# Run: /speckit.specify
# This will elaborate requirements and clarify scope
\`\`\`

### 3. Generate Implementation Plan
\`\`\`bash
# In your AI coding agent
# Run: /speckit.plan
# This will create a detailed technical implementation plan
# Output: plan.md
\`\`\`

### 4. Break Down Tasks
\`\`\`bash
# In your AI coding agent
# Run: /speckit.tasks
# This will generate an actionable task list
# Output: tasks.md
\`\`\`

### 5. Implement
\`\`\`bash
# In your AI coding agent
# Run: /speckit.implement
# This will begin implementation execution
\`\`\`

## Sync Tasks to Vault

After generating tasks.md, sync back to the vault:

\`\`\`bash
cd /home/aepod/dev/weave-nn/weaver
bun run sync-tasks ${phaseId.toLowerCase()}
\`\`\`

## Documentation

- [Spec-Kit Integration Guide](/weaver/docs/SPEC-KIT-INTEGRATION.md)
- [Phase Planning Document](${phasePath})
- [Weaver Documentation](/weaver/README.md)

---

**Generated**: ${new Date().toISOString()}
**Phase**: ${phaseData.phaseId} - ${phaseData.phaseName}
`;

  const readmePath = join(specDir, 'README.md');
  writeFileSync(readmePath, readme, 'utf-8');
  logger.info('✅ Generated README.md', { path: readmePath });

  logger.info('🎉 Spec-kit files generated successfully', {
    phaseId: phaseData.phaseId,
    outputDir: specDir,
    files: ['constitution.md', 'specification.md', 'README.md', '.speckit/metadata.json'],
  });
}

// Export types and functions
export * from './types.js';
export { parsePhaseDocument } from './parser.js';
export { generateSpecKitFiles } from './generator.js';
