/**
 * Document Generator - Generate missing documentation using AI agents
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import matter from 'gray-matter';
import type {
  VaultContext,
  DocumentGenerationRequest,
  GeneratedDocument,
  GapAnalysis,
  DocumentMetadata,
} from './types.js';
import { AgentOrchestrator } from './agent-orchestrator.js';

export class DocumentGenerator {
  private orchestrator: AgentOrchestrator;

  constructor(
    private context: VaultContext,
    private useAgents: boolean = true
  ) {
    this.orchestrator = new AgentOrchestrator(context);
  }

  /**
   * Analyze vault for missing documentation
   */
  async analyzeGaps(): Promise<GapAnalysis> {
    const analysis: GapAnalysis = {
      missingConcepts: [],
      missingFeatures: [],
      missingArchitecture: [],
      missingIntegrations: [],
      improvementAreas: [],
      replacementNeeded: [],
    };

    // Extract expected concepts from primitives.md
    if (this.context.primitives) {
      const expectedConcepts = this.extractExpectedConcepts(this.context.primitives);
      const existingConcepts = this.findExistingDocuments('concepts');

      analysis.missingConcepts = expectedConcepts.filter(
        concept => !this.hasDocument(concept, existingConcepts)
      );
    }

    // Extract expected features from features.md
    if (this.context.features) {
      const expectedFeatures = this.extractExpectedFeatures(this.context.features);
      const existingFeatures = this.findExistingDocuments('features');

      analysis.missingFeatures = expectedFeatures.filter(
        feature => !this.hasDocument(feature, existingFeatures)
      );

      // Check for features needing improvement
      analysis.improvementAreas = this.findImprovementAreas(this.context.features);
    }

    // Extract expected architecture docs from tech-specs.md
    if (this.context.techSpecs) {
      const expectedArch = this.extractExpectedArchitecture(this.context.techSpecs);
      const existingArch = this.findExistingDocuments('architecture');

      analysis.missingArchitecture = expectedArch.filter(
        arch => !this.hasDocument(arch, existingArch)
      );

      // Check for components needing replacement
      analysis.replacementNeeded = this.findReplacementNeeds(this.context.techSpecs);
    }

    // Identify missing integrations
    const expectedIntegrations = this.extractExpectedIntegrations();
    const existingIntegrations = this.findExistingDocuments('integrations');

    analysis.missingIntegrations = expectedIntegrations.filter(
      integration => !this.hasDocument(integration, existingIntegrations)
    );

    return analysis;
  }

  /**
   * Generate missing documents based on gap analysis
   */
  async generateMissingDocuments(
    gaps: GapAnalysis,
    dryRun: boolean = false
  ): Promise<GeneratedDocument[]> {
    const requests: DocumentGenerationRequest[] = [];

    // Generate concept documents
    gaps.missingConcepts.forEach(concept => {
      requests.push({
        type: 'concept',
        title: concept,
        description: `Documentation for the ${concept} concept`,
        targetPath: this.getTargetPath('concepts', concept),
        context: {
          primitives: this.context.primitives,
          features: this.context.features,
        },
        priority: 'high',
      });
    });

    // Generate feature documents
    gaps.missingFeatures.forEach(feature => {
      requests.push({
        type: 'feature',
        title: feature,
        description: `Feature documentation for ${feature}`,
        targetPath: this.getTargetPath('features', feature),
        context: {
          primitives: this.context.primitives,
          features: this.context.features,
          techSpecs: this.context.techSpecs,
        },
        priority: 'high',
      });
    });

    // Generate architecture documents
    gaps.missingArchitecture.forEach(arch => {
      requests.push({
        type: 'architecture',
        title: arch,
        description: `Architecture documentation for ${arch}`,
        targetPath: this.getTargetPath('architecture', arch),
        context: {
          techSpecs: this.context.techSpecs,
          features: this.context.features,
        },
        priority: 'medium',
      });
    });

    // Generate integration documents
    gaps.missingIntegrations.forEach(integration => {
      requests.push({
        type: 'integration',
        title: integration,
        description: `Integration guide for ${integration}`,
        targetPath: this.getTargetPath('integrations', integration),
        context: {
          techSpecs: this.context.techSpecs,
        },
        priority: 'medium',
      });
    });

    // Use agents to generate documents in parallel
    const generated: GeneratedDocument[] = [];

    if (this.useAgents && requests.length > 0) {
      const results = await this.orchestrator.generateDocuments(requests);
      generated.push(...results);
    } else {
      // Fallback: generate simple templates
      for (const request of requests) {
        const doc = this.generateTemplate(request);
        generated.push(doc);
      }
    }

    // Write documents if not dry run
    if (!dryRun) {
      for (const doc of generated) {
        await this.writeDocument(doc);
      }
    }

    return generated;
  }

  /**
   * Extract expected concepts from primitives.md
   */
  private extractExpectedConcepts(primitives: string): string[] {
    const concepts: string[] = [];

    // Extract headings
    const headingRegex = /^##\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(primitives)) !== null) {
      concepts.push(match[1].trim());
    }

    // Extract bold items
    const boldRegex = /\*\*([^*]+)\*\*/g;
    while ((match = boldRegex.exec(primitives)) !== null) {
      const item = match[1].trim();
      if (item.length > 3 && !item.includes(':')) {
        concepts.push(item);
      }
    }

    return [...new Set(concepts)];
  }

  /**
   * Extract expected features from features.md
   */
  private extractExpectedFeatures(features: string): string[] {
    const featureList: string[] = [];

    const headingRegex = /^##\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(features)) !== null) {
      featureList.push(match[1].trim());
    }

    return [...new Set(featureList)];
  }

  /**
   * Extract expected architecture from tech-specs.md
   */
  private extractExpectedArchitecture(techSpecs: string): string[] {
    const archList: string[] = [];

    const headingRegex = /^##\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(techSpecs)) !== null) {
      archList.push(match[1].trim());
    }

    return [...new Set(archList)];
  }

  /**
   * Extract expected integrations (from primitives and tech-specs)
   */
  private extractExpectedIntegrations(): string[] {
    const integrations: string[] = [];

    // Common integration patterns
    const patterns = [
      'Obsidian',
      'Claude',
      'GitHub',
      'MCP',
      'REST API',
      'GraphQL',
    ];

    // Check if mentioned in context
    const allContext = [
      this.context.primitives || '',
      this.context.features || '',
      this.context.techSpecs || '',
    ].join('\n');

    patterns.forEach(pattern => {
      if (allContext.includes(pattern)) {
        integrations.push(pattern);
      }
    });

    return integrations;
  }

  /**
   * Find improvement areas from features.md
   */
  private findImprovementAreas(features: string): string[] {
    const improvements: string[] = [];

    // Look for TODO, FIXME, IMPROVE markers
    const patterns = [
      /TODO:\s*(.+)/gi,
      /FIXME:\s*(.+)/gi,
      /IMPROVE:\s*(.+)/gi,
      /Enhancement:\s*(.+)/gi,
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(features)) !== null) {
        improvements.push(match[1].trim());
      }
    });

    return improvements;
  }

  /**
   * Find components needing replacement from tech-specs.md
   */
  private findReplacementNeeds(techSpecs: string): Array<{
    area: string;
    current: string;
    reason: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const replacements: Array<{
      area: string;
      current: string;
      reason: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    // Look for "deprecated", "replace", "migrate" keywords
    const deprecatedRegex = /deprecated|replace|migrate|legacy/gi;

    if (deprecatedRegex.test(techSpecs)) {
      // Extract sections mentioning these keywords
      const lines = techSpecs.split('\n');
      let currentSection = '';

      lines.forEach(line => {
        if (line.startsWith('## ')) {
          currentSection = line.replace('## ', '').trim();
        }

        if (deprecatedRegex.test(line) && currentSection) {
          replacements.push({
            area: currentSection,
            current: line.trim(),
            reason: 'Marked for replacement in tech-specs',
            priority: 'high',
          });
        }
      });
    }

    return replacements;
  }

  /**
   * Check if document exists
   */
  private hasDocument(name: string, existing: string[]): boolean {
    const normalized = name.toLowerCase().replace(/\s+/g, '-');
    return existing.some(path =>
      path.toLowerCase().includes(normalized)
    );
  }

  /**
   * Find existing documents of a type
   */
  private findExistingDocuments(type: string): string[] {
    return this.context.allFiles.filter(file =>
      file.includes(`/${type}/`) || file.includes(`/${type}.md`)
    );
  }

  /**
   * Get target path for new document
   */
  private getTargetPath(category: string, name: string): string {
    const filename = name.toLowerCase().replace(/\s+/g, '-') + '.md';
    return join(this.context.vaultRoot, category, filename);
  }

  /**
   * Generate simple template document
   */
  private generateTemplate(request: DocumentGenerationRequest): GeneratedDocument {
    const frontmatter: DocumentMetadata = {
      title: request.title,
      type: request.type,
      status: 'draft',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: [request.type, 'generated', 'needs-review'],
      priority: request.priority,
    };

    const content = this.buildTemplateContent(request);

    return {
      type: request.type,
      path: request.targetPath,
      title: request.title,
      content,
      frontmatter,
      backlinks: [],
    };
  }

  /**
   * Build template content based on type
   */
  private buildTemplateContent(request: DocumentGenerationRequest): string {
    const sections: string[] = [];

    sections.push(`# ${request.title}\n`);
    sections.push(`${request.description}\n`);
    sections.push(`## Overview\n`);
    sections.push(`[Overview content to be added]\n`);

    switch (request.type) {
      case 'concept':
        sections.push(`## Definition\n`);
        sections.push(`[Concept definition]\n`);
        sections.push(`## Key Properties\n`);
        sections.push(`[Properties and characteristics]\n`);
        sections.push(`## Related Concepts\n`);
        sections.push(`[Related concepts and links]\n`);
        break;

      case 'feature':
        sections.push(`## Description\n`);
        sections.push(`[Feature description]\n`);
        sections.push(`## Requirements\n`);
        sections.push(`[Feature requirements]\n`);
        sections.push(`## Implementation\n`);
        sections.push(`[Implementation details]\n`);
        sections.push(`## Usage\n`);
        sections.push(`[Usage examples]\n`);
        break;

      case 'architecture':
        sections.push(`## Design\n`);
        sections.push(`[Architecture design]\n`);
        sections.push(`## Components\n`);
        sections.push(`[Key components]\n`);
        sections.push(`## Patterns\n`);
        sections.push(`[Design patterns used]\n`);
        break;

      case 'integration':
        sections.push(`## Setup\n`);
        sections.push(`[Setup instructions]\n`);
        sections.push(`## Configuration\n`);
        sections.push(`[Configuration details]\n`);
        sections.push(`## Usage\n`);
        sections.push(`[Usage guide]\n`);
        break;
    }

    sections.push(`## References\n`);
    if (request.context.primitives) {
      sections.push(`- [[primitives]]\n`);
    }
    if (request.context.features) {
      sections.push(`- [[features]]\n`);
    }
    if (request.context.techSpecs) {
      sections.push(`- [[tech-specs]]\n`);
    }

    return sections.join('\n');
  }

  /**
   * Write document to file
   */
  private async writeDocument(doc: GeneratedDocument): Promise<void> {
    // Create directory if needed
    await mkdir(dirname(doc.path), { recursive: true });

    // Build complete content with frontmatter
    const fullContent = matter.stringify(doc.content, doc.frontmatter);

    // Write file
    await writeFile(doc.path, fullContent, 'utf-8');
  }
}
