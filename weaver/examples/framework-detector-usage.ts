/**
 * Framework Detector Usage Examples
 * Demonstrates how to use the framework detection system
 */

import {
  detectFramework,
  detectFrameworkDetailed,
  readTsConfig,
  type FrameworkInfo,
  type DetectionResult,
} from '../src/vault-init/scanner';

/**
 * Example 1: Basic Framework Detection
 */
async function example1BasicDetection() {
  console.log('=== Example 1: Basic Framework Detection ===\n');

  try {
    // Detect framework for the current project
    const framework = await detectFramework(process.cwd());

    console.log('Framework Type:', framework.type);
    console.log('Version:', framework.version);
    console.log('Features:', framework.features);
    console.log('Confidence:', `${framework.confidence}%`);
    console.log('Metadata:', framework.metadata);
  } catch (error) {
    console.error('Detection failed:', error);
  }
}

/**
 * Example 2: Detailed Detection with Full Analysis
 */
async function example2DetailedDetection() {
  console.log('\n=== Example 2: Detailed Detection ===\n');

  try {
    const result = await detectFrameworkDetailed(process.cwd());

    console.log('Framework:', result.framework.type, result.framework.version);
    console.log('Has TypeScript:', result.hasTypeScript);
    console.log('Has Tailwind:', result.hasTailwind);
    console.log('Package Name:', result.packageJson?.name);
    console.log('Detected At:', result.detectedAt.toISOString());
    console.log('Project Path:', result.projectPath);
    console.log('\nAll Features:');
    result.framework.features.forEach((feature) => {
      console.log(`  - ${feature}`);
    });
  } catch (error) {
    console.error('Detailed detection failed:', error);
  }
}

/**
 * Example 3: TypeScript Configuration Analysis
 */
async function example3TypeScriptConfig() {
  console.log('\n=== Example 3: TypeScript Configuration ===\n');

  try {
    const tsConfig = await readTsConfig(process.cwd());

    if (tsConfig) {
      console.log('TypeScript Config Found!');
      console.log('Compiler Options:', JSON.stringify(tsConfig.compilerOptions, null, 2));
      console.log('Include:', tsConfig.include);
      console.log('Exclude:', tsConfig.exclude);
    } else {
      console.log('No TypeScript configuration found');
    }
  } catch (error) {
    console.error('Failed to read tsconfig:', error);
  }
}

/**
 * Example 4: Multiple Project Detection
 */
async function example4MultipleProjects() {
  console.log('\n=== Example 4: Multiple Project Detection ===\n');

  const projects = [
    process.cwd(),
    // Add more project paths as needed
  ];

  for (const projectPath of projects) {
    try {
      const framework = await detectFramework(projectPath);
      console.log(`\n${projectPath}:`);
      console.log(`  Type: ${framework.type}`);
      console.log(`  Version: ${framework.version || 'N/A'}`);
      console.log(`  Features: ${framework.features.join(', ')}`);
    } catch (error) {
      console.error(`  Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
}

/**
 * Example 5: Feature-Based Logic
 */
async function example5FeatureBasedLogic() {
  console.log('\n=== Example 5: Feature-Based Logic ===\n');

  try {
    const framework = await detectFramework(process.cwd());

    // Next.js specific logic
    if (framework.type === 'nextjs') {
      console.log('Next.js project detected!');

      if (framework.features.includes('app-router')) {
        console.log('  ✓ Using App Router (Next.js 13+)');
        console.log('  → Initialize app directory structure');
      }

      if (framework.features.includes('pages-router')) {
        console.log('  ✓ Using Pages Router');
        console.log('  → Initialize pages directory structure');
      }

      if (framework.features.includes('api-routes')) {
        console.log('  ✓ API routes detected');
        console.log('  → Setup API route handlers');
      }
    }

    // TypeScript logic
    if (framework.features.includes('typescript')) {
      console.log('\n✓ TypeScript enabled');
      console.log('  → Generate type definitions');
      console.log('  → Configure strict mode');
    }

    // Tailwind logic
    if (framework.features.includes('tailwind')) {
      console.log('\n✓ Tailwind CSS configured');
      console.log('  → Generate Tailwind-specific utilities');
    }
  } catch (error) {
    console.error('Feature detection failed:', error);
  }
}

/**
 * Example 6: Confidence-Based Validation
 */
async function example6ConfidenceValidation() {
  console.log('\n=== Example 6: Confidence-Based Validation ===\n');

  try {
    const framework = await detectFramework(process.cwd());
    const confidence = framework.confidence || 0;

    console.log(`Detection Confidence: ${confidence}%`);

    if (confidence >= 80) {
      console.log('✓ High confidence - proceed with automated setup');
    } else if (confidence >= 50) {
      console.log('⚠ Medium confidence - request user confirmation');
      console.log('Detected:', framework.type);
      console.log('Please confirm this is correct');
    } else {
      console.log('✗ Low confidence - manual configuration required');
      console.log('Could not reliably detect framework');
    }
  } catch (error) {
    console.error('Validation failed:', error);
  }
}

/**
 * Example 7: Error Handling Patterns
 */
async function example7ErrorHandling() {
  console.log('\n=== Example 7: Error Handling Patterns ===\n');

  const testPaths = [
    process.cwd(),
    '/nonexistent/path',
    __filename, // File instead of directory
  ];

  for (const testPath of testPaths) {
    try {
      console.log(`\nTesting: ${testPath}`);
      const framework = await detectFramework(testPath);
      console.log(`  ✓ Success: ${framework.type}`);
    } catch (error) {
      if (error instanceof Error) {
        console.log(`  ✗ Error: ${error.name}`);
        console.log(`     Message: ${error.message}`);
      }
    }
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  await example1BasicDetection();
  await example2DetailedDetection();
  await example3TypeScriptConfig();
  await example4MultipleProjects();
  await example5FeatureBasedLogic();
  await example6ConfidenceValidation();
  await example7ErrorHandling();

  console.log('\n=== All Examples Completed ===\n');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1BasicDetection,
  example2DetailedDetection,
  example3TypeScriptConfig,
  example4MultipleProjects,
  example5FeatureBasedLogic,
  example6ConfidenceValidation,
  example7ErrorHandling,
};
