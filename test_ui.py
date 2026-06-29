import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("Navigating to http://localhost:3000...")
        await page.goto('http://localhost:3000')

        print("Checking title...")
        title = await page.title()
        if "موقع ذكاء اصطناعي" not in title:
            print(f"Error: Unexpected title: {title}")
            return

        print("Waiting for input box...")
        await page.wait_for_selector('#user-input')

        print("Sending message...")
        await page.fill('#user-input', 'مرحبا')
        await page.click('#send-button')

        print("Waiting for response...")
        await page.wait_for_selector('#chat-box > div:nth-child(2)')

        print("Taking screenshot...")
        await page.screenshot(path='test_output.png')
        print("Verification successful!")

        await browser.close()

asyncio.run(run())
