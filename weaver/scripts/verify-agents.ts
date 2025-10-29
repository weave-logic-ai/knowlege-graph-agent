#!/usr/bin/env tsx
/**
 * Agent Verification Script
 *
 * Verifies all 5 expert agents are properly implemented and exported.
 */

import {
  ResearcherAgent,
  CoderAgent,
  ArchitectAgent,
  TesterAgent,
  AnalystAgent,
  createResearcherAgent,
  createCoderAgent,
  createArchitectAgent,
  createTesterAgent,
  createAnalystAgent,
  PlanningExpert,
  ErrorDetector,
  AgentCoordinator,
  createClaudeClient,
  createCoordinator,
} from '../src/agents/index.js';

console.log('🔍 Verifying Expert Agents Implementation...\n');

// Check all agent classes exist
const agents = [
  { name: 'ResearcherAgent', class: ResearcherAgent, factory: createResearcherAgent },
  { name: 'CoderAgent', class: CoderAgent, factory: createCoderAgent },
  { name: 'ArchitectAgent', class: ArchitectAgent, factory: createArchitectAgent },
  { name: 'TesterAgent', class: TesterAgent, factory: createTesterAgent },
  { name: 'AnalystAgent', class: AnalystAgent, factory: createAnalystAgent },
];

const supportingAgents = [
  { name: 'PlanningExpert', class: PlanningExpert },
  { name: 'ErrorDetector', class: ErrorDetector },
];

const infrastructure = [
  { name: 'AgentCoordinator', class: AgentCoordinator, factory: createCoordinator },
];

let allPassed = true;

console.log('📋 Core Agents:');
for (const agent of agents) {
  const classExists = typeof agent.class === 'function';
  const factoryExists = typeof agent.factory === 'function';
  const passed = classExists && factoryExists;

  console.log(`  ${passed ? '✅' : '❌'} ${agent.name}`);
  console.log(`     - Class: ${classExists ? '✓' : '✗'}`);
  console.log(`     - Factory: ${factoryExists ? '✓' : '✗'}`);

  if (!passed) allPassed = false;
}

console.log('\n📋 Supporting Agents:');
for (const agent of supportingAgents) {
  const classExists = typeof agent.class === 'function';

  console.log(`  ${classExists ? '✅' : '❌'} ${agent.name}`);

  if (!classExists) allPassed = false;
}

console.log('\n📋 Infrastructure:');
for (const component of infrastructure) {
  const classExists = typeof component.class === 'function';
  const factoryExists = component.factory ? typeof component.factory === 'function' : true;
  const passed = classExists && factoryExists;

  console.log(`  ${passed ? '✅' : '❌'} ${component.name}`);
  console.log(`     - Class: ${classExists ? '✓' : '✗'}`);
  if (component.factory) {
    console.log(`     - Factory: ${factoryExists ? '✓' : '✗'}`);
  }

  if (!passed) allPassed = false;
}

// Verify agent methods exist
console.log('\n📋 Agent Capabilities:');

const agentCapabilities = [
  {
    name: 'ResearcherAgent',
    methods: ['searchArxiv', 'analyzePaper', 'findTrends', 'synthesizeFindings'],
  },
  {
    name: 'CoderAgent',
    methods: ['generateCode', 'refactorCode', 'optimizePerformance', 'addTests'],
  },
  {
    name: 'ArchitectAgent',
    methods: ['designSystem', 'selectPatterns', 'designAPI', 'reviewArchitecture'],
  },
  {
    name: 'TesterAgent',
    methods: ['generateTests', 'validateTestCoverage', 'findEdgeCases', 'generateTestData'],
  },
  {
    name: 'AnalystAgent',
    methods: ['reviewCode', 'calculateMetrics', 'scanSecurity', 'suggestImprovements'],
  },
];

for (const { name, methods } of agentCapabilities) {
  const agent = agents.find(a => a.name === name);
  if (!agent) continue;

  console.log(`\n  ${name}:`);
  for (const method of methods) {
    const hasMethod = agent.class.prototype && typeof agent.class.prototype[method] === 'function';
    console.log(`    ${hasMethod ? '✓' : '✗'} ${method}()`);
    if (!hasMethod) allPassed = false;
  }
}

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ All agents verified successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${agents.length} core agents`);
  console.log(`   - ${supportingAgents.length} supporting agents`);
  console.log(`   - ${infrastructure.length} infrastructure component(s)`);
  console.log(`   - Total: ${agents.length + supportingAgents.length + infrastructure.length} components`);
  process.exit(0);
} else {
  console.log('❌ Some agents failed verification');
  process.exit(1);
}
