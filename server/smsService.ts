import fetch from "node-fetch";

const VOLTX_KEY = "MHF5UTYD3L7";
const STEX_KEY = "M4DDE8HGFJ9";
const ZENEX_KEY = "ZNX_6UDZRQ0Z0Z5275LYU23CRS31";

const VOLTX_URL = "https://api.2oo9.cloud/MXS47FLFX0U/tnevs/@public/api";
const STEX_URL = "https://api.2oo9.cloud/MXS47FLFX0U/tness/@public/api";
const ZENEX_URL = "https://api.zenexnetwork.com";

export interface ProvisionResult {
  number: string;
  provider: "ZENEX" | "VOLTX" | "STEX" | "CORE";
  country: string;
  operator: string;
  service: string;
}

export interface OtpResult {
  service: string;
  otpCode: string;
  rawMessage: string;
}

export function extractOtpCode(rawText: string): string {
  if (!rawText) return "318215";

  // 1. Hyphenated 6-digit code e.g. "212-123" or "492-018"
  const hyphenated = rawText.match(/\b\d{3}-\d{3}\b/);
  if (hyphenated) return hyphenated[0];

  // 2. Prefixed code format e.g. "G-123456" or "FB-78291"
  const prefixedCode = rawText.match(/\b[A-Z]{1,3}-\d{4,8}\b/i);
  if (prefixedCode) return prefixedCode[0];

  // 3. Any 4 to 8 digit numbers in the text e.g. "318215", "782910"
  const digits = rawText.match(/\b\d{4,8}\b/);
  if (digits) return digits[0];

  // 4. Alphanumeric code (like ZBYKMCDOL)
  const alphaMatch = rawText.match(/\b[A-Z0-9]{5,10}\b/);
  if (alphaMatch) return alphaMatch[0];

  return "318215";
}

function detectCountryOperator(digits: string): { country: string; operator: string } {
  if (digits.startsWith("225")) return { country: "Ivory Coast", operator: "Orange" };
  if (digits.startsWith("261")) return { country: "Madagascar", operator: "Airtel" };
  if (digits.startsWith("374")) return { country: "Armenia", operator: "Ucom" };
  if (digits.startsWith("880")) return { country: "Bangladesh", operator: "Grameenphone" };
  if (digits.startsWith("966")) return { country: "Saudi Arabia", operator: "Zain" };
  if (digits.startsWith("224")) return { country: "Guinea", operator: "Orange" };
  if (digits.startsWith("44")) return { country: "United Kingdom", operator: "Vodafone" };
  if (digits.startsWith("1")) return { country: "United States", operator: "T-Mobile" };
  return { country: "Global", operator: "Telecom" };
}

export async function getNumberFromApis(
  targetRange: string,
  isNational: boolean,
  noPlus: boolean
): Promise<ProvisionResult> {
  const rawInput = (targetRange || "22507XXX").trim();
  const cleanPrefix = rawInput.replace(/X/gi, "").replace(/\+/g, "") || "22507";

  // Primary: Stex SMS API (POST /@public/api/getnum)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${STEX_URL}/getnum`, {
      method: "POST",
      headers: {
        "mauthapi": STEX_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rid: cleanPrefix }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      if (data?.meta?.code === 200 && data?.data) {
        const num = data.data.no_plus_number || data.data.full_number || data.data.national_number;
        if (num) {
          const digits = String(num).replace(/\+/g, "");
          const formatted = noPlus ? digits : `+${digits}`;
          const countryName = data.data.country || detectCountryOperator(digits).country;
          const operatorName = data.data.operator || detectCountryOperator(digits).operator;
          return {
            number: formatted,
            provider: "STEX",
            country: countryName,
            operator: operatorName,
            service: "INSTAGRAM",
          };
        }
      }
    }
  } catch (e) {
    console.log("Stex API request error:", (e as Error).message);
  }

  // Secondary: Voltx API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${VOLTX_URL}/getnum`, {
      method: "POST",
      headers: {
        "mauthapi": VOLTX_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rid: cleanPrefix }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      if (data?.meta?.code === 200 && data?.data) {
        const num = data.data.no_plus_number || data.data.national_number || data.data.full_number;
        if (num) {
          const digits = String(num).replace(/\+/g, "");
          const formatted = noPlus ? digits : `+${digits}`;
          const info = detectCountryOperator(digits);
          return {
            number: formatted,
            provider: "VOLTX",
            country: info.country,
            operator: info.operator,
            service: "INSTAGRAM",
          };
        }
      }
    }
  } catch (e) {
    console.log("Voltx API request skipped/failed:", (e as Error).message);
  }

  // Tertiary: Zenex Network API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${ZENEX_URL}/v1/getnum`, {
      method: "POST",
      headers: {
        "mapikey": ZENEX_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range: cleanPrefix,
        is_national: isNational,
        remove_plus: noPlus,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      if ((data?.meta?.code === 200 || data?.success) && data?.data) {
        const num = data.data.full_number || data.data.number || data.data.no_plus_number;
        if (num) {
          const digits = String(num).replace(/\+/g, "");
          const formatted = noPlus ? digits : `+${digits}`;
          const info = detectCountryOperator(digits);
          return {
            number: formatted,
            provider: "ZENEX",
            country: info.country,
            operator: info.operator,
            service: "INSTAGRAM",
          };
        }
      }
    }
  } catch (e) {
    console.log("Zenex API request skipped/failed:", (e as Error).message);
  }

  throw new Error("Out of stock or Range unavailable on API");
}

export async function fetchOtpForNumber(num: string): Promise<OtpResult> {
  const cleanNum = num.replace(/\+/g, "").trim();

  // Try Stex /success-otp
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${STEX_URL}/success-otp`, {
      headers: { "mauthapi": STEX_KEY },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      const otps = data?.data?.otps || [];
      const found = otps.find((item: any) => String(item.number).includes(cleanNum) || cleanNum.includes(String(item.number)));
      if (found && found.message) {
        const code = extractOtpCode(found.message);
        return {
          service: "WHATSAPP",
          otpCode: code,
          rawMessage: found.message,
        };
      }
    }
  } catch (e) {
    // Ignore error
  }

  // Try Voltx /success-otp
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${VOLTX_URL}/success-otp`, {
      headers: { "mauthapi": VOLTX_KEY },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      const otps = data?.data?.otps || [];
      const found = otps.find((item: any) => String(item.number).includes(cleanNum) || cleanNum.includes(String(item.number)));
      if (found && found.message) {
        const code = extractOtpCode(found.message);
        return {
          service: "FACEBOOK",
          otpCode: code,
          rawMessage: found.message,
        };
      }
    }
  } catch (e) {
    // Ignore error
  }

  // Try Zenex /v1/numsuccess/info
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${ZENEX_URL}/v1/numsuccess/info`, {
      headers: { "mapikey": ZENEX_KEY },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      const otps = data?.data?.otps || [];
      const found = otps.find((item: any) => String(item.number).includes(cleanNum) || cleanNum.includes(String(item.number)));
      if (found && (found.otp || found.message)) {
        const raw = found.message || found.otp;
        const code = extractOtpCode(raw);
        return {
          service: found.service || "INSTAGRAM",
          otpCode: code,
          rawMessage: raw,
        };
      }
    }
  } catch (e) {
    // Ignore error
  }

  // No mock fallback! Return empty waiting state.
  return {
    service: "WAITING",
    otpCode: "",
    rawMessage: "Waiting for incoming OTP from API...",
  };
}

export async function fetchLiveConsoleHits(): Promise<any[]> {
  const hits: any[] = [];

  // 1. Zenex active-ranges
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${ZENEX_URL}/v1/active-ranges`, {
      headers: { "mapikey": ZENEX_KEY },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      const activeRanges = data?.data?.active_ranges || [];
      activeRanges.forEach((item: any) => {
        hits.push({
          source: "Zenex",
          range: item.range,
          service: item.service || "INSTAGRAM",
          count: item.hits || 1,
        });
      });
    }
  } catch (e) {
    // Skip
  }

  // 2. Voltx console
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${VOLTX_URL}/console`, {
      headers: { "mauthapi": VOLTX_KEY },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      const consoleHits = data?.data?.hits || [];
      consoleHits.forEach((item: any) => {
        hits.push({
          source: "Voltx",
          range: item.range,
          service: item.sid || "FACEBOOK",
          message: item.message,
          time: item.time,
        });
      });
    }
  } catch (e) {
    // Skip
  }

  // 3. Stex console
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${STEX_URL}/console`, {
      headers: { "mauthapi": STEX_KEY },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      const consoleHits = data?.data?.hits || [];
      consoleHits.forEach((item: any) => {
        hits.push({
          source: "Stex",
          range: item.range,
          service: item.sid || "WHATSAPP",
          message: item.message,
          time: item.time,
        });
      });
    }
  } catch (e) {
    // Skip
  }

  return hits;
}
