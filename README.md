# Kids Word Square

Crossword-like square word game for children under 6 to learn English words.  
Players drag across visible letters to find up to 4 words, and correct words are spoken with text-to-speech.

## Run locally

```bash
npm install
python3 -m http.server 4173
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## Test (red/green TDD flow)

```bash
# run unit/integration tests
npm test

# run browser smoke test
npm run test:smoke

# run everything
npm run test:all
```

## Deploy to GitHub Pages

1. Push to `main`.
2. In GitHub, enable Pages with **GitHub Actions** as source.
3. Workflow `.github/workflows/pages.yml` tests and deploys the static site.
