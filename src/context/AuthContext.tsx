import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { UserProfile } from "../components/OrabitAuthScreen";
import { getUserRoleFromSupabase } from "../lib/userRoles";
import { fetchUserProfileFromSupabase } from "../lib/userProfiles";

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
   * Clears local storage and user state IMMEDIATELY and synchronously,
   * performs Supabase signout, and hard-redirects to /login to ensure
   * a 100% clean memory & state environment without freezes or loops.
   */
  const signOut = useCallback(async () => {
    try {
      // 1. Synchronously wipe local storage and state
      localStorage.removeItem("orabit_user_profile");
      localStorage.removeItem("orabit_saved_accounts");
      setUserProfile(null);
      setLoading(false);
      setIsValidating(false);

      // 2. Perform Supabase sign out with a quick 1-second timeout fallback
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]).catch((err) => {
        console.warn("Background Supabase sign out warning:", err);
      });
    } catch (e) {
      console.error("SignOut error:", e);
    } finally {
      // 3. Force clean hard redirect to /login to completely unmount React tree,
      // stop all active background intervals/listeners, and flush browser memory.
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
  }, []);

  /**
   * Silent Server-Side Validation:
   * Runs `supabase.auth.getUser()` silently in the background.
   * If the user was deleted from Supabase or the token is invalid/revoked,
   * it immediately clears local session and forces redirect to login.
   */
  const validateServerSession = useCallback(async (): Promise<boolean> => {
    const saved = localStorage.getItem("orabit_user_profile");
    if (!saved) {
      localStorage.removeItem("orabit_user_profile");
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
          setTimeout(() => reject(new Error("Supabase auth validation timeout")), 5000)
        ),
      ]);

      const { data: userData, error: userError } = await getUserWithTimeout;

      if (userError || !userData?.user) {
        console.warn("Ghost session detected on Supabase server. Immediately forcing logout & login redirect...");
        await signOut();
        return false;
      }

      const validUser = userData.user;
      const validEmail = validUser.email?.toLowerCase().trim();

      if (validEmail) {
        try {
          const [fetchedRole, dbProfile] = await Promise.all([
            getUserRoleFromSupabase(validEmail),
            fetchUserProfileFromSupabase(validEmail),
          ]);

          let normalizedRole = "Client";
          if (fetchedRole === "owner" || validEmail === "orabitsms@gmail.com") normalizedRole = "Owner";
          else if (fetchedRole === "agent") normalizedRole = "Agent";

          setUserProfile((prev) => {
            const baseProfile = prev || {
              fullName: validEmail.split("@")[0],
              mobileNumber: "",
              email: validEmail,
              telegram: "@orabit_user",
              city: "Dhaka",
              country: "Bangladesh",
              referralEmail: "agent@orabit.bd",
              withdrawPin: "",
              balance: validEmail === "orabitsms@gmail.com" ? 999.0 : 0.0,
              password: "",
              role: normalizedRole,
            };

            return {
              ...baseProfile,
              email: validEmail,
              role: normalizedRole,
              uid: validUser.id,
              fullName: dbProfile?.fullName || baseProfile.fullName,
              mobileNumber: dbProfile?.mobileNumber || baseProfile.mobileNumber,
              telegram: dbProfile?.telegram || baseProfile.telegram,
              country: dbProfile?.country || baseProfile.country,
              city: dbProfile?.city || baseProfile.city,
              bio: dbProfile?.bio || baseProfile.bio,
              withdrawPin: dbProfile?.withdrawPin !== undefined ? dbProfile.withdrawPin : baseProfile.withdrawPin,
              balance: dbProfile?.balance !== undefined ? dbProfile.balance : baseProfile.balance,
              totalSuccess: dbProfile?.totalSuccess !== undefined ? dbProfile.totalSuccess : baseProfile.totalSuccess,
              apiKey: dbProfile?.apiKey || baseProfile.apiKey,
              paymentMethods: dbProfile?.paymentMethods || baseProfile.paymentMethods,
              withdrawHistory: dbProfile?.withdrawHistory || baseProfile.withdrawHistory,
            };
          });
        } catch (e) {
          console.error("Error fetching user role or profile:", e);
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
        localStorage.removeItem("orabit_user_profile");
        setUserProfile(null);
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
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
