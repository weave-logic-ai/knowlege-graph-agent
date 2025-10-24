/**
 * Phase Document Parser
 *
 * Extracts structured data from phase planning documents.
 */

import { readFileSync } from 'fs';
import type { PhaseData, PhaseTask } from './types.js';

/**
 * Parse phase frontmatter (YAML)
 */
function parseFrontmatter(content: string): Record<string, unknown> {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch || !frontmatterMatch[1]) {
    return {};
  }

  const yamlContent = frontmatterMatch[1];
  const result: Record<string, unknown> = {};

  yamlContent.split('\n').forEach((line) => {
    // Handle key: value
    const simpleMatch = line.match(/^(\w+):\s*"?([^"]+)"?$/);
    if (simpleMatch) {
      const [, key, value] = simpleMatch;
      if (key && value) {
        result[key] = value.replace(/^"|"$/g, '');
      }
      return;
    }

    // Handle arrays (requires: ["PHASE-4A"])
    const arrayMatch = line.match(/^(\w+):\s*\[(.+)\]$/);
    if (arrayMatch) {
      const [, key, values] = arrayMatch;
      if (key && values) {
        result[key] = values.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      }
    }
  });

  return result;
}

/**
 * Extract objectives from markdown content
 */
function extractObjectives(content: string): string[] {
  const objectives: string[] = [];
  const objectivesMatch = content.match(/##\s*.*Objectives.*\n([\s\S]*?)(?=\n##|\n---|\n$)/i);

  if (objectivesMatch && objectivesMatch[1]) {
    const section = objectivesMatch[1];
    const lines = section.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
        const objective = trimmed.replace(/^[-*\d.)\s]+/, '').trim();
        if (objective && !objective.startsWith('**') && objective.length > 10) {
          objectives.push(objective);
        }
      }
    });
  }

  return objectives;
}

/**
 * Extract success criteria
 */
function extractSuccessCriteria(content: string): string[] {
  const criteria: string[] = [];
  const criteriaMatch = content.match(/##\s*.*Success\s+Criteria.*\n([\s\S]*?)(?=\n##|\n---|\n$)/i);

  if (criteriaMatch && criteriaMatch[1]) {
    const section = criteriaMatch[1];
    const lines = section.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
        const criterion = trimmed.replace(/^-\s*\[[x\s]\]\s*/, '').trim();
        if (criterion && criterion.length > 5) {
          criteria.push(criterion);
        }
      }
    });
  }

  return criteria;
}

/**
 * Extract deliverables
 */
function extractDeliverables(content: string): string[] {
  const deliverables: string[] = [];
  const deliverablesMatch = content.match(/##\s*.*Deliverables.*\n([\s\S]*?)(?=\n##|\n---|\n$)/i);

  if (deliverablesMatch && deliverablesMatch[1]) {
    const section = deliverablesMatch[1];
    const lines = section.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
        const deliverable = trimmed.replace(/^[-*\d.)\s]+/, '').trim();
        if (deliverable && deliverable.length > 5) {
          deliverables.push(deliverable);
        }
      }
    });
  }

  return deliverables;
}

/**
 * Extract tasks from various formats
 * Converts Day/Week hierarchies to flat task/subtask numbering
 */
function extractTasks(content: string): PhaseTask[] {
  const tasks: PhaseTask[] = [];

  // Find the Implementation Tasks or Tasks section
  const tasksMatch = content.match(/##\s*.*(?:Implementation\s+)?Tasks.*\n([\s\S]*?)(?=\n##\s*✅|$)/i);

  if (tasksMatch && tasksMatch[1]) {
    const section = tasksMatch[1];
    let taskCounter = 1;

    // Extract Week/Day subsections (### Week 1, ### Day 1, etc.)
    const periodMatches = section.match(/###\s+(?:Week|Day)\s+\d+.*?\n([\s\S]*?)(?=###\s+(?:Week|Day)|\n###\s*$|$)/gi);

    if (periodMatches && periodMatches.length > 0) {
      // Process week/day-based structure - extract as flat tasks
      periodMatches.forEach((periodSection) => {
        const periodTitleMatch = periodSection.match(/###\s+((?:Week|Day)\s+\d+:.*?)[\n\r]/);
        const periodTitle = periodTitleMatch ? periodTitleMatch[1].trim() : '';

        // Extract subsections (#### Morning, #### Day 1-2, etc.)
        const subSections = periodSection.match(/####\s+(.*?)[\n\r]([\s\S]*?)(?=####|$)/g);

        if (subSections) {
          subSections.forEach((subSection) => {
            const subTitleMatch = subSection.match(/####\s+(.*?)[\n\r]/);
            const subTitle = subTitleMatch ? subTitleMatch[1].trim() : '';

            // Extract checkbox tasks from this subsection
            const checkboxMatches = subSection.match(/^- \[([ x])\] (.+)$/gm);

            if (checkboxMatches && checkboxMatches.length > 0) {
              // Use subsection as main task, checkboxes as subtasks
              const mainTask: PhaseTask = {
                id: `task-${taskCounter}`,
                description: subTitle || periodTitle,
                status: 'pending',
                subtasks: [],
              };

              checkboxMatches.forEach((checkbox) => {
                const match = checkbox.match(/^- \[([ x])\] (.+)$/);
                if (match && match[2]) {
                  mainTask.subtasks?.push(match[2].trim());
                }
              });

              if (mainTask.subtasks && mainTask.subtasks.length > 0) {
                tasks.push(mainTask);
                taskCounter++;
              }
            } else {
              // No checkboxes, use subsection as standalone task
              if (subTitle && subTitle.length > 5) {
                tasks.push({
                  id: `task-${taskCounter}`,
                  description: subTitle,
                  status: 'pending',
                  subtasks: [],
                });
                taskCounter++;
              }
            }
          });
        }
      });
    }

    // Also extract any standalone checkbox tasks (not under Week/Day sections)
    const lines = section.split('\n');
    let currentTask: PhaseTask | null = null;

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Main task (no indentation)
      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
        if (currentTask && !tasks.find(t => t.description === currentTask?.description)) {
          tasks.push(currentTask);
        }

        const isCompleted = trimmed.startsWith('- [x]');
        const description = trimmed.replace(/^-\s*\[[x\s]\]\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();

        if (description && description.length > 5) {
          currentTask = {
            id: `task-${taskCounter}`,
            description,
            status: isCompleted ? 'completed' : 'pending',
            subtasks: [],
          };
          taskCounter++;
        }
      }
      // Subtask (indented)
      else if (currentTask && (trimmed.startsWith('  - [ ]') || trimmed.startsWith('  - [x]'))) {
        const subtask = trimmed.replace(/^\s*-\s*\[[x\s]\]\s*/, '').trim();
        if (subtask) {
          currentTask.subtasks?.push(subtask);
        }
      }
    });

    if (currentTask && !tasks.find(t => t.description === currentTask?.description)) {
      tasks.push(currentTask);
    }
  }

  return tasks;
}

/**
 * Parse phase planning document
 */
export function parsePhaseDocument(filePath: string): PhaseData {
  const content = readFileSync(filePath, 'utf-8');
  const frontmatter = parseFrontmatter(content);

  // Extract phase metadata
  const phaseId = (frontmatter['phase_id'] as string) || 'UNKNOWN';
  const phaseName = (frontmatter['phase_name'] as string) || 'Unknown Phase';
  const status = (frontmatter['status'] as string) || 'planned';
  const priority = frontmatter['priority'] as string | undefined;
  const startDate = frontmatter['start_date'] as string | undefined;
  const endDate = frontmatter['end_date'] as string | undefined;
  const duration = frontmatter['duration'] as string | undefined;

  // Extract dependencies
  const dependencies = {
    requires: Array.isArray(frontmatter['requires']) ? frontmatter['requires'] as string[] : [],
    enables: Array.isArray(frontmatter['enables']) ? frontmatter['enables'] as string[] : [],
  };

  // Extract content sections
  const objectives = extractObjectives(content);
  const successCriteria = extractSuccessCriteria(content);
  const deliverables = extractDeliverables(content);
  const tasks = extractTasks(content);

  // Extract constraints from content
  const constraints: string[] = [];
  const constraintsMatch = content.match(/##\s*.*Constraints.*\n([\s\S]*?)(?=\n##|\n---|\n$)/i);
  if (constraintsMatch && constraintsMatch[1]) {
    const section = constraintsMatch[1];
    section.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const constraint = trimmed.replace(/^[-*\s]+/, '').trim();
        if (constraint && constraint.length > 5) {
          constraints.push(constraint);
        }
      }
    });
  }

  return {
    phaseId,
    phaseName,
    status,
    priority,
    startDate,
    endDate,
    duration,
    objectives,
    deliverables,
    successCriteria,
    dependencies,
    constraints,
    tasks,
    context: content, // Full context for reference
  };
}
