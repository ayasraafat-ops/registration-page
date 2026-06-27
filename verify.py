import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(
            viewport={'width': 1280, 'height': 720},
            color_scheme='light'
        )

        print("Navigating to http://localhost:3000...")
        await page.goto("http://localhost:3000")

        print("Typing message...")
        # Type into the textarea using its ID
        await page.fill('#user-input', 'مرحبا بك يا ذكاء اصطناعي')

        print("Clicking send button...")
        # Click the send button
        await page.click('#send-btn')

        # Wait a moment for UI to update (message to appear)
        await page.wait_for_timeout(2000)

        print("Taking screenshot...")
        await page.screenshot(path="screenshot.png")
        print("Screenshot saved to screenshot.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
