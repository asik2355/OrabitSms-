import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface TurnstileCaptchaProps {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
  widgetRef?: React.MutableRefObject<{ reset: () => void } | null>;
}

export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAAEJRiOpuwNpODIuQ";

export const TurnstileCaptcha: React.FC<TurnstileCaptchaProps> = ({
  siteKey = TURNSTILE_SITE_KEY,
  onVerify,
  onExpire,
  onError,
  theme = "dark",
  className = "",
  widgetRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [scriptError, setScriptError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      // Clean up existing widget if present
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore cleanup error
        }
        widgetIdRef.current = null;
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (isMounted) onVerify(token);
          },
          "error-callback": () => {
            if (isMounted) {
              if (onError) onError();
            }
          },
          "expired-callback": () => {
            if (isMounted) {
              if (onExpire) onExpire();
            }
          },
          theme: theme,
        });
        widgetIdRef.current = id;
        setIsLoaded(true);
      } catch (err) {
        console.error("Turnstile render error:", err);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      // Check if script element already exists
      let script = document.getElementById("cloudflare-turnstile-script") as HTMLScriptElement;

      if (!script) {
        script = document.createElement("script");
        script.id = "cloudflare-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
        script.async = true;
        script.defer = true;

        window.onloadTurnstileCallback = () => {
          if (isMounted) renderWidget();
        };

        script.onerror = () => {
          if (isMounted) setScriptError(true);
        };

        document.head.appendChild(script);
      } else {
        const previousOnload = window.onloadTurnstileCallback;
        window.onloadTurnstileCallback = () => {
          if (previousOnload) previousOnload();
          if (isMounted) renderWidget();
        };

        // If turnstile loaded after check
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            if (isMounted) renderWidget();
          }
        }, 100);

        return () => {
          clearInterval(interval);
          isMounted = false;
        };
      }
    }

    if (widgetRef) {
      widgetRef.current = {
        reset: () => {
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        },
      };
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [siteKey, theme]);

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 py-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Bot & Human Security Verification</span>
      </div>

      <div
        ref={containerRef}
        className="min-h-[65px] flex items-center justify-center rounded-xl overflow-hidden bg-slate-900/60 p-1 border border-slate-800"
      >
        {!isLoaded && !scriptError && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-3 px-4">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Loading Turnstile Protection...</span>
          </div>
        )}
        {scriptError && (
          <div className="text-xs text-rose-400 py-2 px-3">
            Failed to load Security Captcha.
          </div>
        )}
      </div>
    </div>
  );
};
