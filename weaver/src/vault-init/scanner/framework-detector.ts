import { promises as fs } from 'fs';
import path from 'path';
import {
  FrameworkInfo,
  FrameworkType,
  PackageJson,
  TsConfig,
  DetectionResult,
  PackageJsonSchema,
  TsConfigSchema,
  FrameworkInfoSchema,
  DetectionResultSchema,
  PackageJsonError,
  FileSystemError,
} from './types';

/**
 * Detects the framework used in a project by analyzing package.json,
 * configuration files, and project structure.
 *
 * @param projectPath - Absolute path to the project directory
 * @returns Framework information including type, version, and features
 * @throws {PackageJsonError} If package.json is missing or invalid
 * @throws {FileSystemError} If project directory is inaccessible
 *
 * @example
 * const framework = await detectFramework('/path/to/project');
 * console.log(framework.type); // 'nextjs'
 * console.log(framework.features); // ['app-router', 'typescript', 'tailwind']
 */
export async function detectFramework(
  projectPath: string
): Promise<FrameworkInfo> {
  try {
    // Validate project path exists
    await validateProjectPath(projectPath);

    // Read and validate package.json
    const packageJson = await readPackageJson(projectPath);

    // Detect framework type and version
    const frameworkType = detectFrameworkType(packageJson);
    const version = detectVersion(packageJson, frameworkType);

    // Detect features
    const features = await detectFeatures(projectPath, packageJson, frameworkType);

    // Calculate confidence score
    const confidence = calculateConfidence(frameworkType, packageJson, features);

    const frameworkInfo: FrameworkInfo = {
      type: frameworkType,
      version,
      features,
      confidence,
      metadata: {
        hasPackageJson: true,
        packageName: packageJson.name,
      },
    };

    // Validate result
    return FrameworkInfoSchema.parse(frameworkInfo);
  } catch (error) {
    if (error instanceof PackageJsonError || error instanceof FileSystemError) {
      throw error;
    }
    throw new FileSystemError(
      `Framework detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { originalError: error }
    );
  }
}

/**
 * Performs a comprehensive detection with additional metadata
 *
 * @param projectPath - Absolute path to the project directory
 * @returns Detailed detection result with all findings
 */
export async function detectFrameworkDetailed(
  projectPath: string
): Promise<DetectionResult> {
  const framework = await detectFramework(projectPath);
  const packageJson = await readPackageJson(projectPath);
  const hasTypeScript = await checkTypeScriptConfig(projectPath);
  const hasTailwind = await checkTailwindConfig(projectPath);

  const result: DetectionResult = {
    framework,
    packageJson,
    hasTypeScript,
    hasTailwind,
    detectedAt: new Date(),
    projectPath,
  };

  return DetectionResultSchema.parse(result);
}

/**
 * Validates that the project path exists and is accessible
 */
async function validateProjectPath(projectPath: string): Promise<void> {
  try {
    const stats = await fs.stat(projectPath);
    if (!stats.isDirectory()) {
      throw new FileSystemError(`Path is not a directory: ${projectPath}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FileSystemError(`Project directory not found: ${projectPath}`);
    }
    // Re-throw FileSystemError to preserve the message
    if (error instanceof FileSystemError) {
      throw error;
    }
    throw new FileSystemError(
      `Cannot access project directory: ${projectPath}`,
      { originalError: error }
    );
  }
}

/**
 * Reads and parses package.json with validation
 */
async function readPackageJson(projectPath: string): Promise<PackageJson> {
  const packageJsonPath = path.join(projectPath, 'package.json');

  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const parsed = JSON.parse(content);
    return PackageJsonSchema.parse(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new PackageJsonError(`package.json not found at: ${packageJsonPath}`);
    }
    if (error instanceof SyntaxError) {
      throw new PackageJsonError(`Invalid JSON in package.json: ${error.message}`);
    }
    throw new PackageJsonError(
      `Failed to read package.json: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { originalError: error }
    );
  }
}

/**
 * Detects the primary framework type from package.json dependencies
 */
function detectFrameworkType(packageJson: PackageJson): FrameworkType {
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  // Check for Next.js (highest priority)
  if (allDeps['next']) {
    return 'nextjs';
  }

  // Check for React
  if (allDeps['react']) {
    return 'react';
  }

  // Check for TypeScript-only project
  if (allDeps['typescript'] || allDeps['@types/node']) {
    return 'typescript';
  }

  // Default to Node.js if none of the above
  if (Object.keys(allDeps).length > 0) {
    return 'nodejs';
  }

  return 'unknown';
}

/**
 * Detects the framework version from package.json
 */
function detectVersion(
  packageJson: PackageJson,
  frameworkType: FrameworkType
): string | undefined {
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  switch (frameworkType) {
    case 'nextjs':
      return allDeps['next']?.replace(/^[\^~]/, '');
    case 'react':
      return allDeps['react']?.replace(/^[\^~]/, '');
    case 'typescript':
      return allDeps['typescript']?.replace(/^[\^~]/, '');
    default:
      return packageJson.version;
  }
}

/**
 * Detects framework-specific features by analyzing project structure
 */
async function detectFeatures(
  projectPath: string,
  packageJson: PackageJson,
  frameworkType: FrameworkType
): Promise<string[]> {
  const features: string[] = [];

  // TypeScript detection
  if (await checkTypeScriptConfig(projectPath)) {
    features.push('typescript');
  }

  // Tailwind CSS detection
  if (await checkTailwindConfig(projectPath)) {
    features.push('tailwind');
  }

  // Framework-specific features
  if (frameworkType === 'nextjs') {
    const nextFeatures = await detectNextJsFeatures(projectPath);
    features.push(...nextFeatures);
  }

  if (frameworkType === 'react') {
    const reactFeatures = await detectReactFeatures(packageJson);
    features.push(...reactFeatures);
  }

  return [...new Set(features)]; // Remove duplicates
}

/**
 * Detects Next.js specific features (App Router vs Pages Router)
 */
async function detectNextJsFeatures(projectPath: string): Promise<string[]> {
  const features: string[] = [];

  // Check for App Router (Next.js 13+)
  const appDir = path.join(projectPath, 'app');
  const hasAppRouter = await pathExists(appDir);
  if (hasAppRouter) {
    features.push('app-router');
  }

  // Check for Pages Router
  const pagesDir = path.join(projectPath, 'pages');
  const hasPagesRouter = await pathExists(pagesDir);
  if (hasPagesRouter) {
    features.push('pages-router');
  }

  // Check for src directory
  const srcDir = path.join(projectPath, 'src');
  const hasSrc = await pathExists(srcDir);
  if (hasSrc) {
    features.push('src-directory');

    // Check for app/pages inside src
    const srcAppDir = path.join(srcDir, 'app');
    const srcPagesDir = path.join(srcDir, 'pages');

    if (await pathExists(srcAppDir)) {
      features.push('app-router');
    }
    if (await pathExists(srcPagesDir)) {
      features.push('pages-router');
    }
  }

  // Check for API routes
  const apiDir = hasSrc
    ? path.join(srcDir, 'pages', 'api')
    : path.join(pagesDir, 'api');
  if (await pathExists(apiDir)) {
    features.push('api-routes');
  }

  return features;
}

/**
 * Detects React specific features
 */
async function detectReactFeatures(packageJson: PackageJson): Promise<string[]> {
  const features: string[] = [];
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  // Check for React Router
  if (allDeps['react-router-dom']) {
    features.push('react-router');
  }

  // Check for state management libraries
  if (allDeps['redux'] || allDeps['@reduxjs/toolkit']) {
    features.push('redux');
  }
  if (allDeps['zustand']) {
    features.push('zustand');
  }
  if (allDeps['jotai']) {
    features.push('jotai');
  }

  // Check for testing libraries
  if (allDeps['@testing-library/react']) {
    features.push('testing-library');
  }

  return features;
}

/**
 * Checks if TypeScript is configured
 */
async function checkTypeScriptConfig(projectPath: string): Promise<boolean> {
  const tsConfigPath = path.join(projectPath, 'tsconfig.json');
  return pathExists(tsConfigPath);
}

/**
 * Checks if Tailwind CSS is configured
 */
async function checkTailwindConfig(projectPath: string): Promise<boolean> {
  const configFiles = [
    'tailwind.config.js',
    'tailwind.config.ts',
    'tailwind.config.cjs',
    'tailwind.config.mjs',
  ];

  for (const configFile of configFiles) {
    const configPath = path.join(projectPath, configFile);
    if (await pathExists(configPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a path exists
 */
async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates confidence score for the detection
 */
function calculateConfidence(
  frameworkType: FrameworkType,
  packageJson: PackageJson,
  features: string[]
): number {
  if (frameworkType === 'unknown') {
    return 0;
  }

  let confidence = 50; // Base confidence

  // Increase confidence if we have a version
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  if (frameworkType === 'nextjs' && allDeps['next']) {
    confidence += 30;
  } else if (frameworkType === 'react' && allDeps['react']) {
    confidence += 30;
  } else if (frameworkType === 'typescript' && allDeps['typescript']) {
    confidence += 30;
  }

  // Increase confidence based on detected features
  confidence += Math.min(features.length * 5, 20);

  return Math.min(confidence, 100);
}

/**
 * Reads and parses tsconfig.json if it exists
 */
export async function readTsConfig(projectPath: string): Promise<TsConfig | null> {
  const tsConfigPath = path.join(projectPath, 'tsconfig.json');

  try {
    const content = await fs.readFile(tsConfigPath, 'utf-8');
    // Remove comments - handle single-line and multi-line comments
    // This regex removes:
    // 1. Multi-line comments: /* ... */
    // 2. Single-line comments: // ...
    // But preserves comment-like content within strings
    const jsonContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*/g, ''); // Remove // comments
    const parsed = JSON.parse(jsonContent);
    return TsConfigSchema.parse(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw new FileSystemError(
      `Failed to read tsconfig.json: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { originalError: error }
    );
  }
}
