const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run serve",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
    timeout: 30_000
  }
});

