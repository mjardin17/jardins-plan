// src/lib/token-refresh-engine.ts
import { ConnectorId } from '../types/connector-activation.ts';
import {
  saveTenantCredentialAsync,
  getTenantCredentialDecryptedAsync,
  revokeTenantCredentialAsync
} from './crypto-vault.ts';
import { handleConnectorDisconnectedSafetyAsync, logAuditEntryAsync } from './worker-activation-engine.ts';
import { logger } from './logger.ts';
import { db } from '../db/index.ts';
import { sql } from 'drizzle-orm';

export interface TokenPayload {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in ms
  tokenType?: string;
  scope?: string;
}

export type ProviderExchangeHandler = (
  refreshToken: string,
  tenantId: string,
  connectorId: ConnectorId
) => Promise<{
  success: boolean;
  newAccessToken?: string;
  newRefreshToken?: string;
  expiresInSeconds?: number;
  errorCode?: string;
  errorMessage?: string;
}>;

// Lock map to prevent concurrent refresh storms for the same tenant + connector
const refreshLocks = new Map<string, Promise<any>>();

export class TokenRefreshEngine {
  /**
   * Acquire atomic lock for concurrent refresh requests on the same (tenantId, connectorId)
   */
  private static async executeWithLock<T>(
    lockKey: string,
    action: () => Promise<T>
  ): Promise<T> {
    while (refreshLocks.has(lockKey)) {
      try {
        await refreshLocks.get(lockKey);
      } catch (err) {
        // Ignore errors from previous refresh attempt
      }
    }

    const promise = action();
    refreshLocks.set(lockKey, promise);

    try {
      return await promise;
    } finally {
      refreshLocks.delete(lockKey);
    }
  }

  /**
   * Main token execution with auto-refresh, single-retry, rotation, and invalid_grant handling
   */
  static async executeWithAutoRefresh<T>(
    tenantId: string,
    connectorId: ConnectorId,
    apiAction: (accessToken: string) => Promise<T>,
    providerExchangeHandler?: ProviderExchangeHandler
  ): Promise<T> {
    const lockKey = `${tenantId}:::${connectorId}`;

    // 1. Fetch current decrypted credential
    const rawSecret = await getTenantCredentialDecryptedAsync(tenantId, tenantId, connectorId);
    if (!rawSecret) {
      throw new Error(`NO_CREDENTIAL: No active credential found for tenant [${tenantId}] connector [${connectorId}]`);
    }

    let parsedToken: TokenPayload;
    try {
      parsedToken = JSON.parse(rawSecret);
    } catch {
      // Simple string token without expiry envelope
      parsedToken = {
        accessToken: rawSecret,
        expiresAt: Date.now() + 3600000 // default 1 hr
      };
    }

    const now = Date.now();
    const isExpired = parsedToken.expiresAt && (now >= parsedToken.expiresAt - 10000); // 10s buffer

    // 2. If token is expired upfront, trigger refresh first
    if (isExpired && parsedToken.refreshToken) {
      parsedToken = await this.executeRefreshLock(tenantId, connectorId, parsedToken, providerExchangeHandler);
    }

    // 3. Attempt API execution
    try {
      return await apiAction(parsedToken.accessToken);
    } catch (err: any) {
      // Check if error represents 401 Unauthorized / Token Expired
      const is401 = err.status === 401 || err.statusCode === 401 || (err.message && (
        err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('token expired')
      ));

      if (is401 && parsedToken.refreshToken) {
        logger.info(`[TokenRefreshEngine] Received 401 Unauthorized for [${tenantId}/${connectorId}]. Triggering refresh exchange retry...`);

        // Perform atomic single-retry token refresh
        const refreshedToken = await this.executeRefreshLock(tenantId, connectorId, parsedToken, providerExchangeHandler);

        // Exactly ONE retry after refresh
        return await apiAction(refreshedToken.accessToken);
      }

      throw err;
    }
  }

  /**
   * Internal locked refresh executor with PostgreSQL advisory transaction lock
   */
  private static async executeRefreshLock(
    tenantId: string,
    connectorId: ConnectorId,
    currentToken: TokenPayload,
    providerExchangeHandler?: ProviderExchangeHandler
  ): Promise<TokenPayload> {
    const lockKey = `${tenantId}:::${connectorId}`;

    return await this.executeWithLock(lockKey, async () => {
      const performRefresh = async (): Promise<TokenPayload> => {
        // Re-verify if credential was refreshed by a concurrent worker/process
        const recheckedSecret = await getTenantCredentialDecryptedAsync(tenantId, tenantId, connectorId);
        if (recheckedSecret) {
          try {
            const rechecked: TokenPayload = JSON.parse(recheckedSecret);
            if (rechecked.expiresAt > Date.now() + 10000 && rechecked.accessToken !== currentToken.accessToken) {
              logger.info(`[TokenRefreshEngine] Concurrent worker/process already refreshed token for [${tenantId}/${connectorId}]. Reusing new token.`);
              return rechecked;
            }
          } catch {
            // ignore parsing error
          }
        }

        if (!currentToken.refreshToken) {
          throw new Error(`MISSING_REFRESH_TOKEN: Cannot refresh token for [${tenantId}/${connectorId}] - no refresh token available.`);
        }

        logger.info(`[TokenRefreshEngine] Executing OAuth refresh token exchange for [${tenantId}/${connectorId}]...`);

        // Default mock handler if non provided
        const exchange = providerExchangeHandler || (async (refreshToken) => {
          if (refreshToken.includes('invalid_grant') || refreshToken.includes('revoked')) {
            return {
              success: false,
              errorCode: 'invalid_grant',
              errorMessage: 'The refresh token has been revoked or expired on provider side.'
            };
          }

          const newAccess = `acc_rotated_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newRefresh = `ref_rotated_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          return {
            success: true,
            newAccessToken: newAccess,
            newRefreshToken: newRefresh,
            expiresInSeconds: 3600
          };
        });

        const result = await exchange(currentToken.refreshToken, tenantId, connectorId);

        if (!result.success) {
          if (result.errorCode === 'invalid_grant' || result.errorCode === 'unauthorized_client') {
            logger.error(`[TokenRefreshEngine] Irrecoverable invalid_grant for [${tenantId}/${connectorId}]. Revoking credential & pausing worker.`);

            // Revoke encrypted credential
            await revokeTenantCredentialAsync(tenantId, tenantId, connectorId);

            // Auto-pause dependent workers
            await handleConnectorDisconnectedSafetyAsync(tenantId, connectorId);

            // Log audit
            await logAuditEntryAsync({
              tenantId,
              actor: 'TokenRefreshEngine',
              actionType: 'CONNECTOR_REVOKED',
              targetConnectorOrWorker: connectorId,
              details: `OAuth token refresh failed with invalid_grant: ${result.errorMessage}. Credential revoked and workers paused.`,
              status: 'FAILURE'
            });

            throw new Error(`INVALID_GRANT_REVOKED: Refresh token rejected by provider for [${tenantId}/${connectorId}]: ${result.errorMessage}`);
          }

          throw new Error(`TOKEN_REFRESH_FAILED: Refresh exchange failed for [${tenantId}/${connectorId}]: ${result.errorMessage || result.errorCode}`);
        }

        // Successful token exchange & rotation
        const expiresIn = result.expiresInSeconds || 3600;
        const newExpiresAt = Date.now() + expiresIn * 1000;
        const updatedRefreshToken = result.newRefreshToken || currentToken.refreshToken; // token rotation if provided

        const updatedPayload: TokenPayload = {
          accessToken: result.newAccessToken!,
          refreshToken: updatedRefreshToken,
          expiresAt: newExpiresAt,
          tokenType: 'Bearer'
        };

        // Store rotated encrypted credential back in PostgreSQL
        await saveTenantCredentialAsync(
          tenantId,
          connectorId,
          JSON.stringify(updatedPayload),
          expiresIn
        );

        await logAuditEntryAsync({
          tenantId,
          actor: 'TokenRefreshEngine',
          actionType: 'CREDENTIAL_ROTATED',
          targetConnectorOrWorker: connectorId,
          details: `OAuth token successfully refreshed and rotated. Expires in ${expiresIn}s.`,
          status: 'SUCCESS'
        });

        return updatedPayload;
      };

      // Try executing inside PostgreSQL transaction with Advisory Lock for multi-process safety
      try {
        return await db.transaction(async (tx) => {
          try {
            await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);
          } catch (lockErr) {
            logger.warn(`[TokenRefreshEngine] Advisory lock fallback for [${lockKey}]:`, lockErr);
          }
          return await performRefresh();
        });
      } catch (dbErr: any) {
        // If error was thrown by business logic (e.g., INVALID_GRANT_REVOKED), rethrow it
        if (dbErr.message?.includes('INVALID_GRANT_REVOKED') || dbErr.message?.includes('TOKEN_REFRESH_FAILED') || dbErr.message?.includes('MISSING_REFRESH_TOKEN')) {
          throw dbErr;
        }
        logger.warn(`[TokenRefreshEngine] Transaction wrapper execution failed, falling back to direct refresh: ${dbErr.message}`);
        return await performRefresh();
      }
    });
  }
}
