/**
 * Obsidian Property Visualizer
 *
 * Extracts, analyzes, and visualizes properties from Obsidian notes.
 * Provides interactive dashboards, filtering, and search capabilities.
 *
 * @module PropertyVisualizer
 * @author Weave-NN Development Team
 * @version 1.0.0
 */

/**
 * Property type definitions
 * @enum {string}
 */
const PropertyType = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  BOOLEAN: 'boolean',
  LIST: 'list',
  OBJECT: 'object',
  TAG: 'tag',
  LINK: 'link'
};

/**
 * Visualization types
 * @enum {string}
 */
const VisualizationType = {
  TABLE: 'table',
  GRAPH: 'graph',
  TIMELINE: 'timeline',
  HEATMAP: 'heatmap',
  TREEMAP: 'treemap',
  NETWORK: 'network',
  CHART: 'chart'
};

/**
 * PropertyVisualizer - Main class for property extraction and visualization
 *
 * @class
 * @example
 * const visualizer = new PropertyVisualizer({
 *   client: obsidianClient,
 *   cacheEnabled: true
 * });
 *
 * const properties = await visualizer.extractProperties();
 * const dashboard = visualizer.createDashboard(properties);
 */
class PropertyVisualizer {
  /**
   * Create a Property Visualizer
   *
   * @param {Object} config - Configuration object
   * @param {Object} config.client - ObsidianAPIClient instance
   * @param {boolean} [config.cacheEnabled=true] - Enable property caching
   * @param {number} [config.cacheTTL=300000] - Cache TTL in milliseconds (5 min default)
   * @param {Function} [config.customParser] - Custom property parser function
   * @param {Object} [config.visualizationDefaults] - Default visualization settings
   */
  constructor(config) {
    if (!config || !config.client) {
      throw new Error('ObsidianAPIClient instance is required');
    }

    this.client = config.client;
    this.config = {
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 300000,
      customParser: config.customParser || null,
      visualizationDefaults: config.visualizationDefaults || {},
      ...config
    };

    // Cache storage
    this.cache = {
      properties: null,
      extractedAt: null,
      notes: new Map()
    };

    // Property schema registry
    this.propertySchemas = new Map();

    // Filters and search state
    this.activeFilters = [];
    this.searchQuery = null;
  }

  /**
   * Extract properties from all notes
   *
   * @param {Object} [options] - Extraction options
   * @param {boolean} [options.useCache=true] - Use cached data if available
   * @param {string[]} [options.paths] - Limit extraction to specific paths
   * @param {string[]} [options.propertyNames] - Extract only specific properties
   * @returns {Promise<Object>} Extracted properties data
   */
  async extractProperties(options = {}) {
    const useCache = options.useCache !== false;

    // Check cache
    if (useCache && this.isCacheValid()) {
      return this.cache.properties;
    }

    try {
      // Get all notes
      const notes = await this.client.getNotes(
        options.paths ? { path: options.paths } : {}
      );

      // Extract properties from each note
      const allProperties = new Map();
      const propertyStats = new Map();

      for (const note of notes) {
        const noteProperties = this.extractFromNote(note);

        // Store in cache
        this.cache.notes.set(note.path, noteProperties);

        // Aggregate properties
        Object.entries(noteProperties).forEach(([key, value]) => {
          if (options.propertyNames && !options.propertyNames.includes(key)) {
            return;
          }

          if (!allProperties.has(key)) {
            allProperties.set(key, []);
            propertyStats.set(key, {
              count: 0,
              type: this.inferPropertyType(value),
              values: new Set()
            });
          }

          allProperties.get(key).push({
            notePath: note.path,
            value: value
          });

          const stats = propertyStats.get(key);
          stats.count++;
          stats.values.add(JSON.stringify(value));
        });
      }

      // Build result
      const result = {
        totalNotes: notes.length,
        totalProperties: allProperties.size,
        properties: Object.fromEntries(allProperties),
        statistics: Object.fromEntries(
          Array.from(propertyStats.entries()).map(([key, stats]) => [
            key,
            {
              count: stats.count,
              type: stats.type,
              uniqueValues: stats.values.size
            }
          ])
        ),
        extractedAt: Date.now()
      };

      // Update cache
      if (this.config.cacheEnabled) {
        this.cache.properties = result;
        this.cache.extractedAt = Date.now();
      }

      return result;

    } catch (error) {
      throw new Error(`Property extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract properties from a single note
   *
   * @private
   * @param {Object} note - Note object
   * @returns {Object} Extracted properties
   */
  extractFromNote(note) {
    const properties = {};

    // Use custom parser if provided
    if (this.config.customParser) {
      return this.config.customParser(note);
    }

    // Extract frontmatter
    if (note.frontmatter) {
      Object.assign(properties, note.frontmatter);
    }

    // Extract tags
    if (note.tags && note.tags.length > 0) {
      properties.tags = note.tags;
    }

    // Extract inline properties (Obsidian format: property:: value)
    const inlinePropertyRegex = /^(\w+)::\s*(.+)$/gm;
    let match;

    while ((match = inlinePropertyRegex.exec(note.content || '')) !== null) {
      const [, key, value] = match;
      properties[key] = this.parsePropertyValue(value.trim());
    }

    // Add metadata
    properties._meta = {
      path: note.path,
      created: note.createdAt,
      modified: note.modifiedAt,
      size: note.content?.length || 0
    };

    return properties;
  }

  /**
   * Parse property value to appropriate type
   *
   * @private
   * @param {string} value - Raw property value
   * @returns {any} Parsed value
   */
  parsePropertyValue(value) {
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch (e) {
      // Not JSON, continue parsing
    }

    // Check for boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Check for number
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      return num;
    }

    // Check for date
    const date = Date.parse(value);
    if (!isNaN(date)) {
      return new Date(date);
    }

    // Check for list (comma-separated)
    if (value.includes(',')) {
      return value.split(',').map(v => v.trim());
    }

    // Default to string
    return value;
  }

  /**
   * Infer property type from value
   *
   * @private
   * @param {any} value - Property value
   * @returns {string} Property type
   */
  inferPropertyType(value) {
    if (Array.isArray(value)) return PropertyType.LIST;
    if (value instanceof Date) return PropertyType.DATE;
    if (typeof value === 'boolean') return PropertyType.BOOLEAN;
    if (typeof value === 'number') return PropertyType.NUMBER;
    if (typeof value === 'object' && value !== null) return PropertyType.OBJECT;
    if (typeof value === 'string') {
      if (value.startsWith('#')) return PropertyType.TAG;
      if (value.startsWith('[[') && value.endsWith(']]')) return PropertyType.LINK;
      return PropertyType.TEXT;
    }
    return PropertyType.TEXT;
  }

  /**
   * Check if cache is valid
   *
   * @private
   * @returns {boolean} True if cache is valid
   */
  isCacheValid() {
    if (!this.config.cacheEnabled || !this.cache.properties) {
      return false;
    }

    const age = Date.now() - this.cache.extractedAt;
    return age < this.config.cacheTTL;
  }

  /**
   * Create a dashboard from extracted properties
   *
   * @param {Object} properties - Extracted properties data
   * @param {Object} [options] - Dashboard options
   * @param {string[]} [options.includeProperties] - Properties to include
   * @param {string[]} [options.excludeProperties] - Properties to exclude
   * @param {string} [options.visualizationType=TABLE] - Default visualization type
   * @returns {Object} Dashboard configuration
   */
  createDashboard(properties, options = {}) {
    const {
      includeProperties,
      excludeProperties,
      visualizationType = VisualizationType.TABLE
    } = options;

    const dashboard = {
      id: `dashboard-${Date.now()}`,
      createdAt: Date.now(),
      widgets: [],
      metadata: {
        totalNotes: properties.totalNotes,
        totalProperties: properties.totalProperties
      }
    };

    // Create widgets for each property
    Object.entries(properties.statistics).forEach(([propertyName, stats]) => {
      // Apply filters
      if (includeProperties && !includeProperties.includes(propertyName)) {
        return;
      }

      if (excludeProperties && excludeProperties.includes(propertyName)) {
        return;
      }

      const widget = this.createWidget(
        propertyName,
        stats,
        properties.properties[propertyName],
        visualizationType
      );

      dashboard.widgets.push(widget);
    });

    return dashboard;
  }

  /**
   * Create a visualization widget for a property
   *
   * @private
   * @param {string} propertyName - Property name
   * @param {Object} stats - Property statistics
   * @param {Array} data - Property data
   * @param {string} visualizationType - Visualization type
   * @returns {Object} Widget configuration
   */
  createWidget(propertyName, stats, data, visualizationType) {
    const widget = {
      id: `widget-${propertyName}-${Date.now()}`,
      propertyName,
      type: visualizationType,
      statistics: stats,
      data: this.prepareVisualizationData(data, stats.type),
      config: {
        ...this.config.visualizationDefaults,
        title: propertyName,
        type: stats.type
      }
    };

    // Add type-specific configuration
    switch (stats.type) {
      case PropertyType.NUMBER:
        widget.config.aggregations = this.calculateAggregations(data);
        break;

      case PropertyType.DATE:
        widget.config.timeRange = this.calculateTimeRange(data);
        break;

      case PropertyType.TAG:
      case PropertyType.LIST:
        widget.config.distribution = this.calculateDistribution(data);
        break;
    }

    return widget;
  }

  /**
   * Prepare data for visualization
   *
   * @private
   * @param {Array} data - Raw property data
   * @param {string} propertyType - Property type
   * @returns {Array} Prepared visualization data
   */
  prepareVisualizationData(data, propertyType) {
    return data.map(item => ({
      notePath: item.notePath,
      value: item.value,
      displayValue: this.formatDisplayValue(item.value, propertyType)
    }));
  }

  /**
   * Format value for display
   *
   * @private
   * @param {any} value - Value to format
   * @param {string} type - Property type
   * @returns {string} Formatted value
   */
  formatDisplayValue(value, type) {
    if (value === null || value === undefined) return '';

    switch (type) {
      case PropertyType.DATE:
        return value instanceof Date
          ? value.toLocaleDateString()
          : new Date(value).toLocaleDateString();

      case PropertyType.BOOLEAN:
        return value ? 'Yes' : 'No';

      case PropertyType.LIST:
        return Array.isArray(value) ? value.join(', ') : String(value);

      case PropertyType.OBJECT:
        return JSON.stringify(value, null, 2);

      default:
        return String(value);
    }
  }

  /**
   * Calculate aggregations for numeric properties
   *
   * @private
   * @param {Array} data - Property data
   * @returns {Object} Aggregations (sum, avg, min, max)
   */
  calculateAggregations(data) {
    const values = data
      .map(item => Number(item.value))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
    }

    return {
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  /**
   * Calculate time range for date properties
   *
   * @private
   * @param {Array} data - Property data
   * @returns {Object} Time range (earliest, latest, span)
   */
  calculateTimeRange(data) {
    const dates = data
      .map(item => new Date(item.value))
      .filter(d => !isNaN(d.getTime()));

    if (dates.length === 0) {
      return { earliest: null, latest: null, span: 0 };
    }

    const timestamps = dates.map(d => d.getTime());
    const earliest = new Date(Math.min(...timestamps));
    const latest = new Date(Math.max(...timestamps));

    return {
      earliest: earliest.toISOString(),
      latest: latest.toISOString(),
      span: latest.getTime() - earliest.getTime()
    };
  }

  /**
   * Calculate distribution for categorical properties
   *
   * @private
   * @param {Array} data - Property data
   * @returns {Object} Distribution map
   */
  calculateDistribution(data) {
    const distribution = new Map();

    data.forEach(item => {
      const values = Array.isArray(item.value) ? item.value : [item.value];

      values.forEach(val => {
        const key = String(val);
        distribution.set(key, (distribution.get(key) || 0) + 1);
      });
    });

    return Object.fromEntries(
      Array.from(distribution.entries())
        .sort((a, b) => b[1] - a[1])
    );
  }

  /**
   * Add filter to active filters
   *
   * @param {Object} filter - Filter definition
   * @param {string} filter.property - Property name to filter
   * @param {string} filter.operator - Filter operator (equals, contains, gt, lt, etc.)
   * @param {any} filter.value - Filter value
   * @returns {PropertyVisualizer} This instance for chaining
   */
  addFilter(filter) {
    if (!filter.property || !filter.operator) {
      throw new Error('Filter must have property and operator');
    }

    this.activeFilters.push({
      id: `filter-${Date.now()}`,
      ...filter,
      createdAt: Date.now()
    });

    return this;
  }

  /**
   * Remove filter by ID
   *
   * @param {string} filterId - Filter ID to remove
   * @returns {PropertyVisualizer} This instance for chaining
   */
  removeFilter(filterId) {
    this.activeFilters = this.activeFilters.filter(f => f.id !== filterId);
    return this;
  }

  /**
   * Clear all filters
   *
   * @returns {PropertyVisualizer} This instance for chaining
   */
  clearFilters() {
    this.activeFilters = [];
    return this;
  }

  /**
   * Apply filters to property data
   *
   * @param {Object} properties - Properties data to filter
   * @returns {Object} Filtered properties data
   */
  applyFilters(properties) {
    if (this.activeFilters.length === 0) {
      return properties;
    }

    const filtered = { ...properties };

    this.activeFilters.forEach(filter => {
      const propertyData = filtered.properties[filter.property];

      if (!propertyData) return;

      filtered.properties[filter.property] = propertyData.filter(item =>
        this.evaluateFilter(item.value, filter)
      );
    });

    return filtered;
  }

  /**
   * Evaluate filter condition
   *
   * @private
   * @param {any} value - Value to test
   * @param {Object} filter - Filter definition
   * @returns {boolean} True if value passes filter
   */
  evaluateFilter(value, filter) {
    switch (filter.operator) {
      case 'equals':
        return value === filter.value;

      case 'contains':
        return String(value).includes(String(filter.value));

      case 'gt':
        return Number(value) > Number(filter.value);

      case 'lt':
        return Number(value) < Number(filter.value);

      case 'gte':
        return Number(value) >= Number(filter.value);

      case 'lte':
        return Number(value) <= Number(filter.value);

      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);

      default:
        return true;
    }
  }

  /**
   * Search properties by query
   *
   * @param {string} query - Search query
   * @param {Object} properties - Properties data to search
   * @returns {Object} Search results
   */
  search(query, properties) {
    if (!query) {
      return properties;
    }

    const searchLower = query.toLowerCase();
    const results = {
      ...properties,
      properties: {}
    };

    Object.entries(properties.properties).forEach(([key, data]) => {
      const matches = data.filter(item => {
        const valueStr = String(item.value).toLowerCase();
        const pathStr = item.notePath.toLowerCase();

        return valueStr.includes(searchLower) ||
               pathStr.includes(searchLower) ||
               key.toLowerCase().includes(searchLower);
      });

      if (matches.length > 0) {
        results.properties[key] = matches;
      }
    });

    return results;
  }

  /**
   * Clear property cache
   */
  clearCache() {
    this.cache = {
      properties: null,
      extractedAt: null,
      notes: new Map()
    };
  }

  /**
   * Export visualization data
   *
   * @param {Object} dashboard - Dashboard to export
   * @param {string} [format='json'] - Export format (json, csv)
   * @returns {string} Exported data
   */
  export(dashboard, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(dashboard, null, 2);

      case 'csv':
        return this.exportToCSV(dashboard);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export dashboard to CSV format
   *
   * @private
   * @param {Object} dashboard - Dashboard to export
   * @returns {string} CSV data
   */
  exportToCSV(dashboard) {
    const rows = [['Property', 'Note Path', 'Value']];

    dashboard.widgets.forEach(widget => {
      widget.data.forEach(item => {
        rows.push([
          widget.propertyName,
          item.notePath,
          item.displayValue
        ]);
      });
    });

    return rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }
}

// Export classes and enums
module.exports = {
  PropertyVisualizer,
  PropertyType,
  VisualizationType
};
