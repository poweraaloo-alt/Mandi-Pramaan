# MANDI-PRAMAAN (मंडी-प्रमाण)
### Sovereign Multimodal APMC Agricultural Auction & *Kaccha Parchi* Arbitrator
**Powered by the Sarvam AI Sovereign Stack (`saaras:v4`, `Sarvam Vision`, `sarvam-105b`, `bulbul:v3`)**

---

## Overview

In Indian APMC agricultural markets (*Mandis*), open-outcry verbal auctions (*Boli*) are settled via handwritten weighbridge and commission agent slips (*Kaccha Parchi*). Farmers lose thousands of rupees per lot due to:
1. **Unlawful *Karda* / Moisture & Tare Weight Cuts** after the auction lot is weighed.
2. **Rate Shaving & MSP Violations** where the written rate on the *Kaccha Parchi* is lower than the spoken hammer bid or the statutory Minimum Support Price (MSP).
3. **Illegal Seller *Aadat* (Commission), *Dharmada* (Charity Cut), and *Muddat* (Cash Discount)** deducted from the farmer's payout despite State APMC Acts mandating 0% commission from sellers.

**Mandi-Pramaan** is a 4-stage multimodal arbitration workbench that cross-verifies spoken auction audio against handwritten *Kaccha Parchi* receipts, audits every rupee against State APMC statutory bylaws (Madhya Pradesh, Maharashtra, Punjab), speaks the audit verdict in 5 Indian languages via `bulbul:v3`, and anchors a SHA-256 Merkle receipt for instant grievance recovery and ONDC / e-Mandi pledge credit.

---

## 4-Stage Sovereign Pipeline

| Stage | Sarvam Model | Responsibility |
| :--- | :--- | :--- |
| **1. Spoken Boli ASR** | `saaras:v4` (`mode="codemix"`) | Transcribes code-mixed Hindi/Marathi/Punjabi auction audio with mandi keyterm boosting and timestamped claim spans. |
| **2. Kaccha Parchi VLM** | `Sarvam Vision` / Hybrid ROI | Extracts trader header, weighment, Karda cuts, written rates, and deductions with normalized SVG bounding boxes (`[x_min, y_min, x_max, y_max]`). |
| **3. Statutory Arbiter** | Deterministic APMC Engine + `sarvam-105b` | Computes exact rupee discrepancies in pure Python first, then invokes `sarvam-105b` for statutory legal hypotheses, APMC Act citations, and native Indic advisory generation. |
| **4. Voice Payout & Merkle Anchor** | `bulbul:v3` (24kHz) + SHA-256 Merkle Tree | Synthesizes natural spoken payout advisories in Hindi (`hi-IN`), Marathi (`mr-IN`), Punjabi (`pa-IN`), Tamil (`ta-IN`), and Telugu (`te-IN`), and signs a 4-leaf SHA-256 Merkle Root (`L0_AUDIO`, `L1_VISION`, `L2_CLAIMS`, `L3_VERDICT`). |

---

## Quick Start

### 1. Backend (FastAPI on Port `8000`)
```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend (Vite + React + Tailwind on Port `5173`)
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.
