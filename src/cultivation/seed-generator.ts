/**
 * Seed Generator - Bootstrap knowledge graph with primitive nodes from codebase analysis
 *
 * Analyzes:
 * - package.json (Node.js dependencies)
 * - composer.json (PHP dependencies)
 * - requirements.txt / pyproject.toml (Python)
 * - Cargo.toml (Rust)
 * - go.mod (Go)
 * - pom.xml / build.gradle (Java)
 * - Existing vault documents
 * - Service configurations
 * - Deployment manifests
 *
 * @module cultivation/seed-generator
 */

import { readFile, readdir, stat, mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import matter from 'gray-matter';
import { createLogger } from '../utils/logger.js';
import type {
  VaultContext,
  DependencyInfo,
  ServiceInfo,
  SeedAnalysis,
  GeneratedDocument,
  DocumentMetadata,
  Ecosystem,
  DependencyType,
  ServiceType,
  CultivationOptions,
  InitPrimitivesResult
} from './types.js';

const logger = createLogger('seed-generator');

/**
 * SeedGenerator class for analyzing codebases and generating primitive nodes
 */
export class SeedGenerator {
  private vaultContext: VaultContext;
  private projectRoot: string;
  private startTime: number = 0;
  private filesScanned: number = 0;

  constructor(vaultContext: VaultContext, projectRoot: string) {
    this.vaultContext = vaultContext;
    this.projectRoot = projectRoot;
  }

  /**
   * Create a SeedGenerator from project paths
   */
  static async create(projectRoot: string, docsPath: string): Promise<SeedGenerator> {
    const vaultRoot = join(projectRoot, docsPath);
    const allFiles = await SeedGenerator.collectVaultFiles(vaultRoot);

    // Load context files if they exist
    let primitives: string | undefined;
    let features: string | undefined;
    let techSpecs: string | undefined;

    try {
      primitives = await readFile(join(vaultRoot, 'PRIMITIVES.md'), 'utf-8');
    } catch { /* File doesn't exist */ }

    try {
      features = await readFile(join(vaultRoot, 'features.md'), 'utf-8');
    } catch { /* File doesn't exist */ }

    try {
      techSpecs = await readFile(join(vaultRoot, 'tech-specs.md'), 'utf-8');
    } catch { /* File doesn't exist */ }

    const vaultContext: VaultContext = {
      vaultRoot,
      allFiles,
      primitives,
      features,
      techSpecs
    };

    return new SeedGenerator(vaultContext, projectRoot);
  }

  /**
   * Collect all markdown files in vault
   */
  private static async collectVaultFiles(vaultRoot: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(dir: string): Promise<void> {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            await walk(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            files.push(fullPath);
          }
        }
      } catch {
        // Directory doesn't exist
      }
    }

    await walk(vaultRoot);
    return files;
  }

  /**
   * Analyze entire codebase and generate seed data
   */
  async analyze(): Promise<SeedAnalysis> {
    this.startTime = Date.now();
    this.filesScanned = 0;

    logger.info('Starting codebase analysis', { projectRoot: this.projectRoot });

    const analysis: SeedAnalysis = {
      dependencies: [],
      services: [],
      frameworks: [],
      languages: [],
      deployments: [],
      existingConcepts: [],
      existingFeatures: [],
      metadata: {
        analyzedAt: new Date().toISOString(),
        projectRoot: this.projectRoot,
        filesScanned: 0,
        duration: 0
      }
    };

    // Analyze dependency files
    await this.analyzeDependencies(analysis);

    // Analyze existing vault documents
    await this.analyzeVaultDocuments(analysis);

    // Analyze service configurations
    await this.analyzeServices(analysis);

    // Analyze deployment manifests
    await this.analyzeDeployments(analysis);

    // Classify dependencies into frameworks
    this.classifyDependencies(analysis);

    // Dedupe languages
    analysis.languages = [...new Set(analysis.languages)];

    // Update metadata
    analysis.metadata.filesScanned = this.filesScanned;
    analysis.metadata.duration = Date.now() - this.startTime;

    logger.info('Analysis complete', {
      dependencies: analysis.dependencies.length,
      frameworks: analysis.frameworks.length,
      services: analysis.services.length,
      languages: analysis.languages.length,
      duration: analysis.metadata.duration
    });

    return analysis;
  }

  /**
   * Generate primitive nodes from seed analysis
   */
  async generatePrimitives(analysis: SeedAnalysis): Promise<GeneratedDocument[]> {
    const documents: GeneratedDocument[] = [];
    const frameworkNames = new Set(analysis.frameworks.map(f => f.name.toLowerCase()));

    logger.info('Generating primitives', {
      frameworks: analysis.frameworks.length,
      dependencies: analysis.dependencies.length,
      services: analysis.services.length
    });

    // Generate nodes for frameworks
    for (const framework of analysis.frameworks) {
      const doc = this.generateFrameworkNode(framework, analysis);
      documents.push(doc);
    }

    // Generate nodes for major dependencies (skip frameworks to avoid duplicates)
    for (const dep of analysis.dependencies) {
      if (frameworkNames.has(dep.name.toLowerCase())) {
        continue;
      }
      if (this.shouldGenerateNode(dep)) {
        const doc = this.generateDependencyNode(dep, analysis);
        documents.push(doc);
      }
    }

    // Generate nodes for services
    for (const service of analysis.services) {
      const doc = this.generateServiceNode(service, analysis);
      documents.push(doc);
    }

    // Generate language nodes
    for (const language of analysis.languages) {
      const doc = this.generateLanguageNode(language, analysis);
      documents.push(doc);
    }

    logger.info('Generated primitives', { count: documents.length });
    return documents;
  }

  /**
   * Write generated documents to disk
   */
  async writePrimitives(documents: GeneratedDocument[]): Promise<InitPrimitivesResult> {
    const result: InitPrimitivesResult = {
      success: true,
      analysis: {
        dependencies: [],
        services: [],
        frameworks: [],
        languages: [],
        deployments: [],
        existingConcepts: [],
        existingFeatures: [],
        metadata: {
          analyzedAt: new Date().toISOString(),
          projectRoot: this.projectRoot,
          filesScanned: 0,
          duration: 0
        }
      },
      documentsGenerated: [],
      directoriesCreated: [],
      errors: [],
      warnings: []
    };

    const createdDirs = new Set<string>();

    for (const doc of documents) {
      try {
        // Ensure directory exists
        const dir = dirname(doc.path);
        if (!createdDirs.has(dir) && !existsSync(dir)) {
          await mkdir(dir, { recursive: true });
          createdDirs.add(dir);
          result.directoriesCreated.push(dir);
        }

        // Check if file already exists
        if (existsSync(doc.path)) {
          result.warnings.push(`File already exists, skipping: ${doc.path}`);
          continue;
        }

        // Write file with frontmatter
        const frontmatterStr = matter.stringify(doc.content, doc.frontmatter);
        await writeFile(doc.path, frontmatterStr, 'utf-8');
        result.documentsGenerated.push(doc);

        logger.debug('Created primitive', { path: doc.path, title: doc.title });
      } catch (error) {
        const errorMsg = `Failed to write ${doc.path}: ${String(error)}`;
        result.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Full init-primitives workflow
   */
  async initPrimitives(options?: CultivationOptions): Promise<InitPrimitivesResult> {
    const analysis = await this.analyze();
    const documents = await this.generatePrimitives(analysis);

    if (options?.dryRun) {
      return {
        success: true,
        analysis,
        documentsGenerated: documents,
        directoriesCreated: [],
        errors: [],
        warnings: ['Dry run - no files written']
      };
    }

    const result = await this.writePrimitives(documents);
    result.analysis = analysis;
    return result;
  }

  // ============================================================================
  // Dependency Analysis Methods
  // ============================================================================

  private async analyzeDependencies(analysis: SeedAnalysis): Promise<void> {
    await this.analyzePackageJson(analysis);
    await this.analyzePython(analysis);
    await this.analyzeComposer(analysis);
    await this.analyzeCargo(analysis);
    await this.analyzeGoMod(analysis);
    await this.analyzeJava(analysis);
  }

  private async analyzePackageJson(analysis: SeedAnalysis): Promise<void> {
    const packageJsonPaths = [
      join(this.projectRoot, 'package.json'),
      join(this.projectRoot, 'packages/*/package.json')
    ];

    for (const path of [packageJsonPaths[0]]) {
      try {
        const content = await readFile(path, 'utf-8');
        const pkg = JSON.parse(content);
        this.filesScanned++;

        if (!analysis.languages.includes('javascript')) {
          analysis.languages.push('javascript');
        }
        if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) {
          if (!analysis.languages.includes('typescript')) {
            analysis.languages.push('typescript');
          }
        }

        // Process dependencies
        for (const [name, version] of Object.entries(pkg.dependencies || {})) {
          const dep = this.createDependencyInfo(name, version as string, 'nodejs', false);
          analysis.dependencies.push(dep);
        }

        // Process devDependencies
        for (const [name, version] of Object.entries(pkg.devDependencies || {})) {
          const dep = this.createDependencyInfo(name, version as string, 'nodejs', true);
          analysis.dependencies.push(dep);
        }
      } catch {
        // File doesn't exist
      }
    }

    // Check for monorepo packages
    try {
      const packagesDir = join(this.projectRoot, 'packages');
      const entries = await readdir(packagesDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pkgPath = join(packagesDir, entry.name, 'package.json');
          try {
            const content = await readFile(pkgPath, 'utf-8');
            const pkg = JSON.parse(content);
            this.filesScanned++;

            for (const [name, version] of Object.entries(pkg.dependencies || {})) {
              // Avoid duplicates
              if (!analysis.dependencies.some(d => d.name === name && d.ecosystem === 'nodejs')) {
                const dep = this.createDependencyInfo(name, version as string, 'nodejs', false);
                analysis.dependencies.push(dep);
              }
            }
          } catch {
            // Package doesn't have package.json
          }
        }
      }
    } catch {
      // No packages directory
    }
  }

  private async analyzePython(analysis: SeedAnalysis): Promise<void> {
    const requirementsPaths = [
      join(this.projectRoot, 'requirements.txt'),
      join(this.projectRoot, 'requirements-dev.txt')
    ];

    for (const path of requirementsPaths) {
      try {
        const content = await readFile(path, 'utf-8');
        const isDev = path.includes('dev');
        this.filesScanned++;

        if (!analysis.languages.includes('python')) {
          analysis.languages.push('python');
        }

        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;

          const match = trimmed.match(/^([a-zA-Z0-9-_]+)(?:==|>=|<=|~=|>|<)?(.+)?$/);
          if (match) {
            const [, name, version] = match;
            const dep = this.createDependencyInfo(name, version?.trim() || 'latest', 'python', isDev);
            analysis.dependencies.push(dep);
          }
        }
      } catch {
        // File doesn't exist
      }
    }

    // pyproject.toml
    try {
      const content = await readFile(join(this.projectRoot, 'pyproject.toml'), 'utf-8');
      this.filesScanned++;

      const depMatch = content.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?=\[|$)/);
      if (depMatch) {
        for (const line of depMatch[1].split('\n')) {
          const match = line.match(/^([a-zA-Z0-9-_]+)\s*=\s*"([^"]+)"/);
          if (match) {
            const [, name, version] = match;
            if (name !== 'python') {
              const dep = this.createDependencyInfo(name, version, 'python', false);
              analysis.dependencies.push(dep);
            }
          }
        }
      }
    } catch {
      // File doesn't exist
    }
  }

  private async analyzeComposer(analysis: SeedAnalysis): Promise<void> {
    try {
      const content = await readFile(join(this.projectRoot, 'composer.json'), 'utf-8');
      const composer = JSON.parse(content);
      this.filesScanned++;

      if (!analysis.languages.includes('php')) {
        analysis.languages.push('php');
      }

      for (const [name, version] of Object.entries(composer.require || {})) {
        if (name === 'php') continue;
        const dep = this.createDependencyInfo(name, version as string, 'php', false);
        analysis.dependencies.push(dep);
      }

      for (const [name, version] of Object.entries(composer['require-dev'] || {})) {
        const dep = this.createDependencyInfo(name, version as string, 'php', true);
        analysis.dependencies.push(dep);
      }
    } catch {
      // File doesn't exist
    }
  }

  private async analyzeCargo(analysis: SeedAnalysis): Promise<void> {
    try {
      const content = await readFile(join(this.projectRoot, 'Cargo.toml'), 'utf-8');
      this.filesScanned++;

      if (!analysis.languages.includes('rust')) {
        analysis.languages.push('rust');
      }

      const depMatch = content.match(/\[dependencies\]([\s\S]*?)(?=\[|$)/);
      if (depMatch) {
        for (const line of depMatch[1].split('\n')) {
          const match = line.match(/^([a-zA-Z0-9-_]+)\s*=\s*"([^"]+)"/);
          if (match) {
            const [, name, version] = match;
            const dep = this.createDependencyInfo(name, version, 'rust', false);
            dep.repository = `https://crates.io/crates/${name}`;
            analysis.dependencies.push(dep);
          }
        }
      }
    } catch {
      // File doesn't exist
    }
  }

  private async analyzeGoMod(analysis: SeedAnalysis): Promise<void> {
    try {
      const content = await readFile(join(this.projectRoot, 'go.mod'), 'utf-8');
      this.filesScanned++;

      if (!analysis.languages.includes('go')) {
        analysis.languages.push('go');
      }

      let inRequire = false;
      for (const line of content.split('\n')) {
        if (line.trim() === 'require (') {
          inRequire = true;
          continue;
        }
        if (line.trim() === ')') {
          inRequire = false;
          continue;
        }

        if (inRequire || line.trim().startsWith('require ')) {
          const match = line.match(/([a-zA-Z0-9.-]+\/[a-zA-Z0-9.-/]+)\s+v([0-9.]+)/);
          if (match) {
            const [, name, version] = match;
            const dep = this.createDependencyInfo(name, version, 'go', false);
            dep.documentation = [`https://pkg.go.dev/${name}`];
            dep.repository = `https://${name}`;
            analysis.dependencies.push(dep);
          }
        }
      }
    } catch {
      // File doesn't exist
    }
  }

  private async analyzeJava(analysis: SeedAnalysis): Promise<void> {
    try {
      const content = await readFile(join(this.projectRoot, 'pom.xml'), 'utf-8');
      this.filesScanned++;

      if (!analysis.languages.includes('java')) {
        analysis.languages.push('java');
      }

      const depMatches = content.matchAll(
        /<dependency>[\s\S]*?<groupId>([^<]+)<\/groupId>[\s\S]*?<artifactId>([^<]+)<\/artifactId>[\s\S]*?(?:<version>([^<]+)<\/version>)?[\s\S]*?<\/dependency>/g
      );

      for (const match of depMatches) {
        const [, groupId, artifactId, version] = match;
        const name = `${groupId}:${artifactId}`;
        const dep = this.createDependencyInfo(name, version || 'latest', 'java', false);
        dep.documentation = [`https://mvnrepository.com/artifact/${groupId}/${artifactId}`];
        analysis.dependencies.push(dep);
      }
    } catch {
      // File doesn't exist
    }

    // build.gradle (basic support)
    try {
      const content = await readFile(join(this.projectRoot, 'build.gradle'), 'utf-8');
      this.filesScanned++;

      if (!analysis.languages.includes('java')) {
        analysis.languages.push('java');
      }
    } catch {
      // File doesn't exist
    }
  }

  private createDependencyInfo(name: string, version: string, ecosystem: Ecosystem, isDev: boolean): DependencyInfo {
    return {
      name,
      version,
      type: this.inferDependencyType(name),
      category: this.inferCategory(name),
      ecosystem,
      documentation: this.getDocumentationLinks(name, ecosystem),
      repository: this.getRepositoryUrl(name, ecosystem),
      usedBy: [],
      relatedTo: [],
      isDev
    };
  }

  // ============================================================================
  // Vault Document Analysis
  // ============================================================================

  private async analyzeVaultDocuments(analysis: SeedAnalysis): Promise<void> {
    for (const filePath of this.vaultContext.allFiles) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const { data } = matter(content);
        this.filesScanned++;

        if (data.type === 'concept') {
          analysis.existingConcepts.push(data.title || basename(filePath, '.md'));
        } else if (data.type === 'feature') {
          analysis.existingFeatures.push(data.title || basename(filePath, '.md'));
        }

        // Extract mentions of dependencies
        const contentLower = content.toLowerCase();
        for (const dep of analysis.dependencies) {
          if (contentLower.includes(dep.name.toLowerCase())) {
            dep.usedBy.push(data.title || basename(filePath, '.md'));
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }
  }

  // ============================================================================
  // Service Analysis
  // ============================================================================

  private async analyzeServices(analysis: SeedAnalysis): Promise<void> {
    const serviceFiles = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'compose.yml',
      'compose.yaml'
    ];

    for (const file of serviceFiles) {
      try {
        const content = await readFile(join(this.projectRoot, file), 'utf-8');
        this.filesScanned++;

        // Simple line-by-line parsing for docker-compose
        const lines = content.split('\n');
        let inServices = false;
        let currentService: string | null = null;
        let currentIndent = 0;
        const serviceData = new Map<string, { image?: string; ports: string[] }>();

        for (const line of lines) {
          // Check for services section
          if (line.match(/^services:\s*$/)) {
            inServices = true;
            continue;
          }

          // Check for end of services section (new top-level key)
          if (inServices && line.match(/^[a-zA-Z]+:\s*$/)) {
            inServices = false;
            currentService = null;
            continue;
          }

          if (!inServices) continue;

          // Detect service name (2-space indent, ends with colon)
          const serviceMatch = line.match(/^  ([a-zA-Z0-9-_]+):\s*$/);
          if (serviceMatch) {
            currentService = serviceMatch[1];
            if (!['volumes', 'networks', 'secrets', 'configs'].includes(currentService)) {
              serviceData.set(currentService, { ports: [] });
            } else {
              currentService = null;
            }
            continue;
          }

          // Extract properties for current service (4+ space indent)
          if (currentService && serviceData.has(currentService)) {
            const data = serviceData.get(currentService)!;

            const imageMatch = line.match(/^\s+image:\s*(.+)$/);
            if (imageMatch) {
              data.image = imageMatch[1].trim();
            }

            const portMatch = line.match(/^\s+-\s*["']?(\d+)(?::\d+)?["']?/);
            if (portMatch) {
              data.ports.push(portMatch[1]);
            }
          }
        }

        // Convert to ServiceInfo objects
        for (const [name, data] of serviceData.entries()) {
          const service: ServiceInfo = {
            name,
            type: this.inferServiceType(name, data.image),
            technology: data.image?.split(':')[0] || 'unknown',
            dependencies: [],
            ports: data.ports.map(p => parseInt(p, 10))
          };
          analysis.services.push(service);
        }
      } catch {
        // File doesn't exist
      }
    }
  }

  private extractPorts(portsSection?: string): number[] {
    if (!portsSection) return [];
    const ports: number[] = [];
    const matches = portsSection.matchAll(/(\d+)(?::\d+)?/g);
    for (const match of matches) {
      ports.push(parseInt(match[1], 10));
    }
    return ports;
  }

  // ============================================================================
  // Deployment Analysis
  // ============================================================================

  private async analyzeDeployments(analysis: SeedAnalysis): Promise<void> {
    const deploymentIndicators = [
      'Dockerfile',
      'docker-compose.yml',
      '.github/workflows',
      'vercel.json',
      'netlify.toml',
      'railway.json',
      'fly.toml',
      'render.yaml',
      'kubernetes',
      'k8s'
    ];

    for (const indicator of deploymentIndicators) {
      try {
        await stat(join(this.projectRoot, indicator));
        analysis.deployments.push(indicator);
      } catch {
        // Doesn't exist
      }
    }
  }

  // ============================================================================
  // Classification Methods
  // ============================================================================

  private classifyDependencies(analysis: SeedAnalysis): void {
    const frameworkKeywords = [
      'express', 'fastify', 'koa', 'hapi', 'nest',
      'react', 'vue', 'angular', 'svelte', 'solid',
      'next', 'nuxt', 'gatsby', 'remix', 'astro',
      'django', 'flask', 'fastapi', 'rails', 'laravel',
      'spring', 'quarkus', 'micronaut',
      'actix', 'rocket', 'axum',
      'gin', 'echo', 'fiber'
    ];

    for (const dep of analysis.dependencies) {
      const nameLower = dep.name.toLowerCase();
      if (frameworkKeywords.some(fw => nameLower.includes(fw))) {
        dep.type = 'framework';
        if (!analysis.frameworks.some(f => f.name === dep.name)) {
          analysis.frameworks.push(dep);
        }
      }
    }
  }

  private inferDependencyType(name: string): DependencyType {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('eslint') || nameLower.includes('prettier') ||
        nameLower.includes('webpack') || nameLower.includes('vite') ||
        nameLower.includes('rollup') || nameLower.includes('esbuild')) {
      return 'tool';
    }

    return 'library';
  }

  private inferCategory(name: string): string {
    const nameLower = name.toLowerCase();

    // Frontend frameworks & UI → components/ui
    if (['react', 'vue', 'angular', 'svelte', 'solid'].some(fw => nameLower.includes(fw))) {
      return 'components/ui';
    }
    if (['radix', 'shadcn', 'chakra', 'mui', 'antd'].some(ui => nameLower.includes(ui))) {
      return 'components/ui';
    }

    // Backend frameworks → services/api
    if (['express', 'fastapi', 'django', 'flask', 'next', 'fastify', 'koa', 'hapi'].some(fw => nameLower.includes(fw))) {
      return 'services/api';
    }

    // Database/ORM → integrations/databases
    if (['prisma', 'typeorm', 'sequelize', 'mongoose', 'pg', 'mysql', 'sqlite', 'drizzle'].some(db => nameLower.includes(db))) {
      return 'integrations/databases';
    }

    // Auth → integrations/auth-providers
    if (['auth', 'passport', 'jwt', 'oauth', 'clerk', 'auth0', 'nextauth'].some(auth => nameLower.includes(auth))) {
      return 'integrations/auth-providers';
    }

    // Testing → guides/testing
    if (['test', 'jest', 'mocha', 'vitest', 'cypress', 'playwright'].some(test => nameLower.includes(test))) {
      return 'guides/testing';
    }

    // Build tools → standards/build-tools
    if (['webpack', 'vite', 'rollup', 'esbuild', 'turbo', 'nx'].some(tool => nameLower.includes(tool))) {
      return 'standards/build-tools';
    }

    // Linters → standards/coding-standards
    if (['eslint', 'prettier', 'stylelint', 'biome'].some(lint => nameLower.includes(lint))) {
      return 'standards/coding-standards';
    }

    // Type definitions → components/utilities
    if (nameLower.includes('@types') || nameLower.includes('typescript')) {
      return 'components/utilities';
    }

    // Default
    return 'components/utilities';
  }

  private getDocumentationLinks(name: string, ecosystem: Ecosystem): string[] {
    const links: string[] = [];

    switch (ecosystem) {
      case 'nodejs':
        links.push(`https://www.npmjs.com/package/${name}`);
        break;
      case 'python':
        links.push(`https://pypi.org/project/${name}/`);
        break;
      case 'php':
        links.push(`https://packagist.org/packages/${name}`);
        break;
      case 'rust':
        links.push(`https://crates.io/crates/${name}`);
        break;
      case 'go':
        links.push(`https://pkg.go.dev/${name}`);
        break;
      case 'java':
        if (name.includes(':')) {
          const [group, artifact] = name.split(':');
          links.push(`https://mvnrepository.com/artifact/${group}/${artifact}`);
        }
        break;
    }

    return links;
  }

  private getRepositoryUrl(name: string, ecosystem: Ecosystem): string | undefined {
    // Could be enhanced to query package registries
    return undefined;
  }

  private inferServiceType(name: string, image?: string): ServiceType {
    const nameLower = name.toLowerCase();
    const imageLower = image?.toLowerCase() || '';

    if (nameLower.includes('db') || nameLower.includes('database') ||
        ['postgres', 'mysql', 'mongo', 'mariadb'].some(db => imageLower.includes(db))) {
      return 'database';
    }
    if (nameLower.includes('cache') || imageLower.includes('redis') || imageLower.includes('memcached')) {
      return 'cache';
    }
    if (nameLower.includes('queue') || ['rabbitmq', 'kafka', 'nats'].some(q => imageLower.includes(q))) {
      return 'queue';
    }
    if (nameLower.includes('search') || ['elastic', 'meilisearch', 'typesense'].some(s => imageLower.includes(s))) {
      return 'search';
    }
    if (nameLower.includes('api') || nameLower.includes('backend') || nameLower.includes('server')) {
      return 'api';
    }
    if (nameLower.includes('storage') || imageLower.includes('minio') || imageLower.includes('s3')) {
      return 'storage';
    }
    if (['prometheus', 'grafana', 'jaeger', 'datadog'].some(m => imageLower.includes(m))) {
      return 'monitoring';
    }

    return 'compute';
  }

  private shouldGenerateNode(dep: DependencyInfo): boolean {
    // Generate nodes for frameworks
    if (dep.type === 'framework') return true;

    // Major packages that should have nodes
    const majorPackages = [
      'react', 'vue', 'angular', 'svelte',
      'typescript', 'webpack', 'vite', 'esbuild',
      'jest', 'vitest', 'mocha', 'playwright', 'cypress',
      'express', 'fastify', 'koa', 'next', 'nuxt',
      'prisma', 'typeorm', 'sequelize', 'drizzle',
      'axios', 'graphql', 'trpc', 'zod'
    ];

    return majorPackages.some(pkg => dep.name.toLowerCase().includes(pkg));
  }

  // ============================================================================
  // Node Generation Methods
  // ============================================================================

  private generateFrameworkNode(framework: DependencyInfo, analysis: SeedAnalysis): GeneratedDocument {
    const title = this.formatTitle(framework.name);
    const content = this.buildFrameworkContent(framework, analysis);

    const frontmatter: DocumentMetadata = {
      title,
      type: 'primitive',
      category: framework.category,
      ecosystem: framework.ecosystem,
      version: framework.version,
      status: 'active',
      tags: ['framework', framework.ecosystem, framework.category.split('/').pop() || ''],
      documentation: framework.documentation,
      repository: framework.repository,
      used_by: framework.usedBy.slice(0, 10),
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString()
    };

    return {
      type: 'primitive',
      path: join(this.vaultContext.vaultRoot, framework.category, `${this.slugify(framework.name)}.md`),
      title,
      content,
      frontmatter,
      backlinks: []
    };
  }

  private generateDependencyNode(dep: DependencyInfo, analysis: SeedAnalysis): GeneratedDocument {
    const title = this.formatTitle(dep.name);
    const content = this.buildDependencyContent(dep, analysis);

    const frontmatter: DocumentMetadata = {
      title,
      type: 'primitive',
      category: dep.category,
      ecosystem: dep.ecosystem,
      version: dep.version,
      status: 'active',
      tags: [dep.type, dep.ecosystem, dep.category.split('/').pop() || ''],
      documentation: dep.documentation,
      repository: dep.repository,
      used_by: dep.usedBy.slice(0, 10),
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString()
    };

    return {
      type: 'primitive',
      path: join(this.vaultContext.vaultRoot, dep.category, `${this.slugify(dep.name)}.md`),
      title,
      content,
      frontmatter,
      backlinks: []
    };
  }

  private generateServiceNode(service: ServiceInfo, analysis: SeedAnalysis): GeneratedDocument {
    const title = this.formatTitle(service.name);
    const content = this.buildServiceContent(service, analysis);

    const frontmatter: DocumentMetadata = {
      title,
      type: 'service',
      category: 'service',
      service_type: service.type,
      technology: service.technology,
      status: 'active',
      tags: ['service', service.type, service.technology],
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString()
    };

    return {
      type: 'service',
      path: join(this.vaultContext.vaultRoot, 'services', service.type, `${this.slugify(service.name)}.md`),
      title,
      content,
      frontmatter,
      backlinks: []
    };
  }

  private generateLanguageNode(language: string, analysis: SeedAnalysis): GeneratedDocument {
    const title = this.formatTitle(language);
    const content = this.buildLanguageContent(language, analysis);

    const frontmatter: DocumentMetadata = {
      title,
      type: 'standard',
      category: 'language',
      status: 'active',
      tags: ['language', 'programming'],
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString()
    };

    return {
      type: 'standard',
      path: join(this.vaultContext.vaultRoot, 'standards', 'programming-languages', `${language.toLowerCase()}.md`),
      title,
      content,
      frontmatter,
      backlinks: []
    };
  }

  // ============================================================================
  // Content Building Methods
  // ============================================================================

  private buildFrameworkContent(framework: DependencyInfo, analysis: SeedAnalysis): string {
    const sections: string[] = [];

    sections.push(`# ${this.formatTitle(framework.name)}\n`);
    sections.push(`${framework.category} framework for ${framework.ecosystem}.\n`);

    sections.push(`## Overview\n`);
    sections.push(`**Version:** ${framework.version}`);
    sections.push(`**Type:** ${framework.type}`);
    sections.push(`**Ecosystem:** ${framework.ecosystem}\n`);

    if (framework.usedBy.length > 0) {
      sections.push(`## Usage in This Project\n`);
      framework.usedBy.slice(0, 10).forEach(feature => {
        sections.push(`- [[${this.slugify(feature)}|${feature}]]`);
      });
      sections.push('');
    }

    if (framework.documentation && framework.documentation.length > 0) {
      sections.push(`## Documentation\n`);
      framework.documentation.forEach(url => {
        sections.push(`- [${this.getLinkText(url)}](${url})`);
      });
      sections.push('');
    }

    if (framework.repository) {
      sections.push(`## Repository\n`);
      sections.push(`- [Source Code](${framework.repository})\n`);
    }

    const related = this.findRelatedTechnologies(framework, analysis);
    if (related.length > 0) {
      sections.push(`## Related Primitives\n`);
      related.forEach(rel => {
        sections.push(`- [[${this.slugify(rel)}]]`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  private buildDependencyContent(dep: DependencyInfo, analysis: SeedAnalysis): string {
    const sections: string[] = [];

    sections.push(`# ${this.formatTitle(dep.name)}\n`);
    sections.push(`${dep.category} ${dep.type} for ${dep.ecosystem}.\n`);

    sections.push(`## Overview\n`);
    sections.push(`**Version:** ${dep.version}`);
    sections.push(`**Type:** ${dep.type}\n`);

    if (dep.usedBy.length > 0) {
      sections.push(`## Usage\n`);
      dep.usedBy.slice(0, 10).forEach(ref => {
        sections.push(`- [[${this.slugify(ref)}|${ref}]]`);
      });
      if (dep.usedBy.length > 10) {
        sections.push(`- ...and ${dep.usedBy.length - 10} more`);
      }
      sections.push('');
    }

    if (dep.documentation && dep.documentation.length > 0) {
      sections.push(`## Documentation\n`);
      dep.documentation.forEach(url => {
        sections.push(`- [${this.getLinkText(url)}](${url})`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  private buildServiceContent(service: ServiceInfo, analysis: SeedAnalysis): string {
    const sections: string[] = [];

    sections.push(`# ${this.formatTitle(service.name)}\n`);
    sections.push(`${service.type} service using ${service.technology}.\n`);

    sections.push(`## Service Details\n`);
    sections.push(`**Type:** ${service.type}`);
    sections.push(`**Technology:** ${service.technology}`);
    if (service.framework) {
      sections.push(`**Framework:** [[${this.slugify(service.framework)}|${service.framework}]]`);
    }
    if (service.language) {
      sections.push(`**Language:** [[${service.language}]]`);
    }
    sections.push('');

    if (service.ports && service.ports.length > 0) {
      sections.push(`## Ports\n`);
      service.ports.forEach(port => {
        sections.push(`- ${port}`);
      });
      sections.push('');
    }

    if (service.dependencies.length > 0) {
      sections.push(`## Dependencies\n`);
      service.dependencies.forEach(dep => {
        sections.push(`- [[${this.slugify(dep)}]]`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  private buildLanguageContent(language: string, analysis: SeedAnalysis): string {
    const sections: string[] = [];
    const langLower = language.toLowerCase();

    sections.push(`# ${this.formatTitle(language)}\n`);
    sections.push(`Programming language used in this project.\n`);

    const frameworks = analysis.frameworks.filter(f =>
      f.ecosystem === langLower ||
      (langLower === 'javascript' && f.ecosystem === 'nodejs') ||
      (langLower === 'typescript' && f.ecosystem === 'nodejs')
    );
    const dependencies = analysis.dependencies.filter(d =>
      d.ecosystem === langLower ||
      (langLower === 'javascript' && d.ecosystem === 'nodejs') ||
      (langLower === 'typescript' && d.ecosystem === 'nodejs')
    );

    if (frameworks.length > 0) {
      sections.push(`## Frameworks\n`);
      frameworks.slice(0, 10).forEach(fw => {
        sections.push(`- [[${this.slugify(fw.name)}|${this.formatTitle(fw.name)}]]`);
      });
      sections.push('');
    }

    if (dependencies.length > 0) {
      sections.push(`## Libraries (${dependencies.length})\n`);
      sections.push(`This project uses ${dependencies.length} ${language} dependencies.\n`);
    }

    sections.push(`## Resources\n`);
    sections.push(`- [Official Documentation](${this.getLanguageDocUrl(language)})`);
    sections.push('');

    return sections.join('\n');
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private findRelatedTechnologies(dep: DependencyInfo, analysis: SeedAnalysis): string[] {
    const related: string[] = [];

    // Add related frameworks in same category
    for (const other of analysis.frameworks) {
      if (other.name !== dep.name && other.category === dep.category) {
        related.push(other.name);
      }
    }

    return related.slice(0, 5);
  }

  private formatTitle(name: string): string {
    return name
      .split(/[-_/]/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private getLinkText(url: string): string {
    if (url.includes('github.com')) return 'GitHub';
    if (url.includes('npmjs.com')) return 'NPM';
    if (url.includes('pypi.org')) return 'PyPI';
    if (url.includes('crates.io')) return 'Crates.io';
    if (url.includes('pkg.go.dev')) return 'Go Docs';
    if (url.includes('packagist.org')) return 'Packagist';
    if (url.includes('mvnrepository.com')) return 'Maven';
    return 'Documentation';
  }

  private getLanguageDocUrl(language: string): string {
    const urls: Record<string, string> = {
      'javascript': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      'typescript': 'https://www.typescriptlang.org/docs/',
      'python': 'https://docs.python.org/',
      'php': 'https://www.php.net/docs.php',
      'rust': 'https://doc.rust-lang.org/',
      'go': 'https://go.dev/doc/',
      'java': 'https://docs.oracle.com/en/java/',
      'ruby': 'https://www.ruby-lang.org/en/documentation/'
    };

    return urls[language.toLowerCase()] || `https://www.google.com/search?q=${language}+documentation`;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create and run a seed analysis
 */
export async function analyzeSeed(projectRoot: string, docsPath: string): Promise<SeedAnalysis> {
  const generator = await SeedGenerator.create(projectRoot, docsPath);
  return generator.analyze();
}

/**
 * Initialize primitives from codebase analysis
 */
export async function initPrimitives(
  projectRoot: string,
  docsPath: string,
  options?: CultivationOptions
): Promise<InitPrimitivesResult> {
  const generator = await SeedGenerator.create(projectRoot, docsPath);
  return generator.initPrimitives(options);
}
