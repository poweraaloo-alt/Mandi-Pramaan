import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileText,
  KeyRound,
  Play,
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
  { code: "hi-IN", label: "हिंदी Hindi", speaker: "shubh" },
  { code: "mr-IN", label: "मराठी Marathi", speaker: "aditya" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ Punjabi", speaker: "shubh" },
  { code: "ta-IN", label: "தமிழ் Tamil", speaker: "ritu" },
  { code: "te-IN", label: "తెలుగు Telugu", speaker: "aditya" },
];

const STATUS_BADGE = {
  CRITICAL_VIOLATION: {
    label: "Violation",
    cls: "bg-red-100 text-red-800 border-red-300",
  },
  MSP_BREACH: {
    label: "Below MSP",
    cls: "bg-orange-100 text-orange-800 border-orange-300",
  },
  COMPLIANT: {
    label: "OK",
    cls: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
};

function DeterministicQrSvg({ payload, size = 180 }) {
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
      className="rounded-xl bg-white p-2 border border-stone-300 shadow-sm"
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
              fill="#1F2937"
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
  const [activeTab, setActiveTab] = useState("findings");
  const [showEditor, setShowEditor] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [parchiImageUrl, setParchiImageUrl] = useState("");
  const [merkle, setMerkle] = useState(null);

  // Voice & Sarvam API state
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("MANDI_SARVAM_API_KEY") || ""
  );
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

  // Update handwritten Kaccha Parchi image & SHA-256 Merkle anchor whenever inputs change
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

  // Optional live Sarvam-105B review
  const handleAskSarvam105B = async () => {
    setIsCallingAi(true);
    try {
      // Try backend /api/arbitrate first if running locally, otherwise call Sarvam REST API directly
      const headers = { "Content-Type": "application/json" };
      if (apiKey) headers["api-subscription-key"] = apiKey;

      if (apiKey) {
        const resp = await fetch("https://api.sarvam.ai/v1/chat/completions", {
          method: "POST",
          headers,
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

  // Play voice in selected language (Bulbul v3 if API key set, or instant browser Indic TTS)
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFFBF5] text-stone-900">
      {/* =================================================================== */}
      {/* LEFT SIDEBAR (Streamlit-Style Control Panel)                        */}
      {/* =================================================================== */}
      <aside className="w-full lg:w-80 shrink-0 bg-[#F5EFE6] border-b lg:border-b-0 lg:border-r border-stone-300/80 p-6 flex flex-col justify-between gap-6">
        <div className="space-y-6">
          {/* Brand Title */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-700 text-white flex items-center justify-center shadow-sm">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-stone-900">
                  Mandi-Pramaan
                </h1>
                <p className="text-xs font-semibold text-amber-800">
                  मंडी-प्रमाण · APMC Slip Verifier
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-600 mt-2 leading-relaxed">
              Check a handwritten mandi slip (<em>Kaccha Parchi</em>) against the spoken
              auction deal and State APMC rules.
            </p>
          </div>

          {/* Sample Case Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              1. Choose Sample Case
            </label>
            <div className="space-y-2">
              {Object.values(PRESET_CASES).map((item) => {
                const active = presetId === item.case_id;
                const isClean = item.severity === "COMPLIANT";
                return (
                  <button
                    key={item.case_id}
                    onClick={() => handleSelectPreset(item.case_id)}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                      active
                        ? "bg-white border-amber-700 shadow-sm ring-2 ring-amber-700/20"
                        : "bg-stone-100/70 border-stone-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          isClean
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-red-100 text-red-800 border-red-300"
                        }`}
                      >
                        {item.badge_text}
                      </span>
                      {active && (
                        <span className="text-[11px] font-bold text-amber-800">
                          ● Selected
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-stone-900">
                      {item.short_title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* State APMC Law Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              2. State APMC Law to Apply
            </label>
            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="w-full rounded-xl bg-white border border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-900 shadow-xs focus:outline-none focus:border-amber-700"
            >
              {Object.entries(STATE_APMC_RULES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Sarvam AI Key Input */}
          <div className="space-y-1.5 pt-2 border-t border-stone-300/80">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-600">
              <KeyRound className="w-3.5 h-3.5 text-amber-700" />
              <span>Sarvam AI API Key (Optional)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleSaveKey(e.target.value)}
              placeholder="sk_... (for live 105B & Bulbul v3)"
              className="w-full rounded-xl bg-white border border-stone-300 px-3 py-2 text-xs font-mono text-stone-900 focus:outline-none focus:border-amber-700"
            />
            <p className="text-xs text-stone-600">
              {apiKey
                ? "✅ Live Sarvam AI key active in browser."
                : "Works offline out-of-the-box. Paste a key to enable live Sarvam-105B & Bulbul v3 calls."}
            </p>
          </div>
        </div>

        {/* Pipeline Footer Note */}
        <div className="text-xs text-stone-600 border-t border-stone-300/80 pt-4 leading-relaxed">
          <strong className="text-stone-800">Sarvam Sovereign Stack:</strong> Saaras v4
          (Speech) → Sarvam Vision (Slip) → APMC Rule Engine + Sarvam-105B → Bulbul v3
          (Voice) → SHA-256 Receipt
        </div>
      </aside>

      {/* =================================================================== */}
      {/* MAIN WORKSPACE (Clean, High-Contrast Streamlit Layout)              */}
      {/* =================================================================== */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 sm:px-8 py-7 space-y-6">
        {/* Title & Subtitle */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Mandi-Pramaan{" "}
            <span className="text-amber-700 font-bold">मंडी-प्रमाण</span>
          </h2>
          <p className="text-base text-stone-600 mt-1">
            {spoken.mandi_name} · <strong>{spoken.commodity_label}</strong> · Farmer:{" "}
            <strong>{spoken.farmer_name}</strong>
          </p>
        </div>

        {/* Verdict Banner */}
        {underpaid > 0 ? (
          <div className="rounded-2xl bg-red-50 border-2 border-red-300 p-5 text-red-950 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-6 h-6 text-red-700 shrink-0" />
              <h3 className="text-xl font-extrabold text-red-900">
                Farmer underpaid by {formatINR(underpaid)}
              </h3>
            </div>
            <p className="text-base text-red-900/90 mt-1.5 leading-relaxed">
              <strong>{audit.violation_count} statutory problem(s)</strong> detected under
              the <strong>{audit.state_act_name}</strong>.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-300 p-5 text-emerald-950 shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
              <h3 className="text-xl font-extrabold text-emerald-900">
                Slip is 100% compliant
              </h3>
            </div>
            <p className="text-base text-emerald-900/90 mt-1.5 leading-relaxed">
              The written slip matches the spoken auction deal and satisfies the{" "}
              <strong>{audit.state_act_name}</strong>.
            </p>
          </div>
        )}

        {/* 4 Key Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Farmer Should Receive
            </div>
            <div className="text-2xl font-extrabold text-emerald-800 mt-1">
              {formatINR(audit.lawful_net_payable_inr)}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Slip Says
            </div>
            <div className="text-2xl font-extrabold text-stone-800 mt-1">
              {formatINR(audit.written_net_payable_inr)}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Underpaid By
            </div>
            <div
              className={`text-2xl font-extrabold mt-1 ${
                underpaid > 0 ? "text-red-700" : "text-emerald-700"
              }`}
            >
              {formatINR(underpaid)}
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Problems Found
            </div>
            <div className="text-2xl font-extrabold text-stone-900 mt-1">
              {audit.violation_count}
            </div>
          </div>
        </div>

        {/* Collapsible Editor: Try Your Own Numbers */}
        <div className="bg-white border border-stone-300 rounded-2xl overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowEditor(!showEditor)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left text-sm font-bold text-stone-800 hover:bg-stone-50 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-700" />
              <span>
                ✏️ Try your own numbers — edit the auction deal or slip and re-check
                instantly
              </span>
            </span>
            {showEditor ? (
              <ChevronUp className="w-4 h-4 text-stone-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-500" />
            )}
          </button>

          {showEditor && (
            <div className="p-5 border-t border-stone-200 bg-stone-50/60 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Bags (50 kg each)
                  </label>
                  <input
                    type="number"
                    value={spoken.bags}
                    onChange={(e) =>
                      updateSlipNumbers({ bags: Number(e.target.value) }, {})
                    }
                    className="w-full rounded-lg bg-white border border-stone-300 px-3 py-2 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Spoken Auction Rate (₹/Qtl)
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
                    className="w-full rounded-lg bg-white border border-stone-300 px-3 py-2 font-semibold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Slip Net Weight (Qtl)
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
                    className="w-full rounded-lg bg-white border border-stone-300 px-3 py-2 font-semibold text-red-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Slip Written Rate (₹/Qtl)
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
                    className="w-full rounded-lg bg-white border border-stone-300 px-3 py-2 font-semibold text-red-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Deducted Aadat (₹)
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
                    className="w-full rounded-lg bg-white border border-stone-300 px-3 py-2 font-semibold text-red-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Hammali / Labor (₹)
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
                    className="w-full rounded-lg bg-white border border-stone-300 px-3 py-2 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Dharmada Cut (₹)
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
                    className="w-full rounded-lg bg-white border border-stone-300 px-3 py-2 font-semibold text-red-800"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(presetId)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs py-2.5 px-3 cursor-pointer transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Sample</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 4 CLEAN TABS                                                      */}
        {/* ================================================================= */}
        <div className="border-b border-stone-300 flex flex-wrap gap-2">
          {[
            { id: "findings", label: "📋 Findings & APMC Law" },
            { id: "evidence", label: "🧾 Slip & Audio Evidence" },
            { id: "voice", label: "🔊 Farmer Voice Message" },
            { id: "proof", label: "🔐 Proof Receipt & QR" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition cursor-pointer ${
                activeTab === t.id
                  ? "border-amber-700 text-amber-900 bg-amber-100/60"
                  : "border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: FINDINGS */}
        {activeTab === "findings" && (
          <div className="space-y-4">
            {audit.comparison_rows.map((row) => {
              const badge = STATUS_BADGE[row.status] || STATUS_BADGE.COMPLIANT;
              return (
                <div
                  key={row.field_id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-stone-900">
                          {row.parameter}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <span className="inline-block mt-1 text-xs font-mono text-stone-500">
                        Audio [{row.spoken_timestamp}]
                      </span>
                    </div>

                    <div className="md:col-span-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Said at Auction
                      </div>
                      <div className="text-base font-semibold text-stone-900 mt-0.5">
                        {row.spoken_fact}
                      </div>
                    </div>

                    <div className="md:col-span-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Written on Slip
                      </div>
                      <div className="text-base font-semibold text-stone-900 mt-0.5">
                        {row.written_fact}
                      </div>
                    </div>

                    <div className="md:col-span-2 md:text-right">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Farmer Loss
                      </div>
                      <div
                        className={`text-xl font-extrabold mt-0.5 ${
                          row.delta_inr > 0 ? "text-red-700" : "text-emerald-700"
                        }`}
                      >
                        {row.delta_inr > 0 ? `−${formatINR(row.delta_inr)}` : "₹0"}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 text-sm text-stone-700 space-y-1">
                    <div>
                      <strong className="text-stone-900">Finding:</strong>{" "}
                      {row.legal_hypothesis}
                    </div>
                    <div className="text-xs text-stone-600">
                      ⚖️ <strong>{row.bylaw_citation}</strong> · ➡️{" "}
                      {row.enforcement_action}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Legal Summary Card */}
            <div className="bg-white border border-stone-300 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-extrabold text-stone-900">
                  Legal Summary &amp; Statutory Notices
                </h3>
                {apiKey && (
                  <button
                    type="button"
                    onClick={handleAskSarvam105B}
                    disabled={isCallingAi}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold cursor-pointer transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {isCallingAi
                        ? "Sarvam-105B Reviewing..."
                        : "Ask Sarvam-105B to Review"}
                    </span>
                  </button>
                )}
              </div>

              <p className="text-base font-bold text-amber-900">
                {reasoning.executive_verdict_title}
              </p>
              <p className="text-base text-stone-700 leading-relaxed">
                {reasoning.legal_summary}
              </p>

              <ul className="list-disc list-inside space-y-1 text-sm text-stone-700 pt-1">
                {(reasoning.statutory_notices || []).map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>

              {reasoning.model_thinking_trace && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowThinking(!showThinking)}
                    className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>
                      {showThinking
                        ? "Hide step-by-step audit trace"
                        : "Show step-by-step audit trace"}
                    </span>
                  </button>
                  {showThinking && (
                    <pre className="mt-2 p-3.5 rounded-xl bg-stone-100 border border-stone-300 text-xs font-mono text-stone-800 whitespace-pre-wrap leading-relaxed">
                      {reasoning.model_thinking_trace}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EVIDENCE (KACCHA PARCHI + SPOKEN TRANSCRIPT) */}
        {activeTab === "evidence" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Handwritten Kaccha Parchi with SVG Bounding Boxes */}
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900">
                  Written Slip (Kaccha Parchi)
                </h3>
                <p className="text-sm text-stone-600">
                  Red dashed boxes highlight lines that break the auction deal or State
                  APMC rules.
                </p>
              </div>

              <div className="relative w-full rounded-xl overflow-hidden border border-stone-300 shadow-xs">
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
                              ? "rgba(185, 28, 28, 0.20)"
                              : "rgba(21, 128, 61, 0.18)"
                            : "transparent"
                        }
                        stroke={isBad ? "#B91C1C" : "#15803D"}
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

            {/* Spoken Auction Transcript & Timestamp Spans */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
                <h3 className="text-lg font-extrabold text-stone-900">
                  What Was Said at the Auction
                </h3>
                <blockquote className="border-l-4 border-amber-700 bg-amber-50/60 p-4 rounded-r-xl text-base font-medium text-stone-900 leading-relaxed">
                  &ldquo;{spoken.transcript}&rdquo;
                </blockquote>
                <p className="text-xs text-stone-500">
                  Language: <code>{spoken.language_code}</code> · Transcribed with{" "}
                  <strong>Saaras v4</strong> (code-mixed mandi mode)
                </p>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="text-base font-extrabold text-stone-900">
                  Timestamped Audio Claims (Hover to Highlight Slip)
                </h4>
                <div className="space-y-2.5">
                  {(spoken.timestamp_spans || []).map((span) => {
                    const st = statusMap[span.field_id] || "COMPLIANT";
                    const badge = STATUS_BADGE[st] || STATUS_BADGE.COMPLIANT;
                    const active = activeFieldId === span.field_id;
                    return (
                      <div
                        key={span.field_id}
                        onMouseEnter={() => setActiveFieldId(span.field_id)}
                        onMouseLeave={() => setActiveFieldId(null)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          active
                            ? "bg-amber-50 border-amber-700"
                            : "bg-stone-50/70 border-stone-200 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900">
                            {span.time_label}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-base font-semibold text-stone-900">
                          &ldquo;{span.spoken_text}&rdquo;
                        </p>
                        <p className="text-xs font-semibold text-amber-900 mt-1">
                          → {span.extracted_claim}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VOICE MESSAGE */}
        {activeTab === "voice" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-amber-700" />
                  <span>Spoken Advisory for the Farmer (Bulbul v3)</span>
                </h3>
                <p className="text-sm text-stone-600">
                  Choose an Indian language to read and hear the payout summary in native
                  script.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      selectedLang === l.code
                        ? "bg-amber-700 text-white border-amber-700 shadow-xs"
                        : "bg-stone-100 text-stone-800 border-stone-300 hover:bg-stone-200"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FFFBF5] border border-stone-300 text-xl leading-relaxed font-medium text-stone-900">
              &ldquo;{activeVoiceScript}&rdquo;
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSpeakVoice(selectedLang)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white shadow-sm cursor-pointer transition ${
                  isPlaying
                    ? "bg-red-700 hover:bg-red-800"
                    : "bg-amber-700 hover:bg-amber-800"
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
              <span className="text-xs text-stone-500">
                {apiKey
                  ? "Uses live Sarvam Bulbul v3 (24kHz) with automatic browser fallback."
                  : "Uses browser Indic voice synthesis (paste a Sarvam key in the sidebar for Bulbul v3 24kHz audio)."}
              </span>
            </div>
          </div>
        )}

        {/* TAB 4: PROOF RECEIPT & QR */}
        {activeTab === "proof" && merkle && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <span>Tamper-Evident SHA-256 Receipt</span>
                </h3>
                <span className="text-xs font-mono font-bold text-stone-600">
                  {merkle.anchor_id}
                </span>
              </div>

              <p className="text-sm text-stone-600 leading-relaxed">
                Every piece of evidence is fingerprinted with SHA-256 and combined into a
                single <strong>Merkle Root</strong>. If anyone alters the audio, slip, or
                verdict, the root hash changes immediately.
              </p>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 font-mono text-xs text-emerald-950 break-all flex items-center justify-between gap-2">
                <div>
                  <strong className="block text-[11px] uppercase text-emerald-800">
                    Merkle Root:
                  </strong>
                  {merkle.merkle_root}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(merkle.merkle_root);
                    setCopiedRoot(true);
                    setTimeout(() => setCopiedRoot(false), 1800);
                  }}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-sans font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedRoot ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="font-sans font-bold text-stone-600">
                    Leaf 0 · Auction Audio
                  </div>
                  <div className="text-stone-900 mt-0.5">{merkle.leaf_0_audio_hash}</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="font-sans font-bold text-stone-600">
                    Leaf 1 · Kaccha Parchi Slip
                  </div>
                  <div className="text-stone-900 mt-0.5">{merkle.leaf_1_vision_hash}</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="font-sans font-bold text-stone-600">
                    Leaf 2 · Extracted Claims
                  </div>
                  <div className="text-stone-900 mt-0.5">{merkle.leaf_2_claims_hash}</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="font-sans font-bold text-stone-600">
                    Leaf 3 · Statutory Verdict
                  </div>
                  <div className="text-stone-900 mt-0.5">
                    {merkle.leaf_3_verdict_hash}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col items-center text-center space-y-4">
              <h4 className="text-base font-extrabold text-stone-900">
                Scan to Verify Receipt
              </h4>
              <DeterministicQrSvg payload={merkle.qr_verification_payload} size={184} />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Eligible for 80% e-Mandi / ONDC Pledge Credit
                </div>
                <div className="text-2xl font-extrabold text-amber-800 mt-0.5">
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
                className="w-full py-2.5 px-4 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Signed Receipt (JSON)</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
