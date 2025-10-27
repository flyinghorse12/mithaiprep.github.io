// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import UPSCProfile from "./components/UPSCProfile";
// Placeholder components — replace these imports with your actual components if filenames differ
import Login from "./components/Login";
import Planner from "./components/StudyPlanner";
import PrivateRoute from "./components/PrivateRoute"; // keep if you have it

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Protect dashboard & nested routes */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <div style={{ display: "flex", minHeight: "100vh" }}>
                <Sidebar />
                <main style={{ flex: 1, padding: 20, background: "#f5f7fb" }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="planner" element={<Planner />} />
                    <Route path="upsc-profile" element={<UPSCProfile />} />
                    <Route path="others" element={<div>Other updates</div>} />
                    {/* keep other dashboard nested routes here as needed */}
                  </Routes>
                </main>
              </div>
            </PrivateRoute>
          }
        />
        
        {/* standalone routes (region, religion etc.) - point these to your actual components */}
        <Route path="/region/:regionId/:page" element={<div>Region page</div>} />
        <Route path="/religion/:type/:page" element={<div>Religion page</div>} />
        <Route path="/people/:era/:page" element={<div>People page</div>} />
        <Route path="*" element={<div>404 - Page not found</div>} />
      </Routes>
    </Router>
  );
}
