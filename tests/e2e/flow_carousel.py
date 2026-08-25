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


def _session() -> dict:
    """Session från env, annars från `lovable auth-session --json`-filen."""
    path = os.path.expanduser("~/.cache/lovable-auth/session.json")
    if os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"):
        return {
            "storage_key": os.environ["LOVABLE_BROWSER_SUPABASE_STORAGE_KEY"],
            "session": json.loads(os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON") or "null"),
            "cookies": json.loads(os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON") or "[]"),
        }
    if os.path.exists(path):
        with open(path) as handle:
            return json.load(handle)
    return {}


async def restore_session(context, page) -> None:
    data = _session()
    if data.get("cookies"):
        await context.add_cookies([{**cookie, "url": BASE} for cookie in data["cookies"]])
    await page.goto(BASE, wait_until="domcontentloaded")
    if data.get("storage_key") and data.get("session"):
        await page.evaluate(
            f"localStorage.setItem({json.dumps(data['storage_key'])}, {json.dumps(json.dumps(data['session']))})"
        )


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
            await page.locator("[data-flow-viewport]").wait_for(state="visible", timeout=20000)
            return True

        except Exception:
            await page.wait_for_timeout(2500)
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
    track = page.locator("[data-flow-track]")
    viewport = page.locator("[data-flow-viewport]")

    total = await slides.count()
    check(total >= 1, f"{width}px: karusellen har slides", f"antal={total}")
    check(
        await track.evaluate("el => getComputedStyle(el).flexDirection") == "row",
        f"{width}px: spåret är en flex-row",
    )
    check(
        await viewport.evaluate("el => getComputedStyle(el).overflowX") == "hidden",
        f"{width}px: containern har overflow-hidden",
    )

    vp_box = await viewport.bounding_box()
    widths = await slides.evaluate_all("els => els.map(e => Math.round(e.getBoundingClientRect().width))")
    tops = await slides.evaluate_all("els => els.map(e => Math.round(e.getBoundingClientRect().top))")
    check(
        vp_box is not None and all(abs(w - round(vp_box["width"])) <= 2 for w in widths),
        f"{width}px: varje slide är exakt 100% av containern",
        f"bredder={widths}",
    )
    check(
        len(set(tops)) == 1,
        f"{width}px: alla slides ligger på samma rad (inte staplade)",
        f"top={tops}",
    )

    active = page.locator('[data-flow-slide][data-flow-slide-active="true"]')
    check(await active.count() == 1, f"{width}px: exakt en synlig slide")
    check(
        await active.first.get_attribute("data-flow-slide-id") == "intro",
        f"{width}px: Flow-introt är slide 1",
    )

    box = await viewport.bounding_box()
    if box:
        y = box["y"] + min(box["height"] / 2, 250)
        await page.mouse.move(box["x"] + box["width"] * 0.8, y)
        await page.mouse.down()
        await page.mouse.move(box["x"] + box["width"] * 0.2, y, steps=8)
        await page.mouse.up()
        await page.wait_for_timeout(450)
    else:
        check(False, f"{width}px: karusellen har mätbar yta")

    new_id = await active.first.get_attribute("data-flow-slide-id")
    check(new_id != "intro", f"{width}px: vänstersvep går till nästa slide", f"slide={new_id}")
    check(
        "matrix" in await track.evaluate("el => getComputedStyle(el).transform"),
        f"{width}px: spåret har flyttats i sidled",
    )

    box = await viewport.bounding_box()
    if box:
        y = box["y"] + min(box["height"] / 2, 250)
        await page.mouse.move(box["x"] + box["width"] * 0.2, y)
        await page.mouse.down()
        await page.mouse.move(box["x"] + box["width"] * 0.8, y, steps=8)
        await page.mouse.up()
        await page.wait_for_timeout(450)
    check(
        await active.first.get_attribute("data-flow-slide-id") == "intro",
        f"{width}px: högersvep går tillbaka",
    )

    # Kort drag ska fjädra tillbaka
    box = await viewport.bounding_box()
    if box:
        y = box["y"] + min(box["height"] / 2, 250)
        await page.mouse.move(box["x"] + box["width"] * 0.6, y)
        await page.mouse.down()
        await page.mouse.move(box["x"] + box["width"] * 0.55, y, steps=5)
        await page.mouse.up()
        await page.wait_for_timeout(450)
    check(
        await active.first.get_attribute("data-flow-slide-id") == "intro",
        f"{width}px: för kort drag fjädrar tillbaka",
    )

    # Tangentbord
    await viewport.focus()
    check(
        await page.evaluate("() => document.activeElement?.hasAttribute('data-flow-viewport')"),
        f"{width}px: karusellen går att fokusera",
    )
    await page.keyboard.press("ArrowRight")
    await page.wait_for_timeout(400)
    check(
        await active.first.get_attribute("data-flow-slide-id") != "intro",
        f"{width}px: högerpil byter vy",
    )
    check(
        await page.evaluate(
            "() => document.activeElement?.getAttribute('data-flow-slide-active') === 'true'"
        ),
        f"{width}px: fokus flyttas till den nya vyn",
    )
    await page.keyboard.press("Home")
    await page.wait_for_timeout(400)
    check(
        await active.first.get_attribute("data-flow-slide-id") == "intro",
        f"{width}px: Home går till första vyn",
    )
    if total > 1:
        await page.keyboard.press("End")
        await page.wait_for_timeout(400)
        check(
            await page.evaluate(
                "() => document.querySelector('[data-flow-current-slide]')?.getAttribute('data-flow-current-slide')"
            )
            == str(total - 1),
            f"{width}px: End går till sista vyn",
        )
        await page.keyboard.press("Home")
        await page.wait_for_timeout(300)

    check(
        await page.evaluate(
            "() => [...document.querySelectorAll('[data-flow-slide]')].filter(e => e.dataset.flowSlideActive !== 'true').every(e => e.hasAttribute('inert'))"
        ),
        f"{width}px: inaktiva slides är inerta",
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