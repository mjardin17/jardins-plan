# Project State: AI Workforce OS

## Overview
- **System**: AI Workforce OS (Full-Stack Express + React + Vite + PostgreSQL + Drizzle ORM + Gemini AI)
- **Environment**: Cloud Run Container Sandbox
- **Status**: Operational / Production RLS Security & Fail-Closed Enforcement Verified

## Architecture & Security Implementation
- **Frontend**: React 18 SPA with Vite, Tailwind CSS, Lucide icons.
- **Backend**: Express v4 TypeScript custom server (`server.ts`).
- **Database**: PostgreSQL with Drizzle ORM schema definitions and custom startup initialization (`src/db/init.ts`).
- **Tenant Context Scoping (`withTenantContext`)**: Centralized transaction execution mechanism (`src/db/tenant-context.ts`) that opens a transaction, sets transaction-local `app.current_tenant` using parameterized `SET LOCAL` (`set_config`), and executes queries within the scoped transaction boundary. Automatically resets setting upon transaction commit or rollback to prevent pooled connection contamination.
- **Database RLS Policies**: Strict fail-closed Row-Level Security (`ENABLE` and `FORCE ROW LEVEL SECURITY`) on all tenant tables (`tenant_id` and `business_id` tables). All permissive fallback clauses (`NULLIF(...) IS NULL OR`) have been eliminated. Missing, empty, or invalid tenant context returns 0 rows.
- **Background Jobs**: Persistent `background_jobs` table managed by `DurableJobQueue` (`src/lib/job-queue.ts`).

## Verified Security & Job Queue Status
- **RLS Fail-Closed Security (VERIFIED PASSED)**: Verified via automated execution of `src/tests/rls-security.test.ts`. Confirmed that missing, empty (`''`), or malformed tenant contexts return 0 rows. Connection pool reuse context leakage defense verified across transaction commit and rollback boundaries.
- **Deployable Improvements Group Security (VERIFIED PASSED)**: 10/10 security tests passed (`src/tests/deployable-improvements-security.test.ts`). All endpoints derive tenant identity exclusively from server-verified authentication context and execute inside `withTenantContext`.
- **Competitor Analysis Migration (VERIFIED PASSED)**: 23/23 security tests passed (`src/tests/competitor-security.test.ts`). Replaced ad-hoc `set_config` and `db.transaction` in `CompetitorRepository` with standard `withTenantContext`. `CompetitorController` enforces user lookup via `getUserByEmail` and rejects tenant mismatches in body, query, route, or headers with 403. `GrowthService` competitor calls support transaction propagation via optional `passedTx`.
- **Job Queue Concurrency & Execution Safety**:
  - The conditional `UPDATE background_jobs ... WHERE id = record.id AND status = 'pending' RETURNING *` prevents competing workers from simultaneously winning the initial pending-to-processing claim.
  - End-to-end exactly-once execution is NOT proven.
  - Handlers running beyond the 30-second lease timeout may be reclaimed by another worker and executed again.
  - Retries and crash recovery may repeat external side effects.
  - Enqueue-time idempotency does not guarantee execution-time idempotency.
  - Queue concurrency MUST NOT be increased until heartbeat/lease renewal and side-effect idempotency are designed and tested.
- **Live Database Index Status**: Verified presence of single-column `business_id` indexes on core tenant tables via `pg_indexes`.
