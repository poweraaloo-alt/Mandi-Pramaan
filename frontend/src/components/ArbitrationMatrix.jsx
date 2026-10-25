import React, { useState } from "react";
import {
  AlertOctagon,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Gavel,
  Scale,
  ShieldAlert,
} from "lucide-react";

export default function ArbitrationMatrix({
  statutoryAudit,
  aiReasoning,
  activeFieldId,
  onHoverField,
}) {
  const [showThinking, setShowThinking] = useState(false);

  if (!statutoryAudit) return null;

  const isClean = statutoryAudit.overall_verdict === "COMPLIANT";
  const underpayment = Number(statutoryAudit.total_farmer_underpayment_inr || 0);
  const rows = statutoryAudit.comparison_rows || [];

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xl">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
            PANEL 3
          </span>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Fact-vs-Hypothesis Arbitration &amp; APMC Statutory Matrix
          </h2>
        </div>

        <span className="text-xs font-mono text-slate-400">
          {statutoryAudit.state_act_name}
        </span>
      </div>

      {/* Hero Recovery Callout Banner */}
      <div
        className={`rounded-xl p-4 border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isClean
            ? "bg-gradient-to-r from-emerald-950/70 via-emerald-900/30 to-slate-900 border-emerald-500/40"
            : "bg-gradient-to-r from-red-950/80 via-amber-950/40 to-slate-900 border-red-500/50"
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isClean ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
            )}
            <span
              className={`text-xs font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                isClean
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {isClean
                ? "100% STATUTORY COMPLIANT — ZERO DISCREPANCY"
                : `${statutoryAudit.violation_count} STATUTORY APMC VIOLATIONS DETECTED`}
            </span>
          </div>

          <h3 className="text-base font-extrabold text-white leading-snug pt-0.5">
            {aiReasoning?.executive_verdict_title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            {aiReasoning?.legal_summary}
          </p>
        </div>

        {/* Financial Comparison Pill Box */}
        <div className="flex items-center gap-3 shrink-0 bg-slate-950/90 border border-slate-800 rounded-xl p-3">
          <div className="text-right">
            <span className="block text-[10px] font-mono uppercase text-slate-400">
              Slip Written Payout
            </span>
            <span className="text-sm font-mono font-bold text-slate-300 line-through">
              ₹{Number(statutoryAudit.written_net_payable_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-[10px] font-mono uppercase text-emerald-400 mt-1">
              Lawful APMC Payout
            </span>
            <span className="text-base font-mono font-extrabold text-emerald-300">
              ₹{Number(statutoryAudit.lawful_net_payable_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div
            className={`px-3 py-2 rounded-lg border text-center ${
              isClean
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-red-500/20 border-red-500/50 text-red-200"
            }`}
          >
            <span className="block text-[10px] font-mono uppercase font-bold">
              {isClean ? "Farmer Loss" : "Recovery Due"}
            </span>
            <span className="text-lg font-mono font-extrabold">
              {isClean
                ? "₹0.00"
                : `+₹${underpayment.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Comparison Table: Verbatim Multimodal Facts vs. Sarvam-105B Legal Hypotheses */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
              <th className="py-2.5 px-3">Audit Vector</th>
              <th className="py-2.5 px-3 text-cyan-300">
                Col A1: Spoken Fact (Saaras v4)
              </th>
              <th className="py-2.5 px-3 text-amber-300">
                Col A2: Written Slip (Sarvam Vision)
              </th>
              <th className="py-2.5 px-3 text-right">Delta (₹)</th>
              <th className="py-2.5 px-3 text-purple-300">
                Col B: Sarvam-105B Statutory Hypothesis &amp; Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {rows.map((row) => {
              const isViolation = row.status !== "COMPLIANT";
              const isActive = activeFieldId === row.field_id;
              return (
                <tr
                  key={row.field_id}
                  onMouseEnter={() => onHoverField(row.field_id)}
                  onMouseLeave={() => onHoverField(null)}
                  className={`transition cursor-pointer ${
                    isActive
                      ? "bg-amber-500/15"
                      : isViolation
                      ? "bg-red-950/15 hover:bg-red-950/30"
                      : "hover:bg-slate-900/60"
                  }`}
                >
                  <td className="py-2.5 px-3 align-top font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isViolation ? "bg-red-500 animate-ping" : "bg-emerald-400"
                        }`}
                      />
                      <span>{row.parameter}</span>
                    </div>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-slate-400 border border-slate-800">
                      [{row.spoken_timestamp}]
                    </span>
                  </td>

                  <td className="py-2.5 px-3 align-top text-cyan-200 font-mono">
                    {row.spoken_fact}
                  </td>

                  <td className="py-2.5 px-3 align-top text-amber-200 font-mono">
                    {row.written_fact}
                  </td>

                  <td className="py-2.5 px-3 align-top text-right font-mono font-bold whitespace-nowrap">
                    {row.delta_inr > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                        -₹{Number(row.delta_inr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                        ₹0.00
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 align-top max-w-md">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Scale className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="font-mono text-[11px] font-bold text-purple-300">
                        {row.bylaw_citation}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-snug">{row.legal_hypothesis}</p>
                    <p
                      className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
                        isViolation ? "text-amber-300" : "text-emerald-400"
                      }`}
                    >
                      <Gavel className="w-3 h-3 shrink-0" />
                      {row.enforcement_action}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Collapsible Sarvam-105B Chain-of-Thought Reasoning Drawer */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowThinking(!showThinking)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-purple-300 hover:bg-slate-900/80 transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            <span>
              Inspect <code className="text-purple-200">sarvam-105b</code> Chain-of-Thought
              Deliberation &amp; Statutory Citations
            </span>
          </span>
          {showThinking ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showThinking && (
          <div className="p-3.5 border-t border-slate-800 space-y-2.5 text-xs">
            <pre className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-purple-200 whitespace-pre-wrap leading-relaxed">
              {aiReasoning?.model_thinking_trace}
            </pre>
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Statutory Enforcement Notices:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                {(aiReasoning?.statutory_notices || []).map((notice, idx) => (
                  <li key={idx}>{notice}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
