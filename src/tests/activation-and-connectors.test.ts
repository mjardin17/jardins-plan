// src/tests/activation-and-connectors.test.ts
import { initializeDatabaseTables } from '../db/init.ts';
import {
  saveTenantCredentialAsync,
  getTenantCredentialDecryptedAsync,
  getTenantCredentialMetadataAsync,
  revokeTenantCredentialAsync,
  listTenantConnectedConnectorsAsync
} from '../lib/crypto-vault.ts';
import { createOAuthStateAsync, validateAndConsumeOAuthStateAsync } from '../lib/oauth-security-engine.ts';
import {
  evaluateWorkerDependenciesAsync,
  transitionWorkerStateAsync,
  handleConnectorDisconnectedSafetyAsync,
  getTenantAuditLogsAsync
} from '../lib/worker-activation-engine.ts';
import { runInboxAssistantWorkflow, approveInboxDraftAsync } from '../lib/executors/inbox-assistant-executor.ts';
import { runSchedulingAssistantWorkflow, approveAndWriteCalendarEventAsync } from '../lib/executors/scheduling-assistant-executor.ts';

export async function runActivationAndConnectorsTests(): Promise<void> {
  console.log("----------------------------------------");
  console.log("🛡️ Running Multi-Tenant Persistence & Security Tests...");

  await initializeDatabaseTables();

  const tenantA = "apex-plumbing";
  const tenantB = "ricardos-restaurant";

  // 1. Encrypted Credential Persistence & Decryption
  const rawSecret = "sk_live_stripe_secret_key_998124781923";
  const cred = await saveTenantCredentialAsync(tenantA, "stripe", rawSecret);
  if (!cred.redactedPreview || cred.redactedPreview.includes("sk_live_stripe_secret")) {
    throw new Error("Security Test Failed: Credential preview not redacted!");
  }

  const decrypted = await getTenantCredentialDecryptedAsync(tenantA, tenantA, "stripe");
  if (decrypted !== rawSecret) {
    throw new Error(`Persistence Test Failed: Decrypted credential mismatch. Expected ${rawSecret}, got ${decrypted}`);
  }

  const metadata = await getTenantCredentialMetadataAsync(tenantA, tenantA, "stripe");
  if (!metadata || metadata.connectorId !== "stripe") {
    throw new Error("Persistence Test Failed: Metadata retrieval failed.");
  }

  // 2. Multi-Tenant Cross-Tenant Security Isolation
  let crossTenantRejected = false;
  try {
    await getTenantCredentialDecryptedAsync(tenantB, tenantA, "stripe");
  } catch (err: any) {
    if (err.message.includes("SECURITY EXCEPTION") || err.message.includes("Cross-tenant")) {
      crossTenantRejected = true;
    }
  }

  if (!crossTenantRejected) {
    throw new Error("SECURITY FAILURE: Cross-tenant credential access was NOT rejected!");
  }

  // 3. OAuth Single-Use Atomic State Consumption (Replay Protection)
  const oAuthState = await createOAuthStateAsync(tenantA, "user_1", "gmail", "http://localhost:3000/oauth/callback");
  const firstConsume = await validateAndConsumeOAuthStateAsync(oAuthState.token, tenantA, "user_1");
  if (!firstConsume.success) {
    throw new Error(`OAuth Test Failed: First token consumption failed: ${firstConsume.error}`);
  }

  const secondConsume = await validateAndConsumeOAuthStateAsync(oAuthState.token, tenantA, "user_1");
  if (secondConsume.success) {
    throw new Error("SECURITY FAILURE: OAuth token consumed a second time! Replay attack vulnerability detected.");
  }

  // 4. Worker Activation State Machine & Safety Locks
  const config = await evaluateWorkerDependenciesAsync(tenantA, "test_worker_1", "Test Assistant", ["gmail", "google_calendar"]);
  if (config.missingDependencies.length === 0) {
    // Save credentials first to verify activation
    await saveTenantCredentialAsync(tenantA, "gmail", "gmail_token_123");
    await saveTenantCredentialAsync(tenantA, "google_calendar", "gcal_token_123");
  }

  await transitionWorkerStateAsync(tenantA, tenantA, "test_worker_1", "CONFIGURATION_STARTED", "Unit test start");
  await transitionWorkerStateAsync(tenantA, tenantA, "test_worker_1", "CONNECTIONS_VERIFIED", "Connections ready");

  let invalidTransitionBlocked = false;
  try {
    await transitionWorkerStateAsync(tenantA, tenantA, "test_worker_1", "ACTIVE_WITHIN_POLICY", "Invalid skip transition");
  } catch (err: any) {
    if (err.message.includes("INVALID STATE TRANSITION")) {
      invalidTransitionBlocked = true;
    }
  }

  if (!invalidTransitionBlocked) {
    throw new Error("State Machine Failure: Invalid state transition was not blocked!");
  }

  // 5. Connector Disconnection Auto-Pause Safety Lock
  await handleConnectorDisconnectedSafetyAsync(tenantA, "gmail");
  const reEvaluated = await evaluateWorkerDependenciesAsync(tenantA, "test_worker_1", "Test Assistant", ["gmail", "google_calendar"]);
  if (reEvaluated.activationState !== "CONNECTIONS_INCOMPLETE") {
    throw new Error(`Safety Lock Failure: Worker did not transition to CONNECTIONS_INCOMPLETE on loss of connector. State: ${reEvaluated.activationState}`);
  }

  // 6. Workflow Idempotency & Persistence
  const idempKey = `idemp_test_${Date.now()}`;
  const run1 = await runInboxAssistantWorkflow(tenantA, undefined, idempKey);
  const run2 = await runInboxAssistantWorkflow(tenantA, undefined, idempKey);

  if (run1.executionId !== run2.executionId) {
    throw new Error("Idempotency Test Failed: Workflow re-execution returned a different execution ID!");
  }

  const approved = await approveInboxDraftAsync(tenantA, run1.executionId);
  if (approved.approvalStatus !== "SENT_SIMULATED") {
    throw new Error("Approval Test Failed: Workflow approval status did not update to SENT_SIMULATED.");
  }

  // 7. Audit Trail Persistence in PostgreSQL
  const auditLogs = await getTenantAuditLogsAsync(tenantA, tenantA);
  if (auditLogs.length === 0) {
    throw new Error("Audit Log Test Failed: No audit log records found in PostgreSQL.");
  }

  let auditCrossTenantBlocked = false;
  try {
    await getTenantAuditLogsAsync(tenantB, tenantA);
  } catch (err: any) {
    if (err.message.includes("SECURITY EXCEPTION")) {
      auditCrossTenantBlocked = true;
    }
  }

  if (!auditCrossTenantBlocked) {
    throw new Error("SECURITY FAILURE: Cross-tenant audit log access was NOT rejected!");
  }

  console.log("  ✅ Durable PostgreSQL Credential Encryption & Redaction: Passed");
  console.log("  ✅ Strict Multi-Tenant Row-Level Isolation: Passed");
  console.log("  ✅ Atomic Single-Use OAuth Replay Attack Prevention: Passed");
  console.log("  ✅ State Machine Transition Matrix & Safety Locks: Passed");
  console.log("  ✅ Workflow Idempotency & Database Approval Gates: Passed");
  console.log("  ✅ Audit Trail Persistence & Cross-Tenant Rejection: Passed");
  console.log("  ✅ All Multi-Tenant Security & Persistence Tests Passed!");
}
