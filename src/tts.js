export function createSpeaker(
  synth = globalThis.speechSynthesis,
  utteranceFactory = (text) => new SpeechSynthesisUtterance(text)
) {
  let enabled = true;

  function configureUtterance(text) {
    const utterance = utteranceFactory(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    return utterance;
  }

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
      const utterance = configureUtterance(word);
      synth.cancel?.();
      synth.speak(utterance);
      return true;
    },
    /**
     * Speaks `first`, then `second` after the first utterance ends (no cancel between).
     * Use for completion: last found word, then "congratulation".
     */
    speakWordThen(first, second) {
      if (!enabled || !synth || typeof synth.speak !== "function") {
        return false;
      }
      synth.cancel?.();
      const firstUtterance = configureUtterance(first);
      if (second) {
        firstUtterance.onend = () => {
          if (!enabled || !synth || typeof synth.speak !== "function") {
            return;
          }
          const nextUtterance = configureUtterance(second);
          synth.speak(nextUtterance);
        };
      }
      synth.speak(firstUtterance);
      return true;
    },
  };
}
