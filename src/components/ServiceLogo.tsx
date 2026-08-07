import React from "react";

interface ServiceLogoProps {
  name: string;
  className?: string;
  size?: number;
}

export const ServiceLogo: React.FC<ServiceLogoProps> = ({ name, className = "w-7 h-7", size }) => {
  const normalized = (name || "").toUpperCase().trim();
  const customStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  // WHATSAPP
  if (normalized.includes("WHATSAPP") || normalized === "WA") {
    return (
      <div className={`shrink-0 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.5 14.333C17.2 14.183 15.7 13.442 15.42 13.342C15.14 13.242 14.94 13.192 14.74 13.492C14.54 13.792 13.98 14.442 13.81 14.642C13.64 14.842 13.7 14.867 13.17 14.717C12.87 14.567 11.9 14.25 10.75 13.225C9.85 12.425 9.24 11.433 9.07 11.133C8.9 10.833 9.05 10.675 9.2 10.525C9.33 10.392 9.5 10.167 9.65 9.992C9.8 9.817 9.85 9.692 9.95 9.492C10.05 9.292 10 9.117 9.93 8.967C9.86 8.817 9.3 7.442 9.07 6.875C8.84 6.325 8.61 6.4 8.44 6.392C8.28 6.384 8.1 6.384 7.92 6.384C7.74 6.384 7.44 6.45 7.19 6.725C6.94 7 6.24 7.658 6.24 9C6.24 10.342 7.22 11.633 7.35 11.808C7.49 11.983 9.28 14.733 12.02 15.917C12.67 16.2 13.18 16.367 13.57 16.492C14.22 16.7 14.82 16.667 15.29 16.592C15.82 16.508 16.91 15.925 17.14 15.275C17.37 14.625 17.37 14.075 17.3 13.958C17.23 13.842 17.8 14.483 17.5 14.333Z" fill="#25D366" />
          <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 1 .9-2.9-.2-.3A8 8 0 1 1 12 20z" fill="#25D366" />
        </svg>
      </div>
    );
  }

  // FACEBOOK
  if (normalized.includes("FACEBOOK") || normalized === "FB") {
    return (
      <div className={`shrink-0 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
        </svg>
      </div>
    );
  }

  // TELEGRAM
  if (normalized.includes("TELEGRAM") || normalized === "TG") {
    return (
      <div className={`shrink-0 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" fill="#229ED9" />
        </svg>
      </div>
    );
  }

  // IMO
  if (normalized.includes("IMO")) {
    return (
      <div className={`shrink-0 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blue outer speech bubble */}
          <path d="M12 2.2C6.59 2.2 2.2 6.59 2.2 12c0 2.18.7 4.2 1.9 5.84L2.6 21.4a.5.5 0 0 0 .63.63l3.56-1.58A9.74 9.74 0 0 0 12 21.8c5.41 0 9.8-4.39 9.8-9.8S17.41 2.2 12 2.2z" fill="#1D68EC" />
          {/* White inner bubble fill */}
          <path d="M12 4C7.58 4 4 7.58 4 12c0 1.83.61 3.52 1.65 4.88L4.5 19.5l2.97-1.32A7.94 7.94 0 0 0 12 20c4.42 0 8-3.58 8-8s-3.58-8-8-8z" fill="#FFFFFF" />
          {/* Imo text in blue */}
          <text x="12" y="14.2" textAnchor="middle" fill="#1D68EC" fontSize="7.5" fontWeight="900" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="-0.2px">imo</text>
        </svg>
      </div>
    );
  }

  // AUTHMSG / AUTH / LOCK
  if (normalized.includes("AUTH") || normalized.includes("LOCK")) {
    return (
      <div className={`shrink-0 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#8B5CF6" />
          <path d="M12 6c-2.2 0-4 1.8-4 4v2H7c-.6 0-1 .4-1 1v5c0 .6.4 1 1 1h10c.6 0 1-.4 1-1v-5c0-.6-.4-1-1-1h-1v-2c0-2.2-1.8-4-4-4zm-2 4c0-1.1.9-2 2-2s2 .9 2 2v2h-4v-2z" fill="white" />
        </svg>
      </div>
    );
  }

  // CLOUDOTP / CLOUD / OTP
  if (normalized.includes("CLOUD") || normalized.includes("OTP")) {
    return (
      <div className={`shrink-0 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#EC4899" />
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="white" />
        </svg>
      </div>
    );
  }

  // DISCORD
  if (normalized.includes("DISCORD")) {
    return (
      <div className={`shrink-0 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#5865F2" />
        </svg>
      </div>
    );
  }

  // INSTAGRAM
  if (normalized.includes("INSTAGRAM") || normalized.includes("INSTA")) {
    return (
      <div className={`shrink-0 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6zm5.25-9.25a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z" fill="#E1306C" />
        </svg>
      </div>
    );
  }

  // TIKTOK
  if (normalized.includes("TIKTOK")) {
    return (
      <div className={`shrink-0 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.53 2h3.17c.12 1.35.8 2.68 1.94 3.4 1.15.73 2.57.87 3.86.5V9.1c-2.12.02-4.13-.81-5.47-2.33V15c0 3.59-2.91 6.5-6.5 6.5S3 18.59 3 15s2.91-6.5 6.5-6.5c.52 0 1.04.06 1.54.19v3.29c-.48-.19-.99-.28-1.54-.28-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5V2z" fill="#25F4EE" />
        </svg>
      </div>
    );
  }

  // ALYMSCINTL / TELECOM / GLOBE
  if (normalized.includes("ALYMSC") || normalized.includes("INTL")) {
    return (
      <div className={`shrink-0 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="#0EA5E9" strokeWidth="2" fill="none" />
          <ellipse cx="12" cy="12" rx="4" ry="9" stroke="#0EA5E9" strokeWidth="1.5" fill="none" />
          <line x1="3" y1="12" x2="21" y2="12" stroke="#0EA5E9" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  // FAIRPARI / BET / GAMING
  if (normalized.includes("FAIRPARI") || normalized.includes("BET") || normalized.includes("CASINO")) {
    return (
      <div className={`shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#F59E0B" />
        </svg>
      </div>
    );
  }

  // Default fallback for any other service name
  const firstLetter = name.charAt(0).toUpperCase() || "S";
  const bgColors = [
    "from-blue-600 to-cyan-600",
    "from-purple-600 to-indigo-600",
    "from-emerald-600 to-teal-600",
    "from-amber-600 to-orange-600",
    "from-pink-600 to-rose-600",
  ];
  const colorIdx = (name.length + firstLetter.charCodeAt(0)) % bgColors.length;

  return (
    <div
      className={`rounded-lg bg-gradient-to-tr ${bgColors[colorIdx]} text-white font-bold flex items-center justify-center shrink-0 shadow-sm ${className}`}
      style={customStyle}
    >
      <span className="text-xs sm:text-sm leading-none font-black">{firstLetter}</span>
    </div>
  );
};
