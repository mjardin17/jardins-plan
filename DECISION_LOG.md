# Architectural Decision Log

## Decision 1: Refactor Background Jobs to Relational `background_jobs` Table
- **Date**: 2026-08-01
- **Context**: Legacy queue stored job records inside `automation_logs`.
- **Decision**: Refactored `DurableJobQueue`, `JobsController`, and `GrowthRepository` to use `background_jobs` table.
- **Impact**: Structured columns (`status`, `locked_at`, `locked_by`, `idempotency_key`) enabling atomic SQL locks.

## Decision 2: Document Job Queue Claiming Mechanics and Limits
- **Date**: 2026-08-05
- **Context**: Reconciled worker job claiming behavior and queue guarantees.
- **Decision**: Documented that conditional `UPDATE background_jobs ... WHERE id = ? AND status = 'pending' RETURNING *` prevents initial duplicate claims, but does NOT guarantee end-to-end exactly-once execution. Lease timeouts (30s) and retries can repeat side effects. Concurrency capped at 1 worker until heartbeat renewal is implemented.
- **Impact**: Prevents premature scale-up of background workers without side-effect idempotency safeguards.

## Decision 3: Implement Fail-Closed Database RLS Policies
- **Date**: 2026-08-05
- **Context**: Permissive `NULLIF(...) IS NULL OR` fallback allowed cross-tenant access when GUC was unset.
- **Decision**: Eliminated permissive fallback in `src/db/init.ts`. Enforced strict `tenant_id = current_setting('app.current_tenant', true)` and `business_id = current_setting('app.current_tenant', true)`.
- **Impact**: Database level guarantees 0 rows exposed when tenant context is missing, empty, or invalid.

## Decision 4: Centralize Tenant Database Scoping via `withTenantContext`
- **Date**: 2026-08-05
- **Context**: Needed secure, connection-pool safe mechanism to execute tenant queries with GUC scoping.
- **Decision**: Created `withTenantContext(tenantId, tx => ...)` in `src/db/tenant-context.ts` using `SELECT set_config('app.current_tenant', $1, true)` inside PostgreSQL transactions (`SET LOCAL`).
- **Impact**: Automatically resets tenant setting on transaction commit or rollback, preventing pooled connection contamination.

## Decision 5: Migrate Competitor Analysis Module to `withTenantContext`
- **Date**: 2026-08-07
- **Context**: `CompetitorRepository` was using ad-hoc `db.transaction` with raw `set_config` string queries instead of `withTenantContext`.
- **Decision**: Refactored `CompetitorRepository` to run all queries through `withTenantContext` and support optional `passedTx`. Updated `CompetitorController` to enforce `getUserByEmail` and reject client-supplied tenant overrides (body, query, route, headers) with 403.
- **Impact**: Standardized tenant context application, eliminated ad-hoc `set_config` calls, and verified complete isolation via 23 automated security tests (`src/tests/competitor-security.test.ts`).
