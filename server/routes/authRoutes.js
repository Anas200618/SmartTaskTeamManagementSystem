const express = require("express");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ================= MULTER CONFIGURATION =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for professional apps
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
  }
});

// Helper for Mongoose Error Handling
const handleErrors = (err, res) => {
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ message: messages[0] }); // Return the first validation error
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: "Email or Phone already exists" });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
};

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists before attempting creation
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const assignedRole = ["Admin", "Member"].includes(role) ? role : "Member";

    // Hash Password
    // Note: We check length here because Mongoose validation happens on the hashed string if we hash it first
    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
      adminAccess: assignedRole === "Admin" ? false : true,
      createdBy: null,
    });

    res.status(201).json({
      message: assignedRole === "Admin" 
        ? "Admin account created. Approval from SuperAdmin is required." 
        : "User registered successfully",
      user: newUser // Schema transform will automatically remove password
    });
  } catch (error) {
    handleErrors(error, res);
  }
});

// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // We explicitly select password because toJSON transform might have hidden it
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.role === "Admin" && !user.adminAccess) {
      return res.status(403).json({
        message: "Your Admin account is pending approval from SuperAdmin.",
        adminAccess: false,
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user
    });
  } catch (error) {
    handleErrors(error, res);
  }
});

// ================= CREATE SUPERADMIN =================
router.post("/create-superadmin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingSuperAdmin = await User.findOne({ role: "SuperAdmin" });
    if (existingSuperAdmin) {
      return res.status(400).json({ message: "SuperAdmin already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const superAdmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "SuperAdmin",
      adminAccess: true,
    });

    res.status(201).json({ message: "SuperAdmin created", user: superAdmin });
  } catch (error) {
    handleErrors(error, res);
  }
});

// ================= TOGGLE ADMIN ACCESS =================
router.put("/toggle-access/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Permission denied" });
    }

    const user = await User.findById(req.params.id);
    if (!user || user.role !== "Admin") {
      return res.status(404).json({ message: "Admin user not found" });
    }

    user.adminAccess = !user.adminAccess;
    await user.save();

    res.json({ message: `Access ${user.adminAccess ? 'granted' : 'revoked'}`, adminAccess: user.adminAccess });
  } catch (error) {
    handleErrors(error, res);
  }
});

// ================= GET ALL USERS =================
router.get("/all-users", protect, async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const users = await User.find().sort("-createdAt");
    res.json(users);
  } catch (error) {
    handleErrors(error, res);
  }
});

// ================= GET CURRENT USER =================
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    handleErrors(error, res);
  }
});

// ================= UPDATE CURRENT USER PROFILE ===============
router.put("/update-profile", protect, (req, res, next) => {
  // We wrap the upload in a custom handler to catch "File too large" errors
  upload.single("avatar")(req, res, (err) => {
    if (err) {
      // If the error is from Multer (like file size)
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { name, email, phone, designation } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Handle File Update & Cleanup
    if (req.file) {
      if (user.avatar && user.avatar.startsWith("/uploads/")) {
        const oldAvatarPath = path.join(__dirname, "..", user.avatar);
        
        // Check if file exists before trying to delete
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlink(oldAvatarPath, (err) => {
            if (err) console.error("Could not delete old avatar:", err);
          });
        }
      }
      // Save the new unique filename path
      user.avatar = `/uploads/${req.file.filename}`;
    }

    // 2. Update text fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (designation) user.designation = designation;

    // 3. Save & Validate
    await user.save();

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    // This uses your helper function that handles 11000 (duplicate) errors
    handleErrors(error, res);
  }
});

module.exports = router;