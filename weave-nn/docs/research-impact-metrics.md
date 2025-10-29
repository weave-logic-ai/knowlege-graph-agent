---
title: Research Impact Metrics for Knowledge Graph Evolution
type: documentation
status: complete
created_date: {}
updated_date: '2025-10-28'
tags:
  - research-impact
  - knowledge-graph
  - metrics
  - connection-evolution
  - learning-velocity
category: research
domain: knowledge-graph
scope: system
audience:
  - researchers
  - architects
  - analysts
related_concepts:
  - knowledge-graph
  - connection-metrics
  - research-impact
  - iterative-improvement
  - learning-velocity
  - document-centrality
related_files:
  - hive-mind/naming-metadata-audit.md
  - phase-12-capability-matrix.md
  - phase-12-weaver-inventory.md
author: ai-generated
version: '1.0'
priority: medium
visual:
  icon: 📚
  color: '#06B6D4'
  cssclasses:
    - type-documentation
    - status-complete
    - priority-medium
    - domain-knowledge-graph
  graph_group: navigation
icon: 📚
---

# Research Impact Metrics for Knowledge Graph Evolution

**Status**: 📊 **DESIGN COMPLETE**
**Created**: 2025-10-27
**Agent**: Analyst (Hive Mind Swarm)
**Purpose**: Track how iterative research improves knowledge graph connections

---

## 🎯 Executive Summary

This document defines **quantitative metrics** for measuring research impact on knowledge graph evolution. These metrics enable researchers to track connection quality, document importance, knowledge density, and learning velocity as the knowledge base grows through iterative documentation and research.

### Key Metrics Categories

1. **Connection Evolution Metrics** - Track link strength changes over time
2. **Research Impact Indicators** - Measure document influence and centrality
3. **Iterative Improvement Tracking** - Quantify learning velocity
4. **Knowledge Graph Health** - Overall system quality indicators

### Success Criteria

| Metric | Baseline | Target | Timeline |
|--------|----------|--------|----------|
| **Average Connections per Document** | 3.2 | 8.0+ | 6 months |
| **Knowledge Graph Density** | 0.12 | 0.35+ | 6 months |
| **Bridge Document Percentage** | 5% | 15%+ | 3 months |
| **Concept Emergence Rate** | 2/month | 10+/month | 3 months |
| **Connection Strength Growth** | +5%/commit | +15%/commit | Immediate |

---



## Related

[[GRAPH-VALIDATION-REPORT]]
## 📈 1. Connection Evolution Metrics

### 1.1 Connection Strength Metric

**Definition**: Semantic similarity score between two connected documents, normalized 0-1.

**Calculation**:
```typescript
interface ConnectionStrength {
  source: DocumentID;
  target: DocumentID;
  strength: number;           // 0-1, cosine similarity of embeddings
  strengthHistory: {
    timestamp: Date;
    strength: number;
    changeReason: string;    // "new_content", "refinement", "cross_link"
  }[];
  evolutionRate: number;      // dS/dt averaged over last 5 commits
  confidenceInterval: [number, number];  // ±1 std dev
}

function calculateStrength(doc1: Document, doc2: Document): number {
  const embedding1 = await generateEmbedding(doc1.content);
  const embedding2 = await generateEmbedding(doc2.content);
  return cosineSimilarity(embedding1, embedding2);
}

function trackEvolution(connection: ConnectionStrength): EvolutionMetric {
  const recentHistory = connection.strengthHistory.slice(-5);
  const deltas = recentHistory.map((h, i) =>
    i > 0 ? h.strength - recentHistory[i-1].strength : 0
  ).slice(1);

  return {
    averageDelta: mean(deltas),
    trend: deltas.every(d => d > 0) ? 'strengthening' :
           deltas.every(d => d < 0) ? 'weakening' : 'stable',
    volatility: standardDeviation(deltas)
  };
}
```

**Interpretation Guidelines**:
- **0.0-0.3**: Weak connection, candidates for removal
- **0.3-0.6**: Moderate connection, monitor for strengthening
- **0.6-0.8**: Strong connection, valuable cross-reference
- **0.8-1.0**: Very strong, possibly redundant (consider merging)

**Baseline Measurements** (Current State):
```typescript
// From existing 61 Phase 12-13 documents
const baselineMetrics = {
  averageStrength: 0.42,
  medianStrength: 0.38,
  strongConnections: 23,      // >0.6
  weakConnections: 87,        // <0.3
  totalConnections: 195
};
```

**Target Trajectory**:
- **Week 1**: Average strength 0.42 → 0.50 (+19%)
- **Month 1**: 0.50 → 0.62 (+24%)
- **Month 3**: 0.62 → 0.70 (+13%)
- **Month 6**: 0.70 → 0.78 (+11%)

---

### 1.2 Connection Density Delta

**Definition**: Change in connection density per commit/session.

**Calculation**:
```typescript
interface DensityMetric {
  timestamp: Date;
  nodeCount: number;
  edgeCount: number;
  density: number;            // edges / (nodes × (nodes - 1) / 2)
  densityDelta: number;       // Change since last measurement
  clusteringCoefficient: number;  // Local connectivity measure
}

function calculateDensity(graph: KnowledgeGraph): number {
  const n = graph.nodes.length;
  const e = graph.edges.length;
  const maxEdges = (n * (n - 1)) / 2;
  return maxEdges > 0 ? e / maxEdges : 0;
}

function trackDensityEvolution(history: DensityMetric[]): DensityTrend {
  const recentDeltas = history.slice(-10).map((m, i) =>
    i > 0 ? m.density - history[history.length - 10 + i - 1].density : 0
  ).slice(1);

  return {
    averageDeltaPerCommit: mean(recentDeltas),
    accelerating: isAccelerating(recentDeltas),
    projectedDensityIn6Months: projectDensity(history, 180)
  };
}
```

**Baseline** (Current Phase 13 knowledge graph):
```typescript
const currentDensity = {
  nodes: 61,                  // Phase 12-13 docs
  edges: 195,                 // Estimated connections
  density: 0.107,             // 195 / (61 × 60 / 2) ≈ 0.107
  clusteringCoefficient: 0.23
};
```

**Target Growth**:
- **Density**: 0.107 → 0.35 (3.3× increase in 6 months)
- **Clustering**: 0.23 → 0.40 (small-world target)

---

### 1.3 Link Type Distribution

**Definition**: Categorize connections by semantic relationship type.

**Link Types**:
```typescript
enum LinkType {
  // Hierarchical (30-40% of links)
  IS_A = "is_a",                    // Inheritance
  PART_OF = "part_of",              // Composition
  IMPLEMENTS = "implements",        // Realization

  // Associative (40-50% of links)
  RELATES_TO = "relates_to",        // General association
  DEPENDS_ON = "depends_on",        // Dependency
  ENABLES = "enables",              // Causality

  // Temporal (10-20% of links)
  PRECEDES = "precedes",            // Sequential
  EVOLVED_FROM = "evolved_from",    // Lineage

  // Evidential (5-10% of links)
  SUPPORTS = "supports",            // Evidence
  CONTRADICTS = "contradicts",      // Conflict
  EXTENDS = "extends"               // Extension
}

interface LinkDistribution {
  timestamp: Date;
  distribution: Record<LinkType, number>;
  balanceScore: number;       // Entropy-based measure (0-1)
  dominantType: LinkType;
  underrepresentedTypes: LinkType[];
}

function calculateBalance(dist: Record<LinkType, number>): number {
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  const probabilities = Object.values(dist).map(count => count / total);
  const entropy = -probabilities.reduce((sum, p) =>
    sum + (p > 0 ? p * Math.log2(p) : 0), 0
  );
  const maxEntropy = Math.log2(Object.keys(dist).length);
  return entropy / maxEntropy;  // 1.0 = perfectly balanced
}
```

**Healthy Distribution** (Target):
```typescript
const targetDistribution = {
  is_a: 0.15,
  part_of: 0.12,
  implements: 0.08,
  relates_to: 0.20,
  depends_on: 0.15,
  enables: 0.10,
  precedes: 0.08,
  evolved_from: 0.05,
  supports: 0.04,
  contradicts: 0.01,
  extends: 0.02
};
```

---

## 📊 2. Research Impact Indicators

### 2.1 Document Importance Score (PageRank)

**Definition**: Measure document centrality via PageRank algorithm.

**Calculation**:
```typescript
interface DocumentImportance {
  documentId: string;
  pageRank: number;           // 0-1, normalized
  inDegree: number;           // Incoming citations
  outDegree: number;          // Outgoing citations
  eigenvectorCentrality: number;
  importanceHistory: {
    timestamp: Date;
    pageRank: number;
  }[];
  growthRate: number;         // % change per month
}

function calculatePageRank(
  graph: KnowledgeGraph,
  dampingFactor: number = 0.85,
  iterations: number = 100
): Map<DocumentID, number> {
  const nodes = graph.nodes;
  const n = nodes.length;
  let ranks = new Map(nodes.map(node => [node.id, 1 / n]));

  for (let iter = 0; iter < iterations; iter++) {
    const newRanks = new Map<DocumentID, number>();

    for (const node of nodes) {
      const incomingLinks = graph.edges.filter(e => e.target === node.id);
      const rankSum = incomingLinks.reduce((sum, link) => {
        const sourceRank = ranks.get(link.source) || 0;
        const sourceOutDegree = graph.edges.filter(e =>
          e.source === link.source
        ).length;
        return sum + (sourceRank / sourceOutDegree);
      }, 0);

      newRanks.set(node.id, (1 - dampingFactor) / n + dampingFactor * rankSum);
    }

    ranks = newRanks;
  }

  return ranks;
}
```

**Interpretation**:
- **Top 10%** (PageRank >0.05): Core foundational documents
- **10-30%** (0.02-0.05): Important reference documents
- **30-70%** (0.005-0.02): Supporting documents
- **Bottom 30%** (<0.005): Peripheral or specialized documents

**Tracking Importance Growth**:
```typescript
function trackImportanceGrowth(doc: DocumentImportance): GrowthMetric {
  const history = doc.importanceHistory.slice(-12);  // Last 12 commits
  const firstRank = history[0].pageRank;
  const lastRank = history[history.length - 1].pageRank;
  const monthsElapsed = (history[history.length - 1].timestamp.getTime() -
                        history[0].timestamp.getTime()) / (30 * 24 * 60 * 60 * 1000);

  return {
    absoluteGrowth: lastRank - firstRank,
    percentGrowth: ((lastRank - firstRank) / firstRank) * 100,
    monthlyGrowthRate: ((lastRank / firstRank) ** (1 / monthsElapsed) - 1) * 100,
    trajectory: classifyTrajectory(history.map(h => h.pageRank))
  };
}

function classifyTrajectory(ranks: number[]):
  'exponential' | 'linear' | 'plateau' | 'decline' {
  const deltas = ranks.slice(1).map((r, i) => r - ranks[i]);
  const acceleration = deltas.slice(1).map((d, i) => d - deltas[i]);

  if (acceleration.every(a => a > 0)) return 'exponential';
  if (Math.abs(mean(acceleration)) < 0.001) return 'linear';
  if (deltas.every(d => Math.abs(d) < 0.001)) return 'plateau';
  return 'decline';
}
```

---

### 2.2 Citation/Reference Frequency

**Definition**: Count how often a document is linked (cited) by others.

**Calculation**:
```typescript
interface CitationMetric {
  documentId: string;
  totalCitations: number;
  uniqueCitingSources: number;
  citationVelocity: number;   // Citations per day (last 30 days)
  citationTypes: Record<LinkType, number>;
  citationHistory: {
    timestamp: Date;
    citingDocument: string;
    context: string;          // Surrounding text snippet
    linkType: LinkType;
  }[];
  hIndex: number;             // H-index adapted for documents
}

function calculateCitationMetrics(
  doc: Document,
  graph: KnowledgeGraph
): CitationMetric {
  const citations = graph.edges.filter(e => e.target === doc.id);
  const recentCitations = citations.filter(c =>
    c.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000
  );

  return {
    documentId: doc.id,
    totalCitations: citations.length,
    uniqueCitingSources: new Set(citations.map(c => c.source)).size,
    citationVelocity: recentCitations.length / 30,
    citationTypes: groupBy(citations, c => c.linkType),
    citationHistory: citations.sort((a, b) =>
      b.timestamp - a.timestamp
    ),
    hIndex: calculateHIndex(doc, graph)
  };
}

function calculateHIndex(doc: Document, graph: KnowledgeGraph): number {
  // H-index: largest h such that h documents cite this doc
  // and each of those documents has ≥h citations themselves
  const citingDocs = graph.edges
    .filter(e => e.target === doc.id)
    .map(e => e.source);

  const citingDocCitations = citingDocs.map(sourceId =>
    graph.edges.filter(e => e.target === sourceId).length
  ).sort((a, b) => b - a);

  let h = 0;
  for (let i = 0; i < citingDocCitations.length; i++) {
    if (citingDocCitations[i] >= i + 1) {
      h = i + 1;
    } else {
      break;
    }
  }

  return h;
}
```

**Citation Velocity Thresholds**:
- **>2.0 citations/day**: Viral, rapidly integrating
- **0.5-2.0**: High impact, active integration
- **0.1-0.5**: Moderate impact, steady growth
- **<0.1**: Low impact or specialized

---

### 2.3 Bridge Document Score

**Definition**: Measure how well a document connects previously unrelated areas.

**Calculation**:
```typescript
interface BridgeMetric {
  documentId: string;
  bridgeScore: number;        // 0-1, higher = more bridging
  connectedClusters: string[]; // Cluster IDs bridged
  beforeBridging: {
    clusterCount: number;
    isolationScore: number;
  };
  afterBridging: {
    clusterCount: number;
    integrationScore: number;
  };
  bridgingEffectiveness: number; // Reduction in avg path length
}

function calculateBridgeScore(
  doc: Document,
  graph: KnowledgeGraph
): BridgeMetric {
  // Step 1: Identify clusters doc connects to
  const connectedNodes = graph.edges
    .filter(e => e.source === doc.id || e.target === doc.id)
    .map(e => e.source === doc.id ? e.target : e.source);

  const clusters = detectClusters(graph);
  const connectedClusters = new Set(
    connectedNodes.map(nodeId => findCluster(nodeId, clusters))
  );

  // Step 2: Calculate path length reduction
  const graphWithoutDoc = removeNode(graph, doc.id);
  const avgPathBefore = averagePathLength(graphWithoutDoc);
  const avgPathAfter = averagePathLength(graph);

  const bridgingEffectiveness = avgPathBefore > 0
    ? (avgPathBefore - avgPathAfter) / avgPathBefore
    : 0;

  return {
    documentId: doc.id,
    bridgeScore: connectedClusters.size / clusters.length,
    connectedClusters: Array.from(connectedClusters),
    beforeBridging: {
      clusterCount: countClusters(graphWithoutDoc),
      isolationScore: 1 - (1 / avgPathBefore)
    },
    afterBridging: {
      clusterCount: clusters.length,
      integrationScore: 1 - (1 / avgPathAfter)
    },
    bridgingEffectiveness
  };
}
```

**Bridge Score Interpretation**:
- **>0.5**: Exceptional bridge (connects >50% of clusters)
- **0.3-0.5**: Strong bridge (30-50% of clusters)
- **0.1-0.3**: Moderate bridge
- **<0.1**: Minimal bridging effect

**Target**: **15%+ of documents** should have bridge score >0.3 by Month 3.

---

### 2.4 Concept Emergence Tracking

**Definition**: Track new concepts introduced over time.

**Calculation**:
```typescript
interface ConceptEmergence {
  conceptId: string;
  firstMentioned: Date;
  originatingDocument: string;
  adoptionRate: number;       // % docs referencing it
  timeToAdoption: number;     // Days until 10% adoption
  relatedConcepts: string[];
  emergenceVelocity: number;  // New concepts per month
}

function trackConceptEmergence(
  graph: KnowledgeGraph,
  timeWindow: number = 30   // days
): ConceptEmergenceReport {
  const concepts = extractConcepts(graph);
  const newConcepts = concepts.filter(c =>
    c.firstMentioned > Date.now() - timeWindow * 24 * 60 * 60 * 1000
  );

  const emergenceVelocity = (newConcepts.length / timeWindow) * 30;

  return {
    newConceptsThisPeriod: newConcepts.length,
    emergenceVelocity,
    fastAdopters: newConcepts.filter(c => c.timeToAdoption < 7),
    slowAdopters: newConcepts.filter(c => c.timeToAdoption > 30),
    conceptCategories: groupBy(newConcepts, c => c.category)
  };
}

function extractConcepts(graph: KnowledgeGraph): Concept[] {
  // Extract unique concepts from YAML frontmatter tags
  const allTags = graph.nodes.flatMap(node => node.metadata.tags || []);
  const uniqueTags = Array.from(new Set(allTags));

  return uniqueTags.map(tag => ({
    conceptId: tag,
    firstMentioned: findFirstMention(tag, graph),
    originatingDocument: findOriginDocument(tag, graph),
    adoptionRate: calculateAdoptionRate(tag, graph),
    timeToAdoption: calculateTimeToAdoption(tag, graph),
    relatedConcepts: findRelatedConcepts(tag, graph)
  }));
}
```

**Baseline** (Current State):
- **Concept emergence rate**: ~2 concepts/month
- **Time to 10% adoption**: ~45 days

**Target**:
- **Concept emergence rate**: 10+ concepts/month
- **Time to 10% adoption**: <15 days

---

## 🔄 3. Iterative Improvement Tracking

### 3.1 Connection Strength Delta per Commit

**Definition**: Measure average connection strength improvement per commit/session.

**Calculation**:
```typescript
interface CommitImpact {
  commitId: string;
  timestamp: Date;
  filesChanged: string[];
  connectionsModified: number;
  newConnections: number;
  strengthenedConnections: number;
  weakenedConnections: number;
  averageStrengthDelta: number;
  netImpact: number;          // Weighted sum of changes
}

function analyzeCommitImpact(
  beforeGraph: KnowledgeGraph,
  afterGraph: KnowledgeGraph,
  commitId: string
): CommitImpact {
  const beforeStrengths = new Map(beforeGraph.edges.map(e =>
    [edgeKey(e), e.strength]
  ));
  const afterStrengths = new Map(afterGraph.edges.map(e =>
    [edgeKey(e), e.strength]
  ));

  let strengthened = 0, weakened = 0, unchanged = 0;
  let totalDelta = 0;

  for (const [key, afterStrength] of afterStrengths) {
    const beforeStrength = beforeStrengths.get(key) || 0;
    const delta = afterStrength - beforeStrength;
    totalDelta += delta;

    if (delta > 0.05) strengthened++;
    else if (delta < -0.05) weakened++;
    else unchanged++;
  }

  const newConnections = afterGraph.edges.length - beforeGraph.edges.length;

  return {
    commitId,
    timestamp: new Date(),
    filesChanged: getChangedFiles(commitId),
    connectionsModified: strengthened + weakened,
    newConnections,
    strengthenedConnections: strengthened,
    weakenedConnections: weakened,
    averageStrengthDelta: totalDelta / afterStrengths.size,
    netImpact: strengthened * 1.0 + newConnections * 0.5 - weakened * 0.5
  };
}
```

**Target Deltas**:
- **Average strength delta**: +0.15 per commit (vs. current +0.05)
- **Strengthened/weakened ratio**: >5:1
- **New connections**: 3-8 per commit

---

### 3.2 Knowledge Graph Density Evolution

**Definition**: Track density growth over commits/time.

**Calculation**:
```typescript
interface DensityEvolution {
  measurements: {
    timestamp: Date;
    commitId: string;
    density: number;
    nodes: number;
    edges: number;
  }[];
  growthRate: number;         // % per month
  doublingTime: number;       // Months to 2× density
  projections: {
    oneMonth: number;
    threeMonths: number;
    sixMonths: number;
  };
}

function projectDensityGrowth(history: DensityEvolution): Projection {
  const recentMeasurements = history.measurements.slice(-30);
  const growthRates = recentMeasurements.slice(1).map((m, i) => {
    const prev = recentMeasurements[i];
    const days = (m.timestamp.getTime() - prev.timestamp.getTime()) /
                 (24 * 60 * 60 * 1000);
    return ((m.density - prev.density) / prev.density) * (30 / days);
  });

  const averageMonthlyGrowth = mean(growthRates);
  const currentDensity = recentMeasurements[recentMeasurements.length - 1].density;

  return {
    growthRate: averageMonthlyGrowth,
    doublingTime: Math.log(2) / Math.log(1 + averageMonthlyGrowth),
    projections: {
      oneMonth: currentDensity * (1 + averageMonthlyGrowth),
      threeMonths: currentDensity * (1 + averageMonthlyGrowth) ** 3,
      sixMonths: currentDensity * (1 + averageMonthlyGrowth) ** 6
    }
  };
}
```

**Current Trajectory** (Baseline):
- **Monthly growth**: +8% density/month
- **Doubling time**: 9 months

**Target Trajectory**:
- **Monthly growth**: +25% density/month
- **Doubling time**: 3 months

---

### 3.3 Research Convergence Patterns

**Definition**: Measure how research causes documents to become more connected.

**Calculation**:
```typescript
interface ConvergenceMetric {
  documentPair: [string, string];
  initialDistance: number;    // Path length at start
  currentDistance: number;    // Current path length
  convergenceRate: number;    // Distance reduction per month
  sharedNeighbors: number;
  commonConcepts: string[];
  predictedMergeDate: Date | null;
}

function analyzeConvergence(
  graph: KnowledgeGraph,
  history: GraphSnapshot[]
): ConvergenceReport {
  const docPairs = getAllDocumentPairs(graph);
  const convergingPairs = docPairs.filter(pair => {
    const initialDist = getDistance(pair, history[0]);
    const currentDist = getDistance(pair, graph);
    return currentDist < initialDist;
  });

  return {
    totalPairs: docPairs.length,
    convergingPairs: convergingPairs.length,
    convergenceRate: convergingPairs.length / docPairs.length,
    fastestConvergence: convergingPairs.sort((a, b) =>
      b.convergenceRate - a.convergenceRate
    ).slice(0, 10),
    clustersForming: detectEmergingClusters(convergingPairs)
  };
}
```

**Convergence Indicators**:
- **>20% pairs converging**: Healthy integration
- **<10% pairs converging**: Fragmented knowledge
- **Cluster formation**: 3-5 new clusters per quarter

---

## 💚 4. Knowledge Graph Health Metrics

### 4.1 Overall Health Score

**Definition**: Composite score combining multiple health indicators.

**Calculation**:
```typescript
interface HealthScore {
  overall: number;            // 0-100
  components: {
    connectivity: number;     // Based on density & clustering
    balance: number;          // Based on link type distribution
    growth: number;           // Based on velocity metrics
    quality: number;          // Based on strength & coherence
  };
  trend: 'improving' | 'stable' | 'declining';
  alerts: HealthAlert[];
}

function calculateHealthScore(graph: KnowledgeGraph): HealthScore {
  const density = calculateDensity(graph);
  const clustering = calculateClusteringCoefficient(graph);
  const linkBalance = calculateLinkTypeBalance(graph);
  const avgStrength = mean(graph.edges.map(e => e.strength));

  const connectivity = Math.min(100, (density / 0.35) * 50 +
                                      (clustering / 0.40) * 50);
  const balance = linkBalance * 100;
  const quality = avgStrength * 100;

  const overall = (connectivity * 0.3 + balance * 0.2 +
                   quality * 0.3 + growth * 0.2);

  return {
    overall,
    components: { connectivity, balance, growth, quality },
    trend: determineTrend(history),
    alerts: detectAnomalies(graph)
  };
}
```

**Health Score Ranges**:
- **80-100**: Excellent health
- **60-79**: Good health
- **40-59**: Fair health, needs attention
- **<40**: Poor health, intervention required

**Current Baseline**: 52 (Fair health)
**Target**: 85+ (Excellent health) by Month 6

---

### 4.2 Orphan Node Detection

**Definition**: Identify documents with few or no connections.

**Calculation**:
```typescript
interface OrphanAnalysis {
  orphanCount: number;
  orphanPercentage: number;
  orphanDocuments: {
    documentId: string;
    connectionCount: number;
    lastModified: Date;
    ageInDays: number;
  }[];
  integrationSuggestions: {
    orphanId: string;
    suggestedConnections: string[];
    confidence: number;
  }[];
}

function detectOrphans(
  graph: KnowledgeGraph,
  threshold: number = 2
): OrphanAnalysis {
  const connectionCounts = new Map<string, number>();

  for (const node of graph.nodes) {
    const connections = graph.edges.filter(e =>
      e.source === node.id || e.target === node.id
    ).length;
    connectionCounts.set(node.id, connections);
  }

  const orphans = Array.from(connectionCounts.entries())
    .filter(([_, count]) => count <= threshold)
    .map(([id, count]) => ({
      documentId: id,
      connectionCount: count,
      lastModified: getLastModified(id, graph),
      ageInDays: daysSince(getCreationDate(id, graph))
    }));

  return {
    orphanCount: orphans.length,
    orphanPercentage: (orphans.length / graph.nodes.length) * 100,
    orphanDocuments: orphans,
    integrationSuggestions: generateIntegrationSuggestions(orphans, graph)
  };
}
```

**Orphan Thresholds**:
- **<5% orphans**: Healthy integration
- **5-15% orphans**: Acceptable, monitor
- **>15% orphans**: Poor integration, needs cleanup

**Current**: 18% orphans
**Target**: <5% orphans by Month 3

---

### 4.3 Concept Coverage Analysis

**Definition**: Measure how well concepts are distributed across documents.

**Calculation**:
```typescript
interface ConceptCoverage {
  totalConcepts: number;
  conceptDistribution: {
    conceptId: string;
    documentCount: number;
    coverage: number;         // % of relevant docs
  }[];
  underrepresentedConcepts: string[];  // Coverage <20%
  saturatedConcepts: string[];         // Coverage >80%
  coverageBalance: number;    // Entropy-based balance score
}

function analyzeConceptCoverage(graph: KnowledgeGraph): ConceptCoverage {
  const concepts = extractAllConcepts(graph);
  const distribution = concepts.map(concept => {
    const docsWithConcept = graph.nodes.filter(node =>
      nodeHasConcept(node, concept)
    ).length;
    return {
      conceptId: concept,
      documentCount: docsWithConcept,
      coverage: docsWithConcept / graph.nodes.length
    };
  });

  return {
    totalConcepts: concepts.length,
    conceptDistribution: distribution.sort((a, b) => b.coverage - a.coverage),
    underrepresentedConcepts: distribution
      .filter(d => d.coverage < 0.2)
      .map(d => d.conceptId),
    saturatedConcepts: distribution
      .filter(d => d.coverage > 0.8)
      .map(d => d.conceptId),
    coverageBalance: calculateCoverageBalance(distribution)
  };
}
```

**Target Coverage**:
- **Core concepts**: 60-80% coverage
- **Specialized concepts**: 20-40% coverage
- **No concepts**: <10% coverage or >90% coverage

---

## 📊 5. Visualization & Reporting

### 5.1 Time-Series Dashboards

**Metrics to Visualize**:
```typescript
interface DashboardConfig {
  charts: {
    // Connection Evolution
    connectionStrengthOverTime: LineChart;
    densityGrowthCurve: LineChart;
    linkTypeDistribution: StackedAreaChart;

    // Research Impact
    topDocumentsByPageRank: BarChart;
    citationVelocityHeatmap: Heatmap;
    bridgeScoreDistribution: Histogram;

    // Iterative Improvement
    commitImpactTimeline: TimelineChart;
    convergenceNetwork: NetworkDiagram;
    conceptEmergenceRate: LineChart;

    // Health Metrics
    healthScoreGauge: GaugeChart;
    orphanTrendLine: LineChart;
    conceptCoverageMatrix: MatrixChart;
  };
  updateFrequency: 'realtime' | 'daily' | 'weekly';
}
```

**Dashboard Layout** (Graphite Integration):
```markdown
## Research Impact Dashboard

### Connection Metrics (Top Row)
- **Avg Connection Strength**: 0.42 → 0.78 (target)
- **Density**: 0.107 → 0.35 (target)
- **Bridge Documents**: 3 → 15+ (target)

### Impact Indicators (Middle Row)
- **Top 10 Documents** (PageRank)
- **Citation Velocity** (heatmap by week)
- **Concept Emergence Rate** (concepts/month)

### Health Status (Bottom Row)
- **Overall Health**: 52/100 → 85/100 (target)
- **Orphan Percentage**: 18% → <5% (target)
- **Coverage Balance**: 0.65 → 0.85 (target)
```

---

### 5.2 Knowledge Graph Evolution Animation

**Graphite Temporal Visualization**:
```typescript
interface TemporalVisualization {
  snapshots: GraphSnapshot[];
  playbackSpeed: number;      // Commits per second
  highlightChanges: {
    newNodes: boolean;
    strengthenedLinks: boolean;
    weakenedLinks: boolean;
    removedNodes: boolean;
  };
  colorEncoding: {
    nodesByPageRank: ColorScale;
    edgesByStrength: ColorScale;
    nodesByAge: ColorScale;
  };
}

// Graphite config for temporal animation
const graphiteConfig = {
  layout: 'force-directed',
  temporal: {
    enabled: true,
    snapshots: loadGraphHistory(),
    transitionDuration: 500,  // ms
    playbackControls: true
  },
  nodeEncoding: {
    size: 'pageRank',
    color: 'ageInDays',
    label: 'title'
  },
  edgeEncoding: {
    width: 'strength',
    color: 'linkType',
    opacity: 'confidence'
  },
  filters: {
    minStrength: 0.3,
    maxAge: 180,            // days
    linkTypes: ['all']
  }
};
```

---

## 🎯 6. Success Thresholds & Alerts

### 6.1 Automatic Alerts

**Alert Triggers**:
```typescript
interface AlertConfig {
  alerts: {
    // Warning signals
    densityDecline: {
      threshold: -5,          // % decline per week
      severity: 'warning'
    },
    orphanSpike: {
      threshold: 20,          // % orphans
      severity: 'critical'
    },
    weakConnectionsRising: {
      threshold: 30,          // % connections <0.3
      severity: 'warning'
    },

    // Growth indicators
    bridgeDocumentsFormed: {
      threshold: 5,           // Count per month
      severity: 'success'
    },
    conceptEmergenceAcceleration: {
      threshold: 15,          // Concepts/month
      severity: 'success'
    },
    convergenceRate: {
      threshold: 25,          // % pairs converging
      severity: 'success'
    }
  };
}

function checkAlerts(graph: KnowledgeGraph, history: GraphSnapshot[]): Alert[] {
  const alerts: Alert[] = [];

  // Check for density decline
  const recentDensities = history.slice(-7).map(s => calculateDensity(s));
  const densityTrend = (recentDensities[6] - recentDensities[0]) / recentDensities[0];
  if (densityTrend < -0.05) {
    alerts.push({
      type: 'densityDecline',
      severity: 'warning',
      message: `Density declined ${(densityTrend * 100).toFixed(1)}% this week`,
      recommendation: 'Add cross-links between existing documents'
    });
  }

  // Check for orphan spike
  const orphanAnalysis = detectOrphans(graph);
  if (orphanAnalysis.orphanPercentage > 20) {
    alerts.push({
      type: 'orphanSpike',
      severity: 'critical',
      message: `${orphanAnalysis.orphanCount} orphan documents (${orphanAnalysis.orphanPercentage.toFixed(1)}%)`,
      recommendation: 'Integrate orphans using suggested connections'
    });
  }

  return alerts;
}
```

---

## 📝 7. Interpretation Guidelines for Researchers

### 7.1 How to Use These Metrics

**Daily Workflow**:
1. **Before Research**: Check orphan list, plan integration targets
2. **During Research**: Monitor connection strength of new links
3. **After Research**: Review commit impact, check for new bridges

**Weekly Review**:
1. **Health Dashboard**: Overall score, trend direction
2. **Top Documents**: Identify emerging core references
3. **Convergence Patterns**: Spot areas of active integration
4. **Alert Review**: Address any warnings

**Monthly Planning**:
1. **Trajectory Check**: Compare actual vs. target metrics
2. **Concept Coverage**: Identify underrepresented areas
3. **Bridge Opportunities**: Find clusters to connect
4. **Quality Assessment**: Prune weak links, strengthen moderate ones

---

### 7.2 Metric Prioritization

**For Daily Use** (Most Important):
1. Connection Strength (immediate feedback)
2. Commit Impact (validate contributions)
3. Orphan Detection (integration targets)

**For Weekly Review** (Strategic):
1. Health Score (overall trend)
2. PageRank Top 10 (core document shifts)
3. Citation Velocity (impact tracking)

**For Monthly Planning** (Long-term):
1. Density Evolution (growth trajectory)
2. Concept Emergence (knowledge expansion)
3. Convergence Analysis (integration quality)

---

## ✅ Implementation Checklist

### Phase 1: Core Metrics (Week 1)
- [ ] Implement connection strength tracking
- [ ] Add density calculation to commit hooks
- [ ] Set up PageRank computation
- [ ] Create baseline measurements

### Phase 2: Impact Tracking (Week 2)
- [ ] Implement citation frequency tracking
- [ ] Add bridge score calculation
- [ ] Set up concept emergence detection
- [ ] Create initial dashboard

### Phase 3: Visualization (Week 3)
- [ ] Integrate Graphite temporal view
- [ ] Build time-series dashboards
- [ ] Add alert system
- [ ] Create reporting templates

### Phase 4: Optimization (Week 4)
- [ ] Performance tuning for large graphs
- [ ] Caching strategy for expensive metrics
- [ ] Automated report generation
- [ ] User documentation

---

## 📚 References

**Academic Foundations**:
- PageRank: Brin & Page (1998) - "The Anatomy of a Large-Scale Hypertextual Web Search Engine"
- Small-World Networks: Kleinberg (2000) - "Navigation in a Small World"
- H-Index: Hirsch (2005) - "An index to quantify an individual's scientific research output"

**Weaver Research**:
- Multi-Graph Knowledge Systems (15 Papers): `/weave-nn/_planning/research/Multi-Graph Knowledge Systems for Project Learning - 15 Essential Papers.md`
- Memory Networks & Knowledge Graph Design: `/weave-nn/_planning/research/Memory Networks and Knowledge Graph Design- A Research Synthesis for LLM-Augmented Systems.md`

---

**Created**: 2025-10-27
**Agent**: Analyst (Hive Mind Swarm)
**Next**: Connection Evolution Analysis
**Memory Key**: `hive/analysis/research-impact-metrics`
