// src/components/PomodoroCard.jsx
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/GoogleAuthProvider.jsx";
import "../assets/scss/_studyPlanner.scss"; // share styles for floating card

export default function PomodoroCard({ selectedEvent = null, onClose, onSessionSaved }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [goal, setGoal] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // restore timer from localStorage if any
  useEffect(() => {
    const stored = localStorage.getItem("pomodoro_v1");
    if (stored) {
      try {
        const obj = JSON.parse(stored);
        if (obj.endTime) {
          const remaining = Math.max(0, Math.floor((new Date(obj.endTime) - new Date()) / 1000));
          if (remaining > 0) {
            setGoal(obj.goal || "");
            setMinutes(obj.duration || Math.ceil(remaining / 60));
            setTimeLeft(remaining);
            setIsRunning(true);
          } else {
            localStorage.removeItem("pomodoro_v1");
          }
        }
      } catch (err) {
        console.warn("invalid stored timer", err);
      }
    }
  }, []);

  // if a selectedEvent was passed, prefill goal and minutes
  useEffect(() => {
    if (selectedEvent) {
      setGoal(selectedEvent.title || "");
      const defaultMin = Math.max(1, Math.round(((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / 60000) || 25));
      setMinutes(defaultMin);
    }
  }, [selectedEvent]);

  // countdown effect
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          handleComplete();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleStart = () => {
    const secs = minutes * 60;
    setTimeLeft(secs);
    setIsRunning(true);
    const endTime = new Date(Date.now() + secs * 1000).toISOString();
    localStorage.setItem("pomodoro_v1", JSON.stringify({ goal, duration: minutes, endTime }));
  };

  const handlePause = () => {
    setIsRunning(false);
    // persist current endTime in localStorage by recomputing from now + timeLeft
    const endTime = new Date(Date.now() + timeLeft * 1000).toISOString();
    localStorage.setItem("pomodoro_v1", JSON.stringify({ goal, duration: minutes, endTime }));
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(0);
    localStorage.removeItem("pomodoro_v1");
  };

  const format = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // when timer finishes, insert session to Supabase
  const handleComplete = async () => {
    try {
      if (!userId) {
        alert("Sign in to save completed sessions.");
        localStorage.removeItem("pomodoro_v1");
        onSessionSaved?.();
        return;
      }
      const start = new Date().toISOString();
      const end = new Date(Date.now()).toISOString();
      const payload = {
        user_id: userId,
        title: goal || "Pomodoro Session",
        start_date: new Date(Date.now() - minutes * 60 * 1000).toISOString(),
        end_date: new Date().toISOString(),
        duration_minutes: minutes,
        type: "Pomodoro",
        status: "Completed",
        remarks: null,
      };
      const { data, error } = await supabase.from("study_sessions").insert([payload]).select().single();
      if (error) throw error;
      localStorage.removeItem("pomodoro_v1");
      alert("Session completed and saved!");
      onSessionSaved?.();
    } catch (err) {
      console.error("Could not save session:", err);
      alert("Could not save session to server.");
    }
  };

  return (
    <div className="study-floating-card pomodoro-card" aria-live="polite">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>🎯 Study Goal Timer</h3>
        <button className="close-btn" onClick={() => { setGoal(""); setIsRunning(false); onClose?.(); }}>✕</button>
      </div>

      {!isRunning && timeLeft === 0 && (
        <>
          <input
            type="text"
            placeholder="Enter goal / topic"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #e6e6e6" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              type="number"
              min="1"
              max="360"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              style={{ flex: "0 0 90px", padding: "8px", borderRadius: 6, border: "1px solid #e6e6e6" }}
            />
            <button onClick={handleStart} style={{ flex: 1, padding: 10, borderRadius: 6, background: "linear-gradient(90deg,#6b73ff,#000dff)", color: "#fff", border: "none" }}>
              Start
            </button>
            <button onClick={handleReset} style={{ background: "#f3f4f6", border: "none", padding: 10, borderRadius: 6 }}>
              Reset
            </button>
          </div>
        </>
      )}

      {isRunning || timeLeft > 0 ? (
        <>
          <div style={{ fontSize: 28, fontWeight: 700, textAlign: "center", marginTop: 6 }}>{format(timeLeft)}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {isRunning ? (
              <button onClick={handlePause} style={{ flex: 1, padding: 10, borderRadius: 6, background: "#f59e0b", color: "#fff", border: "none" }}>
                Pause
              </button>
            ) : (
              <button onClick={() => setIsRunning(true)} style={{ flex: 1, padding: 10, borderRadius: 6, background: "#10b981", color: "#fff", border: "none" }}>
                Resume
              </button>
            )}
            <button onClick={handleReset} style={{ padding: 10, borderRadius: 6, background: "#ef4444", color: "#fff", border: "none" }}>
              Reset
            </button>
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
            Goal: <strong>{goal || "—"}</strong>
          </div>
        </>
      ) : null}
    </div>
  );
}

