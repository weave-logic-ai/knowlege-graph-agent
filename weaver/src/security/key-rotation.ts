/**
 * API Key Rotation System
 *
 * Manages API key lifecycle:
 * - Secure key generation
 * - Multiple active keys (old + new during transition)
 * - Expiration tracking
 * - Automatic rotation reminders
 */

import { randomBytes, createHash } from 'node:crypto';
import { getAuditLogger } from './audit-logger.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;       // Store hash, never plaintext
  prefix: string;        // First 8 chars for identification
  createdAt: number;
  expiresAt: number | null;
  lastUsedAt: number | null;
  rotationDue: boolean;
  status: 'active' | 'rotating' | 'expired' | 'revoked';
  metadata: Record<string, unknown>;
}

export interface KeyRotationConfig {
  rotationIntervalDays: number;    // Default 90 days
  warningDays: number;              // Warn N days before expiration
  maxActiveKeys: number;            // Max keys during rotation
  keyLength: number;                // Length of generated keys
}

export interface KeyGenerationResult {
  id: string;
  key: string;      // Plaintext key (show once)
  prefix: string;
  expiresAt: number | null;
}

// ============================================================================
// API Key Manager Implementation
// ============================================================================

export class ApiKeyManager {
  private config: KeyRotationConfig;
  private keys = new Map<string, ApiKey>();

  constructor(config: Partial<KeyRotationConfig> = {}) {
    this.config = {
      rotationIntervalDays: config.rotationIntervalDays || 90,
      warningDays: config.warningDays || 14,
      maxActiveKeys: config.maxActiveKeys || 2,
      keyLength: config.keyLength || 32,
    };
  }

  // ============================================================================
  // Key Generation
  // ============================================================================

  /**
   * Generate a new API key
   */
  async generateKey(params: {
    name: string;
    expiresInDays?: number;
    metadata?: Record<string, unknown>;
  }): Promise<KeyGenerationResult> {
    // Generate cryptographically secure random key
    const keyBytes = randomBytes(this.config.keyLength);
    const key = `sk-${this.generateKeyString(keyBytes)}`;

    // Generate unique ID
    const id = this.generateId();

    // Calculate expiration
    const expiresAt = params.expiresInDays
      ? Date.now() + (params.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Get prefix for identification
    const prefix = key.substring(0, 11); // "sk-" + 8 chars

    // Hash the key for storage
    const keyHash = this.hashKey(key);

    // Create API key record
    const apiKey: ApiKey = {
      id,
      name: params.name,
      keyHash,
      prefix,
      createdAt: Date.now(),
      expiresAt,
      lastUsedAt: null,
      rotationDue: false,
      status: 'active',
      metadata: params.metadata || {},
    };

    this.keys.set(id, apiKey);

    // Log key generation
    const auditLogger = await getAuditLogger();
    await auditLogger.logApiKeyUsage({
      action: 'key_generated',
      keyId: id,
      result: 'success',
      metadata: {
        name: params.name,
        expiresAt,
      },
    });

    return {
      id,
      key, // Return plaintext key ONLY ONCE
      prefix,
      expiresAt,
    };
  }

  private generateKeyString(bytes: Buffer): string {
    // Convert to base62 (alphanumeric) for URL-safe keys
    const base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';

    for (const byte of bytes) {
      result += base62[byte % 62];
    }

    return result;
  }

  private generateId(): string {
    return `key_${randomBytes(16).toString('hex')}`;
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  // ============================================================================
  // Key Validation
  // ============================================================================

  /**
   * Validate an API key
   */
  async validateKey(key: string): Promise<{
    valid: boolean;
    keyId?: string;
    reason?: string;
  }> {
    const keyHash = this.hashKey(key);
    const prefix = key.substring(0, 11);

    // Find matching key
    const apiKey = Array.from(this.keys.values()).find(
      k => k.keyHash === keyHash
    );

    if (!apiKey) {
      // Log failed validation
      const auditLogger = await getAuditLogger();
      await auditLogger.logApiKeyUsage({
        action: 'key_validation',
        keyId: prefix,
        result: 'failure',
        metadata: { reason: 'key_not_found' },
      });

      return { valid: false, reason: 'Invalid API key' };
    }

    // Check if key is expired
    if (apiKey.expiresAt && Date.now() > apiKey.expiresAt) {
      apiKey.status = 'expired';

      const auditLogger = await getAuditLogger();
      await auditLogger.logApiKeyUsage({
        action: 'key_validation',
        keyId: apiKey.id,
        result: 'failure',
        metadata: { reason: 'key_expired' },
      });

      return { valid: false, reason: 'API key expired' };
    }

    // Check if key is revoked
    if (apiKey.status === 'revoked') {
      const auditLogger = await getAuditLogger();
      await auditLogger.logApiKeyUsage({
        action: 'key_validation',
        keyId: apiKey.id,
        result: 'failure',
        metadata: { reason: 'key_revoked' },
      });

      return { valid: false, reason: 'API key revoked' };
    }

    // Update last used timestamp
    apiKey.lastUsedAt = Date.now();

    // Check if rotation is due
    this.checkRotationDue(apiKey);

    // Log successful validation
    const auditLogger = await getAuditLogger();
    await auditLogger.logApiKeyUsage({
      action: 'key_validation',
      keyId: apiKey.id,
      result: 'success',
      metadata: {
        rotationDue: apiKey.rotationDue,
      },
    });

    return { valid: true, keyId: apiKey.id };
  }

  private checkRotationDue(apiKey: ApiKey): void {
    if (!apiKey.expiresAt) {
      // Check based on creation date
      const daysSinceCreation = (Date.now() - apiKey.createdAt) / (24 * 60 * 60 * 1000);
      apiKey.rotationDue = daysSinceCreation >= (this.config.rotationIntervalDays - this.config.warningDays);
    } else {
      // Check based on expiration
      const daysUntilExpiration = (apiKey.expiresAt - Date.now()) / (24 * 60 * 60 * 1000);
      apiKey.rotationDue = daysUntilExpiration <= this.config.warningDays;
    }
  }

  // ============================================================================
  // Key Rotation
  // ============================================================================

  /**
   * Start rotation process for a key
   */
  async rotateKey(keyId: string): Promise<KeyGenerationResult> {
    const oldKey = this.keys.get(keyId);

    if (!oldKey) {
      throw new Error('Key not found');
    }

    // Check if we can have another active key
    const activeKeys = Array.from(this.keys.values()).filter(
      k => k.status === 'active'
    );

    if (activeKeys.length >= this.config.maxActiveKeys) {
      throw new Error('Maximum active keys reached. Revoke old keys first.');
    }

    // Mark old key as rotating
    oldKey.status = 'rotating';

    // Generate new key
    const newKey = await this.generateKey({
      name: `${oldKey.name} (rotated)`,
      expiresInDays: this.config.rotationIntervalDays,
      metadata: {
        ...oldKey.metadata,
        rotatedFrom: keyId,
      },
    });

    // Log rotation
    const auditLogger = await getAuditLogger();
    await auditLogger.logApiKeyUsage({
      action: 'key_rotated',
      keyId: oldKey.id,
      result: 'success',
      metadata: {
        newKeyId: newKey.id,
      },
    });

    return newKey;
  }

  /**
   * Complete rotation by revoking old key
   */
  async completeRotation(oldKeyId: string): Promise<void> {
    const oldKey = this.keys.get(oldKeyId);

    if (!oldKey) {
      throw new Error('Key not found');
    }

    if (oldKey.status !== 'rotating') {
      throw new Error('Key is not in rotating status');
    }

    // Revoke old key
    await this.revokeKey(oldKeyId);
  }

  // ============================================================================
  // Key Management
  // ============================================================================

  /**
   * Revoke an API key
   */
  async revokeKey(keyId: string): Promise<void> {
    const apiKey = this.keys.get(keyId);

    if (!apiKey) {
      throw new Error('Key not found');
    }

    apiKey.status = 'revoked';

    // Log revocation
    const auditLogger = await getAuditLogger();
    await auditLogger.logApiKeyUsage({
      action: 'key_revoked',
      keyId,
      result: 'success',
      metadata: {},
    });
  }

  /**
   * List all API keys (without sensitive data)
   */
  listKeys(): Array<Omit<ApiKey, 'keyHash'>> {
    return Array.from(this.keys.values()).map(key => {
      const { keyHash, ...safeKey } = key;
      return safeKey;
    });
  }

  /**
   * Get keys that need rotation
   */
  getKeysNeedingRotation(): Array<Omit<ApiKey, 'keyHash'>> {
    return this.listKeys().filter(key => {
      if (key.status !== 'active') return false;

      // Check if rotation is due
      if (key.expiresAt) {
        const daysUntilExpiration = (key.expiresAt - Date.now()) / (24 * 60 * 60 * 1000);
        return daysUntilExpiration <= this.config.warningDays;
      }

      const daysSinceCreation = (Date.now() - key.createdAt) / (24 * 60 * 60 * 1000);
      return daysSinceCreation >= (this.config.rotationIntervalDays - this.config.warningDays);
    });
  }

  /**
   * Get key by ID (without hash)
   */
  getKey(keyId: string): Omit<ApiKey, 'keyHash'> | null {
    const key = this.keys.get(keyId);
    if (!key) return null;

    const { keyHash, ...safeKey } = key;
    return safeKey;
  }

  /**
   * Update key metadata
   */
  async updateKeyMetadata(
    keyId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const apiKey = this.keys.get(keyId);

    if (!apiKey) {
      throw new Error('Key not found');
    }

    apiKey.metadata = { ...apiKey.metadata, ...metadata };

    // Log update
    const auditLogger = await getAuditLogger();
    await auditLogger.logApiKeyUsage({
      action: 'key_metadata_updated',
      keyId,
      result: 'success',
      metadata,
    });
  }

  // ============================================================================
  // Persistence (simplified - in production use database)
  // ============================================================================

  /**
   * Export keys for persistence
   */
  exportKeys(): ApiKey[] {
    return Array.from(this.keys.values());
  }

  /**
   * Import keys from persistence
   */
  importKeys(keys: ApiKey[]): void {
    for (const key of keys) {
      this.keys.set(key.id, key);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalKeyManager: ApiKeyManager | null = null;

/**
 * Get or create the global API key manager instance
 */
export function getApiKeyManager(
  config?: Partial<KeyRotationConfig>
): ApiKeyManager {
  if (!globalKeyManager) {
    globalKeyManager = new ApiKeyManager(config);
  }

  return globalKeyManager;
}
