# ابدأ هنا — 3 خطوات فقط (الباقي آلي)

## ما تم إعداده لك تلقائياً

| العنصر | القيمة |
|--------|--------|
| n8n | https://darkvault.app.n8n.cloud |
| Google Sheet | https://docs.google.com/spreadsheets/d/1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0/edit |
| Spreadsheet ID | `1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0` |
| Workflows JSON | مجلد `workflows/` (3 ملفات) |
| سكربت Sheets | `scripts/setup-google-sheets.gs` |
| سكربت الإعداد | `scripts/setup-all.ps1` |

---

## ⚠️ لماذا لا أستطيع إكمال 100% بدونك؟

هذه الخطوات **تتطلب حسابك وكلمة مرورك** — لا يمكن لأي برنامج خارجي تنفيذها:

- تسجيل الدخول إلى Google / OpenAI / ElevenLabs
- OAuth (الموافقة على "Allow" في Google)
- إنشاء API Keys من حساباتك

---

## ✅ 3 خطوات فقط عليك — الباقي سكربت

### الخطوة 1 — Google Sheet (30 ثانية)

1. افتح: https://docs.google.com/spreadsheets/d/1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0/edit
2. **Extensions → Apps Script**
3. احذف الكود → الصق من: `scripts/setup-google-sheets.gs`
4. **Run → setupAllSheets → Allow**

---

### الخطوة 2 — مفتاح n8n API (1 دقيقة)

1. افتح: https://darkvault.app.n8n.cloud/settings/api
2. **Create API Key**
3. افتح `config/secrets.env`
4. الصق المفتاح: `N8N_API_KEY=...`
5. أضف أيضاً (إن وُجدت):
   - `OPENAI_API_KEY=sk-...`
   - `ELEVENLABS_API_KEY=...`
   - `CREATOMATE_API_KEY=...`

---

### الخطوة 3 — شغّل السكربت

```powershell
cd c:\Users\admin\.cursor\n8n-youtube-automation
.\scripts\setup-all.ps1
```

**السكربت يقوم تلقائياً بـ:**
- ✅ استيراد 3 workflows إلى n8n
- ✅ ربط Error Handler
- ✅ فتح كل روابط الإعداد في المتصفح

---

## بعد السكربت — OAuth (مرة واحدة)

1. https://darkvault.app.n8n.cloud/home/credentials
2. **Google Sheets OAuth2** → Sign in with Google
3. **YouTube OAuth2** → Sign in with Google

Google Cloud (قبل OAuth):
- https://console.cloud.google.com/apis/credentials

---

## Variables في n8n

https://darkvault.app.n8n.cloud/variables

```
GOOGLE_SHEETS_DOCUMENT_ID=1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0
CHANNEL_NICHE=AI workflow automation for small business - Make.com n8n Zapier no-code tutorials
YOUTUBE_DEFAULT_CATEGORY=28
YOUTUBE_TAGS=automation,n8n,make.com,zapier,no-code,ai tools,workflow,small business
WORKFLOW_ERROR_HANDLER_ID=[من output السكربت]
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
CREATOMATE_API_KEY=...
```

---

## اختبار

1. أضف صفاً في Queue (status=pending)
2. https://darkvault.app.n8n.cloud/home/workflows → **02 Video Production** → Test

---

**أرسل لي `N8N_API_KEY` (في chat خاص/آمن) أو الصقه في secrets.env وشغّل setup-all.ps1**
