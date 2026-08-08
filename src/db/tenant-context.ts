import { db } from "./index.ts";
import { sql, eq } from "drizzle-orm";
import { users } from "./schema.ts";

export type TenantTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Centralized Tenant-Scoped Database Execution Mechanism
 * 
 * Opens a database transaction and sets `app.current_tenant` using safe parameterized SQL:
 * `SELECT set_config('app.current_tenant', $1, true)`
 * 
 * Setting `is_local = true` ensures that PostgreSQL automatically resets `app.current_tenant`
 * when the transaction ends (COMMIT or ROLLBACK), preventing connection pool contamination.
 * 
 * Fails closed (throws an error) if tenantId is missing, empty, or invalid.
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: (tx: TenantTransaction) => Promise<T>,
  existingTx?: TenantTransaction
): Promise<T> {
  if (!tenantId || typeof tenantId !== "string" || tenantId.trim() === "") {
    throw new Error("Tenant context violation: Missing, empty, or invalid tenant identifier.");
  }

  const cleanTenantId = tenantId.trim();

  if (existingTx) {
    await existingTx.execute(sql`SELECT set_config('app.current_tenant', ${cleanTenantId}, true)`);
    return await callback(existingTx);
  }

  return await db.transaction(async (tx) => {
    // Transaction-local GUC configuration using safe parameterized SQL
    await tx.execute(sql`SELECT set_config('app.current_tenant', ${cleanTenantId}, true)`);
    return await callback(tx);
  });
}

/**
 * Resolves user record by authenticated user email address.
 * Sets `app.user_email` transaction-locally to allow identity lookup.
 */
export async function getUserByEmail(email: string) {
  if (!email || typeof email !== "string" || email.trim() === "") {
    return null;
  }
  const cleanEmail = email.trim();

  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_email', ${cleanEmail}, true)`);
    const results = await tx.select().from(users).where(eq(users.email, cleanEmail));
    return results[0] || null;
  });
}
