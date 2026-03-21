# AGENTS

This file captures project knowledge and working agreements for future coding sessions.

## Project Overview

- App: mobile-friendly kids word-search game.
- Stack: vanilla HTML/CSS/JS with Vitest and Playwright.
- Goal: touch-first gameplay, simple UI, reliable behavior on mobile.

## Core Gameplay Rules

- Words are placed in random straight directions:
  - left-to-right, right-to-left
  - top-to-bottom, bottom-to-top
  - diagonals (all four)
- Words must not overlap.
- A letter cell belongs to only one word.
- Selection can be matched forward or reverse (swipe either direction).

## Input / Interaction Behavior

- Swipe selection is pointer-based and optimized for touch.
- Selection updates by snapping from start cell to a straight line.
- Diagonal intent is favored when both row and column movement are present.
- Pointer capture/cancel handling is enabled for robust mobile dragging.
- Letter tiles and page text selection are disabled (`user-select: none`), since this is gameplay, not text editing.

## UI / Theme

- Controls use emoji labels.
- Dark mode is global via `:root[data-theme="dark"]` and applies to full page, not only app container.
- Theme state is controlled through `#dark-mode-toggle` and synced to `document.documentElement.dataset.theme`.

## Testing Strategy

- Unit tests: `npm test -- --run` (Vitest).
- E2E tests: `npx playwright test` (mobile project profile).
- E2E includes:
  - app load smoke test
  - mobile swipe word-selection test (path discovered dynamically)
  - dark mode full-page coverage check

## Commit Workflow

- After each completed user-requested change/feature:
  - stage only relevant files
  - commit with concise message
  - do not push unless explicitly requested

