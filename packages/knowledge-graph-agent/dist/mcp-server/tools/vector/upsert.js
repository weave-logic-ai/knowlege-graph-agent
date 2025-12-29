const vectorUpsertTool = {
  name: "kg_vector_upsert",
  description: "Insert or update a vector in the knowledge graph. If a vector with the given ID exists, it will be replaced; otherwise, a new vector will be created.",
  inputSchema: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "Unique identifier for the vector. Used for retrieval and updates."
      },
      vector: {
        type: "array",
        items: { type: "number" },
        description: "The embedding vector as an array of numbers. Must match the configured dimensions."
      },
      metadata: {
        type: "object",
        description: "Optional metadata to associate with the vector. Can include title, content, type, tags, etc.",
        properties: {
          title: { type: "string", description: "Title of the source document" },
          content: { type: "string", description: "Text content snippet" },
          type: {
            type: "string",
            description: "Node type",
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
          path: { type: "string", description: "Source file path" },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Associated tags"
          },
          sourceId: { type: "string", description: "Reference to source node" }
        },
        additionalProperties: true
      },
      namespace: {
        type: "string",
        description: 'Optional namespace for organizing vectors (default: "default")'
      }
    },
    required: ["id", "vector"]
  }
};
function validateVector(vector, expectedDimensions) {
  if (!Array.isArray(vector)) {
    return { valid: false, error: "Vector must be an array" };
  }
  if (vector.length === 0) {
    return { valid: false, error: "Vector cannot be empty" };
  }
  if (vector.length !== expectedDimensions) {
    return {
      valid: false,
      error: `Vector dimension mismatch: expected ${expectedDimensions}, got ${vector.length}`
    };
  }
  for (let i = 0; i < vector.length; i++) {
    if (typeof vector[i] !== "number" || !isFinite(vector[i])) {
      return {
        valid: false,
        error: `Invalid vector element at index ${i}: must be a finite number`
      };
    }
  }
  return { valid: true };
}
function validateId(id) {
  if (typeof id !== "string") {
    return { valid: false, error: "ID must be a string" };
  }
  if (id.trim().length === 0) {
    return { valid: false, error: "ID cannot be empty" };
  }
  if (id.length > 256) {
    return { valid: false, error: "ID must be at most 256 characters" };
  }
  if (!/^[\w\-:./]+$/.test(id)) {
    return {
      valid: false,
      error: "ID can only contain alphanumeric characters, dashes, underscores, colons, dots, and slashes"
    };
  }
  return { valid: true };
}
function createVectorUpsertHandler(vectorStore) {
  return async (params) => {
    const startTime = Date.now();
    const typedParams = params;
    const { id, vector, metadata = {}, namespace } = typedParams;
    try {
      const idValidation = validateId(id);
      if (!idValidation.valid) {
        return {
          success: false,
          error: idValidation.error,
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
      const config = vectorStore.getConfig();
      const expectedDimensions = config.index.dimensions;
      const vectorValidation = validateVector(vector, expectedDimensions);
      if (!vectorValidation.valid) {
        return {
          success: false,
          error: vectorValidation.error,
          metadata: { executionTime: Date.now() - startTime }
        };
      }
      const existing = await vectorStore.get(id);
      const isUpdate = existing !== null;
      if (isUpdate) {
        await vectorStore.delete(id);
      }
      const fullMetadata = {
        ...metadata,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (namespace) {
        fullMetadata.namespace = namespace;
      }
      await vectorStore.insert({
        id,
        vector,
        metadata: fullMetadata
      });
      const stats = vectorStore.getStats();
      return {
        success: true,
        data: {
          id,
          operation: isUpdate ? "updated" : "inserted",
          dimensions: vector.length,
          hasMetadata: Object.keys(metadata).length > 0,
          namespace: namespace || "default"
        },
        metadata: {
          executionTime: Date.now() - startTime,
          totalVectors: stats.totalVectors,
          wasUpdate: isUpdate
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
  createVectorUpsertHandler,
  vectorUpsertTool
};
//# sourceMappingURL=upsert.js.map
