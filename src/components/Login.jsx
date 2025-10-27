import React, { useState, useEffect } from "react";
import "../assets/scss/style.scss";
import { useNavigate } from "react-router-dom"; // 👈 Import useNavigate
import { useAuth } from "../context/GoogleAuthProvider";

export default function Login() {
  const { login, logout, loading, user, initialLoading, justSignedIn } = useAuth();
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate(); // 👈 Initialize useNavigate
  const handleLogin = async () => {
    setError(null);
    try {
      await login();
    } catch (e) {
      console.error("Login error:", e);
      setError("Login failed. Please try again.");
    }
  };

useEffect(() => {
    if (user) { // 👈 Check if user exists
      // If user exists AND it was a fresh sign-in (after redirect)
      if (justSignedIn) { 
          setShowWelcome(true);
          const timer = setTimeout(() => setShowWelcome(false), 4000);
          // Redirect to dashboard immediately or after a short delay
          navigate("/dashboard"); // 👈 REDIRECTION
          return () => clearTimeout(timer);
      } else {
          // User already logged in (session restored), redirect them directly
          navigate("/dashboard");
      }
    }
  }, [user, justSignedIn, navigate]);

  if (initialLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        color: 'white',
        background: 'linear-gradient(120deg, rgba(113, 6, 191, 0.8), rgba(58, 0, 136, 0.8))'
      }}>
        Checking existing session...
      </div>
    );
  }

  return (
    <>
      {showWelcome && user && (
        <div className="welcome-popup">
          👋 Welcome, {user.user_metadata?.full_name || user.email || "User"} is linked!
        </div>
      )}

      <section className="ftco-section img js-fullheight" style={{ padding: 0, margin: 0 }}>
        {user ? (
          <div className="login-box">
            <h3 className="mb-3">Welcome Back!</h3>
            <p className="text-light">
              You are logged in as:<br />
              <strong>{user.user_metadata?.full_name || user.email}</strong>
            </p>
            <button
              className="btn btn-primary btn-block google-btn"
              style={{ 
                backgroundColor: "#dc3545", 
                borderColor: "#dc3545", 
                color: "white",
                marginTop: "20px"
              }}
              onClick={logout}
            >
              SIGN OUT
            </button>
          </div>
        ) : (
          <div className="login-box">
            <h3 className="mb-4">Welcome to Your UPSC Portal</h3>
            <p>Login for Mithai Making App</p>
            <button 
              className="btn btn-primary btn-block google-btn" 
              onClick={handleLogin} 
              disabled={loading}
            >
              {loading ? "Signing in..." : "SIGN IN WITH GOOGLE"}
            </button>
            {error && <p className="error-text">{error}</p>}
            <p className="small-text">Your preparation starts here 🚀</p>
          </div>
        )}
      </section>
    </>
  );
}
