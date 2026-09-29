import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

// Cached on globalThis so dev hot-reloads don't leak a pool per reload.
export function pool(): Pool {
  if (!globalForPg.pgPool) {
    globalForPg.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    // Neon drops idle connections; an unhandled 'error' event would crash the process.
    globalForPg.pgPool.on("error", (err) => console.error("[db] idle client error", err.message));
  }
  return globalForPg.pgPool;
}
