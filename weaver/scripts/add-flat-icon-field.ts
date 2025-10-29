#!/usr/bin/env tsx
/**
 * Add Flat Icon Field for Iconize
 *
 * Copies visual.icon to top-level icon field
 * Iconize works better with flat structure
 */

import { readFile, writeFile } from 'fs/promises';
import fg from 'fast-glob';
import matter from 'gray-matter';
import chalk from 'chalk';

async function addFlatIconField() {
  console.log(chalk.bold.cyan('\n📝 Adding flat icon field\n'));

  const files = await fg('weave-nn/**/*.md', {
    ignore: ['**/node_modules/**', '**/.git/**'],
  });

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8');
      const { data: frontmatter, content: markdown } = matter(content);

      // Skip if no visual.icon
      if (!frontmatter.visual?.icon) {
        skipped++;
        continue;
      }

      // Skip if already has flat icon
      if (frontmatter.icon) {
        skipped++;
        continue;
      }

      // Copy visual.icon to top-level icon
      frontmatter.icon = frontmatter.visual.icon;

      // Write back
      const updatedContent = matter.stringify(markdown, frontmatter);
      await writeFile(file, updatedContent, 'utf-8');

      updated++;
      if (updated <= 10) {
        console.log(chalk.green(`✓ ${file.replace('weave-nn/', '')} → ${frontmatter.icon}`));
      }
    } catch (error) {
      errors++;
      if (errors <= 5) {
        console.error(chalk.red(`✗ ${file}: ${error}`));
      }
    }
  }

  console.log(chalk.bold.green(`\n✅ Updated: ${updated} files`));
  console.log(chalk.gray(`Skipped: ${skipped} files`));
  if (errors > 0) {
    console.log(chalk.yellow(`⚠️  Errors: ${errors} files`));
  }

  console.log(chalk.cyan('\nNext step: In Obsidian → Settings → Iconize'));
  console.log(chalk.cyan('Set "Icon identifier in frontmatter" to: icon'));
}

addFlatIconField().catch(console.error);
