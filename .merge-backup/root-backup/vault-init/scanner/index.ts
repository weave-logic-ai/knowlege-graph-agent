/**
 * Framework scanner module for detecting project types and configurations
 * @module vault-init/scanner
 */

export {
  detectFramework,
  detectFrameworkDetailed,
  readTsConfig,
} from './framework-detector';

export type {
  FrameworkInfo,
  FrameworkType,
  PackageJson,
  TsConfig,
  DetectionResult,
} from './types';

export {
  FrameworkTypeSchema,
  FrameworkInfoSchema,
  PackageJsonSchema,
  TsConfigSchema,
  DetectionResultSchema,
  FrameworkDetectionError,
  PackageJsonError,
  FileSystemError,
} from './types';
