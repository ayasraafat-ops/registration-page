import asyncio
import os
from playwright.async_api import async_playwright

async def run():
    # Ensure directories exist
    os.makedirs('/home/jules/verification/videos', exist_ok=True)
    os.makedirs('/home/jules/verification/screenshots', exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Create a new context with video recording enabled
        context = await browser.new_context(
            record_video_dir='/home/jules/verification/videos',
            record_video_size={"width": 1280, "height": 720}
        )
        page = await context.new_page()

        print("Navigating to http://localhost:3000...")
        await page.goto('http://localhost:3000')

        # Take an initial screenshot
        await page.screenshot(path='/home/jules/verification/screenshots/initial.png')

        # Interact with the chat
        print("Typing message...")
        await page.fill('#user-input', 'مرحبا، كيف حالك؟')

        print("Submitting form...")
        await page.click('button[type="submit"]')

        # Wait for the loading indicator to appear and then disappear
        print("Waiting for loading indicator to disappear...")
        # Since it disappears when done, wait for it to be hidden
        await page.wait_for_selector('#loading-indicator', state='hidden', timeout=15000)

        # Wait a moment to capture the final message
        await page.wait_for_timeout(1000)

        # Take a final screenshot
        print("Taking final screenshot...")
        await page.screenshot(path='/home/jules/verification/screenshots/final.png')

        # Check if the last message is an error or a proper response
        messages = await page.query_selector_all('#chat-container > div > div')
        if messages:
            last_message = await messages[-1].inner_text()
            print(f"Last message received: {last_message}")

        # Close context to save the video
        await context.close()
        await browser.close()
        print("Test complete.")

if __name__ == '__main__':
    asyncio.run(run())
