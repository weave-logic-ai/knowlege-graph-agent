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
 */
function extractTasks(content: string): PhaseTask[] {
  const tasks: PhaseTask[] = [];

  // Find the Implementation Tasks or Tasks section
  const tasksMatch = content.match(/##\s*.*(?:Implementation\s+)?Tasks.*\n([\s\S]*?)(?=\n##\s*✅|$)/i);

  if (tasksMatch && tasksMatch[1]) {
    const section = tasksMatch[1];

    // Extract Day/Phase subsections (e.g., "### Day 1: Project Setup")
    const dayMatches = section.match(/###\s+Day\s+\d+:.*?\n([\s\S]*?)(?=###\s+Day|\n###\s*$|$)/gi);

    if (dayMatches && dayMatches.length > 0) {
      // Process day-based structure
      dayMatches.forEach((daySection, dayIndex) => {
        const dayTitleMatch = daySection.match(/###\s+(Day\s+\d+:.*?)[\n\r]/);
        const dayTitle = dayTitleMatch ? dayTitleMatch[1] : `Day ${dayIndex + 1}`;

        // Extract subsections within the day (Morning/Afternoon or direct tasks)
        const subSections = daySection.match(/####\s+(.*?)[\n\r]([\s\S]*?)(?=####|$)/g);

        if (subSections) {
          subSections.forEach((subSection) => {
            const subTitleMatch = subSection.match(/####\s+(.*?)[\n\r]/);
            const subTitle = subTitleMatch ? subTitleMatch[1] : '';

            // Extract task description from first paragraph or bullet point
            const taskDescMatch = subSection.match(/####.*?[\n\r]+(.*?)(?:\n\n|\n```|$)/s);
            const taskDesc = (taskDescMatch && taskDescMatch[1]) ? taskDescMatch[1].trim() : subTitle;

            if (taskDesc && taskDesc.length > 5) {
              const firstLine = taskDesc.split('\n')[0];
              if (firstLine) {
                tasks.push({
                  id: `task-day${dayIndex + 1}-${tasks.length}`,
                  description: `${dayTitle} - ${subTitle}: ${firstLine.substring(0, 100)}`,
                  status: 'pending',
                  subtasks: [],
                });
              }
            }
          });
        } else {
          // No subsections, extract from day section directly
          const descMatch = daySection.match(/###.*?[\n\r]+([\s\S]*?)(?:\n###|$)/);
          if (descMatch && descMatch[1]) {
            const firstLine = descMatch[1].trim().split('\n')[0];
            if (firstLine && firstLine.length > 5) {
              tasks.push({
                id: `task-day${dayIndex + 1}`,
                description: `${dayTitle}: ${firstLine.substring(0, 100)}`,
                status: 'pending',
                subtasks: [],
              });
            }
          }
        }
      });
    }

    // Also look for standard checkbox tasks
    const lines = section.split('\n');
    let currentTask: PhaseTask | null = null;

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Main task
      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
        if (currentTask) {
          tasks.push(currentTask);
        }

        const isCompleted = trimmed.startsWith('- [x]');
        const description = trimmed.replace(/^-\s*\[[x\s]\]\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();

        if (description && description.length > 5) {
          currentTask = {
            id: `task-checkbox-${index}`,
            description,
            status: isCompleted ? 'completed' : 'pending',
            subtasks: [],
          };
        }
      }
      // Subtask
      else if (currentTask && trimmed.startsWith('  - [ ]')) {
        const subtask = trimmed.replace(/^\s*-\s*\[[x\s]\]\s*/, '').trim();
        if (subtask) {
          currentTask.subtasks?.push(subtask);
        }
      }
    });

    if (currentTask) {
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
