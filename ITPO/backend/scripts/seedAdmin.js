import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/UserModel.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = (process.env.ADMIN_EMAIL || "admin@itpo.com").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 8) {
      throw new Error("Set ADMIN_PASSWORD to a value with at least 8 characters before running this script");
    }

    const existing = await User.findOne({ email }).select("+password");
    if (existing && existing.role !== "admin") {
      throw new Error(`The email ${email} belongs to a non-admin account`);
    }

    const admin = existing || new User({ email });
    admin.name = admin.name || "Admin";
    admin.password = password;
    admin.role = "admin";
    admin.status = "active";
    await admin.save();
    console.log(existing ? "Admin credentials updated successfully" : "Admin created successfully");
    console.log(`Admin email configured: ${email}`);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
