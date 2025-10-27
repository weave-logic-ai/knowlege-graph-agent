# Vault Template System

The template system provides a flexible, extensible way to generate vault structures for different project types.

## Architecture

### Core Components

1. **TemplateLoader** (`template-loader.ts`)
   - Central registry for all templates
   - Handlebars template compilation
   - Custom helper functions
   - Template validation using Zod

2. **Template Types** (`types.ts`)
   - Zod schemas for validation
   - TypeScript interfaces
   - Template context types

3. **Built-in Templates**
   - **Next.js App Router** (`nextjs-template.ts`)
   - **React with Vite** (`react-template.ts`)

## Template Structure

Each template includes:

```typescript
interface VaultTemplate {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  framework: string;             // Framework type
  version: string;               // Template version
  description: string;           // Template description
  directories: DirectoryStructure;  // Folder structure
  nodeTemplates: Map<string, NodeTemplate>;  // Node templates
  metadata?: {
    author?: string;
    tags?: string[];
    dependencies?: string[];
  };
}
```

## Node Templates

Node templates define how to generate markdown files:

```typescript
interface NodeTemplate {
  type: 'concept' | 'technical' | 'feature';
  frontmatter: Record<string, any>;
  contentTemplate: string;  // Handlebars template
  description?: string;
}
```

## Next.js Template

Includes templates for:
- **Components** - React components (Server/Client)
- **API Routes** - Next.js route handlers
- **Pages** - App Router pages
- **Hooks** - Custom React hooks
- **Concepts** - Architectural patterns

Directory structure:
```
concepts/
  app-router/
  server-components/
  data-fetching/
  routing/
technical/
  components/
  api-routes/
  middleware/
  database/
  auth/
features/
  user-management/
  dashboard/
  settings/
```

## React Template

Includes templates for:
- **Components** - React components
- **Hooks** - Custom hooks
- **Contexts** - Context providers
- **Services** - API services
- **Concepts** - React patterns

Directory structure:
```
concepts/
  component-patterns/
  state-management/
  routing/
  performance/
technical/
  components/
  hooks/
  contexts/
  utils/
  services/
features/
  authentication/
  dashboard/
  forms/
```

## Usage Examples

### 1. Load a Template

```typescript
import { templateLoader } from './vault-init/templates';

// Get a specific template
const template = templateLoader.getTemplate('nextjs-app-router');

// List all templates
const all = templateLoader.listTemplates();

// Find by framework
const nextjsTemplates = templateLoader.findByFramework('nextjs');
```

### 2. Render a Node Template

```typescript
const context = {
  projectName: 'MyApp',
  framework: 'nextjs',
  nodeName: 'Button',
  nodeType: 'component',
  timestamp: new Date().toISOString(),
};

const content = templateLoader.renderNodeTemplate(
  'nextjs-app-router',
  'component',
  context
);

// Output: Markdown content with all context variables filled in
```

### 3. Create Custom Template

```typescript
const customTemplate = {
  id: 'custom-vue',
  name: 'Vue 3 Template',
  framework: 'vue',
  version: '1.0.0',
  description: 'Vue 3 with Composition API',
  directories: {
    components: { description: 'Vue components' },
  },
  nodeTemplates: new Map([
    ['component', {
      type: 'technical',
      frontmatter: { type: 'component' },
      contentTemplate: '# {{nodeName}}\n\nVue component template',
    }],
  ]),
};

templateLoader.registerTemplate(customTemplate);
```

### 4. Extend Existing Template

```typescript
const extended = templateLoader.extendTemplate(
  'nextjs-app-router',
  'custom-nextjs',
  {
    name: 'Custom Next.js',
    description: 'Extended with additional templates',
    nodeTemplates: new Map([
      ['custom-node', {
        type: 'technical',
        frontmatter: {},
        contentTemplate: '# Custom template',
      }],
    ]),
  }
);
```

## Handlebars Helpers

The template system includes custom helpers:

### Built-in Helpers

- `{{#if condition}}...{{/if}}` - Conditional rendering
- `{{#unless condition}}...{{/unless}}` - Inverse conditional
- `{{#each array}}...{{/each}}` - Iteration

### Custom Helpers

- `{{uppercase string}}` - Convert to uppercase
- `{{lowercase string}}` - Convert to lowercase
- `{{pascalCase string}}` - Convert to PascalCase
- `{{camelCase string}}` - Convert to camelCase
- `{{formatDate date}}` - Format date string
- `{{ifEquals arg1 arg2}}...{{/ifEquals}}` - Equality check

### Example Usage

```handlebars
# {{pascalCase nodeName}}

## Description
{{#if description}}
{{description}}
{{else}}
Default description for {{projectName}}
{{/if}}

## Created
{{formatDate timestamp}}

## Type
{{uppercase nodeType}}
```

## Validation

Templates are validated using Zod schemas:

```typescript
const validation = templateLoader.validateTemplate(template);

if (!validation.valid) {
  console.error('Errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

## Template Context

When rendering templates, provide this context:

```typescript
interface TemplateContext {
  projectName: string;   // Required
  framework: string;     // Required
  nodeName: string;      // Required
  nodeType: string;      // Required
  timestamp: string;     // Auto-generated if not provided
  author?: string;       // Optional
  [key: string]: any;    // Custom variables
}
```

## Statistics

Get template system statistics:

```typescript
const stats = templateLoader.getStats();
// {
//   totalTemplates: 2,
//   frameworks: ['nextjs', 'react'],
//   totalNodeTemplates: 10,
//   compiledTemplates: 10
// }
```

## Testing

All templates include comprehensive tests:

```bash
bun test tests/vault-init/templates.test.ts
```

Test coverage includes:
- Template registration and validation
- Template retrieval and search
- Node template operations
- Template rendering with various contexts
- Handlebars helper functions
- Template extension and management
- Zod schema validation

## Best Practices

1. **Template Design**
   - Keep templates simple and focused
   - Use descriptive variable names
   - Include helpful comments
   - Provide default values where appropriate

2. **Validation**
   - Always validate custom templates
   - Check for warnings
   - Test with various contexts

3. **Extensibility**
   - Extend existing templates rather than duplicating
   - Use consistent naming conventions
   - Document custom variables

4. **Performance**
   - Templates are pre-compiled for efficiency
   - Use singleton `templateLoader` instance
   - Cache rendered results when possible

## Future Enhancements

Potential additions:
- Vue.js template
- Angular template
- Svelte template
- Custom template wizard
- Template marketplace
- AI-powered template generation
- Template versioning
- Template migration tools
