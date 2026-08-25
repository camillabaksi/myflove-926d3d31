"""E2E: Flow renderar endast aktuell state/slide.

Kör: python3 tests/e2e/flow_carousel.py [bas-url]
Verifierar vid 375px och 390px att endast en slide finns i DOM och att
vänstersvep ersätter intro-sliden med nästa state.
"""

import asyncio
import json
import os
import re
import sys

from playwright.async_api import async_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080").rstrip("/")
WIDTHS = [375, 390]
FAILS: list[str] = []


def check(ok: bool, label: str, detail: str = "") -> None:
    print(("PASS  " if ok else "FAIL  ") + label + ((" — " + detail) if detail else ""))
    if not ok:
        FAILS.append(label)


async def restore_session(context, page) -> None:
    cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cookies_json:
        await context.add_cookies([{**cookie, "url": BASE} for cookie in json.loads(cookies_json)])
    await page.goto(BASE, wait_until="domcontentloaded")
    storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    if storage_key and session_json:
        await page.evaluate(
            f"localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
        )


async def open_flow(page) -> bool:
    await page.goto(f"{BASE}/flow", wait_until="domcontentloaded")
    await page.wait_for_timeout(1200)
    if "/sign-in" in page.url or "/auth" in page.url:
        await page.goto(f"{BASE}/dev-session", wait_until="domcontentloaded")
        button = page.get_by_role("button", name=re.compile("testanvändare", re.I))
        try:
            await button.first.wait_for(state="visible", timeout=20000)
            await button.first.click()
            await page.wait_for_url(re.compile(r"/hem"), timeout=45000)
            await page.goto(f"{BASE}/flow", wait_until="domcontentloaded")
        except Exception as error:  # noqa: BLE001
            print("  (kunde inte skapa testsession:", error, ")")
    try:
        await page.locator("[data-flow-state-view]").wait_for(state="visible", timeout=20000)
        return True
    except Exception:
        return False


async def run_width(browser, width: int) -> None:
    print(f"\n=== viewport {width}px ===")
    context = await browser.new_context(
        viewport={"width": width, "height": 800}, has_touch=True, is_mobile=True
    )
    page = await context.new_page()
    await restore_session(context, page)
    if not await open_flow(page):
        check(False, f"{width}px: Flow-vyn renderas", f"url={page.url}")
        await context.close()
        return

    slides = page.locator("[data-flow-slide]")
    check(await slides.count() == 1, f"{width}px: exakt EN slide finns i DOM")
    check(
        await slides.first.get_attribute("data-flow-slide-id") == "intro",
        f"{width}px: Flow-introt är state 0",
    )
    intro_text = await slides.first.inner_text()

    state_view = page.locator("[data-flow-state-view]")
    box = await state_view.bounding_box()
    if box:
        y = box["y"] + min(box["height"] / 2, 250)
        await page.mouse.move(box["x"] + box["width"] * 0.8, y)
        await page.mouse.down()
        await page.mouse.move(box["x"] + box["width"] * 0.2, y, steps=8)
        await page.mouse.up()
        await page.wait_for_timeout(300)
    else:
        check(False, f"{width}px: state-vyn har mätbar yta")

    check(await slides.count() == 1, f"{width}px: fortfarande EN slide efter swipe")
    new_id = await slides.first.get_attribute("data-flow-slide-id")
    check(new_id != "intro", f"{width}px: vänstersvep går till nästa state", f"state={new_id}")
    new_text = await slides.first.inner_text()
    check(new_text != intro_text, f"{width}px: nästa slide ersätter föregående")
    check(
        await page.locator("[data-flow-state-view]").locator("text=Hej! Jag är Flow").count() == 0,
        f"{width}px: introt finns inte vertikalt under nästa slide",
    )

    os.makedirs("/tmp/browser/flow-e2e", exist_ok=True)
    await page.screenshot(path=f"/tmp/browser/flow-e2e/flow-state-{width}.png")
    await context.close()


async def main() -> int:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        for width in WIDTHS:
            await run_width(browser, width)
        await browser.close()
    print("\n" + ("ALLA TESTER OK" if not FAILS else f"{len(FAILS)} FEL: {FAILS}"))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))