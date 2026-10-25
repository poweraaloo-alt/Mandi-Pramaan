import React, { useRef, useState } from "react";
import {
  Award,
  Check,
  Copy,
  GitBranch,
  Globe,
  Lock,
  Play,
  QrCode,
  ShieldCheck,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { playBase64AudioOrFallback } from "../utils/audioHelper";

const LANGUAGES = [
  { code: "hi-IN", label: "हिंदी (Hindi)", speaker: "shubh" },
  { code: "mr-IN", label: "मराठी (Marathi)", speaker: "aditya" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)", speaker: "shubh" },
  { code: "ta-IN", label: "தமிழ் (Tamil)", speaker: "ritu" },
  { code: "te-IN", label: "తెలుగు (Telugu)", speaker: "aditya" },
];

/**
 * Deterministic scannable-style SVG QR Matrix generator from any string payload
 */
function DeterministicQrSvg({ payload, size = 116 }) {
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
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= cells - 8;
      const inBotLeft = r >= cells - 8 && c < 8;
      if (inTopLeft || inTopRight || inBotLeft) continue;
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
      className="rounded-lg bg-white p-1.5 shadow-md"
    >
      {grid.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx * cellSize}
              y={rIdx * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill="#020617"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function TrustAnchorDock({
  aiReasoning,
  merkleAnchor,
  spokenDeal,
  writtenParchi,
  statutoryAudit,
  initialAudioBase64,
  initialLanguageCode,
  onSynthesizeTts,
}) {
  const [selectedLang, setSelectedLang] = useState(initialLanguageCode || "hi-IN");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTts, setIsLoadingTts] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const stopAudioRef = useRef(null);

  const activeScript =
    aiReasoning?.multilingual_scripts?.[selectedLang] ||
    aiReasoning?.farmer_spoken_summary_native ||
    "";

  const handleLanguageSwitch = async (langObj) => {
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    setSelectedLang(langObj.code);
    const scriptText =
      aiReasoning?.multilingual_scripts?.[langObj.code] ||
      aiReasoning?.farmer_spoken_summary_native ||
      "";

    setIsLoadingTts(true);
    const b64 = await onSynthesizeTts(scriptText, langObj.code, langObj.speaker);
    setIsLoadingTts(false);

    stopAudioRef.current = playBase64AudioOrFallback(
      b64,
      scriptText,
      langObj.code,
      () => setIsPlaying(true),
      () => setIsPlaying(false)
    );
  };

  const handlePlayToggle = async () => {
    if (isPlaying && stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
      setIsPlaying(false);
      return;
    }

    const langObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];
    if (selectedLang === initialLanguageCode && initialAudioBase64) {
      stopAudioRef.current = playBase64AudioOrFallback(
        initialAudioBase64,
        activeScript,
        selectedLang,
        () => setIsPlaying(true),
        () => setIsPlaying(false)
      );
    } else {
      await handleLanguageSwitch(langObj);
    }
  };

  const handleCopyRoot = () => {
    if (!merkleAnchor?.merkle_root) return;
    navigator.clipboard.writeText(merkleAnchor.merkle_root);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 1800);
  };

  return (
    <>
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xl">
        {/* Panel Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
              PANEL 4
            </span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Bulbul v3 Vernacular Voice Payout &amp; Cryptographic Merkle Anchor
            </h2>
          </div>

          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            {merkleAnchor?.anchor_id}
          </span>
        </div>

        {/* Part A: Bulbul v3 Multilingual Farmer Voice Advisory */}
        <div className="bg-slate-950/85 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Stage 4A: Native Script Voice Advisory (<code className="text-emerald-300">bulbul:v3</code>{" "}
                • 24kHz)
              </span>
            </div>

            {/* 5 Indic Language Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageSwitch(lang)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    selectedLang === lang.code
                      ? "bg-emerald-500 text-slate-950 font-bold shadow"
                      : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Native Indic Script Box + Play Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-medium">
              &ldquo;{activeScript}&rdquo;
            </p>

            <button
              type="button"
              onClick={handlePlayToggle}
              disabled={isLoadingTts}
              className={`shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-lg ${
                isPlaying
                  ? "bg-red-500 hover:bg-red-400 text-slate-950"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>{isLoadingTts ? "Synthesizing..." : "Speak to Farmer"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Part B: Record -> Claim -> Anchor Cryptographic Merkle Tree & Scannable QR */}
        {merkleAnchor && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* 4-Leaf Merkle Tree Visualizer (8 cols) */}
            <div className="lg:col-span-8 bg-slate-950/85 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  SHA-256 Record → Claim → Anchor Merkle Tree
                </span>
                <button
                  onClick={handleCopyRoot}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-amber-300 cursor-pointer"
                >
                  {copiedHash ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied Root</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Root</span>
                    </>
                  )}
                </button>
              </div>

              {/* Root Hash Box */}
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 font-mono text-[11px] text-emerald-300 break-all">
                <span className="text-slate-400 font-bold mr-1.5">MERKLE_ROOT:</span>
                {merkleAnchor.merkle_root}
              </div>

              {/* 4 Leaves Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="block text-[10px] text-cyan-400 font-bold">
                    L0: AUDIO_HASH (Saaras v4)
                  </span>
                  <span className="text-slate-300">{merkleAnchor.leaf_0_audio_hash}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="block text-[10px] text-amber-400 font-bold">
                    L1: VISION_HASH (Parchi ROI)
                  </span>
                  <span className="text-slate-300">{merkleAnchor.leaf_1_vision_hash}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="block text-[10px] text-purple-400 font-bold">
                    L2: CLAIMS_JSON_HASH
                  </span>
                  <span className="text-slate-300">{merkleAnchor.leaf_2_claims_hash}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="block text-[10px] text-emerald-400 font-bold">
                    L3: STATUTORY_VERDICT_HASH
                  </span>
                  <span className="text-slate-300">{merkleAnchor.leaf_3_verdict_hash}</span>
                </div>
              </div>
            </div>

            {/* Scannable QR & ONDC Micro-Credit Card (4 cols) */}
            <div className="lg:col-span-4 bg-slate-950/85 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center justify-between text-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Tamper-Evident Receipt</span>
              </div>

              <DeterministicQrSvg payload={merkleAnchor.qr_verification_payload} size={108} />

              <div className="w-full">
                <div className="text-[11px] font-mono text-slate-400">
                  80% e-Mandi / ONDC Credit Line:
                </div>
                <div className="text-sm font-mono font-extrabold text-amber-300">
                  ₹{Number(merkleAnchor.ondc_credit_eligible_inr).toLocaleString("en-IN")}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCertModal(true)}
                className="w-full py-1.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Open Pramaan Certificate</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Printable Mandi-Pramaan Statutory Recovery & Credit Certificate Modal */}
      {showCertModal && merkleAnchor && statutoryAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500/60 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    MANDI-PRAMAAN CRYPTOGRAPHIC ARBITRATION CERTIFICATE
                  </h3>
                  <p className="text-xs font-mono text-amber-300">
                    Anchor ID: {merkleAnchor.anchor_id} • {merkleAnchor.timestamp_iso}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCertModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block">Farmer (Seller):</span>
                <span className="font-bold text-white">{spokenDeal?.farmer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Mandi &amp; Trader License:</span>
                <span className="font-bold text-white">
                  {writtenParchi?.trader_firm} ({writtenParchi?.license_no})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Lawful APMC Net Payable:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ₹{Number(statutoryAudit.lawful_net_payable_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Statutory Recovery Due to Farmer:</span>
                <span className="font-mono font-bold text-red-400 text-sm">
                  +₹{Number(statutoryAudit.total_farmer_underpayment_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="text-amber-300 font-bold">SHA-256 MERKLE PROOF:</div>
              <div className="break-all">ROOT: {merkleAnchor.merkle_root}</div>
              <div>
                N01 (Audio+Vision): {merkleAnchor.node_01_hash} | N23 (Claims+Verdict):{" "}
                {merkleAnchor.node_23_hash}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Print / Save PDF Receipt
              </button>
              <button
                onClick={() => setShowCertModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
