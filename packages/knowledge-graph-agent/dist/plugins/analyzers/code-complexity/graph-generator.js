import { relative, basename } from "path";
import { createHash } from "crypto";
function generateNodeId(type, filePath, functionName) {
  const input = functionName ? `${type}:${filePath}:${functionName}` : `${type}:${filePath}`;
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 12);
  return `complexity-${hash}`;
}
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
class ComplexityGraphGenerator {
  projectRoot;
  thresholds;
  constructor(projectRoot, config) {
    this.projectRoot = projectRoot;
    this.thresholds = {
      high: config?.thresholds?.cyclomaticHigh ?? 10,
      critical: config?.thresholds?.cyclomaticCritical ?? 20
    };
  }
  // ==========================================================================
  // Node Generation
  // ==========================================================================
  /**
   * Generate all nodes from project analysis
   */
  generateNodes(analysis) {
    const nodes = [];
    for (const fn of analysis.complexFunctions) {
      const node = this.generateFunctionNode(fn);
      nodes.push(node);
    }
    for (const file of analysis.hotspots) {
      const node = this.generateFileNode(file);
      nodes.push(node);
    }
    return nodes;
  }
  /**
   * Generate a node for a complex function
   */
  generateFunctionNode(fn) {
    const id = generateNodeId("complex-function", fn.filePath, fn.name);
    relative(this.projectRoot, fn.filePath);
    return {
      id,
      type: "complex-function",
      title: this.generateFunctionTitle(fn),
      filePath: fn.filePath,
      functionName: fn.name,
      lineRange: { start: fn.startLine, end: fn.endLine },
      complexity: fn.complexity,
      level: fn.level,
      issues: fn.issues,
      recommendations: fn.recommendations,
      relatedNodes: [],
      tags: this.generateFunctionTags(fn),
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Generate a node for a complex file
   */
  generateFileNode(file) {
    const id = generateNodeId("complex-file", file.filePath);
    relative(this.projectRoot, file.filePath);
    return {
      id,
      type: "complex-file",
      title: `Complex File: ${basename(file.filePath)}`,
      filePath: file.filePath,
      complexity: file.complexity,
      level: file.level,
      issues: this.generateFileIssues(file),
      recommendations: this.generateFileRecommendations(file),
      relatedNodes: file.functions.map(
        (fn) => generateNodeId("complex-function", file.filePath, fn.name)
      ),
      tags: this.generateFileTags(file),
      createdAt: /* @__PURE__ */ new Date()
    };
  }
  // ==========================================================================
  // Edge Generation
  // ==========================================================================
  /**
   * Generate edges connecting complexity nodes
   */
  generateEdges(nodes, analysis) {
    const edges = [];
    for (const file of analysis.hotspots) {
      const fileNodeId = generateNodeId("complex-file", file.filePath);
      for (const fn of file.complexFunctions) {
        const fnNodeId = generateNodeId("complex-function", file.filePath, fn.name);
        edges.push({
          source: fileNodeId,
          target: fnNodeId,
          type: "contains",
          weight: fn.complexity.cyclomatic / this.thresholds.critical,
          complexityScore: fn.complexity.cyclomatic,
          context: `${fn.name} is a complex function in this file`
        });
      }
    }
    for (const file of analysis.files) {
      const complexFns = file.complexFunctions;
      for (let i = 0; i < complexFns.length; i++) {
        for (let j = i + 1; j < complexFns.length; j++) {
          const fn1 = complexFns[i];
          const fn2 = complexFns[j];
          edges.push({
            source: generateNodeId("complex-function", file.filePath, fn1.name),
            target: generateNodeId("complex-function", file.filePath, fn2.name),
            type: "related",
            weight: 0.5,
            context: "Both functions are complex and in the same file"
          });
        }
      }
    }
    return edges;
  }
  // ==========================================================================
  // Knowledge Node Conversion
  // ==========================================================================
  /**
   * Convert complexity nodes to knowledge graph nodes
   */
  toKnowledgeNodes(nodes) {
    return nodes.map((node) => this.complexityToKnowledge(node));
  }
  /**
   * Convert a complexity node to a knowledge node
   */
  complexityToKnowledge(node) {
    const relativePath = relative(this.projectRoot, node.filePath);
    const filename = `${slugify(node.title)}.md`;
    return {
      id: node.id,
      path: `docs/complexity/${filename}`,
      filename,
      title: node.title,
      type: "technical",
      status: node.level === "critical" ? "active" : "draft",
      content: this.generateMarkdownContent(node),
      frontmatter: {
        title: node.title,
        type: "technical",
        status: node.level === "critical" ? "active" : "draft",
        tags: node.tags,
        category: "complexity",
        description: this.generateDescription(node),
        created: node.createdAt.toISOString(),
        complexity_level: node.level,
        cyclomatic_complexity: node.complexity.cyclomatic,
        cognitive_complexity: node.complexity.cognitive,
        file_path: relativePath,
        function_name: node.functionName
      },
      tags: node.tags,
      outgoingLinks: node.relatedNodes.map((target) => ({
        target,
        type: "wikilink",
        context: "Related complexity hotspot"
      })),
      incomingLinks: [],
      wordCount: 0,
      lastModified: node.createdAt
    };
  }
  // ==========================================================================
  // Markdown Generation
  // ==========================================================================
  /**
   * Generate markdown content for a complexity node
   */
  generateMarkdownContent(node) {
    const relativePath = relative(this.projectRoot, node.filePath);
    const lines = [];
    lines.push(`# ${node.title}`);
    lines.push("");
    const severityEmoji = this.getSeverityEmoji(node.level);
    lines.push(`> ${severityEmoji} **Severity: ${node.level.toUpperCase()}**`);
    lines.push("");
    lines.push("## Location");
    lines.push("");
    lines.push(`- **File**: \`${relativePath}\``);
    if (node.functionName) {
      lines.push(`- **Function**: \`${node.functionName}\``);
    }
    if (node.lineRange) {
      lines.push(`- **Lines**: ${node.lineRange.start} - ${node.lineRange.end}`);
    }
    lines.push("");
    lines.push("## Complexity Metrics");
    lines.push("");
    lines.push("| Metric | Value | Threshold |");
    lines.push("|--------|-------|-----------|");
    lines.push(
      `| Cyclomatic Complexity | ${node.complexity.cyclomatic} | ${this.thresholds.high} (high) / ${this.thresholds.critical} (critical) |`
    );
    lines.push(
      `| Cognitive Complexity | ${node.complexity.cognitive} | 15 (high) / 25 (critical) |`
    );
    lines.push(`| Lines of Code | ${node.complexity.loc} | 50 (max) |`);
    lines.push(`| Max Nesting Depth | ${node.complexity.maxNestingDepth} | 4 (max) |`);
    lines.push("");
    if (node.issues.length > 0) {
      lines.push("## Issues Detected");
      lines.push("");
      for (const issue of node.issues) {
        lines.push(`- ${issue}`);
      }
      lines.push("");
    }
    if (node.recommendations.length > 0) {
      lines.push("## Recommendations");
      lines.push("");
      for (const rec of node.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push("");
    }
    if (node.relatedNodes.length > 0) {
      lines.push("## Related Hotspots");
      lines.push("");
      for (const related of node.relatedNodes) {
        lines.push(`- [[${related}]]`);
      }
      lines.push("");
    }
    lines.push("## Tags");
    lines.push("");
    lines.push(node.tags.map((t) => `\`${t}\``).join(" "));
    lines.push("");
    return lines.join("\n");
  }
  /**
   * Generate report markdown for entire project
   */
  generateProjectReport(analysis) {
    const lines = [];
    lines.push("# Code Complexity Analysis Report");
    lines.push("");
    lines.push(`> Generated: ${(/* @__PURE__ */ new Date()).toISOString()}`);
    lines.push("");
    lines.push("## Summary");
    lines.push("");
    lines.push(`- **Total Files Analyzed**: ${analysis.metrics.totalFiles}`);
    lines.push(`- **Total Functions**: ${analysis.metrics.totalFunctions}`);
    lines.push(`- **Total Lines of Code**: ${analysis.metrics.totalLoc}`);
    lines.push(`- **Analysis Duration**: ${analysis.timing.durationMs}ms`);
    lines.push("");
    lines.push("## Average Metrics");
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    lines.push(`| Cyclomatic Complexity | ${analysis.metrics.avgCyclomatic} |`);
    lines.push(`| Cognitive Complexity | ${analysis.metrics.avgCognitive} |`);
    lines.push(`| Maintainability Index | ${analysis.metrics.avgMaintainability} |`);
    lines.push("");
    lines.push("## Complexity Distribution");
    lines.push("");
    lines.push("| Level | Functions | Files |");
    lines.push("|-------|-----------|-------|");
    const levels = ["low", "moderate", "high", "critical"];
    for (const level of levels) {
      lines.push(
        `| ${level} | ${analysis.metrics.complexityDistribution[level]} | ${analysis.metrics.filesByLevel[level]} |`
      );
    }
    lines.push("");
    if (analysis.metrics.topComplexFiles.length > 0) {
      lines.push("## Most Complex Files");
      lines.push("");
      lines.push("| File | Cyclomatic Complexity |");
      lines.push("|------|----------------------|");
      for (const file of analysis.metrics.topComplexFiles) {
        lines.push(`| ${file.path} | ${file.score} |`);
      }
      lines.push("");
    }
    if (analysis.metrics.topComplexFunctions.length > 0) {
      lines.push("## Most Complex Functions");
      lines.push("");
      lines.push("| Function | File | Score |");
      lines.push("|----------|------|-------|");
      for (const fn of analysis.metrics.topComplexFunctions) {
        lines.push(`| ${fn.name} | ${fn.file} | ${fn.score} |`);
      }
      lines.push("");
    }
    if (analysis.hotspots.length > 0) {
      lines.push("## Hotspots Requiring Attention");
      lines.push("");
      for (const hotspot of analysis.hotspots.slice(0, 10)) {
        const relativePath = relative(this.projectRoot, hotspot.filePath);
        lines.push(`### ${basename(hotspot.filePath)}`);
        lines.push("");
        lines.push(`- **Path**: \`${relativePath}\``);
        lines.push(`- **Complexity Level**: ${hotspot.level}`);
        lines.push(`- **Functions**: ${hotspot.functions.length}`);
        lines.push(`- **Complex Functions**: ${hotspot.complexFunctions.length}`);
        lines.push("");
        if (hotspot.complexFunctions.length > 0) {
          lines.push("**Complex Functions:**");
          for (const fn of hotspot.complexFunctions) {
            lines.push(`- \`${fn.name}\` (CC: ${fn.complexity.cyclomatic})`);
          }
          lines.push("");
        }
      }
    }
    return lines.join("\n");
  }
  // ==========================================================================
  // Helper Methods
  // ==========================================================================
  generateFunctionTitle(fn) {
    const prefix = fn.parentName ? `${fn.parentName}.` : "";
    return `Complex Function: ${prefix}${fn.name}`;
  }
  generateFunctionTags(fn) {
    const tags = ["complexity", fn.level, fn.kind];
    if (fn.isAsync) tags.push("async");
    if (fn.complexity.cyclomatic >= this.thresholds.critical) {
      tags.push("needs-refactoring");
    }
    if (fn.complexity.maxNestingDepth > 4) {
      tags.push("deep-nesting");
    }
    return tags;
  }
  generateFileTags(file) {
    const tags = ["complexity", file.level, "file"];
    if (file.complexFunctions.length > 3) {
      tags.push("multiple-hotspots");
    }
    if (file.complexity.maintainabilityIndex < 50) {
      tags.push("low-maintainability");
    }
    return tags;
  }
  generateFileIssues(file) {
    const issues = [];
    if (file.complexFunctions.length > 0) {
      issues.push(
        `Contains ${file.complexFunctions.length} complex function(s) that need attention`
      );
    }
    if (file.complexity.maintainabilityIndex < 50) {
      issues.push(
        `Low maintainability index (${file.complexity.maintainabilityIndex})`
      );
    }
    if (file.complexity.avgCyclomatic > 10) {
      issues.push(
        `High average cyclomatic complexity (${file.complexity.avgCyclomatic})`
      );
    }
    return issues;
  }
  generateFileRecommendations(file) {
    const recommendations = [];
    if (file.complexFunctions.length > 3) {
      recommendations.push("Consider splitting this file into smaller modules");
    }
    if (file.complexity.avgCyclomatic > 10) {
      recommendations.push("Refactor complex functions to reduce average complexity");
    }
    if (file.complexity.functionCount > 20) {
      recommendations.push("Large number of functions - consider organizing into classes");
    }
    return recommendations;
  }
  generateDescription(node) {
    if (node.type === "complex-function") {
      return `Complex function with cyclomatic complexity ${node.complexity.cyclomatic}`;
    }
    return `Complex file containing ${node.relatedNodes.length} complexity hotspots`;
  }
  getSeverityEmoji(level) {
    switch (level) {
      case "critical":
        return "🔴";
      case "high":
        return "🟠";
      case "moderate":
        return "🟡";
      case "low":
        return "🟢";
    }
  }
}
function generateComplexityNodes(analysis, projectRoot) {
  const generator = new ComplexityGraphGenerator(projectRoot);
  const nodes = generator.generateNodes(analysis);
  const edges = generator.generateEdges(nodes, analysis);
  return { nodes, edges };
}
export {
  ComplexityGraphGenerator,
  generateComplexityNodes
};
//# sourceMappingURL=graph-generator.js.map
