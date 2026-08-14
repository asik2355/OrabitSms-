import { supabase } from "./supabase";

export const DAILY_STATS_TABLE = "daily_stats";

export interface DailyStatItem {
  id?: string;
  date: string; // "YYYY-MM-DD"
  user_email: string;
  total_allocations: number;
  total_otps: number;
  total_revenue: number;
  updated_at?: string;
}

export const CREATE_DAILY_STATS_TABLE_SQL = `
-- =========================================================
-- PERMANENT ANALYTICS SYSTEM FOR ORABITSMS (SUPABASE SQL)
-- =========================================================

-- 1. Create daily_stats table to store historical analytics permanently
CREATE TABLE IF NOT EXISTS public.daily_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    user_email TEXT NOT NULL,
    total_allocations INT DEFAULT 0,
    total_otps INT DEFAULT 0,
    total_revenue NUMERIC(12, 4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, user_email)
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_daily_stats_date_email ON public.daily_stats(date, user_email);

-- Enable RLS
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Allow all operations policy
CREATE POLICY "Allow all operations for daily_stats" 
ON public.daily_stats FOR ALL 
USING (true) 
WITH CHECK (true);

-- 2. Automatic Trigger Function to update daily_stats when user_feed_numbers changes
CREATE OR REPLACE FUNCTION public.update_daily_stats_trigger()
RETURNS TRIGGER AS $$
DECLARE
    req_date DATE;
    is_success BOOLEAN;
    service_rate NUMERIC(12, 4);
BEGIN
    -- Calculate date in Bangladesh Timezone (UTC+6)
    IF NEW.requested_at IS NOT NULL AND NEW.requested_at > 0 THEN
        req_date := (to_timestamp(NEW.requested_at / 1000.0) AT TIME ZONE 'Asia/Dhaka')::DATE;
    ELSE
        req_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::DATE;
    END IF;

    is_success := (NEW.status = 'SUCCESS' OR NEW.status = 'MULTI SUCCESS' OR NEW.status = 'success');
    service_rate := 0.006; -- $0.006 USD per OTP

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.daily_stats (date, user_email, total_allocations, total_otps, total_revenue)
        VALUES (
            req_date,
            LOWER(TRIM(NEW.user_email)),
            1,
            CASE WHEN is_success THEN 1 ELSE 0 END,
            CASE WHEN is_success THEN service_rate ELSE 0 END
        )
        ON CONFLICT (date, user_email)
        DO UPDATE SET
            total_allocations = public.daily_stats.total_allocations + 1,
            total_otps = public.daily_stats.total_otps + (CASE WHEN is_success THEN 1 ELSE 0 END),
            total_revenue = public.daily_stats.total_revenue + (CASE WHEN is_success THEN service_rate ELSE 0 END),
            updated_at = NOW();

    ELSIF (TG_OP = 'UPDATE') THEN
        -- If status was updated to SUCCESS from non-success
        IF is_success AND (OLD.status IS NULL OR OLD.status NOT IN ('SUCCESS', 'MULTI SUCCESS', 'success')) THEN
            INSERT INTO public.daily_stats (date, user_email, total_allocations, total_otps, total_revenue)
            VALUES (req_date, LOWER(TRIM(NEW.user_email)), 0, 1, service_rate)
            ON CONFLICT (date, user_email)
            DO UPDATE SET
                total_otps = public.daily_stats.total_otps + 1,
                total_revenue = public.daily_stats.total_revenue + service_rate,
                updated_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Trigger to user_feed_numbers
DROP TRIGGER IF EXISTS trg_update_daily_stats ON public.user_feed_numbers;
CREATE TRIGGER trg_update_daily_stats
AFTER INSERT OR UPDATE ON public.user_feed_numbers
FOR EACH ROW
EXECUTE FUNCTION public.update_daily_stats_trigger();
`;

/**
 * Fetch daily stats from Supabase / Backend for a specific user (or all users if empty/owner)
 */
export async function fetchDailyStatsFromSupabase(userEmail?: string): Promise<DailyStatItem[]> {
  const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : "";

  // 1. Try Backend Proxy API
  try {
    const url = cleanEmail ? `/api/stats/daily?email=${encodeURIComponent(cleanEmail)}` : "/api/stats/daily";
    const resp = await fetch(url);
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.success && Array.isArray(json.stats) && json.stats.length > 0) {
        return json.stats.map((row: any) => ({
          id: row.id,
          date: typeof row.date === "string" ? row.date.split("T")[0] : row.date,
          user_email: row.user_email,
          total_allocations: Number(row.total_allocations || 0),
          total_otps: Number(row.total_otps || 0),
          total_revenue: Number(row.total_revenue || 0),
          updated_at: row.updated_at,
        }));
      }
    }
  } catch (e) {}

  // 2. Direct Supabase
  try {
    let query = supabase.from(DAILY_STATS_TABLE).select("*").order("date", { ascending: false });

    if (cleanEmail) {
      query = query.eq("user_email", cleanEmail);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("Daily stats fetch notice:", error.message);
      return [];
    }

    if (data && Array.isArray(data)) {
      return data.map((row) => ({
        id: row.id,
        date: typeof row.date === "string" ? row.date.split("T")[0] : row.date,
        user_email: row.user_email,
        total_allocations: Number(row.total_allocations || 0),
        total_otps: Number(row.total_otps || 0),
        total_revenue: Number(row.total_revenue || 0),
        updated_at: row.updated_at,
      }));
    }
  } catch (e) {
    console.error("Exception fetching daily stats from Supabase:", e);
  }
  return [];
}

/**
 * Client-side helper to safely increment/record a daily stat in Supabase & Backend
 */
export async function recordDailyStatToSupabase(
  userEmail: string,
  isAllocation: boolean,
  isSuccess: boolean,
  revenueAmount: number = 0.006,
  dateStr?: string
): Promise<void> {
  if (!userEmail) return;

  const cleanEmail = userEmail.toLowerCase().trim();
  const today = dateStr || getBDDateString(Date.now());

  // Record to backend proxy
  try {
    fetch("/api/stats/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail: cleanEmail,
        isAllocation,
        isSuccess,
        revenueAmount,
        dateStr: today,
      }),
    }).catch(() => {});
  } catch (e) {}

  try {
    const { data } = await supabase
      .from(DAILY_STATS_TABLE)
      .select("*")
      .eq("date", today)
      .eq("user_email", cleanEmail)
      .maybeSingle();

    const currentAlloc = data ? Number(data.total_allocations || 0) : 0;
    const currentOtps = data ? Number(data.total_otps || 0) : 0;
    const currentRev = data ? Number(data.total_revenue || 0) : 0;

    const newAlloc = currentAlloc + (isAllocation ? 1 : 0);
    const newOtps = currentOtps + (isSuccess ? 1 : 0);
    const newRev = currentRev + (isSuccess ? revenueAmount : 0);

    const payload = {
      date: today,
      user_email: cleanEmail,
      total_allocations: newAlloc,
      total_otps: newOtps,
      total_revenue: newRev,
      updated_at: new Date().toISOString(),
    };

    await supabase.from(DAILY_STATS_TABLE).upsert(payload, { onConflict: "date,user_email" });
  } catch (e) {
    console.error("Failed recording daily stat to Supabase:", e);
  }
}

/**
 * Get Bangladesh Date string (YYYY-MM-DD)
 */
export function getBDDateString(timestampMs: number): string {
  const d = new Date(timestampMs + 6 * 60 * 60 * 1000); // BD UTC+6
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
