#!/usr/bin/env tsx
/**
 * Hub Creation Runner
 * Executes the hub creation workflow with comprehensive configuration
 */

import { createHubs, HubConfig } from './create-hubs.js';

const hubConfigs: HubConfig[] = [
  // Root Hub
  {
    hubType: 'root',
    hubLevel: 0,
    domain: 'weave-nn',
    title: 'Weave-NN Project Hub',
    targetDirectory: 'weave-nn',
    description: 'Central hub for the Weave-NN knowledge graph system. Navigate to all major domains, phases, and documentation.',
    childHubs: [
      'PLANNING-HUB',
      'DOCUMENTATION-HUB',
      'ARCHITECTURE-HUB',
      'RESEARCH-HUB',
      'WEAVER-HUB'
    ]
  },

  // Planning Hub
  {
    hubType: 'domain',
    hubLevel: 1,
    domain: 'planning',
    title: 'Planning Hub',
    targetDirectory: 'weave-nn/_planning',
    parentHub: 'WEAVE-NN-HUB',
    description: 'Project planning, phases, tasks, and strategic roadmap for Weave-NN development.',
    childHubs: [
      'PHASES-HUB',
      'SPECS-HUB',
      'DAILY-LOGS-HUB'
    ]
  },

  // Documentation Hub
  {
    hubType: 'domain',
    hubLevel: 1,
    domain: 'documentation',
    title: 'Documentation Hub',
    targetDirectory: 'weave-nn/docs',
    parentHub: 'WEAVE-NN-HUB',
    description: 'Comprehensive documentation, guides, synthesis reports, and technical references.',
    childHubs: [
      'SYNTHESIS-HUB',
      'GUIDES-HUB',
      'RESEARCH-HUB'
    ]
  },

  // Architecture Hub
  {
    hubType: 'domain',
    hubLevel: 1,
    domain: 'architecture',
    title: 'Architecture Hub',
    targetDirectory: 'weave-nn/architecture',
    parentHub: 'WEAVE-NN-HUB',
    description: 'System architecture, design decisions, patterns, and structural documentation.',
    childHubs: []
  },

  // Research Hub
  {
    hubType: 'domain',
    hubLevel: 1,
    domain: 'research',
    title: 'Research Hub',
    targetDirectory: 'weave-nn/research',
    parentHub: 'WEAVE-NN-HUB',
    description: 'Research findings, experiments, paper analysis, and innovation documentation.',
    childHubs: []
  },

  // Weaver Implementation Hub
  {
    hubType: 'domain',
    hubLevel: 1,
    domain: 'weaver',
    title: 'Weaver Implementation Hub',
    targetDirectory: 'weaver',
    parentHub: 'WEAVE-NN-HUB',
    description: 'Weaver tool implementation, CLI, workflows, and development guides.',
    childHubs: [
      'DOCS-HUB',
      'SRC-HUB',
      'TESTS-HUB'
    ]
  },

  // Phase Hubs (Level 2)
  {
    hubType: 'phase',
    hubLevel: 2,
    domain: 'phases',
    title: 'Phases Hub',
    targetDirectory: 'weave-nn/_planning/phases',
    parentHub: 'PLANNING-HUB',
    description: 'Development phases from Phase 1 through Phase 14, tracking evolution and progress.',
    childHubs: []
  },

  {
    hubType: 'phase',
    hubLevel: 2,
    domain: 'specs',
    title: 'Specifications Hub',
    targetDirectory: 'weave-nn/_planning/specs',
    parentHub: 'PLANNING-HUB',
    description: 'Detailed specifications for each phase, including requirements and implementation details.',
    childHubs: [
      'PHASE-5-HUB',
      'PHASE-6-HUB',
      'PHASE-7-HUB',
      'PHASE-8-HUB',
      'PHASE-9-HUB',
      'PHASE-11-HUB',
      'PHASE-13-HUB',
      'PHASE-14-HUB'
    ]
  },

  // Phase-specific hubs
  {
    hubType: 'phase',
    hubLevel: 3,
    domain: 'phase-5',
    title: 'Phase 5: MCP Integration Hub',
    targetDirectory: 'weave-nn/_planning/specs/phase-5-mcp-integration',
    parentHub: 'SPECS-HUB',
    description: 'Model Context Protocol integration specification and implementation details.',
    childHubs: []
  },

  {
    hubType: 'phase',
    hubLevel: 3,
    domain: 'phase-6',
    title: 'Phase 6: Vault Initialization Hub',
    targetDirectory: 'weave-nn/_planning/specs/phase-6-vault-initialization',
    parentHub: 'SPECS-HUB',
    description: 'Project vault initialization system and template management.',
    childHubs: []
  },

  {
    hubType: 'phase',
    hubLevel: 3,
    domain: 'phase-11',
    title: 'Phase 11: CLI Service Management Hub',
    targetDirectory: 'weave-nn/_planning/specs/phase-11-cli-service-management',
    parentHub: 'SPECS-HUB',
    description: 'CLI service management and autonomous agent system.',
    childHubs: []
  },

  {
    hubType: 'phase',
    hubLevel: 3,
    domain: 'phase-13',
    title: 'Phase 13: Enhanced Intelligence Hub',
    targetDirectory: 'weave-nn/_planning/specs/phase-13',
    parentHub: 'SPECS-HUB',
    description: 'Enhanced agent intelligence with learning loops and perception systems.',
    childHubs: []
  },

  {
    hubType: 'phase',
    hubLevel: 3,
    domain: 'phase-14',
    title: 'Phase 14: Obsidian Integration Hub',
    targetDirectory: 'weave-nn/_planning/specs/phase-14',
    parentHub: 'SPECS-HUB',
    description: 'Obsidian integration and knowledge graph visualization.',
    childHubs: []
  },

  // Archive Hub
  {
    hubType: 'domain',
    hubLevel: 1,
    domain: 'archive',
    title: 'Archive Hub',
    targetDirectory: 'weave-nn/.archive',
    parentHub: 'WEAVE-NN-HUB',
    description: 'Historical documentation, deprecated features, and superseded designs.',
    childHubs: []
  },

  // Weaver subdirectories
  {
    hubType: 'domain',
    hubLevel: 2,
    domain: 'weaver-docs',
    title: 'Weaver Documentation Hub',
    targetDirectory: 'weaver/docs',
    parentHub: 'WEAVER-HUB',
    description: 'Weaver documentation, API references, and user guides.',
    childHubs: []
  },

  {
    hubType: 'domain',
    hubLevel: 2,
    domain: 'weaver-src',
    title: 'Weaver Source Hub',
    targetDirectory: 'weaver/src',
    parentHub: 'WEAVER-HUB',
    description: 'Weaver source code organization and implementation details.',
    childHubs: []
  }
];

async function main() {
  console.log('🚀 Starting Hub Creation Workflow\n');
  console.log(`Target: /home/aepod/dev/weave-nn/weave-nn`);
  console.log(`Hubs to create: ${hubConfigs.length}\n`);

  const results = await createHubs(hubConfigs);

  console.log('\n📊 Hub Creation Summary:');
  console.log('━'.repeat(60));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  console.log(`📄 Total documents linked: ${successful.reduce((sum, r) => sum + r.documentsLinked, 0)}`);
  console.log('━'.repeat(60));

  if (failed.length > 0) {
    console.log('\n❌ Failed hubs:');
    failed.forEach(r => {
      console.log(`  - ${r.hubPath}: ${r.error}`);
    });
  }

  console.log('\n✨ Hub creation complete!');
}

main().catch(console.error);
