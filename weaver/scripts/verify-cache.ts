/**
 * Shadow Cache Verification Script
 *
 * Queries the shadow cache database to verify data integrity.
 */

import Database from 'better-sqlite3';

const dbPath = './data/shadow-cache.db';
const db = new Database(dbPath, { readonly: true });

console.log('\n📊 Shadow Cache Verification\n');
console.log('=' .repeat(60));

// 1. Basic counts
const fileCount = db.prepare('SELECT COUNT(*) as count FROM files').get() as { count: number };
const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number };
const linkCount = db.prepare('SELECT COUNT(*) as count FROM links').get() as { count: number };

console.log('\n📈 Database Statistics:');
console.log(`  Files: ${fileCount.count}`);
console.log(`  Tags: ${tagCount.count}`);
console.log(`  Links: ${linkCount.count}`);

// 2. Sample files
console.log('\n📁 Sample Files (first 5):');
const sampleFiles = db.prepare(`
  SELECT path, type, status, title
  FROM files
  ORDER BY path
  LIMIT 5
`).all();

sampleFiles.forEach((file: any) => {
  console.log(`  ${file.path}`);
  console.log(`    Type: ${file.type || 'N/A'}, Status: ${file.status || 'N/A'}`);
  console.log(`    Title: ${file.title || 'N/A'}`);
});

// 3. Top tags
console.log('\n🏷️  Top 10 Tags:');
const topTags = db.prepare(`
  SELECT t.tag, COUNT(ft.file_id) as file_count
  FROM tags t
  LEFT JOIN file_tags ft ON t.id = ft.tag_id
  GROUP BY t.id
  ORDER BY file_count DESC
  LIMIT 10
`).all();

topTags.forEach((tag: any) => {
  console.log(`  ${tag.tag}: ${tag.file_count} files`);
});

// 4. Files by type
console.log('\n📋 Files by Type:');
const filesByType = db.prepare(`
  SELECT type, COUNT(*) as count
  FROM files
  WHERE type IS NOT NULL
  GROUP BY type
  ORDER BY count DESC
`).all();

filesByType.forEach((row: any) => {
  console.log(`  ${row.type}: ${row.count}`);
});

// 5. Files by status
console.log('\n📊 Files by Status:');
const filesByStatus = db.prepare(`
  SELECT status, COUNT(*) as count
  FROM files
  WHERE status IS NOT NULL
  GROUP BY status
  ORDER BY count DESC
`).all();

filesByStatus.forEach((row: any) => {
  console.log(`  ${row.status}: ${row.count}`);
});

// 6. Link types
console.log('\n🔗 Links by Type:');
const linkTypes = db.prepare(`
  SELECT link_type, COUNT(*) as count
  FROM links
  GROUP BY link_type
`).all();

linkTypes.forEach((row: any) => {
  console.log(`  ${row.link_type}: ${row.count}`);
});

// 7. Most linked files (incoming)
console.log('\n⭐ Most Referenced Files (top 5):');
const mostLinked = db.prepare(`
  SELECT target_path, COUNT(*) as link_count
  FROM links
  GROUP BY target_path
  ORDER BY link_count DESC
  LIMIT 5
`).all();

mostLinked.forEach((row: any) => {
  console.log(`  ${row.target_path}: ${row.link_count} incoming links`);
});

// 8. Cache metadata
console.log('\n⚙️  Cache Metadata:');
const metadata = db.prepare('SELECT key, value FROM cache_metadata').all();
metadata.forEach((row: any) => {
  console.log(`  ${row.key}: ${row.value}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Verification complete\n');

db.close();
