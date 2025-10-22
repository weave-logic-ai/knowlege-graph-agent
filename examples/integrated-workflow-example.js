/**
 * Integrated Workflow Example
 *
 * Demonstrates how ObsidianAPIClient, RuleEngine, and PropertyVisualizer
 * work together in a real-world scenario.
 */

const ObsidianAPIClient = require('../src/clients/ObsidianAPIClient');
const { RuleEngine, RulePriority, ConflictStrategy } = require('../src/agents/RuleEngine');
const { PropertyVisualizer, VisualizationType } = require('../src/visualization/PropertyVisualizer');

/**
 * Integrated workflow demonstrating all three components
 */
async function integratedWorkflow() {
  console.log('=== Integrated Workflow Demo ===\n');

  // -------------------------------------------------------------------------
  // STEP 1: Initialize all components
  // -------------------------------------------------------------------------
  console.log('Step 1: Initializing components...\n');

  const client = new ObsidianAPIClient({
    apiUrl: process.env.OBSIDIAN_API_URL || 'http://localhost:27123',
    apiKey: process.env.OBSIDIAN_API_KEY,
    timeout: 30000,
    maxRetries: 3
  });

  const visualizer = new PropertyVisualizer({
    client: client,
    cacheEnabled: true,
    cacheTTL: 300000
  });

  const ruleEngine = new RuleEngine({
    conflictStrategy: ConflictStrategy.PRIORITY,
    enableMetrics: true,
    onRuleExecuted: (execution) => {
      console.log(`  ✓ Rule executed: ${execution.ruleName}`);
    }
  });

  console.log('✓ All components initialized\n');

  // -------------------------------------------------------------------------
  // STEP 2: Set up automated rules
  // -------------------------------------------------------------------------
  console.log('Step 2: Setting up automated rules...\n');

  // Rule: Auto-refresh visualization when notes change
  ruleEngine.addRule({
    id: 'auto-refresh-viz',
    name: 'Auto-refresh Visualization',
    priority: RulePriority.HIGH,
    tags: ['automation', 'visualization'],
    condition: (ctx) => ctx.notesModified > 0,
    action: async (ctx) => {
      console.log('  → Refreshing visualization...');
      visualizer.clearCache();
      const props = await visualizer.extractProperties();
      return { refreshed: true, propertyCount: props.totalProperties };
    }
  });

  // Rule: Alert on high property count
  ruleEngine.addRule({
    id: 'high-property-alert',
    name: 'High Property Count Alert',
    priority: RulePriority.MEDIUM,
    tags: ['monitoring', 'properties'],
    condition: (ctx) => ctx.totalProperties > 50,
    action: (ctx) => {
      console.log(`  ⚠ Warning: High property count detected (${ctx.totalProperties})`);
      return { alert: 'high_property_count', count: ctx.totalProperties };
    }
  });

  // Rule: Auto-export dashboard
  ruleEngine.addRule({
    id: 'auto-export',
    name: 'Auto-export Dashboard',
    priority: RulePriority.LOW,
    tags: ['automation', 'export'],
    condition: (ctx) => ctx.dashboardCreated && ctx.exportEnabled,
    action: (ctx) => {
      console.log('  → Exporting dashboard to CSV...');
      const csv = visualizer.export(ctx.dashboard, 'csv');
      return { exported: true, size: csv.length };
    }
  });

  // Rule: Create filtered views
  ruleEngine.addRule({
    id: 'create-filtered-views',
    name: 'Create Filtered Property Views',
    priority: RulePriority.MEDIUM,
    tags: ['automation', 'filtering'],
    condition: (ctx) => ctx.properties && ctx.createViews,
    action: (ctx) => {
      console.log('  → Creating filtered views...');

      // Filter for active items
      visualizer.clearFilters();
      visualizer.addFilter({
        property: 'status',
        operator: 'equals',
        value: 'active'
      });

      const activeView = visualizer.applyFilters(ctx.properties);

      // Filter for high priority items
      visualizer.clearFilters();
      visualizer.addFilter({
        property: 'priority',
        operator: 'gte',
        value: 7
      });

      const priorityView = visualizer.applyFilters(ctx.properties);

      return {
        activeCount: Object.values(activeView.properties).reduce((sum, arr) => sum + arr.length, 0),
        priorityCount: Object.values(priorityView.properties).reduce((sum, arr) => sum + arr.length, 0)
      };
    }
  });

  console.log(`✓ ${ruleEngine.getAllRules().length} rules configured\n`);

  // -------------------------------------------------------------------------
  // STEP 3: Create sample notes
  // -------------------------------------------------------------------------
  console.log('Step 3: Creating sample notes...\n');

  const sampleNotes = [
    {
      path: 'projects/weave-nn.md',
      content: '# Weave Neural Network\n\nA distributed neural network implementation.',
      frontmatter: {
        status: 'active',
        priority: 9,
        tags: ['ai', 'neural-network', 'project'],
        created: new Date('2025-10-01').toISOString(),
        team: ['Alice', 'Bob']
      }
    },
    {
      path: 'projects/api-integration.md',
      content: '# API Integration\n\nIntegrating with external services.',
      frontmatter: {
        status: 'active',
        priority: 7,
        tags: ['api', 'integration', 'project'],
        created: new Date('2025-10-15').toISOString(),
        team: ['Charlie']
      }
    },
    {
      path: 'tasks/documentation.md',
      content: '# Documentation Task\n\nUpdate project documentation.',
      frontmatter: {
        status: 'pending',
        priority: 5,
        tags: ['documentation', 'task'],
        created: new Date('2025-10-20').toISOString(),
        assignee: 'Alice'
      }
    },
    {
      path: 'ideas/future-features.md',
      content: '# Future Features\n\nBrainstorming session.',
      frontmatter: {
        status: 'idea',
        priority: 3,
        tags: ['ideas', 'brainstorm'],
        created: new Date('2025-10-21').toISOString()
      }
    }
  ];

  let notesCreated = 0;
  for (const noteData of sampleNotes) {
    try {
      await client.createNote(noteData);
      notesCreated++;
      console.log(`  ✓ Created: ${noteData.path}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`  ⊙ Skipped (exists): ${noteData.path}`);
      } else {
        console.error(`  ✗ Failed: ${noteData.path} - ${error.message}`);
      }
    }
  }

  console.log(`\n✓ Sample notes ready (${notesCreated} created)\n`);

  // -------------------------------------------------------------------------
  // STEP 4: Extract properties and trigger rules
  // -------------------------------------------------------------------------
  console.log('Step 4: Extracting properties...\n');

  const properties = await visualizer.extractProperties();

  console.log(`✓ Extracted properties from ${properties.totalNotes} notes`);
  console.log(`✓ Found ${properties.totalProperties} unique properties\n`);

  console.log('Property Types:');
  Object.entries(properties.statistics).forEach(([name, stats]) => {
    console.log(`  - ${name}: ${stats.type} (${stats.count} occurrences, ${stats.uniqueValues} unique)`);
  });

  // Trigger rules with context
  console.log('\nStep 5: Evaluating rules...\n');

  const ruleContext = {
    notesModified: notesCreated,
    totalProperties: properties.totalProperties,
    properties: properties,
    dashboardCreated: false,
    exportEnabled: true,
    createViews: true
  };

  const ruleResults = await ruleEngine.evaluate(ruleContext);

  console.log(`\n✓ Executed ${ruleResults.executed.length} rules`);
  console.log(`✓ Duration: ${ruleResults.duration}ms\n`);

  // -------------------------------------------------------------------------
  // STEP 6: Create and customize dashboard
  // -------------------------------------------------------------------------
  console.log('Step 6: Creating dashboard...\n');

  const dashboard = visualizer.createDashboard(properties, {
    visualizationType: VisualizationType.TABLE,
    includeProperties: ['status', 'priority', 'tags', 'created', 'team']
  });

  console.log(`✓ Created dashboard with ${dashboard.widgets.length} widgets\n`);

  dashboard.widgets.forEach(widget => {
    console.log(`Widget: ${widget.propertyName}`);
    console.log(`  - Type: ${widget.config.type}`);
    console.log(`  - Data points: ${widget.data.length}`);

    if (widget.config.distribution) {
      console.log(`  - Distribution:`);
      Object.entries(widget.config.distribution).slice(0, 3).forEach(([value, count]) => {
        console.log(`    • ${value}: ${count}`);
      });
    }

    if (widget.config.aggregations) {
      console.log(`  - Stats: avg=${widget.config.aggregations.avg.toFixed(1)}, min=${widget.config.aggregations.min}, max=${widget.config.aggregations.max}`);
    }

    console.log();
  });

  // Trigger dashboard export rule
  console.log('Step 7: Triggering export...\n');

  const exportContext = {
    ...ruleContext,
    dashboard: dashboard,
    dashboardCreated: true
  };

  const exportResults = await ruleEngine.evaluate(exportContext, {
    tags: ['export']
  });

  console.log(`✓ Export completed\n`);

  // -------------------------------------------------------------------------
  // STEP 8: Search and filter
  // -------------------------------------------------------------------------
  console.log('Step 8: Searching and filtering...\n');

  // Search for 'project' items
  const searchResults = visualizer.search('project', properties);
  const projectCount = Object.values(searchResults.properties)
    .reduce((sum, arr) => sum + arr.length, 0);

  console.log(`✓ Search for 'project': ${projectCount} results`);

  // Apply filters for active, high-priority items
  visualizer.clearFilters();
  visualizer
    .addFilter({
      property: 'status',
      operator: 'equals',
      value: 'active'
    })
    .addFilter({
      property: 'priority',
      operator: 'gte',
      value: 7
    });

  const filtered = visualizer.applyFilters(properties);
  const filteredCount = Object.values(filtered.properties)
    .reduce((sum, arr) => sum + arr.length, 0);

  console.log(`✓ Filtered (active + priority≥7): ${filteredCount} results\n`);

  // -------------------------------------------------------------------------
  // STEP 9: Display metrics
  // -------------------------------------------------------------------------
  console.log('Step 9: System metrics...\n');

  const metrics = ruleEngine.getMetrics();

  console.log('Rule Engine Metrics:');
  console.log(`  - Total evaluations: ${metrics.totalEvaluations}`);
  console.log(`  - Total executions: ${metrics.totalExecutions}`);
  console.log(`  - Average evaluation time: ${metrics.averageEvaluationTime.toFixed(2)}ms`);
  console.log();

  console.log('Most Executed Rules:');
  Object.entries(metrics.ruleExecutionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([ruleId, count]) => {
      const rule = ruleEngine.getRule(ruleId);
      console.log(`  - ${rule.name}: ${count} executions`);
    });

  console.log();

  // -------------------------------------------------------------------------
  // STEP 10: Summary
  // -------------------------------------------------------------------------
  console.log('=== Workflow Summary ===\n');

  console.log('Integrated Components:');
  console.log(`  ✓ Obsidian API Client - ${properties.totalNotes} notes managed`);
  console.log(`  ✓ Rule Engine - ${ruleEngine.getAllRules().length} rules active`);
  console.log(`  ✓ Property Visualizer - ${properties.totalProperties} properties tracked`);
  console.log();

  console.log('Automation Results:');
  console.log(`  ✓ ${ruleResults.executed.length} rules executed automatically`);
  console.log(`  ✓ ${dashboard.widgets.length} visualization widgets created`);
  console.log(`  ✓ ${visualizer.activeFilters.length} active filters applied`);
  console.log();

  console.log('Performance:');
  console.log(`  ✓ Total processing time: ${ruleResults.duration}ms`);
  console.log(`  ✓ Average rule execution: ${(ruleResults.duration / ruleResults.executed.length).toFixed(2)}ms`);
  console.log();

  console.log('✅ Workflow completed successfully!\n');

  return {
    notes: properties.totalNotes,
    properties: properties.totalProperties,
    rulesExecuted: ruleResults.executed.length,
    widgetsCreated: dashboard.widgets.length
  };
}

// Run the integrated workflow
if (require.main === module) {
  integratedWorkflow()
    .then(results => {
      console.log('Final Results:', results);
      process.exit(0);
    })
    .catch(error => {
      console.error('Workflow failed:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

module.exports = integratedWorkflow;
