/**
 * Type declarations for react-cytoscapejs
 *
 * This module doesn't have built-in TypeScript declarations.
 */

declare module 'react-cytoscapejs' {
  import Cytoscape from 'cytoscape';
  import { Component } from 'react';

  interface CytoscapeComponentProps {
    id?: string;
    cy?: (cy: Cytoscape.Core) => void;
    style?: React.CSSProperties;
    elements: Cytoscape.ElementDefinition[];
    layout?: Cytoscape.LayoutOptions;
    stylesheet?: Cytoscape.StylesheetCSS[] | Cytoscape.StylesheetStyle[];
    className?: string;
    zoom?: number;
    pan?: Cytoscape.Position;
    minZoom?: number;
    maxZoom?: number;
    zoomingEnabled?: boolean;
    userZoomingEnabled?: boolean;
    panningEnabled?: boolean;
    userPanningEnabled?: boolean;
    boxSelectionEnabled?: boolean;
    autoungrabify?: boolean;
    autounselectify?: boolean;
    autolock?: boolean;
    wheelSensitivity?: number;
    get?: (key: string) => unknown;
  }

  class CytoscapeComponent extends Component<CytoscapeComponentProps> {
    static normalizeElements(
      elements:
        | Cytoscape.ElementDefinition[]
        | { nodes: Cytoscape.ElementDefinition[]; edges: Cytoscape.ElementDefinition[] }
    ): Cytoscape.ElementDefinition[];
  }

  export default CytoscapeComponent;
}

/**
 * Extended Cytoscape type declarations
 */
declare module 'cytoscape' {
  interface Core {
    svg(options?: ExportStringOptions): string;
  }
}
