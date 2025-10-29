import { z } from 'zod';

/**
 * Framework types supported by the detector
 */
export const FrameworkTypeSchema = z.enum([
  'nextjs',
  'react',
  'typescript',
  'nodejs',
  'unknown',
]);

export type FrameworkType = z.infer<typeof FrameworkTypeSchema>;

/**
 * Framework information detected from project analysis
 */
export const FrameworkInfoSchema = z.object({
  type: FrameworkTypeSchema,
  version: z.string().optional(),
  features: z.array(z.string()),
  confidence: z.number().min(0).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type FrameworkInfo = z.infer<typeof FrameworkInfoSchema>;

/**
 * Package.json structure (minimal required fields)
 */
export const PackageJsonSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
  scripts: z.record(z.string()).optional(),
});

export type PackageJson = z.infer<typeof PackageJsonSchema>;

/**
 * TypeScript configuration (minimal required fields)
 */
export const TsConfigSchema = z.object({
  compilerOptions: z.record(z.unknown()).optional(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
});

export type TsConfig = z.infer<typeof TsConfigSchema>;

/**
 * Detection result with detailed information
 */
export const DetectionResultSchema = z.object({
  framework: FrameworkInfoSchema,
  packageJson: PackageJsonSchema.optional(),
  hasTypeScript: z.boolean(),
  hasTailwind: z.boolean(),
  detectedAt: z.date(),
  projectPath: z.string(),
});

export type DetectionResult = z.infer<typeof DetectionResultSchema>;

/**
 * Detection error types
 */
export class FrameworkDetectionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'FrameworkDetectionError';
  }
}

export class PackageJsonError extends FrameworkDetectionError {
  constructor(message: string, details?: unknown) {
    super(message, 'PACKAGE_JSON_ERROR', details);
    this.name = 'PackageJsonError';
  }
}

export class FileSystemError extends FrameworkDetectionError {
  constructor(message: string, details?: unknown) {
    super(message, 'FILE_SYSTEM_ERROR', details);
    this.name = 'FileSystemError';
  }
}
