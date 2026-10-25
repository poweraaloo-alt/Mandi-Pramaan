import React, { useState } from "react";
import {
  Activity,
  Cpu,
  Eye,
  KeyRound,
  Mic,
  Scale,
  ShieldCheck,
  Volume2,
  X,
} from "lucide-react";

export default function TopTelemetryBar({
  telemetry,
  stateCode,
  onStateChange,
  apiKey,
  onSaveApiKey,
  isRunning,
}) {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [draftKey, setDraftKey] = useState(apiKey || "");

  const stages = [
    {
      id: "saaras",
      label: "Saaras v4 ASR",
      ms: telemetry?.saaras_asr_ms ?? 212,
      icon: Mic,
      color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/40",
    },
    {
      id: "vision",
      label: "Sarvam Vision VLM",
      ms: telemetry?.sarvam_vision_ms ?? 295,
      icon: Eye,
      color: "text-amber-400 border-amber-500/30 bg-amber-950/40",
    },
    {
      id: "arbiter",
      label: "Sarvam-105B Arbiter",
      ms: telemetry?.sarvam_105b_ms ?? 418,
      icon: Cpu,
      color: "text-purple-400 border-purple-500/30 bg-purple-950/40",
    },
    {
      id: "bulbul",
      label: "Bulbul v3 TTS",
      ms: telemetry?.bulbul_tts_ms ?? 184,
      icon: Volume2,
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/40",
    },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    onSaveApiKey(draftKey.trim());
    setShowKeyModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur-md px-4 py-2.5">
        <div className="max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/30">
              <Scale className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white">
                  MANDI-PRAMAAN <span className="text-amber-400 font-semibold">(मंडी-प्रमाण)</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  {telemetry?.live_api_used ? "SARVAM LIVE API" : "SOVEREIGN STACK READY"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sovereign Multimodal APMC Agricultural Auction &amp; Kaccha Parchi Arbitrator
              </p>
            </div>
          </div>

          {/* 4-Stage Pipeline Telemetry Pills */}
          <div className="hidden xl:flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <Activity
              className={`w-4 h-4 mr-1 ${
                isRunning ? "text-amber-400 animate-spin" : "text-emerald-400"
              }`}
            />
            {stages.map((st, idx) => {
              const Icon = st.icon;
              return (
                <React.Fragment key={st.id}>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${st.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-medium">{st.label}:</span>
                    <span className="font-bold">{isRunning ? "..." : `${st.ms}ms`}</span>
                  </div>
                  {idx < stages.length - 1 && (
                    <span className="text-slate-600 font-mono text-xs">→</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Right Controls: State APMC Act Selector + API Key Settings */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                APMC Statute:
              </span>
              <select
                value={stateCode}
                onChange={(e) => onStateChange(e.target.value)}
                className="bg-slate-950 text-amber-300 text-xs font-semibold rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-amber-500"
              >
                <option value="MP">Madhya Pradesh (Sec 32 &amp; 37)</option>
                <option value="MH">Maharashtra (Sec 30A &amp; 31)</option>
                <option value="PB">Punjab (J-Form Rule 24)</option>
              </select>
            </div>

            <button
              onClick={() => {
                setDraftKey(apiKey || "");
                setShowKeyModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{apiKey ? "Sarvam Key Active" : "API Key Settings"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  Sarvam AI Subscription Key
                </h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Your backend <code className="text-amber-300">.env</code> is already loaded automatically.
              You can also override <code className="text-amber-300">SARVAM_API_KEY</code> in the browser
              header (<code className="text-cyan-300">X-Sarvam-Api-Key</code>) for live calls to{" "}
              <strong>Saaras v4</strong>, <strong>Sarvam-105B</strong>, and <strong>Bulbul v3</strong>.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  SARVAM_API_KEY (Optional Browser Override)
                </label>
                <input
                  type="password"
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  placeholder="sk_... (leave blank to use backend .env key)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
                >
                  Save &amp; Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
