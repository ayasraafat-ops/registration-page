from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(500)

    # Type a message in Arabic
    page.get_by_role("textbox").fill("ما هو الذكاء الاصطناعي؟")
    page.wait_for_timeout(500)

    # Click Send
    page.get_by_role("button", name="إرسال").click()
    page.wait_for_timeout(500)

    # Wait for response (this might take a second due to API error/response)
    page.wait_for_timeout(2000)

    # Take screenshot at the final state
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
