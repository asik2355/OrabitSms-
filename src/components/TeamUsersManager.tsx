import React, { useState, useMemo } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import {
  Users,
  CheckCircle2,
  Clock,
  Activity,
  Trash2,
  Search,
  Pencil,
  X,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Plus,
  Coins,
} from "lucide-react";

interface TeamUsersManagerProps {
  currentUser: UserProfile | null;
  users: UserProfile[];
  onUpdateUser: (updatedUser: UserProfile) => void;
  onAddBalance?: (email: string, amount: number) => void;
  currency: "USD" | "BDT";
  usdExchangeRate: number;
}

export const TeamUsersManager: React.FC<TeamUsersManagerProps> = ({
  currentUser,
  users,
  onUpdateUser,
  onAddBalance,
  currency,
  usdExchangeRate,
}) => {
  const isOwner =
    currentUser?.role === "Owner" ||
    currentUser?.role === "owner" ||
    currentUser?.email?.toLowerCase().trim() === "orabitsms@gmail.com";
  const isAgent = currentUser?.role === "Agent" || currentUser?.role === "agent" || !isOwner;

  const agentEmail = (currentUser?.email || "").toLowerCase().trim();
  const agentCode = currentUser?.referralEmail || "";

  // The Agent's own assigned rate given by Owner (e.g. 0.0075)
  const agentOwnRate = useMemo(() => {
    if (currentUser?.customOtpRate !== undefined) return currentUser.customOtpRate;
    if (currentUser?.rate !== undefined) return currentUser.rate;
    return 0.0075;
  }, [currentUser]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal edit state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editRate, setEditRate] = useState<string>("0");
  const [editStatus, setEditStatus] = useState<string>("Pending");
  const [rateWarning, setRateWarning] = useState<string | null>(null);

  // Topup state
  const [topupEmail, setTopupEmail] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState<string>("5");

  // Filter list of users for this agent / owner
  const myReferredUsers = useMemo(() => {
    if (isOwner) return users;
    return users.filter((u) => {
      const refEmail = (u.referralEmail || u.email || "").toLowerCase().trim();
      return (
        refEmail === agentEmail ||
        (agentCode && refEmail === agentCode.toLowerCase().trim())
      );
    });
  }, [users, isOwner, agentEmail, agentCode]);

  // Metrics
  const totalCount = myReferredUsers.length;
  const activeCount = myReferredUsers.filter(
    (u) =>
      u.accountStatus === "Active" ||
      u.accountStatus === "ACTIVE"
  ).length;
  const pendingCount = myReferredUsers.filter(
    (u) =>
      u.accountStatus === "Pending" ||
      u.accountStatus === "PENDING" ||
      !u.accountStatus
  ).length;
  const loggedIn24hCount = myReferredUsers.filter((u) => u.lastLogin).length;
  const softDeletedCount = myReferredUsers.filter(
    (u) =>
      u.accountStatus === "Soft-deleted" ||
      u.accountStatus === "SOFT_DELETED" ||
      u.accountStatus === "Inactive" ||
      u.accountStatus === "DISABLED"
  ).length;

  // Filtered Users for display table/cards
  const filteredUsers = useMemo(() => {
    return myReferredUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.mobileNumber.includes(q) ||
        (u.country && u.country.toLowerCase().includes(q)) ||
        (u.uid && u.uid.toLowerCase().includes(q));

      const st = (u.accountStatus || "Pending").toLowerCase();
      let matchesFilter = true;
      if (statusFilter === "active") matchesFilter = st === "active";
      else if (statusFilter === "pending") matchesFilter = st === "pending";
      else if (statusFilter === "inactive") matchesFilter = st === "inactive";
      else if (statusFilter === "soft-deleted")
        matchesFilter = st === "soft-deleted" || st === "soft_deleted" || st === "disabled";

      return matchesSearch && matchesFilter;
    });
  }, [myReferredUsers, searchQuery, statusFilter]);

  // Open Edit Modal
  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    const nameParts = (user.fullName || "").trim().split(" ");
    setEditFirstName(user.firstName || nameParts[0] || "");
    setEditLastName(user.lastName || nameParts.slice(1).join(" ") || "");
    setEditPhone(user.mobileNumber || "");
    setEditCountry(user.country || "");
    setEditCity(user.city || "");
    
    const userRate = user.customOtpRate !== undefined ? user.customOtpRate : (user.rate || 0);
    setEditRate(userRate.toString());
    setEditStatus(user.accountStatus || "Pending");
    setRateWarning(null);
  };

  // Save Edit User
  const handleSaveUser = () => {
    if (!editingUser) return;

    let numRate = parseFloat(editRate);
    if (isNaN(numRate)) numRate = 0;

    // Enforce Capping Rule: Agent cannot assign a rate higher than agentOwnRate!
    if (isAgent && !isOwner && numRate > agentOwnRate) {
      setRateWarning(`Rate cannot exceed your assigned agent rate (${agentOwnRate}). Automatically capped to ${agentOwnRate}.`);
      numRate = agentOwnRate;
      setEditRate(agentOwnRate.toString());
    }

    const fullN = `${editFirstName.trim()} ${editLastName.trim()}`.trim() || editingUser.fullName;

    const updated: UserProfile = {
      ...editingUser,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      fullName: fullN,
      mobileNumber: editPhone.trim(),
      country: editCountry.trim(),
      city: editCity.trim(),
      customOtpRate: numRate,
      rate: numRate,
      accountStatus: editStatus as any,
    };

    onUpdateUser(updated);

    // Save to local storage
    try {
      const stored = localStorage.getItem("orabit_registered_users");
      let list: UserProfile[] = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((u) => u.email.toLowerCase() === editingUser.email.toLowerCase());
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.push(updated);
      }
      localStorage.setItem("orabit_registered_users", JSON.stringify(list));
    } catch (e) {
      console.error("Local storage update error:", e);
    }

    setEditingUser(null);
  };

  // Format currency
  const formatMoney = (amountUSD: number) => {
    if (currency === "BDT") {
      const bdt = amountUSD * usdExchangeRate;
      return `৳ ${bdt.toFixed(2)}`;
    }
    return `$ ${amountUSD.toFixed(2)}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Team Users
            </h1>
            <p className="text-xs text-slate-400">
              Invite new dialers, edit profiles, and manage status.
            </p>
          </div>
        </div>

        {isAgent && !isOwner && (
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-indigo-500/30 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Your Agent Max Rate:</span>
            <span className="text-emerald-400 font-bold">${agentOwnRate.toFixed(4)}/OTP</span>
          </div>
        )}
      </div>

      {/* ================= 5 METRIC CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Total */}
        <div className="bg-[#121624] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">TOTAL</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white font-mono">{totalCount}</p>
        </div>

        {/* Card 2: Active */}
        <div className="bg-[#121624] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">ACTIVE</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{activeCount}</p>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-[#121624] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">PENDING</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">{pendingCount}</p>
        </div>

        {/* Card 4: Logged in 24h */}
        <div className="bg-[#121624] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">LOGGED IN 24H</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-400 font-mono">{loggedIn24hCount}</p>
        </div>

        {/* Card 5: Soft-deleted */}
        <div className="bg-[#121624] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">SOFT-DELETED</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono">{softDeletedCount}</p>
        </div>
      </div>

      {/* ================= FILTER & SEARCH BAR ================= */}
      <div className="bg-[#121624] border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, UID..."
              className="w-full bg-[#0a0d18] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Status Filter Dropdown & Quota */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0a0d18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="soft-deleted">Soft-deleted</option>
            </select>

            <div className="flex items-center gap-2 bg-[#0a0d18] border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-400">
              <span className="font-bold text-white">1 / 400</span>
              <span className="px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-400 font-bold text-[10px]">
                399 left
              </span>
              <span className="hidden sm:inline text-slate-500">resets in 6h 56m</span>
            </div>
          </div>
        </div>

        {/* ================= USER CARDS / TABLE LIST ================= */}
        <div className="space-y-3 pt-2">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-2 border border-slate-800/60 rounded-xl bg-[#0a0d18]">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400">No users found under current filter.</p>
              <p className="text-xs text-slate-500">
                New accounts created with referral <span className="text-indigo-400 font-mono">{agentEmail}</span> default to Pending status.
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const st = user.accountStatus || "Pending";
              const isPending = st === "Pending" || st === "PENDING";
              const isActive = st === "Active" || st === "ACTIVE";
              const isSoftDeleted = st === "Soft-deleted" || st === "SOFT_DELETED";

              const fullName = user.fullName || "User Account";
              const userEmail = user.email;
              const userPhone = user.mobileNumber || "—";
              const userCountry = user.country || "Bangladesh";
              const userCity = user.city || "Dhaka";
              const userRate = user.customOtpRate !== undefined ? user.customOtpRate : (user.rate || 0);

              return (
                <div
                  key={userEmail}
                  className="bg-[#0a0d18] border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-md"
                >
                  {/* Left: User Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-black text-sm shrink-0 mt-0.5">
                      {fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">{fullName}</h3>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                          UID: {user.uid || userEmail.split("@")[0].toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400 font-mono pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 uppercase tracking-wider text-[10px]">CONTACT:</span>
                          <span className="text-slate-200">{userEmail}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 uppercase tracking-wider text-[10px]">LOCATION:</span>
                          <span className="text-slate-300">{userCity}, {userCountry}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 uppercase tracking-wider text-[10px]">RATE:</span>
                          <span className="text-emerald-400 font-bold">${userRate.toFixed(4)}/OTP</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 uppercase tracking-wider text-[10px]">BALANCE:</span>
                          <span className="text-amber-400 font-bold">{formatMoney(user.balance || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Edit Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-slate-800/60 pt-3 md:pt-0">
                    {/* Status Badge */}
                    <div>
                      {isActive && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                      {isPending && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                      {isSoftDeleted && (
                        <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Soft-deleted
                        </span>
                      )}
                      {!isActive && !isPending && !isSoftDeleted && (
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
                          {st}
                        </span>
                      )}
                    </div>

                    {/* Topup Button for Owner / Agent */}
                    {topupEmail === userEmail ? (
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-amber-500">
                        <input
                          type="number"
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(e.target.value)}
                          className="w-14 bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white font-mono"
                        />
                        <button
                          onClick={() => {
                            if (onAddBalance && parseFloat(topupAmount) > 0) {
                              onAddBalance(userEmail, parseFloat(topupAmount));
                            }
                            setTopupEmail(null);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setTopupEmail(null)}
                          className="px-1.5 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setTopupEmail(userEmail)}
                        className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all text-xs font-bold flex items-center gap-1"
                        title="Add Funds"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Balance
                      </button>
                    )}

                    {/* Edit Pencil Button */}
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                      title="Edit User Profile"
                    >
                      <Pencil className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= EDIT USER MODAL (MATCHING SCREENSHOT 3 & 4) ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#121624] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0d18]">
              <h2 className="text-base font-bold text-white">
                Edit User · {editingUser.fullName}
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {rateWarning && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{rateWarning}</span>
                </div>
              )}

              {/* FIRST NAME */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  FIRST NAME
                </label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full bg-[#0a0d18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* LAST NAME */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  LAST NAME
                </label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full bg-[#0a0d18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* EMAIL (READ-ONLY) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  EMAIL (READ-ONLY)
                </label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full bg-[#080a12] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              {/* PHONE NUMBER */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  PHONE NUMBER
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#0a0d18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* COUNTRY */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  COUNTRY
                </label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full bg-[#0a0d18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* CITY */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  CITY
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full bg-[#0a0d18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* BALANCE (READ-ONLY) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  BALANCE (READ-ONLY)
                </label>
                <input
                  type="text"
                  value={formatMoney(editingUser.balance || 0)}
                  disabled
                  className="w-full bg-[#080a12] border border-slate-800/60 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              {/* RATE */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  RATE
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={editRate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditRate(val);
                    if (isAgent && !isOwner && parseFloat(val) > agentOwnRate) {
                      setRateWarning(`Rate cannot exceed your assigned agent rate (${agentOwnRate}). Capped at ${agentOwnRate}.`);
                    } else {
                      setRateWarning(null);
                    }
                  }}
                  className="w-full bg-[#0a0d18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 pt-0.5">
                  Capped at your own rate ({agentOwnRate}).
                </p>
              </div>

              {/* STATUS */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  STATUS
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[#0a0d18] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Soft-deleted">Soft-deleted</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#0a0d18]">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-yellow-500/10 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
