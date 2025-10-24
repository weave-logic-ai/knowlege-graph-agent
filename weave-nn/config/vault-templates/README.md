---
type: documentation
category: configuration
status: active
created_date: "2025-10-23"
tags:
  - templates
  - vault-initialization
  - project-scaffolding
---

# Vault Template System

**Purpose**: Reusable vault templates for initializing new projects of different types with appropriate directory structure, documents, and knowledge graph patterns.

**When to use**: When initializing a new Weave-NN vault for a new project or application.

---

## Overview

The vault template system provides pre-configured structures for common application types:

1. **TypeScript/Node.js Application** - Express APIs, CLI tools, libraries
2. **Next.js/React Web Application** - Frontend with API routes
3. **Python Application** - FastAPI, Flask, Django
4. **Monorepo/Multi-Service** - Microservices, packages
5. **Generic/Unknown** - Fallback template for any project type

Each template defines:
- Directory structure (folders to create)
- Required documents (markdown files to generate)
- Frontmatter schema (metadata for each doc type)
- Knowledge graph structure (how nodes relate)
- Wikilink patterns (cross-reference conventions)

---

## Available Templates

| Template ID | Application Type | Complexity | Use Cases |
|------------|------------------|------------|-----------|
| `typescript-node` | TypeScript/Node.js | Moderate | Express APIs, CLI tools, libraries |
| `nextjs-react` | Next.js/React | Moderate | Web apps, SaaS products |
| `python-app` | Python | Moderate | FastAPI, Flask, Django services |
| `monorepo` | Monorepo | Complex | Microservices, multi-package projects |
| `generic` | Generic | Simple | Any project type, custom setup |

---

## Template Files

Each template is defined by these files:

### 1. Template Specification (`template.yaml`)
Defines structure, metadata, and configuration

### 2. Directory Tree (`directory-tree.txt`)
Visual representation of folder structure

### 3. Document Templates (`documents/*.md`)
Markdown templates with placeholders for generated documents

### 4. Example Output (`examples/`)
Sample generated vault for reference

### 5. Knowledge Graph Schema (`knowledge-graph.yaml`)
Node types, relationships, and connection patterns

---

## Using Templates

### CLI Command (Future)
```bash
weave-nn init --template typescript-node --name "my-api-project"
```

### Programmatic API (Future)
```typescript
import { VaultInitializer } from '@weave-nn/vault-init';

const initializer = new VaultInitializer();
await initializer.createVault({
  template: 'typescript-node',
  projectName: 'my-api-project',
  outputPath: './my-api-vault',
  options: {
    includeGitIgnore: true,
    initializeGit: true,
    createReadme: true
  }
});
```

---

## Template Customization

Templates support customization through:

1. **Variables**: Replace placeholders in documents
2. **Conditional Sections**: Include/exclude sections based on options
3. **Extension Hooks**: Add custom post-generation steps
4. **Override Files**: Replace default documents with custom versions

Example variables:
- `{{PROJECT_NAME}}` - Project name
- `{{PROJECT_DESCRIPTION}}` - Brief description
- `{{AUTHOR}}` - Project author/owner
- `{{TECH_STACK}}` - Primary technologies
- `{{CREATED_DATE}}` - Current date (YYYY-MM-DD)

---

## Template Development

### Creating a New Template

1. **Create template directory**: `/config/vault-templates/your-template/`
2. **Define specification**: Create `template.yaml`
3. **Create directory tree**: Define folder structure
4. **Create document templates**: Add markdown templates
5. **Define knowledge graph**: Specify node relationships
6. **Generate example**: Create sample output
7. **Test template**: Verify generation works correctly

### Template Structure
```
config/vault-templates/
├── README.md                      # This file
├── template-schema.yaml           # JSON schema for template.yaml
├── typescript-node/
│   ├── template.yaml              # Template specification
│   ├── directory-tree.txt         # Folder structure
│   ├── documents/                 # Document templates
│   │   ├── README.md
│   │   ├── architecture.md
│   │   ├── technical-stack.md
│   │   └── ...
│   ├── knowledge-graph.yaml       # Graph structure
│   └── examples/                  # Sample outputs
│       └── express-api-vault/
├── nextjs-react/
├── python-app/
├── monorepo/
└── generic/
```

---

## Validation

Templates are validated against:

1. **Schema Compliance**: `template.yaml` matches `template-schema.yaml`
2. **Required Files**: All mandatory documents exist
3. **Valid Frontmatter**: YAML frontmatter is parseable and complete
4. **Wikilink Integrity**: All wikilinks reference valid documents
5. **Directory Structure**: Folders match specification

---

## Template Metadata

### Required Fields
- `id`: Unique template identifier (kebab-case)
- `name`: Human-readable template name
- `description`: Brief description of template purpose
- `version`: Semantic version (e.g., "1.0.0")
- `author`: Template creator
- `tags`: Array of categorization tags
- `application_types`: Types of applications this template supports
- `complexity`: Template complexity level
- `directory_structure`: List of directories to create
- `required_documents`: List of documents to generate
- `optional_documents`: Documents that can be included optionally
- `knowledge_graph`: Graph structure definition

### Optional Fields
- `variables`: Custom variables for template substitution
- `conditional_sections`: Conditional content rules
- `hooks`: Post-generation scripts to run
- `dependencies`: External dependencies required
- `examples`: URLs or paths to example projects

---

## Integration Points

### 1. Weaver MCP Server
MCP tool: `initialize_vault_from_template`
```json
{
  "name": "initialize_vault_from_template",
  "description": "Initialize new vault from template",
  "inputSchema": {
    "type": "object",
    "properties": {
      "template_id": { "type": "string" },
      "project_name": { "type": "string" },
      "output_path": { "type": "string" },
      "options": { "type": "object" }
    }
  }
}
```

### 2. Obsidian Plugin (Future)
Command palette: "Weave-NN: Initialize from Template"

### 3. CLI Tool (Future)
`weave-nn init` command

### 4. Web UI (Future)
Project creation wizard

---

## Best Practices

### Template Design
1. **Start Minimal**: Include only essential documents
2. **Progressive Enhancement**: Allow optional additions
3. **Clear Examples**: Provide comprehensive examples
4. **Consistent Naming**: Follow vault naming conventions
5. **Complete Frontmatter**: All required metadata fields
6. **Rich Connections**: Create meaningful wikilinks
7. **Documentation**: Explain template purpose and usage

### Document Generation
1. **Placeholder Clarity**: Use obvious placeholder syntax
2. **Sensible Defaults**: Provide default values where possible
3. **Validation**: Validate generated content
4. **Post-Processing**: Clean up formatting
5. **Error Handling**: Gracefully handle generation failures

---

## Template Roadmap

### v1.0 (Current)
- [x] Define template system architecture
- [x] Create template schema
- [ ] Implement 5 core templates
- [ ] Create example outputs
- [ ] Document template system

### v1.1 (Next)
- [ ] Template validation CLI
- [ ] Template generation API
- [ ] Web-based template editor
- [ ] Community template repository

### v2.0 (Future)
- [ ] AI-powered template suggestions
- [ ] Dynamic template generation from existing vaults
- [ ] Template inheritance and composition
- [ ] Multi-language support

---

## Related Documentation

### Templates
- [[typescript-node/README|TypeScript/Node.js Template]]
- [[nextjs-react/README|Next.js/React Template]]
- [[python-app/README|Python Application Template]]
- [[monorepo/README|Monorepo Template]]
- [[generic/README|Generic Template]]

### Planning
- [[../../_planning/phases/phase-6-tasks|Phase 6 Tasks]] - Vault initialization implementation

### Technical
- [[../../architecture/components/vault-initializer|Vault Initializer Component]]
- [[../../mcp/vault-initialization-tools|MCP Vault Initialization Tools]]

---

**Created**: 2025-10-23
**Last Updated**: 2025-10-23
**Status**: Active Development
**Owner**: Weaver MCP Team
