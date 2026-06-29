# Qwen AI Chat

موقع ذكاء اصطناعي باللغة العربية يستخدم نموذج Qwen عبر OpenRouter API.

## الإعداد (Setup)

1. تثبيت المتطلبات (Install dependencies):
```bash
npm install
```

2. إنشاء ملف `.env` (Create `.env` file):
قم بنسخ ملف `.env.example` إلى `.env` وضع مفتاح الـ API الخاص بك:
```bash
cp .env.example .env
```
أو قم بإنشاء الملف مباشرة وإضافة:
```
OPENROUTER_API_KEY=sk-or-v1-...
```

3. تشغيل الخادم (Run the server):
```bash
npm start
```
أو
```bash
node server.js
```

4. تصفح الموقع:
افتح `http://localhost:3000` في متصفحك.
