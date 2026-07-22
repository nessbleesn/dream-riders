from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:4173/"
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "test-results" / "visual-qa"
VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900},
    "tablet": {"width": 768, "height": 1024},
    "mobile": {"width": 390, "height": 844},
}


def assert_page(page, name: str) -> None:
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.goto(BASE_URL, wait_until="networkidle")

    dimensions = page.evaluate(
        """
        () => ({
          viewport: document.documentElement.clientWidth,
          page: document.documentElement.scrollWidth
        })
        """
    )
    assert dimensions["page"] <= dimensions["viewport"], f"{name}: horizontal overflow"
    assert not errors, f"{name}: console errors: {errors}"


def load_lazy_images(page) -> None:
    height = page.evaluate("document.documentElement.scrollHeight")
    viewport_height = page.viewport_size["height"]
    for position in range(0, height, max(viewport_height // 2, 320)):
        page.evaluate("position => window.scrollTo(0, position)", position)
        page.wait_for_timeout(60)
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(150)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)

        for name, viewport in VIEWPORTS.items():
            context = browser.new_context(viewport=viewport, reduced_motion="reduce")
            page = context.new_page()
            assert_page(page, name)
            load_lazy_images(page)
            page.screenshot(
                path=OUTPUT_DIR / f"{name}-full.png",
                full_page=True,
                animations="disabled",
            )
            context.close()

        context = browser.new_context(viewport=VIEWPORTS["desktop"])
        page = context.new_page()
        page.add_init_script(
            "Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } })"
        )
        assert_page(page, "desktop-trajectory")
        page.evaluate(
            """
            () => {
              const section = document.querySelector('#trajectory');
              document.documentElement.style.scrollBehavior = 'auto';
              const travel = Math.max(section.offsetHeight - window.innerHeight, 0);
              window.scrollTo(0, section.offsetTop + travel * 0.48);
            }
            """
        )
        page.wait_for_timeout(350)
        page.screenshot(
            path=OUTPUT_DIR / "desktop-trajectory.png",
            full_page=False,
            animations="disabled",
        )

        context.close()

        context = browser.new_context(viewport=VIEWPORTS["desktop"], reduced_motion="reduce")
        page = context.new_page()
        assert_page(page, "desktop-dark")
        page.evaluate("localStorage.setItem('dream-riders-theme', 'dark')")
        page.reload(wait_until="networkidle")
        load_lazy_images(page)
        page.screenshot(
            path=OUTPUT_DIR / "desktop-dark.png",
            full_page=True,
            animations="disabled",
        )
        context.close()
        browser.close()

    print(f"Visual QA complete: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
