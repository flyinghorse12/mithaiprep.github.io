import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/GoogleAuthProvider";

export default function PrivateRoute({ children }) {
  const { user, initialLoading } = useAuth();

  // Wait until session restoration completes
  if (initialLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: "30vh", fontSize: "1.2rem" }}>
        Loading your session...
      </div>
    );
  }

  // If no user after loading, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render protected content
  return children;
}

