/**
 * NodesTable Component
 *
 * Specialized data table for knowledge graph nodes with type/status badges,
 * tag filters, and quick actions.
 */

'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Code,
  Star,
  Box,
  Server,
  BookOpen,
  Shield,
  Plug,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ExternalLink,
  Tag,
  Link,
  Calendar,
  Hash,
} from 'lucide-react';
import { DataTable, type DataTableColumn } from './DataTable';
import { cn } from '../../lib/utils';
import type { NodeType, NodeStatus, NodeTableRow, NodeFilters, BulkAction } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface NodesTableProps {
  onNodeSelect?: (node: NodeTableRow) => void;
  onNodeEdit?: (node: NodeTableRow) => void;
  onNodeDelete?: (nodeIds: string[]) => Promise<void>;
  onNodeView?: (node: NodeTableRow) => void;
  initialFilters?: NodeFilters;
  className?: string;
}

interface NodesApiResponse {
  data: NodeTableRow[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  hasNextPage: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const NODE_TYPE_CONFIG: Record<NodeType, { icon: React.ElementType; color: string; label: string }> = {
  concept: { icon: FileText, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', label: 'Concept' },
  technical: { icon: Code, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: 'Technical' },
  feature: { icon: Star, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'Feature' },
  primitive: { icon: Box, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', label: 'Primitive' },
  service: { icon: Server, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'Service' },
  guide: { icon: BookOpen, color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300', label: 'Guide' },
  standard: { icon: Shield, color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300', label: 'Standard' },
  integration: { icon: Plug, color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300', label: 'Integration' },
};

const NODE_STATUS_CONFIG: Record<NodeStatus, { color: string; label: string }> = {
  active: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'Active' },
  draft: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Draft' },
  deprecated: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', label: 'Deprecated' },
  archived: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', label: 'Archived' },
};

// ============================================================================
// Utility Components
// ============================================================================

function TypeBadge({ type }: { type: NodeType }) {
  const config = NODE_TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium', config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: NodeStatus }) {
  const config = NODE_STATUS_CONFIG[status];

  return (
    <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', config.color)}>
      {config.label}
    </span>
  );
}

function TagsList({ tags, max = 3 }: { tags: string[]; max?: number }) {
  const visibleTags = tags.slice(0, max);
  const hiddenCount = tags.length - max;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        >
          <Tag className="h-2.5 w-2.5" />
          {tag}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}

function ConnectionsDisplay({ incoming, outgoing }: { incoming: number; outgoing: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <span className="flex items-center gap-1" title="Incoming links">
        <Link className="h-3 w-3 rotate-180" />
        {incoming}
      </span>
      <span className="text-gray-300 dark:text-gray-600">/</span>
      <span className="flex items-center gap-1" title="Outgoing links">
        <Link className="h-3 w-3" />
        {outgoing}
      </span>
    </div>
  );
}

function RelativeTime({ date }: { date: Date }) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let timeString: string;
  if (days > 30) {
    timeString = new Date(date).toLocaleDateString();
  } else if (days > 0) {
    timeString = `${days}d ago`;
  } else if (hours > 0) {
    timeString = `${hours}h ago`;
  } else if (minutes > 0) {
    timeString = `${minutes}m ago`;
  } else {
    timeString = 'Just now';
  }

  return (
    <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400" title={new Date(date).toLocaleString()}>
      <Calendar className="h-3 w-3" />
      {timeString}
    </span>
  );
}

function RowActions({
  node,
  onView,
  onEdit,
  onDelete,
}: {
  node: NodeTableRow;
  onView?: (node: NodeTableRow) => void;
  onEdit?: (node: NodeTableRow) => void;
  onDelete?: (node: NodeTableRow) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={cn(
          'p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700',
          'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 mt-1 w-36 rounded-md shadow-lg z-50',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="py-1">
            {onView && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onView(node);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onEdit(node);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                window.open(node.path, '_blank');
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4" />
              Open File
            </button>
            {onDelete && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onDelete(node);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Filters Component
// ============================================================================

function NodesFilters({
  filters,
  onFiltersChange,
  allTags,
}: {
  filters: NodeFilters;
  onFiltersChange: (filters: NodeFilters) => void;
  allTags: string[];
}) {
  const nodeTypes = Object.keys(NODE_TYPE_CONFIG) as NodeType[];
  const nodeStatuses = Object.keys(NODE_STATUS_CONFIG) as NodeStatus[];

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Type filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
        <select
          value={filters.types?.[0] || ''}
          onChange={(e) => {
            const value = e.target.value as NodeType | '';
            onFiltersChange({
              ...filters,
              types: value ? [value] : undefined,
            });
          }}
          className={cn(
            'rounded-md border border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800 text-sm py-1.5 px-3',
            'focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
        >
          <option value="">All Types</option>
          {nodeTypes.map((type) => (
            <option key={type} value={type}>
              {NODE_TYPE_CONFIG[type].label}
            </option>
          ))}
        </select>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
        <select
          value={filters.statuses?.[0] || ''}
          onChange={(e) => {
            const value = e.target.value as NodeStatus | '';
            onFiltersChange({
              ...filters,
              statuses: value ? [value] : undefined,
            });
          }}
          className={cn(
            'rounded-md border border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800 text-sm py-1.5 px-3',
            'focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
        >
          <option value="">All Statuses</option>
          {nodeStatuses.map((status) => (
            <option key={status} value={status}>
              {NODE_STATUS_CONFIG[status].label}
            </option>
          ))}
        </select>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tag:</span>
          <select
            value={filters.tags?.[0] || ''}
            onChange={(e) => {
              const value = e.target.value;
              onFiltersChange({
                ...filters,
                tags: value ? [value] : undefined,
              });
            }}
            className={cn(
              'rounded-md border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-sm py-1.5 px-3',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Clear filters */}
      {(filters.types || filters.statuses || filters.tags || filters.search) && (
        <button
          type="button"
          onClick={() => onFiltersChange({})}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Mock API Function (replace with actual API call)
// ============================================================================

async function fetchNodes(
  filters: NodeFilters,
  pagination: { pageIndex: number; pageSize: number },
  sorting: { id: string; desc: boolean }[]
): Promise<NodesApiResponse> {
  // This is a mock implementation - replace with actual API call
  // Example: return fetch(`/api/graph/nodes?${params}`).then(r => r.json());

  const mockNodes: NodeTableRow[] = Array.from({ length: 50 }, (_, i) => ({
    id: `node-${i + 1}`,
    title: `Node ${i + 1}`,
    type: Object.keys(NODE_TYPE_CONFIG)[i % 8] as NodeType,
    status: Object.keys(NODE_STATUS_CONFIG)[i % 4] as NodeStatus,
    tags: ['tag1', 'tag2', 'example'].slice(0, (i % 3) + 1),
    path: `/docs/node-${i + 1}.md`,
    wordCount: Math.floor(Math.random() * 2000) + 100,
    incomingLinks: Math.floor(Math.random() * 10),
    outgoingLinks: Math.floor(Math.random() * 10),
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  }));

  // Apply filters
  let filteredNodes = [...mockNodes];

  if (filters.types?.length) {
    filteredNodes = filteredNodes.filter((n) => filters.types!.includes(n.type));
  }
  if (filters.statuses?.length) {
    filteredNodes = filteredNodes.filter((n) => filters.statuses!.includes(n.status));
  }
  if (filters.tags?.length) {
    filteredNodes = filteredNodes.filter((n) => filters.tags!.some((t) => n.tags.includes(t)));
  }
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filteredNodes = filteredNodes.filter((n) => n.title.toLowerCase().includes(search));
  }

  // Apply sorting
  if (sorting.length > 0) {
    const sort = sorting[0];
    filteredNodes.sort((a, b) => {
      const aVal = a[sort.id as keyof NodeTableRow];
      const bVal = b[sort.id as keyof NodeTableRow];
      if (aVal < bVal) return sort.desc ? 1 : -1;
      if (aVal > bVal) return sort.desc ? -1 : 1;
      return 0;
    });
  }

  // Apply pagination
  const start = pagination.pageIndex * pagination.pageSize;
  const paginatedNodes = filteredNodes.slice(start, start + pagination.pageSize);

  return {
    data: paginatedNodes,
    totalCount: filteredNodes.length,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    hasNextPage: start + pagination.pageSize < filteredNodes.length,
  };
}

// ============================================================================
// Main Component
// ============================================================================

export function NodesTable({
  onNodeSelect,
  onNodeEdit,
  onNodeDelete,
  onNodeView,
  initialFilters = {},
  className,
}: NodesTableProps) {
  const queryClient = useQueryClient();

  // State
  const [filters, setFilters] = React.useState<NodeFilters>(initialFilters);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = React.useState<{ id: string; desc: boolean }[]>([
    { id: 'updatedAt', desc: true },
  ]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  // Data fetching
  const { data, isLoading, isFetching } = useQuery<NodesApiResponse>({
    queryKey: ['nodes', 'table', filters, pagination, sorting],
    queryFn: () => fetchNodes(filters, pagination, sorting),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (nodeIds: string[]) => {
      if (onNodeDelete) {
        await onNodeDelete(nodeIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
      setRowSelection({});
    },
  });

  // Available tags (could be fetched from API)
  const allTags = React.useMemo((): string[] => {
    if (!data?.data) return [];
    const tags = new Set<string>();
    data.data.forEach((node: NodeTableRow) => node.tags.forEach((tag: string) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [data?.data]);

  // Column definitions
  const columns: DataTableColumn<NodeTableRow>[] = React.useMemo(
    () => [
      {
        id: 'title',
        header: 'Title',
        accessorKey: 'title',
        sortable: true,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-gray-100">{row.title}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{row.path}</span>
          </div>
        ),
      },
      {
        id: 'type',
        header: 'Type',
        accessorKey: 'type',
        sortable: true,
        width: 130,
        cell: ({ row }) => <TypeBadge type={row.type} />,
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        sortable: true,
        width: 110,
        cell: ({ row }) => <StatusBadge status={row.status} />,
      },
      {
        id: 'tags',
        header: 'Tags',
        accessorFn: (row) => row.tags.join(', '),
        width: 200,
        cell: ({ row }) => <TagsList tags={row.tags} />,
      },
      {
        id: 'connections',
        header: 'Links',
        accessorFn: (row) => row.incomingLinks + row.outgoingLinks,
        sortable: true,
        width: 100,
        cell: ({ row }) => (
          <ConnectionsDisplay incoming={row.incomingLinks} outgoing={row.outgoingLinks} />
        ),
      },
      {
        id: 'wordCount',
        header: 'Words',
        accessorKey: 'wordCount',
        sortable: true,
        width: 90,
        align: 'right',
        cell: ({ row }) => (
          <span className="flex items-center gap-1 justify-end text-sm text-gray-600 dark:text-gray-400">
            <Hash className="h-3 w-3" />
            {row.wordCount.toLocaleString()}
          </span>
        ),
      },
      {
        id: 'updatedAt',
        header: 'Updated',
        accessorKey: 'updatedAt',
        sortable: true,
        width: 120,
        cell: ({ row }) => <RelativeTime date={row.updatedAt} />,
      },
      {
        id: 'actions',
        header: '',
        width: 50,
        cell: ({ row }) => (
          <RowActions
            node={row}
            onView={onNodeView}
            onEdit={onNodeEdit}
            onDelete={onNodeDelete ? () => deleteMutation.mutate([row.id]) : undefined}
          />
        ),
      },
    ],
    [onNodeView, onNodeEdit, onNodeDelete, deleteMutation]
  );

  // Bulk actions
  const bulkActions = React.useCallback(
    (selectedRows: NodeTableRow[]) => {
      if (!onNodeDelete) return null;

      return (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => deleteMutation.mutate(selectedRows.map((r) => r.id))}
            disabled={deleteMutation.isPending}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md',
              'bg-red-600 text-white hover:bg-red-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Trash2 className="h-4 w-4" />
            Delete ({selectedRows.length})
          </button>
        </div>
      );
    },
    [onNodeDelete, deleteMutation]
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        totalCount={data?.totalCount ?? 0}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onRowClick={onNodeSelect}
        getRowId={(row) => row.id}
        globalFilter={filters.search ?? ''}
        onGlobalFilterChange={(search) => setFilters((f) => ({ ...f, search }))}
        showGlobalFilter
        showColumnToggle
        loading={isLoading || isFetching}
        striped
        stickyHeader
        toolbar={
          <NodesFilters filters={filters} onFiltersChange={setFilters} allTags={allTags} />
        }
        bulkActions={onNodeDelete ? bulkActions : undefined}
        emptyState={
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No nodes found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {filters.types || filters.statuses || filters.tags || filters.search
                ? 'Try adjusting your filters'
                : 'Create your first knowledge node to get started'}
            </p>
          </div>
        }
      />
    </div>
  );
}

export default NodesTable;
