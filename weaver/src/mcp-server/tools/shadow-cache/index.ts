/**
 * Shadow Cache MCP Tools
 *
 * MCP tools for querying the shadow cache (SQLite database)
 * containing vault file metadata, tags, and links.
 */

export { queryFilesTool, createQueryFilesHandler } from './query-files.js';
export { getFileTool, createGetFileHandler } from './get-file.js';
export { getFileContentTool, createGetFileContentHandler } from './get-file-content.js';

export type { QueryFilesParams } from './query-files.js';
export type { GetFileParams } from './get-file.js';
export type { GetFileContentParams } from './get-file-content.js';
