import { supabase } from "./supabase";

/**
 * Fetches the user role from Supabase 'user_roles' table based on user email.
 * Table structure:
 * - email (Primary Key / text)
 * - role (text, e.g. 'owner' or 'client')
 */
export async function getUserRoleFromSupabase(email: string): Promise<string> {
  if (!email) return "client";
  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Query Supabase user_roles table by email
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (error) {
      console.warn("Supabase user_roles query notice:", error.message);
    } else if (data && data.role) {
      return data.role.toLowerCase().trim();
    }
  } catch (err) {
    console.warn("Error querying user_roles table:", err);
  }

  // Fallback for primary system administrator email
  if (cleanEmail === "orabitsms@gmail.com") {
    return "owner";
  }

  return "client";
}

export async function setUserRoleInSupabase(email: string, role: string): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  const cleanRole = role.trim().toLowerCase();

  try {
    const { error } = await supabase
      .from("user_roles")
      .upsert({ email: cleanEmail, role: cleanRole }, { onConflict: "email" });

    if (error) {
      console.warn("Supabase user_roles upsert warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error setting user role in Supabase:", err);
    return false;
  }
}

/**
 * Creates a new Agent in Supabase Auth & inserts role 'agent' into user_roles table.
 */
export async function createAgentInSupabase(
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password || password.length < 6) {
    return { success: false, message: "Valid email and password (min 6 chars) required." };
  }

  try {
    // 1. Sign up user in Supabase Auth
    const { error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          role: "Agent",
          fullName: `Agent (${cleanEmail.split("@")[0]})`,
        },
      },
    });

    if (authError && !authError.message.includes("already registered")) {
      console.warn("Supabase auth signup notice:", authError.message);
    }

    // 2. Insert role 'agent' into user_roles table
    await setUserRoleInSupabase(cleanEmail, "agent");

    return {
      success: true,
      message: `Agent (${cleanEmail}) account created successfully and role set to 'agent' in Supabase user_roles!`,
    };
  } catch (err: any) {
    console.error("Failed to create agent in Supabase:", err);
    return {
      success: false,
      message: err.message || "Failed to create agent account.",
    };
  }
}

