import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export function GoogleAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function restoreSession() {
      try {
        // Try to get existing session from localStorage
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!ignore) {
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.warn("Session restore error:", err);
      } finally {
        if (!ignore) setInitialLoading(false);
      }
    }

    restoreSession();

    // Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!ignore) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  async function login() {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/dashboard",
          scopes: "openid email profile https://www.googleapis.com/auth/drive.file",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, initialLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

