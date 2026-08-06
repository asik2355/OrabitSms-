import React, { useState } from "react";
import {
  Wand2,
  Palette,
  Sparkles,
  Rocket,
  Code2,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  Lock,
  Share2,
  Layers,
  Settings,
  HelpCircle,
  FileCode,
} from "lucide-react";
import { SiteConfig, TabType, SectionKey, NicheType, FontStyle } from "../types";
import { COLOR_PALETTES } from "../data/defaults";

interface SidebarBuilderProps {
  config: SiteConfig;
  onChangeConfig: (updated: SiteConfig) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onEditSection: (key: SectionKey) => void;
  onGenerateAI: (prompt: string, niche: NicheType) => void;
  isGenerating: boolean;
  onOpenChecklist: () => void;
}

export const SidebarBuilder: React.FC<SidebarBuilderProps> = ({
  config,
  onChangeConfig,
  activeTab,
  setActiveTab,
  onEditSection,
  onGenerateAI,
  isGenerating,
  onOpenChecklist,
}) => {
  const [aiPrompt, setAiPrompt] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copyType, setCopyType] = useState<"html" | "json">("html");

  const toggleSectionVisibility = (key: SectionKey) => {
    const updatedSections = config.sections.map((sec) =>
      sec.id === key ? { ...sec, visible: !sec.visible } : sec
    );
    onChangeConfig({ ...config, sections: updatedSections });
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...config.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    onChangeConfig({ ...config, sections: newSections });
  };

  const applyColorPalette = (p: typeof COLOR_PALETTES[0]) => {
    onChangeConfig({
      ...config,
      theme: {
        ...config.theme,
        primaryColor: p.primary,
        accentColor: p.accent,
        bgColor: p.bg,
        textColor: p.text,
      },
    });
  };

  const handleCopyHTML = () => {
    const htmlCode = `<!DOCTYPE html>
<html lang="${config.language === "bn" ? "bn" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.metaTitle || config.brandName}</title>
  <meta name="description" content="${config.metaDescription}">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body style="background-color: ${config.theme.bgColor}; color: ${config.theme.textColor}; font-family: sans-serif;">
  <!-- ${config.brandName} - Designed with Domain Site Studio for ${config.domainName} -->
  <header style="padding: 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
    <h1 style="font-weight: bold; font-size: 1.25rem;">${config.brandName}</h1>
    <a href="#contact" style="background-color: ${config.theme.primaryColor}; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none;">${config.hero.ctaPrimary}</a>
  </header>
  <main style="max-width: 1200px; margin: 0 auto; padding: 3rem 1rem; text-align: center;">
    <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem;">${config.hero.title}</h2>
    <p style="font-size: 1.125rem; opacity: 0.8; margin-bottom: 2rem;">${config.hero.subtitle}</p>
  </main>
</body>
</html>`;

    navigator.clipboard.writeText(htmlCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-full z-20 shrink-0">
      {/* Tab Selectors */}
      <div className="grid grid-cols-5 border-b border-slate-800 text-xs font-medium text-center bg-slate-950">
        <button
          onClick={() => setActiveTab("builder")}
          className={`py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === "builder"
              ? "text-blue-400 border-b-2 border-blue-500 bg-slate-900 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Section Manager"
        >
          <Layers className="w-4 h-4" />
          <span>লেআউট</span>
        </button>

        <button
          onClick={() => setActiveTab("theme")}
          className={`py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === "theme"
              ? "text-blue-400 border-b-2 border-blue-500 bg-slate-900 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Theme & Style Settings"
        >
          <Palette className="w-4 h-4" />
          <span>থিম</span>
        </button>

        <button
          onClick={() => setActiveTab("ai_tools")}
          className={`py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === "ai_tools"
              ? "text-amber-400 border-b-2 border-amber-500 bg-slate-900 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Gemini AI Content Generator"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI জেনারেটর</span>
        </button>

        <button
          onClick={() => setActiveTab("domain_launch")}
          className={`py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === "domain_launch"
              ? "text-emerald-400 border-b-2 border-emerald-500 bg-slate-900 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Domain Launch & Meta Setup"
        >
          <Rocket className="w-4 h-4 text-emerald-400" />
          <span>ডোমেইন</span>
        </button>

        <button
          onClick={() => setActiveTab("export")}
          className={`py-3 flex flex-col items-center gap-1 transition-colors ${
            activeTab === "export"
              ? "text-blue-400 border-b-2 border-blue-500 bg-slate-900 font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
          title="Code Export & Download"
        >
          <Code2 className="w-4 h-4" />
          <span>কোড</span>
        </button>
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* TAB 1: BUILDER / SECTION MANAGEMENT */}
        {activeTab === "builder" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>ওয়েবসাইট সেকশনসমূহ</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {config.sections.filter((s) => s.visible).length} / {config.sections.length} দৃশ্যমান
              </span>
            </div>

            {/* Mode Switcher: Full Website vs Coming Soon */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300">ডোমেইন ডিসপ্লে মোড:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => onChangeConfig({ ...config, comingSoon: { ...config.comingSoon, enabled: false } })}
                  className={`py-2 px-3 rounded-lg border font-medium transition-all ${
                    !config.comingSoon.enabled
                      ? "bg-blue-600 border-blue-500 text-white shadow"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  পূর্ণাঙ্গ ওয়েবসাইট
                </button>
                <button
                  onClick={() => onChangeConfig({ ...config, comingSoon: { ...config.comingSoon, enabled: true } })}
                  className={`py-2 px-3 rounded-lg border font-medium transition-all ${
                    config.comingSoon.enabled
                      ? "bg-amber-600 border-amber-500 text-white shadow"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  কামিং সুন পেজ
                </button>
              </div>
            </div>

            {/* List of Sections */}
            <div className="space-y-2">
              {config.sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                    sec.visible
                      ? "bg-slate-800/80 border-slate-700 text-slate-100"
                      : "bg-slate-950/60 border-slate-900 text-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <button
                      onClick={() => toggleSectionVisibility(sec.id)}
                      className="text-slate-400 hover:text-white transition-colors"
                      title={sec.visible ? "Hide Section" : "Show Section"}
                    >
                      {sec.visible ? (
                        <Eye className="w-4 h-4 text-blue-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                    <span className="truncate max-w-[120px]">
                      {config.language === "bn" ? sec.nameBn : sec.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditSection(sec.id)}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] font-semibold"
                    >
                      এডিট
                    </button>
                    <button
                      onClick={() => moveSection(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveSection(idx, "down")}
                      disabled={idx === config.sections.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: THEME & STYLING */}
        {activeTab === "theme" && (
          <div className="space-y-5">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-400" />
              <span>কালার ও ভিজ্যুয়াল থিম</span>
            </h3>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">কালার প্যালেট প্রিসেট:</label>
              <div className="grid grid-cols-1 gap-2">
                {COLOR_PALETTES.map((pal, i) => (
                  <button
                    key={i}
                    onClick={() => applyColorPalette(pal)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 text-xs text-left transition-all"
                  >
                    <span className="font-medium text-slate-200">{pal.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: pal.primary }} />
                      <span className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: pal.accent }} />
                      <span className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: pal.bg }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Pickers */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">প্রাইমারি কালার (Primary Color):</span>
                <input
                  type="color"
                  value={config.theme.primaryColor}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      theme: { ...config.theme, primaryColor: e.target.value },
                    })
                  }
                  className="w-7 h-7 bg-transparent rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">অ্যাকসেন্ট কালার (Accent Color):</span>
                <input
                  type="color"
                  value={config.theme.accentColor}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      theme: { ...config.theme, accentColor: e.target.value },
                    })
                  }
                  className="w-7 h-7 bg-transparent rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">ব্যাকগ্রাউন্ড কালার (Background):</span>
                <input
                  type="color"
                  value={config.theme.bgColor}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      theme: { ...config.theme, bgColor: e.target.value },
                    })
                  }
                  className="w-7 h-7 bg-transparent rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">টেক্সট কালার (Text Color):</span>
                <input
                  type="color"
                  value={config.theme.textColor}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      theme: { ...config.theme, textColor: e.target.value },
                    })
                  }
                  className="w-7 h-7 bg-transparent rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300">ফন্ট স্টাইল (Font Pairing):</label>
              <select
                value={config.theme.fontStyle}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    theme: { ...config.theme, fontStyle: e.target.value as FontStyle },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="sans">Modern Sans-Serif (Standard clean)</option>
                <option value="serif">Classic Editorial Serif (Georgia/Times)</option>
                <option value="mono">Tech & Developer Mono (Code style)</option>
                <option value="display">Bold High Impact (Display headline)</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 3: GEMINI AI GENERATOR */}
        {activeTab === "ai_tools" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Gemini AI সাইট জেনারেটর</span>
              </h3>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                Gemini 3.6 Flash
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              আপনার ডোমেইন <strong>{config.domainName}</strong> এর জন্য ব্যবসায়ের ধরন ও আইডিয়া লিখুন। Gemini AI কয়েক সেকেন্ডের মধ্যে সম্পূর্ণ কন্টেন্ট তৈরি করে দিবে।
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ব্যবসার ক্যাটাগরি (Niche):</label>
                <select
                  value={config.niche}
                  onChange={(e) => onChangeConfig({ ...config, niche: e.target.value as NicheType })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl"
                >
                  <option value="agency">ডিজিটাল এজেন্সি / আইটি প্রতিষ্ঠান</option>
                  <option value="ecommerce">ই-কমার্স / অনলাইন শপ</option>
                  <option value="portfolio">পার্সোনাল পোর্টফোলিও / ফ্রিল্যান্সার</option>
                  <option value="saas">SaaS / টেকনোলজি প্রোডাক্ট</option>
                  <option value="restaurant">রেস্তোরাঁ / ফুড শপ</option>
                  <option value="blog">ব্লগ / নিউজ মিডিয়া</option>
                  <option value="education">অনলাইন কোর্স / এডুকেশন</option>
                  <option value="realestate">রিয়েল এস্টেট / প্রপার্টি</option>
                  <option value="personal">ব্যক্তিগত ডোমেইন / বায়ো</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">আইডিয়া / বাড়তি বিবরণ (Prompt):</label>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="যেমন: আমাদের ডোমেইনে একটি প্রিমিয়াম অনলাইন ফ্যাশন শপ হবে যেখানে আমরা ট্রেডিশনাল ড্রেস এবং এক্সক্লুসিভ কালেকশন বিক্রি করি..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={() => onGenerateAI(aiPrompt, config.niche)}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                <span>{isGenerating ? "AI কন্টেন্ট তৈরি হচ্ছে..." : "AI দিয়ে সম্পূর্ণ ওয়েবসাইট সাজান"}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: DOMAIN LAUNCHPAD & METADATA */}
        {activeTab === "domain_launch" && (
          <div className="space-y-5">
            <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              <span>ডোমেইন লঞ্চ ও এসইও (SEO)</span>
            </h3>

            {/* Domain Info */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>কানেক্টেড ডোমেইন:</span>
                <span className="font-mono text-emerald-400 font-bold">{config.domainName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>এসএসএল (SSL Security):</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> সক্রিয় (Free HTTPS)
                </span>
              </div>
            </div>

            {/* Launch Checklist Button */}
            <button
              onClick={onOpenChecklist}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ডোমেইন কানেকশন নির্দেশিকা চেক করুন</span>
            </button>

            {/* Meta SEO Settings */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300">SEO Meta Title:</label>
              <input
                type="text"
                value={config.metaTitle}
                onChange={(e) => onChangeConfig({ ...config, metaTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl"
              />

              <label className="text-xs font-semibold text-slate-300">SEO Meta Description:</label>
              <textarea
                rows={3}
                value={config.metaDescription}
                onChange={(e) => onChangeConfig({ ...config, metaDescription: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-3 rounded-xl"
              />
            </div>

            {/* Social Share Card Preview */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>সোশ্যাল মিডিয়া প্রিভিউ (Social Card):</span>
              </span>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="h-28 bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center font-bold text-blue-300 p-3 text-center">
                  {config.brandName || config.domainName}
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">{config.domainName}</div>
                  <div className="font-bold text-slate-200 truncate">{config.metaTitle || config.brandName}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2">{config.metaDescription}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EXPORT & CODE */}
        {activeTab === "export" && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span>কোড এক্সপোর্ট ও ফাইল ডাউনলোড</span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              আপনার ডোমেইনে অফিশিয়াল ওয়েবসাইট চালুর জন্য রেডিমেড HTML / React অথবা JSON কনফিগারেশন এক্সপোর্ট করুন।
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setCopyType("html")}
                className={`py-2 px-3 rounded-xl border font-semibold transition-all ${
                  copyType === "html"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                HTML + Tailwind
              </button>
              <button
                onClick={() => setCopyType("json")}
                className={`py-2 px-3 rounded-xl border font-semibold transition-all ${
                  copyType === "json"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                JSON Config
              </button>
            </div>

            <button
              onClick={copyType === "html" ? handleCopyHTML : handleCopyJSON}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>কপি করা হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{copyType === "html" ? "HTML কোড কপি করুন" : "JSON ডেটা কপি করুন"}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
