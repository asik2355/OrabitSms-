import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { UserProfile } from "../components/OrabitAuthScreen";
import { getUserRoleFromSupabase } from "../lib/userRoles";

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  isValidating: boolean;
  validationError: string | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  validateServerSession: () => Promise<boolean>;
  signOut: () => Promise<void>;
  login: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("orabit_user_profile");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse local user profile:", e);
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Clears local storage and signs out from Supabase
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase sign out error:", err);
    } finally {
      localStorage.removeItem("orabit_user_profile");
      setUserProfile(null);
      setValidationError(null);
    }
  }, []);

  /**
   * Server-Side Validation:
   * Uses `supabase.auth.getUser()` to verify token authenticity and ensure the user account
   * still exists in Supabase Auth/Database.
   * If the user was deleted from Supabase or the token is invalid/revoked, it immediately
   * clears local session (ghost session) and signs out.
   */
  const validateServerSession = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    setValidationError(null);

    try {
      // 1. Get current session from Supabase client
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData?.session) {
        // 2. Perform Server-Side Validation via supabase.auth.getUser()
        // This sends a request to Supabase backend to verify if user account is active & exists.
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
          console.warn(
            "Ghost session detected! User account is deleted or token is invalid on Supabase server:",
            userError?.message || "User not found"
          );
          setValidationError("Session expired or user account was removed from server.");
          await signOut();
          setIsValidating(false);
          return false;
        }

        const validUser = userData.user;
        const validEmail = validUser.email?.toLowerCase().trim();

        // 3. Optional: Sync user role from Supabase user_roles table
        if (validEmail) {
          const fetchedRole = await getUserRoleFromSupabase(validEmail);
          let normalizedRole = "Client";
          if (fetchedRole === "owner" || validEmail === "orabitsms@gmail.com") normalizedRole = "Owner";
          else if (fetchedRole === "agent") normalizedRole = "Agent";

          setUserProfile((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              email: validEmail,
              role: normalizedRole,
              uid: validUser.id,
            };
          });
        }

        setIsValidating(false);
        return true;
      } else {
        // If there's local userProfile stored but no Supabase session or user profile check
        // Check if userProfile is present
        const saved = localStorage.getItem("orabit_user_profile");
        if (saved) {
          // Verify with getUser() if possible
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData?.user) {
            console.warn("No valid Supabase user session found for local profile. Clearing ghost session...");
            await signOut();
            setIsValidating(false);
            return false;
          }
        }
      }
    } catch (err: any) {
      console.error("Server-side auth validation exception:", err);
      // In case of severe auth error, sign out to prevent ghost sessions
      if (err?.status === 401 || err?.message?.includes("invalid") || err?.message?.includes("not found")) {
        await signOut();
        setIsValidating(false);
        return false;
      }
    }

    setIsValidating(false);
    return true;
  }, [signOut]);

  // Initial validation on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (localStorage.getItem("orabit_user_profile")) {
        await validateServerSession();
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth state changes (e.g., token refreshed, user signed out)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        await signOut();
      } else if (event === "USER_UPDATED" || event === "SIGNED_IN") {
        if (session) {
          await validateServerSession();
        }
      }
    });

    // Re-validate session when browser tab regains focus
    const handleFocus = () => {
      if (localStorage.getItem("orabit_user_profile")) {
        validateServerSession();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, [validateServerSession, signOut]);

  // Save user profile changes to local storage
  useEffect(() => {
    if (userProfile) {
      try {
        localStorage.setItem("orabit_user_profile", JSON.stringify(userProfile));
      } catch (e) {
        console.error("Failed to save user profile:", e);
      }
    }
  }, [userProfile]);

  const login = (profile: UserProfile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem("orabit_user_profile", JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to set user profile on login:", e);
    }
    // Verify server session right after login
    validateServerSession();
  };

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        loading,
        isValidating,
        validationError,
        setUserProfile,
        validateServerSession,
        signOut,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
