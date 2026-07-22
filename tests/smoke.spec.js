const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

test("страница открывается без ошибок и ведет к реальной покупке", async ({ page }) => {
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.locator("h1")).toContainText("Новая траектория");
  await expect(page.locator("#attractions")).toBeVisible();

  const purchaseLinks = page.locator('a[href="https://price.parkskazka.com/"]');
  expect(await purchaseLinks.count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});

test("оптимизированное видео загружается только после взаимодействия", async ({ page }) => {
  await page.goto("/");
  expect(await page.locator("video source[src]").count()).toBe(0);

  await page.mouse.wheel(0, 120);
  await expect(page.locator("video source[src]")).toHaveCount(4);
});

test("якоря и переключатель темы доступны с клавиатуры", async ({ page }) => {
  await page.goto("/");

  const themeToggle = page.locator("[data-theme-toggle]");
  await themeToggle.focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(themeToggle).toHaveAttribute("aria-pressed", "true");

  await page.goto("/#attractions");
  await expect(page.locator("#attractions")).toBeInViewport();
  await page.goto("/#tickets");
  await expect(page.locator("#tickets")).toBeInViewport();
});

test("mobile viewport не имеет горизонтального переполнения", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
    mainTop: document.querySelector("main").getBoundingClientRect().top,
    headerHeight: document.querySelector("header").getBoundingClientRect().height
  }));

  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.mainTop).toBeGreaterThanOrEqual(dimensions.headerHeight - 1);
  await expect(page.locator(".header-cta")).toBeVisible();
});

test("reduced motion оставляет контент доступным и не загружает видео", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173/");
  await page.waitForLoadState("networkidle");

  await expect(page.locator(".trajectory")).toBeVisible();
  await expect(page.locator(".reveal").first()).toHaveCSS("opacity", "1");
  const loadedSources = await page.locator("video source[src]").count();
  expect(loadedSources).toBe(0);
  await context.close();
});

test("@a11y светлая и темная темы проходят axe", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const lightResults = await new AxeBuilder({ page }).analyze();
  expect(lightResults.violations).toEqual([]);

  await page.locator("[data-theme-toggle]").click();
  const darkResults = await new AxeBuilder({ page }).analyze();
  expect(darkResults.violations).toEqual([]);
});
