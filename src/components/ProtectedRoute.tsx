import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { OrabitAuthScreen } from "./OrabitAuthScreen";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  domainName: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, domainName }) => {
  const { userProfile, loading, isValidating, validateServerSession, login, validationError } = useAuth();

  // Validate server-side session whenever protected route mounts or userProfile changes
  useEffect(() => {
    if (userProfile) {
      validateServerSession();
    }
  }, [userProfile?.email]);

  if (loading || (isValidating && !userProfile)) {
    return (
      <div className="min-h-screen w-full bg-[#060b1a] text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <RefreshCw className="w-5 h-5 text-emerald-400 absolute animate-pulse" />
        </div>
        <p className="text-sm font-mono text-slate-400 animate-pulse">
          Validating server session with Supabase…
        </p>
      </div>
    );
  }

  // If ghost session was cleared or user profile is missing, render Login Screen
  if (!userProfile) {
    return (
      <div>
        {validationError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-2 text-xs font-mono text-center flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
        <OrabitAuthScreen onLoginSuccess={login} domainName={domainName} />
      </div>
    );
  }

  return <>{children}</>;
};
