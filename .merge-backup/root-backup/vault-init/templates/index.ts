/**
 * Template system for vault initialization
 *
 * Provides flexible templates for generating vault structures
 * for different project types (Next.js, React, etc.)
 */

export * from './types.js';
export * from './nextjs-template.js';
export * from './react-template.js';
export { TemplateLoader, templateLoader } from './template-loader.js';
