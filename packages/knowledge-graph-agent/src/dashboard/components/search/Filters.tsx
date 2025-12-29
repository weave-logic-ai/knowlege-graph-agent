/**
 * Filters Component
 *
 * Advanced filters panel with type, tag, date range, and custom field filters.
 */

'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Calendar,
  Tag,
  FileText,
  Code,
  Star,
  Box,
  Server,
  BookOpen,
  Shield,
  Plug,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { NodeType, NodeStatus, SearchFilters } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface FiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags?: string[];
  showTypeFilter?: boolean;
  showStatusFilter?: boolean;
  showTagFilter?: boolean;
  showDateFilter?: boolean;
  showCustomFields?: boolean;
  customFields?: CustomFieldConfig[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  variant?: 'sidebar' | 'inline' | 'popover';
  className?: string;
}

export interface CustomFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

// ============================================================================
// Constants
// ============================================================================

const NODE_TYPES: { type: NodeType; label: string; icon: React.ElementType }[] = [
  { type: 'concept', label: 'Concept', icon: FileText },
  { type: 'technical', label: 'Technical', icon: Code },
  { type: 'feature', label: 'Feature', icon: Star },
  { type: 'primitive', label: 'Primitive', icon: Box },
  { type: 'service', label: 'Service', icon: Server },
  { type: 'guide', label: 'Guide', icon: BookOpen },
  { type: 'standard', label: 'Standard', icon: Shield },
  { type: 'integration', label: 'Integration', icon: Plug },
];

const NODE_STATUSES: { status: NodeStatus; label: string; color: string }[] = [
  { status: 'active', label: 'Active', color: 'bg-green-500' },
  { status: 'draft', label: 'Draft', color: 'bg-yellow-500' },
  { status: 'deprecated', label: 'Deprecated', color: 'bg-orange-500' },
  { status: 'archived', label: 'Archived', color: 'bg-gray-500' },
];

const DATE_PRESETS = [
  { label: 'Today', value: 0 },
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
  { label: 'This year', value: 365 },
];

// ============================================================================
// Subcomponents
// ============================================================================

function FilterSection({
  title,
  children,
  collapsible = true,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-4 first:pt-0 last:border-b-0">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
      ) : (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          {title}
        </div>
      )}
      {(!collapsible || isOpen) && <div className="mt-3">{children}</div>}
    </div>
  );
}

function MultiSelectFilter<T extends string>({
  options,
  selected,
  onChange,
  renderOption,
}: {
  options: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  renderOption: (option: T, isSelected: boolean) => React.ReactNode;
}) {
  const toggleOption = (option: T) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-1">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-left',
              'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
              isSelected && 'bg-blue-50 dark:bg-blue-900/20'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-4 h-4 rounded border',
                isSelected
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300 dark:border-gray-600'
              )}
            >
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </div>
            {renderOption(option, isSelected)}
          </button>
        );
      })}
    </div>
  );
}

function DateRangePicker({
  value,
  onChange,
}: {
  value: { start: Date | null; end: Date | null } | undefined;
  onChange: (value: { start: Date | null; end: Date | null } | undefined) => void;
}) {
  const [preset, setPreset] = React.useState<number | null>(null);

  const handlePresetChange = (days: number) => {
    setPreset(days);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onChange({ start, end });
  };

  const handleCustomChange = (
    field: 'start' | 'end',
    dateString: string
  ) => {
    const date = dateString ? new Date(dateString) : null;
    setPreset(null);
    onChange({
      start: field === 'start' ? date : value?.start ?? null,
      end: field === 'end' ? date : value?.end ?? null,
    });
  };

  return (
    <div className="space-y-3">
      {/* Presets */}
      <div className="flex flex-wrap gap-1">
        {DATE_PRESETS.map(({ label, value: days }) => (
          <button
            key={days}
            type="button"
            onClick={() => handlePresetChange(days)}
            className={cn(
              'px-2 py-1 text-xs rounded-md transition-colors',
              preset === days
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            From
          </label>
          <input
            type="date"
            value={value?.start?.toISOString().split('T')[0] ?? ''}
            onChange={(e) => handleCustomChange('start', e.target.value)}
            className={cn(
              'w-full px-2 py-1.5 text-sm rounded-md',
              'border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            To
          </label>
          <input
            type="date"
            value={value?.end?.toISOString().split('T')[0] ?? ''}
            onChange={(e) => handleCustomChange('end', e.target.value)}
            className={cn(
              'w-full px-2 py-1.5 text-sm rounded-md',
              'border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          />
        </div>
      </div>
    </div>
  );
}

function TagFilter({
  availableTags,
  selected,
  onChange,
}: {
  availableTags: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [search, setSearch] = React.useState('');

  const filteredTags = React.useMemo(() => {
    if (!search) return availableTags.slice(0, 20);
    return availableTags
      .filter((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 20);
  }, [availableTags, search]);

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tags..."
        className={cn(
          'w-full px-3 py-1.5 text-sm rounded-md',
          'border border-gray-300 dark:border-gray-600',
          'bg-white dark:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500'
        )}
      />

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tag list */}
      <div className="max-h-40 overflow-y-auto space-y-1">
        {filteredTags.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1 rounded text-sm text-left',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                isSelected && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-4 h-4 rounded border',
                  isSelected
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <Tag className="h-3 w-3 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{tag}</span>
            </button>
          );
        })}
      </div>

      {availableTags.length > 20 && !search && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing first 20 tags. Use search to find more.
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function Filters({
  filters,
  onFiltersChange,
  availableTags = [],
  showTypeFilter = true,
  showStatusFilter = true,
  showTagFilter = true,
  showDateFilter = true,
  showCustomFields = false,
  customFields = [],
  collapsible = true,
  defaultCollapsed = false,
  variant = 'sidebar',
  className,
}: FiltersProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.types?.length) count += filters.types.length;
    if (filters.statuses?.length) count += filters.statuses.length;
    if (filters.tags?.length) count += filters.tags.length;
    if (filters.dateRange?.start || filters.dateRange?.end) count += 1;
    if (filters.customFields) count += Object.keys(filters.customFields).length;
    return count;
  }, [filters]);

  const handleClearAll = () => {
    onFiltersChange({});
  };

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-center gap-4', className)}>
        {/* Type filter dropdown */}
        {showTypeFilter && (
          <select
            value={filters.types?.[0] ?? ''}
            onChange={(e) =>
              updateFilter('types', e.target.value ? [e.target.value as NodeType] : undefined)
            }
            className={cn(
              'rounded-md border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-sm py-1.5 px-3',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <option value="">All Types</option>
            {NODE_TYPES.map(({ type, label }) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
        )}

        {/* Status filter dropdown */}
        {showStatusFilter && (
          <select
            value={filters.statuses?.[0] ?? ''}
            onChange={(e) =>
              updateFilter('statuses', e.target.value ? [e.target.value as NodeStatus] : undefined)
            }
            className={cn(
              'rounded-md border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-sm py-1.5 px-3',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
          >
            <option value="">All Statuses</option>
            {NODE_STATUSES.map(({ status, label }) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        )}

        {/* Clear button */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
    );
  }

  // Sidebar variant
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-gray-100">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear all
            </button>
          )}
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter sections */}
      {!isCollapsed && (
        <div className="px-4 py-3 space-y-1">
          {/* Type filter */}
          {showTypeFilter && (
            <FilterSection title="Type" collapsible>
              <MultiSelectFilter
                options={NODE_TYPES.map((t) => t.type)}
                selected={filters.types ?? []}
                onChange={(types) => updateFilter('types', types.length ? types : undefined)}
                renderOption={(type, isSelected) => {
                  const config = NODE_TYPES.find((t) => t.type === type)!;
                  const Icon = config.icon;
                  return (
                    <div className="flex items-center gap-2 flex-1">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">{config.label}</span>
                    </div>
                  );
                }}
              />
            </FilterSection>
          )}

          {/* Status filter */}
          {showStatusFilter && (
            <FilterSection title="Status" collapsible>
              <MultiSelectFilter
                options={NODE_STATUSES.map((s) => s.status)}
                selected={filters.statuses ?? []}
                onChange={(statuses) =>
                  updateFilter('statuses', statuses.length ? statuses : undefined)
                }
                renderOption={(status, isSelected) => {
                  const config = NODE_STATUSES.find((s) => s.status === status)!;
                  return (
                    <div className="flex items-center gap-2 flex-1">
                      <div className={cn('w-2 h-2 rounded-full', config.color)} />
                      <span className="text-gray-700 dark:text-gray-300">{config.label}</span>
                    </div>
                  );
                }}
              />
            </FilterSection>
          )}

          {/* Tag filter */}
          {showTagFilter && availableTags.length > 0 && (
            <FilterSection title="Tags" collapsible>
              <TagFilter
                availableTags={availableTags}
                selected={filters.tags ?? []}
                onChange={(tags) => updateFilter('tags', tags.length ? tags : undefined)}
              />
            </FilterSection>
          )}

          {/* Date filter */}
          {showDateFilter && (
            <FilterSection title="Date Range" collapsible>
              <DateRangePicker
                value={filters.dateRange}
                onChange={(range) => updateFilter('dateRange', range)}
              />
            </FilterSection>
          )}

          {/* Custom fields */}
          {showCustomFields && customFields.length > 0 && (
            <FilterSection title="Custom Fields" collapsible>
              <div className="space-y-3">
                {customFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {field.label}
                    </label>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={(filters.customFields?.[field.id] as string) ?? ''}
                        onChange={(e) =>
                          updateFilter('customFields', {
                            ...filters.customFields,
                            [field.id]: e.target.value || undefined,
                          })
                        }
                        placeholder={field.placeholder}
                        className={cn(
                          'w-full px-3 py-1.5 text-sm rounded-md',
                          'border border-gray-300 dark:border-gray-600',
                          'bg-white dark:bg-gray-800',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      />
                    )}
                    {field.type === 'select' && field.options && (
                      <select
                        value={(filters.customFields?.[field.id] as string) ?? ''}
                        onChange={(e) =>
                          updateFilter('customFields', {
                            ...filters.customFields,
                            [field.id]: e.target.value || undefined,
                          })
                        }
                        className={cn(
                          'w-full px-3 py-1.5 text-sm rounded-md',
                          'border border-gray-300 dark:border-gray-600',
                          'bg-white dark:bg-gray-800',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500'
                        )}
                      >
                        <option value="">All</option>
                        {field.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </FilterSection>
          )}
        </div>
      )}
    </div>
  );
}

export default Filters;
