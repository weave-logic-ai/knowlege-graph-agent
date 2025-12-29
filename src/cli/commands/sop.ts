/**
 * SOP Commands
 *
 * AI-SDLC Standard Operating Procedures commands for compliance checking,
 * gap analysis, and reporting.
 *
 * @module cli/commands/sop
 */

import { Command } from 'commander';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import {
  SOPCategory,
  ComplianceStatus,
  SOPPriority,
  getAllSOPs,
  getSOPsByCategory,
  getSOPById,
  getSopCount,
  getCategories,
  checkCompliance,
  analyzeGaps,
  createMultiLayerGraph,
  addComplianceOverlay,
  exportToVisualizationFormat,
  getComplianceSummary,
} from '../../sops/index.js';

/**
 * Create the SOP command group
 */
export function createSOPCommands(): Command {
  const sop = new Command('sop')
    .description('AI-SDLC SOP compliance commands');

  // sop init
  sop
    .command('init')
    .description('Initialize AI-SDLC SOP standards layer')
    .option('-p, --path <path>', 'Project root path', process.cwd())
    .option('-d, --docs <path>', 'Documentation path', 'docs')
    .option('-c, --categories <categories>', 'SOP categories to include (comma-separated)')
    .option('-v, --verbose', 'Verbose output')
    .action(async (options) => {
      const projectRoot = resolve(options.path);
      const docsPath = options.docs;
      const verbose = options.verbose;

      console.log('\n🏛️  Initializing AI-SDLC SOP Standards Layer\n');

      try {
        // Parse categories
        let categories: SOPCategory[] | undefined;
        if (options.categories) {
          categories = options.categories.split(',').map((c: string) => c.trim() as SOPCategory);
        }

        // Create multi-layer graph with standards
        const graph = createMultiLayerGraph({
          graphId: `sop-${Date.now()}`,
          graphName: 'AI-SDLC Compliance Graph',
          includeAllSOPs: !categories,
          categories,
        });

        // Save graph to docs
        const sopDir = join(projectRoot, docsPath, 'sop');
        if (!existsSync(sopDir)) {
          mkdirSync(sopDir, { recursive: true });
        }

        // Save standards graph
        const graphPath = join(sopDir, 'standards-graph.json');
        writeFileSync(graphPath, JSON.stringify(graph, null, 2));

        console.log(`  ✓ Created standards layer with ${getSopCount()} SOPs`);
        console.log(`  ✓ Saved graph to ${graphPath}`);

        if (verbose) {
          console.log('\n  Categories included:');
          for (const category of getCategories()) {
            const count = getSOPsByCategory(category).length;
            console.log(`    - ${category}: ${count} SOPs`);
          }
        }

        // Create SOP index document
        const indexPath = join(sopDir, 'SOP-INDEX.md');
        const indexContent = generateSOPIndex(categories);
        writeFileSync(indexPath, indexContent);
        console.log(`  ✓ Created SOP index at ${indexPath}`);

        console.log('\n✨ SOP standards layer initialized!\n');
        console.log('Next steps:');
        console.log('  - Run "kg sop check" to assess compliance');
        console.log('  - Run "kg sop gaps" to identify gaps');
        console.log('  - Run "kg sop report" to generate compliance report');
        console.log('');

      } catch (error) {
        console.error('\n❌ SOP initialization failed:', error);
        process.exit(1);
      }
    });

  // sop check
  sop
    .command('check')
    .description('Check project compliance against AI-SDLC SOPs')
    .option('-p, --path <path>', 'Project root path', process.cwd())
    .option('-d, --docs <path>', 'Documentation path', 'docs')
    .option('-s, --sop <id>', 'Check specific SOP by ID')
    .option('-c, --category <category>', 'Check SOPs in specific category')
    .option('--deep', 'Perform deep analysis of file contents')
    .option('--threshold <number>', 'Minimum compliance threshold (0-100)', '50')
    .option('-v, --verbose', 'Verbose output')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const projectRoot = resolve(options.path);
      const docsPath = options.docs;
      const verbose = options.verbose;
      const threshold = parseInt(options.threshold, 10);

      if (!options.json) {
        console.log('\n🔍 Checking AI-SDLC SOP Compliance\n');
      }

      try {
        // Build check options
        const checkOptions: Parameters<typeof checkCompliance>[0] = {
          projectRoot,
          docsPath,
          deepAnalysis: options.deep,
          assessor: 'cli-automated',
        };

        if (options.sop) {
          checkOptions.sopIds = [options.sop];
        }
        if (options.category) {
          checkOptions.categories = [options.category as SOPCategory];
        }

        // Run compliance check
        const result = await checkCompliance(checkOptions);

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        // Display results
        console.log(`  Project: ${result.projectName}`);
        console.log(`  Overall Score: ${getScoreEmoji(result.overallScore)} ${result.overallScore}%\n`);

        // Category breakdown
        console.log('  Category Scores:');
        for (const [category, score] of Object.entries(result.categoryScores)) {
          if (score > 0) {
            console.log(`    ${getScoreEmoji(score)} ${formatCategory(category as SOPCategory)}: ${score}%`);
          }
        }
        console.log('');

        // Assessment summary
        const compliant = result.assessments.filter(a => a.status === ComplianceStatus.COMPLIANT).length;
        const partial = result.assessments.filter(a => a.status === ComplianceStatus.PARTIAL).length;
        const nonCompliant = result.assessments.filter(a => a.status === ComplianceStatus.NON_COMPLIANT).length;

        console.log('  Assessment Summary:');
        console.log(`    ✅ Compliant: ${compliant}`);
        console.log(`    🟡 Partial: ${partial}`);
        console.log(`    ❌ Non-compliant: ${nonCompliant}`);
        console.log('');

        // Verbose: show each assessment
        if (verbose) {
          console.log('  Detailed Assessments:');
          for (const assessment of result.assessments) {
            const sop = getSOPById(assessment.sopId);
            if (sop) {
              console.log(`\n    ${getStatusIcon(assessment.status)} ${sop.title}`);
              console.log(`       Score: ${assessment.score}%`);
              console.log(`       Met: ${assessment.requirementsMet.length}/${assessment.requirementsMet.length + assessment.requirementsGaps.length}`);
            }
          }
          console.log('');
        }

        // Check threshold
        if (result.overallScore < threshold) {
          console.log(`  ⚠️  Below compliance threshold of ${threshold}%`);
          console.log('     Run "kg sop gaps" to see remediation recommendations\n');
        } else {
          console.log(`  ✨ Meets compliance threshold of ${threshold}%\n`);
        }

        // Evidence summary
        if (result.evidence.length > 0 && verbose) {
          console.log(`  Evidence Found: ${result.evidence.length} items`);
        }

      } catch (error) {
        console.error('\n❌ Compliance check failed:', error);
        process.exit(1);
      }
    });

  // sop gaps
  sop
    .command('gaps')
    .description('Analyze compliance gaps and generate remediation recommendations')
    .option('-p, --path <path>', 'Project root path', process.cwd())
    .option('-d, --docs <path>', 'Documentation path', 'docs')
    .option('--priority <priority>', 'Minimum gap priority (critical, high, medium, low)')
    .option('--category <category>', 'Filter by category')
    .option('--roadmap', 'Include remediation roadmap')
    .option('-v, --verbose', 'Verbose output')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const projectRoot = resolve(options.path);
      const docsPath = options.docs;
      const verbose = options.verbose;

      if (!options.json) {
        console.log('\n📋 Analyzing Compliance Gaps\n');
      }

      try {
        // First run compliance check
        const checkResult = await checkCompliance({
          projectRoot,
          docsPath,
          deepAnalysis: true,
        });

        // Parse filters
        let minPriority: SOPPriority | undefined;
        if (options.priority) {
          minPriority = options.priority as SOPPriority;
        }

        let categories: SOPCategory[] | undefined;
        if (options.category) {
          categories = [options.category as SOPCategory];
        }

        // Analyze gaps
        const gapResult = analyzeGaps(checkResult, {
          minPriority,
          categories,
          generateRemediation: true,
        });

        if (options.json) {
          console.log(JSON.stringify(gapResult, null, 2));
          return;
        }

        // Display summary
        console.log(`  Total Gaps: ${gapResult.totalGaps}`);
        console.log(`  Compliance: ${gapResult.summary.compliancePercentage}%`);
        console.log(`  Complexity: ${gapResult.summary.overallComplexity}\n`);

        // Priority breakdown
        console.log('  Gaps by Priority:');
        console.log(`    🔴 Critical: ${gapResult.byPriority[SOPPriority.CRITICAL].length}`);
        console.log(`    🟠 High: ${gapResult.byPriority[SOPPriority.HIGH].length}`);
        console.log(`    🟡 Medium: ${gapResult.byPriority[SOPPriority.MEDIUM].length}`);
        console.log(`    🟢 Low: ${gapResult.byPriority[SOPPriority.LOW].length}`);
        console.log('');

        // Category breakdown
        console.log('  Gaps by Category:');
        for (const [category, gaps] of Object.entries(gapResult.byCategory)) {
          if (gaps.length > 0) {
            console.log(`    ${formatCategory(category as SOPCategory)}: ${gaps.length}`);
          }
        }
        console.log('');

        // Critical gaps detail
        if (gapResult.criticalGaps.length > 0) {
          console.log('  🚨 Critical Gaps (Immediate Action Required):');
          for (const gap of gapResult.criticalGaps) {
            const sop = getSOPById(gap.sopId);
            console.log(`\n    • ${sop?.title || gap.sopId}`);
            console.log(`      ${gap.description.substring(0, 80)}...`);
            console.log(`      Effort: ${gap.effort}`);
          }
          console.log('');
        }

        // Quick wins
        if (gapResult.roadmap?.quickWins && gapResult.roadmap.quickWins.length > 0) {
          console.log('  💡 Quick Wins (High Impact, Low Effort):');
          for (const gap of gapResult.roadmap.quickWins.slice(0, 5)) {
            const sop = getSOPById(gap.sopId);
            console.log(`    • ${sop?.title || gap.sopId}`);
          }
          console.log('');
        }

        // Roadmap
        if (options.roadmap && gapResult.roadmap) {
          console.log('  📍 Remediation Roadmap:');
          for (const phase of gapResult.roadmap.phases) {
            console.log(`\n    Phase ${phase.phase}: ${phase.name}`);
            console.log(`      Focus: ${phase.focus}`);
            console.log(`      Gaps: ${phase.gaps.length}`);
            console.log(`      Effort: ${phase.effort}`);
          }
          console.log('');
        }

        // Verbose: show all gaps
        if (verbose) {
          console.log('  All Gaps:');
          for (const gap of gapResult.gaps) {
            console.log(`\n    [${gap.priority.toUpperCase()}] ${gap.id}`);
            console.log(`      SOP: ${gap.sopId}`);
            console.log(`      Description: ${gap.description.substring(0, 100)}...`);
            console.log(`      Remediation: ${gap.remediation.substring(0, 100)}...`);
          }
          console.log('');
        }

      } catch (error) {
        console.error('\n❌ Gap analysis failed:', error);
        process.exit(1);
      }
    });

  // sop report
  sop
    .command('report')
    .description('Generate comprehensive compliance report')
    .option('-p, --path <path>', 'Project root path', process.cwd())
    .option('-d, --docs <path>', 'Documentation path', 'docs')
    .option('-o, --output <file>', 'Output file path')
    .option('-f, --format <format>', 'Output format (md, json, html)', 'md')
    .option('--include-evidence', 'Include evidence details')
    .option('--include-roadmap', 'Include remediation roadmap')
    .action(async (options) => {
      const projectRoot = resolve(options.path);
      const docsPath = options.docs;
      const format = options.format;

      console.log('\n📝 Generating Compliance Report\n');

      try {
        // Run compliance check
        const checkResult = await checkCompliance({
          projectRoot,
          docsPath,
          deepAnalysis: true,
        });

        // Analyze gaps
        const gapResult = analyzeGaps(checkResult, {
          generateRemediation: true,
        });

        // Create multi-layer graph
        const graph = createMultiLayerGraph();
        addComplianceOverlay(graph, checkResult, gapResult);
        const summary = getComplianceSummary(graph);

        // Generate report content
        let report: string;

        if (format === 'json') {
          report = JSON.stringify({
            checkResult,
            gapResult,
            summary,
            generatedAt: new Date().toISOString(),
          }, null, 2);
        } else if (format === 'html') {
          report = generateHTMLReport(checkResult, gapResult, summary, options);
        } else {
          report = generateMarkdownReport(checkResult, gapResult, summary, options);
        }

        // Output
        if (options.output) {
          const outputPath = resolve(options.output);
          writeFileSync(outputPath, report);
          console.log(`  ✓ Report saved to ${outputPath}`);
        } else {
          // Default output path
          const sopDir = join(projectRoot, docsPath, 'sop');
          if (!existsSync(sopDir)) {
            mkdirSync(sopDir, { recursive: true });
          }
          const outputPath = join(sopDir, `COMPLIANCE-REPORT.${format}`);
          writeFileSync(outputPath, report);
          console.log(`  ✓ Report saved to ${outputPath}`);
        }

        console.log('\n✨ Report generated successfully!\n');

      } catch (error) {
        console.error('\n❌ Report generation failed:', error);
        process.exit(1);
      }
    });

  // sop list
  sop
    .command('list')
    .description('List available AI-SDLC SOPs')
    .option('-c, --category <category>', 'Filter by category')
    .option('--irb', 'Show only SOPs requiring AI-IRB review')
    .option('--json', 'Output as JSON')
    .action((options) => {
      let sops = getAllSOPs();

      if (options.category) {
        sops = getSOPsByCategory(options.category as SOPCategory);
      }

      if (options.irb) {
        sops = sops.filter(s => s.irbTypicallyRequired);
      }

      if (options.json) {
        console.log(JSON.stringify(sops, null, 2));
        return;
      }

      console.log('\n📚 AI-SDLC Standard Operating Procedures\n');
      console.log(`  Total: ${sops.length} SOPs\n`);

      // Group by category
      const byCategory = new Map<SOPCategory, typeof sops>();
      for (const sop of sops) {
        if (!byCategory.has(sop.category)) {
          byCategory.set(sop.category, []);
        }
        byCategory.get(sop.category)!.push(sop);
      }

      for (const [category, categorySops] of byCategory) {
        console.log(`  ${formatCategory(category)} (${categorySops.length}):`);
        for (const sop of categorySops) {
          const irb = sop.irbTypicallyRequired ? ' 🔬' : '';
          console.log(`    • ${sop.id}: ${sop.title}${irb}`);
        }
        console.log('');
      }
    });

  return sop;
}

/**
 * Helper functions
 */

function getScoreEmoji(score: number): string {
  if (score >= 90) return '✅';
  if (score >= 70) return '🟡';
  if (score >= 50) return '🟠';
  return '🔴';
}

function getStatusIcon(status: ComplianceStatus): string {
  switch (status) {
    case ComplianceStatus.COMPLIANT:
      return '✅';
    case ComplianceStatus.PARTIAL:
      return '🟡';
    case ComplianceStatus.NON_COMPLIANT:
      return '❌';
    case ComplianceStatus.NOT_APPLICABLE:
      return '⚪';
    case ComplianceStatus.PENDING:
      return '⏳';
    default:
      return '❓';
  }
}

function formatCategory(category: SOPCategory): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function generateSOPIndex(categories?: SOPCategory[]): string {
  const sops = categories
    ? categories.flatMap(c => getSOPsByCategory(c))
    : getAllSOPs();

  let content = `---
title: AI-SDLC SOP Index
type: standards
created: ${new Date().toISOString().split('T')[0]}
tags: [sop, ai-sdlc, compliance, standards]
---

# AI-SDLC Standard Operating Procedures

This document provides an index of AI-SDLC SOPs applicable to this project.

## Overview

- **Total SOPs**: ${sops.length}
- **Source**: [AI-SDLC-SOPs](https://github.com/AISDLC/AI-SDLC-SOPs)
- **Generated**: ${new Date().toISOString()}

## SOPs by Category

`;

  // Group by category
  const byCategory = new Map<SOPCategory, typeof sops>();
  for (const sop of sops) {
    if (!byCategory.has(sop.category)) {
      byCategory.set(sop.category, []);
    }
    byCategory.get(sop.category)!.push(sop);
  }

  for (const [category, categorySops] of byCategory) {
    content += `### ${formatCategory(category)}\n\n`;
    for (const sop of categorySops) {
      const irb = sop.irbTypicallyRequired ? ' 🔬' : '';
      content += `- **${sop.id}**: ${sop.title}${irb}\n`;
      content += `  - Priority: ${sop.priority}\n`;
      content += `  - Requirements: ${sop.requirements.length}\n`;
    }
    content += '\n';
  }

  content += `## Legend

- 🔬 Requires AI-IRB review
- Requirements count indicates number of checkable items

## Next Steps

1. Run \`kg sop check\` to assess current compliance
2. Run \`kg sop gaps\` to identify remediation needs
3. Run \`kg sop report\` to generate detailed report
`;

  return content;
}

function generateMarkdownReport(
  checkResult: ReturnType<typeof checkCompliance> extends Promise<infer T> ? T : never,
  gapResult: ReturnType<typeof analyzeGaps>,
  summary: ReturnType<typeof getComplianceSummary>,
  options: { includeEvidence?: boolean; includeRoadmap?: boolean }
): string {
  let report = `---
title: AI-SDLC Compliance Report
type: report
generated: ${new Date().toISOString()}
tags: [compliance, sop, report]
---

# AI-SDLC Compliance Report

**Project**: ${checkResult.projectName}
**Generated**: ${checkResult.checkedAt.toISOString()}

## Executive Summary

| Metric | Value |
|--------|-------|
| Overall Score | ${checkResult.overallScore}% |
| Compliant SOPs | ${summary.compliant} |
| Partial Compliance | ${summary.partial} |
| Non-Compliant | ${summary.nonCompliant} |
| Pending Assessment | ${summary.pending} |
| Total Gaps | ${gapResult.totalGaps} |

## Category Scores

`;

  for (const [category, score] of Object.entries(checkResult.categoryScores)) {
    if (score > 0) {
      report += `- **${formatCategory(category as SOPCategory)}**: ${score}%\n`;
    }
  }

  report += `
## Gap Analysis

### By Priority

| Priority | Count |
|----------|-------|
| Critical | ${gapResult.byPriority[SOPPriority.CRITICAL].length} |
| High | ${gapResult.byPriority[SOPPriority.HIGH].length} |
| Medium | ${gapResult.byPriority[SOPPriority.MEDIUM].length} |
| Low | ${gapResult.byPriority[SOPPriority.LOW].length} |

### Effort Breakdown

- Low effort: ${gapResult.summary.totalEffort.low}
- Medium effort: ${gapResult.summary.totalEffort.medium}
- High effort: ${gapResult.summary.totalEffort.high}

## Critical Gaps

`;

  if (gapResult.criticalGaps.length > 0) {
    for (const gap of gapResult.criticalGaps) {
      const sop = getSOPById(gap.sopId);
      report += `### ${sop?.title || gap.sopId}

- **Gap ID**: ${gap.id}
- **Requirement**: ${gap.requirementId}
- **Priority**: ${gap.priority}
- **Effort**: ${gap.effort}
- **Impact**: ${gap.impact}

**Remediation**: ${gap.remediation}

---

`;
    }
  } else {
    report += 'No critical gaps identified.\n\n';
  }

  if (options.includeRoadmap && gapResult.roadmap) {
    report += `## Remediation Roadmap

`;
    for (const phase of gapResult.roadmap.phases) {
      report += `### Phase ${phase.phase}: ${phase.name}

- **Focus**: ${phase.focus}
- **Effort**: ${phase.effort}
- **Gaps**: ${phase.gaps.length}

`;
    }
  }

  if (options.includeEvidence && checkResult.evidence.length > 0) {
    report += `## Evidence Found

`;
    for (const evidence of checkResult.evidence) {
      report += `- **${evidence.requirementId}**: ${evidence.description}
  - File: \`${evidence.filePath}\`
  - Confidence: ${Math.round(evidence.confidence * 100)}%
`;
    }
  }

  report += `
## Recommendations

`;

  // Generate recommendations based on gaps
  if (gapResult.criticalGaps.length > 0) {
    report += `1. **Address Critical Gaps Immediately**: ${gapResult.criticalGaps.length} critical gaps require immediate attention.\n`;
  }

  if (gapResult.roadmap?.quickWins && gapResult.roadmap.quickWins.length > 0) {
    report += `2. **Quick Wins**: ${gapResult.roadmap.quickWins.length} high-impact, low-effort improvements available.\n`;
  }

  if (checkResult.overallScore < 50) {
    report += `3. **Compliance Baseline**: Current score of ${checkResult.overallScore}% is below recommended baseline. Focus on foundational SOPs.\n`;
  }

  report += `
---

*Report generated by Knowledge Graph Agent - AI-SDLC SOP Compliance Module*
`;

  return report;
}

function generateHTMLReport(
  checkResult: ReturnType<typeof checkCompliance> extends Promise<infer T> ? T : never,
  gapResult: ReturnType<typeof analyzeGaps>,
  summary: ReturnType<typeof getComplianceSummary>,
  options: { includeEvidence?: boolean; includeRoadmap?: boolean }
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI-SDLC Compliance Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .score { font-size: 3rem; font-weight: bold; }
    .score.high { color: #22c55e; }
    .score.medium { color: #f59e0b; }
    .score.low { color: #ef4444; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
    th { background: #f9fafb; }
    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; }
    .badge.critical { background: #fef2f2; color: #b91c1c; }
    .badge.high { background: #fff7ed; color: #c2410c; }
    .badge.medium { background: #fefce8; color: #a16207; }
    .badge.low { background: #f0fdf4; color: #15803d; }
  </style>
</head>
<body>
  <h1>AI-SDLC Compliance Report</h1>
  <p><strong>Project:</strong> ${checkResult.projectName}</p>
  <p><strong>Generated:</strong> ${checkResult.checkedAt.toISOString()}</p>

  <div class="grid">
    <div class="card">
      <h3>Overall Score</h3>
      <div class="score ${checkResult.overallScore >= 70 ? 'high' : checkResult.overallScore >= 50 ? 'medium' : 'low'}">
        ${checkResult.overallScore}%
      </div>
    </div>
    <div class="card">
      <h3>Compliance Status</h3>
      <p>✅ Compliant: ${summary.compliant}</p>
      <p>🟡 Partial: ${summary.partial}</p>
      <p>❌ Non-compliant: ${summary.nonCompliant}</p>
    </div>
    <div class="card">
      <h3>Gap Summary</h3>
      <p>Total Gaps: ${gapResult.totalGaps}</p>
      <p>Critical: ${gapResult.criticalGaps.length}</p>
      <p>Complexity: ${gapResult.summary.overallComplexity}</p>
    </div>
  </div>

  <h2>Category Scores</h2>
  <table>
    <tr><th>Category</th><th>Score</th></tr>
    ${Object.entries(checkResult.categoryScores)
      .filter(([, score]) => score > 0)
      .map(([cat, score]) => `<tr><td>${formatCategory(cat as SOPCategory)}</td><td>${score}%</td></tr>`)
      .join('')}
  </table>

  <h2>Gaps by Priority</h2>
  <table>
    <tr><th>Priority</th><th>Count</th></tr>
    <tr><td><span class="badge critical">Critical</span></td><td>${gapResult.byPriority[SOPPriority.CRITICAL].length}</td></tr>
    <tr><td><span class="badge high">High</span></td><td>${gapResult.byPriority[SOPPriority.HIGH].length}</td></tr>
    <tr><td><span class="badge medium">Medium</span></td><td>${gapResult.byPriority[SOPPriority.MEDIUM].length}</td></tr>
    <tr><td><span class="badge low">Low</span></td><td>${gapResult.byPriority[SOPPriority.LOW].length}</td></tr>
  </table>

  ${gapResult.criticalGaps.length > 0 ? `
  <h2>Critical Gaps</h2>
  ${gapResult.criticalGaps.map(gap => {
    const sop = getSOPById(gap.sopId);
    return `
    <div class="card">
      <h3>${sop?.title || gap.sopId}</h3>
      <p><strong>Gap ID:</strong> ${gap.id}</p>
      <p><strong>Impact:</strong> ${gap.impact}</p>
      <p><strong>Remediation:</strong> ${gap.remediation}</p>
    </div>
    `;
  }).join('')}
  ` : ''}

  <footer style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #6b7280;">
    <p>Generated by Knowledge Graph Agent - AI-SDLC SOP Compliance Module</p>
  </footer>
</body>
</html>`;
}
