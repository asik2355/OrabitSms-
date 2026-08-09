import React, { useState, useEffect, useMemo } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import { FeedNumber } from "../types";
import { createAgentInSupabase } from "../lib/userRoles";
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
} from "lucide-react";

interface OwnerDashboardProps {
  userProfile: UserProfile | null;
  feedNumbers: FeedNumber[];
  currency: "USD" | "BDT";
  usdExchangeRate: number;
  onNavigateTab: (tab: "owner_dashboard" | "owner_summary") => void;
  onUpdateUserBalance?: (userEmail: string, addAmount: number) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  userProfile,
  feedNumbers,
  currency,
  usdExchangeRate,
  onNavigateTab,
  onUpdateUserBalance,
}) => {
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
    () => feedNumbers.filter((f) => f.status === "SUCCESS").length,
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

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return registeredUsers;
    const q = searchQuery.toLowerCase().trim();
    return registeredUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.mobileNumber.includes(q) ||
        (u.country && u.country.toLowerCase().includes(q))
    );
  }, [registeredUsers, searchQuery]);

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
                  ORABIT SMS Portal
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> System Owner
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Logged in as <span className="text-emerald-400 font-semibold">{userProfile?.email || "orabitsms@gmail.com"}</span> • Full System Privilege Access
              </p>
            </div>
          </div>

          {/* Quick Sub-Navigation Pills */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => onNavigateTab("owner_dashboard")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#2EE59D] text-slate-950 shadow-md transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Owner Dashboard</span>
            </button>

            <button
              onClick={() => onNavigateTab("owner_summary")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Owner Summary</span>
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

      {/* Agent Management Section */}
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

      {/* Client Accounts Management Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" /> Registered Accounts Management
            </h2>
            <p className="text-xs text-slate-400">View registered client profiles and add funds to accounts</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, email, phone..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={loadRegisteredUsers}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Users"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Owner Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No registered client accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isOwnerUser = user.email.toLowerCase() === "orabitsms@gmail.com" || user.role === "Owner";
                  return (
                    <tr key={user.email} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-black text-xs">
                          {user.fullName.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span>{user.fullName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">{user.email}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{user.mobileNumber || "—"}</td>
                      <td className="py-3 px-4">
                        {isOwnerUser ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold text-[10px] uppercase tracking-wider border border-amber-500/30">
                            Owner
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-semibold">
                            Client
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatMoney(user.balance || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {selectedUserEmail === user.email ? (
                          <div className="flex items-center justify-center gap-1 bg-slate-950 p-1 rounded-xl border border-emerald-500/40">
                            <input
                              type="number"
                              value={topupAmount}
                              onChange={(e) => setTopupAmount(e.target.value)}
                              className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none"
                              placeholder="USD"
                            />
                            <button
                              onClick={() => {
                                handleTopup(user.email);
                                setSelectedUserEmail(null);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setSelectedUserEmail(null)}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs hover:bg-slate-700"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedUserEmail(user.email)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1 mx-auto"
                          >
                            <Plus className="w-3.5 h-3.5" /> Top Up
                          </button>
                        )}
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
