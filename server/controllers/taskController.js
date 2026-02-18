const Task = require("../models/Task");
const Notification = require("../models/Notification");

// ============ CREATE TASK (Admin or SuperAdmin) ============
exports.createTask = async (req, res) => {
  try {
    if (!["Admin", "SuperAdmin"].includes(req.user.role))
      return res.status(403).json({ message: "Access denied" });

    const { title, description, teamId, assignedTo, priority, dueDate } = req.body;

    if (dueDate && new Date(dueDate) < new Date()) {
      return res.status(400).json({ message: "Due date cannot be in the past" });
    }

    const task = await Task.create({
      title,
      description,
      teamId,
      assignedTo,
      priority,
      dueDate,
      createdBy: req.user.id 
    });

    // --- REAL-TIME & PERSISTENT NOTIFICATION ---
    const io = req.app.get("socketio");
    if (assignedTo) {
      // 1. Save to Database for history
      const newNotif = await Notification.create({
        recipient: assignedTo,
        title: "New Assignment",
        message: `You have been assigned: ${title}`,
        type: "info"
      });

      // 2. Emit via socket (sending the whole object so frontend has the ID)
      io.to(assignedTo.toString()).emit("new_notification", newNotif);
    }

    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============ GET TASKS FOR TEAM (Admin or SuperAdmin) ============
exports.getTasksByTeam = async (req, res) => {
  try {
    if (!["Admin", "SuperAdmin"].includes(req.user.role))
      return res.status(403).json({ message: "Access denied" });

    const tasks = await Task.find({ teamId: req.params.teamId })
      .populate("assignedTo", "name email")
      .populate("teamId", "teamName");

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============ MEMBER: MARK TASK IN PROGRESS ============
exports.markInProgress = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (
      task.assignedTo.toString() !== req.user.id &&
      !["Admin", "SuperAdmin"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    task.status = "In Progress";
    await task.save();

    res.json({ message: "Task marked as In Progress", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============ MEMBER: REQUEST APPROVAL ============
exports.requestApproval = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.assignedTo.toString() !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    task.status = "Pending Approval";
    await task.save();

    // --- REAL-TIME & PERSISTENT NOTIFICATION ---
    const io = req.app.get("socketio");
    if (task.createdBy) {
      // 1. Save to Database
      const newNotif = await Notification.create({
        recipient: task.createdBy,
        title: "Approval Requested",
        message: `${req.user.name || 'A member'} submitted "${task.title}"`,
        type: "warning"
      });

      // 2. Emit to Admin
      io.to(task.createdBy.toString()).emit("new_notification", newNotif);
    }

    res.json({ message: "Approval requested", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============ ADMIN / SUPERADMIN: APPROVE TASK ============
exports.approveTask = async (req, res) => {
  try {
    if (!["Admin", "SuperAdmin"].includes(req.user.role))
      return res.status(403).json({ message: "Access denied" });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = "Completed";
    await task.save();

    // --- REAL-TIME & PERSISTENT NOTIFICATION ---
    const io = req.app.get("socketio");
    // 1. Save to Database
    const newNotif = await Notification.create({
      recipient: task.assignedTo,
      title: "Task Approved! 🎉",
      message: `Your task "${task.title}" was marked as Completed.`,
      type: "success"
    });

    // 2. Emit to Member
    io.to(task.assignedTo.toString()).emit("new_notification", newNotif);

    res.json({ message: "Task approved and marked Completed", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============ ADMIN / SUPERADMIN: REJECT TASK ============
exports.rejectTask = async (req, res) => {
  try {
    if (!["Admin", "SuperAdmin"].includes(req.user.role))
      return res.status(403).json({ message: "Access denied" });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.status = "Todo"; 
    await task.save();

    // --- REAL-TIME & PERSISTENT NOTIFICATION ---
    const io = req.app.get("socketio");
    // 1. Save to Database
    const newNotif = await Notification.create({
      recipient: task.assignedTo,
      title: "Task Rejected",
      message: `Admin requested changes on: ${task.title}`,
      type: "error"
    });

    // 2. Emit to Member
    io.to(task.assignedTo.toString()).emit("new_notification", newNotif);

    res.json({ message: "Task rejected", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============ FILTER & SORT TASKS ============
exports.filterTasks = async (req, res) => {
  try {
    const { status, priority, teamId, assignedTo, sortBy } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (teamId) filter.teamId = teamId;
    if (assignedTo) filter.assignedTo = assignedTo;

    let sort = {};
    if (sortBy === "dueDate") sort.dueDate = 1; 
    if (sortBy === "priority") sort.priority = 1; 

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("teamId", "teamName")
      .sort(sort);

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};