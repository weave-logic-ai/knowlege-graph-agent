/**
 * Obsidian REST API Client
 *
 * Provides a robust interface for interacting with Obsidian's REST API.
 * Includes authentication, error handling, retry logic, and request/response interceptors.
 *
 * @module ObsidianAPIClient
 * @author Weave-NN Development Team
 * @version 1.0.0
 */

const axios = require('axios');

/**
 * Default configuration for the API client
 */
const DEFAULT_CONFIG = {
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  retryMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

/**
 * ObsidianAPIClient - Main class for Obsidian API interactions
 *
 * @class
 * @example
 * const client = new ObsidianAPIClient({
 *   apiUrl: process.env.OBSIDIAN_API_URL,
 *   apiKey: process.env.OBSIDIAN_API_KEY
 * });
 *
 * const notes = await client.getNotes();
 */
class ObsidianAPIClient {
  /**
   * Create an Obsidian API Client
   *
   * @param {Object} config - Configuration object
   * @param {string} config.apiUrl - Base URL for Obsidian API
   * @param {string} config.apiKey - API authentication key
   * @param {number} [config.timeout=30000] - Request timeout in milliseconds
   * @param {number} [config.maxRetries=3] - Maximum number of retry attempts
   * @param {Function} [config.onRequestStart] - Request interceptor callback
   * @param {Function} [config.onRequestComplete] - Response interceptor callback
   * @param {Function} [config.onRequestError] - Error interceptor callback
   */
  constructor(config) {
    this.validateConfig(config);

    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize axios instance with base configuration
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Setup interceptors
    this.setupInterceptors();
  }

  /**
   * Validate configuration parameters
   *
   * @private
   * @param {Object} config - Configuration object to validate
   * @throws {Error} If configuration is invalid
   */
  validateConfig(config) {
    if (!config) {
      throw new Error('Configuration object is required');
    }

    if (!config.apiUrl) {
      throw new Error('API URL is required in configuration');
    }

    if (!config.apiKey) {
      throw new Error('API Key is required in configuration');
    }

    // Validate URL format
    try {
      new URL(config.apiUrl);
    } catch (error) {
      throw new Error(`Invalid API URL format: ${config.apiUrl}`);
    }
  }

  /**
   * Setup request and response interceptors
   *
   * @private
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.config.onRequestStart) {
          this.config.onRequestStart(config);
        }

        // Log request for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Obsidian API] ${config.method.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        if (this.config.onRequestError) {
          this.config.onRequestError(error);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (this.config.onRequestComplete) {
          this.config.onRequestComplete(response);
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Implement retry logic
        if (this.shouldRetry(error, originalRequest)) {
          return this.retryRequest(originalRequest);
        }

        if (this.config.onRequestError) {
          this.config.onRequestError(error);
        }

        return Promise.reject(this.normalizeError(error));
      }
    );
  }

  /**
   * Determine if request should be retried
   *
   * @private
   * @param {Error} error - Error object from failed request
   * @param {Object} request - Original request configuration
   * @returns {boolean} True if request should be retried
   */
  shouldRetry(error, request) {
    if (!request._retryCount) {
      request._retryCount = 0;
    }

    // Check retry count
    if (request._retryCount >= this.config.maxRetries) {
      return false;
    }

    // Check if error is retryable
    const status = error.response?.status;
    return this.config.retryableStatuses.includes(status) || !status;
  }

  /**
   * Retry failed request with exponential backoff
   *
   * @private
   * @param {Object} request - Original request configuration
   * @returns {Promise} Retried request promise
   */
  async retryRequest(request) {
    request._retryCount = (request._retryCount || 0) + 1;

    const delay = this.config.retryDelay * Math.pow(
      this.config.retryMultiplier,
      request._retryCount - 1
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Obsidian API] Retrying request (${request._retryCount}/${this.config.maxRetries}) after ${delay}ms`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));

    return this.client(request);
  }

  /**
   * Normalize error object for consistent error handling
   *
   * @private
   * @param {Error} error - Raw error object
   * @returns {Error} Normalized error object
   */
  normalizeError(error) {
    const normalizedError = new Error(
      error.response?.data?.message || error.message || 'Unknown error occurred'
    );

    normalizedError.status = error.response?.status;
    normalizedError.statusText = error.response?.statusText;
    normalizedError.data = error.response?.data;
    normalizedError.originalError = error;

    return normalizedError;
  }

  /**
   * Get all notes from Obsidian vault
   *
   * @param {Object} [options] - Query options
   * @param {string} [options.path] - Filter by path
   * @param {string[]} [options.tags] - Filter by tags
   * @param {number} [options.limit] - Limit number of results
   * @param {number} [options.offset] - Offset for pagination
   * @returns {Promise<Array>} Array of note objects
   * @throws {Error} If request fails
   */
  async getNotes(options = {}) {
    try {
      const response = await this.client.get('/notes', {
        params: options
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get notes: ${error.message}`);
    }
  }

  /**
   * Get a single note by path
   *
   * @param {string} path - Note path/ID
   * @returns {Promise<Object>} Note object
   * @throws {Error} If note not found or request fails
   */
  async getNote(path) {
    if (!path) {
      throw new Error('Note path is required');
    }

    try {
      const response = await this.client.get(`/notes/${encodeURIComponent(path)}`);
      return response.data;
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`Note not found: ${path}`);
      }
      throw new Error(`Failed to get note: ${error.message}`);
    }
  }

  /**
   * Create a new note
   *
   * @param {Object} noteData - Note data
   * @param {string} noteData.path - Note path/filename
   * @param {string} noteData.content - Note content (markdown)
   * @param {Object} [noteData.frontmatter] - Frontmatter metadata
   * @param {string[]} [noteData.tags] - Note tags
   * @returns {Promise<Object>} Created note object
   * @throws {Error} If creation fails
   */
  async createNote(noteData) {
    this.validateNoteData(noteData, true);

    try {
      const response = await this.client.post('/notes', noteData);
      return response.data;
    } catch (error) {
      if (error.status === 409) {
        throw new Error(`Note already exists: ${noteData.path}`);
      }
      throw new Error(`Failed to create note: ${error.message}`);
    }
  }

  /**
   * Update an existing note
   *
   * @param {string} path - Note path/ID
   * @param {Object} updates - Update data
   * @param {string} [updates.content] - Updated content
   * @param {Object} [updates.frontmatter] - Updated frontmatter
   * @param {string[]} [updates.tags] - Updated tags
   * @returns {Promise<Object>} Updated note object
   * @throws {Error} If update fails
   */
  async updateNote(path, updates) {
    if (!path) {
      throw new Error('Note path is required');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('Update data is required');
    }

    try {
      const response = await this.client.patch(
        `/notes/${encodeURIComponent(path)}`,
        updates
      );
      return response.data;
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`Note not found: ${path}`);
      }
      throw new Error(`Failed to update note: ${error.message}`);
    }
  }

  /**
   * Delete a note
   *
   * @param {string} path - Note path/ID
   * @param {Object} [options] - Delete options
   * @param {boolean} [options.permanent=false] - Permanently delete (skip trash)
   * @returns {Promise<boolean>} True if deleted successfully
   * @throws {Error} If deletion fails
   */
  async deleteNote(path, options = {}) {
    if (!path) {
      throw new Error('Note path is required');
    }

    try {
      await this.client.delete(`/notes/${encodeURIComponent(path)}`, {
        params: options
      });
      return true;
    } catch (error) {
      if (error.status === 404) {
        throw new Error(`Note not found: ${path}`);
      }
      throw new Error(`Failed to delete note: ${error.message}`);
    }
  }

  /**
   * Search notes by query
   *
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {boolean} [options.caseSensitive=false] - Case-sensitive search
   * @param {boolean} [options.regex=false] - Use regex search
   * @param {string[]} [options.paths] - Limit search to specific paths
   * @returns {Promise<Array>} Array of matching notes
   * @throws {Error} If search fails
   */
  async searchNotes(query, options = {}) {
    if (!query) {
      throw new Error('Search query is required');
    }

    try {
      const response = await this.client.post('/search', {
        query,
        ...options
      });
      return response.data;
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Validate note data
   *
   * @private
   * @param {Object} noteData - Note data to validate
   * @param {boolean} requirePath - Whether path is required
   * @throws {Error} If validation fails
   */
  validateNoteData(noteData, requirePath = false) {
    if (!noteData) {
      throw new Error('Note data is required');
    }

    if (requirePath && !noteData.path) {
      throw new Error('Note path is required');
    }

    if (requirePath && !noteData.content) {
      throw new Error('Note content is required');
    }
  }

  /**
   * Test API connection
   *
   * @returns {Promise<boolean>} True if connection successful
   * @throws {Error} If connection fails
   */
  async testConnection() {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }
}

module.exports = ObsidianAPIClient;
