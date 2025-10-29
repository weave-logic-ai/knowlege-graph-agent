/**
 * Example usage of the template system
 * This demonstrates how to use templates for vault initialization
 */

import { templateLoader, TemplateContext } from './index.js';

/**
 * Example 1: List all available templates
 */
export function listAvailableTemplates() {
  const templates = templateLoader.listTemplates();

  console.log('Available Templates:');
  templates.forEach((template) => {
    console.log(`- ${template.name} (${template.framework}) - ${template.description}`);
  });

  return templates;
}

/**
 * Example 2: Generate a Next.js component node
 */
export function generateNextJsComponent(componentName: string, projectName: string) {
  const context: TemplateContext = {
    projectName,
    framework: 'nextjs',
    nodeName: componentName,
    nodeType: 'component',
    timestamp: new Date().toISOString(),
    description: `A reusable ${componentName} component`,
  };

  const content = templateLoader.renderNodeTemplate(
    'nextjs-app-router',
    'component',
    context
  );

  return content;
}

/**
 * Example 3: Generate a Next.js API route
 */
export function generateApiRoute(
  routeName: string,
  method: string,
  path: string,
  projectName: string
) {
  const context: TemplateContext = {
    projectName,
    framework: 'nextjs',
    nodeName: routeName,
    nodeType: 'api-route',
    timestamp: new Date().toISOString(),
    method,
    path,
    description: `API endpoint for ${routeName}`,
  };

  const content = templateLoader.renderNodeTemplate(
    'nextjs-app-router',
    'api-route',
    context
  );

  return content;
}

/**
 * Example 4: Generate a React hook
 */
export function generateReactHook(hookName: string, projectName: string) {
  const context: TemplateContext = {
    projectName,
    framework: 'react',
    nodeName: hookName,
    nodeType: 'hook',
    timestamp: new Date().toISOString(),
    clientOnly: true,
    dependencies: 'useState, useEffect',
  };

  const content = templateLoader.renderNodeTemplate('react-vite', 'hook', context);

  return content;
}

/**
 * Example 5: Generate vault structure from template
 */
export function generateVaultStructure(templateId: string) {
  const template = templateLoader.getTemplate(templateId);

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const structure = {
    template: {
      id: template.id,
      name: template.name,
      framework: template.framework,
    },
    directories: template.directories,
    nodeTemplates: Array.from(template.nodeTemplates.keys()),
  };

  return structure;
}

/**
 * Example 6: Validate and use custom template
 */
export function createAndValidateCustomTemplate() {
  const customTemplate = {
    id: 'custom-example',
    name: 'Custom Example',
    framework: 'custom',
    version: '1.0.0',
    description: 'Example custom template',
    directories: {
      docs: {
        description: 'Documentation',
        children: {
          guides: 'User guides',
          api: 'API documentation',
        },
      },
    },
    nodeTemplates: new Map([
      [
        'document',
        {
          type: 'concept' as const,
          frontmatter: {
            type: 'document',
            status: 'draft',
          },
          contentTemplate: `# {{nodeName}}

## Overview
{{description}}

## Created
{{timestamp}}
`,
        },
      ],
    ]),
  };

  // Validate the template
  const validation = templateLoader.validateTemplate(customTemplate);

  if (!validation.valid) {
    console.error('Template validation failed:', validation.errors);
    return null;
  }

  if (validation.warnings.length > 0) {
    console.warn('Template warnings:', validation.warnings);
  }

  // Register the template
  templateLoader.registerTemplate(customTemplate);

  return customTemplate;
}

/**
 * Example 7: Extend existing template
 */
export function extendNextJsTemplate() {
  // Extend Next.js template with additional node templates
  const extended = templateLoader.extendTemplate(
    'nextjs-app-router',
    'nextjs-extended',
    {
      name: 'Extended Next.js',
      description: 'Next.js template with additional features',
      nodeTemplates: new Map([
        [
          'layout',
          {
            type: 'technical' as const,
            frontmatter: {
              type: 'layout',
              status: 'draft',
            },
            contentTemplate: `# {{nodeName}} Layout

## Description
Layout component for {{projectName}}

## Usage
\`\`\`tsx
export default function {{nodeName}}Layout({
  children
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>
}
\`\`\`

## Created
{{timestamp}}
`,
          },
        ],
      ]),
    }
  );

  return extended;
}

/**
 * Example 8: Search templates by framework
 */
export function findTemplatesByFramework(framework: string) {
  const templates = templateLoader.findByFramework(framework);

  console.log(`Templates for ${framework}:`);
  templates.forEach((template) => {
    console.log(`- ${template.name}: ${template.description}`);
    console.log(`  Node templates: ${template.nodeTemplates.size}`);
  });

  return templates;
}

/**
 * Example 9: Get template statistics
 */
export function getTemplateStats() {
  const stats = templateLoader.getStats();

  console.log('Template System Statistics:');
  console.log(`- Total templates: ${stats.totalTemplates}`);
  console.log(`- Frameworks: ${stats.frameworks.join(', ')}`);
  console.log(`- Total node templates: ${stats.totalNodeTemplates}`);
  console.log(`- Compiled templates: ${stats.compiledTemplates}`);

  return stats;
}

/**
 * Example 10: Batch generate multiple nodes
 */
export function batchGenerateNodes(
  templateId: string,
  nodeTemplateKey: string,
  nodes: Array<{ name: string; [key: string]: any }>,
  projectName: string
) {
  const results = nodes.map((node) => {
    const context: TemplateContext = {
      projectName,
      framework: templateLoader.getTemplate(templateId)?.framework || 'unknown',
      nodeName: node.name,
      nodeType: nodeTemplateKey,
      timestamp: new Date().toISOString(),
      ...node, // Spread additional properties
    };

    return {
      name: node.name,
      content: templateLoader.renderNodeTemplate(
        templateId,
        nodeTemplateKey,
        context
      ),
    };
  });

  return results;
}

// Demo function to run all examples
export function runExamples() {
  console.log('=== Template System Examples ===\n');

  console.log('1. List Templates:');
  listAvailableTemplates();
  console.log('\n');

  console.log('2. Generate Next.js Component:');
  const component = generateNextJsComponent('UserCard', 'MyApp');
  console.log(component.substring(0, 200) + '...\n');

  console.log('3. Generate API Route:');
  const apiRoute = generateApiRoute('Users', 'GET', '/api/users', 'MyApp');
  console.log(apiRoute.substring(0, 200) + '...\n');

  console.log('4. Generate React Hook:');
  const hook = generateReactHook('Counter', 'MyApp');
  console.log(hook.substring(0, 200) + '...\n');

  console.log('5. Vault Structure:');
  const structure = generateVaultStructure('nextjs-app-router');
  console.log(JSON.stringify(structure, null, 2).substring(0, 300) + '...\n');

  console.log('6. Template Statistics:');
  getTemplateStats();
  console.log('\n');

  console.log('7. Find by Framework:');
  findTemplatesByFramework('nextjs');
  console.log('\n');

  console.log('8. Batch Generate:');
  const batchResults = batchGenerateNodes(
    'nextjs-app-router',
    'component',
    [
      { name: 'Header', description: 'App header component' },
      { name: 'Footer', description: 'App footer component' },
    ],
    'MyApp'
  );
  console.log(`Generated ${batchResults.length} nodes\n`);
}
