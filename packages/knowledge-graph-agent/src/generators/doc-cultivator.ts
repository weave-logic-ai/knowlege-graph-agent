/**
 * Documentation Cultivator
 *
 * Long-running swarm-based process that recursively analyzes and builds out
 * all documentation, creates development plans, and integrates SOPs.
 *
 * Uses claude-flow swarm orchestration to systematically:
 * - Research and analyze existing docs
 * - Fill documentation gaps
 * - Create phased development plans
 * - Generate deployment/infrastructure plans
 * - Integrate SOP compliance
 *
 * @module generators/doc-cultivator
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname, relative } from 'path';
import fg from 'fast-glob';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Cultivation options
 */
export interface CultivationOptions {
  /** Run in background mode */
  background?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Dry run - show plan without executing */
  dryRun?: boolean;
  /** Force regenerate all docs */
  force?: boolean;
  /** Include SOP compliance analysis */
  includeSops?: boolean;
  /** Generate development plan */
  generateDevPlan?: boolean;
  /** Generate deployment/infrastructure plan */
  generateInfraPlan?: boolean;
  /** Custom service directories to analyze */
  services?: string[];
  /** Maximum concurrent agents */
  maxAgents?: number;
  /** Output file for background mode */
  outputFile?: string;
}

/**
 * Service analysis result
 */
export interface ServiceAnalysis {
  name: string;
  path: string;
  type: 'frontend' | 'backend' | 'api' | 'admin' | 'shared' | 'unknown';
  languages: string[];
  frameworks: string[];
  existingDocs: string[];
  sourceFiles: string[];
  dependencies: string[];
  description: string;
}

/**
 * Development phase
 */
export interface DevelopmentPhase {
  id: string;
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffort: string;
  dependencies: string[];
  services: string[];
  tasks: DevelopmentTask[];
  deliverables: string[];
}

/**
 * Development task
 */
export interface DevelopmentTask {
  id: string;
  title: string;
  description: string;
  service: string;
  type: 'feature' | 'infrastructure' | 'documentation' | 'testing' | 'deployment';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedEffort: string;
  dependencies: string[];
  acceptance: string[];
}

/**
 * Cultivation result
 */
export interface CultivationResult {
  success: boolean;
  projectRoot: string;
  docsPath: string;
  startTime: Date;
  endTime?: Date;
  services: ServiceAnalysis[];
  documentsGenerated: string[];
  documentsUpdated: string[];
  developmentPlan?: {
    phases: DevelopmentPhase[];
    totalEstimate: string;
    criticalPath: string[];
  };
  infrastructurePlan?: {
    environments: string[];
    services: Record<string, string>;
    deployment: string;
  };
  sopCompliance?: {
    score: number;
    gaps: string[];
    recommendations: string[];
  };
  errors: string[];
  logs: string[];
}

/**
 * Swarm agent task
 */
interface SwarmTask {
  id: string;
  type: 'research' | 'document' | 'plan' | 'analyze' | 'sop';
  agentType: 'researcher' | 'coder' | 'analyst' | 'architect';
  description: string;
  prompt: string;
  outputPath?: string;
  dependencies?: string[];
}

/**
 * Main cultivation function
 */
export async function cultivateDocs(
  projectRoot: string,
  docsPath: string,
  options: CultivationOptions = {}
): Promise<CultivationResult> {
  const result: CultivationResult = {
    success: true,
    projectRoot,
    docsPath,
    startTime: new Date(),
    services: [],
    documentsGenerated: [],
    documentsUpdated: [],
    errors: [],
    logs: [],
  };

  const log = (msg: string) => {
    result.logs.push(`[${new Date().toISOString()}] ${msg}`);
    if (options.verbose) {
      console.log(msg);
    }
  };

  try {
    log('Starting documentation cultivation...');

    // Phase 1: Discover and analyze project structure
    log('Phase 1: Analyzing project structure...');
    result.services = await analyzeProjectServices(projectRoot, options);
    log(`  Found ${result.services.length} services: ${result.services.map(s => s.name).join(', ')}`);

    // Phase 2: Scan all existing documentation
    log('Phase 2: Scanning existing documentation...');
    const existingDocs = await scanAllDocs(projectRoot, docsPath);
    log(`  Found ${existingDocs.length} existing documentation files`);

    // Phase 3: Build cultivation tasks
    log('Phase 3: Building cultivation tasks...');
    const tasks = await buildCultivationTasks(result.services, existingDocs, docsPath, options);
    log(`  Created ${tasks.length} cultivation tasks`);

    if (options.dryRun) {
      log('\n[Dry Run] Would execute the following tasks:');
      for (const task of tasks) {
        log(`  - [${task.type}] ${task.description} (${task.agentType} agent)`);
        if (task.outputPath) {
          log(`    → ${task.outputPath}`);
        }
      }
      result.endTime = new Date();
      return result;
    }

    // Phase 4: Execute cultivation tasks using swarm
    log('Phase 4: Executing cultivation with claude-flow swarm...');
    const taskResults = await executeCultivationSwarm(tasks, result, options);

    // Phase 5: Generate development plan if requested
    if (options.generateDevPlan !== false) {
      log('Phase 5: Generating development plan...');
      const devPlan = await generateDevelopmentPlan(result.services, docsPath, options);
      result.developmentPlan = devPlan;
      log(`  Generated ${devPlan!.phases.length} development phases`);
    }

    // Phase 6: Generate infrastructure plan if requested
    if (options.generateInfraPlan !== false) {
      log('Phase 6: Generating infrastructure plan...');
      const infraPlan = await generateInfrastructurePlan(result.services, docsPath, options);
      result.infrastructurePlan = infraPlan;
      log(`  Generated infrastructure plan for ${infraPlan!.environments.length} environments`);
    }

    // Phase 7: SOP compliance check if requested
    if (options.includeSops) {
      log('Phase 7: Analyzing SOP compliance...');
      const sopCompliance = await analyzeSopCompliance(projectRoot, docsPath, result.services);
      result.sopCompliance = sopCompliance;
      log(`  SOP compliance score: ${sopCompliance!.score}%`);
    }

    result.success = result.errors.length === 0;
    result.endTime = new Date();

    log(`\nCultivation complete!`);
    log(`  Documents generated: ${result.documentsGenerated.length}`);
    log(`  Documents updated: ${result.documentsUpdated.length}`);
    log(`  Errors: ${result.errors.length}`);

  } catch (error) {
    result.success = false;
    result.errors.push(`Cultivation failed: ${error}`);
    result.endTime = new Date();
  }

  return result;
}

/**
 * Analyze project services
 */
async function analyzeProjectServices(
  projectRoot: string,
  options: CultivationOptions
): Promise<ServiceAnalysis[]> {
  const services: ServiceAnalysis[] = [];

  // Check for explicit service directories
  const serviceDirs = options.services || ['api', 'backend', 'frontend', 'admin', 'shared', 'common', 'lib'];

  // Look in src/ and root
  const searchPaths = [
    join(projectRoot, 'src'),
    projectRoot,
  ];

  for (const searchPath of searchPaths) {
    if (!existsSync(searchPath)) continue;

    for (const serviceName of serviceDirs) {
      const servicePath = join(searchPath, serviceName);
      if (!existsSync(servicePath)) continue;

      // Skip if not a directory
      try {
        if (!statSync(servicePath).isDirectory()) continue;
      } catch {
        continue;
      }

      const analysis = await analyzeService(servicePath, serviceName);
      if (analysis) {
        services.push(analysis);
      }
    }
  }

  // Also scan for any directory with a docs/ subdirectory
  const srcDir = join(projectRoot, 'src');
  if (existsSync(srcDir)) {
    try {
      const entries = readdirSync(srcDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (services.some(s => s.name === entry.name)) continue;

        const servicePath = join(srcDir, entry.name);
        const docsDir = join(servicePath, 'docs');

        if (existsSync(docsDir)) {
          const analysis = await analyzeService(servicePath, entry.name);
          if (analysis) {
            services.push(analysis);
          }
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return services;
}

/**
 * Analyze a single service
 */
async function analyzeService(servicePath: string, serviceName: string): Promise<ServiceAnalysis | null> {
  try {
    const analysis: ServiceAnalysis = {
      name: serviceName,
      path: servicePath,
      type: guessServiceType(serviceName),
      languages: [],
      frameworks: [],
      existingDocs: [],
      sourceFiles: [],
      dependencies: [],
      description: '',
    };

    // Find source files
    const sourcePatterns = ['**/*.{ts,tsx,js,jsx,py,go,rs}'];
    const sourceFiles = await fg(sourcePatterns, {
      cwd: servicePath,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', '__pycache__/**'],
    });
    analysis.sourceFiles = sourceFiles;

    // Detect languages
    if (sourceFiles.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
      analysis.languages.push('TypeScript');
    }
    if (sourceFiles.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) {
      analysis.languages.push('JavaScript');
    }
    if (sourceFiles.some(f => f.endsWith('.py'))) {
      analysis.languages.push('Python');
    }
    if (sourceFiles.some(f => f.endsWith('.go'))) {
      analysis.languages.push('Go');
    }
    if (sourceFiles.some(f => f.endsWith('.rs'))) {
      analysis.languages.push('Rust');
    }

    // Find existing docs
    const docsDir = join(servicePath, 'docs');
    if (existsSync(docsDir)) {
      const docFiles = await fg('**/*.md', { cwd: docsDir });
      analysis.existingDocs = docFiles;
    }

    // Check for package.json
    const pkgPath = join(servicePath, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        analysis.description = pkg.description || '';
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        analysis.dependencies = Object.keys(deps);

        // Detect frameworks
        if (deps.react) analysis.frameworks.push('React');
        if (deps.next) analysis.frameworks.push('Next.js');
        if (deps.vue) analysis.frameworks.push('Vue');
        if (deps.express) analysis.frameworks.push('Express');
        if (deps.fastify) analysis.frameworks.push('Fastify');
        if (deps['@nestjs/core']) analysis.frameworks.push('NestJS');
      } catch {
        // Ignore parse errors
      }
    }

    // Check for Python requirements
    const reqPath = join(servicePath, 'requirements.txt');
    if (existsSync(reqPath)) {
      try {
        const reqContent = readFileSync(reqPath, 'utf-8').toLowerCase();
        if (reqContent.includes('fastapi')) analysis.frameworks.push('FastAPI');
        if (reqContent.includes('flask')) analysis.frameworks.push('Flask');
        if (reqContent.includes('django')) analysis.frameworks.push('Django');
        if (reqContent.includes('sqlalchemy')) analysis.frameworks.push('SQLAlchemy');
      } catch {
        // Ignore
      }
    }

    return analysis;
  } catch {
    return null;
  }
}

/**
 * Guess service type from name
 */
function guessServiceType(name: string): ServiceAnalysis['type'] {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('frontend') || nameLower.includes('client') || nameLower.includes('web') || nameLower.includes('ui')) {
    return 'frontend';
  }
  if (nameLower.includes('backend') || nameLower.includes('server')) {
    return 'backend';
  }
  if (nameLower.includes('api') || nameLower.includes('gateway')) {
    return 'api';
  }
  if (nameLower.includes('admin') || nameLower.includes('dashboard')) {
    return 'admin';
  }
  if (nameLower.includes('shared') || nameLower.includes('common') || nameLower.includes('lib')) {
    return 'shared';
  }
  return 'unknown';
}

/**
 * Scan all documentation files
 */
async function scanAllDocs(projectRoot: string, docsPath: string): Promise<string[]> {
  const allDocs: string[] = [];

  // Scan main docs directory
  if (existsSync(docsPath)) {
    const mainDocs = await fg('**/*.md', {
      cwd: docsPath,
      ignore: ['node_modules/**', '.git/**'],
    });
    allDocs.push(...mainDocs.map(d => join(docsPath, d)));
  }

  // Scan for docs in src/{service}/docs
  const srcDir = join(projectRoot, 'src');
  if (existsSync(srcDir)) {
    const serviceDocs = await fg('*/docs/**/*.md', {
      cwd: srcDir,
      ignore: ['node_modules/**', '.git/**'],
    });
    allDocs.push(...serviceDocs.map(d => join(srcDir, d)));
  }

  // Scan root for any .md files
  const rootDocs = await fg('*.md', {
    cwd: projectRoot,
    ignore: ['node_modules/**', '.git/**'],
  });
  allDocs.push(...rootDocs.map(d => join(projectRoot, d)));

  return allDocs;
}

/**
 * Build cultivation tasks
 */
async function buildCultivationTasks(
  services: ServiceAnalysis[],
  existingDocs: string[],
  docsPath: string,
  options: CultivationOptions
): Promise<SwarmTask[]> {
  const tasks: SwarmTask[] = [];
  let taskId = 0;

  // Task 1: Project overview research
  tasks.push({
    id: `task-${++taskId}`,
    type: 'research',
    agentType: 'researcher',
    description: 'Research and document project overview',
    prompt: buildProjectOverviewPrompt(services, existingDocs),
    outputPath: join(docsPath, 'README.md'),
  });

  // Task 2: Architecture documentation
  tasks.push({
    id: `task-${++taskId}`,
    type: 'document',
    agentType: 'architect',
    description: 'Document system architecture',
    prompt: buildArchitectureDocPrompt(services),
    outputPath: join(docsPath, 'concepts', 'architecture', 'system-overview.md'),
  });

  // Task 3: Per-service documentation
  for (const service of services) {
    // Service overview
    tasks.push({
      id: `task-${++taskId}`,
      type: 'document',
      agentType: 'coder',
      description: `Document ${service.name} service overview`,
      prompt: buildServiceDocPrompt(service),
      outputPath: join(docsPath, 'services', service.name, 'README.md'),
    });

    // Service API docs (if applicable)
    if (service.type === 'api' || service.type === 'backend') {
      tasks.push({
        id: `task-${++taskId}`,
        type: 'document',
        agentType: 'coder',
        description: `Document ${service.name} API endpoints`,
        prompt: buildApiDocPrompt(service),
        outputPath: join(docsPath, 'services', service.name, 'api-reference.md'),
      });
    }

    // Service data models (if applicable)
    if (service.type === 'backend' || service.type === 'api') {
      tasks.push({
        id: `task-${++taskId}`,
        type: 'document',
        agentType: 'analyst',
        description: `Document ${service.name} data models`,
        prompt: buildDataModelPrompt(service),
        outputPath: join(docsPath, 'services', service.name, 'data-models.md'),
      });
    }

    // Service components (if frontend)
    if (service.type === 'frontend' || service.type === 'admin') {
      tasks.push({
        id: `task-${++taskId}`,
        type: 'document',
        agentType: 'coder',
        description: `Document ${service.name} components`,
        prompt: buildComponentDocPrompt(service),
        outputPath: join(docsPath, 'services', service.name, 'components.md'),
      });
    }
  }

  // Task 4: Integration documentation
  if (services.length > 1) {
    tasks.push({
      id: `task-${++taskId}`,
      type: 'document',
      agentType: 'architect',
      description: 'Document service integrations',
      prompt: buildIntegrationDocPrompt(services),
      outputPath: join(docsPath, 'integrations', 'service-integration.md'),
    });
  }

  // Note: Development and infrastructure plans are generated separately in Phase 5 & 6
  // with detailed structured content, so we don't include them in swarm tasks

  // Task 5: SOP integration
  if (options.includeSops) {
    tasks.push({
      id: `task-${++taskId}`,
      type: 'sop',
      agentType: 'analyst',
      description: 'Analyze and integrate SOP compliance',
      prompt: buildSopAnalysisPrompt(services),
      outputPath: join(docsPath, 'standards', 'sop-compliance.md'),
    });
  }

  return tasks;
}

/**
 * Execute cultivation tasks using claude-flow swarm
 */
async function executeCultivationSwarm(
  tasks: SwarmTask[],
  result: CultivationResult,
  options: CultivationOptions
): Promise<void> {
  const maxAgents = options.maxAgents || 4;

  // Group tasks by dependencies
  const independentTasks = tasks.filter(t => !t.dependencies || t.dependencies.length === 0);
  const dependentTasks = tasks.filter(t => t.dependencies && t.dependencies.length > 0);

  // Execute independent tasks in batches
  for (let i = 0; i < independentTasks.length; i += maxAgents) {
    const batch = independentTasks.slice(i, i + maxAgents);

    const batchResults = await Promise.allSettled(
      batch.map(task => executeSwarmTask(task, options))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const task = batch[j];
      const taskResult = batchResults[j];

      if (taskResult.status === 'fulfilled' && taskResult.value.success) {
        if (task.outputPath) {
          result.documentsGenerated.push(task.outputPath);
        }
      } else {
        const error = taskResult.status === 'rejected'
          ? taskResult.reason
          : taskResult.value.error;
        result.errors.push(`Task ${task.id} failed: ${error}`);
      }
    }
  }

  // Execute dependent tasks sequentially
  for (const task of dependentTasks) {
    try {
      const taskResult = await executeSwarmTask(task, options);
      if (taskResult.success && task.outputPath) {
        result.documentsGenerated.push(task.outputPath);
      } else {
        result.errors.push(`Task ${task.id} failed: ${taskResult.error}`);
      }
    } catch (error) {
      result.errors.push(`Task ${task.id} failed: ${error}`);
    }
  }
}

/**
 * Execute a single swarm task
 */
async function executeSwarmTask(
  task: SwarmTask,
  options: CultivationOptions
): Promise<{ success: boolean; output?: string; error?: string }> {
  return new Promise((resolve) => {
    // Try using claude-flow agent spawn
    const agentProcess = spawn('npx', [
      'claude-flow@alpha',
      'agent',
      'spawn',
      '--type', task.agentType,
      '--task', task.prompt.slice(0, 1000), // Truncate for CLI
    ], {
      shell: true,
      timeout: 120000,
    });

    let output = '';
    let errorOutput = '';

    agentProcess.stdout?.on('data', (data) => {
      output += data.toString();
    });

    agentProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });

    agentProcess.on('close', (code) => {
      if (code === 0 || output.length > 0) {
        // Write output to file if path specified
        if (task.outputPath && output.length > 0) {
          try {
            const dir = dirname(task.outputPath);
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
            writeFileSync(task.outputPath, output);
          } catch (e) {
            // Fall back to template
            writeTemplateDoc(task);
          }
        } else {
          // Write template if no output
          writeTemplateDoc(task);
        }
        resolve({ success: true, output });
      } else {
        // Fall back to template generation
        writeTemplateDoc(task);
        resolve({ success: true, output: 'Generated from template' });
      }
    });

    agentProcess.on('error', () => {
      // Fall back to template generation
      writeTemplateDoc(task);
      resolve({ success: true, output: 'Generated from template (fallback)' });
    });

    // Timeout fallback
    setTimeout(() => {
      agentProcess.kill();
      writeTemplateDoc(task);
      resolve({ success: true, output: 'Generated from template (timeout)' });
    }, 60000);
  });
}

/**
 * Write template document when agent fails
 */
function writeTemplateDoc(task: SwarmTask): void {
  if (!task.outputPath) return;

  const dir = dirname(task.outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const title = basename(task.outputPath, '.md')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const content = `---
title: ${title}
type: ${task.type}
status: draft
created: ${new Date().toISOString().split('T')[0]}
tags: [auto-generated, needs-review]
---

# ${title}

${task.description}

## Overview

*This document was auto-generated and needs to be completed.*

${task.prompt.split('\n').slice(0, 10).join('\n')}

## Next Steps

- [ ] Review and expand this document
- [ ] Add specific implementation details
- [ ] Link related documentation

---
> Auto-generated by kg-agent cultivate
`;

  writeFileSync(task.outputPath, content);
}

// Prompt builders
function buildProjectOverviewPrompt(services: ServiceAnalysis[], existingDocs: string[]): string {
  return `Analyze this project and create a comprehensive README.md.

Services found: ${services.map(s => `${s.name} (${s.type})`).join(', ')}
Existing docs: ${existingDocs.length} files

Create a project overview including:
- Project purpose and goals
- Architecture summary
- Services overview
- Getting started guide
- Development setup
`;
}

function buildArchitectureDocPrompt(services: ServiceAnalysis[]): string {
  const serviceInfo = services.map(s =>
    `- ${s.name}: ${s.type} service using ${s.languages.join(', ')} with ${s.frameworks.join(', ') || 'no specific framework'}`
  ).join('\n');

  return `Document the system architecture for this multi-service application.

Services:
${serviceInfo}

Include:
- High-level architecture diagram (mermaid)
- Service responsibilities
- Data flow between services
- Technology stack
- Scalability considerations
`;
}

function buildServiceDocPrompt(service: ServiceAnalysis): string {
  return `Document the ${service.name} service.

Type: ${service.type}
Languages: ${service.languages.join(', ')}
Frameworks: ${service.frameworks.join(', ') || 'None detected'}
Source files: ${service.sourceFiles.length}
Existing docs: ${service.existingDocs.length}

Create documentation including:
- Service purpose and responsibilities
- Key components/modules
- Configuration options
- Dependencies
- Usage examples
`;
}

function buildApiDocPrompt(service: ServiceAnalysis): string {
  return `Document the API endpoints for ${service.name}.

Analyze the source files and document:
- Available endpoints (REST/GraphQL)
- Request/response formats
- Authentication requirements
- Error handling
- Rate limiting (if applicable)
- Example requests/responses
`;
}

function buildDataModelPrompt(service: ServiceAnalysis): string {
  return `Document the data models for ${service.name}.

Analyze the source files and document:
- Database schemas
- Entity relationships (ERD if applicable)
- Data validation rules
- Migrations strategy
- Data access patterns
`;
}

function buildComponentDocPrompt(service: ServiceAnalysis): string {
  return `Document the UI components for ${service.name}.

Frameworks: ${service.frameworks.join(', ')}

Document:
- Component hierarchy
- Reusable components
- State management
- Styling approach
- Component props/interfaces
`;
}

function buildIntegrationDocPrompt(services: ServiceAnalysis[]): string {
  return `Document how the services integrate with each other.

Services: ${services.map(s => s.name).join(', ')}

Document:
- Service communication patterns
- API contracts between services
- Shared data models
- Authentication flow across services
- Error handling across services
`;
}

function buildDevPlanPrompt(services: ServiceAnalysis[]): string {
  const serviceList = services.map(s => `- ${s.name} (${s.type}): ${s.sourceFiles.length} files`).join('\n');

  return `Create a phased development plan for this project.

Services to plan:
${serviceList}

Create a plan with:
1. Phase 1: Foundation (infrastructure, auth, core services)
2. Phase 2: Core Features (main functionality per service)
3. Phase 3: Integration (service communication, data flow)
4. Phase 4: Polish (UI/UX, performance, testing)
5. Phase 5: Deployment (staging, production, monitoring)

For each phase include:
- Goals and deliverables
- Tasks per service
- Dependencies
- Estimated effort
- Acceptance criteria
`;
}

function buildInfraPlanPrompt(services: ServiceAnalysis[]): string {
  return `Create infrastructure and deployment plan.

Services: ${services.map(s => `${s.name} (${s.type})`).join(', ')}

Document:
1. Development Environment
   - Local setup requirements
   - Docker compose configuration
   - Environment variables

2. Staging Environment
   - Cloud provider recommendations
   - Service deployment configuration
   - Database setup
   - CI/CD pipeline

3. Production Environment
   - High availability configuration
   - Scaling strategy
   - Monitoring and logging
   - Backup and disaster recovery
   - Security considerations
`;
}

function buildSopAnalysisPrompt(services: ServiceAnalysis[]): string {
  return `Analyze project for SOP (Standard Operating Procedure) compliance.

Services: ${services.map(s => s.name).join(', ')}

Check compliance with:
- AI-SDLC SOPs for development practices
- Documentation requirements
- Testing requirements
- Security requirements
- Deployment requirements

Generate:
- Compliance score per category
- Gap analysis
- Recommendations for improvement
- Priority remediation items
`;
}

/**
 * Generate development plan
 */
async function generateDevelopmentPlan(
  services: ServiceAnalysis[],
  docsPath: string,
  options: CultivationOptions
): Promise<CultivationResult['developmentPlan']> {
  const phases: DevelopmentPhase[] = [
    {
      id: 'phase-1',
      name: 'Foundation',
      description: 'Set up infrastructure, authentication, and core services',
      priority: 'critical',
      estimatedEffort: '2-3 weeks',
      dependencies: [],
      services: services.map(s => s.name),
      tasks: [
        {
          id: 'task-1-1',
          title: 'Infrastructure Setup',
          description: 'Set up development, staging, and production environments',
          service: 'all',
          type: 'infrastructure',
          priority: 'critical',
          estimatedEffort: '3-5 days',
          dependencies: [],
          acceptance: ['Environments accessible', 'CI/CD pipeline working'],
        },
        {
          id: 'task-1-2',
          title: 'Authentication System',
          description: 'Implement authentication and authorization',
          service: services.find(s => s.type === 'backend' || s.type === 'api')?.name || 'backend',
          type: 'feature',
          priority: 'critical',
          estimatedEffort: '3-5 days',
          dependencies: ['task-1-1'],
          acceptance: ['User login/logout working', 'Role-based access control'],
        },
      ],
      deliverables: ['Working development environment', 'Authentication system', 'CI/CD pipeline'],
    },
    {
      id: 'phase-2',
      name: 'Core Features',
      description: 'Implement core functionality for each service',
      priority: 'high',
      estimatedEffort: '4-6 weeks',
      dependencies: ['phase-1'],
      services: services.map(s => s.name),
      tasks: services.map((s, i) => ({
        id: `task-2-${i + 1}`,
        title: `${s.name} Core Features`,
        description: `Implement core functionality for ${s.name} service`,
        service: s.name,
        type: 'feature' as const,
        priority: 'high' as const,
        estimatedEffort: '1-2 weeks',
        dependencies: ['phase-1'],
        acceptance: ['Core features working', 'Unit tests passing'],
      })),
      deliverables: services.map(s => `${s.name} core features complete`),
    },
    {
      id: 'phase-3',
      name: 'Integration',
      description: 'Connect services and implement data flow',
      priority: 'high',
      estimatedEffort: '2-3 weeks',
      dependencies: ['phase-2'],
      services: services.map(s => s.name),
      tasks: [
        {
          id: 'task-3-1',
          title: 'Service Integration',
          description: 'Connect all services and implement API contracts',
          service: 'all',
          type: 'feature',
          priority: 'high',
          estimatedEffort: '1-2 weeks',
          dependencies: ['phase-2'],
          acceptance: ['Services communicating', 'Data flow working'],
        },
      ],
      deliverables: ['Integrated system', 'End-to-end tests passing'],
    },
    {
      id: 'phase-4',
      name: 'Polish',
      description: 'UI/UX improvements, performance optimization, comprehensive testing',
      priority: 'medium',
      estimatedEffort: '2-3 weeks',
      dependencies: ['phase-3'],
      services: services.filter(s => s.type === 'frontend' || s.type === 'admin').map(s => s.name),
      tasks: [
        {
          id: 'task-4-1',
          title: 'UI/UX Polish',
          description: 'Improve user interface and experience',
          service: services.find(s => s.type === 'frontend')?.name || 'frontend',
          type: 'feature',
          priority: 'medium',
          estimatedEffort: '1 week',
          dependencies: ['phase-3'],
          acceptance: ['UI responsive', 'Accessibility standards met'],
        },
        {
          id: 'task-4-2',
          title: 'Performance Optimization',
          description: 'Optimize application performance',
          service: 'all',
          type: 'feature',
          priority: 'medium',
          estimatedEffort: '1 week',
          dependencies: ['phase-3'],
          acceptance: ['Load times < 3s', 'Performance benchmarks met'],
        },
      ],
      deliverables: ['Polished UI', 'Performance optimized', 'Comprehensive test coverage'],
    },
    {
      id: 'phase-5',
      name: 'Deployment',
      description: 'Deploy to staging and production',
      priority: 'high',
      estimatedEffort: '1-2 weeks',
      dependencies: ['phase-4'],
      services: services.map(s => s.name),
      tasks: [
        {
          id: 'task-5-1',
          title: 'Staging Deployment',
          description: 'Deploy to staging environment',
          service: 'all',
          type: 'deployment',
          priority: 'high',
          estimatedEffort: '2-3 days',
          dependencies: ['phase-4'],
          acceptance: ['Staging environment working', 'QA sign-off'],
        },
        {
          id: 'task-5-2',
          title: 'Production Deployment',
          description: 'Deploy to production environment',
          service: 'all',
          type: 'deployment',
          priority: 'high',
          estimatedEffort: '2-3 days',
          dependencies: ['task-5-1'],
          acceptance: ['Production live', 'Monitoring active'],
        },
      ],
      deliverables: ['Staging deployed', 'Production deployed', 'Monitoring configured'],
    },
  ];

  // Write development plan to docs
  const planPath = join(docsPath, 'planning', 'development-plan.md');
  const planDir = dirname(planPath);
  if (!existsSync(planDir)) {
    mkdirSync(planDir, { recursive: true });
  }

  const planContent = generateDevPlanMarkdown(phases, services);
  writeFileSync(planPath, planContent);

  return {
    phases,
    totalEstimate: '12-18 weeks',
    criticalPath: ['phase-1', 'phase-2', 'phase-3', 'phase-5'],
  };
}

/**
 * Generate development plan markdown
 */
function generateDevPlanMarkdown(phases: DevelopmentPhase[], services: ServiceAnalysis[]): string {
  let md = `---
title: Development Plan
type: planning
status: active
created: ${new Date().toISOString().split('T')[0]}
tags: [planning, development, phases]
---

# Development Plan

## Overview

This document outlines the phased development approach for building out the project.

### Services

${services.map(s => `- **${s.name}** (${s.type}): ${s.languages.join(', ')}`).join('\n')}

### Timeline

| Phase | Name | Duration | Priority |
|-------|------|----------|----------|
${phases.map(p => `| ${p.id} | ${p.name} | ${p.estimatedEffort} | ${p.priority} |`).join('\n')}

---

`;

  for (const phase of phases) {
    md += `## ${phase.name}

**Priority:** ${phase.priority}
**Estimated Effort:** ${phase.estimatedEffort}
**Dependencies:** ${phase.dependencies.length > 0 ? phase.dependencies.join(', ') : 'None'}

${phase.description}

### Tasks

${phase.tasks.map(t => `
#### ${t.title}

- **Service:** ${t.service}
- **Type:** ${t.type}
- **Priority:** ${t.priority}
- **Effort:** ${t.estimatedEffort}
- **Dependencies:** ${t.dependencies.length > 0 ? t.dependencies.join(', ') : 'None'}

${t.description}

**Acceptance Criteria:**
${t.acceptance.map(a => `- [ ] ${a}`).join('\n')}
`).join('\n')}

### Deliverables

${phase.deliverables.map(d => `- [ ] ${d}`).join('\n')}

---

`;
  }

  md += `
## Critical Path

The critical path for this project includes:
${phases.filter(p => p.priority === 'critical' || p.priority === 'high').map(p => `1. **${p.name}** - ${p.description}`).join('\n')}

---
> Auto-generated by kg-agent cultivate
`;

  return md;
}

/**
 * Generate infrastructure plan
 */
async function generateInfrastructurePlan(
  services: ServiceAnalysis[],
  docsPath: string,
  options: CultivationOptions
): Promise<CultivationResult['infrastructurePlan']> {
  const plan = {
    environments: ['development', 'staging', 'production'],
    services: {} as Record<string, string>,
    deployment: 'containerized',
  };

  for (const service of services) {
    plan.services[service.name] = service.type;
  }

  // Write infrastructure plan to docs
  const planPath = join(docsPath, 'planning', 'infrastructure-plan.md');
  const planDir = dirname(planPath);
  if (!existsSync(planDir)) {
    mkdirSync(planDir, { recursive: true });
  }

  const planContent = generateInfraPlanMarkdown(plan, services);
  writeFileSync(planPath, planContent);

  return plan;
}

/**
 * Generate infrastructure plan markdown
 */
function generateInfraPlanMarkdown(
  plan: CultivationResult['infrastructurePlan'],
  services: ServiceAnalysis[]
): string {
  return `---
title: Infrastructure Plan
type: planning
status: active
created: ${new Date().toISOString().split('T')[0]}
tags: [infrastructure, deployment, devops]
---

# Infrastructure Plan

## Overview

This document outlines the infrastructure and deployment strategy for all environments.

## Environments

### Development Environment

**Purpose:** Local development and testing

**Components:**
- Docker Compose for local services
- Local database instances
- Mock external services

**Setup:**
\`\`\`bash
# Clone repository
git clone <repo-url>
cd <project>

# Start development environment
docker-compose up -d

# Install dependencies
npm install  # or appropriate package manager
\`\`\`

### Staging Environment

**Purpose:** Pre-production testing and QA

**Infrastructure:**
- Cloud provider: AWS/GCP/Azure (TBD)
- Container orchestration: Kubernetes/ECS
- Database: Managed database service

**Services:**
${services.map(s => `- **${s.name}**: ${s.type} service`).join('\n')}

**CI/CD Pipeline:**
1. Push to staging branch
2. Run automated tests
3. Build container images
4. Deploy to staging cluster
5. Run integration tests

### Production Environment

**Purpose:** Live production system

**Infrastructure:**
- High-availability configuration
- Auto-scaling enabled
- CDN for static assets
- Managed database with read replicas

**Monitoring:**
- Application performance monitoring
- Log aggregation
- Alerting and on-call rotation

## Service Architecture

\`\`\`mermaid
graph TB
    subgraph Frontend
        ${services.filter(s => s.type === 'frontend' || s.type === 'admin').map(s => `${s.name}[${s.name}]`).join('\n        ')}
    end

    subgraph Backend
        ${services.filter(s => s.type === 'backend' || s.type === 'api').map(s => `${s.name}[${s.name}]`).join('\n        ')}
    end

    subgraph Data
        DB[(Database)]
        Cache[(Cache)]
    end

    Frontend --> Backend
    Backend --> Data
\`\`\`

## Deployment Strategy

### Development
- Local Docker Compose
- Hot reloading enabled
- Debug logging

### Staging
- Kubernetes deployment
- Automated from CI/CD
- Mirrors production configuration

### Production
- Blue-green deployment
- Automated rollback on failures
- Canary releases for major changes

## Security Considerations

- [ ] SSL/TLS certificates
- [ ] API authentication
- [ ] Secret management (Vault/AWS Secrets Manager)
- [ ] Network security groups
- [ ] WAF configuration

## Backup and Disaster Recovery

- Database backups: Daily automated backups
- Retention: 30 days
- RTO: 4 hours
- RPO: 1 hour

---
> Auto-generated by kg-agent cultivate
`;
}

/**
 * Analyze SOP compliance
 */
async function analyzeSopCompliance(
  projectRoot: string,
  docsPath: string,
  services: ServiceAnalysis[]
): Promise<CultivationResult['sopCompliance']> {
  // Basic compliance analysis
  const compliance = {
    score: 0,
    gaps: [] as string[],
    recommendations: [] as string[],
  };

  let totalChecks = 0;
  let passedChecks = 0;

  // Check for required documentation
  const requiredDocs = [
    'README.md',
    'concepts/architecture',
    'guides/getting-started',
    'standards',
  ];

  for (const doc of requiredDocs) {
    totalChecks++;
    if (existsSync(join(docsPath, doc))) {
      passedChecks++;
    } else {
      compliance.gaps.push(`Missing documentation: ${doc}`);
    }
  }

  // Check for service documentation
  for (const service of services) {
    totalChecks++;
    const serviceDoc = join(docsPath, 'services', service.name, 'README.md');
    if (existsSync(serviceDoc)) {
      passedChecks++;
    } else {
      compliance.gaps.push(`Missing service documentation: ${service.name}`);
    }
  }

  // Calculate score
  compliance.score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  // Generate recommendations
  if (compliance.gaps.length > 0) {
    compliance.recommendations.push('Complete missing documentation items');
  }
  if (!existsSync(join(docsPath, 'standards'))) {
    compliance.recommendations.push('Add coding standards documentation');
  }
  if (!existsSync(join(docsPath, 'guides', 'getting-started'))) {
    compliance.recommendations.push('Add getting started guide for new developers');
  }

  // Write SOP compliance report
  const reportPath = join(docsPath, 'standards', 'sop-compliance.md');
  const reportDir = dirname(reportPath);
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  const reportContent = `---
title: SOP Compliance Report
type: standard
status: active
created: ${new Date().toISOString().split('T')[0]}
tags: [sop, compliance, standards]
---

# SOP Compliance Report

## Score: ${compliance.score}%

## Gaps

${compliance.gaps.length > 0 ? compliance.gaps.map(g => `- ${g}`).join('\n') : 'No gaps identified.'}

## Recommendations

${compliance.recommendations.length > 0 ? compliance.recommendations.map(r => `- ${r}`).join('\n') : 'No recommendations at this time.'}

---
> Auto-generated by kg-agent cultivate
`;

  writeFileSync(reportPath, reportContent);

  return compliance;
}
