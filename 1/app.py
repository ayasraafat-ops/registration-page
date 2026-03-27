"""
╔══════════════════════════════════════════════════════════════════════╗
║  ⚡ Ultra-Fast Login Bot v4.0 — Web Edition (Single File)          ║
║  ──────────────────────────────────────────────────────────────────  ║
║  🌐 FastAPI + WebSocket + Playwright + Stealth + Gemini 3.1        ║
║  📅 March 2026                                                      ║
║                                                                      ║
║  التثبيت:                                                            ║
║    pip install "fastapi[standard]" uvicorn playwright               ║
║    pip install playwright-stealth httpx                              ║
║    playwright install chromium                                       ║
║                                                                      ║
║  التشغيل:                                                            ║
║    python app.py                                                     ║
║    ثم افتح: http://localhost:8000                                    ║
╚══════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import random
import time
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Any

import httpx
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from playwright.async_api import (
    Page, Route, Request, async_playwright,
)
from playwright_stealth import stealth_async


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  📋  الإعدادات
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@dataclass(slots=True)
class Config:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "YOUR_KEY")
    gemini_model: str = "gemini-2.0-flash-lite"
    gemini_base: str = "https://generativelanguage.googleapis.com/v1beta"

    captcha_api_key: str = os.getenv("TWO_CAPTCHA_KEY", "YOUR_KEY")
    captcha_timeout: int = 120

    headless: bool = True
    timeout: int = 15_000
    nav_timeout: int = 30_000

    blocked_types: tuple = (
        "image", "stylesheet", "font", "media",
        "texttrack", "eventsource", "manifest",
    )
    blocked_ext: tuple = (
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico",
        ".css", ".less", ".scss",
        ".woff", ".woff2", ".ttf", ".eot", ".otf",
        ".mp4", ".mp3", ".avi", ".flv", ".ogg",
    )
    blocked_domains: tuple = (
        "google-analytics.com", "googletagmanager.com",
        "facebook.net", "doubleclick.net",
        "hotjar.com", "clarity.ms", "adservice.google",
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  🎯  أنواع النتائج
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class Status(Enum):
    SUCCESS = auto()
    CAPTCHA_FAILED = auto()
    FIELD_NOT_FOUND = auto()
    HTTP_ERROR = auto()
    TIMEOUT = auto()
    ERROR = auto()


@dataclass
class LoginResult:
    status: Status
    method: str = ""
    url_after: str = ""
    title: str = ""
    elapsed: float = 0.0
    proxy: str = "direct"
    cookies: list = field(default_factory=list)
    error: str = ""

    @property
    def ok(self) -> bool:
        return self.status == Status.SUCCESS

    def to_dict(self) -> dict:
        return {
            "success": self.ok,
            "status": self.status.name,
            "method": self.method,
            "url_after_login": self.url_after,
            "page_title": self.title,
            "elapsed": f"{self.elapsed:.2f}s",
            "proxy_used": self.proxy,
            "cookies_count": len(self.cookies),
            "error": self.error or None,
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  📡  WebSocket Logger — بث مباشر للمتصفح
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class WsLogger:
    """يرسل السجلات مباشرة إلى المتصفح عبر WebSocket"""

    def __init__(self):
        self._connections: dict[str, WebSocket] = {}
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket, session_id: str):
        await ws.accept()
        async with self._lock:
            self._connections[session_id] = ws

    async def disconnect(self, session_id: str):
        async with self._lock:
            self._connections.pop(session_id, None)

    async def send(self, session_id: str, msg_type: str, data: Any):
        async with self._lock:
            ws = self._connections.get(session_id)
        if ws:
            try:
                await ws.send_json({"type": msg_type, "data": data})
            except Exception:
                pass

    async def log(self, session_id: str, text: str, level: str = "info"):
        await self.send(session_id, "log", {"text": text, "level": level})

    async def progress(self, session_id: str, pct: int, label: str = ""):
        await self.send(session_id, "progress", {"pct": pct, "label": label})

    async def result(self, session_id: str, data: dict):
        await self.send(session_id, "result", data)


ws_logger = WsLogger()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  🔄  تدوير البروكسيات
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ProxyRotator:
    __slots__ = ("_proxies", "_failed", "_lock")

    def __init__(self, proxies: list[dict]):
        self._proxies = proxies[:]
        self._failed: set[int] = set()
        self._lock = asyncio.Lock()

    @property
    def available(self) -> int:
        return len(self._proxies) - len(self._failed)

    async def next(self) -> dict | None:
        async with self._lock:
            if not self._proxies:
                return None
            pool = [
                (i, p) for i, p in enumerate(self._proxies)
                if i not in self._failed
            ]
            if not pool:
                self._failed.clear()
                pool = list(enumerate(self._proxies))
            _, proxy = random.choice(pool)
            return proxy

    async def fail(self, proxy: dict):
        async with self._lock:
            for i, p in enumerate(self._proxies):
                if p.get("server") == proxy.get("server"):
                    self._failed.add(i)
                    break


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  🔓  حل الكابتشا — 2Captcha
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class CaptchaSolver:
    BASE = "http://2captcha.com"

    def __init__(self, api_key: str, timeout: int = 120):
        self._key = api_key
        self._timeout = timeout
        self._http = httpx.AsyncClient(timeout=30)

    async def _submit(self, payload: dict) -> str | None:
        payload |= {"key": self._key, "json": 1}
        try:
            r = await self._http.post(f"{self.BASE}/in.php", data=payload)
            d = r.json()
            return d["request"] if d.get("status") == 1 else None
        except Exception:
            return None

    async def _poll(self, task_id: str, sid: str = "") -> str | None:
        elapsed = 0
        while elapsed < self._timeout:
            await asyncio.sleep(5)
            elapsed += 5
            try:
                r = await self._http.get(f"{self.BASE}/res.php", params={
                    "key": self._key, "action": "get",
                    "id": task_id, "json": 1,
                })
                d = r.json()
                if d.get("status") == 1:
                    return d["request"]
                if d["request"] != "CAPCHA_NOT_READY":
                    return None
            except Exception:
                pass
            if sid:
                await ws_logger.log(sid, f"⏳ حل الكابتشا... ({elapsed}ث)")
        return None

    async def solve_recaptcha(self, site_key: str, url: str, sid: str = "") -> str | None:
        tid = await self._submit({
            "method": "userrecaptcha", "googlekey": site_key, "pageurl": url,
        })
        return await self._poll(tid, sid) if tid else None

    async def solve_image(self, b64: str, sid: str = "") -> str | None:
        tid = await self._submit({"method": "base64", "body": b64})
        return await self._poll(tid, sid) if tid else None

    async def close(self):
        await self._http.aclose()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  🤖  Gemini AI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class GeminiAnalyzer:

    def __init__(self, api_key: str, model: str, base_url: str):
        self._key = api_key
        self._model = model
        self._base = base_url
        self._http = httpx.AsyncClient(timeout=30)

    async def detect_selectors(self, html: str) -> dict | None:
        prompt = (
            "أنت محلل DOM خبير. حلل صفحة تسجيل الدخول واستخرج CSS selectors.\n"
            "أجب بـ JSON فقط بهذا الشكل:\n"
            '{"user":"selector","pass":"selector","btn":"selector",'
            '"captcha":false,"captcha_type":"none","site_key":null}\n\n'
            f"```html\n{html[:6000]}\n```"
        )

        url = f"{self._base}/models/{self._model}:generateContent?key={self._key}"
        try:
            r = await self._http.post(url, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.05, "maxOutputTokens": 512},
            })
            r.raise_for_status()
            text = (
                r.json().get("candidates", [{}])[0]
                .get("content", {}).get("parts", [{}])[0]
                .get("text", "")
            )
            s, e = text.find("{"), text.rfind("}") + 1
            if s != -1 and e > s:
                return json.loads(text[s:e])
        except Exception:
            pass
        return None

    async def close(self):
        await self._http.aclose()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  🚀  المحرك الرئيسي
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class LoginBot:

    _USER_SELS = (
        'input[name="username"]', 'input[name="email"]',
        'input[name="login"]', 'input[name="user"]',
        'input[type="email"]', 'input[id="username"]',
        'input[id="email"]', 'input[autocomplete="username"]',
    )
    _PASS_SELS = (
        'input[name="password"]', 'input[name="pass"]',
        'input[type="password"]', 'input[id="password"]',
    )
    _BTN_SELS = (
        'button[type="submit"]', 'input[type="submit"]',
        'button:has-text("Sign in")', 'button:has-text("Log in")',
        'button:has-text("Login")', 'button:has-text("تسجيل الدخول")',
        'button:has-text("دخول")', '#login-button', '.login-btn',
    )

    def __init__(self, cfg: Config, *, use_proxy=False,
                 use_gemini=True, use_captcha=True,
                 proxies: list[dict] | None = None):
        self.cfg = cfg
        self._use_proxy = use_proxy
        self._rotator = ProxyRotator(proxies or []) if use_proxy else None
        self._captcha = CaptchaSolver(cfg.captcha_api_key, cfg.captcha_timeout) if use_captcha else None
        self._gemini = GeminiAnalyzer(cfg.gemini_api_key, cfg.gemini_model, cfg.gemini_base) if use_gemini else None
        self._sid = ""

    async def _log(self, msg: str, level: str = "info"):
        if self._sid:
            await ws_logger.log(self._sid, msg, level)

    async def _prog(self, pct: int, label: str = ""):
        if self._sid:
            await ws_logger.progress(self._sid, pct, label)

    # ── حظر الموارد ──

    async def _intercept(self, route: Route, request: Request):
        url = request.url.lower()
        if request.resource_type in self.cfg.blocked_types:
            return await route.abort()
        if any(url.split("?")[0].endswith(e) for e in self.cfg.blocked_ext):
            return await route.abort()
        if any(d in url for d in self.cfg.blocked_domains):
            return await route.abort()
        await route.continue_()

    # ── إنشاء المتصفح ──

    async def _make_context(self, pw, proxy: dict | None = None):
        args = [
            "--no-sandbox", "--disable-setuid-sandbox",
            "--disable-dev-shm-usage", "--disable-gpu",
            "--no-first-run", "--no-zygote", "--mute-audio",
            "--disable-background-networking", "--disable-extensions",
        ]
        kw: dict[str, Any] = {"headless": self.cfg.headless, "args": args}
        if proxy:
            kw["proxy"] = proxy

        browser = await pw.chromium.launch(**kw)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            locale="en-US", timezone_id="America/New_York",
            java_script_enabled=True, bypass_csp=True,
            extra_http_headers={
                "Accept-Language": "en-US,en;q=0.9",
                "DNT": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
            },
        )
        context.set_default_timeout(self.cfg.timeout)
        context.set_default_navigation_timeout(self.cfg.nav_timeout)
        await context.route("**/*", self._intercept)
        return browser, context

    # ── كابتشا ──

    async def _handle_captcha(self, page: Page) -> bool:
        if not self._captcha:
            return True

        rc = await page.query_selector("iframe[src*='recaptcha']")
        if rc:
            await self._log("🔍 reCAPTCHA v2 مكتشف!", "warn")
            site_key = await page.evaluate(
                "()=>document.querySelector('.g-recaptcha')?.getAttribute('data-sitekey')??null"
            )
            if site_key:
                token = await self._captcha.solve_recaptcha(site_key, page.url, self._sid)
                if token:
                    await page.evaluate("""(t)=>{
                        const el=document.querySelector('#g-recaptcha-response');
                        if(el)el.value=t;
                        try{const c=___grecaptcha_cfg;
                        for(const k of Object.keys(c.clients))c.clients[k]?.aa?.l?.callback?.(t)}catch{}
                    }""", token)
                    return True
            return False

        img = await page.query_selector("img[src*='captcha'],img[alt*='captcha'],.captcha-image")
        if img:
            await self._log("🖼️ كابتشا صورة مكتشفة!", "warn")
            shot = await img.screenshot()
            text = await self._captcha.solve_image(base64.b64encode(shot).decode(), self._sid)
            if text:
                inp = await page.query_selector("input[name*='captcha'],input[id*='captcha']")
                if inp:
                    await inp.fill(text)
                    return True
            return False

        await self._log("✅ لا كابتشا مرئي", "success")
        return True

    # ── تعبئة الحقول ──

    async def _fill(self, page: Page, sels: tuple, val: str, label: str) -> bool:
        for sel in sels:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await el.fill("")
                    await el.type(val, delay=random.randint(25, 65))
                    await self._log(f"✏️ {label} → {sel}")
                    return True
            except Exception:
                continue
        return False

    async def _click_submit(self, page: Page, sels: tuple) -> bool:
        for sel in sels:
            try:
                el = await page.query_selector(sel)
                if el and await el.is_visible():
                    await el.click()
                    await self._log(f"🖱️ نقر → {sel}")
                    return True
            except Exception:
                continue
        await page.keyboard.press("Enter")
        await self._log("⌨️ إرسال بـ Enter")
        return True

    # ── Gemini + Traditional ──

    async def _smart_login(self, page: Page, user: str, pw: str) -> LoginResult:
        if self._gemini:
            await self._log("🤖 تحليل الصفحة بـ Gemini AI...", "ai")
            await self._prog(50, "تحليل ذكي...")
            html = await page.content()
            sel = await self._gemini.detect_selectors(html)
            if sel:
                await self._log(f"🎯 Gemini وجد: {json.dumps(sel, ensure_ascii=False)[:120]}", "ai")
                try:
                    u, p, b = sel.get("user", ""), sel.get("pass", ""), sel.get("btn", "")
                    if u:
                        await page.wait_for_selector(u, timeout=4000)
                        await page.fill(u, "")
                        await page.type(u, user, delay=random.randint(25, 60))
                    if p:
                        await page.fill(p, "")
                        await page.type(p, pw, delay=random.randint(25, 60))
                    if sel.get("captcha"):
                        if not await self._handle_captcha(page):
                            return LoginResult(Status.CAPTCHA_FAILED, "gemini")
                    await asyncio.sleep(random.uniform(0.2, 0.5))
                    if b:
                        await page.click(b)
                    else:
                        await page.keyboard.press("Enter")
                    await page.wait_for_load_state("networkidle", timeout=12000)
                    return LoginResult(Status.SUCCESS, method="gemini")
                except Exception as e:
                    await self._log(f"⚠️ Gemini فشل: {e}", "warn")

        await self._log("🔧 الطريقة التقليدية...", "info")
        await self._prog(55, "بحث عن الحقول...")

        if not await self._fill(page, self._USER_SELS, user, "مستخدم"):
            return LoginResult(Status.FIELD_NOT_FOUND, error="حقل المستخدم غير موجود")
        await asyncio.sleep(random.uniform(0.2, 0.4))
        if not await self._fill(page, self._PASS_SELS, pw, "كلمة مرور"):
            return LoginResult(Status.FIELD_NOT_FOUND, error="حقل كلمة المرور غير موجود")
        if not await self._handle_captcha(page):
            return LoginResult(Status.CAPTCHA_FAILED, "traditional")
        await asyncio.sleep(random.uniform(0.2, 0.4))
        await self._click_submit(page, self._BTN_SELS)
        try:
            await page.wait_for_load_state("networkidle", timeout=12000)
        except Exception:
            pass
        return LoginResult(Status.SUCCESS, method="traditional")

    # ════════════════ 🎯 الدالة الرئيسية ════════════════

    async def login(self, url: str, user: str, pw: str,
                    retries: int = 3, session_id: str = "") -> LoginResult:

        self._sid = session_id
        await self._log("🚀 بدء العملية...", "info")
        await self._prog(5, "تجهيز...")

        async with async_playwright() as playwright:
            for attempt in range(1, retries + 1):
                proxy = None
                browser = None
                t0 = time.perf_counter()

                try:
                    await self._log(f"📍 المحاولة {attempt}/{retries}", "info")
                    await self._prog(10 + (attempt - 1) * 5, f"محاولة {attempt}")

                    if self._rotator:
                        proxy = await self._rotator.next()
                        if proxy:
                            await self._log(f"🌐 بروكسي: {proxy['server']}")

                    await self._prog(20, "تشغيل المتصفح...")
                    browser, ctx = await self._make_context(playwright, proxy)

                    page = await ctx.new_page()
                    await stealth_async(page)
                    await self._log("🥷 وضع التخفي مفعّل", "success")

                    await self._prog(35, "تحميل الصفحة...")
                    await self._log(f"🌍 تحميل: {url}")
                    resp = await page.goto(url, wait_until="domcontentloaded")

                    load_t = time.perf_counter() - t0
                    await self._log(f"⚡ تم التحميل في {load_t:.2f}ث", "success")
                    await self._prog(45, "تم التحميل")

                    if resp and resp.status >= 400:
                        await self._log(f"❌ HTTP {resp.status}", "error")
                        if proxy and self._rotator:
                            await self._rotator.fail(proxy)
                        continue

                    await self._prog(50, "تسجيل الدخول...")
                    result = await self._smart_login(page, user, pw)

                    result.url_after = page.url
                    result.title = await page.title()
                    result.elapsed = time.perf_counter() - t0
                    result.proxy = proxy["server"] if proxy else "direct"

                    if result.ok:
                        result.cookies = await ctx.cookies()
                        await self._prog(100, "نجاح! ✅")
                        await self._log(f"🎉 نجح تسجيل الدخول — {result.elapsed:.2f}ث", "success")
                        await ws_logger.result(self._sid, result.to_dict())
                        return result
                    else:
                        await self._log(f"⚠️ فشل: {result.error or result.status.name}", "warn")

                except Exception as e:
                    await self._log(f"💥 خطأ: {e}", "error")
                    if proxy and self._rotator:
                        await self._rotator.fail(proxy)
                finally:
                    if browser:
                        await browser.close()

                if attempt < retries:
                    d = random.uniform(1.0, 2.5)
                    await self._log(f"⏳ انتظار {d:.1f}ث...")
                    await asyncio.sleep(d)

        fail_result = LoginResult(Status.ERROR, error=f"فشلت كل المحاولات ({retries})")
        await self._prog(100, "فشل ❌")
        await ws_logger.result(self._sid, fail_result.to_dict())
        await self._cleanup()
        return fail_result

    async def _cleanup(self):
        tasks = []
        if self._captcha: tasks.append(self._captcha.close())
        if self._gemini:  tasks.append(self._gemini.close())
        if tasks:
            await asyncio.gather(*tasks)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  🌐  FastAPI + الواجهة
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app = FastAPI(title="⚡ Ultra-Fast Login Bot v4.0")


@app.get("/", response_class=HTMLResponse)
async def home():
    return HTML_PAGE


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(ws: WebSocket, session_id: str):
    await ws_logger.connect(ws, session_id)
    try:
        while True:
            data = await ws.receive_json()
            action = data.get("action")

            if action == "login":
                cfg = Config(
                    gemini_api_key=data.get("gemini_key", ""),
                    captcha_api_key=data.get("captcha_key", ""),
                )

                # تجهيز البروكسيات
                proxies = []
                proxy_text = data.get("proxy_list", "").strip()
                if proxy_text:
                    for line in proxy_text.splitlines():
                        line = line.strip()
                        if not line:
                            continue
                        parts = line.split("|")
                        p = {"server": parts[0]}
                        if len(parts) >= 3:
                            p["username"] = parts[1]
                            p["password"] = parts[2]
                        proxies.append(p)

                bot = LoginBot(
                    cfg,
                    use_proxy=bool(proxies) and data.get("use_proxy", False),
                    use_gemini=data.get("use_gemini", True),
                    use_captcha=data.get("use_captcha", False),
                    proxies=proxies,
                )

                asyncio.create_task(
                    bot.login(
                        url=data["url"],
                        user=data["username"],
                        pw=data["password"],
                        retries=data.get("retries", 3),
                        session_id=session_id,
                    )
                )

    except WebSocketDisconnect:
        await ws_logger.disconnect(session_id)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  🎨  الواجهة الكاملة (HTML + CSS + JS)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HTML_PAGE = """
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>⚡ Ultra-Fast Login Bot v4.0</title>
<style>
/* ═══════════ CSS Reset + Variables ═══════════ */

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --bg-primary:    #0a0e1a;
    --bg-secondary:  #111827;
    --bg-card:       rgba(17, 24, 39, 0.7);
    --bg-glass:      rgba(255,255,255, 0.03);
    --border:        rgba(255,255,255, 0.08);
    --border-focus:  #6366f1;
    --text-primary:  #f1f5f9;
    --text-secondary:#94a3b8;
    --text-muted:    #64748b;
    --accent:        #6366f1;
    --accent-hover:  #818cf8;
    --success:       #22c55e;
    --warn:          #f59e0b;
    --error:         #ef4444;
    --ai:            #a78bfa;
    --radius:        12px;
    --radius-sm:     8px;
    --shadow:        0 8px 32px rgba(0,0,0, 0.4);
    --transition:    all 0.3s cubic-bezier(.4,0,.2,1);
    --font:          'Segoe UI', Tahoma, Arial, sans-serif;
}

html { scroll-behavior: smooth; }

body {
    font-family: var(--font);
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem 4rem;
    background-image:
        radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(34,197,94,0.04) 0%, transparent 50%);
}

/* ═══════════ Header ═══════════ */

.header {
    text-align: center;
    margin-bottom: 2rem;
    animation: fadeDown .6s ease-out;
}
.header h1 {
    font-size: 2.2rem;
    background: linear-gradient(135deg, #6366f1, #a78bfa, #22c55e);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
}
.header p {
    color: var(--text-secondary);
    margin-top: .5rem;
    font-size: .95rem;
}
.badge-row {
    display: flex;
    gap: .5rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: .75rem;
}
.badge {
    font-size: .7rem;
    padding: .25rem .65rem;
    border-radius: 50px;
    background: var(--bg-glass);
    border: 1px solid var(--border);
    color: var(--text-muted);
    letter-spacing: .3px;
}

/* ═══════════ Layout ═══════════ */

.container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    width: 100%;
    max-width: 1100px;
    animation: fadeUp .6s ease-out .15s both;
}

@media (max-width: 800px) {
    .container { grid-template-columns: 1fr; }
}

/* ═══════════ Card ═══════════ */

.card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow);
    transition: var(--transition);
}
.card:hover { border-color: rgba(99,102,241,.2); }
.card-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: .5rem;
    color: var(--text-primary);
}
.card-title .icon { font-size: 1.2rem; }

/* ═══════════ Inputs ═══════════ */

.field { margin-bottom: 1rem; }
.field label {
    display: block;
    font-size: .8rem;
    color: var(--text-secondary);
    margin-bottom: .35rem;
    font-weight: 500;
}
.field input, .field textarea, .field select {
    width: 100%;
    padding: .65rem .85rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: .88rem;
    font-family: var(--font);
    outline: none;
    transition: var(--transition);
}
.field input:focus, .field textarea:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(99,102,241,.15);
}
.field textarea {
    resize: vertical;
    min-height: 70px;
    font-size: .8rem;
}
.field input::placeholder, .field textarea::placeholder {
    color: var(--text-muted);
}

/* ═══════════ Toggle Switch ═══════════ */

.toggles-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .75rem;
}
.toggle-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .6rem .85rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: var(--transition);
}
.toggle-item:hover { border-color: rgba(99,102,241,.25); }
.toggle-item .label { font-size: .82rem; color: var(--text-secondary); }

.switch {
    position: relative;
    width: 42px; height: 24px;
    flex-shrink: 0;
}
.switch input { display: none; }
.switch .slider {
    position: absolute; inset: 0;
    background: #334155;
    border-radius: 50px;
    transition: var(--transition);
    cursor: pointer;
}
.switch .slider::before {
    content: '';
    position: absolute;
    width: 18px; height: 18px;
    left: 3px; top: 3px;
    background: white;
    border-radius: 50%;
    transition: var(--transition);
}
.switch input:checked + .slider { background: var(--accent); }
.switch input:checked + .slider::before { transform: translateX(18px); }

/* ═══════════ Button ═══════════ */

.btn-primary {
    width: 100%;
    padding: .8rem;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    color: white;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    box-shadow: 0 4px 16px rgba(99,102,241,.3);
    transition: var(--transition);
    margin-top: .5rem;
    position: relative;
    overflow: hidden;
}
.btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(99,102,241,.4);
}
.btn-primary:active:not(:disabled) { transform: translateY(0); }
.btn-primary:disabled {
    opacity: .6;
    cursor: not-allowed;
}
.btn-primary .spinner {
    display: none;
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin .7s linear infinite;
    margin-left: .5rem;
}
.btn-primary.loading .spinner { display: inline-block; }
.btn-primary.loading .btn-text { opacity: 0; }

.btn-stop {
    width: 100%;
    padding: .65rem;
    border: 1px solid var(--error);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--error);
    font-size: .88rem;
    cursor: pointer;
    margin-top: .5rem;
    transition: var(--transition);
    display: none;
}
.btn-stop:hover { background: rgba(239,68,68,.1); }

/* ═══════════ Progress Bar ═══════════ */

.progress-wrap {
    margin-bottom: 1rem;
    display: none;
}
.progress-wrap.active { display: block; }
.progress-label {
    display: flex;
    justify-content: space-between;
    font-size: .78rem;
    color: var(--text-secondary);
    margin-bottom: .35rem;
}
.progress-bar {
    width: 100%;
    height: 6px;
    background: var(--bg-secondary);
    border-radius: 50px;
    overflow: hidden;
}
.progress-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #6366f1, #22c55e);
    border-radius: 50px;
    transition: width .5s ease;
}

/* ═══════════ Log Console ═══════════ */

.console {
    background: #050810;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: .75rem;
    height: 320px;
    overflow-y: auto;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: .78rem;
    line-height: 1.6;
    direction: ltr;
    text-align: left;
    scroll-behavior: smooth;
}
.console::-webkit-scrollbar { width: 5px; }
.console::-webkit-scrollbar-track { background: transparent; }
.console::-webkit-scrollbar-thumb { background: #334155; border-radius: 50px; }

.log-line {
    padding: .15rem 0;
    animation: fadeIn .3s ease;
    word-break: break-all;
}
.log-line.info    { color: #94a3b8; }
.log-line.success { color: #22c55e; }
.log-line.warn    { color: #f59e0b; }
.log-line.error   { color: #ef4444; }
.log-line.ai      { color: #a78bfa; }

.log-time {
    color: #475569;
    margin-left: .5rem;
    font-size: .7rem;
}

/* ═══════════ Result Card ═══════════ */

.result-card {
    display: none;
    margin-top: 1rem;
    padding: 1rem;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    animation: fadeUp .4s ease;
}
.result-card.show { display: block; }
.result-card.success-result {
    background: rgba(34,197,94,.06);
    border-color: rgba(34,197,94,.25);
}
.result-card.fail-result {
    background: rgba(239,68,68,.06);
    border-color: rgba(239,68,68,.25);
}
.result-title {
    font-size: .95rem;
    font-weight: 600;
    margin-bottom: .75rem;
}
.result-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .5rem;
}
.result-item {
    font-size: .78rem;
    color: var(--text-secondary);
    padding: .4rem .6rem;
    background: var(--bg-glass);
    border-radius: 6px;
}
.result-item strong {
    display: block;
    color: var(--text-primary);
    font-size: .82rem;
    margin-top: .15rem;
}

/* ═══════════ Footer ═══════════ */

.footer {
    text-align: center;
    margin-top: 2.5rem;
    color: var(--text-muted);
    font-size: .78rem;
    animation: fadeUp .6s ease .3s both;
}

/* ═══════════ Animations ═══════════ */

@keyframes fadeDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeUp   { from { opacity:0; transform:translateY(20px); }  to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes spin     { to { transform: rotate(360deg); } }

/* ═══════════ Pulse dot ═══════════ */
.pulse-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--success);
    display: inline-block;
    animation: pulse 1.5s ease infinite;
}
@keyframes pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:.5; transform:scale(1.5); }
}
.status-bar {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .75rem;
    color: var(--text-muted);
    margin-bottom: .75rem;
}
</style>
</head>
<body>

<!-- ═══════════ Header ═══════════ -->
<div class="header">
    <h1>⚡ Ultra-Fast Login Bot</h1>
    <p>أتمتة تسجيل الدخول فائقة السرعة — كل شيء في مكان واحد</p>
    <div class="badge-row">
        <span class="badge">Playwright 1.51</span>
        <span class="badge">Stealth Mode</span>
        <span class="badge">Gemini AI</span>
        <span class="badge">2Captcha</span>
        <span class="badge">Proxy Rotation</span>
        <span class="badge">Async</span>
    </div>
</div>

<!-- ═══════════ Main Grid ═══════════ -->
<div class="container">

    <!-- ═══════════ LEFT PANEL ═══════════ -->
    <div style="display:flex;flex-direction:column;gap:1.5rem;">

        <!-- Login Info -->
        <div class="card">
            <div class="card-title"><span class="icon">🔐</span> بيانات تسجيل الدخول</div>
            <div class="field">
                <label>🔗 رابط صفحة الدخول</label>
                <input type="url" id="url" placeholder="https://example.com/login" />
            </div>
            <div class="field">
                <label>👤 اسم المستخدم / الإيميل</label>
                <input type="text" id="username" placeholder="admin@example.com" />
            </div>
            <div class="field">
                <label>🔑 كلمة المرور</label>
                <input type="password" id="password" placeholder="••••••••" />
            </div>
            <div class="field">
                <label>🔄 عدد المحاولات</label>
                <select id="retries">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3" selected>3</option>
                    <option value="5">5</option>
                </select>
            </div>
        </div>

        <!-- Options -->
        <div class="card">
            <div class="card-title"><span class="icon">⚙️</span> الخيارات</div>
            <div class="toggles-grid">
                <label class="toggle-item">
                    <span class="label">🤖 Gemini AI</span>
                    <div class="switch"><input type="checkbox" id="opt-gemini" checked /><span class="slider"></span></div>
                </label>
                <label class="toggle-item">
                    <span class="label">🔓 حل كابتشا</span>
                    <div class="switch"><input type="checkbox" id="opt-captcha" /><span class="slider"></span></div>
                </label>
                <label class="toggle-item">
                    <span class="label">🌐 بروكسي</span>
                    <div class="switch"><input type="checkbox" id="opt-proxy" /><span class="slider"></span></div>
                </label>
                <label class="toggle-item">
                    <span class="label">🚫 حظر موارد</span>
                    <div class="switch"><input type="checkbox" id="opt-block" checked /><span class="slider"></span></div>
                </label>
            </div>
        </div>

        <!-- API Keys + Proxy -->
        <div class="card" id="advanced-card">
            <div class="card-title"><span class="icon">🔧</span> إعدادات متقدمة</div>
            <div class="field">
                <label>🤖 Gemini API Key</label>
                <input type="password" id="gemini-key" placeholder="AIzaSy..." />
            </div>
            <div class="field">
                <label>🔓 2Captcha API Key</label>
                <input type="password" id="captcha-key" placeholder="مفتاح 2Captcha" />
            </div>
            <div class="field">
                <label>🌐 قائمة البروكسيات (سطر لكل بروكسي: server|user|pass)</label>
                <textarea id="proxy-list" placeholder="http://ip:port|user|pass&#10;socks5://ip:port|user|pass"></textarea>
            </div>
        </div>

        <!-- Action Button -->
        <button class="btn-primary" id="btn-start" onclick="startLogin()">
            <span class="btn-text">🚀 ابدأ تسجيل الدخول</span>
            <span class="spinner"></span>
        </button>
        <button class="btn-stop" id="btn-stop" onclick="stopLogin()">⛔ إيقاف</button>
    </div>

    <!-- ═══════════ RIGHT PANEL ═══════════ -->
    <div style="display:flex;flex-direction:column;gap:1.5rem;">

        <!-- Progress -->
        <div class="card">
            <div class="card-title"><span class="icon">📊</span> التقدم</div>

            <div class="status-bar">
                <span class="pulse-dot" id="status-dot" style="display:none"></span>
                <span id="status-text">جاهز</span>
            </div>

            <div class="progress-wrap" id="progress-wrap">
                <div class="progress-label">
                    <span id="progress-label">بدء...</span>
                    <span id="progress-pct">0%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill"></div>
                </div>
            </div>

            <!-- Result -->
            <div class="result-card" id="result-card">
                <div class="result-title" id="result-title"></div>
                <div class="result-grid" id="result-grid"></div>
            </div>
        </div>

        <!-- Console -->
        <div class="card" style="flex:1">
            <div class="card-title">
                <span class="icon">🖥️</span> سجل العمليات
                <span style="margin-right:auto"></span>
                <button onclick="clearConsole()" style="
                    background:var(--bg-secondary);border:1px solid var(--border);
                    color:var(--text-muted);padding:.25rem .6rem;border-radius:6px;
                    font-size:.72rem;cursor:pointer;">مسح</button>
            </div>
            <div class="console" id="console">
                <div class="log-line info">
                    <span class="log-time">[--:--:--]</span>
                    ⚡ جاهز للعمل — أدخل البيانات واضغط ابدأ
                </div>
            </div>
        </div>

    </div>
</div>

<!-- ═══════════ Footer ═══════════ -->
<div class="footer">
    ⚡ Ultra-Fast Login Bot v4.0 — Playwright · Stealth · Gemini AI · 2Captcha · Proxy Rotation
</div>

<!-- ═══════════ JavaScript ═══════════ -->
<script>

// ═══════════ State ═══════════
let ws = null;
let sessionId = null;
let isRunning = false;

// ═══════════ Helpers ═══════════

function $(id) { return document.getElementById(id); }

function timeNow() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function appendLog(text, level = 'info') {
    const c = $('console');
    const div = document.createElement('div');
    div.className = `log-line ${level}`;
    div.innerHTML = `<span class="log-time">[${timeNow()}]</span> ${escapeHtml(text)}`;
    c.appendChild(div);
    c.scrollTop = c.scrollHeight;
}

function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

function clearConsole() {
    $('console').innerHTML = '';
    appendLog('🧹 تم مسح السجل', 'info');
}

function setProgress(pct, label) {
    $('progress-wrap').classList.add('active');
    $('progress-fill').style.width = pct + '%';
    $('progress-pct').textContent = pct + '%';
    if (label) $('progress-label').textContent = label;
}

function setStatus(text, active = true) {
    $('status-text').textContent = text;
    $('status-dot').style.display = active ? 'inline-block' : 'none';
}

function showResult(data) {
    const card = $('result-card');
    const grid = $('result-grid');
    const title = $('result-title');

    card.className = 'result-card show ' + (data.success ? 'success-result' : 'fail-result');
    title.textContent = data.success ? '✅ تم تسجيل الدخول بنجاح!' : '❌ فشل تسجيل الدخول';
    title.style.color = data.success ? 'var(--success)' : 'var(--error)';

    const items = [
        ['الحالة', data.status],
        ['الطريقة', data.method || '—'],
        ['الزمن', data.elapsed],
        ['البروكسي', data.proxy_used || 'direct'],
        ['العنوان', data.page_title || '—'],
        ['الكوكيز', data.cookies_count ?? 0],
        ['الرابط بعد الدخول', data.url_after_login || '—'],
        ['الخطأ', data.error || 'لا يوجد'],
    ];

    grid.innerHTML = items.map(([k, v]) =>
        `<div class="result-item">${k}<strong>${escapeHtml(String(v))}</strong></div>`
    ).join('');
}

function setUIRunning(running) {
    isRunning = running;
    $('btn-start').disabled = running;
    $('btn-start').classList.toggle('loading', running);
    $('btn-stop').style.display = running ? 'block' : 'none';
    setStatus(running ? 'قيد التشغيل...' : 'جاهز', running);
}

// ═══════════ WebSocket ═══════════

function connectWS() {
    sessionId = crypto.randomUUID?.() || Date.now().toString(36);
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws/${sessionId}`);

    ws.onopen = () => {
        appendLog('🔌 متصل بالخادم', 'success');
    };

    ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        switch (msg.type) {
            case 'log':
                appendLog(msg.data.text, msg.data.level || 'info');
                break;

            case 'progress':
                setProgress(msg.data.pct, msg.data.label);
                break;

            case 'result':
                showResult(msg.data);
                setUIRunning(false);
                if (msg.data.success) {
                    appendLog('🎉 العملية انتهت بنجاح!', 'success');
                } else {
                    appendLog('❌ العملية انتهت بفشل: ' + (msg.data.error || ''), 'error');
                }
                break;
        }
    };

    ws.onclose = () => {
        appendLog('🔌 انقطع الاتصال — إعادة الاتصال...', 'warn');
        setUIRunning(false);
        setTimeout(connectWS, 2000);
    };

    ws.onerror = () => {
        appendLog('❌ خطأ في الاتصال', 'error');
    };
}

// ═══════════ Actions ═══════════

function startLogin() {
    const url = $('url').value.trim();
    const username = $('username').value.trim();
    const password = $('password').value.trim();

    if (!url || !username || !password) {
        appendLog('⚠️ يرجى ملء جميع الحقول المطلوبة!', 'warn');
        return;
    }

    // Reset
    $('result-card').className = 'result-card';
    setProgress(0, 'بدء...');
    setUIRunning(true);

    appendLog('━'.repeat(50), 'info');
    appendLog(`🚀 بدء تسجيل الدخول إلى: ${url}`, 'info');

    const payload = {
        action: 'login',
        url: url,
        username: username,
        password: password,
        retries:      parseInt($('retries').value),
        use_gemini:   $('opt-gemini').checked,
        use_captcha:  $('opt-captcha').checked,
        use_proxy:    $('opt-proxy').checked,
        gemini_key:   $('gemini-key').value.trim(),
        captcha_key:  $('captcha-key').value.trim(),
        proxy_list:   $('proxy-list').value.trim(),
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
    } else {
        appendLog('❌ غير متصل بالخادم!', 'error');
        setUIRunning(false);
    }
}

function stopLogin() {
    if (ws) {
        ws.close();
        appendLog('⛔ تم إيقاف العملية', 'warn');
        setUIRunning(false);
        setTimeout(connectWS, 500);
    }
}

// ═══════════ Init ═══════════

window.addEventListener('DOMContentLoaded', () => {
    connectWS();
});

</script>
</body>
</html>
"""


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  ▶️  التشغيل
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == "__main__":
    print()
    print("  ╔══════════════════════════════════════════╗")
    print("  ║  ⚡ Ultra-Fast Login Bot v4.0 — Web      ║")
    print("  ║  🌐 http://localhost:8000                ║")
    print("  ╚══════════════════════════════════════════╝")
    print()

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )