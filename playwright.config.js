// @ts-check
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, devices } from "@playwright/test";

/** Directory containing this config (repo root). Always start Vite from here — not from `grace-backend/`. */
const rootDir = path.dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PLAYWRIGHT_PORT || 5173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    navigationTimeout: 60_000,
    // Windows / corporate env: system proxy can block Chromium from reaching 127.0.0.1
    launchOptions: {
      args: ["--proxy-server=direct://", "--proxy-bypass-list=*"],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          // Direct vite (no extra npm layer); fixed host/port so Playwright’s URL check matches on Windows
          command: `npx vite --host 127.0.0.1 --port ${port} --strictPort`,
          cwd: rootDir,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 240_000,
          stdout: "pipe",
          stderr: "pipe",
        },
      }),
});
