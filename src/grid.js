function createEmptySquareGrid(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
}

function computeGridSize(words) {
  const longest = Math.max(...words.map((word) => word.length));
  return Math.max(longest, words.length + 1);
}

function fillEmptyCells(cells) {
  const fallback = "abcdefghijklmnopqrstuvwxyz";
  let index = 0;
  for (let row = 0; row < cells.length; row += 1) {
    for (let col = 0; col < cells[row].length; col += 1) {
      if (!cells[row][col]) {
        cells[row][col] = fallback[index % fallback.length];
        index += 1;
      }
    }
  }
}

const DIRECTIONS = [
  { row: 0, col: 1, name: "left-to-right" },
  { row: 0, col: -1, name: "right-to-left" },
  { row: 1, col: 0, name: "top-to-bottom" },
  { row: -1, col: 0, name: "bottom-to-top" },
  { row: 1, col: 1, name: "diag-down-right" },
  { row: 1, col: -1, name: "diag-down-left" },
  { row: -1, col: 1, name: "diag-up-right" },
  { row: -1, col: -1, name: "diag-up-left" },
];

function randomOrder(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isInBounds(size, row, col) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function canPlaceWord(cells, word, start, direction) {
  for (let index = 0; index < word.length; index += 1) {
    const row = start.row + direction.row * index;
    const col = start.col + direction.col * index;
    if (!isInBounds(cells.length, row, col)) {
      return false;
    }
    if (cells[row][col]) {
      return false;
    }
  }
  return true;
}

function placeWord(cells, word, start, direction) {
  for (let index = 0; index < word.length; index += 1) {
    const row = start.row + direction.row * index;
    const col = start.col + direction.col * index;
    cells[row][col] = word[index];
  }
}

function endPointFor(word, start, direction) {
  return {
    row: start.row + direction.row * (word.length - 1),
    col: start.col + direction.col * (word.length - 1),
  };
}

function allStartPoints(size) {
  const points = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      points.push({ row, col });
    }
  }
  return points;
}

export function createGridFromWords(words) {
  const minSize = computeGridSize(words);
  const maxAttemptsPerSize = 40;

  for (let size = minSize; size <= minSize + 3; size += 1) {
    for (let attempt = 0; attempt < maxAttemptsPerSize; attempt += 1) {
      const cells = createEmptySquareGrid(size);
      const placements = [];
      let success = true;
      const startPoints = allStartPoints(size);

      for (const word of randomOrder(words)) {
        let placed = false;
        const directions = randomOrder(DIRECTIONS);
        const starts = randomOrder(startPoints);

        for (const direction of directions) {
          for (const start of starts) {
            if (!canPlaceWord(cells, word, start, direction)) {
              continue;
            }
            placeWord(cells, word, start, direction);
            placements.push({
              word,
              start,
              end: endPointFor(word, start, direction),
              direction: direction.name,
            });
            placed = true;
            break;
          }
          if (placed) break;
        }

        if (!placed) {
          success = false;
          break;
        }
      }

      if (!success) {
        continue;
      }

      fillEmptyCells(cells);
      return { size, cells, placements };
    }
  }

  throw new Error("Unable to place all words in grid");
}
