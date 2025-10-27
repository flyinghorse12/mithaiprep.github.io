// src/components/StudyPlanner.jsx
import React, { useEffect, useRef, useCallback } from "react";
import "dhtmlx-scheduler";
import "dhtmlx-scheduler/codebase/dhtmlxscheduler.css";
import scheduler from "dhtmlx-scheduler";
import supabase from "../supabase";
import { useAuth } from "../context/GoogleAuthProvider";
import "../assets/scss/_scheduler.scss";

/*
  StudyPlanner (dhtmlx-scheduler)
  - Loads study_sessions from Supabase
  - Persists create/update/delete events to Supabase
  - Works with week/month/day/year/agenda views
  - Integrates with study_goals (timer) via PlannerTable / ActiveTimerBar
*/

export default function StudyPlanner({ setEventsForTicker }) {
  const containerRef = useRef(null);
  const { user } = useAuth();
  const userId = user?.id;

  // Map DB rows -> scheduler events
  const mapRowsToEvents = useCallback((rows) => {
    return (rows || []).map((r) => ({
      id: r.id,
      text: r.title,
      start_date: new Date(r.start).toISOString(),
      end_date: new Date(r.end).toISOString(),
      // custom properties
      duration_minutes: r.duration_minutes,
      type: r.type,
      color: r.color || "#ffb86c",
    }));
  }, []);

  // load events from supabase and render in scheduler
  const loadEvents = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("start", { ascending: true });
    if (error) {
      console.error("loadEvents", error);
      return;
    }
    const ev = mapRowsToEvents(data);
    scheduler.clearAll();
    scheduler.parse(ev, "json");
    // optional: send upcoming to ticker
    if (typeof setEventsForTicker === "function") {
      const upcoming = (data || []).filter((s) => new Date(s.start) >= new Date()).slice(0, 5);
      setEventsForTicker(upcoming);
    }
  }, [userId, mapRowsToEvents, setEventsForTicker]);

  useEffect(() => {
    // initialize scheduler once
    scheduler.skin = "terrace";
    scheduler.config.xml_date = "%Y-%m-%dT%H:%i:%s.%qZ";
    scheduler.config.hour_size_px = 38;
    scheduler.config.show_loading = true;
    scheduler.config.details_on_dblclick = true;
    scheduler.config.readonly = false;
    scheduler.config.prevent_cache = true;

    // add a custom property column to display in quick info (optional)
    scheduler.templates.event_class = function (start, end, ev) {
      return ev.color ? "ev-color" : "";
    };

    // toolbar and default view
    scheduler.init(containerRef.current, new Date(), "week");

    // attach data processor-like behavior:
    // on event added, updated, deleted -> sync to supabase
    scheduler.attachEvent("onEventAdded", async function (id, ev) {
      // create in supabase: ev has text, start_date, end_date
      try {
        const payload = {
          user_id: userId,
          title: ev.text,
          start: new Date(ev.start_date).toISOString(),
          end: new Date(ev.end_date).toISOString(),
          duration_minutes: ev.duration_minutes || Math.round((new Date(ev.end_date) - new Date(ev.start_date)) / 60000),
          type: ev.type || "Study",
          color: ev.color || null,
        };
        const { data, error } = await supabase.from("study_sessions").insert([payload]).select().single();
        if (error) throw error;
        // set scheduler id to DB id (replace local id)
        scheduler.changeEventId(id, data.id);
      } catch (err) {
        console.error("onEventAdded err", err);
        alert("Could not create session.");
        scheduler.deleteEvent(id);
      }
    });

    scheduler.attachEvent("onEventChanged", async function (id, ev) {
      try {
        const updates = {
          title: ev.text,
          start: new Date(ev.start_date).toISOString(),
          end: new Date(ev.end_date).toISOString(),
          duration_minutes: ev.duration_minutes || Math.round((new Date(ev.end_date) - new Date(ev.start_date)) / 60000),
          type: ev.type || "Study",
          color: ev.color || null,
        };
        const { error } = await supabase.from("study_sessions").update(updates).eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.error("onEventChanged err", err);
        alert("Could not update session.");
        // reload events to maintain consistency
        await loadEvents();
      }
    });

    scheduler.attachEvent("onEventDeleted", async function (id) {
      try {
        const { error } = await supabase.from("study_sessions").delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.error("onEventDeleted err", err);
        alert("Could not delete session.");
        await loadEvents();
      }
    });

    // double-click to edit text quickly
    scheduler.attachEvent("onDblClick", function (id, e) {
      // default lightbox appears; we keep default or add custom prompt:
      return true;
    });

    // slot selection quick add
    scheduler.attachEvent("onEmptyClick", function (date, e) {
      // optional quick add via prompt
      const title = prompt("Quick add session title:");
      if (!title) return;
      const start = date;
      const end = new Date(date.getTime() + 60 * 60 * 1000);
      const ev = {
        id: scheduler.uid(), // temporary
        text: title,
        start_date: start,
        end_date: end,
      };
      scheduler.addEvent(ev);
    });

    // initial load
    loadEvents();

    // cleanup on unmount
    return () => {
      try {
        scheduler.clearAll();
      } catch (e) {}
    };
  }, [loadEvents, userId]);

  // external refresh button usage example
  // useEffect(() => { loadEvents(); }, [loadEvents]);

  return (
    <div className="study-planner-wrapper">
      <div ref={containerRef} style={{ width: "100%", height: "720px" }}></div>
    </div>
  );
}

