import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  requestStexNumber,
  fetchStexOtps,
  fetchStexConsole,
  extractOtpFromMessage,
  getCountryAndOperatorFromRange,
  maskMessageOtp,
  DEFAULT_STEX_API_KEY,
} from "./lib/stexApi";
import { OrabitAuthScreen, UserProfile } from "./components/OrabitAuthScreen";
import { useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { supabase } from "./lib/supabase";
import { getUserRoleFromSupabase } from "./lib/userRoles";
import {
  fetchUserFeedNumbersFromSupabase,
  saveFeedNumberToSupabase,
  bulkSyncFeedNumbersToSupabase,
} from "./lib/supabaseFeed";
import {
  incrementUserSuccessAndBalanceInSupabase,
  saveUserProfileToSupabase,
} from "./lib/userProfiles";
import { safeLocalStorageSet, safeLocalStorageGet } from "./lib/storageUtils";
import { TimeAgoBadge, formatTimeAgo } from "./components/TimeAgoBadge";
import { UserProfileView } from "./components/UserProfileView";
import { OrabitPaymentWallet } from "./components/OrabitPaymentWallet";
import { OrabitApiDoc } from "./components/OrabitApiDoc";
import { OrabitLogo } from "./components/OrabitLogo";
import { ServiceLogo, PRELOAD_SERVICE_LOGOS } from "./components/ServiceLogo";
import { LogoutPage } from "./components/LogoutPage";
import { SummaryDashboard } from "./components/SummaryDashboard";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { OwnerSummary } from "./components/OwnerSummary";
import { AgentDashboard } from "./components/AgentDashboard";
import {
  Search,
  RefreshCw,
  Clock,
  History,
  Send,
  Bell,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  PhoneCall,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Globe,
  DollarSign,
  Wallet,
  MessageSquare,
  Sparkles,
  Code2,
  Lock,
  Terminal,
  Play,
  Users,
  UserPlus,
  Filter,
  Sliders,
  Menu,
  X,
  User,
  ExternalLink,
  ChevronDown,
  Layers,
  Server,
  Activity,
  CreditCard,
  Settings,
  LogOut,
  LayoutGrid,
  Hash,
  Sun,
  Moon,
  Crown,
  Ghost,
  UserCheck,
  FileSpreadsheet,
  KeyRound,
  Percent,
  Coins,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SmsMessage {
  id: string;
  time: string;
  operator: string;
  country: string;
  countryIso: string;
  service: string;
  serviceColor: string;
  number: string;
  otpCode: string;
  rawMessage: string;
  timestamp?: number;
}

interface FeedNumber {
  id: string;
  number: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  country: string;
  operator: string;
  timeAgo: string;
  service: string;
  otpCode?: string;
  rawMessage?: string;
  requestedAt?: number;
}

function extractOtpFromText(rawText: string): string {
  if (!rawText) return "318215";

  // 1. Spaced 6-digit code e.g. "082 945" or "212 123"
  const spacedSix = rawText.match(/\b\d{3}\s\d{3}\b/);
  if (spacedSix) return spacedSix[0].replace(/\s/g, "");

  // 2. Hyphenated 6-digit code e.g. "212-123" or "082-945"
  const hyphenated = rawText.match(/\b\d{3}-\d{3}\b/);
  if (hyphenated) return hyphenated[0].replace("-", "");

  // 3. Any 3-4 digits + space/hyphen + 3-4 digits e.g. "082 945", "1234 567"
  const spacedDigits = rawText.match(/\b\d{3,4}[\s-]\d{3,4}\b/);
  if (spacedDigits) return spacedDigits[0].replace(/[\s-]/g, "");

  // 4. Code following keywords e.g. "code: 082 945", "is 082 945", "Instagram code: 082 945"
  const keywordMatch = rawText.match(/(?:code|otp|is|pin|verificacion)[\s:-]+(\d{3}[\s-]?\d{3}|\d{4,8})/i);
  if (keywordMatch && keywordMatch[1]) {
    return keywordMatch[1].replace(/[\s-]/g, "");
  }

  // 5. Code preceding keywords e.g. "082 945 is your Instagram code"
  const codeBeforeWords = rawText.match(/(\d{3}[\s-]?\d{3}|\d{4,8})[\s:-]+is your/i);
  if (codeBeforeWords && codeBeforeWords[1]) {
    return codeBeforeWords[1].replace(/[\s-]/g, "");
  }

  // 6. Prefixed code format e.g. "G-123456" or "FB-78291"
  const prefixedCode = rawText.match(/\b[A-Z]{1,3}-\d{4,8}\b/i);
  if (prefixedCode) return prefixedCode[0];

  // 7. Any 4 to 8 digit numbers in the text e.g. "318215", "782910"
  const digits = rawText.match(/\b\d{4,8}\b/);
  if (digits) return digits[0];

  // 8. Any spaced 3+3 digits
  const anySpaced = rawText.match(/\d{3}\s+\d{3}/);
  if (anySpaced) return anySpaced[0].replace(/\s+/g, "");

  // 9. Alphanumeric code (like ZBYKMCDOL)
  const alphaMatch = rawText.match(/\b[A-Z0-9]{5,10}\b/);
  if (alphaMatch) return alphaMatch[0];

  return "318215";
}

function detectServiceAndColor(rawMessage: string, sidFallback?: string) {
  const msgUpper = (rawMessage || "").toUpperCase();

  if (
    msgUpper.includes("INSTAGRAM") ||
    msgUpper.includes("INSTA") ||
    msgUpper.includes("#IG") ||
    msgUpper.includes("IG-")
  ) {
    return {
      service: "INSTAGRAM",
      color: "bg-pink-950/80 text-pink-400 border-pink-500/30",
    };
  }
  if (
    msgUpper.includes("WHATSAPP") ||
    msgUpper.includes("WA-") ||
    msgUpper.includes("WHATSAPP CODE")
  ) {
    return {
      service: "WHATSAPP",
      color: "bg-emerald-950/80 text-emerald-400 border-emerald-500/30",
    };
  }
  if (
    msgUpper.includes("FACEBOOK") ||
    msgUpper.includes("FB-") ||
    msgUpper.includes("FACEBOOK CODE") ||
    msgUpper.includes("FB CODE")
  ) {
    return {
      service: "FACEBOOK",
      color: "bg-blue-950/80 text-blue-400 border-blue-500/30",
    };
  }
  if (msgUpper.includes("TELEGRAM") || msgUpper.includes("TG-")) {
    return {
      service: "TELEGRAM",
      color: "bg-sky-950/80 text-sky-400 border-sky-500/30",
    };
  }
  if (msgUpper.includes("IMO")) {
    return {
      service: "IMO",
      color: "bg-cyan-950/80 text-cyan-400 border-cyan-500/30",
    };
  }
  if (msgUpper.includes("DISCORD")) {
    return {
      service: "DISCORD",
      color: "bg-indigo-950/80 text-indigo-400 border-indigo-500/30",
    };
  }
  if (msgUpper.includes("TIKTOK")) {
    return {
      service: "TIKTOK",
      color: "bg-rose-950/80 text-rose-400 border-rose-500/30",
    };
  }
  if (msgUpper.includes("EBAY")) {
    return {
      service: "EBAY",
      color: "bg-yellow-950/80 text-yellow-400 border-yellow-500/30",
    };
  }
  if (msgUpper.includes("LINKEDIN")) {
    return {
      service: "LINKEDIN",
      color: "bg-blue-950/80 text-blue-400 border-blue-500/30",
    };
  }
  if (msgUpper.includes("TWITTER") || msgUpper.includes("X.COM")) {
    return {
      service: "TWITTER",
      color: "bg-sky-950/80 text-sky-400 border-sky-500/30",
    };
  }
  if (msgUpper.includes("GOOGLE") || msgUpper.includes("G-")) {
    return {
      service: "GOOGLE",
      color: "bg-amber-950/80 text-amber-400 border-amber-500/30",
    };
  }
  if (msgUpper.includes("NETFLIX")) {
    return {
      service: "NETFLIX",
      color: "bg-red-950/80 text-red-400 border-red-500/30",
    };
  }
  if (msgUpper.includes("CLOUDOTP")) {
    return {
      service: "CLOUDOTP",
      color: "bg-purple-950/80 text-purple-400 border-purple-500/30",
    };
  }
  if (msgUpper.includes("BIGO")) {
    return {
      service: "BIGO",
      color: "bg-teal-950/80 text-teal-400 border-teal-500/30",
    };
  }

  // Fallback to CLI / API sid if no keyword found in message body
  const sidUpper = (sidFallback || "").trim().toUpperCase();
  if (sidUpper && sidUpper !== "SERVICE" && sidUpper !== "UNKNOWN" && sidUpper !== "SMS OTP") {
    let color = "bg-blue-950/80 text-blue-400 border-blue-500/30";
    if (sidUpper.includes("WHATSAPP")) color = "bg-emerald-950/80 text-emerald-400 border-emerald-500/30";
    else if (sidUpper.includes("INSTAGRAM") || sidUpper.includes("INSTA")) color = "bg-pink-950/80 text-pink-400 border-pink-500/30";
    else if (sidUpper.includes("TELEGRAM")) color = "bg-sky-950/80 text-sky-400 border-sky-500/30";
    else if (sidUpper.includes("IMO")) color = "bg-cyan-950/80 text-cyan-400 border-cyan-500/30";
    else if (sidUpper.includes("FACEBOOK")) color = "bg-blue-950/80 text-blue-400 border-blue-500/30";
    else if (sidUpper.includes("GOOGLE")) color = "bg-amber-950/80 text-amber-400 border-amber-500/30";
    else if (sidUpper.includes("DISCORD")) color = "bg-indigo-950/80 text-indigo-400 border-indigo-500/30";
    else if (sidUpper.includes("CLOUDOTP")) color = "bg-purple-950/80 text-purple-400 border-purple-500/30";

    return { service: sidUpper, color };
  }

  return {
    service: "SMS OTP",
    color: "bg-purple-950/80 text-purple-400 border-purple-500/30",
  };
}

const INITIAL_TRAFFIC_DATA = [
  { time: "00:00", volume: 0 },
  { time: "02:00", volume: 0.1 },
  { time: "04:00", volume: 1.0 },
  { time: "06:00", volume: 0.1 },
  { time: "07:00", volume: 2.0 },
  { time: "08:00", volume: 1.0 },
  { time: "09:00", volume: 0.1 },
  { time: "10:00", volume: 2.0 },
  { time: "12:00", volume: 0.1 },
  { time: "14:00", volume: 0.2 },
  { time: "16:00", volume: 0.1 },
  { time: "18:00", volume: 0.3 },
  { time: "20:00", volume: 0 },
  { time: "22:00", volume: 0.1 },
];

function getBD4AMWindowStart() {
  const now = new Date();
  const bdNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const bdHours = bdNow.getUTCHours();
  const windowStartBD = new Date(bdNow);
  if (bdHours < 4) {
    windowStartBD.setUTCDate(windowStartBD.getUTCDate() - 1);
  }
  windowStartBD.setUTCHours(4, 0, 0, 0);
  return windowStartBD.getTime() - 6 * 60 * 60 * 1000;
}

const GLOBAL_TRENDING = [
  { id: 1, name: "FACEBOOK", color: "#3b82f6", icon: "💬" },
  { id: 2, name: "WHATSAPP", color: "#22c55e", icon: "🟢" },
  { id: 3, name: "TELEGRAM", color: "#38bdf8", icon: "✈️" },
  { id: 4, name: "INSTAGRAM", color: "#e1306c", icon: "📷" },
  { id: 5, name: "IMO", color: "#94a3b8", icon: "🛡️" },
  { id: 6, name: "AUTHMSG", color: "#a855f7", icon: "🔐" },
  { id: 7, name: "CLOUDOTP", color: "#ec4899", icon: "☁️" },
  { id: 8, name: "DISCORD", color: "#6366f1", icon: "🎮" },
  { id: 9, name: "BIGO", color: "#38bdf8", icon: "📹" },
  { id: 10, name: "FAIRPARI", color: "#f59e0b", icon: "🎲" },
];

const INITIAL_MESSAGES: SmsMessage[] = [];

const INITIAL_FEEDS: FeedNumber[] = [];

export default function App() {
  const { userProfile, setUserProfile, signOut, login, validateServerSession } = useAuth();
  const [domainName, setDomainName] = useState("orabitsms.site");

  // Account-scoped feedNumbers key
  const currentUserEmail = userProfile?.email ? userProfile.email.toLowerCase().trim() : "";
  const userFeedStorageKey = currentUserEmail ? `orabit_feed_numbers_${currentUserEmail}` : "orabit_feed_numbers_guest";

  const isOwner = userProfile?.role?.toLowerCase() === "owner" || userProfile?.email?.toLowerCase().trim() === "orabitsms@gmail.com";
  const isAgent = userProfile?.role?.toLowerCase() === "agent";

  // Automatically sync/check user role from Supabase user_roles table
  useEffect(() => {
    if (!userProfile?.email) return;
    let isMounted = true;
    getUserRoleFromSupabase(userProfile.email).then((fetchedRole) => {
      if (isMounted && fetchedRole) {
        let normalizedRole = "Client";
        if (fetchedRole === "owner") normalizedRole = "Owner";
        else if (fetchedRole === "agent") normalizedRole = "Agent";

        if (normalizedRole !== userProfile.role) {
          setUserProfile((prev) => (prev ? { ...prev, role: normalizedRole } : null));
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userProfile?.email]);

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "console"
    | "getnum"
    | "summary"
    | "api"
    | "domain"
    | "profile"
    | "payment"
    | "logout"
    | "owner_dashboard"
    | "owner_summary"
    | "owner_agent_mgmt"
    | "owner_user_mgmt"
    | "owner_panel_mgmt"
    | "owner_number_file"
    | "owner_otp_mgmt"
    | "owner_rate_mgmt"
    | "owner_payment_mgmt"
    | "agent_dashboard"
    | "agent_summary"
  >("dashboard");
  // Auto-redirect Owner / Agent away from Client dashboard to their respective role dashboard
  useEffect(() => {
    if (!userProfile?.email) return;
    if (activeTab === "dashboard") {
      if (isOwner) {
        setActiveTab("owner_dashboard");
      } else if (isAgent) {
        setActiveTab("agent_dashboard");
      }
    }
  }, [userProfile?.email, userProfile?.role, isOwner, isAgent, activeTab]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<SmsMessage[]>(INITIAL_MESSAGES);
  const [all24hHits, setAll24hHits] = useState<SmsMessage[]>(() => {
    try {
      const bdStart = getBD4AMWindowStart();
      const saved = safeLocalStorageGet("orabit_24h_all_hits_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.windowStart === bdStart && Array.isArray(parsed.hits) && parsed.hits.length > 0) {
          return parsed.hits;
        }
      }
    } catch (e) {
      // Silent catch
    }
    return INITIAL_MESSAGES;
  });

  useEffect(() => {
    try {
      const bdStart = getBD4AMWindowStart();
      const trimmedHits = Array.isArray(all24hHits) ? all24hHits.slice(0, 100) : [];
      const payload = JSON.stringify({ windowStart: bdStart, hits: trimmedHits });
      safeLocalStorageSet("orabit_24h_all_hits_v1", payload);
    } catch (e) {
      // Silent catch
    }
  }, [all24hHits]);
  const [feedNumbers, setFeedNumbers] = useState<FeedNumber[]>([]);
  const [feedCurrentPage, setFeedCurrentPage] = useState<number>(1);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState<boolean>(false);

  // Fetch feed numbers directly from Supabase database
  const refreshFeedFromDatabase = async (silent = false) => {
    if (!currentUserEmail) return;
    if (!silent) setIsRefreshingFeed(true);
    try {
      const dbFeeds = await fetchUserFeedNumbersFromSupabase(currentUserEmail);
      if (Array.isArray(dbFeeds)) {
        setFeedNumbers(dbFeeds);
      }
    } catch (e) {
      console.error("Error refreshing feed numbers from database:", e);
    } finally {
      if (!silent) setIsRefreshingFeed(false);
    }
  };

  // Sync feed numbers when logged in account changes & set up background sync for multi-device support
  useEffect(() => {
    if (!currentUserEmail) {
      setFeedNumbers([]);
      return;
    }

    refreshFeedFromDatabase(false);

    // Auto re-fetch every 8 seconds to reflect numbers generated on other devices
    const syncInterval = setInterval(() => {
      refreshFeedFromDatabase(true);
    }, 8000);

    return () => clearInterval(syncInterval);
  }, [currentUserEmail]);

  // Preload all service logos and branding images on app start
  useEffect(() => {
    PRELOAD_SERVICE_LOGOS.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState<"ALL" | "SUCCESS" | "PENDING" | "FAILED">("ALL");
  const [autoSyncSeconds, setAutoSyncSeconds] = useState(2);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Tweaks & Customization States
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [accentColor, setAccentColor] = useState("#2EE59D");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [sidebarMode, setSidebarMode] = useState<"expanded" | "collapsed">("expanded");
  const [hideNumbers, setHideNumbers] = useState(false);
  const [alreadyHitRange, setAlreadyHitRange] = useState(true);
  const [fontFamily, setFontFamily] = useState("Plus Jakarta Sans");

  // Target Range Provisioning Form
  const [targetRange, setTargetRange] = useState<string>(() => {
    try {
      return localStorage.getItem("orabit_last_target_range") || "";
    } catch (e) {
      return "";
    }
  });
  const [isNational, setIsNational] = useState(false);
  const [noPlus, setNoPlus] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState<string | null>(null);

  // Persist targetRange to localStorage
  useEffect(() => {
    try {
      if (targetRange) {
        localStorage.setItem("orabit_last_target_range", targetRange);
      }
    } catch (e) {
      console.error("Failed to save targetRange:", e);
    }
  }, [targetRange]);

  // API Tester & Key
  const [apiKey, setApiKey] = useState("");

  // Currency preference state (Default: USD)
  const [currency, setCurrency] = useState<"BDT" | "USD">( () => {
    try {
      const saved = localStorage.getItem("orabit_currency");
      if (saved === "BDT" || saved === "USD") return saved;
    } catch (e) {
      console.error(e);
    }
    return "USD";
  });
  const usdExchangeRate = 100; // Fixed rate: 1 USD = 100 BDT
  const [currencyModalOpen, setCurrencyModalOpen] = useState<boolean>(false);

  const getServiceRateBDT = (serviceName: string): number => {
    const norm = (serviceName || "").toUpperCase().trim();
    if (
      norm.includes("WHATSAPP") ||
      norm === "WA" ||
      norm.includes("TELEGRAM") ||
      norm === "TG"
    ) {
      return 0;
    }
    return 0.60; // 60 poisha = ৳0.60 BDT
  };

  const { todaySuccessMessages, yesterdaySuccessMessages, userSuccessMessages } = React.useMemo(() => {
    const nowMs = Date.now();
    const getBDStr = (ms: number) => {
      const d = new Date(ms + 6 * 60 * 60 * 1000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };
    const todayStr = getBDStr(nowMs);
    const yesterdayStr = getBDStr(nowMs - 86400000);

    const allSuccess: FeedNumber[] = [];
    const today: FeedNumber[] = [];
    const yesterday: FeedNumber[] = [];

    feedNumbers.forEach((f) => {
      const isSuccess = f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || f.status === "success";
      if (!isSuccess) return;

      allSuccess.push(f);

      let ts = f.requestedAt;
      if (!ts && f.id && f.id.startsWith("feed-")) {
        const parsed = Number(f.id.replace("feed-", ""));
        if (!isNaN(parsed) && parsed > 1000000000000) ts = parsed;
      }

      let dateKey = ts ? getBDStr(ts) : todayStr;
      if (!ts) {
        const timeAgoLower = (f.timeAgo || "").toLowerCase();
        if (timeAgoLower.includes("1d") || timeAgoLower.includes("yesterday") || timeAgoLower.includes("20h") || timeAgoLower.includes("23h")) {
          dateKey = yesterdayStr;
        }
      }

      if (dateKey === todayStr) today.push(f);
      else if (dateKey === yesterdayStr) yesterday.push(f);
    });

    return { todaySuccessMessages: today, yesterdaySuccessMessages: yesterday, userSuccessMessages: allSuccess };
  }, [feedNumbers]);

  const todayRevenueBDT = React.useMemo(() => {
    return todaySuccessMessages.reduce((sum, msg) => {
      const msgCount = msg.messages && msg.messages.length > 0 ? msg.messages.length : 1;
      return sum + getServiceRateBDT(msg.service) * msgCount;
    }, 0);
  }, [todaySuccessMessages]);

  const todayOtpsCount = React.useMemo(() => {
    return todaySuccessMessages.reduce((sum, msg) => {
      const msgCount = msg.messages && msg.messages.length > 0 ? msg.messages.length : 1;
      return sum + msgCount;
    }, 0);
  }, [todaySuccessMessages]);

  const yesterdayRevenueBDT = React.useMemo(() => {
    return yesterdaySuccessMessages.reduce((sum, msg) => {
      const msgCount = msg.messages && msg.messages.length > 0 ? msg.messages.length : 1;
      return sum + getServiceRateBDT(msg.service) * msgCount;
    }, 0);
  }, [yesterdaySuccessMessages]);

  const yesterdayOtpsCount = React.useMemo(() => {
    return yesterdaySuccessMessages.reduce((sum, msg) => {
      const msgCount = msg.messages && msg.messages.length > 0 ? msg.messages.length : 1;
      return sum + msgCount;
    }, 0);
  }, [yesterdaySuccessMessages]);

  const formatBalanceDisplay = (balanceBDT: number, currCurrency: string) => {
    if (currCurrency === "BDT") {
      return `৳${(balanceBDT || 0).toFixed(2)}`;
    }
    const usdVal = (balanceBDT || 0) / usdExchangeRate;
    if (balanceBDT > 0 && usdVal < 0.01) {
      return `$${usdVal.toFixed(3)}`;
    }
    return `$${usdVal.toFixed(2)}`;
  };

  // Auto-sync user profile balance with feed earnings if DB profile balance is lower than total feed earnings
  useEffect(() => {
    if (!currentUserEmail || !userProfile) return;

    let totalFeedEarnedBDT = 0;
    feedNumbers.forEach((f) => {
      if (f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || f.status === "success") {
        const msgCount = f.messages && f.messages.length > 0 ? f.messages.length : 1;
        totalFeedEarnedBDT += getServiceRateBDT(f.service) * msgCount;
      }
    });

    totalFeedEarnedBDT = Number(totalFeedEarnedBDT.toFixed(2));

    if (totalFeedEarnedBDT > 0 && (userProfile.balance || 0) < totalFeedEarnedBDT) {
      setUserProfile((prev) => {
        if (!prev) return prev;
        const updatedBalance = Math.max(prev.balance || 0, totalFeedEarnedBDT);
        if (updatedBalance !== prev.balance) {
          const updated = { ...prev, balance: updatedBalance };
          saveUserProfileToSupabase(updated);
          return updated;
        }
        return prev;
      });
    }
  }, [feedNumbers, currentUserEmail, userProfile?.balance]);

  useEffect(() => {
    try {
      localStorage.setItem("orabit_currency", currency);
    } catch (e) {
      console.error(e);
    }
  }, [currency]);

  // UTC Clock
  const [utcTime, setUtcTime] = useState("");

  // Save profile state and sync with registered users database in localStorage
  useEffect(() => {
    try {
      if (userProfile && userProfile.email) {
        localStorage.setItem("orabit_user_profile", JSON.stringify(userProfile));
        const stored = localStorage.getItem("orabit_registered_users");
        const savedAccounts: UserProfile[] = stored ? JSON.parse(stored) : [];
        const idx = savedAccounts.findIndex(
          (acc) => acc.email.toLowerCase() === userProfile.email.toLowerCase()
        );
        if (idx >= 0) {
          savedAccounts[idx] = { ...savedAccounts[idx], ...userProfile };
        } else {
          savedAccounts.push(userProfile);
        }
        localStorage.setItem("orabit_registered_users", JSON.stringify(savedAccounts));
      } else {
        localStorage.removeItem("orabit_user_profile");
      }
    } catch (e) {
      console.error("Failed to save user profile to storage", e);
    }
  }, [userProfile]);

  // Navigate to tab with browser URL history update and RBAC Route Protection
  const navigateToTab = (
    tab:
      | "dashboard"
      | "console"
      | "getnum"
      | "summary"
      | "api"
      | "domain"
      | "profile"
      | "payment"
      | "logout"
      | "owner_dashboard"
      | "owner_summary"
      | "owner_agent_mgmt"
      | "owner_user_mgmt"
      | "owner_panel_mgmt"
      | "owner_number_file"
      | "owner_otp_mgmt"
      | "owner_rate_mgmt"
      | "owner_payment_mgmt"
      | "agent_dashboard"
      | "agent_summary"
  ) => {
    let targetTab = tab;
    if (tab === "summary") {
      if (isOwner) targetTab = "owner_summary";
      else if (isAgent) targetTab = "agent_summary";
    }

    // ROUTE PROTECTION: If owner or agent attempts to access client tabs (dashboard, getnum, console), redirect to their respective dashboard
    if ((tab === "dashboard" || tab === "getnum" || tab === "console") && (isOwner || isAgent)) {
      const redirectTab = isOwner ? "owner_dashboard" : "agent_dashboard";
      const redirectPath = isOwner ? "/owner/dashboard" : "/agent/dashboard";
      setActiveTab(redirectTab);
      try {
        if (window.location.pathname !== redirectPath) {
          window.history.replaceState({ tab: redirectTab }, "", redirectPath);
        }
      } catch {}
      return;
    }

    // ROUTE PROTECTION: If client attempts to access owner tabs, redirect to client dashboard
    if (
      (targetTab === "owner_dashboard" ||
        targetTab === "owner_summary" ||
        targetTab === "owner_agent_mgmt" ||
        targetTab === "owner_user_mgmt" ||
        targetTab === "owner_panel_mgmt" ||
        targetTab === "owner_number_file" ||
        targetTab === "owner_otp_mgmt" ||
        targetTab === "owner_rate_mgmt" ||
        targetTab === "owner_payment_mgmt") &&
      !isOwner
    ) {
      setActiveTab("dashboard");
      try {
        if (window.location.pathname !== "/dashboard") {
          window.history.replaceState({ tab: "dashboard" }, "", "/dashboard");
        }
      } catch {}
      return;
    }

    // ROUTE PROTECTION: If non-agent/non-owner attempts to access agent dashboard/summary
    if ((targetTab === "agent_dashboard" || targetTab === "agent_summary") && !isAgent && !isOwner) {
      setActiveTab("dashboard");
      try {
        if (window.location.pathname !== "/dashboard") {
          window.history.replaceState({ tab: "dashboard" }, "", "/dashboard");
        }
      } catch {}
      return;
    }

    setActiveTab(targetTab);
    try {
      if (userProfile) {
        let path = `/${targetTab}`;
        if (targetTab === "dashboard") path = "/dashboard";
        else if (targetTab === "owner_dashboard") path = "/owner/dashboard";
        else if (targetTab === "owner_summary") path = "/owner/summary";
        else if (targetTab === "agent_dashboard") path = "/agent/dashboard";
        else if (targetTab === "agent_summary") path = "/agent/summary";

        if (window.location.pathname !== path) {
          window.history.pushState({ tab: targetTab }, "", path);
        }
      }
    } catch {
      // Ignore location history errors in isolated frames
    }
  };

  // Sync route on mount and window popstate with RBAC Protection
  useEffect(() => {
    const syncRouteFromPath = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        if (userProfile) {
          const isOwnerUser = userProfile.role?.toLowerCase() === "owner" || userProfile.email?.toLowerCase().trim() === "orabitsms@gmail.com";
          const isAgentUser = userProfile.role?.toLowerCase() === "agent";
          
          if (path === "/owner/dashboard" || path === "/owner-dashboard" || path === "/owner") {
            if (isOwnerUser) {
              setActiveTab("owner_dashboard");
            } else {
              // REDIRECT CLIENT TO CLIENT DASHBOARD (/dashboard)
              setActiveTab("dashboard");
              window.history.replaceState({ tab: "dashboard" }, "", "/dashboard");
            }
          } else if (path === "/owner/summary" || path === "/owner-summary") {
            if (isOwnerUser) {
              setActiveTab("owner_summary");
            } else {
              // REDIRECT CLIENT TO CLIENT DASHBOARD (/dashboard)
              setActiveTab("dashboard");
              window.history.replaceState({ tab: "dashboard" }, "", "/dashboard");
            }
          } else if (path === "/agent/dashboard" || path === "/agent-dashboard" || path === "/agent") {
            if (isAgentUser || isOwnerUser) {
              setActiveTab("agent_dashboard");
            } else {
              // PROTECTED ROUTE: REDIRECT CLIENT AWAY TO /dashboard
              setActiveTab("dashboard");
              window.history.replaceState({ tab: "dashboard" }, "", "/dashboard");
            }
          } else if (path === "/agent/summary" || path === "/agent-summary") {
            if (isAgentUser || isOwnerUser) {
              setActiveTab("agent_summary");
            } else {
              // PROTECTED ROUTE: REDIRECT CLIENT AWAY TO /dashboard
              setActiveTab("dashboard");
              window.history.replaceState({ tab: "dashboard" }, "", "/dashboard");
            }
          } else if (path === "/profile") setActiveTab("profile");
          else if (path === "/payment" || path === "/wallet") setActiveTab("payment");
          else if (path === "/getnum" || path === "/get-number") setActiveTab("getnum");
          else if (path === "/console") setActiveTab("console");
          else if (path === "/summary") {
            if (isOwnerUser) {
              setActiveTab("owner_summary");
              window.history.replaceState({ tab: "owner_summary" }, "", "/owner/summary");
            } else if (isAgentUser) {
              setActiveTab("agent_summary");
              window.history.replaceState({ tab: "agent_summary" }, "", "/agent/summary");
            } else {
              setActiveTab("summary");
            }
          } else if (path === "/api" || path === "/apidocs") setActiveTab("api");
          else if (path === "/domain") setActiveTab("domain");
          else if (path === "/logout" || path === "/signout") setActiveTab("logout");
          else {
            if (isAgentUser) {
              // AUTOMATICALLY REDIRECT AGENT TO /agent/dashboard
              setActiveTab("agent_dashboard");
              if (path !== "/agent/dashboard") {
                window.history.replaceState({ tab: "agent_dashboard" }, "", "/agent/dashboard");
              }
            } else if (isOwnerUser && (path === "/" || path === "/owner/dashboard")) {
              setActiveTab("owner_dashboard");
              if (path !== "/owner/dashboard") {
                window.history.replaceState({ tab: "owner_dashboard" }, "", "/owner/dashboard");
              }
            } else {
              setActiveTab("dashboard");
              if (path !== "/dashboard") {
                window.history.replaceState({ tab: "dashboard" }, "", "/dashboard");
              }
            }
          }
        } else {
          if (path !== "/login" && path !== "/") {
            window.history.replaceState({}, "", "/login");
          }
        }
      } catch {
        // Ignore iframe location errors
      }
    };

    syncRouteFromPath();
    window.addEventListener("popstate", syncRouteFromPath);
    return () => window.removeEventListener("popstate", syncRouteFromPath);
  }, [userProfile, isOwner, isAgent]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toISOString().substring(11, 19) + " UTC+0";
      setUtcTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stex SMS Real-Time Traffic & Console Listener (100% REAL TRAFFIC ONLY)
  useEffect(() => {
    const activeKey = apiKey || DEFAULT_STEX_API_KEY;

    const pollConsoleAndOtps = async () => {
      try {
        // 1. Fetch Real Console Hits
        const consoleRes = await fetchStexConsole(activeKey);
        if (consoleRes.meta && consoleRes.meta.code === 200 && consoleRes.data && consoleRes.data.hits) {
          const hits = consoleRes.data.hits;
          const liveConsoleMsgs: SmsMessage[] = hits.map((h, idx) => {
            const formattedTime = new Date(Number(h.time) || Date.now()).toLocaleTimeString("en-US", { hour12: true });
            const extracted = extractOtpFromMessage(h.message);
            const { service: detectedService, color: serviceColor } = detectServiceAndColor(h.message, h.sid);

            const locInfo = getCountryAndOperatorFromRange(h.range);

            let displayRange = h.range || "";
            if (!displayRange.includes("X") && !displayRange.includes("x")) {
              displayRange = displayRange + "XXX";
            }

            return {
              id: `hit-${h.range}-${h.time}-${idx}`,
              timestamp: Number(h.time) || Date.now(),
              time: formattedTime,
              operator: locInfo.operator,
              country: locInfo.country,
              countryIso: locInfo.iso,
              service: detectedService,
              serviceColor,
              number: displayRange,
              otpCode: extracted,
              rawMessage: maskMessageOtp(h.message),
            };
          });

          setMessages((prevMsgs) => {
            const bdStart = getBD4AMWindowStart();
            const existingIds = new Set(prevMsgs.map((m) => m.id));
            const fresh = liveConsoleMsgs.filter((m) => !existingIds.has(m.id));
            const base = fresh.length > 0 ? [...fresh, ...prevMsgs] : (prevMsgs.length === 0 ? liveConsoleMsgs : prevMsgs);
            return base
              .filter((m) => {
                const t = m.timestamp;
                if (t && t < bdStart) return false;
                return true;
              })
              .slice(0, 300);
          });

          setAll24hHits((prevHits) => {
            const bdStart = getBD4AMWindowStart();
            const existingIds = new Set(prevHits.map((m) => m.id));
            const fresh = liveConsoleMsgs.filter((m) => !existingIds.has(m.id));
            const base = fresh.length > 0 ? [...fresh, ...prevHits] : (prevHits.length === 0 ? liveConsoleMsgs : prevHits);
            return base.filter((m) => {
              const t = m.timestamp;
              if (t && t < bdStart) return false;
              return true;
            });
          });
        }

        // 2. Fetch User OTPs for requested numbers & enforce 15-min expiration
        let fetchedOtps: any[] = [];
        try {
          const otpRes = await fetchStexOtps(activeKey);
          if (otpRes.meta && otpRes.meta.code === 200 && otpRes.data && otpRes.data.otps) {
            fetchedOtps = otpRes.data.otps;
          }
        } catch (e) {
          console.error("Error fetching OTPs:", e);
        }

        setFeedNumbers((prevFeed) => {
          const now = Date.now();
          let updated = false;

          const newFeed = prevFeed.map((item) => {
            const isAlreadySuccess = item.status === "SUCCESS" || item.status === "MULTI SUCCESS";

            // Find all matching OTPs for this number in fetchedOtps
            const iNum = (item.number || "").replace(/\D/g, "");
            const matchingOtps = fetchedOtps.filter((o) => {
              if (!o || !o.number) return false;
              const oNum = o.number.replace(/\D/g, "");
              return oNum === iNum || oNum.endsWith(iNum) || iNum.endsWith(oNum);
            });

            if (matchingOtps.length > 0) {
              const existingRaw = item.rawMessage || "";
              const existingMessages = item.messages || [];

              // Filter to unrecorded OTP messages
              const unrecordedOtps = matchingOtps.filter((o) => {
                if (!o.message) return false;
                const existsInRaw = existingRaw.includes(o.message);
                const existsInMsgs = existingMessages.some((m) => m.raw === o.message);
                return !existsInRaw && !existsInMsgs;
              });

              if (unrecordedOtps.length > 0) {
                updated = true;
                let currentMessages = [...existingMessages];

                unrecordedOtps.forEach((newOtp) => {
                  const code = extractOtpFromMessage(newOtp.message);
                  currentMessages.unshift({
                    code: code || undefined,
                    raw: newOtp.message,
                    timestamp: now,
                  });

                  // Billing security: credit balance + 1 totalSuccess for each NEW message received
                  const { service: autoDetected } = detectServiceAndColor(newOtp.message, newOtp.service || item.service);
                  const finalService = (autoDetected && autoDetected !== "SMS OTP" && autoDetected !== "OTHER")
                    ? autoDetected
                    : (item.service && item.service !== "SMS OTP" ? item.service : "INSTAGRAM");

                  const earnedRate = getServiceRateBDT(finalService);
                  if (currentUserEmail) {
                    incrementUserSuccessAndBalanceInSupabase(currentUserEmail, earnedRate).then((res) => {
                      if (res) {
                        setUserProfile((prev) => (prev ? { ...prev, balance: res.newBalance, totalSuccess: res.newTotalSuccess } : null));
                      }
                    });
                  }
                });

                const latestOtp = unrecordedOtps[0];
                const { service: autoDetected } = detectServiceAndColor(latestOtp.message, latestOtp.service || item.service);
                const finalService = (autoDetected && autoDetected !== "SMS OTP" && autoDetected !== "OTHER")
                  ? autoDetected
                  : (item.service && item.service !== "SMS OTP" ? item.service : "INSTAGRAM");

                const finalStatus = currentMessages.length > 1 ? ("MULTI SUCCESS" as const) : ("SUCCESS" as const);
                const combinedRaw = currentMessages.map((m) => m.raw).join("\n---\n");
                const combinedCodes = currentMessages.map((m) => m.code).filter(Boolean).join(", ");

                const reqTimestamp = item.requestedAt || (item.id.startsWith("feed-") ? Number(item.id.replace("feed-", "")) : null);
                const elapsedMins = reqTimestamp ? Math.floor((now - reqTimestamp) / 60000) : 0;
                const timeAgoStr = elapsedMins < 1 ? "Just now" : `${elapsedMins}m ago`;

                return {
                  ...item,
                  service: finalService,
                  status: finalStatus,
                  otpCode: combinedCodes || item.otpCode,
                  rawMessage: combinedRaw || item.rawMessage,
                  messages: currentMessages,
                  timeAgo: timeAgoStr,
                };
              }
            }

            // Auto-heal existing items where rawMessage has keyword like Instagram but service was "SMS OTP"
            if (item.rawMessage && (item.service === "SMS OTP" || !item.service || item.service === "OTHER")) {
              const { service: autoDetected } = detectServiceAndColor(item.rawMessage);
              if (autoDetected && autoDetected !== "SMS OTP" && autoDetected !== "OTHER") {
                updated = true;
                return {
                  ...item,
                  service: autoDetected,
                };
              }
            }

            // Update dynamic timeAgo for all statuses based on requestedAt / timestamp
            const reqTimestamp = item.requestedAt || (item.id.startsWith("feed-") ? Number(item.id.replace("feed-", "")) : null);
            if (reqTimestamp) {
              const elapsedMs = now - reqTimestamp;

              // STRICT STATE LOCK: SUCCESS / MULTI SUCCESS items are IMMUTABLE. Never downgrade to FAILED!
              if (isAlreadySuccess) {
                const timeAgoStr = formatTimeAgo(reqTimestamp, item.timeAgo);
                if (item.timeAgo !== timeAgoStr) {
                  updated = true;
                  return { ...item, timeAgo: timeAgoStr };
                }
              } else if (item.status === "FAILED") {
                const timeAgoStr = formatTimeAgo(reqTimestamp, item.timeAgo);
                if (item.timeAgo !== timeAgoStr) {
                  updated = true;
                  return { ...item, timeAgo: timeAgoStr };
                }
              } else if (item.status === "PENDING") {
                if (elapsedMs >= 15 * 60 * 1000) {
                  updated = true;
                  return {
                    ...item,
                    status: "FAILED" as const,
                    timeAgo: formatTimeAgo(reqTimestamp),
                    rawMessage: "No SMS received within 15 minutes",
                  };
                } else {
                  const timeAgoStr = formatTimeAgo(reqTimestamp, item.timeAgo);
                  if (item.timeAgo !== timeAgoStr) {
                    updated = true;
                    return { ...item, timeAgo: timeAgoStr };
                  }
                }
              }
            }

            return item;
          });

          if (updated && currentUserEmail) {
            bulkSyncFeedNumbersToSupabase(currentUserEmail, newFeed);
          }

          return updated ? newFeed : prevFeed;
        });
      } catch (err) {
        console.error("Error polling real traffic:", err);
      }
    };

    pollConsoleAndOtps();
    const interval = setInterval(pollConsoleAndOtps, 5000);

    const countdownTimer = setInterval(() => {
      setAutoSyncSeconds((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownTimer);
    };
  }, [apiKey]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleGetNumber = async () => {
    if (provisioning) return;

    const cleanInput = targetRange.trim().replace(/X/gi, "");
    if (!cleanInput) {
      setProvisionMsg("❌ Please enter or select a number range first.");
      return;
    }

    setProvisioning(true);
    setProvisionMsg("Connecting to ORABIT Core Network...");

    const activeKey = apiKey || DEFAULT_STEX_API_KEY;

    try {
      const result = await requestStexNumber({ query: cleanInput, apiKey: activeKey });

      if (result.meta && result.meta.code === 200 && result.data) {
        const d = result.data;
        const rawNoPlus = d.no_plus_number || (d.full_number ? d.full_number.replace(/\+/g, "") : cleanInput);
        const rawNational = d.national_number || rawNoPlus;
        const rawFull = d.full_number || `+${rawNoPlus}`;

        let finalFormattedNumber = rawFull;
        if (noPlus) {
          finalFormattedNumber = rawNoPlus;
        } else if (isNational) {
          finalFormattedNumber = rawNational;
        }

        const countryName = (d.country && d.country !== "Stex Pool") ? d.country : "Global Pool";
        const operatorName = d.operator || "GSM Network";

        const nowTs = Date.now();
        const newItemId = "feed-" + nowTs;
        const newFeedItem: FeedNumber = {
          id: newItemId,
          number: rawNoPlus,
          status: "PENDING",
          country: countryName,
          operator: operatorName,
          timeAgo: "Just now (15m left)",
          service: "SMS OTP",
          requestedAt: nowTs,
        };

        setFeedNumbers((prev) => [newFeedItem, ...prev]);
        setFeedCurrentPage(1);
        if (currentUserEmail) {
          saveFeedNumberToSupabase(currentUserEmail, newFeedItem);
        }
        setProvisionMsg(`✓ Number Allocated: ${finalFormattedNumber}`);
        setTimeout(() => setProvisionMsg(null), 4000);

        // Automatically copy to clipboard
        try {
          await navigator.clipboard.writeText(finalFormattedNumber);
          setCopiedText(`Copied ${finalFormattedNumber}`);
          setTimeout(() => setCopiedText(null), 3000);
        } catch (e) {
          console.error("Auto copy error:", e);
        }

        // Requesting/allocating a number is 100% free (৳0.00). Balance is only earned/credited when OTP arrives.
      } else {
        const errMsg = result.message || "No numbers available in this range. Try a different range.";
        setProvisionMsg(`❌ ${errMsg}`);
        setTimeout(() => setProvisionMsg(null), 5000);
      }
    } catch (err: any) {
      console.error("handleGetNumber exception:", err);
      setProvisionMsg("❌ Connection Error. Please try again.");
      setTimeout(() => setProvisionMsg(null), 5000);
    } finally {
      setProvisioning(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.number.toLowerCase().includes(q) ||
      m.service.toLowerCase().includes(q) ||
      m.rawMessage.toLowerCase().includes(q) ||
      m.country.toLowerCase().includes(q)
    );
  });

  const filteredFeed = feedNumbers.filter((f) => {
    if (feedFilter === "ALL") return true;
    if (feedFilter === "SUCCESS") return f.status === "SUCCESS" || f.status === "MULTI SUCCESS";
    return f.status === feedFilter;
  });

  const feedItemsPerPage = 20;
  const totalFeedItems = filteredFeed.length;
  const totalFeedPages = Math.max(1, Math.ceil(totalFeedItems / feedItemsPerPage));
  const safeFeedPage = Math.min(feedCurrentPage, totalFeedPages);
  const feedStartIndex = (safeFeedPage - 1) * feedItemsPerPage;
  const feedEndIndex = Math.min(feedStartIndex + feedItemsPerPage, totalFeedItems);
  const paginatedFeed = filteredFeed.slice(feedStartIndex, feedEndIndex);

  // Range Service Detection helper
  const rangeServiceAnalysis = React.useMemo(() => {
    const cleanRange = targetRange.trim().replace(/X/gi, "").replace(/[^0-9]/g, "");
    if (!cleanRange) return null;

    const matched = messages.filter((m) => {
      const mNumDigits = (m.number || "").replace(/X/gi, "").replace(/[^0-9]/g, "");
      if (!mNumDigits) return false;
      return mNumDigits.startsWith(cleanRange) || cleanRange.startsWith(mNumDigits) || mNumDigits.includes(cleanRange);
    });

    const counts: Record<string, { count: number; color: string }> = {};
    matched.forEach((m) => {
      const sName = (m.service || "SMS OTP").toUpperCase();
      if (!counts[sName]) {
        counts[sName] = { count: 0, color: m.serviceColor || "#10b981" };
      }
      counts[sName].count += 1;
    });

    const sortedServices = Object.entries(counts).sort((a, b) => b[1].count - a[1].count);

    return {
      cleanRange,
      totalMatched: matched.length,
      services: sortedServices,
    };
  }, [targetRange, messages]);

  // Personal top performers for logged-in user on Dashboard (Today's performance only)
  const userTopPerformers = React.useMemo(() => {
    if (!todaySuccessMessages || todaySuccessMessages.length === 0) {
      return [];
    }
    const counts: Record<string, number> = {};
    todaySuccessMessages.forEach((m) => {
      const msgCount = m.messages && m.messages.length > 0 ? m.messages.length : 1;
      const s = (m.service || "OTHER").toUpperCase();
      counts[s] = (counts[s] || 0) + msgCount;
    });
    const total = todaySuccessMessages.reduce((sum, m) => sum + (m.messages && m.messages.length > 0 ? m.messages.length : 1), 0);
    const colors = ["#3b82f6", "#a855f7", "#eab308", "#10b981", "#ec4899", "#38bdf8"];
    const list = Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percent: Math.round((count / (total || 1)) * 100) + "%",
      color: colors[idx % colors.length],
    }));
    return list.sort((a, b) => b.count - a.count);
  }, [todaySuccessMessages]);

  // Global Console Top Apps Distribution calculated from the last 300 messages across all users/API
  const appStats = React.useMemo(() => {
    if (!messages || messages.length === 0) {
      return [];
    }
    const counts: Record<string, number> = {};
    messages.forEach((m) => {
      const s = (m.service || "OTHER").toUpperCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    const total = messages.length;
    const colorMap: Record<string, string> = {
      FACEBOOK: "#3b82f6",
      WHATSAPP: "#eab308",
      INSTAGRAM: "#10b981",
      DISCORD: "#a855f7",
      BIGO: "#38bdf8",
      TELEGRAM: "#38bdf8",
      CLOUDOTP: "#ec4899",
    };
    const defaultColors = ["#3b82f6", "#a855f7", "#eab308", "#10b981", "#ec4899", "#38bdf8"];

    const list = Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percent: Math.round((count / total) * 100) + "%",
      color: colorMap[name] || defaultColors[idx % defaultColors.length],
    }));
    return list.sort((a, b) => b.count - a.count);
  }, [messages]);

  const DEFAULT_APP_STATS = React.useMemo(() => [
    { name: "FACEBOOK", count: 163, percent: "82%", color: "#3b82f6" },
    { name: "WHATSAPP", count: 17, percent: "9%", color: "#eab308" },
    { name: "INSTAGRAM", count: 11, percent: "6%", color: "#10b981" },
    { name: "DISCORD", count: 6, percent: "3%", color: "#a855f7" },
    { name: "BIGO", count: 1, percent: "1%", color: "#38bdf8" },
  ], []);

  const consoleAppStats = appStats.length > 0 ? appStats : DEFAULT_APP_STATS;

  const top10Trending = React.useMemo(() => {
    const bdStart = getBD4AMWindowStart();
    const serviceCounts: Record<string, number> = {};

    const processMessage = (msg: any) => {
      if (!msg) return;
      const msgTime = msg.timestamp || msg.requestedAt;
      if (msgTime) {
        const t = typeof msgTime === "number" ? msgTime : new Date(msgTime).getTime();
        if (!isNaN(t) && t < bdStart) return;
      }
      let s = (msg.service || msg.serviceName || "OTHER").trim();
      if (!s) return;
      s = s.toUpperCase();
      serviceCounts[s] = (serviceCounts[s] || 0) + 1;
    };

    const dataSource = all24hHits.length > 0 ? all24hHits : messages;
    if (dataSource && dataSource.length > 0) {
      dataSource.forEach(processMessage);
    }
    if (userSuccessMessages && userSuccessMessages.length > 0) {
      userSuccessMessages.forEach(processMessage);
    }

    if (Object.keys(serviceCounts).length === 0) {
      return GLOBAL_TRENDING.slice(0, 10);
    }

    const colorMap: Record<string, string> = {
      FACEBOOK: "#3b82f6",
      WHATSAPP: "#22c55e",
      TELEGRAM: "#38bdf8",
      INSTAGRAM: "#e1306c",
      IMO: "#94a3b8",
      AUTHMSG: "#a855f7",
      CLOUDOTP: "#ec4899",
      DISCORD: "#6366f1",
      BIGO: "#38bdf8",
      FAIRPARI: "#f59e0b",
      ALYMSCINTL: "#64748b",
    };

    const aggregatedList = Object.entries(serviceCounts)
      .map(([name, count]) => ({
        name,
        count,
        color: colorMap[name] || "#3b82f6",
      }))
      .sort((a, b) => b.count - a.count);

    const result: Array<{ id: number; name: string; color: string; count?: number }> = [];
    const usedNames = new Set<string>();

    aggregatedList.forEach((item) => {
      if (!usedNames.has(item.name) && result.length < 10) {
        usedNames.add(item.name);
        result.push({
          id: result.length + 1,
          name: item.name,
          color: item.color,
          count: item.count,
        });
      }
    });

    return result;
  }, [all24hHits, messages, userSuccessMessages]);

  const carrierStats = React.useMemo(() => {
    if (!userSuccessMessages || userSuccessMessages.length === 0) {
      return [];
    }
    const counts: Record<string, number> = {};
    userSuccessMessages.forEach((m) => {
      const op = m.operator || "Other";
      counts[op] = (counts[op] || 0) + 1;
    });
    const total = userSuccessMessages.length;
    const colors = ["#10b981", "#3b82f6", "#a855f7", "#eab308", "#ef4444", "#64748b"];
    const list = Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percent: Math.round((count / total) * 100) + "%",
      color: colors[idx % colors.length],
    }));
    return list.sort((a, b) => b.count - a.count);
  }, [userSuccessMessages]);

  if (!userProfile) {
    return (
      <OrabitAuthScreen
        onLoginSuccess={(u) => {
          login(u);
          const roleLower = (u?.role || "").toLowerCase();
          const emailLower = (u?.email || "").toLowerCase().trim();
          if (roleLower === "owner" || emailLower === "orabitsms@gmail.com") {
            setActiveTab("owner_dashboard");
          } else if (roleLower === "agent") {
            setActiveTab("agent_dashboard");
          } else {
            setActiveTab("dashboard");
          }
        }}
        domainName={domainName}
      />
    );
  }

  // Fullscreen standalone Logout screen without Top Navigation Bar or Menu Button
  if (activeTab === "logout") {
    return (
      <div className="min-h-screen w-full bg-[#0a0d18] text-slate-100 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
        <LogoutPage
          userProfile={userProfile}
          onConfirmLogout={async () => {
            await signOut();
          }}
          onCancel={() => navigateToTab("dashboard")}
          currency={currency}
          usdExchangeRate={usdExchangeRate}
        />
      </div>
    );
  }

  return (
    <ProtectedRoute domainName={domainName}>
      <div className={`min-h-screen w-full font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-200 ${
        theme === "light" ? "bg-slate-100 text-slate-900" : "bg-[#0d1117] text-slate-100"
      }`}>
      {/* GLOBAL TOP NAVIGATION BAR */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md px-2.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-xl transition-colors duration-200 ${
        theme === "light" ? "bg-white/95 border-slate-200 text-slate-900" : "bg-slate-900/95 border-slate-800/90 text-slate-100"
      }`}>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 mr-3 sm:mr-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95"
            title="Toggle Menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* NEW HIGH-TECH ORBITAL LOGO */}
          <OrabitLogo
            size="md"
            showSubtitle={false}
            onClick={() => navigateToTab("dashboard")}
          />
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
          {/* Live Search */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search number or OTP code..."
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-9 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-cyan-500 w-48 lg:w-60 transition-all"
            />
          </div>

          {/* UTC Clock */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-amber-400 font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{utcTime || "10:51:23 UTC+0"}</span>
          </div>

          {/* Account Balance */}
          <button
            onClick={() => navigateToTab("payment")}
            title="Click to view Wallet & Payouts"
            className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-bold text-xs px-2 sm:px-3 py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-sm shadow-emerald-950/50 hover:border-emerald-400 hover:bg-emerald-900/60 active:scale-95 transition-all cursor-pointer group"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono">
              {formatBalanceDisplay(userProfile.balance, currency)}
            </span>
            <span className="text-[10px] bg-emerald-500/20 px-1 sm:px-1.5 py-0.5 rounded text-emerald-300 font-mono uppercase font-bold flex items-center gap-0.5">
              <span>{currency}</span>
            </span>
          </button>

          {/* User Profile Badge (Clicking opens Profile view) */}
          <div className="flex items-center gap-2">
            <div
              onClick={() => navigateToTab("profile")}
              title={`${userProfile.fullName} (${userProfile.email}) - View Profile`}
              className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white border border-cyan-400/80 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all hover:ring-2 hover:ring-cyan-400/50"
            >
              {userProfile.fullName ? userProfile.fullName.substring(0, 2).toUpperCase() : "OR"}
            </div>
          </div>
        </div>
      </header>

      {/* SIDEBAR DRAWER OVERLAY (MATCHING SCREENSHOT) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#141822] text-slate-200 z-50 shadow-2xl overflow-y-auto flex flex-col p-4 space-y-4 font-sans border-r border-slate-800/80 animate-in slide-in-from-left duration-200">
            {/* Header / Logo */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <OrabitLogo size="sm" showSubtitle={false} />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Owner Section (Visible for Owner Account) */}
            {isOwner && (
              <div className="space-y-1 bg-gradient-to-b from-amber-500/10 to-slate-900/60 p-2.5 rounded-2xl border border-amber-500/30">
                <p className="text-[11px] font-black text-amber-400 px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Owner Menu
                </p>

                {/* 1. Dashboard */}
                <button
                  onClick={() => {
                    navigateToTab("owner_dashboard");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_dashboard"
                      ? "bg-[#2EE59D] text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 text-amber-400" />
                  <span>Dashboard</span>
                </button>

                {/* 2. Summary */}
                <button
                  onClick={() => {
                    navigateToTab("owner_summary");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_summary"
                      ? "bg-[#2EE59D] text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Summary</span>
                </button>

                {/* 3. Agent Management */}
                <button
                  onClick={() => {
                    navigateToTab("owner_agent_mgmt");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_agent_mgmt"
                      ? "bg-[#2EE59D] text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Agent Management</span>
                </button>

                {/* 4. User Management */}
                <button
                  onClick={() => {
                    navigateToTab("owner_user_mgmt");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_user_mgmt"
                      ? "bg-[#2EE59D] text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>User Management</span>
                </button>

                {/* 5. Panel Management */}
                <button
                  onClick={() => {
                    navigateToTab("owner_panel_mgmt");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_panel_mgmt"
                      ? "bg-[#2EE59D] text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Panel Management</span>
                </button>

                {/* 6. Number File */}
                <button
                  onClick={() => {
                    navigateToTab("owner_number_file");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_number_file"
                      ? "bg-[#2EE59D] text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>Number File</span>
                </button>

                {/* 7. API Management */}
                <button
                  onClick={() => {
                    navigateToTab("owner_otp_mgmt");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_otp_mgmt"
                      ? "bg-[#2EE59D] text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>API Management</span>
                </button>

                {/* 8. Rate Management */}
                <button
                  onClick={() => {
                    navigateToTab("owner_rate_mgmt");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_rate_mgmt"
                      ? "bg-[#2EE59D] text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Percent className="w-4 h-4 text-amber-400" />
                  <span>Rate Management</span>
                </button>

                {/* 9. Payment Management */}
                <button
                  onClick={() => {
                    navigateToTab("owner_payment_mgmt");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_payment_mgmt"
                      ? "bg-[#2EE59D] text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Payment Management</span>
                </button>

                {/* 10. Profile */}
                <button
                  onClick={() => {
                    navigateToTab("profile");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "profile"
                      ? "bg-[#2EE59D] text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Profile</span>
                </button>

                {/* 11. Currency */}
                <button
                  onClick={() => {
                    setCurrencyModalOpen(true);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>Currency</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    {currency === "USD" ? "USD ($)" : "BDT (৳)"}
                  </span>
                </button>

                {/* 12. Logout */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    navigateToTab("logout");
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Agent Section (Visible for Agent Account) */}
            {isAgent && !isOwner && (
              <div className="space-y-1 bg-gradient-to-b from-indigo-500/10 to-slate-900/60 p-2.5 rounded-2xl border border-indigo-500/30">
                <p className="text-[11px] font-black text-indigo-400 px-3 py-1 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> Agent Menu
                </p>

                {/* 1. Dashboard */}
                <button
                  onClick={() => {
                    navigateToTab("agent_dashboard");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "agent_dashboard"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 text-indigo-400" />
                  <span>Dashboard</span>
                </button>

                {/* 2. Summary */}
                <button
                  onClick={() => {
                    navigateToTab("agent_summary");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "agent_summary"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>Summary</span>
                </button>

                {/* 3. Realtime */}
                <button
                  onClick={() => {
                    navigateToTab("console");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "console"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>Realtime</span>
                </button>

                {/* 4. User Payment */}
                <button
                  onClick={() => {
                    navigateToTab("owner_payment_mgmt");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_payment_mgmt"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span>User Payment</span>
                </button>

                {/* 5. User Management */}
                <button
                  onClick={() => {
                    navigateToTab("owner_user_mgmt");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_user_mgmt"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>User Management</span>
                </button>

                {/* 6. Api Management */}
                <button
                  onClick={() => {
                    navigateToTab("owner_otp_mgmt");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "owner_otp_mgmt"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span>Api Management</span>
                </button>

                {/* 7. Profile */}
                <button
                  onClick={() => {
                    navigateToTab("profile");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "profile"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>Profile</span>
                </button>

                {/* 8. Payment */}
                <button
                  onClick={() => {
                    navigateToTab("payment");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "payment"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                      : "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span>Payment</span>
                </button>

                {/* Currency */}
                <button
                  onClick={() => {
                    setCurrencyModalOpen(true);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Coins className="w-4 h-4 text-indigo-400" />
                    <span>Currency</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    {currency === "USD" ? "USD ($)" : "BDT (৳)"}
                  </span>
                </button>

                {/* 9. Logout */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    navigateToTab("logout");
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Main Active Pill: Dashboard (Visible only for Clients) */}
            {!isOwner && !isAgent && (
              <div>
                <button
                  onClick={() => {
                    navigateToTab("dashboard");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all shadow-md ${
                    activeTab === "dashboard"
                      ? "bg-[#2EE59D] text-slate-950 shadow-emerald-500/20"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-4.5 h-4.5" />
                  <span>Dashboard</span>
                </button>
              </div>
            )}

            {/* Section 1: Dialer Panel (Visible only for Client accounts) */}
            {!isOwner && !isAgent && (
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                  Dialer Panel
                </p>

                <button
                  onClick={() => {
                    navigateToTab("getnum");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "getnum"
                      ? "bg-[#2EE59D] text-slate-950 font-bold"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <Hash className="w-4 h-4 text-slate-400" />
                  <span>Get Number</span>
                </button>

                <button
                  onClick={() => {
                    navigateToTab("console");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "console"
                      ? "bg-[#2EE59D] text-slate-950 font-bold"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span>Console</span>
                </button>

                <button
                  onClick={() => {
                    navigateToTab("summary");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "summary"
                      ? "bg-[#2EE59D] text-slate-950 font-bold"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <span>Summary</span>
                </button>
              </div>
            )}

            {/* Section 2: Account (Visible for Non-Owner & Non-Agent accounts) */}
            {!isOwner && !isAgent && (
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase tracking-wider">
                  Account
                </p>

                <button
                  onClick={() => {
                    navigateToTab("profile");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "profile"
                      ? "bg-[#2EE59D] text-slate-950 font-bold"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => {
                    navigateToTab("payment");
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === "payment"
                      ? "bg-[#2EE59D] text-slate-950 font-bold"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Payment</span>
                </button>

                <button
                  onClick={() => {
                    setCurrencyModalOpen(true);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Currency</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {currency === "USD" ? "USD ($)" : "BDT (৳)"}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    navigateToTab("logout");
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Bottom Developer Card */}
            <div className="mt-auto pt-2">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900 border border-emerald-500/20 space-y-2 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                    DEV
                  </span>
                  <Code2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-bold text-xs text-white">Are you a developer?</div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">See the API</span>
                  <button
                    onClick={() => {
                      setActiveTab("api");
                      setSidebarOpen(false);
                    }}
                    className="bg-[#2EE59D] hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-1 rounded-lg transition-all shadow-sm active:scale-95"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BODY MAIN CONTENT LAYOUT */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-5">
        {/* TAB 1: DASHBOARD & ANALYTICS */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* WELCOME BANNER & ANNOUNCEMENT */}
            <div className="space-y-4">
              {/* Official Launch Announcement Banner (Matching Screenshot 3) */}
              <div className="group p-4 rounded-2xl bg-amber-950/25 border border-amber-500/35 hover:border-amber-500/50 text-amber-200/90 text-xs space-y-2 relative overflow-hidden shadow-lg transition-all duration-300">
                <div className="flex items-start gap-3">
                  <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 group-hover:rotate-12 transition-transform duration-300" />
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                      <span>Welcome to ORABIT SMS – Official !</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    </h3>
                    <p className="leading-relaxed opacity-90">
                      With Higher Number Availability, Fast OTP Delivery For Facebook, Instagram, WhatsApp, Telegram, And Many Other Services, Super-Fast Payouts Within 12–24 Hours.
                    </p>
                    <p className="leading-relaxed opacity-80 text-[11px]">
                      OrabitSms Uses a Fixed Rate Of 1 USD = 100 BDT. Payments Are Accepted In USDT (BNB SMART CHAIN, Binance) Nased On Current Market Rates.
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-emerald-400 font-mono text-[11px]">
                      <span>Join Our Official Telegram Channel For Live Updates:</span>
                      <a
                        href="https://t.me/OrabitSms"
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-white font-bold flex items-center gap-1 text-emerald-300 hover:scale-105 transition-transform"
                      >
                        @OrabitSms <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* TOP METRICS CARDS WITH ANIMATIONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CARD 1: TODAY REVENUE */}
                <div className="group p-4 rounded-2xl bg-[#131722]/90 border border-slate-800/90 hover:border-amber-500/40 space-y-2 relative shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider">
                    <span className="group-hover:text-amber-300 transition-colors uppercase">TODAY REVENUE</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/25 transition-all">
                      <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono group-hover:text-amber-300 transition-colors">
                    {formatBalanceDisplay(todayRevenueBDT, currency)}
                  </div>
                  <div className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">Earnings from successful OTPs</div>
                </div>

                {/* CARD 2: TODAY OTPS */}
                <div className="group p-4 rounded-2xl bg-[#131722]/90 border border-slate-800/90 hover:border-blue-500/40 space-y-2 relative shadow-md hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider">
                    <span className="group-hover:text-blue-300 transition-colors uppercase">TODAY OTPS</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/25 transition-all">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono group-hover:text-blue-300 transition-colors">
                    {todayOtpsCount}
                  </div>
                  <div className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">Total successful verifications</div>
                </div>

                {/* CARD 3: YESTERDAY REVENUE */}
                <div className="group p-4 rounded-2xl bg-[#131722]/90 border border-slate-800/90 hover:border-purple-500/40 space-y-2 relative shadow-md hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider">
                    <span className="group-hover:text-purple-300 transition-colors uppercase">YESTERDAY REVENUE</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/25 transition-all">
                      <History className="w-4 h-4 text-purple-400" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono group-hover:text-purple-300 transition-colors">
                    {formatBalanceDisplay(yesterdayRevenueBDT, currency)}
                  </div>
                  <div className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">Previous day performance</div>
                </div>

                {/* CARD 4: YESTERDAY OTPS */}
                <div className="group p-4 rounded-2xl bg-[#131722]/90 border border-slate-800/90 hover:border-emerald-500/40 space-y-2 relative shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider">
                    <span className="group-hover:text-emerald-300 transition-colors uppercase">YESTERDAY OTPS</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all">
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono group-hover:text-emerald-300 transition-colors">
                    {yesterdayOtpsCount}
                  </div>
                  <div className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">Completed verifications</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Top Performers Table & Traffic Chart */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Your Top Performers Table (Moved to Top with Animation & Crown Icon) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700/80 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-base text-white">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Your Top Performers</span>
                  </div>
                  {messages.length > 0 && (
                    <span className="text-[10px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full">
                      Active Services
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono">
                        <th className="py-2.5 px-3">SERVICE</th>
                        <th className="py-2.5 px-3">VOLUME</th>
                        <th className="py-2.5 px-3 text-right">EARNINGS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {userTopPerformers && userTopPerformers.length > 0 ? (
                        userTopPerformers.slice(0, 5).map((item) => {
                          const rateBDT = getServiceRateBDT(item.name);
                          const earningsBDT = item.count * rateBDT;
                          const earningsFormatted = formatBalanceDisplay(earningsBDT, currency);
                          return (
                            <tr key={item.name} className="hover:bg-slate-800/50 hover:scale-[1.005] transition-all duration-200 cursor-pointer">
                              <td className="py-3 px-3 flex items-center gap-3">
                                <ServiceLogo name={item.name} size={32} className="w-8 h-8" />
                                <span className="font-bold text-slate-100 text-sm">{item.name}</span>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-200 text-sm">{item.count}</td>
                              <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold text-sm">
                                {earningsFormatted}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center gap-2.5 text-slate-500">
                              <Ghost className="w-7 h-7 text-slate-500/70" />
                              <span className="text-xs font-medium text-slate-400">No activity recorded today</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* 2. Hourly Traffic Chart Box (Moved below Top Performers with Animations) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700/80 transition-all duration-300 relative overflow-hidden"
              >
                {/* Background Subtle Glow Accent */}
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <span>Hourly Traffic</span>
                      <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                    </h3>
                    <p className="text-xs text-slate-400">Live system message throughput timeline</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-semibold shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Live Stream</span>
                  </div>
                </div>

                {/* Recharts Animated Area Chart */}
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={INITIAL_TRAFFIC_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)" }}
                        itemStyle={{ color: "#34d399", fontWeight: "bold" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#trafficGradient)"
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-out"
                        dot={{ r: 4, fill: "#10b981", stroke: "#022c22", strokeWidth: 2 }}
                        activeDot={{ r: 7, fill: "#34d399", stroke: "#064e3b", strokeWidth: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Right Col: Global Trending List (Matching Screenshot 1) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-base text-white">Global Top Services</h3>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-mono font-medium">
                    ● Live
                  </span>
                </div>

                <div className="space-y-2">
                  {top10Trending.length > 0 ? (
                    top10Trending.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] font-mono font-bold flex items-center justify-center text-slate-300">
                            {item.id}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2.5">
                            <ServiceLogo name={item.name} className="w-7 h-7 sm:w-8 sm:h-8" />
                            <span>{item.name}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg className="w-16 h-5" viewBox="0 0 60 20">
                            <path
                              d={`M 0 ${15 - (item.id % 4) * 3} Q 15 ${5 + (item.id % 3) * 3}, 30 ${10 - (item.id % 2) * 2} T 60 12`}
                              fill="none"
                              stroke={item.color}
                              strokeWidth="2"
                            />
                          </svg>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs font-mono text-slate-400 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-center">
                      No console messages received today yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* TAB 2: LIVE SMS TRAFFIC CONSOLE (Matching Screenshots 1 & 2) */}
        {activeTab === "console" && (
          <div className="space-y-6">
            {/* Page Title & Subtitle Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-extrabold font-mono text-xl sm:text-2xl">&gt;_</span>
                <h1 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight">Live Console</h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-sans">
                Streaming OTP messages with carrier and app distribution charts.
              </p>
            </div>

            {/* Top Apps Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-white">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <span>Top Apps Distribution</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">Live Activity</span>
              </div>

              {/* Vertical Bar Chart */}
              <div className="h-44 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consoleAppStats} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={9}
                      tickLine={false}
                      interval={0}
                      tick={{ fill: "#94a3b8", fontSize: 9 }}
                    />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "11px", color: "#fff" }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {consoleAppStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Apps Legend List with Service Logos (1 item per line) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                {consoleAppStats.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between hover:border-slate-700/80 transition-all shadow-sm text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <ServiceLogo name={item.name} className="w-5 h-5 shrink-0" />
                      <span className="font-bold text-slate-200 text-xs tracking-wide uppercase">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-extrabold text-amber-400 text-xs">{item.count}</span>
                      <span className="text-slate-500 text-[10px] font-medium">({item.percent})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Console Stream Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold font-mono text-sm sm:text-base">&gt;_</span>
                  <h2 className="font-bold text-xs sm:text-sm text-white font-mono">Realtime SMS Stream</h2>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              </div>

              {/* Search Filter & Countdown Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter logs..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
                  />
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 text-[10px]">Next update:</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                    <span>{autoSyncSeconds}s</span>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-400" />
                  </span>
                </div>
              </div>

              {/* SMS Stream Cards with Service Logo and Compact Fine Typography */}
              <div className="space-y-2">
                {filteredMessages.slice(0, 50).map((msg, idx) => {
                  let displayMsg = msg.rawMessage || "";
                  if (!displayMsg.includes("***") && !displayMsg.includes("*****")) {
                    displayMsg = displayMsg.replace(/\b\d{4,8}\b/g, "*****");
                  }
                  const bodyContent = displayMsg.replace(/^(<#>|↳\s*<#>)\s*/, "");

                  return (
                    <div
                      key={`${msg.id}-${idx}`}
                      className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 border-l-4 border-l-amber-400 hover:border-slate-700 transition-all space-y-1.5 shadow-sm"
                    >
                      {/* Top Row: Timestamp on left, Service Logo + Service Name & Carrier pill on right */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">{msg.time}</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1.5 bg-blue-950/80 border border-blue-500/40 px-1.5 py-0.5 rounded text-blue-400 font-bold text-[10px] uppercase tracking-wider">
                            <ServiceLogo name={msg.service} className="w-4 h-4 shrink-0" />
                            <span>{msg.service}</span>
                          </div>
                          <span className="inline-block bg-slate-800/90 border border-slate-700/80 text-slate-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {msg.operator}
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: Country in Emerald :: Masked Phone Number + Copy Range Button */}
                      <div className="flex items-center justify-between gap-1.5 font-mono">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase tracking-wider bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                            <Globe className="w-3 h-3 text-emerald-400" />
                            <span>{msg.country}</span>
                          </div>
                          <span className="text-slate-600 font-bold text-[10px] me-0.5">::</span>
                          <span className="text-slate-100 font-bold text-xs tracking-wider">{msg.number}</span>
                        </div>

                        <button
                          onClick={() => {
                            copyToClipboard(msg.number, `Copied range ${msg.number}! Set for Get Number.`);
                            setTargetRange(msg.number);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-400 text-[10px] font-mono transition-all cursor-pointer shrink-0 ml-auto group"
                          title="Copy range and set for Get Number"
                        >
                          <Copy className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <span className="font-bold text-[10px]">Copy Range</span>
                        </button>
                      </div>

                      {/* Bottom Row: Yellow Arrow ➜ SMS Message Payload */}
                      <div className="font-mono text-[10px] sm:text-[11px] text-slate-300 leading-snug flex items-start gap-1 pt-0.5">
                        <span className="text-amber-400 font-black text-[10px] shrink-0 select-none pt-0.5">➜</span>
                        <span className="break-all text-[10px] sm:text-[11px]">&lt;#&gt; {bodyContent}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
                <span>Last Updated: {utcTime ? utcTime.substring(0, 8) : "10:51:35"}</span>
                <span>Logs: {Math.min(filteredMessages.length, 50)} (Max 50)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GET NUMBER & RANGE FEED (Matching Screenshots) */}
        {activeTab === "getnum" && (
          <div className="space-y-5">
            {/* TOP CARD: ENTER NUMBER RANGE */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#111524] border border-slate-800/90 space-y-4 shadow-xl relative overflow-hidden">
              {/* ANIMATED LOGO HEADER BRANDING FOR GET NUMBER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <OrabitLogo size="sm" showSubtitle={true} subtitleText="Live GSM Provisioner" />
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    LIVE SIGNAL
                  </div>
                </div>

                {/* Animated Orbiting Badge */}
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="text-slate-500 text-[11px]">Active Range:</span>
                  <span className="text-emerald-300 font-bold bg-[#0a0d18] px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow-inner">
                    {targetRange || "None"}
                  </span>
                </div>
              </div>

              {/* Range Input Box */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500 text-sm">#</span>
                <input
                  type="text"
                  value={targetRange}
                  onChange={(e) => setTargetRange(e.target.value)}
                  placeholder="e.g., 88017XXX (type the trailing digits)"
                  className="w-full bg-[#0a0d18] border border-emerald-500/40 focus:border-emerald-400 rounded-xl pl-8 pr-4 py-3 text-sm font-mono text-emerald-300 font-bold focus:outline-none transition-all placeholder:text-slate-600 shadow-inner"
                />
              </div>

              {/* Console Range Service Inspection */}
              {rangeServiceAnalysis && (
                <div className="p-3 rounded-xl bg-[#0a0d18] border border-slate-800/90 animate-in fade-in duration-200">
                  {rangeServiceAnalysis.services.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {rangeServiceAnalysis.services.map(([sName, info]) => (
                        <div
                          key={sName}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono border flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
                          style={{
                            backgroundColor: `${info.color}15`,
                            borderColor: `${info.color}40`,
                            color: info.color,
                          }}
                        >
                          <ServiceLogo name={sName} className="w-4 h-4 shrink-0 rounded" />
                          <span className="tracking-wide text-white font-extrabold">{sName}</span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-slate-950/90 text-emerald-400 border border-emerald-500/30 shadow-inner">
                            {info.count} {info.count === 1 ? "Hit" : "Hits"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
                      ℹ️ No live console messages found for this range yet.
                    </div>
                  )}
                </div>
              )}

              {/* Checkboxes Row */}
              <div className="flex items-center gap-6 text-xs text-slate-300 font-medium">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isNational}
                    onChange={(e) => setIsNational(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 accent-emerald-500"
                  />
                  <span>National Format</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={noPlus}
                    onChange={(e) => setNoPlus(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 accent-emerald-500"
                  />
                  <span>Remove (+)</span>
                </label>
              </div>

              {/* Provisioning Message Status Notification */}
              {provisionMsg && (
                <div
                  className={`p-3 rounded-xl font-mono text-xs font-bold border flex items-center justify-between transition-all ${
                    provisionMsg.includes("❌")
                      ? "bg-rose-950/90 border-rose-500/50 text-rose-300"
                      : "bg-emerald-950/90 border-emerald-500/50 text-emerald-300"
                  }`}
                >
                  <span className="break-all">{provisionMsg}</span>
                  {copiedText && (
                    <span className="text-[10px] text-amber-300 bg-amber-950/90 border border-amber-500/40 px-2 py-0.5 rounded shrink-0 ml-2">
                      {copiedText}
                    </span>
                  )}
                </div>
              )}

              {/* Get Number Button with Animated Logo Design */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="w-6 h-6 rounded-full bg-[#0a0d18] border border-emerald-400/60 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  </motion.div>
                  <span className="text-[11px] text-slate-300 font-semibold hidden sm:inline">Ultra-Fast 0.5s Provisioning</span>
                </div>

                <button
                  onClick={handleGetNumber}
                  disabled={provisioning}
                  className="relative group bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="relative flex items-center justify-center">
                    <span className="absolute -inset-1 rounded-full bg-slate-900/20 animate-ping opacity-75" />
                    <PhoneCall className={`w-4 h-4 text-slate-950 fill-slate-950 relative z-10 ${provisioning ? "animate-spin" : "group-hover:rotate-12 transition-transform"}`} />
                  </div>
                  <span className="relative z-10">{provisioning ? "Connecting..." : "Get Number"}</span>
                </button>
              </div>
            </div>

            {/* LOWER TABLE / LIST CARD */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#111524] border border-slate-800/90 space-y-3 shadow-xl min-h-[320px]">
              {/* Header Bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-1 border-b border-slate-800/70">
                <span>
                  {totalFeedItems === 0
                    ? "No results"
                    : `${feedStartIndex + 1}-${feedEndIndex} of ${totalFeedItems}`}
                </span>
                <button
                  onClick={() => refreshFeedFromDatabase(false)}
                  disabled={isRefreshingFeed}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Fetch latest numbers from Supabase database"
                >
                  <RefreshCw className={`w-3 h-3 text-slate-400 ${isRefreshingFeed ? "animate-spin" : ""}`} />
                  <span>{isRefreshingFeed ? "Syncing..." : "Refresh"}</span>
                </button>
              </div>

              {/* Table Column Titles */}
              <div className="grid grid-cols-12 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                <div className="col-span-5 sm:col-span-5">NUMBER INFO</div>
                <div className="col-span-4 sm:col-span-4">COUNTRY / OPERATOR</div>
                <div className="col-span-3 sm:col-span-3 text-right">ACTIVITY</div>
              </div>

              {/* EMPTY STATE - Shown when totalFeedItems is 0 */}
              {totalFeedItems === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <Ghost className="w-12 h-12 text-slate-600/80 stroke-[1.5]" />
                  <p className="text-slate-500 text-xs font-mono font-medium">
                    No numbers found for this date
                  </p>
                </div>
              ) : (
                /* LIST OF REQUESTED NUMBERS (20 PER PAGE) */
                <div className="space-y-2 pt-1">
                  {paginatedFeed.map((item) => {
                    const displayNum = noPlus ? item.number : (item.number.startsWith("+") ? item.number : `+${item.number}`);
                    return (
                      <div
                        key={item.id}
                        className="p-2.5 sm:p-3 rounded-xl bg-[#090d18] border border-slate-800/80 hover:border-slate-700 transition-all grid grid-cols-12 items-center gap-1.5"
                      >
                        {/* NUMBER INFO COLUMN */}
                        <div className="col-span-5 space-y-1">
                          <div className="font-mono text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                            <span>{displayNum}</span>
                            <button
                              onClick={() => copyToClipboard(displayNum, `Copied ${displayNum}`)}
                              className="text-slate-500 hover:text-slate-200 cursor-pointer"
                              title="Copy number"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wide ${
                                item.status === "FAILED"
                                  ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                                  : item.status === "MULTI SUCCESS"
                                  ? "bg-emerald-900 text-emerald-300 border border-emerald-400 font-extrabold animate-pulse"
                                  : item.status === "SUCCESS"
                                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                                  : "bg-amber-950/80 text-amber-400 border border-amber-800/60 animate-pulse"
                              }`}
                            >
                              {item.status}
                            </span>

                            {/* OTP KEY CODE PILLS & COPY BUTTONS */}
                            {(item.status === "SUCCESS" || item.status === "MULTI SUCCESS") && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                {(item.messages && item.messages.length > 0
                                  ? item.messages
                                  : [
                                      {
                                        code: item.otpCode,
                                        raw: item.rawMessage || `<#> ${item.otpCode} is your verification code`,
                                        timestamp: Date.now(),
                                      },
                                    ]
                                ).map((msg, mIdx) => {
                                  const codeStr = msg.code || extractOtpFromMessage(msg.raw) || item.otpCode;
                                  if (!codeStr) return null;
                                  return (
                                    <button
                                      key={mIdx}
                                      onClick={() => {
                                        const msgToCopy = msg.raw || `<#> ${codeStr} is your verification code`;
                                        copyToClipboard(msgToCopy, `Copied OTP: ${codeStr}`);
                                      }}
                                      className="inline-flex items-center gap-1.5 bg-[#121829] border border-amber-500/50 hover:border-amber-400 px-2 py-0.5 rounded text-amber-300 font-mono font-bold text-[10px] shadow-sm transition-all cursor-pointer group"
                                      title={`Click to copy OTP message #${mIdx + 1}`}
                                    >
                                      <ServiceLogo name={item.service} className="w-3.5 h-3.5 shrink-0" />
                                      <span>{codeStr}</span>
                                      <Copy className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* COUNTRY / OPERATOR COLUMN */}
                        <div className="col-span-4 space-y-0.5">
                          <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate">
                            {item.country}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center gap-1 truncate">
                            <span>{item.operator}</span>
                          </div>
                        </div>

                        {/* ACTIVITY COLUMN */}
                        <div className="col-span-3 text-right flex justify-end items-center">
                          <TimeAgoBadge
                            requestedAt={item.requestedAt || (item.id.startsWith("feed-") ? Number(item.id.replace("feed-", "")) : null)}
                            timeAgo={item.timeAgo}
                            status={item.status}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PAGINATION CONTROLS */}
              {totalFeedItems > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-mono">
                  <button
                    onClick={() => setFeedCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeFeedPage <= 1}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                  >
                    Prev
                  </button>
                  <span className="text-slate-400 font-semibold">
                    Page <span className="text-emerald-400 font-bold">{safeFeedPage}</span> of{" "}
                    <span className="text-white font-bold">{totalFeedPages}</span>
                  </span>
                  <button
                    onClick={() => setFeedCurrentPage((p) => Math.min(totalFeedPages, p + 1))}
                    disabled={safeFeedPage >= totalFeedPages}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OWNER DASHBOARD & MANAGEMENT TABS */}
        {(activeTab === "owner_dashboard" ||
          activeTab === "owner_agent_mgmt" ||
          activeTab === "owner_user_mgmt" ||
          activeTab === "owner_panel_mgmt" ||
          activeTab === "owner_number_file" ||
          activeTab === "owner_otp_mgmt" ||
          activeTab === "owner_rate_mgmt" ||
          activeTab === "owner_payment_mgmt") && (
          (isOwner || isAgent) ? (
            <OwnerDashboard
              userProfile={userProfile}
              feedNumbers={feedNumbers}
              currency={currency}
              usdExchangeRate={usdExchangeRate}
              activeSection={
                activeTab === "owner_agent_mgmt"
                  ? "agent_mgmt"
                  : activeTab === "owner_user_mgmt"
                  ? "user_mgmt"
                  : activeTab === "owner_panel_mgmt"
                  ? "panel_mgmt"
                  : activeTab === "owner_number_file"
                  ? "number_file"
                  : activeTab === "owner_otp_mgmt"
                  ? "otp_mgmt"
                  : activeTab === "owner_rate_mgmt"
                  ? "rate_mgmt"
                  : activeTab === "owner_payment_mgmt"
                  ? "payment_mgmt"
                  : "overview"
              }
              onNavigateTab={(t) => navigateToTab(t)}
              onUpdateUserBalance={(email, addAmt) => {
                if (userProfile && userProfile.email.toLowerCase() === email.toLowerCase()) {
                  setUserProfile((prev) => (prev ? { ...prev, balance: (prev.balance || 0) + addAmt } : null));
                }
              }}
            />
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <p className="text-rose-400 font-bold text-sm">Access Restricted: Owner role required.</p>
              <button
                onClick={() => navigateToTab("dashboard")}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Go to Client Dashboard
              </button>
            </div>
          )
        )}

        {/* OWNER TAB 2: OWNER SUMMARY */}
        {activeTab === "owner_summary" && (
          isOwner ? (
            <OwnerSummary
              userProfile={userProfile}
              feedNumbers={feedNumbers}
              currency={currency}
              usdExchangeRate={usdExchangeRate}
              onNavigateTab={(t) => navigateToTab(t)}
            />
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <p className="text-rose-400 font-bold text-sm">Access Restricted: Owner role required.</p>
              <button
                onClick={() => navigateToTab("dashboard")}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Go to Client Dashboard
              </button>
            </div>
          )
        )}

        {/* AGENT TAB 1: AGENT DASHBOARD */}
        {activeTab === "agent_dashboard" && (
          (isAgent || isOwner) ? (
            <AgentDashboard
              userProfile={userProfile}
              currency={currency}
              usdExchangeRate={usdExchangeRate}
              onNavigateTab={(t) => navigateToTab(t as any)}
            />
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <p className="text-rose-400 font-bold text-sm">Access Restricted: Agent role required.</p>
              <button
                onClick={() => navigateToTab("dashboard")}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Go to Client Dashboard
              </button>
            </div>
          )
        )}

        {/* AGENT TAB 2: AGENT SUMMARY */}
        {activeTab === "agent_summary" && (
          (isAgent || isOwner) ? (
            <SummaryDashboard
              currency={currency}
              usdExchangeRate={usdExchangeRate}
              feedNumbers={feedNumbers}
              userProfile={userProfile}
              onNavigateTab={(t) => navigateToTab(t as any)}
            />
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <p className="text-rose-400 font-bold text-sm">Access Restricted: Agent role required.</p>
              <button
                onClick={() => navigateToTab("dashboard")}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl"
              >
                Go to Client Dashboard
              </button>
            </div>
          )
        )}

        {/* CLIENT TAB 3.5: SUMMARY DASHBOARD */}
        {activeTab === "summary" && (
          <SummaryDashboard
            currency={currency}
            usdExchangeRate={usdExchangeRate}
            feedNumbers={feedNumbers}
            userProfile={userProfile}
            onNavigateTab={(t) => navigateToTab(t as any)}
          />
        )}

        {/* TAB 4: ORABITSMS API DOCUMENTATION */}
        {activeTab === "api" && (
          <OrabitApiDoc apiKey={apiKey} />
        )}

        {/* TAB 5: DOMAIN DNS SETTINGS */}
        {activeTab === "domain" && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  <span>Domain DNS & Namecheap Integration</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Configure custom domain routing for <strong className="text-emerald-400">{domainName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value.toLowerCase())}
                  placeholder="e.g. orabitsms.site"
                  className="bg-slate-950 border border-slate-700 text-xs px-3 py-1.5 rounded-xl font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>A Record (Root Domain @)</span>
                  <span className="text-emerald-400">199.36.158.100</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>CNAME Record (www)</span>
                  <span className="text-slate-200">{domainName}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: USER PROFILE */}
        {activeTab === "profile" && (
          <UserProfileView
            userProfile={userProfile}
            onUpdateProfile={(updated) => setUserProfile(updated)}
            onLogout={() => navigateToTab("logout")}
            currency={currency}
            usdExchangeRate={usdExchangeRate}
            isOwner={isOwner}
          />
        )}

        {/* TAB 7: PAYMENT & WALLET */}
        {activeTab === "payment" && (
          <OrabitPaymentWallet
            userProfile={userProfile}
            onUpdateBalance={(newBal) => setUserProfile({ ...userProfile, balance: newBal })}
            onUpdateProfile={(updated) => setUserProfile(updated)}
            currency={currency}
            usdExchangeRate={usdExchangeRate}
          />
        )}

        {/* TAB 8: LOGOUT PAGE */}
        {activeTab === "logout" && (
          <LogoutPage
            userProfile={userProfile}
            onConfirmLogout={async () => {
              await signOut();
            }}
            onCancel={() => navigateToTab("dashboard")}
            currency={currency}
            usdExchangeRate={usdExchangeRate}
          />
        )}
      </div>

      {/* CURRENCY SELECTOR MODAL */}
      {currencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#14192d] border border-slate-700/80 rounded-2xl p-6 max-w-md w-full text-slate-100 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
                  {currency === "BDT" ? "৳" : "$"}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Select Balance Currency</h3>
                  <p className="text-xs text-slate-400">Choose your preferred currency view</p>
                </div>
              </div>
              <button
                onClick={() => setCurrencyModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* BDT Option */}
              <div
                onClick={() => setCurrency("BDT")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  currency === "BDT"
                    ? "bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-emerald-400 w-8 text-center">৳</span>
                  <div>
                    <div className="font-bold text-sm text-slate-100">BDT - Bangladeshi Taka</div>
                    <p className="text-xs text-slate-400">Display balance in Bangladeshi Taka</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-400 text-sm">
                    ৳{userProfile.balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* USD Option */}
              <div
                onClick={() => setCurrency("USD")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                  currency === "USD"
                    ? "bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-cyan-400 w-8 text-center">$</span>
                  <div>
                    <div className="font-bold text-sm text-slate-100">USD - US Dollar</div>
                    <p className="text-xs text-slate-400">Converted at fixed rate 1 USD = ৳100 BDT</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-cyan-400 text-sm">
                    {formatBalanceDisplay(userProfile.balance, "USD")}
                  </span>
                </div>
              </div>
            </div>

            {/* Fixed Exchange Rate Info Badge */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Standard Fixed Rate:</span>
              <span className="text-slate-200 font-mono font-bold bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                1 USD = 100 BDT
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCurrencyModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                Save & Apply Currency
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Toast Notification */}
      {copiedText && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <div className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-[#0e1322]/95 border border-emerald-500/60 shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-slate-100 text-xs sm:text-sm font-bold font-mono">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs shrink-0">
              ✓
            </div>
            <span className="truncate max-w-[280px] sm:max-w-[450px]">{copiedText}</span>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-3 px-3 sm:px-6 text-center text-xs font-mono flex justify-center items-center">
        <div className="inline-flex items-center gap-2 sm:gap-2.5 py-1.5 px-3 sm:px-4 rounded-full bg-[#0b0f19]/90 border border-slate-800/90 backdrop-blur-md shadow-lg transition-all max-w-full overflow-x-auto whitespace-nowrap">
          <OrabitLogo size="xs" showSubtitle={false} />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-extrabold tracking-wide uppercase text-xs">
            Official
          </span>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-extrabold tracking-wide uppercase text-xs">
            All rights Reserved.
          </span>
        </div>
      </footer>
    </div>
    </ProtectedRoute>
  );
}
