import { readFileSync, statSync } from "fs";
import { join, basename, relative } from "path";
import fg from "fast-glob";
import matter from "gray-matter";
import { KnowledgeGraphManager } from "../core/graph.js";
import { KnowledgeGraphDatabase } from "../core/database.js";
const WIKILINK_PATTERN = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
async function generateGraph(options) {
  const { projectRoot, outputPath } = options;
  const stats = {
    filesScanned: 0,
    nodesCreated: 0,
    edgesCreated: 0,
    errors: []
  };
  const graph = new KnowledgeGraphManager(
    basename(projectRoot),
    projectRoot
  );
  const files = await fg("**/*.md", {
    cwd: outputPath,
    ignore: ["node_modules/**", ".git/**", "_templates/**"],
    absolute: true
  });
  stats.filesScanned = files.length;
  const nodeMap = /* @__PURE__ */ new Map();
  for (const filePath of files) {
    try {
      const node = await parseMarkdownFile(filePath, outputPath);
      nodeMap.set(node.id, node);
      stats.nodesCreated++;
    } catch (error) {
      stats.errors.push(`Failed to parse ${filePath}: ${error}`);
    }
  }
  for (const node of nodeMap.values()) {
    const resolvedLinks = [];
    for (const link of node.outgoingLinks) {
      const targetId = resolveLink(link.target, node.path, nodeMap);
      if (targetId) {
        resolvedLinks.push({
          ...link,
          target: targetId
        });
        const targetNode = nodeMap.get(targetId);
        if (targetNode) {
          targetNode.incomingLinks.push({
            target: node.id,
            type: "backlink",
            text: node.title
          });
        }
        stats.edgesCreated++;
      }
    }
    node.outgoingLinks = resolvedLinks;
    graph.addNode(node);
  }
  return { graph, stats };
}
async function generateAndSave(options, dbPath) {
  const { graph, stats } = await generateGraph(options);
  const db = new KnowledgeGraphDatabase(dbPath);
  try {
    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();
    for (const node of nodes) {
      db.upsertNode(node);
    }
    for (const edge of edges) {
      db.addEdge(edge);
    }
    db.setMetadata("lastGenerated", (/* @__PURE__ */ new Date()).toISOString());
    db.setMetadata("nodeCount", String(stats.nodesCreated));
    db.setMetadata("edgeCount", String(stats.edgesCreated));
    return { success: true, stats };
  } catch (error) {
    stats.errors.push(`Database error: ${error}`);
    return { success: false, stats };
  } finally {
    db.close();
  }
}
async function parseMarkdownFile(filePath, docsRoot) {
  const content = readFileSync(filePath, "utf-8");
  const stat = statSync(filePath);
  const { data, content: body } = matter(content);
  const filename = basename(filePath, ".md");
  const relativePath = relative(docsRoot, filePath);
  const id = relativePath.replace(/\.md$/, "").replace(/\\/g, "/").replace(/[^a-z0-9/]+/gi, "-").toLowerCase();
  const outgoingLinks = extractLinks(body);
  const type = inferNodeType(data.type, relativePath);
  const status = data.status || "active";
  const frontmatter = {
    title: data.title || formatTitle(filename),
    type,
    status,
    tags: Array.isArray(data.tags) ? data.tags : [],
    category: data.category,
    description: data.description,
    created: data.created || stat.birthtime.toISOString().split("T")[0],
    updated: data.updated || stat.mtime.toISOString().split("T")[0],
    aliases: data.aliases,
    related: data.related,
    ...data
  };
  const wordCount = body.replace(/[#*`\[\]()]/g, "").split(/\s+/).filter(Boolean).length;
  return {
    id,
    path: relativePath,
    filename,
    title: frontmatter.title || formatTitle(filename),
    type,
    status,
    content: body,
    frontmatter,
    tags: frontmatter.tags || [],
    outgoingLinks,
    incomingLinks: [],
    // Will be filled in second pass
    wordCount,
    lastModified: stat.mtime
  };
}
function extractLinks(content) {
  const links = [];
  const seen = /* @__PURE__ */ new Set();
  let match;
  while ((match = WIKILINK_PATTERN.exec(content)) !== null) {
    const target = match[1].trim();
    const text = match[2]?.trim();
    if (!seen.has(target)) {
      seen.add(target);
      links.push({
        target,
        type: "wikilink",
        text
      });
    }
  }
  while ((match = MARKDOWN_LINK_PATTERN.exec(content)) !== null) {
    const text = match[1].trim();
    const target = match[2].trim();
    if (target.startsWith("http://") || target.startsWith("https://")) {
      continue;
    }
    if (!seen.has(target)) {
      seen.add(target);
      links.push({
        target,
        type: "markdown",
        text
      });
    }
  }
  return links;
}
function resolveLink(target, currentPath, nodeMap) {
  const cleanTarget = target.replace(/\.md$/, "").replace(/^\.\//, "").toLowerCase();
  for (const [id, node] of nodeMap) {
    if (id === cleanTarget) {
      return id;
    }
    if (node.filename.toLowerCase() === cleanTarget) {
      return id;
    }
    if (node.title.toLowerCase() === cleanTarget) {
      return id;
    }
    if (node.frontmatter.aliases?.some(
      (a) => a.toLowerCase() === cleanTarget
    )) {
      return id;
    }
  }
  const currentDir = currentPath.replace(/[^/]+$/, "");
  const relativePath = join(currentDir, cleanTarget).replace(/\\/g, "/").replace(/^\//, "");
  for (const [id, node] of nodeMap) {
    if (id === relativePath || node.path.replace(/\.md$/, "") === relativePath) {
      return id;
    }
  }
  return null;
}
function inferNodeType(declaredType, path) {
  const validTypes = [
    "concept",
    "technical",
    "feature",
    "primitive",
    "service",
    "guide",
    "standard",
    "integration"
  ];
  if (typeof declaredType === "string" && validTypes.includes(declaredType)) {
    return declaredType;
  }
  const pathLower = path.toLowerCase();
  if (pathLower.includes("concept")) return "concept";
  if (pathLower.includes("component") || pathLower.includes("technical")) return "technical";
  if (pathLower.includes("feature")) return "feature";
  if (pathLower.includes("primitive") || pathLower.includes("integration")) return "primitive";
  if (pathLower.includes("service") || pathLower.includes("api")) return "service";
  if (pathLower.includes("guide") || pathLower.includes("tutorial")) return "guide";
  if (pathLower.includes("standard")) return "standard";
  if (pathLower.includes("reference")) return "technical";
  return "concept";
}
function formatTitle(filename) {
  return filename.replace(/-/g, " ").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
async function updateGraph(dbPath, docsRoot) {
  const result = {
    added: 0,
    updated: 0,
    removed: 0,
    errors: []
  };
  const db = new KnowledgeGraphDatabase(dbPath);
  try {
    const existingNodes = db.getAllNodes();
    const existingPaths = new Set(existingNodes.map((n) => n.path));
    const currentFiles = await fg("**/*.md", {
      cwd: docsRoot,
      ignore: ["node_modules/**", ".git/**", "_templates/**"]
    });
    const currentPaths = new Set(currentFiles);
    for (const node of existingNodes) {
      if (!currentPaths.has(node.path)) {
        db.deleteNode(node.id);
        result.removed++;
      }
    }
    for (const filePath of currentFiles) {
      const fullPath = join(docsRoot, filePath);
      try {
        const node = await parseMarkdownFile(fullPath, docsRoot);
        if (existingPaths.has(filePath)) {
          const existing = existingNodes.find((n) => n.path === filePath);
          if (existing && node.lastModified > existing.lastModified) {
            db.deleteNodeEdges(node.id);
            db.upsertNode(node);
            result.updated++;
          }
        } else {
          db.upsertNode(node);
          result.added++;
        }
      } catch (error) {
        result.errors.push(`Failed to process ${filePath}: ${error}`);
      }
    }
    db.setMetadata("lastUpdated", (/* @__PURE__ */ new Date()).toISOString());
  } finally {
    db.close();
  }
  return result;
}
export {
  generateAndSave,
  generateGraph,
  updateGraph
};
//# sourceMappingURL=graph-generator.js.map
