"""
Mandi-Pramaan (मंडी-प्रमाण) — Streamlit UI

Checks a handwritten mandi slip (Kaccha Parchi) against the spoken auction deal,
audits every rupee against State APMC rules, and produces a voice message and a
tamper-evident receipt for the farmer.

Run:  streamlit run streamlit_app.py
"""

import asyncio
import base64
import hashlib
import io
import json
import os
from copy import deepcopy

import qrcode
import streamlit as st

# Allow Streamlit Cloud secrets to provide the key (local runs use .env via backend.config)
try:
    if "SARVAM_API_KEY" in st.secrets and not os.environ.get("SARVAM_API_KEY"):
        os.environ["SARVAM_API_KEY"] = st.secrets["SARVAM_API_KEY"]
except Exception:
    pass

from backend.apmc_bylaws import STATE_APMC_RULES, run_statutory_audit  # noqa: E402
from backend.config import get_api_key  # noqa: E402
from backend.merkle_anchor import build_merkle_anchor  # noqa: E402
from backend.preset_cases import PRESET_CASES  # noqa: E402
from backend.sarvam_client import (  # noqa: E402
    run_sarvam_105b_arbitration,
    synthesize_bulbul_tts,
)

st.set_page_config(page_title="Mandi-Pramaan | मंडी-प्रमाण", page_icon="⚖️", layout="wide")

# --------------------------------------------------------------------------------------
# Constants & helpers
# --------------------------------------------------------------------------------------
STATUS_STYLE = {
    "CRITICAL_VIOLATION": ("Violation", "#B91C1C", "#FEE2E2"),
    "MSP_BREACH": ("Below MSP", "#C2410C", "#FFEDD5"),
    "WARNING": ("Warning", "#A16207", "#FEF9C3"),
    "COMPLIANT": ("OK", "#15803D", "#DCFCE7"),
}
STATE_LABELS = {"MP": "Madhya Pradesh", "MH": "Maharashtra", "PB": "Punjab"}
LANGS = {
    "hi-IN": "हिंदी Hindi",
    "mr-IN": "मराठी Marathi",
    "pa-IN": "ਪੰਜਾਬੀ Punjabi",
    "ta-IN": "தமிழ் Tamil",
    "te-IN": "తెలుగు Telugu",
}

st.markdown(
    """
<style>
.block-container {padding-top: 2.2rem; max-width: 1280px;}
.stMarkdown p, .stMarkdown li {font-size: 1.02rem; line-height: 1.6;}
.app-title {font-size: 2.1rem; font-weight: 800; color: #1F2937; margin-bottom: 0;}
.app-title span {color: #B45309; font-weight: 700; margin-left: .5rem;}
.subtitle {color: #6B7280; font-size: 1rem; margin-top: .1rem;}
.banner {padding: 1rem 1.3rem; border-radius: 14px; margin: .8rem 0 1.1rem; border: 1px solid;}
.banner h3 {margin: 0; font-size: 1.35rem;}
.banner p {margin: .3rem 0 0; font-size: 1rem;}
.pill {display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: .78rem;
       font-weight: 700; margin-left: 6px; vertical-align: middle;}
.label {color: #6B7280; font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; font-weight: 600;}
.value {font-size: 1.02rem; color: #111827;}
.loss {font-size: 1.35rem; font-weight: 800; color: #B91C1C;}
.ok {font-size: 1.35rem; font-weight: 800; color: #15803D;}
.parchi {background: #FDF6D8; border: 3px double #B91C1C; border-radius: 10px; padding: 18px 20px;
         font-family: 'Noto Sans Devanagari', 'Nirmala UI', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,.06);}
.parchi-head {text-align: center; color: #7F1D1D; border-bottom: 1px solid #DC2626; padding-bottom: 8px;}
.parchi-head .firm {font-size: 1.35rem; font-weight: 800;}
.parchi-head .meta {font-size: .9rem;}
.region {border: 2px dashed; border-radius: 8px; padding: 10px 12px; margin: 12px 0 0; background: rgba(255,255,255,.45);}
.region-title {font-weight: 700; color: #7F1D1D; margin-bottom: 4px; font-size: .95rem;}
.hand {color: #1E3A8A; font-size: 1.05rem; line-height: 1.7;}
.hand .bad {color: #B91C1C; font-weight: 700;}
.note {color: #B91C1C; font-size: .88rem; margin-top: 4px;}
.chip {font-family: ui-monospace, monospace; background: #E0F2FE; color: #075985; padding: 2px 8px;
       border-radius: 6px; font-size: .85rem;}
.quote {background: #FFFFFF; border-left: 4px solid #B45309; padding: 12px 16px; border-radius: 6px;
        font-size: 1.08rem; line-height: 1.8;}
.script {font-size: 1.22rem; line-height: 1.9; background: #FFFFFF; border: 1px solid #E5E7EB;
         border-radius: 12px; padding: 16px 20px;}
.hash {font-family: ui-monospace, monospace; font-size: .9rem; word-break: break-all;
       background: #F0FDF4; border: 1px solid #86EFAC; color: #166534; padding: 10px 12px; border-radius: 8px;}
</style>
""",
    unsafe_allow_html=True,
)


def inr(value: float, decimals: int = 2) -> str:
    """Format a number with Indian digit grouping, e.g. 194720 -> ₹1,94,720.00"""
    neg = value < 0
    s = f"{abs(value):.{decimals}f}"
    whole, _, frac = s.partition(".")
    if len(whole) > 3:
        head, tail = whole[:-3], whole[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        whole = ",".join(groups + [tail])
    return ("-" if neg else "") + "₹" + whole + (f".{frac}" if frac else "")


def pill(status: str) -> str:
    label, fg, bg = STATUS_STYLE.get(status, STATUS_STYLE["COMPLIANT"])
    return f'<span class="pill" style="color:{fg};background:{bg}">{label}</span>'


def qr_png(data: str) -> bytes:
    img = qrcode.make(data, box_size=6, border=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def load_preset(preset_id: str) -> None:
    case = PRESET_CASES[preset_id]
    st.session_state.preset_id = preset_id
    st.session_state.spoken = deepcopy(case["spoken_deal"])
    st.session_state.written = deepcopy(case["written_parchi"])
    st.session_state.state_code = case["spoken_deal"].state_code
    st.session_state.edited = False


def plain_reasoning(audit, fallback):
    """Summary built only from the deterministic audit (used when inputs differ from the preset)."""
    bad = [r for r in audit.comparison_rows if r.status != "COMPLIANT" and r.field_id != "net_payable_box"]
    if audit.total_farmer_underpayment_inr > 0:
        title = f"Farmer underpaid by {inr(audit.total_farmer_underpayment_inr)} under {STATE_LABELS[audit.state_code]} APMC rules"
    else:
        title = "Slip matches the auction deal and APMC rules"
    summary = " ".join(r.legal_hypothesis for r in bad) or "Spoken deal and written slip match with no unlawful deductions."
    return fallback.model_copy(
        update={
            "executive_verdict_title": title,
            "legal_summary": summary,
            "statutory_notices": [r.bylaw_citation for r in bad],
            "model_thinking_trace": "",
        }
    )


def parchi_html(w, s, status_map) -> str:
    def region(fid, title, body, note=""):
        status = status_map.get(fid, "COMPLIANT")
        border = STATUS_STYLE[status][1] if status != "COMPLIANT" else "#16A34A"
        note_html = f'<div class="note">⚠ {note}</div>' if note and status != "COMPLIANT" else ""
        return (
            f'<div class="region" style="border-color:{border}">'
            f'<div class="region-title">{title} {pill(status)}</div>'
            f'<div class="hand">{body}</div>{note_html}</div>'
        )

    karda = w.karda_moisture_cut_qtl
    karda_line = (
        f'<span class="bad">करदा / कमी काट: −{karda:.2f} क्विंटल</span>' if karda > 0 else "करदा / कमी काट: 0.00 क्विंटल"
    )
    ded_lines = [
        (f'<span class="bad">आड़त ({w.deducted_aadat_pct}%): −{inr(w.deducted_aadat_inr)}</span>'
         if w.deducted_aadat_inr > 0 else "आड़त: ₹0"),
        f"हम्माली / तुलाई: −{inr(w.deducted_hammali_tulai_inr)}",
    ]
    if w.deducted_dharmada_inr > 0:
        ded_lines.append(f'<span class="bad">धर्मादा: −{inr(w.deducted_dharmada_inr)}</span>')
    if w.deducted_muddat_inr > 0:
        ded_lines.append(f'<span class="bad">मुद्दत (नकद कटौती): −{inr(w.deducted_muddat_inr)}</span>')

    notes = {b.field_id: (b.discrepancy_note or "") for b in w.bounding_boxes}
    if st.session_state.get("edited"):
        notes = {}

    return (
        '<div class="parchi">'
        '<div class="parchi-head">'
        '<div class="meta">कृषि उपज मंडी समिति · कच्ची पर्ची</div>'
        f'<div class="firm">{w.trader_firm}</div>'
        f'<div class="meta">{w.shop_no} · Lic {w.license_no}</div>'
        f'<div class="meta">Slip {w.slip_no} · {w.slip_date} · किसान: {s.farmer_name}</div>'
        "</div>"
        + region(
            "weight_row",
            "1. तौल · Weight",
            f"{w.recorded_bags} बोरी · कुल वजन {w.gross_weight_qtl:.2f} क्विंटल<br>{karda_line}<br>"
            f"<b>शुद्ध वजन: {w.recorded_net_weight_qtl:.2f} क्विंटल</b>",
            notes.get("weight_row", ""),
        )
        + region(
            "rate_row",
            "2. भाव · Rate",
            f"<b>{inr(w.written_rate_per_qtl, 0)} / क्विंटल</b><br>कुल रकम: {inr(w.gross_written_amount_inr)}",
            notes.get("rate_row", ""),
        )
        + region("deductions_block", "3. कटौती · Deductions", "<br>".join(ded_lines), notes.get("deductions_block", ""))
        + region(
            "net_payable_box",
            "4. शुद्ध भुगतान · Net payable",
            f'<span style="font-size:1.5rem;font-weight:800">{inr(w.written_net_payable_inr)}</span>',
            notes.get("net_payable_box", ""),
        )
        + "</div>"
    )


# --------------------------------------------------------------------------------------
# Session state
# --------------------------------------------------------------------------------------
PRESET_IDS = list(PRESET_CASES)
if "preset_id" not in st.session_state:
    load_preset(PRESET_IDS[0])
if "ai_cache" not in st.session_state:
    st.session_state.ai_cache = {}
if "audio_cache" not in st.session_state:
    st.session_state.audio_cache = {}
HAS_KEY = bool(get_api_key())
if "live" not in st.session_state:
    st.session_state.live = HAS_KEY

# --------------------------------------------------------------------------------------
# Sidebar
# --------------------------------------------------------------------------------------
with st.sidebar:
    st.markdown("## ⚖️ Mandi-Pramaan")
    st.caption("Check a mandi slip against the spoken auction deal and State APMC rules.")

    st.radio(
        "Sample case",
        PRESET_IDS,
        key="preset_choice",
        format_func=lambda i: PRESET_CASES[i]["case_title"].split(" — ")[0],
        on_change=lambda: load_preset(st.session_state.preset_choice),
    )
    st.caption(PRESET_CASES[st.session_state.preset_id]["case_title"].split(" — ")[-1])

    st.selectbox("APMC law to apply", list(STATE_LABELS), key="state_code", format_func=lambda c: STATE_LABELS[c])

    st.divider()
    st.toggle("Use live Sarvam AI", key="live", disabled=not HAS_KEY)
    if HAS_KEY:
        st.caption("✅ Sarvam API key found." if st.session_state.live else "Live AI is off — using built-in results.")
    else:
        st.caption("No `SARVAM_API_KEY` found. Add it to `.env` to enable live AI.")

    st.divider()
    st.caption(
        "**Pipeline:** Saaras v4 (speech) → slip extraction → APMC rule engine + Sarvam-105B (legal review) "
        "→ Bulbul v3 (voice) → SHA-256 receipt"
    )

# --------------------------------------------------------------------------------------
# Compute audit
# --------------------------------------------------------------------------------------
case = PRESET_CASES[st.session_state.preset_id]
spoken = deepcopy(st.session_state.spoken)
spoken.state_code = st.session_state.state_code
written = deepcopy(st.session_state.written)
audit = run_statutory_audit(spoken, written)
status_map = {r.field_id: r.status for r in audit.comparison_rows}

case_key = hashlib.sha256((spoken.model_dump_json() + written.model_dump_json()).encode()).hexdigest()
matches_preset = not st.session_state.edited and spoken.state_code == case["spoken_deal"].state_code
default_reasoning = case["fallback_reasoning"] if matches_preset else plain_reasoning(audit, case["fallback_reasoning"])
ai_entry = st.session_state.ai_cache.get(case_key)
reasoning = ai_entry["reasoning"] if ai_entry else default_reasoning

# --------------------------------------------------------------------------------------
# Header & verdict
# --------------------------------------------------------------------------------------
st.markdown('<div class="app-title">Mandi-Pramaan<span>मंडी-प्रमाण</span></div>', unsafe_allow_html=True)
st.markdown(
    f'<div class="subtitle">{spoken.mandi_name} · {spoken.commodity_label} · Farmer: {spoken.farmer_name}</div>',
    unsafe_allow_html=True,
)

underpaid = audit.total_farmer_underpayment_inr
if underpaid > 0:
    st.markdown(
        f'<div class="banner" style="background:#FEF2F2;border-color:#FCA5A5;color:#7F1D1D">'
        f"<h3>🚨 Farmer underpaid by {inr(underpaid)}</h3>"
        f"<p>{audit.violation_count} problem(s) found under the {audit.state_act_name}.</p></div>",
        unsafe_allow_html=True,
    )
else:
    st.markdown(
        '<div class="banner" style="background:#F0FDF4;border-color:#86EFAC;color:#14532D">'
        "<h3>✅ Slip is correct</h3>"
        f"<p>The written slip matches the auction deal and the {audit.state_act_name}.</p></div>",
        unsafe_allow_html=True,
    )

m1, m2, m3, m4 = st.columns(4)
m1.metric("Farmer should receive", inr(audit.lawful_net_payable_inr))
m2.metric("Slip says", inr(audit.written_net_payable_inr))
m3.metric("Underpaid by", inr(underpaid), delta=f"-{inr(underpaid)}" if underpaid > 0 else None, delta_color="inverse")
m4.metric("Problems found", audit.violation_count)

# --------------------------------------------------------------------------------------
# Editor
# --------------------------------------------------------------------------------------
with st.expander("✏️ Try your own numbers — edit the deal or the slip and re-check"):
    s0, w0 = st.session_state.spoken, st.session_state.written
    with st.form("edit_form"):
        st.markdown("**Said at the auction**")
        c1, c2 = st.columns(2)
        bags = c1.number_input("Bags (50 kg each)", min_value=1, value=int(s0.bags), step=1)
        rate_s = c2.number_input("Auction rate (₹ per quintal)", min_value=0.0, value=float(s0.agreed_rate_per_qtl), step=10.0)

        st.markdown("**Written on the slip**")
        c3, c4, c5 = st.columns(3)
        net_w = c3.number_input("Net weight (quintal)", min_value=0.0, value=float(w0.recorded_net_weight_qtl), step=0.01, format="%.2f")
        karda = c4.number_input("Karda / weight cut (quintal)", min_value=0.0, value=float(w0.karda_moisture_cut_qtl), step=0.01, format="%.2f")
        rate_w = c5.number_input("Written rate (₹ per quintal)", min_value=0.0, value=float(w0.written_rate_per_qtl), step=10.0)

        c6, c7, c8, c9 = st.columns(4)
        aadat = c6.number_input("Aadat ₹", min_value=0.0, value=float(w0.deducted_aadat_inr), step=10.0)
        hammali = c7.number_input("Hammali / labour ₹", min_value=0.0, value=float(w0.deducted_hammali_tulai_inr), step=10.0)
        dharmada = c8.number_input("Dharmada ₹", min_value=0.0, value=float(w0.deducted_dharmada_inr), step=10.0)
        muddat = c9.number_input("Muddat ₹", min_value=0.0, value=float(w0.deducted_muddat_inr), step=10.0)

        submitted = st.form_submit_button("Re-check slip", type="primary")

    if submitted:
        gross = round(net_w * rate_w, 2)
        st.session_state.spoken = s0.model_copy(
            update={
                "bags": int(bags),
                "agreed_net_weight_qtl": round(bags * s0.bag_weight_kg / 100, 2),
                "agreed_rate_per_qtl": rate_s,
            }
        )
        st.session_state.written = w0.model_copy(
            update={
                "recorded_net_weight_qtl": net_w,
                "karda_moisture_cut_qtl": karda,
                "gross_weight_qtl": round(net_w + karda, 2),
                "written_rate_per_qtl": rate_w,
                "gross_written_amount_inr": gross,
                "deducted_aadat_inr": aadat,
                "deducted_aadat_pct": round(aadat / gross * 100, 2) if gross else 0.0,
                "deducted_hammali_tulai_inr": hammali,
                "deducted_dharmada_inr": dharmada,
                "deducted_muddat_inr": muddat,
                "written_net_payable_inr": round(gross - aadat - hammali - dharmada - muddat, 2),
            }
        )
        st.session_state.edited = True
        st.rerun()

    st.button("↺ Reset to original sample", on_click=load_preset, args=(st.session_state.preset_id,))

# --------------------------------------------------------------------------------------
# Tabs
# --------------------------------------------------------------------------------------
tab_findings, tab_evidence, tab_voice, tab_proof = st.tabs(
    ["📋 Findings", "🧾 Evidence", "🔊 Voice message", "🔐 Proof receipt"]
)

# ---- Findings ------------------------------------------------------------------------
with tab_findings:
    for row in audit.comparison_rows:
        with st.container(border=True):
            c0, c1, c2, c3 = st.columns([2.2, 3, 3, 1.6])
            c0.markdown(f"**{row.parameter}** {pill(row.status)}", unsafe_allow_html=True)
            c1.markdown(f'<div class="label">Said at auction</div><div class="value">{row.spoken_fact}</div>', unsafe_allow_html=True)
            c2.markdown(f'<div class="label">Written on slip</div><div class="value">{row.written_fact}</div>', unsafe_allow_html=True)
            loss_html = f'<div class="loss">−{inr(row.delta_inr)}</div>' if row.delta_inr > 0 else '<div class="ok">₹0</div>'
            c3.markdown(f'<div class="label">Farmer loss</div>{loss_html}', unsafe_allow_html=True)
            st.markdown(f"**Finding:** {row.legal_hypothesis}")
            st.caption(f"⚖️ {row.bylaw_citation}  \n➡️ {row.enforcement_action}")

    st.subheader("Legal summary")
    source = "Sarvam-105B" if ai_entry and ai_entry["live"] else "built-in rule engine"
    st.caption(f"Source: {source}")
    with st.container(border=True):
        st.markdown(f"**{reasoning.executive_verdict_title}**")
        st.markdown(reasoning.legal_summary)
        if reasoning.statutory_notices:
            for notice in reasoning.statutory_notices:
                st.markdown(f"- {notice}")
        if reasoning.model_thinking_trace:
            with st.expander("Show model reasoning"):
                st.text(reasoning.model_thinking_trace)

    if st.session_state.live:
        if st.button("🧠 Ask Sarvam-105B to review this case", type="primary"):
            with st.spinner("Sarvam-105B is reviewing the case…"):
                result, ms, live = asyncio.run(
                    run_sarvam_105b_arbitration(spoken, written, audit, default_reasoning)
                )
            st.session_state.ai_cache[case_key] = {"reasoning": result, "live": live, "ms": ms}
            if not live:
                st.warning("Sarvam-105B didn't return a usable answer, so the built-in summary is shown.")
            st.rerun()
        if ai_entry and ai_entry["live"]:
            st.caption(f"Sarvam-105B answered in {ai_entry['ms'] / 1000:.1f}s")

# ---- Evidence ------------------------------------------------------------------------
with tab_evidence:
    left, right = st.columns([1.1, 1])
    with left:
        st.markdown("#### Written slip (Kaccha Parchi)")
        st.markdown(parchi_html(written, spoken, status_map), unsafe_allow_html=True)
        st.caption("Red borders mark lines that break the auction deal or APMC rules. Green borders are fine.")
    with right:
        st.markdown("#### What was said at the auction")
        st.markdown(f'<div class="quote">{spoken.transcript}</div>', unsafe_allow_html=True)
        st.caption(f"Language: {spoken.language_code} · transcribed with Saaras v4 (code-mixed mode)")
        st.markdown("#### Key moments")
        for span in spoken.timestamp_spans:
            with st.container(border=True):
                st.markdown(
                    f'<span class="chip">{span.time_label}</span> {pill(status_map.get(span.field_id, "COMPLIANT"))}',
                    unsafe_allow_html=True,
                )
                st.markdown(f"“{span.spoken_text}”")
                st.caption(f"→ {span.extracted_claim}")

# ---- Voice ---------------------------------------------------------------------------
with tab_voice:
    st.markdown("#### Message for the farmer in their language")
    lang_codes = list(LANGS)
    default_lang = spoken.language_code if spoken.language_code in LANGS else "hi-IN"
    lang = st.radio(
        "Language",
        lang_codes,
        index=lang_codes.index(default_lang),
        format_func=lambda c: LANGS[c],
        horizontal=True,
        label_visibility="collapsed",
    )
    script = reasoning.multilingual_scripts.get(lang) or reasoning.farmer_spoken_summary_native
    st.markdown(f'<div class="script">{script}</div>', unsafe_allow_html=True)
    if not matches_preset:
        st.caption("Note: these messages are written for the original sample and may not reflect your edits.")

    audio_key = hashlib.sha256(f"{lang}|{script}".encode()).hexdigest()
    cached_audio = st.session_state.audio_cache.get(audio_key)
    if st.session_state.live:
        if st.button("🔊 Generate voice with Bulbul v3", type="primary"):
            with st.spinner("Generating speech…"):
                b64, speaker, ms, live = asyncio.run(synthesize_bulbul_tts(script, lang))
            if live and b64:
                st.session_state.audio_cache[audio_key] = base64.b64decode(b64)
                st.rerun()
            else:
                st.warning("Bulbul v3 didn't return audio. Check your API key and network connection.")
    else:
        st.info("Turn on **Use live Sarvam AI** in the sidebar to generate audio.")
    if cached_audio:
        st.audio(cached_audio, format="audio/wav")

# ---- Proof ---------------------------------------------------------------------------
with tab_proof:
    anchor = build_merkle_anchor(spoken, written, audit)
    left, right = st.columns([1.6, 1])
    with left:
        st.markdown("#### Tamper-evident receipt")
        st.markdown(
            "Each piece of evidence is fingerprinted with SHA-256 and combined into one **Merkle root**. "
            "If anyone changes the audio, the slip, the extracted numbers or the verdict, the root changes."
        )
        st.markdown(f"**Receipt ID:** `{anchor.anchor_id}`")
        st.markdown(f'<div class="hash">{anchor.merkle_root}</div>', unsafe_allow_html=True)
        st.markdown("")
        st.table(
            {
                "Evidence": ["Auction audio / transcript", "Slip image / extraction", "Extracted claims", "Audit verdict"],
                "SHA-256 fingerprint": [
                    anchor.leaf_0_audio_hash,
                    anchor.leaf_1_vision_hash,
                    anchor.leaf_2_claims_hash,
                    anchor.leaf_3_verdict_hash,
                ],
            }
        )
    with right:
        st.markdown("#### Scan to verify")
        st.image(qr_png(anchor.qr_verification_payload), width=240)
        st.metric("Eligible for 80% pledge credit", inr(anchor.ondc_credit_eligible_inr, 0))
        st.download_button(
            "⬇️ Download receipt (JSON)",
            data=json.dumps(
                {
                    **json.loads(anchor.qr_verification_payload),
                    "leaves": {
                        "audio": anchor.leaf_0_audio_hash,
                        "vision": anchor.leaf_1_vision_hash,
                        "claims": anchor.leaf_2_claims_hash,
                        "verdict": anchor.leaf_3_verdict_hash,
                    },
                },
                ensure_ascii=False,
                indent=2,
            ),
            file_name=f"{anchor.anchor_id}.json",
            mime="application/json",
        )
