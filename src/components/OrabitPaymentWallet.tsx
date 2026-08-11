import React, { useState, useEffect } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import { ServiceLogo } from "./ServiceLogo";
import { saveUserProfileToSupabase } from "../lib/userProfiles";
import {
  Wallet,
  CreditCard,
  Edit2,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  X,
  AlertCircle,
  Lock,
} from "lucide-react";

export interface PaymentMethodsData {
  bkash: string;
  nagad: string;
  binanceUid: string;
  bep20: string;
}

export interface TransactionHistoryItem {
  id: string;
  type: "withdrawal";
  method: string;
  accountOrAddress: string;
  amount: number; // in BDT
  date: string;
  timestamp: number;
  status: "Done" | "Pending" | "Rejected";
}

const DEFAULT_METHODS: PaymentMethodsData = {
  bkash: "",
  nagad: "",
  binanceUid: "",
  bep20: "",
};

const DEFAULT_HISTORY: TransactionHistoryItem[] = [];

interface OrabitPaymentWalletProps {
  userProfile: UserProfile;
  onUpdateBalance: (newBalance: number) => void;
  onUpdateProfile?: (updated: UserProfile) => void;
  currency?: "BDT" | "USD";
  usdExchangeRate?: number;
}

export const OrabitPaymentWallet: React.FC<OrabitPaymentWalletProps> = ({
  userProfile,
  onUpdateBalance,
  onUpdateProfile,
  currency = "BDT",
  usdExchangeRate = 100,
}) => {
  const accountKey = userProfile?.email ? userProfile.email.toLowerCase().trim() : "default";
  const methodsStorageKey = `orabit_payment_methods_${accountKey}`;
  const historyStorageKey = `orabit_withdraw_history_${accountKey}`;

  // Load saved payment methods
  const [methods, setMethods] = useState<PaymentMethodsData>(() => {
    try {
      const saved = localStorage.getItem(methodsStorageKey) || localStorage.getItem("orabit_payment_methods");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          bkash: parsed.bkash && !parsed.bkash.includes("****") ? parsed.bkash : "",
          nagad: parsed.nagad && !parsed.nagad.includes("****") ? parsed.nagad : "",
          binanceUid: parsed.binanceUid && parsed.binanceUid !== "128938402" ? parsed.binanceUid : "",
          bep20: parsed.bep20 && !parsed.bep20.includes("****") ? parsed.bep20 : "",
        };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_METHODS;
  });

  // Load saved withdrawal history
  const [history, setHistory] = useState<TransactionHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(historyStorageKey) || localStorage.getItem("orabit_withdraw_history");
      if (saved) {
        const parsed: TransactionHistoryItem[] = JSON.parse(saved);
        return parsed.filter(
          (item) => item.type === "withdrawal" && item.id !== "tx-1" && item.id !== "tx-2" && !item.accountOrAddress.includes("****")
        );
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_HISTORY;
  });

  // Sync methods & history when accountKey changes
  useEffect(() => {
    try {
      const savedM = localStorage.getItem(methodsStorageKey);
      if (savedM) {
        const parsed = JSON.parse(savedM);
        setMethods({
          bkash: parsed.bkash && !parsed.bkash.includes("****") ? parsed.bkash : "",
          nagad: parsed.nagad && !parsed.nagad.includes("****") ? parsed.nagad : "",
          binanceUid: parsed.binanceUid && parsed.binanceUid !== "128938402" ? parsed.binanceUid : "",
          bep20: parsed.bep20 && !parsed.bep20.includes("****") ? parsed.bep20 : "",
        });
      } else {
        setMethods(DEFAULT_METHODS);
      }

      const savedH = localStorage.getItem(historyStorageKey);
      if (savedH) {
        const parsed = JSON.parse(savedH);
        setHistory(parsed.filter((item: any) => item.type === "withdrawal" && item.id !== "tx-1" && item.id !== "tx-2"));
      } else {
        setHistory(DEFAULT_HISTORY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [accountKey]);

  // Modals & Forms state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<keyof PaymentMethodsData | null>(null);

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [selectedMethodKey, setSelectedMethodKey] = useState<keyof PaymentMethodsData>("bkash");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  // Edit Form Fields
  const [formBkash, setFormBkash] = useState(methods.bkash);
  const [formNagad, setFormNagad] = useState(methods.nagad);
  const [formBinanceUid, setFormBinanceUid] = useState(methods.binanceUid);
  const [formBep20, setFormBep20] = useState(methods.bep20);

  // PIN verification states
  const [editModalPin, setEditModalPin] = useState("");
  const [newWalletPin, setNewWalletPin] = useState("");
  const [confirmWalletPin, setConfirmWalletPin] = useState("");
  const [editModalError, setEditModalError] = useState<string | null>(null);

  const [withdrawModalPin, setWithdrawModalPin] = useState("");

  // History Time Filter
  const [timeFilter, setTimeFilter] = useState<"All" | "7D" | "30D">("All");

  // Save payment methods to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(methodsStorageKey, JSON.stringify(methods));
    } catch (e) {
      console.error(e);
    }
  }, [methods, methodsStorageKey]);

  // Save withdrawal history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history, historyStorageKey]);

  // Open Edit Modal with current values
  const openEditModal = (targetKey?: keyof PaymentMethodsData) => {
    setFormBkash(methods.bkash);
    setFormNagad(methods.nagad);
    setFormBinanceUid(methods.binanceUid);
    setFormBep20(methods.bep20);
    setEditModalPin("");
    setNewWalletPin("");
    setConfirmWalletPin("");
    setEditModalError(null);
    setEditingKey(targetKey || null);
    setEditModalOpen(true);
  };

  const handleSaveMethods = (e: React.FormEvent) => {
    e.preventDefault();
    setEditModalError(null);

    const isPinSet = userProfile.withdrawPin && userProfile.withdrawPin.length === 4;

    if (isPinSet) {
      if (!editModalPin || editModalPin !== userProfile.withdrawPin) {
        setEditModalError("Incorrect 4-Digit Withdraw PIN!");
        return;
      }
    } else {
      if (!newWalletPin || !/^\d{4}$/.test(newWalletPin)) {
        setEditModalError("Please set a 4-digit Withdraw PIN!");
        return;
      }
      if (newWalletPin !== confirmWalletPin) {
        setEditModalError("Withdraw PIN and Confirm PIN do not match!");
        return;
      }
      const updatedProfile = { ...userProfile, withdrawPin: newWalletPin };
      if (onUpdateProfile) onUpdateProfile(updatedProfile);
      saveUserProfileToSupabase(updatedProfile);
    }

    const updated: PaymentMethodsData = {
      bkash: formBkash.trim(),
      nagad: formNagad.trim(),
      binanceUid: formBinanceUid.trim(),
      bep20: formBep20.trim(),
    };
    setMethods(updated);
    setEditModalOpen(false);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const isPinSet = userProfile.withdrawPin && userProfile.withdrawPin.length === 4;

    if (!isPinSet) {
      setWithdrawError("Please set your 4-digit Withdraw PIN in your Profile settings first!");
      return;
    }

    if (!withdrawModalPin || withdrawModalPin !== userProfile.withdrawPin) {
      setWithdrawError("Incorrect Withdraw PIN! Please enter your 4-digit PIN.");
      return;
    }

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError("Please enter a valid amount to withdraw.");
      return;
    }

    if (amt > userProfile.balance) {
      setWithdrawError(`Insufficient balance. Your current balance is ৳${userProfile.balance.toFixed(2)}.`);
      return;
    }

    const savedAddress = methods[selectedMethodKey];
    if (!savedAddress || savedAddress.trim() === "" || savedAddress.toLowerCase() === "not set") {
      setWithdrawError(`Please set your ${selectedMethodKey.toUpperCase()} payment address/number first.`);
      return;
    }

    // Method Display Name
    const methodNames: Record<keyof PaymentMethodsData, string> = {
      bkash: "Bkash",
      nagad: "Nagad",
      binanceUid: "Binance UID",
      bep20: "BEP20 USDT",
    };

    // Deduct Balance
    const newBal = userProfile.balance - amt;
    onUpdateBalance(newBal);

    // Create New Withdrawal Transaction Record
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    const newTx: TransactionHistoryItem = {
      id: "tx-" + Date.now(),
      type: "withdrawal",
      method: methodNames[selectedMethodKey],
      accountOrAddress: savedAddress,
      amount: amt,
      date: dateStr,
      timestamp: Date.now(),
      status: "Done",
    };

    setHistory((prev) => [newTx, ...prev]);
    setWithdrawSuccess(`Withdrawal of ৳${amt.toFixed(2)} requested successfully to ${methodNames[selectedMethodKey]} (${savedAddress}).`);
    setWithdrawAmount("");
    setWithdrawModalPin("");
    setTimeout(() => {
      setWithdrawModalOpen(false);
      setWithdrawSuccess(null);
    }, 2000);
  };

  // Filtered Withdrawal History
  const filteredHistory = history.filter((item) => {
    if (item.type !== "withdrawal") return false;

    if (timeFilter === "7D") {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (item.timestamp < sevenDaysAgo) return false;
    } else if (timeFilter === "30D") {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      if (item.timestamp < thirtyDaysAgo) return false;
    }

    return true;
  });

  const formatAmount = (bdtAmount: number) => {
    if (currency === "USD") {
      return `$${(bdtAmount / usdExchangeRate).toFixed(2)}`;
    }
    return `৳${bdtAmount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans">
      {/* HEADER TITLE */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Wallet & Payouts</h1>
            <p className="text-xs text-slate-400">Manage payment methods & instantly request payouts</p>
          </div>
        </div>
      </div>

      {/* 1. AVAILABLE BALANCE CARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1424] to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            AVAILABLE BALANCE
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
            1 USD = {usdExchangeRate} BDT
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
              {formatAmount(userProfile.balance)}
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Rate fixed • Fast payout processing within 12–24 hours
            </p>
          </div>

          <button
            onClick={() => {
              setWithdrawError(null);
              setWithdrawSuccess(null);
              setWithdrawModalOpen(true);
            }}
            className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-teal-300 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 self-start sm:self-center cursor-pointer"
          >
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* 2. PAYMENT METHODS SECTION */}
      <div className="p-6 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 -left-20 w-56 h-56 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 -right-20 w-56 h-56 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Section Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-200 uppercase tracking-widest">
                PAYMENT METHODS
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">Select method for payout processing</p>
            </div>
          </div>
          <button
            onClick={() => openEditModal()}
            className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manage All</span>
          </button>
        </div>

        {/* Payment Methods Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-10">
          {/* BKASH CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#180b18] to-slate-950 border border-pink-500/20 hover:border-pink-500/50 shadow-md hover:shadow-pink-500/10 transition-all duration-300 flex items-center justify-between group">
            <div className="flex items-center gap-3.5 min-w-0">
              <ServiceLogo name="BKASH" className="w-12 h-12" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-100 group-hover:text-pink-300 transition-colors">BKASH</span>
                  <span className="text-[9px] bg-pink-500/15 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-mono font-bold tracking-tight">
                    Personal
                  </span>
                </div>
                <div className="font-mono text-xs font-medium text-slate-300 mt-1 truncate">
                  {methods.bkash && methods.bkash.trim() !== "" ? (
                    <span className="text-pink-200 font-bold tracking-wide">{methods.bkash}</span>
                  ) : (
                    <span className="text-slate-500 italic">Not set</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => openEditModal("bkash")}
              className="text-xs font-bold text-pink-400 hover:text-pink-200 bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 px-3 py-1.5 rounded-xl transition-all font-mono shrink-0 cursor-pointer ml-2"
            >
              {methods.bkash ? "Change" : "+ Add"}
            </button>
          </div>

          {/* NAGAD CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#1c0f0a] to-slate-950 border border-orange-500/20 hover:border-orange-500/50 shadow-md hover:shadow-orange-500/10 transition-all duration-300 flex items-center justify-between group">
            <div className="flex items-center gap-3.5 min-w-0">
              <ServiceLogo name="NAGAD" className="w-12 h-12" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-100 group-hover:text-orange-300 transition-colors">NAGAD</span>
                  <span className="text-[9px] bg-orange-500/15 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-mono font-bold tracking-tight">
                    Personal
                  </span>
                </div>
                <div className="font-mono text-xs font-medium text-slate-300 mt-1 truncate">
                  {methods.nagad && methods.nagad.trim() !== "" ? (
                    <span className="text-orange-200 font-bold tracking-wide">{methods.nagad}</span>
                  ) : (
                    <span className="text-slate-500 italic">Not set</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => openEditModal("nagad")}
              className="text-xs font-bold text-orange-400 hover:text-orange-200 bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/30 px-3 py-1.5 rounded-xl transition-all font-mono shrink-0 cursor-pointer ml-2"
            >
              {methods.nagad ? "Change" : "+ Add"}
            </button>
          </div>

          {/* BINANCE UID CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#1c190a] to-slate-950 border border-yellow-500/20 hover:border-yellow-500/50 shadow-md hover:shadow-yellow-500/10 transition-all duration-300 flex items-center justify-between group">
            <div className="flex items-center gap-3.5 min-w-0">
              <ServiceLogo name="BINANCE" className="w-12 h-12" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-100 group-hover:text-yellow-300 transition-colors">BINANCE UID</span>
                  <span className="text-[9px] bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-mono font-bold tracking-tight">
                    Direct UID
                  </span>
                </div>
                <div className="font-mono text-xs font-medium text-slate-300 mt-1 truncate">
                  {methods.binanceUid && methods.binanceUid.trim() !== "" ? (
                    <span className="text-yellow-200 font-bold tracking-wide">{methods.binanceUid}</span>
                  ) : (
                    <span className="text-slate-500 italic">Not set</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => openEditModal("binanceUid")}
              className="text-xs font-bold text-yellow-400 hover:text-yellow-200 bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-500/30 px-3 py-1.5 rounded-xl transition-all font-mono shrink-0 cursor-pointer ml-2"
            >
              {methods.binanceUid ? "Change" : "+ Add"}
            </button>
          </div>

          {/* BEP20 CARD */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0a1c18] to-slate-950 border border-emerald-500/20 hover:border-emerald-500/50 shadow-md hover:shadow-emerald-500/10 transition-all duration-300 flex items-center justify-between group">
            <div className="flex items-center gap-3.5 min-w-0">
              <ServiceLogo name="BEP20" className="w-12 h-12" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors">BEP20 (USDT)</span>
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold tracking-tight">
                    BNB Smart Chain
                  </span>
                </div>
                <div className="font-mono text-xs font-medium text-slate-300 mt-1 truncate">
                  {methods.bep20 && methods.bep20.trim() !== "" ? (
                    <span className="text-emerald-200 font-bold tracking-wide">{methods.bep20}</span>
                  ) : (
                    <span className="text-slate-500 italic">Not set</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => openEditModal("bep20")}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-200 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all font-mono shrink-0 cursor-pointer ml-2"
            >
              {methods.bep20 ? "Change" : "+ Add"}
            </button>
          </div>
        </div>
      </div>

      {/* 3. WITHDRAWAL HISTORY SECTION */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              WITHDRAWAL HISTORY
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Pills */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs font-mono">
              {(["All", "7D", "30D"] as const).map((time) => (
                <button
                  key={time}
                  onClick={() => setTimeFilter(time)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    timeFilter === time
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Withdrawal History List */}
        <div className="space-y-2.5">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 bg-rose-950 text-rose-400 border border-rose-500/30">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <span>{item.method}</span>
                      <span className="text-[10px] text-slate-500 font-mono font-normal truncate max-w-[140px] sm:max-w-xs">
                        ({item.accountOrAddress})
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">{item.date}</div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 font-mono">
                  <span className="font-black text-sm text-rose-400">
                    -{formatAmount(item.amount)}
                  </span>

                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Done
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-slate-500 text-xs space-y-1">
              <p>No withdrawal records found for the selected period.</p>
            </div>
          )}
        </div>
      </div>

      {/* EDIT PAYMENT METHODS MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#111622] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Edit Payment Methods</h2>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMethods} className="space-y-4">
              {/* Edit Modal Error Banner */}
              {editModalError && (
                <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{editModalError}</span>
                </div>
              )}

              {/* Bkash */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>BKASH Mobile Number</span>
                  <span className="text-[10px] text-pink-400 font-normal">Personal / Agent</span>
                </label>
                <input
                  type="text"
                  value={formBkash}
                  onChange={(e) => setFormBkash(e.target.value)}
                  placeholder="Enter Bkash wallet number (e.g. 01700000000)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              {/* Nagad */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>NAGAD Mobile Number</span>
                  <span className="text-[10px] text-orange-400 font-normal">Mobile Wallet</span>
                </label>
                <input
                  type="text"
                  value={formNagad}
                  onChange={(e) => setFormNagad(e.target.value)}
                  placeholder="Enter Nagad wallet number (e.g. 01800000000)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              {/* Binance UID */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>BINANCE UID</span>
                  <span className="text-[10px] text-yellow-400 font-normal">Binance User ID</span>
                </label>
                <input
                  type="text"
                  value={formBinanceUid}
                  onChange={(e) => setFormBinanceUid(e.target.value)}
                  placeholder="Enter Binance UID (e.g. 128938402)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              {/* BEP20 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>BEP20 USDT Address</span>
                  <span className="text-[10px] text-emerald-400 font-normal">BNB Smart Chain (BSC)</span>
                </label>
                <input
                  type="text"
                  value={formBep20}
                  onChange={(e) => setFormBep20(e.target.value)}
                  placeholder="Enter BEP20 wallet address (e.g. 0x...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              {/* Withdraw PIN Section */}
              {userProfile.withdrawPin && userProfile.withdrawPin.length === 4 ? (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Lock className="w-3.5 h-3.5" />
                      Withdraw PIN Authorization (Required)
                    </span>
                    <span className="text-[10px] text-slate-400">4-Digit Security PIN</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={editModalPin}
                    onChange={(e) => setEditModalPin(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-center text-base font-mono text-white tracking-[8px] focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-800/80 space-y-3">
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>2-Step Withdraw PIN is not set yet. Create a 4-digit PIN to authorize future changes & payouts.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Set 4-Digit PIN</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={newWalletPin}
                        onChange={(e) => setNewWalletPin(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-mono text-white tracking-[6px] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">Confirm PIN</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={confirmWalletPin}
                        onChange={(e) => setConfirmWalletPin(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-sm font-mono text-white tracking-[6px] focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-[#2EE59D] hover:bg-emerald-300 transition-all shadow-md cursor-pointer"
                >
                  Save Payment Methods
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111622] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <ArrowUpRight className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Withdraw Funds</h2>
              </div>
              <button
                onClick={() => setWithdrawModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Banners */}
            {withdrawError && (
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {/* Balance Badge */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Available Balance:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatAmount(userProfile.balance)}
                </span>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Enter Amount ({currency === "USD" ? "USD $" : "BDT ৳"})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                    {currency === "USD" ? "$" : "৳"}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-16 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const maxVal = currency === "USD" ? (userProfile.balance / usdExchangeRate).toFixed(2) : userProfile.balance.toString();
                      setWithdrawAmount(maxVal);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    MAX
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-2 pt-1 font-mono">
                  {[50, 100, 200, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWithdrawAmount(preset.toString())}
                      className="text-[11px] bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Payment Method */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Select Payment Method</label>
                <div className="grid grid-cols-1 gap-2">
                  {(
                    [
                      { key: "bkash", label: "BKASH", val: methods.bkash, color: "text-pink-400" },
                      { key: "nagad", label: "NAGAD", val: methods.nagad, color: "text-orange-400" },
                      { key: "binanceUid", label: "BINANCE UID", val: methods.binanceUid, color: "text-yellow-400" },
                      { key: "bep20", label: "BEP20 (USDT)", val: methods.bep20, color: "text-emerald-400" },
                    ] as const
                  ).map((m) => {
                    const isSelected = selectedMethodKey === m.key;
                    const hasVal = m.val && m.val.trim() !== "";

                    return (
                      <div
                        key={m.key}
                        onClick={() => setSelectedMethodKey(m.key)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-cyan-950/40 border-cyan-500/80 shadow-md"
                            : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? "border-cyan-400 bg-cyan-500" : "border-slate-600"
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                            </div>

                            <ServiceLogo name={m.label} className="w-9 h-9 shrink-0" />

                            <div className="min-w-0">
                              <span className={`font-extrabold text-xs block ${m.color}`}>{m.label}</span>
                              <div className="text-[11px] font-mono text-slate-300 truncate">
                                {hasVal ? m.val : <span className="text-slate-500 italic">Not set</span>}
                              </div>
                            </div>
                          </div>

                        {!hasVal && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWithdrawModalOpen(false);
                              openEditModal(m.key);
                            }}
                            className="text-[10px] text-cyan-400 hover:underline font-mono cursor-pointer"
                          >
                            Set now
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Withdraw PIN Authorization */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Lock className="w-3.5 h-3.5" />
                    Enter 4-Digit Withdraw PIN
                  </span>
                  <span className="text-[10px] text-slate-400">Security PIN</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={withdrawModalPin}
                  onChange={(e) => setWithdrawModalPin(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-center text-base font-mono text-white tracking-[8px] focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
