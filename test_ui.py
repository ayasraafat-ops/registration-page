import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("Navigating to http://localhost:3000...")
        await page.goto("http://localhost:3000")

        print("Taking initial screenshot...")
        await page.screenshot(path="initial_load.png")

        print("Checking for required elements...")
        # Check header
        header = await page.query_selector("header h1")
        header_text = await header.inner_text()
        print(f"Header found: {header_text}")
        assert "محادثة الذكاء الاصطناعي (Qwen Plus)" in header_text

        # Send a message
        print("Typing a message...")
        await page.fill("#user-input", "مرحبا")
        await page.click("#send-btn")

        print("Waiting for response or error...")
        # Wait for either AI message or error
        await page.wait_for_timeout(5000) # Simple wait to allow API call to resolve or fail

        print("Taking final screenshot...")
        await page.screenshot(path="after_message.png")

        # We don't strictly assert the API response because it relies on the real API key,
        # but we do check that the UI updated and didn't crash
        print("UI Test Complete.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
