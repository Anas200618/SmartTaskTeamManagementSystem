const Team = require("../models/Team");
const User = require("../models/User");
const mongoose = require("mongoose");


// ================= HELPER =================
const populateTeam = async (teamId) => {
  return Team.findById(teamId)
    .populate("createdBy", "name email role")
    .populate("members", "name email designation role");
};


// ================= CREATE TEAM =================
exports.createTeam = async (req, res) => {
  try {
    const { teamName } = req.body;

    if (!teamName || teamName.trim().length < 3) {
      return res.status(400).json({
        message: "Team name must be at least 3 characters",
      });
    }

    const existingTeam = await Team.findOne({
      teamName: teamName.trim(),
    });

    if (existingTeam) {
      return res.status(400).json({
        message: "Team name already exists",
      });
    }

    const team = await Team.create({
      teamName: teamName.trim(),
      createdBy: req.user._id,
      members: [],
    });

    const populatedTeam = await populateTeam(team._id);

    res.status(201).json({
      message: "Team created successfully",
      team: populatedTeam,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= GET TEAMS =================
exports.getTeams = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    let query = {
      teamName: { $regex: search, $options: "i" },
    };

    /**
     * Admin → Only their teams
     * SuperAdmin → All teams
     */
    if (req.user.role === "Admin") {
      query.createdBy = req.user._id;
    }

    const total = await Team.countDocuments(query);

    const teams = await Team.find(query)
      .populate("createdBy", "name email role")
      .populate("members", "name email designation role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: teams,
      total,
      page,
      pages: Math.ceil(total / limit),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= GET SINGLE TEAM =================
exports.getSingleTeam = async (req, res) => {
  try {
    const team = await populateTeam(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // Admin ownership check
    if (
      req.user.role === "Admin" &&
      team.createdBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.status(200).json(team);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= UPDATE TEAM =================
exports.updateTeam = async (req, res) => {
  try {
    const { teamName } = req.body;

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // Admin ownership check
    if (
      req.user.role === "Admin" &&
      team.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (!teamName || teamName.trim().length < 3) {
      return res.status(400).json({
        message: "Team name must be at least 3 characters",
      });
    }

    team.teamName = teamName.trim();

    await team.save();

    const populatedTeam = await populateTeam(team._id);

    res.status(200).json({
      message: "Team updated successfully",
      team: populatedTeam,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= DELETE TEAM =================
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // Admin ownership check
    if (
      req.user.role === "Admin" &&
      team.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await team.deleteOne();

    res.status(200).json({
      message: "Team deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= ADD MEMBER =================
exports.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // Admin ownership check
    if (
      req.user.role === "Admin" &&
      team.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    /**
     * GLOBAL VALIDATION
     * User can exist in ONLY ONE team
     */
    const existingTeam = await Team.findOne({
      members: objectUserId,
    });

    if (existingTeam) {
      return res.status(400).json({
        message: "User already assigned to another team",
      });
    }

    // Add member
    team.members.push(objectUserId);
    await team.save();

    const populatedTeam = await populateTeam(id);

    res.status(200).json({
      message: "Member added successfully",
      team: populatedTeam,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= REMOVE MEMBER =================
exports.removeMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // Admin ownership check
    if (
      req.user.role === "Admin" &&
      team.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    team.members = team.members.filter(
      (member) => member.toString() !== userId
    );

    await team.save();

    const populatedTeam = await populateTeam(id);

    res.status(200).json({
      message: "Member removed successfully",
      team: populatedTeam,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= UPDATE USER =================
exports.updateUser = async (req, res) => {
  try {
    const { name, email, designation } = req.body;
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Only SuperAdmin can update Admin
    if (user.role === "Admin" && req.user.role !== "SuperAdmin") {
      return res.status(403).json({
        message: "Only SuperAdmin can update Admin users",
      });
    }

    user.name = name?.trim() || user.name;
    user.email = email?.trim().toLowerCase() || user.email;
    user.designation = designation?.trim() || "";

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= DELETE USER =================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Only SuperAdmin can delete Admin
    if (user.role === "Admin" && req.user.role !== "SuperAdmin") {
      return res.status(403).json({
        message: "Only SuperAdmin can delete Admin users",
      });
    }

    await user.deleteOne();

    // Remove from any team
    await Team.updateMany(
      { members: id },
      { $pull: { members: id } }
    );

    res.status(200).json({
      message: "User deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
