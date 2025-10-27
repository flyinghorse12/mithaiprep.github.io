// src/components/PlannerTable.jsx
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/GoogleAuthProvider.jsx";
import "../assets/scss/_plannerTable.scss";

export default function PlannerTable({ reloadKey = 0 }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [sessions, setSessions] = useState([]);

  const loadSessions = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("study_sessions")
      .select("id, title, start_date, end_date, duration_minutes, type, status, remarks")
      .eq("user_id", userId)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("fetch sessions:", error);
      return;
    }
    setSessions(data || []);
  };

  useEffect(() => {
    loadSessions();
  }, [userId, reloadKey]);

  const exportCsv = () => {
    if (!sessions || sessions.length === 0) {
      alert("No sessions to export.");
      return;
    }
    const data = sessions.map((s) => ({
      Title: s.title,
      Start: new Date(s.start_date).toLocaleString(),
      End: new Date(s.end_date).toLocaleString(),
      Duration: s.duration_minutes,
      Type: s.type || "",
      Status: s.status || "",
      Remarks: s.remarks || "",
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "study_sessions.csv";
    a.click();
  };

  const markStatus = async (id, status) => {
    const { error } = await supabase.from("study_sessions").update({ status }).eq("id", id).eq("user_id", userId);
    if (error) {
      console.error("status update failed", error);
    } else {
      loadSessions();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this session?")) return;
    const { error } = await supabase.from("study_sessions").delete().eq("id", id).eq("user_id", userId);
    if (error) console.error("delete error", error);
    else loadSessions();
  };

  return (
    <div className="study-floating-card planner-table">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Your Timetable</h3>
        <div>
          <button onClick={exportCsv} style={{ marginRight: 8 }}>EXPORT CSV</button>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {sessions.length === 0 ? (
          <div style={{ color: "#666" }}>No sessions scheduled.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#444" }}>
                <th>Start</th>
                <th>Topic</th>
                <th>Duration</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: "8px 6px" }}>{new Date(s.start_date).toLocaleString()}</td>
                  <td style={{ padding: "8px 6px" }}>{s.title}</td>
                  <td style={{ padding: "8px 6px" }}>{s.duration_minutes} mins</td>
                  <td style={{ padding: "8px 6px" }}>{s.type}</td>
                  <td style={{ padding: "8px 6px" }}>
                    <button onClick={() => markStatus(s.id, "Completed")} title="Mark Completed">START</button>
                    <button onClick={() => handleDelete(s.id)} style={{ marginLeft: 8 }} title="Delete">DELETE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

