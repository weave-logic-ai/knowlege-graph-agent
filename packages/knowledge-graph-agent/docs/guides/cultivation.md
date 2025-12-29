# Cultivation System Guide

The Cultivation System provides automated codebase analysis and knowledge graph seed generation. It scans your project, detects dependencies, services, and frameworks, then generates structured documentation that integrates with the knowledge graph.

## Overview

The cultivation process consists of three main components:

1. **SeedGenerator** - Analyzes codebases to detect dependencies, services, and frameworks
2. **SeedEnhancer** - Enriches detected primitives with additional metadata
3. **DeepAnalyzer** - Uses claude-flow agents for comprehensive multi-agent analysis

## Supported Ecosystems

The system supports the following programming ecosystems:

| Ecosystem | Package File | Lock Files |
|-----------|-------------|------------|
| `nodejs` | package.json | package-lock.json, yarn.lock, pnpm-lock.yaml |
| `python` | requirements.txt, pyproject.toml, setup.py | Pipfile.lock, poetry.lock |
| `php` | composer.json | composer.lock |
| `rust` | Cargo.toml | Cargo.lock |
| `go` | go.mod | go.sum |
| `java` | pom.xml, build.gradle | |
| `ruby` | Gemfile | Gemfile.lock |
| `dotnet` | *.csproj, packages.config | |

## Basic Usage

### Running Seed Analysis

```typescript
import { SeedGenerator } from '@knowledge-graph-agent/cultivation';

const generator = new SeedGenerator();

// Analyze a project
const analysis = await generator.analyze({
  projectRoot: '/path/to/project',
  docsPath: '/path/to/docs',
  ecosystems: ['nodejs', 'python'], // Optional filter
  includeDev: false, // Exclude dev dependencies
  minImportance: 'major' // 'all' | 'major' | 'framework'
});

console.log(analysis.dependencies);
console.log(analysis.services);
console.log(analysis.frameworks);
```

### Analysis Results Structure

The `SeedAnalysis` result contains:

```typescript
interface SeedAnalysis {
  // All detected dependencies
  dependencies: DependencyInfo[];

  // Detected services (APIs, databases, etc.)
  services: ServiceInfo[];

  // Framework dependencies (subset of dependencies)
  frameworks: DependencyInfo[];

  // Programming languages used
  languages: string[];

  // Deployment configurations found
  deployments: string[];

  // Existing concepts from vault
  existingConcepts: string[];

  // Existing features from vault
  existingFeatures: string[];

  // Analysis metadata
  metadata: {
    analyzedAt: string;
    projectRoot: string;
    filesScanned: number;
    duration: number;
  };
}
```

## Dependency Detection

### Dependency Types

Dependencies are classified into types:

| Type | Description | Examples |
|------|-------------|----------|
| `framework` | Core application frameworks | Express, React, Django, Rails |
| `library` | Utility libraries | lodash, axios, requests |
| `tool` | Development tools | TypeScript, ESLint, pytest |
| `service` | Service clients | aws-sdk, @google-cloud/* |
| `language` | Language runtimes | Node.js, Python |
| `runtime` | Runtime environments | Deno, Bun |

### DependencyInfo Structure

```typescript
interface DependencyInfo {
  name: string;           // Package name
  version: string;        // Version string
  type: DependencyType;   // Classification
  category: string;       // Knowledge graph category
  ecosystem: Ecosystem;   // Package ecosystem
  description?: string;   // Optional description
  documentation?: string[]; // Doc URLs
  repository?: string;    // Repo URL
  usedBy: string[];       // Files using this
  relatedTo: string[];    // Related dependencies
  isDev?: boolean;        // Dev dependency flag
}
```

## Service Detection

### Service Types

The system detects various service types:

| Type | Description | Technologies |
|------|-------------|--------------|
| `api` | REST/GraphQL APIs | Express, FastAPI, Gin |
| `database` | Data stores | PostgreSQL, MongoDB, Redis |
| `queue` | Message queues | RabbitMQ, Kafka, SQS |
| `cache` | Caching layers | Redis, Memcached |
| `storage` | File storage | S3, GCS, MinIO |
| `compute` | Compute services | Lambda, Cloud Functions |
| `monitoring` | Observability | Prometheus, Datadog |
| `auth` | Authentication | Auth0, Keycloak, Cognito |
| `search` | Search engines | Elasticsearch, Algolia |
| `ml` | ML services | TensorFlow Serving, SageMaker |

### ServiceInfo Structure

```typescript
interface ServiceInfo {
  name: string;           // Service name
  type: ServiceType;      // Service classification
  technology: string;     // Technology (postgres, redis)
  framework?: string;     // Framework if applicable
  language?: string;      // Programming language
  dependencies: string[]; // Service dependencies
  endpoints?: string[];   // API endpoints if detected
  ports?: number[];       // Port mappings
  envVars?: string[];     // Environment variables
}
```

## Deep Analysis with Claude-Flow

The DeepAnalyzer uses multi-agent orchestration for comprehensive codebase analysis.

### Running Deep Analysis

```typescript
import { DeepAnalyzer } from '@knowledge-graph-agent/cultivation';

const analyzer = new DeepAnalyzer();

const result = await analyzer.analyze({
  projectRoot: '/path/to/project',
  docsPath: '/path/to/docs',
  verbose: true
});

console.log(result.architecturePatterns);
console.log(result.codeQualityMetrics);
console.log(result.securityFindings);
```

### Agent Roles in Deep Analysis

The deep analyzer spawns specialized agents:

| Agent | Role | Analyzes |
|-------|------|----------|
| `researcher` | Pattern discovery | Architecture patterns, conventions |
| `code-analyzer` | Code analysis | Complexity, dependencies, structure |
| `architect` | System design | Component relationships, boundaries |
| `reviewer` | Quality review | Code quality, best practices |

### Analysis Output

```typescript
interface DeepAnalysisResult {
  // Detected architecture patterns
  architecturePatterns: {
    pattern: string;
    confidence: number;
    evidence: string[];
  }[];

  // Code quality metrics
  codeQualityMetrics: {
    complexity: number;
    maintainability: number;
    testCoverage?: number;
  };

  // Security findings
  securityFindings: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    finding: string;
    location: string;
    recommendation: string;
  }[];

  // Improvement suggestions
  suggestions: string[];
}
```

## PRIMITIVES.md Generation

The cultivation system can generate a PRIMITIVES.md file documenting your technology stack.

### Generating PRIMITIVES.md

```typescript
import { SeedGenerator } from '@knowledge-graph-agent/cultivation';

const generator = new SeedGenerator();
const analysis = await generator.analyze({ projectRoot: '.' });

// Generate PRIMITIVES.md content
const primitives = generator.generatePrimitivesDoc(analysis);

// Write to file
await fs.writeFile('docs/PRIMITIVES.md', primitives);
```

### PRIMITIVES.md Structure

The generated file follows this structure:

```markdown
# Technology Primitives

## Frameworks
- **Express** (v4.18.2) - Web framework for Node.js
  - Documentation: https://expressjs.com
  - Category: Backend Framework

## Libraries
- **lodash** (v4.17.21) - Utility library
  - Category: Utilities

## Services
- **PostgreSQL** - Primary database
  - Type: database
  - Port: 5432

## Languages
- TypeScript
- Python
```

## Shadow Cache

The cultivation system uses a shadow cache to track analysis results and avoid redundant processing.

### Cache Location

```
.kg/
  shadow-cache/
    analysis-{hash}.json
    dependencies-{hash}.json
    services-{hash}.json
```

### Cache Operations

```typescript
// Clear cache for fresh analysis
await generator.clearCache();

// Force fresh analysis (ignores cache)
const analysis = await generator.analyze({
  projectRoot: '.',
  forceRefresh: true
});
```

## CLI Usage

### Basic Commands

```bash
# Analyze current project
npx kg cultivate analyze

# Generate primitives documentation
npx kg cultivate generate-primitives

# Run deep analysis with agents
npx kg cultivate deep-analyze --verbose

# Analyze specific ecosystems
npx kg cultivate analyze --ecosystems nodejs,python
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--project-root` | Project root path | `.` |
| `--docs-path` | Documentation path | `./docs` |
| `--ecosystems` | Filter ecosystems | all |
| `--include-dev` | Include dev deps | false |
| `--min-importance` | Minimum importance | `major` |
| `--verbose` | Verbose output | false |
| `--dry-run` | Preview only | false |

## Integration with Knowledge Graph

### Automatic Node Creation

The cultivation system can automatically create knowledge graph nodes:

```typescript
import { SeedGenerator } from '@knowledge-graph-agent/cultivation';
import { KnowledgeGraph } from '@knowledge-graph-agent/core';

const generator = new SeedGenerator();
const graph = new KnowledgeGraph();

const analysis = await generator.analyze({ projectRoot: '.' });

// Create nodes for each dependency
for (const dep of analysis.dependencies) {
  await graph.createNode({
    type: 'primitive',
    title: dep.name,
    frontmatter: {
      version: dep.version,
      ecosystem: dep.ecosystem,
      category: dep.category,
      documentation: dep.documentation
    }
  });
}
```

### Linking Dependencies

```typescript
// Create relationships between dependencies
for (const dep of analysis.dependencies) {
  for (const related of dep.relatedTo) {
    await graph.createEdge({
      source: dep.name,
      target: related,
      type: 'related',
      weight: 0.8
    });
  }
}
```

## Configuration

### Cultivation Options

```typescript
interface CultivationOptions {
  projectRoot: string;      // Project root path
  docsPath: string;         // Docs/vault path
  outputPath?: string;      // Output for generated files
  dryRun?: boolean;         // Preview only
  verbose?: boolean;        // Verbose output
  ecosystems?: Ecosystem[]; // Filter ecosystems
  minImportance?: 'all' | 'major' | 'framework';
  includeDev?: boolean;     // Include dev dependencies
}
```

### Example Configuration

```typescript
const options: CultivationOptions = {
  projectRoot: '/home/user/myproject',
  docsPath: '/home/user/myproject/docs',
  outputPath: '/home/user/myproject/docs/primitives',
  dryRun: false,
  verbose: true,
  ecosystems: ['nodejs', 'python'],
  minImportance: 'major',
  includeDev: false
};

const analysis = await generator.analyze(options);
```

## Best Practices

1. **Run analysis regularly** - Keep documentation in sync with dependencies
2. **Use ecosystem filters** - Focus on relevant technologies
3. **Review generated content** - Verify accuracy before committing
4. **Integrate with CI/CD** - Automate documentation updates
5. **Leverage deep analysis** - Use for architecture reviews and audits

## Troubleshooting

### Common Issues

**No dependencies detected**
- Verify package files exist in project root
- Check ecosystem filter settings
- Ensure files are readable

**Slow analysis**
- Use ecosystem filters to limit scope
- Clear shadow cache if stale
- Reduce minImportance threshold

**Missing services**
- Check for Docker/compose files
- Verify environment variable patterns
- Review configuration files

### Debug Mode

```bash
# Enable debug logging
DEBUG=kg:cultivation npx kg cultivate analyze
```

## Related Guides

- [Knowledge Graph Guide](./knowledge-graph.md) - Building and managing graphs
- [Agents Guide](./agents.md) - Working with multi-agent analysis
- [Plugins Guide](./plugins.md) - Extending analysis capabilities
