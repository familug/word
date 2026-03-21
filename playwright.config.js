import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: "smoke.spec.js",
  projects: [
    {
      name: "pixel6a",
      use: {
        baseURL: "http://127.0.0.1:4173",
        headless: true,
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "python3 -m http.server 4173",
    port: 4173,
    reuseExistingServer: true,
  },
});
