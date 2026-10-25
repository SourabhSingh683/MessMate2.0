import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

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

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

let dbCredentials: any;

if (rawUrl && isValidPostgresUrl(rawUrl)) {
  let cleanUrl = rawUrl.trim();
  if (cleanUrl.startsWith('"') && cleanUrl.endsWith('"')) {
    cleanUrl = cleanUrl.slice(1, -1);
  }
  const needsSsl =
    cleanUrl.includes('supabase.com') ||
    cleanUrl.includes('sslmode=require') ||
    cleanUrl.includes('sslmode=prefer') ||
    process.env.PGSSLMODE === 'require';

  dbCredentials = {
    url: cleanUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  };
} else {
  const sqlHost = process.env.SQL_HOST || 'localhost';
  const sqlDbName = process.env.SQL_DB_NAME || 'cloud_sql_development_database';
  const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER || 'ai_studio_admin';
  const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || '';

  dbCredentials = {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  };
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials,
  verbose: true,
});
