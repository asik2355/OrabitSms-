import React, { useState, useMemo, useEffect } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import { formatUSD } from "../lib/storageUtils";
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
  HelpCircle,
  UserPlus,
  Send,
  Menu,
  Key,
  Info,
  TrendingUp,
  User,
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

  // Clock state for UTC time display
  const [currentTimeStr, setCurrentTimeStr] = useState("00:00:00");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setCurrentTimeStr(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
  const [editApiEnabled, setEditApiEnabled] = useState<boolean>(false);
  const [rateWarning, setRateWarning] = useState<string | null>(null);

  // Info modal state
  const [infoUser, setInfoUser] = useState<UserProfile | null>(null);

  // Invite / Add New User modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteCountry, setInviteCountry] = useState("Bangladesh");
  const [inviteCity, setInviteCity] = useState("Pirojpur");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRate, setInviteRate] = useState<string>("0.0070");
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  // Filter list of users for this agent / owner
  const myReferredUsers = useMemo(() => {
    let list = users;
    if (!isOwner) {
      list = users.filter((u) => {
        const refEmail = (u.referralEmail || u.email || "").toLowerCase().trim();
        return (
          refEmail === agentEmail ||
          (agentCode && refEmail === agentCode.toLowerCase().trim())
        );
      });
    }

    // Default sample users if list is empty
    if (list.length === 0) {
      const demoUsers: UserProfile[] = [
        {
          firstName: "Crypto",
          lastName: "Comrade",
          fullName: "Crypto Comrade",
          email: "cryptocomrade1522@gmail.com",
          mobileNumber: "+8801703333600",
          telegram: "@cryptocomrade",
          withdrawPin: "1234",
          country: "Bangladesh",
          city: "Pirojpur",
          uid: "CC89201XA",
          balance: 0.0,
          customOtpRate: 0.0070,
          rate: 0.0070,
          accountStatus: "Active",
          referralEmail: agentEmail || "agent@orabitsms.com",
          role: "Client",
          lastLogin: new Date(Date.now() - 21 * 60 * 1000).toISOString(),
        },
        {
          firstName: "Rafiul",
          lastName: "Hasan",
          fullName: "Rafiul Hasan",
          email: "rafiul62725@gmail.com",
          mobileNumber: "+8801890423974",
          telegram: "@rafiul_hasan",
          withdrawPin: "5678",
          country: "United Kingdom",
          city: "Hafodunos",
          uid: "M3J6XAB2Y2D",
          balance: 12.5,
          customOtpRate: 0.0075,
          rate: 0.0075,
          accountStatus: "Active",
          referralEmail: agentEmail || "agent@orabitsms.com",
          role: "Client",
          lastLogin: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
      ];
      return demoUsers;
    }
    return list;
  }, [users, isOwner, agentEmail, agentCode]);

  // Dynamic Metrics
  const totalCount = myReferredUsers.length;
  const activeCount = myReferredUsers.filter(
    (u) => (u.accountStatus || "Pending").toLowerCase() === "active"
  ).length;
  const pendingCount = myReferredUsers.filter(
    (u) =>
      (u.accountStatus || "Pending").toLowerCase() === "pending" ||
      !u.accountStatus
  ).length;
  const loggedIn24hCount = myReferredUsers.filter((u) => {
    if (!u.lastLogin) return true; // count sample active logins
    const loginTime = new Date(u.lastLogin).getTime();
    return !isNaN(loginTime) && Date.now() - loginTime < 24 * 60 * 60 * 1000;
  }).length;
  const softDeletedCount = myReferredUsers.filter(
    (u) =>
      (u.accountStatus || "").toLowerCase() === "soft-deleted" ||
      (u.accountStatus || "").toLowerCase() === "soft_deleted" ||
      (u.accountStatus || "").toLowerCase() === "disabled" ||
      (u.accountStatus || "").toLowerCase() === "inactive"
  ).length;

  // Filtered Users for display cards
  const filteredUsers = useMemo(() => {
    return myReferredUsers.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.mobileNumber && u.mobileNumber.toLowerCase().includes(q)) ||
        (u.country && u.country.toLowerCase().includes(q)) ||
        (u.city && u.city.toLowerCase().includes(q)) ||
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

  // Relative Time Formatter
  const formatRelativeTime = (lastLogin?: string) => {
    if (!lastLogin) return "21 min ago";
    const ts = new Date(lastLogin).getTime();
    if (isNaN(ts)) return "21 min ago";
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hr ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} d ago`;
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    const nameParts = (user.fullName || "").trim().split(" ");
    setEditFirstName(user.firstName || nameParts[0] || "");
    setEditLastName(user.lastName || nameParts.slice(1).join(" ") || "");
    setEditPhone(user.mobileNumber || "");
    setEditCountry(user.country || "");
    setEditCity(user.city || "");

    const userRate = user.customOtpRate !== undefined ? user.customOtpRate : (user.rate || 0.0070);
    setEditRate(userRate.toString());
    setEditStatus(user.accountStatus || "Active");
    setEditApiEnabled(!!user.apiEnabled);
    setRateWarning(null);
  };

  // Save Edit User
  const handleSaveUser = () => {
    if (!editingUser) return;

    let numRate = parseFloat(editRate);
    if (isNaN(numRate)) numRate = 0.0070;

    // Enforce Capping Rule: Agent cannot assign a rate higher than agentOwnRate
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
      apiEnabled: editApiEnabled,
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

  // Add New User / Invitation Submit
  const handleAddNewUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const first = inviteFirstName.trim() || inviteEmail.split("@")[0];
    const last = inviteLastName.trim() || "User";
    let numRate = parseFloat(inviteRate);
    if (isNaN(numRate)) numRate = 0.0070;

    const newUser: UserProfile = {
      firstName: first,
      lastName: last,
      fullName: `${first} ${last}`.trim(),
      email: inviteEmail.trim().toLowerCase(),
      mobileNumber: invitePhone.trim() || "+8801700000000",
      telegram: "@" + first.toLowerCase(),
      withdrawPin: "1234",
      country: inviteCountry.trim() || "Bangladesh",
      city: inviteCity.trim() || "Pirojpur",
      uid: Math.random().toString(36).substring(2, 10).toUpperCase(),
      balance: 0.0,
      customOtpRate: numRate,
      rate: numRate,
      accountStatus: "Active",
      referralEmail: agentEmail,
      role: "Client",
      lastLogin: new Date().toISOString(),
    };

    onUpdateUser(newUser);

    // Save to localStorage
    try {
      const stored = localStorage.getItem("orabit_registered_users");
      let list: UserProfile[] = stored ? JSON.parse(stored) : [];
      list.push(newUser);
      localStorage.setItem("orabit_registered_users", JSON.stringify(list));
    } catch (e) {}

    setInviteSuccessMsg(`New user ${newUser.fullName} successfully added!`);
    setTimeout(() => {
      setInviteSuccessMsg(null);
      setShowInviteModal(false);
      setInviteEmail("");
      setInvitePhone("");
      setInviteFirstName("");
      setInviteLastName("");
    }, 1200);
  };

  // Format currency
  const formatMoney = (amountUSD: number) => {
    if (currency === "BDT") {
      const bdt = amountUSD * usdExchangeRate;
      return `৳${bdt.toFixed(2)}`;
    }
    return formatUSD(amountUSD);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121620] border border-[#232838] rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1c2230] border border-slate-700/60 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Team Users & Clients
            </h1>
            <p className="text-xs text-slate-400">
              Manage client accounts, custom per-SMS rates, balances, and status.
            </p>
          </div>
        </div>

        {/* Live Clock Display */}
        <div className="flex items-center gap-2 bg-[#0a0d14] border border-[#232838] px-3.5 py-1.5 rounded-xl">
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-mono text-amber-300 font-bold text-xs">
            {currentTimeStr} <span className="text-slate-500 font-sans text-[11px]">UTC</span>
          </span>
        </div>
      </div>

      {/* ================= 1. TOP STATISTICS CARDS (GRID LAYOUT) ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: TOTAL */}
        <div className="bg-[#121620] border border-[#232838] rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-black/20 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              👥 TOTAL
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">{totalCount}</div>
          </div>
        </div>

        {/* Card 2: ACTIVE */}
        <div className="bg-[#121620] border border-[#232838] rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-black/20 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              🟢 ACTIVE
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">{activeCount}</div>
          </div>
        </div>

        {/* Card 3: PENDING */}
        <div className="bg-[#121620] border border-[#232838] rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-black/20 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              🕒 PENDING
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">{pendingCount}</div>
          </div>
        </div>

        {/* Card 4: LOGGED IN 24H */}
        <div className="bg-[#121620] border border-[#232838] rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-black/20 hover:border-slate-700 transition-all">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              📈 LOGGED IN 24H
            </div>
            <div className="text-2xl font-black text-purple-300 font-mono tracking-tight">{loggedIn24hCount}</div>
          </div>
        </div>

        {/* Card 5: SOFT-DELETED */}
        <div className="bg-[#121620] border border-[#232838] rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-black/20 hover:border-slate-700 transition-all col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              🗑️ SOFT-DELETED
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono tracking-tight">{softDeletedCount}</div>
          </div>
        </div>
      </div>

      {/* ================= 2. SEARCH & ACTION TOOLBAR ================= */}
      <div className="bg-[#121620] border border-[#232838] rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Email, or UID..."
              className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all font-sans"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full sm:w-52">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#0a0d14] border border-amber-500/60 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none transition-all cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
              <option value="soft-deleted">Soft-deleted</option>
            </select>
          </div>

          {/* Bright Yellow/Green Add New User Button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-[#d9f99d] hover:bg-[#bef264] text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Add New User
          </button>
        </div>
      </div>

      {/* ================= 3. USER LIST (CARD DESIGN) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 space-y-2 border border-[#232838] rounded-2xl bg-[#121620]">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">No users match your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const st = user.accountStatus || "Active";
            const isUserActive = st.toLowerCase() === "active";
            const fullName = user.fullName || `${user.firstName || "Crypto"} ${user.lastName || "Comrade"}`;
            const userEmail = user.email || "cryptocomrade1522@gmail.com";
            const userPhone = user.mobileNumber || "+8801703333600";
            const userCountry = user.country || "Bangladesh";
            const userCity = user.city || "Pirojpur";
            const userRate = user.customOtpRate !== undefined ? user.customOtpRate : (user.rate || 0.0070);
            const userBalance = user.balance || 0;
            const initials = fullName
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase() || "CC";

            return (
              <div
                key={userEmail}
                className="bg-[#121620] border border-[#232838] hover:border-slate-600 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 transition-all duration-200 group"
              >
                {/* Header: Avatar Circle & Full Name */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1f2533]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#27351c] text-[#a3e635] border border-[#4d7c0f] font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                      {initials}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white tracking-tight group-hover:text-amber-300 transition-colors">
                        {fullName}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-[#1a2130] text-slate-300 rounded text-[10px] border border-slate-700/60 font-bold">
                          UID: {user.uid || "CC89201XA"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details Grid (Rows with Label & Value) */}
                <div className="space-y-2.5 text-xs">
                  {/* CONTACT */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                      CONTACT
                    </span>
                    <div className="flex items-center gap-2 font-mono text-right truncate">
                      <span className="text-white font-medium truncate" title={userEmail}>
                        {userEmail}
                      </span>
                      <span className="text-slate-400 shrink-0">({userPhone})</span>
                    </div>
                  </div>

                  {/* LOCATION */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                      LOCATION
                    </span>
                    <div className="flex items-center gap-1.5 font-sans font-medium text-right">
                      <span className="text-white">{userCity}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">{userCountry}</span>
                    </div>
                  </div>

                  {/* RATE */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                      RATE
                    </span>
                    <span className="text-amber-300 font-mono font-bold">
                      {userRate.toFixed(4)} <span className="text-[10px] text-slate-500 font-normal">/SMS</span>
                    </span>
                  </div>

                  {/* BALANCE */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                      BALANCE
                    </span>
                    <span className="text-emerald-400 font-mono font-black text-sm">
                      {formatUSD(userBalance)}
                    </span>
                  </div>

                  {/* LAST LOGIN */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                      LAST LOGIN
                    </span>
                    <span className="text-slate-300 font-mono">
                      {formatRelativeTime(user.lastLogin)}
                    </span>
                  </div>

                  {/* STATUS */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                      STATUS
                    </span>
                    <span
                      className={`px-3 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider font-mono border ${
                        isUserActive
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-amber-500/15 border-amber-500/40 text-amber-400"
                      }`}
                    >
                      {st}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Edit (Pencil), Info/Help (Question mark), Delete (Trash) */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f2533]">
                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="p-2.5 rounded-xl bg-[#1c2230] hover:bg-[#252e42] text-slate-200 hover:text-white border border-slate-700/60 transition-all cursor-pointer shadow-sm"
                    title="Edit User Profile"
                  >
                    <Pencil className="w-4 h-4 text-amber-400" />
                  </button>

                  {/* Info / Help Button */}
                  <button
                    onClick={() => setInfoUser(user)}
                    className="p-2.5 rounded-xl bg-[#1c2230] hover:bg-[#252e42] text-slate-200 hover:text-white border border-slate-700/60 transition-all cursor-pointer shadow-sm"
                    title="User Details & Credentials"
                  >
                    <HelpCircle className="w-4 h-4 text-sky-400" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to soft-delete ${user.fullName}?`)) {
                        const updated = { ...user, accountStatus: "Soft-deleted" as any };
                        onUpdateUser(updated);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-[#1c2230] hover:bg-[#252e42] text-slate-200 hover:text-white border border-slate-700/60 transition-all cursor-pointer shadow-sm"
                    title="Soft Delete User"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= EDIT USER MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#121620] border border-[#232838] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#232838] bg-[#0a0d14]">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" />
                Edit User · {editingUser.fullName}
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-xl bg-[#1c2230] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {rateWarning && (
                <div className="p-3 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{rateWarning}</span>
                </div>
              )}

              {/* FIRST NAME */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  FIRST NAME
                </label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* LAST NAME */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  LAST NAME
                </label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* EMAIL (READ-ONLY) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  EMAIL (READ-ONLY)
                </label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full bg-[#07090e] border border-[#1a1f2c] rounded-xl px-3.5 py-2.5 text-xs text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              {/* PHONE NUMBER */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  PHONE NUMBER
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* COUNTRY */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  COUNTRY
                </label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* CITY */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  CITY
                </label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* BALANCE (READ-ONLY) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  BALANCE (READ-ONLY)
                </label>
                <input
                  type="text"
                  value={`$${(editingUser.balance || 0).toFixed(2)}`}
                  disabled
                  className="w-full bg-[#07090e] border border-[#1a1f2c] rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono font-bold cursor-not-allowed"
                />
              </div>

              {/* RATE */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  RATE (PER OTP SMS)
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
                  className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-400 pt-0.5">
                  Assigned rate cap: {agentOwnRate}
                </p>
              </div>

              {/* STATUS */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  STATUS
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-amber-500/60 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-semibold cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Soft-deleted">Soft-deleted</option>
                </select>
              </div>

              {/* API ACCESS PERMISSION */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  API ACCESS PERMISSION
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a0d14] border border-[#232838]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${editApiEnabled ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                    <span className={`text-xs font-bold font-mono ${editApiEnabled ? "text-emerald-400" : "text-slate-400"}`}>
                      {editApiEnabled ? "● API ACCESS: ENABLED" : "○ API ACCESS: DISABLED"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditApiEnabled(!editApiEnabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                      editApiEnabled
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                    }`}
                  >
                    {editApiEnabled ? "Revoke API" : "Grant API"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#232838] bg-[#0a0d14]">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2.5 rounded-xl bg-[#1c2230] hover:bg-[#252e42] text-slate-200 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= USER INFO / DETAILS MODAL ================= */}
      {infoUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#121620] border border-[#232838] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#232838] bg-[#0a0d14]">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" />
                User Info · {infoUser.fullName}
              </h2>
              <button
                onClick={() => setInfoUser(null)}
                className="w-8 h-8 rounded-xl bg-[#1c2230] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="p-3 bg-[#0a0d14] rounded-xl border border-[#232838] space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">UID:</span>
                  <span className="text-white font-bold">{infoUser.uid || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telegram:</span>
                  <span className="text-sky-300">{infoUser.telegram || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Withdraw PIN:</span>
                  <span className="text-amber-300">{infoUser.withdrawPin || "****"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Referral/Agent:</span>
                  <span className="text-slate-200">{infoUser.referralEmail || agentEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">API Key:</span>
                  <span className="text-emerald-400 font-bold">
                    {infoUser.apiKey ? "Generated (Active)" : "None"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-[#232838] bg-[#0a0d14]">
              <button
                onClick={() => setInfoUser(null)}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADD NEW USER MODAL ================= */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-[#121620] border border-[#232838] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#232838] bg-[#0a0d14]">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-lime-400" /> Add New User
              </h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-8 h-8 rounded-xl bg-[#1c2230] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewUserSubmit} className="p-6 space-y-4">
              {inviteSuccessMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{inviteSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    FIRST NAME
                  </label>
                  <input
                    type="text"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="Crypto"
                    className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    LAST NAME
                  </label>
                  <input
                    type="text"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="Comrade"
                    className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="cryptocomrade1522@gmail.com"
                  className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  PHONE NUMBER
                </label>
                <input
                  type="text"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="+8801703333600"
                  className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    CITY
                  </label>
                  <input
                    type="text"
                    value={inviteCity}
                    onChange={(e) => setInviteCity(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    COUNTRY
                  </label>
                  <input
                    type="text"
                    value={inviteCountry}
                    onChange={(e) => setInviteCountry(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  PER-SMS RATE
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={inviteRate}
                  onChange={(e) => setInviteRate(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#232838] rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1c2230] hover:bg-[#252e42] text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#d9f99d] hover:bg-[#bef264] text-slate-950 font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-lime-500/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
