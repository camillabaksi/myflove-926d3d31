"""E2E: Flow ska vara en horisontell karusell – en slide i taget.

Kör:  python3 tests/e2e/flow_carousel.py [bas-url]
Default bas-url: http://localhost:8080

Verifierar i 375px och 390px viewport:
  1. Endast EN slide är synlig i viewporten.
  2. Slide 2 ligger till HÖGER om slide 1 (samma y, x ≈ +en viewportbredd).
  3. Horisontell swipe snappar till nästa slide.
"""

import asyncio
import re
import json
import os
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
    cj = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cj:
        await context.add_cookies([{**c, "url": BASE} for c in json.loads(cj)])
    await page.goto(BASE, wait_until="domcontentloaded")
    key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    sj = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    if key and sj:
        await page.evaluate(
            f"localStorage.setItem({json.dumps(key)}, {json.dumps(sj)})"
        )


async def run_width(browser, width: int) -> None:
    print(f"\n=== viewport {width}px ===")
    context = await browser.new_context(
        viewport={"width": width, "height": 800},
        has_touch=True,
        is_mobile=True,
    )
    page = await context.new_page()
    await restore_session(context, page)
    await page.goto(f"{BASE}/flow", wait_until="domcontentloaded")
    await page.wait_for_timeout(1500)
    if "/sign-in" in page.url or "/auth" in page.url:
        # Ingen session: använd utvecklingslägets testkonto (endast lokalt/dev).
        await page.goto(f"{BASE}/dev-session", wait_until="domcontentloaded")
        btn = page.get_by_role("button", name=re.compile("testsession|logga in", re.I))
        if await btn.count():
            await btn.first.click()
            await page.wait_for_url(re.compile(r"/hem"), timeout=45000)
        await page.goto(f"{BASE}/flow", wait_until="domcontentloaded")

    track = page.locator("[data-flow-track]")
    try:
        await track.wait_for(state="visible", timeout=20000)
    except Exception:
        check(False, f"{width}px: Flow-karusellen renderas", f"url={page.url}")
        await context.close()
        return
    check(True, f"{width}px: Flow-karusellen renderas")

    slides = page.locator("[data-flow-slide]")
    count = await slides.count()
    check(count >= 2, f"{width}px: minst 2 slides", f"antal={count}")
    if count < 2:
        await context.close()
        return

    b1 = await slides.nth(0).bounding_box()
    b2 = await slides.nth(1).bounding_box()

    check(
        abs(b1["y"] - b2["y"]) < 2,
        f"{width}px: slide 2 har samma y-position som slide 1",
        f"y1={b1['y']:.0f} y2={b2['y']:.0f}",
    )
    check(
        b2["x"] >= b1["x"] + b1["width"] - 2,
        f"{width}px: slide 2 ligger till höger om slide 1",
        f"x1={b1['x']:.0f} x2={b2['x']:.0f} bredd={b1['width']:.0f}",
    )
    check(
        b1["width"] <= width + 1,
        f"{width}px: slide 1 är max en viewportbredd",
        f"bredd={b1['width']:.0f}",
    )

    # Endast en slide får ligga inom viewportens x-intervall.
    visible = 0
    for i in range(count):
        b = await slides.nth(i).bounding_box()
        if b and b["x"] < width - 8 and b["x"] + b["width"] > 8:
            visible += 1
    check(visible == 1, f"{width}px: endast EN slide syns", f"synliga={visible}")

    # Swipe / snap
    before = await track.evaluate("el => el.scrollLeft")
    await track.evaluate("el => el.scrollBy({ left: el.clientWidth, behavior: 'instant' })")
    await page.wait_for_timeout(700)
    after = await track.evaluate("el => el.scrollLeft")
    step = after - before
    check(
        step > width * 0.7,
        f"{width}px: horisontell swipe snappar till nästa slide",
        f"scrollLeft {before:.0f} -> {after:.0f}",
    )

    b1b = await slides.nth(0).bounding_box()
    b2b = await slides.nth(1).bounding_box()
    check(
        b2b["x"] < b1b["x"] + b1b["width"] / 2,
        f"{width}px: slide 2 är i viewporten efter swipe",
        f"x2={b2b['x']:.0f}",
    )

    os.makedirs("/tmp/browser/flow-e2e", exist_ok=True)
    await page.screenshot(path=f"/tmp/browser/flow-e2e/flow-{width}.png")
    await context.close()


async def main() -> int:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for w in WIDTHS:
            await run_width(browser, w)
        await browser.close()
    print("\n" + ("ALLA TESTER OK" if not FAILS else f"{len(FAILS)} FEL: {FAILS}"))
    return 1 if FAILS else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
