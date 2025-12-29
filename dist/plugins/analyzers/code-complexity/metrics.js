import { EMPTY_HALSTEAD_METRICS } from "./types.js";
const CYCLOMATIC_NODES = /* @__PURE__ */ new Set([
  "IfStatement",
  "ConditionalExpression",
  "SwitchCase",
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
  "CatchClause",
  "LogicalExpression"
  // && and || add branching paths
]);
function calculateCyclomaticComplexity(node) {
  let complexity = 1;
  function traverse(current) {
    if (CYCLOMATIC_NODES.has(current.type)) {
      if (current.type === "SwitchCase") {
        const switchCase = current;
        if (switchCase.test !== null) {
          complexity++;
        }
      } else if (current.type === "LogicalExpression") {
        const logical = current;
        if (logical.operator === "&&" || logical.operator === "||") {
          complexity++;
        }
      } else {
        complexity++;
      }
    }
    for (const key of Object.keys(current)) {
      const child = current[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === "object" && "type" in item) {
              traverse(item);
            }
          }
        } else if ("type" in child) {
          traverse(child);
        }
      }
    }
  }
  traverse(node);
  return complexity;
}
function calculateCognitiveComplexity(node) {
  let complexity = 0;
  function traverse(current, nestingLevel) {
    const increment = nestingLevel + 1;
    switch (current.type) {
      // Control flow structures - add base + nesting
      case "IfStatement":
      case "ConditionalExpression":
        complexity += increment;
        if (current.type === "IfStatement") {
          const ifStmt = current;
          traverseChildren(ifStmt.test, nestingLevel);
          traverseChildren(ifStmt.consequent, nestingLevel + 1);
          if (ifStmt.alternate) {
            if (ifStmt.alternate.type === "IfStatement") {
              complexity += 1;
              traverse(ifStmt.alternate, nestingLevel);
            } else {
              complexity += 1;
              traverseChildren(ifStmt.alternate, nestingLevel + 1);
            }
          }
          return;
        }
        break;
      case "SwitchStatement":
        complexity += increment;
        break;
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
      case "WhileStatement":
      case "DoWhileStatement":
        complexity += increment;
        break;
      case "CatchClause":
        complexity += increment;
        break;
      // Logical operators - flat increment
      case "LogicalExpression": {
        const logical = current;
        if (logical.operator === "&&" || logical.operator === "||" || logical.operator === "??") {
          complexity += 1;
        }
        break;
      }
      // Break/continue with label - extra complexity
      case "BreakStatement":
      case "ContinueStatement": {
        const stmt = current;
        if (stmt.label) {
          complexity += 1;
        }
        break;
      }
    }
    const increasesNesting = current.type === "IfStatement" || current.type === "SwitchStatement" || current.type === "ForStatement" || current.type === "ForInStatement" || current.type === "ForOfStatement" || current.type === "WhileStatement" || current.type === "DoWhileStatement" || current.type === "CatchClause" || current.type === "ConditionalExpression";
    const newNesting = increasesNesting ? nestingLevel + 1 : nestingLevel;
    traverseChildren(current, newNesting);
  }
  function traverseChildren(current, nestingLevel) {
    for (const key of Object.keys(current)) {
      if (key === "parent") continue;
      const child = current[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === "object" && "type" in item) {
              traverse(item, nestingLevel);
            }
          }
        } else if ("type" in child) {
          traverse(child, nestingLevel);
        }
      }
    }
  }
  traverse(node, 0);
  return complexity;
}
function calculateMaxNestingDepth(node) {
  let maxDepth = 0;
  function traverse(current, depth) {
    maxDepth = Math.max(maxDepth, depth);
    const nestingNodes = /* @__PURE__ */ new Set([
      "IfStatement",
      "ForStatement",
      "ForInStatement",
      "ForOfStatement",
      "WhileStatement",
      "DoWhileStatement",
      "SwitchStatement",
      "TryStatement",
      "FunctionDeclaration",
      "FunctionExpression",
      "ArrowFunctionExpression",
      "ClassDeclaration",
      "ClassExpression"
    ]);
    const newDepth = nestingNodes.has(current.type) ? depth + 1 : depth;
    for (const key of Object.keys(current)) {
      if (key === "parent") continue;
      const child = current[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === "object" && "type" in item) {
              traverse(item, newDepth);
            }
          }
        } else if ("type" in child) {
          traverse(child, newDepth);
        }
      }
    }
  }
  traverse(node, 0);
  return maxDepth;
}
function calculateLinesOfCode(sourceCode, startLine, endLine) {
  const lines = sourceCode.split("\n").slice(startLine - 1, endLine);
  const totalLines = lines.length;
  let loc = 0;
  let inBlockComment = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (inBlockComment) {
      if (trimmed.includes("*/")) {
        inBlockComment = false;
      }
      continue;
    }
    if (trimmed.startsWith("/*")) {
      inBlockComment = true;
      if (trimmed.includes("*/")) {
        inBlockComment = false;
      }
      continue;
    }
    if (trimmed === "" || trimmed.startsWith("//")) {
      continue;
    }
    loc++;
  }
  return { loc, totalLines };
}
function countReturnStatements(node) {
  let count = 0;
  function traverse(current) {
    if (current.type === "ReturnStatement") {
      count++;
    }
    if (current.type === "FunctionDeclaration" || current.type === "FunctionExpression" || current.type === "ArrowFunctionExpression") {
      if (current !== node) return;
    }
    for (const key of Object.keys(current)) {
      if (key === "parent") continue;
      const child = current[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === "object" && "type" in item) {
              traverse(item);
            }
          }
        } else if ("type" in child) {
          traverse(child);
        }
      }
    }
  }
  traverse(node);
  return count;
}
function calculateMaintainabilityIndex(cyclomatic, loc, cognitive) {
  if (loc === 0) return 100;
  const lnLoc = Math.log(Math.max(1, loc));
  const lnCognitive = Math.log(Math.max(1, cognitive));
  const mi = 171 - 0.23 * cyclomatic - 16.2 * lnLoc - 5.2 * lnCognitive;
  const normalizedMI = Math.max(0, mi * 100 / 171);
  return Math.round(normalizedMI * 100) / 100;
}
function calculateHalsteadMetrics(node) {
  const operators = /* @__PURE__ */ new Map();
  const operands = /* @__PURE__ */ new Map();
  function addOperator(op) {
    operators.set(op, (operators.get(op) || 0) + 1);
  }
  function addOperand(op) {
    operands.set(op, (operands.get(op) || 0) + 1);
  }
  function traverse(current) {
    switch (current.type) {
      // Operators from expressions
      case "BinaryExpression":
      case "LogicalExpression":
      case "AssignmentExpression": {
        const expr = current;
        addOperator(expr.operator);
        break;
      }
      case "UnaryExpression":
      case "UpdateExpression": {
        const expr = current;
        addOperator(expr.operator);
        break;
      }
      case "ConditionalExpression":
        addOperator("?:");
        break;
      case "MemberExpression": {
        const expr = current;
        addOperator(expr.optional ? "?." : ".");
        break;
      }
      case "CallExpression":
        addOperator("()");
        break;
      case "NewExpression":
        addOperator("new");
        break;
      case "ArrowFunctionExpression":
        addOperator("=>");
        break;
      case "FunctionDeclaration":
      case "FunctionExpression":
        addOperator("function");
        break;
      case "AwaitExpression":
        addOperator("await");
        break;
      case "YieldExpression":
        addOperator("yield");
        break;
      // Control flow operators
      case "IfStatement":
        addOperator("if");
        break;
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
        addOperator("for");
        break;
      case "WhileStatement":
        addOperator("while");
        break;
      case "DoWhileStatement":
        addOperator("do");
        addOperator("while");
        break;
      case "SwitchStatement":
        addOperator("switch");
        break;
      case "SwitchCase": {
        const switchCase = current;
        addOperator(switchCase.test ? "case" : "default");
        break;
      }
      case "TryStatement":
        addOperator("try");
        break;
      case "CatchClause":
        addOperator("catch");
        break;
      case "ThrowStatement":
        addOperator("throw");
        break;
      case "ReturnStatement":
        addOperator("return");
        break;
      case "BreakStatement":
        addOperator("break");
        break;
      case "ContinueStatement":
        addOperator("continue");
        break;
      // Operands
      case "Identifier": {
        const id = current;
        addOperand(id.name);
        break;
      }
      case "Literal": {
        const lit = current;
        addOperand(String(lit.value));
        break;
      }
      case "TemplateLiteral":
        addOperand("template");
        break;
    }
    for (const key of Object.keys(current)) {
      if (key === "parent") continue;
      const child = current[key];
      if (child && typeof child === "object") {
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === "object" && "type" in item) {
              traverse(item);
            }
          }
        } else if ("type" in child) {
          traverse(child);
        }
      }
    }
  }
  traverse(node);
  const n1 = operators.size;
  const n2 = operands.size;
  const N1 = Array.from(operators.values()).reduce((a, b) => a + b, 0);
  const N2 = Array.from(operands.values()).reduce((a, b) => a + b, 0);
  if (n1 === 0 || n2 === 0) {
    return { ...EMPTY_HALSTEAD_METRICS };
  }
  const vocabulary = n1 + n2;
  const length = N1 + N2;
  const calculatedLength = n1 * Math.log2(n1) + n2 * Math.log2(n2);
  const volume = length * Math.log2(vocabulary);
  const difficulty = n1 / 2 * (N2 / n2);
  const effort = difficulty * volume;
  const time = effort / 18;
  const bugs = volume / 3e3;
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
    bugs: Math.round(bugs * 1e3) / 1e3
  };
}
function classifyComplexityLevel(complexity, thresholds) {
  if (complexity.cyclomatic >= thresholds.cyclomaticCritical || complexity.cognitive >= thresholds.cognitiveCritical) {
    return "critical";
  }
  if (complexity.cyclomatic >= thresholds.cyclomaticHigh || complexity.cognitive >= thresholds.cognitiveHigh || complexity.maxNestingDepth > thresholds.maxNestingDepth) {
    return "high";
  }
  if (complexity.cyclomatic >= thresholds.cyclomaticHigh / 2 || complexity.cognitive >= thresholds.cognitiveHigh / 2 || complexity.maxNestingDepth > thresholds.maxNestingDepth - 1) {
    return "moderate";
  }
  return "low";
}
function aggregateFileComplexity(functions, totalLoc, totalLines) {
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
      maintainabilityIndex: 100
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
    maintainabilityIndex
  };
}
function detectComplexityIssues(complexity, thresholds, functionName) {
  const issues = [];
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
function generateRecommendations(complexity, thresholds, level) {
  const recommendations = [];
  if (level === "low") {
    return recommendations;
  }
  if (complexity.cyclomatic >= thresholds.cyclomaticHigh) {
    recommendations.push("Extract conditional logic into separate helper functions");
    recommendations.push("Consider using early returns to reduce nesting");
    recommendations.push("Replace complex conditionals with polymorphism or strategy pattern");
  }
  if (complexity.cognitive >= thresholds.cognitiveHigh) {
    recommendations.push("Simplify nested structures by extracting inner logic");
    recommendations.push("Use descriptive variable names to improve readability");
    recommendations.push("Consider using guard clauses at function start");
  }
  if (complexity.maxNestingDepth > thresholds.maxNestingDepth) {
    recommendations.push("Flatten nested loops using functional programming patterns");
    recommendations.push("Extract deeply nested code blocks into separate functions");
    recommendations.push("Consider using async/await to flatten callback pyramids");
  }
  if (complexity.loc > thresholds.maxFunctionLength) {
    recommendations.push("Split function into smaller, focused helper functions");
    recommendations.push("Apply single responsibility principle");
    recommendations.push("Consider creating a class if function manages state");
  }
  return recommendations;
}
export {
  aggregateFileComplexity,
  calculateCognitiveComplexity,
  calculateCyclomaticComplexity,
  calculateHalsteadMetrics,
  calculateLinesOfCode,
  calculateMaintainabilityIndex,
  calculateMaxNestingDepth,
  classifyComplexityLevel,
  countReturnStatements,
  detectComplexityIssues,
  generateRecommendations
};
//# sourceMappingURL=metrics.js.map
