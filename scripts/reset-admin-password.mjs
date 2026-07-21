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

// Dynamically load bcryptjs from the workspace
const bcryptPath = new URL(
  "../node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs/index.js",
  import.meta.url
);

let bcrypt;
try {
  const mod = await import(bcryptPath.href);
  bcrypt = mod.default ?? mod;
} catch {
  console.error("Could not load bcryptjs. Make sure you have run `pnpm install`.");
  process.exit(1);
}

// Load postgres from the db package
let db, adminsTable, eq;
try {
  const dbMod = await import("../lib/db/src/index.ts").catch(() => null)
    ?? await import("../lib/db/dist/index.js").catch(() => null);
  if (!dbMod) throw new Error("db module not found");
  db = dbMod.db;
  adminsTable = dbMod.adminsTable;

  const drizzleMod = await import("drizzle-orm");
  eq = drizzleMod.eq;
} catch (e) {
  console.error("Could not load database module:", e.message);
  console.error("\nFallback: run this SQL directly in your database:\n");
  const hash = await bcrypt.hash(newPassword, 12);
  console.error(`UPDATE admins SET password_hash = '${hash}' WHERE username = '${username}';`);
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(newPassword, 12);
  const result = await db
    .update(adminsTable)
    .set({ passwordHash: hash })
    .where(eq(adminsTable.username, username))
    .returning({ username: adminsTable.username });

  if (result.length === 0) {
    console.error(`No admin found with username "${username}".`);
    process.exit(1);
  }

  console.log(`✓ Password for "${username}" has been reset successfully.`);
  process.exit(0);
} catch (e) {
  console.error("Database error:", e.message);
  process.exit(1);
}
