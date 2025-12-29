/**
 * Search State Store (Zustand)
 *
 * Manages client-side search state:
 * - Search query and history
 * - Filters
 * - Recent searches
 * - Results cache
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  NodeType,
  NodeStatus,
  SearchMode,
  SearchResult,
  VectorSearchResult
} from '../lib/api/types.js';

// Recent search entry
export interface RecentSearch {
  id: string;
  query: string;
  mode: SearchMode;
  timestamp: number;
  resultCount: number;
}

// Search filters
export interface SearchFiltersState {
  types: NodeType[];
  statuses: NodeStatus[];
  tags: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  includeContent: boolean;
}

// Cached search result
export interface CachedSearchResult {
  query: string;
  mode: SearchMode;
  filters: SearchFiltersState;
  results: SearchResult[];
  totalCount: number;
  timestamp: number;
}

// Cached vector search result
export interface CachedVectorResult {
  query: string;
  results: VectorSearchResult[];
  timestamp: number;
}

// Search state interface
export interface SearchState {
  // Current search
  query: string;
  mode: SearchMode;
  filters: SearchFiltersState;

  // Recent searches
  recentSearches: RecentSearch[];

  // Results cache
  searchCache: Map<string, CachedSearchResult>;
  vectorCache: Map<string, CachedVectorResult>;

  // UI state
  isSearching: boolean;
  searchFocused: boolean;
  suggestionsVisible: boolean;
  suggestions: string[];
}

// Actions interface
export interface SearchActions {
  // Query actions
  setQuery: (query: string) => void;
  clearQuery: () => void;

  // Mode actions
  setMode: (mode: SearchMode) => void;

  // Filter actions
  setFilters: (filters: Partial<SearchFiltersState>) => void;
  addTypeFilter: (type: NodeType) => void;
  removeTypeFilter: (type: NodeType) => void;
  addStatusFilter: (status: NodeStatus) => void;
  removeStatusFilter: (status: NodeStatus) => void;
  addTagFilter: (tag: string) => void;
  removeTagFilter: (tag: string) => void;
  setDateRange: (start: string | null, end: string | null) => void;
  toggleIncludeContent: () => void;
  clearFilters: () => void;

  // Recent searches actions
  addRecentSearch: (search: Omit<RecentSearch, 'id' | 'timestamp'>) => void;
  removeRecentSearch: (id: string) => void;
  clearRecentSearches: () => void;

  // Cache actions
  cacheSearchResult: (result: CachedSearchResult) => void;
  getCachedSearchResult: (query: string, mode: SearchMode, filters: SearchFiltersState) => CachedSearchResult | null;
  cacheVectorResult: (result: CachedVectorResult) => void;
  getCachedVectorResult: (query: string) => CachedVectorResult | null;
  clearCache: () => void;

  // UI state actions
  setIsSearching: (searching: boolean) => void;
  setSearchFocused: (focused: boolean) => void;
  setSuggestionsVisible: (visible: boolean) => void;
  setSuggestions: (suggestions: string[]) => void;

  // Combined actions
  executeSearch: (query: string, mode?: SearchMode) => void;
  reset: () => void;
}

// Generate cache key
function getCacheKey(query: string, mode: SearchMode, filters: SearchFiltersState): string {
  return JSON.stringify({ query, mode, filters });
}

// Cache expiry time (5 minutes)
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

// Max recent searches
const MAX_RECENT_SEARCHES = 20;

// Max cache size
const MAX_CACHE_SIZE = 100;

// Default filters
const defaultFilters: SearchFiltersState = {
  types: [],
  statuses: [],
  tags: [],
  dateRange: {
    start: null,
    end: null,
  },
  includeContent: true,
};

// Initial state
const initialState: SearchState = {
  query: '',
  mode: 'hybrid',
  filters: { ...defaultFilters },
  recentSearches: [],
  searchCache: new Map(),
  vectorCache: new Map(),
  isSearching: false,
  searchFocused: false,
  suggestionsVisible: false,
  suggestions: [],
};

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Create the store with persistence
export const useSearchStore = create<SearchState & SearchActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Query actions
      setQuery: (query) => set({ query }),

      clearQuery: () => set({ query: '', suggestions: [], suggestionsVisible: false }),

      // Mode actions
      setMode: (mode) => set({ mode }),

      // Filter actions
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters },
      })),

      addTypeFilter: (type) => set((state) => ({
        filters: {
          ...state.filters,
          types: state.filters.types.includes(type)
            ? state.filters.types
            : [...state.filters.types, type],
        },
      })),

      removeTypeFilter: (type) => set((state) => ({
        filters: {
          ...state.filters,
          types: state.filters.types.filter(t => t !== type),
        },
      })),

      addStatusFilter: (status) => set((state) => ({
        filters: {
          ...state.filters,
          statuses: state.filters.statuses.includes(status)
            ? state.filters.statuses
            : [...state.filters.statuses, status],
        },
      })),

      removeStatusFilter: (status) => set((state) => ({
        filters: {
          ...state.filters,
          statuses: state.filters.statuses.filter(s => s !== status),
        },
      })),

      addTagFilter: (tag) => set((state) => ({
        filters: {
          ...state.filters,
          tags: state.filters.tags.includes(tag)
            ? state.filters.tags
            : [...state.filters.tags, tag],
        },
      })),

      removeTagFilter: (tag) => set((state) => ({
        filters: {
          ...state.filters,
          tags: state.filters.tags.filter(t => t !== tag),
        },
      })),

      setDateRange: (start, end) => set((state) => ({
        filters: {
          ...state.filters,
          dateRange: { start, end },
        },
      })),

      toggleIncludeContent: () => set((state) => ({
        filters: {
          ...state.filters,
          includeContent: !state.filters.includeContent,
        },
      })),

      clearFilters: () => set({ filters: { ...defaultFilters } }),

      // Recent searches actions
      addRecentSearch: (search) => set((state) => {
        // Remove duplicate if exists
        const filtered = state.recentSearches.filter(
          s => s.query !== search.query || s.mode !== search.mode
        );

        const newSearch: RecentSearch = {
          ...search,
          id: generateId(),
          timestamp: Date.now(),
        };

        return {
          recentSearches: [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES),
        };
      }),

      removeRecentSearch: (id) => set((state) => ({
        recentSearches: state.recentSearches.filter(s => s.id !== id),
      })),

      clearRecentSearches: () => set({ recentSearches: [] }),

      // Cache actions
      cacheSearchResult: (result) => set((state) => {
        const key = getCacheKey(result.query, result.mode, result.filters);
        const newCache = new Map(state.searchCache);

        // Evict oldest entries if cache is full
        if (newCache.size >= MAX_CACHE_SIZE) {
          const entries = Array.from(newCache.entries());
          entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
          entries.slice(0, newCache.size - MAX_CACHE_SIZE + 1).forEach(([k]) => {
            newCache.delete(k);
          });
        }

        newCache.set(key, result);
        return { searchCache: newCache };
      }),

      getCachedSearchResult: (query, mode, filters) => {
        const key = getCacheKey(query, mode, filters);
        const cached = get().searchCache.get(key);

        if (!cached) return null;

        // Check if cache is expired
        if (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
          // Remove expired entry
          const newCache = new Map(get().searchCache);
          newCache.delete(key);
          set({ searchCache: newCache });
          return null;
        }

        return cached;
      },

      cacheVectorResult: (result) => set((state) => {
        const newCache = new Map(state.vectorCache);

        // Evict oldest entries if cache is full
        if (newCache.size >= MAX_CACHE_SIZE) {
          const entries = Array.from(newCache.entries());
          entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
          entries.slice(0, newCache.size - MAX_CACHE_SIZE + 1).forEach(([k]) => {
            newCache.delete(k);
          });
        }

        newCache.set(result.query, result);
        return { vectorCache: newCache };
      }),

      getCachedVectorResult: (query) => {
        const cached = get().vectorCache.get(query);

        if (!cached) return null;

        // Check if cache is expired
        if (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
          const newCache = new Map(get().vectorCache);
          newCache.delete(query);
          set({ vectorCache: newCache });
          return null;
        }

        return cached;
      },

      clearCache: () => set({
        searchCache: new Map(),
        vectorCache: new Map(),
      }),

      // UI state actions
      setIsSearching: (searching) => set({ isSearching: searching }),

      setSearchFocused: (focused) => set({ searchFocused: focused }),

      setSuggestionsVisible: (visible) => set({ suggestionsVisible: visible }),

      setSuggestions: (suggestions) => set({ suggestions }),

      // Combined actions
      executeSearch: (query, mode) => {
        const state = get();
        set({
          query,
          mode: mode ?? state.mode,
          isSearching: true,
          suggestionsVisible: false,
        });
      },

      reset: () => set({
        query: '',
        mode: 'hybrid',
        filters: { ...defaultFilters },
        isSearching: false,
        searchFocused: false,
        suggestionsVisible: false,
        suggestions: [],
      }),
    }),
    {
      name: 'kg-search-state',
      storage: createJSONStorage(() => localStorage),
      // Only persist recent searches and mode preference
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        mode: state.mode,
        filters: state.filters,
      }),
      // Custom serialization - don't persist cache (Map objects)
      serialize: (state) => JSON.stringify({
        ...state.state,
        searchCache: undefined,
        vectorCache: undefined,
      }),
      deserialize: (str) => {
        const parsed = JSON.parse(str);
        return {
          ...parsed,
          searchCache: new Map(),
          vectorCache: new Map(),
        };
      },
    }
  )
);

// Selector hooks for performance
export const useSearchQuery = () => useSearchStore((state) => state.query);
export const useSearchMode = () => useSearchStore((state) => state.mode);
export const useSearchFilters = () => useSearchStore((state) => state.filters);
export const useRecentSearches = () => useSearchStore((state) => state.recentSearches);
export const useIsSearching = () => useSearchStore((state) => state.isSearching);
export const useSearchSuggestions = () => useSearchStore((state) => ({
  suggestions: state.suggestions,
  visible: state.suggestionsVisible,
}));

// Action hooks
export const useSearchActions = () => {
  const store = useSearchStore();
  return {
    setQuery: store.setQuery,
    clearQuery: store.clearQuery,
    setMode: store.setMode,
    setFilters: store.setFilters,
    addTypeFilter: store.addTypeFilter,
    removeTypeFilter: store.removeTypeFilter,
    addTagFilter: store.addTagFilter,
    removeTagFilter: store.removeTagFilter,
    clearFilters: store.clearFilters,
    addRecentSearch: store.addRecentSearch,
    removeRecentSearch: store.removeRecentSearch,
    clearRecentSearches: store.clearRecentSearches,
    executeSearch: store.executeSearch,
    reset: store.reset,
  };
};
