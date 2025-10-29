/**
 * Type definitions for vault cultivation system
 */

export interface VaultContext {
  /** Content of primitives.md - foundational concepts */
  primitives?: string;
  /** Content of features.md - current feature set */
  features?: string;
  /** Content of tech-specs.md - technical specifications */
  techSpecs?: string;
  /** Vault root directory */
  vaultRoot: string;
  /** All markdown files in vault */
  allFiles: string[];
}

export interface DocumentMetadata {
  title?: string;
  type?: string;
  status?: string;
  tags?: string[];
  created?: string;
  updated?: string;
  phase?: string;
  priority?: string;
  [key: string]: any;
}

export interface DocumentAnalysis {
  filePath: string;
  relativePath: string;
  content: string;
  existingFrontmatter?: DocumentMetadata;
  suggestedFrontmatter: DocumentMetadata;
  needsFrontmatter: boolean;
  isModified: boolean;
  lastModified?: Date;
}

export interface DocumentGenerationRequest {
  type: 'concept' | 'feature' | 'architecture' | 'integration' | 'technical' | 'guide';
  title: string;
  description: string;
  targetPath: string;
  context: {
    primitives?: string;
    features?: string;
    techSpecs?: string;
    relatedDocs?: string[];
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface GeneratedDocument {
  type: string;
  path: string;
  title: string;
  content: string;
  frontmatter: DocumentMetadata;
  backlinks: string[];
}

export interface BacklinkInfo {
  sourceFile: string;
  targetFile: string;
  linkText: string;
  context: string;
}

export interface FooterSection {
  title: string;
  content: string;
  links: string[];
}

export interface CultivationReport {
  filesProcessed: number;
  frontmatterAdded: number;
  documentsGenerated: number;
  footersUpdated: number;
  warnings: string[];
  errors: string[];
  generatedDocuments: GeneratedDocument[];
  processingTime: number;
}

export interface AgentTask {
  id: string;
  type: 'analyze' | 'generate' | 'enhance' | 'validate';
  agent: 'researcher' | 'coder' | 'architect' | 'analyst' | 'tester';
  description: string;
  input: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface AgentOrchestrationResult {
  tasksCompleted: number;
  tasksFailed: number;
  totalTime: number;
  results: Map<string, any>;
  errors: Array<{ taskId: string; error: string }>;
}

export interface GapAnalysis {
  missingConcepts: string[];
  missingFeatures: string[];
  missingArchitecture: string[];
  missingIntegrations: string[];
  improvementAreas: string[];
  replacementNeeded: Array<{
    area: string;
    current: string;
    reason: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
}
