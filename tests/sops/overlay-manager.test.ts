/**
 * Overlay Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  createMultiLayerGraph,
  addProjectLayer,
  addComplianceOverlay,
  filterByLayer,
  filterByComplianceStatus,
  getComplianceSummary,
  getGapNodes,
  toggleLayerVisibility,
  exportToVisualizationFormat,
  createSOPFocusedSubgraph,
} from '../../src/sops/overlay-manager.js';
import { checkCompliance } from '../../src/sops/compliance-checker.js';
import { analyzeGaps } from '../../src/sops/gap-analyzer.js';
import { SOPCategory, GraphLayer, ComplianceStatus } from '../../src/sops/types.js';

describe('OverlayManager', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `kg-overlay-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('createMultiLayerGraph', () => {
    it('should create a multi-layer graph with standards', () => {
      const graph = createMultiLayerGraph();

      expect(graph.id).toBeDefined();
      expect(graph.name).toBeDefined();
      expect(graph.layers.length).toBe(3); // standards, project, compliance
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
    });

    it('should create layers with correct types', () => {
      const graph = createMultiLayerGraph();

      const layerTypes = graph.layers.map(l => l.type);
      expect(layerTypes).toContain(GraphLayer.STANDARDS);
      expect(layerTypes).toContain(GraphLayer.PROJECT);
      expect(layerTypes).toContain(GraphLayer.COMPLIANCE);
    });

    it('should create SOP nodes in standards layer', () => {
      const graph = createMultiLayerGraph();

      const sopNodes = graph.nodes.filter(n => n.type === 'sop');
      expect(sopNodes.length).toBeGreaterThan(0);

      for (const node of sopNodes) {
        expect(node.layer).toBe(GraphLayer.STANDARDS);
        expect(node.sopRef).toBeDefined();
      }
    });

    it('should create category nodes', () => {
      const graph = createMultiLayerGraph();

      const categoryNodes = graph.nodes.filter(n => n.type === 'category');
      expect(categoryNodes.length).toBeGreaterThan(0);
    });

    it('should filter by categories', () => {
      const graph = createMultiLayerGraph({
        categories: [SOPCategory.DEVELOPMENT],
      });

      const sopNodes = graph.nodes.filter(n => n.type === 'sop');
      // All SOP nodes should be from development category
      for (const node of sopNodes) {
        expect(node.sopRef).toMatch(/SOP-1[12]\d{2}/);
      }
    });

    it('should set custom graph ID and name', () => {
      const graph = createMultiLayerGraph({
        graphId: 'custom-id',
        graphName: 'Custom Graph',
      });

      expect(graph.id).toBe('custom-id');
      expect(graph.name).toBe('Custom Graph');
    });
  });

  describe('addProjectLayer', () => {
    it('should add project nodes to graph', () => {
      const graph = createMultiLayerGraph();
      const initialNodeCount = graph.nodes.length;

      const projectNodes = [
        { id: 'doc1', title: 'Document 1', type: 'document', tags: ['docs'] },
        { id: 'doc2', title: 'Document 2', type: 'document', tags: ['docs'] },
      ];

      addProjectLayer(graph, projectNodes, []);

      expect(graph.nodes.length).toBe(initialNodeCount + 2);

      const addedNodes = graph.nodes.filter(n => n.layer === GraphLayer.PROJECT);
      expect(addedNodes.length).toBeGreaterThanOrEqual(2);
    });

    it('should add project edges', () => {
      const graph = createMultiLayerGraph();
      const initialEdgeCount = graph.edges.length;

      const projectNodes = [
        { id: 'doc1', title: 'Document 1', type: 'document' },
        { id: 'doc2', title: 'Document 2', type: 'document' },
      ];
      const projectEdges = [
        { source: 'doc1', target: 'doc2', type: 'wikilink' },
      ];

      addProjectLayer(graph, projectNodes, projectEdges);

      expect(graph.edges.length).toBe(initialEdgeCount + 1);
    });
  });

  describe('addComplianceOverlay', () => {
    it('should add compliance status to SOP nodes', async () => {
      const graph = createMultiLayerGraph();
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      addComplianceOverlay(graph, checkResult);

      const sopNodes = graph.nodes.filter(n => n.type === 'sop' && n.sopRef);
      const nodesWithStatus = sopNodes.filter(n => n.complianceStatus !== undefined);
      expect(nodesWithStatus.length).toBeGreaterThan(0);
    });

    it('should add gap nodes when gap result provided', async () => {
      const graph = createMultiLayerGraph();
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });
      const gapResult = analyzeGaps(checkResult);

      addComplianceOverlay(graph, checkResult, gapResult);

      const gapNodes = graph.nodes.filter(n => n.type === 'gap');
      expect(gapNodes.length).toBe(gapResult.totalGaps);
    });

    it('should create cross-layer edges', async () => {
      const graph = createMultiLayerGraph();
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });
      const gapResult = analyzeGaps(checkResult);

      addComplianceOverlay(graph, checkResult, gapResult);

      expect(graph.crossLayerEdges.length).toBeGreaterThan(0);
    });

    it('should update graph metadata', async () => {
      const graph = createMultiLayerGraph();
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });

      addComplianceOverlay(graph, checkResult);

      expect(graph.metadata?.complianceScore).toBeDefined();
      expect(graph.metadata?.checkedAt).toBeDefined();
    });
  });

  describe('filterByLayer', () => {
    it('should filter nodes by layer', () => {
      const graph = createMultiLayerGraph();
      const { nodes, edges } = filterByLayer(graph, GraphLayer.STANDARDS);

      for (const node of nodes) {
        expect(node.layer).toBe(GraphLayer.STANDARDS);
      }
      for (const edge of edges) {
        expect(edge.layer).toBe(GraphLayer.STANDARDS);
      }
    });
  });

  describe('filterByComplianceStatus', () => {
    it('should filter by compliance status', async () => {
      const graph = createMultiLayerGraph();
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });
      addComplianceOverlay(graph, checkResult);

      const { nodes } = filterByComplianceStatus(graph, ComplianceStatus.NON_COMPLIANT);

      for (const node of nodes) {
        expect(node.complianceStatus).toBe(ComplianceStatus.NON_COMPLIANT);
      }
    });
  });

  describe('getComplianceSummary', () => {
    it('should return compliance summary', async () => {
      const graph = createMultiLayerGraph();
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });
      addComplianceOverlay(graph, checkResult);

      const summary = getComplianceSummary(graph);

      expect(summary.totalSOPs).toBeGreaterThan(0);
      expect(typeof summary.compliant).toBe('number');
      expect(typeof summary.partial).toBe('number');
      expect(typeof summary.nonCompliant).toBe('number');
      expect(typeof summary.pending).toBe('number');
      expect(typeof summary.overallScore).toBe('number');
    });
  });

  describe('getGapNodes', () => {
    it('should return gap nodes', async () => {
      const graph = createMultiLayerGraph();
      const checkResult = await checkCompliance({
        projectRoot: testDir,
      });
      const gapResult = analyzeGaps(checkResult);
      addComplianceOverlay(graph, checkResult, gapResult);

      const gapNodes = getGapNodes(graph);
      expect(gapNodes.length).toBe(gapResult.totalGaps);
    });
  });

  describe('toggleLayerVisibility', () => {
    it('should toggle layer visibility', () => {
      const graph = createMultiLayerGraph();

      // Initially visible
      const standardsLayer = graph.layers.find(l => l.type === GraphLayer.STANDARDS);
      expect(standardsLayer?.visible).toBe(true);

      // Toggle off
      toggleLayerVisibility(graph, GraphLayer.STANDARDS, false);
      expect(standardsLayer?.visible).toBe(false);

      // Toggle on
      toggleLayerVisibility(graph, GraphLayer.STANDARDS, true);
      expect(standardsLayer?.visible).toBe(true);
    });
  });

  describe('exportToVisualizationFormat', () => {
    it('should export to visualization format', () => {
      const graph = createMultiLayerGraph();
      const exported = exportToVisualizationFormat(graph);

      expect(Array.isArray(exported.nodes)).toBe(true);
      expect(Array.isArray(exported.edges)).toBe(true);

      for (const node of exported.nodes) {
        expect(node.id).toBeDefined();
        expect(node.label).toBeDefined();
        expect(node.color).toBeDefined();
        expect(typeof node.size).toBe('number');
      }

      for (const edge of exported.edges) {
        expect(edge.source).toBeDefined();
        expect(edge.target).toBeDefined();
        expect(typeof edge.weight).toBe('number');
      }
    });

    it('should respect layer visibility', () => {
      const graph = createMultiLayerGraph();
      toggleLayerVisibility(graph, GraphLayer.STANDARDS, false);

      const exported = exportToVisualizationFormat(graph);

      // Should not include hidden layer nodes
      for (const node of exported.nodes) {
        expect(node.group).not.toBe(GraphLayer.STANDARDS);
      }
    });
  });

  describe('createSOPFocusedSubgraph', () => {
    it('should create focused subgraph', () => {
      const graph = createMultiLayerGraph();
      const subgraph = createSOPFocusedSubgraph(graph, 'SOP-1200-01-AI');

      expect(subgraph.id).toContain('focus');
      expect(subgraph.nodes.length).toBeLessThan(graph.nodes.length);

      // Should include the focus SOP
      const focusNode = subgraph.nodes.find(n => n.sopRef === 'SOP-1200-01-AI');
      expect(focusNode).toBeDefined();
    });

    it('should include connected nodes within depth', () => {
      const graph = createMultiLayerGraph();
      const subgraph = createSOPFocusedSubgraph(graph, 'SOP-1200-01-AI', 2);

      // Should have more nodes with higher depth
      const subgraphDepth1 = createSOPFocusedSubgraph(graph, 'SOP-1200-01-AI', 1);
      expect(subgraph.nodes.length).toBeGreaterThanOrEqual(subgraphDepth1.nodes.length);
    });
  });
});
