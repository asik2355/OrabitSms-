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
