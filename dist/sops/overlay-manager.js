import { GraphLayer, ComplianceStatus } from "./types.js";
import { getSOPsByCategory, getAllSOPs } from "./registry.js";
import { createLogger } from "../utils/logger.js";
const logger = createLogger("overlay-manager");
const DEFAULT_STYLES = {
  statusColors: {
    [ComplianceStatus.COMPLIANT]: "#22c55e",
    // green
    [ComplianceStatus.PARTIAL]: "#f59e0b",
    // amber
    [ComplianceStatus.NON_COMPLIANT]: "#ef4444",
    // red
    [ComplianceStatus.NOT_APPLICABLE]: "#9ca3af",
    // gray
    [ComplianceStatus.PENDING]: "#6b7280"
    // dark gray
  },
  layerColors: {
    [GraphLayer.STANDARDS]: "#3b82f6",
    // blue
    [GraphLayer.PROJECT]: "#8b5cf6",
    // purple
    [GraphLayer.COMPLIANCE]: "#ec4899",
    // pink
    [GraphLayer.CUSTOM]: "#06b6d4"
    // cyan
  },
  nodeSizes: {
    "sop": 30,
    "requirement": 20,
    "artifact": 15,
    "gap": 25,
    "category": 35
  }
};
function createMultiLayerGraph(options = {}) {
  const {
    graphId = `mlg-${Date.now()}`,
    graphName = "AI-SDLC Compliance Graph",
    includeAllSOPs = true,
    categories
  } = options;
  logger.info("Creating multi-layer graph", { graphId, graphName });
  const layers = [
    {
      id: "standards-layer",
      name: "AI-SDLC Standards",
      type: GraphLayer.STANDARDS,
      description: "Reference layer containing AI-SDLC SOP definitions",
      visible: true,
      order: 0
    },
    {
      id: "project-layer",
      name: "Project Implementation",
      type: GraphLayer.PROJECT,
      description: "Project-specific nodes and artifacts",
      visible: true,
      order: 1
    },
    {
      id: "compliance-layer",
      name: "Compliance Overlay",
      type: GraphLayer.COMPLIANCE,
      description: "Compliance status and gap visualization",
      visible: true,
      order: 2
    }
  ];
  const nodes = [];
  const edges = [];
  let sops;
  if (categories && categories.length > 0) {
    sops = categories.flatMap((cat) => getSOPsByCategory(cat));
  } else if (includeAllSOPs) {
    sops = getAllSOPs();
  } else {
    sops = [];
  }
  const categorySet = new Set(sops.map((s) => s.category));
  for (const category of categorySet) {
    const categoryNode = {
      id: `cat-${category}`,
      title: formatCategoryName(category),
      type: "category",
      layer: GraphLayer.STANDARDS,
      tags: ["category", category],
      metadata: {
        category,
        sopCount: sops.filter((s) => s.category === category).length
      }
    };
    nodes.push(categoryNode);
  }
  for (const sop of sops) {
    const sopNode = {
      id: `sop-${sop.id}`,
      title: sop.title,
      type: "sop",
      layer: GraphLayer.STANDARDS,
      sopRef: sop.id,
      tags: [...sop.tags, sop.category],
      metadata: {
        number: sop.number,
        priority: sop.priority,
        version: sop.version,
        requirementCount: sop.requirements.length,
        checkpointCount: sop.checkpoints.length,
        irbRequired: sop.irbTypicallyRequired
      }
    };
    nodes.push(sopNode);
    edges.push({
      source: `cat-${sop.category}`,
      target: `sop-${sop.id}`,
      type: "references",
      layer: GraphLayer.STANDARDS,
      weight: 1
    });
    for (const relatedId of sop.relatedSOPs) {
      if (sops.some((s) => s.id === relatedId)) {
        edges.push({
          source: `sop-${sop.id}`,
          target: `sop-${relatedId}`,
          type: "references",
          layer: GraphLayer.STANDARDS,
          weight: 0.5,
          metadata: { relationship: "related" }
        });
      }
    }
  }
  logger.info("Created standards layer", {
    categories: categorySet.size,
    sops: sops.length,
    nodes: nodes.length,
    edges: edges.length
  });
  return {
    id: graphId,
    name: graphName,
    layers,
    nodes,
    edges,
    crossLayerEdges: [],
    metadata: {
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      sopCount: sops.length,
      categories: Array.from(categorySet)
    }
  };
}
function addProjectLayer(graph, projectNodes, projectEdges) {
  logger.info("Adding project layer", {
    nodes: projectNodes.length,
    edges: projectEdges.length
  });
  for (const node of projectNodes) {
    const layerNode = {
      id: `proj-${node.id}`,
      title: node.title,
      type: node.type,
      layer: GraphLayer.PROJECT,
      tags: node.tags || []
    };
    graph.nodes.push(layerNode);
  }
  for (const edge of projectEdges) {
    const layerEdge = {
      source: `proj-${edge.source}`,
      target: `proj-${edge.target}`,
      type: edge.type || "wikilink",
      layer: GraphLayer.PROJECT,
      weight: 1
    };
    graph.edges.push(layerEdge);
  }
  return graph;
}
function addComplianceOverlay(graph, checkResult, gapResult) {
  logger.info("Adding compliance overlay", {
    assessments: checkResult.assessments.length,
    gaps: gapResult?.totalGaps || 0
  });
  for (const assessment of checkResult.assessments) {
    const sopNode = graph.nodes.find((n) => n.sopRef === assessment.sopId);
    if (sopNode) {
      sopNode.complianceStatus = assessment.status;
      sopNode.metadata = {
        ...sopNode.metadata,
        complianceScore: assessment.score,
        requirementsMet: assessment.requirementsMet.length,
        requirementsGaps: assessment.requirementsGaps.length,
        irbStatus: assessment.irbStatus,
        assessedAt: assessment.assessedAt.toISOString()
      };
    }
  }
  for (const evidence of checkResult.evidence) {
    const evidenceNode = {
      id: `evidence-${evidence.requirementId}-${Date.now()}`,
      title: evidence.description,
      type: "artifact",
      layer: GraphLayer.PROJECT,
      tags: ["evidence", evidence.type],
      metadata: {
        filePath: evidence.filePath,
        confidence: evidence.confidence,
        excerpt: evidence.excerpt
      }
    };
    graph.nodes.push(evidenceNode);
    const sopId = findSOPForRequirement(evidence.requirementId);
    if (sopId) {
      graph.crossLayerEdges.push({
        source: evidenceNode.id,
        target: `sop-${sopId}`,
        type: "implements",
        layer: GraphLayer.COMPLIANCE,
        weight: evidence.confidence,
        metadata: {
          requirementId: evidence.requirementId,
          evidenceType: evidence.type
        }
      });
    }
  }
  if (gapResult) {
    for (const gap of gapResult.gaps) {
      const gapNode = {
        id: `gap-${gap.id}`,
        title: `Gap: ${gap.description.substring(0, 50)}...`,
        type: "gap",
        layer: GraphLayer.COMPLIANCE,
        complianceStatus: ComplianceStatus.NON_COMPLIANT,
        tags: ["gap", gap.priority, gap.status],
        metadata: {
          sopId: gap.sopId,
          requirementId: gap.requirementId,
          priority: gap.priority,
          effort: gap.effort,
          remediation: gap.remediation,
          impact: gap.impact
        }
      };
      graph.nodes.push(gapNode);
      graph.crossLayerEdges.push({
        source: gapNode.id,
        target: `sop-${gap.sopId}`,
        type: "compliance-gap",
        layer: GraphLayer.COMPLIANCE,
        weight: 1,
        metadata: {
          requirementId: gap.requirementId,
          priority: gap.priority
        }
      });
    }
  }
  graph.metadata = {
    ...graph.metadata,
    complianceScore: checkResult.overallScore,
    categoryScores: checkResult.categoryScores,
    gapCount: gapResult?.totalGaps || 0,
    checkedAt: checkResult.checkedAt.toISOString()
  };
  return graph;
}
function findSOPForRequirement(requirementId) {
  const allSOPs = getAllSOPs();
  for (const sop of allSOPs) {
    if (sop.requirements.some((r) => r.id === requirementId)) {
      return sop.id;
    }
  }
  return null;
}
function formatCategoryName(category) {
  return category.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function filterByLayer(graph, layer) {
  return {
    nodes: graph.nodes.filter((n) => n.layer === layer),
    edges: graph.edges.filter((e) => e.layer === layer)
  };
}
function filterByComplianceStatus(graph, status) {
  const filteredNodes = graph.nodes.filter((n) => n.complianceStatus === status);
  const nodeIds = new Set(filteredNodes.map((n) => n.id));
  return {
    nodes: filteredNodes,
    edges: graph.edges.filter((e) => nodeIds.has(e.source) || nodeIds.has(e.target))
  };
}
function getComplianceSummary(graph) {
  const sopNodes = graph.nodes.filter((n) => n.type === "sop" && n.sopRef);
  const compliant = sopNodes.filter((n) => n.complianceStatus === ComplianceStatus.COMPLIANT).length;
  const partial = sopNodes.filter((n) => n.complianceStatus === ComplianceStatus.PARTIAL).length;
  const nonCompliant = sopNodes.filter((n) => n.complianceStatus === ComplianceStatus.NON_COMPLIANT).length;
  const pending = sopNodes.filter(
    (n) => n.complianceStatus === ComplianceStatus.PENDING || !n.complianceStatus
  ).length;
  const overallScore = graph.metadata?.complianceScore || 0;
  return {
    totalSOPs: sopNodes.length,
    compliant,
    partial,
    nonCompliant,
    pending,
    overallScore
  };
}
function getGapNodes(graph) {
  return graph.nodes.filter((n) => n.type === "gap");
}
function toggleLayerVisibility(graph, layerType, visible) {
  const layer = graph.layers.find((l) => l.type === layerType);
  if (layer) {
    layer.visible = visible;
  }
  return graph;
}
function exportToVisualizationFormat(graph, styles = DEFAULT_STYLES) {
  const mergedStyles = { ...DEFAULT_STYLES, ...styles };
  const nodes = graph.nodes.filter((n) => {
    const layer = graph.layers.find((l) => l.type === n.layer);
    return layer?.visible !== false;
  }).map((n) => ({
    id: n.id,
    label: n.title,
    group: n.layer,
    color: n.complianceStatus ? mergedStyles.statusColors[n.complianceStatus] : mergedStyles.layerColors[n.layer],
    size: mergedStyles.nodeSizes[n.type] || 20,
    metadata: n.metadata || {}
  }));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = [...graph.edges, ...graph.crossLayerEdges].filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)).map((e) => ({
    source: e.source,
    target: e.target,
    type: e.type,
    weight: e.weight
  }));
  return { nodes, edges };
}
function createSOPFocusedSubgraph(graph, sopId, depth = 1) {
  const focusNodeId = `sop-${sopId}`;
  const includedNodeIds = /* @__PURE__ */ new Set([focusNodeId]);
  const queue = [
    { id: focusNodeId, currentDepth: 0 }
  ];
  const allEdges = [...graph.edges, ...graph.crossLayerEdges];
  while (queue.length > 0) {
    const { id, currentDepth } = queue.shift();
    if (currentDepth >= depth) continue;
    for (const edge of allEdges) {
      if (edge.source === id && !includedNodeIds.has(edge.target)) {
        includedNodeIds.add(edge.target);
        queue.push({ id: edge.target, currentDepth: currentDepth + 1 });
      }
      if (edge.target === id && !includedNodeIds.has(edge.source)) {
        includedNodeIds.add(edge.source);
        queue.push({ id: edge.source, currentDepth: currentDepth + 1 });
      }
    }
  }
  const filteredNodes = graph.nodes.filter((n) => includedNodeIds.has(n.id));
  const filteredEdges = graph.edges.filter(
    (e) => includedNodeIds.has(e.source) && includedNodeIds.has(e.target)
  );
  const filteredCrossLayerEdges = graph.crossLayerEdges.filter(
    (e) => includedNodeIds.has(e.source) && includedNodeIds.has(e.target)
  );
  return {
    ...graph,
    id: `${graph.id}-focus-${sopId}`,
    name: `${graph.name} (Focus: ${sopId})`,
    nodes: filteredNodes,
    edges: filteredEdges,
    crossLayerEdges: filteredCrossLayerEdges
  };
}
export {
  addComplianceOverlay,
  addProjectLayer,
  createMultiLayerGraph,
  createSOPFocusedSubgraph,
  exportToVisualizationFormat,
  filterByComplianceStatus,
  filterByLayer,
  getComplianceSummary,
  getGapNodes,
  toggleLayerVisibility
};
//# sourceMappingURL=overlay-manager.js.map
