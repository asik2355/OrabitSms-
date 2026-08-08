import React from "react";
import { motion } from "motion/react";
import { LogOut, ArrowLeft, AlertOctagon } from "lucide-react";
import { UserProfile } from "./OrabitAuthScreen";
import { OrabitLogo } from "./OrabitLogo";

interface LogoutPageProps {
  userProfile: UserProfile;
  onConfirmLogout: () => void;
  onCancel: () => void;
  currency?: "BDT" | "USD";
  usdExchangeRate?: number;
}

export const LogoutPage: React.FC<LogoutPageProps> = ({
  userProfile,
  onConfirmLogout,
  onCancel,
  currency = "BDT",
  usdExchangeRate = 100,
}) => {
  const formattedBalance =
    userProfile?.balance !== undefined
      ? currency === "BDT"
        ? `৳${userProfile.balance.toFixed(2)}`
        : `$${(userProfile.balance / usdExchangeRate).toFixed(2)}`
      : "৳0.00";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 my-auto">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="max-w-lg w-full bg-[#111524] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center space-y-6 z-10"
      >
        {/* Animated Background Glowing Auras */}
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-tr from-rose-500/20 via-pink-500/10 to-amber-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-28 right-1/2 translate-x-1/2 w-64 h-64 bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge & Logo */}
        <div className="relative pt-1 flex flex-col items-center justify-center gap-3">
          <OrabitLogo size="md" showSubtitle={false} />

          {/* Animated Glowing Logout Icon Badge */}
          <div className="relative mt-2 w-20 h-20 flex items-center justify-center">
            {/* Rotating Colorful Aura Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 p-[2px] opacity-80 shadow-lg shadow-rose-500/20 animate-[spin_10s_linear_infinite]" />

            {/* Inner Circle Container */}
            <div className="relative w-[74px] h-[74px] rounded-full bg-[#0b0e1a] border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
              <LogOut className="w-8 h-8 text-rose-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Main Title & Description */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sign out?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-sm mx-auto">
            You are about to end your active session on ORABIT.
          </p>
        </div>

        {/* User Card - SHOWING ONLY NAME & BALANCE (NO EMAIL AS REQUESTED!) */}
        <div className="p-4 rounded-2xl bg-[#090b14] border border-slate-800/90 text-left flex items-center justify-between gap-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* User Avatar Badge */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white border border-cyan-400/50 shadow-md">
                {userProfile?.fullName ? userProfile.fullName.substring(0, 2).toUpperCase() : "OR"}
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#090b14] absolute -bottom-0.5 -right-0.5 shadow" />
            </div>

            {/* User Name ONLY (NO EMAIL) */}
            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">
                Account Holder
              </div>
              <div className="font-black text-base sm:text-lg text-white truncate max-w-[170px] sm:max-w-[210px]">
                {userProfile?.fullName || "Orabit User"}
              </div>
            </div>
          </div>

          {/* User Balance Badge */}
          <div className="text-right shrink-0 bg-emerald-950/70 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
            <div className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-wider">
              Balance
            </div>
            <div className="text-xs font-mono font-bold text-emerald-300">
              {formattedBalance}
            </div>
          </div>
        </div>

        {/* Notice Info Box */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5 text-left">
          <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Signing out will safely end your current session on this device.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onConfirmLogout}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-600/20 active:scale-95 transition-all cursor-pointer border border-rose-500/50"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>Yes, sign me out</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Cancel</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
