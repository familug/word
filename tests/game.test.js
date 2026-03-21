import { describe, expect, test } from "vitest";
import { createGame, pathToWord } from "../src/game.js";

describe("game", () => {
  test("converts path to selected word", () => {
    const cells = [
      ["c", "a", "t"],
      ["x", "y", "z"],
      ["d", "o", "g"],
    ];
    const word = pathToWord(
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ],
      cells
    );
    expect(word).toBe("cat");
  });

  test("accepts valid selection and rejects duplicates", () => {
    const game = createGame(["cat", "dog"]);
    const placement = game.grid.placements.find((item) => item.word === "cat");
    const rowStep = Math.sign(placement.end.row - placement.start.row);
    const colStep = Math.sign(placement.end.col - placement.start.col);
    const path = Array.from({ length: placement.word.length }, (_, i) => ({
      row: placement.start.row + rowStep * i,
      col: placement.start.col + colStep * i,
    }));

    const success = game.evaluateSelection(path);
    expect(success).toEqual({ success: true, word: "cat" });

    const duplicate = game.evaluateSelection(path);
    expect(duplicate.success).toBe(false);
  });

  test("accepts reversed path for placed word", () => {
    const game = createGame(["cat"]);
    const placement = game.grid.placements[0];
    const rowStep = Math.sign(placement.end.row - placement.start.row);
    const colStep = Math.sign(placement.end.col - placement.start.col);
    const path = Array.from({ length: placement.word.length }, (_, i) => ({
      row: placement.end.row - rowStep * i,
      col: placement.end.col - colStep * i,
    }));
    expect(game.evaluateSelection(path)).toEqual({ success: true, word: "cat" });
  });
});
