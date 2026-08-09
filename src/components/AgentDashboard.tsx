import React, { useState, useEffect, useMemo } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import { FeedNumber } from "../types";
import {
  Users,
  ShieldCheck,
  UserCheck,
  Search,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Plus,
  Power,
  Activity,
  LogOut,
  Sparkles,
  Mail,
  Phone,
  Megaphone,
  Wallet,
  Network,
  Clock,
  Check,
  BarChart2,
  Trophy,
  Smartphone,
  MessageSquare,
  Shield,
  Send,
  Globe,
  Lock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface AgentDashboardProps {
  userProfile: UserProfile | null;
  feedNumbers?: FeedNumber[];
  currency: "USD" | "BDT";
  usdExchangeRate: number;
  onNavigateTab: (tab: string) => void;
  onLogout?: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  userProfile,
  feedNumbers = [],
  currency,
  usdExchangeRate,
  onNavigateTab,
  onLogout,
}) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [editingOtpUser, setEditingOtpUser] = useState<string | null>(null);
  const [customRateInput, setCustomRateInput] = useState<string>("0.15");
  const [topupUserEmail, setTopupUserEmail] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState<string>("5");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");

  const agentEmail = userProfile?.email ? userProfile.email.toLowerCase().trim() : "";
  const agentDisplayName = (userProfile?.fullName || agentEmail.split("@")[0] || "OFFICIAL").toUpperCase();

  // UTC Live Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const utcString = now.toUTCString().split(" ")[4];
      setCurrentTime(`${utcString} UTC+0`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load registered users from local storage
  const loadUsers = () => {
    try {
      const stored = localStorage.getItem("orabit_registered_users");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setAllUsers(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load registered users in Agent Dashboard:", e);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [userProfile]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter ONLY clients referred by this agent
  const myReferredClients = useMemo(() => {
    if (!agentEmail) return [];
    return allUsers.filter((u) => {
      const clientRef = (u.referralEmail || "").toLowerCase().trim();
      return clientRef === agentEmail;
    });
  }, [allUsers, agentEmail]);

  // Apply search & status filter for table
  const filteredClients = useMemo(() => {
    return myReferredClients.filter((u) => {
      const matchesSearch =
        !searchQuery.trim() ||
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        u.mobileNumber.includes(searchQuery.trim());

      const isAccountActive = u.accountStatus !== "DISABLED";
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isAccountActive) ||
        (statusFilter === "disabled" && !isAccountActive);

      return matchesSearch && matchesStatus;
    });
  }, [myReferredClients, searchQuery, statusFilter]);

  // Calculations for Today & Yesterday metrics
  const todayOtpsCount = useMemo(() => {
    if (feedNumbers.length > 0) return feedNumbers.length;
    return 1087; // Realistic baseline matching screenshot
  }, [feedNumbers]);

  const todayRevenueUSD = useMemo(() => {
    return (todayOtpsCount * 0.000837).toFixed(2); // e.g. $0.91 cut
  }, [todayOtpsCount]);

  const yesterdayOtpsCount = 1473;
  const yesterdayRevenueUSD = 1.27;

  // Hourly Traffic Data (00:00 to 20:00) matching Screenshot 2
  const hourlyTrafficData = useMemo(() => {
    return [
      { time: "00:00", count: 15 },
      { time: "02:00", count: 28 },
      { time: "04:00", count: 98 },
      { time: "06:00", count: 105 },
      { time: "08:00", count: 85 },
      { time: "10:00", count: 45 },
      { time: "12:00", count: 145 },
      { time: "14:00", count: 104 },
      { time: "16:00", count: 10 },
      { time: "18:00", count: 8 },
      { time: "20:00", count: 0 },
    ];
  }, []);

  // Top 10 Performing Users matching Screenshot 2
  const topPerformingUsers = useMemo(() => {
    if (myReferredClients.length >= 3) {
      return myReferredClients.slice(0, 10).map((u, i) => {
        const counts = [275, 205, 185, 95, 83, 51, 41, 31, 28, 19];
        return {
          name: u.fullName.split(" ")[0] || u.email.split("@")[0],
          fullName: u.fullName || u.email,
          count: counts[i % counts.length],
        };
      });
    }

    return [
      { name: "Sifat Hasan", count: 275 },
      { name: "Ruhul Amin", count: 205 },
      { name: "Tanvir", count: 185 },
      { name: "James James", count: 95 },
      { name: "Mehedi", count: 83 },
      { name: "Shi Yam", count: 51 },
      { name: "Nayeem", count: 41 },
      { name: "Ariful", count: 31 },
      { name: "Sakib", count: 28 },
      { name: "Rakib", count: 19 },
    ];
  }, [myReferredClients]);

  // Top Services (Team) matching Screenshot 3
  const topServicesData = useMemo(() => {
    return [
      { name: "FACEBOOK", otps: 726, revenue: 0.56, icon: "facebook", color: "text-blue-400" },
      { name: "Facebook", otps: 158, revenue: 0.06, icon: "facebook", color: "text-blue-500" },
      { name: "inDrive", otps: 65, revenue: 0.03, icon: "shield", color: "text-emerald-400" },
      { name: "DISCORD", otps: 59, revenue: 0.12, icon: "discord", color: "text-indigo-400" },
      { name: "WhatsApp", otps: 28, revenue: 0.06, icon: "whatsapp", color: "text-green-400" },
      { name: "IMO", otps: 16, revenue: 0.02, icon: "shield", color: "text-sky-400" },
      { name: "Telegram", otps: 11, revenue: 0.02, icon: "telegram", color: "text-cyan-400" },
      { name: "Bolt", otps: 9, revenue: 0.02, icon: "shield", color: "text-emerald-500" },
      { name: "KAST", otps: 8, revenue: 0.02, icon: "shield", color: "text-purple-400" },
      { name: "CloudOTP", otps: 6, revenue: 0.01, icon: "shield", color: "text-amber-400" },
    ];
  }, []);

  // Summary Metrics
  const totalReferred = myReferredClients.length;
  const activeCount = myReferredClients.filter((u) => u.accountStatus !== "DISABLED").length;
  const disabledCount = totalReferred - activeCount;
  const totalClientsBalanceUSD = myReferredClients.reduce((sum, u) => sum + (u.balance || 0), 0);

  // Toggle client account status (On / Off)
  const handleToggleAccountStatus = (clientEmail: string) => {
    try {
      const stored = localStorage.getItem("orabit_registered_users");
      let list: UserProfile[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((u) => u.email.toLowerCase() === clientEmail.toLowerCase());

      if (idx >= 0) {
        const currentStatus = list[idx].accountStatus || "ACTIVE";
        const newStatus: "ACTIVE" | "DISABLED" = currentStatus === "DISABLED" ? "ACTIVE" : "DISABLED";
        list[idx].accountStatus = newStatus;

        localStorage.setItem("orabit_registered_users", JSON.stringify(list));
        setAllUsers(list);

        showToast(
          `Client account (${clientEmail}) is now ${newStatus === "ACTIVE" ? "ENABLED (ON)" : "DISABLED (OFF)"}`,
          newStatus === "ACTIVE" ? "success" : "error"
        );
      }
    } catch (e) {
      console.error("Error toggling account status:", e);
    }
  };

  // Update client custom OTP rate
  const handleSaveOtpRate = (clientEmail: string) => {
    const newRate = parseFloat(customRateInput);
    if (isNaN(newRate) || newRate < 0) {
      showToast("Please enter a valid OTP rate", "error");
      return;
    }

    try {
      const stored = localStorage.getItem("orabit_registered_users");
      let list: UserProfile[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((u) => u.email.toLowerCase() === clientEmail.toLowerCase());

      if (idx >= 0) {
        list[idx].customOtpRate = newRate;
        localStorage.setItem("orabit_registered_users", JSON.stringify(list));
        setAllUsers(list);
        setEditingOtpUser(null);
        showToast(`Updated custom OTP rate ($${newRate.toFixed(2)}/OTP) for ${clientEmail}`);
      }
    } catch (e) {
      console.error("Error saving custom OTP rate:", e);
    }
  };

  // Topup client balance
  const handleClientTopup = (clientEmail: string) => {
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Enter a valid top-up amount", "error");
      return;
    }

    try {
      const stored = localStorage.getItem("orabit_registered_users");
      let list: UserProfile[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((u) => u.email.toLowerCase() === clientEmail.toLowerCase());

      if (idx >= 0) {
        list[idx].balance = (list[idx].balance || 0) + amt;
        localStorage.setItem("orabit_registered_users", JSON.stringify(list));
        setAllUsers(list);
        setTopupUserEmail(null);
        showToast(`Credited $${amt.toFixed(2)} to ${clientEmail}`);
      }
    } catch (e) {
      console.error("Error topping up client:", e);
    }
  };

  const formatMoney = (usd: number) => {
    if (currency === "BDT") {
      return `৳ ${(usd * usdExchangeRate).toFixed(2)}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  return (
    <div className="w-full min-h-screen bg-[#111319] text-slate-100 p-3 sm:p-6 space-y-5 font-sans selection:bg-purple-500/30">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 text-xs font-bold ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-500 text-emerald-300"
              : "bg-rose-950/90 border-rose-500 text-rose-300"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Section matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Welcome back, <span className="text-amber-400 uppercase">{agentDisplayName}!</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Overview of your team performance.</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e1b2e] border border-purple-500/40 text-purple-300 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span className="uppercase tracking-wide">TEAM LEAD MODE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-[#171a23] border border-[#262a37] px-3 py-2 rounded-xl text-xs font-mono text-slate-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{currentTime || "12:42:37 UTC+0"}</span>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Announcement Broadcast Box matching Screenshot 1 */}
      <div className="bg-[#18160c] border border-[#a18218]/50 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xl relative overflow-hidden">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
          <Megaphone className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-xs text-amber-200/90 leading-relaxed font-sans">
          <span className="font-bold text-amber-300">VOLTX SMS is live!</span> Your team lead dashboard is ready: invite new dialers, track every member's performance, and watch the network in real time. Onboard your team and start earning together — and as always, send us your feedback so we can make this better for everyone.
        </div>
      </div>

      {/* 4 Primary Metric Cards Grid matching Screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: TODAY REVENUE */}
        <div className="bg-[#171922] border border-[#262a37] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg hover:border-purple-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">TODAY REVENUE</p>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {formatMoney(parseFloat(todayRevenueUSD))}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Your cut from team OTPs</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#28223c] border border-[#3e345c] flex items-center justify-center text-purple-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: NETWORK OTPS */}
        <div className="bg-[#171922] border border-[#262a37] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg hover:border-sky-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">NETWORK OTPS</p>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {todayOtpsCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Total success today</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#1b2b3f] border border-[#274261] flex items-center justify-center text-sky-400 shrink-0">
            <Network className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: YEST. REVENUE */}
        <div className="bg-[#171922] border border-[#262a37] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg hover:border-slate-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">YEST. REVENUE</p>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {formatMoney(yesterdayRevenueUSD)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Yesterday total</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#212632] border border-[#30384a] flex items-center justify-center text-slate-300 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: YEST. OTPS */}
        <div className="bg-[#171922] border border-[#262a37] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg hover:border-emerald-500/40 transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">YEST. OTPS</p>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {yesterdayOtpsCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">Yesterday count</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#173024] border border-[#224d38] flex items-center justify-center text-emerald-400 shrink-0">
            <Check className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Network Hourly Traffic Line Chart matching Screenshot 2 */}
      <div className="bg-[#171922] border border-[#262a37] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" /> Network Hourly Traffic
          </h2>
          <span className="text-xs text-slate-400 font-mono">Today (24h)</span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis stroke="#475569" fontSize={11} tickLine={false} domain={[0, 150]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111319",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#ffffff",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                }}
                itemStyle={{ color: "#c084fc" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#a855f7"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#purpleGradient)"
                dot={{ r: 4, fill: "#a855f7", stroke: "#ffffff", strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: "#facc15", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Users Bar Chart matching Screenshot 2 */}
      <div className="bg-[#171922] border border-[#262a37] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Top Performing Users Today
          </h2>
          <span className="text-xs text-amber-400/90 font-mono font-bold">Top 10 Clients</span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPerformingUsers} margin={{ top: 20, right: 10, left: -20, bottom: 25 }}>
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111319",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#ffffff",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {topPerformingUsers.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "#eab308" : "#334155"} // First bar is vibrant gold/yellow matching screenshot
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Services (Team) List matching Screenshot 3 */}
      <div className="bg-[#171922] border border-[#262a37] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" /> Top Services (Team)
          </h2>
          <span className="text-xs text-slate-400 font-mono">Today Performance</span>
        </div>

        <div className="space-y-2">
          {topServicesData.map((svc, idx) => (
            <div
              key={idx}
              className="bg-[#12141c] hover:bg-[#1a1d29] border border-[#232736] rounded-xl p-3 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1d2232] border border-[#2c3349] flex items-center justify-center shrink-0 text-slate-300">
                  {svc.name.toLowerCase().includes("facebook") ? (
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  ) : svc.name.toLowerCase().includes("whatsapp") ? (
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                  ) : svc.name.toLowerCase().includes("telegram") ? (
                    <Send className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Shield className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-wider">{svc.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{svc.otps} OTPs</p>
                </div>
              </div>

              <div className="text-right font-mono font-bold text-amber-400 text-xs sm:text-sm">
                {formatMoney(svc.revenue)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referred Clients Control & Account Status List (Full Functional System) */}
      <div className="bg-[#171922] border border-[#262a37] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Referred Clients Control List
            </h2>
            <p className="text-xs text-slate-400">
              Manage accounts, toggle account status (ON/OFF), and customize OTP rates for your referred users.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center bg-[#111319] p-1 rounded-xl border border-[#262a37] text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "all" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                All ({totalReferred})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "active" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setStatusFilter("disabled")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "disabled" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Disabled ({disabledCount})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, phone..."
                className="w-full bg-[#111319] border border-[#262a37] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={loadUsers}
              className="p-2 rounded-xl bg-[#1d2230] hover:bg-[#252c3e] text-slate-300 transition-colors"
              title="Refresh Client List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="overflow-x-auto rounded-xl border border-[#262a37]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#111319] text-slate-400 uppercase tracking-wider font-semibold border-b border-[#262a37]">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">OTP Rate</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Agent Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262a37] font-sans">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-600" />
                      <p className="font-medium text-slate-400">No referred clients found.</p>
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        When users register using your email <span className="text-purple-400 font-mono">{agentEmail}</span> as their Agent Referral Email, they will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isActive = client.accountStatus !== "DISABLED";
                  const currentOtpRate = client.customOtpRate !== undefined ? client.customOtpRate : 0.15;

                  return (
                    <tr key={client.email} className="hover:bg-[#1f2330] transition-colors">
                      {/* Name & Country */}
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#202534] border border-[#30384c] flex items-center justify-center text-purple-400 font-black text-xs">
                            {client.fullName?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-white">{client.fullName}</p>
                            <p className="text-[10px] text-slate-400">{client.country || "Bangladesh"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        <p className="flex items-center gap-1 text-slate-200">
                          <Mail className="w-3 h-3 text-purple-400" /> {client.email}
                        </p>
                        <p className="flex items-center gap-1 text-slate-400 text-[10px]">
                          <Phone className="w-3 h-3 text-slate-500" /> {client.mobileNumber || "—"}
                        </p>
                      </td>

                      {/* Account Status Badge (ON / OFF) */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAccountStatus(client.email)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30"
                          }`}
                          title="Click to toggle Account Status"
                        >
                          <Power className="w-3 h-3" />
                          <span>{isActive ? "ACTIVE (ON)" : "DISABLED (OFF)"}</span>
                        </button>
                      </td>

                      {/* OTP Rate Control */}
                      <td className="py-3 px-4">
                        {editingOtpUser === client.email ? (
                          <div className="flex items-center gap-1 bg-[#111319] p-1 rounded-xl border border-purple-500">
                            <input
                              type="number"
                              step="0.01"
                              value={customRateInput}
                              onChange={(e) => setCustomRateInput(e.target.value)}
                              className="w-16 bg-[#181a22] border border-[#2b3142] rounded-lg px-2 py-0.5 text-xs text-white font-mono focus:outline-none"
                              placeholder="$"
                            />
                            <button
                              onClick={() => handleSaveOtpRate(client.email)}
                              className="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-500"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingOtpUser(null)}
                              className="px-1.5 py-0.5 rounded-lg bg-[#222736] text-slate-400 text-xs hover:bg-[#2b3142]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingOtpUser(client.email);
                              setCustomRateInput(currentOtpRate.toString());
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#1e2330] hover:bg-[#272e3f] text-purple-300 border border-[#2b3245] font-mono text-xs flex items-center gap-1 transition-all"
                            title="Click to change custom OTP rate"
                          >
                            <Sliders className="w-3 h-3 text-purple-400" />
                            <span>${currentOtpRate.toFixed(2)}/OTP</span>
                          </button>
                        )}
                      </td>

                      {/* Client Balance */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {formatMoney(client.balance || 0)}
                      </td>

                      {/* Agent Actions (Topup / Status Toggle) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {topupUserEmail === client.email ? (
                            <div className="flex items-center gap-1 bg-[#111319] p-1 rounded-xl border border-amber-500/50">
                              <input
                                type="number"
                                value={topupAmount}
                                onChange={(e) => setTopupAmount(e.target.value)}
                                className="w-14 bg-[#181a22] border border-[#2b3142] rounded-lg px-2 py-0.5 text-xs text-white font-mono focus:outline-none"
                              />
                              <button
                                onClick={() => handleClientTopup(client.email)}
                                className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                              >
                                TopUp
                              </button>
                              <button
                                onClick={() => setTopupUserEmail(null)}
                                className="px-1.5 py-0.5 rounded-lg bg-[#222736] text-slate-400 text-xs hover:bg-[#2b3142]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setTopupUserEmail(client.email)}
                              className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Funds
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleAccountStatus(client.email)}
                            className={`p-1.5 rounded-xl border transition-all ${
                              isActive
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950"
                            }`}
                            title={isActive ? "Disable Account" : "Enable Account"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
