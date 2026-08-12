import { supabase } from "./supabase";
import { FeedNumber } from "../types";
import { recordDailyStatToSupabase, getBDDateString } from "./supabaseDailyStats";

export const USER_FEED_NUMBERS_TABLE = "user_feed_numbers";

// SQL table definition instruction for Supabase SQL Editor
export const CREATE_TABLE_SQL = `
-- Supabase SQL Editor script to create user_feed_numbers table
CREATE TABLE IF NOT EXISTS public.user_feed_numbers (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    country TEXT,
    operator TEXT,
    service TEXT DEFAULT 'SMS OTP',
    otp_code TEXT,
    raw_message TEXT,
    requested_at BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_feed_numbers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon access for sync
CREATE POLICY "Allow all operations for user_feed_numbers" 
ON public.user_feed_numbers FOR ALL 
USING (true) 
WITH CHECK (true);

-- Index for fast queries by user email
CREATE INDEX IF NOT EXISTS idx_user_feed_numbers_email ON public.user_feed_numbers(user_email);
`;

import { formatTimeAgo } from "../components/TimeAgoBadge";

/**
 * Helper to transform DB row into FeedNumber object
 */
function mapRowToFeedNumber(row: any): FeedNumber {
  const reqTs = row.requested_at ? Number(row.requested_at) : Date.now();
  const elapsedMs = Date.now() - reqTs;

  let finalStatus: "SUCCESS" | "MULTI SUCCESS" | "PENDING" | "FAILED" = row.status as any;
  if (finalStatus === "PENDING" && elapsedMs >= 15 * 60 * 1000) {
    finalStatus = "FAILED";
  }

  // Immutable lock: If row status in DB is SUCCESS or MULTI SUCCESS, never downgrade to FAILED/PENDING
  if (row.status === "SUCCESS" || row.status === "MULTI SUCCESS") {
    finalStatus = row.status;
  }

  const dynamicTimeAgo = formatTimeAgo(reqTs, row.time_ago);

  // Parse structured messages list if raw_message contains delimited messages
  let messagesList: Array<{ code?: string; raw: string; timestamp: number }> | undefined = undefined;
  if (row.raw_message) {
    const rawParts = row.raw_message.split("\n---\n").filter(Boolean);
    if (rawParts.length > 0) {
      messagesList = rawParts.map((part: string, idx: number) => {
        const match = part.match(/\b\d{4,8}\b/);
        return {
          raw: part,
          code: match ? match[0] : undefined,
          timestamp: reqTs - idx * 1000,
        };
      });
    }
  }

  return {
    id: row.id,
    number: row.number,
    status: finalStatus,
    country: row.country || "Global Pool",
    operator: row.operator || "GSM Network",
    service: row.service || "SMS OTP",
    timeAgo: dynamicTimeAgo,
    otpCode: row.otp_code || undefined,
    rawMessage: row.raw_message || undefined,
    messages: messagesList,
    requestedAt: reqTs,
  };
}

/**
 * Safe local storage setter to prevent QuotaExceededError
 */
function safeSetLocalCache(key: string, data: any): void {
  try {
    const payload = JSON.stringify(Array.isArray(data) ? data.slice(0, 100) : data);
    localStorage.setItem(key, payload);
  } catch (e: any) {
    if (e?.name === "QuotaExceededError" || e?.code === 22 || e?.code === 1014) {
      try {
        if (Array.isArray(data)) {
          localStorage.setItem(key, JSON.stringify(data.slice(0, 20)));
        }
      } catch (inner) {
        console.warn("Could not save to local cache due to browser storage quota limits.");
      }
    }
  }
}

/**
 * Fetch all feed numbers for a user from Supabase database.
 * Falls back to localStorage if DB fetch fails or table is absent.
 */
export async function fetchUserFeedNumbersFromSupabase(userEmail: string): Promise<FeedNumber[]> {
  if (!userEmail) return [];

  const cleanEmail = userEmail.toLowerCase().trim();
  const localKey = `orabit_feed_numbers_${cleanEmail}`;

  try {
    const { data, error } = await supabase
      .from(USER_FEED_NUMBERS_TABLE)
      .select("*")
      .eq("user_email", cleanEmail)
      .order("requested_at", { ascending: false });

    if (error) {
      console.warn("Supabase feed fetch notice (falling back to local cache):", error.message);
      const saved = localStorage.getItem(localKey);
      return saved ? JSON.parse(saved) : [];
    }

    if (data && Array.isArray(data)) {
      const dbFeeds = data.map(mapRowToFeedNumber);
      // Cache in localStorage for offline availability
      safeSetLocalCache(localKey, dbFeeds);
      return dbFeeds;
    }
  } catch (e) {
    console.error("Exception fetching feed numbers from Supabase:", e);
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem(localKey);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save or update a single feed number item in Supabase database.
 */
export async function saveFeedNumberToSupabase(userEmail: string, item: FeedNumber): Promise<void> {
  if (!userEmail || !item) return;

  const cleanEmail = userEmail.toLowerCase().trim();
  const localKey = `orabit_feed_numbers_${cleanEmail}`;

  // 1. Update localStorage cache immediately for high speed UI feedback
  try {
    const saved = localStorage.getItem(localKey);
    let items: FeedNumber[] = saved ? JSON.parse(saved) : [];
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items = [item, ...items];
    }
    safeSetLocalCache(localKey, items);
  } catch (e) {
    console.warn("Failed to update local feed cache:", e);
  }

  // 2. Upsert to Supabase DB for cross-device sync
  try {
    const payload = {
      id: item.id,
      user_email: cleanEmail,
      number: item.number,
      status: item.status,
      country: item.country,
      operator: item.operator,
      service: item.service,
      otp_code: item.otpCode || null,
      raw_message: item.rawMessage || null,
      requested_at: item.requestedAt || Date.now(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(USER_FEED_NUMBERS_TABLE).upsert(payload, { onConflict: "id" });
    if (error) {
      console.warn("Supabase upsert feed number notice:", error.message);
    } else {
      const isSuccess = item.status === "SUCCESS" || item.status === "MULTI SUCCESS" || item.status === "success";
      recordDailyStatToSupabase(cleanEmail, true, isSuccess, 0.006, getBDDateString(item.requestedAt || Date.now()));
    }
  } catch (e) {
    console.error("Failed upserting feed number to Supabase:", e);
  }
}

/**
 * Bulk save/upsert updated feed numbers array to Supabase DB.
 */
export async function bulkSyncFeedNumbersToSupabase(userEmail: string, items: FeedNumber[]): Promise<void> {
  if (!userEmail || !Array.isArray(items) || items.length === 0) return;

  const cleanEmail = userEmail.toLowerCase().trim();
  const localKey = `orabit_feed_numbers_${cleanEmail}`;

  try {
    safeSetLocalCache(localKey, items);
  } catch (e) {
    console.warn("Failed local cache save:", e);
  }

  try {
    const payloads = items.map((item) => ({
      id: item.id,
      user_email: cleanEmail,
      number: item.number,
      status: item.status,
      country: item.country,
      operator: item.operator,
      service: item.service,
      otp_code: item.otpCode || null,
      raw_message: item.rawMessage || null,
      requested_at: item.requestedAt || Date.now(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from(USER_FEED_NUMBERS_TABLE).upsert(payloads, { onConflict: "id" });
    if (error) {
      console.warn("Supabase bulk sync notice:", error.message);
    }
  } catch (e) {
    console.error("Exception bulk syncing feed numbers to Supabase:", e);
  }
}
