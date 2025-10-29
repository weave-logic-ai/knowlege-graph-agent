/**
 * Context Loader - Load vault context files for intelligent cultivation
 */

import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { glob } from 'glob';
import type { VaultContext } from './types.js';

export class ContextLoader {
  constructor(private vaultRoot: string) {}

  /**
   * Load complete vault context including primitives, features, and tech specs
   */
  async loadContext(): Promise<VaultContext> {
    const [primitives, features, techSpecs, allFiles] = await Promise.all([
      this.loadPrimitives(),
      this.loadFeatures(),
      this.loadTechSpecs(),
      this.findAllMarkdownFiles(),
    ]);

    return {
      primitives,
      features,
      techSpecs,
      vaultRoot: this.vaultRoot,
      allFiles,
    };
  }

  /**
   * Load primitives.md - foundational concepts and building blocks
   */
  private async loadPrimitives(): Promise<string | undefined> {
    const possiblePaths = [
      join(this.vaultRoot, 'primitives.md'),
      join(this.vaultRoot, 'docs/primitives.md'),
      join(this.vaultRoot, '_planning/primitives.md'),
    ];

    for (const path of possiblePaths) {
      try {
        await access(path);
        return await readFile(path, 'utf-8');
      } catch {
        continue;
      }
    }

    return undefined;
  }

  /**
   * Load features.md - current feature set and capabilities
   */
  private async loadFeatures(): Promise<string | undefined> {
    const possiblePaths = [
      join(this.vaultRoot, 'features.md'),
      join(this.vaultRoot, 'docs/features.md'),
      join(this.vaultRoot, '_planning/features.md'),
      join(this.vaultRoot, 'FEATURES.md'),
    ];

    for (const path of possiblePaths) {
      try {
        await access(path);
        return await readFile(path, 'utf-8');
      } catch {
        continue;
      }
    }

    return undefined;
  }

  /**
   * Load tech-specs.md - technical specifications and architecture
   */
  private async loadTechSpecs(): Promise<string | undefined> {
    const possiblePaths = [
      join(this.vaultRoot, 'tech-specs.md'),
      join(this.vaultRoot, 'docs/tech-specs.md'),
      join(this.vaultRoot, '_planning/tech-specs.md'),
      join(this.vaultRoot, 'TECH-SPECS.md'),
      join(this.vaultRoot, 'technical-specifications.md'),
    ];

    for (const path of possiblePaths) {
      try {
        await access(path);
        return await readFile(path, 'utf-8');
      } catch {
        continue;
      }
    }

    return undefined;
  }

  /**
   * Find all markdown files in vault
   */
  private async findAllMarkdownFiles(): Promise<string[]> {
    const pattern = join(this.vaultRoot, '**/*.md');
    const files = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.weaver/**',
        '**/.workflow-data/**',
        '**/.next/**',
      ],
    });

    return files;
  }

  /**
   * Extract concepts from primitives.md
   */
  extractConcepts(primitives: string): string[] {
    const concepts: string[] = [];

    // Extract ## headings as concepts
    const headingRegex = /^##\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(primitives)) !== null) {
      concepts.push(match[1].trim());
    }

    // Extract bulleted list items under concept sections
    const listItemRegex = /^[-*]\s+\*\*([^*]+)\*\*/gm;

    while ((match = listItemRegex.exec(primitives)) !== null) {
      concepts.push(match[1].trim());
    }

    return [...new Set(concepts)]; // Remove duplicates
  }

  /**
   * Extract features from features.md
   */
  extractFeatures(features: string): string[] {
    const featureList: string[] = [];

    // Similar extraction logic as concepts
    const headingRegex = /^##\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(features)) !== null) {
      featureList.push(match[1].trim());
    }

    return [...new Set(featureList)];
  }

  /**
   * Extract technical areas from tech-specs.md
   */
  extractTechnicalAreas(techSpecs: string): string[] {
    const areas: string[] = [];

    const headingRegex = /^##\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(techSpecs)) !== null) {
      areas.push(match[1].trim());
    }

    return [...new Set(areas)];
  }
}
