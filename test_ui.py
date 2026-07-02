import re
from playwright.sync_api import sync_playwright

def test_chat():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:3000')

        # Type message
        page.fill('#chat-input', 'مرحبا')
        page.click('#send-btn')

        # Wait for loading indicator to appear and then disappear
        page.wait_for_selector('text=جاري الكتابة...', state='attached', timeout=5000)
        page.wait_for_selector('text=جاري الكتابة...', state='detached', timeout=30000)

        # Check for error or response
        error_container = page.locator('#error-container')
        if error_container.is_visible() and 'hidden' not in error_container.get_attribute('class'):
            print(f"Error shown on page: {error_container.text_content()}")
        else:
            print("Message sent successfully and response received.")

        page.screenshot(path="screenshot.png")
        browser.close()

if __name__ == '__main__':
    test_chat()
