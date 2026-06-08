#!/usr/bin/env python3
"""Audit n8n workflow JSON for broken references and Cloud issues."""
import json
import re
from pathlib import Path

WORKFLOW = Path(r"c:\Users\admin\Downloads\YouTube Automation - FIXED.json")


def main() -> None:
    data = json.loads(WORKFLOW.read_text(encoding="utf-8"))
    names = {n["name"] for n in data["nodes"]}
    issues: list[str] = []

    for n in data["nodes"]:
        blob = json.dumps(n.get("parameters", {}))
        if "$env." in blob:
            issues.append(f"[ENV] {n['name']}: uses $env (blocked on Cloud)")
        if "process.env" in blob:
            issues.append(f"[ENV] {n['name']}: uses process.env")
        if "Fetch Reddit Hot" in blob:
            issues.append(f"[NAME] {n['name']}: references Fetch Reddit Hot")
        if "=={{" in blob:
            issues.append(f"[EXPR] {n['name']}: double equals =={{ in expression")
        if "mystery" in blob.lower() and n["name"] not in ("",):
            issues.append(f"[NICHE] {n['name']}: still has mystery text")

    refs = set()
    for n in data["nodes"]:
        blob = json.dumps(n.get("parameters", {}))
        refs.update(re.findall(r"\$\('([^']+)'\)", blob))

    missing = sorted(refs - names)
    for m in missing:
        issues.append(f"[REF] Referenced node missing: {m}")

    conn = data.get("connections", {})
    for key in conn:
        if key not in names:
            issues.append(f"[CONN] Connection key not a node: {key}")
        for outs in conn[key].get("main", []) or []:
            for link in outs or []:
                if link.get("node") not in names:
                    issues.append(f"[CONN] {key} -> unknown node {link.get('node')}")

    # Code node $vars without expression wrapper
    for n in data["nodes"]:
        code = n.get("parameters", {}).get("jsCode", "")
        if code and re.search(r"(?<!=)\$vars\.", code):
            issues.append(f"[CODE] {n['name']}: $vars in jsCode (may fail; use literal or pass via Set)")

    print(f"Workflow: {data.get('name')}")
    print(f"Nodes: {len(names)}")
    if issues:
        print(f"\nIssues ({len(issues)}):")
        for i in issues:
            print(f"  - {i}")
    else:
        print("\nNo structural issues found.")
    print("\nAll node names:")
    for name in sorted(names):
        print(f"  - {name}")


if __name__ == "__main__":
    main()
