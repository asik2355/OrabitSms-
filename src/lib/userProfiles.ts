import { supabase } from "./supabase";
import { UserProfile } from "../components/OrabitAuthScreen";

export const USER_PROFILES_TABLE = "user_profiles";

export const CREATE_USER_PROFILES_TABLE_SQL = `
-- 1. Create user_profiles table in Supabase
CREATE TABLE IF NOT EXISTS public.user_profiles (
    email TEXT PRIMARY KEY,
    full_name TEXT,
    first_name TEXT,
    last_name TEXT,
    mobile_number TEXT,
    balance NUMERIC DEFAULT 0,
    total_success INTEGER DEFAULT 0,
    role TEXT DEFAULT 'Client',
    telegram TEXT,
    country TEXT DEFAULT 'Bangladesh',
    city TEXT DEFAULT 'Dhaka',
    bio TEXT,
    withdraw_pin TEXT,
    account_status TEXT DEFAULT 'Active',
    api_key TEXT,
    api_enabled BOOLEAN DEFAULT FALSE,
    custom_otp_rate NUMERIC DEFAULT 0.006,
    rate NUMERIC DEFAULT 0.006,
    referral_email TEXT,
    assigned_agent TEXT,
    referred_by TEXT,
    is_official BOOLEAN DEFAULT FALSE,
    password TEXT,
    uid TEXT,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Allow all operations for user_profiles (Public Access with anon key)
DROP POLICY IF EXISTS "Allow all operations for user_profiles" ON public.user_profiles;
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
 * Fetches ALL user/agent profiles directly from Secure Backend & Supabase.
 */
export async function fetchAllProfilesFromSupabase(): Promise<UserProfile[]> {
  try {
    // 1. Try Backend Proxy API first (Secure, synchronized across all devices)
    try {
      const resp = await fetch(`/api/users/list?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.success && Array.isArray(json.users) && json.users.length > 0) {
          const apiUsers: UserProfile[] = json.users.map((u: any) => {
            const fullN = (u.fullName !== undefined && u.fullName !== null && u.fullName !== "" ? u.fullName : (u.full_name || "")).trim();
            const cleanE = (u.email || "").toLowerCase().trim();
            return {
              ...u,
              email: cleanE,
              fullName: fullN || cleanE.split("@")[0] || "User",
              firstName: u.firstName || u.first_name || (fullN ? fullN.split(" ")[0] : ""),
              lastName: u.lastName || u.last_name || (fullN ? fullN.split(" ").slice(1).join(" ") : ""),
              mobileNumber: u.mobileNumber !== undefined ? u.mobileNumber : (u.mobile_number || ""),
              country: u.country || "Bangladesh",
              city: u.city || "Dhaka",
              telegram: u.telegram || "",
              bio: u.bio || "",
              role: u.role || (cleanE === "orabitsms@gmail.com" ? "Owner" : "Client"),
              balance: Number(u.balance || 0),
              customOtpRate: u.customOtpRate !== undefined ? Number(u.customOtpRate) : Number(u.rate || 0.006),
              rate: u.rate !== undefined ? Number(u.rate) : Number(u.customOtpRate || 0.006),
              apiEnabled: u.apiEnabled !== undefined ? !!u.apiEnabled : (cleanE === "orabitsms@gmail.com" || u.role === "Owner"),
              accountStatus: u.accountStatus || u.account_status || "Active",
              assignedAgent: u.assignedAgent || u.assigned_agent || u.referralEmail || "official@orabitsms.xyz",
              isOfficial: u.isOfficial !== undefined ? !!u.isOfficial : (cleanE === "official@orabitsms.xyz"),
            };
          });

          try {
            localStorage.setItem("orabit_registered_users", JSON.stringify(apiUsers));
          } catch (e) {}

          return apiUsers;
        }
      }
    } catch (e) {
      console.warn("Backend users list API notice, falling back to direct Supabase/cache:", e);
    }

    // 2. Fallback to direct Supabase fetch
    let profilesData: any[] = [];
    let rolesData: any[] = [];

    try {
      const res = await supabase.from(USER_PROFILES_TABLE).select("*");
      if (res && Array.isArray(res.data)) profilesData = res.data;
    } catch (e) {}

    try {
      const res = await supabase.from("user_roles").select("*");
      if (res && Array.isArray(res.data)) rolesData = res.data;
    } catch (e) {}

    let feedsData: any[] = [];
    try {
      const { data: fData } = await supabase.from("user_feed_numbers").select("user_email, status, raw_message, service, id, number");
      if (Array.isArray(fData)) {
        feedsData = fData.filter((f) => f && f.service !== "ORABIT_PROFILE_SYNC" && !f.id?.startsWith("profile_") && f.number !== "0");
      }
    } catch (e) {}

    const data = profilesData;

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

    // Load local cache map
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

    const officialEmail = (localStorage.getItem("orabit_official_agent_email") || "official@orabitsms.xyz").toLowerCase().trim();

    // Map profiles from user_profiles table if it has rows
    const mapped: UserProfile[] = (Array.isArray(data) ? data : []).map((row: any) => {
      const emailClean = (row.email || "").toLowerCase().trim();
      const cached = cachedUsersMap[emailClean] || ({} as Partial<UserProfile>);

      const assigned = (
        row.assigned_agent ||
        row.referral_email ||
        row.referred_by ||
        cached.assignedAgent ||
        cached.referralEmail ||
        officialEmail
      ).toLowerCase().trim();

      // Determine effective role (prefer user_roles table if present)
      let effectiveRole = row.role || cached.role || "Client";
      if (roleMap[emailClean]) {
        const r = roleMap[emailClean].toLowerCase();
        if (r === "owner") effectiveRole = "Owner";
        else if (r === "agent") effectiveRole = "Agent";
        else if (r === "client") effectiveRole = "Client";
      }

      const userRate = row.custom_otp_rate !== undefined && row.custom_otp_rate !== null
        ? Number(row.custom_otp_rate)
        : (row.rate !== undefined && row.rate !== null
          ? Number(row.rate)
          : (cached.customOtpRate !== undefined ? Number(cached.customOtpRate) : 0.006));

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
              if (f.service === "ORABIT_PROFILE_SYNC" || f.id?.startsWith("profile_") || f.number === "0") return;
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
      const effectiveSuccess = Math.max(
        Number(row.total_success || 0),
        feedEarningsMap[emailClean]?.count || 0,
        cached?.totalSuccess || 0
      );

      const emailPrefix = emailClean.split("@")[0] || "User";
      const fullN = (row.full_name || row.fullName || cached.fullName || emailPrefix).trim();

      return {
        email: emailClean,
        fullName: fullN,
        firstName: row.first_name || cached?.firstName || fullN.split(" ")[0] || "",
        lastName: row.last_name || cached?.lastName || fullN.split(" ").slice(1).join(" ") || "",
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
        apiEnabled: row.api_enabled !== undefined
          ? !!row.api_enabled
          : (cached?.apiEnabled !== undefined
            ? !!cached.apiEnabled
            : (emailClean === "orabitsms@gmail.com" || effectiveRole === "Owner")),
        lastLogin: row.last_login || row.updated_at || row.created_at || cached?.lastLogin,
      };
    });

    // Also include cached accounts that weren't in user_profiles
    Object.keys(cachedUsersMap).forEach((eClean) => {
      if (!mapped.some((m) => m.email === eClean)) {
        const cached = cachedUsersMap[eClean];
        let roleName = cached?.role || "Client";
        if (roleMap[eClean]) {
          const r = roleMap[eClean].toLowerCase();
          if (r === "owner") roleName = "Owner";
          else if (r === "agent") roleName = "Agent";
          else if (r === "client") roleName = "Client";
        }

        const assigned = (cached?.assignedAgent || cached?.referralEmail || cached?.referredBy || officialEmail).toLowerCase().trim();
        const userRate = cached?.customOtpRate !== undefined ? Number(cached.customOtpRate) : (cached?.rate !== undefined ? Number(cached.rate) : 0.006);
        const fullN = (cached?.fullName || eClean.split("@")[0]).trim();

        mapped.push({
          email: eClean,
          fullName: fullN,
          firstName: cached?.firstName || fullN.split(" ")[0] || "",
          lastName: cached?.lastName || fullN.split(" ").slice(1).join(" ") || "",
          mobileNumber: cached?.mobileNumber || "",
          balance: cached?.balance || 0,
          totalSuccess: cached?.totalSuccess || 0,
          role: roleName,
          telegram: cached?.telegram || "",
          country: cached?.country || "Bangladesh",
          city: cached?.city || "Dhaka",
          bio: cached?.bio || "",
          withdrawPin: cached?.withdrawPin || "",
          accountStatus: cached?.accountStatus || "Active",
          apiKey: cached?.apiKey || "",
          uid: getCleanUid(eClean, cached?.uid),
          paymentMethods: cached?.paymentMethods || null,
          withdrawHistory: cached?.withdrawHistory || null,
          referralEmail: assigned,
          referredBy: assigned,
          assignedAgent: assigned,
          isOfficial: cached?.isOfficial !== undefined ? !!cached.isOfficial : eClean === "official@orabitsms.xyz",
          password: cached?.password || "",
          customOtpRate: userRate,
          rate: userRate,
          apiEnabled: cached?.apiEnabled !== undefined ? !!cached.apiEnabled : (eClean === "orabitsms@gmail.com" || roleName === "Owner"),
          lastLogin: cached?.lastLogin,
        });
      }
    });

    // Also inject any role from user_roles that might be missing from both
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
            apiEnabled: cached?.apiEnabled !== undefined ? !!cached.apiEnabled : (eClean === "orabitsms@gmail.com" || roleName === "Owner"),
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
 * Fetches user profile directly from Secure Backend (checking server API, user_profiles table, and user_roles).
 */
export async function fetchUserProfileFromSupabase(email: string): Promise<Partial<UserProfile> | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const officialEmail = (localStorage.getItem("orabit_official_agent_email") || "official@orabitsms.xyz").toLowerCase().trim();

  try {
    // 1. Try Backend Proxy API first (Authoritative, prevents unauthorized client balance edits)
    try {
      const resp = await fetch(`/api/users/profile?email=${encodeURIComponent(cleanEmail)}&t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.success && json.profile) {
          const p = json.profile;
          const userRate = p.customOtpRate !== undefined ? Number(p.customOtpRate) : Number(p.rate || 0.006);
          const fullN = (p.fullName || p.full_name || "").trim();

          const result: Partial<UserProfile> = {
            email: cleanEmail,
            fullName: fullN,
            firstName: p.firstName || p.first_name || fullN.split(" ")[0] || "",
            lastName: p.lastName || p.last_name || fullN.split(" ").slice(1).join(" ") || "",
            mobileNumber: p.mobileNumber || p.mobile_number || "",
            balance: Number(p.balance || 0),
            totalSuccess: Number(p.totalSuccess || p.total_success || 0),
            role: p.role || (cleanEmail === "orabitsms@gmail.com" ? "Owner" : "Client"),
            telegram: p.telegram || "",
            country: p.country || "Bangladesh",
            city: p.city || "Dhaka",
            bio: p.bio || "",
            withdrawPin: p.withdrawPin || p.withdraw_pin || "",
            accountStatus: p.accountStatus || p.account_status || "Active",
            apiKey: p.apiKey || p.api_key || "",
            uid: getCleanUid(cleanEmail, p.uid),
            paymentMethods: p.paymentMethods || p.payment_methods || null,
            withdrawHistory: p.withdrawHistory || p.withdraw_history || null,
            referralEmail: p.referralEmail || p.assignedAgent || p.assigned_agent || officialEmail,
            referredBy: p.referredBy || p.assignedAgent || p.assigned_agent || officialEmail,
            assignedAgent: p.assignedAgent || p.assigned_agent || p.referralEmail || officialEmail,
            customOtpRate: userRate,
            rate: userRate,
            apiEnabled: p.apiEnabled !== undefined ? !!p.apiEnabled : (cleanEmail === "orabitsms@gmail.com" || p.role === "Owner"),
            isOfficial: p.isOfficial !== undefined ? !!p.isOfficial : cleanEmail === "official@orabitsms.xyz",
            lastLogin: p.lastLogin || p.last_login || p.updatedAt || p.updated_at,
          };
          return result;
        }
      }
    } catch (e) {
      console.warn("Backend user profile API notice, checking Supabase/cache fallback:", e);
    }

    // Fetch from user_profiles table and user_roles table
    let tableData: any = null;
    let roleVal: string | null = null;

    try {
      const res = await supabase.from(USER_PROFILES_TABLE).select("*").ilike("email", cleanEmail).maybeSingle();
      if (res && res.data) tableData = res.data;
    } catch (e) {}

    try {
      const res = await supabase.from("user_roles").select("role").ilike("email", cleanEmail).maybeSingle();
      if (res && res.data?.role) roleVal = res.data.role;
    } catch (e) {}

    if (tableData) {
      const mergedRole = roleVal
        ? (roleVal.toLowerCase() === "owner" ? "Owner" : roleVal.toLowerCase() === "agent" ? "Agent" : "Client")
        : (tableData?.role || (cleanEmail === "orabitsms@gmail.com" ? "Owner" : "Client"));

      const assigned = (
        tableData?.assigned_agent ||
        tableData?.referral_email ||
        tableData?.referred_by ||
        officialEmail
      ).toLowerCase().trim();

      const userRate = (tableData?.custom_otp_rate !== undefined && tableData?.custom_otp_rate !== null
        ? Number(tableData.custom_otp_rate)
        : (tableData?.rate !== undefined && tableData?.rate !== null
          ? Number(tableData.rate)
          : 0.006));

      const fullN = (tableData?.full_name || tableData?.fullName || "").trim();

      return {
        email: cleanEmail,
        fullName: fullN,
        firstName: tableData?.first_name || fullN.split(" ")[0] || "",
        lastName: tableData?.last_name || fullN.split(" ").slice(1).join(" ") || "",
        mobileNumber: tableData?.mobile_number || tableData?.mobileNumber || "",
        balance: Number(tableData?.balance || 0),
        totalSuccess: Number(tableData?.total_success || 0),
        role: mergedRole,
        telegram: tableData?.telegram || "",
        country: tableData?.country || "Bangladesh",
        city: tableData?.city || "Dhaka",
        bio: tableData?.bio || "",
        withdrawPin: tableData?.withdraw_pin || "",
        accountStatus: tableData?.account_status || "Active",
        apiKey: tableData?.api_key || "",
        uid: getCleanUid(cleanEmail, tableData?.uid),
        paymentMethods: tableData?.payment_methods || null,
        withdrawHistory: tableData?.withdraw_history || null,
        referralEmail: assigned,
        referredBy: assigned,
        assignedAgent: assigned,
        customOtpRate: userRate,
        rate: userRate,
        apiEnabled: tableData?.api_enabled !== undefined
          ? !!tableData.api_enabled
          : (cleanEmail === "orabitsms@gmail.com" || mergedRole === "Owner"),
        isOfficial: tableData?.is_official !== undefined ? !!tableData.is_official : cleanEmail === "official@orabitsms.xyz",
        lastLogin: tableData?.last_login || tableData?.updated_at || tableData?.created_at,
      };
    }

    // 2. Fallback to Supabase Auth metadata if current user matches
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user && authData.user.email?.toLowerCase().trim() === cleanEmail) {
      const meta = authData.user.user_metadata || {};
      const assigned = (meta.assignedAgent || meta.referralEmail || meta.referredBy || officialEmail).toLowerCase().trim();
      const userRate = meta.customOtpRate !== undefined ? Number(meta.customOtpRate) : (meta.rate !== undefined ? Number(meta.rate) : 0.006);

      let effectiveRole = meta.role || "Client";
      if (roleVal) {
        effectiveRole = roleVal.toLowerCase() === "owner" ? "Owner" : roleVal.toLowerCase() === "agent" ? "Agent" : "Client";
      }

      return {
        email: cleanEmail,
        fullName: meta.fullName || "",
        mobileNumber: meta.mobileNumber || "",
        telegram: meta.telegram || "",
        country: meta.country || "Bangladesh",
        city: meta.city || "Dhaka",
        bio: meta.bio || "",
        withdrawPin: meta.withdrawPin !== undefined ? meta.withdrawPin : "",
        accountStatus: meta.accountStatus || "Active",
        role: effectiveRole,
        apiKey: meta.apiKey || "",
        uid: getCleanUid(cleanEmail, meta.uid),
        paymentMethods: meta.paymentMethods || null,
        withdrawHistory: meta.withdrawHistory || null,
        referralEmail: assigned,
        referredBy: assigned,
        assignedAgent: assigned,
        customOtpRate: userRate,
        rate: userRate,
        apiEnabled: meta.apiEnabled !== undefined
          ? !!meta.apiEnabled
          : (cleanEmail === "orabitsms@gmail.com" || effectiveRole === "Owner"),
        lastLogin: meta.lastLogin,
      };
    }
  } catch (e) {
    console.error("Exception fetching profile from Supabase:", e);
  }

  return null;
}

/**
 * Saves or updates user profile in Backend Proxy API (with server validation) & Supabase.
 */
export async function saveUserProfileToSupabase(profile: UserProfile): Promise<boolean> {
  if (!profile || !profile.email) return false;
  const cleanEmail = profile.email.toLowerCase().trim();

  // 0. Get current session info to determine requester
  let requesterEmail = cleanEmail;
  let requesterRole = profile.role || "Client";
  try {
    const sessionStr = localStorage.getItem("orabit_user_profile");
    if (sessionStr) {
      const parsed = JSON.parse(sessionStr);
      if (parsed?.email) requesterEmail = parsed.email.toLowerCase().trim();
      if (parsed?.role) requesterRole = parsed.role;
    }
  } catch (e) {}

  const officialEmail = (localStorage.getItem("orabit_official_agent_email") || "official@orabitsms.xyz").toLowerCase().trim();
  let assignedAgentVal = (
    profile.assignedAgent ||
    (profile as any).assigned_agent ||
    profile.referralEmail ||
    profile.referredBy ||
    officialEmail
  ).toLowerCase().trim();

  if (assignedAgentVal === "orabitsms@gmail.com" || !assignedAgentVal) {
    assignedAgentVal = officialEmail;
  }

  const numRate = profile.customOtpRate !== undefined ? Number(profile.customOtpRate) : (profile.rate !== undefined ? Number(profile.rate) : 0.006);
  const isOwnerAcc = cleanEmail === "orabitsms@gmail.com" || profile.role?.toLowerCase() === "owner";

  // 1. Send to Secure Backend Proxy API (Ensures server-authoritative validation & real-time sync across devices)
  try {
    const resp = await fetch("/api/users/save-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": requesterEmail,
      },
      body: JSON.stringify({
        requesterEmail,
        profile: {
          ...profile,
          email: cleanEmail,
          assignedAgent: assignedAgentVal,
          customOtpRate: numRate,
          rate: numRate,
        },
      }),
    });

    if (resp.ok) {
      const json = await resp.json();
      if (json && json.success && json.profile) {
        // Update local cache with sanitized server-authoritative profile
        try {
          const stored = localStorage.getItem("orabit_registered_users");
          let userList: UserProfile[] = stored ? JSON.parse(stored) : [];
          if (!Array.isArray(userList)) userList = [];
          const idx = userList.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
          if (idx >= 0) {
            userList[idx] = { ...userList[idx], ...json.profile, email: cleanEmail };
          } else {
            userList.push({ ...json.profile, email: cleanEmail });
          }
          localStorage.setItem("orabit_registered_users", JSON.stringify(userList));

          // If current logged-in user updated their own profile, update local session
          if (requesterEmail === cleanEmail) {
            localStorage.setItem("orabit_user_profile", JSON.stringify({ ...profile, ...json.profile }));
          }
        } catch (e) {}

        return true;
      }
    }
  } catch (e) {
    console.warn("Backend proxy API save warning, writing to fallback direct Supabase:", e);
  }

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
      api_enabled: profile.apiEnabled !== undefined ? !!profile.apiEnabled : isOwnerAcc,
      is_official: !!profile.isOfficial,
      password: profile.password || "",
      last_login: profile.lastLogin || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Update Supabase user_profiles table if available
    try {
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
                try {
                  await supabase.from(USER_PROFILES_TABLE).insert(minPayload);
                } catch (e) {}
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Notice updating user_profiles table:", e);
    }

    // 2. Update user_roles table as well so roles match on all devices
    if (profile.role) {
      try {
        const cleanRoleStr = profile.role.toLowerCase().trim();
        const { data: roleUpdateRes, error: roleUpdateErr } = await supabase
          .from("user_roles")
          .update({ role: cleanRoleStr })
          .ilike("email", cleanEmail)
          .select();

        if (roleUpdateErr || !roleUpdateRes || roleUpdateRes.length === 0) {
          await supabase.from("user_roles").upsert({ email: cleanEmail, role: cleanRoleStr }, { onConflict: "email" });
        }
      } catch (e) {
        console.warn("Notice updating user_roles table:", e);
      }
    }

    // 4. Also update Supabase Auth User Metadata for instant cross-device fallback
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
            assignedAgent: assignedAgentVal,
            referralEmail: assignedAgentVal,
            paymentMethods: profile.paymentMethods || null,
            withdrawHistory: profile.withdrawHistory || null,
          },
        });
      }
    } catch (e) {
      console.warn("Notice updating auth metadata:", e);
    }

    // 5. Immediately update localStorage registered users list so local cache matches Supabase write
    try {
      const stored = localStorage.getItem("orabit_registered_users");
      let list: UserProfile[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...profile, email: cleanEmail };
      } else {
        list.push({ ...profile, email: cleanEmail });
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
 * Increments total_success (+1) and balance (+earnedRate) permanently in Backend and Supabase.
 */
export async function incrementUserSuccessAndBalanceInSupabase(
  email: string,
  earnedRate: number
): Promise<{ newBalance: number; newTotalSuccess: number } | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();

  // Try Secure Backend endpoint
  try {
    const resp = await fetch("/api/users/update-balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": "orabit-internal-otp-system",
      },
      body: JSON.stringify({
        targetEmail: cleanEmail,
        amount: earnedRate,
        reason: "OTP Success Commission",
      }),
    });

    if (resp.ok) {
      const json = await resp.json();
      if (json && json.success && json.newBalance !== undefined) {
        const newBalance = json.newBalance;
        const current = await fetchUserProfileFromSupabase(cleanEmail);
        const newTotalSuccess = (current?.totalSuccess || 0) + 1;

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
      }
    }
  } catch (e) {
    console.warn("Backend balance update notice, executing Supabase fallback:", e);
  }

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
