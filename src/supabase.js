// src/supabase.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Save file metadata into the user_files table.
 */
export async function saveFileMetadata({ user_id, module, sub_module = null, google_file_id, file_name, mime_type }) {
  if (!user_id) throw new Error("saveFileMetadata: missing user_id");
  const { data, error } = await supabase
    .from("user_files")
    .insert([{
      user_id,
      module,
      sub_module,
      google_file_id,
      file_name,
      mime_type,
    }])
    .select()
    .limit(1);
  if (error) {
    console.error("saveFileMetadata error", error);
    throw error;
  }
  return data?.[0] ?? null;
}

/**
 * Get provider token (Google) or fallback access token from current session.
 * Works with modern supabase-js (auth.getSession) and older (auth.session/user).
 */
export async function getProviderToken() {
  try {
    if (supabase.auth?.getSession) {
      const { data } = await supabase.auth.getSession();
      const session = data?.session ?? null;
      return session?.provider_token ?? session?.access_token ?? null;
    }
  } catch (e) {
    console.warn("getProviderToken: getSession failed", e);
  }

  // fallback older API
  try {
    if (supabase.auth?.session) {
      const session = supabase.auth.session();
      return session?.provider_token ?? session?.access_token ?? null;
    }
  } catch (e) {
    console.warn("getProviderToken: session failed", e);
  }

  return null;
}

export default supabase;

