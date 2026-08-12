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

  // Check if messages or OTP code exists on row
  const hasOtp = !!(row.otp_code && String(row.otp_code).trim().length > 0) || !!(row.raw_message && String(row.raw_message).trim().length > 0);

  // Immutable lock: If row status in DB is SUCCESS/MULTI SUCCESS or row contains OTP data, never downgrade to FAILED/PENDING
  if (row.status === "SUCCESS" || row.status === "MULTI SUCCESS" || hasOtp) {
    if (row.raw_message && row.raw_message.includes("\n---\n")) {
      finalStatus = "MULTI SUCCESS";
    } else {
      finalStatus = "SUCCESS";
    }
  } else if (finalStatus === "PENDING" && elapsedMs >= 15 * 60 * 1000) {
    finalStatus = "FAILED";
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
 * State Lock helper to merge incoming feed items with current state.
 * CRITICAL RULE: Once an item has status "SUCCESS" or "MULTI SUCCESS" or contains OTP messages/codes,
 * it CANNOT be downgraded to "PENDING" or "FAILED" by an incoming poll or DB re-fetch.
 */
export function applyFeedStateLock(currentFeed: FeedNumber[], incomingFeed: FeedNumber[]): FeedNumber[] {
  if (!Array.isArray(currentFeed) || currentFeed.length === 0) {
    return incomingFeed || [];
  }
  if (!Array.isArray(incomingFeed) || incomingFeed.length === 0) {
    return currentFeed;
  }

  // Map existing items by ID and by normalized number for fast lookup
  const currentById = new Map<string, FeedNumber>();
  const currentByNum = new Map<string, FeedNumber>();

  for (const item of currentFeed) {
    if (item.id) currentById.set(item.id, item);
    if (item.number) {
      const cleanNum = item.number.replace(/\D/g, "");
      if (cleanNum) currentByNum.set(cleanNum, item);
    }
  }

  const processedIds = new Set<string>();
  const mergedFeed: FeedNumber[] = [];

  for (const incoming of incomingFeed) {
    const cleanIncNum = (incoming.number || "").replace(/\D/g, "");
    const existing = (incoming.id ? currentById.get(incoming.id) : null) || (cleanIncNum ? currentByNum.get(cleanIncNum) : null);

    if (existing) {
      processedIds.add(existing.id);

      const existingHasOtp = !!(existing.otpCode && existing.otpCode.trim().length > 0) || !!(existing.messages && existing.messages.length > 0);
      const existingIsSuccess = existing.status === "SUCCESS" || existing.status === "MULTI SUCCESS" || existingHasOtp;

      const incomingHasOtp = !!(incoming.otpCode && incoming.otpCode.trim().length > 0) || !!(incoming.messages && incoming.messages.length > 0);
      const incomingIsSuccess = incoming.status === "SUCCESS" || incoming.status === "MULTI SUCCESS" || incomingHasOtp;

      if (existingIsSuccess) {
        // STATE LOCK ACTIVE: Existing item is already SUCCESS/MULTI SUCCESS
        if (!incomingIsSuccess || incoming.status === "PENDING" || incoming.status === "FAILED") {
          // REJECT incoming PENDING/FAILED. Retain existing SUCCESS state and OTPs!
          mergedFeed.push({
            ...incoming,
            status: existing.status,
            otpCode: existing.otpCode || incoming.otpCode,
            rawMessage: existing.rawMessage || incoming.rawMessage,
            messages: (existing.messages && existing.messages.length > 0) ? existing.messages : incoming.messages,
            service: (existing.service && existing.service !== "SMS OTP") ? existing.service : incoming.service,
            requestedAt: existing.requestedAt || incoming.requestedAt,
            timeAgo: existing.timeAgo || incoming.timeAgo,
          });
        } else {
          // Both existing and incoming claim SUCCESS. Merge messages without losing any OTP.
          const mergedMessages = [...(existing.messages || [])];
          const incomingMsgs = incoming.messages || [];

          for (const incM of incomingMsgs) {
            if (incM.raw && !mergedMessages.some((m) => m.raw === incM.raw)) {
              mergedMessages.unshift(incM);
            }
          }

          const combinedCodes = mergedMessages.map((m) => m.code).filter(Boolean).join(", ");
          const combinedRaw = mergedMessages.map((m) => m.raw).join("\n---\n");
          const finalStatus = mergedMessages.length > 1 ? "MULTI SUCCESS" : (existing.status === "MULTI SUCCESS" ? "MULTI SUCCESS" : "SUCCESS");

          mergedFeed.push({
            ...incoming,
            status: finalStatus,
            otpCode: combinedCodes || existing.otpCode || incoming.otpCode,
            rawMessage: combinedRaw || existing.rawMessage || incoming.rawMessage,
            messages: mergedMessages.length > 0 ? mergedMessages : existing.messages,
            service: (existing.service && existing.service !== "SMS OTP") ? existing.service : incoming.service,
            requestedAt: existing.requestedAt || incoming.requestedAt,
          });
        }
      } else {
        // Existing item was not SUCCESS yet (was PENDING/FAILED). Adopt incoming item.
        mergedFeed.push(incoming);
      }
    } else {
      // New incoming item not in current state
      mergedFeed.push(incoming);
    }
  }

  // Preserve any items present in currentFeed that were missing from incomingFeed
  for (const item of currentFeed) {
    if (!processedIds.has(item.id)) {
      mergedFeed.push(item);
    }
  }

  return mergedFeed;
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

  // Read existing cached items to enforce State Lock on DB writes
  let existingItems: FeedNumber[] = [];
  try {
    const saved = localStorage.getItem(localKey);
    if (saved) existingItems = JSON.parse(saved);
  } catch (e) {
    console.warn("Failed to read local feed cache:", e);
  }

  // Enforce state lock against existing item
  const cleanNum = (item.number || "").replace(/\D/g, "");
  const existing = existingItems.find(
    (i) => i.id === item.id || (cleanNum && i.number && i.number.replace(/\D/g, "") === cleanNum)
  );

  let finalItem = item;
  if (existing) {
    const existingIsSuccess = existing.status === "SUCCESS" || existing.status === "MULTI SUCCESS" || !!existing.otpCode;
    if (existingIsSuccess && (item.status === "PENDING" || item.status === "FAILED")) {
      finalItem = {
        ...item,
        status: existing.status,
        otpCode: existing.otpCode || item.otpCode,
        rawMessage: existing.rawMessage || item.rawMessage,
        messages: existing.messages || item.messages,
        requestedAt: existing.requestedAt || item.requestedAt,
      };
    }
  }

  // 1. Update localStorage cache
  try {
    const idx = existingItems.findIndex((i) => i.id === finalItem.id);
    if (idx >= 0) {
      existingItems[idx] = finalItem;
    } else {
      existingItems = [finalItem, ...existingItems];
    }
    safeSetLocalCache(localKey, existingItems);
  } catch (e) {
    console.warn("Failed to update local feed cache:", e);
  }

  // 2. Upsert to Supabase DB
  try {
    const payload = {
      id: finalItem.id,
      user_email: cleanEmail,
      number: finalItem.number,
      status: finalItem.status,
      country: finalItem.country,
      operator: finalItem.operator,
      service: finalItem.service,
      otp_code: finalItem.otpCode || null,
      raw_message: finalItem.rawMessage || null,
      requested_at: finalItem.requestedAt || Date.now(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(USER_FEED_NUMBERS_TABLE).upsert(payload, { onConflict: "id" });
    if (error) {
      console.warn("Supabase upsert feed number notice:", error.message);
    } else {
      const isSuccess = finalItem.status === "SUCCESS" || finalItem.status === "MULTI SUCCESS";
      if (isSuccess) {
        recordDailyStatToSupabase(cleanEmail, true, true, 0.006, getBDDateString(finalItem.requestedAt || Date.now()));
      }
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

  let existingCache: FeedNumber[] = [];
  try {
    const saved = localStorage.getItem(localKey);
    if (saved) existingCache = JSON.parse(saved);
  } catch (e) {
    console.warn("Failed local cache read:", e);
  }

  // Apply state lock to items array before writing to local cache or DB
  const lockedItems = applyFeedStateLock(existingCache, items);

  try {
    safeSetLocalCache(localKey, lockedItems);
  } catch (e) {
    console.warn("Failed local cache save:", e);
  }

  try {
    const payloads = lockedItems.map((item) => ({
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
