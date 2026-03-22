import { describe, expect, test } from "vitest";
import {
  ADULT_POOL_SIZE,
  KID_MAX_WORD_LENGTH,
  KID_POOL_SIZE,
  WORD_BANK,
  getWordPool,
} from "../src/wordBank.js";

describe("wordBank", () => {
  test("has 500 words; kid pool is subset of first 200 with max word length", () => {
    expect(WORD_BANK.length).toBe(ADULT_POOL_SIZE);
    expect(KID_POOL_SIZE).toBe(200);
    const kid = getWordPool(true);
    expect(kid.length).toBeGreaterThanOrEqual(4);
    expect(kid.every((w) => w.length <= KID_MAX_WORD_LENGTH && w.length >= 2)).toBe(true);
    expect(getWordPool(false).length).toBe(500);
  });
});
