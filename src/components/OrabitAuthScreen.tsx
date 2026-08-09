import React, { useState, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";
import { getUserRoleFromSupabase } from "../lib/userRoles";
import { OrabitLogo } from "./OrabitLogo";
import { TurnstileCaptcha } from "./TurnstileCaptcha";
import {
  User,
  Phone,
  Mail,
  Users,
  Lock,
  Eye,
  EyeOff,
  Zap,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Info,
  Building2,
  Send,
  Globe,
} from "lucide-react";

export interface UserProfile {
  fullName: string;
  mobileNumber: string;
  email: string;
  telegram: string;
  country: string;
  city?: string;
  referralEmail: string;
  withdrawPin: string;
  balance: number;
  password?: string;
  apiEnabled?: boolean;
  role?: string;
}

interface OrabitAuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  domainName: string;
}

export const OrabitAuthScreen: React.FC<OrabitAuthScreenProps> = ({
  onLoginSuccess,
  domainName,
}) => {
  const [mode, setMode] = useState<"register" | "login">("login");

  // Passwords Visibility
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [agentReferralEmail, setAgentReferralEmail] = useState("");
  const [password, setPassword] = useState("");
  const [withdrawPin, setWithdrawPin] = useState("");

  // Login Only State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Captcha State
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const captchaRef = useRef<{ reset: () => void } | null>(null);

  // Feedback State
  const [alert, setAlert] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

  // Feedback State

  // Password Strength Calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, text: "", color: "bg-transparent", textColor: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const map = [
      { level: 1, text: "Weak password", color: "bg-red-500", textColor: "text-red-400" },
      { level: 2, text: "Fair password", color: "bg-amber-500", textColor: "text-amber-400" },
      { level: 3, text: "Good password", color: "bg-emerald-500", textColor: "text-emerald-400" },
      { level: 4, text: "Strong password", color: "bg-cyan-500", textColor: "text-cyan-400" },
      { level: 5, text: "Very strong!", color: "bg-purple-500", textColor: "text-purple-400" },
    ];
    return map[Math.min(score - 1, 4)] || map[0];
  }, [password]);

  // Stars Array for space background - Optimized for Mobile (22 stars)
  const stars = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 2 + 2,
      delay: Math.random() * 4,
    }));
  }, []);

  const showAlert = (message: string, type: "error" | "success" = "error") => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 4500);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: boolean } = {};

    if (!fullName.trim()) {
      newErrors.fullName = true;
      setErrors(newErrors);
      showAlert("Please enter your full name", "error");
      return;
    }

    const cleanMobile = mobileNumber.replace(/[^0-9]/g, "");
    if (!cleanMobile) {
      newErrors.mobileNumber = true;
      setErrors(newErrors);
      showAlert("Please enter your mobile number", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailAddress.trim() || !emailRegex.test(emailAddress.trim())) {
      newErrors.emailAddress = true;
      setErrors(newErrors);
      showAlert("Please enter a valid email address", "error");
      return;
    }

    if (!agentReferralEmail.trim() || !emailRegex.test(agentReferralEmail.trim())) {
      newErrors.agentReferralEmail = true;
      setErrors(newErrors);
      showAlert("Valid Agent Referral Email is required to register", "error");
      return;
    }

    if (!password || password.length < 8) {
      newErrors.password = true;
      setErrors(newErrors);
      showAlert("Password must be at least 8 characters", "error");
      return;
    }

    if (!withdrawPin || withdrawPin.length !== 4) {
      newErrors.withdrawPin = true;
      setErrors(newErrors);
      showAlert("Withdraw PIN must be exactly 4 digits", "error");
      return;
    }

    if (!captchaToken) {
      showAlert("Please complete the Captcha security check to register.", "error");
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const cleanEmail = emailAddress.trim();
    const isOwnerEmail = cleanEmail.toLowerCase() === "orabitsms@gmail.com";

    const newUser: UserProfile = {
      fullName: fullName.trim(),
      mobileNumber: cleanMobile,
      email: cleanEmail,
      telegram: telegramUsername.trim() || "@orabit_user",
      city: city.trim() || "Dhaka",
      country: country.trim() || "Bangladesh",
      referralEmail: agentReferralEmail.trim(),
      withdrawPin: withdrawPin.trim(),
      balance: isOwnerEmail ? 999.0 : 0.0,
      password: password,
      role: isOwnerEmail ? "Owner" : "Client",
    };

    (async () => {
      let sbErrorMsg = "";
      try {
        const { error } = await supabase.auth.signUp({
          email: emailAddress.trim(),
          password: password,
          options: {
            captchaToken: captchaToken,
            data: {
              fullName: fullName.trim(),
              mobileNumber: cleanMobile,
              telegram: telegramUsername.trim() || "@orabit_user",
              city: city.trim() || "Dhaka",
              country: country.trim() || "Bangladesh",
              referralEmail: agentReferralEmail.trim(),
              withdrawPin: withdrawPin.trim(),
              role: "Client",
            },
          },
        });
        if (error) {
          sbErrorMsg = error.message;
        }
      } catch (err) {
        console.warn("Supabase registration warning:", err);
      }

      // Reset captcha token after attempt
      captchaRef.current?.reset();
      setCaptchaToken("");

      try {
        const stored = localStorage.getItem("orabit_registered_users");
        const savedAccounts: UserProfile[] = stored ? JSON.parse(stored) : [];
        const existingIdx = savedAccounts.findIndex(
          (acc) => acc.email.toLowerCase() === newUser.email.toLowerCase()
        );
        if (existingIdx >= 0) {
          savedAccounts[existingIdx] = newUser;
        } else {
          savedAccounts.push(newUser);
        }
        localStorage.setItem("orabit_registered_users", JSON.stringify(savedAccounts));
      } catch (e) {
        console.error("Local storage error:", e);
      }

      setIsSubmitting(false);
      if (sbErrorMsg) {
        showAlert(`Notice: ${sbErrorMsg}. Created account!`, "success");
      } else {
        showAlert("🎉 Registration successful! Welcome to ORABIT Network.", "success");
      }

      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 1200);
    })();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      showAlert("Please enter your email and password.", "error");
      return;
    }

    if (!captchaToken) {
      showAlert("Please complete the Captcha security check to log in.", "error");
      return;
    }

    setIsSubmitting(true);

    let loggedInUser: UserProfile | null = null;
    let authErrorMsg = "";

    // 1. Try Supabase Authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
        options: {
          captchaToken: captchaToken,
        },
      });

      if (data?.user && !error) {
        const meta = data.user.user_metadata || {};
        let savedAccounts: UserProfile[] = [];
        try {
          const stored = localStorage.getItem("orabit_registered_users");
          if (stored) savedAccounts = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }

        const foundAcc = savedAccounts.find(
          (acc) => acc.email.toLowerCase() === (data.user.email || loginEmail.trim()).toLowerCase()
        );

        const userEmailClean = (data.user.email || loginEmail.trim()).toLowerCase();
        const isOwnerEmail = userEmailClean === "orabitsms@gmail.com";

        loggedInUser = {
          fullName: foundAcc?.fullName || meta.fullName || data.user.email?.split("@")[0] || "User",
          mobileNumber: foundAcc?.mobileNumber || meta.mobileNumber || "",
          email: data.user.email || loginEmail.trim(),
          telegram: foundAcc?.telegram || meta.telegram || "@orabit_user",
          city: foundAcc?.city || meta.city || "Dhaka",
          country: foundAcc?.country || meta.country || "Bangladesh",
          referralEmail: foundAcc?.referralEmail || meta.referralEmail || "agent@orabit.bd",
          withdrawPin: foundAcc?.withdrawPin || meta.withdrawPin || "1234",
          balance: foundAcc?.balance !== undefined ? foundAcc.balance : (isOwnerEmail ? 999.0 : 0.0),
          password: loginPassword,
          role: isOwnerEmail ? "Owner" : (foundAcc?.role || meta.role || "Client"),
          apiEnabled: foundAcc?.apiEnabled ?? false,
        };

        // Ensure user is stored in registered users
        if (!foundAcc) {
          savedAccounts.push(loggedInUser);
          try {
            localStorage.setItem("orabit_registered_users", JSON.stringify(savedAccounts));
          } catch (e) {
            console.error(e);
          }
        }
      } else if (error) {
        authErrorMsg = error.message;
      }
    } catch (err) {
      console.warn("Supabase login attempt:", err);
    }

    // Reset captcha token after attempt
    captchaRef.current?.reset();
    setCaptchaToken("");

    // 2. Check local registered accounts if Supabase didn't authenticate
    if (!loggedInUser) {
      let savedAccounts: UserProfile[] = [];
      try {
        const stored = localStorage.getItem("orabit_registered_users");
        if (stored) savedAccounts = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }

      const foundAcc = savedAccounts.find(
        (acc) => acc.email.toLowerCase() === loginEmail.trim().toLowerCase()
      );

      if (foundAcc) {
        if (foundAcc.password && foundAcc.password !== loginPassword) {
          setIsSubmitting(false);
          showAlert("Incorrect password. Please try again.", "error");
          return;
        }
        loggedInUser = {
          ...foundAcc,
          role: foundAcc.role || "Client",
        };
      }
    }

    if (loggedInUser) {
      // Fetch user role from Supabase user_roles table
      try {
        const fetchedRole = await getUserRoleFromSupabase(loggedInUser.email);
        if (fetchedRole) {
          loggedInUser.role = fetchedRole === "owner" ? "Owner" : "Client";
        }
      } catch (err) {
        console.warn("Failed to query user_roles table on login:", err);
      }

      setIsSubmitting(false);
      showAlert("Login successful! Welcome back to ORABIT.", "success");
      onLoginSuccess(loggedInUser);
    } else {
      setIsSubmitting(false);
      showAlert(
        authErrorMsg ? `Login failed: ${authErrorMsg}` : "Account not found! Please register an account first.",
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060B1A] text-[#F0F2FF] flex flex-col items-center justify-center py-8 px-4 sm:px-6 relative overflow-x-hidden font-sans select-none">
      {/* ==================== ANIMATED UNIVERSE BACKGROUND ==================== */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(99,102,241,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_50%_80%,rgba(6,182,212,0.06)_0%,transparent_50%)] pointer-events-none" />

      {/* Stars Container */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={
              {
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.left}%`,
                top: `${star.top}%`,
                "--duration": `${star.duration}s`,
                "--delay": `${star.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Single GPU-Accelerated Shooting Star */}
      <div
        className="fixed w-[2px] h-[70px] bg-gradient-to-b from-transparent via-indigo-300/60 to-white/90 z-0 pointer-events-none animate-shoot"
        style={
          {
            top: "20%",
            left: "80%",
            "--shoot-duration": "6s",
            "--shoot-delay": "1s",
          } as React.CSSProperties
        }
      />

      {/* Orbit Rings (Lightweight) */}
      <div className="fixed w-[500px] h-[500px] -top-[180px] -left-[100px] rounded-full border border-indigo-500/10 z-0 pointer-events-none animate-orbit">
        <div className="absolute w-[5px] h-[5px] rounded-full bg-[#6366F1] shadow-[0_0_10px_rgba(129,140,248,0.5)] -top-[2.5px] left-1/2" />
      </div>

      {/* Floating Geometric Shapes (Lightweight) */}
      <div className="fixed w-[80px] h-[80px] bg-[#6366F1] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] top-[15%] left-[8%] opacity-[0.05] pointer-events-none z-0 animate-float-shape" />
      <div className="fixed w-[70px] h-[70px] bg-[#8B5CF6] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] top-[70%] right-[6%] opacity-[0.05] pointer-events-none z-0 animate-float-shape [animation-delay:-8s]" />

      {/* Grid Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(99,102,241,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.025)_1px,transparent_1px)] [background-size:44px_44px] animate-grid-pulse" />

      {/* ==================== MAIN CONTAINER ==================== */}
      <div className="relative z-10 w-full max-w-[500px] py-4">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <OrabitLogo
            size="lg"
            showSubtitle={false}
            className="justify-center"
          />
        </div>

        {/* Card - High Performance Mobile Optimized Background */}
        <div className="bg-[#0B1026]/90 backdrop-blur-sm sm:backdrop-blur-md border border-indigo-500/25 rounded-[22px] sm:rounded-[24px] p-6 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
          {/* Card Ambient Inner Glow */}
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.1),transparent_70%)] pointer-events-none" />

          {/* Floating Alert System */}
          {alert && (
            <div
              className={`p-3.5 rounded-xl mb-5 text-sm flex items-start gap-3 backdrop-blur-md transition-all shadow-lg ${
                alert.type === "success"
                  ? "bg-emerald-500/15 border border-emerald-500/40 text-[#6EE7B7]"
                  : "bg-rose-500/15 border border-rose-500/40 text-[#FCA5A5]"
              }`}
            >
              {alert.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{alert.message}</span>
            </div>
          )}

          {/* Card Header */}
          <div className="text-center mb-8 relative z-10">
            <h2 className="text-2xl font-bold text-[#F0F2FF] mb-1.5 animate-text-shimmer">
              {mode === "register" ? "Join ORABIT Network" : "Sign In to ORABIT"}
            </h2>
            <p className="text-sm text-[#B4B8D4]">
              {mode === "register"
                ? "Create your enterprise access account."
                : "Welcome back! Please enter your details."}
            </p>
            <div className="w-[60px] h-[3px] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full mx-auto mt-3 animate-line-pulse" />
          </div>

          {/* REGISTER FORM */}
          {mode === "register" ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-5 relative z-10" noValidate>
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8]">Full Name</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none transition-colors" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: false });
                    }}
                    placeholder="John Doe"
                    className={`w-full py-3.5 pl-12 pr-4 bg-[#0F1432]/50 border-2 rounded-xl text-sm text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all ${
                      errors.fullName
                        ? "border-rose-500 focus:border-rose-500 animate-shake"
                        : "border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10"
                    }`}
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8]">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none transition-colors" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value);
                      if (errors.mobileNumber) setErrors({ ...errors, mobileNumber: false });
                    }}
                    placeholder="017xxxxxxxx"
                    className={`w-full py-3.5 pl-12 pr-4 bg-[#0F1432]/50 border-2 rounded-xl text-sm text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all ${
                      errors.mobileNumber
                        ? "border-rose-500 focus:border-rose-500 animate-shake"
                        : "border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10"
                    }`}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8]">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none transition-colors" />
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => {
                      setEmailAddress(e.target.value);
                      if (errors.emailAddress) setErrors({ ...errors, emailAddress: false });
                    }}
                    placeholder="name@domain.com"
                    className={`w-full py-3.5 pl-12 pr-4 bg-[#0F1432]/50 border-2 rounded-xl text-sm text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all ${
                      errors.emailAddress
                        ? "border-rose-500 focus:border-rose-500 animate-shake"
                        : "border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10"
                    }`}
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8]">Country</label>
                <div className="relative">
                  <Globe className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none transition-colors" />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Bangladesh"
                    className="w-full py-3.5 pl-12 pr-4 bg-[#0F1432]/50 border-2 border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8]">City</label>
                <div className="relative">
                  <Building2 className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none transition-colors" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Dhaka"
                    className="w-full py-3.5 pl-12 pr-4 bg-[#0F1432]/50 border-2 border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Telegram Username */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8]">Telegram Username</label>
                <div className="relative">
                  <Send className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none transition-colors" />
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="@username"
                    className="w-full py-3.5 pl-12 pr-4 bg-[#0F1432]/50 border-2 border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Agent Referral Email */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8] flex items-center justify-between">
                  <span>
                    Agent Referral Email <span className="text-rose-400 ml-1">*</span>
                  </span>
                </label>
                <div className="relative">
                  <Users className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none transition-colors" />
                  <input
                    type="email"
                    value={agentReferralEmail}
                    onChange={(e) => {
                      setAgentReferralEmail(e.target.value);
                      if (errors.agentReferralEmail) setErrors({ ...errors, agentReferralEmail: false });
                    }}
                    placeholder="Enter Agent Email Address"
                    className={`w-full py-3.5 pl-12 pr-4 bg-[#0F1432]/50 border-2 rounded-xl text-sm text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all ${
                      errors.agentReferralEmail
                        ? "border-rose-500 focus:border-rose-500 animate-shake"
                        : "border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10"
                    }`}
                  />
                </div>

                {/* Agent Referral Hint Box */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[12.5px] text-amber-200 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    A valid registered Agent Referral Email is required to register an account.
                  </span>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8]">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: false });
                    }}
                    placeholder="••••••••"
                    className={`w-full py-3.5 pl-12 pr-12 bg-[#0F1432]/50 border-2 rounded-xl text-sm text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all ${
                      errors.password
                        ? "border-rose-500 focus:border-rose-500 animate-shake"
                        : "border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E7191] hover:text-[#F0F2FF] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.level / 5) * 100}%` }}
                      />
                    </div>
                    <p className={`text-[11px] text-right font-medium ${passwordStrength.textColor}`}>
                      {passwordStrength.text}
                    </p>
                  </div>
                )}
              </div>

              {/* Withdraw PIN (4-Digit) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8]">
                  Withdraw PIN (4-Digit)
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none transition-colors" />
                  <input
                    type="password"
                    maxLength={4}
                    value={withdrawPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setWithdrawPin(val);
                      if (errors.withdrawPin) setErrors({ ...errors, withdrawPin: false });
                    }}
                    placeholder="••••"
                    className={`w-full py-3.5 pl-12 pr-4 bg-[#0F1432]/50 border-2 rounded-xl text-center font-mono text-xl tracking-[12px] text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all ${
                      errors.withdrawPin
                        ? "border-rose-500 focus:border-rose-500 animate-shake"
                        : "border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10"
                    }`}
                  />
                </div>
              </div>

              {/* Security Verification Captcha */}
              <TurnstileCaptcha
                widgetRef={captchaRef}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#06B6D4] text-white font-bold text-base tracking-wide rounded-xl shadow-[0_15px_40px_rgba(99,102,241,0.5)] transition-all duration-300 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-white" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Complete Registration</span>
                )}
              </button>
            </form>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-5 relative z-10" noValidate>
              {/* Email Address */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8]">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full py-3.5 pl-12 pr-4 bg-[#0F1432]/50 border-2 border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#C8CCE8]">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#6E7191] pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full py-3.5 pl-12 pr-12 bg-[#0F1432]/50 border-2 border-[rgba(99,102,241,0.2)] focus:border-[#6366F1] focus:bg-[#14193C]/70 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm text-[#F0F2FF] placeholder-[#4A4E6B] focus:outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E7191] hover:text-[#F0F2FF] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Verification Captcha */}
              <TurnstileCaptcha
                widgetRef={captchaRef}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
              />

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 mt-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#06B6D4] text-white font-bold text-base tracking-wide rounded-xl shadow-[0_15px_40px_rgba(99,102,241,0.5)] transition-all duration-300 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Bottom Switch Link */}
        <p className="text-center mt-7 text-sm text-[#B4B8D4]">
          {mode === "register" ? (
            <>
              Already registered?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-[#818CF8] font-bold hover:text-[#A5B4FC] hover:underline transition-colors ml-1 cursor-pointer"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account yet?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-[#818CF8] font-bold hover:text-[#A5B4FC] hover:underline transition-colors ml-1 cursor-pointer"
              >
                Register Now
              </button>
            </>
          )}
        </p>
      </div>

      {/* Footer text */}
      <footer className="mt-6 mb-2 text-center text-xs font-mono relative z-10 flex justify-center">
        <div className="inline-flex items-center gap-2 sm:gap-2.5 py-1.5 px-3 sm:px-4 rounded-full bg-[#0b0f19]/90 border border-slate-800/90 backdrop-blur-md shadow-2xl transition-all hover:border-emerald-500/40 max-w-full overflow-x-auto whitespace-nowrap">
          <OrabitLogo size="xs" showSubtitle={false} />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-extrabold tracking-wide uppercase text-xs">
            Official
          </span>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent font-extrabold tracking-wide uppercase text-xs">
            All rights Reserved.
          </span>
        </div>
      </footer>
    </div>
  );
};
