# دليل التشغيل خطوة بخطوة (مع كل الروابط)
## نظام أتمتة يوتيوب للألغاز — n8n

> **المدة التقديرية:** 2–4 ساعات للإعداد الأول  
> **المجلد:** `n8n-youtube-automation/`

---

## فهرس الروابط السريع

| الخدمة | الرابط المباشر |
|--------|----------------|
| n8n Cloud — تسجيل | https://app.n8n.cloud/register |
| n8n Cloud — دخول | https://app.n8n.cloud/login |
| n8n Docs | https://docs.n8n.io/ |
| Docker Desktop | https://www.docker.com/products/docker-desktop/ |
| Google Sheets (جدول جديد) | https://sheets.google.com/create |
| Google Cloud Console | https://console.cloud.google.com/ |
| Google Sheets API | https://console.cloud.google.com/apis/library/sheets.googleapis.com |
| YouTube Data API v3 | https://console.cloud.google.com/apis/library/youtube.googleapis.com |
| OAuth Consent Screen | https://console.cloud.google.com/apis/credentials/consent |
| OAuth Credentials | https://console.cloud.google.com/apis/credentials |
| OpenAI — مفاتيح API | https://platform.openai.com/api-keys |
| OpenAI — الفوترة | https://platform.openai.com/settings/organization/billing/overview |
| ElevenLabs — تسجيل | https://elevenlabs.io/sign-up |
| ElevenLabs — API Keys | https://elevenlabs.io/app/settings/api-keys |
| ElevenLabs — مكتبة الأصوات | https://elevenlabs.io/voice-library |
| Creatomate — تسجيل | https://app.creatomate.com/signup |
| Creatomate — القوالب | https://app.creatomate.com/templates |
| Creatomate — API Keys | https://app.creatomate.com/settings/api-keys |
| YouTube Studio | https://studio.youtube.com/ |
| Reddit (مصدر المواضيع) | https://www.reddit.com/r/n8n/ |

---

## المرحلة 0 — ما تحتاجه قبل البدء

| # | الخدمة | الرابط | التكلفة |
|---|--------|--------|---------|
| 1 | n8n Cloud | https://app.n8n.cloud/register | مجاني / مدفوع |
| 2 | OpenAI | https://platform.openai.com/signup | ~$5+ رصيد |
| 3 | ElevenLabs | https://elevenlabs.io/sign-up | مجاني / مدفوع |
| 4 | Creatomate | https://app.creatomate.com/signup | تجربة مجانية |
| 5 | Google Cloud | https://console.cloud.google.com/projectcreate | مجاني |
| 6 | Google Sheets | https://sheets.google.com/create | مجاني |
| 7 | YouTube Studio | https://studio.youtube.com/ | مجاني |
| 8 | Docker (self-hosted) | https://www.docker.com/products/docker-desktop/ | مجاني |

---

## المرحلة 1 — تثبيت n8n

### الخطوة 1.1 — n8n Cloud (أسهل)

1. افتح: https://app.n8n.cloud/register
2. أو دخول: https://app.n8n.cloud/login
3. أنشئ workspace جديداً
4. لوحة التحكم: https://app.n8n.cloud/

### الخطوة 1.2 — Self-hosted (20 فيديو/يوم)

1. Docker: https://www.docker.com/products/docker-desktop/
2. صورة n8n: https://hub.docker.com/r/n8nio/n8n
3. وثائق: https://docs.n8n.io/hosting/installation/docker/
4. شغّل Docker ثم:

```bash
docker run -d --name n8n -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
```

5. افتح: http://localhost:5678

### الخطوة 1.3 — التحقق

- [ ] n8n Cloud: https://app.n8n.cloud/
- [ ] أو Self-hosted: http://localhost:5678
- [ ] إنشاء workflow: https://docs.n8n.io/workflows/create/

---

## المرحلة 2 — Google Sheets

### الخطوة 2.1 — إنشاء الجدول

1. https://sheets.google.com/create
2. سمّه: `YouTube Automation`

### الخطوة 2.2 — الأوراق الأربعة

`Queue` | `Content` | `Errors` | `Logs`

### الخطوة 2.3 — العناوين

انسخ من ملفات CSV في `google-sheets/` أو الصق العناوين من الدليل السابق.

### الخطوة 2.4 — تجميد الصف 1

مساعدة: https://support.google.com/docs/answer/1219578

### الخطوة 2.5 — Spreadsheet ID

من الرابط:
```
https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXX/edit
```
انسخ `XXXXXXXXXXXXXXXX`

---

## المرحلة 3 — Google Cloud

### 3.1 — مشروع جديد

https://console.cloud.google.com/projectcreate

### 3.2 — تفعيل APIs

- Sheets API: https://console.cloud.google.com/apis/library/sheets.googleapis.com → **Enable**
- YouTube API: https://console.cloud.google.com/apis/library/youtube.googleapis.com → **Enable**
- لوحة APIs: https://console.cloud.google.com/apis/dashboard

### 3.3 — OAuth Consent

1. https://console.cloud.google.com/apis/credentials/consent
2. External → Create
3. Scopes:
   - https://www.googleapis.com/auth/spreadsheets
   - https://www.googleapis.com/auth/youtube.upload
4. Test users: أضف Gmail
5. وثائق: https://developers.google.com/identity/protocols/oauth2

### 3.4 — OAuth Client

1. https://console.cloud.google.com/apis/credentials
2. Create Credentials → OAuth client ID → Web application
3. Name: `n8n`
4. Redirect URI — لاحقاً من n8n
5. انسخ Client ID + Secret

---

## المرحلة 4 — OpenAI

### 4.1 — API Key

1. تسجيل: https://platform.openai.com/signup
2. مفاتيح: https://platform.openai.com/api-keys
3. Create new secret key → Name: `n8n-youtube`
4. وثائق: https://platform.openai.com/docs/api-reference

### 4.2 — رصيد

https://platform.openai.com/settings/organization/billing/payment-methods

### 4.3 — Credential في n8n

1. Credentials: https://app.n8n.cloud/home/credentials
2. Add → Header Auth
3. Docs: https://docs.n8n.io/integrations/builtin/credentials/httprequest/
4. Header Name: `Authorization`
5. Header Value: `Bearer sk-...`

---

## المرحلة 5 — ElevenLabs

### 5.1 — API Key

1. https://elevenlabs.io/sign-up
2. https://elevenlabs.io/app/settings/api-keys
3. Docs: https://elevenlabs.io/docs/api-reference/text-to-speech/convert

### 5.2 — Voice ID

1. https://elevenlabs.io/voice-library
2. افتح صوتاً → انسخ Voice ID
3. Voice Lab: https://elevenlabs.io/app/voice-lab

---

## المرحلة 6 — Creatomate

### 6.1 — حساب

https://app.creatomate.com/signup

### 6.2 — قالب Short

1. https://app.creatomate.com/templates → New
2. Docs: https://creatomate.com/docs/template-editor/introduction
3. ملف: `templates/creatomate-short-template.json`
4. انسخ Template ID

### 6.3 — قالب Long

1. https://app.creatomate.com/templates → New
2. ملف: `templates/creatomate-long-template.json`

### 6.4 — API Key

1. https://app.creatomate.com/settings/api-keys
2. Render API: https://creatomate.com/docs/api/reference/introduction
3. Endpoint: https://api.creatomate.com/v1/renders

---

## المرحلة 7 — Google Sheets في n8n

1. Credentials: https://app.n8n.cloud/home/credentials
2. Google Sheets OAuth2 API
3. Docs: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.googlesheets/
4. Client ID/Secret من: https://console.cloud.google.com/apis/credentials
5. انسخ Redirect URL → أضفه في Google OAuth client
6. Sign in with Google → Save

---

## المرحلة 8 — YouTube في n8n

1. Credentials: https://app.n8n.cloud/home/credentials
2. YouTube OAuth2 API
3. Docs: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.youtube/
4. Sign in بحساب مالك القناة
5. YouTube Studio: https://studio.youtube.com/
6. API Docs: https://developers.google.com/youtube/v3/docs

---

## المرحلة 9 — متغيرات البيئة

### فتح الإعدادات

- Variables: https://app.n8n.cloud/variables
- Settings: https://app.n8n.cloud/settings
- Docs: https://docs.n8n.io/hosting/configuration/environment-variables/

### المتغيرات + روابطها

| المتغير | من أين تأخذ القيمة |
|---------|---------------------|
| `GOOGLE_SHEETS_DOCUMENT_ID` | https://sheets.google.com |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| `OPENAI_MODEL` | https://platform.openai.com/docs/models |
| `ELEVENLABS_API_KEY` | https://elevenlabs.io/app/settings/api-keys |
| `ELEVENLABS_VOICE_ID` | https://elevenlabs.io/voice-library |
| `CREATOMATE_API_KEY` | https://app.creatomate.com/settings/api-keys |
| `CREATOMATE_SHORT_TEMPLATE_ID` | https://app.creatomate.com/templates |
| `CREATOMATE_LONG_TEMPLATE_ID` | https://app.creatomate.com/templates |
| `YOUTUBE_DEFAULT_PRIVACY` | `unlisted` للاختبار — https://studio.youtube.com/ |

---

## المرحلة 10 — استيراد Workflows

1. Workflows: https://app.n8n.cloud/home/workflows
2. Import: `workflows/03-error-handler-logging.json` (أولاً)
3. انسخ Workflow ID من: https://app.n8n.cloud/workflow/ABC123XYZ
4. Variables: https://app.n8n.cloud/variables → `WORKFLOW_ERROR_HANDLER_ID`
5. Import: `01-daily-topic-discovery.json` + `02-video-production-pipeline.json`
6. Error handling docs: https://docs.n8n.io/flow-logic/error-handling/
7. Import docs: https://docs.n8n.io/workflows/export-import/
8. فعّل الثلاثة workflows

---

## المرحلة 11 — اختبار أول فيديو

### 11.1 — صف اختبار

1. https://sheets.google.com → Queue
2. `status=pending` | `scheduled_at=2024-01-01T00:00:00Z`

### 11.2 — تشغيل

1. https://app.n8n.cloud/home/workflows → 02 Video Production
2. Test workflow
3. Executions: https://app.n8n.cloud/home/executions

### 11.3 — APIs المستخدمة

| المرحلة | الرابط |
|---------|--------|
| OpenAI Chat | https://api.openai.com/v1/chat/completions |
| DALL-E | https://api.openai.com/v1/images/generations |
| ElevenLabs | https://api.elevenlabs.io/v1/text-to-speech/ |
| Creatomate | https://api.creatomate.com/v1/renders |
| YouTube Upload | https://developers.google.com/youtube/v3/docs/videos/insert |

### 11.4 — التحقق

- [ ] Content + Logs: https://sheets.google.com
- [ ] YouTube: https://studio.youtube.com/channel/UC/videos
- [ ] Shorts: https://studio.youtube.com/channel/UC/shorts
- [ ] Executions: https://app.n8n.cloud/home/executions

---

## المرحلة 12 — التشغيل التلقائي

| Workflow | المصدر | الرابط |
|----------|--------|--------|
| 01 — مواضيع | Reddit | https://www.reddit.com/r/n8n/hot.json |
| 01 — أخبار | Google News RSS | https://news.google.com/rss/search?q=make.com+n8n+zapier+AI+automation+workflow |
| 02 — إنتاج | كل ساعة | https://app.n8n.cloud/home/executions |

---

## المرحلة 13 — المتابعة

| يومياً | الرابط |
|--------|--------|
| n8n Executions | https://app.n8n.cloud/home/executions |
| Google Sheets | https://sheets.google.com |
| YouTube Studio | https://studio.youtube.com/ |
| Analytics | https://studio.youtube.com/channel/UC/analytics/tab-overview/period-default |

| أسبوعياً | الرابط |
|----------|--------|
| OpenAI Usage | https://platform.openai.com/usage |
| OpenAI Billing | https://platform.openai.com/settings/organization/billing/overview |
| ElevenLabs | https://elevenlabs.io/app/subscription |
| Creatomate Billing | https://app.creatomate.com/settings/billing |

---

## حل المشاكل

| المشكلة | الرابط |
|---------|--------|
| OpenAI 401 | https://platform.openai.com/api-keys |
| Sheets 403 | https://console.cloud.google.com/apis/credentials |
| YouTube 403 | https://console.cloud.google.com/apis/library/youtube.googleapis.com |
| OpenAI Status | https://status.openai.com/ |
| n8n Scaling | https://docs.n8n.io/hosting/scaling/queue-mode/ |

---

## Checklist

```
https://app.n8n.cloud/register
https://sheets.google.com/create
https://console.cloud.google.com/projectcreate
https://console.cloud.google.com/apis/library/sheets.googleapis.com
https://console.cloud.google.com/apis/library/youtube.googleapis.com
https://console.cloud.google.com/apis/credentials
https://platform.openai.com/api-keys
https://elevenlabs.io/app/settings/api-keys
https://app.creatomate.com/settings/api-keys
https://app.n8n.cloud/variables
https://app.n8n.cloud/home/workflows
https://studio.youtube.com/
```
