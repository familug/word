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

  test("speakWordThen speaks second after first onend", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const utteranceFactory = (text) => {
      const u = { text };
      return u;
    };
    const speaker = createSpeaker({ speak, cancel }, utteranceFactory);

    speaker.speakWordThen("cat", "congratulation");

    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledOnce();
    const first = speak.mock.calls[0][0];
    expect(first.text).toBe("cat");
    expect(typeof first.onend).toBe("function");
    first.onend();
    expect(speak).toHaveBeenCalledTimes(2);
    expect(speak.mock.calls[1][0].text).toBe("congratulation");
  });
});
