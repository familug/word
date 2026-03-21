import { describe, expect, test } from "vitest";
import { validateWords } from "../src/words.js";

describe("validateWords", () => {
  test("accepts 1 to 4 words", () => {
    expect(validateWords(["cat"])).toEqual(["cat"]);
    expect(validateWords(["cat", "dog", "sun", "hat"])).toEqual(["cat", "dog", "sun", "hat"]);
    expect(validateWords(["am"])).toEqual(["am"]);
  });

  test("rejects more than 4 words", () => {
    expect(() => validateWords(["cat", "dog", "sun", "hat", "pen"])).toThrow("1 to 4 words");
  });

  test("normalizes and validates alphabetic words", () => {
    expect(validateWords([" Cat ", "DOG"])).toEqual(["cat", "dog"]);
    expect(() => validateWords(["c4t"])).toThrow("alphabetic");
    expect(() => validateWords(["i"])).toThrow("at least 2 letters");
  });
});
