import React, { useState, useEffect, useMemo } from "react";
import {
  UserPlus,
  Plus,
  Eye,
  Wallet,
  Pencil,
  Trash2,
  X,
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Send,
  Mail,
  Lock,
  Trophy,
  Key,
  Zap,
  Coins,
  TrendingUp,
  BarChart,
  ShieldCheck,
  DollarSign,
  Minus,
  Activity,
  BadgeCheck,
  Clock,
} from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "../lib/supabase";
import { createAgentInSupabase, deleteAgentFromSupabase, setUserRoleInSupabase } from "../lib/userRoles";
import { saveUserProfileToSupabase, fetchAllProfilesFromSupabase, fetchUserProfileFromSupabase } from "../lib/userProfiles";
import { UserProfile } from "./OrabitAuthScreen";
import { FeedNumber } from "../types";
import { fetchDailyStatsFromSupabase } from "../lib/supabaseDailyStats";

interface AgentManagementProps {
  registeredUsers: UserProfile[];
  setRegisteredUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  feedNumbers: FeedNumber[];
  currency?: string;
  usdExchangeRate?: number;
  onUpdateUserBalance?: (userEmail: string, addAmount: number) => void;
}

export const AgentManagement: React.FC<AgentManagementProps> = ({
  registeredUsers,
  setRegisteredUsers,
  feedNumbers,
  currency = "USD",
  usdExchangeRate = 120,
  onUpdateUserBalance,
}) => {
  // Creation Form state
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentTelegram, setNewAgentTelegram] = useState("");
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentNotice, setAgentNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal 1: View Agent Details State
  const [viewingAgent, setViewingAgent] = useState<UserProfile | null>(null);
  const [viewStats, setViewStats] = useState<{
    currentBalance: number;
    lifetimeTotalBalance: number;
    totalUsers: number;
    todayUsers: number;
    lifetimeTotalOtp: number;
    todayOtp: number;
    usersActiveApi: number;
    isLoading: boolean;
  }>({
    currentBalance: 0,
    lifetimeTotalBalance: 0,
    totalUsers: 0,
    todayUsers: 0,
    lifetimeTotalOtp: 0,
    todayOtp: 0,
    usersActiveApi: 0,
    isLoading: false,
  });

  // Modal 2: Edit Agent Info State
  const [editingAgent, setEditingAgent] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editTelegram, setEditTelegram] = useState("");
  const [editIsOfficial, setEditIsOfficial] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Modal 3: Balance Management State
  const [balancingAgent, setBalancingAgent] = useState<UserProfile | null>(null);
  const [balAmount, setBalAmount] = useState<string>("10");
  const [isUpdatingBal, setIsUpdatingBal] = useState(false);

  // Filter Active System Agents
  const agentList = useMemo(() => {
    return registeredUsers.filter((u) => u.role?.toLowerCase() === "agent");
  }, [registeredUsers]);

  // Designated Permanent Official Agent
  const officialAgent = useMemo(() => {
    return agentList.find((u) => u.isOfficial) || agentList[0] || null;
  }, [agentList]);

  // Keep localStorage sync with official agent email for fallback lookup
  useEffect(() => {
    if (officialAgent && officialAgent.email) {
      localStorage.setItem("orabit_official_agent_email", officialAgent.email.toLowerCase().trim());
    }
  }, [officialAgent]);

  // Direct Source of Truth hydration on mount
  useEffect(() => {
    let isMounted = true;
    fetchAllProfilesFromSupabase()
      .then((fresh) => {
        if (isMounted && fresh && fresh.length > 0) {
          setRegisteredUsers(fresh);
        }
      })
      .catch((err) => console.warn("Failed to fetch fresh profiles in AgentManagement:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Designated Official Agent Handler
  const handleSetOfficialAgent = async (targetEmail: string) => {
    const cleanE = targetEmail.toLowerCase().trim();
    try {
      // 1. Update Supabase user_profiles
      await supabase.from("user_profiles").upsert(
        { email: cleanE, is_official: true, updated_at: new Date().toISOString() },
        { onConflict: "email" }
      );

      // Unmark other agents in Supabase
      const otherAgents = agentList.filter((a) => a.email.toLowerCase().trim() !== cleanE);
      for (const other of otherAgents) {
        await supabase
          .from("user_profiles")
          .update({ is_official: false })
          .ilike("email", other.email.toLowerCase().trim());
      }

      // 2. Update local state
      const updatedUsers = registeredUsers.map((u) => {
        if (u.role?.toLowerCase() === "agent") {
          return {
            ...u,
            isOfficial: u.email.toLowerCase().trim() === cleanE,
          };
        }
        return u;
      });

      localStorage.setItem("orabit_registered_users", JSON.stringify(updatedUsers));
      localStorage.setItem("orabit_official_agent_email", cleanE);
      setRegisteredUsers(updatedUsers);

      const targetAcc = registeredUsers.find((u) => u.email.toLowerCase().trim() === cleanE);
      const agName = targetAcc?.fullName || cleanE;

      setAgentNotice({
        text: `Agent (${agName}) is now set as Permanent Official Agent! All unreferred signups & orphan clients will fall back here.`,
        type: "success",
      });
    } catch (err: any) {
      console.error("Failed to set official agent:", err);
      setAgentNotice({ text: err.message || "Failed to set official agent", type: "error" });
    }
  };

  // Create New Agent Handler
  const handleCreateAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanE = newAgentEmail.trim().toLowerCase();
    const cleanName = newAgentName.trim() || `Agent (${cleanE.split("@")[0]})`;
    const rawTg = newAgentTelegram.trim();
    const cleanTg = rawTg ? (rawTg.startsWith("@") ? rawTg : `@${rawTg}`) : "";

    if (!cleanE || !newAgentPassword.trim()) {
      setAgentNotice({ text: "Please enter Email and Password for the Agent.", type: "error" });
      return;
    }

    setIsCreatingAgent(true);
    setAgentNotice(null);

    const res = await createAgentInSupabase(cleanE, newAgentPassword, cleanName, cleanTg);

    if (res.success) {
      try {
        const stored = localStorage.getItem("orabit_registered_users");
        let list: UserProfile[] = stored ? JSON.parse(stored) : [];
        const existingIdx = list.findIndex((u) => u.email.toLowerCase() === cleanE);
        const isFirstAgent = !list.some((u) => u.role?.toLowerCase() === "agent");

        const newAgentObj: UserProfile = {
          fullName: cleanName,
          mobileNumber: "01700000000",
          email: cleanE,
          telegram: cleanTg,
          city: "Dhaka",
          country: "Bangladesh",
          referralEmail: "orabitsms@gmail.com",
          withdrawPin: "",
          balance: 0.0,
          password: newAgentPassword,
          role: "Agent",
          isOfficial: isFirstAgent,
        };

        if (existingIdx >= 0) {
          list[existingIdx] = {
            ...list[existingIdx],
            fullName: cleanName,
            telegram: cleanTg,
            role: "Agent",
            password: newAgentPassword,
            isOfficial: isFirstAgent || list[existingIdx].isOfficial,
          };
        } else {
          list.push(newAgentObj);
        }

        if (isFirstAgent) {
          localStorage.setItem("orabit_official_agent_email", cleanE);
        }

        localStorage.setItem("orabit_registered_users", JSON.stringify(list));
        setRegisteredUsers(list);

        // Persist to Supabase Source of Truth
        const createdTarget = existingIdx >= 0 ? list[existingIdx] : newAgentObj;
        saveUserProfileToSupabase(createdTarget).catch((err) => console.warn("Supabase agent profile save notice:", err));
      } catch (err) {
        console.error("Local storage error on agent creation:", err);
      }

      setAgentNotice({ text: res.message, type: "success" });
      setNewAgentEmail("");
      setNewAgentPassword("");
      setNewAgentName("");
      setNewAgentTelegram("");
    } else {
      setAgentNotice({ text: res.message, type: "error" });
    }

    setIsCreatingAgent(false);
  };

  // Delete Agent Handler with Client Transfer to Official Agent
  const handleDeleteAgent = async (agentEmail: string) => {
    const cleanE = agentEmail.trim().toLowerCase();

    // Find designated Official Agent (excluding deleted agent)
    let fallbackAgentEmail = "";
    const otherOfficial = agentList.find((u) => u.isOfficial && u.email.toLowerCase().trim() !== cleanE);
    if (otherOfficial) {
      fallbackAgentEmail = otherOfficial.email.toLowerCase().trim();
    } else {
      const firstOther = agentList.find((u) => u.email.toLowerCase().trim() !== cleanE);
      if (firstOther) {
        fallbackAgentEmail = firstOther.email.toLowerCase().trim();
      } else {
        fallbackAgentEmail = "orabitsms@gmail.com";
      }
    }

    if (
      !window.confirm(
        `Are you sure you want to delete agent "${cleanE}"?\n\nAll referred clients will be automatically transferred to Official Agent (${fallbackAgentEmail}).`
      )
    ) {
      return;
    }

    // Identify affected clients
    const affectedClients = registeredUsers.filter((u) => {
      const r1 = (u.referralEmail || "").toLowerCase().trim();
      const r2 = (u.referredByAgentEmail || "").toLowerCase().trim();
      const r3 = (u.referredBy || "").toLowerCase().trim();
      return r1 === cleanE || r2 === cleanE || r3 === cleanE;
    });

    const transferredCount = affectedClients.length;

    // 1. Transfer clients in Supabase
    try {
      if (transferredCount > 0) {
        await supabase
          .from("user_profiles")
          .update({
            referral_email: fallbackAgentEmail,
            referred_by: fallbackAgentEmail,
            updated_at: new Date().toISOString(),
          })
          .ilike("referral_email", cleanE);
      }
    } catch (e) {
      console.warn("Notice transferring clients on agent delete:", e);
    }

    // 2. Delete agent from Supabase
    const res = await deleteAgentFromSupabase(cleanE);

    // 3. Update local storage & state
    try {
      const stored = localStorage.getItem("orabit_registered_users");
      let list: UserProfile[] = stored ? JSON.parse(stored) : registeredUsers;

      const updatedList = list
        .filter((u) => u.email.toLowerCase().trim() !== cleanE)
        .map((u) => {
          const r1 = (u.referralEmail || "").toLowerCase().trim();
          const r2 = (u.referredByAgentEmail || "").toLowerCase().trim();
          const r3 = (u.referredBy || "").toLowerCase().trim();
          if (r1 === cleanE || r2 === cleanE || r3 === cleanE) {
            return {
              ...u,
              referralEmail: fallbackAgentEmail,
              referredByAgentEmail: fallbackAgentEmail,
              referredBy: fallbackAgentEmail,
            };
          }
          return u;
        });

      localStorage.setItem("orabit_registered_users", JSON.stringify(updatedList));
      setRegisteredUsers(updatedList);
    } catch (err) {
      console.error("Local storage error on agent deletion:", err);
    }

    setAgentNotice({
      text: res.success
        ? `Agent (${cleanE}) deleted successfully. Transferred ${transferredCount} client(s) to Official Agent (${fallbackAgentEmail}).`
        : res.message,
      type: res.success ? "success" : "error",
    });
  };

  // Helper function to calculate referred clients for an agent with 100% table & modal sync
  const getReferredClientsForAgent = (
    agent: UserProfile,
    allUsers: UserProfile[],
    officialEmailStr: string
  ): UserProfile[] => {
    const agEmail = agent.email.toLowerCase().trim();
    const officialClean = (officialEmailStr || "").toLowerCase().trim();
    const isOfficialAg = Boolean(
      agent.isOfficial ||
      (officialClean && officialClean === agEmail) ||
      agEmail === "official@orabitsms.xyz" ||
      agEmail === "orabitsms@gmail.com"
    );

    const otherAgentsSet = new Set<string>();
    agentList.forEach((ag) => {
      const e = ag.email.toLowerCase().trim();
      const isAgOfficial =
        ag.isOfficial ||
        e === "official@orabitsms.xyz" ||
        e === "orabitsms@gmail.com" ||
        (officialClean && e === officialClean);
      if (!isAgOfficial) {
        otherAgentsSet.add(e);
        if ((ag as any).referralCode) otherAgentsSet.add((ag as any).referralCode.toLowerCase().trim());
      }
    });

    return allUsers.filter((u) => {
      const userRole = (u.role || "").toLowerCase().trim();
      if (userRole === "agent" || userRole === "owner") return false;

      const uRefEmail = (u.referralEmail || "").toLowerCase().trim();
      const uReferredBy = (u.referredBy || "").toLowerCase().trim();
      const uReferredByAgent = (u.referredByAgentEmail || "").toLowerCase().trim();
      const uAssignedAgent = ((u as any).assignedAgent || (u as any).assigned_agent || "").toLowerCase().trim();

      const assignedToThis =
        uRefEmail === agEmail ||
        uReferredBy === agEmail ||
        uReferredByAgent === agEmail ||
        uAssignedAgent === agEmail ||
        ((agent as any).referralCode &&
          (uRefEmail === (agent as any).referralCode.toLowerCase() ||
            uReferredBy === (agent as any).referralCode.toLowerCase()));

      if (assignedToThis) return true;

      if (isOfficialAg) {
        const isAssignedToOther =
          (uRefEmail && otherAgentsSet.has(uRefEmail)) ||
          (uReferredBy && otherAgentsSet.has(uReferredBy)) ||
          (uReferredByAgent && otherAgentsSet.has(uReferredByAgent)) ||
          (uAssignedAgent && otherAgentsSet.has(uAssignedAgent));

        return !isAssignedToOther;
      }

      return false;
    });
  };

  // Open View Modal Handler with Instant Clean State Init
  const handleOpenViewModal = (agent: UserProfile) => {
    const officialEmailStr = officialAgent?.email?.toLowerCase().trim() || "";
    const referredClients = getReferredClientsForAgent(agent, registeredUsers, officialEmailStr);

    setViewingAgent(agent);
    setViewStats({
      currentBalance: typeof agent.balance === "number" ? agent.balance : 0,
      lifetimeTotalBalance: typeof agent.balance === "number" ? agent.balance : 0,
      totalUsers: referredClients.length,
      todayUsers: 0,
      lifetimeTotalOtp: typeof agent.totalSuccess === "number" ? agent.totalSuccess : 0,
      todayOtp: 0,
      usersActiveApi: referredClients.filter((c) => Boolean(c.apiKey && c.apiKey.trim().length > 0)).length,
      isLoading: true,
    });
  };

  // Close View Modal Handler with Complete Reset
  const handleCloseViewModal = () => {
    setViewingAgent(null);
    setViewStats({
      currentBalance: 0,
      lifetimeTotalBalance: 0,
      totalUsers: 0,
      todayUsers: 0,
      lifetimeTotalOtp: 0,
      todayOtp: 0,
      usersActiveApi: 0,
      isLoading: false,
    });
  };

  // Load View Modal Details and Supabase Statistics
  useEffect(() => {
    if (!viewingAgent) return;

    let isMounted = true;
    const loadAgentStats = async () => {
      const agEmail = viewingAgent.email.toLowerCase().trim();
      const officialEmailStr = officialAgent?.email?.toLowerCase().trim() || "";

      // 1. Get referred clients strictly using unified logic
      const referredClients = getReferredClientsForAgent(
        viewingAgent,
        registeredUsers,
        officialEmailStr
      );
      const totalUsers = referredClients.length;

      // 2. Users Active API count
      const usersActiveApi = referredClients.filter(
        (c) => Boolean(c.apiKey && c.apiKey.trim().length > 0)
      ).length;

      // 3. Current balance from agent profile or Supabase
      let currentBal = typeof viewingAgent.balance === "number" ? viewingAgent.balance : 0;
      let agentProfileTotalSuccess = typeof viewingAgent.totalSuccess === "number" ? viewingAgent.totalSuccess : 0;

      try {
        const { data: dbProfile } = await supabase
          .from("user_profiles")
          .select("balance, total_success")
          .ilike("email", agEmail)
          .maybeSingle();

        if (dbProfile) {
          if (typeof dbProfile.balance === "number") currentBal = dbProfile.balance;
          if (typeof dbProfile.total_success === "number") agentProfileTotalSuccess = dbProfile.total_success;
        }
      } catch (e) {
        console.warn("View agent profile query notice:", e);
      }

      // 4. Calculate Lifetime OTPs strictly for clients of this specific agent
      const clientEmails = new Set<string>();
      clientEmails.add(agEmail);
      if (viewingAgent.referralEmail) clientEmails.add(viewingAgent.referralEmail.toLowerCase().trim());

      referredClients.forEach((c) => {
        if (c.email) clientEmails.add(c.email.toLowerCase().trim());
      });

      const isOfficialAg = Boolean(
        viewingAgent.isOfficial ||
        (officialEmailStr && officialEmailStr === agEmail) ||
        agEmail === "official@orabitsms.xyz" ||
        agEmail === "orabitsms@gmail.com"
      );

      const otherAgentEmails = new Set<string>();
      agentList.forEach((ag) => {
        const e = ag.email.toLowerCase().trim();
        const isAgOfficial =
          ag.isOfficial ||
          e === "official@orabitsms.xyz" ||
          e === "orabitsms@gmail.com" ||
          (officialEmailStr && e === officialEmailStr);
        if (!isAgOfficial) {
          otherAgentEmails.add(e);
          if ((ag as any).referralCode) otherAgentEmails.add((ag as any).referralCode.toLowerCase().trim());
        }
      });

      const isClientOfViewingAgent = (userEmail?: string | null) => {
        const clean = (userEmail || "").toLowerCase().trim();
        if (isOfficialAg) {
          if (!clean) return true;
          return !otherAgentEmails.has(clean);
        }
        return clean ? clientEmails.has(clean) : false;
      };

      // Helper for Bangladesh date string YYYY-MM-DD
      const nowMs = Date.now();
      const getBDDateString = (tsMs: number): string => {
        const d = new Date(tsMs + 6 * 60 * 60 * 1000);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };
      const todayStr = getBDDateString(nowMs);

      const helperGetDateStr = (dateInput: any): string => {
        if (!dateInput) return "";
        if (typeof dateInput === "number") {
          return getBDDateString(dateInput);
        }
        if (typeof dateInput === "string") {
          if (dateInput.includes("T") || dateInput.includes(" ") || dateInput.includes("-")) {
            const ts = new Date(dateInput).getTime();
            if (!isNaN(ts) && ts > 0) return getBDDateString(ts);
            return dateInput.split("T")[0].split(" ")[0];
          }
          return dateInput.substring(0, 10);
        }
        return "";
      };

      // Calculate Today Users for this agent
      let todayUsersCount = 0;
      const processedTodayEmails = new Set<string>();

      referredClients.forEach((u) => {
        const emailLower = (u.email || "").toLowerCase().trim();
        if (emailLower && !processedTodayEmails.has(emailLower)) {
          const rawDate = (u as any).created_at || (u as any).createdAt || (u as any).created_date || u.lastLogin;
          if (rawDate && helperGetDateStr(rawDate) === todayStr) {
            todayUsersCount++;
            processedTodayEmails.add(emailLower);
          }
        }
      });

      if (isOfficialAg) {
        try {
          const { data: dbProfiles } = await supabase
            .from("user_profiles")
            .select("email, role, referral_email, assigned_agent, referred_by, created_at, createdAt");

          if (dbProfiles && Array.isArray(dbProfiles)) {
            dbProfiles.forEach((u: any) => {
              const uRole = (u.role || "").toLowerCase().trim();
              if (uRole !== "agent" && uRole !== "owner" && u.email) {
                const em = u.email.toLowerCase().trim();
                if (isClientOfViewingAgent(em)) {
                  clientEmails.add(em);
                  if (!processedTodayEmails.has(em)) {
                    const rawDate = u.created_at || u.createdAt || u.created_date;
                    if (rawDate && helperGetDateStr(rawDate) === todayStr) {
                      todayUsersCount++;
                      processedTodayEmails.add(em);
                    }
                  }
                }
              }
            });
          }
        } catch (e) {
          console.warn("Notice querying DB user_profiles for official agent view:", e);
        }
      }

      // Collect local feeds from localStorage keys
      const allLocalFeeds: FeedNumber[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("orabit_feed_numbers") || key.includes("feed_numbers"))) {
            const item = localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item);
              if (Array.isArray(parsed)) {
                allLocalFeeds.push(...parsed);
              }
            }
          }
        }
      } catch (e) {}

      if (feedNumbers && feedNumbers.length > 0) {
        allLocalFeeds.push(...feedNumbers);
      }

      let feedOtpsCount = 0;
      let todayFeedOtpsCount = 0;
      const seenFeedKeys = new Set<string>();

      allLocalFeeds.forEach((f) => {
        const fKey = f.id || `${f.number}_${f.requestedAt}_${f.status}`;
        if (seenFeedKeys.has(fKey)) return;
        seenFeedKeys.add(fKey);

        const fEmail = f.userEmail || f.email || "";
        if (isClientOfViewingAgent(fEmail)) {
          const isSuccess = f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || (f.status as string) === "success";
          const isFail = f.rawMessage ? f.rawMessage.toLowerCase().includes("no sms received") : false;
          if (isSuccess && !isFail) {
            const validMsgs = f.messages ? f.messages.filter((m) => m.code || (m.raw && !m.raw.toLowerCase().includes("no sms received"))) : [];
            const msgCount = validMsgs.length > 0 ? validMsgs.length : 1;
            feedOtpsCount += msgCount;

            const fDate = getBDDateString(f.requestedAt || Date.now());
            if (fDate === todayStr) {
              todayFeedOtpsCount += msgCount;
            }
          }
        }
      });

      // Query Supabase daily_stats for agent clients
      let dbOtpsCount = 0;
      let dbRevCount = 0;
      let todayDbOtpsCount = 0;
      try {
        const { data: dbStats } = await supabase
          .from("daily_stats")
          .select("date, total_otps, total_revenue, user_email");

        if (dbStats && Array.isArray(dbStats)) {
          dbStats.forEach((st: any) => {
            if (isClientOfViewingAgent(st.user_email)) {
              dbOtpsCount += Number(st.total_otps || 0);
              dbRevCount += Number(st.total_revenue || 0);

              const stDate = helperGetDateStr(st.date);
              if (stDate === todayStr) {
                todayDbOtpsCount += Number(st.total_otps || 0);
              }
            }
          });
        }
      } catch (e) {
        console.warn("Notice fetching dbStats for agent clients:", e);
      }

      // Query Supabase user_feed_numbers
      let supabaseUserFeedCount = 0;
      let todaySupabaseUserFeedCount = 0;
      try {
        const { data: userFeeds } = await supabase
          .from("user_feed_numbers")
          .select("user_email, status, requested_at, created_at")
          .in("status", ["SUCCESS", "MULTI SUCCESS", "success"]);

        if (userFeeds && Array.isArray(userFeeds)) {
          userFeeds.forEach((uf: any) => {
            if (isClientOfViewingAgent(uf.user_email)) {
              supabaseUserFeedCount++;
              const ufDate = helperGetDateStr(uf.requested_at || uf.created_at);
              if (ufDate === todayStr) {
                todaySupabaseUserFeedCount++;
              }
            }
          });
        }
      } catch (e) {}

      // Query Supabase otp_logs
      let otpLogsCount = 0;
      let todayOtpLogsCount = 0;
      try {
        const { data: logsData } = await supabase
          .from("otp_logs")
          .select("user_email, status, created_at")
          .ilike("status", "%success%");

        if (logsData && Array.isArray(logsData)) {
          logsData.forEach((lg: any) => {
            if (isClientOfViewingAgent(lg.user_email)) {
              otpLogsCount++;
              const lgDate = helperGetDateStr(lg.created_at);
              if (lgDate === todayStr) {
                todayOtpLogsCount++;
              }
            }
          });
        }
      } catch (e) {}

      // Client totalSuccess sums from local state
      let sumClientTotalSuccess = 0;
      registeredUsers.forEach((c) => {
        const uRole = (c.role || "").toLowerCase();
        if (uRole !== "agent" && uRole !== "owner") {
          if (isClientOfViewingAgent(c.email)) {
            if (typeof c.totalSuccess === "number" && c.totalSuccess > 0) {
              sumClientTotalSuccess += c.totalSuccess;
            }
          }
        }
      });

      // Query Supabase user_profiles
      let dbUserProfilesSuccessSum = 0;
      try {
        const { data: dbUsers } = await supabase
          .from("user_profiles")
          .select("total_success, role, email");

        if (dbUsers && Array.isArray(dbUsers)) {
          dbUsers.forEach((u) => {
            const uRole = (u.role || "").toLowerCase();
            if (uRole !== "agent" && uRole !== "owner") {
              if (isClientOfViewingAgent(u.email)) {
                dbUserProfilesSuccessSum += Number(u.total_success || 0);
              }
            }
          });
        }
      } catch (e) {}

      const finalOtps = Math.max(
        feedOtpsCount,
        dbOtpsCount,
        supabaseUserFeedCount,
        sumClientTotalSuccess,
        dbUserProfilesSuccessSum,
        otpLogsCount,
        agentProfileTotalSuccess
      );
      const finalTodayOtps = Math.max(
        todayFeedOtpsCount,
        todayDbOtpsCount,
        todaySupabaseUserFeedCount,
        todayOtpLogsCount
      );
      const totalEarnedUSD = dbRevCount > 0 ? dbRevCount : finalOtps * 0.05;

      if (isMounted) {
        setViewStats({
          currentBalance: currentBal,
          lifetimeTotalBalance: currentBal + totalEarnedUSD,
          totalUsers: totalUsers,
          todayUsers: todayUsersCount,
          lifetimeTotalOtp: finalOtps,
          todayOtp: finalTodayOtps,
          usersActiveApi: usersActiveApi,
          isLoading: false,
        });
      }
    };

    loadAgentStats();

    return () => {
      isMounted = false;
    };
  }, [viewingAgent, registeredUsers, feedNumbers, officialAgent]);

  // Handle Edit Agent Modal Submit
  const handleEditAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    setIsSavingEdit(true);
    const cleanE = editingAgent.email.toLowerCase().trim();
    const cleanName = editName.trim() || `Agent (${cleanE.split("@")[0]})`;
    const rawTg = editTelegram.trim();
    const cleanTg = rawTg ? (rawTg.startsWith("@") ? rawTg : `@${rawTg}`) : "";

    try {
      const targetAgent = registeredUsers.find((u) => u.email.toLowerCase().trim() === cleanE) || editingAgent;
      const updatedAgentProfile: UserProfile = {
        ...targetAgent,
        email: cleanE,
        fullName: cleanName,
        firstName: cleanName.split(" ")[0] || "",
        lastName: cleanName.split(" ").slice(1).join(" ") || "",
        telegram: cleanTg,
        password: editPassword.trim() || targetAgent.password || "",
        role: "Agent",
        isOfficial: editIsOfficial,
      };

      // 1. Save full agent profile to Supabase user_profiles & user_roles
      await saveUserProfileToSupabase(updatedAgentProfile);
      await setUserRoleInSupabase(cleanE, "agent");

      // Direct explicit update on user_profiles table for name and official status
      try {
        await supabase
          .from("user_profiles")
          .update({
            full_name: cleanName,
            telegram: cleanTg,
            is_official: editIsOfficial,
            role: "Agent",
            updated_at: new Date().toISOString(),
          })
          .ilike("email", cleanE);
      } catch (e) {
        console.warn("Notice updating agent user_profiles directly:", e);
      }

      if (editIsOfficial) {
        const otherAgents = agentList.filter((a) => a.email.toLowerCase().trim() !== cleanE);
        for (const other of otherAgents) {
          await supabase
            .from("user_profiles")
            .update({ is_official: false })
            .ilike("email", other.email.toLowerCase().trim());
        }
        localStorage.setItem("orabit_official_agent_email", cleanE);
      }

      // 2. Update local state & localStorage
      const updatedUsers = registeredUsers.map((u) => {
        if (u.email.toLowerCase().trim() === cleanE) {
          return updatedAgentProfile;
        }
        if (editIsOfficial && u.role?.toLowerCase() === "agent") {
          return {
            ...u,
            isOfficial: false,
          };
        }
        return u;
      });

      localStorage.setItem("orabit_registered_users", JSON.stringify(updatedUsers));
      setRegisteredUsers(updatedUsers);

      // Force authoritative global re-fetch from database to ensure all devices sync
      try {
        const freshProfiles = await fetchAllProfilesFromSupabase();
        if (freshProfiles && freshProfiles.length > 0) {
          setRegisteredUsers(freshProfiles);
        }
      } catch (e) {}

      setAgentNotice({ text: `Agent (${cleanName}) profile updated successfully!`, type: "success" });
      setEditingAgent(null);
    } catch (err: any) {
      console.error("Failed to update agent profile:", err);
      setAgentNotice({ text: err.message || "Failed to update agent profile.", type: "error" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Balance Modal Action (Add / Deduct)
  const handleBalanceUpdate = async (action: "add" | "deduct") => {
    if (!balancingAgent) return;
    const amt = parseFloat(balAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    setIsUpdatingBal(true);
    const cleanE = balancingAgent.email.toLowerCase().trim();
    const currentBal = balancingAgent.balance || 0;
    const newBal = action === "add" ? currentBal + amt : Math.max(0, currentBal - amt);

    try {
      // 1. Update Supabase user_profiles balance
      await supabase.from("user_profiles").upsert(
        {
          email: cleanE,
          balance: newBal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

      // 2. Update local state & localStorage
      const updatedUsers = registeredUsers.map((u) => {
        if (u.email.toLowerCase().trim() === cleanE) {
          return {
            ...u,
            balance: newBal,
          };
        }
        return u;
      });

      localStorage.setItem("orabit_registered_users", JSON.stringify(updatedUsers));
      setRegisteredUsers(updatedUsers);

      if (onUpdateUserBalance) {
        onUpdateUserBalance(cleanE, action === "add" ? amt : -amt);
      }

      setAgentNotice({
        text: `${action === "add" ? "Added" : "Deducted"} $${amt.toFixed(2)} ${
          action === "add" ? "to" : "from"
        } Agent (${balancingAgent.fullName || cleanE}) balance! New balance: $${newBal.toFixed(2)}`,
        type: "success",
      });

      setBalancingAgent(null);
    } catch (err: any) {
      console.error("Failed to update balance:", err);
      alert("Error updating balance in Supabase.");
    } finally {
      setIsUpdatingBal(false);
    }
  };

  // Top 10 Performing Agents Data Calculation
  const topAgentsData = useMemo(() => {
    if (agentList.length === 0) return [];

    const allFeedsMapByEmail: Record<string, FeedNumber[]> = {};

    feedNumbers.forEach((f) => {
      const em = (f.userEmail || f.email || "").toLowerCase().trim();
      if (em) {
        if (!allFeedsMapByEmail[em]) allFeedsMapByEmail[em] = [];
        allFeedsMapByEmail[em].push(f);
      }
    });

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("orabit_feed_numbers")) {
          let em = "";
          if (key.startsWith("orabit_feed_numbers_")) {
            em = key.replace("orabit_feed_numbers_", "").toLowerCase().trim();
          }
          const val = localStorage.getItem(key);
          if (val) {
            try {
              const parsed: FeedNumber[] = JSON.parse(val);
              if (Array.isArray(parsed)) {
                parsed.forEach((f) => {
                  const itemEm = (f.userEmail || f.email || em).toLowerCase().trim();
                  if (itemEm) {
                    if (!allFeedsMapByEmail[itemEm]) allFeedsMapByEmail[itemEm] = [];
                    allFeedsMapByEmail[itemEm].push(f);
                  }
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {}

    const calcSuccessOtps = (feeds: FeedNumber[]) => {
      const seen = new Set<string>();
      let total = 0;
      feeds.forEach((f) => {
        const k = f.id || `${f.number}_${f.requestedAt}_${f.status}`;
        if (!seen.has(k)) {
          seen.add(k);
          const isSuccess = f.status === "SUCCESS" || f.status === "MULTI SUCCESS" || (f.status as string) === "success";
          const isFail = f.rawMessage ? f.rawMessage.toLowerCase().includes("no sms received") : false;
          if (isSuccess && !isFail) {
            const validMsgs = f.messages ? f.messages.filter((m) => m.code || (m.raw && !m.raw.toLowerCase().includes("no sms received"))) : [];
            total += validMsgs.length > 0 ? validMsgs.length : 1;
          }
        }
      });
      return total;
    };

    const officialEmailStr = officialAgent?.email?.toLowerCase().trim() || "orabitsms@gmail.com";

    const agentPerformance = agentList.map((agent) => {
      const agEmail = agent.email.toLowerCase().trim();

      const referredClients = getReferredClientsForAgent(agent, registeredUsers, officialEmailStr);

      const clientEmails = new Set<string>();
      clientEmails.add(agEmail);
      referredClients.forEach((c) => clientEmails.add(c.email.toLowerCase().trim()));

      const agentFeeds: FeedNumber[] = [];
      clientEmails.forEach((cEmail) => {
        if (allFeedsMapByEmail[cEmail]) {
          agentFeeds.push(...allFeedsMapByEmail[cEmail]);
        }
      });

      const totalSuccessOtps = calcSuccessOtps(agentFeeds);
      const displayName = agent.fullName && agent.fullName !== `Agent (${agEmail.split("@")[0]})`
        ? agent.fullName
        : agEmail.split("@")[0];

      return {
        agentEmail: agEmail,
        name: displayName,
        shortEmail: agEmail.length > 18 ? agEmail.substring(0, 15) + "..." : agEmail,
        totalOtps: totalSuccessOtps,
        clientsCount: referredClients.length,
      };
    });

    agentPerformance.sort((a, b) => b.totalOtps - a.totalOtps);
    return agentPerformance.slice(0, 10);
  }, [agentList, registeredUsers, feedNumbers]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" /> Agent Management
          </h2>
          <p className="text-xs text-slate-400">
            Create, manage, and inspect system Agents and their referred clients.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold font-mono">
          System Agents ({agentList.length})
        </span>
      </div>

      {/* Notice Toast */}
      {agentNotice && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
            agentNotice.type === "success"
              ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
              : "bg-rose-950/80 border-rose-500 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {agentNotice.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{agentNotice.text}</span>
          </div>
          <button onClick={() => setAgentNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Create Agent Form */}
      <form onSubmit={handleCreateAgentSubmit} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-indigo-400" /> Create New Agent Account
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={newAgentName}
              onChange={(e) => setNewAgentName(e.target.value)}
              placeholder="Agent Name (e.g. Alif Sheikh)"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <Send className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={newAgentTelegram}
              onChange={(e) => setNewAgentTelegram(e.target.value)}
              placeholder="Telegram Username (e.g. @username)"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="email"
              value={newAgentEmail}
              onChange={(e) => setNewAgentEmail(e.target.value)}
              placeholder="Agent Email (e.g. agent@domain.com)"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="password"
              value={newAgentPassword}
              onChange={(e) => setNewAgentPassword(e.target.value)}
              placeholder="Agent Password (min 6 characters)"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isCreatingAgent}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isCreatingAgent ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Creating Agent & Setting Role...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Agent & Set 'agent' Role</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ACTIVE SYSTEM AGENTS TABLE */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Active System Agents ({agentList.length})
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800">
                <th className="py-2.5 px-3">Agent Email</th>
                <th className="py-2.5 px-3">Assigned Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Referred Clients</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {agentList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500 font-sans">
                    No agents created yet. Use the form above to add an agent.
                  </td>
                </tr>
              ) : (
                agentList.map((agent) => {
                  const officialEmailStr = officialAgent?.email?.toLowerCase().trim() || "";
                  const referredClients = getReferredClientsForAgent(agent, registeredUsers, officialEmailStr);
                  const referredCount = referredClients.length;
                  const isOfficialAg = Boolean(
                    agent.isOfficial ||
                      (officialAgent && officialAgent.email.toLowerCase().trim() === agent.email.toLowerCase().trim())
                  );

                  return (
                    <tr key={agent.email} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <div className="font-sans text-xs text-white font-bold flex items-center gap-1.5">
                          <span>{agent.fullName || agent.email.split("@")[0]}</span>
                          {isOfficialAg && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30 flex items-center gap-0.5 font-mono">
                              <ShieldCheck className="w-2.5 h-2.5 text-amber-400" /> OFFICIAL
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-indigo-300 font-mono">{agent.email}</div>
                        {agent.telegram && (
                          <div className="text-[10px] text-sky-400 font-sans">{agent.telegram}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {isOfficialAg ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 inline-flex">
                            <ShieldCheck className="w-3 h-3 text-amber-400" /> OFFICIAL AGENT
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetOfficialAgent(agent.email)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 text-[10px] uppercase font-bold border border-slate-700 hover:border-amber-500/30 transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Click to set as Permanent Official Agent (Fallback Target)"
                          >
                            <ShieldCheck className="w-3 h-3 text-slate-500" /> agent
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 font-sans">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-white font-bold">{referredCount} Clients</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. View Button */}
                          <button
                            onClick={() => handleOpenViewModal(agent)}
                            className="p-1.5 px-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 hover:text-sky-300 transition-all cursor-pointer inline-flex items-center gap-1 font-sans text-xs font-bold"
                            title="View Agent Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* 2. ± Bal Button */}
                          <button
                            onClick={() => {
                              setBalancingAgent(agent);
                              setBalAmount("10");
                            }}
                            className="p-1.5 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all cursor-pointer inline-flex items-center gap-1 font-sans text-xs font-bold"
                            title="Balance Management"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>± Bal</span>
                          </button>

                          {/* 3. Edit Button */}
                          <button
                            onClick={async () => {
                              setEditingAgent(agent);
                              setEditName(agent.fullName || "");
                              setEditEmail(agent.email);
                              setEditPassword(agent.password || "");
                              setEditTelegram(agent.telegram || "");
                              setEditIsOfficial(isOfficialAg);

                              try {
                                const fresh = await fetchUserProfileFromSupabase(agent.email);
                                if (fresh) {
                                  if (fresh.fullName) setEditName(fresh.fullName);
                                  if (fresh.telegram !== undefined) setEditTelegram(fresh.telegram);
                                  if (fresh.isOfficial !== undefined) setEditIsOfficial(!!fresh.isOfficial);
                                  if (fresh.password) setEditPassword(fresh.password);
                                }
                              } catch (e) {}
                            }}
                            className="p-1.5 px-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all cursor-pointer inline-flex items-center gap-1 font-sans text-xs font-bold"
                            title="Edit Agent Info"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* 4. Delete Button */}
                          <button
                            onClick={() => handleDeleteAgent(agent.email)}
                            className="p-1.5 px-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer inline-flex items-center gap-1 font-sans text-xs font-bold"
                            title="Delete Agent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW AGENT DETAILS */}
      {viewingAgent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden text-left my-auto">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

            {/* Header / Avatar */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/20 shrink-0">
                  {(viewingAgent.fullName || viewingAgent.email)[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    {viewingAgent.fullName || viewingAgent.email.split("@")[0]}
                    <BadgeCheck className="w-4 h-4 text-sky-400" />
                  </h3>
                  <p className="text-xs text-indigo-300 font-mono">{viewingAgent.email}</p>
                  {viewingAgent.telegram && (
                    <span className="text-xs text-sky-400 font-medium">{viewingAgent.telegram}</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleCloseViewModal}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: 5 Statistics Cards Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" /> Agent Statistics & Metrics
              </h4>

              {viewStats.isLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Loading agent metrics from Supabase...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {/* Card 1: Current Balance */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Current Balance
                    </span>
                    <p className="text-lg font-black font-mono text-emerald-400">
                      ${viewStats.currentBalance.toFixed(2)}{" "}
                      <span className="text-xs text-slate-500 font-normal">
                        (৳{(viewStats.currentBalance * usdExchangeRate).toFixed(0)})
                      </span>
                    </p>
                  </div>

                  {/* Card 2: Lifetime Total Balance */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Lifetime Total Balance
                    </span>
                    <p className="text-lg font-black font-mono text-indigo-300">
                      ${viewStats.lifetimeTotalBalance.toFixed(2)}{" "}
                      <span className="text-xs text-slate-500 font-normal">
                        (৳{(viewStats.lifetimeTotalBalance * usdExchangeRate).toFixed(0)})
                      </span>
                    </p>
                  </div>

                  {/* Card 3: Total Users */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-400" /> Total Users
                    </span>
                    <p className="text-lg font-black font-mono text-sky-300">
                      {viewStats.totalUsers} <span className="text-xs text-slate-500 font-normal">Referred Clients</span>
                    </p>
                  </div>

                  {/* Card 4: Today Users */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5 text-emerald-400" /> Today Users
                    </span>
                    <p className="text-lg font-black font-mono text-emerald-400">
                      {viewStats.todayUsers} <span className="text-xs text-slate-500 font-normal">New Joined Today</span>
                    </p>
                  </div>

                  {/* Card 5: Lifetime Total OTP */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Lifetime Total OTP
                    </span>
                    <p className="text-lg font-black font-mono text-amber-400">
                      {viewStats.lifetimeTotalOtp} <span className="text-xs text-slate-500 font-normal">Success OTPs</span>
                    </p>
                  </div>

                  {/* Card 6: Today OTP */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-300" /> Today OTP
                    </span>
                    <p className="text-lg font-black font-mono text-amber-300">
                      {viewStats.todayOtp} <span className="text-xs text-slate-500 font-normal">Today Success OTPs</span>
                    </p>
                  </div>

                  {/* Card 5: Users Active API */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-purple-400" /> Users Active API
                    </span>
                    <p className="text-lg font-black font-mono text-purple-300">
                      {viewStats.usersActiveApi}{" "}
                      <span className="text-xs text-slate-500 font-normal">
                        out of {viewStats.totalUsers} clients have active API keys
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800/80">
              <button
                onClick={handleCloseViewModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT AGENT INFO */}
      {editingAgent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden text-left my-auto">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" /> Edit Agent Information
              </h3>
              <button
                onClick={() => setEditingAgent(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditAgentSubmit} className="space-y-3">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Agent Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Agent Email</label>
                <input
                  type="email"
                  value={editEmail}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Telegram Username */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Telegram Username</label>
                <input
                  type="text"
                  value={editTelegram}
                  onChange={(e) => setEditTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Permanent Official Agent Toggle */}
              <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" /> Permanent Official Agent
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Fallback target for unreferred signups & clients transferred from deleted agents.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={editIsOfficial}
                    onChange={(e) => setEditIsOfficial(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BALANCE MANAGEMENT */}
      {balancingAgent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative overflow-hidden text-left my-auto">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" /> Balance Management
              </h3>
              <button
                onClick={() => setBalancingAgent(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Agent Info Box */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <p className="text-xs font-bold text-white">{balancingAgent.fullName || balancingAgent.email}</p>
              <p className="text-[11px] text-slate-400 font-mono">{balancingAgent.email}</p>
              <div className="pt-1 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Current Balance:</span>
                <span className="text-emerald-400 font-mono">${(balancingAgent.balance || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Enter Amount ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={balAmount}
                  onChange={(e) => setBalAmount(e.target.value)}
                  placeholder="10.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Approx ৳{(parseFloat(balAmount || "0") * usdExchangeRate).toFixed(0)} BDT
              </p>
            </div>

            {/* Action Buttons: Add Balance (Green) & Deduct Balance (Red/Orange) */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                disabled={isUpdatingBal}
                onClick={() => handleBalanceUpdate("add")}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Balance</span>
              </button>

              <button
                type="button"
                disabled={isUpdatingBal}
                onClick={() => handleBalanceUpdate("deduct")}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Deduct Balance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Performing Agents Chart Section */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-400" /> Top Performing Agents (By OTP Volume)
        </h3>
        {topAgentsData.length === 0 ? (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-500 font-sans">
            No agent performance data available yet.
          </div>
        ) : (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={topAgentsData} margin={{ top: 20, right: 15, left: -10, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#1e293b", borderRadius: "12px", fontSize: "12px" }}
                    formatter={(val: any) => [`${val} OTPs`, "Success OTPs"]}
                  />
                  <Bar dataKey="totalOtps" radius={[6, 6, 0, 0]}>
                    {topAgentsData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#818cf8" : index === 1 ? "#38bdf8" : index === 2 ? "#34d399" : "#6366f1"}
                      />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
