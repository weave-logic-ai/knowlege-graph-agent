/**
 * Code Complexity Metrics Calculator
 *
 * Implements complexity metric calculations:
 * - Cyclomatic Complexity (McCabe)
 * - Cognitive Complexity (SonarSource)
 * - Maintainability Index
 *
 * @module plugins/analyzers/code-complexity/metrics
 */

import type { TSESTree } from '@typescript-eslint/typescript-estree';
import type {
  ComplexityScore,
  ComplexityThresholds,
  ComplexityLevel,
  FileComplexityScore,
  HalsteadMetrics,
  DEFAULT_THRESHOLDS,
} from './types.js';
import { EMPTY_HALSTEAD_METRICS } from './types.js';

// ============================================================================
// Cyclomatic Complexity Calculator
// ============================================================================

/**
 * Node types that contribute to cyclomatic complexity
 */
const CYCLOMATIC_NODES = new Set([
  'IfStatement',
  'ConditionalExpression',
  'SwitchCase',
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
  'CatchClause',
  'LogicalExpression', // && and || add branching paths
]);

/**
 * Calculate cyclomatic complexity for an AST node
 *
 * Cyclomatic complexity = E - N + 2P
 * Simplified: Count decision points + 1
 */
export function calculateCyclomaticComplexity(node: TSESTree.Node): number {
  let complexity = 1; // Base complexity

  function traverse(current: TSESTree.Node): void {
    if (CYCLOMATIC_NODES.has(current.type)) {
      // Special handling for switch cases - only count non-default cases
      if (current.type === 'SwitchCase') {
        const switchCase = current as TSESTree.SwitchCase;
        if (switchCase.test !== null) {
          complexity++;
        }
      }
      // Logical expressions add complexity for each operator
      else if (current.type === 'LogicalExpression') {
        const logical = current as TSESTree.LogicalExpression;
        if (logical.operator === '&&' || logical.operator === '||') {
          complexity++;
        }
      }
      // All other decision nodes
      else {
        complexity++;
      }
    }

    // Traverse child nodes
    for (const key of Object.keys(current)) {
      const child = (current as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object' && 'type' in item) {
              traverse(item as TSESTree.Node);
            }
          }
        } else if ('type' in child) {
          traverse(child as TSESTree.Node);
        }
      }
    }
  }

  traverse(node);
  return complexity;
}

// ============================================================================
// Cognitive Complexity Calculator
// ============================================================================

/**
 * Calculate cognitive complexity for an AST node
 *
 * Based on SonarSource's cognitive complexity:
 * - Increments for breaks in linear flow
 * - Nesting increases increment value
 * - Recursion and logical operators add complexity
 */
export function calculateCognitiveComplexity(node: TSESTree.Node): number {
  let complexity = 0;

  function traverse(current: TSESTree.Node, nestingLevel: number): void {
    const increment = nestingLevel + 1;

    switch (current.type) {
      // Control flow structures - add base + nesting
      case 'IfStatement':
      case 'ConditionalExpression':
        complexity += increment;
        // Check for else if chain (doesn't add nesting)
        if (current.type === 'IfStatement') {
          const ifStmt = current as TSESTree.IfStatement;
          traverseChildren(ifStmt.test, nestingLevel);
          traverseChildren(ifStmt.consequent, nestingLevel + 1);
          if (ifStmt.alternate) {
            if (ifStmt.alternate.type === 'IfStatement') {
              // else if - no nesting increase
              complexity += 1;
              traverse(ifStmt.alternate, nestingLevel);
            } else {
              complexity += 1; // else
              traverseChildren(ifStmt.alternate, nestingLevel + 1);
            }
          }
          return; // Already handled children
        }
        break;

      case 'SwitchStatement':
        complexity += increment;
        break;

      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
        complexity += increment;
        break;

      case 'CatchClause':
        complexity += increment;
        break;

      // Logical operators - flat increment
      case 'LogicalExpression': {
        const logical = current as TSESTree.LogicalExpression;
        if (logical.operator === '&&' || logical.operator === '||' || logical.operator === '??') {
          complexity += 1;
        }
        break;
      }

      // Break/continue with label - extra complexity
      case 'BreakStatement':
      case 'ContinueStatement': {
        const stmt = current as TSESTree.BreakStatement | TSESTree.ContinueStatement;
        if (stmt.label) {
          complexity += 1;
        }
        break;
      }

      // Recursion detection would go here
      // For now, we track call expressions within same function

      default:
        break;
    }

    // Determine if this node increases nesting
    const increasesNesting =
      current.type === 'IfStatement' ||
      current.type === 'SwitchStatement' ||
      current.type === 'ForStatement' ||
      current.type === 'ForInStatement' ||
      current.type === 'ForOfStatement' ||
      current.type === 'WhileStatement' ||
      current.type === 'DoWhileStatement' ||
      current.type === 'CatchClause' ||
      current.type === 'ConditionalExpression';

    const newNesting = increasesNesting ? nestingLevel + 1 : nestingLevel;
    traverseChildren(current, newNesting);
  }

  function traverseChildren(current: TSESTree.Node, nestingLevel: number): void {
    for (const key of Object.keys(current)) {
      if (key === 'parent') continue; // Skip parent reference
      const child = (current as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object' && 'type' in item) {
              traverse(item as TSESTree.Node, nestingLevel);
            }
          }
        } else if ('type' in child) {
          traverse(child as TSESTree.Node, nestingLevel);
        }
      }
    }
  }

  traverse(node, 0);
  return complexity;
}

// ============================================================================
// Nesting Depth Calculator
// ============================================================================

/**
 * Calculate maximum nesting depth
 */
export function calculateMaxNestingDepth(node: TSESTree.Node): number {
  let maxDepth = 0;

  function traverse(current: TSESTree.Node, depth: number): void {
    maxDepth = Math.max(maxDepth, depth);

    // Nodes that increase nesting
    const nestingNodes = new Set([
      'IfStatement',
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'WhileStatement',
      'DoWhileStatement',
      'SwitchStatement',
      'TryStatement',
      'FunctionDeclaration',
      'FunctionExpression',
      'ArrowFunctionExpression',
      'ClassDeclaration',
      'ClassExpression',
    ]);

    const newDepth = nestingNodes.has(current.type) ? depth + 1 : depth;

    for (const key of Object.keys(current)) {
      if (key === 'parent') continue;
      const child = (current as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object' && 'type' in item) {
              traverse(item as TSESTree.Node, newDepth);
            }
          }
        } else if ('type' in child) {
          traverse(child as TSESTree.Node, newDepth);
        }
      }
    }
  }

  traverse(node, 0);
  return maxDepth;
}

// ============================================================================
// Lines of Code Calculator
// ============================================================================

/**
 * Calculate lines of code metrics
 */
export function calculateLinesOfCode(
  sourceCode: string,
  startLine: number,
  endLine: number
): { loc: number; totalLines: number } {
  const lines = sourceCode.split('\n').slice(startLine - 1, endLine);
  const totalLines = lines.length;

  // Count non-empty, non-comment lines
  let loc = 0;
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Handle block comments
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    // Skip empty lines and single-line comments
    if (trimmed === '' || trimmed.startsWith('//')) {
      continue;
    }

    loc++;
  }

  return { loc, totalLines };
}

// ============================================================================
// Return Statement Counter
// ============================================================================

/**
 * Count return statements in a function
 */
export function countReturnStatements(node: TSESTree.Node): number {
  let count = 0;

  function traverse(current: TSESTree.Node): void {
    if (current.type === 'ReturnStatement') {
      count++;
    }

    // Don't traverse into nested functions
    if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression'
    ) {
      if (current !== node) return;
    }

    for (const key of Object.keys(current)) {
      if (key === 'parent') continue;
      const child = (current as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object' && 'type' in item) {
              traverse(item as TSESTree.Node);
            }
          }
        } else if ('type' in child) {
          traverse(child as TSESTree.Node);
        }
      }
    }
  }

  traverse(node);
  return count;
}

// ============================================================================
// Maintainability Index Calculator
// ============================================================================

/**
 * Calculate maintainability index (Microsoft variant)
 *
 * MI = MAX(0, (171 - 5.2 * ln(Halstead Volume) - 0.23 * Cyclomatic - 16.2 * ln(LOC)) * 100 / 171)
 *
 * Simplified version using available metrics
 */
export function calculateMaintainabilityIndex(
  cyclomatic: number,
  loc: number,
  cognitive: number
): number {
  if (loc === 0) return 100;

  // Simplified calculation without Halstead volume
  // Uses cognitive complexity as a proxy for code understanding difficulty
  const lnLoc = Math.log(Math.max(1, loc));
  const lnCognitive = Math.log(Math.max(1, cognitive));

  // Base MI calculation (adapted)
  const mi = 171 - 0.23 * cyclomatic - 16.2 * lnLoc - 5.2 * lnCognitive;

  // Normalize to 0-100 scale
  const normalizedMI = Math.max(0, (mi * 100) / 171);

  return Math.round(normalizedMI * 100) / 100;
}

// ============================================================================
// Halstead Metrics Calculator
// ============================================================================

/**
 * Operators in JavaScript/TypeScript that contribute to Halstead metrics
 */
const HALSTEAD_OPERATORS = new Set([
  // Arithmetic
  '+', '-', '*', '/', '%', '**',
  // Assignment
  '=', '+=', '-=', '*=', '/=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>=', '>>>=', '&&=', '||=', '??=',
  // Comparison
  '==', '===', '!=', '!==', '<', '>', '<=', '>=',
  // Logical
  '&&', '||', '!', '??',
  // Bitwise
  '&', '|', '^', '~', '<<', '>>', '>>>',
  // Unary
  '++', '--', 'typeof', 'void', 'delete', 'await',
  // Ternary
  '?', ':',
  // Member access
  '.', '?.', '[', ']',
  // Function/control
  '(', ')', '{', '}', ',', ';',
  'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
  'try', 'catch', 'finally', 'throw', 'new', 'class', 'extends', 'import', 'export', 'const', 'let', 'var',
  'async', 'yield', '=>',
]);

/**
 * Calculate Halstead metrics from an AST node
 *
 * @param node - AST node to analyze
 * @returns Halstead metrics
 */
export function calculateHalsteadMetrics(node: TSESTree.Node): HalsteadMetrics {
  const operators = new Map<string, number>();
  const operands = new Map<string, number>();

  function addOperator(op: string): void {
    operators.set(op, (operators.get(op) || 0) + 1);
  }

  function addOperand(op: string): void {
    operands.set(op, (operands.get(op) || 0) + 1);
  }

  function traverse(current: TSESTree.Node): void {
    switch (current.type) {
      // Operators from expressions
      case 'BinaryExpression':
      case 'LogicalExpression':
      case 'AssignmentExpression': {
        const expr = current as TSESTree.BinaryExpression | TSESTree.LogicalExpression | TSESTree.AssignmentExpression;
        addOperator(expr.operator);
        break;
      }

      case 'UnaryExpression':
      case 'UpdateExpression': {
        const expr = current as TSESTree.UnaryExpression | TSESTree.UpdateExpression;
        addOperator(expr.operator);
        break;
      }

      case 'ConditionalExpression':
        addOperator('?:');
        break;

      case 'MemberExpression': {
        const expr = current as TSESTree.MemberExpression;
        addOperator(expr.optional ? '?.' : '.');
        break;
      }

      case 'CallExpression':
        addOperator('()');
        break;

      case 'NewExpression':
        addOperator('new');
        break;

      case 'ArrowFunctionExpression':
        addOperator('=>');
        break;

      case 'FunctionDeclaration':
      case 'FunctionExpression':
        addOperator('function');
        break;

      case 'AwaitExpression':
        addOperator('await');
        break;

      case 'YieldExpression':
        addOperator('yield');
        break;

      // Control flow operators
      case 'IfStatement':
        addOperator('if');
        break;

      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement':
        addOperator('for');
        break;

      case 'WhileStatement':
        addOperator('while');
        break;

      case 'DoWhileStatement':
        addOperator('do');
        addOperator('while');
        break;

      case 'SwitchStatement':
        addOperator('switch');
        break;

      case 'SwitchCase': {
        const switchCase = current as TSESTree.SwitchCase;
        addOperator(switchCase.test ? 'case' : 'default');
        break;
      }

      case 'TryStatement':
        addOperator('try');
        break;

      case 'CatchClause':
        addOperator('catch');
        break;

      case 'ThrowStatement':
        addOperator('throw');
        break;

      case 'ReturnStatement':
        addOperator('return');
        break;

      case 'BreakStatement':
        addOperator('break');
        break;

      case 'ContinueStatement':
        addOperator('continue');
        break;

      // Operands
      case 'Identifier': {
        const id = current as TSESTree.Identifier;
        addOperand(id.name);
        break;
      }

      case 'Literal': {
        const lit = current as TSESTree.Literal;
        addOperand(String(lit.value));
        break;
      }

      case 'TemplateLiteral':
        addOperand('template');
        break;

      default:
        break;
    }

    // Traverse children
    for (const key of Object.keys(current)) {
      if (key === 'parent') continue;
      const child = (current as unknown as Record<string, unknown>)[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object' && 'type' in item) {
              traverse(item as TSESTree.Node);
            }
          }
        } else if ('type' in child) {
          traverse(child as TSESTree.Node);
        }
      }
    }
  }

  traverse(node);

  // Calculate derived metrics
  const n1 = operators.size;  // distinct operators
  const n2 = operands.size;   // distinct operands
  const N1 = Array.from(operators.values()).reduce((a, b) => a + b, 0); // total operators
  const N2 = Array.from(operands.values()).reduce((a, b) => a + b, 0);  // total operands

  // Avoid division by zero
  if (n1 === 0 || n2 === 0) {
    return { ...EMPTY_HALSTEAD_METRICS };
  }

  const vocabulary = n1 + n2;
  const length = N1 + N2;
  const calculatedLength = n1 * Math.log2(n1) + n2 * Math.log2(n2);
  const volume = length * Math.log2(vocabulary);
  const difficulty = (n1 / 2) * (N2 / n2);
  const effort = difficulty * volume;
  const time = effort / 18;  // Halstead's constant for mental effort
  const bugs = volume / 3000; // Halstead's bug estimation formula

  return {
    distinctOperators: n1,
    distinctOperands: n2,
    totalOperators: N1,
    totalOperands: N2,
    vocabulary: Math.round(vocabulary * 100) / 100,
    length: Math.round(length * 100) / 100,
    calculatedLength: Math.round(calculatedLength * 100) / 100,
    volume: Math.round(volume * 100) / 100,
    difficulty: Math.round(difficulty * 100) / 100,
    effort: Math.round(effort * 100) / 100,
    time: Math.round(time * 100) / 100,
    bugs: Math.round(bugs * 1000) / 1000,
  };
}

// ============================================================================
// Complexity Level Classification
// ============================================================================

/**
 * Classify complexity level based on scores and thresholds
 */
export function classifyComplexityLevel(
  complexity: ComplexityScore,
  thresholds: ComplexityThresholds
): ComplexityLevel {
  // Check for critical levels first
  if (
    complexity.cyclomatic >= thresholds.cyclomaticCritical ||
    complexity.cognitive >= thresholds.cognitiveCritical
  ) {
    return 'critical';
  }

  // Check for high levels
  if (
    complexity.cyclomatic >= thresholds.cyclomaticHigh ||
    complexity.cognitive >= thresholds.cognitiveHigh ||
    complexity.maxNestingDepth > thresholds.maxNestingDepth
  ) {
    return 'high';
  }

  // Check for moderate levels
  if (
    complexity.cyclomatic >= thresholds.cyclomaticHigh / 2 ||
    complexity.cognitive >= thresholds.cognitiveHigh / 2 ||
    complexity.maxNestingDepth > thresholds.maxNestingDepth - 1
  ) {
    return 'moderate';
  }

  return 'low';
}

// ============================================================================
// Aggregation Functions
// ============================================================================

/**
 * Aggregate file complexity from individual function complexities
 */
export function aggregateFileComplexity(
  functions: Array<{ complexity: ComplexityScore }>,
  totalLoc: number,
  totalLines: number
): FileComplexityScore {
  if (functions.length === 0) {
    return {
      cyclomatic: 1,
      cognitive: 0,
      loc: totalLoc,
      totalLines,
      maxNestingDepth: 0,
      avgCyclomatic: 1,
      avgCognitive: 0,
      functionCount: 0,
      maintainabilityIndex: 100,
    };
  }

  const totalCyclomatic = functions.reduce((sum, f) => sum + f.complexity.cyclomatic, 0);
  const totalCognitive = functions.reduce((sum, f) => sum + f.complexity.cognitive, 0);
  const maxNesting = Math.max(...functions.map((f) => f.complexity.maxNestingDepth));

  const avgCyclomatic = totalCyclomatic / functions.length;
  const avgCognitive = totalCognitive / functions.length;
  const maintainabilityIndex = calculateMaintainabilityIndex(
    avgCyclomatic,
    totalLoc / Math.max(1, functions.length),
    avgCognitive
  );

  return {
    cyclomatic: totalCyclomatic,
    cognitive: totalCognitive,
    loc: totalLoc,
    totalLines,
    maxNestingDepth: maxNesting,
    avgCyclomatic: Math.round(avgCyclomatic * 100) / 100,
    avgCognitive: Math.round(avgCognitive * 100) / 100,
    functionCount: functions.length,
    maintainabilityIndex,
  };
}

// ============================================================================
// Issue Detection
// ============================================================================

/**
 * Detect complexity issues in a function
 */
export function detectComplexityIssues(
  complexity: ComplexityScore,
  thresholds: ComplexityThresholds,
  functionName: string
): string[] {
  const issues: string[] = [];

  if (complexity.cyclomatic >= thresholds.cyclomaticCritical) {
    issues.push(
      `Critical cyclomatic complexity (${complexity.cyclomatic}): ${functionName} has too many decision paths`
    );
  } else if (complexity.cyclomatic >= thresholds.cyclomaticHigh) {
    issues.push(
      `High cyclomatic complexity (${complexity.cyclomatic}): Consider breaking down ${functionName}`
    );
  }

  if (complexity.cognitive >= thresholds.cognitiveCritical) {
    issues.push(
      `Critical cognitive complexity (${complexity.cognitive}): ${functionName} is hard to understand`
    );
  } else if (complexity.cognitive >= thresholds.cognitiveHigh) {
    issues.push(
      `High cognitive complexity (${complexity.cognitive}): ${functionName} may be difficult to maintain`
    );
  }

  if (complexity.maxNestingDepth > thresholds.maxNestingDepth) {
    issues.push(
      `Deep nesting (${complexity.maxNestingDepth} levels): Consider extracting nested logic`
    );
  }

  if (complexity.loc > thresholds.maxFunctionLength) {
    issues.push(
      `Long function (${complexity.loc} LOC): Consider splitting into smaller functions`
    );
  }

  if (complexity.returnCount && complexity.returnCount > 5) {
    issues.push(
      `Multiple return points (${complexity.returnCount}): May indicate complex control flow`
    );
  }

  return issues;
}

/**
 * Generate recommendations for reducing complexity
 */
export function generateRecommendations(
  complexity: ComplexityScore,
  thresholds: ComplexityThresholds,
  level: ComplexityLevel
): string[] {
  const recommendations: string[] = [];

  if (level === 'low') {
    return recommendations;
  }

  if (complexity.cyclomatic >= thresholds.cyclomaticHigh) {
    recommendations.push('Extract conditional logic into separate helper functions');
    recommendations.push('Consider using early returns to reduce nesting');
    recommendations.push('Replace complex conditionals with polymorphism or strategy pattern');
  }

  if (complexity.cognitive >= thresholds.cognitiveHigh) {
    recommendations.push('Simplify nested structures by extracting inner logic');
    recommendations.push('Use descriptive variable names to improve readability');
    recommendations.push('Consider using guard clauses at function start');
  }

  if (complexity.maxNestingDepth > thresholds.maxNestingDepth) {
    recommendations.push('Flatten nested loops using functional programming patterns');
    recommendations.push('Extract deeply nested code blocks into separate functions');
    recommendations.push('Consider using async/await to flatten callback pyramids');
  }

  if (complexity.loc > thresholds.maxFunctionLength) {
    recommendations.push('Split function into smaller, focused helper functions');
    recommendations.push('Apply single responsibility principle');
    recommendations.push('Consider creating a class if function manages state');
  }

  return recommendations;
}
