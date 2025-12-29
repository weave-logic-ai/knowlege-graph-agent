/**
 * Header Component
 *
 * Top header with search bar, health status, notifications, and user menu.
 * Features:
 * - Search bar with keyboard shortcut hint
 * - System health status indicator
 * - Notifications bell with unread count
 * - User menu dropdown
 * - Theme toggle
 */

'use client';

import * as React from 'react';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Monitor,
  ChevronDown,
  Check,
  X,
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useLayoutStore } from '../../stores/layout-store';
import { useNotificationsStore } from '../../stores/notifications-store';
import type { BreadcrumbItem, Notification, HealthStatus } from '../../types';
import { formatRelativeTime } from '../../lib/utils';

// ============================================================================
// Sub-Components
// ============================================================================

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onOpenCommandPalette?: () => void;
}

function SearchBar({ onSearch, onOpenCommandPalette }: SearchBarProps) {
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (onOpenCommandPalette) {
          onOpenCommandPalette();
        } else {
          inputRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSearch) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search nodes, workflows, agents..."
        className={cn(
          'w-full h-10 pl-10 pr-16 rounded-md border border-input bg-background',
          'text-sm placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'transition-colors'
        )}
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        <span className="text-xs">{navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}</span>K
      </kbd>
    </form>
  );
}

interface HealthIndicatorProps {
  status: HealthStatus;
  onClick?: () => void;
}

function HealthIndicator({ status, onClick }: HealthIndicatorProps) {
  const statusConfig = {
    healthy: { color: 'bg-green-500', label: 'Healthy' },
    degraded: { color: 'bg-yellow-500', label: 'Degraded' },
    unhealthy: { color: 'bg-red-500', label: 'Unhealthy' },
  };

  const config = statusConfig[status];

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <span className={cn('h-2 w-2 rounded-full', config.color)} />
      <span className="text-sm text-muted-foreground hidden sm:inline">
        {config.label}
      </span>
    </Button>
  );
}

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClear: () => void;
}

function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClear,
}: NotificationBellProps) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-md border border-border bg-card shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="h-7 text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex gap-3 px-4 py-3 border-b border-border last:border-0',
                    'hover:bg-accent transition-colors cursor-pointer',
                    !notification.read && 'bg-accent/50'
                  )}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <Badge variant="default" size="sm" dot />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const currentIcon = themes.find((t) => t.value === theme)?.icon ?? Sun;
  const Icon = currentIcon;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label="Toggle theme"
      >
        <Icon className="h-5 w-5" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-36 rounded-md border border-border bg-card shadow-lg z-50">
          {themes.map((t) => {
            const ItemIcon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => {
                  onThemeChange(t.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm',
                  'hover:bg-accent transition-colors',
                  theme === t.value && 'text-primary'
                )}
              >
                <ItemIcon className="h-4 w-4" />
                <span>{t.label}</span>
                {theme === t.value && <Check className="h-4 w-4 ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface UserMenuProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onSettings?: () => void;
  onLogout?: () => void;
}

function UserMenu({ user, onSettings, onLogout }: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const defaultUser = {
    name: 'Admin User',
    email: 'admin@kg-agent.local',
  };

  const displayUser = user ?? defaultUser;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2"
      >
        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {displayUser.avatar ? (
            <img
              src={displayUser.avatar}
              alt={displayUser.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            displayUser.name.charAt(0).toUpperCase()
          )}
        </div>
        <span className="hidden md:inline text-sm">{displayUser.name}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-md border border-border bg-card shadow-lg z-50">
          {/* User Info */}
          <div className="border-b border-border px-4 py-3">
            <p className="font-medium text-sm">{displayUser.name}</p>
            <p className="text-xs text-muted-foreground">{displayUser.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                onSettings?.();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={() => {
                onLogout?.();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
}

function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {items.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={item.label}>
            {index > 0 && <span className="mx-1">/</span>}
            {item.href && !isLast ? (
              <a
                href={item.href}
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {Icon && <Icon className="h-3 w-3" />}
                {item.label}
              </a>
            ) : (
              <span className={cn('flex items-center gap-1', isLast && 'text-foreground font-medium')}>
                {Icon && <Icon className="h-3 w-3" />}
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ============================================================================
// Main Header Component
// ============================================================================

export interface HeaderProps {
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Page title */
  title?: string;
  /** Custom actions to display */
  actions?: React.ReactNode;
  /** Current health status */
  healthStatus?: HealthStatus;
  /** Current user */
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  /** Callbacks */
  onSearch?: (query: string) => void;
  onOpenCommandPalette?: () => void;
  onHealthClick?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function Header({
  breadcrumbs,
  title,
  actions,
  healthStatus = 'healthy',
  user,
  onSearch,
  onOpenCommandPalette,
  onHealthClick,
  onSettings,
  onLogout,
  className,
}: HeaderProps) {
  const { theme, setTheme } = useLayoutStore();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  } = useNotificationsStore();

  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6',
        className
      )}
    >
      {/* Left side: Breadcrumbs/Title */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {breadcrumbs ? (
          <BreadcrumbNav items={breadcrumbs} />
        ) : title ? (
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        ) : null}
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex flex-1 justify-center px-4">
        <SearchBar onSearch={onSearch} onOpenCommandPalette={onOpenCommandPalette} />
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {actions}
        <HealthIndicator status={healthStatus} onClick={onHealthClick} />
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClear={clearAll}
        />
        <ThemeToggle theme={theme} onThemeChange={setTheme} />
        <UserMenu user={user} onSettings={onSettings} onLogout={onLogout} />
      </div>
    </header>
  );
}

export default Header;
