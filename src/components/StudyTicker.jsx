import React from "react";
import "../assets/scss/_studyTicker.scss";

const StudyTicker = ({ events }) => {
  if (!events || events.length === 0) return null;

  const text = events
    .map(
      (e) =>
        `${e.summary} (${new Date(e.start.dateTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })})`
    )
    .join("   |   ");

  return (
    <div className="study-ticker">
      <div className="ticker-content">🔔 Upcoming: {text}</div>
    </div>
  );
};

export default StudyTicker;

