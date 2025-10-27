/**
 * Concept Map Generator
 *
 * Generates concept-map.md with Mermaid diagram.
 */

import { join } from 'path';
import { writeMarkdownFile } from './markdown-writer.js';
import type { GeneratedNode } from '../types.js';

/**
 * Generate concept map with Mermaid diagram
 */
export async function generateConceptMap(nodes: GeneratedNode[], vaultPath: string): Promise<string> {
  const conceptMapPath = join(vaultPath, 'concept-map.md');

  const content = `# Concept Map

This is an auto-generated visual map of all concepts in the vault.

## Overview Diagram

\`\`\`mermaid
${generateMermaidDiagram(nodes)}
\`\`\`

## Node Types

- **Concepts** (${nodes.filter((n) => n.type === 'concept').length}): Core conceptual knowledge
- **Technical** (${nodes.filter((n) => n.type === 'technical').length}): Technical specifications
- **Features** (${nodes.filter((n) => n.type === 'feature').length}): Feature descriptions

## Top Connected Nodes

${generateTopConnectedNodes(nodes)}

## Tag Distribution

${generateTagDistribution(nodes)}

---

*This map is automatically generated and updated*
*Last updated: ${new Date().toISOString()}*
`;

  await writeMarkdownFile(conceptMapPath, content);

  return conceptMapPath;
}

/**
 * Generate Mermaid diagram showing node relationships
 */
function generateMermaidDiagram(nodes: GeneratedNode[]): string {
  const lines: string[] = ['graph TD'];

  // Add node type styling
  lines.push('  classDef concept fill:#e1f5ff,stroke:#0288d1');
  lines.push('  classDef technical fill:#fff3e0,stroke:#f57c00');
  lines.push('  classDef feature fill:#f3e5f5,stroke:#7b1fa2');

  // Create node ID map
  const nodeIdMap = new Map<string, string>();
  nodes.forEach((node, index) => {
    nodeIdMap.set(node.id, `N${index}`);
  });

  // Add nodes (limit to top 50 for readability)
  const topNodes = selectTopNodes(nodes, 50);

  topNodes.forEach((node) => {
    const nodeId = nodeIdMap.get(node.id) || 'unknown';
    const label = sanitizeForMermaid(node.title);
    const shape = getNodeShape(node.type);

    lines.push(`  ${nodeId}${shape[0]}${label}${shape[1]}`);

    // Add class styling
    lines.push(`  class ${nodeId} ${node.type}`);
  });

  // Add relationships (links between top nodes)
  const topNodeIds = new Set(topNodes.map((n) => n.id));

  topNodes.forEach((node) => {
    const sourceId = nodeIdMap.get(node.id);
    if (!sourceId) return;

    // Add links to other top nodes
    node.links?.forEach((link) => {
      const targetNode = nodes.find((n) => n.filename === link.target || n.id === link.target);
      if (targetNode && topNodeIds.has(targetNode.id)) {
        const targetId = nodeIdMap.get(targetNode.id);
        if (targetId) {
          lines.push(`  ${sourceId} --> ${targetId}`);
        }
      }
    });
  });

  return lines.join('\n');
}

/**
 * Select top nodes based on connection count
 */
function selectTopNodes(nodes: GeneratedNode[], count: number): GeneratedNode[] {
  // Score nodes by number of links
  const scored = nodes.map((node) => ({
    node,
    score: (node.links?.length || 0) + (node.tags?.length || 0) * 0.5,
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top N
  return scored.slice(0, count).map((s) => s.node);
}

/**
 * Get Mermaid shape for node type
 */
function getNodeShape(type: string): [string, string] {
  switch (type) {
    case 'concept':
      return ['[', ']']; // Rectangle
    case 'technical':
      return ['[[', ']]']; // Subroutine
    case 'feature':
      return ['([', '])'];  // Stadium
    default:
      return ['[', ']'];
  }
}

/**
 * Sanitize text for Mermaid diagram
 */
function sanitizeForMermaid(text: string): string {
  // Remove special characters that break Mermaid
  return text.replace(/["\[\](){}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
}

/**
 * Generate list of top connected nodes
 */
function generateTopConnectedNodes(nodes: GeneratedNode[]): string {
  const scored = nodes.map((node) => ({
    node,
    connections: (node.links?.length || 0),
  }));

  scored.sort((a, b) => b.connections - a.connections);

  const top10 = scored.slice(0, 10);

  if (top10.length === 0) {
    return '*No connections yet*';
  }

  return top10
    .map((item, index) => {
      const dir = item.node.type === 'concept' ? 'concepts' : item.node.type === 'technical' ? 'technical' : 'features';
      return `${index + 1}. [[${dir}/${item.node.filename}|${item.node.title}]] - ${item.connections} connections`;
    })
    .join('\n');
}

/**
 * Generate tag distribution stats
 */
function generateTagDistribution(nodes: GeneratedNode[]): string {
  const tagCounts = new Map<string, number>();

  nodes.forEach((node) => {
    node.tags?.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  if (tagCounts.size === 0) {
    return '*No tags yet*';
  }

  const sorted = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);

  const top10 = sorted.slice(0, 10);

  return top10.map(([tag, count]) => `- #${tag} (${count} nodes)`).join('\n');
}
