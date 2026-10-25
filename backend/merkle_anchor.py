import hashlib
import json
from datetime import datetime, timezone
from .schemas import (
    MerkleTreeData,
    SpokenAuctionDeal,
    StatutoryAuditResult,
    WrittenParchiExtraction,
)


def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _canonical_json_bytes(obj: dict) -> bytes:
    return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def build_merkle_anchor(
    spoken: SpokenAuctionDeal,
    written: WrittenParchiExtraction,
    audit: StatutoryAuditResult,
    audio_bytes: bytes | None = None,
    image_bytes: bytes | None = None,
) -> MerkleTreeData:
    # Leaf 0: Audio bytes or canonical spoken transcript + timestamps
    leaf_0_source = (
        audio_bytes
        if audio_bytes
        else _canonical_json_bytes(
            {
                "transcript": spoken.transcript,
                "language_code": spoken.language_code,
                "spans": [s.model_dump() for s in spoken.timestamp_spans],
            }
        )
    )
    leaf_0_hash = _sha256_hex(leaf_0_source)

    # Leaf 1: Parchi image bytes or canonical OCR & bounding boxes
    leaf_1_source = (
        image_bytes
        if image_bytes
        else _canonical_json_bytes(
            {
                "slip_no": written.slip_no,
                "trader_firm": written.trader_firm,
                "license_no": written.license_no,
                "bboxes": [b.model_dump() for b in written.bounding_boxes],
            }
        )
    )
    leaf_1_hash = _sha256_hex(leaf_1_source)

    # Leaf 2: Canonical extracted multimodal claims
    leaf_2_hash = _sha256_hex(
        _canonical_json_bytes(
            {
                "spoken_deal": spoken.model_dump(exclude={"timestamp_spans"}),
                "written_parchi": written.model_dump(exclude={"bounding_boxes", "raw_ocr_markdown"}),
            }
        )
    )

    # Leaf 3: Statutory audit verdict
    leaf_3_hash = _sha256_hex(
        _canonical_json_bytes(
            audit.model_dump(exclude={"comparison_rows"})
        )
    )

    # Intermediate nodes
    node_01_hash = _sha256_hex((leaf_0_hash + leaf_1_hash).encode("utf-8"))
    node_23_hash = _sha256_hex((leaf_2_hash + leaf_3_hash).encode("utf-8"))

    # Merkle Root
    root_hex = _sha256_hex((node_01_hash + node_23_hash).encode("utf-8"))
    merkle_root = f"0x{root_hex}"

    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    anchor_id = f"MANDI-ANCHOR-2026-{root_hex[:8].upper()}"
    ondc_credit_eligible_inr = round(audit.lawful_net_payable_inr * 0.80, 2)

    qr_payload = json.dumps(
        {
            "protocol": "MANDI-PRAMAAN-V1",
            "anchor_id": anchor_id,
            "merkle_root": merkle_root,
            "farmer": spoken.farmer_name,
            "mandi": spoken.mandi_name,
            "commodity": spoken.commodity_code,
            "lawful_payable_inr": audit.lawful_net_payable_inr,
            "slip_payable_inr": audit.written_net_payable_inr,
            "recovery_due_inr": audit.total_farmer_underpayment_inr,
            "verdict": audit.overall_verdict,
            "credit_limit_80pct_inr": ondc_credit_eligible_inr,
            "timestamp": now_iso,
        },
        ensure_ascii=False,
    )

    return MerkleTreeData(
        anchor_id=anchor_id,
        timestamp_iso=now_iso,
        leaf_0_audio_hash=f"0x{leaf_0_hash[:16]}...{leaf_0_hash[-8:]}",
        leaf_1_vision_hash=f"0x{leaf_1_hash[:16]}...{leaf_1_hash[-8:]}",
        leaf_2_claims_hash=f"0x{leaf_2_hash[:16]}...{leaf_2_hash[-8:]}",
        leaf_3_verdict_hash=f"0x{leaf_3_hash[:16]}...{leaf_3_hash[-8:]}",
        node_01_hash=f"0x{node_01_hash[:16]}...{node_01_hash[-8:]}",
        node_23_hash=f"0x{node_23_hash[:16]}...{node_23_hash[-8:]}",
        merkle_root=merkle_root,
        ondc_credit_eligible_inr=ondc_credit_eligible_inr,
        qr_verification_payload=qr_payload,
    )
