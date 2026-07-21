/**
 * Uploads the main banner image to Replit Object Storage and creates the banner DB record.
 * Run from workspace root: node scripts/upload-banner.mjs
 */
import { readFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

let pg;
try {
  pg = require("pg");
} catch {
  const mod = await import(
    new URL("../node_modules/.pnpm/pg@8.22.0/node_modules/pg/lib/index.js", import.meta.url).href
  );
  pg = mod.default ?? mod;
}

const SIDECAR = "http://127.0.0.1:1106";
const BUCKET = "replit-objstore-dd4ee4f5-e05d-457d-876f-92ad0ff15019";
const OBJECT_NAME = "public/banners/main-banner.jpg";

async function getSignedUrl(method, objectName, ttlSec = 900) {
  const res = await fetch(`${SIDECAR}/object-storage/signed-object-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bucket_name: BUCKET,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`Sidecar error ${res.status}: ${await res.text()}`);
  const { signed_url } = await res.json();
  return signed_url;
}

async function main() {
  // 1. Read rendered image
  const imgBytes = readFileSync(".agents/outputs/banner.jpg");
  console.log(`Image size: ${(imgBytes.length / 1024 / 1024).toFixed(2)} MB`);

  // 2. Presigned PUT URL
  console.log("Getting signed upload URL...");
  const uploadUrl = await getSignedUrl("PUT", OBJECT_NAME);

  // 3. Upload
  console.log("Uploading...");
  const upRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: imgBytes,
  });
  if (!upRes.ok) throw new Error(`Upload failed ${upRes.status}: ${await upRes.text()}`);
  console.log("Upload complete.");

  // 4. The path the API serves this file at
  const servedPath = "/api/storage/public-objects/banners/main-banner.jpg";

  // 5. Upsert banner record
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) throw new Error("DATABASE_URL not set");

  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  // Clear existing banners so this is the sole active banner
  await client.query("DELETE FROM banners");

  const { rows } = await client.query(
    `INSERT INTO banners (title, subtitle, image_url, link_url, button_text, is_active, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      "Jabeen Jewels",
      "Carefully curated pieces designed to complement every style and every occasion.",
      servedPath,
      "/products",
      "Shop Now",
      true,
      0,
    ]
  );

  await client.end();
  console.log("Banner record created, id:", rows[0].id);
  console.log("Served at:", servedPath);
}

main().catch(e => { console.error(e); process.exit(1); });
