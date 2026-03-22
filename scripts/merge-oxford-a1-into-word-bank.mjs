/**
 * Regenerates src/wordBank.js: keeps current WORD_BANK order, then appends
 * Oxford 3000 A1 headwords from oxford3000-a1.json that are not already present,
 * skipping multi-word entries, non a-z tokens, length < 2, and English stopwords.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const { WORD_BANK: existing } = await import(join(root, "src", "wordBank.js"));

const STOPWORDS = new Set(
  `a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just like me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves`
    .split(/\s+/)
    .filter(Boolean),
);

const oxford = JSON.parse(readFileSync(join(root, "oxford3000-a1.json"), "utf8"));
const seen = new Set(existing.map((w) => w.toLowerCase()));
const additions = [];

for (const raw of oxford.headwords) {
  const w = String(raw).toLowerCase().trim();
  if (!/^[a-z]{2,}$/.test(w)) continue;
  if (w.includes(" ")) continue;
  if (STOPWORDS.has(w)) continue;
  if (seen.has(w)) continue;
  seen.add(w);
  additions.push(w);
}

additions.sort((a, b) => a.localeCompare(b));
const merged = [...existing, ...additions];

function formatWordBankLines(words) {
  const lines = [];
  for (let i = 0; i < words.length; i += 10) {
    const chunk = words.slice(i, i + 10);
    lines.push(`  "${chunk.join('", "')}",`);
  }
  return lines.join("\n");
}

const out = `export const KID_POOL_SIZE = 200;
export const ADULT_POOL_SIZE = ${merged.length};
export const WORD_BANK = [
${formatWordBankLines(merged)}
];

/** Kid difficulty: words from the first KID_POOL_SIZE entries, at most this many letters. */
export const KID_MAX_WORD_LENGTH = 6;

export function getWordPool(isKidDifficulty) {
  if (isKidDifficulty) {
    return WORD_BANK.slice(0, KID_POOL_SIZE).filter((w) => w.length <= KID_MAX_WORD_LENGTH);
  }
  return WORD_BANK.slice(0, ADULT_POOL_SIZE);
}
`;

writeFileSync(join(root, "src", "wordBank.js"), out, "utf8");
console.log(`WORD_BANK: ${existing.length} kept + ${additions.length} added => ${merged.length} total`);
