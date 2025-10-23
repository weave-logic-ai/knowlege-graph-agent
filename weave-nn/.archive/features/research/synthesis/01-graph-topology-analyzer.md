---
type: feature
status: planned
priority: high
domain: knowledge-graph
scope: vault-wide
thinking-pattern: systems
phase: 1
effort-estimate: 4-6 hours
expected-impact: 20-30% improvement in note discovery time
research-basis: Kleinberg (2000) Small-World Networks
---

# Feature: Graph Topology Analyzer

## Executive Summary

Automated analysis of Obsidian vault graph structure to ensure small-world properties that optimize both human navigation and machine retrieval. Based on research showing networks achieve optimal decentralized navigation when clustering coefficient >0.3 and average path length scales logarithmically with network size.

## Research Foundation

**Primary Paper**: Kleinberg, J. (2000). "The Small-World Phenomenon: An Algorithmic Perspective." STOC.

**Key Findings**:
- Networks with inverse-square distribution of long-range links enable O((log n)²) path lengths
- Clustering coefficient >0.3 indicates clear community structure
- Even 1-2% long-range shortcuts dramatically reduce average path length
- Small-worldness S = (C/Crandom)/(L/Lrandom) should exceed 3

**Supporting Research**:
- Watts-Strogatz small-world model
- Knowledge Graph Enhanced Community Detection (Bhatt et al., 2019)
- Hierarchical Knowledge Graphs (Sarrafzadeh et al., 2020)

## Problem Statement

Knowledge vaults often suffer from:
1. **Orphaned notes**: Notes with <3 connections become isolated and unfindable
2. **Over-connected hubs**: Notes with >50 connections create bottlenecks
3. **Poor community structure**: Related concepts aren't clustered together
4. **Long navigation paths**: Users require 5+ clicks to find related information

## Proposed Solution

### Architecture

```
┌─────────────────────────────────────────────────────┐
│          Graph Topology Analyzer                     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐      ┌──────────────┐             │
│  │ Data Source │─────>│ Graph Builder│             │
│  │ (REST API)  │      │ (NetworkX)   │             │
│  └─────────────┘      └───────┬──────┘             │
│                                │                     │
│                       ┌────────▼────────┐           │
│                       │ Metrics Computer │           │
│                       │ - Clustering     │           │
│                       │ - Path Length    │           │
│                       │ - Centrality     │           │
│                       │ - Communities    │           │
│                       └────────┬────────┘           │
│                                │                     │
│         ┌──────────────────────┼──────────────────┐ │
│         │                      │                  │ │
│  ┌──────▼─────┐       ┌───────▼──────┐   ┌──────▼────┐
│  │ Report Gen │       │ Visualization│   │Suggestions│
│  │ (Markdown) │       │ (Graphviz)   │   │ Generator │
│  └────────────┘       └──────────────┘   └───────────┘
└─────────────────────────────────────────────────────┘
```

### Implementation

**Script**: `/scripts/analyze_vault_topology.py`

```python
#!/usr/bin/env python3
"""
Automated graph topology analysis for Obsidian vault.

Generates:
- Topology metrics report
- Community detection results
- Link suggestions for orphaned notes
- Visualization of network structure
"""

import requests
import networkx as nx
import matplotlib.pyplot as plt
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple
import json

class VaultTopologyAnalyzer:
    """Analyzes Obsidian vault graph structure."""

    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url
        self.api_key = api_key
        self.graph = nx.Graph()

    def fetch_vault_graph(self) -> nx.Graph:
        """Fetch vault graph via Obsidian REST API."""
        # Fetch all notes
        response = requests.get(
            f"{self.api_url}/vault/",
            headers={"Authorization": f"Bearer {self.api_key}"}
        )
        notes = response.json()

        # Build graph
        for note in notes:
            self.graph.add_node(note['path'], **note.get('metadata', {}))

            # Add edges from wikilinks
            for link in note.get('links', []):
                self.graph.add_edge(note['path'], link)

        return self.graph

    def compute_metrics(self) -> Dict:
        """Compute graph topology metrics."""
        metrics = {
            'total_nodes': self.graph.number_of_nodes(),
            'total_edges': self.graph.number_of_edges(),
            'avg_degree': sum(dict(self.graph.degree()).values()) / self.graph.number_of_nodes(),
            'density': nx.density(self.graph),
        }

        # Small-world properties
        if nx.is_connected(self.graph):
            metrics['clustering_coefficient'] = nx.average_clustering(self.graph)
            metrics['avg_path_length'] = nx.average_shortest_path_length(self.graph)
            metrics['diameter'] = nx.diameter(self.graph)
        else:
            # Use largest connected component
            largest_cc = max(nx.connected_components(self.graph), key=len)
            subgraph = self.graph.subgraph(largest_cc)
            metrics['clustering_coefficient'] = nx.average_clustering(subgraph)
            metrics['avg_path_length'] = nx.average_shortest_path_length(subgraph)
            metrics['diameter'] = nx.diameter(subgraph)

        # Calculate small-worldness
        random_graph = nx.erdos_renyi_graph(
            metrics['total_nodes'],
            metrics['density']
        )
        metrics['random_clustering'] = nx.average_clustering(random_graph)
        metrics['random_path_length'] = nx.average_shortest_path_length(random_graph)
        metrics['small_worldness'] = (
            (metrics['clustering_coefficient'] / metrics['random_clustering']) /
            (metrics['avg_path_length'] / metrics['random_path_length'])
        )

        # Identify problem nodes
        degrees = dict(self.graph.degree())
        metrics['orphaned_nodes'] = [n for n, d in degrees.items() if d < 3]
        metrics['hub_nodes'] = [n for n, d in degrees.items() if d > 50]

        # Community detection
        communities = nx.community.louvain_communities(self.graph)
        metrics['num_communities'] = len(communities)
        metrics['modularity'] = nx.community.modularity(self.graph, communities)

        return metrics

    def generate_link_suggestions(self, orphaned_nodes: List[str]) -> List[Tuple]:
        """Suggest strategic links for orphaned notes."""
        suggestions = []

        for node in orphaned_nodes:
            # Get node metadata
            node_data = self.graph.nodes[node]

            # Find similar nodes by content similarity
            candidates = self.find_similar_nodes(node, k=10)

            # Suggest 5-10 same-level associative links
            for candidate, similarity in candidates[:10]:
                suggestions.append({
                    'source': node,
                    'target': candidate,
                    'similarity': similarity,
                    'type': 'associative'
                })

            # Suggest 1-2 cross-level hierarchical links
            hierarchical_candidates = self.find_hierarchical_candidates(node)
            for candidate in hierarchical_candidates[:2]:
                suggestions.append({
                    'source': node,
                    'target': candidate,
                    'type': 'hierarchical'
                })

            # Suggest 1 distant shortcut link (inverse-square distribution)
            shortcut = self.find_distant_shortcut(node)
            if shortcut:
                suggestions.append({
                    'source': node,
                    'target': shortcut,
                    'type': 'shortcut'
                })

        return suggestions

    def find_similar_nodes(self, node: str, k: int = 10) -> List[Tuple]:
        """Find most similar nodes by content."""
        # Placeholder: Use embeddings or tag similarity
        # For now, use degree centrality as proxy
        centrality = nx.degree_centrality(self.graph)
        similar = sorted(centrality.items(), key=lambda x: x[1], reverse=True)[:k]
        return [(n, score) for n, score in similar if n != node]

    def find_hierarchical_candidates(self, node: str) -> List[str]:
        """Find candidates for cross-level hierarchical links."""
        # Placeholder: Use folder structure or tag hierarchy
        node_folder = Path(node).parent
        candidates = [
            n for n in self.graph.nodes()
            if Path(n).parent == node_folder.parent  # One level up
        ]
        return candidates[:2]

    def find_distant_shortcut(self, node: str) -> str:
        """Find distant node for shortcut link (inverse-square distribution)."""
        # Calculate shortest path distances
        if nx.is_connected(self.graph):
            distances = nx.shortest_path_length(self.graph, source=node)
        else:
            # Use largest connected component
            largest_cc = max(nx.connected_components(self.graph), key=len)
            if node in largest_cc:
                subgraph = self.graph.subgraph(largest_cc)
                distances = nx.shortest_path_length(subgraph, source=node)
            else:
                return None

        # Sample distant nodes with inverse-square probability
        distant_nodes = [(n, d) for n, d in distances.items() if d > 3]
        if not distant_nodes:
            return None

        # Inverse-square probability distribution
        probabilities = [1 / (d ** 2) for _, d in distant_nodes]
        total_prob = sum(probabilities)
        normalized_probs = [p / total_prob for p in probabilities]

        # Random sample
        import random
        shortcut = random.choices(distant_nodes, weights=normalized_probs, k=1)[0][0]
        return shortcut

    def generate_visualization(self, output_path: str):
        """Generate graph visualization."""
        plt.figure(figsize=(16, 12))

        # Layout
        pos = nx.spring_layout(self.graph, k=0.5, iterations=50)

        # Node colors by community
        communities = nx.community.louvain_communities(self.graph)
        color_map = {}
        for i, community in enumerate(communities):
            for node in community:
                color_map[node] = i

        # Draw
        nx.draw_networkx_nodes(
            self.graph, pos,
            node_color=[color_map.get(n, 0) for n in self.graph.nodes()],
            node_size=50,
            alpha=0.8,
            cmap=plt.cm.Set3
        )

        nx.draw_networkx_edges(
            self.graph, pos,
            alpha=0.2,
            width=0.5
        )

        plt.title("Vault Graph Structure with Communities")
        plt.axis('off')
        plt.tight_layout()
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        print(f"Visualization saved: {output_path}")

    def generate_markdown_report(self, metrics: Dict, suggestions: List, output_path: str):
        """Generate markdown analysis report."""
        report = f"""# Vault Topology Analysis Report

**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## Overview

- **Total Notes**: {metrics['total_nodes']}
- **Total Links**: {metrics['total_edges']}
- **Average Degree**: {metrics['avg_degree']:.2f}
- **Network Density**: {metrics['density']:.4f}

## Small-World Properties

- **Clustering Coefficient**: {metrics['clustering_coefficient']:.3f} (target: >0.3)
- **Average Path Length**: {metrics['avg_path_length']:.2f} (target: <log₂(N) = {math.log2(metrics['total_nodes']):.2f})
- **Network Diameter**: {metrics['diameter']}
- **Small-Worldness Index**: {metrics['small_worldness']:.2f} (target: >3)

### Assessment

"""
        # Add assessment based on targets
        if metrics['clustering_coefficient'] > 0.3:
            report += "✅ **Clustering**: Good community structure detected.\n"
        else:
            report += f"❌ **Clustering**: Below target. Current: {metrics['clustering_coefficient']:.3f}, Target: >0.3\n"

        if metrics['avg_path_length'] < math.log2(metrics['total_nodes']):
            report += "✅ **Path Length**: Efficient navigation paths.\n"
        else:
            report += f"❌ **Path Length**: Above target. Current: {metrics['avg_path_length']:.2f}, Target: <{math.log2(metrics['total_nodes']):.2f}\n"

        if metrics['small_worldness'] > 3:
            report += "✅ **Small-Worldness**: Network exhibits small-world properties.\n"
        else:
            report += f"⚠️ **Small-Worldness**: Below ideal. Current: {metrics['small_worldness']:.2f}, Target: >3\n"

        report += f"""

## Community Structure

- **Number of Communities**: {metrics['num_communities']}
- **Modularity**: {metrics['modularity']:.3f}

## Problem Areas

### Orphaned Notes (Degree < 3)

Found **{len(metrics['orphaned_nodes'])}** orphaned notes requiring more connections:

"""
        for node in metrics['orphaned_nodes'][:20]:  # Top 20
            report += f"- [[{node}]]\n"

        if len(metrics['orphaned_nodes']) > 20:
            report += f"\n... and {len(metrics['orphaned_nodes']) - 20} more.\n"

        report += f"""

### Over-Connected Hubs (Degree > 50)

Found **{len(metrics['hub_nodes'])}** hub notes that may need splitting:

"""
        for node in metrics['hub_nodes']:
            degree = self.graph.degree(node)
            report += f"- [[{node}]] ({degree} connections)\n"

        report += f"""

## Link Suggestions

Generated **{len(suggestions)}** strategic link suggestions to improve topology:

### For Orphaned Notes

"""
        orphan_suggestions = [s for s in suggestions if s['source'] in metrics['orphaned_nodes']]
        for i, sug in enumerate(orphan_suggestions[:30], 1):  # Top 30
            report += f"{i}. [[{sug['source']}]] → [[{sug['target']}]] (Type: {sug['type']})\n"

        report += """

## Recommendations

1. **Address orphaned notes**: Add 5-10 associative links per orphaned note
2. **Create Map of Content nodes**: 5-10% of total notes as medium-degree hubs (15-30 connections)
3. **Add strategic shortcuts**: 1-2 distant shortcuts per community to reduce path length
4. **Review over-connected hubs**: Consider splitting into multiple focused notes

## Next Steps

- [ ] Review and implement suggested links
- [ ] Create MOC notes for main topic clusters
- [ ] Re-run analysis in 2 weeks to track improvement
- [ ] Target: Clustering >0.3, Path Length <log₂(N), Small-Worldness >3

---

*Analysis generated by Vault Topology Analyzer*
*Research basis: Kleinberg (2000), Watts-Strogatz model*
"""

        with open(output_path, 'w') as f:
            f.write(report)

        print(f"Report saved: {output_path}")


def main():
    """Main execution flow."""
    import os
    import math

    # Configuration
    API_URL = os.getenv('OBSIDIAN_API_URL', 'https://localhost:27124')
    API_KEY = os.getenv('OBSIDIAN_API_KEY')

    if not API_KEY:
        print("Error: OBSIDIAN_API_KEY not set")
        return

    # Initialize analyzer
    analyzer = VaultTopologyAnalyzer(API_URL, API_KEY)

    # Fetch vault graph
    print("Fetching vault graph...")
    analyzer.fetch_vault_graph()

    # Compute metrics
    print("Computing metrics...")
    metrics = analyzer.compute_metrics()

    # Generate link suggestions
    print("Generating link suggestions...")
    suggestions = analyzer.generate_link_suggestions(metrics['orphaned_nodes'])

    # Generate outputs
    timestamp = datetime.now().strftime('%Y-%m-%d')
    output_dir = Path('_analysis')
    output_dir.mkdir(exist_ok=True)

    # Markdown report
    report_path = output_dir / f'topology-report-{timestamp}.md'
    analyzer.generate_markdown_report(metrics, suggestions, report_path)

    # Visualization
    viz_path = output_dir / f'topology-visualization-{timestamp}.png'
    analyzer.generate_visualization(viz_path)

    # JSON export for programmatic access
    json_path = output_dir / f'topology-metrics-{timestamp}.json'
    with open(json_path, 'w') as f:
        json.dump({
            'metrics': metrics,
            'suggestions': suggestions
        }, f, indent=2, default=str)

    print("\n✅ Analysis complete!")
    print(f"  - Report: {report_path}")
    print(f"  - Visualization: {viz_path}")
    print(f"  - Metrics: {json_path}")


if __name__ == "__main__":
    main()
```

## Metrics Tracked

### Primary Metrics
- **Clustering Coefficient**: Measures local density (target: >0.3)
- **Average Path Length**: Navigation efficiency (target: <log₂(N))
- **Small-Worldness**: S = (C/Crandom)/(L/Lrandom) (target: >3)
- **Network Diameter**: Longest shortest path
- **Modularity**: Community structure quality

### Secondary Metrics
- Total nodes and edges
- Average degree
- Network density
- Number of communities
- Orphaned nodes count
- Hub nodes count

## Integration Points

### Input
- Obsidian REST API (`/vault/` endpoint)
- Wikilink structure from markdown files
- YAML frontmatter metadata

### Output
- Markdown report in `_analysis/topology-report-YYYY-MM-DD.md`
- PNG visualization in `_analysis/topology-visualization-YYYY-MM-DD.png`
- JSON metrics in `_analysis/topology-metrics-YYYY-MM-DD.json`

### Automation
```bash
# Cron job: Every Sunday at 9 AM
0 9 * * 0 cd /path/to/vault && python scripts/analyze_vault_topology.py
```

## Success Metrics

### Quantitative
- 20-30% improvement in note discovery time (measured via user testing)
- Clustering coefficient increases from <0.3 to >0.3
- Average path length decreases by 15-25%
- 90% of notes have 3+ connections within 4 weeks

### Qualitative
- Users find related notes within 3-5 clicks
- Reduced "dead end" navigation experiences
- Improved sense of knowledge structure

## Implementation Timeline

### Week 1
- [ ] Develop core analyzer script
- [ ] Test on sample vault
- [ ] Generate first baseline report

### Week 2
- [ ] Implement link suggestion algorithm
- [ ] Add visualization generation
- [ ] Set up weekly cron job
- [ ] Deploy to production vault

## Related Features

- [[perplexity-chunk-extractor]] - Uses graph structure for chunk boundaries
- [[multi-hop-reasoning-engine]] - Leverages small-world paths for retrieval
- [[sparse-memory-pattern-library]] - Benefits from well-connected graph

## References

1. Kleinberg, J. (2000). "The Small-World Phenomenon: An Algorithmic Perspective." *STOC*.
2. Watts, D. J., & Strogatz, S. H. (1998). "Collective dynamics of 'small-world' networks." *Nature*, 393(6684), 440-442.
3. Bhatt, S., et al. (2019). "Knowledge Graph Enhanced Community Detection and Characterization." *WSDM*.
4. Sarrafzadeh, B., et al. (2020). "Hierarchical Knowledge Graphs." *arXiv:2005.01716*.

---

**Status**: 📝 Planned
**Phase**: 1 (Quick Wins)
**Dependencies**: Obsidian REST API, Python environment, networkx library
**Owner**: TBD
**Priority**: 🔴 High
