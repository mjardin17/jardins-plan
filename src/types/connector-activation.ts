// src/types/connector-activation.ts

export type ConnectorId =
  | 'gmail'
  | 'google_calendar'
  | 'outlook_email'
  | 'outlook_calendar'
  | 'calendly'
  | 'twilio'
  | 'stripe'
  | 'ebay'
  | 'shopify'
  | 'generic_smtp'
  | 'generic_webhook'
  | 'csv_import';

export type ImplementationStatus =
  | 'NOT_IMPLEMENTED'
  | 'INTERFACE_ONLY'
  | 'MOCK_ONLY'
  | 'WORKING_IN_SANDBOX'
  | 'PARTIALLY_VERIFIED'
  | 'VERIFIED_WORKING'
  | 'BLOCKED_BY_CREDENTIALS'
  | 'BLOCKED_BY_PROVIDER';

export type ConnectorCategory =
  | 'email_calendar'
  | 'telephony'
  | 'payments'
  | 'ecommerce'
  | 'data_import'
  | 'developer_webhooks';

export interface ConnectorDefinition {
  id: ConnectorId;
  name: string;
  category: ConnectorCategory;
  description: string;
  iconName: string;
  implementationStatus: ImplementationStatus;
  authType: 'oauth2' | 'api_key' | 'webhook' | 'file';
  requiredScopes: string[];
  supportsRead: boolean;
  supportsWrite: boolean;
  supportsTestWrite: boolean;
  docUrl?: string;
}

export interface EncryptedCredential {
  tenantId: string;
  connectorId: ConnectorId;
  encryptedData: string;
  iv: string;
  authTag: string;
  redactedPreview: string;
  updatedAt: string;
  expiresAt?: string;
  isRevoked: boolean;
}

export interface OAuthStateToken {
  token: string;
  tenantId: string;
  userId: string;
  connectorId: ConnectorId;
  redirectUri: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export type ActivationState =
  | 'RECOMMENDED'
  | 'CONFIGURATION_STARTED'
  | 'CONNECTIONS_INCOMPLETE'
  | 'CONNECTIONS_VERIFIED'
  | 'PERMISSIONS_REVIEWED'
  | 'SANDBOX_TEST_READY'
  | 'SANDBOX_TEST_PASSED'
  | 'OWNER_APPROVAL_REQUIRED'
  | 'ACTIVE_WITH_APPROVALS'
  | 'ACTIVE_WITHIN_POLICY'
  | 'PAUSED'
  | 'ERROR'
  | 'DISABLED';

export type ApprovalPolicyLevel =
  | 'READ_ONLY'
  | 'DRAFT_ONLY'
  | 'ALWAYS_ASK'
  | 'ASK_FOR_HIGH_RISK'
  | 'AUTO_EXECUTE_LOW_RISK'
  | 'NEVER_ALLOW';

export interface WorkerDependencyConfig {
  workerId: string;
  workerRole: string;
  tenantId: string;
  requiredConnectorIds: ConnectorId[];
  optionalConnectorIds: ConnectorId[];
  requiredReadScopes: string[];
  requiredWriteScopes: string[];
  approvalPolicy: ApprovalPolicyLevel;
  activationState: ActivationState;
  stateHistory: { state: ActivationState; timestamp: string; reason: string }[];
  missingDependencies: ConnectorId[];
  activationBlockers: string[];
  lastExecutionAt?: string;
}

export interface AuditTrailEntry {
  id: string;
  tenantId: string;
  timestamp: string;
  actor: string;
  actionType:
    | 'CONNECTOR_AUTHENTICATE'
    | 'CONNECTOR_TEST_READ'
    | 'CONNECTOR_TEST_WRITE'
    | 'CONNECTOR_DISCONNECT'
    | 'CONNECTOR_REVOKED'
    | 'CREDENTIAL_ROTATED'
    | 'PROVIDER_SANDBOX_CALL'
    | 'OAUTH_STATE_CREATED'
    | 'OAUTH_CALLBACK_PROCESSED'
    | 'WORKER_STATE_TRANSITION'
    | 'INBOX_MESSAGE_READ'
    | 'INBOX_DRAFT_CREATED'
    | 'INBOX_DRAFT_APPROVED'
    | 'CALENDAR_AVAILABILITY_READ'
    | 'CALENDAR_EVENT_CREATED'
    | 'CALENDAR_EVENT_CLEANUP';
  targetConnectorOrWorker: string;
  details: string;
  status: 'SUCCESS' | 'FAILURE' | 'REJECTED';
  externalRefId?: string;
}

export interface TestActionResult {
  success: boolean;
  action: 'test_auth' | 'test_read' | 'test_write';
  connectorId: ConnectorId;
  tenantId: string;
  timestamp: string;
  summary: string;
  details: any;
  externalRefId?: string;
  error?: string;
}
