# Production Blockers & Architectural Risks

## Resolved Blockers
1. **Permissive RLS Policy Fallback (`src/db/init.ts`) - RESOLVED & VERIFIED**:
   - Removed `NULLIF(...) IS NULL OR` permissive fallback clauses from all database RLS policies.
   - Database RLS policies now strictly fail closed when `app.current_tenant` is missing, empty, or invalid.
   - Introduced `withTenantContext` in `src/db/tenant-context.ts` using `SET LOCAL` (`set_config(..., true)`) within transaction boundaries.
   - Fully verified with 7 attack test suites in `src/tests/rls-security.test.ts` (all 12 security requirements passed).

## Remaining Architectural Risks & Work Items
1. **Controller Tenant Scoping Migration**:
   - `CRMController`, `GrowthController`, `DeployableImprovementController`, and `CompetitorController` have been fully migrated to `withTenantContext`.
   - Remaining unmigrated protected routes/controllers (if any) should be systematically migrated to wrap database queries in `withTenantContext`.

2. **Job Queue Exactly-Once Execution & Lease Renewal**:
   - Handlers running beyond the 30-second lease timeout may be reclaimed by another worker and executed again.
   - Retries and crash recovery may repeat external side effects.
   - Enqueue-time idempotency does not guarantee execution-time idempotency.
   - Queue concurrency must not be increased beyond 1 worker until heartbeat/lease renewal and side-effect idempotency are designed and tested.

3. **Missing `background_jobs` Indexes**:
   - `pg_indexes` catalog inspection revealed no secondary indexes on `background_jobs` (`business_id` or `status`).
   - High-frequency polling queries (`WHERE status = 'pending' AND run_at <= NOW()`) will perform sequential scans as job volume grows.
