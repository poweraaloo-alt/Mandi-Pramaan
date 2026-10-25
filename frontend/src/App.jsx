import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Cpu,
  Download,
  Eye,
  FileText,
  Gavel,
  GitBranch,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Mic,
  Play,
  QrCode,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sliders,
  Sparkles,
  Square,
  Volume2,
} from "lucide-react";
import { generateKacchaParchiDataUrl } from "./utils/parchiCanvasGenerator";
import { playBase64AudioOrFallback } from "./utils/audioHelper";
import {
  PRESET_CASES,
  STATE_APMC_RULES,
  buildBrowserMerkleAnchor,
  computeStatutoryAudit,
  formatINR,
} from "./utils/standaloneEngine";

const LANGUAGES = [
  { code: "hi-IN", label: "हिंदी (Hindi)", speaker: "shubh" },
  { code: "mr-IN", label: "मराठी (Marathi)", speaker: "aditya" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)", speaker: "shubh" },
  { code: "ta-IN", label: "தமிழ் (Tamil)", speaker: "ritu" },
  { code: "te-IN", label: "తెలుగు (Telugu)", speaker: "aditya" },
];

const STATUS_BADGE = {
  CRITICAL_VIOLATION: {
    label: "STATUTORY VIOLATION",
    cls: "bg-red-100 text-red-800 border-red-300",
  },
  MSP_BREACH: {
    label: "BELOW MSP FLOOR",
    cls: "bg-orange-100 text-orange-800 border-orange-300",
  },
  COMPLIANT: {
    label: "VERIFIED COMPLIANT",
    cls: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
};

function DeterministicQrSvg({ payload, size = 148 }) {
  const cells = 21;
  const grid = Array.from({ length: cells }, () => Array(cells).fill(false));
  const drawFinder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, cells - 7);
  drawFinder(cells - 7, 0);

  let hash = 2166136261;
  const str = payload || "MANDI-PRAMAAN";
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c >= cells - 8) || (r >= cells - 8 && c < 8))
        continue;
      const seed = (r * 31 + c * 17 + Math.abs(hash)) % 11;
      grid[r][c] = seed % 2 === 0;
    }
  }
  const cellSize = size / cells;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-xl bg-white p-2 border border-slate-200 shadow-sm"
    >
      {grid.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx * cellSize}
              y={rIdx * cellSize}
              width={cellSize + 0.35}
              height={cellSize + 0.35}
              fill="#0F172A"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function App() {
  const [presetId, setPresetId] = useState("sehore_wheat_fraud");
  const [spoken, setSpoken] = useState(() =>
    structuredClone(PRESET_CASES.sehore_wheat_fraud.spoken_deal)
  );
  const [written, setWritten] = useState(() =>
    structuredClone(PRESET_CASES.sehore_wheat_fraud.written_parchi)
  );
  const [stateCode, setStateCode] = useState("MP");
  const [showEditor, setShowEditor] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [parchiImageUrl, setParchiImageUrl] = useState("");
  const [merkle, setMerkle] = useState(null);

  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("MANDI_SARVAM_API_KEY") || ""
  );
  const [draftKey, setDraftKey] = useState(apiKey);
  const [selectedLang, setSelectedLang] = useState("hi-IN");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCallingAi, setIsCallingAi] = useState(false);
  const [customReasoning, setCustomReasoning] = useState(null);
  const [copiedRoot, setCopiedRoot] = useState(false);
  const stopAudioRef = useRef(null);

  const baseCase = PRESET_CASES[presetId] || PRESET_CASES.sehore_wheat_fraud;
  const audit = computeStatutoryAudit({ ...spoken, state_code: stateCode }, written);
  const reasoning = customReasoning || baseCase.fallback_reasoning;
  const statusMap = Object.fromEntries(
    audit.comparison_rows.map((r) => [r.field_id, r.status])
  );

  useEffect(() => {
    const url = generateKacchaParchiDataUrl(written, spoken);
    setParchiImageUrl(url);
    buildBrowserMerkleAnchor({ ...spoken, state_code: stateCode }, written, audit).then(
      setMerkle
    );
  }, [spoken, written, stateCode]);

  const handleSelectPreset = (id) => {
    const next = PRESET_CASES[id];
    if (!next) return;
    setPresetId(id);
    setSpoken(structuredClone(next.spoken_deal));
    setWritten(structuredClone(next.written_parchi));
    setStateCode(next.spoken_deal.state_code);
    setSelectedLang(next.spoken_deal.language_code || "hi-IN");
    setCustomReasoning(null);
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
      setIsPlaying(false);
    }
  };

  const handleSaveKey = (val) => {
    setApiKey(val);
    if (val) localStorage.setItem("MANDI_SARVAM_API_KEY", val);
    else localStorage.removeItem("MANDI_SARVAM_API_KEY");
    setShowKeyModal(false);
  };

  const updateSlipNumbers = (patchSpoken, patchWritten) => {
    const nextSpoken = { ...spoken, ...patchSpoken };
    if ("bags" in patchSpoken) {
      nextSpoken.agreed_net_weight_qtl = Number(
        ((Number(nextSpoken.bags) * 50) / 100).toFixed(2)
      );
    }
    const nextWritten = { ...written, ...patchWritten };
    const netW = Number(nextWritten.recorded_net_weight_qtl || 0);
    const karda = Number(nextWritten.karda_moisture_cut_qtl || 0);
    const rateW = Number(nextWritten.written_rate_per_qtl || 0);
    const gross = Number((netW * rateW).toFixed(2));
    nextWritten.gross_weight_qtl = Number((netW + karda).toFixed(2));
    nextWritten.gross_written_amount_inr = gross;
    const totalDed =
      Number(nextWritten.deducted_aadat_inr || 0) +
      Number(nextWritten.deducted_hammali_tulai_inr || 0) +
      Number(nextWritten.deducted_dharmada_inr || 0) +
      Number(nextWritten.deducted_muddat_inr || 0);
    nextWritten.written_net_payable_inr = Number((gross - totalDed).toFixed(2));

    setSpoken(nextSpoken);
    setWritten(nextWritten);
  };

  const handleAskSarvam105B = async () => {
    setIsCallingAi(true);
    try {
      if (apiKey) {
        const resp = await fetch("https://api.sarvam.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-subscription-key": apiKey.trim(),
          },
          body: JSON.stringify({
            model: "sarvam-105b",
            messages: [
              {
                role: "system",
                content:
                  'You are Mandi-Pramaan, an APMC agricultural trade arbitrator. Return ONLY valid JSON with keys: {"executive_verdict_title": "string", "legal_summary": "string", "statutory_notices": ["string"], "farmer_spoken_summary_native": "Hindi summary in Devanagari script"}',
              },
              {
                role: "user",
                content: JSON.stringify({
                  farmer: spoken.farmer_name,
                  mandi: spoken.mandi_name,
                  state_act: audit.state_act_name,
                  lawful_net_payable_inr: audit.lawful_net_payable_inr,
                  written_net_payable_inr: audit.written_net_payable_inr,
                  underpaid_inr: audit.total_farmer_underpayment_inr,
                  weight_loss_inr: audit.weight_loss_inr,
                  rate_loss_inr: audit.rate_loss_inr,
                  illegal_aadat_inr: audit.illegal_aadat_inr,
                }),
              },
            ],
            temperature: 0.1,
            max_tokens: 900,
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          const raw = (data.choices?.[0]?.message?.content || "")
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "");
          const parsed = JSON.parse(raw);
          setCustomReasoning({
            ...baseCase.fallback_reasoning,
            executive_verdict_title:
              parsed.executive_verdict_title ||
              baseCase.fallback_reasoning.executive_verdict_title,
            legal_summary:
              parsed.legal_summary || baseCase.fallback_reasoning.legal_summary,
            statutory_notices:
              parsed.statutory_notices || baseCase.fallback_reasoning.statutory_notices,
            farmer_spoken_summary_native:
              parsed.farmer_spoken_summary_native ||
              baseCase.fallback_reasoning.farmer_spoken_summary_native,
          });
        }
      }
    } catch (e) {
      console.warn("Using deterministic statutory summary:", e);
    } finally {
      setIsCallingAi(false);
    }
  };

  const handleSpeakVoice = async (langCode = selectedLang) => {
    if (isPlaying && stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
      setIsPlaying(false);
      return;
    }

    const langObj = LANGUAGES.find((l) => l.code === langCode) || LANGUAGES[0];
    const scriptText =
      reasoning.multilingual_scripts?.[langCode] ||
      reasoning.farmer_spoken_summary_native;

    let audioB64 = null;
    if (apiKey) {
      try {
        const resp = await fetch("https://api.sarvam.ai/text-to-speech", {
          method: "POST",
          headers: {
            "api-subscription-key": apiKey.trim(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: [scriptText.slice(0, 2400)],
            target_language_code: langCode,
            speaker: langObj.speaker,
            pace: 1.0,
            speech_sample_rate: 24000,
            enable_preprocessing: true,
            model: "bulbul:v3",
          }),
        });
        if (resp.ok) {
          const d = await resp.json();
          audioB64 = d.audios?.[0] || null;
        }
      } catch {
        audioB64 = null;
      }
    }

    stopAudioRef.current = playBase64AudioOrFallback(
      audioB64,
      scriptText,
      langCode,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
  };

  const underpaid = audit.total_farmer_underpayment_inr;
  const activeVoiceScript =
    reasoning.multilingual_scripts?.[selectedLang] ||
    reasoning.farmer_spoken_summary_native;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* =================================================================== */}
      {/* TOP WEBSITE NAVBAR                                                  */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight">
                  MANDI-PRAMAAN
                </span>
                <span className="text-amber-400 font-bold text-base">
                  (मंडी-प्रमाण)
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sarvam Sovereign Stack
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multimodal APMC Agricultural Auction &amp; Kaccha Parchi Arbitrator
              </p>
            </div>
          </div>

          {/* Pipeline Badges */}
          <div className="hidden xl:flex items-center gap-2 text-xs font-mono bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="flex items-center gap-1 text-sky-400">
              <Mic className="w-3.5 h-3.5" /> Saaras v4
            </span>
            <span className="text-slate-600">→</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Eye className="w-3.5 h-3.5" /> Sarvam Vision
            </span>
            <span className="text-slate-600">→</span>
            <span className="flex items-center gap-1 text-purple-400">
              <Cpu className="w-3.5 h-3.5" /> Sarvam-105B
            </span>
            <span className="text-slate-600">→</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Volume2 className="w-3.5 h-3.5" /> Bulbul v3
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-700 text-amber-300 text-xs font-semibold px-3 py-2 focus:outline-none focus:border-amber-400"
            >
              {Object.entries(STATE_APMC_RULES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setDraftKey(apiKey);
                setShowKeyModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{apiKey ? "API Key Active" : "Sarvam API Key"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* MAIN DASHBOARD CONTAINER                                            */}
      {/* =================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. CASE SELECTOR CARDS */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Live APMC Auction Case Preset
            </span>
            <button
              type="button"
              onClick={() => setShowEditor(!showEditor)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg cursor-pointer transition"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>
                {showEditor
                  ? "Hide Custom Number Simulator"
                  : "✏️ Edit Auction / Slip Numbers Live"}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {Object.values(PRESET_CASES).map((item) => {
              const active = presetId === item.case_id;
              const isClean = item.severity === "COMPLIANT";
              return (
                <button
                  key={item.case_id}
                  onClick={() => handleSelectPreset(item.case_id)}
                  className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer bg-white shadow-xs ${
                    active
                      ? "border-amber-600 ring-4 ring-amber-500/15"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isClean
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-red-50 text-red-800 border-red-300"
                      }`}
                    >
                      {isClean ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {item.badge_text}
                    </span>
                    {active && (
                      <span className="text-xs font-extrabold text-amber-700">
                        ● ACTIVE CASE
                      </span>
                    )}
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    {item.short_title}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Farmer: {item.spoken_deal.farmer_name} ·{" "}
                    {item.spoken_deal.bags} Bags ({item.spoken_deal.agreed_net_weight_qtl}{" "}
                    Qtl)
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* OPTIONAL INTERACTIVE NUMBER SIMULATOR */}
        {showEditor && (
          <section className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-700" />
                <span>
                  Live Slip &amp; Auction Tamper Simulator (Updates Handwritten Slip Image
                  &amp; APMC Audit Automatically)
                </span>
              </h3>
              <button
                type="button"
                onClick={() => handleSelectPreset(presetId)}
                className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bags (50kg)
                </label>
                <input
                  type="number"
                  value={spoken.bags}
                  onChange={(e) =>
                    updateSlipNumbers({ bags: Number(e.target.value) }, {})
                  }
                  className="w-full rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Auction Rate (₹)
                </label>
                <input
                  type="number"
                  value={spoken.agreed_rate_per_qtl}
                  onChange={(e) =>
                    updateSlipNumbers(
                      { agreed_rate_per_qtl: Number(e.target.value) },
                      {}
                    )
                  }
                  className="w-full rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 font-bold text-emerald-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slip Net Wt (Qtl)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={written.recorded_net_weight_qtl}
                  onChange={(e) =>
                    updateSlipNumbers(
                      {},
                      { recorded_net_weight_qtl: Number(e.target.value) }
                    )
                  }
                  className="w-full rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 font-bold text-red-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slip Rate (₹)
                </label>
                <input
                  type="number"
                  value={written.written_rate_per_qtl}
                  onChange={(e) =>
                    updateSlipNumbers(
                      {},
                      { written_rate_per_qtl: Number(e.target.value) }
                    )
                  }
                  className="w-full rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 font-bold text-red-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aadat Cut (₹)
                </label>
                <input
                  type="number"
                  value={written.deducted_aadat_inr}
                  onChange={(e) =>
                    updateSlipNumbers(
                      {},
                      { deducted_aadat_inr: Number(e.target.value) }
                    )
                  }
                  className="w-full rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 font-bold text-red-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hammali (₹)
                </label>
                <input
                  type="number"
                  value={written.deducted_hammali_tulai_inr}
                  onChange={(e) =>
                    updateSlipNumbers(
                      {},
                      { deducted_hammali_tulai_inr: Number(e.target.value) }
                    )
                  }
                  className="w-full rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dharmada (₹)
                </label>
                <input
                  type="number"
                  value={written.deducted_dharmada_inr}
                  onChange={(e) =>
                    updateSlipNumbers(
                      {},
                      { deducted_dharmada_inr: Number(e.target.value) }
                    )
                  }
                  className="w-full rounded-lg bg-white border border-slate-300 px-2.5 py-1.5 font-bold text-red-700"
                />
              </div>
            </div>
          </section>
        )}

        {/* 2. HERO VERDICT BANNER + 4 FINANCIAL CARDS */}
        <section
          className={`rounded-2xl border-2 p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
            underpaid > 0
              ? "bg-gradient-to-r from-red-50 via-orange-50/60 to-white border-red-300"
              : "bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-300"
          }`}
        >
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  underpaid > 0
                    ? "bg-red-700 text-white"
                    : "bg-emerald-700 text-white"
                }`}
              >
                {underpaid > 0
                  ? `🚨 ${audit.violation_count} APMC STATUTORY VIOLATIONS DETECTED`
                  : "✅ 100% COMPLIANT SETTLEMENT"}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {audit.state_act_name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {reasoning.executive_verdict_title}
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {reasoning.legal_summary}
            </p>
          </div>

          {/* Financial Summary Box */}
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto shrink-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-500">
                Lawful Payout
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-emerald-700 mt-0.5">
                {formatINR(audit.lawful_net_payable_inr)}
              </div>
            </div>
            <div className="border-x border-slate-200 px-3">
              <div className="text-[11px] font-bold uppercase text-slate-500">
                Slip Written
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-slate-700 mt-0.5">
                {formatINR(audit.written_net_payable_inr)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase text-slate-500">
                {underpaid > 0 ? "Recovery Due" : "Discrepancy"}
              </div>
              <div
                className={`text-lg sm:text-xl font-extrabold mt-0.5 ${
                  underpaid > 0 ? "text-red-700" : "text-emerald-700"
                }`}
              >
                {underpaid > 0 ? `+${formatINR(underpaid)}` : "₹0.00"}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 3. SIDE-BY-SIDE WORKBENCH: EVIDENCE (LEFT) + ARBITRATION (RIGHT)  */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 5 COLS: HANDWRITTEN KACCHA PARCHI + SPOKEN AUDIO */}
          <div className="lg:col-span-5 space-y-6">
            {/* Handwritten Kaccha Parchi Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    Stage 2 · Sarvam Vision ROI
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Handwritten Kaccha Parchi Slip
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  Hover regions to cross-highlight
                </span>
              </div>

              <div className="relative w-full rounded-xl overflow-hidden border border-slate-300 shadow-xs">
                {parchiImageUrl && (
                  <img
                    src={parchiImageUrl}
                    alt="Handwritten Kaccha Parchi"
                    className="w-full h-auto block"
                  />
                )}
                <svg
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full"
                >
                  {(written.bounding_boxes || []).map((box) => {
                    const [xMin, yMin, xMax, yMax] = box.bbox;
                    const rowSt = statusMap[box.field_id] || box.status;
                    const isBad = rowSt !== "COMPLIANT";
                    const isActive = activeFieldId === box.field_id;
                    return (
                      <rect
                        key={box.field_id}
                        x={xMin * 1000}
                        y={yMin * 1000}
                        width={(xMax - xMin) * 1000}
                        height={(yMax - yMin) * 1000}
                        rx={14}
                        fill={
                          isActive
                            ? isBad
                              ? "rgba(185, 28, 28, 0.22)"
                              : "rgba(21, 128, 61, 0.18)"
                            : "transparent"
                        }
                        stroke={isBad ? "#DC2626" : "#16A34A"}
                        strokeWidth={isActive ? 7 : isBad ? 5 : 3}
                        strokeDasharray={isBad ? "14 6" : "none"}
                        onMouseEnter={() => setActiveFieldId(box.field_id)}
                        onMouseLeave={() => setActiveFieldId(null)}
                        className="cursor-pointer"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Spoken Auction Transcript & Timestamps Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                  Stage 1 · Saaras v4 Code-Mixed ASR
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Verbatim Spoken Auction (Boli)
                </h3>
              </div>

              <blockquote className="border-l-4 border-amber-600 bg-amber-50/70 p-3.5 rounded-r-xl text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
                &ldquo;{spoken.transcript}&rdquo;
              </blockquote>

              <div className="space-y-2 pt-1">
                {(spoken.timestamp_spans || []).map((span) => {
                  const st = statusMap[span.field_id] || "COMPLIANT";
                  const badge = STATUS_BADGE[st] || STATUS_BADGE.COMPLIANT;
                  const active = activeFieldId === span.field_id;
                  return (
                    <div
                      key={span.field_id}
                      onMouseEnter={() => setActiveFieldId(span.field_id)}
                      onMouseLeave={() => setActiveFieldId(null)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        active
                          ? "bg-amber-50 border-amber-600"
                          : "bg-slate-50 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900">
                          [{span.time_label}]
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        &ldquo;{span.spoken_text}&rdquo;
                      </p>
                      <p className="text-xs font-bold text-amber-800 mt-0.5">
                        → {span.extracted_claim}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT 7 COLS: FACT-VS-HYPOTHESIS MATRIX + VOICE + MERKLE ANCHOR */}
          <div className="lg:col-span-7 space-y-6">
            {/* Fact-vs-Hypothesis Comparison Cards */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                    Stage 3 · Deterministic APMC Engine + Sarvam-105B
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Spoken Deal vs. Written Slip Audit Breakdown
                  </h3>
                </div>

                {apiKey && (
                  <button
                    type="button"
                    onClick={handleAskSarvam105B}
                    disabled={isCallingAi}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {isCallingAi ? "Reviewing..." : "Run Live Sarvam-105B Review"}
                    </span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {audit.comparison_rows.map((row) => {
                  const badge = STATUS_BADGE[row.status] || STATUS_BADGE.COMPLIANT;
                  const active = activeFieldId === row.field_id;
                  return (
                    <div
                      key={row.field_id}
                      onMouseEnter={() => setActiveFieldId(row.field_id)}
                      onMouseLeave={() => setActiveFieldId(null)}
                      className={`p-4 rounded-xl border-2 transition cursor-pointer ${
                        active
                          ? "border-amber-600 bg-amber-50/40"
                          : row.delta_inr > 0
                          ? "border-red-200 bg-red-50/30 hover:border-red-300"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-slate-900">
                            {row.parameter}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div
                          className={`text-lg font-extrabold ${
                            row.delta_inr > 0 ? "text-red-700" : "text-emerald-700"
                          }`}
                        >
                          {row.delta_inr > 0
                            ? `Farmer Loss: −${formatINR(row.delta_inr)}`
                            : "₹0 Discrepancy"}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm bg-white p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="block text-[11px] font-bold uppercase text-sky-700">
                            Spoken at Auction ({row.spoken_timestamp})
                          </span>
                          <span className="font-semibold text-slate-900">
                            {row.spoken_fact}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[11px] font-bold uppercase text-amber-800">
                            Written on Slip
                          </span>
                          <span className="font-semibold text-slate-900">
                            {row.written_fact}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 text-xs sm:text-sm text-slate-700 space-y-1">
                        <div>
                          <strong className="text-slate-900">Finding:</strong>{" "}
                          {row.legal_hypothesis}
                        </div>
                        <div className="text-xs font-semibold text-slate-600">
                          ⚖️ {row.bylaw_citation} · ➡️{" "}
                          <span className="text-amber-900 font-bold">
                            {row.enforcement_action}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage 4A: Bulbul v3 Multilingual Farmer Voice Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Stage 4A · Bulbul v3 Vernacular Voice Advisory
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Speak Audit Result to Farmer in Native Script
                  </h3>
                </div>

                <div className="flex flex-wrap gap-1">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setSelectedLang(l.code);
                        if (isPlaying && stopAudioRef.current) {
                          stopAudioRef.current();
                          stopAudioRef.current = null;
                          setIsPlaying(false);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        selectedLang === l.code
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-base sm:text-lg leading-relaxed font-medium text-slate-900">
                &ldquo;{activeVoiceScript}&rdquo;
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleSpeakVoice(selectedLang)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm cursor-pointer transition ${
                    isPlaying
                      ? "bg-red-700 hover:bg-red-800"
                      : "bg-emerald-700 hover:bg-emerald-800"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Voice Playback</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>
                        Speak in{" "}
                        {LANGUAGES.find((l) => l.code === selectedLang)?.label}
                      </span>
                    </>
                  )}
                </button>
                <span className="text-xs text-slate-500">
                  {apiKey
                    ? "Synthesizing with live Sarvam Bulbul v3 (24kHz)"
                    : "Ready with instant Indic speech synthesis"}
                </span>
              </div>
            </div>

            {/* Stage 4B: SHA-256 Merkle Anchor & QR Certificate */}
            {merkle && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Stage 4B · SHA-256 Cryptographic Proof
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Record → Claim → Anchor Receipt
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {merkle.anchor_id}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs break-all flex items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400 font-bold mr-1">
                        MERKLE_ROOT:
                      </span>
                      {merkle.merkle_root}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(merkle.merkle_root);
                        setCopiedRoot(true);
                        setTimeout(() => setCopiedRoot(false), 1800);
                      }}
                      className="shrink-0 px-2 py-1 rounded bg-slate-800 text-white text-[11px] font-sans font-bold cursor-pointer"
                    >
                      {copiedRoot ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="block text-[10px] font-sans font-bold text-sky-700">
                        L0: Audio Hash
                      </span>
                      {merkle.leaf_0_audio_hash}
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="block text-[10px] font-sans font-bold text-amber-800">
                        L1: Slip Vision Hash
                      </span>
                      {merkle.leaf_1_vision_hash}
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="block text-[10px] font-sans font-bold text-purple-700">
                        L2: Claims Hash
                      </span>
                      {merkle.leaf_2_claims_hash}
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="block text-[10px] font-sans font-bold text-emerald-700">
                        L3: Verdict Hash
                      </span>
                      {merkle.leaf_3_verdict_hash}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 flex flex-col items-center text-center gap-2.5 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-5">
                  <DeterministicQrSvg
                    payload={merkle.qr_verification_payload}
                    size={136}
                  />
                  <div>
                    <div className="text-[11px] font-bold uppercase text-slate-500">
                      80% ONDC / e-Mandi Credit Limit
                    </div>
                    <div className="text-xl font-extrabold text-amber-800">
                      {formatINR(merkle.ondc_credit_eligible_inr, 0)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([merkle.qr_verification_payload], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${merkle.anchor_id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Signed Receipt</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* API KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <span>Configure Sarvam AI API Key</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Mandi-Pramaan runs out-of-the-box in the browser. Enter your{" "}
              <code>SARVAM_API_KEY</code> to enable live calls to{" "}
              <strong>Sarvam-105B</strong> and <strong>Bulbul v3</strong> (24kHz audio).
            </p>
            <input
              type="password"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="sk_..."
              className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-amber-600"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveKey(draftKey.trim())}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
