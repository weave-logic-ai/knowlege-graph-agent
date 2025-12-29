/**
 * Dashboard Type Definitions
 *
 * Shared types for the Knowledge Graph Agent Dashboard.
 */

import type { LucideIcon } from 'lucide-react';
import type { NodeType, NodeStatus } from '../../core/types';

// Re-export core types
export type { NodeType, NodeStatus };

// ============================================================================
// Navigation Types
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  disabled?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  defaultOpen?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  current?: boolean;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

// ============================================================================
// Health & Status Types
// ============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type ServiceStatus = 'up' | 'down' | 'degraded';

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  latency?: number;
  message?: string;
  lastCheck: Date;
  details?: Record<string, unknown>;
}

export interface SystemHealth {
  status: HealthStatus;
  uptime: number;
  services: ServiceHealth[];
  lastCheck: Date;
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'viewer';
}

// ============================================================================
// Layout Types
// ============================================================================

export interface LayoutState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  theme: 'light' | 'dark' | 'system';
}

// ============================================================================
// Component Variant Types
// ============================================================================

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
export type CardVariant = 'default' | 'bordered' | 'elevated';

// ============================================================================
// Table Types
// ============================================================================

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface SortingState {
  id: string;
  desc: boolean;
}

export interface ColumnFiltersState {
  id: string;
  value: unknown;
}

export interface RowSelectionState {
  [key: string]: boolean;
}

export type FilterType = 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number';

export interface FilterOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

export interface ColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => unknown;
  cell?: (props: CellContext<T>) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: FilterType;
  filterOptions?: FilterOption[];
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
  pinned?: 'left' | 'right';
}

export interface CellContext<T> {
  row: T;
  value: unknown;
  column: ColumnDef<T>;
  rowIndex: number;
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchFilters {
  types?: NodeType[];
  statuses?: NodeStatus[];
  tags?: string[];
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
  customFields?: Record<string, unknown>;
}

export interface SearchSuggestion {
  id: string;
  type: 'node' | 'tag' | 'type' | 'recent' | 'command';
  label: string;
  description?: string;
  icon?: LucideIcon;
  href?: string;
  action?: () => void;
}

export interface SearchResult {
  id: string;
  type: 'node' | 'workflow' | 'agent' | 'event';
  nodeType?: NodeType;
  title: string;
  description?: string;
  path?: string;
  score: number;
  highlights?: SearchHighlight[];
  metadata?: Record<string, unknown>;
  updatedAt?: Date;
}

export interface SearchHighlight {
  field: string;
  fragments: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
  took: number;
  mode: 'fulltext' | 'semantic' | 'hybrid';
  facets?: SearchFacets;
  hasMore: boolean;
  nextCursor?: string;
}

export interface SearchFacets {
  types: Record<string, number>;
  statuses: Record<string, number>;
  tags: Record<string, number>;
}

// ============================================================================
// Node Table Types
// ============================================================================

export interface NodeTableRow {
  id: string;
  title: string;
  type: NodeType;
  status: NodeStatus;
  tags: string[];
  path: string;
  wordCount: number;
  incomingLinks: number;
  outgoingLinks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeFilters {
  types?: NodeType[];
  statuses?: NodeStatus[];
  tags?: string[];
  search?: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: LucideIcon;
  variant?: ButtonVariant;
  disabled?: boolean;
  onAction: (selectedIds: string[]) => void | Promise<void>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextCursor?: string;
  previousCursor?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Graph Types - Re-export
// ============================================================================

export * from './graph';
