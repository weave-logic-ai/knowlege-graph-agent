/**
 * Tests for Complexity Metrics Calculator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parse } from '@typescript-eslint/typescript-estree';
import {
  calculateCyclomaticComplexity,
  calculateCognitiveComplexity,
  calculateMaxNestingDepth,
  calculateLinesOfCode,
  countReturnStatements,
  calculateMaintainabilityIndex,
  classifyComplexityLevel,
  detectComplexityIssues,
  generateRecommendations,
  aggregateFileComplexity,
} from '../../../../src/plugins/analyzers/code-complexity/metrics.js';
import { DEFAULT_THRESHOLDS } from '../../../../src/plugins/analyzers/code-complexity/types.js';

// ============================================================================
// Test Utilities
// ============================================================================

function parseCode(code: string) {
  return parse(code, { loc: true, range: true });
}

function getFirstFunction(code: string) {
  const ast = parseCode(code);
  for (const node of ast.body) {
    if (node.type === 'FunctionDeclaration') {
      return node;
    }
  }
  throw new Error('No function found in code');
}

// ============================================================================
// Cyclomatic Complexity Tests
// ============================================================================

describe('calculateCyclomaticComplexity', () => {
  it('returns 1 for empty function', () => {
    const fn = getFirstFunction('function empty() {}');
    expect(calculateCyclomaticComplexity(fn)).toBe(1);
  });

  it('returns 1 for function with no branches', () => {
    const fn = getFirstFunction(`
      function linear() {
        const x = 1;
        const y = 2;
        return x + y;
      }
    `);
    expect(calculateCyclomaticComplexity(fn)).toBe(1);
  });

  it('adds 1 for each if statement', () => {
    const fn = getFirstFunction(`
      function withIf(x) {
        if (x > 0) {
          return 'positive';
        }
        return 'non-positive';
      }
    `);
    expect(calculateCyclomaticComplexity(fn)).toBe(2);
  });

  it('adds 1 for each else-if', () => {
    const fn = getFirstFunction(`
      function withElseIf(x) {
        if (x > 0) {
          return 'positive';
        } else if (x < 0) {
          return 'negative';
        } else {
          return 'zero';
        }
      }
    `);
    expect(calculateCyclomaticComplexity(fn)).toBe(3);
  });

  it('adds 1 for each for loop', () => {
    const fn = getFirstFunction(`
      function withLoop(arr) {
        for (let i = 0; i < arr.length; i++) {
          console.log(arr[i]);
        }
      }
    `);
    expect(calculateCyclomaticComplexity(fn)).toBe(2);
  });

  it('adds 1 for each while loop', () => {
    const fn = getFirstFunction(`
      function withWhile(x) {
        while (x > 0) {
          x--;
        }
      }
    `);
    expect(calculateCyclomaticComplexity(fn)).toBe(2);
  });

  it('adds 1 for each case in switch', () => {
    const fn = getFirstFunction(`
      function withSwitch(x) {
        switch(x) {
          case 1: return 'one';
          case 2: return 'two';
          default: return 'other';
        }
      }
    `);
    expect(calculateCyclomaticComplexity(fn)).toBe(3); // 1 + 2 cases
  });

  it('adds 1 for each catch clause', () => {
    const fn = getFirstFunction(`
      function withTryCatch() {
        try {
          throw new Error();
        } catch (e) {
          console.log(e);
        }
      }
    `);
    expect(calculateCyclomaticComplexity(fn)).toBe(2);
  });

  it('adds 1 for each && operator', () => {
    const fn = getFirstFunction(`
      function withAnd(a, b) {
        return a && b;
      }
    `);
    expect(calculateCyclomaticComplexity(fn)).toBe(2);
  });

  it('adds 1 for each || operator', () => {
    const fn = getFirstFunction(`
      function withOr(a, b) {
        return a || b;
      }
    `);
    expect(calculateCyclomaticComplexity(fn)).toBe(2);
  });

  it('adds 1 for ternary operator', () => {
    const fn = getFirstFunction(`
      function withTernary(x) {
        return x > 0 ? 'positive' : 'non-positive';
      }
    `);
    expect(calculateCyclomaticComplexity(fn)).toBe(2);
  });

  it('handles complex nested structures', () => {
    const fn = getFirstFunction(`
      function complex(arr) {
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] > 0) {
            if (arr[i] % 2 === 0) {
              console.log('positive even');
            } else {
              console.log('positive odd');
            }
          } else if (arr[i] < 0) {
            console.log('negative');
          } else {
            console.log('zero');
          }
        }
      }
    `);
    // 1 (base) + 1 (for) + 1 (if) + 1 (inner if) + 1 (else if) = 5
    expect(calculateCyclomaticComplexity(fn)).toBe(5);
  });
});

// ============================================================================
// Cognitive Complexity Tests
// ============================================================================

describe('calculateCognitiveComplexity', () => {
  it('returns 0 for empty function', () => {
    const fn = getFirstFunction('function empty() {}');
    expect(calculateCognitiveComplexity(fn)).toBe(0);
  });

  it('returns 0 for function with no control flow', () => {
    const fn = getFirstFunction(`
      function linear() {
        const x = 1;
        return x;
      }
    `);
    expect(calculateCognitiveComplexity(fn)).toBe(0);
  });

  it('adds 1 for each if statement', () => {
    const fn = getFirstFunction(`
      function withIf(x) {
        if (x > 0) {
          return x;
        }
        return 0;
      }
    `);
    expect(calculateCognitiveComplexity(fn)).toBe(1);
  });

  it('adds nesting penalty for nested if', () => {
    const fn = getFirstFunction(`
      function nestedIf(x, y) {
        if (x > 0) {
          if (y > 0) {
            return 'both positive';
          }
        }
        return 'not both positive';
      }
    `);
    // Outer if: +1, Inner if (nesting 1): +2
    expect(calculateCognitiveComplexity(fn)).toBeGreaterThanOrEqual(3);
  });

  it('adds 1 for each loop', () => {
    const fn = getFirstFunction(`
      function withLoop(arr) {
        for (const item of arr) {
          console.log(item);
        }
      }
    `);
    expect(calculateCognitiveComplexity(fn)).toBe(1);
  });

  it('adds 1 for logical operators', () => {
    const fn = getFirstFunction(`
      function withLogical(a, b, c) {
        return a && b || c;
      }
    `);
    // Two logical operators
    expect(calculateCognitiveComplexity(fn)).toBe(2);
  });
});

// ============================================================================
// Nesting Depth Tests
// ============================================================================

describe('calculateMaxNestingDepth', () => {
  it('returns 1 for empty function (function itself is counted)', () => {
    const fn = getFirstFunction('function empty() {}');
    // Function declaration itself adds 1 level
    expect(calculateMaxNestingDepth(fn)).toBe(1);
  });

  it('returns 2 for single level nesting', () => {
    const fn = getFirstFunction(`
      function singleLevel(x) {
        if (x) {
          return x;
        }
      }
    `);
    // Function (1) + if (1) = 2
    expect(calculateMaxNestingDepth(fn)).toBe(2);
  });

  it('returns correct depth for nested structures', () => {
    const fn = getFirstFunction(`
      function deepNesting(x) {
        if (x > 0) {
          for (let i = 0; i < x; i++) {
            while (i > 0) {
              if (i % 2 === 0) {
                console.log('deep');
              }
            }
          }
        }
      }
    `);
    // function (1) + if -> for -> while -> if = 5 levels
    expect(calculateMaxNestingDepth(fn)).toBe(5);
  });
});

// ============================================================================
// Lines of Code Tests
// ============================================================================

describe('calculateLinesOfCode', () => {
  it('counts non-empty non-comment lines', () => {
    const code = `function test() {
  // This is a comment
  const x = 1;

  /* Block comment */
  return x;
}`;
    const result = calculateLinesOfCode(code, 1, 7);
    expect(result.loc).toBe(4); // function, const, return, closing brace
    expect(result.totalLines).toBe(7);
  });

  it('handles block comments spanning multiple lines', () => {
    const code = `function test() {
  /*
   * Multi-line
   * comment
   */
  return 1;
}`;
    const result = calculateLinesOfCode(code, 1, 7);
    expect(result.loc).toBe(3); // function, return, closing brace
  });
});

// ============================================================================
// Return Statement Tests
// ============================================================================

describe('countReturnStatements', () => {
  it('counts zero for no returns', () => {
    const fn = getFirstFunction('function noReturn() { console.log("hi"); }');
    expect(countReturnStatements(fn)).toBe(0);
  });

  it('counts single return', () => {
    const fn = getFirstFunction('function singleReturn(x) { return x; }');
    expect(countReturnStatements(fn)).toBe(1);
  });

  it('counts multiple returns', () => {
    const fn = getFirstFunction(`
      function multiReturn(x) {
        if (x > 0) return 'positive';
        if (x < 0) return 'negative';
        return 'zero';
      }
    `);
    expect(countReturnStatements(fn)).toBe(3);
  });
});

// ============================================================================
// Maintainability Index Tests
// ============================================================================

describe('calculateMaintainabilityIndex', () => {
  it('returns 100 for empty code', () => {
    expect(calculateMaintainabilityIndex(1, 0, 0)).toBe(100);
  });

  it('returns high value for simple code', () => {
    const mi = calculateMaintainabilityIndex(1, 5, 0);
    expect(mi).toBeGreaterThan(80);
  });

  it('returns lower value for complex code', () => {
    const mi = calculateMaintainabilityIndex(20, 100, 25);
    expect(mi).toBeLessThan(50);
  });

  it('returns value between 0 and 100', () => {
    const mi = calculateMaintainabilityIndex(50, 1000, 100);
    expect(mi).toBeGreaterThanOrEqual(0);
    expect(mi).toBeLessThanOrEqual(100);
  });
});

// ============================================================================
// Complexity Level Classification Tests
// ============================================================================

describe('classifyComplexityLevel', () => {
  it('classifies low complexity correctly', () => {
    const score = { cyclomatic: 3, cognitive: 5, loc: 20, totalLines: 25, maxNestingDepth: 2 };
    expect(classifyComplexityLevel(score, DEFAULT_THRESHOLDS)).toBe('low');
  });

  it('classifies moderate complexity correctly', () => {
    const score = { cyclomatic: 7, cognitive: 10, loc: 40, totalLines: 50, maxNestingDepth: 3 };
    expect(classifyComplexityLevel(score, DEFAULT_THRESHOLDS)).toBe('moderate');
  });

  it('classifies high complexity correctly', () => {
    const score = { cyclomatic: 12, cognitive: 18, loc: 60, totalLines: 80, maxNestingDepth: 4 };
    expect(classifyComplexityLevel(score, DEFAULT_THRESHOLDS)).toBe('high');
  });

  it('classifies critical complexity correctly', () => {
    const score = { cyclomatic: 25, cognitive: 30, loc: 100, totalLines: 120, maxNestingDepth: 6 };
    expect(classifyComplexityLevel(score, DEFAULT_THRESHOLDS)).toBe('critical');
  });
});

// ============================================================================
// Issue Detection Tests
// ============================================================================

describe('detectComplexityIssues', () => {
  it('detects no issues for simple code', () => {
    const score = { cyclomatic: 3, cognitive: 5, loc: 20, totalLines: 25, maxNestingDepth: 2 };
    const issues = detectComplexityIssues(score, DEFAULT_THRESHOLDS, 'simpleFunc');
    expect(issues).toHaveLength(0);
  });

  it('detects high cyclomatic complexity', () => {
    const score = { cyclomatic: 15, cognitive: 5, loc: 20, totalLines: 25, maxNestingDepth: 2 };
    const issues = detectComplexityIssues(score, DEFAULT_THRESHOLDS, 'complexFunc');
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.includes('cyclomatic'))).toBe(true);
  });

  it('detects high cognitive complexity', () => {
    const score = { cyclomatic: 5, cognitive: 20, loc: 20, totalLines: 25, maxNestingDepth: 2 };
    const issues = detectComplexityIssues(score, DEFAULT_THRESHOLDS, 'cognitiveFunc');
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.includes('cognitive'))).toBe(true);
  });

  it('detects deep nesting', () => {
    const score = { cyclomatic: 5, cognitive: 5, loc: 20, totalLines: 25, maxNestingDepth: 6 };
    const issues = detectComplexityIssues(score, DEFAULT_THRESHOLDS, 'nestedFunc');
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.includes('nesting'))).toBe(true);
  });

  it('detects long functions', () => {
    const score = { cyclomatic: 5, cognitive: 5, loc: 100, totalLines: 120, maxNestingDepth: 2 };
    const issues = detectComplexityIssues(score, DEFAULT_THRESHOLDS, 'longFunc');
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.includes('Long function'))).toBe(true);
  });
});

// ============================================================================
// Recommendation Generation Tests
// ============================================================================

describe('generateRecommendations', () => {
  it('returns no recommendations for low complexity', () => {
    const score = { cyclomatic: 3, cognitive: 5, loc: 20, totalLines: 25, maxNestingDepth: 2 };
    const recs = generateRecommendations(score, DEFAULT_THRESHOLDS, 'low');
    expect(recs).toHaveLength(0);
  });

  it('returns recommendations for high complexity', () => {
    const score = { cyclomatic: 15, cognitive: 20, loc: 80, totalLines: 100, maxNestingDepth: 5 };
    const recs = generateRecommendations(score, DEFAULT_THRESHOLDS, 'high');
    expect(recs.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Aggregation Tests
// ============================================================================

describe('aggregateFileComplexity', () => {
  it('handles empty function list', () => {
    const result = aggregateFileComplexity([], 0, 0);
    expect(result.functionCount).toBe(0);
    expect(result.avgCyclomatic).toBe(1);
    expect(result.maintainabilityIndex).toBe(100);
  });

  it('aggregates multiple functions', () => {
    const functions = [
      { complexity: { cyclomatic: 5, cognitive: 3, loc: 20, totalLines: 25, maxNestingDepth: 2 } },
      { complexity: { cyclomatic: 10, cognitive: 7, loc: 30, totalLines: 35, maxNestingDepth: 3 } },
    ];
    const result = aggregateFileComplexity(functions, 50, 60);

    expect(result.functionCount).toBe(2);
    expect(result.cyclomatic).toBe(15); // sum
    expect(result.cognitive).toBe(10); // sum
    expect(result.avgCyclomatic).toBe(7.5);
    expect(result.avgCognitive).toBe(5);
    expect(result.maxNestingDepth).toBe(3); // max
  });
});
