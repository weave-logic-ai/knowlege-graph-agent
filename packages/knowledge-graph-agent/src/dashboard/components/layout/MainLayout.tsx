/**
 * MainLayout Component
 *
 * Main layout wrapper combining Sidebar, Header, and content area.
 * Features:
 * - Responsive design with mobile sidebar drawer
 * - Collapsible sidebar
 * - Consistent header with navigation
 * - Content area with proper spacing
 * - Support for dark mode via CSS variables
 */

'use client';

import * as React from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLayoutStore } from '../../stores/layout-store';
import type { BreadcrumbItem, HealthStatus } from '../../types';

// ============================================================================
// Mobile Sidebar Overlay
// ============================================================================

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate?: (href: string) => void;
}

function MobileSidebar({ open, onClose, currentPath, onNavigate }: MobileSidebarProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-[280px] animate-in slide-in-from-left duration-300">
        <div className="relative h-full">
          <Sidebar
            collapsed={false}
            currentPath={currentPath}
            onNavigate={(href) => {
              onNavigate?.(href);
              onClose();
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Layout Component
// ============================================================================

export interface MainLayoutProps {
  /** Child content */
  children: React.ReactNode;
  /** Page title */
  title?: string;
  /** Page description */
  description?: string;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Custom header actions */
  actions?: React.ReactNode;
  /** Current active path for navigation highlighting */
  currentPath?: string;
  /** System health status */
  healthStatus?: HealthStatus;
  /** Current user */
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  /** Callbacks */
  onNavigate?: (href: string) => void;
  onSearch?: (query: string) => void;
  onOpenCommandPalette?: () => void;
  onHealthClick?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Content area CSS classes */
  contentClassName?: string;
}

export function MainLayout({
  children,
  title,
  description,
  breadcrumbs,
  actions,
  currentPath = '/dashboard',
  healthStatus = 'healthy',
  user,
  onNavigate,
  onSearch,
  onOpenCommandPalette,
  onHealthClick,
  onSettings,
  onLogout,
  className,
  contentClassName,
}: MainLayoutProps) {
  const {
    sidebarCollapsed,
    mobileSidebarOpen,
    setMobileSidebarOpen,
  } = useLayoutStore();

  const handleOpenMobileSidebar = React.useCallback(() => {
    setMobileSidebarOpen(true);
  }, [setMobileSidebarOpen]);

  const handleCloseMobileSidebar = React.useCallback(() => {
    setMobileSidebarOpen(false);
  }, [setMobileSidebarOpen]);

  return (
    <div className={cn('flex h-screen bg-background', className)}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar
          currentPath={currentPath}
          onNavigate={onNavigate}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={handleCloseMobileSidebar}
        currentPath={currentPath}
        onNavigate={onNavigate}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <Header
          breadcrumbs={breadcrumbs}
          title={title}
          actions={
            <>
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenMobileSidebar}
                className="lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              {actions}
            </>
          }
          healthStatus={healthStatus}
          user={user}
          onSearch={onSearch}
          onOpenCommandPalette={onOpenCommandPalette}
          onHealthClick={onHealthClick}
          onSettings={onSettings}
          onLogout={onLogout}
        />

        {/* Page Content */}
        <main
          className={cn(
            'flex-1 overflow-auto',
            contentClassName
          )}
        >
          {/* Page Header (optional) */}
          {(title || description) && (
            <div className="border-b border-border bg-card px-4 py-6 md:px-6">
              {title && (
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              )}
              {description && (
                <p className="mt-1 text-muted-foreground">{description}</p>
              )}
            </div>
          )}

          {/* Content Area */}
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
