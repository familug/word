import { beforeEach, describe, expect, test, vi } from "vitest";

function createDom() {
  document.body.innerHTML = `
    <input id="dark-mode-toggle" class="theme-toggle" type="checkbox" />
    <main class="app">
      <button id="new-game-btn" type="button">New Game</button>
      <button id="mode-toggle-btn" type="button">Kid</button>
      <button id="sound-toggle-btn" type="button" aria-pressed="true">Sound On</button>
      <label id="dark-mode-btn" for="dark-mode-toggle" class="toggle-btn">🌙</label>
      <p id="status"></p>
      <ul id="word-list"></ul>
      <div id="grid"></div>
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
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(darkModeBtn.textContent).toBe("🌙");
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(darkModeBtn.textContent).toBe("☀️");
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

  test("adult mode masks words and disables word-click tts", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    const speak = vi.fn();
    const cancel = vi.fn();
    globalThis.speechSynthesis = { speak, cancel };
    const { setupGame } = await import("../src/main.js");
    setupGame(document);

    const firstWordBeforeMask = document.querySelector("#word-list li").dataset.word;
    document.querySelector("#mode-toggle-btn").click();
    const wordItem = document.querySelector("#word-list li");
    expect(wordItem.textContent).toBe("*".repeat(firstWordBeforeMask.length));

    wordItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(speak).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });
});
