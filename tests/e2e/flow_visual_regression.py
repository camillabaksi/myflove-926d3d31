"""Visuellt regressionstest för Flows state-baserade en-slide-vy.

Kör med samma argument som tidigare. Testet säkerställer att exakt en slide
finns i DOM vid 375, 390 och 414 px och jämför startvyn mot baseline.
"""

import asyncio
import json
import os
import re
import sys

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

ARGS = [argument for argument in sys.argv[1:] if not argument.startswith("--")]
UPDATE = "--update" in sys.argv
BASE = (ARGS[0] if ARGS else "http://localhost:8080").rstrip("/")
WIDTHS = [375, 390, 414]
HEIGHT = 800
DIFF_THRESHOLD = 2.0
ROOT = os.path.dirname(os.path.abspath(__file__))
BASELINE_DIR = os.path.join(ROOT, "baselines")
OUT_DIR = "/tmp/browser/flow-visual"
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
        await page.evaluate(f"localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})")


async def open_flow(page) -> bool:
    for attempt in range(3):
        await page.goto(f"{BASE}/flow", wait_until="domcontentloaded")
        await page.wait_for_timeout(1200)
        if "/sign-in" in page.url or "/auth" in page.url:
            await page.goto(f"{BASE}/dev-session", wait_until="domcontentloaded")
            button = page.get_by_role("button", name=re.compile("testanvändare", re.I))
            try:
                await button.first.wait_for(state="visible", timeout=20000)
                await button.first.click()
                await page.wait_for_url(re.compile(r"/hem"), timeout=45000)
            except Exception as error:  # noqa: BLE001
                print(f"  (testsession försök {attempt + 1}: {error})")
                await page.wait_for_timeout(2500)
                continue
        await page.goto(f"{BASE}/flow", wait_until="domcontentloaded")
        try:
            await page.locator("[data-flow-state-view]").wait_for(state="visible", timeout=20000)
            return True
        except Exception:
            await page.wait_for_timeout(2500)
    return False


def compare(actual_path: str, baseline_path: str, label: str) -> None:
    if UPDATE or not os.path.exists(baseline_path):
        os.makedirs(os.path.dirname(baseline_path), exist_ok=True)
        Image.open(actual_path).save(baseline_path)
        print(f"BASE  {label} — baseline skriven: {baseline_path}")
        return
    actual = Image.open(actual_path).convert("RGB")
    baseline = Image.open(baseline_path).convert("RGB")
    if actual.size != baseline.size:
        check(False, label, f"olika storlek {actual.size} vs {baseline.size}")
        return
    diff = ImageChops.difference(actual, baseline).convert("L")
    changed = sum(count for value, count in enumerate(diff.histogram()) if value > 24)
    percent = 100.0 * changed / (actual.size[0] * actual.size[1])
    check(percent <= DIFF_THRESHOLD, label, f"{percent:.2f}% avvikande pixlar")


async def run_width(browser, width: int) -> None:
    context = await browser.new_context(
        viewport={"width": width, "height": HEIGHT}, has_touch=True, is_mobile=True
    )
    page = await context.new_page()
    await restore_session(context, page)
    if not await open_flow(page):
        check(False, f"{width}px: Flow-vyn renderas", f"url={page.url}")
        await context.close()
        return
    await page.add_style_tag(content="*,*::before,*::after{animation:none!important;transition:none!important}")
    slides = page.locator("[data-flow-slide]")
    check(await slides.count() == 1, f"{width}px: exakt EN slide finns i DOM")
    check(
        await slides.first.get_attribute("data-flow-slide-id") == "intro",
        f"{width}px: skärmbilden visar intro-state 0",
    )
    os.makedirs(OUT_DIR, exist_ok=True)
    actual = os.path.join(OUT_DIR, f"flow-{width}.png")
    await page.screenshot(path=actual)
    compare(actual, os.path.join(BASELINE_DIR, f"flow-{width}.png"), f"{width}px: visuell baseline")
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