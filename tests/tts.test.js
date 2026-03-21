import { describe, expect, test, vi } from "vitest";
import { createSpeaker } from "../src/tts.js";

describe("tts", () => {
  test("speaks word with browser synth", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const utteranceFactory = (text) => ({ text });
    const speaker = createSpeaker({ speak, cancel }, utteranceFactory);

    speaker.speakWord("cat");

    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0][0].text).toBe("cat");
    expect(speak.mock.calls[0][0].lang).toBe("en-US");
  });

  test("no-op when disabled", () => {
    const speak = vi.fn();
    const speaker = createSpeaker({ speak }, (text) => ({ text }));
    speaker.setEnabled(false);
    expect(speaker.speakWord("dog")).toBe(false);
    expect(speak).not.toHaveBeenCalled();
  });
});
