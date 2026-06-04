#!/usr/bin/env node
/**
 * Apply schema via Supabase Management API (needs SUPABASE_ACCESS_TOKEN)
 * OR via direct Postgres (needs DATABASE_URL in env).
 *
 * Fallback: prints link to SQL Editor.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = resolve(root, "supabase/schema.sql");
const sql = readFileSync(schemaPath, "utf8");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("DATABASE_URL not set — cannot auto-run SQL.");
  console.log(
    "Run supabase/schema.sql manually:\n  https://supabase.com/dashboard/project/rxdacregzkvfwsmfkchi/sql/new\n"
  );
  process.exit(0);
}

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log("Schema applied successfully.");
} catch (err) {
  console.error("Schema apply failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
