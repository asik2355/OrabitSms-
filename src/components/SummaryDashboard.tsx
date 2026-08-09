import React, { useState, useMemo } from "react";
import {
  Calendar,
  ChevronDown,
  Download,
  Layers,
  CheckCircle2,
  DollarSign,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Check,
  Zap,
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
  CartesianGrid,
} from "recharts";

interface SummaryDashboardProps {
  currency: "USD" | "BDT";
  usdExchangeRate?: number;
}

interface DailySummary {
  date: string;
  allocation: number;
  success: number;
  failed: number;
  rate: number;
  amountUSD: number;
}

const INITIAL_SUMMARY_DATA: DailySummary[] = [
  { date: "2026-08-03", allocation: 193, success: 32, failed: 161, rate: 16.58, amountUSD: 0.23 },
  { date: "2026-08-04", allocation: 134, success: 19, failed: 115, rate: 14.18, amountUSD: 0.12 },
  { date: "2026-08-05", allocation: 33, success: 7, failed: 26, rate: 21.21, amountUSD: 0.05 },
  { date: "2026-08-06", allocation: 12, success: 7, failed: 5, rate: 58.33, amountUSD: 0.05 },
  { date: "2026-08-07", allocation: 0, success: 0, failed: 0, rate: 0.0, amountUSD: 0.00 },
  { date: "2026-08-08", allocation: 16, success: 0, failed: 16, rate: 0.0, amountUSD: 0.00 },
  { date: "2026-08-09", allocation: 0, success: 0, failed: 0, rate: 0.0, amountUSD: 0.00 },
];

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  currency,
  usdExchangeRate = 100,
}) => {
  const [dateRange, setDateRange] = useState<string>("Last 7 Days");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const dateRangeOptions = [
    "Today",
    "Yesterday",
    "Last 7 Days",
    "Last 30 Days",
    "Custom Range",
  ];

  // Filter data based on date range selection
  const filteredData = useMemo(() => {
    let list = [...INITIAL_SUMMARY_DATA];
    if (dateRange === "Today") {
      list = list.filter((item) => item.date === "2026-08-08");
    } else if (dateRange === "Yesterday") {
      list = list.filter((item) => item.date === "2026-08-07");
    }
    if (searchFilter.trim()) {
      list = list.filter((item) => item.date.includes(searchFilter.trim()));
    }
    return list;
  }, [dateRange, searchFilter]);

  // Aggregate stats
  const totalAllocation = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.allocation, 0),
    [filteredData]
  );

  const totalSuccess = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.success, 0),
    [filteredData]
  );

  const totalFailed = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.failed, 0),
    [filteredData]
  );

  const totalEarningsUSD = useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.amountUSD, 0),
    [filteredData]
  );

  const overallSuccessRate = useMemo(() => {
    if (totalAllocation === 0) return 0;
    return Number(((totalSuccess / totalAllocation) * 100).toFixed(2));
  }, [totalSuccess, totalAllocation]);

  // Chart dataset with short formatted dates
  const chartData = useMemo(() => {
    return filteredData.map((d) => {
      const parts = d.date.split("-");
      const shortMonth = "Aug";
      const shortDate = `${shortMonth} ${parts[2]}`;
      return {
        ...d,
        shortDate,
        amountDisplay:
          currency === "BDT" ? d.amountUSD * usdExchangeRate : d.amountUSD,
      };
    });
  }, [filteredData, currency, usdExchangeRate]);

  // Format currency display helper
  const formatMoney = (usdVal: number) => {
    if (currency === "BDT") {
      const bdtVal = usdVal * usdExchangeRate;
      return `৳${bdtVal.toFixed(2)}`;
    }
    return `$${usdVal.toFixed(2)}`;
  };

  // Export CSV handler
  const handleDownloadCSV = () => {
    const headers = ["Date", "Allocation", "Success", "Failed", "Rate (%)", `Amount (${currency})`].join(",");
    const rows = filteredData.map((d) => {
      const amt = currency === "BDT" ? (d.amountUSD * usdExchangeRate).toFixed(2) : d.amountUSD.toFixed(2);
      return [d.date, d.allocation, d.success, d.failed, `${d.rate}%`, amt].join(",");
    });
    const totalRow = [
      "TOTAL",
      totalAllocation,
      totalSuccess,
      totalFailed,
      `${overallSuccessRate}%`,
      currency === "BDT" ? (totalEarningsUSD * usdExchangeRate).toFixed(2) : totalEarningsUSD.toFixed(2),
    ].join(",");

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows, totalRow].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orabit_summary_${dateRange.toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-10">
      {/* HEADER & TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>Summary Dashboard</span>
            <span className="text-[11px] font-mono font-bold bg-[#2EE59D]/15 text-[#2EE59D] border border-[#2EE59D]/30 px-2.5 py-0.5 rounded-full">
              LIVE
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Performance metrics and financial overview.
          </p>
        </div>

        {/* DATE RANGE FILTER DROPDOWN */}
        <div className="relative">
          <div className="p-3 rounded-2xl bg-[#131722]/90 border border-slate-800 flex items-center gap-3 shadow-lg">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Date range</span>
            
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-sm active:scale-95"
              >
                <span>{dateRange}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* DROPDOWN MENU */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#181d2b] border border-slate-700/80 shadow-2xl z-40 p-1.5 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                    {dateRangeOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setDateRange(option);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                          dateRange === option
                            ? "bg-[#2EE59D]/20 text-[#2EE59D]"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                      >
                        <span>{option}</span>
                        {dateRange === option && <Check className="w-3.5 h-3.5 text-[#2EE59D]" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 TOP METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TOTAL ALLOCATION */}
        <div className="group p-4 sm:p-5 rounded-2xl bg-[#131722]/90 border border-slate-800 hover:border-emerald-500/40 space-y-3 relative overflow-hidden shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider uppercase">
            <span className="group-hover:text-emerald-300 transition-colors">TOTAL ALLOCATION</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all">
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white font-mono group-hover:text-emerald-300 transition-colors">
              {totalAllocation}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>+557.63%</span>
              <span className="text-slate-500 font-normal">vs prev.</span>
            </div>
          </div>
        </div>

        {/* CARD 2: SUCCESS RATE */}
        <div className="group p-4 sm:p-5 rounded-2xl bg-[#131722]/90 border border-slate-800 hover:border-emerald-500/40 space-y-3 relative overflow-hidden shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider uppercase">
            <span className="group-hover:text-emerald-300 transition-colors">SUCCESS RATE</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white font-mono group-hover:text-emerald-300 transition-colors">
              {overallSuccessRate}%
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>+1.5pp</span>
              <span className="text-slate-500 font-normal">vs prev.</span>
            </div>
          </div>
        </div>

        {/* CARD 3: TOTAL EARNINGS */}
        <div className="group p-4 sm:p-5 rounded-2xl bg-[#131722]/90 border border-slate-800 hover:border-amber-500/40 space-y-3 relative overflow-hidden shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider uppercase">
            <span className="group-hover:text-amber-300 transition-colors">TOTAL EARNINGS</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500/25 transition-all">
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white font-mono group-hover:text-amber-300 transition-colors">
              {formatMoney(totalEarningsUSD)}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>+577.78%</span>
              <span className="text-slate-500 font-normal">vs prev.</span>
            </div>
          </div>
        </div>

        {/* CARD 4: TOTAL SUCCESS */}
        <div className="group p-4 sm:p-5 rounded-2xl bg-[#131722]/90 border border-slate-800 hover:border-purple-500/40 space-y-3 relative overflow-hidden shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold tracking-wider uppercase">
            <span className="group-hover:text-purple-300 transition-colors">TOTAL SUCCESS</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/25 transition-all">
              <CheckSquare className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white font-mono group-hover:text-purple-300 transition-colors">
              {totalSuccess}
            </div>
            <div className="text-[11px] font-medium text-slate-400">
              out of <span className="font-bold text-white">{totalAllocation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: SUCCESS VS FAILED TRENDS */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#131722]/90 border border-slate-800 space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Success vs Failed Trends</span>
            </h2>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#2EE59D] ring-2 ring-[#2EE59D]/30" />
                <span className="text-slate-300">Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
                <span className="text-slate-300">Failed</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2EE59D" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2EE59D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#181d2b",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    fontSize: "12px",
                    color: "#f8fafc",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="success"
                  stroke="#2EE59D"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                  name="Success"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stroke="#EF4444"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorFailed)"
                  name="Failed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: EARNINGS OVERVIEW */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#131722]/90 border border-slate-800 space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Earnings Overview</span>
            </h2>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              {currency}
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="shortDate" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [
                    currency === "BDT" ? `৳${Number(val).toFixed(2)}` : `$${Number(val).toFixed(2)}`,
                    "Earnings",
                  ]}
                  contentStyle={{
                    backgroundColor: "#181d2b",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    fontSize: "12px",
                    color: "#f8fafc",
                  }}
                />
                <Bar dataKey="amountDisplay" fill="#64748b" radius={[6, 6, 0, 0]} name="Earnings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DETAILED REPORT TABLE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#131722]/90 border border-slate-800 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Detailed Report</h2>
            <p className="text-xs text-slate-400">Daily breakdown of numbers allocated, OTP success rate and payout</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search date..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors w-36 sm:w-48"
              />
            </div>

            {/* DOWNLOAD CSV BUTTON */}
            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4 text-center">ALLOCATION</th>
                <th className="py-3 px-4 text-center">SUCCESS</th>
                <th className="py-3 px-4 text-center">FAILED</th>
                <th className="py-3 px-4 text-center">RATE</th>
                <th className="py-3 px-4 text-right">AMOUNT ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredData.map((row) => (
                <tr key={row.date} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-200 font-bold font-sans">{row.date}</td>
                  <td className="py-3 px-4 text-center text-slate-300 font-bold">{row.allocation}</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">{row.success}</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-bold">{row.failed}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-amber-500/20 font-bold text-[11px]">
                      {row.rate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                    {formatMoney(row.amountUSD)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900/90 text-white font-bold border-t-2 border-emerald-500/40 font-mono">
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
