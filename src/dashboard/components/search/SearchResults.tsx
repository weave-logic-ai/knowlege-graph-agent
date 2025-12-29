/**
 * SearchResults Component
 *
 * Display search results grouped by type with highlighted matches and pagination.
 */

'use client';

import * as React from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  FileText,
  GitBranch,
  Bot,
  Clock,
  ChevronRight,
  Loader2,
  Search,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { SearchResult, SearchResponse, SearchHighlight, NodeType } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface SearchResultsProps {
  query: string;
  mode?: 'fulltext' | 'semantic' | 'hybrid';
  filters?: {
    types?: string[];
    statuses?: string[];
    tags?: string[];
  };
  groupByType?: boolean;
  showPreview?: boolean;
  onResultClick?: (result: SearchResult) => void;
  onResultPreview?: (result: SearchResult) => void;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const RESULT_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  node: { icon: FileText, label: 'Nodes', color: 'text-blue-600 dark:text-blue-400' },
  workflow: { icon: GitBranch, label: 'Workflows', color: 'text-green-600 dark:text-green-400' },
  agent: { icon: Bot, label: 'Agents', color: 'text-purple-600 dark:text-purple-400' },
  event: { icon: Clock, label: 'Events', color: 'text-orange-600 dark:text-orange-400' },
};

const NODE_TYPE_COLORS: Record<NodeType, string> = {
  concept: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  technical: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  feature: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  primitive: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  service: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  guide: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  standard: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  integration: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
};

// ============================================================================
// Mock API Function (replace with actual API call)
// ============================================================================

async function fetchSearchResults(
  query: string,
  mode: string,
  filters: Record<string, unknown>,
  cursor?: string
): Promise<SearchResponse> {
  // Mock implementation - replace with actual API call
  // Example: return fetch(`/api/search?q=${query}&mode=${mode}&cursor=${cursor}`).then(r => r.json());

  if (!query || query.length < 2) {
    return {
      results: [],
      totalCount: 0,
      query,
      took: 0,
      mode: mode as 'fulltext',
      hasMore: false,
    };
  }

  await new Promise((resolve) => setTimeout(resolve, 300));

  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'node',
      nodeType: 'technical',
      title: `${query} - Component Architecture`,
      description: 'Technical documentation covering the main component architecture patterns and best practices.',
      path: '/docs/architecture/components.md',
      score: 0.95,
      highlights: [
        {
          field: 'content',
          fragments: [
            `The <mark>${query}</mark> component follows a modular design pattern...`,
            `When implementing <mark>${query}</mark> functionality, consider...`,
          ],
        },
      ],
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      type: 'node',
      nodeType: 'concept',
      title: `Understanding ${query}`,
      description: 'A comprehensive guide to understanding the core concepts.',
      path: '/docs/concepts/overview.md',
      score: 0.88,
      highlights: [
        {
          field: 'content',
          fragments: [
            `<mark>${query}</mark> is a fundamental concept that...`,
          ],
        },
      ],
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      type: 'workflow',
      title: `Deploy ${query} Service`,
      description: 'Automated workflow for deploying the service.',
      score: 0.75,
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: '4',
      type: 'agent',
      title: `${query} Analyzer Agent`,
      description: 'Specialized agent for analyzing and processing data.',
      score: 0.72,
    },
    {
      id: '5',
      type: 'node',
      nodeType: 'guide',
      title: `Getting Started with ${query}`,
      description: 'Step-by-step guide for beginners.',
      path: '/docs/guides/getting-started.md',
      score: 0.68,
      highlights: [
        {
          field: 'content',
          fragments: [
            `This guide will help you get started with <mark>${query}</mark>...`,
          ],
        },
      ],
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ];

  const pageSize = 10;
  const cursorIndex = cursor ? parseInt(cursor, 10) : 0;
  const results = mockResults.slice(cursorIndex, cursorIndex + pageSize);

  return {
    results,
    totalCount: mockResults.length,
    query,
    took: 42,
    mode: mode as 'fulltext',
    hasMore: cursorIndex + pageSize < mockResults.length,
    nextCursor: cursorIndex + pageSize < mockResults.length ? String(cursorIndex + pageSize) : undefined,
  };
}

// ============================================================================
// Highlight Component
// ============================================================================

function HighlightedText({ html }: { html: string }) {
  // Safely render HTML with highlighted matches
  return (
    <span
      className="text-sm text-gray-600 dark:text-gray-400 [&_mark]:bg-yellow-200 dark:[&_mark]:bg-yellow-800/50 [&_mark]:px-0.5 [&_mark]:rounded"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ============================================================================
// Result Card Component
// ============================================================================

function ResultCard({
  result,
  showPreview,
  onClick,
  onPreview,
}: {
  result: SearchResult;
  showPreview?: boolean;
  onClick?: () => void;
  onPreview?: () => void;
}) {
  const config = RESULT_TYPE_CONFIG[result.type];
  const Icon = config?.icon || FileText;

  return (
    <div
      className={cn(
        'group relative p-4 rounded-lg border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-800/50',
        'hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm',
        'transition-all cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            'bg-gray-100 dark:bg-gray-700',
            config?.color
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {result.title}
              </h3>
              {result.path && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {result.path}
                </p>
              )}
            </div>

            {/* Score badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {result.nodeType && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    NODE_TYPE_COLORS[result.nodeType]
                  )}
                >
                  {result.nodeType}
                </span>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(result.score * 100)}%
              </span>
            </div>
          </div>

          {/* Description */}
          {result.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {result.description}
            </p>
          )}

          {/* Highlights */}
          {result.highlights && result.highlights.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.highlights.slice(0, 2).map((highlight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-gray-400 text-xs mt-0.5">...</span>
                  <HighlightedText html={highlight.fragments[0]} />
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {result.updatedAt && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              Updated {new Date(result.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showPreview && onPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {result.path && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(result.path, '_blank');
              }}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Result Group Component
// ============================================================================

function ResultGroup({
  type,
  results,
  showPreview,
  onResultClick,
  onResultPreview,
}: {
  type: string;
  results: SearchResult[];
  showPreview?: boolean;
  onResultClick?: (result: SearchResult) => void;
  onResultPreview?: (result: SearchResult) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const config = RESULT_TYPE_CONFIG[type];
  const Icon = config?.icon || FileText;

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <ChevronRight
          className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')}
        />
        <Icon className={cn('h-4 w-4', config?.color)} />
        <span>{config?.label || type}</span>
        <span className="text-gray-400">({results.length})</span>
      </button>

      {expanded && (
        <div className="space-y-2 ml-6">
          {results.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              showPreview={showPreview}
              onClick={() => onResultClick?.(result)}
              onPreview={() => onResultPreview?.(result)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SearchResults({
  query,
  mode = 'hybrid',
  filters = {},
  groupByType = true,
  showPreview = true,
  onResultClick,
  onResultPreview,
  className,
}: SearchResultsProps) {
  // Fetch search results with infinite query for pagination
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<SearchResponse>({
    queryKey: ['search', 'results', query, mode, filters],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      fetchSearchResults(query, mode, filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: SearchResponse) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: query.length >= 2,
  });

  // Flatten results from all pages
  const allResults = React.useMemo((): SearchResult[] => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page: SearchResponse) => page.results);
  }, [data]);

  // Group results by type
  const groupedResults = React.useMemo(() => {
    if (!groupByType) return null;

    const groups: Record<string, SearchResult[]> = {};
    for (const result of allResults) {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    }
    return groups;
  }, [allResults, groupByType]);

  const totalCount = data?.pages?.[0]?.totalCount ?? 0;
  const took = data?.pages?.[0]?.took ?? 0;

  // Loading state
  if (isLoading && query.length >= 2) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Empty state
  if (query.length >= 2 && !isLoading && allResults.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          No results found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          No matches for "{query}". Try different keywords or filters.
        </p>
      </div>
    );
  }

  // Query too short
  if (query.length < 2) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter at least 2 characters to search
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Results header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Found <span className="font-medium">{totalCount}</span> results
          {took > 0 && <span className="ml-1">({took}ms)</span>}
        </div>
        {isFetching && !isFetchingNextPage && (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        )}
      </div>

      {/* Results list */}
      {groupByType && groupedResults ? (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([type, results]) => (
            <ResultGroup
              key={type}
              type={type}
              results={results}
              showPreview={showPreview}
              onResultClick={onResultClick}
              onResultPreview={onResultPreview}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {allResults.map((result) => (
            <ResultCard
              key={result.id}
              result={result}
              showPreview={showPreview}
              onClick={() => onResultClick?.(result)}
              onPreview={() => onResultPreview?.(result)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md',
              'border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800',
              'text-gray-700 dark:text-gray-300',
              'hover:bg-gray-50 dark:hover:bg-gray-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more results'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchResults;
