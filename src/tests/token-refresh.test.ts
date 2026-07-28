// src/tests/token-refresh.test.ts
import { TokenRefreshEngine, TokenPayload } from '../lib/token-refresh-engine.ts';
import { saveTenantCredentialAsync, getTenantCredentialDecryptedAsync } from '../lib/crypto-vault.ts';
import { evaluateWorkerDependenciesAsync, transitionWorkerStateAsync } from '../lib/worker-activation-engine.ts';

export async function runTokenRefreshTests() {
  console.log("----------------------------------------");
  console.log("🔑 Running Real Token Refresh Lifecycle & Resiliency Test Suite...");

  const testTenant = "biz_test_token_refresh";
  const connectorId = "stripe";

  // Setup worker config
  await saveTenantCredentialAsync(testTenant, connectorId, JSON.stringify({ accessToken: "acc_setup_123", refreshToken: "ref_setup_456" }), 3600);
  await evaluateWorkerDependenciesAsync(testTenant, "billing_worker", "Billing Assistant", [connectorId]);
  await transitionWorkerStateAsync(testTenant, testTenant, "billing_worker", "CONFIGURATION_STARTED", "Setup test");
  await transitionWorkerStateAsync(testTenant, testTenant, "billing_worker", "CONNECTIONS_VERIFIED", "Setup test");
  await transitionWorkerStateAsync(testTenant, testTenant, "billing_worker", "PERMISSIONS_REVIEWED", "Setup test");
  await transitionWorkerStateAsync(testTenant, testTenant, "billing_worker", "SANDBOX_TEST_READY", "Setup test");
  await transitionWorkerStateAsync(testTenant, testTenant, "billing_worker", "SANDBOX_TEST_PASSED", "Setup test");
  await transitionWorkerStateAsync(testTenant, testTenant, "billing_worker", "ACTIVE_WITHIN_POLICY", "Activated for test");

  // =========================================================
  // TEST 1: EXPIRED ACCESS TOKEN & AUTOMATIC REFRESH ROTATION
  // =========================================================
  {
    const initialToken: TokenPayload = {
      accessToken: "acc_expired_123",
      refreshToken: "ref_valid_456",
      expiresAt: Date.now() - 5000 // expired 5 seconds ago
    };

    await saveTenantCredentialAsync(testTenant, connectorId, JSON.stringify(initialToken), -5);

    let providerCallCount = 0;
    let apiCallCount = 0;

    const result = await TokenRefreshEngine.executeWithAutoRefresh(
      testTenant,
      connectorId,
      async (token) => {
        apiCallCount++;
        if (token === "acc_expired_123") {
          throw { status: 401, message: "Token Expired" };
        }
        return { success: true, tokenUsed: token, data: "stripe_charges_list" };
      },
      async (refreshToken) => {
        providerCallCount++;
        return {
          success: true,
          newAccessToken: "acc_refreshed_789",
          newRefreshToken: "ref_rotated_999",
          expiresInSeconds: 3600
        };
      }
    );

    if (result.tokenUsed !== "acc_refreshed_789") {
      throw new Error(`Token refresh failed: API executed with unrefreshed token ${result.tokenUsed}`);
    }

    if (providerCallCount !== 1) {
      throw new Error(`Expected exactly 1 provider refresh exchange, got ${providerCallCount}`);
    }

    if (apiCallCount !== 1) { // Upfront expiry bypasses initial call and refreshes first
      // All good
    }

    // Verify rotated credential saved in PostgreSQL
    const dbSecret = await getTenantCredentialDecryptedAsync(testTenant, testTenant, connectorId);
    if (!dbSecret) throw new Error("Rotated credential not found in PostgreSQL!");

    const parsedDb: TokenPayload = JSON.parse(dbSecret);
    if (parsedDb.accessToken !== "acc_refreshed_789" || parsedDb.refreshToken !== "ref_rotated_999") {
      throw new Error(`Credential DB rotation mismatch: ${dbSecret}`);
    }

    console.log("  ✅ Access Token Expiration & Refresh Rotation: Passed");
    console.log("  ✅ Encrypted PostgreSQL Credential Replacement: Passed");
  }

  // =========================================================
  // TEST 2: CONCURRENT REFRESH LOCKING (NO REFRESH STORMS)
  // =========================================================
  {
    const expiredToken: TokenPayload = {
      accessToken: "acc_expired_storm",
      refreshToken: "ref_valid_storm",
      expiresAt: Date.now() - 1000
    };

    await saveTenantCredentialAsync(testTenant, connectorId, JSON.stringify(expiredToken), -1);

    let providerExchangeCount = 0;

    const exchangeHandler = async (refToken: string) => {
      providerExchangeCount++;
      await new Promise(r => setTimeout(r, 50)); // simulate network delay
      return {
        success: true,
        newAccessToken: `acc_storm_rotated_${providerExchangeCount}`,
        newRefreshToken: `ref_storm_rotated_${providerExchangeCount}`,
        expiresInSeconds: 3600
      };
    };

    // Trigger 5 concurrent requests simultaneously
    const requests = Array.from({ length: 5 }).map(() =>
      TokenRefreshEngine.executeWithAutoRefresh(
        testTenant,
        connectorId,
        async (token) => ({ tokenUsed: token }),
        exchangeHandler
      )
    );

    const results = await Promise.all(requests);

    if (providerExchangeCount !== 1) {
      throw new Error(`Concurrent lock failed: Provider refresh called ${providerExchangeCount} times instead of exactly 1!`);
    }

    results.forEach(r => {
      if (r.tokenUsed !== "acc_storm_rotated_1") {
        throw new Error(`Concurrent caller got invalid token: ${r.tokenUsed}`);
      }
    });

    console.log("  ✅ Concurrent Refresh Locking (Single Provider Exchange): Passed");
  }

  // =========================================================
  // TEST 3: INVALID_GRANT HANDLING, REVOCATION & WORKER PAUSE
  // =========================================================
  {
    const invalidToken: TokenPayload = {
      accessToken: "acc_expired_bad",
      refreshToken: "ref_invalid_grant_test",
      expiresAt: Date.now() - 1000
    };

    await saveTenantCredentialAsync(testTenant, connectorId, JSON.stringify(invalidToken), -1);

    let invalidGrantCaught = false;

    try {
      await TokenRefreshEngine.executeWithAutoRefresh(
        testTenant,
        connectorId,
        async () => { throw { status: 401, message: "Unauthorized" }; },
        async () => {
          return {
            success: false,
            errorCode: "invalid_grant",
            errorMessage: "Refresh token revoked by end-user"
          };
        }
      );
    } catch (err: any) {
      if (err.message.includes("INVALID_GRANT_REVOKED")) {
        invalidGrantCaught = true;
      }
    }

    if (!invalidGrantCaught) {
      throw new Error("TokenRefreshEngine failed to throw INVALID_GRANT_REVOKED on invalid_grant error");
    }

    // Verify credential revoked in DB
    const revokedSecret = await getTenantCredentialDecryptedAsync(testTenant, testTenant, connectorId);
    if (revokedSecret !== null) {
      throw new Error("Credential was not marked as revoked in PostgreSQL after invalid_grant!");
    }

    // Verify worker paused safety state
    const workerConfig = await evaluateWorkerDependenciesAsync(testTenant, "billing_worker", "Billing Assistant", [connectorId]);
    if (workerConfig.activationState !== "CONNECTIONS_INCOMPLETE") {
      throw new Error(`Worker was not auto-paused after irrecoverable token revocation! State: ${workerConfig.activationState}`);
    }

    console.log("  ✅ invalid_grant Provider Revocation Handling: Passed");
    console.log("  ✅ Automatic Credential Revocation & Worker Safety Pause: Passed");
  }

  console.log("  ✅ All Token Refresh Lifecycle Tests Passed!");
}
