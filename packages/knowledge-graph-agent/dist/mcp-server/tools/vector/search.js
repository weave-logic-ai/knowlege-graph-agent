const vectorSearchTool = {
  name: "kg_vector_search",
  description: "Perform semantic vector search on the knowledge graph. Supports pure vector similarity search and hybrid search combining vector similarity with keyword matching for more precise results.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query string. Will be converted to an embedding vector for similarity search."
      },
      k: {
        type: "number",
        description: "Number of results to return (default: 10, max: 100)",
        default: 10,
        minimum: 1,
        maximum: 100
      },
      type: {
        type: "string",
        description: "Filter results by node type",
        enum: [
          "concept",
          "technical",
          "feature",
          "primitive",
          "service",
          "guide",
          "standard",
          "integration"
        ]
      },
      hybrid: {
        type: "boolean",
        description: "Enable hybrid search combining vector similarity with keyword matching (default: false)",
        default: false
      },
      minScore: {
        type: "number",
        description: "Minimum similarity score threshold (0-1, default: 0)",
        default: 0,
        minimum: 0,
        maximum: 1
      },
      includeVectors: {
        type: "boolean",
        description: "Include raw vector data in results (default: false)",
        default: false
      },
      namespace: {
        type: "string",
        description: "Filter by vector namespace"
      }
    },
    required: ["query"]
  }
};
function textToVector(text, dimensions = 1536) {
  const vector = new Array(dimensions).fill(0);
  const normalized = text.toLowerCase().trim();
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const idx = charCode * (i + 1) % dimensions;
    vector[idx] += Math.sin(charCode * (i + 1)) * 0.1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }
  return vector;
}
function calculateKeywordScore(query, metadata) {
  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (queryTerms.length === 0) return 0;
  let matchCount = 0;
  const searchableFields = ["title", "content", "description", "tags"];
  for (const field of searchableFields) {
    const value = metadata[field];
    if (typeof value === "string") {
      const fieldLower = value.toLowerCase();
      for (const term of queryTerms) {
        if (fieldLower.includes(term)) {
          matchCount++;
        }
      }
    } else if (Array.isArray(value)) {
      const fieldValues = value.join(" ").toLowerCase();
      for (const term of queryTerms) {
        if (fieldValues.includes(term)) {
          matchCount++;
        }
      }
    }
  }
  return Math.min(1, matchCount / (queryTerms.length * searchableFields.length));
}
function createVectorSearchHandler(vectorStore) {
  return async (params) => {
    const startTime = Date.now();
    const typedParams = params;
    const {
      query,
      k = 10,
      type,
      hybrid = false,
      minScore = 0,
      includeVectors = false,
      namespace
    } = typedParams;
    try {
      if (!query || typeof query !== "string") {
        return {
          success: false,
          error: "Query parameter is required and must be a string",
          metadata: { executionTime: Date.now() - startTime }
        };
      }
      if (!vectorStore) {
        return {
          success: false,
          error: "Vector store not initialized. Configure vector storage first.",
          metadata: { executionTime: Date.now() - startTime }
        };
      }
      if (!vectorStore.isReady()) {
        await vectorStore.initialize();
      }
      const safeK = Math.min(Math.max(1, Number(k) || 10), 100);
      const queryVector = textToVector(query, vectorStore.getConfig().index.dimensions);
      const filter = {};
      if (type && typeof type === "string") {
        filter.type = type;
      }
      if (namespace && typeof namespace === "string") {
        filter.namespace = namespace;
      }
      let results;
      if (hybrid) {
        const hybridResults = await vectorStore.hybridSearch({
          embedding: queryVector,
          limit: safeK * 2,
          // Get extra for re-ranking
          filters: Object.keys(filter).length > 0 ? filter : void 0,
          minScore: minScore > 0 ? minScore : void 0,
          includeVectors,
          namespace
        });
        const reranked = hybridResults.map((result) => {
          const keywordScore = calculateKeywordScore(query, result.metadata);
          const combinedScore = result.score * 0.7 + keywordScore * 0.3;
          return {
            ...result,
            keywordScore,
            combinedScore,
            source: "merged"
          };
        });
        reranked.sort((a, b) => b.combinedScore - a.combinedScore);
        results = reranked.slice(0, safeK);
      } else {
        results = await vectorStore.search({
          vector: queryVector,
          k: safeK,
          filter: Object.keys(filter).length > 0 ? filter : void 0,
          minScore: minScore > 0 ? minScore : void 0
        });
      }
      const formattedResults = results.map((result) => {
        const formatted = {
          id: result.id,
          score: Math.round(result.score * 1e4) / 1e4,
          metadata: result.metadata
        };
        if (includeVectors && result.vector) {
          formatted.vector = result.vector;
        }
        const resultWithScores = result;
        if ("combinedScore" in resultWithScores && typeof resultWithScores.combinedScore === "number") {
          formatted.combinedScore = Math.round(resultWithScores.combinedScore * 1e4) / 1e4;
        }
        if ("keywordScore" in resultWithScores && typeof resultWithScores.keywordScore === "number") {
          formatted.keywordScore = Math.round(resultWithScores.keywordScore * 1e4) / 1e4;
        }
        if ("source" in result) {
          formatted.source = result.source;
        }
        return formatted;
      });
      const stats = vectorStore.getStats();
      return {
        success: true,
        data: {
          results: formattedResults,
          count: formattedResults.length,
          query,
          searchMode: hybrid ? "hybrid" : "vector",
          filters: {
            type: type || null,
            minScore: minScore || null,
            namespace: namespace || null
          }
        },
        metadata: {
          executionTime: Date.now() - startTime,
          totalVectors: stats.totalVectors,
          indexType: stats.indexType,
          cached: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: { executionTime: Date.now() - startTime }
      };
    }
  };
}
export {
  createVectorSearchHandler,
  vectorSearchTool
};
//# sourceMappingURL=search.js.map
