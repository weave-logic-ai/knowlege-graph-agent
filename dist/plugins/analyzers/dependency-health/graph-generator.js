import { createLogger } from "../../../utils/logger.js";
const logger = createLogger("dependency-graph-generator");
function generateNodeId(packageName) {
  return `dep:${packageName.replace(/[@/]/g, "-").replace(/^-/, "")}`;
}
function mapHealthToNodeStatus(status) {
  switch (status) {
    case "healthy":
      return "active";
    case "critical":
      return "deprecated";
    default:
      return "draft";
  }
}
function generateTags(score, dependency) {
  const tags = ["dependency", dependency.ecosystem];
  if (dependency.isDev) {
    tags.push("dev-dependency");
  }
  if (score.status === "critical") {
    tags.push("critical-health");
  } else if (score.status === "warning") {
    tags.push("needs-attention");
  }
  if (score.issues.some((i) => i.type === "vulnerability")) {
    tags.push("has-vulnerabilities");
  }
  if (score.issues.some((i) => i.type === "outdated")) {
    tags.push("outdated");
  }
  if (score.issues.some((i) => i.type === "deprecated")) {
    tags.push("deprecated");
  }
  return tags;
}
class DependencyGraphGenerator {
  projectName;
  constructor(projectName = "project") {
    this.projectName = projectName;
  }
  /**
   * Generate knowledge graph nodes from analysis result
   */
  generateNodes(analysis) {
    const nodes = [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const healthScore of analysis.dependencies) {
      const nodeId = generateNodeId(healthScore.name);
      const node = {
        id: nodeId,
        type: "primitive",
        name: healthScore.name,
        version: healthScore.version,
        health: healthScore,
        dependency: {
          name: healthScore.name,
          version: healthScore.version,
          type: "library",
          category: "dependencies",
          ecosystem: "nodejs",
          usedBy: [],
          relatedTo: []
        },
        tags: generateTags(healthScore, {
          name: healthScore.name,
          version: healthScore.version,
          ecosystem: "nodejs"
        }),
        warnings: this.generateWarnings(healthScore),
        createdAt: now,
        updatedAt: now
      };
      nodes.push(node);
    }
    logger.info("Generated dependency nodes", { count: nodes.length });
    return nodes;
  }
  /**
   * Generate warning metadata from health score
   */
  generateWarnings(score) {
    const vulnIssues = score.issues.filter((i) => i.type === "vulnerability");
    const hasVulns = vulnIssues.length > 0;
    let maxSeverity;
    if (hasVulns) {
      const severities = ["critical", "high", "moderate", "low", "info"];
      for (const sev of severities) {
        if (vulnIssues.some((i) => i.severity === sev || i.data?.maxSeverity && i.data.maxSeverity === sev)) {
          maxSeverity = sev;
          break;
        }
      }
    }
    return {
      hasVulnerabilities: hasVulns,
      vulnerabilityCount: vulnIssues.length,
      maxSeverity,
      isOutdated: score.issues.some((i) => i.type === "outdated"),
      isDeprecated: score.issues.some((i) => i.type === "deprecated")
    };
  }
  /**
   * Generate edges representing dependency relationships
   */
  generateEdges(nodes, packageJsonDeps) {
    const edges = [];
    new Set(nodes.map((n) => n.id));
    const projectNodeId = `project:${this.projectName}`;
    for (const node of nodes) {
      const edge = {
        source: projectNodeId,
        target: node.id,
        type: "link",
        weight: node.health.status === "healthy" ? 1 : node.health.status === "warning" ? 0.7 : 0.4,
        dependencyType: node.tags.includes("dev-dependency") ? "development" : "production",
        versionConstraint: node.version
      };
      edges.push(edge);
    }
    for (const node of nodes) {
      const scopeMatch = node.name.match(/^@([^/]+)\//);
      if (scopeMatch) {
        const scope = scopeMatch[1];
        for (const otherNode of nodes) {
          if (otherNode.id !== node.id && otherNode.name.startsWith(`@${scope}/`)) {
            if (node.name < otherNode.name) {
              edges.push({
                source: node.id,
                target: otherNode.id,
                type: "related",
                weight: 0.5
              });
            }
          }
        }
      }
    }
    logger.info("Generated dependency edges", { count: edges.length });
    return edges;
  }
  /**
   * Convert DependencyHealthNode to standard KnowledgeNode
   */
  toKnowledgeNode(node) {
    const healthSummary = [
      `Health Score: ${node.health.overallScore}/100`,
      `Security: ${node.health.components.security}/100`,
      `Freshness: ${node.health.components.freshness}/100`,
      `Maintenance: ${node.health.components.maintenance}/100`
    ].join("\n");
    const issues = node.health.issues.length > 0 ? "\n\n## Issues\n" + node.health.issues.map((i) => `- [${i.severity}] ${i.message}`).join("\n") : "";
    const recommendations = node.health.recommendations.length > 0 ? "\n\n## Recommendations\n" + node.health.recommendations.map((r) => `- ${r}`).join("\n") : "";
    const content = `# ${node.name}

**Version:** ${node.version}
**Status:** ${node.health.status}

## Health Metrics

${healthSummary}
${issues}
${recommendations}
`;
    return {
      id: node.id,
      path: `dependencies/${node.name.replace(/[@/]/g, "-")}.md`,
      filename: `${node.name.replace(/[@/]/g, "-")}.md`,
      title: node.name,
      type: node.type,
      status: mapHealthToNodeStatus(node.health.status),
      content,
      frontmatter: {
        title: node.name,
        type: node.type,
        status: mapHealthToNodeStatus(node.health.status),
        tags: node.tags,
        category: "dependencies",
        version: node.version,
        healthScore: node.health.overallScore,
        hasVulnerabilities: node.warnings?.hasVulnerabilities,
        isOutdated: node.warnings?.isOutdated,
        created: node.createdAt,
        updated: node.updatedAt
      },
      tags: node.tags,
      outgoingLinks: [],
      incomingLinks: [],
      wordCount: content.split(/\s+/).length,
      lastModified: new Date(node.updatedAt)
    };
  }
  /**
   * Convert GraphEdge to standard format
   */
  toGraphEdge(edge) {
    return {
      source: edge.source,
      target: edge.target,
      type: edge.type,
      weight: edge.weight,
      context: edge.dependencyType
    };
  }
  /**
   * Generate full graph structure
   */
  generateGraph(analysis) {
    const healthNodes = this.generateNodes(analysis);
    const healthEdges = this.generateEdges(healthNodes);
    return {
      nodes: healthNodes.map((n) => this.toKnowledgeNode(n)),
      edges: healthEdges.map((e) => this.toGraphEdge(e)),
      metadata: {
        totalDependencies: analysis.totalDependencies,
        averageHealthScore: analysis.summary.averageHealthScore,
        vulnerableCount: analysis.summary.vulnerabilities.total,
        outdatedCount: analysis.summary.outdated.total,
        analyzedAt: analysis.analyzedAt
      }
    };
  }
  /**
   * Generate markdown summary of dependency health
   */
  generateMarkdownReport(analysis) {
    const lines = [
      "# Dependency Health Report",
      "",
      `Generated: ${analysis.analyzedAt}`,
      `Project: ${analysis.projectRoot}`,
      "",
      "## Summary",
      "",
      `- **Total Dependencies:** ${analysis.totalDependencies}`,
      `- **Average Health Score:** ${analysis.summary.averageHealthScore}/100`,
      `- **Healthy:** ${analysis.summary.healthScores.healthy}`,
      `- **Warning:** ${analysis.summary.healthScores.warning}`,
      `- **Critical:** ${analysis.summary.healthScores.critical}`,
      "",
      "### Vulnerabilities",
      "",
      `- Critical: ${analysis.summary.vulnerabilities.critical}`,
      `- High: ${analysis.summary.vulnerabilities.high}`,
      `- Moderate: ${analysis.summary.vulnerabilities.moderate}`,
      `- Low: ${analysis.summary.vulnerabilities.low}`,
      "",
      "### Outdated Packages",
      "",
      `- Major updates: ${analysis.summary.outdated.major}`,
      `- Minor updates: ${analysis.summary.outdated.minor}`,
      `- Patch updates: ${analysis.summary.outdated.patch}`,
      ""
    ];
    const criticalDeps = analysis.dependencies.filter((d) => d.status === "critical");
    if (criticalDeps.length > 0) {
      lines.push("## Critical Issues", "");
      for (const dep of criticalDeps) {
        lines.push(`### ${dep.name} (Score: ${dep.overallScore})`);
        lines.push("");
        for (const issue of dep.issues) {
          lines.push(`- **[${issue.severity.toUpperCase()}]** ${issue.message}`);
        }
        if (dep.recommendations.length > 0) {
          lines.push("");
          lines.push("**Recommendations:**");
          for (const rec of dep.recommendations) {
            lines.push(`- ${rec}`);
          }
        }
        lines.push("");
      }
    }
    const warningDeps = analysis.dependencies.filter((d) => d.status === "warning");
    if (warningDeps.length > 0) {
      lines.push("## Needs Attention", "");
      for (const dep of warningDeps.slice(0, 10)) {
        lines.push(`- **${dep.name}** (Score: ${dep.overallScore}): ${dep.issues[0]?.message ?? "Various issues"}`);
      }
      if (warningDeps.length > 10) {
        lines.push(`- ... and ${warningDeps.length - 10} more`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }
}
function createDependencyGraphGenerator(projectName) {
  return new DependencyGraphGenerator(projectName);
}
export {
  DependencyGraphGenerator,
  createDependencyGraphGenerator
};
//# sourceMappingURL=graph-generator.js.map
