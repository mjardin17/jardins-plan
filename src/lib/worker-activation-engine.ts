// src/lib/worker-activation-engine.ts
import {
  ActivationState,
  ApprovalPolicyLevel,
  WorkerDependencyConfig,
  ConnectorId,
  AuditTrailEntry
} from '../types/connector-activation.ts';
import { getConnectorById } from './connector-registry.ts';
import { listTenantConnectedConnectors, listTenantConnectedConnectorsAsync } from './crypto-vault.ts';
import { db } from '../db/index.ts';
import { workerConfigurations, auditEvents, businesses } from '../db/schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger } from './logger.ts';

// In-memory fallback cache
const workerConfigsCache = new Map<string, WorkerDependencyConfig>();
const auditTrailCache: AuditTrailEntry[] = [];

function getWorkerKey(tenantId: string, workerId: string): string {
  return `${tenantId}:::${workerId}`;
}

export const VALID_ACTIVATION_TRANSITIONS: Record<ActivationState, ActivationState[]> = {
  RECOMMENDED: ['CONFIGURATION_STARTED', 'DISABLED'],
  CONFIGURATION_STARTED: ['CONNECTIONS_INCOMPLETE', 'CONNECTIONS_VERIFIED', 'DISABLED'],
  CONNECTIONS_INCOMPLETE: ['CONNECTIONS_VERIFIED', 'CONFIGURATION_STARTED', 'DISABLED'],
  CONNECTIONS_VERIFIED: ['PERMISSIONS_REVIEWED', 'PAUSED', 'DISABLED'],
  PERMISSIONS_REVIEWED: ['SANDBOX_TEST_READY', 'DISABLED'],
  SANDBOX_TEST_READY: ['SANDBOX_TEST_PASSED', 'ERROR', 'DISABLED'],
  SANDBOX_TEST_PASSED: ['OWNER_APPROVAL_REQUIRED', 'ACTIVE_WITH_APPROVALS', 'ACTIVE_WITHIN_POLICY', 'DISABLED'],
  OWNER_APPROVAL_REQUIRED: ['ACTIVE_WITH_APPROVALS', 'ACTIVE_WITHIN_POLICY', 'DISABLED'],
  ACTIVE_WITH_APPROVALS: ['PAUSED', 'ACTIVE_WITHIN_POLICY', 'ERROR', 'DISABLED', 'CONFIGURATION_STARTED'],
  ACTIVE_WITHIN_POLICY: ['PAUSED', 'ACTIVE_WITH_APPROVALS', 'ERROR', 'DISABLED', 'CONFIGURATION_STARTED'],
  PAUSED: ['ACTIVE_WITH_APPROVALS', 'ACTIVE_WITHIN_POLICY', 'CONNECTIONS_INCOMPLETE', 'DISABLED', 'CONFIGURATION_STARTED'],
  ERROR: ['CONFIGURATION_STARTED', 'CONNECTIONS_INCOMPLETE', 'PAUSED', 'DISABLED'],
  DISABLED: ['RECOMMENDED', 'CONFIGURATION_STARTED']
};

/**
 * Ensure business record exists before inserting audit event or worker config
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
    logger.error('[WorkerEngine] Error ensuring business record:', err);
  }
}

/**
 * Log audit trail entry with tenant isolation to PostgreSQL
 */
export async function logAuditEntryAsync(entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): Promise<AuditTrailEntry> {
  await ensureBusinessExists(entry.tenantId);

  const fullEntry: AuditTrailEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${fullEntry.tenantId}', false);`));
      await tx.insert(auditEvents).values({
        id: fullEntry.id,
        tenantId: fullEntry.tenantId,
        actor: fullEntry.actor,
        actionType: fullEntry.actionType,
        targetConnectorOrWorker: fullEntry.targetConnectorOrWorker,
        details: fullEntry.details,
        status: fullEntry.status,
        externalRefId: fullEntry.externalRefId || null,
        timestamp: new Date(fullEntry.timestamp)
      });
    });
  } catch (err) {
    logger.error('[WorkerEngine] Error inserting audit event into PostgreSQL:', err);
  }

  auditTrailCache.push(fullEntry);
  return fullEntry;
}

export function logAuditEntry(entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): AuditTrailEntry {
  const fullEntry: AuditTrailEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry
  };
  auditTrailCache.push(fullEntry);
  logAuditEntryAsync(entry).catch(() => {});
  return fullEntry;
}

/**
 * Get Tenant Audit Logs from PostgreSQL with strict tenant authorization
 */
export async function getTenantAuditLogsAsync(requestingTenantId: string, targetTenantId: string): Promise<AuditTrailEntry[]> {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant audit trail access violation!`);
  }

  try {
    let records: any[] = [];
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${targetTenantId}', false);`));
      records = await tx
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.tenantId, targetTenantId))
        .orderBy(desc(auditEvents.timestamp))
        .limit(200);
    });

    return records.map(r => ({
      id: r.id,
      tenantId: r.tenantId,
      actor: r.actor,
      actionType: r.actionType as any,
      targetConnectorOrWorker: r.targetConnectorOrWorker,
      details: r.details,
      status: r.status as any,
      timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
      externalRefId: r.externalRefId || undefined
    }));
  } catch (err) {
    logger.error('[WorkerEngine] Error fetching audit logs from PostgreSQL:', err);
    return auditTrailCache.filter(a => a.tenantId === targetTenantId);
  }
}

export function getTenantAuditLogs(requestingTenantId: string, targetTenantId: string): AuditTrailEntry[] {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant audit trail access violation!`);
  }
  return auditTrailCache.filter(a => a.tenantId === targetTenantId);
}

/**
 * Evaluate worker dependencies and missing connectors in PostgreSQL
 */
export async function evaluateWorkerDependenciesAsync(
  tenantId: string,
  workerId: string,
  workerRole: string,
  requiredConnectorIds: ConnectorId[]
): Promise<WorkerDependencyConfig> {
  await ensureBusinessExists(tenantId);

  const activeConnectors = await listTenantConnectedConnectorsAsync(tenantId, tenantId);
  const missing = requiredConnectorIds.filter(cId => !activeConnectors.includes(cId));

  const key = getWorkerKey(tenantId, workerId);
  let existingInDb: any = null;

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${tenantId}', false);`));
      const records = await tx
        .select()
        .from(workerConfigurations)
        .where(
          and(
            eq(workerConfigurations.tenantId, tenantId),
            eq(workerConfigurations.workerId, workerId)
          )
        );
      if (records.length > 0) existingInDb = records[0];
    });
  } catch (err) {
    // Non-blocking notice
  }

  const cached = workerConfigsCache.get(key);

  const blockers: string[] = [];
  missing.forEach(cId => {
    const conn = getConnectorById(cId);
    blockers.push(`Missing required connection: ${conn?.name || cId}`);
  });

  let currentState: ActivationState = existingInDb
    ? (existingInDb.activationState as ActivationState)
    : (cached ? cached.activationState : 'RECOMMENDED');

  if (missing.length > 0 && (currentState === 'ACTIVE_WITH_APPROVALS' || currentState === 'ACTIVE_WITHIN_POLICY' || currentState === 'CONNECTIONS_VERIFIED')) {
    currentState = 'CONNECTIONS_INCOMPLETE';
  }

  const stateHistory = existingInDb ? (existingInDb.stateHistory as any[]) : [{ state: currentState, timestamp: new Date().toISOString(), reason: 'Initial evaluation' }];

  const config: WorkerDependencyConfig = {
    workerId,
    workerRole,
    tenantId,
    requiredConnectorIds,
    optionalConnectorIds: [],
    requiredReadScopes: ['read_basic'],
    requiredWriteScopes: ['write_draft'],
    approvalPolicy: (existingInDb?.approvalPolicy as ApprovalPolicyLevel) || 'ALWAYS_ASK',
    activationState: currentState,
    stateHistory,
    missingDependencies: missing,
    activationBlockers: blockers,
    lastExecutionAt: existingInDb?.lastExecutionAt ? new Date(existingInDb.lastExecutionAt).toISOString() : undefined
  };

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${tenantId}', false);`));
      if (existingInDb) {
        await tx
          .update(workerConfigurations)
          .set({
            workerRole,
            activationState: currentState,
            requiredConnectors: requiredConnectorIds,
            missingDependencies: missing,
            activationBlockers: blockers,
            stateHistory,
            updatedAt: new Date()
          })
          .where(eq(workerConfigurations.id, existingInDb.id));
      } else {
        await tx.insert(workerConfigurations).values({
          tenantId,
          workerId,
          workerRole,
          activationState: currentState,
          approvalPolicy: 'ALWAYS_ASK',
          requiredConnectors: requiredConnectorIds,
          missingDependencies: missing,
          activationBlockers: blockers,
          stateHistory,
          updatedAt: new Date()
        });
      }
    });
  } catch (err) {
    logger.error('[WorkerEngine] Error saving worker config to PostgreSQL:', err);
  }

  workerConfigsCache.set(key, config);
  return config;
}

export function evaluateWorkerDependencies(
  tenantId: string,
  workerId: string,
  workerRole: string,
  requiredConnectorIds: ConnectorId[]
): WorkerDependencyConfig {
  const activeConnectors = listTenantConnectedConnectors(tenantId, tenantId);
  const missing = requiredConnectorIds.filter(cId => !activeConnectors.includes(cId));

  const key = getWorkerKey(tenantId, workerId);
  let existing = workerConfigsCache.get(key);

  const blockers: string[] = [];
  missing.forEach(cId => {
    const conn = getConnectorById(cId);
    blockers.push(`Missing required connection: ${conn?.name || cId}`);
  });

  let currentState: ActivationState = existing ? existing.activationState : 'RECOMMENDED';

  if (missing.length > 0 && (currentState === 'ACTIVE_WITH_APPROVALS' || currentState === 'ACTIVE_WITHIN_POLICY' || currentState === 'CONNECTIONS_VERIFIED')) {
    currentState = 'CONNECTIONS_INCOMPLETE';
  }

  const config: WorkerDependencyConfig = {
    workerId,
    workerRole,
    tenantId,
    requiredConnectorIds,
    optionalConnectorIds: [],
    requiredReadScopes: ['read_basic'],
    requiredWriteScopes: ['write_draft'],
    approvalPolicy: existing?.approvalPolicy || 'ALWAYS_ASK',
    activationState: currentState,
    stateHistory: existing?.stateHistory || [{ state: currentState, timestamp: new Date().toISOString(), reason: 'Initial evaluation' }],
    missingDependencies: missing,
    activationBlockers: blockers,
    lastExecutionAt: existing?.lastExecutionAt
  };

  workerConfigsCache.set(key, config);
  evaluateWorkerDependenciesAsync(tenantId, workerId, workerRole, requiredConnectorIds).catch(() => {});
  return config;
}

/**
 * Transition worker activation state with server-side validation in PostgreSQL
 */
export async function transitionWorkerStateAsync(
  requestingTenantId: string,
  targetTenantId: string,
  workerId: string,
  newState: ActivationState,
  reason: string
): Promise<WorkerDependencyConfig> {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant worker transition violation!`);
  }

  const key = getWorkerKey(targetTenantId, workerId);

  let records: any[] = [];
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${targetTenantId}', false);`));
      records = await tx
        .select()
        .from(workerConfigurations)
        .where(
          and(
            eq(workerConfigurations.tenantId, targetTenantId),
            eq(workerConfigurations.workerId, workerId)
          )
        );
    });
  } catch (err) {
    // Non-blocking notice when DB table is absent
  }

  if (records.length === 0) {
    const cached = workerConfigsCache.get(key);
    if (!cached) throw new Error(`Worker ${workerId} not initialized for tenant ${targetTenantId}`);
  }

  const currentRecord = records[0];
  const currentState = (currentRecord?.activationState as ActivationState) || workerConfigsCache.get(key)?.activationState || 'RECOMMENDED';
  const missingDependencies = (currentRecord?.missingDependencies as ConnectorId[]) || workerConfigsCache.get(key)?.missingDependencies || [];
  const stateHistory = (currentRecord?.stateHistory as any[]) || workerConfigsCache.get(key)?.stateHistory || [];

  // Validate allowed transition
  const allowed = VALID_ACTIVATION_TRANSITIONS[currentState] || [];
  if (!allowed.includes(newState) && newState !== currentState) {
    throw new Error(`INVALID STATE TRANSITION: Cannot transition worker from ${currentState} to ${newState}. Allowed: [${allowed.join(', ')}]`);
  }

  // Blocker check: cannot activate if required connections are missing
  if ((newState === 'ACTIVE_WITH_APPROVALS' || newState === 'ACTIVE_WITHIN_POLICY') && missingDependencies.length > 0) {
    throw new Error(`ACTIVATION BLOCKED: Cannot activate worker while required connections are missing: [${missingDependencies.join(', ')}]`);
  }

  const newHistoryEntry = {
    state: newState,
    timestamp: new Date().toISOString(),
    reason
  };
  const updatedHistory = [...stateHistory, newHistoryEntry];

  if (currentRecord) {
    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql.raw(`SELECT set_config('app.current_tenant', '${targetTenantId}', false);`));
        await tx
          .update(workerConfigurations)
          .set({
            activationState: newState,
            stateHistory: updatedHistory,
            updatedAt: new Date()
          })
          .where(eq(workerConfigurations.id, currentRecord.id));
      });
    } catch (err) {
      // Suppress when DB table is absent
    }
  }

  await logAuditEntryAsync({
    tenantId: targetTenantId,
    actor: 'Tenant Owner',
    actionType: 'WORKER_STATE_TRANSITION',
    targetConnectorOrWorker: workerId,
    details: `Transitioned worker state from ${currentState} to ${newState}. Reason: ${reason}`,
    status: 'SUCCESS'
  });

  const updatedConfig: WorkerDependencyConfig = {
    workerId,
    workerRole: currentRecord?.workerRole || 'AI Worker',
    tenantId: targetTenantId,
    requiredConnectorIds: (currentRecord?.requiredConnectors as ConnectorId[]) || [],
    optionalConnectorIds: [],
    requiredReadScopes: ['read_basic'],
    requiredWriteScopes: ['write_draft'],
    approvalPolicy: (currentRecord?.approvalPolicy as ApprovalPolicyLevel) || 'ALWAYS_ASK',
    activationState: newState,
    stateHistory: updatedHistory,
    missingDependencies,
    activationBlockers: (currentRecord?.activationBlockers as string[]) || [],
    lastExecutionAt: currentRecord?.lastExecutionAt ? new Date(currentRecord.lastExecutionAt).toISOString() : undefined
  };

  workerConfigsCache.set(key, updatedConfig);
  return updatedConfig;
}

export function transitionWorkerState(
  requestingTenantId: string,
  targetTenantId: string,
  workerId: string,
  newState: ActivationState,
  reason: string
): WorkerDependencyConfig {
  if (requestingTenantId !== targetTenantId) {
    throw new Error(`SECURITY EXCEPTION: Cross-tenant worker transition violation!`);
  }

  const key = getWorkerKey(targetTenantId, workerId);
  const currentConfig = workerConfigsCache.get(key);

  if (!currentConfig) {
    throw new Error(`Worker ${workerId} not initialized for tenant ${targetTenantId}`);
  }

  const currentState = currentConfig.activationState;
  const allowed = VALID_ACTIVATION_TRANSITIONS[currentState] || [];
  if (!allowed.includes(newState) && newState !== currentState) {
    throw new Error(`INVALID STATE TRANSITION: Cannot transition worker from ${currentState} to ${newState}. Allowed: [${allowed.join(', ')}]`);
  }

  if ((newState === 'ACTIVE_WITH_APPROVALS' || newState === 'ACTIVE_WITHIN_POLICY') && currentConfig.missingDependencies.length > 0) {
    throw new Error(`ACTIVATION BLOCKED: Cannot activate worker while required connections are missing: [${currentConfig.missingDependencies.join(', ')}]`);
  }

  currentConfig.activationState = newState;
  currentConfig.stateHistory.push({
    state: newState,
    timestamp: new Date().toISOString(),
    reason
  });

  logAuditEntry({
    tenantId: targetTenantId,
    actor: 'Tenant Owner',
    actionType: 'WORKER_STATE_TRANSITION',
    targetConnectorOrWorker: workerId,
    details: `Transitioned worker state from ${currentState} to ${newState}. Reason: ${reason}`,
    status: 'SUCCESS'
  });

  transitionWorkerStateAsync(requestingTenantId, targetTenantId, workerId, newState, reason).catch(() => {});
  return currentConfig;
}

/**
 * Approval Policy Check for Action Execution
 */
export function validateActionApproval(
  policy: ApprovalPolicyLevel,
  actionType: string,
  isHighRisk: boolean
): { allowed: boolean; requiresApproval: boolean; reason: string } {
  const HIGH_RISK_ACTIONS = [
    'send_external_message',
    'publish_listing',
    'charge_money',
    'refund_payment',
    'delete_data',
    'cancel_booking',
    'change_price',
    'bulk_action',
    'account_change'
  ];

  const actualHighRisk = isHighRisk || HIGH_RISK_ACTIONS.includes(actionType);

  if (policy === 'NEVER_ALLOW') {
    return { allowed: false, requiresApproval: false, reason: 'Policy is set to NEVER ALLOW.' };
  }

  if (policy === 'READ_ONLY') {
    if (actionType.includes('read') || actionType.includes('fetch')) {
      return { allowed: true, requiresApproval: false, reason: 'Read action allowed under READ ONLY policy.' };
    }
    return { allowed: false, requiresApproval: false, reason: 'Write action prohibited under READ ONLY policy.' };
  }

  if (policy === 'DRAFT_ONLY') {
    if (actionType.includes('draft') || actionType.includes('read')) {
      return { allowed: true, requiresApproval: false, reason: 'Draft creation allowed under DRAFT ONLY policy.' };
    }
    return { allowed: false, requiresApproval: true, reason: 'External dispatch requires approval under DRAFT ONLY policy.' };
  }

  if (policy === 'ALWAYS_ASK') {
    return { allowed: true, requiresApproval: true, reason: 'Human approval required by default under ALWAYS ASK policy.' };
  }

  if (policy === 'ASK_FOR_HIGH_RISK') {
    if (actualHighRisk) {
      return { allowed: true, requiresApproval: true, reason: 'High-risk action requires human approval.' };
    }
    return { allowed: true, requiresApproval: false, reason: 'Low-risk action auto-executed.' };
  }

  if (policy === 'AUTO_EXECUTE_LOW_RISK') {
    if (actualHighRisk) {
      return { allowed: true, requiresApproval: true, reason: 'High-risk action requires human approval.' };
    }
    return { allowed: true, requiresApproval: false, reason: 'Auto-executed low-risk action.' };
  }

  return { allowed: true, requiresApproval: true, reason: 'Default fallback approval required.' };
}

/**
 * Handle connector disconnection & enforce worker pausing safety in PostgreSQL
 */
export async function handleConnectorDisconnectedSafetyAsync(tenantId: string, disconnectedConnectorId: ConnectorId): Promise<void> {
  // Update cache first
  workerConfigsCache.forEach((config) => {
    if (config.tenantId === tenantId && config.requiredConnectorIds.includes(disconnectedConnectorId)) {
      if (!config.missingDependencies.includes(disconnectedConnectorId)) {
        config.missingDependencies.push(disconnectedConnectorId);
      }
      const prev = config.activationState;
      config.activationState = 'CONNECTIONS_INCOMPLETE';
      config.stateHistory.push({
        state: 'CONNECTIONS_INCOMPLETE',
        timestamp: new Date().toISOString(),
        reason: `Auto-paused worker safety lock due to disconnected connector: ${disconnectedConnectorId}`
      });
    }
  });

  try {
    const records = await db
      .select()
      .from(workerConfigurations)
      .where(eq(workerConfigurations.tenantId, tenantId));

    for (const record of records) {
      const required = (record.requiredConnectors as ConnectorId[]) || [];
      if (required.includes(disconnectedConnectorId)) {
        const missing = (record.missingDependencies as ConnectorId[]) || [];
        if (!missing.includes(disconnectedConnectorId)) {
          missing.push(disconnectedConnectorId);
        }

        const prev = record.activationState as ActivationState;
        const history = (record.stateHistory as any[]) || [];
        history.push({
          state: 'CONNECTIONS_INCOMPLETE',
          timestamp: new Date().toISOString(),
          reason: `Auto-paused worker safety lock due to disconnected connector: ${disconnectedConnectorId}`
        });

        await db
          .update(workerConfigurations)
          .set({
            activationState: 'CONNECTIONS_INCOMPLETE',
            missingDependencies: missing,
            stateHistory: history,
            updatedAt: new Date()
          })
          .where(eq(workerConfigurations.id, record.id));

        await logAuditEntryAsync({
          tenantId,
          actor: 'Safety System Engine',
          actionType: 'WORKER_STATE_TRANSITION',
          targetConnectorOrWorker: record.workerId,
          details: `Worker auto-paused from ${prev} to CONNECTIONS_INCOMPLETE due to lost connector ${disconnectedConnectorId}`,
          status: 'SUCCESS'
        });
      }
    }
  } catch (err) {
    // Non-blocking catch
  }
}

export function handleConnectorDisconnectedSafety(tenantId: string, disconnectedConnectorId: ConnectorId): void {
  workerConfigsCache.forEach((config) => {
    if (config.tenantId === tenantId && config.requiredConnectorIds.includes(disconnectedConnectorId)) {
      if (!config.missingDependencies.includes(disconnectedConnectorId)) {
        config.missingDependencies.push(disconnectedConnectorId);
      }
      const prev = config.activationState;
      config.activationState = 'CONNECTIONS_INCOMPLETE';
      config.stateHistory.push({
        state: 'CONNECTIONS_INCOMPLETE',
        timestamp: new Date().toISOString(),
        reason: `Auto-paused worker safety lock due to disconnected connector: ${disconnectedConnectorId}`
      });

      logAuditEntry({
        tenantId,
        actor: 'Safety System Engine',
        actionType: 'WORKER_STATE_TRANSITION',
        targetConnectorOrWorker: config.workerId,
        details: `Worker auto-paused from ${prev} to CONNECTIONS_INCOMPLETE due to lost connector ${disconnectedConnectorId}`,
        status: 'SUCCESS'
      });
    }
  });

  handleConnectorDisconnectedSafetyAsync(tenantId, disconnectedConnectorId).catch(() => {});
}
