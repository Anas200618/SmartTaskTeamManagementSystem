const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const {
  createTeam,
  getTeams,
  getSingleTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  updateUser,   // Update team member
  deleteUser    // Delete team member
} = require("../controllers/teamController");

// ================= PUBLIC / PROTECTED TEAM ROUTES =================
// Any logged-in user can view all teams or a single team
router.get("/", protect, getTeams);
router.get("/:id", protect, getSingleTeam);

// ================= ADMIN & SUPERADMIN TEAM MANAGEMENT =================
// Admin can manage their own teams; SuperAdmin can manage all teams
router.post("/", protect, authorizeRoles("Admin", "SuperAdmin"), createTeam);
router.put("/:id", protect, authorizeRoles("Admin", "SuperAdmin"), updateTeam);
router.delete("/:id", protect, authorizeRoles("Admin", "SuperAdmin"), deleteTeam);

// ================= ADMIN & SUPERADMIN TEAM MEMBER MANAGEMENT =================
router.put("/:id/add-member", protect, authorizeRoles("Admin", "SuperAdmin"), addMember);
router.put("/:id/remove-member", protect, authorizeRoles("Admin", "SuperAdmin"), removeMember);

// ================= SUPERADMIN USER CRUD =================
// Only SuperAdmin delete users including Admins
router.put("/user/:id", protect, authorizeRoles("Admin","SuperAdmin"), updateUser);
router.delete("/user/:id", protect, authorizeRoles("SuperAdmin"), deleteUser);

module.exports = router;
