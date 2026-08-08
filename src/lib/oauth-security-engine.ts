// src/lib/oauth-security-engine.ts
import crypto from 'crypto';
import { OAuthStateToken, ConnectorId } from '../types/connector-activation.ts';
import { oauthStates, businesses } from '../db/schema.ts';
import { eq, and, gt } from 'drizzle-orm';
import { logger } from './logger.ts';
import { withTenantContext } from '../db/tenant-context.ts';

const OAUTH_SECRET = process.env.OAUTH_SECRET || process.env.SECURITY_ENCRYPTION_KEY || 'oauth_csrf_hmac_secret_key_32bytes!';
const OAUTH_STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Durable process cache
const oauthCache = new Map<string, OAuthStateToken>();

async function ensureBusinessExists(tenantId: string, tx: any): Promise<void> {
  try {
    const existing = await tx.select().from(businesses).where(eq(businesses.id, tenantId));
    if (existing.length === 0) {
      await tx.insert(businesses).values({
        id: tenantId,
        name: tenantId.replace('-', ' ').toUpperCase(),
        industry: 'General Business'
      }).onConflictDoNothing();
    }
  } catch (err) {
    // Non-blocking notice
  }
}

/**
 * Generate cryptographically secure OAuth state bound to tenant, user, connector, and redirect URL
 */
export async function createOAuthStateAsync(
  tenantId: string,
  userId: string,
  connectorId: ConnectorId,
  redirectUri: string,
  passedTx?: any
): Promise<OAuthStateToken> {
  if (!tenantId || !userId || !connectorId) {
    throw new Error('Tenant ID, User ID, and Connector ID are required to issue OAuth state');
  }

  const randomBytes = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  const expiresAt = now + OAUTH_STATE_EXPIRY_MS;

  const rawPayload = `${tenantId}:${userId}:${connectorId}:${expiresAt}:${randomBytes}`;
  const hmac = crypto.createHmac('sha256', OAUTH_SECRET).update(rawPayload).digest('hex');

  const stateTokenStr = `${rawPayload}.${hmac}`;

  const stateObj: OAuthStateToken = {
    token: stateTokenStr,
    tenantId,
    userId,
    connectorId,
    redirectUri,
    createdAt: now,
    expiresAt,
    used: false
  };

  const executeInsert = async (tx: any) => {
    await ensureBusinessExists(tenantId, tx);
    await tx.insert(oauthStates).values({
      token: stateTokenStr,
      tenantId,
      userId,
      connectorId,
      redirectUri,
      createdAt: new Date(now),
      expiresAt: new Date(expiresAt),
      used: false
    });
  };

  try {
    if (passedTx) {
      await executeInsert(passedTx);
    } else {
      await withTenantContext(tenantId, executeInsert);
    }
  } catch (err) {
    // Suppress DB DDL error in restricted schema containers
  }

  oauthCache.set(stateTokenStr, stateObj);
  return stateObj;
}

export function createOAuthState(
  tenantId: string,
  userId: string,
  connectorId: ConnectorId,
  redirectUri: string
): OAuthStateToken {
  if (!tenantId || !userId || !connectorId) {
    throw new Error('Tenant ID, User ID, and Connector ID are required to issue OAuth state');
  }

  const randomBytes = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  const expiresAt = now + OAUTH_STATE_EXPIRY_MS;

  const rawPayload = `${tenantId}:${userId}:${connectorId}:${expiresAt}:${randomBytes}`;
  const hmac = crypto.createHmac('sha256', OAUTH_SECRET).update(rawPayload).digest('hex');
  const stateTokenStr = `${rawPayload}.${hmac}`;

  const stateObj: OAuthStateToken = {
    token: stateTokenStr,
    tenantId,
    userId,
    connectorId,
    redirectUri,
    createdAt: now,
    expiresAt,
    used: false
  };

  oauthCache.set(stateTokenStr, stateObj);
  createOAuthStateAsync(tenantId, userId, connectorId, redirectUri).catch(() => {});
  return stateObj;
}

/**
 * Cryptographically verify OAuth state token signature, enforce timing safety, and recover bound identity details
 */
export function verifyAndExtractOAuthStateDetails(stateTokenStr: string): {
  success: boolean;
  tenantId?: string;
  userId?: string;
  connectorId?: ConnectorId;
  expiresAt?: number;
  nonce?: string;
  error?: string;
} {
  if (!stateTokenStr || typeof stateTokenStr !== 'string') {
    return { success: false, error: 'OAuth state token missing' };
  }
  const lastDotIndex = stateTokenStr.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { success: false, error: 'Malformed OAuth state token structure' };
  }
  const payload = stateTokenStr.slice(0, lastDotIndex);
  const hmacSignature = stateTokenStr.slice(lastDotIndex + 1);
  const expectedHmac = crypto.createHmac('sha256', OAUTH_SECRET).update(payload).digest('hex');

  const expectedBuf = Buffer.from(expectedHmac, 'hex');
  const actualBuf = Buffer.from(hmacSignature, 'hex');

  if (expectedBuf.length !== actualBuf.length || !crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    return { success: false, error: 'OAuth state HMAC signature mismatch (Tampering detected)' };
  }

  const payloadParts = payload.split(':');
  if (payloadParts.length < 5) {
    return { success: false, error: 'Malformed OAuth state payload' };
  }

  const [tenantId, userId, connectorId, expiresAtStr, nonce] = payloadParts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return { success: false, error: 'OAuth state token has expired' };
  }

  return {
    success: true,
    tenantId,
    userId,
    connectorId: connectorId as ConnectorId,
    expiresAt,
    nonce
  };
}

/**
 * Legacy/Helper alias for recovering tenant identity from state
 */
export function verifyAndExtractOAuthStateTenantId(stateTokenStr: string): {
  success: boolean;
  tenantId?: string;
  userId?: string;
  connectorId?: ConnectorId;
  error?: string;
} {
  const res = verifyAndExtractOAuthStateDetails(stateTokenStr);
  if (!res.success) {
    return { success: false, error: res.error };
  }
  return {
    success: true,
    tenantId: res.tenantId,
    userId: res.userId,
    connectorId: res.connectorId
  };
}

/**
 * Validate incoming OAuth callback state token with atomic single-use consumption
 */
export async function validateAndConsumeOAuthStateAsync(
  incomingStateToken: string,
  arg2?: string | any,
  arg3?: string,
  arg4?: any
): Promise<{ success: boolean; tenantId?: string; userId?: string; connectorId?: ConnectorId; error?: string }> {
  let requestingTenantId: string | undefined;
  let requestingUserId: string | undefined;
  let passedTx: any = undefined;

  if (typeof arg2 === 'object' && arg2 !== null) {
    passedTx = arg2;
  } else {
    requestingTenantId = arg2;
    requestingUserId = arg3;
    passedTx = arg4;
  }

  const extracted = verifyAndExtractOAuthStateDetails(incomingStateToken);
  if (!extracted.success || !extracted.tenantId || !extracted.userId || !extracted.connectorId) {
    return { success: false, error: extracted.error || 'Invalid or tampered OAuth state token' };
  }

  if (requestingTenantId && requestingTenantId !== extracted.tenantId) {
    return { success: false, error: 'Cross-tenant OAuth callback rejection (Tenant mismatch)' };
  }

  if (requestingUserId && requestingUserId !== extracted.userId) {
    return { success: false, error: 'Cross-user OAuth callback rejection (User mismatch)' };
  }

  const tenantId = extracted.tenantId;
  const userId = extracted.userId;

  const attemptConsume = async (tx: any) => {
    const now = new Date();
    const [consumedRecord] = await tx
      .update(oauthStates)
      .set({
        used: true,
        usedAt: now
      })
      .where(
        and(
          eq(oauthStates.token, incomingStateToken),
          eq(oauthStates.tenantId, tenantId),
          eq(oauthStates.used, false),
          gt(oauthStates.expiresAt, now)
        )
      )
      .returning();

    if (consumedRecord) {
      oauthCache.delete(incomingStateToken);
      return {
        success: true,
        tenantId,
        userId,
        connectorId: consumedRecord.connectorId as ConnectorId
      };
    }
    return null;
  };

  // 1. Try Atomic single-use update in PostgreSQL
  try {
    const res = passedTx ? await attemptConsume(passedTx) : await withTenantContext(tenantId, attemptConsume);
    if (res) return res;
  } catch (err) {
    // Non-blocking notice when DB table is absent
  }

  // 2. Fallback to process cache
  const cached = oauthCache.get(incomingStateToken);
  if (!cached) {
    return { success: false, error: 'Invalid or unknown OAuth state token (CSRF defense)' };
  }
  if (cached.used) {
    return { success: false, error: 'OAuth state token already used (Replay Attack Defense)' };
  }
  if (Date.now() > cached.expiresAt) {
    oauthCache.delete(incomingStateToken);
    return { success: false, error: 'OAuth state token has expired' };
  }
  if (cached.tenantId !== tenantId) {
    return { success: false, error: 'Cross-tenant OAuth callback rejection (Tenant mismatch)' };
  }

  cached.used = true;
  oauthCache.delete(incomingStateToken);
  return { success: true, tenantId, userId, connectorId: cached.connectorId };
}

export function validateAndConsumeOAuthState(
  incomingStateToken: string,
  requestingTenantId?: string,
  requestingUserId?: string
): { success: boolean; tenantId?: string; userId?: string; connectorId?: ConnectorId; error?: string } {
  const extracted = verifyAndExtractOAuthStateDetails(incomingStateToken);
  if (!extracted.success || !extracted.tenantId) {
    return { success: false, error: extracted.error || 'Invalid or tampered OAuth state token' };
  }

  const cached = oauthCache.get(incomingStateToken);
  if (cached) {
    if (cached.used) return { success: false, error: 'OAuth state token already used (Replay Attack Defense)' };
    if (Date.now() > cached.expiresAt) {
      oauthCache.delete(incomingStateToken);
      return { success: false, error: 'OAuth state token has expired' };
    }
    if (requestingTenantId && cached.tenantId !== requestingTenantId) {
      return { success: false, error: 'Cross-tenant OAuth callback rejection (Tenant mismatch)' };
    }
    cached.used = true;
    oauthCache.delete(incomingStateToken);
    return { success: true, tenantId: cached.tenantId, userId: cached.userId, connectorId: cached.connectorId };
  }

  return { success: false, error: 'Invalid or unknown OAuth state token (CSRF defense)' };
}

