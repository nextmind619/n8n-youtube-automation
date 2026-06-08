#!/usr/bin/env python3
"""Replace Generate Viral Title HTTP Request with Code node."""
import json
from pathlib import Path

VIRAL_TITLE_CODE = """const job = $('Init Video Job').first().json;
const model = job.openaiModel || $vars.OPENAI_MODEL || 'gpt-4o';
const topic = job.topic || 'AI automation';
const niche = job.niche || $vars.CHANNEL_NICHE || '';

const response = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://api.openai.com/v1/chat/completions',
  headers: {
    Authorization: 'Bearer ' + $vars.OPENAI_API_KEY,
    'Content-Type': 'application/json',
  },
  body: {
    model,
    temperature: 0.85,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Return JSON with viral_title and hook_text fields.' },
      { role: 'user', content: 'Topic: ' + topic + '\\nNiche: ' + niche + '\\nWrite a viral YouTube title for an AI automation channel.' },
    ],
  },
  json: true,
});

return [{ json: response }];"""

TARGETS = [
    Path(r"c:\Users\admin\Downloads\YouTube Automation - FIXED.json"),
    Path(__file__).resolve().parent.parent / "workflows" / "02-video-production-pipeline.json",
]

EXPORT_COPY = (
    Path(__file__).resolve().parent.parent
    / "workflows"
    / "YouTube-Automation-VIRAL-TITLE-FIX.json"
)


def patch(path: Path) -> bool:
    data = json.loads(path.read_text(encoding="utf-8"))
    found = False
    for i, node in enumerate(data.get("nodes", [])):
        if node.get("name") != "Generate Viral Title":
            continue
        if node.get("type") == "n8n-nodes-base.code":
            node["parameters"] = {"jsCode": VIRAL_TITLE_CODE}
            found = True
            break
        pos = node.get("position", [0, 0])
        node_id = node.get("id")
        data["nodes"][i] = {
            "parameters": {"jsCode": VIRAL_TITLE_CODE},
            "id": node_id,
            "name": "Generate Viral Title",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": pos,
        }
        found = True
        break
    if not found:
        print(f"SKIP (node missing): {path}")
        return False
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: {path}")
    return True


def main() -> None:
    patched = None
    for t in TARGETS:
        if t.exists() and patch(t):
            patched = t
    if patched:
        EXPORT_COPY.write_text(patched.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"EXPORT: {EXPORT_COPY}")


if __name__ == "__main__":
    main()
