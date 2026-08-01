-- Versioned Migration: 0002_deployable_improvements_and_ai_accessibility.sql

CREATE TABLE IF NOT EXISTS deployable_improvements (
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
);

CREATE INDEX IF NOT EXISTS deployable_imp_tenant_idx ON deployable_improvements(tenant_id, deployment_status);

CREATE TABLE IF NOT EXISTS improvement_approvals (
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
);

CREATE INDEX IF NOT EXISTS imp_approval_tenant_idx ON improvement_approvals(tenant_id, improvement_id);

CREATE TABLE IF NOT EXISTS improvement_deployment_attempts (
  id TEXT PRIMARY KEY,
  improvement_id TEXT NOT NULL REFERENCES deployable_improvements(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  status TEXT NOT NULL,
  log JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  rollback_log JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS imp_attempt_tenant_idx ON improvement_deployment_attempts(tenant_id, improvement_id);

CREATE TABLE IF NOT EXISTS improvement_performance_results (
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
);

CREATE INDEX IF NOT EXISTS imp_perf_tenant_idx ON improvement_performance_results(tenant_id, improvement_id);

CREATE TABLE IF NOT EXISTS ai_accessibility_audits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  evaluated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_access_audit_tenant_idx ON ai_accessibility_audits(tenant_id, evaluated_at);
