/**
 * Text formatting utilities for CLI output
 * Uses chalk for colorization
 */

import chalk from 'chalk';
import boxen from 'boxen';

/**
 * Format success message
 */
export function formatSuccess(message: string): string {
  return chalk.green(`✓ ${message}`);
}

/**
 * Format error message
 */
export function formatError(message: string): string {
  return chalk.red(`✗ ${message}`);
}

/**
 * Format warning message
 */
export function formatWarning(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * Format info message
 */
export function formatInfo(message: string): string {
  return chalk.blue(`ℹ ${message}`);
}

/**
 * Format header
 */
export function formatHeader(title: string): string {
  return boxen(chalk.bold.cyan(title), {
    padding: 1,
    margin: 0,
    borderStyle: 'round',
    borderColor: 'cyan',
  });
}

/**
 * Format section header
 */
export function formatSectionHeader(title: string): string {
  return chalk.bold.underline.cyan(title);
}

/**
 * Format key-value pair
 */
export function formatKeyValue(key: string, value: string): string {
  return `${chalk.bold(key)}: ${chalk.cyan(value)}`;
}

/**
 * Format list item
 */
export function formatListItem(item: string, bullet = '•'): string {
  return `  ${chalk.gray(bullet)} ${item}`;
}

/**
 * Format code block
 */
export function formatCode(code: string): string {
  return chalk.gray(code);
}

/**
 * Format path
 */
export function formatPath(path: string): string {
  return chalk.cyan.underline(path);
}

/**
 * Format command
 */
export function formatCommand(command: string): string {
  return chalk.bold.green(`$ ${command}`);
}

/**
 * Format summary table
 */
export function formatSummary(data: Record<string, string>): string {
  const maxKeyLength = Math.max(...Object.keys(data).map((k) => k.length));

  const rows = Object.entries(data).map(([key, value]) => {
    const paddedKey = key.padEnd(maxKeyLength);
    return formatKeyValue(paddedKey, value);
  });

  return boxen(rows.join('\n'), {
    padding: 1,
    margin: 0,
    borderStyle: 'single',
    borderColor: 'gray',
    title: 'Summary',
    titleAlignment: 'center',
  });
}

/**
 * Format table
 */
export function formatTable(
  headers: string[],
  rows: string[][]
): string {
  const columnWidths = headers.map((header, i) => {
    const cellWidths = rows.map((row) => (row[i] || '').length);
    const maxCellWidth = cellWidths.length > 0 ? Math.max(...cellWidths) : 0;
    return Math.max(header.length, maxCellWidth);
  });

  const formatRow = (cells: string[]) => {
    return cells
      .map((cell, i) => cell.padEnd(columnWidths[i] ?? 0))
      .join(' │ ');
  };

  const separator = columnWidths.map((w) => '─'.repeat(w)).join('─┼─');

  const output = [
    chalk.bold(formatRow(headers)),
    separator,
    ...rows.map((row) => formatRow(row)),
  ];

  return output.join('\n');
}

/**
 * Format progress percentage
 */
export function formatProgress(current: number, total: number): string {
  const percent = Math.round((current / total) * 100);
  const bar = createProgressBar(percent);
  return `${bar} ${percent}% (${current}/${total})`;
}

/**
 * Create progress bar
 */
function createProgressBar(percent: number): string {
  const barLength = 20;
  const filled = Math.round((percent / 100) * barLength);
  const empty = barLength - filled;

  const filledBar = chalk.cyan('█'.repeat(filled));
  const emptyBar = chalk.gray('░'.repeat(empty));

  return `[${filledBar}${emptyBar}]`;
}

/**
 * Format duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Wrap text to specified width
 */
export function wrapText(text: string, width: number): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

/**
 * Format diff line (git-style)
 */
export function formatDiffLine(line: string): string {
  if (line.startsWith('+')) {
    return chalk.green(line);
  } else if (line.startsWith('-')) {
    return chalk.red(line);
  } else if (line.startsWith('@')) {
    return chalk.cyan(line);
  }
  return line;
}
