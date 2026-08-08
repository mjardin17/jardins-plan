// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

import fs from 'fs';
import path from 'path';

export const resolveSqlHost = (): string | undefined => {
  const host = process.env.SQL_HOST;
  if (host) {
    if (fs.existsSync(host)) return host;
    if (host.startsWith('/cloudsql/') && fs.existsSync(`/app${host}`)) return `/app${host}`;
    if (host.startsWith('/app/cloudsql/') && fs.existsSync(host.replace('/app', ''))) return host.replace('/app', '');
  }

  const candidateDirs = ['/app/cloudsql', '/cloudsql'];
  for (const baseDir of candidateDirs) {
    if (fs.existsSync(baseDir)) {
      try {
        const subdirs = fs.readdirSync(baseDir);
        for (const sub of subdirs) {
          const fullPath = path.join(baseDir, sub);
          if (fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, '.s.PGSQL.5432'))) {
            return fullPath;
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return host;
};

// Function to create a new connection pool.
export const createPool = () => {
  const host = resolveSqlHost();
  const user = process.env.SQL_USER;
  const password = process.env.SQL_PASSWORD;
  const database = process.env.SQL_DB_NAME;

  if (!host || !user || !password || !database) {
    console.warn("Database connection parameters are incomplete in environment variables.");
  }

  return new Pool({
    host,
    user,
    password,
    database,
    connectionTimeoutMillis: 15000,
    max: 5, // Keep pool conservative within container limits (max_connections = 50)
    idleTimeoutMillis: 5000,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
