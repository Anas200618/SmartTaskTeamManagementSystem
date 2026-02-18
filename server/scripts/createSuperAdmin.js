// scripts/createSuperAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function createSuperAdmin() {
  const existing = await User.findOne({ role: "SuperAdmin" });
  if (existing) {
    console.log("SuperAdmin already exists");
    return process.exit();
  }

  const hashedPassword = await bcrypt.hash("SuperAdmin123!", 10);

  const superAdmin = new User({
    name: "Super Admin",
    email: "superadmin@example.com",
    password: hashedPassword,
    role: "SuperAdmin",
  });

  await superAdmin.save();
  console.log("Super Admin created successfully");
  process.exit();
}

createSuperAdmin();
