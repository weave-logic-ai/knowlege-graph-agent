/**
 * Standards Validator - Validates cultivation modules against established standards
 *
 * Validates:
 * - API styles and coding standards
 * - Data formats and documentation
 * - Implementation patterns and naming conventions
 * - Testing coverage and quality
 */

import fs from 'fs/promises';
import path from 'path';
import type { DeepAnalysisResult, PrimitiveDiscovery } from './deep-analyzer.js';

export interface StandardsValidationResult {
  passed: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  suggestions: string[];
  details: {
    naming: ValidationCategory;
    dataFormats: ValidationCategory;
    documentation: ValidationCategory;
    testing: ValidationCategory;
  };
}

export interface ValidationCategory {
  passed: boolean;
  score: number;
  errors: string[];
  warnings: string[];
}

export class StandardsValidator {
  constructor(private rootPath: string) {}

  /**
   * Validate deep-analyzer module against standards
   */
  async validateDeepAnalyzer(): Promise<StandardsValidationResult> {
    const deepAnalyzerPath = path.join(
      this.rootPath,
      'src/cultivation/deep-analyzer.ts'
    );

    const result: StandardsValidationResult = {
      passed: false,
      score: 0,
      errors: [],
      warnings: [],
      suggestions: [],
      details: {
        naming: { passed: true, score: 100, errors: [], warnings: [] },
        dataFormats: { passed: true, score: 100, errors: [], warnings: [] },
        documentation: { passed: true, score: 100, errors: [], warnings: [] },
        testing: { passed: true, score: 100, errors: [], warnings: [] },
      },
    };

    try {
      const content = await fs.readFile(deepAnalyzerPath, 'utf-8');

      // Validate naming conventions
      result.details.naming = this.validateNaming(content, deepAnalyzerPath);

      // Validate data formats
      result.details.dataFormats = this.validateDataFormats(content);

      // Validate documentation
      result.details.documentation = this.validateDocumentation(content);

      // Validate testing
      result.details.testing = await this.validateTesting();

      // Calculate overall score
      const categories = Object.values(result.details);
      result.score = Math.round(
        categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length
      );

      // Aggregate errors and warnings
      categories.forEach((cat) => {
        result.errors.push(...cat.errors);
        result.warnings.push(...cat.warnings);
      });

      result.passed = result.errors.length === 0 && result.score >= 85;

      // Add suggestions based on score
      if (result.score < 100) {
        result.suggestions.push(
          'Review /docs/standards/STANDARDS-INTEGRATION-GUIDE.md for improvement recommendations'
        );
      }
    } catch (error) {
      result.passed = false;
      result.score = 0;
      result.errors.push(`Failed to validate: ${error instanceof Error ? error.message : String(error)}`);
    }

    return result;
  }

  /**
   * Validate naming conventions
   */
  private validateNaming(
    content: string,
    filePath: string
  ): ValidationCategory {
    const result: ValidationCategory = {
      passed: true,
      score: 100,
      errors: [],
      warnings: [],
    };

    // Check file name (should be kebab-case.ts)
    const fileName = path.basename(filePath);
    if (!/^[a-z-]+\.ts$/.test(fileName)) {
      result.errors.push(`File name should be kebab-case: ${fileName}`);
      result.score -= 20;
    }

    // Check class names (should be PascalCase)
    const classMatches = content.matchAll(/export\s+class\s+(\w+)/g);
    for (const match of classMatches) {
      const className = match[1];
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
        result.errors.push(`Class name should be PascalCase: ${className}`);
        result.score -= 10;
      }
    }

    // Check interface names (should be PascalCase, no "I" prefix)
    const interfaceMatches = content.matchAll(/export\s+interface\s+(\w+)/g);
    for (const match of interfaceMatches) {
      const interfaceName = match[1];
      if (interfaceName.startsWith('I') && interfaceName[1] === interfaceName[1].toUpperCase()) {
        result.warnings.push(
          `Interface name should not have "I" prefix: ${interfaceName}`
        );
        result.score -= 5;
      }
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(interfaceName)) {
        result.errors.push(`Interface name should be PascalCase: ${interfaceName}`);
        result.score -= 10;
      }
    }

    // Check method names (should be camelCase)
    const methodMatches = content.matchAll(/\s+(\w+)\([^)]*\):\s*(?:Promise<|async)/g);
    for (const match of methodMatches) {
      const methodName = match[1];
      if (!/^[a-z][a-zA-Z0-9]*$/.test(methodName)) {
        result.warnings.push(`Method name should be camelCase: ${methodName}`);
        result.score -= 3;
      }
    }

    result.passed = result.errors.length === 0;
    result.score = Math.max(0, result.score);

    return result;
  }

  /**
   * Validate data formats
   */
  private validateDataFormats(content: string): ValidationCategory {
    const result: ValidationCategory = {
      passed: true,
      score: 100,
      errors: [],
      warnings: [],
    };

    // Check for ISO 8601 date format usage
    const dateFormatRegex = /created:\s*['"](\d{4}-\d{2}-\d{2})['"]/g;
    const dateMatches = content.match(dateFormatRegex);
    if (dateMatches) {
      dateMatches.forEach((match) => {
        if (!/\d{4}-\d{2}-\d{2}/.test(match)) {
          result.warnings.push('Date format should be ISO 8601 (YYYY-MM-DD)');
          result.score -= 5;
        }
      });
    }

    // Check for priority levels
    const priorityRegex = /'critical'\s*\|\s*'high'\s*\|\s*'medium'\s*\|\s*'low'/;
    if (!priorityRegex.test(content)) {
      result.warnings.push(
        'Priority should use 4-level system: critical | high | medium | low'
      );
      result.score -= 10;
    }

    // Check for proper category paths
    const categoryRegex = /category:\s*string/g;
    if (categoryRegex.test(content)) {
      // Check if there's documentation about category format
      if (!content.includes('PRIMITIVES.md') && !content.includes('taxonomy')) {
        result.warnings.push(
          'Category paths should be documented and match PRIMITIVES.md taxonomy'
        );
        result.score -= 5;
      }
    }

    result.passed = result.errors.length === 0;
    result.score = Math.max(0, result.score);

    return result;
  }

  /**
   * Validate documentation
   */
  private validateDocumentation(content: string): ValidationCategory {
    const result: ValidationCategory = {
      passed: true,
      score: 100,
      errors: [],
      warnings: [],
    };

    // Check for JSDoc on exported functions/classes
    const exportMatches = content.matchAll(
      /export\s+(?:async\s+)?(?:function|class)\s+(\w+)/g
    );

    for (const match of exportMatches) {
      const name = match[1];
      const index = match.index || 0;

      // Look for JSDoc comment before export
      const beforeExport = content.substring(Math.max(0, index - 200), index);
      if (!beforeExport.includes('/**')) {
        result.warnings.push(`Missing JSDoc for exported ${name}`);
        result.score -= 5;
      }
    }

    // Check for @example blocks in JSDoc
    const jsdocBlocks = content.match(/\/\*\*[\s\S]*?\*\//g);
    if (jsdocBlocks) {
      const hasExamples = jsdocBlocks.some((block) => block.includes('@example'));
      if (!hasExamples) {
        result.warnings.push('JSDoc should include @example blocks for public methods');
        result.score -= 10;
      }
    }

    // Check for inline comments explaining WHY
    const commentCount = (content.match(/\/\/ /g) || []).length;
    if (commentCount < 5) {
      result.warnings.push('Add more inline comments explaining complex logic (WHY, not WHAT)');
      result.score -= 5;
    }

    result.passed = result.errors.length === 0;
    result.score = Math.max(0, result.score);

    return result;
  }

  /**
   * Validate testing coverage
   */
  private async validateTesting(): Promise<ValidationCategory> {
    const result: ValidationCategory = {
      passed: true,
      score: 100,
      errors: [],
      warnings: [],
    };

    const testFilePath = path.join(
      this.rootPath,
      'tests/cultivation/deep-analyzer.test.ts'
    );

    try {
      await fs.access(testFilePath);

      // Read test file
      const content = await fs.readFile(testFilePath, 'utf-8');

      // Check for test count
      const testCount = (content.match(/\sit\(/g) || []).length;
      if (testCount < 5) {
        result.warnings.push(
          `Test file should have at least 5 tests, found ${testCount}`
        );
        result.score -= 15;
      }

      // Check for mocking
      if (!content.includes('vi.mock')) {
        result.warnings.push('Tests should mock external dependencies (fs, child_process)');
        result.score -= 10;
      }

      // Check for timeout tests
      if (!content.includes('timeout') && !content.includes('AbortError')) {
        result.warnings.push('Tests should cover timeout scenarios');
        result.score -= 10;
      }

      // Check for error handling tests
      if (!content.includes('error') && !content.includes('throw')) {
        result.warnings.push('Tests should cover error handling');
        result.score -= 10;
      }
    } catch {
      result.errors.push('Test file not found: tests/cultivation/deep-analyzer.test.ts');
      result.score = 0;
    }

    result.passed = result.errors.length === 0;
    result.score = Math.max(0, result.score);

    return result;
  }

  /**
   * Validate a PrimitiveDiscovery object against standards
   */
  validatePrimitive(primitive: PrimitiveDiscovery): ValidationCategory {
    const result: ValidationCategory = {
      passed: true,
      score: 100,
      errors: [],
      warnings: [],
    };

    // Validate category format
    const validPrefixes = [
      'patterns/',
      'protocols/',
      'standards/',
      'integrations/',
      'schemas/',
      'services/',
      'guides/',
      'components/',
    ];

    const categoryPrefix = primitive.category.split('/')[0] + '/';
    if (!validPrefixes.includes(categoryPrefix)) {
      result.errors.push(
        `Invalid category: ${primitive.category} (should start with one of: ${validPrefixes.join(', ')})`
      );
      result.score -= 20;
    }

    // Validate priority level
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    if (!validPriorities.includes(primitive.priority)) {
      result.errors.push(
        `Invalid priority: ${primitive.priority} (should be: ${validPriorities.join(', ')})`
      );
      result.score -= 20;
    }

    // Validate type
    const validTypes = [
      'pattern',
      'protocol',
      'standard',
      'integration',
      'schema',
      'service',
      'guide',
      'component',
    ];
    if (!validTypes.includes(primitive.type)) {
      result.errors.push(
        `Invalid type: ${primitive.type} (should be: ${validTypes.join(', ')})`
      );
      result.score -= 20;
    }

    // Validate required fields
    if (!primitive.name || primitive.name.trim() === '') {
      result.errors.push('Primitive name is required');
      result.score -= 20;
    }

    if (!primitive.description || primitive.description.trim() === '') {
      result.warnings.push('Primitive description should not be empty');
      result.score -= 10;
    }

    if (!primitive.files || primitive.files.length === 0) {
      result.warnings.push('Primitive should reference at least one file');
      result.score -= 5;
    }

    result.passed = result.errors.length === 0;
    result.score = Math.max(0, result.score);

    return result;
  }

  /**
   * Validate an analysis result against standards
   */
  validateAnalysisResult(result: DeepAnalysisResult): ValidationCategory {
    const validation: ValidationCategory = {
      passed: true,
      score: 100,
      errors: [],
      warnings: [],
    };

    // Validate all primitives
    let totalScore = 0;
    for (const primitive of result.primitives) {
      const primitiveValidation = this.validatePrimitive(primitive);
      totalScore += primitiveValidation.score;

      validation.errors.push(...primitiveValidation.errors);
      validation.warnings.push(...primitiveValidation.warnings);
    }

    if (result.primitives.length > 0) {
      validation.score = Math.round(totalScore / result.primitives.length);
    }

    validation.passed = validation.errors.length === 0;

    return validation;
  }

  /**
   * Print validation report
   */
  printReport(result: StandardsValidationResult): void {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📋 STANDARDS VALIDATION REPORT');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Overall status
    const statusIcon = result.passed ? '✅' : '❌';
    const statusText = result.passed ? 'PASSED' : 'FAILED';
    console.log(`${statusIcon} Overall Status: ${statusText}`);
    console.log(`📊 Score: ${result.score}/100\n`);

    // Category breakdown
    console.log('📂 Category Breakdown:\n');

    const categories = [
      { name: 'Naming Conventions', data: result.details.naming },
      { name: 'Data Formats', data: result.details.dataFormats },
      { name: 'Documentation', data: result.details.documentation },
      { name: 'Testing', data: result.details.testing },
    ];

    categories.forEach((cat) => {
      const icon = cat.data.passed ? '✅' : '❌';
      console.log(`  ${icon} ${cat.name}: ${cat.data.score}/100`);
    });

    // Errors
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:\n');
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:\n');
      result.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }

    // Suggestions
    if (result.suggestions.length > 0) {
      console.log('\n💡 SUGGESTIONS:\n');
      result.suggestions.forEach((suggestion, i) => {
        console.log(`  ${i + 1}. ${suggestion}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📚 DOCUMENTATION:');
    console.log('  - API & Coding Standards:      /docs/standards/api-coding-standards.md');
    console.log('  - Data & Documentation:        /docs/standards/data-documentation-standards.md');
    console.log('  - Implementation & Naming:     /docs/standards/implementation-naming-standards.md');
    console.log('  - Testing Guidelines:          /weaver/docs/standards/testing-guidelines.md');
    console.log('  - Integration Guide:           /docs/standards/STANDARDS-INTEGRATION-GUIDE.md');
    console.log('═══════════════════════════════════════════════════════════════\n');
  }
}
