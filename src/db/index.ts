import { drizzle } from 'drizzle-orm/node-postgres';
import pg, { type PoolConfig, type Pool as PgPool } from 'pg';
const { Pool } = pg;
import * as schema from './schema.ts';

// Global connection pool caching across hot-reloads
declare global {
  var _postgresPool: PgPool | undefined;
}

function isValidPostgresUrl(url?: string): boolean {
  if (!url) return false;
  const clean = url.trim().replace(/^"|"$/g, '');
  if (
    clean.includes('[YOUR-PASSWORD]') ||
    clean.includes('[PASSWORD]') ||
    clean.includes('YOUR-PASSWORD') ||
    clean.includes('your-strong-password')
  ) {
    return false;
  }
  return true;
}

/**
 * Validates database environment safely without logging secrets, tokens, or full URLs.
 */
export function validateDatabaseEnv(): { isConfigured: boolean; connectionType: 'connection_string' | 'host_params' | 'none'; targetSummary: string } {
  const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (dbUrl && isValidPostgresUrl(dbUrl)) {
    try {
      // Clean quotes if present
      const cleanUrl = dbUrl.startsWith('"') && dbUrl.endsWith('"') ? dbUrl.slice(1, -1) : dbUrl;
      const parsed = new URL(cleanUrl);
      const safeSummary = `PostgreSQL (via ${parsed.protocol}//${parsed.username ? '[user]' : ''}@${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname})`;
      return { isConfigured: true, connectionType: 'connection_string', targetSummary: safeSummary };
    } catch {
      return { isConfigured: true, connectionType: 'connection_string', targetSummary: 'PostgreSQL (connection string configured)' };
    }
  }

  if (process.env.SQL_HOST) {
    const safeSummary = `Cloud SQL (host: ${process.env.SQL_HOST}, db: ${process.env.SQL_DB_NAME || 'unspecified'})`;
    return { isConfigured: true, connectionType: 'host_params', targetSummary: safeSummary };
  }

  return { isConfigured: false, connectionType: 'none', targetSummary: 'No database credentials configured in environment' };
}

export const createPool = (): PgPool => {
  if (!global._postgresPool) {
    const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
    let poolConfig: PoolConfig;

    if (rawUrl && isValidPostgresUrl(rawUrl)) {
      let cleanUrl = rawUrl.trim();
      if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
        cleanUrl = cleanUrl.slice(1, -1);
      }

      // Check if SSL should be enabled (Supabase, Neon, AWS RDS, or explicit sslmode)
      const needsSsl =
        cleanUrl.includes('supabase.com') ||
        cleanUrl.includes('sslmode=require') ||
        cleanUrl.includes('sslmode=prefer') ||
        process.env.PGSSLMODE === 'require' ||
        process.env.NODE_ENV === 'production';

      poolConfig = {
        connectionString: cleanUrl,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
        ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      };
    } else {
      poolConfig = {
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
      };
    }

    const { targetSummary } = validateDatabaseEnv();
    console.log(`[Database] Initializing connection pool for ${targetSummary}`);

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err: any) => {
      console.error('[Database Pool Error]:', err.message || err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
export { pool };
