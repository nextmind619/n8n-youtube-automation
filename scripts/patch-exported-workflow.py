#!/usr/bin/env python3
"""Patch exported n8n workflow: niche + $env -> $vars."""
import json
import re
from pathlib import Path

NICHE = "AI Workflow & Automation for Business - Make.com n8n Zapier no-code tutorials"

TEXT_REPLACEMENTS = [
    ("=={{", "={{"),
    ("$('Fetch Reddit Hot')", "$('Fetch Reddit n8n')"),
    ("Fetch Reddit Hot", "Fetch Reddit n8n"),
    (
        "const delayMinutes = parseInt($vars.BATCH_DELAY_MINUTES || '72', 10);",
        "const delayMinutes = 72;",
    ),
    ("sheetId: $vars.GOOGLE_SHEETS_DOCUMENT_ID", "sheetId: '1iroszMZekztryhZ9djZ2IGcv6QRRm_o-EAMR6j1UPh0'"),
    ("errorsTab: $vars.GOOGLE_SHEETS_ERRORS_TAB || 'Errors'", "errorsTab: 'Errors'"),
    ("queueTab: $vars.GOOGLE_SHEETS_QUEUE_TAB || 'Queue'", "queueTab: 'Queue'"),
    ("logsTab: $vars.GOOGLE_SHEETS_LOGS_TAB || 'Logs'", "logsTab: 'Logs'"),
    ("process.env.BATCH_DELAY_MINUTES", "72"),
    ("process.env.GOOGLE_SHEETS", "$vars.GOOGLE_SHEETS"),
    ("$env.", "$vars."),
    ("YOUTUBE_DEFAULT_PRIVACY || 'public'", "YOUTUBE_DEFAULT_PRIVACY || 'unlisted'"),
    ("mystery unsolved stories paranormal cold cases", NICHE),
    ("mystery unsolved stories", NICHE),
    ("UnresolvedMysteries", "n8n"),
    ("unsolved+mystery+cold+case", "make.com+n8n+zapier+AI+automation+workflow"),
    (
        "You are a YouTube trend researcher for mystery/unsolved story channels",
        "You are a YouTube trend researcher for English faceless AI workflow automation channels (Make.com, n8n, Zapier)",
    ),
    ("unique trending mystery topics", "unique tutorial topics for automation/AI business"),
    ("overly sensitive real-victim content", "duplicate or off-topic content"),
    (
        "You write viral YouTube titles for mystery channels",
        "You write high-CTR searchable YouTube titles for AI automation tutorial channels",
    ),
    ("Use curiosity gap framing", "Prefer How to / Best / X vs Y / Automate titles"),
    ("Cinematic mystery mood, no text in images", "Modern tech explainer, abstract dashboards, no readable text"),
    ("dark mystery atmosphere", "modern SaaS tech explainer, clean lighting"),
    ("Mystery channel style, dramatic lighting, single focal subject", "Tech tutorial thumbnail, automation theme, not horror"),
    ("Hook, background, evidence, theories, conclusion", "Hook, steps (Make/n8n), recap, CTA for tools in description"),
    ("YOUTUBE_DEFAULT_CATEGORY || 24", "YOUTUBE_DEFAULT_CATEGORY || 28"),
    ("Write 60-second YouTube Shorts scripts", "Write 60-second YouTube Shorts tutorial scripts"),
    ("Write 10-minute narration", "Write 8-10 minute faceless tutorial narration"),
]


def walk(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str):
                s = v
                for old, new in TEXT_REPLACEMENTS:
                    s = s.replace(old, new)
                obj[k] = s
            else:
                walk(v)
    elif isinstance(obj, list):
        for item in obj:
            walk(item)


def fix_connection_keys(connections: dict) -> None:
    """Rename connection keys when node names were renamed."""
    renames = {"Fetch Reddit Hot": "Fetch Reddit n8n"}
    for old, new in renames.items():
        if old in connections and new not in connections:
            connections[new] = connections.pop(old)


def patch_file(src: Path, dst: Path) -> None:
    data = json.loads(src.read_text(encoding="utf-8"))
    walk(data)
    if "connections" in data:
        fix_connection_keys(data["connections"])
    data["name"] = "AI Workflow Automation for Business"
    dst.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Patched: {dst}")
    print(f"Nodes: {len(data.get('nodes', []))}")


if __name__ == "__main__":
    src = Path(r"c:\Users\admin\Downloads\YouTube Automation.json")
    dst = src.parent / "YouTube Automation - FIXED.json"
    patch_file(src, dst)
