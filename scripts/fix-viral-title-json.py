#!/usr/bin/env python3
"""Patch Generate Viral Title jsonBody to a runtime-safe format."""
import json
import sys
from pathlib import Path

# Multiline template mode (fx OFF) — same format as other working OpenAI nodes
VIRAL_TITLE_JSON_BODY = (
    '={\n'
    '  "model": "gpt-4o",\n'
    '  "temperature": 0.85,\n'
    '  "response_format": { "type": "json_object" },\n'
    '  "messages": [\n'
    '    { "role": "system", "content": "Return JSON with viral_title and hook_text fields." },\n'
    '    { "role": "user", "content": "Topic: {{ $(\'Init Video Job\').first().json.topic }}. Write a viral YouTube title for an AI automation channel." }\n'
    '  ]\n'
    '}'
)

# Expression mode (fx ON) — single-line fallback if template mode still fails
VIRAL_TITLE_RAW_BODY = (
    '={{ JSON.stringify({ model: "gpt-4o", temperature: 0.85, '
    'response_format: { type: "json_object" }, messages: ['
    '{ role: "system", content: "Return JSON with viral_title and hook_text." }, '
    '{ role: "user", content: "Topic: " + ($("Init Video Job").first().json.topic || "automation") + ". Write viral YouTube title." }'
    '] }) }}'
)


def patch_workflow(path: Path, mode: str = "json") -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = 0
    for node in data.get("nodes", []):
        if node.get("name") != "Generate Viral Title":
            continue
        params = node.setdefault("parameters", {})
        if mode == "raw":
            params["specifyBody"] = "string"
            params["body"] = VIRAL_TITLE_RAW_BODY
            params.pop("jsonBody", None)
        else:
            params["specifyBody"] = "json"
            params["jsonBody"] = VIRAL_TITLE_JSON_BODY
            params.pop("body", None)
        changed += 1
        print(f"Patched: {path} (mode={mode})")
    if not changed:
        print(f"No Generate Viral Title node in {path}", file=sys.stderr)
        return 1
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    targets = [
        Path(r"c:\Users\admin\Downloads\YouTube Automation - FIXED.json"),
        Path(__file__).resolve().parent.parent / "workflows" / "02-video-production-pipeline.json",
    ]
    mode = sys.argv[1] if len(sys.argv) > 1 else "json"
    rc = 0
    for t in targets:
        if t.exists():
            rc = patch_workflow(t, mode) or rc
    sys.exit(rc)
