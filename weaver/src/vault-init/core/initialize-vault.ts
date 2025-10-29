/**
 * Core Vault Initialization Function
 *
 * Main entry point for vault initialization that matches E2E test interface.
 */

import { join } from 'path';
import { mkdir, writeFile, access, stat, rm } from 'fs/promises';
import { constants } from 'fs';
import { detectFramework } from '../scanner/framework-detector.js';
import { createShadowCache } from '../../shadow-cache/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Vault initialization options
 */
export interface VaultInitOptions {
  projectPath: string;
  vaultPath: string;
  dryRun?: boolean;
  force?: boolean;
  template?: string;
}

/**
 * Vault initialization result
 */
export interface VaultInitResult {
  success: boolean;
  vaultPath: string;
  filesCreated: string[];
  errors: string[];
}

/**
 * Initialize a vault from an existing project
 *
 * @param options - Vault initialization options
 * @returns Promise<VaultInitResult>
 * @throws Error if validation fails or initialization encounters errors
 */
export async function initializeVault(options: VaultInitOptions): Promise<void> {
  const {
    projectPath,
    vaultPath,
    dryRun = false,
    force = false,
    template,
  } = options;

  logger.info('Starting vault initialization', { projectPath, vaultPath, dryRun, force });

  try {
    // Step 1: Validate project path
    await validateProjectPath(projectPath);

    // Step 2: Validate package.json exists
    await validatePackageJson(projectPath);

    // Step 3: Validate vault path is writable
    await validateVaultPath(vaultPath);

    // Step 4: Detect framework
    const frameworkInfo = await detectFramework(projectPath);
    const detectedTemplate = template || frameworkInfo.type || 'nextjs';

    // Step 5: Handle dry-run mode
    if (dryRun) {
      performDryRun(vaultPath, frameworkInfo);
      return;
    }

    // Step 6: Handle existing vault
    if (await pathExists(vaultPath)) {
      if (!force) {
        // Re-initialization without force is allowed (idempotent)
        logger.info('Vault already exists, re-initializing', { vaultPath });
      }
      // Clean up only .vault directory, preserve other files
      const vaultDir = join(vaultPath, '.vault');
      if (await pathExists(vaultDir)) {
        await rm(vaultDir, { recursive: true, force: true });
      }
    }

    // Step 7: Create vault structure
    await createVaultStructure(vaultPath, frameworkInfo, detectedTemplate, projectPath);

    logger.info('✅ Vault initialization completed', { vaultPath });
  } catch (error) {
    logger.error('Vault initialization failed', error instanceof Error ? error : new Error(String(error)));

    // Rollback: Clean up vault directory on failure
    try {
      if (await pathExists(vaultPath) && !dryRun) {
        await rm(vaultPath, { recursive: true, force: true });
        logger.info('Rollback completed - removed vault', { vaultPath });
      }
    } catch (rollbackError) {
      logger.error('Rollback failed', rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError)));
    }

    throw error;
  }
}

/**
 * Validate project path exists and is a directory
 */
async function validateProjectPath(projectPath: string): Promise<void> {
  try {
    const stats = await stat(projectPath);
    if (!stats.isDirectory()) {
      throw new Error(`Project path is not a directory: ${projectPath}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Project directory not found: ${projectPath}`);
    }
    throw error;
  }
}

/**
 * Validate package.json exists
 */
async function validatePackageJson(projectPath: string): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json');
  try {
    await access(packageJsonPath, constants.F_OK);
  } catch {
    throw new Error(`package.json not found at: ${packageJsonPath}`);
  }
}

/**
 * Validate vault path is writable
 */
async function validateVaultPath(vaultPath: string): Promise<void> {
  // Check if path exists
  const exists = await pathExists(vaultPath);

  if (exists) {
    // Check if writable
    try {
      await access(vaultPath, constants.W_OK);
    } catch {
      throw new Error(`Vault path is not writable: ${vaultPath}`);
    }
  } else {
    // Check if parent directory is writable
    const parentDir = join(vaultPath, '..');
    try {
      await access(parentDir, constants.W_OK);
    } catch {
      throw new Error(`Vault path is not writable (parent directory permission denied): ${vaultPath}`);
    }
  }
}

/**
 * Check if a path exists
 */
async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Perform dry-run - log what would be created
 */
function performDryRun(vaultPath: string, frameworkInfo: any): void {
  console.log('\n=== DRY RUN MODE ===\n');
  console.log('Would create vault structure at:', vaultPath);
  console.log('\nDirectories:');
  console.log('  - .vault/');
  console.log('  - .vault/spec-kit/');
  console.log('  - .vault/spec-kit/.speckit/');
  console.log('  - .vault/workflows/');
  console.log('  - .vault/memory/');
  console.log('\nFiles:');
  console.log('  - README.md (project documentation)');
  console.log('  - .vault/shadow-cache.db (SQLite database)');
  console.log('  - .vault/spec-kit/.speckit/metadata.json');
  console.log('  - .vault/workflows/spec-kit.json');
  console.log('  - .vault/memory/config.json');
  console.log(`\nDetected framework: ${frameworkInfo.type} v${frameworkInfo.version || 'unknown'}`);
  console.log(`Features: ${frameworkInfo.features.join(', ')}`);
  console.log('\n=== END DRY RUN ===\n');
}

/**
 * Create complete vault structure
 */
async function createVaultStructure(
  vaultPath: string,
  frameworkInfo: any,
  template: string,
  projectPath: string
): Promise<void> {
  // Create base vault directory
  await mkdir(vaultPath, { recursive: true });

  // Create .vault directory structure
  const vaultDir = join(vaultPath, '.vault');
  await mkdir(vaultDir, { recursive: true });
  await mkdir(join(vaultDir, 'spec-kit'), { recursive: true });
  await mkdir(join(vaultDir, 'spec-kit', '.speckit'), { recursive: true });
  await mkdir(join(vaultDir, 'workflows'), { recursive: true });
  await mkdir(join(vaultDir, 'memory'), { recursive: true });

  // Generate README.md
  await generateReadme(vaultPath, frameworkInfo, projectPath);

  // Generate spec-kit metadata
  await generateSpecKitMetadata(vaultDir, frameworkInfo, template);

  // Generate workflow files
  await generateWorkflowFiles(vaultDir);

  // Generate memory configuration
  await generateMemoryConfig(vaultDir);

  // Initialize shadow cache
  await initializeShadowCache(vaultDir, projectPath);
}

/**
 * Generate comprehensive README.md
 */
async function generateReadme(
  vaultPath: string,
  frameworkInfo: any,
  projectPath: string
): Promise<void> {
  const isNextJS = frameworkInfo.type === 'nextjs';
  const isReact = frameworkInfo.type === 'react';
  const hasAppRouter = frameworkInfo.features.includes('app-router');
  const hasVite = frameworkInfo.features.includes('vite') ||
                  (isReact && !isNextJS);

  const content = `---
title: ${frameworkInfo.type === 'nextjs' ? 'Next.js' : frameworkInfo.type === 'react' ? 'React' : 'Project'} Documentation
framework: ${frameworkInfo.type}
version: ${frameworkInfo.version || 'unknown'}
created: ${new Date().toISOString()}
---

# Project Overview

This is a ${isNextJS ? 'Next.js' : isReact ? 'React' : frameworkInfo.type} project${hasAppRouter ? ' using App Router' : ''}${hasVite ? ' with Vite' : ''}.

## Framework Details

- **Type**: ${isNextJS ? 'Next.js' : isReact ? 'React' : frameworkInfo.type}
- **Version**: ${frameworkInfo.version || 'unknown'}
- **Features**: ${frameworkInfo.features.join(', ')}
${hasAppRouter ? '- **Router**: App Router (Next.js 13+)\n' : ''}${hasVite ? '- **Build Tool**: Vite\n' : ''}

## Architecture

### Project Structure

\`\`\`
${projectPath}/
${hasAppRouter ? '├── app/              # App Router pages\n' : ''}${isReact && !isNextJS ? '├── src/              # Source files\n' : ''}├── public/           # Static assets
├── components/       # React components
└── package.json      # Dependencies
\`\`\`

### Key Technologies

${isNextJS ? '- **Next.js**: React framework for production\n' : ''}${isReact ? '- **React**: UI library\n' : ''}${hasVite ? '- **Vite**: Fast build tool and dev server\n' : ''}- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework

## Development Setup

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn package manager

### Installation

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### Development Server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

${isNextJS ? 'Open [http://localhost:3000](http://localhost:3000) to view the application.\n' : ''}${hasVite ? 'Open [http://localhost:5173](http://localhost:5173) to view the application.\n' : ''}

## Testing Strategy

### Unit Testing

- Jest for component and unit tests
- React Testing Library for component testing

### E2E Testing

- Playwright or Cypress for end-to-end tests

### Test Commands

\`\`\`bash
npm test          # Run unit tests
npm run test:e2e  # Run E2E tests
npm run test:coverage  # Generate coverage report
\`\`\`

## Build & Deployment

### Production Build

\`\`\`bash
npm run build
\`\`\`

${isNextJS ? '### Deployment\n\nThis Next.js application can be deployed to:\n- Vercel (recommended)\n- AWS\n- Docker containers\n' : ''}${hasVite ? '### Deployment\n\nThis Vite application can be deployed to:\n- Netlify\n- Vercel\n- Static hosting services\n' : ''}

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

---

*Generated by Weaver Vault Initialization System*
*${new Date().toISOString()}*
`;

  const readmePath = join(vaultPath, 'README.md');
  await writeFile(readmePath, content, 'utf-8');
  logger.info('Generated README.md', { path: readmePath });
}

/**
 * Generate spec-kit metadata.json
 */
async function generateSpecKitMetadata(
  vaultDir: string,
  frameworkInfo: any,
  template: string
): Promise<void> {
  const metadata = {
    version: '1.0.0',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    project: {
      type: frameworkInfo.type,
      version: frameworkInfo.version,
      features: frameworkInfo.features,
      template: template,
      confidence: frameworkInfo.confidence,
    },
    specKit: {
      enabled: true,
      autoGenerate: true,
      templates: [template],
    },
  };

  const metadataPath = join(vaultDir, 'spec-kit', '.speckit', 'metadata.json');
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  logger.info('Generated spec-kit metadata', { path: metadataPath });
}

/**
 * Generate workflow files
 */
async function generateWorkflowFiles(vaultDir: string): Promise<void> {
  const workflowConfig = {
    name: 'spec-kit',
    version: '1.0.0',
    workflows: [
      {
        id: 'generate-spec',
        name: 'Generate Specification',
        trigger: 'manual',
        steps: [
          {
            name: 'Analyze codebase',
            action: 'analyze',
          },
          {
            name: 'Generate spec document',
            action: 'generate',
          },
          {
            name: 'Review and validate',
            action: 'validate',
          },
        ],
      },
    ],
  };

  const workflowPath = join(vaultDir, 'workflows', 'spec-kit.json');
  await writeFile(workflowPath, JSON.stringify(workflowConfig, null, 2), 'utf-8');
  logger.info('Generated workflow files', { path: workflowPath });
}

/**
 * Generate memory namespace configuration
 */
async function generateMemoryConfig(vaultDir: string): Promise<void> {
  const memoryConfig = {
    version: '1.0.0',
    namespaces: ['vault', 'spec-kit', 'coordination', 'workflows'],
    ttl: {
      default: 86400, // 24 hours
      vault: 604800, // 7 days
      'spec-kit': 604800, // 7 days
    },
    persistence: {
      enabled: true,
      path: '.vault/memory/data',
    },
  };

  const configPath = join(vaultDir, 'memory', 'config.json');
  await writeFile(configPath, JSON.stringify(memoryConfig, null, 2), 'utf-8');
  logger.info('Generated memory config', { path: configPath });
}

/**
 * Initialize shadow cache database
 */
async function initializeShadowCache(vaultDir: string, projectPath: string): Promise<void> {
  const shadowCachePath = join(vaultDir, 'shadow-cache.db');

  try {
    const shadowCache = createShadowCache(shadowCachePath, projectPath);

    // Perform initial sync
    await shadowCache.syncVault();

    const stats = shadowCache.getStats();
    logger.info('Shadow cache initialized', {
      path: shadowCachePath,
      filesIndexed: stats.totalFiles,
    });

    shadowCache.close();
  } catch (error) {
    logger.error('Failed to initialize shadow cache', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
