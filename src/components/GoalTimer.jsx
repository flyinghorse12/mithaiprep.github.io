// src/components/GoalTimer.jsx
import React, { useState, useEffect, useRef } from "react";
import "../assets/scss/_goalTimer.scss";
import beepSound from "../assets/sounds/beep.mp3";

// goal must include:
// id (optional), goalRowId (DB id), duration_minutes, started_at, accumulated_seconds, status
export default function GoalTimer({ goal, onFinish, onCancel }) {
  // compute remaining seconds
  const computeRemaining = () => {
    const total = (goal.duration_minutes || 60) * 60;
    const accumulated = goal.accumulated_seconds || 0;
    if (goal.status === "paused") return Math.max(total - accumulated, 0);
    // running:
    const startedAt = goal.started_at ? new Date(goal.started_at).getTime() : Date.now();
    const elapsed = accumulated + Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(total - elapsed, 0);
  };

  const [timeLeft, setTimeLeft] = useState(computeRemaining());
  const [status, setStatus] = useState(goal.status || "running");
  const audioRef = useRef(null);

  useEffect(() => {
    setTimeLeft(computeRemaining());
    // rerun when goal prop changes
  }, [goal]);

  useEffect(() => {
    let t;
    if (status === "running") {
      t = setInterval(() => setTimeLeft(computeRemaining()), 1000);
    } else {
      setTimeLeft(computeRemaining());
    }
    return () => clearInterval(t);
  }, [status, goal]);

  useEffect(() => {
    if (timeLeft === 0 && status === "running") {
      setStatus("finished");
      if (audioRef.current) audioRef.current.play();
    }
  }, [timeLeft, status]);

  const format = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // onFinish expects outcome string
  const handleOutcome = (outcome) => {
    onFinish(outcome);
  };

  return (
    <div className="goal-timer-overlay">
      <div className="goal-timer-card">
        <h3>🎯 {goal.title}</h3>
        <div className="timer-display">{format(timeLeft)}</div>

        {status === "finished" ? (
          <div className="outcome-buttons">
            <button className="btn success" onClick={() => handleOutcome("Completed")}>✅ Completed</button>
            <button className="btn warn" onClick={() => handleOutcome("Paused")}>⏸️ Paused</button>
            <button className="btn danger" onClick={() => handleOutcome("Not Completed")}>❌ Not Completed</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn cancel" onClick={onCancel}>Cancel</button>
          </div>
        )}
      </div>
      <audio ref={audioRef} src={beepSound} preload="auto" />
    </div>
  );
}

