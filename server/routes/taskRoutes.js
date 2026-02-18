const express = require("express");
const router = express.Router();
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  createTask,
  getTasksByTeam,
  markInProgress,
  requestApproval,
  approveTask,
  rejectTask,
  filterTasks,
} = require("../controllers/taskController");

// ================== ADMIN / SUPERADMIN ROUTES ==================

// Admin or SuperAdmin can create task
router.post("/", protect, authorizeRoles("Admin", "SuperAdmin"), createTask);

// Get tasks by team (Admin or SuperAdmin)
router.get("/team/:teamId", protect, authorizeRoles("Admin", "SuperAdmin"), getTasksByTeam);

// Admin or SuperAdmin approve task
router.patch("/:id/approve", protect, authorizeRoles("Admin", "SuperAdmin"), approveTask);

// Admin or SuperAdmin reject task
router.patch("/:id/reject", protect, authorizeRoles("Admin", "SuperAdmin"), rejectTask);

// ================== MEMBER ROUTES ==================

// Member marks task as in progress
router.patch("/:id/in-progress", protect, authorizeRoles("Member"), markInProgress);

// Member requests approval
router.patch("/:id/request-approval", protect, authorizeRoles("Member"), requestApproval);

// ================== COMMON ROUTES ==================

// Filter & sort tasks (Admin, SuperAdmin, or Member)
router.get("/filter", protect, authorizeRoles("Admin", "SuperAdmin", "Member"), filterTasks);

module.exports = router;
