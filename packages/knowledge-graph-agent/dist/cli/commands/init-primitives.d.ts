/**
 * Init Primitives Command
 *
 * Bootstrap knowledge graph with primitive nodes from codebase analysis.
 * Analyzes package.json, requirements.txt, Cargo.toml, go.mod, docker-compose,
 * and other project files to generate foundational knowledge nodes.
 *
 * @module cli/commands/init-primitives
 */
import { Command } from 'commander';
/**
 * Create the init-primitives command
 */
export declare function createInitPrimitivesCommand(): Command;
/**
 * Create the analyze-codebase command (alias for analysis without generation)
 */
export declare function createAnalyzeCodebaseCommand(): Command;
//# sourceMappingURL=init-primitives.d.ts.map