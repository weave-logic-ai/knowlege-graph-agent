import { Command } from "commander";
import chalk from "chalk";
import * as path from "path";
import { writeFile, readFile } from "fs/promises";
import { glob } from "fast-glob";
import matter from "gray-matter";
function tokenize(text) {
  const noCode = text.replace(/```[\s\S]*?```/g, "");
  const noInline = noCode.replace(/`[^`]+`/g, "");
  const noUrls = noInline.replace(/https?:\/\/[^\s]+/g, "");
  const noLinks = noUrls.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  const noWiki = noLinks.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1");
  const words = noWiki.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter((word) => word.length > 2 && word.length < 30);
  return words;
}
const STOPWORDS = /* @__PURE__ */ new Set([
  "the",
  "and",
  "for",
  "are",
  "but",
  "not",
  "you",
  "all",
  "can",
  "had",
  "her",
  "was",
  "one",
  "our",
  "out",
  "has",
  "have",
  "been",
  "were",
  "some",
  "this",
  "that",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "will",
  "with",
  "would",
  "there",
  "their",
  "from",
  "they",
  "been",
  "said",
  "each",
  "she",
  "how",
  "its",
  "may",
  "more",
  "than",
  "then",
  "these",
  "into",
  "only",
  "other",
  "also",
  "any",
  "such",
  "because",
  "about",
  "just",
  "could",
  "very"
]);
function filterStopwords(words) {
  return words.filter((word) => !STOPWORDS.has(word));
}
class ConnectionFinder {
  documents = /* @__PURE__ */ new Map();
  documentVectors = /* @__PURE__ */ new Map();
  documentFrequency = /* @__PURE__ */ new Map();
  totalDocuments = 0;
  /**
   * Build TF-IDF index from vault
   */
  async buildIndex(vaultPath) {
    const resolvedPath = path.resolve(vaultPath);
    const files = await glob("**/*.md", {
      cwd: resolvedPath,
      ignore: ["node_modules/**", ".git/**", "dist/**"],
      absolute: false
    });
    if (files.length === 0) {
      throw new Error(`No markdown files found in: ${resolvedPath}`);
    }
    this.documents.clear();
    this.documentVectors.clear();
    this.documentFrequency.clear();
    this.totalDocuments = files.length;
    const termDocuments = /* @__PURE__ */ new Map();
    for (const file of files) {
      const filePath = path.join(resolvedPath, file);
      const content = await readFile(filePath, "utf-8");
      const { content: bodyContent, data: frontmatter } = matter(content);
      const fullText = [
        frontmatter.title || "",
        frontmatter.description || "",
        Array.isArray(frontmatter.tags) ? frontmatter.tags.join(" ") : "",
        Array.isArray(frontmatter.aliases) ? frontmatter.aliases.join(" ") : "",
        bodyContent
      ].join(" ");
      this.documents.set(file, fullText);
      const tokens = filterStopwords(tokenize(fullText));
      const uniqueTerms = new Set(tokens);
      for (const term of uniqueTerms) {
        if (!termDocuments.has(term)) {
          termDocuments.set(term, /* @__PURE__ */ new Set());
        }
        termDocuments.get(term).add(file);
      }
    }
    for (const [term, docs] of termDocuments) {
      this.documentFrequency.set(term, docs.size);
    }
    for (const file of files) {
      const content = this.documents.get(file);
      const tokens = filterStopwords(tokenize(content));
      const termFreq = /* @__PURE__ */ new Map();
      for (const term of tokens) {
        termFreq.set(term, (termFreq.get(term) || 0) + 1);
      }
      const tfidf = /* @__PURE__ */ new Map();
      const maxFreq = Math.max(...termFreq.values(), 1);
      for (const [term, freq] of termFreq) {
        const tf = freq / maxFreq;
        const df = this.documentFrequency.get(term) || 1;
        const idf = Math.log(this.totalDocuments / df);
        tfidf.set(term, tf * idf);
      }
      let magnitude = 0;
      for (const value of tfidf.values()) {
        magnitude += value * value;
      }
      magnitude = Math.sqrt(magnitude);
      this.documentVectors.set(file, {
        file,
        terms: tfidf,
        magnitude
      });
    }
  }
  /**
   * Find similar documents to a source file
   */
  findSimilar(sourceFile, threshold = 0.3, limit = 10) {
    const sourceVector = this.documentVectors.get(sourceFile);
    if (!sourceVector) {
      return [];
    }
    const matches = [];
    for (const [targetFile, targetVector] of this.documentVectors) {
      if (targetFile === sourceFile) continue;
      const similarity = this.cosineSimilarity(sourceVector, targetVector);
      if (similarity >= threshold) {
        const sharedTerms = this.findSharedTerms(sourceVector, targetVector);
        matches.push({
          source: sourceFile,
          target: targetFile,
          similarity: Math.round(similarity * 1e3) / 1e3,
          sharedTerms: sharedTerms.slice(0, 5)
        });
      }
    }
    matches.sort((a, b) => b.similarity - a.similarity);
    return matches.slice(0, limit);
  }
  /**
   * Calculate cosine similarity between two document vectors
   */
  cosineSimilarity(a, b) {
    if (a.magnitude === 0 || b.magnitude === 0) return 0;
    let dotProduct = 0;
    for (const [term, aValue] of a.terms) {
      const bValue = b.terms.get(term) || 0;
      dotProduct += aValue * bValue;
    }
    return dotProduct / (a.magnitude * b.magnitude);
  }
  /**
   * Find shared terms between two documents
   */
  findSharedTerms(a, b) {
    const shared = [];
    for (const [term, aValue] of a.terms) {
      const bValue = b.terms.get(term);
      if (bValue && bValue > 0) {
        shared.push({ term, score: aValue * bValue });
      }
    }
    shared.sort((a2, b2) => b2.score - a2.score);
    return shared.map((s) => s.term);
  }
  /**
   * Suggest connections for orphan files
   */
  async suggestConnections(vaultPath, orphanFiles, threshold = 0.3, limit = 5) {
    if (this.documentVectors.size === 0) {
      await this.buildIndex(vaultPath);
    }
    const suggestions = [];
    for (const orphan of orphanFiles) {
      const similar = this.findSimilar(orphan, threshold, limit);
      suggestions.push(...similar);
    }
    suggestions.sort((a, b) => b.similarity - a.similarity);
    return suggestions;
  }
  /**
   * Find all potential connections above threshold
   */
  async findAllConnections(vaultPath, threshold = 0.3, limit = 100) {
    if (this.documentVectors.size === 0) {
      await this.buildIndex(vaultPath);
    }
    const allConnections = [];
    const processed = /* @__PURE__ */ new Set();
    for (const sourceFile of this.documentVectors.keys()) {
      const similar = this.findSimilar(sourceFile, threshold, 10);
      for (const match of similar) {
        const key = [match.source, match.target].sort().join("|");
        if (!processed.has(key)) {
          processed.add(key);
          allConnections.push(match);
        }
      }
    }
    allConnections.sort((a, b) => b.similarity - a.similarity);
    const topConnections = allConnections.slice(0, limit);
    const averageSimilarity = topConnections.length > 0 ? topConnections.reduce((sum, c) => sum + c.similarity, 0) / topConnections.length : 0;
    return {
      totalDocuments: this.totalDocuments,
      suggestedConnections: topConnections,
      orphanConnections: [],
      termCount: this.documentFrequency.size,
      averageSimilarity: Math.round(averageSimilarity * 1e3) / 1e3
    };
  }
  /**
   * Get index statistics
   */
  getStats() {
    return {
      documents: this.documentVectors.size,
      terms: this.documentFrequency.size
    };
  }
}
function createFindConnectionsCommand() {
  const command = new Command("find-connections").description("Find potential connections using TF-IDF similarity").argument("<vault-path>", "Path to Obsidian vault or docs directory").option("-t, --threshold <number>", "Similarity threshold (0-1)", "0.3").option("-l, --limit <number>", "Maximum connections to return", "50").option("--suggest", "Focus on orphan files").option("-o, --output <file>", "Output file for results").option("--json", "Output as JSON").option("-v, --verbose", "Show detailed output").action(async (vaultPath, options) => {
    const finder = new ConnectionFinder();
    const threshold = parseFloat(options.threshold || "0.3");
    const limit = parseInt(options.limit || "50", 10);
    console.log(chalk.cyan("\nBuilding TF-IDF index...\n"));
    try {
      await finder.buildIndex(vaultPath);
      const stats = finder.getStats();
      console.log(chalk.white(`  Documents indexed: ${stats.documents}`));
      console.log(chalk.white(`  Unique terms:      ${stats.terms}`));
      console.log("");
      const result = await finder.findAllConnections(vaultPath, threshold, limit);
      if (options.json) {
        if (options.output) {
          await writeFile(options.output, JSON.stringify(result, null, 2));
          console.log(chalk.green(`Results written to: ${options.output}`));
        } else {
          console.log(JSON.stringify(result, null, 2));
        }
      } else {
        console.log(chalk.bold("Potential Connections Found:\n"));
        if (result.suggestedConnections.length === 0) {
          console.log(chalk.yellow("  No connections found above threshold."));
          console.log(chalk.gray("  Try lowering the threshold with -t option.\n"));
        } else {
          for (const conn of result.suggestedConnections.slice(0, options.verbose ? 50 : 20)) {
            const simColor = conn.similarity >= 0.5 ? chalk.green : conn.similarity >= 0.3 ? chalk.yellow : chalk.gray;
            console.log(
              simColor(`  [${(conn.similarity * 100).toFixed(1)}%]`),
              chalk.white(conn.source),
              chalk.gray("->"),
              chalk.cyan(conn.target)
            );
            if (options.verbose && conn.sharedTerms.length > 0) {
              console.log(chalk.gray(`          Terms: ${conn.sharedTerms.join(", ")}`));
            }
          }
          if (result.suggestedConnections.length > (options.verbose ? 50 : 20)) {
            console.log(
              chalk.gray(`
  ... and ${result.suggestedConnections.length - (options.verbose ? 50 : 20)} more`)
            );
          }
          console.log("");
          console.log(chalk.bold("Summary:"));
          console.log(chalk.white(`  Total Documents:   ${result.totalDocuments}`));
          console.log(chalk.white(`  Connections Found: ${result.suggestedConnections.length}`));
          console.log(chalk.white(`  Average Similarity: ${(result.averageSimilarity * 100).toFixed(1)}%`));
          console.log("");
        }
        if (options.output) {
          const reportLines = [
            "# Connection Suggestions\n",
            `Generated: ${(/* @__PURE__ */ new Date()).toISOString()}
`,
            `Threshold: ${threshold}
`,
            "",
            "## Suggested Links\n"
          ];
          for (const conn of result.suggestedConnections) {
            reportLines.push(`- **${conn.source}** -> [[${conn.target}]]`);
            reportLines.push(`  - Similarity: ${(conn.similarity * 100).toFixed(1)}%`);
            if (conn.sharedTerms.length > 0) {
              reportLines.push(`  - Shared terms: ${conn.sharedTerms.join(", ")}`);
            }
          }
          await writeFile(options.output, reportLines.join("\n"));
          console.log(chalk.green(`Report written to: ${options.output}`));
        }
        console.log(chalk.bold("Next Steps:"));
        console.log(chalk.gray("  1. Review suggested connections"));
        console.log(chalk.gray("  2. Add [[wiki-links]] to connect related documents"));
        console.log(chalk.gray("  3. Run kg analyze-links to verify improvement"));
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
  ConnectionFinder,
  createFindConnectionsCommand,
  createFindConnectionsCommand as default
};
//# sourceMappingURL=find-connections.js.map
