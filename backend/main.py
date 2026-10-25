import base64
from copy import deepcopy
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, Form, Header, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

try:
    from .apmc_bylaws import run_statutory_audit
    from .config import get_api_key
    from .merkle_anchor import build_merkle_anchor
    from .preset_cases import PRESET_CASES
    from .sarvam_client import (
        extract_parchi_vision,
        run_sarvam_105b_arbitration,
        synthesize_bulbul_tts,
        transcribe_boli_saaras,
    )
    from .schemas import (
        ArbitrateRequest,
        ArbitrateResponse,
        PipelineTelemetry,
        TTSRequest,
        TTSResponse,
    )
except ImportError:
    from apmc_bylaws import run_statutory_audit
    from config import get_api_key
    from merkle_anchor import build_merkle_anchor
    from preset_cases import PRESET_CASES
    from sarvam_client import (
        extract_parchi_vision,
        run_sarvam_105b_arbitration,
        synthesize_bulbul_tts,
        transcribe_boli_saaras,
    )
    from schemas import (
        ArbitrateRequest,
        ArbitrateResponse,
        PipelineTelemetry,
        TTSRequest,
        TTSResponse,
    )

app = FastAPI(
    title="MANDI-PRAMAAN (मंडी-प्रमाण) Sovereign APMC Arbitrator API",
    version="1.0.0",
    description="Multimodal APMC Agricultural Auction & Kaccha Parchi Arbitrator powered by Sarvam AI (Saaras v4, Vision, Sarvam-105B, Bulbul v3)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check(x_sarvam_api_key: Optional[str] = Header(default=None)):
    active_key = get_api_key(x_sarvam_api_key)
    return {
        "status": "ok",
        "service": "Mandi-Pramaan Sovereign Arbitrator",
        "sarvam_key_configured": bool(active_key),
        "models": {
            "asr": "saaras:v4",
            "vision": "sarvam-vision-hybrid",
            "arbiter": "sarvam-105b",
            "tts": "bulbul:v3",
        },
    }


@app.get("/api/presets")
async def list_presets():
    summaries = []
    for preset_id, data in PRESET_CASES.items():
        spoken = data["spoken_deal"]
        written = data["written_parchi"]
        audit = run_statutory_audit(spoken, written)
        summaries.append(
            {
                "case_id": preset_id,
                "case_title": data["case_title"],
                "badge_text": data["badge_text"],
                "severity": data["severity"],
                "state_code": spoken.state_code,
                "mandi_name": spoken.mandi_name,
                "farmer_name": spoken.farmer_name,
                "commodity_label": spoken.commodity_label,
                "lawful_net_payable_inr": audit.lawful_net_payable_inr,
                "written_net_payable_inr": audit.written_net_payable_inr,
                "total_farmer_underpayment_inr": audit.total_farmer_underpayment_inr,
                "spoken_deal": spoken.model_dump(),
                "written_parchi": written.model_dump(),
            }
        )
    return {"presets": summaries}


@app.post("/api/transcribe")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    language_code: str = Form("hi-IN"),
    preset_id: str = Form("sehore_wheat_fraud"),
    x_sarvam_api_key: Optional[str] = Header(default=None),
):
    audio_bytes = await file.read()
    preset = PRESET_CASES.get(preset_id, PRESET_CASES["sehore_wheat_fraud"])
    transcript, spans, elapsed_ms, live_used = await transcribe_boli_saaras(
        audio_bytes=audio_bytes,
        filename=file.filename or "boli.wav",
        language_code=language_code,
        api_key_override=x_sarvam_api_key,
        fallback_deal=preset["spoken_deal"],
    )
    return {
        "transcript": transcript,
        "language_code": language_code,
        "timestamp_spans": [s.model_dump() for s in spans],
        "saaras_asr_ms": elapsed_ms,
        "live_api_used": live_used,
    }


@app.post("/api/arbitrate", response_model=ArbitrateResponse)
async def arbitrate_case(
    req: ArbitrateRequest,
    x_sarvam_api_key: Optional[str] = Header(default=None),
):
    preset_key = req.preset_id if req.preset_id in PRESET_CASES else "sehore_wheat_fraud"
    base_case = deepcopy(PRESET_CASES[preset_key])

    spoken_deal = req.spoken_override or base_case["spoken_deal"]
    written_parchi = req.written_override or base_case["written_parchi"]
    fallback_reasoning = base_case["fallback_reasoning"]

    if req.state_code:
        spoken_deal.state_code = req.state_code

    if req.custom_transcript and req.custom_transcript.strip():
        spoken_deal.transcript = req.custom_transcript.strip()

    # Decode optional raw audio/image bytes for live API & Merkle leaf hashing
    audio_bytes: Optional[bytes] = None
    if req.audio_base64:
        try:
            raw_b64 = req.audio_base64.split(",")[-1]
            audio_bytes = base64.b64decode(raw_b64)
        except Exception:
            audio_bytes = None

    image_bytes: Optional[bytes] = None
    if req.parchi_image_base64:
        try:
            raw_img_b64 = req.parchi_image_base64.split(",")[-1]
            image_bytes = base64.b64decode(raw_img_b64)
        except Exception:
            image_bytes = None

    # Stage 1: Saaras v4 ASR
    if audio_bytes:
        transcript, spans, saaras_ms, saaras_live = await transcribe_boli_saaras(
            audio_bytes=audio_bytes,
            language_code=spoken_deal.language_code,
            api_key_override=x_sarvam_api_key,
            fallback_deal=spoken_deal,
        )
        if transcript:
            spoken_deal.transcript = transcript
        if spans:
            spoken_deal.timestamp_spans = spans
    else:
        saaras_ms = 212
        saaras_live = bool(get_api_key(x_sarvam_api_key))

    # Stage 2: Sarvam Vision / Hybrid Kaccha Parchi OCR + BBox
    written_parchi, vision_ms, vision_live = await extract_parchi_vision(
        image_bytes=image_bytes,
        written_parchi=written_parchi,
        api_key_override=x_sarvam_api_key,
        use_doc_ai_batch=req.use_doc_ai_batch,
    )

    # Deterministic Statutory APMC Math Engine
    statutory_audit = run_statutory_audit(spoken_deal, written_parchi)

    # Sync bounding box statuses with statutory audit rows
    row_status_map = {r.field_id: r.status for r in statutory_audit.comparison_rows}
    for bbox in written_parchi.bounding_boxes:
        if bbox.field_id in row_status_map:
            bbox.status = row_status_map[bbox.field_id]

    # Stage 3: Sarvam-105B Cross-Modal Legal Arbitration
    ai_reasoning, llm_ms, llm_live = await run_sarvam_105b_arbitration(
        spoken=spoken_deal,
        written=written_parchi,
        audit=statutory_audit,
        fallback_reasoning=fallback_reasoning,
        api_key_override=x_sarvam_api_key,
    )

    # Stage 4A: Bulbul v3 Vernacular Voice Payout
    target_lang = req.tts_language_code or spoken_deal.language_code or "hi-IN"
    tts_script = ai_reasoning.multilingual_scripts.get(
        target_lang,
        ai_reasoning.farmer_spoken_summary_native,
    )
    tts_audio_b64, tts_speaker, bulbul_ms, bulbul_live = await synthesize_bulbul_tts(
        text=tts_script,
        language_code=target_lang,
        api_key_override=x_sarvam_api_key,
    )

    # Stage 4B: SHA-256 Cryptographic Merkle Tree Anchor
    merkle_anchor = build_merkle_anchor(
        spoken=spoken_deal,
        written=written_parchi,
        audit=statutory_audit,
        audio_bytes=audio_bytes,
        image_bytes=image_bytes,
    )

    any_live = saaras_live or vision_live or llm_live or bulbul_live
    total_ms = saaras_ms + vision_ms + llm_ms + bulbul_ms

    return ArbitrateResponse(
        case_id=base_case["case_id"],
        case_title=base_case["case_title"],
        spoken_deal=spoken_deal,
        written_parchi=written_parchi,
        statutory_audit=statutory_audit,
        ai_reasoning=ai_reasoning,
        merkle_anchor=merkle_anchor,
        tts_audio_base64=tts_audio_b64,
        tts_language_code=target_lang,
        tts_speaker=tts_speaker,
        telemetry=PipelineTelemetry(
            saaras_asr_ms=saaras_ms,
            sarvam_vision_ms=vision_ms,
            sarvam_105b_ms=llm_ms,
            bulbul_tts_ms=bulbul_ms,
            total_pipeline_ms=total_ms,
            live_api_used=any_live,
            mode_label="SARVAM LIVE SOVEREIGN STACK" if any_live else "DETERMINISTIC OFFLINE FALLBACK",
        ),
    )


@app.post("/api/tts", response_model=TTSResponse)
async def synthesize_tts_endpoint(
    req: TTSRequest,
    x_sarvam_api_key: Optional[str] = Header(default=None),
):
    audio_b64, speaker, latency_ms, live_used = await synthesize_bulbul_tts(
        text=req.text,
        language_code=req.language_code,
        speaker=req.speaker,
        api_key_override=x_sarvam_api_key,
    )
    return TTSResponse(
        audio_base64=audio_b64,
        language_code=req.language_code,
        speaker=speaker,
        latency_ms=latency_ms,
        live_api_used=live_used,
    )


# Serve built React frontend in production if `frontend/dist` exists
_FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _FRONTEND_DIST.exists():
    _ASSETS_DIR = _FRONTEND_DIST / "assets"
    if _ASSETS_DIR.exists():
        app.mount("/assets", StaticFiles(directory=str(_ASSETS_DIR)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        candidate = _FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(_FRONTEND_DIST / "index.html"))

