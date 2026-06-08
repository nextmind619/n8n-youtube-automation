#!/usr/bin/env python3
import json
from pathlib import Path

p = Path(r"c:\Users\admin\Downloads\YouTube Automation - FIXED.json")
data = json.loads(p.read_text(encoding="utf-8"))

for n in data["nodes"]:
    if n["name"] == "Normalize Error Payload":
        code = n["parameters"]["jsCode"]
        code = code.replace(
            "sheetId: $vars.GOOGLE_SHEETS_DOCUMENT_ID",
            "sheetId: '1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0'",
        )
        code = code.replace(
            "errorsTab: $vars.GOOGLE_SHEETS_ERRORS_TAB || 'Errors'",
            "errorsTab: 'Errors'",
        )
        code = code.replace(
            "queueTab: $vars.GOOGLE_SHEETS_QUEUE_TAB || 'Queue'",
            "queueTab: 'Queue'",
        )
        code = code.replace(
            "logsTab: $vars.GOOGLE_SHEETS_LOGS_TAB || 'Logs'",
            "logsTab: 'Logs'",
        )
        n["parameters"]["jsCode"] = code
    if n["name"] == "Load Config1":
        for a in n["parameters"]["assignments"]["assignments"]:
            v = a.get("value", "")
            if isinstance(v, str):
                a["value"] = v.replace("=={{", "={{").replace("\n", "")

p.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
print("OK:", p)
