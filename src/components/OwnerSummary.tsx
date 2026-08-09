import React, { useState, useMemo } from "react";
import { FeedNumber } from "../types";
import { UserProfile } from "./OrabitAuthScreen";
import {
  BarChart3,
  Crown,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Hash,
  CheckCircle2,
  XCircle,
  Download,
  Search,
  Calendar,
  ChevronDown,
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

  const rangeOptions = ["Today", "Yesterday", "7 Days", "30 Days"];

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

    feedNumbers.forEach((fn) => {
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
      if (fn.status === "SUCCESS") mapByDate[dateKey].success += 1;
      else if (fn.status === "FAILED") mapByDate[dateKey].failed += 1;
    });

    return Object.keys(mapByDate)
      .sort()
      .map((date) => {
        const item = mapByDate[date];
        const rate = item.allocation > 0 ? Number(((item.success / item.allocation) * 100).toFixed(2)) : 0;
        const amountUSD = Number((item.success * 0.006).toFixed(2));
        return {
          date,
          allocation: item.allocation,
          success: item.success,
          failed: item.failed,
          rate,
          amountUSD,
        };
      });
  }, [feedNumbers]);

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
    return `$ ${amountUSD.toFixed(2)}`;
  };

  const handleDownloadCSV = () => {
    const headers = ["Date", "Allocation", "Success", "Failed", "Success Rate (%)", "Gross Amount (USD)"];
    const rows = filteredData.map((row) => [
      row.date,
      row.allocation,
      row.success,
      row.failed,
      `${row.rate}%`,
      `$${row.amountUSD.toFixed(2)}`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Owner_Summary_${dateRange.replace(" ", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full min-h-screen bg-[#0d1117] text-slate-100 p-3 sm:p-6 space-y-6 font-sans">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#151c28] to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Owner Performance Summary
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Owner Access
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                System-wide analytics, OTP success rates, and total revenue tracking
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

      {/* Date Range Selector & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 sm:p-4 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date Range:</span>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-bold text-white transition-all"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-44 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1 z-30 space-y-0.5">
                {rangeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setDateRange(opt);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      dateRange === opt ? "bg-[#2EE59D] text-slate-950 font-bold" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search date YYYY-MM..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Allocations</span>
          <p className="text-2xl font-black text-white font-mono">{totalAllocation}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Success</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">{totalSuccess}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Failed</span>
          <p className="text-2xl font-black text-rose-400 font-mono">{totalFailed}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">Success Rate</span>
          <p className="text-2xl font-black text-amber-300 font-mono">{overallSuccessRate}%</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Gross Profit</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">{formatMoney(totalEarningsUSD)}</p>
        </div>
      </div>

      {/* System Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" /> Daily Allocations vs Success Chart
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

      {/* Detailed Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-400" /> System Daily Log Breakdown
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Allocations</th>
                <th className="py-3 px-4 text-center text-emerald-400">Success</th>
                <th className="py-3 px-4 text-center text-rose-400">Failed</th>
                <th className="py-3 px-4 text-center text-amber-300">Rate (%)</th>
                <th className="py-3 px-4 text-right text-emerald-400">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No summary data recorded for this period.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.date} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-200 font-bold font-sans">{row.date}</td>
                    <td className="py-3 px-4 text-center text-slate-300 font-bold">{row.allocation}</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-bold">{row.success}</td>
                    <td className="py-3 px-4 text-center text-rose-400 font-bold">{row.failed}</td>
                    <td className="py-3 px-4 text-center text-amber-300 font-bold">{row.rate}%</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">{formatMoney(row.amountUSD)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950/90 text-white font-bold border-t-2 border-emerald-500/40 font-mono">
                <td className="py-3 px-4 text-emerald-400 uppercase tracking-wider font-sans font-black">TOTAL</td>
                <td className="py-3 px-4 text-center text-white">{totalAllocation}</td>
                <td className="py-3 px-4 text-center text-emerald-400">{totalSuccess}</td>
                <td className="py-3 px-4 text-center text-rose-400">{totalFailed}</td>
                <td className="py-3 px-4 text-center text-amber-300">{overallSuccessRate}%</td>
                <td className="py-3 px-4 text-right text-emerald-400 text-sm">{formatMoney(totalEarningsUSD)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
