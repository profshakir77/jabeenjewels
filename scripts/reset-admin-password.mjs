/**
 * Reset admin password from the command line.
 *
 * Usage:
 *   node scripts/reset-admin-password.mjs <username> <new-password>
 *
 * Example:
 *   node scripts/reset-admin-password.mjs admin MyNewPassword123
 */

import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const require = createRequire(import.meta.url);

const [,, username, newPassword] = process.argv;

if (!username || !newPassword) {
  console.error("Usage: node scripts/reset-admin-password.mjs <username> <new-password>");
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

// Load bcryptjs
let bcrypt;
try {
  bcrypt = require("bcryptjs");
} catch {
  // Try pnpm deep path
  try {
    const mod = await import(
      new URL("../node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs/index.js", import.meta.url).href
    );
    bcrypt = mod.default ?? mod;
  } catch (e) {
    console.error("Could not load bcryptjs:", e.message);
    process.exit(1);
  }
}

// Load pg
let pg;
try {
  pg = require("pg");
} catch {
  try {
    const mod = await import(
      new URL("../node_modules/.pnpm/pg@8.22.0/node_modules/pg/lib/index.js", import.meta.url).href
    );
    pg = mod.default ?? mod;
  } catch (e) {
    console.error("Could not load pg:", e.message);
    process.exit(1);
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL });

try {
  const hash = await bcrypt.hash(newPassword, 12);

  const result = await pool.query(
    `UPDATE admins SET password_hash = $1 WHERE username = $2 RETURNING username`,
    [hash, username]
  );

  if (result.rowCount === 0) {
    console.error(`No admin found with username "${username}".`);
    await pool.end();
    process.exit(1);
  }

  console.log(`✓ Password for "${username}" has been reset successfully.`);
  await pool.end();
  process.exit(0);
} catch (e) {
  console.error("Error:", e.message);
  await pool.end();
  process.exit(1);
}
