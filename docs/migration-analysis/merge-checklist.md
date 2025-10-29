# Merge Checklist

## Automated Steps (✅ Complete)

- [x] Backup root implementation
- [x] Copy 41 Phase 12 files
- [x] Rename memory types to avoid conflict
- [x] Create plugin comparison files
- [x] Run initial type check

## Manual Steps (TODO)

### Type System Merges

- [ ] Merge `embeddings/types.ts`:
  - [ ] Combine root cache/hybrid types with nested model types
  - [ ] Add `IEmbeddingModel` and `IVectorStorage` interfaces
  - [ ] Add `BatchEmbeddingRequest` and `BatchEmbeddingResult`
  - [ ] Test imports across codebase

- [ ] Update `memory/index.ts`:
  ```typescript
  export * from './types.js';              // Vault sync
  export * from './experience-types.js';   // Learning
  export * from './claude-flow-client.js';
  export * from './vault-sync.js';
  export * from './experience-storage.js';
  export * from './experience-indexer.js';
  ```

### Plugin Merges

- [ ] Merge `chunking/plugins/base-chunker.ts`:
  - [ ] Compare root vs nested implementations
  - [ ] Add nested helper methods to root
  - [ ] Preserve root validation logic
  - [ ] Test with all chunking strategies

- [ ] Merge `chunking/plugins/event-based-chunker.ts`:
  - [ ] Add nested event detection features
  - [ ] Merge boundary detection logic
  - [ ] Test with episodic memory

- [ ] Merge `chunking/plugins/preference-signal-chunker.ts`:
  - [ ] Add nested signal detection
  - [ ] Merge decision extraction
  - [ ] Test with preference memory

- [ ] Merge `chunking/plugins/step-based-chunker.ts`:
  - [ ] Add nested step detection
  - [ ] Merge prerequisite handling
  - [ ] Test with procedural memory

### Index File Updates

- [ ] Update `chunking/index.ts`:
  ```typescript
  // Add new utilities
  export {
    detectHeadingBoundaries,
    detectParagraphBoundaries,
    detectCodeBlockBoundaries,
    detectListBoundaries,
    detectAllBoundaries,
  } from './utils/boundary-detector.js';

  export {
    extractContextBefore,
    extractContextAfter,
    extractContextAround,
    generateSummary,
  } from './utils/context-extractor.js';

  export {
    jaccardSimilarity,
    cosineSimilarity,
    detectSemanticBoundary,
  } from './utils/similarity.js';
  ```

- [ ] Update `embeddings/index.ts`:
  ```typescript
  // Add Phase 12 exports
  export { ModelManager } from './models/model-manager.js';
  export { VectorStorage } from './storage/vector-storage.js';
  export { BatchProcessor } from './batch-processor.js';
  ```

- [ ] Update `workflows/index.ts`:
  ```typescript
  // Add learning loop exports
  export * from './learning-loop/index.js';
  export * from './experience-integration.js';
  export * from './learning-loop-workflows.js';
  export * from './register-workflows.js';
  export * from './vector-db-workflows.js';
  ```

### Testing

- [ ] Unit tests:
  - [ ] `npm run test -- chunking`
  - [ ] `npm run test -- embeddings`
  - [ ] `npm run test -- memory`
  - [ ] `npm run test -- workflows/learning-loop`
  - [ ] `npm run test -- reasoning`
  - [ ] `npm run test -- reflection`

- [ ] Integration tests:
  - [ ] Test learning loop workflow
  - [ ] Test experience storage/retrieval
  - [ ] Test reasoning strategies
  - [ ] Test reflection engine

- [ ] Full suite:
  - [ ] `npm run test`
  - [ ] `npm run build`
  - [ ] `npm run typecheck`

### Documentation

- [ ] Update README with Phase 12 features
- [ ] Document learning loop workflow
- [ ] Document reasoning strategies
- [ ] Document experience memory system
- [ ] Update API documentation

### Cleanup

- [ ] Remove nested implementation: `rm -rf /home/aepod/dev/weave-nn/weave-nn/weaver`
- [ ] Remove backup after verification: `rm -rf /home/aepod/dev/weave-nn/.merge-backup`
- [ ] Remove comparison files: `rm -rf /home/aepod/dev/weave-nn/weaver/merge-comparison`
- [ ] Update `.gitignore` if needed

### Git Commit

- [ ] Stage all changes: `git add .`
- [ ] Review changes: `git status`
- [ ] Commit: `git commit -m "feat(phase-12): Merge learning loop features into root implementation"`
- [ ] Push: `git push`

---

**Progress**: 5/50 steps complete (10%)
**Estimated Time Remaining**: ~6-8 hours
**Next Priority**: Type system merges
