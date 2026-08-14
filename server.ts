import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hdcdrjjonuarxfdxkwia.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_Wmwz_HvcKllXzQ8Xi-9o-w_muS6WW1F";

const serverSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Persistent Server Profiles Store (Ensures multi-device live sync & crash resilience)
const PROFILES_STORAGE_FILE = path.join(process.cwd(), "user_profiles_server.json");
const FEEDS_STORAGE_FILE = path.join(process.cwd(), "user_feeds_server.json");
const STATS_STORAGE_FILE = path.join(process.cwd(), "daily_stats_server.json");

function loadServerProfiles(): Record<string, any> {
  try {
    if (fs.existsSync(PROFILES_STORAGE_FILE)) {
      const raw = fs.readFileSync(PROFILES_STORAGE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to read server profiles storage file:", e);
  }
  return {};
}

function saveServerProfiles(profiles: Record<string, any>) {
  try {
    fs.writeFileSync(PROFILES_STORAGE_FILE, JSON.stringify(profiles, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to write server profiles storage file:", e);
  }
}

function loadServerFeeds(): Record<string, any[]> {
  try {
    if (fs.existsSync(FEEDS_STORAGE_FILE)) {
      const raw = fs.readFileSync(FEEDS_STORAGE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to read server feeds storage file:", e);
  }
  return {};
}

function saveServerFeeds(feeds: Record<string, any[]>) {
  try {
    fs.writeFileSync(FEEDS_STORAGE_FILE, JSON.stringify(feeds, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to write server feeds storage file:", e);
  }
}

function loadServerStats(): any[] {
  try {
    if (fs.existsSync(STATS_STORAGE_FILE)) {
      const raw = fs.readFileSync(STATS_STORAGE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to read server stats storage file:", e);
  }
  return [];
}

function saveServerStats(stats: any[]) {
  try {
    fs.writeFileSync(STATS_STORAGE_FILE, JSON.stringify(stats, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to write server stats storage file:", e);
  }
}

const serverProfilesCache: Record<string, any> = loadServerProfiles();
const serverFeedsCache: Record<string, any[]> = loadServerFeeds();
let serverStatsCache: any[] = loadServerStats();

// Ensure Owner exists with baseline config
if (!serverProfilesCache["orabitsms@gmail.com"]) {
  serverProfilesCache["orabitsms@gmail.com"] = {
    email: "orabitsms@gmail.com",
    fullName: "Orabit Master Owner",
    role: "Owner",
    balance: 999.0,
    apiEnabled: true,
    accountStatus: "Active",
    customOtpRate: 0.006,
    rate: 0.006,
    country: "Bangladesh",
    city: "Dhaka",
  };
  saveServerProfiles(serverProfilesCache);
}

// Ensure Official Agent exists with baseline config
if (!serverProfilesCache["official@orabitsms.xyz"]) {
  serverProfilesCache["official@orabitsms.xyz"] = {
    email: "official@orabitsms.xyz",
    fullName: "ORABIT OFFICIAL SUPPORT",
    firstName: "Orabit",
    lastName: "Official",
    role: "Agent",
    isOfficial: true,
    telegram: "@OrabitSupport",
    balance: 0.0,
    apiEnabled: false,
    accountStatus: "Active",
    customOtpRate: 0.006,
    rate: 0.006,
    country: "Bangladesh",
    city: "Dhaka",
  };
  saveServerProfiles(serverProfilesCache);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini AI Client lazily or safely
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", geminiAvailable: !!process.env.GEMINI_API_KEY });
  });

  // -------------------------------------------------------------
  // SECURE USER MANAGEMENT & CROSS-DEVICE CLOUD SYNC API
  // -------------------------------------------------------------

  // Helper to normalize full profile
  const normalizeProfile = (raw: any, email: string) => {
    const cleanE = email.toLowerCase().trim();
    const isOwner = cleanE === "orabitsms@gmail.com" || (raw.role && raw.role.toLowerCase() === "owner");
    const isOff = cleanE === "official@orabitsms.xyz" || !!raw.is_official || !!raw.isOfficial;

    let role = raw.role || (isOwner ? "Owner" : isOff ? "Agent" : "Client");
    if (role.toLowerCase() === "owner") role = "Owner";
    else if (role.toLowerCase() === "agent") role = "Agent";
    else role = "Client";

    const customRate = raw.custom_otp_rate !== undefined ? Number(raw.custom_otp_rate) : (raw.rate !== undefined ? Number(raw.rate) : (raw.customOtpRate !== undefined ? Number(raw.customOtpRate) : 0.006));

    return {
      email: cleanE,
      fullName: raw.full_name || raw.fullName || raw.firstName || (cleanE.split("@")[0]),
      firstName: raw.first_name || raw.firstName || "",
      lastName: raw.last_name || raw.lastName || "",
      mobileNumber: raw.mobile_number || raw.mobileNumber || "",
      telegram: raw.telegram || "",
      country: raw.country || "Bangladesh",
      city: raw.city || "Dhaka",
      bio: raw.bio || "",
      withdrawPin: raw.withdraw_pin || raw.withdrawPin || "",
      balance: raw.balance !== undefined ? Number(raw.balance) : (isOwner ? 999.0 : 0.0),
      totalSuccess: raw.total_success !== undefined ? Number(raw.total_success) : (raw.totalSuccess !== undefined ? Number(raw.totalSuccess) : 0),
      role,
      accountStatus: raw.account_status || raw.accountStatus || "Active",
      apiEnabled: raw.api_enabled !== undefined ? !!raw.api_enabled : (raw.apiEnabled !== undefined ? !!raw.apiEnabled : isOwner),
      apiKey: raw.api_key || raw.apiKey || "",
      customOtpRate: customRate,
      rate: customRate,
      referralEmail: raw.referral_email || raw.referralEmail || raw.assigned_agent || raw.assignedAgent || "official@orabitsms.xyz",
      assignedAgent: raw.assigned_agent || raw.assignedAgent || raw.referral_email || raw.referralEmail || "official@orabitsms.xyz",
      referredBy: raw.referred_by || raw.referredBy || raw.assigned_agent || raw.assignedAgent || "official@orabitsms.xyz",
      isOfficial: isOff,
      password: raw.password || "",
      uid: raw.uid || "",
      paymentMethods: raw.payment_methods || raw.paymentMethods || null,
      withdrawHistory: raw.withdraw_history || raw.withdrawHistory || null,
      lastTargetRange: raw.last_target_range || raw.lastTargetRange || "",
      currency: raw.currency || "USD",
      lastLogin: raw.last_login || raw.lastLogin || new Date().toISOString(),
      updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
    };
  };

  // 1. Cross-Device Login Endpoint (Works seamlessly across multiple phones/PCs)
  app.post("/api/users/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const cleanEmail = email.toLowerCase().trim();

      // Check server cache first
      let cached = serverProfilesCache[cleanEmail];

      // Try fetching from Supabase if not in cache or to verify latest
      try {
        const { data: dbData } = await serverSupabase
          .from("user_profiles")
          .select("*")
          .ilike("email", cleanEmail)
          .maybeSingle();

        if (dbData) {
          cached = normalizeProfile({ ...cached, ...dbData }, cleanEmail);
          serverProfilesCache[cleanEmail] = cached;
          saveServerProfiles(serverProfilesCache);
        }
      } catch (e) {}

      if (!cached) {
        return res.status(404).json({ error: "Account not found. Please register first." });
      }

      // Password verification (if password was stored)
      if (cached.password && cached.password !== password) {
        return res.status(401).json({ error: "Incorrect password. Please try again." });
      }

      // Update lastLogin
      cached.lastLogin = new Date().toISOString();
      serverProfilesCache[cleanEmail] = cached;
      saveServerProfiles(serverProfilesCache);

      return res.json({ success: true, profile: cached });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Login failed" });
    }
  });

  // 2. Get single user profile
  app.get("/api/users/profile", async (req, res) => {
    try {
      const email = ((req.query.email as string) || "").toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ error: "Email query param is required" });
      }

      // Try Supabase first
      try {
        const { data: dbData } = await serverSupabase
          .from("user_profiles")
          .select("*")
          .ilike("email", email)
          .maybeSingle();

        if (dbData) {
          const profile = normalizeProfile({ ...serverProfilesCache[email], ...dbData }, email);
          serverProfilesCache[email] = profile;
          saveServerProfiles(serverProfilesCache);
          return res.json({ success: true, profile });
        }
      } catch (e) {
        // Fallback to cache
      }

      const cached = serverProfilesCache[email];
      if (cached) {
        return res.json({ success: true, profile: normalizeProfile(cached, email) });
      }

      return res.status(404).json({ error: "Profile not found" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get profile" });
    }
  });

  // 3. List all users (For Owner/Agent Dashboard & Cross-device lookup)
  app.get("/api/users/list", async (req, res) => {
    try {
      let combined: Record<string, any> = { ...serverProfilesCache };

      try {
        const { data: dbProfiles } = await serverSupabase.from("user_profiles").select("*");
        if (Array.isArray(dbProfiles)) {
          dbProfiles.forEach((row: any) => {
            const e = (row.email || "").toLowerCase().trim();
            if (e) {
              combined[e] = normalizeProfile({ ...combined[e], ...row }, e);
            }
          });
        }
      } catch (e) {
        // use combined cache
      }

      // Also check user_roles
      try {
        const { data: roles } = await serverSupabase.from("user_roles").select("*");
        if (Array.isArray(roles)) {
          roles.forEach((r: any) => {
            const e = (r.email || "").toLowerCase().trim();
            if (e && combined[e]) {
              const rNorm = r.role?.toLowerCase() === "owner" ? "Owner" : r.role?.toLowerCase() === "agent" ? "Agent" : "Client";
              combined[e].role = rNorm;
            }
          });
        }
      } catch (e) {}

      // Update in-memory and disk cache
      Object.keys(combined).forEach((k) => {
        serverProfilesCache[k] = normalizeProfile(combined[k], k);
      });
      saveServerProfiles(serverProfilesCache);

      return res.json({ success: true, users: Object.values(serverProfilesCache) });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to list users" });
    }
  });

  // 4. SECURE Profile Save / Update Endpoint (Multi-device Cloud Synced)
  app.post("/api/users/save-profile", async (req, res) => {
    try {
      const { requesterEmail, profile } = req.body;
      if (!profile || !profile.email) {
        return res.status(400).json({ error: "Profile and target email are required" });
      }

      const targetEmail = (profile.email || "").toLowerCase().trim();
      const reqEmail = (requesterEmail || (req.headers["x-user-email"] as string) || targetEmail).toLowerCase().trim();

      const existingTarget = serverProfilesCache[targetEmail] || {};
      const isOwner = reqEmail === "orabitsms@gmail.com" || serverProfilesCache[reqEmail]?.role?.toLowerCase() === "owner";

      // Non-owners can only update their own profile
      if (!isOwner && reqEmail !== targetEmail) {
        return res.status(403).json({ error: "Permission Denied: You cannot modify other users' profiles." });
      }

      let updatedProfile: any = {};

      if (isOwner) {
        // Owner has full authority to change roles, balances, rates, status, etc.
        updatedProfile = normalizeProfile({
          ...existingTarget,
          ...profile,
          email: targetEmail,
          balance: profile.balance !== undefined ? Number(profile.balance) : (existingTarget.balance || 0),
          customOtpRate: profile.customOtpRate !== undefined ? Number(profile.customOtpRate) : (profile.rate !== undefined ? Number(profile.rate) : (existingTarget.customOtpRate || 0.006)),
          rate: profile.rate !== undefined ? Number(profile.rate) : (profile.customOtpRate !== undefined ? Number(profile.customOtpRate) : (existingTarget.rate || 0.006)),
          role: profile.role || existingTarget.role || "Client",
          accountStatus: profile.accountStatus || existingTarget.accountStatus || "Active",
          apiEnabled: profile.apiEnabled !== undefined ? !!profile.apiEnabled : (existingTarget.apiEnabled ?? false),
          isOfficial: profile.isOfficial !== undefined ? !!profile.isOfficial : (existingTarget.isOfficial ?? false),
          updatedAt: new Date().toISOString(),
        }, targetEmail);
      } else {
        // Client / Agent: STRIP critical fields to preserve balance & role
        updatedProfile = normalizeProfile({
          ...existingTarget,
          ...profile,
          email: targetEmail,
          balance: existingTarget.balance !== undefined ? existingTarget.balance : (profile.balance || 0),
          role: existingTarget.role || "Client",
          customOtpRate: existingTarget.customOtpRate || existingTarget.rate || 0.006,
          rate: existingTarget.rate || existingTarget.customOtpRate || 0.006,
          accountStatus: existingTarget.accountStatus || "Active",
          apiEnabled: existingTarget.apiEnabled ?? false,
          isOfficial: existingTarget.isOfficial ?? false,
          paymentMethods: profile.paymentMethods !== undefined ? profile.paymentMethods : existingTarget.paymentMethods,
          withdrawHistory: profile.withdrawHistory !== undefined ? profile.withdrawHistory : existingTarget.withdrawHistory,
          lastTargetRange: profile.lastTargetRange !== undefined ? profile.lastTargetRange : existingTarget.lastTargetRange,
          currency: profile.currency || existingTarget.currency || "USD",
          updatedAt: new Date().toISOString(),
        }, targetEmail);
      }

      // Save to server cache & file
      serverProfilesCache[targetEmail] = updatedProfile;
      saveServerProfiles(serverProfilesCache);

      // Async write to Supabase
      const dbPayload = {
        email: targetEmail,
        full_name: updatedProfile.fullName || "",
        first_name: updatedProfile.firstName || "",
        last_name: updatedProfile.lastName || "",
        mobile_number: updatedProfile.mobileNumber || "",
        balance: updatedProfile.balance,
        total_success: updatedProfile.totalSuccess || 0,
        role: updatedProfile.role,
        telegram: updatedProfile.telegram || "",
        country: updatedProfile.country || "Bangladesh",
        city: updatedProfile.city || "Dhaka",
        bio: updatedProfile.bio || "",
        withdraw_pin: updatedProfile.withdrawPin || "",
        account_status: updatedProfile.accountStatus || "Active",
        api_key: updatedProfile.apiKey || "",
        api_enabled: !!updatedProfile.apiEnabled,
        custom_otp_rate: updatedProfile.customOtpRate || 0.006,
        rate: updatedProfile.rate || 0.006,
        referral_email: updatedProfile.referralEmail || updatedProfile.assignedAgent || "",
        assigned_agent: updatedProfile.assignedAgent || updatedProfile.referralEmail || "",
        is_official: !!updatedProfile.isOfficial,
        password: updatedProfile.password || "",
        uid: updatedProfile.uid || "",
        updated_at: new Date().toISOString(),
      };

      try {
        await serverSupabase.from("user_profiles").upsert(dbPayload, { onConflict: "email" });
      } catch (e) {
        console.warn("Notice updating Supabase user_profiles:", e);
      }

      if (isOwner && profile.role) {
        try {
          await serverSupabase.from("user_roles").upsert({ email: targetEmail, role: profile.role.toLowerCase() }, { onConflict: "email" });
        } catch (e) {}
      }

      return res.json({ success: true, profile: updatedProfile });
    } catch (error: any) {
      console.error("Save profile error:", error);
      return res.status(500).json({ error: error.message || "Failed to save profile" });
    }
  });

  // 5. Cross-Device Feeds Sync Endpoints (Numbers & OTPs across all phones)
  app.get("/api/feeds/list", async (req, res) => {
    try {
      const email = ((req.query.email as string) || "").toLowerCase().trim();
      if (!email) {
        return res.status(400).json({ error: "Email query param is required" });
      }

      let combinedFeeds: any[] = serverFeedsCache[email] || [];

      // Try fetching from Supabase user_feed_numbers
      try {
        const { data: dbFeeds } = await serverSupabase
          .from("user_feed_numbers")
          .select("*")
          .eq("user_email", email)
          .order("requested_at", { ascending: false });

        if (Array.isArray(dbFeeds) && dbFeeds.length > 0) {
          const mapById = new Map<string, any>();
          combinedFeeds.forEach((f) => { if (f.id) mapById.set(f.id, f); });
          dbFeeds.forEach((row) => {
            if (row && row.id) {
              const existing = mapById.get(row.id);
              mapById.set(row.id, {
                id: row.id,
                number: row.number,
                status: row.status,
                country: row.country || "Global Pool",
                operator: row.operator || "GSM Network",
                service: row.service || "SMS OTP",
                otpCode: row.otp_code || existing?.otpCode || undefined,
                rawMessage: row.raw_message || existing?.rawMessage || undefined,
                requestedAt: row.requested_at ? Number(row.requested_at) : (existing?.requestedAt || Date.now()),
                timeAgo: row.time_ago || existing?.timeAgo || "Just now",
              });
            }
          });
          combinedFeeds = Array.from(mapById.values());
          serverFeedsCache[email] = combinedFeeds;
          saveServerFeeds(serverFeedsCache);
        }
      } catch (e) {}

      return res.json({ success: true, feeds: combinedFeeds });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to list feeds" });
    }
  });

  app.post("/api/feeds/save", async (req, res) => {
    try {
      const { userEmail, feeds } = req.body;
      const cleanEmail = (userEmail || "").toLowerCase().trim();
      if (!cleanEmail || !Array.isArray(feeds)) {
        return res.status(400).json({ error: "userEmail and feeds array are required" });
      }

      const existingList = serverFeedsCache[cleanEmail] || [];
      const mapById = new Map<string, any>();
      existingList.forEach((f) => { if (f.id) mapById.set(f.id, f); });
      feeds.forEach((f) => {
        if (f && f.id) {
          const prev = mapById.get(f.id);
          // Preserve SUCCESS status over pending
          if (prev && (prev.status === "SUCCESS" || prev.status === "MULTI SUCCESS") && f.status === "PENDING") {
            mapById.set(f.id, { ...f, status: prev.status, otpCode: prev.otpCode || f.otpCode, rawMessage: prev.rawMessage || f.rawMessage });
          } else {
            mapById.set(f.id, f);
          }
        }
      });

      const updated = Array.from(mapById.values());
      serverFeedsCache[cleanEmail] = updated;
      saveServerFeeds(serverFeedsCache);

      // Async save to Supabase
      try {
        const rows = feeds.slice(0, 50).map((f) => ({
          id: f.id,
          user_email: cleanEmail,
          number: f.number,
          status: f.status,
          country: f.country,
          operator: f.operator,
          service: f.service,
          otp_code: f.otpCode || null,
          raw_message: f.rawMessage || null,
          requested_at: f.requestedAt || Date.now(),
          updated_at: new Date().toISOString(),
        }));
        await serverSupabase.from("user_feed_numbers").upsert(rows, { onConflict: "id" });
      } catch (e) {}

      return res.json({ success: true, count: updated.length });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to save feeds" });
    }
  });

  // 6. Cross-Device Daily Stats & Analytics Endpoints
  app.get("/api/stats/daily", async (req, res) => {
    try {
      const email = ((req.query.email as string) || "").toLowerCase().trim();
      let stats = [...serverStatsCache];

      try {
        let query = serverSupabase.from("daily_stats").select("*").order("date", { ascending: false });
        if (email) query = query.eq("user_email", email);
        const { data: dbStats } = await query;
        if (Array.isArray(dbStats) && dbStats.length > 0) {
          const mapByKey = new Map<string, any>();
          stats.forEach((s) => { mapByKey.set(`${s.date}_${s.user_email}`, s); });
          dbStats.forEach((s) => {
            const k = `${s.date}_${(s.user_email || "").toLowerCase().trim()}`;
            mapByKey.set(k, {
              date: typeof s.date === "string" ? s.date.split("T")[0] : s.date,
              user_email: (s.user_email || "").toLowerCase().trim(),
              total_allocations: Number(s.total_allocations || 0),
              total_otps: Number(s.total_otps || 0),
              total_revenue: Number(s.total_revenue || 0),
            });
          });
          stats = Array.from(mapByKey.values());
          serverStatsCache = stats;
          saveServerStats(serverStatsCache);
        }
      } catch (e) {}

      if (email) {
        stats = stats.filter((s) => s.user_email === email);
      }

      return res.json({ success: true, stats });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get stats" });
    }
  });

  app.post("/api/stats/record", async (req, res) => {
    try {
      const { userEmail, date, isAllocation, isSuccess, revenueAmount } = req.body;
      const cleanEmail = (userEmail || "").toLowerCase().trim();
      const dateStr = date || new Date().toISOString().slice(0, 10);

      const idx = serverStatsCache.findIndex((s) => s.user_email === cleanEmail && s.date === dateStr);
      if (idx >= 0) {
        serverStatsCache[idx].total_allocations += isAllocation ? 1 : 0;
        serverStatsCache[idx].total_otps += isSuccess ? 1 : 0;
        serverStatsCache[idx].total_revenue += isSuccess ? (revenueAmount || 0.006) : 0;
      } else {
        serverStatsCache.push({
          date: dateStr,
          user_email: cleanEmail,
          total_allocations: isAllocation ? 1 : 0,
          total_otps: isSuccess ? 1 : 0,
          total_revenue: isSuccess ? (revenueAmount || 0.006) : 0,
        });
      }

      saveServerStats(serverStatsCache);

      // Async update Supabase
      try {
        await serverSupabase.from("daily_stats").upsert({
          date: dateStr,
          user_email: cleanEmail,
          total_allocations: serverStatsCache[idx >= 0 ? idx : serverStatsCache.length - 1].total_allocations,
          total_otps: serverStatsCache[idx >= 0 ? idx : serverStatsCache.length - 1].total_otps,
          total_revenue: serverStatsCache[idx >= 0 ? idx : serverStatsCache.length - 1].total_revenue,
          updated_at: new Date().toISOString(),
        }, { onConflict: "date,user_email" });
      } catch (e) {}

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to record stat" });
    }
  });

  // 7. Secure Balance Adjustment (OTP earnings or Owner Topup)
  app.post("/api/users/update-balance", async (req, res) => {
    try {
      const { requesterEmail, targetEmail, amount, reason } = req.body;
      const tEmail = (targetEmail || "").toLowerCase().trim();
      const rEmail = (requesterEmail || "").toLowerCase().trim();

      if (!tEmail || amount === undefined) {
        return res.status(400).json({ error: "targetEmail and amount are required" });
      }

      const isOwner = rEmail === "orabitsms@gmail.com" || serverProfilesCache[rEmail]?.role?.toLowerCase() === "owner";
      const isInternal = req.headers["x-internal-secret"] === "orabit-internal-otp-system";

      if (!isOwner && !isInternal) {
        return res.status(403).json({ error: "Unauthorized balance modification request" });
      }

      const existing = serverProfilesCache[tEmail] || { email: tEmail, balance: 0 };
      const newBal = Math.max(0, Number((Number(existing.balance || 0) + Number(amount)).toFixed(4)));

      existing.balance = newBal;
      serverProfilesCache[tEmail] = existing;
      saveServerProfiles(serverProfilesCache);

      try {
        await serverSupabase.from("user_profiles").update({ balance: newBal, updated_at: new Date().toISOString() }).ilike("email", tEmail);
      } catch (e) {}

      return res.json({ success: true, newBalance: newBal, message: `Balance updated for ${tEmail}` });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to update balance" });
    }
  });

  // Stex SMS API Proxy Endpoints
  app.post("/api/stex/getnum", async (req, res) => {
    try {
      const apiKey = req.body.apiKey || req.headers.mauthapi || process.env.STEX_API_KEY || "M4DDE8HGFJ9";
      const query = req.body.query || req.body.rid || "26134";

      const response = await fetch("https://api.2oo9.cloud/MXS47FLFX0U/tness/@public/api/getnum", {
        method: "POST",
        headers: {
          "mauthapi": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rid: query }),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Stex getnum error:", error);
      return res.status(500).json({
        meta: { code: 500, status: "error" },
        message: error.message || "Failed to connect to StexSMS getnum service",
      });
    }
  });

  app.get("/api/stex/success-otp", async (req, res) => {
    try {
      const apiKey = (req.query.apiKey as string) || (req.headers.mauthapi as string) || process.env.STEX_API_KEY || "M4DDE8HGFJ9";

      const response = await fetch("https://api.2oo9.cloud/MXS47FLFX0U/tness/@public/api/success-otp", {
        method: "GET",
        headers: {
          "mauthapi": apiKey,
        },
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Stex success-otp error:", error);
      return res.status(500).json({
        meta: { code: 500, status: "error" },
        message: error.message || "Failed to connect to StexSMS success-otp service",
      });
    }
  });

  app.get("/api/stex/liveaccess", async (req, res) => {
    try {
      const apiKey = (req.query.apiKey as string) || (req.headers.mauthapi as string) || process.env.STEX_API_KEY || "M4DDE8HGFJ9";

      const response = await fetch("https://api.2oo9.cloud/MXS47FLFX0U/tness/@public/api/liveaccess", {
        method: "GET",
        headers: {
          "mauthapi": apiKey,
        },
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Stex liveaccess error:", error);
      return res.status(500).json({
        meta: { code: 500, status: "error" },
        message: error.message || "Failed to connect to StexSMS liveaccess service",
      });
    }
  });

  app.get("/api/stex/console", async (req, res) => {
    try {
      const apiKey = (req.query.apiKey as string) || (req.headers.mauthapi as string) || process.env.STEX_API_KEY || "M4DDE8HGFJ9";

      const response = await fetch("https://api.2oo9.cloud/MXS47FLFX0U/tness/@public/api/console", {
        method: "GET",
        headers: {
          "mauthapi": apiKey,
        },
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Stex console error:", error);
      return res.status(500).json({
        meta: { code: 500, status: "error" },
        message: error.message || "Failed to connect to StexSMS console service",
      });
    }
  });

  // AI Website Generator Endpoint
  app.post("/api/gemini/generate-site", async (req, res) => {
    try {
      const { domainName, brandName, niche, language, targetAudience, tone } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.status(400).json({
          error: "GEMINI_API_KEY available check failed",
          message: "No Gemini API Key provided. Default template loaded.",
        });
      }

      const isBengali = language === "bn" || language === "bilingual";

      const prompt = `
You are a world-class web designer, UI copywriter, and brand strategist.
Create a complete website configuration for the domain: "${domainName || "mybrand.com"}"
Brand Name: "${brandName || domainName || "My Brand"}"
Niche/Category: "${niche || "Business"}"
Tone: "${tone || "Professional, Modern, Friendly"}"
Language: ${isBengali ? "Bengali (বাংলা) with clean professional Bengali typography and copy. You can also include English subtitled terms where appropriate." : "English"}

Return ONLY a valid JSON object matching this schema:
{
  "tagline": "A catchy, powerful slogan for the brand",
  "metaTitle": "SEO Page Title",
  "metaDescription": "SEO meta description under 160 characters",
  "theme": {
    "primaryColor": "#2563eb",
    "accentColor": "#f59e0b",
    "bgColor": "#ffffff",
    "textColor": "#0f172a",
    "fontStyle": "sans"
  },
  "hero": {
    "badge": "Launching Soon / #1 Service Provider",
    "title": "Main Hero Headline",
    "subtitle": "Clear value proposition and description of what this domain offers",
    "ctaPrimary": "Get Started",
    "ctaSecondary": "Learn More",
    "heroImageQuery": "relevant keywords for Unsplash background"
  },
  "about": {
    "title": "About Us",
    "story": "Compelling story about why this brand exists and how it helps customers.",
    "stats": [
      { "label": "Happy Clients", "value": "1,000+" },
      { "label": "Projects Completed", "value": "250+" },
      { "label": "Satisfaction Rate", "value": "99%" },
      { "label": "Years Experience", "value": "5+" }
    ]
  },
  "features": [
    { "title": "Feature 1", "description": "Description of feature 1", "icon": "Zap" },
    { "title": "Feature 2", "description": "Description of feature 2", "icon": "ShieldCheck" },
    { "title": "Feature 3", "description": "Description of feature 3", "icon": "Sparkles" },
    { "title": "Feature 4", "description": "Description of feature 4", "icon": "Rocket" }
  ],
  "services": [
    { "title": "Service 1", "description": "Details of service 1", "price": "$99" },
    { "title": "Service 2", "description": "Details of service 2", "price": "$199" },
    { "title": "Service 3", "description": "Details of service 3", "price": "$299" }
  ],
  "testimonials": [
    { "name": "Abdur Rahman", "role": "CEO, Tech Ventures", "content": "Working with this platform transformed our online presence!", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { "name": "Sarah Ahmed", "role": "Founder, Style Studio", "content": "Super high quality service and impressive results.", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" }
  ],
  "pricing": [
    { "name": "Starter", "price": "$49", "period": "/month", "description": "Best for small projects", "features": ["Core Features", "Domain Support", "24/7 Support"], "popular": false },
    { "name": "Pro Business", "price": "$99", "period": "/month", "description": "For growing businesses", "features": ["All Starter Features", "Priority Server", "Custom Domain", "AI Assistant"], "popular": true }
  ],
  "faq": [
    { "question": "How do I contact support?", "answer": "You can reach us anytime via our contact form or support email." },
    { "question": "What is the domain launch timeline?", "answer": "Our full services go live within 24-48 hours of setup." }
  ],
  "contact": {
    "title": "Get in Touch",
    "subtitle": "Have questions about our domain services? Reach out to us today.",
    "email": "contact@${domainName || "mybrand.com"}",
    "phone": "+880 1700-000000",
    "address": "Dhaka, Bangladesh"
  }
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const jsonText = response.text || "{}";
      const siteConfig = JSON.parse(jsonText);
      res.json(siteConfig);
    } catch (error: any) {
      console.error("Gemini site generation error:", error);
      res.status(500).json({
        error: "Generation Failed",
        message: error.message || "Failed to generate site content.",
      });
    }
  });

  // AI Copywriting Helper for specific sections
  app.post("/api/gemini/refine-section", async (req, res) => {
    try {
      const { section, currentContent, userPrompt, domainName, language } = req.body;
      const ai = getAI();

      if (!ai) {
        return res.status(400).json({ error: "No Gemini API key available" });
      }

      const prompt = `
You are an expert website copywriter.
Refine and write updated copy for section "${section}" for the website of domain "${domainName}".
Language: ${language === "bn" ? "Bengali" : "English"}
Current Content: ${JSON.stringify(currentContent)}
User Instruction: "${userPrompt}"

Return JSON matching the structure of currentContent with improved wording, high conversion appeal, and clear formatting.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const jsonText = response.text || "{}";
      res.json(JSON.parse(jsonText));
    } catch (error: any) {
      console.error("Gemini refine section error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
