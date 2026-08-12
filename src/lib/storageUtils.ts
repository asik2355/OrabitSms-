/**
 * Utility functions for safe browser localStorage interactions with automatic QuotaExceededError handling.
 */

export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    // Handle QuotaExceededError (code 22 or 1014 or QuotaExceededError)
    try {
      // Clean up non-critical cached keys to free up quota
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (
          k &&
          k !== "orabit_user_profile" &&
          k !== "orabit_registered_users" &&
          k !== key
        ) {
          if (
            k.startsWith("orabit_feed_numbers_") ||
            k.includes("temp_") ||
            k.includes("24h_all_hits") ||
            k.includes("methods") ||
            k.includes("history")
          ) {
            localStorage.removeItem(k);
          }
        }
      }
      // Try setting again after cleanup
      localStorage.setItem(key, value);
      return true;
    } catch (retryErr) {
      // Silent fail if browser restricts storage — server state remains in Supabase
      return false;
    }
  }
}

export function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // Silent fail
  }
}

/**
 * Format USD amount accurately handling small fractional cents (e.g. $0.012, $0.006, $0.0008)
 */
export function formatUSD(usdVal: number): string {
  if (usdVal === undefined || usdVal === null || isNaN(usdVal)) return "$0.00";
  const num = Number(usdVal);
  if (num === 0) return "$0.00";

  // Check if multiplying by 100 has a fractional component (sub-cent decimals like 0.012 -> 1.2 cents)
  const cents = num * 100;
  if (Math.abs(cents - Math.round(cents)) > 0.0001) {
    // Sub-cent precision needed! Format up to 4 decimal places without trailing zeros
    let str = num.toFixed(4).replace(/0+$/, "").replace(/\.$/, ".00");
    const parts = str.split(".");
    if (parts.length === 1) str += ".00";
    else if (parts[1].length === 1) str += "0";
    return `$${str}`;
  }
  return `$${num.toFixed(2)}`;
}

/**
 * Format balance display in either BDT or USD cleanly
 */
export function formatCurrencyDisplay(
  amountBDT: number,
  currency: string,
  usdExchangeRate: number = 100
): string {
  if (currency === "BDT") {
    return `৳${(amountBDT || 0).toFixed(2)}`;
  }
  const usdVal = (amountBDT || 0) / usdExchangeRate;
  return formatUSD(usdVal);
}
