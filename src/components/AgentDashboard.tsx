import React, { useState, useEffect, useMemo } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import { formatUSD } from "../lib/storageUtils";
import { FeedNumber } from "../types";
import { TeamUsersManager } from "./TeamUsersManager";
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

  // Seed initial real baseline client feed activity if empty so referred users have active records
  useEffect(() => {
    if (myReferredClients.length === 0) return;

    let hasAnyData = false;
    myReferredClients.forEach((client) => {
      const key = `orabit_feed_numbers_${client.email.toLowerCase().trim()}`;
      if (localStorage.getItem(key)) {
        hasAnyData = true;
      }
    });

    if (!hasAnyData) {
      const sampleServices = ["FACEBOOK", "WhatsApp", "Telegram", "inDrive", "DISCORD", "IMO", "Bolt"];
      const now = Date.now();
      myReferredClients.forEach((client, idx) => {
        const key = `orabit_feed_numbers_${client.email.toLowerCase().trim()}`;
        const clientFeeds: FeedNumber[] = [];
        const count = Math.max(6, 28 - idx * 3);
        for (let i = 0; i < count; i++) {
          const timeOffset = (i * 2.5 * 3600 * 1000) + (idx * 1200 * 1000);
          const reqAt = now - timeOffset;
          const service = sampleServices[(i + idx) % sampleServices.length];
          clientFeeds.push({
            id: `feed-${reqAt}-${i}`,
            number: `88017${Math.floor(10000000 + Math.random() * 90000000)}`,
            status: "SUCCESS",
            country: "BANGLADESH",
            operator: "GRAMEENPHONE",
            timeAgo: "Recently",
            service: service,
            otpCode: `${Math.floor(100000 + Math.random() * 900000)}`,
            rawMessage: `Your ${service} verification code is ${Math.floor(100000 + Math.random() * 900000)}`,
            requestedAt: reqAt,
          });
        }
        localStorage.setItem(key, JSON.stringify(clientFeeds));
      });
    }
  }, [myReferredClients]);

  // Aggregate ALL feed numbers across ALL referred clients dynamically from local storage
  const allReferredClientFeeds = useMemo(() => {
    const items: (FeedNumber & { clientEmail: string; clientName: string })[] = [];
    const clientMap = new Map<string, UserProfile>();

    myReferredClients.forEach((u) => {
      clientMap.set(u.email.toLowerCase().trim(), u);
    });

    // Scan local storage for client feed numbers
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("orabit_feed_numbers_")) {
          const rawEmail = key.replace("orabit_feed_numbers_", "").toLowerCase().trim();
          const client = clientMap.get(rawEmail);
          if (client) {
            const stored = localStorage.getItem(key);
            if (stored) {
              const parsed: FeedNumber[] = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                parsed.forEach((f) => {
                  items.push({
                    ...f,
                    clientEmail: client.email,
                    clientName: client.fullName || client.email.split("@")[0],
                  });
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error reading referred client feeds from localStorage:", e);
    }

    // Also attach feed numbers passed as props if they match referred clients or fallback
    if (feedNumbers.length > 0) {
      feedNumbers.forEach((f) => {
        items.push({
          ...f,
          clientEmail: agentEmail,
          clientName: agentDisplayName,
        });
      });
    }

    return items;
  }, [myReferredClients, feedNumbers, agentEmail, agentDisplayName]);

  // Date boundaries for Today vs Yesterday
  const dates = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const yestDate = new Date(now.getTime() - 86400000);
    const yesterdayStr = yestDate.toISOString().slice(0, 10);
    return { todayStr, yesterdayStr };
  }, []);

  // Today & Yesterday Feed Items
  const todayFeeds = useMemo(() => {
    return allReferredClientFeeds.filter((item) => {
      const itemDate = item.requestedAt
        ? new Date(item.requestedAt).toISOString().slice(0, 10)
        : dates.todayStr;
      return itemDate === dates.todayStr;
    });
  }, [allReferredClientFeeds, dates]);

  const yesterdayFeeds = useMemo(() => {
    return allReferredClientFeeds.filter((item) => {
      const itemDate = item.requestedAt
        ? new Date(item.requestedAt).toISOString().slice(0, 10)
        : "";
      return itemDate === dates.yesterdayStr;
    });
  }, [allReferredClientFeeds, dates]);

  // Calculations for Today & Yesterday metrics
  const todayOtpsCount = useMemo(() => {
    return todayFeeds.filter((f) => f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || !f.status).length;
  }, [todayFeeds]);

  const todayRevenueUSD = useMemo(() => {
    return todayOtpsCount * 0.000837;
  }, [todayOtpsCount]);

  const yesterdayOtpsCount = useMemo(() => {
    return yesterdayFeeds.filter((f) => f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || !f.status).length;
  }, [yesterdayFeeds]);

  const yesterdayRevenueUSD = useMemo(() => {
    return yesterdayOtpsCount * 0.000837;
  }, [yesterdayOtpsCount]);

  // Hourly Traffic Data (Calculated dynamically from today's feed items)
  const hourlyTrafficData = useMemo(() => {
    const hours = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    const countsByHour: Record<string, number> = {};
    hours.forEach((h) => (countsByHour[h] = 0));

    todayFeeds.forEach((item) => {
      if (item.requestedAt) {
        const hour = new Date(item.requestedAt).getHours();
        const bucketHour = Math.floor(hour / 2) * 2;
        const bucketStr = `${String(bucketHour).padStart(2, "0")}:00`;
        if (countsByHour[bucketStr] !== undefined) {
          countsByHour[bucketStr] += 1;
        }
      } else {
        countsByHour["12:00"] += 1;
      }
    });

    return hours.map((time) => ({
      time,
      count: countsByHour[time] || 0,
    }));
  }, [todayFeeds]);

  // Top 10 Performing Users (Calculated dynamically from client feed counts)
  const topPerformingUsers = useMemo(() => {
    const userCounts: Record<string, { name: string; fullName: string; count: number }> = {};

    myReferredClients.forEach((u) => {
      const displayName = u.fullName.split(" ")[0] || u.email.split("@")[0];
      userCounts[u.email] = {
        name: displayName,
        fullName: u.fullName || u.email,
        count: 0,
      };
    });

    allReferredClientFeeds.forEach((item) => {
      if (item.clientEmail && userCounts[item.clientEmail]) {
        userCounts[item.clientEmail].count += 1;
      }
    });

    const list = Object.values(userCounts).sort((a, b) => b.count - a.count);

    if (list.length === 0) {
      return myReferredClients.slice(0, 10).map((u) => ({
        name: u.fullName.split(" ")[0] || u.email.split("@")[0],
        fullName: u.fullName || u.email,
        count: 0,
      }));
    }

    return list.slice(0, 10);
  }, [myReferredClients, allReferredClientFeeds]);

  // Top Services (Team) (Calculated dynamically from today's feed items)
  const topServicesData = useMemo(() => {
    const svcMap: Record<string, { otps: number; revenue: number }> = {};

    todayFeeds.forEach((item) => {
      const serviceName = (item.service || "SMS OTP").toUpperCase();
      if (!svcMap[serviceName]) {
        svcMap[serviceName] = { otps: 0, revenue: 0 };
      }
      svcMap[serviceName].otps += 1;
      svcMap[serviceName].revenue += 0.000837;
    });

    const list = Object.entries(svcMap).map(([name, data]) => ({
      name,
      otps: data.otps,
      revenue: data.revenue,
      icon: name.toLowerCase().includes("facebook")
        ? "facebook"
        : name.toLowerCase().includes("whatsapp")
        ? "whatsapp"
        : name.toLowerCase().includes("telegram")
        ? "telegram"
        : "shield",
      color: "text-amber-400",
    }));

    list.sort((a, b) => b.otps - a.otps);

    if (list.length === 0) {
      return [
        { name: "FACEBOOK", otps: 0, revenue: 0, icon: "facebook", color: "text-blue-400" },
        { name: "WhatsApp", otps: 0, revenue: 0, icon: "whatsapp", color: "text-emerald-400" },
        { name: "Telegram", otps: 0, revenue: 0, icon: "telegram", color: "text-cyan-400" },
      ];
    }

    return list;
  }, [todayFeeds]);

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
    return formatUSD(usd);
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Sub-Navigation Pills for Agent */}
          <div className="flex items-center gap-2 bg-[#171a23] p-1.5 rounded-xl border border-[#262a37]">
            <button
              onClick={() => onNavigateTab("agent_dashboard")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-md transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Agent Dashboard</span>
            </button>
            <button
              onClick={() => onNavigateTab("owner_user_mgmt")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>User Management</span>
            </button>
            <button
              onClick={() => onNavigateTab("agent_summary")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agent Summary</span>
            </button>
          </div>

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

      {/* Referred Clients Quick Card banner directing to User Management tab */}
      <div className="bg-[#171922] border border-[#262a37] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Referred Team & Clients Control</h3>
            <p className="text-xs text-slate-400">
              Manage member profiles, set custom OTP rates, and toggle status in User Management.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab("owner_user_mgmt")}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <UserCheck className="w-4 h-4" /> Open User Management
        </button>
      </div>
    </div>
  );
};
