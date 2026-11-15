import { defineConfig, devices } from "@playwright/test";

// Os testes de interface correm contra a aplicação a sério, em dois processos: o Next (arrancado
// aqui) e a API do desafio 1, que tem de estar a correr em API_URL (por defeito, localhost:3000).
const PORT = Number(process.env.PORT ?? 3150);
const API_URL = process.env.API_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // Uma só worker: a API limita os logins (5 por minuto) e os testes partilham sessões.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { API_URL },
  },
});
