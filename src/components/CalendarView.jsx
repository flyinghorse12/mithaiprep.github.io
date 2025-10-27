import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CalendarView = ({ onDateSelect }) => {
  const [value, setValue] = useState(new Date());

  const handleSelect = (date) => {
    setValue(date);
    onDateSelect(date);
  };

  return (
    <div className="calendar-wrapper">
      <Calendar
        onChange={handleSelect}
        value={value}
        className="calendar-ui"
      />
    </div>
  );
};

export default CalendarView;

