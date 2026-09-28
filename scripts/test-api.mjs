/**
 * Script: test-api.mjs
 * Test adding a new student via the API and verify the result
 *
 * Usage: node --env-file=.env scripts/test-api.mjs
 * (requires dev server running at localhost:3000)
 */

import "dotenv/config";
import pg from "pg";

const BASE_URL = "http://localhost:3000";

// Use DIRECT_URL (session pooler port 5432) — works outside Next.js runtime
const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL });

async function main() {
  console.log("🧪 Muadalah API Test — Add New Student\n");
  console.log("=".repeat(50));

  // ── Step 1: Get valid classId + schoolId from DB ───────
  console.log("\n📋 Step 1: Fetching available classes from DB...");
  const { rows: classes } = await pool.query(
    `SELECT id, name, grade, "schoolId" FROM "Class" LIMIT 3`
  );

  classes.forEach((c) => console.log(`   Kelas ${c.name} (Grade ${c.grade}) → id: ${c.id}`));

  const targetClass = classes[0];
  if (!targetClass) {
    console.error("❌ No classes found. Run: npm run db:seed");
    process.exit(1);
  }
  console.log(`\n   Using class: ${targetClass.name} (${targetClass.id})`);

  // ── Step 2: GET students before ────────────────────────
  console.log("\n📊 Step 2: Current student count...");
  const beforeRes = await fetch(
    `${BASE_URL}/api/students?schoolId=${targetClass.schoolId}&limit=100`
  );
  const beforeData = await beforeRes.json();

  if (!beforeRes.ok) {
    console.error(`   ❌ GET failed (${beforeRes.status}): ${JSON.stringify(beforeData)}`);
    process.exit(1);
  }
  console.log(`   Total students before: ${beforeData.meta.total}`);

  // ── Step 3: POST new student ───────────────────────────
  const timestamp = Date.now();
  const newStudent = {
    nis: `TST-${timestamp}`,
    name: "Siswa Test API",
    gender: "LAKI_LAKI",
    classId: targetClass.id,
    nisn: `999${timestamp.toString().slice(-7)}`,
    birthPlace: "Jakarta",
    birthDate: "2012-03-20",
    religion: "Islam",
    address: "Jl. Test API No. 1, Jakarta",
    phone: "081200000001",
    parentContacts: [
      {
        name: "Ayah Test",
        relation: "Ayah",
        phone: "081200000002",
        email: "ayah.test@example.com",
      },
    ],
  };

  console.log("\n➕ Step 3: Creating new student via POST /api/students...");
  console.log(`   Name  : ${newStudent.name}`);
  console.log(`   NIS   : ${newStudent.nis}`);
  console.log(`   Class : ${targetClass.name}`);

  const postRes = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newStudent),
  });
  const postData = await postRes.json();

  console.log(`\n   HTTP Status: ${postRes.status}`);

  if (!postRes.ok) {
    console.error(`   ❌ POST failed: ${JSON.stringify(postData, null, 2)}`);
    process.exit(1);
  }

  const created = postData.data;
  console.log(`   ✅ Student created!`);
  console.log(`      ID      : ${created.id}`);
  console.log(`      Name    : ${created.name}`);
  console.log(`      Class   : ${created.class.name}`);
  console.log(`      Status  : ${created.status}`);
  console.log(`      Contacts: ${created.parentContacts.length}`);

  // ── Step 4: GET student by ID ──────────────────────────
  console.log(`\n🔍 Step 4: Verifying via GET /api/students/${created.id}...`);
  const detailRes = await fetch(`${BASE_URL}/api/students/${created.id}`);
  const detailData = await detailRes.json();

  console.log(`   HTTP Status: ${detailRes.status}`);

  if (!detailRes.ok) {
    console.error(`   ❌ GET by ID failed: ${JSON.stringify(detailData)}`);
  } else {
    const s = detailData.data;
    console.log(`   ✅ Confirmed in DB:`);
    console.log(`      Name   : ${s.name}`);
    console.log(`      NIS    : ${s.nis}`);
    console.log(`      Class  : ${s.class.name} (${s.class.school.name})`);
    console.log(`      Status : ${s.status}`);
  }

  // ── Step 5: Count after ────────────────────────────────
  console.log(`\n📊 Step 5: Student count after creation...`);
  const afterRes = await fetch(
    `${BASE_URL}/api/students?schoolId=${targetClass.schoolId}&limit=100`
  );
  const afterData = await afterRes.json();
  const diff = afterData.meta.total - beforeData.meta.total;
  console.log(`   Before : ${beforeData.meta.total}`);
  console.log(`   After  : ${afterData.meta.total}`);
  console.log(`   Diff   : +${diff} (expected: +1)`);

  // ── Summary ────────────────────────────────────────────
  console.log("\n" + "=".repeat(50));
  if (diff === 1) {
    console.log("✅ ALL TESTS PASSED — API working correctly!\n");
  } else {
    console.log("⚠️  Count mismatch — check results above.\n");
  }
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e.message);
    process.exit(1);
  })
  .finally(() => pool.end());
