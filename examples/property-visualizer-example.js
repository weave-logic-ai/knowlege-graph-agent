/**
 * Example usage of PropertyVisualizer
 *
 * Demonstrates property extraction, filtering, and dashboard creation.
 */

const ObsidianAPIClient = require('../src/clients/ObsidianAPIClient');
const { PropertyVisualizer, VisualizationType } = require('../src/visualization/PropertyVisualizer');

async function example() {
  // Initialize Obsidian client
  const client = new ObsidianAPIClient({
    apiUrl: process.env.OBSIDIAN_API_URL || 'http://localhost:27123',
    apiKey: process.env.OBSIDIAN_API_KEY
  });

  // Initialize visualizer
  const visualizer = new PropertyVisualizer({
    client: client,
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes

    // Optional: Custom parser for special property formats
    customParser: (note) => {
      const properties = {};

      // Extract frontmatter
      if (note.frontmatter) {
        Object.assign(properties, note.frontmatter);
      }

      // Extract custom inline properties
      const customRegex = /\[\[property::(\w+)::(.+?)\]\]/g;
      let match;

      while ((match = customRegex.exec(note.content || '')) !== null) {
        properties[match[1]] = match[2];
      }

      return properties;
    },

    // Visualization defaults
    visualizationDefaults: {
      showLegend: true,
      interactive: true,
      colorScheme: 'default'
    }
  });

  try {
    console.log('--- Property Extraction ---\n');

    // Extract all properties from notes
    console.log('Extracting properties from all notes...');
    const properties = await visualizer.extractProperties();

    console.log(`✓ Extracted properties from ${properties.totalNotes} notes`);
    console.log(`✓ Found ${properties.totalProperties} unique properties\n`);

    // Display property statistics
    console.log('Property Statistics:');
    Object.entries(properties.statistics).forEach(([name, stats]) => {
      console.log(`  ${name}:`);
      console.log(`    - Type: ${stats.type}`);
      console.log(`    - Count: ${stats.count}`);
      console.log(`    - Unique Values: ${stats.uniqueValues}`);
    });

    console.log('\n--- Dashboard Creation ---\n');

    // Create a basic dashboard
    const dashboard = visualizer.createDashboard(properties, {
      visualizationType: VisualizationType.TABLE,
      includeProperties: ['tags', 'status', 'priority', 'created']
    });

    console.log(`✓ Created dashboard with ${dashboard.widgets.length} widgets\n`);

    // Display widget information
    console.log('Dashboard Widgets:');
    dashboard.widgets.forEach(widget => {
      console.log(`\n  Widget: ${widget.propertyName}`);
      console.log(`    - Type: ${widget.type}`);
      console.log(`    - Data Points: ${widget.data.length}`);

      if (widget.config.aggregations) {
        console.log(`    - Aggregations:`);
        console.log(`      Sum: ${widget.config.aggregations.sum}`);
        console.log(`      Avg: ${widget.config.aggregations.avg.toFixed(2)}`);
        console.log(`      Min: ${widget.config.aggregations.min}`);
        console.log(`      Max: ${widget.config.aggregations.max}`);
      }

      if (widget.config.distribution) {
        console.log(`    - Top 5 Values:`);
        Object.entries(widget.config.distribution)
          .slice(0, 5)
          .forEach(([value, count]) => {
            console.log(`      ${value}: ${count}`);
          });
      }

      if (widget.config.timeRange) {
        console.log(`    - Time Range:`);
        console.log(`      Earliest: ${widget.config.timeRange.earliest}`);
        console.log(`      Latest: ${widget.config.timeRange.latest}`);
      }
    });

    console.log('\n--- Filtering ---\n');

    // Add filters
    visualizer
      .addFilter({
        property: 'status',
        operator: 'equals',
        value: 'active'
      })
      .addFilter({
        property: 'priority',
        operator: 'gte',
        value: 5
      });

    console.log('Applied filters:');
    console.log('  - Status equals "active"');
    console.log('  - Priority >= 5\n');

    // Apply filters
    const filteredProperties = visualizer.applyFilters(properties);

    console.log('Filtered Results:');
    Object.entries(filteredProperties.properties).forEach(([name, data]) => {
      if (data.length > 0) {
        console.log(`  ${name}: ${data.length} items`);
      }
    });

    console.log('\n--- Search ---\n');

    // Search properties
    const searchResults = visualizer.search('important', properties);

    console.log('Search Results for "important":');
    Object.entries(searchResults.properties).forEach(([name, data]) => {
      if (data.length > 0) {
        console.log(`  ${name}: ${data.length} matches`);
        data.slice(0, 3).forEach(item => {
          console.log(`    - ${item.notePath}: ${item.displayValue}`);
        });
      }
    });

    console.log('\n--- Export ---\n');

    // Export to JSON
    const jsonExport = visualizer.export(dashboard, 'json');
    console.log(`✓ Exported dashboard to JSON (${jsonExport.length} bytes)`);

    // Export to CSV
    const csvExport = visualizer.export(dashboard, 'csv');
    console.log(`✓ Exported dashboard to CSV (${csvExport.length} bytes)`);

    // Display sample CSV
    console.log('\nSample CSV Output (first 5 lines):');
    const csvLines = csvExport.split('\n').slice(0, 5);
    csvLines.forEach(line => console.log(`  ${line}`));

    console.log('\n--- Advanced Usage ---\n');

    // Create specialized dashboard for numeric properties
    const numericDashboard = visualizer.createDashboard(properties, {
      visualizationType: VisualizationType.CHART,
      includeProperties: properties.statistics
        ? Object.keys(properties.statistics).filter(key =>
            properties.statistics[key].type === 'number'
          )
        : []
    });

    console.log(`✓ Created numeric dashboard with ${numericDashboard.widgets.length} charts\n`);

    // Create timeline for date properties
    const timelineDashboard = visualizer.createDashboard(properties, {
      visualizationType: VisualizationType.TIMELINE,
      includeProperties: properties.statistics
        ? Object.keys(properties.statistics).filter(key =>
            properties.statistics[key].type === 'date'
          )
        : []
    });

    console.log(`✓ Created timeline dashboard with ${timelineDashboard.widgets.length} timelines\n`);

    // Clear cache
    visualizer.clearCache();
    console.log('✓ Cleared property cache');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run example
if (require.main === module) {
  example().catch(console.error);
}

module.exports = example;
