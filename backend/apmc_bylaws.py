from typing import Dict, List
from .schemas import (
    FactVsHypothesisRow,
    SpokenAuctionDeal,
    StatutoryAuditResult,
    WrittenParchiExtraction,
)

# 2026-27 Minimum Support Prices (MSP Reference Floor in INR / Quintal)
MSP_REFERENCE_FLOOR: Dict[str, Dict[str, float | str]] = {
    "WHEAT_SHARBATI": {"label": "Sharbati / FAQ Wheat (गेहूँ)", "msp": 2425.0},
    "WHEAT_FAQ": {"label": "Wheat FAQ (गेहूँ)", "msp": 2425.0},
    "SOYBEAN_YELLOW": {"label": "Yellow Soybean (पीला सोयाबीन)", "msp": 4892.0},
    "PADDY_PR126": {"label": "Paddy PR-126 / Grade-A (धान)", "msp": 2320.0},
    "PADDY_GRADE_A": {"label": "Paddy Grade-A (धान)", "msp": 2320.0},
    "MUSTARD_SEED": {"label": "Mustard Seed (सरसों)", "msp": 5950.0},
    "CHANA_GRAM": {"label": "Bengal Gram / Chana (चना)", "msp": 5650.0},
}

STATE_APMC_RULES: Dict[str, Dict[str, float | str]] = {
    "MP": {
        "act_name": "Madhya Pradesh Krishi Upaj Mandi Adhiniyam, 1972 (Sec 32 & 37)",
        "max_farmer_aadat_pct": 0.0,
        "max_hammali_tulai_per_bag": 8.0,  # Rs 8 per 50kg bag (Rs 16/Qtl)
        "aadat_clause": "MP APMC Act Sec 32(2): 0% commission (Aadat) deductible from farmer; 100% payable by buyer.",
        "karda_clause": "MP APMC Act Sec 37(1): Arbitrary Karda/moisture weight deduction after open auction is unlawful.",
        "dharmada_clause": "MP APMC Act Sec 37(3): Dharmada (charity cut) and Muddat deductions from farmer proceeds are prohibited.",
        "rate_clause": "MP APMC Auction Rule 41: Final बोली (auction bid) recorded by Mandi clerk is binding on the buyer.",
    },
    "MH": {
        "act_name": "Maharashtra APMC (Development & Regulation) Act, 1963 (Sec 30A)",
        "max_farmer_aadat_pct": 0.0,
        "max_hammali_tulai_per_bag": 12.0,  # Rs 12 per 50kg bag (Rs 24/Qtl)
        "aadat_clause": "Maharashtra APMC Act Sec 30A: Commission (Aadat) on notified produce must be recovered strictly from buyer, never seller.",
        "karda_clause": "Maharashtra APMC Rule 32: Excess Bardana/Sutli tare cut beyond standard gunny weight (0.7 kg) is an offense.",
        "dharmada_clause": "Maharashtra APMC Sec 31: Muddat (cash discount) and Karda deductions from farmer bill are illegal.",
        "rate_clause": "Maharashtra APMC Sec 30A & MSP Circular: Writing a rate below auction hammer price or statutory MSP is actionable.",
    },
    "PB": {
        "act_name": "Punjab Agricultural Produce Markets Act, 1961 (Rule 24)",
        "max_farmer_aadat_pct": 0.0,
        "max_hammali_tulai_per_bag": 10.50,  # Rs 10.50 per 50kg bag
        "aadat_clause": "Punjab APMC Act Rule 24: Arhtia Dami (2.5%) is borne entirely by buyer/agency; ₹0 deductible from farmer.",
        "karda_clause": "Punjab Mandi Board Weighment Bylaw 18: Electronic weighbridge net weight is final; manual Karda cut is prohibited.",
        "dharmada_clause": "Punjab APMC Act Sec 23: Unauthorized charity/cash discounts on J-Form payouts are prohibited.",
        "rate_clause": "Punjab APMC Auction Rule 24: J-Form rate must match the auction register and MSP floor.",
    },
}


def run_statutory_audit(
    spoken: SpokenAuctionDeal,
    written: WrittenParchiExtraction,
) -> StatutoryAuditResult:
    state_code = spoken.state_code if spoken.state_code in STATE_APMC_RULES else "MP"
    rules = STATE_APMC_RULES[state_code]
    msp_info = MSP_REFERENCE_FLOOR.get(
        spoken.commodity_code,
        {"label": spoken.commodity_label, "msp": 2425.0},
    )
    msp_floor = float(msp_info["msp"])

    expected_net_weight_qtl = round((spoken.bags * spoken.bag_weight_kg) / 100.0, 2)
    weight_shortfall_qtl = round(max(0.0, expected_net_weight_qtl - written.recorded_net_weight_qtl), 2)
    weight_loss_inr = round(weight_shortfall_qtl * spoken.agreed_rate_per_qtl, 2)

    rate_shortfall_per_qtl = round(max(0.0, spoken.agreed_rate_per_qtl - written.written_rate_per_qtl), 2)
    rate_loss_inr = round(written.recorded_net_weight_qtl * rate_shortfall_per_qtl, 2)

    is_below_msp = written.written_rate_per_qtl < msp_floor
    msp_shortfall_per_qtl = round(max(0.0, msp_floor - written.written_rate_per_qtl), 2)

    statutory_max_hammali = round(spoken.bags * float(rules["max_hammali_tulai_per_bag"]), 2)
    illegal_aadat_inr = round(max(0.0, written.deducted_aadat_inr), 2)
    illegal_dharmada_muddat_inr = round(
        max(0.0, written.deducted_dharmada_inr + written.deducted_muddat_inr), 2
    )
    excess_hammali_tulai_inr = round(
        max(0.0, written.deducted_hammali_tulai_inr - statutory_max_hammali), 2
    )

    lawful_gross_inr = round(expected_net_weight_qtl * spoken.agreed_rate_per_qtl, 2)
    lawful_hammali_deduction = min(written.deducted_hammali_tulai_inr, statutory_max_hammali)
    lawful_net_payable_inr = round(lawful_gross_inr - lawful_hammali_deduction, 2)
    total_farmer_underpayment_inr = round(
        max(0.0, lawful_net_payable_inr - written.written_net_payable_inr), 2
    )

    rows: List[FactVsHypothesisRow] = []
    violation_count = 0

    # 1. Weight Row
    weight_status = "CRITICAL_VIOLATION" if weight_shortfall_qtl > 0.001 else "COMPLIANT"
    if weight_status != "COMPLIANT":
        violation_count += 1
    rows.append(
        FactVsHypothesisRow(
            field_id="weight_row",
            parameter="Net Weighment (तौल / वजन)",
            spoken_fact=f"{spoken.bags} Bags = {expected_net_weight_qtl:.2f} Qtl (Pakka Weighment)",
            spoken_timestamp=spoken.timestamp_spans[0].time_label if len(spoken.timestamp_spans) > 0 else "00:01.2 - 00:04.5",
            written_fact=(
                f"{written.recorded_net_weight_qtl:.2f} Qtl "
                f"(Karda/Tare Cut: -{written.karda_moisture_cut_qtl:.2f} Qtl)"
                if written.karda_moisture_cut_qtl > 0
                else f"{written.recorded_net_weight_qtl:.2f} Qtl (0.00 Qtl Cut)"
            ),
            written_bbox_id="weight_row",
            delta_inr=weight_loss_inr,
            status=weight_status,
            bylaw_citation=str(rules["karda_clause"]),
            legal_hypothesis=(
                f"Arthiya deducted {written.karda_moisture_cut_qtl:.2f} Qtl ({weight_shortfall_qtl * 100:.0f} kg) as uncertified Karda/Tare cut, depriving farmer of ₹{weight_loss_inr:,.2f}."
                if weight_shortfall_qtl > 0
                else "Recorded net weight matches electronic weighbridge & spoken auction lot."
            ),
            enforcement_action=(
                f"Restore {weight_shortfall_qtl:.2f} Qtl (+₹{weight_loss_inr:,.2f}) under Weighment Bylaw."
                if weight_shortfall_qtl > 0
                else "Verified compliant."
            ),
        )
    )

    # 2. Auction Rate & MSP Row
    if rate_shortfall_per_qtl > 0 and is_below_msp:
        rate_status = "MSP_BREACH"
        violation_count += 1
    elif rate_shortfall_per_qtl > 0:
        rate_status = "CRITICAL_VIOLATION"
        violation_count += 1
    else:
        rate_status = "COMPLIANT"

    rows.append(
        FactVsHypothesisRow(
            field_id="rate_row",
            parameter="Auction Rate vs Slip (बोली दर / MSP)",
            spoken_fact=f"₹{spoken.agreed_rate_per_qtl:,.0f} / Qtl (MSP Floor: ₹{msp_floor:,.0f})",
            spoken_timestamp=spoken.timestamp_spans[1].time_label if len(spoken.timestamp_spans) > 1 else "00:04.6 - 00:07.8",
            written_fact=f"₹{written.written_rate_per_qtl:,.0f} / Qtl"
            + (f" (-₹{rate_shortfall_per_qtl:,.0f}/Qtl Tampered)" if rate_shortfall_per_qtl > 0 else " (Exact Match)"),
            written_bbox_id="rate_row",
            delta_inr=rate_loss_inr,
            status=rate_status,
            bylaw_citation=str(rules["rate_clause"]),
            legal_hypothesis=(
                f"Slip rate lowered by ₹{rate_shortfall_per_qtl:,.0f}/Qtl below spoken hammer price"
                + (f" and ₹{msp_shortfall_per_qtl:,.0f}/Qtl below statutory MSP floor (₹{msp_floor:,.0f})." if is_below_msp else ".")
                if rate_shortfall_per_qtl > 0
                else f"Slip rate matches spoken auction bid and satisfies MSP floor (₹{msp_floor:,.0f}/Qtl)."
            ),
            enforcement_action=(
                f"Enforce auction bid rate ₹{spoken.agreed_rate_per_qtl:,.0f}/Qtl (+₹{rate_loss_inr:,.2f})."
                if rate_shortfall_per_qtl > 0
                else "Verified compliant."
            ),
        )
    )

    # 3. Commission (Aadat) & Statutory Deductions Row
    deduction_delta = round(illegal_aadat_inr + illegal_dharmada_muddat_inr + excess_hammali_tulai_inr, 2)
    deduction_status = "CRITICAL_VIOLATION" if deduction_delta > 0 else "COMPLIANT"
    if deduction_status != "COMPLIANT":
        violation_count += 1

    deduction_parts = []
    if written.deducted_aadat_inr > 0:
        deduction_parts.append(f"Aadat ({written.deducted_aadat_pct}%): -₹{written.deducted_aadat_inr:,.0f}")
    if written.deducted_dharmada_inr > 0:
        deduction_parts.append(f"Dharmada: -₹{written.deducted_dharmada_inr:,.0f}")
    if written.deducted_muddat_inr > 0:
        deduction_parts.append(f"Muddat: -₹{written.deducted_muddat_inr:,.0f}")
    deduction_parts.append(f"Hammali/Tulai: -₹{written.deducted_hammali_tulai_inr:,.0f}")

    rows.append(
        FactVsHypothesisRow(
            field_id="deductions_block",
            parameter="Mandi Deductions (आड़त / हम्माली / धर्मादा)",
            spoken_fact=f"0% Farmer Aadat; Authorized Labor: ₹{lawful_hammali_deduction:,.0f}",
            spoken_timestamp=spoken.timestamp_spans[2].time_label if len(spoken.timestamp_spans) > 2 else "00:07.9 - 00:11.0",
            written_fact=" | ".join(deduction_parts),
            written_bbox_id="deductions_block",
            delta_inr=deduction_delta,
            status=deduction_status,
            bylaw_citation=f"{rules['aadat_clause']} {rules['dharmada_clause']}",
            legal_hypothesis=(
                f"Unlawful deduction of ₹{illegal_aadat_inr:,.0f} seller commission (Aadat) and ₹{illegal_dharmada_muddat_inr:,.0f} Dharmada/Muddat from farmer proceeds."
                if deduction_delta > 0
                else f"Zero commission charged to farmer; labor deduction ₹{written.deducted_hammali_tulai_inr:,.0f} is within statutory cap (₹{statutory_max_hammali:,.0f})."
            ),
            enforcement_action=(
                f"Refund ₹{deduction_delta:,.2f} illegal deductions + issue Sec 32/37 show-cause notice to trader license {written.license_no}."
                if deduction_delta > 0
                else "Verified compliant."
            ),
        )
    )

    # 4. Net Payable Row
    net_status = "CRITICAL_VIOLATION" if total_farmer_underpayment_inr > 0 else "COMPLIANT"
    rows.append(
        FactVsHypothesisRow(
            field_id="net_payable_box",
            parameter="Net Farmer Payout (शुद्ध भुगतान राशि)",
            spoken_fact=f"Lawful Net Payable: ₹{lawful_net_payable_inr:,.2f}",
            spoken_timestamp="00:00.0 - 00:11.0",
            written_fact=f"Slip Net Payable: ₹{written.written_net_payable_inr:,.2f}",
            written_bbox_id="net_payable_box",
            delta_inr=total_farmer_underpayment_inr,
            status=net_status,
            bylaw_citation=str(rules["act_name"]),
            legal_hypothesis=(
                f"Combined weighment cut, rate tampering, and illegal Aadat/Dharmada cuts resulted in a net underpayment of ₹{total_farmer_underpayment_inr:,.2f}."
                if total_farmer_underpayment_inr > 0
                else "100% statutory match between spoken auction terms and written settlement slip."
            ),
            enforcement_action=(
                f"Generate Mandi-Pramaan Recovery Order for ₹{total_farmer_underpayment_inr:,.2f} before Gate Pass exit."
                if total_farmer_underpayment_inr > 0
                else "Approve instant e-Mandi / ONDC settlement & 80% pledge credit line."
            ),
        )
    )

    if total_farmer_underpayment_inr > 0 and is_below_msp:
        overall_verdict = "HIGH_ALERT_MSP_BREACH"
    elif total_farmer_underpayment_inr > 0:
        overall_verdict = "CRITICAL_FRAUD"
    else:
        overall_verdict = "COMPLIANT"

    return StatutoryAuditResult(
        state_code=state_code,
        state_act_name=str(rules["act_name"]),
        commodity_code=spoken.commodity_code,
        commodity_label=spoken.commodity_label,
        msp_floor_per_qtl=msp_floor,
        is_below_msp=is_below_msp,
        msp_shortfall_per_qtl=msp_shortfall_per_qtl,
        expected_net_weight_qtl=expected_net_weight_qtl,
        recorded_net_weight_qtl=written.recorded_net_weight_qtl,
        weight_shortfall_qtl=weight_shortfall_qtl,
        weight_loss_inr=weight_loss_inr,
        agreed_rate_per_qtl=spoken.agreed_rate_per_qtl,
        written_rate_per_qtl=written.written_rate_per_qtl,
        rate_shortfall_per_qtl=rate_shortfall_per_qtl,
        rate_loss_inr=rate_loss_inr,
        statutory_max_hammali_tulai_inr=statutory_max_hammali,
        illegal_aadat_inr=illegal_aadat_inr,
        illegal_dharmada_muddat_inr=illegal_dharmada_muddat_inr,
        excess_hammali_tulai_inr=excess_hammali_tulai_inr,
        lawful_gross_inr=lawful_gross_inr,
        lawful_net_payable_inr=lawful_net_payable_inr,
        written_net_payable_inr=written.written_net_payable_inr,
        total_farmer_underpayment_inr=total_farmer_underpayment_inr,
        violation_count=violation_count,
        overall_verdict=overall_verdict,
        comparison_rows=rows,
    )
