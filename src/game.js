import { validateWords } from "./words.js";
import { createGridFromWords } from "./grid.js";

export function pathToWord(path, cells) {
  if (!path || path.length < 2) {
    return "";
  }
  return path
    .map(({ row, col }) => (cells[row] && cells[row][col] ? cells[row][col] : ""))
    .join("");
}

export function createGame(words) {
  const normalizedWords = validateWords(words);
  const grid = createGridFromWords(normalizedWords);
  const foundWords = new Set();

  return {
    words: normalizedWords,
    grid,
    foundWords,
    isComplete() {
      return foundWords.size === normalizedWords.length;
    },
    evaluateSelection(path) {
      const selected = pathToWord(path, grid.cells);
      if (!selected) {
        return { success: false, word: null };
      }
      const reversed = selected.split("").reverse().join("");
      const match = normalizedWords.find((word) => word === selected || word === reversed);
      if (!match || foundWords.has(match)) {
        return { success: false, word: null };
      }
      foundWords.add(match);
      return { success: true, word: match };
    },
  };
}
