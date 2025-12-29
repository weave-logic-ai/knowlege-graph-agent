import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Agent status types
 */
export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed';

/**
 * Agent type
 */
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: AgentStatus;
  description: string;
  capabilities: string[];
  currentTask: string | null;
  progress: number;
  metrics: {
    tasksCompleted: number;
    successRate: number;
    averageTime: number;
  };
  createdAt: Date;
  lastActiveAt: Date;
}

/**
 * Agent log entry
 */
export interface AgentLog {
  id: string;
  agentId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Agent store state
 */
interface AgentState {
  // Data
  agents: Agent[];
  logs: AgentLog[];
  selectedAgentId: string | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  filterStatus: AgentStatus | 'all';

  // Actions
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (agentId: string) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  selectAgent: (agentId: string | null) => void;
  addLog: (log: AgentLog) => void;
  clearLogs: (agentId?: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setFilterStatus: (status: AgentStatus | 'all') => void;
  reset: () => void;
}

const initialState = {
  agents: [],
  logs: [],
  selectedAgentId: null,
  isLoading: false,
  error: null,
  filterStatus: 'all' as const,
};

export const useAgentStore = create<AgentState>()(
  devtools(
    (set) => ({
      ...initialState,

      setAgents: (agents) => set({ agents }),

      addAgent: (agent) =>
        set((state) => ({ agents: [...state.agents, agent] })),

      removeAgent: (agentId) =>
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== agentId),
          selectedAgentId:
            state.selectedAgentId === agentId ? null : state.selectedAgentId,
          logs: state.logs.filter((l) => l.agentId !== agentId),
        })),

      updateAgent: (agentId, updates) =>
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, ...updates } : a
          ),
        })),

      selectAgent: (agentId) => set({ selectedAgentId: agentId }),

      addLog: (log) =>
        set((state) => ({
          logs: [...state.logs, log].slice(-1000), // Keep last 1000 logs
        })),

      clearLogs: (agentId) =>
        set((state) => ({
          logs: agentId
            ? state.logs.filter((l) => l.agentId !== agentId)
            : [],
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setFilterStatus: (filterStatus) => set({ filterStatus }),

      reset: () => set(initialState),
    }),
    { name: 'AgentStore' }
  )
);
