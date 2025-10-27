import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/GoogleAuthProvider";

const PrivateRoute = ({ children }) => {
  const { user, initialLoading } = useAuth();

  if (initialLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          color: "white",
          background:
            "linear-gradient(120deg, rgba(113, 6, 191, 0.8), rgba(58, 0, 136, 0.8))",
        }}
      >
        Checking existing session...
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return children;
};

export default PrivateRoute;

