# فحص العقد — AI Workflow Automation for Business

تم فحص ملف `YouTube Automation - FIXED.json` (61 عقدة).  
**لا أستطيع تشغيل n8n Cloud من هنا** — التأكيد النهائي يحتاج استيراد الملف + تنفيذ يدوي.

---

## 1) استيراد النسخة المُصلَحة (مهم)

1. https://darkvault.app.n8n.cloud/workflow/G9fZzsrIjzJpPkwS  
2. ⋮ → **Import from File**  
3. الملف: `c:\Users\admin\Downloads\YouTube Automation - FIXED.json`  
4. **Save**  
5. أعد ربط **Google Sheets account** و **YouTube** إن طُلب

---

## 2) ما تم إصلاحه في الملف (تلقائياً)

| المشكلة | الحالة في FIXED.json |
|---------|----------------------|
| `$env` محظور على Cloud | ✅ كل التعبيرات `$vars` |
| `Fetch Reddit Hot` غير موجود | ✅ `Fetch Reddit n8n` |
| `Load Config1` بصيغة `=={{` | ✅ `={{` |
| `Build Queue Items` و `$vars` في Code | ✅ `delayMinutes = 72` |
| `Normalize Error Payload` | ✅ sheet ID ثابت |
| اتصالات Reddit | ✅ مفتاح `Fetch Reddit n8n` |

---

## 3) Variables (يجب أن تكون في n8n)

https://darkvault.app.n8n.cloud/variables

```
GOOGLE_SHEETS_DOCUMENT_ID=1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0
CHANNEL_NICHE=AI Workflow & Automation for Business - Make.com n8n Zapier no-code tutorials
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
CREATOMATE_API_KEY=...
CREATOMATE_SHORT_TEMPLATE_ID=...
CREATOMATE_LONG_TEMPLATE_ID=...
YOUTUBE_DEFAULT_CATEGORY=28
YOUTUBE_DEFAULT_PRIVACY=unlisted
WORKFLOW_ERROR_HANDLER_ID=G9fZzsrIjzJpPkwS
```

---

## 4) Credentials (مرة واحدة)

| Credential | العقد التي تحتاجه |
|------------|-------------------|
| Google Sheets account | كل عقد Sheets (11) |
| YouTube OAuth | Upload Short / Long |
| OpenAI (Header Auth) | OpenAI Curate + Generate * |
| ElevenLabs (Header) | ElevenLabs Short/Long |
| Creatomate (Bearer) | Render + Poll |

---

## 5) اختبار كل مسار

### مسار A — اكتشاف مواضيع (Daily 6AM)

```
Daily 6AM → Load Config → Fetch Reddit n8n + Fetch Google News RSS
→ Merge Topic Sources → OpenAI Curate Topics → Build Queue Items
→ Write Queue to Sheets → Log Success
```

**تشغيل:** Execute workflow من **Daily 6AM Trigger**  
**نجاح:** صفوف جديدة في تبويب **Queue** بحالة `pending`

### مسار B — إنتاج فيديو (Manual)

```
Manual → Load Config1 → Get Next Pending Item → Has Processable Item?
→ Init Video Job → … → Upload YouTube → Save Content → Mark Queue Completed
```

**قبل التشغيل:** صف `pending` في Queue  
**تشغيل:** **Manual Trigger**  
**نجاح:** فيديو على YouTube + صف في **Content**

### مسار C — أخطاء (اختياري)

- **Sub-Workflow Trigger**: تحذير فارغ — يمكن تركه  
- **Call Error Handler**: يحتاج `WORKFLOW_ERROR_HANDLER_ID`

---

## 6) عقد تحتاج خدمات خارجية (تفشل بدون مفاتيح)

| العقدة | الخدمة |
|--------|--------|
| OpenAI Curate Topics, Generate * | OpenAI API + رصيد |
| ElevenLabs * | ElevenLabs |
| Generate Thumbnail Image | DALL-E / OpenAI |
| Render * Creatomate, Poll * | Creatomate + قوالب |
| Upload * YouTube | YouTube OAuth |
| Runway Video Gen (Optional) | اختياري — يمكن تعطيله |

---

## 7) إن فشل تنفيذ بعد الاستيراد

1. **Executions** → آخر تشغيل → العقدة الحمراء  
2. راجع الجدول:

| رسالة الخطأ | الإجراء |
|-------------|---------|
| `access to env vars denied` | Load Config لا يزال `$env` — استورد FIXED من جديد |
| `Referenced node doesn't exist` | Merge Topic Sources → `Fetch Reddit n8n` |
| `Unauthorized` OpenAI | أضف `OPENAI_API_KEY` في Variables + Credential |
| Creatomate / template | أضف template IDs |
| Sheets | OAuth + تبويبات Queue/Content |

---

## 8) سكربت الفحص المحلي

```powershell
py c:\Users\admin\.cursor\n8n-youtube-automation\scripts\audit-workflow.py
```

يجب: `No structural issues found.`
