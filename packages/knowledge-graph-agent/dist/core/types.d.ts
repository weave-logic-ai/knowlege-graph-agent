/**
 * Knowledge Graph Agent - Core Types
 *
 * Type definitions for the knowledge graph system.
 */
import { z } from 'zod';
export type NodeType = 'concept' | 'technical' | 'feature' | 'primitive' | 'service' | 'guide' | 'standard' | 'integration';
export type NodeStatus = 'draft' | 'active' | 'deprecated' | 'archived';
export interface NodeLink {
    target: string;
    type: 'wikilink' | 'markdown' | 'backlink';
    text?: string;
    context?: string;
}
export interface NodeFrontmatter {
    title?: string;
    type?: NodeType;
    status?: NodeStatus;
    tags?: string[];
    category?: string;
    description?: string;
    created?: string;
    updated?: string;
    aliases?: string[];
    related?: string[];
    [key: string]: unknown;
}
export interface KnowledgeNode {
    id: string;
    path: string;
    filename: string;
    title: string;
    type: NodeType;
    status: NodeStatus;
    content: string;
    frontmatter: NodeFrontmatter;
    tags: string[];
    outgoingLinks: NodeLink[];
    incomingLinks: NodeLink[];
    wordCount: number;
    lastModified: Date;
}
export interface GraphEdge {
    source: string;
    target: string;
    type: 'link' | 'reference' | 'parent' | 'related';
    weight: number;
    context?: string;
}
export interface KnowledgeGraph {
    nodes: Map<string, KnowledgeNode>;
    edges: GraphEdge[];
    metadata: GraphMetadata;
}
export interface GraphMetadata {
    name: string;
    version: string;
    created: string;
    updated: string;
    nodeCount: number;
    edgeCount: number;
    rootPath: string;
}
export interface GraphStats {
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<NodeType, number>;
    nodesByStatus: Record<NodeStatus, number>;
    orphanNodes: number;
    avgLinksPerNode: number;
    mostConnected: Array<{
        id: string;
        connections: number;
    }>;
}
export declare const ConfigSchema: z.ZodObject<{
    projectRoot: z.ZodDefault<z.ZodString>;
    docsRoot: z.ZodDefault<z.ZodString>;
    vaultName: z.ZodOptional<z.ZodString>;
    graph: z.ZodDefault<z.ZodObject<{
        includePatterns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        excludePatterns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        maxDepth: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        includePatterns: string[];
        excludePatterns: string[];
        maxDepth: number;
    }, {
        includePatterns?: string[] | undefined;
        excludePatterns?: string[] | undefined;
        maxDepth?: number | undefined;
    }>>;
    database: z.ZodDefault<z.ZodObject<{
        path: z.ZodDefault<z.ZodString>;
        enableWAL: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        enableWAL: boolean;
    }, {
        path?: string | undefined;
        enableWAL?: boolean | undefined;
    }>>;
    claudeFlow: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        namespace: z.ZodDefault<z.ZodString>;
        syncOnChange: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        namespace: string;
        syncOnChange: boolean;
    }, {
        enabled?: boolean | undefined;
        namespace?: string | undefined;
        syncOnChange?: boolean | undefined;
    }>>;
    templates: z.ZodDefault<z.ZodObject<{
        customPath: z.ZodOptional<z.ZodString>;
        defaultType: z.ZodDefault<z.ZodEnum<["concept", "technical", "feature", "primitive", "service", "guide", "standard", "integration"]>>;
    }, "strip", z.ZodTypeAny, {
        defaultType: "concept" | "technical" | "feature" | "primitive" | "service" | "guide" | "standard" | "integration";
        customPath?: string | undefined;
    }, {
        customPath?: string | undefined;
        defaultType?: "concept" | "technical" | "feature" | "primitive" | "service" | "guide" | "standard" | "integration" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    projectRoot: string;
    docsRoot: string;
    graph: {
        includePatterns: string[];
        excludePatterns: string[];
        maxDepth: number;
    };
    database: {
        path: string;
        enableWAL: boolean;
    };
    claudeFlow: {
        enabled: boolean;
        namespace: string;
        syncOnChange: boolean;
    };
    templates: {
        defaultType: "concept" | "technical" | "feature" | "primitive" | "service" | "guide" | "standard" | "integration";
        customPath?: string | undefined;
    };
    vaultName?: string | undefined;
}, {
    projectRoot?: string | undefined;
    docsRoot?: string | undefined;
    vaultName?: string | undefined;
    graph?: {
        includePatterns?: string[] | undefined;
        excludePatterns?: string[] | undefined;
        maxDepth?: number | undefined;
    } | undefined;
    database?: {
        path?: string | undefined;
        enableWAL?: boolean | undefined;
    } | undefined;
    claudeFlow?: {
        enabled?: boolean | undefined;
        namespace?: string | undefined;
        syncOnChange?: boolean | undefined;
    } | undefined;
    templates?: {
        customPath?: string | undefined;
        defaultType?: "concept" | "technical" | "feature" | "primitive" | "service" | "guide" | "standard" | "integration" | undefined;
    } | undefined;
}>;
export type KGConfig = z.infer<typeof ConfigSchema>;
export interface GeneratorOptions {
    projectRoot: string;
    outputPath: string;
    includeExamples?: boolean;
    force?: boolean;
}
export interface GeneratedDocument {
    path: string;
    title: string;
    type: NodeType;
    content: string;
    frontmatter: NodeFrontmatter;
}
export interface DocsInitOptions {
    projectRoot: string;
    docsPath?: string;
    template?: string;
    includeExamples?: boolean;
    detectFramework?: boolean;
}
export interface DocsInitResult {
    success: boolean;
    docsPath: string;
    filesCreated: string[];
    errors: string[];
}
export interface MemoryEntry {
    key: string;
    value: unknown;
    namespace?: string;
    ttl?: number;
    metadata?: Record<string, unknown>;
}
export interface SyncResult {
    synced: number;
    failed: number;
    errors: Array<{
        key: string;
        error: string;
    }>;
}
export interface ClaudeMdSection {
    title: string;
    content: string;
    order: number;
}
export interface ClaudeMdTemplate {
    name: string;
    description: string;
    sections: ClaudeMdSection[];
    variables: Record<string, string>;
}
export interface ClaudeMdGeneratorOptions {
    projectRoot: string;
    outputPath?: string;
    template?: string;
    includeKnowledgeGraph?: boolean;
    includeClaudeFlow?: boolean;
    customSections?: ClaudeMdSection[];
}
//# sourceMappingURL=types.d.ts.map