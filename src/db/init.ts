// src/db/init.ts
import { Pool } from 'pg';
import { db, resolveSqlHost } from './index.ts';
import { sql } from 'drizzle-orm';
import { logger } from '../lib/logger.ts';

export async function initializeDatabaseTables(): Promise<void> {
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT,
      website TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      tone TEXT DEFAULT 'friendly',
      description TEXT,
      services JSONB DEFAULT '[]',
      faqs JSONB DEFAULT '[]',
      widget_color TEXT DEFAULT '#0284c7',
      widget_greeting TEXT,
      widget_placeholder TEXT,
      integrations JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      uid TEXT UNIQUE,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
      onboarded BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'new',
      notes TEXT,
      source TEXT,
      chat_session_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
      client_name TEXT NOT NULL,
      client_email TEXT,
      client_phone TEXT,
      service_name TEXT NOT NULL,
      date_time TIMESTAMP NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      visitor_name TEXT,
      visitor_email TEXT,
      visitor_phone TEXT,
      lead_captured BOOLEAN DEFAULT FALSE,
      appointment_booked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS automations (
      id SERIAL PRIMARY KEY,
      business_id TEXT NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
      follow_up_delay_minutes INTEGER DEFAULT 5,
      follow_up_template_email TEXT,
      follow_up_template_sms TEXT,
      follow_up_enabled BOOLEAN DEFAULT TRUE,
      review_request_delay_days INTEGER DEFAULT 1,
      review_template_email TEXT,
      review_template_sms TEXT,
      review_enabled BOOLEAN DEFAULT TRUE,
      review_link TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS automation_logs (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      lead_name TEXT,
      recipient TEXT,
      channel TEXT,
      template_name TEXT,
      content TEXT,
      status TEXT,
      sent_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      ip TEXT,
      details TEXT,
      timestamp TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS encrypted_credentials (
      id SERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      connector_id TEXT NOT NULL,
      encrypted_data TEXT NOT NULL,
      iv TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      key_version TEXT NOT NULL DEFAULT 'v2:gcm',
      redacted_preview TEXT NOT NULL,
      expires_at TIMESTAMP,
      is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS oauth_states (
      token TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      connector_id TEXT NOT NULL,
      redirect_uri TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      used_at TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS worker_configurations (
      id SERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      worker_id TEXT NOT NULL,
      worker_role TEXT NOT NULL,
      activation_state TEXT NOT NULL,
      approval_policy TEXT NOT NULL DEFAULT 'ALWAYS_ASK',
      required_connectors JSONB NOT NULL DEFAULT '[]',
      missing_dependencies JSONB NOT NULL DEFAULT '[]',
      activation_blockers JSONB NOT NULL DEFAULT '[]',
      state_history JSONB NOT NULL DEFAULT '[]',
      last_execution_at TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS approval_requests (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      worker_id TEXT NOT NULL,
      execution_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      is_high_risk BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'PENDING',
      payload JSONB NOT NULL DEFAULT '{}',
      approved_by TEXT,
      approved_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS workflow_executions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      worker_id TEXT NOT NULL,
      workflow_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
      idempotency_key TEXT UNIQUE,
      payload JSONB NOT NULL DEFAULT '{}',
      result JSONB NOT NULL DEFAULT '{}',
      steps JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      actor TEXT NOT NULL,
      action_type TEXT NOT NULL,
      target_connector_or_worker TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      external_ref_id TEXT,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS deployable_improvements (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      opportunity_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      problem_being_solved TEXT NOT NULL,
      capability_type TEXT NOT NULL,
      business_outcome TEXT NOT NULL,
      scenarios JSONB NOT NULL DEFAULT '[]'::jsonb,
      assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
      confidence_score REAL NOT NULL DEFAULT 0.8,
      risks JSONB NOT NULL DEFAULT '[]'::jsonb,
      required_connectors JSONB NOT NULL DEFAULT '[]'::jsonb,
      required_credentials JSONB NOT NULL DEFAULT '[]'::jsonb,
      required_approvals JSONB NOT NULL DEFAULT '[]'::jsonb,
      dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
      deployment_status TEXT NOT NULL DEFAULT 'recommended',
      measurement_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
      active_deployment_attempt_id TEXT,
      last_approval_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS improvement_approvals (
      id TEXT PRIMARY KEY,
      improvement_id TEXT NOT NULL REFERENCES deployable_improvements(id) ON DELETE CASCADE,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      approver TEXT NOT NULL,
      approved_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
      policy_used TEXT NOT NULL,
      expires_at TIMESTAMP,
      rejection_reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS improvement_deployment_attempts (
      id TEXT PRIMARY KEY,
      improvement_id TEXT NOT NULL REFERENCES deployable_improvements(id) ON DELETE CASCADE,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      attempt_number INTEGER NOT NULL,
      status TEXT NOT NULL,
      log JSONB NOT NULL DEFAULT '[]'::jsonb,
      started_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      rollback_log JSONB DEFAULT '[]'::jsonb
    );`,
    `CREATE TABLE IF NOT EXISTS improvement_performance_results (
      id TEXT PRIMARY KEY,
      improvement_id TEXT NOT NULL REFERENCES deployable_improvements(id) ON DELETE CASCADE,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      evaluation_date TIMESTAMP NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL,
      comparison_to_baseline JSONB NOT NULL DEFAULT '{}'::jsonb,
      comparison_to_scenarios JSONB NOT NULL DEFAULT '{}'::jsonb,
      financial_benefit_status TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      notes TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS ai_accessibility_audits (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      website_url TEXT NOT NULL,
      findings JSONB NOT NULL DEFAULT '[]'::jsonb,
      scores JSONB NOT NULL DEFAULT '{}'::jsonb,
      evaluated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS background_jobs (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      queue TEXT NOT NULL DEFAULT 'default',
      type TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      idempotency_key TEXT,
      locked_at TIMESTAMP,
      locked_by TEXT,
      last_error TEXT,
      run_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`
  ];

  // Use admin user for DDL/RLS if available (table owner role)
  const adminPool = process.env.SQL_ADMIN_USER ? new Pool({
    host: resolveSqlHost(),
    user: process.env.SQL_ADMIN_USER,
    password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }) : null;

  if (adminPool) {
    adminPool.on('error', (err) => {
      // Prevent idle client termination errors from crashing
    });
  }

  const executeSql = async (queryStr: string) => {
    if (adminPool) {
      try {
        await adminPool.query(queryStr);
        return;
      } catch (err: any) {
        // Fallback to primary db client if adminPool connection drops
      }
    }
    await db.execute(sql.raw(queryStr));
  };

  const tenantIdTables = [
    'encrypted_credentials',
    'oauth_states',
    'worker_configurations',
    'approval_requests',
    'workflow_executions',
    'audit_events',
    'deployable_improvements',
    'improvement_approvals',
    'improvement_deployment_attempts',
    'improvement_performance_results',
    'ai_accessibility_audits'
  ];

  const businessIdTables = [
    'users',
    'customers',
    'leads',
    'appointments',
    'chats',
    'automations',
    'automation_logs',
    'invoices',
    'payments',
    'audit_logs',
    'knowledge_base',
    'settings',
    'agents',
    'agent_tasks',
    'agent_memory',
    'crm_logs',
    'workflows',
    'voice_calls',
    'technician_jobs',
    'social_posts',
    'social_media_library',
    'social_brand_voice',
    'knowledge_documents',
    'business_memory',
    'ai_responses_feedback',
    'knowledge_analytics',
    'multi_agent_registry',
    'multi_agent_workflow_runs',
    'multi_agent_performance',
    'business_objectives',
    'objective_execution_plans',
    'autonomous_approvals',
    'executive_briefings',
    'receptionist_config',
    'unified_comms_timeline',
    'marketplace_apps',
    'marketplace_app_analytics',
    'competitors',
    'background_jobs'
  ];

  try {
    for (const stmt of ddlStatements) {
      try {
        await executeSql(stmt);
      } catch (err: any) {
        logger.warn('[DB Init] DDL statement notice:', err.message || err);
      }
    }

    for (const table of tenantIdTables) {
      try {
        await executeSql(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
        await executeSql(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`);
        await executeSql(`DROP POLICY IF EXISTS tenant_isolation_policy ON ${table};`);
        await executeSql(`
          CREATE POLICY tenant_isolation_policy ON ${table} FOR ALL
          USING (
            tenant_id = current_setting('app.current_tenant', true)
          )
          WITH CHECK (
            tenant_id = current_setting('app.current_tenant', true)
          );
        `);
      } catch (err: any) {
        logger.warn(`[DB Init RLS] Policy setup notice for ${table}:`, err.message);
      }
    }

    for (const table of businessIdTables) {
      try {
        await executeSql(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
        await executeSql(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`);
        await executeSql(`DROP POLICY IF EXISTS tenant_isolation_policy ON ${table};`);
        if (table === 'users') {
          await executeSql(`
            CREATE POLICY tenant_isolation_policy ON users FOR ALL
            USING (
              business_id = current_setting('app.current_tenant', true) OR
              (NULLIF(current_setting('app.user_email', true), '') IS NOT NULL AND email = current_setting('app.user_email', true))
            )
            WITH CHECK (
              business_id = current_setting('app.current_tenant', true) OR
              (NULLIF(current_setting('app.user_email', true), '') IS NOT NULL AND email = current_setting('app.user_email', true))
            );
          `);
        } else {
          await executeSql(`
            CREATE POLICY tenant_isolation_policy ON ${table} FOR ALL
            USING (
              business_id = current_setting('app.current_tenant', true)
            )
            WITH CHECK (
              business_id = current_setting('app.current_tenant', true)
            );
          `);
        }
      } catch (err: any) {
        logger.warn(`[DB Init RLS] Policy setup notice for ${table}:`, err.message);
      }
    }

    // -------------------------------------------------------------
    // AUDIT LOG IMMUTABILITY TRIGGERS
    // -------------------------------------------------------------
    try {
      await executeSql(`
        CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
        RETURNS TRIGGER AS $$
        BEGIN
          RAISE EXCEPTION 'SECURITY ERROR: Audit log records are immutable and cannot be updated or deleted!';
        END;
        $$ LANGUAGE plpgsql;
      `);

      await executeSql(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_events_immutable') THEN
            CREATE TRIGGER trg_audit_events_immutable
            BEFORE UPDATE OR DELETE ON audit_events
            FOR EACH ROW
            EXECUTE FUNCTION prevent_audit_log_modification();
          END IF;
        END $$;
      `);

      await executeSql(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_logs_immutable') THEN
            CREATE TRIGGER trg_audit_logs_immutable
            BEFORE UPDATE OR DELETE ON audit_logs
            FOR EACH ROW
            EXECUTE FUNCTION prevent_audit_log_modification();
          END IF;
        END $$;
      `);
    } catch (err: any) {
      logger.warn('[DB Init Audit Immutability] Trigger setup notice:', err.message);
    }
  } finally {
    if (adminPool) {
      await adminPool.end().catch(() => {});
    }
  }

  logger.info('[DB Init] Database initialization complete.');
}

