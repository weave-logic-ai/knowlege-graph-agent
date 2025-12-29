/**
 * GraphControls Component
 *
 * Control panel for graph visualization with layout selection,
 * zoom controls, filters, and export options.
 */

import React, { useCallback, useState } from 'react';
import type {
  GraphControlsProps,
  LayoutType,
  ColorScheme,
  GraphFilters,
} from '../../types/graph';
import type { NodeType, NodeStatus } from '../../../core/types';
import {
  NODE_TYPE_LABELS,
  NODE_STATUS_LABELS,
  ALL_NODE_TYPES,
  ALL_NODE_STATUSES,
  ZOOM_CONFIG,
} from './constants';

// ============================================================================
// Layout Options
// ============================================================================

interface LayoutOption {
  value: LayoutType;
  label: string;
  description: string;
  icon: string;
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    value: 'force',
    label: 'Force-Directed',
    description: 'Physics-based node positioning',
    icon: 'scatter',
  },
  {
    value: 'circle',
    label: 'Circular',
    description: 'Nodes arranged in a circle',
    icon: 'circle',
  },
  {
    value: 'grid',
    label: 'Grid',
    description: 'Nodes in a regular grid',
    icon: 'grid',
  },
  {
    value: 'hierarchical',
    label: 'Hierarchical',
    description: 'Tree-like top-down layout',
    icon: 'hierarchy',
  },
];

const COLOR_SCHEME_OPTIONS: Array<{ value: ColorScheme; label: string }> = [
  { value: 'type', label: 'By Type' },
  { value: 'status', label: 'By Status' },
];

// ============================================================================
// Icon Components (inline SVG for simplicity)
// ============================================================================

interface IconProps {
  className?: string;
  size?: number;
}

const ZoomInIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
  </svg>
);

const ZoomOutIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35M8 11h6" />
  </svg>
);

const FitIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const CenterIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
  </svg>
);

const DownloadIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const SearchIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const FilterIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const LabelsIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
    <path d="M7 7h.01" />
  </svg>
);

const ChevronDownIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const XIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

// ============================================================================
// Sub-Components
// ============================================================================

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: 'left' | 'right';
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  open,
  onOpenChange,
  align = 'left',
  className = '',
}) => {
  return (
    <div className={`relative inline-block ${className}`}>
      <div onClick={() => onOpenChange(!open)}>{trigger}</div>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
          />
          <div
            className={`absolute z-50 mt-2 min-w-[200px] rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const GraphControls: React.FC<GraphControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  onZoomChange,
  layout,
  onLayoutChange,
  showLabels,
  onToggleLabels,
  colorScheme,
  onColorSchemeChange,
  filters,
  onFiltersChange,
  onExport,
  onCenterGraph,
  allTags,
  className = '',
  darkMode = false,
}) => {
  const [layoutDropdownOpen, setLayoutDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  // Theme-aware colors
  const bgColor = darkMode ? 'bg-slate-800' : 'bg-white';
  const borderColor = darkMode ? 'border-slate-700' : 'border-slate-200';
  const textColor = darkMode ? 'text-slate-200' : 'text-slate-700';
  const textMutedColor = darkMode ? 'text-slate-400' : 'text-slate-500';
  const hoverBgColor = darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100';
  const activeBgColor = darkMode ? 'bg-slate-700' : 'bg-slate-100';

  // Filter handlers
  const handleTypeToggle = useCallback(
    (type: NodeType) => {
      const newTypes = filters.types.includes(type)
        ? filters.types.filter((t) => t !== type)
        : [...filters.types, type];
      onFiltersChange({ ...filters, types: newTypes });
    },
    [filters, onFiltersChange]
  );

  const handleStatusToggle = useCallback(
    (status: NodeStatus) => {
      const newStatuses = filters.statuses.includes(status)
        ? filters.statuses.filter((s) => s !== status)
        : [...filters.statuses, status];
      onFiltersChange({ ...filters, statuses: newStatuses });
    },
    [filters, onFiltersChange]
  );

  const handleTagToggle = useCallback(
    (tag: string) => {
      const newTags = filters.tags.includes(tag)
        ? filters.tags.filter((t) => t !== tag)
        : [...filters.tags, tag];
      onFiltersChange({ ...filters, tags: newTags });
    },
    [filters, onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ ...filters, searchQuery: e.target.value });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({
      types: ALL_NODE_TYPES,
      statuses: ALL_NODE_STATUSES,
      tags: [],
      searchQuery: '',
    });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.types.length !== ALL_NODE_TYPES.length ||
    filters.statuses.length !== ALL_NODE_STATUSES.length ||
    filters.tags.length > 0 ||
    filters.searchQuery.length > 0;

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div
      className={`graph-controls flex flex-wrap items-center gap-2 p-3 ${bgColor} ${borderColor} border rounded-lg ${className}`}
    >
      {/* Zoom Controls */}
      <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3">
        <button
          onClick={onZoomOut}
          className={`p-2 rounded ${hoverBgColor} ${textColor} transition-colors`}
          title="Zoom Out"
          disabled={zoom <= ZOOM_CONFIG.min}
        >
          <ZoomOutIcon size={16} />
        </button>
        <input
          type="range"
          min={ZOOM_CONFIG.min * 100}
          max={ZOOM_CONFIG.max * 100}
          value={zoom * 100}
          onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
          className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
          title={`Zoom: ${zoomPercentage}%`}
        />
        <button
          onClick={onZoomIn}
          className={`p-2 rounded ${hoverBgColor} ${textColor} transition-colors`}
          title="Zoom In"
          disabled={zoom >= ZOOM_CONFIG.max}
        >
          <ZoomInIcon size={16} />
        </button>
        <span className={`text-xs ${textMutedColor} min-w-[3rem] text-center`}>
          {zoomPercentage}%
        </span>
        <button
          onClick={onZoomReset}
          className={`p-2 rounded ${hoverBgColor} ${textColor} transition-colors text-xs`}
          title="Reset Zoom"
        >
          1:1
        </button>
      </div>

      {/* Fit & Center */}
      <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-3">
        <button
          onClick={onZoomFit}
          className={`p-2 rounded ${hoverBgColor} ${textColor} transition-colors`}
          title="Fit to View"
        >
          <FitIcon size={16} />
        </button>
        <button
          onClick={onCenterGraph}
          className={`p-2 rounded ${hoverBgColor} ${textColor} transition-colors`}
          title="Center Graph"
        >
          <CenterIcon size={16} />
        </button>
      </div>

      {/* Layout Selector */}
      <Dropdown
        open={layoutDropdownOpen}
        onOpenChange={setLayoutDropdownOpen}
        trigger={
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded ${hoverBgColor} ${textColor} transition-colors text-sm`}
          >
            <span>{LAYOUT_OPTIONS.find((l) => l.value === layout)?.label || 'Layout'}</span>
            <ChevronDownIcon size={14} />
          </button>
        }
      >
        <div className="p-2">
          <div className={`text-xs font-medium ${textMutedColor} px-2 py-1`}>
            Layout
          </div>
          {LAYOUT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onLayoutChange(option.value);
                setLayoutDropdownOpen(false);
              }}
              className={`w-full flex items-start gap-3 px-3 py-2 rounded ${
                layout === option.value ? activeBgColor : hoverBgColor
              } ${textColor} transition-colors text-left`}
            >
              <div>
                <div className="text-sm font-medium">{option.label}</div>
                <div className={`text-xs ${textMutedColor}`}>
                  {option.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Dropdown>

      {/* Labels Toggle */}
      <button
        onClick={onToggleLabels}
        className={`flex items-center gap-2 px-3 py-2 rounded transition-colors text-sm ${
          showLabels
            ? `${activeBgColor} ${textColor}`
            : `${hoverBgColor} ${textMutedColor}`
        }`}
        title={showLabels ? 'Hide Labels' : 'Show Labels'}
      >
        <LabelsIcon size={16} />
        <span className="hidden sm:inline">Labels</span>
      </button>

      {/* Filter Dropdown */}
      <Dropdown
        open={filterDropdownOpen}
        onOpenChange={setFilterDropdownOpen}
        trigger={
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              hasActiveFilters ? activeBgColor : hoverBgColor
            } ${textColor} transition-colors text-sm relative`}
          >
            <FilterIcon size={16} />
            <span className="hidden sm:inline">Filter</span>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>
        }
      >
        <div className="p-3 max-h-[400px] overflow-y-auto">
          {/* Search */}
          <div className="mb-3">
            <label className={`text-xs font-medium ${textMutedColor} block mb-1`}>
              Search
            </label>
            <div className="relative">
              <SearchIcon
                size={14}
                className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${textMutedColor}`}
              />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={handleSearchChange}
                placeholder="Search nodes..."
                className={`w-full pl-8 pr-3 py-2 text-sm rounded border ${borderColor} ${bgColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>

          {/* Node Types */}
          <div className="mb-3">
            <label className={`text-xs font-medium ${textMutedColor} block mb-1`}>
              Node Types
            </label>
            <div className="flex flex-wrap gap-1">
              {ALL_NODE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filters.types.includes(type)
                      ? 'bg-blue-500 text-white'
                      : `${bgColor} ${textMutedColor} ${hoverBgColor} border ${borderColor}`
                  }`}
                >
                  {NODE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Statuses */}
          <div className="mb-3">
            <label className={`text-xs font-medium ${textMutedColor} block mb-1`}>
              Status
            </label>
            <div className="flex flex-wrap gap-1">
              {ALL_NODE_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    filters.statuses.includes(status)
                      ? 'bg-blue-500 text-white'
                      : `${bgColor} ${textMutedColor} ${hoverBgColor} border ${borderColor}`
                  }`}
                >
                  {NODE_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="mb-3">
              <label className={`text-xs font-medium ${textMutedColor} block mb-1`}>
                Tags
              </label>
              <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto">
                {allTags.slice(0, 20).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      filters.tags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : `${bgColor} ${textMutedColor} ${hoverBgColor} border ${borderColor}`
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded border ${borderColor} ${textMutedColor} ${hoverBgColor} transition-colors`}
            >
              <XIcon size={14} />
              Clear Filters
            </button>
          )}
        </div>
      </Dropdown>

      {/* Color Scheme */}
      <select
        value={colorScheme}
        onChange={(e) => onColorSchemeChange(e.target.value as ColorScheme)}
        className={`px-3 py-2 text-sm rounded border ${borderColor} ${bgColor} ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        {COLOR_SCHEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Export Dropdown */}
      <Dropdown
        open={exportDropdownOpen}
        onOpenChange={setExportDropdownOpen}
        align="right"
        trigger={
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded ${hoverBgColor} ${textColor} transition-colors text-sm`}
          >
            <DownloadIcon size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        }
      >
        <div className="p-2">
          <button
            onClick={() => {
              onExport('png');
              setExportDropdownOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded ${hoverBgColor} ${textColor} transition-colors text-left text-sm`}
          >
            Export as PNG
          </button>
          <button
            onClick={() => {
              onExport('svg');
              setExportDropdownOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded ${hoverBgColor} ${textColor} transition-colors text-left text-sm`}
          >
            Export as SVG
          </button>
        </div>
      </Dropdown>
    </div>
  );
};

export default GraphControls;
