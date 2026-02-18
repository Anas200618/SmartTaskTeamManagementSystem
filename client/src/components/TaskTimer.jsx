import React, { useState, useEffect } from "react";
import API from "../services/api";

const TaskTimer = ({ taskId, onTimerUpdate, taskStatus }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseInput, setShowPauseInput] = useState(false);
  const [pauseReason, setPauseReason] = useState("");
  const [seconds, setSeconds] = useState(0);

  // =========================
  // Sync with Global Timer on Mount
  // =========================
  useEffect(() => {
    const activeTaskId = localStorage.getItem("active_taskId");
    const timerStatus = localStorage.getItem("active_timer_status");
    const storedSeconds = localStorage.getItem("active_timer_seconds");
    const startTime = localStorage.getItem("active_timer_start");

    if (activeTaskId === taskId) {
      if (timerStatus === "paused") {
        setIsRunning(false);
        setIsPaused(true);
        setSeconds(storedSeconds ? parseInt(storedSeconds) : 0);
      } else if (timerStatus === "running" && startTime) {
        const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
        setIsRunning(true);
        setIsPaused(false);
        setSeconds(elapsed);
      }
    }
  }, [taskId]);

  // =========================
  // Running Interval Logic
  // =========================
  useEffect(() => {
    let interval = null;

    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        const startTime = localStorage.getItem("active_timer_start");
        if (startTime) {
          const currentSeconds = Math.floor((Date.now() - parseInt(startTime)) / 1000);
          setSeconds(currentSeconds);
          localStorage.setItem("active_timer_seconds", currentSeconds.toString());
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  // =========================
  // START
  // =========================
  const handleStart = async (e) => {
    if (e) e.preventDefault();
    const currentActive = localStorage.getItem("active_taskId");

    if (currentActive && currentActive !== taskId) {
      alert("You already have a timer running for another task.");
      return;
    }

    try {
      await API.post("/timelogs/start", { taskId });
      const now = Date.now().toString();

      localStorage.setItem("active_taskId", taskId);
      localStorage.setItem("active_timer_start", now);
      localStorage.setItem("active_timer_status", "running");
      localStorage.setItem("active_timer_seconds", "0");

      setSeconds(0);
      setIsRunning(true);
      setIsPaused(false);
    } catch (err) {
      alert(err.response?.data?.message || "Could not start timer");
    }
  };

  // =========================
  // PAUSE CLICK (Stop UI immediately)
  // =========================
  const handlePauseClick = (e) => {
    if (e) e.preventDefault();
    setIsRunning(false); 
    setShowPauseInput(true);
  };

  // =========================
  // CONFIRM PAUSE (Save to DB/Local)
  // =========================
  const confirmPause = async (e) => {
    if (e) e.preventDefault();

    if (!pauseReason.trim()) {
      alert("Please enter a reason for pausing.");
      return;
    }

    try {
      await API.put("/timelogs/pause", { taskId, reason: pauseReason });
      
      localStorage.setItem("active_timer_status", "paused");
      localStorage.setItem("active_timer_seconds", seconds.toString());
      localStorage.removeItem("active_timer_start"); 

      setIsPaused(true);
      setShowPauseInput(false);
      setPauseReason("");
    } catch (err) {
      console.error("Pause API error", err);
      setIsRunning(true); 
    }
  };

  // =========================
  // RESUME (Calculate new start point)
  // =========================
  const handleResume = async (e) => {
    if (e) e.preventDefault();

    try {
      await API.put("/timelogs/resume", { taskId });
      
      const newStartTime = Date.now() - (seconds * 1000);

      localStorage.setItem("active_timer_start", newStartTime.toString());
      localStorage.setItem("active_timer_status", "running");
      localStorage.setItem("active_taskId", taskId);

      setIsPaused(false);
      setIsRunning(true);
    } catch (err) {
      alert("Could not resume timer");
    }
  };

  // =========================
  // STOP
  // =========================
  const handleStop = async (e) => {
    if (e) e.preventDefault();
    try {
      await API.put("/timelogs/stop");

      localStorage.removeItem("active_taskId");
      localStorage.removeItem("active_timer_start");
      localStorage.removeItem("active_timer_status");
      localStorage.removeItem("active_timer_seconds");

      setIsRunning(false);
      setIsPaused(false);
      setSeconds(0);
      setShowPauseInput(false);
      
      if (onTimerUpdate) onTimerUpdate();
    } catch (err) {
      console.error("Stop API error", err);
      alert("Could not stop timer");
    }
  };

  const formatDisplay = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // =========================
  // CONDITION: HIDE IF COMPLETED
  // =========================
  if (taskStatus === "Completed" || taskStatus === "done") {
    return (
      <div className="badge bg-light text-success border border-success-subtle py-2 px-3">
        <i className="bi bi-check-circle-fill me-1"></i> Task Completed
      </div>
    );
  }

  return (
    <div className="position-relative">
      <div className="d-flex align-items-center gap-2 p-1 bg-white border rounded shadow-sm" style={{ width: "fit-content" }}>
        <span className={`fw-bold small px-2 ${isRunning ? "text-success animate-pulse" : isPaused ? "text-warning" : ""}`}>
          {formatDisplay(seconds)}
        </span>

        {!isRunning && !isPaused && (
          <button type="button" className="btn btn-sm btn-outline-success border-0 p-1" onClick={handleStart} title="Start">
            <i className="bi bi-play-circle-fill fs-5"></i>
          </button>
        )}

        {isRunning && (
          <button type="button" className="btn btn-sm btn-outline-warning border-0 p-1" onClick={handlePauseClick} title="Pause">
            <i className="bi bi-pause-circle-fill fs-5"></i>
          </button>
        )}

        {isPaused && !showPauseInput && (
          <button type="button" className="btn btn-sm btn-outline-primary border-0 p-1" onClick={handleResume} title="Resume">
            <i className="bi bi-play-fill fs-5"></i>
          </button>
        )}

        {(isRunning || isPaused) && (
          <button type="button" className="btn btn-sm btn-outline-danger border-0 p-1" onClick={handleStop} title="Stop">
            <i className="bi bi-stop-circle-fill fs-5"></i>
          </button>
        )}
      </div>

      {showPauseInput && (
        <div className="position-absolute top-100 start-0 mt-2 p-3 bg-white border rounded shadow" style={{ zIndex: 100, width: "250px" }}>
          <label className="form-label small fw-bold text-muted">Reason for break:</label>
          <textarea
            className="form-control form-control-sm mb-2"
            rows="2"
            placeholder="e.g. Lunch, Meeting..."
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            autoFocus
          />
          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light btn-sm" onClick={() => { setShowPauseInput(false); setIsRunning(true); }}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={confirmPause}>
              Confirm Pause
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTimer;