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
