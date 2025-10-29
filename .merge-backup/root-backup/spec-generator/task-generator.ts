/**
 * Task Generator for Spec-Kit
 *
 * Generates tasks.md with correct format:
 * - ### X.Y Task Name (not ### Task X.Y)
 * - Single-line metadata with pipes
 * - No **Status**: field
 */

import type { PhaseData } from './types.js';

interface TaskMetadata {
  effort?: string;
  priority?: string;
  dependencies?: string;
}

export interface TaskGroup {
  title: string;
  description?: string;
  tasks: GeneratedTask[];
}

export interface GeneratedTask {
  number: string;
  title: string;
  description: string;
  metadata: TaskMetadata;
  acceptanceCriteria: string[];
  implementationNotes: string[];
}

/**
 * Generate tasks.md from phase data
 *
 * Outputs the correct format:
 * ### 1.1 Task Name
 * **Effort**: 4 hours | **Priority**: High | **Dependencies**: None
 */
export function generateTasksDocument(phase: PhaseData): string {
  const sections: string[] = [];

  // Calculate total tasks from existing task structure
  const totalTasks = phase.tasks.length;

  // YAML Frontmatter
  sections.push('---');
  sections.push(`spec_type: "tasks"`);
  sections.push(`phase_id: "${phase.phaseId}"`);
  sections.push(`phase_name: "${phase.phaseName}"`);
  sections.push(`status: "${phase.status}"`);
  if (phase.priority) {
    sections.push(`priority: "${phase.priority}"`);
  }
  if (phase.duration) {
    sections.push(`duration: "${phase.duration}"`);
  }
  sections.push(`generated_date: "${new Date().toISOString().split('T')[0]}"`);
  sections.push(`total_tasks: ${totalTasks}`);
  if (phase.duration) {
    sections.push(`estimated_effort: "${phase.duration}"`);
  }
  sections.push('tags:');
  sections.push('  - spec-kit');
  sections.push('  - tasks');
  sections.push(`  - ${phase.phaseId.toLowerCase()}`);
  sections.push('  - implementation');
  sections.push('links:');
  sections.push('  constitution: "[[constitution.md]]"');
  sections.push('  specification: "[[specification.md]]"');
  sections.push('  phase_document: "[[phase planning document]]"');
  sections.push('---');
  sections.push('');

  // Header
  sections.push(`# ${phase.phaseName} - Task Breakdown`);
  sections.push('');
  sections.push(`**Phase ID**: ${phase.phaseId}`);
  // Do NOT add **Status**: field here (it's in YAML frontmatter)
  if (phase.priority) {
    sections.push(`**Priority**: ${phase.priority}`);
  }
  sections.push(`**Total Tasks**: ${totalTasks}`);
  if (phase.duration) {
    sections.push(`**Estimated Effort**: ${phase.duration}`);
  }
  sections.push('');
  sections.push('---');
  sections.push('');

  // Overview
  sections.push('## Overview');
  sections.push('');
  sections.push(`Comprehensive task breakdown for implementing the ${phase.phaseName}. Tasks are organized hierarchically with clear dependencies, effort estimates, and acceptance criteria.`);
  sections.push('');
  sections.push('---');
  sections.push('');

  // Process tasks - use them as-is from the parsed phase data
  // Each PhaseTask becomes a section
  phase.tasks.forEach((task, index) => {
    const taskNumber = `${index + 1}.0`;

    sections.push(`## ${index + 1}. ${task.description}`);
    sections.push('');

    // Task header in correct format: ### X.Y Task Name
    sections.push(`### ${taskNumber} ${task.description}`);

    // Metadata line with pipes (no Status field)
    const metaParts: string[] = [];
    metaParts.push(`**Effort**: 4 hours`); // Default
    metaParts.push(`**Priority**: Medium`); // Default
    metaParts.push(`**Dependencies**: None`); // Default

    sections.push(metaParts.join(' | '));
    sections.push('');

    // Subtasks become acceptance criteria
    if (task.subtasks && task.subtasks.length > 0) {
      sections.push('**Acceptance Criteria**:');
      task.subtasks.forEach((subtask) => {
        sections.push(`- [ ] ${subtask}`);
      });
      sections.push('');
    }

    sections.push('---');
    sections.push('');
  });

  // Footer
  sections.push('**Generated**: ' + new Date().toISOString());
  sections.push(`**Source**: Phase planning document for ${phase.phaseId}`);

  return sections.join('\n');
}

/**
 * Parse task from phase document format
 *
 * Expected input:
 * - [ ] **1.1 Task Name**
 *   **Effort**: 4 hours | **Priority**: High | **Dependencies**: None
 *   Description text
 *   **Acceptance Criteria**:
 *   - Criterion 1
 */
export function parseTaskFromPhaseDoc(taskText: string): GeneratedTask | null {
  const lines = taskText.split('\n').map(l => l.trim());

  // Extract task number and title from first line
  const headerMatch = lines[0]?.match(/^-\s*\[\s*\]\s*\*\*(\d+\.\d+)\s+(.+?)\*\*$/);
  if (!headerMatch) {
    return null;
  }

  const [, number, title] = headerMatch;
  const task: GeneratedTask = {
    number: number || '',
    title: title || '',
    description: '',
    metadata: {
      dependencies: 'None',
    },
    acceptanceCriteria: [],
    implementationNotes: [],
  };

  let currentSection: 'description' | 'acceptance' | 'implementation' | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Parse metadata line
    if (line.includes('**Effort**:') || line.includes('**Priority**:') || line.includes('**Dependencies**:')) {
      const effortMatch = line.match(/\*\*Effort\*\*:\s*([^|]+)/);
      const priorityMatch = line.match(/\*\*Priority\*\*:\s*([^|]+)/);
      const depsMatch = line.match(/\*\*Dependencies\*\*:\s*(.+)/);

      if (effortMatch && effortMatch[1]) task.metadata.effort = effortMatch[1].trim();
      if (priorityMatch && priorityMatch[1]) task.metadata.priority = priorityMatch[1].trim();
      if (depsMatch && depsMatch[1]) task.metadata.dependencies = depsMatch[1].trim();
      continue;
    }

    // Section headers
    if (line.startsWith('**Acceptance Criteria**:')) {
      currentSection = 'acceptance';
      continue;
    }
    if (line.startsWith('**Implementation Notes**:')) {
      currentSection = 'implementation';
      continue;
    }

    // Content
    if (currentSection === 'acceptance' && line.startsWith('-')) {
      task.acceptanceCriteria.push(line.replace(/^-\s*\[\s*\]\s*/, '').trim());
    } else if (currentSection === 'implementation' && line.startsWith('-')) {
      task.implementationNotes.push(line.replace(/^-\s*/, '').trim());
    } else if (!currentSection && line && !line.startsWith('**')) {
      task.description += (task.description ? ' ' : '') + line;
    }
  }

  return task;
}
