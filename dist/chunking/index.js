class Chunker {
  defaultOptions = {
    strategy: "paragraph",
    chunkSize: 1e3,
    overlap: 100,
    minChunkSize: 100,
    maxChunkSize: 2e3,
    includeMetadata: true,
    preserveCodeBlocks: true
  };
  constructor(options) {
    if (options) {
      this.defaultOptions = { ...this.defaultOptions, ...options };
    }
  }
  /**
   * Chunk a document
   */
  chunk(content, source, options) {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    let chunks;
    switch (opts.strategy) {
      case "fixed":
        chunks = this.chunkFixed(content, source, opts);
        break;
      case "sentence":
        chunks = this.chunkBySentence(content, source, opts);
        break;
      case "paragraph":
        chunks = this.chunkByParagraph(content, source, opts);
        break;
      case "markdown":
        chunks = this.chunkByMarkdown(content, source, opts);
        break;
      case "code":
        chunks = this.chunkByCode(content, source, opts);
        break;
      case "semantic":
        chunks = this.chunkSemantic(content, source, opts);
        break;
      default:
        chunks = this.chunkByParagraph(content, source, opts);
    }
    return {
      chunks,
      originalLength: content.length,
      strategy: opts.strategy,
      processingTime: Date.now() - startTime
    };
  }
  /**
   * Fixed-size chunking
   */
  chunkFixed(content, source, opts) {
    const chunks = [];
    const chunkSize = opts.chunkSize || 1e3;
    const overlap = opts.overlap || 0;
    let position = 0;
    let index = 0;
    while (position < content.length) {
      const end = Math.min(position + chunkSize, content.length);
      const chunkContent = content.slice(position, end);
      chunks.push({
        id: `${source}-${index}`,
        content: chunkContent,
        metadata: {
          source,
          index,
          total: 0,
          // Will be updated after
          startPosition: position,
          endPosition: end
        },
        tokenCount: this.estimateTokens(chunkContent)
      });
      position = end - overlap;
      index++;
    }
    chunks.forEach((chunk) => {
      chunk.metadata.total = chunks.length;
    });
    return chunks;
  }
  /**
   * Sentence-based chunking
   */
  chunkBySentence(content, source, opts) {
    const sentences = content.split(/(?<=[.!?])\s+/);
    return this.aggregateChunks(sentences, source, opts);
  }
  /**
   * Paragraph-based chunking
   */
  chunkByParagraph(content, source, opts) {
    const paragraphs = content.split(/\n\n+/);
    return this.aggregateChunks(paragraphs, source, opts);
  }
  /**
   * Markdown-aware chunking
   */
  chunkByMarkdown(content, source, opts) {
    const sections = [];
    const headings = [];
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let lastIndex = 0;
    let currentHeadings = [];
    let match;
    while ((match = headerRegex.exec(content)) !== null) {
      if (lastIndex < match.index) {
        sections.push(content.slice(lastIndex, match.index).trim());
        headings.push([...currentHeadings]);
      }
      const level = match[1].length;
      const heading = match[2];
      currentHeadings = currentHeadings.slice(0, level - 1);
      currentHeadings[level - 1] = heading;
      lastIndex = match.index;
    }
    if (lastIndex < content.length) {
      sections.push(content.slice(lastIndex).trim());
      headings.push([...currentHeadings]);
    }
    return sections.filter((s) => s.length > 0).map((section, index) => ({
      id: `${source}-${index}`,
      content: section,
      metadata: {
        source,
        index,
        total: sections.length,
        startPosition: 0,
        endPosition: section.length,
        headings: headings[index]
      },
      tokenCount: this.estimateTokens(section)
    }));
  }
  /**
   * Code-aware chunking
   */
  chunkByCode(content, source, opts) {
    const chunks = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let index = 0;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (lastIndex < match.index) {
        const textContent = content.slice(lastIndex, match.index).trim();
        if (textContent) {
          chunks.push({
            id: `${source}-${index}`,
            content: textContent,
            metadata: {
              source,
              index,
              total: 0,
              startPosition: lastIndex,
              endPosition: match.index
            },
            tokenCount: this.estimateTokens(textContent)
          });
          index++;
        }
      }
      const language = match[1] || "unknown";
      const codeContent = match[2].trim();
      chunks.push({
        id: `${source}-${index}`,
        content: codeContent,
        metadata: {
          source,
          index,
          total: 0,
          startPosition: match.index,
          endPosition: match.index + match[0].length,
          language
        },
        tokenCount: this.estimateTokens(codeContent)
      });
      index++;
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      const textContent = content.slice(lastIndex).trim();
      if (textContent) {
        chunks.push({
          id: `${source}-${index}`,
          content: textContent,
          metadata: {
            source,
            index,
            total: 0,
            startPosition: lastIndex,
            endPosition: content.length
          },
          tokenCount: this.estimateTokens(textContent)
        });
      }
    }
    chunks.forEach((chunk) => {
      chunk.metadata.total = chunks.length;
    });
    return chunks;
  }
  /**
   * Semantic chunking (placeholder for more advanced implementation)
   */
  chunkSemantic(content, source, opts) {
    return this.chunkByParagraph(content, source, opts);
  }
  /**
   * Aggregate small chunks into larger ones
   */
  aggregateChunks(parts, source, opts) {
    const chunks = [];
    const chunkSize = opts.chunkSize || 1e3;
    const minSize = opts.minChunkSize || 100;
    let currentContent = "";
    let index = 0;
    let startPos = 0;
    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;
      if (currentContent.length + trimmedPart.length > chunkSize && currentContent.length >= minSize) {
        chunks.push({
          id: `${source}-${index}`,
          content: currentContent.trim(),
          metadata: {
            source,
            index,
            total: 0,
            startPosition: startPos,
            endPosition: startPos + currentContent.length
          },
          tokenCount: this.estimateTokens(currentContent)
        });
        index++;
        startPos += currentContent.length;
        currentContent = trimmedPart;
      } else {
        currentContent += (currentContent ? "\n\n" : "") + trimmedPart;
      }
    }
    if (currentContent.trim()) {
      chunks.push({
        id: `${source}-${index}`,
        content: currentContent.trim(),
        metadata: {
          source,
          index,
          total: 0,
          startPosition: startPos,
          endPosition: startPos + currentContent.length
        },
        tokenCount: this.estimateTokens(currentContent)
      });
    }
    chunks.forEach((chunk) => {
      chunk.metadata.total = chunks.length;
    });
    return chunks;
  }
  /**
   * Estimate token count
   */
  estimateTokens(content) {
    return Math.ceil(content.length / 4);
  }
}
function createChunker(options) {
  return new Chunker(options);
}
function chunkDocument(content, source, options) {
  const chunker = new Chunker(options);
  return chunker.chunk(content, source, options);
}
export {
  Chunker,
  chunkDocument,
  createChunker
};
//# sourceMappingURL=index.js.map
