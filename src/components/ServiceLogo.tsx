import React from "react";

export const PRELOAD_SERVICE_LOGOS: string[] = [];

interface ServiceLogoProps {
  name: string;
  className?: string;
  size?: number;
}

export const ServiceLogo: React.FC<ServiceLogoProps> = ({ name, className = "w-7 h-7", size }) => {
  const normalized = (name || "").toUpperCase().trim();
  const customStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  // 1. WHATSAPP
  if (normalized.includes("WHATSAPP") || normalized === "WA") {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-[#25D366] shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full p-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 2.137.671 4.116 1.815 5.742L2.5 21.5l3.914-1.28A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm.05 16.5c-1.63 0-3.15-.43-4.46-1.19l-.32-.19-2.32.76.77-2.26-.21-.34A7.95 7.95 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8.5-7.95 8.5zm4.33-6.22c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z" fill="white"/>
        </svg>
      </div>
    );
  }

  // 2. FACEBOOK
  if (normalized.includes("FACEBOOK") || normalized === "FB") {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-[#1877F2] shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full p-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/>
        </svg>
      </div>
    );
  }

  // 3. TELEGRAM
  if (normalized.includes("TELEGRAM") || normalized === "TG") {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-[#229ED9] shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full p-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.43 3.8-1.58 4.59-1.86 5.1-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.01.07.01.24 0 .38z" fill="white"/>
        </svg>
      </div>
    );
  }

  // 4. INSTAGRAM
  if (normalized.includes("INSTAGRAM") || normalized.includes("INSTA")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full p-1.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      </div>
    );
  }

  // 5. IMO
  if (normalized.includes("IMO")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-[#0091FF] text-white font-black shadow-sm select-none ${className}`} style={customStyle}>
        <span className="text-[10px] sm:text-xs tracking-tighter font-extrabold uppercase italic">imo</span>
      </div>
    );
  }

  // 6. DISCORD
  if (normalized.includes("DISCORD")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-[#5865F2] shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full p-1.5" viewBox="0 0 24 24" fill="white">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
        </svg>
      </div>
    );
  }

  // 7. BIGO
  if (normalized.includes("BIGO")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-[#00D2C2] text-white font-extrabold shadow-sm select-none ${className}`} style={customStyle}>
        <span className="text-[9px] sm:text-[10px] font-black tracking-tighter uppercase">BIGO</span>
      </div>
    );
  }

  // 8. TIKTOK
  if (normalized.includes("TIKTOK")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-black shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full p-1.5" viewBox="0 0 24 24" fill="white">
          <path d="M12.525 2.015a.053.053 0 0 0-.05.053v13.119a3.252 3.252 0 1 1-3.252-3.252c.24 0 .474.026.7.076a.05.05 0 0 0 .061-.049V9.123a.05.05 0 0 0-.039-.049 6.002 6.002 0 1 0 5.83 5.992V7.12a8.13 8.13 0 0 0 4.686 1.48.05.05 0 0 0 .05-.05V5.72a.05.05 0 0 0-.05-.05 5.258 5.258 0 0 1-4.707-3.627.05.05 0 0 0-.048-.028h-3.181z"/>
        </svg>
      </div>
    );
  }

  // 9. APPLE
  if (normalized.includes("APPLE")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-black shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full p-1.5" viewBox="0 0 24 24" fill="white">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.1-.98.04-2.18.66-2.88 1.47-.62.72-1.16 1.88-.99 3.01 1.09.09 2.22-.56 2.88-1.38"/>
        </svg>
      </div>
    );
  }

  // 10. MICROSOFT
  if (normalized.includes("MICROSOFT") || normalized.includes("MSFT")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-[#1E1E1E] shadow-sm select-none ${className}`} style={customStyle}>
        <div className="grid grid-cols-2 gap-0.5 p-1.5 w-full h-full">
          <div className="bg-[#F25022]"></div>
          <div className="bg-[#7FBA00]"></div>
          <div className="bg-[#00A4EF]"></div>
          <div className="bg-[#FFB900]"></div>
        </div>
      </div>
    );
  }

  // 11. GOOGLE
  if (normalized.includes("GOOGLE")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-white border border-slate-700/50 shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full p-1" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      </div>
    );
  }

  // 12. NETFLIX
  if (normalized.includes("NETFLIX")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-black shadow-sm select-none ${className}`} style={customStyle}>
        <span className="text-[#E50914] font-black text-xs sm:text-sm tracking-tighter">N</span>
      </div>
    );
  }

  // 13. AUTHMSG / AUTH / LOCK
  if (normalized.includes("AUTH") || normalized.includes("LOCK")) {
    return (
      <div className={`shrink-0 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full pointer-events-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#8B5CF6" />
          <path d="M12 6c-2.2 0-4 1.8-4 4v2H7c-.6 0-1 .4-1 1v5c0 .6.4 1 1 1h10c.6 0 1-.4 1-1v-5c0-.6-.4-1-1-1h-1v-2c0-2.2-1.8-4-4-4zm-2 4c0-1.1.9-2 2-2s2 .9 2 2v2h-4v-2z" fill="white" />
        </svg>
      </div>
    );
  }

  // 14. CLOUDOTP / CLOUD / OTP
  if (normalized.includes("CLOUD") || normalized.includes("OTP")) {
    return (
      <div className={`shrink-0 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full pointer-events-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#EC4899" />
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="white" />
        </svg>
      </div>
    );
  }

  // 15. FAIRPARI / BET / GAMING
  if (normalized.includes("FAIRPARI") || normalized.includes("BET") || normalized.includes("CASINO")) {
    return (
      <div className={`shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full pointer-events-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#F59E0B" />
        </svg>
      </div>
    );
  }

  // 16. ALYMSCINTL / TELECOM / GLOBE / INTL
  if (normalized.includes("ALYMSC") || normalized.includes("INTL") || normalized.includes("GLOBE")) {
    return (
      <div className={`shrink-0 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full pointer-events-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="#0EA5E9" strokeWidth="2" fill="none" />
          <ellipse cx="12" cy="12" rx="4" ry="9" stroke="#0EA5E9" strokeWidth="1.5" fill="none" />
          <line x1="3" y1="12" x2="21" y2="12" stroke="#0EA5E9" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  // 17. BKASH
  if (normalized.includes("BKASH")) {
    return (
      <div className={`shrink-0 rounded-lg bg-[#E2136E] text-white font-extrabold flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <span className="text-[9px] sm:text-[10px] font-black tracking-tighter uppercase italic">bKash</span>
      </div>
    );
  }

  // 18. NAGAD
  if (normalized.includes("NAGAD")) {
    return (
      <div className={`shrink-0 rounded-lg bg-[#F26522] text-white font-extrabold flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <span className="text-[9px] sm:text-[10px] font-black tracking-tighter uppercase italic">Nagad</span>
      </div>
    );
  }

  // 19. BINANCE
  if (normalized.includes("BINANCE")) {
    return (
      <div className={`shrink-0 rounded-lg bg-[#F0B90B] text-black font-extrabold flex items-center justify-center p-1 shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="#000000">
          <path d="M12 2l3.2 3.2-3.2 3.2-3.2-3.2L12 2zm0 13.6l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm6.8-6.8l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zM5.2 8.8l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm6.8 0l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2z"/>
        </svg>
      </div>
    );
  }

  // 20. BEP20 / BSC
  if (normalized.includes("BEP") || normalized.includes("BSC")) {
    return (
      <div className={`shrink-0 rounded-lg bg-[#10B981] text-white font-extrabold flex items-center justify-center p-1 shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="white">
          <path d="M12 2l3.2 3.2-3.2 3.2-3.2-3.2L12 2zm0 13.6l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm6.8-6.8l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zM5.2 8.8l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm6.8 0l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2z"/>
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
