import React from "react";

export const PRELOAD_SERVICE_LOGOS = [
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161909.png", // WhatsApp
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161825.png", // Facebook
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162050.png", // IMO
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161959.png", // Instagram
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162016.png", // TikTok
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161737.png", // bKash
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162632.png", // Nagad
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162103.png", // Binance
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161944.png", // BEP20
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161639.png", // Apple
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162147.png", // Microsoft
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162133.png", // Bigo
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162116.png", // Telegram
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162352.png", // ChatGPT / OpenAI
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260810_143635.png", // eBay
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260810_143757.png", // LinkedIn
  "https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260810_144006.png", // Twitter
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
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161909.png"
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
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161825.png"
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
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162116.png"
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
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161639.png"
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
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162147.png"
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

  // CHATGPT / OPENAI
  if (normalized.includes("CHATGPT") || normalized.includes("OPENAI") || normalized.includes("GPT")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162352.png"
          alt="ChatGPT / OpenAI"
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
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162133.png"
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
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162050.png"
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
      <div className={`shrink-0 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center p-0.5 sm:p-1 shadow-sm select-none ${className}`} style={customStyle}>
        <svg className="w-full h-full pointer-events-none" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#5865F2" />
          <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09a.09.09 0 0 0-.07-.03c-1.5.26-2.93.71-4.27 1.33a.08.08 0 0 0-.04.03C2.1 9.3 1.32 13.15 1.7 16.96a.09.09 0 0 0 .03.07c1.78 1.31 3.5 2.11 5.18 2.64a.09.09 0 0 0 .1-.03c.4-.55.76-1.13 1.07-1.74a.09.09 0 0 0-.05-.12c-.56-.21-1.1-.47-1.61-.76a.09.09 0 0 1-.01-.15c.11-.08.22-.17.32-.26a.09.09 0 0 1 .09-.01c3.38 1.54 7.04 1.54 10.37 0a.09.09 0 0 1 .09.01c.1.09.21.18.32.26a.09.09 0 0 1-.01.15c-.51.29-1.05.55-1.61.76a.09.09 0 0 0-.05.12c.32.61.68 1.19 1.07 1.74a.09.09 0 0 0 .1.03c1.69-.53 3.41-1.33 5.19-2.64a.09.09 0 0 0 .03-.07c.46-4.39-.73-8.21-3.14-11.6a.08.08 0 0 0-.04-.03zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z" fill="white"/>
        </svg>
      </div>
    );
  }

  // INSTAGRAM
  if (normalized.includes("INSTAGRAM") || normalized.includes("INSTA")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161959.png"
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
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162016.png"
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

  // EBAY
  if (normalized.includes("EBAY")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260810_143635.png"
          alt="eBay"
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

  // LINKEDIN
  if (normalized.includes("LINKEDIN")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260810_143757.png"
          alt="LinkedIn"
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

  // TWITTER / X
  if (normalized.includes("TWITTER") || normalized === "X" || normalized.includes("X.COM")) {
    return (
      <div className={`shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-sm select-none protected-img-container ${className}`} style={customStyle}>
        <img
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260810_144006.png"
          alt="Twitter"
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
            src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161737.png"
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
            src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162632.png"
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
          src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_162103.png"
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
            src="https://hdcdrjjonuarxfdxkwia.supabase.co/storage/v1/object/public/logos/20260809_161944.png"
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
