"""Visuellt regressionstest för /flow-karusellen.

Skyddar mot att framtida CSS-ändringar råkar göra karusellen vertikalt staplad.

Kör:
    python3 tests/e2e/flow_visual_regression.py                 # jämför mot baseline
    python3 tests/e2e/flow_visual_regression.py --update        # skriv om baseline
    python3 tests/e2e/flow_visual_regression.py http://host     # annan bas-url

Testet gör två saker per viewport (375, 390, 414 px):
  1. Geometrikontroll: slides ligger på samma y-rad, sida vid sida horisontellt,
     och bara en slide syns åt gången (misslyckas direkt vid vertikal stapling).
  2. Pixeljämförelse mot en sparad baseline-bild i tests/e2e/baselines/.
     Skillnad över DIFF_THRESHOLD (%) markeras som fel och en diffbild sparas
     i /tmp/browser/flow-visual/.
"""

import asyncio
import json
import os
import re
import sys

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
UPDATE = "--update" in sys.argv
BASE = (ARGS[0] if ARGS else "http://localhost:8080").rstrip("/")

WIDTHS = [375, 390, 414]
HEIGHT = 800
DIFF_THRESHOLD = 2.0  # procent avvikande pixlar

ROOT = os.path.dirname(os.path.abspath(__file__))
BASELINE_DIR = os.path.join(ROOT, "baselines")
OUT_DIR = "/tmp/browser/flow-visual"

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
        await page.evaluate(f"localStorage.setItem({json.dumps(key)}, {json.dumps(sj)})")


async def open_flow(page) -> bool:
    # Testsessionen kan strula tillfälligt (rate limit) – försök några gånger.
    for attempt in range(3):
        await page.goto(f"{BASE}/flow", wait_until="domcontentloaded")
        await page.wait_for_timeout(1200)
        if "/sign-in" in page.url or "/auth" in page.url:
            await page.goto(f"{BASE}/dev-session", wait_until="domcontentloaded")
            btn = page.get_by_role("button", name=re.compile("testanvändare", re.I))
            try:
                await btn.first.wait_for(state="visible", timeout=20000)
                await btn.first.click()
                await page.wait_for_url(re.compile(r"/hem"), timeout=45000)
            except Exception as err:  # noqa: BLE001
                print(f"  (försök {attempt + 1}: kunde inte skapa testsession: {err})")
                await page.wait_for_timeout(3000)
                continue
            await page.goto(f"{BASE}/flow", wait_until="domcontentloaded")
        try:
            await page.locator("[data-flow-track]").wait_for(state="visible", timeout=20000)
            return True
        except Exception:
            await page.wait_for_timeout(3000)
    return False



async def freeze_page(page) -> None:
    """Stäng av animationer/övergångar så pixeljämförelsen blir stabil."""
    await page.add_style_tag(
        content=(
            "*,*::before,*::after{animation:none!important;"
            "transition:none!important;caret-color:transparent!important}"
        )
    )
    await page.wait_for_timeout(400)


def compare(actual_path: str, baseline_path: str, label: str) -> None:
    if UPDATE or not os.path.exists(baseline_path):
        os.makedirs(os.path.dirname(baseline_path), exist_ok=True)
        Image.open(actual_path).save(baseline_path)
        print(f"BASE  {label} — baseline skriven: {baseline_path}")
        return

    a = Image.open(actual_path).convert("RGB")
    b = Image.open(baseline_path).convert("RGB")
    if a.size != b.size:
        check(False, label, f"olika storlek {a.size} vs {b.size}")
        return

    diff = ImageChops.difference(a, b).convert("L")
    total = a.size[0] * a.size[1]
    changed = sum(count for value, count in enumerate(diff.histogram()) if value > 24)
    pct = 100.0 * changed / total
    ok = pct <= DIFF_THRESHOLD
    if not ok:
        os.makedirs(OUT_DIR, exist_ok=True)
        diff.save(os.path.join(OUT_DIR, os.path.basename(baseline_path).replace(".png", "-diff.png")))
    check(ok, label, f"{pct:.2f}% avvikande pixlar (gräns {DIFF_THRESHOLD}%)")


async def run_width(browser, width: int) -> None:
    print(f"\n=== viewport {width}px ===")
    context = await browser.new_context(
        viewport={"width": width, "height": HEIGHT},
        has_touch=True,
        is_mobile=True,
        device_scale_factor=1,
    )
    page = await context.new_page()
    await restore_session(context, page)
    if not await open_flow(page):
        check(False, f"{width}px: Flow-karusellen renderas", f"url={page.url}")
        await context.close()
        return
    check(True, f"{width}px: Flow-karusellen renderas")
    await freeze_page(page)

    slides = page.locator("[data-flow-slide]")
    count = await slides.count()
    check(count >= 2, f"{width}px: minst 2 slides", f"antal={count}")

    if count >= 2:
        b1 = await slides.nth(0).bounding_box()
        b2 = await slides.nth(1).bounding_box()
        check(
            abs(b1["y"] - b2["y"]) < 2,
            f"{width}px: slides ligger på samma rad (ingen vertikal stapling)",
            f"y1={b1['y']:.0f} y2={b2['y']:.0f}",
        )
        check(
            b2["x"] >= b1["x"] + b1["width"] - 2,
            f"{width}px: slide 2 ligger till höger om slide 1",
            f"x1={b1['x']:.0f} x2={b2['x']:.0f}",
        )
        visible = 0
        for i in range(count):
            b = await slides.nth(i).bounding_box()
            if not b:
                continue
            shown = min(b["x"] + b["width"], width) - max(b["x"], 0)
            if shown > b["width"] / 2:
                visible += 1
        check(visible == 1, f"{width}px: endast EN slide syns", f"synliga={visible}")

    os.makedirs(OUT_DIR, exist_ok=True)
    actual = os.path.join(OUT_DIR, f"flow-{width}.png")
    await page.screenshot(path=actual)
    compare(
        actual,
        os.path.join(BASELINE_DIR, f"flow-{width}.png"),
        f"{width}px: visuell jämförelse mot baseline",
    )
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
