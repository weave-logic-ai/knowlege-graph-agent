import { Command } from "commander";
import chalk from "chalk";
import * as path from "path";
import { writeFile, access, readFile } from "fs/promises";
import { glob } from "fast-glob";
import matter from "gray-matter";
class LinkAnalyzer {
  fileMap = /* @__PURE__ */ new Map();
  allFiles = /* @__PURE__ */ new Set();
  /**
   * Analyze a vault for links and build adjacency list
   */
  async analyzeVault(vaultPath, options = {}) {
    const resolvedPath = path.resolve(vaultPath);
    try {
      await access(resolvedPath);
    } catch {
      throw new Error(`Vault path does not exist: ${resolvedPath}`);
    }
    const files = await glob("**/*.md", {
      cwd: resolvedPath,
      ignore: ["node_modules/**", ".git/**", "dist/**"],
      absolute: false
    });
    if (files.length === 0) {
      throw new Error(`No markdown files found in: ${resolvedPath}`);
    }
    this.buildFileMap(files);
    const adjacencyList = /* @__PURE__ */ new Map();
    const brokenLinks = [];
    const incomingLinks = /* @__PURE__ */ new Map();
    let totalWikiLinks = 0;
    let totalMarkdownLinks = 0;
    let maxLinksInFile = 0;
    let maxLinksFile = "";
    for (const file of files) {
      adjacencyList.set(file, []);
      incomingLinks.set(file, /* @__PURE__ */ new Set());
    }
    for (const file of files) {
      const filePath = path.join(resolvedPath, file);
      const content = await readFile(filePath, "utf-8");
      const { content: bodyContent } = matter(content);
      const wikiLinks = this.parseWikiLinks(bodyContent);
      const markdownLinks = this.parseMarkdownLinks(bodyContent);
      totalWikiLinks += wikiLinks.length;
      totalMarkdownLinks += markdownLinks.length;
      const fileLinks = adjacencyList.get(file) || [];
      const totalLinksInThisFile = wikiLinks.length + markdownLinks.length;
      if (totalLinksInThisFile > maxLinksInFile) {
        maxLinksInFile = totalLinksInThisFile;
        maxLinksFile = file;
      }
      for (const link of wikiLinks) {
        const resolved = this.resolveLink(link, file);
        if (resolved && this.allFiles.has(resolved)) {
          fileLinks.push(resolved);
          incomingLinks.get(resolved)?.add(file);
        } else {
          brokenLinks.push({
            source: file,
            target: link,
            type: "wikilink"
          });
        }
      }
      for (const link of markdownLinks) {
        const resolved = this.resolveLink(link, file);
        if (resolved && this.allFiles.has(resolved)) {
          fileLinks.push(resolved);
          incomingLinks.get(resolved)?.add(file);
        } else if (!this.isExternalLink(link)) {
          brokenLinks.push({
            source: file,
            target: link,
            type: "markdown"
          });
        }
      }
      adjacencyList.set(file, [...new Set(fileLinks)]);
    }
    const orphanFiles = [];
    for (const file of files) {
      const outgoing = adjacencyList.get(file) || [];
      const incoming = incomingLinks.get(file) || /* @__PURE__ */ new Set();
      if (outgoing.length === 0 && incoming.size === 0) {
        orphanFiles.push(file);
      }
    }
    const totalFiles = files.length;
    const filesWithLinks = files.filter((f) => {
      const outgoing = adjacencyList.get(f) || [];
      const incoming = incomingLinks.get(f) || /* @__PURE__ */ new Set();
      return outgoing.length > 0 || incoming.size > 0;
    }).length;
    const orphanRate = totalFiles > 0 ? orphanFiles.length / totalFiles * 100 : 0;
    const totalLinks = totalWikiLinks + totalMarkdownLinks;
    const linkDensity = totalFiles > 0 ? totalLinks / totalFiles : 0;
    const averageLinksPerFile = totalFiles > 0 ? totalLinks / totalFiles : 0;
    const isolatedClusters = this.countClusters(adjacencyList, files);
    return {
      totalFiles,
      filesWithLinks,
      orphanFiles,
      orphanRate: Math.round(orphanRate * 100) / 100,
      linkDensity: Math.round(linkDensity * 100) / 100,
      adjacencyList,
      brokenLinks,
      statistics: {
        totalLinks,
        wikiLinks: totalWikiLinks,
        markdownLinks: totalMarkdownLinks,
        averageLinksPerFile: Math.round(averageLinksPerFile * 100) / 100,
        maxLinksInFile,
        maxLinksFile,
        isolatedClusters
      }
    };
  }
  /**
   * Build a map from filename (without extension) to full path
   */
  buildFileMap(files) {
    this.fileMap.clear();
    this.allFiles.clear();
    for (const file of files) {
      this.allFiles.add(file);
      const basename = path.basename(file, ".md");
      if (!this.fileMap.has(basename)) {
        this.fileMap.set(basename, file);
      }
      const pathWithoutExt = file.replace(/\.md$/, "");
      this.fileMap.set(pathWithoutExt, file);
    }
  }
  /**
   * Parse [[wiki-links]] from content
   * Handles: [[link]], [[link|alias]], [[folder/link]], [[link#heading]]
   */
  parseWikiLinks(content) {
    const links = [];
    const regex = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const link = match[1].trim();
      if (link) {
        links.push(link);
      }
    }
    return links;
  }
  /**
   * Parse [markdown](links) from content
   * Handles: [text](link.md), [text](./link.md), [text](../folder/link.md)
   */
  parseMarkdownLinks(content) {
    const links = [];
    const regex = /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const link = match[2].trim();
      if (link && !this.isExternalLink(link) && !link.startsWith("#")) {
        links.push(link);
      }
    }
    return links;
  }
  /**
   * Check if a link is external (http, https, etc.)
   */
  isExternalLink(link) {
    return /^(https?:|mailto:|tel:|ftp:)/i.test(link);
  }
  /**
   * Resolve a link to a file in the vault
   */
  resolveLink(link, sourceFile) {
    let cleanLink = link.replace(/\.md$/, "");
    if (cleanLink.startsWith("./") || cleanLink.startsWith("../")) {
      const sourceDir = path.dirname(sourceFile);
      const resolved = path.normalize(path.join(sourceDir, cleanLink));
      cleanLink = resolved;
    }
    const found = this.fileMap.get(cleanLink);
    if (found) return found;
    const withMd = cleanLink + ".md";
    if (this.allFiles.has(withMd)) return withMd;
    const basename = path.basename(cleanLink);
    const byBasename = this.fileMap.get(basename);
    if (byBasename) return byBasename;
    return null;
  }
  /**
   * Count isolated clusters using union-find algorithm
   */
  countClusters(adjacencyList, files) {
    const parent = /* @__PURE__ */ new Map();
    const rank = /* @__PURE__ */ new Map();
    for (const file of files) {
      parent.set(file, file);
      rank.set(file, 0);
    }
    const find = (x) => {
      if (parent.get(x) !== x) {
        parent.set(x, find(parent.get(x)));
      }
      return parent.get(x);
    };
    const union = (x, y) => {
      const rootX = find(x);
      const rootY = find(y);
      if (rootX !== rootY) {
        const rankX = rank.get(rootX) || 0;
        const rankY = rank.get(rootY) || 0;
        if (rankX < rankY) {
          parent.set(rootX, rootY);
        } else if (rankX > rankY) {
          parent.set(rootY, rootX);
        } else {
          parent.set(rootY, rootX);
          rank.set(rootX, rankX + 1);
        }
      }
    };
    for (const [source, targets] of adjacencyList) {
      for (const target of targets) {
        if (parent.has(target)) {
          union(source, target);
        }
      }
    }
    const roots = /* @__PURE__ */ new Set();
    for (const file of files) {
      roots.add(find(file));
    }
    return roots.size;
  }
  /**
   * Generate a detailed report
   */
  generateReport(result) {
    const lines = [];
    lines.push("# Link Analysis Report\n");
    lines.push(`Generated: ${(/* @__PURE__ */ new Date()).toISOString()}
`);
    lines.push("## Summary\n");
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Total Files | ${result.totalFiles} |`);
    lines.push(`| Files with Links | ${result.filesWithLinks} |`);
    lines.push(`| Orphan Files | ${result.orphanFiles.length} |`);
    lines.push(`| Orphan Rate | ${result.orphanRate}% |`);
    lines.push(`| Link Density | ${result.linkDensity} |`);
    lines.push(`| Total Links | ${result.statistics.totalLinks} |`);
    lines.push(`| Wiki Links | ${result.statistics.wikiLinks} |`);
    lines.push(`| Markdown Links | ${result.statistics.markdownLinks} |`);
    lines.push(`| Avg Links/File | ${result.statistics.averageLinksPerFile} |`);
    lines.push(`| Max Links in File | ${result.statistics.maxLinksInFile} |`);
    lines.push(`| Most Linked File | ${result.statistics.maxLinksFile} |`);
    lines.push(`| Isolated Clusters | ${result.statistics.isolatedClusters} |`);
    lines.push("");
    if (result.orphanFiles.length > 0) {
      lines.push("## Orphan Files\n");
      lines.push("Files with no incoming or outgoing links:\n");
      for (const file of result.orphanFiles.slice(0, 50)) {
        lines.push(`- \`${file}\``);
      }
      if (result.orphanFiles.length > 50) {
        lines.push(`
... and ${result.orphanFiles.length - 50} more`);
      }
      lines.push("");
    }
    if (result.brokenLinks.length > 0) {
      lines.push("## Broken Links\n");
      lines.push("Links that point to non-existent files:\n");
      for (const broken of result.brokenLinks.slice(0, 50)) {
        lines.push(`- \`${broken.source}\` -> \`${broken.target}\` (${broken.type})`);
      }
      if (result.brokenLinks.length > 50) {
        lines.push(`
... and ${result.brokenLinks.length - 50} more`);
      }
      lines.push("");
    }
    return lines.join("\n");
  }
}
function createAnalyzeLinksCommand() {
  const command = new Command("analyze-links").description("Analyze wiki-links and markdown links in a vault").argument("<vault-path>", "Path to Obsidian vault or docs directory").option("-o, --output <file>", "Output file for results (JSON or Markdown)").option("--json", "Output as JSON").option("-v, --verbose", "Show detailed output").action(async (vaultPath, options) => {
    const analyzer = new LinkAnalyzer();
    console.log(chalk.cyan("\nAnalyzing links in vault...\n"));
    try {
      const result = await analyzer.analyzeVault(vaultPath, options);
      if (options.json) {
        const jsonResult = {
          ...result,
          adjacencyList: Object.fromEntries(result.adjacencyList)
        };
        if (options.output) {
          await writeFile(options.output, JSON.stringify(jsonResult, null, 2));
          console.log(chalk.green(`Results written to: ${options.output}`));
        } else {
          console.log(JSON.stringify(jsonResult, null, 2));
        }
      } else {
        console.log(chalk.bold("Summary:"));
        console.log(chalk.white(`  Total Files:      ${result.totalFiles}`));
        console.log(chalk.white(`  Files with Links: ${result.filesWithLinks}`));
        console.log(chalk.white(`  Orphan Files:     ${chalk.yellow(result.orphanFiles.length.toString())}`));
        console.log(chalk.white(`  Orphan Rate:      ${chalk.yellow(result.orphanRate + "%")}`));
        console.log(chalk.white(`  Link Density:     ${result.linkDensity}`));
        console.log("");
        console.log(chalk.bold("Link Statistics:"));
        console.log(chalk.white(`  Total Links:      ${result.statistics.totalLinks}`));
        console.log(chalk.white(`  Wiki Links:       ${result.statistics.wikiLinks}`));
        console.log(chalk.white(`  Markdown Links:   ${result.statistics.markdownLinks}`));
        console.log(chalk.white(`  Avg Links/File:   ${result.statistics.averageLinksPerFile}`));
        console.log(chalk.white(`  Isolated Clusters: ${result.statistics.isolatedClusters}`));
        console.log("");
        if (result.brokenLinks.length > 0) {
          console.log(chalk.bold(chalk.red(`Broken Links: ${result.brokenLinks.length}`)));
          if (options.verbose) {
            for (const broken of result.brokenLinks.slice(0, 10)) {
              console.log(chalk.red(`  ${broken.source} -> ${broken.target}`));
            }
            if (result.brokenLinks.length > 10) {
              console.log(chalk.gray(`  ... and ${result.brokenLinks.length - 10} more`));
            }
          }
          console.log("");
        }
        if (options.verbose && result.orphanFiles.length > 0) {
          console.log(chalk.bold(chalk.yellow("Orphan Files:")));
          for (const file of result.orphanFiles.slice(0, 10)) {
            console.log(chalk.yellow(`  ${file}`));
          }
          if (result.orphanFiles.length > 10) {
            console.log(chalk.gray(`  ... and ${result.orphanFiles.length - 10} more`));
          }
          console.log("");
        }
        if (options.output) {
          const report = analyzer.generateReport(result);
          await writeFile(options.output, report);
          console.log(chalk.green(`Report written to: ${options.output}`));
        }
        console.log(chalk.bold("Target Metrics:"));
        const orphanStatus = result.orphanRate < 10 ? chalk.green("PASS") : chalk.red("FAIL");
        const densityStatus = result.linkDensity > 5 ? chalk.green("PASS") : chalk.red("FAIL");
        console.log(chalk.white(`  Orphan Rate:   ${result.orphanRate}% (target: < 10%) ${orphanStatus}`));
        console.log(chalk.white(`  Link Density:  ${result.linkDensity} (target: > 5.0) ${densityStatus}`));
        console.log("");
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error instanceof Error ? error.message : "Unknown error");
      process.exit(1);
    }
  });
  return command;
}
export {
  LinkAnalyzer,
  createAnalyzeLinksCommand,
  createAnalyzeLinksCommand as default
};
//# sourceMappingURL=analyze-links.js.map
