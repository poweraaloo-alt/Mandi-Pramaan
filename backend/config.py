import os
from pathlib import Path
from typing import Dict

# Load .env from repo root or backend directory without failing if python-dotenv isn't installed
for candidate in [
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent / ".env",
]:
    if candidate.exists():
        for line in candidate.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip("'\""))

SARVAM_BASE_URL = "https://api.sarvam.ai"
SARVAM_STT_URL = f"{SARVAM_BASE_URL}/speech-to-text"
SARVAM_CHAT_URL = f"{SARVAM_BASE_URL}/v1/chat/completions"
SARVAM_TTS_URL = f"{SARVAM_BASE_URL}/text-to-speech"

SAARAS_MODEL = "saaras:v4"
SARVAM_LLM_MODEL = "sarvam-105b"
BULBUL_MODEL = "bulbul:v3"

SAARAS_MANDI_PROMPT = (
    "APMC Mandi, Kaccha Parchi, Quintal, Bori, Katta, Gehu, Sharbati, Soyabean, "
    "Paddy, PR-126, Aadat, Hammali, Tulai, Dharmada, Karda, Dami, Muddat, MSP"
)

BULBUL_SPEAKER_MAP: Dict[str, str] = {
    "hi-IN": "shubh",
    "mr-IN": "aditya",
    "pa-IN": "shubh",
    "ta-IN": "ritu",
    "te-IN": "aditya",
}


def get_api_key(override_key: str | None = None) -> str:
    if override_key and override_key.strip():
        return override_key.strip()
    return os.environ.get("SARVAM_API_KEY", "").strip()
