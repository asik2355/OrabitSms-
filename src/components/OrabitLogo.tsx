import React from "react";

interface OrabitLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  showSubtitle?: boolean;
  subtitleText?: string;
  onClick?: () => void;
  className?: string;
}

export const OrabitLogo: React.FC<OrabitLogoProps> = ({
  size = "md",
  showSubtitle = false,
  subtitleText,
  onClick,
  className = "",
}) => {
  // Sizing mappings
  const iconSizes = {
    xs: "w-6 h-6 rounded-lg",
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 sm:w-11 sm:h-11 rounded-2xl",
    lg: "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl",
  };

  const textSizes = {
    xs: "text-xs sm:text-sm font-mono font-extrabold tracking-tight",
    sm: "text-sm sm:text-lg font-black tracking-tight",
    md: "text-base sm:text-xl font-black tracking-tight",
    lg: "text-xl sm:text-3xl font-black tracking-tight",
  };

  const subTextSizes = {
    xs: "text-[9px]",
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${size === "xs" ? "gap-1.5" : "gap-3"} group select-none ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* LOGO ICON CONTAINER WITH ORBITAL GLOW */}
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Neon Glow Behind */}
        <div
          className={`absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-cyan-500 via-emerald-400 to-indigo-500 opacity-70 blur-md group-hover:opacity-100 transition-all duration-500 animate-pulse`}
        />

        {/* Outer Orbital Ring Container */}
        <div
          className={`relative ${iconSizes[size]} bg-[#090D1A] border border-cyan-400/40 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] overflow-hidden group-hover:border-emerald-400/80 transition-all duration-300`}
        >
          {/* Subtle Radial Mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.25),transparent_70%)]" />

          {/* CUSTOM ORBITAL SVG LOGO MARK */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full relative z-10 transform group-hover:scale-105 transition-transform duration-300"
          >
            <defs>
              <linearGradient id="orbGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
              <linearGradient id="orbGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Outer Rotating Orbital Ring */}
            <ellipse
              cx="50"
              cy="50"
              rx="40"
              ry="20"
              stroke="url(#orbGrad1)"
              strokeWidth="3.5"
              strokeDasharray="140 30"
              className="animate-[spin_8s_linear_infinite] transform-origin-center"
              style={{ transformOrigin: "50px 50px", transform: "rotate(-25deg)" }}
            />

            {/* Counter Orbital Ring */}
            <ellipse
              cx="50"
              cy="50"
              rx="38"
              ry="18"
              stroke="url(#orbGrad2)"
              strokeWidth="2"
              strokeOpacity="0.6"
              strokeDasharray="80 50"
              style={{ transformOrigin: "50px 50px", transform: "rotate(35deg)" }}
            />

            {/* Orbiting Satellite Node */}
            <circle
              cx="85"
              cy="35"
              r="4.5"
              fill="#38BDF8"
              filter="url(#glowEffect)"
            />

            {/* Central High-Tech Signal Core */}
            <path
              d="M32 42 C32 34 38 28 50 28 C62 28 68 34 68 42 C68 52 56 56 50 64 C48 66 48 68 48 70"
              stroke="none"
            />
            {/* SMS Message Envelope / Signal Core Icon */}
            <path
              d="M32 38 C32 34.6 34.6 32 38 32 H62 C65.4 32 68 34.6 68 38 V58 C68 61.4 65.4 64 62 64 H44 L34 72 V64 H38 C34.6 64 32 61.4 32 58 V38 Z"
              fill="url(#orbGrad1)"
              fillOpacity="0.25"
              stroke="url(#orbGrad1)"
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Signal Bolt inside message core */}
            <path
              d="M52 38 L42 50 H51 L48 58 L58 46 H49 L52 38 Z"
              fill="#38BDF8"
              filter="url(#glowEffect)"
            />
          </svg>
        </div>
      </div>

      {/* TYPOGRAPHY SECTION */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black ${textSizes[size]} tracking-tight uppercase bg-gradient-to-r from-cyan-300 via-emerald-300 to-indigo-300 bg-clip-text text-transparent group-hover:from-emerald-300 group-hover:to-cyan-300 transition-all`}
          >
            ORABIT<span className="text-cyan-400 font-black">SMS</span>
          </span>
        </div>

        {showSubtitle && (
          <p
            className={`${subTextSizes[size]} font-mono text-slate-400 tracking-wider flex items-center gap-1.5`}
          >
            <span>{subtitleText || "Core Routing Protocol"}</span>
          </p>
        )}
      </div>
    </div>
  );
};
