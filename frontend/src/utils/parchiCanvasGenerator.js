/**
 * Procedural HTML5 Canvas generator for authentic Indian APMC Mandi "Kaccha Parchi" slips.
 * Coordinates of the 5 regions strictly align with the normalized bounding boxes [0.06..0.94]
 * returned by the Sarvam Vision hybrid pipeline:
 *  - trader_header:    y = 0.06 .. 0.22
 *  - weight_row:       y = 0.26 .. 0.41
 *  - rate_row:         y = 0.44 .. 0.56
 *  - deductions_block: y = 0.59 .. 0.76
 *  - net_payable_box:  y = 0.79 .. 0.93
 */
export function generateKacchaParchiDataUrl(writtenParchi, spokenDeal) {
  const canvas = document.createElement("canvas");
  const W = 720;
  const H = 920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 1. Aged yellow/pinkish Indian Mandi carbon-copy paper texture
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#fdf6d8");
  grad.addColorStop(0.5, "#faecc0");
  grad.addColorStop(1, "#f5e1a8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle paper grain specks & crease lines
  ctx.fillStyle = "rgba(120, 83, 40, 0.05)";
  for (let i = 0; i < 320; i++) {
    const x = (i * 197) % W;
    const y = (i * 353) % H;
    ctx.fillRect(x, y, 2, 2);
  }

  // Horizontal fold crease
  ctx.strokeStyle = "rgba(140, 100, 50, 0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.49);
  ctx.lineTo(W, H * 0.485);
  ctx.stroke();

  // Outer red bahi-khata border
  ctx.strokeStyle = "#b91c1c";
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // Helper for handwritten blue ballpoint pen look
  const drawHandwritten = (text, x, y, size = 21, color = "#1e3a8a", angleDeg = -0.6) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.font = `600 ${size}px "Noto Sans Devanagari", "Comic Sans MS", cursive, sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };

  // =========================================================================
  // REGION 1: TRADER HEADER (y: 0.06 .. 0.22 -> 55px .. 202px)
  // =========================================================================
  ctx.fillStyle = "#991b1b";
  ctx.font = "700 15px 'Noto Sans Devanagari', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("॥ श्री गणेशाय नमः ॥   कृषि उपज मंडी समिति - कच्ची पर्ची / तौल पावती", W / 2, 68);

  ctx.font = "800 26px 'Inter', sans-serif";
  ctx.fillStyle = "#7f1d1d";
  ctx.fillText(writtenParchi?.trader_firm || "M/s Seth Laxminarayan & Sons", W / 2, 104);

  ctx.font = "600 15px 'Inter', sans-serif";
  ctx.fillStyle = "#991b1b";
  ctx.fillText(
    `${writtenParchi?.shop_no || "Shop #14"}  |  Lic No: ${writtenParchi?.license_no || "MP-SEH-842"}`,
    W / 2,
    130
  );

  ctx.textAlign = "left";
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(36, 146);
  ctx.lineTo(W - 36, 146);
  ctx.stroke();

  ctx.fillStyle = "#7f1d1d";
  ctx.font = "600 15px 'Noto Sans Devanagari', sans-serif";
  ctx.fillText(`पर्ची क्र. (Slip): ${writtenParchi?.slip_no || "KP-8841"}`, 48, 174);
  ctx.fillText(`दिनांक: ${writtenParchi?.slip_date || "25-Oct-2026"}`, W - 240, 174);
  drawHandwritten(
    `किसान: ${spokenDeal?.farmer_name || "रमेश पटेल"}  |  जिन्स: ${spokenDeal?.commodity_label || "शरबती गेहूँ"}`,
    48,
    202,
    18,
    "#1e3a8a",
    -0.3
  );

  // Divider
  ctx.beginPath();
  ctx.moveTo(36, 220);
  ctx.lineTo(W - 36, 220);
  ctx.stroke();

  // =========================================================================
  // REGION 2: WEIGHT ROW (y: 0.26 .. 0.41 -> 239px .. 377px)
  // =========================================================================
  ctx.fillStyle = "#7f1d1d";
  ctx.font = "700 16px 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("१. तौल एवं बारदाना विवरण (WEIGHBRIDGE & KARDA RECORD):", 48, 258);

  drawHandwritten(
    `कुल बोरी (Bags): ${writtenParchi?.recorded_bags ?? 52} बोरी  ×  50 Kg  =  कुल वजन: ${(writtenParchi?.gross_weight_qtl ?? 26).toFixed(2)} Qtl`,
    54,
    292,
    19,
    "#1e3a8a"
  );

  const karda = Number(writtenParchi?.karda_moisture_cut_qtl || 0);
  drawHandwritten(
    karda > 0
      ? `(-) करदा / नमी-धूल काट (Karda Cut):  -${karda.toFixed(2)} Qtl  (अवैध कटौती)`
      : `(-) करदा / नमी काट (Karda Cut):  0.00 Qtl (कोई कटौती नहीं)`,
    54,
    326,
    19,
    karda > 0 ? "#b91c1c" : "#15803d",
    -0.8
  );

  drawHandwritten(
    `पक्का शुद्ध वजन (Recorded Net Weight):  ${(writtenParchi?.recorded_net_weight_qtl ?? 25.22).toFixed(2)} क्विंटल (Qtl)`,
    54,
    362,
    22,
    "#0f172a",
    -0.4
  );

  ctx.beginPath();
  ctx.moveTo(36, 386);
  ctx.lineTo(W - 36, 386);
  ctx.stroke();

  // =========================================================================
  // REGION 3: RATE ROW (y: 0.44 .. 0.56 -> 405px .. 515px)
  // =========================================================================
  ctx.fillStyle = "#7f1d1d";
  ctx.font = "700 16px 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("२. पर्ची में दर्ज भाव एवं कच्ची रकम (WRITTEN RATE & GROSS):", 48, 424);

  drawHandwritten(
    `लिखित भाव (Written Rate):  ₹ ${(writtenParchi?.written_rate_per_qtl ?? 2580).toLocaleString("en-IN")} / क्विंटल`,
    54,
    460,
    22,
    "#1e3a8a",
    -0.5
  );
  drawHandwritten(
    `कुल कच्ची रकम (Gross Amount):  ₹ ${(writtenParchi?.gross_written_amount_inr ?? 65067.6).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    54,
    498,
    20,
    "#0f172a",
    -0.3
  );

  ctx.beginPath();
  ctx.moveTo(36, 524);
  ctx.lineTo(W - 36, 524);
  ctx.stroke();

  // =========================================================================
  // REGION 4: DEDUCTIONS BLOCK (y: 0.59 .. 0.76 -> 543px .. 699px)
  // =========================================================================
  ctx.fillStyle = "#7f1d1d";
  ctx.font = "700 16px 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("३. मंडी कटौती विवरण (AADAT / HAMMALI / DHARMADA / MUDDAT):", 48, 562);

  const aadatInr = Number(writtenParchi?.deducted_aadat_inr || 0);
  const aadatPct = Number(writtenParchi?.deducted_aadat_pct || 0);
  const hammaliInr = Number(writtenParchi?.deducted_hammali_tulai_inr || 0);
  const dharmadaInr = Number(writtenParchi?.deducted_dharmada_inr || 0);
  const muddatInr = Number(writtenParchi?.deducted_muddat_inr || 0);

  drawHandwritten(
    `• आड़त कमीशन (Aadat @ ${aadatPct}%):   - ₹ ${aadatInr.toLocaleString("en-IN")}`,
    58,
    600,
    19,
    aadatInr > 0 ? "#b91c1c" : "#1e3a8a"
  );
  drawHandwritten(
    `• हम्माली एवं तुलाई (Labor & Weighing):   - ₹ ${hammaliInr.toLocaleString("en-IN")}`,
    58,
    636,
    19,
    "#1e3a8a"
  );
  drawHandwritten(
    `• धर्मादा / मुद्दत कटौती (Dharmada + Muddat):   - ₹ ${(dharmadaInr + muddatInr).toLocaleString("en-IN")}`,
    58,
    672,
    19,
    dharmadaInr + muddatInr > 0 ? "#b91c1c" : "#1e3a8a"
  );

  ctx.beginPath();
  ctx.moveTo(36, 708);
  ctx.lineTo(W - 36, 708);
  ctx.stroke();

  // =========================================================================
  // REGION 5: NET PAYABLE BOX (y: 0.79 .. 0.93 -> 726px .. 855px)
  // =========================================================================
  ctx.fillStyle = "rgba(185, 28, 28, 0.06)";
  ctx.fillRect(46, 732, W - 92, 118);
  ctx.strokeStyle = "#991b1b";
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 732, W - 92, 118);

  ctx.fillStyle = "#7f1d1d";
  ctx.font = "700 17px 'Noto Sans Devanagari', sans-serif";
  ctx.fillText("४. किसान को शुद्ध देय राशि (NET PAYABLE WRITTEN ON SLIP):", 62, 764);

  drawHandwritten(
    `₹ ${(writtenParchi?.written_net_payable_inr ?? 62773.6).toLocaleString("en-IN", { minimumFractionDigits: 2 })} /- केवल`,
    64,
    816,
    30,
    "#1e3a8a",
    -1.0
  );

  // Circular Purple APMC Rubber Stamp
  ctx.save();
  ctx.translate(W - 155, 790);
  ctx.rotate((-14 * Math.PI) / 180);
  ctx.strokeStyle = "rgba(109, 40, 217, 0.65)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(109, 40, 217, 0.7)";
  ctx.font = "700 10px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("APMC MANDI", 0, -16);
  ctx.fillText("VERIFIED STAMP", 0, 2);
  ctx.fillText("2026-27", 0, 18);
  ctx.restore();

  return canvas.toDataURL("image/png");
}
