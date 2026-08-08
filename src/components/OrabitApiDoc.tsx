import React, { useState } from "react";
import {
  Copy,
  Check,
  Play,
  Key,
  ChevronDown,
  BookOpen,
} from "lucide-react";

interface OrabitApiDocProps {
  apiKey: string;
}

export const OrabitApiDoc: React.FC<OrabitApiDocProps> = ({ apiKey }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Playground state
  const [playgroundKey, setPlaygroundKey] = useState("M4DDE8HGFJ9");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("POST /@public/api/getnum");
  const [ridInput, setRidInput] = useState<string>("26134");
  const [playgroundRunning, setPlaygroundRunning] = useState<boolean>(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<string | null>(null);

  const basePath = "https://api.2oo9.cloud/MXS47FLFX0U/tness/@public/api";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunPlayground = async () => {
    setPlaygroundRunning(true);
    setPlaygroundResponse(null);

    const activeKey = playgroundKey.trim() || "M4DDE8HGFJ9";

    try {
      if (selectedEndpoint === "POST /@public/api/getnum") {
        const rid = ridInput.trim() || "26134";
        const res = await fetch("/api/stex/getnum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: rid, apiKey: activeKey }),
        });
        const json = await res.json();
        setPlaygroundResponse(JSON.stringify(json, null, 2));
      } else if (selectedEndpoint === "GET /@public/api/liveaccess") {
        const res = await fetch(`/api/stex/liveaccess?apiKey=${encodeURIComponent(activeKey)}`);
        const json = await res.json();
        setPlaygroundResponse(JSON.stringify(json, null, 2));
      } else if (selectedEndpoint === "GET /@public/api/success-otp") {
        const res = await fetch(`/api/stex/success-otp?apiKey=${encodeURIComponent(activeKey)}`);
        const json = await res.json();
        setPlaygroundResponse(JSON.stringify(json, null, 2));
      } else if (selectedEndpoint === "GET /@public/api/console") {
        const res = await fetch(`/api/stex/console?apiKey=${encodeURIComponent(activeKey)}`);
        const json = await res.json();
        setPlaygroundResponse(JSON.stringify(json, null, 2));
      } else {
        const res = await fetch(`/api/stex/console?apiKey=${encodeURIComponent(activeKey)}`);
        const json = await res.json();
        setPlaygroundResponse(JSON.stringify(json, null, 2));
      }
    } catch (err: any) {
      setPlaygroundResponse(
        JSON.stringify(
          {
            meta: { code: 500, status: "error" },
            message: err.message || "Failed to execute request",
          },
          null,
          2
        )
      );
    } finally {
      setPlaygroundRunning(false);
    }
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 font-sans text-slate-200">
      {/* HEADER TITLE */}
      <div className="space-y-1.5 pb-2">
        <div className="flex items-center gap-2 text-white">
          <BookOpen className="w-5 h-5 text-slate-400" />
          <h1 className="text-2xl font-bold tracking-tight">API Documentation</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Your token API reference. Authenticate with the <code className="text-cyan-300 font-mono">mauthapi</code> header — try it live in the Playground.
        </p>
      </div>

      {/* BASE PATH CARD */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#131722] border border-slate-800/90 shadow-lg space-y-2.5">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          BASE PATH
        </div>
        <div className="p-3.5 rounded-xl bg-[#0b0e17] border border-slate-800/80 font-mono text-xs text-slate-200 flex items-center justify-between gap-3 overflow-x-auto">
          <span className="text-slate-100 font-medium break-all">{basePath}</span>
          <button
            onClick={() => handleCopy(basePath, "basepath")}
            className="flex items-center gap-1 text-[11px] font-sans text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
          >
            {copiedKey === "basepath" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ON THIS PAGE NAV */}
      <div className="p-4 rounded-2xl bg-[#131722] border border-slate-800/90 shadow-md space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          ON THIS PAGE
        </div>
        <div className="flex flex-col gap-2 text-xs font-medium">
          <button
            onClick={() => scrollToId("section-playground")}
            className="flex items-center gap-2 text-lime-400 hover:text-lime-300 transition-colors cursor-pointer w-fit"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Playground</span>
          </button>
          <button
            onClick={() => scrollToId("section-public-api")}
            className="flex items-center gap-2 text-lime-400 hover:text-lime-300 transition-colors cursor-pointer w-fit"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Public API (token)</span>
          </button>
        </div>
      </div>

      {/* PLAYGROUND SECTION */}
      <div id="section-playground" className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-lime-400 fill-current" />
          <h2 className="text-lg font-bold text-white tracking-tight">Playground</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Try the token APIs live. Paste your API key (find it on your Profile page once an admin enables API access). The key is sent in the <code className="text-slate-300 font-mono">mauthapi</code> header.
        </p>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#131722] border border-slate-800/90 space-y-3 shadow-lg">
          {/* Key Input */}
          <div>
            <input
              type="text"
              value={playgroundKey}
              onChange={(e) => setPlaygroundKey(e.target.value)}
              placeholder="mauthapi — your API key (e.g. MAB12CD34EF…)"
              className="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Controls row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6 relative">
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="w-full appearance-none bg-[#0b0e17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600 pr-8 cursor-pointer"
              >
                <option value="POST /@public/api/getnum">POST /@public/api/getnum</option>
                <option value="GET /@public/api/liveaccess">GET /@public/api/liveaccess</option>
                <option value="GET /@public/api/success-otp">GET /@public/api/success-otp</option>
                <option value="GET /@public/api/console">GET /@public/api/console</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="sm:col-span-4">
              {selectedEndpoint === "POST /@public/api/getnum" && (
                <input
                  type="text"
                  value={ridInput}
                  onChange={(e) => setRidInput(e.target.value)}
                  placeholder="rid (e.g. 26134)"
                  className="w-full bg-[#0b0e17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600 transition-all placeholder:text-slate-500"
                />
              )}
            </div>

            <div className="sm:col-span-2">
              <button
                onClick={handleRunPlayground}
                disabled={playgroundRunning}
                className="w-full bg-[#d2f838] hover:bg-[#c3e82d] text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{playgroundRunning ? "Running..." : "Run"}</span>
              </button>
            </div>
          </div>

          {/* Response Output */}
          {playgroundResponse && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Response</span>
                <span className={playgroundResponse.includes("unauthorized") ? "text-rose-400" : "text-emerald-400"}>
                  {playgroundResponse.includes("unauthorized") ? "401 Unauthorized" : "200 OK"}
                </span>
              </div>
              <pre className={`p-4 rounded-xl bg-[#080a11] border border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed max-h-80 ${
                playgroundResponse.includes("unauthorized") ? "text-rose-400" : "text-emerald-400"
              }`}>
                {playgroundResponse}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* PUBLIC API (TOKEN) SECTION */}
      <div id="section-public-api" className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-lime-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Public API (token)</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Token-authenticated JSON endpoints. Send your key in the <code className="text-slate-300 font-mono">mauthapi</code> header. Unlike the dashboard, these return PLAIN JSON (no wire codec) — call them from curl, Postman, or any HTTP client. Every response uses the standard envelope &#123; meta:&#123;code,status&#125;, data, message, rid &#125;: read meta.code (200 = ok) and the payload from data. Generate your key on the Profile page (an admin must enable API access for your account first). Try them live in the Playground above.
        </p>

        {/* ENDPOINT 1: POST /@public/api/getnum */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131722] border border-slate-800/90 space-y-3 shadow-lg">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 font-bold border border-sky-800/80">
                POST
              </span>
              <span className="font-bold text-slate-100 break-all">
                https://orabitsms.xyz/@public/api/getnum
              </span>
            </div>
            <button
              onClick={() => handleCopy("https://orabitsms.xyz/@public/api/getnum", "ep1")}
              className="flex items-center gap-1 text-[11px] font-sans text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {copiedKey === "ep1" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Allocate one number from a range — same as the dialer Get Number.
          </p>

          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              REQUEST BODY
            </div>
            <div className="p-3 rounded-xl bg-[#0b0e17] border border-slate-800/80 font-mono text-xs text-slate-200">
              &#123; "rid": "26134" &#125;   // range digits (no XXX), OR a search-picker range_id
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              RESPONSE
            </div>
            <pre className="p-3.5 rounded-xl bg-[#0b0e17] border border-slate-800/80 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
{`{
  "meta":    { "code": 200, "status": "ok" },
  "data": {
    "full_number": "+447404333228",
    "national_number": "7404333228",
    "no_plus_number": "447404333228",
    "country": "United Kingdom",
    "operator": "EE"
  },
  "message": "number allocated",
  "rid": "…"
}`}
            </pre>
          </div>

          <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/60 leading-relaxed font-sans">
            <p>Header: mauthapi: &lt;your_api_key&gt;</p>
            <p>rid = the range number WITHOUT the trailing XXX (e.g. 26134), or a search-mode range_id.</p>
            <p>Every response uses the standard envelope &#123; meta:&#123;code,status&#125;, data, message, rid &#125; — same as the dashboard, just plain JSON.</p>
            <p>Out of stock → meta.code 2946 / status "not_found", data null.</p>
          </div>
        </div>

        {/* ENDPOINT 2: GET /@public/api/liveaccess */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131722] border border-slate-800/90 space-y-3 shadow-lg">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/80">
                GET
              </span>
              <span className="font-bold text-slate-100 break-all">
                https://orabitsms.xyz/@public/api/liveaccess
              </span>
            </div>
            <button
              onClick={() => handleCopy("https://orabitsms.xyz/@public/api/liveaccess", "ep2")}
              className="flex items-center gap-1 text-[11px] font-sans text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {copiedKey === "ep2" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Recently-active services + the ranges each one hit (the getnum Access cache).
          </p>

          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              RESPONSE
            </div>
            <pre className="p-3.5 rounded-xl bg-[#0b0e17] border border-slate-800/80 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
{`{
  "meta":    { "code": 200, "status": "ok" },
  "data": {
    "cached": true,
    "services": [
      { "sid": "Telegram", "last_at": 1779460000000, "ranges": ["22501XXX", "8801XXX"] }
    ]
  },
  "message": "ok",
  "rid": "…"
}`}
            </pre>
          </div>

          <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/60 leading-relaxed font-sans">
            <p>Same response for every caller; cached 60s.</p>
            <p>Console-hidden services are excluded.</p>
          </div>
        </div>

        {/* ENDPOINT 3: GET /@public/api/success-otp */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131722] border border-slate-800/90 space-y-3 shadow-lg">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/80">
                GET
              </span>
              <span className="font-bold text-slate-100 break-all">
                https://orabitsms.xyz/@public/api/success-otp
              </span>
            </div>
            <button
              onClick={() => handleCopy("https://orabitsms.xyz/@public/api/success-otp", "ep3")}
              className="flex items-center gap-1 text-[11px] font-sans text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {copiedKey === "ep3" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Your own last 50 successful OTPs.
          </p>

          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              RESPONSE
            </div>
            <pre className="p-3.5 rounded-xl bg-[#0b0e17] border border-slate-800/80 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
{`{
  "meta":    { "code": 200, "status": "ok" },
  "data": {
    "cached": false,
    "otps": [
      {
        "otp_id": "4474043332281779460000000",
        "number": "447404333228",
        "message": "Your code is 123456",
        "time": 1779460000000
      }
    ]
  },
  "message": "ok",
  "rid": "…"
}`}
            </pre>
          </div>

          <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/60 leading-relaxed font-sans">
            <p>Only numbers allocated to you.</p>
            <p>otp_id = number + time(ms).</p>
            <p>time = unix-ms when the OTP hit.</p>
            <p>Cached 5s per user.</p>
          </div>
        </div>

        {/* ENDPOINT 4: GET /@public/api/console */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131722] border border-slate-800/90 space-y-3 shadow-lg">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/80">
                GET
              </span>
              <span className="font-bold text-slate-100 break-all">
                https://orabitsms.xyz/@public/api/console
              </span>
            </div>
            <button
              onClick={() => handleCopy("https://orabitsms.xyz/@public/api/console", "ep4")}
              className="flex items-center gap-1 text-[11px] font-sans text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {copiedKey === "ep4" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Global live feed of recent hits (last 15 minutes).
          </p>

          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              RESPONSE
            </div>
            <pre className="p-3.5 rounded-xl bg-[#0b0e17] border border-slate-800/80 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
{`{
  "meta":    { "code": 200, "status": "ok" },
  "data": {
    "cached": false,
    "hits": [
      { "range": "22501XXX", "sid": "WhatsApp", "message": "Your code 998877", "time": 1779460000000 }
    ]
  },
  "message": "ok",
  "rid": "…"
}`}
            </pre>
          </div>

          <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/60 leading-relaxed font-sans">
            <p>Global — all traffic.</p>
            <p>Console hide rules applied (hidden uid / sid / keyword rows dropped).</p>
            <p>Cached 5s.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

