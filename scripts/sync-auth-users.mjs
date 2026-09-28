/**
 * Script: sync-auth-users.mjs
 *
 * Sync Supabase Auth UUIDs ke tabel User di database.
 * Jalankan SETELAH membuat semua user di Supabase Auth Dashboard.
 *
 * Usage:
 *   npm run db:sync-auth
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
  console.error("❌ Missing environment variables. Check .env file.");
  process.exit(1);
}

// Supabase admin client (bisa akses auth.users)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Prisma client
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔄 Syncing Supabase Auth UUIDs to database...\n");

  // 1. Fetch all users from Supabase Auth
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("❌ Failed to fetch Auth users:", error.message);
    console.error("   Make sure SUPABASE_SERVICE_ROLE_KEY is correct.");
    process.exit(1);
  }

  console.log(`📋 Found ${authUsers.users.length} users in Supabase Auth:\n`);
  authUsers.users.forEach((u) => {
    console.log(`   ${u.email} → ${u.id}`);
  });
  console.log();

  // 2. Sync each auth user to database User record
  let synced = 0;
  let notFound = 0;

  for (const authUser of authUsers.users) {
    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (!dbUser) {
      console.log(`⚠️  No DB record for: ${authUser.email} (skipped)`);
      notFound++;
      continue;
    }

    if (dbUser.supabaseId === authUser.id) {
      console.log(`✓  Already synced: ${authUser.email}`);
      synced++;
      continue;
    }

    // Update supabaseId
    await prisma.user.update({
      where: { email: authUser.email },
      data: { supabaseId: authUser.id },
    });

    console.log(`✅ Synced: ${authUser.email}`);
    console.log(`   DB supabaseId updated: ${dbUser.supabaseId} → ${authUser.id}`);
    synced++;
  }

  console.log("\n" + "═".repeat(50));
  console.log("📊 Sync Summary");
  console.log("═".repeat(50));
  console.log(`   Synced:    ${synced}`);
  console.log(`   Not found: ${notFound}`);
  console.log("\n✅ Done! Users can now log in.");

  // 3. Verify
  const dbUsers = await prisma.user.findMany({
    select: { email: true, supabaseId: true, name: true },
  });

  console.log("\n📋 Current DB User → supabaseId mapping:");
  dbUsers.forEach((u) => {
    const isReal = !u.supabaseId.includes("-uuid"); // placeholder check
    console.log(`   ${isReal ? "✅" : "⚠️ "} ${u.name} (${u.email})`);
    console.log(`      supabaseId: ${u.supabaseId}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
