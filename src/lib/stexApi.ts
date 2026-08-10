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
 * Handles continuous digits (082945), spaced digits (082 945), hyphenated (082-945), prefixed (FB-12345), etc.
 */
export function extractOtpFromMessage(rawText: string): string {
  if (!rawText) return "------";

  // 1. Spaced 6-digit code e.g. "082 945" or "212 123"
  const spacedSix = rawText.match(/\b\d{3}\s\d{3}\b/);
  if (spacedSix) return spacedSix[0].replace(/\s/g, "");

  // 2. Hyphenated 6-digit code e.g. "212-123" or "082-945"
  const hyphenated = rawText.match(/\b\d{3}-\d{3}\b/);
  if (hyphenated) return hyphenated[0].replace("-", "");

  // 3. Any 3-4 digits + space/hyphen + 3-4 digits e.g. "082 945", "1234 567"
  const spacedDigits = rawText.match(/\b\d{3,4}[\s-]\d{3,4}\b/);
  if (spacedDigits) return spacedDigits[0].replace(/[\s-]/g, "");

  // 4. Code following keywords e.g. "code: 082 945", "is 082 945", "Instagram code: 082 945"
  const keywordMatch = rawText.match(/(?:code|otp|is|pin|verificacion)[\s:-]+(\d{3}[\s-]?\d{3}|\d{4,8})/i);
  if (keywordMatch && keywordMatch[1]) {
    return keywordMatch[1].replace(/[\s-]/g, "");
  }

  // 5. Code preceding keywords e.g. "082 945 is your Instagram code"
  const codeBeforeWords = rawText.match(/(\d{3}[\s-]?\d{3}|\d{4,8})[\s:-]+is your/i);
  if (codeBeforeWords && codeBeforeWords[1]) {
    return codeBeforeWords[1].replace(/[\s-]/g, "");
  }

  // 6. Prefixed code e.g. "FB-83951" or "G-123456"
  const prefixed = rawText.match(/\b[A-Z]{1,3}[-\s]\d{4,8}\b/i);
  if (prefixed) return prefixed[0].replace(/\s+/g, "");

  // 7. Standalone 4 to 8 digit sequence e.g. "082945", "318215"
  const digits = rawText.match(/\b\d{4,8}\b/);
  if (digits) return digits[0];

  // 8. Any 3 digits + space + 3 digits anywhere in text
  const anySpaced33 = rawText.match(/\d{3}\s+\d{3}/);
  if (anySpaced33) return anySpaced33[0].replace(/\s+/g, "");

  // 9. Alphanumeric code
  const alpha = rawText.match(/\b[A-Z0-9]{5,10}\b/);
  if (alpha) return alpha[0];

  return "------";
}

/**
 * Maps a phone number or range prefix to real country, operator and iso
 */
export function getCountryAndOperatorFromRange(range: string): { country: string; operator: string; iso: string } {
  if (!range) return { country: "GLOBAL", operator: "GSM CORE", iso: "un" };
  const clean = range.replace(/\D/g, "");

  if (clean.startsWith("382")) return { country: "MONTENEGRO", operator: "TELENOR", iso: "me" };
  if (clean.startsWith("224")) return { country: "GUINEA", operator: "ORANGE", iso: "gn" };
  if (clean.startsWith("992")) return { country: "TAJIKISTAN", operator: "BABILON-M", iso: "tj" };
  if (clean.startsWith("880")) return { country: "BANGLADESH", operator: "ROBI", iso: "bd" };
  if (clean.startsWith("261")) return { country: "MADAGASCAR", operator: "AIRTEL", iso: "mg" };
  if (clean.startsWith("225")) return { country: "IVORY COAST", operator: "ORANGE", iso: "ci" };
  if (clean.startsWith("228")) return { country: "TOGO", operator: "TOGOCOM", iso: "tg" };
  if (clean.startsWith("229")) return { country: "BENIN", operator: "MTN", iso: "bj" };
  if (clean.startsWith("237")) return { country: "CAMEROON", operator: "ORANGE", iso: "cm" };
  if (clean.startsWith("233")) return { country: "GHANA", operator: "MTN", iso: "gh" };
  if (clean.startsWith("380")) return { country: "UKRAINE", operator: "KYIVSTAR", iso: "ua" };
  if (clean.startsWith("966")) return { country: "SAUDI ARABIA", operator: "STC", iso: "sa" };
  if (clean.startsWith("996")) return { country: "KYRGYZSTAN", operator: "MEGACOM", iso: "kg" };
  if (clean.startsWith("257")) return { country: "BURUNDI", operator: "LUMITEL", iso: "bi" };
  if (clean.startsWith("254")) return { country: "KENYA", operator: "SAFARICOM", iso: "ke" };
  if (clean.startsWith("387")) return { country: "BOSNIA", operator: "BH TELECOM", iso: "ba" };
  if (clean.startsWith("216")) return { country: "TUNISIA", operator: "OOREDOO", iso: "tn" };
  if (clean.startsWith("959")) return { country: "MYANMAR", operator: "MPT", iso: "mm" };
  if (clean.startsWith("232")) return { country: "SIERRA LEONE", operator: "AFRICELL", iso: "sl" };
  if (clean.startsWith("236")) return { country: "CENTRAL AFRICA", operator: "TELECEL", iso: "cf" };
  if (clean.startsWith("223")) return { country: "MALI", operator: "MALITEL", iso: "ml" };
  if (clean.startsWith("962")) return { country: "JORDAN", operator: "ZAIN", iso: "jo" };
  if (clean.startsWith("964")) return { country: "IRAQ", operator: "ASIACELL", iso: "iq" };
  if (clean.startsWith("642")) return { country: "NEW ZEALAND", operator: "SPARK", iso: "nz" };

  return { country: "GLOBAL", operator: "GSM CORE", iso: "un" };
}

/**
 * Masks OTP codes inside raw SMS messages with asterisks for security in console stream
 */
export function maskMessageOtp(raw: string): string {
  if (!raw) return "";

  // If already contains asterisks or masked pattern, return as is
  if (raw.includes("*****") || raw.includes("*** ***") || raw.includes("***-***")) return raw;

  let masked = raw;

  // 1. Spaced or hyphenated 6 digits e.g. "082 945" or "082-945" -> "*** ***"
  masked = masked.replace(/\b\d{3}[\s-]\d{3}\b/g, "*** ***");

  // 2. Prefixed codes e.g. "G-123456" -> "G-*****", "FB-78291" -> "FB-*****"
  masked = masked.replace(/\b([A-Z]{1,3}-)\d{4,8}\b/gi, "$1*****");

  // 3. Standalone 4 to 8 digit numbers -> "*****"
  masked = masked.replace(/\b\d{4,8}\b/g, "*****");

  return masked;
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (proxyError) {
    // Fallback to direct Stex API call
    try {
      const directRes = await fetch("https://api.2oo9.cloud/MXS47FLFX0U/tness/@public/api/getnum", {
        method: "POST",
        headers: {
          "mauthapi": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rid: params.query }),
      });
      return await directRes.json();
    } catch (directError: any) {
      return {
        meta: { code: 500, status: "error" },
        data: null,
        message: directError.message || "Network error requesting Stex number",
      };
    }
  }
}

/**
 * Fetch latest OTP messages from Stex SMS API
 */
export async function fetchStexOtps(apiKey?: string): Promise<StexOtpResponse> {
  const key = apiKey || DEFAULT_STEX_API_KEY;
  try {
    const res = await fetch(`/api/stex/success-otp?apiKey=${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (proxyError) {
    // Fallback to direct Stex API call
    try {
      const directRes = await fetch("https://api.2oo9.cloud/MXS47FLFX0U/tness/@public/api/success-otp", {
        method: "GET",
        headers: {
          "mauthapi": key,
        },
      });
      return await directRes.json();
    } catch (directError) {
      return {
        meta: { code: 500, status: "error" },
      };
    }
  }
}

/**
 * Fetch live access active services and ranges from Stex SMS API
 */
export async function fetchStexLiveAccess(apiKey?: string): Promise<any> {
  const key = apiKey || DEFAULT_STEX_API_KEY;
  try {
    const res = await fetch(`/api/stex/liveaccess?apiKey=${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (proxyError) {
    try {
      const directRes = await fetch("https://api.2oo9.cloud/MXS47FLFX0U/tness/@public/api/liveaccess", {
        method: "GET",
        headers: {
          "mauthapi": key,
        },
      });
      return await directRes.json();
    } catch (directError) {
      return {
        meta: { code: 500, status: "error" },
      };
    }
  }
}

/**
 * Fetch live console hits from Stex SMS API
 */
export async function fetchStexConsole(apiKey?: string): Promise<StexConsoleResponse> {
  const key = apiKey || DEFAULT_STEX_API_KEY;
  try {
    const res = await fetch(`/api/stex/console?apiKey=${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (proxyError) {
    // Fallback to direct Stex API call
    try {
      const directRes = await fetch("https://api.2oo9.cloud/MXS47FLFX0U/tness/@public/api/console", {
        method: "GET",
        headers: {
          "mauthapi": key,
        },
      });
      return await directRes.json();
    } catch (directError) {
      return {
        meta: { code: 500, status: "error" },
      };
    }
  }
}
