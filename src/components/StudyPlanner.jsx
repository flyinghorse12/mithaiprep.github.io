// src/components/StudyPlanner.jsx
import React, { useEffect, useRef, useState } from "react";
import "dhtmlx-scheduler/codebase/dhtmlxscheduler.css";
import "dhtmlx-scheduler";
import { useAuth } from "../context/GoogleAuthProvider.jsx";
import { supabase } from "../lib/supabaseClient";
import PlannerTable from "./PlannerTable";
import PomodoroCard from "./PomodoroCard";
import "../assets/scss/_studyPlanner.scss";

export default function StudyPlanner({ sidebarCollapsed = false }) {
  const schedRef = useRef(null);
  const containerRef = useRef(null);
  const { user } = useAuth();
  const userId = user?.id;
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !window.scheduler) return;
    const scheduler = window.scheduler;

    scheduler.config.xml_date = "%Y-%m-%d %H:%i";
    scheduler.config.first_hour = 0;
    scheduler.config.last_hour = 24;
    scheduler.config.hour_size_px = 44;
    scheduler.config.scroll_hour = new Date().getHours();
    scheduler.config.details_on_create = true;
    scheduler.config.details_on_dblclick = true;
    scheduler.config.header = ["day", "week", "month", "date", "prev", "today", "next"];

    try {
      scheduler.init(containerRef.current, new Date(), "week");
    } catch {}

    schedRef.current = scheduler;

    scheduler.attachEvent("onClick", (id) => {
      const ev = scheduler.getEvent(id);
      if (ev) {
        setSelectedEvent({
          id: ev.id,
          title: ev.text,
          start_date: ev.start_date,
          end_date: ev.end_date,
        });
      }
      return true;
    });
  }, []);

  const loadEvents = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("id, title, start_date, end_date, duration_minutes, type, status, remarks")
        .eq("user_id", userId)
        .order("start_date", { ascending: true });

      if (error) throw error;

      const scheduler = schedRef.current;
      scheduler.clearAll();
      scheduler.parse(
        data.map((r) => ({
          id: r.id,
          text: r.title,
          start_date: r.start_date,
          end_date: r.end_date,
        })),
        "json"
      );
      setReloadKey((k) => k + 1);
    } catch (err) {
      console.error("loadEvents error:", err.message);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [userId]);

  useEffect(() => {
    const scheduler = schedRef.current;
    if (!scheduler) return;

    const onAdd = async (tempId, ev) => {
      if (!userId) {
        alert("Please sign in before creating events.");
        scheduler.deleteEvent(tempId);
        return;
      }

      const payload = {
        user_id: userId,
        title: ev.text || "Untitled Session",
        start_date: new Date(ev.start_date).toISOString(),
        end_date: new Date(ev.end_date).toISOString(),
        duration_minutes: Math.max(
          1,
          Math.round((new Date(ev.end_date) - new Date(ev.start_date)) / 60000)
        ),
        type: "Study",
        status: "planned",
        remarks: "",
      };

      try {
        const { data, error } = await supabase
          .from("study_sessions")
          .insert([payload])
          .select("id")
          .single();

        if (error) throw error;

        scheduler.changeEventId(tempId, data.id);
        await loadEvents();
      } catch (err) {
        console.error("create event", err.message);
        alert("Could not create event. Check sign-in and DB policies.");
        scheduler.deleteEvent(tempId);
      }
    };

    const onChange = async (id, ev) => {
      try {
        const updates = {
          title: ev.text,
          start_date: new Date(ev.start_date).toISOString(),
          end_date: new Date(ev.end_date).toISOString(),
          duration_minutes: Math.max(
            1,
            Math.round((new Date(ev.end_date) - new Date(ev.start_date)) / 60000)
          ),
        };
        const { error } = await supabase
          .from("study_sessions")
          .update(updates)
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        await loadEvents();
      } catch (err) {
        console.error("update event", err.message);
        alert("Could not update event.");
      }
    };

    const onDelete = async (id) => {
      if (typeof id !== "string" || id.length < 10) {
        scheduler.deleteEvent(id);
        return;
      }

      try {
        const { error } = await supabase
          .from("study_sessions")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        await loadEvents();
      } catch (err) {
        console.error("delete event", err.message);
        alert("Could not delete event.");
      }
    };

    const addId = scheduler.attachEvent("onEventAdded", onAdd);
    const changeId = scheduler.attachEvent("onEventChanged", onChange);
    const delId = scheduler.attachEvent("onEventDeleted", onDelete);

    return () => {
      scheduler.detachEvent(addId);
      scheduler.detachEvent(changeId);
      scheduler.detachEvent(delId);
    };
  }, [userId]);

  return (
    <div className="scheduler-page">
      <div className="scheduler-content">
        <div className={`study-planner-root ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="study-planner-inner">
            <div className="studyplanner-left">
              <div id="scheduler_here" ref={containerRef} className="dhx_cal_container" />
            </div>
            <aside className="studyplanner-right">
              <PlannerTable reloadKey={reloadKey} />
            </aside>
          </div>
          <PomodoroCard
            selectedEvent={selectedEvent}
            onSessionSaved={() => {
              setSelectedEvent(null);
              loadEvents();
            }}
          />
        </div>
      </div>
    </div>
  );
}

