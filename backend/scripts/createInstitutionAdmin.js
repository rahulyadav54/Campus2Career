/**
 * Create or update an institution admin user and link a college record.
 *
 * Usage:
 *   node scripts/createInstitutionAdmin.js
 *
 * Optional env overrides:
 *   INSTITUTION_ADMIN_EMAIL, INSTITUTION_ADMIN_PASSWORD,
 *   INSTITUTION_NAME, INSTITUTION_CODE, INSTITUTION_CITY, INSTITUTION_STATE
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/UserModel.js";
import Institution from "../models/InstitutionModel.js";

dotenv.config();

const createInstitutionAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const email = (process.env.INSTITUTION_ADMIN_EMAIL || "institution@sonacollege.in").toLowerCase().trim();
    const password = process.env.INSTITUTION_ADMIN_PASSWORD || "Sona@123";
    const institutionName = process.env.INSTITUTION_NAME || "Sona College";
    const institutionCode = (process.env.INSTITUTION_CODE || "SONA").toUpperCase().trim();
    const city = process.env.INSTITUTION_CITY || "";
    const state = process.env.INSTITUTION_STATE || "";

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    let user = await User.findOne({ email }).select("+password");
    if (user && user.role !== "institution" && user.role !== "admin") {
      throw new Error(`The email ${email} belongs to a ${user.role} account — use a different email`);
    }

    if (!user) {
      user = new User({ email });
    }

    user.name = user.name || `${institutionName} TPO`;
    user.password = password;
    user.role = "institution";
    user.status = "active";
    user.institution = institutionName;
    user.designation = user.designation || "Training & Placement Officer";
    await user.save();

    let institution = await Institution.findOne({ code: institutionCode });
    if (!institution) {
      institution = await Institution.create({
        name: institutionName,
        code: institutionCode,
        city,
        state,
        email,
        type: "college",
        adminUser: user._id,
        isActive: true,
      });
      console.log(`✅ Created institution: ${institutionName} (${institutionCode})`);
    } else {
      institution.name = institutionName;
      institution.adminUser = user._id;
      if (city) institution.city = city;
      if (state) institution.state = state;
      institution.email = email;
      institution.isActive = true;
      await institution.save();
      console.log(`✅ Updated institution: ${institutionName} (${institutionCode})`);
    }

    console.log("✅ Institution admin ready");
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role:     institution`);
    console.log(`   College:  ${institutionName}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createInstitutionAdmin();
