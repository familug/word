export function createSpeaker(
  synth = globalThis.speechSynthesis,
  utteranceFactory = (text) => new SpeechSynthesisUtterance(text)
) {
  let enabled = true;

  return {
    setEnabled(nextValue) {
      enabled = Boolean(nextValue);
    },
    isEnabled() {
      return enabled;
    },
    speakWord(word) {
      if (!enabled || !synth || typeof synth.speak !== "function") {
        return false;
      }
      const utterance = utteranceFactory(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      synth.cancel?.();
      synth.speak(utterance);
      return true;
    },
  };
}
