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

  // WHATSAPP
  if (normalized.includes("WHATSAPP") || normalized === "WA") {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#25D366" />
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" fill="white"/>
          <path d="M12 2a10 10 0 00-7.85 16.18L3 21l2.9-1.11A10 10 0 1012 2zm0 18a7.96 7.96 0 01-4.07-1.12l-.29-.17-3.02 1.15 1.16-2.95-.19-.31A7.97 7.97 0 1112 20z" fill="white"/>
        </svg>
      </div>
    );
  }

  // FACEBOOK
  if (normalized.includes("FACEBOOK") || normalized === "FB") {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#1877F2" />
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white"/>
        </svg>
      </div>
    );
  }

  // TELEGRAM
  if (normalized.includes("TELEGRAM") || normalized === "TG") {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#229ED9" />
          <path d="M18.3 5.71a.83.83 0 00-.89-.13L3.84 10.74a.83.83 0 00.08 1.54l3.52 1.13 1.36 4.15a.83.83 0 001.38.31l2.02-2.02 3.72 2.75a.83.83 0 001.31-.53l2.2-11.88a.83.83 0 00-.13-.48zM9.54 12.78l6.3-4.22-4.78 5.12-.22 2.33-.88-2.68-.42-.55z" fill="white"/>
        </svg>
      </div>
    );
  }

  // APPLE
  if (normalized.includes("APPLE")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#000000" />
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.27c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.63 1.34-.56.65-.96 1.72-.83 2.76.99.08 2.02-.49 2.54-1.25z" fill="white"/>
        </svg>
      </div>
    );
  }

  // MICROSOFT
  if (normalized.includes("MICROSOFT") || normalized.includes("MSFT")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#0F172A" />
          <rect x="4" y="4" width="7.5" height="7.5" fill="#F25022"/>
          <rect x="12.5" y="4" width="7.5" height="7.5" fill="#7FBA00"/>
          <rect x="4" y="12.5" width="7.5" height="7.5" fill="#00A4EF"/>
          <rect x="12.5" y="12.5" width="7.5" height="7.5" fill="#FFB900"/>
        </svg>
      </div>
    );
  }

  // BIGO
  if (normalized.includes("BIGO")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#00D2C2" />
          <path d="M12 4l2.5 5.1 5.6.8-4 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4-4 5.6-.8z" fill="white"/>
          <circle cx="12" cy="12" r="2.5" fill="#00D2C2"/>
        </svg>
      </div>
    );
  }

  // IMO
  if (normalized.includes("IMO")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#0088CC" />
          <path d="M12 4c-4.42 0-8 3.13-8 7 0 2.2 1.18 4.16 3.02 5.43L6 20l3.8-1.25c.7.17 1.44.25 2.2.25 4.42 0 8-3.13 8-7s-3.58-7-8-7z" fill="white"/>
          <text x="12" y="13.2" fontSize="6.5" fontWeight="900" fill="#0088CC" textAnchor="middle" fontFamily="sans-serif">imo</text>
        </svg>
      </div>
    );
  }

  // AUTHMSG / AUTH / LOCK
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

  // CLOUDOTP / CLOUD / OTP
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

  // DISCORD
  if (normalized.includes("DISCORD")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#5865F2" />
          <path d="M19.27 5.33A15.94 15.94 0 0015.34 4a.07.07 0 00-.07.03 10.97 10.97 0 00-.48 1A14.68 14.68 0 009.2 5a10.87 10.87 0 00-.48-1 .07.07 0 00-.07-.03A15.9 15.9 0 004.72 5.33a.06.06 0 00-.03.02C1.78 9.72.98 14 1.38 18.23a.07.07 0 00.03.05 16.03 16.03 0 004.83 2.44.07.07 0 00.08-.02c.37-.5.7-1.03.98-1.58a.07.07 0 00-.04-.1 10.5 10.5 0 01-1.5-.72.07.07 0 010-.12c.1-.07.2-.15.3-.23a.07.07 0 01.07-.01 11.4 11.4 0 0012.87 0 .07.07 0 01.07.01c.1.08.2.16.3.23a.07.07 0 010 .12c-.48.28-.98.52-1.5.72a.07.07 0 00-.04.1c.29.56.61 1.08.98 1.58a.07.07 0 00.08.02 16.02 16.02 0 004.84-2.44.07.07 0 00.03-.05c.48-4.88-.81-9.12-3.37-12.88a.06.06 0 00-.03-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z" fill="white"/>
        </svg>
      </div>
    );
  }

  // INSTAGRAM
  if (normalized.includes("INSTAGRAM") || normalized.includes("INSTA")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="url(#instaGrad)" />
          <defs>
            <linearGradient id="instaGrad" x1="0" y1="24" x2="24" y2="0">
              <stop offset="0%" stopColor="#833AB4"/>
              <stop offset="50%" stopColor="#FD1D1D"/>
              <stop offset="100%" stopColor="#FCB045"/>
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="16" height="16" rx="5" stroke="white" strokeWidth="1.8" fill="none"/>
          <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.8" fill="none"/>
          <circle cx="16.5" cy="7.5" r="1" fill="white"/>
        </svg>
      </div>
    );
  }

  // TIKTOK
  if (normalized.includes("TIKTOK")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#000000" />
          <path d="M16.6 8.2a4.8 4.8 0 01-3.1-1.1v6.5a4.8 4.8 0 11-4.8-4.8c.3 0 .6 0 .9.1V11a2.8 2.8 0 102 2.7V3h2.1a4.8 4.8 0 002.9 3.2v2a4.8 4.8 0 01-2-.1z" fill="#25F4EE"/>
          <path d="M16.1 7.7a4.8 4.8 0 01-3.1-1.1v6.5a4.8 4.8 0 11-4.8-4.8c.3 0 .6 0 .9.1V10.5a2.8 2.8 0 102 2.7V2.5h2.1a4.8 4.8 0 002.9 3.2v2a4.8 4.8 0 01-2-.2z" fill="#FE2C55" opacity="0.9"/>
          <path d="M16.3 8a4.8 4.8 0 01-3.1-1.1v6.5a4.8 4.8 0 11-4.8-4.8c.3 0 .6 0 .9.1V10.8a2.8 2.8 0 102 2.7V2.8h2.1a4.8 4.8 0 002.9 3.2v2a4.8 4.8 0 01-2-.2z" fill="white"/>
        </svg>
      </div>
    );
  }

  // GOOGLE
  if (normalized.includes("GOOGLE") || normalized.includes("GMAIL")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#FFFFFF" />
          <path d="M20 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h4.5c-.2 1.1-0.8 2.05-1.75 2.7l2.8 2.2c1.65-1.5 2.45-3.75 2.45-6.91z" fill="#4285F4"/>
          <path d="M12 20c2.15 0 3.95-.7 5.25-1.9l-2.8-2.2c-.7.5-1.6.8-2.45.8-1.9 0-3.5-1.3-4.1-3H5.1v2.3C6.4 18.6 9 20 12 20z" fill="#34A853"/>
          <path d="M7.9 13.7c-.15-.45-.25-.95-.25-1.7s.1-1.25.25-1.7V8H5.1C4.4 9.4 4 10.6 4 12s.4 2.6 1.1 4l2.8-2.3z" fill="#FBBC05"/>
          <path d="M12 7.2c1.15 0 2.2.4 3 1.15l2.25-2.25C15.9 4.8 14.15 4 12 4 9 4 6.4 5.4 5.1 8l2.8 2.3c.6-1.7 2.2-3.1 4.1-3.1z" fill="#EA4335"/>
        </svg>
      </div>
    );
  }

  // NETFLIX
  if (normalized.includes("NETFLIX")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#000000" />
          <path d="M6 4h3.5l5 11V4h3.5v16h-3.5l-5-11v11H6V4z" fill="#E50914"/>
        </svg>
      </div>
    );
  }

  // ALYMSCINTL / TELECOM / GLOBE
  if (normalized.includes("ALYMSC") || normalized.includes("INTL")) {
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

  // FAIRPARI / BET / GAMING
  if (normalized.includes("FAIRPARI") || normalized.includes("BET") || normalized.includes("CASINO")) {
    return (
      <div className={`shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full pointer-events-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#F59E0B" />
        </svg>
      </div>
    );
  }

  // BKASH (Animated/Glow Payment Method & Service Logo)
  if (normalized.includes("BKASH")) {
    return (
      <div className={`shrink-0 rounded-xl bg-gradient-to-tr from-[#D10060] via-[#E2136E] to-[#FF4B97] p-0.5 border border-[#FF65A8]/60 shadow-md shadow-[#E2136E]/30 relative overflow-hidden group flex items-center justify-center select-none ${className}`} style={customStyle}>
        <div className="w-full h-full rounded-[10px] bg-[#180814] relative z-10 flex items-center justify-center p-1 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 48 L48 18 L48 68 Z" fill="#FFFFFF" />
            <path d="M48 18 L88 22 L58 48 Z" fill="#FFF0F5" />
            <path d="M48 48 L82 82 L48 68 Z" fill="#FFFFFF" />
            <path d="M48 68 L28 88 L42 68 Z" fill="#FFE4EC" />
            <path d="M48 48 L15 48 L48 68 Z" fill="#FFC1E3" opacity="0.9" />
          </svg>
        </div>
      </div>
    );
  }

  // NAGAD (Animated/Glow Payment Method & Service Logo)
  if (normalized.includes("NAGAD")) {
    return (
      <div className={`shrink-0 rounded-xl bg-gradient-to-tr from-[#D9381E] via-[#F26522] to-[#FF8042] p-0.5 border border-[#FF9E66]/60 shadow-md shadow-[#F26522]/30 relative overflow-hidden group flex items-center justify-center select-none ${className}`} style={customStyle}>
        <div className="w-full h-full rounded-[10px] bg-[#1a0b06] relative z-10 flex items-center justify-center p-1 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10 C30 25 15 45 25 70 C30 82 45 90 60 85 C75 80 88 65 80 45 C72 25 50 10 50 10 Z" fill="#FFFFFF" />
            <path d="M50 25 C38 35 28 50 35 68 C38 76 48 82 58 78 C68 74 76 62 70 48 C64 34 50 25 50 25 Z" fill="#FFD000" />
            <circle cx="50" cy="50" r="10" fill="#F26522" />
          </svg>
        </div>
      </div>
    );
  }

  // BINANCE
  if (normalized.includes("BINANCE")) {
    return (
      <div className={`shrink-0 rounded-xl bg-[#1E2329] p-0.5 border border-[#F0B90B]/50 shadow-md shadow-[#F0B90B]/20 relative overflow-hidden flex items-center justify-center select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full p-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 L64 29 L50 43 L36 29 Z" fill="#F0B90B" />
          <path d="M22 43 L36 29 L50 43 L36 57 Z" fill="#F0B90B" />
          <path d="M78 43 L64 29 L50 43 L64 57 Z" fill="#F0B90B" />
          <path d="M50 71 L64 57 L50 43 L36 57 Z" fill="#F0B90B" />
          <path d="M50 85 L64 71 L50 57 L36 71 Z" fill="#F0B90B" />
        </svg>
      </div>
    );
  }

  // BEP20 / BSC
  if (normalized.includes("BEP") || normalized.includes("BSC")) {
    return (
      <div className={`shrink-0 rounded-xl bg-[#0A1D1A] p-0.5 border border-emerald-400/60 shadow-md shadow-emerald-500/20 relative overflow-hidden flex items-center justify-center select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full p-1" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 18 L62 30 L50 42 L38 30 Z" fill="#10B981" />
          <path d="M26 42 L38 30 L50 42 L38 54 Z" fill="#10B981" />
          <path d="M74 42 L62 30 L50 42 L62 54 Z" fill="#10B981" />
          <path d="M50 66 L62 54 L50 42 L38 54 Z" fill="#10B981" />
          <text x="50" y="86" fontSize="16" fontWeight="900" fill="#34D399" textAnchor="middle" fontFamily="sans-serif">BEP20</text>
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
