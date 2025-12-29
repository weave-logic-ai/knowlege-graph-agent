/**
 * Sidebar Component
 *
 * Collapsible navigation sidebar with grouped menu items.
 * Features:
 * - 7 navigation sections: Overview, Graph, Nodes, Search, Agents, Workflows, Settings
 * - Icons for each section
 * - Collapsible on mobile
 * - Active state highlighting
 * - Expandable section groups
 */

'use client';

import * as React from 'react';
import {
  Home,
  LayoutDashboard,
  Network,
  Circle,
  Search,
  Compass,
  Sparkles,
  Bot,
  Users,
  Plus,
  Route,
  GitBranch,
  Play,
  History,
  Settings,
  Sliders,
  Activity,
  Database,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Brain,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useLayoutStore } from '../../stores/layout-store';
import type { NavSection, NavItem } from '../../types';

// ============================================================================
// Navigation Configuration
// ============================================================================

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Home },
    ],
  },
  {
    id: 'knowledge',
    title: 'Graph',
    icon: Brain,
    defaultOpen: true,
    items: [
      { id: 'graph', label: 'Graph Explorer', href: '/dashboard/graph', icon: Network },
      { id: 'nodes', label: 'Nodes', href: '/dashboard/graph/nodes', icon: Circle },
    ],
  },
  {
    id: 'search',
    title: 'Search',
    icon: Search,
    items: [
      { id: 'vector', label: 'Vector Search', href: '/dashboard/search', icon: Compass },
      { id: 'semantic', label: 'Semantic', href: '/dashboard/search/semantic', icon: Sparkles },
    ],
  },
  {
    id: 'agents',
    title: 'Agents',
    icon: Bot,
    items: [
      { id: 'list', label: 'Agent List', href: '/dashboard/agents', icon: Users },
      { id: 'spawn', label: 'Spawn Agent', href: '/dashboard/agents/spawn', icon: Plus },
      { id: 'trajectories', label: 'Trajectories', href: '/dashboard/trajectories', icon: Route },
    ],
  },
  {
    id: 'workflows',
    title: 'Workflows',
    icon: GitBranch,
    items: [
      { id: 'active', label: 'Active Workflows', href: '/dashboard/workflows', icon: Play },
      { id: 'history', label: 'History', href: '/dashboard/workflows/history', icon: History },
    ],
  },
  {
    id: 'admin',
    title: 'Settings',
    icon: Settings,
    items: [
      { id: 'config', label: 'Configuration', href: '/dashboard/config', icon: Sliders },
      { id: 'health', label: 'Health', href: '/dashboard/admin/health', icon: Activity },
      { id: 'backup', label: 'Backup/Restore', href: '/dashboard/admin/backup', icon: Database },
    ],
  },
];

// ============================================================================
// Sub-Components
// ============================================================================

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarHeader({ collapsed, onToggle }: SidebarHeaderProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-border px-4">
      {!collapsed && (
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">KG Agent</span>
        </div>
      )}
      {collapsed && <Brain className="h-6 w-6 text-primary mx-auto" />}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn('h-8 w-8', collapsed && 'mx-auto')}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <PanelLeft className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

interface SidebarSectionProps {
  section: NavSection;
  collapsed: boolean;
  currentPath: string;
  openSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
  onNavigate: (href: string) => void;
}

function SidebarSection({
  section,
  collapsed,
  currentPath,
  openSections,
  onToggleSection,
  onNavigate,
}: SidebarSectionProps) {
  const Icon = section.icon;
  const isOpen = openSections.has(section.id);
  const hasActiveItem = section.items.some((item) => currentPath === item.href);

  if (collapsed) {
    // In collapsed mode, show only the section icon with a tooltip
    return (
      <div className="px-2 py-1">
        <Button
          variant={hasActiveItem ? 'secondary' : 'ghost'}
          size="icon"
          className="w-full h-10"
          title={section.title}
          onClick={() => {
            // Navigate to first item in section
            if (section.items.length > 0) {
              onNavigate(section.items[0].href);
            }
          }}
        >
          <Icon className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="px-2 py-1">
      <button
        onClick={() => onToggleSection(section.id)}
        className={cn(
          'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium',
          'hover:bg-accent hover:text-accent-foreground transition-colors',
          hasActiveItem && 'text-primary'
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{section.title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {section.items.map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              active={currentPath === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarNavItemProps {
  item: NavItem;
  active: boolean;
  onNavigate: (href: string) => void;
}

function SidebarNavItem({ item, active, onNavigate }: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={() => !item.disabled && onNavigate(item.href)}
      disabled={item.disabled}
      className={cn(
        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm',
        'transition-colors',
        active
          ? 'bg-primary text-primary-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        item.disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{item.label}</span>
      </div>
      {item.badge !== undefined && (
        <Badge
          variant={item.badgeVariant || 'secondary'}
          size="sm"
        >
          {item.badge}
        </Badge>
      )}
    </button>
  );
}

// ============================================================================
// Main Sidebar Component
// ============================================================================

export interface SidebarProps {
  /** Override collapsed state */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapse?: (collapsed: boolean) => void;
  /** Current active path */
  currentPath?: string;
  /** Callback when navigation occurs */
  onNavigate?: (href: string) => void;
  /** Additional CSS classes */
  className?: string;
}

export function Sidebar({
  collapsed: collapsedProp,
  onCollapse,
  currentPath = '/dashboard',
  onNavigate,
  className,
}: SidebarProps) {
  // Use store state if not controlled
  const {
    sidebarCollapsed: storeCollapsed,
    toggleSidebar,
  } = useLayoutStore();

  const collapsed = collapsedProp ?? storeCollapsed;

  // Track which sections are open
  const [openSections, setOpenSections] = React.useState<Set<string>>(
    () => new Set(NAV_SECTIONS.filter((s) => s.defaultOpen).map((s) => s.id))
  );

  const handleToggle = React.useCallback(() => {
    if (onCollapse) {
      onCollapse(!collapsed);
    } else {
      toggleSidebar();
    }
  }, [collapsed, onCollapse, toggleSidebar]);

  const handleToggleSection = React.useCallback((sectionId: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleNavigate = React.useCallback(
    (href: string) => {
      if (onNavigate) {
        onNavigate(href);
      } else {
        // Default: use window.location for navigation
        window.location.href = href;
      }
    },
    [onNavigate]
  );

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-card border-r border-border',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-[280px]',
        className
      )}
    >
      {/* Header */}
      <SidebarHeader collapsed={collapsed} onToggle={handleToggle} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1">
          {NAV_SECTIONS.map((section) => (
            <SidebarSection
              key={section.id}
              section={section}
              collapsed={collapsed}
              currentPath={currentPath}
              openSections={openSections}
              onToggleSection={handleToggleSection}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-border p-4">
          <div className="text-xs text-muted-foreground">
            Knowledge Graph Agent v0.4.0
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
