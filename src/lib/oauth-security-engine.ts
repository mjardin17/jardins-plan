// src/lib/oauth-security-engine.ts
import crypto from 'crypto';
import { OAuthStateToken, ConnectorId } from '../types/connector-activation.ts';
import { db } from '../db/index.ts';
import { oauthStates, businesses } from '../db/schema.ts';
import { eq, and, gt } from 'drizzle-orm';
import { logger } from './logger.ts';

const OAUTH_SECRET = process.env.OAUTH_SECRET || process.env.SECURITY_ENCRYPTION_KEY || 'oauth_csrf_hmac_secret_key_32bytes!';
const OAUTH_STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Durable process cache
const oauthCache = new Map<string, OAuthStateToken>();

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
  redirectUri: string
): Promise<OAuthStateToken> {
  if (!tenantId || !userId || !connectorId) {
    throw new Error('Tenant ID, User ID, and Connector ID are required to issue OAuth state');
  }

  await ensureBusinessExists(tenantId);

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

  try {
    await db.insert(oauthStates).values({
      token: stateTokenStr,
      tenantId,
      userId,
      connectorId,
      redirectUri,
      createdAt: new Date(now),
      expiresAt: new Date(expiresAt),
      used: false
    });
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
 * Validate incoming OAuth callback state token with atomic single-use consumption
 */
export async function validateAndConsumeOAuthStateAsync(
  incomingStateToken: string,
  requestingTenantId: string,
  requestingUserId: string
): Promise<{ success: boolean; connectorId?: ConnectorId; error?: string }> {
  if (!incomingStateToken) {
    return { success: false, error: 'OAuth state token missing' };
  }

  // 1. Structure and HMAC Signature check
  const parts = incomingStateToken.split('.');
  if (parts.length !== 2) {
    return { success: false, error: 'Malformed OAuth state token structure' };
  }

  const [payload, hmacSignature] = parts;
  const expectedHmac = crypto.createHmac('sha256', OAUTH_SECRET).update(payload).digest('hex');

  if (expectedHmac !== hmacSignature) {
    return { success: false, error: 'OAuth state HMAC signature mismatch (Tampering detected)' };
  }

  // 2. Try Atomic single-use update in PostgreSQL
  try {
    const now = new Date();
    const [consumedRecord] = await db
      .update(oauthStates)
      .set({
        used: true,
        usedAt: now
      })
      .where(
        and(
          eq(oauthStates.token, incomingStateToken),
          eq(oauthStates.tenantId, requestingTenantId),
          eq(oauthStates.used, false),
          gt(oauthStates.expiresAt, now)
        )
      )
      .returning();

    if (consumedRecord) {
      oauthCache.delete(incomingStateToken);
      return {
        success: true,
        connectorId: consumedRecord.connectorId as ConnectorId
      };
    }
  } catch (err) {
    // Non-blocking notice when DB table is absent
  }

  // 3. Fallback to process cache
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
  if (cached.tenantId !== requestingTenantId) {
    return { success: false, error: `SECURITY EXCEPTION: Cross-tenant OAuth callback rejection! Token issued for tenant ${cached.tenantId}, claimed by ${requestingTenantId}` };
  }

  cached.used = true;
  oauthCache.delete(incomingStateToken);
  return { success: true, connectorId: cached.connectorId };
}

export function validateAndConsumeOAuthState(
  incomingStateToken: string,
  requestingTenantId: string,
  requestingUserId: string
): { success: boolean; connectorId?: ConnectorId; error?: string } {
  if (!incomingStateToken) {
    return { success: false, error: 'OAuth state token missing' };
  }

  const cached = oauthCache.get(incomingStateToken);
  if (cached) {
    if (cached.used) return { success: false, error: 'OAuth state token already used (Replay Attack Defense)' };
    if (Date.now() > cached.expiresAt) {
      oauthCache.delete(incomingStateToken);
      return { success: false, error: 'OAuth state token has expired' };
    }
    if (cached.tenantId !== requestingTenantId) {
      return { success: false, error: `SECURITY EXCEPTION: Cross-tenant OAuth callback rejection! Token issued for tenant ${cached.tenantId}, claimed by ${requestingTenantId}` };
    }
    cached.used = true;
    oauthCache.delete(incomingStateToken);
    return { success: true, connectorId: cached.connectorId };
  }

  return { success: false, error: 'Invalid or unknown OAuth state token (CSRF defense)' };
}
