# استبدال النيش يدوياً (بدون API — Trial n8n)

## النيش الجديد (انسخه)

```
AI Workflow & Automation for Business - Make.com n8n Zapier no-code tutorials
```

---

## 1) Variables (دقيقة واحدة)

https://darkvault.app.n8n.cloud/variables

| Key | Value |
|-----|--------|
| `CHANNEL_NICHE` | النص أعلاه (احذف أي نص قديم عن mystery/stories) |

إن لم يوجد `CHANNEL_NICHE` → Add variable.

---

## 2) Workflow — Import (الطريقة الأسرع)

1. https://darkvault.app.n8n.cloud/workflow/G9fZzsrIjzJpPkwS
2. ⋮ → **Import from File**
3. الملف:

```
c:\Users\admin\.cursor\n8n-youtube-automation\workflows\02-video-production-pipeline.json
```

4. **Replace** → **Save**

(إن عندك workflow 01 منفصل: استورد `01-daily-topic-discovery.json` أيضاً)

---

## 3) إن لم تستطع Import — عقدة Load Config فقط

1. افتح عقدة **Load Config**
2. حقل **niche** → الصق النص الجديد
3. كل `$env.` → `$vars.`
4. Save

---

## 4) Google Sheet Queue

احذف صفوف المواضيع القديمة (قصص). أضف مثلاً:

- `How to automate email with Make.com`
- `n8n beginner: ChatGPT to Google Sheets`
- `status` = `pending`

---

## 5) Test

Manual Trigger → Test workflow
