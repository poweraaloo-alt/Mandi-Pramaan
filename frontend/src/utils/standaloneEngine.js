/**
 * Standalone Browser APMC Statutory Engine, Preset Cases, SHA-256 Merkle Tree Builder,
 * and Direct Sarvam AI Client so Mandi-Pramaan runs 100% serverless on GitHub Pages!
 */

export const STATE_APMC_RULES = {
  MP: {
    label: "Madhya Pradesh (MP APMC Act Sec 32 & 37)",
    act_name: "Madhya Pradesh Krishi Upaj Mandi Adhiniyam, 1972 (Sec 32 & 37)",
    max_farmer_aadat_pct: 0.0,
    max_hammali_tulai_per_bag: 8.0,
    aadat_clause:
      "MP APMC Act Sec 32(2): 0% commission (Aadat) deductible from farmer; 100% payable by buyer.",
    karda_clause:
      "MP APMC Act Sec 37(1): Arbitrary Karda/moisture weight deduction after open auction is unlawful.",
    dharmada_clause:
      "MP APMC Act Sec 37(3): Dharmada (charity cut) and Muddat deductions from farmer proceeds are prohibited.",
    rate_clause:
      "MP APMC Auction Rule 41: Final बोली (auction bid) recorded by Mandi clerk is binding on the buyer.",
  },
  MH: {
    label: "Maharashtra (MH APMC Act Sec 30A & 31)",
    act_name: "Maharashtra APMC (Development & Regulation) Act, 1963 (Sec 30A)",
    max_farmer_aadat_pct: 0.0,
    max_hammali_tulai_per_bag: 12.0,
    aadat_clause:
      "Maharashtra APMC Act Sec 30A: Commission (Aadat) on notified produce must be recovered strictly from buyer, never seller.",
    karda_clause:
      "Maharashtra APMC Rule 32: Excess Bardana/Sutli tare cut beyond standard gunny weight (0.7 kg) is an offense.",
    dharmada_clause:
      "Maharashtra APMC Sec 31: Muddat (cash discount) and Karda deductions from farmer bill are illegal.",
    rate_clause:
      "Maharashtra APMC Sec 30A & MSP Circular: Writing a rate below auction hammer price or statutory MSP is actionable.",
  },
  PB: {
    label: "Punjab (Punjab APMC Act & J-Form Rule 24)",
    act_name: "Punjab Agricultural Produce Markets Act, 1961 (Rule 24)",
    max_farmer_aadat_pct: 0.0,
    max_hammali_tulai_per_bag: 10.5,
    aadat_clause:
      "Punjab APMC Act Rule 24: Arhtia Dami (2.5%) is borne entirely by buyer/agency; ₹0 deductible from farmer.",
    karda_clause:
      "Punjab Mandi Board Weighment Bylaw 18: Electronic weighbridge net weight is final; manual Karda cut is prohibited.",
    dharmada_clause:
      "Punjab APMC Act Sec 23: Unauthorized charity/cash discounts on J-Form payouts are prohibited.",
    rate_clause:
      "Punjab APMC Auction Rule 24: J-Form rate must match the auction register and MSP floor.",
  },
};

export const MSP_FLOORS = {
  WHEAT_SHARBATI: 2425.0,
  SOYBEAN_YELLOW: 4892.0,
  PADDY_PR126: 2320.0,
};

export const PRESET_CASES = {
  sehore_wheat_fraud: {
    case_id: "sehore_wheat_fraud",
    short_title: "Sehore Mandi (MP) — Sharbati Wheat",
    case_title: "Sehore Mandi (MP) — Sharbati Wheat Over-Deduction & Rate Tampering",
    badge_text: "₹5,710.40 Underpaid",
    severity: "CRITICAL_FRAUD",
    spoken_deal: {
      farmer_name: "रमेश चंद्र पटेल (Ramesh Chandra Patel)",
      mandi_name: "Sehore Krishi Upaj Mandi, Gate #2 (MP)",
      state_code: "MP",
      commodity_code: "WHEAT_SHARBATI",
      commodity_label: "Sharbati Wheat (शरबती गेहूँ)",
      bags: 52,
      bag_weight_kg: 50.0,
      agreed_net_weight_qtl: 26.0,
      agreed_rate_per_qtl: 2650.0,
      spoken_aadat_pct: 0.0,
      authorized_hammali_inr: 416.0,
      transcript:
        "हाँ भाई, सीहोर मंडी गेट नंबर २, रमेश किसान का शरबती गेहूँ ५२ बोरी, पूरा २६ क्विंटल पक्का तौल। बोली फाइनल हुई २,६५० रुपये प्रति क्विंटल पर। किसान से कोई आड़त नहीं कटेगी, बस सरकारी हम्माली-तुलाई ४१६ रुपये लगेगी।",
      language_code: "hi-IN",
      timestamp_spans: [
        {
          field_id: "weight_row",
          time_label: "00:01.2 - 00:04.5",
          spoken_text: "शरबती गेहूँ ५२ बोरी, पूरा २६ क्विंटल पक्का तौल",
          extracted_claim: "52 Bags = 26.00 Quintal Net Weight (0% Moisture Cut)",
        },
        {
          field_id: "rate_row",
          time_label: "00:04.6 - 00:07.8",
          spoken_text: "बोली फाइनल हुई २,६५० रुपये प्रति क्विंटल पर",
          extracted_claim: "Hammer Price: ₹2,650 / Quintal",
        },
        {
          field_id: "deductions_block",
          time_label: "00:07.9 - 00:11.0",
          spoken_text: "किसान से कोई आड़त नहीं कटेगी, बस सरकारी हम्माली-तुलाई लगेगी",
          extracted_claim: "0% Farmer Aadat; Only ₹416 Authorized Hammali-Tulai",
        },
      ],
    },
    written_parchi: {
      trader_firm: "M/s Seth Laxminarayan & Sons",
      shop_no: "Shop #14, Block-B, Sehore APMC",
      license_no: "MP-SEH-AR-2019-0842",
      slip_no: "KP-2026-8841",
      slip_date: "25-Oct-2026",
      recorded_bags: 52,
      gross_weight_qtl: 26.0,
      karda_moisture_cut_qtl: 0.78,
      recorded_net_weight_qtl: 25.22,
      written_rate_per_qtl: 2580.0,
      gross_written_amount_inr: 65067.6,
      deducted_aadat_pct: 2.5,
      deducted_aadat_inr: 1627.0,
      deducted_hammali_tulai_inr: 416.0,
      deducted_dharmada_inr: 251.0,
      deducted_muddat_inr: 0.0,
      written_net_payable_inr: 62773.6,
      bounding_boxes: [
        {
          field_id: "trader_header",
          label: "Arthiya Header & License",
          extracted_text: "M/s Seth Laxminarayan & Sons | Lic: MP-SEH-AR-2019-0842",
          bbox: [0.06, 0.06, 0.94, 0.22],
          status: "COMPLIANT",
        },
        {
          field_id: "weight_row",
          label: "Weighment & Karda Cut",
          extracted_text: "52 Bags | Gross: 26.00 Qtl | Karda Cut: -0.78 Qtl → Net: 25.22 Qtl",
          bbox: [0.06, 0.26, 0.94, 0.41],
          status: "CRITICAL_VIOLATION",
          discrepancy_note: "Unlawful 0.78 Qtl (78 kg) Karda cut costing ₹2,067.00",
        },
        {
          field_id: "rate_row",
          label: "Written Rate vs Auction Bid",
          extracted_text: "Written Rate: ₹2,580/Qtl (Spoken Bid: ₹2,650/Qtl) | Gross: ₹65,067.60",
          bbox: [0.06, 0.44, 0.94, 0.56],
          status: "CRITICAL_VIOLATION",
          discrepancy_note: "Rate lowered by ₹70/Qtl below auction bid (-₹1,765.40)",
        },
        {
          field_id: "deductions_block",
          label: "Aadat, Hammali & Dharmada Cuts",
          extracted_text: "Aadat 2.5%: -₹1,627 | Hammali: -₹416 | Dharmada: -₹251",
          bbox: [0.06, 0.59, 0.94, 0.76],
          status: "CRITICAL_VIOLATION",
          discrepancy_note: "Illegal Seller Aadat (₹1,627) + Dharmada (₹251) under MP APMC Sec 32 & 37",
        },
        {
          field_id: "net_payable_box",
          label: "Net Payout Written on Slip",
          extracted_text: "Slip Net Payable: ₹62,773.60 (Lawful Payable: ₹68,484.00)",
          bbox: [0.06, 0.79, 0.94, 0.93],
          status: "CRITICAL_VIOLATION",
          discrepancy_note: "Farmer underpaid by ₹5,710.40",
        },
      ],
    },
    fallback_reasoning: {
      executive_verdict_title:
        "Farmer Underpaid by ₹5,710.40 — 3 Violations Under MP APMC Act Sec 32 & 37",
      legal_summary:
        "Comparing the spoken auction audio (Saaras v4) against the handwritten Kaccha Parchi (Sarvam Vision) shows three unlawful cuts by M/s Seth Laxminarayan & Sons: (1) an uncertified 0.78 Quintal 'Karda' weight cut (₹2,067.00 loss), (2) writing ₹2,580/Qtl instead of the ₹2,650/Qtl auction bid (₹1,765.40 loss), and (3) deducting 2.5% seller commission (₹1,627.00) and Dharmada charity cut (₹251.00) in violation of MP APMC Act Sections 32(2) and 37(3).",
      statutory_notices: [
        "Section 32(2) Breach: Commission (Aadat) of ₹1,627.00 must be collected from the buyer, never deducted from the farmer.",
        "Section 37(1) Breach: Deducting 1.5 kg/bag (0.78 Qtl = ₹2,067.00) as Karda after weighment is unlawful.",
        "Auction Rule 41 Breach: Written slip rate (₹2,580/Qtl) is ₹70/Qtl below the recorded auction bid (₹2,650/Qtl).",
      ],
      model_thinking_trace:
        "1. Audio span [00:01.2-00:04.5] confirms 52 bags = 26.00 Qtl net weight. Slip records 25.22 Qtl after 0.78 Qtl Karda cut → Loss = 0.78 × ₹2,650 = ₹2,067.00.\n2. Audio span [00:04.6-00:07.8] confirms ₹2,650/Qtl bid. Slip writes ₹2,580/Qtl → Loss on 25.22 Qtl = 25.22 × ₹70 = ₹1,765.40.\n3. MP APMC Act Sec 32 & 37 prohibit seller Aadat (₹1,627) and Dharmada (₹251). Hammali (₹416 = ₹8/bag) is legal.\n4. Total recovery due to farmer = ₹68,484.00 - ₹62,773.60 = ₹5,710.40.",
      farmer_spoken_summary_native:
        "किसान भाई रमेश जी, मंडी-प्रमाण की जांच में आपकी कच्ची पर्ची में पांच हजार सात सौ दस रुपये चालीस पैसे की गड़बड़ी पकड़ी गई है। बोली दो हजार छह सौ पचास रुपये प्रति क्विंटल पर हुई थी, लेकिन पर्ची में कम भाव लिखा गया और गैर-कानूनी आड़त व करदा काटा गया। आपका सही कानूनी भुगतान अड़सठ हजार चार सौ चौरासी रुपये बनता है।",
      multilingual_scripts: {
        "hi-IN":
          "किसान भाई रमेश जी, मंडी-प्रमाण की जांच में आपकी कच्ची पर्ची में पांच हजार सात सौ दस रुपये की गड़बड़ी पकड़ी गई है। बोली दो हजार छह सौ पचास रुपये प्रति क्विंटल पर हुई थी, लेकिन पर्ची में कम भाव लिखा गया और गैर-कानूनी आड़त व करदा काटा गया। आपका सही कानूनी भुगतान अड़सठ हजार चार सौ चौरासी रुपये बनता है।",
        "mr-IN":
          "शेतकरी बांधव रमेश जी, मंडी-प्रमाणच्या तपासणीत तुमच्या कच्च्या पावतीमध्ये पाच हजार सातशे दहा रुपयांची तफावत आढळली आहे. लिलावात दोन हजार सहाशे पन्नास रुपये प्रति क्विंटल भाव ठरला होता, परंतु पावतीत बेकायदेशीर आडत आणि घट कापली गेली आहे. तुमची कायदेशीर देय रक्कम अडुसष्ट हजार चारशे चौऱ्याऐंशी रुपये आहे.",
        "pa-IN":
          "ਕਿਸਾਨ ਵੀਰ ਰਮੇਸ਼ ਜੀ, ਮੰਡੀ-ਪ੍ਰਮਾਣ ਦੀ ਜਾਂਚ ਵਿੱਚ ਤੁਹਾਡੀ ਕੱਚੀ ਪਰਚੀ ਵਿੱਚ ਪੰਜ ਹਜ਼ਾਰ ਸੱਤ ਸੌ ਦਸ ਰੁਪਏ ਦੀ ਗੜਬੜੀ ਫੜੀ ਗਈ ਹੈ। ਬੋਲੀ ਦੋ ਹਜ਼ਾਰ ਛੇ ਸੌ ਪੰਜਾਹ ਰੁਪਏ ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੋਈ ਸੀ, ਪਰ ਪਰਚੀ ਵਿੱਚ ਗੈਰ-ਕਾਨੂੰਨੀ ਆੜ੍ਹਤ ਅਤੇ ਵਜ਼ਨ ਕੱਟਿਆ ਗਿਆ ਹੈ। ਤੁਹਾਡੀ ਸਹੀ ਕਾਨੂੰਨੀ ਰਕਮ ਅਠਾਹਠ ਹਜ਼ਾਰ ਚਾਰ ਸੌ ਚੌਰਾਸੀ ਰੁਪਏ ਬਣਦੀ ਹੈ।",
        "ta-IN":
          "விவசாயி ரமேஷ் அவர்களே, மண்டி-பிரமாண் ஆய்வில் உங்கள் ரசீதில் ஐந்தாயிரத்து எழுநூற்று பத்து ரூபாய் முறைகேடு கண்டறியப்பட்டுள்ளது. ஏல விலையை விட குறைவாக எழுதப்பட்டு, சட்டவிரோத கமிஷன் பிடிக்கப்பட்டுள்ளது. உங்களுக்கு சேர வேண்டிய சரியான தொகை அறுபத்து எட்டாயிரத்து நானூற்று எண்பத்து நான்கு ரூபாய் ஆகும்.",
        "te-IN":
          "రైతు సోదరుడు రమేష్ గారు, మండీ-ప్రమాణ్ తనిఖీలో మీ రసీదులో ఐదు వేల ఏడు వందల పది రూపాయల తేడా బయటపడింది. వేలం ధర కంటే తక్కువ రాసి, చట్టవిరుద్ధంగా ఆడత్ కమిషన్ మరియు తరుగు కట్ చేశారు. మీకు రావాల్సిన సరైన మొత్తం అరవై ఎనిమిది వేల నాలుగు వందల ఎనభై నాలుగు రూపాయలు.",
      },
    },
  },
  latur_soybean_msp: {
    case_id: "latur_soybean_msp",
    short_title: "Latur Mandi (MH) — Yellow Soybean",
    case_title: "Latur Mandi (MH) — Yellow Soybean MSP Violation & Weighbridge Shortfall",
    badge_text: "₹21,583.00 MSP Breach",
    severity: "HIGH_ALERT_MSP_BREACH",
    spoken_deal: {
      farmer_name: "संभाजी पाटील (Sambhaji Patil)",
      mandi_name: "Latur APMC Market Yard, Gala #8 (MH)",
      state_code: "MH",
      commodity_code: "SOYBEAN_YELLOW",
      commodity_label: "Yellow Soybean (पिवळे सोयाबीन)",
      bags: 80,
      bag_weight_kg: 50.0,
      agreed_net_weight_qtl: 40.0,
      agreed_rate_per_qtl: 4892.0,
      spoken_aadat_pct: 0.0,
      authorized_hammali_inr: 960.0,
      transcript:
        "लातूर मंडी लिलाव पावती: शेतकरी संभाजी पाटील यांचे पिवळे सोयाबीन ८० पोती, निव्वळ वजन ४० क्विंटल. भाव हमीभावाप्रमाणे ४,८९२ रुपये क्विंटल फायनल झाला आहे. फक्त मजुरी ९६० रुपये वजा करा.",
      language_code: "mr-IN",
      timestamp_spans: [
        {
          field_id: "weight_row",
          time_label: "00:01.0 - 00:04.2",
          spoken_text: "पिवळे सोयाबीन ८० पोती, निव्वळ वजन ४० क्विंटल",
          extracted_claim: "80 Bags = 40.00 Quintal Net Weight",
        },
        {
          field_id: "rate_row",
          time_label: "00:04.3 - 00:08.1",
          spoken_text: "भाव हमीभावाप्रमाणे ४,८९२ रुपये क्विंटल फायनल झाला आहे",
          extracted_claim: "Agreed MSP Rate: ₹4,892 / Quintal",
        },
        {
          field_id: "deductions_block",
          time_label: "00:08.2 - 00:11.4",
          spoken_text: "फक्त मजुरी ९६० रुपये वजा करा",
          extracted_claim: "Only ₹960 Authorized Hammali; 0% Commission/Muddat",
        },
      ],
    },
    written_parchi: {
      trader_firm: "Mahavir Trading Co.",
      shop_no: "Gala #8, Latur APMC Yard",
      license_no: "MH-LAT-TR-2021-1109",
      slip_no: "LT-2026-3910",
      slip_date: "25-Oct-2026",
      recorded_bags: 80,
      gross_weight_qtl: 40.0,
      karda_moisture_cut_qtl: 1.6,
      recorded_net_weight_qtl: 38.4,
      written_rate_per_qtl: 4650.0,
      gross_written_amount_inr: 178560.0,
      deducted_aadat_pct: 1.5,
      deducted_aadat_inr: 2678.0,
      deducted_hammali_tulai_inr: 960.0,
      deducted_dharmada_inr: 0.0,
      deducted_muddat_inr: 1785.0,
      written_net_payable_inr: 173137.0,
      bounding_boxes: [
        {
          field_id: "trader_header",
          label: "Trader Header & Gala License",
          extracted_text: "Mahavir Trading Co., Gala #8 | Lic: MH-LAT-TR-2021-1109",
          bbox: [0.06, 0.06, 0.94, 0.22],
          status: "COMPLIANT",
        },
        {
          field_id: "weight_row",
          label: "Excess Bardana / Tare Deduction",
          extracted_text: "80 Bags | Gross: 40.00 Qtl | Tare Cut: -1.60 Qtl → Net: 38.40 Qtl",
          bbox: [0.06, 0.26, 0.94, 0.41],
          status: "CRITICAL_VIOLATION",
          discrepancy_note: "1.60 Qtl (160 kg) stolen via 2kg/bag Bardana cut (-₹7,827.20)",
        },
        {
          field_id: "rate_row",
          label: "MSP Floor Breach & Rate Cut",
          extracted_text: "Written Rate: ₹4,650/Qtl (MSP & Spoken Bid: ₹4,892/Qtl)",
          bbox: [0.06, 0.44, 0.94, 0.56],
          status: "MSP_BREACH",
          discrepancy_note: "₹242/Qtl below both spoken deal and statutory Soybean MSP (-₹9,292.80)",
        },
        {
          field_id: "deductions_block",
          label: "Illegal Aadat & Muddat Cash Cut",
          extracted_text: "Aadat 1.5%: -₹2,678 | Muddat 1%: -₹1,785 | Hammali: -₹960",
          bbox: [0.06, 0.59, 0.94, 0.76],
          status: "CRITICAL_VIOLATION",
          discrepancy_note: "Unlawful Aadat (₹2,678) + Muddat cash discount (₹1,785) = ₹4,463.00",
        },
        {
          field_id: "net_payable_box",
          label: "Written Net Payable",
          extracted_text: "Slip Payable: ₹1,73,137.00 (Lawful Payable: ₹1,94,720.00)",
          bbox: [0.06, 0.79, 0.94, 0.93],
          status: "CRITICAL_VIOLATION",
          discrepancy_note: "Total Farmer Shortfall: ₹21,583.00",
        },
      ],
    },
    fallback_reasoning: {
      executive_verdict_title:
        "Farmer Underpaid by ₹21,583.00 — MSP Floor Breach & Weighbridge Theft",
      legal_summary:
        "Mahavir Trading Co. violated Maharashtra APMC Act Sec 30A & 31 across three areas: (1) deducting 1.60 Quintals (160 kg) as excess Bardana/Karda worth ₹7,827.20, (2) writing ₹4,650/Qtl on the slip despite a ₹4,892/Qtl MSP auction bid (₹9,292.80 loss), and (3) charging ₹2,678.00 seller Aadat plus ₹1,785.00 Muddat (cash payout discount).",
      statutory_notices: [
        "Maharashtra APMC Sec 30A Breach: Written rate ₹4,650/Qtl breaches both the auction bid and the Soybean MSP floor of ₹4,892/Qtl.",
        "Rule 32 Weighment Breach: 2 kg/bag deduction across 80 bags removed 1.60 Quintals (₹7,827.20).",
        "Sec 30A & 31 Breach: Seller Aadat (₹2,678) and 1% Muddat cash discount (₹1,785) are prohibited.",
      ],
      model_thinking_trace:
        "1. Spoken Marathi transcript: 80 bags = 40.00 Qtl Yellow Soybean @ MSP ₹4,892/Qtl, labor ₹960.\n2. Slip #LT-2026-3910 records net weight 38.40 Qtl (-1.60 Qtl = ₹7,827.20 loss).\n3. Rate written as ₹4,650/Qtl vs ₹4,892/Qtl MSP → ₹242/Qtl shortfall on 38.40 Qtl = ₹9,292.80.\n4. Illegal deductions: Aadat ₹2,678 + Muddat ₹1,785 = ₹4,463.00.\n5. Lawful Net Payable = ₹1,94,720.00 vs Written ₹1,73,137.00 → Recovery = ₹21,583.00.",
      farmer_spoken_summary_native:
        "शेतकरी बांधव संभाजी पाटील, मंडी-प्रमाणच्या तपासणीत तुमच्या सोयाबीन पावतीमध्ये एकवीस हजार पाचशे त्र्याऐंशी रुपयांची फसवणूक उघडकीस आली आहे. हमीभाव चार हजार आठशे ब्याण्णव रुपये ठरला असताना पावतीवर कमी दर लिहिला आहे आणि एकशे साठ किलो वजन कापले आहे. तुमची खरी देय रक्कम एक लाख चौऱ्याण्णव हजार सातशे वीस रुपये आहे.",
      multilingual_scripts: {
        "mr-IN":
          "शेतकरी बांधव संभाजी पाटील, मंडी-प्रमाणच्या तपासणीत तुमच्या सोयाबीन पावतीमध्ये एकवीस हजार पाचशे त्र्याऐंशी रुपयांची फसवणूक उघडकीस आली आहे. हमीभाव चार हजार आठशे ब्याण्णव रुपये ठरला असताना पावतीवर कमी दर लिहिला आहे आणि एकशे साठ किलो वजन कापले आहे. तुमची कायदेशीर देय रक्कम एक लाख चौऱ्याण्णव हजार सातशे वीस रुपये आहे.",
        "hi-IN":
          "किसान भाई संभाजी पाटील, मंडी-प्रमाण की जांच में आपकी सोयाबीन पर्ची में इक्कीस हजार पांच सौ तिरासी रुपये की कटौती पकड़ी गई है। पर्ची में एमएसपी चार हजार आठ सौ बानवे रुपये से कम भाव लिखा गया और एक सौ साठ किलो वजन काटा गया। आपका सही कानूनी भुगतान एक लाख चौरानवे हजार सात सौ बीस रुपये बनता है।",
        "pa-IN":
          "ਕਿਸਾਨ ਵੀਰ ਸੰਭਾਜੀ ਪਾਟਿਲ, ਮੰਡੀ-ਪ੍ਰਮਾਣ ਦੀ ਜਾਂਚ ਵਿੱਚ ਤੁਹਾਡੀ ਸੋਇਆਬੀਨ ਪਰਚੀ ਵਿੱਚ ਇੱਕੀ ਹਜ਼ਾਰ ਪੰਜ ਸੌ ਤਿਰਾਸੀ ਰੁਪਏ ਦੀ ਗੜਬੜੀ ਫੜੀ ਗਈ ਹੈ। ਐਮਐਸਪੀ ਤੋਂ ਘੱਟ ਰੇਟ ਲਿਖਿਆ ਗਿਆ ਅਤੇ ਇੱਕ ਸੌ ਸੱਠ ਕਿਲੋ ਵਜ਼ਨ ਕੱਟਿਆ ਗਿਆ। ਤੁਹਾਡੀ ਸਹੀ ਕਾਨੂੰਨੀ ਰਕਮ ਇੱਕ ਲੱਖ ਚੌਰਾਨਵੇਂ ਹਜ਼ਾਰ ਸੱਤ ਸੌ ਵੀਹ ਰੁਪਏ ਬਣਦੀ ਹੈ।",
        "ta-IN":
          "விவசாயி சம்பாஜி பாட்டீல் அவர்களே, உங்கள் சோயாபீன் ரசீதில் இருபத்து ஓராயிரத்து ஐந்நூற்று எண்பத்து மூன்று ரூபாய் குறைவாக கணக்கிடப்பட்டுள்ளது. உங்களுக்கு சேர வேண்டிய சரியான தொகை ஒரு லட்சத்து தொண்ணூற்று நான்காயிரத்து எழுநூற்று இருபது ரூபாய் ஆகும்.",
        "te-IN":
          "రైతు సోదరుడు సంభాజీ పాటిల్ గారు, మీ సోయాబీన్ రసీదులో ఇరవై ఒక్క వేల ఐదు వందల ఎనభై మూడు రూపాయల తేడా బయటపడింది. మీకు రావాల్సిన సరైన మొత్తం లక్ష తొంభై నాలుగు వేల ఏడు వందల ఇరవై రూపాయలు.",
      },
    },
  },
  khanna_paddy_clean: {
    case_id: "khanna_paddy_clean",
    short_title: "Khanna Mandi (PB) — Paddy PR-126",
    case_title: "Khanna Mandi (PB) — Clean Compliant Paddy PR-126 Auction",
    badge_text: "100% Compliant",
    severity: "COMPLIANT",
    spoken_deal: {
      farmer_name: "गुरप्रीत सिंह ढिल्लों (Gurpreet Singh Dhillon)",
      mandi_name: "Khanna Grain Market, Shed #4 (PB)",
      state_code: "PB",
      commodity_code: "PADDY_PR126",
      commodity_label: "Paddy PR-126 (धान PR-126)",
      bags: 100,
      bag_weight_kg: 50.0,
      agreed_net_weight_qtl: 50.0,
      agreed_rate_per_qtl: 2320.0,
      spoken_aadat_pct: 0.0,
      authorized_hammali_inr: 1050.0,
      transcript:
        "खन्ना मंडी बोली: गुरप्रीत सिंह दा धान PR-126, १०० बोरी, ५० क्विंटल पक्का। सरकारी MSP २,३२० रुपये क्विंटल पूरा रेट। सिर्फ १,०५० रुपये सफाई ते उतराई मजदूरी लगेगी।",
      language_code: "pa-IN",
      timestamp_spans: [
        {
          field_id: "weight_row",
          time_label: "00:01.1 - 00:04.4",
          spoken_text: "गुरप्रीत सिंह दा धान PR-126, १०० बोरी, ५० क्विंटल पक्का",
          extracted_claim: "100 Bags = 50.00 Quintal Net Weight",
        },
        {
          field_id: "rate_row",
          time_label: "00:04.5 - 00:07.6",
          spoken_text: "सरकारी MSP २,३२० रुपये क्विंटल पूरा रेट",
          extracted_claim: "Full MSP Rate: ₹2,320 / Quintal",
        },
        {
          field_id: "deductions_block",
          time_label: "00:07.7 - 00:10.8",
          spoken_text: "सिर्फ १,०५० रुपये सफाई ते उतराई मजदूरी लगेगी",
          extracted_claim: "₹1,050 Authorized Labor; ₹0 Farmer Commission",
        },
      ],
    },
    written_parchi: {
      trader_firm: "M/s Nanak Chand & Sons Commission Agents",
      shop_no: "Shop #42, Khanna APMC",
      license_no: "PB-KHA-JFM-2018-0311",
      slip_no: "JF-2026-9920",
      slip_date: "25-Oct-2026",
      recorded_bags: 100,
      gross_weight_qtl: 50.0,
      karda_moisture_cut_qtl: 0.0,
      recorded_net_weight_qtl: 50.0,
      written_rate_per_qtl: 2320.0,
      gross_written_amount_inr: 116000.0,
      deducted_aadat_pct: 0.0,
      deducted_aadat_inr: 0.0,
      deducted_hammali_tulai_inr: 1050.0,
      deducted_dharmada_inr: 0.0,
      deducted_muddat_inr: 0.0,
      written_net_payable_inr: 114950.0,
      bounding_boxes: [
        {
          field_id: "trader_header",
          label: "Arhtia Header & J-Form License",
          extracted_text: "M/s Nanak Chand & Sons | Lic: PB-KHA-JFM-2018-0311",
          bbox: [0.06, 0.06, 0.94, 0.22],
          status: "COMPLIANT",
        },
        {
          field_id: "weight_row",
          label: "Verified Weighbridge Net Weight",
          extracted_text: "100 Bags | Gross: 50.00 Qtl | Karda Cut: 0.00 Qtl → Net: 50.00 Qtl",
          bbox: [0.06, 0.26, 0.94, 0.41],
          status: "COMPLIANT",
        },
        {
          field_id: "rate_row",
          label: "MSP Compliant Rate",
          extracted_text: "Written Rate: ₹2,320/Qtl (Matches Spoken MSP Bid) | Gross: ₹1,16,000",
          bbox: [0.06, 0.44, 0.94, 0.56],
          status: "COMPLIANT",
        },
        {
          field_id: "deductions_block",
          label: "Authorized Cleaning & Unloading",
          extracted_text: "Farmer Aadat: ₹0 | Unloading/Cleaning: -₹1,050 (₹10.50/bag)",
          bbox: [0.06, 0.59, 0.94, 0.76],
          status: "COMPLIANT",
        },
        {
          field_id: "net_payable_box",
          label: "Verified Net Payout",
          extracted_text: "Net Payable: ₹1,14,950.00 (100% Statutory Match)",
          bbox: [0.06, 0.79, 0.94, 0.93],
          status: "COMPLIANT",
        },
      ],
    },
    fallback_reasoning: {
      executive_verdict_title:
        "Slip is 100% Compliant Under Punjab APMC Act & J-Form Rules",
      legal_summary:
        "Spoken auction terms and written J-Form slip #JF-2026-9920 match with zero discrepancy. Full 50.00 Quintals of Paddy PR-126 are billed at the statutory MSP of ₹2,320/Qtl (₹1,16,000 gross), zero commission is deducted from the farmer, and ₹1,050 labor charges match the ₹10.50/bag cap.",
      statutory_notices: [
        "Punjab APMC Rule 24 Compliant: Full ₹2,320/Qtl MSP honored with 0% farmer commission.",
        "Weighment Bylaw 18 Compliant: Zero unauthorized moisture or Bardana deduction.",
        "ONDC / e-Mandi Credit Ready: Eligible for instant ₹91,960 (80% LTV) warehouse/settlement credit.",
      ],
      model_thinking_trace:
        "1. Weight: 50.00 Qtl spoken vs 50.00 Qtl written (Delta = ₹0).\n2. Rate: ₹2,320/Qtl spoken vs ₹2,320/Qtl written (Matches Paddy MSP ₹2,320/Qtl).\n3. Deductions: ₹1,050 cleaning/unloading for 100 bags = ₹10.50/bag (within Punjab Mandi Board cap).\n4. Verdict: 100% COMPLIANT.",
      farmer_spoken_summary_native:
        "ਕਿਸਾਨ ਵੀਰ ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ ਜੀ, ਮੰਡੀ-ਪ੍ਰਮਾਣ ਦੀ ਜਾਂਚ ਵਿੱਚ ਤੁਹਾਡੀ ਖੰਨਾ ਮੰਡੀ ਦੀ ਪਰਚੀ ਸੌ ਫੀਸਦੀ ਸਹੀ ਪਾਈ ਗਈ ਹੈ। ਪੰਜਾਹ ਕੁਇੰਟਲ ਝੋਨੇ ਦਾ ਪੂਰਾ ਸਰਕਾਰੀ ਰੇਟ ਦੋ ਹਜ਼ਾਰ ਤਿੰਨ ਸੌ ਵੀਹ ਰੁਪਏ ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਲੱਗਿਆ ਹੈ ਅਤੇ ਕੋਈ ਗੈਰ-ਕਾਨੂੰਨੀ ਕਟੌਤੀ ਨਹੀਂ ਹੋਈ। ਤੁਹਾਡੀ ਇੱਕ ਲੱਖ ਚੌਦਾਂ ਹਜ਼ਾਰ ਨੌਂ ਸੌ ਪੰਜਾਹ ਰੁਪਏ ਦੀ ਪੂਰੀ ਰਕਮ ਤੁਰੰਤ ਭੁਗਤਾਨ ਲਈ ਪ੍ਰਮਾਣਿਤ ਹੈ।",
      multilingual_scripts: {
        "pa-IN":
          "ਕਿਸਾਨ ਵੀਰ ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ ਜੀ, ਮੰਡੀ-ਪ੍ਰਮਾਣ ਦੀ ਜਾਂਚ ਵਿੱਚ ਤੁਹਾਡੀ ਖੰਨਾ ਮੰਡੀ ਦੀ ਪਰਚੀ ਸੌ ਫੀਸਦੀ ਸਹੀ ਪਾਈ ਗਈ ਹੈ। ਪੰਜਾਹ ਕੁਇੰਟਲ ਝੋਨੇ ਦਾ ਪੂਰਾ ਸਰਕਾਰੀ ਰੇਟ ਦੋ ਹਜ਼ਾਰ ਤਿੰਨ ਸੌ ਵੀਹ ਰੁਪਏ ਲੱਗਿਆ ਹੈ। ਤੁਹਾਡੀ ਇੱਕ ਲੱਖ ਚੌਦਾਂ ਹਜ਼ਾਰ ਨੌਂ ਸੌ ਪੰਜਾਹ ਰੁਪਏ ਦੀ ਪੂਰੀ ਰਕਮ ਤੁਰੰਤ ਭੁਗਤਾਨ ਲਈ ਪ੍ਰਮਾਣਿਤ ਹੈ।",
        "hi-IN":
          "किसान भाई गुरप्रीत सिंह जी, मंडी-प्रमाण की जांच में आपकी खन्ना मंडी की पर्ची सौ प्रतिशत सही और कानूनी पाई गई है। पचास क्विंटल धान का पूरा सरकारी एमएसपी दो हजार तीन सौ बीस रुपये प्रति क्विंटल मिला है। आपकी एक लाख चौदह हजार नौ सौ पचास रुपये की राशि तुरंत भुगतान के लिए प्रमाणित है।",
        "mr-IN":
          "शेतकरी बांधव गुरप्रीत सिंग जी, मंडी-प्रमाणच्या तपासणीत तुमची पावती शंभर टक्के अचूक आणि कायदेशीर आढळली आहे. तुमची एक लाख चौदा हजार नऊशे पन्नास रुपयांची रक्कम तात्काळ पेमेंटसाठी प्रमाणित करण्यात आली आहे.",
        "ta-IN":
          "விவசாயி குர்பிரீத் சிங் அவர்களே, மண்டி-பிரமாண் ஆய்வில் உங்கள் ரசீது நூறு சதவீதம் சரியாக உள்ளது. உங்களுக்கு சேர வேண்டிய ஒரு லட்சத்து பதினான்காயிரத்து தொள்ளாயிரத்து ஐம்பது ரூபாய் உடனடி பட்டுவாடாவிற்கு சான்றளிக்கப்பட்டது.",
        "te-IN":
          "రైతు సోదరుడు గుర్‌ప్రీత్ సింగ్ గారు, మండీ-ప్రమాణ్ తనిఖీలో మీ రసీదు నూరు శాతం సరిగ్గా ఉంది. మీకు రావాల్సిన లక్ష పద్నాలుగు వేల తొమ్మిది వందల యాభై రూపాయలు తక్షణ చెల్లింపు కోసం ధృవీకరించబడింది.",
      },
    },
  },
};

export function formatINR(value, decimals = 2) {
  const num = Number(value || 0);
  return (
    "₹" +
    num.toLocaleString("en-IN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export function computeStatutoryAudit(spoken, written) {
  const stateCode = spoken.state_code in STATE_APMC_RULES ? spoken.state_code : "MP";
  const rules = STATE_APMC_RULES[stateCode];
  const mspFloor = MSP_FLOORS[spoken.commodity_code] || 2425.0;

  const expectedNetWeightQtl = Number(((spoken.bags * spoken.bag_weight_kg) / 100.0).toFixed(2));
  const weightShortfallQtl = Number(
    Math.max(0.0, expectedNetWeightQtl - written.recorded_net_weight_qtl).toFixed(2)
  );
  const weightLossInr = Number((weightShortfallQtl * spoken.agreed_rate_per_qtl).toFixed(2));

  const rateShortfallPerQtl = Number(
    Math.max(0.0, spoken.agreed_rate_per_qtl - written.written_rate_per_qtl).toFixed(2)
  );
  const rateLossInr = Number((written.recorded_net_weight_qtl * rateShortfallPerQtl).toFixed(2));

  const isBelowMsp = written.written_rate_per_qtl < mspFloor;
  const mspShortfallPerQtl = Number(Math.max(0.0, mspFloor - written.written_rate_per_qtl).toFixed(2));

  const statutoryMaxHammali = Number((spoken.bags * rules.max_hammali_tulai_per_bag).toFixed(2));
  const illegalAadatInr = Number(Math.max(0.0, written.deducted_aadat_inr).toFixed(2));
  const illegalDharmadaMuddatInr = Number(
    Math.max(0.0, written.deducted_dharmada_inr + written.deducted_muddat_inr).toFixed(2)
  );
  const excessHammaliInr = Number(
    Math.max(0.0, written.deducted_hammali_tulai_inr - statutoryMaxHammali).toFixed(2)
  );

  const lawfulGrossInr = Number((expectedNetWeightQtl * spoken.agreed_rate_per_qtl).toFixed(2));
  const lawfulHammaliDeduction = Math.min(written.deducted_hammali_tulai_inr, statutoryMaxHammali);
  const lawfulNetPayableInr = Number((lawfulGrossInr - lawfulHammaliDeduction).toFixed(2));
  const totalFarmerUnderpaymentInr = Number(
    Math.max(0.0, lawfulNetPayableInr - written.written_net_payable_inr).toFixed(2)
  );

  let violationCount = 0;
  const weightStatus = weightShortfallQtl > 0.001 ? "CRITICAL_VIOLATION" : "COMPLIANT";
  if (weightStatus !== "COMPLIANT") violationCount++;

  let rateStatus = "COMPLIANT";
  if (rateShortfallPerQtl > 0 && isBelowMsp) {
    rateStatus = "MSP_BREACH";
    violationCount++;
  } else if (rateShortfallPerQtl > 0) {
    rateStatus = "CRITICAL_VIOLATION";
    violationCount++;
  }

  const deductionDelta = Number(
    (illegalAadatInr + illegalDharmadaMuddatInr + excessHammaliInr).toFixed(2)
  );
  const deductionStatus = deductionDelta > 0 ? "CRITICAL_VIOLATION" : "COMPLIANT";
  if (deductionStatus !== "COMPLIANT") violationCount++;

  const netStatus = totalFarmerUnderpaymentInr > 0 ? "CRITICAL_VIOLATION" : "COMPLIANT";

  const deductionParts = [];
  if (written.deducted_aadat_inr > 0)
    deductionParts.push(`Aadat (${written.deducted_aadat_pct}%): -${formatINR(written.deducted_aadat_inr, 0)}`);
  if (written.deducted_dharmada_inr > 0)
    deductionParts.push(`Dharmada: -${formatINR(written.deducted_dharmada_inr, 0)}`);
  if (written.deducted_muddat_inr > 0)
    deductionParts.push(`Muddat: -${formatINR(written.deducted_muddat_inr, 0)}`);
  deductionParts.push(`Hammali/Tulai: -${formatINR(written.deducted_hammali_tulai_inr, 0)}`);

  const comparisonRows = [
    {
      field_id: "weight_row",
      parameter: "Net Weighment (तौल / वजन)",
      spoken_fact: `${spoken.bags} Bags = ${expectedNetWeightQtl.toFixed(2)} Qtl (Pakka Weighment)`,
      spoken_timestamp: spoken.timestamp_spans?.[0]?.time_label || "00:01.2 - 00:04.5",
      written_fact:
        written.karda_moisture_cut_qtl > 0
          ? `${written.recorded_net_weight_qtl.toFixed(2)} Qtl (Karda/Tare Cut: -${written.karda_moisture_cut_qtl.toFixed(2)} Qtl)`
          : `${written.recorded_net_weight_qtl.toFixed(2)} Qtl (0.00 Qtl Cut)`,
      delta_inr: weightLossInr,
      status: weightStatus,
      bylaw_citation: rules.karda_clause,
      legal_hypothesis:
        weightShortfallQtl > 0
          ? `Trader deducted ${written.karda_moisture_cut_qtl.toFixed(2)} Qtl (${(weightShortfallQtl * 100).toFixed(0)} kg) as uncertified Karda/Tare cut, costing the farmer ${formatINR(weightLossInr)}.`
          : "Recorded net weight matches electronic weighbridge and spoken auction lot.",
      enforcement_action:
        weightShortfallQtl > 0
          ? `Restore ${weightShortfallQtl.toFixed(2)} Qtl (+${formatINR(weightLossInr)}) under Weighment Bylaw.`
          : "Verified compliant.",
    },
    {
      field_id: "rate_row",
      parameter: "Auction Rate vs Slip (बोली दर / MSP)",
      spoken_fact: `${formatINR(spoken.agreed_rate_per_qtl, 0)} / Qtl (MSP Floor: ${formatINR(mspFloor, 0)})`,
      spoken_timestamp: spoken.timestamp_spans?.[1]?.time_label || "00:04.6 - 00:07.8",
      written_fact:
        `${formatINR(written.written_rate_per_qtl, 0)} / Qtl` +
        (rateShortfallPerQtl > 0 ? ` (-${formatINR(rateShortfallPerQtl, 0)}/Qtl Lowered)` : " (Exact Match)"),
      delta_inr: rateLossInr,
      status: rateStatus,
      bylaw_citation: rules.rate_clause,
      legal_hypothesis:
        rateShortfallPerQtl > 0
          ? `Slip rate lowered by ${formatINR(rateShortfallPerQtl, 0)}/Qtl below spoken auction bid` +
            (isBelowMsp ? ` and ${formatINR(mspShortfallPerQtl, 0)}/Qtl below statutory MSP (${formatINR(mspFloor, 0)}).` : ".")
          : `Slip rate matches spoken auction bid and satisfies MSP floor (${formatINR(mspFloor, 0)}/Qtl).`,
      enforcement_action:
        rateShortfallPerQtl > 0
          ? `Enforce auction bid rate ${formatINR(spoken.agreed_rate_per_qtl, 0)}/Qtl (+${formatINR(rateLossInr)}).`
          : "Verified compliant.",
    },
    {
      field_id: "deductions_block",
      parameter: "Mandi Deductions (आड़त / हम्माली / धर्मादा)",
      spoken_fact: `0% Farmer Aadat; Authorized Labor: ${formatINR(lawfulHammaliDeduction, 0)}`,
      spoken_timestamp: spoken.timestamp_spans?.[2]?.time_label || "00:07.9 - 00:11.0",
      written_fact: deductionParts.join(" | "),
      delta_inr: deductionDelta,
      status: deductionStatus,
      bylaw_citation: `${rules.aadat_clause} ${rules.dharmada_clause}`,
      legal_hypothesis:
        deductionDelta > 0
          ? `Unlawful deduction of ${formatINR(illegalAadatInr, 0)} seller commission (Aadat) and ${formatINR(illegalDharmadaMuddatInr, 0)} Dharmada/Muddat from farmer proceeds.`
          : `Zero commission charged to farmer; labor deduction ${formatINR(written.deducted_hammali_tulai_inr, 0)} is within statutory cap (${formatINR(statutoryMaxHammali, 0)}).`,
      enforcement_action:
        deductionDelta > 0
          ? `Refund ${formatINR(deductionDelta)} illegal deductions + issue notice to trader license ${written.license_no}.`
          : "Verified compliant.",
    },
    {
      field_id: "net_payable_box",
      parameter: "Net Farmer Payout (शुद्ध भुगतान राशि)",
      spoken_fact: `Lawful Net Payable: ${formatINR(lawfulNetPayableInr)}`,
      spoken_timestamp: "00:00.0 - 00:11.0",
      written_fact: `Slip Net Payable: ${formatINR(written.written_net_payable_inr)}`,
      delta_inr: totalFarmerUnderpaymentInr,
      status: netStatus,
      bylaw_citation: rules.act_name,
      legal_hypothesis:
        totalFarmerUnderpaymentInr > 0
          ? `Combined weighment cut, rate tampering, and illegal Aadat/Dharmada cuts resulted in a net underpayment of ${formatINR(totalFarmerUnderpaymentInr)}.`
          : "100% statutory match between spoken auction terms and written settlement slip.",
      enforcement_action:
        totalFarmerUnderpaymentInr > 0
          ? `Generate Mandi-Pramaan Recovery Order for ${formatINR(totalFarmerUnderpaymentInr)} before Gate Pass exit.`
          : "Approve instant e-Mandi / ONDC settlement & 80% pledge credit line.",
    },
  ];

  let overallVerdict = "COMPLIANT";
  if (totalFarmerUnderpaymentInr > 0 && isBelowMsp) overallVerdict = "HIGH_ALERT_MSP_BREACH";
  else if (totalFarmerUnderpaymentInr > 0) overallVerdict = "CRITICAL_FRAUD";

  return {
    state_code: stateCode,
    state_act_name: rules.act_name,
    msp_floor_per_qtl: mspFloor,
    is_below_msp: isBelowMsp,
    expected_net_weight_qtl: expectedNetWeightQtl,
    recorded_net_weight_qtl: written.recorded_net_weight_qtl,
    weight_shortfall_qtl: weightShortfallQtl,
    weight_loss_inr: weightLossInr,
    agreed_rate_per_qtl: spoken.agreed_rate_per_qtl,
    written_rate_per_qtl: written.written_rate_per_qtl,
    rate_loss_inr: rateLossInr,
    illegal_aadat_inr: illegalAadatInr,
    illegal_dharmada_muddat_inr: illegalDharmadaMuddatInr,
    lawful_net_payable_inr: lawfulNetPayableInr,
    written_net_payable_inr: written.written_net_payable_inr,
    total_farmer_underpayment_inr: totalFarmerUnderpaymentInr,
    violation_count: violationCount,
    overall_verdict: overallVerdict,
    comparison_rows: comparisonRows,
  };
}

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildBrowserMerkleAnchor(spoken, written, audit) {
  const l0 = await sha256Hex(JSON.stringify({ t: spoken.transcript, s: spoken.timestamp_spans }));
  const l1 = await sha256Hex(JSON.stringify({ slip: written.slip_no, lic: written.license_no, net: written.written_net_payable_inr }));
  const l2 = await sha256Hex(JSON.stringify({ spoken, written }));
  const l3 = await sha256Hex(JSON.stringify({ lawful: audit.lawful_net_payable_inr, underpaid: audit.total_farmer_underpayment_inr }));
  const n01 = await sha256Hex(l0 + l1);
  const n23 = await sha256Hex(l2 + l3);
  const rootHex = await sha256Hex(n01 + n23);
  const short = (h) => `0x${h.slice(0, 14)}...${h.slice(-8)}`;
  const nowIso = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const anchorId = `MANDI-ANCHOR-2026-${rootHex.slice(0, 8).toUpperCase()}`;
  const creditInr = Number((audit.lawful_net_payable_inr * 0.8).toFixed(0));

  const qrPayload = JSON.stringify(
    {
      protocol: "MANDI-PRAMAAN-V1",
      anchor_id: anchorId,
      merkle_root: `0x${rootHex}`,
      farmer: spoken.farmer_name,
      mandi: spoken.mandi_name,
      lawful_payable_inr: audit.lawful_net_payable_inr,
      slip_payable_inr: audit.written_net_payable_inr,
      recovery_due_inr: audit.total_farmer_underpayment_inr,
      verdict: audit.overall_verdict,
      credit_limit_80pct_inr: creditInr,
      timestamp: nowIso,
    },
    null,
    2
  );

  return {
    anchor_id: anchorId,
    timestamp_iso: nowIso,
    leaf_0_audio_hash: short(l0),
    leaf_1_vision_hash: short(l1),
    leaf_2_claims_hash: short(l2),
    leaf_3_verdict_hash: short(l3),
    node_01_hash: short(n01),
    node_23_hash: short(n23),
    merkle_root: `0x${rootHex}`,
    ondc_credit_eligible_inr: creditInr,
    qr_verification_payload: qrPayload,
  };
}
