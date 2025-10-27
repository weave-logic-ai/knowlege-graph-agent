/**
 * Example Rules for Common Use Cases
 *
 * Copy and adapt these examples for your own rules.
 */

import type { AgentRule } from '../../../src/agents/rules-engine.js';

// ========================================================================
// Auto-Summarization Rules
// ========================================================================

export const autoSummarizeNewNotes: AgentRule = {
  id: 'auto-summarize-new',
  name: 'Auto-summarize new notes',
  trigger: 'file:add',
  priority: 10,
  condition: async (ctx) => {
    // Only process markdown files in notes/ folder
    return (ctx.note?.path.startsWith('notes/') &&
            ctx.note?.path.endsWith('.md')) ?? false;
  },
  action: async (ctx) => {
    const content = ctx.note?.content || '';

    if (content.length < 100) {
      // Skip short notes
      return;
    }

    const summary = await ctx.claudeClient.sendMessage(
      `Summarize this note in 2-3 sentences:\n\n${content}`,
      {
        maxTokens: 200,
        temperature: 0.7
      }
    );

    if (summary.success) {
      // Update frontmatter with summary
      const frontmatter = ctx.note?.frontmatter
        ? JSON.parse(ctx.note.frontmatter)
        : {};

      frontmatter.summary = summary.data;

      await ctx.vaultSync.syncNoteToMemory({
        ...ctx.note!,
        frontmatter: JSON.stringify(frontmatter)
      });
    }
  },
  metadata: {
    description: 'Automatically generates summaries for new notes',
    category: 'content-generation',
    tags: ['ai', 'automation', 'summarization']
  }
};

// ========================================================================
// Task Extraction Rules
// ========================================================================

export const extractTasksFromMeetings: AgentRule = {
  id: 'extract-meeting-tasks',
  name: 'Extract tasks from meeting notes',
  trigger: 'file:add',
  priority: 5,
  condition: async (ctx) => {
    return ctx.note?.path.includes('/meetings/') ?? false;
  },
  action: async (ctx) => {
    const content = ctx.note?.content || '';

    const tasks = await ctx.claudeClient.sendMessage(
      `Extract all action items and tasks from this meeting note.
Return as JSON array with fields: task, assignee, dueDate, priority.

Meeting note:
${content}`,
      {
        responseFormat: { type: 'json' }
      }
    );

    if (tasks.success && Array.isArray(tasks.data)) {
      // Store tasks in memory for task management
      await ctx.vaultSync.memoryClient.store(
        `tasks/${ctx.note!.path}`,
        {
          source: ctx.note!.path,
          extractedAt: new Date().toISOString(),
          tasks: tasks.data
        },
        { namespace: 'vault/tasks', ttl: 0 }
      );

      console.log(`Extracted ${tasks.data.length} tasks from ${ctx.note!.path}`);
    }
  },
  metadata: {
    description: 'Extracts action items from meeting notes',
    category: 'task-management',
    tags: ['meetings', 'tasks', 'extraction']
  }
};

// ========================================================================
// Auto-Tagging Rules
// ========================================================================

export const autoTagNotes: AgentRule = {
  id: 'auto-tag',
  name: 'Auto-tag notes with AI',
  trigger: 'file:add',
  priority: 8,
  condition: async (ctx) => {
    // Only tag markdown files without existing tags
    if (!ctx.note?.path.endsWith('.md')) return false;

    const frontmatter = ctx.note?.frontmatter
      ? JSON.parse(ctx.note.frontmatter)
      : {};

    return !frontmatter.tags || frontmatter.tags.length === 0;
  },
  action: async (ctx) => {
    const content = ctx.note?.content || '';

    const tags = await ctx.claudeClient.sendMessage(
      `Suggest 3-5 relevant tags for this note. Return only the tags as a comma-separated list.

Note content:
${content.slice(0, 500)}...`,
      {
        responseFormat: { type: 'list' },
        maxTokens: 100
      }
    );

    if (tags.success && Array.isArray(tags.data)) {
      const frontmatter = ctx.note?.frontmatter
        ? JSON.parse(ctx.note.frontmatter)
        : {};

      frontmatter.tags = tags.data;

      await ctx.vaultSync.syncNoteToMemory({
        ...ctx.note!,
        frontmatter: JSON.stringify(frontmatter)
      });

      console.log(`Auto-tagged ${ctx.note!.path} with: ${tags.data.join(', ')}`);
    }
  },
  metadata: {
    description: 'Automatically tags notes using AI',
    category: 'organization',
    tags: ['ai', 'tagging', 'organization']
  }
};

// ========================================================================
// Link Extraction Rules
// ========================================================================

export const extractLinks: AgentRule = {
  id: 'extract-links',
  name: 'Extract and validate links',
  trigger: 'file:add',
  priority: 3,
  condition: async (ctx) => {
    return ctx.note?.path.endsWith('.md') ?? false;
  },
  action: async (ctx) => {
    const content = ctx.note?.content || '';

    // Extract wikilinks
    const wikilinks = content.match(/\[\[([^\]]+)\]\]/g) || [];
    const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];

    const links = {
      wikilinks: wikilinks.map(link => link.slice(2, -2)),
      markdownLinks: markdownLinks.map(link => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        return {
          text: match?.[1] || '',
          url: match?.[2] || ''
        };
      }),
      totalLinks: wikilinks.length + markdownLinks.length
    };

    // Store in memory for link graph analysis
    await ctx.vaultSync.memoryClient.store(
      `links/${ctx.note!.path}`,
      links,
      { namespace: 'vault/links', ttl: 0 }
    );

    console.log(`Extracted ${links.totalLinks} links from ${ctx.note!.path}`);
  },
  metadata: {
    description: 'Extracts and stores note links for graph analysis',
    category: 'graph-analysis',
    tags: ['links', 'graph', 'connections']
  }
};

// ========================================================================
// Content Validation Rules
// ========================================================================

export const validateFrontmatter: AgentRule = {
  id: 'validate-frontmatter',
  name: 'Validate and fix frontmatter',
  trigger: 'file:add',
  priority: 100, // Run first
  condition: async (ctx) => {
    return ctx.note?.path.endsWith('.md') ?? false;
  },
  action: async (ctx) => {
    try {
      const frontmatter = ctx.note?.frontmatter
        ? JSON.parse(ctx.note.frontmatter)
        : {};

      let updated = false;

      // Ensure required fields
      if (!frontmatter.created) {
        frontmatter.created = ctx.note!.created_at;
        updated = true;
      }

      if (!frontmatter.modified) {
        frontmatter.modified = ctx.note!.modified_at;
        updated = true;
      }

      // Validate tags are array
      if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
        frontmatter.tags = [frontmatter.tags];
        updated = true;
      }

      // Update if needed
      if (updated) {
        await ctx.vaultSync.syncNoteToMemory({
          ...ctx.note!,
          frontmatter: JSON.stringify(frontmatter)
        });

        console.log(`Fixed frontmatter for ${ctx.note!.path}`);
      }
    } catch (error) {
      console.error(`Failed to validate frontmatter: ${error}`);
    }
  },
  metadata: {
    description: 'Validates and fixes note frontmatter',
    category: 'validation',
    tags: ['frontmatter', 'validation', 'maintenance']
  }
};

// ========================================================================
// Smart Organization Rules
// ========================================================================

export const suggestNoteLocation: AgentRule = {
  id: 'suggest-location',
  name: 'Suggest better note location',
  trigger: 'file:add',
  priority: 1,
  condition: async (ctx) => {
    // Only suggest for notes in root or inbox
    return (ctx.note?.path === `${ctx.note?.filename}` ||
            ctx.note?.path.startsWith('inbox/')) ?? false;
  },
  action: async (ctx) => {
    const content = ctx.note?.content || '';

    const suggestion = await ctx.claudeClient.sendMessage(
      `Based on this note's content, suggest the best folder location from these options:
- notes/ (general notes)
- projects/ (project-related)
- meetings/ (meeting notes)
- references/ (reference material)
- journal/ (daily journal)

Return only the folder name.

Note content:
${content.slice(0, 500)}...`,
      {
        maxTokens: 50
      }
    );

    if (suggestion.success) {
      const suggestedFolder = (suggestion.data as string).trim().replace(/\/$/, '');

      // Store suggestion in memory
      await ctx.vaultSync.memoryClient.store(
        `suggestions/${ctx.note!.path}`,
        {
          suggestedLocation: suggestedFolder,
          currentLocation: ctx.note!.path,
          suggestedAt: new Date().toISOString()
        },
        { namespace: 'vault/suggestions', ttl: 7 * 24 * 60 * 60 * 1000 } // 7 days
      );

      console.log(`Suggested moving ${ctx.note!.path} to ${suggestedFolder}/`);
    }
  },
  metadata: {
    description: 'Suggests better folder locations for notes',
    category: 'organization',
    tags: ['ai', 'organization', 'suggestions']
  }
};

// ========================================================================
// Daily Journal Rules
// ========================================================================

export const enhanceDailyNote: AgentRule = {
  id: 'enhance-daily-note',
  name: 'Enhance daily notes with context',
  trigger: 'file:add',
  priority: 7,
  condition: async (ctx) => {
    // Check if it's a daily note (YYYY-MM-DD.md pattern)
    return /\d{4}-\d{2}-\d{2}\.md$/.test(ctx.note?.path || '');
  },
  action: async (ctx) => {
    const date = new Date(ctx.note!.filename.replace('.md', ''));
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

    // Get previous day's note
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousNoteKey = `journal/${previousDate.toISOString().split('T')[0]}.md`;

    const previousNote = await ctx.vaultSync.memoryClient.retrieve(
      previousNoteKey,
      'vault/notes'
    );

    // Generate context
    const context = await ctx.claudeClient.sendMessage(
      `Generate a brief context section for today's journal entry.

Today: ${dayOfWeek}, ${date.toLocaleDateString()}
${previousNote ? `\n\nYesterday's highlights:\n${previousNote}` : ''}

Return 2-3 bullet points about what to focus on today.`,
      {
        maxTokens: 200
      }
    );

    if (context.success) {
      const frontmatter = ctx.note?.frontmatter
        ? JSON.parse(ctx.note.frontmatter)
        : {};

      frontmatter.dayOfWeek = dayOfWeek;
      frontmatter.context = context.data;

      await ctx.vaultSync.syncNoteToMemory({
        ...ctx.note!,
        frontmatter: JSON.stringify(frontmatter)
      });

      console.log(`Enhanced daily note for ${date.toLocaleDateString()}`);
    }
  },
  metadata: {
    description: 'Enhances daily journal notes with AI-generated context',
    category: 'journaling',
    tags: ['journal', 'ai', 'daily-notes']
  }
};

// ========================================================================
// Cross-Reference Rules
// ========================================================================

export const findRelatedNotes: AgentRule = {
  id: 'find-related-notes',
  name: 'Find and suggest related notes',
  trigger: 'file:add',
  priority: 2,
  condition: async (ctx) => {
    return (ctx.note?.path.endsWith('.md') &&
            (ctx.note?.content?.length || 0) > 200) ?? false;
  },
  action: async (ctx) => {
    const content = ctx.note?.content || '';

    // Get all notes from memory
    const allNotes = await ctx.vaultSync.memoryClient.search(
      '*',
      'vault/notes'
    );

    const related = await ctx.claudeClient.sendMessage(
      `Based on this note's content, which of these existing notes are most related?

Current note:
${content.slice(0, 300)}...

Existing notes:
${allNotes.slice(0, 20).map((n: any) => `- ${n.path}: ${n.title}`).join('\n')}

Return a JSON array of the top 3 most related note paths.`,
      {
        responseFormat: { type: 'json' },
        maxTokens: 200
      }
    );

    if (related.success && Array.isArray(related.data)) {
      await ctx.vaultSync.memoryClient.store(
        `related/${ctx.note!.path}`,
        {
          relatedNotes: related.data,
          analyzedAt: new Date().toISOString()
        },
        { namespace: 'vault/related', ttl: 0 }
      );

      console.log(`Found ${related.data.length} related notes for ${ctx.note!.path}`);
    }
  },
  metadata: {
    description: 'Finds and suggests related notes using AI',
    category: 'discovery',
    tags: ['ai', 'related-notes', 'discovery']
  }
};

// ========================================================================
// Export All Rules
// ========================================================================

export const allExampleRules: AgentRule[] = [
  autoSummarizeNewNotes,
  extractTasksFromMeetings,
  autoTagNotes,
  extractLinks,
  validateFrontmatter,
  suggestNoteLocation,
  enhanceDailyNote,
  findRelatedNotes
];

// ========================================================================
// Register All Examples
// ========================================================================

export function registerExampleRules(rulesEngine: any) {
  allExampleRules.forEach(rule => {
    rulesEngine.registerRule(rule);
  });

  console.log(`Registered ${allExampleRules.length} example rules`);
}
