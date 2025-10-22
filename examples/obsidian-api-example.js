/**
 * Example usage of ObsidianAPIClient
 *
 * Demonstrates authentication, CRUD operations, and error handling.
 */

const ObsidianAPIClient = require('../src/clients/ObsidianAPIClient');

async function example() {
  // Initialize client
  const client = new ObsidianAPIClient({
    apiUrl: process.env.OBSIDIAN_API_URL || 'http://localhost:27123',
    apiKey: process.env.OBSIDIAN_API_KEY,
    timeout: 30000,
    maxRetries: 3,

    // Optional: Add custom interceptors
    onRequestStart: (config) => {
      console.log(`Starting request: ${config.method} ${config.url}`);
    },
    onRequestComplete: (response) => {
      console.log(`Request completed: ${response.status}`);
    },
    onRequestError: (error) => {
      console.error(`Request failed: ${error.message}`);
    }
  });

  try {
    // Test connection
    console.log('Testing API connection...');
    await client.testConnection();
    console.log('✓ Connection successful\n');

    // Get all notes
    console.log('Fetching notes...');
    const notes = await client.getNotes({ limit: 10 });
    console.log(`✓ Found ${notes.length} notes\n`);

    // Create a new note
    console.log('Creating new note...');
    const newNote = await client.createNote({
      path: 'test/example-note.md',
      content: '# Example Note\n\nThis is a test note created via API.',
      frontmatter: {
        title: 'Example Note',
        tags: ['test', 'example'],
        created: new Date().toISOString()
      }
    });
    console.log(`✓ Created note: ${newNote.path}\n`);

    // Get specific note
    console.log('Fetching specific note...');
    const note = await client.getNote('test/example-note.md');
    console.log(`✓ Retrieved note: ${note.path}\n`);

    // Update note
    console.log('Updating note...');
    const updated = await client.updateNote('test/example-note.md', {
      content: '# Example Note\n\nThis note has been updated!',
      frontmatter: {
        ...note.frontmatter,
        modified: new Date().toISOString()
      }
    });
    console.log(`✓ Updated note: ${updated.path}\n`);

    // Search notes
    console.log('Searching notes...');
    const searchResults = await client.searchNotes('example', {
      caseSensitive: false
    });
    console.log(`✓ Found ${searchResults.length} matching notes\n`);

    // Delete note (optional - uncomment to test)
    // console.log('Deleting note...');
    // await client.deleteNote('test/example-note.md');
    // console.log('✓ Deleted note\n');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.status) {
      console.error(`HTTP Status: ${error.status}`);
    }
  }
}

// Run example
if (require.main === module) {
  example().catch(console.error);
}

module.exports = example;
