---
# Node Metadata
phase_id: "PHASE-9"
phase_name: "Testing & Documentation"
type: implementation
status: "pending"
priority: "high"
created_date: "2025-10-23"
duration: "2 days"

# Scope
scope:
  current_phase: "mvp"
  obsidian_only: true
  web_version_needed: false

# Dependencies
dependencies:
  requires: ["PHASE-8"]
  enables: ["PHASE-10"]
  blocks: []

# Tags
tags:
  - scope/mvp
  - type/implementation
  - status/pending
  - priority/high
  - phase-9
  - testing
  - documentation
  - quality-assurance

# Visual
visual:
  icon: "check-circle"
  cssclasses:
    - type-implementation
    - scope-mvp
    - status-pending
    - priority-high
---

# Phase 9: Testing & Documentation

**Status**: ⏳ **PENDING** (blocked by Phase 8)
**Depends On**: [[phase-8-git-automation-workflow-proxy|Phase 8: Git Automation]] ⏳
**Enables**: [[phase-10-mvp-readiness-launch|Phase 10: MVP Readiness & Launch]]
**Priority**: 🔴 **HIGH**
**Duration**: 2 days

---

## 🎯 Objective

Establish **comprehensive test coverage** for the MCP server, agent rules, and integrations, and create **user-facing documentation** to enable seamless onboarding. This ensures the MVP is production-ready, maintainable, and accessible to users.

**Key Deliverables**:
1. ✅ Unit tests (Jest) for all core modules
2. ✅ Integration tests for MCP tools
3. ✅ End-to-end tests for workflows
4. ✅ User documentation (setup, usage, troubleshooting)
5. ✅ Developer documentation (architecture, API reference)

---

## 📋 Tasks

### Day 1: Testing Implementation (6-8 hours)

- [ ] **9.1: Set up Jest testing framework**
  - Install Jest, ts-jest, @types/jest
  - Configure `jest.config.js` for TypeScript
  - Create `tests/` directory structure
  - Add npm scripts: `test`, `test:watch`, `test:coverage`
  - **Success Criteria**: `npm test` runs successfully

- [ ] **9.2: Write unit tests for core modules**
  - `tests/clients/obsidian.test.ts` (ObsidianClient CRUD operations)
  - `tests/cache/shadow-cache.test.ts` (SQLite operations)
  - `tests/agents/claude-client.test.ts` (Mock Claude API)
  - `tests/git/git-client.test.ts` (simple-git operations)
  - **Success Criteria**: 80%+ code coverage for core modules

- [ ] **9.3: Write integration tests for MCP tools**
  - `tests/integration/mcp-tools.test.ts`
  - Test each MCP tool: read_note, create_note, update_note, etc.
  - Use test vault with sample notes
  - Validate tool input/output schemas
  - **Success Criteria**: All 6 MCP tools pass integration tests

- [ ] **9.4: Write end-to-end workflow tests**
  - `tests/e2e/auto-tag-workflow.test.ts` (Create note → auto-tag)
  - `tests/e2e/auto-link-workflow.test.ts` (Update note → auto-link)
  - `tests/e2e/daily-note-workflow.test.ts` (Create daily note → template)
  - `tests/e2e/auto-commit-workflow.test.ts` (Edit note → git commit)
  - **Success Criteria**: All workflows complete successfully

### Day 2: Documentation (6-8 hours)

- [ ] **9.5: Write user documentation**
  - `docs/user-guide/QUICKSTART.md` (5-minute setup guide)
  - `docs/user-guide/INSTALLATION.md` (Step-by-step install)
  - `docs/user-guide/CONFIGURATION.md` (.env reference)
  - `docs/user-guide/TROUBLESHOOTING.md` (Common issues)
  - **Success Criteria**: Non-technical user can set up in < 15 minutes

- [ ] **9.6: Write developer documentation**
  - `docs/developer/ARCHITECTURE.md` (System overview)
  - `docs/developer/API-REFERENCE.md` (MCP tools, endpoints)
  - `docs/developer/CONTRIBUTING.md` (How to add rules, tools)
  - `docs/developer/TESTING.md` (How to run tests, add tests)
  - **Success Criteria**: Developer can add new agent rule in < 1 hour

- [ ] **9.7: Create README and changelog**
  - Update root `README.md` with project overview
  - Add features list, screenshots (optional), quick links
  - Create `CHANGELOG.md` with version history
  - Document MVP v1.0.0 features
  - **Success Criteria**: GitHub repo looks professional

---

## 🏗️ Architecture

### Test Structure

```
weave-nn-mcp/
├── tests/
│   ├── unit/
│   │   ├── clients/
│   │   │   ├── obsidian.test.ts
│   │   │   └── claude-client.test.ts
│   │   ├── cache/
│   │   │   └── shadow-cache.test.ts
│   │   ├── agents/
│   │   │   └── rules-engine.test.ts
│   │   └── git/
│   │       ├── git-client.test.ts
│   │       └── auto-commit.test.ts
│   ├── integration/
│   │   ├── mcp-tools.test.ts
│   │   └── file-watcher.test.ts
│   ├── e2e/
│   │   ├── auto-tag-workflow.test.ts
│   │   ├── auto-link-workflow.test.ts
│   │   ├── daily-note-workflow.test.ts
│   │   └── auto-commit-workflow.test.ts
│   └── fixtures/
│       └── test-vault/
│           ├── note1.md
│           ├── note2.md
│           └── 2025-10-23.md
├── docs/
│   ├── user-guide/
│   │   ├── QUICKSTART.md
│   │   ├── INSTALLATION.md
│   │   ├── CONFIGURATION.md
│   │   └── TROUBLESHOOTING.md
│   └── developer/
│       ├── ARCHITECTURE.md
│       ├── API-REFERENCE.md
│       ├── CONTRIBUTING.md
│       └── TESTING.md
```

---

## 💻 Implementation

### 9.1: Jest Configuration

**Install dependencies:**
```bash
cd weave-nn-mcp
npm install --save-dev jest ts-jest @types/jest
```

**`jest.config.js`:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts' // Exclude entry point
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --testPathPattern=e2e"
  }
}
```

### 9.2: Unit Test Example (ObsidianClient)

**`tests/unit/clients/obsidian.test.ts`:**
```typescript
import { ObsidianClient } from '../../../src/clients/obsidian';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ObsidianClient', () => {
  let client: ObsidianClient;

  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockedAxios as any);
    client = new ObsidianClient('http://localhost:27124', 'test-key');
  });

  describe('readNote', () => {
    test('parses frontmatter correctly', async () => {
      const noteContent = `---
title: Test Note
tags: [test, sample]
---

# Test Note
Content here.`;

      mockedAxios.get.mockResolvedValue({ data: noteContent });

      const note = await client.readNote('test.md');

      expect(note.path).toBe('test.md');
      expect(note.frontmatter.title).toBe('Test Note');
      expect(note.frontmatter.tags).toEqual(['test', 'sample']);
      expect(note.content).toContain('# Test Note');
    });

    test('extracts wikilinks', async () => {
      const noteContent = `Related: [[note1]] and [[note2]]`;
      mockedAxios.get.mockResolvedValue({ data: noteContent });

      const note = await client.readNote('test.md');

      expect(note.links).toContain('note1');
      expect(note.links).toContain('note2');
    });
  });

  describe('createNote', () => {
    test('builds note with frontmatter', async () => {
      mockedAxios.post.mockResolvedValue({ data: 'OK' });

      await client.createNote('new.md', 'Content', { title: 'New Note' });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/vault/new.md',
        expect.stringContaining('title: New Note')
      );
    });
  });
});
```

### 9.3: Integration Test Example (MCP Tools)

**`tests/integration/mcp-tools.test.ts`:**
```typescript
import { WeaveNNMCPServer } from '../../src/server';
import fs from 'fs/promises';
import path from 'path';

describe('MCP Tools Integration', () => {
  let server: WeaveNNMCPServer;
  const testVault = path.join(__dirname, '../fixtures/test-vault');

  beforeAll(async () => {
    await fs.mkdir(testVault, { recursive: true });
    server = new WeaveNNMCPServer({
      vaultPath: testVault,
      obsidianApiUrl: 'http://localhost:27124',
      obsidianApiKey: 'test'
    });
  });

  afterAll(async () => {
    await fs.rm(testVault, { recursive: true });
  });

  test('read_note tool returns note metadata', async () => {
    await fs.writeFile(
      path.join(testVault, 'test.md'),
      '---\ntitle: Test\n---\n\n# Test'
    );

    const result = await server.callTool('read_note', { path: 'test.md' });

    expect(result.content).toBeDefined();
    expect(result.frontmatter.title).toBe('Test');
  });

  test('create_note tool creates new file', async () => {
    await server.callTool('create_note', {
      path: 'new.md',
      content: 'New content',
      frontmatter: { tags: ['new'] }
    });

    const exists = await fs.access(path.join(testVault, 'new.md'))
      .then(() => true)
      .catch(() => false);

    expect(exists).toBe(true);
  });

  test('search_notes tool finds matching notes', async () => {
    await fs.writeFile(
      path.join(testVault, 'searchable.md'),
      'Machine learning content'
    );

    const result = await server.callTool('search_notes', {
      query: 'machine learning'
    });

    expect(result.results).toContainEqual(
      expect.objectContaining({ path: 'searchable.md' })
    );
  });
});
```

### 9.4: E2E Test Example (Auto-Tag Workflow)

**`tests/e2e/auto-tag-workflow.test.ts`:**
```typescript
import { WeaveNNMCPServer } from '../../src/server';
import { FileWatcher } from '../../src/watcher/file-watcher';
import fs from 'fs/promises';
import path from 'path';

describe('Auto-Tag Workflow E2E', () => {
  let server: WeaveNNMCPServer;
  let watcher: FileWatcher;
  const testVault = path.join(__dirname, '../fixtures/test-vault');

  beforeAll(async () => {
    await fs.mkdir(testVault, { recursive: true });
    server = new WeaveNNMCPServer({ vaultPath: testVault });
    watcher = new FileWatcher(testVault);
    watcher.start();
  });

  afterAll(async () => {
    watcher.stop();
    await fs.rm(testVault, { recursive: true });
  });

  test('auto-tags new note without tags', async () => {
    // Create note without tags
    const notePath = path.join(testVault, 'ml-notes.md');
    await fs.writeFile(notePath, '# Machine Learning\n\nDeep learning is...');

    // Wait for auto-tag rule to execute
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Read updated note
    const content = await fs.readFile(notePath, 'utf-8');

    // Should have suggested_tags in frontmatter
    expect(content).toMatch(/suggested_tags:/);
    expect(content).toMatch(/machine-learning|ai|deep-learning/);
  });
});
```

### 9.5: User Documentation Example

**`docs/user-guide/QUICKSTART.md`:**
```markdown
# Weave-NN MCP Server - Quickstart Guide

Get up and running with Weave-NN in 5 minutes.

## Prerequisites

- **Node.js**: v20 or later
- **Obsidian**: Latest version
- **Claude Desktop**: For MCP integration (or Claude API key)

## Step 1: Install Weave-NN MCP Server

```bash
cd /path/to/weave-nn-mcp
npm install
```

## Step 2: Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
VAULT_PATH=/path/to/your/obsidian/vault
OBSIDIAN_API_URL=http://localhost:27124
OBSIDIAN_API_KEY=your-api-key
ANTHROPIC_API_KEY=sk-ant-...
```

## Step 3: Start the Server

```bash
npm run dev
```

You should see:

```
[MCP Server] Started on stdio
[FileWatcher] Watching vault: /path/to/vault
[AutoCommit] Enabled with 5-minute debounce
```

## Step 4: Connect Claude Desktop

Add to Claude Desktop config (`~/.config/claude/config.json`):

```json
{
  "mcpServers": {
    "weave-nn": {
      "command": "node",
      "args": ["/path/to/weave-nn-mcp/dist/server.js"]
    }
  }
}
```

Restart Claude Desktop.

## Step 5: Test It Out

In Claude Desktop, ask:

> "List all notes in my vault with tag #meeting"

Claude will use the Weave-NN MCP tools to query your vault!

## Next Steps

- [Configuration Guide](./CONFIGURATION.md) - Customize behavior
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [Agent Rules](../developer/CONTRIBUTING.md) - Add custom rules
```

---

## 📊 Success Criteria

### Testing
- [x] Unit test coverage: 80%+
- [x] Integration tests: All MCP tools pass
- [x] E2E tests: All workflows complete successfully
- [x] CI/CD: Tests run on every commit (optional for MVP)

### Documentation
- [x] Quickstart guide: User can set up in < 15 minutes
- [x] API reference: All MCP tools documented
- [x] Architecture doc: Clear system overview
- [x] Troubleshooting: Top 5 issues covered

### Quality
- [x] No critical bugs in core functionality
- [x] Error messages are clear and actionable
- [x] Logs provide debugging info

---

## 🔗 Dependencies

### npm Packages
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "@types/jest": "^29.5.0"
  }
}
```

### Phase Dependencies
- **Requires**: Phases 5-8 complete (all features implemented)
- **Enables**: Phase 10 (MVP readiness validation)

---

## 📝 Test Coverage Goals

| Module | Target Coverage | Priority |
|--------|----------------|----------|
| ObsidianClient | 90% | High |
| ShadowCache | 85% | High |
| ClaudeClient | 80% | Medium |
| RulesEngine | 85% | High |
| FileWatcher | 80% | Medium |
| GitClient | 75% | Medium |
| AutoCommit | 80% | Medium |

---

## 🔗 Next Steps

After Phase 9 completion:
1. **Phase 10**: Final MVP readiness validation
2. **Phase 10**: Deployment preparation and launch checklist

---

**Status**: ⏳ **PENDING** (blocked by Phase 8)
**Estimated Duration**: 2 days
**Next Phase**: [[phase-10-mvp-readiness-launch|Phase 10: MVP Readiness & Launch]]
