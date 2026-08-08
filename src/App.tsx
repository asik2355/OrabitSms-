import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { OrabitAuthScreen, UserProfile } from "./components/OrabitAuthScreen";
import { UserProfileView } from "./components/UserProfileView";
import { OrabitPaymentWallet } from "./components/OrabitPaymentWallet";
import { OrabitApiDoc } from "./components/OrabitApiDoc";
import { OrabitLogo } from "./components/OrabitLogo";
import { ServiceLogo } from "./components/ServiceLogo";
import { LogoutPage } from "./components/LogoutPage";
import {
  Search,
  RefreshCw,
  Clock,
  History,
  Send,
  Bell,
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
}

function extractOtpFromText(rawText: string): string {
  if (!rawText) return "318215";

  // 1. Hyphenated 6-digit code e.g. "212-123" or "492-018"
  const hyphenated = rawText.match(/\b\d{3}-\d{3}\b/);
  if (hyphenated) return hyphenated[0];

  // 2. Prefixed code format e.g. "G-123456" or "FB-78291"
  const prefixedCode = rawText.match(/\b[A-Z]{1,3}-\d{4,8}\b/i);
  if (prefixedCode) return prefixedCode[0];

  // 3. Any 4 to 8 digit numbers in the text e.g. "318215", "782910"
  const digits = rawText.match(/\b\d{4,8}\b/);
  if (digits) return digits[0];

  // 4. Alphanumeric code (like ZBYKMCDOL)
  const alphaMatch = rawText.match(/\b[A-Z0-9]{5,10}\b/);
  if (alphaMatch) return alphaMatch[0];

  return "318215";
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

const GLOBAL_TRENDING = [
  { id: 1, name: "FACEBOOK", color: "#3b82f6", icon: "💬", hits: "4.8k" },
  { id: 2, name: "Facebook", color: "#60a5fa", icon: "💬", hits: "3.2k" },
  { id: 3, name: "WhatsApp", color: "#22c55e", icon: "🟢", hits: "2.9k" },
  { id: 4, name: "Telegram", color: "#38bdf8", icon: "✈️", hits: "2.1k" },
  { id: 5, name: "IMO", color: "#94a3b8", icon: "🛡️", hits: "1.4k" },
  { id: 6, name: "AUTHMSG", color: "#a855f7", icon: "🔐", hits: "1.1k" },
  { id: 7, name: "CloudOTP", color: "#ec4899", icon: "☁️", hits: "890" },
  { id: 8, name: "DISCORD", color: "#6366f1", icon: "🎮", hits: "750" },
  { id: 9, name: "alymscintl", color: "#64748b", icon: "🌐", hits: "620" },
  { id: 10, name: "fairpari", color: "#f59e0b", icon: "🎲", hits: "410" },
];

const INITIAL_MESSAGES: SmsMessage[] = [
  {
    id: "msg-1",
    time: "02:45:41 PM",
    operator: "Mobile",
    country: "GUINEA",
    countryIso: "gn",
    service: "INSTAGRAM",
    serviceColor: "bg-pink-950/80 text-pink-400 border-pink-500/30",
    number: "224677698XXX",
    otpCode: "*** ***",
    rawMessage: "<#> *** *** is your Instagram code. Don't share it. SIYRxKrru1t",
  },
  {
    id: "msg-2",
    time: "02:45:31 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "FACEBOOK",
    serviceColor: "bg-blue-950/80 text-blue-400 border-blue-500/30",
    number: "261388296XXX",
    otpCode: "*****",
    rawMessage: "<#> ***** is your Facebook code H29Q+Fsn4Sr",
  },
  {
    id: "msg-3",
    time: "02:45:26 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "FACEBOOK",
    serviceColor: "bg-blue-950/80 text-blue-400 border-blue-500/30",
    number: "261388222XXX",
    otpCode: "FB-*****",
    rawMessage: "<#> FB-***** is your Facebook confirmation code m.facebook.com #*****",
  },
  {
    id: "msg-4",
    time: "02:45:26 PM",
    operator: "Zain",
    country: "SAUDI ARABIA",
    countryIso: "sa",
    service: "WHATSAPP",
    serviceColor: "bg-emerald-950/80 text-emerald-400 border-emerald-500/30",
    number: "966582926XXX",
    otpCode: "***-***",
    rawMessage: "<#> Your WhatsApp code: ***-*** Don't share this code with others 4sgLq1p5sV6",
  },
  {
    id: "msg-5",
    time: "02:45:16 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "FACEBOOK",
    serviceColor: "bg-blue-950/80 text-blue-400 border-blue-500/30",
    number: "261344563XXX",
    otpCode: "*****",
    rawMessage: "<#> ***** is your Facebook code H29Q+Fsn4Sr",
  },
  {
    id: "msg-6",
    time: "02:44:56 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "FACEBOOK",
    serviceColor: "bg-blue-950/80 text-blue-400 border-blue-500/30",
    number: "261344865XXX",
    otpCode: "*****",
    rawMessage: "<#> ***** is your Facebook code H29Q+Fsn4Sr",
  },
  {
    id: "msg-7",
    time: "02:44:56 PM",
    operator: "Babilon-M",
    country: "TAJIKISTAN",
    countryIso: "tj",
    service: "FACEBOOK",
    serviceColor: "bg-blue-950/80 text-blue-400 border-blue-500/30",
    number: "992778178XXX",
    otpCode: "*****",
    rawMessage: "<#> ***** is your Facebook code H29Q+Fsn4Sr",
  },
  {
    id: "msg-8",
    time: "02:44:51 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "FACEBOOK",
    serviceColor: "bg-blue-950/80 text-blue-400 border-blue-500/30",
    number: "261344202XXX",
    otpCode: "*****",
    rawMessage: "<#> ***** is your Facebook code H29Q+Fsn4Sr",
  },
];

const INITIAL_FEEDS: FeedNumber[] = [];

export default function App() {
  const [domainName, setDomainName] = useState("orabitsms.site");
  
  // Persistent User Profile from LocalStorage
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("orabit_user_profile");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load user profile from storage", e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "console" | "getnum" | "api" | "domain" | "profile" | "payment" | "logout">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<SmsMessage[]>(INITIAL_MESSAGES);
  const [feedNumbers, setFeedNumbers] = useState<FeedNumber[]>(INITIAL_FEEDS);
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
  const [targetRange, setTargetRange] = useState("22507XXX");
  const [isNational, setIsNational] = useState(false);
  const [noPlus, setNoPlus] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState<string | null>(null);

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

  useEffect(() => {
    try {
      localStorage.setItem("orabit_currency", currency);
    } catch (e) {
      console.error(e);
    }
  }, [currency]);

  // UTC Clock
  const [utcTime, setUtcTime] = useState("");

  // Save profile state to localStorage whenever it updates
  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem("orabit_user_profile", JSON.stringify(userProfile));
      } else {
        localStorage.removeItem("orabit_user_profile");
      }
    } catch (e) {
      console.error("Failed to save user profile to storage", e);
    }
  }, [userProfile]);

  // Navigate to tab with browser URL history update
  const navigateToTab = (tab: "dashboard" | "console" | "getnum" | "api" | "domain" | "profile" | "payment" | "logout") => {
    setActiveTab(tab);
    try {
      if (userProfile) {
        const path = tab === "dashboard" ? "/dashboard" : `/${tab}`;
        if (window.location.pathname !== path) {
          window.history.pushState({ tab }, "", path);
        }
      }
    } catch {
      // Ignore location history errors in isolated frames
    }
  };

  // Sync route on mount and window popstate (browser back/forward or direct link access)
  useEffect(() => {
    const syncRouteFromPath = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        if (userProfile) {
          if (path === "/profile") setActiveTab("profile");
          else if (path === "/payment" || path === "/wallet") setActiveTab("payment");
          else if (path === "/getnum" || path === "/get-number") setActiveTab("getnum");
          else if (path === "/console") setActiveTab("console");
          else if (path === "/api" || path === "/apidocs") setActiveTab("api");
          else if (path === "/domain") setActiveTab("domain");
          else if (path === "/logout" || path === "/signout") setActiveTab("logout");
          else {
            setActiveTab("dashboard");
            if (path !== "/dashboard") {
              window.history.replaceState({ tab: "dashboard" }, "", "/dashboard");
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
  }, [userProfile]);

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

  // Live Auto Sync Loop - Simulates incoming global OTP traffic in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoSyncSeconds((prev) => {
        if (prev <= 1) {
          const serviceTemplates = [
            { name: "FACEBOOK", color: "bg-blue-950/80 text-blue-400 border-blue-500/30", raw: "<#> 318215 is your Facebook confirmation code Laz+nxCarLW" },
            { name: "WHATSAPP", color: "bg-emerald-950/80 text-emerald-400 border-emerald-500/30", raw: "212-123 is your WhatsApp code" },
            { name: "WHATSAPP", color: "bg-emerald-950/80 text-emerald-400 border-emerald-500/30", raw: "<#> Your WhatsApp code: 492-018 Don't share this code with others 4sgLq1p5sV6" },
            { name: "FACEBOOK", color: "bg-blue-950/80 text-blue-400 border-blue-500/30", raw: "<#> 782910 is your Facebook verification code H29Q+Fsn4Sr" },
            { name: "INSTAGRAM", color: "bg-pink-950/80 text-pink-400 border-pink-500/30", raw: "<#> ZBYKMCDOL is your Instagram code. Don't share it. SIYRxKrru1t" },
            { name: "TELEGRAM", color: "bg-sky-950/80 text-sky-400 border-sky-500/30", raw: "<#> Telegram code: 849-201 Do not share this code with anyone." },
            { name: "IMO", color: "bg-cyan-950/80 text-cyan-400 border-cyan-500/30", raw: "<#> IMO verification code: 593-102. Keep it private." },
          ];

          const locations = [
            { country: "GUINEA", iso: "gn", operators: ["Mobile", "Orange"], prefix: "224" },
            { country: "MADAGASCAR", iso: "mg", operators: ["Airtel", "Telma"], prefix: "261" },
            { country: "SAUDI ARABIA", iso: "sa", operators: ["Zain", "STC"], prefix: "966" },
            { country: "TAJIKISTAN", iso: "tj", operators: ["Babilon-M", "Tcell"], prefix: "992" },
            { country: "BANGLADESH", iso: "bd", operators: ["Grameenphone", "Robi"], prefix: "880" },
            { country: "MONTENEGRO", iso: "me", operators: ["Telenor", "One"], prefix: "382" },
          ];

          const s = serviceTemplates[Math.floor(Math.random() * serviceTemplates.length)];
          const loc = locations[Math.floor(Math.random() * locations.length)];
          const op = loc.operators[Math.floor(Math.random() * loc.operators.length)];
          const randNum = loc.prefix + Math.floor(100000 + Math.random() * 900000) + "XXX";
          const nowTime = new Date().toLocaleTimeString("en-US", { hour12: true });

          const newMsg: SmsMessage = {
            id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
            time: nowTime,
            operator: op,
            country: loc.country,
            countryIso: loc.iso,
            service: s.name,
            serviceColor: s.color,
            number: randNum,
            otpCode: extractOtpFromText(s.raw),
            rawMessage: s.raw,
          };

          setMessages((prev) => [newMsg, ...prev.slice(0, 19)]);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleGetNumber = async () => {
    setProvisioning(true);
    setProvisionMsg("Connecting to Voltx, Stex & Zenex Core Routing Engine...");

    try {
      const res = await fetch("/api/sms/getnum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRange, isNational, noPlus }),
      });
      const data = await res.json();

      if (data && data.success) {
        const formattedNumber = data.number;
        const providerName = data.provider || "CORE";
        const detectedCountry = data.country || "Global";
        const detectedOperator = data.operator || "Orange";

        try {
          await navigator.clipboard.writeText(formattedNumber);
        } catch (e) {
          console.error("Auto copy failed", e);
        }

        setCopiedText(`Copied ${formattedNumber}`);
        setTimeout(() => setCopiedText(null), 3000);

        const newItemId = "feed-" + Date.now();
        const rawDigits = formattedNumber.replace(/^\+/, "");
        const newFeedItem: FeedNumber = {
          id: newItemId,
          number: rawDigits,
          status: "PENDING",
          country: detectedCountry,
          operator: detectedOperator,
          timeAgo: "just now",
          service: "INSTAGRAM",
        };

        setFeedNumbers((prev) => [newFeedItem, ...prev]);
        setProvisioning(false);
        setProvisionMsg(`Provisioned Number: ${formattedNumber} [${providerName}]`);
        setTimeout(() => setProvisionMsg(null), 4000);

        // Fetch OTP from Voltx/Stex/Zenex APIs
        setTimeout(async () => {
          try {
            const otpRes = await fetch("/api/sms/fetch-otp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ number: formattedNumber }),
            });
            const otpData = await otpRes.json();

            if (otpData && otpData.success) {
              setFeedNumbers((prev) =>
                prev.map((item) => {
                  if (item.id === newItemId) {
                    return {
                      ...item,
                      status: "SUCCESS",
                      service: otpData.service || "INSTAGRAM",
                      otpCode: otpData.otpCode || "318215",
                      rawMessage: otpData.rawMessage,
                      timeAgo: "just now",
                    };
                  }
                  return item;
                })
              );
            }
          } catch (e) {
            console.error("OTP fetch error", e);
          }
        }, 3000);
      } else {
        throw new Error("Failed to fetch number");
      }
    } catch (err) {
      console.error("Get Number failed:", err);
      setProvisioning(false);
      setProvisionMsg("Failed to provision number");
      setTimeout(() => setProvisionMsg(null), 4000);
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
    return f.status === feedFilter;
  });

  const appStats = React.useMemo(() => {
    if (!messages || messages.length === 0) {
      return [
        { name: "FACEBOOK", count: 41, percent: "82%", color: "#3b82f6" },
        { name: "Facebook", count: 4, percent: "8%", color: "#a855f7" },
        { name: "WhatsApp", count: 4, percent: "8%", color: "#eab308" },
        { name: "IMO", count: 1, percent: "2%", color: "#10b981" },
      ];
    }
    const counts: Record<string, number> = {};
    messages.forEach((m) => {
      const s = m.service || "OTHER";
      counts[s] = (counts[s] || 0) + 1;
    });
    const total = messages.length;
    const colors = ["#3b82f6", "#a855f7", "#eab308", "#10b981", "#ec4899", "#38bdf8"];
    const list = Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percent: Math.round((count / total) * 100) + "%",
      color: colors[idx % colors.length],
    }));
    list.sort((a, b) => b.count - a.count);
    return list.length > 0 ? list : [
      { name: "FACEBOOK", count: 41, percent: "82%", color: "#3b82f6" },
      { name: "Facebook", count: 4, percent: "8%", color: "#a855f7" },
      { name: "WhatsApp", count: 4, percent: "8%", color: "#eab308" },
      { name: "IMO", count: 1, percent: "2%", color: "#10b981" },
    ];
  }, [messages]);

  const carrierStats = React.useMemo(() => {
    if (!messages || messages.length === 0) {
      return [
        { name: "Airtel", count: 40, percent: "80%", color: "#10b981" },
        { name: "Zain", count: 4, percent: "8%", color: "#3b82f6" },
        { name: "Orange (Airtel)", count: 2, percent: "4%", color: "#a855f7" },
        { name: "Togo Cellulaire (Togocel)", count: 2, percent: "4%", color: "#eab308" },
        { name: "Mobile", count: 1, percent: "2%", color: "#ef4444" },
      ];
    }
    const counts: Record<string, number> = {};
    messages.forEach((m) => {
      const op = m.operator || "Other";
      counts[op] = (counts[op] || 0) + 1;
    });
    const total = messages.length;
    const colors = ["#10b981", "#3b82f6", "#a855f7", "#eab308", "#ef4444", "#64748b"];
    const list = Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percent: Math.round((count / total) * 100) + "%",
      color: colors[idx % colors.length],
    }));
    list.sort((a, b) => b.count - a.count);
    return list.length > 0 ? list : [
      { name: "Airtel", count: 40, percent: "80%", color: "#10b981" },
      { name: "Zain", count: 4, percent: "8%", color: "#3b82f6" },
      { name: "Orange (Airtel)", count: 2, percent: "4%", color: "#a855f7" },
      { name: "Togo Cellulaire (Togocel)", count: 2, percent: "4%", color: "#eab308" },
      { name: "Mobile", count: 1, percent: "2%", color: "#ef4444" },
    ];
  }, [messages]);

  if (!userProfile) {
    return (
      <OrabitAuthScreen
        onLoginSuccess={(u) => setUserProfile(u)}
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
          onConfirmLogout={() => {
            try {
              localStorage.removeItem("orabit_user_profile");
              window.history.pushState({}, "", "/login");
            } catch (e) {
              console.error(e);
            }
            setUserProfile(null);
          }}
          onCancel={() => navigateToTab("dashboard")}
          currency={currency}
          usdExchangeRate={usdExchangeRate}
        />
      </div>
    );
  }

  return (
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
            onClick={() => setActiveTab("dashboard")}
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
              {currency === "BDT"
                ? `৳${userProfile.balance.toFixed(2)}`
                : `$${(userProfile.balance / usdExchangeRate).toFixed(2)}`}
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

            {/* Main Active Pill: Dashboard */}
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

            {/* Section 1: Dialer Panel */}
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
            </div>

            {/* Section 2: Account */}
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
                    {currency === "BDT" ? `৳${(0.01 * usdExchangeRate).toFixed(2)}` : "$0.01"}
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
                    1
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
                    {currency === "BDT" ? "৳0.00" : "$0.00"}
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
                    0
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
                      {messages.length > 0 ? (
                        <>
                          <tr className="hover:bg-slate-800/50 hover:scale-[1.005] transition-all duration-200 cursor-pointer">
                            <td className="py-3 px-3 flex items-center gap-3">
                              <ServiceLogo name="WhatsApp" size={32} className="w-8 h-8" />
                              <span className="font-bold text-slate-100 text-sm">WhatsApp</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200 text-sm">6</td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold text-sm">
                              {currency === "BDT" ? "৳0.00" : "$0.00"}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/50 hover:scale-[1.005] transition-all duration-200 cursor-pointer">
                            <td className="py-3 px-3 flex items-center gap-3">
                              <ServiceLogo name="Facebook" size={32} className="w-8 h-8" />
                              <span className="font-bold text-slate-100 text-sm">Facebook</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200 text-sm">14</td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold text-sm">
                              {currency === "BDT" ? "৳12.00" : "$0.12"}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/50 hover:scale-[1.005] transition-all duration-200 cursor-pointer">
                            <td className="py-3 px-3 flex items-center gap-3">
                              <ServiceLogo name="Telegram" size={32} className="w-8 h-8" />
                              <span className="font-bold text-slate-100 text-sm">Telegram</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200 text-sm">8</td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold text-sm">
                              {currency === "BDT" ? "৳8.00" : "$0.08"}
                            </td>
                          </tr>
                        </>
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
                    <h3 className="font-bold text-base text-white">Global Trending</h3>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-mono">
                    ● Live
                  </span>
                </div>

                <div className="space-y-2">
                  {GLOBAL_TRENDING.map((item) => (
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
                  ))}
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
                  <BarChart data={appStats} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
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
                      {appStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Apps Legend List with Service Logos (1 item per line) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                {appStats.map((item, idx) => (
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
                {filteredMessages.map((msg, idx) => {
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

                      {/* Middle Row: Country in Emerald :: Masked Phone Number */}
                      <div className="flex items-center gap-1.5 font-mono">
                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase tracking-wider bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span>{msg.country}</span>
                        </div>
                        <span className="text-slate-600 font-bold text-[10px] me-0.5">::</span>
                        <span className="text-slate-100 font-bold text-xs tracking-wider">{msg.number}</span>
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
                <span>Logs: {filteredMessages.length} (Max 50)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GET NUMBER & RANGE FEED (Matching Screenshots) */}
        {activeTab === "getnum" && (
          <div className="space-y-5">
            {/* TOP CARD: ENTER NUMBER RANGE */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#111524] border border-slate-800/90 space-y-4 shadow-xl">
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

              {/* Get Number Button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleGetNumber}
                  disabled={provisioning}
                  className="bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <PhoneCall className={`w-4 h-4 fill-slate-950 ${provisioning ? "animate-spin" : ""}`} />
                  <span>{provisioning ? "Connecting..." : "Get Number"}</span>
                </button>
              </div>
            </div>

            {/* LOWER TABLE / LIST CARD */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#111524] border border-slate-800/90 space-y-3 shadow-xl min-h-[320px]">
              {/* Header Bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-1 border-b border-slate-800/70">
                <span>
                  {feedNumbers.length === 0 ? "No results" : `1-${feedNumbers.length} of ${feedNumbers.length}`}
                </span>
                <button
                  onClick={() => setFeedNumbers((prev) => [...prev])}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-slate-400" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Table Column Titles */}
              <div className="grid grid-cols-12 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                <div className="col-span-5 sm:col-span-5">NUMBER INFO</div>
                <div className="col-span-4 sm:col-span-4">COUNTRY / OPERATOR</div>
                <div className="col-span-3 sm:col-span-3 text-right">ACTIVITY</div>
              </div>

              {/* EMPTY STATE - Shown when feedNumbers length is 0 */}
              {feedNumbers.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <Ghost className="w-12 h-12 text-slate-600/80 stroke-[1.5]" />
                  <p className="text-slate-500 text-xs font-mono font-medium">
                    No numbers found for this date
                  </p>
                </div>
              ) : (
                /* LIST OF REQUESTED NUMBERS */
                <div className="space-y-2 pt-1">
                  {feedNumbers.map((item) => {
                    const displayNum = noPlus ? item.number : (item.number.startsWith("+") ? item.number : `+${item.number}`);
                    return (
                      <div
                        key={item.id}
                        className="p-3 sm:p-3.5 rounded-xl bg-[#090d18] border border-slate-800/80 hover:border-slate-700 transition-all grid grid-cols-12 items-center gap-2"
                      >
                        {/* NUMBER INFO COLUMN */}
                        <div className="col-span-5 space-y-1">
                          <div className="font-mono text-xs sm:text-sm font-extrabold text-white tracking-wider flex items-center gap-1.5">
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
                              className={`text-[9px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                item.status === "FAILED"
                                  ? "bg-rose-950/80 text-rose-400 border border-rose-800/60"
                                  : item.status === "SUCCESS"
                                  ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
                                  : "bg-amber-950/80 text-amber-400 border border-amber-800/60 animate-pulse"
                              }`}
                            >
                              {item.status}
                            </span>

                            {/* OTP KEY CODE PILL & COPY FULL MESSAGE BUTTON */}
                            {item.status === "SUCCESS" && item.otpCode && (
                              <button
                                onClick={() => {
                                  const msgToCopy = item.rawMessage || `<#> ${item.otpCode} is your verification code`;
                                  copyToClipboard(msgToCopy, `Copied ${msgToCopy}`);
                                }}
                                className="inline-flex items-center gap-1.5 bg-[#121829] border border-amber-500/40 hover:border-amber-400 px-2 py-0.5 rounded-md text-amber-300 font-mono font-bold text-[10px] shadow-sm transition-all cursor-pointer group"
                                title="Click to copy full raw message"
                              >
                                <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>{item.otpCode}</span>
                                <Copy className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* COUNTRY / OPERATOR COLUMN */}
                        <div className="col-span-4 space-y-0.5">
                          <div className="text-xs font-bold text-slate-200">
                            {item.country}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span className="text-cyan-400 font-bold">((o))</span>
                            <span>{item.operator}</span>
                          </div>
                        </div>

                        {/* ACTIVITY COLUMN */}
                        <div className="col-span-3 text-right">
                          <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded">
                            {item.timeAgo}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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
          />
        )}

        {/* TAB 7: PAYMENT & WALLET */}
        {activeTab === "payment" && (
          <OrabitPaymentWallet
            userProfile={userProfile}
            onUpdateBalance={(newBal) => setUserProfile({ ...userProfile, balance: newBal })}
            currency={currency}
            usdExchangeRate={usdExchangeRate}
          />
        )}

        {/* TAB 8: LOGOUT PAGE */}
        {activeTab === "logout" && (
          <LogoutPage
            userProfile={userProfile}
            onConfirmLogout={() => {
              try {
                localStorage.removeItem("orabit_user_profile");
                window.history.pushState({}, "", "/login");
              } catch (e) {
                console.error(e);
              }
              setUserProfile(null);
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
                    ${(userProfile.balance / usdExchangeRate).toFixed(2)}
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
  );
}
