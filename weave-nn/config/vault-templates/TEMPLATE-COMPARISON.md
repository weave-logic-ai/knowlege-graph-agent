---
type: documentation
category: templates
status: active
created_date: '2025-10-23'
tags:
  - templates
  - comparison
  - reference
visual:
  icon: 📚
  color: '#06B6D4'
  cssclasses:
    - type-documentation
    - status-active
version: '3.0'
updated_date: '2025-10-28'
icon: 📚
---

# Vault Template Comparison

**Quick reference guide for choosing the right vault template for your project.**

---

## Template Overview

| Template | Application Types | Complexity | Setup Time | Node Count | Best For |
|----------|------------------|------------|------------|------------|----------|
| **typescript-node** | API, CLI, Library | Moderate | 30-45 min | 20-40 | Express APIs, Node.js tools |
| **nextjs-react** | Web App, Fullstack | Moderate | 30-45 min | 25-50 | SaaS, marketing sites, web apps |
| **python-app** | API, Backend, CLI | Moderate | 30-45 min | 22-45 | FastAPI, Flask, Django services |
| **monorepo** | Microservices, Multi-service | Complex | 1-2 hours | 40-100 | Microservices, multi-package projects |
| **generic** | Any | Simple | 15-30 min | 15-35 | Custom projects, experiments |

---

## Detailed Comparison

### 1. TypeScript/Node.js Application

**Template ID**: `typescript-node`

**Use Cases**:
- Express REST APIs
- GraphQL servers
- CLI tools
- Node.js libraries
- Backend services

**Key Features**:
- TypeScript configuration docs
- Express.js framework docs
- API design specifications
- Testing with Jest
- CI/CD pipeline templates

**Directory Structure Highlights**:
- `technical/` - TypeScript, Node.js, Express docs
- `architecture/api-design.md` - REST API specifications
- `architecture/data-models.md` - Data schemas
- `workflows/testing-strategy.md` - Jest testing approach

**Knowledge Graph**:
- **Nodes**: 20-40 total
- **Connections**: 40-80
- **Clusters**: 4-6 (Technical, Architecture, Features, Workflows)
- **Avg Connections/Node**: 3-5

**Variables**:
- `PROJECT_NAME` (required)
- `PROJECT_DESCRIPTION` (required)
- `AUTHOR` (required)
- `PORT` (default: 3000)
- `API_VERSION` (default: v1)
- `INCLUDE_TESTING` (default: true)
- `INCLUDE_DATABASE` (optional)
- `INCLUDE_AUTH` (optional)

**Example Projects**:
- Express REST API
- CLI tool

---

### 2. Next.js/React Web Application

**Template ID**: `nextjs-react`

**Use Cases**:
- SaaS web applications
- Marketing websites
- Full-stack web apps
- E-commerce sites
- Content management systems

**Key Features**:
- Next.js and React documentation
- Component hierarchy design
- Page routing structure
- API routes (Next.js backend)
- State management patterns
- UI/UX design decisions

**Directory Structure Highlights**:
- `architecture/components/` - Component organization
- `architecture/pages/` - Page structure and routing
- `architecture/api-routes.md` - Next.js API endpoints
- `architecture/state-management.md` - Redux/Context patterns
- `features/ui/` - UI component features
- `decisions/design/` - Design and UX decisions

**Knowledge Graph**:
- **Nodes**: 25-50 total
- **Connections**: 60-120
- **Clusters**: 5-7 (Technical, Components, Pages, Features, Design)
- **Avg Connections/Node**: 3-6

**Variables**:
- `PROJECT_NAME` (required)
- `PROJECT_DESCRIPTION` (required)
- `AUTHOR` (required)
- `INCLUDE_AUTHENTICATION` (default: true)
- `INCLUDE_DATABASE` (default: true)

**Connection Patterns**:
- Component-to-page links
- Feature-to-component links
- Design decision impact tracking

---

### 3. Python Application

**Template ID**: `python-app`

**Use Cases**:
- FastAPI services
- Flask APIs
- Django applications
- Python CLI tools
- Data processing pipelines

**Key Features**:
- Python and framework documentation
- Module structure organization
- Database models (SQLAlchemy/Django ORM)
- API endpoint design
- pytest testing strategies
- Virtual environment setup

**Directory Structure Highlights**:
- `technical/fastapi.md` - FastAPI framework
- `technical/pydantic.md` - Data validation
- `architecture/modules/module-structure.md` - Python package organization
- `architecture/database-models.md` - ORM models
- `workflows/testing-with-pytest.md` - Testing approach

**Knowledge Graph**:
- **Nodes**: 22-45 total
- **Connections**: 45-90
- **Clusters**: 4-6 (Technical, Architecture, Features, Workflows)
- **Avg Connections/Node**: 3-5

**Variables**:
- `PROJECT_NAME` (required)
- `PROJECT_DESCRIPTION` (required)
- `AUTHOR` (required)
- `PYTHON_VERSION` (default: 3.11)
- `FRAMEWORK` (options: fastapi, flask, django; default: fastapi)

---

### 4. Monorepo/Multi-Service

**Template ID**: `monorepo`

**Use Cases**:
- Microservices architecture
- Multi-package monorepos
- Polyglot service ecosystems
- Large-scale applications
- Platform development

**Key Features**:
- Service mapping and relationships
- Inter-service communication patterns
- Shared package management
- API gateway configuration
- Message bus integration
- Service deployment strategies
- Cross-service feature tracking

**Directory Structure Highlights**:
- `services/` - Per-service documentation
- `packages/` - Shared package docs
- `architecture/service-map.md` - Service inventory
- `architecture/integration/` - Communication patterns
- `architecture/shared/` - Shared infrastructure
- `workflows/adding-new-service.md` - Service creation process
- `_planning/service-roadmap.md` - Service timeline

**Knowledge Graph**:
- **Nodes**: 40-100 total
- **Connections**: 100-250
- **Clusters**: 8-12 (Services, Packages, Integration, Infrastructure)
- **Avg Connections/Node**: 4-7

**Variables**:
- `PROJECT_NAME` (required)
- `PROJECT_DESCRIPTION` (required)
- `AUTHOR` (required)
- `SERVICE_COUNT` (default: 3, range: 2-20)
- `PACKAGE_COUNT` (default: 2, range: 1-10)
- `ORCHESTRATION` (options: docker-compose, kubernetes, nomad)

**Connection Patterns**:
- Service-to-service dependencies
- Service-to-package usage
- Integration-to-services connections
- Feature-to-services implementation

**Complexity Note**: This is the most complex template. Recommended only for projects with multiple services or packages.

---

### 5. Generic Application

**Template ID**: `generic`

**Use Cases**:
- Projects that don't fit other templates
- Experimental projects
- Custom application types
- Proof-of-concepts
- Learning projects

**Key Features**:
- Minimal structure
- Maximum flexibility
- User customization hooks
- Optional components
- Extensible design

**Directory Structure Highlights**:
- Basic folder structure (technical, architecture, features, etc.)
- Minimal required documents
- User-defined expansion points
- Optional API, database, testing docs

**Knowledge Graph**:
- **Nodes**: 15-35 total
- **Connections**: 30-70
- **Clusters**: 3-5 (Technical, Architecture, Features)
- **Avg Connections/Node**: 2-4

**Variables**:
- `PROJECT_NAME` (required)
- `PROJECT_DESCRIPTION` (required)
- `AUTHOR` (required)
- `PROJECT_TYPE` (optional)
- `PRIMARY_LANGUAGE` (optional)
- `INCLUDE_API` (default: false)
- `INCLUDE_DATABASE` (default: false)
- `INCLUDE_TESTING` (default: false)
- `INCLUDE_DEPLOYMENT` (default: false)

**Customization**: Start with minimal structure and add as needed.

---

## Decision Matrix

### Choose TypeScript/Node.js If:
- [x] Building REST/GraphQL API
- [x] Using Express, Fastify, or similar
- [x] TypeScript is primary language
- [x] Backend service or CLI tool
- [ ] Multiple services (use monorepo instead)

### Choose Next.js/React If:
- [x] Building web application
- [x] Need server-side rendering
- [x] React-based frontend
- [x] Full-stack web app with API routes
- [x] Component-driven architecture

### Choose Python If:
- [x] Python is primary language
- [x] Using FastAPI, Flask, or Django
- [x] Building backend service or API
- [x] Data processing or ML workloads
- [ ] Multiple services (use monorepo instead)

### Choose Monorepo If:
- [x] Multiple services or packages
- [x] Microservices architecture
- [x] Shared code across services
- [x] Complex inter-service dependencies
- [x] Large-scale application

### Choose Generic If:
- [x] None of the above fit
- [x] Experimental or learning project
- [x] Need custom structure
- [x] Want minimal starting point
- [x] Will heavily customize anyway

---

## Template Migration

### Can I Switch Templates Later?

**Yes, but it's easier to start with the right template.**

**Migration Difficulty**:
- **Easy**: Generic → Specific template (add structure)
- **Moderate**: TypeScript ↔ Python (similar structures)
- **Hard**: Single-service → Monorepo (restructure needed)
- **Very Hard**: Monorepo → Single-service (data loss risk)

**Migration Process**:
1. Export existing vault to backup
2. Create new vault from target template
3. Manually copy relevant documents
4. Update wikilinks
5. Regenerate knowledge graph

---

## Customization Guide

### All Templates Support:

1. **Variable Substitution**
   - Replace `{{PROJECT_NAME}}`, `{{AUTHOR}}`, etc.
   - Custom variables per template

2. **Conditional Sections**
   - Include/exclude optional documents
   - Based on boolean flags

3. **Extension Hooks**
   - Pre-generation validation
   - Post-generation cleanup
   - Custom processing scripts

4. **Directory Additions**
   - Add custom directories
   - Define custom document types
   - Extend knowledge graph

### Customization Examples:

**Add Custom Directory**:
```yaml
directory_structure:
  - path: "my-custom-dir"
    description: "My custom documentation"
    required: false
```

**Add Optional Document**:
```yaml
optional_documents:
  - path: "custom/my-doc.md"
    type: "documentation"
    description: "Custom document"
    condition: "options.includeCustom"
```

**Define Custom Variable**:
```yaml
variables:
  MY_CUSTOM_VAR:
    description: "Custom configuration"
    type: "string"
    default: "value"
```

---

## Template Validation

### All Templates Are Validated For:

1. **Schema Compliance**: Matches `template-schema.yaml`
2. **Required Files**: All mandatory documents exist
3. **Valid Frontmatter**: YAML is parseable and complete
4. **Wikilink Integrity**: All links reference valid documents
5. **Directory Structure**: Folders match specification

### Validation Command (Future):
```bash
weave-nn validate-template --template typescript-node
```

---

## Common Patterns Across Templates

### All Templates Include:

1. **README.md**: Project entry point
2. **concepts/project-overview.md**: High-level concept
3. **architecture/**: System design documents
4. **technical/**: Technology stack documentation
5. **features/**: Feature specifications
6. **decisions/**: Decision records (ADRs)
7. **workflows/**: Development processes
8. **_planning/**: Project planning and tasks
9. **templates/**: Obsidian note templates
10. **_files/**: Attachments and media

### Common Wikilink Patterns:

1. **Technical → Architecture**: Technologies used in system
2. **Features → Technical**: Features implemented with tools
3. **Workflows → Technical**: Processes requiring tools
4. **Decisions → Architecture**: Decisions affecting design
5. **Planning → Features**: Roadmap tracking features

---

## Template Maintenance

### Version History

All templates follow semantic versioning:
- **Major**: Breaking changes to structure
- **Minor**: New optional features
- **Patch**: Bug fixes, documentation updates

### Current Versions:
- typescript-node: v1.0.0
- nextjs-react: v1.0.0
- python-app: v1.0.0
- monorepo: v1.0.0
- generic: v1.0.0

### Updating Templates

Templates can be updated without affecting existing vaults.
New features are added as optional documents.

---





## Related

[[vault-templates-hub]]
## Related

[[templates-catalog-hub]]
## Related Documentation

- [[README|Template System Overview]]
- [[template-schema.yaml|Template Schema Definition]]
- [[typescript-node/template.yaml|TypeScript/Node.js Template]]
- [[nextjs-react/template.yaml|Next.js/React Template]]
- [[python-app/template.yaml|Python Application Template]]
- [[monorepo/template.yaml|Monorepo Template]]
- [[generic/template.yaml|Generic Template]]

---

**Last Updated**: 2025-10-23
**Status**: Active
**Maintained By**: Weave-NN Team
