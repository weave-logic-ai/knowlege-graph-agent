/**
 * Sample Property Data for Visualization Testing
 * Covers various data structures and edge cases
 */

module.exports = {
  // Standard property set
  standardProperties: [
    {
      id: 'prop-001',
      name: 'status',
      type: 'select',
      values: ['todo', 'in-progress', 'done'],
      count: 42,
      distribution: {
        'todo': 15,
        'in-progress': 12,
        'done': 15
      }
    },
    {
      id: 'prop-002',
      name: 'priority',
      type: 'number',
      min: 1,
      max: 10,
      average: 6.5,
      count: 42
    },
    {
      id: 'prop-003',
      name: 'tags',
      type: 'multiselect',
      values: ['urgent', 'review', 'research', 'development', 'documentation'],
      count: 42,
      distribution: {
        'urgent': 8,
        'review': 12,
        'research': 15,
        'development': 20,
        'documentation': 10
      }
    },
    {
      id: 'prop-004',
      name: 'deadline',
      type: 'date',
      earliest: '2025-10-22',
      latest: '2025-12-31',
      count: 28
    }
  ],

  // Large dataset for performance testing
  largeDataset: {
    properties: Array.from({ length: 100 }, (_, i) => ({
      id: `prop-${String(i).padStart(3, '0')}`,
      name: `property-${i}`,
      type: i % 4 === 0 ? 'select' : i % 4 === 1 ? 'number' : i % 4 === 2 ? 'multiselect' : 'text',
      count: Math.floor(Math.random() * 1000) + 100
    })),
    notes: 5000,
    lastUpdated: '2025-10-22T00:00:00Z'
  },

  // Nested property structure
  nestedProperties: {
    metadata: {
      vault: 'Test Vault',
      totalNotes: 150,
      lastScanned: '2025-10-22T00:00:00Z'
    },
    properties: [
      {
        id: 'prop-nested-001',
        name: 'project',
        type: 'select',
        values: ['Project A', 'Project B', 'Project C'],
        children: [
          {
            id: 'prop-nested-001-001',
            name: 'subproject',
            type: 'select',
            values: ['Phase 1', 'Phase 2', 'Phase 3']
          }
        ]
      }
    ]
  },

  // Empty dataset
  emptyDataset: {
    properties: [],
    notes: 0,
    message: 'No properties found'
  },

  // Sparse data (many null/undefined values)
  sparseDataset: {
    properties: [
      {
        id: 'prop-sparse-001',
        name: 'optional-field',
        type: 'text',
        count: 5,
        totalNotes: 100,
        coverage: 5
      }
    ]
  },

  // Mixed type data for type coercion testing
  mixedTypeDataset: {
    properties: [
      {
        id: 'prop-mixed-001',
        name: 'numeric-string',
        type: 'text',
        values: ['1', '2', '3', '10', '20'],
        shouldBeNumber: true
      },
      {
        id: 'prop-mixed-002',
        name: 'date-string',
        type: 'text',
        values: ['2025-10-22', '2025-10-23', 'invalid-date'],
        shouldBeDate: true
      }
    ]
  },

  // Unicode and special characters
  unicodeDataset: {
    properties: [
      {
        id: 'prop-unicode-001',
        name: 'emoji-tags',
        type: 'multiselect',
        values: ['🎯 goals', '🐛 bugs', '✨ features', '📝 notes'],
        count: 25
      },
      {
        id: 'prop-unicode-002',
        name: 'multilingual',
        type: 'text',
        values: ['Hello', 'Bonjour', 'こんにちは', '你好', 'مرحبا'],
        count: 15
      }
    ]
  },

  // Time series data
  timeSeriesDataset: {
    properties: [
      {
        id: 'prop-timeseries-001',
        name: 'created',
        type: 'date',
        data: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(2025, 9, i + 1).toISOString(),
          count: Math.floor(Math.random() * 10) + 1
        }))
      }
    ]
  },

  // Hierarchical category data
  hierarchicalDataset: {
    properties: [
      {
        id: 'prop-hierarchy-001',
        name: 'category',
        type: 'hierarchy',
        tree: {
          'Work': {
            'Projects': {
              'Active': 15,
              'Completed': 23,
              'On Hold': 5
            },
            'Meetings': 30,
            'Documentation': 12
          },
          'Personal': {
            'Goals': 8,
            'Notes': 45,
            'Ideas': 20
          }
        }
      }
    ]
  },

  // Property relationships
  relationshipDataset: {
    properties: [
      {
        id: 'prop-rel-001',
        name: 'status',
        type: 'select',
        values: ['todo', 'done']
      },
      {
        id: 'prop-rel-002',
        name: 'priority',
        type: 'number'
      }
    ],
    correlations: [
      {
        property1: 'prop-rel-001',
        property2: 'prop-rel-002',
        correlation: 0.65,
        significance: 0.01
      }
    ]
  }
};
