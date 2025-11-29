import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import fs from "fs";

neonConfig.webSocketConstructor = ws;

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    return process.env.DATABASE_URL;
  }
  
  const secretPaths = [
    '/run/secrets/DATABASE_URL',
    '/etc/secrets/DATABASE_URL'
  ];
  
  for (const path of secretPaths) {
    try {
      const secret = fs.readFileSync(path, 'utf8').trim();
      if (secret) return secret;
    } catch {}
  }
  
  const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;
  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
    const port = PGPORT || '5432';
    return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${port}/${PGDATABASE}?sslmode=require`;
  }
  
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = getDatabaseUrl();
export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
