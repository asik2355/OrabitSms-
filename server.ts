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

const serverProfilesCache: Record<string, any> = loadServerProfiles();

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
  // SECURE USER MANAGEMENT & BACKEND PROXY API (Option 2)
  // Server-authoritative: Prevents balance/role tampering by clients
  // -------------------------------------------------------------

  // 1. Get single user profile
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
          const profile = {
            ...dbData,
            fullName: dbData.full_name || dbData.fullName,
            firstName: dbData.first_name || dbData.firstName,
            lastName: dbData.last_name || dbData.lastName,
            mobileNumber: dbData.mobile_number || dbData.mobileNumber,
            customOtpRate: dbData.custom_otp_rate !== undefined ? Number(dbData.custom_otp_rate) : Number(dbData.rate || 0.006),
            rate: dbData.rate !== undefined ? Number(dbData.rate) : Number(dbData.custom_otp_rate || 0.006),
            accountStatus: dbData.account_status || "Active",
            apiEnabled: !!dbData.api_enabled,
            withdrawPin: dbData.withdraw_pin || "",
            assignedAgent: dbData.assigned_agent || dbData.referral_email,
            isOfficial: !!dbData.is_official,
          };
          serverProfilesCache[email] = { ...serverProfilesCache[email], ...profile };
          saveServerProfiles(serverProfilesCache);
          return res.json({ success: true, profile });
        }
      } catch (e) {
        // Fallback to cache
      }

      const cached = serverProfilesCache[email];
      if (cached) {
        return res.json({ success: true, profile: cached });
      }

      return res.status(404).json({ error: "Profile not found" });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get profile" });
    }
  });

  // 2. List all users (For Owner/Agent Dashboard)
  app.get("/api/users/list", async (req, res) => {
    try {
      let combined: Record<string, any> = { ...serverProfilesCache };

      try {
        const { data: dbProfiles } = await serverSupabase.from("user_profiles").select("*");
        if (Array.isArray(dbProfiles)) {
          dbProfiles.forEach((row: any) => {
            const e = (row.email || "").toLowerCase().trim();
            if (e) {
              combined[e] = {
                ...combined[e],
                ...row,
                fullName: row.full_name || row.fullName || combined[e]?.fullName,
                firstName: row.first_name || row.firstName || combined[e]?.firstName,
                lastName: row.last_name || row.lastName || combined[e]?.lastName,
                mobileNumber: row.mobile_number || row.mobileNumber || combined[e]?.mobileNumber,
                customOtpRate: row.custom_otp_rate !== undefined ? Number(row.custom_otp_rate) : (row.rate !== undefined ? Number(row.rate) : 0.006),
                rate: row.rate !== undefined ? Number(row.rate) : 0.006,
                accountStatus: row.account_status || combined[e]?.accountStatus || "Active",
                apiEnabled: row.api_enabled !== undefined ? !!row.api_enabled : !!combined[e]?.apiEnabled,
                withdrawPin: row.withdraw_pin || combined[e]?.withdrawPin || "",
                assignedAgent: row.assigned_agent || row.referral_email || combined[e]?.assignedAgent,
                isOfficial: row.is_official !== undefined ? !!row.is_official : !!combined[e]?.isOfficial,
              };
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
              combined[e].role = r.role;
            }
          });
        }
      } catch (e) {}

      return res.json({ success: true, users: Object.values(combined) });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to list users" });
    }
  });

  // 3. SECURE Profile Save / Update Endpoint
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

      // SECURITY ENFORCEMENT:
      // Non-owners can ONLY update their own personal info!
      if (!isOwner && reqEmail !== targetEmail) {
        return res.status(403).json({ error: "Permission Denied: You cannot modify other users' profiles." });
      }

      let updatedProfile: any = {};

      if (isOwner) {
        // Owner has full authority to change roles, balances, rates, status, etc.
        updatedProfile = {
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
        };
      } else {
        // Client / Agent: STRIP all critical fields! Preserves server balance & role!
        updatedProfile = {
          ...existingTarget,
          email: targetEmail,
          // Retain server authoritative fields (Client cannot modify their own balance or role!)
          balance: existingTarget.balance !== undefined ? existingTarget.balance : 0,
          role: existingTarget.role || "Client",
          customOtpRate: existingTarget.customOtpRate || existingTarget.rate || 0.006,
          rate: existingTarget.rate || existingTarget.customOtpRate || 0.006,
          accountStatus: existingTarget.accountStatus || "Active",
          apiEnabled: existingTarget.apiEnabled ?? false,
          isOfficial: existingTarget.isOfficial ?? false,

          // Allowed personal updates:
          fullName: profile.fullName !== undefined ? profile.fullName : existingTarget.fullName,
          firstName: profile.firstName !== undefined ? profile.firstName : existingTarget.firstName,
          lastName: profile.lastName !== undefined ? profile.lastName : existingTarget.lastName,
          mobileNumber: profile.mobileNumber !== undefined ? profile.mobileNumber : existingTarget.mobileNumber,
          telegram: profile.telegram !== undefined ? profile.telegram : existingTarget.telegram,
          country: profile.country !== undefined ? profile.country : existingTarget.country,
          city: profile.city !== undefined ? profile.city : existingTarget.city,
          bio: profile.bio !== undefined ? profile.bio : existingTarget.bio,
          withdrawPin: profile.withdrawPin !== undefined ? profile.withdrawPin : existingTarget.withdrawPin,
          password: profile.password !== undefined ? profile.password : existingTarget.password,
          paymentMethods: profile.paymentMethods !== undefined ? profile.paymentMethods : existingTarget.paymentMethods,
          updatedAt: new Date().toISOString(),
        };
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

  // 4. Secure Balance Adjustment (OTP earnings or Owner Topup)
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
