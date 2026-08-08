# Verified Features & Technical Audit Status

## Verified Security & System Features
1. **Centralized Fail-Closed Tenant Isolation (`withTenantContext`)**:
   - Centralized helper in `src/db/tenant-context.ts` opens transactions and sets `app.current_tenant` using parameterized `SELECT set_config('app.current_tenant', $1, true)`.
   - Verified fail-closed RLS policies across all tenant-scoped tables (`src/db/init.ts`).
   - Verified 0-row exposure on missing, empty (`''`), malformed, or cross-tenant contexts via `src/tests/rls-security.test.ts`.
   - Verified zero context leakage across pooled connection reuse and transaction rollbacks.

2. **Migrated Representative Endpoint (`CRMController`)**:
   - `CRMController` endpoints (`getLeads`, `createLead`, `getAppointments`, `getInvoices`) migrated to use `getUserByEmail` and `withTenantContext`.

3. **Migrated Deployable Improvements Group**:
   - `DeployableImprovementController` endpoints derive tenant identity exclusively from `resolveTenantAuth`.
   - Rejects unauthenticated requests (401), unassociated users (401), and client-supplied tenant overrides in body, query, or headers (403).
   - Verified via dedicated 10/10 security test suite (`src/tests/deployable-improvements-security.test.ts`).

4. **Migrated Competitor Analysis Module**:
   - Refactored `CompetitorRepository` methods (`findByBusinessId`, `create`, `seedDefaultsIfEmpty`) to use standard `withTenantContext` helper instead of ad-hoc `set_config` and `db.transaction`.
   - Supported optional `passedTx` transaction propagation across `CompetitorRepository` and `GrowthService`.
   - `CompetitorController` resolves authenticated user via `getUserByEmail` and validates tenant authority against `user.businessId`. Rejects mismatched body, query, route, or header tenant overrides with 403.
   - Verified via dedicated 23/23 security test suite (`src/tests/competitor-security.test.ts`).

5. **Atomic Job Claiming (`DurableJobQueue.processNextJobs`)**:
   - Executes `UPDATE background_jobs ... WHERE id = record.id AND status = 'pending' RETURNING *`.
   - The conditional UPDATE prevents competing workers from simultaneously winning the initial pending-to-processing claim.
   - *Documentation Note*: End-to-end exactly-once execution is not proven; long-running jobs (>30s) or retries can re-execute side effects. Concurrency must remain at 1 worker until heartbeat renewal and side-effect idempotency are implemented.

4. **Static Type Safety & Production Build**:
   - Full security and quality test suite (`npx tsx src/tests/run-all-tests.ts`): Passed (Exit code 0).
   - RLS Security suite (`src/tests/rls-security.test.ts`): Passed (Exit code 0).
   - Applet build compilation (`compile_applet`): Passed.
