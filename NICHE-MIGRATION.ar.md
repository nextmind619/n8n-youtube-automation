# تحويل النيش → AI Workflow & Automation for Business

تم تحديث المشروع من **قصص/ألغاز** إلى **شروحات أتمتة AI للأعمال** (Make.com, n8n, Zapier).

## ما الذي تغيّر؟

| المكوّن | قبل | بعد |
|---------|-----|-----|
| `CHANNEL_NICHE` | mystery stories | AI workflow automation tutorials |
| Workflow 01 | r/UnresolvedMysteries | r/n8n + أخبار AI automation + مواضيع seed |
| Workflow 02 | سكربت قصص + مشاهد dark | tutorial + مشاهد tech + SEO affiliate |
| YouTube category | 24 Entertainment | 28 Science & Technology |

## خطأ شائع: `access to env vars denied`

على **n8n Cloud** العقدة `Load Config` يجب أن تستخدم `$vars.NAME` وليس `$env.NAME`.

- `$vars` = Variables من صفحة https://darkvault.app.n8n.cloud/variables (ما أضفته)
- `$env` = متغيرات السيرفر — **محظورة** على Cloud

الملف `02-video-production-pipeline.json` محدّث لاستخدام `$vars`. أعد استيراده بعد الإصلاح.

## تطبيق التغيير على n8n (مهم)

1. افتح: https://darkvault.app.n8n.cloud/variables  
   - عيّن `CHANNEL_NICHE` كما في `config/env.example`

2. أعد استيراد الـ workflows:

```powershell
cd c:\Users\admin\.cursor\n8n-youtube-automation
.\scripts\import-workflows.ps1
```

أو يدوياً: استبدل workflows 01 و 02 من مجلد `workflows/` في n8n.

3. **فعّل** workflows بعد الاستيراد.

4. امسح صفوف Queue القديمة (مواضيع قصص) أو غيّر `status` إلى `cancelled`.

5. اختبر: أضف في Queue:
   - `topic`: `How to automate email with Make.com`
   - `status`: `pending`

## ملاحظة جودة المحتوى

الأتمتة تنتج فيديوهات **شرائح + صوت AI** (Creatomate). لشروحات Make/n8n الأقوى للـ affiliate، أضف لاحقاً تسجيل شاشة حقيقي (هجين).
