// src/context/GoogleAuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";


const AuthContext = createContext();

// ✅ Hook to access auth anywhere
export const useAuth = () => useContext(AuthContext);

const GoogleAuthProviderInternal = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [justSignedIn, setJustSignedIn] = useState(false); // track fresh login

  // ✅ Google login
  const login = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google sign-in failed:", err.message);
      setLoading(false);
    }
  };

  // ✅ Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setJustSignedIn(false);
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  // ✅ Session initialization & listener
  useEffect(() => {
    // initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user);
      setInitialLoading(false);
    });

    // auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        setLoading(false);
        setJustSignedIn(true);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setJustSignedIn(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    login,
    logout,
    loading,
    initialLoading,
    justSignedIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ✅ Named export to match your main.jsx
export const GoogleAuthProvider = ({ children }) => (
  <GoogleAuthProviderInternal>{children}</GoogleAuthProviderInternal>
);

