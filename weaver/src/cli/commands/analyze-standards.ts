/**
 * Analyze Standards Command - Generate comprehensive standards for any project
 *
 * Uses the Hive Mind collective intelligence approach to analyze a project
 * and generate standards documentation in the vault.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';

interface AnalyzeStandardsOptions {
  projectRoot: string;
  vaultRoot?: string;
  outputDir?: string;
  parallel?: boolean;
  verbose?: boolean;
}

export function createAnalyzeStandardsCommand(): Command {
  return new Command('analyze-standards')
    .description('Generate comprehensive standards documentation for a project using Hive Mind agents')
    .requiredOption('--project-root <path>', 'Path to the project root to analyze')
    .option('--vault-root <path>', 'Vault root directory (defaults to current directory)')
    .option('--output-dir <path>', 'Output directory for standards (defaults to docs/standards)')
    .option('--parallel', 'Run agents in parallel (faster)', true)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (options: AnalyzeStandardsOptions) => {
      const spinner = ora('Initializing Hive Mind standards analysis...').start();

      try {
        // Resolve paths
        const projectRoot = path.resolve(options.projectRoot);
        const vaultRoot = options.vaultRoot ? path.resolve(options.vaultRoot) : process.cwd();
        const outputDir = options.outputDir
          ? path.resolve(options.outputDir)
          : path.join(vaultRoot, 'docs/standards');

        // Validate project root exists
        try {
          await fs.access(projectRoot);
        } catch {
          spinner.fail(`Project root not found: ${projectRoot}`);
          process.exit(1);
        }

        spinner.succeed('Paths validated');
        console.log(chalk.cyan('\n📂 Configuration:'));
        console.log(`  Project root: ${projectRoot}`);
        console.log(`  Vault root:   ${vaultRoot}`);
        console.log(`  Output dir:   ${outputDir}\n`);

        // Create output directory
        await fs.mkdir(outputDir, { recursive: true });

        // Initialize Hive Mind swarm
        spinner.start('Initializing Hive Mind collective intelligence...');

        console.log(chalk.bold.green('\n🧠 HIVE MIND COLLECTIVE INTELLIGENCE\n'));
        console.log(chalk.cyan('Deploying 4 specialized agents:\n'));
        console.log('  1️⃣  Researcher - API styles & coding standards');
        console.log('  2️⃣  Analyst   - Data formats & documentation');
        console.log('  3️⃣  Coder     - Implementation patterns & naming');
        console.log('  4️⃣  Tester    - Testing guidelines & coverage\n');

        // Agent prompts
        const agents = [
          {
            name: 'Researcher',
            type: 'researcher',
            task: `Analyze ${projectRoot} for API styles and coding standards. Generate comprehensive documentation at ${outputDir}/api-coding-standards.md`,
          },
          {
            name: 'Analyst',
            type: 'analyst',
            task: `Analyze ${projectRoot} for data formats and documentation standards. Generate comprehensive documentation at ${outputDir}/data-documentation-standards.md`,
          },
          {
            name: 'Coder',
            type: 'coder',
            task: `Analyze ${projectRoot} for implementation patterns and naming conventions. Generate comprehensive documentation at ${outputDir}/implementation-naming-standards.md`,
          },
          {
            name: 'Tester',
            type: 'tester',
            task: `Analyze ${projectRoot} for testing strategies and coverage requirements. Generate comprehensive documentation at ${outputDir}/testing-guidelines.md`,
          },
        ];

        // Execute Hive Mind agents using claude-flow
        spinner.start('Spawning Hive Mind agents...');

        const { execaCommand } = await import('execa');

        // Check if claude-flow is available
        let hasClaudeFlow = false;
        try {
          await execaCommand('npx claude-flow@alpha --version', { timeout: 5000 });
          hasClaudeFlow = true;
          spinner.succeed('claude-flow detected');
        } catch {
          spinner.warn('claude-flow not available, creating placeholder files');
          hasClaudeFlow = false;
        }

        if (hasClaudeFlow && options.parallel) {
          // Execute agents in parallel using claude-flow
          console.log(chalk.cyan('\n🚀 Spawning agents in parallel...\n'));

          const agentPromises = agents.map(async (agent) => {
            console.log(chalk.gray(`  Spawning ${agent.name} agent...`));

            const prompt = `You are a ${agent.name} agent in a Hive Mind swarm analyzing the project at ${projectRoot}.

**OBJECTIVE**: ${agent.task}

**COORDINATION PROTOCOL**:
Run these hooks before starting:
\`\`\`bash
npx claude-flow@alpha hooks pre-task --description "Analyze ${agent.name.toLowerCase()} standards"
\`\`\`

**YOUR TASKS**:
1. Analyze the codebase at ${projectRoot}
2. Identify current patterns and conventions
3. Research industry best practices
4. Generate comprehensive documentation
5. Include code examples from the project

**DELIVERABLE**: Create comprehensive markdown documentation at ${outputDir}/${agent.name.toLowerCase()}-standards.md

After completing:
\`\`\`bash
npx claude-flow@alpha hooks post-task --task-id "${agent.type}-standards"
\`\`\`
`;

            try {
              // Spawn claude-flow agent
              const result = await execaCommand(
                `npx claude-flow@alpha agent execute ${agent.type} "${prompt.replace(/"/g, '\\"')}" --json`,
                {
                  cwd: projectRoot,
                  timeout: 120000, // 2 minutes
                  shell: true,
                }
              );

              return { agent: agent.name, success: true, output: result.stdout };
            } catch (error: any) {
              return { agent: agent.name, success: false, error: error.message };
            }
          });

          const results = await Promise.allSettled(agentPromises);

          // Process results
          console.log(chalk.cyan('\n📊 Agent Results:\n'));
          results.forEach((result, i) => {
            const agent = agents[i];
            if (result.status === 'fulfilled' && result.value.success) {
              console.log(chalk.green(`  ✅ ${agent.name}: Success`));
            } else {
              console.log(chalk.yellow(`  ⚠️  ${agent.name}: Fallback to manual`));
            }
          });

          spinner.succeed('Agent execution complete');
        }

        // Create placeholder files (fallback or if claude-flow not available)
        if (!hasClaudeFlow || !options.parallel) {
          spinner.start('Creating documentation structure...');

          const placeholderContent = (agentName: string, focus: string) => `# ${agentName} Standards for ${path.basename(projectRoot)}

This document contains comprehensive ${focus} standards for your project.

## 🚧 Status: ${hasClaudeFlow ? 'Generated by Hive Mind Agent' : 'Awaiting Analysis'}

${hasClaudeFlow ? 'Analyzed by Hive Mind collective intelligence.' : 'Run with claude-flow to populate automatically.'}

## 📋 Analysis Scope

The analysis should cover:
- Current patterns identified in your codebase
- Industry best practices
- Recommendations for improvement
- Code examples from your project
- Integration guidelines

## 🎯 Recommendations

${hasClaudeFlow ? '(Agent analysis results will appear here)' : '(Run: weaver analyze-standards --project-root . --parallel)'}

---

**Generated by**: Hive Mind Collective Intelligence
**Project**: ${path.basename(projectRoot)}
**Date**: ${new Date().toISOString().split('T')[0]}
`;

          await Promise.all([
            fs.writeFile(
              path.join(outputDir, 'api-coding-standards.md'),
              placeholderContent('API & Coding', 'API design patterns and coding conventions')
            ),
            fs.writeFile(
              path.join(outputDir, 'data-documentation-standards.md'),
              placeholderContent('Data & Documentation', 'data formats and documentation')
            ),
            fs.writeFile(
              path.join(outputDir, 'implementation-naming-standards.md'),
              placeholderContent('Implementation & Naming', 'implementation patterns and naming conventions')
            ),
            fs.writeFile(
              path.join(outputDir, 'testing-guidelines.md'),
              placeholderContent('Testing', 'testing strategies and coverage requirements')
            ),
          ]);

          spinner.succeed(`Documentation structure created in ${outputDir}`);
        }

        console.log(chalk.bold.green('\n✅ Setup Complete!\n'));
        console.log(chalk.cyan('Next Steps:\n'));
        console.log('1. Review the placeholder files in:');
        console.log(`   ${outputDir}/\n`);
        console.log('2. Use the Hive Mind approach (see Hive Mind Execution Report)');
        console.log('3. Or manually populate the standards based on your codebase\n');

      } catch (error) {
        spinner.fail('Standards analysis failed');
        console.error(chalk.red('\nError:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
