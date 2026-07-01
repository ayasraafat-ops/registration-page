import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the local server
        await page.goto("http://localhost:3000")

        # Ensure page is loaded
        await page.wait_for_selector("#message-input")

        # Type and submit a message
        await page.fill("#message-input", "مرحبا، هل أنت متصل؟")
        await page.click("button[type='submit']")

        # Wait for loading indicator to appear
        await page.wait_for_selector("#loading-indicator", state="visible")

        # Wait for loading indicator to disappear
        await page.wait_for_selector("#loading-indicator", state="detached", timeout=30000)

        # Wait a moment for the AI response to render
        await page.wait_for_timeout(2000)

        # Take screenshot
        await page.screenshot(path="screenshot.png")

        print("Test completed successfully.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
