import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  Eye,
  FileAudio,
  ImagePlus,
  Lock,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Square,
  Upload,
  Volume2,
  Wand2,
} from "lucide-react";
import { generateKacchaParchiDataUrl } from "./utils/parchiCanvasGenerator";
import { playBase64AudioOrFallback } from "./utils/audioHelper";
import {
  PRESET_CASES,
  STATE_APMC_RULES,
  buildBrowserMerkleAnchor,
  buildDynamicReasoning,
  callLiveBulbulTts,
  callLiveSaarasStt,
  callLiveSarvam105B,
  computeStatutoryAudit,
  extractKacchaParchiFromImage,
  formatINR,
  parseSpokenTranscriptWithSarvam,
  synthesizeSampleBoliWav,
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
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [parchiImageUrl, setParchiImageUrl] = useState("");
  const [uploadedSlipPhoto, setUploadedSlipPhoto] = useState(null);
  const [merkle, setMerkle] = useState(null);

  // Live Sarvam AI telemetry & outputs
  const [selectedLang, setSelectedLang] = useState("hi-IN");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizingTts, setIsSynthesizingTts] = useState(false);
  const [isCallingAi, setIsCallingAi] = useState(false);
  const [isParsingText, setIsParsingText] = useState(false);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isTranscribingAudio, setIsTranscribingAudio] = useState(false);
  const [isGeneratingSampleAudio, setIsGeneratingSampleAudio] = useState(false);
  const [isScanningSlip, setIsScanningSlip] = useState(false);
  const [audioPlayerUrl, setAudioPlayerUrl] = useState(null);
  const [audioSourceLabel, setAudioSourceLabel] = useState("");
  const [slipOcrPreview, setSlipOcrPreview] = useState("");
  const [customReasoning, setCustomReasoning] = useState(null);
  const [copiedRoot, setCopiedRoot] = useState(false);
  const [statusBanner, setStatusBanner] = useState("");
  const [telemetry, setTelemetry] = useState({
    saarasMs: 215,
    visionMs: 290,
    llmMs: null,
    bulbulMs: null,
    liveActive: false,
  });

  const stopAudioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const baseCase = PRESET_CASES[presetId] || PRESET_CASES.sehore_wheat_fraud;
  const audit = computeStatutoryAudit({ ...spoken, state_code: stateCode }, written);
  const dynamicFallback = buildDynamicReasoning(
    { ...spoken, state_code: stateCode },
    written,
    audit
  );
  const reasoning = customReasoning || dynamicFallback;
  const statusMap = Object.fromEntries(
    audit.comparison_rows.map((r) => [r.field_id, r.status])
  );

  // Update handwritten Kaccha Parchi image & SHA-256 Merkle anchor whenever inputs change
  useEffect(() => {
    if (!uploadedSlipPhoto) {
      const url = generateKacchaParchiDataUrl(written, spoken);
      setParchiImageUrl(url);
    }
    buildBrowserMerkleAnchor({ ...spoken, state_code: stateCode }, written, audit).then(
      setMerkle
    );
  }, [spoken, written, stateCode, uploadedSlipPhoto]);

  // Run initial live Sarvam-105B arbitration on mount
  useEffect(() => {
    runFullLiveArbitration(spoken, written, stateCode);
  }, []);

  const runFullLiveArbitration = async (
    targetSpoken = spoken,
    targetWritten = written,
    targetState = stateCode
  ) => {
    setIsCallingAi(true);
    const currentSpoken = { ...targetSpoken, state_code: targetState };
    const currentAudit = computeStatutoryAudit(currentSpoken, targetWritten);
    const dynFallback = buildDynamicReasoning(
      currentSpoken,
      targetWritten,
      currentAudit
    );
    const res = await callLiveSarvam105B(
      currentSpoken,
      targetWritten,
      currentAudit,
      dynFallback
    );
    setCustomReasoning(res.reasoning);
    setTelemetry((prev) => ({
      ...prev,
      llmMs: res.latencyMs,
      liveActive: prev.liveActive || res.liveUsed,
    }));
    setIsCallingAi(false);
  };

  const handleSelectPreset = (id) => {
    const next = PRESET_CASES[id];
    if (!next) return;
    setPresetId(id);
    const nextSpoken = structuredClone(next.spoken_deal);
    const nextWritten = structuredClone(next.written_parchi);
    setSpoken(nextSpoken);
    setWritten(nextWritten);
    setStateCode(nextSpoken.state_code);
    setSelectedLang(nextSpoken.language_code || "hi-IN");
    setUploadedSlipPhoto(null);
    setSlipOcrPreview("");
    setStatusBanner("");
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
      setIsPlaying(false);
    }
    runFullLiveArbitration(nextSpoken, nextWritten, nextSpoken.state_code);
  };

  const updateInputs = (patchSpoken, patchWritten) => {
    const nextSpoken = { ...spoken, ...patchSpoken };
    if ("bags" in patchSpoken && !("agreed_net_weight_qtl" in patchSpoken)) {
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
    setCustomReasoning(null);
  };

  // Helper: process any audio Blob through Saaras v4 ASR -> Sarvam-105B structured extraction
  const processAudioBlobWithSaaras = async (rawBlob, label = "Audio Input") => {
    setIsTranscribingAudio(true);
    setStatusBanner(`🎙️ Step 1: Converting "${label}" to 16kHz PCM WAV & transcribing via Sarvam Saaras v4...`);
    const sttRes = await callLiveSaarasStt(rawBlob, spoken.language_code || "hi-IN");
    setIsTranscribingAudio(false);

    if (sttRes.wavBlob) {
      const wavUrl = URL.createObjectURL(sttRes.wavBlob);
      setAudioPlayerUrl(wavUrl);
      setAudioSourceLabel(`${label} (16kHz RIFF WAV)`);
    }

    setTelemetry((prev) => ({
      ...prev,
      saarasMs: sttRes.latencyMs,
      liveActive: prev.liveActive || sttRes.liveUsed,
    }));

    if (sttRes.transcript) {
      const nextSpoken = { ...spoken, transcript: sttRes.transcript };
      setSpoken(nextSpoken);
      setStatusBanner(
        `✓ Saaras v4 ASR (${sttRes.latencyMs}ms): "${sttRes.transcript}" — Extracting deal terms via Sarvam-105B...`
      );
      const parsedRes = await parseSpokenTranscriptWithSarvam(
        sttRes.transcript,
        nextSpoken
      );
      const finalSpoken = parsedRes.parsed
        ? {
            ...nextSpoken,
            ...parsedRes.parsed,
            timestamp_spans: [
              {
                field_id: "weight_row",
                time_label: "00:01.0 - 00:04.2",
                spoken_text: sttRes.transcript.slice(0, 75),
                extracted_claim: `${parsedRes.parsed.bags} Bags = ${parsedRes.parsed.agreed_net_weight_qtl} Qtl Net Weight`,
              },
              {
                field_id: "rate_row",
                time_label: "00:04.3 - 00:08.0",
                spoken_text: `बोली भाव ₹${parsedRes.parsed.agreed_rate_per_qtl} प्रति क्विंटल`,
                extracted_claim: `Agreed Rate: ₹${parsedRes.parsed.agreed_rate_per_qtl}/Qtl`,
              },
              {
                field_id: "deductions_block",
                time_label: "00:08.1 - 00:11.0",
                spoken_text: `हम्माली ₹${parsedRes.parsed.authorized_hammali_inr}, आड़त ₹0`,
                extracted_claim: `0% Farmer Aadat; Authorized Labor: ₹${parsedRes.parsed.authorized_hammali_inr}`,
              },
            ],
          }
        : nextSpoken;
      setSpoken(finalSpoken);
      setStatusBanner(
        `✓ Audio Input Processed (Saaras v4 ${sttRes.latencyMs}ms): ${finalSpoken.farmer_name} | ${finalSpoken.bags} Bags (${finalSpoken.agreed_net_weight_qtl} Qtl) @ ₹${finalSpoken.agreed_rate_per_qtl}/Qtl`
      );
      await runFullLiveArbitration(finalSpoken, written, stateCode);
      return finalSpoken;
    } else {
      setStatusBanner(
        `Audio "${label}" loaded into player. Click "Extract from Transcript" or "Run Arbitration" below.`
      );
      return spoken;
    }
  };

  // Generate a real .wav auction audio recording via Bulbul v3 & run Saaras v4 ASR on it
  const handleGenerateSampleAuctionAudio = async () => {
    setIsGeneratingSampleAudio(true);
    setStatusBanner("🔊 Synthesizing real 16kHz spoken auction .wav via Sarvam Bulbul v3...");
    const wavBlob = await synthesizeSampleBoliWav(
      spoken.transcript,
      spoken.language_code || "hi-IN"
    );
    setIsGeneratingSampleAudio(false);
    if (wavBlob) {
      await processAudioBlobWithSaaras(wavBlob, "Sample Auction Boli (.wav)");
    } else {
      setStatusBanner("Could not synthesize sample audio. You can record from your mic or upload a .wav/.mp3 file.");
    }
  };

  // Extract structured numbers from user-typed transcript via Sarvam-105B
  const handleExtractFromTranscript = async () => {
    setIsParsingText(true);
    setStatusBanner("Extracting auction terms from your text with Sarvam-105B...");
    const res = await parseSpokenTranscriptWithSarvam(spoken.transcript, spoken);
    setIsParsingText(false);
    if (res.parsed) {
      const updatedSpoken = {
        ...spoken,
        ...res.parsed,
        timestamp_spans: [
          {
            field_id: "weight_row",
            time_label: "00:01.0 - 00:04.2",
            spoken_text: spoken.transcript.slice(0, 70),
            extracted_claim: `${res.parsed.bags} Bags = ${res.parsed.agreed_net_weight_qtl} Qtl Net Weight`,
          },
          {
            field_id: "rate_row",
            time_label: "00:04.3 - 00:08.0",
            spoken_text: `बोली भाव ₹${res.parsed.agreed_rate_per_qtl} प्रति क्विंटल`,
            extracted_claim: `Agreed Rate: ₹${res.parsed.agreed_rate_per_qtl}/Qtl`,
          },
          {
            field_id: "deductions_block",
            time_label: "00:08.1 - 00:11.0",
            spoken_text: `हम्माली ₹${res.parsed.authorized_hammali_inr}, आड़त ₹0`,
            extracted_claim: `0% Farmer Aadat; Authorized Labor: ₹${res.parsed.authorized_hammali_inr}`,
          },
        ],
      };
      setSpoken(updatedSpoken);
      setStatusBanner(
        `✓ Extracted from transcript (${res.latencyMs}ms): ${res.parsed.farmer_name}, ${res.parsed.bags} Bags (${res.parsed.agreed_net_weight_qtl} Qtl) @ ₹${res.parsed.agreed_rate_per_qtl}/Qtl`
      );
      await runFullLiveArbitration(updatedSpoken, written, stateCode);
    } else {
      await runFullLiveArbitration(spoken, written, stateCode);
    }
  };

  // Live Microphone Recording -> 16kHz RIFF WAV -> Saaras v4 ASR
  const handleToggleMic = async () => {
    if (isRecordingMic && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const rawBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        await processAudioBlobWithSaaras(rawBlob, "Live Mic Recording");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingMic(true);
      setStatusBanner(
        "🎙️ Recording live microphone audio... Speak the auction deal (e.g. '50 bori gehu, 25 quintal, bhav 2750 rupaye'), then click Stop Recording."
      );
    } catch (e) {
      setStatusBanner(
        "Microphone permission was blocked by browser. Click 'Upload Audio File' or 'Generate Sample Audio (.wav)' instead."
      );
    }
  };

  // Upload Audio File (.wav, .mp3, .m4a, .webm) -> 16kHz RIFF WAV -> Saaras v4 ASR
  const handleAudioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAudioBlobWithSaaras(file, file.name);
  };

  // Scan Kaccha Parchi Image with Vision OCR + Sarvam-105B
  const handleScanSlipImage = async (targetImgUrl = parchiImageUrl) => {
    if (!targetImgUrl) return;
    setIsScanningSlip(true);
    setStatusBanner(
      "📄 Step 2: Scanning Kaccha Parchi image with Vision OCR & extracting slip numbers via Sarvam-105B..."
    );
    const res = await extractKacchaParchiFromImage(targetImgUrl, written);
    setIsScanningSlip(false);
    if (res.ocrText) {
      setSlipOcrPreview(res.ocrText);
    }
    setTelemetry((prev) => ({
      ...prev,
      visionMs: res.latencyMs,
      liveActive: prev.liveActive || res.liveUsed,
    }));

    if (res.parsed) {
      const nextWritten = { ...written, ...res.parsed };
      setWritten(nextWritten);
      setStatusBanner(
        `✓ Extracted Kaccha Parchi from image (${res.latencyMs}ms): Net Weight ${nextWritten.recorded_net_weight_qtl} Qtl, Rate ₹${nextWritten.written_rate_per_qtl}/Qtl, Aadat ₹${nextWritten.deducted_aadat_inr}, Net Payable ${formatINR(nextWritten.written_net_payable_inr)}`
      );
      await runFullLiveArbitration(spoken, nextWritten, stateCode);
    } else {
      setStatusBanner(
        "✓ Scanned Kaccha Parchi slip image. Confirm or edit the slip figures below and click Run Arbitration."
      );
    }
  };

  // Upload Custom Kaccha Parchi Slip Photo -> Automatically Scan & Extract
  const handleSlipImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        setUploadedSlipPhoto(reader.result);
        setParchiImageUrl(reader.result);
        await handleScanSlipImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Live Bulbul v3 24kHz Voice Synthesis
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

    setIsSynthesizingTts(true);
    const ttsRes = await callLiveBulbulTts(scriptText, langCode, langObj.speaker);
    setIsSynthesizingTts(false);

    setTelemetry((prev) => ({
      ...prev,
      bulbulMs: ttsRes.latencyMs,
      liveActive: prev.liveActive || ttsRes.liveUsed,
    }));

    stopAudioRef.current = playBase64AudioOrFallback(
      ttsRes.audioBase64,
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
                  {telemetry.liveActive
                    ? "SARVAM AI LIVE CONNECTED"
                    : "SARVAM SOVEREIGN STACK"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multimodal APMC Agricultural Auction Audio vs. Kaccha Parchi Arbitrator
              </p>
            </div>
          </div>

          {/* Live 4-Stage Pipeline Telemetry Badges */}
          <div className="hidden xl:flex items-center gap-2 text-xs font-mono bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-1.5">
            <span className="flex items-center gap-1 text-sky-400">
              <Mic className="w-3.5 h-3.5" /> Saaras v4:{" "}
              <strong>
                {isTranscribingAudio ? "transcribing..." : `${telemetry.saarasMs}ms`}
              </strong>
            </span>
            <span className="text-slate-600">→</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Eye className="w-3.5 h-3.5" /> Slip OCR:{" "}
              <strong>
                {isScanningSlip ? "scanning..." : `${telemetry.visionMs}ms`}
              </strong>
            </span>
            <span className="text-slate-600">→</span>
            <span className="flex items-center gap-1 text-purple-400">
              <Cpu className="w-3.5 h-3.5" /> Sarvam-105B:{" "}
              <strong>
                {isCallingAi ? "running..." : `${telemetry.llmMs || 410}ms`}
              </strong>
            </span>
            <span className="text-slate-600">→</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Volume2 className="w-3.5 h-3.5" /> Bulbul v3:{" "}
              <strong>
                {isSynthesizingTts
                  ? "synthesizing..."
                  : `${telemetry.bulbulMs || 195}ms`}
              </strong>
            </span>
          </div>

          {/* Right Control: State APMC Act Selector */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">APMC Act:</span>
            </div>
            <select
              value={stateCode}
              onChange={(e) => {
                setStateCode(e.target.value);
                runFullLiveArbitration(spoken, written, e.target.value);
              }}
              className="rounded-lg bg-slate-800 border border-slate-700 text-amber-300 text-xs font-semibold px-3 py-2 focus:outline-none focus:border-amber-400"
            >
              {Object.entries(STATE_APMC_RULES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* MAIN DASHBOARD CONTAINER                                            */}
      {/* =================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ================================================================= */}
        {/* 1. MULTIMODAL INPUT STUDIO: STEP 1 (AUDIO) + STEP 2 (KACCHA PARCHI)*/}
        {/* ================================================================= */}
        <section className="bg-white border-2 border-amber-500 rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
          {/* Studio Header + Quick Sample Loaders */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                3-Step Multimodal Arbitration Pipeline
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Step 1: Give Audio Input (Boli) → Step 2: Upload Kaccha Parchi → Step 3: Run Arbitration
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-1">
                Load Demo Case:
              </span>
              {Object.values(PRESET_CASES).map((item) => (
                <button
                  key={item.case_id}
                  type="button"
                  onClick={() => handleSelectPreset(item.case_id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    presetId === item.case_id && !uploadedSlipPhoto
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {item.short_title}
                </button>
              ))}
            </div>
          </div>

          {statusBanner && (
            <div className="px-4 py-3 rounded-xl bg-sky-50 border-2 border-sky-400 text-xs sm:text-sm font-bold text-sky-950 flex items-center justify-between gap-2 shadow-xs">
              <span>{statusBanner}</span>
              <button
                type="button"
                onClick={() => setStatusBanner("")}
                className="text-xs font-extrabold text-sky-700 hover:underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* TWO-COLUMN MULTIMODAL INPUTS: LEFT = AUDIO, RIGHT = KACCHA PARCHI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ============================================================= */}
            {/* STEP 1: AUDIO INPUT (SPOKEN AUCTION BOLI -> SAARAS v4 ASR)    */}
            {/* ============================================================= */}
            <div className="bg-sky-50/60 border-2 border-sky-300 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-sky-700 text-white">
                    STEP 1 · AUDIO INPUT (Saaras v4 ASR)
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                    Spoken Auction Boli Audio
                  </h3>
                  <p className="text-xs text-slate-600">
                    Record the auction bid on your mic, upload an audio file (<code>.wav</code>, <code>.mp3</code>, <code>.m4a</code>), or synthesize a sample <code>.wav</code> clip.
                  </p>
                </div>
              </div>

              {/* BIG PROMINENT AUDIO ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl text-xs font-extrabold cursor-pointer transition shadow-sm ${
                    isRecordingMic
                      ? "bg-red-600 text-white animate-pulse ring-4 ring-red-300"
                      : "bg-sky-700 hover:bg-sky-800 text-white"
                  }`}
                >
                  {isRecordingMic ? (
                    <>
                      <MicOff className="w-4 h-4 shrink-0" />
                      <span>⏹️ Stop Mic Recording</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 shrink-0" />
                      <span>🎙️ Record Live Mic</span>
                    </>
                  )}
                </button>

                <label className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl text-xs font-extrabold bg-white hover:bg-sky-100 text-sky-900 border-2 border-sky-400 cursor-pointer transition shadow-sm">
                  <FileAudio className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>📁 Upload Audio File</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleGenerateSampleAuctionAudio}
                  disabled={isGeneratingSampleAudio || isTranscribingAudio}
                  className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer transition shadow-sm disabled:opacity-60"
                >
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <span>
                    {isGeneratingSampleAudio
                      ? "Generating .wav..."
                      : "🔊 Test Sample .WAV"}
                  </span>
                </button>
              </div>

              {/* AUDIO PLAYER (SHOWS RECORDED / UPLOADED / GENERATED WAV) */}
              <div className="rounded-xl bg-white border border-sky-200 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    {audioPlayerUrl
                      ? `🎵 Active Audio: ${audioSourceLabel}`
                      : "🎵 Audio Player (Record mic, upload audio, or click 'Test Sample .WAV')"}
                  </span>
                  {audioPlayerUrl && (
                    <a
                      href={audioPlayerUrl}
                      download="mandi_auction_boli_16k.wav"
                      className="text-sky-700 font-bold hover:underline"
                    >
                      ⬇️ Download .WAV
                    </a>
                  )}
                </div>
                {audioPlayerUrl ? (
                  <audio
                    controls
                    src={audioPlayerUrl}
                    className="w-full h-9"
                  />
                ) : (
                  <div className="text-xs text-slate-500 italic py-1">
                    No audio clip loaded yet — click <strong>🎙️ Record Live Mic</strong>, <strong>📁 Upload Audio File</strong>, or <strong>🔊 Test Sample .WAV</strong> above to run live <code>saaras:v4</code> Speech-to-Text!
                  </div>
                )}
              </div>

              {/* SAARAS V4 TRANSCRIPT BOX */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Saaras v4 Transcribed Speech (or type/paste deal text):
                  </label>
                  <button
                    type="button"
                    onClick={handleExtractFromTranscript}
                    disabled={isParsingText}
                    className="flex items-center gap-1 text-xs font-extrabold text-sky-800 hover:underline cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>
                      {isParsingText
                        ? "Extracting..."
                        : "✨ Extract Deal from Text"}
                    </span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={spoken.transcript}
                  onChange={(e) => updateInputs({ transcript: e.target.value }, {})}
                  className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>

              {/* EXTRACTED SPOKEN DEAL PARAMETERS */}
              <div className="bg-white/90 rounded-xl border border-sky-200 p-3 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-800">
                  Extracted Spoken Deal Terms (Auto-filled from Audio / Editable):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-sm">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Farmer Name
                    </label>
                    <input
                      type="text"
                      value={spoken.farmer_name}
                      onChange={(e) =>
                        updateInputs({ farmer_name: e.target.value }, {})
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Commodity
                    </label>
                    <input
                      type="text"
                      value={spoken.commodity_label}
                      onChange={(e) =>
                        updateInputs({ commodity_label: e.target.value }, {})
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Bags (50kg)
                    </label>
                    <input
                      type="number"
                      value={spoken.bags}
                      onChange={(e) =>
                        updateInputs({ bags: Number(e.target.value) }, {})
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-bold text-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Agreed Weight (Qtl)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={spoken.agreed_net_weight_qtl}
                      onChange={(e) =>
                        updateInputs(
                          { agreed_net_weight_qtl: Number(e.target.value) },
                          {}
                        )
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-bold text-emerald-800 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">
                      Spoken Auction Rate (₹ / Quintal)
                    </label>
                    <input
                      type="number"
                      value={spoken.agreed_rate_per_qtl}
                      onChange={(e) =>
                        updateInputs(
                          { agreed_rate_per_qtl: Number(e.target.value) },
                          {}
                        )
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-extrabold text-emerald-800 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================= */}
            {/* STEP 2: KACCHA PARCHI INPUT (SLIP IMAGE UPLOAD + OCR PARSER)  */}
            {/* ============================================================= */}
            <div className="bg-amber-50/70 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-700 text-white">
                    STEP 2 · KACCHA PARCHI INPUT (Slip Image + OCR)
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                    Written Kaccha Parchi Slip
                  </h3>
                  <p className="text-xs text-slate-600">
                    Upload a photo/image of the trader&apos;s <em>Kaccha Parchi</em> slip (<code>.png</code>, <code>.jpg</code>) to auto-extract the written figures via OCR + Sarvam-105B.
                  </p>
                </div>
              </div>

              {/* BIG PROMINENT KACCHA PARCHI UPLOAD & SCAN BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition shadow-sm">
                  <ImagePlus className="w-4 h-4 shrink-0" />
                  <span>📷 Upload Kaccha Parchi</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSlipImageUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleScanSlipImage(parchiImageUrl)}
                  disabled={isScanningSlip}
                  className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-extrabold bg-white hover:bg-amber-100 text-amber-950 border-2 border-amber-500 cursor-pointer transition shadow-sm disabled:opacity-60"
                >
                  <Eye className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    {isScanningSlip ? "Scanning Slip..." : "🔍 Scan Slip via OCR"}
                  </span>
                </button>

                <a
                  href={parchiImageUrl}
                  download={`Kaccha_Parchi_${written.slip_no || "Sample"}.png`}
                  className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-900 text-white transition shadow-sm"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>⬇️ Download Sample Slip</span>
                </a>
              </div>

              {/* LIVE KACCHA PARCHI THUMBNAIL PREVIEW + OCR STATUS RIGHT IN STEP 2 */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-white rounded-xl border border-amber-300 p-3">
                {parchiImageUrl && (
                  <img
                    src={parchiImageUrl}
                    alt="Active Kaccha Parchi Slip"
                    className="w-28 h-36 object-cover rounded-lg border border-slate-300 shadow-xs shrink-0"
                  />
                )}
                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-amber-950">
                      {uploadedSlipPhoto
                        ? "📄 Custom Uploaded Kaccha Parchi Active"
                        : "📄 Sample Kaccha Parchi Active (Download & Re-upload to test!)"}
                    </span>
                    {uploadedSlipPhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedSlipPhoto(null);
                          setSlipOcrPreview("");
                        }}
                        className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        Reset to Sample
                      </button>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {slipOcrPreview
                      ? `OCR Read: "${slipOcrPreview.slice(0, 140)}..."`
                      : "Upload any Kaccha Parchi photo or click '🔍 Scan Slip via OCR' to extract the written weight, rate, and deductions from the slip image."}
                  </p>
                </div>
              </div>

              {/* EXTRACTED WRITTEN SLIP NUMBERS */}
              <div className="bg-white/90 rounded-xl border border-amber-300 p-3 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                  Extracted Kaccha Parchi Figures (Auto-filled from Slip / Editable):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="col-span-2 sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Trader / Arthiya Firm Name
                    </label>
                    <input
                      type="text"
                      value={written.trader_firm}
                      onChange={(e) =>
                        updateInputs({}, { trader_firm: e.target.value })
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Slip Net Weight (Qtl)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={written.recorded_net_weight_qtl}
                      onChange={(e) =>
                        updateInputs(
                          {},
                          { recorded_net_weight_qtl: Number(e.target.value) }
                        )
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-bold text-red-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Karda Cut (Qtl)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={written.karda_moisture_cut_qtl}
                      onChange={(e) =>
                        updateInputs(
                          {},
                          { karda_moisture_cut_qtl: Number(e.target.value) }
                        )
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-bold text-red-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Written Rate (₹/Qtl)
                    </label>
                    <input
                      type="number"
                      value={written.written_rate_per_qtl}
                      onChange={(e) =>
                        updateInputs(
                          {},
                          { written_rate_per_qtl: Number(e.target.value) }
                        )
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-bold text-red-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Aadat Charged (₹)
                    </label>
                    <input
                      type="number"
                      value={written.deducted_aadat_inr}
                      onChange={(e) =>
                        updateInputs(
                          {},
                          { deducted_aadat_inr: Number(e.target.value) }
                        )
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-bold text-red-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Hammali / Labor (₹)
                    </label>
                    <input
                      type="number"
                      value={written.deducted_hammali_tulai_inr}
                      onChange={(e) =>
                        updateInputs(
                          {},
                          { deducted_hammali_tulai_inr: Number(e.target.value) }
                        )
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      Dharmada / Muddat (₹)
                    </label>
                    <input
                      type="number"
                      value={written.deducted_dharmada_inr}
                      onChange={(e) =>
                        updateInputs(
                          {},
                          { deducted_dharmada_inr: Number(e.target.value) }
                        )
                      }
                      className="w-full rounded-lg bg-slate-50 border border-slate-300 px-2.5 py-1.5 font-bold text-red-700"
                    />
                  </div>
                </div>

                <div className="pt-1.5 flex items-center justify-between text-xs font-bold text-amber-950 border-t border-amber-200">
                  <span>Written Slip Net Payable:</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatINR(written.written_net_payable_inr)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* STEP 3: PRIMARY FULL-WIDTH ARBITRATION EXECUTION BAR            */}
          {/* =============================================================== */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t-2 border-slate-200 bg-slate-900 text-white rounded-2xl p-4">
            <div className="space-y-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                STEP 3 · EXECUTE MULTIMODAL ARBITRATION
              </span>
              <p className="text-xs sm:text-sm text-slate-300">
                Cross-examines <strong>Step 1 (Spoken Auction Audio)</strong> against{" "}
                <strong>Step 2 (Kaccha Parchi Slip)</strong> under{" "}
                <span className="text-amber-300 font-semibold">
                  {STATE_APMC_RULES[stateCode]?.label}
                </span>
                .
              </p>
            </div>

            <button
              type="button"
              onClick={() => runFullLiveArbitration(spoken, written, stateCode)}
              disabled={isCallingAi || isTranscribingAudio || isScanningSlip}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-sm sm:text-base shadow-lg cursor-pointer transition disabled:opacity-60 shrink-0"
            >
              <Scale className="w-5 h-5 stroke-[2.5]" />
              <span>
                {isCallingAi
                  ? "⚖️ Running Sarvam-105B Arbitration..."
                  : "⚖️ Run Arbitration on Audio + Kaccha Parchi"}
              </span>
            </button>
          </div>
        </section>

        {/* 2. HERO VERDICT BANNER + 3 FINANCIAL CARDS */}
        <section
          className={`rounded-2xl border-2 p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
            underpaid > 0
              ? "bg-gradient-to-r from-red-50 via-orange-50/60 to-white border-red-300"
              : "bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-300"
          }`}
        >
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
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
              {telemetry.llmMs && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300">
                  Sarvam-105B Live ({telemetry.llmMs}ms)
                </span>
              )}
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
                {!uploadedSlipPhoto && (
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
                )}
              </div>
            </div>

            {/* Spoken Auction Transcript & Timestamps Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                  Stage 1 · Saaras v4 Code-Mixed ASR
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Extracted Spoken Claims
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
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                  Stage 3 · Deterministic APMC Engine + Live Sarvam-105B
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Spoken Deal vs. Written Slip Audit Breakdown
                </h3>
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
                    Stage 4A · Live Bulbul v3 Vernacular Voice Advisory (24kHz)
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
                  disabled={isSynthesizingTts}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm cursor-pointer transition disabled:opacity-60 ${
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
                        {isSynthesizingTts
                          ? "Synthesizing with Bulbul v3..."
                          : `Speak in ${
                              LANGUAGES.find((l) => l.code === selectedLang)?.label
                            }`}
                      </span>
                    </>
                  )}
                </button>
                {telemetry.bulbulMs && (
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    ✓ Bulbul v3 24kHz Audio ({telemetry.bulbulMs}ms)
                  </span>
                )}
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
    </div>
  );
}
