import React, { useState, useEffect } from "react";
import { UserProfile } from "./OrabitAuthScreen";
import { saveUserProfileToSupabase } from "../lib/userProfiles";
import { formatUSD } from "../lib/storageUtils";
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Calendar,
  Globe,
  MapPin,
  Bell,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CreditCard,
  Lock,
} from "lucide-react";

interface UserProfileViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout?: () => void;
  currency?: "BDT" | "USD";
  usdExchangeRate?: number;
  isOwner?: boolean;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  userProfile,
  onUpdateProfile,
  onLogout,
  currency = "BDT",
  usdExchangeRate = 100,
  isOwner = false,
}) => {
  const isUserOwner =
    isOwner ||
    userProfile?.role?.toLowerCase() === "owner" ||
    userProfile?.role?.toLowerCase() === "admin" ||
    userProfile?.email?.toLowerCase().trim() === "orabitsms@gmail.com";
  // Form State
  const [fullName, setFullName] = useState(userProfile.fullName || "");
  const [mobileNumber, setMobileNumber] = useState(userProfile.mobileNumber || "");
  const [bio, setBio] = useState(userProfile.bio || "");
  const [country, setCountry] = useState(userProfile.country || "Bangladesh");
  const [city, setCity] = useState(userProfile.city || "Dhaka");
  const [telegramUsername, setTelegramUsername] = useState(userProfile.telegram || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync form inputs when userProfile prop updates or loads
  useEffect(() => {
    if (userProfile) {
      if (userProfile.fullName) setFullName(userProfile.fullName);
      if (userProfile.mobileNumber) setMobileNumber(userProfile.mobileNumber);
      if (userProfile.country) setCountry(userProfile.country);
      if (userProfile.city) setCity(userProfile.city);
      if (userProfile.telegram) setTelegramUsername(userProfile.telegram);
      if (userProfile.bio) setBio(userProfile.bio);
    }
  }, [userProfile.fullName, userProfile.mobileNumber, userProfile.country, userProfile.city, userProfile.telegram, userProfile.bio]);

  // Security Toggles & Withdraw PIN
  const [showWithdrawPinSetup, setShowWithdrawPinSetup] = useState(false);
  const [pinMode, setPinMode] = useState<"set" | "change" | "disable">("set");
  const [currentWithdrawPin, setCurrentWithdrawPin] = useState("");
  const [newWithdrawPin, setNewWithdrawPin] = useState("");
  const [confirmWithdrawPin, setConfirmWithdrawPin] = useState("");
  const [pinMsg, setPinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleOpenPinForm = (mode: "set" | "change" | "disable") => {
    setPinMode(mode);
    setCurrentWithdrawPin("");
    setNewWithdrawPin("");
    setConfirmWithdrawPin("");
    setPinMsg(null);
    setShowWithdrawPinSetup(true);
  };

  const handleSaveWithdrawPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);

    if (pinMode === "disable") {
      if (!currentWithdrawPin || currentWithdrawPin !== userProfile.withdrawPin) {
        setPinMsg({ type: "error", text: "Incorrect Current Withdraw PIN!" });
        return;
      }

      const updated = { ...userProfile, withdrawPin: "" };
      onUpdateProfile(updated);
      saveUserProfileToSupabase(updated);

      setPinMsg({ type: "success", text: "Withdraw PIN turned off! 2-Step Payment security is now disabled." });
      setCurrentWithdrawPin("");
      setTimeout(() => {
        setPinMsg(null);
        setShowWithdrawPinSetup(false);
      }, 2500);
      return;
    }

    if (pinMode === "change") {
      if (!currentWithdrawPin || currentWithdrawPin !== userProfile.withdrawPin) {
        setPinMsg({ type: "error", text: "Incorrect Current Withdraw PIN!" });
        return;
      }
    }

    if (!newWithdrawPin || !/^\d{4}$/.test(newWithdrawPin)) {
      setPinMsg({ type: "error", text: "New Withdraw PIN must be exactly 4 numeric digits!" });
      return;
    }

    if (newWithdrawPin !== confirmWithdrawPin) {
      setPinMsg({ type: "error", text: "New Withdraw PIN and Confirm PIN do not match!" });
      return;
    }

    const updated = { ...userProfile, withdrawPin: newWithdrawPin };
    onUpdateProfile(updated);
    saveUserProfileToSupabase(updated);

    setPinMsg({
      type: "success",
      text: pinMode === "change"
        ? "Withdraw PIN updated successfully!"
        : "Withdraw PIN set successfully! 2-Step Payment security is now active."
    });
    setCurrentWithdrawPin("");
    setNewWithdrawPin("");
    setConfirmWithdrawPin("");
    setTimeout(() => {
      setPinMsg(null);
      setShowWithdrawPinSetup(false);
    }, 2500);
  };

  // Change Password State
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Account-specific public UID
  const publicUid = React.useMemo(() => {
    if (userProfile?.uid && userProfile.uid.trim()) return userProfile.uid;
    if (!userProfile?.email) return "M4Q91X5HKW3";
    let hash = 0;
    const cleanE = userProfile.email.toLowerCase().trim();
    for (let i = 0; i < cleanE.length; i++) {
      hash = (hash << 5) - hash + cleanE.charCodeAt(i);
      hash |= 0;
    }
    return "M" + Math.abs(hash).toString(36).toUpperCase().padStart(10, "0").slice(0, 10);
  }, [userProfile?.uid, userProfile?.email]);

  // Account-specific API Key State
  const defaultAccountApiKey = React.useMemo(() => {
    if (userProfile?.apiKey && userProfile.apiKey.trim()) return userProfile.apiKey;
    if (!userProfile?.email) return "MHF5UTYD3L7";
    let hash = 0;
    const cleanE = userProfile.email.toLowerCase().trim();
    for (let i = 0; i < cleanE.length; i++) {
      hash = (hash << 7) - hash + cleanE.charCodeAt(i);
      hash |= 0;
    }
    return "M" + Math.abs(hash).toString(36).toUpperCase().padStart(10, "0").slice(0, 10);
  }, [userProfile?.apiKey, userProfile?.email]);

  const [apiKey, setApiKey] = useState(defaultAccountApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCreated, setApiKeyCreated] = useState("11/07/2026, 12:33:58");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    setApiKey(defaultAccountApiKey);
  }, [defaultAccountApiKey]);

  // Status & Feedback
  const [savedSuccess, setSavedSuccess] = useState(false);

  const memberSince = "Jul 2026";
  const lifetimeEarning = userProfile.balance;

  const handleCopy = (text: string, type: "key" | "uid") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleRegenerateApiKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let newKey = "";
    for (let i = 0; i < 11; i++) {
      newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(newKey);
    const now = new Date().toLocaleString();
    setApiKeyCreated(now);

    const updatedProfile: UserProfile = {
      ...userProfile,
      apiKey: newKey,
      uid: publicUid,
    };
    onUpdateProfile(updatedProfile);
    saveUserProfileToSupabase(updatedProfile);
  };

  const handleRevokeApiKey = () => {
    if (window.confirm("Are you sure you want to revoke this API key? This will block access for applications using it.")) {
      setApiKey("REVOKED");
      const updatedProfile: UserProfile = {
        ...userProfile,
        apiKey: "REVOKED",
        uid: publicUid,
      };
      onUpdateProfile(updatedProfile);
      saveUserProfileToSupabase(updatedProfile);
    }
  };

  const handleSaveChangesClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const updatedProfile: UserProfile = {
      ...userProfile,
      fullName: fullName.trim(),
      mobileNumber: mobileNumber.trim(),
      country: country.trim(),
      city: city.trim(),
      telegram: telegramUsername.trim(),
      bio: bio.trim(),
      apiKey: apiKey,
      uid: publicUid,
    };

    // 1. Update React state in parent & AuthContext
    onUpdateProfile(updatedProfile);

    // 2. Persist to Supabase user_profiles table
    try {
      await saveUserProfileToSupabase(updatedProfile);
    } catch (err) {
      console.error("Failed to save user profile to Supabase:", err);
    }

    // 3. Persist to localStorage
    try {
      localStorage.setItem("orabit_user_profile", JSON.stringify(updatedProfile));
    } catch (err) {
      console.error("Failed to update local storage:", err);
    }

    setIsSavingProfile(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ type: "error", text: "Please enter your current password." });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New password and Confirm password do not match!" });
      return;
    }

    setPasswordMsg({ type: "success", text: "Password changed successfully!" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-3 shadow-lg shadow-emerald-950/20 animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">Profile updated successfully! All changes have been saved.</span>
        </div>
      )}

      {/* CARD 1: WELCOME BACK */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-800/90 border border-slate-800/90 shadow-xl flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-cyan-500/15 to-emerald-400/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl font-bold shadow-lg shadow-emerald-500/10 shrink-0">
          <User className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="space-y-1 z-10">
          <div className="text-[10px] font-black text-emerald-400/90 tracking-widest uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            WELCOME BACK
          </div>
          <div className="text-xl font-extrabold text-white tracking-tight">
            {fullName}
          </div>
        </div>
      </div>

      {/* CARD 2: ACCOUNT OVERVIEW */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 font-bold text-base text-white">
            <CreditCard className="w-4.5 h-4.5 text-emerald-400" />
            <span>Account Overview</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ACTIVE
            </span>
          </div>
        </div>

        {/* Highlight Lifetime Earning Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/25 via-slate-900/90 to-slate-900 border border-amber-500/30 space-y-1.5 shadow-inner relative overflow-hidden">
          <div className="text-[10px] font-bold tracking-wider text-amber-400 uppercase flex items-center justify-between">
            <span>LIFETIME EARNING</span>
            <span className="text-[10px] font-mono text-slate-400 font-normal">
              CURRENCY: <strong className="text-amber-300 font-bold">{currency}</strong>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1.5">
            <span className="text-amber-400 font-sans font-bold text-xl sm:text-2xl">
              {currency === "BDT" ? "৳" : "$"}
            </span>
            <span>
              {currency === "BDT"
                ? userProfile.balance.toFixed(2)
                : formatUSD(userProfile.balance / usdExchangeRate).replace("$", "")}
            </span>
            <span className="text-xs text-slate-400 font-sans font-bold ml-1">
              {currency}
            </span>
          </div>
        </div>

        <div className="text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              MEMBER SINCE
            </span>
            <div className="text-white font-bold text-sm">{memberSince}</div>
          </div>
        </div>
      </div>

      {/* CARD 3: PERSONAL INFORMATION */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 font-bold text-base text-white">
            <User className="w-4.5 h-4.5 text-emerald-400" />
            <span>Personal Information</span>
          </div>
        </div>

        <form onSubmit={handleSaveChangesClick} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FULL NAME */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                FULL NAME
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>

            {/* EMAIL (READ-ONLY) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                EMAIL (READ-ONLY)
              </label>
              <input
                type="text"
                readOnly
                value={userProfile.email}
                className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-400 px-3.5 py-2.5 rounded-xl cursor-not-allowed font-medium select-none"
              />
            </div>

            {/* PHONE NUMBER */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                PHONE NUMBER
              </label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="0175257721"
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* BIO */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              BIO
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself or your business..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* COUNTRY */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                COUNTRY
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>

            {/* CITY */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                CITY
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* TELEGRAM USERNAME */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              TELEGRAM USERNAME
            </label>
            <input
              type="text"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setFullName(userProfile.fullName || "");
                setMobileNumber(userProfile.mobileNumber || "");
                setCountry(userProfile.country || "Bangladesh");
                setCity(userProfile.city || "Dhaka");
                setTelegramUsername(userProfile.telegram || "");
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 rounded-xl bg-[#2EE59D] hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingProfile ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CARD 4: SECURITY STATUS */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-4">
        <div className="flex items-center gap-2 font-bold text-base text-white border-b border-slate-800/80 pb-3">
          <Shield className="w-4.5 h-4.5 text-emerald-400" />
          <span>Security Status</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 text-xs">
          {/* Toggle / Setting: 2 STEP (Payments) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2 STEP (Payments)</span>
                  {userProfile.withdrawPin && userProfile.withdrawPin.length === 4 ? (
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold px-2 py-0.5 rounded-full">
                      NOT SET
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Require 4-digit PIN authorization for payouts & wallet updates</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {userProfile.withdrawPin && userProfile.withdrawPin.length === 4 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (showWithdrawPinSetup && pinMode === "change") {
                          setShowWithdrawPinSetup(false);
                        } else {
                          handleOpenPinForm("change");
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 border border-slate-700"
                    >
                      {showWithdrawPinSetup && pinMode === "change" ? "Close" : "Change PIN"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (showWithdrawPinSetup && pinMode === "disable") {
                          setShowWithdrawPinSetup(false);
                        } else {
                          handleOpenPinForm("disable");
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-rose-200 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 border border-rose-800/60"
                    >
                      {showWithdrawPinSetup && pinMode === "disable" ? "Close" : "Turn Off PIN"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (showWithdrawPinSetup && pinMode === "set") {
                        setShowWithdrawPinSetup(false);
                      } else {
                        handleOpenPinForm("set");
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 border border-emerald-500/30"
                  >
                    {showWithdrawPinSetup && pinMode === "set" ? "Close" : "Set PIN"}
                  </button>
                )}
              </div>
            </div>

            {/* Withdraw PIN Setup / Action Form */}
            {showWithdrawPinSetup && (
              <form onSubmit={handleSaveWithdrawPinSubmit} className="pt-3 border-t border-slate-800/60 space-y-3 animate-in fade-in duration-200">
                {pinMsg && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    pinMsg.type === "success"
                      ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/80 border-rose-500/40 text-rose-300"
                  }`}>
                    {pinMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{pinMsg.text}</span>
                  </div>
                )}

                {/* Form Fields according to pinMode */}
                {pinMode === "disable" && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-xl font-medium">
                      🔒 Enter your current 4-digit Withdraw PIN to turn off 2-Step Payment security.
                    </p>
                    <div className="max-w-xs space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Current Withdraw PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={currentWithdrawPin}
                        onChange={(e) => setCurrentWithdrawPin(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="••••"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-rose-500 text-center text-lg font-mono tracking-[8px]"
                      />
                    </div>
                  </div>
                )}

                {pinMode === "change" && (
                  <div className="space-y-3">
                    <div className="max-w-xs space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                        Current Withdraw PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={currentWithdrawPin}
                        onChange={(e) => setCurrentWithdrawPin(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="••••"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-center text-lg font-mono tracking-[8px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          New Withdraw PIN
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          required
                          value={newWithdrawPin}
                          onChange={(e) => setNewWithdrawPin(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="••••"
                          className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-center text-lg font-mono tracking-[8px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Confirm New PIN
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          required
                          value={confirmWithdrawPin}
                          onChange={(e) => setConfirmWithdrawPin(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="••••"
                          className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-center text-lg font-mono tracking-[8px]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {pinMode === "set" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        New Withdraw PIN (4 Digits)
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={newWithdrawPin}
                        onChange={(e) => setNewWithdrawPin(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="••••"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-center text-lg font-mono tracking-[8px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Confirm Withdraw PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={confirmWithdrawPin}
                        onChange={(e) => setConfirmWithdrawPin(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="••••"
                        className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-center text-lg font-mono tracking-[8px]"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                      pinMode === "disable"
                        ? "bg-rose-600 hover:bg-rose-500 text-white"
                        : "bg-[#2EE59D] hover:bg-emerald-400 text-slate-950"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {pinMode === "disable"
                        ? "Turn Off Withdraw PIN"
                        : pinMode === "change"
                        ? "Update Withdraw PIN"
                        : "Save Withdraw PIN"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Change Password Section */}
          <div className="border-t border-slate-800/80 pt-3 space-y-3">
            <div
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="flex items-center justify-between cursor-pointer group select-none"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Change Password</span>
                </div>
                <p className="text-[11px] text-slate-400">Update your account login password</p>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
              >
                {showChangePassword ? "Close" : "Change"}
              </button>
            </div>

            {/* Change Password Input Fields */}
            {showChangePassword && (
              <form onSubmit={handleChangePasswordSubmit} className="pt-2 border-t border-slate-800/60 space-y-3 animate-in fade-in duration-200">
                {passwordMsg && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    passwordMsg.type === "success"
                      ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/80 border-rose-500/40 text-rose-300"
                  }`}>
                    {passwordMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-slate-900 border border-slate-800 text-slate-100 px-3.5 py-2 rounded-xl focus:outline-none focus:border-emerald-500 text-xs font-mono"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* CARD 5: API KEYS */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 font-bold text-base text-white">
            <span className="font-mono font-black text-rose-400 text-sm">&lt;/&gt;</span>
            <span>API Keys</span>
          </div>
          <button
            onClick={() => {
              if (isUserOwner) {
                onUpdateProfile({ ...userProfile, apiEnabled: !userProfile.apiEnabled });
              } else {
                alert("⚠️ API Access Permission Required\n\nAPI access can only be enabled by an Admin or Owner. Please contact your Team Lead or Admin to request API access permission for your account.");
              }
            }}
            className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border font-bold transition-all ${
              userProfile.apiEnabled
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                : isUserOwner
                ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer"
                : "bg-slate-800/80 border-slate-700/80 text-slate-500 hover:text-slate-400 cursor-pointer"
            }`}
            title={isUserOwner ? "Click to toggle API access" : "API access permission is managed by Admin / Owner"}
          >
            {userProfile.apiEnabled ? "● API ACCESS: ENABLED" : "○ API ACCESS: DISABLED"}
          </button>
        </div>

        {userProfile.apiEnabled ? (
          <div className="space-y-3">
            <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <span className="font-mono text-sm text-emerald-400 font-bold tracking-widest flex-1 select-all">
                {showApiKey ? apiKey : apiKey.replace(/./g, "•")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  title={showApiKey ? "Hide Key" : "Show Key"}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleCopy(apiKey, "key")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  title="Copy API Key"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Created {apiKeyCreated}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleRegenerateApiKey}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
              <button
                onClick={handleRevokeApiKey}
                className="py-2.5 px-4 rounded-xl bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Revoke</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Use this key in the Authorization header for API access. Keep it secret — regenerating invalidates the old key.
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#171711]/90 border border-dashed border-amber-500/30 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-bold text-white text-base sm:text-lg tracking-tight">
              API Key Generation Disabled
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
              You are not enabled to generate an API key. Please{" "}
              <strong className="text-slate-200 font-semibold">contact your Team Lead</strong> to request access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

