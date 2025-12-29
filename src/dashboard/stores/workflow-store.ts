import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Workflow status types
 */
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'completed' | 'failed';

/**
 * Workflow step
 */
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'parallel';
  config: Record<string, unknown>;
  nextSteps: string[];
}

/**
 * Workflow definition
 */
export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  triggers: {
    type: 'manual' | 'scheduled' | 'event';
    config: Record<string, unknown>;
  }[];
  createdAt: Date;
  updatedAt: Date;
  lastRunAt: Date | null;
  runCount: number;
}

/**
 * Workflow execution run
 */
export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStepId: string | null;
  startedAt: Date;
  completedAt: Date | null;
  results: Record<string, unknown>;
  errors: string[];
}

/**
 * Workflow store state
 */
interface WorkflowState {
  // Data
  workflows: Workflow[];
  runs: WorkflowRun[];
  selectedWorkflowId: string | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  filterStatus: WorkflowStatus | 'all';

  // Actions
  setWorkflows: (workflows: Workflow[]) => void;
  addWorkflow: (workflow: Workflow) => void;
  removeWorkflow: (workflowId: string) => void;
  updateWorkflow: (workflowId: string, updates: Partial<Workflow>) => void;
  selectWorkflow: (workflowId: string | null) => void;
  addRun: (run: WorkflowRun) => void;
  updateRun: (runId: string, updates: Partial<WorkflowRun>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setFilterStatus: (status: WorkflowStatus | 'all') => void;
  reset: () => void;
}

const initialState = {
  workflows: [],
  runs: [],
  selectedWorkflowId: null,
  isLoading: false,
  error: null,
  filterStatus: 'all' as const,
};

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set) => ({
      ...initialState,

      setWorkflows: (workflows) => set({ workflows }),

      addWorkflow: (workflow) =>
        set((state) => ({ workflows: [...state.workflows, workflow] })),

      removeWorkflow: (workflowId) =>
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== workflowId),
          selectedWorkflowId:
            state.selectedWorkflowId === workflowId
              ? null
              : state.selectedWorkflowId,
          runs: state.runs.filter((r) => r.workflowId !== workflowId),
        })),

      updateWorkflow: (workflowId, updates) =>
        set((state) => ({
          workflows: state.workflows.map((w) =>
            w.id === workflowId ? { ...w, ...updates, updatedAt: new Date() } : w
          ),
        })),

      selectWorkflow: (workflowId) => set({ selectedWorkflowId: workflowId }),

      addRun: (run) =>
        set((state) => ({
          runs: [...state.runs, run].slice(-100), // Keep last 100 runs
        })),

      updateRun: (runId, updates) =>
        set((state) => ({
          runs: state.runs.map((r) =>
            r.id === runId ? { ...r, ...updates } : r
          ),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setFilterStatus: (filterStatus) => set({ filterStatus }),

      reset: () => set(initialState),
    }),
    { name: 'WorkflowStore' }
  )
);
