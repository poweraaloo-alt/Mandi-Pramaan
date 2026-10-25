from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class TimestampSpan(BaseModel):
    field_id: str = Field(..., description="Identifier linking to arbitration row & bounding box")
    start_sec: float
    end_sec: float
    time_label: str
    spoken_text: str
    extracted_claim: str


class BoundingBoxRegion(BaseModel):
    field_id: str = Field(..., description="e.g. trader_header, weight_row, rate_row, deductions_block, net_payable_box")
    label: str
    extracted_text: str
    bbox: List[float] = Field(..., description="Normalized [x_min, y_min, x_max, y_max] in 0.0-1.0")
    status: Literal["CRITICAL_VIOLATION", "MSP_BREACH", "WARNING", "COMPLIANT"] = "COMPLIANT"
    discrepancy_note: Optional[str] = None


class SpokenAuctionDeal(BaseModel):
    farmer_name: str
    mandi_name: str
    state_code: Literal["MP", "MH", "PB"]
    commodity_code: str
    commodity_label: str
    bags: int
    bag_weight_kg: float = 50.0
    agreed_net_weight_qtl: float
    agreed_rate_per_qtl: float
    spoken_aadat_pct: float = 0.0
    authorized_hammali_inr: float
    transcript: str
    language_code: str = "hi-IN"
    timestamp_spans: List[TimestampSpan] = Field(default_factory=list)


class WrittenParchiExtraction(BaseModel):
    trader_firm: str
    shop_no: str
    license_no: str
    slip_no: str
    slip_date: str
    recorded_bags: int
    gross_weight_qtl: float
    karda_moisture_cut_qtl: float = 0.0
    recorded_net_weight_qtl: float
    written_rate_per_qtl: float
    gross_written_amount_inr: float
    deducted_aadat_pct: float = 0.0
    deducted_aadat_inr: float = 0.0
    deducted_hammali_tulai_inr: float = 0.0
    deducted_dharmada_inr: float = 0.0
    deducted_muddat_inr: float = 0.0
    written_net_payable_inr: float
    raw_ocr_markdown: str = ""
    bounding_boxes: List[BoundingBoxRegion] = Field(default_factory=list)


class FactVsHypothesisRow(BaseModel):
    field_id: str
    parameter: str
    spoken_fact: str
    spoken_timestamp: str
    written_fact: str
    written_bbox_id: str
    delta_inr: float
    status: Literal["CRITICAL_VIOLATION", "MSP_BREACH", "WARNING", "COMPLIANT"]
    bylaw_citation: str
    legal_hypothesis: str
    enforcement_action: str


class StatutoryAuditResult(BaseModel):
    state_code: str
    state_act_name: str
    commodity_code: str
    commodity_label: str
    msp_floor_per_qtl: float
    is_below_msp: bool
    msp_shortfall_per_qtl: float
    expected_net_weight_qtl: float
    recorded_net_weight_qtl: float
    weight_shortfall_qtl: float
    weight_loss_inr: float
    agreed_rate_per_qtl: float
    written_rate_per_qtl: float
    rate_shortfall_per_qtl: float
    rate_loss_inr: float
    statutory_max_hammali_tulai_inr: float
    illegal_aadat_inr: float
    illegal_dharmada_muddat_inr: float
    excess_hammali_tulai_inr: float
    lawful_gross_inr: float
    lawful_net_payable_inr: float
    written_net_payable_inr: float
    total_farmer_underpayment_inr: float
    violation_count: int
    overall_verdict: Literal["CRITICAL_FRAUD", "HIGH_ALERT_MSP_BREACH", "COMPLIANT"]
    comparison_rows: List[FactVsHypothesisRow]


class ArbitrationReasoningOutput(BaseModel):
    executive_verdict_title: str
    legal_summary: str
    statutory_notices: List[str]
    model_thinking_trace: str
    farmer_spoken_summary_native: str
    multilingual_scripts: Dict[str, str]


class MerkleTreeData(BaseModel):
    anchor_id: str
    timestamp_iso: str
    leaf_0_audio_hash: str
    leaf_1_vision_hash: str
    leaf_2_claims_hash: str
    leaf_3_verdict_hash: str
    node_01_hash: str
    node_23_hash: str
    merkle_root: str
    ondc_credit_eligible_inr: float
    qr_verification_payload: str


class PipelineTelemetry(BaseModel):
    saaras_asr_ms: int
    sarvam_vision_ms: int
    sarvam_105b_ms: int
    bulbul_tts_ms: int
    total_pipeline_ms: int
    live_api_used: bool
    mode_label: str


class ArbitrateRequest(BaseModel):
    preset_id: Optional[str] = "sehore_wheat_fraud"
    state_code: Optional[Literal["MP", "MH", "PB"]] = None
    custom_transcript: Optional[str] = None
    spoken_override: Optional[SpokenAuctionDeal] = None
    written_override: Optional[WrittenParchiExtraction] = None
    parchi_image_base64: Optional[str] = None
    audio_base64: Optional[str] = None
    tts_language_code: str = "hi-IN"
    use_doc_ai_batch: bool = False


class ArbitrateResponse(BaseModel):
    case_id: str
    case_title: str
    spoken_deal: SpokenAuctionDeal
    written_parchi: WrittenParchiExtraction
    statutory_audit: StatutoryAuditResult
    ai_reasoning: ArbitrationReasoningOutput
    merkle_anchor: MerkleTreeData
    tts_audio_base64: Optional[str] = None
    tts_language_code: str = "hi-IN"
    tts_speaker: str = "shubh"
    telemetry: PipelineTelemetry


class TTSRequest(BaseModel):
    text: str
    language_code: str = "hi-IN"
    speaker: Optional[str] = None


class TTSResponse(BaseModel):
    audio_base64: Optional[str]
    language_code: str
    speaker: str
    latency_ms: int
    live_api_used: bool
