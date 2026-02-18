const Team = require("../models/Team");
const Task = require("../models/Task");
const User = require("../models/User");
const TimeLog = require("../models/TimeLog");
const mongoose = require("mongoose");

/**
 * Helper to format seconds into HHh MMm
 */
const formatTime = (seconds) => {
  if (!seconds) return "0h 0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

// ================= Admin Dashboard =================
const adminDashboard = async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments();
    const totalTasks = await Task.countDocuments();

    // 1. Setup Date Ranges
    const now = new Date();
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const startOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 2. Task Stats Summary
    const stats = {
      completedTasks: await Task.countDocuments({ status: "Completed" }),
      inProgressTasks: await Task.countDocuments({ status: "In Progress" }),
      completionRequested: await Task.countDocuments({ status: "Completion Requested" }),
      pendingTasks: await Task.countDocuments({ status: "Todo" }),
    };

    // 3. Team Performance (Hours & Active Task Count)
    const teamMembers = await User.find({ role: "Member" }).select("name");
    const teamPerformance = await Promise.all(
      teamMembers.map(async (member) => {
        const logs = await TimeLog.aggregate([
          { $match: { user: member._id, endTime: { $exists: true } } },
          {
            $facet: {
              today: [{ $match: { startTime: { $gte: startOfToday } } }, { $group: { _id: null, sum: { $sum: "$duration" } } }],
              weekly: [{ $match: { startTime: { $gte: startOfWeek } } }, { $group: { _id: null, sum: { $sum: "$duration" } } }],
              monthly: [{ $match: { startTime: { $gte: startOfMonth } } }, { $group: { _id: null, sum: { $sum: "$duration" } } }],
            },
          },
        ]);

        const activeTasks = await Task.countDocuments({ 
          assignedTo: member._id, 
          status: { $ne: "Completed" } 
        });

        return {
          name: member.name,
          today: formatTime(logs[0]?.today?.[0]?.sum || 0),
          weekly: formatTime(logs[0]?.weekly?.[0]?.sum || 0),
          monthly: formatTime(logs[0]?.monthly?.[0]?.sum || 0),
          activeTasks,
        };
      })
    );

    // 4. Annual 12-Month Trend (Hours per month)
    const annualTrendRaw = await TimeLog.aggregate([
      { $match: { startTime: { $gte: startOfYear }, endTime: { $exists: true } } },
      {
        $group: {
          _id: { $month: "$startTime" },
          totalHours: { $sum: { $divide: ["$duration", 3600] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const annualTrend = { labels: monthNames, data: new Array(12).fill(0) };
    annualTrendRaw.forEach((item) => {
      annualTrend.data[item._id - 1] = Math.round(item.totalHours);
    });

    // 5. Workload Heatmap
    const workloadHeatmap = await User.aggregate([
      { $match: { role: "Member" } },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "assignedTo",
          as: "userTasks",
        },
      },
      {
        $project: {
          name: 1,
          pendingCount: {
            $size: {
              $filter: {
                input: "$userTasks",
                as: "task",
                cond: { $ne: ["$$task.status", "Completed"] },
              },
            },
          },
        },
      },
      { $sort: { pendingCount: -1 } },
    ]);

    res.json({
      teamMembers: teamMembers.length,
      totalTeams,
      totalTasks,
      ...stats,
      teamPerformance,
      annualTrend,
      workloadHeatmap,
    });
  } catch (err) {
    console.error("Admin Dashboard Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= Member Dashboard =================
const memberDashboard = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const tasks = await Task.find({ assignedTo: userId });

    const now = new Date();
    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const startOfWeek = new Date(new Date().setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const timeStats = await TimeLog.aggregate([
      { $match: { user: userId, endTime: { $exists: true } } },
      {
        $facet: {
          today: [{ $match: { startTime: { $gte: startOfDay } } }, { $group: { _id: null, total: { $sum: "$duration" } } }],
          weekly: [{ $match: { startTime: { $gte: startOfWeek } } }, { $group: { _id: null, total: { $sum: "$duration" } } }],
          monthly: [{ $match: { startTime: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: "$duration" } } }],
        },
      },
    ]);

    const workingHours = {
      today: formatTime(timeStats[0]?.today?.[0]?.total || 0),
      weekly: formatTime(timeStats[0]?.weekly?.[0]?.total || 0),
      monthly: formatTime(timeStats[0]?.monthly?.[0]?.total || 0),
    };

    const completedCount = tasks.filter((t) => t.status === "Completed").length;
    const completionRate = tasks.length > 0 ? ((completedCount / tasks.length) * 100).toFixed(1) : 0;

    res.json({
      assignedTasks: tasks.length,
      completedTasks: completedCount,
      pendingTasks: tasks.filter((t) => t.status === "Todo").length,
      completionRequested: tasks.filter((t) => t.status === "Completion Requested").length,
      inProgressTasks: tasks.filter((t) => t.status === "In Progress").length,
      workingHours,
      completionRate,
    });
  } catch (err) {
    console.error("Member Dashboard Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= SuperAdmin Dashboard =================
const superAdminDashboard = async (req, res) => {
  try {
    const totalAdmins = await User.countDocuments({ role: "Admin" });
    const totalMembers = await User.countDocuments({ role: "Member" });
    const totalTeams = await Team.countDocuments();
    const totalTasks = await Task.countDocuments();

    const totalTimeLogged = await TimeLog.aggregate([
      { $group: { _id: null, total: { $sum: "$duration" } } },
    ]);

    res.json({
      totalAdmins,
      totalMembers,
      totalTeams,
      totalTasks,
      totalSystemHours: formatTime(totalTimeLogged[0]?.total || 0),
      completedTasks: await Task.countDocuments({ status: "Completed" }),
      pendingTasks: await Task.countDocuments({ status: "Todo" }),
    });
  } catch (err) {
    console.error("SuperAdmin Dashboard Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Crucial for router/dashboardRoutes.js
module.exports = {
  adminDashboard,
  memberDashboard,
  superAdminDashboard,
};