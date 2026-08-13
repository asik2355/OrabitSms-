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
 * Generates a clean deterministic UID for a user if missing or placeholder.
 */
export function getCleanUid(email: string, existingUid?: string): string {
  if (existingUid && existingUid.trim() && existingUid !== "CC89201XA") {
    return existingUid.trim();
  }
  const cleanE = (email || "user").toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < cleanE.length; i++) {
    hash = (hash << 5) - hash + cleanE.charCodeAt(i);
    hash |= 0;
  }
  const code = Math.abs(hash).toString(36).toUpperCase().padStart(5, "0").substring(0, 5);
  const prefix = cleanE.substring(0, 3).toUpperCase();
  return `ORB-${prefix}${code}`;
}

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

    let feedsData: any[] = [];
    try {
      const { data: fData } = await supabase.from("user_feed_numbers").select("user_email, status, raw_message");
      if (Array.isArray(fData)) feedsData = fData;
    } catch (e) {}

    const data = profilesRes.data || [];
    const rolesData = rolesRes.data || [];

    // Build feed earnings map from Supabase user_feed_numbers
    const feedEarningsMap: Record<string, { count: number; earningsBDT: number }> = {};
    if (Array.isArray(feedsData)) {
      feedsData.forEach((f: any) => {
        const emailClean = (f.user_email || "").toLowerCase().trim();
        if (!emailClean) return;
        const statusStr = (f.status || "").toUpperCase();
        const rawMsg = (f.raw_message || "").toLowerCase();
        const isFail = rawMsg.includes("no sms received") || rawMsg.includes("timed out") || rawMsg.includes("failed");
        const isSuccess = (statusStr === "SUCCESS" || statusStr === "MULTI SUCCESS") && !isFail;

        if (isSuccess) {
          if (!feedEarningsMap[emailClean]) {
            feedEarningsMap[emailClean] = { count: 0, earningsBDT: 0 };
          }
          feedEarningsMap[emailClean].count += 1;
          feedEarningsMap[emailClean].earningsBDT += 0.60;
        }
      });
    }

    // Build role lookup map from user_roles
    const roleMap: Record<string, string> = {};
    if (Array.isArray(rolesData)) {
      rolesData.forEach((r: any) => {
        if (r.email && r.role) {
          roleMap[r.email.toLowerCase().trim()] = r.role.trim();
        }
      });
    }

    // Load local cache map to preserve custom agent names and metadata if DB returns empty/defaults
    let cachedUsersMap: Record<string, UserProfile> = {};
    try {
      const stored = localStorage.getItem("orabit_registered_users");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((u: UserProfile) => {
            if (u && u.email) {
              cachedUsersMap[u.email.toLowerCase().trim()] = u;
            }
          });
        }
      }
    } catch (e) {}

    const officialEmail = (localStorage.getItem("orabit_official_agent_email") || "orabitsms@gmail.com").toLowerCase().trim();

    // Map profiles
    const mapped: UserProfile[] = (Array.isArray(data) ? data : []).map((row: any) => {
      const emailClean = (row.email || "").toLowerCase().trim();
      const assigned = (row.assigned_agent || row.referral_email || row.referred_by || officialEmail).toLowerCase().trim();
      const cached = cachedUsersMap[emailClean];
      
      // Determine effective role (prefer user_roles table if present)
      let effectiveRole = row.role || "Client";
      if (roleMap[emailClean]) {
        const r = roleMap[emailClean].toLowerCase();
        if (r === "owner") effectiveRole = "Owner";
        else if (r === "agent") effectiveRole = "Agent";
        else if (r === "client") effectiveRole = "Client";
      }

      const userRate = row.custom_otp_rate !== undefined && row.custom_otp_rate !== null ? Number(row.custom_otp_rate) : (row.rate !== undefined && row.rate !== null ? Number(row.rate) : 0.006);

      const dbBal = Number(row.balance || 0);
      const feedCalc = feedEarningsMap[emailClean]?.earningsBDT || 0;

      // Also check local feed numbers for this specific user
      let localFeedCalc = 0;
      try {
        const userKey = `orabit_feed_numbers_${emailClean}`;
        const localFeedStr = localStorage.getItem(userKey);
        if (localFeedStr) {
          const parsed = JSON.parse(localFeedStr);
          if (Array.isArray(parsed)) {
            parsed.forEach((f: any) => {
              const st = (f.status || "").toUpperCase();
              const isSuccess = st === "SUCCESS" || st === "MULTI SUCCESS";
              if (isSuccess) {
                const msgs = f.messages ? f.messages.filter((m: any) => m.code || (m.raw && !m.raw.toLowerCase().includes("no sms received"))) : [];
                const count = msgs.length > 0 ? msgs.length : 1;
                localFeedCalc += count * 0.60;
              }
            });
          }
        }
      } catch (e) {}

      const effectiveBal = Math.max(dbBal, feedCalc, localFeedCalc, cached?.balance || 0);
      const effectiveSuccess = Math.max(Number(row.total_success || 0), feedEarningsMap[emailClean]?.count || 0, cached?.totalSuccess || 0);

      // Auto-sync computed balance to Supabase if DB balance was 0 or outdated
      if (effectiveBal > dbBal && emailClean) {
        supabase.from(USER_PROFILES_TABLE).update({
          balance: effectiveBal,
          total_success: effectiveSuccess,
          updated_at: new Date().toISOString()
        }).eq("email", emailClean).then(() => {
          // auto-synced
        });
      }

      const emailPrefix = emailClean.split("@")[0] || "User";
      const dbFullName = (row.full_name || row.fullName || "").trim();
      let effectiveFullName = dbFullName;
      if (!effectiveFullName || effectiveFullName.toLowerCase() === emailPrefix.toLowerCase()) {
        if (cached && cached.fullName && cached.fullName.trim() && cached.fullName.toLowerCase() !== emailPrefix.toLowerCase()) {
          effectiveFullName = cached.fullName.trim();
        }
      }
      if (!effectiveFullName) {
        effectiveFullName = emailPrefix;
      }

      return {
        email: emailClean,
        fullName: effectiveFullName,
        firstName: row.first_name || cached?.firstName || effectiveFullName.split(" ")[0] || "",
        lastName: row.last_name || cached?.lastName || effectiveFullName.split(" ").slice(1).join(" ") || "",
        mobileNumber: row.mobile_number || row.mobileNumber || cached?.mobileNumber || "",
        balance: Number(effectiveBal),
        totalSuccess: Number(effectiveSuccess),
        role: effectiveRole,
        telegram: row.telegram || cached?.telegram || "",
        country: row.country || cached?.country || "Bangladesh",
        city: row.city || cached?.city || "Dhaka",
        bio: row.bio || cached?.bio || "",
        withdrawPin: row.withdraw_pin || cached?.withdrawPin || "",
        accountStatus: row.account_status || cached?.accountStatus || "Active",
        apiKey: row.api_key || cached?.apiKey || "",
        uid: getCleanUid(emailClean, row.uid || cached?.uid),
        paymentMethods: row.payment_methods || cached?.paymentMethods || null,
        withdrawHistory: row.withdraw_history || cached?.withdrawHistory || null,
        referralEmail: assigned,
        referredBy: assigned,
        assignedAgent: assigned,
        isOfficial: row.is_official !== undefined ? !!row.is_official : (cached?.isOfficial !== undefined ? !!cached.isOfficial : emailClean === "official@orabitsms.xyz"),
        password: row.password || cached?.password || "",
        customOtpRate: userRate,
        rate: userRate,
        apiEnabled: row.api_enabled !== undefined ? !!row.api_enabled : (cached?.apiEnabled !== undefined ? !!cached.apiEnabled : true),
        lastLogin: row.last_login || row.updated_at || row.created_at || cached?.lastLogin,
        createdAt: row.created_at || row.createdAt || cached?.createdAt,
      };
    });

    // Also inject any role from user_roles that might be missing from user_profiles table entirely
    if (Array.isArray(rolesData)) {
      rolesData.forEach((r: any) => {
        if (!r.email) return;
        const eClean = r.email.toLowerCase().trim();
        if (!mapped.some((m) => m.email === eClean)) {
          const cached = cachedUsersMap[eClean];
          let roleName = "Client";
          const rLower = (r.role || "").toLowerCase();
          if (rLower === "owner") roleName = "Owner";
          else if (rLower === "agent") roleName = "Agent";

          mapped.push({
            email: eClean,
            fullName: cached?.fullName || eClean.split("@")[0],
            firstName: cached?.firstName || "",
            lastName: cached?.lastName || "",
            mobileNumber: cached?.mobileNumber || "",
            balance: cached?.balance || 0,
            totalSuccess: cached?.totalSuccess || 0,
            role: roleName,
            telegram: cached?.telegram || "",
            country: cached?.country || "Bangladesh",
            city: cached?.city || "Dhaka",
            referralEmail: officialEmail,
            referredBy: officialEmail,
            assignedAgent: officialEmail,
            isOfficial: cached?.isOfficial !== undefined ? !!cached.isOfficial : eClean === "official@orabitsms.xyz",
            password: cached?.password || "",
            accountStatus: cached?.accountStatus || "Active",
            customOtpRate: cached?.customOtpRate || 0.006,
            rate: cached?.rate || 0.006,
            apiEnabled: cached?.apiEnabled !== undefined ? !!cached.apiEnabled : true,
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
      const userRate = data.custom_otp_rate !== undefined && data.custom_otp_rate !== null ? Number(data.custom_otp_rate) : (data.rate !== undefined && data.rate !== null ? Number(data.rate) : 0.006);

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
        uid: getCleanUid(cleanEmail, data.uid),
        paymentMethods: data.payment_methods || null,
        withdrawHistory: data.withdraw_history || null,
        referralEmail: assigned,
        referredBy: assigned,
        assignedAgent: assigned,
        customOtpRate: userRate,
        rate: userRate,
        apiEnabled: data.api_enabled !== undefined ? !!data.api_enabled : true,
        lastLogin: data.last_login || data.updated_at || data.created_at,
      };
    }

    // 2. Fallback to Supabase Auth metadata if current user matches
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user && authData.user.email?.toLowerCase().trim() === cleanEmail) {
      const meta = authData.user.user_metadata || {};
      const officialEmail = (localStorage.getItem("orabit_official_agent_email") || "orabitsms@gmail.com").toLowerCase().trim();
      const assigned = (meta.assignedAgent || meta.referralEmail || meta.referredBy || officialEmail).toLowerCase().trim();
      const userRate = meta.customOtpRate !== undefined ? Number(meta.customOtpRate) : (meta.rate !== undefined ? Number(meta.rate) : 0.006);

      return {
        email: cleanEmail,
        fullName: meta.fullName || "",
        mobileNumber: meta.mobileNumber || "",
        telegram: meta.telegram || "",
        country: meta.country || "",
        city: meta.city || "",
        bio: meta.bio || "",
        withdrawPin: meta.withdrawPin !== undefined ? meta.withdrawPin : "",
        accountStatus: meta.accountStatus || "Active",
        role: meta.role || "Client",
        apiKey: meta.apiKey || "",
        uid: getCleanUid(cleanEmail, meta.uid),
        paymentMethods: meta.paymentMethods || null,
        withdrawHistory: meta.withdrawHistory || null,
        referralEmail: assigned,
        referredBy: assigned,
        assignedAgent: assigned,
        customOtpRate: userRate,
        rate: userRate,
        apiEnabled: meta.apiEnabled !== undefined ? !!meta.apiEnabled : true,
        lastLogin: meta.lastLogin,
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

  const numRate = profile.customOtpRate !== undefined ? Number(profile.customOtpRate) : (profile.rate !== undefined ? Number(profile.rate) : 0.006);

  // 0. Update localStorage registered users cache immediately so local state never reverts
  try {
    const stored = localStorage.getItem("orabit_registered_users");
    let userList: UserProfile[] = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(userList)) userList = [];
    const idx = userList.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
    if (idx >= 0) {
      userList[idx] = { ...userList[idx], ...profile, email: cleanEmail };
    } else {
      userList.push(profile);
    }
    localStorage.setItem("orabit_registered_users", JSON.stringify(userList));
  } catch (e) {
    console.warn("Notice updating local storage cache in saveUserProfileToSupabase:", e);
  }

  try {
    const payload: any = {
      email: cleanEmail,
      full_name: profile.fullName || "",
      first_name: profile.firstName || (profile.fullName ? profile.fullName.split(" ")[0] : ""),
      last_name: profile.lastName || (profile.fullName ? profile.fullName.split(" ").slice(1).join(" ") : ""),
      mobile_number: profile.mobileNumber || "",
      balance: profile.balance !== undefined ? Number(profile.balance) : 0,
      total_success: profile.totalSuccess !== undefined ? Number(profile.totalSuccess) : 0,
      role: profile.role || "Client",
      telegram: profile.telegram || "",
      country: profile.country || "",
      city: profile.city || "",
      bio: profile.bio || "",
      withdraw_pin: profile.withdrawPin || "",
      account_status: profile.accountStatus || "Active",
      api_key: profile.apiKey || "",
      uid: getCleanUid(cleanEmail, profile.uid),
      payment_methods: profile.paymentMethods || null,
      withdraw_history: profile.withdrawHistory || null,
      referral_email: assignedAgentVal,
      assigned_agent: assignedAgentVal,
      referred_by: assignedAgentVal,
      custom_otp_rate: numRate,
      rate: numRate,
      api_enabled: profile.apiEnabled !== undefined ? !!profile.apiEnabled : true,
      is_official: !!profile.isOfficial,
      password: profile.password || "",
      last_login: profile.lastLogin || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Update Supabase user_profiles table with robust UPDATE then INSERT fallback
    const { data: updateRes, error: updateErr } = await supabase
      .from(USER_PROFILES_TABLE)
      .update(payload)
      .ilike("email", cleanEmail)
      .select();

    let saveSuccess = !updateErr && Array.isArray(updateRes) && updateRes.length > 0;

    if (!saveSuccess) {
      // 1a. Fallback core payload if extended columns cause schema errors
      const corePayload = {
        email: cleanEmail,
        full_name: profile.fullName || "",
        mobile_number: profile.mobileNumber || "",
        balance: profile.balance !== undefined ? Number(profile.balance) : 0,
        total_success: profile.totalSuccess !== undefined ? Number(profile.totalSuccess) : 0,
        role: profile.role || "Client",
        telegram: profile.telegram || "",
        country: profile.country || "",
        city: profile.city || "",
        withdraw_pin: profile.withdrawPin || "",
        account_status: profile.accountStatus || "Active",
        updated_at: new Date().toISOString(),
      };

      const { data: coreUpdateRes, error: coreUpdateErr } = await supabase
        .from(USER_PROFILES_TABLE)
        .update(corePayload)
        .ilike("email", cleanEmail)
        .select();

      if (!coreUpdateErr && Array.isArray(coreUpdateRes) && coreUpdateRes.length > 0) {
        saveSuccess = true;
      } else {
        // 1b. Minimal update payload (guaranteed standard columns)
        const minPayload = {
          email: cleanEmail,
          full_name: profile.fullName || "",
          role: profile.role || "Client",
          telegram: profile.telegram || "",
          updated_at: new Date().toISOString(),
        };

        const { data: minUpdateRes, error: minUpdateErr } = await supabase
          .from(USER_PROFILES_TABLE)
          .update(minPayload)
          .ilike("email", cleanEmail)
          .select();

        if (!minUpdateErr && Array.isArray(minUpdateRes) && minUpdateRes.length > 0) {
          saveSuccess = true;
        } else {
          // 1c. Insert if record doesn't exist yet in user_profiles
          const { error: insertErr } = await supabase.from(USER_PROFILES_TABLE).insert(payload);
          if (insertErr) {
            const { error: coreInsertErr } = await supabase.from(USER_PROFILES_TABLE).insert(corePayload);
            if (coreInsertErr) {
              await supabase.from(USER_PROFILES_TABLE).insert(minPayload);
            }
          }
        }
      }
    }

    // 1b. Update user_roles table as well so roles match on all devices
    if (profile.role) {
      try {
        const cleanRoleStr = profile.role.toLowerCase().trim();
        const { data: roleUpdateRes, error: roleUpdateErr } = await supabase
          .from("user_roles")
          .update({ role: cleanRoleStr })
          .ilike("email", cleanEmail)
          .select();

        if (roleUpdateErr || !roleUpdateRes || roleUpdateRes.length === 0) {
          await supabase.from("user_roles").insert({ email: cleanEmail, role: cleanRoleStr });
        }
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

    // 3. Immediately update localStorage registered users list so local cache matches Supabase write
    try {
      const stored = localStorage.getItem("orabit_registered_users");
      let list: UserProfile[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...profile };
      } else {
        list.push(profile);
      }
      localStorage.setItem("orabit_registered_users", JSON.stringify(list));
    } catch (e) {}

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

    const newBalance = Number((currBalance + earnedRate).toFixed(4));
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

    try {
      const stored = localStorage.getItem("orabit_registered_users");
      if (stored) {
        let list: UserProfile[] = JSON.parse(stored);
        const idx = list.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
        if (idx >= 0) {
          list[idx].balance = newBalance;
          list[idx].totalSuccess = newTotalSuccess;
          localStorage.setItem("orabit_registered_users", JSON.stringify(list));
        }
      }
    } catch (e) {}

    return { newBalance, newTotalSuccess };
  } catch (e) {
    console.error("Exception incrementing user success and balance:", e);
    return null;
  }
}
