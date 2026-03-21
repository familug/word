const MIN_WORDS = 1;
const MAX_WORDS = 4;
const MIN_WORD_LENGTH = 2;

export function normalizeWord(word) {
  return String(word).trim().toLowerCase();
}

export function validateWords(words) {
  if (!Array.isArray(words)) {
    throw new Error("Words must be an array.");
  }
  if (words.length < MIN_WORDS || words.length > MAX_WORDS) {
    throw new Error("Game must contain 1 to 4 words.");
  }

  const normalized = words.map(normalizeWord);
  for (const word of normalized) {
    if (!/^[a-z]+$/.test(word) || word.length < MIN_WORD_LENGTH) {
      throw new Error("Words must be alphabetic and at least 2 letters.");
    }
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error("Words must be unique.");
  }
  return normalized;
}
