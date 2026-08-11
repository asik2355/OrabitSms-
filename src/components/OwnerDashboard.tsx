import React, { useState, useEffect, useMemo } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import { FeedNumber } from "../types";
import { createAgentInSupabase } from "../lib/userRoles";
import { TeamUsersManager } from "./TeamUsersManager";
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
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentNotice, setAgentNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleCreateAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanE = newAgentEmail.trim().toLowerCase();
    if (!cleanE || !newAgentPassword.trim()) {
      setAgentNotice({ text: "Please enter both Email and Password for the Agent.", type: "error" });
      return;
    }

    setIsCreatingAgent(true);
    setAgentNotice(null);

    const res = await createAgentInSupabase(cleanE, newAgentPassword);

    if (res.success) {
      try {
        const stored = localStorage.getItem("orabit_registered_users");
        let list: UserProfile[] = stored ? JSON.parse(stored) : [];
        const existingIdx = list.findIndex((u) => u.email.toLowerCase() === cleanE);

        const newAgentObj: UserProfile = {
          fullName: `Agent (${cleanE.split("@")[0]})`,
          mobileNumber: "01700000000",
          email: cleanE,
          telegram: "@agent_orabit",
          city: "Dhaka",
          country: "Bangladesh",
          referralEmail: "orabitsms@gmail.com",
          withdrawPin: "1234",
          balance: 0.0,
          password: newAgentPassword,
          role: "Agent",
        };

        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], role: "Agent", password: newAgentPassword };
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
    } else {
      setAgentNotice({ text: res.message, type: "error" });
    }

    setIsCreatingAgent(false);
  };

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
    return `$ ${amountUSD.toFixed(2)}`;
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

          {/* Quick Sub-Navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => onNavigateTab(isAgent && !isOwner ? "agent_dashboard" : "owner_dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                !activeSection || activeSection === "overview"
                  ? "bg-[#2EE59D] text-slate-950 shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onNavigateTab(isAgent && !isOwner ? "agent_summary" : "owner_summary")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all whitespace-nowrap"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Summary</span>
            </button>

            {isOwner && (
              <button
                onClick={() => onNavigateTab("owner_agent_mgmt")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeSection === "agent_mgmt"
                    ? "bg-indigo-600 text-white font-bold shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Agent Management</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab("owner_user_mgmt")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeSection === "user_mgmt"
                  ? "bg-emerald-600 text-white font-bold shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>User Management</span>
            </button>

            {isOwner && (
              <button
                onClick={() => onNavigateTab("owner_panel_mgmt")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeSection === "panel_mgmt"
                    ? "bg-amber-600 text-white font-bold shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Panel Management</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => onNavigateTab("owner_number_file")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeSection === "number_file"
                    ? "bg-cyan-600 text-white font-bold shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Number File</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab("owner_otp_mgmt")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeSection === "otp_mgmt"
                  ? "bg-purple-600 text-white font-bold shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>API Management</span>
            </button>

            {isOwner && (
              <button
                onClick={() => onNavigateTab("owner_rate_mgmt")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeSection === "rate_mgmt"
                    ? "bg-rose-600 text-white font-bold shadow-md"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Percent className="w-3.5 h-3.5 text-rose-400" />
                <span>Rate Management</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab("owner_payment_mgmt")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeSection === "payment_mgmt"
                  ? "bg-blue-600 text-white font-bold shadow-md"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-400" />
              <span>User Payment</span>
            </button>
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

      {/* System KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Registered Clients */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clients</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{totalUsersCount}</p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" /> Accounts registered
          </p>
        </div>

        {/* KPI 2: Total User Balances */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">User Balances</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {formatMoney(totalUserBalancesUSD)}
          </p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Total deposited funds
          </p>
        </div>

        {/* KPI 3: System Number Feeds */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">System Allocations</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{totalSystemAllocations}</p>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-emerald-400">✓ {totalSystemSuccess}</span>
            <span className="text-rose-400">✗ {totalSystemFailed}</span>
          </div>
        </div>

        {/* KPI 4: Success Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">{systemSuccessRate}%</p>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-400" /> Platform OTP success
          </p>
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

      {/* PANEL MANAGEMENT SECTION */}
      {(!activeSection || activeSection === "overview" || activeSection === "panel_mgmt") && (
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
      {(!activeSection || activeSection === "overview" || activeSection === "number_file") && (
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
      {(!activeSection || activeSection === "overview" || activeSection === "otp_mgmt") && (
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
      {(!activeSection || activeSection === "overview" || activeSection === "rate_mgmt") && (
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
      {(!activeSection || activeSection === "overview" || activeSection === "payment_mgmt") && (
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
      {(!activeSection || activeSection === "overview" || activeSection === "agent_mgmt") && (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" /> Agent Management
            </h2>
            <p className="text-xs text-slate-400">
              Create and authorize system Agents. Assigned agents can manage their own referred client base.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold font-mono">
            Role: 'agent'
          </span>
        </div>

        {/* Agent Notice Toast */}
        {agentNotice && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              agentNotice.type === "success"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                : "bg-rose-950/80 border-rose-500 text-rose-300"
            }`}
          >
            {agentNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{agentNotice.text}</span>
          </div>
        )}

        {/* Create Agent Form */}
        <form onSubmit={handleCreateAgentSubmit} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-400" /> Create New Agent Account
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={newAgentEmail}
                onChange={(e) => setNewAgentEmail(e.target.value)}
                placeholder="Agent Email (e.g. agent@domain.com)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={newAgentPassword}
                onChange={(e) => setNewAgentPassword(e.target.value)}
                placeholder="Agent Password (min 6 characters)"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreatingAgent}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isCreatingAgent ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Agent & Setting Role...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Agent & Set 'agent' Role</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* List of Agents */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active System Agents ({registeredUsers.filter((u) => u.role?.toLowerCase() === "agent").length})
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800">
                  <th className="py-2.5 px-3">Agent Email</th>
                  <th className="py-2.5 px-3">Assigned Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Referred Clients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {registeredUsers.filter((u) => u.role?.toLowerCase() === "agent").length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500 font-sans">
                      No agents created yet. Use the form above to add an agent.
                    </td>
                  </tr>
                ) : (
                  registeredUsers
                    .filter((u) => u.role?.toLowerCase() === "agent")
                    .map((agent) => {
                      const referredCount = registeredUsers.filter(
                        (cl) => cl.referralEmail?.toLowerCase().trim() === agent.email.toLowerCase().trim()
                      ).length;
                      return (
                        <tr key={agent.email} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-indigo-300 font-bold">{agent.email}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] uppercase font-bold border border-indigo-500/30">
                              agent
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 font-sans">
                              <UserCheck className="w-3 h-3" /> Active
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-white font-bold">{referredCount} Clients</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Team Users & Accounts Management */}
      {(!activeSection || activeSection === "overview" || activeSection === "user_mgmt") && (
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
