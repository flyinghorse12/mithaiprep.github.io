// src/components/PlannerCalendar.jsx
import React from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../node_modules/react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/sass/styles.scss"; // optional
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "../assets/scss/_studyPlanner.scss";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay, locales });

const DnDCalendar = withDragAndDrop(Calendar);

function CustomToolbar(toolbar) {
  const goToBack = () => toolbar.onNavigate("PREV");
  const goToNext = () => toolbar.onNavigate("NEXT");
  const goToToday = () => toolbar.onNavigate("TODAY");
  const changeView = (view) => toolbar.onView(view);

  return (
    <div className="rbc-toolbar custom-toolbar">
      <div className="rbc-btn-group">
        <button onClick={goToBack}>Back</button>
        <button onClick={goToToday}>Today</button>
        <button onClick={goToNext}>Next</button>
      </div>
      <div className="rbc-toolbar-label">{toolbar.label}</div>
      <div className="rbc-btn-group">
        <button className={toolbar.view === Views.MONTH ? "active" : ""} onClick={() => changeView(Views.MONTH)}>Month</button>
        <button className={toolbar.view === Views.WEEK ? "active" : ""} onClick={() => changeView(Views.WEEK)}>Week</button>
        <button className={toolbar.view === Views.DAY ? "active" : ""} onClick={() => changeView(Views.DAY)}>Day</button>
        <button className={toolbar.view === Views.AGENDA ? "active" : ""} onClick={() => changeView(Views.AGENDA)}>Agenda</button>
      </div>
    </div>
  );
}

export default function PlannerCalendar({ events, onSelectEvent, onSelectSlot, onEventDrop, onEventResize }) {
  const eventStyleGetter = (event) => {
    const backgroundColor = event.color || "#ffb86c";
    const style = {
      backgroundColor,
      color: "#000",
      borderRadius: "6px",
      padding: "2px 6px",
      border: "none",
      fontSize: "0.9rem",
    };
    return { style };
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="planner-calendar">
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 520 }}
          views={["month", "week", "day", "agenda"]}
          components={{ toolbar: CustomToolbar }}
          eventPropGetter={eventStyleGetter}
          selectable
          onSelectEvent={onSelectEvent}
          onSelectSlot={onSelectSlot}
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
        />
      </div>
    </DndProvider>
  );
}

