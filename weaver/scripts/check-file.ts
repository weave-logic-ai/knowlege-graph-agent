/**
 * Check if a specific file is in the shadow cache
 */

import Database from 'better-sqlite3';

const dbPath = './data/shadow-cache.db';
const db = new Database(dbPath, { readonly: true });

const filePath = process.argv[2] || '_planning/phases/testfile.md';

console.log(`\n🔍 Checking cache for: ${filePath}\n`);

const file = db.prepare('SELECT * FROM files WHERE path = ?').get(filePath);

if (!file) {
  console.log('❌ File not found in cache');
  db.close();
  process.exit(1);
}

console.log('✅ File found in cache:');
console.log(`  Path: ${(file as any).path}`);
console.log(`  Title: ${(file as any).title || 'N/A'}`);
console.log(`  Type: ${(file as any).type || 'N/A'}`);
console.log(`  Status: ${(file as any).status || 'N/A'}`);
console.log(`  Size: ${(file as any).size} bytes`);
console.log(`  Modified: ${(file as any).modified_at}`);
console.log(`  Content Hash: ${(file as any).content_hash.substring(0, 16)}...`);

// Get tags
const tags = db.prepare(`
  SELECT t.tag FROM tags t
  JOIN file_tags ft ON t.id = ft.tag_id
  WHERE ft.file_id = ?
`).all((file as any).id);

console.log(`\n🏷️  Tags (${tags.length}):`);
if (tags.length > 0) {
  tags.forEach((t: any) => console.log(`  - ${t.tag}`));
} else {
  console.log('  (none)');
}

// Get links
const links = db.prepare(`
  SELECT target_path, link_type, link_text
  FROM links
  WHERE source_file_id = ?
`).all((file as any).id);

console.log(`\n🔗 Outgoing Links (${links.length}):`);
if (links.length > 0) {
  links.forEach((l: any) => console.log(`  - [${l.link_type}] ${l.target_path}`));
} else {
  console.log('  (none)');
}

// Show frontmatter
if ((file as any).frontmatter) {
  console.log(`\n📋 Frontmatter:`);
  const fm = JSON.parse((file as any).frontmatter);
  console.log(JSON.stringify(fm, null, 2));
}

console.log('');

db.close();
