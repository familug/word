import { test, expect } from "@playwright/test";

test("loads game and shows tiles", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Kids Word Square");
  await expect(page.locator("#new-game-btn")).toBeVisible();
  await expect(page.locator("#sound-toggle-btn")).toBeVisible();
  await expect(page.locator(".tile").first()).toBeVisible();
  await expect(page.locator("#word-list li")).toHaveCount(4);
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("mobile swipe selects a word by dragging finger", async ({ page }) => {
  await page.goto("/");

  const targetWord = ((await page.locator("#word-list li").first().textContent()) ?? "").trim().toLowerCase();
  expect(targetWord.length).toBeGreaterThan(1);

  const path = await page.evaluate((word) => {
    const tiles = Array.from(document.querySelectorAll(".tile"));
    const size = Math.sqrt(tiles.length);
    const cells = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
    for (const tile of tiles) {
      const row = Number(tile.getAttribute("data-row"));
      const col = Number(tile.getAttribute("data-col"));
      cells[row][col] = (tile.textContent ?? "").toLowerCase();
    }

    const dirs = [
      { row: 0, col: 1 },
      { row: 0, col: -1 },
      { row: 1, col: 0 },
      { row: -1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: -1 },
      { row: -1, col: 1 },
      { row: -1, col: -1 },
    ];

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        for (const dir of dirs) {
          const candidate = [];
          let valid = true;
          for (let i = 0; i < word.length; i += 1) {
            const nextRow = row + dir.row * i;
            const nextCol = col + dir.col * i;
            if (nextRow < 0 || nextCol < 0 || nextRow >= size || nextCol >= size) {
              valid = false;
              break;
            }
            candidate.push(cells[nextRow][nextCol]);
          }
          if (valid && candidate.join("") === word) {
            return Array.from({ length: word.length }, (_, i) => ({
              row: row + dir.row * i,
              col: col + dir.col * i,
            }));
          }
        }
      }
    }
    return [];
  }, targetWord);

  expect(path.length).toBe(targetWord.length);

  const startTile = page.locator(`.tile[data-row="${path[0].row}"][data-col="${path[0].col}"]`);
  const startBox = await startTile.boundingBox();
  if (!startBox) throw new Error("Could not determine start tile bounds.");

  await startTile.dispatchEvent("pointerdown", {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    clientX: startBox.x + startBox.width / 2,
    clientY: startBox.y + startBox.height / 2,
    bubbles: true,
  });

  for (let i = 1; i < path.length; i += 1) {
    const tile = page.locator(`.tile[data-row="${path[i].row}"][data-col="${path[i].col}"]`);
    const box = await tile.boundingBox();
    if (!box) continue;
    await page.locator("#grid").dispatchEvent("pointermove", {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: box.x + box.width / 2,
      clientY: box.y + box.height / 2,
      bubbles: true,
    });
  }

  await page.locator("#grid").dispatchEvent("pointerup", {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    bubbles: true,
  });

  await expect(page.locator("#status")).toContainText(`Great! You found ${targetWord.toUpperCase()}.`);

  const reversedPath = [...path].reverse();
  const reverseStart = page.locator(
    `.tile[data-row="${reversedPath[0].row}"][data-col="${reversedPath[0].col}"]`
  );
  const reverseStartBox = await reverseStart.boundingBox();
  if (!reverseStartBox) throw new Error("Could not determine reverse start tile bounds.");

  await reverseStart.dispatchEvent("pointerdown", {
    pointerId: 2,
    pointerType: "touch",
    isPrimary: true,
    clientX: reverseStartBox.x + reverseStartBox.width / 2,
    clientY: reverseStartBox.y + reverseStartBox.height / 2,
    bubbles: true,
  });

  for (let i = 1; i < reversedPath.length; i += 1) {
    const tile = page.locator(`.tile[data-row="${reversedPath[i].row}"][data-col="${reversedPath[i].col}"]`);
    const box = await tile.boundingBox();
    if (!box) continue;
    await page.locator("#grid").dispatchEvent("pointermove", {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      clientX: box.x + box.width / 2,
      clientY: box.y + box.height / 2,
      bubbles: true,
    });
  }

  await page.locator("#grid").dispatchEvent("pointerup", {
    pointerId: 2,
    pointerType: "touch",
    isPrimary: true,
    bubbles: true,
  });

  await expect(page.locator("#status")).toContainText("Try again!");
});

test("dark mode applies to whole page", async ({ page }) => {
  await page.goto("/");

  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(theme).toBe("dark");

  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bodyBg).toBe("rgb(2, 6, 23)");
});
