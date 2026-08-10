import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { UserProfile } from "../components/OrabitAuthScreen";
import { getUserRoleFromSupabase } from "../lib/userRoles";

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  isValidating: boolean;
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

  const [loading, setLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  /**
   * Clears local storage, resets session states silently and signs out from Supabase
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase sign out error:", err);
    } finally {
      localStorage.removeItem("orabit_user_profile");
      setUserProfile(null);
      setLoading(false);
      setIsValidating(false);
    }
  }, []);

  /**
   * Silent Server-Side Validation:
   * Runs `supabase.auth.getUser()` silently in the background.
   * If the user was deleted from Supabase or the token is invalid/revoked,
   * it silently clears local session and redirects to login with zero extra UI/notices.
   */
  const validateServerSession = useCallback(async (): Promise<boolean> => {
    const saved = localStorage.getItem("orabit_user_profile");
    if (!saved) {
      setUserProfile(null);
      setLoading(false);
      setIsValidating(false);
      return false;
    }

    setIsValidating(true);

    try {
      const getUserWithTimeout = Promise.race([
        supabase.auth.getUser(),
        new Promise<{ data: { user: null }; error: any }>((_, reject) =>
          setTimeout(() => reject(new Error("Supabase auth validation timeout")), 6000)
        ),
      ]);

      const { data: userData, error: userError } = await getUserWithTimeout;

      if (userError || !userData?.user) {
        console.warn("Ghost session detected on Supabase server. Silently logging out...");
        await signOut();
        return false;
      }

      const validUser = userData.user;
      const validEmail = validUser.email?.toLowerCase().trim();

      if (validEmail) {
        try {
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
        } catch (e) {
          console.error("Error fetching user role:", e);
        }
      }

      return true;
    } catch (err: any) {
      console.error("Server-side auth validation exception:", err);
      await signOut();
      return false;
    } finally {
      setIsValidating(false);
      setLoading(false);
    }
  }, [signOut]);

  // Initial validation on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (localStorage.getItem("orabit_user_profile")) {
          await validateServerSession();
        }
      } catch (e) {
        console.error("initAuth error:", e);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsValidating(false);
        }
      }
    };

    initAuth();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        await signOut();
      } else if (event === "USER_UPDATED" || event === "SIGNED_IN") {
        if (session) {
          await validateServerSession();
        }
      }
    });

    // Re-validate session silently when browser tab regains focus
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
    validateServerSession();
  };

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        loading,
        isValidating,
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
