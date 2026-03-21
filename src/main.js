import { createGame } from "./game.js";
import { SelectionTracker } from "./selection.js";
import { createSpeaker } from "./tts.js";

const WORDS_PER_GAME = 4;
const KIDS_FIRST_100_WORDS = [
  "apple", "banana", "orange", "grape", "mango", "peach", "lemon", "melon", "berry", "pear",
  "cat", "dog", "bird", "fish", "frog", "duck", "lion", "tiger", "zebra", "horse",
  "cow", "goat", "sheep", "mouse", "rabbit", "monkey", "panda", "koala", "whale", "shark",
  "red", "blue", "green", "yellow", "gold", "purple", "pink", "brown", "black", "white",
  "sun", "moon", "star", "cloud", "rain", "snow", "wind", "storm", "sky", "light",
  "book", "pen", "pencil", "paper", "chair", "table", "clock", "phone", "bag", "shoe",
  "shirt", "pants", "socks", "hat", "coat", "dress", "bed", "door", "window", "house",
  "car", "bus", "train", "plane", "boat", "bike", "road", "park", "school", "store",
  "happy", "sad", "angry", "smile", "laugh", "jump", "run", "walk", "dance", "sing",
  "yes", "no", "hello", "thank", "please", "sorry", "water", "milk", "bread", "rice"
];

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
  const modeBtn = doc.querySelector("#mode-toggle-btn");
  const soundBtn = doc.querySelector("#sound-toggle-btn");
  const darkModeToggle = doc.querySelector("#dark-mode-toggle");
  const darkModeBtn = doc.querySelector("#dark-mode-btn");
  if (!gridEl || !wordListEl || !statusEl || !newGameBtn || !modeBtn || !soundBtn) {
    return null;
  }

  const speaker = createSpeaker();
  const selection = new SelectionTracker();
  let game = null;
  let isPointerDown = false;
  let isKidMode = true;

  function updateModeButton() {
    modeBtn.textContent = isKidMode ? "👶" : "💼";
    modeBtn.setAttribute("aria-label", isKidMode ? "Switch to adult mode" : "Switch to kid mode");
  }

  function renderWordList() {
    wordListEl.innerHTML = "";
    for (const word of game.words) {
      const item = doc.createElement("li");
      item.dataset.word = word;
      item.textContent = isKidMode ? word.toUpperCase() : "*".repeat(word.length);
      if (isKidMode) {
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
    const wordSet = pickRandomWords(KIDS_FIRST_100_WORDS, WORDS_PER_GAME);
    game = createGame(wordSet);
    renderGrid();
    renderWordList();
    statusEl.textContent = "Find the words below.";
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
    const result = game.evaluateSelection(selection.path);
    selection.reset();
    clearActiveTiles();
    if (!result.success) {
      statusEl.textContent = "Try again!";
      return;
    }
    markWordTiles(result.word);
    speaker.speakWord(result.word);
    renderWordList();
    statusEl.textContent = `Great! You found ${result.word.toUpperCase()}.`;
    if (game.isComplete()) statusEl.textContent = "Awesome! You found all words. 🌸🌼🌺 ❤️❤️ 🍦";
  }

  gridEl.addEventListener("pointerdown", (event) => {
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
    if (!isPointerDown) return;
    const cell = getCellFromPoint(event.clientX, event.clientY) ?? getCellFromTarget(event.target);
    if (!cell) return;
    selection.dragTo(cell);
    paintSelection();
  });

  gridEl.addEventListener("pointerup", () => {
    if (!isPointerDown) return;
    isPointerDown = false;
    finishSelection();
  });

  gridEl.addEventListener("pointercancel", () => {
    if (!isPointerDown) return;
    isPointerDown = false;
    finishSelection();
  });

  gridEl.addEventListener("pointerleave", () => {
    if (!isPointerDown) return;
    isPointerDown = false;
    finishSelection();
  });

  newGameBtn.addEventListener("click", startNewGame);
  modeBtn.addEventListener("click", () => {
    isKidMode = !isKidMode;
    updateModeButton();
    renderWordList();
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
  updateModeButton();
  return { startNewGame };
}

setupGame();
