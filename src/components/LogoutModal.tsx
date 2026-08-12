import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, X, Shield, Wallet, CheckCircle2 } from "lucide-react";
import { UserProfile } from "./OrabitAuthScreen";
import { OrabitLogo } from "./OrabitLogo";
import { formatCurrencyDisplay } from "../lib/storageUtils";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
  userProfile: UserProfile;
  currency?: "BDT" | "USD";
  usdExchangeRate?: number;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogout,
  userProfile,
  currency = "BDT",
  usdExchangeRate = 100,
}) => {
  const formattedBalance =
    userProfile?.balance !== undefined
      ? formatCurrencyDisplay(userProfile.balance, currency, usdExchangeRate)
      : "৳0.00";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay (No heavy backdrop-blur to ensure smooth 60fps on mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80"
          />

          {/* Modal Card Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative max-w-md w-full bg-[#131622] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-5 z-10 overflow-hidden"
          >
            {/* Top Circular Icon Badge */}
            <div className="relative pt-1">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                {/* Colorful Gradient Border Ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 p-[2px] opacity-80" />

                {/* Inner Circle Icon Container */}
                <div className="relative w-[60px] h-[60px] rounded-full bg-[#0d101d] flex items-center justify-center text-rose-400">
                  <LogOut className="w-7 h-7 text-rose-400" />
                </div>
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <OrabitLogo size="xs" showSubtitle={false} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Sign out?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                You are about to end your active session on ORABIT.
              </p>
            </div>

            {/* User Profile Card */}
            {userProfile && (
              <div className="p-3.5 rounded-2xl bg-[#090b13] border border-slate-800/80 text-left flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* User Avatar Badge */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white border border-cyan-400/50 shadow-md">
                      {userProfile.fullName ? userProfile.fullName.substring(0, 2).toUpperCase() : "OR"}
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090b13] absolute -bottom-0.5 -right-0.5" />
                  </div>

                  {/* User Info Details */}
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="font-extrabold text-sm text-white truncate max-w-[150px] sm:max-w-[170px]">
                      {userProfile.fullName || "Orabit User"}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-[170px]">
                      {userProfile.email}
                    </div>
                  </div>
                </div>

                {/* User Balance Badge */}
                <div className="text-right shrink-0 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                  <div className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-wider">
                    Balance
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-300">
                    {formattedBalance}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons (Red Sign Out + Dark Cancel) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={onConfirmLogout}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer border border-rose-500/50 shadow-md"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>Yes, sign me out</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform cursor-pointer shadow-md"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>Cancel</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
