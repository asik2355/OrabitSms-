import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { OrabitAuthScreen, UserProfile } from "./components/OrabitAuthScreen";
import { UserProfileView } from "./components/UserProfileView";
import { OrabitLogo } from "./components/OrabitLogo";
import {
  Search,
  RefreshCw,
  Clock,
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
    time: "09:25:24 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "FACEBOOK",
    serviceColor: "bg-blue-600",
    number: "261344342XXX",
    otpCode: "H29Q+Fsn4Sr",
    rawMessage: "<#> ***** is your Facebook code H29Q+Fsn4Sr",
  },
  {
    id: "msg-2",
    time: "09:25:24 PM",
    operator: "Telenor",
    country: "MONTENEGRO",
    countryIso: "me",
    service: "FACEBOOK",
    serviceColor: "bg-blue-600",
    number: "38267126XXX",
    otpCode: "Laz+nxCarLW",
    rawMessage: "<#> ******** is your Facebook code Laz+nxCarLW",
  },
  {
    id: "msg-3",
    time: "09:25:09 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "INSTAGRAM",
    serviceColor: "bg-pink-600",
    number: "261344849XXX",
    otpCode: "SIYRxKrru1t",
    rawMessage: "<#> *** *** is your Instagram code. Don't share it. SIYRxKrru1t",
  },
  {
    id: "msg-4",
    time: "09:25:09 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "FACEBOOK",
    serviceColor: "bg-blue-600",
    number: "261344296XXX",
    otpCode: "H29Q+Fsn4Sr",
    rawMessage: "<#> ***** ny kaody Facebook-nao H29Q+Fsn4Sr",
  },
  {
    id: "msg-5",
    time: "09:25:09 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "FACEBOOK",
    serviceColor: "bg-blue-600",
    number: "261344205XXX",
    otpCode: "H29Q+Fsn4Sr",
    rawMessage: "<#> ***** is your Facebook code H29Q+Fsn4Sr",
  },
  {
    id: "msg-6",
    time: "09:25:09 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "WHATSAPP",
    serviceColor: "bg-emerald-600",
    number: "261344441XXX",
    otpCode: "492-810",
    rawMessage: "Your WhatsApp code is: 492-810. You can also tap on the link to verify.",
  },
  {
    id: "msg-7",
    time: "09:25:09 PM",
    operator: "Airtel",
    country: "MADAGASCAR",
    countryIso: "mg",
    service: "TELEGRAM",
    serviceColor: "bg-sky-600",
    number: "261344479XXX",
    otpCode: "71932",
    rawMessage: "Telegram code: 71932. Do not share this code with anyone.",
  },
];

const INITIAL_FEEDS: FeedNumber[] = [
  {
    id: "feed-1",
    number: "261349315165",
    status: "FAILED",
    country: "MADAGASCAR",
    operator: "AIRTEL",
    timeAgo: "35 min ago",
    service: "FACEBOOK",
  },
  {
    id: "feed-2",
    number: "261349315542",
    status: "FAILED",
    country: "MADAGASCAR",
    operator: "AIRTEL",
    timeAgo: "35 min ago",
    service: "WHATSAPP",
  },
  {
    id: "feed-3",
    number: "261349315224",
    status: "FAILED",
    country: "MADAGASCAR",
    operator: "AIRTEL",
    timeAgo: "35 min ago",
    service: "TELEGRAM",
  },
  {
    id: "feed-4",
    number: "447384561029",
    status: "SUCCESS",
    country: "UNITED KINGDOM",
    operator: "VODAFONE",
    timeAgo: "2 min ago",
    service: "INSTAGRAM",
  },
];

export default function App() {
  const [domainName, setDomainName] = useState("orabitsms.site");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "console" | "getnum" | "api" | "domain" | "profile">("dashboard");
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
  const [targetRange, setTargetRange] = useState("23276345XXX");
  const [isNational, setIsNational] = useState(false);
  const [noPlus, setNoPlus] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState<string | null>(null);

  // API Tester & Key
  const [apiKey, setApiKey] = useState("ZX_DEMO_KEY_8923741");

  // Currency preference state
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const usdExchangeRate = 100; // Fixed rate: 1 USD = 100 BDT
  const [currencyModalOpen, setCurrencyModalOpen] = useState<boolean>(false);

  // UTC Clock
  const [utcTime, setUtcTime] = useState("");

  // URL Route sync for /dashboard and /login
  useEffect(() => {
    try {
      if (userProfile) {
        if (window.location.pathname !== "/dashboard") {
          window.history.pushState({}, "", "/dashboard");
        }
      } else {
        if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
          window.history.pushState({}, "", "/login");
        }
      }
    } catch {
      // Ignore location state errors in isolated sandbox
    }
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

  // Live Auto Sync Loop - Simulates incoming OTP traffic in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoSyncSeconds((prev) => {
        if (prev <= 1) {
          const randomServices = [
            { name: "FACEBOOK", color: "bg-blue-600", text: "is your Facebook code" },
            { name: "INSTAGRAM", color: "bg-pink-600", text: "is your Instagram code. Don't share it." },
            { name: "WHATSAPP", color: "bg-emerald-600", text: "WhatsApp verification code:" },
            { name: "TELEGRAM", color: "bg-sky-600", text: "Telegram code:" },
          ];
          const s = randomServices[Math.floor(Math.random() * randomServices.length)];
          const randCode = Math.floor(100000 + Math.random() * 900000).toString();
          const randNum = "26134" + Math.floor(100000 + Math.random() * 900000) + "XXX";
          const nowTime = new Date().toLocaleTimeString("en-US", { hour12: true });

          const newMsg: SmsMessage = {
            id: "msg-" + Date.now(),
            time: nowTime,
            operator: Math.random() > 0.5 ? "Airtel" : "Telenor",
            country: Math.random() > 0.5 ? "MADAGASCAR" : "MONTENEGRO",
            countryIso: "mg",
            service: s.name,
            serviceColor: s.color,
            number: randNum,
            otpCode: randCode,
            rawMessage: `<#> ${randCode} ${s.text}`,
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

  const handleGetNumber = () => {
    setProvisioning(true);
    setProvisionMsg("Connecting to Zenex Core Routing Engine...");
    setTimeout(() => {
      const generated = "26134" + Math.floor(1000000 + Math.random() * 9000000);
      const newFeedItem: FeedNumber = {
        id: "feed-" + Date.now(),
        number: generated,
        status: "PENDING",
        country: "MADAGASCAR",
        operator: "AIRTEL",
        timeAgo: "Just now",
        service: targetRange.toUpperCase() || "SMS_OTP",
      };

      setFeedNumbers((prev) => [newFeedItem, ...prev]);
      setProvisioning(false);
      setProvisionMsg(`Successfully Provisioned Number: +${generated}`);
      setTimeout(() => setProvisionMsg(null), 4000);
    }, 1200);
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

  if (!userProfile) {
    return (
      <OrabitAuthScreen
        onLoginSuccess={(u) => setUserProfile(u)}
        domainName={domainName}
      />
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
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-cyan-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{utcTime || "15:25:49 UTC+0"}</span>
          </div>

          {/* Account Balance */}
          <button
            onClick={() => setCurrencyModalOpen(true)}
            title="Click to select currency (BDT ৳ / USD $)"
            className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-bold text-xs px-2 sm:px-3 py-1.5 rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-sm shadow-emerald-950/50 hover:border-emerald-400 hover:bg-emerald-900/60 active:scale-95 transition-all cursor-pointer group"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono">
              {currency === "BDT"
                ? `৳${userProfile.balance.toFixed(2)}`
                : `$${(userProfile.balance / usdExchangeRate).toFixed(2)}`}
            </span>
            <span className="text-[10px] bg-emerald-500/20 px-1 sm:px-1.5 py-0.5 rounded text-emerald-300 font-mono uppercase">
              {currency}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-emerald-400/70 group-hover:text-emerald-300 transition-transform" />
          </button>

          {/* User Profile Badge (Clicking opens Profile view) */}
          <div className="flex items-center gap-2">
            <div
              onClick={() => setActiveTab("profile")}
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
                  setActiveTab("dashboard");
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
                  setActiveTab("getnum");
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
                  setActiveTab("console");
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
                  setActiveTab("profile");
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
                  alert(`Current Balance: ৳${userProfile.balance.toFixed(2)}`);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all"
              >
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span>Payment</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm("Do you want to log out of your account?")) {
                    setUserProfile(null);
                  }
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-all"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="group p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 space-y-2 relative shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                    <span className="group-hover:text-emerald-300 transition-colors">TODAY REVENUE</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                      <Zap className="w-4 h-4 animate-pulse" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white font-mono group-hover:text-emerald-300 transition-colors">
                    {currency === "BDT" ? "৳0.00" : "$0.00"}
                  </div>
                  <div className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">Earnings from successful OTPs</div>
                </div>

                <div className="group p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/40 space-y-2 relative shadow-md hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                    <span className="group-hover:text-blue-300 transition-colors">TODAY OTPS</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white font-mono group-hover:text-blue-300 transition-colors">6</div>
                  <div className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">Total successful verifications</div>
                </div>

                <div className="group p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 space-y-2 relative shadow-md hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
                    <span className="group-hover:text-purple-300 transition-colors">YESTERDAY REVENUE</span>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
                      <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white font-mono group-hover:text-purple-300 transition-colors">
                    {currency === "BDT" ? `৳${(0.24 * usdExchangeRate).toFixed(2)}` : "$0.24"}
                  </div>
                  <div className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">Previous day performance</div>
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
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shadow-sm">
                                🟢
                              </div>
                              <span className="font-semibold text-slate-100">WhatsApp</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200">6</td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                              {currency === "BDT" ? "৳0.00" : "$0.00"}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/50 hover:scale-[1.005] transition-all duration-200 cursor-pointer">
                            <td className="py-3 px-3 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold shadow-sm">
                                💬
                              </div>
                              <span className="font-semibold text-slate-100">Facebook</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200">14</td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                              {currency === "BDT" ? "৳12.00" : "$0.12"}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/50 hover:scale-[1.005] transition-all duration-200 cursor-pointer">
                            <td className="py-3 px-3 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold shadow-sm">
                                ✈️
                              </div>
                              <span className="font-semibold text-slate-100">Telegram</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200">8</td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
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
                        <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>{item.icon}</span>
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

        {/* TAB 2: LIVE SMS TRAFFIC CONSOLE (Matching Screenshot 5) */}
        {activeTab === "console" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h2 className="font-bold text-sm text-white">Realtime SMS & OTP Stream Feed</h2>
                <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-mono">
                  {filteredMessages.length} Messages
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(messages, null, 2), "console-json")}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  {copiedText === "console-json" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === "console-json" ? "JSON Copied!" : "Export Console Logs"}</span>
                </button>
              </div>
            </div>

            {/* SMS Live Message Cards Stream */}
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 font-mono text-slate-400">
                      <span className="text-amber-400 font-bold">{msg.time}</span>
                      <span>•</span>
                      <span className="text-slate-200">{msg.operator}</span>
                      <span>•</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        🌍 {msg.country}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold text-white px-2.5 py-0.5 rounded-md uppercase tracking-wider ${msg.serviceColor}`}>
                      {msg.service}
                    </span>
                  </div>

                  {/* Number & OTP Code Info Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-white tracking-wider">
                        {msg.number}
                      </span>
                      <button
                        onClick={() => copyToClipboard(msg.number, msg.id + "-num")}
                        className="text-[11px] bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-0.5 rounded font-mono flex items-center gap-1"
                      >
                        {copiedText === msg.id + "-num" ? "Copied" : "Copy Number"}
                      </button>
                    </div>

                    <div className="bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-emerald-400 font-mono text-xs font-bold">
                      OTP: {msg.otpCode}
                    </div>
                  </div>

                  {/* SMS Raw Payload Body */}
                  <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl font-mono text-xs text-slate-300 leading-relaxed flex items-center justify-between">
                    <span>{msg.rawMessage}</span>
                    <button
                      onClick={() => copyToClipboard(msg.rawMessage, msg.id + "-raw")}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Copy raw message"
                    >
                      {copiedText === msg.id + "-raw" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GET NUMBER & RANGE FEED (Matching Screenshot 4) */}
        {activeTab === "getnum" && (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center shadow-md">
                <div className="text-[10px] text-slate-400 font-bold uppercase">TOTAL</div>
                <div className="text-lg font-bold font-mono text-slate-100 mt-1">59</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center shadow-md">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">SUCCESS</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">0</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center shadow-md">
                <div className="text-[10px] text-amber-400 font-bold uppercase">WAIT</div>
                <div className="text-lg font-bold font-mono text-amber-400 mt-1">0</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center shadow-md">
                <div className="text-[10px] text-rose-400 font-bold uppercase">FAILED</div>
                <div className="text-lg font-bold font-mono text-rose-400 mt-1">59</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center col-span-2 sm:col-span-1 shadow-md">
                <div className="text-[10px] text-blue-400 font-bold uppercase">SUCCESS RATE</div>
                <div className="text-lg font-bold font-mono text-blue-400 mt-1">0.0%</div>
              </div>
            </div>

            {/* Provision Number Form */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <h3 className="font-bold text-sm text-slate-200">TARGET RANGE / CODE PROVISIONING</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    TARGET RANGE / CODE
                  </label>
                  <input
                    type="text"
                    value={targetRange}
                    onChange={(e) => setTargetRange(e.target.value)}
                    placeholder="e.g. 23276345XXX"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNational}
                      onChange={(e) => setIsNational(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>National</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noPlus}
                      onChange={(e) => setNoPlus(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>No (+)</span>
                  </label>
                </div>

                {provisionMsg && (
                  <div className="p-3 bg-blue-950/80 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-mono">
                    {provisionMsg}
                  </div>
                )}

                <button
                  onClick={handleGetNumber}
                  disabled={provisioning}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <PhoneCall className={`w-4 h-4 ${provisioning ? "animate-spin" : ""}`} />
                  <span>{provisioning ? "PROVISIONING..." : "📱 GET NUMBER"}</span>
                </button>
              </div>
            </div>

            {/* Feed List Box */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h3 className="font-bold text-sm text-white">FEED</h3>
                  <button
                    onClick={() => setFeedNumbers((prev) => [...prev])}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  {(["ALL", "SUCCESS", "PENDING", "FAILED"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFeedFilter(st)}
                      className={`px-2.5 py-1 rounded ${
                        feedFilter === st
                          ? "bg-slate-800 text-white font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed Items */}
              <div className="space-y-3">
                {filteredFeed.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-bold text-white tracking-wider">
                        {item.number}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Timeout • {item.timeAgo}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          item.status === "FAILED"
                            ? "bg-rose-950 text-rose-400 border border-rose-800/60"
                            : item.status === "SUCCESS"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                            : "bg-amber-950 text-amber-400 border border-amber-800/60"
                        }`}
                      >
                        {item.status}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.country} • {item.operator}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ZENEX CORE API DOCUMENTATION */}
        {activeTab === "api" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
              <h2 className="font-extrabold text-base text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <span>ZENEX CORE API DOCUMENTATION - V4.0</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Base URL: <code className="bg-slate-950 px-2 py-0.5 rounded text-emerald-400 font-mono">https://api.zenexnetwork.com</code> | Auth Header: <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-400 font-mono">mapikey: {apiKey}</code>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-md">
                <span className="text-xs font-bold text-emerald-400 font-mono">1. POST /v1/getnum</span>
                <p className="text-xs text-slate-400">Instantly provisions virtual numbers with custom range filters.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-md">
                <span className="text-xs font-bold text-emerald-400 font-mono">2. GET /v1/numsuccess/info</span>
                <p className="text-xs text-slate-400">Polls incoming OTP messages cache-free (suggested polling rate: 3-5s).</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-md">
                <span className="text-xs font-bold text-emerald-400 font-mono">3. GET /v1/active-ranges</span>
                <p className="text-xs text-slate-400">Exports global live routing matrix and hit rates for active services.</p>
              </div>
            </div>

            {/* Node.js Code Sample */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs shadow-xl">
              <div className="flex justify-between items-center text-slate-400">
                <span>Node.js Integration Code Example</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `const axios = require('axios');\n\nasync function checkZenexLiveFeed(targetService) {\n  try {\n    const response = await axios.get("https://api.zenexnetwork.com/v1/active-ranges", {\n      headers: { 'mapikey': '${apiKey}' }\n    });\n    console.log(response.data);\n  } catch (error) { console.error("API Error"); }\n}`,
                      "api-code"
                    )
                  }
                  className="hover:text-white flex items-center gap-1 text-[11px]"
                >
                  {copiedText === "api-code" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === "api-code" ? "Copied" : "Copy Code"}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 overflow-x-auto leading-relaxed">
{`const axios = require('axios');

async function checkZenexLiveFeed(targetService) {
    try {
        const response = await axios.get("https://api.zenexnetwork.com/v1/active-ranges", {
            headers: { 'mapikey': '${apiKey}' }
        });
        const activeRoutes = response.data.data.active_ranges;
        const matchedRoutes = activeRoutes.filter(route => route.service === targetService);
        if (matchedRoutes.length > 0) {
            matchedRoutes.forEach(r => console.log(\`[Route: \${r.range}] -> \${r.hits} Success Hits\`));
        }
    } catch (error) { console.error("API Error"); }
}
checkZenexLiveFeed("Telegram");`}
              </pre>
            </div>
          </div>
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
          <span className="text-slate-400 font-medium text-xs">
            2026 All rights Reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
