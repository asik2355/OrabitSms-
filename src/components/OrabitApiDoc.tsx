import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Play,
  Terminal,
  Key,
  Globe,
  Lock,
  ChevronDown,
  BookOpen,
} from "lucide-react";

interface OrabitApiDocProps {
  apiKey: string;
}

export const OrabitApiDoc: React.FC<OrabitApiDocProps> = ({ apiKey }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Playground state
  const [playgroundKey, setPlaygroundKey] = useState(apiKey || "MAB12CD34EF987654321");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("POST /@public/api/getnum");
  const [ridInput, setRidInput] = useState<string>("26134");
  const [playgroundRunning, setPlaygroundRunning] = useState<boolean>(false);
  const [playgroundResponse, setPlaygroundResponse] = useState<string | null>(null);

  const basePath = "https://orabitsms.xyz/@public/api";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunPlayground = () => {
    setPlaygroundRunning(true);
    setPlaygroundResponse(null);

    setTimeout(() => {
      setPlaygroundRunning(false);
      const currentTimeMs = Date.now();

      if (selectedEndpoint === "POST /@public/api/getnum") {
        const rid = ridInput || "26134";
        setPlaygroundResponse(
          JSON.stringify(
            {
              meta: { code: 200, status: "ok" },
              data: {
                full_number: "+447404333228",
                national_number: "7404333228",
                no_plus_number: "447404333228",
                country: "United Kingdom",
                operator: "EE",
              },
              message: "number allocated",
              rid: rid,
            },
            null,
            2
          )
        );
      } else if (selectedEndpoint === "GET /@public/api/liveaccess") {
        setPlaygroundResponse(
          JSON.stringify(
            {
              meta: { code: 200, status: "ok" },
              data: {
                cached: true,
                services: [
                  { sid: "Telegram", last_at: currentTimeMs, ranges: ["22501XXX", "8801XXX"] },
                  { sid: "WhatsApp", last_at: currentTimeMs - 12000, ranges: ["44740XXX", "1202XXX"] },
                ],
              },
              message: "ok",
              rid: "",
            },
            null,
            2
          )
        );
      } else if (selectedEndpoint === "GET /@public/api/success-otp") {
        setPlaygroundResponse(
          JSON.stringify(
            {
              meta: { code: 200, status: "ok" },
              data: {
                cached: false,
                otps: [
                  {
                    otp_id: "447404333228" + currentTimeMs,
                    number: "447404333228",
                    message: "Your verification code is 123456",
                    time: currentTimeMs,
                  },
                ],
              },
              message: "ok",
              rid: "",
            },
            null,
            2
          )
        );
      } else if (selectedEndpoint === "GET /@public/api/console") {
        setPlaygroundResponse(
          JSON.stringify(
            {
              meta: { code: 200, status: "ok" },
              data: {
                cached: false,
                hits: [
                  { range: "22501XXX", sid: "WhatsApp", message: "Your code 998877", time: currentTimeMs },
                  { range: "44740XXX", sid: "Telegram", message: "Telegram code: 45612", time: currentTimeMs - 3000 },
                ],
              },
              message: "ok",
              rid: "",
            },
            null,
            2
          )
        );
      }
    }, 400);
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 font-sans text-slate-200">
      {/* PAGE TITLE */}
      <div className="space-y-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 text-white">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">API Documentation</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Your token API reference. Authenticate with the <code className="bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono">mauthapi</code> header — try it live in the Playground.
        </p>
      </div>

      {/* BASE PATH CARD */}
      <div className="p-5 rounded-2xl bg-[#0f1422] border border-slate-800/90 shadow-xl space-y-3 relative overflow-hidden">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-mono">
          BASE PATH
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a0d17] p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 break-all">
          <span>{basePath}</span>
          <button
            onClick={() => handleCopy(basePath, "basepath")}
            className="self-end sm:self-center bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            {copiedKey === "basepath" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ON THIS PAGE NAV */}
      <div className="p-4 rounded-2xl bg-[#0f1422] border border-slate-800/90 shadow-md space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
          ON THIS PAGE
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold">
          <button
            onClick={() => scrollToId("section-playground")}
            className="flex items-center gap-1.5 text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Playground</span>
          </button>
          <button
            onClick={() => scrollToId("section-public-api")}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Public API (token)</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PLAYGROUND */}
      <div id="section-playground" className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-yellow-400 fill-current" />
          <h2 className="text-lg font-bold text-white tracking-tight">Playground</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Try the token APIs live. Paste your API key (find it on your Profile page once an admin enables API access). The key is sent in the <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono">mauthapi</code> header.
        </p>

        <div className="p-5 rounded-2xl bg-[#0f1422] border border-slate-800 space-y-4 shadow-xl">
          {/* API Key Input */}
          <div className="space-y-1">
            <input
              type="text"
              value={playgroundKey}
              onChange={(e) => setPlaygroundKey(e.target.value)}
              placeholder="mauthapi — your API key (e.g. MAB12CD34EF…)"
              className="w-full bg-[#080b12] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Endpoint + Param + Run Row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <select
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="w-full appearance-none bg-[#080b12] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400 pr-8 cursor-pointer"
              >
                <option value="POST /@public/api/getnum">POST /@public/api/getnum</option>
                <option value="GET /@public/api/liveaccess">GET /@public/api/liveaccess</option>
                <option value="GET /@public/api/success-otp">GET /@public/api/success-otp</option>
                <option value="GET /@public/api/console">GET /@public/api/console</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {selectedEndpoint === "POST /@public/api/getnum" ? (
              <div className="md:col-span-4">
                <input
                  type="text"
                  value={ridInput}
                  onChange={(e) => setRidInput(e.target.value)}
                  placeholder="rid (e.g. 26134)"
                  className="w-full bg-[#080b12] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400 transition-all placeholder:text-slate-600"
                />
              </div>
            ) : (
              <div className="md:col-span-4 hidden md:block"></div>
            )}

            <div className="md:col-span-2">
              <button
                onClick={handleRunPlayground}
                disabled={playgroundRunning}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{playgroundRunning ? "Running..." : "Run"}</span>
              </button>
            </div>
          </div>

          {/* Playground Response */}
          {playgroundResponse && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Response Output</span>
                <span className="text-emerald-400">200 OK</span>
              </div>
              <pre className="p-4 rounded-xl bg-[#06080e] border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed max-h-80">
                {playgroundResponse}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: PUBLIC API (TOKEN) */}
      <div id="section-public-api" className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-cyan-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">Public API (token)</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Token-authenticated JSON endpoints. Send your key in the <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono">mauthapi</code> header. Unlike the dashboard, these return PLAIN JSON (no wire codec) — call them from curl, Postman, or any HTTP client. Every response uses the standard envelope <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-300 font-mono">&#123; meta:&#123;code,status&#125;, data, message, rid &#125;</code>: read meta.code (200 = ok) and the payload from data. Generate your key on the Profile page (an admin must enable API access for your account first). Try them live in the Playground above.
        </p>

        {/* ENDPOINT 1: POST /@public/api/getnum */}
        <div className="p-5 rounded-2xl bg-[#0f1422] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5 flex-wrap font-mono text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                POST
              </span>
              <span className="font-bold text-white tracking-wide break-all">
                https://orabitsms.xyz/@public/api/getnum
              </span>
            </div>
            <button
              onClick={() => handleCopy("https://orabitsms.xyz/@public/api/getnum", "ep1")}
              className="self-end sm:self-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all shrink-0 cursor-pointer"
            >
              {copiedKey === "ep1" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedKey === "ep1" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Allocate one number from a range — same as the dialer Get Number.
          </p>

          {/* Request Body */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              REQUEST BODY
            </div>
            <pre className="p-3.5 rounded-xl bg-[#070a12] border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto">
{`{ "rid": "26134" }   // range digits (no XXX), OR a search-picker range_id`}
            </pre>
          </div>

          {/* Response */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              RESPONSE
            </div>
            <pre className="p-4 rounded-xl bg-[#070a12] border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
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

          {/* Footnotes */}
          <div className="p-3 rounded-xl bg-[#080b14] border border-slate-800/80 text-xs text-slate-400 font-mono space-y-1">
            <p>Header: mauthapi: &lt;your_api_key&gt;</p>
            <p>rid = the range number WITHOUT the trailing XXX (e.g. 26134), or a search-mode range_id.</p>
            <p>Every response uses the standard envelope &#123; meta:&#123;code,status&#125;, data, message, rid &#125; — same as the dashboard, just plain JSON.</p>
            <p>Out of stock → meta.code 2946 / status "not_found", data null.</p>
          </div>
        </div>

        {/* ENDPOINT 2: GET /@public/api/liveaccess */}
        <div className="p-5 rounded-2xl bg-[#0f1422] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5 flex-wrap font-mono text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                GET
              </span>
              <span className="font-bold text-white tracking-wide break-all">
                https://orabitsms.xyz/@public/api/liveaccess
              </span>
            </div>
            <button
              onClick={() => handleCopy("https://orabitsms.xyz/@public/api/liveaccess", "ep2")}
              className="self-end sm:self-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all shrink-0 cursor-pointer"
            >
              {copiedKey === "ep2" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedKey === "ep2" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Recently-active services + the ranges each one hit (the getnum Access cache).
          </p>

          {/* Response */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              RESPONSE
            </div>
            <pre className="p-4 rounded-xl bg-[#070a12] border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
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

          {/* Footnotes */}
          <div className="p-3 rounded-xl bg-[#080b14] border border-slate-800/80 text-xs text-slate-400 font-mono space-y-1">
            <p>Same response for every caller; cached 60s.</p>
            <p>Console-hidden services are excluded.</p>
          </div>
        </div>

        {/* ENDPOINT 3: GET /@public/api/success-otp */}
        <div className="p-5 rounded-2xl bg-[#0f1422] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5 flex-wrap font-mono text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                GET
              </span>
              <span className="font-bold text-white tracking-wide break-all">
                https://orabitsms.xyz/@public/api/success-otp
              </span>
            </div>
            <button
              onClick={() => handleCopy("https://orabitsms.xyz/@public/api/success-otp", "ep3")}
              className="self-end sm:self-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all shrink-0 cursor-pointer"
            >
              {copiedKey === "ep3" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedKey === "ep3" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Your own last 50 successful OTPs.
          </p>

          {/* Response */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              RESPONSE
            </div>
            <pre className="p-4 rounded-xl bg-[#070a12] border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
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

          {/* Footnotes */}
          <div className="p-3 rounded-xl bg-[#080b14] border border-slate-800/80 text-xs text-slate-400 font-mono space-y-1">
            <p>Only numbers allocated to you.</p>
            <p>otp_id = number + time(ms).</p>
            <p>time = unix-ms when the OTP hit.</p>
            <p>Cached 5s per user.</p>
          </div>
        </div>

        {/* ENDPOINT 4: GET /@public/api/console */}
        <div className="p-5 rounded-2xl bg-[#0f1422] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5 flex-wrap font-mono text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                GET
              </span>
              <span className="font-bold text-white tracking-wide break-all">
                https://orabitsms.xyz/@public/api/console
              </span>
            </div>
            <button
              onClick={() => handleCopy("https://orabitsms.xyz/@public/api/console", "ep4")}
              className="self-end sm:self-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-all shrink-0 cursor-pointer"
            >
              {copiedKey === "ep4" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedKey === "ep4" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Global live feed of recent hits (last 15 minutes).
          </p>

          {/* Response */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              RESPONSE
            </div>
            <pre className="p-4 rounded-xl bg-[#070a12] border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
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

          {/* Footnotes */}
          <div className="p-3 rounded-xl bg-[#080b14] border border-slate-800/80 text-xs text-slate-400 font-mono space-y-1">
            <p>Global — all traffic.</p>
            <p>Console hide rules applied (hidden uid / sid / keyword rows dropped).</p>
            <p>Cached 5s.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
