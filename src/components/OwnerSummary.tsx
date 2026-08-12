import React, { useState, useEffect, useMemo } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import { formatUSD } from "../lib/storageUtils";
import { FeedNumber } from "../types";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  ChevronDown,
  Download,
  Search,
  LayoutDashboard,
  Crown,
  Users,
  UserCheck,
  DollarSign,
  ShieldCheck,
  Mail,
  Phone,
  RefreshCw,
  Power,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface OwnerSummaryProps {
  userProfile: UserProfile | null;
  feedNumbers: FeedNumber[];
  currency: "USD" | "BDT";
  usdExchangeRate: number;
  onNavigateTab: (tab: "owner_dashboard" | "owner_summary") => void;
}

interface ClientPerformance {
  clientEmail: string;
  clientName: string;
  mobileNumber: string;
  country: string;
  balance: number;
  accountStatus: string;
  agentEmail: string;
  agentName: string;
  totalAllocations: number;
  totalSuccess: number;
  totalFailed: number;
  successRate: number;
  totalRevenueUSD: number;
}

export const OwnerSummary: React.FC<OwnerSummaryProps> = ({
  userProfile,
  feedNumbers = [],
  currency,
  usdExchangeRate = 100,
  onNavigateTab,
}) => {
  const [dateRange, setDateRange] = useState<string>("7 Days");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  const rangeOptions = ["Today", "Yesterday", "7 Days", "30 Days"];

  // Load all registered users
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
      console.error("Failed to load users in OwnerSummary:", e);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Separate agents and clients
  const agentsList = useMemo(() => {
    return allUsers.filter((u) => u.role === "agent" || u.isAgent);
  }, [allUsers]);

  const clientsList = useMemo(() => {
    return allUsers.filter((u) => u.role === "client" || (!u.role && !u.isOwner && !u.isAgent));
  }, [allUsers]);

  // Map each client to their assigned agent
  const clientAgentMap = useMemo(() => {
    const map = new Map<string, { agentEmail: string; agentName: string }>();

    clientsList.forEach((client) => {
      const ref = (client.referralEmail || client.referredBy || client.referredByAgentEmail || "").toLowerCase().trim();
      let foundAgent = agentsList.find(
        (a) =>
          a.email.toLowerCase().trim() === ref ||
          (a.referralCode && a.referralCode.toLowerCase().trim() === ref)
      );

      map.set(client.email.toLowerCase().trim(), {
        agentEmail: foundAgent ? foundAgent.email : ref || "Direct / House",
        agentName: foundAgent ? foundAgent.fullName || foundAgent.email.split("@")[0] : "DIRECT / HOUSE",
      });
    });

    return map;
  }, [clientsList, agentsList]);

  // Aggregate ALL system feeds from every client's localStorage key + passed feedNumbers
  const allSystemFeeds = useMemo(() => {
    const items: (FeedNumber & { clientEmail?: string })[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("orabit_feed_numbers_")) {
          const clientEmail = key.replace("orabit_feed_numbers_", "").toLowerCase().trim();
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed: FeedNumber[] = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              parsed.forEach((f) => {
                items.push({ ...f, clientEmail });
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("Error reading all client feeds in OwnerSummary:", e);
    }

    // Attach passed props feedNumbers
    if (feedNumbers.length > 0) {
      feedNumbers.forEach((f) => {
        items.push(f);
      });
    }

    return items;
  }, [feedNumbers]);

  // Compute Per-Client Detailed Performance across all Agents
  const clientsPerformanceList = useMemo<ClientPerformance[]>(() => {
    const perfMap = new Map<string, ClientPerformance>();

    // Initialize all registered clients
    clientsList.forEach((client) => {
      const emailKey = client.email.toLowerCase().trim();
      const agentInfo = clientAgentMap.get(emailKey) || {
        agentEmail: "Direct / House",
        agentName: "DIRECT / HOUSE",
      };

      perfMap.set(emailKey, {
        clientEmail: client.email,
        clientName: client.fullName || client.email.split("@")[0],
        mobileNumber: client.mobileNumber || "—",
        country: client.country || "Bangladesh",
        balance: client.balance || 0,
        accountStatus: client.accountStatus || "ACTIVE",
        agentEmail: agentInfo.agentEmail,
        agentName: agentInfo.agentName.toUpperCase(),
        totalAllocations: 0,
        totalSuccess: 0,
        totalFailed: 0,
        successRate: 0,
        totalRevenueUSD: 0,
      });
    });

    // Accumulate feeds per client
    allSystemFeeds.forEach((f) => {
      const clientEmail = (f.clientEmail || "").toLowerCase().trim();
      if (clientEmail && perfMap.has(clientEmail)) {
        const rec = perfMap.get(clientEmail)!;
        rec.totalAllocations += 1;
        if (f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || !f.status) {
          rec.totalSuccess += 1;
          rec.totalRevenueUSD += 0.006;
        } else if (f.status === "FAILED") {
          rec.totalFailed += 1;
        }
      }
    });

    // Calculate rates
    const result = Array.from(perfMap.values()).map((rec) => {
      const rate = rec.totalAllocations > 0 ? Number(((rec.totalSuccess / rec.totalAllocations) * 100).toFixed(1)) : 0;
      return {
        ...rec,
        successRate: rate,
      };
    });

    result.sort((a, b) => b.totalAllocations - a.totalAllocations);
    return result;
  }, [clientsList, clientAgentMap, allSystemFeeds]);

  // Filter clients table by Agent dropdown & Search
  const filteredClientDetails = useMemo(() => {
    return clientsPerformanceList.filter((item) => {
      const matchesAgent =
        agentFilter === "all" ||
        item.agentEmail.toLowerCase() === agentFilter.toLowerCase() ||
        item.agentName.toLowerCase().includes(agentFilter.toLowerCase());

      const search = clientSearch.toLowerCase().trim();
      const matchesSearch =
        !search ||
        item.clientName.toLowerCase().includes(search) ||
        item.clientEmail.toLowerCase().includes(search) ||
        item.agentName.toLowerCase().includes(search) ||
        item.agentEmail.toLowerCase().includes(search) ||
        item.mobileNumber.includes(search);

      return matchesAgent && matchesSearch;
    });
  }, [clientsPerformanceList, agentFilter, clientSearch]);

  // Compute live system daily summary from all feed numbers
  const liveSummaryData = useMemo(() => {
    const dates: string[] = [];
    const baseDate = new Date("2026-08-09T00:00:00Z");
    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate.getTime() - i * 86400000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      dates.push(`${yyyy}-${mm}-${dd}`);
    }

    const mapByDate: Record<string, { allocation: number; success: number; failed: number }> = {};
    dates.forEach((d) => {
      mapByDate[d] = { allocation: 0, success: 0, failed: 0 };
    });

    allSystemFeeds.forEach((fn) => {
      let dateKey = "2026-08-09";
      if (fn.requestedAt) {
        const d = new Date(fn.requestedAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        dateKey = `${yyyy}-${mm}-${dd}`;
      }
      if (!mapByDate[dateKey]) {
        mapByDate[dateKey] = { allocation: 0, success: 0, failed: 0 };
      }
      mapByDate[dateKey].allocation += 1;
      if (fn.status === "SUCCESS" || fn.status === "MULTI SUCCESS" || !fn.status) mapByDate[dateKey].success += 1;
      else if (fn.status === "FAILED") mapByDate[dateKey].failed += 1;
    });

    return Object.keys(mapByDate)
      .sort()
      .map((date) => {
        const item = mapByDate[date];
        const rate = item.allocation > 0 ? Number(((item.success / item.allocation) * 100).toFixed(2)) : 0;
        const amountUSD = item.success * 0.006;
        return {
          date,
          allocation: item.allocation,
          success: item.success,
          failed: item.failed,
          rate,
          amountUSD,
        };
      });
  }, [allSystemFeeds]);

  // Filter data based on selected date range
  const filteredData = useMemo(() => {
    let list = [...liveSummaryData];
    if (dateRange === "Today") {
      list = list.filter((item) => item.date === "2026-08-09");
    } else if (dateRange === "Yesterday") {
      list = list.filter((item) => item.date === "2026-08-08");
    } else if (dateRange === "7 Days") {
      list = list.slice(-7);
    } else if (dateRange === "30 Days") {
      list = list.slice(-30);
    }

    if (searchFilter.trim()) {
      list = list.filter((item) => item.date.includes(searchFilter.trim()));
    }
    return list;
  }, [liveSummaryData, dateRange, searchFilter]);

  // Aggregated totals
  const totalAllocation = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.allocation, 0), [filteredData]);
  const totalSuccess = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.success, 0), [filteredData]);
  const totalFailed = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.failed, 0), [filteredData]);
  const totalEarningsUSD = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.amountUSD, 0), [filteredData]);

  const overallSuccessRate = useMemo(() => {
    if (totalAllocation === 0) return 0;
    return Number(((totalSuccess / totalAllocation) * 100).toFixed(2));
  }, [totalSuccess, totalAllocation]);

  const formatMoney = (amountUSD: number) => {
    if (currency === "BDT") {
      const bdt = amountUSD * usdExchangeRate;
      return `৳ ${bdt.toFixed(2)}`;
    }
    return `$ ${formatUSD(amountUSD).replace("$", "")}`;
  };

  const handleDownloadCSV = () => {
    const headers = ["Client Name", "Client Email", "Assigned Agent", "Total OTPs", "Success", "Failed", "Success Rate (%)", "Balance (USD)"];
    const rows = filteredClientDetails.map((row) => [
      row.clientName,
      row.clientEmail,
      row.agentName,
      row.totalAllocations,
      row.totalSuccess,
      row.totalFailed,
      `${row.successRate}%`,
      formatUSD(row.balance),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Owner_All_Agents_Clients_Summary_${dateRange.replace(" ", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen bg-[#0d1117] text-slate-100 p-3 sm:p-6 space-y-6 font-sans selection:bg-amber-500/30">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#151c28] to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
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
                  Owner Summary: All Agents & Clients
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> FULL MASTER ACCESS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete real-time performance breakdown for every agent and all their clients across the network.
              </p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => onNavigateTab("owner_dashboard")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Owner Dashboard</span>
            </button>

            <button
              onClick={() => onNavigateTab("owner_summary")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#2EE59D] text-slate-950 shadow-md transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Owner Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards for Agents & Clients */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Total Agents</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{agentsList.length}</p>
          <p className="text-[11px] text-slate-400">Team Leaders Onboarded</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Total Clients</span>
            <UserCheck className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white font-mono">{clientsList.length}</p>
          <p className="text-[11px] text-slate-400">Across all Agents</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">System Success Rate</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{overallSuccessRate}%</p>
          <p className="text-[11px] text-slate-400">System-wide success</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Gross Profit</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{formatMoney(totalEarningsUSD)}</p>
          <p className="text-[11px] text-slate-400">Total system revenue</p>
        </div>
      </div>

      {/* MAIN SECTION: All Agents' Clients Master Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" /> All Agents & Their Clients Master Details
            </h2>
            <p className="text-xs text-slate-400">
              Live activity, balances, and OTP metrics for every client grouped under their assigned agent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Agent Dropdown Filter */}
            <div className="relative">
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">All Agents ({agentsList.length})</option>
                {agentsList.map((a) => (
                  <option key={a.email} value={a.email}>
                    Agent: {a.fullName || a.email.split("@")[0]} ({a.email})
                  </option>
                ))}
                <option value="direct">Direct / House Clients</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Search agent, client, email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={loadUsers}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh All Clients Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Master Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4">Client Details</th>
                <th className="py-3 px-4 text-center">Total OTPs</th>
                <th className="py-3 px-4 text-center text-emerald-400">Success</th>
                <th className="py-3 px-4 text-center text-rose-400">Failed</th>
                <th className="py-3 px-4 text-center text-amber-300">Success Rate</th>
                <th className="py-3 px-4 text-right">Client Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredClientDetails.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-600" />
                      <p className="font-medium text-slate-400">No client records found matching filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClientDetails.map((client) => {
                  const isActive = client.accountStatus !== "DISABLED";
                  return (
                    <tr key={client.clientEmail} className="hover:bg-slate-800/40 transition-colors">
                      {/* Assigned Agent */}
                      <td className="py-3 px-4 font-bold text-amber-300">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xs">
                            {client.agentName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-amber-300 font-bold">{client.agentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{client.agentEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Client Details */}
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-bold">{client.clientName}</p>
                          <p className="text-[10px] text-purple-300 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-purple-400" /> {client.clientEmail}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" /> {client.mobileNumber} ({client.country})
                          </p>
                        </div>
                      </td>

                      {/* Total OTPs */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-white text-sm">
                        {client.totalAllocations}
                      </td>

                      {/* Success */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400 text-sm">
                        {client.totalSuccess}
                      </td>

                      {/* Failed */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-rose-400 text-sm">
                        {client.totalFailed}
                      </td>

                      {/* Success Rate */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-300">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                          {client.successRate}%
                        </span>
                      </td>

                      {/* Client Balance */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatMoney(client.balance)}
                      </td>

                      {/* Account Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isActive
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          {isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Daily Allocations vs Success Chart (All Clients)
        </h2>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
              />
              <Bar dataKey="allocation" fill="#3b82f6" name="Allocations" radius={[4, 4, 0, 0]} />
              <Bar dataKey="success" fill="#10b981" name="Success" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="#f43f5e" name="Failed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
