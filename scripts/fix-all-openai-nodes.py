#!/usr/bin/env python3
"""Update Generate Viral Title Code node + attach Header Auth credential."""
import json
from pathlib import Path

CODE_PATH = Path(__file__).resolve().parent.parent / "workflows" / "generate-viral-title-code.js"
TARGET = Path(r"c:\Users\admin\Downloads\YouTube Automation - FIXED.json")
EXPORT = Path(__file__).resolve().parent.parent / "workflows" / "YouTube-Automation-VIRAL-TITLE-FIX.json"


def main() -> None:
    js_code = CODE_PATH.read_text(encoding="utf-8")
    data = json.loads(TARGET.read_text(encoding="utf-8"))
    for node in data.get("nodes", []):
        if node.get("name") != "Generate Viral Title":
            continue
        node["type"] = "n8n-nodes-base.code"
        node["typeVersion"] = 2
        node["parameters"] = {"jsCode": js_code}
        node["credentials"] = {
            "httpHeaderAuth": {
                "id": "Cx2GwShZqOGodlWH",
                "name": "Header Auth account",
            }
        }
        node.pop("retryOnFail", None)
        node.pop("maxTries", None)
        node.pop("waitBetweenTries", None)
        print("Patched Generate Viral Title + credential")
        break
    TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    EXPORT.write_text(TARGET.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"Saved: {TARGET}")


if __name__ == "__main__":
    main()
