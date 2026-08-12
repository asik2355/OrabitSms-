import React from "react";
import { motion } from "motion/react";
import { LogOut, ArrowLeft, AlertTriangle } from "lucide-react";
import { UserProfile } from "./OrabitAuthScreen";
import { OrabitLogo } from "./OrabitLogo";
import { formatCurrencyDisplay } from "../lib/storageUtils";

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
      ? formatCurrencyDisplay(userProfile.balance, currency, usdExchangeRate)
      : "৳0.00";

  return (
    <div className="w-full flex items-center justify-center min-h-screen p-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="max-w-[420px] w-full bg-[#0e121f] border border-slate-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden text-center space-y-5 z-10"
      >
        {/* Subtle Background Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="flex items-center justify-center pt-1">
          <OrabitLogo size="md" showSubtitle={false} />
        </div>

        {/* Circular Logout Badge with Rainbow Gradient Ring */}
        <div className="relative pt-2 flex items-center justify-center">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Gradient Border Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 p-[2.5px] opacity-90 shadow-lg shadow-rose-500/10" />

            {/* Inner Dark Circle */}
            <div className="relative w-[72px] h-[72px] rounded-full bg-[#0a0d17] flex items-center justify-center text-rose-500">
              <LogOut className="w-8 h-8 text-rose-500" />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sign out?
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
            You are about to end your active session on ORABIT.
          </p>
        </div>

        {/* Account Box - Showing Name & Balance ONLY (No Email) */}
        <div className="p-4 rounded-2xl bg-[#080a13] border border-slate-800/90 text-left flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3 min-w-0">
            {/* User Avatar Badge */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-sm text-white border border-blue-400/40 shadow-md">
                {userProfile?.fullName ? userProfile.fullName.substring(0, 2).toUpperCase() : "OR"}
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#080a13] absolute -bottom-0.5 -right-0.5" />
            </div>

            {/* Account Holder Name */}
            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">
                Account Holder
              </div>
              <div className="font-extrabold text-base text-white truncate max-w-[150px] sm:max-w-[180px]">
                {userProfile?.fullName || "Orabit User"}
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="text-right shrink-0 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
            <div className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-wider">
              Balance
            </div>
            <div className="text-xs font-mono font-bold text-emerald-300">
              {formattedBalance}
            </div>
          </div>
        </div>

        {/* Warning Info Box */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-3 text-left">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="leading-normal">
            Signing out will safely end your current session on this device.
          </span>
        </div>

        {/* Action Buttons (Stacked Vertically like Screenshot) */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onConfirmLogout}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all cursor-pointer border border-rose-500/40"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>Yes, sign me out</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#0a0d17] hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800 font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            <span>Cancel</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

