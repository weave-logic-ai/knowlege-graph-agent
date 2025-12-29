/**
 * NodeTooltip Component
 *
 * Hover tooltip for graph nodes displaying node information
 * and quick action buttons.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { NodeTooltipProps } from '../../types/graph';
import type { NodeType } from '../../../core/types';
import { NODE_COLORS, NODE_COLORS_DARK, NODE_TYPE_LABELS, NODE_STATUS_LABELS } from './constants';

// ============================================================================
// Icon Components
// ============================================================================

interface IconProps {
  className?: string;
  size?: number;
}

const EyeIcon: React.FC<IconProps> = ({ className = '', size = 14 }) => (
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

const EditIcon: React.FC<IconProps> = ({ className = '', size = 14 }) => (
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
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const TrashIcon: React.FC<IconProps> = ({ className = '', size = 14 }) => (
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
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const LinkIcon: React.FC<IconProps> = ({ className = '', size = 14 }) => (
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
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// ============================================================================
// Type Badge Component
// ============================================================================

interface TypeBadgeProps {
  type: NodeType;
  darkMode?: boolean;
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ type, darkMode = false }) => {
  const colors = darkMode ? NODE_COLORS_DARK : NODE_COLORS;
  const color = colors[type] || colors.concept;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {NODE_TYPE_LABELS[type]}
    </span>
  );
};

// ============================================================================
// Status Badge Component
// ============================================================================

interface StatusBadgeProps {
  status: string;
  darkMode?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, darkMode = false }) => {
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    active: {
      bg: darkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
      text: darkMode ? '#4ADE80' : '#16A34A',
      border: darkMode ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)',
    },
    draft: {
      bg: darkMode ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)',
      text: darkMode ? '#FACC15' : '#CA8A04',
      border: darkMode ? 'rgba(234, 179, 8, 0.4)' : 'rgba(234, 179, 8, 0.3)',
    },
    deprecated: {
      bg: darkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      text: darkMode ? '#F87171' : '#DC2626',
      border: darkMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)',
    },
    archived: {
      bg: darkMode ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.1)',
      text: darkMode ? '#94A3B8' : '#64748B',
      border: darkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(148, 163, 184, 0.3)',
    },
  };

  const colors = statusColors[status] || statusColors.active;
  const label = NODE_STATUS_LABELS[status as keyof typeof NODE_STATUS_LABELS] || status;

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {label}
    </span>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const NodeTooltip: React.FC<NodeTooltipProps> = ({
  node,
  position,
  visible,
  onView,
  onEdit,
  onDelete,
  darkMode = false,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position to keep tooltip within viewport
  useEffect(() => {
    if (!tooltipRef.current || !visible) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x + 15; // Offset from cursor
    let y = position.y + 15;

    // Adjust horizontal position if overflowing
    if (x + rect.width > viewportWidth - 20) {
      x = position.x - rect.width - 15;
    }

    // Adjust vertical position if overflowing
    if (y + rect.height > viewportHeight - 20) {
      y = position.y - rect.height - 15;
    }

    // Ensure minimum position
    x = Math.max(10, x);
    y = Math.max(10, y);

    setAdjustedPosition({ x, y });
  }, [position, visible]);

  if (!visible || !node) return null;

  // Theme-aware colors
  const bgColor = darkMode ? 'bg-slate-800' : 'bg-white';
  const borderColor = darkMode ? 'border-slate-700' : 'border-slate-200';
  const textColor = darkMode ? 'text-slate-200' : 'text-slate-800';
  const textMutedColor = darkMode ? 'text-slate-400' : 'text-slate-500';
  const hoverBgColor = darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100';
  const dividerColor = darkMode ? 'border-slate-700' : 'border-slate-200';

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-50 min-w-[220px] max-w-[300px] rounded-lg shadow-lg ${bgColor} ${borderColor} border overflow-hidden`}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        pointerEvents: 'auto',
      }}
    >
      {/* Header */}
      <div className={`px-3 py-2 ${bgColor}`}>
        <h4 className={`font-semibold text-sm ${textColor} mb-1 line-clamp-2`}>
          {node.title}
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={node.type} darkMode={darkMode} />
          <StatusBadge status={node.status} darkMode={darkMode} />
        </div>
      </div>

      {/* Divider */}
      <div className={`border-t ${dividerColor}`} />

      {/* Info */}
      <div className="px-3 py-2 space-y-1">
        {/* Connection count */}
        <div className={`flex items-center gap-2 text-xs ${textMutedColor}`}>
          <LinkIcon size={12} />
          <span>
            {node.connections} connection{node.connections !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tags */}
        {node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {node.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                  darkMode
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                #{tag}
              </span>
            ))}
            {node.tags.length > 5 && (
              <span className={`text-xs ${textMutedColor}`}>
                +{node.tags.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {(onView || onEdit || onDelete) && (
        <>
          <div className={`border-t ${dividerColor}`} />
          <div className="flex items-center px-1 py-1">
            {onView && (
              <button
                onClick={() => onView(node)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs ${textColor} ${hoverBgColor} rounded transition-colors`}
                title="View details"
              >
                <EyeIcon size={12} />
                <span>View</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(node)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs ${textColor} ${hoverBgColor} rounded transition-colors`}
                title="Edit node"
              >
                <EditIcon size={12} />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(node)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-red-500 hover:text-red-600 ${hoverBgColor} rounded transition-colors`}
                title="Delete node"
              >
                <TrashIcon size={12} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NodeTooltip;
