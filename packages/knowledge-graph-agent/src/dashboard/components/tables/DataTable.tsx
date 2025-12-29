/**
 * DataTable Component
 *
 * Generic reusable data table with sorting, pagination, filtering, and row selection.
 * Uses TanStack Table for headless table functionality.
 */

'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState as TanStackSortingState,
  type ColumnFiltersState as TanStackColumnFiltersState,
  type VisibilityState,
  type RowSelectionState as TanStackRowSelectionState,
  type PaginationState as TanStackPaginationState,
  type ColumnDef as TanStackColumnDef,
  type Row,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface DataTableColumn<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => unknown;
  cell?: (props: { row: T; value: unknown; rowIndex: number }) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];

  // Pagination
  pageSize?: number;
  pageIndex?: number;
  totalCount?: number;
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  pageSizeOptions?: number[];

  // Sorting
  sorting?: { id: string; desc: boolean }[];
  onSortingChange?: (sorting: { id: string; desc: boolean }[]) => void;

  // Selection
  enableRowSelection?: boolean | ((row: T) => boolean);
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;

  // Row actions
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  getRowId?: (row: T) => string;

  // Global filter
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;
  showGlobalFilter?: boolean;

  // Column visibility
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  showColumnToggle?: boolean;

  // Display
  loading?: boolean;
  emptyState?: React.ReactNode;
  stickyHeader?: boolean;
  striped?: boolean;
  dense?: boolean;
  bordered?: boolean;

  // Toolbar & bulk actions
  toolbar?: React.ReactNode;
  bulkActions?: (selectedRows: T[]) => React.ReactNode;

  className?: string;
}

// ============================================================================
// Subcomponents
// ============================================================================

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-700">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState({ children }: { children?: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={100} className="px-4 py-12 text-center">
        {children || (
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm mt-1">There are no items to display.</p>
          </div>
        )}
      </td>
    </tr>
  );
}

function ColumnVisibilityDropdown({
  columns,
  visibility,
  onChange,
}: {
  columns: { id: string; header: string | React.ReactNode }[];
  visibility: Record<string, boolean>;
  onChange: (id: string, visible: boolean) => void;
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
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md',
          'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
          'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
        )}
      >
        <Columns className="h-4 w-4" />
        Columns
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="py-1">
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibility[column.id] !== false}
                  onChange={(e) => onChange(column.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {typeof column.header === 'string' ? column.header : column.id}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Pagination({
  pageIndex,
  pageSize,
  totalCount,
  pageCount,
  canPreviousPage,
  canNextPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300">
        <span>
          Showing <span className="font-medium">{start}</span> to{' '}
          <span className="font-medium">{end}</span> of{' '}
          <span className="font-medium">{totalCount}</span> results
        </span>

        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={cn(
              'rounded-md border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(0)}
          disabled={!canPreviousPage}
          className={cn(
            'p-2 rounded-md transition-colors',
            canPreviousPage
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
          )}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={!canPreviousPage}
          className={cn(
            'p-2 rounded-md transition-colors',
            canPreviousPage
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
          Page {pageIndex + 1} of {pageCount || 1}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={!canNextPage}
          className={cn(
            'p-2 rounded-md transition-colors',
            canNextPage
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
          )}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(pageCount - 1)}
          disabled={!canNextPage}
          className={cn(
            'p-2 rounded-md transition-colors',
            canNextPage
              ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
          )}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DataTable<T>({
  data,
  columns,
  pageSize = 10,
  pageIndex = 0,
  totalCount,
  onPaginationChange,
  pageSizeOptions = [10, 20, 50, 100],
  sorting = [],
  onSortingChange,
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange,
  onRowClick,
  onRowDoubleClick,
  getRowId,
  globalFilter = '',
  onGlobalFilterChange,
  showGlobalFilter = false,
  columnVisibility = {},
  onColumnVisibilityChange,
  showColumnToggle = false,
  loading = false,
  emptyState,
  stickyHeader = false,
  striped = false,
  dense = false,
  bordered = false,
  toolbar,
  bulkActions,
  className,
}: DataTableProps<T>) {
  // Convert our column definitions to TanStack Table format
  const tableColumns = React.useMemo((): TanStackColumnDef<T>[] => {
    const cols: TanStackColumnDef<T>[] = [];

    // Add selection column if enabled
    if (enableRowSelection) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            aria-label="Select row"
          />
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      });
    }

    // Add data columns
    for (const column of columns) {
      cols.push({
        id: column.id,
        accessorKey: column.accessorKey as string | undefined,
        accessorFn: column.accessorFn,
        header: ({ column: col }) => {
          if (!column.sortable) {
            return (
              <span className={cn(column.align === 'center' && 'text-center', column.align === 'right' && 'text-right')}>
                {column.header}
              </span>
            );
          }

          return (
            <button
              type="button"
              onClick={() => col.toggleSorting()}
              className={cn(
                'flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100',
                column.align === 'center' && 'justify-center',
                column.align === 'right' && 'justify-end ml-auto'
              )}
            >
              {column.header}
              {col.getIsSorted() === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : col.getIsSorted() === 'desc' ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              )}
            </button>
          );
        },
        cell: ({ row, getValue }) => {
          const value = getValue();
          if (column.cell) {
            return column.cell({
              row: row.original,
              value,
              rowIndex: row.index,
            });
          }
          return (
            <span className={cn(column.align === 'center' && 'text-center block', column.align === 'right' && 'text-right block')}>
              {String(value ?? '')}
            </span>
          );
        },
        size: typeof column.width === 'number' ? column.width : undefined,
        minSize: column.minWidth,
        enableSorting: column.sortable !== false,
        enableHiding: !column.hidden,
      });
    }

    return cols;
  }, [columns, enableRowSelection]);

  // Table state
  const [internalSorting, setInternalSorting] = React.useState<TanStackSortingState>(sorting);
  const [internalFilter, setInternalFilter] = React.useState(globalFilter);
  const [internalVisibility, setInternalVisibility] = React.useState<VisibilityState>(columnVisibility);
  const [internalSelection, setInternalSelection] = React.useState<TanStackRowSelectionState>(rowSelection);
  const [internalPagination, setInternalPagination] = React.useState<TanStackPaginationState>({
    pageIndex,
    pageSize,
  });

  // Sync external state changes
  React.useEffect(() => {
    setInternalSorting(sorting);
  }, [sorting]);

  React.useEffect(() => {
    setInternalFilter(globalFilter);
  }, [globalFilter]);

  React.useEffect(() => {
    setInternalVisibility(columnVisibility);
  }, [columnVisibility]);

  React.useEffect(() => {
    setInternalSelection(rowSelection);
  }, [rowSelection]);

  React.useEffect(() => {
    setInternalPagination({ pageIndex, pageSize });
  }, [pageIndex, pageSize]);

  // Create table instance
  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: !!onPaginationChange,
    pageCount: totalCount ? Math.ceil(totalCount / pageSize) : undefined,
    state: {
      sorting: internalSorting,
      globalFilter: internalFilter,
      columnVisibility: internalVisibility,
      rowSelection: internalSelection,
      pagination: internalPagination,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(internalSorting) : updater;
      setInternalSorting(newSorting);
      onSortingChange?.(newSorting);
    },
    onGlobalFilterChange: (updater) => {
      const newFilter = typeof updater === 'function' ? updater(internalFilter) : updater;
      setInternalFilter(newFilter);
      onGlobalFilterChange?.(newFilter);
    },
    onColumnVisibilityChange: (updater) => {
      const newVisibility = typeof updater === 'function' ? updater(internalVisibility) : updater;
      setInternalVisibility(newVisibility);
      onColumnVisibilityChange?.(newVisibility);
    },
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' ? updater(internalSelection) : updater;
      setInternalSelection(newSelection);
      onRowSelectionChange?.(newSelection);
    },
    onPaginationChange: (updater) => {
      const newPagination = typeof updater === 'function' ? updater(internalPagination) : updater;
      setInternalPagination(newPagination);
      onPaginationChange?.(newPagination);
    },
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    enableRowSelection: typeof enableRowSelection === 'function'
      ? (row: Row<T>) => enableRowSelection(row.original)
      : enableRowSelection,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const effectiveTotalCount = totalCount ?? data.length;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar */}
      {(toolbar || showGlobalFilter || showColumnToggle || (bulkActions && selectedRows.length > 0)) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 flex-1">
            {showGlobalFilter && (
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={internalFilter}
                  onChange={(e) => table.setGlobalFilter(e.target.value)}
                  placeholder="Search..."
                  className={cn(
                    'w-full pl-10 pr-10 py-2 text-sm rounded-md',
                    'border border-gray-300 dark:border-gray-600',
                    'bg-white dark:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                />
                {internalFilter && (
                  <button
                    type="button"
                    onClick={() => table.setGlobalFilter('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {bulkActions && selectedRows.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedRows.length} selected
                </span>
                {bulkActions(selectedRows)}
              </div>
            )}

            {toolbar}
          </div>

          {showColumnToggle && (
            <ColumnVisibilityDropdown
              columns={columns.map((c) => ({ id: c.id, header: c.header }))}
              visibility={internalVisibility}
              onChange={(id, visible) => {
                table.setColumnVisibility((prev) => ({ ...prev, [id]: visible }));
              }}
            />
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto">
        <table className={cn('w-full border-collapse', bordered && 'border border-gray-200 dark:border-gray-700')}>
          <thead
            className={cn(
              'bg-gray-50 dark:bg-gray-800/50',
              stickyHeader && 'sticky top-0 z-10'
            )}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                      'border-b border-gray-200 dark:border-gray-700',
                      dense ? 'py-2' : 'py-3',
                      bordered && 'border-r last:border-r-0'
                    )}
                    style={{
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
                      minWidth: header.column.columnDef.minSize,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <TableSkeleton columns={tableColumns.length} />
            ) : table.getRowModel().rows.length === 0 ? (
              <EmptyState>{emptyState}</EmptyState>
            ) : (
              table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  onDoubleClick={() => onRowDoubleClick?.(row.original)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
                    row.getIsSelected() && 'bg-blue-50 dark:bg-blue-900/20',
                    striped && index % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-800/50'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-4 text-sm text-gray-900 dark:text-gray-100',
                        dense ? 'py-2' : 'py-3',
                        bordered && 'border-r last:border-r-0 border-gray-200 dark:border-gray-700'
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Loading overlay */}
      {loading && data.length > 0 && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Pagination */}
      {effectiveTotalCount > 0 && (
        <Pagination
          pageIndex={internalPagination.pageIndex}
          pageSize={internalPagination.pageSize}
          totalCount={effectiveTotalCount}
          pageCount={Math.ceil(effectiveTotalCount / internalPagination.pageSize)}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPageChange={(page) => table.setPageIndex(page)}
          onPageSizeChange={(size) => table.setPageSize(size)}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}

export default DataTable;
