import "dotenv/config";
import { execSync } from "child_process";

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error("❌ DIRECT_URL not set in .env");
  process.exit(1);
}

console.log("🚀 Pushing schema using DIRECT_URL (session pooler, port 5432)...");
execSync(`npx prisma db push --url "${directUrl}"`, { stdio: "inherit" });
