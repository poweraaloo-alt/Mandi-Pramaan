from typing import Dict
from .schemas import (
    ArbitrationReasoningOutput,
    BoundingBoxRegion,
    SpokenAuctionDeal,
    TimestampSpan,
    WrittenParchiExtraction,
)

PRESET_CASES: Dict[str, dict] = {
    "sehore_wheat_fraud": {
        "case_id": "sehore_wheat_fraud",
        "case_title": "Sehore Mandi (MP) — Sharbati Wheat Over-Deduction & Rate Tampering",
        "badge_text": "₹5,710.40 Fraud",
        "severity": "CRITICAL_FRAUD",
        "spoken_deal": SpokenAuctionDeal(
            farmer_name="रमेश चंद्र पटेल (Ramesh Chandra Patel)",
            mandi_name="Sehore Krishi Upaj Mandi, Gate #2 (MP)",
            state_code="MP",
            commodity_code="WHEAT_SHARBATI",
            commodity_label="Sharbati Wheat (शरबती गेहूँ)",
            bags=52,
            bag_weight_kg=50.0,
            agreed_net_weight_qtl=26.00,
            agreed_rate_per_qtl=2650.0,
            spoken_aadat_pct=0.0,
            authorized_hammali_inr=416.0,
            transcript=(
                "हाँ भाई, सीहोर मंडी गेट नंबर २, रमेश किसान का शरबती गेहूँ ५२ बोरी, "
                "पूरा २६ क्विंटल पक्का तौल। बोली फाइनल हुई २,६५० रुपये प्रति क्विंटल पर। "
                "किसान से कोई आड़त नहीं कटेगी, बस सरकारी हम्माली-तुलाई ४१६ रुपये लगेगी।"
            ),
            language_code="hi-IN",
            timestamp_spans=[
                TimestampSpan(
                    field_id="weight_row",
                    start_sec=1.2,
                    end_sec=4.5,
                    time_label="00:01.2 - 00:04.5",
                    spoken_text="शरबती गेहूँ ५२ बोरी, पूरा २६ क्विंटल पक्का तौल",
                    extracted_claim="52 Bags = 26.00 Quintal Net Weight (0% Moisture Cut)",
                ),
                TimestampSpan(
                    field_id="rate_row",
                    start_sec=4.6,
                    end_sec=7.8,
                    time_label="00:04.6 - 00:07.8",
                    spoken_text="बोली फाइनल हुई २,६५० रुपये प्रति क्विंटल पर",
                    extracted_claim="Hammer Price: ₹2,650 / Quintal",
                ),
                TimestampSpan(
                    field_id="deductions_block",
                    start_sec=7.9,
                    end_sec=11.0,
                    time_label="00:07.9 - 00:11.0",
                    spoken_text="किसान से कोई आड़त नहीं कटेगी, बस सरकारी हम्माली-तुलाई लगेगी",
                    extracted_claim="0% Farmer Aadat; Only ₹416 Authorized Hammali-Tulai",
                ),
            ],
        ),
        "written_parchi": WrittenParchiExtraction(
            trader_firm="M/s Seth Laxminarayan & Sons",
            shop_no="Shop #14, Block-B, Sehore APMC",
            license_no="MP-SEH-AR-••••-0842",
            slip_no="KP-2026-8841",
            slip_date="25-Oct-2026",
            recorded_bags=52,
            gross_weight_qtl=26.00,
            karda_moisture_cut_qtl=0.78,
            recorded_net_weight_qtl=25.22,
            written_rate_per_qtl=2580.0,
            gross_written_amount_inr=65067.60,
            deducted_aadat_pct=2.5,
            deducted_aadat_inr=1627.0,
            deducted_hammali_tulai_inr=416.0,
            deducted_dharmada_inr=251.0,
            deducted_muddat_inr=0.0,
            written_net_payable_inr=62773.60,
            raw_ocr_markdown=(
                "### कच्ची पर्ची (KACCHA PARCHI) — M/s Seth Laxminarayan & Sons\n"
                "- **किसान:** रमेश चंद्र पटेल | **जिन्स:** शरबती गेहूँ (52 बोरी)\n"
                "- **कुल तौल:** 26.00 Qtl | **करदा/कमी (1.5 kg/बोरी):** -0.78 Qtl -> **पक्का वजन:** 25.22 Qtl\n"
                "- **भाव (Rate):** ₹2,580 / Qtl | **कुल रकम:** ₹65,067.60\n"
                "- **कटौती:** आड़त (2.5%): -₹1,627.00 | हम्माली-तुलाई: -₹416.00 | धर्मादा (गौशाला): -₹251.00\n"
                "- **शुद्ध देय भुगतान (Net Payable):** ₹62,773.60"
            ),
            bounding_boxes=[
                BoundingBoxRegion(
                    field_id="trader_header",
                    label="Arthiya Header & License",
                    extracted_text="M/s Seth Laxminarayan & Sons | Lic: MP-SEH-AR-2019-0842",
                    bbox=[0.06, 0.06, 0.94, 0.22],
                    status="COMPLIANT",
                ),
                BoundingBoxRegion(
                    field_id="weight_row",
                    label="Weighment & Karda Cut",
                    extracted_text="52 Bags | Gross: 26.00 Qtl | Karda Cut: -0.78 Qtl -> Net: 25.22 Qtl",
                    bbox=[0.06, 0.26, 0.94, 0.41],
                    status="CRITICAL_VIOLATION",
                    discrepancy_note="Unlawful 0.78 Qtl (78 kg) Karda cut costing ₹2,067.00",
                ),
                BoundingBoxRegion(
                    field_id="rate_row",
                    label="Written Rate vs Auction Bid",
                    extracted_text="Written Rate: ₹2,580/Qtl (Spoken Bid: ₹2,650/Qtl) | Gross: ₹65,067.60",
                    bbox=[0.06, 0.44, 0.94, 0.56],
                    status="CRITICAL_VIOLATION",
                    discrepancy_note="Rate shaved by ₹70/Qtl below auction hammer price (-₹1,765.40)",
                ),
                BoundingBoxRegion(
                    field_id="deductions_block",
                    label="Aadat, Hammali & Dharmada Cuts",
                    extracted_text="Aadat 2.5%: -₹1,627 | Hammali: -₹416 | Dharmada: -₹251",
                    bbox=[0.06, 0.59, 0.94, 0.76],
                    status="CRITICAL_VIOLATION",
                    discrepancy_note="Illegal Seller Aadat (₹1,627) + Dharmada (₹251) under MP APMC Sec 32 & 37",
                ),
                BoundingBoxRegion(
                    field_id="net_payable_box",
                    label="Net Payout Written on Slip",
                    extracted_text="Slip Net Payable: ₹62,773.60 (Lawful Payable: ₹68,484.00)",
                    bbox=[0.06, 0.79, 0.94, 0.93],
                    status="CRITICAL_VIOLATION",
                    discrepancy_note="Farmer underpaid by ₹5,710.40",
                ),
            ],
        ),
        "fallback_reasoning": ArbitrationReasoningOutput(
            executive_verdict_title="CRITICAL STATUTORY VIOLATION: ₹5,710.40 Recoverable Under MP APMC Act Sec 32 & 37",
            legal_summary=(
                "Cross-modal verification between Saaras v4 auction audio and Sarvam Vision Kaccha Parchi OCR reveals "
                "three deliberate deductions by M/s Seth Laxminarayan & Sons: (1) an uncertified 0.78 Quintal 'Karda' "
                "weight cut (₹2,067.00 loss), (2) downward tampering of the auction rate from ₹2,650/Qtl to ₹2,580/Qtl "
                "(₹1,765.40 loss), and (3) illegal deduction of 2.5% seller commission (₹1,627.00) and Dharmada charity "
                "cut (₹251.00) in breach of Sections 32(2) and 37(3) of the MP Krishi Upaj Mandi Adhiniyam."
            ),
            statutory_notices=[
                "Section 32(2) Breach: Commission (Aadat) of ₹1,627.00 must be collected exclusively from the buyer, never deducted from the farmer's Kaccha Parchi.",
                "Section 37(1) & Weighment Bylaw Breach: Deducting 1.5 kg/bag (0.78 Qtl = ₹2,067.00) as Karda after electronic weighment is illegal.",
                "Auction Rule 41 Breach: Written slip rate (₹2,580/Qtl) deviates from recorded open-outcry bid (₹2,650/Qtl) by ₹70/Qtl (₹1,765.40).",
            ],
            model_thinking_trace=(
                "1. Aligning Saaras v4 timestamped spans with Sarvam Vision bounding boxes for Slip #KP-2026-8841.\n"
                "2. Audio span [00:01.2-00:04.5] confirms 52 bags = 26.00 Qtl net weight. Slip bbox 'weight_row' records 25.22 Qtl after 0.78 Qtl Karda cut -> Discrepancy = 0.78 * 2650 = ₹2,067.00.\n"
                "3. Audio span [00:04.6-00:07.8] confirms ₹2,650/Qtl hammer price. Slip bbox 'rate_row' writes ₹2,580/Qtl -> Discrepancy on 25.22 Qtl = 25.22 * 70 = ₹1,765.40.\n"
                "4. Checking MP APMC Act Sec 32 & 37: Seller Aadat (₹1,627) and Dharmada (₹251) are strictly prohibited. Hammali (₹416 for 52 bags = ₹8/bag) is compliant.\n"
                "5. Total underpayment = ₹68,484.00 (Lawful) - ₹62,773.60 (Written) = ₹5,710.40. Generating native Devanagari farmer advisory for Bulbul v3."
            ),
            farmer_spoken_summary_native=(
                "किसान भाई रमेश जी, मंडी-प्रमाण की जांच में आपकी कच्ची पर्ची में पांच हजार सात सौ दस रुपये चालीस पैसे की गड़बड़ी पकड़ी गई है। "
                "बोली दो हजार छह सौ पचास रुपये प्रति क्विंटल पर हुई थी, लेकिन पर्ची में दो हजार पांच सौ अस्सी रुपये लिखा गया और अट्ठहत्तर किलो वजन करदा के नाम पर काटा गया। "
                "मध्य प्रदेश मंडी कानून की धारा बत्तीस के तहत एक हजार छह सौ सत्ताईस रुपये आड़त और दो सौ इक्यावन रुपये धर्मादा काटना गैर-कानूनी है। "
                "आपका सही भुगतान अड़सठ हजार चार सौ चौरासी रुपये बनता है।"
            ),
            multilingual_scripts={
                "hi-IN": (
                    "किसान भाई रमेश जी, मंडी-प्रमाण की जांच में आपकी कच्ची पर्ची में पांच हजार सात सौ दस रुपये की गड़बड़ी पकड़ी गई है। "
                    "बोली दो हजार छह सौ पचास रुपये प्रति क्विंटल पर हुई थी, लेकिन पर्ची में कम भाव लिखा गया और गैर-कानूनी आड़त व करदा काटा गया। "
                    "आपका सही कानूनी भुगतान अड़सठ हजार चार सौ चौरासी रुपये बनता है।"
                ),
                "mr-IN": (
                    "शेतकरी बांधव रमेश जी, मंडी-प्रमाणच्या तपासणीत तुमच्या कच्च्या पावतीमध्ये पाच हजार सातशे दहा रुपयांची तफावत आढळली आहे. "
                    "लिलावात दोन हजार सहाशे पन्नास रुपये प्रति क्विंटल भाव ठरला होता, परंतु पावतीत बेकायदेशीर आडत आणि घट कापली गेली आहे. "
                    "तुमची कायदेशीर देय रक्कम अडुसष्ट हजार चारशे चौऱ्याऐंशी रुपये आहे."
                ),
                "pa-IN": (
                    "ਕਿਸਾਨ ਵੀਰ ਰਮੇਸ਼ ਜੀ, ਮੰਡੀ-ਪ੍ਰਮਾਣ ਦੀ ਜਾਂਚ ਵਿੱਚ ਤੁਹਾਡੀ ਕੱਚੀ ਪਰਚੀ ਵਿੱਚ ਪੰਜ ਹਜ਼ਾਰ ਸੱਤ ਸੌ ਦਸ ਰੁਪਏ ਦੀ ਗੜਬੜੀ ਫੜੀ ਗਈ ਹੈ। "
                    "ਬੋਲੀ ਦੋ ਹਜ਼ਾਰ ਛੇ ਸੌ ਪੰਜਾਹ ਰੁਪਏ ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੋਈ ਸੀ, ਪਰ ਪਰਚੀ ਵਿੱਚ ਗੈਰ-ਕਾਨੂੰਨੀ ਆੜ੍ਹਤ ਅਤੇ ਵਜ਼ਨ ਕੱਟਿਆ ਗਿਆ ਹੈ। "
                    "ਤੁਹਾਡੀ ਸਹੀ ਕਾਨੂੰਨੀ ਰਕਮ ਅਠਾਹਠ ਹਜ਼ਾਰ ਚਾਰ ਸੌ ਚੌਰਾਸੀ ਰੁਪਏ ਬਣਦੀ ਹੈ।"
                ),
                "ta-IN": (
                    "விவசாயி ரமேஷ் அவர்களே, மண்டி-பிரமாண் ஆய்வில் உங்கள் ரசீதில் ஐந்தாயிரத்து எழுநூற்று பத்து ரூபாய் முறைகேடு கண்டறியப்பட்டுள்ளது. "
                    "ஏல விலையை விட குறைவாக எழுதப்பட்டு, சட்டவிரோத கமிஷன் பிடிக்கப்பட்டுள்ளது. "
                    "உங்களுக்கு சேர வேண்டிய சரியான தொகை அறுபத்து எட்டாயிரத்து நானூற்று எண்பத்து நான்கு ரூபாய் ஆகும்."
                ),
                "te-IN": (
                    "రైతు సోదరుడు రమేష్ గారు, మండీ-ప్రమాణ్ తనిఖీలో మీ రసీదులో ఐదు వేల ఏడు వందల పది రూపాయల తేడా బయటపడింది. "
                    "వేలం ధర కంటే తక్కువ రాసి, చట్టవిరుద్ధంగా ఆడత్ కమిషన్ మరియు తరుగు కట్ చేశారు. "
                    "మీకు రావాల్సిన సరైన మొత్తం అరవై ఎనిమిది వేల నాలుగు వందల ఎనభై నాలుగు రూపాయలు."
                ),
            },
        ),
    },
    "latur_soybean_msp": {
        "case_id": "latur_soybean_msp",
        "case_title": "Latur Mandi (MH) — Yellow Soybean MSP Violation & Weighbridge Shortfall",
        "badge_text": "₹21,583.00 MSP + Weight Fraud",
        "severity": "HIGH_ALERT_MSP_BREACH",
        "spoken_deal": SpokenAuctionDeal(
            farmer_name="संभाजी पाटील (Sambhaji Patil)",
            mandi_name="Latur APMC Market Yard, Gala #8 (MH)",
            state_code="MH",
            commodity_code="SOYBEAN_YELLOW",
            commodity_label="Yellow Soybean (पिवळे सोयाबीन)",
            bags=80,
            bag_weight_kg=50.0,
            agreed_net_weight_qtl=40.00,
            agreed_rate_per_qtl=4892.0,
            spoken_aadat_pct=0.0,
            authorized_hammali_inr=960.0,
            transcript=(
                "लातूर मंडी लिलाव पावती: शेतकरी संभाजी पाटील यांचे पिवळे सोयाबीन ८० पोती, "
                "निव्वळ वजन ४० क्विंटल. भाव हमीभावाप्रमाणे ४,८९२ रुपये क्विंटल फायनल झाला आहे. "
                "फक्त मजुरी ९६० रुपये वजा करा."
            ),
            language_code="mr-IN",
            timestamp_spans=[
                TimestampSpan(
                    field_id="weight_row",
                    start_sec=1.0,
                    end_sec=4.2,
                    time_label="00:01.0 - 00:04.2",
                    spoken_text="पिवळे सोयाबीन ८० पोती, निव्वळ वजन ४० क्विंटल",
                    extracted_claim="80 Bags = 40.00 Quintal Net Weight",
                ),
                TimestampSpan(
                    field_id="rate_row",
                    start_sec=4.3,
                    end_sec=8.1,
                    time_label="00:04.3 - 00:08.1",
                    spoken_text="भाव हमीभावाप्रमाणे ४,८९२ रुपये क्विंटल फायनल झाला आहे",
                    extracted_claim="Agreed MSP Rate: ₹4,892 / Quintal",
                ),
                TimestampSpan(
                    field_id="deductions_block",
                    start_sec=8.2,
                    end_sec=11.4,
                    time_label="00:08.2 - 00:11.4",
                    spoken_text="फक्त मजुरी ९६० रुपये वजा करा",
                    extracted_claim="Only ₹960 Authorized Hammali; 0% Commission/Muddat",
                ),
            ],
        ),
        "written_parchi": WrittenParchiExtraction(
            trader_firm="Mahavir Trading Co.",
            shop_no="Gala #8, Latur APMC Yard",
            license_no="MH-LAT-TR-••••-1109",
            slip_no="LT-2026-3910",
            slip_date="25-Oct-2026",
            recorded_bags=80,
            gross_weight_qtl=40.00,
            karda_moisture_cut_qtl=1.60,
            recorded_net_weight_qtl=38.40,
            written_rate_per_qtl=4650.0,
            gross_written_amount_inr=178560.00,
            deducted_aadat_pct=1.5,
            deducted_aadat_inr=2678.0,
            deducted_hammali_tulai_inr=960.0,
            deducted_dharmada_inr=0.0,
            deducted_muddat_inr=1785.0,
            written_net_payable_inr=173137.00,
            raw_ocr_markdown=(
                "### कच्ची पावती (KACCHA PARCHI) — Mahavir Trading Co., Latur\n"
                "- **शेतकरी:** संभाजी पाटील | **शेतमाल:** पिवळे सोयाबीन (80 पोती)\n"
                "- **एकूण वजन:** 40.00 Qtl | **बारदाना/कडता कपात (2 kg/पोते):** -1.60 Qtl -> **निव्वळ वजन:** 38.40 Qtl\n"
                "- **दर (Rate):** ₹4,650 / Qtl (Below MSP ₹4,892) | **एकूण रक्कम:** ₹1,78,560.00\n"
                "- **कपात:** आडत (1.5%): -₹2,678.00 | मुदत (Cash Cut 1%): -₹1,785.00 | हमाली: -₹960.00\n"
                "- **निव्वळ देय रक्कम (Net Payable):** ₹1,73,137.00"
            ),
            bounding_boxes=[
                BoundingBoxRegion(
                    field_id="trader_header",
                    label="Trader Header & Gala License",
                    extracted_text="Mahavir Trading Co., Gala #8 | Lic: MH-LAT-TR-2021-1109",
                    bbox=[0.06, 0.06, 0.94, 0.22],
                    status="COMPLIANT",
                ),
                BoundingBoxRegion(
                    field_id="weight_row",
                    label="Excess Bardana / Tare Deduction",
                    extracted_text="80 Bags | Gross: 40.00 Qtl | Tare Cut: -1.60 Qtl -> Net: 38.40 Qtl",
                    bbox=[0.06, 0.26, 0.94, 0.41],
                    status="CRITICAL_VIOLATION",
                    discrepancy_note="1.60 Qtl (160 kg) stolen via 2kg/bag Bardana cut (-₹7,827.20)",
                ),
                BoundingBoxRegion(
                    field_id="rate_row",
                    label="MSP Floor Breach & Rate Cut",
                    extracted_text="Written Rate: ₹4,650/Qtl (MSP & Spoken Bid: ₹4,892/Qtl)",
                    bbox=[0.06, 0.44, 0.94, 0.56],
                    status="MSP_BREACH",
                    discrepancy_note="₹242/Qtl below both spoken deal and statutory Soybean MSP (-₹9,292.80)",
                ),
                BoundingBoxRegion(
                    field_id="deductions_block",
                    label="Illegal Aadat & Muddat Cash Cut",
                    extracted_text="Aadat 1.5%: -₹2,678 | Muddat 1%: -₹1,785 | Hammali: -₹960",
                    bbox=[0.06, 0.59, 0.94, 0.76],
                    status="CRITICAL_VIOLATION",
                    discrepancy_note="Unlawful Aadat (₹2,678) + Muddat cash discount (₹1,785) = ₹4,463.00",
                ),
                BoundingBoxRegion(
                    field_id="net_payable_box",
                    label="Written Net Payable",
                    extracted_text="Slip Payable: ₹1,73,137.00 (Lawful Payable: ₹1,94,720.00)",
                    bbox=[0.06, 0.79, 0.94, 0.93],
                    status="CRITICAL_VIOLATION",
                    discrepancy_note="Total Farmer Shortfall: ₹21,583.00",
                ),
            ],
        ),
        "fallback_reasoning": ArbitrationReasoningOutput(
            executive_verdict_title="HIGH ALERT — MSP FLOOR BREACH & WEIGHBRIDGE THEFT: ₹21,583.00 Recoverable",
            legal_summary=(
                "Mahavir Trading Co. violated Maharashtra APMC Act Sec 30A & 31 across three vectors: "
                "(1) deducting 1.60 Quintals (160 kg) as excess Bardana/Karda worth ₹7,827.20, "
                "(2) writing ₹4,650/Qtl on the Kaccha Parchi despite a ₹4,892/Qtl MSP auction bid (₹9,292.80 loss), and "
                "(3) charging ₹2,678.00 seller Aadat plus ₹1,785.00 Muddat (cash payout discount)."
            ),
            statutory_notices=[
                "Maharashtra APMC Sec 30A Breach: Written rate ₹4,650/Qtl breaches both the auction hammer price and the 2026-27 Soybean MSP floor of ₹4,892/Qtl.",
                "Rule 32 Weighment Breach: 2 kg/bag deduction across 80 bags stole 1.60 Quintals (₹7,827.20).",
                "Sec 30A & 31 Breach: Seller Aadat (₹2,678) and 1% Muddat cash discount (₹1,785) are strictly illegal.",
            ],
            model_thinking_trace=(
                "1. Parsing Marathi Saaras v4 transcript: 80 bags = 40.00 Qtl Yellow Soybean @ MSP ₹4,892/Qtl, labor ₹960.\n"
                "2. Comparing against Sarvam Vision extraction of Slip #LT-2026-3910: Net weight written as 38.40 Qtl (-1.60 Qtl loss = ₹7,827.20).\n"
                "3. Rate written as ₹4,650/Qtl vs ₹4,892/Qtl MSP -> ₹242/Qtl shortfall on 38.40 Qtl = ₹9,292.80.\n"
                "4. Illegal deductions: Aadat ₹2,678 + Muddat ₹1,785 = ₹4,463.00.\n"
                "5. Lawful Net Payable = (40 * 4892) - 960 = ₹1,94,720.00. Written Net Payable = ₹1,73,137.00. Total Recovery = ₹21,583.00."
            ),
            farmer_spoken_summary_native=(
                "शेतकरी बांधव संभाजी पाटील, मंडी-प्रमाणच्या तपासणीत तुमच्या सोयाबीन पावतीमध्ये एकवीस हजार पाचशे त्र्याऐंशी रुपयांची फसवणूक उघडकीस आली आहे. "
                "हमीभाव चार हजार आठशे ब्याण्णव रुपये ठरला असताना पावतीवर चार हजार सहाशे पन्नास रुपये लिहिला आहे आणि एकशे साठ किलो वजन कापले आहे. "
                "महाराष्ट्र बाजार समिती कायद्यानुसार आडत आणि मुदत कपात बेकायदेशीर असून तुमची खरी देय रक्कम एक लाख चौऱ्याण्णव हजार सातशे वीस रुपये आहे."
            ),
            multilingual_scripts={
                "mr-IN": (
                    "शेतकरी बांधव संभाजी पाटील, मंडी-प्रमाणच्या तपासणीत तुमच्या सोयाबीन पावतीमध्ये एकवीस हजार पाचशे त्र्याऐंशी रुपयांची फसवणूक उघडकीस आली आहे. "
                    "हमीभाव चार हजार आठशे ब्याण्णव रुपये ठरला असताना पावतीवर कमी दर लिहिला आहे आणि एकशे साठ किलो वजन कापले आहे. "
                    "तुमची कायदेशीर देय रक्कम एक लाख चौऱ्याण्णव हजार सातशे वीस रुपये आहे."
                ),
                "hi-IN": (
                    "किसान भाई संभाजी पाटील, मंडी-प्रमाण की जांच में आपकी सोयाबीन पर्ची में इक्कीस हजार पांच सौ तिरासी रुपये की कटौती पकड़ी गई है। "
                    "पर्ची में एमएसपी चार हजार आठ सौ बानवे रुपये से कम भाव लिखा गया और एक सौ साठ किलो वजन काटा गया। "
                    "आपका सही कानूनी भुगतान एक लाख चौरानवे हजार सात सौ बीस रुपये बनता है।"
                ),
                "pa-IN": (
                    "ਕਿਸਾਨ ਵੀਰ ਸੰਭਾਜੀ ਪਾਟਿਲ, ਮੰਡੀ-ਪ੍ਰਮਾਣ ਦੀ ਜਾਂਚ ਵਿੱਚ ਤੁਹਾਡੀ ਸੋਇਆਬੀਨ ਪਰਚੀ ਵਿੱਚ ਇੱਕੀ ਹਜ਼ਾਰ ਪੰਜ ਸੌ ਤਿਰਾਸੀ ਰੁਪਏ ਦੀ ਗੜਬੜੀ ਫੜੀ ਗਈ ਹੈ। "
                    "ਐਮਐਸਪੀ ਤੋਂ ਘੱਟ ਰੇਟ ਲਿਖਿਆ ਗਿਆ ਅਤੇ ਇੱਕ ਸੌ ਸੱਠ ਕਿਲੋ ਵਜ਼ਨ ਕੱਟਿਆ ਗਿਆ। "
                    "ਤੁਹਾਡੀ ਸਹੀ ਕਾਨੂੰਨੀ ਰਕਮ ਇੱਕ ਲੱਖ ਚੌਰਾਨਵੇਂ ਹਜ਼ਾਰ ਸੱਤ ਸੌ ਵੀਹ ਰੁਪਏ ਬਣਦੀ ਹੈ।"
                ),
                "ta-IN": (
                    "விவசாயி சம்பாஜி பாட்டீல் அவர்களே, உங்கள் சோயாபீன் ரசீதில் இருபத்து ஓராயிரத்து ஐந்நூற்று எண்பத்து மூன்று ரூபாய் குறைவாக கணக்கிடப்பட்டுள்ளது. "
                    "உங்களுக்கு சேர வேண்டிய சரியான தொகை ஒரு லட்சத்து தொண்ணூற்று நான்காயிரத்து எழுநூற்று இருபது ரூபாய் ஆகும்."
                ),
                "te-IN": (
                    "రైతు సోదరుడు సంభాజీ పాటిల్ గారు, మీ సోయాబీన్ రసీదులో ఇరవై ఒక్క వేల ఐదు వందల ఎనభై మూడు రూపాయల తేడా బయటపడింది. "
                    "మీకు రావాల్సిన సరైన మొత్తం లక్ష తొంభై నాలుగు వేల ఏడు వందల ఇరవై రూపాయలు."
                ),
            },
        ),
    },
    "khanna_paddy_clean": {
        "case_id": "khanna_paddy_clean",
        "case_title": "Khanna Mandi (PB) — Clean Compliant Paddy PR-126 Auction",
        "badge_text": "100% Verified Compliant",
        "severity": "COMPLIANT",
        "spoken_deal": SpokenAuctionDeal(
            farmer_name="गुरप्रीत सिंह ढिल्लों (Gurpreet Singh Dhillon)",
            mandi_name="Khanna Grain Market, Shed #4 (PB)",
            state_code="PB",
            commodity_code="PADDY_PR126",
            commodity_label="Paddy PR-126 (धान PR-126)",
            bags=100,
            bag_weight_kg=50.0,
            agreed_net_weight_qtl=50.00,
            agreed_rate_per_qtl=2320.0,
            spoken_aadat_pct=0.0,
            authorized_hammali_inr=1050.0,
            transcript=(
                "खन्ना मंडी बोली: गुरप्रीत सिंह दा धान PR-126, १०० बोरी, ५० क्विंटल पक्का। "
                "सरकारी MSP २,३२० रुपये क्विंटल पूरा रेट। सिर्फ १,०५० रुपये सफाई ते उतराई मजदूरी लगेगी।"
            ),
            language_code="pa-IN",
            timestamp_spans=[
                TimestampSpan(
                    field_id="weight_row",
                    start_sec=1.1,
                    end_sec=4.4,
                    time_label="00:01.1 - 00:04.4",
                    spoken_text="गुरप्रीत सिंह दा धान PR-126, १०० बोरी, ५० क्विंटल पक्का",
                    extracted_claim="100 Bags = 50.00 Quintal Net Weight",
                ),
                TimestampSpan(
                    field_id="rate_row",
                    start_sec=4.5,
                    end_sec=7.6,
                    time_label="00:04.5 - 00:07.6",
                    spoken_text="सरकारी MSP २,३२० रुपये क्विंटल पूरा रेट",
                    extracted_claim="Full MSP Rate: ₹2,320 / Quintal",
                ),
                TimestampSpan(
                    field_id="deductions_block",
                    start_sec=7.7,
                    end_sec=10.8,
                    time_label="00:07.7 - 00:10.8",
                    spoken_text="सिर्फ १,०५० रुपये सफाई ते उतराई मजदूरी लगेगी",
                    extracted_claim="₹1,050 Authorized Labor; ₹0 Farmer Commission",
                ),
            ],
        ),
        "written_parchi": WrittenParchiExtraction(
            trader_firm="M/s Nanak Chand & Sons Commission Agents",
            shop_no="Shop #42, Khanna APMC",
            license_no="PB-KHA-JFM-••••-0311",
            slip_no="JF-2026-9920",
            slip_date="25-Oct-2026",
            recorded_bags=100,
            gross_weight_qtl=50.00,
            karda_moisture_cut_qtl=0.00,
            recorded_net_weight_qtl=50.00,
            written_rate_per_qtl=2320.0,
            gross_written_amount_inr=116000.00,
            deducted_aadat_pct=0.0,
            deducted_aadat_inr=0.0,
            deducted_hammali_tulai_inr=1050.0,
            deducted_dharmada_inr=0.0,
            deducted_muddat_inr=0.0,
            written_net_payable_inr=114950.00,
            raw_ocr_markdown=(
                "### J-FORM / पक्की पर्ची — M/s Nanak Chand & Sons, Khanna APMC\n"
                "- **किसान:** गुरप्रीत सिंह ढिल्लों | **फसल:** धान PR-126 (100 बोरी)\n"
                "- **तौल:** 50.00 Qtl (कमी/काट: 0.00 Qtl) | **MSP भाव:** ₹2,320 / Qtl\n"
                "- **कुल रकम:** ₹1,16,000.00 | **आड़त (किसान):** ₹0.00 | **सफाई/उतराई:** -₹1,050.00\n"
                "- **शुद्ध भुगतान (Net Payable):** ₹1,14,950.00"
            ),
            bounding_boxes=[
                BoundingBoxRegion(
                    field_id="trader_header",
                    label="Arhtia Header & J-Form License",
                    extracted_text="M/s Nanak Chand & Sons | Lic: PB-KHA-JFM-2018-0311",
                    bbox=[0.06, 0.06, 0.94, 0.22],
                    status="COMPLIANT",
                ),
                BoundingBoxRegion(
                    field_id="weight_row",
                    label="Verified Weighbridge Net Weight",
                    extracted_text="100 Bags | Gross: 50.00 Qtl | Karda Cut: 0.00 Qtl -> Net: 50.00 Qtl",
                    bbox=[0.06, 0.26, 0.94, 0.41],
                    status="COMPLIANT",
                ),
                BoundingBoxRegion(
                    field_id="rate_row",
                    label="MSP Compliant Rate",
                    extracted_text="Written Rate: ₹2,320/Qtl (Matches Spoken MSP Bid) | Gross: ₹1,16,000",
                    bbox=[0.06, 0.44, 0.94, 0.56],
                    status="COMPLIANT",
                ),
                BoundingBoxRegion(
                    field_id="deductions_block",
                    label="Authorized Cleaning & Unloading",
                    extracted_text="Farmer Aadat: ₹0 | Unloading/Cleaning: -₹1,050 (₹10.50/bag)",
                    bbox=[0.06, 0.59, 0.94, 0.76],
                    status="COMPLIANT",
                ),
                BoundingBoxRegion(
                    field_id="net_payable_box",
                    label="Verified Net Payout",
                    extracted_text="Net Payable: ₹1,14,950.00 (100% Statutory Match)",
                    bbox=[0.06, 0.79, 0.94, 0.93],
                    status="COMPLIANT",
                ),
            ],
        ),
        "fallback_reasoning": ArbitrationReasoningOutput(
            executive_verdict_title="VERIFIED COMPLIANT: 100% Match Under Punjab APMC Act & J-Form Rules",
            legal_summary=(
                "Spoken auction terms and written J-Form slip #JF-2026-9920 match with zero discrepancy. "
                "Full 50.00 Quintals of Paddy PR-126 are billed at the statutory MSP of ₹2,320/Qtl (₹1,16,000 gross), "
                "zero commission is deducted from the farmer, and ₹1,050 labor charges match the ₹10.50/bag statutory cap."
            ),
            statutory_notices=[
                "Punjab APMC Rule 24 Compliant: Full ₹2,320/Qtl MSP honored with 0% farmer commission.",
                "Weighment Bylaw 18 Compliant: Zero unauthorized moisture or Bardana deduction.",
                "ONDC / e-Mandi Credit Ready: Eligible for instant ₹91,960 (80% LTV) warehouse/settlement credit.",
            ],
            model_thinking_trace=(
                "1. Comparing Saaras v4 audio spans against Sarvam Vision J-Form #JF-2026-9920.\n"
                "2. Weight: 50.00 Qtl spoken vs 50.00 Qtl written (Delta = ₹0).\n"
                "3. Rate: ₹2,320/Qtl spoken vs ₹2,320/Qtl written (Matches Paddy MSP ₹2,320/Qtl).\n"
                "4. Deductions: ₹1,050 cleaning/unloading for 100 bags = ₹10.50/bag (within Punjab Mandi Board cap).\n"
                "5. Verdict: 100% COMPLIANT. Anchor Merkle root for instant settlement."
            ),
            farmer_spoken_summary_native=(
                "ਕਿਸਾਨ ਵੀਰ ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ ਜੀ, ਮੰਡੀ-ਪ੍ਰਮਾਣ ਦੀ ਜਾਂਚ ਵਿੱਚ ਤੁਹਾਡੀ ਖੰਨਾ ਮੰਡੀ ਦੀ ਪਰਚੀ ਸੌ ਫੀਸਦੀ ਸਹੀ ਪਾਈ ਗਈ ਹੈ। "
                "ਪੰਜਾਹ ਕੁਇੰਟਲ ਝੋਨੇ ਦਾ ਪੂਰਾ ਸਰਕਾਰੀ ਰੇਟ ਦੋ ਹਜ਼ਾਰ ਤਿੰਨ ਸੌ ਵੀਹ ਰੁਪਏ ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਲੱਗਿਆ ਹੈ ਅਤੇ ਕੋਈ ਗੈਰ-ਕਾਨੂੰਨੀ ਕਟੌਤੀ ਨਹੀਂ ਹੋਈ। "
                "ਤੁਹਾਡੀ ਇੱਕ ਲੱਖ ਚੌਦਾਂ ਹਜ਼ਾਰ ਨੌਂ ਸੌ ਪੰਜਾਹ ਰੁਪਏ ਦੀ ਪੂਰੀ ਰਕਮ ਤੁਰੰਤ ਭੁਗਤਾਨ ਲਈ ਪ੍ਰਮਾਣਿਤ ਹੈ।"
            ),
            multilingual_scripts={
                "pa-IN": (
                    "ਕਿਸਾਨ ਵੀਰ ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ ਜੀ, ਮੰਡੀ-ਪ੍ਰਮਾਣ ਦੀ ਜਾਂਚ ਵਿੱਚ ਤੁਹਾਡੀ ਖੰਨਾ ਮੰਡੀ ਦੀ ਪਰਚੀ ਸੌ ਫੀਸਦੀ ਸਹੀ ਪਾਈ ਗਈ ਹੈ। "
                    "ਪੰਜਾਹ ਕੁਇੰਟਲ ਝੋਨੇ ਦਾ ਪੂਰਾ ਸਰਕਾਰੀ ਰੇਟ ਦੋ ਹਜ਼ਾਰ ਤਿੰਨ ਸੌ ਵੀਹ ਰੁਪਏ ਲੱਗਿਆ ਹੈ। "
                    "ਤੁਹਾਡੀ ਇੱਕ ਲੱਖ ਚੌਦਾਂ ਹਜ਼ਾਰ ਨੌਂ ਸੌ ਪੰਜਾਹ ਰੁਪਏ ਦੀ ਪੂਰੀ ਰਕਮ ਤੁਰੰਤ ਭੁਗਤਾਨ ਲਈ ਪ੍ਰਮਾਣਿਤ ਹੈ।"
                ),
                "hi-IN": (
                    "किसान भाई गुरप्रीत सिंह जी, मंडी-प्रमाण की जांच में आपकी खन्ना मंडी की पर्ची सौ प्रतिशत सही और कानूनी पाई गई है। "
                    "पचास क्विंटल धान का पूरा सरकारी एमएसपी दो हजार तीन सौ बीस रुपये प्रति क्विंटल मिला है। "
                    "आपकी एक लाख चौदह हजार नौ सौ पचास रुपये की राशि तुरंत भुगतान के लिए प्रमाणित है।"
                ),
                "mr-IN": (
                    "शेतकरी बांधव गुरप्रीत सिंग जी, मंडी-प्रमाणच्या तपासणीत तुमची पावती शंभर टक्के अचूक आणि कायदेशीर आढळली आहे. "
                    "तुमची एक लाख चौदा हजार नऊशे पन्नास रुपयांची रक्कम तात्काळ पेमेंटसाठी प्रमाणित करण्यात आली आहे."
                ),
                "ta-IN": (
                    "விவசாயி குர்பிரீத் சிங் அவர்களே, மண்டி-பிரமாண் ஆய்வில் உங்கள் ரசீது நூறு சதவீதம் சரியாக உள்ளது. "
                    "உங்களுக்கு சேர வேண்டிய ஒரு லட்சத்து பதினான்காயிரத்து தொள்ளாயிரத்து ஐம்பது ரூபாய் உடனடி பட்டுவாடாவிற்கு சான்றளிக்கப்பட்டது."
                ),
                "te-IN": (
                    "రైతు సోదరుడు గుర్‌ప్రీత్ సింగ్ గారు, మండీ-ప్రమాణ్ తనిఖీలో మీ రసీదు నూరు శాతం సరిగ్గా ఉంది. "
                    "మీకు రావాల్సిన లక్ష పద్నాలుగు వేల తొమ్మిది వందల యాభై రూపాయలు తక్షణ చెల్లింపు కోసం ధృవీకరించబడింది."
                ),
            },
        ),
    },
}
