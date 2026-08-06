import React, { useState } from "react";
import { UserProfile } from "./OrabitAuthScreen";
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
  Clock,
  Sparkles,
  CreditCard,
  Lock,
} from "lucide-react";

interface UserProfileViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  userProfile,
  onUpdateProfile,
}) => {
  // Split fullName into first and last name if possible
  const nameParts = (userProfile.fullName || "Alif Sheikh").split(" ");
  const defaultFirstName = nameParts[0] || "Alif";
  const defaultLastName = nameParts.slice(1).join(" ") || "Sheikh";

  // Form State
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState(userProfile.country || "Bangladesh");
  const [city, setCity] = useState(userProfile.city || "Dhaka");
  const [telegramUsername, setTelegramUsername] = useState(userProfile.telegram || "@alif_sheikh");

  // Security Toggles
  const [twoFactorPayments, setTwoFactorPayments] = useState(false);

  // API Key State
  const [apiKey, setApiKey] = useState("MHF5UTYD3L7");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCreated, setApiKeyCreated] = useState("11/07/2026, 12:33:58");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Status & Feedback
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  const publicUid = "M4Q91X5HKW3";
  const memberSince = "Jul 2026";
  const lastLogin = "06/08/2026, 13:34:55";
  const lifetimeEarning = userProfile.balance > 0 ? userProfile.balance : 22.99;

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
  };

  const handleRevokeApiKey = () => {
    if (window.confirm("Are you sure you want to revoke this API key? This will block access for applications using it.")) {
      setApiKey("REVOKED");
    }
  };

  const handleSaveChangesClick = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpModalOpen(true);
  };

  const handleVerifyOtp = () => {
    if (!otpInput || otpInput.length < 4) {
      alert("Please enter a valid OTP code.");
      return;
    }
    setOtpModalOpen(false);
    setOtpInput("");

    // Update parent user profile
    const updatedFull = `${firstName} ${lastName}`.trim();
    onUpdateProfile({
      ...userProfile,
      fullName: updatedFull,
      country: country,
      telegram: telegramUsername,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* PROFILE TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-800 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">Profile</h1>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Manage personal info, security and API keys.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto pl-11 sm:pl-0">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE ACCOUNT
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Profile updated successfully! All changes have been saved.</span>
        </div>
      )}

      {/* CARD 1: WELCOME BACK */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 text-xl font-bold shadow-inner">
          <User className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            WELCOME BACK,
          </div>
          <div className="text-xl font-extrabold text-white">
            {firstName} {lastName}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Last login: {lastLogin}</span>
          </div>
        </div>
      </div>

      {/* CARD 2: ACCOUNT OVERVIEW */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-base text-white">
            <CreditCard className="w-4.5 h-4.5 text-emerald-400" />
            <span>Account Overview</span>
          </div>
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md">
            ACTIVE
          </span>
        </div>

        {/* Highlight Lifetime Earning Box */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 space-y-1 shadow-inner">
          <div className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
            LIFETIME EARNING
          </div>
          <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
            <span className="text-xs text-slate-400 font-sans">USD</span>
            <span>{lifetimeEarning.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              MEMBER SINCE
            </span>
            <div className="text-white font-bold">{memberSince}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                PUBLIC UID
              </span>
              <div className="text-emerald-400 font-mono font-bold">{publicUid}</div>
            </div>
            <button
              onClick={() => handleCopy(publicUid, "uid")}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
              title="Copy UID"
            >
              {copiedUid ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* CARD 3: PERSONAL INFORMATION */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-base text-white">
            <User className="w-4.5 h-4.5 text-emerald-400" />
            <span>Personal Information</span>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
            {publicUid}
          </span>
        </div>

        <form onSubmit={handleSaveChangesClick} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FIRST NAME */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                FIRST NAME
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium"
              />
            </div>

            {/* LAST NAME */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                LAST NAME
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium"
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
                className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-400 px-3.5 py-2.5 rounded-xl cursor-not-allowed font-medium"
              />
            </div>

            {/* PHONE (READ-ONLY) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                PHONE (READ-ONLY)
              </label>
              <input
                type="text"
                readOnly
                value={userProfile.mobileNumber || "0175257721"}
                className="w-full bg-slate-950/60 border border-slate-800/80 text-slate-400 px-3.5 py-2.5 rounded-xl cursor-not-allowed font-medium"
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
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium resize-none"
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
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium"
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
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium"
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
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setFirstName(defaultFirstName);
                setLastName(defaultLastName);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#2EE59D] hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes (OTP)</span>
            </button>
          </div>
        </form>
      </div>

      {/* CARD 4: SECURITY STATUS */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg space-y-4">
        <div className="flex items-center gap-2 font-bold text-base text-white border-b border-slate-800 pb-3">
          <Shield className="w-4.5 h-4.5 text-emerald-400" />
          <span>Security Status</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4 text-xs">
          {/* Toggle: 2 STEP (Payments) */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-bold text-white flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>2 STEP (Payments)</span>
              </div>
              <p className="text-[11px] text-slate-400">Require PIN or OTP authorization for payouts</p>
            </div>
            <button
              onClick={() => setTwoFactorPayments(!twoFactorPayments)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                twoFactorPayments ? "bg-emerald-500" : "bg-slate-800"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  twoFactorPayments ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* CARD 5: API KEYS */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-lg space-y-4">
        <div className="flex items-center gap-2 font-bold text-base text-white border-b border-slate-800 pb-3">
          <Key className="w-4.5 h-4.5 text-emerald-400" />
          <span>API Keys</span>
        </div>

        <div className="space-y-3">
          {/* API Key Box */}
          <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
            <span className="font-mono text-sm text-emerald-400 font-bold tracking-widest flex-1 select-all">
              {showApiKey ? apiKey : apiKey.replace(/./g, "•")}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title={showApiKey ? "Hide Key" : "Show Key"}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleCopy(apiKey, "key")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
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
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
            <button
              onClick={handleRevokeApiKey}
              className="py-2.5 px-4 rounded-xl bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Revoke</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            Use this key in the Authorization header for API access. Keep it secret — regenerating invalidates the old key.
          </p>
        </div>
      </div>

      {/* OTP PROMPT MODAL FOR SAVING CHANGES */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#141822] border border-slate-700 text-slate-200 p-5 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Security Verification OTP</span>
              </h3>
              <p className="text-xs text-slate-400">
                An OTP code has been sent to your registered email/phone. Enter it below to save changes.
              </p>
            </div>

            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="Enter 6-digit OTP (e.g. 123456)"
              className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-center tracking-widest text-lg py-2.5 rounded-xl focus:outline-none focus:border-emerald-500"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setOtpModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                className="flex-1 py-2.5 rounded-xl bg-[#2EE59D] text-slate-950 font-bold text-xs hover:bg-emerald-400 shadow-md"
              >
                Verify & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
