const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const User = require("../models/User");


// ================= GET ALL ADMINS =================
// Only SuperAdmin
router.get("/admins", protect, async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const admins = await User.find({ role: "Admin" }).select("-password");
    res.json(admins);

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// ================= TOGGLE ADMIN ACCESS =================
router.patch("/:id/toggle-access", protect, async (req, res) => {
  try {
    if (req.user.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "Admin") {
      return res.status(400).json({ message: "Not an admin user" });
    }

    user.adminAccess = !user.adminAccess;
    await user.save();

    res.json({
      message: "Admin access updated",
      adminAccess: user.adminAccess,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});


// ================= GET ALL USERS =================
router.get("/", protect, async (req, res) => {
  try {
    let users;

    if (req.user.role === "SuperAdmin") {
      users = await User.find().select("-password");
    } else if (req.user.role === "Admin") {
      users = await User.find({ role: "Member" }).select("-password");
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(users);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


// ================= GET SINGLE USER =================
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      req.user.role === "SuperAdmin" ||
      (req.user.role === "Admin" && user.role === "Member")
    ) {
      return res.json(user);
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


// ================= UPDATE USER =================
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, email, role, designation } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      req.user.role === "SuperAdmin" ||
      (req.user.role === "Admin" && user.role === "Member")
    ) {
      user.name = name || user.name;
      user.email = email || user.email;

      if (req.user.role === "SuperAdmin") {
        user.role = role || user.role;
      }

      user.designation = designation || user.designation;

      await user.save();

      return res.json({ message: "User updated successfully", user });

    } else {
      return res.status(403).json({ message: "Access denied" });
    }

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


// ================= DELETE USER =================
router.delete(
  "/:id",
  protect,
  authorizeRoles("SuperAdmin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) return res.status(404).json({ message: "User not found" });

      await user.deleteOne();

      res.json({ message: "User deleted successfully" });y

    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
