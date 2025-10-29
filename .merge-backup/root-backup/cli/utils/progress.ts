/**
 * Progress indicators for CLI commands
 * Uses ora for spinners
 */

import ora, { Ora } from 'ora';
import chalk from 'chalk';

/**
 * Show a spinner with initial text
 */
export function showSpinner(text: string, prefixText?: string): Ora {
  const spinner = ora({
    text,
    prefixText,
    spinner: 'dots',
  });

  spinner.start();
  return spinner;
}

/**
 * Update spinner text
 */
export function updateSpinner(spinner: Ora, text: string): void {
  spinner.text = text;
}

/**
 * Mark spinner as succeeded
 */
export function succeedSpinner(spinner: Ora, text?: string): void {
  if (text) {
    spinner.text = text;
  }
  spinner.succeed();
}

/**
 * Mark spinner as failed
 */
export function failSpinner(spinner: Ora, text?: string): void {
  if (text) {
    spinner.text = text;
  }
  spinner.fail();
}

/**
 * Mark spinner as warning
 */
export function warnSpinner(spinner: Ora, text?: string): void {
  if (text) {
    spinner.text = text;
  }
  spinner.warn();
}

/**
 * Mark spinner as info
 */
export function infoSpinner(spinner: Ora, text?: string): void {
  if (text) {
    spinner.text = text;
  }
  spinner.info();
}

/**
 * Stop spinner without symbol
 */
export function stopSpinner(spinner: Ora): void {
  spinner.stop();
}

/**
 * Clear spinner
 */
export function clearSpinner(spinner: Ora): void {
  spinner.clear();
}

/**
 * Progress bar for multiple steps
 */
export class ProgressTracker {
  private current = 0;
  private total: number;
  private spinner: Ora;
  private steps: string[];

  constructor(steps: string[]) {
    this.total = steps.length;
    this.steps = steps;
    this.spinner = ora({
      text: this.getProgressText(),
      spinner: 'dots',
    });
  }

  private getProgressText(): string {
    const percent = Math.round((this.current / this.total) * 100);
    const bar = this.createProgressBar(percent);
    const currentStep = this.steps[this.current] || 'Complete';
    return `${bar} ${percent}% - ${currentStep}`;
  }

  private createProgressBar(percent: number): string {
    const barLength = 20;
    const filled = Math.round((percent / 100) * barLength);
    const empty = barLength - filled;
    return chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  start(): void {
    this.spinner.start();
  }

  next(customText?: string): void {
    this.current++;
    if (customText) {
      this.spinner.text = customText;
    } else {
      this.spinner.text = this.getProgressText();
    }
  }

  succeed(text?: string): void {
    this.spinner.succeed(text || chalk.green('All steps completed'));
  }

  fail(text?: string): void {
    this.spinner.fail(text || chalk.red('Operation failed'));
  }

  update(stepIndex: number, customText?: string): void {
    this.current = stepIndex;
    if (customText) {
      this.spinner.text = customText;
    } else {
      this.spinner.text = this.getProgressText();
    }
  }
}

/**
 * Simple timer spinner
 */
export class TimerSpinner {
  private spinner: Ora;
  private startTime: number;
  private interval: NodeJS.Timeout | null = null;

  constructor(text: string) {
    this.startTime = Date.now();
    this.spinner = ora({
      text: this.getTimedText(text),
      spinner: 'dots',
    });
  }

  private getTimedText(baseText: string): string {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    return `${baseText} (${elapsed}s)`;
  }

  start(text: string): void {
    this.spinner.start();

    // Update timer every second
    this.interval = setInterval(() => {
      this.spinner.text = this.getTimedText(text);
    }, 1000);
  }

  succeed(text?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.spinner.succeed(text ? `${text} (${elapsed}s)` : undefined);
  }

  fail(text?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    this.spinner.fail(text ? `${text} (${elapsed}s)` : undefined);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.spinner.stop();
  }
}
