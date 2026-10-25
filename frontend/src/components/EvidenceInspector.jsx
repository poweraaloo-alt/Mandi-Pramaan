import React, { useState } from "react";
import { Clock, Eye, FileText, Layers, Sparkles } from "lucide-react";

export default function EvidenceInspector({
  parchiImageUrl,
  spokenDeal,
  writtenParchi,
  activeFieldId,
  onHoverField,
}) {
  const [showOcrMarkdown, setShowOcrMarkdown] = useState(false);
  const bboxes = writtenParchi?.bounding_boxes || [];
  const spans = spokenDeal?.timestamp_spans || [];

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xl">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
            PANEL 2
          </span>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Source-Grounded Evidence Inspector (BBox + Audio Sync)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOcrMarkdown(!showOcrMarkdown)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>{showOcrMarkdown ? "Show Slip + BBox" : "View Vision Markdown"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 7 cols: Interactive Handwritten Kaccha Parchi with SVG Bounding Box Overlay */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Handwritten Kaccha Parchi + <code className="text-amber-300">Sarvam Vision</code>{" "}
              ROI Overlay
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Hover any region to cross-highlight
            </span>
          </div>

          {showOcrMarkdown ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-200 whitespace-pre-wrap leading-relaxed min-h-[380px]">
              {writtenParchi?.raw_ocr_markdown || "No OCR markdown available."}
            </div>
          ) : (
            <div className="relative w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
              {parchiImageUrl && (
                <img
                  src={parchiImageUrl}
                  alt="Handwritten APMC Kaccha Parchi"
                  className="w-full h-auto block select-none"
                />
              )}

              {/* Interactive Normalized SVG Bounding Boxes (viewBox 0 0 1000 1000) */}
              <svg
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
              >
                {bboxes.map((box) => {
                  const [xMin, yMin, xMax, yMax] = box.bbox;
                  const x = xMin * 1000;
                  const y = yMin * 1000;
                  const width = (xMax - xMin) * 1000;
                  const height = (yMax - yMin) * 1000;
                  const isViolation =
                    box.status === "CRITICAL_VIOLATION" || box.status === "MSP_BREACH";
                  const isActive = activeFieldId === box.field_id;

                  const strokeColor = isViolation ? "#ef4444" : "#10b981";
                  const fillColor = isActive
                    ? isViolation
                      ? "rgba(239, 68, 68, 0.24)"
                      : "rgba(16, 185, 129, 0.22)"
                    : isViolation
                    ? "rgba(239, 68, 68, 0.08)"
                    : "rgba(16, 185, 129, 0.05)";

                  return (
                    <g
                      key={box.field_id}
                      onMouseEnter={() => onHoverField(box.field_id)}
                      onMouseLeave={() => onHoverField(null)}
                      className="cursor-pointer transition-all"
                    >
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx={14}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isActive ? 7 : isViolation ? 4.5 : 3}
                        strokeDasharray={isViolation && !isActive ? "14 6" : "none"}
                        className={isViolation ? "bbox-violation-pulse" : ""}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Right 5 cols: Timestamped Spoken Boli Chips + Extracted Vision Regions */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Timestamped Audio Spans */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Saaras v4 Timestamped Audio Claims
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {spokenDeal?.language_code || "hi-IN"}
              </span>
            </div>

            <div className="space-y-2">
              {spans.map((sp) => {
                const isActive = activeFieldId === sp.field_id;
                return (
                  <div
                    key={sp.field_id}
                    onMouseEnter={() => onHoverField(sp.field_id)}
                    onMouseLeave={() => onHoverField(null)}
                    className={`p-2.5 rounded-lg border transition cursor-pointer ${
                      isActive
                        ? "bg-cyan-950/60 border-cyan-400 ring-1 ring-cyan-400/50"
                        : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-semibold">
                        [{sp.time_label}]
                      </span>
                      <span className="text-slate-400">{sp.field_id}</span>
                    </div>
                    <p className="text-xs font-semibold text-white leading-snug">
                      &ldquo;{sp.spoken_text}&rdquo;
                    </p>
                    <p className="text-[11px] text-emerald-300 font-mono mt-1">
                      → {sp.extracted_claim}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Vision Extracted Bounding Box Legend */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Sarvam Vision Extracted Slip Regions
              </span>
            </div>

            <div className="space-y-1.5">
              {bboxes.map((box) => {
                const isViolation =
                  box.status === "CRITICAL_VIOLATION" || box.status === "MSP_BREACH";
                const isActive = activeFieldId === box.field_id;
                return (
                  <div
                    key={box.field_id}
                    onMouseEnter={() => onHoverField(box.field_id)}
                    onMouseLeave={() => onHoverField(null)}
                    className={`px-2.5 py-2 rounded-lg border text-xs transition cursor-pointer ${
                      isActive
                        ? "bg-amber-950/50 border-amber-400"
                        : isViolation
                        ? "bg-red-950/25 border-red-500/30"
                        : "bg-slate-900/80 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{box.label}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isViolation
                            ? "bg-red-500/20 text-red-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {box.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                      {box.extracted_text}
                    </p>
                    {box.discrepancy_note && (
                      <p className="text-[11px] text-red-300 font-medium mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        {box.discrepancy_note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
