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
