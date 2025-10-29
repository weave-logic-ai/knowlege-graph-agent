#!/usr/bin/env tsx
/**
 * Fix All Icon Issues
 * - Convert Unicode escapes to emoji
 * - Convert Lucide icon names to emoji equivalents
 */

import { readFile, writeFile } from 'fs/promises';
import fg from 'fast-glob';
import chalk from 'chalk';

// Unicode to Emoji mapping
const unicodeMap: Record<string, string> = {
  '\\U0001F3D7️': '🏗️',
  '\\U0001F3D7': '🏗️',
  '\\U0001F504': '🔄',
  '\\U0001F4CA': '📊',
  '\\U0001F3F7️': '🏷️',
  '\\U0001F3F7': '🏷️',
};

// Lucide icon name to Emoji mapping
const lucideMap: Record<string, string> = {
  'map': '🗺️',
  'check-circle': '✅',
  'layout-grid': '📐',
  'book-open': '📖',
  'puzzle': '🧩',
  'settings': '⚙️',
  'rocket': '🚀',
  'lightbulb': '💡',
  'box': '📦',
  'code': '💻',
  'zap': '⚡',
  'file-text': '📄',
  'folder': '📁',
  'link': '🔗',
  'calendar': '📅',
  'clock': '🕐',
};

async function fixAllIcons() {
  console.log(chalk.bold.cyan('\n🔧 Fixing All Icon Issues\n'));

  const files = await fg('/home/aepod/dev/weave-nn/weave-nn/**/*.md', {
    ignore: ['**/node_modules/**', '**/.git/**'],
  });

  let fixed = 0;
  let errors = 0;

  for (const file of files) {
    try {
      let content = await readFile(file, 'utf-8');
      let modified = false;

      // Fix Unicode escapes in icon field
      for (const [unicode, emoji] of Object.entries(unicodeMap)) {
        const regex = new RegExp(`^icon: "${unicode}"$`, 'gm');
        if (regex.test(content)) {
          content = content.replace(regex, `icon: ${emoji}`);
          modified = true;
        }
      }

      // Fix Lucide icon names
      for (const [lucide, emoji] of Object.entries(lucideMap)) {
        const regex = new RegExp(`^icon: ${lucide}(\\s|$)`, 'gm');
        if (regex.test(content)) {
          content = content.replace(regex, `icon: ${emoji}\n`);
          modified = true;
        }
      }

      if (modified) {
        await writeFile(file, content, 'utf-8');
        fixed++;
        if (fixed <= 15) {
          console.log(chalk.green(`✓ ${file.replace('/home/aepod/dev/weave-nn/weave-nn/', '')}`));
        }
      }
    } catch (error) {
      errors++;
      if (errors <= 3) {
        console.error(chalk.red(`✗ ${file}: ${error}`));
      }
    }
  }

  console.log(chalk.bold.green(`\n✅ Fixed ${fixed} files`));
  if (errors > 0) {
    console.log(chalk.yellow(`⚠️  ${errors} errors`));
  }
}

fixAllIcons().catch(console.error);
