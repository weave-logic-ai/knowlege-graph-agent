/**
 * Sample Rule Definitions for Testing Rule Engine
 * Covers various rule types, priorities, and edge cases
 */

module.exports = {
  // Valid basic rule
  basicRule: {
    id: 'rule-001',
    name: 'Basic Tagging Rule',
    condition: {
      type: 'property',
      field: 'tags',
      operator: 'contains',
      value: 'important'
    },
    action: {
      type: 'tag',
      value: 'priority-high'
    },
    priority: 5,
    enabled: true
  },

  // Complex conditional rule
  complexRule: {
    id: 'rule-002',
    name: 'Multi-Condition Rule',
    condition: {
      type: 'and',
      conditions: [
        {
          type: 'property',
          field: 'status',
          operator: 'equals',
          value: 'active'
        },
        {
          type: 'or',
          conditions: [
            {
              type: 'property',
              field: 'priority',
              operator: 'greaterThan',
              value: 7
            },
            {
              type: 'property',
              field: 'tags',
              operator: 'contains',
              value: 'urgent'
            }
          ]
        }
      ]
    },
    action: {
      type: 'notify',
      channel: 'slack',
      message: 'High priority active task detected'
    },
    priority: 10,
    enabled: true
  },

  // Rule with multiple actions
  multiActionRule: {
    id: 'rule-003',
    name: 'Multi-Action Rule',
    condition: {
      type: 'property',
      field: 'type',
      operator: 'equals',
      value: 'project'
    },
    actions: [
      {
        type: 'tag',
        value: 'project-tracked'
      },
      {
        type: 'property',
        field: 'tracked',
        value: true
      },
      {
        type: 'link',
        target: 'Projects Index'
      }
    ],
    priority: 7,
    enabled: true
  },

  // Temporal rule (date-based)
  temporalRule: {
    id: 'rule-004',
    name: 'Deadline Warning Rule',
    condition: {
      type: 'and',
      conditions: [
        {
          type: 'property',
          field: 'deadline',
          operator: 'exists',
          value: true
        },
        {
          type: 'date',
          field: 'deadline',
          operator: 'within',
          value: 3,
          unit: 'days'
        }
      ]
    },
    action: {
      type: 'tag',
      value: 'deadline-approaching'
    },
    priority: 8,
    enabled: true
  },

  // Regex-based rule
  regexRule: {
    id: 'rule-005',
    name: 'Content Pattern Rule',
    condition: {
      type: 'content',
      operator: 'matches',
      pattern: '^#\\s+TODO:',
      flags: 'i'
    },
    action: {
      type: 'tag',
      value: 'has-todo'
    },
    priority: 3,
    enabled: true
  },

  // Invalid rule - missing required fields
  invalidRuleMissingFields: {
    id: 'rule-invalid-001',
    name: 'Invalid Rule'
    // Missing condition and action
  },

  // Invalid rule - malformed condition
  invalidRuleMalformedCondition: {
    id: 'rule-invalid-002',
    name: 'Malformed Condition Rule',
    condition: {
      type: 'unknown-type',
      field: 'tags'
      // Missing operator and value
    },
    action: {
      type: 'tag',
      value: 'test'
    },
    priority: 5,
    enabled: true
  },

  // Invalid rule - circular dependency potential
  circularRule1: {
    id: 'rule-circular-001',
    name: 'Circular Rule 1',
    condition: {
      type: 'property',
      field: 'tag-b',
      operator: 'contains',
      value: 'test'
    },
    action: {
      type: 'tag',
      value: 'tag-a'
    },
    priority: 5,
    enabled: true
  },

  circularRule2: {
    id: 'rule-circular-002',
    name: 'Circular Rule 2',
    condition: {
      type: 'property',
      field: 'tag-a',
      operator: 'contains',
      value: 'test'
    },
    action: {
      type: 'tag',
      value: 'tag-b'
    },
    priority: 5,
    enabled: true
  },

  // Conflicting rules (same priority, different actions)
  conflictingRule1: {
    id: 'rule-conflict-001',
    name: 'Conflicting Rule 1',
    condition: {
      type: 'property',
      field: 'status',
      operator: 'equals',
      value: 'pending'
    },
    action: {
      type: 'property',
      field: 'priority',
      value: 'high'
    },
    priority: 5,
    enabled: true
  },

  conflictingRule2: {
    id: 'rule-conflict-002',
    name: 'Conflicting Rule 2',
    condition: {
      type: 'property',
      field: 'status',
      operator: 'equals',
      value: 'pending'
    },
    action: {
      type: 'property',
      field: 'priority',
      value: 'low'
    },
    priority: 5,
    enabled: true
  },

  // Disabled rule
  disabledRule: {
    id: 'rule-disabled-001',
    name: 'Disabled Rule',
    condition: {
      type: 'property',
      field: 'tags',
      operator: 'contains',
      value: 'test'
    },
    action: {
      type: 'tag',
      value: 'processed'
    },
    priority: 5,
    enabled: false
  },

  // Priority ordering test set
  priorityRules: [
    {
      id: 'rule-priority-001',
      name: 'Low Priority Rule',
      condition: { type: 'property', field: 'test', operator: 'equals', value: 'a' },
      action: { type: 'tag', value: 'low' },
      priority: 1,
      enabled: true
    },
    {
      id: 'rule-priority-002',
      name: 'Medium Priority Rule',
      condition: { type: 'property', field: 'test', operator: 'equals', value: 'a' },
      action: { type: 'tag', value: 'medium' },
      priority: 5,
      enabled: true
    },
    {
      id: 'rule-priority-003',
      name: 'High Priority Rule',
      condition: { type: 'property', field: 'test', operator: 'equals', value: 'a' },
      action: { type: 'tag', value: 'high' },
      priority: 10,
      enabled: true
    }
  ]
};
