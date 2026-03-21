import { describe, expect, test } from "vitest";
import { createGridFromWords } from "../src/grid.js";

describe("createGridFromWords", () => {
  test("returns a square grid sized for words", () => {
    const grid = createGridFromWords(["cat", "dog"]);
    expect(grid.size).toBeGreaterThanOrEqual(3);
    expect(grid.cells.length).toBe(grid.size);
    expect(grid.cells[0].length).toBe(grid.size);
  });

  test("places each word on a straight line placement", () => {
    const words = ["cat", "sun"];
    const grid = createGridFromWords(words);
    expect(grid.placements).toHaveLength(2);

    for (const placement of grid.placements) {
      const rowStep = Math.sign(placement.end.row - placement.start.row);
      const colStep = Math.sign(placement.end.col - placement.start.col);
      const letters = [];

      for (let i = 0; i < placement.word.length; i += 1) {
        const row = placement.start.row + rowStep * i;
        const col = placement.start.col + colStep * i;
        letters.push(grid.cells[row][col]);
      }

      expect(letters.join("")).toBe(placement.word);
      expect(words).toContain(placement.word);
    }
  });

  test("does not allow cells to be shared between words", () => {
    const words = ["apple", "grape", "mango", "peach"];
    const grid = createGridFromWords(words);
    const used = new Set();

    for (const placement of grid.placements) {
      const rowStep = Math.sign(placement.end.row - placement.start.row);
      const colStep = Math.sign(placement.end.col - placement.start.col);

      for (let i = 0; i < placement.word.length; i += 1) {
        const row = placement.start.row + rowStep * i;
        const col = placement.start.col + colStep * i;
        const key = `${row},${col}`;
        expect(used.has(key)).toBe(false);
        used.add(key);
      }
    }
  });
});
