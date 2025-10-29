#!/usr/bin/env tsx
/**
 * Metadata Validation Workflow
 * Validates all markdown files against schema v3.0
 */

import { readFile, writeFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import matter from 'gray-matter';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

interface ValidationResult {
  filePath: string;
  valid: boolean;
  errors?: any[];
  coverage: {
    required: number;
    optional: number;
    total: number;
  };
}

interface ValidationReport {
  totalFiles: number;
  validFiles: number;
  invalidFiles: number;
  filesWithoutMetadata: number;
  averageCoverage: number;
  results: ValidationResult[];
}

/**
 * Find all markdown files
 */
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

/**
 * Calculate metadata coverage
 */
function calculateCoverage(metadata: any, schema: any): { required: number; optional: number; total: number } {
  const requiredFields = schema.required || [];
  const allFields = Object.keys(schema.properties || {});

  const presentRequired = requiredFields.filter((f: string) => metadata[f] !== undefined).length;
  const presentOptional = allFields.filter((f: string) =>
    !requiredFields.includes(f) && metadata[f] !== undefined
  ).length;

  return {
    required: requiredFields.length > 0 ? (presentRequired / requiredFields.length) * 100 : 100,
    optional: (allFields.length - requiredFields.length) > 0
      ? (presentOptional / (allFields.length - requiredFields.length)) * 100
      : 100,
    total: allFields.length > 0 ? ((presentRequired + presentOptional) / allFields.length) * 100 : 0,
  };
}

/**
 * Validate a single file
 */
async function validateFile(
  filePath: string,
  schema: any,
  baseDir: string
): Promise<ValidationResult> {
  try {
    const fileContent = await readFile(filePath, 'utf-8');
    const parsed = matter(fileContent);

    if (!parsed.data || Object.keys(parsed.data).length === 0) {
      return {
        filePath: relative(baseDir, filePath),
        valid: false,
        errors: [{ message: 'No frontmatter found' }],
        coverage: { required: 0, optional: 0, total: 0 },
      };
    }

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(parsed.data);

    const coverage = calculateCoverage(parsed.data, schema);

    return {
      filePath: relative(baseDir, filePath),
      valid,
      errors: validate.errors || undefined,
      coverage,
    };
  } catch (error) {
    return {
      filePath: relative(baseDir, filePath),
      valid: false,
      errors: [{ message: String(error) }],
      coverage: { required: 0, optional: 0, total: 0 },
    };
  }
}

/**
 * Validate all files
 */
async function validateAllFiles(
  targetDir: string,
  schemaPath: string
): Promise<ValidationReport> {
  console.log('🔍 Metadata Validation Workflow\n');
  console.log(`📂 Target: ${targetDir}`);
  console.log(`📋 Schema: ${schemaPath}\n`);

  // Load schema
  const schemaContent = await readFile(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaContent);
  console.log('✅ Schema loaded\n');

  // Find files
  console.log('🔍 Scanning for markdown files...');
  const files = await findMarkdownFiles(targetDir);
  console.log(`📄 Found ${files.length} files\n`);

  // Validate all
  console.log('⚡ Validating files...\n');
  const results = await Promise.all(
    files.map(file => validateFile(file, schema, targetDir))
  );

  // Generate report
  const validFiles = results.filter(r => r.valid).length;
  const invalidFiles = results.filter(r => !r.valid).length;
  const filesWithoutMetadata = results.filter(r =>
    r.errors?.some(e => e.message === 'No frontmatter found')
  ).length;

  const averageCoverage = results.reduce((sum, r) => sum + r.coverage.total, 0) / results.length;

  const report: ValidationReport = {
    totalFiles: files.length,
    validFiles,
    invalidFiles,
    filesWithoutMetadata,
    averageCoverage,
    results,
  };

  // Print summary
  console.log('📊 Validation Summary\n');
  console.log(`Total files: ${report.totalFiles}`);
  console.log(`✅ Valid: ${report.validFiles} (${((validFiles / files.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Invalid: ${report.invalidFiles}`);
  console.log(`📝 Without metadata: ${report.filesWithoutMetadata}`);
  console.log(`📈 Average coverage: ${report.averageCoverage.toFixed(1)}%\n`);

  // Print invalid files
  if (invalidFiles > 0) {
    console.log('❌ Invalid Files:\n');
    results
      .filter(r => !r.valid)
      .slice(0, 20) // Limit output
      .forEach(r => {
        console.log(`  ${r.filePath}`);
        r.errors?.slice(0, 3).forEach(e => {
          console.log(`    - ${e.message || JSON.stringify(e)}`);
        });
      });

    if (invalidFiles > 20) {
      console.log(`\n  ... and ${invalidFiles - 20} more\n`);
    }
  }

  // Coverage statistics
  console.log('📊 Coverage Statistics:\n');
  const coverageRanges = {
    '90-100%': results.filter(r => r.coverage.total >= 90).length,
    '70-89%': results.filter(r => r.coverage.total >= 70 && r.coverage.total < 90).length,
    '50-69%': results.filter(r => r.coverage.total >= 50 && r.coverage.total < 70).length,
    '<50%': results.filter(r => r.coverage.total < 50).length,
  };

  Object.entries(coverageRanges).forEach(([range, count]) => {
    console.log(`  ${range}: ${count} files (${((count / files.length) * 100).toFixed(1)}%)`);
  });

  return report;
}

/**
 * Generate detailed report
 */
async function generateReport(
  report: ValidationReport,
  outputPath: string
): Promise<void> {
  const markdown = `# Metadata Validation Report

**Generated:** ${new Date().toISOString()}

## Summary

- **Total Files:** ${report.totalFiles}
- **Valid Files:** ${report.validFiles} (${((report.validFiles / report.totalFiles) * 100).toFixed(1)}%)
- **Invalid Files:** ${report.invalidFiles}
- **Files Without Metadata:** ${report.filesWithoutMetadata}
- **Average Coverage:** ${report.averageCoverage.toFixed(1)}%

## Coverage Distribution

| Range | Count | Percentage |
|-------|-------|------------|
| 90-100% | ${report.results.filter(r => r.coverage.total >= 90).length} | ${((report.results.filter(r => r.coverage.total >= 90).length / report.totalFiles) * 100).toFixed(1)}% |
| 70-89% | ${report.results.filter(r => r.coverage.total >= 70 && r.coverage.total < 90).length} | ${((report.results.filter(r => r.coverage.total >= 70 && r.coverage.total < 90).length / report.totalFiles) * 100).toFixed(1)}% |
| 50-69% | ${report.results.filter(r => r.coverage.total >= 50 && r.coverage.total < 70).length} | ${((report.results.filter(r => r.coverage.total >= 50 && r.coverage.total < 70).length / report.totalFiles) * 100).toFixed(1)}% |
| <50% | ${report.results.filter(r => r.coverage.total < 50).length} | ${((report.results.filter(r => r.coverage.total < 50).length / report.totalFiles) * 100).toFixed(1)}% |

## Invalid Files

${report.results
  .filter(r => !r.valid)
  .map(r => `### ${r.filePath}\n\n${r.errors?.map(e => `- ${e.message || JSON.stringify(e)}`).join('\n') || 'Unknown error'}\n\n**Coverage:** ${r.coverage.total.toFixed(1)}%\n`)
  .join('\n')}

## Low Coverage Files (<70%)

${report.results
  .filter(r => r.coverage.total < 70)
  .sort((a, b) => a.coverage.total - b.coverage.total)
  .slice(0, 50)
  .map(r => `- ${r.filePath} (${r.coverage.total.toFixed(1)}%)`)
  .join('\n')}
`;

  await writeFile(outputPath, markdown, 'utf-8');
  console.log(`\n📄 Detailed report saved to: ${outputPath}`);
}

// CLI execution
const args = process.argv.slice(2);
const targetDir = args.find(a => a.startsWith('--target='))?.split('=')[1] || '/home/aepod/dev/weave-nn/weave-nn';
const schemaPath = args.find(a => a.startsWith('--schema='))?.split('=')[1] || '/home/aepod/dev/weave-nn/weaver/schemas/metadata-v3.schema.json';
const outputPath = args.find(a => a.startsWith('--output='))?.split('=')[1] || '/home/aepod/dev/weave-nn/weaver/docs/metadata/validation-report.md';

validateAllFiles(targetDir, schemaPath)
  .then(report => generateReport(report, outputPath))
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

export { validateAllFiles, generateReport, type ValidationReport };
