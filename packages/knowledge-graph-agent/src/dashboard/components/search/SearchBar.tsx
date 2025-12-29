/**
 * SearchBar Component
 *
 * Global search with debounced input, suggestions, recent searches, and keyboard shortcuts.
 */

'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  X,
  Clock,
  FileText,
  Tag,
  Hash,
  Command,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDebounce } from '../../hooks/use-debounce';
import { useKeyboardShortcut, formatShortcut } from '../../hooks/use-keyboard-shortcut';
import { useLocalStorage } from '../../hooks/use-local-storage';
import type { SearchSuggestion } from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface SearchBarProps {
  onSearch?: (query: string) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  showShortcut?: boolean;
  autoFocus?: boolean;
  className?: string;
}

interface SuggestionsApiResponse {
  suggestions: SearchSuggestion[];
}

// ============================================================================
// Constants
// ============================================================================

const MAX_RECENT_SEARCHES = 5;
const SUGGESTION_TYPES_ICONS: Record<string, React.ElementType> = {
  node: FileText,
  tag: Tag,
  type: Hash,
  recent: Clock,
  command: Command,
};

// ============================================================================
// Mock API Function (replace with actual API call)
// ============================================================================

async function fetchSuggestions(query: string): Promise<SuggestionsApiResponse> {
  // Mock implementation - replace with actual API call
  // Example: return fetch(`/api/search/suggest?q=${query}`).then(r => r.json());

  if (!query || query.length < 2) {
    return { suggestions: [] };
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  const mockSuggestions: SearchSuggestion[] = [
    {
      id: '1',
      type: 'node',
      label: `${query} - Component Architecture`,
      description: 'Technical documentation for component architecture',
      href: '/dashboard/graph/nodes/1',
    },
    {
      id: '2',
      type: 'node',
      label: `${query} - API Design`,
      description: 'API design patterns and best practices',
      href: '/dashboard/graph/nodes/2',
    },
    {
      id: '3',
      type: 'tag',
      label: `#${query}`,
      description: '12 nodes with this tag',
    },
    {
      id: '4',
      type: 'type',
      label: `Type: ${query}`,
      description: 'Filter by node type',
    },
  ];

  return {
    suggestions: mockSuggestions.filter((s) =>
      s.label.toLowerCase().includes(query.toLowerCase())
    ),
  };
}

// ============================================================================
// Suggestion Item Component
// ============================================================================

function SuggestionItem({
  suggestion,
  isSelected,
  onClick,
}: {
  suggestion: SearchSuggestion;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = SUGGESTION_TYPES_ICONS[suggestion.type] || FileText;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors',
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-md',
          suggestion.type === 'recent'
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {suggestion.label}
        </div>
        {suggestion.description && (
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {suggestion.description}
          </div>
        )}
      </div>

      {suggestion.href && (
        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
      )}
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SearchBar({
  onSearch,
  onSuggestionSelect,
  placeholder = 'Search nodes, tags, types...',
  showShortcut = true,
  autoFocus = false,
  className,
}: SearchBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // State
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
    'kg-recent-searches',
    []
  );

  // Debounced query for API calls
  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions
  const { data: suggestionsData, isLoading } = useQuery({
    queryKey: ['search', 'suggestions', debouncedQuery],
    queryFn: () => fetchSuggestions(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000,
  });

  // Build suggestions list with recent searches
  const suggestions = React.useMemo((): SearchSuggestion[] => {
    const items: SearchSuggestion[] = [];

    // Add recent searches if query is empty
    if (!query && recentSearches.length > 0) {
      items.push(
        ...recentSearches.slice(0, MAX_RECENT_SEARCHES).map((search, index) => ({
          id: `recent-${index}`,
          type: 'recent' as const,
          label: search,
        }))
      );
    }

    // Add API suggestions
    if (suggestionsData?.suggestions) {
      items.push(...suggestionsData.suggestions);
    }

    return items;
  }, [query, recentSearches, suggestionsData]);

  // Handle search submission
  const handleSubmit = React.useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      // Add to recent searches
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s !== searchQuery);
        return [searchQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      });

      onSearch?.(searchQuery);
      setIsOpen(false);
    },
    [onSearch, setRecentSearches]
  );

  // Handle suggestion selection
  const handleSelectSuggestion = React.useCallback(
    (suggestion: SearchSuggestion) => {
      if (suggestion.type === 'recent') {
        setQuery(suggestion.label);
        handleSubmit(suggestion.label);
      } else if (suggestion.action) {
        suggestion.action();
        setIsOpen(false);
      } else {
        onSuggestionSelect?.(suggestion);
        setIsOpen(false);
      }
    },
    [handleSubmit, onSuggestionSelect]
  );

  // Keyboard navigation
  useKeyboardShortcut(
    { key: 'k', metaKey: true },
    () => {
      inputRef.current?.focus();
      setIsOpen(true);
    }
  );

  // Handle input keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          handleSubmit(query);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Close on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when suggestions change
  React.useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'w-full pl-10 pr-20 py-2.5 text-sm rounded-lg',
            'border border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-gray-100',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          )}
        />

        {/* Right side: loading, clear, or shortcut */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}

          {showShortcut && !query && (
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
              {formatShortcut({ key: 'k', metaKey: true })}
            </kbd>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {isOpen && (suggestions.length > 0 || query.length >= 2) && (
        <div
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
            'border border-gray-200 dark:border-gray-700',
            'overflow-hidden'
          )}
        >
          {suggestions.length > 0 ? (
            <div className="py-2 max-h-96 overflow-y-auto">
              {/* Recent searches header */}
              {!query && suggestions.some((s) => s.type === 'recent') && (
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recent Searches
                </div>
              )}

              {suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  isSelected={index === selectedIndex}
                  onClick={() => handleSelectSuggestion(suggestion)}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                <div>
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{query}"</p>
                </div>
              )}
            </div>
          )}

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
                  <ArrowRight className="h-3 w-3 -rotate-90" />
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">
                  <ArrowRight className="h-3 w-3 rotate-90" />
                </kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">Enter</kbd>
                to select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">Esc</kbd>
                to close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
