/**
 * Test Data Generator
 *
 * Utilities for generating test fixtures and sample data
 */

import type { ReasoningStep, CoTReasoningResult } from '../../src/reasoning/types.js';
import type { ThoughtNode } from '../../src/reasoning/tree-of-thought.js';

/**
 * Generate reasoning steps for testing
 */
export function generateReasoningSteps(count: number): ReasoningStep[] {
  return Array.from({ length: count }, (_, i) => ({
    step: i + 1,
    description: `Step ${i + 1} description`,
    thought: `Reasoning thought for step ${i + 1}`,
    action: i % 2 === 0 ? `Action ${i + 1}` : undefined,
    observation: i % 3 === 0 ? `Observation ${i + 1}` : undefined,
    confidence: 0.7 + (Math.random() * 0.3),
  }));
}

/**
 * Generate CoT reasoning result for testing
 */
export function generateCoTResult(
  templateId: string = 'test-template',
  numSteps: number = 3
): CoTReasoningResult {
  return {
    templateId,
    strategy: 'chain-of-thought',
    steps: generateReasoningSteps(numSteps),
    finalAnswer: 'Test final answer',
    confidence: 0.85,
    metadata: {
      generated: true,
      timestamp: Date.now(),
    },
  };
}

/**
 * Generate thought node for ToT testing
 */
export function generateThoughtNode(
  id: string = 'node-1',
  depth: number = 0,
  branchingFactor: number = 3
): ThoughtNode {
  const node: ThoughtNode = {
    id,
    thought: `Thought for ${id}`,
    value: Math.random(),
    children: [],
  };

  if (depth > 0) {
    for (let i = 0; i < branchingFactor; i++) {
      const childId = `${id}-${i}`;
      const child = generateThoughtNode(childId, depth - 1, branchingFactor);
      child.parent = id;
      node.children.push(child);
    }
  }

  return node;
}

/**
 * Generate sample markdown content
 */
export function generateMarkdownContent(
  title: string = 'Test Document',
  sections: number = 3,
  paragraphsPerSection: number = 2
): string {
  let content = `# ${title}\n\n`;

  for (let i = 1; i <= sections; i++) {
    content += `## Section ${i}\n\n`;

    for (let j = 1; j <= paragraphsPerSection; j++) {
      content += `This is paragraph ${j} of section ${i}. `;
      content += `It contains some sample text for testing purposes. `;
      content += `Lorem ipsum dolor sit amet, consectetur adipiscing elit.\n\n`;
    }
  }

  content += `\n## Conclusion\n\nThis is the conclusion of the test document.\n`;

  return content;
}

/**
 * Generate code snippet for testing
 */
export function generateCodeSnippet(language: string = 'typescript'): string {
  const snippets: Record<string, string> = {
    typescript: `
export function calculateSum(numbers: number[]): number {
  return numbers.reduce((sum, num) => sum + num, 0);
}

export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return calculateSum(numbers) / numbers.length;
}
`,
    python: `
def calculate_sum(numbers):
    return sum(numbers)

def calculate_average(numbers):
    if len(numbers) == 0:
        return 0
    return calculate_sum(numbers) / len(numbers)
`,
    javascript: `
function calculateSum(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0);
}

function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  return calculateSum(numbers) / numbers.length;
}
`,
  };

  return snippets[language] || snippets.typescript;
}

/**
 * Generate test file structure
 */
export interface TestFile {
  path: string;
  content: string;
  type: 'markdown' | 'code' | 'json' | 'text';
}

export function generateTestFiles(count: number = 5): TestFile[] {
  const files: TestFile[] = [];

  for (let i = 1; i <= count; i++) {
    const types: TestFile['type'][] = ['markdown', 'code', 'json', 'text'];
    const type = types[i % types.length];

    let content: string;
    let extension: string;

    switch (type) {
      case 'markdown':
        content = generateMarkdownContent(`Document ${i}`, 2, 2);
        extension = 'md';
        break;
      case 'code':
        content = generateCodeSnippet('typescript');
        extension = 'ts';
        break;
      case 'json':
        content = JSON.stringify({ id: i, name: `Item ${i}`, data: {} }, null, 2);
        extension = 'json';
        break;
      default:
        content = `This is test file ${i}.\n`;
        extension = 'txt';
    }

    files.push({
      path: `/test/file-${i}.${extension}`,
      content,
      type,
    });
  }

  return files;
}

/**
 * Generate problem-solution pairs for testing
 */
export interface ProblemSolution {
  problem: string;
  solution: string;
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export function generateProblemSolutions(count: number = 5): ProblemSolution[] {
  const problems: ProblemSolution[] = [
    {
      problem: 'Calculate the sum of two numbers',
      solution: 'Add the numbers together',
      steps: ['Take first number', 'Take second number', 'Add them', 'Return result'],
      difficulty: 'easy',
    },
    {
      problem: 'Find the maximum element in an array',
      solution: 'Iterate through array tracking maximum',
      steps: ['Initialize max to first element', 'Iterate through array', 'Update max if current > max', 'Return max'],
      difficulty: 'easy',
    },
    {
      problem: 'Implement binary search',
      solution: 'Use divide and conquer approach',
      steps: ['Set left and right pointers', 'Calculate middle', 'Compare with target', 'Adjust pointers', 'Repeat or return'],
      difficulty: 'medium',
    },
    {
      problem: 'Design a distributed cache system',
      solution: 'Use consistent hashing with replication',
      steps: ['Choose hash function', 'Implement virtual nodes', 'Set up replication', 'Handle node failures', 'Implement eviction policy'],
      difficulty: 'hard',
    },
    {
      problem: 'Optimize database query performance',
      solution: 'Add indexes and optimize query structure',
      steps: ['Analyze query execution plan', 'Identify slow operations', 'Add appropriate indexes', 'Rewrite query if needed', 'Benchmark improvements'],
      difficulty: 'hard',
    },
  ];

  return problems.slice(0, Math.min(count, problems.length));
}

/**
 * Generate test variables for templates
 */
export function generateTemplateVariables(
  includeComplex: boolean = false
): Record<string, unknown> {
  const variables: Record<string, unknown> = {
    title: 'Test Title',
    description: 'Test description for template',
    author: 'Test Author',
    date: new Date().toISOString(),
    tags: ['test', 'example', 'mock'],
    priority: 'high',
    status: 'active',
  };

  if (includeComplex) {
    variables.metadata = {
      createdAt: Date.now(),
      version: '1.0.0',
      config: {
        enabled: true,
        maxRetries: 3,
      },
    };
    variables.items = [
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 200 },
    ];
  }

  return variables;
}

/**
 * Generate random text of specified length
 */
export function generateRandomText(words: number = 100): string {
  const lorem = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur',
    'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor',
    'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna',
    'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis',
  ];

  const text: string[] = [];
  for (let i = 0; i < words; i++) {
    text.push(lorem[i % lorem.length]);
  }

  return text.join(' ') + '.';
}
