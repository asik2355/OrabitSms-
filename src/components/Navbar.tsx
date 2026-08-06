import React from "react";
import {
  Globe,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Download,
  Palette,
  CheckCircle2,
  Code2,
  Rocket,
  Wand2,
  Zap,
} from "lucide-react";
import { ViewMode, TabType, LanguageMode } from "../types";

interface NavbarProps {
  domainName: string;
  setDomainName: (val: string) => void;
  viewMode: ViewMode;
  setViewMode: (val: ViewMode) => void;
  activeTab: TabType;
  setActiveTab: (val: TabType) => void;
  language: LanguageMode;
  setLanguage: (val: LanguageMode) => void;
  onQuickGenerate: () => void;
  onOpenChecklist: () => void;
  isGenerating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  domainName,
  setDomainName,
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  onQuickGenerate,
  onOpenChecklist,
  isGenerating,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-3 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Domain Input */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 rounded-xl shadow-inner font-semibold text-sm">
            <Globe className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">Domain Studio</span>
          </div>

          <div className="relative flex items-center">
            <span className="text-xs font-mono text-slate-400 pl-3 absolute pointer-events-none">
              https://
            </span>
            <input
              type="text"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              placeholder="yourdomain.com"
              className="bg-slate-800 border border-slate-700 text-slate-100 font-mono text-xs sm:text-sm pl-16 pr-3 py-1.5 rounded-lg w-44 sm:w-60 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          <button
            onClick={onQuickGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-medium text-xs px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Generate website content with Gemini AI"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span className="hidden md:inline font-semibold">
              {isGenerating ? "জেনারেট হচ্ছে..." : "AI দিয়ে সাজান"}
            </span>
          </button>
        </div>

        {/* Center: Viewport Controls */}
        <div className="hidden lg:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setViewMode("desktop")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              viewMode === "desktop"
                ? "bg-blue-600 text-white font-medium shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setViewMode("tablet")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              viewMode === "tablet"
                ? "bg-blue-600 text-white font-medium shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>
          <button
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              viewMode === "mobile"
                ? "bg-blue-600 text-white font-medium shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Right Tools & Navigation Tabs */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs font-medium">
            <button
              onClick={() => setLanguage("bn")}
              className={`px-2 py-1 rounded ${
                language === "bn" ? "bg-slate-700 text-amber-400" : "text-slate-400 hover:text-white"
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 py-1 rounded ${
                language === "en" ? "bg-slate-700 text-amber-400" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          {/* Launch readiness checklist */}
          <button
            onClick={onOpenChecklist}
            className="flex items-center gap-1 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
            title="Check domain DNS, SSL, and setup checklist"
          >
            <Rocket className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">লঞ্চ গাইড</span>
          </button>

          {/* Tab Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("sms_dashboard")}
              className={`p-1.5 px-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-all font-bold ${
                activeTab === "sms_dashboard"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 animate-pulse"
                  : "bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 border border-emerald-700/60"
              }`}
              title="SMS Portal Live Dashboard (VoltXSMS / Zenex Traffic)"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>SMS ড্যাশবোর্ড</span>
            </button>

            <button
              onClick={() => setActiveTab("builder")}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                activeTab === "builder"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title="Page Builder & Sections"
            >
              <Wand2 className="w-4 h-4" />
              <span className="hidden xl:inline">বিল্ডার</span>
            </button>

            <button
              onClick={() => setActiveTab("theme")}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                activeTab === "theme"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title="Theme Colors & Styling"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden xl:inline">থিম</span>
            </button>

            <button
              onClick={() => setActiveTab("export")}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                activeTab === "export"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              title="Export HTML / React Code"
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden xl:inline">কোড এক্সপোর্ট</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
