/**
 * WebAudio Microphone Recorder & Base64 WAV Player + Browser Indic Speech Fallback
 */

export function playBase64AudioOrFallback(
  audioBase64,
  fallbackText,
  languageCode = "hi-IN",
  onStart = () => {},
  onEnd = () => {}
) {
  if (audioBase64) {
    try {
      const src = audioBase64.startsWith("data:")
        ? audioBase64
        : `data:audio/wav;base64,${audioBase64}`;
      const audio = new Audio(src);
      audio.onplay = onStart;
      audio.onended = onEnd;
      audio.onerror = () => speakWithBrowserFallback(fallbackText, languageCode, onStart, onEnd);
      audio.play().catch(() => speakWithBrowserFallback(fallbackText, languageCode, onStart, onEnd));
      return () => {
        audio.pause();
        audio.currentTime = 0;
        onEnd();
      };
    } catch {
      return speakWithBrowserFallback(fallbackText, languageCode, onStart, onEnd);
    }
  }
  return speakWithBrowserFallback(fallbackText, languageCode, onStart, onEnd);
}

export function speakWithBrowserFallback(
  text,
  languageCode = "hi-IN",
  onStart = () => {},
  onEnd = () => {}
) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onStart();
    const timer = setTimeout(onEnd, 2500);
    return () => clearTimeout(timer);
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = languageCode;
  utter.rate = 0.96;
  utter.onstart = onStart;
  utter.onend = onEnd;
  utter.onerror = onEnd;
  window.speechSynthesis.speak(utter);
  return () => {
    window.speechSynthesis.cancel();
    onEnd();
  };
}
