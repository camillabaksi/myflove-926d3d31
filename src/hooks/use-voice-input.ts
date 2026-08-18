import { useEffect, useRef, useState } from "react";

// Thin wrapper around the browser SpeechRecognition API for quick single-shot
// voice capture (e.g. adding one shopping list item at a time). Falls back
// gracefully by reporting `isSupported: false` when unavailable so callers can
// hide the mic button and rely on the text input instead.
export function useVoiceInput(onResult: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as SpeechRecognitionWindow).SpeechRecognition ||
      (window as unknown as SpeechRecognitionWindow).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "sv-SE";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript && transcript.trim()) {
        onResultRef.current(transcript.trim());
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const toggleListening = () => (isListening ? stopListening() : startListening());

  return { isSupported, isListening, startListening, stopListening, toggleListening };
}
