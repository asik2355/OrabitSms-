import React, { useState, useEffect, useMemo } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import { FeedNumber } from "../types";
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
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
  ChevronRight,
  LogOut,
  Sparkles,
  Info,
  Building2,
  Phone,
  Mail,
  Zap,
} from "lucide-react";

interface AgentDashboardProps {
  userProfile: UserProfile | null;
  feedNumbers: FeedNumber[];
  currency: "USD" | "BDT";
  usdExchangeRate: number;
  onNavigateTab: (tab: string) => void;
  onLogout?: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  userProfile,
  feedNumbers,
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

  const agentEmail = userProfile?.email ? userProfile.email.toLowerCase().trim() : "";

  // Load all registered users from local storage
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

  // Apply search & status filter
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

  // Summary Metrics for Agent
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
    return `$ ${usd.toFixed(2)}`;
  };

  return (
    <div className="w-full min-h-screen bg-[#090d16] text-slate-100 p-3 sm:p-6 space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 text-xs font-bold ${
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

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#131b2e] to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Agent Control Dashboard
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Certified Agent
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Logged in as <span className="text-indigo-400 font-semibold">{userProfile?.email}</span> • Referred Clients Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab("dashboard")}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              Client View
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agent Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Referred Clients */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Referred</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{totalReferred}</p>
          <p className="text-[11px] text-slate-400">Clients registered with your referral email</p>
        </div>

        {/* Metric 2: Active Clients */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Status</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{activeCount}</p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-400 font-bold">{activeCount} ON</span>
            <span className="text-rose-400 font-bold">{disabledCount} OFF</span>
          </div>
        </div>

        {/* Metric 3: Total Client Deposits */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Referred Funds</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
            {formatMoney(totalClientsBalanceUSD)}
          </p>
          <p className="text-[11px] text-slate-400">Combined client balance</p>
        </div>

        {/* Metric 4: Referral Email Badge */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Your Agent ID</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs font-mono font-bold text-indigo-300 truncate">{userProfile?.email}</p>
          <p className="text-[10px] text-slate-400">Share this email with clients during registration</p>
        </div>
      </div>

      {/* Main Referred Clients Management Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
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
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  statusFilter === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={loadUsers}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Client List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">OTP Rate</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Agent Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-600" />
                      <p className="font-medium text-slate-400">No referred clients found.</p>
                      <p className="text-[11px] text-slate-500 max-w-sm">
                        When users register using your email <span className="text-indigo-400 font-mono">{agentEmail}</span> as their Agent Referral Email, they will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isActive = client.accountStatus !== "disabled";
                  const currentOtpRate = client.customOtpRate !== undefined ? client.customOtpRate : 0.15;

                  return (
                    <tr key={client.email} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name & Country */}
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-black text-xs">
                            {client.fullName.charAt(0).toUpperCase() || "U"}
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
                          <Mail className="w-3 h-3 text-indigo-400" /> {client.email}
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
                          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-indigo-500">
                            <input
                              type="number"
                              step="0.01"
                              value={customRateInput}
                              onChange={(e) => setCustomRateInput(e.target.value)}
                              className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white font-mono focus:outline-none"
                              placeholder="$"
                            />
                            <button
                              onClick={() => handleSaveOtpRate(client.email)}
                              className="px-2 py-0.5 rounded-lg bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-400"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingOtpUser(null)}
                              className="px-1.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:bg-slate-700"
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
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-mono text-xs flex items-center gap-1 transition-all"
                            title="Click to change custom OTP rate"
                          >
                            <Sliders className="w-3 h-3 text-indigo-400" />
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
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-amber-500/50">
                              <input
                                type="number"
                                value={topupAmount}
                                onChange={(e) => setTopupAmount(e.target.value)}
                                className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white font-mono focus:outline-none"
                              />
                              <button
                                onClick={() => handleClientTopup(client.email)}
                                className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                              >
                                TopUp
                              </button>
                              <button
                                onClick={() => setTopupUserEmail(null)}
                                className="px-1.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-xs hover:bg-slate-700"
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
