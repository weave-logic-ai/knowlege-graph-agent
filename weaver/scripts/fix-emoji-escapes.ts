#!/usr/bin/env tsx
/**
 * Fix Unicode Escaped Emojis in Frontmatter
 *
 * Converts "\U0001F4C4" to actual emoji "📄"
 * for Obsidian Iconize compatibility
 */

import { readFile, writeFile } from 'fs/promises';
import fg from 'fast-glob';
import matter from 'gray-matter';
import chalk from 'chalk';

async function fixEmojiEscapes() {
  console.log(chalk.bold.cyan('\n🔧 Fixing Unicode Escaped Emojis\n'));

  const files = await fg('weave-nn/**/*.md', {
    ignore: ['**/node_modules/**', '**/.git/**'],
  });

  let fixed = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8');

      // Check if file has escaped unicode in visual.icon
      if (!content.includes('\\U000')) continue;

      const { data: frontmatter, content: markdown } = matter(content);

      if (!frontmatter.visual?.icon) continue;

      const icon = frontmatter.visual.icon;

      // Convert unicode escape to actual emoji
      // Example: "\U0001F4C4" -> 📄
      if (typeof icon === 'string' && icon.includes('\\U')) {
        const unicodeValue = icon.replace(/\\U([0-9A-F]{8})/i, (_, hex) => {
          return String.fromCodePoint(parseInt(hex, 16));
        });

        frontmatter.visual.icon = unicodeValue;

        // Rebuild file with proper emoji
        const updatedContent = `---\n${Object.entries(frontmatter)
          .map(([key, value]) => {
            if (key === 'visual') {
              return `visual:\n  icon: "${frontmatter.visual.icon}"\n` +
                     (frontmatter.visual.color ? `  color: '${frontmatter.visual.color}'\n` : '') +
                     (frontmatter.visual.cssclasses ? `  cssclasses:\n${frontmatter.visual.cssclasses.map((c: string) => `    - ${c}`).join('\n')}` : '');
            }
            if (typeof value === 'string') return `${key}: ${value}`;
            if (Array.isArray(value)) {
              return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
            }
            return `${key}: ${JSON.stringify(value)}`;
          })
          .join('\n')}
---

${markdown}`;

        await writeFile(file, updatedContent, 'utf-8');
        fixed++;
        console.log(chalk.green(`✓ ${file.replace('weave-nn/', '')}`));
      }
    } catch (error) {
      errors++;
      console.error(chalk.red(`✗ ${file}: ${error}`));
    }
  }

  console.log(chalk.bold.green(`\n✅ Fixed ${fixed} files`));
  if (errors > 0) {
    console.log(chalk.yellow(`⚠️  ${errors} errors`));
  }
}

fixEmojiEscapes().catch(console.error);
