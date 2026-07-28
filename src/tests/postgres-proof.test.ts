// src/tests/postgres-proof.test.ts
import { Pool } from 'pg';
import { db } from '../db/index.ts';
import { sql } from 'drizzle-orm';

export async function runPostgresProofTests() {
  console.log("----------------------------------------");
  console.log("🐘 Running Real PostgreSQL Verification & Proof Suite...");

  const host = process.env.SQL_HOST || 'localhost';
  const user = process.env.SQL_USER || 'postgres';
  const password = process.env.SQL_PASSWORD || 'postgres';
  const database = process.env.SQL_DB_NAME || 'postgres';

  const pool = new Pool({
    host,
    user,
    password,
    database,
    connectionTimeoutMillis: 5000
  });

  try {
    // 1. Version Check
    const versionRes = await pool.query('SELECT version();');
    const versionStr = versionRes.rows[0].version;
    if (!versionStr || !versionStr.includes('PostgreSQL')) {
      throw new Error(`Invalid DB engine: Expected PostgreSQL, got "${versionStr}"`);
    }

    // 2. Database Name & Driver Information
    const dbNameRes = await pool.query('SELECT current_database(), current_user;');
    const currentDb = dbNameRes.rows[0].current_database;
    const currentUser = dbNameRes.rows[0].current_user;

    // 3. Table Listing Verification
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    const tableNames = tablesRes.rows.map((r: any) => r.table_name);

    // 4. Transaction Rollback Verification
    const client = await pool.connect();
    let rollbackSuccess = false;
    const testRollbackId = `rollback_test_${Date.now()}`;
    try {
      await client.query('BEGIN;');
      await client.query(`
        INSERT INTO businesses (id, name, industry)
        VALUES ('${testRollbackId}', 'Rollback Test Business', 'Testing')
      `);
      await client.query('ROLLBACK;');

      // Verify row is NOT present
      const verifyRes = await pool.query(`SELECT id FROM businesses WHERE id = '${testRollbackId}'`);
      if (verifyRes.rows.length === 0) {
        rollbackSuccess = true;
      }
    } finally {
      client.release();
    }

    if (!rollbackSuccess) {
      throw new Error('PostgreSQL transaction rollback failed: Inserted record persisted after ROLLBACK!');
    }

    // 5. Connection Reconnect Persistence Verification
    const testPersistId = `persist_test_${Date.now()}`;
    const clientA = await pool.connect();
    try {
      await clientA.query(`
        INSERT INTO businesses (id, name, industry)
        VALUES ('${testPersistId}', 'Persistence Test Business', 'Testing')
      `);
    } finally {
      clientA.release();
    }

    // Create a new fresh client connection B to query
    const poolB = new Pool({ host, user, password, database });
    const clientB = await poolB.connect();
    let persistSuccess = false;
    try {
      const persistRes = await clientB.query(`SELECT id, name FROM businesses WHERE id = '${testPersistId}'`);
      if (persistRes.rows.length === 1 && persistRes.rows[0].id === testPersistId) {
        persistSuccess = true;
      }

      // Cleanup test row
      await clientB.query(`DELETE FROM businesses WHERE id = '${testPersistId}'`);
    } finally {
      clientB.release();
      await poolB.end();
    }

    if (!persistSuccess) {
      throw new Error('PostgreSQL persistence verification failed: Record not found across distinct connection clients!');
    }

    console.log(`  ✅ PostgreSQL Version: ${versionStr.split(',')[0]}`);
    console.log(`  ✅ Driver: pg (node-postgres) Pool`);
    console.log(`  ✅ Database Name: ${currentDb} (User: ${currentUser})`);
    console.log(`  ✅ Tables Verified: [${tableNames.join(', ')}]`);
    console.log(`  ✅ Transaction Rollback Proof: Verified (BEGIN -> INSERT -> ROLLBACK)`);
    console.log(`  ✅ Multi-Connection Persistence Proof: Verified`);
    console.log(`  ✅ All Real PostgreSQL Proofs Passed!`);
  } catch (err) {
    throw err;
  }
}
