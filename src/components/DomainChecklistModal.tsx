import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Circle,
  ShieldCheck,
  Globe,
  Mail,
  Search,
  Lock,
  ExternalLink,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";

interface DomainChecklistModalProps {
  domainName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DomainChecklistModal: React.FC<DomainChecklistModalProps> = ({
  domainName,
  isOpen,
  onClose,
}) => {
  const [completed, setCompleted] = useState<Record<string, boolean>>({
    step1: true,
    step2: true,
    step3: false,
    step4: false,
    step5: true,
  });

  const [copiedIp, setCopiedIp] = useState(false);

  if (!isOpen) return null;

  const toggleStep = (key: string) => {
    setCompleted((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyDnsIp = () => {
    navigator.clipboard.writeText("199.36.158.100");
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl text-slate-100 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">ডোমেইন লঞ্চ নির্দেশিকা (Domain Launch Checklist)</h2>
              <p className="text-xs text-slate-400 font-mono">Domain: {domainName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-300">প্রস্তুতির অগ্রগতি (Readiness Progress):</span>
            <span className="text-emerald-400 font-mono">{progressPercent}% সম্পন্ন</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* STEP 1: DNS Records */}
          <div
            onClick={() => toggleStep("step1")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
              completed.step1
                ? "bg-slate-950/80 border-emerald-500/40 text-slate-200"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                {completed.step1 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
                <span>১. ডেনএস (DNS) রেকর্ড সেটআপ ও ডোমেইন কানেক্ট</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">A / CNAME</span>
            </div>
            <p className="text-slate-400 leading-relaxed pl-7">
              আপনার ডোমেইন প্রোভাইডার (Namecheap, GoDaddy, NameSilo, etc.) এর ড্যাশবোর্ডে গিয়ে নিচে প্রদানকৃত A-Record যোগ করুন:
            </p>
            <div className="ml-7 p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 font-mono text-[11px]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between text-slate-300">
                <span>Type: <strong>A Record</strong> | Host: <strong>@</strong></span>
                <button
                  onClick={copyDnsIp}
                  className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-emerald-400 flex items-center gap-1"
                >
                  {copiedIp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIp ? "কপি হয়েছে" : "IP কপি করুন"}</span>
                </button>
              </div>
              <div className="text-emerald-400 font-bold">Points To: 199.36.158.100</div>
            </div>
          </div>

          {/* STEP 2: SSL Certificate */}
          <div
            onClick={() => toggleStep("step2")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
              completed.step2
                ? "bg-slate-950/80 border-emerald-500/40 text-slate-200"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                {completed.step2 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
                <span>২. ফ্রি এসএসএল (SSL HTTPS) এনক্রিপশন এনাবল</span>
              </div>
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-slate-400 leading-relaxed pl-7">
              আপনার ডোমেইনে ব্রাউজারের সবুজ প্যাডলক আইকন (HTTPS) নিশ্চিত করুন। ক্লাউড রান সাইটে ফ্রি অটোমেটিক সিকিউরিটি যুক্ত থাকে।
            </p>
          </div>

          {/* STEP 3: Professional Email */}
          <div
            onClick={() => toggleStep("step3")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
              completed.step3
                ? "bg-slate-950/80 border-emerald-500/40 text-slate-200"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                {completed.step3 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
                <span>৩. প্রফেশনাল ইমেইল তৈরি (contact@{domainName})</span>
              </div>
              <Mail className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-slate-400 leading-relaxed pl-7">
              গ্রাহকদের কাছে বিশ্বাসযোগ্যতা বাড়াতে আপনার ডোমেইনের নিজস্ব ব্র্যান্ডেড ইমেইল ফরোয়ার্ডিং অথবা Google Workspace ইমেইল সেটআপ করুন।
            </p>
          </div>

          {/* STEP 4: Google Search Console */}
          <div
            onClick={() => toggleStep("step4")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
              completed.step4
                ? "bg-slate-950/80 border-emerald-500/40 text-slate-200"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                {completed.step4 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
                <span>৪. গুগল সার্চ কনসোল ও সাইটম্যাপ সাবমিশন</span>
              </div>
              <Search className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-slate-400 leading-relaxed pl-7">
              গুগল সার্চে আপনার নতুন ওয়েবসাইট দ্রুত ইনডেক্স করতে Google Search Console এ সাইট কানেক্ট করে সাইটম্যাপ (sitemap.xml) সাবমিট করুন।
            </p>
          </div>

          {/* STEP 5: Favicon & Social Share Cards */}
          <div
            onClick={() => toggleStep("step5")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
              completed.step5
                ? "bg-slate-950/80 border-emerald-500/40 text-slate-200"
                : "bg-slate-950 border-slate-800 text-slate-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
                {completed.step5 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
                <span>৫. ফ্যাভিকন ও সোশ্যাল শেয়ার কার্ড প্রিপারেশন</span>
              </div>
              <Globe className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-slate-400 leading-relaxed pl-7">
              ফেসবুক, ওয়াটসঅ্যাপ বা লিঙ্কডইনে লিঙ্ক শেয়ার করলে সুন্দর লোগো ও বর্ণনা দেখানোর জন্য মেটা ট্যাগ যুক্ত করা হয়েছে।
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950">
          <button
            onClick={onClose}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all"
          >
            ঠিক আছে, বুঝলাম
          </button>
        </div>
      </div>
    </div>
  );
};
