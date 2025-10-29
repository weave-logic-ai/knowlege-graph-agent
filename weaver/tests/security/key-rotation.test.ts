/**
 * Tests for API Key Rotation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ApiKeyManager } from '../../src/security/key-rotation.js';

describe('ApiKeyManager', () => {
  let manager: ApiKeyManager;

  beforeEach(() => {
    manager = new ApiKeyManager({
      rotationIntervalDays: 90,
      warningDays: 14,
      maxActiveKeys: 2,
      keyLength: 32,
    });
  });

  it('should generate API keys', async () => {
    const result = await manager.generateKey({
      name: 'test-key',
      expiresInDays: 90,
    });

    expect(result.id).toBeTruthy();
    expect(result.key).toMatch(/^sk-/);
    expect(result.prefix).toBe(result.key.substring(0, 11));
    expect(result.expiresAt).toBeTruthy();
  });

  it('should validate API keys', async () => {
    const { key } = await manager.generateKey({
      name: 'test-key',
    });

    const validation = await manager.validateKey(key);
    expect(validation.valid).toBe(true);
    expect(validation.keyId).toBeTruthy();
  });

  it('should reject invalid API keys', async () => {
    const validation = await manager.validateKey('invalid-key');
    expect(validation.valid).toBe(false);
    expect(validation.reason).toBeTruthy();
  });

  it('should reject expired API keys', async () => {
    const { key } = await manager.generateKey({
      name: 'test-key',
      expiresInDays: -1, // Already expired
    });

    const validation = await manager.validateKey(key);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain('expired');
  });

  it('should list all API keys', async () => {
    await manager.generateKey({ name: 'key-1' });
    await manager.generateKey({ name: 'key-2' });

    const keys = manager.listKeys();
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toHaveProperty('keyHash');
  });

  it('should rotate API keys', async () => {
    const { id: oldKeyId } = await manager.generateKey({
      name: 'test-key',
    });

    const newKey = await manager.rotateKey(oldKeyId);
    expect(newKey.id).not.toBe(oldKeyId);

    const oldKey = manager.getKey(oldKeyId);
    expect(oldKey?.status).toBe('rotating');
  });

  it('should complete rotation', async () => {
    const { id: oldKeyId } = await manager.generateKey({
      name: 'test-key',
    });

    await manager.rotateKey(oldKeyId);
    await manager.completeRotation(oldKeyId);

    const oldKey = manager.getKey(oldKeyId);
    expect(oldKey?.status).toBe('revoked');
  });

  it('should revoke API keys', async () => {
    const { key, id } = await manager.generateKey({
      name: 'test-key',
    });

    await manager.revokeKey(id);

    const validation = await manager.validateKey(key);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain('revoked');
  });

  it('should identify keys needing rotation', async () => {
    // Create key that expires soon
    await manager.generateKey({
      name: 'expiring-soon',
      expiresInDays: 7, // Within warning period
    });

    // Create key that doesn't need rotation
    await manager.generateKey({
      name: 'fresh-key',
      expiresInDays: 90,
    });

    const keysNeedingRotation = manager.getKeysNeedingRotation();
    expect(keysNeedingRotation).toHaveLength(1);
    expect(keysNeedingRotation[0].name).toBe('expiring-soon');
  });

  it('should update key metadata', async () => {
    const { id } = await manager.generateKey({
      name: 'test-key',
    });

    await manager.updateKeyMetadata(id, {
      lastUsedBy: 'user123',
      purpose: 'testing',
    });

    const key = manager.getKey(id);
    expect(key?.metadata).toMatchObject({
      lastUsedBy: 'user123',
      purpose: 'testing',
    });
  });

  it('should enforce max active keys limit', async () => {
    await manager.generateKey({ name: 'key-1' });
    await manager.generateKey({ name: 'key-2' });

    // Third key should fail (max is 2)
    await expect(
      manager.generateKey({ name: 'key-3' })
    ).rejects.toThrow();
  });

  it('should export and import keys', async () => {
    await manager.generateKey({ name: 'key-1' });
    await manager.generateKey({ name: 'key-2' });

    const exported = manager.exportKeys();
    expect(exported).toHaveLength(2);

    const newManager = new ApiKeyManager();
    newManager.importKeys(exported);

    const imported = newManager.listKeys();
    expect(imported).toHaveLength(2);
  });
});

describe('ApiKeyManager Security', () => {
  let manager: ApiKeyManager;

  beforeEach(() => {
    manager = new ApiKeyManager();
  });

  it('should not expose key hash in list', async () => {
    await manager.generateKey({ name: 'test-key' });

    const keys = manager.listKeys();
    keys.forEach(key => {
      expect(key).not.toHaveProperty('keyHash');
    });
  });

  it('should generate unique keys', async () => {
    const key1 = await manager.generateKey({ name: 'key-1' });
    const key2 = await manager.generateKey({ name: 'key-2' });

    expect(key1.key).not.toBe(key2.key);
    expect(key1.id).not.toBe(key2.id);
  });

  it('should generate cryptographically secure keys', async () => {
    const { key } = await manager.generateKey({ name: 'test-key' });

    // Key should be sufficiently long and random
    expect(key.length).toBeGreaterThan(30);
    expect(key).toMatch(/^sk-[a-zA-Z0-9]+$/);
  });
});
