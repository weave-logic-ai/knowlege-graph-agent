/**
 * Mock API Response Fixtures for Obsidian REST API
 * Used for testing API client behavior
 */

module.exports = {
  // Successful authentication response
  authSuccess: {
    status: 200,
    data: {
      token: 'mock-jwt-token-abc123',
      expiresIn: 3600,
      user: {
        id: 'user-123',
        vault: 'test-vault'
      }
    }
  },

  // Failed authentication response
  authFailure: {
    status: 401,
    data: {
      error: 'Invalid credentials',
      code: 'AUTH_FAILED'
    }
  },

  // Get note response
  getNoteSuccess: {
    status: 200,
    data: {
      path: 'test/note.md',
      content: '# Test Note\n\nThis is a test note.',
      metadata: {
        created: '2025-10-22T00:00:00Z',
        modified: '2025-10-22T00:00:00Z',
        tags: ['test', 'sample']
      }
    }
  },

  // Note not found
  getNoteNotFound: {
    status: 404,
    data: {
      error: 'Note not found',
      code: 'NOT_FOUND'
    }
  },

  // Create note response
  createNoteSuccess: {
    status: 201,
    data: {
      path: 'new-note.md',
      created: true,
      metadata: {
        created: '2025-10-22T00:00:00Z'
      }
    }
  },

  // Update note response
  updateNoteSuccess: {
    status: 200,
    data: {
      path: 'test/note.md',
      updated: true,
      metadata: {
        modified: '2025-10-22T00:00:00Z'
      }
    }
  },

  // Delete note response
  deleteNoteSuccess: {
    status: 204,
    data: null
  },

  // List notes response
  listNotesSuccess: {
    status: 200,
    data: {
      notes: [
        {
          path: 'note1.md',
          metadata: {
            created: '2025-10-22T00:00:00Z',
            tags: ['tag1']
          }
        },
        {
          path: 'note2.md',
          metadata: {
            created: '2025-10-22T00:00:00Z',
            tags: ['tag2']
          }
        }
      ],
      total: 2
    }
  },

  // Search response
  searchSuccess: {
    status: 200,
    data: {
      results: [
        {
          path: 'matched-note.md',
          content: '# Matched Content\n\nSearch term found here.',
          score: 0.95
        }
      ],
      total: 1
    }
  },

  // Rate limit error
  rateLimitError: {
    status: 429,
    data: {
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT',
      retryAfter: 60
    }
  },

  // Server error
  serverError: {
    status: 500,
    data: {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  },

  // Timeout simulation
  timeoutError: {
    status: 0,
    timeout: true,
    error: 'Request timeout'
  },

  // Network error
  networkError: {
    status: 0,
    error: 'Network error',
    code: 'ECONNREFUSED'
  }
};
