/**
 * Knowledge Graph Validation Workflow
 *
 * Validates the knowledge graph for:
 * - Orphaned files
 * - Broken wikilinks
 * - Missing/invalid metadata
 * - Hub coverage
 * - Connection density
 *
 * Generates comprehensive metrics and reports.
 *
 * @workflow
 */
'use workflow';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { analyzeStructure, type StructureAnalysis, type Statistics } from './analyze-structure';

export interface ValidationConfig {
  checkOrphans: boolean;
  checkBrokenLinks: boolean;
  checkMetadata: boolean;
  checkHubCoverage: boolean;
  generateReport: boolean;
  outputPath?: string;
}

export interface KnowledgeGraphMetrics {
  // Coverage Metrics
  totalFiles: number;
  orphanedFiles: number;
  orphanPercentage: number;

  // Connection Metrics
  totalConnections: number;
  avgConnectionsPerFile: number;
  connectionDensity: number;

  // Metadata Metrics
  filesWithMetadata: number;
  metadataCoverage: number;
  compliantMetadata: number;

  // Hub Metrics
  totalHubs: number;
  hubCoverage: number;
  avgDocsPerHub: number;

  // Quality Metrics
  brokenLinks: number;
  duplicateLinks: number;
  circularReferences: number;

  // Progress Metrics
  improvementSinceBaseline: number;
  targetOrphans: number;
  remainingWork: number;
}

export interface ValidationResult {
  timestamp: string;
  metrics: KnowledgeGraphMetrics;
  analysis: StructureAnalysis;
  validationErrors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
  success: boolean;
}

export interface ValidationError {
  type: 'broken_link' | 'invalid_metadata' | 'missing_hub';
  file: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: 'orphan' | 'low_connections' | 'missing_tags' | 'missing_hub';
  file: string;
  message: string;
}

/**
 * Main validation workflow
 */
export async function validateGraph(
  config: ValidationConfig,
  rootPath: string = '/home/aepod/dev/weave-nn'
): Promise<ValidationResult> {
  console.log('🔍 Validating knowledge graph...');

  // Run structure analysis
  const analysis = await analyzeStructure(rootPath);

  // Calculate metrics
  const metrics = await calculateMetrics(analysis, rootPath);

  // Collect validation errors
  const validationErrors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (config.checkOrphans) {
    warnings.push(...checkOrphans(analysis));
  }

  if (config.checkBrokenLinks) {
    validationErrors.push(...checkBrokenLinks(analysis));
  }

  if (config.checkMetadata) {
    validationErrors.push(...checkMetadata(analysis));
  }

  if (config.checkHubCoverage) {
    warnings.push(...checkHubCoverage(analysis));
  }

  // Generate recommendations
  const recommendations = generateRecommendations(metrics, analysis);

  const result: ValidationResult = {
    timestamp: new Date().toISOString(),
    metrics,
    analysis,
    validationErrors,
    warnings,
    recommendations,
    success: validationErrors.filter(e => e.severity === 'error').length === 0
  };

  // Generate report if requested
  if (config.generateReport) {
    await generateReport(result, config.outputPath || './kg-validation-report.md');
  }

  console.log('✅ Validation complete!');
  console.log(`   Success: ${result.success ? 'Yes' : 'No'}`);
  console.log(`   Errors: ${validationErrors.filter(e => e.severity === 'error').length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Orphan %: ${metrics.orphanPercentage}%`);
  console.log(`   Metadata Coverage: ${metrics.metadataCoverage}%`);
  console.log(`   Hub Coverage: ${metrics.hubCoverage}%`);

  return result;
}

/**
 * Calculate comprehensive knowledge graph metrics
 */
async function calculateMetrics(
  analysis: StructureAnalysis,
  rootPath: string
): Promise<KnowledgeGraphMetrics> {
  const stats = analysis.statistics;

  // Count hubs
  const hubFiles = analysis.directories.filter(
    d => d.type === 'file' && d.name.includes('HUB.md')
  );

  const totalHubs = hubFiles.length;

  // Calculate hub coverage (percentage of files linked to a hub)
  let filesLinkedToHub = 0;
  for (const [file, node] of Object.entries(analysis.directories)) {
    if (node.backlinks && node.backlinks.some(bl => bl.includes('HUB'))) {
      filesLinkedToHub++;
    }
  }

  const hubCoverage =
    stats.totalMarkdownFiles > 0 ? (filesLinkedToHub / stats.totalMarkdownFiles) * 100 : 0;

  const avgDocsPerHub = totalHubs > 0 ? stats.totalMarkdownFiles / totalHubs : 0;

  // Calculate connection density (actual vs possible connections)
  const possibleConnections = (stats.totalMarkdownFiles * (stats.totalMarkdownFiles - 1)) / 2;
  const connectionDensity = possibleConnections > 0 ? stats.totalLinks / possibleConnections : 0;

  // Baseline: 55% orphaned, target: <5%
  const baselineOrphans = Math.round(stats.totalMarkdownFiles * 0.55);
  const targetOrphans = Math.round(stats.totalMarkdownFiles * 0.05);
  const improvementSinceBaseline =
    baselineOrphans > 0
      ? ((baselineOrphans - stats.orphanedFiles) / baselineOrphans) * 100
      : 0;
  const remainingWork = Math.max(0, stats.orphanedFiles - targetOrphans);

  return {
    totalFiles: stats.totalMarkdownFiles,
    orphanedFiles: stats.orphanedFiles,
    orphanPercentage: stats.orphanPercentage,

    totalConnections: stats.totalLinks,
    avgConnectionsPerFile: stats.avgLinksPerFile,
    connectionDensity,

    filesWithMetadata: stats.filesWithMetadata,
    metadataCoverage: stats.metadataPercentage,
    compliantMetadata: stats.filesWithMetadata, // Simplified

    totalHubs,
    hubCoverage,
    avgDocsPerHub,

    brokenLinks: stats.brokenLinks,
    duplicateLinks: 0, // Could be calculated
    circularReferences: 0, // Could be calculated

    improvementSinceBaseline,
    targetOrphans,
    remainingWork
  };
}

/**
 * Check for orphaned files
 */
function checkOrphans(analysis: StructureAnalysis): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  for (const file of analysis.orphanedFiles) {
    warnings.push({
      type: 'orphan',
      file,
      message: 'File has no incoming or outgoing links'
    });
  }

  return warnings;
}

/**
 * Check for broken links
 */
function checkBrokenLinks(analysis: StructureAnalysis): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const link of analysis.brokenLinks) {
    errors.push({
      type: 'broken_link',
      file: link.sourceFile,
      message: `Broken link to ${link.targetFile}: ${link.reason}`,
      severity: 'error'
    });
  }

  return errors;
}

/**
 * Check for missing or invalid metadata
 */
function checkMetadata(analysis: StructureAnalysis): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of analysis.missingMetadata) {
    errors.push({
      type: 'invalid_metadata',
      file,
      message: 'Missing frontmatter metadata',
      severity: 'warning'
    });
  }

  return errors;
}

/**
 * Check hub coverage
 */
function checkHubCoverage(analysis: StructureAnalysis): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Find directories without hubs
  const directories = new Set<string>();

  for (const node of analysis.directories) {
    if (node.type === 'file') {
      const dir = node.path.split('/').slice(0, -1).join('/');
      if (dir) directories.add(dir);
    }
  }

  const hubDirs = new Set<string>();
  for (const node of analysis.directories) {
    if (node.type === 'file' && node.name.includes('HUB.md')) {
      const dir = node.path.split('/').slice(0, -1).join('/');
      hubDirs.add(dir);
    }
  }

  for (const dir of directories) {
    if (!hubDirs.has(dir)) {
      warnings.push({
        type: 'missing_hub',
        file: dir,
        message: `Directory missing hub document`
      });
    }
  }

  return warnings;
}

/**
 * Generate recommendations based on metrics
 */
function generateRecommendations(
  metrics: KnowledgeGraphMetrics,
  analysis: StructureAnalysis
): string[] {
  const recommendations: string[] = [];

  // Orphan recommendations
  if (metrics.orphanPercentage > 5) {
    recommendations.push(
      `🔗 Connect ${metrics.remainingWork} orphaned files to reach <5% target. Focus on high-value documents first.`
    );
  }

  // Metadata recommendations
  if (metrics.metadataCoverage < 90) {
    const missingCount = analysis.missingMetadata.length;
    recommendations.push(
      `📝 Add metadata to ${missingCount} files to reach 90% coverage. Use enhance-metadata workflow.`
    );
  }

  // Hub recommendations
  if (metrics.hubCoverage < 100) {
    recommendations.push(
      `🏗️  Create hub documents for uncovered areas. Current coverage: ${metrics.hubCoverage.toFixed(1)}%`
    );
  }

  // Broken link recommendations
  if (metrics.brokenLinks > 0) {
    recommendations.push(
      `🔧 Fix ${metrics.brokenLinks} broken links. Run validate-graph workflow to identify specific files.`
    );
  }

  // Connection density recommendations
  if (metrics.avgConnectionsPerFile < 5) {
    const needed = Math.ceil((5 - metrics.avgConnectionsPerFile) * metrics.totalFiles);
    recommendations.push(
      `🌐 Add approximately ${needed} connections to reach 5+ connections per file. Use build-connections workflow.`
    );
  }

  // Progress recognition
  if (metrics.improvementSinceBaseline > 10) {
    recommendations.push(
      `✨ Great progress! ${metrics.improvementSinceBaseline.toFixed(1)}% improvement from baseline.`
    );
  }

  return recommendations;
}

/**
 * Generate markdown validation report
 */
async function generateReport(result: ValidationResult, outputPath: string): Promise<void> {
  const lines: string[] = [];

  lines.push('# Knowledge Graph Validation Report');
  lines.push('');
  lines.push(`**Generated:** ${result.timestamp}`);
  lines.push(`**Status:** ${result.success ? '✅ Pass' : '❌ Fail'}`);
  lines.push('');

  lines.push('## Executive Summary');
  lines.push('');
  lines.push('### Key Metrics');
  lines.push('');
  lines.push('| Metric | Value | Target | Status |');
  lines.push('|--------|-------|--------|--------|');

  const m = result.metrics;

  lines.push(
    `| Orphaned Files | ${m.orphanPercentage}% (${m.orphanedFiles}) | <5% | ${m.orphanPercentage < 5 ? '✅' : '❌'} |`
  );
  lines.push(
    `| Metadata Coverage | ${m.metadataCoverage}% | >90% | ${m.metadataCoverage >= 90 ? '✅' : '❌'} |`
  );
  lines.push(
    `| Hub Coverage | ${m.hubCoverage.toFixed(1)}% | 100% | ${m.hubCoverage >= 100 ? '✅' : '❌'} |`
  );
  lines.push(
    `| Avg Connections/File | ${m.avgConnectionsPerFile.toFixed(1)} | >5 | ${m.avgConnectionsPerFile >= 5 ? '✅' : '❌'} |`
  );
  lines.push(
    `| Broken Links | ${m.brokenLinks} | 0 | ${m.brokenLinks === 0 ? '✅' : '❌'} |`
  );
  lines.push('');

  lines.push('### Progress Tracking');
  lines.push('');
  lines.push(
    `- **Baseline Orphans:** ${Math.round(m.totalFiles * 0.55)} files (55% of ${m.totalFiles})`
  );
  lines.push(`- **Current Orphans:** ${m.orphanedFiles} files (${m.orphanPercentage}%)`);
  lines.push(`- **Target Orphans:** ${m.targetOrphans} files (<5%)`);
  lines.push(`- **Improvement:** ${m.improvementSinceBaseline.toFixed(1)}% from baseline`);
  lines.push(`- **Remaining Work:** ${m.remainingWork} files to connect`);
  lines.push('');

  lines.push('## Detailed Metrics');
  lines.push('');

  lines.push('### Coverage Metrics');
  lines.push(`- Total Files: ${m.totalFiles}`);
  lines.push(`- Orphaned Files: ${m.orphanedFiles} (${m.orphanPercentage}%)`);
  lines.push('');

  lines.push('### Connection Metrics');
  lines.push(`- Total Connections: ${m.totalConnections}`);
  lines.push(`- Avg Connections/File: ${m.avgConnectionsPerFile.toFixed(2)}`);
  lines.push(`- Connection Density: ${(m.connectionDensity * 100).toFixed(4)}%`);
  lines.push('');

  lines.push('### Metadata Metrics');
  lines.push(`- Files with Metadata: ${m.filesWithMetadata}`);
  lines.push(`- Metadata Coverage: ${m.metadataCoverage}%`);
  lines.push('');

  lines.push('### Hub Metrics');
  lines.push(`- Total Hubs: ${m.totalHubs}`);
  lines.push(`- Hub Coverage: ${m.hubCoverage.toFixed(1)}%`);
  lines.push(`- Avg Docs/Hub: ${m.avgDocsPerHub.toFixed(1)}`);
  lines.push('');

  lines.push('### Quality Metrics');
  lines.push(`- Broken Links: ${m.brokenLinks}`);
  lines.push('');

  if (result.validationErrors.length > 0) {
    lines.push('## Validation Errors');
    lines.push('');

    const errors = result.validationErrors.filter(e => e.severity === 'error');
    const warnings = result.validationErrors.filter(e => e.severity === 'warning');

    if (errors.length > 0) {
      lines.push(`### Errors (${errors.length})`);
      lines.push('');
      for (const error of errors.slice(0, 50)) {
        lines.push(`- **${error.file}**: ${error.message}`);
      }
      if (errors.length > 50) {
        lines.push(`- *(${errors.length - 50} more errors not shown)*`);
      }
      lines.push('');
    }

    if (warnings.length > 0) {
      lines.push(`### Warnings (${warnings.length})`);
      lines.push('');
      for (const warning of warnings.slice(0, 20)) {
        lines.push(`- **${warning.file}**: ${warning.message}`);
      }
      if (warnings.length > 20) {
        lines.push(`- *(${warnings.length - 20} more warnings not shown)*`);
      }
      lines.push('');
    }
  }

  if (result.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    for (const rec of result.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. **Address broken links** - Fix all broken wikilinks');
  lines.push('2. **Create missing hubs** - Generate hub documents for uncovered areas');
  lines.push('3. **Enhance metadata** - Add frontmatter to files missing metadata');
  lines.push('4. **Build connections** - Connect orphaned files using semantic/directory strategies');
  lines.push('5. **Re-validate** - Run validation again to measure progress');
  lines.push('');

  lines.push('---');
  lines.push('*Generated by Knowledge Graph Validation Workflow*');

  await writeFile(outputPath, lines.join('\n'), 'utf-8');
  console.log(`📄 Validation report generated: ${outputPath}`);
}
