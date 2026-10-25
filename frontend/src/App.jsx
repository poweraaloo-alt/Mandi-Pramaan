import React, { useCallback, useEffect, useState } from "react";
import TopTelemetryBar from "./components/TopTelemetryBar";
import MultimodalInputDock from "./components/MultimodalInputDock";
import EvidenceInspector from "./components/EvidenceInspector";
import ArbitrationMatrix from "./components/ArbitrationMatrix";
import TrustAnchorDock from "./components/TrustAnchorDock";
import { generateKacchaParchiDataUrl } from "./utils/parchiCanvasGenerator";

export default function App() {
  const [activePresetId, setActivePresetId] = useState("sehore_wheat_fraud");
  const [stateCode, setStateCode] = useState("MP");
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("MANDI_SARVAM_API_KEY") || ""
  );
  const [arbitrationData, setArbitrationData] = useState(null);
  const [spokenDeal, setSpokenDeal] = useState(null);
  const [writtenParchi, setWrittenParchi] = useState(null);
  const [parchiImageUrl, setParchiImageUrl] = useState("");
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem("MANDI_SARVAM_API_KEY", newKey);
    } else {
      localStorage.removeItem("MANDI_SARVAM_API_KEY");
    }
  };

  const executeArbitration = useCallback(
    async ({
      presetId = activePresetId,
      overrideStateCode = null,
      spokenOverride = null,
      writtenOverride = null,
      customImageUrl = null,
    } = {}) => {
      setIsRunning(true);
      try {
        const headers = { "Content-Type": "application/json" };
        if (apiKey) {
          headers["X-Sarvam-Api-Key"] = apiKey;
        }

        // Generate procedural handwritten slip canvas so backend hashes exact image bytes
        let imgUrl = customImageUrl;
        if (!imgUrl && writtenOverride && spokenOverride) {
          imgUrl = generateKacchaParchiDataUrl(writtenOverride, spokenOverride);
        }

        const resp = await fetch("/api/arbitrate", {
          method: "POST",
          headers,
          body: JSON.stringify({
            preset_id: presetId,
            state_code: overrideStateCode,
            spoken_override: spokenOverride,
            written_override: writtenOverride,
            parchi_image_base64: imgUrl || null,
            tts_language_code: spokenOverride?.language_code || "hi-IN",
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          setArbitrationData(data);
          setSpokenDeal(data.spoken_deal);
          setWrittenParchi(data.written_parchi);
          setStateCode(data.spoken_deal.state_code);
          const renderedSlip =
            customImageUrl ||
            generateKacchaParchiDataUrl(data.written_parchi, data.spoken_deal);
          setParchiImageUrl(renderedSlip);
        }
      } catch (err) {
        console.error("Arbitration request failed:", err);
      } finally {
        setIsRunning(false);
      }
    },
    [activePresetId, apiKey]
  );

  // Initial load on mount
  useEffect(() => {
    executeArbitration({ presetId: "sehore_wheat_fraud" });
  }, []);

  const handleSelectPreset = (presetId) => {
    setActivePresetId(presetId);
    executeArbitration({
      presetId,
      overrideStateCode: null,
      spokenOverride: null,
      writtenOverride: null,
    });
  };

  const handleStateChange = (newStateCode) => {
    setStateCode(newStateCode);
    const updatedSpoken = spokenDeal ? { ...spokenDeal, state_code: newStateCode } : null;
    executeArbitration({
      presetId: activePresetId,
      overrideStateCode: newStateCode,
      spokenOverride: updatedSpoken,
      writtenOverride: writtenParchi,
    });
  };

  const handleUpdateSpokenAndWritten = (newSpoken, newWritten) => {
    setSpokenDeal(newSpoken);
    setWrittenParchi(newWritten);
    const updatedCanvas = generateKacchaParchiDataUrl(newWritten, newSpoken);
    setParchiImageUrl(updatedCanvas);
  };

  const handleCustomImageUpload = (dataUrl) => {
    setParchiImageUrl(dataUrl);
    executeArbitration({
      presetId: activePresetId,
      overrideStateCode: stateCode,
      spokenOverride: spokenDeal,
      writtenOverride: writtenParchi,
      customImageUrl: dataUrl,
    });
  };

  const handleSynthesizeTts = async (text, languageCode, speaker) => {
    try {
      const headers = { "Content-Type": "application/json" };
      if (apiKey) headers["X-Sarvam-Api-Key"] = apiKey;
      const resp = await fetch("/api/tts", {
        method: "POST",
        headers,
        body: JSON.stringify({ text, language_code: languageCode, speaker }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.audio_base64;
      }
    } catch {
      return null;
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <TopTelemetryBar
        telemetry={arbitrationData?.telemetry}
        stateCode={stateCode}
        onStateChange={handleStateChange}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        isRunning={isRunning}
      />

      {/* 4-Panel Command Workbench Grid */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Left Column (5 cols on XL): Panel 1 (Capture/Presets) + Panel 2 (Evidence Inspector) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <MultimodalInputDock
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
            spokenDeal={spokenDeal}
            writtenParchi={writtenParchi}
            onUpdateSpokenAndWritten={handleUpdateSpokenAndWritten}
            onRunArbitration={() =>
              executeArbitration({
                presetId: activePresetId,
                overrideStateCode: stateCode,
                spokenOverride: spokenDeal,
                writtenOverride: writtenParchi,
              })
            }
            onCustomImageUpload={handleCustomImageUpload}
            isRunning={isRunning}
          />

          <EvidenceInspector
            parchiImageUrl={parchiImageUrl}
            spokenDeal={spokenDeal}
            writtenParchi={writtenParchi}
            activeFieldId={activeFieldId}
            onHoverField={setActiveFieldId}
          />
        </div>

        {/* Right Column (7 cols on XL): Panel 3 (Arbitration Matrix) + Panel 4 (Trust Anchor & Bulbul TTS) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <ArbitrationMatrix
            statutoryAudit={arbitrationData?.statutory_audit}
            aiReasoning={arbitrationData?.ai_reasoning}
            activeFieldId={activeFieldId}
            onHoverField={setActiveFieldId}
          />

          <TrustAnchorDock
            aiReasoning={arbitrationData?.ai_reasoning}
            merkleAnchor={arbitrationData?.merkle_anchor}
            spokenDeal={spokenDeal}
            writtenParchi={writtenParchi}
            statutoryAudit={arbitrationData?.statutory_audit}
            initialAudioBase64={arbitrationData?.tts_audio_base64}
            initialLanguageCode={arbitrationData?.tts_language_code}
            onSynthesizeTts={handleSynthesizeTts}
          />
        </div>
      </main>
    </div>
  );
}
