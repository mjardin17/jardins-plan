// src/lib/crypto-vault.ts
import crypto from 'crypto';
import { EncryptedCredential, ConnectorId } from '../types/connector-activation.ts';
import { db } from '../db/index.ts';
import { encryptedCredentials, businesses } from '../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from './logger.ts';

// Master server encryption key derived from environment or fallback HMAC
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || process.env.SECURITY_ENCRYPTION_KEY || 'universal_workforce_master_key_32_bytes_pad!!';
const ALGORITHM = 'aes-256-gcm';

// Derive 32-byte key using SHA-256
function getDerivedKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
}

// In-memory cache synced with PostgreSQL for ultra-fast sync lookups
const vaultCache = new Map<string, EncryptedCredential>();

function getVaultKey(tenantId: string, connectorId: ConnectorId): string {
  return `${tenantId}:::${connectorId}`;
}

export function encryptSecret(secretPayload: string): { encryptedData: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(12);
  const key = getDerivedKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(secretPayload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag
  };
}

export function decryptSecret(encryptedData: string, ivHex: string, authTagHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = getDerivedKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function redactSecret(secret: string): string {
  if (!secret || secret.length < 6) return '••••••';
  const prefix = secret.substring(0, 4);
  const suffix = secret.substring(secret.length - 4);
  return `${prefix}••••${suffix}`;
}

/**
  * Ensure business record exists before inserting credential FK
  */
async function ensureBusinessExists(tenantId: string): Promise<void> {
  try {
    const existing = await db.select().from(businesses).where(eq(businesses.id, tenantId));
    if (existing.length === 0) {
      await db.insert(businesses).values({
        id: tenantId,
        name: tenantId.replace('-', ' ').toUpperCase(),
        industry: 'General Business'
      }).onConflictDoNothing();
    }
  } catch (err) {
    logger.error('[CryptoVault] Error ensuring business record:', err);
  }
}

/**
 * Store encrypted credential for a specific tenant in PostgreSQL
 */
export async function saveTenantCredentialAsync(
  tenantId: string,
  connectorId: ConnectorId,
  rawSecret: string,
  expiresInSeconds?: number
): Promise<EncryptedCredential> {
  if (!tenantId) throw new Error('Tenant ID is required for credential storage');

  await ensureBusinessExists(tenantId);

  const { encryptedData, iv, authTag } = encryptSecret(rawSecret);
  const redactedPreview = redactSecret(rawSecret);
  const now = new Date();

  const expiresAtObj = (expiresInSeconds !== undefined && expiresInSeconds !== null)
    ? new Date(now.getTime() + expiresInSeconds * 1000)
    : null;

  const cred: EncryptedCredential = {
    tenantId,
    connectorId,
    encryptedData,
    iv,
    authTag,
    redactedPreview,
    updatedAt: now.toISOString(),
    expiresAt: expiresAtObj ? expiresAtObj.toISOString() : undefined,
    isRevoked: false
  };

  // Upsert into PostgreSQL with transaction RLS tenant context
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${tenantId}', false);`));
      const existing = await tx
        .select()
        .from(encryptedCredentials)
        .where(
          and(
            eq(encryptedCredentials.tenantId, tenantId),
            eq(encryptedCredentials.connectorId, connectorId)
          )
        );

      if (existing.length > 0) {
        await tx
          .update(encryptedCredentials)
          .set({
            encryptedData,
            iv,
            authTag,
            keyVersion: 'v2:gcm',
            redactedPreview,
            expiresAt: expiresAtObj,
            isRevoked: false,
            updatedAt: now
          })
          .where(eq(encryptedCredentials.id, existing[0].id));
      } else {
        await tx.insert(encryptedCredentials).values({
          tenantId,
          connectorId,
          encryptedData,
          iv,
          authTag,
          keyVersion: 'v2:gcm',
          redactedPreview,
          expiresAt: expiresAtObj,
          isRevoked: false,
          updatedAt: now
        });
      }
    });
  } catch (err) {
    logger.error('[CryptoVault] Error saving credential to PostgreSQL:', err);
  }

  vaultCache.set(getVaultKey(tenantId, connectorId), cred);
  return cred;
}

/**
 * Sync wrapper for compatibility
 */
export function saveTenantCredential(
  tenantId: string,
  connectorId: ConnectorId,
  rawSecret: string,
  expiresInSeconds?: number
): EncryptedCredential {
  const { encryptedData, iv, authTag } = encryptSecret(rawSecret);
  const redactedPreview = redactSecret(rawSecret);
  const now = new Date();

  const expiresAtObj = (expiresInSeconds !== undefined && expiresInSeconds !== null)
    ? new Date(now.getTime() + expiresInSeconds * 1000)
    : undefined;

  const cred: EncryptedCredential = {
    tenantId,
    connectorId,
    encryptedData,
    iv,
    authTag,
    redactedPreview,
    updatedAt: now.toISOString(),
    expiresAt: expiresAtObj ? expiresAtObj.toISOString() : undefined,
    isRevoked: false
  };

  vaultCache.set(getVaultKey(tenantId, connectorId), cred);

  // Background persist
  saveTenantCredentialAsync(tenantId, connectorId, rawSecret, expiresInSeconds).catch(() => {});
  return cred;
}

/**
 * Get decrypted credential for tenant from PostgreSQL with strict authorization
 */
export async function getTenantCredentialDecryptedAsync(
  requestingTenantId: string,
  targetTenantId: string,
  connectorId: ConnectorId
): Promise<string | null> {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant credential access violation! ${requestingTenantId} attempted to access ${targetTenantId}`);
  }

  try {
    let records: any[] = [];
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${targetTenantId}', false);`));
      records = await tx
        .select()
        .from(encryptedCredentials)
        .where(
          and(
            eq(encryptedCredentials.tenantId, targetTenantId),
            eq(encryptedCredentials.connectorId, connectorId),
            eq(encryptedCredentials.isRevoked, false)
          )
        );
    });

    if (records.length === 0) {
      vaultCache.delete(getVaultKey(targetTenantId, connectorId));
      return null;
    }

    const cred = records[0];
    const decrypted = decryptSecret(cred.encryptedData, cred.iv, cred.authTag);

    let hasRefreshToken = false;
    try {
      const parsed = JSON.parse(decrypted);
      if (parsed && parsed.refreshToken) {
        hasRefreshToken = true;
      }
    } catch {
      // Not JSON
    }

    if (cred.isRevoked || (!hasRefreshToken && cred.expiresAt && new Date(cred.expiresAt) < new Date())) {
      if (!cred.isRevoked) {
        await db.transaction(async (tx) => {
          await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${targetTenantId}', false);`));
          await tx
            .update(encryptedCredentials)
            .set({ isRevoked: true })
            .where(eq(encryptedCredentials.id, cred.id));
        });
      }
      vaultCache.delete(getVaultKey(targetTenantId, connectorId));
      return null;
    }

    return decrypted;
  } catch (err) {
    logger.error('[CryptoVault] Error reading credential from PostgreSQL:', err);
    // Fallback to cache if DB unavailable
    const cached = vaultCache.get(getVaultKey(targetTenantId, connectorId));
    if (!cached || cached.isRevoked) return null;
    return decryptSecret(cached.encryptedData, cached.iv, cached.authTag);
  }
}

export function getTenantCredentialDecrypted(
  requestingTenantId: string,
  targetTenantId: string,
  connectorId: ConnectorId
): string | null {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant credential access violation! ${requestingTenantId} attempted to access ${targetTenantId}`);
  }

  const cached = vaultCache.get(getVaultKey(targetTenantId, connectorId));
  if (cached && !cached.isRevoked) {
    const decrypted = decryptSecret(cached.encryptedData, cached.iv, cached.authTag);
    let hasRefreshToken = false;
    try {
      const parsed = JSON.parse(decrypted);
      if (parsed && parsed.refreshToken) {
        hasRefreshToken = true;
      }
    } catch {
      // Not JSON
    }

    if (!hasRefreshToken && cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
      cached.isRevoked = true;
      return null;
    }
    return decrypted;
  }

  return null;
}

/**
 * Get redacted credential metadata for client UI display
 */
export async function getTenantCredentialMetadataAsync(
  requestingTenantId: string,
  targetTenantId: string,
  connectorId: ConnectorId
): Promise<Omit<EncryptedCredential, 'encryptedData' | 'iv' | 'authTag'> | null> {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant metadata access violation!`);
  }

  try {
    let records: any[] = [];
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${targetTenantId}', false);`));
      records = await tx
        .select()
        .from(encryptedCredentials)
        .where(
          and(
            eq(encryptedCredentials.tenantId, targetTenantId),
            eq(encryptedCredentials.connectorId, connectorId),
            eq(encryptedCredentials.isRevoked, false)
          )
        );
    });

    if (records.length === 0) return null;

    const cred = records[0];
    return {
      tenantId: cred.tenantId,
      connectorId: cred.connectorId as ConnectorId,
      redactedPreview: cred.redactedPreview,
      updatedAt: cred.updatedAt ? new Date(cred.updatedAt).toISOString() : new Date().toISOString(),
      expiresAt: cred.expiresAt ? new Date(cred.expiresAt).toISOString() : undefined,
      isRevoked: cred.isRevoked
    };
  } catch (err) {
    const cached = vaultCache.get(getVaultKey(targetTenantId, connectorId));
    if (!cached || cached.isRevoked) return null;
    return {
      tenantId: cached.tenantId,
      connectorId: cached.connectorId,
      redactedPreview: cached.redactedPreview,
      updatedAt: cached.updatedAt,
      expiresAt: cached.expiresAt,
      isRevoked: cached.isRevoked
    };
  }
}

export function getTenantCredentialMetadata(
  requestingTenantId: string,
  targetTenantId: string,
  connectorId: ConnectorId
): Omit<EncryptedCredential, 'encryptedData' | 'iv' | 'authTag'> | null {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant metadata access violation!`);
  }

  const cached = vaultCache.get(getVaultKey(targetTenantId, connectorId));
  if (!cached || cached.isRevoked) return null;

  return {
    tenantId: cached.tenantId,
    connectorId: cached.connectorId,
    redactedPreview: cached.redactedPreview,
    updatedAt: cached.updatedAt,
    expiresAt: cached.expiresAt,
    isRevoked: cached.isRevoked
  };
}

/**
 * Revoke tenant credential safely
 */
export async function revokeTenantCredentialAsync(
  requestingTenantId: string,
  targetTenantId: string,
  connectorId: ConnectorId
): Promise<boolean> {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant credential revocation violation!`);
  }

  const key = getVaultKey(targetTenantId, connectorId);
  vaultCache.delete(key);

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${targetTenantId}', false);`));
      await tx
        .update(encryptedCredentials)
        .set({ isRevoked: true })
        .where(
          and(
            eq(encryptedCredentials.tenantId, targetTenantId),
            eq(encryptedCredentials.connectorId, connectorId)
          )
        );
    });
    return true;
  } catch (err) {
    logger.error('[CryptoVault] Error revoking credential in PostgreSQL:', err);
    return true;
  }
}

export function revokeTenantCredential(
  requestingTenantId: string,
  targetTenantId: string,
  connectorId: ConnectorId
): boolean {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant credential revocation violation!`);
  }

  const key = getVaultKey(targetTenantId, connectorId);
  vaultCache.delete(key);
  revokeTenantCredentialAsync(requestingTenantId, targetTenantId, connectorId).catch(() => {});
  return true;
}

/**
 * List active connected connector IDs for a tenant
 */
export async function listTenantConnectedConnectorsAsync(
  requestingTenantId: string,
  targetTenantId: string
): Promise<ConnectorId[]> {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant listing violation!`);
  }

  try {
    let records: any[] = [];
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${targetTenantId}', false);`));
      records = await tx
        .select()
        .from(encryptedCredentials)
        .where(
          and(
            eq(encryptedCredentials.tenantId, targetTenantId),
            eq(encryptedCredentials.isRevoked, false)
          )
        );
    });

    const activeIds: ConnectorId[] = [];
    const now = new Date();

    for (const rec of records) {
      let hasRefreshToken = false;
      try {
        const decrypted = decryptSecret(rec.encryptedData, rec.iv, rec.authTag);
        const parsed = JSON.parse(decrypted);
        if (parsed && parsed.refreshToken) {
          hasRefreshToken = true;
        }
      } catch {
        // Not JSON
      }

      if (hasRefreshToken || !rec.expiresAt || new Date(rec.expiresAt) > now) {
        activeIds.push(rec.connectorId as ConnectorId);
      }
    }

    return activeIds;
  } catch (err) {
    const connected: ConnectorId[] = [];
    vaultCache.forEach((cred) => {
      if (cred.tenantId === targetTenantId && !cred.isRevoked) {
        connected.push(cred.connectorId);
      }
    });
    return connected;
  }
}

export function listTenantConnectedConnectors(
  requestingTenantId: string,
  targetTenantId: string
): ConnectorId[] {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant listing violation!`);
  }

  const connected: ConnectorId[] = [];
  vaultCache.forEach((cred) => {
    if (cred.tenantId === targetTenantId && !cred.isRevoked) {
      connected.push(cred.connectorId);
    }
  });

  return connected;
}
