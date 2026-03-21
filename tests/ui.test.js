import { beforeEach, describe, expect, test, vi } from "vitest";

function createDom() {
  document.body.innerHTML = `
    <input id="dark-mode-toggle" class="theme-toggle" type="checkbox" />
    <main class="app">
      <button id="new-game-btn" type="button">New Game</button>
      <button id="sound-toggle-btn" type="button" aria-pressed="true">Sound On</button>
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
    expect(document.documentElement.dataset.theme).toBe("light");
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    expect(document.documentElement.dataset.theme).toBe("dark");
    randomSpy.mockRestore();
  });
});
