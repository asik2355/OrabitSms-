import React from "react";

export const PRELOAD_SERVICE_LOGOS = [
  "https://i.ibb.co/5gbTft6y/20260808-203304.png", // WhatsApp
  "https://i.ibb.co/HDQZpNRm/20260808-203212.png", // Facebook
  "https://i.ibb.co/XrgXvjxG/20260808-204438.png", // IMO
  "https://i.ibb.co/gMLbkyZD/20260808-204306.png", // Discord
  "https://i.ibb.co/GvxdH9kw/20260808-204046.png", // Instagram
  "https://i.ibb.co/cKrBxZ8j/20260808-204219.png", // TikTok
  "https://i.ibb.co/rfXnjhmT/20260808-225352.png", // bKash
  "https://i.ibb.co/h1JMTshQ/20260808-091517.png", // Nagad
  "https://i.ibb.co/8DXH9tpH/20260808-204739.png", // Binance
  "https://i.ibb.co/gZDqd4mc/20260808-091340.png", // BEP20
  "https://i.ibb.co/pBsj6YrT/20260808-225511.png", // Apple
  "https://i.ibb.co/MkdzsN3z/20260808-224734.png", // Microsoft
  "https://i.ibb.co/XfF1sQw7/20260808-224540.png", // Bigo
  "https://i.ibb.co/MkxNTZMp/20260808-224420.png", // Telegram
];

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
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/5gbTft6y/20260808-203304.png"
          alt="WhatsApp"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  // FACEBOOK
  if (normalized.includes("FACEBOOK") || normalized === "FB") {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/HDQZpNRm/20260808-203212.png"
          alt="Facebook"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  // TELEGRAM
  if (normalized.includes("TELEGRAM") || normalized === "TG") {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/MkxNTZMp/20260808-224420.png"
          alt="Telegram"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  // APPLE
  if (normalized.includes("APPLE")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/pBsj6YrT/20260808-225511.png"
          alt="Apple"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  // MICROSOFT
  if (normalized.includes("MICROSOFT") || normalized.includes("MSFT")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/MkdzsN3z/20260808-224734.png"
          alt="Microsoft"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  // BIGO
  if (normalized.includes("BIGO")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/XfF1sQw7/20260808-224540.png"
          alt="Bigo"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  // IMO
  if (normalized.includes("IMO")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/XrgXvjxG/20260808-204438.png"
          alt="IMO"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
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
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/gMLbkyZD/20260808-204306.png"
          alt="Discord"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  // INSTAGRAM
  if (normalized.includes("INSTAGRAM") || normalized.includes("INSTA")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/GvxdH9kw/20260808-204046.png"
          alt="Instagram"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  // TIKTOK
  if (normalized.includes("TIKTOK")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/cKrBxZ8j/20260808-204219.png"
          alt="TikTok"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
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

  // BKASH (Animated Logo)
  if (normalized.includes("BKASH")) {
    return (
      <div className={`shrink-0 rounded-2xl bg-gradient-to-tr from-[#D10060] via-[#E2136E] to-[#FF4B97] p-0.5 border border-[#FF65A8]/60 shadow-lg shadow-[#E2136E]/40 relative overflow-hidden group flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[#E2136E]/70 select-none protected-img-container ${className}`} style={customStyle}>
        <div className="absolute -inset-1 rounded-2xl bg-[#E2136E] blur-md opacity-40 group-hover:opacity-80 animate-pulse transition-all"></div>
        <div className="w-full h-full rounded-[14px] bg-[#180814] p-1 relative z-10 flex items-center justify-center overflow-hidden">
          <img
            src="https://i.ibb.co/rfXnjhmT/20260808-225352.png"
            alt="bKash"
            className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      </div>
    );
  }

  // NAGAD (Animated Logo)
  if (normalized.includes("NAGAD")) {
    return (
      <div className={`shrink-0 rounded-2xl bg-gradient-to-tr from-[#D9381E] via-[#F26522] to-[#FF8042] p-0.5 border border-[#FF9E66]/60 shadow-lg shadow-[#F26522]/40 relative overflow-hidden group flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[#F26522]/70 select-none protected-img-container ${className}`} style={customStyle}>
        <div className="absolute -inset-1 rounded-2xl bg-[#F26522] blur-md opacity-40 group-hover:opacity-80 animate-pulse transition-all"></div>
        <div className="w-full h-full rounded-[14px] bg-[#1a0b06] p-1 relative z-10 flex items-center justify-center overflow-hidden">
          <img
            src="https://i.ibb.co/h1JMTshQ/20260808-091517.png"
            alt="Nagad"
            className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
      </div>
    );
  }

  // BINANCE
  if (normalized.includes("BINANCE")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://i.ibb.co/8DXH9tpH/20260808-204739.png"
          alt="Binance"
          className="w-full h-full object-contain pointer-events-none select-none"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  // BEP20 / BSC (Animated Logo)
  if (normalized.includes("BEP") || normalized.includes("BSC")) {
    return (
      <div className={`shrink-0 rounded-2xl bg-gradient-to-tr from-[#054D3B] via-[#10B981] to-[#34D399] p-0.5 border border-emerald-400/60 shadow-lg shadow-emerald-500/30 relative overflow-hidden group flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-emerald-500/60 select-none protected-img-container ${className}`} style={customStyle}>
        <div className="absolute -inset-1 rounded-2xl bg-emerald-500 blur-md opacity-30 group-hover:opacity-70 animate-pulse transition-all"></div>
        <div className="w-full h-full rounded-[14px] bg-[#0A1D1A] p-1 relative z-10 flex items-center justify-center overflow-hidden">
          <img
            src="https://i.ibb.co/gZDqd4mc/20260808-091340.png"
            alt="BEP20"
            className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
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
