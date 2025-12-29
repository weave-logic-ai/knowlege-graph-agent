/**
 * GraphLegend Component
 *
 * Legend showing node type color coding with visibility toggles.
 */

import React, { useState } from 'react';
import type { GraphLegendProps } from '../../types/graph';
import type { NodeType } from '../../../core/types';
import {
  NODE_COLORS,
  NODE_COLORS_DARK,
  NODE_TYPE_LABELS,
  NODE_TYPE_ICONS,
  ALL_NODE_TYPES,
} from './constants';

// ============================================================================
// Icon Components
// ============================================================================

interface IconProps {
  className?: string;
  size?: number;
}

const ChevronUpIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
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
    <path d="m18 15-6-6-6 6" />
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

const EyeIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
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
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon: React.FC<IconProps> = ({ className = '', size = 16 }) => (
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
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

// Type-specific icons as SVG components
const TypeIconSvg: Record<string, React.FC<IconProps>> = {
  lightbulb: ({ className = '', size = 14 }) => (
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
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  ),
  code: ({ className = '', size = 14 }) => (
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
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  star: ({ className = '', size = 14 }) => (
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
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  cube: ({ className = '', size = 14 }) => (
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
      <path d="m21 16-9 5-9-5V8l9-5 9 5z" />
      <path d="m3 8 9 5 9-5" />
      <path d="M12 13v9" />
    </svg>
  ),
  server: ({ className = '', size = 14 }) => (
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
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  ),
  book: ({ className = '', size = 14 }) => (
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
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  'shield-check': ({ className = '', size = 14 }) => (
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  plug: ({ className = '', size = 14 }) => (
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
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </svg>
  ),
};

// ============================================================================
// Legend Item Component
// ============================================================================

interface LegendItemProps {
  type: NodeType;
  visible: boolean;
  onToggle: () => void;
  darkMode: boolean;
}

const LegendItem: React.FC<LegendItemProps> = ({
  type,
  visible,
  onToggle,
  darkMode,
}) => {
  const colors = darkMode ? NODE_COLORS_DARK : NODE_COLORS;
  const color = colors[type];
  const label = NODE_TYPE_LABELS[type];
  const iconName = NODE_TYPE_ICONS[type];
  const IconComponent = TypeIconSvg[iconName];

  const textColor = darkMode ? 'text-slate-200' : 'text-slate-700';
  const hoverBgColor = darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100';

  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded transition-colors ${hoverBgColor} ${
        visible ? '' : 'opacity-40'
      }`}
      title={`${visible ? 'Hide' : 'Show'} ${label} nodes`}
    >
      {/* Color indicator */}
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {IconComponent && (
          <IconComponent size={10} className="text-white" />
        )}
      </div>

      {/* Label */}
      <span className={`text-sm ${textColor} flex-1 text-left`}>{label}</span>

      {/* Visibility indicator */}
      <span className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        {visible ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
      </span>
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const GraphLegend: React.FC<GraphLegendProps> = ({
  visibleTypes,
  onToggleType,
  colorScheme,
  collapsed: controlledCollapsed,
  onToggleCollapse,
  className = '',
  darkMode = false,
}) => {
  // Use internal state if not controlled
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  // Theme-aware colors
  const bgColor = darkMode ? 'bg-slate-800' : 'bg-white';
  const borderColor = darkMode ? 'border-slate-700' : 'border-slate-200';
  const textColor = darkMode ? 'text-slate-200' : 'text-slate-700';
  const textMutedColor = darkMode ? 'text-slate-400' : 'text-slate-500';
  const hoverBgColor = darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100';

  // Count visible types
  const visibleCount = visibleTypes.length;
  const totalCount = ALL_NODE_TYPES.length;

  // Toggle all types
  const handleToggleAll = () => {
    if (visibleCount === totalCount) {
      // Hide all - but keep at least one visible
      // Actually, in this case we should hide all, parent should handle empty state
      ALL_NODE_TYPES.forEach((type) => {
        if (visibleTypes.includes(type)) {
          onToggleType(type);
        }
      });
    } else {
      // Show all
      ALL_NODE_TYPES.forEach((type) => {
        if (!visibleTypes.includes(type)) {
          onToggleType(type);
        }
      });
    }
  };

  return (
    <div
      className={`graph-legend ${bgColor} ${borderColor} border rounded-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <button
        onClick={handleToggleCollapse}
        className={`flex items-center justify-between w-full px-3 py-2 ${hoverBgColor} transition-colors`}
      >
        <span className={`text-sm font-medium ${textColor}`}>Legend</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${textMutedColor}`}>
            {visibleCount}/{totalCount}
          </span>
          {isCollapsed ? (
            <ChevronDownIcon size={16} className={textMutedColor} />
          ) : (
            <ChevronUpIcon size={16} className={textMutedColor} />
          )}
        </div>
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className={`border-t ${borderColor} px-2 py-2`}>
          {/* Toggle All Button */}
          <button
            onClick={handleToggleAll}
            className={`w-full text-xs text-center py-1 mb-2 rounded ${hoverBgColor} ${textMutedColor} transition-colors`}
          >
            {visibleCount === totalCount ? 'Hide All' : 'Show All'}
          </button>

          {/* Type Items */}
          <div className="space-y-0.5">
            {ALL_NODE_TYPES.map((type) => (
              <LegendItem
                key={type}
                type={type}
                visible={visibleTypes.includes(type)}
                onToggle={() => onToggleType(type)}
                darkMode={darkMode}
              />
            ))}
          </div>

          {/* Color Scheme Info */}
          {colorScheme !== 'type' && (
            <div
              className={`mt-3 pt-2 border-t ${borderColor} text-xs ${textMutedColor} text-center`}
            >
              Currently coloring by: {colorScheme === 'status' ? 'Status' : 'Custom'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GraphLegend;
