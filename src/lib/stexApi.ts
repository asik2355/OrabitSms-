export const DEFAULT_STEX_API_KEY = "M4DDE8HGFJ9";

export interface StexGetNumResponse {
  meta: {
    code: number;
    status: string;
  };
  data: {
    country?: string;
    full_number?: string;
    national_number?: string;
    no_plus_number?: string;
    operator?: string;
  } | null;
  message?: string;
  rid?: string;
}

export interface StexOtpItem {
  message: string;
  number: string;
  otp_id: string;
  time: number | string;
  extractedCode?: string;
}

export interface StexOtpResponse {
  meta: {
    code: number;
    status: string;
  };
  data?: {
    cached?: boolean;
    otps?: StexOtpItem[];
  };
}

export interface StexConsoleHit {
  message: string;
  range: string;
  sid: string;
  time: number | string;
}

export interface StexConsoleResponse {
  meta: {
    code: number;
    status: string;
  };
  data?: {
    cached?: boolean;
    hits?: StexConsoleHit[];
  };
}

/**
 * Helper to extract 4-6 digit OTP code from raw SMS text.
 */
export function extractOtpFromMessage(rawText: string): string {
  if (!rawText) return "------";

  // 1. Hyphenated 6-digit code e.g. "212-123" or "492-018"
  const hyphenated = rawText.match(/\b\d{3}-\d{3}\b/);
  if (hyphenated) return hyphenated[0];

  // 2. Prefixed code e.g. "FB-83951" or "G-123456"
  const prefixed = rawText.match(/\b[A-Z]{1,3}-\d{4,8}\b/i);
  if (prefixed) return prefixed[0];

  // 3. 4 to 8 digit sequence e.g. "83951", "032240", "318215"
  const digits = rawText.match(/\b\d{4,8}\b/);
  if (digits) return digits[0];

  // 4. Alphanumeric code
  const alpha = rawText.match(/\b[A-Z0-9]{5,10}\b/);
  if (alpha) return alpha[0];

  return "------";
}

/**
 * Request a phone number from Stex SMS API
 */
export async function requestStexNumber(params: {
  query: string;
  apiKey?: string;
}): Promise<StexGetNumResponse> {
  const key = params.apiKey || DEFAULT_STEX_API_KEY;
  try {
    const res = await fetch("/api/stex/getnum", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: params.query,
        apiKey: key,
      }),
    });
    return await res.json();
  } catch (error: any) {
    console.error("Stex requestStexNumber error:", error);
    return {
      meta: { code: 500, status: "error" },
      data: null,
      message: error.message || "Network error requesting Stex number",
    };
  }
}

/**
 * Fetch latest OTP messages from Stex SMS API
 */
export async function fetchStexOtps(apiKey?: string): Promise<StexOtpResponse> {
  const key = apiKey || DEFAULT_STEX_API_KEY;
  try {
    const res = await fetch(`/api/stex/success-otp?apiKey=${encodeURIComponent(key)}`);
    return await res.json();
  } catch (error: any) {
    console.error("Stex fetchStexOtps error:", error);
    return {
      meta: { code: 500, status: "error" },
    };
  }
}

/**
 * Fetch live console hits from Stex SMS API
 */
export async function fetchStexConsole(apiKey?: string): Promise<StexConsoleResponse> {
  const key = apiKey || DEFAULT_STEX_API_KEY;
  try {
    const res = await fetch(`/api/stex/console?apiKey=${encodeURIComponent(key)}`);
    return await res.json();
  } catch (error: any) {
    console.error("Stex fetchStexConsole error:", error);
    return {
      meta: { code: 500, status: "error" },
    };
  }
}
