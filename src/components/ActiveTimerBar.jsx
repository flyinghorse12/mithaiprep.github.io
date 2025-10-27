// src/components/ActiveTimerBar.jsx
import React, { useEffect, useState } from "react";
import supabase from "../supabase";
import { useAuth } from "../context/GoogleAuthProvider";
import "../assets/scss/_studyPlanner.scss";
import beepUrl from "../assets/sounds/beep.mp3"; // optional, add file

export default function ActiveTimerBar({ onGoalUpdated }) {
  const { user } = useAuth();
  const [goal, setGoal] = useState(null);
  const [secsLeft, setSecsLeft] = useState(0);
  const [tick, setTick] = useState(0);

  const load = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("study_goals")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["running", "paused"])
      .order("created_at", { ascending: true })
      .limit(1);
    if (error) { console.error("load goal", error); return; }
    const g = data?.[0] || null;
    setGoal(g);
    computeLeft(g);
  };

  const computeLeft = (g) => {
    if (!g) { setSecsLeft(0); return; }
    const total = (g.duration_minutes || 60) * 60;
    const accumulated = g.accumulated_seconds || 0;
    if (g.status === "paused") {
      setSecsLeft(Math.max(total - accumulated, 0));
      return;
    }
    const startedAt = g.started_at ? new Date(g.started_at).getTime() : Date.now();
    const elapsed = accumulated + Math.floor((Date.now() - startedAt) / 1000);
    setSecsLeft(Math.max(total - elapsed, 0));
  };

  useEffect(() => {
    load();
    const poll = setInterval(load, 4000);
    return () => clearInterval(poll);
  }, [user?.id]);

  // ticking UI per second
  useEffect(() => {
    if (!goal) return;
    if (goal.status === "running") {
      const t = setInterval(() => setTick((x) => x + 1), 1000);
      return () => clearInterval(t);
    }
    computeLeft(goal);
  }, [goal]);

  useEffect(() => {
    computeLeft(goal);
  }, [tick]); // recompute every second

  const format = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const pause = async () => {
    if (!goal) return;
    const elapsedSinceStart = goal.started_at ? Math.floor((Date.now() - new Date(goal.started_at).getTime()) / 1000) : 0;
    const newAccum = (goal.accumulated_seconds || 0) + elapsedSinceStart;
    const { error } = await supabase
      .from("study_goals")
      .update({ accumulated_seconds: newAccum, paused_at: new Date().toISOString(), status: "paused" })
      .eq("id", goal.id);
    if (error) { console.error("pause err", error); return; }
    await load();
    onGoalUpdated && onGoalUpdated();
  };

  const resume = async () => {
    if (!goal) return;
    const { error } = await supabase
      .from("study_goals")
      .update({ started_at: new Date().toISOString(), paused_at: null, status: "running" })
      .eq("id", goal.id);
    if (error) { console.error("resume err", error); return; }
    await load();
    onGoalUpdated && onGoalUpdated();
  };

  const stop = async (outcome = "Not Completed") => {
    if (!goal) return;
    let accum = goal.accumulated_seconds || 0;
    if (goal.status === "running" && goal.started_at) {
      const elapsedSinceStart = Math.floor((Date.now() - new Date(goal.started_at).getTime()) / 1000);
      accum += elapsedSinceStart;
    }
    const { error } = await supabase
      .from("study_goals")
      .update({ accumulated_seconds: accum, completed_at: new Date().toISOString(), outcome, status: "finished" })
      .eq("id", goal.id);
    if (error) { console.error("stop err", error); return; }
    await load();
    onGoalUpdated && onGoalUpdated();
  };

  if (!goal) return null;

  return (
    <div className="active-timer-bar elegant">
      <div className="left">
        <div className="goal-title">{goal.title}</div>
        <div className="goal-sub muted">{goal.goal_type || "Goal"}</div>
      </div>

      <div className="center">
        <div className="timer-display">{format(secsLeft)}</div>
      </div>

      <div className="right">
        {goal.status === "running" ? (
          <button className="btn small" onClick={pause}>⏸ Pause</button>
        ) : (
          <button className="btn small" onClick={resume}>▶ Resume</button>
        )}
        <button className="btn small danger" onClick={() => stop("Not Completed")}>✖ Stop</button>
      </div>
    </div>
  );
}

