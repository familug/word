import { createGame } from "./game.js";
import { SelectionTracker } from "./selection.js";
import { createSpeaker } from "./tts.js";
import { getWordPool } from "./wordBank.js";

const WORDS_PER_GAME = 4;
const TIMER_TICK_MS = 250;
const ONE_MINUTE_MS = 60_000;
const TWO_MINUTES_MS = 120_000;

function pickRandomWords(sourceWords, count) {
  const pool = [...sourceWords];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function setupGame(doc = document) {
  const gridEl = doc.querySelector("#grid");
  const wordListEl = doc.querySelector("#word-list");
  const statusEl = doc.querySelector("#status");
  const newGameBtn = doc.querySelector("#new-game-btn");
  const visibilityBtn = doc.querySelector("#word-visibility-btn");
  const difficultyBtn = doc.querySelector("#difficulty-toggle-btn");
  const timerToggleBtn = doc.querySelector("#timer-toggle-btn");
  const timerDisplayEl = doc.querySelector("#timer-display");
  const soundBtn = doc.querySelector("#sound-toggle-btn");
  const rewardStripEl = doc.querySelector("#reward-strip");
  const darkModeToggle = doc.querySelector("#dark-mode-toggle");
  const darkModeBtn = doc.querySelector("#dark-mode-btn");
  if (
    !gridEl ||
    !wordListEl ||
    !statusEl ||
    !newGameBtn ||
    !visibilityBtn ||
    !difficultyBtn ||
    !timerToggleBtn ||
    !timerDisplayEl ||
    !soundBtn ||
    !rewardStripEl
  ) {
    return null;
  }

  const speaker = createSpeaker();
  const selection = new SelectionTracker();
  let game = null;
  let isPointerDown = false;
  let wordsVisible = true;
  let isKidDifficulty = true;
  let isBoardLocked = false;
  let isTimerVisible = false;
  let timerStartMs = 0;
  let elapsedMs = 0;
  let timerIntervalId = null;

  function formatElapsed(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function updateTimerText() {
    timerDisplayEl.textContent = `Time: ${formatElapsed(elapsedMs)}`;
  }

  function updateTimerVisibility() {
    timerDisplayEl.classList.toggle("is-hidden", !isTimerVisible);
    timerToggleBtn.setAttribute("aria-label", isTimerVisible ? "Hide timer" : "Show timer");
  }

  function stopTimer() {
    if (timerIntervalId !== null) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
    if (timerStartMs) {
      elapsedMs = Date.now() - timerStartMs;
      updateTimerText();
    }
  }

  function startTimer() {
    stopTimer();
    elapsedMs = 0;
    timerStartMs = Date.now();
    updateTimerText();
    timerIntervalId = setInterval(() => {
      elapsedMs = Date.now() - timerStartMs;
      updateTimerText();
    }, TIMER_TICK_MS);
  }

  function renderRewards(durationMs) {
    rewardStripEl.innerHTML = "";
    const icons = [];
    if (durationMs < ONE_MINUTE_MS) {
      for (let i = 0; i < 20; i += 1) icons.push("💩");
    } else if (durationMs < TWO_MINUTES_MS) {
      for (let i = 0; i < 20; i += 1) icons.push("🍦");
    } else {
      for (let i = 0; i < 10; i += 1) {
        icons.push("🥦");
        icons.push("🍦");
      }
    }
    for (const icon of icons) {
      const span = doc.createElement("span");
      span.className = "reward-icon";
      span.textContent = icon;
      rewardStripEl.appendChild(span);
    }
  }

  function updateVisibilityButton() {
    visibilityBtn.textContent = wordsVisible ? "👁️" : "🙈";
    visibilityBtn.setAttribute("aria-label", wordsVisible ? "Hide words" : "Show words");
  }

  function updateDifficultyButton() {
    difficultyBtn.textContent = isKidDifficulty ? "👶" : "💼";
    difficultyBtn.setAttribute(
      "aria-label",
      isKidDifficulty ? "Switch to adult difficulty" : "Switch to kid difficulty"
    );
  }

  function renderWordList() {
    wordListEl.innerHTML = "";
    for (const word of game.words) {
      const item = doc.createElement("li");
      item.dataset.word = word;
      if (word.length >= 12) {
        item.classList.add("word-chip--xlong");
      } else if (word.length >= 10) {
        item.classList.add("word-chip--long");
      }
      item.textContent = wordsVisible ? word.toUpperCase() : "*".repeat(word.length);
      if (wordsVisible) {
        item.tabIndex = 0;
        item.setAttribute("role", "button");
        item.setAttribute("aria-label", `Speak word ${word.toUpperCase()}`);
        item.addEventListener("click", () => speaker.speakWord(word));
        item.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            speaker.speakWord(word);
          }
        });
      } else {
        item.removeAttribute("tabindex");
        item.setAttribute("role", "listitem");
        item.setAttribute("aria-label", "Hidden word");
      }
      if (game.foundWords.has(word)) item.classList.add("found");
      wordListEl.appendChild(item);
    }
  }

  function renderGrid() {
    const { size, cells } = game.grid;
    gridEl.innerHTML = "";
    gridEl.classList.toggle("grid--locked", isBoardLocked);
    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const btn = doc.createElement("button");
        btn.type = "button";
        btn.className = "tile";
        btn.dataset.row = String(row);
        btn.dataset.col = String(col);
        btn.setAttribute("role", "gridcell");
        btn.textContent = cells[row][col].toUpperCase();
        gridEl.appendChild(btn);
      }
    }
  }

  function startNewGame() {
    isBoardLocked = false;
    gridEl.classList.remove("grid--locked");
    rewardStripEl.innerHTML = "";
    const pool = getWordPool(isKidDifficulty);
    const wordSet = pickRandomWords(pool, WORDS_PER_GAME);
    game = createGame(wordSet);
    renderGrid();
    renderWordList();
    statusEl.textContent = "Find the words below.";
    startTimer();
  }

  function getCellFromTarget(target) {
    const tile = target.closest(".tile");
    return tile ? { row: Number(tile.dataset.row), col: Number(tile.dataset.col) } : null;
  }

  function getCellFromPoint(clientX, clientY) {
    if (typeof doc.elementFromPoint !== "function") {
      return null;
    }
    const element = doc.elementFromPoint(clientX, clientY);
    if (!element) {
      return null;
    }
    return getCellFromTarget(element);
  }

  function clearActiveTiles() {
    for (const tile of gridEl.querySelectorAll(".tile.active")) tile.classList.remove("active");
  }

  function paintSelection() {
    clearActiveTiles();
    for (const point of selection.path) {
      const tile = gridEl.querySelector(`.tile[data-row="${point.row}"][data-col="${point.col}"]`);
      tile?.classList.add("active");
    }
  }

  function markWordTiles(word) {
    const placement = game.grid.placements.find((item) => item.word === word);
    if (!placement) return;
    const rowStep = Math.sign(placement.end.row - placement.start.row);
    const colStep = Math.sign(placement.end.col - placement.start.col);
    const total = Math.max(
      Math.abs(placement.end.row - placement.start.row),
      Math.abs(placement.end.col - placement.start.col)
    );
    for (let step = 0; step <= total; step += 1) {
      const row = placement.start.row + rowStep * step;
      const col = placement.start.col + colStep * step;
      const tile = gridEl.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);
      tile?.classList.add("found");
    }
  }

  function finishSelection() {
    if (isBoardLocked) return;
    const result = game.evaluateSelection(selection.path);
    selection.reset();
    clearActiveTiles();
    if (!result.success) {
      statusEl.textContent = "Try again!";
      return;
    }
    markWordTiles(result.word);
    const complete = game.isComplete();
    if (complete) {
      isBoardLocked = true;
      gridEl.classList.add("grid--locked");
      stopTimer();
      isTimerVisible = true;
      updateTimerVisibility();
      renderRewards(elapsedMs);
      // Speak found word, then "congratulation" (chained; avoids cancel cutting off first).
      speaker.speakWordThen(result.word, "congratulation");
    } else {
      speaker.speakWord(result.word);
    }
    renderWordList();
    statusEl.textContent = complete
      ? `You found all words in ${formatElapsed(elapsedMs)}.`
      : `Great! You found ${result.word.toUpperCase()}.`;
  }

  gridEl.addEventListener("pointerdown", (event) => {
    if (isBoardLocked) return;
    const cell = getCellFromTarget(event.target);
    if (!cell) return;
    isPointerDown = true;
    if (typeof gridEl.setPointerCapture === "function") {
      gridEl.setPointerCapture(event.pointerId);
    }
    selection.start(cell);
    paintSelection();
  });

  gridEl.addEventListener("pointermove", (event) => {
    if (isBoardLocked || !isPointerDown) return;
    const cell = getCellFromPoint(event.clientX, event.clientY) ?? getCellFromTarget(event.target);
    if (!cell) return;
    selection.dragTo(cell);
    paintSelection();
  });

  gridEl.addEventListener("pointerup", () => {
    if (isBoardLocked || !isPointerDown) return;
    isPointerDown = false;
    finishSelection();
  });

  gridEl.addEventListener("pointercancel", () => {
    if (isBoardLocked || !isPointerDown) return;
    isPointerDown = false;
    finishSelection();
  });

  gridEl.addEventListener("pointerleave", () => {
    if (isBoardLocked || !isPointerDown) return;
    isPointerDown = false;
    finishSelection();
  });

  newGameBtn.addEventListener("click", startNewGame);
  visibilityBtn.addEventListener("click", () => {
    wordsVisible = !wordsVisible;
    updateVisibilityButton();
    renderWordList();
  });
  difficultyBtn.addEventListener("click", () => {
    isKidDifficulty = !isKidDifficulty;
    updateDifficultyButton();
    startNewGame();
  });
  timerToggleBtn.addEventListener("click", () => {
    isTimerVisible = !isTimerVisible;
    updateTimerVisibility();
  });
  soundBtn.addEventListener("click", () => {
    const next = !speaker.isEnabled();
    speaker.setEnabled(next);
    soundBtn.textContent = next ? "🔊" : "🔇";
    soundBtn.setAttribute("aria-label", next ? "Sound on" : "Sound off");
    soundBtn.setAttribute("aria-pressed", String(next));
  });

  if (darkModeToggle) {
    const applyTheme = () => {
      const isDark = darkModeToggle.checked;
      doc.documentElement.dataset.theme = isDark ? "dark" : "light";
      if (darkModeBtn) {
        darkModeBtn.textContent = isDark ? "☀️" : "🌙";
        darkModeBtn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      }
    };
    darkModeToggle.addEventListener("change", applyTheme);
    applyTheme();
  }

  startNewGame();
  updateVisibilityButton();
  updateDifficultyButton();
  updateTimerVisibility();
  return { startNewGame };
}

setupGame();
