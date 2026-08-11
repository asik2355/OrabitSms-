import React, { useState, useEffect } from "react";
import { ServiceLogo } from "./ServiceLogo";
import {
  fetchUserFeedNumbersFromSupabase,
  saveFeedNumberToSupabase,
  bulkSyncFeedNumbersToSupabase,
} from "../lib/supabaseFeed";
import { incrementUserSuccessAndBalanceInSupabase } from "../lib/userProfiles";
import { TimeAgoBadge, formatTimeAgo } from "./TimeAgoBadge";
import { useAuth } from "../context/AuthContext";
import { safeLocalStorageSet, safeLocalStorageGet } from "../lib/storageUtils";
import {
  requestStexNumber,
  fetchStexOtps,
  fetchStexConsole,
  extractOtpFromMessage,
  getCountryAndOperatorFromRange,
  maskMessageOtp,
  DEFAULT_STEX_API_KEY,
} from "../lib/stexApi";
import {
  Search,
  RefreshCw,
  Clock,
  Send,
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Zap,
  PhoneCall,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Globe,
  DollarSign,
  MessageSquare,
  Sparkles,
  Code2,
  Lock,
  Terminal,
  Play,
  Filter,
  LayoutGrid,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SmsMessage {
  id: string;
  time: string;
  operator: string;
  country: string;
  countryIso: string;
  service: string;
  serviceColor: string;
  number: string;
  otpCode: string;
  rawMessage: string;
  timestamp?: number;
}

interface FeedNumber {
  id: string;
  number: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  country: string;
  operator: string;
  timeAgo: string;
  service: string;
  otpCode?: string;
  rawMessage?: string;
  requestedAt?: number;
}

const INITIAL_TRAFFIC_DATA = [
  { time: "00:00", volume: 0 },
  { time: "02:00", volume: 0.1 },
  { time: "04:00", volume: 1.0 },
  { time: "06:00", volume: 0.1 },
  { time: "07:00", volume: 2.0 },
  { time: "08:00", volume: 1.0 },
  { time: "09:00", volume: 0.1 },
  { time: "10:00", volume: 2.0 },
  { time: "12:00", volume: 0.1 },
  { time: "14:00", volume: 0.2 },
  { time: "16:00", volume: 0.1 },
  { time: "18:00", volume: 0.3 },
  { time: "20:00", volume: 0 },
  { time: "22:00", volume: 0.1 },
];

function getBD4AMWindowStart() {
  const now = new Date();
  const bdNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const bdHours = bdNow.getUTCHours();
  const windowStartBD = new Date(bdNow);
  if (bdHours < 4) {
    windowStartBD.setUTCDate(windowStartBD.getUTCDate() - 1);
  }
  windowStartBD.setUTCHours(4, 0, 0, 0);
  return windowStartBD.getTime() - 6 * 60 * 60 * 1000;
}

import { OrabitApiDoc } from "./OrabitApiDoc";

const GLOBAL_TRENDING = [
  { id: 1, name: "FACEBOOK", color: "#3b82f6", icon: "💬", count: 0 },
  { id: 2, name: "WHATSAPP", color: "#22c55e", icon: "🟢", count: 0 },
  { id: 3, name: "TELEGRAM", color: "#38bdf8", icon: "✈️", count: 0 },
  { id: 4, name: "INSTAGRAM", color: "#e1306c", icon: "📷", count: 0 },
  { id: 5, name: "IMO", color: "#94a3b8", icon: "🛡️", count: 0 },
  { id: 6, name: "AUTHMSG", color: "#a855f7", icon: "🔐", count: 0 },
  { id: 7, name: "CLOUDOTP", color: "#ec4899", icon: "☁️", count: 0 },
  { id: 8, name: "DISCORD", color: "#6366f1", icon: "🎮", count: 0 },
  { id: 9, name: "BIGO", color: "#38bdf8", icon: "📹", count: 0 },
  { id: 10, name: "FAIRPARI", color: "#f59e0b", icon: "🎲", count: 0 },
];

function detectServiceAndColor(rawMessage: string, sidFallback?: string) {
  const msgUpper = (rawMessage || "").toUpperCase();

  if (
    msgUpper.includes("INSTAGRAM") ||
    msgUpper.includes("INSTA") ||
    msgUpper.includes("#IG") ||
    msgUpper.includes("IG-")
  ) {
    return {
      service: "INSTAGRAM",
      color: "bg-pink-950/80 text-pink-400 border-pink-500/30",
    };
  }
  if (
    msgUpper.includes("WHATSAPP") ||
    msgUpper.includes("WA-") ||
    msgUpper.includes("WHATSAPP CODE")
  ) {
    return {
      service: "WHATSAPP",
      color: "bg-emerald-950/80 text-emerald-400 border-emerald-500/30",
    };
  }
  if (
    msgUpper.includes("FACEBOOK") ||
    msgUpper.includes("FB-") ||
    msgUpper.includes("FACEBOOK CODE") ||
    msgUpper.includes("FB CODE")
  ) {
    return {
      service: "FACEBOOK",
      color: "bg-blue-950/80 text-blue-400 border-blue-500/30",
    };
  }
  if (msgUpper.includes("TELEGRAM") || msgUpper.includes("TG-")) {
    return {
      service: "TELEGRAM",
      color: "bg-sky-950/80 text-sky-400 border-sky-500/30",
    };
  }
  if (msgUpper.includes("IMO")) {
    return {
      service: "IMO",
      color: "bg-cyan-950/80 text-cyan-400 border-cyan-500/30",
    };
  }
  if (msgUpper.includes("DISCORD")) {
    return {
      service: "DISCORD",
      color: "bg-indigo-950/80 text-indigo-400 border-indigo-500/30",
    };
  }
  if (msgUpper.includes("TIKTOK")) {
    return {
      service: "TIKTOK",
      color: "bg-rose-950/80 text-rose-400 border-rose-500/30",
    };
  }
  if (msgUpper.includes("EBAY")) {
    return {
      service: "EBAY",
      color: "bg-yellow-950/80 text-yellow-400 border-yellow-500/30",
    };
  }
  if (msgUpper.includes("LINKEDIN")) {
    return {
      service: "LINKEDIN",
      color: "bg-blue-950/80 text-blue-400 border-blue-500/30",
    };
  }
  if (msgUpper.includes("TWITTER") || msgUpper.includes("X.COM")) {
    return {
      service: "TWITTER",
      color: "bg-sky-950/80 text-sky-400 border-sky-500/30",
    };
  }
  if (msgUpper.includes("GOOGLE") || msgUpper.includes("G-")) {
    return {
      service: "GOOGLE",
      color: "bg-amber-950/80 text-amber-400 border-amber-500/30",
    };
  }
  if (msgUpper.includes("NETFLIX")) {
    return {
      service: "NETFLIX",
      color: "bg-red-950/80 text-red-400 border-red-500/30",
    };
  }
  if (msgUpper.includes("CLOUDOTP")) {
    return {
      service: "CLOUDOTP",
      color: "bg-purple-950/80 text-purple-400 border-purple-500/30",
    };
  }
  if (msgUpper.includes("BIGO")) {
    return {
      service: "BIGO",
      color: "bg-teal-950/80 text-teal-400 border-teal-500/30",
    };
  }

  // Fallback to CLI / API sid if no keyword found in message body
  const sidUpper = (sidFallback || "").trim().toUpperCase();
  if (sidUpper && sidUpper !== "SERVICE" && sidUpper !== "UNKNOWN" && sidUpper !== "SMS OTP") {
    let color = "bg-blue-950/80 text-blue-400 border-blue-500/30";
    if (sidUpper.includes("WHATSAPP")) color = "bg-emerald-950/80 text-emerald-400 border-emerald-500/30";
    else if (sidUpper.includes("INSTAGRAM") || sidUpper.includes("INSTA")) color = "bg-pink-950/80 text-pink-400 border-pink-500/30";
    else if (sidUpper.includes("TELEGRAM")) color = "bg-sky-950/80 text-sky-400 border-sky-500/30";
    else if (sidUpper.includes("IMO")) color = "bg-cyan-950/80 text-cyan-400 border-cyan-500/30";
    else if (sidUpper.includes("FACEBOOK")) color = "bg-blue-950/80 text-blue-400 border-blue-500/30";
    else if (sidUpper.includes("GOOGLE")) color = "bg-amber-950/80 text-amber-400 border-amber-500/30";
    else if (sidUpper.includes("DISCORD")) color = "bg-indigo-950/80 text-indigo-400 border-indigo-500/30";
    else if (sidUpper.includes("CLOUDOTP")) color = "bg-purple-950/80 text-purple-400 border-purple-500/30";

    return { service: sidUpper, color };
  }

  return {
    service: "SMS OTP",
    color: "bg-purple-950/80 text-purple-400 border-purple-500/30",
  };
}

const MOCK_LIVE_MESSAGES: SmsMessage[] = [];

const INITIAL_FEEDS: FeedNumber[] = [
  {
    id: "feed-1",
    number: "261349315165",
    status: "FAILED",
    country: "MADAGASCAR",
    operator: "AIRTEL",
    timeAgo: "35 min ago",
    service: "FACEBOOK",
  },
  {
    id: "feed-2",
    number: "261349315542",
    status: "FAILED",
    country: "MADAGASCAR",
    operator: "AIRTEL",
    timeAgo: "35 min ago",
    service: "WHATSAPP",
  },
  {
    id: "feed-3",
    number: "261349315224",
    status: "FAILED",
    country: "MADAGASCAR",
    operator: "AIRTEL",
    timeAgo: "35 min ago",
    service: "TELEGRAM",
  },
  {
    id: "feed-4",
    number: "447384561029",
    status: "SUCCESS",
    country: "UNITED KINGDOM",
    operator: "VODAFONE",
    timeAgo: "2 min ago",
    service: "INSTAGRAM",
  },
];

interface ZenexSmsConsoleProps {
  domainName: string;
  userEmail?: string;
}

export const ZenexSmsConsole: React.FC<ZenexSmsConsoleProps> = ({ domainName, userEmail }) => {
  const accountKey = userEmail ? userEmail.toLowerCase().trim() : "guest";
  const feedKey = `orabit_feed_numbers_${accountKey}`;

  const { userProfile, setUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<"dashboard" | "console" | "getnum" | "api">("dashboard");
  const [messages, setMessages] = useState<SmsMessage[]>(MOCK_LIVE_MESSAGES);
  const [all24hHits, setAll24hHits] = useState<SmsMessage[]>(() => {
    try {
      const bdStart = getBD4AMWindowStart();
      const saved = safeLocalStorageGet("orabit_24h_all_hits_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.windowStart === bdStart && Array.isArray(parsed.hits) && parsed.hits.length > 0) {
          return parsed.hits;
        }
      }
    } catch (e) {
      // Silent catch
    }
    return MOCK_LIVE_MESSAGES;
  });

  useEffect(() => {
    try {
      const bdStart = getBD4AMWindowStart();
      const trimmedHits = Array.isArray(all24hHits) ? all24hHits.slice(0, 100) : [];
      const payload = JSON.stringify({ windowStart: bdStart, hits: trimmedHits });
      safeLocalStorageSet("orabit_24h_all_hits_v1", payload);
    } catch (e) {
      // Silent catch
    }
  }, [all24hHits]);

  const getServiceRateBDT = (serviceName: string): number => {
    const norm = (serviceName || "").toUpperCase().trim();
    if (
      norm.includes("WHATSAPP") ||
      norm === "WA" ||
      norm.includes("TELEGRAM") ||
      norm === "TG"
    ) {
      return 0;
    }
    return 0.60; // 60 poisha = ৳0.60 BDT
  };

  const [feedNumbers, setFeedNumbers] = useState<FeedNumber[]>([]);
  const [feedCurrentPage, setFeedCurrentPage] = useState<number>(1);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState<boolean>(false);

  const refreshConsoleFeed = async (silent = false) => {
    if (!userEmail) return;
    if (!silent) setIsRefreshingFeed(true);
    try {
      const feeds = await fetchUserFeedNumbersFromSupabase(userEmail);
      if (Array.isArray(feeds)) {
        setFeedNumbers(feeds);
      }
    } catch (e) {
      console.error("Failed to fetch user feed in console:", e);
    } finally {
      if (!silent) setIsRefreshingFeed(false);
    }
  };

  // Re-sync when userEmail changes and auto-poll DB
  useEffect(() => {
    if (!userEmail) {
      setFeedNumbers([]);
      return;
    }

    refreshConsoleFeed(false);

    const syncInterval = setInterval(() => {
      refreshConsoleFeed(true);
    }, 8000);

    return () => clearInterval(syncInterval);
  }, [userEmail]);

  const userSuccessMessages = React.useMemo(() => {
    return feedNumbers.filter((f) => f.status === "SUCCESS");
  }, [feedNumbers]);

  const todayRevenueBDT = React.useMemo(() => {
    if (userProfile?.balance !== undefined) {
      return userProfile.balance;
    }
    return userSuccessMessages.reduce((sum, msg) => sum + getServiceRateBDT(msg.service), 0);
  }, [userProfile?.balance, userSuccessMessages]);

  const todayOtpsCount = React.useMemo(() => {
    if (userProfile?.totalSuccess !== undefined) {
      return Math.max(userProfile.totalSuccess, userSuccessMessages.length);
    }
    return userSuccessMessages.length;
  }, [userProfile?.totalSuccess, userSuccessMessages.length]);

  useEffect(() => {
    try {
      if (feedKey && Array.isArray(feedNumbers)) {
        safeLocalStorageSet(feedKey, JSON.stringify(feedNumbers.slice(0, 50)));
      }
    } catch (e) {
      // Silent catch
    }
  }, [feedNumbers, feedKey]);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState<"ALL" | "SUCCESS" | "PENDING" | "FAILED">("ALL");
  const [autoSyncSeconds, setAutoSyncSeconds] = useState(2);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Target Range Form State
  const [targetRange, setTargetRange] = useState<string>(() => {
    try {
      return localStorage.getItem("orabit_last_target_range") || "";
    } catch (e) {
      return "";
    }
  });
  const [isNational, setIsNational] = useState(false);
  const [noPlus, setNoPlus] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (targetRange) {
        localStorage.setItem("orabit_last_target_range", targetRange);
      }
    } catch (e) {
      console.error("Failed to save targetRange:", e);
    }
  }, [targetRange]);

  // API Tester state
  const [apiKey, setApiKey] = useState("ZX_DEMO_KEY_8923741");
  const [apiResponse, setApiResponse] = useState<any>(null);

  // UTC clock ticker
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toISOString().substring(11, 19) + " UTC+0";
      setUtcTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stex SMS Real-Time Traffic & Console Listener (100% REAL TRAFFIC ONLY)
  useEffect(() => {
    const activeKey = apiKey || DEFAULT_STEX_API_KEY;

    const pollConsoleAndOtps = async () => {
      try {
        // 1. Fetch Real Console Hits
        const consoleRes = await fetchStexConsole(activeKey);
        if (consoleRes.meta && consoleRes.meta.code === 200 && consoleRes.data && consoleRes.data.hits) {
          const hits = consoleRes.data.hits;
          const liveConsoleMsgs: SmsMessage[] = hits.map((h, idx) => {
            const formattedTime = new Date(Number(h.time) || Date.now()).toLocaleTimeString("en-US", { hour12: true });
            const extracted = extractOtpFromMessage(h.message);
            const { service: detectedService, color: serviceColor } = detectServiceAndColor(h.message, h.sid);

            const locInfo = getCountryAndOperatorFromRange(h.range);

            let displayRange = h.range || "";
            if (!displayRange.includes("X") && !displayRange.includes("x")) {
              displayRange = displayRange + "XXX";
            }

            return {
              id: `hit-${h.range}-${h.time}-${idx}`,
              timestamp: Number(h.time) || Date.now(),
              time: formattedTime,
              operator: locInfo.operator,
              country: locInfo.country,
              countryIso: locInfo.iso,
              service: detectedService,
              serviceColor,
              number: displayRange,
              otpCode: extracted,
              rawMessage: maskMessageOtp(h.message),
            };
          });

          setMessages((prevMsgs) => {
            const bdStart = getBD4AMWindowStart();
            const existingIds = new Set(prevMsgs.map((m) => m.id));
            const fresh = liveConsoleMsgs.filter((m) => !existingIds.has(m.id));
            const base = fresh.length > 0 ? [...fresh, ...prevMsgs] : (prevMsgs.length === 0 ? liveConsoleMsgs : prevMsgs);
            return base
              .filter((m) => {
                const t = m.timestamp;
                if (t && t < bdStart) return false;
                return true;
              })
              .slice(0, 300);
          });

          setAll24hHits((prevHits) => {
            const bdStart = getBD4AMWindowStart();
            const existingIds = new Set(prevHits.map((m) => m.id));
            const fresh = liveConsoleMsgs.filter((m) => !existingIds.has(m.id));
            const base = fresh.length > 0 ? [...fresh, ...prevHits] : (prevHits.length === 0 ? liveConsoleMsgs : prevHits);
            return base.filter((m) => {
              const t = m.timestamp;
              if (t && t < bdStart) return false;
              return true;
            });
          });
        }

        // 2. Fetch User OTPs for requested numbers & enforce 15-min expiration
        let fetchedOtps: any[] = [];
        try {
          const otpRes = await fetchStexOtps(activeKey);
          if (otpRes.meta && otpRes.meta.code === 200 && otpRes.data && otpRes.data.otps) {
            fetchedOtps = otpRes.data.otps;
          }
        } catch (e) {
          console.error("Error fetching OTPs in console:", e);
        }

        setFeedNumbers((prevFeed) => {
          const now = Date.now();
          let updated = false;

          const newFeed = prevFeed.map((item) => {
            const isAlreadySuccess = item.status === "SUCCESS" || item.status === "MULTI SUCCESS";

            // Find all matching OTPs for this number in fetchedOtps
            const iNum = (item.number || "").replace(/\D/g, "");
            const matchingOtps = fetchedOtps.filter((o) => {
              if (!o || !o.number) return false;
              const oNum = o.number.replace(/\D/g, "");
              return oNum === iNum || oNum.endsWith(iNum) || iNum.endsWith(oNum);
            });

            if (matchingOtps.length > 0) {
              const existingRaw = item.rawMessage || "";
              const existingMessages = item.messages || [];

              // Filter to unrecorded OTP messages
              const unrecordedOtps = matchingOtps.filter((o) => {
                if (!o.message) return false;
                const existsInRaw = existingRaw.includes(o.message);
                const existsInMsgs = existingMessages.some((m) => m.raw === o.message);
                return !existsInRaw && !existsInMsgs;
              });

              if (unrecordedOtps.length > 0) {
                updated = true;
                let currentMessages = [...existingMessages];

                unrecordedOtps.forEach((newOtp) => {
                  const code = extractOtpFromMessage(newOtp.message);
                  currentMessages.unshift({
                    code: code || undefined,
                    raw: newOtp.message,
                    timestamp: now,
                  });

                  // Billing security: credit balance + 1 totalSuccess for each NEW message received
                  const { service: autoDetected } = detectServiceAndColor(newOtp.message, newOtp.service || item.service);
                  const finalService = (autoDetected && autoDetected !== "SMS OTP" && autoDetected !== "OTHER")
                    ? autoDetected
                    : (item.service && item.service !== "SMS OTP" ? item.service : "INSTAGRAM");

                  const earnedRate = getServiceRateBDT(finalService);
                  if (userEmail) {
                    incrementUserSuccessAndBalanceInSupabase(userEmail, earnedRate).then((res) => {
                      if (res) {
                        setUserProfile((prev) => (prev ? { ...prev, balance: res.newBalance, totalSuccess: res.newTotalSuccess } : null));
                      }
                    });
                  }
                });

                const latestOtp = unrecordedOtps[0];
                const { service: autoDetected } = detectServiceAndColor(latestOtp.message, latestOtp.service || item.service);
                const finalService = (autoDetected && autoDetected !== "SMS OTP" && autoDetected !== "OTHER")
                  ? autoDetected
                  : (item.service && item.service !== "SMS OTP" ? item.service : "INSTAGRAM");

                const finalStatus = currentMessages.length > 1 ? ("MULTI SUCCESS" as const) : ("SUCCESS" as const);
                const combinedRaw = currentMessages.map((m) => m.raw).join("\n---\n");
                const combinedCodes = currentMessages.map((m) => m.code).filter(Boolean).join(", ");

                const reqTimestamp = item.requestedAt || (item.id.startsWith("feed-") ? Number(item.id.replace("feed-", "")) : null);
                const elapsedMins = reqTimestamp ? Math.floor((now - reqTimestamp) / 60000) : 0;
                const timeAgoStr = elapsedMins < 1 ? "Just now" : `${elapsedMins}m ago`;

                return {
                  ...item,
                  service: finalService,
                  status: finalStatus,
                  otpCode: combinedCodes || item.otpCode,
                  rawMessage: combinedRaw || item.rawMessage,
                  messages: currentMessages,
                  timeAgo: timeAgoStr,
                };
              }
            }

            // Auto-heal existing items where rawMessage has keyword like Instagram but service was "SMS OTP"
            if (item.rawMessage && (item.service === "SMS OTP" || !item.service || item.service === "OTHER")) {
              const { service: autoDetected } = detectServiceAndColor(item.rawMessage);
              if (autoDetected && autoDetected !== "SMS OTP" && autoDetected !== "OTHER") {
                updated = true;
                return {
                  ...item,
                  service: autoDetected,
                };
              }
            }

            // Update dynamic timeAgo for all statuses based on requestedAt / timestamp
            const reqTimestamp = item.requestedAt || (item.id.startsWith("feed-") ? Number(item.id.replace("feed-", "")) : null);
            if (reqTimestamp) {
              const elapsedMs = now - reqTimestamp;

              // STRICT STATE LOCK: SUCCESS / MULTI SUCCESS items are IMMUTABLE. Never downgrade to FAILED!
              if (isAlreadySuccess) {
                const timeAgoStr = formatTimeAgo(reqTimestamp, item.timeAgo);
                if (item.timeAgo !== timeAgoStr) {
                  updated = true;
                  return { ...item, timeAgo: timeAgoStr };
                }
              } else if (item.status === "FAILED") {
                const timeAgoStr = formatTimeAgo(reqTimestamp, item.timeAgo);
                if (item.timeAgo !== timeAgoStr) {
                  updated = true;
                  return { ...item, timeAgo: timeAgoStr };
                }
              } else if (item.status === "PENDING") {
                if (elapsedMs >= 15 * 60 * 1000) {
                  updated = true;
                  return {
                    ...item,
                    status: "FAILED" as const,
                    timeAgo: formatTimeAgo(reqTimestamp),
                    rawMessage: "No SMS received within 15 minutes",
                  };
                } else {
                  const timeAgoStr = formatTimeAgo(reqTimestamp, item.timeAgo);
                  if (item.timeAgo !== timeAgoStr) {
                    updated = true;
                    return { ...item, timeAgo: timeAgoStr };
                  }
                }
              }
            }

            return item;
          });

          if (updated && userEmail) {
            bulkSyncFeedNumbersToSupabase(userEmail, newFeed);
          }

          return updated ? newFeed : prevFeed;
        });
      } catch (err) {
        console.error("ZenexSmsConsole polling error:", err);
      }
    };

    pollConsoleAndOtps();
    const interval = setInterval(pollConsoleAndOtps, 5000);

    const countdownTimer = setInterval(() => {
      setAutoSyncSeconds((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(countdownTimer);
    };
  }, [apiKey]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const handleGetNumber = async () => {
    if (provisioning) return;

    const cleanInput = targetRange.trim().replace(/X/gi, "");
    if (!cleanInput) {
      setProvisionMsg("❌ Please enter or select a number range first.");
      return;
    }

    setProvisioning(true);
    setProvisionMsg("Connecting to ORABIT Core Routing Engine...");

    try {
      const result = await requestStexNumber({ query: cleanInput, apiKey: DEFAULT_STEX_API_KEY });

      if (result.meta && result.meta.code === 200 && result.data) {
        const d = result.data;
        const rawNoPlus = d.no_plus_number || (d.full_number ? d.full_number.replace(/\+/g, "") : cleanInput);
        const rawNational = d.national_number || rawNoPlus;
        const rawFull = d.full_number || `+${rawNoPlus}`;

        let finalFormattedNumber = rawFull;
        if (noPlus) {
          finalFormattedNumber = rawNoPlus;
        } else if (isNational) {
          finalFormattedNumber = rawNational;
        }

        const nowTs = Date.now();
        const newFeedItem: FeedNumber = {
          id: "feed-" + nowTs,
          number: rawNoPlus,
          status: "PENDING",
          country: d.country || "MADAGASCAR",
          operator: d.operator || "AIRTEL",
          timeAgo: "Just now (15m left)",
          service: "SMS OTP",
          requestedAt: nowTs,
        };

        setFeedNumbers((prev) => [newFeedItem, ...prev]);
        setFeedCurrentPage(1);
        if (userEmail) {
          saveFeedNumberToSupabase(userEmail, newFeedItem);
        }
        setProvisionMsg(`✓ Successfully Provisioned: ${finalFormattedNumber}`);
        setTimeout(() => setProvisionMsg(null), 4000);

        try {
          await navigator.clipboard.writeText(finalFormattedNumber);
          setCopiedText(`Copied ${finalFormattedNumber}`);
          setTimeout(() => setCopiedText(null), 3000);
        } catch (e) {
          console.error("Auto copy error:", e);
        }
      } else {
        const errMsg = result.message || "No numbers available in this range. Try a different range.";
        setProvisionMsg(`❌ ${errMsg}`);
        setTimeout(() => setProvisionMsg(null), 5000);
      }
    } catch (err: any) {
      console.error("ZenexSmsConsole handleGetNumber error:", err);
      setProvisionMsg("❌ API Connection Error.");
      setTimeout(() => setProvisionMsg(null), 5000);
    } finally {
      setProvisioning(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.number.toLowerCase().includes(q) ||
      m.service.toLowerCase().includes(q) ||
      m.rawMessage.toLowerCase().includes(q) ||
      m.country.toLowerCase().includes(q)
    );
  });

  // Range Service Detection helper
  const rangeServiceAnalysis = React.useMemo(() => {
    const cleanRange = targetRange.trim().replace(/X/gi, "").replace(/[^0-9]/g, "");
    if (!cleanRange) return null;

    const matched = messages.filter((m) => {
      const mNumDigits = (m.number || "").replace(/X/gi, "").replace(/[^0-9]/g, "");
      if (!mNumDigits) return false;
      return mNumDigits.startsWith(cleanRange) || cleanRange.startsWith(mNumDigits) || mNumDigits.includes(cleanRange);
    });

    const counts: Record<string, { count: number; color: string }> = {};
    matched.forEach((m) => {
      const sName = (m.service || "SMS OTP").toUpperCase();
      if (!counts[sName]) {
        counts[sName] = { count: 0, color: m.serviceColor || "#10b981" };
      }
      counts[sName].count += 1;
    });

    const sortedServices = Object.entries(counts).sort((a, b) => b[1].count - a[1].count);

    return {
      cleanRange,
      totalMatched: matched.length,
      services: sortedServices,
    };
  }, [targetRange, messages]);

  const filteredFeed = feedNumbers.filter((f) => {
    if (feedFilter === "ALL") return true;
    if (feedFilter === "SUCCESS") return f.status === "SUCCESS" || f.status === "MULTI SUCCESS";
    return f.status === feedFilter;
  });

  const feedItemsPerPage = 20;
  const totalFeedItems = filteredFeed.length;
  const totalFeedPages = Math.max(1, Math.ceil(totalFeedItems / feedItemsPerPage));
  const safeFeedPage = Math.min(feedCurrentPage, totalFeedPages);
  const feedStartIndex = (safeFeedPage - 1) * feedItemsPerPage;
  const feedEndIndex = Math.min(feedStartIndex + feedItemsPerPage, totalFeedItems);
  const paginatedFeed = filteredFeed.slice(feedStartIndex, feedEndIndex);

  // Personal top performers for logged-in user on Dashboard
  const userTopPerformers = React.useMemo(() => {
    if (!userSuccessMessages || userSuccessMessages.length === 0) {
      return [];
    }
    const counts: Record<string, number> = {};
    userSuccessMessages.forEach((m) => {
      const s = (m.service || "OTHER").toUpperCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    const total = userSuccessMessages.length;
    const colors = ["#3b82f6", "#a855f7", "#eab308", "#10b981", "#ec4899", "#38bdf8"];
    const list = Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percent: Math.round((count / total) * 100) + "%",
      color: colors[idx % colors.length],
    }));
    return list.sort((a, b) => b.count - a.count);
  }, [userSuccessMessages]);

  // Global Console Top Apps Distribution calculated from the last 300 messages across all users/API
  const appStats = React.useMemo(() => {
    if (!messages || messages.length === 0) {
      return [];
    }
    const counts: Record<string, number> = {};
    messages.forEach((m) => {
      const s = (m.service || "OTHER").toUpperCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    const total = messages.length;
    const colorMap: Record<string, string> = {
      FACEBOOK: "#3b82f6",
      WHATSAPP: "#eab308",
      INSTAGRAM: "#10b981",
      DISCORD: "#a855f7",
      BIGO: "#38bdf8",
      TELEGRAM: "#38bdf8",
      CLOUDOTP: "#ec4899",
    };
    const defaultColors = ["#3b82f6", "#a855f7", "#eab308", "#10b981", "#ec4899", "#38bdf8"];

    const list = Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percent: Math.round((count / total) * 100) + "%",
      color: colorMap[name] || defaultColors[idx % defaultColors.length],
    }));
    return list.sort((a, b) => b.count - a.count);
  }, [messages]);

  const DEFAULT_APP_STATS = React.useMemo(() => [
    { name: "FACEBOOK", count: 163, percent: "82%", color: "#3b82f6" },
    { name: "WHATSAPP", count: 17, percent: "9%", color: "#eab308" },
    { name: "INSTAGRAM", count: 11, percent: "6%", color: "#10b981" },
    { name: "DISCORD", count: 6, percent: "3%", color: "#a855f7" },
    { name: "BIGO", count: 1, percent: "1%", color: "#38bdf8" },
  ], []);

  const consoleAppStats = appStats.length > 0 ? appStats : DEFAULT_APP_STATS;

  const top10Trending = React.useMemo(() => {
    const bdStart = getBD4AMWindowStart();
    const serviceCounts: Record<string, number> = {};

    const processMessage = (msg: any) => {
      if (!msg) return;
      const msgTime = msg.timestamp || msg.requestedAt;
      if (msgTime) {
        const t = typeof msgTime === "number" ? msgTime : new Date(msgTime).getTime();
        if (!isNaN(t) && t < bdStart) return;
      }
      let s = (msg.service || msg.serviceName || "OTHER").trim();
      if (!s) return;
      s = s.toUpperCase();
      serviceCounts[s] = (serviceCounts[s] || 0) + 1;
    };

    const dataSource = all24hHits.length > 0 ? all24hHits : messages;
    if (dataSource && dataSource.length > 0) {
      dataSource.forEach(processMessage);
    }
    if (userSuccessMessages && userSuccessMessages.length > 0) {
      userSuccessMessages.forEach(processMessage);
    }

    if (Object.keys(serviceCounts).length === 0) {
      return GLOBAL_TRENDING.slice(0, 10);
    }

    const colorMap: Record<string, string> = {
      FACEBOOK: "#3b82f6",
      WHATSAPP: "#22c55e",
      TELEGRAM: "#38bdf8",
      INSTAGRAM: "#e1306c",
      IMO: "#94a3b8",
      AUTHMSG: "#a855f7",
      CLOUDOTP: "#ec4899",
      DISCORD: "#6366f1",
      BIGO: "#38bdf8",
      FAIRPARI: "#f59e0b",
      ALYMSCINTL: "#64748b",
    };

    const aggregatedList = Object.entries(serviceCounts)
      .map(([name, count]) => ({
        name,
        count,
        color: colorMap[name] || "#3b82f6",
      }))
      .sort((a, b) => b.count - a.count);

    const result: Array<{ id: number; name: string; color: string; count?: number }> = [];
    const usedNames = new Set<string>();

    aggregatedList.forEach((item) => {
      if (!usedNames.has(item.name) && result.length < 10) {
        usedNames.add(item.name);
        result.push({
          id: result.length + 1,
          name: item.name,
          color: item.color,
          count: item.count,
        });
      }
    });

    if (result.length < 10) {
      GLOBAL_TRENDING.forEach((defItem) => {
        if (!usedNames.has(defItem.name) && result.length < 10) {
          usedNames.add(defItem.name);
          result.push({
            id: result.length + 1,
            name: defItem.name,
            color: defItem.color,
            count: defItem.count,
          });
        }
      });
    }

    return result;
  }, [all24hHits, messages, userSuccessMessages]);

  const carrierStats = React.useMemo(() => {
    if (!messages || messages.length === 0) {
      return [
        { name: "Airtel", count: 40, percent: "80%", color: "#10b981" },
        { name: "Zain", count: 4, percent: "8%", color: "#3b82f6" },
        { name: "Orange (Airtel)", count: 2, percent: "4%", color: "#a855f7" },
        { name: "Togo Cellulaire (Togocel)", count: 2, percent: "4%", color: "#eab308" },
        { name: "Mobile", count: 1, percent: "2%", color: "#ef4444" },
      ];
    }
    const counts: Record<string, number> = {};
    messages.forEach((m) => {
      const op = m.operator || "Other";
      counts[op] = (counts[op] || 0) + 1;
    });
    const total = messages.length;
    const colors = ["#10b981", "#3b82f6", "#a855f7", "#eab308", "#ef4444", "#64748b"];
    const list = Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      percent: Math.round((count / total) * 100) + "%",
      color: colors[idx % colors.length],
    }));
    list.sort((a, b) => b.count - a.count);
    return list.length > 0 ? list : [
      { name: "Airtel", count: 40, percent: "80%", color: "#10b981" },
      { name: "Zain", count: 4, percent: "8%", color: "#3b82f6" },
      { name: "Orange (Airtel)", count: 2, percent: "4%", color: "#a855f7" },
      { name: "Togo Cellulaire (Togocel)", count: 2, percent: "4%", color: "#eab308" },
      { name: "Mobile", count: 1, percent: "2%", color: "#ef4444" },
    ];
  }, [messages]);

  return (
    <div className="w-full bg-[#0d1117] text-slate-100 font-sans min-h-screen p-3 md:p-6 border border-slate-800 rounded-2xl shadow-2xl flex flex-col space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-white tracking-tight">
                Welcome back, <span className="text-emerald-400">Sheikh!</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Here's what's happening with your <strong className="text-slate-200">{domainName}</strong> account today.
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter number or code..."
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs pl-9 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
            />
          </div>

          {/* UTC Clock */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{utcTime || "15:25:49 UTC+0"}</span>
          </div>

          {/* Balance Pill */}
          <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
            <span>৳1.50</span>
          </div>

          {/* Notification & User Avatar */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white border border-blue-400 shadow-md">
              AL
            </div>
          </div>
        </div>
      </div>

      {/* Main Announcement Banner (Matching Screenshot 3) */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200/90 text-xs space-y-2 relative overflow-hidden">
        <div className="flex items-start gap-2.5">
          <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h3 className="font-bold text-amber-300 text-sm">
              Welcome to ORABIT SMS – Official !
            </h3>
            <p className="leading-relaxed opacity-90">
              With Higher Number Availability, Fast OTP Delivery For Facebook, Instagram, WhatsApp, Telegram, And Many Other Services, Super-Fast Payouts Within 12–24 Hours.
            </p>
            <p className="leading-relaxed opacity-80 text-[11px]">
              OrabitSms Uses a Fixed Rate Of 1 USD = 100 BDT. Payments Are Accepted In USDT (BNB SMART CHAIN, Binance) Nased On Current Market Rates.
            </p>
            <div className="pt-1 flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
              <span>Join Our Official Telegram Channel For Live Updates:</span>
              <a
                href="https://t.me/OrabitSms"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white font-bold flex items-center gap-1"
              >
                @OrabitSms
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* STATS CARDS GRID (Matching Screenshot 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 relative">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>TODAY REVENUE</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${(todayRevenueBDT / 100).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">Earnings from successful OTPs</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 relative">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>TODAY OTPS</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {todayOtpsCount}
          </div>
          <div className="text-[11px] text-slate-500">Total successful verifications</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 relative">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold">
            <span>YESTERDAY REVENUE</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">$0.00</div>
          <div className="text-[11px] text-slate-500">Previous day performance</div>
        </div>
      </div>

      {/* DASHBOARD TAB CONTENT */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column 1 & 2: Traffic Chart & Performers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hourly Traffic Chart Box (Matching Screenshot 2) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base text-white">Hourly Traffic</h3>
                  <p className="text-xs text-slate-400">Live system message throughput timeline</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                  <span>Live</span>
                </div>
              </div>

              {/* Chart Visualizer */}
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={INITIAL_TRAFFIC_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                      itemStyle={{ color: "#34d399" }}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#trafficGradient)" dot={{ r: 4, fill: "#10b981" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Your Top Performers Table (Matching Screenshot 2) */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-white">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Your Top Performers</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 px-3">SERVICE</th>
                      <th className="py-2.5 px-3">VOLUME</th>
                      <th className="py-2.5 px-3 text-right">EARNINGS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {userTopPerformers && userTopPerformers.length > 0 ? (
                      userTopPerformers.slice(0, 5).map((item) => {
                        const rateBDT = getServiceRateBDT(item.name);
                        const earningsUsd = (item.count * rateBDT) / 100;
                        return (
                          <tr key={item.name} className="hover:bg-slate-800/40">
                            <td className="py-3 px-3 flex items-center gap-3">
                              <ServiceLogo name={item.name} size={32} className="w-8 h-8" />
                              <span className="font-bold text-slate-100 text-sm">{item.name}</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200 text-sm">{item.count}</td>
                            <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold text-sm">
                              ${earningsUsd.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-slate-500 font-mono text-xs">
                          No messages received yet today
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column 3: Global Trending (Matching Screenshot 1) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-base text-white">Global Top Services</h3>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-mono font-medium">
                  ● Live
                </span>
              </div>

              <div className="space-y-2">
                {top10Trending.length > 0 ? (
                  top10Trending.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] font-mono font-bold flex items-center justify-center text-slate-300">
                          {item.id}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2.5">
                          <ServiceLogo name={item.name} className="w-7 h-7 sm:w-8 sm:h-8" />
                          <span>{item.name}</span>
                        </span>
                      </div>

                      {/* Mini Sparkline Graph representation */}
                      <div className="flex items-center gap-2">
                        <svg className="w-16 h-5" viewBox="0 0 60 20">
                          <path
                            d={`M 0 ${15 - (item.id % 4) * 3} Q 15 ${5 + (item.id % 3) * 3}, 30 ${10 - (item.id % 2) * 2} T 60 12`}
                            fill="none"
                            stroke={item.color}
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-mono text-slate-400 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-center">
                    No console messages received today yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE SMS TRAFFIC CONSOLE TAB (Matching Screenshots 1 & 2) */}
      {activeTab === "console" && (
        <div className="space-y-6">
          {/* Page Title & Subtitle Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-extrabold font-mono text-xl sm:text-2xl">&gt;_</span>
              <h1 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight">Live Console</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-sans">
              Streaming OTP messages with carrier and app distribution charts.
            </p>
          </div>

          {/* Top Apps Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-white">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <span>Top Apps Distribution</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Live Activity</span>
            </div>

            {/* Vertical Bar Chart */}
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consoleAppStats} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={9}
                    tickLine={false}
                    interval={0}
                    tick={{ fill: "#94a3b8", fontSize: 9 }}
                  />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "11px", color: "#fff" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {consoleAppStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Apps Legend List with Service Logos (1 item per line) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              {consoleAppStats.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between hover:border-slate-700/80 transition-all shadow-sm text-xs"
                >
                  <div className="flex items-center gap-2">
                    <ServiceLogo name={item.name} className="w-5 h-5 shrink-0" />
                    <span className="font-bold text-slate-200 text-xs tracking-wide uppercase">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-extrabold text-amber-400 text-xs">{item.count}</span>
                    <span className="text-slate-500 text-[10px] font-medium">({item.percent})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Console Stream Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
            {/* Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-extrabold font-mono text-sm sm:text-base">&gt;_</span>
                <h2 className="font-bold text-xs sm:text-sm text-white font-mono">Realtime SMS Stream</h2>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>

            {/* Search Filter & Countdown Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter logs..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-[11px] font-mono text-white focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 text-[10px]">Next update:</span>
                <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                  <span>{autoSyncSeconds}s</span>
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-400" />
                </span>
              </div>
            </div>

            {/* SMS Stream Cards with Service Logo and Compact Fine Typography */}
            <div className="space-y-2">
              {filteredMessages.slice(0, 50).map((msg, idx) => {
                let displayMsg = msg.rawMessage || "";
                if (!displayMsg.includes("***") && !displayMsg.includes("*****")) {
                  displayMsg = displayMsg.replace(/\b\d{4,8}\b/g, "*****");
                }
                const bodyContent = displayMsg.replace(/^(<#>|↳\s*<#>)\s*/, "");

                return (
                  <div
                    key={`${msg.id}-${idx}`}
                    className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 border-l-4 border-l-amber-400 hover:border-slate-700 transition-all space-y-1.5 shadow-sm"
                  >
                    {/* Top Row: Timestamp on left, Service Logo + Service Name & Carrier pill on right */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-mono text-[10px] text-slate-400">{msg.time}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1.5 bg-blue-950/80 border border-blue-500/40 px-1.5 py-0.5 rounded text-blue-400 font-bold text-[10px] uppercase tracking-wider">
                          <ServiceLogo name={msg.service} className="w-4 h-4 shrink-0" />
                          <span>{msg.service}</span>
                        </div>
                        <span className="inline-block bg-slate-800/90 border border-slate-700/80 text-slate-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {msg.operator}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Country in Emerald :: Masked Phone Number + Copy Range Button */}
                    <div className="flex items-center justify-between gap-1.5 font-mono">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] uppercase tracking-wider bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          <Globe className="w-3 h-3 text-emerald-400" />
                          <span>{msg.country}</span>
                        </div>
                        <span className="text-slate-600 font-bold text-[10px] me-0.5">::</span>
                        <span className="text-slate-100 font-bold text-xs tracking-wider">{msg.number}</span>
                      </div>

                      <button
                        onClick={() => {
                          copyToClipboard(msg.number, `Copied range ${msg.number}! Set for Get Number.`);
                          setTargetRange(msg.number);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 hover:border-emerald-500/60 text-slate-300 hover:text-emerald-400 text-[10px] font-mono transition-all cursor-pointer shrink-0 ml-auto group"
                        title="Copy range and set for Get Number"
                      >
                        <Copy className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-[10px]">Copy Range</span>
                      </button>
                    </div>

                    {/* Bottom Row: Yellow Arrow ➜ SMS Message Payload */}
                    <div className="font-mono text-[10px] sm:text-[11px] text-slate-300 leading-snug flex items-start gap-1 pt-0.5">
                      <span className="text-amber-400 font-black text-[10px] shrink-0 select-none pt-0.5">➜</span>
                      <span className="break-all text-[10px] sm:text-[11px]">&lt;#&gt; {bodyContent}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800/60">
              <span>Last Updated: 10:51:35</span>
              <span>Logs: {Math.min(filteredMessages.length, 50)} (Max 50)</span>
            </div>
          </div>
        </div>
      )}

      {/* GET NUMBER & RANGE FEED TAB (Matching Screenshot 4) */}
      {activeTab === "getnum" && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">TOTAL</div>
              <div className="text-lg font-bold font-mono text-slate-100 mt-1">59</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-emerald-400 font-bold uppercase">SUCCESS</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">0</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-amber-400 font-bold uppercase">WAIT</div>
              <div className="text-lg font-bold font-mono text-amber-400 mt-1">0</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div className="text-[10px] text-rose-400 font-bold uppercase">FAILED</div>
              <div className="text-lg font-bold font-mono text-rose-400 mt-1">59</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center col-span-2 sm:col-span-1">
              <div className="text-[10px] text-blue-400 font-bold uppercase">SUCCESS RATE</div>
              <div className="text-lg font-bold font-mono text-blue-400 mt-1">0.0%</div>
            </div>
          </div>

          {/* Provision Number Form */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-200">TARGET RANGE / CODE PROVISIONING</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  TARGET RANGE / CODE
                </label>
                <input
                  type="text"
                  value={targetRange}
                  onChange={(e) => setTargetRange(e.target.value)}
                  placeholder="e.g. 23276345XXX"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Console Range Service Inspection */}
              {rangeServiceAnalysis && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 animate-in fade-in duration-200">
                  {rangeServiceAnalysis.services.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {rangeServiceAnalysis.services.map(([sName, info]) => (
                        <div
                          key={sName}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono border flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
                          style={{
                            backgroundColor: `${info.color}15`,
                            borderColor: `${info.color}40`,
                            color: info.color,
                          }}
                        >
                          <ServiceLogo name={sName} className="w-4 h-4 shrink-0 rounded" />
                          <span className="tracking-wide text-white font-extrabold">{sName}</span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-slate-900 text-blue-400 border border-blue-500/30 shadow-inner">
                            {info.count} {info.count === 1 ? "Hit" : "Hits"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
                      ℹ️ No live console messages found for this range yet.
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-6 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNational}
                    onChange={(e) => setIsNational(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>National</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noPlus}
                    onChange={(e) => setNoPlus(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>No (+)</span>
                </label>
              </div>

              {provisionMsg && (
                <div className="p-3 bg-blue-950/80 border border-blue-500/40 text-blue-300 rounded-xl text-xs font-mono">
                  {provisionMsg}
                </div>
              )}

              <button
                onClick={handleGetNumber}
                disabled={provisioning}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <PhoneCall className={`w-4 h-4 ${provisioning ? "animate-spin" : ""}`} />
                <span>{provisioning ? "PROVISIONING..." : "📱 GET NUMBER"}</span>
              </button>
            </div>
          </div>

          {/* Feed List Box */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="font-bold text-sm text-white">FEED</h3>
                <button
                  onClick={() => refreshConsoleFeed(false)}
                  disabled={isRefreshingFeed}
                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50"
                  title="Refresh numbers from Supabase database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingFeed ? "animate-spin text-emerald-400" : ""}`} />
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                {(["ALL", "SUCCESS", "PENDING", "FAILED"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFeedFilter(st)}
                    className={`px-2.5 py-1 rounded ${
                      feedFilter === st
                        ? "bg-slate-800 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed Items */}
            <div className="space-y-2">
              {paginatedFeed.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="font-mono text-xs sm:text-sm font-bold text-white tracking-wide">
                      {item.number}
                    </div>
                    <div className="flex items-center gap-1">
                      <TimeAgoBadge
                        requestedAt={item.requestedAt || (item.id.startsWith("feed-") ? Number(item.id.replace("feed-", "")) : null)}
                        timeAgo={item.timeAgo}
                        status={item.status}
                      />
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          item.status === "FAILED"
                            ? "bg-rose-950 text-rose-400 border border-rose-800/60"
                            : item.status === "MULTI SUCCESS"
                            ? "bg-emerald-900 text-emerald-300 border border-emerald-400 font-extrabold animate-pulse"
                            : item.status === "SUCCESS"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                            : "bg-amber-950 text-amber-400 border border-amber-800/60"
                        }`}
                      >
                        {item.status}
                      </span>

                      {(item.status === "SUCCESS" || item.status === "MULTI SUCCESS") && (
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {(item.messages && item.messages.length > 0
                            ? item.messages
                            : [
                                {
                                  code: item.otpCode,
                                  raw: item.rawMessage || `<#> ${item.otpCode} is your verification code`,
                                  timestamp: Date.now(),
                                },
                              ]
                          ).map((msg, mIdx) => {
                            const codeStr = msg.code || extractOtpFromMessage(msg.raw) || item.otpCode;
                            if (!codeStr) return null;
                            return (
                              <button
                                key={mIdx}
                                onClick={() => {
                                  const msgToCopy = msg.raw || `<#> ${codeStr} is your verification code`;
                                  navigator.clipboard.writeText(msgToCopy);
                                }}
                                className="inline-flex items-center gap-1 bg-amber-950/80 border border-amber-500/50 hover:border-amber-400 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold text-[10px] transition-all cursor-pointer"
                                title={`Click to copy OTP message #${mIdx + 1}`}
                              >
                                <span>{codeStr}</span>
                                <Copy className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                      {item.country} • {item.operator}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalFeedItems > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-mono">
                <button
                  onClick={() => setFeedCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeFeedPage <= 1}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                >
                  Prev
                </button>
                <span className="text-slate-400 font-semibold">
                  Page <span className="text-emerald-400 font-bold">{safeFeedPage}</span> of{" "}
                  <span className="text-white font-bold">{totalFeedPages}</span>
                </span>
                <button
                  onClick={() => setFeedCurrentPage((p) => Math.min(totalFeedPages, p + 1))}
                  disabled={safeFeedPage >= totalFeedPages}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ORABITSMS API DOCUMENTATION TAB */}
      {activeTab === "api" && (
        <OrabitApiDoc apiKey={apiKey} />
      )}
    </div>
  );
};
