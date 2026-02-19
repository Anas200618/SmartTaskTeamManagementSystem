// scripts/createSuperAdmin.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// 🔥 Load env from parent folder
require("dotenv").config({ path: "../.env" });

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("DB Error:", err));

async function createSuperAdmins() {
  try {
    const admins = [
      {
        email: process.env.SUPERADMIN1_EMAIL,
        password: process.env.SUPERADMIN1_PASSWORD,
      },
      {
        email: process.env.SUPERADMIN2_EMAIL,
        password: process.env.SUPERADMIN2_PASSWORD,
      },
      {
        email: process.env.SUPERADMIN3_EMAIL,
        password: process.env.SUPERADMIN3_PASSWORD,
      },
    ];

    for (const admin of admins) {
      if (!admin.email || !admin.password) continue;

      const existing = await User.findOne({ email: admin.email });

      if (existing) {
        console.log(`⚠️ ${admin.email} already exists`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 10);

      await User.create({
        name: "Super Admin",
        email: admin.email,
        password: hashedPassword,
        role: "SuperAdmin",
      });

      console.log(`✅ SuperAdmin created: ${admin.email}`);
    }

    console.log("🎉 Process Completed");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

createSuperAdmins();
