import React, { useState, useEffect, useMemo } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import { formatUSD } from "../lib/storageUtils";
import { FeedNumber } from "../types";
import { createAgentInSupabase, deleteAgentFromSupabase } from "../lib/userRoles";
import { TeamUsersManager } from "./TeamUsersManager";
import { AgentManagement } from "./AgentManagement";
import { fetchDailyStatsFromSupabase, getBDDateString } from "../lib/supabaseDailyStats";
import { supabase } from "../lib/supabase";
import { ServiceLogo } from "./ServiceLogo";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Users,
  ShieldCheck,
  Crown,
  TrendingUp,
  DollarSign,
  Hash,
  CheckCircle2,
  XCircle,
  Activity,
  Plus,
  RefreshCw,
  Search,
  Key,
  BarChart3,
  LayoutDashboard,
  Server,
  Zap,
  Check,
  UserPlus,
  UserCheck,
  Lock,
  Mail,
  Sliders,
  FileSpreadsheet,
  KeyRound,
  Percent,
  CreditCard,
  Layers,
  Settings,
  Coins,
  Globe,
  SlidersHorizontal,
  CheckSquare,
  FileText,
  Calendar,
  Trash2,
  Trophy,
  User,
  Send,
} from "lucide-react";

interface OwnerDashboardProps {
  userProfile: UserProfile | null;
  feedNumbers: FeedNumber[];
  currency: "USD" | "BDT";
  usdExchangeRate: number;
  activeSection?:
    | "overview"
    | "agent_mgmt"
    | "user_mgmt"
    | "panel_mgmt"
    | "number_file"
    | "otp_mgmt"
    | "rate_mgmt"
    | "payment_mgmt";
  onNavigateTab: (tab: any) => void;
  onUpdateUserBalance?: (userEmail: string, addAmount: number) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  userProfile,
  feedNumbers,
  currency,
  usdExchangeRate,
  activeSection = "overview",
  onNavigateTab,
  onUpdateUserBalance,
}) => {
  const isOwner = userProfile?.role === "owner" || userProfile?.isOwner || userProfile?.email?.toLowerCase().trim() === "orabitsms@gmail.com";
  const isAgent = userProfile?.role === "agent" || userProfile?.isAgent;
  const agentEmail = (userProfile?.email || "").toLowerCase().trim();
  const agentCode = userProfile?.referralCode || "";

  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState<string>("10");
  const [topupSuccessMsg, setTopupSuccessMsg] = useState<string | null>(null);

  // System notice state
  const [systemNotice, setSystemNotice] = useState(() => {
    return localStorage.getItem("orabit_owner_notice") || "All ORABIT SMS servers operational. Real-time feed active.";
  });
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [tempNotice, setTempNotice] = useState(systemNotice);

  // Agent Creation state
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentTelegram, setNewAgentTelegram] = useState("");
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentNotice, setAgentNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleCreateAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanE = newAgentEmail.trim().toLowerCase();
    const cleanName = newAgentName.trim() || `Agent (${cleanE.split("@")[0]})`;
    const rawTg = newAgentTelegram.trim();
    const cleanTg = rawTg ? (rawTg.startsWith("@") ? rawTg : `@${rawTg}`) : "";

    if (!cleanE || !newAgentPassword.trim()) {
      setAgentNotice({ text: "Please enter Email and Password for the Agent.", type: "error" });
      return;
    }

    setIsCreatingAgent(true);
    setAgentNotice(null);

    const res = await createAgentInSupabase(cleanE, newAgentPassword, cleanName, cleanTg);

    if (res.success) {
      try {
        const stored = localStorage.getItem("orabit_registered_users");
        let list: UserProfile[] = stored ? JSON.parse(stored) : [];
        const existingIdx = list.findIndex((u) => u.email.toLowerCase() === cleanE);

        const newAgentObj: UserProfile = {
          fullName: cleanName,
          mobileNumber: "01700000000",
          email: cleanE,
          telegram: cleanTg,
          city: "Dhaka",
          country: "Bangladesh",
          referralEmail: "orabitsms@gmail.com",
          withdrawPin: "",
          balance: 0.0,
          password: newAgentPassword,
          role: "Agent",
        };

        if (existingIdx >= 0) {
          list[existingIdx] = {
            ...list[existingIdx],
            fullName: cleanName,
            telegram: cleanTg,
            role: "Agent",
            password: newAgentPassword,
          };
        } else {
          list.push(newAgentObj);
        }

        localStorage.setItem("orabit_registered_users", JSON.stringify(list));
        setRegisteredUsers(list);
      } catch (err) {
        console.error("Local storage error on agent creation:", err);
      }

      setAgentNotice({ text: res.message, type: "success" });
      setNewAgentEmail("");
      setNewAgentPassword("");
      setNewAgentName("");
      setNewAgentTelegram("");
    } else {
      setAgentNotice({ text: res.message, type: "error" });
    }

    setIsCreatingAgent(false);
  };

  // Handle Delete Agent
  const handleDeleteAgent = async (agentEmail: string) => {
    const cleanE = agentEmail.trim().toLowerCase();
    if (!window.confirm(`Are you sure you want to delete agent "${cleanE}"? This will remove their agent role and access.`)) {
      return;
    }

    const res = await deleteAgentFromSupabase(cleanE);

    try {
      const stored = localStorage.getItem("orabit_registered_users");
      let list: UserProfile[] = stored ? JSON.parse(stored) : registeredUsers;
      const updatedList = list.filter((u) => u.email.toLowerCase().trim() !== cleanE);
      localStorage.setItem("orabit_registered_users", JSON.stringify(updatedList));
      setRegisteredUsers(updatedList);
    } catch (err) {
      console.error("Local storage error on agent deletion:", err);
    }

    setAgentNotice({
      text: res.success ? `Agent (${cleanE}) has been deleted successfully.` : res.message,
      type: res.success ? "success" : "error",
    });
  };

  // Top 10 Performing Agents Data Calculation
  const topAgentsData = useMemo(() => {
    const agents = registeredUsers.filter((u) => u.role?.toLowerCase() === "agent");
    if (agents.length === 0) return [];

    const allFeedsMapByEmail: Record<string, FeedNumber[]> = {};

    feedNumbers.forEach((f) => {
      const em = (f.userEmail || f.email || "").toLowerCase().trim();
      if (em) {
        if (!allFeedsMapByEmail[em]) allFeedsMapByEmail[em] = [];
        allFeedsMapByEmail[em].push(f);
      }
    });

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("orabit_feed_numbers")) {
          let em = "";
          if (key.startsWith("orabit_feed_numbers_")) {
            em = key.replace("orabit_feed_numbers_", "").toLowerCase().trim();
          }
          const val = localStorage.getItem(key);
          if (val) {
            try {
              const parsed: FeedNumber[] = JSON.parse(val);
              if (Array.isArray(parsed)) {
                parsed.forEach((f) => {
                  const itemEm = (f.userEmail || f.email || em).toLowerCase().trim();
                  if (itemEm) {
                    if (!allFeedsMapByEmail[itemEm]) allFeedsMapByEmail[itemEm] = [];
                    allFeedsMapByEmail[itemEm].push(f);
                  }
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {}

    const calcSuccessOtps = (feeds: FeedNumber[]) => {
      const seen = new Set<string>();
      let total = 0;
      feeds.forEach((f) => {
        const k = f.id || `${f.number}_${f.requestedAt}_${f.status}`;
        if (!seen.has(k)) {
          seen.add(k);
          const isSuccess = f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || (f.status as string) === "success";
          const isFail = f.rawMessage ? f.rawMessage.toLowerCase().includes("no sms received") : false;
          if (isSuccess && !isFail) {
            const validMsgs = f.messages ? f.messages.filter((m) => m.code || (m.raw && !m.raw.toLowerCase().includes("no sms received"))) : [];
            total += validMsgs.length > 0 ? validMsgs.length : 1;
          }
        }
      });
      return total;
    };

    const agentPerformance = agents.map((agent) => {
      const agEmail = agent.email.toLowerCase().trim();
      const agCode = (agent.referralEmail || agent.referralCode || "").toLowerCase().trim();

      const referredClients = registeredUsers.filter((u) => {
        const refEmail = (u.referralEmail || u.referredBy || u.referredByAgentEmail || "").toLowerCase().trim();
        return (
          refEmail === agEmail ||
          (agCode && (refEmail === agCode || u.referredBy?.trim().toLowerCase() === agCode))
        );
      });

      const clientEmails = new Set<string>();
      clientEmails.add(agEmail);
      referredClients.forEach((c) => clientEmails.add(c.email.toLowerCase().trim()));

      const agentFeeds: FeedNumber[] = [];
      clientEmails.forEach((cEmail) => {
        if (allFeedsMapByEmail[cEmail]) {
          agentFeeds.push(...allFeedsMapByEmail[cEmail]);
        }
      });

      const totalSuccessOtps = calcSuccessOtps(agentFeeds);
      const displayName = agent.fullName && agent.fullName !== `Agent (${agEmail.split("@")[0]})`
        ? agent.fullName
        : agEmail.split("@")[0];

      return {
        agentEmail: agEmail,
        name: displayName,
        shortEmail: agEmail.length > 18 ? agEmail.substring(0, 15) + "..." : agEmail,
        totalOtps: totalSuccessOtps,
        clientsCount: referredClients.length,
      };
    });

    agentPerformance.sort((a, b) => b.totalOtps - a.totalOtps);
    return agentPerformance.slice(0, 10);
  }, [registeredUsers, feedNumbers]);

  // Load all registered users from storage
  const loadRegisteredUsers = () => {
    try {
      const stored = localStorage.getItem("orabit_registered_users");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRegisteredUsers(parsed);
        }
      } else if (userProfile) {
        setRegisteredUsers([userProfile]);
      }
    } catch (e) {
      console.error("Failed to load registered users", e);
    }
  };

  useEffect(() => {
    loadRegisteredUsers();
  }, [userProfile]);

  // Global Owner Dashboard Statistics (Today & Yesterday)
  const [globalStats, setGlobalStats] = useState({
    todayRevenue: 0,
    todayOtps: 0,
    yesterdayRevenue: 0,
    yesterdayOtps: 0,
    todayNewUsers: 0,
    yesterdayNewUsers: 0,
    isLoading: true,
  });

  const [globalTopPerformers, setGlobalTopPerformers] = useState<{
    service: string;
    volume: number;
    earningsUSD: number;
  }[]>([]);

  const getServiceRateBDT = (serviceName: string): number => {
    const norm = (serviceName || "").toUpperCase().trim();
    if (norm.includes("WHATSAPP") || norm === "WA" || norm.includes("TELEGRAM") || norm === "TG") {
      return 0;
    }
    return 0.60;
  };

  const loadGlobalMetrics = async () => {
    try {
      const nowMs = Date.now();
      const todayStr = getBDDateString(nowMs);
      const yesterdayStr = getBDDateString(nowMs - 86400000);

      // 1. REVENUE & OTP LOGIC: Fetch daily_stats from Supabase
      const statsList = await fetchDailyStatsFromSupabase(); // empty param = all users
      
      const todayDbRows = statsList.filter((s) => s.date === todayStr);
      const yesterdayDbRows = statsList.filter((s) => s.date === yesterdayStr);

      const todayDbRev = todayDbRows.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
      const todayDbOtps = todayDbRows.reduce((sum, r) => sum + (r.total_otps || 0), 0);

      const yesterdayDbRev = yesterdayDbRows.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
      const yesterdayDbOtps = yesterdayDbRows.reduce((sum, r) => sum + (r.total_otps || 0), 0);

      // Supplement / fallback with feeds across all user keys in localStorage + props feedNumbers
      let todayFeedOtps = 0;
      let todayFeedRev = 0;
      let yesterdayFeedOtps = 0;
      let yesterdayFeedRev = 0;

      const allFeeds: FeedNumber[] = [...feedNumbers];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("orabit_feed_numbers") || k.includes("feed_numbers"))) {
            const val = localStorage.getItem(k);
            if (val) {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) allFeeds.push(...parsed);
            }
          }
        }
      } catch (e) {}

      const uniqueFeeds: FeedNumber[] = [];
      const seenFeeds = new Set<string>();
      allFeeds.forEach((item) => {
        const key = item.id || `${item.number}_${item.requestedAt}_${item.status}`;
        if (!seenFeeds.has(key)) {
          seenFeeds.add(key);
          uniqueFeeds.push(item);
        }
      });

      uniqueFeeds.forEach((f) => {
        const isSuccess = f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || (f.status as string) === "success";
        const isFailNotice = f.rawMessage ? f.rawMessage.toLowerCase().includes("no sms received") : false;
        if (isSuccess && !isFailNotice) {
          const reqDate = getBDDateString(f.requestedAt || Date.now());
          const validMsgs = f.messages ? f.messages.filter((m) => m.code || (m.raw && !m.raw.toLowerCase().includes("no sms received"))) : [];
          const count = validMsgs.length > 0 ? validMsgs.length : 1;
          const rev = count * 0.006;

          if (reqDate === todayStr) {
            todayFeedOtps += count;
            todayFeedRev += rev;
          } else if (reqDate === yesterdayStr) {
            yesterdayFeedOtps += count;
            yesterdayFeedRev += rev;
          }
        }
      });

      const finalTodayRev = Math.max(todayDbRev, todayFeedRev);
      const finalTodayOtps = Math.max(todayDbOtps, todayFeedOtps);
      const finalYesterdayRev = Math.max(yesterdayDbRev, yesterdayFeedRev);
      const finalYesterdayOtps = Math.max(yesterdayDbOtps, yesterdayFeedOtps);

      // 2. NEW USERS LOGIC: Supabase user_profiles + registeredUsers
      let todayUsersCount = 0;
      let yesterdayUsersCount = 0;

      let allUserProfiles: any[] = [];
      try {
        const { data, error } = await supabase.from("user_profiles").select("*");
        if (!error && data && Array.isArray(data)) {
          allUserProfiles = data;
        }
      } catch (e) {
        console.warn("Notice querying user_profiles:", e);
      }

      // Merge with registeredUsers / localStorage orabit_registered_users
      try {
        const storedUsers = localStorage.getItem("orabit_registered_users");
        if (storedUsers) {
          const list = JSON.parse(storedUsers);
          if (Array.isArray(list)) {
            list.forEach((u) => {
              if (!allUserProfiles.some((p) => p.email && u.email && p.email.toLowerCase() === u.email.toLowerCase())) {
                allUserProfiles.push(u);
              }
            });
          }
        }
      } catch (e) {}

      if (registeredUsers.length > 0) {
        registeredUsers.forEach((u) => {
          if (!allUserProfiles.some((p) => p.email && u.email && p.email.toLowerCase() === u.email.toLowerCase())) {
            allUserProfiles.push(u);
          }
        });
      }

      const helperGetDateStr = (dateInput: any): string => {
        if (!dateInput) return "";
        if (typeof dateInput === "number") {
          return getBDDateString(dateInput);
        }
        if (typeof dateInput === "string") {
          if (dateInput.includes("T") || dateInput.includes(" ") || dateInput.includes("-")) {
            const ts = new Date(dateInput).getTime();
            if (!isNaN(ts) && ts > 0) return getBDDateString(ts);
            return dateInput.split("T")[0].split(" ")[0];
          }
          return dateInput.substring(0, 10);
        }
        return "";
      };

      allUserProfiles.forEach((u) => {
        const rawDate = u.created_at || u.createdAt || u.created_date || u.lastLogin || u.updated_at;
        if (rawDate) {
          const uDate = helperGetDateStr(rawDate);
          if (uDate === todayStr) {
            todayUsersCount++;
          } else if (uDate === yesterdayStr) {
            yesterdayUsersCount++;
          }
        }
      });

      setGlobalStats({
        todayRevenue: finalTodayRev,
        todayOtps: finalTodayOtps,
        yesterdayRevenue: finalYesterdayRev,
        yesterdayOtps: finalYesterdayOtps,
        todayNewUsers: todayUsersCount,
        yesterdayNewUsers: yesterdayUsersCount,
        isLoading: false,
      });

      // 3. GLOBAL TOP PERFORMERS LOGIC (Today's performance across all users)
      const dbFeedItems: FeedNumber[] = [];
      try {
        const { data: dbFeeds, error: dbFeedsErr } = await supabase
          .from("user_feed_numbers")
          .select("*");
        if (!dbFeedsErr && dbFeeds && Array.isArray(dbFeeds)) {
          dbFeeds.forEach((row: any) => {
            const rawMsg = row.raw_message ? String(row.raw_message).trim() : "";
            const isFailNotice = rawMsg.toLowerCase().includes("no sms received") || 
                                 rawMsg.toLowerCase().includes("timed out") || 
                                 rawMsg.toLowerCase().includes("failed");
            const otpCode = row.otp_code ? String(row.otp_code).trim() : "";
            const hasValidOtpCode = otpCode.length > 0 && otpCode !== "------";
            const hasValidOtpMsg = rawMsg.length > 0 && !isFailNotice;
            const hasRealOtp = hasValidOtpCode || hasValidOtpMsg;
            const isSuccessStatus = row.status === "SUCCESS" || row.status === "MULTI SUCCESS" || row.status === "success";

            if (isSuccessStatus && !isFailNotice && hasRealOtp) {
              const reqTs = row.requested_at ? Number(row.requested_at) : Date.now();
              dbFeedItems.push({
                id: row.id,
                number: row.number,
                status: row.status,
                country: row.country || "Bangladesh",
                operator: row.operator || "Grameenphone",
                timeAgo: "Today",
                service: row.service || "SMS OTP",
                rawMessage: rawMsg,
                otpCode: otpCode,
                requestedAt: reqTs,
              });
            }
          });
        }
      } catch (e) {
        console.warn("Notice querying user_feed_numbers for top performers:", e);
      }

      const combinedFeedsList = [...dbFeedItems, ...uniqueFeeds];
      const seenTopKeys = new Set<string>();
      const serviceStatsMap: Record<string, { service: string; volume: number; earningsUSD: number }> = {};

      combinedFeedsList.forEach((f) => {
        const isSuccess = f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || (f.status as string) === "success";
        const isFailNotice = f.rawMessage ? f.rawMessage.toLowerCase().includes("no sms received") : false;
        if (isSuccess && !isFailNotice) {
          const reqDate = getBDDateString(f.requestedAt || Date.now());
          if (reqDate === todayStr) {
            const key = f.id || `${f.number}_${f.requestedAt}_${f.service}`;
            if (!seenTopKeys.has(key)) {
              seenTopKeys.add(key);

              const serviceName = (f.service || "SMS OTP").toUpperCase().trim();
              const validMsgs = f.messages ? f.messages.filter((m) => m.code || (m.raw && !m.raw.toLowerCase().includes("no sms received"))) : [];
              const count = validMsgs.length > 0 ? validMsgs.length : 1;

              const rateBDT = getServiceRateBDT(serviceName);
              const earningsUSD = (count * rateBDT) / (usdExchangeRate || 100);

              if (!serviceStatsMap[serviceName]) {
                serviceStatsMap[serviceName] = {
                  service: serviceName,
                  volume: 0,
                  earningsUSD: 0,
                };
              }

              serviceStatsMap[serviceName].volume += count;
              serviceStatsMap[serviceName].earningsUSD += earningsUSD;
            }
          }
        }
      });

      const performersList = Object.values(serviceStatsMap)
        .sort((a, b) => b.volume - a.volume || b.earningsUSD - a.earningsUSD)
        .slice(0, 10);

      setGlobalTopPerformers(performersList);
    } catch (e) {
      console.error("Error loading global owner metrics:", e);
      setGlobalStats((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    loadGlobalMetrics();
  }, [feedNumbers, registeredUsers]);

  // Aggregate System Stats
  const totalUsersCount = registeredUsers.length;
  const totalSystemAllocations = feedNumbers.length;
  const totalSystemSuccess = useMemo(
    () => feedNumbers.filter((f) => f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || f.status === "success").length,
    [feedNumbers]
  );
  const totalSystemFailed = useMemo(
    () => feedNumbers.filter((f) => f.status === "FAILED").length,
    [feedNumbers]
  );
  
  const systemSuccessRate = useMemo(() => {
    if (totalSystemAllocations === 0) return "0.00";
    return ((totalSystemSuccess / totalSystemAllocations) * 100).toFixed(2);
  }, [totalSystemSuccess, totalSystemAllocations]);

  // Total User Balances
  const totalUserBalancesUSD = useMemo(() => {
    return registeredUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
  }, [registeredUsers]);

  // Format currency helper
  const formatMoney = (amountUSD: number) => {
    if (currency === "BDT") {
      const bdt = amountUSD * usdExchangeRate;
      return `৳ ${bdt.toFixed(2)}`;
    }
    return `$ ${formatUSD(amountUSD).replace("$", "")}`;
  };

  // Filtered Users (Restricted to referred clients if Agent)
  const baseUsers = useMemo(() => {
    if (isAgent && !isOwner) {
      return registeredUsers.filter((u) => {
        const refEmail = (u.referralEmail || u.referredBy || u.referredByAgentEmail || "").toLowerCase().trim();
        return (
          refEmail === agentEmail ||
          (agentCode && (u.referredBy?.trim() === agentCode || u.referralEmail?.trim() === agentCode))
        );
      });
    }
    return registeredUsers;
  }, [registeredUsers, isAgent, isOwner, agentEmail, agentCode]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return baseUsers;
    const q = searchQuery.toLowerCase().trim();
    return baseUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.mobileNumber.includes(q) ||
        (u.country && u.country.toLowerCase().includes(q))
    );
  }, [baseUsers, searchQuery]);

  // Handle add balance to user
  const handleTopup = (email: string) => {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const stored = localStorage.getItem("orabit_registered_users");
      let savedAccounts: UserProfile[] = stored ? JSON.parse(stored) : [];
      const idx = savedAccounts.findIndex((acc) => acc.email.toLowerCase() === email.toLowerCase());
      if (idx >= 0) {
        savedAccounts[idx].balance = (savedAccounts[idx].balance || 0) + amount;
        localStorage.setItem("orabit_registered_users", JSON.stringify(savedAccounts));
        setRegisteredUsers(savedAccounts);

        // If updating callback provided
        if (onUpdateUserBalance) {
          onUpdateUserBalance(email, amount);
        }

        setTopupSuccessMsg(`Successfully credited $${amount.toFixed(2)} to ${email}`);
        setTimeout(() => setTopupSuccessMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveNotice = () => {
    localStorage.setItem("orabit_owner_notice", tempNotice);
    setSystemNotice(tempNotice);
    setIsEditingNotice(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#0d1117] text-slate-100 p-3 sm:p-6 space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#151c28] to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isAgent && !isOwner ? "ORABIT Agent Portal" : "ORABIT SMS Portal"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> {isAgent && !isOwner ? "Agent Partner" : "System Owner"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Logged in as <span className="text-emerald-400 font-semibold">{userProfile?.email || "orabitsms@gmail.com"}</span> • {isAgent && !isOwner ? "Referred Clients Management Access" : "Full System Privilege Access"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Topup Notification Toast */}
      {topupSuccessMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{topupSuccessMsg}</span>
        </div>
      )}

      {/* OVERVIEW / MAIN DASHBOARD VIEW ONLY */}
      {(!activeSection || activeSection === "overview") && (
        <>
          {/* 6 GLOBAL OWNER KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CARD 1: TODAY TOTAL REVENUE */}
            <div className="group p-4 sm:p-5 rounded-2xl bg-[#131722]/90 border border-slate-800 hover:border-emerald-500/40 space-y-3 relative overflow-hidden shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                <span className="group-hover:text-emerald-300 transition-colors">Today Total Revenue</span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-[#2EE59D] font-mono group-hover:text-emerald-300 transition-colors">
                  {formatMoney(globalStats.todayRevenue)}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>Today's Platform Revenue</span>
                </div>
              </div>
            </div>

            {/* CARD 2: TODAY TOTAL OTP */}
            <div className="group p-4 sm:p-5 rounded-2xl bg-[#131722]/90 border border-slate-800 hover:border-amber-500/40 space-y-3 relative overflow-hidden shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                <span className="group-hover:text-amber-300 transition-colors">Today Total OTP</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/25 transition-all">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-white font-mono group-hover:text-amber-300 transition-colors">
                  {globalStats.todayOtps}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Successful OTPs Today</span>
                </div>
              </div>
            </div>

            {/* CARD 3: YESTERDAY TOTAL REVENUE */}
            <div className="group p-4 sm:p-5 rounded-2xl bg-[#131722]/90 border border-slate-800 hover:border-blue-500/40 space-y-3 relative overflow-hidden shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                <span className="group-hover:text-blue-300 transition-colors">Yesterday Total Revenue</span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/25 transition-all">
                  <Calendar className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-blue-400 font-mono group-hover:text-blue-300 transition-colors">
                  {formatMoney(globalStats.yesterdayRevenue)}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <span>Previous Day Revenue</span>
                </div>
              </div>
            </div>

            {/* CARD 4: YESTERDAY TOTAL OTP */}
            <div className="group p-4 sm:p-5 rounded-2xl bg-[#131722]/90 border border-slate-800 hover:border-purple-500/40 space-y-3 relative overflow-hidden shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                <span className="group-hover:text-purple-300 transition-colors">Yesterday Total OTP</span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/25 transition-all">
                  <Key className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-white font-mono group-hover:text-purple-300 transition-colors">
                  {globalStats.yesterdayOtps}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <span>Previous Day OTPs</span>
                </div>
              </div>
            </div>

            {/* CARD 5: TODAY NEW USER */}
            <div className="group p-4 sm:p-5 rounded-2xl bg-[#131722]/90 border border-slate-800 hover:border-cyan-500/40 space-y-3 relative overflow-hidden shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                <span className="group-hover:text-cyan-300 transition-colors">Today New User</span>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/25 transition-all">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-cyan-300 font-mono group-hover:text-cyan-200 transition-colors">
                  {globalStats.todayNewUsers}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-cyan-400">
                  <Users className="w-3 h-3" />
                  <span>Registered Today</span>
                </div>
              </div>
            </div>

            {/* CARD 6: YESTERDAY NEW USER */}
            <div className="group p-4 sm:p-5 rounded-2xl bg-[#131722]/90 border border-slate-800 hover:border-rose-500/40 space-y-3 relative overflow-hidden shadow-lg hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider uppercase">
                <span className="group-hover:text-rose-300 transition-colors">Yesterday New User</span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-500/25 transition-all">
                  <UserCheck className="w-4 h-4 text-rose-400" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-white font-mono group-hover:text-rose-300 transition-colors">
                  {globalStats.yesterdayNewUsers}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                  <span>Registered Yesterday</span>
                </div>
              </div>
            </div>
          </div>

          {/* GLOBAL TOP PERFORMERS TABLE */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#131722]/90 border border-slate-800 space-y-4 shadow-xl hover:border-slate-700/80 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 font-bold text-base text-white">
                <Crown className="w-4.5 h-4.5 text-amber-400" />
                <span>Global Top Performers</span>
              </div>
              <span className="text-[10px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Platform Today
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <th className="py-3 px-4">SERVICE</th>
                    <th className="py-3 px-4 text-center">VOLUME</th>
                    <th className="py-3 px-4 text-right">EARNINGS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {globalTopPerformers && globalTopPerformers.length > 0 ? (
                    globalTopPerformers.map((item) => (
                      <tr key={item.service} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3 font-sans">
                          <ServiceLogo name={item.service} size={32} className="w-8 h-8 rounded-lg" />
                          <span className="font-bold text-slate-100 text-sm">{item.service}</span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-200 font-bold text-sm">
                          {item.volume}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-400 font-bold text-sm">
                          {formatMoney(item.earningsUSD)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-10 text-center font-sans text-slate-500 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Crown className="w-6 h-6 text-slate-600" />
                          <span>No global OTP activity recorded today</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Banner / Notice Controller */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Global System Notice</h2>
              </div>
              {!isEditingNotice ? (
                <button
                  onClick={() => setIsEditingNotice(true)}
                  className="text-xs font-semibold text-emerald-400 hover:underline"
                >
                  Edit Notice
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveNotice}
                    className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingNotice(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {isEditingNotice ? (
              <input
                type="text"
                value={tempNotice}
                onChange={(e) => setTempNotice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono">
                {systemNotice}
              </p>
            )}
          </div>
        </>
      )}

      {/* PANEL MANAGEMENT SECTION */}
      {activeSection === "panel_mgmt" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" /> Panel Management
              </h2>
              <p className="text-xs text-slate-400">
                Configure SMS Gateway panel nodes, API keys, server endpoints, and capacity routing.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold font-mono">
              Nodes: 4 Active • Load: 12%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Gateway Panel A</span>
                <span className="text-emerald-400 font-bold font-mono">● Online</span>
              </div>
              <p className="text-sm font-bold text-white font-mono">api.orabitsms.xyz/v1</p>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>Latency: <span className="text-emerald-400 font-mono font-bold">42ms</span></div>
                <div>Capacity: <span className="text-white font-mono">1,200 req/min</span></div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Gateway Panel B</span>
                <span className="text-emerald-400 font-bold font-mono">● Online</span>
              </div>
              <p className="text-sm font-bold text-white font-mono">api.orabitsms.xyz/v2</p>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>Latency: <span className="text-emerald-400 font-mono font-bold">38ms</span></div>
                <div>Capacity: <span className="text-white font-mono">2,500 req/min</span></div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider">Failover Node</span>
                <span className="text-amber-400 font-bold font-mono">⚡ Standby</span>
              </div>
              <p className="text-sm font-bold text-white font-mono">backup.orabitsms.xyz</p>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>Auto-Switch: <span className="text-emerald-400 font-bold">Enabled</span></div>
                <div>Health Check: <span className="text-white font-mono">Passing</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NUMBER FILE MANAGEMENT SECTION */}
      {activeSection === "number_file" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" /> Number File Management
              </h2>
              <p className="text-xs text-slate-400">
                Manage phone number inventory pools, country file feeds, carrier batch allocations, and bulk imports.
              </p>
            </div>
            <button className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Upload Number File
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-sans font-semibold uppercase">Active Number Pool</span>
              <p className="text-lg font-bold text-cyan-400">{feedNumbers.length}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-sans font-semibold uppercase">Pending Numbers</span>
              <p className="text-lg font-bold text-amber-400">{feedNumbers.filter(f => f.status === "pending").length}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-sans font-semibold uppercase">Completed Numbers</span>
              <p className="text-lg font-bold text-emerald-400">{feedNumbers.filter(f => f.status === "success" || f.status === "SUCCESS" || f.status === "MULTI SUCCESS").length}</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-sans font-semibold uppercase">Cancelled / Expired</span>
              <p className="text-lg font-bold text-rose-400">{feedNumbers.filter(f => f.status === "failed" || f.status === "cancelled").length}</p>
            </div>
          </div>
        </div>
      )}

      {/* API MANAGEMENT SECTION */}
      {activeSection === "otp_mgmt" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-400" /> {isAgent && !isOwner ? "Referred Clients API Management" : "API Management"}
              </h2>
              <p className="text-xs text-slate-400">
                {isAgent && !isOwner
                  ? "Monitor real-time verification code dispatch, timeout rules, auto-refund triggers, and regex parsers for your referred clients."
                  : "Monitor real-time verification code dispatch, timeout rules, auto-refund triggers, and regex parsers."}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold font-mono">
              Auto-Refund: Enabled (180s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-semibold">OTP Expiry Timer</span>
                <p className="text-white font-mono font-bold">180 Seconds</p>
              </div>
              <Settings className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-semibold">Auto Refund On Timeout</span>
                <p className="text-emerald-400 font-bold">ACTIVE</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-semibold">Parser Mode</span>
                <p className="text-white font-mono font-bold">Smart Regex v3</p>
              </div>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>
      )}

      {/* RATE MANAGEMENT SECTION */}
      {activeSection === "rate_mgmt" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-rose-400" /> Rate & Currency Management
              </h2>
              <p className="text-xs text-slate-400">
                Manage global USD/BDT conversion exchange rate and service pricing tiers.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold font-mono">
              1 USD = {usdExchangeRate} BDT
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">USD / BDT Exchange Rate</span>
              <p className="text-xl font-bold font-mono text-emerald-400">৳{usdExchangeRate.toFixed(2)} / $1.00</p>
              <p className="text-[11px] text-slate-500">Applied automatically across all deposit and service calculations.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Agent Commission Rate</span>
              <p className="text-xl font-bold font-mono text-indigo-400">10.00%</p>
              <p className="text-[11px] text-slate-500">Standard agent margin earned on client SMS completions.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Default Service Margin</span>
              <p className="text-xl font-bold font-mono text-amber-400">15.00%</p>
              <p className="text-[11px] text-slate-500">Base profit margin for standard service pricing.</p>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MANAGEMENT SECTION */}
      {activeSection === "payment_mgmt" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" /> {isAgent && !isOwner ? "User Payment Management" : "Payment & Deposit Management"}
              </h2>
              <p className="text-xs text-slate-400">
                {isAgent && !isOwner
                  ? "Review and approve deposit requests and manual balance topups for your referred users."
                  : "Review and approve client deposit requests, bKash/Nagad transactions, and manual topups."}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold font-mono">
              Gateways: bKash • Nagad • Crypto
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold text-[10px] uppercase">bKash Merchant</span>
              <p className="text-white font-mono font-bold">+8801700000000</p>
              <span className="text-emerald-400 text-[10px]">● Auto-Verification Active</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold text-[10px] uppercase">Nagad Merchant</span>
              <p className="text-white font-mono font-bold">+8801800000000</p>
              <span className="text-emerald-400 text-[10px]">● Auto-Verification Active</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold text-[10px] uppercase">Crypto (USDT TRC20)</span>
              <p className="text-white font-mono font-bold text-[10px] truncate">TOrabitSmsSystemAddress123</p>
              <span className="text-emerald-400 text-[10px]">● Instant Confirmation</span>
            </div>
          </div>
        </div>
      )}

      {/* Agent Management Section */}
      {activeSection === "agent_mgmt" && (
        <AgentManagement
          registeredUsers={registeredUsers}
          setRegisteredUsers={setRegisteredUsers}
          feedNumbers={feedNumbers}
          currency={currency}
          usdExchangeRate={usdExchangeRate}
          onUpdateUserBalance={onUpdateUserBalance}
        />
      )}

      {/* Team Users & Accounts Management */}
      {activeSection === "user_mgmt" && (
        <TeamUsersManager
          currentUser={userProfile}
          users={registeredUsers}
          onUpdateUser={(updatedUser) => {
            setRegisteredUsers((prev) => {
              const list = [...prev];
              const idx = list.findIndex(
                (u) => u.email.toLowerCase() === updatedUser.email.toLowerCase()
              );
              if (idx >= 0) list[idx] = updatedUser;
              else list.push(updatedUser);
              return list;
            });
          }}
          onAddBalance={(email, amount) => {
            setTopupAmount(amount.toString());
            handleTopup(email);
          }}
          currency={currency}
          usdExchangeRate={usdExchangeRate}
        />
      )}
    </div>
  );
};
