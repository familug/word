import { describe, expect, test } from "vitest";
import { SelectionTracker, isAdjacent } from "../src/selection.js";

describe("selection", () => {
  test("validates adjacency", () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(true);
    expect(isAdjacent({ row: 0, col: 0 }, { row: 2, col: 2 })).toBe(false);
  });

  test("keeps one direction after second point", () => {
    const tracker = new SelectionTracker();
    tracker.start({ row: 0, col: 0 });
    expect(tracker.extend({ row: 0, col: 1 })).toBe(true);
    expect(tracker.extend({ row: 0, col: 2 })).toBe(true);
    expect(tracker.extend({ row: 1, col: 2 })).toBe(false);
  });

  test("resets selection", () => {
    const tracker = new SelectionTracker();
    tracker.start({ row: 0, col: 0 });
    tracker.extend({ row: 0, col: 1 });
    tracker.reset();
    expect(tracker.path).toHaveLength(0);
  });

  test("dragTo favors diagonal when both axes move", () => {
    const tracker = new SelectionTracker();
    tracker.start({ row: 0, col: 0 });
    tracker.dragTo({ row: 1, col: 2 });
    expect(tracker.path).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 1 },
    ]);
  });
});
