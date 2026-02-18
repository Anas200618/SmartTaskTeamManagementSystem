  const express = require("express");
  const router = express.Router();

  const { protect, authorizeRoles } = require("../middleware/authMiddleware");
  const {
    adminDashboard,
    memberDashboard,
    superAdminDashboard, // optional if you create a separate SuperAdmin dashboard
  } = require("../controllers/dashboardController");

  // ================= SuperAdmin Dashboard (optional) =================
  router.get(
    "/superadmin",
    protect,
    authorizeRoles("SuperAdmin"),
    superAdminDashboard
  );

  // ================= Admin Dashboard =================
  // Accessible by Admin and SuperAdmin
  router.get(
    "/admin",
    protect,
    authorizeRoles("Admin", "SuperAdmin"),
    adminDashboard
  );

  // ================= Member Dashboard =================
  router.get("/member", protect, authorizeRoles("Member", "Admin", "SuperAdmin"), memberDashboard);

  module.exports = router;
