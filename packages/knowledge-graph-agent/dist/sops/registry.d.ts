/**
 * AI-SDLC SOP Registry
 *
 * Complete registry of all 40 AI-SDLC Standard Operating Procedures.
 * Based on https://github.com/AISDLC/AI-SDLC-SOPs
 *
 * @module sops/registry
 */
import { type SOPDefinition, SOPCategory, SOPPriority } from './types.js';
/**
 * Base URL for SOP source files
 */
export declare const SOP_SOURCE_BASE_URL = "https://github.com/AISDLC/AI-SDLC-SOPs/blob/main/sops";
/**
 * Complete SOP Registry
 *
 * All 40 AI-SDLC SOPs organized by category
 */
export declare const SOP_REGISTRY: SOPDefinition[];
/**
 * Get SOP by ID
 */
export declare function getSOPById(id: string): SOPDefinition | undefined;
/**
 * Get SOP by number
 */
export declare function getSOPByNumber(number: number): SOPDefinition | undefined;
/**
 * Get SOPs by category
 */
export declare function getSOPsByCategory(category: SOPCategory): SOPDefinition[];
/**
 * Get SOPs by priority
 */
export declare function getSOPsByPriority(priority: SOPPriority): SOPDefinition[];
/**
 * Get SOPs requiring IRB review
 */
export declare function getSOPsRequiringIRB(): SOPDefinition[];
/**
 * Get SOPs applicable to project type
 */
export declare function getSOPsForProjectType(projectType: string): SOPDefinition[];
/**
 * Search SOPs by keyword
 */
export declare function searchSOPs(keyword: string): SOPDefinition[];
/**
 * Get all SOPs
 */
export declare function getAllSOPs(): SOPDefinition[];
/**
 * Get total SOP count
 */
export declare function getSOPCount(): number;
/**
 * Alias for getSOPCount for consistency
 */
export declare function getSopCount(): number;
/**
 * Get all categories with SOPs
 */
export declare function getCategories(): SOPCategory[];
/**
 * Get SOP summary statistics
 */
export declare function getSOPStats(): {
    total: number;
    byCategory: Record<SOPCategory, number>;
    byPriority: Record<SOPPriority, number>;
    irbRequired: number;
};
//# sourceMappingURL=registry.d.ts.map