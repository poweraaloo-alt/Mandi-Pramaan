import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Mic,
  MicOff,
  Play,
  Sliders,
  Sparkles,
  Upload,
} from "lucide-react";

const PRESET_CARDS = [
  {
    id: "sehore_wheat_fraud",
    title: "1. Sehore Mandi (MP) — Sharbati Wheat",
    subtitle: "52 Bags (26 Qtl) • Rate & Karda Cut + Illegal 2.5% Aadat",
    badge: "₹5,710.40 Fraud",
    severity: "CRITICAL_FRAUD",
  },
  {
    id: "latur_soybean_msp",
    title: "2. Latur Mandi (MH) — Yellow Soybean",
    subtitle: "80 Bags (40 Qtl) • Below MSP (₹4,650 vs ₹4,892) + 1.6 Qtl Theft",
    badge: "₹21,583.00 MSP Breach",
    severity: "HIGH_ALERT_MSP_BREACH",
  },
  {
    id: "khanna_paddy_clean",
    title: "3. Khanna Mandi (PB) — Paddy PR-126",
    subtitle: "100 Bags (50 Qtl) • Full ₹2,320 MSP • 0% Farmer Aadat",
    badge: "100% Compliant",
    severity: "COMPLIANT",
  },
];

export default function MultimodalInputDock({
  activePresetId,
  onSelectPreset,
  spokenDeal,
  writtenParchi,
  onUpdateSpokenAndWritten,
  onRunArbitration,
  onCustomImageUpload,
  isRunning,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const waveCanvasRef = useRef(null);
  const animRef = useRef(null);

  // Animated frequency waveform when recording is toggled
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 36;
      const barWidth = canvas.width / bars - 2;
      for (let i = 0; i < bars; i++) {
        const amp = isRecording
          ? Math.abs(Math.sin(phase + i * 0.35)) * 22 + 4
          : 4 + Math.sin(i * 0.5) * 2;
        const x = i * (barWidth + 2);
        const y = (canvas.height - amp) / 2;
        ctx.fillStyle = isRecording ? "#f59e0b" : "#334155";
        ctx.fillRect(x, y, barWidth, amp);
      }
      phase += 0.18;
      if (isRecording) {
        animRef.current = requestAnimationFrame(render);
      }
    };

    render();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isRecording]);

  const handleFieldChange = (target, field, value) => {
    if (target === "spoken") {
      const updatedSpoken = { ...spokenDeal, [field]: value };
      if (field === "bags") {
        updatedSpoken.agreed_net_weight_qtl = Number(((Number(value) * 50) / 100).toFixed(2));
      }
      onUpdateSpokenAndWritten(updatedSpoken, writtenParchi);
    } else {
      const updatedWritten = { ...writtenParchi, [field]: value };
      const netWt = Number(updatedWritten.recorded_net_weight_qtl || 0);
      const rate = Number(updatedWritten.written_rate_per_qtl || 0);
      const gross = Number((netWt * rate).toFixed(2));
      updatedWritten.gross_written_amount_inr = gross;
      const aadat = Number(updatedWritten.deducted_aadat_inr || 0);
      const hammali = Number(updatedWritten.deducted_hammali_tulai_inr || 0);
      const dharmada = Number(updatedWritten.deducted_dharmada_inr || 0);
      const muddat = Number(updatedWritten.deducted_muddat_inr || 0);
      updatedWritten.written_net_payable_inr = Number(
        (gross - aadat - hammali - dharmada - muddat).toFixed(2)
      );
      onUpdateSpokenAndWritten(spokenDeal, updatedWritten);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onCustomImageUpload(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
            PANEL 1
          </span>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Multimodal Capture &amp; Golden APMC Presets
          </h2>
        </div>
        <button
          onClick={() => setShowSimulator(!showSimulator)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showSimulator ? "Hide Slip Editor" : "Live Tamper Simulator"}</span>
        </button>
      </div>

      {/* 3 One-Click Golden Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {PRESET_CARDS.map((card) => {
          const active = activePresetId === card.id;
          const isClean = card.severity === "COMPLIANT";
          return (
            <button
              key={card.id}
              onClick={() => onSelectPreset(card.id)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                active
                  ? "bg-slate-800/95 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50"
                  : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isClean
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-500/15 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {isClean ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {card.badge}
                  </span>
                  {active && (
                    <span className="text-[10px] font-mono text-amber-400 font-bold">
                      ● ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-white leading-snug">{card.title}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">{card.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Saaras v4 Spoken Boli Recorder & Code-Mixed Transcript Box */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">
              Stage 1: Spoken Auction Boli (<code className="text-cyan-300">saaras:v4</code> •{" "}
              <code className="text-amber-300">mode=&quot;codemix&quot;</code>)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <canvas
              ref={waveCanvasRef}
              width={120}
              height={26}
              className="rounded bg-slate-900 border border-slate-800 px-1"
            />
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition ${
                isRecording
                  ? "bg-red-500/20 border-red-500 text-red-300 animate-pulse"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-500/50"
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Stop Mic</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Record Boli</span>
                </>
              )}
            </button>
          </div>
        </div>

        <textarea
          rows={2}
          value={spokenDeal?.transcript || ""}
          onChange={(e) => handleFieldChange("spoken", "transcript", e.target.value)}
          className="w-full rounded-lg bg-slate-900/90 border border-slate-800 px-3 py-2 text-xs text-slate-100 leading-relaxed focus:outline-none focus:border-cyan-500"
          placeholder="Spoken auction transcript in code-mixed Hindi / Marathi / Punjabi..."
        />
      </div>

      {/* Interactive Slip Tamper Simulator (lets judges tweak numbers live and re-audit!) */}
      {showSimulator && spokenDeal && writtenParchi && (
        <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Live Judge Tamper Simulator (Updates Handwritten Parchi Canvas &amp; Statutory Math)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[10px] font-mono text-slate-400">
                Spoken Rate (₹/Qtl)
              </label>
              <input
                type="number"
                value={spokenDeal.agreed_rate_per_qtl}
                onChange={(e) =>
                  handleFieldChange("spoken", "agreed_rate_per_qtl", Number(e.target.value))
                }
                className="w-full mt-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-emerald-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400">
                Slip Written Rate (₹/Qtl)
              </label>
              <input
                type="number"
                value={writtenParchi.written_rate_per_qtl}
                onChange={(e) =>
                  handleFieldChange("written", "written_rate_per_qtl", Number(e.target.value))
                }
                className="w-full mt-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-red-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400">
                Slip Net Weight (Qtl)
              </label>
              <input
                type="number"
                step="0.1"
                value={writtenParchi.recorded_net_weight_qtl}
                onChange={(e) =>
                  handleFieldChange("written", "recorded_net_weight_qtl", Number(e.target.value))
                }
                className="w-full mt-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400">
                Deducted Aadat (₹)
              </label>
              <input
                type="number"
                value={writtenParchi.deducted_aadat_inr}
                onChange={(e) =>
                  handleFieldChange("written", "deducted_aadat_inr", Number(e.target.value))
                }
                className="w-full mt-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-red-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400">
                Dharmada Cut (₹)
              </label>
              <input
                type="number"
                value={writtenParchi.deducted_dharmada_inr}
                onChange={(e) =>
                  handleFieldChange("written", "deducted_dharmada_inr", Number(e.target.value))
                }
                className="w-full mt-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-red-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400">
                Hammali / Labor (₹)
              </label>
              <input
                type="number"
                value={writtenParchi.deducted_hammali_tulai_inr}
                onChange={(e) =>
                  handleFieldChange(
                    "written",
                    "deducted_hammali_tulai_inr",
                    Number(e.target.value)
                  )
                }
                className="w-full mt-0.5 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Bar: Upload Custom Slip OR Run Full 4-Stage Arbitration */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 cursor-pointer transition">
          <Upload className="w-3.5 h-3.5 text-amber-400" />
          <span>Upload Custom Kaccha Parchi Photo</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>

        <button
          type="button"
          onClick={onRunArbitration}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-slate-950" />
          <span>
            {isRunning ? "Running Sarvam 4-Stage Arbitration..." : "Re-Run Sovereign Arbitration"}
          </span>
        </button>
      </div>
    </section>
  );
}
