# Next Action Plan

## Completed Action
- **Implemented Fail-Closed Database RLS Policies**: Eliminated `NULLIF(...) IS NULL OR` permissive fallback in `src/db/init.ts`.
- **Centralized Tenant Execution**: Created `withTenantContext` helper in `src/db/tenant-context.ts` using transaction-local `set_config('app.current_tenant', $1, true)`.
- **Migrated Representative Controller**: Updated `CRMController` (`getLeads`, `createLead`, `getAppointments`, `getInvoices`) to execute within `withTenantContext`.
- **Security Test Verification**: Executed `src/tests/rls-security.test.ts` (7 attack test suites covering all 12 security requirements) and full test suite (`npx tsx src/tests/run-all-tests.ts`). All passed cleanly.

## Recommended Next Steps
1. **Controller Migration**: Systematically migrate remaining Express controllers to wrap tenant queries in `withTenantContext`.
2. **Job Queue Heartbeat Renewal**: Design heartbeat lease renewal mechanism for long-running background jobs before increasing worker concurrency.
3. **Database Index Optimization**: Add missing secondary indexes on `background_jobs` (`business_id`, `status`).
