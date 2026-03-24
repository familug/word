import { beforeEach, describe, expect, test, vi } from "vitest";

function createDom() {
  document.body.innerHTML = `
    <input id="dark-mode-toggle" class="theme-toggle" type="checkbox" checked />
    <main class="app">
      <button id="new-game-btn" type="button">New Game</button>
      <button id="word-visibility-btn" type="button">👁️</button>
      <button id="difficulty-toggle-btn" type="button">👶</button>
      <button id="timer-toggle-btn" type="button">⏱️</button>
      <button id="sound-toggle-btn" type="button" aria-pressed="true">Sound On</button>
      <label id="dark-mode-btn" for="dark-mode-toggle" class="toggle-btn">🌙</label>
      <p id="status"></p>
      <p id="timer-display" class="is-hidden">Time: 00:00</p>
      <ul id="word-list"></ul>
      <div id="grid"></div>
      <div id="reward-strip"></div>
    </main>
  `;
}

describe("ui", () => {
  beforeEach(() => {
    vi.resetModules();
    createDom();
    globalThis.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
      this.text = text;
    };
  });

  test("renders full word list and grid letters", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const { setupGame } = await import("../src/main.js");
    setupGame(document);

    expect(document.querySelectorAll("#word-list li")).toHaveLength(4);
    expect(document.querySelectorAll(".tile").length).toBeGreaterThan(0);
    randomSpy.mockRestore();
  });

  test("syncs document theme with dark mode toggle", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const { setupGame } = await import("../src/main.js");
    setupGame(document);

    const toggle = document.querySelector("#dark-mode-toggle");
    const darkModeBtn = document.querySelector("#dark-mode-btn");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(darkModeBtn.textContent).toBe("☀️");
    toggle.checked = false;
    toggle.dispatchEvent(new Event("change"));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(darkModeBtn.textContent).toBe("🌙");
    randomSpy.mockRestore();
  });

  test("clicking a word speaks it", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const speak = vi.fn();
    const cancel = vi.fn();
    globalThis.speechSynthesis = { speak, cancel };

    const { setupGame } = await import("../src/main.js");
    setupGame(document);

    const wordItem = document.querySelector("#word-list li");
    const word = wordItem.textContent.toLowerCase();
    wordItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledOnce();
    expect(speak.mock.calls[0][0].text).toBe(word);
    randomSpy.mockRestore();
  });

  test("hiding words masks list and disables word-click tts", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const speak = vi.fn();
    const cancel = vi.fn();
    globalThis.speechSynthesis = { speak, cancel };
    const { setupGame } = await import("../src/main.js");
    setupGame(document);

    const firstWordBeforeMask = document.querySelector("#word-list li").dataset.word;
    document.querySelector("#word-visibility-btn").click();
    const wordItem = document.querySelector("#word-list li");
    expect(wordItem.textContent).toBe("*".repeat(firstWordBeforeMask.length));

    wordItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(speak).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  test("renders full text for long words in list items", async () => {
    vi.doMock("../src/wordBank.js", async () => {
      const actual = await vi.importActual("../src/wordBank.js");
      return {
        ...actual,
        getWordPool: () => ["watermelonxx", "strawberryzz", "pineappleabc", "blackberryzz"]
      };
    });

    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const { setupGame } = await import("../src/main.js");
    setupGame(document);

    const renderedWords = [...document.querySelectorAll("#word-list li")].map((item) => item.textContent);
    expect(renderedWords).toContain("WATERMELONXX");
    expect(renderedWords).toContain("STRAWBERRYZZ");
    expect(renderedWords).toContain("PINEAPPLEABC");
    expect(renderedWords).toContain("BLACKBERRYZZ");
    const longWordChips = [...document.querySelectorAll("#word-list li")];
    expect(longWordChips.every((chip) => chip.classList.contains("word-chip--xlong"))).toBe(true);

    document.querySelector("#word-visibility-btn").click();
    const maskedWords = [...document.querySelectorAll("#word-list li")].map((item) => item.textContent);
    expect(maskedWords).toContain("************");

    randomSpy.mockRestore();
    vi.doUnmock("../src/wordBank.js");
  });

  test("timer is hidden by default and toggles on click", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const { setupGame } = await import("../src/main.js");
    setupGame(document);

    const timerDisplay = document.querySelector("#timer-display");
    const timerBtn = document.querySelector("#timer-toggle-btn");
    expect(timerDisplay.classList.contains("is-hidden")).toBe(true);

    timerBtn.click();
    expect(timerDisplay.classList.contains("is-hidden")).toBe(false);

    timerBtn.click();
    expect(timerDisplay.classList.contains("is-hidden")).toBe(true);
    randomSpy.mockRestore();
  });

  test("completion shows elapsed time and under-one-minute rewards", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T00:00:00.000Z"));
    vi.doMock("../src/game.js", () => ({
      createGame: () => ({
        words: ["apple"],
        foundWords: new Set(),
        grid: {
          size: 1,
          cells: [["a"]],
          placements: [{ word: "apple", start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }]
        },
        evaluateSelection: () => ({ success: true, word: "apple" }),
        isComplete: () => true
      })
    }));

    const { setupGame } = await import("../src/main.js");
    setupGame(document);
    vi.advanceTimersByTime(45_000);

    const tile = document.querySelector(".tile");
    tile.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    tile.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));

    const status = document.querySelector("#status").textContent;
    const rewardIcons = document.querySelectorAll("#reward-strip .reward-icon");
    expect(status).toContain("00:45");
    expect(rewardIcons).toHaveLength(20);
    expect([...rewardIcons].every((icon) => icon.textContent === "💩")).toBe(true);
    expect(document.querySelector("#timer-display").classList.contains("is-hidden")).toBe(false);

    vi.doUnmock("../src/game.js");
    vi.useRealTimers();
  });

  test("completion between one and two minutes shows ice cream rewards", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T00:00:00.000Z"));
    vi.doMock("../src/game.js", () => ({
      createGame: () => ({
        words: ["apple"],
        foundWords: new Set(),
        grid: {
          size: 1,
          cells: [["a"]],
          placements: [{ word: "apple", start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }]
        },
        evaluateSelection: () => ({ success: true, word: "apple" }),
        isComplete: () => true
      })
    }));

    const { setupGame } = await import("../src/main.js");
    setupGame(document);
    vi.advanceTimersByTime(75_000);

    const tile = document.querySelector(".tile");
    tile.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    document.querySelector("#grid").dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));

    const rewardIcons = document.querySelectorAll("#reward-strip .reward-icon");
    expect(rewardIcons).toHaveLength(20);
    expect([...rewardIcons].every((icon) => icon.textContent === "🍦")).toBe(true);

    vi.doUnmock("../src/game.js");
    vi.useRealTimers();
  });

  test("completion at or above two minutes shows mixed broccoli and ice cream rewards", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T00:00:00.000Z"));
    vi.doMock("../src/game.js", () => ({
      createGame: () => ({
        words: ["apple"],
        foundWords: new Set(),
        grid: {
          size: 1,
          cells: [["a"]],
          placements: [{ word: "apple", start: { row: 0, col: 0 }, end: { row: 0, col: 0 } }]
        },
        evaluateSelection: () => ({ success: true, word: "apple" }),
        isComplete: () => true
      })
    }));

    const { setupGame } = await import("../src/main.js");
    setupGame(document);
    vi.advanceTimersByTime(130_000);

    const tile = document.querySelector(".tile");
    tile.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    document.querySelector("#grid").dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));

    const rewardIcons = [...document.querySelectorAll("#reward-strip .reward-icon")].map((n) => n.textContent);
    expect(rewardIcons).toHaveLength(20);
    expect(rewardIcons.filter((icon) => icon === "🥦")).toHaveLength(10);
    expect(rewardIcons.filter((icon) => icon === "🍦")).toHaveLength(10);

    vi.doUnmock("../src/game.js");
    vi.useRealTimers();
  });
});
