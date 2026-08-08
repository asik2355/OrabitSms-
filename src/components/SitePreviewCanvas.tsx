import React, { useState } from "react";
import {
  Globe,
  Zap,
  ShieldCheck,
  Sparkles,
  Rocket,
  Smartphone,
  TrendingUp,
  ShoppingBag,
  Megaphone,
  Check,
  Mail,
  Phone,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Send,
  Lock,
  Clock,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { SiteConfig, ViewMode, SectionKey, TabType } from "../types";
import { ZenexSmsConsole } from "./ZenexSmsConsole";

interface SitePreviewCanvasProps {
  config: SiteConfig;
  viewMode: ViewMode;
  activeTab?: TabType;
  onEditSection: (sectionKey: SectionKey) => void;
  onUpdateConfig: (updated: SiteConfig) => void;
}

export const SitePreviewCanvas: React.FC<SitePreviewCanvasProps> = ({
  config,
  viewMode,
  activeTab,
  onEditSection,
  onUpdateConfig,
}) => {
  const [activeFaq, setActiveFaq] = useState<string | null>(config.faq[0]?.id || null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [comingSoonSubscribed, setComingSoonSubscribed] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [canvasView, setCanvasView] = useState<"website" | "sms_dashboard">("sms_dashboard");

  const isSectionVisible = (key: SectionKey) => {
    return config.sections.find((s) => s.id === key)?.visible ?? true;
  };

  const getContainerWidthClass = () => {
    switch (viewMode) {
      case "mobile":
        return "max-w-[375px] shadow-2xl border-x-4 border-slate-700 my-4 rounded-3xl overflow-hidden min-h-[667px]";
      case "tablet":
        return "max-w-[768px] shadow-xl border-x-2 border-slate-600 my-4 rounded-2xl overflow-hidden min-h-[900px]";
      default:
        return "w-full min-h-screen shadow-md";
    }
  };

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "Zap":
        return <Zap className="w-6 h-6 text-amber-500" />;
      case "ShieldCheck":
        return <ShieldCheck className="w-6 h-6 text-emerald-500" />;
      case "Sparkles":
        return <Sparkles className="w-6 h-6 text-purple-500" />;
      case "Rocket":
        return <Rocket className="w-6 h-6 text-blue-500" />;
      case "Smartphone":
        return <Smartphone className="w-6 h-6 text-indigo-500" />;
      case "TrendingUp":
        return <TrendingUp className="w-6 h-6 text-rose-500" />;
      case "ShoppingBag":
        return <ShoppingBag className="w-6 h-6 text-amber-500" />;
      case "Megaphone":
        return <Megaphone className="w-6 h-6 text-sky-500" />;
      default:
        return <Globe className="w-6 h-6 text-blue-500" />;
    }
  };

  const themeStyles = {
    backgroundColor: config.theme.bgColor,
    color: config.theme.textColor,
    fontFamily:
      config.theme.fontStyle === "serif"
        ? "Georgia, serif"
        : config.theme.fontStyle === "mono"
        ? "Courier New, monospace"
        : config.theme.fontStyle === "display"
        ? "Impact, sans-serif"
        : "system-ui, sans-serif",
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    }, 4000);
  };

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setComingSoonSubscribed(true);
    setTimeout(() => {
      setComingSoonSubscribed(false);
      setSubscriberEmail("");
    }, 4000);
  };

  // Coming Soon Mode Render
  if (config.comingSoon.enabled) {
    return (
      <div className="flex-1 overflow-y-auto bg-slate-900 flex justify-center p-4">
        <div className={`${getContainerWidthClass()} transition-all duration-300 bg-slate-950 text-white flex flex-col justify-between p-6 md:p-12 border border-slate-800 relative`}>
          {/* Edit Button Badge */}
          <button
            onClick={() => onEditSection("hero")}
            className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg z-20"
          >
            <Edit2 className="w-3 h-3" />
            <span>কামিং সুন পেজ এডিট</span>
          </button>

          <header className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2 font-bold text-xl text-white">
              <Globe className="w-6 h-6 text-blue-500" />
              <span>{config.brandName || config.domainName}</span>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-mono">
              {config.domainName}
            </span>
          </header>

          <main className="my-auto py-12 text-center max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Domain Registered & Launching Soon</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {config.comingSoon.headline}
            </h1>

            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
              {config.comingSoon.subheadline}
            </p>

            {/* Countdown placeholder card */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto my-6">
              {[
                { label: "দিন (Days)", val: "18" },
                { label: "ঘণ্টা (Hours)", val: "09" },
                { label: "মিনিট (Mins)", val: "42" },
                { label: "সেকেন্ড (Secs)", val: "15" },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-bold font-mono text-blue-400">{item.val}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Subscription Form */}
            <form onSubmit={handleSubscribeSubmit} className="max-w-md mx-auto space-y-3">
              {comingSoonSubscribed ? (
                <div className="bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 p-4 rounded-xl text-sm flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>ধন্যবাদ! আমরা আপনাকে ওয়েবসাইট চালু হলে আপডেট জানিয়ে দেব।</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={subscriberEmail}
                    onChange={(e) => setSubscriberEmail(e.target.value)}
                    placeholder={config.comingSoon.subscribePlaceholder}
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-5 py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 whitespace-nowrap"
                  >
                    {config.comingSoon.subscribeButtonText}
                  </button>
                </div>
              )}
            </form>
          </main>

          <footer className="py-6 border-t border-slate-800 text-center text-xs text-slate-500">
            <p>© {new Date().getFullYear()} {config.brandName || config.domainName}. All rights reserved.</p>
            <p className="mt-1 font-mono text-slate-600">Domain Hosted: {config.domainName}</p>
          </footer>
        </div>
      </div>
    );
  }

  const currentViewMode = activeTab === "sms_dashboard" ? "sms_dashboard" : canvasView;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 flex flex-col items-center p-2 sm:p-4 space-y-3">
      {/* Top View Switcher Header Bar */}
      <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl shadow-lg text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCanvasView("sms_dashboard")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentViewMode === "sms_dashboard"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>VoltXSMS / Zenex Live Dashboard</span>
            <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
              Live Feed
            </span>
          </button>

          <button
            onClick={() => setCanvasView("website")}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
              currentViewMode === "website"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>ল্যান্ডিং পেজ প্রিভিউ</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Target Domain: <strong className="text-emerald-400">{config.domainName}</strong></span>
        </div>
      </div>

      {currentViewMode === "sms_dashboard" ? (
        <div className="w-full max-w-6xl">
          <ZenexSmsConsole domainName={config.domainName} />
        </div>
      ) : (
        <div
          className={`${getContainerWidthClass()} transition-all duration-300 relative`}
          style={themeStyles}
        >
        {/* SECTION 1: HEADER / NAVIGATION */}
        {isSectionVisible("header") && (
          <nav className="sticky top-0 z-30 border-b border-slate-200/20 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 px-4 py-3 sm:px-8 flex items-center justify-between group relative">
            {/* Quick section edit trigger */}
            <button
              onClick={() => onEditSection("header")}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-blue-600 text-white text-[11px] px-2 py-0.5 rounded shadow z-40 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> এডিট
            </button>

            <div className="flex items-center gap-2 font-bold text-lg sm:text-xl tracking-tight">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                style={{ backgroundColor: config.theme.primaryColor }}
              >
                {config.brandName.charAt(0) || "D"}
              </div>
              <span className="truncate max-w-[180px] sm:max-w-xs">{config.brandName}</span>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium opacity-80">
              <a href="#hero" className="hover:opacity-100 transition-opacity">হোম</a>
              <a href="#about" className="hover:opacity-100 transition-opacity">আমাদের তথ্য</a>
              <a href="#services" className="hover:opacity-100 transition-opacity">সেবাসমূহ</a>
              <a href="#pricing" className="hover:opacity-100 transition-opacity">প্যাকেজ</a>
              <a href="#contact" className="hover:opacity-100 transition-opacity">যোগাযোগ</a>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="#contact"
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white transition-all shadow-md hover:opacity-90 active:scale-95"
                style={{ backgroundColor: config.theme.primaryColor }}
              >
                {config.hero.ctaPrimary || "যোগাযোগ করুন"}
              </a>
            </div>
          </nav>
        )}

        {/* SECTION 2: HERO BANNER */}
        {isSectionVisible("hero") && (
          <section id="hero" className="relative py-12 sm:py-20 px-4 sm:px-8 overflow-hidden group border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onEditSection("hero")}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-blue-600 text-white text-[11px] px-2.5 py-1 rounded shadow z-40 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> হিরো সেকশন এডিট
            </button>

            <div className="max-w-5xl mx-auto flex flex-col items-center text-center space-y-6">
              {config.hero.badge && (
                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-3.5 py-1 rounded-full text-xs font-semibold shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>{config.hero.badge}</span>
                </div>
              )}

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl">
                {config.hero.title}
              </h1>

              <p className="text-base sm:text-lg opacity-75 max-w-2xl leading-relaxed">
                {config.hero.subtitle}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href="#contact"
                  className="px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all flex items-center gap-2 hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: config.theme.primaryColor }}
                >
                  <span>{config.hero.ctaPrimary}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                {config.hero.ctaSecondary && (
                  <a
                    href="#services"
                    className="px-6 py-3 rounded-xl font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    <span>{config.hero.ctaSecondary}</span>
                  </a>
                )}
              </div>

              {/* Domain Name Ribbon */}
              <div className="pt-4 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>অফিশিয়াল ডোমেইন: <strong>{config.domainName}</strong></span>
              </div>

              {/* Hero Image */}
              {config.hero.showHeroImage && config.hero.heroImage && (
                <div className="mt-8 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800 select-none protected-img-container">
                  <img
                    src={config.hero.heroImage}
                    alt="Hero Visual"
                    className="w-full h-64 sm:h-96 object-cover hover:scale-105 transition-transform duration-700 pointer-events-none select-none"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION 3: KEY FEATURES */}
        {isSectionVisible("features") && (
          <section id="features" className="py-12 sm:py-16 px-4 sm:px-8 group relative border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onEditSection("features")}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-blue-600 text-white text-[11px] px-2.5 py-1 rounded shadow z-40 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> বৈশিষ্ট্য এডিট
            </button>

            <div className="max-w-6xl mx-auto">
              <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">আমাদের বিশেষ সুবিধাসমূহ</h2>
                <p className="text-sm opacity-70">আপনার ডোমেইনে সর্বাধুনিক অভিজ্ঞতা প্রদান করতে যা কিছু থাকছে</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {config.features.map((feat) => (
                  <div
                    key={feat.id}
                    className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {getIcon(feat.icon)}
                    </div>
                    <h3 className="font-semibold text-base">{feat.title}</h3>
                    <p className="text-xs opacity-75 leading-relaxed">{feat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: SERVICES */}
        {isSectionVisible("services") && (
          <section id="services" className="py-12 sm:py-16 px-4 sm:px-8 group relative border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <button
              onClick={() => onEditSection("services")}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-blue-600 text-white text-[11px] px-2.5 py-1 rounded shadow z-40 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> সেবা সমূহ এডিট
            </button>

            <div className="max-w-6xl mx-auto space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold">আমাদের সেবাসমূহ</h2>
                <p className="text-sm opacity-70">আপনার ডোমেইন এবং ব্যবসার প্রয়োজনীয় সব সুবিধা এক ছাদের নিচে</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {config.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    {srv.badge && (
                      <span
                        className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: config.theme.accentColor }}
                      >
                        {srv.badge}
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                        {getIcon(srv.icon)}
                      </div>
                      <h3 className="font-bold text-lg">{srv.title}</h3>
                      <p className="text-xs opacity-75 leading-relaxed">{srv.description}</p>
                    </div>

                    {srv.price && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-semibold text-sm" style={{ color: config.theme.primaryColor }}>
                          {srv.price}
                        </span>
                        <a
                          href="#contact"
                          className="text-xs font-medium hover:underline flex items-center gap-1"
                        >
                          বিস্তারিত <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: ABOUT US & STATS */}
        {isSectionVisible("about") && (
          <section id="about" className="py-12 sm:py-16 px-4 sm:px-8 group relative border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onEditSection("about")}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-blue-600 text-white text-[11px] px-2.5 py-1 rounded shadow z-40 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> আমাদের তথ্য এডিট
            </button>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  আমাদের পরিচিতি
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  {config.about.title}
                </h2>
                <p className="text-sm opacity-80 leading-relaxed">
                  {config.about.story}
                </p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  {config.about.stats.map((stat) => (
                    <div
                      key={stat.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
                    >
                      <div
                        className="text-xl sm:text-2xl font-black font-mono"
                        style={{ color: config.theme.primaryColor }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-xs opacity-75 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {config.about.image && (
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 select-none protected-img-container">
                  <img
                    src={config.about.image}
                    alt="About Us"
                    className="w-full h-72 sm:h-96 object-cover pointer-events-none select-none"
                    loading="eager"
                    decoding="async"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION 6: TESTIMONIALS */}
        {isSectionVisible("testimonials") && (
          <section id="testimonials" className="py-12 sm:py-16 px-4 sm:px-8 group relative border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <button
              onClick={() => onEditSection("testimonials")}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-blue-600 text-white text-[11px] px-2.5 py-1 rounded shadow z-40 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> রিভিউ এডিট
            </button>

            <div className="max-w-5xl mx-auto space-y-10">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold">কাস্টমারদের প্রতিক্রিয়া</h2>
                <p className="text-sm opacity-70">আমাদের গ্রাহকরা আমাদের ডোমেইন সার্ভিস নিয়ে যা বলছেন</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {config.testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                  >
                    <div className="flex items-center gap-1">
                      {[...Array(t.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm italic opacity-85 leading-relaxed">
                      "{t.content}"
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-xs sm:text-sm">{t.name}</div>
                        <div className="text-[11px] opacity-60">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 7: PRICING */}
        {isSectionVisible("pricing") && (
          <section id="pricing" className="py-12 sm:py-16 px-4 sm:px-8 group relative border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onEditSection("pricing")}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-blue-600 text-white text-[11px] px-2.5 py-1 rounded shadow z-40 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> প্যাকেজ এডিট
            </button>

            <div className="max-w-6xl mx-auto space-y-10">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold">সহজ ও সাশ্রয়ী প্যাকেজ</h2>
                <p className="text-sm opacity-70">আপনার বাজেটের মধ্যে সেরা ফিচার বেছে নিন</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {config.pricing.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-6 rounded-3xl border flex flex-col justify-between space-y-6 relative transition-all ${
                      plan.popular
                        ? "bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-900/80 border-blue-500 shadow-xl scale-105 z-10"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow">
                        সবচেয়ে জনপ্রিয়
                      </span>
                    )}

                    <div className="space-y-4">
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-3xl font-black">{plan.price}</span>
                        <span className="text-xs opacity-60">{plan.period}</span>
                      </div>
                      <p className="text-xs opacity-70 leading-relaxed">{plan.description}</p>

                      <ul className="space-y-2.5 pt-2 text-xs">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <a
                      href="#contact"
                      className={`w-full text-center py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                        plan.popular
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {plan.ctaText || "অর্ডার করুন"}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 8: FAQ */}
        {isSectionVisible("faq") && (
          <section id="faq" className="py-12 sm:py-16 px-4 sm:px-8 group relative border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <button
              onClick={() => onEditSection("faq")}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-blue-600 text-white text-[11px] px-2.5 py-1 rounded shadow z-40 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> FAQ এডিট
            </button>

            <div className="max-w-3xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold">সাধারণ প্রশ্নের উত্তর</h2>
                <p className="text-sm opacity-70">ডোমেইন ও ওয়েবসাইট নিয়ে সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্ন</p>
              </div>

              <div className="space-y-3">
                {config.faq.map((item) => {
                  const isOpen = activeFaq === item.id;
                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm"
                    >
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : item.id)}
                        className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity"
                      >
                        <span>{item.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-blue-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-xs sm:text-sm opacity-75 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 9: CONTACT */}
        {isSectionVisible("contact") && (
          <section id="contact" className="py-12 sm:py-16 px-4 sm:px-8 group relative border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onEditSection("contact")}
              className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-blue-600 text-white text-[11px] px-2.5 py-1 rounded shadow z-40 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" /> যোগাযোগ সেকশন এডিট
            </button>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    {config.contact.title}
                  </h2>
                  <p className="text-sm opacity-75 mt-2">
                    {config.contact.subtitle}
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">ইমেইল ঠিকানা</div>
                      <div className="font-semibold">{config.contact.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">ফোন নাম্বার / হোয়াটসঅ্যাপ</div>
                      <div className="font-semibold">{config.contact.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">ঠিকানা</div>
                      <div className="font-semibold">{config.contact.address}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                  <div className="font-bold text-blue-600 dark:text-blue-400">🌐 ডোমেইন রেজিস্ট্রেশন স্ট্যাটাস: Active</div>
                  <div className="opacity-75 font-mono">Domain: {config.domainName}</div>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                {formSubmitted ? (
                  <div className="py-12 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                    <h3 className="text-lg font-bold">মেসেজ সফলভাবে পাঠানো হয়েছে!</h3>
                    <p className="text-xs opacity-75">আমরা খুব শীঘ্রই আপনার সাথে ইমেইলে অথবা ফোনে যোগাযোগ করব।</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <h3 className="font-bold text-base mb-2">মেসেজ পাঠান</h3>
                    <div>
                      <label className="block text-xs font-semibold mb-1 opacity-80">আপনার নাম</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="যেমন: সাকিব আহমেদ"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 opacity-80">ইমেইল ঠিকানা</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 opacity-80">বার্তাসমূহ</label>
                      <textarea
                        rows={3}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="আপনার প্রয়োজনীয় তথ্য লিখুন..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl font-semibold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-90 active:scale-95"
                      style={{ backgroundColor: config.theme.primaryColor }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>মেসেজ জমা দিন</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 10: FOOTER */}
        {isSectionVisible("footer") && (
          <footer className="py-8 px-4 sm:px-8 bg-slate-900 text-slate-300 text-xs border-t border-slate-800">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-bold text-base text-white">
                <Globe className="w-5 h-5 text-blue-400" />
                <span>{config.brandName || config.domainName}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <a href="#hero" className="hover:text-white">হোম</a>
                <a href="#about" className="hover:text-white">আমাদের তথ্য</a>
                <a href="#services" className="hover:text-white">সেবা</a>
                <a href="#contact" className="hover:text-white">যোগাযোগ</a>
              </div>
              <div className="opacity-60 text-center md:text-right">
                <p>© {new Date().getFullYear()} {config.domainName}. All rights reserved.</p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Powered by Domain Site Studio</p>
              </div>
            </div>
          </footer>
        )}
      </div>
      )}
    </div>
  );
};
