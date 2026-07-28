// src/lib/connector-registry.ts
import { ConnectorDefinition, ConnectorId } from '../types/connector-activation.ts';

export const CONNECTOR_REGISTRY: ConnectorDefinition[] = [
  {
    id: 'gmail',
    name: 'Google Gmail',
    category: 'email_calendar',
    description: 'OAuth2 integration for reading incoming business messages and drafting automated replies.',
    iconName: 'Mail',
    implementationStatus: 'WORKING_IN_SANDBOX',
    authType: 'oauth2',
    requiredScopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.compose'],
    supportsRead: true,
    supportsWrite: true,
    supportsTestWrite: true
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'email_calendar',
    description: 'OAuth2 calendar sync for 24/7 availability reading and automated appointment scheduling.',
    iconName: 'Calendar',
    implementationStatus: 'WORKING_IN_SANDBOX',
    authType: 'oauth2',
    requiredScopes: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'],
    supportsRead: true,
    supportsWrite: true,
    supportsTestWrite: true
  },
  {
    id: 'outlook_email',
    name: 'Microsoft Outlook Email',
    category: 'email_calendar',
    description: 'Microsoft Graph API connector for Outlook business inbox monitoring and reply drafting.',
    iconName: 'Mail',
    implementationStatus: 'MOCK_ONLY',
    authType: 'oauth2',
    requiredScopes: ['Mail.Read', 'Mail.Send'],
    supportsRead: true,
    supportsWrite: true,
    supportsTestWrite: false
  },
  {
    id: 'outlook_calendar',
    name: 'Microsoft Outlook Calendar',
    category: 'email_calendar',
    description: 'Microsoft Graph API calendar integration for appointment dispatching.',
    iconName: 'Calendar',
    implementationStatus: 'MOCK_ONLY',
    authType: 'oauth2',
    requiredScopes: ['Calendars.ReadWrite'],
    supportsRead: true,
    supportsWrite: true,
    supportsTestWrite: false
  },
  {
    id: 'calendly',
    name: 'Calendly',
    category: 'email_calendar',
    description: 'Webhooks and API token integration for automated scheduling link dispatch.',
    iconName: 'Clock',
    implementationStatus: 'INTERFACE_ONLY',
    authType: 'api_key',
    requiredScopes: ['default'],
    supportsRead: true,
    supportsWrite: false,
    supportsTestWrite: false
  },
  {
    id: 'twilio',
    name: 'Twilio Telephony & SMS',
    category: 'telephony',
    description: 'Programmable voice and SMS gateway for 24/7 AI Receptionist call handling and review requests.',
    iconName: 'Phone',
    implementationStatus: 'WORKING_IN_SANDBOX',
    authType: 'api_key',
    requiredScopes: ['account_sid', 'auth_token', 'phone_number'],
    supportsRead: true,
    supportsWrite: true,
    supportsTestWrite: true
  },
  {
    id: 'stripe',
    name: 'Stripe Payments',
    category: 'payments',
    description: 'Payment processor connector for revenue tracking and automated deposit reconciliation.',
    iconName: 'CreditCard',
    implementationStatus: 'WORKING_IN_SANDBOX',
    authType: 'api_key',
    requiredScopes: ['read_write'],
    supportsRead: true,
    supportsWrite: true,
    supportsTestWrite: true
  },
  {
    id: 'ebay',
    name: 'eBay Marketplace',
    category: 'ecommerce',
    description: 'REST API connector for automated draft listing creation and price research comps.',
    iconName: 'ShoppingBag',
    implementationStatus: 'PARTIALLY_VERIFIED',
    authType: 'oauth2',
    requiredScopes: ['https://api.ebay.com/oauth/api_scope/sell.inventory'],
    supportsRead: true,
    supportsWrite: true,
    supportsTestWrite: false
  },
  {
    id: 'shopify',
    name: 'Shopify Storefront',
    category: 'ecommerce',
    description: 'Shopify Admin API connector for inventory level updates and customer order sync.',
    iconName: 'Store',
    implementationStatus: 'MOCK_ONLY',
    authType: 'oauth2',
    requiredScopes: ['read_products', 'write_products', 'read_orders'],
    supportsRead: true,
    supportsWrite: true,
    supportsTestWrite: false
  },
  {
    id: 'generic_smtp',
    name: 'Custom SMTP / IMAP Email',
    category: 'email_calendar',
    description: 'Generic email server connection for non-Google/Microsoft email providers.',
    iconName: 'Send',
    implementationStatus: 'WORKING_IN_SANDBOX',
    authType: 'api_key',
    requiredScopes: ['host', 'port', 'user', 'pass'],
    supportsRead: true,
    supportsWrite: true,
    supportsTestWrite: true
  },
  {
    id: 'generic_webhook',
    name: 'Custom Developer Webhook',
    category: 'developer_webhooks',
    description: 'Inbound and outbound JSON webhooks for connecting custom legacy software or Zapier.',
    iconName: 'Webhook',
    implementationStatus: 'WORKING_IN_SANDBOX',
    authType: 'webhook',
    requiredScopes: ['payload_url', 'secret_token'],
    supportsRead: true,
    supportsWrite: true,
    supportsTestWrite: true
  },
  {
    id: 'csv_import',
    name: 'CSV / Excel Batch Data Import',
    category: 'data_import',
    description: 'Manual file upload parser for customer lists, inventory backlogs, and transaction logs.',
    iconName: 'FileSpreadsheet',
    implementationStatus: 'VERIFIED_WORKING',
    authType: 'file',
    requiredScopes: ['read_file'],
    supportsRead: true,
    supportsWrite: false,
    supportsTestWrite: false
  }
];

export function getConnectorRegistry(): ConnectorDefinition[] {
  return CONNECTOR_REGISTRY;
}

export function getConnectorById(id: ConnectorId): ConnectorDefinition | undefined {
  return CONNECTOR_REGISTRY.find(c => c.id === id);
}
