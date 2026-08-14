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
    const combinedMap = new Map<string, UserProfile>();

    // 1. First populate from local storage cache
    try {
      const stored = localStorage.getItem("orabit_registered_users");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((u: UserProfile) => {
            if (u && u.email) {
              const cleanE = u.email.toLowerCase().trim();
              const fullN = (u.fullName || cleanE.split("@")[0] || "User").trim();
              const rLower = (u.role || "").toLowerCase();
              const normRole = rLower === "owner" ? "Owner" : rLower === "agent" ? "Agent" : "Client";
              combinedMap.set(cleanE, {
                ...u,
                email: cleanE,
                fullName: fullN,
                role: normRole,
                isOfficial: u.isOfficial !== undefined ? !!u.isOfficial : cleanE === "official@orabitsms.xyz",
              });
            }
          });
        }
      }
    } catch (e) {}

    // 2. Fetch Backend Proxy API (/api/users/list)
    try {
      const resp = await fetch(`/api/users/list?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.success && Array.isArray(json.users)) {
          json.users.forEach((u: any) => {
            const cleanE = (u.email || "").toLowerCase().trim();
            if (!cleanE) return;
            const fullN = (u.fullName !== undefined && u.fullName !== null && u.fullName !== "" ? u.fullName : (u.full_name || "")).trim();
            const rawRole = (u.role || "").toString().toLowerCase();
            const normRole = rawRole === "owner" ? "Owner" : rawRole === "agent" ? "Agent" : (combinedMap.get(cleanE)?.role || "Client");
            const existing = combinedMap.get(cleanE) || ({} as Partial<UserProfile>);

            combinedMap.set(cleanE, {
              ...existing,
              ...u,
              email: cleanE,
              fullName: fullN || existing.fullName || cleanE.split("@")[0] || "User",
              firstName: u.firstName || u.first_name || (fullN ? fullN.split(" ")[0] : existing.firstName || ""),
              lastName: u.lastName || u.last_name || (fullN ? fullN.split(" ").slice(1).join(" ") : existing.lastName || ""),
              mobileNumber: u.mobileNumber !== undefined ? u.mobileNumber : (u.mobile_number || existing.mobileNumber || ""),
              country: u.country || existing.country || "Bangladesh",
              city: u.city || existing.city || "Dhaka",
              telegram: u.telegram || existing.telegram || "",
              bio: u.bio || existing.bio || "",
              role: normRole,
              balance: Number(u.balance !== undefined ? u.balance : (existing.balance || 0)),
              customOtpRate: u.customOtpRate !== undefined ? Number(u.customOtpRate) : Number(u.rate || existing.customOtpRate || 0.006),
              rate: u.rate !== undefined ? Number(u.rate) : Number(u.customOtpRate || existing.rate || 0.006),
              apiEnabled: u.apiEnabled !== undefined ? !!u.apiEnabled : (cleanE === "orabitsms@gmail.com" || normRole === "Owner"),
              accountStatus: u.accountStatus || u.account_status || existing.accountStatus || "Active",
              assignedAgent: u.assignedAgent || u.assigned_agent || u.referralEmail || existing.assignedAgent || "official@orabitsms.xyz",
              isOfficial: u.isOfficial !== undefined ? !!u.isOfficial : (cleanE === "official@orabitsms.xyz"),
            });
          });
        }
      }
    } catch (e) {
      console.warn("Backend users list API notice, continuing to Supabase direct fetch:", e);
    }

    // 3. Directly query Supabase user_roles and user_profiles to ensure 100% coverage
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from(USER_PROFILES_TABLE).select("*"),
        supabase.from("user_roles").select("*"),
      ]);

      if (rolesRes && Array.isArray(rolesRes.data)) {
        rolesRes.data.forEach((r: any) => {
          const cleanE = (r.email || "").toLowerCase().trim();
          if (!cleanE) return;
          const rLower = (r.role || "").toLowerCase().trim();
          const normRole = rLower === "owner" ? "Owner" : rLower === "agent" ? "Agent" : "Client";
          const existing = combinedMap.get(cleanE);
          if (existing) {
            existing.role = normRole;
          } else {
            const defName = normRole === "Agent" ? `Agent (${cleanE.split("@")[0]})` : cleanE.split("@")[0] || "User";
            combinedMap.set(cleanE, {
              email: cleanE,
              fullName: defName,
              firstName: defName.split(" ")[0] || "",
              lastName: defName.split(" ").slice(1).join(" ") || "",
              mobileNumber: "01700000000",
              role: normRole,
              balance: 0,
              customOtpRate: normRole === "Agent" ? 0.0075 : 0.006,
              rate: normRole === "Agent" ? 0.0075 : 0.006,
              accountStatus: "Active",
              country: "Bangladesh",
              city: "Dhaka",
              assignedAgent: "official@orabitsms.xyz",
              isOfficial: cleanE === "official@orabitsms.xyz",
            });
          }
        });
      }

      if (profilesRes && Array.isArray(profilesRes.data)) {
        profilesRes.data.forEach((row: any) => {
          const cleanE = (row.email || "").toLowerCase().trim();
          if (!cleanE) return;
          const liveFullName = (row.full_name !== undefined && row.full_name !== null && row.full_name !== ""
            ? row.full_name
            : (row.fullName || "")).trim();
          const rawRole = (row.role || "").toString().toLowerCase();
          const existing = combinedMap.get(cleanE);
          const normRole = rawRole === "owner" ? "Owner" : rawRole === "agent" ? "Agent" : (existing?.role || "Client");

          combinedMap.set(cleanE, {
            ...existing,
            email: cleanE,
            fullName: liveFullName || existing?.fullName || cleanE.split("@")[0] || "User",
            firstName: row.first_name || (liveFullName ? liveFullName.split(" ")[0] : existing?.firstName || ""),
            lastName: row.last_name || (liveFullName ? liveFullName.split(" ").slice(1).join(" ") : existing?.lastName || ""),
            mobileNumber: row.mobile_number !== undefined ? row.mobile_number : (existing?.mobileNumber || ""),
            country: row.country || existing?.country || "Bangladesh",
            city: row.city || existing?.city || "Dhaka",
            telegram: row.telegram || existing?.telegram || "",
            bio: row.bio || existing?.bio || "",
            role: normRole,
            balance: Number(row.balance !== undefined ? row.balance : (existing?.balance || 0)),
            customOtpRate: row.custom_otp_rate !== undefined ? Number(row.custom_otp_rate) : Number(row.rate || existing?.customOtpRate || 0.006),
            rate: row.rate !== undefined ? Number(row.rate) : Number(row.custom_otp_rate || existing?.rate || 0.006),
            accountStatus: row.account_status || existing?.accountStatus || "Active",
            assignedAgent: row.assigned_agent || row.referral_email || existing?.assignedAgent || "official@orabitsms.xyz",
            isOfficial: row.is_official !== undefined ? !!row.is_official : (existing?.isOfficial ?? (cleanE === "official@orabitsms.xyz")),
          });
        });
      }
    } catch (e) {
      console.warn("Direct Supabase query notice in fetchAllProfilesFromSupabase:", e);
    }

    const finalUsers = Array.from(combinedMap.values());
    try {
      localStorage.setItem("orabit_registered_users", JSON.stringify(finalUsers));
      const official = finalUsers.find((u) => (u.isOfficial || u.email === "official@orabitsms.xyz") && u.role?.toLowerCase() === "agent");
      if (official && official.email) {
        localStorage.setItem("orabit_official_agent_email", official.email.toLowerCase().trim());
      }
    } catch (e) {}

    return finalUsers;
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
 * Fetches user profile directly from Secure Backend & Supabase (querying Supabase user_profiles table as primary source of truth).
 */
export async function fetchUserProfileFromSupabase(email: string): Promise<Partial<UserProfile> | null> {
  if (!email) return null;
  const cleanEmail = email.toLowerCase().trim();
  const officialEmail = (localStorage.getItem("orabit_official_agent_email") || "official@orabitsms.xyz").toLowerCase().trim();

  // 1. Direct Supabase Query FIRST (Authoritative Cloud Database Source of Truth)
  try {
    let tableData: any = null;
    let roleVal: string | null = null;

    try {
      const res = await supabase.from(USER_PROFILES_TABLE).select("*").ilike("email", cleanEmail).maybeSingle();
      if (res && res.data) tableData = res.data;
    } catch (e) {
      console.warn("Direct Supabase query notice:", e);
    }

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

      const fullN = (tableData?.full_name !== undefined && tableData?.full_name !== null
        ? tableData.full_name
        : (tableData?.fullName || "")).trim();

      const liveProfile: Partial<UserProfile> = {
        email: cleanEmail,
        fullName: fullN,
        firstName: tableData?.first_name || (fullN ? fullN.split(" ")[0] : "") || "",
        lastName: tableData?.last_name || (fullN ? fullN.split(" ").slice(1).join(" ") : "") || "",
        mobileNumber: tableData?.mobile_number !== undefined && tableData?.mobile_number !== null ? tableData.mobile_number : (tableData?.mobileNumber || ""),
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

      // Background update local cache with fresh authoritative data
      try {
        const stored = localStorage.getItem("orabit_registered_users");
        let list: UserProfile[] = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(list)) list = [];
        const idx = list.findIndex((u) => u.email.toLowerCase().trim() === cleanEmail);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...liveProfile, email: cleanEmail } as UserProfile;
        } else {
          list.push(liveProfile as UserProfile);
        }
        localStorage.setItem("orabit_registered_users", JSON.stringify(list));
      } catch (e) {}

      return liveProfile;
    }
  } catch (e) {
    console.warn("Direct Supabase user profile fetch error, checking API fallback:", e);
  }

  try {
    // 2. Try Backend Proxy API fallback
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
      console.warn("Backend user profile API notice:", e);
    }
  } catch (e) {}

  try {
    // 3. Fallback to Supabase Auth metadata if current user matches
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user && authData.user.email?.toLowerCase().trim() === cleanEmail) {
      const meta = authData.user.user_metadata || {};
      const assigned = (meta.assignedAgent || meta.referralEmail || meta.referredBy || officialEmail).toLowerCase().trim();
      const userRate = meta.customOtpRate !== undefined ? Number(meta.customOtpRate) : (meta.rate !== undefined ? Number(meta.rate) : 0.006);

      let effectiveRole = meta.role || (cleanEmail === "orabitsms@gmail.com" ? "Owner" : "Client");
      try {
        const { data: roleRow } = await supabase.from("user_roles").select("role").ilike("email", cleanEmail).maybeSingle();
        if (roleRow?.role) {
          effectiveRole = roleRow.role.toLowerCase() === "owner" ? "Owner" : roleRow.role.toLowerCase() === "agent" ? "Agent" : "Client";
        }
      } catch (e) {}

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
