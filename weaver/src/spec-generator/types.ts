/**
 * Spec-Kit Integration Types
 */

export interface PhaseData {
  phaseId: string;
  phaseName: string;
  status: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  objectives: string[];
  deliverables: string[];
  successCriteria: string[];
  dependencies: {
    requires: string[];
    enables: string[];
  };
  constraints: string[];
  tasks: PhaseTask[];
  context: string;
}

export interface PhaseTask {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  subtasks?: string[];
}

export interface SpecKitFiles {
  constitution: string;
  specification: string;
  plan?: string;
  tasks?: string;
}

export interface GeneratorOptions {
  phaseId: string;
  phasePath: string;
  outputDir: string;
  includeContext?: boolean;
  verbose?: boolean;
}
