import { z } from "zod";
const ConfigSchema = z.object({
  // Project settings
  projectRoot: z.string().default("."),
  docsRoot: z.string().default("./docs"),
  vaultName: z.string().optional(),
  // Graph settings
  graph: z.object({
    includePatterns: z.array(z.string()).default(["**/*.md"]),
    excludePatterns: z.array(z.string()).default([
      "node_modules/**",
      "dist/**",
      ".git/**"
    ]),
    maxDepth: z.number().default(10)
  }).default({}),
  // Database settings
  database: z.object({
    path: z.string().default("./.kg/knowledge.db"),
    enableWAL: z.boolean().default(true)
  }).default({}),
  // Claude-Flow integration
  claudeFlow: z.object({
    enabled: z.boolean().default(true),
    namespace: z.string().default("knowledge-graph"),
    syncOnChange: z.boolean().default(true)
  }).default({}),
  // Templates
  templates: z.object({
    customPath: z.string().optional(),
    defaultType: z.enum(["concept", "technical", "feature", "primitive", "service", "guide", "standard", "integration"]).default("concept")
  }).default({})
});
export {
  ConfigSchema
};
//# sourceMappingURL=types.js.map
