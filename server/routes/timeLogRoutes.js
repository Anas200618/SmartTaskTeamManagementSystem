const express = require("express");
const router = express.Router();
const TimeLog = require("../models/TimeLog");
const { protect } = require("../middleware/authMiddleware");

// @desc    Start timer for a task
// @route   POST /api/timelogs/start
router.post("/start", protect, async (req, res) => {
  try {
    const { taskId } = req.body;

    const activeTimer = await TimeLog.findOne({ user: req.user.id, endTime: { $exists: false } });
    if (activeTimer) {
      return res.status(400).json({ message: "You already have a timer running!" });
    }

    const log = await TimeLog.create({
      task: taskId,
      user: req.user.id,
      startTime: new Date()
    });

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Pause timer (This marks the end of a segment with a reason)
// @route   PUT /api/timelogs/pause
router.put("/pause", protect, async (req, res) => {
  try {
    const { taskId, reason } = req.body;

    // Find the active log for this user and task
    const log = await TimeLog.findOne({ 
      user: req.user.id, 
      task: taskId,
      endTime: { $exists: false } 
    });

    if (!log) {
      return res.status(404).json({ message: "No active timer found to pause." });
    }

    log.endTime = new Date();
    log.pauseReason = reason; // Ensure "pauseReason" is in your Mongoose Model
    log.duration = Math.floor((log.endTime - log.startTime) / 1000);
    
    await log.save();
    res.json({ message: "Timer paused", log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Resume timer (Starts a new segment for the same task)
// @route   PUT /api/timelogs/resume
router.put("/resume", protect, async (req, res) => {
  try {
    const { taskId } = req.body;

    // Logic for resume is identical to start: create a new log entry
    const log = await TimeLog.create({
      task: taskId,
      user: req.user.id,
      startTime: new Date()
    });

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Stop active timer (Final stop)
// @route   PUT /api/timelogs/stop
router.put("/stop", protect, async (req, res) => {
  try {
    const log = await TimeLog.findOne({ user: req.user.id, endTime: { $exists: false } });

    if (!log) return res.status(404).json({ message: "No active timer found." });

    log.endTime = new Date();
    log.duration = Math.floor((log.endTime - log.startTime) / 1000);
    
    await log.save();
    res.json({ message: "Timer stopped", log });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;