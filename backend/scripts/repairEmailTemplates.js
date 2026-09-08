/**
 * One-time repair: replace baked sample names in email templates with {{placeholders}}.
 * Run: node backend/scripts/repairEmailTemplates.js
 */
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import EmailService from "../services/email/EmailService.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  await connectDB();
  await EmailService.seedTemplates();
  console.log("Email templates repaired. Each email will now use the recipient's actual name.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
