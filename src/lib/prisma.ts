import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function getDatabaseUrl(): string {
  if (process.env.SQL_HOST) {
    const user = process.env.SQL_USER || 'ai_studio_app_user';
    const pass = encodeURIComponent(process.env.SQL_PASSWORD || '');
    const db = process.env.SQL_DB_NAME || 'cloud_sql_development_database';
    const host = process.env.SQL_HOST;
    return `postgresql://${user}:${pass}@localhost/${db}?host=${host}`;
  }
  let raw = process.env.DATABASE_URL || '';
  if (raw.startsWith('"') && raw.endsWith('"')) {
    raw = raw.slice(1, -1);
  }
  return raw;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
