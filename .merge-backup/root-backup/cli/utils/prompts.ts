/**
 * Interactive prompts for CLI commands
 * Uses inquirer for user interaction
 */

import inquirer from 'inquirer';
import path from 'path';
import type { InitVaultOptions } from '../commands/init-vault.js';

/**
 * Prompt for missing vault initialization options
 */
export async function promptForMissingOptions(
  projectPath: string,
  options: InitVaultOptions
): Promise<Required<InitVaultOptions>> {
  const questions: any[] = [];

  // Output path
  if (!options.output) {
    questions.push({
      type: 'input',
      name: 'output',
      message: 'Vault output directory:',
      default: path.join(projectPath, '.vault'),
      validate: (input: string) => {
        if (!input.trim()) {
          return 'Output directory cannot be empty';
        }
        return true;
      },
    });
  }

  // Template selection
  if (!options.template || options.template === 'auto') {
    questions.push({
      type: 'list',
      name: 'template',
      message: 'Select vault template:',
      choices: [
        { name: 'Auto-detect (recommended)', value: 'auto' },
        { name: 'Next.js App Router', value: 'nextjs-app-router' },
        { name: 'React + Vite', value: 'react-vite' },
      ],
      default: 'auto',
    });
  }

  // Prompt if needed
  const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};

  return {
    output: options.output || answers['output'],
    template: options.template || answers['template'],
    dryRun: options.dryRun ?? false,
    offline: options.offline ?? false,
    git: options.git ?? true,
  };
}

/**
 * Confirm action with user
 */
export async function confirmAction(
  message: string,
  defaultValue = false
): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue,
    },
  ]);

  return confirmed;
}

/**
 * Select from list
 */
export async function selectFromList<T = string>(
  message: string,
  choices: Array<{ name: string; value: T }>,
  defaultValue?: T
): Promise<T> {
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message,
      choices,
      default: defaultValue,
    },
  ]);

  return selected;
}

/**
 * Multi-select from list
 */
export async function multiSelectFromList<T = string>(
  message: string,
  choices: Array<{ name: string; value: T; checked?: boolean }>
): Promise<T[]> {
  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message,
      choices,
    },
  ]);

  return selected;
}

/**
 * Text input
 */
export async function textInput(
  message: string,
  defaultValue?: string,
  validate?: (input: string) => boolean | string
): Promise<string> {
  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message,
      default: defaultValue,
      validate,
    },
  ]);

  return input;
}

/**
 * Password input
 */
export async function passwordInput(
  message: string,
  validate?: (input: string) => boolean | string
): Promise<string> {
  const { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message,
      mask: '*',
      validate,
    },
  ]);

  return password;
}

/**
 * Number input
 */
export async function numberInput(
  message: string,
  defaultValue?: number,
  validate?: (input: number) => boolean | string
): Promise<number> {
  const result = await inquirer.prompt<{ number: number }>([
    {
      type: 'input',
      name: 'number',
      message,
      default: defaultValue?.toString(),
      validate: (input: string) => {
        const num = parseFloat(input);
        if (isNaN(num)) {
          return 'Please enter a valid number';
        }
        return validate ? validate(num) : true;
      },
      filter: (input: string) => parseFloat(input),
    },
  ]);

  return result.number;
}
