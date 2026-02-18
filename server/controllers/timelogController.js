const TimeLog = require("../models/TimeLog");

// Start the timer
exports.startTimer = async (req, res) => {
  try {
    const { taskId } = req.body;
    // Optional: Stop any existing running timer for this user first
    await TimeLog.updateMany(
      { user: req.user.id, endTime: { $exists: false } },
      { endTime: new Date(), duration: 0 } // Or calculate duration if you prefer
    );

    const newLog = new TimeLog({
      task: taskId,
      user: req.user.id,
      startTime: new Date(),
    });

    await newLog.save();
    res.status(201).json(newLog);
  } catch (err) {
    res.status(500).json({ message: "Error starting timer" });
  }
};

// Stop the timer and calculate duration
exports.stopTimer = async (req, res) => {
  try {
    const activeLog = await TimeLog.findOne({
      user: req.user.id,
      endTime: { $exists: false },
    }).sort({ startTime: -1 });

    if (!activeLog) return res.status(404).json({ message: "No active timer" });

    const endTime = new Date();
    const durationInSeconds = Math.floor((endTime - activeLog.startTime) / 1000);

    activeLog.endTime = endTime;
    activeLog.duration = durationInSeconds;
    await activeLog.save();

    res.json({ message: "Timer stopped", duration: durationInSeconds });
  } catch (err) {
    res.status(500).json({ message: "Error stopping timer" });
  }
};