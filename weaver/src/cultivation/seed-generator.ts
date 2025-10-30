/**
 * Seed Generator - Bootstrap vault with primitive nodes from codebase analysis
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
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import matter from 'gray-matter';
import type { VaultContext, GeneratedDocument, DocumentMetadata } from './types.js';

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'framework' | 'library' | 'tool' | 'service' | 'language';
  category: string;
  ecosystem: 'nodejs' | 'python' | 'php' | 'rust' | 'go' | 'java' | 'ruby' | 'other';
  description?: string;
  documentation?: string[];
  repository?: string;
  usedBy: string[];
  relatedTo: string[];
}

export interface ServiceInfo {
  name: string;
  type: 'api' | 'database' | 'queue' | 'cache' | 'storage' | 'compute' | 'monitoring';
  technology: string;
  framework?: string;
  language?: string;
  dependencies: string[];
  endpoints?: string[];
}

export interface SeedAnalysis {
  dependencies: DependencyInfo[];
  services: ServiceInfo[];
  frameworks: DependencyInfo[];
  languages: string[];
  deployments: string[];
  existingConcepts: string[];
  existingFeatures: string[];
}

export class SeedGenerator {
  constructor(
    private vaultContext: VaultContext,
    private projectRoot: string
  ) {}

  /**
   * Analyze entire codebase and generate seed data
   */
  async analyze(): Promise<SeedAnalysis> {
    const analysis: SeedAnalysis = {
      dependencies: [],
      services: [],
      frameworks: [],
      languages: [],
      deployments: [],
      existingConcepts: [],
      existingFeatures: []
    };

    // Analyze dependency files
    await this.analyzeDependencies(analysis);

    // Analyze existing vault documents
    await this.analyzeVaultDocuments(analysis);

    // Analyze service configurations
    await this.analyzeServices(analysis);

    // Analyze deployment manifests
    await this.analyzeDeployments(analysis);

    // Classify dependencies
    this.classifyDependencies(analysis);

    return analysis;
  }

  /**
   * Generate primitive nodes from seed analysis
   */
  async generatePrimitives(analysis: SeedAnalysis): Promise<GeneratedDocument[]> {
    const documents: GeneratedDocument[] = [];

    // Generate nodes for frameworks
    for (const framework of analysis.frameworks) {
      const doc = this.generateFrameworkNode(framework, analysis);
      documents.push(doc);
    }

    // Generate nodes for major dependencies
    for (const dep of analysis.dependencies) {
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

    return documents;
  }

  /**
   * Analyze package manager dependency files
   */
  private async analyzeDependencies(analysis: SeedAnalysis): Promise<void> {
    // Node.js - package.json
    await this.analyzePackageJson(analysis);

    // Python - requirements.txt, pyproject.toml
    await this.analyzePython(analysis);

    // PHP - composer.json
    await this.analyzeComposer(analysis);

    // Rust - Cargo.toml
    await this.analyzeCargo(analysis);

    // Go - go.mod
    await this.analyzeGoMod(analysis);

    // Java - pom.xml, build.gradle
    await this.analyzeJava(analysis);
  }

  /**
   * Analyze package.json for Node.js dependencies
   */
  private async analyzePackageJson(analysis: SeedAnalysis): Promise<void> {
    const packageJsonPaths = [
      join(this.projectRoot, 'package.json'),
      join(this.projectRoot, 'weaver/package.json')
    ];

    for (const path of packageJsonPaths) {
      try {
        const content = await readFile(path, 'utf-8');
        const pkg = JSON.parse(content);

        analysis.languages.push('javascript', 'typescript');

        // Process dependencies
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies
        };

        for (const [name, version] of Object.entries(allDeps)) {
          const dep: DependencyInfo = {
            name,
            version: version as string,
            type: this.inferDependencyType(name),
            category: this.inferCategory(name),
            ecosystem: 'nodejs',
            documentation: this.getDocumentationLinks(name, 'nodejs'),
            repository: this.getRepositoryUrl(name, 'nodejs'),
            usedBy: [],
            relatedTo: []
          };

          analysis.dependencies.push(dep);
        }
      } catch {
        // File doesn't exist, skip
      }
    }
  }

  /**
   * Analyze Python dependencies
   */
  private async analyzePython(analysis: SeedAnalysis): Promise<void> {
    // requirements.txt
    const requirementsPaths = [
      join(this.projectRoot, 'requirements.txt'),
      join(this.projectRoot, 'requirements-dev.txt')
    ];

    for (const path of requirementsPaths) {
      try {
        const content = await readFile(path, 'utf-8');
        const lines = content.split('\n');

        analysis.languages.push('python');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;

          const match = trimmed.match(/^([a-zA-Z0-9-_]+)(?:==|>=|<=|~=|>|<)?(.+)?$/);
          if (match) {
            const [, name, version] = match;
            const dep: DependencyInfo = {
              name,
              version: version?.trim() || 'latest',
              type: this.inferDependencyType(name),
              category: this.inferCategory(name),
              ecosystem: 'python',
              documentation: this.getDocumentationLinks(name, 'python'),
              repository: this.getRepositoryUrl(name, 'python'),
              usedBy: [],
              relatedTo: []
            };

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
      // Basic TOML parsing for dependencies section
      const depMatch = content.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?=\[|$)/);
      if (depMatch) {
        const lines = depMatch[1].split('\n');
        for (const line of lines) {
          const match = line.match(/^([a-zA-Z0-9-_]+)\s*=\s*"([^"]+)"/);
          if (match) {
            const [, name, version] = match;
            if (name !== 'python') {
              const dep: DependencyInfo = {
                name,
                version,
                type: this.inferDependencyType(name),
                category: this.inferCategory(name),
                ecosystem: 'python',
                documentation: this.getDocumentationLinks(name, 'python'),
                usedBy: [],
                relatedTo: []
              };
              analysis.dependencies.push(dep);
            }
          }
        }
      }
    } catch {
      // File doesn't exist
    }
  }

  /**
   * Analyze composer.json for PHP dependencies
   */
  private async analyzeComposer(analysis: SeedAnalysis): Promise<void> {
    try {
      const content = await readFile(join(this.projectRoot, 'composer.json'), 'utf-8');
      const composer = JSON.parse(content);

      analysis.languages.push('php');

      const allDeps = {
        ...composer.require,
        ...composer['require-dev']
      };

      for (const [name, version] of Object.entries(allDeps)) {
        if (name === 'php') continue;

        const dep: DependencyInfo = {
          name,
          version: version as string,
          type: this.inferDependencyType(name),
          category: this.inferCategory(name),
          ecosystem: 'php',
          documentation: this.getDocumentationLinks(name, 'php'),
          usedBy: [],
          relatedTo: []
        };

        analysis.dependencies.push(dep);
      }
    } catch {
      // File doesn't exist
    }
  }

  /**
   * Analyze Cargo.toml for Rust dependencies
   */
  private async analyzeCargo(analysis: SeedAnalysis): Promise<void> {
    try {
      const content = await readFile(join(this.projectRoot, 'Cargo.toml'), 'utf-8');

      analysis.languages.push('rust');

      // Basic TOML parsing
      const depMatch = content.match(/\[dependencies\]([\s\S]*?)(?=\[|$)/);
      if (depMatch) {
        const lines = depMatch[1].split('\n');
        for (const line of lines) {
          const match = line.match(/^([a-zA-Z0-9-_]+)\s*=\s*"([^"]+)"/);
          if (match) {
            const [, name, version] = match;
            const dep: DependencyInfo = {
              name,
              version,
              type: this.inferDependencyType(name),
              category: this.inferCategory(name),
              ecosystem: 'rust',
              documentation: this.getDocumentationLinks(name, 'rust'),
              repository: `https://crates.io/crates/${name}`,
              usedBy: [],
              relatedTo: []
            };
            analysis.dependencies.push(dep);
          }
        }
      }
    } catch {
      // File doesn't exist
    }
  }

  /**
   * Analyze go.mod for Go dependencies
   */
  private async analyzeGoMod(analysis: SeedAnalysis): Promise<void> {
    try {
      const content = await readFile(join(this.projectRoot, 'go.mod'), 'utf-8');

      analysis.languages.push('go');

      const lines = content.split('\n');
      let inRequire = false;

      for (const line of lines) {
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
            const dep: DependencyInfo = {
              name,
              version,
              type: this.inferDependencyType(name),
              category: this.inferCategory(name),
              ecosystem: 'go',
              documentation: [`https://pkg.go.dev/${name}`],
              repository: `https://${name}`,
              usedBy: [],
              relatedTo: []
            };
            analysis.dependencies.push(dep);
          }
        }
      }
    } catch {
      // File doesn't exist
    }
  }

  /**
   * Analyze Java dependencies (basic support)
   */
  private async analyzeJava(analysis: SeedAnalysis): Promise<void> {
    // pom.xml (Maven)
    try {
      const content = await readFile(join(this.projectRoot, 'pom.xml'), 'utf-8');
      analysis.languages.push('java');

      // Basic XML parsing for dependencies
      const depMatches = content.matchAll(/<dependency>[\s\S]*?<groupId>([^<]+)<\/groupId>[\s\S]*?<artifactId>([^<]+)<\/artifactId>[\s\S]*?(?:<version>([^<]+)<\/version>)?[\s\S]*?<\/dependency>/g);

      for (const match of depMatches) {
        const [, groupId, artifactId, version] = match;
        const name = `${groupId}:${artifactId}`;
        const dep: DependencyInfo = {
          name,
          version: version || 'latest',
          type: this.inferDependencyType(artifactId),
          category: this.inferCategory(artifactId),
          ecosystem: 'java',
          documentation: [`https://mvnrepository.com/artifact/${groupId}/${artifactId}`],
          usedBy: [],
          relatedTo: []
        };
        analysis.dependencies.push(dep);
      }
    } catch {
      // File doesn't exist
    }
  }

  /**
   * Analyze existing vault documents for context
   */
  private async analyzeVaultDocuments(analysis: SeedAnalysis): Promise<void> {
    for (const filePath of this.vaultContext.allFiles) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const { data } = matter(content);

        if (data.type === 'concept') {
          analysis.existingConcepts.push(data.title || filePath);
        } else if (data.type === 'feature') {
          analysis.existingFeatures.push(data.title || filePath);
        }

        // Extract mentions of dependencies
        for (const dep of analysis.dependencies) {
          if (content.toLowerCase().includes(dep.name.toLowerCase())) {
            dep.usedBy.push(data.title || filePath);
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }
  }

  /**
   * Analyze service configurations
   */
  private async analyzeServices(analysis: SeedAnalysis): Promise<void> {
    // Look for docker-compose.yml, kubernetes manifests, etc.
    const serviceFiles = [
      'docker-compose.yml',
      'docker-compose.yaml',
      'k8s/deployment.yaml',
      'kubernetes/deployment.yaml'
    ];

    for (const file of serviceFiles) {
      try {
        const content = await readFile(join(this.projectRoot, file), 'utf-8');

        // Basic YAML service detection
        if (file.includes('docker-compose')) {
          const serviceMatches = content.matchAll(/^\s{2}([a-zA-Z0-9-_]+):/gm);
          for (const match of serviceMatches) {
            const serviceName = match[1];
            if (!['version', 'services', 'volumes', 'networks'].includes(serviceName)) {
              // Extract service info
              const serviceSection = content.match(new RegExp(`${serviceName}:[\\s\\S]*?(?=^\\s{2}\\w|$)`, 'm'));
              if (serviceSection) {
                const imageMatch = serviceSection[0].match(/image:\s*([^\s]+)/);
                const service: ServiceInfo = {
                  name: serviceName,
                  type: this.inferServiceType(serviceName, imageMatch?.[1]),
                  technology: imageMatch?.[1]?.split(':')[0] || 'unknown',
                  dependencies: []
                };
                analysis.services.push(service);
              }
            }
          }
        }
      } catch {
        // File doesn't exist
      }
    }
  }

  /**
   * Analyze deployment configurations
   */
  private async analyzeDeployments(analysis: SeedAnalysis): Promise<void> {
    const deploymentIndicators = [
      'Dockerfile',
      'docker-compose.yml',
      '.github/workflows',
      'vercel.json',
      'netlify.toml',
      'railway.json'
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

  /**
   * Classify dependencies into frameworks vs libraries
   */
  private classifyDependencies(analysis: SeedAnalysis): void {
    const frameworkKeywords = [
      'express', 'fastify', 'koa', 'hapi', 'nest',
      'react', 'vue', 'angular', 'svelte', 'solid',
      'next', 'nuxt', 'gatsby', 'remix',
      'django', 'flask', 'fastapi', 'rails', 'laravel',
      'spring', 'quarkus', 'micronaut',
      'actix', 'rocket', 'axum',
      'gin', 'echo', 'fiber'
    ];

    for (const dep of analysis.dependencies) {
      const nameLower = dep.name.toLowerCase();
      if (frameworkKeywords.some(fw => nameLower.includes(fw))) {
        dep.type = 'framework';
        analysis.frameworks.push(dep);
      }
    }
  }

  /**
   * Generate framework primitive node
   */
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
      tags: ['framework', framework.ecosystem, framework.category],
      documentation: framework.documentation,
      repository: framework.repository,
      used_by: framework.usedBy,
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

  /**
   * Generate dependency primitive node
   */
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
      tags: [dep.type, dep.ecosystem, dep.category],
      documentation: dep.documentation,
      repository: dep.repository,
      used_by: dep.usedBy,
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

  /**
   * Generate service primitive node
   */
  private generateServiceNode(service: ServiceInfo, analysis: SeedAnalysis): GeneratedDocument {
    const title = this.formatTitle(service.name);
    const content = this.buildServiceContent(service, analysis);

    const frontmatter: DocumentMetadata = {
      title,
      type: 'primitive',
      category: 'service',
      service_type: service.type,
      technology: service.technology,
      status: 'active',
      tags: ['service', service.type, service.technology],
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString()
    };

    return {
      type: 'primitive',
      path: join(this.vaultContext.vaultRoot, 'services', service.type, `${this.slugify(service.name)}.md`),
      title,
      content,
      frontmatter,
      backlinks: []
    };
  }

  /**
   * Generate language primitive node
   */
  private generateLanguageNode(language: string, analysis: SeedAnalysis): GeneratedDocument {
    const title = this.formatTitle(language);
    const content = this.buildLanguageContent(language, analysis);

    const frontmatter: DocumentMetadata = {
      title,
      type: 'primitive',
      category: 'language',
      status: 'active',
      tags: ['language', 'programming'],
      created: new Date().toISOString().split('T')[0],
      updated: new Date().toISOString()
    };

    return {
      type: 'primitive',
      path: join(this.vaultContext.vaultRoot, 'standards', 'programming-languages', `${language.toLowerCase()}.md`),
      title,
      content,
      frontmatter,
      backlinks: []
    };
  }

  /**
   * Build framework content with rich metadata
   */
  private buildFrameworkContent(framework: DependencyInfo, analysis: SeedAnalysis): string {
    const sections: string[] = [];

    sections.push(`# ${this.formatTitle(framework.name)}\n`);

    if (framework.description) {
      sections.push(`${framework.description}\n`);
    } else {
      sections.push(`${framework.category} framework for ${framework.ecosystem}.\n`);
    }

    sections.push(`## Overview\n`);
    sections.push(`**Version:** ${framework.version}`);
    sections.push(`**Type:** ${framework.type}`);
    sections.push(`**Ecosystem:** ${framework.ecosystem}\n`);

    if (framework.usedBy.length > 0) {
      sections.push(`## Usage in This Project\n`);
      sections.push(`Used by:\n`);
      framework.usedBy.forEach(feature => {
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

    // Related technologies
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

  /**
   * Build dependency content
   */
  private buildDependencyContent(dep: DependencyInfo, analysis: SeedAnalysis): string {
    const sections: string[] = [];

    sections.push(`# ${this.formatTitle(dep.name)}\n`);
    sections.push(`${dep.category} ${dep.type} for ${dep.ecosystem}.\n`);

    sections.push(`## Overview\n`);
    sections.push(`**Version:** ${dep.version}`);
    sections.push(`**Type:** ${dep.type}\n`);

    if (dep.usedBy.length > 0) {
      sections.push(`## Usage\n`);
      sections.push(`Referenced in:\n`);
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

  /**
   * Build service content
   */
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

    if (service.dependencies.length > 0) {
      sections.push(`## Dependencies\n`);
      service.dependencies.forEach(dep => {
        sections.push(`- [[${this.slugify(dep)}]]`);
      });
      sections.push('');
    }

    if (service.endpoints && service.endpoints.length > 0) {
      sections.push(`## Endpoints\n`);
      service.endpoints.forEach(endpoint => {
        sections.push(`- ${endpoint}`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Build language content
   */
  private buildLanguageContent(language: string, analysis: SeedAnalysis): string {
    const sections: string[] = [];

    sections.push(`# ${this.formatTitle(language)}\n`);
    sections.push(`Programming language used in this project.\n`);

    const frameworks = analysis.frameworks.filter(f => f.ecosystem === language);
    const dependencies = analysis.dependencies.filter(d => d.ecosystem === language);

    if (frameworks.length > 0) {
      sections.push(`## Frameworks\n`);
      frameworks.slice(0, 10).forEach(fw => {
        sections.push(`- [[${this.slugify(fw.name)}|${this.formatTitle(fw.name)}]]`);
      });
      sections.push('');
    }

    if (dependencies.length > 0) {
      sections.push(`## Libraries (${dependencies.length})\n`);
      sections.push(`See [[${language}-dependencies]] for complete list.\n`);
    }

    sections.push(`## Resources\n`);
    sections.push(`- [Official Documentation](${this.getLanguageDocUrl(language)})`);
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Helper methods
   */

  private shouldGenerateNode(dep: DependencyInfo): boolean {
    // Only generate nodes for major dependencies
    const majorPackages = [
      'react', 'vue', 'angular',
      'typescript', 'webpack', 'vite',
      'jest', 'vitest', 'mocha',
      'express', 'fastify', 'koa',
      'prisma', 'typeorm', 'sequelize',
      'axios', 'fetch', 'graphql'
    ];

    return dep.type === 'framework' ||
           majorPackages.some(pkg => dep.name.toLowerCase().includes(pkg));
  }

  private inferDependencyType(name: string): 'framework' | 'library' | 'tool' | 'service' | 'language' {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('eslint') || nameLower.includes('prettier') || nameLower.includes('webpack')) {
      return 'tool';
    }

    return 'library';
  }

  /**
   * Map dependency to PRIMITIVES.md vault structure
   * Uses top-level categories from the vault taxonomy
   */
  private inferCategory(name: string): string {
    const nameLower = name.toLowerCase();

    // Frontend frameworks & UI libraries → components/ui
    if (nameLower.includes('react') || nameLower.includes('vue') || nameLower.includes('angular') || nameLower.includes('svelte')) return 'components/ui';
    if (nameLower.includes('radix') || nameLower.includes('shadcn') || nameLower.includes('chakra') || nameLower.includes('mui')) return 'components/ui';

    // Backend frameworks → services/api
    if (nameLower.includes('express') || nameLower.includes('fastapi') || nameLower.includes('django') || nameLower.includes('flask') || nameLower.includes('next')) return 'services/api';

    // Database/ORM → integrations/databases
    if (nameLower.includes('prisma') || nameLower.includes('typeorm') || nameLower.includes('sequelize') || nameLower.includes('mongoose')) return 'integrations/databases';
    if (nameLower.includes('pg') || nameLower.includes('mysql') || nameLower.includes('sqlite')) return 'integrations/databases';

    // Auth libraries → integrations/auth-providers
    if (nameLower.includes('auth') || nameLower.includes('passport') || nameLower.includes('jwt') || nameLower.includes('oauth')) return 'integrations/auth-providers';

    // Testing → guides/testing
    if (nameLower.includes('test') || nameLower.includes('jest') || nameLower.includes('mocha') || nameLower.includes('vitest') || nameLower.includes('cypress')) return 'guides/testing';

    // Build tools → standards/build-tools
    if (nameLower.includes('webpack') || nameLower.includes('vite') || nameLower.includes('rollup') || nameLower.includes('esbuild') || nameLower.includes('turbo')) return 'standards/build-tools';

    // Linters/formatters → standards/coding-standards
    if (nameLower.includes('eslint') || nameLower.includes('prettier') || nameLower.includes('stylelint')) return 'standards/coding-standards';

    // Type definitions → components/utilities
    if (nameLower.includes('@types') || nameLower.includes('typescript')) return 'components/utilities';

    // Icons/assets → components/utilities
    if (nameLower.includes('icon') || nameLower.includes('lucide') || nameLower.includes('heroicons')) return 'components/utilities';

    // Storage/cloud → integrations/storage
    if (nameLower.includes('s3') || nameLower.includes('storage') || nameLower.includes('blob')) return 'integrations/storage';

    // Monitoring/analytics → integrations/monitoring
    if (nameLower.includes('sentry') || nameLower.includes('analytics') || nameLower.includes('datadog')) return 'integrations/monitoring';

    // Default to components/utilities
    return 'components/utilities';
  }

  private getDocumentationLinks(name: string, ecosystem: string): string[] {
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
    }

    return links;
  }

  private getRepositoryUrl(name: string, ecosystem: string): string | undefined {
    // This would ideally query the package registry API
    // For now, return undefined and let it be filled by package.json homepage
    return undefined;
  }

  private inferServiceType(name: string, image?: string): ServiceInfo['type'] {
    const nameLower = name.toLowerCase();
    const imageLower = image?.toLowerCase() || '';

    if (nameLower.includes('db') || nameLower.includes('database') ||
        imageLower.includes('postgres') || imageLower.includes('mysql') || imageLower.includes('mongo')) {
      return 'database';
    }
    if (nameLower.includes('cache') || imageLower.includes('redis')) return 'cache';
    if (nameLower.includes('queue') || imageLower.includes('rabbitmq') || imageLower.includes('kafka')) return 'queue';
    if (nameLower.includes('api') || nameLower.includes('backend')) return 'api';
    if (nameLower.includes('storage') || imageLower.includes('minio')) return 'storage';

    return 'compute';
  }

  private findRelatedTechnologies(dep: DependencyInfo, analysis: SeedAnalysis): string[] {
    const related: string[] = [];

    // Add language
    if (dep.ecosystem) {
      related.push(dep.ecosystem);
    }

    // Add related frameworks in same category
    for (const other of analysis.frameworks) {
      if (other.name !== dep.name && other.category === dep.category) {
        related.push(other.name);
      }
    }

    return related.slice(0, 5);
  }

  private formatTitle(name: string): string {
    // Convert package names to readable titles
    return name
      .split(/[-_/]/)
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
    if (url.includes('docs.')) return 'Official Docs';
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
