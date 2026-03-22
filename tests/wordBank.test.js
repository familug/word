import { describe, expect, test } from "vitest";
import { ADULT_POOL_SIZE, KID_POOL_SIZE, WORD_BANK, getWordPool } from "../src/wordBank.js";

describe("wordBank", () => {
  test("has 500 words and kid pool is first 200", () => {
    expect(WORD_BANK.length).toBe(ADULT_POOL_SIZE);
    expect(KID_POOL_SIZE).toBe(200);
    expect(getWordPool(true).length).toBe(200);
    expect(getWordPool(false).length).toBe(500);
  });
});
