import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import GoogleStudyPlanner from "../components/StudyPlanner";
import StudyTicker from "../components/StudyTicker";
import "../assets/scss/Dashboard.scss";
import { useAuth } from "../context/GoogleAuthProvider";

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState("default");
  const [tickerEvents, setTickerEvents] = useState([]);
  const { user } = useAuth();

  const renderModule = () => {
    switch (activeModule) {
      case "planner":
        return <GoogleStudyPlanner setEventsForTicker={setTickerEvents} />;
      // ... other cases remain
      default:
        return (
          <section className="content-section">
            <h2>Welcome to the UPSC Smart Dashboard</h2>
            <p>Select a section from the sidebar.</p>
          </section>
        );
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        userName={user?.user_metadata?.full_name || user?.email || "Aspirant"}
        setActiveModule={setActiveModule}
      />
      <main className="main-content">
        <StudyTicker events={tickerEvents} />
        {renderModule()}
      </main>
    </div>
  );
};

export default Dashboard;

