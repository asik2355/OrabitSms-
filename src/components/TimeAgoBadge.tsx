import React from "react";
import { Clock } from "lucide-react";

export function formatTimeAgo(reqTimestamp?: number | null, fallbackStr?: string): string {
  if (reqTimestamp && !isNaN(reqTimestamp) && reqTimestamp > 0) {
    const now = Date.now();
    const elapsedMs = Math.max(0, now - reqTimestamp);
    const elapsedSecs = Math.floor(elapsedMs / 1000);
    const elapsedMins = Math.floor(elapsedSecs / 60);
    const elapsedHours = Math.floor(elapsedMins / 60);
    const elapsedDays = Math.floor(elapsedHours / 24);

    if (elapsedSecs < 45) return "Just Now";
    if (elapsedMins < 60) return `${elapsedMins}M Ago`;
    if (elapsedHours < 24) return `${elapsedHours}h Ago`;
    return `${elapsedDays}d Ago`;
  }

  if (fallbackStr) {
    let clean = fallbackStr.split("(")[0].trim();
    clean = clean
      .replace(/(\d+)\s*m\s*ago/i, "$1M Ago")
      .replace(/(\d+)\s*h\s*ago/i, "$1h Ago")
      .replace(/(\d+)\s*d\s*ago/i, "$1d Ago")
      .replace(/just now/i, "Just Now")
      .replace(/(\d+)\s*min\s*ago/i, "$1M Ago");
    if (clean) return clean;
  }

  return "Just Now";
}

interface TimeAgoBadgeProps {
  requestedAt?: number | null;
  timeAgo?: string;
  status?: "SUCCESS" | "FAILED" | "PENDING" | string;
  className?: string;
}

export const TimeAgoBadge: React.FC<TimeAgoBadgeProps> = ({
  requestedAt,
  timeAgo,
  status = "SUCCESS",
  className = "",
}) => {
  const timeText = formatTimeAgo(requestedAt, timeAgo);

  const isSuccess = status === "SUCCESS";
  const isFailed = status === "FAILED";

  const colorStyle = isSuccess
    ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300 shadow-emerald-950/50"
    : isFailed
    ? "bg-rose-950/70 border-rose-500/40 text-rose-300 shadow-rose-950/50"
    : "bg-amber-950/70 border-amber-500/40 text-amber-300 shadow-amber-950/50";

  const dotColor = isSuccess ? "bg-emerald-400" : isFailed ? "bg-rose-400" : "bg-amber-400";
  const iconColor = isSuccess ? "text-emerald-400" : isFailed ? "text-rose-400" : "text-amber-400";

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border shadow-sm backdrop-blur-sm transition-all font-mono text-[11px] sm:text-xs font-bold ${colorStyle} ${className}`}
    >
      {/* Animated Logo / Clock Icon */}
      <Clock className={`w-3.5 h-3.5 ${iconColor} animate-spin [animation-duration:9s] shrink-0`} />

      {/* Formatted Time String like 15M Ago / 8h Ago / Just Now */}
      <span className="tracking-tight whitespace-nowrap">{timeText}</span>
    </div>
  );
};
