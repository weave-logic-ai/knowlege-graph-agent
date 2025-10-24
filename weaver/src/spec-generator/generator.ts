/**
 * Spec-Kit File Generator
 *
 * Generates constitution.md and specification.md from phase data.
 */

import type { PhaseData, SpecKitFiles } from './types.js';

/**
 * Generate constitution.md
 *
 * Defines project principles, constraints, and success criteria.
 */
export function generateConstitution(phase: PhaseData): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${phase.phaseName} - Constitution`);
  sections.push('');
  sections.push(`**Phase ID**: ${phase.phaseId}`);
  sections.push(`**Status**: ${phase.status}`);
  if (phase.priority) {
    sections.push(`**Priority**: ${phase.priority}`);
  }
  if (phase.duration) {
    sections.push(`**Duration**: ${phase.duration}`);
  }
  sections.push('');
  sections.push('---');
  sections.push('');

  // Project Principles
  sections.push('## Project Principles');
  sections.push('');

  if (phase.objectives.length > 0) {
    phase.objectives.forEach((objective, index) => {
      const prefix = objective.split(':')[0];
      sections.push(`${index + 1}. **${prefix ? prefix : `Objective ${index + 1}`}**`);
      sections.push(`   ${objective}`);
      sections.push('');
    });
  } else {
    sections.push('_Principles to be defined during spec-kit workflow_');
    sections.push('');
  }

  // Technical Constraints
  sections.push('## Technical Constraints');
  sections.push('');

  if (phase.constraints.length > 0) {
    phase.constraints.forEach((constraint) => {
      sections.push(`- ${constraint}`);
    });
    sections.push('');
  } else {
    sections.push('- TypeScript strict mode');
    sections.push('- Bun package manager');
    sections.push('- Pass typecheck + lint before completion');
    sections.push('- No breaking changes to existing components');
    sections.push('');
  }

  // Dependencies
  if (phase.dependencies.requires.length > 0 || phase.dependencies.enables.length > 0) {
    sections.push('## Dependencies');
    sections.push('');

    if (phase.dependencies.requires.length > 0) {
      sections.push('**Requires**:');
      phase.dependencies.requires.forEach((dep) => {
        sections.push(`- ${dep}`);
      });
      sections.push('');
    }

    if (phase.dependencies.enables.length > 0) {
      sections.push('**Enables**:');
      phase.dependencies.enables.forEach((dep) => {
        sections.push(`- ${dep}`);
      });
      sections.push('');
    }
  }

  // Success Criteria
  sections.push('## Success Criteria');
  sections.push('');

  if (phase.successCriteria.length > 0) {
    phase.successCriteria.forEach((criterion) => {
      sections.push(`- [ ] ${criterion}`);
    });
    sections.push('');
  } else {
    sections.push('_Success criteria to be defined during spec-kit workflow_');
    sections.push('');
  }

  // Quality Standards
  sections.push('## Quality Standards');
  sections.push('');
  sections.push('All code must meet Weave-NN quality standards:');
  sections.push('');
  sections.push('```bash');
  sections.push('# Type checking');
  sections.push('bun run typecheck  # Must pass with 0 errors');
  sections.push('');
  sections.push('# Linting');
  sections.push('bun run lint      # Must pass with 0 errors');
  sections.push('');
  sections.push('# Build');
  sections.push('bun run build     # Must complete successfully');
  sections.push('```');
  sections.push('');

  sections.push('---');
  sections.push('');
  sections.push('**Generated**: ' + new Date().toISOString());
  sections.push(`**Source**: Phase planning document for ${phase.phaseId}`);

  return sections.join('\n');
}

/**
 * Generate specification.md
 *
 * Details requirements, deliverables, and scope.
 */
export function generateSpecification(phase: PhaseData): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${phase.phaseName} - Specification`);
  sections.push('');
  sections.push(`**Phase ID**: ${phase.phaseId}`);
  sections.push(`**Status**: ${phase.status}`);
  sections.push('');
  sections.push('---');
  sections.push('');

  // Overview
  sections.push('## Overview');
  sections.push('');
  if (phase.objectives.length > 0 && phase.objectives[0]) {
    sections.push(phase.objectives[0]);
  } else {
    sections.push(`Implementation phase for ${phase.phaseName}.`);
  }
  sections.push('');

  // Objectives
  if (phase.objectives.length > 0) {
    sections.push('## Objectives');
    sections.push('');
    phase.objectives.forEach((objective, index) => {
      const prefix = objective.split(':')[0];
      sections.push(`### ${index + 1}. ${prefix ? prefix : `Objective ${index + 1}`}`);
      sections.push(objective);
      sections.push('');
    });
  }

  // Requirements
  sections.push('## Requirements');
  sections.push('');

  if (phase.deliverables.length > 0) {
    phase.deliverables.forEach((deliverable, index) => {
      sections.push(`### ${index + 1}. ${deliverable.split(':')[0] || `Requirement ${index + 1}`}`);
      sections.push(deliverable);
      sections.push('');
    });
  } else {
    sections.push('_Requirements to be elaborated during /speckit.specify workflow_');
    sections.push('');
  }

  // Tasks (if available)
  if (phase.tasks.length > 0) {
    sections.push('## Initial Task Breakdown');
    sections.push('');
    sections.push('_Note: This is preliminary. Run /speckit.tasks for AI-powered task generation._');
    sections.push('');

    phase.tasks.forEach((task) => {
      sections.push(`- [ ] ${task.description}`);
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask) => {
          sections.push(`  - [ ] ${subtask}`);
        });
      }
    });
    sections.push('');
  }

  // Success Criteria
  sections.push('## Acceptance Criteria');
  sections.push('');

  if (phase.successCriteria.length > 0) {
    phase.successCriteria.forEach((criterion) => {
      sections.push(`- [ ] ${criterion}`);
    });
    sections.push('');
  }

  // Out of Scope
  sections.push('## Out of Scope');
  sections.push('');
  sections.push('_Items explicitly excluded from this phase:_');
  sections.push('');
  sections.push('- TBD during spec-kit refinement');
  sections.push('');

  // Next Steps
  sections.push('## Next Steps');
  sections.push('');
  sections.push('1. Review and refine with `/speckit.constitution`');
  sections.push('2. Elaborate requirements with `/speckit.specify`');
  sections.push('3. Generate implementation plan with `/speckit.plan`');
  sections.push('4. Break down tasks with `/speckit.tasks`');
  sections.push('5. Begin implementation with `/speckit.implement`');
  sections.push('');

  sections.push('---');
  sections.push('');
  sections.push('**Generated**: ' + new Date().toISOString());
  sections.push(`**Source**: Phase planning document for ${phase.phaseId}`);

  return sections.join('\n');
}

/**
 * Generate all spec-kit files
 */
export function generateSpecKitFiles(phase: PhaseData): SpecKitFiles {
  return {
    constitution: generateConstitution(phase),
    specification: generateSpecification(phase),
  };
}
