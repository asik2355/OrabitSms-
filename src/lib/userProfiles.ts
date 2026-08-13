import { supabase } from "./supabase";
import { UserProfile } from "../components/OrabitAuthScreen";

export const USER_PROFILES_TABLE = "user_profiles";

export const CREATE_USER_PROFILES_TABLE_SQL = `
-- Supabase SQL Editor script to create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    email TEXT PRIMARY KEY,
    full_name TEXT,
    mobile_number TEXT,
    balance NUMERIC DEFAULT 0,
    total_success INTEGER DEFAULT 0,
    role TEXT DEFAULT 'Client',
    telegram TEXT,
    country TEXT,
    city TEXT,
    withdraw_pin TEXT,
    account_status TEXT DEFAULT 'Active',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for user_profiles
CREATE POLICY "Allow all operations for user_profiles" 
ON public.user_profiles FOR ALL 
USING (true) 
WITH CHECK (true);
`;

/**
 * Fetches ALL user/agent profiles directly from Supabase user_profiles table as the Source of Truth.
 */
export async function fetchAllProfilesFromSupabase(): Promise<UserProfile[]> {
  try {
    // 1. Fetch user_profiles and user_roles in parallel
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from(USER_PROFILES_TABLE).select("*"),
      supabase.from("user_roles").select("*"),
    ]);

    const data = profilesRes.data || [];
    const rolesData = rolesRes.data || [];

    // Build role lookup map from user_roles
    const roleMap: Record<string, string> = {};
    if (Array.isArray(rolesData)) {
      rolesData.forEach((r: any) => {
        if (r.email && r.role) {
          roleMap[r.email.toLowerCase().trim()] = r.role.trim();
        }
      });
    }

    const officialEmail = (localStorage.getItem("orabit_official_agent_email") || "orabitsms@gmail.com").toLowerCase().trim();

    // Map profiles
    const mapped: UserProfile[] = (Array.isArray(data) ? data : []).map((row: any) => {
      const emailClean = (row.email || "").toLowerCase().trim();
      const assigned = (row.assigned_agent || row.referral_email || row.referred_by || officialEmail).toLowerCase().trim();
      
      // Determine effective role (prefer user_roles table if present)
      let effectiveRole = row.role || "Client";
      if (roleMap[emailClean]) {
        const r = roleMap[emailClean].toLowerCase();
        if (r === "owner") effectiveRole = "Owner";
        else if (r === "agent") effectiveRole = "Agent";
        else if (r === "client") effectiveRole = "Client";
      }

      return {
        email: emailClean,
        fullName: row.full_name || row.fullName || emailClean.split("@")[0] || "User",
        firstName: row.first_name || row.full_name?.split(" ")[0] || "",
        lastName: row.last_name || row.full_name?.split(" ").slice(1).join(" ") || "",
        mobileNumber: row.mobile_number || row.mobileNumber || "",
        balance: Number(row.balance || 0),
        totalSuccess: Number(row.total_success || 0),
        role: effectiveRole,
        telegram: row.telegram || "",
        country: row.country || "Bangladesh",
        city: row.city || "Dhaka",
        bio: row.bio || "",
        withdrawPin: row.withdraw_pin || "",
        accountStatus: row.account_status || "Active",
        apiKey: row.api_key || "",
        uid: row.uid || "",
        paymentMethods: row.payment_methods || null,
        withdrawHistory: row.withdraw_history || null,
        referralEmail: assigned,
        referredBy: assigned,
        assignedAgent: assigned,
        isOfficial: !!row.is_official || emailClean === "official@orabitsms.xyz",
        password: row.password || "",
        customOtpRate: row.custom_otp_rate !== undefined ? Number(row.custom_otp_rate) : row.rate !== undefined ? Number(row.rate) : 0.0070,
        rate: row.rate !== undefined ? Number(row.rate) : 0.0070,
        apiEnabled: row.api_enabled !== undefined ? !!row.api_enabled : true,
        lastLogin: row.last_login || row.updated_at || row.created_at,
        createdAt: row.created_at || row.createdAt,
      };
    });

    // Also inject any role from user_roles that might be missing from user_profiles table entirely
    if (Array.isArray(rolesData)) {
      rolesData.forEach((r: any) => {
        if (!r.email) return;
        const eClean = r.email.toLowerCase().trim();
        if (!mapped.some((m) => m.email === eClean)) {
          let roleName = "Client";
          const rLower = (r.role || "").toLowerCase();
          if (rLower === "owner") roleName = "Owner";
          else if (rLower === "agent") roleName = "Agent";

          mapped.push({
            email: eClean,
            fullName: eClean.split("@")[0],
            mobileNumber: "",
            balance: 0,
            totalSuccess: 0,
            role: roleName,
            telegram: "",
            country: "Bangladesh",
            city: "Dhaka",
            referralEmail: officialEmail,
            referredBy: officialEmail,
            assignedAgent: officialEmail,
            isOfficial: eClean === "official@orabitsms.xyz",
            accountStatus: "Active",
            customOtpRate: 0.0070,
            rate: 0.0070,
            apiEnabled: true,
          });
        }
      });
    }

    if (mapped.length > 0) {
      try {
        localStorage.setItem("orabit_registered_users", JSON.stringify(mapped));
        const official = mapped.find((u) => (u.isOfficial || u.email === "official@orabitsms.xyz") && u.role?.toLowerCase() === "agent");
        if (official && official.email) {
          localStorage.setItem("orabit_official_agent_email", official.email.toLowerCase().trim());
        }
      } catch (e) {
        console.warn("Error caching registered users in localStorage:", e);
      }
    }
    return mapped;
  } catch (e) {
    console.error("Failed to fetch all profiles from Supabase:", e);
  }

  // Fallback to localStorage if offline or DB error
  try {
    const stored = localStorage.getItem("orabit_registered_users");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}

  return [];
}

/**
 * Fetches user profile directly from Supabase user_profiles table.
 */
export async function fetchUserProfileFromSupabase(email: string): Promise<Partial<UserProfile> | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  try {
    // 1. First try user_profiles table in Supabase
    const { data, error } = await supabase
      .from(USER_PROFILES_TABLE)
      .select("*")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (!error && data) {
      const officialEmail = (localStorage.getItem("orabit_official_agent_email") || "orabitsms@gmail.com").toLowerCase().trim();
      const assigned = (data.assigned_agent || data.referral_email || data.referred_by || officialEmail).toLowerCase().trim();
      return {
        email: data.email,
        fullName: data.full_name || "",
        mobileNumber: data.mobile_number || "",
        balance: Number(data.balance || 0),
        totalSuccess: Number(data.total_success || 0),
        role: data.role || "Client",
        telegram: data.telegram || "",
        country: data.country || "",
        city: data.city || "",
        bio: data.bio || "",
        withdrawPin: data.withdraw_pin || "",
        accountStatus: data.account_status || "Active",
        apiKey: data.api_key || "",
        uid: data.uid || "",
        paymentMethods: data.payment_methods || null,
        withdrawHistory: data.withdraw_history || null,
        referralEmail: assigned,
        referredBy: assigned,
        assignedAgent: assigned,
      };
    }

    // 2. Fallback to Supabase Auth metadata if current user matches
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user && authData.user.email?.toLowerCase().trim() === cleanEmail) {
      const meta = authData.user.user_metadata || {};
      const officialEmail = (localStorage.getItem("orabit_official_agent_email") || "orabitsms@gmail.com").toLowerCase().trim();
      const assigned = (meta.assignedAgent || meta.referralEmail || meta.referredBy || officialEmail).toLowerCase().trim();
      return {
        email: cleanEmail,
        fullName: meta.fullName || "",
        mobileNumber: meta.mobileNumber || "",
        telegram: meta.telegram || "",
        country: meta.country || "",
        city: meta.city || "",
        bio: meta.bio || "",
        withdrawPin: meta.withdrawPin !== undefined ? meta.withdrawPin : "",
        role: meta.role || "Client",
        apiKey: meta.apiKey || "",
        uid: meta.uid || "",
        paymentMethods: meta.paymentMethods || null,
        withdrawHistory: meta.withdrawHistory || null,
        referralEmail: assigned,
        referredBy: assigned,
        assignedAgent: assigned,
      };
    }
  } catch (e) {
    console.error("Exception fetching profile from Supabase:", e);
  }

  return null;
}

/**
 * Saves or updates user profile in Supabase user_profiles table & Auth Metadata.
 */
export async function saveUserProfileToSupabase(profile: UserProfile): Promise<boolean> {
  if (!profile || !profile.email) return false;
  const cleanEmail = profile.email.toLowerCase().trim();

  const officialEmail = (localStorage.getItem("orabit_official_agent_email") || "orabitsms@gmail.com").toLowerCase().trim();
  const assignedAgentVal = (
    profile.assignedAgent ||
    (profile as any).assigned_agent ||
    profile.referralEmail ||
    profile.referredBy ||
    officialEmail
  ).toLowerCase().trim();

  try {
    const payload = {
      email: cleanEmail,
      full_name: profile.fullName || "",
      mobile_number: profile.mobileNumber || "",
      balance: profile.balance || 0,
      total_success: profile.totalSuccess || 0,
      role: profile.role || "Client",
      telegram: profile.telegram || "",
      country: profile.country || "",
      city: profile.city || "",
      bio: profile.bio || "",
      withdraw_pin: profile.withdrawPin || "",
      account_status: profile.accountStatus || "Active",
      api_key: profile.apiKey || "",
      uid: profile.uid || "",
      payment_methods: profile.paymentMethods || null,
      withdraw_history: profile.withdrawHistory || null,
      referral_email: assignedAgentVal,
      assigned_agent: assignedAgentVal,
      referred_by: assignedAgentVal,
      updated_at: new Date().toISOString(),
    };

    // 1. Update Supabase user_profiles table
    const { error } = await supabase.from(USER_PROFILES_TABLE).upsert(payload, { onConflict: "email" });
    if (error) {
      console.warn("Supabase user_profiles upsert notice:", error.message);
    }

    // 1b. Update user_roles table as well so roles match on all devices
    if (profile.role) {
      try {
        await supabase.from("user_roles").upsert(
          { email: cleanEmail, role: profile.role.toLowerCase().trim() },
          { onConflict: "email" }
        );
      } catch (e) {
        console.warn("Notice updating user_roles table:", e);
      }
    }

    // 2. Also update Supabase Auth User Metadata for instant cross-device fallback
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user && authData.user.email?.toLowerCase().trim() === cleanEmail) {
        await supabase.auth.updateUser({
          data: {
            fullName: profile.fullName || "",
            mobileNumber: profile.mobileNumber || "",
            telegram: profile.telegram || "",
            country: profile.country || "",
            city: profile.city || "",
            bio: profile.bio || "",
            withdrawPin: profile.withdrawPin || "",
            role: profile.role || "Client",
            apiKey: profile.apiKey || "",
            uid: profile.uid || "",
            paymentMethods: profile.paymentMethods || null,
            withdrawHistory: profile.withdrawHistory || null,
          },
        });
      }
    } catch (e) {
      console.warn("Notice updating auth metadata:", e);
    }

    return true;
  } catch (e) {
    console.error("Exception saving user profile to Supabase:", e);
    return false;
  }
}

/**
 * Permanent Profile Update on OTP Success:
 * Increments total_success (+1) and balance (+earnedRate) permanently in Supabase user_profiles table.
 */
export async function incrementUserSuccessAndBalanceInSupabase(
  email: string,
  earnedRate: number
): Promise<{ newBalance: number; newTotalSuccess: number } | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  try {
    const current = await fetchUserProfileFromSupabase(cleanEmail);
    const currBalance = current?.balance !== undefined ? current.balance : 0;
    const currSuccess = current?.totalSuccess !== undefined ? current.totalSuccess : 0;

    const newBalance = Number((currBalance + earnedRate).toFixed(2));
    const newTotalSuccess = currSuccess + 1;

    const payload = {
      email: cleanEmail,
      balance: newBalance,
      total_success: newTotalSuccess,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(USER_PROFILES_TABLE).upsert(payload, { onConflict: "email" });
    if (error) {
      console.warn("Supabase increment user_profiles notice:", error.message);
    }

    return { newBalance, newTotalSuccess };
  } catch (e) {
    console.error("Exception incrementing user success and balance:", e);
    return null;
  }
}
