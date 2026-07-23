import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Neon (and most cloud Postgres providers) require SSL.
// Parse sslmode from the URL and also force ssl:true so pg doesn't reject the cert.
const connectionString = process.env.DATABASE_URL!;
const ssl = connectionString.includes("sslmode=require") ||
             connectionString.includes("neon.tech") ||
             process.env.NODE_ENV === "production"
  ? { rejectUnauthorized: false }
  : undefined;

export const pool = new Pool({ connectionString, ssl });
export const db = drizzle(pool, { schema });

export * from "./schema";
