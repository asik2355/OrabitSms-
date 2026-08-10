import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { OrabitAuthScreen } from "./OrabitAuthScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  domainName: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, domainName }) => {
  const { userProfile, validateServerSession, login } = useAuth();

  // Silently validate server-side session whenever protected route mounts or userProfile changes
  useEffect(() => {
    if (userProfile) {
      validateServerSession();
    }
  }, [userProfile?.email]);

  // If no user profile exists or ghost session was cleared, immediately show Login Screen
  if (!userProfile) {
    return <OrabitAuthScreen onLoginSuccess={login} domainName={domainName} />;
  }

  return <>{children}</>;
};
