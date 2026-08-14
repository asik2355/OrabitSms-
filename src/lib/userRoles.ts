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
    const { data: updateData, error: updateErr } = await supabase
      .from("user_roles")
      .update({ role: cleanRole })
      .ilike("email", cleanEmail)
      .select();

    if (updateErr || !updateData || updateData.length === 0) {
      const { error: insertErr } = await supabase
        .from("user_roles")
        .insert({ email: cleanEmail, role: cleanRole });
      if (insertErr) {
        await supabase.from("user_roles").upsert({ email: cleanEmail, role: cleanRole }, { onConflict: "email" });
      }
    }
    return true;
  } catch (err) {
    console.error("Error setting user role in Supabase:", err);
    return false;
  }
}

/**
 * Creates a new Agent in Supabase Auth & inserts role 'agent' into user_roles table and user_profiles.
 */
export async function createAgentInSupabase(
  email: string,
  password: string,
  agentName?: string,
  telegramUsername?: string
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = agentName?.trim() || `Agent (${cleanEmail.split("@")[0]})`;
  const cleanTg = telegramUsername?.trim() || "";

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
          fullName: cleanName,
          telegram: cleanTg,
        },
      },
    });

    if (authError && !authError.message.includes("already registered")) {
      console.warn("Supabase auth signup notice:", authError.message);
    }

    // 2. Insert role 'agent' into user_roles table
    await setUserRoleInSupabase(cleanEmail, "agent");

    // 3. Upsert user_profiles table with agent_name and telegram_username
    try {
      await supabase.from("user_profiles").upsert(
        {
          email: cleanEmail,
          full_name: cleanName,
          telegram: cleanTg,
          role: "Agent",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
    } catch (e) {
      console.warn("Error saving agent in user_profiles:", e);
    }

    return {
      success: true,
      message: `Agent (${cleanName} - ${cleanEmail}) account created successfully in Supabase!`,
    };
  } catch (err: any) {
    console.error("Failed to create agent in Supabase:", err);
    return {
      success: false,
      message: err.message || "Failed to create agent account.",
    };
  }
}

/**
 * Deletes or removes an Agent's role from Supabase 'user_roles' table.
 */
export async function deleteAgentFromSupabase(
  email: string
): Promise<{ success: boolean; message: string }> {
  if (!email) return { success: false, message: "Email is required." };
  const cleanEmail = email.trim().toLowerCase();

  try {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .ilike("email", cleanEmail);

    if (error) {
      console.warn("Supabase user_roles delete notice:", error.message);
    }

    return {
      success: true,
      message: `Agent (${cleanEmail}) role and access removed successfully from Supabase!`,
    };
  } catch (err: any) {
    console.error("Failed to delete agent from Supabase:", err);
    return {
      success: false,
      message: err.message || "Failed to remove agent role.",
    };
  }
}

