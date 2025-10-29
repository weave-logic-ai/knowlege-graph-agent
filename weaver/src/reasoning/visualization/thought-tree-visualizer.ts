/**
 * Thought Tree Visualizer
 *
 * Generates visual representations of ToT reasoning trees in multiple formats:
 * - ASCII tree for terminal output
 * - JSON tree for UI consumption
 * - Mermaid diagrams for documentation
 */

import type { ThoughtNode } from '../tree-of-thought.js';

export type VisualizationFormat = 'ascii' | 'json' | 'mermaid';

export interface VisualizationOptions {
  format: VisualizationFormat;
  maxDepth?: number;
  showValues?: boolean;
  colorize?: boolean;
  compact?: boolean;
}

export interface JSONTreeNode {
  id: string;
  thought: string;
  value: number;
  depth: number;
  children: JSONTreeNode[];
  isLeaf: boolean;
  isBestPath?: boolean;
}

export interface VisualizationResult {
  format: VisualizationFormat;
  output: string;
  metadata: {
    totalNodes: number;
    maxDepth: number;
    bestPathLength: number;
    averageValue: number;
  };
}

/**
 * Visualizes thought trees in various formats
 */
export class ThoughtTreeVisualizer {
  private options: Required<VisualizationOptions>;

  constructor(options: Partial<VisualizationOptions> = {}) {
    this.options = {
      format: options.format || 'ascii',
      maxDepth: options.maxDepth || Infinity,
      showValues: options.showValues ?? true,
      colorize: options.colorize ?? true,
      compact: options.compact ?? false,
    };
  }

  /**
   * Generate visualization in specified format
   */
  visualize(root: ThoughtNode, bestPath?: ThoughtNode[]): VisualizationResult {
    const metadata = this.calculateMetadata(root, bestPath);

    let output: string;
    switch (this.options.format) {
      case 'ascii':
        output = this.generateASCII(root, bestPath);
        break;
      case 'json':
        output = this.generateJSON(root, bestPath);
        break;
      case 'mermaid':
        output = this.generateMermaid(root, bestPath);
        break;
      default:
        throw new Error(`Unknown format: ${this.options.format}`);
    }

    return {
      format: this.options.format,
      output,
      metadata,
    };
  }

  /**
   * Generate ASCII tree visualization
   */
  private generateASCII(root: ThoughtNode, bestPath?: ThoughtNode[]): string {
    const bestPathIds = new Set(bestPath?.map((n) => n.id) || []);
    const lines: string[] = [];

    const renderNode = (
      node: ThoughtNode,
      prefix: string,
      isLast: boolean,
      depth: number
    ): void => {
      if (depth > this.options.maxDepth) return;

      // Format node line
      const isBest = bestPathIds.has(node.id);
      const connector = depth === 0 ? '' : isLast ? '└─ ' : '├─ ';
      const valueStr = this.options.showValues
        ? ` (value: ${node.value.toFixed(2)})`
        : '';

      let line = `${prefix}${connector}${node.thought}${valueStr}`;

      // Colorize if enabled (ANSI codes)
      if (this.options.colorize && isBest) {
        line = `\x1b[32m${line}\x1b[0m`; // Green for best path
      } else if (this.options.colorize && node.value > 0.7) {
        line = `\x1b[33m${line}\x1b[0m`; // Yellow for high value
      }

      lines.push(line);

      // Render children
      const childPrefix = depth === 0 ? '' : prefix + (isLast ? '   ' : '│  ');
      const children = this.options.compact
        ? node.children.filter((c) => c.value > 0.5)
        : node.children;

      children.forEach((child, index) => {
        renderNode(child, childPrefix, index === children.length - 1, depth + 1);
      });
    };

    renderNode(root, '', true, 0);
    return lines.join('\n');
  }

  /**
   * Generate JSON tree structure
   */
  private generateJSON(root: ThoughtNode, bestPath?: ThoughtNode[]): string {
    const bestPathIds = new Set(bestPath?.map((n) => n.id) || []);

    const convertNode = (node: ThoughtNode, depth: number): JSONTreeNode => {
      if (depth > this.options.maxDepth) {
        return {
          id: node.id,
          thought: node.thought,
          value: node.value,
          depth,
          children: [],
          isLeaf: true,
          isBestPath: bestPathIds.has(node.id),
        };
      }

      return {
        id: node.id,
        thought: node.thought,
        value: node.value,
        depth,
        children: node.children.map((c) => convertNode(c, depth + 1)),
        isLeaf: node.children.length === 0,
        isBestPath: bestPathIds.has(node.id),
      };
    };

    const jsonTree = convertNode(root, 0);
    return JSON.stringify(jsonTree, null, 2);
  }

  /**
   * Generate Mermaid diagram
   */
  private generateMermaid(root: ThoughtNode, bestPath?: ThoughtNode[]): string {
    const bestPathIds = new Set(bestPath?.map((n) => n.id) || []);
    const lines: string[] = ['graph TD'];

    const sanitizeId = (id: string): string => id.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizeLabel = (text: string): string =>
      text.replace(/"/g, '\\"').substring(0, 50);

    const renderNode = (node: ThoughtNode, depth: number): void => {
      if (depth > this.options.maxDepth) return;

      const nodeId = sanitizeId(node.id);
      const label = sanitizeLabel(node.thought);
      const valueStr = this.options.showValues
        ? `\\n(${node.value.toFixed(2)})`
        : '';

      // Node definition with styling
      const isBest = bestPathIds.has(node.id);
      const style = isBest ? ':::bestPath' : node.value > 0.7 ? ':::highValue' : '';
      lines.push(`  ${nodeId}["${label}${valueStr}"]${style}`);

      // Edges to children
      node.children.forEach((child) => {
        const childId = sanitizeId(child.id);
        const edgeStyle = bestPathIds.has(child.id) ? '==>' : '-->';
        lines.push(`  ${nodeId} ${edgeStyle} ${childId}`);
        renderNode(child, depth + 1);
      });
    };

    renderNode(root, 0);

    // Add styling classes
    lines.push('  classDef bestPath fill:#90EE90,stroke:#006400,stroke-width:3px');
    lines.push('  classDef highValue fill:#FFFFE0,stroke:#FFD700,stroke-width:2px');

    return lines.join('\n');
  }

  /**
   * Calculate tree metadata
   */
  private calculateMetadata(
    root: ThoughtNode,
    bestPath?: ThoughtNode[]
  ): VisualizationResult['metadata'] {
    let totalNodes = 0;
    let maxDepth = 0;
    let totalValue = 0;

    const traverse = (node: ThoughtNode, depth: number): void => {
      totalNodes++;
      totalValue += node.value;
      maxDepth = Math.max(maxDepth, depth);
      node.children.forEach((child) => traverse(child, depth + 1));
    };

    traverse(root, 0);

    return {
      totalNodes,
      maxDepth,
      bestPathLength: bestPath?.length || 0,
      averageValue: totalNodes > 0 ? totalValue / totalNodes : 0,
    };
  }

  /**
   * Export visualization to file
   */
  async exportToFile(
    root: ThoughtNode,
    bestPath: ThoughtNode[],
    filepath: string
  ): Promise<void> {
    const result = this.visualize(root, bestPath);
    const fs = await import('fs/promises');

    let content = result.output;

    // Add metadata as comment/header based on format
    const metadataStr = `Nodes: ${result.metadata.totalNodes}, Depth: ${result.metadata.maxDepth}, Best Path: ${result.metadata.bestPathLength}, Avg Value: ${result.metadata.averageValue.toFixed(3)}`;

    if (this.options.format === 'ascii') {
      content = `# Thought Tree Visualization\n# ${metadataStr}\n\n${content}`;
    } else if (this.options.format === 'json') {
      const obj = JSON.parse(content);
      obj.metadata = result.metadata;
      content = JSON.stringify(obj, null, 2);
    } else if (this.options.format === 'mermaid') {
      content = `%% ${metadataStr}\n${content}`;
    }

    await fs.writeFile(filepath, content, 'utf-8');
  }
}

/**
 * Utility function to quickly visualize a tree
 */
export function visualizeTree(
  root: ThoughtNode,
  bestPath?: ThoughtNode[],
  format: VisualizationFormat = 'ascii'
): string {
  const visualizer = new ThoughtTreeVisualizer({ format });
  const result = visualizer.visualize(root, bestPath);
  return result.output;
}

/**
 * Print tree to console with best path highlighted
 */
export function printTree(root: ThoughtNode, bestPath?: ThoughtNode[]): void {
  const output = visualizeTree(root, bestPath, 'ascii');
  console.log('\n' + output + '\n');
}
